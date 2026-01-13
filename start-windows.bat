@echo off
echo ====================================
echo Marketplace Sync Dashboard - Windows
echo ====================================
echo.

echo [1/5] Starting Docker containers...
docker-compose up -d
if errorlevel 1 (
    echo ERROR: Docker failed to start. Make sure Docker Desktop is running.
    pause
    exit /b 1
)

echo [2/5] Waiting for databases to be ready...
timeout /t 10 /nobreak > nul

echo [3/5] Setting up DynamoDB tables...
cd local-api
call npm install --silent
node scripts/setup-dynamodb.js
cd ..

echo [4/5] Starting API server...
start "API Server" cmd /k "cd local-api && npm run dev"

timeout /t 5 /nobreak > nul

echo [5/5] Starting Frontend...
start "Frontend" cmd /k "cd frontend && npm install && npm run dev"

timeout /t 3 /nobreak > nul

echo.
echo ====================================
echo All services started successfully!
echo ====================================
echo.
echo Frontend:  http://localhost:5173
echo API:       http://localhost:3001
echo.
echo Next steps:
echo 1. Wait 10 seconds for services to fully start
echo 2. Run: seed-windows.bat (to add test data)
echo 3. Open: http://localhost:5173
echo 4. Login: test@example.com / TestPass123!
echo.
pause
