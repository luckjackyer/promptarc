import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const sitemapPath = path.join(root, "sitemap.xml");
const imageSitemapPath = path.join(root, "image-sitemap.xml");
const today = "2026-05-30";

const pages = ["/", "/gallery/", "/generate/", "/zh/", "/zh/gallery/", "/zh/generate/"];

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...pages.map((page) => `  <url><loc>https://www.promptarc.cc${page}</loc><lastmod>${today}</lastmod></url>`),
  "</urlset>"
].join("\n");

const imageSitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
  "</urlset>"
].join("\n");

fs.writeFileSync(sitemapPath, `${sitemap}\n`, "utf8");
fs.writeFileSync(imageSitemapPath, `${imageSitemap}\n`, "utf8");

console.log("Generated sitemap.xml and image-sitemap.xml for the three-page structure.");
