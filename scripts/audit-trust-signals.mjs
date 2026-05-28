import { readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.argv[2] || process.cwd());
const requiredEmail = "support@promptarc.cc";
const requiredFiles = [
  "config.js",
  "contact/index.html",
  "about/index.html",
  "privacy/index.html",
  "terms/index.html",
  "zh/contact/index.html",
  "zh/about/index.html",
  "zh/privacy/index.html",
  "zh/terms/index.html"
];
const bannedPhrases = [
  "placeholder",
  "Replace the placeholder",
  "replace this copy",
  "before launch",
  "once launch settings are finalized",
  "Email contact will be added",
  "later if you want",
  "后续再",
  "上线前",
  "占位"
];

const failures = [];

async function readRelative(relativePath) {
  try {
    return await readFile(path.join(root, relativePath), "utf8");
  } catch (error) {
    failures.push(`${relativePath}: missing or unreadable (${error.message})`);
    return "";
  }
}

for (const file of requiredFiles) {
  const text = await readRelative(file);
  if (!text) continue;
  if (!text.includes(requiredEmail)) {
    failures.push(`${file}: missing ${requiredEmail}`);
  }
  for (const phrase of bannedPhrases) {
    if (text.toLowerCase().includes(phrase.toLowerCase())) {
      failures.push(`${file}: contains unfinished trust phrase "${phrase}"`);
    }
  }
}

const config = await readRelative("config.js");
if (!/contactEmail:\s*"support@promptarc\.cc"/.test(config)) {
  failures.push("config.js: contactEmail must be support@promptarc.cc");
}

if (failures.length) {
  console.error(`Found ${failures.length} trust signal issue(s).`);
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Trust signal audit passed for ${requiredFiles.length} files.`);
