import fs from "node:fs";
import crypto from "node:crypto";
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
const endpoint = env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;
const required = ["R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"];
const missing = required.filter((key) => !env[key]);
if (missing.length) throw new Error(`Missing required env vars: ${missing.join(", ")}`);

function hmac(key, value, encoding) {
  return crypto.createHmac("sha256", key).update(value, "utf8").digest(encoding);
}

function sha256(value, encoding = "hex") {
  return crypto.createHash("sha256").update(value).digest(encoding);
}

function amzDate(date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function dateStamp(date) {
  return date.toISOString().slice(0, 10).replaceAll("-", "");
}

function getSigningKey(secret, date, region, service) {
  const kDate = hmac(`AWS4${secret}`, date);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}

async function putObject(key, body) {
  const now = new Date();
  const host = new URL(endpoint).host;
  const pathname = `/${bucket}/${key.split("/").map(encodeURIComponent).join("/")}`;
  const payloadHash = sha256(body);
  const headers = {
    "cache-control": "public, max-age=31536000, immutable",
    "content-type": "image/jpeg",
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate(now)
  };
  const signedHeaders = Object.keys(headers).sort().join(";");
  const canonicalHeaders = Object.keys(headers).sort().map((name) => `${name}:${headers[name]}\n`).join("");
  const canonicalRequest = ["PUT", pathname, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const scope = `${dateStamp(now)}/auto/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", headers["x-amz-date"], scope, sha256(canonicalRequest)].join("\n");
  const signingKey = getSigningKey(env.R2_SECRET_ACCESS_KEY, dateStamp(now), "auto", "s3");
  const signature = hmac(signingKey, stringToSign, "hex");
  const authorization = `AWS4-HMAC-SHA256 Credential=${env.R2_ACCESS_KEY_ID}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  const response = await fetch(`${endpoint}${pathname}`, {
    method: "PUT",
    headers: { ...headers, Authorization: authorization },
    body
  });
  if (!response.ok) {
    throw new Error(`R2 upload failed ${response.status} ${key}: ${(await response.text()).slice(0, 300)}`);
  }
}

const dir = path.join(repoRoot, "assets", "gallery", "thumbs");
const files = fs.readdirSync(dir).filter((name) => name.startsWith("expansion-") && name.endsWith(".jpg"));
for (let i = 0; i < files.length; i += 1) {
  const name = files[i];
  const key = `assets/gallery/thumbs/${name}`;
  await putObject(key, fs.readFileSync(path.join(dir, name)));
  if ((i + 1) % 25 === 0 || i + 1 === files.length) {
    console.log(`Uploaded ${i + 1}/${files.length}: ${key}`);
  }
}
