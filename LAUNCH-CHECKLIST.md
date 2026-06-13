# Launch Checklist

## Product Readiness

- Homepage clearly positions PromptArc as an AI image generation platform.
- `/zh/generate-image-first/` is the primary generator route.
- Generated-result preview, detail view, and candidate navigation are visually checked.
- Pricing, account, login, history, and admin member pages use the same product vocabulary.
- No visible button is decorative only. Every button submits a real form, opens a real panel, navigates to a real route, or triggers a wired handler.
- No placeholder anchors, empty links, or missing in-page anchors are present in the built `_site` artifact.

## Required Local Checks

Run these before deployment:

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

Then inspect key screenshots in:

```text
.qa-screenshots/launch-visual-snapshots
```

Minimum visual inspection set:

- `zh-mobile.png`
- `zh-generate-image-first-desktop.png`
- `zh-generate-image-first-mobile.png`
- `zh-pricing-desktop.png`
- `zh-pricing-mobile.png`
- `zh-account-mobile.png`
- `zh-admin-members-desktop.png`

## Artifact And Deployment

- Build `_site` with `node scripts\build-pages-artifact.mjs`.
- Confirm `_site` contains the public site only, not source/test/backend files.
- Confirm `CNAME` is set to `www.promptarc.cc`.
- Push to `main` only after local checks and visual inspection pass.
- Confirm the GitHub Pages workflow completes.
- Confirm the live site loads through HTTPS.

## Backend And Membership

- Confirm the image generation Worker health endpoint is reachable.
- Confirm anonymous generation is blocked when membership login is required.
- Confirm logged-in generation records attach to the account.
- Confirm member history renders real generated images and prompts.
- Confirm admin member page handles real authorized and unauthorized states.
- Do not change auth, payment, database, environment variables, or CI/CD in a launch rush without a separate rollback plan.

## Search And Trust

- Submit `sitemap.xml` in Search Console.
- Request indexing for homepage, generator, gallery, pricing, and key gallery category pages.
- Review privacy and terms against the actual business policy.
- Confirm contact email and support path in `config.js`.

## Post Launch

- Check GitHub Pages HTTPS status.
- Check Cloudflare DNS and redirects.
- Monitor generation errors and failed requests.
- Review first user sessions for friction in prompt input, parameter settings, result view, and login gating.
