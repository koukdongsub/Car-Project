@echo off
title 3D Car Parking Simulator - Local Web Server

echo ==========================================================
echo   3D Car Parking Simulator - Local Web Server Launcher
echo ==========================================================
echo.

:: Check Node.js
node -v >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Node.js environment detected.
    echo.
    
    :: Check node_modules
    if not exist "node_modules" (
        echo [INFO] Installing required module (http-server). Please wait...
        call npm install
        if %errorlevel% neq 0 (
            echo [ERROR] Installation failed. Check your internet connection.
            pause
            exit /b
        )
    )
    
    echo [INFO] Opening the simulator in your default browser...
    start http://localhost:3000/index.html
    echo.
    echo [INFO] To test on a mobile device, connect to the same Wi-Fi and open:
    echo        http://[YOUR_LOCAL_IP]:3000/index.html
    echo.
    echo [INFO] Starting the web server... (Press Ctrl+C to stop)
    echo ----------------------------------------------------------
    call npm start
) else (
    :: Check Python
    python --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo [WARNING] Node.js is not installed.
        echo [INFO] Python detected. Using python web server instead.
        echo.
        echo [INFO] Opening the simulator in your default browser...
        start http://localhost:3000/index.html
        echo.
        echo [INFO] Starting Python HTTP server...
        echo        Mobile URL: http://[YOUR_LOCAL_IP]:3000/index.html
        echo ----------------------------------------------------------
        python -m http.server 3000 --directory app/src/main/assets
    ) else (
        echo [ERROR] Node.js or Python is required to run the local web server.
        echo.
        echo Please install one of the following:
        echo 1. Node.js (Recommended): https://nodejs.org/
        echo 2. Python: https://www.python.org/
        echo.
        pause
    )
)
