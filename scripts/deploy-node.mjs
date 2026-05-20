import fs from "node:fs";
import net from "node:net";
import tls from "node:tls";
import { spawnSync } from "node:child_process";

const repoRoot = new URL("../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
process.chdir(repoRoot);

function loadEnv(path = ".env") {
  if (!fs.existsSync(path)) return {};
  const env = {};
  for (const raw of fs.readFileSync(path, "utf8").split(/\r?\n/)) {
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

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
    env: { ...process.env, ...options.env },
    shell: false
  });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed`);
}

function requestViaProxy({ host, path, method = "GET", headers = {}, body }) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(Number(proxyUrl.port), proxyUrl.hostname);
    socket.setTimeout(30000);
    socket.on("connect", () => {
      socket.write(`CONNECT ${host}:443 HTTP/1.1\r\nHost: ${host}:443\r\nProxy-Connection: keep-alive\r\n\r\n`);
    });

    let proxyHead = "";
    function onProxyData(chunk) {
      proxyHead += chunk.toString("latin1");
      const idx = proxyHead.indexOf("\r\n\r\n");
      if (idx === -1) return;
      socket.removeListener("data", onProxyData);
      const status = proxyHead.slice(0, idx);
      if (!status.includes("200")) return reject(new Error(status.split("\r\n")[0]));

      const secure = tls.connect({ socket, servername: host }, () => {
        const payload = body ? JSON.stringify(body) : "";
        const mergedHeaders = {
          Host: host,
          "User-Agent": "PromptArcDeploy",
          Accept: "application/json",
          Connection: "close",
          ...headers
        };
        if (payload) {
          mergedHeaders["Content-Type"] = "application/json";
          mergedHeaders["Content-Length"] = Buffer.byteLength(payload);
        }
        const headerText = Object.entries(mergedHeaders).map(([key, value]) => `${key}: ${value}`).join("\r\n");
        secure.write(`${method} ${path} HTTP/1.1\r\n${headerText}\r\n\r\n${payload}`);
      });

      let response = Buffer.alloc(0);
      secure.on("data", (chunk) => response = Buffer.concat([response, chunk]));
      secure.on("end", () => {
        const raw = response.toString();
        const split = raw.indexOf("\r\n\r\n");
        const head = raw.slice(0, split);
        const text = raw.slice(split + 4);
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

async function github(method, path, body) {
  const res = await requestViaProxy({
    host: "api.github.com",
    path,
    method,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    },
    body
  });
  if (res.statusCode >= 400) {
    const message = res.json?.message || res.text.slice(0, 200);
    const err = new Error(`GitHub ${method} ${path} failed: ${res.statusCode} ${message}`);
    err.statusCode = res.statusCode;
    throw err;
  }
  return res.json;
}

async function cloudflare(method, path, body) {
  const res = await requestViaProxy({
    host: "api.cloudflare.com",
    path,
    method,
    headers: {
      Authorization: `Bearer ${env.CLOUDFLARE_TOKEN}`,
      Accept: "application/json"
    },
    body
  });
  if (res.statusCode >= 400 || res.json?.success === false) {
    const message = res.json?.errors?.[0]?.message || res.text.slice(0, 200);
    throw new Error(`Cloudflare ${method} ${path} failed: ${res.statusCode} ${message}`);
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

async function ensurePages() {
  const path = `/repos/${env.GITHUB_USER}/${env.GITHUB_REPO}/pages`;
  try {
    await github("GET", path);
    await github("PUT", path, { source: { branch: env.GITHUB_BRANCH || "main", path: "/" } });
    console.log("GitHub Pages updated.");
  } catch (error) {
    if (error.statusCode !== 404) throw error;
    await github("POST", path, { source: { branch: env.GITHUB_BRANCH || "main", path: "/" } });
    console.log("GitHub Pages enabled.");
  }
}

async function getZoneId() {
  if (env.CLOUDFLARE_ZONE_ID) return env.CLOUDFLARE_ZONE_ID;
  const res = await cloudflare("GET", `/client/v4/zones?name=${encodeURIComponent(env.ROOT_DOMAIN)}`);
  const zone = res.result?.[0];
  if (!zone) throw new Error(`Cloudflare zone not found for ${env.ROOT_DOMAIN}`);
  console.log("Cloudflare zone resolved.");
  return zone.id;
}

async function upsertRecord(zoneId, record) {
  const query = new URLSearchParams({ type: record.type, name: record.name, content: record.content });
  const existing = await cloudflare("GET", `/client/v4/zones/${zoneId}/dns_records?${query}`);
  const id = existing.result?.[0]?.id;
  if (id) {
    await cloudflare("PUT", `/client/v4/zones/${zoneId}/dns_records/${id}`, record);
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

fs.writeFileSync("CNAME", `${env.DOMAIN}\n`, "utf8");
await ensureRepo();

if (!fs.existsSync(".git")) run("git", ["init"]);
run("git", ["-c", "http.sslBackend=openssl", "add", "."]);
run("git", ["-c", "http.sslBackend=openssl", "commit", "-m", "Initial PromptArc launch"], {
  env: {
    GIT_AUTHOR_NAME: "PromptArc Deploy",
    GIT_AUTHOR_EMAIL: "deploy@promptarc.cc",
    GIT_COMMITTER_NAME: "PromptArc Deploy",
    GIT_COMMITTER_EMAIL: "deploy@promptarc.cc"
  }
});
run("git", ["-c", "http.sslBackend=openssl", "-c", `http.https://github.com/.extraheader=AUTHORIZATION: bearer ${env.GITHUB_TOKEN}`, "push", "-u", `https://github.com/${env.GITHUB_USER}/${env.GITHUB_REPO}.git`, env.GITHUB_BRANCH || "main"]);

await ensurePages();
await configureDns();

console.log(`Deployment complete: https://${env.DOMAIN}`);
