import { readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.argv[2] || process.cwd());
const catalogPath = path.join(root, "assets", "promptarc-numbered-prompt-catalog.txt");
const productPagePath = path.join(root, "image-prompt-pack", "index.html");
const zhProductPagePath = path.join(root, "zh", "image-prompt-pack", "index.html");
const failures = [];

const catalog = await readFile(catalogPath, "utf8").catch((error) => {
  failures.push(`catalog missing: ${error.message}`);
  return "";
});
const entries = catalog.match(/^### [A-Z]+-\d{3} - /gm) || [];
if (entries.length !== 500) {
  failures.push(`catalog must contain 500 numbered prompts, found ${entries.length}`);
}
for (const phrase of ["PromptArc Numbered Prompt Catalog", "Category index:", "Product Ads", "Posters", "UI Mockups", "Style Tests"]) {
  if (!catalog.includes(phrase)) failures.push(`catalog missing "${phrase}"`);
}

const productPage = await readFile(productPagePath, "utf8");
for (const phrase of [
  "Numbered Prompt Catalog",
  "500 categorized AI image prompts",
  "/assets/promptarc-numbered-prompt-catalog.txt",
  "Download the catalog sample",
  "Join the catalog buyer list",
  "Why buy the catalog",
  "Commercial use cases",
  "Catalog first, credits next",
  "Who should buy this first?"
]) {
  if (!productPage.includes(phrase)) failures.push(`image-prompt-pack/index.html missing "${phrase}"`);
}
if (productPage.includes("Download directly")) {
  failures.push("image-prompt-pack/index.html should not expose a direct ungated sample CTA");
}

const zhProductPage = await readFile(zhProductPagePath, "utf8");
for (const phrase of [
  "编号提示词目录",
  "500 条分类 AI 图像提示词",
  "/assets/promptarc-numbered-prompt-catalog.txt",
  "下载目录样本",
  "加入目录购买意向名单",
  "为什么要买这个目录",
  "商业使用场景",
  "先买目录，再进积分",
  "什么人应该先买这个产品？"
]) {
  if (!zhProductPage.includes(phrase)) failures.push(`zh/image-prompt-pack/index.html missing "${phrase}"`);
}

if (failures.length) {
  console.error(`Found ${failures.length} numbered prompt product issue(s).`);
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Numbered prompt product audit passed.");
