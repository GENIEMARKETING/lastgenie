"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSuperAdmin = exports.requireAdmin = void 0;
exports.authenticate = authenticate;
exports.optionalAuthenticate = optionalAuthenticate;
exports.requireRole = requireRole;
const jwt_1 = require("../lib/jwt");
const prisma_1 = require("../lib/prisma");
/**
 * Authentication middleware to verify JWT tokens
 * Extracts token from cookies and verifies it
 */
async function authenticate(req, res, next) {
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
        const decoded = (0, jwt_1.verifyAccessToken)(token);
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
        const user = await prisma_1.prisma.user.findUnique({
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
    }
    catch (error) {
        console.error('Authentication error:', error);
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
async function optionalAuthenticate(req, res, next) {
    try {
        const token = req.cookies?.accessToken;
        if (token) {
            const decoded = (0, jwt_1.verifyAccessToken)(token);
            if (decoded) {
                const user = await prisma_1.prisma.user.findUnique({
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
    }
    catch (error) {
        // Continue without authentication on error
        next();
    }
}
/**
 * Role-based authorization middleware
 * Requires user to have one of the specified roles
 */
function requireRole(...allowedRoles) {
    return (req, res, next) => {
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
exports.requireAdmin = requireRole('admin', 'super_admin');
/**
 * Super admin authorization middleware
 * Requires user to be super_admin
 */
exports.requireSuperAdmin = requireRole('super_admin');
