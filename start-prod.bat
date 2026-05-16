@echo off
title KOH Draft Advisor - 正式模式
color 0B
echo.
echo  ╔══════════════════════════════════════╗
echo  ║   KOH Draft Advisor 正式模式啟動    ║
echo  ╚══════════════════════════════════════╝
echo.

if not exist "node_modules" (
    echo [提示] 安裝依賴中...
    npm install
)

if not exist ".next" (
    echo [提示] 首次正式啟動，正在 Build（約需 2-3 分鐘）...
    npm run build
    if %errorlevel% neq 0 (
        echo [錯誤] Build 失敗，請改用 start.bat 開發模式
        pause
        exit /b 1
    )
)

echo [啟動] 正式伺服器啟動中...
start /b cmd /c "timeout /t 3 >nul && start http://localhost:3000"
npm run start
pause
