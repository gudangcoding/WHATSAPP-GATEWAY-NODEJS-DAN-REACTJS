# 🚀 WhatsApp Gateway SaaS Frontend

**Modern React Dashboard for WhatsApp Business API Platform**

[![React](https://img.shields.io/badge/React-18.2+-blue.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.2+-38B2AC.svg)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## 📋 Overview

Modern, responsive React frontend for WhatsApp Gateway SaaS platform. Built with React 18, Tailwind CSS, and Socket.IO for real-time updates.

## ✨ Features

### 🎨 **Modern UI/UX**
- Responsive design for all devices
- Clean, professional interface
- Dark/light mode support
- Smooth animations and transitions
- Accessibility compliant (WCAG 2.1)

### 🏠 **Landing Page**
- Hero section with call-to-action
- Feature showcase
- Pricing plans
- Customer testimonials
- Contact information

### 👨‍💼 **Admin Dashboard**
- System overview and metrics
- User management
- Device monitoring
- Message analytics
- Campaign management
- System health monitoring
- Real-time notifications

### 👤 **User Dashboard**
- Personal device management
- Message center
- Contact management
- Auto-reply configuration
- Campaign creation
- AI tools integration
- Analytics and reports
- Profile management

### 🔐 **Authentication**
- Login/Register forms
- Password reset
- Email verification
- 2FA support
- Session management

### 📊 **Real-time Features**
- Live device status updates
- Message delivery notifications
- Campaign progress tracking
- System alerts
- Socket.IO integration

## 🚀 Quick Start

### **Option 1: Automated Setup (Recommended)**

#### For Linux/macOS:
```bash
# Make setup script executable
chmod +x setup-frontend.sh

# Run automated setup
./setup-frontend.sh
```

#### For Windows:
```cmd
# Run automated setup
setup-frontend.bat
```

### **Option 2: Manual Setup**

#### Prerequisites
- Node.js 16+
- npm or yarn
- Backend API running on port 3000

#### Installation Steps

1. **Install Dependencies**
```bash
npm install
```

2. **Environment Configuration**
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
REACT_APP_API_URL=http://localhost:3000/api/v1
REACT_APP_SOCKET_URL=http://localhost:3000
```

3. **Start Development Server**
```bash
# Start on port 3001 (to avoid conflict with backend)
PORT=3001 npm start
```

4. **Build for Production**
```bash
npm run build
```

## 📚 Project Structure

```
frontend/
├── public/                 # Static files
│   ├── index.html         # HTML template
│   ├── manifest.json      # PWA manifest
│   └── favicon.ico        # App icon
├── src/
│   ├── components/        # Reusable components
│   │   ├── common/        # Common UI components
│   │   ├── forms/         # Form components
│   │   └── charts/        # Chart components
│   ├── contexts/          # React contexts
│   │   └── AuthContext.js # Authentication context
│   ├── hooks/             # Custom React hooks
│   ├── layouts/           # Layout components
│   │   ├── PublicLayout.js    # Public pages layout
│   │   ├── AdminLayout.js     # Admin dashboard layout
│   │   └── UserLayout.js      # User dashboard layout
│   ├── pages/             # Page components
│   │   ├── public/        # Public pages
│   │   ├── auth/          # Authentication pages
│   │   ├── admin/         # Admin pages
│   │   └── user/          # User pages
│   ├── services/          # API services
│   │   ├── api.js         # API client
│   │   └── socket.js      # Socket.IO client
│   ├── utils/             # Utility functions
│   ├── App.js             # Main app component
│   ├── index.js           # App entry point
│   └── index.css          # Global styles
├── tailwind.config.js     # Tailwind configuration
├── postcss.config.js      # PostCSS configuration
└── package.json           # Dependencies and scripts
```

## 🔧 Configuration

### **Environment Variables**
```env
# API Configuration
REACT_APP_API_URL=http://localhost:3000/api/v1
REACT_APP_SOCKET_URL=http://localhost:3000

# App Configuration
REACT_APP_APP_NAME=WhatsApp Gateway SaaS
REACT_APP_VERSION=1.0.0

# Development
GENERATE_SOURCEMAP=true
REACT_APP_ENV=development

# Build
BUILD_PATH=build
PUBLIC_URL=/
```

### **Tailwind CSS**
The project uses Tailwind CSS for styling with custom configuration:
- Custom color palette
- Extended animations
- Custom components
- Responsive breakpoints

### **API Integration**
- Axios for HTTP requests
- React Query for data fetching
- Automatic token management
- Error handling and retries

### **Socket.IO**
- Real-time device status
- Live message updates
- Campaign progress
- System notifications

## 📱 Pages & Features

### **Public Pages**
- **Landing Page** (`/`) - Marketing homepage
- **Login** (`/login`) - User authentication
- **Register** (`/register`) - User registration
- **Forgot Password** (`/forgot-password`) - Password reset

### **Admin Dashboard** (`/admin/*`)
- **Overview** - System metrics and health
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

## 🎨 UI Components

### **Common Components**
- LoadingSpinner - Loading indicators
- Modal - Dialog boxes
- Toast - Notifications
- Button - Styled buttons
- Input - Form inputs
- Card - Content containers

### **Charts & Analytics**
- Line charts for message trends
- Bar charts for device statistics
- Pie charts for status distribution
- Real-time data updates

### **Forms**
- Login/Register forms
- Device configuration
- Message composer
- Campaign builder
- Auto-reply rules

## 🔌 API Integration

### **Authentication**
```javascript
// Login
const result = await authAPI.login(email, password);

// Get profile
const profile = await authAPI.getProfile();

// Update profile
await authAPI.updateProfile(data);
```

### **Devices**
```javascript
// Get devices
const devices = await devicesAPI.getAll();

// Connect device
await devicesAPI.connect(deviceId);

// Get QR code
const qr = await devicesAPI.getQR(deviceId);
```

### **Messages**
```javascript
// Send message
await messagesAPI.send({
  deviceId,
  to: '+1234567890',
  message: 'Hello World'
});

// Get message stats
const stats = await messagesAPI.getStats();
```

## 🚀 Deployment

### **Development**
```bash
# Start development server
npm start

# Or use custom port
PORT=3001 npm start
```

### **Production Build**
```bash
# Build for production
npm run build

# Serve build locally (for testing)
npx serve -s build -l 3001
```

### **Docker Deployment**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npx", "serve", "-s", "build", "-l", "3001"]
```

## 🔧 Development

### **Available Scripts**
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

### **Code Style**
- ESLint for code linting
- Prettier for code formatting
- Tailwind CSS for styling
- Component-based architecture

### **Testing**
```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## 📊 Performance

### **Optimization Features**
- Code splitting with React.lazy()
- Image optimization
- Bundle size optimization
- Caching strategies
- Lazy loading

### **Monitoring**
- Web Vitals tracking
- Error boundary implementation
- Performance metrics
- User analytics

## 🔒 Security

### **Security Features**
- XSS protection
- CSRF protection
- Secure authentication
- Input validation
- Content Security Policy

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support, email support@whatsapp-gateway.com or join our Slack channel.

---

**🎉 Built with ❤️ for WhatsApp Gateway SaaS**