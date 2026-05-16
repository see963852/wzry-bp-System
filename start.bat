@echo off
title KOH Draft Advisor - 本地啟動
color 0A
echo.
echo  ╔══════════════════════════════════════╗
echo  ║   KOH Draft Advisor 正在啟動...     ║
echo  ║   王者榮耀陣容智能克制推薦系統       ║
echo  ╚══════════════════════════════════════╝
echo.

:: 檢查 Node.js 是否安裝
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [錯誤] 未偵測到 Node.js，請先至 https://nodejs.org 安裝
    pause
    exit /b 1
)

:: 檢查依賴是否已安裝
if not exist "node_modules" (
    echo [提示] 首次啟動，正在安裝依賴（約需 1-2 分鐘）...
    npm install
    if %errorlevel% neq 0 (
        echo [錯誤] 依賴安裝失敗，請檢查網絡連接
        pause
        exit /b 1
    )
    echo [完成] 依賴安裝成功！
)

echo [啟動] 正在啟動開發伺服器...
echo [提示] 啟動完成後，請在瀏覽器開啟：http://localhost:3000
echo [提示] 按 Ctrl+C 可停止伺服器
echo.

:: 延遲 3 秒後自動開啟瀏覽器
start /b cmd /c "timeout /t 4 >nul && start http://localhost:3000"

npm run dev
pause
