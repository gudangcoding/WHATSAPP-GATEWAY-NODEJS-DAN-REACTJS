@echo off
setlocal enabledelayedexpansion

:: WhatsApp Gateway SaaS Frontend - Windows Setup Script
:: Author: AI Assistant
:: Version: 1.0.0

echo ================================
echo WhatsApp Gateway SaaS Frontend Setup
echo ================================
echo Setting up React frontend for WhatsApp Gateway SaaS
echo.

:: Step 1: Check Prerequisites
echo ================================
echo Step 1: Checking Prerequisites
echo ================================

:: Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 16+ first.
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

:: Step 2: Install Dependencies
echo.
echo ================================
echo Step 2: Installing Dependencies
echo ================================

echo [INFO] Installing React dependencies...
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
echo Step 3: Environment Configuration
echo ================================

if not exist ".env" (
    echo [INFO] Creating .env file for frontend...
    (
        echo # React App Configuration
        echo REACT_APP_API_URL=http://localhost:3000/api/v1
        echo REACT_APP_SOCKET_URL=http://localhost:3000
        echo REACT_APP_APP_NAME=WhatsApp Gateway SaaS
        echo REACT_APP_VERSION=1.0.0
        echo.
        echo # Development Configuration
        echo GENERATE_SOURCEMAP=true
        echo REACT_APP_ENV=development
        echo.
        echo # Build Configuration
        echo BUILD_PATH=build
        echo PUBLIC_URL=/
    ) > .env
    echo [SUCCESS] .env file created for frontend
) else (
    echo [WARNING] .env file already exists, skipping creation
)

:: Step 4: Create additional required files
echo.
echo ================================
echo Step 4: Creating Additional Files
echo ================================

if not exist "public" mkdir public

if not exist "public\manifest.json" (
    echo [INFO] Creating manifest.json...
    (
        echo {
        echo   "short_name": "WA Gateway",
        echo   "name": "WhatsApp Gateway SaaS",
        echo   "icons": [
        echo     {
        echo       "src": "favicon.ico",
        echo       "sizes": "64x64 32x32 24x24 16x16",
        echo       "type": "image/x-icon"
        echo     }
        echo   ],
        echo   "start_url": ".",
        echo   "display": "standalone",
        echo   "theme_color": "#22c55e",
        echo   "background_color": "#ffffff"
        echo }
    ) > public\manifest.json
    echo [SUCCESS] manifest.json created
)

if not exist "public\favicon.ico" (
    echo [INFO] Creating favicon placeholder...
    echo. > public\favicon.ico
    echo [SUCCESS] Favicon placeholder created
)

:: Step 5: Build Test
echo.
echo ================================
echo Step 5: Testing Build
echo ================================

echo [INFO] Testing React build process...
call npm run build >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Build test successful
    if exist "build" rmdir /s /q build
) else (
    echo [WARNING] Build test failed, but continuing setup
)

:: Step 6: Create startup scripts
echo.
echo ================================
echo Step 6: Creating Startup Scripts
echo ================================

:: Create development start script
(
    echo @echo off
    echo echo Starting WhatsApp Gateway SaaS Frontend ^(Development Mode^)
    echo echo Environment: Development
    echo echo Frontend will start on: http://localhost:3001
    echo echo Backend API: http://localhost:3000/api/v1
    echo echo.
    echo set BROWSER=none
    echo set PORT=3001
    echo npm start
) > start-dev.bat

:: Create production build script
(
    echo @echo off
    echo echo Building WhatsApp Gateway SaaS Frontend for Production
    echo echo Environment: Production
    echo echo.
    echo npm run build
    echo echo.
    echo echo Build completed! Files are in the 'build' directory
    echo echo Deploy the 'build' directory to your web server
    echo pause
) > build-prod.bat

echo [SUCCESS] Startup scripts created

:: Step 7: Final Instructions
echo.
echo ================================
echo Setup Complete!
echo ================================

echo.
echo [SUCCESS] WhatsApp Gateway SaaS Frontend setup completed successfully!
echo.
echo Next Steps:
echo    1. Make sure the backend is running on port 3000
echo    2. Start the frontend: npm start or start-dev.bat
echo    3. Open your browser to: http://localhost:3001
echo.
echo Important URLs:
echo    • Frontend: http://localhost:3001
echo    • Backend API: http://localhost:3000/api/v1
echo    • API Documentation: http://localhost:3000/api/v1/docs
echo.
echo Quick Start Commands:
echo    • Development: npm start or start-dev.bat
echo    • Build for production: npm run build or build-prod.bat
echo.
echo Default Login Credentials:
echo    • Admin: admin@whatsapp-gateway.com / password123
echo    • User: demo@whatsapp-gateway.com / password123
echo.
echo Features Available:
echo    • Landing Page with pricing and features
echo    • Admin Dashboard with system monitoring
echo    • User Dashboard with device management
echo    • Real-time updates via Socket.IO
echo    • Responsive design for all devices
echo.
echo [SUCCESS] Frontend setup script completed successfully!
echo.
pause