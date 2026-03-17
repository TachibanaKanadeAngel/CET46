@echo off
chcp 65001 >nul
echo ==========================================
echo    CET46 记忆引擎 - 简易启动器
echo ==========================================
echo.
echo 正在尝试启动本地服务器...
echo.

:: 尝试 Python
python -m http.server 5500 >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Python 服务器已启动
    echo 🌐 请在浏览器中访问: http://localhost:5500
    echo.
    pause
    exit
)

:: 尝试 Python3
python3 -m http.server 5500 >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Python3 服务器已启动
    echo 🌐 请在浏览器中访问: http://localhost:5500
    echo.
    pause
    exit
)

:: 尝试 Node.js
npx serve . -l 5500 >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Node.js 服务器已启动
    echo 🌐 请在浏览器中访问: http://localhost:5500
    echo.
    pause
    exit
)

echo ❌ 未找到可用的服务器程序
echo.
echo 请安装以下任意一种：
echo   1. Python (推荐): https://www.python.org/downloads/
echo   2. Node.js: https://nodejs.org/
echo.
echo 或者使用 VS Code 的 Live Server 插件
echo.
pause
