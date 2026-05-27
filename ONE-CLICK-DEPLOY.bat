@echo off
setlocal

cd /d "%~dp0"

echo PromptArc one-click deploy
echo ==========================
echo.
echo This will:
echo 1. Check your .env settings
echo 2. Check key local pages
echo 3. Upload to GitHub Pages
echo 4. Update Cloudflare
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0ONE-CLICK-DEPLOY.ps1"

echo.
if errorlevel 1 (
  echo Deployment failed. Check the newest log file in deploy-logs and send it to Codex if needed.
) else (
  echo Deployment finished. Open https://www.promptarc.cc/
)

echo.
pause
