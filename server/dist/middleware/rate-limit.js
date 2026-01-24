"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserRateLimit = exports.affiliateApplicationRateLimit = exports.affiliateClickRateLimit = exports.authRateLimit = exports.generalRateLimit = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
/**
 * General API rate limiting
 */
exports.generalRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
/**
 * Strict rate limiting for authentication endpoints
 */
exports.authRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 auth attempts per windowMs
    message: {
        success: false,
        error: 'Too many authentication attempts, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
});
/**
 * Rate limiting for affiliate click tracking
 */
exports.affiliateClickRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // Limit each IP to 10 click tracking requests per minute
    message: {
        success: false,
        error: 'Too many click tracking requests, please slow down.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
/**
 * Rate limiting for affiliate applications
 */
exports.affiliateApplicationRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 3, // Limit each IP to 3 application attempts per day
    message: {
        success: false,
        error: 'Too many application attempts, please try again tomorrow.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
/**
 * Custom rate limiter that uses user ID instead of IP for authenticated requests
 */
const createUserRateLimit = (windowMs, max, message) => {
    const store = new Map();
    return (req, res, next) => {
        const key = req.user?.id || req.ip;
        const now = Date.now();
        // Clean up expired entries
        for (const [k, v] of store.entries()) {
            if (now > v.resetTime) {
                store.delete(k);
            }
        }
        const current = store.get(key) || { count: 0, resetTime: now + windowMs };
        if (now > current.resetTime) {
            current.count = 1;
            current.resetTime = now + windowMs;
        }
        else {
            current.count++;
        }
        store.set(key, current);
        if (current.count > max) {
            return res.status(429).json({
                success: false,
                error: message,
                retryAfter: Math.ceil((current.resetTime - now) / 1000)
            });
        }
        // Set rate limit headers
        res.set({
            'X-RateLimit-Limit': max.toString(),
            'X-RateLimit-Remaining': Math.max(0, max - current.count).toString(),
            'X-RateLimit-Reset': new Date(current.resetTime).toISOString()
        });
        next();
    };
};
exports.createUserRateLimit = createUserRateLimit;
