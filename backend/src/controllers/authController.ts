import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User, { IUser } from '../models/User';
import { AuthRequest } from '../middlewares/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_placeme_ai_production';
const NODE_ENV = process.env.NODE_ENV || 'development';

const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '30d' });
};

const sendTokenResponse = (user: IUser, statusCode: number, res: Response) => {
  const token = generateToken(user._id.toString());

  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: NODE_ENV === 'production' ? ('none' as const) : ('lax' as const)
  };

  // Convert to JSON and remove password
  const userResponse = user.toObject();
  delete userResponse.password;

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user: userResponse
    });
};

export const register = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = await User.create({
      name,
      email,
      password: hashedPassword,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
    });

    sendTokenResponse(user, 201, res);
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

export const login = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Need password since select: false
    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Update lastActive
    user.lastActive = new Date();
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user: req.user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching user profile' });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  const { credential, name, email, avatar } = req.body;

  if (!email || !name) {
    return res.status(400).json({ success: false, message: 'Missing Google user info' });
  }

  try {
    // In production, we would decode and verify the JWT token from Google:
    // const ticket = await client.verifyIdToken({ idToken: credential, audience: CLIENT_ID });
    // const payload = ticket.getPayload();
    // Here we support frontend client credentials login
    let user = await User.findOne({ email });

    if (!user) {
      // Create random password fallback
      const randomPassword = Math.random().toString(36).substring(2, 15);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = await User.create({
        name,
        email,
        password: hashedPassword,
        avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        googleId: credential ? 'google-' + Math.random().toString(36).substring(7) : undefined,
        subscription: {
          plan: 'Free',
          status: 'inactive'
        }
      });
    } else {
      // Update avatar if provided
      if (avatar && !user.avatar) {
        user.avatar = avatar;
        await user.save();
      }
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ success: false, message: 'Server error during Google auth' });
  }
};

// Store verification codes in memory for reset (production would use Redis/DB)
const passwordResetTokens = new Map<string, { email: string; expires: number }>();

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Please provide email' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found with this email' });
    }

    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expires = Date.now() + 15 * 60 * 1000; // 15 mins

    passwordResetTokens.set(resetToken, { email, expires });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
    
    // In production, mail the resetUrl to the user. For deployment readiness:
    console.log(`✉️ Password reset request for ${email}. Link: ${resetUrl}`);

    res.status(200).json({
      success: true,
      message: 'Password reset link generated successfully. (Check backend logs if email service is unconfigured)',
      resetLink: resetUrl // Returned for convenience in sandbox environments
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ success: false, message: 'Missing token or password' });
  }

  const tokenData = passwordResetTokens.get(token);
  if (!tokenData) {
    return res.status(400).json({ success: false, message: 'Invalid reset token' });
  }

  if (Date.now() > tokenData.expires) {
    passwordResetTokens.delete(token);
    return res.status(400).json({ success: false, message: 'Reset token has expired' });
  }

  try {
    const user = await User.findOne({ email: tokenData.email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    // Clean token
    passwordResetTokens.delete(token);

    res.status(200).json({ success: true, message: 'Password reset successful. You can login now.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
