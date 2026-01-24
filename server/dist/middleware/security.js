"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.affiliateTrackingCORS = exports.suspiciousActivityDetection = exports.logSecurityEvent = exports.sanitizeSearchParams = exports.validateEmailParam = exports.validateReferralCodeParam = exports.sanitizeInput = exports.securityHeaders = void 0;
const helmet_1 = __importDefault(require("helmet"));
const zod_1 = require("zod");
/**
 * Security headers middleware using helmet
 */
exports.securityHeaders = (0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'", "https://js.stripe.com"],
            frameSrc: ["https://js.stripe.com"],
            connectSrc: ["'self'", "https://api.stripe.com"],
        },
    },
    crossOriginEmbedderPolicy: false, // Disable for Stripe compatibility
});
/**
 * Input sanitization middleware
 */
const sanitizeInput = (req, res, next) => {
    // Recursively sanitize all string inputs
    const sanitizeValue = (value) => {
        if (typeof value === 'string') {
            // Remove potentially dangerous characters
            return value
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
                .replace(/javascript:/gi, '') // Remove javascript: protocol
                .replace(/on\w+\s*=/gi, '') // Remove event handlers
                .trim();
        }
        else if (Array.isArray(value)) {
            return value.map(sanitizeValue);
        }
        else if (value && typeof value === 'object') {
            const sanitized = {};
            for (const key in value) {
                sanitized[key] = sanitizeValue(value[key]);
            }
            return sanitized;
        }
        return value;
    };
    if (req.body) {
        req.body = sanitizeValue(req.body);
    }
    if (req.query && typeof req.query === 'object') {
        // Create a new object instead of modifying the read-only query object
        const sanitizedQuery = {};
        for (const key in req.query) {
            sanitizedQuery[key] = sanitizeValue(req.query[key]);
        }
        Object.defineProperty(req, 'query', {
            value: sanitizedQuery,
            writable: true,
            configurable: true
        });
    }
    if (req.params && typeof req.params === 'object') {
        // Create a new object instead of modifying the read-only params object
        const sanitizedParams = {};
        for (const key in req.params) {
            sanitizedParams[key] = sanitizeValue(req.params[key]);
        }
        Object.defineProperty(req, 'params', {
            value: sanitizedParams,
            writable: true,
            configurable: true
        });
    }
    next();
};
exports.sanitizeInput = sanitizeInput;
/**
 * Validate referral code format
 */
const validateReferralCodeParam = (req, res, next) => {
    const referralCodeSchema = zod_1.z.string().regex(/^GENIE[A-Z0-9]{8}$/, 'Invalid referral code format');
    if (req.body.referralCode) {
        try {
            req.body.referralCode = referralCodeSchema.parse(req.body.referralCode);
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                error: 'Invalid referral code format'
            });
        }
    }
    if (req.query.ref) {
        try {
            req.query.ref = referralCodeSchema.parse(req.query.ref);
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                error: 'Invalid referral code format'
            });
        }
    }
    next();
};
exports.validateReferralCodeParam = validateReferralCodeParam;
/**
 * Validate email format
 */
const validateEmailParam = (req, res, next) => {
    const emailSchema = zod_1.z.string().email('Invalid email format');
    if (req.body.email) {
        try {
            req.body.email = emailSchema.parse(req.body.email);
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format'
            });
        }
    }
    next();
};
exports.validateEmailParam = validateEmailParam;
/**
 * Prevent SQL injection in search parameters
 */
const sanitizeSearchParams = (req, res, next) => {
    const dangerousPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
        /('|(\\x27)|(\\x2D\\x2D)|(\;))/gi,
        /((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi,
        /((\%27)|(\'))union/gi
    ];
    const checkForSQLInjection = (value) => {
        return dangerousPatterns.some(pattern => pattern.test(value));
    };
    if (req.query.search && typeof req.query.search === 'string') {
        if (checkForSQLInjection(req.query.search)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid search parameter'
            });
        }
    }
    next();
};
exports.sanitizeSearchParams = sanitizeSearchParams;
/**
 * Log security events
 */
const logSecurityEvent = (eventType, details, req) => {
    const securityLog = {
        timestamp: new Date().toISOString(),
        eventType,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id,
        details
    };
    // In production, this should be sent to a security monitoring service
    console.warn('SECURITY EVENT:', JSON.stringify(securityLog));
};
exports.logSecurityEvent = logSecurityEvent;
/**
 * Detect and block suspicious activity
 */
const suspiciousActivityDetection = (req, res, next) => {
    const userAgent = req.get('User-Agent') || '';
    const suspiciousPatterns = [
        /sqlmap/i,
        /nikto/i,
        /nessus/i,
        /masscan/i,
        /nmap/i,
        /dirb/i,
        /dirbuster/i,
        /gobuster/i,
        /burp/i,
        /owasp/i
    ];
    // Check for suspicious user agents
    if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
        (0, exports.logSecurityEvent)('SUSPICIOUS_USER_AGENT', { userAgent }, req);
        return res.status(403).json({
            success: false,
            error: 'Access denied'
        });
    }
    // Check for suspicious request patterns
    const url = req.originalUrl.toLowerCase();
    const suspiciousUrls = [
        /\.php$/,
        /\.asp$/,
        /\.jsp$/,
        /admin/,
        /wp-admin/,
        /phpmyadmin/,
        /\.env$/,
        /\.git/,
        /\.svn/
    ];
    if (suspiciousUrls.some(pattern => pattern.test(url))) {
        (0, exports.logSecurityEvent)('SUSPICIOUS_URL_ACCESS', { url }, req);
        return res.status(404).json({
            success: false,
            error: 'Not found'
        });
    }
    next();
};
exports.suspiciousActivityDetection = suspiciousActivityDetection;
/**
 * CORS configuration for affiliate tracking
 */
const affiliateTrackingCORS = (req, res, next) => {
    // Allow tracking from any origin for affiliate clicks
    if (req.path === '/track-click') {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'POST');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
    }
    next();
};
exports.affiliateTrackingCORS = affiliateTrackingCORS;
