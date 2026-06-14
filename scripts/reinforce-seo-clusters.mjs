import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.argv[2] || process.cwd());

const sections = [];

function upsertBlock(content, section) {
  const startMarker = `<!-- seo-cluster:${section.marker}:start -->`;
  const endMarker = `<!-- seo-cluster:${section.marker}:end -->`;
  const pattern = new RegExp(
    `\\n?\\s*${escapeRegExp(startMarker)}[\\s\\S]*?${escapeRegExp(endMarker)}\\n?`,
    "g"
  );
  const clean = content.replace(pattern, "\n");
  const injection = section.block.replace(/\n/g, "\r\n");

  const anchors = [section.anchor, ...(section.fallbackAnchors || [])];
  const anchor = anchors.find((candidate) => clean.includes(candidate));
  if (!anchor) {
    throw new Error(`${section.relativePath}: anchor not found`);
  }

  if (section.position === "after") {
    return clean.replace(anchor, `${anchor}${injection}`);
  }

  return clean.replace(anchor, `${injection}${anchor}`);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

for (const section of sections) {
  const filePath = path.join(root, section.relativePath);
  const source = await readFile(filePath, "utf8");
  const next = upsertBlock(source, section);
  if (next !== source) {
    await writeFile(filePath, next, "utf8");
  }
}

console.log("SEO cluster reinforcement is disabled for image-first launch pages.");
