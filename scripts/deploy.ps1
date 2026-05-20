param(
  [string]$EnvPath = ".env",
  [switch]$SkipGitPush
)

$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot
$script:ApiProxy = $null

function Import-DotEnv {
  param([string]$Path)
  if (-not (Test-Path $Path)) { return }
  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) { return }
    if ($line -notmatch "^(?<k>[A-Za-z_][A-Za-z0-9_]*)=(?<v>.*)$") { return }
    $key = $Matches.k
    $value = $Matches.v.Trim()
    if ($value.StartsWith('"') -and $value.EndsWith('"')) { $value = $value.Substring(1, $value.Length - 2) }
    if ($value.StartsWith("'") -and $value.EndsWith("'")) { $value = $value.Substring(1, $value.Length - 2) }
    [Environment]::SetEnvironmentVariable($key, $value, "Process")
  }
}

function Require-Env {
  param([string[]]$Names)
  $missing = @()
  foreach ($name in $Names) {
    $value = [Environment]::GetEnvironmentVariable($name, "Process")
    if ([string]::IsNullOrWhiteSpace($value)) { $missing += $name }
  }
  if ($missing.Count -gt 0) {
    throw "Missing required environment variables: $($missing -join ', ')"
  }
}

function Write-FileUtf8NoBom {
  param([string]$Path, [string]$Content)
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

function Invoke-Git {
  param([string[]]$GitArgs)
  & git -c http.sslBackend=openssl @GitArgs
  if ($LASTEXITCODE -ne 0) { throw "git $($GitArgs -join ' ') failed" }
}

function Invoke-GitPushWithToken {
  param([string]$RemoteUrl, [string]$Branch)
  $auth = "AUTHORIZATION: bearer $githubToken"
  & git -c http.sslBackend=openssl -c "http.https://github.com/.extraheader=$auth" push -u $RemoteUrl $Branch
  if ($LASTEXITCODE -ne 0) { throw "git push failed" }
}

function Invoke-GitHubApi {
  param(
    [string]$Method,
    [string]$Uri,
    [object]$Body = $null
  )

  $ghHeaders = @{
    Authorization = "Bearer $githubToken"
    Accept = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
  }

  $request = @{
    Method = $Method
    Headers = $ghHeaders
    Uri = $Uri
  }
  if ($script:ApiProxy) { $request.Proxy = $script:ApiProxy }
  if ($null -ne $Body) {
    $request.Body = ($Body | ConvertTo-Json -Depth 10)
    $request.ContentType = "application/json"
  }

  return Invoke-RestMethod @request
}

function Ensure-GitHubRepo {
  $repoUri = "https://api.github.com/repos/$githubUser/$githubRepo"
  try {
    Invoke-GitHubApi -Method Get -Uri $repoUri | Out-Null
    Write-Host "GitHub repo exists."
  } catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -ne 404) { throw }
    Write-Host "Creating GitHub repo."
    Invoke-GitHubApi -Method Post -Uri "https://api.github.com/user/repos" -Body @{
      name = $githubRepo
      private = $false
      auto_init = $false
      has_issues = $true
      has_projects = $false
      has_wiki = $false
    } | Out-Null
  }
}

function Ensure-GitHubPages {
  $pagesUri = "https://api.github.com/repos/$githubUser/$githubRepo/pages"
  $source = @{
    branch = $githubBranch
    path = "/"
  }

  try {
    Invoke-GitHubApi -Method Get -Uri $pagesUri | Out-Null
    Write-Host "Updating GitHub Pages settings."
    Invoke-GitHubApi -Method Put -Uri $pagesUri -Body @{ source = $source } | Out-Null
  } catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -ne 404) { throw }
    Write-Host "Enabling GitHub Pages."
    Invoke-GitHubApi -Method Post -Uri $pagesUri -Body @{ source = $source } | Out-Null
  }

  try {
    Invoke-GitHubApi -Method Put -Uri "$pagesUri/https" -Body @{ enabled = $true } | Out-Null
  } catch {
    Write-Host "HTTPS enforcement may need a few minutes before it can be enabled."
  }
}

function Get-CloudflareRecordsByName {
  param([string]$Name)
  $request = @{
    Method = "Get"
    Headers = $headers
    Uri = "$cfBase/zones/$zoneId/dns_records?name=$Name"
  }
  if ($script:ApiProxy) { $request.Proxy = $script:ApiProxy }
  return Invoke-RestMethod @request
}

function Remove-ConflictingRecords {
  param(
    [string]$Name,
    [string[]]$AllowedTypes
  )

  $records = Get-CloudflareRecordsByName -Name $Name
  foreach ($record in $records.result) {
    if ($AllowedTypes -notcontains $record.type) {
      $request = @{
        Method = "Delete"
        Headers = $headers
        Uri = "$cfBase/zones/$zoneId/dns_records/$($record.id)"
      }
      if ($script:ApiProxy) { $request.Proxy = $script:ApiProxy }
      Invoke-RestMethod @request | Out-Null
    }
  }
}

function Upsert-CloudflareRecord {
  param([hashtable]$Record)

  $getRequest = @{
    Method = "Get"
    Headers = $headers
    Uri = "$cfBase/zones/$zoneId/dns_records?type=$($Record.type)&name=$($Record.name)&content=$($Record.content)"
  }
  if ($script:ApiProxy) { $getRequest.Proxy = $script:ApiProxy }
  $existing = Invoke-RestMethod @getRequest
  if ($existing.result.Count -gt 0) {
    $recordId = $existing.result[0].id
    $putRequest = @{
      Method = "Put"
      Headers = $headers
      Uri = "$cfBase/zones/$zoneId/dns_records/$recordId"
      Body = ($Record | ConvertTo-Json -Depth 5)
      ContentType = "application/json"
    }
    if ($script:ApiProxy) { $putRequest.Proxy = $script:ApiProxy }
    Invoke-RestMethod @putRequest | Out-Null
  } else {
    $postRequest = @{
      Method = "Post"
      Headers = $headers
      Uri = "$cfBase/zones/$zoneId/dns_records"
      Body = ($Record | ConvertTo-Json -Depth 5)
      ContentType = "application/json"
    }
    if ($script:ApiProxy) { $postRequest.Proxy = $script:ApiProxy }
    Invoke-RestMethod @postRequest | Out-Null
  }
}

Import-DotEnv -Path $EnvPath

Require-Env -Names @("GITHUB_TOKEN","GITHUB_USER","GITHUB_REPO","CLOUDFLARE_TOKEN","DOMAIN","ROOT_DOMAIN")

$githubToken = [Environment]::GetEnvironmentVariable("GITHUB_TOKEN", "Process")
$githubUser = [Environment]::GetEnvironmentVariable("GITHUB_USER", "Process")
$githubRepo = [Environment]::GetEnvironmentVariable("GITHUB_REPO", "Process")
$githubBranch = [Environment]::GetEnvironmentVariable("GITHUB_BRANCH", "Process")
if ([string]::IsNullOrWhiteSpace($githubBranch)) { $githubBranch = "main" }
$domain = [Environment]::GetEnvironmentVariable("DOMAIN", "Process")
$rootDomain = [Environment]::GetEnvironmentVariable("ROOT_DOMAIN", "Process")
$cloudflareToken = [Environment]::GetEnvironmentVariable("CLOUDFLARE_TOKEN", "Process")
$zoneId = [Environment]::GetEnvironmentVariable("CLOUDFLARE_ZONE_ID", "Process")
$envProxy = [Environment]::GetEnvironmentVariable("API_PROXY", "Process")
if ([string]::IsNullOrWhiteSpace($envProxy)) {
  $envProxy = [Environment]::GetEnvironmentVariable("HTTPS_PROXY", "Process")
}
if ([string]::IsNullOrWhiteSpace($envProxy)) {
  $envProxy = [Environment]::GetEnvironmentVariable("HTTP_PROXY", "Process")
}
if ([string]::IsNullOrWhiteSpace($envProxy)) {
  $gitProxy = @(& git config --global --get https.proxy)
  if ($gitProxy.Count -eq 0) { $gitProxy = @(& git config --global --get http.proxy) }
  $envProxy = ($gitProxy -join "").Trim()
}
if (-not [string]::IsNullOrWhiteSpace($envProxy)) {
  $script:ApiProxy = $envProxy
  Write-Host "Using API proxy from local configuration."
}

if (Test-Path ".git") {
  Write-Host "Git repo detected."
} else {
  Invoke-Git -GitArgs @("init")
}

try {
  $currentBranch = (& git branch --show-current).Trim()
} catch {
  $currentBranch = ""
}
if ([string]::IsNullOrWhiteSpace($currentBranch)) {
  Invoke-Git -GitArgs @("checkout", "-b", $githubBranch)
} elseif ($currentBranch -ne $githubBranch) {
  Invoke-Git -GitArgs @("branch", "-M", $githubBranch)
  $currentBranch = $githubBranch
}

$cnamePath = Join-Path $repoRoot "CNAME"
Write-FileUtf8NoBom -Path $cnamePath -Content $domain

Ensure-GitHubRepo

$gitStatus = & git status --porcelain
if ($gitStatus) {
  Invoke-Git -GitArgs @("add", ".")
  $env:GIT_AUTHOR_NAME = "PromptArc Deploy"
  $env:GIT_AUTHOR_EMAIL = "deploy@promptarc.cc"
  $env:GIT_COMMITTER_NAME = "PromptArc Deploy"
  $env:GIT_COMMITTER_EMAIL = "deploy@promptarc.cc"
  Invoke-Git -GitArgs @("commit", "-m", "Initial PromptArc launch")
}

if (-not $SkipGitPush) {
  $remoteUrl = "https://github.com/$githubUser/$githubRepo.git"
  Invoke-GitPushWithToken -RemoteUrl $remoteUrl -Branch $githubBranch
}

Ensure-GitHubPages

$headers = @{
  Authorization = "Bearer $cloudflareToken"
  "Content-Type" = "application/json"
}

$cfBase = "https://api.cloudflare.com/client/v4"

if ([string]::IsNullOrWhiteSpace($zoneId)) {
  $zoneRequest = @{
    Method = "Get"
    Headers = $headers
    Uri = "$cfBase/zones?name=$rootDomain"
  }
  if ($script:ApiProxy) { $zoneRequest.Proxy = $script:ApiProxy }
  $zoneLookup = Invoke-RestMethod @zoneRequest
  if (-not $zoneLookup.success -or $zoneLookup.result.Count -eq 0) {
    throw "Cloudflare zone not found for $rootDomain. Confirm the domain is active in Cloudflare and the token can read zones."
  }
  $zoneId = $zoneLookup.result[0].id
  Write-Host "Resolved Cloudflare Zone ID for $rootDomain."
}

$githubPagesIps = @(
  "185.199.108.153",
  "185.199.109.153",
  "185.199.110.153",
  "185.199.111.153"
)

Remove-ConflictingRecords -Name $domain -AllowedTypes @("CNAME")
Remove-ConflictingRecords -Name $rootDomain -AllowedTypes @("A")

$dnsRecords = @(
  @{
    type = "CNAME"
    name = $domain
    content = "$githubUser.github.io"
    proxied = $false
    ttl = 1
  }
)

$githubPagesIps | ForEach-Object {
  $dnsRecords += @{
    type = "A"
    name = $rootDomain
    content = $_
    proxied = $false
    ttl = 1
  }
}

foreach ($record in $dnsRecords) {
  Upsert-CloudflareRecord -Record $record
}

Write-Host "Deployment automation complete."
Write-Host "GitHub repo: https://github.com/$githubUser/$githubRepo"
Write-Host "GitHub Pages: https://$domain"
Write-Host "Cloudflare zone updated for $domain and $rootDomain"
