/**
 * Security configuration for the affiliate system
 */

export const SECURITY_CONFIG = {
  // Rate limiting
  RATE_LIMITS: {
    GENERAL: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // requests per window
    },
    AUTH: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5 // attempts per window
    },
    AFFILIATE_CLICK: {
      windowMs: 60 * 1000, // 1 minute
      max: 10 // clicks per window
    },
    AFFILIATE_APPLICATION: {
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
      max: 3 // applications per window
    }
  },

  // Affiliate system security
  AFFILIATE: {
    // Fraud detection thresholds
    MAX_CLICKS_PER_IP_PER_DAY: 10,
    MAX_CLICKS_PER_IP_PER_HOUR: 1,
    
    // Cookie settings
    DEFAULT_COOKIE_DURATION: 30, // days
    MAX_COOKIE_DURATION: 90, // days
    
    // Commission limits
    MAX_COMMISSION_RATE: 0.50, // 50%
    MIN_PAYOUT_THRESHOLD: 10, // $10
    MAX_PAYOUT_THRESHOLD: 10000, // $10,000
    
    // Referral code validation
    REFERRAL_CODE_PATTERN: /^GENIE[A-Z0-9]{8}$/,
    
    // Suspicious activity detection
    SUSPICIOUS_USER_AGENTS: [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /php/i,
      /automated/i,
      /sqlmap/i,
      /nikto/i,
      /nessus/i
    ]
  },

  // Input validation
  VALIDATION: {
    // Maximum lengths for text inputs
    MAX_REASON_LENGTH: 1000,
    MAX_EXPERIENCE_LENGTH: 1000,
    MAX_MARKETING_CHANNELS_LENGTH: 1000,
    MAX_ADMIN_NOTES_LENGTH: 2000,
    
    // Email validation
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    
    // Dangerous patterns to block
    SQL_INJECTION_PATTERNS: [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /('|(\\x27)|(\\x2D\\x2D)|(\;))/gi,
      /((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi,
      /((\%27)|(\'))union/gi
    ],
    
    // XSS patterns to sanitize
    XSS_PATTERNS: [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ]
  },

  // Logging and monitoring
  LOGGING: {
    // Security events to log
    SECURITY_EVENTS: {
      SUSPICIOUS_USER_AGENT: 'suspicious_user_agent',
      SUSPICIOUS_URL_ACCESS: 'suspicious_url_access',
      RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
      INVALID_REFERRAL_CODE: 'invalid_referral_code',
      DUPLICATE_CLICK_ATTEMPT: 'duplicate_click_attempt',
      SELF_REFERRAL_ATTEMPT: 'self_referral_attempt',
      EXCESSIVE_CLICKS: 'excessive_clicks',
      FAILED_AUTHENTICATION: 'failed_authentication'
    },
    
    // Log levels
    LOG_LEVELS: {
      ERROR: 'error',
      WARN: 'warn',
      INFO: 'info',
      DEBUG: 'debug'
    }
  }
};

/**
 * Environment-specific security settings
 */
export const getSecurityConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  const baseConfig = SECURITY_CONFIG;
  
  if (env === 'production') {
    return {
      ...baseConfig,
      // Stricter settings for production
      RATE_LIMITS: {
        ...baseConfig.RATE_LIMITS,
        GENERAL: {
          windowMs: 15 * 60 * 1000,
          max: 50 // Lower limit in production
        }
      }
    };
  }
  
  if (env === 'test') {
    return {
      ...baseConfig,
      // More lenient settings for testing
      RATE_LIMITS: {
        ...baseConfig.RATE_LIMITS,
        GENERAL: {
          windowMs: 1000, // 1 second
          max: 1000 // High limit for tests
        },
        AFFILIATE_CLICK: {
          windowMs: 1000,
          max: 100
        }
      }
    };
  }
  
  return baseConfig;
};