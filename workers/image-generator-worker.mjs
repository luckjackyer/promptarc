const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type"
};

const sizeByRatio = {
  "1:1 square": "1024x1024",
  "4:3 landscape": "1536x1152",
  "3:4 portrait": "1152x1536",
  "3:2 landscape": "1536x1024",
  "21:9 cinematic": "1536x1024",
  "2:3 portrait": "1024x1536",
  "4:5 vertical social": "1024x1536",
  "9:16 mobile story": "1024x1536",
  "16:9 wide banner": "1536x1024"
};

const generationBuckets = new Map();
const rateLimitWindowMs = 60 * 60 * 1000;
const anonymousHourlyLimit = 8;
const anonymousDailyLimit = 20;

function joinApiPath(baseUrl, pathname) {
  const cleanBase = String(baseUrl || "").replace(/\/+$/, "");
  if (cleanBase.endsWith("/v1") && pathname.startsWith("/v1/")) {
    return `${cleanBase}${pathname.slice(3)}`;
  }
  return `${cleanBase}${pathname}`;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
}

function jsonWithHeaders(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...jsonHeaders, ...extraHeaders } });
}

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
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
}

function randomToken(bytes = 32) {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  return Array.from(data)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function isAdminRequest(request, env) {
  const configured = String(env.ADMIN_TOKEN || "").trim();
  if (!configured) {
    return false;
  }
  const header = request.headers.get("x-admin-token") || "";
  const bearer = request.headers.get("authorization") || "";
  const token = bearer.toLowerCase().startsWith("bearer ") ? bearer.slice(7) : header;
  return token === configured;
}

async function getSession(request, env) {
  if (!env.PROMPTARC_DB) return null;
  const cookies = parseCookies(request);
  const token = cookies.pa_session || "";
  if (!token) return null;
  const sessionHash = await sha256Hex(token);
  const now = new Date().toISOString();
  const row = await env.PROMPTARC_DB.prepare(
    `SELECT sessions.id, sessions.user_id, sessions.csrf_hash, sessions.expires_at, users.email, users.plan
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.session_hash = ? AND sessions.revoked_at IS NULL AND sessions.expires_at > ?
    LIMIT 1`
  )
    .bind(sessionHash, now)
    .first();
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    csrfHash: row.csrf_hash,
    email: row.email,
    role: "user",
    plan: row.plan || "free"
  };
}

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
  return (
    row || {
      plan: "free",
      status: "active",
      quota_period: "day",
      quota_limit: Number(env.FREE_DAILY_QUOTA || 5),
      current_period_start: new Date().toISOString().slice(0, 10),
      current_period_end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }
  );
}

async function getUserQuotaSummary(env, userId, membership, now = new Date()) {
  if (!env.PROMPTARC_DB || !userId || !membership) return null;
  const periodStart =
    membership.current_period_start || new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
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

async function createAuthChallenge(request, env, input) {
  if (!env.PROMPTARC_DB) {
    return json({ ok: false, error: "Auth backend is not configured." }, 503);
  }
  const email = normalizeEmail(input.email);
  if (!isValidEmail(email)) {
    return json({ ok: false, error: "invalid_email" }, 400);
  }

  const now = new Date();
  const token = randomToken(32);
  const tokenHash = await sha256Hex(token);
  const userAgent = request.headers.get("user-agent") || "";
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "";
  await env.PROMPTARC_DB.prepare(
    `INSERT INTO auth_challenges (
      id,
      email,
      token_hash,
      type,
      expires_at,
      consumed_at,
      created_at,
      ip_hash,
      user_agent_hash
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      usageEventId("auth"),
      email,
      tokenHash,
      "email_link",
      new Date(now.getTime() + 15 * 60 * 1000).toISOString(),
      null,
      now.toISOString(),
      ip ? await sha256Hex(ip) : null,
      userAgent ? await sha256Hex(userAgent) : null
    )
    .run();

  const payload = {
    ok: true,
    email,
    message: "Check your email for a login link."
  };
  if (String(env.AUTH_DEBUG_RETURN_TOKEN || "").trim() === "1") {
    payload.debugToken = token;
  }
  return json(payload);
}

async function findUserByEmail(env, email) {
  const row = await env.PROMPTARC_DB.prepare(
    `SELECT id, email, plan
    FROM users
    WHERE email = ?
    LIMIT 1`
  )
    .bind(email)
    .first();
  return row || null;
}

async function ensureUser(env, email, now) {
  const existing = await findUserByEmail(env, email);
  if (existing) {
    return existing;
  }
  const user = {
    id: usageEventId("usr"),
    email,
    plan: "free",
    createdAt: now.toISOString()
  };
  await env.PROMPTARC_DB.prepare(
    `INSERT INTO users (
      id,
      email,
      plan,
      created_at
    ) VALUES (?, ?, ?, ?)`
  )
    .bind(user.id, user.email, "free", user.createdAt)
    .run();
  return user;
}

async function ensureDefaultMembership(env, userId, now) {
  const existing = await env.PROMPTARC_DB.prepare(
    `SELECT user_id
    FROM memberships
    WHERE user_id = ?
    LIMIT 1`
  )
    .bind(userId)
    .first();
  if (existing) {
    return existing;
  }
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const periodEnd = addDays(periodStart, 1);
  await env.PROMPTARC_DB.prepare(
    `INSERT INTO memberships (
      id,
      user_id,
      plan,
      status,
      quota_period,
      quota_limit,
      current_period_start,
      current_period_end,
      payment_provider,
      provider_customer_id,
      provider_subscription_id,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      usageEventId("mem"),
      userId,
      "free",
      "active",
      "day",
      Number(env.FREE_DAILY_QUOTA || 5),
      periodStart.toISOString(),
      periodEnd.toISOString(),
      null,
      null,
      null,
      now.toISOString(),
      now.toISOString()
    )
    .run();
}

async function verifyAuthChallenge(env, input) {
  if (!env.PROMPTARC_DB) {
    return json({ ok: false, error: "Auth backend is not configured." }, 503);
  }
  const token = String(input.token || "").trim();
  if (!token) {
    return json({ ok: false, error: "invalid_or_expired_token" }, 400);
  }
  const tokenHash = await sha256Hex(token);
  const now = new Date();
  const challenge = await env.PROMPTARC_DB.prepare(
    `SELECT id, email, token_hash, expires_at, consumed_at
    FROM auth_challenges
    WHERE token_hash = ? AND consumed_at IS NULL AND expires_at > ?
    LIMIT 1`
  )
    .bind(tokenHash, now.toISOString())
    .first();
  if (!challenge) {
    return json({ ok: false, error: "invalid_or_expired_token" }, 400);
  }

  await env.PROMPTARC_DB.prepare(
    `UPDATE auth_challenges
    SET consumed_at = ?
    WHERE id = ?`
  )
    .bind(now.toISOString(), challenge.id)
    .run();

  const user = await ensureUser(env, normalizeEmail(challenge.email), now);
  await ensureDefaultMembership(env, user.id, now);

  const sessionToken = randomToken(32);
  const csrfToken = randomToken(16);
  const expiresAt = addDays(now, Number(env.SESSION_DAYS || 30));
  await env.PROMPTARC_DB.prepare(
    `INSERT INTO sessions (
      id,
      user_id,
      session_hash,
      csrf_hash,
      expires_at,
      revoked_at,
      created_at,
      last_seen_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      usageEventId("sess"),
      user.id,
      await sha256Hex(sessionToken),
      await sha256Hex(csrfToken),
      expiresAt.toISOString(),
      null,
      now.toISOString(),
      now.toISOString()
    )
    .run();

  return jsonWithHeaders(
    {
      ok: true,
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: "user",
        plan: user.plan || "free"
      },
      csrfToken
    },
    200,
    {
      "set-cookie": `pa_session=${encodeURIComponent(sessionToken)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${Math.floor(
        (expiresAt.getTime() - now.getTime()) / 1000
      )}`
    }
  );
}

function sanitizePart(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "image";
}

function sanitizeId(value, fallbackPrefix = "id") {
  const clean = String(value || "")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 80);
  return clean || `${fallbackPrefix}-${Date.now()}`;
}

function buildFinalPrompt(input) {
  const count = String(input.generationCount || "1");
  const variationGuidance = getVariationGuidance(input.variationMode);
  return [
    `Generate ${count} AI image${count === "1" ? "." : "s."}`,
    "",
    `Aspect ratio: ${input.ratio}`,
    `Quality preset: ${input.resolution}`,
    `Variation guidance: ${variationGuidance}`,
    "",
    "Prompt:",
    input.prompt,
    "",
    "Quality guardrails:",
    input.guardrails,
    "",
    "Output requirement: return one stable, clear image suitable for publishing or further iteration."
  ].join("\n");
}

function getVariationGuidance(variationMode) {
  const mode = String(variationMode || "subtle").trim().toLowerCase();
  if (mode === "stable") {
    return "stay as close as possible to the supplied prompt, preserving the subject, composition intent, style, and constraints.";
  }
  if (mode === "strong") {
    return "create a clearly distinct alternative composition while preserving the subject, use case, style family, and quality constraints.";
  }
  return "create a distinct alternative composition with light changes to angle, framing, or supporting details while preserving the subject, use case, style, and quality constraints.";
}

function getQualityForResolution(resolution, fallbackQuality) {
  const requested = String(resolution || "").trim().toLowerCase();
  const configured = String(fallbackQuality || "").trim().toLowerCase();
  if (configured) {
    return configured;
  }
  if (requested === "4k") {
    return "high";
  }
  if (requested === "2k") {
    return "medium";
  }
  return "low";
}

function shouldRetryProviderStatus(status) {
  return status === 524 || status === 408 || status === 429 || status >= 500;
}

async function fetchImageProviderWithRetry(url, requestOptions, maxAttempts = 2) {
  let lastResponse = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetch(url, requestOptions);
    lastResponse = response;
    if (response.ok || !shouldRetryProviderStatus(response.status) || attempt === maxAttempts) {
      return response;
    }
    await response.text().catch(() => "");
  }
  return lastResponse;
}

function getProviderFailureMessage(status) {
  if (status === 524 || status === 408 || status >= 500) {
    return "Image provider timed out or is busy. Please try again.";
  }
  if (status === 429) {
    return "Image provider is rate limited. Please try again shortly.";
  }
  return `Image provider failed with ${status}.`;
}

async function createGenerationRecord(env, record) {
  if (!env.PROMPTARC_DB) {
    return;
  }

  await env.PROMPTARC_DB.prepare(
    `INSERT INTO generations (
      id,
      user_id,
      anonymous_id,
      prompt,
      final_prompt,
      r2_key,
      image_url,
      ratio,
      category,
      model,
      status,
      visibility,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
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
    .run();
}

async function listGenerationRecords(env, anonymousId) {
  if (!env.PROMPTARC_DB) {
    return [];
  }

  const result = await env.PROMPTARC_DB.prepare(
    `SELECT
      id,
      prompt,
      final_prompt,
      r2_key,
      image_url,
      ratio,
      category,
      model,
      status,
      visibility,
      created_at
    FROM generations
    WHERE anonymous_id = ? AND deleted_at IS NULL
    ORDER BY created_at DESC
    LIMIT 60`
  )
    .bind(anonymousId)
    .all();

  return (result.results || []).map((row) => ({
    id: row.id,
    prompt: row.final_prompt || row.prompt,
    originalPrompt: row.prompt,
    key: row.r2_key,
    imageUrl: row.image_url,
    ratio: row.ratio,
    category: row.category,
    model: row.model,
    status: row.status,
    visibility: row.visibility,
    createdAt: row.created_at,
    storage: "PromptArc R2"
  }));
}

async function listUserGenerationRecords(env, userId) {
  if (!env.PROMPTARC_DB || !userId) {
    return [];
  }

  const result = await env.PROMPTARC_DB.prepare(
    `SELECT
      id,
      prompt,
      final_prompt,
      r2_key,
      image_url,
      ratio,
      category,
      model,
      status,
      visibility,
      created_at
    FROM generations
    WHERE user_id = ? AND deleted_at IS NULL
    ORDER BY created_at DESC
    LIMIT 60`
  )
    .bind(userId)
    .all();

  return (result.results || []).map((row) => ({
    id: row.id,
    prompt: row.final_prompt || row.prompt,
    originalPrompt: row.prompt,
    key: row.r2_key,
    imageUrl: row.image_url,
    ratio: row.ratio,
    category: row.category,
    model: row.model,
    status: row.status,
    visibility: row.visibility,
    createdAt: row.created_at,
    storage: "PromptArc R2"
  }));
}

async function listAdminMembers(env) {
  if (!env.PROMPTARC_DB) {
    return [];
  }
  const result = await env.PROMPTARC_DB.prepare(
    `SELECT
      users.id,
      users.email,
      users.plan AS user_plan,
      users.created_at,
      memberships.plan,
      memberships.status,
      memberships.quota_period,
      memberships.quota_limit,
      COALESCE(SUM(quota_events.units), 0) AS quota_used
    FROM users
    LEFT JOIN memberships ON memberships.user_id = users.id
    LEFT JOIN quota_events ON quota_events.user_id = users.id
    GROUP BY users.id, users.email, users.plan, users.created_at, memberships.plan, memberships.status, memberships.quota_period, memberships.quota_limit
    ORDER BY users.created_at DESC
    LIMIT 200`
  ).all();

  return (result.results || []).map((row) => {
    const limit = Number(row.quota_limit || 0);
    const used = Number(row.quota_used || 0);
    return {
      id: row.id,
      email: row.email,
      plan: row.plan || row.user_plan || "free",
      status: row.status || "active",
      quota: {
        period: row.quota_period || "day",
        limit,
        used,
        remaining: Math.max(limit - used, 0)
      },
      createdAt: row.created_at || null
    };
  });
}

async function softDeleteGenerationRecord(env, generationId, anonymousId) {
  if (!env.PROMPTARC_DB) {
    return false;
  }

  const result = await env.PROMPTARC_DB.prepare(
    `UPDATE generations
    SET deleted_at = ?
    WHERE id = ? AND anonymous_id = ? AND deleted_at IS NULL`
  )
    .bind(new Date().toISOString(), generationId, anonymousId)
    .run();

  return Boolean(result.success);
}

function usageEventId(prefix = "usage") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function getDailyUsage(env, anonymousId, now = new Date()) {
  if (!env.PROMPTARC_DB) {
    return null;
  }

  const dayStart = new Date(now);
  dayStart.setUTCHours(0, 0, 0, 0);
  const result = await env.PROMPTARC_DB.prepare(
    `SELECT COALESCE(SUM(cost_units), 0) AS used
    FROM usage_events
    WHERE anonymous_id = ? AND event_type = 'image_generated' AND created_at >= ?`
  )
    .bind(anonymousId, dayStart.toISOString())
    .first();

  return Number(result?.used || 0);
}

async function recordUsageEvent(env, event) {
  if (!env.PROMPTARC_DB) {
    return false;
  }

  await env.PROMPTARC_DB.prepare(
    `INSERT INTO usage_events (
      id,
      user_id,
      anonymous_id,
      event_type,
      cost_units,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(event.id, null, event.anonymousId, event.eventType, event.costUnits, event.createdAt)
    .run();
  return true;
}

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
    .bind(
      event.id,
      event.userId,
      event.eventType,
      event.units,
      event.generationRequestId || null,
      event.note || null,
      event.createdAt
    )
    .run();
  return true;
}

async function submitGalleryReview(env, generationId, anonymousId) {
  if (!env.PROMPTARC_DB) {
    return false;
  }

  const generation = await env.PROMPTARC_DB.prepare(
    `SELECT id, user_id
    FROM generations
    WHERE id = ? AND anonymous_id = ? AND deleted_at IS NULL`
  )
    .bind(generationId, anonymousId)
    .first();

  if (!generation) {
    return false;
  }

  await env.PROMPTARC_DB.prepare(
    `INSERT OR IGNORE INTO gallery_submissions (
      id,
      generation_id,
      user_id,
      review_status,
      review_note,
      published_slug,
      created_at,
      reviewed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      `submission-${generationId}`,
      generationId,
      generation.user_id || null,
      "pending",
      null,
      null,
      new Date().toISOString(),
      null
    )
    .run();
  return true;
}

async function listAdminGalleryFeed(env) {
  if (!env.PROMPTARC_DB) {
    return { items: [], deletedIds: [] };
  }

  const [itemsResult, deletedResult] = await Promise.all([
    env.PROMPTARC_DB.prepare(
      `SELECT id, title, category, tags_json, prompt, image_url, source_label, source_url, created_at
      FROM admin_gallery_items
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 500`
    ).all(),
    env.PROMPTARC_DB.prepare(
      `SELECT id
      FROM gallery_deletions
      ORDER BY created_at DESC
      LIMIT 2000`
    ).all()
  ]);

  const items = (itemsResult.results || []).map((row) => {
    let tags = [];
    try {
      tags = JSON.parse(row.tags_json || "[]");
    } catch {
      tags = [];
    }
    return {
      id: row.id,
      title: row.title,
      category: row.category,
      tags,
      imageUrl: row.image_url,
      sourceLabel: row.source_label || "Admin upload",
      sourceUrl: row.source_url || "",
      prompt: row.prompt,
      createdAt: row.created_at
    };
  });

  return {
    items,
    deletedIds: (deletedResult.results || []).map((row) => row.id)
  };
}

async function saveAdminGalleryItem(env, item) {
  if (!env.PROMPTARC_DB) {
    throw new Error("D1 binding is required for admin gallery uploads.");
  }

  await env.PROMPTARC_DB.prepare(
    `INSERT OR REPLACE INTO admin_gallery_items (
      id,
      title,
      category,
      tags_json,
      prompt,
      image_url,
      r2_key,
      source_label,
      source_url,
      created_at,
      deleted_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`
  )
    .bind(
      item.id,
      item.title,
      item.category,
      JSON.stringify(item.tags),
      item.prompt,
      item.imageUrl,
      item.key,
      item.sourceLabel,
      item.sourceUrl,
      item.createdAt
    )
    .run();
}

async function deleteAdminGalleryItem(env, id, reason) {
  if (!env.PROMPTARC_DB) {
    throw new Error("D1 binding is required for admin gallery deletes.");
  }

  const now = new Date().toISOString();
  await env.PROMPTARC_DB.batch([
    env.PROMPTARC_DB.prepare("UPDATE admin_gallery_items SET deleted_at = ? WHERE id = ?").bind(now, id),
    env.PROMPTARC_DB.prepare("INSERT OR REPLACE INTO gallery_deletions (id, reason, created_at) VALUES (?, ?, ?)").bind(
      id,
      reason || null,
      now
    )
  ]);
}

function decodeBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function loadProviderImageBytes(imageItem) {
  const b64 = imageItem?.b64_json;
  if (b64) {
    return decodeBase64(b64);
  }

  const imageUrl = imageItem?.url;
  if (!imageUrl) {
    return null;
  }

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Image URL download failed with ${response.status}.`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

function getClientKey(request) {
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "anonymous";
}

function checkRateLimit(request) {
  const now = Date.now();
  const key = getClientKey(request);
  const bucket = generationBuckets.get(key) || { count: 0, resetAt: now + rateLimitWindowMs };
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + rateLimitWindowMs;
  }
  bucket.count += 1;
  generationBuckets.set(key, bucket);
  return {
    allowed: bucket.count <= anonymousHourlyLimit,
    remaining: Math.max(anonymousHourlyLimit - bucket.count, 0),
    resetAt: bucket.resetAt
  };
}

function envFlag(env, name) {
  return String(env[name] || "").trim() === "1";
}

export default {
  async fetch(request, env) {
    try {
      return await handleRequest(request, env);
    } catch (error) {
      return json(
        {
          ok: false,
          error: "Generator worker failed before completing the request.",
          detail: error && error.message ? error.message : String(error)
        },
        500
      );
    }
  }
};

async function handleRequest(request, env) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: jsonHeaders });
  }

  const url = new URL(request.url);
    if (url.pathname === "/api/generate-image/health") {
      const baseUrl = String(env.OPENAI_BASE_URL || "").replace(/\/+$/, "");
      let providerStatus = null;
      let providerText = "";
      if (baseUrl) {
        try {
          const provider = await fetch(joinApiPath(baseUrl, "/v1/models"), {
            headers: env.OPENAI_API_KEY ? { authorization: `Bearer ${env.OPENAI_API_KEY}` } : {}
          });
          providerStatus = provider.status;
          providerText = (await provider.text()).slice(0, 120);
        } catch (error) {
          providerText = error.message;
        }
      }
      return json({
        ok: true,
        hasApiKey: Boolean(env.OPENAI_API_KEY),
        hasR2: Boolean(env.PROMPTARC_R2),
        baseUrl,
        publicBase: env.R2_PUBLIC_BASE || "",
        providerStatus,
        providerText
      });
    }

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

    if (url.pathname === "/api/auth/challenge") {
      if (request.method !== "POST") {
        return json({ ok: false, error: "Method not allowed" }, 405);
      }
      let input;
      try {
        input = await request.json();
      } catch {
        return json({ ok: false, error: "Invalid JSON body" }, 400);
      }
      return createAuthChallenge(request, env, input);
    }

    if (url.pathname === "/api/auth/verify") {
      if (request.method !== "POST") {
        return json({ ok: false, error: "Method not allowed" }, 405);
      }
      let input;
      try {
        input = await request.json();
      } catch {
        return json({ ok: false, error: "Invalid JSON body" }, 400);
      }
      return verifyAuthChallenge(env, input);
    }

    if (url.pathname === "/api/account/history") {
      if (request.method !== "GET") {
        return json({ ok: false, error: "Method not allowed" }, 405);
      }
      const session = await getSession(request, env);
      if (!session) {
        return json({ ok: false, error: "login_required" }, 401);
      }
      const membership = await getMembership(env, session.userId);
      const quota = await getUserQuotaSummary(env, session.userId, membership);
      return json({
        ok: true,
        items: await listUserGenerationRecords(env, session.userId),
        quota,
        storage: "PromptArc D1 + R2"
      });
    }

    if (url.pathname === "/api/admin/members" && envFlag(env, "ADMIN_BACKEND_ENABLED")) {
      if (request.method !== "GET") {
        return json({ ok: false, error: "Method not allowed" }, 405);
      }
      if (!isAdminRequest(request, env)) {
        return json({ ok: false, error: "admin_required" }, 401);
      }
      return json({
        ok: true,
        members: await listAdminMembers(env)
      });
    }

    if (url.pathname !== "/api/generate-image") {
      return json({ ok: false, error: "Not found" }, 404);
    }

    if (request.method === "GET" && url.searchParams.get("gallery") === "1") {
      try {
        return json({ ok: true, ...(await listAdminGalleryFeed(env)) });
      } catch (error) {
        return json({ ok: false, items: [], deletedIds: [], error: error.message }, 500);
      }
    }

    if (request.method === "GET" && url.searchParams.get("history") === "1") {
      const anonymousId = sanitizeId(url.searchParams.get("anonymousId"), "anon");
      let items = [];
      try {
        items = await listGenerationRecords(env, anonymousId);
      } catch (error) {
        console.warn("Generation history was not loaded", error && error.message);
      }
      return json({ ok: true, items, storage: "PromptArc D1 + R2" });
    }

    if (request.method !== "POST") {
      return json({ ok: false, error: "Method not allowed" }, 405);
    }

    let input;
    try {
      input = await request.json();
    } catch {
      return json({ ok: false, error: "Invalid JSON body" }, 400);
    }

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

    const anonymousId = sanitizeId(input.anonymousId, "anon");
    const generationId = sanitizeId(input.generationId, "gen");

    if (input.action === "admin-upload-gallery") {
      if (!isAdminRequest(request, env)) {
        return json({ ok: false, error: "Admin token required." }, 401);
      }
      if (!env.PROMPTARC_R2 || !env.PROMPTARC_DB) {
        return json({ ok: false, error: "Admin gallery backend is not fully configured." }, 503);
      }

      const title = String(input.title || "").trim();
      const prompt = String(input.prompt || "").trim();
      const category = sanitizePart(input.category || "experimental");
      const tags = Array.isArray(input.tags)
        ? input.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 12)
        : String(input.tags || "")
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
            .slice(0, 12);
      const imageBase64 = String(input.imageBase64 || "").replace(/^data:[^;]+;base64,/, "");
      const contentType = String(input.contentType || "").toLowerCase();
      const outputFormat = sanitizePart(
        input.outputFormat || (contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : "png")
      );
      if (title.length < 3 || prompt.length < 12 || imageBase64.length < 100) {
        return json({ ok: false, error: "Title, prompt, and image are required." }, 400);
      }

      const id = sanitizeId(input.id || `admin-${sanitizePart(title)}-${Date.now()}`, "admin");
      const bytes = decodeBase64(imageBase64);
      const extension = outputFormat === "jpg" || outputFormat === "jpeg" ? "jpg" : "png";
      const uploadContentType = extension === "jpg" ? "image/jpeg" : "image/png";
      const key = `admin-gallery/${id}.${extension}`;
      await env.PROMPTARC_R2.put(key, bytes, {
        httpMetadata: {
          contentType: uploadContentType,
          cacheControl: "public, max-age=31536000, immutable"
        },
        customMetadata: {
          source: "promptarc-admin",
          category
        }
      });

      const publicBase = String(env.R2_PUBLIC_BASE || "https://img.promptarc.cc").replace(/\/+$/, "");
      const imageUrl = `${publicBase}/${key}`;
      const item = {
        id,
        title,
        category,
        tags,
        prompt,
        imageUrl,
        key,
        sourceLabel: String(input.sourceLabel || "Admin upload").trim(),
        sourceUrl: String(input.sourceUrl || "").trim(),
        createdAt: new Date().toISOString()
      };
      await saveAdminGalleryItem(env, item);
      return json({ ok: true, item });
    }

    if (input.action === "admin-delete-gallery") {
      if (!isAdminRequest(request, env)) {
        return json({ ok: false, error: "Admin token required." }, 401);
      }
      const id = sanitizeId(input.id, "gallery");
      if (!id) {
        return json({ ok: false, error: "Gallery id is required." }, 400);
      }
      await deleteAdminGalleryItem(env, id, String(input.reason || "").trim());
      return json({ ok: true, deletedId: id });
    }

    if (input.action === "delete-generation") {
      let deleted = false;
      try {
        deleted = await softDeleteGenerationRecord(env, generationId, anonymousId);
      } catch (error) {
        console.warn("Generation record was not deleted", error && error.message);
      }
      return json({ ok: true, deleted });
    }

    if (input.action === "submit-gallery") {
      let submitted = false;
      try {
        submitted = await submitGalleryReview(env, generationId, anonymousId);
      } catch (error) {
        console.warn("Gallery submission was not saved", error && error.message);
      }
      return json({ ok: true, submitted, reviewStatus: "pending" });
    }

    const prompt = String(input.prompt || "").trim();
    const ratio = String(input.ratio || "1:1 square").trim();
    const category = "image";
    const resolution = String(input.resolution || "1k").trim().toLowerCase();
    const generationCount = "1";
    const variationMode = String(input.variationMode || "subtle").trim().toLowerCase();
    const guardrails = String(input.guardrails || "").trim();

    if (prompt.length < 12) {
      return json({ ok: false, error: "Prompt is too short." }, 400);
    }

    if (prompt.length > 3500) {
      return json({ ok: false, error: "Prompt is too long. Keep it under 3500 characters." }, 400);
    }

    if (!env.OPENAI_API_KEY || !env.OPENAI_BASE_URL || !env.PROMPTARC_R2) {
      return json({ ok: false, error: "Generator backend is not fully configured." }, 503);
    }

    let memberQuota = null;
    if (session) {
      const quotaCheck = await ensureQuota(env, session.userId, 1);
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
      memberQuota = quotaCheck.quota || null;
    }

    const rateLimit = checkRateLimit(request);
    if (!rateLimit.allowed) {
      return json(
        {
          ok: false,
          error: "Generation limit reached. Please try again later.",
          resetAt: new Date(rateLimit.resetAt).toISOString()
        },
        429
      );
    }

    let quota = session
      ? memberQuota
      : {
      limit: Number(env.ANONYMOUS_DAILY_LIMIT || anonymousDailyLimit),
      used: null,
      remaining: rateLimit.remaining,
      source: "memory-hourly"
    };
    if (!session) {
      try {
        const used = await getDailyUsage(env, anonymousId);
        if (used !== null) {
          quota.used = used;
          quota.remaining = Math.max(quota.limit - used, 0);
          quota.source = "d1-daily";
          if (used >= quota.limit) {
            return json(
              {
                ok: false,
                error: "Daily free generation limit reached. Please try again tomorrow.",
                quota
              },
              429
            );
          }
        }
      } catch (error) {
        console.warn("Daily quota check failed", error && error.message);
      }
    }

    const finalPrompt = buildFinalPrompt({ prompt, ratio, resolution: resolution.toUpperCase(), generationCount, variationMode, guardrails });
    const baseUrl = String(env.OPENAI_BASE_URL).replace(/\/+$/, "");
    const model = env.IMAGE_MODEL || "gpt-image-2";
    const outputFormat = env.IMAGE_OUTPUT_FORMAT || "png";
    const size = sizeByRatio[ratio] || "1024x1024";
    const quality = getQualityForResolution(resolution, env.IMAGE_QUALITY);

    const imageResponse = await fetchImageProviderWithRetry(joinApiPath(baseUrl, "/v1/images/generations"), {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model,
        prompt: finalPrompt,
        size,
        quality,
        output_format: outputFormat,
        n: 1
      })
    });

    const raw = await imageResponse.text();
    if (!imageResponse.ok) {
      return json({ ok: false, error: getProviderFailureMessage(imageResponse.status), detail: raw.slice(0, 280) }, 502);
    }

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return json({ ok: false, error: "Image provider returned invalid JSON." }, 502);
    }

    let bytes;
    try {
      bytes = await loadProviderImageBytes(payload?.data?.[0]);
    } catch (error) {
      return json({ ok: false, error: error.message }, 502);
    }
    if (!bytes) {
      return json({ ok: false, error: "Image provider did not return an image." }, 502);
    }

    const now = new Date();
    const datePart = now.toISOString().slice(0, 10);
    const ownerPath = session ? `users/${session.userId}` : `anonymous/${anonymousId}`;
    const key = `generated/${ownerPath}/${datePart}/${generationId}-${sanitizePart(category)}.${outputFormat}`;
    const contentType = outputFormat === "jpg" || outputFormat === "jpeg" ? "image/jpeg" : `image/${outputFormat}`;

    await env.PROMPTARC_R2.put(key, bytes, {
      httpMetadata: {
        contentType,
        cacheControl: "public, max-age=31536000, immutable"
      },
      customMetadata: {
        category,
        ratio,
        source: "promptarc-generator",
        anonymousId,
        generationId,
        resolution
      }
    });

    const publicBase = String(env.R2_PUBLIC_BASE || "https://img.promptarc.cc").replace(/\/+$/, "");
    const imageUrl = `${publicBase}/${key}`;
    const createdAt = now.toISOString();
    const visibility = "public-unlisted";
    let recordSaved = false;
    try {
      await createGenerationRecord(env, {
        id: generationId,
        userId: session ? session.userId : null,
        anonymousId: session ? null : anonymousId,
        originalPrompt: prompt,
        finalPrompt,
        key,
        imageUrl,
        ratio,
        category,
        resolution,
        model,
        visibility,
        createdAt
      });
      recordSaved = Boolean(env.PROMPTARC_DB);
    } catch (error) {
      console.warn("Generation record was not saved", error && error.message);
    }

    try {
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
        if (quota) {
          quota.used = Number(quota.used || 0) + 1;
          quota.remaining = Math.max(Number(quota.limit || 0) - quota.used, 0);
        }
      } else {
        await recordUsageEvent(env, {
          id: usageEventId(),
          anonymousId,
          eventType: "image_generated",
          costUnits: 1,
          createdAt
        });
        if (quota.used !== null) {
          quota.used += 1;
          quota.remaining = Math.max(quota.limit - quota.used, 0);
        }
      }
    } catch (error) {
      console.warn("Usage event was not saved", error && error.message);
    }

  return json({
    ok: true,
    imageUrl,
    key,
    generationId,
    anonymousId,
    prompt: finalPrompt,
    resolution,
    size,
    model,
    storage: "PromptArc R2",
    visibility,
    createdAt,
    recordSaved,
    quota,
    remaining: rateLimit.remaining
  });
}
