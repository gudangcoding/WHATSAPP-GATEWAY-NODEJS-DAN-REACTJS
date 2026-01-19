const express = require('express');
const router = express.Router();
const auth = require('../../../middleware/auth');
const validation = require('../../../middleware/validation');
const rateLimiter = require('../../../middleware/rateLimiter');
const AuthController = require('../../../controllers/AuthController');

// Create AuthController instance
const authController = new AuthController();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account with email verification
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/register', rateLimiter.register, validation.validateRegister(), authController.register.bind(authController));

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user and return JWT token
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *                         token:
 *                           type: string
 *                           description: JWT access token
 *                           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                         refresh_token:
 *                           type: string
 *                           description: JWT refresh token
 *                         expires_in:
 *                           type: integer
 *                           description: Token expiration time in seconds
 *                           example: 3600
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/login', rateLimiter.login, validation.validateLogin(), authController.login.bind(authController));

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: User logout
 *     description: Invalidate user session and token
 *     tags: [Authentication]
 *     security: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/logout', authController.logout.bind(authController));

/**
 * @swagger
 * /api/v1/auth/profile:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve authenticated user's profile information
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   put:
 *     summary: Update user profile
 *     description: Update authenticated user's profile information
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe Updated
 *               phone:
 *                 type: string
 *                 example: +1234567890
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/profile', auth, authController.getProfile.bind(authController));
router.put('/profile', auth, validation.validateProfile(), authController.updateProfile.bind(authController));

// Password management
router.post('/forgot-password', rateLimiter.forgotPassword, validation.validateEmail(), authController.forgotPassword.bind(authController));
router.post('/reset-password', rateLimiter.resetPassword, validation.validateResetPassword(), authController.resetPassword.bind(authController));
router.post('/change-password', auth, validation.validateChangePassword(), authController.changePassword.bind(authController));

// Token management
router.post('/refresh-token', authController.refreshToken.bind(authController));
router.post('/verify-token', authController.verifyToken.bind(authController));
router.post('/revoke-token', auth, authController.revokeToken.bind(authController));

router.delete('/profile', auth, authController.deleteProfile.bind(authController));

// Account verification
router.post('/verify-email', validation.validateVerificationCode(), authController.verifyEmail.bind(authController));
router.post('/resend-verification', rateLimiter.resendVerification, validation.validateEmail(), authController.resendVerification.bind(authController));

// Two-factor authentication
router.post('/2fa/enable', auth, authController.enable2FA.bind(authController));
router.post('/2fa/disable', auth, validation.validate2FACode(), authController.disable2FA.bind(authController));
router.post('/2fa/verify', validation.validate2FACode(), authController.verify2FA.bind(authController));

// Session management
router.get('/sessions', auth, authController.getSessions.bind(authController));
router.delete('/sessions/:sessionId', auth, authController.revokeSession.bind(authController));
router.delete('/sessions', auth, authController.revokeAllSessions.bind(authController));

module.exports = router;