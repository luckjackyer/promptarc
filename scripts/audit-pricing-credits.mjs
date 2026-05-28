import { readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.argv[2] || process.cwd());

const pages = [
  {
    file: "pricing/index.html",
    required: [
      "image credits",
      "Free credits",
      "Credit packs",
      "Monthly credit plans",
      "failed generations",
      "Join the credit early access list",
      "Start free generation"
    ]
  },
  {
    file: "zh/pricing/index.html",
    required: [
      "生图积分",
      "免费积分",
      "积分包",
      "月度积分方案",
      "失败生成",
      "加入积分早鸟名单",
      "开始免费生成"
    ]
  }
];

const banned = [
  "Pricing is not active yet",
  "Coming soon",
  "Not open yet",
  "Waitlist later",
  "noindex",
  "暂未开放",
  "即将开放",
  "稍后加入",
  "鍗冲皢",
  "鏆傛湭",
  "涓枃",
  "浼氬憳",
  "鐢熸垚",
  "�"
];

const failures = [];

for (const page of pages) {
  const filePath = path.join(root, page.file);
  const text = await readFile(filePath, "utf8");
  for (const phrase of page.required) {
    if (!text.includes(phrase)) {
      failures.push(`${page.file}: missing required pricing phrase "${phrase}"`);
    }
  }
  for (const phrase of banned) {
    if (text.includes(phrase)) {
      failures.push(`${page.file}: contains banned pricing phrase "${phrase}"`);
    }
  }
  if (!/<meta name="robots" content="index,follow">/.test(text)) {
    failures.push(`${page.file}: must be index,follow`);
  }
}

if (failures.length) {
  console.error(`Found ${failures.length} pricing credit issue(s).`);
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Pricing credit audit passed for 2 pages.");
