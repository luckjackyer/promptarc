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

const env = { ...loadEnv(), ...process.env };
const accountId = env.CLOUDFLARE_ACCOUNT_ID || "e7fe43204a8f7ae5dee45d4a325717fc";
const bucket = env.R2_BUCKET || "promptarc-gallery";
const publicHost = env.R2_PUBLIC_HOST || "img.promptarc.cc";
const required = ["CLOUDFLARE_TOKEN", "ROOT_DOMAIN"];
const missing = required.filter((key) => !env[key]);
if (missing.length) throw new Error(`Missing required env vars: ${missing.join(", ")}`);

async function cf(method, pathname, body) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.CLOUDFLARE_TOKEN}`,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {}
  if (res.status >= 400 || json?.success === false) {
    const error = new Error(`Cloudflare ${method} ${pathname} failed: ${res.status} ${json?.errors?.[0]?.message || text.slice(0, 240)}`);
    error.statusCode = res.status;
    error.response = json;
    throw error;
  }
  return json;
}

async function getZoneId() {
  if (env.CLOUDFLARE_ZONE_ID) return env.CLOUDFLARE_ZONE_ID;
  const zones = await cf("GET", `/zones?name=${encodeURIComponent(env.ROOT_DOMAIN)}`);
  const zone = zones.result?.[0];
  if (!zone) throw new Error(`Cloudflare zone not found for ${env.ROOT_DOMAIN}`);
  return zone.id;
}

async function ensureBucket() {
  try {
    await cf("GET", `/accounts/${accountId}/r2/buckets/${bucket}`);
    console.log(`R2 bucket exists: ${bucket}`);
    return;
  } catch (error) {
    if (error.statusCode !== 404) throw error;
  }
  await cf("PUT", `/accounts/${accountId}/r2/buckets/${bucket}`, {});
  console.log(`R2 bucket created: ${bucket}`);
}

async function enablePublicDevUrl() {
  try {
    await cf("PUT", `/accounts/${accountId}/r2/buckets/${bucket}/domains/managed`, { enabled: true });
    console.log("R2 r2.dev public URL enabled for testing.");
  } catch (error) {
    console.log(`Skipped r2.dev public URL: ${error.message}`);
  }
}

async function connectCustomDomain(zoneId) {
  try {
    await cf("POST", `/accounts/${accountId}/r2/buckets/${bucket}/domains/custom`, {
      domain: publicHost,
      zoneId,
      enabled: true
    });
    console.log(`R2 custom domain connected: https://${publicHost}`);
  } catch (error) {
    if (error.statusCode === 409 || String(error.message).includes("already")) {
      await cf("PUT", `/accounts/${accountId}/r2/buckets/${bucket}/domains/custom/${publicHost}`, {
        enabled: true,
        minTLS: "1.2"
      });
      console.log(`R2 custom domain updated: https://${publicHost}`);
    } else {
      console.log(`Skipped R2 custom domain: ${error.message}`);
    }
  }
}

async function upsertImgDns() {
  const zoneId = await getZoneId();
  const params = new URLSearchParams({ type: "CNAME", name: publicHost });
  const records = await cf("GET", `/zones/${zoneId}/dns_records?${params}`);
  const existing = records.result?.[0];
  const record = {
    type: "CNAME",
    name: publicHost,
    content: `${bucket}.${accountId}.r2.cloudflarestorage.com`,
    proxied: true,
    ttl: 1
  };
  if (existing) {
    await cf("PUT", `/zones/${zoneId}/dns_records/${existing.id}`, { ...existing, ...record });
  } else {
    await cf("POST", `/zones/${zoneId}/dns_records`, record);
  }
  console.log(`DNS prepared for ${publicHost}`);
  return zoneId;
}

await ensureBucket();
await enablePublicDevUrl();
const zoneId = await upsertImgDns();
await connectCustomDomain(zoneId);
console.log(`R2 setup attempted. Bucket=${bucket}, publicHost=${publicHost}`);
