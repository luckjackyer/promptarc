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
  const pages = ["/", "/zh/generate-image-first/", "/gallery/", "/pricing/"];
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
            url = f"http://127.0.0.1:{server.server_port}/__responsive_audit__.html"
            command = [
                str(CHROME),
                "--headless=new",
                "--no-sandbox",
                "--disable-gpu",
                f"--user-data-dir={tmp_profile}",
                "--window-size=1440,900",
                "--virtual-time-budget=12000",
                "--dump-dom",
                url,
            ]
            result = subprocess.run(
                command,
                cwd=ROOT,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=30,
                check=False,
            )
            self.assertEqual(result.returncode, 0, result.stderr)

            match = re.search(r'<pre id="results">(.+?)</pre>', result.stdout, re.S)
            self.assertIsNotNone(match, result.stdout[-2000:])
            audits = json.loads(match.group(1))

            failures = []
            for audit in audits:
                if audit["overflow"] > 2:
                    failures.append(
                        {
                            "page": audit["page"],
                            "viewport": audit["viewport"],
                            "overflow": audit["overflow"],
                            "wide": audit["wide"],
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
