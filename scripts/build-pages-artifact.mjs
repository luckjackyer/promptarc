import { cp, mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "_site");

const publicFiles = [
  ".nojekyll",
  "404.html",
  "CNAME",
  "app.js",
  "config.js",
  "image-sitemap.xml",
  "index.html",
  "llms.txt",
  "robots.txt",
  "site.webmanifest",
  "sitemap.xml",
  "style.css"
];

const publicDirs = [
  "account",
  "about",
  "assets",
  "contact",
  "gallery",
  "generate",
  "image-prompt-pack",
  "pricing",
  "privacy",
  "terms",
  "zh"
];

const forbiddenEntries = [
  ".env",
  ".env.example",
  ".git",
  ".github",
  "_deploy",
  ".qa-screenshots",
  "content-pipeline",
  "deploy-logs",
  "docs",
  "scripts",
  "tests",
  "workers"
];

async function mustExist(relativePath) {
  const source = path.join(root, relativePath);
  await stat(source);
  return source;
}

async function copyFileEntry(relativePath) {
  const source = await mustExist(relativePath);
  const target = path.join(outDir, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await cp(source, target, { recursive: false });
}

async function copyDirEntry(relativePath) {
  const source = await mustExist(relativePath);
  const target = path.join(outDir, relativePath);
  await cp(source, target, { recursive: true });
}

function assertSafeOutputDir() {
  const resolved = path.resolve(outDir);
  if (path.dirname(resolved) !== root || path.basename(resolved) !== "_site") {
    throw new Error(`Refusing to clean unexpected output directory: ${resolved}`);
  }
}

async function assertForbiddenEntriesAbsent() {
  const leaked = [];
  for (const entry of forbiddenEntries) {
    try {
      await stat(path.join(outDir, entry));
      leaked.push(entry);
    } catch (error) {
      if (error && error.code !== "ENOENT") {
        throw error;
      }
    }
  }
  if (leaked.length) {
    throw new Error(`Forbidden entries found in _site: ${leaked.join(", ")}`);
  }
}

assertSafeOutputDir();
await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

for (const file of publicFiles) {
  await copyFileEntry(file);
}

for (const dir of publicDirs) {
  await copyDirEntry(dir);
}

await assertForbiddenEntriesAbsent();
console.log(`Built clean GitHub Pages artifact at ${path.relative(root, outDir)}`);
