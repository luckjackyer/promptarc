const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");

function createElement(tagName) {
  return {
    tagName: tagName.toUpperCase(),
    value: "",
    textContent: "",
    hidden: false,
    innerHTML: "",
    querySelector(selector) {
      if (selector === 'button[type="submit"]') {
        return null;
      }
      return null;
    },
    addEventListener() {}
  };
}

function runGeneratorPage(search) {
  const prompt = createElement("textarea");
  const ratio = createElement("select");
  const resolution = createElement("select");
  const guardrails = createElement("textarea");
  const form = createElement("form");
  form.prompt = prompt;
  form.ratio = ratio;
  form.resolution = resolution;
  form.guardrails = guardrails;
  form.querySelector = function (selector) {
    if (selector === 'button[type="submit"]') {
      return null;
    }
    return null;
  };

  const context = {
    console,
    URLSearchParams,
    FormData: function () {},
    CustomEvent: function CustomEvent(type, init) {
      this.type = type;
      this.detail = init && init.detail;
    },
    document: {
      documentElement: { lang: "zh-CN" },
      body: { dataset: { page: "prompt-hub" }, classList: { add() {}, remove() {} } },
      querySelector() {
        return null;
      },
      querySelectorAll() {
        return [];
      },
      getElementById(id) {
        if (id === "image-generator-form") {
          return form;
        }
        return null;
      },
      addEventListener() {},
      createElement
    },
    window: {
      location: { search, pathname: "/zh/generate/" },
      localStorage: { getItem() { return null; }, setItem() {} },
      addEventListener() {},
      dispatchEvent() {}
    },
    navigator: {}
  };
  context.window.window = context.window;
  context.window.document = context.document;
  context.globalThis = context.window;

  vm.runInNewContext(appSource, context);
  return prompt.value;
}

const expected = "Create a product hero image with warm light.";
const actual = runGeneratorPage("?prompt=" + encodeURIComponent(expected) + "&category=product");

if (actual !== expected) {
  console.error("Expected generator prompt textarea to be prefilled.");
  console.error("Expected:", expected);
  console.error("Actual:", actual);
  process.exit(1);
}

console.log("generator prefill test passed");
