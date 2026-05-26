import fs from "node:fs/promises";
import path from "node:path";

const input = process.argv[2];
const outDir = process.argv[3] || "content-pipeline/generated/regenerated-50";
const defaultBaseUrl = "https://www.taikuaila.cn/";
const baseUrl = (process.env.OPENAI_BASE_URL || defaultBaseUrl).replace(/\/+$/, "");
const envPath = path.join(process.cwd(), ".env");

function loadDotEnv(filePath) {
  try {
    const text = requireFs.readFileSync(filePath, "utf8");
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    }
  } catch {
    // .env is optional; explicit environment variables still work.
  }
}

const requireFs = await import("node:fs");
loadDotEnv(envPath);

const apiKey = process.env.OPENAI_API_KEY;

if (!input) {
  console.error("Usage: node scripts/generate-images-direct.mjs <jobs.jsonl> <out-dir>");
  process.exit(1);
}
if (!apiKey) {
  console.error("OPENAI_API_KEY is required. OPENAI_BASE_URL defaults to https://www.taikuaila.cn/.");
  process.exit(1);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readJobs(filePath) {
  const text = await fs.readFile(filePath, "utf8");
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

async function generate(job, index, total) {
  const outName = job.out || `image-${index}.png`;
  const outPath = path.join(outDir, outName);
  try {
    await fs.access(outPath);
    console.log(`[${index}/${total}] skip existing ${outName}`);
    return { ok: true, skipped: true, outPath };
  } catch {
    // Continue.
  }

  const payload = {
    model: job.model || "gpt-image-2",
    prompt: job.prompt,
    size: job.size || "1024x1536",
    quality: job.quality || "low",
    output_format: job.output_format || "png",
    n: job.n || 1
  };

  console.log(`[${index}/${total}] start ${outName}`);
  const response = await fetch(`${baseUrl}/v1/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${raw.slice(0, 500)}`);
  }

  const data = JSON.parse(raw);
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error(`Missing data[0].b64_json: ${raw.slice(0, 500)}`);
  }

  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(outPath, Buffer.from(b64, "base64"));
  console.log(`[${index}/${total}] wrote ${outPath}`);
  return { ok: true, outPath };
}

const jobs = await readJobs(input);
const failures = [];

for (let i = 0; i < jobs.length; i += 1) {
  const job = jobs[i];
  let done = false;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      await generate(job, i + 1, jobs.length);
      done = true;
      break;
    } catch (error) {
      console.error(`[${i + 1}/${jobs.length}] attempt ${attempt} failed: ${error.message}`);
      if (attempt < 2) {
        await sleep(5000);
      }
    }
  }
  if (!done) {
    failures.push(job);
  }
  await sleep(1500);
}

if (failures.length) {
  const failedPath = path.join("content-pipeline", "direct-generation-failures.json");
  await fs.writeFile(failedPath, JSON.stringify(failures, null, 2) + "\n", "utf8");
  console.error(`Failed jobs: ${failures.length}. Wrote ${failedPath}`);
  process.exitCode = 1;
} else {
  console.log("All jobs completed.");
}
