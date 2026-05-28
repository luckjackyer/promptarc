$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot

powershell -ExecutionPolicy Bypass -File (Join-Path $repoRoot "scripts\run-gallery-expansion-workflow.ps1") `
  -Batches @("05", "06", "07", "08", "09") `
  -ExpectedMinimum 200
