import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const candidatesPath = path.join(root, "content-pipeline", "prompt-candidates.json");
const outputPath = path.join(root, "content-pipeline", "batch-01-candidates.json");

const raw = JSON.parse(fs.readFileSync(candidatesPath, "utf8").replace(/^\uFEFF/, ""));
const candidates = Array.isArray(raw) ? raw : raw.candidates || [];

const aspectRatioByCategory = {
  product: "4:5",
  poster: "4:5",
  ui: "9:16",
  infographic: "4:5",
  typography: "4:5",
  photography: "4:5",
  portrait: "4:5",
  character: "1:1",
  test: "4:5"
};

const negativePromptByCategory = {
  product: "no logo, no watermark, no readable fake label, no duplicate products, no clutter",
  poster: "no logo, no readable fake paragraph text, no watermark, no celebrity likeness, no clutter",
  ui: "no logo, no gibberish UI text, no broken layout, no impossible interaction pattern, no watermark",
  infographic: "no tiny unreadable text, no logo, no watermark, no dense clutter, no misleading claims",
  typography: "no logo imitation, no unreadable letterforms, no watermark, no clutter, no fake brand names",
  photography: "no logo, no celebrity likeness, no surreal artifacts, no duplicate people, no watermark",
  portrait: "no celebrity likeness, no logo, no anatomy errors, no over-smoothing, no watermark",
  character: "no copyrighted character, no logo, no extra limbs, no watermark, no broken anatomy",
  test: "no logo, no watermark, no extra props, no uncontrolled variable changes, no clutter"
};

const seoIntentByCategory = {
  product: "product prompt examples",
  poster: "poster prompt examples",
  ui: "UI prompt examples",
  infographic: "infographic prompt examples",
  typography: "typography prompt examples",
  photography: "photo prompt examples",
  portrait: "portrait prompt examples",
  character: "character prompt examples",
  test: "style test prompt examples"
};

const batch = candidates.map((item, index) => ({
  id: item.id,
  title: item.title,
  category: item.category,
  tags: Array.isArray(item.tags) ? item.tags : [],
  prompt: item.prompt,
  negativePrompt: item.negativePrompt || negativePromptByCategory[item.category] || "no logo, no watermark, no clutter",
  aspectRatio: item.aspectRatio || aspectRatioByCategory[item.category] || "4:5",
  seoIntent: item.seoIntent || seoIntentByCategory[item.category] || "AI image prompt examples",
  generation: item.generation || { candidateCount: 4 },
  status: item.status || "needs_generation",
  priority: item.priority || index + 1
}));

fs.writeFileSync(outputPath, JSON.stringify(batch, null, 2) + "\n", "utf8");
console.log(`Prepared ${batch.length} normalized candidates at ${path.relative(root, outputPath)}`);
