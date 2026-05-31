import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
process.chdir(repoRoot);

function loadEnv(file = ".env") {
  if (!fs.existsSync(file)) return {};
  const env = {};
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
  return env;
}

const env = { ...process.env, ...loadEnv() };
const accountId = env.CLOUDFLARE_ACCOUNT_ID || "e7fe43204a8f7ae5dee45d4a325717fc";
const scriptName = env.WORKER_NAME || "promptarc-image-generator";
const bucket = env.R2_BUCKET || "promptarc-gallery";
const rootDomain = env.ROOT_DOMAIN || "promptarc.cc";
const routePattern = env.WORKER_ROUTE || `www.${rootDomain}/api/generate-image*`;
const workerPath = path.join(repoRoot, "workers", "image-generator-worker.mjs");

const required = ["CLOUDFLARE_TOKEN", "OPENAI_API_KEY", "OPENAI_BASE_URL", "R2_PUBLIC_BASE"];
const missing = required.filter((key) => !env[key]);
if (missing.length) throw new Error(`Missing required env vars: ${missing.join(", ")}`);

async function cf(method, pathname, body, headers = {}) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${pathname}`, {
    method,
    headers: {
      authorization: `Bearer ${env.CLOUDFLARE_TOKEN}`,
      accept: "application/json",
      ...headers
    },
    body
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {}
  if (!response.ok || json?.success === false) {
    const error = new Error(`Cloudflare ${method} ${pathname} failed: ${response.status} ${json?.errors?.[0]?.message || text.slice(0, 300)}`);
    error.statusCode = response.status;
    error.response = json;
    throw error;
  }
  return json;
}

async function getZoneId() {
  if (env.CLOUDFLARE_ZONE_ID) return env.CLOUDFLARE_ZONE_ID;
  const zones = await cf("GET", `/zones?name=${encodeURIComponent(rootDomain)}`);
  const zone = zones.result?.[0];
  if (!zone) throw new Error(`Cloudflare zone not found for ${rootDomain}`);
  return zone.id;
}

async function putSecret(name, value) {
  await cf(
    "PUT",
    `/accounts/${accountId}/workers/scripts/${scriptName}/secrets`,
    JSON.stringify({ name, text: value, type: "secret_text" }),
    { "content-type": "application/json" }
  );
  console.log(`Worker secret set: ${name}`);
}

async function deployWorker() {
  const code = fs.readFileSync(workerPath, "utf8");
  const metadata = {
    main_module: "image-generator-worker.mjs",
    bindings: [
      {
        type: "r2_bucket",
        name: "PROMPTARC_R2",
        bucket_name: bucket
      },
      ...(env.D1_DATABASE_ID
        ? [
            {
              type: "d1",
              name: "PROMPTARC_DB",
              id: env.D1_DATABASE_ID
            }
          ]
        : []),
      {
        type: "plain_text",
        name: "OPENAI_BASE_URL",
        text: env.OPENAI_BASE_URL
      },
      {
        type: "plain_text",
        name: "R2_PUBLIC_BASE",
        text: env.R2_PUBLIC_BASE
      },
      {
        type: "plain_text",
        name: "IMAGE_MODEL",
        text: env.IMAGE_MODEL || "gpt-image-2"
      },
      {
        type: "plain_text",
        name: "IMAGE_QUALITY",
        text: env.IMAGE_QUALITY || "low"
      },
      {
        type: "plain_text",
        name: "IMAGE_OUTPUT_FORMAT",
        text: env.IMAGE_OUTPUT_FORMAT || "png"
      },
      {
        type: "plain_text",
        name: "ANONYMOUS_DAILY_LIMIT",
        text: env.ANONYMOUS_DAILY_LIMIT || "5"
      },
      {
        type: "plain_text",
        name: "ADMIN_TOKEN",
        text: env.ADMIN_TOKEN || ""
      }
    ]
  };

  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("image-generator-worker.mjs", new Blob([code], { type: "application/javascript+module" }), "image-generator-worker.mjs");

  await cf("PUT", `/accounts/${accountId}/workers/scripts/${scriptName}`, form);
  console.log(`Worker deployed: ${scriptName}`);
}

async function ensureRoute() {
  const zoneId = await getZoneId();
  const routes = await cf("GET", `/zones/${zoneId}/workers/routes`);
  const existing = routes.result?.find((route) => route.pattern === routePattern);
  const body = JSON.stringify({ pattern: routePattern, script: scriptName });
  if (existing) {
    await cf("PUT", `/zones/${zoneId}/workers/routes/${existing.id}`, body, { "content-type": "application/json" });
    console.log(`Worker route updated: ${routePattern}`);
  } else {
    await cf("POST", `/zones/${zoneId}/workers/routes`, body, { "content-type": "application/json" });
    console.log(`Worker route created: ${routePattern}`);
  }
}

await deployWorker();
await putSecret("OPENAI_API_KEY", env.OPENAI_API_KEY);
await ensureRoute();
console.log(`Image generator endpoint ready: https://${routePattern}`);
