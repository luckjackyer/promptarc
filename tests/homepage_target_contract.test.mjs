import assert from "node:assert/strict";
import fs from "node:fs";

function read(file) {
  return fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
}

const html = read("index.html");
const css = read("style.css");

const navMatch = html.match(/<nav class="site-global-links"[^>]*>([\s\S]*?)<\/nav>/);
assert.ok(navMatch, "homepage should keep a primary global nav");
const navLabels = [...navMatch[1].matchAll(/<a\b[^>]*>([^<]+)<\/a>/g)].map((match) => match[1].trim());
assert.deepEqual(
  navLabels,
  ["Generate", "Gallery", "Pricing", "Account"],
  "homepage nav should prioritize the creation workflow before secondary pages"
);

assert.match(
  html,
  /<strong class="site-global-wordmark">PromptArc<\/strong>/,
  "homepage global logo should include the PromptArc wordmark on desktop"
);

assert.match(
  html,
  /class="home-hero-showcase"/,
  "homepage hero should include first-viewport image previews"
);

assert.equal(
  (html.match(/class="home-hero-shot/g) || []).length,
  4,
  "homepage hero should expose four proof images before the gallery section"
);

const requiredHeroAssets = [
  "/assets/home/hero-product-shot.jpg",
  "/assets/home/hero-poster.jpg",
  "/assets/home/hero-campaign.jpg",
  "/assets/home/hero-social.jpg",
];

for (const asset of requiredHeroAssets) {
  assert.match(
    html,
    new RegExp(`<img[^>]+src="${asset.replaceAll("/", "\\/")}"`),
    `homepage hero should render generated asset ${asset}`
  );
  const assetPath = asset.replace(/^\//, "");
  assert.ok(fs.existsSync(new URL(`../${assetPath}`, import.meta.url)), `generated asset should exist: ${assetPath}`);
}

assert.doesNotMatch(
  html,
  /home-proof-strip/,
  "homepage first viewport should not rely on SaaS metric pills for trust"
);

assert.match(
  css,
  /Homepage target redesign phase 1/,
  "style.css should include the scoped phase 1 redesign block"
);

assert.match(
  css,
  /body\[data-page="home-canvas"\] \.home-hero-stage[\s\S]*grid-template-columns:\s*minmax\(0,\s*0\.92fr\)\s*minmax\(420px,\s*0\.78fr\)/,
  "desktop hero should be a two-column generator plus image-preview stage"
);

assert.match(
  css,
  /body\[data-page="home-canvas"\] \.home-hero-console[\s\S]*border-radius:\s*16px !important/,
  "home composer should use product-grade radius instead of oversized soft-card radius"
);

assert.match(
  css,
  /body\[data-page="home-canvas"\] \.home-hero-stage[\s\S]*border-radius:\s*18px !important/,
  "home hero surface should use restrained product radius"
);

assert.match(
  css,
  /body\[data-page="home-canvas"\] \.home-console-submit[\s\S]*border-radius:\s*10px !important/,
  "Generate button should use precise product control radius"
);

assert.match(
  css,
  /home-hero-shot img[\s\S]*object-fit:\s*cover/,
  "hero proof assets should be real image fills, not only CSS gradients"
);

assert.match(
  css,
  /Homepage target redesign phase 3/,
  "style.css should include the scoped phase 3 featured-results block"
);

assert.match(
  css,
  /body\[data-page="home-canvas"\] \.home-discovery-panel:not\(\.home-creation-lanes\) \.home-discovery-head[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto !important/,
  "featured results header should keep title left and gallery action right"
);

assert.match(
  css,
  /body\[data-page="home-canvas"\] \.home-discovery-panel:not\(\.home-creation-lanes\) \.home-discovery-head h2[\s\S]*font-size:\s*32px !important/,
  "featured results heading should stay below hero scale on desktop"
);

assert.match(
  css,
  /body\[data-page="home-canvas"\] \.home-discovery-head a[\s\S]*white-space:\s*nowrap !important/,
  "featured results gallery link should remain readable on one line"
);

assert.match(
  css,
  /body\[data-page="home-canvas"\] \.home-discovery-grid \.gallery-image-wrap[\s\S]*aspect-ratio:\s*1 \/ 1\.12 !important/,
  "featured result cards should give images the dominant visual weight"
);

assert.match(
  css,
  /body\[data-page="home-canvas"\] \.home-discovery-grid \.gallery-card[\s\S]*box-shadow:\s*none !important/,
  "featured result cards should avoid heavy decorative shadows"
);

console.log("homepage target contract passed");
