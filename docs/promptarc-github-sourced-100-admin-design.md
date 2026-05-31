# GitHub-Sourced Prompt Batch and Admin Gallery Design

## Goal
Create 100 new PromptArc image prompts that are visibly more diverse than the current gallery, then add an admin-only gallery operation mode for uploading and hiding images.

## Prompt Sourcing Rules
- Use GitHub prompt repositories only as inspiration for structure, not as copied text.
- Extract reusable dimensions: medium, camera/lens, composition, era, material, subject domain, constraints, and use case.
- Every generated prompt must include at least four differentiators: visual medium, camera/composition, subject context, texture/material, and practical use case.
- Avoid repeating the current PromptArc house pattern of "Create a premium..." or "Create a clean..." across the batch.
- Store the queue as local JSON and JSONL so the same 100 prompts can be regenerated, audited, and published.

## Admin Mode
- Admin UI lives at `/admin/review/` and remains `noindex,nofollow`.
- Admin authentication uses a shared `ADMIN_TOKEN` checked by the Cloudflare Worker. Frontend-only hiding is not treated as security.
- Upload stores image bytes in R2 and metadata in D1.
- Delete is a soft delete: public gallery records are marked `deleted_at`, and the gallery feed excludes them.
- Static gallery items can be hidden by ID through a D1 `gallery_deletions` table even if the original item exists in `gallery-data.js`.

## Data Flow
1. Admin enters token in `/admin/review/`.
2. Upload sends image base64 plus metadata to `/api/generate-image` with `action: "admin-upload-gallery"`.
3. Worker verifies `ADMIN_TOKEN`, writes image to R2, and inserts into `admin_gallery_items`.
4. Public pages call `GET /api/generate-image?gallery=1` to merge dynamic admin items and deletion IDs with static `gallery-data.js`.
5. Delete sends `action: "admin-delete-gallery"` and writes a soft-delete marker.

## Validation
- `node --check` must pass for `app.js`, Worker, and scripts.
- Worker health must return `ok: true`.
- Admin endpoints must return 401 without a token.
- Public gallery must keep working if the dynamic feed fails.
