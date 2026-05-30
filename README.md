# PromptArc MVP

Static launch-ready MVP for an English-first AI prompt and template site.

## Workflow Rule

All substantial modifications must follow the pre-change research rule documented in [WORKFLOW-RULES.md](C:/Users/Administrator/Documents/AI网站90天/WORKFLOW-RULES.md). We first study comparable sites and summarize what works, then implement a PromptArc-specific version.

## What is included

- Homepage with value proposition and conversion CTAs
- Prompt generator with local prompt composition
- Library hub plus 12 SEO-friendly template pages
- Free pack landing page with configurable email capture flow
- Recommended tools page for affiliate and digital-product monetization
- Legal, about, contact, robots, sitemap, manifest, and 404 pages

## Before you deploy

Update these values in [config.js](C:/Users/Administrator/Documents/AI网站90天/config.js):

- `siteUrl`
- `contactEmail`
- `gumroadUrl`
- `newsletterEndpoint`
- `affiliateLinks`

Then update these files with your real domain:

- [index.html](C:/Users/Administrator/Documents/AI网站90天/index.html)
- [tool/index.html](C:/Users/Administrator/Documents/AI网站90天/tool/index.html)
- [library/index.html](C:/Users/Administrator/Documents/AI网站90天/library/index.html)
- [free-pack/index.html](C:/Users/Administrator/Documents/AI网站90天/free-pack/index.html)
- [recommended-tools/index.html](C:/Users/Administrator/Documents/AI网站90天/recommended-tools/index.html)
- [robots.txt](C:/Users/Administrator/Documents/AI网站90天/robots.txt)
- [sitemap.xml](C:/Users/Administrator/Documents/AI网站90天/sitemap.xml)

For the fastest path, run [scripts/setup-site.ps1](C:/Users/Administrator/Documents/AI网站90天/scripts/setup-site.ps1) to replace placeholders and generate `CNAME`.

## Deployment

Preferred path:

1. Push the repository to GitHub.
2. In GitHub `Settings -> Pages`, choose `GitHub Actions` as the source.
3. Keep [CNAME](C:/Users/Administrator/Documents/AI网站90天/CNAME) set to `www.promptarc.cc`.
4. Point your domain through Cloudflare DNS.
5. After that, every push to `main` deploys automatically through GitHub Actions.

Local helper:

- [AUTO-PUSH-AND-DEPLOY.bat](C:/Users/Administrator/Documents/AI网站90天/AUTO-PUSH-AND-DEPLOY.bat)
  This helper auto-commits local changes, fetches and rebases on `origin/main`, pushes to GitHub, and lets GitHub Actions handle the Pages deployment.

Reference:

- [GITHUB-ACTIONS-SETUP.md](C:/Users/Administrator/Documents/AI网站90天/GITHUB-ACTIONS-SETUP.md)

## External setup still required

- Apply for at least one affiliate program and replace placeholder links
- Create a Gumroad product and replace the default URL
- Connect an email platform endpoint if you want subscriber capture
- Replace placeholder legal copy with your final business policy text

## After launch

Use [POST-LAUNCH-RUNBOOK.md](C:/Users/Administrator/Documents/AI网站90天/POST-LAUNCH-RUNBOOK.md) for HTTPS, Search Console, analytics, and early monetization tasks.
