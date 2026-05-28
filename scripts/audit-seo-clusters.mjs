import { readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.argv[2] || process.cwd());
const failures = [];

async function read(relativePath) {
  const fullPath = path.join(root, relativePath);
  try {
    return await readFile(fullPath, "utf8");
  } catch (error) {
    failures.push(`${relativePath}: missing (${error.message})`);
    return "";
  }
}

function requirePhrases(relativePath, text, phrases) {
  for (const phrase of phrases) {
    if (!text.includes(phrase)) {
      failures.push(`${relativePath}: missing "${phrase}"`);
    }
  }
}

const pages = [
  {
    path: "index.html",
    phrases: [
      "AI product ad prompts",
      "AI poster prompts",
      "/gallery/product/",
      "/gallery/poster/",
      "/image-prompt-pack/",
      "/pricing/#credit-waitlist"
    ]
  },
  {
    path: "zh/index.html",
    phrases: [
      "产品广告提示词",
      "海报提示词",
      "/zh/gallery/product/",
      "/zh/gallery/poster/",
      "/zh/image-prompt-pack/",
      "/zh/pricing/#credit-waitlist"
    ]
  },
  {
    path: "gallery/index.html",
    phrases: [
      "Product ad prompt cluster",
      "Poster prompt cluster",
      "/gallery/topics/product-hero/",
      "/gallery/topics/event/",
      "/gallery/topics/launch/"
    ]
  },
  {
    path: "zh/gallery/index.html",
    phrases: [
      "产品广告主集群",
      "海报主集群",
      "/zh/gallery/topics/product-hero/",
      "/zh/gallery/topics/event/",
      "/zh/gallery/topics/launch/"
    ]
  },
  {
    path: "gallery/product/index.html",
    phrases: [
      "AI product ad prompts",
      "commercial image workflow",
      "/pricing/#credit-waitlist",
      "/image-prompt-pack/"
    ]
  },
  {
    path: "gallery/poster/index.html",
    phrases: [
      "AI poster prompts",
      "campaign poster workflow",
      "/pricing/#credit-waitlist",
      "/image-prompt-pack/"
    ]
  },
  {
    path: "zh/gallery/product/index.html",
    phrases: [
      "产品广告提示词",
      "商业出图工作流",
      "/zh/pricing/#credit-waitlist",
      "/zh/image-prompt-pack/"
    ]
  },
  {
    path: "zh/gallery/poster/index.html",
    phrases: [
      "海报提示词",
      "海报出图工作流",
      "/zh/pricing/#credit-waitlist",
      "/zh/image-prompt-pack/"
    ]
  },
  {
    path: "gallery/topics/product-hero/index.html",
    phrases: [
      "product ad cluster",
      "/gallery/product/",
      "/pricing/#credit-waitlist"
    ]
  },
  {
    path: "gallery/topics/event/index.html",
    phrases: [
      "poster prompt cluster",
      "/gallery/poster/",
      "/image-prompt-pack/"
    ]
  },
  {
    path: "gallery/topics/launch/index.html",
    phrases: [
      "product ad cluster",
      "poster prompt cluster",
      "/pricing/#credit-waitlist"
    ]
  }
];

for (const page of pages) {
  const text = await read(page.path);
  requirePhrases(page.path, text, page.phrases);
}

if (failures.length) {
  console.error(`Found ${failures.length} SEO cluster issue(s).`);
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("SEO cluster audit passed.");
