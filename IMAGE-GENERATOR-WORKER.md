# PromptArc Image Generator Worker

This backend keeps image API keys out of the browser.

## What It Does

- Receives `POST /api/generate-image` from the static site.
- Validates prompt, ratio, category, and guardrails.
- Calls the configured OpenAI-compatible image API privately.
- Stores the generated image in Cloudflare R2.
- Returns a public image URL from `R2_PUBLIC_BASE`.

## Required Cloudflare Token Permissions

The current deploy failed with `403 Authentication error`, which means the token can deploy R2 assets but cannot upload Workers scripts.

Create or update a Cloudflare API token with these permissions:

- Account: Workers Scripts: Edit
- Account: Workers Routes: Edit
- Account: Workers Tail: Read is optional
- Account: R2 Storage: Edit
- Zone: Zone: Read
- Zone: Workers Routes: Edit

The token must include the Cloudflare account that owns the Worker and the zone for `promptarc.cc`.

## Deploy Command

```powershell
C:\tmp\node-v24.14.0-win-x64\node.exe scripts\deploy-image-worker.mjs
```

## Environment Variables

These are read from local `.env`:

- `CLOUDFLARE_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `R2_BUCKET`
- `R2_PUBLIC_BASE`
- `ROOT_DOMAIN`
- `WORKER_NAME`
- `WORKER_ROUTE`

Do not commit real keys.
