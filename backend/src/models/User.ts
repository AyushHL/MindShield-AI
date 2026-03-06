import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash?: string | null;
  googleId?: string | null;
  avatar?: string;
  createdAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, default: null },
  googleId: { type: String, default: null, sparse: true },
  avatar: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('passwordHash') || !this.passwordHash) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  if (!this.passwordHash) return false;
  return bcrypt.compare(password, this.passwordHash);
};

export default mongoose.model<IUser>('User', UserSchema);
