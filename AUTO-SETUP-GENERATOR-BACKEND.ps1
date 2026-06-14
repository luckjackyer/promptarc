$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$nodePath = "C:\tmp\node-v24.14.0-win-x64\node.exe"

if (-not (Test-Path $nodePath)) {
  $nodePath = "node"
}

Set-Location $repoRoot

Write-Host "PromptArc generator backend setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

if (-not (Test-Path ".env")) {
  throw "Missing .env. Create it from .env.example and add Cloudflare/OpenAI/R2 values first."
}

Write-Host ""
Write-Host "Step 1/2: Create or update D1 generation history database" -ForegroundColor Cyan
& $nodePath "scripts\setup-d1-generation-history.mjs"
if ($LASTEXITCODE -ne 0) {
  throw "D1 setup failed."
}

Write-Host ""
Write-Host "Step 2/2: Deploy image generator Worker" -ForegroundColor Cyan
& $nodePath "scripts\deploy-image-worker.mjs"
if ($LASTEXITCODE -ne 0) {
  throw "Worker deploy failed."
}

Write-Host ""
Write-Host "Generator backend is ready." -ForegroundColor Green
Write-Host "Health check: https://www.promptarc.cc/api/generate-image/health" -ForegroundColor Yellow
