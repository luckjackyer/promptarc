# PromptArc Generator And Membership Roadmap

## Product Position

PromptArc should evolve from a prompt gallery into an image-prompt workflow product:

- Public gallery: curated examples for SEO and discovery.
- Generator: converts prompt intent into usable images.
- History workspace: lets users reuse, download, and manage generated outputs.
- Account layer: preserves history across devices.
- Membership: controls cost and unlocks higher-value workflows.

## Module Order

### 1. Anonymous History Workspace

Status: in progress.

User value:

- Generate without login.
- Find recent results in the same browser.
- Open image, download, copy prompt, copy parameters, remix, delete.

System value:

- No login friction.
- Low backend complexity.
- Proves whether users actually use the generator.

### 2. Durable D1 Records

User value:

- History is more reliable.
- Deletion can sync beyond the browser.

System value:

- Every generation gets a structured record.
- Quotas, billing, review queue, and admin workflows become possible.

### 3. Quotas Before Payment

User value:

- Clear free usage rules.
- Fewer failed or blocked generations.

System value:

- Cost control before paid acquisition.
- Prevents accidental API overuse.

Recommended default:

- Anonymous: 3-5 images/day or 8/hour during beta.
- Logged-in free: higher daily limit.
- Paid: monthly quota plus optional credit packs.

### 4. Lightweight Login

User value:

- History survives device changes.
- Users can return to prior work.

System value:

- Enables member dashboard and billing.

Best first choice:

- Email magic link or Google login.
- Avoid custom password login in the first version.

### 5. Member Dashboard

Keep it simple:

- Generation history.
- Remaining quota.
- Download and batch download.
- Remix.
- Delete.
- Billing link.
- Submit to public gallery.

Do not add social features, comments, likes, or a complex analytics dashboard yet.

### 6. Public Gallery Review Queue

Rule:

- User-generated images do not automatically become public SEO pages.

Review dimensions:

- Image quality.
- Prompt usefulness.
- Visual uniqueness.
- Commercial use case.
- Safety.
- Duplicate risk.

Only approved items should be promoted into the public gallery and sitemap.

## Framework Limits

R2 stores image binaries.

D1 stores:

- User identity references.
- Prompt text.
- R2 keys.
- Visibility.
- Quota usage.
- Review status.

Worker handles:

- Generation API proxy.
- R2 upload.
- D1 writes.
- Quota checks.
- History reads.
- Delete actions.

Static frontend handles:

- Gallery browsing.
- Generator UI.
- Local anonymous history.
- Account/dashboard shell.

## Next Build Priority

1. Finish D1 setup and Worker deployment.
2. Add quota tracking in D1.
3. Add logged-in account layer.
4. Add member dashboard.
5. Add review queue for public-gallery promotion.
