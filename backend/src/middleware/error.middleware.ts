import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);

  // MongoDB duplicate key error
  if (err.code === 11000 || err.code === '11000') {
    const field = Object.keys(err.keyPattern || {})[0];
    const friendly: Record<string, string> = {
      email: 'An account with this email already exists',
      username: 'This username is already taken',
    };
    return res.status(400).json({ message: friendly[field] || 'Duplicate value for a unique field' });
  }

  res.status(500).json({ message: err.message || 'Internal Server Error' });
};