$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$nodeExe = "C:\tmp\node-v24.14.0-win-x64\node.exe"

powershell -ExecutionPolicy Bypass -File (Join-Path $repoRoot "scripts\run-expansion-200.ps1")
if ($LASTEXITCODE -ne 0) {
  throw "Expansion pipeline failed."
}

Write-Host "=== Uploading gallery assets to R2 ==="
& $nodeExe (Join-Path $repoRoot "scripts\upload-gallery-to-r2.mjs")
if ($LASTEXITCODE -ne 0) {
  throw "R2 upload failed."
}

Write-Host "=== Deploying website ==="
& $nodeExe (Join-Path $repoRoot "scripts\deploy-node.mjs")
if ($LASTEXITCODE -ne 0) {
  throw "Deploy failed."
}

Write-Host "=== Verifying local gallery count ==="
$count = & $nodeExe -e "const fs=require('fs'); const vm=require('vm'); const ctx={window:{}}; vm.createContext(ctx); vm.runInContext(fs.readFileSync('gallery/gallery-data.js','utf8'),ctx); console.log(ctx.window.PROMPTARC_GALLERY.length)"
if ([int]$count -lt 200) {
  throw "Gallery count is $count, expected at least 200."
}

Write-Host "Expansion, R2 upload, deployment, and local count verification completed. Gallery count: $count"
