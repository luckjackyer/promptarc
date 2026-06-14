import assert from "node:assert/strict";
import fs from "node:fs";

function read(file) {
  return fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
}

const gallery = read("gallery/index.html");
const zhGallery = read("zh/gallery/index.html");
const css = read("style.css");

assert.match(
  gallery,
  /<body data-page="prompt-hub" data-surface="gallery">/,
  "English gallery should declare the gallery surface for scoped visual rules"
);

assert.match(
  zhGallery,
  /<body data-page="prompt-hub" data-surface="gallery">/,
  "Chinese gallery should declare the gallery surface for scoped visual rules"
);

assert.match(
  gallery,
  /<section class="prompt-page-hero">[\s\S]*<h1>Browse generated images by theme\.<\/h1>/,
  "English gallery should keep a visible page title before the image grid"
);

assert.match(
  zhGallery,
  /<section class="prompt-page-hero">[\s\S]*<h1>按主题浏览生成图片。<\/h1>/,
  "Chinese gallery should keep a visible page title before the image grid"
);

assert.equal(
  (gallery.match(/data-gallery-search/g) || []).length,
  2,
  "English gallery should keep the synchronized hero and toolbar search inputs"
);

assert.equal(
  (zhGallery.match(/data-gallery-search/g) || []).length,
  2,
  "Chinese gallery should keep the synchronized hero and toolbar search inputs"
);

assert.match(
  css,
  /body\[data-page="prompt-hub"\]\[data-surface="gallery"\] \.prompt-page-hero[\s\S]*display:\s*grid !important/,
  "Gallery hero should override the compact board rule and remain visible"
);

console.log("gallery surface contract passed");
