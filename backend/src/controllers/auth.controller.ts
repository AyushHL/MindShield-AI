import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export const register = async (req: Request, res: Response, next: NextFunction) => {  
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const newUser = new User({ username, email, passwordHash: password });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ id: user._id, username: user.username, email: user.email, avatar: user.avatar ?? null, createdAt: user.createdAt });
  } catch (error) {
    next(error);
  }
};

export const uploadAvatar = async (req: Request & { user?: any; file?: Express.Multer.File }, res: Response, next: NextFunction) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image file provided' });

    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(req.file.mimetype))
      return res.status(400).json({ message: 'Only JPEG, PNG, GIF and WebP images are allowed' });

    if (req.file.size > 2 * 1024 * 1024)
      return res.status(400).json({ message: 'Image must be smaller than 2 MB' });

    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const user = await User.findByIdAndUpdate(req.user.userId, { avatar: base64 }, { new: true }).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Avatar uploaded', avatar: user.avatar });
  } catch (error) {
    next(error);
  }
};

export const deleteAvatar = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    await User.findByIdAndUpdate(req.user.userId, { avatar: null });
    res.json({ message: 'Avatar removed' });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    const { username, email } = req.body;
    const taken = await User.findOne({ $or: [{ username }, { email }], _id: { $ne: req.user.userId } });
    if (taken) return res.status(400).json({ message: 'Username or email already in use' });

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { username, email },
      { new: true, runValidators: true }
    ).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Profile updated', user: { id: user._id, username: user.username, email: user.email } });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ message: 'New password must be at least 6 characters' });

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const valid = await user.comparePassword(currentPassword);
    if (!valid) return res.status(401).json({ message: 'Current password is incorrect' });

    user.passwordHash = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ message: 'Password is incorrect' });

    await User.findByIdAndDelete(req.user.userId);
    res.json({ message: 'Account deleted' });
  } catch (error) {
    next(error);
  }
};