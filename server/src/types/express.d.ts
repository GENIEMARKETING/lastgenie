/**
 * Express Request augmentation for authenticated user
 */

import { Request } from 'express';

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'customer' | 'admin' | 'super_admin';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export interface AuthRequest extends Request {
  user: AuthUser;
}
