#!/bin/bash

# WhatsApp Gateway SaaS Frontend - Setup Script
# Author: AI Assistant
# Version: 1.0.0

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

print_header "🚀 WhatsApp Gateway SaaS Frontend Setup"
echo -e "${CYAN}Setting up React frontend for WhatsApp Gateway SaaS${NC}"
echo ""

# Step 1: Check Prerequisites
print_header "📋 Step 1: Checking Prerequisites"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
    
    # Check if Node.js version is >= 16
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 16 ]; then
        print_error "Node.js version 16 or higher is required. Current: $NODE_VERSION"
        exit 1
    fi
else
    print_error "Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm found: $NPM_VERSION"
else
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Step 2: Install Dependencies
print_header "📦 Step 2: Installing Dependencies"

print_status "Installing React dependencies..."
npm install

if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Step 3: Environment Configuration
print_header "⚙️ Step 3: Environment Configuration"

# Create .env file for frontend
if [ ! -f ".env" ]; then
    print_status "Creating .env file for frontend..."
    cat > .env << EOL
# React App Configuration
REACT_APP_API_URL=http://localhost:3000/api/v1
REACT_APP_SOCKET_URL=http://localhost:3000
REACT_APP_APP_NAME=WhatsApp Gateway SaaS
REACT_APP_VERSION=1.0.0

# Development Configuration
GENERATE_SOURCEMAP=true
REACT_APP_ENV=development

# Build Configuration
BUILD_PATH=build
PUBLIC_URL=/
EOL
    print_success ".env file created for frontend"
else
    print_warning ".env file already exists, skipping creation"
fi

# Step 4: Create additional required files
print_header "📁 Step 4: Creating Additional Files"

# Create public/manifest.json
if [ ! -f "public/manifest.json" ]; then
    print_status "Creating manifest.json..."
    mkdir -p public
    cat > public/manifest.json << EOL
{
  "short_name": "WA Gateway",
  "name": "WhatsApp Gateway SaaS",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#22c55e",
  "background_color": "#ffffff"
}
EOL
    print_success "manifest.json created"
fi

# Create favicon.ico placeholder
if [ ! -f "public/favicon.ico" ]; then
    print_status "Creating favicon placeholder..."
    # Create a simple favicon placeholder (you can replace this with actual favicon)
    touch public/favicon.ico
    print_success "Favicon placeholder created"
fi

# Step 5: Build Test
print_header "🧪 Step 5: Testing Build"

print_status "Testing React build process..."
npm run build > /dev/null 2>&1

if [ $? -eq 0 ]; then
    print_success "Build test successful"
    rm -rf build  # Clean up test build
else
    print_warning "Build test failed, but continuing setup"
fi

# Step 6: Create startup scripts
print_header "🔧 Step 6: Creating Startup Scripts"

# Create development start script
cat > start-dev.sh << EOL
#!/bin/bash
echo "🚀 Starting WhatsApp Gateway SaaS Frontend (Development Mode)"
echo "📋 Environment: Development"
echo "🔗 Frontend will start on: http://localhost:3001"
echo "🔌 Backend API: http://localhost:3000/api/v1"
echo ""
BROWSER=none PORT=3001 npm start
EOL

# Create production build script
cat > build-prod.sh << EOL
#!/bin/bash
echo "🏗️ Building WhatsApp Gateway SaaS Frontend for Production"
echo "📋 Environment: Production"
echo ""
npm run build
echo ""
echo "✅ Build completed! Files are in the 'build' directory"
echo "📁 Deploy the 'build' directory to your web server"
EOL

# Make scripts executable
chmod +x start-dev.sh build-prod.sh

print_success "Startup scripts created"

# Step 7: Final Instructions
print_header "🎉 Setup Complete!"

echo -e "${GREEN}✅ WhatsApp Gateway SaaS Frontend setup completed successfully!${NC}"
echo ""
echo -e "${CYAN}📋 Next Steps:${NC}"
echo -e "   1. Make sure the backend is running on port 3000"
echo -e "   2. Start the frontend: ${YELLOW}npm start${NC} or ${YELLOW}./start-dev.sh${NC}"
echo -e "   3. Open your browser to: ${GREEN}http://localhost:3001${NC}"
echo ""
echo -e "${CYAN}🔗 Important URLs:${NC}"
echo -e "   • Frontend: ${GREEN}http://localhost:3001${NC}"
echo -e "   • Backend API: ${GREEN}http://localhost:3000/api/v1${NC}"
echo -e "   • API Documentation: ${GREEN}http://localhost:3000/api/v1/docs${NC}"
echo ""
echo -e "${CYAN}🚀 Quick Start Commands:${NC}"
echo -e "   • Development: ${YELLOW}npm start${NC} or ${YELLOW}./start-dev.sh${NC}"
echo -e "   • Build for production: ${YELLOW}npm run build${NC} or ${YELLOW}./build-prod.sh${NC}"
echo ""
echo -e "${CYAN}🔑 Default Login Credentials:${NC}"
echo -e "   • Admin: admin@whatsapp-gateway.com / password123"
echo -e "   • User: demo@whatsapp-gateway.com / password123"
echo ""
echo -e "${CYAN}📚 Features Available:${NC}"
echo -e "   • Landing Page with pricing and features"
echo -e "   • Admin Dashboard with system monitoring"
echo -e "   • User Dashboard with device management"
echo -e "   • Real-time updates via Socket.IO"
echo -e "   • Responsive design for all devices"
echo ""
echo -e "${PURPLE}🎊 Happy coding with WhatsApp Gateway SaaS Frontend!${NC}"

print_success "Frontend setup script completed successfully!"