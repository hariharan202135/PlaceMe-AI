import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
  token?: string;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;

  // 1. Check for token in cookies
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Check for token in Authorization header
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_for_placeme_ai_production') as { id: string };
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }

    // Keep active timestamps fresh
    user.lastActive = new Date();
    await user.save();

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth verification error:', error);
    return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
  }
};

export const optionalProtect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_for_placeme_ai_production') as { id: string };
    const user = await User.findById(decoded.id);

    if (user) {
      user.lastActive = new Date();
      await user.save();
      req.user = user;
      req.token = token;
    }
  } catch (error) {
    // Silently continue for optional authentication
  }
  next();
};

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Access denied: Admin role required' });
  }
};

export const checkPremium = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && (req.user.subscription.status === 'active' || req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      premiumRequired: true,
      message: 'Premium subscription required to access this feature.' 
    });
  }
};
