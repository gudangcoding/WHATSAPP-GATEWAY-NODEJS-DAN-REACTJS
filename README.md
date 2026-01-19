# 🚀 WhatsApp Gateway SaaS - Complete Platform

**Production-Ready Multi-Device WhatsApp Gateway with Modern React Frontend**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.2+-blue.svg)](https://reactjs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18+-blue.svg)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange.svg)](https://mysql.com/)
[![Redis](https://img.shields.io/badge/Redis-6.0+-red.svg)](https://redis.io/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7+-purple.svg)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.2+-38B2AC.svg)](https://tailwindcss.com/)

## 📋 Overview

Complete WhatsApp Gateway SaaS platform with modern React frontend and production-ready Node.js backend. Supports multi-user, multi-device WhatsApp integration with comprehensive features for business automation.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  Node.js Backend │    │     Database    │
│                 │    │                 │    │                 │
│  • Landing Page │◄──►│  • REST API     │◄──►│  • MySQL        │
│  • Admin Panel  │    │  • Socket.IO    │    │  • Redis        │
│  • User Dashboard│    │  • Baileys      │    │  • 16 Tables    │
│  • Real-time UI │    │  • Job Queues   │    │  • Relationships│
└─────────────────┘    └─────────────────┘    └─────────────────┘
       Port 3001              Port 3000           Ports 3306/6379
```

## ✨ Complete Feature Set

### 🎨 **Frontend Features**
- **Landing Page**: Marketing homepage with pricing and features
- **Authentication**: Login, register, password reset, email verification
- **Admin Dashboard**: System monitoring, user management, analytics
- **User Dashboard**: Device management, messaging, campaigns, AI tools
- **Real-time Updates**: Socket.IO integration for live status updates
- **Responsive Design**: Mobile-first, works on all devices
- **Modern UI**: Tailwind CSS, smooth animations, accessibility compliant

### 🔐 **Authentication & Security**
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Email verification & password reset
- 2FA support (TOTP ready)
- Advanced rate limiting & DDoS protection
- Input validation & sanitization

### 📱 **Multi-Device Management**
- Unlimited WhatsApp devices per user
- Real-time connection status monitoring
- Auto-reconnection with intelligent retry logic
- QR code generation & management
- Device configuration & settings
- Session persistence across restarts

### 💬 **Message System**
- All message types: text, image, video, audio, document, location, contact
- Single & bulk message sending
- Message scheduling & priority queues
- Delivery status tracking & confirmations
- Message retry logic for failed sends
- Media upload & handling

### 🤖 **Auto-Reply Engine**
- Rule-based automation system
- Keyword, regex, and time-based triggers
- Conditional logic & actions
- Contact group targeting
- Priority-based rule execution
- Performance analytics

### 📢 **Campaign & Blast System**
- Bulk messaging campaigns
- Target audience segmentation
- Campaign scheduling & automation
- Performance tracking & analytics
- A/B testing support
- Delivery optimization

### 🧠 **AI Integration (9 Features)**
- Text variation generation
- Sentiment analysis
- Content optimization
- Intelligent auto-replies
- Message timing optimization
- Target audience analysis
- Campaign performance prediction
- Content suggestions
- Contextual translation

### 📊 **Analytics & Reporting**
- Real-time performance metrics
- Message delivery analytics
- User engagement tracking
- Device uptime monitoring
- Campaign performance reports
- Custom dashboard widgets

### 🔗 **Webhook System**
- Event-driven notifications
- Custom webhook endpoints
- Retry logic & error handling
- Event filtering & routing
- Delivery confirmation
- Security headers & validation

### 🌐 **API & Documentation**
- 180+ REST API endpoints
- Interactive Swagger/OpenAPI documentation
- Real-time Socket.IO events
- Comprehensive error handling
- Request/response examples
- SDK generation ready

## 🚀 Quick Start (Full Stack)

### **Option 1: One-Command Setup (Recommended)**

#### For Linux/macOS:
```bash
# Make setup script executable
chmod +x start-fullstack.sh

# Start complete platform
./start-fullstack.sh
```

#### For Windows:
```cmd
# Start complete platform
start-fullstack.bat
```

### **Option 2: Manual Setup**

#### Prerequisites
- Node.js 18+ 
- MySQL 8.0+
- Redis 6.0+
- npm or yarn

#### Backend Setup
```bash
# Install backend dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
node run_migrations.js

# Start backend
npm start
```

#### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install frontend dependencies
npm install

# Configure environment
cp .env.example .env

# Start frontend
PORT=3001 npm start
```

## 📚 Access URLs

Once both services are running:

- **Frontend (Main App)**: http://localhost:3001
- **Backend API**: http://localhost:3000/api/v1
- **API Documentation**: http://localhost:3000/api/v1/docs
- **Health Check**: http://localhost:3000/health
- **System Status**: http://localhost:3000/api/v1/system/status

## 🔑 Default Credentials

The system comes with pre-configured test accounts:

| Role | Email | Password | API Key | Max Devices |
|------|-------|----------|---------|-------------|
| Admin | admin@whatsapp-gateway.com | password123 | wg_admin_1234567890abcdef1234567890abcdef | 10 |
| User | demo@whatsapp-gateway.com | password123 | wg_demo_abcdef1234567890abcdef1234567890 | 5 |
| User | test@whatsapp-gateway.com | password123 | wg_test_fedcba0987654321fedcba0987654321 | 3 |

## 📁 Project Structure

```
whatsapp-gateway-saas/
├── 📁 backend/                    # Node.js Backend
│   ├── 📁 src/
│   │   ├── 📁 controllers/        # API Controllers
│   │   ├── 📁 services/           # Business Logic
│   │   ├── 📁 repositories/       # Data Access Layer
│   │   ├── 📁 middleware/         # Express Middleware
│   │   ├── 📁 routes/             # API Routes
│   │   ├── 📁 core/               # Core Managers
│   │   ├── 📁 jobs/               # Background Jobs
│   │   ├── 📁 utils/              # Utilities
│   │   └── 📁 swagger/            # API Documentation
│   ├── 📁 database/
│   │   ├── 📁 migrations/         # Database Migrations
│   │   └── 📁 seeds/              # Seed Data
│   ├── 📁 docs/                   # Documentation
│   ├── 📁 storage/                # File Storage
│   └── 📁 tests/                  # Test Files
├── 📁 frontend/                   # React Frontend
│   ├── 📁 public/                 # Static Files
│   ├── 📁 src/
│   │   ├── 📁 components/         # React Components
│   │   ├── 📁 pages/              # Page Components
│   │   ├── 📁 layouts/            # Layout Components
│   │   ├── 📁 contexts/           # React Contexts
│   │   ├── 📁 services/           # API Services
│   │   └── 📁 utils/              # Utilities
│   └── 📁 build/                  # Production Build
├── 📄 start-fullstack.sh          # Full Stack Startup (Linux/macOS)
├── 📄 start-fullstack.bat         # Full Stack Startup (Windows)
├── 📄 setup.sh                    # Backend Setup (Linux/macOS)
├── 📄 setup.bat                   # Backend Setup (Windows)
└── 📄 README.md                   # This File
```

## 🔧 Configuration

### **Backend Environment (.env)**
```env
# Application
NODE_ENV=development
PORT=3000
JWT_SECRET=your-secret-key

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=whatsapp_gateway

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email
EMAIL_SERVICE=console
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

### **Frontend Environment (frontend/.env)**
```env
# API Configuration
REACT_APP_API_URL=http://localhost:3000/api/v1
REACT_APP_SOCKET_URL=http://localhost:3000

# App Configuration
REACT_APP_APP_NAME=WhatsApp Gateway SaaS
REACT_APP_VERSION=1.0.0
```

## 📊 Database Schema

The system uses 16 MySQL tables with complete relationships:

- **users** - User management and authentication
- **devices** - WhatsApp device management
- **sessions** - Session persistence and tracking
- **contacts** - Contact management and groups
- **groups** - WhatsApp group management
- **messages** - Message storage and analytics
- **auto_replies** - Auto-reply rules and conditions
- **auto_reply_logs** - Auto-reply execution logs
- **campaigns** - Campaign management
- **campaign_targets** - Campaign targeting
- **ai_templates** - AI template management
- **ai_history** - AI usage tracking
- **webhooks** - Webhook configuration
- **webhook_logs** - Webhook execution logs
- **system_logs** - System activity logs
- **ai_templates_enhanced** - Enhanced AI features

## 🌐 API Endpoints

The backend provides 180+ REST API endpoints across 11 categories:

| Category | Endpoints | Description |
|----------|-----------|-------------|
| 🔐 Authentication | 15 | Login, register, profile, 2FA |
| 📱 Devices | 10 | Device CRUD, connect, disconnect, status |
| 🔗 Sessions | 8 | Session lifecycle, monitoring |
| 💬 Messages | 20 | Send, bulk, schedule, retry, stats |
| 👥 Contacts | 22 | Contact management, groups, scraping |
| 🤖 Auto-Reply | 16 | Rules, conditions, actions, analytics |
| 📢 Campaigns | 20 | Campaign CRUD, targeting, scheduling |
| 🧠 AI Integration | 15 | 9 AI features with analytics |
| 🔗 Webhooks | 8 | Webhook management, logs |
| 📊 Analytics | 18 | Performance metrics, reports |
| ⚙️ System | 28 | Health, monitoring, logs |

## 🎨 Frontend Pages

### **Public Pages**
- **Landing Page** (`/`) - Marketing homepage with features and pricing
- **Login** (`/login`) - User authentication
- **Register** (`/register`) - User registration
- **Forgot Password** (`/forgot-password`) - Password reset

### **Admin Dashboard** (`/admin/*`)
- **Overview** - System metrics and health monitoring
- **Users** - User management and statistics
- **Devices** - Device monitoring and control
- **Messages** - Message analytics and logs
- **Campaigns** - Campaign management
- **Analytics** - Detailed reports and insights
- **System** - System configuration and logs
- **Settings** - Application settings

### **User Dashboard** (`/dashboard/*`)
- **Overview** - Personal dashboard and quick actions
- **Devices** - WhatsApp device management
- **Messages** - Send and manage messages
- **Contacts** - Contact and group management
- **Auto Reply** - Automated response configuration
- **Campaigns** - Message campaign creation
- **AI Tools** - AI-powered features
- **Webhooks** - Webhook configuration
- **Analytics** - Personal analytics and reports
- **Profile** - Account settings and preferences

## 🔌 Real-time Features

The platform includes comprehensive real-time updates via Socket.IO:

### **Device Events**
- Device connection/disconnection
- QR code updates
- Status changes
- Error notifications

### **Message Events**
- Message received/sent
- Delivery confirmations
- Read receipts
- Failed message alerts

### **Campaign Events**
- Campaign start/completion
- Progress updates
- Target statistics
- Performance metrics

### **System Events**
- System notifications
- Health alerts
- User activities
- Admin notifications

## 🚀 Production Deployment

### **Docker Deployment**
```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]

# Frontend Dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
```

### **PM2 Deployment**
```bash
# Start with PM2
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# Logs
pm2 logs
```

### **Environment Setup**
```bash
# Production environment
NODE_ENV=production
PORT=3000

# Database (use production credentials)
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-secure-password

# Redis (use production instance)
REDIS_HOST=your-redis-host
REDIS_PASSWORD=your-redis-password

# Email (use production SMTP)
EMAIL_SERVICE=smtp
SMTP_HOST=your-smtp-host
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
```

## 📊 Performance & Monitoring

### **Backend Performance**
- Connection pooling for database
- Redis caching for sessions
- Background job processing
- Rate limiting and DDoS protection
- Structured logging with Winston

### **Frontend Performance**
- Code splitting with React.lazy()
- Image optimization
- Bundle size optimization
- Caching strategies
- Lazy loading

### **Monitoring**
- Health check endpoints
- System metrics collection
- Error tracking and logging
- Performance monitoring
- Real-time alerts

## 🔒 Security Features

### **Authentication Security**
- JWT with refresh tokens
- Password hashing with bcrypt
- Email verification
- 2FA support
- Session management

### **API Security**
- Rate limiting per endpoint
- Input validation and sanitization
- CORS configuration
- Helmet security headers
- API key authentication

### **Data Security**
- SQL injection prevention
- XSS protection
- CSRF protection
- Secure file uploads
- Data encryption

## 🧪 Testing

### **Backend Testing**
```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

### **Frontend Testing**
```bash
# Run tests
cd frontend
npm test

# Run tests with coverage
npm test -- --coverage
```

## 📝 Documentation

### **API Documentation**
- Interactive Swagger UI at `/api/v1/docs`
- Complete endpoint documentation
- Request/response examples
- Authentication guides

### **Code Documentation**
- Inline code comments
- JSDoc documentation
- Architecture diagrams
- Setup guides

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support and questions:
- Email: support@whatsapp-gateway.com
- Documentation: Check the `/docs` directory
- API Reference: http://localhost:3000/api/v1/docs

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎉 Acknowledgments

- Built with ❤️ for modern WhatsApp business automation
- Powered by Baileys WhatsApp library
- UI inspired by modern SaaS platforms
- Community-driven development

---

**🚀 Ready to revolutionize your WhatsApp business communication!**

# Email (Optional)
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
```

### **Database Schema**
- **16 Tables**: Users, devices, sessions, messages, contacts, campaigns, etc.
- **Relationships**: Properly normalized with foreign keys
- **Indexes**: Optimized for performance
- **Migrations**: Version-controlled schema changes

## 🏗️ Architecture

### **Technology Stack**
- **Backend**: Node.js + Express.js
- **Database**: MySQL 8.0+ with connection pooling
- **Cache**: Redis for sessions & queues
- **Queue**: Bull Queue for background jobs
- **WebSocket**: Socket.IO for real-time events
- **WhatsApp**: Baileys library (multi-device)
- **Documentation**: Swagger/OpenAPI 3.0
- **Process Manager**: PM2 for production

### **Core Components**
```
src/
├── app.js              # Express application
├── controllers/        # Request handlers
├── services/          # Business logic
├── repositories/      # Data access layer
├── middleware/        # Auth, validation, rate limiting
├── routes/           # API route definitions
├── core/             # Session, Queue, Socket managers
├── jobs/             # Background job processors
├── utils/            # Helper functions
└── swagger/          # API documentation
```

## 📊 Performance & Scalability

### **Performance Features**
- Connection pooling for database
- Redis caching for sessions
- Background job processing
- Rate limiting & DDoS protection
- Optimized database queries
- Efficient memory management

### **Scalability**
- Horizontal scaling ready
- Load balancer compatible
- Stateless session management
- Queue-based processing
- Microservice architecture ready

## 🔒 Security

### **Security Features**
- JWT authentication with refresh tokens
- Password hashing (bcrypt, 12 rounds)
- Input validation & sanitization
- SQL injection prevention
- XSS protection
- CORS configuration
- Rate limiting
- Security headers (Helmet.js)

### **Best Practices**
- Environment variable configuration
- Error handling & logging
- Audit trails
- Session management
- API versioning
- Documentation security

## 🧪 Testing

### **API Testing**
```bash
# Using Swagger UI
# Visit: http://localhost:3000/api/v1/docs

# Using curl
curl -X GET http://localhost:3000/health

# Authentication example
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

## 📈 Monitoring

### **Health Checks**
- **Health**: `GET /health`
- **System Status**: `GET /api/v1/system/status`
- **Database**: Connection monitoring
- **Redis**: Cache status
- **Queue**: Job processing status

### **Logging**
- Structured logging with Winston
- Log levels: error, warn, info, debug
- File rotation & management
- Error tracking & alerts

## 🚀 Deployment

### **Production Deployment**
```bash
# Using PM2
pm2 start ecosystem.config.js --env production

# Using Docker (if Dockerfile exists)
docker build -t whatsapp-gateway .
docker run -p 3000:3000 whatsapp-gateway

# Manual production start
NODE_ENV=production npm start
```

### **Environment Setup**
1. Update `.env` for production
2. Configure MySQL & Redis
3. Set up SSL certificates
4. Configure reverse proxy (Nginx)
5. Set up monitoring & alerts

## 📞 Support & Documentation

### **Quick Links**
- 📚 **API Docs**: http://localhost:3000/api/v1/docs
- 🔍 **Health Check**: http://localhost:3000/health
- 📊 **System Status**: http://localhost:3000/api/v1/system/status
- 🌐 **API Base**: http://localhost:3000/api/v1

### **Getting Help**
- Check Swagger documentation for API details
- Review error logs in `storage/logs/`
- Verify database & Redis connections
- Check environment configuration

## 📄 License

This project is licensed under the ISC License.

## 🎉 Features Completed

✅ **All 13 Development Steps Completed**
- ✅ Architecture Design
- ✅ Database Schema (16 tables)
- ✅ Project Structure
- ✅ Session Manager (Baileys integration)
- ✅ Socket.IO Integration
- ✅ Contact Scraping System
- ✅ Message Flow System
- ✅ Auto-Reply Engine
- ✅ Campaign/Blast System
- ✅ AI Integration (9 features)
- ✅ API Endpoints (180+)
- ✅ Swagger Documentation
- ✅ Production-Ready Code

**🚀 Ready for Production Use!**