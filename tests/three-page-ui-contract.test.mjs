import assert from "node:assert/strict";
import fs from "node:fs";

function read(file) {
  return fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
}

const css = read("style.css");

assert.match(
  css,
  /Stable three-page polish: scoped, reversible rules only\./,
  "style.css should keep the scoped three-page polish block"
);

assert.doesNotMatch(
  css,
  /Global product UI consistency across home, gallery, and generator/,
  "style.css should not reintroduce the broad global UI override"
);

assert.doesNotMatch(
  css,
  /Repair generator page after global navigation unification/,
  "style.css should not depend on stacked generator repair patches"
);

for (const file of ["index.html", "zh/index.html"]) {
  const html = read(file);
  assert.match(html, /data-gallery-limit="20"/, `${file} should show the expanded homepage discovery grid`);
  assert.doesNotMatch(html, /home-hero-kicker[^>]*>\s*(IMAGE GENERATION|探索发现)/, `${file} should not show removed kicker labels`);
}

for (const file of ["gallery/index.html", "zh/gallery/index.html", "zh/generate-image-first/index.html"]) {
  const html = read(file);
  assert.match(html, /prompt-page-nav|generate-rail|image-first-topbar/, `${file} should keep primary navigation`);
}

for (const file of ["generate/index.html", "zh/generate/index.html"]) {
  const html = read(file);
  assert.match(html, /window\.location\.replace\("\/zh\/generate-image-first\/"/, `${file} should redirect to the official generator`);
  assert.match(html, /<meta http-equiv="refresh" content="0; url=\/zh\/generate-image-first\/">/, `${file} should keep a non-JS redirect fallback`);
}

const appJs = read("app.js");
assert.match(appJs, /architecture:\s*"建筑空间"/, "Chinese category labels should cover architecture cards");
assert.match(appJs, /experimental:\s*"创意实验"/, "Chinese category labels should cover experimental cards");

console.log("three-page UI contract tests passed");
