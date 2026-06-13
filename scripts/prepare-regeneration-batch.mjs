import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const queuePath = path.join(root, "content-pipeline", "regeneration-active-50.json");
const outPath = path.join(root, "content-pipeline", "regeneration-batch.jsonl");
const queue = JSON.parse(fs.readFileSync(queuePath, "utf8").replace(/^\uFEFF/, ""));

function useCase(category) {
  return {
    product: "product-mockup",
    infographic: "infographic-diagram",
    poster: "ads-marketing",
    ui: "ui-mockup",
    photography: "photorealistic-natural",
    portrait: "photorealistic-natural",
    typography: "stylized-concept",
    character: "illustration-story",
    test: "stylized-concept"
  }[category] || "stylized-concept";
}

function size(aspectRatio) {
  return {
    "4:5": "1024x1536",
    "9:16": "1024x1536",
    "1:1": "1024x1024",
    "3:2": "1536x1024"
  }[aspectRatio] || "1024x1536";
}

const lines = queue.map((item) => {
  const prompt = [
    item.prompt,
    `Final format: ${item.aspectRatio} composition, card-friendly crop, strong thumbnail readability.`,
    "Make the image original and unbranded.",
    "Avoid watermarks, copyrighted characters, celebrities, recognizable logos, and copied brand styles."
  ].join(" ");
  return JSON.stringify({
    prompt,
    use_case: useCase(item.category),
    composition: `${item.aspectRatio} final image; clean subject; enough safe crop margin for PromptArc gallery cards`,
    constraints: "original unbranded image; no watermark; no copyrighted characters; no celebrity likeness; no recognizable logos",
    size: size(item.aspectRatio),
    quality: "medium",
    output_format: "png",
    out: `${item.id}.png`
  });
});

fs.writeFileSync(outPath, lines.join("\n") + "\n", "utf8");
console.log(`Prepared ${lines.length} generation jobs at ${path.relative(root, outPath)}`);
