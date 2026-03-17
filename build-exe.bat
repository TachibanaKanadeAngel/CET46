@echo off
chcp 65001 >nul
title CET46 一键打包工具

echo.
echo ========================================
echo    CET46 科学记忆引擎 - 一键打包工具
echo ========================================
echo.

echo [步骤 1/4] 检查 Node.js...
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
echo [步骤 2/4] 安装依赖...
call npm install
if %errorlevel% neq 0 (
    echo [错误] 依赖安装失败
    pause
    exit /b 1
)
echo [✓] 依赖安装完成

echo.
echo [步骤 3/4] 构建应用...
call npm run build
if %errorlevel% neq 0 (
    echo [错误] 构建失败
    pause
    exit /b 1
)
echo [✓] 构建完成

echo.
echo [步骤 4/4] 打包 EXE 文件...
call npx electron-builder --win
if %errorlevel% neq 0 (
    echo [错误] 打包失败
    pause
    exit /b 1
)
echo [✓] 打包完成

echo.
echo ========================================
echo    打包成功！
echo ========================================
echo.
echo EXE 文件位置:
echo   - release\CET46 科学记忆引擎 Setup 1.0.0.exe (安装版)
echo   - release\CET46-Portable-1.0.0.exe (便携版)
echo.
echo 按任意键打开 release 目录...
pause >nul
start "" "release"
