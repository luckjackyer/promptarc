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

const checks = [
  {
    path: "gallery/index.html",
    phrases: [
      "Long-tail topic pages",
      "/gallery/topics/product-hero/",
      "/gallery/topics/event/",
      "/gallery/topics/launch/",
      "/gallery/topics/coffee/",
      "/gallery/topics/dashboard/",
      "/gallery/topics/documentary/"
    ]
  },
  {
    path: "zh/gallery/index.html",
    phrases: [
      "长尾主题页",
      "/zh/gallery/topics/product-hero/",
      "/zh/gallery/topics/event/",
      "/zh/gallery/topics/launch/",
      "/zh/gallery/topics/coffee/",
      "/zh/gallery/topics/dashboard/",
      "/zh/gallery/topics/documentary/"
    ]
  },
  {
    path: "gallery/topics/product-hero/index.html",
    phrases: [
      "Best AI product hero prompts",
      "What makes a strong product hero prompt?",
      "Best for ecommerce hero images",
      "/image-prompt-pack/",
      "/pricing/#credit-waitlist",
      "FAQPage"
    ]
  },
  {
    path: "gallery/topics/event/index.html",
    phrases: [
      "AI event poster prompts",
      "What makes a strong event poster prompt?",
      "Best for workshops, fairs, and launch events",
      "/image-prompt-pack/",
      "FAQPage"
    ]
  },
  {
    path: "gallery/topics/launch/index.html",
    phrases: [
      "AI launch campaign prompts",
      "What makes a strong launch visual prompt?",
      "Best for product launches, brand campaigns, and announcement pages",
      "/pricing/#credit-waitlist",
      "FAQPage"
    ]
  },
  {
    path: "gallery/topics/coffee/index.html",
    phrases: [
      "Coffee product prompt examples",
      "What makes a strong coffee product prompt?",
      "Best for specialty coffee launches",
      "/gallery/product/",
      "FAQPage"
    ]
  },
  {
    path: "gallery/topics/dashboard/index.html",
    phrases: [
      "AI dashboard UI prompts",
      "What makes a strong dashboard UI prompt?",
      "Best for SaaS mockups, internal tools, and mobile dashboards",
      "/gallery/ui/",
      "FAQPage"
    ]
  },
  {
    path: "gallery/topics/documentary/index.html",
    phrases: [
      "Documentary photo prompts",
      "What makes a strong documentary prompt?",
      "Best for candid street scenes, editorial reference, and realistic photo studies",
      "/gallery/photography/",
      "FAQPage"
    ]
  },
  {
    path: "zh/gallery/topics/product-hero/index.html",
    phrases: [
      "最佳产品首图提示词",
      "什么样的产品首图提示词更强？",
      "适合电商首图",
      "/zh/image-prompt-pack/",
      "/zh/pricing/#credit-waitlist",
      "FAQPage"
    ]
  },
  {
    path: "zh/gallery/topics/event/index.html",
    phrases: [
      "活动海报提示词",
      "什么样的活动海报提示词更强？",
      "适合工作坊、展会和上新活动",
      "/zh/image-prompt-pack/",
      "FAQPage"
    ]
  },
  {
    path: "zh/gallery/topics/launch/index.html",
    phrases: [
      "上新视觉提示词",
      "什么样的上新视觉提示词更强？",
      "适合产品上新、品牌 campaign 和公告页",
      "/zh/pricing/#credit-waitlist",
      "FAQPage"
    ]
  },
  {
    path: "zh/gallery/topics/coffee/index.html",
    phrases: [
      "咖啡产品提示词",
      "什么样的咖啡产品提示词更强？",
      "适合精品咖啡上新",
      "/zh/gallery/product/",
      "FAQPage"
    ]
  },
  {
    path: "zh/gallery/topics/dashboard/index.html",
    phrases: [
      "仪表盘 UI 提示词",
      "什么样的仪表盘 UI 提示词更强？",
      "适合 SaaS mockup、内部工具和移动端仪表盘",
      "/zh/gallery/ui/",
      "FAQPage"
    ]
  },
  {
    path: "zh/gallery/topics/documentary/index.html",
    phrases: [
      "纪实摄影提示词",
      "什么样的纪实摄影提示词更强？",
      "适合抓拍街景、编辑部参考和真实感摄影研究",
      "/zh/gallery/photography/",
      "FAQPage"
    ]
  }
];

for (const check of checks) {
  const text = await read(check.path);
  requirePhrases(check.path, text, check.phrases);
}

if (failures.length) {
  console.error(`Found ${failures.length} topic answer page issue(s).`);
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Topic answer page audit passed.");
