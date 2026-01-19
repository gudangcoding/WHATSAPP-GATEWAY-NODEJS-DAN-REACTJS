const logger = require('../utils/logger');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
    // Log the error
    logger.error('Global error handler:', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    // Default error response
    let statusCode = 500;
    let message = 'Internal Server Error';
    let code = 'INTERNAL_ERROR';

    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
        code = 'VALIDATION_ERROR';
    } else if (err.name === 'UnauthorizedError' || err.message.includes('jwt')) {
        statusCode = 401;
        message = 'Unauthorized';
        code = 'UNAUTHORIZED';
    } else if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid ID format';
        code = 'INVALID_ID';
    } else if (err.code === 'ECONNREFUSED') {
        statusCode = 503;
        message = 'Service Unavailable';
        code = 'SERVICE_UNAVAILABLE';
    } else if (err.statusCode) {
        statusCode = err.statusCode;
        message = err.message;
        code = err.code || 'ERROR';
    }

    // Don't expose internal errors in production
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
        message = 'Something went wrong';
    }

    // Send error response
    res.status(statusCode).json({
        success: false,
        message,
        error: process.env.NODE_ENV === 'development' ? err.message : message,
        code,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        error: `Cannot ${req.method} ${req.path}`,
        code: 'NOT_FOUND',
        timestamp: new Date().toISOString(),
        suggestion: 'Check the API documentation at /api/v1/docs'
    });
};

module.exports = {
    errorHandler,
    notFoundHandler
};