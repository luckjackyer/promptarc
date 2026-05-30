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
const anonymousDailyLimit = 5;

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
  return [
    `Generate ${count} AI image${count === "1" ? "." : "s."}`,
    "",
    `Aspect ratio: ${input.ratio}`,
    `Output size: ${input.resolution}`,
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
      null,
      record.anonymousId,
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
    const generationCount = String(input.generationCount || "1").trim();
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

    let quota = {
      limit: Number(env.ANONYMOUS_DAILY_LIMIT || anonymousDailyLimit),
      used: null,
      remaining: rateLimit.remaining,
      source: "memory-hourly"
    };
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

    const finalPrompt = buildFinalPrompt({ prompt, ratio, resolution: resolution.toUpperCase(), generationCount, guardrails });
    const baseUrl = String(env.OPENAI_BASE_URL).replace(/\/+$/, "");
    const model = env.IMAGE_MODEL || "gpt-image-2";
    const outputFormat = env.IMAGE_OUTPUT_FORMAT || "png";
    const size = sizeByRatio[ratio] || "1024x1024";
    const quality = getQualityForResolution(resolution, env.IMAGE_QUALITY);

    const imageResponse = await fetch(joinApiPath(baseUrl, "/v1/images/generations"), {
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
      return json({ ok: false, error: `Image provider failed with ${imageResponse.status}.`, detail: raw.slice(0, 280) }, 502);
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
    const key = `generated/anonymous/${datePart}/${anonymousId}/${generationId}-${sanitizePart(category)}.${outputFormat}`;
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
        anonymousId,
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
