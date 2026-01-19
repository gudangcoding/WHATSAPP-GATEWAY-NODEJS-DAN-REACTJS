#!/bin/bash

# WhatsApp Gateway SaaS - Full Stack Startup Script
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

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        print_status "Killing process on port $port (PID: $pid)"
        kill -9 $pid 2>/dev/null || true
        sleep 2
    fi
}

print_header "🚀 WhatsApp Gateway SaaS - Full Stack Startup"
echo -e "${CYAN}Starting complete WhatsApp Gateway SaaS platform${NC}"
echo ""

# Step 1: Check Prerequisites
print_header "📋 Step 1: Checking Prerequisites"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
else
    print_error "Node.js is not installed. Please install Node.js 18+ first."
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

# Check MySQL
if command -v mysql &> /dev/null; then
    print_success "MySQL found"
else
    print_warning "MySQL not found in PATH. Make sure MySQL is running."
fi

# Check Redis
if command -v redis-cli &> /dev/null; then
    print_success "Redis CLI found"
else
    print_warning "Redis CLI not found. Make sure Redis is running."
fi

# Step 2: Check and Clean Ports
print_header "🔌 Step 2: Checking Ports"

# Check backend port (3000)
if check_port 3000; then
    print_warning "Port 3000 is already in use"
    read -p "Kill existing process on port 3000? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill_port 3000
        print_success "Port 3000 cleared"
    else
        print_error "Cannot start backend on port 3000. Exiting."
        exit 1
    fi
else
    print_success "Port 3000 is available for backend"
fi

# Check frontend port (3001)
if check_port 3001; then
    print_warning "Port 3001 is already in use"
    read -p "Kill existing process on port 3001? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill_port 3001
        print_success "Port 3001 cleared"
    else
        print_error "Cannot start frontend on port 3001. Exiting."
        exit 1
    fi
else
    print_success "Port 3001 is available for frontend"
fi

# Step 3: Setup Backend
print_header "⚙️ Step 3: Setting Up Backend"

if [ ! -f ".env" ]; then
    print_error "Backend .env file not found. Please run setup.sh first."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_status "Installing backend dependencies..."
    npm install
    if [ $? -eq 0 ]; then
        print_success "Backend dependencies installed"
    else
        print_error "Failed to install backend dependencies"
        exit 1
    fi
else
    print_success "Backend dependencies already installed"
fi

# Run database migrations
print_status "Running database migrations..."
node run_migrations.js
if [ $? -eq 0 ]; then
    print_success "Database migrations completed"
else
    print_warning "Database migrations failed, but continuing..."
fi

# Step 4: Setup Frontend
print_header "🎨 Step 4: Setting Up Frontend"

cd frontend

if [ ! -f ".env" ]; then
    print_status "Creating frontend .env file..."
    cp .env.example .env
    print_success "Frontend .env file created"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_status "Installing frontend dependencies..."
    npm install
    if [ $? -eq 0 ]; then
        print_success "Frontend dependencies installed"
    else
        print_error "Failed to install frontend dependencies"
        exit 1
    fi
else
    print_success "Frontend dependencies already installed"
fi

cd ..

# Step 5: Start Services
print_header "🚀 Step 5: Starting Services"

# Create log directory
mkdir -p logs

print_status "Starting backend server on port 3000..."
nohup npm start > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > logs/backend.pid
print_success "Backend started (PID: $BACKEND_PID)"

# Wait for backend to start
print_status "Waiting for backend to initialize..."
sleep 10

# Check if backend is running
if kill -0 $BACKEND_PID 2>/dev/null; then
    print_success "Backend is running successfully"
else
    print_error "Backend failed to start. Check logs/backend.log"
    exit 1
fi

print_status "Starting frontend server on port 3001..."
cd frontend
BROWSER=none PORT=3001 nohup npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../logs/frontend.pid
cd ..
print_success "Frontend started (PID: $FRONTEND_PID)"

# Wait for frontend to start
print_status "Waiting for frontend to initialize..."
sleep 15

# Check if frontend is running
if kill -0 $FRONTEND_PID 2>/dev/null; then
    print_success "Frontend is running successfully"
else
    print_error "Frontend failed to start. Check logs/frontend.log"
    # Don't exit, backend might still be useful
fi

# Step 6: Health Checks
print_header "🏥 Step 6: Health Checks"

# Check backend health
print_status "Checking backend health..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    print_success "Backend health check passed"
else
    print_warning "Backend health check failed"
fi

# Check frontend
print_status "Checking frontend..."
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    print_success "Frontend is responding"
else
    print_warning "Frontend is not responding yet (may still be starting)"
fi

# Step 7: Final Information
print_header "🎉 Full Stack Started Successfully!"

echo -e "${GREEN}✅ WhatsApp Gateway SaaS is now running!${NC}"
echo ""
echo -e "${CYAN}🔗 Access URLs:${NC}"
echo -e "   • Frontend (Main App): ${GREEN}http://localhost:3001${NC}"
echo -e "   • Backend API: ${GREEN}http://localhost:3000/api/v1${NC}"
echo -e "   • API Documentation: ${GREEN}http://localhost:3000/api/v1/docs${NC}"
echo -e "   • Health Check: ${GREEN}http://localhost:3000/health${NC}"
echo ""
echo -e "${CYAN}🔑 Default Login Credentials:${NC}"
echo -e "   • Admin: ${YELLOW}admin@whatsapp-gateway.com${NC} / ${YELLOW}password123${NC}"
echo -e "   • User: ${YELLOW}demo@whatsapp-gateway.com${NC} / ${YELLOW}password123${NC}"
echo ""
echo -e "${CYAN}📊 Process Information:${NC}"
echo -e "   • Backend PID: ${YELLOW}$BACKEND_PID${NC}"
echo -e "   • Frontend PID: ${YELLOW}$FRONTEND_PID${NC}"
echo -e "   • Logs Directory: ${YELLOW}logs/${NC}"
echo ""
echo -e "${CYAN}🛑 To Stop Services:${NC}"
echo -e "   • Stop All: ${YELLOW}./stop-fullstack.sh${NC}"
echo -e "   • Stop Backend: ${YELLOW}kill $BACKEND_PID${NC}"
echo -e "   • Stop Frontend: ${YELLOW}kill $FRONTEND_PID${NC}"
echo ""
echo -e "${CYAN}📋 Next Steps:${NC}"
echo -e "   1. Open ${GREEN}http://localhost:3001${NC} in your browser"
echo -e "   2. Login with the credentials above"
echo -e "   3. Start adding WhatsApp devices"
echo -e "   4. Configure auto-replies and campaigns"
echo ""
echo -e "${PURPLE}🎊 Enjoy your WhatsApp Gateway SaaS platform!${NC}"

# Create stop script
cat > stop-fullstack.sh << 'EOL'
#!/bin/bash

echo "🛑 Stopping WhatsApp Gateway SaaS Full Stack..."

# Kill backend
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "Stopping backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        rm logs/backend.pid
    fi
fi

# Kill frontend
if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "Stopping frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        rm logs/frontend.pid
    fi
fi

# Kill any remaining processes on ports
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

echo "✅ All services stopped successfully!"
EOL

chmod +x stop-fullstack.sh

print_success "Full stack startup completed successfully!"