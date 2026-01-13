@echo off
echo ========================================
echo Installing All Dependencies
echo ========================================
echo.

echo [1/3] Installing local-api dependencies...
cd local-api
call npm install express cors dotenv nodemon @neondatabase/serverless @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb jsonwebtoken bcryptjs pg
if errorlevel 1 (
    echo ERROR: Failed to install local-api dependencies
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo [2/3] Installing frontend dependencies...
cd frontend
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo [3/3] Verifying installations...
echo.
echo Checking Node.js:
node --version
echo.
echo Checking npm:
npm --version
echo.
echo Checking Docker:
docker --version
echo.

echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Next step: Run start-localhost-windows.bat
echo.
pause
