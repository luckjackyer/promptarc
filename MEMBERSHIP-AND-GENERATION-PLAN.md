# PromptArc Membership And Generation Plan

## Current Storage Behavior

- Generated images are stored in Cloudflare R2.
- Current object path format: `generated/YYYY-MM-DD/timestamp-category.png`.
- Public URL format: `https://img.promptarc.cc/generated/YYYY-MM-DD/...png`.
- Current visibility: public but unlisted. Anyone with the URL can view it, but it is not linked from the public gallery unless we publish it.
- Current metadata saved on R2 object: category, ratio, source.
- Current missing pieces: user ownership, generation history, delete controls, private/public toggle, billing limits, review queue.

## Storage Contract

R2 is the binary file store only. It should not be treated as the user database.

Recommended object layout:

- `generated/anonymous/YYYY-MM-DD/{session_id}/{generation_id}.png`
- `generated/users/{user_id}/YYYY-MM-DD/{generation_id}.png`
- `gallery/originals/{slug}.jpg`
- `gallery/thumbs/{slug}.jpg`
- `exports/{user_id}/{export_id}.zip`

Recommended public access rules:

- Anonymous beta images: public-unlisted URL, shown immediately after generation, not indexed.
- Logged-in user images: default private in account history, downloaded through a signed URL or Worker proxy.
- Public gallery images: only approved records are copied or promoted into the curated `gallery/` namespace.
- Deleted user images: remove the D1 record first, then remove the R2 object, then invalidate cache if the URL was public.

Retention rule:

- Anonymous images can be kept for 7-30 days unless promoted.
- Free logged-in users can keep a limited history.
- Paid users keep longer history and can export/download in batch.

This keeps storage costs predictable and prevents noisy generated images from weakening the SEO gallery.

## Product Rule

Generated images should not automatically enter the SEO gallery.

Reason: the public gallery is an SEO asset. It must stay curated, deduplicated, scored, and safe. User generations can be noisy, private, low quality, or repetitive.

## Recommended Rollout

### Phase 1: Anonymous Safe Beta

- Keep the generator open.
- Add hourly anonymous rate limit.
- Save all images to R2 under `generated/`.
- Return the image URL immediately.
- Do not provide permanent history yet.
- Add clear copy that images are public-unlisted URLs.

This is the fastest path to keep testing usage without building auth first.

### Phase 2: Lightweight User Accounts

- Add login with Google/email magic link.
- Store users and sessions in a hosted auth provider or Cloudflare Access-compatible system.
- Create a generation record for each image:
  - user_id
  - prompt
  - final_prompt
  - image_url
  - r2_key
  - ratio
  - category
  - model
  - status
  - created_at
  - visibility

Recommended data store: Cloudflare D1 for records, R2 for images.

Minimum D1 tables:

- `users`: `id`, `email`, `plan`, `stripe_customer_id`, `created_at`.
- `generation_sessions`: `id`, `anonymous_id`, `user_id`, `created_at`, `last_seen_at`.
- `generations`: `id`, `user_id`, `anonymous_id`, `prompt`, `final_prompt`, `r2_key`, `image_url`, `ratio`, `category`, `model`, `status`, `visibility`, `quality_score`, `created_at`, `deleted_at`.
- `usage_events`: `id`, `user_id`, `anonymous_id`, `event_type`, `cost_units`, `created_at`.
- `gallery_submissions`: `id`, `generation_id`, `user_id`, `review_status`, `review_note`, `published_slug`, `created_at`, `reviewed_at`.

Do not store generated image binaries in D1. D1 stores records and permissions; R2 stores image files.

### Phase 3: Member Dashboard

- `/account/` dashboard.
- Generation history grid.
- Copy prompt.
- Download image.
- Regenerate / remix.
- Delete image.
- Submit to public gallery.
- Usage quota display.

Dashboard modules:

- History: thumbnails, prompt preview, ratio, model, created date.
- Detail panel: full prompt, final prompt, copy, download, regenerate, delete.
- Downloads: single image first, batch ZIP later.
- Usage: remaining daily quota, monthly credits, reset time.
- Billing: current plan, upgrade CTA, invoice link after Stripe/Lemon Squeezy is added.
- Gallery submission: opt-in only, with review status.

### Phase 4: Monetization

- Free tier: small daily quota, watermarked or lower priority if needed.
- Pro tier: larger quota, private history, batch generation, higher quality.
- Credit packs: pay per extra generation.
- Gallery contributors: approved submissions can become public SEO pages.

Recommended first pricing shape:

- Free: 3-5 generations per day, temporary anonymous history, no batch download.
- Starter: monthly quota, permanent history, no watermark, standard download.
- Pro: larger quota, private gallery, batch generation, batch download, commercial workflow presets.
- Credit pack: one-time extra generations for users who do not want a subscription.

Do not launch paid membership before usage tracking is reliable. Otherwise users can overuse generation credits and create unpredictable API cost.

### Phase 5: Review Queue For Public Gallery

- Add admin-only review page.
- Score generated images by quality, diversity, commercial usefulness, and duplication.
- Only approved images generate public detail pages.
- Rejected images remain private/history-only or are deleted after retention window.

## Suggested Technical Architecture

- Frontend: current static site.
- API: Cloudflare Worker.
- Images: Cloudflare R2.
- Records: Cloudflare D1.
- Quotas/rate limits: Cloudflare KV or D1.
- Auth: Clerk, Supabase Auth, Auth.js on a small VPS, or Cloudflare Access for a simpler private beta.
- Payments: Stripe or Lemon Squeezy.

## Immediate Next Build

1. Add Cloudflare D1 database.
2. Extend Worker to write generation records.
3. Add anonymous session ID in browser localStorage.
4. Build `/account/history/` as local-session history first.
5. Add real login and bind old anonymous history later.

## Implementation Sequence

### Step 1: Store History Without Login

Goal: users can still find the image they just generated.

- Browser creates `promptarc_anonymous_id` in localStorage.
- Frontend sends `anonymous_id` with each generation request.
- Worker stores a `generations` row in D1.
- `/account/history/` reads local anonymous history through Worker API.
- Downloads use the existing R2 public URL.

This is the fastest useful version and does not require a full member system yet.

### Step 2: Add Real Accounts

Goal: image history survives browser changes and can become a paid feature.

- Add email magic link or Google login.
- Bind existing anonymous history to the logged-in user after sign-in.
- Change logged-in generated image visibility to `private`.
- Return download links through Worker API.

### Step 3: Add Billing And Quotas

Goal: control image generation cost before paid traffic increases.

- Add daily and monthly quota checks before calling the image API.
- Store every generation as a `usage_event`.
- Add plan limits in config.
- Add checkout provider.
- Add account billing page.

### Step 4: Add Admin Review

Goal: turn the best user outputs into SEO pages without polluting the gallery.

- Build `/admin/review/`.
- Show pending gallery submissions.
- Score quality, uniqueness, commercial usefulness, and safety.
- Approved images generate static gallery detail pages.
- Rejected images stay private or are deleted after the retention window.

## Decision

Start with Step 1 before full membership.

Reason: full login, billing, private storage, and dashboard are a larger product. The fastest safe path is to add D1 generation records and anonymous history first, then layer login and payment on top once the generator proves real usage.
