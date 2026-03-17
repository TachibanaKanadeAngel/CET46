@echo off
chcp 65001 >nul
echo 正在启动 CET46 本地服务器...
echo.
echo 请使用以下方式之一访问：
echo  1. 在浏览器中打开: http://localhost:8080
.
echo  2. 按 Ctrl+C 停止服务器
echo.

:: 尝试使用 Python
python -m http.server 8080 2>nul
if %errorlevel% == 0 goto :end

:: 尝试使用 Python3
python3 -m http.server 8080 2>nul
if %errorlevel% == 0 goto :end

:: 尝试使用 Node.js
npx serve . -l 8080 2>nul
if %errorlevel% == 0 goto :end

:: 尝试使用 PHP
php -S localhost:8080 2>nul
if %errorlevel% == 0 goto :end

echo.
echo [错误] 没有找到可用的服务器程序。
echo 请安装以下任意一种：
echo   - Python (推荐): https://www.python.org/downloads/
echo   - Node.js: https://nodejs.org/
echo   - PHP: https://www.php.net/downloads.php
.
pause

:end
