import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.argv[2] || process.cwd());
const ignoredDirs = new Set([".git", "_deploy", "deploy-logs", "node_modules", "gumroad-product", "assets"]);
const checkedExtensions = new Set([".html"]);
const failures = [];

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(fullPath));
      continue;
    }
    if (checkedExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files;
}

const config = await readFile(path.join(root, "config.js"), "utf8");
if (config.includes('gumroadUrl: "https://gumroad.com/"')) {
  failures.push("config.js: gumroadUrl must not point to the generic Gumroad homepage");
}
if (!config.includes('gumroadUrl: "/pricing/#credit-waitlist"')) {
  failures.push('config.js: gumroadUrl should point to "/pricing/#credit-waitlist" until a real paid checkout exists');
}
if (config.includes("https://gumroad.com/")) {
  failures.push("config.js: contains generic Gumroad URL");
}

for (const file of await listFiles(root)) {
  const relative = path.relative(root, file).replaceAll(path.sep, "/");
  const text = await readFile(file, "utf8");
  if (text.includes('href="#"') || text.includes('href=""')) {
    failures.push(`${relative}: contains empty CTA href`);
  }
  if (text.includes("https://gumroad.com/")) {
    failures.push(`${relative}: contains generic Gumroad URL`);
  }
  if (/<button[^>]+disabled/i.test(text)) {
    failures.push(`${relative}: contains a disabled commercial button`);
  }
}

if (failures.length) {
  console.error(`Found ${failures.length} commercial link issue(s).`);
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Commercial link audit passed.");
