// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');

// Import middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Import routes
const routes = require('./routes');

// Import Swagger
const { swaggerSpec, swaggerUi, swaggerUiOptions } = require('./swagger/swagger');

// Import core managers
const SessionManager = require('./core/SessionManager');
const SocketManager = require('./core/SocketManager');
const QueueManager = require('./core/QueueManager');

class App {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        
        this.initializeMiddleware();
        this.initializeSwagger();
        this.initializeRoutes();
        this.initializeErrorHandling();
        this.initializeCoreManagers();
    }

    /**
     * Initialize middleware
     */
    initializeMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                    imgSrc: ["'self'", "data:", "https:", "blob:"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com"],
                    connectSrc: ["'self'", "ws:", "wss:"],
                },
            },
        }));

        // CORS configuration
        this.app.use(cors({
            origin: process.env.ALLOWED_ORIGINS?.split(',') || [
                'http://localhost:3000',
                'http://localhost:3001',
                'http://127.0.0.1:3000',
                'http://127.0.0.1:3001'
            ],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
            exposedHeaders: ['X-Request-ID', 'X-Total-Count']
        }));

        // Additional CORS handling for preflight requests
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
            res.header('Access-Control-Allow-Credentials', 'true');
            
            if (req.method === 'OPTIONS') {
                res.status(200).end();
                return;
            }
            next();
        });

        // Compression
        this.app.use(compression());

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 1000, // limit each IP to 1000 requests per windowMs
            message: {
                error: 'Too many requests from this IP, please try again later.',
                retryAfter: '15 minutes'
            },
            standardHeaders: true,
            legacyHeaders: false,
        });
        this.app.use(limiter);

        // Body parsing middleware
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Logging middleware
        this.app.use(morgan('combined', {
            stream: {
                write: (message) => logger.info(message.trim())
            }
        }));

        // Request ID middleware
        this.app.use((req, res, next) => {
            req.id = Math.random().toString(36).substr(2, 9);
            res.setHeader('X-Request-ID', req.id);
            next();
        });

        // Request timing middleware
        this.app.use((req, res, next) => {
            req.startTime = Date.now();
            res.on('finish', () => {
                const duration = Date.now() - req.startTime;
                logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
            });
            next();
        });
    }

    /**
     * Initialize Swagger documentation
     */
    initializeSwagger() {
        // Serve Swagger UI at /api/v1/docs
        this.app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

        // Serve Swagger JSON spec at /api/v1/docs.json
        this.app.get('/api/v1/docs.json', (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(swaggerSpec);
        });

        // Redirect /docs to /api/v1/docs for convenience
        this.app.get('/docs', (req, res) => {
            res.redirect('/api/v1/docs');
        });

        logger.info('📚 Swagger documentation initialized at /api/v1/docs');
    }

    /**
     * Initialize routes
     */
    initializeRoutes() {
        // Serve static files from frontend public directory
        this.app.use(express.static(path.join(__dirname, '../frontend/public')));

        // Mount all API routes
        this.app.use('/', routes);

        // Handle 404 for API routes
        this.app.use('/api/*', (req, res) => {
            res.status(404).json({
                success: false,
                message: 'API endpoint not found',
                path: req.originalUrl,
                method: req.method,
                timestamp: new Date().toISOString(),
                documentation: '/api/v1/docs'
            });
        });

        // Serve React app for all non-API routes (SPA routing)
        this.app.get('*', (req, res) => {
            // Skip if it's an API route or static file request
            if (req.path.startsWith('/api/') || 
                req.path.startsWith('/health') || 
                req.path.startsWith('/docs') ||
                req.path.includes('.')) {
                return res.status(404).json({
                    success: false,
                    message: 'Route not found',
                    path: req.originalUrl,
                    method: req.method,
                    timestamp: new Date().toISOString(),
                    api_documentation: '/api/v1/docs',
                    available_endpoints: {
                        api: '/api/v1',
                        health: '/health',
                        documentation: '/api/v1/docs'
                    }
                });
            }

            // For frontend routes, serve the React app
            const indexPath = path.join(__dirname, '../frontend/public/index.html');
            res.sendFile(indexPath, (err) => {
                if (err) {
                    logger.error('Error serving React app:', err);
                    res.status(500).json({
                        success: false,
                        message: 'Internal server error',
                        timestamp: new Date().toISOString()
                    });
                }
            });
        });
    }

    /**
     * Initialize error handling
     */
    initializeErrorHandling() {
        // Global error handler
        this.app.use(errorHandler);

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception:', error);
            process.exit(1);
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            process.exit(1);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            logger.info('SIGTERM received, shutting down gracefully');
            this.shutdown();
        });

        process.on('SIGINT', () => {
            logger.info('SIGINT received, shutting down gracefully');
            this.shutdown();
        });
    }

    /**
     * Initialize core managers
     */
    async initializeCoreManagers() {
        try {
            // Initialize Queue Manager
            const queueManager = QueueManager.getInstance();
            await queueManager.init();
            logger.info('Queue Manager initialized successfully');

            // Initialize Session Manager
            const sessionManager = SessionManager.getInstance();
            await sessionManager.init();
            logger.info('Session Manager initialized successfully');

            // Initialize Socket Manager
            const socketManager = SocketManager.getInstance();
            await socketManager.init();
            logger.info('Socket Manager initialized successfully');

        } catch (error) {
            logger.error('Error initializing core managers:', error);
            throw error;
        }
    }

    /**
     * Start the server
     */
    async start() {
        try {
            // Initialize core managers first
            await this.initializeCoreManagers();

            // Start HTTP server
            const server = this.app.listen(this.port, () => {
                logger.info(`🚀 WhatsApp Gateway SaaS Backend started successfully!`);
                logger.info(`📡 Server running on port ${this.port}`);
                logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
                logger.info(`📚 API Documentation: http://localhost:${this.port}/api/v1/docs`);
                logger.info(`📋 API Endpoints: http://localhost:${this.port}/api/v1`);
                logger.info(`💡 Health Check: http://localhost:${this.port}/health`);
                logger.info(`📊 System Status: http://localhost:${this.port}/api/v1/system/status`);
            });

            // Initialize Socket.IO with HTTP server
            const socketManager = SocketManager.getInstance();
            socketManager.init(server);

            // Store server reference for graceful shutdown
            this.server = server;

            return server;

        } catch (error) {
            logger.error('Failed to start server:', error);
            throw error;
        }
    }

    /**
     * Graceful shutdown
     */
    async shutdown() {
        try {
            logger.info('Starting graceful shutdown...');

            // Close HTTP server
            if (this.server) {
                await new Promise((resolve) => {
                    this.server.close(resolve);
                });
                logger.info('HTTP server closed');
            }

            // Shutdown core managers
            await QueueManager.shutdown();
            logger.info('Queue Manager shutdown complete');

            await SessionManager.shutdown();
            logger.info('Session Manager shutdown complete');

            await SocketManager.shutdown();
            logger.info('Socket Manager shutdown complete');

            logger.info('Graceful shutdown completed');
            process.exit(0);

        } catch (error) {
            logger.error('Error during shutdown:', error);
            process.exit(1);
        }
    }

    /**
     * Get Express app instance
     */
    getApp() {
        return this.app;
    }
}

// Create and export app instance
const app = new App();

// Start server if this file is run directly
if (require.main === module) {
    app.start().catch((error) => {
        logger.error('Failed to start application:', error);
        process.exit(1);
    });
}

module.exports = app;