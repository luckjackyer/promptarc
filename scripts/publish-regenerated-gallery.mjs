import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const queuePath = path.join(root, "content-pipeline", "regeneration-active-50.json");
const galleryDataPath = path.join(root, "gallery", "gallery-data.js");
const generatedDir = path.join(root, "content-pipeline", "generated", "regenerated-50");
const assetDir = path.join(root, "assets", "gallery");
const queue = JSON.parse(fs.readFileSync(queuePath, "utf8").replace(/^\uFEFF/, ""));

function loadGalleryItems() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(galleryDataPath, "utf8"), context, { filename: galleryDataPath });
  return context.window.PROMPTARC_GALLERY || [];
}

function jsString(value) {
  return JSON.stringify(value);
}

function toEntry(item) {
  const source = path.join(generatedDir, `${item.id}.png`);
  if (!fs.existsSync(source)) {
    return null;
  }
  const assetName = `${item.id}.png`;
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

const newEntries = queue.map(toEntry).filter(Boolean);
if (!newEntries.length) {
  console.log("No generated files found to publish.");
  process.exit(0);
}

const existing = loadGalleryItems();
const keepExisting = existing.filter((item) => item.sourceLabel === "PromptArc generated" && !newEntries.some((entry) => entry.id === item.id));
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
console.log(`Published ${newEntries.length} regenerated items. Gallery now has ${finalItems.length} generated items.`);
