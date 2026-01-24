"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSuperAdmin = exports.requireAdmin = exports.authenticate = exports.requireAdminDelete = exports.requireAdminWrite = exports.requireAdminRead = void 0;
exports.adminAuthenticate = adminAuthenticate;
exports.auditAdminAction = auditAdminAction;
exports.adminRateLimit = adminRateLimit;
exports.validateAdminPermissions = validateAdminPermissions;
const auth_1 = require("./auth");
const audit_1 = __importDefault(require("../services/audit"));
/**
 * Enhanced admin authentication middleware with audit logging
 */
async function adminAuthenticate(req, res, next) {
    try {
        // First run standard authentication
        await new Promise((resolve, reject) => {
            (0, auth_1.authenticate)(req, res, (error) => {
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
    }
    catch (error) {
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
function auditAdminAction(action, entity) {
    return async (req, res, next) => {
        // Store original res.json to intercept response
        const originalJson = res.json;
        res.json = function (body) {
            // Log successful admin actions
            if (req.user && res.statusCode < 400) {
                audit_1.default.log(req, {
                    action,
                    entity,
                    entityId: req.params.id || 'bulk',
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
function adminRateLimit(maxRequests = 100, windowMs = 15 * 60 * 1000) {
    const requests = new Map();
    return (req, res, next) => {
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
function validateAdminPermissions(resource, action) {
    return (req, res, next) => {
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
            const adminPermissions = {
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
const requireAdminRead = (resource) => [
    adminAuthenticate,
    validateAdminPermissions(resource, 'read')
];
exports.requireAdminRead = requireAdminRead;
const requireAdminWrite = (resource) => [
    adminAuthenticate,
    validateAdminPermissions(resource, 'write'),
    adminRateLimit(50, 15 * 60 * 1000) // 50 requests per 15 minutes for write operations
];
exports.requireAdminWrite = requireAdminWrite;
const requireAdminDelete = (resource) => [
    adminAuthenticate,
    validateAdminPermissions(resource, 'delete'),
    adminRateLimit(10, 15 * 60 * 1000) // 10 requests per 15 minutes for delete operations
];
exports.requireAdminDelete = requireAdminDelete;
// Re-export existing auth functions for convenience
var auth_2 = require("./auth");
Object.defineProperty(exports, "authenticate", { enumerable: true, get: function () { return auth_2.authenticate; } });
Object.defineProperty(exports, "requireAdmin", { enumerable: true, get: function () { return auth_2.requireAdmin; } });
Object.defineProperty(exports, "requireSuperAdmin", { enumerable: true, get: function () { return auth_2.requireSuperAdmin; } });
