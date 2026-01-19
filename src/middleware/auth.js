const jwt = require('jsonwebtoken');
const UserRepository = require('../repositories/UserRepository');
const SessionRepository = require('../repositories/SessionRepository');
const logger = require('../utils/logger');

class AuthMiddleware {
    constructor() {
        this.userRepository = new UserRepository();
        this.sessionRepository = new SessionRepository();
        this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    }

    /**
     * Authentication middleware
     */
    async authenticate(req, res, next) {
        try {
            const authHeader = req.headers.authorization;

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                    error: 'No token provided or invalid format',
                    code: 'UNAUTHORIZED',
                    timestamp: new Date().toISOString()
                });
            }

            const token = authHeader.replace('Bearer ', '');

            // Verify JWT token
            let decoded;
            try {
                decoded = jwt.verify(token, this.jwtSecret);
            } catch (jwtError) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token',
                    error: 'Token is invalid or expired',
                    code: 'INVALID_TOKEN',
                    timestamp: new Date().toISOString()
                });
            }

            // Check if session exists and is valid
            const session = await this.sessionRepository.findByToken(token);
            if (!session || session.expires_at < new Date()) {
                return res.status(401).json({
                    success: false,
                    message: 'Session expired',
                    error: 'Session has expired, please login again',
                    code: 'SESSION_EXPIRED',
                    timestamp: new Date().toISOString()
                });
            }

            // Get user details
            const user = await this.userRepository.findById(decoded.id);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found',
                    error: 'User associated with token does not exist',
                    code: 'USER_NOT_FOUND',
                    timestamp: new Date().toISOString()
                });
            }

            // Check if user is active
            if (user.status !== 'active') {
                return res.status(401).json({
                    success: false,
                    message: 'Account inactive',
                    error: 'User account is not active',
                    code: 'ACCOUNT_INACTIVE',
                    timestamp: new Date().toISOString()
                });
            }

            // Attach user to request
            req.user = {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                phone: user.phone,
                email_verified: user.email_verified,
                two_factor_enabled: user.two_factor_enabled
            };

            req.session = {
                id: session.id,
                token: token,
                ip_address: session.ip_address,
                user_agent: session.user_agent,
                created_at: session.created_at,
                expires_at: session.expires_at
            };

            // Update session last activity
            await this.sessionRepository.update(session.id, {
                last_activity_at: new Date(),
                updated_at: new Date()
            });

            next();

        } catch (error) {
            logger.error('AuthMiddleware: Authentication error:', error);
            res.status(500).json({
                success: false,
                message: 'Authentication failed',
                error: error.message,
                code: 'AUTH_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Authorization middleware - check user role
     */
    authorize(roles = []) {
        return (req, res, next) => {
            try {
                if (!req.user) {
                    return res.status(401).json({
                        success: false,
                        message: 'Authentication required',
                        code: 'UNAUTHORIZED',
                        timestamp: new Date().toISOString()
                    });
                }

                // If no roles specified, just check if user is authenticated
                if (roles.length === 0) {
                    return next();
                }

                // Check if user has required role
                if (!roles.includes(req.user.role)) {
                    return res.status(403).json({
                        success: false,
                        message: 'Access denied',
                        error: 'Insufficient permissions for this operation',
                        code: 'FORBIDDEN',
                        timestamp: new Date().toISOString()
                    });
                }

                next();

            } catch (error) {
                logger.error('AuthMiddleware: Authorization error:', error);
                res.status(500).json({
                    success: false,
                    message: 'Authorization failed',
                    error: error.message,
                    code: 'AUTH_ERROR',
                    timestamp: new Date().toISOString()
                });
            }
        };
    }

    /**
     * Optional authentication - doesn't fail if no token
     */
    async optionalAuth(req, res, next) {
        try {
            const authHeader = req.headers.authorization;

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return next();
            }

            const token = authHeader.replace('Bearer ', '');

            try {
                const decoded = jwt.verify(token, this.jwtSecret);
                const user = await this.userRepository.findById(decoded.id);

                if (user && user.status === 'active') {
                    req.user = {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        phone: user.phone,
                        email_verified: user.email_verified,
                        two_factor_enabled: user.two_factor_enabled
                    };
                }
            } catch (jwtError) {
                // Ignore JWT errors for optional auth
            }

            next();

        } catch (error) {
            logger.error('AuthMiddleware: Optional auth error:', error);
            next(); // Continue even if error occurs
        }
    }

    /**
     * Check if email is verified
     */
    requireEmailVerification(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                    code: 'UNAUTHORIZED',
                    timestamp: new Date().toISOString()
                });
            }

            if (!req.user.email_verified) {
                return res.status(403).json({
                    success: false,
                    message: 'Email verification required',
                    error: 'Please verify your email address to access this feature',
                    code: 'EMAIL_NOT_VERIFIED',
                    timestamp: new Date().toISOString()
                });
            }

            next();

        } catch (error) {
            logger.error('AuthMiddleware: Email verification check error:', error);
            res.status(500).json({
                success: false,
                message: 'Verification check failed',
                error: error.message,
                code: 'VERIFICATION_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Check if 2FA is enabled and verified
     */
    require2FA(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                    code: 'UNAUTHORIZED',
                    timestamp: new Date().toISOString()
                });
            }

            if (req.user.two_factor_enabled && !req.session.two_factor_verified) {
                return res.status(403).json({
                    success: false,
                    message: '2FA verification required',
                    error: 'Please complete two-factor authentication',
                    code: '2FA_REQUIRED',
                    timestamp: new Date().toISOString()
                });
            }

            next();

        } catch (error) {
            logger.error('AuthMiddleware: 2FA check error:', error);
            res.status(500).json({
                success: false,
                message: '2FA check failed',
                error: error.message,
                code: '2FA_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Rate limiting for sensitive operations
     */
    sensitiveOperation(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
        const attempts = new Map();

        return (req, res, next) => {
            try {
                const key = req.ip + (req.user ? req.user.id : '');
                const now = Date.now();
                const windowStart = now - windowMs;

                // Clean old attempts
                if (attempts.has(key)) {
                    const userAttempts = attempts.get(key).filter(time => time > windowStart);
                    attempts.set(key, userAttempts);
                } else {
                    attempts.set(key, []);
                }

                const currentAttempts = attempts.get(key);

                if (currentAttempts.length >= maxAttempts) {
                    return res.status(429).json({
                        success: false,
                        message: 'Too many attempts',
                        error: 'Please wait before trying again',
                        code: 'RATE_LIMIT_EXCEEDED',
                        timestamp: new Date().toISOString(),
                        retry_after: Math.ceil(windowMs / 1000)
                    });
                }

                // Record this attempt
                currentAttempts.push(now);
                attempts.set(key, currentAttempts);

                next();

            } catch (error) {
                logger.error('AuthMiddleware: Rate limiting error:', error);
                next(); // Continue on error
            }
        };
    }
}

// Create singleton instance
const authMiddleware = new AuthMiddleware();

// Export middleware functions
module.exports = authMiddleware.authenticate.bind(authMiddleware);
module.exports.authorize = authMiddleware.authorize.bind(authMiddleware);
module.exports.optionalAuth = authMiddleware.optionalAuth.bind(authMiddleware);
module.exports.requireEmailVerification = authMiddleware.requireEmailVerification.bind(authMiddleware);
module.exports.require2FA = authMiddleware.require2FA.bind(authMiddleware);
module.exports.sensitiveOperation = authMiddleware.sensitiveOperation.bind(authMiddleware);