const express = require('express');
const router = express.Router();
const SessionController = require('../../../controllers/SessionController');
const auth = require('../../../middleware/auth');
const validation = require('../../../middleware/validation');
const rateLimiter = require('../../../middleware/rateLimiter');

/**
 * @swagger
 * tags:
 *   name: Sessions
 *   description: WhatsApp session management endpoints
 */

/**
 * @swagger
 * /api/v1/sessions:
 *   get:
 *     summary: Get all sessions for authenticated user
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of sessions per page
 *       - in: query
 *         name: device_id
 *         schema:
 *           type: string
 *         description: Filter by device ID
 *     responses:
 *       200:
 *         description: Sessions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', 
    rateLimiter.general,
    auth,
    validation.validatePagination,
    SessionController.getSessions
);

/**
 * @swagger
 * /api/v1/sessions/{sessionId}:
 *   get:
 *     summary: Get session by ID
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Session retrieved successfully
 *       404:
 *         description: Session not found
 *       403:
 *         description: Access denied
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/:sessionId', 
    rateLimiter.general,
    auth,
    validation.validateId('sessionId'),
    SessionController.getSession
);

/**
 * @swagger
 * /api/v1/sessions:
 *   post:
 *     summary: Create new session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - device_id
 *             properties:
 *               device_id:
 *                 type: string
 *                 description: Device ID to create session for
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Session name
 *               settings:
 *                 type: object
 *                 description: Session configuration settings
 *     responses:
 *       201:
 *         description: Session created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Device already has an active session
 *       404:
 *         description: Device not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/', 
    rateLimiter.general,
    auth,
    validation.validateSession,
    SessionController.createSession
);

/**
 * @swagger
 * /api/v1/sessions/{sessionId}:
 *   put:
 *     summary: Update session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               settings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Session updated successfully
 *       404:
 *         description: Session not found
 *       403:
 *         description: Access denied
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put('/:sessionId', 
    rateLimiter.general,
    auth,
    validation.validateId('sessionId'),
    SessionController.updateSession
);

/**
 * @swagger
 * /api/v1/sessions/{sessionId}:
 *   delete:
 *     summary: Delete session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Session deleted successfully
 *       404:
 *         description: Session not found
 *       403:
 *         description: Access denied
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete('/:sessionId', 
    rateLimiter.general,
    auth,
    validation.validateId('sessionId'),
    SessionController.deleteSession
);

/**
 * @swagger
 * /api/v1/sessions/{sessionId}/start:
 *   post:
 *     summary: Start session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Session started successfully
 *       400:
 *         description: Session already active
 *       404:
 *         description: Session not found
 *       403:
 *         description: Access denied
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/:sessionId/start', 
    rateLimiter.general,
    auth,
    validation.validateId('sessionId'),
    SessionController.startSession
);

/**
 * @swagger
 * /api/v1/sessions/{sessionId}/stop:
 *   post:
 *     summary: Stop session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Session stopped successfully
 *       400:
 *         description: Session already inactive
 *       404:
 *         description: Session not found
 *       403:
 *         description: Access denied
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/:sessionId/stop', 
    rateLimiter.general,
    auth,
    validation.validateId('sessionId'),
    SessionController.stopSession
);

/**
 * @swagger
 * /api/v1/sessions/{sessionId}/status:
 *   get:
 *     summary: Get session status
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Session status retrieved successfully
 *       404:
 *         description: Session not found
 *       403:
 *         description: Access denied
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/:sessionId/status', 
    rateLimiter.general,
    auth,
    validation.validateId('sessionId'),
    SessionController.getSessionStatus
);

/**
 * @swagger
 * /api/v1/sessions/stats:
 *   get:
 *     summary: Get session statistics
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d, 90d]
 *           default: 30d
 *         description: Statistics period
 *       - in: query
 *         name: device_id
 *         schema:
 *           type: string
 *         description: Filter by device ID
 *     responses:
 *       200:
 *         description: Session statistics retrieved successfully
 *       404:
 *         description: Device not found (if device_id provided)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/stats', 
    rateLimiter.analytics,
    auth,
    SessionController.getSessionStats
);

module.exports = router;