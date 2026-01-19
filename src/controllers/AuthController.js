const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const UserRepository = require('../repositories/UserRepository');
const SessionRepository = require('../repositories/SessionRepository');
const logger = require('../utils/logger');
const { sendEmail } = require('../utils/emailService');

class AuthController {
    constructor() {
        this.userRepository = new UserRepository();
        this.sessionRepository = new SessionRepository();
        this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
        this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
        this.refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
    }

    /**
     * Register new user
     */
    async register(req, res) {
        try {
            const { email, password, name, phone } = req.body;

            // Check if user already exists
            const existingUser = await this.userRepository.findByEmail(email);
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'Email already registered',
                    error: 'User with this email already exists',
                    code: 'EMAIL_EXISTS',
                    timestamp: new Date().toISOString()
                });
            }

            // Hash password
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Generate verification token
            const verificationToken = crypto.randomBytes(32).toString('hex');

            // Create user
            const userData = {
                email,
                password: hashedPassword,
                name,
                phone,
                role: 'user',
                status: 'inactive',
                email_verified: false,
                verification_token: verificationToken,
                two_factor_enabled: false,
                created_at: new Date(),
                updated_at: new Date()
            };

            const user = await this.userRepository.create(userData);

            // Send verification email
            try {
                await this.sendVerificationEmail(user.email, user.name, verificationToken);
            } catch (emailError) {
                logger.error('AuthController: Failed to send verification email:', emailError);
                // Continue with registration even if email fails
            }

            // Remove sensitive data from response
            const { password: _, verification_token: __, ...userResponse } = user;

            logger.info(`AuthController: User registered successfully - ID: ${user.id}, Email: ${email}`);

            res.status(201).json({
                success: true,
                message: 'User registered successfully. Please check your email for verification.',
                data: userResponse
            });

        } catch (error) {
            logger.error('AuthController: Error registering user:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to register user',
                error: error.message,
                code: 'REGISTRATION_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * User login
     */
    async login(req, res) {
        try {
            const { email, password, remember_me = false } = req.body;

            // Find user by email
            const user = await this.userRepository.findByEmail(email);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials',
                    error: 'Email or password is incorrect',
                    code: 'INVALID_CREDENTIALS',
                    timestamp: new Date().toISOString()
                });
            }

            // Check if user is active
            if (user.status !== 'active') {
                return res.status(401).json({
                    success: false,
                    message: 'Account is not active',
                    error: 'Please verify your email or contact support',
                    code: 'ACCOUNT_INACTIVE',
                    timestamp: new Date().toISOString()
                });
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials',
                    error: 'Email or password is incorrect',
                    code: 'INVALID_CREDENTIALS',
                    timestamp: new Date().toISOString()
                });
            }

            // Generate tokens
            const tokenPayload = {
                id: user.id,
                email: user.email,
                role: user.role
            };

            const expiresIn = remember_me ? '30d' : this.jwtExpiresIn;
            const accessToken = jwt.sign(tokenPayload, this.jwtSecret, { expiresIn });
            const refreshToken = jwt.sign(tokenPayload, this.jwtSecret, { 
                expiresIn: this.refreshTokenExpiresIn 
            });

            // Create session record
            const sessionData = {
                user_id: user.id,
                token: accessToken,
                refresh_token: refreshToken,
                ip_address: req.ip,
                user_agent: req.get('User-Agent'),
                expires_at: new Date(Date.now() + (remember_me ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)),
                created_at: new Date()
            };

            await this.sessionRepository.create(sessionData);

            // Update last login
            await this.userRepository.update(user.id, {
                last_login_at: new Date(),
                last_login_ip: req.ip,
                updated_at: new Date()
            });

            // Remove sensitive data from response
            const { password: _, verification_token: __, ...userResponse } = user;

            logger.info(`AuthController: User logged in successfully - ID: ${user.id}, Email: ${email}`);

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    user: userResponse,
                    token: accessToken,
                    refresh_token: refreshToken,
                    expires_in: remember_me ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // seconds
                    token_type: 'Bearer'
                }
            });

        } catch (error) {
            logger.error('AuthController: Error during login:', error);
            res.status(500).json({
                success: false,
                message: 'Login failed',
                error: error.message,
                code: 'LOGIN_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * User logout
     */
    async logout(req, res) {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            
            if (token) {
                // Invalidate session
                await this.sessionRepository.deleteByToken(token);
                logger.info(`AuthController: User logged out - Token invalidated`);
            }

            res.json({
                success: true,
                message: 'Logout successful'
            });

        } catch (error) {
            logger.error('AuthController: Error during logout:', error);
            res.status(500).json({
                success: false,
                message: 'Logout failed',
                error: error.message,
                code: 'LOGOUT_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get user profile
     */
    async getProfile(req, res) {
        try {
            const userId = req.user.id;

            const user = await this.userRepository.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                    error: 'User profile does not exist',
                    code: 'USER_NOT_FOUND',
                    timestamp: new Date().toISOString()
                });
            }

            // Remove sensitive data
            const { password: _, verification_token: __, ...userProfile } = user;

            res.json({
                success: true,
                message: 'Profile retrieved successfully',
                data: userProfile
            });

        } catch (error) {
            logger.error('AuthController: Error getting profile:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get profile',
                error: error.message,
                code: 'PROFILE_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(req, res) {
        try {
            const userId = req.user.id;
            const { name, phone } = req.body;

            const updateData = {
                updated_at: new Date()
            };

            if (name) updateData.name = name;
            if (phone) updateData.phone = phone;

            const updatedUser = await this.userRepository.update(userId, updateData);

            // Remove sensitive data
            const { password: _, verification_token: __, ...userProfile } = updatedUser;

            logger.info(`AuthController: Profile updated successfully - User ID: ${userId}`);

            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: userProfile
            });

        } catch (error) {
            logger.error('AuthController: Error updating profile:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update profile',
                error: error.message,
                code: 'PROFILE_UPDATE_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Delete user profile
     */
    async deleteProfile(req, res) {
        try {
            const userId = req.user.id;

            // Soft delete user
            await this.userRepository.update(userId, {
                status: 'deleted',
                deleted_at: new Date(),
                updated_at: new Date()
            });

            // Invalidate all sessions
            await this.sessionRepository.deleteByUserId(userId);

            logger.info(`AuthController: Profile deleted successfully - User ID: ${userId}`);

            res.json({
                success: true,
                message: 'Profile deleted successfully'
            });

        } catch (error) {
            logger.error('AuthController: Error deleting profile:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete profile',
                error: error.message,
                code: 'PROFILE_DELETE_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Forgot password
     */
    async forgotPassword(req, res) {
        try {
            const { email } = req.body;

            const user = await this.userRepository.findByEmail(email);
            if (!user) {
                // Don't reveal if email exists or not for security
                return res.json({
                    success: true,
                    message: 'If the email exists, a password reset link has been sent'
                });
            }

            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

            // Save reset token
            await this.userRepository.update(user.id, {
                reset_token: resetToken,
                reset_token_expires: resetTokenExpires,
                updated_at: new Date()
            });

            // Send reset email
            try {
                await this.sendPasswordResetEmail(user.email, user.name, resetToken);
            } catch (emailError) {
                logger.error('AuthController: Failed to send reset email:', emailError);
            }

            logger.info(`AuthController: Password reset requested - Email: ${email}`);

            res.json({
                success: true,
                message: 'If the email exists, a password reset link has been sent'
            });

        } catch (error) {
            logger.error('AuthController: Error in forgot password:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process password reset request',
                error: error.message,
                code: 'FORGOT_PASSWORD_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Reset password
     */
    async resetPassword(req, res) {
        try {
            const { token, password } = req.body;

            const user = await this.userRepository.findByResetToken(token);
            if (!user || user.reset_token_expires < new Date()) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired reset token',
                    error: 'Password reset token is invalid or has expired',
                    code: 'INVALID_RESET_TOKEN',
                    timestamp: new Date().toISOString()
                });
            }

            // Hash new password
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Update password and clear reset token
            await this.userRepository.update(user.id, {
                password: hashedPassword,
                reset_token: null,
                reset_token_expires: null,
                updated_at: new Date()
            });

            // Invalidate all sessions for security
            await this.sessionRepository.deleteByUserId(user.id);

            logger.info(`AuthController: Password reset successfully - User ID: ${user.id}`);

            res.json({
                success: true,
                message: 'Password reset successfully'
            });

        } catch (error) {
            logger.error('AuthController: Error resetting password:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to reset password',
                error: error.message,
                code: 'RESET_PASSWORD_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Change password
     */
    async changePassword(req, res) {
        try {
            const userId = req.user.id;
            const { current_password, new_password } = req.body;

            const user = await this.userRepository.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                    code: 'USER_NOT_FOUND',
                    timestamp: new Date().toISOString()
                });
            }

            // Verify current password
            const isCurrentPasswordValid = await bcrypt.compare(current_password, user.password);
            if (!isCurrentPasswordValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password is incorrect',
                    error: 'The provided current password does not match',
                    code: 'INVALID_CURRENT_PASSWORD',
                    timestamp: new Date().toISOString()
                });
            }

            // Hash new password
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(new_password, saltRounds);

            // Update password
            await this.userRepository.update(userId, {
                password: hashedPassword,
                updated_at: new Date()
            });

            logger.info(`AuthController: Password changed successfully - User ID: ${userId}`);

            res.json({
                success: true,
                message: 'Password changed successfully'
            });

        } catch (error) {
            logger.error('AuthController: Error changing password:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to change password',
                error: error.message,
                code: 'CHANGE_PASSWORD_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Refresh token
     */
    async refreshToken(req, res) {
        try {
            const { refresh_token } = req.body;

            if (!refresh_token) {
                return res.status(400).json({
                    success: false,
                    message: 'Refresh token is required',
                    code: 'REFRESH_TOKEN_REQUIRED',
                    timestamp: new Date().toISOString()
                });
            }

            // Verify refresh token
            let decoded;
            try {
                decoded = jwt.verify(refresh_token, this.jwtSecret);
            } catch (jwtError) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid refresh token',
                    error: 'Refresh token is invalid or expired',
                    code: 'INVALID_REFRESH_TOKEN',
                    timestamp: new Date().toISOString()
                });
            }

            // Find user
            const user = await this.userRepository.findById(decoded.id);
            if (!user || user.status !== 'active') {
                return res.status(401).json({
                    success: false,
                    message: 'User not found or inactive',
                    code: 'USER_INACTIVE',
                    timestamp: new Date().toISOString()
                });
            }

            // Generate new access token
            const tokenPayload = {
                id: user.id,
                email: user.email,
                role: user.role
            };

            const accessToken = jwt.sign(tokenPayload, this.jwtSecret, { 
                expiresIn: this.jwtExpiresIn 
            });

            res.json({
                success: true,
                message: 'Token refreshed successfully',
                data: {
                    token: accessToken,
                    expires_in: 24 * 60 * 60, // 24 hours in seconds
                    token_type: 'Bearer'
                }
            });

        } catch (error) {
            logger.error('AuthController: Error refreshing token:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to refresh token',
                error: error.message,
                code: 'REFRESH_TOKEN_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Verify token
     */
    async verifyToken(req, res) {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'Token is required',
                    code: 'TOKEN_REQUIRED',
                    timestamp: new Date().toISOString()
                });
            }

            try {
                const decoded = jwt.verify(token, this.jwtSecret);
                
                res.json({
                    success: true,
                    message: 'Token is valid',
                    data: {
                        valid: true,
                        user_id: decoded.id,
                        email: decoded.email,
                        role: decoded.role,
                        expires_at: new Date(decoded.exp * 1000)
                    }
                });

            } catch (jwtError) {
                res.status(401).json({
                    success: false,
                    message: 'Invalid token',
                    error: 'Token is invalid or expired',
                    code: 'INVALID_TOKEN',
                    timestamp: new Date().toISOString()
                });
            }

        } catch (error) {
            logger.error('AuthController: Error verifying token:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to verify token',
                error: error.message,
                code: 'TOKEN_VERIFICATION_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Revoke token
     */
    async revokeToken(req, res) {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            
            if (token) {
                await this.sessionRepository.deleteByToken(token);
            }

            res.json({
                success: true,
                message: 'Token revoked successfully'
            });

        } catch (error) {
            logger.error('AuthController: Error revoking token:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to revoke token',
                error: error.message,
                code: 'TOKEN_REVOKE_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Verify email
     */
    async verifyEmail(req, res) {
        try {
            const { token } = req.body;

            const user = await this.userRepository.findByVerificationToken(token);
            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid verification token',
                    error: 'Email verification token is invalid',
                    code: 'INVALID_VERIFICATION_TOKEN',
                    timestamp: new Date().toISOString()
                });
            }

            // Update user as verified and active
            await this.userRepository.update(user.id, {
                email_verified: true,
                status: 'active',
                verification_token: null,
                email_verified_at: new Date(),
                updated_at: new Date()
            });

            logger.info(`AuthController: Email verified successfully - User ID: ${user.id}`);

            res.json({
                success: true,
                message: 'Email verified successfully'
            });

        } catch (error) {
            logger.error('AuthController: Error verifying email:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to verify email',
                error: error.message,
                code: 'EMAIL_VERIFICATION_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Resend verification email
     */
    async resendVerification(req, res) {
        try {
            const { email } = req.body;

            const user = await this.userRepository.findByEmail(email);
            if (!user) {
                return res.json({
                    success: true,
                    message: 'If the email exists and is not verified, a verification email has been sent'
                });
            }

            if (user.email_verified) {
                return res.json({
                    success: true,
                    message: 'Email is already verified'
                });
            }

            // Generate new verification token
            const verificationToken = crypto.randomBytes(32).toString('hex');

            await this.userRepository.update(user.id, {
                verification_token: verificationToken,
                updated_at: new Date()
            });

            // Send verification email
            try {
                await this.sendVerificationEmail(user.email, user.name, verificationToken);
            } catch (emailError) {
                logger.error('AuthController: Failed to send verification email:', emailError);
            }

            res.json({
                success: true,
                message: 'If the email exists and is not verified, a verification email has been sent'
            });

        } catch (error) {
            logger.error('AuthController: Error resending verification:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to resend verification email',
                error: error.message,
                code: 'RESEND_VERIFICATION_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Enable 2FA (stub implementation)
     */
    async enable2FA(req, res) {
        try {
            const userId = req.user.id;

            // Generate 2FA secret (in real implementation, use speakeasy or similar)
            const secret = crypto.randomBytes(16).toString('hex');

            await this.userRepository.update(userId, {
                two_factor_enabled: true,
                two_factor_secret: secret,
                updated_at: new Date()
            });

            res.json({
                success: true,
                message: '2FA enabled successfully',
                data: {
                    secret: secret,
                    qr_code: `otpauth://totp/WhatsAppGateway:${req.user.email}?secret=${secret}&issuer=WhatsAppGateway`
                }
            });

        } catch (error) {
            logger.error('AuthController: Error enabling 2FA:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to enable 2FA',
                error: error.message,
                code: '2FA_ENABLE_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Disable 2FA (stub implementation)
     */
    async disable2FA(req, res) {
        try {
            const userId = req.user.id;

            await this.userRepository.update(userId, {
                two_factor_enabled: false,
                two_factor_secret: null,
                updated_at: new Date()
            });

            res.json({
                success: true,
                message: '2FA disabled successfully'
            });

        } catch (error) {
            logger.error('AuthController: Error disabling 2FA:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to disable 2FA',
                error: error.message,
                code: '2FA_DISABLE_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Verify 2FA (stub implementation)
     */
    async verify2FA(req, res) {
        try {
            const { code } = req.body;

            // In real implementation, verify TOTP code
            const isValidCode = code === '123456'; // Stub validation

            if (!isValidCode) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid 2FA code',
                    code: 'INVALID_2FA_CODE',
                    timestamp: new Date().toISOString()
                });
            }

            res.json({
                success: true,
                message: '2FA code verified successfully'
            });

        } catch (error) {
            logger.error('AuthController: Error verifying 2FA:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to verify 2FA code',
                error: error.message,
                code: '2FA_VERIFY_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get user sessions
     */
    async getSessions(req, res) {
        try {
            const userId = req.user.id;

            const sessions = await this.sessionRepository.findByUserId(userId);

            res.json({
                success: true,
                message: 'Sessions retrieved successfully',
                data: sessions.map(session => ({
                    id: session.id,
                    ip_address: session.ip_address,
                    user_agent: session.user_agent,
                    created_at: session.created_at,
                    expires_at: session.expires_at,
                    is_current: session.token === req.headers.authorization?.replace('Bearer ', '')
                }))
            });

        } catch (error) {
            logger.error('AuthController: Error getting sessions:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get sessions',
                error: error.message,
                code: 'GET_SESSIONS_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Revoke specific session
     */
    async revokeSession(req, res) {
        try {
            const { sessionId } = req.params;
            const userId = req.user.id;

            const session = await this.sessionRepository.findById(sessionId);
            if (!session || session.user_id !== userId) {
                return res.status(404).json({
                    success: false,
                    message: 'Session not found',
                    code: 'SESSION_NOT_FOUND',
                    timestamp: new Date().toISOString()
                });
            }

            await this.sessionRepository.delete(sessionId);

            res.json({
                success: true,
                message: 'Session revoked successfully'
            });

        } catch (error) {
            logger.error('AuthController: Error revoking session:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to revoke session',
                error: error.message,
                code: 'REVOKE_SESSION_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Revoke all sessions
     */
    async revokeAllSessions(req, res) {
        try {
            const userId = req.user.id;

            await this.sessionRepository.deleteByUserId(userId);

            res.json({
                success: true,
                message: 'All sessions revoked successfully'
            });

        } catch (error) {
            logger.error('AuthController: Error revoking all sessions:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to revoke all sessions',
                error: error.message,
                code: 'REVOKE_ALL_SESSIONS_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    // Helper methods

    /**
     * Send verification email
     */
    async sendVerificationEmail(email, name, token) {
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
        
        const emailContent = {
            to: email,
            subject: 'Verify Your Email - WhatsApp Gateway SaaS',
            html: `
                <h2>Welcome to WhatsApp Gateway SaaS!</h2>
                <p>Hello ${name},</p>
                <p>Thank you for registering. Please click the link below to verify your email address:</p>
                <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p>${verificationUrl}</p>
                <p>This link will expire in 24 hours.</p>
                <p>Best regards,<br>WhatsApp Gateway SaaS Team</p>
            `
        };

        await sendEmail(emailContent);
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(email, name, token) {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
        
        const emailContent = {
            to: email,
            subject: 'Password Reset - WhatsApp Gateway SaaS',
            html: `
                <h2>Password Reset Request</h2>
                <p>Hello ${name},</p>
                <p>You requested a password reset. Click the link below to reset your password:</p>
                <a href="${resetUrl}" style="background-color: #f44336; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p>${resetUrl}</p>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this reset, please ignore this email.</p>
                <p>Best regards,<br>WhatsApp Gateway SaaS Team</p>
            `
        };

        await sendEmail(emailContent);
    }
}

module.exports = AuthController;