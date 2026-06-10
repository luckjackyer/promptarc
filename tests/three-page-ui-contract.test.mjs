import assert from "node:assert/strict";
import fs from "node:fs";

function read(file) {
  return fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
}

const css = read("style.css");

function countOccurrences(text, needle) {
  return text.split(needle).length - 1;
}

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

for (const guard of [
  "Pricing/account refinement: tighter product hierarchy for launch review.",
  "Launch quality pass: pricing/account pages should feel like finished product surfaces.",
  "Member visual correction: reduce launch-block spacing and empty-state bulk.",
  "Final gallery toolbar guard: search and filter stay visible on mobile."
]) {
  assert.equal(countOccurrences(css, guard), 1, `style.css should keep exactly one ${guard} block`);
}

assert.equal(
  countOccurrences(css, "Member spacing override: keep account surfaces attached to the app chrome."),
  0,
  "style.css should not stack a second member spacing override block"
);

for (const file of ["index.html", "zh/index.html"]) {
  const html = read(file);
  assert.match(html, /data-gallery-limit="8"/, `${file} should keep the homepage discovery grid selective, not a full gallery page`);
  assert.doesNotMatch(html, /home-hero-kicker[^>]*>\s*(IMAGE GENERATION|探索发现)/, `${file} should not show removed kicker labels`);
}

for (const file of ["pricing/index.html", "zh/pricing/index.html"]) {
  const html = read(file);
  assert.match(html, /class="pricing-proof-image"[^>]*loading="eager"[^>]*fetchpriority="high"/, `${file} should prioritize the first pricing proof image`);
  assert.match(html, /class="pricing-proof-strip"[^>]*loading="eager"[^>]*fetchpriority="high"/, `${file} should prioritize the pricing proof strip image`);
}

for (const file of ["gallery/index.html", "zh/gallery/index.html", "generate/index.html", "zh/generate-image-first/index.html"]) {
  const html = read(file);
  assert.match(html, /prompt-page-nav|generate-rail|image-first-topbar/, `${file} should keep primary navigation`);
}

{
  const html = read("generate/index.html");
  assert.match(html, /data-page="generate-image-first"/, "English generator should be a real generator surface");
  assert.match(html, /href="\/generate\/" aria-current="page"/, "English generator should keep English current nav");
  assert.match(html, /data-image-first-form/, "English generator should include the image-first form");
  assert.doesNotMatch(html, /window\.location\.replace\("\/zh\/generate-image-first\/"/, "English generator should not redirect to Chinese");
  assert.doesNotMatch(html, /http-equiv="refresh"/, "English generator should not use a redirect fallback");
}

for (const file of ["zh/generate/index.html"]) {
  const html = read(file);
  assert.match(html, /window\.location\.replace\("\/zh\/generate-image-first\/"/, `${file} should redirect to the official generator`);
  assert.match(html, /<meta http-equiv="refresh" content="0; url=\/zh\/generate-image-first\/">/, `${file} should keep a non-JS redirect fallback`);
}

for (const file of ["zh/generate-next/index.html", "zh/generate-studio/index.html"]) {
  const html = read(file);
  assert.match(html, /<meta name="robots" content="noindex,nofollow">/, `${file} should stay out of the index`);
  assert.match(html, /window\.location\.replace\("\/zh\/generate-image-first\/"/, `${file} should redirect to the official generator`);
}

assert.doesNotMatch(read("zh/generate/index.html"), /Open the new generator/, "Chinese generator redirect fallback should be localized");

const appJs = read("app.js");
assert.match(appJs, /architecture:\s*"建筑空间"/, "Chinese category labels should cover architecture cards");
assert.match(appJs, /experimental:\s*"创意实验"/, "Chinese category labels should cover experimental cards");
assert.match(appJs, /submitButton\.disabled = true/, "email and waitlist forms should disable submit while sending");
assert.match(appJs, /copyFailed:/, "copy controls should have a visible failed-copy label");
assert.match(appJs, /showCopyFeedback\(i18n\.copyFailed\)/, "copy controls should visibly report clipboard failures");
assert.match(appJs, /if \(!response\.ok\)/, "email and waitlist forms should not treat failed endpoint responses as successful signups");
assert.match(appJs, /newsletter_request_failed/, "email and waitlist forms should expose a failed request path");
assert.match(appJs, /gallery_submission_failed/, "gallery submission should expose a failed request path");
assert.match(appJs, /payload\.submitted/, "gallery submission should only claim success after the backend confirms submission");
assert.match(appJs, /handleGeneratedPreviewRemix/, "generated preview edit action should be wired to real behavior");
assert.match(appJs, /handleGeneratedPreviewRegenerate/, "generated preview regenerate action should be wired to real behavior");
assert.doesNotMatch(
  appJs,
  /const mockImageSets = \[[\s\S]*assets\/gallery\/thumbs\//,
  "image-first mock detail sets should use full-size gallery images so visual QA can verify real detail images"
);

const launchPages = [
  "index.html",
  "zh/index.html",
  "gallery/index.html",
  "zh/gallery/index.html",
  "pricing/index.html",
  "zh/pricing/index.html",
  "zh/generate-image-first/index.html",
  "account/index.html",
  "account/login/index.html",
  "account/history/index.html",
  "zh/account/index.html",
  "zh/account/login/index.html",
  "zh/account/history/index.html",
  "zh/admin/members/index.html"
];

for (const file of launchPages) {
  const html = read(file);
  assert.doesNotMatch(html, /href=["']\s*["']/, `${file} should not ship empty links`);
  assert.doesNotMatch(html, /href=["']javascript:/i, `${file} should not ship javascript links`);
  assert.doesNotMatch(html, /href=["']\/zh\/home-next\/["']/, `${file} should not link to the retired homepage experiment`);
  assert.doesNotMatch(html, /href=["']\/zh\/generate-next\/["']/, `${file} should not link to the retired generator experiment`);
  assert.doesNotMatch(html, /href=["']\/zh\/generate-studio\/["']/, `${file} should not link to the retired studio experiment`);
}

const imageFirst = read("zh/generate-image-first/index.html");
assert.equal((imageFirst.match(/class="image-first-detail-nav"/g) || []).length, 2, "image-first detail should keep previous and next controls");
assert.match(appJs, /function moveImageFirstDetail\(delta\)/, "image-first detail navigation should be implemented");
assert.match(appJs, /event\.target\.closest\("\.image-first-detail-nav"\)/, "image-first detail nav buttons should be click-bound");

console.log("three-page UI contract tests passed");
