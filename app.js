(function () {
  const config = window.SITE_CONFIG || {};

  function updateGlobalBranding() {
    document.querySelectorAll("[data-site-name]").forEach((node) => {
      node.textContent = config.siteName || "PromptArc";
    });

    document.querySelectorAll("[data-contact-email-link]").forEach((node) => {
      const email = config.contactEmail || "";
      if (email) {
        node.textContent = email;
        node.setAttribute("href", "mailto:" + email);
        node.style.display = "";
      } else {
        node.textContent = "";
        node.removeAttribute("href");
        node.style.display = "none";
      }
    });

    document.querySelectorAll("[data-gumroad-link]").forEach((node) => {
      node.setAttribute("href", config.gumroadUrl || "https://gumroad.com/");
    });

    document.querySelectorAll("[data-affiliate-link]").forEach((node) => {
      const key = node.getAttribute("data-affiliate-link");
      const url = config.affiliateLinks && config.affiliateLinks[key];
      if (url) {
        node.setAttribute("href", url);
      }
    });
  }

  function initCloudflareAnalytics() {
    if (!config.cloudflareAnalyticsToken) {
      return;
    }
    const script = document.createElement("script");
    script.defer = true;
    script.src = "https://static.cloudflareinsights.com/beacon.min.js";
    script.setAttribute("data-cf-beacon", JSON.stringify({ token: config.cloudflareAnalyticsToken }));
    document.head.appendChild(script);
  }

  function copyText(targetSelector) {
    const target = document.querySelector(targetSelector);
    if (!target) {
      return;
    }
    navigator.clipboard.writeText(target.textContent).then(() => {
      const button = document.querySelector('[data-copy-target="' + targetSelector + '"]');
      if (!button) {
        return;
      }
      const original = button.textContent;
      button.textContent = "Copied";
      window.setTimeout(() => {
        button.textContent = original;
      }, 1200);
    });
  }

  function handleCopyButtons() {
    document.querySelectorAll("[data-copy-target]").forEach((button) => {
      button.addEventListener("click", function () {
        copyText(button.getAttribute("data-copy-target"));
      });
    });
  }

  function buildPrompt(formData) {
    const workflow = formData.get("workflow");
    const audience = formData.get("audience");
    const goal = formData.get("goal");
    const context = formData.get("context") || "No extra context provided.";
    const tone = formData.get("tone");
    const format = formData.get("format");
    const constraints = formData.get("constraints") || "No extra constraints provided.";

    const roleMap = {
      strategy: "an experienced chief of staff and strategic operator",
      writing: "a senior conversion-focused writer",
      seo: "an SEO strategist who writes practical briefs",
      support: "a calm support specialist who protects trust and clarity",
      research: "a research analyst who synthesizes source material cleanly",
      sales: "a sharp sales operator who writes concise outreach"
    };

    const instructionMap = {
      strategy: "Create a strategic output that helps the user make a decision, align a team, or plan next actions.",
      writing: "Draft content that is useful, specific, and easy to edit into a final publishable asset.",
      seo: "Turn the goal into an SEO-ready content brief with intent, sections, questions to answer, and conversion opportunities.",
      support: "Draft a response that acknowledges the issue, explains the path forward, and stays human.",
      research: "Synthesize information into themes, tradeoffs, and action points instead of repeating raw notes.",
      sales: "Write outreach that is personalized, short, and connected to a relevant business trigger."
    };

    return [
      "You are " + (roleMap[workflow] || "a practical AI assistant") + ".",
      "",
      "Task:",
      instructionMap[workflow] || "Help the user complete the requested task well.",
      "",
      "Audience:",
      audience,
      "",
      "Primary goal:",
      goal,
      "",
      "Important context:",
      context,
      "",
      "Tone:",
      tone,
      "",
      "Constraints:",
      constraints,
      "",
      "Output format:",
      format,
      "",
      "Before finalizing, check that the response is specific, avoids filler, and gives clear next steps where relevant."
    ].join("\n");
  }

  function initPromptTool() {
    const form = document.getElementById("prompt-form");
    const output = document.getElementById("prompt-output");
    const checklist = document.getElementById("prompt-checklist");
    const presetButton = document.querySelector('[data-load-preset="seo"]');

    if (!form || !output || !checklist) {
      return;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const formData = new FormData(form);
      output.textContent = buildPrompt(formData);
      window.dispatchEvent(new CustomEvent("promptarc:event", { detail: { name: "prompt_generated" } }));
      checklist.innerHTML = "";

      [
        "Matches the workflow to a clear AI role",
        "Explains the goal and audience in plain language",
        "Separates context from constraints",
        "Pushes for a concrete output format"
      ].forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        checklist.appendChild(li);
      });
    });

    if (presetButton) {
      presetButton.addEventListener("click", function () {
        form.workflow.value = "seo";
        form.audience.value = "founders comparing AI SEO tools";
        form.goal.value = "Create an SEO content brief for a bottom-of-funnel comparison article";
        form.context.value = "The article should target a long-tail keyword, include commercial intent, and recommend a single next step.";
        form.tone.value = "clear and practical";
        form.format.value = "table plus action items";
        form.constraints.value = "Keep the outline tight, include FAQ ideas, and suggest one conversion CTA.";
      });
    }

    const params = new URLSearchParams(window.location.search);
    const imagePrompt = params.get("prompt");
    if (imagePrompt) {
      form.workflow.value = "writing";
      form.audience.value = "AI image creators and visual marketers";
      form.goal.value = "Refine this image prompt into a clearer reusable prompt";
      form.context.value = imagePrompt;
      form.tone.value = "clear and practical";
      form.format.value = "final draft ready to edit";
      form.constraints.value = "Keep the visual direction specific, preserve important style cues, and avoid unsafe or copyrighted character instructions.";
      output.textContent = [
        "Refine this image-generation prompt into a reusable visual prompt:",
        "",
        imagePrompt,
        "",
        "Return:",
        "1. A polished final prompt",
        "2. Negative prompt guidance",
        "3. Three safe style variations"
      ].join("\n");
    }
  }

  function initFilters() {
    const buttons = document.querySelectorAll("[data-filter]");
    const cards = document.querySelectorAll("[data-category]");

    if (!buttons.length || !cards.length) {
      return;
    }

    buttons.forEach((button) => {
      button.addEventListener("click", function () {
        const filter = button.getAttribute("data-filter");
        buttons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");

        cards.forEach((card) => {
          const category = card.getAttribute("data-category");
          const show = filter === "all" || category === filter;
          card.style.display = show ? "" : "none";
        });
      });
    });
  }

  function initEmailGates() {
    document.querySelectorAll("[data-email-gate]").forEach((form) => {
      const feedback = form.querySelector(".form-feedback");
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        const email = form.querySelector('input[type="email"]').value.trim();

        if (!email) {
          if (feedback) {
            feedback.textContent = "Please enter a valid email address.";
          }
          return;
        }

        const startDownload = function () {
          const link = document.createElement("a");
          link.href = config.leadMagnetUrl || "/assets/prompt-ops-starter-kit.txt";
          link.download = "";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };

        if (config.newsletterEndpoint) {
          fetch(config.newsletterEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ email: email, source: window.location.pathname })
          }).then(() => {
          if (feedback) {
            feedback.textContent = config.newsletterSuccessMessage || "Thanks. Your download should start automatically.";
          }
          window.dispatchEvent(new CustomEvent("promptarc:event", { detail: { name: "free_pack_downloaded" } }));
          startDownload();
          }).catch(() => {
            if (feedback) {
              feedback.textContent = "The email endpoint could not be reached, so the download is starting directly.";
            }
            startDownload();
          });
        } else {
          if (feedback) {
            feedback.textContent = "Download unlocked. Add an email platform endpoint in config.js when you are ready to capture subscribers.";
          }
          window.dispatchEvent(new CustomEvent("promptarc:event", { detail: { name: "free_pack_downloaded" } }));
          startDownload();
        }
      });
    });
  }

  function initGallery() {
    const grid = document.querySelector("[data-gallery-grid]");
    const items = window.PROMPTARC_GALLERY || [];

    if (!grid || !items.length) {
      return;
    }

    grid.innerHTML = "";
    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "gallery-card card";
      card.setAttribute("data-category", item.category);

      const tags = item.tags.map((tag) => '<span class="tag">' + tag + '</span>').join("");
      const encodedPrompt = encodeURIComponent(item.prompt);

      card.innerHTML = [
        '<div class="gallery-image-wrap">',
        '<img src="' + item.imageUrl + '" alt="' + item.title + ' AI image example" loading="lazy">',
        '<span class="gallery-category">' + item.category + '</span>',
        '</div>',
        '<div class="gallery-card-body">',
        '<h3>' + item.title + '</h3>',
        '<div class="gallery-tags">' + tags + '</div>',
        '<p class="gallery-prompt" id="prompt-' + item.id + '">' + item.prompt + '</p>',
        '<div class="gallery-actions">',
        '<button class="button ghost" type="button" data-copy-target="#prompt-' + item.id + '">Copy prompt</button>',
        '<a class="button secondary" href="/tool/?mode=image&prompt=' + encodedPrompt + '">Use this prompt</a>',
        '</div>',
        '<a class="source-link" href="' + item.sourceUrl + '" target="_blank" rel="noopener noreferrer">Source example</a>',
        '</div>'
      ].join("");

      grid.appendChild(card);
    });

    handleCopyButtons();
  }

  function initOutboundEventTracking() {
    document.querySelectorAll("[data-affiliate-link], [data-gumroad-link]").forEach((link) => {
      link.addEventListener("click", function () {
        window.dispatchEvent(new CustomEvent("promptarc:event", {
          detail: {
            name: link.hasAttribute("data-gumroad-link") ? "gumroad_clicked" : "recommended_tool_clicked",
            target: link.getAttribute("href")
          }
        }));
      });
    });
  }

  initCloudflareAnalytics();
  updateGlobalBranding();
  handleCopyButtons();
  initGallery();
  initPromptTool();
  initFilters();
  initEmailGates();
  initOutboundEventTracking();
})();
