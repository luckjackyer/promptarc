@echo off
setlocal

cd /d "%~dp0"

echo PromptArc auto push and deploy
echo ==============================
echo.
echo This will:
echo 1. Auto commit local changes
echo 2. Fetch origin/main
echo 3. Rebase onto the latest remote branch
echo 4. Push to GitHub
echo 5. Trigger GitHub Actions Pages deployment
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0AUTO-PUSH-AND-DEPLOY.ps1"

echo.
if errorlevel 1 (
  echo Auto publish failed. Check the newest log in deploy-logs.
) else (
  echo Auto publish finished. Check GitHub Actions for deployment progress.
)

echo.
pause
