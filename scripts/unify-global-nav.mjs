import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const ignoredRoots = new Set([".git", ".qa-screenshots", "_deploy", "_site", "node_modules", "tmp"]);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (ignoredRoots.has(entry.name)) return [];
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.isFile() && entry.name === "index.html" ? [full] : [];
  });
}

function rel(file) {
  return path.relative(root, file).replace(/\\/g, "/");
}

function isChinese(file) {
  return rel(file).startsWith("zh/");
}

function activeKey(file) {
  const name = rel(file).replace(/^zh\//, "");
  if (name === "index.html") return null;
  if (name.startsWith("generate")) return "generate";
  if (name.startsWith("gallery/") || name === "image-prompt-pack/index.html") return "gallery";
  if (name.startsWith("pricing/")) return "pricing";
  if (name.startsWith("account/") || name.startsWith("admin/members/")) return "account";
  return null;
}

function navItem({ key, href, label, current }) {
  return `        <a href="${href}" data-nav-key="${key}"${current === key ? ' aria-current="page"' : ""}>${label}</a>`;
}

function headerFor(file) {
  const zh = isChinese(file);
  const current = activeKey(file);
  const base = zh ? "/zh" : "";
  const homeHref = zh ? "/zh/" : "/";
  const labels = zh
    ? {
        home: "PromptArc \u9996\u9875",
        nav: "\u4e3b\u5bfc\u822a",
        lang: "\u8bed\u8a00\u5207\u6362",
        language: "\u4e2d\u6587",
        generate: "\u751f\u6210",
        gallery: "\u56fe\u5e93",
        pricing: "\u4ef7\u683c",
        account: "\u8d26\u6237",
      }
    : {
        home: "PromptArc home",
        nav: "Primary navigation",
        lang: "Language switch",
        language: "EN",
        generate: "Generate",
        gallery: "Gallery",
        pricing: "Pricing",
        account: "Account",
      };

  return `<header class="site-global-nav" data-site-global-nav>
      <a class="site-global-brand" href="${homeHref}" aria-label="${labels.home}">
        <span class="site-global-logo">PA</span>
        <strong class="site-global-wordmark">PromptArc</strong>
      </a>
      <nav class="site-global-links" aria-label="${labels.nav}">
${navItem({ key: "generate", href: `${base}/generate${zh ? "-image-first" : ""}/`, label: labels.generate, current })}
${navItem({ key: "gallery", href: `${base}/gallery/`, label: labels.gallery, current })}
${navItem({ key: "pricing", href: `${base}/pricing/`, label: labels.pricing, current })}
${navItem({ key: "account", href: `${base}/account/`, label: labels.account, current })}
      </nav>
      <div class="site-global-lang" aria-label="${labels.lang}">
        <span>${labels.language}</span>
      </div>
    </header>`;
}

const headerPatterns = [
  /<aside class="home-rail"[\s\S]*?<\/aside>\s*/g,
  /<header class="home-topbar"[\s\S]*?<\/header>\s*/g,
  /<header class="prompt-page-topbar"[\s\S]*?<\/header>/g,
  /<header class="image-first-topbar"[\s\S]*?<\/header>/g,
  /<header class="account-topbar"[\s\S]*?<\/header>/g,
  /<header class="admin-members-head"[\s\S]*?<\/header>/g,
  /<header class="topbar"[\s\S]*?<\/header>/g,
  /<header class="site-global-nav" data-site-global-nav>[\s\S]*?<\/header>/g,
];

let changed = 0;
for (const file of walk(root)) {
  let html = fs.readFileSync(file, "utf8");
  const original = html;
  for (const pattern of headerPatterns) {
    html = html.replace(pattern, "");
  }
  html = html.replace(/(<body\b[^>]*>\s*)/, `$1\n  ${headerFor(file)}\n`);
  if (html !== original) {
    fs.writeFileSync(file, html, "utf8");
    changed += 1;
  }
}

console.log(`unified ${changed} source page headers`);
