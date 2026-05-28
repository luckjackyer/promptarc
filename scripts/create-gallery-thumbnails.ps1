$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$galleryDataPath = Join-Path $repoRoot "gallery\gallery-data.js"
$thumbDir = Join-Path $repoRoot "assets\gallery\thumbs"
$quality = 56L
$maxWidth = 360

Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force -Path $thumbDir | Out-Null

function Get-JpegEncoder {
  [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object { $_.MimeType -eq "image/jpeg" } |
    Select-Object -First 1
}

function Save-Thumbnail {
  param(
    [string]$SourcePath,
    [string]$TargetPath,
    [int]$MaxWidth,
    [long]$Quality
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

      $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters 1
      $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), $Quality
      $bitmap.Save($TargetPath, (Get-JpegEncoder), $encoderParams)
    }
    finally {
      $bitmap.Dispose()
    }
  }
  finally {
    $image.Dispose()
  }
}

$content = Get-Content -Encoding UTF8 -Raw $galleryDataPath
$urls = [regex]::Matches($content, '/assets/gallery/[^"''\s]+\.jpg') |
  ForEach-Object { $_.Value } |
  Sort-Object -Unique

foreach ($url in $urls) {
  $sourcePath = Join-Path $repoRoot ($url.TrimStart('/') -replace '/', '\')
  if (-not (Test-Path $sourcePath)) {
    throw "Missing gallery image: $sourcePath"
  }
  $targetPath = Join-Path $thumbDir ([System.IO.Path]::GetFileName($sourcePath))
  Save-Thumbnail -SourcePath $sourcePath -TargetPath $targetPath -MaxWidth $maxWidth -Quality $quality
  $before = (Get-Item $sourcePath).Length
  $after = (Get-Item $targetPath).Length
  Write-Host "$([System.IO.Path]::GetFileName($sourcePath)) $before -> $after bytes"
}
