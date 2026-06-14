import assert from "node:assert/strict";
import worker from "../workers/image-generator-worker.mjs";

class MemoryBucket {
  constructor() {
    this.items = new Map();
  }

  async put(key, bytes, options) {
    this.items.set(key, { bytes, options });
  }
}

class MemoryD1 {
  constructor(seed = {}) {
    this.users = seed.users || [];
    this.authChallenges = seed.authChallenges || [];
    this.sessions = seed.sessions || [];
    this.memberships = seed.memberships || [];
    this.quotaEvents = seed.quotaEvents || [];
    this.usageEvents = seed.usageEvents || [];
    this.generations = seed.generations || [];
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
      const session = this.db.sessions.find(
        (item) => item.session_hash === sessionHash && !item.revoked_at && item.expires_at > now
      );
      if (!session) return { results: [] };
      const user = this.db.users.find((item) => item.id === session.user_id);
      return {
        results: user ? [{ ...session, email: user.email, role: user.role || "user", status: user.status || "active" }] : []
      };
    }
    if (sql.includes("FROM auth_challenges") && sql.includes("token_hash")) {
      const tokenHash = this.values[0];
      const now = this.values[1];
      const challenge = this.db.authChallenges.find(
        (item) => item.token_hash === tokenHash && !item.consumed_at && item.expires_at > now
      );
      return { results: challenge ? [challenge] : [] };
    }
    if (sql.includes("FROM users") && sql.includes("LEFT JOIN memberships")) {
      const rows = this.db.users.map((user) => {
        const membership = this.db.memberships.find((item) => item.user_id === user.id) || {};
        const used = this.db.quotaEvents
          .filter((item) => item.user_id === user.id)
          .reduce((sum, item) => sum + Number(item.units || 0), 0);
        return {
          id: user.id,
          email: user.email,
          plan: membership.plan || user.plan || "free",
          status: membership.status || "active",
          quota_period: membership.quota_period || "day",
          quota_limit: membership.quota_limit || 0,
          quota_used: used,
          created_at: user.created_at || membership.created_at || null
        };
      });
      return { results: rows };
    }
    if (sql.includes("FROM users") && sql.includes("email")) {
      const email = this.values[0];
      return { results: this.db.users.filter((item) => item.email === email) };
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
      this.db.generationRequests.push({
        id,
        user_id: userId,
        prompt,
        ratio,
        requested_count: requestedCount,
        completed_count: completedCount,
        status,
        created_at: createdAt,
        completed_at: completedAt
      });
    }
    if (sql.startsWith("INSERT INTO auth_challenges")) {
      const [id, email, tokenHash, type, expiresAt, consumedAt, createdAt, ipHash, userAgentHash] = this.values;
      this.db.authChallenges.push({
        id,
        email,
        token_hash: tokenHash,
        type,
        expires_at: expiresAt,
        consumed_at: consumedAt,
        created_at: createdAt,
        ip_hash: ipHash,
        user_agent_hash: userAgentHash
      });
    }
    if (sql.startsWith("UPDATE auth_challenges")) {
      const [consumedAt, id] = this.values;
      const challenge = this.db.authChallenges.find((item) => item.id === id);
      if (challenge) challenge.consumed_at = consumedAt;
    }
    if (sql.startsWith("INSERT INTO users")) {
      const [id, email, plan, createdAt] = this.values;
      const existing = this.db.users.find((item) => item.email === email);
      if (existing) {
        existing.plan = existing.plan || plan;
      } else {
        this.db.users.push({ id, email, plan, role: "user", status: "active", created_at: createdAt });
      }
    }
    if (sql.startsWith("INSERT INTO sessions")) {
      const [id, userId, sessionHash, csrfHash, expiresAt, revokedAt, createdAt, lastSeenAt] = this.values;
      this.db.sessions.push({
        id,
        user_id: userId,
        session_hash: sessionHash,
        csrf_hash: csrfHash,
        expires_at: expiresAt,
        revoked_at: revokedAt,
        created_at: createdAt,
        last_seen_at: lastSeenAt
      });
    }
    if (sql.startsWith("INSERT INTO memberships")) {
      const [
        id,
        userId,
        plan,
        status,
        quotaPeriod,
        quotaLimit,
        currentPeriodStart,
        currentPeriodEnd,
        paymentProvider,
        providerCustomerId,
        providerSubscriptionId,
        createdAt,
        updatedAt
      ] = this.values;
      if (!this.db.memberships.find((item) => item.user_id === userId)) {
        this.db.memberships.push({
          id,
          user_id: userId,
          plan,
          status,
          quota_period: quotaPeriod,
          quota_limit: quotaLimit,
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
          payment_provider: paymentProvider,
          provider_customer_id: providerCustomerId,
          provider_subscription_id: providerSubscriptionId,
          created_at: createdAt,
          updated_at: updatedAt
        });
      }
    }
    if (sql.startsWith("INSERT INTO generations")) {
      const [id, userId, anonymousId, prompt, finalPrompt, r2Key, imageUrl, ratio, category, model, status, visibility, createdAt] =
        this.values;
      this.db.generations.push({
        id,
        user_id: userId,
        anonymous_id: anonymousId,
        prompt,
        final_prompt: finalPrompt,
        r2_key: r2Key,
        image_url: imageUrl,
        ratio,
        category,
        model,
        status,
        visibility,
        created_at: createdAt
      });
    }
    if (sql.startsWith("INSERT INTO quota_events")) {
      const [id, userId, eventType, units, requestId, note, createdAt] = this.values;
      this.db.quotaEvents.push({
        id,
        user_id: userId,
        event_type: eventType,
        units,
        generation_request_id: requestId,
        note,
        created_at: createdAt
      });
    }
    if (sql.startsWith("INSERT INTO usage_events")) {
      const [id, userId, anonymousId, eventType, costUnits, createdAt] = this.values;
      this.db.usageEvents.push({
        id,
        user_id: userId,
        anonymous_id: anonymousId,
        event_type: eventType,
        cost_units: costUnits,
        created_at: createdAt
      });
    }
    return { success: true };
  }
}

function makeImageBase64() {
  return Buffer.from("fake-png").toString("base64");
}

function sessionCookie(value = "session-token") {
  return `pa_session=${value}`;
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function runGeneration(envOverrides = {}, bodyOverrides = {}, fetchHandler = null, requestOverrides = {}) {
  const bucket = new MemoryBucket();
  const providerCalls = [];
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (url, options) => {
    providerCalls.push({ url: String(url), options });
    if (fetchHandler) {
      return fetchHandler(url, options, providerCalls.length);
    }
    return new Response(JSON.stringify({ data: [{ b64_json: makeImageBase64() }] }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  };

  try {
    const request = new Request("https://www.promptarc.cc/api/generate-image", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(requestOverrides.headers || {})
      },
      body: JSON.stringify({
        prompt: "Create a clean product photo with soft light and a simple background.",
        ratio: "3:2 landscape",
        resolution: "2k",
        generationCount: "1",
        variationMode: "subtle",
        guardrails: "No watermark.",
        anonymousId: "anon-test",
        generationId: "gen-test",
        ...bodyOverrides
      })
    });
    const response = await worker.fetch(request, {
      OPENAI_API_KEY: "test-key",
      OPENAI_BASE_URL: "https://www.taikuaila.cn/",
      IMAGE_MODEL: "gpt-image-2",
      IMAGE_OUTPUT_FORMAT: "png",
      R2_PUBLIC_BASE: "https://img.promptarc.cc",
      PROMPTARC_R2: bucket,
      ...envOverrides
    });
    return { response, payload: await response.json(), providerCalls, bucket };
  } finally {
    globalThis.fetch = originalFetch;
  }
}

const result = await runGeneration();
assert.equal(result.response.status, 200);
assert.equal(result.payload.ok, true);
assert.equal(result.payload.model, "gpt-image-2");
assert.equal(result.payload.size, "1536x1024");
assert.equal(result.providerCalls.length, 1);

const providerBody = JSON.parse(result.providerCalls[0].options.body);
assert.equal(providerBody.model, "gpt-image-2");
assert.equal(providerBody.size, "1536x1024");
assert.equal(providerBody.n, 1);
assert.match(providerBody.prompt, /Generate 1 AI image\./);
assert.match(providerBody.prompt, /Variation guidance:/);
assert.match(providerBody.prompt, /distinct alternative composition/i);
assert.equal(result.bucket.items.size, 1);

const queuedFallback = await runGeneration({}, { generationCount: "2" });
assert.equal(queuedFallback.response.status, 200);
assert.equal(queuedFallback.payload.ok, true);
assert.equal(queuedFallback.providerCalls.length, 1);
const fallbackProviderBody = JSON.parse(queuedFallback.providerCalls[0].options.body);
assert.equal(fallbackProviderBody.n, 1);
assert.match(fallbackProviderBody.prompt, /Generate 1 AI image\./);

const retryAfterTimeout = await runGeneration({}, {}, (url, options, callNumber) => {
  if (callNumber === 1) {
    return new Response("provider timeout", { status: 524 });
  }
  return new Response(JSON.stringify({ data: [{ b64_json: makeImageBase64() }] }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
});
assert.equal(retryAfterTimeout.response.status, 200);
assert.equal(retryAfterTimeout.payload.ok, true);
assert.equal(retryAfterTimeout.providerCalls.length, 2);

async function runSession(envOverrides = {}, headers = {}) {
  const request = new Request("https://www.promptarc.cc/api/auth/session", { headers });
  const response = await worker.fetch(request, envOverrides);
  return { response, payload: await response.json() };
}

async function runAuthChallenge(envOverrides = {}, bodyOverrides = {}) {
  const request = new Request("https://www.promptarc.cc/api/auth/challenge", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "member@example.com", ...bodyOverrides })
  });
  const response = await worker.fetch(request, envOverrides);
  return { response, payload: await response.json() };
}

async function runAuthVerify(envOverrides = {}, bodyOverrides = {}) {
  const request = new Request("https://www.promptarc.cc/api/auth/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(bodyOverrides)
  });
  const response = await worker.fetch(request, envOverrides);
  return { response, payload: await response.json() };
}

async function runAccountHistory(envOverrides = {}, headers = {}) {
  const request = new Request("https://www.promptarc.cc/api/account/history", { headers });
  const response = await worker.fetch(request, envOverrides);
  return { response, payload: await response.json() };
}

async function runAdminMembers(envOverrides = {}, headers = {}) {
  const request = new Request("https://www.promptarc.cc/api/admin/members", { headers });
  const response = await worker.fetch(request, envOverrides);
  return { response, payload: await response.json() };
}

const anonymousSession = await runSession();
assert.equal(anonymousSession.response.status, 200);
assert.equal(anonymousSession.payload.authenticated, false);
assert.equal(anonymousSession.payload.user, null);

const authDb = new MemoryD1();
const challenge = await runAuthChallenge({ PROMPTARC_DB: authDb, AUTH_DEBUG_RETURN_TOKEN: "1" });
assert.equal(challenge.response.status, 200);
assert.equal(challenge.payload.ok, true);
assert.equal(challenge.payload.email, "member@example.com");
assert.equal(typeof challenge.payload.debugToken, "string");
assert.equal(authDb.authChallenges.length, 1);
assert.equal(authDb.authChallenges[0].email, "member@example.com");
assert.notEqual(authDb.authChallenges[0].token_hash, challenge.payload.debugToken);

const verified = await runAuthVerify(
  { PROMPTARC_DB: authDb },
  { token: challenge.payload.debugToken }
);
assert.equal(verified.response.status, 200);
assert.equal(verified.payload.ok, true);
assert.equal(verified.payload.authenticated, true);
assert.equal(verified.payload.user.email, "member@example.com");
assert.equal(authDb.users.length, 1);
assert.equal(authDb.sessions.length, 1);
assert.equal(authDb.memberships.length, 1);
assert.match(verified.response.headers.get("set-cookie") || "", /pa_session=/);

const reused = await runAuthVerify({ PROMPTARC_DB: authDb }, { token: challenge.payload.debugToken });
assert.equal(reused.response.status, 400);
assert.equal(reused.payload.error, "invalid_or_expired_token");

const loginRequired = await runGeneration({ REQUIRE_LOGIN_FOR_GENERATION: "1" });
assert.equal(loginRequired.response.status, 401);
assert.equal(loginRequired.payload.ok, false);
assert.equal(loginRequired.payload.error, "login_required");
assert.equal(loginRequired.providerCalls.length, 0);

const sessionHashHex = await sha256Hex("session-token");
const memberDb = new MemoryD1({
  users: [{ id: "usr_test", email: "member@example.com", role: "user", status: "active" }],
  sessions: [
    {
      id: "sess_test",
      user_id: "usr_test",
      session_hash: sessionHashHex,
      csrf_hash: "csrf",
      expires_at: "2999-01-01T00:00:00.000Z",
      revoked_at: null
    }
  ],
  memberships: [
    {
      user_id: "usr_test",
      plan: "free",
      status: "active",
      quota_period: "day",
      quota_limit: 5,
      current_period_start: "2000-01-01T00:00:00.000Z",
      current_period_end: "2999-01-01T00:00:00.000Z"
    }
  ]
});

const authed = await runGeneration(
  { REQUIRE_LOGIN_FOR_GENERATION: "1", PROMPTARC_DB: memberDb },
  {},
  null,
  { headers: { cookie: sessionCookie("session-token") } }
);
assert.equal(authed.response.status, 200);
assert.equal(authed.payload.ok, true);
assert.equal(memberDb.generations[0].user_id, "usr_test");
assert.equal(memberDb.generations[0].anonymous_id, null);
assert.equal(authed.payload.quota.limit, 5);
assert.equal(authed.payload.quota.used, 1);
assert.equal(authed.payload.quota.remaining, 4);
assert.equal(memberDb.usageEvents.length, 0);

memberDb.generations.push(
  {
    id: "gen-own",
    user_id: "usr_test",
    anonymous_id: null,
    prompt: "Own image prompt",
    final_prompt: "Own final prompt",
    r2_key: "generated/users/usr_test/a.png",
    image_url: "https://img.promptarc.cc/generated/users/usr_test/a.png",
    ratio: "1:1 square",
    category: "image",
    model: "gpt-image-2",
    status: "completed",
    visibility: "public-unlisted",
    created_at: "2026-01-02T00:00:00.000Z"
  },
  {
    id: "gen-other",
    user_id: "usr_other",
    anonymous_id: null,
    prompt: "Other user prompt",
    final_prompt: "Other final prompt",
    r2_key: "generated/users/usr_other/a.png",
    image_url: "https://img.promptarc.cc/generated/users/usr_other/a.png",
    ratio: "1:1 square",
    category: "image",
    model: "gpt-image-2",
    status: "completed",
    visibility: "public-unlisted",
    created_at: "2026-01-03T00:00:00.000Z"
  }
);
const anonymousHistory = await runAccountHistory({ PROMPTARC_DB: memberDb });
assert.equal(anonymousHistory.response.status, 401);
assert.equal(anonymousHistory.payload.error, "login_required");
const userHistory = await runAccountHistory(
  { PROMPTARC_DB: memberDb },
  { cookie: sessionCookie("session-token") }
);
assert.equal(userHistory.response.status, 200);
assert.equal(userHistory.payload.ok, true);
assert.deepEqual(userHistory.payload.items.map((item) => item.id), ["gen-test", "gen-own"]);

const adminMembersDb = new MemoryD1({
  users: [
    { id: "usr_admin_1", email: "first@example.com", plan: "free", created_at: "2026-01-01T00:00:00.000Z" },
    { id: "usr_admin_2", email: "second@example.com", plan: "free", created_at: "2026-01-02T00:00:00.000Z" }
  ],
  memberships: [
    {
      user_id: "usr_admin_1",
      plan: "free",
      status: "active",
      quota_period: "day",
      quota_limit: 5,
      created_at: "2026-01-01T00:00:00.000Z"
    },
    {
      user_id: "usr_admin_2",
      plan: "pro",
      status: "active",
      quota_period: "month",
      quota_limit: 300,
      created_at: "2026-01-02T00:00:00.000Z"
    }
  ],
  quotaEvents: [{ user_id: "usr_admin_2", units: 2, created_at: "2026-01-03T00:00:00.000Z" }]
});
const adminDisabled = await runAdminMembers({ PROMPTARC_DB: adminMembersDb, ADMIN_TOKEN: "secret" }, { "x-admin-token": "secret" });
assert.equal(adminDisabled.response.status, 404);
const adminDenied = await runAdminMembers({ PROMPTARC_DB: adminMembersDb, ADMIN_BACKEND_ENABLED: "1", ADMIN_TOKEN: "secret" });
assert.equal(adminDenied.response.status, 401);
assert.equal(adminDenied.payload.error, "admin_required");
const adminAllowed = await runAdminMembers(
  { PROMPTARC_DB: adminMembersDb, ADMIN_BACKEND_ENABLED: "1", ADMIN_TOKEN: "secret" },
  { "x-admin-token": "secret" }
);
assert.equal(adminAllowed.response.status, 200);
assert.equal(adminAllowed.payload.ok, true);
assert.deepEqual(adminAllowed.payload.members.map((member) => member.email), ["first@example.com", "second@example.com"]);
assert.equal(adminAllowed.payload.members[1].plan, "pro");
assert.equal(adminAllowed.payload.members[1].quota.used, 2);

const lowQuotaDb = new MemoryD1({
  users: [{ id: "usr_low", email: "low@example.com", role: "user", status: "active" }],
  sessions: [
    {
      id: "sess_low",
      user_id: "usr_low",
      session_hash: sessionHashHex,
      csrf_hash: "csrf",
      expires_at: "2999-01-01T00:00:00.000Z",
      revoked_at: null
    }
  ],
  memberships: [
    {
      user_id: "usr_low",
      plan: "free",
      status: "active",
      quota_period: "day",
      quota_limit: 1,
      current_period_start: "2000-01-01T00:00:00.000Z",
      current_period_end: "2999-01-01T00:00:00.000Z"
    }
  ],
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

console.log("image-generator-worker tests passed");
