@echo off
title Khaled Bot Setup & Run
color 0A

echo ===================================================
echo      Khaled Bot - Automatic Setup & Start
echo ===================================================
echo.

:: 1. Check for Node.js
echo [1/3] Checking Node.js installation...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js is NOT installed on this computer.
    echo.
    echo Opening download page...
    echo Please install Node.js (LTS Version) and then run this script again.
    timeout /t 3 >nul
    start https://nodejs.org/
    pause
    exit
)
echo [OK] Node.js is ready.
echo.

:: 2. Install Dependencies
if not exist "node_modules" (
    echo [2/3] Installing required libraries (First time run)...
    echo This may take a few minutes. Please wait...
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo [ERROR] Failed to install libraries. Check your internet connection.
        pause
        exit
    )
    echo [OK] Libraries installed.
) else (
    echo [2/3] Libraries already installed. Skipping...
)
echo.

:: 3. Start Bot
echo [3/3] Starting Khaled Bot...
echo.
echo ===================================================
echo    Bot is running. Do NOT close this window.
echo    To stop the bot, press Ctrl + C
echo ===================================================
echo.
node index.js
pause