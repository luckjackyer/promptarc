param(
  [string[]]$Batches = @("05", "06", "07", "08", "09"),
  [int]$ExpectedMinimum = 200,
  [switch]$SkipGeneration,
  [switch]$SkipDeploy,
  [switch]$PreflightOnly
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$nodeExe = "C:\tmp\node-v24.14.0-win-x64\node.exe"
$envPath = Join-Path $repoRoot ".env"

function Import-LocalEnv {
  if (-not (Test-Path $envPath)) {
    return
  }

  Get-Content -Encoding UTF8 $envPath | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) {
      return
    }
    if ($line -match "^([A-Za-z_][A-Za-z0-9_]*)=(.*)$") {
      $name = $Matches[1]
      $value = $Matches[2].Trim("'`"")
      if (-not [Environment]::GetEnvironmentVariable($name, "Process")) {
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
      }
    }
  }
}

function Assert-Env {
  param([string[]]$Names)

  $missing = @()
  foreach ($name in $Names) {
    if (-not [Environment]::GetEnvironmentVariable($name, "Process")) {
      $missing += $name
    }
  }
  if ($missing.Count -gt 0) {
    throw "Missing required env vars: $($missing -join ', ')"
  }
}

function Set-IfEmpty {
  param(
    [string]$Name,
    [string]$Value
  )

  if ($Value -and -not [Environment]::GetEnvironmentVariable($Name, "Process")) {
    [Environment]::SetEnvironmentVariable($Name, $Value, "Process")
  }
}

function Test-TcpPort {
  param(
    [string]$HostName,
    [int]$Port
  )

  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $async = $client.BeginConnect($HostName, $Port, $null, $null)
    $ok = $async.AsyncWaitHandle.WaitOne(200)
    if (-not $ok) {
      $client.Close()
      return $false
    }
    $client.EndConnect($async)
    $client.Close()
    return $true
  }
  catch {
    return $false
  }
}

function Initialize-ProxyEnv {
  $existingProxy = $env:DEPLOY_PROXY
  if (-not $existingProxy) { $existingProxy = $env:HTTPS_PROXY }
  if (-not $existingProxy) { $existingProxy = $env:HTTP_PROXY }
  if (-not $existingProxy) { $existingProxy = $env:API_PROXY }

  $candidatePorts = @()
  if ($env:LOCAL_PROXY_PORT) {
    $candidatePorts += [int]$env:LOCAL_PROXY_PORT
  }
  $candidatePorts += @(7890, 7897, 10809, 10808, 1080, 7078, 8080)

  $detectedProxy = $null
  foreach ($port in ($candidatePorts | Select-Object -Unique)) {
    if (Test-TcpPort -HostName "127.0.0.1" -Port $port) {
      $detectedProxy = "http://127.0.0.1:$port"
      break
    }
  }

  $proxy = $existingProxy
  if (-not $proxy) {
    $proxy = $detectedProxy
  }

  if ($proxy) {
    Set-IfEmpty "DEPLOY_PROXY" $proxy
    Set-IfEmpty "API_PROXY" $proxy
    Set-IfEmpty "HTTPS_PROXY" $proxy
    Set-IfEmpty "HTTP_PROXY" $proxy
    Write-Host "Proxy fallback enabled: $proxy"
  }
  else {
    Write-Host "No local proxy detected. Workflow will use direct connections first."
  }
}

function Test-WorkflowPreflight {
  $required = @("R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY")
  if (-not $SkipGeneration) {
    $required += "OPENAI_API_KEY"
  }
  if (-not $SkipDeploy) {
    $required += @("GITHUB_TOKEN", "GITHUB_USER", "GITHUB_REPO", "CLOUDFLARE_TOKEN", "DOMAIN", "ROOT_DOMAIN")
  }
  Assert-Env $required

  if (-not (Test-Path $nodeExe)) {
    throw "Node runtime is missing: $nodeExe"
  }

  foreach ($batch in $Batches) {
    $name = "priority-batch-$batch"
    $jobsPath = Join-Path $repoRoot "content-pipeline\$name.jsonl"
    $manifestPath = Join-Path $repoRoot "content-pipeline\$name.json"
    if (-not $SkipGeneration -and -not (Test-Path $jobsPath)) {
      throw "Missing jobs file: $jobsPath"
    }
    if (-not (Test-Path $manifestPath)) {
      throw "Missing manifest file: $manifestPath"
    }
  }

  Write-Host "Preflight passed."
}

function Invoke-Step {
  param(
    [string]$Name,
    [scriptblock]$Action
  )

  Write-Host ""
  Write-Host "=== $Name ==="
  & $Action
  if ($LASTEXITCODE -ne 0) {
    throw "$Name failed."
  }
}

function Get-GalleryCount {
  $count = & $nodeExe -e "const fs=require('fs'); const vm=require('vm'); const ctx={window:{}}; vm.createContext(ctx); vm.runInContext(fs.readFileSync('gallery/gallery-data.js','utf8'),ctx); console.log(ctx.window.PROMPTARC_GALLERY.length)"
  return [int]$count
}

Import-LocalEnv
Initialize-ProxyEnv

if (-not $env:OPENAI_BASE_URL) {
  $env:OPENAI_BASE_URL = "https://www.taikuaila.cn/"
}

Test-WorkflowPreflight

if ($PreflightOnly) {
  Write-Host "Preflight only mode completed."
  exit 0
}

if (-not $SkipGeneration) {
  foreach ($batch in $Batches) {
    $name = "priority-batch-$batch"
    $jobsPath = Join-Path $repoRoot "content-pipeline\$name.jsonl"
    $manifestPath = "content-pipeline\$name.json"
    $outDir = Join-Path $repoRoot "content-pipeline\generated\$name"

    if (-not (Test-Path $jobsPath)) {
      throw "Missing jobs file: $jobsPath"
    }
    if (-not (Test-Path (Join-Path $repoRoot $manifestPath))) {
      throw "Missing manifest file: $manifestPath"
    }

    Invoke-Step "Generate images for $name" {
      & $nodeExe (Join-Path $repoRoot "scripts\generate-images-direct.mjs") $jobsPath $outDir
    }

    Invoke-Step "Publish $name into gallery-data.js" {
      & $nodeExe (Join-Path $repoRoot "scripts\publish-generated-batch.mjs") $manifestPath $outDir
    }

    Invoke-Step "Create thumbnails for $name" {
      powershell -ExecutionPolicy Bypass -File (Join-Path $repoRoot "scripts\create-thumbnails-from-manifest.ps1") $manifestPath
    }
  }
}

Invoke-Step "Convert generated PNG assets to compressed JPG" {
  powershell -ExecutionPolicy Bypass -File (Join-Path $repoRoot "scripts\convert-expansion-images-to-jpg.ps1")
}

Invoke-Step "Refresh SEO pages and sitemap" {
  & $nodeExe (Join-Path $repoRoot "scripts\generate-gallery-seo-pages.mjs")
}

$localCount = Get-GalleryCount
if ($localCount -lt $ExpectedMinimum) {
  throw "Local gallery count is $localCount, expected at least $ExpectedMinimum."
}
Write-Host "Local gallery count verified: $localCount"

Assert-Env @("R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY")
Invoke-Step "Upload gallery assets to R2" {
  & $nodeExe (Join-Path $repoRoot "scripts\upload-gallery-to-r2.mjs")
}

Invoke-Step "Force-upload expansion thumbnails to R2" {
  & $nodeExe (Join-Path $repoRoot "scripts\upload-expansion-thumbs-to-r2.mjs")
}

if (-not $SkipDeploy) {
  Assert-Env @("GITHUB_TOKEN", "GITHUB_USER", "GITHUB_REPO", "CLOUDFLARE_TOKEN", "DOMAIN", "ROOT_DOMAIN")
  Invoke-Step "Deploy site without gallery blobs" {
    & $nodeExe (Join-Path $repoRoot "scripts\deploy-node.mjs")
  }
}

Invoke-Step "Verify online gallery data" {
  $url = "https://www.promptarc.cc/gallery/gallery-data.js?v=" + [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
  $response = Invoke-WebRequest -UseBasicParsing $url -TimeoutSec 30
  $onlineCount = ([regex]::Matches($response.Content, "\bid\s*:")).Count
  if ($onlineCount -lt $ExpectedMinimum) {
    throw "Online gallery count is $onlineCount, expected at least $ExpectedMinimum."
  }
  Write-Host "Online gallery count verified: $onlineCount"
}

Write-Host ""
Write-Host "Gallery expansion workflow completed."
