$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$logDir = Join-Path $repoRoot "deploy-logs"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$logPath = Join-Path $logDir "auto-push-deploy-$timestamp.log"

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Fail {
  param([string]$Message)
  Write-Host ""
  Write-Host "AUTO PUBLISH FAILED: $Message" -ForegroundColor Red
  Write-Host "Log file: $logPath" -ForegroundColor Yellow
  exit 1
}

function Import-DotEnv {
  param([string]$Path)

  if (-not (Test-Path $Path)) {
    Fail "Missing .env file. Create it from .env.example first."
  }

  Get-Content -Encoding UTF8 $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) { return }
    if ($line -notmatch "^(?<k>[A-Za-z_][A-Za-z0-9_]*)=(?<v>.*)$") { return }

    $key = $Matches.k
    $value = $Matches.v.Trim()
    if ($value.StartsWith('"') -and $value.EndsWith('"')) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    if ($value.StartsWith("'") -and $value.EndsWith("'")) {
      $value = $value.Substring(1, $value.Length - 2)
    }

    [Environment]::SetEnvironmentVariable($key, $value, "Process")
  }
}

function Require-Env {
  param([string[]]$Names)

  $missing = @()
  foreach ($name in $Names) {
    $value = [Environment]::GetEnvironmentVariable($name, "Process")
    if ([string]::IsNullOrWhiteSpace($value)) {
      $missing += $name
    }
  }

  if ($missing.Count -gt 0) {
    Fail "Missing required .env values: $($missing -join ', ')"
  }
}

function Get-ProxyValue {
  foreach ($key in @("DEPLOY_PROXY", "HTTPS_PROXY", "HTTP_PROXY", "API_PROXY")) {
    $value = [Environment]::GetEnvironmentVariable($key, "Process")
    if (-not [string]::IsNullOrWhiteSpace($value)) {
      return $value.Trim()
    }
  }
  return $null
}

function Get-GitBaseArgs {
  $args = @(
    "-c", "http.sslBackend=openssl",
    "-c", "gc.auto=0",
    "-c", "maintenance.auto=false",
    "-c", "fetch.writeCommitGraph=false",
    "-c", "core.multiPackIndex=false"
  )

  $proxy = Get-ProxyValue
  if (-not [string]::IsNullOrWhiteSpace($proxy)) {
    $args += @("-c", "http.proxy=$proxy", "-c", "https.proxy=$proxy")
  }

  return $args
}

function Invoke-GitSafe {
  param([string[]]$GitArgs)

  $baseArgs = Get-GitBaseArgs
  & git @baseArgs @GitArgs
  if ($LASTEXITCODE -ne 0) {
    throw "git $($GitArgs -join ' ') failed"
  }
}

function Invoke-GitPushWithToken {
  param(
    [string]$RemoteUrl,
    [string]$SourceRef,
    [string]$DestinationRef,
    [string]$Token,
    [string]$LeaseRef,
    [string]$LeaseValue
  )

  $escapedToken = [System.Uri]::EscapeDataString($Token)
  $authUrl = $RemoteUrl -replace "^https://", "https://x-access-token:$escapedToken@"
  $baseArgs = Get-GitBaseArgs
  $pushArgs = @("push")
  if (-not [string]::IsNullOrWhiteSpace($LeaseRef) -and -not [string]::IsNullOrWhiteSpace($LeaseValue)) {
    $pushArgs += "--force-with-lease=$LeaseRef`:$LeaseValue"
  }
  $pushArgs += @($authUrl, ($SourceRef + ":" + $DestinationRef))

  & git @baseArgs @pushArgs
  if ($LASTEXITCODE -ne 0) {
    throw "git push failed"
  }
}

function Assert-SafeDeployPath {
  param([string]$Path)

  $resolvedRoot = [System.IO.Path]::GetFullPath($repoRoot)
  $resolvedPath = [System.IO.Path]::GetFullPath($Path)
  $expectedPrefix = [System.IO.Path]::GetFullPath((Join-Path $repoRoot "_deploy"))
  if (-not $resolvedPath.StartsWith($expectedPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    Fail "Unsafe deploy path: $resolvedPath"
  }
  if ($resolvedPath -eq $resolvedRoot) {
    Fail "Deploy path must not be the repository root."
  }
}

function Copy-DeployFile {
  param(
    [string]$SourcePath,
    [string]$DeployRoot
  )

  $rootPrefix = [System.IO.Path]::GetFullPath($repoRoot).TrimEnd("\") + "\"
  $fullSource = [System.IO.Path]::GetFullPath($SourcePath)
  if (-not $fullSource.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    return
  }
  $relative = $fullSource.Substring($rootPrefix.Length)
  $relative = $relative.Replace("\", "/")
  if ($relative -match "^\.git(/|$)") { return }
  if ($relative -match "^_deploy(/|$)") { return }
  if ($relative -match "^deploy-logs(/|$)") { return }
  if ($relative -match "^content-pipeline(/|$)") { return }
  if ($relative -match "^gumroad-product(/|$)") { return }
  if ($relative -match "^node_modules(/|$)") { return }
  if ($relative -match "^assets/gallery(/|$)") { return }
  if ($relative -match "^\.env($|\.|/)") { return }
  if ($relative -match "\.log$") { return }

  $target = Join-Path $DeployRoot $relative
  $targetDir = Split-Path -Parent $target
  New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
  Copy-Item -LiteralPath $SourcePath -Destination $target -Force
}

function Update-DeployAssetUrls {
  param(
    [string]$DeployRoot,
    [string]$PublicBase
  )

  if ([string]::IsNullOrWhiteSpace($PublicBase)) {
    $PublicBase = "https://img.promptarc.cc"
  }
  $PublicBase = $PublicBase.TrimEnd("/")

  $textExtensions = @(".html", ".js", ".css", ".xml", ".txt", ".json", ".webmanifest")
  Get-ChildItem -LiteralPath $DeployRoot -Recurse -File | ForEach-Object {
    if ($textExtensions -notcontains $_.Extension.ToLowerInvariant()) { return }
    $content = [System.IO.File]::ReadAllText($_.FullName, [System.Text.Encoding]::UTF8)
    $next = $content.Replace('"/assets/gallery/', '"' + $PublicBase + '/assets/gallery/')
    $next = $next.Replace("'/assets/gallery/", "'" + $PublicBase + "/assets/gallery/")
    $next = $next.Replace("url(/assets/gallery/", "url(" + $PublicBase + "/assets/gallery/")
    if ($next -ne $content) {
      $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
      [System.IO.File]::WriteAllText($_.FullName, $next, $utf8NoBom)
    }
  }
}

function Build-LightweightDeployRepo {
  param([string]$DeployRoot)

  Assert-SafeDeployPath -Path $DeployRoot
  if (Test-Path $DeployRoot) {
    Remove-Item -LiteralPath $DeployRoot -Recurse -Force
  }
  New-Item -ItemType Directory -Force -Path $DeployRoot | Out-Null

  Write-Step "Building lightweight Pages artifact"
  Get-ChildItem -LiteralPath $repoRoot -Recurse -File -Force | ForEach-Object {
    Copy-DeployFile -SourcePath $_.FullName -DeployRoot $DeployRoot
  }

  $publicBase = [Environment]::GetEnvironmentVariable("R2_PUBLIC_BASE", "Process")
  Update-DeployAssetUrls -DeployRoot $DeployRoot -PublicBase $publicBase

  $galleryPath = Join-Path $DeployRoot "assets\gallery"
  if (Test-Path $galleryPath) {
    Fail "Lightweight deploy artifact still contains assets/gallery."
  }

  Set-Location $DeployRoot
  Invoke-GitSafe -GitArgs @("init")
  Invoke-GitSafe -GitArgs @("checkout", "-B", $githubBranch)
  Invoke-GitSafe -GitArgs @("add", "-A")
  $env:GIT_AUTHOR_NAME = "PromptArc Auto Publish"
  $env:GIT_AUTHOR_EMAIL = "deploy@promptarc.cc"
  $env:GIT_COMMITTER_NAME = "PromptArc Auto Publish"
  $env:GIT_COMMITTER_EMAIL = "deploy@promptarc.cc"
  $commitMessage = "Publish lightweight site " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
  Invoke-GitSafe -GitArgs @("commit", "-m", $commitMessage)
}

Set-Location $repoRoot
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

Start-Transcript -Path $logPath -Force | Out-Null
try {
  Write-Host "PromptArc auto push and deploy"
  Write-Host "=============================="
  Write-Host "Repo: $repoRoot"
  Write-Host "Log : $logPath"

  Write-Step "Loading environment"
  Import-DotEnv -Path (Join-Path $repoRoot ".env")
  Require-Env -Names @("GITHUB_TOKEN", "GITHUB_USER", "GITHUB_REPO")

  $githubToken = [Environment]::GetEnvironmentVariable("GITHUB_TOKEN", "Process")
  $githubUser = [Environment]::GetEnvironmentVariable("GITHUB_USER", "Process")
  $githubRepo = [Environment]::GetEnvironmentVariable("GITHUB_REPO", "Process")
  $githubBranch = [Environment]::GetEnvironmentVariable("GITHUB_BRANCH", "Process")
  if ([string]::IsNullOrWhiteSpace($githubBranch)) {
    $githubBranch = "main"
  }

  $remoteUrl = "https://github.com/$githubUser/$githubRepo.git"
  $proxy = Get-ProxyValue
  if ([string]::IsNullOrWhiteSpace($proxy)) {
    Write-Host "Transport: direct first" -ForegroundColor DarkGray
  } else {
    Write-Host "Transport: git with proxy $proxy" -ForegroundColor DarkGray
  }

  if (-not (Test-Path ".git")) {
    Fail "Current folder is not a git repository."
  }

  if (-not (Test-Path ".github\workflows\deploy-pages.yml")) {
    Fail "Missing .github/workflows/deploy-pages.yml. GitHub Actions auto deploy workflow is required."
  }

  Write-Step "Fetching remote branch"
  Set-Location $repoRoot
  Invoke-GitSafe -GitArgs @("fetch", "--prune", "origin", $githubBranch)

  Write-Step "Checking remote branch"
  $remoteBranchExists = $false
  try {
    & git rev-parse --verify ("origin/" + $githubBranch) *> $null
    if ($LASTEXITCODE -eq 0) { $remoteBranchExists = $true }
  } catch {
    $remoteBranchExists = $false
  }

  if (-not $remoteBranchExists) {
    Write-Host "Remote branch does not exist yet. First push will create it." -ForegroundColor DarkGray
  }

  if ($remoteBranchExists) {
    $backupBranch = "backup/" + $githubBranch + "-" + (Get-Date -Format "yyyyMMdd-HHmmss")
    $remoteHead = (& git rev-parse ("origin/" + $githubBranch)).Trim()
    if ([string]::IsNullOrWhiteSpace($remoteHead)) {
      Fail "Could not read origin/$githubBranch commit for safe publishing."
    }

    Write-Step "Backing up remote $githubBranch to $backupBranch"
    Invoke-GitPushWithToken `
      -RemoteUrl $remoteUrl `
      -SourceRef ("refs/remotes/origin/" + $githubBranch) `
      -DestinationRef ("refs/heads/" + $backupBranch) `
      -Token $githubToken
    Write-Host "Remote backup created: $backupBranch" -ForegroundColor Green
  }

  if (([Environment]::GetEnvironmentVariable("SKIP_R2_SYNC", "Process")) -ne "1") {
    Write-Step "Syncing gallery images to R2"
    $nodePath = "C:\tmp\node-v24.14.0-win-x64\node.exe"
    if (-not (Test-Path $nodePath)) { $nodePath = "node" }
    & $nodePath "scripts\upload-gallery-to-r2.mjs"
    if ($LASTEXITCODE -ne 0) {
      Fail "R2 gallery sync failed."
    }
  } else {
    Write-Host "R2 sync skipped by SKIP_R2_SYNC=1." -ForegroundColor DarkGray
  }

  $deployRoot = Join-Path $repoRoot "_deploy\promptarc-pages"
  Build-LightweightDeployRepo -DeployRoot $deployRoot

  Write-Step "Pushing to GitHub"
  Invoke-GitPushWithToken `
    -RemoteUrl $remoteUrl `
    -SourceRef "HEAD" `
    -DestinationRef ("refs/heads/" + $githubBranch) `
    -Token $githubToken `
    -LeaseRef ("refs/heads/" + $githubBranch) `
    -LeaseValue $remoteHead

  Write-Step "Push completed"
  Write-Host "GitHub repo: https://github.com/$githubUser/$githubRepo" -ForegroundColor Green
  Write-Host "GitHub Actions should now deploy PromptArc Pages automatically." -ForegroundColor Green
  Write-Host "Check Actions: https://github.com/$githubUser/$githubRepo/actions" -ForegroundColor Yellow
}
catch {
  Write-Host $_.Exception.Message -ForegroundColor Red
  Write-Host $_.ScriptStackTrace
  Write-Host "Log file: $logPath" -ForegroundColor Yellow
  exit 1
}
finally {
  Stop-Transcript | Out-Null
}
