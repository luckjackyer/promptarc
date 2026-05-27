import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourcePath = path.join(root, "content-pipeline", "batch-01-candidates.json");
const outputPath = path.join(root, "content-pipeline", "priority-batch-03.json");

const priorities = [
  "candidate-lakeside-cabin-photo",
  "candidate-creative-director-portrait",
  "candidate-travel-animal-mascot",
  "candidate-coffee-sticker-character",
  "candidate-stone-serif-typography",
  "candidate-fabric-lettering-typography",
  "candidate-angle-compare-test",
  "candidate-palette-compare-test",
  "candidate-vitamin-bottle-product",
  "candidate-headset-gaming-product",
  "candidate-fitness-coach-ui",
  "candidate-startup-event-poster"
];

const items = JSON.parse(fs.readFileSync(sourcePath, "utf8").replace(/^\uFEFF/, ""));
const prioritySet = new Set(priorities);
const batch = items
  .filter((item) => prioritySet.has(item.id))
  .sort((a, b) => priorities.indexOf(a.id) - priorities.indexOf(b.id))
  .map((item, index) => ({
    ...item,
    queue: "priority-batch-03",
    priority: index + 1
  }));

fs.writeFileSync(outputPath, JSON.stringify(batch, null, 2) + "\n", "utf8");
console.log(`Prepared ${batch.length} items at ${path.relative(root, outputPath)}`);
