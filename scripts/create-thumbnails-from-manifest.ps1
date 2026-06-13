$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$manifestArg = $args[0]

if (-not $manifestArg) {
  throw "Usage: powershell -File scripts/create-thumbnails-from-manifest.ps1 <manifest.json>"
}

$manifestPath = Resolve-Path (Join-Path $repoRoot $manifestArg)
$thumbDir = Join-Path $repoRoot "assets\gallery\thumbs"
$maxWidth = 360
$jpegQuality = 56L

Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force -Path $thumbDir | Out-Null

function Get-JpegEncoder {
  [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object { $_.MimeType -eq "image/jpeg" } |
    Select-Object -First 1
}

function Save-ResizedImage {
  param(
    [string]$SourcePath,
    [string]$TargetPath,
    [int]$MaxWidth,
    [long]$JpegQuality
  )

  $image = [System.Drawing.Image]::FromFile($SourcePath)
  try {
    $scale = [Math]::Min(1.0, [double]$MaxWidth / [double]$image.Width)
    $width = [Math]::Max(1, [int][Math]::Round($image.Width * $scale))
    $height = [Math]::Max(1, [int][Math]::Round($image.Height * $scale))
    $bitmap = New-Object System.Drawing.Bitmap $width, $height
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      try {
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.Clear([System.Drawing.Color]::White)
        $graphics.DrawImage($image, 0, 0, $width, $height)
      }
      finally {
        $graphics.Dispose()
      }

      $extension = [System.IO.Path]::GetExtension($TargetPath).ToLowerInvariant()
      if ($extension -eq ".jpg" -or $extension -eq ".jpeg") {
        $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters 1
        $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), $JpegQuality
        $bitmap.Save($TargetPath, (Get-JpegEncoder), $encoderParams)
      }
      else {
        $bitmap.Save($TargetPath, [System.Drawing.Imaging.ImageFormat]::Png)
      }
    }
    finally {
      $bitmap.Dispose()
    }
  }
  finally {
    $image.Dispose()
  }
}

$items = Get-Content -Raw -Encoding UTF8 $manifestPath | ConvertFrom-Json
foreach ($item in $items) {
  $sourceCandidates = @(
    (Join-Path $repoRoot ("assets\gallery\" + $item.id + ".png")),
    (Join-Path $repoRoot ("assets\gallery\" + $item.id + ".jpg")),
    (Join-Path $repoRoot ("assets\gallery\" + $item.id + ".jpeg")),
    (Join-Path $repoRoot ("assets\gallery\" + $item.id + ".webp"))
  )
  $sourcePath = $sourceCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
  if (-not $sourcePath) {
    throw "Missing gallery asset for $($item.id)"
  }

  $targetPath = Join-Path $thumbDir ([System.IO.Path]::GetFileName($sourcePath))
  Save-ResizedImage -SourcePath $sourcePath -TargetPath $targetPath -MaxWidth $maxWidth -JpegQuality $jpegQuality
  Write-Host "thumb created for $($item.id)"
}
