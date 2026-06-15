$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$galleryDataPath = Join-Path $repoRoot "gallery\gallery-data.js"
$galleryDir = Join-Path $repoRoot "assets\gallery"
$quality = 82L

Add-Type -AssemblyName System.Drawing

function Get-JpegEncoder {
  [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object { $_.MimeType -eq "image/jpeg" } |
    Select-Object -First 1
}

function Save-Jpeg {
  param(
    [string]$SourcePath,
    [string]$TargetPath,
    [long]$Quality
  )

  $image = [System.Drawing.Image]::FromFile($SourcePath)
  try {
    $bitmap = New-Object System.Drawing.Bitmap $image.Width, $image.Height
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      try {
        $graphics.Clear([System.Drawing.Color]::White)
        $graphics.DrawImage($image, 0, 0, $image.Width, $image.Height)
      }
      finally {
        $graphics.Dispose()
      }

      $encoder = Get-JpegEncoder
      $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters 1
      $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), $Quality
      $bitmap.Save($TargetPath, $encoder, $encoderParams)
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
$matches = [regex]::Matches($content, '/assets/gallery/(?:regen-|generated-)[^"]+\.(?:png|jpg|jpeg|webp|gif)')
$urls = $matches | ForEach-Object { $_.Value } | Sort-Object -Unique

foreach ($url in $urls) {
  $relative = $url.TrimStart('/') -replace '/', '\'
  $sourcePath = Join-Path $repoRoot $relative
  if (-not (Test-Path $sourcePath)) {
    throw "Missing gallery image: $sourcePath"
  }

  $targetPath = [System.IO.Path]::ChangeExtension($sourcePath, ".jpg")
  if ($sourcePath -ne $targetPath) {
    Save-Jpeg -SourcePath $sourcePath -TargetPath $targetPath -Quality $quality
    $newUrl = [System.IO.Path]::ChangeExtension($url, ".jpg").Replace('\', '/')
    $content = $content.Replace($url, $newUrl)
    $before = (Get-Item $sourcePath).Length
    $after = (Get-Item $targetPath).Length
    Write-Host "$url -> $newUrl ($before -> $after bytes)"
  }
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($galleryDataPath, $content, $utf8NoBom)
