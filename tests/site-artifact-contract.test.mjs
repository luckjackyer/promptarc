import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "_site");

const forbiddenEntries = [
  ".env",
  ".env.example",
  ".git",
  ".github",
  ".qa-screenshots",
  "_deploy",
  "content-pipeline",
  "deploy-logs",
  "docs",
  "scripts",
  "tests",
  "workers"
];

function walk(dir, matcher, output = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, matcher, output);
    } else if (matcher(fullPath)) {
      output.push(fullPath);
    }
  }
  return output;
}

function resolveSitePath(fromFile, value) {
  const clean = value.split("#", 1)[0].split("?", 1)[0];
  if (
    !clean ||
    clean.startsWith("http://") ||
    clean.startsWith("https://") ||
    clean.startsWith("mailto:") ||
    clean.startsWith("tel:") ||
    clean.startsWith("data:") ||
    clean.startsWith("//")
  ) {
    return null;
  }

  let target = clean.startsWith("/")
    ? path.join(outDir, clean.slice(1))
    : path.resolve(path.dirname(fromFile), clean);

  if (clean.endsWith("/")) {
    target = path.join(target, "index.html");
  }
  return target;
}

function collectLinkAndAssetReferences(html) {
  const references = [];
  const tagPattern = /<(a|link|script|img|source)\b[^>]*>/gi;
  let tagMatch;
  while ((tagMatch = tagPattern.exec(html))) {
    const tag = tagMatch[0];
    const attrPattern = /\s(href|src)=["']([^"']+)["']/gi;
    let attrMatch;
    while ((attrMatch = attrPattern.exec(tag))) {
      references.push({ attr: attrMatch[1].toLowerCase(), value: attrMatch[2] });
    }
  }
  return references;
}

function collectTags(html, tagName) {
  const pattern = new RegExp(`<${tagName}\\b[^>]*>`, "gi");
  return html.match(pattern) || [];
}

function getAttribute(tag, name) {
  const pattern = new RegExp(`\\s${name}=["']([^"']*)["']`, "i");
  return tag.match(pattern)?.[1] ?? "";
}

function hasAttribute(tag, name) {
  return new RegExp(`\\s${name}(?:\\s|=|>)`, "i").test(tag);
}

function hasClass(tag, className) {
  return getAttribute(tag, "class").split(/\s+/).includes(className);
}

function isInsideForm(html, index) {
  const before = html.slice(0, index).toLowerCase();
  return before.lastIndexOf("<form") > before.lastIndexOf("</form>");
}

function buttonHasKnownBehavior(html, index, tag) {
  const type = getAttribute(tag, "type").toLowerCase() || "submit";
  if ((type === "submit" || type === "reset") && isInsideForm(html, index)) {
    return true;
  }

  const handledAttributes = [
    "data-copy-target",
    "data-gallery-filter",
    "data-home-resolution-option",
    "data-home-ratio-option",
    "data-generate-prompt",
    "data-generated-preview",
    "data-image-first-command-toggle",
    "data-image-first-detail-close",
    "data-image-first-detail-thumb",
    "data-image-first-edit-group",
    "data-image-first-regenerate-group",
    "data-image-first-candidate",
    "data-next-param-toggle",
    "data-studio-open",
    "data-close-prompt-preview",
    "data-save-prompt",
    "data-prompt-preview-step",
    "data-random-gallery",
    "data-copy-visible-prompts",
    "data-load-preset",
    "data-generator-example",
    "data-clear-generation-history"
  ];
  if (handledAttributes.some(attribute => hasAttribute(tag, attribute))) {
    return true;
  }

  return hasClass(tag, "image-first-detail-nav");
}

function stripTags(html) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function hasElementId(html, id) {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\sid=["']${escaped}["']`, "i").test(html);
}

test("GitHub Pages artifact is clean and internally linked", () => {
  const build = spawnSync(process.execPath, ["scripts/build-pages-artifact.mjs"], {
    cwd: root,
    encoding: "utf8"
  });
  assert.equal(build.status, 0, build.stderr || build.stdout);
  assert.ok(existsSync(outDir), "_site should be created by the artifact build");

  for (const entry of forbiddenEntries) {
    assert.equal(existsSync(path.join(outDir, entry)), false, `_site should not contain ${entry}`);
  }

  const htmlFiles = walk(outDir, file => file.endsWith(".html"));
  assert.ok(htmlFiles.length >= 40, "artifact should include the public HTML surface");

  const issues = [];
  for (const file of htmlFiles) {
    const html = readFileSync(file, "utf8");
    for (const reference of collectLinkAndAssetReferences(html)) {
      const target = resolveSitePath(file, reference.value);
      if (!target) continue;
      if (!existsSync(target)) {
        issues.push(`${path.relative(outDir, file)} ${reference.attr}="${reference.value}" -> ${path.relative(outDir, target)}`);
        continue;
      }
      if (statSync(target).isDirectory() && !existsSync(path.join(target, "index.html"))) {
        issues.push(`${path.relative(outDir, file)} ${reference.attr}="${reference.value}" points to a directory without index.html`);
      }
    }
  }

  assert.deepEqual(issues, []);
});

test("GitHub Pages artifact has no placeholder anchors or unlabeled buttons", () => {
  assert.ok(existsSync(outDir), "_site should exist before interaction contract checks");
  const htmlFiles = walk(outDir, file => file.endsWith(".html"));
  const issues = [];

  for (const file of htmlFiles) {
    const html = readFileSync(file, "utf8");
    const relative = path.relative(outDir, file);

    for (const tag of collectTags(html, "a")) {
      const href = getAttribute(tag, "href").trim();
      if (!href) {
        issues.push(`${relative} has an anchor without a real href: ${tag}`);
        continue;
      }
      if (href === "#" || /^javascript:/i.test(href)) {
        issues.push(`${relative} has a placeholder anchor href: ${href}`);
        continue;
      }

      const [withoutHash, hash] = href.split("#", 2);
      if (hash) {
        const target = withoutHash ? resolveSitePath(file, withoutHash) : file;
        if (target && existsSync(target) && target.endsWith(".html")) {
          const targetHtml = target === file ? html : readFileSync(target, "utf8");
          if (!hasElementId(targetHtml, hash)) {
            issues.push(`${relative} links to missing anchor id #${hash}: ${href}`);
          }
        }
      }
    }

    const buttonPattern = /<button\b[^>]*>([\s\S]*?)<\/button>/gi;
    let match;
    while ((match = buttonPattern.exec(html))) {
      const tag = match[0];
      const label = [
        stripTags(match[1]),
        getAttribute(tag, "aria-label"),
        getAttribute(tag, "title"),
        getAttribute(tag, "value")
      ].find(value => value && value.trim());
      if (!label) {
        issues.push(`${relative} has an unlabeled button: ${tag.slice(0, 160)}`);
      }
      if (!buttonHasKnownBehavior(html, match.index, tag)) {
        issues.push(`${relative} has a button without a verified behavior hook: ${tag.slice(0, 160)}`);
      }
    }
  }

  assert.deepEqual(issues, []);
});

test("English public pages use language-neutral product entrypoints", () => {
  assert.ok(existsSync(outDir), "_site should exist before language entrypoint checks");
  const htmlFiles = walk(outDir, file => file.endsWith(".html"));
  const issues = [];

  for (const file of htmlFiles) {
    const relative = path.relative(outDir, file).replace(/\\/g, "/");
    if (relative.startsWith("zh/")) continue;
    if (relative.startsWith("generate/")) continue;
    if (relative.startsWith("account/")) continue;

    const html = readFileSync(file, "utf8");
    for (const tag of collectTags(html, "a")) {
      const href = getAttribute(tag, "href").trim();
      if (href === "/zh/generate-image-first/" || href === "/zh/account/") {
        issues.push(`${relative} should link to a neutral entrypoint instead of ${href}: ${tag}`);
      }
    }
  }

  assert.deepEqual(issues, []);
});

test("GitHub Pages artifact uses one cache-busted stylesheet version", () => {
  assert.ok(existsSync(outDir), "_site should exist before stylesheet version checks");
  const htmlFiles = walk(outDir, file => file.endsWith(".html"));
  const versions = new Set();
  const issues = [];

  for (const file of htmlFiles) {
    const html = readFileSync(file, "utf8");
    const relative = path.relative(outDir, file).replace(/\\/g, "/");
    const matches = [...html.matchAll(/\/style\.css\?v=([^"']+)/g)];
    if (!matches.length) {
      issues.push(`${relative} does not reference the cache-busted stylesheet`);
      continue;
    }
    for (const match of matches) {
      versions.add(match[1]);
    }
  }

  assert.deepEqual(issues, []);
  assert.deepEqual([...versions], ["20260614-galleryfix1"]);
});
