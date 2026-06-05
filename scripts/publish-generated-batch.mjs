import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const queueArg = process.argv[2];
const generatedDirArg = process.argv[3];

if (!queueArg || !generatedDirArg) {
  console.error("Usage: node scripts/publish-generated-batch.mjs <queue.json> <generated-dir>");
  process.exit(1);
}

const queuePath = path.resolve(root, queueArg);
const generatedDir = path.resolve(root, generatedDirArg);
const galleryDataPath = path.join(root, "gallery", "gallery-data.js");
const assetDir = path.join(root, "assets", "gallery");

function loadGalleryItems() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(galleryDataPath, "utf8"), context, { filename: galleryDataPath });
  return context.window.PROMPTARC_GALLERY || [];
}

function jsString(value) {
  return JSON.stringify(value);
}

function findGeneratedAsset(item) {
  const candidates = [
    path.join(generatedDir, `${item.id}.png`),
    path.join(generatedDir, `${item.id}.jpg`),
    path.join(generatedDir, `${item.id}.jpeg`),
    path.join(generatedDir, `${item.id}.webp`)
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

function toEntry(item) {
  const source = findGeneratedAsset(item);
  if (!source) {
    return null;
  }

  const ext = path.extname(source).toLowerCase();
  const assetName = `${item.id}${ext}`;
  fs.copyFileSync(source, path.join(assetDir, assetName));

  return {
    id: item.id,
    title: item.title,
    category: item.category,
    tags: item.tags,
    imageUrl: `/assets/gallery/${assetName}`,
    sourceLabel: "PromptArc generated",
    prompt: item.prompt
  };
}

const queue = JSON.parse(fs.readFileSync(queuePath, "utf8").replace(/^\uFEFF/, ""));
const newEntries = queue.map(toEntry).filter(Boolean);

if (!newEntries.length) {
  console.log("No generated files found to publish.");
  process.exit(0);
}

const existing = loadGalleryItems();
const keepExisting = existing.filter((item) => !newEntries.some((entry) => entry.id === item.id));
const finalItems = [...newEntries, ...keepExisting];

const body = finalItems
  .map((item) => {
    return [
      "  {",
      `    id: ${jsString(item.id)},`,
      `    title: ${jsString(item.title)},`,
      `    category: ${jsString(item.category)},`,
      `    tags: ${jsString(item.tags)},`,
      `    imageUrl: ${jsString(item.imageUrl)},`,
      `    sourceLabel: ${jsString(item.sourceLabel)},`,
      `    prompt: ${jsString(item.prompt)}`,
      "  }"
    ].join("\n");
  })
  .join(",\n");

fs.writeFileSync(galleryDataPath, `window.PROMPTARC_GALLERY = [\n${body}\n];\n`, "utf8");
console.log(`Published ${newEntries.length} items from ${path.relative(root, queuePath)}. Gallery now has ${finalItems.length} items.`);
