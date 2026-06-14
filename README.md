# PromptArc

PromptArc is an image-first AI generation site for discovering examples, writing prompts, generating images, comparing results, and managing member access.

## Current Product Shape

- Image-first homepage for conversion into generation.
- Primary generator at `/zh/generate-image-first/`.
- Image gallery and category pages for visual discovery.
- Pricing page for credits and membership positioning.
- Account, login, history, and admin member surfaces for the membership rollout.
- Static legal, about, contact, sitemap, robots, manifest, and 404 pages.

PromptArc should be treated as an AI image generation product, not a prompt directory or generic SaaS dashboard. See [PRODUCT.md](C:/Users/Administrator/Documents/AI网站90天/PRODUCT.md) and [DESIGN.md](C:/Users/Administrator/Documents/AI网站90天/DESIGN.md).

## Launch Rules

Before claiming a page or release is ready:

1. Buttons and links must map to real behavior or a real route.
2. Unused decorative buttons should be removed, not shipped as placeholders.
3. Run code and artifact checks.
4. Run rendered visual checks and inspect screenshots.
5. Keep high-risk work such as auth, payment, database, environment variables, CI/CD, and deployment changes separate and explicitly reviewed.

## Key Checks

```powershell
node --check app.js
node --test tests\site-artifact-contract.test.mjs
node --test tests\three-page-ui-contract.test.mjs
node --test tests\image-generator-worker.test.mjs
node --test tests\homepage-layout.test.mjs
& 'C:\Users\Administrator\AppData\Roaming\Accio\pre-install\python\python.exe' -m unittest tests.ui_ux_contract_test
& 'C:\Users\Administrator\AppData\Roaming\Accio\pre-install\python\python.exe' tests\rendered_responsive_audit.py
& 'C:\Users\Administrator\AppData\Roaming\Accio\pre-install\python\python.exe' tests\capture_visual_snapshots.py
```

The visual snapshots are written to:

```text
.qa-screenshots/launch-visual-snapshots
```

## Deployment

The clean GitHub Pages artifact is built with:

```powershell
node scripts\build-pages-artifact.mjs
```

The artifact is written to `_site` and intentionally excludes source-only directories such as `.github`, `docs`, `scripts`, `tests`, `workers`, `.env`, and local QA screenshots.

GitHub Pages deployment is configured in [deploy-pages.yml](C:/Users/Administrator/Documents/AI网站90天/.github/workflows/deploy-pages.yml). Local deployment helpers are documented in [DEPLOYMENT-AUTOMATION.md](C:/Users/Administrator/Documents/AI网站90天/DEPLOYMENT-AUTOMATION.md).

## External Setup Still Required

- Confirm the final domain and DNS configuration.
- Confirm `config.js` contact and endpoint values.
- Validate the live image generation Worker health endpoint.
- Review privacy and terms with the actual business policy.
- Verify real logged-in member, history, and admin data states before relying on them for launch.

## After Launch

Use [POST-LAUNCH-RUNBOOK.md](C:/Users/Administrator/Documents/AI网站90天/POST-LAUNCH-RUNBOOK.md) for HTTPS, Search Console, analytics, and early monitoring.
