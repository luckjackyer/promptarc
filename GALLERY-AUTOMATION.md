# PromptArc Gallery Automation

This workflow turns prepared prompt batches into live gallery pages.

## What It Does

The one-command workflow runs the full pipeline:

1. Generate images from `content-pipeline/priority-batch-XX.jsonl`.
2. Publish successful items into `gallery/gallery-data.js`.
3. Create thumbnails.
4. Convert generated PNG assets to compressed JPG.
5. Regenerate category pages, detail pages, directory pages, and `sitemap.xml`.
6. Upload gallery images and thumbnails to Cloudflare R2.
7. Deploy the static site to GitHub Pages.
8. Verify the online gallery item count.

## Required Local Secrets

Set these in `.env` locally. Do not commit real values.

```env
OPENAI_API_KEY=
OPENAI_BASE_URL=https://www.taikuaila.cn/

R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=promptarc-gallery
R2_PUBLIC_BASE=https://img.promptarc.cc

GITHUB_TOKEN=
GITHUB_USER=
GITHUB_REPO=promptarc
GITHUB_BRANCH=main

CLOUDFLARE_TOKEN=
DOMAIN=www.promptarc.cc
ROOT_DOMAIN=promptarc.cc

# Optional proxy. Leave blank if you do not use one.
# The workflow also auto-detects common local ports such as 7890 and 10809.
LOCAL_PROXY_PORT=
API_PROXY=
HTTPS_PROXY=
HTTP_PROXY=
DEPLOY_PROXY=
```

## Current 100 to 200 Expansion

The current prepared expansion uses batches `05` to `09` and verifies at least `200` gallery items:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\run-expansion-200-and-deploy.ps1
```

Equivalent explicit command:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\run-gallery-expansion-workflow.ps1 -Batches @("05","06","07","08","09") -ExpectedMinimum 200
```

## Future Expansions

For the next expansion, create new batch files:

```text
content-pipeline/priority-batch-10.json
content-pipeline/priority-batch-10.jsonl
content-pipeline/priority-batch-11.json
content-pipeline/priority-batch-11.jsonl
```

Then run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\run-gallery-expansion-workflow.ps1 -Batches @("10","11") -ExpectedMinimum 240
```

Use `-SkipGeneration` only when images already exist locally and you only need to republish, upload, deploy, and verify.

Use `-SkipDeploy` when testing the local pipeline without updating the live site.

Use `-PreflightOnly` to check all keys, batch files, runtime paths, and proxy setup before doing any work:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\run-gallery-expansion-workflow.ps1 -Batches @("05","06","07","08","09") -ExpectedMinimum 200 -PreflightOnly
```

## Important Rule

Do not deploy gallery images to GitHub Pages as the normal path. The stable path is:

```text
Generated image -> compressed JPG -> R2 -> img.promptarc.cc -> static HTML references CDN URL
```

GitHub Pages should serve HTML, CSS, JavaScript, and data. R2 should serve gallery images.
