$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$galleryDataPath = Join-Path $repoRoot "gallery\gallery-data.js"
$galleryDir = Join-Path $repoRoot "assets\gallery"
$thumbDir = Join-Path $galleryDir "thumbs"
$quality = 78L

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
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.Clear([System.Drawing.Color]::White)
        $graphics.DrawImage($image, 0, 0, $image.Width, $image.Height)
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
$files = Get-ChildItem -Path $galleryDir -File -Filter "expansion-*.png"

foreach ($file in $files) {
  $target = [System.IO.Path]::ChangeExtension($file.FullName, ".jpg")
  Save-Jpeg -SourcePath $file.FullName -TargetPath $target -Quality $quality
  $oldUrl = "/assets/gallery/$($file.Name)"
  $newUrl = "/assets/gallery/$([System.IO.Path]::GetFileName($target))"
  $content = $content.Replace($oldUrl, $newUrl)
  Write-Host "$($file.Name) -> $([System.IO.Path]::GetFileName($target))"
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($galleryDataPath, $content, $utf8NoBom)

Remove-Item -Force -ErrorAction SilentlyContinue (Join-Path $galleryDir "expansion-*.png")
Remove-Item -Force -ErrorAction SilentlyContinue (Join-Path $thumbDir "expansion-*.png")

powershell -ExecutionPolicy Bypass -File (Join-Path $repoRoot "scripts\create-thumbnails-from-manifest.ps1") "content-pipeline\priority-batch-05.json"
powershell -ExecutionPolicy Bypass -File (Join-Path $repoRoot "scripts\create-thumbnails-from-manifest.ps1") "content-pipeline\priority-batch-06.json"
powershell -ExecutionPolicy Bypass -File (Join-Path $repoRoot "scripts\create-thumbnails-from-manifest.ps1") "content-pipeline\priority-batch-07.json"
powershell -ExecutionPolicy Bypass -File (Join-Path $repoRoot "scripts\create-thumbnails-from-manifest.ps1") "content-pipeline\priority-batch-08.json"
powershell -ExecutionPolicy Bypass -File (Join-Path $repoRoot "scripts\create-thumbnails-from-manifest.ps1") "content-pipeline\priority-batch-09.json"
