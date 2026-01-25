import { Request, Response, NextFunction } from 'express';
import { authenticate, AuthRequest, requireAdmin, requireSuperAdmin } from './auth';
import auditService from '../services/audit';

/**
 * Enhanced admin authentication middleware with audit logging
 */
export async function adminAuthenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // First run standard authentication
    await new Promise<void>((resolve, reject) => {
      authenticate(req, res, (error?: any) => {
        if (error) {
          reject(error);
          return;
        }

        // If authentication passed, check if user is admin
        if (!req.user) {
          res.status(401).json({
            success: false,
            error: 'Authentication required'
          });
          return;
        }

        if (!['admin', 'super_admin'].includes(req.user.role)) {
          res.status(403).json({
            success: false,
            error: 'Admin access required'
          });
          return;
        }

        resolve();
      });
    });

    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Authentication failed'
      });
    }
  }
}

/**
 * Admin action audit middleware
 * Logs admin actions for compliance and security
 */
export function auditAdminAction(action: string, entity: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    // Store original res.json to intercept response
    const originalJson = res.json;
    
    res.json = function(body: any) {
      // Log successful admin actions
      if (req.user && res.statusCode < 400) {
        auditService.log(req, {
          action,
          entity,
          entityId: (req.params.id as string) || 'bulk',
          newValues: req.body,
          metadata: {
            method: req.method,
            url: req.originalUrl,
            userAgent: req.get('User-Agent'),
            ip: req.ip
          }
        }).catch(console.error);
      }
      
      return originalJson.call(this, body);
    };

    next();
  };
}

/**
 * Rate limiting for admin actions
 * More restrictive rate limiting for sensitive admin operations
 */
export function adminRateLimit(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next();
      return;
    }

    const key = `admin:${req.user.id}:${req.path}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up old entries
    for (const [k, v] of requests.entries()) {
      if (v.resetTime < windowStart) {
        requests.delete(k);
      }
    }

    const userRequests = requests.get(key) || { count: 0, resetTime: now + windowMs };

    if (userRequests.count >= maxRequests) {
      res.status(429).json({
        success: false,
        error: 'Too many admin requests. Please try again later.',
        retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
      });
      return;
    }

    userRequests.count++;
    requests.set(key, userRequests);
    next();
  };
}

/**
 * Validate admin permissions for specific resources
 */
export function validateAdminPermissions(resource: string, action: 'read' | 'write' | 'delete') {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    // Add debug logging
    console.log('Admin permission check:', {
      hasUser: !!req.user,
      userRole: req.user?.role,
      userEmail: req.user?.email,
      resource,
      action,
      isAdmin: req.user && ['admin', 'super_admin'].includes(req.user.role)
    });

    if (!req.user) {
      console.log('Permission denied: No user found');
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    // Super admins have all permissions
    if (req.user.role === 'super_admin') {
      console.log('Permission granted: Super admin access');
      next();
      return;
    }

    // Regular admins have limited permissions
    if (req.user.role === 'admin') {
      // Define admin permissions
      const adminPermissions: Record<string, string[]> = {
        products: ['read', 'write'],
        inventory: ['read', 'write'],
        orders: ['read', 'write'],
        users: ['read'], // Admins can only read users, not modify
        affiliates: ['read', 'write'],
        analytics: ['read'],
        dashboard: ['read'], // Add dashboard permissions
        settings: [] // Only super admins can modify settings
      };

      const allowedActions = adminPermissions[resource] || [];
      
      console.log('Admin permission check:', {
        resource,
        action,
        allowedActions,
        hasPermission: allowedActions.includes(action)
      });
      
      if (!allowedActions.includes(action)) {
        console.log(`Permission denied: Insufficient permissions for ${action} on ${resource}`);
        res.status(403).json({
          success: false,
          error: `Insufficient permissions for ${action} on ${resource}`
        });
        return;
      }

      console.log('Permission granted: Admin access approved');
    }

    next();
  };
}

// Export convenience middlewares
export const requireAdminRead = (resource: string) => [
  adminAuthenticate,
  validateAdminPermissions(resource, 'read')
];

export const requireAdminWrite = (resource: string) => [
  adminAuthenticate,
  validateAdminPermissions(resource, 'write'),
  adminRateLimit(50, 15 * 60 * 1000) // 50 requests per 15 minutes for write operations
];

export const requireAdminDelete = (resource: string) => [
  adminAuthenticate,
  validateAdminPermissions(resource, 'delete'),
  adminRateLimit(10, 15 * 60 * 1000) // 10 requests per 15 minutes for delete operations
];

// Re-export existing auth functions for convenience
export { authenticate, requireAdmin, requireSuperAdmin } from './auth';