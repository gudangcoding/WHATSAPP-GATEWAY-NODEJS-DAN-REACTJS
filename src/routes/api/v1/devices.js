const express = require('express');
const router = express.Router();
const DeviceController = require('../../../controllers/DeviceController');
const auth = require('../../../middleware/auth');
const validation = require('../../../middleware/validation');
const rateLimiter = require('../../../middleware/rateLimiter');

/**
 * @swagger
 * tags:
 *   name: Devices
 *   description: WhatsApp device management endpoints
 */

/**
 * @swagger
 * /api/v1/devices:
 *   get:
 *     summary: Get all devices for authenticated user
 *     tags: [Devices]
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
 *         description: Number of devices per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search devices by name or phone number
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [connected, disconnected, connecting, error]
 *         description: Filter by device status
 *     responses:
 *       200:
 *         description: Devices retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', 
    rateLimiter.general,
    auth,
    validation.validatePagination(),
    DeviceController.getDevices
);

/**
 * @swagger
 * /api/v1/devices/{deviceId}:
 *   get:
 *     summary: Get device by ID
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     responses:
 *       200:
 *         description: Device retrieved successfully
 *       404:
 *         description: Device not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/:deviceId', 
    rateLimiter.general,
    auth,
    validation.validateId('deviceId'),
    DeviceController.getDevice
);

/**
 * @swagger
 * /api/v1/devices:
 *   post:
 *     summary: Create new device
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone_number
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Device name
 *               phone_number:
 *                 type: string
 *                 pattern: '^\\+?[1-9]\\d{1,14}$'
 *                 description: WhatsApp phone number
 *               webhook_url:
 *                 type: string
 *                 format: uri
 *                 description: Webhook URL for notifications
 *               settings:
 *                 type: object
 *                 description: Device configuration settings
 *     responses:
 *       201:
 *         description: Device created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Phone number already exists
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/', 
    rateLimiter.general,
    auth,
    validation.validateDevice(),
    DeviceController.createDevice
);

/**
 * @swagger
 * /api/v1/devices/{deviceId}:
 *   put:
 *     summary: Update device
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
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
 *               webhook_url:
 *                 type: string
 *                 format: uri
 *               settings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Device updated successfully
 *       404:
 *         description: Device not found
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put('/:deviceId', 
    rateLimiter.general,
    auth,
    validation.validateId('deviceId'),
    validation.validateDeviceConfig(),
    DeviceController.updateDevice
);

/**
 * @swagger
 * /api/v1/devices/{deviceId}:
 *   delete:
 *     summary: Delete device
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     responses:
 *       200:
 *         description: Device deleted successfully
 *       404:
 *         description: Device not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete('/:deviceId', 
    rateLimiter.general,
    auth,
    validation.validateId('deviceId'),
    DeviceController.deleteDevice
);

/**
 * @swagger
 * /api/v1/devices/{deviceId}/connect:
 *   post:
 *     summary: Connect device to WhatsApp
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     responses:
 *       200:
 *         description: Device connection initiated
 *       400:
 *         description: Device already connected
 *       404:
 *         description: Device not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/:deviceId/connect', 
    rateLimiter.general,
    auth,
    validation.validateId('deviceId'),
    DeviceController.connectDevice
);

/**
 * @swagger
 * /api/v1/devices/{deviceId}/disconnect:
 *   post:
 *     summary: Disconnect device from WhatsApp
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     responses:
 *       200:
 *         description: Device disconnected successfully
 *       400:
 *         description: Device already disconnected
 *       404:
 *         description: Device not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/:deviceId/disconnect', 
    rateLimiter.general,
    auth,
    validation.validateId('deviceId'),
    DeviceController.disconnectDevice
);

/**
 * @swagger
 * /api/v1/devices/{deviceId}/restart:
 *   post:
 *     summary: Restart device connection
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     responses:
 *       200:
 *         description: Device restart initiated
 *       404:
 *         description: Device not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/:deviceId/restart', 
    rateLimiter.general,
    auth,
    validation.validateId('deviceId'),
    DeviceController.restartDevice
);

/**
 * @swagger
 * /api/v1/devices/{deviceId}/qr:
 *   get:
 *     summary: Get device QR code
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     responses:
 *       200:
 *         description: QR code retrieved successfully
 *       404:
 *         description: QR code not available or device not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/:deviceId/qr', 
    rateLimiter.general,
    auth,
    validation.validateId('deviceId'),
    DeviceController.getQRCode
);

/**
 * @swagger
 * /api/v1/devices/{deviceId}/status:
 *   get:
 *     summary: Get device status
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     responses:
 *       200:
 *         description: Device status retrieved successfully
 *       404:
 *         description: Device not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/:deviceId/status', 
    rateLimiter.general,
    auth,
    validation.validateId('deviceId'),
    DeviceController.getDeviceStatus
);

/**
 * @swagger
 * /api/v1/devices/stats:
 *   get:
 *     summary: Get device statistics
 *     tags: [Devices]
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
 *     responses:
 *       200:
 *         description: Device statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/stats', 
    rateLimiter.analytics,
    auth,
    DeviceController.getDeviceStats
);

module.exports = router;