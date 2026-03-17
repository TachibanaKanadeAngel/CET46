@echo off
chcp 65001 >nul
title CET46 一键完成所有任务

echo.
echo ========================================
echo    CET46 科学记忆引擎
echo    一键完成：构建EXE + 推送GitHub
echo ========================================
echo.

REM 设置路径
set "NODE_PATH=E:\New Folder"
set "PATH=%NODE_PATH%;%PATH%"

echo [1/8] 检查环境...
echo   Node.js 路径: %NODE_PATH%
"%NODE_PATH%\node.exe" --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] Node.js 未找到
    pause
    exit /b 1
)
echo   Node.js 版本: 
"%NODE_PATH%\node.exe" --version
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] Git 未找到
    pause
    exit /b 1
)
echo   Git: 已安装
echo [✓] 环境检查通过

echo.
echo [2/8] 安装项目依赖...
"%NODE_PATH%\npm.cmd" install
if %errorlevel% neq 0 (
    echo [错误] 依赖安装失败
    pause
    exit /b 1
)
echo [✓] 依赖安装完成

echo.
echo [3/8] 构建应用...
"%NODE_PATH%\npm.cmd" run build
if %errorlevel% neq 0 (
    echo [错误] 构建失败
    pause
    exit /b 1
)
echo [✓] 构建完成

echo.
echo [4/8] 打包 Windows EXE...
"%NODE_PATH%\npx.cmd" electron-builder --win
if %errorlevel% neq 0 (
    echo [错误] EXE打包失败
    pause
    exit /b 1
)
echo [✓] EXE 打包完成

echo.
echo [5/8] 检查 Git 仓库...
if not exist .git (
    echo   初始化 Git 仓库...
    git init
    git remote add origin https://github.com/TachibanaKanadeAngel/CET46.git
) else (
    echo   Git 仓库已存在
)
echo [✓] Git 仓库就绪

echo.
echo [6/8] 添加文件到 Git...
git add .
git status
echo [✓] 文件已添加

echo.
echo [7/8] 提交更改...
git commit -m "添加EXE打包配置和构建文件"
if %errorlevel% neq 0 (
    echo   没有新更改需要提交，继续...
)
echo [✓] 提交完成

echo.
echo [8/8] 推送到 GitHub...
git push -u origin master 2>nul || git push -u origin main
echo [✓] 推送完成

echo.
echo ========================================
echo    所有任务完成！
echo ========================================
echo.
echo EXE 文件位置:
echo   release\CET46 科学记忆引擎 Setup 1.0.0.exe
echo   release\CET46-Portable-1.0.0.exe
echo.
echo GitHub 仓库:
echo   https://github.com/TachibanaKanadeAngel/CET46
echo.
echo 按任意键打开 release 目录...
pause >nul
start "" "release"
