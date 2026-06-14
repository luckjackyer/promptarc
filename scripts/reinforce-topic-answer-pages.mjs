import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.argv[2] || process.cwd());

const sections = [];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function upsertBlock(content, section) {
  const startMarker = `<!-- topic-answer:${section.marker}:start -->`;
  const endMarker = `<!-- topic-answer:${section.marker}:end -->`;
  const pattern = new RegExp(
    `\\n?\\s*${escapeRegExp(startMarker)}[\\s\\S]*?${escapeRegExp(endMarker)}\\n?`,
    "g"
  );
  const clean = content.replace(pattern, "\n");
  const injection = section.block.replace(/\n/g, "\r\n");

  if (!clean.includes(section.anchor)) {
    throw new Error(`${section.relativePath}: anchor not found`);
  }

  return clean.replace(section.anchor, `${injection}${section.anchor}`);
}

function removeLegacyBlocks(content) {
  return content
    .replace(/\n?\s*<!-- topic-answer:[\s\S]*?:start -->[\s\S]*?<!-- topic-answer:[\s\S]*?:end -->\n?/g, "\n")
    .replace(/\n?\s*<!-- seo-cluster:[\s\S]*?:start -->[\s\S]*?<!-- seo-cluster:[\s\S]*?:end -->\n?/g, "\n");
}

const legacyPages = [
  "gallery/index.html",
  "zh/gallery/index.html",
  "gallery/topics/product-hero/index.html",
  "gallery/topics/event/index.html",
  "gallery/topics/launch/index.html",
  "gallery/topics/coffee/index.html",
  "gallery/topics/dashboard/index.html",
  "gallery/topics/documentary/index.html",
  "zh/gallery/topics/product-hero/index.html",
  "zh/gallery/topics/event/index.html",
  "zh/gallery/topics/launch/index.html",
  "zh/gallery/topics/coffee/index.html",
  "zh/gallery/topics/dashboard/index.html",
  "zh/gallery/topics/documentary/index.html",
];

for (const relativePath of legacyPages) {
  const filePath = path.join(root, relativePath);
  const source = await readFile(filePath, "utf8");
  const next = removeLegacyBlocks(source);
  if (next !== source) {
    await writeFile(filePath, next, "utf8");
  }
}

for (const section of sections) {
  const filePath = path.join(root, section.relativePath);
  const source = await readFile(filePath, "utf8");
  const next = upsertBlock(source, section);
  if (next !== source) {
    await writeFile(filePath, next, "utf8");
  }
}

console.log("Removed legacy topic answer and SEO cluster blocks.");
