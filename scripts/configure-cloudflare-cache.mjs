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
const required = ["CLOUDFLARE_TOKEN", "DOMAIN", "ROOT_DOMAIN", "GITHUB_USER"];
const missing = required.filter((key) => !env[key]);
if (missing.length) throw new Error(`Missing required env vars: ${missing.join(", ")}`);

async function cloudflare(method, pathname, body) {
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
    throw new Error(`Cloudflare ${method} ${pathname} failed: ${res.status} ${json?.errors?.[0]?.message || text.slice(0, 240)}`);
  }
  return json;
}

async function updateDnsRecord(record) {
  const params = new URLSearchParams({ type: record.type, name: record.name });
  const existing = await cloudflare("GET", `/zones/${zoneId}/dns_records?${params}`);
  const match = existing.result?.find((item) => item.content === record.content) || existing.result?.[0];
  if (match) {
    await cloudflare("PUT", `/zones/${zoneId}/dns_records/${match.id}`, {
      ...match,
      ...record,
      proxied: true,
      ttl: 1
    });
  } else {
    await cloudflare("POST", `/zones/${zoneId}/dns_records`, {
      ...record,
      proxied: true,
      ttl: 1
    });
  }
}

async function patchSetting(name, value) {
  try {
    await cloudflare("PATCH", `/zones/${zoneId}/settings/${name}`, { value });
    console.log(`Cloudflare setting ${name}=${value}`);
  } catch (error) {
    console.log(`Skipped Cloudflare setting ${name}: ${error.message}`);
  }
}

async function getZoneId() {
  if (env.CLOUDFLARE_ZONE_ID) return env.CLOUDFLARE_ZONE_ID;
  const zones = await cloudflare("GET", `/zones?name=${encodeURIComponent(env.ROOT_DOMAIN)}`);
  const zone = zones.result?.[0];
  if (!zone) throw new Error(`Cloudflare zone not found for ${env.ROOT_DOMAIN}`);
  return zone.id;
}

async function putRuleset(phase, ruleset) {
  try {
    const list = await cloudflare("GET", `/zones/${zoneId}/rulesets`);
    const existing = list.result?.find((item) => item.phase === phase && item.name === ruleset.name);
    if (existing) {
      await cloudflare("PUT", `/zones/${zoneId}/rulesets/${existing.id}`, ruleset);
    } else {
      await cloudflare("POST", `/zones/${zoneId}/rulesets`, ruleset);
    }
    console.log(`Cloudflare ruleset configured: ${ruleset.name}`);
  } catch (error) {
    console.log(`Skipped Cloudflare ruleset ${ruleset.name}: ${error.message}`);
  }
}

const zoneId = await getZoneId();

await updateDnsRecord({ type: "CNAME", name: env.DOMAIN, content: `${env.GITHUB_USER}.github.io` });
for (const ip of ["185.199.108.153", "185.199.109.153", "185.199.110.153", "185.199.111.153"]) {
  await updateDnsRecord({ type: "A", name: env.ROOT_DOMAIN, content: ip });
}
console.log("Cloudflare DNS proxy enabled.");

await patchSetting("brotli", "on");
await patchSetting("always_use_https", "on");
await patchSetting("automatic_https_rewrites", "on");
await patchSetting("minify", { css: "on", html: "on", js: "on" });

await putRuleset("http_request_cache_settings", {
  name: "PromptArc static asset cache",
  description: "Cache static PromptArc assets at Cloudflare edge.",
  kind: "zone",
  phase: "http_request_cache_settings",
  rules: [
    {
      action: "set_cache_settings",
      expression: `(http.host eq "${env.DOMAIN}" and starts_with(http.request.uri.path, "/assets/")) or (http.host eq "${env.DOMAIN}" and http.request.uri.path in {"/style.css" "/app.js" "/config.js" "/gallery/gallery-data.js"})`,
      description: "Cache images, CSS, JS and gallery data",
      enabled: true,
      action_parameters: {
        cache: true,
        edge_ttl: {
          mode: "override_origin",
          default: 2592000
        },
        browser_ttl: {
          mode: "override_origin",
          default: 86400
        }
      }
    }
  ]
});

await putRuleset("http_request_cache_settings", {
  name: "PromptArc HTML short cache",
  description: "Short edge cache for static HTML pages.",
  kind: "zone",
  phase: "http_request_cache_settings",
  rules: [
    {
      action: "set_cache_settings",
      expression: `http.host eq "${env.DOMAIN}" and http.request.uri.path ne "/robots.txt" and not starts_with(http.request.uri.path, "/assets/") and not ends_with(http.request.uri.path, ".css") and not ends_with(http.request.uri.path, ".js")`,
      description: "Short cache HTML",
      enabled: true,
      action_parameters: {
        cache: true,
        edge_ttl: {
          mode: "override_origin",
          default: 300
        },
        browser_ttl: {
          mode: "override_origin",
          default: 60
        }
      }
    }
  ]
});

console.log("Cloudflare cache rules configured.");
