@echo off
setlocal

cd /d "%~dp0"

echo PromptArc auto deploy
echo =====================
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0AUTO-DEPLOY.ps1"

echo.
if errorlevel 1 (
  echo Deployment failed. Check the newest log in deploy-logs.
) else (
  echo Deployment finished. Open https://www.promptarc.cc/
)

echo.
pause
