from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import threading
import time
import unittest
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
CHROME = Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")


AUDIT_HTML = """<!doctype html>
<meta charset="utf-8">
<title>Responsive render audit</title>
<pre id="results">running</pre>
<script>
(async () => {
  const pages = [
    "/",
    "/zh/",
    "/generate/",
    "/zh/generate-image-first/",
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
    "/zh/gallery/topics/documentary/"
  ];
  const viewports = [
    { width: 390, height: 844 },
    { width: 768, height: 900 },
    { width: 1024, height: 900 },
    { width: 1440, height: 900 }
  ];
  const results = [];

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function audit(page, viewport) {
    const frame = document.createElement("iframe");
    frame.src = page;
    frame.style.cssText = [
      "display:block",
      "border:0",
      "position:absolute",
      "left:-10000px",
      "top:0",
      `width:${viewport.width}px`,
      `height:${viewport.height}px`
    ].join(";");
    document.body.appendChild(frame);
    await new Promise(resolve => frame.addEventListener("load", resolve, { once: true }));
    await wait(250);

    const doc = frame.contentDocument;
    const root = doc.documentElement;
    const body = doc.body;
    const clientWidth = root.clientWidth;
    const scrollWidth = Math.max(root.scrollWidth, body ? body.scrollWidth : 0);
    const overflow = scrollWidth - clientWidth;
    const wide = [...doc.body.querySelectorAll("*")]
      .map(el => {
        const rect = el.getBoundingClientRect();
        const style = frame.contentWindow.getComputedStyle(el);
        return {
          tag: el.tagName.toLowerCase(),
          className: String(el.className || "").slice(0, 120),
          id: el.id || "",
          text: String(el.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 80),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          position: style.position,
          overflowX: style.overflowX
        };
      })
      .filter(item => item.width > 0 && item.right > clientWidth + 2)
      .sort((a, b) => b.right - a.right)
      .slice(0, 5);

    frame.remove();
    return { page, viewport, clientWidth, scrollWidth, overflow, wide };
  }

  for (const page of pages) {
    for (const viewport of viewports) {
      results.push(await audit(page, viewport));
    }
  }

  document.getElementById("results").textContent = JSON.stringify(results);
})();
</script>
"""


class AuditHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if urlparse(self.path).path == "/__responsive_audit__.html":
            body = AUDIT_HTML.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        return super().do_GET()

    def log_message(self, format, *args):
        return


class RenderedResponsiveAudit(unittest.TestCase):
    @unittest.skipUnless(CHROME.exists(), "Chrome is required for rendered responsive audit")
    def test_core_pages_have_no_horizontal_document_overflow(self):
        server = ThreadingHTTPServer(("127.0.0.1", 0), AuditHandler)
        server_thread = threading.Thread(target=server.serve_forever, daemon=True)
        server_thread.start()

        tmp_profile = Path(tempfile.mkdtemp(prefix="promptarc-chrome-profile-"))
        try:
            pages = [
                "/",
                "/zh/",
                "/zh/generate-image-first/",
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
                {"width": 390, "height": 844},
                {"width": 768, "height": 900},
                {"width": 1024, "height": 900},
                {"width": 1440, "height": 900},
            ]
            cdp_script = r"""
const { spawn } = require("node:child_process");
const chromePath = process.argv[1];
const profile = process.argv[2];
const baseUrl = process.argv[3];
const pages = JSON.parse(process.argv[4]);
const viewports = JSON.parse(process.argv[5]);
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

async function readDebuggerUrl() {
  let stderr = "";
  chrome.stderr.on("data", chunk => {
    stderr += chunk.toString();
  });
  for (let i = 0; i < 80; i += 1) {
    const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
    if (match) {
      return match[1];
    }
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
  ws.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const callbacks = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) {
        callbacks.reject(message.error);
      } else {
        callbacks.resolve(message.result);
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
    close() {
      ws.close();
    }
  };
}

async function audit(client, page, viewport) {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.width < 700
  });
  await client.send("Page.navigate", { url: baseUrl + page });
  await wait(850);
  const expression = `(() => {
    const doc = document.documentElement;
    const body = document.body;
    const clientWidth = doc.clientWidth;
    const scrollWidth = Math.max(doc.scrollWidth, body ? body.scrollWidth : 0);
    const wide = [...document.querySelectorAll("body *")]
      .map(el => {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return {
          tag: el.tagName.toLowerCase(),
          className: String(el.className || "").slice(0, 120),
          id: el.id || "",
          text: String(el.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 80),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          position: style.position,
          overflowX: style.overflowX
        };
      })
      .filter(item => item.width > 0 && item.right > clientWidth + 2)
      .sort((a, b) => b.right - a.right)
      .slice(0, 5);
    const visibleControls = [...document.querySelectorAll("a, button, summary, input, textarea")]
      .filter(el => {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
      })
      .map(el => {
        const rect = el.getBoundingClientRect();
        const label = String(el.innerText || el.textContent || el.value || el.getAttribute("aria-label") || el.getAttribute("title") || "").replace(/\\s+/g, " ").trim();
        return {
          tag: el.tagName.toLowerCase(),
          type: el.getAttribute("type") || "",
          href: el.getAttribute("href") || "",
          label,
          className: String(el.className || "").slice(0, 120),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
      });
    const controlProblems = visibleControls.filter(item => {
      if (item.tag === "a" && (!item.href || item.href === "#" || /^javascript:/i.test(item.href))) return true;
      if ((item.tag === "a" || item.tag === "button" || item.tag === "summary") && !item.label) return true;
      return false;
    }).slice(0, 12);
    return { page: "${page}", viewport: ${JSON.stringify(viewport)}, clientWidth, scrollWidth, overflow: scrollWidth - clientWidth, wide, controlProblems };
  })()`;
  const result = await client.send("Runtime.evaluate", { expression, returnByValue: true });
  return result.result.value;
}

(async () => {
  let client;
  try {
    const browserWs = await readDebuggerUrl();
    const pageWs = await createPageWebSocket(browserWs);
    client = await cdp(pageWs);
    await client.send("Page.enable");
    const audits = [];
    for (const page of pages) {
      for (const viewport of viewports) {
        audits.push(await audit(client, page, viewport));
      }
    }
    console.log(JSON.stringify(audits));
  } finally {
    if (client) {
      client.close();
    }
    chrome.kill();
  }
})().catch(error => {
  chrome.kill();
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});
"""
            command = [
                "node",
                "-e",
                cdp_script,
                str(CHROME),
                str(tmp_profile),
                f"http://127.0.0.1:{server.server_port}",
                json.dumps(pages),
                json.dumps(viewports),
            ]
            result = subprocess.run(
                command,
                cwd=ROOT,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=240,
                check=False,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            audits = json.loads(result.stdout)

            failures = []
            for audit in audits:
                if not audit:
                    failures.append(
                        {
                            "page": "unknown",
                            "viewport": "unknown",
                            "error": "Rendered audit returned no data for one page/viewport pair.",
                        }
                    )
                    continue
                if audit["overflow"] > 2:
                    failures.append(
                        {
                            "page": audit["page"],
                            "viewport": audit["viewport"],
                            "overflow": audit["overflow"],
                            "wide": audit["wide"],
                        }
                    )
                if audit.get("controlProblems"):
                    failures.append(
                        {
                            "page": audit["page"],
                            "viewport": audit["viewport"],
                            "controlProblems": audit["controlProblems"],
                        }
                    )

            self.assertEqual(failures, [])
        finally:
            server.shutdown()
            server.server_close()
            shutil.rmtree(tmp_profile, ignore_errors=True)
            time.sleep(0.1)


if __name__ == "__main__":
    unittest.main()
