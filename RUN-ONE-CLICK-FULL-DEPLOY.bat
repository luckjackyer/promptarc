@echo off
setlocal
cd /d "%~dp0"
echo PromptArc one-click full deploy
echo ===============================
echo Working directory: %CD%
echo.
echo This window will stay open after the script finishes.
echo.
powershell -NoExit -ExecutionPolicy Bypass -File "%~dp0ONE-CLICK-FULL-DEPLOY.ps1"
endlocal
