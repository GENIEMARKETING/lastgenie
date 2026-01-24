import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';

export interface TokenPayload {
  sub: string; // User ID
  email: string;
  role?: string;
}

export interface AccessTokenPayload extends TokenPayload {
  iat: number;
  exp: number;
}

/**
 * Generate an access token (short-lived, 15 minutes)
 * @param payload - Token payload containing user information
 * @returns JWT access token
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '15m',
  });
}

/**
 * Generate a refresh token (long-lived, 7 days)
 * @param payload - Token payload containing user information
 * @returns JWT refresh token
 */
export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });
}

/**
 * Verify an access token
 * @param token - JWT access token
 * @returns Decoded token payload or null if invalid
 */
export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AccessTokenPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Verify a refresh token
 * @param token - JWT refresh token
 * @returns Decoded token payload or null if invalid
 */
export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}