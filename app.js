(function () {
  const config = window.SITE_CONFIG || {};
  const isChinese = document.documentElement.lang && document.documentElement.lang.toLowerCase().startsWith("zh");

  const i18n = {
    copied: isChinese ? "已复制" : "Copied",
    invalidEmail: isChinese ? "请输入有效的邮箱地址。" : "Please enter a valid email address.",
    downloadFallback: isChinese ? "邮箱接口暂时不可用，已直接开始下载。" : "The email endpoint could not be reached, so the download is starting directly.",
    downloadUnlocked: isChinese ? "下载已解锁。后续可在 config.js 中接入邮件平台以收集订阅者。" : "Download unlocked. Add an email platform endpoint in config.js when you are ready to capture subscribers.",
    newsletterSuccess: config.newsletterSuccessMessage || (isChinese ? "感谢提交，下载即将开始。" : "Thanks. Your download should start automatically."),
    checklist: isChinese
      ? [
          "工作流与 AI 角色匹配清晰",
          "目标和受众表达明确",
          "上下文与限制条件分离",
          "输出格式具体可执行"
        ]
      : [
          "Matches the workflow to a clear AI role",
          "Explains the goal and audience in plain language",
          "Separates context from constraints",
          "Pushes for a concrete output format"
        ],
    galleryCountSuffix: isChinese ? "个示例" : "examples shown",
    copyPrompt: isChinese ? "复制提示词" : "Copy prompt",
    usePrompt: isChinese ? "使用此提示词" : "Use this prompt",
    sourceExample: isChinese ? "查看来源示例" : "Source example",
    closeImagePreview: isChinese ? "关闭大图预览" : "Close image preview",
    previousImage: isChinese ? "查看上一张图片" : "View previous image",
    nextImage: isChinese ? "查看下一张图片" : "View next image",
    downloadImage: isChinese ? "下载图片" : "Download image",
    openPreview: isChinese ? "打开大图预览" : "Open larger preview",
    imageAltSuffix: isChinese ? "AI 图像示例" : "AI image example",
    previewPrompt: isChinese ? "查看详情" : "Preview",
    savePrompt: isChinese ? "收藏" : "Save",
    savedPrompt: isChinese ? "已收藏" : "Saved",
    copyVisible: isChinese ? "已复制当前可见提示词" : "Copied visible prompts",
    noVisiblePrompts: isChinese ? "当前没有可复制的提示词" : "No visible prompts to copy",
    shuffleDone: isChinese ? "已随机换一批" : "Shuffled",
    sortLatest: isChinese ? "排序：最新" : "Sort: latest",
    sortOldest: isChinese ? "排序：最旧" : "Sort: oldest",
    sortRandom: isChinese ? "排序：随机" : "Sort: random",
    savedOnly: isChinese ? "只看收藏" : "Saved only",
    allItems: isChinese ? "查看全部" : "Show all",
    emptyGalleryTitle: isChinese ? "当前没有匹配结果" : "No prompts match this view",
    emptyGalleryBody: isChinese ? "试试切换分类、清空搜索，或者回到全部内容继续浏览。" : "Try another category, clear your search, or switch back to all prompts.",
    closePreview: isChinese ? "关闭详情" : "Close preview",
    detailUsePrompt: isChinese ? "用此提示词改写" : "Use this prompt",
    detailCopyPrompt: isChinese ? "复制完整提示词" : "Copy full prompt"
  };
  const toolPath = isChinese ? "/zh/tool/" : "/tool/";

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

  function copyPlainText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise((resolve, reject) => {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();

      try {
        const success = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (success) {
          resolve();
        } else {
          reject(new Error("copy failed"));
        }
      } catch (error) {
        document.body.removeChild(textarea);
        reject(error);
      }
    });
  }

  function copyText(targetSelector) {
    const target = document.querySelector(targetSelector);
    if (!target) {
      return;
    }

    copyPlainText(target.textContent || "").then(() => {
      const button = document.querySelector('[data-copy-target="' + targetSelector + '"]');
      if (!button) {
        return;
      }
      const original = button.textContent;
      button.textContent = i18n.copied;
      window.setTimeout(() => {
        button.textContent = original;
      }, 1200);
    });
  }

  let copyButtonsBound = false;
  function handleCopyButtons() {
    if (copyButtonsBound) {
      return;
    }

    copyButtonsBound = true;
    document.addEventListener("click", function (event) {
      const button = event.target.closest("[data-copy-target]");
      if (!button) {
        return;
      }

      copyText(button.getAttribute("data-copy-target"));
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

    const imageWorkflowMap = {
      "image-product": isChinese ? "产品广告" : "product advertising image",
      "image-poster": isChinese ? "海报设计" : "poster design",
      "image-ui": isChinese ? "UI mockup" : "UI mockup",
      "image-character": isChinese ? "角色设计" : "character design",
      "image-portrait": isChinese ? "人像摄影" : "portrait image",
      "image-test": isChinese ? "风格测试" : "style test"
    };

    if (imageWorkflowMap[workflow]) {
      if (isChinese) {
        return [
          "请生成一张" + imageWorkflowMap[workflow] + "。",
          "",
          "主体：",
          audience,
          "",
          "场景 / 目标：",
          goal,
          "",
          "风格与构图：",
          context,
          "",
          "视觉气质：",
          tone,
          "",
          "输出格式：",
          format,
          "",
          "限制条件：",
          constraints,
          "",
          "质量要求：主体清晰，构图干净，光线合理，避免乱码文字、畸形结构和多余物体。"
        ].join("\n");
      }

      return [
        "Create a " + imageWorkflowMap[workflow] + ".",
        "",
        "Subject:",
        audience,
        "",
        "Scene / outcome:",
        goal,
        "",
        "Style and composition:",
        context,
        "",
        "Visual mood:",
        tone,
        "",
        "Output format:",
        format,
        "",
        "Guardrails:",
        constraints,
        "",
        "Quality bar: clear subject, clean composition, coherent lighting, no text artifacts, no distorted structures, no extra objects."
      ].join("\n");
    }

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

    if (isChinese) {
      return [
        "你是一位" + (roleMap[workflow] || "务实的 AI 助手") + "。",
        "",
        "任务：",
        instructionMap[workflow] || "帮助用户高质量完成这项任务。",
        "",
        "目标受众：",
        audience,
        "",
        "核心目标：",
        goal,
        "",
        "重要上下文：",
        context,
        "",
        "语气风格：",
        tone,
        "",
        "限制条件：",
        constraints,
        "",
        "输出格式：",
        format,
        "",
        "在最终回答前，请确认内容具体、避免空话，并在合适时给出清晰的下一步建议。"
      ].join("\n");
    }

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
    const presetButtons = document.querySelectorAll("[data-load-preset]");

    if (!form || !output || !checklist) {
      return;
    }

    const loadPreset = function (presetKey) {
      if (presetKey === "seo") {
        form.workflow.value = "seo";
        form.audience.value = isChinese ? "正在对比 AI SEO 工具的创业者" : "founders comparing AI SEO tools";
        form.goal.value = isChinese ? "为一篇高转化比较型文章生成 SEO 内容大纲" : "Create an SEO content brief for a bottom-of-funnel comparison article";
        form.context.value = isChinese ? "文章应覆盖长尾关键词、商业意图，并明确推荐一个下一步动作。" : "The article should target a long-tail keyword, include commercial intent, and recommend a single next step.";
        form.tone.value = "clear and practical";
        form.format.value = "table plus action items";
        form.constraints.value = isChinese ? "结构要紧凑，包含 FAQ 思路，并给出一个转化 CTA 建议。" : "Keep the outline tight, include FAQ ideas, and suggest one conversion CTA.";
        return;
      }

      if (presetKey === "writing") {
        form.workflow.value = "writing";
        form.audience.value = isChinese ? "准备上线新产品页面的 SaaS 访客" : "SaaS visitors evaluating a newly launched product page";
        form.goal.value = isChinese ? "生成一个高转化英文落地页首稿" : "Draft a high-converting landing page first draft";
        form.context.value = isChinese ? "产品卖点是更快生成高质量提示词，并把浏览流量转成订阅和数字产品销售。" : "The product helps users generate stronger prompts faster and turns discovery traffic into subscribers and digital product sales.";
        form.tone.value = "friendly and persuasive";
        form.format.value = "final draft ready to edit";
        form.constraints.value = isChinese ? "包含价值主张、功能亮点、社会证明占位和明确 CTA，避免空泛口号。" : "Include a value proposition, feature highlights, social proof placeholders, and one clear CTA. Avoid fluffy slogans.";
        return;
      }

      if (presetKey === "research") {
        form.workflow.value = "research";
        form.audience.value = isChinese ? "需要快速决策的产品负责人" : "product operators who need a quick decision summary";
        form.goal.value = isChinese ? "汇总竞品研究并输出可执行建议" : "Synthesize competitor research into an actionable recommendation";
        form.context.value = isChinese ? "请比较多个 AI prompt 工具或内容站的首页、转化模块和 SEO 结构。" : "Compare multiple AI prompt tools or content sites across homepage structure, conversion modules, and SEO patterns.";
        form.tone.value = "analytical and structured";
        form.format.value = "table plus action items";
        form.constraints.value = isChinese ? "按优先级排序，指出值得模仿的地方、风险点和下一步动作。" : "Rank the findings by priority, call out what to imitate, what to avoid, and what to do next.";
        return;
      }

      if (presetKey === "support") {
        form.workflow.value = "support";
        form.audience.value = isChinese ? "对 AI 结果不满意的付费用户" : "a paying customer who is unhappy with an AI output";
        form.goal.value = isChinese ? "写一封既安抚情绪又推动解决问题的回复" : "Write a support reply that calms the user and moves the issue forward";
        form.context.value = isChinese ? "用户说生成结果太泛、没有达到广告创意要求，希望得到更具体的帮助。" : "The customer says the generated result feels too generic and did not meet their ad-creative needs, and they want more specific help.";
        form.tone.value = "clear and practical";
        form.format.value = "final draft ready to edit";
        form.constraints.value = isChinese ? "语气专业、友好，不要推责，给出明确下一步和时间预期。" : "Keep the tone professional and friendly, avoid defensiveness, and include a concrete next step with timing expectations.";
        return;
      }

      if (presetKey === "image-product") {
        form.workflow.value = "image-product";
        form.audience.value = isChinese ? "透明琥珀色香水瓶，黑色瓶盖，标签区域清晰" : "transparent amber perfume bottle with a black cap and readable label area";
        form.goal.value = isChinese ? "高端电商首图，画面干净，右侧留出标题空间" : "premium ecommerce hero image with a clean background and copy space on the right";
        form.context.value = isChinese ? "浅色石材台面，柔和侧逆光，瓶身边缘有清晰高光，轻微倒影。" : "light stone pedestal, soft side backlight, crisp rim highlights, subtle reflection.";
        form.tone.value = "minimal premium design";
        form.format.value = "square 1:1 image";
        form.constraints.value = isChinese ? "不要多余瓶子，不要乱码文字，不要变形瓶盖，标签保持清晰。" : "No extra bottles, no text artifacts, no distorted cap, keep the label area readable.";
        return;
      }

      if (presetKey === "image-poster") {
        form.workflow.value = "image-poster";
        form.audience.value = isChinese ? "春季城市艺术节主视觉海报" : "spring city arts festival key visual poster";
        form.goal.value = isChinese ? "可用于活动宣传的竖版海报，中心有清晰视觉焦点" : "vertical event poster with a clear central visual focus";
        form.context.value = isChinese ? "城市街道、花瓣、柔和自然光，顶部保留标题区域，底部保留日期信息区域。" : "city street, petals, soft daylight, title space at the top, date information area at the bottom.";
        form.tone.value = "playful colorful campaign";
        form.format.value = "vertical 4:5 social image";
        form.constraints.value = isChinese ? "不要生成真实文字，不要拥挤构图，不要多余 logo。" : "No real text, no crowded composition, no extra logos.";
        return;
      }

      if (presetKey === "image-ui") {
        form.workflow.value = "image-ui";
        form.audience.value = isChinese ? "AI 写作工具的移动端仪表盘界面" : "mobile dashboard UI for an AI writing tool";
        form.goal.value = isChinese ? "干净的产品展示 mockup，突出输入框、历史记录和主 CTA" : "clean product mockup showing input box, history cards, and primary CTA";
        form.context.value = isChinese ? "白色界面，清晰层级，真实手机屏幕比例，柔和阴影和现代 SaaS 风格。" : "white interface, clear hierarchy, realistic phone screen ratio, soft shadows, modern SaaS style.";
        form.tone.value = "clean commercial photography";
        form.format.value = "mobile screen mockup";
        form.constraints.value = isChinese ? "不要乱码文字，不要过度装饰，不要密集小字。" : "No text artifacts, no excessive decoration, no dense tiny text.";
        return;
      }

      if (presetKey === "image-character") {
        form.workflow.value = "image-character";
        form.audience.value = isChinese ? "友好的机器人助手角色，适合 AI 工具品牌" : "friendly robot assistant character for an AI tool brand";
        form.goal.value = isChinese ? "可用于网站空状态或引导页的角色图" : "character illustration for website empty states or onboarding screens";
        form.context.value = isChinese ? "简洁轮廓，柔和表情，站姿自然，背景简单，颜色不刺眼。" : "simple silhouette, gentle expression, natural standing pose, plain background, restrained colors.";
        form.tone.value = "playful colorful campaign";
        form.format.value = "square 1:1 image";
        form.constraints.value = isChinese ? "不要复杂机械细节，不要多只手，不要品牌 logo。" : "No complex mechanical clutter, no extra hands, no brand logos.";
      }
    };

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const formData = new FormData(form);
      output.textContent = buildPrompt(formData);
      window.dispatchEvent(new CustomEvent("promptarc:event", { detail: { name: "prompt_generated" } }));
      checklist.innerHTML = "";

      i18n.checklist.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        checklist.appendChild(li);
      });
    });

    presetButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const presetKey = button.getAttribute("data-load-preset");
        if (presetKey) {
          loadPreset(presetKey);
        }
      });
    });

    const params = new URLSearchParams(window.location.search);
    const imagePrompt = params.get("prompt");
    if (imagePrompt) {
      form.workflow.value = "writing";
      form.audience.value = isChinese ? "AI 图像创作者与视觉营销人员" : "AI image creators and visual marketers";
      form.goal.value = isChinese ? "把这段图像提示词改写成更清晰、可复用的版本" : "Refine this image prompt into a clearer reusable prompt";
      form.context.value = imagePrompt;
      form.tone.value = "clear and practical";
      form.format.value = "final draft ready to edit";
      form.constraints.value = isChinese ? "保留关键风格线索，保持视觉方向具体，并避免不安全或侵权角色指令。" : "Keep the visual direction specific, preserve important style cues, and avoid unsafe or copyrighted character instructions.";
      output.textContent = isChinese
        ? [
            "请把下面这段图像生成提示词润色成一个可复用的高质量视觉提示词：",
            "",
            imagePrompt,
            "",
            "请输出：",
            "1. 一版优化后的最终提示词",
            "2. 一组负面提示词建议",
            "3. 三种安全可用的风格变体"
          ].join("\n")
        : [
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

  function initCollectionExplorer(options) {
    const buttons = Array.from(document.querySelectorAll(options.buttonSelector));
    const cards = Array.from(document.querySelectorAll(options.cardSelector));
    const searchInput = document.querySelector(options.searchSelector);
    const countNode = document.querySelector(options.countSelector);

    if (!buttons.length || !cards.length) {
      return;
    }

    let activeFilter = "all";

    function apply() {
      const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
      let visible = 0;

      cards.forEach((card) => {
        const category = card.getAttribute("data-category") || "";
        const haystack = (card.getAttribute(options.searchAttribute) || "").toLowerCase();
        const matchesFilter = activeFilter === "all" || category === activeFilter;
        const matchesSearch = !query || haystack.includes(query);
        const show = matchesFilter && matchesSearch;
        card.style.display = show ? "" : "none";
        if (show) {
          visible += 1;
        }
      });

      if (countNode) {
        countNode.textContent = visible + " " + options.countSuffix;
      }
    }

    function syncButtons() {
      buttons.forEach((button) => {
        const value = button.getAttribute(options.filterAttribute) || "all";
        button.classList.toggle("active", value === activeFilter);
      });
    }

    buttons.forEach((button) => {
      button.addEventListener("click", function () {
        activeFilter = button.getAttribute(options.filterAttribute) || "all";
        syncButtons();
        apply();
        const scrollTarget = button.getAttribute("data-scroll-target");
        if (scrollTarget) {
          const targetNode = document.querySelector(scrollTarget);
          if (targetNode) {
            targetNode.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      });
    });

    if (searchInput) {
      searchInput.addEventListener("input", apply);
    }

    syncButtons();
    apply();
  }

  function initEmailGates() {
    document.querySelectorAll("[data-email-gate]").forEach((form) => {
      const feedback = form.querySelector(".form-feedback");
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        const email = form.querySelector('input[type="email"]').value.trim();

        if (!email) {
          if (feedback) {
            feedback.textContent = i18n.invalidEmail;
          }
          return;
        }

        const startDownload = function () {
          const link = document.createElement("a");
          link.href = form.getAttribute("data-download-url") || config.leadMagnetUrl || "/assets/prompt-ops-starter-kit.txt";
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
          })
            .then(() => {
              if (feedback) {
                feedback.textContent = i18n.newsletterSuccess;
              }
              window.dispatchEvent(new CustomEvent("promptarc:event", { detail: { name: "free_pack_downloaded" } }));
              startDownload();
            })
            .catch(() => {
              if (feedback) {
                feedback.textContent = i18n.downloadFallback;
              }
              startDownload();
            });
        } else {
          if (feedback) {
            feedback.textContent = i18n.downloadUnlocked;
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

    const pageCategory = grid.getAttribute("data-gallery-category");
    const sortButton = document.querySelector("[data-gallery-sort]");
    const savedOnlyButton = document.querySelector("[data-show-saved-gallery]");
    const fullSet = pageCategory && pageCategory !== "all" ? items.filter((item) => item.category === pageCategory) : items.slice();
    let visibleItems = fullSet.slice();
    let sortMode = "latest";
    let savedOnly = false;
    const savedPrompts = new Set(JSON.parse(window.localStorage.getItem("promptarc:saved-prompts") || "[]"));
    const categoryLabelMap = isChinese
      ? {
          product: "产品广告",
          poster: "海报设计",
          ui: "UI Mockup",
          character: "角色设计",
          portrait: "人像摄影",
          test: "风格测试"
        }
      : {
          product: "Product ads",
          poster: "Poster design",
          ui: "UI mockups",
          character: "Character design",
          portrait: "Portrait prompts",
          test: "Style tests"
        };

    function persistSavedPrompts() {
      window.localStorage.setItem("promptarc:saved-prompts", JSON.stringify(Array.from(savedPrompts)));
    }

    function getPromptLead(item) {
      const firstSentence = (item.prompt || "").split(". ")[0] || item.prompt || "";
      return firstSentence.endsWith(".") ? firstSentence : firstSentence + ".";
    }

    function getSourceLabel(item) {
      try {
        return new URL(item.sourceUrl).hostname.replace(/^www\./, "");
      } catch {
        return isChinese ? "来源" : "Source";
      }
    }

    function applyCurrentView() {
      const sourceItems = savedOnly ? fullSet.filter((item) => savedPrompts.has(item.id)) : fullSet.slice();
      if (sortMode === "oldest") {
        visibleItems = sourceItems.slice().reverse();
      } else if (sortMode === "random") {
        visibleItems = sourceItems
          .map((item) => ({ item, sort: Math.random() }))
          .sort((a, b) => a.sort - b.sort)
          .map((entry) => entry.item);
      } else {
        visibleItems = sourceItems;
      }
    }

    function syncGalleryControls() {
      if (sortButton) {
        sortButton.textContent =
          sortMode === "oldest" ? i18n.sortOldest : sortMode === "random" ? i18n.sortRandom : i18n.sortLatest;
        sortButton.classList.toggle("active", sortMode !== "latest");
        sortButton.setAttribute("aria-pressed", sortMode !== "latest");
      }
      if (savedOnlyButton) {
        savedOnlyButton.textContent = savedOnly ? i18n.allItems : i18n.savedOnly;
        savedOnlyButton.classList.toggle("active", savedOnly);
        savedOnlyButton.setAttribute("aria-pressed", savedOnly ? "true" : "false");
      }
    }

    function renderGallery() {
      applyCurrentView();
      grid.innerHTML = "";
      if (!visibleItems.length) {
        const empty = document.createElement("article");
        empty.className = "card gallery-empty-state";
        empty.innerHTML = [
          "<h3>" + i18n.emptyGalleryTitle + "</h3>",
          "<p>" + i18n.emptyGalleryBody + "</p>"
        ].join("");
        grid.appendChild(empty);
        return;
      }
      visibleItems.forEach((item) => {
      const card = document.createElement("article");
      card.className = "gallery-card card";
      card.setAttribute("data-category", item.category);
      card.setAttribute("data-gallery-id", item.id);
      card.setAttribute(
        "data-gallery-search-text",
        [item.title, item.category, item.tags.join(" "), item.prompt].join(" ").toLowerCase()
      );

      const tags = item.tags.map((tag) => '<span class="tag">' + tag + "</span>").join("");
      const encodedPrompt = encodeURIComponent(item.prompt);
      const categoryLabel = categoryLabelMap[item.category] || item.category;
      const promptLead = getPromptLead(item);
      const sourceLabel = getSourceLabel(item);
      card.innerHTML = [
        '<div class="gallery-image-wrap prompt-card-media">',
        '<img src="' + item.imageUrl + '" alt="' + item.title + " " + i18n.imageAltSuffix + '" loading="lazy" data-zoomable="true">',
        "</div>",
        '<div class="gallery-card-body prompt-card-body">',
        '<div class="prompt-card-topline">',
        '<span class="gallery-category prompt-card-badge">' + categoryLabel + "</span>",
        '<a class="source-link prompt-card-source" href="' + item.sourceUrl + '" target="_blank" rel="noopener noreferrer">' + sourceLabel + "</a>",
        "</div>",
        "<h3>" + item.title + "</h3>",
        '<p class="prompt-card-summary">' + promptLead + "</p>",
        '<div class="gallery-tags">' + tags + "</div>",
        '<p class="gallery-prompt" id="prompt-' + item.id + '">' + item.prompt + "</p>",
        '<div class="gallery-actions">',
        '<button class="button ghost" type="button" data-preview-prompt="' + item.id + '">' + i18n.previewPrompt + "</button>",
        '<button class="button ghost" type="button" data-copy-target="#prompt-' + item.id + '">' + i18n.copyPrompt + "</button>",
        '<a class="button secondary" href="' + toolPath + '?mode=image&prompt=' + encodedPrompt + '">' + i18n.usePrompt + "</a>",
        '<button class="button ghost save-button' + (savedPrompts.has(item.id) ? " active" : "") + '" type="button" data-save-prompt="' + item.id + '">' + (savedPrompts.has(item.id) ? i18n.savedPrompt : i18n.savePrompt) + "</button>",
        "</div>",
        "</div>"
      ].join("");

      grid.appendChild(card);
      });
    }

    syncGalleryControls();
    renderGallery();

    if (sortButton) {
      sortButton.addEventListener("click", function () {
        if (sortMode === "latest") {
          sortMode = "oldest";
        } else if (sortMode === "oldest") {
          sortMode = "random";
        } else {
          sortMode = "latest";
        }
        syncGalleryControls();
        renderGallery();
      });
    }

    if (savedOnlyButton) {
      savedOnlyButton.addEventListener("click", function () {
        savedOnly = !savedOnly;
        syncGalleryControls();
        renderGallery();
      });
    }

    document.querySelectorAll("[data-random-gallery]").forEach((button) => {
      button.addEventListener("click", function () {
        sortMode = "random";
        syncGalleryControls();
        renderGallery();
        button.textContent = i18n.shuffleDone;
        window.setTimeout(() => {
          button.textContent = isChinese ? "随机换一批" : "Shuffle";
        }, 1200);
      });
    });

    document.querySelectorAll("[data-copy-visible-prompts]").forEach((button) => {
      button.addEventListener("click", function () {
        const visiblePrompts = Array.from(grid.querySelectorAll(".gallery-card"))
          .filter((card) => card.style.display !== "none")
          .map((card) => {
            const id = card.getAttribute("data-gallery-id");
            return visibleItems.find((item) => item.id === id);
          })
          .filter(Boolean)
          .map((item) => item.title + "\n" + item.prompt);

        if (!visiblePrompts.length) {
          button.textContent = i18n.noVisiblePrompts;
        } else {
          copyPlainText(visiblePrompts.join("\n\n---\n\n")).then(() => {
            button.textContent = i18n.copyVisible;
          });
        }
        window.setTimeout(() => {
          button.textContent = isChinese ? "复制当前可见" : "Copy visible";
        }, 1400);
      });
    });

    grid.addEventListener("click", function (event) {
      const saveButton = event.target.closest("[data-save-prompt]");
      if (saveButton) {
        const id = saveButton.getAttribute("data-save-prompt");
        if (savedPrompts.has(id)) {
          savedPrompts.delete(id);
          saveButton.classList.remove("active");
          saveButton.textContent = i18n.savePrompt;
        } else {
          savedPrompts.add(id);
          saveButton.classList.add("active");
          saveButton.textContent = i18n.savedPrompt;
        }
        persistSavedPrompts();
        if (savedOnly) {
          renderGallery();
        }
        return;
      }

      const previewButton = event.target.closest("[data-preview-prompt]");
      if (previewButton) {
        const id = previewButton.getAttribute("data-preview-prompt");
        const item = visibleItems.find((entry) => entry.id === id);
        if (item) {
          openPromptPreview(item);
        }
      }
    });
  }

  function openPromptPreview(item) {
    let modal = document.querySelector("[data-prompt-preview-modal]");
    const encodedPrompt = encodeURIComponent(item.prompt);
    const tags = item.tags.map((tag) => '<span class="tag">' + tag + "</span>").join("");
    let escapeHandler = null;

    if (!modal) {
      modal = document.createElement("div");
      modal.className = "prompt-preview-modal";
      modal.setAttribute("data-prompt-preview-modal", "true");
      document.body.appendChild(modal);
    }

    modal.innerHTML = [
      '<div class="prompt-preview-backdrop" data-close-prompt-preview></div>',
      '<section class="prompt-preview-panel" role="dialog" aria-modal="true">',
      '<button class="prompt-preview-close" type="button" data-close-prompt-preview>' + i18n.closePreview + "</button>",
      '<img src="' + item.imageUrl + '" alt="' + item.title + " " + i18n.imageAltSuffix + '">',
      '<div class="prompt-preview-content">',
      '<p class="eyebrow">' + item.category + "</p>",
      "<h2>" + item.title + "</h2>",
      '<div class="gallery-tags">' + tags + "</div>",
      '<pre id="prompt-preview-copy">' + item.prompt + "</pre>",
      '<div class="button-row">',
      '<button class="button ghost" type="button" data-copy-target="#prompt-preview-copy">' + i18n.detailCopyPrompt + "</button>",
      '<a class="button secondary" href="' + toolPath + '?mode=image&prompt=' + encodedPrompt + '">' + i18n.detailUsePrompt + "</a>",
      "</div>",
      "</div>",
      "</section>"
    ].join("");

    modal.classList.add("active");
    document.body.classList.add("lightbox-open");

    const closePreview = function () {
      modal.classList.remove("active");
      document.body.classList.remove("lightbox-open");
      if (escapeHandler) {
        document.removeEventListener("keydown", escapeHandler);
        escapeHandler = null;
      }
    };

    modal.querySelectorAll("[data-close-prompt-preview]").forEach((node) => {
      node.addEventListener("click", function () {
        closePreview();
      });
    });

    escapeHandler = function (event) {
      if (event.key === "Escape" && modal.classList.contains("active")) {
        closePreview();
      }
    };
    document.addEventListener("keydown", escapeHandler);
  }

  function initImageLightbox() {
    const zoomables = Array.from(document.querySelectorAll("[data-zoomable='true']"));
    if (!zoomables.length) {
      return;
    }

    const lightbox = document.createElement("div");
    lightbox.className = "lightbox";
    lightbox.setAttribute("hidden", "true");
    lightbox.innerHTML = [
      '<button class="lightbox-close" type="button" aria-label="' + i18n.closeImagePreview + '">×</button>',
      '<button class="lightbox-nav lightbox-prev" type="button" aria-label="' + i18n.previousImage + '">‹</button>',
      '<button class="lightbox-nav lightbox-next" type="button" aria-label="' + i18n.nextImage + '">›</button>',
      '<div class="lightbox-stage">',
      '<img class="lightbox-image" alt="">',
      '<div class="lightbox-toolbar">',
      '<a class="button secondary lightbox-download" href="" download>' + i18n.downloadImage + "</a>",
      "</div>",
      '<p class="lightbox-caption"></p>',
      "</div>"
    ].join("");
    document.body.appendChild(lightbox);

    const lightboxImage = lightbox.querySelector(".lightbox-image");
    const lightboxCaption = lightbox.querySelector(".lightbox-caption");
    const closeButton = lightbox.querySelector(".lightbox-close");
    const prevButton = lightbox.querySelector(".lightbox-prev");
    const nextButton = lightbox.querySelector(".lightbox-next");
    const downloadButton = lightbox.querySelector(".lightbox-download");
    let activeIndex = -1;

    function closeLightbox() {
      lightbox.setAttribute("hidden", "true");
      document.body.classList.remove("lightbox-open");
      lightboxImage.setAttribute("src", "");
      lightboxImage.setAttribute("alt", "");
      lightboxCaption.textContent = "";
      downloadButton.setAttribute("href", "");
      activeIndex = -1;
    }

    function updateLightbox(index) {
      const image = zoomables[index];
      if (!image) {
        return;
      }

      activeIndex = index;
      lightboxImage.setAttribute("src", image.getAttribute("src") || "");
      lightboxImage.setAttribute("alt", image.getAttribute("alt") || "");
      lightboxCaption.textContent = image.getAttribute("alt") || "";
      downloadButton.setAttribute("href", image.getAttribute("src") || "");
      downloadButton.setAttribute("download", (image.getAttribute("alt") || "promptarc-image").replace(/\s+/g, "-").toLowerCase());
      prevButton.disabled = zoomables.length < 2;
      nextButton.disabled = zoomables.length < 2;
    }

    function openLightbox(image) {
      const index = zoomables.indexOf(image);
      updateLightbox(index);
      lightbox.removeAttribute("hidden");
      document.body.classList.add("lightbox-open");
    }

    function showRelative(step) {
      if (activeIndex < 0 || !zoomables.length) {
        return;
      }
      const nextIndex = (activeIndex + step + zoomables.length) % zoomables.length;
      updateLightbox(nextIndex);
    }

    zoomables.forEach((image) => {
      image.setAttribute("tabindex", "0");
      image.setAttribute("role", "button");
      image.setAttribute("aria-label", i18n.openPreview);
      image.addEventListener("click", function () {
        openLightbox(image);
      });
      image.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openLightbox(image);
        }
      });
    });

    closeButton.addEventListener("click", closeLightbox);
    prevButton.addEventListener("click", function (event) {
      event.stopPropagation();
      showRelative(-1);
    });
    nextButton.addEventListener("click", function (event) {
      event.stopPropagation();
      showRelative(1);
    });
    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });
    document.addEventListener("keydown", function (event) {
      if (lightbox.hasAttribute("hidden")) {
        return;
      }
      if (event.key === "Escape") {
        closeLightbox();
      }
      if (event.key === "ArrowLeft") {
        showRelative(-1);
      }
      if (event.key === "ArrowRight") {
        showRelative(1);
      }
    });
  }

  function initOutboundEventTracking() {
    document.querySelectorAll("[data-affiliate-link], [data-gumroad-link]").forEach((link) => {
      link.addEventListener("click", function () {
        window.dispatchEvent(
          new CustomEvent("promptarc:event", {
            detail: {
              name: link.hasAttribute("data-gumroad-link") ? "gumroad_clicked" : "recommended_tool_clicked",
              target: link.getAttribute("href")
            }
          })
        );
      });
    });
  }

  initCloudflareAnalytics();
  updateGlobalBranding();
  handleCopyButtons();
  initGallery();
  initImageLightbox();
  initCollectionExplorer({
    buttonSelector: "[data-gallery-filter]",
    cardSelector: "[data-gallery-search-text]",
    searchSelector: "[data-gallery-search]",
    countSelector: "[data-gallery-count]",
    searchAttribute: "data-gallery-search-text",
    filterAttribute: "data-gallery-filter",
    countSuffix: i18n.galleryCountSuffix
  });
  initCollectionExplorer({
    buttonSelector: "[data-library-filter]",
    cardSelector: "[data-library-search-text]",
    searchSelector: "[data-library-search]",
    countSelector: "[data-library-count]",
    searchAttribute: "data-library-search-text",
    filterAttribute: "data-library-filter",
    countSuffix: isChinese ? "个模板" : "templates shown"
  });
  initCollectionExplorer({
    buttonSelector: "[data-tools-filter]",
    cardSelector: "[data-tools-search-text]",
    searchSelector: "[data-tools-search]",
    countSelector: "[data-tools-count]",
    searchAttribute: "data-tools-search-text",
    filterAttribute: "data-tools-filter",
    countSuffix: isChinese ? "个工具" : "tools shown"
  });
  initPromptTool();
  initEmailGates();
  initOutboundEventTracking();
})();
