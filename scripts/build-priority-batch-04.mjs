import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourcePath = path.join(root, "content-pipeline", "batch-01-candidates.json");
const outputPath = path.join(root, "content-pipeline", "priority-batch-04.json");

const priorities = [
  "candidate-learning-roadmap-infographic",
  "candidate-kitchen-routine-infographic",
  "candidate-city-type-typography",
  "candidate-floral-type-typography",
  "candidate-ink-type-typography",
  "candidate-glass-type-typography",
  "candidate-clay-test-style",
  "candidate-grid-layout-test",
  "candidate-b2b-crm-ui",
  "candidate-sustainability-poster"
];

const items = JSON.parse(fs.readFileSync(sourcePath, "utf8").replace(/^\uFEFF/, ""));
const prioritySet = new Set(priorities);
const batch = items
  .filter((item) => prioritySet.has(item.id))
  .sort((a, b) => priorities.indexOf(a.id) - priorities.indexOf(b.id))
  .map((item, index) => ({
    ...item,
    queue: "priority-batch-04",
    priority: index + 1
  }));

fs.writeFileSync(outputPath, JSON.stringify(batch, null, 2) + "\n", "utf8");
console.log(`Prepared ${batch.length} items at ${path.relative(root, outputPath)}`);
