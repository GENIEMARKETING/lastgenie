import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { z } from 'zod';

/**
 * Security headers middleware using helmet
 */
export const securityHeaders = helmet({
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
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Recursively sanitize all string inputs
  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      // Remove potentially dangerous characters
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .trim();
    } else if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    } else if (value && typeof value === 'object') {
      const sanitized: any = {};
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
    const sanitizedQuery: any = {};
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
    const sanitizedParams: any = {};
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

/**
 * Validate referral code format
 */
export const validateReferralCodeParam = (req: Request, res: Response, next: NextFunction) => {
  const referralCodeSchema = z.string().regex(/^GENIE[A-Z0-9]{8}$/, 'Invalid referral code format');
  
  if (req.body.referralCode) {
    try {
      req.body.referralCode = referralCodeSchema.parse(req.body.referralCode);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid referral code format'
      });
    }
  }

  if (req.query.ref) {
    try {
      req.query.ref = referralCodeSchema.parse(req.query.ref);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid referral code format'
      });
    }
  }

  next();
};

/**
 * Validate email format
 */
export const validateEmailParam = (req: Request, res: Response, next: NextFunction) => {
  const emailSchema = z.string().email('Invalid email format');
  
  if (req.body.email) {
    try {
      req.body.email = emailSchema.parse(req.body.email);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }
  }

  next();
};

/**
 * Prevent SQL injection in search parameters
 */
export const sanitizeSearchParams = (req: Request, res: Response, next: NextFunction) => {
  const dangerousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /('|(\\x27)|(\\x2D\\x2D)|(\;))/gi,
    /((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi,
    /((\%27)|(\'))union/gi
  ];

  const checkForSQLInjection = (value: string): boolean => {
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

/**
 * Log security events
 */
export const logSecurityEvent = (eventType: string, details: any, req: Request) => {
  const securityLog = {
    timestamp: new Date().toISOString(),
    eventType,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
    details
  };

  // In production, this should be sent to a security monitoring service
  console.warn('SECURITY EVENT:', JSON.stringify(securityLog));
};

/**
 * Detect and block suspicious activity
 */
export const suspiciousActivityDetection = (req: Request, res: Response, next: NextFunction) => {
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
    logSecurityEvent('SUSPICIOUS_USER_AGENT', { userAgent }, req);
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
    logSecurityEvent('SUSPICIOUS_URL_ACCESS', { url }, req);
    return res.status(404).json({
      success: false,
      error: 'Not found'
    });
  }

  next();
};

/**
 * CORS configuration for affiliate tracking
 */
export const affiliateTrackingCORS = (req: Request, res: Response, next: NextFunction) => {
  // Allow tracking from any origin for affiliate clicks
  if (req.path === '/track-click') {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
  }
  next();
};