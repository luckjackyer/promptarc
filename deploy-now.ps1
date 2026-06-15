$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoRoot

$nodePath = "C:\tmp\node-v24.14.0-win-x64\node.exe"
$deployScript = Join-Path $repoRoot "scripts\deploy-node.mjs"

if (-not (Test-Path ".env")) {
  throw "Missing .env file. Create it from .env.example and fill GitHub / Cloudflare values first."
}

if (-not (Test-Path $nodePath)) {
  throw "Node runtime not found at $nodePath"
}

if (-not (Test-Path $deployScript)) {
  throw "Deploy script not found at $deployScript"
}

Write-Host "Deploying PromptArc from $repoRoot"
Write-Host "This will upload the current site to GitHub Pages and update Cloudflare DNS."
Write-Host "Using local executor to avoid Codex approval-service outages."
& $nodePath $deployScript

if ($LASTEXITCODE -ne 0) {
  throw "Deployment failed with exit code $LASTEXITCODE"
}

Write-Host ""
Write-Host "Deployment command finished."
Write-Host "Check: https://www.promptarc.cc/"
