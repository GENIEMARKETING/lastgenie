import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt';
import { prisma } from '../lib/prisma';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'customer' | 'admin' | 'super_admin';
    firstName?: string;
    lastName?: string;
  };
}

/**
 * Authentication middleware to verify JWT tokens
 * Extracts token from cookies and verifies it
 */
export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Debug logging
    console.log('Authentication attempt:', {
      path: req.path,
      method: req.method,
      hasCookies: !!req.cookies,
      cookieKeys: req.cookies ? Object.keys(req.cookies) : []
    });

    // Get token from cookies
    const token = req.cookies?.accessToken;

    if (!token) {
      console.log('Authentication failed: No token found');
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      console.log('Authentication failed: Invalid token');
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
      return;
    }

    console.log('Token decoded successfully:', { userId: decoded.sub });

    // Optionally verify user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    if (!user) {
      console.log('Authentication failed: User not found in database');
      res.status(401).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    console.log('User authenticated successfully:', {
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Attach user to request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    const token = req.cookies?.accessToken;
    const refreshToken = req.cookies?.refreshToken;
    
    console.error('❌ Authentication middleware error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      requestPath: req.path,
      requestMethod: req.method,
      hasAccessToken: !!token,
      hasRefreshToken: !!refreshToken,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
      fullError: error
    });
    
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't require it
 */
export async function optionalAuthenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.accessToken;

    if (token) {
      const decoded = verifyAccessToken(token);
      if (decoded) {
        const user = await prisma.user.findUnique({
          where: { id: decoded.sub },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        });

        if (user) {
          req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
          };
        }
      }
    }

    next();
  } catch (error) {
    // Continue without authentication on error
    next();
  }
}

/**
 * Role-based authorization middleware
 * Requires user to have one of the specified roles
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
}

/**
 * Admin authorization middleware
 * Requires user to be admin or super_admin
 */
export const requireAdmin = requireRole('admin', 'super_admin');

/**
 * Super admin authorization middleware
 * Requires user to be super_admin
 */
export const requireSuperAdmin = requireRole('super_admin');