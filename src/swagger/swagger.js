const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'WhatsApp Gateway SaaS API',
    version: '1.0.0',
    description: `
# WhatsApp Gateway SaaS Backend API

Production-ready WhatsApp Gateway SaaS backend with comprehensive multi-user/multi-device support.

## Features

- **Multi-user & Multi-device support** - Manage multiple WhatsApp accounts
- **Session persistence & auto-reconnect** - Reliable connection management
- **Real-time QR code management** - Instant QR code generation and updates
- **All message types support** - Text, image, video, audio, document, location, contact
- **Contact scraping & management** - Automated contact extraction and organization
- **Auto-reply engine** - Intelligent automated responses with rule-based system
- **Campaign & blast messaging** - Mass messaging with targeting and scheduling
- **AI integration** - 9 core AI features for content optimization and analysis
- **Webhook notifications** - Real-time event notifications
- **Analytics & reporting** - Comprehensive performance metrics and insights
- **System monitoring** - Health checks, performance metrics, and system management

## Technology Stack

- **Backend**: Node.js + Express.js
- **WhatsApp**: Baileys Library (Multi-device support)
- **Database**: MySQL with connection pooling
- **Cache**: Redis for session and data caching
- **Real-time**: Socket.IO for live updates
- **Queue**: Bull Queue for background processing
- **AI**: OpenAI Integration with 9 features
- **Process Manager**: PM2 for production deployment

## Authentication

This API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## Rate Limiting

API requests are rate-limited to prevent abuse:
- **Global limit**: 1000 requests per 15 minutes per IP
- **Authentication endpoints**: Additional stricter limits
- **Bulk operations**: Special handling for large operations

## Response Format

All API responses follow a consistent format:

### Success Response
\`\`\`json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
\`\`\`

### Error Response
\`\`\`json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-19T10:30:00.000Z"
}
\`\`\`

## WebSocket Events

Real-time updates are available via Socket.IO on these events:
- \`qr_code\` - QR code updates
- \`connection_status\` - Device connection status
- \`message_received\` - Incoming messages
- \`message_sent\` - Message delivery status
- \`campaign_progress\` - Campaign execution updates

## Support

For technical support and documentation:
- **API Documentation**: Available at \`/api/v1/docs\`
- **Health Check**: \`/health\`
- **System Status**: \`/api/v1/system/status\`
    `,
    contact: {
      name: 'WhatsApp Gateway SaaS Support',
      email: 'support@whatsapp-gateway.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server'
    },
    {
      url: 'https://api.whatsapp-gateway.com',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"'
      }
    },
    schemas: {
      // Common schemas will be defined here
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          message: {
            type: 'string',
            example: 'Error description'
          },
          error: {
            type: 'string',
            example: 'Detailed error message'
          },
          code: {
            type: 'string',
            example: 'ERROR_CODE'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-19T10:30:00.000Z'
          }
        }
      },
      Success: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string',
            example: 'Operation completed successfully'
          },
          data: {
            type: 'object',
            description: 'Response data'
          }
        }
      },
      Pagination: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            example: 1,
            description: 'Current page number'
          },
          limit: {
            type: 'integer',
            example: 10,
            description: 'Number of items per page'
          },
          total: {
            type: 'integer',
            example: 100,
            description: 'Total number of items'
          },
          pages: {
            type: 'integer',
            example: 10,
            description: 'Total number of pages'
          }
        }
      }
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication information is missing or invalid',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              success: false,
              message: 'Authentication required',
              error: 'No token provided',
              code: 'UNAUTHORIZED',
              timestamp: '2024-01-19T10:30:00.000Z'
            }
          }
        }
      },
      ForbiddenError: {
        description: 'Access denied',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              success: false,
              message: 'Access denied',
              error: 'Insufficient permissions',
              code: 'FORBIDDEN',
              timestamp: '2024-01-19T10:30:00.000Z'
            }
          }
        }
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              success: false,
              message: 'Resource not found',
              error: 'The requested resource does not exist',
              code: 'NOT_FOUND',
              timestamp: '2024-01-19T10:30:00.000Z'
            }
          }
        }
      },
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              success: false,
              message: 'Validation failed',
              error: 'Invalid input data',
              code: 'VALIDATION_ERROR',
              timestamp: '2024-01-19T10:30:00.000Z'
            }
          }
        }
      },
      RateLimitError: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              success: false,
              message: 'Rate limit exceeded',
              error: 'Too many requests from this IP',
              code: 'RATE_LIMIT_EXCEEDED',
              timestamp: '2024-01-19T10:30:00.000Z'
            }
          }
        }
      },
      ServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              success: false,
              message: 'Internal server error',
              error: 'An unexpected error occurred',
              code: 'INTERNAL_ERROR',
              timestamp: '2024-01-19T10:30:00.000Z'
            }
          }
        }
      }
    },
    parameters: {
      PageParam: {
        name: 'page',
        in: 'query',
        description: 'Page number for pagination',
        required: false,
        schema: {
          type: 'integer',
          minimum: 1,
          default: 1
        }
      },
      LimitParam: {
        name: 'limit',
        in: 'query',
        description: 'Number of items per page',
        required: false,
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 10
        }
      },
      SearchParam: {
        name: 'search',
        in: 'query',
        description: 'Search query string',
        required: false,
        schema: {
          type: 'string'
        }
      },
      SortParam: {
        name: 'sort',
        in: 'query',
        description: 'Sort field',
        required: false,
        schema: {
          type: 'string'
        }
      },
      OrderParam: {
        name: 'order',
        in: 'query',
        description: 'Sort order',
        required: false,
        schema: {
          type: 'string',
          enum: ['asc', 'desc'],
          default: 'desc'
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization endpoints'
    },
    {
      name: 'Devices',
      description: 'WhatsApp device management'
    },
    {
      name: 'Sessions',
      description: 'WhatsApp session management'
    },
    {
      name: 'Messages',
      description: 'Message sending and management'
    },
    {
      name: 'Contacts',
      description: 'Contact management and scraping'
    },
    {
      name: 'Auto-Reply',
      description: 'Automated response system'
    },
    {
      name: 'Campaigns',
      description: 'Bulk messaging campaigns'
    },
    {
      name: 'AI Integration',
      description: 'AI-powered features and content optimization'
    },
    {
      name: 'Webhooks',
      description: 'Webhook management and notifications'
    },
    {
      name: 'Analytics',
      description: 'Analytics and reporting'
    },
    {
      name: 'System',
      description: 'System monitoring and management'
    }
  ]
};

// Options for swagger-jsdoc
const swaggerOptions = {
  definition: swaggerDefinition,
  apis: [
    './src/routes/api/v1/*.js',
    './src/controllers/*.js',
    './src/swagger/schemas/*.js'
  ]
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI options
const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    docExpansion: 'none',
    filter: true,
    showRequestDuration: true,
    tryItOutEnabled: true,
    requestInterceptor: (req) => {
      // Add custom headers or modify requests
      return req;
    }
  },
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 20px 0 }
    .swagger-ui .scheme-container { background: #fafafa; padding: 15px; border-radius: 4px; margin: 20px 0 }
  `,
  customSiteTitle: 'WhatsApp Gateway SaaS API Documentation',
  customfavIcon: '/favicon.ico'
};

module.exports = {
  swaggerSpec,
  swaggerUi,
  swaggerUiOptions
};