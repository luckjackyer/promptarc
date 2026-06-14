param(
  [Parameter(Mandatory = $true)]
  [string]$SiteName,

  [Parameter(Mandatory = $true)]
  [string]$Domain,

  [Parameter(Mandatory = $true)]
  [string]$ContactEmail,

  [string]$RootDomain,
  [string]$GumroadUrl = "https://gumroad.com/",
  [string]$NewsletterEndpoint = "",
  [string]$ChatgptLink = "",
  [string]$ClaudeLink = "",
  [string]$PerplexityLink = "",
  [string]$NotionLink = ""
)

$ErrorActionPreference = "Stop"

if (-not $RootDomain) {
  if ($Domain.StartsWith("www.")) {
    $RootDomain = $Domain.Substring(4)
  } else {
    $RootDomain = $Domain
  }
}

$siteUrl = "https://$Domain"

$repoRoot = Split-Path -Parent $PSScriptRoot

$files = @(
  (Join-Path $repoRoot "config.js"),
  (Join-Path $repoRoot "index.html"),
  (Join-Path $repoRoot "tool\index.html"),
  (Join-Path $repoRoot "library\index.html"),
  (Join-Path $repoRoot "free-pack\index.html"),
  (Join-Path $repoRoot "recommended-tools\index.html"),
  (Join-Path $repoRoot "about\index.html"),
  (Join-Path $repoRoot "contact\index.html"),
  (Join-Path $repoRoot "privacy\index.html"),
  (Join-Path $repoRoot "terms\index.html"),
  (Join-Path $repoRoot "sitemap.xml"),
  (Join-Path $repoRoot "robots.txt"),
  (Join-Path $repoRoot "README.md"),
  (Join-Path $repoRoot "LAUNCH-CHECKLIST.md"),
  (Join-Path $repoRoot "SETUP-FAST-LAUNCH.md")
)

function Replace-InFile {
  param(
    [string]$Path,
    [hashtable]$Replacements
  )

  $content = Get-Content -Path $Path -Raw -Encoding UTF8
  foreach ($key in $Replacements.Keys) {
    $content = $content.Replace($key, $Replacements[$key])
  }
  Set-Content -Path $Path -Value $content -Encoding UTF8
}

$replacements = @{
  "PromptFuse" = $SiteName
  "https://www.yourdomain.com" = $siteUrl
  "www.yourdomain.com" = $Domain
  "yourdomain.com" = $RootDomain
  "you@example.com" = $ContactEmail
  "https://gumroad.com/" = $GumroadUrl
}

foreach ($file in $files) {
  if (Test-Path $file) {
    Replace-InFile -Path $file -Replacements $replacements
  }
}

$configPath = Join-Path $repoRoot "config.js"
$configContent = Get-Content -Path $configPath -Raw -Encoding UTF8

if ($NewsletterEndpoint) {
  $configContent = $configContent.Replace('newsletterEndpoint: ""', 'newsletterEndpoint: "' + $NewsletterEndpoint + '"')
}

if ($ChatgptLink) {
  $configContent = [regex]::Replace($configContent, 'chatgpt: ".*?"', 'chatgpt: "' + $ChatgptLink + '"')
}

if ($ClaudeLink) {
  $configContent = [regex]::Replace($configContent, 'claude: ".*?"', 'claude: "' + $ClaudeLink + '"')
}

if ($PerplexityLink) {
  $configContent = [regex]::Replace($configContent, 'perplexity: ".*?"', 'perplexity: "' + $PerplexityLink + '"')
}

if ($NotionLink) {
  $configContent = [regex]::Replace($configContent, 'notion: ".*?"', 'notion: "' + $NotionLink + '"')
}

Set-Content -Path $configPath -Value $configContent -Encoding UTF8

$cnamePath = Join-Path $repoRoot "CNAME"
Set-Content -Path $cnamePath -Value $Domain -Encoding ASCII

Write-Host "Setup complete."
Write-Host "Site name: $SiteName"
Write-Host "Site URL: $siteUrl"
Write-Host "Root domain: $RootDomain"
Write-Host "Contact email: $ContactEmail"
Write-Host "CNAME written to: $cnamePath"
