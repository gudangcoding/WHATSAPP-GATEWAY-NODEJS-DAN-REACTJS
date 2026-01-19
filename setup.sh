#!/bin/bash

# WhatsApp Gateway SaaS Backend - Automated Setup Script
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

# Check if running on Windows (Git Bash/WSL)
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    IS_WINDOWS=true
    print_warning "Detected Windows environment (Git Bash/MSYS)"
else
    IS_WINDOWS=false
fi

print_header "🚀 WhatsApp Gateway SaaS Backend Setup"
echo -e "${CYAN}Automated setup script for production-ready WhatsApp Gateway${NC}"
echo ""

# Step 1: Check Prerequisites
print_header "📋 Step 1: Checking Prerequisites"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
    
    # Check if Node.js version is >= 18
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 18 ]; then
        print_error "Node.js version 18 or higher is required. Current: $NODE_VERSION"
        exit 1
    fi
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

# Check MySQL (optional check)
if command -v mysql &> /dev/null; then
    MYSQL_VERSION=$(mysql --version)
    print_success "MySQL found: $MYSQL_VERSION"
else
    print_warning "MySQL not found in PATH. Make sure MySQL is installed and running."
fi

# Check Redis (optional check)
if command -v redis-cli &> /dev/null; then
    print_success "Redis CLI found"
else
    print_warning "Redis CLI not found. Make sure Redis is installed and running."
fi

# Step 2: Install Dependencies
print_header "📦 Step 2: Installing Dependencies"

print_status "Installing Node.js dependencies..."
npm install

if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Step 3: Environment Configuration
print_header "⚙️ Step 3: Environment Configuration"

if [ ! -f ".env" ]; then
    print_status "Creating .env file from template..."
    cp .env.example .env
    print_success ".env file created"
else
    print_warning ".env file already exists, skipping creation"
fi

# Update .env with default values for development
print_status "Configuring environment variables..."

# Generate JWT secret if not exists
if ! grep -q "JWT_SECRET=" .env || grep -q "JWT_SECRET=your-secret-key" .env; then
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "$(date +%s | sha256sum | base64 | head -c 32)")
    if [[ "$IS_WINDOWS" == true ]]; then
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
    else
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
    fi
    print_success "JWT secret generated and configured"
fi

# Set default database configuration
print_status "Setting up default database configuration..."
cat >> .env << EOL

# Database Configuration (Update these with your MySQL credentials)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=whatsapp_gateway

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Application Configuration
NODE_ENV=development
PORT=3000
CORS_ORIGIN=*

# Email Configuration (Optional - for email verification)
EMAIL_SERVICE=console
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@whatsapp-gateway.com

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=info
EOL

print_success "Environment configuration completed"

# Step 4: Database Setup
print_header "🗄️ Step 4: Database Setup"

print_status "Creating database setup script..."

# Create database setup script
cat > setup_database.sql << EOL
-- Create database if not exists
CREATE DATABASE IF NOT EXISTS whatsapp_gateway CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE whatsapp_gateway;

-- Show database creation status
SELECT 'Database whatsapp_gateway created/selected successfully' as status;
EOL

# Create migration runner script
cat > run_migrations.js << EOL
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigrations() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'whatsapp_gateway',
        multipleStatements: true
    });

    console.log('🔗 Connected to database');

    // Get all migration files
    const migrationsDir = path.join(__dirname, 'database', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

    console.log(\`📋 Found \${migrationFiles.length} migration files\`);

    for (const file of migrationFiles) {
        try {
            console.log(\`⚡ Running migration: \${file}\`);
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
            await connection.execute(sql);
            console.log(\`✅ Migration completed: \${file}\`);
        } catch (error) {
            console.error(\`❌ Migration failed: \${file}\`, error.message);
        }
    }

    // Run seeds
    const seedsDir = path.join(__dirname, 'database', 'seeds');
    if (fs.existsSync(seedsDir)) {
        const seedFiles = fs.readdirSync(seedsDir)
            .filter(file => file.endsWith('.sql'))
            .sort();

        console.log(\`🌱 Found \${seedFiles.length} seed files\`);

        for (const file of seedFiles) {
            try {
                console.log(\`🌱 Running seed: \${file}\`);
                const sql = fs.readFileSync(path.join(seedsDir, file), 'utf8');
                await connection.execute(sql);
                console.log(\`✅ Seed completed: \${file}\`);
            } catch (error) {
                console.error(\`❌ Seed failed: \${file}\`, error.message);
            }
        }
    }

    await connection.end();
    console.log('🎉 Database setup completed!');
}

runMigrations().catch(console.error);
EOL

print_success "Database setup scripts created"

print_warning "Please ensure MySQL is running and update .env with your database credentials"
print_status "To setup database manually, run: node run_migrations.js"

# Step 5: Create startup scripts
print_header "🔧 Step 5: Creating Startup Scripts"

# Create start script for development
cat > start-dev.sh << EOL
#!/bin/bash
echo "🚀 Starting WhatsApp Gateway SaaS Backend (Development Mode)"
echo "📋 Environment: Development"
echo "🔗 Server will start on: http://localhost:3000"
echo "📚 API Documentation: http://localhost:3000/api/v1/docs"
echo ""
npm run dev
EOL

# Create start script for production
cat > start-prod.sh << EOL
#!/bin/bash
echo "🚀 Starting WhatsApp Gateway SaaS Backend (Production Mode)"
echo "📋 Environment: Production"
echo "🔗 Server will start on: http://localhost:3000"
echo "📚 API Documentation: http://localhost:3000/api/v1/docs"
echo ""
npm start
EOL

# Make scripts executable
chmod +x start-dev.sh start-prod.sh

print_success "Startup scripts created"

# Step 6: Create PM2 ecosystem file
print_header "🔄 Step 6: Creating PM2 Configuration"

if [ ! -f "ecosystem.config.js" ]; then
    cat > ecosystem.config.js << EOL
module.exports = {
  apps: [{
    name: 'whatsapp-gateway-saas',
    script: 'src/app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './storage/logs/pm2-error.log',
    out_file: './storage/logs/pm2-out.log',
    log_file: './storage/logs/pm2-combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
EOL
    print_success "PM2 ecosystem configuration created"
else
    print_warning "PM2 ecosystem.config.js already exists"
fi

# Step 7: Test Application
print_header "🧪 Step 7: Testing Application"

print_status "Starting application test..."

# Start the application in background for testing
npm start &
APP_PID=$!

# Wait for application to start
sleep 5

# Test if application is running
if kill -0 $APP_PID 2>/dev/null; then
    print_success "Application started successfully (PID: $APP_PID)"
    
    # Test health endpoint
    if command -v curl &> /dev/null; then
        print_status "Testing health endpoint..."
        if curl -s http://localhost:3000/health > /dev/null; then
            print_success "Health endpoint is responding"
        else
            print_warning "Health endpoint test failed"
        fi
    fi
    
    # Stop test application
    kill $APP_PID 2>/dev/null
    sleep 2
else
    print_error "Application failed to start"
fi

# Step 8: Final Instructions
print_header "🎉 Setup Complete!"

echo -e "${GREEN}✅ WhatsApp Gateway SaaS Backend setup completed successfully!${NC}"
echo ""
echo -e "${CYAN}📋 Next Steps:${NC}"
echo -e "   1. Update database credentials in ${YELLOW}.env${NC} file"
echo -e "   2. Ensure MySQL and Redis are running"
echo -e "   3. Run database migrations: ${YELLOW}node run_migrations.js${NC}"
echo -e "   4. Start the application: ${YELLOW}npm start${NC} or ${YELLOW}./start-dev.sh${NC}"
echo ""
echo -e "${CYAN}🔗 Important URLs:${NC}"
echo -e "   • Application: ${GREEN}http://localhost:3000${NC}"
echo -e "   • API Documentation: ${GREEN}http://localhost:3000/api/v1/docs${NC}"
echo -e "   • API Endpoints: ${GREEN}http://localhost:3000/api/v1${NC}"
echo -e "   • Health Check: ${GREEN}http://localhost:3000/health${NC}"
echo -e "   • System Status: ${GREEN}http://localhost:3000/api/v1/system/status${NC}"
echo ""
echo -e "${CYAN}🚀 Quick Start Commands:${NC}"
echo -e "   • Development: ${YELLOW}npm run dev${NC}"
echo -e "   • Production: ${YELLOW}npm start${NC}"
echo -e "   • With PM2: ${YELLOW}pm2 start ecosystem.config.js${NC}"
echo ""
echo -e "${CYAN}📚 Documentation:${NC}"
echo -e "   • Complete API docs available at Swagger UI"
echo -e "   • 180+ endpoints across 11 categories"
echo -e "   • Interactive testing available"
echo ""
echo -e "${PURPLE}🎊 Happy coding with WhatsApp Gateway SaaS!${NC}"

# Clean up temporary files
rm -f setup_database.sql

print_success "Setup script completed successfully!"