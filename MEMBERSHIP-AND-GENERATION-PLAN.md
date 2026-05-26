# PromptArc Membership And Generation Plan

## Current Storage Behavior

- Generated images are stored in Cloudflare R2.
- Current object path format: `generated/YYYY-MM-DD/timestamp-category.png`.
- Public URL format: `https://img.promptarc.cc/generated/YYYY-MM-DD/...png`.
- Current visibility: public but unlisted. Anyone with the URL can view it, but it is not linked from the public gallery unless we publish it.
- Current metadata saved on R2 object: category, ratio, source.
- Current missing pieces: user ownership, generation history, delete controls, private/public toggle, billing limits, review queue.

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

### Phase 3: Member Dashboard

- `/account/` dashboard.
- Generation history grid.
- Copy prompt.
- Download image.
- Regenerate / remix.
- Delete image.
- Submit to public gallery.
- Usage quota display.

### Phase 4: Monetization

- Free tier: small daily quota, watermarked or lower priority if needed.
- Pro tier: larger quota, private history, batch generation, higher quality.
- Credit packs: pay per extra generation.
- Gallery contributors: approved submissions can become public SEO pages.

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
