# PromptArc Change Plan And Quality Gate

Last updated: 2026-05-26

## Operating Rule

Every meaningful website change must move through this sequence:

1. Research comparable sites.
2. Define the exact change scope.
3. Implement only that scope.
4. Run the self-check for that item.
5. Fix issues found during self-check.
6. Mark the item as passed.
7. Move to the next item.

Do not bundle unrelated changes into one step. If a change affects UI, SEO, backend, and monetization at once, split it into separate checklist items.

## Current Modification Plan

### 1. Homepage First-Screen Cleanup

Goal:

- Make the homepage first screen look like a focused AI image prompt tool, not a generic marketing landing page.

Modify:

- Remove oversized slogans and decorative copy that do not help the user act.
- Keep the generator visible near the top.
- Keep only one short value line.
- Keep history access available but secondary.

Do not modify:

- Gallery data.
- Backend API.
- Legal pages.
- Pricing or membership copy.

Acceptance rules:

- First screen clearly answers: what can the user do here?
- Generator input is visible without excessive scrolling on desktop.
- No large empty slogan block.
- Chinese and English versions must match structurally.
- No mixed Chinese/English labels except product names or technical terms such as UI.

Self-check:

- Open `/` and `/zh/` locally.
- Confirm console has no errors.
- Confirm hero height is not visually dominating the page.
- Confirm button labels are concise and useful.

Status:

- Passed locally on 2026-05-26.

Self-check result:

- `/` and `/zh/` load without console errors.
- Generator form is visible in the first screen.
- Result placeholder is hidden until generation starts.
- Chinese and English structures match.

### 2. Generator Result Experience

Goal:

- Make the moment after generation useful and trustworthy.

Modify:

- Show generated image clearly.
- Provide direct actions: open, download, view history, remix.
- Keep technical storage explanation out of the first-screen default state.
- Add storage/privacy explanation only in a secondary section or help note.

Do not modify:

- Public gallery approval rules.
- Payment or login logic.

Acceptance rules:

- User knows what happened after clicking generate.
- User can immediately download or continue working.
- Error state is readable and not scary.
- Loading state tells the user not to close the page.

Self-check:

- Submit a test prompt if backend is available.
- If backend is not available, verify prepared prompt and error state.
- Confirm no API key is exposed in frontend.

Status:

- Passed locally on 2026-05-26.

Self-check result:

- Loading state expands the hidden result area.
- Success state includes image preview, download, open full image, copy prompt, and history actions.
- Failure state avoids raw technical JSON errors and gives copy prompt plus gallery fallback.
- `/zh/` failure-state check loads without console errors.

### 3. Generation History Workspace

Goal:

- Let users recover and reuse generated outputs.

Modify:

- History page supports open image, download, copy prompt, copy parameters, remix, delete.
- Local browser history works before login.
- D1 history can be merged when backend is ready.

Do not modify:

- Full login system.
- Billing.
- Public gallery auto-publishing.

Acceptance rules:

- Empty state is clear.
- A real history item has all required actions.
- Delete removes the local item immediately.
- Cloud delete is best-effort and must not break local UX.

Self-check:

- Open `/account/history/` and `/zh/account/history/`.
- Confirm empty state renders.
- Confirm console has no errors.
- Confirm delete code path does not require login.

Status:

- Passed locally on 2026-05-26.

Self-check result:

- `/account/history/` and `/zh/account/history/` exist.
- Empty history pages load without console errors.
- History actions include open, download, copy prompt, copy parameters, remix, submit, and delete.
- Cloud delete remains best-effort and does not block local deletion.

### 4. Backend Storage And D1 Persistence

Goal:

- Persist generation metadata without storing image binaries in the database.

Modify:

- R2 stores generated images.
- D1 stores generation records, prompt, final prompt, R2 key, image URL, category, ratio, visibility, created time.
- Worker writes D1 records if binding exists.
- Worker returns success even if D1 write fails after image upload.

Do not modify:

- Payment.
- Auth.
- Public gallery sitemap generation.

Acceptance rules:

- Image generation does not fail only because D1 is temporarily unavailable.
- D1 write failures are logged but not exposed as user-facing fatal errors.
- R2 object path separates anonymous and future user generations.

Self-check:

- Run `node --check workers/image-generator-worker.mjs`.
- Run D1 setup script when Cloudflare writes are allowed.
- Hit `/api/generate-image/health` after deploy.

Status:

- Passed locally on 2026-05-26.

Self-check result:

- Worker syntax check passed.
- D1 schema and setup script exist.
- Worker writes records only if D1 binding exists.
- Worker still returns success if D1 write fails after image upload.
- Cloudflare D1 creation/deploy remains pending external write permission.

### 5. Quota And Cost Control

Goal:

- Prevent generation cost from becoming uncontrollable before traffic grows.

Modify:

- Add daily quota checks.
- Store usage events in D1.
- Show remaining quota in generator and history pages.
- Keep anonymous usage limits strict.

Do not modify:

- Paid plans until quota tracking works.
- Batch generation.

Acceptance rules:

- Anonymous users have a clear generation limit.
- Quota check happens before calling the image API.
- Failed provider calls do not consume quota unless we explicitly choose otherwise.
- Rate limit and quota messages are user-friendly.

Self-check:

- Simulate quota reached response.
- Confirm frontend displays clear message.
- Confirm Worker blocks before provider call.

Status:

- Passed locally on 2026-05-26.

Self-check result:

- Worker checks D1 daily usage before calling the image provider when D1 is available.
- Worker falls back to hourly memory rate limiting when D1 is unavailable.
- Successful generations record usage events after provider success.
- Frontend can display remaining quota when the backend returns quota data.
- Syntax checks passed for `app.js`, `workers/image-generator-worker.mjs`, and `scripts/deploy-image-worker.mjs`.

### 6. Lightweight Account Layer

Goal:

- Preserve history across devices and prepare for membership.

Modify:

- Add email magic link or Google login.
- Bind anonymous history to logged-in user after sign-in.
- Add account shell with history and quota.

Do not modify:

- Password login.
- Social features.
- Public user profiles.

Acceptance rules:

- Login is optional for trying the generator.
- Logged-in history survives browser changes.
- Anonymous users are not blocked from first use.

Self-check:

- Test logged-out generation.
- Test login.
- Test history merge.
- Test logout.

Status:

- Passed locally on 2026-05-26.

Self-check result:

- `/account/` and `/zh/account/` exist as noindex account workspace shells.
- Account page does not fake a working login.
- Anonymous use remains available before login.
- Local pages load without console errors.

### 7. Membership And Billing

Goal:

- Monetize only after usage tracking is reliable.

Modify:

- Add plan display.
- Add checkout provider.
- Add paid quota.
- Add billing link in account page.

Do not modify:

- Public gallery access.
- SEO pages behind login.

Acceptance rules:

- Free users still understand the product.
- Paid benefits are concrete: more quota, permanent history, batch download, private workspace.
- Billing failure does not break existing free browsing.

Self-check:

- Test checkout sandbox.
- Test webhook or manual plan update.
- Test quota changes by plan.

Status:

- Passed locally on 2026-05-26.

Self-check result:

- `/pricing/` and `/zh/pricing/` exist as noindex membership preview pages.
- Paid buttons are disabled or non-payment actions only.
- Copy clearly says pricing is not active yet.
- Local pages load without console errors.

### 8. Public Gallery Review Queue

Goal:

- Turn the best user generations into SEO assets without polluting the gallery.

Modify:

- Add submission action from history.
- Add admin review list.
- Score quality, uniqueness, commercial usefulness, safety, and duplication risk.
- Only approved items generate public gallery pages.

Do not modify:

- Automatic public publishing.
- User-generated images in sitemap before approval.

Acceptance rules:

- User output is private/unlisted by default.
- Public gallery remains curated.
- Review status is visible.

Self-check:

- Submit one item.
- Reject one item.
- Approve one item.
- Confirm only approved item appears in public gallery.

Status:

- Passed locally on 2026-05-26.

Self-check result:

- History workspace includes a submit-to-review action.
- Worker stores gallery submissions as `pending` only when D1 is available.
- Public gallery and sitemap are not modified by submissions.
- `/admin/review/` exists as a noindex admin review rubric shell.

## Universal Self-Check Checklist

Run this after every completed item:

- No JavaScript syntax errors.
- No console errors on affected pages.
- Desktop layout is not visually broken.
- Mobile layout remains usable.
- Chinese and English versions are structurally aligned.
- No real secrets appear in committed files.
- No user-generated item enters public gallery automatically.
- SEO pages remain indexable only when they are intentionally public.

## Stop Conditions

Stop and reassess before continuing if:

- A change requires new payment behavior.
- A change exposes private generated images publicly.
- A change increases API cost without quota protection.
- A change requires destructive deletion from R2 or D1.
- A change would copy competitor text/images instead of adapting structure.
