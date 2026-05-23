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

const env = { ...loadEnv(), ...process.env };
const required = ["GITHUB_TOKEN", "GITHUB_USER", "GITHUB_REPO", "CLOUDFLARE_TOKEN", "DOMAIN", "ROOT_DOMAIN"];
const missing = required.filter((key) => !env[key]);
if (missing.length) throw new Error(`Missing required env vars: ${missing.join(", ")}`);

const branch = env.GITHUB_BRANCH || "main";
const maxRetries = Number(env.DEPLOY_MAX_RETRIES || 5);
const uploadExtras = env.DEPLOY_UPLOAD_EXTRAS === "1";
const deployGalleryAssets = env.DEPLOY_GALLERY_ASSETS === "1";
const requestTimeoutMs = Number(env.DEPLOY_REQUEST_TIMEOUT_MS || 90000);
const perTransportRetries = Number(env.DEPLOY_PER_TRANSPORT_RETRIES || Math.min(maxRetries, 3));
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
  const assets = new Set();
  for (const match of content.matchAll(/\/assets\/gallery\/[^"']+/g)) {
    const asset = match[0].slice(1);
    assets.add(asset);
    assets.add(asset.replace("assets/gallery/", "assets/gallery/thumbs/"));
  }
  return assets;
}

const referencedGalleryAssets = getReferencedGalleryAssets();

function unique(values) {
  return [...new Set(values)];
}

function normalizeProxy(raw) {
  if (!raw) return null;
  const value = String(raw).trim();
  if (!value) return null;
  try {
    return new URL(value).toString();
  } catch {
    return null;
  }
}

const proxyCandidates = unique(
  [env.DEPLOY_PROXY, env.HTTPS_PROXY, env.HTTP_PROXY, env.API_PROXY]
    .map(normalizeProxy)
    .filter(Boolean)
);

const requestTransports = [
  { type: "direct", label: "direct connection" },
  ...proxyCandidates.map((value, index) => ({
    type: "proxy",
    label: `proxy ${index + 1}`,
    url: value
  }))
];

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

async function withRetry(label, action, retries = maxRetries) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
      if (!isRetryableError(error) || attempt === retries) {
        throw error;
      }
      const waitMs = Math.min(30000, 1200 * 2 ** (attempt - 1));
      console.log(`${label} failed (${error.message}). Retrying in ${Math.round(waitMs / 1000)}s, attempt ${attempt + 1}/${retries}.`);
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

async function requestDirect({ host, pathname, method = "GET", headers = {}, body }) {
  const payload = body ? JSON.stringify(body) : undefined;
  const response = await fetch(`https://${host}${pathname}`, {
    method,
    headers: {
      Accept: "application/json",
      "User-Agent": "PromptArcDeploy",
      ...headers,
      ...(payload
        ? {
            "Content-Type": "application/json",
            "Content-Length": String(Buffer.byteLength(payload))
          }
        : {})
    },
    body: payload,
    signal: AbortSignal.timeout(requestTimeoutMs)
  });

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {}
  return { statusCode: response.status, text, json };
}

function requestViaProxy({ proxyUrl, host, pathname, method = "GET", headers = {}, body }) {
  return new Promise((resolve, reject) => {
    if (!proxyUrl) {
      reject(new Error("Proxy URL is missing"));
      return;
    }
    const socket = net.createConnection(Number(proxyUrl.port), proxyUrl.hostname);
    socket.setTimeout(requestTimeoutMs);
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

async function requestJson(options) {
  let lastError;

  for (const transport of requestTransports) {
    try {
      const result =
        transport.type === "direct"
          ? await withRetry(
              `${transport.label} ${options.host}${options.pathname}`,
              () => requestDirect(options),
              perTransportRetries
            )
          : await withRetry(
              `${transport.label} ${options.host}${options.pathname}`,
              () =>
                requestViaProxy({
                  ...options,
                  proxyUrl: new URL(transport.url)
                }),
              perTransportRetries
            );

      requestJson.lastTransportLabel = transport.type === "direct" ? transport.label : `${transport.label} ${transport.url}`;
      return result;
    } catch (error) {
      lastError = error;
      const isLast = transport === requestTransports[requestTransports.length - 1];
      if (!isRetryableError(error) || isLast) {
        throw error;
      }
      console.log(`${transport.label} failed completely (${error.message}). Switching transport.`);
    }
  }

  throw lastError || new Error("No request transport available");
}

async function github(method, pathname, body) {
  const res = await withRetry(`GitHub ${method} ${pathname}`, () => {
    return requestJson({
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
    return requestJson({
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
      if (!uploadExtras && relPath.startsWith("assets/gallery/") && !deployGalleryAssets) {
        continue;
      }
      if (!uploadExtras && relPath.startsWith("assets/gallery/") && !referencedGalleryAssets.has(relPath)) {
        continue;
      }
      entries.push({ fullPath, relPath });
    }
  }
  return entries;
}

function gitBlobSha(buffer) {
  const header = Buffer.from(`blob ${buffer.length}\0`, "utf8");
  return crypto.createHash("sha1").update(Buffer.concat([header, buffer])).digest("hex");
}

async function getRemoteBlobMap(treeSha) {
  if (!treeSha) return new Map();
  const tree = await github("GET", `/repos/${env.GITHUB_USER}/${env.GITHUB_REPO}/git/trees/${treeSha}?recursive=1`);
  const blobs = new Map();
  for (const entry of tree.tree || []) {
    if (entry.type === "blob" && entry.path && entry.sha) {
      blobs.set(entry.path, entry.sha);
    }
  }
  return blobs;
}

async function uploadFiles() {
  fs.writeFileSync(path.join(repoRoot, "CNAME"), `${env.DOMAIN}\n`, "utf8");
  const files = walkFiles(repoRoot);

  let baseCommitSha = null;
  let baseTreeSha = null;
  try {
    const ref = await github("GET", `/repos/${env.GITHUB_USER}/${env.GITHUB_REPO}/git/ref/heads/${encodeURIComponent(branch)}`);
    baseCommitSha = ref.object?.sha || null;
    if (baseCommitSha) {
      const commit = await github("GET", `/repos/${env.GITHUB_USER}/${env.GITHUB_REPO}/git/commits/${baseCommitSha}`);
      baseTreeSha = commit.tree?.sha || null;
    }
  } catch (error) {
    if (error.statusCode !== 404) throw error;
  }

  const remoteBlobs = await getRemoteBlobMap(baseTreeSha);
  const changedFiles = [];
  for (const file of files) {
    const content = fs.readFileSync(file.fullPath);
    const localSha = gitBlobSha(content);
    if (remoteBlobs.get(file.relPath) !== localSha) {
      changedFiles.push({ ...file, content });
    }
  }

  const removedFiles = [];
  for (const remotePath of remoteBlobs.keys()) {
    if (remotePath.startsWith("assets/gallery/") && !deployGalleryAssets) {
      removedFiles.push(remotePath);
    }
  }

  if (!changedFiles.length && !removedFiles.length) {
    console.log(`No file changes detected on ${branch}.`);
    return;
  }

  const tree = [];
  for (let index = 0; index < changedFiles.length; index += 1) {
    const file = changedFiles[index];
    const createdBlob = await github("POST", `/repos/${env.GITHUB_USER}/${env.GITHUB_REPO}/git/blobs`, {
      content: file.content.toString("base64"),
      encoding: "base64"
    });

    tree.push({
      path: file.relPath,
      mode: "100644",
      type: "blob",
      sha: createdBlob.sha
    });

    if ((index + 1) % 25 === 0 || index + 1 === changedFiles.length) {
      console.log(`Prepared changed blobs ${index + 1}/${changedFiles.length}`);
    }
  }

  for (const removedPath of removedFiles) {
    tree.push({
      path: removedPath,
      mode: "100644",
      type: "blob",
      sha: null
    });
  }

  console.log(`Creating Git tree with ${changedFiles.length} changed files and ${removedFiles.length} removed files out of ${files.length} deployable files.`);
  const createdTree = await github("POST", `/repos/${env.GITHUB_USER}/${env.GITHUB_REPO}/git/trees`, {
    tree,
    ...(baseTreeSha ? { base_tree: baseTreeSha } : {})
  });

  const createdCommit = await github("POST", `/repos/${env.GITHUB_USER}/${env.GITHUB_REPO}/git/commits`, {
    message: `Deploy PromptArc ${new Date().toISOString()}`,
    tree: createdTree.sha,
    parents: baseCommitSha ? [baseCommitSha] : []
  });

  const refBody = {
    sha: createdCommit.sha,
    force: false
  };

  if (baseCommitSha) {
    await github("PATCH", `/repos/${env.GITHUB_USER}/${env.GITHUB_REPO}/git/refs/heads/${encodeURIComponent(branch)}`, refBody);
  } else {
    await github("POST", `/repos/${env.GITHUB_USER}/${env.GITHUB_REPO}/git/refs`, {
      ref: `refs/heads/${branch}`,
      sha: createdCommit.sha
    });
  }

  console.log(`Committed ${changedFiles.length} changed files and ${removedFiles.length} removals to ${branch}: ${createdCommit.sha}`);
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
  await upsertRecord(zoneId, { type: "CNAME", name: env.DOMAIN, content: `${env.GITHUB_USER}.github.io`, proxied: true, ttl: 1 });
  for (const ip of ["185.199.108.153", "185.199.109.153", "185.199.110.153", "185.199.111.153"]) {
    await upsertRecord(zoneId, { type: "A", name: env.ROOT_DOMAIN, content: ip, proxied: true, ttl: 1 });
  }
  console.log("Cloudflare DNS configured with proxy enabled.");
}

await ensureRepo();
console.log(
  `Deploy transports: ${requestTransports
    .map((transport) => (transport.type === "direct" ? transport.label : `${transport.label} ${transport.url}`))
    .join(" -> ")}`
);
await uploadFiles();
await ensurePages();
await configureDns();
console.log(`Deployment complete: https://${env.DOMAIN}`);
