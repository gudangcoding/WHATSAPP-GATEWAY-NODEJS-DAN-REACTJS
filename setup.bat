@echo off
setlocal enabledelayedexpansion

:: WhatsApp Gateway SaaS Backend - Windows Setup Script
:: Author: AI Assistant
:: Version: 1.0.0

title WhatsApp Gateway SaaS Backend Setup

echo.
echo ================================
echo 🚀 WhatsApp Gateway SaaS Backend Setup
echo ================================
echo Automated setup script for production-ready WhatsApp Gateway
echo.

:: Step 1: Check Prerequisites
echo ================================
echo 📋 Step 1: Checking Prerequisites
echo ================================

:: Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [SUCCESS] Node.js found: !NODE_VERSION!
)

:: Check npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed. Please install npm first.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo [SUCCESS] npm found: !NPM_VERSION!
)

:: Check MySQL (optional)
mysql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] MySQL not found in PATH. Make sure MySQL is installed and running.
) else (
    echo [SUCCESS] MySQL found
)

:: Step 2: Install Dependencies
echo.
echo ================================
echo 📦 Step 2: Installing Dependencies
echo ================================

echo [INFO] Installing Node.js dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
) else (
    echo [SUCCESS] Dependencies installed successfully
)

:: Step 3: Environment Configuration
echo.
echo ================================
echo ⚙️ Step 3: Environment Configuration
echo ================================

if not exist ".env" (
    echo [INFO] Creating .env file from template...
    copy .env.example .env >nul
    echo [SUCCESS] .env file created
) else (
    echo [WARNING] .env file already exists, skipping creation
)

:: Create database migration runner
echo [INFO] Creating database migration runner...
(
echo const mysql = require('mysql2/promise'^);
echo const fs = require('fs'^);
echo const path = require('path'^);
echo require('dotenv'^).config(^);
echo.
echo async function runMigrations(^) {
echo     try {
echo         const connection = await mysql.createConnection({
echo             host: process.env.DB_HOST ^|^| 'localhost',
echo             port: process.env.DB_PORT ^|^| 3306,
echo             user: process.env.DB_USER ^|^| 'root',
echo             password: process.env.DB_PASSWORD ^|^| '',
echo             database: process.env.DB_NAME ^|^| 'whatsapp_gateway',
echo             multipleStatements: true
echo         }^);
echo.
echo         console.log('🔗 Connected to database'^);
echo.
echo         const migrationsDir = path.join(__dirname, 'database', 'migrations'^);
echo         const migrationFiles = fs.readdirSync(migrationsDir^)
echo             .filter(file =^> file.endsWith('.sql'^)^)
echo             .sort(^);
echo.
echo         console.log(`📋 Found ${migrationFiles.length} migration files`^);
echo.
echo         for (const file of migrationFiles^) {
echo             try {
echo                 console.log(`⚡ Running migration: ${file}`^);
echo                 const sql = fs.readFileSync(path.join(migrationsDir, file^), 'utf8'^);
echo                 await connection.execute(sql^);
echo                 console.log(`✅ Migration completed: ${file}`^);
echo             } catch (error^) {
echo                 console.error(`❌ Migration failed: ${file}`, error.message^);
echo             }
echo         }
echo.
echo         const seedsDir = path.join(__dirname, 'database', 'seeds'^);
echo         if (fs.existsSync(seedsDir^)^) {
echo             const seedFiles = fs.readdirSync(seedsDir^)
echo                 .filter(file =^> file.endsWith('.sql'^)^)
echo                 .sort(^);
echo.
echo             console.log(`🌱 Found ${seedFiles.length} seed files`^);
echo.
echo             for (const file of seedFiles^) {
echo                 try {
echo                     console.log(`🌱 Running seed: ${file}`^);
echo                     const sql = fs.readFileSync(path.join(seedsDir, file^), 'utf8'^);
echo                     await connection.execute(sql^);
echo                     console.log(`✅ Seed completed: ${file}`^);
echo                 } catch (error^) {
echo                     console.error(`❌ Seed failed: ${file}`, error.message^);
echo                 }
echo             }
echo         }
echo.
echo         await connection.end(^);
echo         console.log('🎉 Database setup completed!'^);
echo     } catch (error^) {
echo         console.error('Database setup failed:', error.message^);
echo         process.exit(1^);
echo     }
echo }
echo.
echo runMigrations(^).catch(console.error^);
) > run_migrations.js

echo [SUCCESS] Database migration runner created

:: Step 4: Create startup scripts
echo.
echo ================================
echo 🔧 Step 4: Creating Startup Scripts
echo ================================

:: Create development start script
(
echo @echo off
echo echo 🚀 Starting WhatsApp Gateway SaaS Backend (Development Mode^)
echo echo 📋 Environment: Development
echo echo 🔗 Server will start on: http://localhost:3000
echo echo 📚 API Documentation: http://localhost:3000/api/v1/docs
echo echo.
echo npm run dev
) > start-dev.bat

:: Create production start script
(
echo @echo off
echo echo 🚀 Starting WhatsApp Gateway SaaS Backend (Production Mode^)
echo echo 📋 Environment: Production
echo echo 🔗 Server will start on: http://localhost:3000
echo echo 📚 API Documentation: http://localhost:3000/api/v1/docs
echo echo.
echo npm start
) > start-prod.bat

echo [SUCCESS] Startup scripts created

:: Step 5: Create PM2 ecosystem file
echo.
echo ================================
echo 🔄 Step 5: Creating PM2 Configuration
echo ================================

if not exist "ecosystem.config.js" (
    (
    echo module.exports = {
    echo   apps: [{
    echo     name: 'whatsapp-gateway-saas',
    echo     script: 'src/app.js',
    echo     instances: 'max',
    echo     exec_mode: 'cluster',
    echo     env: {
    echo       NODE_ENV: 'development',
    echo       PORT: 3000
    echo     },
    echo     env_production: {
    echo       NODE_ENV: 'production',
    echo       PORT: 3000
    echo     },
    echo     error_file: './storage/logs/pm2-error.log',
    echo     out_file: './storage/logs/pm2-out.log',
    echo     log_file: './storage/logs/pm2-combined.log',
    echo     time: true,
    echo     max_memory_restart: '1G',
    echo     node_args: '--max-old-space-size=1024'
    echo   }]
    echo };
    ) > ecosystem.config.js
    echo [SUCCESS] PM2 ecosystem configuration created
) else (
    echo [WARNING] PM2 ecosystem.config.js already exists
)

:: Final Instructions
echo.
echo ================================
echo 🎉 Setup Complete!
echo ================================
echo.
echo ✅ WhatsApp Gateway SaaS Backend setup completed successfully!
echo.
echo 📋 Next Steps:
echo    1. Update database credentials in .env file
echo    2. Ensure MySQL and Redis are running
echo    3. Run database migrations: node run_migrations.js
echo    4. Start the application: npm start or start-dev.bat
echo.
echo 🔗 Important URLs:
echo    • Application: http://localhost:3000
echo    • API Documentation: http://localhost:3000/api/v1/docs
echo    • API Endpoints: http://localhost:3000/api/v1
echo    • Health Check: http://localhost:3000/health
echo    • System Status: http://localhost:3000/api/v1/system/status
echo.
echo 🚀 Quick Start Commands:
echo    • Development: npm run dev
echo    • Production: npm start
echo    • With PM2: pm2 start ecosystem.config.js
echo.
echo 📚 Documentation:
echo    • Complete API docs available at Swagger UI
echo    • 180+ endpoints across 11 categories
echo    • Interactive testing available
echo.
echo 🎊 Happy coding with WhatsApp Gateway SaaS!
echo.

echo [SUCCESS] Setup script completed successfully!
echo.
pause