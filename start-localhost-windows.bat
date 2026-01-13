@echo off
echo ========================================
echo Starting Marketplace Sync - Localhost
echo ========================================
echo.

echo Checking Docker...
docker version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [1/4] Starting Docker containers...
docker-compose up -d
if errorlevel 1 (
    echo ERROR: Failed to start containers
    pause
    exit /b 1
)

echo [2/4] Waiting for databases...
timeout /t 15 /nobreak >nul

echo [3/4] Starting API server...
start "API Server" cmd /k "cd local-api && npm run dev"

timeout /t 3 /nobreak >nul

echo [4/4] Starting Frontend...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo Services Started!
echo ========================================
echo.
echo API:      http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Two windows opened:
echo - API Server (keep open)
echo - Frontend (keep open)
echo.
echo Next steps:
echo 1. Wait 20 seconds for services to start
echo 2. Open: http://localhost:5173
echo 3. Login: test@example.com / TestPass123!
echo.
echo To stop: Close both windows, then run: docker-compose down
echo.
pause
