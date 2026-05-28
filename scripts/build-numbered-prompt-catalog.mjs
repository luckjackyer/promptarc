import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const galleryPath = path.join(root, "gallery", "gallery-data.js");
const outputPath = path.join(root, "assets", "promptarc-numbered-prompt-catalog.txt");

const code = await readFile(galleryPath, "utf8");
const context = { window: {} };
vm.runInNewContext(code, context);
const items = context.window.PROMPTARC_GALLERY || [];

const categoryLabels = {
  product: "Product Ads",
  poster: "Posters",
  ui: "UI Mockups",
  infographic: "Infographics",
  typography: "Typography",
  photography: "Photography",
  portrait: "Portraits",
  character: "Characters",
  test: "Style Tests",
  architecture: "Architecture",
  experimental: "Experimental"
};

const categoryOrder = [
  "product",
  "poster",
  "ui",
  "infographic",
  "typography",
  "photography",
  "portrait",
  "character",
  "test",
  "architecture",
  "experimental"
];

function slugNumber(value) {
  return String(value).padStart(3, "0");
}

function formatEntry(item, index) {
  const code = `${item.category.toUpperCase()}-${slugNumber(index + 1)}`;
  const tags = Array.isArray(item.tags) && item.tags.length ? item.tags.join(", ") : "none";
  const url = `https://www.promptarc.cc/gallery/${item.category}/${item.id}/`;
  return [
    `### ${code} - ${item.title}`,
    `Category: ${categoryLabels[item.category] || item.category}`,
    `Tags: ${tags}`,
    `Gallery URL: ${url}`,
    "",
    "Prompt:",
    item.prompt,
    ""
  ].join("\n");
}

const lines = [
  "PromptArc Numbered Prompt Catalog",
  "500 categorized AI image prompts with stable IDs, tags, gallery URLs, and copy-ready prompt text.",
  "",
  "Use this catalog as a searchable swipe file for product ads, posters, UI mockups, infographics, typography, photography, portraits, characters, style tests, architecture, and experimental image prompts.",
  "",
  "Numbering rule: CATEGORY-001 starts from the first prompt in each category. Keep the code when saving favorites or requesting variants.",
  "",
  "Category index:"
];

for (const category of categoryOrder) {
  const count = items.filter((item) => item.category === category).length;
  lines.push(`- ${categoryLabels[category]}: ${count} prompts`);
}

for (const category of categoryOrder) {
  const categoryItems = items.filter((item) => item.category === category);
  lines.push("", `## ${categoryLabels[category]} (${categoryItems.length})`, "");
  categoryItems.forEach((item, index) => lines.push(formatEntry(item, index)));
}

await writeFile(outputPath, lines.join("\n"), "utf8");
console.log(`Wrote ${items.length} prompts to ${path.relative(root, outputPath)}`);
