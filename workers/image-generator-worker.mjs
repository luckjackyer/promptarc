const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type"
};

const sizeByRatio = {
  "1:1 square": "1024x1024",
  "4:5 vertical social": "1024x1536",
  "9:16 mobile story": "1024x1536",
  "16:9 wide banner": "1536x1024"
};

const generationBuckets = new Map();
const rateLimitWindowMs = 60 * 60 * 1000;
const anonymousHourlyLimit = 8;

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

function sanitizePart(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "image";
}

function buildFinalPrompt(input) {
  return [
    "Generate one AI image.",
    "",
    `Use case: ${input.category}`,
    `Aspect ratio: ${input.ratio}`,
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

function decodeBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
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

    if (request.method !== "POST") {
      return json({ ok: false, error: "Method not allowed" }, 405);
    }

    let input;
    try {
      input = await request.json();
    } catch {
      return json({ ok: false, error: "Invalid JSON body" }, 400);
    }

    const prompt = String(input.prompt || "").trim();
    const ratio = String(input.ratio || "1:1 square").trim();
    const category = String(input.category || "image").trim();
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

    const finalPrompt = buildFinalPrompt({ prompt, ratio, category, guardrails });
    const baseUrl = String(env.OPENAI_BASE_URL).replace(/\/+$/, "");
    const model = env.IMAGE_MODEL || "gpt-image-2";
    const outputFormat = env.IMAGE_OUTPUT_FORMAT || "png";
    const size = sizeByRatio[ratio] || "1024x1024";

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
        quality: env.IMAGE_QUALITY || "low",
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

    const b64 = payload?.data?.[0]?.b64_json;
    if (!b64) {
      return json({ ok: false, error: "Image provider did not return an image." }, 502);
    }

    const bytes = decodeBase64(b64);
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10);
    const key = `generated/${datePart}/${Date.now()}-${sanitizePart(category)}.${outputFormat}`;
    const contentType = outputFormat === "jpg" || outputFormat === "jpeg" ? "image/jpeg" : `image/${outputFormat}`;

    await env.PROMPTARC_R2.put(key, bytes, {
      httpMetadata: {
        contentType,
        cacheControl: "public, max-age=31536000, immutable"
      },
      customMetadata: {
        category,
        ratio,
        source: "promptarc-generator"
      }
    });

    const publicBase = String(env.R2_PUBLIC_BASE || "https://img.promptarc.cc").replace(/\/+$/, "");
    return json({
      ok: true,
      imageUrl: `${publicBase}/${key}`,
      key,
      prompt: finalPrompt,
      size,
      model,
      storage: "PromptArc R2",
      visibility: "public-unlisted",
      remaining: rateLimit.remaining
    });
  }
};
