@echo off
setlocal
powershell -ExecutionPolicy Bypass -File "%~dp0ONE-CLICK-FULL-DEPLOY.ps1"
echo.
if errorlevel 1 (
  echo ONE-CLICK-FULL-DEPLOY failed. Please copy the last error lines above or open the newest file in deploy-logs.
) else (
  echo ONE-CLICK-FULL-DEPLOY completed.
)
echo.
pause
endlocal
