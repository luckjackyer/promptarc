import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const candidateArg = process.argv[2];
const candidatePath = candidateArg
  ? path.resolve(root, candidateArg)
  : path.join(root, "content-pipeline", "prompt-candidates.json");
const rubricPath = path.join(root, "content-pipeline", "review-rubric.json");
const galleryDataPath = path.join(root, "gallery", "gallery-data.js");
const galleryAssetDir = path.join(root, "assets", "gallery");

const allowedCategories = new Set([
  "product",
  "poster",
  "ui",
  "infographic",
  "typography",
  "photography",
  "character",
  "portrait",
  "test"
]);

const stopwords = new Set([
  "the",
  "and",
  "with",
  "for",
  "from",
  "into",
  "that",
  "this",
  "use",
  "using",
  "image",
  "create",
  "generate",
  "design",
  "show",
  "include",
  "clean",
  "clear",
  "style",
  "layout",
  "prompt"
]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function loadGalleryItems() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(galleryDataPath, "utf8"), context, { filename: galleryDataPath });
  return context.window.PROMPTARC_GALLERY || [];
}

function tokenize(text) {
  return new Set(
    String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2 && !stopwords.has(token))
  );
}

function jaccard(a, b) {
  const left = tokenize(a);
  const right = tokenize(b);
  if (!left.size || !right.size) {
    return 0;
  }
  let intersection = 0;
  left.forEach((token) => {
    if (right.has(token)) {
      intersection += 1;
    }
  });
  return intersection / (left.size + right.size - intersection);
}

function walkFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function hashFile(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function addIssue(issues, level, message) {
  issues.push({ level, message });
}

function normalizedRelative(filePath) {
  return path.relative(root, filePath).replace(/\\/g, "/");
}

function isExpectedMirrorDuplicate(firstPath, secondPath) {
  const firstRel = normalizedRelative(firstPath);
  const secondRel = normalizedRelative(secondPath);
  const isAssetMirror =
    (firstRel.startsWith("assets/gallery/") && secondRel.startsWith("content-pipeline/generated/")) ||
    (secondRel.startsWith("assets/gallery/") && firstRel.startsWith("content-pipeline/generated/"));

  if (!isAssetMirror) {
    return false;
  }

  if (path.basename(firstRel) === path.basename(secondRel)) {
    return true;
  }

  const assetRel = firstRel.startsWith("assets/gallery/") ? firstRel : secondRel;
  const generatedRel = firstRel.startsWith("content-pipeline/generated/") ? firstRel : secondRel;
  const assetBase = path.basename(assetRel, path.extname(assetRel));
  const generatedBase = path.basename(generatedRel, path.extname(generatedRel));
  const generatedFolder = path.basename(path.dirname(generatedRel));

  if (generatedBase === "candidate-01" && assetBase === `generated-${generatedFolder}`) {
    return true;
  }

  return false;
}

const rubric = readJson(rubricPath);
const candidateRaw = readJson(candidatePath);
const candidates = Array.isArray(candidateRaw) ? candidateRaw : candidateRaw.candidates || [];
const galleryItems = loadGalleryItems();
const issues = [];
const candidateIds = new Set();
const galleryIds = new Set(galleryItems.map((item) => item.id));
const allowedPublishedDuplicates = new Set();

for (const candidate of candidates) {
  if (!candidate.id || !/^[a-z0-9-]+$/.test(candidate.id)) {
    addIssue(issues, "error", `Invalid candidate id: ${candidate.id || "(missing)"}`);
  }

  if (candidateIds.has(candidate.id)) {
    addIssue(issues, "error", `Duplicate candidate id: ${candidate.id}`);
  }
  candidateIds.add(candidate.id);

  if (galleryIds.has(candidate.id)) {
    addIssue(issues, "error", `Candidate id already exists in public gallery: ${candidate.id}`);
  }

  if (!allowedCategories.has(candidate.category)) {
    addIssue(issues, "error", `Unsupported category for ${candidate.id}: ${candidate.category}`);
  }

  if (!candidate.prompt || candidate.prompt.length < 120) {
    addIssue(issues, "warning", `Prompt may be too thin for ${candidate.id}`);
  }

  if (!candidate.negativePrompt || candidate.negativePrompt.length < 30) {
    addIssue(issues, "warning", `Missing or weak negative prompt for ${candidate.id}`);
  }

  if (!candidate.generation || candidate.generation.candidateCount < 3) {
    addIssue(issues, "warning", `Generate at least 3 images for ${candidate.id}`);
  }

  const closestGallery = galleryItems
    .filter((item) => item.id !== `generated-${candidate.id}`)
    .map((item) => ({ id: item.id, score: jaccard(candidate.prompt, item.prompt) }))
    .sort((a, b) => b.score - a.score)[0];

  if (closestGallery && closestGallery.score >= 0.55) {
    addIssue(
      issues,
      "error",
      `Candidate ${candidate.id} is too similar to gallery item ${closestGallery.id} (${closestGallery.score.toFixed(2)})`
    );
  } else if (closestGallery && closestGallery.score >= 0.42) {
    addIssue(
      issues,
      "warning",
      `Candidate ${candidate.id} is somewhat similar to gallery item ${closestGallery.id} (${closestGallery.score.toFixed(2)})`
    );
  }

  if (candidate.status === "approved" || candidate.status === "published") {
    const score = candidate.review && Number(candidate.review.score);
    if (!Number.isFinite(score) || score < rubric.publishThreshold) {
      addIssue(issues, "error", `Approved/published candidate ${candidate.id} is below publish threshold`);
    }
    if (!candidate.review || !candidate.review.bestImage) {
      addIssue(issues, "error", `Approved/published candidate ${candidate.id} is missing bestImage`);
    }
  }

  if (candidate.status === "published" && candidate.review && candidate.review.bestImage) {
    allowedPublishedDuplicates.add(
      [
        candidate.review.bestImage.replace(/\\/g, "/"),
        `assets/gallery/generated-${candidate.id}.png`
      ]
        .sort()
        .join("::")
    );
  }
}

for (let i = 0; i < candidates.length; i += 1) {
  for (let j = i + 1; j < candidates.length; j += 1) {
    const score = jaccard(candidates[i].prompt, candidates[j].prompt);
    if (score >= 0.5) {
      addIssue(
        issues,
        "warning",
        `Candidate prompts may be too similar: ${candidates[i].id} / ${candidates[j].id} (${score.toFixed(2)})`
      );
    }
  }
}

const localImageFiles = [
  ...walkFiles(galleryAssetDir),
  ...walkFiles(path.join(root, "content-pipeline", "generated"))
].filter((filePath) => /\.(png|jpe?g|webp|gif)$/i.test(filePath));

const imageHashes = new Map();
for (const filePath of localImageFiles) {
  const hash = hashFile(filePath);
  if (imageHashes.has(hash)) {
    const firstPath = imageHashes.get(hash);
    const pairKey = [normalizedRelative(firstPath), normalizedRelative(filePath)].sort().join("::");
    if (allowedPublishedDuplicates.has(pairKey) || isExpectedMirrorDuplicate(firstPath, filePath)) {
      continue;
    }
    addIssue(
      issues,
      "error",
      `Exact duplicate image files: ${path.relative(root, firstPath)} and ${path.relative(root, filePath)}`
    );
  } else {
    imageHashes.set(hash, filePath);
  }
}

const counts = candidates.reduce((acc, item) => {
  acc[item.category] = (acc[item.category] || 0) + 1;
  return acc;
}, {});

const errors = issues.filter((issue) => issue.level === "error");
const warnings = issues.filter((issue) => issue.level === "warning");

console.log("PromptArc content pipeline audit");
console.log(`Candidate source: ${normalizedRelative(candidatePath)}`);
console.log(`Candidates: ${candidates.length}`);
console.log(`Public gallery items: ${galleryItems.length}`);
console.log(`Local image files scanned: ${localImageFiles.length}`);
console.log(`Candidate categories: ${JSON.stringify(counts)}`);
console.log(`Errors: ${errors.length}`);
console.log(`Warnings: ${warnings.length}`);

for (const issue of issues) {
  console.log(`[${issue.level.toUpperCase()}] ${issue.message}`);
}

if (errors.length) {
  process.exitCode = 1;
}
