@echo off
chcp 65001 >nul
title CET46 一键运行（开发模式）

echo.
echo ========================================
echo    CET46 科学记忆引擎 - 开发模式
echo ========================================
echo.

echo [步骤 1/2] 检查 Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo [✓] Node.js 已安装

echo.
echo [步骤 2/2] 启动开发服务器...
echo.
echo 浏览器将自动打开 http://localhost:3000
echo 按 Ctrl+C 可停止服务器
echo.
call npm run dev
