from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import base64
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import threading
import time
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
CHROME = Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")
OUT_DIR = ROOT / ".qa-screenshots" / "launch-visual-snapshots"


class StaticHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        return


def slug(page, viewport):
    name = page.strip("/").replace("/", "-") or "home"
    return f"{name}-{viewport['name']}.png"


def main():
    if not CHROME.exists():
        raise SystemExit(f"Chrome not found: {CHROME}")

    pages = [
        "/",
        "/zh/",
        "/generate/?mock-result=4&detail=1&visualqa=1",
        "/zh/generate-image-first/?mock-result=4&detail=1&visualqa=1",
        "/gallery/",
        "/zh/gallery/",
        "/image-prompt-pack/",
        "/zh/image-prompt-pack/",
        "/pricing/",
        "/zh/pricing/",
        "/account/",
        "/account/login/",
        "/account/history/",
        "/zh/account/",
        "/zh/account/login/",
        "/zh/account/history/",
        "/zh/admin/members/",
        "/about/",
        "/zh/about/",
        "/contact/",
        "/zh/contact/",
        "/privacy/",
        "/zh/privacy/",
        "/terms/",
        "/zh/terms/",
        "/gallery/product/",
        "/gallery/poster/",
        "/gallery/photography/",
        "/gallery/ui/",
        "/gallery/topics/product-hero/",
        "/gallery/topics/launch/",
        "/gallery/topics/documentary/",
        "/zh/gallery/product/",
        "/zh/gallery/poster/",
        "/zh/gallery/photography/",
        "/zh/gallery/ui/",
        "/zh/gallery/topics/product-hero/",
        "/zh/gallery/topics/launch/",
        "/zh/gallery/topics/documentary/",
    ]
    viewports = [
        {"name": "mobile", "width": 390, "height": 844},
        {"name": "desktop", "width": 1440, "height": 900},
    ]

    server = ThreadingHTTPServer(("127.0.0.1", 0), StaticHandler)
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()
    tmp_profile = Path(tempfile.mkdtemp(prefix="promptarc-snapshot-profile-"))
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    cdp_script = r"""
const { spawn } = require("node:child_process");
const { writeFileSync } = require("node:fs");
const { join } = require("node:path");
const chromePath = process.argv[1];
const profile = process.argv[2];
const baseUrl = process.argv[3];
const outDir = process.argv[4];
const pages = JSON.parse(process.argv[5]);
const viewports = JSON.parse(process.argv[6]);
const chrome = spawn(chromePath, [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  "--remote-debugging-port=0",
  "--remote-debugging-address=127.0.0.1",
  `--user-data-dir=${profile}`,
  "about:blank"
], { stdio: ["ignore", "ignore", "pipe"] });

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const slug = (page, viewport) => {
  const clean = page.split("?")[0].replace(/^\/+|\/+$/g, "").replace(/\//g, "-") || "home";
  return `${clean}-${viewport.name}.png`;
};

async function readDebuggerUrl() {
  let stderr = "";
  chrome.stderr.on("data", chunk => { stderr += chunk.toString(); });
  for (let i = 0; i < 80; i += 1) {
    const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
    if (match) return match[1];
    await wait(100);
  }
  throw new Error("Chrome DevTools endpoint was not published.");
}

async function createPageWebSocket(browserWs) {
  const port = new URL(browserWs).port;
  const response = await fetch(`http://127.0.0.1:${port}/json/new`, { method: "PUT" });
  const page = await response.json();
  return page.webSocketDebuggerUrl;
}

async function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  let id = 0;
  const pending = new Map();
  const eventHandlers = new Map();
  ws.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const callbacks = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) callbacks.reject(message.error);
      else callbacks.resolve(message.result);
      return;
    }
    if (message.method && eventHandlers.has(message.method)) {
      for (const handler of eventHandlers.get(message.method)) {
        handler(message.params);
      }
    }
  };
  return {
    send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const messageId = id += 1;
        pending.set(messageId, { resolve, reject });
        ws.send(JSON.stringify({ id: messageId, method, params }));
      });
    },
    on(method, handler) {
      if (!eventHandlers.has(method)) eventHandlers.set(method, []);
      eventHandlers.get(method).push(handler);
    },
    close() { ws.close(); }
  };
}

function qaImageBody(url) {
  const vertical = /prismatic|luxury|cosmetic|workspace/.test(url);
  const width = vertical ? 1200 : 1600;
  const height = vertical ? 1800 : 1000;
  const hash = [...url].reduce((value, char) => (value + char.charCodeAt(0) * 17) % 360, 0);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="hsl(${hash} 68% 42%)"/>
        <stop offset="0.52" stop-color="hsl(${(hash + 42) % 360} 62% 22%)"/>
        <stop offset="1" stop-color="hsl(${(hash + 108) % 360} 72% 14%)"/>
      </linearGradient>
      <radialGradient id="glow" cx="66%" cy="34%" r="55%">
        <stop offset="0" stop-color="rgba(255,255,255,.42)"/>
        <stop offset="1" stop-color="rgba(255,255,255,0)"/>
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <rect width="100%" height="100%" fill="url(#glow)"/>
    <g opacity=".88">
      <rect x="${width * 0.14}" y="${height * 0.18}" width="${width * 0.58}" height="${height * 0.48}" rx="38" fill="rgba(255,255,255,.12)"/>
      <circle cx="${width * 0.68}" cy="${height * 0.34}" r="${Math.min(width, height) * 0.16}" fill="rgba(255,255,255,.24)"/>
      <path d="M ${width * 0.16} ${height * 0.74} C ${width * 0.38} ${height * 0.56}, ${width * 0.58} ${height * 0.86}, ${width * 0.84} ${height * 0.62}" fill="none" stroke="rgba(255,255,255,.46)" stroke-width="22" stroke-linecap="round"/>
    </g>
  </svg>`;
  return Buffer.from(svg).toString("base64");
}

function shouldFulfillQaImage(url) {
  return url.startsWith("https://img.promptarc.cc/assets/gallery/") && (
    url.includes("lm-architecture-") ||
    url.includes("gh-ancient-observatory") ||
    url.includes("gh-sci-fi-greenhouse") ||
    url.includes("gh-futurist-library") ||
    url.includes("gh-lunar-noodle") ||
    url.includes("gh-seed-bank") ||
    url.includes("lm-ad-")
  );
}

async function capture(client, page, viewport) {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.width < 700
  });
  await client.send("Page.navigate", { url: baseUrl + page });
  await wait(1700);
  if ((page.includes("/zh/generate-image-first/") || page.includes("/generate/")) && page.includes("detail=1")) {
    const waitForDetailImage = `new Promise(resolve => {
      const deadline = Date.now() + 25000;
      const check = () => {
        const image = document.querySelector("[data-image-first-detail-image]");
        if (image && image.complete && image.naturalWidth >= 400 && image.naturalHeight >= 300) {
          if (typeof image.decode === "function") {
            image.decode().then(() => resolve(true)).catch(() => resolve(true));
          } else {
            resolve(true);
          }
          return;
        }
        if (Date.now() > deadline) {
          resolve(false);
          return;
        }
        setTimeout(check, 120);
      };
      check();
    })`;
    const imageReady = await client.send("Runtime.evaluate", { expression: waitForDetailImage, awaitPromise: true, returnByValue: true });
    if (!imageReady.result.value) {
      const diagnostics = await client.send("Runtime.evaluate", {
        expression: `(() => {
          const image = document.querySelector("[data-image-first-detail-image]");
          if (!image) return { found: false };
          const src = image.currentSrc || image.src || "";
          const entries = src ? performance.getEntriesByName(src).map(entry => ({
            name: entry.name,
            initiatorType: entry.initiatorType,
            transferSize: entry.transferSize,
            encodedBodySize: entry.encodedBodySize,
            duration: Math.round(entry.duration)
          })) : [];
          return {
            found: true,
            src,
            complete: image.complete,
            naturalWidth: image.naturalWidth,
            naturalHeight: image.naturalHeight,
            clientWidth: image.clientWidth,
            clientHeight: image.clientHeight,
            entries
          };
        })()`,
        returnByValue: true
      });
      throw new Error(`Detail image did not finish loading for ${page} ${viewport.name}: ${JSON.stringify(diagnostics.result.value)}`);
    }
  }
  const auditExpression = `(() => {
    const body = document.body;
    const doc = document.documentElement;
    const text = String(body ? body.innerText : "").replace(/\\s+/g, " ").trim();
    const interactive = [...document.querySelectorAll("a,button,summary,input,textarea")]
      .filter(el => !!(el.offsetWidth || el.offsetHeight)).length;
    const detailImage = document.querySelector("[data-image-first-detail-image]");
    const detailImageRect = detailImage ? detailImage.getBoundingClientRect() : null;
    const detailImageAudit = detailImage ? {
      width: Math.round(detailImageRect.width),
      height: Math.round(detailImageRect.height),
      naturalWidth: detailImage.naturalWidth,
      naturalHeight: detailImage.naturalHeight,
      complete: detailImage.complete,
      objectFit: getComputedStyle(detailImage).objectFit
    } : null;
    return {
      title: document.title,
      textLength: text.length,
      interactive,
      overflow: Math.max(doc.scrollWidth, body ? body.scrollWidth : 0) - doc.clientWidth,
      bodyHeight: body ? Math.round(body.getBoundingClientRect().height) : 0,
      detailImage: detailImageAudit
    };
  })()`;
  const auditResult = await client.send("Runtime.evaluate", { expression: auditExpression, returnByValue: true });
  const audit = auditResult.result.value;
  if (!audit || audit.textLength < 20 || audit.interactive < 1 || audit.bodyHeight < 120 || audit.overflow > 2) {
    throw new Error(`Snapshot audit failed for ${page} ${viewport.name}: ${JSON.stringify(audit)}`);
  }
  if ((page.includes("/zh/generate-image-first/") || page.includes("/generate/")) && page.includes("detail=1")) {
    const image = audit.detailImage;
    const minHeight = viewport.width < 700 ? 190 : 320;
    if (!image || !image.complete || image.naturalWidth < 400 || image.naturalHeight < 300 || image.height < minHeight || image.width < 280 || image.objectFit !== "contain") {
      throw new Error(`Detail image visual audit failed for ${page} ${viewport.name}: ${JSON.stringify(image)}`);
    }
  }
  const screenshot = await client.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false
  });
  const file = join(outDir, slug(page, viewport));
  writeFileSync(file, Buffer.from(screenshot.data, "base64"));
  return { page, viewport: viewport.name, file, audit };
}

(async () => {
  let client;
  try {
    const browserWs = await readDebuggerUrl();
    const pageWs = await createPageWebSocket(browserWs);
    client = await cdp(pageWs);
    await client.send("Page.enable");
    client.on("Fetch.requestPaused", params => {
      const url = params.request && params.request.url ? params.request.url : "";
      if (shouldFulfillQaImage(url)) {
        client.send("Fetch.fulfillRequest", {
          requestId: params.requestId,
          responseCode: 200,
          responseHeaders: [
            { name: "Content-Type", value: "image/svg+xml; charset=utf-8" },
            { name: "Cache-Control", value: "no-store" }
          ],
          body: qaImageBody(url)
        }).catch(() => {});
      } else {
        client.send("Fetch.continueRequest", { requestId: params.requestId }).catch(() => {});
      }
    });
    await client.send("Fetch.enable", { patterns: [{ urlPattern: "https://img.promptarc.cc/assets/gallery/*", requestStage: "Request" }] });
    const results = [];
    for (const page of pages) {
      for (const viewport of viewports) {
        results.push(await capture(client, page, viewport));
      }
    }
    console.log(JSON.stringify(results, null, 2));
  } finally {
    if (client) client.close();
    chrome.kill();
  }
})().catch(error => {
  chrome.kill();
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});
"""

    try:
        result = subprocess.run(
            [
                "node",
                "-e",
                cdp_script,
                str(CHROME),
                str(tmp_profile),
                f"http://127.0.0.1:{server.server_port}",
                str(OUT_DIR),
                json.dumps(pages),
                json.dumps(viewports),
            ],
            cwd=ROOT,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=180,
            check=False,
        )
        if result.returncode != 0:
            raise SystemExit(result.stderr or result.stdout)
        print(result.stdout)
        print(f"Saved visual snapshots to {OUT_DIR}")
    finally:
        server.shutdown()
        server.server_close()
        shutil.rmtree(tmp_profile, ignore_errors=True)
        time.sleep(0.1)


if __name__ == "__main__":
    main()
