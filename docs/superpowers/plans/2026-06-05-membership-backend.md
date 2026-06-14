# Membership Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build PromptArc membership foundations so image generation can require login, user quota is enforced, generated records belong to users, and admins can manage memberships.

**Architecture:** Extend the existing Cloudflare Worker, D1, and R2 architecture in phases. Add membership tables first, then auth/session helpers, then a feature-flagged login gate for generation, then quota/history/admin APIs. Keep anonymous generation recoverable behind `REQUIRE_LOGIN_FOR_GENERATION=0` until staging verification passes.

**Tech Stack:** Static HTML/CSS/JS, Cloudflare Worker module at `workers/image-generator-worker.mjs`, Cloudflare D1 schema at `workers/d1-schema.sql`, R2 binding `PROMPTARC_R2`, D1 binding `PROMPTARC_DB`, Node test file `tests/image-generator-worker.test.mjs`, Python UI contract tests.

---

## Scope And Safety

This plan is high risk because it touches auth, authorization, D1, quota, and production generation behavior. Do not enable forced login in production until all Worker tests pass and the account UI has been manually verified.

Feature flags:

```text
MEMBERSHIP_ENABLED=0|1
REQUIRE_LOGIN_FOR_GENERATION=0|1
ADMIN_BACKEND_ENABLED=0|1
PAYMENTS_ENABLED=0|1
```

Rollback:

```text
REQUIRE_LOGIN_FOR_GENERATION=0
MEMBERSHIP_ENABLED=0
ADMIN_BACKEND_ENABLED=0
PAYMENTS_ENABLED=0
```

Do not delete D1 tables or R2 files during rollback.

## File Structure

- Modify `workers/d1-schema.sql`: add membership, auth, session, quota, request, and audit tables while preserving existing tables.
- Modify `workers/image-generator-worker.mjs`: add auth helpers, session endpoint, login challenge placeholders, quota helpers, forced-login gate, user-owned generation records, and admin membership APIs.
- Modify `tests/image-generator-worker.test.mjs`: add in-memory D1 test doubles and tests for login-required, authenticated generation, quota failure, history ownership, and admin denial.
- Create `zh/account/login/index.html`: static login page shell.
- Create `zh/account/index.html`: member dashboard shell.
- Create `zh/account/history/index.html`: member history shell.
- Create `zh/admin/members/index.html`: admin member management shell.
- Modify `app.js`: add session loading, login gate before generation submit, account/history/admin page hydration.
- Modify `style.css`: add restrained product UI styles for account and admin pages.
- Modify `AUTO-SETUP-GENERATOR-BACKEND.ps1` or setup documentation only after schema tests pass.

---

### Task 1: Extend D1 Schema

**Files:**
- Modify: `workers/d1-schema.sql`

- [ ] **Step 1: Add auth and membership tables after the existing `users` table**

Add this block below the current `CREATE TABLE IF NOT EXISTS users` statement. Preserve the existing `users` table for compatibility, then add missing columns through additive migration-friendly tables rather than rewriting old rows.

```sql
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
```

- [ ] **Step 2: Add quota, request, and admin audit tables**

Append this block after the existing `usage_events` indexes.

```sql
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

CREATE INDEX IF NOT EXISTS idx_generation_requests_user_created
ON generation_requests (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id TEXT PRIMARY KEY,
  admin_user_id TEXT NOT NULL,
  target_user_id TEXT,
  action TEXT NOT NULL,
  detail_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_created
ON admin_audit_log (created_at DESC);
```

- [ ] **Step 3: Make existing generation storage compatible with user ownership**

Confirm the existing `generations` table already has `user_id`. Leave `anonymous_id` in place for rollback and old data. Add this comment above `CREATE TABLE IF NOT EXISTS generations`:

```sql
-- Membership generation writes must bind user_id and should not rely on anonymous_id.
-- anonymous_id remains only for pre-membership rollback and legacy records.
```

- [ ] **Step 4: Run schema smoke check**

Run:

```powershell
Select-String -Path workers\d1-schema.sql -Pattern "auth_challenges|sessions|memberships|quota_events|generation_requests|admin_audit_log"
```

Expected: all six table names appear.

- [ ] **Step 5: Commit**

```powershell
git add workers\d1-schema.sql
git commit -m "feat: add membership d1 schema"
```

---

### Task 2: Build Worker Test Harness For Membership

**Files:**
- Modify: `tests/image-generator-worker.test.mjs`

- [ ] **Step 1: Add an in-memory D1 mock**

Insert this class below `MemoryBucket`:

```js
class MemoryD1 {
  constructor(seed = {}) {
    this.users = seed.users || [];
    this.sessions = seed.sessions || [];
    this.memberships = seed.memberships || [];
    this.quotaEvents = seed.quotaEvents || [];
    this.generations = [];
    this.generationRequests = [];
  }

  prepare(sql) {
    return new MemoryStatement(this, sql);
  }

  async batch(statements) {
    const results = [];
    for (const statement of statements) {
      results.push(await statement.run());
    }
    return results;
  }
}

class MemoryStatement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql;
    this.values = [];
  }

  bind(...values) {
    this.values = values;
    return this;
  }

  async first() {
    const rows = await this.all();
    return rows.results[0] || null;
  }

  async all() {
    const sql = this.sql.replace(/\s+/g, " ").trim();
    if (sql.includes("FROM sessions") && sql.includes("session_hash")) {
      const sessionHash = this.values[0];
      const now = this.values[1];
      const session = this.db.sessions.find((item) => item.session_hash === sessionHash && !item.revoked_at && item.expires_at > now);
      if (!session) return { results: [] };
      const user = this.db.users.find((item) => item.id === session.user_id);
      return { results: user ? [{ ...session, email: user.email, role: user.role || "user", status: user.status || "active" }] : [] };
    }
    if (sql.includes("FROM memberships")) {
      const userId = this.values[0];
      return { results: this.db.memberships.filter((item) => item.user_id === userId) };
    }
    if (sql.includes("FROM quota_events")) {
      const userId = this.values[0];
      const periodStart = this.values[1];
      const used = this.db.quotaEvents
        .filter((item) => item.user_id === userId && item.created_at >= periodStart)
        .reduce((sum, item) => sum + Number(item.units || 0), 0);
      return { results: [{ used }] };
    }
    if (sql.includes("FROM generations") && sql.includes("WHERE user_id = ?")) {
      const userId = this.values[0];
      return { results: this.db.generations.filter((item) => item.user_id === userId && !item.deleted_at) };
    }
    return { results: [] };
  }

  async run() {
    const sql = this.sql.replace(/\s+/g, " ").trim();
    if (sql.startsWith("INSERT INTO generation_requests")) {
      const [id, userId, prompt, ratio, requestedCount, completedCount, status, createdAt, completedAt] = this.values;
      this.db.generationRequests.push({ id, user_id: userId, prompt, ratio, requested_count: requestedCount, completed_count: completedCount, status, created_at: createdAt, completed_at: completedAt });
    }
    if (sql.startsWith("INSERT INTO generations")) {
      const [id, userId, anonymousId, prompt, finalPrompt, r2Key, imageUrl, ratio, category, model, status, visibility, createdAt] = this.values;
      this.db.generations.push({ id, user_id: userId, anonymous_id: anonymousId, prompt, final_prompt: finalPrompt, r2_key: r2Key, image_url: imageUrl, ratio, category, model, status, visibility, created_at: createdAt });
    }
    if (sql.startsWith("INSERT INTO quota_events")) {
      const [id, userId, eventType, units, requestId, note, createdAt] = this.values;
      this.db.quotaEvents.push({ id, user_id: userId, event_type: eventType, units, generation_request_id: requestId, note, created_at: createdAt });
    }
    return { success: true };
  }
}
```

- [ ] **Step 2: Extend `runGeneration` options**

Change the function signature:

```js
async function runGeneration(envOverrides = {}, bodyOverrides = {}, fetchHandler = null, requestOverrides = {}) {
```

Inside the `Request` constructor, use headers from overrides:

```js
headers: {
  "content-type": "application/json",
  ...(requestOverrides.headers || {})
},
```

- [ ] **Step 3: Add a session cookie helper**

Add below `makeImageBase64()`:

```js
function sessionCookie(value = "session-token") {
  return `pa_session=${value}`;
}
```

- [ ] **Step 4: Run current tests**

Run:

```powershell
node tests\image-generator-worker.test.mjs
```

Expected: `image-generator-worker tests passed`.

- [ ] **Step 5: Commit**

```powershell
git add tests\image-generator-worker.test.mjs
git commit -m "test: add membership worker harness"
```

---

### Task 3: Add Auth Session Helpers In Worker

**Files:**
- Modify: `workers/image-generator-worker.mjs`
- Modify: `tests/image-generator-worker.test.mjs`

- [ ] **Step 1: Write failing session endpoint test**

Add to the test file after the existing retry test:

```js
async function runSession(envOverrides = {}, headers = {}) {
  const request = new Request("https://www.promptarc.cc/api/auth/session", { headers });
  const response = await worker.fetch(request, envOverrides);
  return { response, payload: await response.json() };
}

const anonymousSession = await runSession();
assert.equal(anonymousSession.response.status, 200);
assert.equal(anonymousSession.payload.authenticated, false);
assert.equal(anonymousSession.payload.user, null);
```

Run:

```powershell
node tests\image-generator-worker.test.mjs
```

Expected: FAIL because `/api/auth/session` is not implemented.

- [ ] **Step 2: Add cookie and hashing helpers**

Add below `json()` in `workers/image-generator-worker.mjs`:

```js
function parseCookies(request) {
  const header = request.headers.get("cookie") || "";
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return index === -1 ? [part, ""] : [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      })
  );
}

async function sha256Hex(value) {
  const data = new TextEncoder().encode(String(value || ""));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
```

- [ ] **Step 3: Add `getSession`**

Add below `isAdminRequest()`:

```js
async function getSession(request, env) {
  if (!env.PROMPTARC_DB) return null;
  const cookies = parseCookies(request);
  const token = cookies.pa_session || "";
  if (!token) return null;
  const sessionHash = await sha256Hex(token);
  const now = new Date().toISOString();
  const row = await env.PROMPTARC_DB.prepare(
    `SELECT sessions.id, sessions.user_id, sessions.csrf_hash, sessions.expires_at, users.email, users.role, users.status
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.session_hash = ? AND sessions.revoked_at IS NULL AND sessions.expires_at > ?
    LIMIT 1`
  )
    .bind(sessionHash, now)
    .first();
  if (!row || row.status !== "active") return null;
  return {
    id: row.id,
    userId: row.user_id,
    csrfHash: row.csrf_hash,
    email: row.email,
    role: row.role || "user"
  };
}
```

- [ ] **Step 4: Add session response helper**

Add below `getSession`:

```js
async function getMembership(env, userId) {
  if (!env.PROMPTARC_DB || !userId) return null;
  const row = await env.PROMPTARC_DB.prepare(
    `SELECT plan, status, quota_period, quota_limit, current_period_start, current_period_end
    FROM memberships
    WHERE user_id = ?
    LIMIT 1`
  )
    .bind(userId)
    .first();
  return row || {
    plan: "free",
    status: "active",
    quota_period: "day",
    quota_limit: Number(env.FREE_DAILY_QUOTA || 5),
    current_period_start: new Date().toISOString().slice(0, 10),
    current_period_end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };
}

async function getUserQuotaSummary(env, userId, membership, now = new Date()) {
  if (!env.PROMPTARC_DB || !userId || !membership) return null;
  const periodStart = membership.current_period_start || new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
  const result = await env.PROMPTARC_DB.prepare(
    `SELECT COALESCE(SUM(units), 0) AS used
    FROM quota_events
    WHERE user_id = ? AND created_at >= ?`
  )
    .bind(userId, periodStart)
    .first();
  const used = Number(result?.used || 0);
  const limit = Number(membership.quota_limit || 0);
  return {
    period: membership.quota_period || "day",
    limit,
    used,
    remaining: Math.max(limit - used, 0)
  };
}
```

- [ ] **Step 5: Route `/api/auth/session`**

At the start of `handleRequest`, after the health route block and before the `/api/generate-image` path restriction, add:

```js
  if (url.pathname === "/api/auth/session") {
    const session = await getSession(request, env);
    if (!session) {
      return json({ authenticated: false, user: null, quota: null, csrfToken: null });
    }
    const membership = await getMembership(env, session.userId);
    const quota = await getUserQuotaSummary(env, session.userId, membership);
    return json({
      authenticated: true,
      user: {
        id: session.userId,
        email: session.email,
        role: session.role,
        plan: membership.plan || "free"
      },
      quota,
      csrfToken: null
    });
  }
```

- [ ] **Step 6: Run tests**

Run:

```powershell
node --check workers\image-generator-worker.mjs
node tests\image-generator-worker.test.mjs
```

Expected: both pass.

- [ ] **Step 7: Commit**

```powershell
git add workers\image-generator-worker.mjs tests\image-generator-worker.test.mjs
git commit -m "feat: add auth session endpoint"
```

---

### Task 4: Gate Generation Behind Login Flag

**Files:**
- Modify: `workers/image-generator-worker.mjs`
- Modify: `tests/image-generator-worker.test.mjs`

- [ ] **Step 1: Add failing unauthenticated gate test**

Add to `tests/image-generator-worker.test.mjs`:

```js
const loginRequired = await runGeneration({ REQUIRE_LOGIN_FOR_GENERATION: "1" });
assert.equal(loginRequired.response.status, 401);
assert.equal(loginRequired.payload.ok, false);
assert.equal(loginRequired.payload.error, "login_required");
assert.equal(loginRequired.providerCalls.length, 0);
```

Run:

```powershell
node tests\image-generator-worker.test.mjs
```

Expected: FAIL because generation still proceeds.

- [ ] **Step 2: Add flag helper**

Add near other helpers:

```js
function envFlag(env, name) {
  return String(env[name] || "").trim() === "1";
}
```

- [ ] **Step 3: Enforce login before rate limit and provider call**

In `handleRequest`, after JSON body parse and before `const anonymousId = ...`, add:

```js
    const requireLogin = envFlag(env, "REQUIRE_LOGIN_FOR_GENERATION");
    const session = await getSession(request, env);
    if (requireLogin && !session) {
      return json(
        {
          ok: false,
          error: "login_required",
          message: "Please log in to generate images."
        },
        401
      );
    }
```

- [ ] **Step 4: Run tests**

Run:

```powershell
node --check workers\image-generator-worker.mjs
node tests\image-generator-worker.test.mjs
```

Expected: tests pass.

- [ ] **Step 5: Commit**

```powershell
git add workers\image-generator-worker.mjs tests\image-generator-worker.test.mjs
git commit -m "feat: require login for generation behind flag"
```

---

### Task 5: Support Authenticated User Generation Records

**Files:**
- Modify: `workers/image-generator-worker.mjs`
- Modify: `tests/image-generator-worker.test.mjs`

- [ ] **Step 1: Add authenticated generation test**

Add seed data and test:

```js
const sessionHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("session-token"));
const sessionHashHex = Array.from(new Uint8Array(sessionHash)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
const db = new MemoryD1({
  users: [{ id: "usr_test", email: "member@example.com", role: "user", status: "active" }],
  sessions: [{ id: "sess_test", user_id: "usr_test", session_hash: sessionHashHex, csrf_hash: "csrf", expires_at: "2999-01-01T00:00:00.000Z", revoked_at: null }],
  memberships: [{ user_id: "usr_test", plan: "free", status: "active", quota_period: "day", quota_limit: 5, current_period_start: "2000-01-01T00:00:00.000Z", current_period_end: "2999-01-01T00:00:00.000Z" }]
});

const authed = await runGeneration(
  { REQUIRE_LOGIN_FOR_GENERATION: "1", PROMPTARC_DB: db },
  {},
  null,
  { headers: { cookie: sessionCookie("session-token") } }
);
assert.equal(authed.response.status, 200);
assert.equal(authed.payload.ok, true);
assert.equal(db.generations[0].user_id, "usr_test");
assert.equal(db.generations[0].anonymous_id, null);
```

Run:

```powershell
node tests\image-generator-worker.test.mjs
```

Expected: FAIL until generation records use `session.userId`.

- [ ] **Step 2: Update `createGenerationRecord`**

Change the `.bind(...)` values so `user_id` gets `record.userId || null` and `anonymous_id` gets `record.anonymousId || null`:

```js
    .bind(
      record.id,
      record.userId || null,
      record.anonymousId || null,
      record.originalPrompt,
      record.finalPrompt,
      record.key,
      record.imageUrl,
      record.ratio,
      record.category,
      record.model,
      "completed",
      record.visibility,
      record.createdAt
    )
```

- [ ] **Step 3: Use user-scoped R2 key when logged in**

Replace key creation:

```js
    const ownerPath = session ? `users/${session.userId}` : `anonymous/${anonymousId}`;
    const key = `generated/${ownerPath}/${datePart}/${generationId}-${sanitizePart(category)}.${outputFormat}`;
```

- [ ] **Step 4: Pass user id into generation record**

In the `createGenerationRecord` call, include:

```js
        userId: session ? session.userId : null,
        anonymousId: session ? null : anonymousId,
```

- [ ] **Step 5: Run tests**

Run:

```powershell
node --check workers\image-generator-worker.mjs
node tests\image-generator-worker.test.mjs
```

Expected: tests pass.

- [ ] **Step 6: Commit**

```powershell
git add workers\image-generator-worker.mjs tests\image-generator-worker.test.mjs
git commit -m "feat: store authenticated generation ownership"
```

---

### Task 6: Add Quota Checks

**Files:**
- Modify: `workers/image-generator-worker.mjs`
- Modify: `tests/image-generator-worker.test.mjs`

- [ ] **Step 1: Add insufficient quota test**

Add:

```js
const lowQuotaDb = new MemoryD1({
  users: [{ id: "usr_low", email: "low@example.com", role: "user", status: "active" }],
  sessions: [{ id: "sess_low", user_id: "usr_low", session_hash: sessionHashHex, csrf_hash: "csrf", expires_at: "2999-01-01T00:00:00.000Z", revoked_at: null }],
  memberships: [{ user_id: "usr_low", plan: "free", status: "active", quota_period: "day", quota_limit: 1, current_period_start: "2000-01-01T00:00:00.000Z", current_period_end: "2999-01-01T00:00:00.000Z" }],
  quotaEvents: [{ user_id: "usr_low", units: 1, created_at: "2099-01-01T00:00:00.000Z" }]
});

const quotaBlocked = await runGeneration(
  { REQUIRE_LOGIN_FOR_GENERATION: "1", PROMPTARC_DB: lowQuotaDb },
  {},
  null,
  { headers: { cookie: sessionCookie("session-token") } }
);
assert.equal(quotaBlocked.response.status, 402);
assert.equal(quotaBlocked.payload.error, "quota_exceeded");
assert.equal(quotaBlocked.providerCalls.length, 0);
```

- [ ] **Step 2: Add quota check helper**

Add:

```js
async function ensureQuota(env, userId, requestedUnits) {
  const membership = await getMembership(env, userId);
  if (!membership || membership.status !== "active") {
    return { allowed: false, remaining: 0, membership };
  }
  const quota = await getUserQuotaSummary(env, userId, membership);
  return {
    allowed: quota.remaining >= requestedUnits,
    remaining: quota.remaining,
    quota,
    membership
  };
}
```

- [ ] **Step 3: Enforce quota before provider call**

After input validation and count calculation, before `fetchImageProviderWithRetry`, add:

```js
    if (session) {
      const quotaCheck = await ensureQuota(env, session.userId, requestedCount);
      if (!quotaCheck.allowed) {
        return json(
          {
            ok: false,
            error: "quota_exceeded",
            message: `You have ${quotaCheck.remaining} images left. Reduce the count or upgrade your plan.`,
            quota: quotaCheck.quota || { remaining: quotaCheck.remaining }
          },
          402
        );
      }
    }
```

Use the existing count variable in the Worker. If the current Worker forces provider `n` to `1`, quota should still use requested count only when sequential generation has been implemented. Until then use the actual count that will call the provider.

- [ ] **Step 4: Record quota event after success**

After successful generation record write, add:

```js
      if (session) {
        await recordQuotaEvent(env, {
          id: usageEventId("quota"),
          userId: session.userId,
          eventType: "image_generated",
          units: 1,
          generationRequestId: generationId,
          note: "Image generated",
          createdAt
        });
      }
```

Add helper:

```js
async function recordQuotaEvent(env, event) {
  if (!env.PROMPTARC_DB) return false;
  await env.PROMPTARC_DB.prepare(
    `INSERT INTO quota_events (
      id,
      user_id,
      event_type,
      units,
      generation_request_id,
      note,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(event.id, event.userId, event.eventType, event.units, event.generationRequestId || null, event.note || null, event.createdAt)
    .run();
  return true;
}
```

- [ ] **Step 5: Run tests**

Run:

```powershell
node --check workers\image-generator-worker.mjs
node tests\image-generator-worker.test.mjs
```

Expected: tests pass.

- [ ] **Step 6: Commit**

```powershell
git add workers\image-generator-worker.mjs tests\image-generator-worker.test.mjs
git commit -m "feat: enforce member generation quota"
```

---

### Task 7: Add Account Page Shells

**Files:**
- Create: `zh/account/login/index.html`
- Create: `zh/account/index.html`
- Create: `zh/account/history/index.html`
- Modify: `style.css`
- Modify: `tests/ui_ux_contract_test.py`

- [ ] **Step 1: Add UI contract tests**

Append tests to `tests/ui_ux_contract_test.py`:

```python
def test_account_pages_exist(self):
    for path in [
        "zh/account/login/index.html",
        "zh/account/index.html",
        "zh/account/history/index.html",
    ]:
        full = ROOT / path
        self.assertTrue(full.exists(), path)
        text = full.read_text(encoding="utf-8")
        self.assertIn('data-page="account"', text)
        self.assertIn('name="robots" content="noindex,nofollow"', text)
```

Run:

```powershell
py -3 -m unittest tests.ui_ux_contract_test
```

Expected: FAIL because pages do not exist.

- [ ] **Step 2: Create login page**

Create `zh/account/login/index.html`:

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex,nofollow">
  <title>登录 PromptArc</title>
  <link rel="stylesheet" href="/style.css?v=20260605-membership1">
</head>
<body data-page="account" data-account-view="login">
  <main class="account-shell">
    <section class="account-panel">
      <a class="account-brand" href="/zh/">PromptArc</a>
      <h1>登录后生成图片</h1>
      <p>会员系统上线后，所有生图都需要登录。我们会保留你的提示词、图片历史和剩余额度。</p>
      <form class="account-login-form" data-account-login-form>
        <label>
          <span>邮箱</span>
          <input type="email" name="email" autocomplete="email" required>
        </label>
        <button type="submit">发送登录链接</button>
      </form>
      <p class="account-hint">第一版使用邮箱登录，不需要密码。</p>
    </section>
  </main>
  <script src="/app.js?v=20260605-membership1"></script>
</body>
</html>
```

- [ ] **Step 3: Create account dashboard page**

Create `zh/account/index.html`:

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex,nofollow">
  <title>会员中心 - PromptArc</title>
  <link rel="stylesheet" href="/style.css?v=20260605-membership1">
</head>
<body data-page="account" data-account-view="dashboard">
  <main class="account-shell">
    <section class="account-panel" data-account-dashboard>
      <a class="account-brand" href="/zh/">PromptArc</a>
      <h1>会员中心</h1>
      <div class="account-stat-grid">
        <div><span>当前方案</span><strong data-account-plan>未登录</strong></div>
        <div><span>剩余额度</span><strong data-account-quota>--</strong></div>
      </div>
      <nav class="account-actions">
        <a href="/zh/generate/">去生成图片</a>
        <a href="/zh/account/history/">查看历史</a>
      </nav>
    </section>
  </main>
  <script src="/app.js?v=20260605-membership1"></script>
</body>
</html>
```

- [ ] **Step 4: Create account history page**

Create `zh/account/history/index.html`:

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex,nofollow">
  <title>生成历史 - PromptArc</title>
  <link rel="stylesheet" href="/style.css?v=20260605-membership1">
</head>
<body data-page="account" data-account-view="history">
  <main class="account-shell">
    <section class="account-panel account-panel-wide">
      <a class="account-brand" href="/zh/account/">会员中心</a>
      <h1>生成历史</h1>
      <div class="account-history-grid" data-account-history>
        <p>登录后会显示你的生成图片。</p>
      </div>
    </section>
  </main>
  <script src="/app.js?v=20260605-membership1"></script>
</body>
</html>
```

- [ ] **Step 5: Add account styles**

Append to `style.css`:

```css
body[data-page="account"] {
  min-height: 100vh;
  background: #07090d;
  color: #f5f7fb;
}

body[data-page="account"] .account-shell {
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: 24px;
}

body[data-page="account"] .account-panel {
  display: grid;
  gap: 18px;
  width: min(460px, 100%);
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  background: #11151d;
}

body[data-page="account"] .account-panel-wide {
  width: min(980px, 100%);
}

body[data-page="account"] .account-brand,
body[data-page="account"] .account-actions a {
  color: #7dff91;
  font-weight: 800;
  text-decoration: none;
}

body[data-page="account"] h1,
body[data-page="account"] p {
  margin: 0;
}

body[data-page="account"] p {
  color: rgba(245, 247, 251, 0.72);
  line-height: 1.6;
}

body[data-page="account"] .account-login-form,
body[data-page="account"] .account-login-form label {
  display: grid;
  gap: 10px;
}

body[data-page="account"] input {
  min-height: 44px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: #080b10;
  color: #f5f7fb;
  padding: 0 12px;
}

body[data-page="account"] button,
body[data-page="account"] .account-actions a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  border: 0;
  border-radius: 8px;
  background: #57f779;
  color: #07120a;
  font-weight: 850;
}

body[data-page="account"] .account-stat-grid,
body[data-page="account"] .account-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

body[data-page="account"] .account-stat-grid div {
  display: grid;
  gap: 6px;
  padding: 14px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.045);
}
```

- [ ] **Step 6: Run tests**

Run:

```powershell
py -3 -m unittest tests.ui_ux_contract_test
```

Expected: tests pass.

- [ ] **Step 7: Commit**

```powershell
git add zh\account style.css tests\ui_ux_contract_test.py
git commit -m "feat: add account page shells"
```

---

### Task 8: Add Frontend Login Gate To Generator

**Files:**
- Modify: `app.js`
- Modify: `tests/ui_ux_contract_test.py`

- [ ] **Step 1: Add UI contract test for login gate copy**

Add:

```python
def test_generator_mentions_login_requirement(self):
    text = (ROOT / "app.js").read_text(encoding="utf-8")
    self.assertIn("login_required", text)
    self.assertIn("/api/auth/session", text)
```

Run:

```powershell
py -3 -m unittest tests.ui_ux_contract_test
```

Expected: FAIL until frontend code exists.

- [ ] **Step 2: Add session loader**

In `app.js`, add a helper near other global helpers:

```js
async function loadPromptArcSession() {
  try {
    const response = await fetch("/api/auth/session", { credentials: "include" });
    if (!response.ok) return { authenticated: false };
    return await response.json();
  } catch {
    return { authenticated: false };
  }
}
```

- [ ] **Step 3: Add login redirect helper**

Add:

```js
function redirectToLogin(returnTo) {
  const target = returnTo || window.location.pathname + window.location.search;
  window.location.href = "/zh/account/login/?returnTo=" + encodeURIComponent(target);
}
```

- [ ] **Step 4: Gate generator submit**

In the current generator submit handler, before calling `/api/generate-image`, add:

```js
const session = await loadPromptArcSession();
if (!session.authenticated) {
  localStorage.setItem("promptarc.pendingPrompt", promptInput.value || "");
  redirectToLogin(window.location.pathname + window.location.search);
  return;
}
```

If the current generator submit code is not async, convert only that event callback to async. Do not restructure unrelated generator logic.

- [ ] **Step 5: Handle Worker `login_required` response**

Where generation errors are handled, add:

```js
if (payload && payload.error === "login_required") {
  redirectToLogin(window.location.pathname + window.location.search);
  return;
}
```

- [ ] **Step 6: Run tests**

Run:

```powershell
node --check app.js
py -3 -m unittest tests.ui_ux_contract_test
```

Expected: pass.

- [ ] **Step 7: Commit**

```powershell
git add app.js tests\ui_ux_contract_test.py
git commit -m "feat: gate generation behind login in frontend"
```

---

### Task 9: Add Admin Member Shell

**Files:**
- Create: `zh/admin/members/index.html`
- Modify: `style.css`
- Modify: `tests/ui_ux_contract_test.py`

- [ ] **Step 1: Add admin page test**

Add:

```python
def test_admin_members_page_exists(self):
    full = ROOT / "zh/admin/members/index.html"
    self.assertTrue(full.exists())
    text = full.read_text(encoding="utf-8")
    self.assertIn('data-page="admin-members"', text)
    self.assertIn('name="robots" content="noindex,nofollow"', text)
```

- [ ] **Step 2: Create admin members page**

Create:

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex,nofollow">
  <title>会员管理 - PromptArc</title>
  <link rel="stylesheet" href="/style.css?v=20260605-membership1">
</head>
<body data-page="admin-members">
  <main class="admin-members-shell">
    <header>
      <a href="/zh/">PromptArc</a>
      <h1>会员管理</h1>
    </header>
    <section class="admin-members-table" data-admin-members>
      <p>管理员登录后显示会员列表、额度和计划状态。</p>
    </section>
  </main>
  <script src="/app.js?v=20260605-membership1"></script>
</body>
</html>
```

- [ ] **Step 3: Add admin styles**

Append:

```css
body[data-page="admin-members"] {
  min-height: 100vh;
  background: #07090d;
  color: #f5f7fb;
}

body[data-page="admin-members"] .admin-members-shell {
  width: min(1180px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 28px 0;
}

body[data-page="admin-members"] header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

body[data-page="admin-members"] a {
  color: #7dff91;
  font-weight: 800;
  text-decoration: none;
}

body[data-page="admin-members"] .admin-members-table {
  min-height: 420px;
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  background: #11151d;
}
```

- [ ] **Step 4: Run tests and commit**

```powershell
py -3 -m unittest tests.ui_ux_contract_test
git add zh\admin\members style.css tests\ui_ux_contract_test.py
git commit -m "feat: add admin member management shell"
```

---

### Task 10: Final Verification

**Files:**
- Verify all changed files.

- [ ] **Step 1: Run syntax checks**

```powershell
node --check app.js
node --check workers\image-generator-worker.mjs
```

Expected: no output, exit code 0.

- [ ] **Step 2: Run Worker tests**

```powershell
node tests\image-generator-worker.test.mjs
```

Expected: `image-generator-worker tests passed`.

- [ ] **Step 3: Run UI tests**

```powershell
py -3 -m unittest tests.ui_ux_contract_test
```

Expected: all tests pass.

- [ ] **Step 4: Run impeccable detector**

```powershell
node C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs --json app.js style.css zh/account/login/index.html zh/account/index.html zh/account/history/index.html zh/admin/members/index.html
```

Expected: `[]`.

- [ ] **Step 5: Manual browser checks**

Open:

```text
http://127.0.0.1:4178/zh/account/login/
http://127.0.0.1:4178/zh/account/
http://127.0.0.1:4178/zh/account/history/
http://127.0.0.1:4178/zh/admin/members/
```

Check:

- No layout overflow at desktop width.
- No layout overflow at mobile width.
- Login page clearly says login is required before generation.
- Account pages are noindex.
- Admin page is noindex.

- [ ] **Step 6: Commit final verification notes if docs changed**

```powershell
git status --short
```

If only intended files changed, commit remaining changes:

```powershell
git add workers\d1-schema.sql workers\image-generator-worker.mjs tests\image-generator-worker.test.mjs tests\ui_ux_contract_test.py app.js style.css zh\account zh\admin\members
git commit -m "feat: add membership foundation"
```

---

## Self-Review

Spec coverage:

- Login required before generation: Tasks 4 and 8.
- D1 users, sessions, memberships, quota, generation records: Tasks 1, 3, 5, 6.
- Account pages: Task 7.
- Admin backend shell: Task 9.
- Payment reserved but not implemented: Schema fields and no payment task.
- Rollback: feature flags in Scope And Safety.

Placeholder scan:

- No implementation step contains `TBD` or `TODO`.
- Payment is explicitly out of MVP and reserved by schema fields only.

Type consistency:

- Session cookie name is `pa_session`.
- Session endpoint is `/api/auth/session`.
- Forced login flag is `REQUIRE_LOGIN_FOR_GENERATION`.
- User-owned generation writes use `user_id`.
