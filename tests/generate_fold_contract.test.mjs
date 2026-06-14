import assert from "node:assert/strict";
import fs from "node:fs";

const css = fs.readFileSync(new URL("../style.css", import.meta.url), "utf8");

assert.match(
  css,
  /Phase 4 generate fold balance/,
  "style.css should include the final desktop fold-balance block for the generator"
);

assert.match(
  css,
  /@media \(min-width:\s*761px\)[\s\S]*body\[data-page="generate-image-first"\] \.image-first-command-drawer[\s\S]*bottom:\s*114px !important/,
  "desktop generator composer should sit high enough to make the primary action visible before the fold edge"
);

assert.match(
  css,
  /@media \(min-width:\s*761px\)[\s\S]*body\[data-page="generate-image-first"\] \.image-first-empty-gallery[\s\S]*height:\s*min\(52vh,\s*468px\) !important/,
  "desktop generator empty gallery should stay above the raised composer"
);

assert.match(
  css,
  /body\[data-page="generate-image-first"\] \.image-first-online-composer[\s\S]*min-height:\s*140px !important/,
  "desktop generator composer should be compact enough for the first fold"
);

console.log("generate fold contract passed");
