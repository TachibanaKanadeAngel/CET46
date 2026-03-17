@echo off
chcp 65001 >nul
title CET46 一键打包工具

echo.
echo ========================================
echo    CET46 科学记忆引擎 - 一键打包工具
echo ========================================
echo.

REM 设置 Node.js 路径（根据您的实际安装位置）
set NODE_PATH=E:\New Folder
set PATH=%NODE_PATH%;%PATH%

echo [步骤 1/4] 检查 Node.js...
"%NODE_PATH%\node.exe" --version >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js
    echo 请修改此脚本中的 NODE_PATH 为您的 Node.js 安装路径
    echo 当前设置: %NODE_PATH%
    echo.
    pause
    exit /b 1
)
echo [✓] Node.js 已安装
echo 版本: 
"%NODE_PATH%\node.exe" --version

echo.
echo [步骤 2/4] 安装依赖...
"%NODE_PATH%\npm.cmd" install
if %errorlevel% neq 0 (
    echo [错误] 依赖安装失败
    pause
    exit /b 1
)
echo [✓] 依赖安装完成

echo.
echo [步骤 3/4] 构建应用...
"%NODE_PATH%\npm.cmd" run build
if %errorlevel% neq 0 (
    echo [错误] 构建失败
    pause
    exit /b 1
)
echo [✓] 构建完成

echo.
echo [步骤 4/4] 打包 EXE 文件...
"%NODE_PATH%\npx.cmd" electron-builder --win
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
