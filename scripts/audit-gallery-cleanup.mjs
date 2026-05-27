import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const galleryDataPath = path.join(root, "gallery", "gallery-data.js");
const outputPath = path.join(root, "content-pipeline", "gallery-cleanup-report.json");

const targetRatios = {
  product: 4 / 5,
  poster: 4 / 5,
  infographic: 4 / 5,
  typography: 4 / 5,
  photography: 4 / 5,
  portrait: 4 / 5,
  character: 1,
  ui: 9 / 16,
  test: 4 / 5
};

function loadGalleryItems() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(galleryDataPath, "utf8"), context, { filename: galleryDataPath });
  return context.window.PROMPTARC_GALLERY || [];
}

function readPngSize(buffer) {
  if (buffer.length < 24 || buffer.toString("ascii", 1, 4) !== "PNG") {
    return null;
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

function readJpegSize(buffer) {
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return null;
  }
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (
      marker === 0xc0 ||
      marker === 0xc1 ||
      marker === 0xc2 ||
      marker === 0xc3 ||
      marker === 0xc5 ||
      marker === 0xc6 ||
      marker === 0xc7 ||
      marker === 0xc9 ||
      marker === 0xca ||
      marker === 0xcb ||
      marker === 0xcd ||
      marker === 0xce ||
      marker === 0xcf
    ) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7)
      };
    }
    offset += 2 + length;
  }
  return null;
}

function readGifSize(buffer) {
  if (buffer.toString("ascii", 0, 3) !== "GIF") {
    return null;
  }
  return {
    width: buffer.readUInt16LE(6),
    height: buffer.readUInt16LE(8)
  };
}

function getLocalImageMeta(imageUrl) {
  if (!imageUrl.startsWith("/")) {
    return null;
  }
  const filePath = path.join(root, imageUrl.replace(/^\//, ""));
  if (!fs.existsSync(filePath)) {
    return { exists: false };
  }
  const buffer = fs.readFileSync(filePath);
  const size = readPngSize(buffer) || readJpegSize(buffer) || readGifSize(buffer);
  return {
    exists: true,
    filePath: path.relative(root, filePath).replace(/\\/g, "/"),
    bytes: buffer.length,
    width: size ? size.width : null,
    height: size ? size.height : null,
    ratio: size ? Number((size.width / size.height).toFixed(3)) : null
  };
}

function classify(item) {
  if (item.sourceLabel === "PromptArc generated") {
    return "keep";
  }
  if (/^https?:\/\//.test(item.imageUrl)) {
    return "regenerate";
  }
  if (item.sourceLabel === "PromptArc curated") {
    return "regenerate";
  }
  return "review";
}

function ratioStatus(category, meta) {
  if (!meta || !meta.exists || !meta.ratio) {
    return "unknown";
  }
  const target = targetRatios[category] || 4 / 5;
  const diff = Math.abs(meta.ratio - target);
  if (diff <= 0.08) {
    return "ok";
  }
  if (diff <= 0.25) {
    return "crop-ok";
  }
  return "regenerate";
}

const items = loadGalleryItems();
const report = items.map((item) => {
  const meta = getLocalImageMeta(item.imageUrl);
  const action = classify(item);
  const ratio = ratioStatus(item.category, meta);
  const reasons = [];

  if (/^https?:\/\//.test(item.imageUrl)) {
    reasons.push("external-image");
  }
  if (item.sourceLabel === "PromptArc curated") {
    reasons.push("legacy-curated-not-original-generated");
  }
  if (item.sourceLabel === "PromptArc generated") {
    reasons.push("original-generated");
  }
  if (meta && meta.exists === false) {
    reasons.push("missing-local-file");
  }
  if (meta && meta.bytes > 1800000) {
    reasons.push("large-file");
  }
  if (ratio === "regenerate") {
    reasons.push("ratio-mismatch");
  } else if (ratio === "crop-ok") {
    reasons.push("needs-thumbnail-crop");
  }

  let finalAction = action;
  if (ratio === "regenerate" && action !== "keep") {
    finalAction = "regenerate";
  } else if (ratio === "crop-ok" && action === "keep") {
    finalAction = "keep-crop";
  }

  return {
    id: item.id,
    title: item.title,
    category: item.category,
    sourceLabel: item.sourceLabel || null,
    imageUrl: item.imageUrl,
    meta,
    ratioStatus: ratio,
    recommendedAction: finalAction,
    reasons
  };
});

const summary = report.reduce(
  (acc, item) => {
    acc.total += 1;
    acc.actions[item.recommendedAction] = (acc.actions[item.recommendedAction] || 0) + 1;
    acc.categories[item.category] = (acc.categories[item.category] || 0) + 1;
    item.reasons.forEach((reason) => {
      acc.reasons[reason] = (acc.reasons[reason] || 0) + 1;
    });
    return acc;
  },
  { total: 0, actions: {}, categories: {}, reasons: {} }
);

const payload = {
  generatedAt: new Date().toISOString(),
  targetRatios,
  summary,
  items: report
};

fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2) + "\n", "utf8");

console.log("PromptArc gallery cleanup audit");
console.log(`Items: ${summary.total}`);
console.log(`Actions: ${JSON.stringify(summary.actions)}`);
console.log(`Reasons: ${JSON.stringify(summary.reasons)}`);
console.log(`Report: ${path.relative(root, outputPath)}`);
