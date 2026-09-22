import { Response } from 'express';
import { UserRepo } from '../models/index.js';
import { generateToken, getAuthCookieOptions, AUTH_COOKIE_NAME } from '../utils/jwt.js';
import { hashPassword, comparePassword } from '../utils/auth.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const authController = {
  async register(req: AuthenticatedRequest, res: Response) {
    try {
      const { displayName, email, password } = req.body;

      if (!displayName || !displayName.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Display name is required.',
          errorCode: 'VALIDATION_ERROR',
        });
      }

      if (!email || !email.includes('@')) {
        return res.status(400).json({
          success: false,
          message: 'A valid email address is required.',
          errorCode: 'VALIDATION_ERROR',
        });
      }

      if (!password || password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters.',
          errorCode: 'VALIDATION_ERROR',
        });
      }

      const existing = await UserRepo.findByEmail(email);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email address already exists.',
          errorCode: 'EMAIL_IN_USE',
        });
      }

      // Hash password using bcrypt
      const passwordHash = await hashPassword(password);

      const user = await UserRepo.create({
        displayName: displayName.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        photoURL: '',
      });

      const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
      });

      res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

      const { passwordHash: _, ...safeUser } = user;
      return res.status(201).json({
        success: true,
        data: {
          user: safeUser,
          token,
        },
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Registration failed.',
        errorCode: 'SERVER_ERROR',
      });
    }
  },

  async login(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required.',
          errorCode: 'MISSING_CREDENTIALS',
        });
      }

      const user = await UserRepo.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password credentials.',
          errorCode: 'INVALID_CREDENTIALS',
        });
      }

      // Secure bcrypt password verification
      let isMatch = false;
      if (typeof user.comparePassword === 'function') {
        isMatch = await user.comparePassword(password);
      } else {
        isMatch = await comparePassword(password, user.passwordHash);
      }

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password credentials.',
          errorCode: 'INVALID_CREDENTIALS',
        });
      }

      const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
      });

      res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

      const { passwordHash: _, ...safeUser } = user;
      return res.json({
        success: true,
        data: {
          user: safeUser,
          token,
        },
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Login failed.',
        errorCode: 'SERVER_ERROR',
      });
    }
  },

  async logout(req: AuthenticatedRequest, res: Response) {
    res.clearCookie(AUTH_COOKIE_NAME, { path: '/' });
    return res.json({
      success: true,
      data: {
        message: 'Logged out successfully.',
      },
    });
  },

  async me(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated.',
        errorCode: 'AUTH_REQUIRED',
      });
    }
    const { passwordHash, ...safeUser } = req.user;
    return res.json({
      success: true,
      data: {
        user: safeUser,
      },
    });
  },
};
