import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const envPath = path.join(repoRoot, ".env");
const schemaPath = path.join(repoRoot, "workers", "d1-schema.sql");
const defaultAccountId = "e7fe43204a8f7ae5dee45d4a325717fc";

function loadEnv(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) {
    return env;
  }
  for (const raw of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
  return env;
}

function upsertEnvValue(filePath, key, value) {
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  const lines = existing.split(/\r?\n/);
  let updated = false;
  const next = lines.map((line) => {
    if (line.match(new RegExp(`^${key}=`))) {
      updated = true;
      return `${key}=${value}`;
    }
    return line;
  });
  if (!updated) {
    if (next.length && next[next.length - 1].trim() !== "") {
      next.push("");
    }
    next.push(`${key}=${value}`);
  }
  fs.writeFileSync(filePath, next.join("\n"), "utf8");
}

function splitSql(sql) {
  return sql
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean)
    .map((statement) => `${statement};`);
}

async function cf(env, method, pathname, body) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${pathname}`, {
    method,
    headers: {
      authorization: `Bearer ${env.CLOUDFLARE_TOKEN}`,
      accept: "application/json",
      "content-type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {}
  if (!response.ok || json?.success === false) {
    throw new Error(`Cloudflare ${method} ${pathname} failed: ${response.status} ${json?.errors?.[0]?.message || text.slice(0, 220)}`);
  }
  return json;
}

async function findDatabase(env, accountId, name) {
  const json = await cf(env, "GET", `/accounts/${accountId}/d1/database`);
  return (json.result || []).find((db) => db.name === name) || null;
}

async function ensureDatabase(env, accountId, name) {
  const existing = await findDatabase(env, accountId, name);
  if (existing) {
    return existing;
  }
  const created = await cf(env, "POST", `/accounts/${accountId}/d1/database`, { name });
  return created.result;
}

async function executeSchema(env, accountId, databaseId) {
  const statements = splitSql(fs.readFileSync(schemaPath, "utf8"));
  for (const sql of statements) {
    await cf(env, "POST", `/accounts/${accountId}/d1/database/${databaseId}/query`, { sql });
  }
  return statements.length;
}

const env = { ...process.env, ...loadEnv(envPath) };
if (!env.CLOUDFLARE_TOKEN) {
  throw new Error("Missing CLOUDFLARE_TOKEN in .env");
}

const accountId = env.CLOUDFLARE_ACCOUNT_ID || defaultAccountId;
const databaseName = env.D1_DATABASE_NAME || "promptarc-generation-history";
const database = env.D1_DATABASE_ID
  ? { uuid: env.D1_DATABASE_ID, id: env.D1_DATABASE_ID, name: databaseName }
  : await ensureDatabase(env, accountId, databaseName);
const databaseId = database.uuid || database.id;
if (!databaseId) {
  throw new Error("Cloudflare did not return a D1 database id.");
}

const statementCount = await executeSchema(env, accountId, databaseId);
upsertEnvValue(envPath, "D1_DATABASE_NAME", databaseName);
upsertEnvValue(envPath, "D1_DATABASE_ID", databaseId);

console.log(`D1 database ready: ${databaseName}`);
console.log(`Schema statements applied: ${statementCount}`);
console.log("D1_DATABASE_ID saved to .env");
