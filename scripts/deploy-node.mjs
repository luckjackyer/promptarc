import fs from "node:fs";
import crypto from "node:crypto";
import net from "node:net";
import path from "node:path";
import tls from "node:tls";
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
const required = ["GITHUB_TOKEN", "GITHUB_USER", "GITHUB_REPO", "CLOUDFLARE_TOKEN", "DOMAIN", "ROOT_DOMAIN"];
const missing = required.filter((key) => !env[key]);
if (missing.length) throw new Error(`Missing required env vars: ${missing.join(", ")}`);

const proxy = env.API_PROXY || env.HTTPS_PROXY || env.HTTP_PROXY || "http://127.0.0.1:7897";
const proxyUrl = new URL(proxy);
const branch = env.GITHUB_BRANCH || "main";
const maxRetries = Number(env.DEPLOY_MAX_RETRIES || 5);
const uploadExtras = env.DEPLOY_UPLOAD_EXTRAS === "1";
const deployIgnoreNames = new Set([
  ".git",
  ".env",
  "_deploy",
  "content-pipeline",
  "deploy-logs",
  "node_modules",
  "gumroad-product",
  "DEPLOY-NOW.bat",
  "deploy-now.ps1",
  "DOC-VALIDATION-NOTES.md",
  "DEPLOYMENT-AUTOMATION.md",
  "WORKFLOW-RULES.md",
  "COMPETITOR-OBSERVATION.md",
  "LAUNCH-CHECKLIST.md",
  "POST-LAUNCH-RUNBOOK.md",
  "SETUP-FAST-LAUNCH.md"
]);

function getReferencedGalleryAssets() {
  const galleryDataPath = path.join(repoRoot, "gallery", "gallery-data.js");
  if (!fs.existsSync(galleryDataPath)) return new Set();
  const content = fs.readFileSync(galleryDataPath, "utf8");
  return new Set(
    [...content.matchAll(/\/assets\/gallery\/[^"']+/g)].map((match) => match[0].slice(1))
  );
}

const referencedGalleryAssets = getReferencedGalleryAssets();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error) {
  const message = String(error?.message || "");
  return (
    error?.retryable ||
    error?.statusCode === 429 ||
    error?.statusCode === 500 ||
    error?.statusCode === 502 ||
    error?.statusCode === 503 ||
    error?.statusCode === 504 ||
    message.includes("ECONNRESET") ||
    message.includes("ETIMEDOUT") ||
    message.includes("timed out") ||
    message.includes("socket hang up")
  );
}

async function withRetry(label, action) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
      if (!isRetryableError(error) || attempt === maxRetries) {
        throw error;
      }
      const waitMs = Math.min(30000, 1200 * 2 ** (attempt - 1));
      console.log(`${label} failed (${error.message}). Retrying in ${Math.round(waitMs / 1000)}s, attempt ${attempt + 1}/${maxRetries}.`);
      await sleep(waitMs);
    }
  }
  throw lastError;
}

function decodeChunked(text) {
  let output = "";
  let index = 0;
  while (index < text.length) {
    const sizeEnd = text.indexOf("\r\n", index);
    if (sizeEnd < 0) break;
    const size = Number.parseInt(text.slice(index, sizeEnd), 16);
    if (!size) break;
    output += text.slice(sizeEnd + 2, sizeEnd + 2 + size);
    index = sizeEnd + 2 + size + 2;
  }
  return output;
}

function requestViaProxy({ host, pathname, method = "GET", headers = {}, body }) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(Number(proxyUrl.port), proxyUrl.hostname);
    socket.setTimeout(45000);
    socket.on("connect", () => {
      socket.write(`CONNECT ${host}:443 HTTP/1.1\r\nHost: ${host}:443\r\nProxy-Connection: keep-alive\r\n\r\n`);
    });

    let proxyHead = "";
    function onProxyData(chunk) {
      proxyHead += chunk.toString("latin1");
      const idx = proxyHead.indexOf("\r\n\r\n");
      if (idx === -1) return;
      socket.removeListener("data", onProxyData);
      if (!proxyHead.slice(0, idx).includes("200")) return reject(new Error(proxyHead.split("\r\n")[0]));

      const secure = tls.connect({ socket, servername: host }, () => {
        const payload = body ? JSON.stringify(body) : "";
        const requestHeaders = {
          Host: host,
          "User-Agent": "PromptArcDeploy",
          Accept: "application/json",
          Connection: "close",
          ...headers
        };
        if (payload) {
          requestHeaders["Content-Type"] = "application/json";
          requestHeaders["Content-Length"] = Buffer.byteLength(payload);
        }
        const headerText = Object.entries(requestHeaders).map(([key, value]) => `${key}: ${value}`).join("\r\n");
        secure.write(`${method} ${pathname} HTTP/1.1\r\n${headerText}\r\n\r\n${payload}`);
      });

      let response = Buffer.alloc(0);
      secure.on("data", (chunk) => response = Buffer.concat([response, chunk]));
      secure.on("end", () => {
        const raw = response.toString();
        const split = raw.indexOf("\r\n\r\n");
        const head = raw.slice(0, split);
        let text = raw.slice(split + 4);
        if (/transfer-encoding:\s*chunked/i.test(head)) text = decodeChunked(text);
        const statusLine = head.split("\r\n")[0] || "";
        const statusCode = Number(statusLine.split(" ")[1]);
        let json = null;
        try { json = text ? JSON.parse(text) : null; } catch {}
        resolve({ statusCode, text, json });
      });
      secure.on("error", reject);
    }

    socket.on("data", onProxyData);
    socket.on("timeout", () => reject(new Error("Proxy request timed out")));
    socket.on("error", reject);
  });
}

async function github(method, pathname, body) {
  const res = await withRetry(`GitHub ${method} ${pathname}`, () => {
    return requestViaProxy({
      host: "api.github.com",
      pathname,
      method,
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
      },
      body
    });
  });
  if (res.statusCode >= 400) {
    const err = new Error(`GitHub ${method} ${pathname} failed: ${res.statusCode} ${res.json?.message || res.text.slice(0, 200)}`);
    err.statusCode = res.statusCode;
    err.retryable = [429, 500, 502, 503, 504].includes(res.statusCode);
    throw err;
  }
  return res.json;
}

async function cloudflare(method, pathname, body) {
  const res = await withRetry(`Cloudflare ${method} ${pathname}`, () => {
    return requestViaProxy({
      host: "api.cloudflare.com",
      pathname,
      method,
      headers: {
        Authorization: `Bearer ${env.CLOUDFLARE_TOKEN}`,
        Accept: "application/json"
      },
      body
    });
  });
  if (res.statusCode >= 400 || res.json?.success === false) {
    const err = new Error(`Cloudflare ${method} ${pathname} failed: ${res.statusCode} ${res.json?.errors?.[0]?.message || res.text.slice(0, 200)}`);
    err.statusCode = res.statusCode;
    err.retryable = [429, 500, 502, 503, 504].includes(res.statusCode);
    throw err;
  }
  return res.json;
}

async function ensureRepo() {
  try {
    await github("GET", `/repos/${env.GITHUB_USER}/${env.GITHUB_REPO}`);
    console.log("GitHub repo exists.");
  } catch (error) {
    if (error.statusCode !== 404) throw error;
    await github("POST", "/user/repos", {
      name: env.GITHUB_REPO,
      private: false,
      auto_init: false,
      has_issues: true,
      has_projects: false,
      has_wiki: false
    });
    console.log("GitHub repo created.");
  }
}

function walkFiles(dir) {
  const entries = [];
  for (const name of fs.readdirSync(dir)) {
    if (!uploadExtras && deployIgnoreNames.has(name)) continue;
    if (uploadExtras && [".git", ".env", "_deploy", "node_modules"].includes(name)) continue;
    const fullPath = path.join(dir, name);
    const relPath = path.relative(repoRoot, fullPath).replaceAll("\\", "/");
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      entries.push(...walkFiles(fullPath));
    } else {
      if (!uploadExtras && relPath.startsWith("assets/gallery/") && !referencedGalleryAssets.has(relPath)) {
        continue;
      }
      entries.push({ fullPath, relPath });
    }
  }
  return entries;
}

async function getExistingSha(relPath) {
  try {
    const encoded = relPath.split("/").map(encodeURIComponent).join("/");
    const res = await github("GET", `/repos/${env.GITHUB_USER}/${env.GITHUB_REPO}/contents/${encoded}?ref=${encodeURIComponent(branch)}`);
    return res.sha;
  } catch (error) {
    if (error.statusCode === 404) return null;
    throw error;
  }
}

function gitBlobSha(buffer) {
  const header = Buffer.from(`blob ${buffer.length}\0`);
  return crypto.createHash("sha1").update(Buffer.concat([header, buffer])).digest("hex");
}

async function uploadFiles() {
  fs.writeFileSync(path.join(repoRoot, "CNAME"), `${env.DOMAIN}\n`, "utf8");
  const files = walkFiles(repoRoot);
  let uploaded = 0;
  let skipped = 0;
  for (const file of files) {
    const sha = await getExistingSha(file.relPath);
    const content = fs.readFileSync(file.fullPath);
    if (sha && sha === gitBlobSha(content)) {
      skipped += 1;
      if ((uploaded + skipped) % 10 === 0 || uploaded + skipped === files.length) {
        console.log(`Checked ${uploaded + skipped}/${files.length}; uploaded ${uploaded}, skipped ${skipped}`);
      }
      continue;
    }
    const body = {
      message: `${sha ? "Update" : "Add"} ${file.relPath}`,
      content: content.toString("base64"),
      branch
    };
    if (sha) body.sha = sha;
    const encoded = file.relPath.split("/").map(encodeURIComponent).join("/");
    await github("PUT", `/repos/${env.GITHUB_USER}/${env.GITHUB_REPO}/contents/${encoded}`, body);
    uploaded += 1;
    if ((uploaded + skipped) % 10 === 0 || uploaded + skipped === files.length) {
      console.log(`Checked ${uploaded + skipped}/${files.length}; uploaded ${uploaded}, skipped ${skipped}`);
    }
  }
}

async function ensurePages() {
  const pathname = `/repos/${env.GITHUB_USER}/${env.GITHUB_REPO}/pages`;
  try {
    await github("GET", pathname);
    await github("PUT", pathname, { source: { branch, path: "/" } });
    console.log("GitHub Pages updated.");
  } catch (error) {
    if (error.statusCode !== 404) throw error;
    await github("POST", pathname, { source: { branch, path: "/" } });
    console.log("GitHub Pages enabled.");
  }
}

async function getZoneId() {
  if (env.CLOUDFLARE_ZONE_ID) return env.CLOUDFLARE_ZONE_ID;
  const res = await cloudflare("GET", `/client/v4/zones?name=${encodeURIComponent(env.ROOT_DOMAIN)}`);
  const zone = res.result?.[0];
  if (!zone) throw new Error(`Cloudflare zone not found for ${env.ROOT_DOMAIN}`);
  return zone.id;
}

async function upsertRecord(zoneId, record) {
  const query = new URLSearchParams({ type: record.type, name: record.name, content: record.content });
  const existing = await cloudflare("GET", `/client/v4/zones/${zoneId}/dns_records?${query}`);
  const recordId = existing.result?.[0]?.id;
  if (recordId) {
    await cloudflare("PUT", `/client/v4/zones/${zoneId}/dns_records/${recordId}`, record);
  } else {
    await cloudflare("POST", `/client/v4/zones/${zoneId}/dns_records`, record);
  }
}

async function configureDns() {
  const zoneId = await getZoneId();
  await upsertRecord(zoneId, { type: "CNAME", name: env.DOMAIN, content: `${env.GITHUB_USER}.github.io`, proxied: false, ttl: 1 });
  for (const ip of ["185.199.108.153", "185.199.109.153", "185.199.110.153", "185.199.111.153"]) {
    await upsertRecord(zoneId, { type: "A", name: env.ROOT_DOMAIN, content: ip, proxied: false, ttl: 1 });
  }
  console.log("Cloudflare DNS configured.");
}

await ensureRepo();
await uploadFiles();
await ensurePages();
await configureDns();
console.log(`Deployment complete: https://${env.DOMAIN}`);
