@echo off
title LetStuN AI - Starting System
echo ===================================================
echo     LETSTUN AI - ADVANCED VOCABULARY PLATFORM
echo ===================================================
echo.
echo [1/2] Checking Docker...
docker --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker is not running or not installed!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [2/2] Building and starting all containers (Postgres, Redis, API, Web)...
docker rm -f cloudflared >nul 2>&1
docker compose up --build -d

echo.
echo ===================================================
echo  HE THONG DA KHOI CHAY THANH CONG!
echo.
echo  * Frontend Web:    http://localhost:3000
echo  * Backend API:     http://localhost:4000/api/v1
echo  * Swagger API Doc: http://localhost:4000/api/docs
echo.
echo  * Luu y: Vui long tao tai khoan moi tren giao dien Web de bat dau hoc tap.
echo ===================================================
echo.
echo Dang mo trinh duyet...
timeout /t 3 >nul
start http://localhost:3000
