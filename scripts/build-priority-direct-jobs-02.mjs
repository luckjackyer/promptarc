import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourcePath = path.join(root, "content-pipeline", "priority-batch-02.json");
const outputPath = path.join(root, "content-pipeline", "priority-batch-02.jsonl");

const items = JSON.parse(fs.readFileSync(sourcePath, "utf8").replace(/^\uFEFF/, ""));

const sizeMap = {
  "4:5": "1024x1536",
  "9:16": "1024x1536",
  "1:1": "1024x1024",
  "3:2": "1536x1024"
};

const lines = items.map((item) =>
  JSON.stringify({
    model: "gpt-image-2",
    prompt: [
      item.prompt,
      `Final format: ${item.aspectRatio} composition, strong thumbnail readability, clean PromptArc gallery crop.`,
      `Negative prompt: ${item.negativePrompt}.`
    ].join(" "),
    size: sizeMap[item.aspectRatio] || "1024x1536",
    quality: "low",
    output_format: "png",
    out: `${item.id}.png`
  })
);

fs.writeFileSync(outputPath, lines.join("\n") + "\n", "utf8");
console.log(`Prepared ${lines.length} direct generation jobs at ${path.relative(root, outputPath)}`);
