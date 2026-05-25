(function () {
  const config = window.SITE_CONFIG || {};
  const isChinese = document.documentElement.lang && document.documentElement.lang.toLowerCase().startsWith("zh");
  const galleryAssetBase = "https://img.promptarc.cc";
  let promptPreviewItems = [];
  let promptPreviewIndex = -1;
  let promptPreviewKeyHandler = null;

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
    copyPrompt: isChinese ? "复制" : "Copy",
    usePrompt: isChinese ? "查看提示词" : "View prompt",
    sourceExample: isChinese ? "查看来源示例" : "Source example",
    closeImagePreview: isChinese ? "关闭大图预览" : "Close image preview",
    previousImage: isChinese ? "查看上一张图片" : "View previous image",
    nextImage: isChinese ? "查看下一张图片" : "View next image",
    downloadImage: isChinese ? "下载图片" : "Download image",
    openPreview: isChinese ? "打开大图预览" : "Open larger preview",
    imageAltSuffix: isChinese ? "AI 图像示例" : "AI image example",
    previewPrompt: isChinese ? "做同款" : "Remix",
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
    detailUsePrompt: isChinese ? "做同款" : "Remix this",
    detailCopyPrompt: isChinese ? "复制提示词" : "Copy prompt",
    previousPrompt: isChinese ? "上一张" : "Previous",
    nextPrompt: isChinese ? "下一张" : "Next"
  };

  const categoryLabelMap = {
    en: {
      product: "Product ads",
      poster: "Poster design",
      ui: "UI mockups",
      infographic: "Infographics",
      typography: "Typography",
      photography: "Photography",
      character: "Character design",
      portrait: "Portrait prompts",
      test: "Style tests"
    },
    zh: {
      product: "产品广告",
      poster: "海报设计",
      ui: "界面设计",
      infographic: "信息图",
      typography: "字体排版",
      photography: "摄影参考",
      character: "角色设计",
      portrait: "人像摄影",
      test: "风格测试"
    }
  };

  const seoTagZhMap = {
    coffee: "咖啡",
    ecommerce: "电商",
    "product hero": "产品首图",
    skincare: "护肤",
    serum: "精华",
    "beauty ad": "美妆广告",
    footwear: "鞋类",
    launch: "上新",
    sports: "运动",
    mug: "杯子",
    "flat lay": "平铺",
    lifestyle: "生活方式",
    headphones: "耳机",
    tech: "科技",
    studio: "棚拍",
    soap: "香皂",
    sustainable: "可持续",
    bathroom: "浴室",
    backpack: "背包",
    travel: "旅行",
    outdoor: "户外",
    candle: "香薰蜡烛",
    home: "家居",
    editorial: "编辑风",
    ergonomics: "人体工学",
    "home office": "居家办公",
    education: "教育",
    sleep: "睡眠",
    habit: "习惯",
    wellness: "健康",
    newsletter: "邮件订阅",
    marketing: "营销",
    funnel: "漏斗",
    solar: "太阳能",
    energy: "能源",
    diagram: "图解",
    budget: "预算",
    finance: "财务",
    planning: "规划",
    process: "流程",
    guide: "指南",
    plants: "植物",
    care: "养护",
    "AI workflow": "AI 工作流",
    productivity: "效率",
    "food truck": "餐车",
    night: "夜间",
    event: "活动",
    garden: "花园",
    community: "社区",
    jazz: "爵士",
    music: "音乐",
    design: "设计",
    workshop: "工作坊",
    creative: "创意",
    book: "书籍",
    film: "电影",
    club: "俱乐部",
    cinema: "影院",
    tea: "茶饮",
    commercial: "商业",
    research: "研究",
    academic: "学术",
    poster: "海报",
    "mobile UI": "移动端 UI",
    "notes app": "笔记应用",
    dashboard: "仪表盘",
    calendar: "日历",
    "AI app": "AI 应用",
    recipe: "食谱",
    planner: "规划器",
    onboarding: "引导页",
    SaaS: "SaaS",
    "web UI": "网页 UI",
    "landing page": "落地页",
    player: "播放器",
    booking: "预订",
    library: "图书馆",
    documentary: "纪实",
    candid: "抓拍",
    market: "集市",
    street: "街头",
    rain: "雨天",
    cafe: "咖啡馆",
    botanical: "植物",
    knolling: "平铺陈列",
    macro: "微距",
    seaside: "海边",
    founder: "创始人",
    portrait: "人像",
    cinematic: "电影感",
    fashion: "时尚",
    lookbook: "lookbook",
    consistency: "一致性",
    lettering: "字形",
    city: "城市",
    illustration: "插画",
    handwriting: "手写",
    paper: "纸张",
    letter: "书信",
    robot: "机器人",
    sticker: "贴纸",
    mascot: "吉祥物",
    forest: "森林",
    character: "角色",
    companion: "陪伴系",
    creature: "生物",
    comic: "漫画",
    team: "团队",
    sequence: "序列",
    materials: "材质",
    lighting: "光线",
    comparison: "对比",
    "event poster": "活动海报",
    learning: "学习",
    roadmap: "路线图",
    kitchen: "厨房",
    routine: "日常流程",
    type: "字体",
    floral: "花卉",
    ink: "水墨",
    brush: "笔触",
    glass: "玻璃",
    minimal: "极简",
    clay: "黏土",
    texture: "质感",
    grid: "网格",
    layout: "版式",
    crm: "CRM",
    pipeline: "销售流程",
    sustainability: "可持续",
    campaign: "营销活动",
    cabin: "湖畔木屋",
    lakeside: "湖边",
    angle: "角度",
    palette: "配色",
    vitamin: "维生素",
    headset: "耳机",
    gaming: "游戏",
    fitness: "健身",
    coach: "教练",
    startup: "创业",
    meetup: "线下聚会",
    "flower market": "花市",
    subway: "地铁",
    commute: "通勤",
    neon: "霓虹",
    metal: "金属",
    cut: "剪纸",
    sign: "招牌",
    stone: "石刻",
    serif: "衬线",
    fabric: "织物",
    product: "产品",
    animal: "动物",
    assistant: "助手",
    bookstore: "书店",
    ceramic: "陶瓷",
    cleaner: "清洁用品",
    creator: "创作者",
    desk: "办公桌",
    eco: "环保",
    expense: "记账",
    festival: "节日",
    food: "食物",
    gallery: "画廊",
    luxury: "高级感",
    morning: "清晨",
    opening: "开业",
    perfume: "香水",
    reading: "阅读",
    "soft light": "柔光",
    sprite: "精灵",
    window: "窗景",
    workflow: "工作流",
    yoga: "瑜伽"
  };

  const seoTagStopByCategory = {
    product: ["ecommerce", "product hero", "commercial"],
    poster: ["event", "poster"],
    ui: ["mobile ui", "web ui", "ui", "ai app"],
    infographic: [],
    typography: [],
    photography: ["documentary", "photo"],
    portrait: ["portrait"],
    character: ["character"],
    test: ["comparison"]
  };

  const seoTitleOverrideMap = {
    en: {
      "regen-rainy-cafe-window-photo": "Rainy cafe window photo prompt",
      "regen-window-founder-portrait": "Window light founder portrait prompt",
      "regen-rainy-window-portrait": "Rainy window portrait prompt",
      "regen-street-style-portrait": "Cinematic street style portrait prompt",
      "regen-library-candid-photo": "Library documentary photo prompt",
      "regen-morning-market-photo": "Morning market photo prompt",
      "regen-botanical-knolling-photo": "Botanical knolling photo prompt",
      "regen-seaside-film-snapshot": "Seaside film photo prompt",
      "regen-finance-app-dashboard": "Finance dashboard UI prompt",
      "regen-ai-notes-dashboard": "AI notes dashboard UI prompt",
      "regen-ai-calendar-dashboard": "AI calendar dashboard UI prompt",
      "regen-recipe-planner-ui": "Recipe planner app UI prompt",
      "regen-travel-booking-ui": "Travel booking app UI prompt",
      "regen-music-player-ui": "Music player app UI prompt",
      "regen-saas-landing-hero-ui": "SaaS landing page UI prompt",
      "regen-habit-tracker-onboarding": "Habit tracker onboarding UI prompt",
      "regen-city-lettering-art": "City lettering typography prompt",
      "regen-botanical-lettering": "Botanical lettering prompt",
      "regen-seaside-lettering": "Seaside lettering artwork prompt",
      "regen-handwritten-letter-layout": "Handwritten letter layout prompt",
      "regen-cozy-robot-sticker-sheet": "Cozy robot sticker prompt",
      "regen-forest-guide-mascot": "Forest guide mascot prompt",
      "regen-companion-creature": "Friendly companion creature prompt",
      "regen-four-panel-team-comic": "Team comic character prompt",
      "regen-material-render-test": "Material render test prompt"
    },
    zh: {
      "regen-rainy-cafe-window-photo": "雨天咖啡馆窗边摄影提示词",
      "regen-window-founder-portrait": "窗边创始人人像提示词",
      "regen-rainy-window-portrait": "雨窗人像提示词",
      "regen-street-style-portrait": "电影感街头人像提示词",
      "regen-library-candid-photo": "图书馆纪实摄影提示词",
      "regen-morning-market-photo": "清晨集市摄影提示词",
      "regen-botanical-knolling-photo": "植物平铺摄影提示词",
      "regen-seaside-film-snapshot": "海边胶片摄影提示词",
      "regen-finance-app-dashboard": "财务仪表盘界面提示词",
      "regen-ai-notes-dashboard": "AI 笔记界面提示词",
      "regen-ai-calendar-dashboard": "AI 日历界面提示词",
      "regen-recipe-planner-ui": "食谱规划界面提示词",
      "regen-travel-booking-ui": "旅行预订界面提示词",
      "regen-music-player-ui": "音乐播放器界面提示词",
      "regen-saas-landing-hero-ui": "SaaS 落地页界面提示词",
      "regen-habit-tracker-onboarding": "习惯养成引导页提示词",
      "regen-city-lettering-art": "城市字形排版提示词",
      "regen-botanical-lettering": "植物字形排版提示词",
      "regen-seaside-lettering": "海边字形艺术提示词",
      "regen-handwritten-letter-layout": "手写书信排版提示词",
      "regen-cozy-robot-sticker-sheet": "治愈机器人贴纸提示词",
      "regen-forest-guide-mascot": "森林向导吉祥物提示词",
      "regen-companion-creature": "陪伴系生物角色提示词",
      "regen-four-panel-team-comic": "四格团队漫画提示词",
      "regen-material-render-test": "材质渲染测试提示词"
    }
  };

  function getCategoryLabel(category) {
    const language = isChinese ? "zh" : "en";
    return (categoryLabelMap[language] && categoryLabelMap[language][category]) || category;
  }

  function getLocalizedTagLabel(tag) {
    if (!isChinese) {
      return tag;
    }
    return seoTagZhMap[tag] || tag;
  }

  function getSeoTitleTags(item) {
    const tags = Array.isArray(item && item.tags) ? item.tags : [];
    const stopList = seoTagStopByCategory[item && item.category] || [];
    const stopSet = new Set(stopList.map((tag) => tag.toLowerCase()));
    const picked = [];

    tags.forEach((tag) => {
      const normalized = String(tag || "").toLowerCase();
      if (!normalized || stopSet.has(normalized)) {
        return;
      }
      if (picked.length >= 2) {
        return;
      }
      picked.push(tag);
    });

    if (!picked.length && tags.length) {
      picked.push(tags[0]);
    }

    return picked;
  }

  function getDisplayTagLabels(item) {
    return getSeoTitleTags(item).map(getLocalizedTagLabel);
  }

  function titleCaseSeoToken(token) {
    return String(token || "")
      .split(" ")
      .filter(Boolean)
      .map((part) => {
        const upperMap = {
          ai: "AI",
          ui: "UI",
          saas: "SaaS"
        };
        const normalized = part.toLowerCase();
        if (upperMap[normalized]) {
          return upperMap[normalized];
        }
        return normalized.charAt(0).toUpperCase() + normalized.slice(1);
      })
      .join(" ");
  }

  function getSeoGalleryTitle(item) {
    if (!item) {
      return "";
    }

    const overrideLang = isChinese ? "zh" : "en";
    if (item.id && seoTitleOverrideMap[overrideLang] && seoTitleOverrideMap[overrideLang][item.id]) {
      return seoTitleOverrideMap[overrideLang][item.id];
    }

    const tags = getSeoTitleTags(item);

    if (isChinese) {
      const translated = tags.map((tag) => seoTagZhMap[tag] || tag);
      const first = translated[0] || "";
      const second = translated[1] || "";
      const zhBuilders = {
        product: () => (first ? first + "产品图提示词" : "产品图提示词"),
        poster: () => (first ? first + "海报提示词" : "海报提示词"),
        ui: () => {
          if (first && second) {
            return first + second + "界面提示词";
          }
          if (first) {
            return first + "界面提示词";
          }
          return "界面提示词";
        },
        infographic: () => (first ? first + "信息图提示词" : "信息图提示词"),
        typography: () => (first ? first + "字体排版提示词" : "字体排版提示词"),
        photography: () => {
          if (first && second) {
            return first + second + "摄影提示词";
          }
          if (first) {
            return first + "摄影提示词";
          }
          return "摄影提示词";
        },
        portrait: () => {
          if (first && second) {
            return first + second + "人像提示词";
          }
          if (first) {
            return first + "人像提示词";
          }
          return "人像提示词";
        },
        character: () => {
          if (first && second) {
            return first + second + "角色提示词";
          }
          if (first) {
            return first + "角色提示词";
          }
          return "角色提示词";
        },
        test: () => (first ? first + "风格测试提示词" : "风格测试提示词")
      };
      return (zhBuilders[item.category] && zhBuilders[item.category]()) || (getCategoryLabel(item.category) + "提示词");
    }

    const first = titleCaseSeoToken(tags[0] || "");
    const second = titleCaseSeoToken(tags[1] || "");
    const enBuilders = {
      product: () => {
        if (first && second) {
          return first + " " + second + " product prompt";
        }
        if (first) {
          return first + " product prompt";
        }
        return "Product prompt";
      },
      poster: () => {
        if (first && second) {
          return first + " " + second + " poster prompt";
        }
        if (first) {
          return first + " poster prompt";
        }
        return "Poster prompt";
      },
      ui: () => {
        if (first && second) {
          return first + " " + second + " UI prompt";
        }
        if (first) {
          return first + " UI prompt";
        }
        return "UI prompt";
      },
      infographic: () => {
        if (first && second) {
          return first + " " + second + " infographic prompt";
        }
        if (first) {
          return first + " infographic prompt";
        }
        return "Infographic prompt";
      },
      typography: () => {
        if (first && second) {
          return first + " " + second + " typography prompt";
        }
        if (first) {
          return first + " typography prompt";
        }
        return "Typography prompt";
      },
      photography: () => {
        if (first && second) {
          return first + " " + second + " photo prompt";
        }
        if (first) {
          return first + " photo prompt";
        }
        return "Photo prompt";
      },
      portrait: () => {
        if (first && second) {
          return first + " " + second + " portrait prompt";
        }
        if (first) {
          return first + " portrait prompt";
        }
        return "Portrait prompt";
      },
      character: () => {
        if (first && second) {
          return first + " " + second + " character prompt";
        }
        if (first) {
          return first + " character prompt";
        }
        return "Character prompt";
      },
      test: () => (first ? first + " style prompt" : "Style prompt")
    };
    return (enBuilders[item.category] && enBuilders[item.category]()) || (titleCaseSeoToken(item.title) + " prompt");
  }

  function getCardMetaText(item) {
    if (!item) {
      return "";
    }

    const sourceText = isChinese ? "PromptArc 原创" : "PromptArc original";
    const categoryText = getCategoryLabel(item.category);
    return sourceText + " · " + categoryText;
  }

  function getCategoryHubPath(category) {
    return (isChinese ? "/zh/gallery/" : "/gallery/") + category + "/";
  }

  function initGalleryStats() {
    const items = window.PROMPTARC_GALLERY || [];
    if (!items.length) {
      return;
    }

    const categoryCounts = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});

    document.querySelectorAll("[data-hero-published-count]").forEach((node) => {
      node.textContent = String(items.length);
    });

    document.querySelectorAll("[data-hero-category-count]").forEach((node) => {
      node.textContent = String(Object.keys(categoryCounts).length);
    });

    document.querySelectorAll("[data-category-link]").forEach((node) => {
      const category = node.getAttribute("data-category-link");
      const countNode = node.querySelector("[data-category-count]");
      if (countNode) {
        countNode.textContent = String(categoryCounts[category] || 0);
      }
    });
  }

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
    const fallbackCopy = function () {
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
        return success ? Promise.resolve() : Promise.reject(new Error("copy failed"));
      } catch (error) {
        document.body.removeChild(textarea);
        return Promise.reject(error);
      }
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(fallbackCopy);
    }

    return fallbackCopy();
  }

  function copyText(targetSelector, triggerButton) {
    const target = document.querySelector(targetSelector);
    if (!target) {
      return;
    }

    copyPlainText(target.textContent || "").then(() => {
      const button = triggerButton || document.querySelector('[data-copy-target="' + targetSelector + '"]');
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

      copyText(button.getAttribute("data-copy-target"), button);
    });
  }

  function initAutoClosingMenus() {
    const menus = Array.from(document.querySelectorAll(".prompt-nav-menu"));
    if (!menus.length) {
      return;
    }

    menus.forEach((menu) => {
      menu.addEventListener("toggle", function () {
        if (!menu.open) {
          return;
        }
        menus.forEach((otherMenu) => {
          if (otherMenu !== menu) {
            otherMenu.open = false;
          }
        });
      });

      menu.addEventListener("click", function (event) {
        if (event.target.closest(".prompt-nav-menu-panel a, .prompt-nav-menu-panel button")) {
          window.setTimeout(() => {
            menu.open = false;
          }, 80);
        }
      });
    });

    document.addEventListener("click", function (event) {
      if (event.target.closest(".prompt-nav-menu")) {
        return;
      }
      menus.forEach((menu) => {
        menu.open = false;
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") {
        return;
      }
      menus.forEach((menu) => {
        menu.open = false;
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
    const searchInput = document.querySelector(options.searchSelector);
    const countNode = document.querySelector(options.countSelector);

    if (!buttons.length) {
      return;
    }

    let activeFilter = "all";

    function apply() {
      const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
      let visible = 0;

      const cards = Array.from(document.querySelectorAll(options.cardSelector));
      if (!cards.length) {
        return;
      }
      cards.forEach((card) => {
        const category = card.getAttribute("data-category") || "";
        const tagText = (card.getAttribute("data-tags") || "").toLowerCase();
        const haystack = (card.getAttribute(options.searchAttribute) || "").toLowerCase();
        const filterValue = activeFilter.toLowerCase();
        const matchesFilter = activeFilter === "all" || category.toLowerCase() === filterValue || tagText.includes(filterValue);
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

  function slugifyGalleryTitle(title) {
    return String(title || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function getGalleryDetailPath(item) {
    if (!item || !item.category || !item.title) {
      return "#";
    }

    const slug = slugifyGalleryTitle(item.title);
    return (isChinese ? "/zh/gallery/" : "/gallery/") + item.category + "/" + slug + "/";
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
    const initialParams = new URLSearchParams(window.location.search);
    const initialTagFilter = (initialParams.get("tag") || "").trim().toLowerCase();
    let visibleItems = fullSet.slice();
    let sortMode = "latest";
    let savedOnly = false;
    const savedPrompts = new Set(JSON.parse(window.localStorage.getItem("promptarc:saved-prompts") || "[]"));
    const categoryLabelMap = isChinese
      ? {
          product: "产品广告",
          poster: "海报设计",
          ui: "界面设计",
          infographic: "信息图",
          typography: "字体排版",
          photography: "摄影参考",
          character: "角色设计",
          portrait: "人像摄影",
          test: "风格测试"
        }
      : {
          product: "Product ads",
          poster: "Poster design",
          ui: "UI mockups",
          infographic: "Infographics",
          typography: "Typography",
          photography: "Photography",
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
      if (item.sourceLabel) {
        if (isChinese && item.sourceLabel === "PromptArc generated") {
          return "PromptArc 原创";
        }
        return item.sourceLabel;
      }
      if (!item.sourceUrl) {
        return isChinese ? "PromptArc 精选" : "PromptArc curated";
      }
      try {
        return new URL(item.sourceUrl).hostname.replace(/^www\./, "");
      } catch {
        return isChinese ? "来源" : "Source";
      }
    }

    function getSourceMarkup(item) {
      const sourceLabel = getSourceLabel(item);
      const sourceUrl = item.sourceUrl || "";
      const isExternal = /^https?:\/\//i.test(sourceUrl);
      const isInternal = sourceUrl.startsWith("/");
      if (isExternal || isInternal) {
        return '<a class="source-link prompt-card-source" href="' + sourceUrl + '"' + (isExternal ? ' target="_blank" rel="noopener noreferrer"' : "") + ">" + sourceLabel + "</a>";
      }
      return '<span class="source-link prompt-card-source">' + sourceLabel + "</span>";
    }

    function applyCurrentView() {
      const filteredSet = initialTagFilter
        ? fullSet.filter((item) => (item.tags || []).some((tag) => String(tag).toLowerCase() === initialTagFilter))
        : fullSet;
      const sourceItems = savedOnly ? filteredSet.filter((item) => savedPrompts.has(item.id)) : filteredSet.slice();
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

    function getThumbnailUrl(imageUrl) {
      const thumbPath = imageUrl.replace("/assets/gallery/", "/assets/gallery/thumbs/");
      return thumbPath.startsWith("http") ? thumbPath : galleryAssetBase + thumbPath;
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
      visibleItems.forEach((item, itemIndex) => {
      const card = document.createElement("article");
      card.className = "gallery-card card";
      card.setAttribute("data-category", item.category);
      card.setAttribute("data-gallery-id", item.id);
      card.setAttribute("data-tags", item.tags.join(" ").toLowerCase());
      card.setAttribute(
        "data-gallery-search-text",
        [item.title, item.category, item.tags.join(" "), item.prompt].join(" ").toLowerCase()
      );

      card.innerHTML = [
        '<div class="gallery-image-wrap prompt-card-media">',
        '<a class="prompt-card-link" href="' + getGalleryDetailPath(item) + '" aria-label="' + item.title + '">',
        '<img src="' + getThumbnailUrl(item.imageUrl) + '" alt="' + item.title + " " + i18n.imageAltSuffix + '" loading="' + (itemIndex < 8 ? "eager" : "lazy") + '" decoding="async" fetchpriority="' + (itemIndex < 4 ? "high" : "auto") + '">',
        "</a>",
        "</div>",
        '<div class="gallery-card-body prompt-card-body">',
        '<p class="gallery-prompt is-hidden-prompt" id="prompt-' + item.id + '">' + item.prompt + "</p>",
        '<h3 class="prompt-card-title"><a href="' + getGalleryDetailPath(item) + '">' + getSeoGalleryTitle(item) + "</a></h3>",
        '<div class="prompt-card-actions">',
        '<button class="prompt-card-remix" type="button" data-preview-prompt="' + item.id + '">' + i18n.previewPrompt + "</button>",
        '<button class="prompt-card-copy" type="button" data-copy-target="#prompt-' + item.id + '">' + i18n.copyPrompt + "</button>",
        '<a class="prompt-card-tag" href="' + getCategoryHubPath(item.category) + '">' + getCategoryLabel(item.category) + "</a>",
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
        const itemIndex = visibleItems.findIndex((entry) => entry.id === id);
        const item = visibleItems[itemIndex];
        if (item) {
          openPromptPreview(item, visibleItems, itemIndex);
        }
      }
    });
  }

  function openPromptPreview(item, items = promptPreviewItems, index = promptPreviewIndex) {
    let modal = document.querySelector("[data-prompt-preview-modal]");
    promptPreviewItems = items && items.length ? items : [item];
    promptPreviewIndex = index >= 0 ? index : promptPreviewItems.findIndex((entry) => entry.id === item.id);
    if (promptPreviewIndex < 0) {
      promptPreviewIndex = 0;
    }
    const currentItem = promptPreviewItems[promptPreviewIndex] || item;
    const tags = getDisplayTagLabels(currentItem).map((tag) => '<span class="tag">' + tag + "</span>").join("");
    const categoryLabel = getCategoryLabel(currentItem.category);
    const seoTitle = getSeoGalleryTitle(currentItem);
    const hasMultiple = promptPreviewItems.length > 1;

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
      '<button class="prompt-preview-nav prompt-preview-prev" type="button" data-prompt-preview-step="-1"' + (hasMultiple ? "" : " disabled") + ' aria-label="' + i18n.previousImage + '">' + i18n.previousPrompt + "</button>",
      '<button class="prompt-preview-nav prompt-preview-next" type="button" data-prompt-preview-step="1"' + (hasMultiple ? "" : " disabled") + ' aria-label="' + i18n.nextImage + '">' + i18n.nextPrompt + "</button>",
      '<img src="' + getThumbnailUrl(currentItem.imageUrl) + '" alt="' + currentItem.title + " " + i18n.imageAltSuffix + '">',
      '<div class="prompt-preview-content">',
      '<p class="eyebrow">' + categoryLabel + " · " + (promptPreviewIndex + 1) + " / " + promptPreviewItems.length + "</p>",
      "<h2>" + seoTitle + "</h2>",
      '<div class="gallery-tags">' + tags + "</div>",
      '<pre id="prompt-preview-copy">' + currentItem.prompt + "</pre>",
      '<div class="button-row">',
      '<button class="button secondary" type="button" data-copy-target="#prompt-preview-copy">' + i18n.detailUsePrompt + "</button>",
      '<button class="button ghost" type="button" data-copy-target="#prompt-preview-copy">' + i18n.detailCopyPrompt + "</button>",
      "</div>",
      "</div>",
      "</section>"
    ].join("");

    modal.classList.add("active");
    document.body.classList.add("lightbox-open");

    const closePreview = function () {
      modal.classList.remove("active");
      document.body.classList.remove("lightbox-open");
      if (promptPreviewKeyHandler) {
        document.removeEventListener("keydown", promptPreviewKeyHandler);
        promptPreviewKeyHandler = null;
      }
    };

    modal.querySelectorAll("[data-close-prompt-preview]").forEach((node) => {
      node.addEventListener("click", function () {
        closePreview();
      });
    });

    modal.querySelectorAll("[data-prompt-preview-step]").forEach((node) => {
      node.addEventListener("click", function () {
        const step = Number(node.getAttribute("data-prompt-preview-step") || 0);
        const nextIndex = (promptPreviewIndex + step + promptPreviewItems.length) % promptPreviewItems.length;
        openPromptPreview(promptPreviewItems[nextIndex], promptPreviewItems, nextIndex);
      });
    });

    if (promptPreviewKeyHandler) {
      document.removeEventListener("keydown", promptPreviewKeyHandler);
    }
    promptPreviewKeyHandler = function (event) {
      if (event.key === "Escape" && modal.classList.contains("active")) {
        closePreview();
      }
      if (event.key === "ArrowLeft" && modal.classList.contains("active") && hasMultiple) {
        const nextIndex = (promptPreviewIndex - 1 + promptPreviewItems.length) % promptPreviewItems.length;
        openPromptPreview(promptPreviewItems[nextIndex], promptPreviewItems, nextIndex);
      }
      if (event.key === "ArrowRight" && modal.classList.contains("active") && hasMultiple) {
        const nextIndex = (promptPreviewIndex + 1) % promptPreviewItems.length;
        openPromptPreview(promptPreviewItems[nextIndex], promptPreviewItems, nextIndex);
      }
    };
    document.addEventListener("keydown", promptPreviewKeyHandler);
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
      if (image.hasAttribute("data-preview-prompt")) {
        return;
      }
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
  initAutoClosingMenus();
  initGalleryStats();
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
