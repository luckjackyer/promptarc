$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$nodeExe = "C:\tmp\node-v24.14.0-win-x64\node.exe"
$envPath = Join-Path $repoRoot ".env"

if (Test-Path $envPath) {
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

if (-not $env:OPENAI_API_KEY) {
  throw "OPENAI_API_KEY is missing. Set it for this PowerShell session before running."
}

if (-not $env:OPENAI_BASE_URL) {
  $env:OPENAI_BASE_URL = "https://www.taikuaila.cn/"
}

$batches = @("05", "06", "07", "08", "09")

foreach ($batch in $batches) {
  $name = "priority-batch-$batch"
  $jobsPath = Join-Path $repoRoot "content-pipeline\$name.jsonl"
  $manifestPath = "content-pipeline\$name.json"
  $outDir = Join-Path $repoRoot "content-pipeline\generated\$name"

  Write-Host "=== Generating $name ==="
  & $nodeExe (Join-Path $repoRoot "scripts\generate-images-direct.mjs") $jobsPath $outDir
  if ($LASTEXITCODE -ne 0) {
    throw "Image generation failed for $name."
  }

  Write-Host "=== Publishing $name ==="
  & $nodeExe (Join-Path $repoRoot "scripts\publish-generated-batch.mjs") $manifestPath $outDir
  if ($LASTEXITCODE -ne 0) {
    throw "Publish step failed for $name."
  }

  Write-Host "=== Creating thumbnails for $name ==="
  powershell -ExecutionPolicy Bypass -File (Join-Path $repoRoot "scripts\create-thumbnails-from-manifest.ps1") $manifestPath
  if ($LASTEXITCODE -ne 0) {
    throw "Thumbnail generation failed for $name."
  }
}

Write-Host "=== Refreshing SEO pages ==="
& $nodeExe (Join-Path $repoRoot "scripts\generate-gallery-seo-pages.mjs")
if ($LASTEXITCODE -ne 0) {
  throw "SEO page generation failed."
}

Write-Host "Expansion to 200 completed locally."
