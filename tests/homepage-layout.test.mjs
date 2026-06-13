import assert from "node:assert/strict";
import fs from "node:fs";

function read(file) {
  return fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
}

for (const file of ["index.html", "zh/index.html"]) {
  const html = read(file);
  assert.match(html, /home-app-shell/, `${file} should use the new home app shell`);
  assert.match(html, /home-hero-stage/, `${file} should include the immersive hero stage`);
  assert.match(html, /image-generator-form/, `${file} should keep the generator form`);
  assert.match(html, /home-discovery-grid/, `${file} should include discovery cards`);
}

console.log("homepage layout tests passed");
