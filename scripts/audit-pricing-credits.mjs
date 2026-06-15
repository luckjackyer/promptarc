import { readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.argv[2] || process.cwd());

const pages = [
  {
    file: "pricing/index.html",
    required: [
      "Credits for image generation",
      "Free credits",
      "Credit packs",
      "Monthly credit plans",
      "Failed generations",
      "Join credit rollout",
      "Start free generation",
      "Choose the right paid path",
      "Prompt catalog",
      "Wait for image credits",
      "pricing-credit-rules",
      "pricing-faq",
      "/image-prompt-pack/"
    ],
    banned: [
      "Buy now",
      "Start paid checkout",
      "Buy credits now",
      "Subscribe now",
      "Join the credit early access list"
    ]
  },
  {
    file: "zh/pricing/index.html",
    required: [
      "图片生成额度",
      "免费额度",
      "额度包",
      "月度额度计划",
      "失败生成",
      "加入额度内测",
      "开始免费生成",
      "选择合适的付费路径",
      "提示词目录",
      "等待图片额度开放",
      "pricing-credit-rules",
      "pricing-faq",
      "/zh/image-prompt-pack/"
    ],
    banned: [
      "立即付款",
      "立即购买额度",
      "立即购买",
      "立即订阅",
      "加入积分早鸟名单",
      "生图积分",
      "积分包"
    ]
  }
];

const globallyBanned = [
  "Pricing is not active yet",
  "Coming soon",
  "Not open yet",
  "Waitlist later",
  "noindex",
  "暂未开放",
  "即将开放",
  "稍后加入",
  "锟"
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
  for (const phrase of [...globallyBanned, ...page.banned]) {
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
