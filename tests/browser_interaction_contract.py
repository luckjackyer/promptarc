from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import threading
import time
import unittest


ROOT = Path(__file__).resolve().parents[1]
CHROME = Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")


class StaticHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        return


class BrowserInteractionContract(unittest.TestCase):
    @unittest.skipUnless(CHROME.exists(), "Chrome is required for browser interaction contract")
    def test_core_visible_controls_have_real_browser_behavior(self):
        server = ThreadingHTTPServer(("127.0.0.1", 0), StaticHandler)
        server_thread = threading.Thread(target=server.serve_forever, daemon=True)
        server_thread.start()

        tmp_profile = Path(tempfile.mkdtemp(prefix="promptarc-interaction-profile-"))
        cdp_script = r"""
const { spawn } = require("node:child_process");
const chromePath = process.argv[1];
const profile = process.argv[2];
const baseUrl = process.argv[3];
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
  ws.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const callbacks = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) callbacks.reject(new Error(JSON.stringify(message.error)));
      else callbacks.resolve(message.result);
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
    close() { ws.close(); }
  };
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || "Runtime evaluation failed");
  }
  return result.result.value;
}

async function navigate(client, path, width = 390, height = 844) {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 700
  });
  await client.send("Page.navigate", { url: baseUrl + path });
  await wait(1400);
}

(async () => {
  let client;
  try {
    const browserWs = await readDebuggerUrl();
    const pageWs = await createPageWebSocket(browserWs);
    client = await cdp(pageWs);
    await client.send("Page.enable");
    await client.send("Page.addScriptToEvaluateOnNewDocument", {
      source: `Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: text => {
          window.__promptarcCopiedText = String(text || "");
          return Promise.resolve();
        } }
      });`
    });
    await client.send("Page.addScriptToEvaluateOnNewDocument", {
      source: `window.__promptarcFetchLog = [];
      window.fetch = (url, options = {}) => {
        const path = String(url);
        window.__promptarcFetchLog.push({ url: path, method: options.method || "GET", body: options.body || "", headers: options.headers || {} });
        if (path.includes("formspree.io")) {
          return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } }));
        }
        if (path === "/api/auth/session") {
          return Promise.resolve(new Response(JSON.stringify({ authenticated: false }), { status: 200, headers: { "content-type": "application/json" } }));
        }
        if (path === "/api/auth/challenge") {
          return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } }));
        }
        if (path === "/api/admin/members") {
          return Promise.resolve(new Response(JSON.stringify({
            ok: true,
            members: [{ email: "member@example.com", plan: "creator", status: "active", quota: { used: 8, limit: 50 } }]
          }), { status: 200, headers: { "content-type": "application/json" } }));
        }
        return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } }));
      };`
    });

    await navigate(client, "/zh/generate-image-first/?mock-result=4&detail=1&visualqa=1", 1440, 900);
    const detailNav = await evaluate(client, `new Promise(resolve => {
      const first = document.querySelector("[data-image-first-detail-image]");
      const before = first ? first.getAttribute("src") : "";
      const next = Array.from(document.querySelectorAll(".image-first-detail-nav"))[1];
      if (!before || !next) return resolve({ ok: false, reason: "detail controls missing", before });
      next.click();
      setTimeout(() => {
        const after = document.querySelector("[data-image-first-detail-image]")?.getAttribute("src") || "";
        const selected = document.querySelector("[data-image-first-detail-thumb].is-selected")?.getAttribute("data-image-first-detail-thumb") || "";
        resolve({ ok: before !== after && selected === "1", before, after, selected });
      }, 250);
    })`);
    if (!detailNav.ok) throw new Error(`Detail next button did not switch image: ${JSON.stringify(detailNav)}`);

    const detailClose = await evaluate(client, `new Promise(resolve => {
      const close = document.querySelector("[data-image-first-detail-close]");
      const detail = document.querySelector(".image-first-detail-view");
      if (!close || !detail) return resolve({ ok: false, reason: "detail close missing" });
      close.click();
      setTimeout(() => resolve({ ok: detail.hasAttribute("hidden") }), 180);
    })`);
    if (!detailClose.ok) throw new Error(`Detail close button did not hide detail layer: ${JSON.stringify(detailClose)}`);

    await navigate(client, "/zh/gallery/", 390, 844);
    const galleryBatching = await evaluate(client, `new Promise(resolve => {
      const before = document.querySelectorAll(".gallery-card").length;
      const loadMore = document.querySelector("[data-gallery-load-more]");
      if (!loadMore) return resolve({ ok: false, reason: "load more missing", before });
      loadMore.click();
      setTimeout(() => {
        const after = document.querySelectorAll(".gallery-card").length;
        resolve({
          ok: before > 0 && before <= 18 && after > before && after <= 36,
          before,
          after,
          label: loadMore.textContent.trim(),
          hidden: loadMore.hidden
        });
      }, 250);
    })`);
    if (!galleryBatching.ok) throw new Error(`Gallery should batch-render cards and load more on demand: ${JSON.stringify(galleryBatching)}`);

    const galleryFilterBatching = await evaluate(client, `new Promise(resolve => {
      const posterFilter = document.querySelector('[data-category-link="poster"]');
      if (!posterFilter) return resolve({ ok: false, reason: "poster category link missing" });
      posterFilter.click();
      setTimeout(() => {
        const cards = Array.from(document.querySelectorAll(".gallery-card"));
        const loadMore = document.querySelector("[data-gallery-load-more]");
        resolve({
          ok: cards.length > 0 && cards.length <= 18 && cards.every(card => card.getAttribute("data-category") === "poster") && Boolean(loadMore),
          count: cards.length,
          categories: Array.from(new Set(cards.map(card => card.getAttribute("data-category")))),
          loadMoreLabel: loadMore ? loadMore.textContent.trim() : ""
        });
      }, 300);
    })`);
    if (!galleryFilterBatching.ok) throw new Error(`Gallery filters should re-render from the full dataset while preserving batching: ${JSON.stringify(galleryFilterBatching)}`);

    await navigate(client, "/zh/gallery/", 390, 844);
    const gallerySearchSync = await evaluate(client, `new Promise(resolve => {
      const inputs = Array.from(document.querySelectorAll("[data-gallery-search]"));
      if (inputs.length !== 2) return resolve({ ok: false, reason: "expected two gallery search inputs", count: inputs.length });
      const cards = Array.from(document.querySelectorAll(".gallery-card"));
      const firstSearchText = cards[0]?.getAttribute("data-gallery-search-text") || "";
      const secondSearchText = cards.find(card => card !== cards[0])?.getAttribute("data-gallery-search-text") || firstSearchText;
      const firstTerm = firstSearchText.split(/\\s+/).find(token => token.length >= 4) || "product";
      const secondTerm = secondSearchText.split(/\\s+/).find(token => token.length >= 4 && token !== firstTerm) || "poster";
      const runSearch = (input, value) => {
        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
      };
      runSearch(inputs[1], firstTerm);
      setTimeout(() => {
        const afterToolbar = {
          values: inputs.map(input => input.value),
          visible: Array.from(document.querySelectorAll(".gallery-card")).filter(card => card.style.display !== "none").length
        };
        runSearch(inputs[0], secondTerm);
        setTimeout(() => {
          const afterHero = {
            values: inputs.map(input => input.value),
            visible: Array.from(document.querySelectorAll(".gallery-card")).filter(card => card.style.display !== "none").length
          };
          resolve({
            ok: afterToolbar.values.every(value => value === firstTerm) && afterToolbar.visible > 0 && afterHero.values.every(value => value === secondTerm) && afterHero.visible > 0,
            firstTerm,
            secondTerm,
            afterToolbar,
            afterHero
          });
        }, 350);
      }, 350);
    })`);
    if (!gallerySearchSync.ok) throw new Error(`Gallery search inputs should both filter and stay synchronized: ${JSON.stringify(gallerySearchSync)}`);

    const galleryCopy = await evaluate(client, `new Promise(resolve => {
      const button = document.querySelector(".prompt-card-copy");
      if (!button) return resolve({ ok: false, reason: "copy button missing" });
      button.click();
      setTimeout(() => resolve({
        ok: button.textContent.trim() === "已复制" && Boolean(window.__promptarcCopiedText),
        label: button.textContent.trim(),
        copiedLength: String(window.__promptarcCopiedText || "").length
      }), 180);
    })`);
    if (!galleryCopy.ok) throw new Error(`Gallery copy button did not show feedback: ${JSON.stringify(galleryCopy)}`);

    await evaluate(client, `(() => {
      const button = document.querySelector(".prompt-card-remix");
      if (!button) return { ok: false, reason: "generate button missing" };
      button.click();
      return { ok: true };
    })()`);
    await wait(850);
    const galleryGenerate = await evaluate(client, `(() => ({
      ok: location.pathname === "/zh/generate-image-first/" && new URLSearchParams(location.search).has("prompt"),
      pathname: location.pathname,
      search: location.search
    }))()`);
    if (!galleryGenerate.ok) throw new Error(`Gallery generate button did not route to generator with prompt: ${JSON.stringify(galleryGenerate)}`);

    await navigate(client, "/zh/pricing/", 390, 844);
    const pricingWaitlist = await evaluate(client, `new Promise(resolve => {
      const form = document.querySelector(".pricing-waitlist-form");
      const input = form?.querySelector('input[type="email"]');
      const button = form?.querySelector('button[type="submit"]');
      const feedback = form?.querySelector(".form-feedback");
      if (!form || !input || !button || !feedback) return resolve({ ok: false, reason: "pricing waitlist form missing" });
      input.value = "buyer@example.com";
      button.click();
      setTimeout(() => resolve({
        ok: feedback.textContent.includes("已加入名单") && window.__promptarcFetchLog.some(item => item.url.includes("formspree.io")),
        feedback: feedback.textContent,
        calls: window.__promptarcFetchLog
      }), 450);
    })`);
    if (!pricingWaitlist.ok) throw new Error(`Pricing waitlist form did not submit with visible feedback: ${JSON.stringify(pricingWaitlist)}`);

    await navigate(client, "/zh/account/login/?returnTo=%2Fzh%2Fgenerate-image-first%2F", 390, 844);
    const loginSubmit = await evaluate(client, `new Promise(resolve => {
      const form = document.querySelector("[data-account-login-form]");
      const input = form?.querySelector('input[type="email"]');
      const button = form?.querySelector('button[type="submit"]');
      const status = document.querySelector("[data-account-status]");
      if (!form || !input || !button || !status) return resolve({ ok: false, reason: "login form missing" });
      input.value = "artist@example.com";
      button.click();
      setTimeout(() => resolve({
        ok: status.textContent.includes("登录链接已发送") && window.__promptarcFetchLog.some(item => item.url === "/api/auth/challenge"),
        status: status.textContent,
        calls: window.__promptarcFetchLog
      }), 450);
    })`);
    if (!loginSubmit.ok) throw new Error(`Login form did not submit with visible feedback: ${JSON.stringify(loginSubmit)}`);

    await navigate(client, "/zh/account/history/", 390, 844);
    const accountHistoryGate = await evaluate(client, `(() => {
      const empty = document.querySelector("[data-account-history] .account-empty-state");
      const login = document.querySelector('.account-actions a[href="/zh/account/login/"]');
      const generator = document.querySelector('.account-actions a[href="/zh/generate-image-first/"]');
      const text = empty ? empty.textContent : "";
      return {
        ok: Boolean(empty) && text.includes("登录后同步生成历史") && Boolean(login) && Boolean(generator),
        text,
        hasLogin: Boolean(login),
        hasGenerator: Boolean(generator)
      };
    })()`);
    if (!accountHistoryGate.ok) throw new Error(`Account history signed-out state should explain login gate and keep real actions: ${JSON.stringify(accountHistoryGate)}`);

    await navigate(client, "/zh/admin/members/?adminToken=test-admin", 390, 844);
    const adminMembers = await evaluate(client, `new Promise(resolve => {
      setTimeout(() => {
        const root = document.querySelector("[data-admin-members]");
        const text = root ? root.textContent : "";
        resolve({
          ok: text.includes("member@example.com") && text.includes("8 / 50") && window.__promptarcFetchLog.some(item => item.url === "/api/admin/members" && item.headers && item.headers["x-admin-token"] === "test-admin"),
          text,
          calls: window.__promptarcFetchLog
        });
      }, 700);
    })`);
    if (!adminMembers.ok) throw new Error(`Admin members page did not render fetched member data: ${JSON.stringify(adminMembers)}`);

    console.log(JSON.stringify({ ok: true, detailNav, detailClose, galleryBatching, galleryFilterBatching, gallerySearchSync, galleryCopy, galleryGenerate, pricingWaitlist, loginSubmit, accountHistoryGate, adminMembers }));
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
                ],
                cwd=ROOT,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=90,
                check=False,
            )
            self.assertEqual(result.returncode, 0, result.stderr or result.stdout)
            self.assertTrue(json.loads(result.stdout)["ok"])
        finally:
            server.shutdown()
            server.server_close()
            shutil.rmtree(tmp_profile, ignore_errors=True)
            time.sleep(0.1)


if __name__ == "__main__":
    unittest.main()
