import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const ignoredRoots = new Set([
  ".git",
  ".qa-screenshots",
  "_deploy",
  "_site",
  "node_modules",
  "tmp",
]);

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

const sourcePages = walk(root).filter((file) => {
  const name = rel(file);
  return !name.startsWith("library/") && !name.startsWith("free-pack/");
});

const retiredNavClasses = [
  "home-rail",
  "home-topbar",
  "prompt-page-topbar",
  "prompt-page-nav",
  "image-first-topbar",
  "image-first-nav",
  "account-topbar",
  "account-nav",
  "topbar",
  'class="nav"',
  "admin-members-head",
  "admin-members-nav",
];

for (const file of sourcePages) {
  const name = rel(file);
  const html = fs.readFileSync(file, "utf8");
  assert.match(html, /<header class="site-global-nav" data-site-global-nav>/, `${name} should use the unified global nav`);
  assert.match(html, /<nav class="site-global-links"[^>]*>/, `${name} should use the unified global nav links`);
  assert.match(html, /<a class="site-global-lang" href="[^"]+"[^>]*>/, `${name} should render language switch as a real link`);
  assert.doesNotMatch(html, /<div class="site-global-lang"/, `${name} should not render language switch as inert text`);
  assert.doesNotMatch(html, /href="\/\//, `${name} should not ship malformed double-slash internal links`);
  for (const retired of retiredNavClasses) {
    assert.doesNotMatch(html, new RegExp(retired.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${name} should not keep retired nav class ${retired}`);
  }
}

const homepage = fs.readFileSync(path.join(root, "index.html"), "utf8");
const generator = fs.readFileSync(path.join(root, "generate", "index.html"), "utf8");
const zhHomepage = fs.readFileSync(path.join(root, "zh", "index.html"), "utf8");
const zhGenerator = fs.readFileSync(path.join(root, "zh", "generate-image-first", "index.html"), "utf8");
assert.match(homepage, /<a class="site-global-lang" href="\/zh\/"/, "English homepage language switch should open Chinese homepage");
assert.match(generator, /<a class="site-global-lang" href="\/zh\/generate-image-first\/"/, "English generator language switch should open Chinese image-first generator");
assert.match(zhHomepage, /<a class="site-global-lang" href="\/"/, "Chinese homepage language switch should open English homepage");
assert.match(zhGenerator, /<a class="site-global-lang" href="\/generate\/"/, "Chinese generator language switch should open English generator");
assert.match(homepage, /<a class="site-global-lang"[^>]*>\s*<span>中文<\/span>/, "English pages should label the language switch with the target language");
assert.match(zhHomepage, /<a class="site-global-lang"[^>]*>\s*<span>EN<\/span>/, "Chinese pages should label the language switch with the target language");

for (const file of sourcePages.filter((item) => !rel(item).startsWith("zh/"))) {
  const html = fs.readFileSync(file, "utf8");
  const nav = html.match(/<nav class="site-global-links"[^>]*>([\s\S]*?)<\/nav>/)?.[1] || "";
  const labels = [...nav.matchAll(/<a\b[^>]*>([^<]+)<\/a>/g)].map((match) => match[1].trim());
  assert.deepEqual(labels, ["Home", "Generate", "Gallery", "Pricing", "Account"], `${rel(file)} should use the English product nav order`);
}

for (const file of sourcePages.filter((item) => rel(item).startsWith("zh/"))) {
  const html = fs.readFileSync(file, "utf8");
  const nav = html.match(/<nav class="site-global-links"[^>]*>([\s\S]*?)<\/nav>/)?.[1] || "";
  const labels = [...nav.matchAll(/<a\b[^>]*>([^<]+)<\/a>/g)].map((match) => match[1].trim());
  assert.deepEqual(labels, ["首页", "生成", "图库", "价格", "账户"], `${rel(file)} should use the Chinese product nav order`);
}

console.log("global nav surface contract passed");
