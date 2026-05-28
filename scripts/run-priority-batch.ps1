$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$nodeExe = "C:\tmp\node-v24.14.0-win-x64\node.exe"
$jobsPath = Join-Path $repoRoot "content-pipeline\priority-batch-01.jsonl"
$outDir = Join-Path $repoRoot "content-pipeline\generated\priority-batch-01"
$manifestPath = "content-pipeline\priority-batch-01.json"

if (-not $env:OPENAI_API_KEY) {
  throw "OPENAI_API_KEY is missing. Set it for this PowerShell session before running."
}

if (-not $env:OPENAI_BASE_URL) {
  $env:OPENAI_BASE_URL = "https://www.taikuaila.cn/"
}

& $nodeExe (Join-Path $repoRoot "scripts\generate-images-direct.mjs") $jobsPath $outDir
if ($LASTEXITCODE -ne 0) {
  throw "Image generation failed."
}

& $nodeExe (Join-Path $repoRoot "scripts\publish-generated-batch.mjs") $manifestPath $outDir
if ($LASTEXITCODE -ne 0) {
  throw "Publish step failed."
}

powershell -ExecutionPolicy Bypass -File (Join-Path $repoRoot "scripts\create-thumbnails-from-manifest.ps1") $manifestPath
if ($LASTEXITCODE -ne 0) {
  throw "Thumbnail generation failed."
}

& $nodeExe (Join-Path $repoRoot "scripts\generate-gallery-seo-pages.mjs")
if ($LASTEXITCODE -ne 0) {
  throw "SEO page generation failed."
}

Write-Host "Priority batch generation, publish, thumbnail, and SEO refresh completed."
