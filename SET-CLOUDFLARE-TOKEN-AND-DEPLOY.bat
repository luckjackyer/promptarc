@echo off
setlocal
cd /d "%~dp0"
powershell -NoExit -ExecutionPolicy Bypass -File "%~dp0SET-CLOUDFLARE-TOKEN-AND-DEPLOY.ps1"
endlocal
