# Deployment Automation

## What this does

- Reads secrets from a local `.env` file
- Creates or updates the `CNAME` file
- Initializes git if needed
- Commits and pushes to GitHub
- Creates or updates Cloudflare DNS records for `www` and the root domain

## What you need locally

- Git installed
- PowerShell available
- A local `.env` file copied from `.env.example`

## Required values

- `GITHUB_TOKEN`
- `GITHUB_USER`
- `GITHUB_REPO`
- `CLOUDFLARE_TOKEN`
- `CLOUDFLARE_ZONE_ID`
- `DOMAIN`
- `ROOT_DOMAIN`

## Run

```powershell
.\scripts\deploy.ps1
```

If you want to skip the push step:

```powershell
.\scripts\deploy.ps1 -SkipGitPush
```
