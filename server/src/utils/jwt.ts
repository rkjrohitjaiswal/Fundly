import jwt, { SignOptions } from 'jsonwebtoken';
import { CookieOptions } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'fundly-jwt-super-secret-key-3849102';

export interface TokenPayload {
  userId: string;
  email: string;
  displayName?: string;
  iat?: number;
  exp?: number;
}

export function generateToken(payload: { userId: string; email: string; displayName?: string }, options?: SignOptions): string {
  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      ...(payload.displayName ? { displayName: payload.displayName } : {}),
    },
    JWT_SECRET,
    {
      expiresIn: '7d',
      algorithm: 'HS256',
      ...options,
    }
  );
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as TokenPayload;
  } catch (err) {
    return null;
  }
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
}

export const AUTH_COOKIE_NAME = 'fundly_token';

export function getAuthCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/',
  };
}
