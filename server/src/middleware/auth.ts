import { Request, Response, NextFunction } from 'express';
import { verifyToken, AUTH_COOKIE_NAME } from '../utils/jwt.js';
import { UserRepo } from '../models/index.js';

export interface AuthenticatedUser {
  _id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser | any;
}

/**
 * Extracts JWT token from Authorization header or HTTP-only cookie.
 */
function extractToken(req: Request): string | null {
  if (req.cookies && req.cookies[AUTH_COOKIE_NAME]) {
    return req.cookies[AUTH_COOKIE_NAME];
  }

  if (req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && (parts[0] === 'Bearer' || parts[0] === 'bearer')) {
      return parts[1];
    }
  }

  return null;
}

/**
 * Mandatory Authentication Guard: Protects routes and ensures verified user context.
 */
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Authentication required to access this resource.',
      errorCode: 'AUTH_REQUIRED',
    });
    return;
  }

  const payload = verifyToken(token);
  if (!payload || !payload.userId) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired session. Please log in again.',
      errorCode: 'INVALID_TOKEN',
    });
    return;
  }

  const user = await UserRepo.findById(payload.userId);
  if (!user) {
    res.status(401).json({
      success: false,
      message: 'User account not found or has been deactivated.',
      errorCode: 'USER_NOT_FOUND',
    });
    return;
  }

  // Sanitize user: ensure passwordHash is never leaked into req.user
  const { passwordHash: _, ...safeUser } = user;
  req.user = safeUser;
  next();
}

/**
 * Optional Authentication Guard: Populates req.user if a valid token exists, but does not block.
 */
export async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);

  if (token) {
    const payload = verifyToken(token);
    if (payload && payload.userId) {
      const user = await UserRepo.findById(payload.userId);
      if (user) {
        const { passwordHash: _, ...safeUser } = user;
        req.user = safeUser;
      }
    }
  }

  next();
}
