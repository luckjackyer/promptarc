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

```powershell
node .\scripts\deploy-node.mjs
```

This is the default path going forward. It avoids `git push` and uses the API upload route that successfully published the first version.

## Proxy

Set `API_PROXY` in `.env` if you need a local proxy, for example `http://127.0.0.1:7897`.

## Fallback

The PowerShell script is kept as a fallback, but the Node API uploader is the preferred deployment path.
