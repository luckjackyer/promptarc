# Membership Backend Design

## Goal

Add a membership system for PromptArc so image generation requires login, generated images belong to a user, quotas are enforced before provider calls, and an admin backend can manage users, plans, usage, and generation records.

## Non-Goals

- Do not allow anonymous generation after this system is enabled.
- Do not connect real payment processing in the first build.
- Do not add password login in the first build.
- Do not expose private generated images through permanent public URLs when user ownership is enabled.
- Do not automatically publish user generations to the public gallery.
- Do not replace the current image generation UI redesign while building membership.

## Risk Classification

This is a high-risk feature because it touches authentication, authorization, quota enforcement, D1 schema, R2 access, future payment behavior, and production generation flow.

Required controls:

- Build in phases.
- Keep each phase reversible.
- Ship behind feature flags.
- Add tests before changing generation behavior.
- Keep the current generation route recoverable until the membership path is verified.
- Do not deploy payment behavior until sandbox checkout and webhook tests pass.

## Product Rule

After membership launches, users may browse PromptArc, inspect examples, open the generator, type prompts, and adjust parameters without logging in.

However, clicking Generate must require a valid login session. If the user is not logged in:

1. The UI opens a login dialog or sends the user to `/zh/account/login/`.
2. No image provider request is made.
3. No quota is consumed.
4. The prompt and parameter state are preserved.
5. After login, the user returns to the generator and can continue.

## Recommended Architecture

Use the existing Cloudflare-centered stack:

- Static pages on the current site.
- Cloudflare Worker for auth, generation, account, admin, quota, and history APIs.
- Cloudflare D1 for users, sessions, memberships, quota ledger, and generation records.
- Cloudflare R2 for generated image files.
- Email magic link or one-time code for MVP login.
- Google login can be added after the email path is stable.
- Payment provider integration is reserved for phase two.

This keeps the first membership version close to the current Worker, D1, and R2 architecture while avoiding the complexity of passwords and immediate billing.

## User Roles

### Visitor

Can:

- Browse homepage, gallery, pricing, examples, and generator UI.
- Type prompts and change parameters.
- Start login.

Cannot:

- Generate images.
- Access generation history.
- Download private generated images.
- Use member-only API routes.

### Free User

Can:

- Generate images within free quota.
- View own generation history.
- Download own images.
- Use basic generation settings.

Cannot:

- Access admin routes.
- Exceed quota.
- Change plan without checkout or admin override.

### Paid Member

Can:

- Generate within paid quota.
- View own generation history.
- Download own images.
- Use paid quota and future member-only features.

### Admin

Can:

- View users.
- View membership status.
- View usage and quota ledger.
- Adjust plan and quota manually.
- View generation records.
- Soft-delete or hide records.
- Review gallery submissions in later phases.

Admin routes must require both a valid user session and admin authorization. A bearer admin token alone is not enough for browser admin UI.

## Plans And Quotas

Initial plans:

| Plan | Purpose | Suggested Quota |
|---|---|---:|
| Free | Product trial | 5 images/day |
| Pro | Normal creator use | 500 images/month |
| Studio | Heavy use | 2,000 images/month |

Quota rules:

- One completed image costs 1 unit.
- A 4-image request costs up to 4 units.
- Quota must be checked before the provider call.
- If the user has only 2 units left and asks for 4 images, the UI should offer to reduce count to 2 or upgrade.
- Quota is reserved before generation starts and finalized after success.
- Failed provider calls release the reservation.
- Partial success finalizes only completed images and releases the rest.

## Authentication Flow

### Email Magic Link Or Code

1. User enters email.
2. Worker validates email format and rate limits requests.
3. Worker creates an `auth_challenges` row with a hashed token or code, expiry, IP hash, and user agent hash.
4. Email provider sends the link or code.
5. User clicks the link or enters the code.
6. Worker verifies the challenge, creates or finds the user, creates a session, and sets an HttpOnly secure cookie.
7. User returns to the generator or account page.

Session cookie:

- HttpOnly
- Secure
- SameSite=Lax
- Short enough to limit exposure, long enough for normal use, suggested 30 days

Security requirements:

- Store only hashed challenge tokens.
- Expire challenges after 15 minutes.
- Invalidate challenge after one successful use.
- Rate limit challenge creation by email hash and IP hash.
- Do not reveal whether an email already has an account.

### Session API

`GET /api/auth/session`

Returns:

```json
{
  "authenticated": true,
  "user": {
    "id": "usr_...",
    "email": "name@example.com",
    "plan": "free",
    "role": "user"
  },
  "quota": {
    "period": "day",
    "limit": 5,
    "used": 2,
    "remaining": 3
  },
  "csrfToken": "..."
}
```

For visitors:

```json
{
  "authenticated": false,
  "user": null,
  "quota": null,
  "csrfToken": "..."
}
```

## Authorization Rules

Generation API:

- Requires authenticated session.
- Requires valid CSRF token for cookie-authenticated POST.
- Requires active user status.
- Requires quota availability.
- Writes records with `user_id`.
- Does not accept `anonymous_id` as ownership.

Account APIs:

- Require authenticated session.
- Only return records owned by `user_id`.

Admin APIs:

- Require authenticated session.
- Require admin role.
- Require CSRF token for mutating requests.
- Log plan and quota changes.

## D1 Schema Direction

Existing tables can be evolved, but the new membership path should not depend on anonymous ownership.

Recommended tables:

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_challenges (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  type TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL,
  ip_hash TEXT,
  user_agent_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_auth_challenges_email_created
ON auth_challenges (email, created_at DESC);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_hash TEXT NOT NULL UNIQUE,
  csrf_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user
ON sessions (user_id, expires_at DESC);

CREATE TABLE IF NOT EXISTS memberships (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  quota_period TEXT NOT NULL DEFAULT 'day',
  quota_limit INTEGER NOT NULL DEFAULT 5,
  current_period_start TEXT NOT NULL,
  current_period_end TEXT NOT NULL,
  payment_provider TEXT,
  provider_customer_id TEXT,
  provider_subscription_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quota_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  units INTEGER NOT NULL,
  generation_request_id TEXT,
  note TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quota_events_user_created
ON quota_events (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS generation_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  ratio TEXT,
  requested_count INTEGER NOT NULL,
  completed_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'queued',
  created_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS generations (
  id TEXT PRIMARY KEY,
  request_id TEXT,
  user_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  final_prompt TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  image_url TEXT,
  ratio TEXT,
  category TEXT,
  model TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  visibility TEXT NOT NULL DEFAULT 'private',
  created_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_generations_user_created
ON generations (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id TEXT PRIMARY KEY,
  admin_user_id TEXT NOT NULL,
  target_user_id TEXT,
  action TEXT NOT NULL,
  detail_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

Migration notes:

- Existing `anonymous_id` columns can remain during transition but should not be used by new membership generation.
- Existing anonymous generation history should not be shown as member-owned unless a later merge flow is explicitly approved.
- `image_url` should become optional because private images should preferably be served by a Worker download route or signed URL.

## Generation Flow

### Frontend

1. Generator loads session via `/api/auth/session`.
2. If unauthenticated, Generate button remains visible but acts as "Log in to generate".
3. User prompt and parameters remain editable before login.
4. On Generate click:
   - If not logged in, open login.
   - If logged in, submit to Worker with CSRF token.
5. If quota is insufficient, show a quota message and upgrade link.
6. If generation succeeds, append result group and update quota.

### Worker

1. Parse session cookie.
2. Verify session hash in D1.
3. Verify CSRF token.
4. Load membership.
5. Check quota for requested count.
6. Create `generation_requests` row.
7. Create quota reservation event.
8. Call image provider.
9. Store successful images in R2 under user-scoped keys:

```text
users/{user_id}/generations/{request_id}/{image_id}.png
```

10. Write generation records with `user_id`.
11. Finalize quota usage for completed images.
12. Release unused reservation for failed images.
13. Return generated image records and updated quota.

## Account Pages

### `/zh/account/login/`

Purpose:

- Start email login.
- Verify code or magic link.
- Return to generator after success.

States:

- Email entry.
- Code sent.
- Verifying.
- Success.
- Expired code.
- Rate limited.

### `/zh/account/`

Purpose:

- Member home.

Content:

- Plan.
- Quota remaining.
- Current period.
- Recent generations.
- Billing placeholder.
- Logout.

### `/zh/account/history/`

Purpose:

- User generation history.

Content:

- Image grid.
- Prompt.
- Ratio.
- Created time.
- Download.
- Soft delete.

Rules:

- Noindex.
- Requires login.
- Only own records.

## Admin Backend

### `/zh/admin/members/`

Purpose:

- Manage users and memberships.

Content:

- User list.
- Search by email.
- Plan filter.
- Status filter.
- Used quota.
- Last generation time.
- Manual plan adjustment.
- Manual quota adjustment.

### `/zh/admin/generations/`

Purpose:

- Inspect generation records.

Content:

- User email.
- Prompt preview.
- Image thumbnail.
- Status.
- R2 key.
- Created time.
- Hide or soft delete.

### `/zh/admin/audit/`

Purpose:

- See admin changes.

Content:

- Admin user.
- Target user.
- Action.
- Detail.
- Time.

## Payment Phase Two

Payment is not part of MVP implementation.

Preparation:

- `memberships.payment_provider`
- `memberships.provider_customer_id`
- `memberships.provider_subscription_id`
- `/api/billing/checkout` placeholder
- `/api/billing/webhook` reserved route

Payment provider requirements before activation:

- Sandbox checkout verified.
- Webhook signature verified.
- Subscription created, renewed, canceled, and failed payment events tested.
- Plan changes only happen from verified webhook or admin action.
- Frontend checkout success page does not directly grant membership.

## Error Handling

Unauthenticated generation:

```json
{
  "error": "login_required",
  "message": "Please log in to generate images."
}
```

Insufficient quota:

```json
{
  "error": "quota_exceeded",
  "message": "You have 2 images left. Reduce the count or upgrade your plan.",
  "quota": {
    "remaining": 2
  }
}
```

Expired session:

```json
{
  "error": "session_expired",
  "message": "Your session expired. Please log in again."
}
```

Provider failure:

- Keep request record.
- Release unused quota reservation.
- Return user-friendly retry message.

D1 failure:

- If auth or quota cannot be verified, generation must not proceed.
- The user sees a temporary service error.
- This is different from the current anonymous fallback. Membership generation must fail closed.

## Feature Flags

Recommended environment flags:

```text
REQUIRE_LOGIN_FOR_GENERATION=0|1
MEMBERSHIP_ENABLED=0|1
PAYMENTS_ENABLED=0|1
ADMIN_BACKEND_ENABLED=0|1
```

Rollout:

1. Deploy schema and read-only session endpoints.
2. Enable account pages.
3. Enable login in staging.
4. Enable quota checks in staging.
5. Enable `REQUIRE_LOGIN_FOR_GENERATION=1` in staging.
6. Verify.
7. Enable production.

## Rollback Strategy

If login or quota blocks legitimate generation:

1. Set `REQUIRE_LOGIN_FOR_GENERATION=0`.
2. Keep account pages live but stop enforcing login.
3. Keep D1 records intact.
4. Keep R2 files intact.
5. Disable admin mutating actions if necessary with `ADMIN_BACKEND_ENABLED=0`.
6. Do not delete schema during rollback.

If payment integration fails in phase two:

1. Set `PAYMENTS_ENABLED=0`.
2. Keep existing manually assigned memberships.
3. Stop checkout links.
4. Ignore unverified webhook events.

## Testing Plan

Auth:

- Login challenge creation.
- Expired challenge rejected.
- Reused challenge rejected.
- Session creation.
- Logout revokes session.
- Session endpoint returns correct user and quota.

Authorization:

- Unauthenticated generation returns `login_required`.
- Authenticated generation succeeds within quota.
- Expired session cannot generate.
- User cannot read another user's history.
- Non-admin cannot access admin APIs.

Quota:

- Free plan daily quota.
- Monthly paid plan quota.
- Insufficient quota fails before provider call.
- Provider failure releases reservation.
- Partial completion charges only completed images.

History:

- Generation records are written with `user_id`.
- History returns only own records.
- Soft delete hides records from history.

Admin:

- Admin can list users.
- Admin can adjust plan.
- Admin adjustment writes audit log.
- Non-admin gets 403.

Security:

- Cookies are HttpOnly, Secure, SameSite=Lax.
- Mutating requests require CSRF token.
- CORS is restricted for cookie-authenticated routes.
- No secrets are exposed to frontend.

## Implementation Phases

### Phase 1: Schema And Auth Foundation

- Add D1 tables.
- Add auth challenge API.
- Add session API.
- Add logout API.
- Add account login page.

### Phase 2: Require Login For Generation

- Add frontend login gate.
- Add Worker session verification.
- Add `REQUIRE_LOGIN_FOR_GENERATION`.
- Make unauthenticated generation fail closed when flag is enabled.

### Phase 3: Quota And History

- Add membership loading.
- Add quota events.
- Add request and generation records.
- Add account dashboard and history.

### Phase 4: Admin Backend

- Add admin role.
- Add member list.
- Add plan and quota adjustment.
- Add audit log.

### Phase 5: Payment Integration

- Add checkout provider.
- Add verified webhook.
- Update membership from webhook.
- Add billing UI.

## Open Decisions

The implementation plan needs one business decision before coding:

- Use email magic link only for MVP, or include Google login in the first build.

Recommendation:

- Start with email magic link or one-time code only.
- Add Google login after the core membership and quota system is stable.
