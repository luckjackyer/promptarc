import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.argv[2] || process.cwd());
const checkedExtensions = new Set([".html", ".js", ".txt", ".md"]);
const ignoredDirs = new Set([".git", "node_modules", "_deploy", "deploy-logs"]);
const mojibakePatterns = [
  /�/,
  /涓枃/,
  /涓枃棣栭〉/,
  /鐢熸垚/,
  /鎻愮ず璇/,
  /瑙掕壊/,
  /棣栭〉/,
  /璺嚎/,
  /鈥[?/]/,
  /鈥�/,
  /銆/,
  /锛/,
  /绾/,
  /鍥/,
  /閭/,
  /瀛/,
  /鐢/,
  /鎴/,
  /鏂/
];
const allowedFiles = new Set([
  "scripts/audit-chinese-mojibake.mjs"
]);

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

const files = await listFiles(root);
const failures = [];

for (const file of files) {
  const relative = path.relative(root, file).replaceAll(path.sep, "/");
  if (allowedFiles.has(relative)) continue;
  const text = await readFile(file, "utf8");
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (mojibakePatterns.some((pattern) => pattern.test(line))) {
      failures.push(`${relative}:${index + 1}: ${line.trim().slice(0, 180)}`);
    }
  });
}

if (failures.length) {
  console.error(`Found ${failures.length} possible mojibake lines.`);
  console.error(failures.slice(0, 200).join("\n"));
  process.exit(1);
}

console.log(`No mojibake patterns found in ${files.length} text files.`);
