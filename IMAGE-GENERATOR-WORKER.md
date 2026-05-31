# PromptArc Image Generator Worker

This backend keeps image API keys out of the browser.

## What It Does

- Receives `POST /api/generate-image` from the static site.
- Validates prompt, ratio, category, and guardrails.
- Calls the configured OpenAI-compatible image API privately.
- Stores the generated image in Cloudflare R2.
- Returns a public image URL from `R2_PUBLIC_BASE`.

## Where Generated Images Are Stored

The current Worker stores every generated image in the Cloudflare R2 bucket bound as `PROMPTARC_R2`.

Current key format:

```text
generated/anonymous/YYYY-MM-DD/{anonymous_id}/{generation_id}-{category}.png
```

Example public URL shape:

```text
https://img.promptarc.cc/generated/anonymous/2026-05-26/anon-xxx/gen-xxx-poster.png
```

Important behavior:

- The image binary is saved in R2, not in GitHub Pages.
- The returned URL is public-unlisted: it can be opened by anyone who has the URL, but PromptArc does not automatically link it from the public gallery.
- The image does not automatically become an SEO page.
- Current R2 metadata only stores `category`, `ratio`, and `source`.
- Browser-local history is available immediately after successful generation.
- Durable user history, ownership, quota, delete controls, and payment status require a database layer such as Cloudflare D1.

Target behavior after the membership build:

- R2 keeps image files.
- D1 stores generation records, user ownership, prompt text, quota usage, and review status.
- Logged-in user downloads should be served by signed URLs or a Worker route instead of exposing every private file as a permanent public URL.

## Optional D1 Schema

Use `workers/d1-schema.sql` to create the first database tables:

```powershell
wrangler d1 execute promptarc-db --file workers/d1-schema.sql
```

Then set `D1_DATABASE_ID` in `.env` before deploying the Worker. The deploy script will bind the database as `PROMPTARC_DB`.

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

## One-Step Backend Setup

Run this after `.env` has Cloudflare, OpenAI-compatible API, and R2 values:

```powershell
.\AUTO-SETUP-GENERATOR-BACKEND.ps1
```

It will:

- Create or reuse the D1 database.
- Execute `workers/d1-schema.sql`.
- Save `D1_DATABASE_ID` to `.env`.
- Deploy the image generator Worker with R2 and D1 bindings.

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
