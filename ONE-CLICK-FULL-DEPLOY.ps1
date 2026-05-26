$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$logDir = Join-Path $repoRoot "deploy-logs"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$logPath = Join-Path $logDir "one-click-full-deploy-$timestamp.log"
$nodePath = "C:\tmp\node-v24.14.0-win-x64\node.exe"

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Fail {
  param([string]$Message)
  Write-Host ""
  Write-Host "FULL DEPLOY FAILED: $Message" -ForegroundColor Red
  Write-Host "Log file: $logPath" -ForegroundColor Yellow
  exit 1
}

function Import-DotEnv {
  param([string]$Path)
  if (-not (Test-Path $Path)) {
    Fail "Missing .env file. Copy .env.example to .env and fill required keys."
  }

  Get-Content -Encoding UTF8 $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) { return }
    if ($line -notmatch "^(?<k>[A-Za-z_][A-Za-z0-9_]*)=(?<v>.*)$") { return }
    $key = $Matches.k
    $value = $Matches.v.Trim()
    if ($value.StartsWith('"') -and $value.EndsWith('"')) { $value = $value.Substring(1, $value.Length - 2) }
    if ($value.StartsWith("'") -and $value.EndsWith("'")) { $value = $value.Substring(1, $value.Length - 2) }
    [Environment]::SetEnvironmentVariable($key, $value, "Process")
  }
}

function Require-Env {
  param([string[]]$Names)
  $missing = @()
  foreach ($name in $Names) {
    $value = [Environment]::GetEnvironmentVariable($name, "Process")
    if ([string]::IsNullOrWhiteSpace($value)) { $missing += $name }
  }
  if ($missing.Count -gt 0) {
    Fail "Missing required .env values: $($missing -join ', ')"
  }
}

function Invoke-StepCommand {
  param(
    [string]$Label,
    [scriptblock]$Command
  )
  Write-Step $Label
  & $Command
  if ($LASTEXITCODE -ne 0) {
    Fail "$Label failed."
  }
}

function Test-Health {
  $domain = [Environment]::GetEnvironmentVariable("DOMAIN", "Process")
  if ([string]::IsNullOrWhiteSpace($domain)) { $domain = "www.promptarc.cc" }
  $healthUrl = "https://$domain/api/generate-image/health"
  Write-Step "Checking image generator health"
  Write-Host $healthUrl -ForegroundColor Yellow
  try {
    $response = Invoke-RestMethod -Method Get -Uri $healthUrl -TimeoutSec 30
    $response | ConvertTo-Json -Depth 8
    if (-not $response.ok) {
      Fail "Health endpoint returned ok=false."
    }
    if (-not $response.hasApiKey) {
      Fail "Health endpoint says OPENAI_API_KEY is missing in Worker."
    }
    if (-not $response.hasR2) {
      Fail "Health endpoint says R2 binding is missing in Worker."
    }
    Write-Host "Health check passed." -ForegroundColor Green
  } catch {
    Fail "Health check failed: $($_.Exception.Message)"
  }
}

function Test-CloudflareToken {
  $token = [Environment]::GetEnvironmentVariable("CLOUDFLARE_TOKEN", "Process")
  Write-Step "Verifying Cloudflare token"
  try {
    $verify = Invoke-RestMethod `
      -Method Get `
      -Uri "https://api.cloudflare.com/client/v4/user/tokens/verify" `
      -Headers @{ Authorization = "Bearer $token"; Accept = "application/json" } `
      -TimeoutSec 30

    if (-not $verify.success) {
      Fail "Cloudflare token verification returned success=false."
    }
    Write-Host "Cloudflare token is valid." -ForegroundColor Green
  } catch {
    Fail "Cloudflare token verification failed. Create a new Cloudflare API token and update CLOUDFLARE_TOKEN in .env. Error: $($_.Exception.Message)"
  }
}

Set-Location $repoRoot
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

Start-Transcript -Path $logPath -Force | Out-Null
try {
  Write-Host "PromptArc one-click full deploy" -ForegroundColor Cyan
  Write-Host "==============================="
  Write-Host "Repo: $repoRoot"
  Write-Host "Log : $logPath"

  if (-not (Test-Path $nodePath)) {
    $nodePath = "node"
  }

  Write-Step "Loading environment"
  Import-DotEnv -Path (Join-Path $repoRoot ".env")
  Require-Env -Names @(
    "GITHUB_TOKEN",
    "GITHUB_USER",
    "GITHUB_REPO",
    "CLOUDFLARE_TOKEN",
    "OPENAI_API_KEY",
    "OPENAI_BASE_URL",
    "R2_BUCKET",
    "R2_PUBLIC_BASE"
  )

  Test-CloudflareToken

  Invoke-StepCommand -Label "Checking JavaScript syntax" -Command {
    & $nodePath "--check" "app.js"
    if ($LASTEXITCODE -ne 0) { return }
    & $nodePath "--check" "workers\image-generator-worker.mjs"
    if ($LASTEXITCODE -ne 0) { return }
    & $nodePath "--check" "scripts\deploy-image-worker.mjs"
  }

  Invoke-StepCommand -Label "Creating/updating D1 generation history database" -Command {
    & $nodePath "scripts\setup-d1-generation-history.mjs"
  }

  Invoke-StepCommand -Label "Deploying image generator Worker" -Command {
    & $nodePath "scripts\deploy-image-worker.mjs"
  }

  Invoke-StepCommand -Label "Pushing static site to GitHub Pages" -Command {
    powershell -ExecutionPolicy Bypass -File (Join-Path $repoRoot "AUTO-PUSH-AND-DEPLOY.ps1")
  }

  Test-Health

  Write-Step "Completed"
  Write-Host "PromptArc full deploy completed successfully." -ForegroundColor Green
  Write-Host "Site: https://$([Environment]::GetEnvironmentVariable("DOMAIN", "Process"))" -ForegroundColor Green
  Write-Host "Log : $logPath" -ForegroundColor Yellow
}
catch {
  Write-Host $_.Exception.Message -ForegroundColor Red
  Write-Host $_.ScriptStackTrace
  Write-Host "Log file: $logPath" -ForegroundColor Yellow
  exit 1
}
finally {
  Stop-Transcript | Out-Null
}
