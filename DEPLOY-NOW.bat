@echo off
setlocal

cd /d "%~dp0"

echo Deploying PromptArc...
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy-now.ps1"

echo.
if errorlevel 1 (
  echo Deployment failed. Keep this window open and send the error output to Codex.
) else (
  echo Deployment finished. Open https://www.promptarc.cc/
)

echo.
pause
