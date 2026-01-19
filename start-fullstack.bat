@echo off
setlocal enabledelayedexpansion

:: WhatsApp Gateway SaaS - Full Stack Startup Script (Windows)
:: Author: AI Assistant
:: Version: 1.0.0

echo ================================
echo WhatsApp Gateway SaaS - Full Stack Startup
echo ================================
echo Starting complete WhatsApp Gateway SaaS platform
echo.

:: Step 1: Check Prerequisites
echo ================================
echo Step 1: Checking Prerequisites
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

:: Step 2: Check Ports
echo.
echo ================================
echo Step 2: Checking Ports
echo ================================

:: Check if ports are available
netstat -an | find "3000" | find "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] Port 3000 is already in use
    echo [INFO] Attempting to continue anyway...
) else (
    echo [SUCCESS] Port 3000 is available for backend
)

netstat -an | find "3001" | find "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] Port 3001 is already in use
    echo [INFO] Attempting to continue anyway...
) else (
    echo [SUCCESS] Port 3001 is available for frontend
)

:: Step 3: Setup Backend
echo.
echo ================================
echo Step 3: Setting Up Backend
echo ================================

if not exist ".env" (
    echo [ERROR] Backend .env file not found. Please run setup.bat first.
    pause
    exit /b 1
)

:: Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Installing backend dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install backend dependencies
        pause
        exit /b 1
    ) else (
        echo [SUCCESS] Backend dependencies installed
    )
) else (
    echo [SUCCESS] Backend dependencies already installed
)

:: Run database migrations
echo [INFO] Running database migrations...
call node run_migrations.js
if %errorlevel% equ 0 (
    echo [SUCCESS] Database migrations completed
) else (
    echo [WARNING] Database migrations failed, but continuing...
)

:: Step 4: Setup Frontend
echo.
echo ================================
echo Step 4: Setting Up Frontend
echo ================================

cd frontend

if not exist ".env" (
    echo [INFO] Creating frontend .env file...
    copy .env.example .env >nul 2>&1
    echo [SUCCESS] Frontend .env file created
)

:: Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Installing frontend dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install frontend dependencies
        pause
        exit /b 1
    ) else (
        echo [SUCCESS] Frontend dependencies installed
    )
) else (
    echo [SUCCESS] Frontend dependencies already installed
)

cd ..

:: Step 5: Start Services
echo.
echo ================================
echo Step 5: Starting Services
echo ================================

:: Create logs directory
if not exist "logs" mkdir logs

echo [INFO] Starting backend server on port 3000...
start "WhatsApp Gateway Backend" /min cmd /c "npm start > logs\backend.log 2>&1"
echo [SUCCESS] Backend started in background

:: Wait for backend to start
echo [INFO] Waiting for backend to initialize...
timeout /t 10 /nobreak >nul

echo [INFO] Starting frontend server on port 3001...
cd frontend
start "WhatsApp Gateway Frontend" /min cmd /c "set PORT=3001 && set BROWSER=none && npm start > ..\logs\frontend.log 2>&1"
cd ..
echo [SUCCESS] Frontend started in background

:: Wait for frontend to start
echo [INFO] Waiting for frontend to initialize...
timeout /t 15 /nobreak >nul

:: Step 6: Health Checks
echo.
echo ================================
echo Step 6: Health Checks
echo ================================

echo [INFO] Checking backend health...
curl -s http://localhost:3000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Backend health check passed
) else (
    echo [WARNING] Backend health check failed
)

echo [INFO] Checking frontend...
curl -s http://localhost:3001 >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Frontend is responding
) else (
    echo [WARNING] Frontend is not responding yet ^(may still be starting^)
)

:: Step 7: Final Information
echo.
echo ================================
echo Full Stack Started Successfully!
echo ================================

echo.
echo [SUCCESS] WhatsApp Gateway SaaS is now running!
echo.
echo Access URLs:
echo    • Frontend ^(Main App^): http://localhost:3001
echo    • Backend API: http://localhost:3000/api/v1
echo    • API Documentation: http://localhost:3000/api/v1/docs
echo    • Health Check: http://localhost:3000/health
echo.
echo Default Login Credentials:
echo    • Admin: admin@whatsapp-gateway.com / password123
echo    • User: demo@whatsapp-gateway.com / password123
echo.
echo Process Information:
echo    • Backend: Running in background window
echo    • Frontend: Running in background window
echo    • Logs Directory: logs\
echo.
echo To Stop Services:
echo    • Close the background command windows
echo    • Or run: stop-fullstack.bat
echo.
echo Next Steps:
echo    1. Open http://localhost:3001 in your browser
echo    2. Login with the credentials above
echo    3. Start adding WhatsApp devices
echo    4. Configure auto-replies and campaigns
echo.

:: Create stop script
(
    echo @echo off
    echo echo Stopping WhatsApp Gateway SaaS Full Stack...
    echo.
    echo :: Kill processes on ports 3000 and 3001
    echo for /f "tokens=5" %%%%a in ^('netstat -aon ^| find ":3000" ^| find "LISTENING"'^) do taskkill /f /pid %%%%a 2^>nul
    echo for /f "tokens=5" %%%%a in ^('netstat -aon ^| find ":3001" ^| find "LISTENING"'^) do taskkill /f /pid %%%%a 2^>nul
    echo.
    echo echo All services stopped successfully!
    echo pause
) > stop-fullstack.bat

echo [SUCCESS] Full stack startup completed successfully!
echo.
echo Press any key to open the application in your browser...
pause >nul

:: Open browser
start http://localhost:3001

echo.
echo Application opened in browser!
echo Keep this window open to see the status.
echo Press any key to exit...
pause >nul