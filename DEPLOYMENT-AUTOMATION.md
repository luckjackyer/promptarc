# Deployment Automation

## What This Does

- Reads secrets from a local `.env` file
- Creates or updates the `CNAME` file
- Uploads files through the GitHub Contents API
- Enables or updates GitHub Pages
- Creates or updates Cloudflare DNS records for `www` and the root domain

## What You Need Locally

- A local `.env` file copied from `.env.example`
- A working local proxy when GitHub or Cloudflare cannot be reached directly
- Node.js when running outside Codex

## Required Values

- `GITHUB_TOKEN`
- `GITHUB_USER`
- `GITHUB_REPO`
- `CLOUDFLARE_TOKEN`
- `CLOUDFLARE_ZONE_ID`
- `DOMAIN`
- `ROOT_DOMAIN`

## Recommended Run

For the full current stack, use:

```powershell
.\ONE-CLICK-FULL-DEPLOY.ps1
```

Or double-click:

```text
ONE-CLICK-FULL-DEPLOY.bat
```

This runs syntax checks, creates/updates D1, deploys the image-generator Worker, pushes the static site, and checks:

```text
https://www.promptarc.cc/api/generate-image/health
```

The older static-only deployment path is:

```powershell
node .\scripts\deploy-node.mjs
```

This avoids `git push` and uses the API upload route that successfully published the first version, but it does not deploy the generator backend.

## Proxy

Set `API_PROXY` in `.env` if you need a local proxy, for example `http://127.0.0.1:7897`.

## Common Failure: Cloudflare 401

If the script shows:

```text
Cloudflare ... failed: 401 Authentication error
```

The `CLOUDFLARE_TOKEN` in `.env` is invalid, expired, copied incorrectly, or lacks access to the account. Create a new Cloudflare API token and update `.env`.

Required Cloudflare permissions for the full deploy:

- Account: D1: Edit
- Account: Workers Scripts: Edit
- Account: Workers Routes: Edit
- Account: R2 Storage: Edit
- Zone: Zone: Read
- Zone: Workers Routes: Edit

## Fallback

The PowerShell script is kept as a fallback, but the Node API uploader is the preferred deployment path.
