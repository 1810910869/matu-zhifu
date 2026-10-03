@echo off
chcp 65001 >nul
cd /d "%~dp0demo-frontend"
echo ========================================
echo   码途智辅 AI 智能助教系统 - 启动脚本
echo ========================================
if not exist node_modules (
  echo [1/2] 首次运行，正在安装依赖...
  call npm install
) else (
  echo [1/2] 依赖已存在，跳过安装。
)
echo [2/2] 启动开发服务器 (http://localhost:3000) ...
call npm run dev
pause
