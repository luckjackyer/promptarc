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
    [string]$Branch,
    [string]$Token
  )

  $escapedToken = [System.Uri]::EscapeDataString($Token)
  $authUrl = $RemoteUrl -replace "^https://", "https://x-access-token:$escapedToken@"
  $baseArgs = Get-GitBaseArgs

  & git @baseArgs push $authUrl ("HEAD:" + $Branch)
  if ($LASTEXITCODE -ne 0) {
    throw "git push failed"
  }
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

  Write-Step "Preparing branch"
  $currentBranch = (& git branch --show-current).Trim()
  if ([string]::IsNullOrWhiteSpace($currentBranch)) {
    Invoke-GitSafe -GitArgs @("checkout", "-b", $githubBranch)
  } elseif ($currentBranch -ne $githubBranch) {
    Invoke-GitSafe -GitArgs @("checkout", $githubBranch)
  }

  $originExists = $true
  try {
    $null = & git remote get-url origin
  } catch {
    $originExists = $false
  }
  if (-not $originExists) {
    Invoke-GitSafe -GitArgs @("remote", "add", "origin", $remoteUrl)
  }

  Write-Step "Auto commit local changes"
  $gitStatus = & git status --porcelain
  if ($gitStatus) {
    Invoke-GitSafe -GitArgs @("add", "-A")
    $env:GIT_AUTHOR_NAME = "PromptArc Auto Publish"
    $env:GIT_AUTHOR_EMAIL = "deploy@promptarc.cc"
    $env:GIT_COMMITTER_NAME = "PromptArc Auto Publish"
    $env:GIT_COMMITTER_EMAIL = "deploy@promptarc.cc"
    $commitMessage = "Publish update " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
    Invoke-GitSafe -GitArgs @("commit", "-m", $commitMessage)
  } else {
    Write-Host "No uncommitted local changes." -ForegroundColor DarkGray
  }

  Write-Step "Fetching remote branch"
  Invoke-GitSafe -GitArgs @("fetch", "--prune", "origin", $githubBranch)

  Write-Step "Rebasing on latest origin/$githubBranch"
  $remoteBranchExists = $false
  try {
    & git rev-parse --verify ("origin/" + $githubBranch) *> $null
    if ($LASTEXITCODE -eq 0) { $remoteBranchExists = $true }
  } catch {
    $remoteBranchExists = $false
  }

  if ($remoteBranchExists) {
    try {
      Invoke-GitSafe -GitArgs @("rebase", ("origin/" + $githubBranch))
    } catch {
      & git rebase --abort *> $null
      throw "Automatic rebase failed. Resolve local conflicts once, then rerun AUTO-PUSH-AND-DEPLOY."
    }
  } else {
    Write-Host "Remote branch does not exist yet. First push will create it." -ForegroundColor DarkGray
  }

  Write-Step "Pushing to GitHub"
  Invoke-GitPushWithToken -RemoteUrl $remoteUrl -Branch $githubBranch -Token $githubToken

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
