$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$logDir = Join-Path $repoRoot "deploy-logs"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$logPath = Join-Path $logDir "deploy-$timestamp.log"
$nodePath = "C:\tmp\node-v24.14.0-win-x64\node.exe"
$deployScript = Join-Path $repoRoot "scripts\deploy-node.mjs"

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Fail {
  param([string]$Message)
  Write-Host ""
  Write-Host "DEPLOY FAILED: $Message" -ForegroundColor Red
  Write-Host "Log file: $logPath" -ForegroundColor Yellow
  exit 1
}

function Import-DotEnv {
  param([string]$Path)
  if (-not (Test-Path $Path)) {
    Fail "Missing .env file. Copy .env.example to .env and fill GitHub / Cloudflare values."
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
    Fail "Missing required environment variables: $($missing -join ', ')"
  }
}

function Test-RouteFile {
  param([string]$Route)
  $target = if ($Route -eq "/") {
    Join-Path $repoRoot "index.html"
  } else {
    Join-Path $repoRoot ($Route.Trim("/") -replace "/", "\")
  }
  if ((Test-Path $target) -and (Get-Item $target).PSIsContainer) {
    $target = Join-Path $target "index.html"
  }
  if (-not (Test-Path $target)) {
    Fail "Route $Route is missing local file $target"
  }
}

Set-Location $repoRoot
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

Start-Transcript -Path $logPath -Force | Out-Null
try {
  Write-Step "Checking local environment"
  if (-not (Test-Path $nodePath)) { Fail "Node runtime not found at $nodePath" }
  if (-not (Test-Path $deployScript)) { Fail "Deploy script not found at $deployScript" }
  Import-DotEnv -Path (Join-Path $repoRoot ".env")
  Require-Env -Names @("GITHUB_TOKEN", "GITHUB_USER", "GITHUB_REPO", "CLOUDFLARE_TOKEN", "DOMAIN", "ROOT_DOMAIN")

  Write-Step "Checking JavaScript syntax"
  & $nodePath --check (Join-Path $repoRoot "app.js")
  if ($LASTEXITCODE -ne 0) { Fail "app.js syntax check failed" }

  Write-Step "Checking required pages"
  @(
    "/",
    "/zh/",
    "/gallery/",
    "/zh/gallery/",
    "/tool/",
    "/zh/tool/",
    "/image-prompt-pack/",
    "/zh/image-prompt-pack/",
    "/free-pack/",
    "/zh/free-pack/",
    "/recommended-tools/",
    "/zh/recommended-tools/",
    "/library/",
    "/zh/library/"
  ) | ForEach-Object { Test-RouteFile -Route $_ }

  Write-Step "Deploying to GitHub Pages and Cloudflare"
  & $nodePath $deployScript
  if ($LASTEXITCODE -ne 0) { Fail "deploy-node.mjs exited with code $LASTEXITCODE" }

  Write-Step "Deployment finished"
  Write-Host "Site: https://www.promptarc.cc/" -ForegroundColor Green
  Write-Host "Log file: $logPath"
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
