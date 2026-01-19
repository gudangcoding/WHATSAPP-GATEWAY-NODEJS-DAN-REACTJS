const express = require('express');
const router = express.Router();
const auth = require('../../../middleware/auth');
const SystemController = require('../../../controllers/SystemController');

// System health and status
router.get('/health', SystemController.getSystemHealth);
router.get('/status', auth, SystemController.getSystemStatus);
router.get('/info', SystemController.getSystemInfo);

// System monitoring
router.get('/metrics', auth, SystemController.getSystemMetrics);
router.get('/performance', auth, SystemController.getPerformanceMetrics);
router.get('/resources', auth, SystemController.getResourceUsage);

// System logs
router.get('/logs', auth, SystemController.getSystemLogs);
router.get('/logs/errors', auth, SystemController.getErrorLogs);
router.get('/logs/activities', auth, SystemController.getActivityLogs);

// Queue monitoring
router.get('/queues', auth, SystemController.getQueueStatus);
router.get('/queues/:queueName', auth, SystemController.getQueueDetails);
router.post('/queues/:queueName/clear', auth, SystemController.clearQueue);

// Background jobs
router.get('/jobs', auth, SystemController.getActiveJobs);
router.get('/jobs/:jobId', auth, SystemController.getJobDetails);
router.post('/jobs/:jobId/retry', auth, SystemController.retryJob);
router.delete('/jobs/:jobId', auth, SystemController.cancelJob);

// Database operations
router.get('/database/status', auth, SystemController.getDatabaseStatus);
router.post('/database/backup', auth, SystemController.createBackup);
router.get('/database/backups', auth, SystemController.getBackups);

// Cache operations
router.get('/cache/status', auth, SystemController.getCacheStatus);
router.post('/cache/clear', auth, SystemController.clearCache);
router.post('/cache/flush', auth, SystemController.flushCache);

// System maintenance
router.post('/maintenance/enable', auth, SystemController.enableMaintenanceMode);
router.post('/maintenance/disable', auth, SystemController.disableMaintenanceMode);
router.get('/maintenance/status', SystemController.getMaintenanceStatus);

module.exports = router;