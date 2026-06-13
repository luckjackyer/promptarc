import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourcePath = path.join(root, "content-pipeline", "batch-01-candidates.json");
const outputPath = path.join(root, "content-pipeline", "priority-batch-02.json");

const priorities = [
  "candidate-ceramic-studio-photo",
  "candidate-flower-market-photo",
  "candidate-soft-window-portrait",
  "candidate-cafe-founder-portrait",
  "candidate-garden-sprite-character",
  "candidate-workflow-bot-character",
  "candidate-paper-cut-typography",
  "candidate-neon-sign-typography",
  "candidate-material-compare-test",
  "candidate-lighting-compare-test",
  "candidate-reading-app-ui",
  "candidate-gallery-opening-poster"
];

const items = JSON.parse(fs.readFileSync(sourcePath, "utf8").replace(/^\uFEFF/, ""));
const prioritySet = new Set(priorities);
const batch = items
  .filter((item) => prioritySet.has(item.id))
  .sort((a, b) => priorities.indexOf(a.id) - priorities.indexOf(b.id))
  .map((item, index) => ({
    ...item,
    queue: "priority-batch-02",
    priority: index + 1
  }));

fs.writeFileSync(outputPath, JSON.stringify(batch, null, 2) + "\n", "utf8");
console.log(`Prepared ${batch.length} items at ${path.relative(root, outputPath)}`);
