import assert from "node:assert/strict";
import fs from "node:fs";

function read(file) {
  return fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
}

function navLabels(html) {
  const match = html.match(/<nav class="site-global-links"[^>]*>([\s\S]*?)<\/nav>/);
  assert.ok(match, "site-global-links should exist");
  return [...match[1].matchAll(/<a\b[^>]*>([^<]+)<\/a>/g)].map((item) => item[1].trim());
}

for (const file of ["index.html", "generate/index.html", "gallery/index.html", "pricing/index.html", "account/index.html"]) {
  const html = read(file);
  assert.deepEqual(
    navLabels(html),
    ["Generate", "Gallery", "Pricing", "Account"],
    `${file} nav should use the product workflow order`
  );
  assert.match(
    html,
    /<span class="site-global-logo">PA<\/span>[\s\S]*<strong class="site-global-wordmark">PromptArc<\/strong>/,
    `${file} should use PA plus PromptArc brand lockup`
  );
}

for (const file of [
  "zh/index.html",
  "zh/gallery/index.html",
  "zh/generate-image-first/index.html",
  "zh/pricing/index.html",
  "zh/account/index.html",
]) {
  const html = read(file);
  assert.deepEqual(
    navLabels(html),
    ["生成", "图库", "价格", "账户"],
    `${file} Chinese nav should match the product workflow order`
  );
  assert.match(html, /<strong class="site-global-wordmark">PromptArc<\/strong>/, `${file} should show the PromptArc wordmark on desktop`);
  assert.doesNotMatch(html, />\?+<\/a>/, `${file} should not ship unreadable question-mark nav labels`);
}

assert.match(
  read("style.css"),
  /\.site-global-brand:focus-visible[\s\S]*\.site-global-links a:focus-visible[\s\S]*outline:\s*2px solid/,
  "Global navigation should expose a visible keyboard focus ring"
);

assert.match(
  read("style.css"),
  /\.site-global-links a,[\s\S]*min-height:\s*44px/,
  "Global navigation links should keep mobile-safe touch targets"
);

console.log("core nav consistency passed");
