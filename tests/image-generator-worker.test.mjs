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

function makeImageBase64() {
  return Buffer.from("fake-png").toString("base64");
}

async function runGeneration(envOverrides = {}, bodyOverrides = {}) {
  const bucket = new MemoryBucket();
  const providerCalls = [];
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (url, options) => {
    providerCalls.push({ url: String(url), options });
    return new Response(JSON.stringify({ data: [{ b64_json: makeImageBase64() }] }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  };

  try {
    const request = new Request("https://www.promptarc.cc/api/generate-image", {
      method: "POST",
      headers: { "content-type": "application/json" },
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

const unsupportedCount = await runGeneration({}, { generationCount: "2" });
assert.equal(unsupportedCount.response.status, 400);
assert.equal(unsupportedCount.payload.ok, false);
assert.equal(unsupportedCount.providerCalls.length, 0);

console.log("image-generator-worker tests passed");
