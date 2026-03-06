import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const validatePassword = (password: string): string | null => {
  if (!password || password.length < 8)       return 'Password must be at least 8 characters long';
  if (password.length > 64)                   return 'Password must not exceed 64 characters';
  if (!/[A-Z]/.test(password))                return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password))                return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(password))                return 'Password must contain at least one number';
  if (!/[@#$%&*!^()_\-+=[\]{};:'",.<>?/\\|`~]/.test(password))
                                               return 'Password must contain at least one special character';
  if (/\s/.test(password))                    return 'Password must not contain spaces';
  return null;
};

export const register = async (req: Request, res: Response, next: NextFunction) => {  
  try {
    const { username, email, password } = req.body;

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'An account with this email already exists' });
      }
      return res.status(400).json({ message: 'This username is already taken' });
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
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.passwordHash) {
      return res.status(400).json({ message: 'This account uses Google sign-in. Please use the Google button to log in.' });
    }

    if (!(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email, hasPassword: true } });
  } catch (error) {
    next(error);
  }
};

export const googleLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: 'No credential provided' });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) return res.status(400).json({ message: 'Invalid Google token' });

    const { email, name, sub: googleId } = payload;
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      let username = (name || email.split('@')[0]).replace(/\s+/g, '_').toLowerCase();
      const taken = await User.findOne({ username });
      if (taken) username = `${username}_${Date.now()}`;
      user = new User({ username, email, googleId, passwordHash: null });
      await user.save();
    } else if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email, hasPassword: !!user.passwordHash } });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ id: user._id, username: user.username, email: user.email, avatar: user.avatar ?? null, createdAt: user.createdAt, hasPassword: !!user.passwordHash });
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
    const passwordError = validatePassword(newPassword);
    if (passwordError) return res.status(400).json({ message: passwordError });

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.passwordHash) return res.status(400).json({ message: 'No password set. Use Set Password to create one first.' });

    const valid = await user.comparePassword(currentPassword);
    if (!valid) return res.status(401).json({ message: 'Current password is incorrect' });

    const sameAsOld = await user.comparePassword(newPassword);
    if (sameAsOld) return res.status(400).json({ message: 'New password must be different from your current password' });

    user.passwordHash = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

export const setPassword = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    const { newPassword } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.passwordHash) return res.status(400).json({ message: 'Account already has a password. Use Change Password instead.' });

    const passwordError = validatePassword(newPassword);
    if (passwordError) return res.status(400).json({ message: passwordError });

    user.passwordHash = newPassword;
    await user.save();
    res.json({ message: 'Password set successfully' });
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