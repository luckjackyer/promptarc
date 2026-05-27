import fs from "node:fs";

const categoryPath = process.argv[2] || "C:/tmp/leader-imgs-category.json";
const indexPath = process.argv[3] || "C:/tmp/leader-imgs-index.json";
const tagsPath = process.argv[4] || "C:/tmp/leader-imgs-tags.json";
const outputPath = process.argv[5] || "docs/leaderai-competitive-category-analysis.json";

const categoryData = JSON.parse(fs.readFileSync(categoryPath, "utf8"));
const indexData = JSON.parse(fs.readFileSync(indexPath, "utf8"));
const tagsData = JSON.parse(fs.readFileSync(tagsPath, "utf8"));

const headers = indexData[0].map((header) => (Array.isArray(header) ? header[0] : header));
const rows = indexData.slice(1).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index]])));

const categoryStats = Object.entries(categoryData)
  .map(([name, ids]) => ({ name, count: ids.length }))
  .sort((a, b) => b.count - a.count);

const tagStats = Object.entries(tagsData)
  .map(([name, ids]) => ({ name, count: ids.length }))
  .sort((a, b) => b.count - a.count);

const dims = {
  totalImages: 0,
  portrait: 0,
  landscape: 0,
  square: 0,
  wide: 0,
  tall: 0,
  unknown: 0
};

const sampleTitles = new Map();
for (const row of rows) {
  const category = row.catalog || "uncategorized";
  if (!sampleTitles.has(category)) sampleTitles.set(category, []);
  if (sampleTitles.get(category).length < 16) sampleTitles.get(category).push(row.title);

  const images = Array.isArray(row.imgs) ? row.imgs : [];
  for (const image of images) {
    const width = Number(image?.[1] || 0);
    const height = Number(image?.[2] || 0);
    dims.totalImages += 1;
    if (!width || !height) {
      dims.unknown += 1;
    } else if (Math.abs(width - height) / Math.max(width, height) < 0.08) {
      dims.square += 1;
    } else if (width > height * 1.35) {
      dims.wide += 1;
    } else if (height > width * 1.35) {
      dims.tall += 1;
    } else if (width > height) {
      dims.landscape += 1;
    } else {
      dims.portrait += 1;
    }
  }
}

const report = {
  source: "https://www.leaderai.top/mid-api/lab/image_prompt/index.html",
  fetchedFrom: [
    "https://cdn.leaderai.top/oss/moban-image/image_prompt/imgs_category.json",
    "https://cdn.leaderai.top/oss/moban-image/image_prompt/imgs_index.json",
    "https://cdn.leaderai.top/oss/moban-image/image_prompt/imgs_tags.json"
  ],
  note: "Use category, tag, image-ratio, and visual-pattern signals only. Do not copy source prompts verbatim.",
  totalRows: rows.length,
  totalCategories: categoryStats.length,
  totalTags: tagStats.length,
  dims,
  categoryStats,
  tagStats: tagStats.slice(0, 120),
  sampleTitlesByCategory: Object.fromEntries(sampleTitles)
};

fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      totalRows: report.totalRows,
      totalCategories: report.totalCategories,
      totalTags: report.totalTags,
      dims: report.dims,
      topCategories: categoryStats.slice(0, 20),
      topTags: tagStats.slice(0, 40)
    },
    null,
    2
  )
);
