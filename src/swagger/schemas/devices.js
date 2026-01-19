/**
 * @swagger
 * /api/v1/devices:
 *   get:
 *     summary: Get all devices
 *     description: Retrieve all WhatsApp devices for the authenticated user
 *     tags: [Devices]
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - name: status
 *         in: query
 *         description: Filter by device status
 *         schema:
 *           type: string
 *           enum: [connected, disconnected, connecting, error]
 *       - name: search
 *         in: query
 *         description: Search by device name or phone number
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Devices retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Device'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   post:
 *     summary: Create a new device
 *     description: Register a new WhatsApp device
 *     tags: [Devices]
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
 *                 description: Device name
 *                 example: My Business WhatsApp
 *               phone_number:
 *                 type: string
 *                 description: WhatsApp phone number
 *                 example: +1234567890
 *               webhook_url:
 *                 type: string
 *                 format: uri
 *                 description: Webhook URL for notifications
 *                 example: https://example.com/webhook
 *               settings:
 *                 type: object
 *                 description: Device configuration settings
 *     responses:
 *       201:
 *         description: Device created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Device'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         description: Phone number already registered
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * 
 * /api/v1/devices/{deviceId}:
 *   get:
 *     summary: Get device details
 *     description: Retrieve detailed information about a specific device
 *     tags: [Devices]
 *     parameters:
 *       - name: deviceId
 *         in: path
 *         required: true
 *         description: Device ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Device details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Device'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   put:
 *     summary: Update device
 *     description: Update device information and settings
 *     tags: [Devices]
 *     parameters:
 *       - name: deviceId
 *         in: path
 *         required: true
 *         description: Device ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Device name
 *               webhook_url:
 *                 type: string
 *                 format: uri
 *                 description: Webhook URL for notifications
 *               settings:
 *                 type: object
 *                 description: Device configuration settings
 *     responses:
 *       200:
 *         description: Device updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Device'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   delete:
 *     summary: Delete device
 *     description: Remove a device and all associated data
 *     tags: [Devices]
 *     parameters:
 *       - name: deviceId
 *         in: path
 *         required: true
 *         description: Device ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Device deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * 
 * /api/v1/devices/{deviceId}/qr:
 *   get:
 *     summary: Get QR code
 *     description: Retrieve the current QR code for device pairing
 *     tags: [Devices]
 *     parameters:
 *       - name: deviceId
 *         in: path
 *         required: true
 *         description: Device ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: QR code retrieved successfully
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
 *                         qr_code:
 *                           type: string
 *                           description: Base64 encoded QR code image
 *                         qr_text:
 *                           type: string
 *                           description: QR code text content
 *                         expires_at:
 *                           type: string
 *                           format: date-time
 *                           description: QR code expiration time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   post:
 *     summary: Refresh QR code
 *     description: Generate a new QR code for device pairing
 *     tags: [Devices]
 *     parameters:
 *       - name: deviceId
 *         in: path
 *         required: true
 *         description: Device ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: QR code refreshed successfully
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
 *                         qr_code:
 *                           type: string
 *                           description: Base64 encoded QR code image
 *                         qr_text:
 *                           type: string
 *                           description: QR code text content
 *                         expires_at:
 *                           type: string
 *                           format: date-time
 *                           description: QR code expiration time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * 
 * /api/v1/devices/{deviceId}/connect:
 *   post:
 *     summary: Connect device
 *     description: Establish WhatsApp connection for the device
 *     tags: [Devices]
 *     parameters:
 *       - name: deviceId
 *         in: path
 *         required: true
 *         description: Device ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Device connection initiated
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
 *                         status:
 *                           type: string
 *                           example: connecting
 *                         message:
 *                           type: string
 *                           example: Connection initiated, scan QR code to complete
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         description: Device already connected
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * 
 * /api/v1/devices/{deviceId}/disconnect:
 *   post:
 *     summary: Disconnect device
 *     description: Disconnect WhatsApp connection for the device
 *     tags: [Devices]
 *     parameters:
 *       - name: deviceId
 *         in: path
 *         required: true
 *         description: Device ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Device disconnected successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

module.exports = {};