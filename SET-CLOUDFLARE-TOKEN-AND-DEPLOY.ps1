$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$envPath = Join-Path $repoRoot ".env"

function Set-EnvValue {
  param(
    [string]$Path,
    [string]$Key,
    [string]$Value
  )

  if (-not (Test-Path $Path)) {
    Copy-Item (Join-Path $repoRoot ".env.example") $Path
  }

  $lines = Get-Content -Encoding UTF8 $Path
  $found = $false
  $next = foreach ($line in $lines) {
    if ($line -match "^$([regex]::Escape($Key))=") {
      $found = $true
      "$Key=$Value"
    } else {
      $line
    }
  }

  if (-not $found) {
    $next += "$Key=$Value"
  }

  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, ($next -join [Environment]::NewLine), $utf8NoBom)
}

Set-Location $repoRoot

Write-Host "PromptArc Cloudflare token update" -ForegroundColor Cyan
Write-Host "================================="
Write-Host "Paste the new Cloudflare token below. It will not be printed back." -ForegroundColor Yellow

$secureToken = Read-Host "Cloudflare token" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
try {
  $token = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}

if ([string]::IsNullOrWhiteSpace($token)) {
  throw "Token is empty."
}

Set-EnvValue -Path $envPath -Key "CLOUDFLARE_TOKEN" -Value $token.Trim()

Write-Host ""
Write-Host "CLOUDFLARE_TOKEN updated in .env." -ForegroundColor Green
Write-Host "Starting one-click full deploy..." -ForegroundColor Cyan
Write-Host ""

powershell -ExecutionPolicy Bypass -File (Join-Path $repoRoot "ONE-CLICK-FULL-DEPLOY.ps1")
