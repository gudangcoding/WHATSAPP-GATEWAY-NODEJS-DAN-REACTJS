const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

class RateLimiterMiddleware {
    /**
     * Create rate limiter with custom options
     */
    createLimiter(options = {}) {
        const defaultOptions = {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
            message: {
                success: false,
                message: 'Too many requests from this IP, please try again later.',
                error: 'Rate limit exceeded',
                code: 'RATE_LIMIT_EXCEEDED',
                timestamp: new Date().toISOString()
            },
            standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
            legacyHeaders: false, // Disable the `X-RateLimit-*` headers
            handler: (req, res) => {
                logger.warn(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
                res.status(429).json(options.message || defaultOptions.message);
            },
            skip: (req) => {
                // Skip rate limiting for health checks
                return req.path === '/health' || req.path === '/api/v1/system/health';
            },
            keyGenerator: (req) => {
                // Use IP + User ID if authenticated for more granular limiting
                return req.ip + (req.user ? `:${req.user.id}` : '');
            }
        };

        return rateLimit({ ...defaultOptions, ...options });
    }

    /**
     * General API rate limiter
     */
    get general() {
        return this.createLimiter({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 1000, // 1000 requests per 15 minutes
            message: {
                success: false,
                message: 'Too many API requests, please try again later.',
                error: 'API rate limit exceeded',
                code: 'API_RATE_LIMIT_EXCEEDED',
                timestamp: new Date().toISOString(),
                retryAfter: '15 minutes'
            }
        });
    }

    /**
     * Authentication endpoints rate limiter
     */
    get auth() {
        return this.createLimiter({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 10, // 10 attempts per 15 minutes
            message: {
                success: false,
                message: 'Too many authentication attempts, please try again later.',
                error: 'Authentication rate limit exceeded',
                code: 'AUTH_RATE_LIMIT_EXCEEDED',
                timestamp: new Date().toISOString(),
                retryAfter: '15 minutes'
            }
        });
    }

    /**
     * Registration rate limiter
     */
    get register() {
        return this.createLimiter({
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 5, // 5 registrations per hour per IP
            message: {
                success: false,
                message: 'Too many registration attempts, please try again later.',
                error: 'Registration rate limit exceeded',
                code: 'REGISTRATION_RATE_LIMIT_EXCEEDED',
                timestamp: new Date().toISOString(),
                retryAfter: '1 hour'
            }
        });
    }

    /**
     * Login rate limiter
     */
    get login() {
        return this.createLimiter({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 10, // 10 login attempts per 15 minutes
            message: {
                success: false,
                message: 'Too many login attempts, please try again later.',
                error: 'Login rate limit exceeded',
                code: 'LOGIN_RATE_LIMIT_EXCEEDED',
                timestamp: new Date().toISOString(),
                retryAfter: '15 minutes'
            }
        });
    }

    /**
     * Password reset rate limiter
     */
    get forgotPassword() {
        return this.createLimiter({
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 3, // 3 password reset requests per hour
            message: {
                success: false,
                message: 'Too many password reset requests, please try again later.',
                error: 'Password reset rate limit exceeded',
                code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
                timestamp: new Date().toISOString(),
                retryAfter: '1 hour'
            }
        });
    }

    /**
     * Password reset confirmation rate limiter
     */
    get resetPassword() {
        return this.createLimiter({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 5, // 5 reset attempts per 15 minutes
            message: {
                success: false,
                message: 'Too many password reset attempts, please try again later.',
                error: 'Password reset confirmation rate limit exceeded',
                code: 'PASSWORD_RESET_CONFIRM_RATE_LIMIT_EXCEEDED',
                timestamp: new Date().toISOString(),
                retryAfter: '15 minutes'
            }
        });
    }

    /**
     * Email verification resend rate limiter
     */
    get resendVerification() {
        return this.createLimiter({
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 3, // 3 resend attempts per hour
            message: {
                success: false,
                message: 'Too many verification email requests, please try again later.',
                error: 'Email verification rate limit exceeded',
                code: 'EMAIL_VERIFICATION_RATE_LIMIT_EXCEEDED',
                timestamp: new Date().toISOString(),
                retryAfter: '1 hour'
            }
        });
    }

    /**
     * Message sending rate limiter
     */
    get sendMessage() {
        return this.createLimiter({
            windowMs: 60 * 1000, // 1 minute
            max: 30, // 30 messages per minute
            message: {
                success: false,
                message: 'Too many messages sent, please slow down.',
                error: 'Message sending rate limit exceeded',
                code: 'MESSAGE_RATE_LIMIT_EXCEEDED',
                timestamp: new Date().toISOString(),
                retryAfter: '1 minute'
            }
        });
    }

    /**
     * Bulk message sending rate limiter
     */
    get sendBulkMessage() {
        return this.createLimiter({
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 5, // 5 bulk operations per hour
            message: {
                success: false,
                message: 'Too many bulk message operations, please try again later.',
                error: 'Bulk message rate limit exceeded',
                code: 'BULK_MESSAGE_RATE_LIMIT_EXCEEDED',
                timestamp: new Date().toISOString(),
                retryAfter: '1 hour'
            }
        });
    }

    /**
     * Campaign operations rate limiter
     */
    get campaign() {
        return this.createLimiter({
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 10, // 10 campaign operations per hour
            message: {
                success: false,
                message: 'Too many campaign operations, please try again later.',
                error: 'Campaign rate limit exceeded',
                code: 'CAMPAIGN_RATE_LIMIT_EXCEEDED',
                timestamp: new Date().toISOString(),
                retryAfter: '1 hour'
            }
        });
    }

    /**
     * Contact scraping rate limiter
     */
    get contactScrape() {
        return this.createLimiter({
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 3, // 3 scraping operations per hour
            message: {
                success: false,
                message: 'Too many contact scraping operations, please try again later.',
                error: 'Contact scraping rate limit exceeded',
                code: 'CONTACT_SCRAPE_RATE_LIMIT_EXCEEDED',
                timestamp: new Date().toISOString(),
                retryAfter: '1 hour'
            }
        });
    }

    /**
     * AI operations rate limiter
     */
    get aiOperation() {
        return this.createLimiter({
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 100, // 100 AI operations per hour
            message: {
                success: false,
                message: 'Too many AI operations, please try again later.',
                error: 'AI operation rate limit exceeded',
                code: 'AI_RATE_LIMIT_EXCEEDED',
                timestamp: new Date().toISOString(),
                retryAfter: '1 hour'
            }
        });
    }

    /**
     * File upload rate limiter
     */
    get fileUpload() {
        return this.createLimiter({
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 50, // 50 file uploads per hour
            message: {
                success: false,
                message: 'Too many file uploads, please try again later.',
                error: 'File upload rate limit exceeded',
                code: 'FILE_UPLOAD_RATE_LIMIT_EXCEEDED',
                timestamp: new Date().toISOString(),
                retryAfter: '1 hour'
            }
        });
    }

    /**
     * Webhook operations rate limiter
     */
    get webhook() {
        return this.createLimiter({
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 20, // 20 webhook operations per hour
            message: {
                success: false,
                message: 'Too many webhook operations, please try again later.',
                error: 'Webhook rate limit exceeded',
                code: 'WEBHOOK_RATE_LIMIT_EXCEEDED',
                timestamp: new Date().toISOString(),
                retryAfter: '1 hour'
            }
        });
    }

    /**
     * Analytics requests rate limiter
     */
    get analytics() {
        return this.createLimiter({
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 200, // 200 analytics requests per hour
            message: {
                success: false,
                message: 'Too many analytics requests, please try again later.',
                error: 'Analytics rate limit exceeded',
                code: 'ANALYTICS_RATE_LIMIT_EXCEEDED',
                timestamp: new Date().toISOString(),
                retryAfter: '1 hour'
            }
        });
    }

    /**
     * System operations rate limiter (for admin operations)
     */
    get system() {
        return this.createLimiter({
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 50, // 50 system operations per hour
            message: {
                success: false,
                message: 'Too many system operations, please try again later.',
                error: 'System operation rate limit exceeded',
                code: 'SYSTEM_RATE_LIMIT_EXCEEDED',
                timestamp: new Date().toISOString(),
                retryAfter: '1 hour'
            }
        });
    }

    /**
     * Strict rate limiter for sensitive operations
     */
    get strict() {
        return this.createLimiter({
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 5, // 5 operations per hour
            message: {
                success: false,
                message: 'Too many sensitive operations, please try again later.',
                error: 'Sensitive operation rate limit exceeded',
                code: 'SENSITIVE_RATE_LIMIT_EXCEEDED',
                timestamp: new Date().toISOString(),
                retryAfter: '1 hour'
            }
        });
    }

    /**
     * Create custom rate limiter for specific use cases
     */
    custom(windowMs, max, message) {
        return this.createLimiter({
            windowMs,
            max,
            message: {
                success: false,
                message: message || 'Rate limit exceeded',
                error: 'Custom rate limit exceeded',
                code: 'CUSTOM_RATE_LIMIT_EXCEEDED',
                timestamp: new Date().toISOString()
            }
        });
    }

    /**
     * Progressive rate limiter - increases restrictions based on violations
     */
    progressive(baseMax = 100, windowMs = 15 * 60 * 1000) {
        const violations = new Map();

        return this.createLimiter({
            windowMs,
            max: (req) => {
                const key = req.ip;
                const violationCount = violations.get(key) || 0;
                
                // Reduce limit based on previous violations
                const adjustedMax = Math.max(1, baseMax - (violationCount * 10));
                return adjustedMax;
            },
            onLimitReached: (req) => {
                const key = req.ip;
                const currentViolations = violations.get(key) || 0;
                violations.set(key, currentViolations + 1);
                
                // Clean up old violations after 24 hours
                setTimeout(() => {
                    violations.delete(key);
                }, 24 * 60 * 60 * 1000);
                
                logger.warn(`Progressive rate limit violation for IP: ${req.ip}, Violations: ${currentViolations + 1}`);
            }
        });
    }
}

// Create singleton instance
const rateLimiterMiddleware = new RateLimiterMiddleware();

module.exports = rateLimiterMiddleware;