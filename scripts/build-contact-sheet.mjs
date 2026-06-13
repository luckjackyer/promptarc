import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const inputDir = process.argv[2];
const outputPath = process.argv[3] || path.join(inputDir || ".", "contact-sheet.png");
const limit = Number.parseInt(process.argv[4] || "30", 10);

if (!inputDir) {
  console.error("Usage: node scripts/build-contact-sheet.mjs <image-dir> [output.png] [limit]");
  process.exit(1);
}

function loadSharp() {
  const require = createRequire(import.meta.url);
  const candidates = [
    "sharp",
    "C:/tmp/npm-cache/_npx/32026684e21afda6/node_modules/sharp/lib/index.js"
  ];
  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch {
      // Try the next known local install.
    }
  }
  throw new Error("Missing sharp. Install it with npm, or keep the cached npx sharp package under C:/tmp/npm-cache.");
}

const sharp = loadSharp();
const supported = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif"]);
const files = fs
  .readdirSync(inputDir)
  .filter((name) => supported.has(path.extname(name).toLowerCase()))
  .sort()
  .slice(0, limit);

if (!files.length) {
  console.error(`No supported images found in ${inputDir}`);
  process.exit(1);
}

const tileWidth = 240;
const tileHeight = 360;
const labelHeight = 46;
const columns = Math.min(5, files.length);
const rows = Math.ceil(files.length / columns);

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function labelSvg(name) {
  const label = escapeXml(name.replace(/\.[^.]+$/, "").slice(0, 30));
  return Buffer.from(`
    <svg width="${tileWidth}" height="${labelHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${tileWidth}" height="${labelHeight}" fill="rgba(0,0,0,0.64)"/>
      <text x="10" y="28" fill="#fff" font-size="13" font-family="Arial, sans-serif">${label}</text>
    </svg>
  `);
}

const composites = [];
for (const [index, file] of files.entries()) {
  const left = (index % columns) * tileWidth;
  const top = Math.floor(index / columns) * tileHeight;
  const image = await sharp(path.join(inputDir, file))
    .resize(tileWidth, tileHeight, { fit: "cover" })
    .composite([{ input: labelSvg(file), left: 0, top: tileHeight - labelHeight }])
    .png()
    .toBuffer();
  composites.push({ input: image, left, top });
}

await sharp({
  create: {
    width: columns * tileWidth,
    height: rows * tileHeight,
    channels: 4,
    background: "#101010"
  }
})
  .composite(composites)
  .png()
  .toFile(outputPath);

console.log(`Contact sheet written: ${outputPath} (${files.length} images)`);
