import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourcePath = path.join(root, "content-pipeline", "batch-01-candidates.json");
const outputPath = path.join(root, "content-pipeline", "priority-batch-01.json");

const priorities = [
  "candidate-rainy-bookstore-photo",
  "candidate-subway-commute-photo",
  "candidate-cofounder-desk-portrait",
  "candidate-neon-rain-portrait",
  "candidate-library-mascot-character",
  "candidate-metal-lettering-typography",
  "candidate-eco-cleaner-product",
  "candidate-perfume-glass-product",
  "candidate-finance-dashboard-ui",
  "candidate-food-festival-poster",
  "candidate-creator-funnel-infographic",
  "candidate-yoga-sequence-infographic"
];

const items = JSON.parse(fs.readFileSync(sourcePath, "utf8").replace(/^\uFEFF/, ""));
const prioritySet = new Set(priorities);
const batch = items
  .filter((item) => prioritySet.has(item.id))
  .sort((a, b) => priorities.indexOf(a.id) - priorities.indexOf(b.id))
  .map((item, index) => ({
    ...item,
    queue: "priority-batch-01",
    priority: index + 1
  }));

fs.writeFileSync(outputPath, JSON.stringify(batch, null, 2) + "\n", "utf8");
console.log(`Prepared ${batch.length} items at ${path.relative(root, outputPath)}`);
