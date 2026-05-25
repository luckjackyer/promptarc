import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const galleryDataPath = path.join(root, "gallery", "gallery-data.js");
const sitemapPath = path.join(root, "sitemap.xml");
const imageSitemapPath = path.join(root, "image-sitemap.xml");
const today = "2026-05-22";

const raw = fs.readFileSync(galleryDataPath, "utf8");
const match = raw.match(/window\.PROMPTARC_GALLERY\s*=\s*(\[[\s\S]*\]);?\s*$/);
if (!match) {
  throw new Error("Could not parse gallery data");
}

const galleryItems = Function(`"use strict"; return (${match[1]});`)();
const galleryAssetBase = "https://img.promptarc.cc";
const categoryCounts = galleryItems.reduce((counts, item) => {
  counts[item.category] = (counts[item.category] || 0) + 1;
  return counts;
}, {});

const categoryMeta = {
  product: {
    enLabel: "Product ads",
    zhLabel: "产品广告",
    enDescription: "premium ecommerce product shots, launch creatives, and conversion-focused commercial visuals",
    zhDescription: "高级电商产品图、上新广告图和偏商业转化的视觉",
    enFocus: "lighting, negative space, staging, and commercial polish",
    zhFocus: "光线、留白、摆场和商业质感",
    enAdapt: "Swap the product object, keep the composition logic, and add a surface, prop, or copy-safe area that matches your niche.",
    zhAdapt: "替换商品主体，保留构图逻辑，再补一个符合你行业的表面材质、辅助道具或标题留白。"
  },
  poster: {
    enLabel: "Poster prompts",
    zhLabel: "海报设计",
    enDescription: "event posters, campaign artwork, editorial one-pagers, and print-style visual systems",
    zhDescription: "活动海报、宣传视觉、编辑风单页和印刷型画面",
    enFocus: "central visual, title-safe zones, print energy, and visual hierarchy",
    zhFocus: "主体视觉、标题区域、印刷感和层级",
    enAdapt: "Keep the core visual metaphor, then rewrite the mood, palette, and blank title zones for your event or campaign.",
    zhAdapt: "保留主要视觉隐喻，再按你的活动或 campaign 改写氛围、色板和标题留白区。"
  },
  ui: {
    enLabel: "UI mockups",
    zhLabel: "界面设计",
    enDescription: "mobile dashboards, product concept shots, SaaS heroes, and interface exploration",
    zhDescription: "移动端仪表盘、产品概念图、SaaS 头图和界面探索",
    enFocus: "layout clarity, realistic spacing, hierarchy, and interface fidelity",
    zhFocus: "布局清晰度、真实留白、层级和界面完成度",
    enAdapt: "Change the app type and primary workflow, but keep one strong primary action and a believable navigation pattern.",
    zhAdapt: "换掉应用类型和核心工作流，但保留明确主操作和可信的导航结构。"
  },
  infographic: {
    enLabel: "Infographic prompts",
    zhLabel: "信息图",
    enDescription: "workflow explainers, educational diagrams, visual guides, and process maps",
    zhDescription: "工作流解释图、教育图示、视觉指南和流程图",
    enFocus: "modular sections, clear hierarchy, icons, and readable structure",
    zhFocus: "模块分区、清晰层级、图标和可读结构",
    enAdapt: "Start from the information architecture, then add icons, section rhythm, and a readability constraint.",
    zhAdapt: "先从信息架构入手，再补图标、分区节奏和可读性限制。"
  },
  typography: {
    enLabel: "Typography prompts",
    zhLabel: "字体排版",
    enDescription: "lettering artwork, title treatments, wordmark-style scenes, and type-led editorial layouts",
    zhDescription: "字形艺术、标题处理、文字主导的画面和编辑风排版",
    enFocus: "letter shape, composition, texture, and readability control",
    zhFocus: "字形、构图、材质和可读性控制",
    enAdapt: "Decide whether the output should be readable or purely expressive, then anchor the material and composition cues.",
    zhAdapt: "先明确结果要可读还是偏表现型，再锁定材质和构图线索。"
  },
  photography: {
    enLabel: "Photography prompts",
    zhLabel: "摄影参考",
    enDescription: "realistic editorial scenes, documentary stills, and light-driven photo studies",
    zhDescription: "真实编辑场景、纪实静帧和以光线驱动的摄影研究",
    enFocus: "subject framing, lens feel, believable light, and natural imperfection",
    zhFocus: "主体取景、镜头感、可信光线和自然瑕疵",
    enAdapt: "Keep the scene and mood, then tune lens feel, time of day, and realism constraints for your subject.",
    zhAdapt: "保留场景和情绪，再按主体去调整镜头感、时间段和真实感限制。"
  },
  portrait: {
    enLabel: "Portrait prompts",
    zhLabel: "人像摄影",
    enDescription: "editorial portraits, founder headshots, cinematic people shots, and lookbook consistency studies",
    zhDescription: "编辑人像、创始人照片、电影感人物图和 lookbook 一致性练习",
    enFocus: "expression, framing, skin texture, and believable atmosphere",
    zhFocus: "表情、取景、皮肤质感和可信氛围",
    enAdapt: "Rewrite the environment and emotion, then protect realism with clean anatomy and natural skin-detail constraints.",
    zhAdapt: "改场景和情绪，再用真实皮肤细节和正常结构限制去保护真实感。"
  },
  character: {
    enLabel: "Character prompts",
    zhLabel: "角色设计",
    enDescription: "mascots, sticker sets, brand companions, and repeatable original character systems",
    zhDescription: "吉祥物、贴纸组、品牌陪伴角色和可重复使用的原创角色系统",
    enFocus: "silhouette consistency, expression range, style control, and originality",
    zhFocus: "轮廓一致性、表情变化、风格控制和原创性",
    enAdapt: "Change the role and world-building cues, then keep silhouette, color range, and limb-count constraints stable.",
    zhAdapt: "调整角色定位和世界观线索，再把轮廓、色彩范围和肢体数量限制保持稳定。"
  },
  test: {
    enLabel: "Style tests",
    zhLabel: "风格测试",
    enDescription: "comparison prompts, quality checks, style studies, and controlled visual experiments",
    zhDescription: "对比提示词、质量检查、风格研究和可控视觉实验",
    enFocus: "controlled variables, comparison logic, and evaluation clarity",
    zhFocus: "变量控制、对比逻辑和评估清晰度",
    enAdapt: "Keep one variable fixed, change one factor at a time, and define success before generation.",
    zhAdapt: "固定一个变量，每次只改一个因素，并在生成前先写清楚成功标准。"
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
    "regen-material-render-test": "Material render test prompt",
    "regen-coffee-bag-hero": "Specialty coffee bag product prompt",
    "generated-artisan-coffee-product-hero": "Artisan coffee product hero prompt",
    "candidate-headset-gaming-product": "Gaming headset product shot prompt",
    "regen-headphone-studio-hero": "Studio headphone product hero prompt",
    "regen-food-truck-night-poster": "Urban food truck night poster prompt",
    "generated-urban-night-food-truck-poster": "Food truck festival poster prompt"
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
    "regen-material-render-test": "材质渲染测试提示词",
    "regen-coffee-bag-hero": "精品咖啡袋产品图提示词",
    "generated-artisan-coffee-product-hero": "手作咖啡产品首图提示词",
    "candidate-headset-gaming-product": "游戏耳机产品图提示词",
    "regen-headphone-studio-hero": "棚拍耳机产品首图提示词",
    "regen-food-truck-night-poster": "城市夜市餐车海报提示词",
    "generated-urban-night-food-truck-poster": "餐车节活动海报提示词"
  }
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
}

function tagLine(tags) {
  if (!tags.length) return "";
  if (tags.length === 1) return tags[0];
  if (tags.length === 2) return `${tags[0]} and ${tags[1]}`;
  return `${tags.slice(0, -1).join(", ")}, and ${tags.at(-1)}`;
}

function zhTagLine(tags) {
  return tags.filter(Boolean).join("、");
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

function getSeoTitleTags(item) {
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const stopSet = new Set((seoTagStopByCategory[item.category] || []).map((tag) => tag.toLowerCase()));
  const picked = [];

  for (const tag of tags) {
    const normalized = String(tag || "").toLowerCase();
    if (!normalized || stopSet.has(normalized)) {
      continue;
    }
    if (picked.length >= 2) {
      break;
    }
    picked.push(tag);
  }

  if (!picked.length && tags.length) {
    picked.push(tags[0]);
  }

  return picked;
}

function getSeoGalleryTitle(item, lang) {
  if (item && item.id && seoTitleOverrideMap[lang] && seoTitleOverrideMap[lang][item.id]) {
    return seoTitleOverrideMap[lang][item.id];
  }

  const tags = getSeoTitleTags(item);

  if (lang === "zh") {
    const translated = tags.map((tag) => seoTagZhMap[tag] || tag);
    const first = translated[0] || "";
    const second = translated[1] || "";
    const zhBuilders = {
      product: () => (first ? `${first}产品图提示词` : "产品图提示词"),
      poster: () => (first ? `${first}海报提示词` : "海报提示词"),
      ui: () => {
        if (first && second) return `${first}${second}界面提示词`;
        if (first) return `${first}界面提示词`;
        return "界面提示词";
      },
      infographic: () => (first ? `${first}信息图提示词` : "信息图提示词"),
      typography: () => (first ? `${first}字体排版提示词` : "字体排版提示词"),
      photography: () => {
        if (first && second) return `${first}${second}摄影提示词`;
        if (first) return `${first}摄影提示词`;
        return "摄影提示词";
      },
      portrait: () => {
        if (first && second) return `${first}${second}人像提示词`;
        if (first) return `${first}人像提示词`;
        return "人像提示词";
      },
      character: () => {
        if (first && second) return `${first}${second}角色提示词`;
        if (first) return `${first}角色提示词`;
        return "角色提示词";
      },
      test: () => (first ? `${first}风格测试提示词` : "风格测试提示词")
    };
    return (zhBuilders[item.category] && zhBuilders[item.category]()) || `${item.title}提示词`;
  }

  const first = titleCaseSeoToken(tags[0] || "");
  const second = titleCaseSeoToken(tags[1] || "");
  const enBuilders = {
    product: () => {
      if (first && second) return `${first} ${second} product prompt`;
      if (first) return `${first} product prompt`;
      return "Product prompt";
    },
    poster: () => {
      if (first && second) return `${first} ${second} poster prompt`;
      if (first) return `${first} poster prompt`;
      return "Poster prompt";
    },
    ui: () => {
      if (first && second) return `${first} ${second} UI prompt`;
      if (first) return `${first} UI prompt`;
      return "UI prompt";
    },
    infographic: () => {
      if (first && second) return `${first} ${second} infographic prompt`;
      if (first) return `${first} infographic prompt`;
      return "Infographic prompt";
    },
    typography: () => {
      if (first && second) return `${first} ${second} typography prompt`;
      if (first) return `${first} typography prompt`;
      return "Typography prompt";
    },
    photography: () => {
      if (first && second) return `${first} ${second} photo prompt`;
      if (first) return `${first} photo prompt`;
      return "Photo prompt";
    },
    portrait: () => {
      if (first && second) return `${first} ${second} portrait prompt`;
      if (first) return `${first} portrait prompt`;
      return "Portrait prompt";
    },
    character: () => {
      if (first && second) return `${first} ${second} character prompt`;
      if (first) return `${first} character prompt`;
      return "Character prompt";
    },
    test: () => (first ? `${first} style prompt` : "Style prompt")
  };
  return (enBuilders[item.category] && enBuilders[item.category]()) || `${titleCaseSeoToken(item.title)} prompt`;
}

function getUniqueSeoGalleryTitle(item, lang) {
  const baseTitle = getSeoGalleryTitle(item, lang);
  const category = categoryMeta[item.category] || categoryMeta.product;
  const categoryLabel = lang === "zh" ? category.zhLabel : category.enLabel;
  const slugHint = titleCaseSeoToken(slugify(item.title).replaceAll("-", " "));
  if (!item || !item.title) {
    return baseTitle;
  }

  const originalWords = titleCaseSeoToken(item.title)
    .split(" ")
    .filter((word) => word && !baseTitle.toLowerCase().includes(word.toLowerCase()))
    .slice(0, 3)
    .join(" ");

  if (lang === "zh") {
    const titleHint = item.title
      .replace(/\b(prompt|test|photo|poster|ui|app|dashboard|product|portrait|infographic|typography|artwork)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    return titleHint && !baseTitle.includes(titleHint) ? `${baseTitle}：${titleHint}` : `${categoryLabel}${baseTitle}`;
  }

  return originalWords ? `${baseTitle} for ${originalWords}` : `${baseTitle} for ${slugHint}`;
}

function getModelGuidance(item, lang) {
  const guidance = {
    product: {
      en: {
        model: "Best with GPT Image, Midjourney, or other image models that handle product lighting and clean negative space.",
        ratio: "Try 4:5 for ecommerce cards, 1:1 for thumbnails, or 16:9 for landing-page hero tests."
      },
      zh: {
        model: "更适合用 GPT Image、Midjourney 或其他擅长产品光线与留白控制的图像模型。",
        ratio: "电商卡片建议 4:5，缩略图建议 1:1，落地页头图测试可以用 16:9。"
      }
    },
    poster: {
      en: {
        model: "Use models that can keep strong composition and title-safe blank areas without forcing fake text.",
        ratio: "Start with 3:4 or 2:3 for poster-style outputs, then crop for social previews."
      },
      zh: {
        model: "优先使用能保持强构图和标题留白、同时不乱生成假文字的图像模型。",
        ratio: "海报优先 3:4 或 2:3，再按社媒封面裁切。"
      }
    },
    ui: {
      en: {
        model: "Use a model that handles interface hierarchy, spacing, and realistic components; regenerate if text becomes noisy.",
        ratio: "Use 9:16 for mobile screens, 16:9 for SaaS hero mockups, and 4:3 for dashboard previews."
      },
      zh: {
        model: "适合使用能处理界面层级、留白和真实组件的模型；如果文字噪点太多，直接重生成。",
        ratio: "移动端界面用 9:16，SaaS 头图用 16:9，仪表盘预览用 4:3。"
      }
    },
    infographic: {
      en: {
        model: "Choose models that preserve modular layout and simple icons. Keep real explanatory text outside the generated image.",
        ratio: "Use 3:4 for vertical guides, 4:3 for presentation graphics, and 1:1 for social summaries."
      },
      zh: {
        model: "选择能保持模块结构和简单图标的模型。真正需要阅读的说明文字建议放在图片外部。",
        ratio: "竖版指南用 3:4，演示图用 4:3，社媒摘要用 1:1。"
      }
    },
    typography: {
      en: {
        model: "Use typography prompts as visual direction, not production-ready lettering. Check readability and logo similarity carefully.",
        ratio: "Try 1:1 for artwork, 4:5 for poster crops, and 16:9 for hero experiments."
      },
      zh: {
        model: "字体类提示词更适合作为视觉方向，不建议直接当最终商用字标；要检查可读性和是否像现有 logo。",
        ratio: "艺术图用 1:1，海报裁切用 4:5，头图实验用 16:9。"
      }
    },
    photography: {
      en: {
        model: "Use realistic image models and keep constraints around lens feel, natural imperfection, and no readable brand signs.",
        ratio: "Use 4:5 for editorial cards, 3:2 for photo studies, and 16:9 for cinematic scenes."
      },
      zh: {
        model: "适合使用写实图像模型，并保留镜头感、自然瑕疵、无可读品牌标识等限制。",
        ratio: "编辑卡片用 4:5，摄影练习用 3:2，电影感场景用 16:9。"
      }
    },
    portrait: {
      en: {
        model: "Use models with strong portrait realism. Keep constraints for natural skin texture and no celebrity resemblance.",
        ratio: "Use 4:5 for profile portraits, 3:4 for editorial frames, and 1:1 for avatar crops."
      },
      zh: {
        model: "适合使用人像真实感较强的模型，并保留自然皮肤质感、不要名人相似度等限制。",
        ratio: "资料头像用 4:5，编辑人像用 3:4，头像裁切用 1:1。"
      }
    },
    character: {
      en: {
        model: "Use models that can preserve character silhouette and repeatable details. Regenerate if limb count or style consistency breaks.",
        ratio: "Use 1:1 for mascot cards, 4:5 for sticker sheets, and 16:9 for character scenes."
      },
      zh: {
        model: "适合使用能保持角色轮廓和可重复细节的模型；如果肢体数量或风格一致性崩了，需要重生成。",
        ratio: "吉祥物卡片用 1:1，贴纸组用 4:5，角色场景用 16:9。"
      }
    },
    test: {
      en: {
        model: "Use the same model and seed settings when possible so the comparison tests only one visual variable.",
        ratio: "Use 16:9 or 4:3 for side-by-side tests, and keep the subject and lighting fixed."
      },
      zh: {
        model: "做对比测试时尽量固定同一个模型和种子，让每次只比较一个视觉变量。",
        ratio: "并排测试适合 16:9 或 4:3，同时固定主体和光线。"
      }
    }
  };

  const fallback = guidance.product;
  return (guidance[item.category] || fallback)[lang];
}

function getPromptVariables(item, lang) {
  const meta = categoryMeta[item.category] || categoryMeta.product;
  const tags = getSeoTitleTags(item);
  const tagText = lang === "zh"
    ? tags.map((tag) => seoTagZhMap[tag] || tag).join("、")
    : tagLine(tags.map(titleCaseSeoToken));
  if (lang === "zh") {
    return [
      `主体变量：把当前主题${tagText ? `（${tagText}）` : ""}替换成你的产品、人物、活动或场景。`,
      `构图变量：保留${meta.zhFocus}，再调整近景、俯拍、居中构图、留白或多分镜。`,
      "输出变量：按平台选择 1:1、4:5、9:16 或 16:9，并提前说明是否需要标题留白。"
    ];
  }
  return [
    `Subject variable: replace the current theme${tagText ? ` (${tagText})` : ""} with your product, person, event, or scene.`,
    `Composition variable: keep the quality focus around ${meta.enFocus}, then adjust close-up, top-down, centered framing, whitespace, or panels.`,
    "Output variable: choose 1:1, 4:5, 9:16, or 16:9 based on the publishing channel and specify whether title-safe space is needed."
  ];
}

function getFailureChecks(item, lang) {
  const checks = {
    product: {
      en: ["Remove fake labels, brand-like marks, and unreadable package text.", "Regenerate if the product shape changes between attempts.", "Add a copy-safe blank area when the image is meant for ads."],
      zh: ["去掉假标签、疑似品牌标识和不可读包装文字。", "如果产品形状每次都变，需要重新生成或强化主体描述。", "用于广告时，要明确保留标题和卖点文案留白。"]
    },
    poster: {
      en: ["Do not rely on generated text for final event information.", "Check whether the title area is clean enough for real copy.", "Regenerate if the focal object is crowded by decorative elements."],
      zh: ["不要依赖生图里的文字作为最终活动信息。", "检查标题区是否足够干净，方便后期加真实文案。", "如果主体被装饰元素挤压，需要降低元素密度。"]
    },
    ui: {
      en: ["Ignore tiny generated microcopy; judge layout, spacing, and component hierarchy.", "Regenerate if navigation or screen logic becomes impossible.", "Use the result as a visual mockup, not final UI text."],
      zh: ["忽略细小假文字，重点判断布局、留白和组件层级。", "如果导航或界面逻辑不成立，需要重生成。", "把结果当视觉 mockup，不要当最终 UI 文案。"]
    },
    infographic: {
      en: ["Keep real instructional text outside the generated image.", "Check that sections and arrows read in a clear order.", "Reduce icon density if the layout becomes noisy."],
      zh: ["真正需要阅读的说明文字放在图片外部。", "检查模块和箭头是否有清晰阅读顺序。", "如果图标太密，降低密度并减少分区。"]
    },
    typography: {
      en: ["Check readability before using the design as a reference.", "Avoid logo-like shapes that could resemble existing brands.", "Regenerate if letterforms become decorative but unreadable."],
      zh: ["使用前先检查字形是否可读。", "避免过于像现有品牌 logo 的形状。", "如果字母变成纯装饰且不可读，需要重生成。"]
    },
    photography: {
      en: ["Check for readable signs, brand marks, or recognizable people.", "Regenerate if realism breaks around hands, reflections, or lighting.", "Keep natural imperfections; over-polished scenes look less editorial."],
      zh: ["检查是否出现可读招牌、品牌标识或可识别人物。", "如果手部、反光或光线不真实，需要重生成。", "保留自然瑕疵，过度精修会降低纪实感。"]
    },
    portrait: {
      en: ["Avoid celebrity resemblance and overly smooth skin.", "Check anatomy, hands, eye direction, and background logos.", "Use neutral identity descriptions rather than real person names."],
      zh: ["避免名人相似度和过度磨皮。", "检查结构、手部、眼神方向和背景 logo。", "用中性的身份描述，不要写真实人物姓名。"]
    },
    character: {
      en: ["Check limb count, silhouette consistency, and repeatable details.", "Avoid known IP resemblance.", "Use simple shapes if the character must become a sticker or mascot."],
      zh: ["检查肢体数量、轮廓一致性和可重复细节。", "避免像已有 IP。", "如果要做贴纸或吉祥物，优先使用简单轮廓。"]
    },
    test: {
      en: ["Change only one variable at a time.", "Keep subject, lighting, and composition fixed for fair comparison.", "Judge the test by the stated visual goal, not by decoration."],
      zh: ["每次只改变一个变量。", "为了公平对比，要固定主体、光线和构图。", "按测试目标判断结果，不要只看装饰感。"]
    }
  };
  return (checks[item.category] || checks.product)[lang];
}

function getDetailPath(item, lang) {
  const slug = slugify(item.title);
  return lang === "zh" ? `/zh/gallery/${item.category}/${slug}/` : `/gallery/${item.category}/${slug}/`;
}

function getCategoryPath(category, lang) {
  return lang === "zh" ? `/zh/gallery/${category}/` : `/gallery/${category}/`;
}

function getCategoryGuide(meta, lang) {
  const isZh = lang === "zh";
  return {
    hero: isZh
      ? `这里收录 PromptArc 原创生成的${meta.zhLabel}提示词和图片案例。每个案例都包含可复制的英文提示词、生成图预览、适用场景和改写建议，适合快速参考构图、风格、主体、比例和质量限制。`
      : `Browse PromptArc original ${meta.enLabel.toLowerCase()} prompt examples with generated images, copy-ready prompts, use cases, and adaptation notes. Each example is built to help you study subject framing, style cues, ratio, composition, and quality guardrails.`,
    writing: isZh
      ? `写${meta.zhLabel}提示词时，先明确最终用途，再描述主体、构图、光线、风格和限制。不要只堆形容词，最好告诉模型画面要解决什么问题，例如商业展示、教程解释、社媒传播、品牌角色或视觉测试。`
      : `To write better ${meta.enLabel.toLowerCase()} prompts, start with the job the image must do, then describe the subject, composition, light, style, and constraints. Avoid adjective piles; tell the model whether the output is for ecommerce, education, social content, interface exploration, brand character work, or visual testing.`,
    quality: isZh
      ? `优质结果通常来自清晰结构：主体要具体，场景要可视化，构图要有层级，限制要减少乱码、变形、拥挤和侵权风险。复制任意案例后，建议先替换主体，再调整比例和细节。`
      : `Strong results usually come from structure: make the subject specific, make the scene visual, define hierarchy, and add constraints that reduce artifacts, clutter, distorted anatomy, unreadable text, or brand-risky output. After copying a prompt, swap the subject first, then tune ratio and detail.`,
    faq: isZh
      ? [
          ["这些提示词可以直接复制吗？", "可以。每个案例都保留英文原始提示词，适合复制到图像生成工具里测试，也可以点击做同款进入 PromptArc 工具页继续改写。"],
          ["为什么提示词是英文？", "多数主流图像模型对英文视觉描述更稳定。中文页面会解释用途和标签，但保留英文提示词方便直接使用。"],
          ["我应该怎么改成自己的版本？", `先替换主体或行业，再保留${meta.zhFocus}这类质量要求，最后按目标平台调整比例和输出格式。`]
        ]
      : [
          ["Can I copy these prompts directly?", "Yes. Each example includes an English prompt that can be copied into an image generation tool or opened in the PromptArc tool for further rewriting."],
          ["Why are the prompts written in English?", "Most mainstream image models respond more consistently to English visual instructions. The page adds context, tags, and adaptation guidance around each prompt."],
          ["How should I adapt a prompt?", `Swap the subject or niche first, keep quality constraints around ${meta.enFocus}, then adjust ratio and output format for your channel.`]
        ]
  };
}

function buildRelatedCards(currentItem, lang) {
  const isZh = lang === "zh";
  const related = galleryItems
    .filter((candidate) => candidate.id !== currentItem.id && candidate.category === currentItem.category)
    .slice(0, 6);

  if (!related.length) return "";

  const cards = related
    .map((item) => {
      const imageUrl = `${galleryAssetBase}${item.imageUrl.replace("/assets/gallery/", "/assets/gallery/thumbs/")}`;
      return `<a class="prompt-related-card" href="${getDetailPath(item, lang)}">
        <img src="${imageUrl}" alt="${escapeHtml(getUniqueSeoGalleryTitle(item, lang))}" loading="lazy" decoding="async">
        <strong>${escapeHtml(getUniqueSeoGalleryTitle(item, lang))}</strong>
      </a>`;
    })
    .join("");

  return `<section class="prompt-related-section">
    <div class="prompt-related-head">
      <p class="eyebrow">${isZh ? "继续浏览" : "Keep exploring"}</p>
      <h2>${isZh ? "同类提示词案例" : "Related prompt examples"}</h2>
    </div>
    <div class="prompt-related-grid">${cards}</div>
  </section>`;
}

function buildDetailPage(item, lang, previousItem, nextItem) {
  const slug = slugify(item.title);
  const meta = categoryMeta[item.category] || categoryMeta.product;
  const isZh = lang === "zh";
  const basePath = isZh ? `/zh/gallery/${item.category}/${slug}/` : `/gallery/${item.category}/${slug}/`;
  const pageUrl = `https://www.promptarc.cc${basePath}`;
  const altUrl = `https://www.promptarc.cc${isZh ? `/gallery/${item.category}/${slug}/` : `/zh/gallery/${item.category}/${slug}/`}`;
  const categoryUrl = `https://www.promptarc.cc${isZh ? `/zh/gallery/${item.category}/` : `/gallery/${item.category}/`}`;
  const promptEncoded = encodeURIComponent(item.prompt);
  const imageUrl = `${galleryAssetBase}${item.imageUrl}`;
  const thumbPath = item.imageUrl.replace("/assets/gallery/", "/assets/gallery/thumbs/");
  const thumbUrl = `${galleryAssetBase}${thumbPath}`;
  const title = escapeHtml(item.title);
  const seoTitle = escapeHtml(getUniqueSeoGalleryTitle(item, lang));
  const prompt = escapeHtml(item.prompt);
  const displayTags = getSeoTitleTags(item).map((tag) => (isZh ? (seoTagZhMap[tag] || tag) : tag));
  const tags = displayTags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");
  const allTags = (Array.isArray(item.tags) ? item.tags : []).map((tag) => (isZh ? (seoTagZhMap[tag] || tag) : tag));
  const allTagChips = allTags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");
  const intro = isZh
    ? `这条 ${seoTitle} 适合做${escapeHtml(meta.zhDescription)}。${displayTags.length ? ` 这个案例的主题重点包括 ${escapeHtml(displayTags.join("、"))}。` : ""}`
    : `Use this ${seoTitle} when you need ${escapeHtml(meta.enDescription)}.${displayTags.length ? ` The theme on this example points to ${escapeHtml(tagLine(displayTags))}.` : ""}`;
  const why = isZh
    ? `这条提示词先锁定${displayTags.length ? escapeHtml(zhTagLine(displayTags)) : escapeHtml(meta.zhLabel)}，再补充${escapeHtml(meta.zhFocus)}，最后用清晰结构和质量限制减少跑偏。用户复制后只需要替换主体、风格或比例，就能快速生成同类型图片。`
    : `This prompt anchors ${displayTags.length ? escapeHtml(tagLine(displayTags)) : escapeHtml(meta.enLabel.toLowerCase())}, then adds ${escapeHtml(meta.enFocus)} and practical quality guardrails. It is easy to reuse because the subject can be swapped without losing the composition logic.`;
  const best = isZh
    ? `这个案例更适合${escapeHtml(meta.zhDescription)}。它最强的地方在于${escapeHtml(meta.zhFocus)}。`
    : `This example is best for ${escapeHtml(meta.enDescription)}. The main strength here is ${escapeHtml(meta.enFocus)}.`;
  const adapt = isZh ? escapeHtml(meta.zhAdapt) : escapeHtml(meta.enAdapt);
  const label = isZh ? meta.zhLabel : meta.enLabel;
  const langSwitch = isZh
    ? `<div class="prompt-page-lang" aria-label="语言切换"><a href="/gallery/${item.category}/${slug}/">EN</a><span class="is-active">中文</span></div>`
    : `<div class="prompt-page-lang" aria-label="Language switch"><span class="is-active">EN</span><a href="/zh/gallery/${item.category}/${slug}/">中文</a></div>`;
  const nav = isZh
    ? `<nav class="prompt-page-nav"><a href="/zh/">首页</a><a href="/zh/gallery/">图库</a><a href="/zh/tool/">工具</a><a href="/zh/library/">模板库</a></nav>`
    : `<nav class="prompt-page-nav"><a href="/">Home</a><a href="/gallery/">Gallery</a><a href="/tool/">Tool</a><a href="/library/">Library</a></nav>`;
  const homePath = isZh ? "/zh/" : "/";
  const small = isZh ? "AI 图像提示词库" : "AI image prompt library";
  const eyebrow = escapeHtml(label);
  const backText = isZh ? `返回${escapeHtml(meta.zhLabel)}` : `Back to ${escapeHtml(meta.enLabel.toLowerCase())}`;
  const allText = isZh ? "浏览全部提示词详情页" : "Browse all prompt pages";
  const previousText = isZh ? "上一张" : "Previous";
  const nextText = isZh ? "下一张" : "Next";
  const previousTitle = previousItem ? escapeHtml(getUniqueSeoGalleryTitle(previousItem, lang)) : "";
  const nextTitle = nextItem ? escapeHtml(getUniqueSeoGalleryTitle(nextItem, lang)) : "";
  const mediaPreviousLink = previousItem
    ? `<a class="prompt-detail-media-nav prompt-detail-media-prev" href="${getDetailPath(previousItem, lang)}" aria-label="${previousText}" title="${previousTitle}">‹</a>`
    : "";
  const mediaNextLink = nextItem
    ? `<a class="prompt-detail-media-nav prompt-detail-media-next" href="${getDetailPath(nextItem, lang)}" aria-label="${nextText}" title="${nextTitle}">›</a>`
    : "";
  const allFilterText = isZh ? `全部 ${galleryItems.length}` : `All ${galleryItems.length}`;
  const categoryFilters = [
    `<a href="${isZh ? "/zh/gallery/" : "/gallery/"}">${escapeHtml(allFilterText)}</a>`,
    ...Object.entries(categoryMeta)
    .map(([category, categoryInfo]) => {
      const categoryLabel = isZh ? categoryInfo.zhLabel : categoryInfo.enLabel;
      const count = categoryCounts[category] || 0;
      return `<a href="${isZh ? `/zh/gallery/${category}/` : `/gallery/${category}/`}" class="${category === item.category ? "is-active" : ""}">${escapeHtml(`${categoryLabel} ${count}`)}</a>`;
    })
  ].join("");
  const popularTags = [
    ["mobile UI", isZh ? "移动端 UI" : "Mobile UI"],
    ["editorial", isZh ? "编辑风" : "Editorial"],
    ["coffee", isZh ? "咖啡" : "Coffee"],
    ["dashboard", isZh ? "仪表盘" : "Dashboard"],
    ["documentary", isZh ? "纪实" : "Documentary"],
    ["event", isZh ? "活动" : "Event"],
    ["launch", isZh ? "上新" : "Launch"],
    ["lettering", isZh ? "字形" : "Lettering"],
    ["portrait", isZh ? "人像" : "Portrait"],
    ["travel", isZh ? "旅行" : "Travel"],
    ["product hero", isZh ? "产品首图" : "Product hero"],
    ["wellness", isZh ? "健康" : "Wellness"]
  ];
  const tagFilters = popularTags
    .map(([tag, tagLabel]) => {
      const href = `${isZh ? "/zh/gallery/" : "/gallery/"}?tag=${encodeURIComponent(tag)}`;
      const active = Array.isArray(item.tags) && item.tags.includes(tag);
      return `<a href="${href}" class="${active ? "is-active" : ""}">${escapeHtml(tagLabel)}</a>`;
    })
    .join("");
  const remixText = isZh ? "做同款" : "Remix this prompt";
  const copyText = isZh ? "复制提示词" : "Copy prompt";
  const whyTitle = isZh ? "这条提示词为什么有效" : "Why this prompt works";
  const bestTitle = isZh ? "适合的使用场景" : "Best use cases";
  const adaptTitle = isZh ? "怎么改写成你自己的版本" : "How to adapt it";
  const promptTitle = isZh ? "英文原始提示词" : "Original prompt";
  const sourceText = isZh ? "PromptArc 原创案例" : "PromptArc original";
  const imageCaption = isZh ? "生成图片预览" : "Generated image preview";
  const fullImageText = isZh ? "查看原图" : "View full image";
  const detailSummary = isZh
    ? `复制这条提示词，或点击做同款进入工具页继续改比例、主体、风格和画面细节。`
    : `Copy this prompt, or open it in the tool to adjust ratio, subject, style, and visual details.`;
  const quickUseTitle = isZh ? "你可以怎么用" : "How to use it";
  const guidance = getModelGuidance(item, lang);
  const modelTitle = isZh ? "模型与比例建议" : "Model and ratio notes";
  const quickUseItems = isZh
    ? [
        `直接复制提示词，用于生成${escapeHtml(meta.zhLabel)}方向的新图。`,
        `替换主体或场景，保留${escapeHtml(meta.zhFocus)}这组质量要求。`,
        `把标签 ${escapeHtml(zhTagLine(allTags.slice(0, 4)) || meta.zhLabel)} 当作后续扩展关键词。`
      ]
    : [
        `Copy the prompt to generate a new ${escapeHtml(meta.enLabel.toLowerCase())} image.`,
        `Swap the subject or scene while keeping ${escapeHtml(meta.enFocus)} as quality constraints.`,
        `Use ${escapeHtml(tagLine(allTags.slice(0, 4)) || meta.enLabel)} as expansion keywords.`
      ];
  const quickUseList = quickUseItems.map((itemText) => `<li>${itemText}</li>`).join("");
  const variableTitle = isZh ? "可替换变量" : "Reusable variables";
  const failureTitle = isZh ? "常见失败点" : "Common failure checks";
  const workflowTitle = isZh ? "推荐工作流" : "Suggested workflow";
  const variables = getPromptVariables(item, lang).map((itemText) => `<li>${escapeHtml(itemText)}</li>`).join("");
  const failures = getFailureChecks(item, lang).map((itemText) => `<li>${escapeHtml(itemText)}</li>`).join("");
  const workflowItems = isZh
    ? [
        "先复制英文提示词并只替换主体，不要一次改太多变量。",
        "生成 3-5 张候选图，保留构图最稳定的一张。",
        "再根据目标平台改比例、裁切和标题留白。"
      ]
    : [
        "Copy the English prompt and replace only the subject first.",
        "Generate 3-5 candidates and keep the version with the most stable composition.",
        "Then tune ratio, crop, and title-safe space for the publishing channel."
      ];
  const workflowList = workflowItems.map((itemText) => `<li>${escapeHtml(itemText)}</li>`).join("");

  return `<!DOCTYPE html>
<html lang="${isZh ? "zh-CN" : "en"}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${seoTitle} | PromptArc</title>
  <meta name="description" content="${intro}">
  <meta name="robots" content="index,follow">
  <meta property="og:title" content="${seoTitle} | PromptArc">
  <meta property="og:description" content="${intro}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:image" content="${imageUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="${pageUrl}">
  <link rel="alternate" hreflang="${isZh ? "zh-CN" : "en"}" href="${pageUrl}">
  <link rel="alternate" hreflang="${isZh ? "en" : "zh-CN"}" href="${altUrl}">
  <link rel="alternate" hreflang="x-default" href="${isZh ? altUrl : pageUrl}">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/style.css">
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "ImageObject",
          "@id": "${pageUrl}#image",
          "contentUrl": "${imageUrl}",
          "thumbnailUrl": "${thumbUrl}",
          "caption": "${escapeHtml(item.title)}",
          "name": "${escapeHtml(item.title)}"
        },
        {
          "@type": "CreativeWork",
          "@id": "${pageUrl}#work",
          "name": "${seoTitle}",
          "headline": "${seoTitle}",
          "description": "${intro}",
          "inLanguage": "${isZh ? "zh-CN" : "en"}",
          "image": {
            "@id": "${pageUrl}#image"
          }
        }
      ]
    }
  </script>
</head>
<body data-page="prompt-hub">
  <div class="prompt-page-shell">
    <header class="prompt-page-topbar">
      <a class="prompt-page-brand" href="${homePath}"><span class="prompt-page-logo">PA</span><span><strong data-site-name>PromptArc</strong><small>${small}</small></span></a>
      ${nav}
      ${langSwitch}
    </header>
    <main class="prompt-detail-page">
      <section class="prompt-detail-filter" aria-label="${isZh ? "提示词筛选" : "Prompt filters"}">
        <div class="prompt-detail-filter-row">${categoryFilters}</div>
        <div class="prompt-detail-filter-row prompt-detail-filter-tags">${tagFilters}</div>
      </section>
      <section class="prompt-detail-hero">
        <figure class="prompt-detail-media">
          ${mediaPreviousLink}
          <a href="${imageUrl}" aria-label="${fullImageText}">
            <img src="${thumbUrl}" alt="${title} ${isZh ? "AI 图像示例" : "AI image example"}." loading="eager" decoding="async" fetchpriority="high">
          </a>
          ${mediaNextLink}
          <figcaption>${imageCaption} · ${sourceText} · <a href="${imageUrl}">${fullImageText}</a></figcaption>
        </figure>
        <article class="prompt-detail-panel">
          <p class="eyebrow">${eyebrow}</p>
          <h1>${seoTitle}</h1>
          <p class="prompt-detail-intro">${intro}</p>
          <div class="gallery-tags">${allTagChips || tags}</div>
          <div class="prompt-detail-prompt-card">
            <div class="prompt-detail-prompt-head">
              <strong>${promptTitle}</strong>
              <span>${sourceText}</span>
            </div>
            <pre class="code-block" id="prompt-${slug}${isZh ? "-zh" : ""}">${prompt}</pre>
          </div>
          <div class="prompt-detail-actions">
            <button class="button" type="button" data-copy-target="#prompt-${slug}${isZh ? "-zh" : ""}">${copyText}</button>
            <a class="button ghost" href="${isZh ? "/zh/tool/" : "/tool/"}?prompt=${promptEncoded}">${remixText}</a>
          </div>
          <p class="prompt-detail-note">${detailSummary}</p>
        </article>
      </section>
      <section class="prompt-detail-insights">
        <article class="prompt-detail-card">
          <h2>${quickUseTitle}</h2>
          <ul>${quickUseList}</ul>
        </article>
        <article class="prompt-detail-card">
          <h2>${whyTitle}</h2>
          <p>${why}</p>
        </article>
        <article class="prompt-detail-card">
          <h2>${bestTitle}</h2>
          <p>${best}</p>
        </article>
        <article class="prompt-detail-card">
          <h2>${adaptTitle}</h2>
          <p>${adapt}</p>
        </article>
        <article class="prompt-detail-card prompt-detail-card-wide">
          <h2>${modelTitle}</h2>
          <p>${escapeHtml(guidance.model)}</p>
          <p>${escapeHtml(guidance.ratio)}</p>
        </article>
        <article class="prompt-detail-card prompt-detail-card-wide">
          <h2>${variableTitle}</h2>
          <ul>${variables}</ul>
        </article>
        <article class="prompt-detail-card prompt-detail-card-wide">
          <h2>${failureTitle}</h2>
          <ul>${failures}</ul>
        </article>
        <article class="prompt-detail-card prompt-detail-card-wide">
          <h2>${workflowTitle}</h2>
          <ul>${workflowList}</ul>
        </article>
      </section>
      <nav class="prompt-detail-links">
        <a href="${isZh ? `/zh/gallery/${item.category}/` : `/gallery/${item.category}/`}">${backText}</a>
        <a href="${isZh ? "/zh/gallery/detail-pages/" : "/gallery/detail-pages/"}">${allText}</a>
      </nav>
      ${buildRelatedCards(item, lang)}
    </main>
  </div>
  <script src="/config.js"></script>
  <script src="/app.js"></script>
</body>
</html>`;
}

function buildDirectoryPage(lang, byCategory) {
  const isZh = lang === "zh";
  const sections = Object.entries(byCategory)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, items]) => {
      const meta = categoryMeta[category] || categoryMeta.product;
      const label = isZh ? meta.zhLabel : meta.enLabel;
      const links = items
        .sort((a, b) => a.title.localeCompare(b.title))
        .map((item) => {
          const slug = slugify(item.title);
          const href = isZh ? `/zh/gallery/${category}/${slug}/` : `/gallery/${category}/${slug}/`;
          return `<li><a href="${href}">${escapeHtml(getUniqueSeoGalleryTitle(item, lang))}</a></li>`;
        })
        .join("");

      return `<section class="card compact-top"><p class="eyebrow">${escapeHtml(label)}</p><ul class="template-list">${links}</ul></section>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="${isZh ? "zh-CN" : "en"}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isZh ? "全部图像提示词详情页" : "All AI Image Prompt Pages"} | PromptArc</title>
  <meta name="description" content="${isZh ? "按分类浏览 PromptArc 的全部 AI 图像提示词详情页。" : "Browse the full directory of PromptArc AI image prompt pages by category."}">
  <meta name="robots" content="index,follow">
  <meta property="og:title" content="${isZh ? "全部图像提示词详情页" : "All AI Image Prompt Pages"} | PromptArc">
  <meta property="og:description" content="${isZh ? "一个按分类整理的 PromptArc 图像提示词详情页目录。" : "A category-by-category directory of PromptArc image prompt detail pages."}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://www.promptarc.cc/${isZh ? "zh/" : ""}gallery/detail-pages/">
  <meta property="og:image" content="https://www.promptarc.cc/assets/og-cover.svg">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="https://www.promptarc.cc/${isZh ? "zh/" : ""}gallery/detail-pages/">
  <link rel="alternate" hreflang="${isZh ? "zh-CN" : "en"}" href="https://www.promptarc.cc/${isZh ? "zh/" : ""}gallery/detail-pages/">
  <link rel="alternate" hreflang="${isZh ? "en" : "zh-CN"}" href="https://www.promptarc.cc/${isZh ? "" : "zh/"}gallery/detail-pages/">
  <link rel="alternate" hreflang="x-default" href="https://www.promptarc.cc/gallery/detail-pages/">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/style.css">
</head>
<body data-page="prompt-hub">
  <div class="prompt-page-shell">
    <header class="prompt-page-topbar">
      <a class="prompt-page-brand" href="${isZh ? "/zh/" : "/"}"><span class="prompt-page-logo">PA</span><span><strong data-site-name>PromptArc</strong><small>${isZh ? "AI 图像提示词库" : "AI image prompt library"}</small></span></a>
      ${isZh ? '<nav class="prompt-page-nav"><a href="/zh/">首页</a><a href="/zh/gallery/">图库</a><a href="/zh/tool/">工具</a><a href="/zh/library/">模板库</a></nav>' : '<nav class="prompt-page-nav"><a href="/">Home</a><a href="/gallery/">Gallery</a><a href="/tool/">Tool</a><a href="/library/">Library</a></nav>'}
      ${isZh ? '<div class="prompt-page-lang" aria-label="语言切换"><a href="/gallery/detail-pages/">EN</a><span class="is-active">中文</span></div>' : '<div class="prompt-page-lang" aria-label="Language switch"><span class="is-active">EN</span><a href="/zh/gallery/detail-pages/">中文</a></div>'}
    </header>
    <main class="prompt-page-main">
      <section class="prompt-subhero">
        <p class="prompt-page-kicker">${isZh ? "提示词详情页目录" : "Prompt page directory"}</p>
        <h1>${isZh ? "全部图像提示词详情页。" : "All AI image prompt detail pages."}</h1>
        <p>${isZh ? "这个页面按分类整理了 PromptArc 的全部图像提示词落地页，方便用户和搜索引擎发现完整内容库。" : "Use this page to browse every PromptArc image prompt landing page by category. It is built to help users and search engines discover the full library."}</p>
      </section>
      ${sections}
    </main>
  </div>
</body>
</html>`;
}

function buildCategoryPage(category, items, lang) {
  const isZh = lang === "zh";
  const meta = categoryMeta[category] || categoryMeta.product;
  const categoryTitleMap = {
    product: "Product Ad",
    poster: "Poster",
    ui: "UI Mockup",
    infographic: "Infographic",
    typography: "Typography",
    photography: "Photography",
    portrait: "Portrait",
    character: "Character",
    test: "Style Test"
  };
  const guide = getCategoryGuide(meta, lang);
  const label = isZh ? meta.zhLabel : meta.enLabel;
  const count = items.length;
  const title = isZh
    ? `${label} AI 图像提示词案例`
    : `AI ${categoryTitleMap[category] || meta.enLabel} Prompt Examples`;
  const description = isZh
    ? `浏览 ${count} 个 PromptArc 原创${label}提示词和图片案例，复制英文提示词，学习${meta.zhFocus}，并快速改写成自己的版本。`
    : `Browse ${count} PromptArc original ${meta.enLabel.toLowerCase()} prompt examples with generated images, copy-ready prompts, and practical notes on ${meta.enFocus}.`;
  const pagePath = getCategoryPath(category, lang);
  const pageUrl = `https://www.promptarc.cc${pagePath}`;
  const altUrl = `https://www.promptarc.cc${getCategoryPath(category, isZh ? "en" : "zh")}`;
  const homePath = isZh ? "/zh/" : "/";
  const nav = isZh
    ? `<nav class="prompt-page-nav"><a href="/zh/">首页</a><a href="/zh/gallery/" aria-current="page">图库</a><a href="/zh/tool/">工具</a><a href="/zh/recommended-tools/">工具推荐</a></nav>`
    : `<nav class="prompt-page-nav"><a href="/">Home</a><a href="/gallery/" aria-current="page">Gallery</a><a href="/tool/">Tool</a><a href="/recommended-tools/">Tools</a></nav>`;
  const langSwitch = isZh
    ? `<div class="prompt-page-lang" aria-label="语言切换"><a href="${getCategoryPath(category, "en")}">EN</a><span class="is-active">中文</span></div>`
    : `<div class="prompt-page-lang" aria-label="Language switch"><span class="is-active">EN</span><a href="${getCategoryPath(category, "zh")}">中文</a></div>`;
  const examples = items
    .slice(0, 6)
    .map((item) => `<li><a href="${getDetailPath(item, lang)}">${escapeHtml(getUniqueSeoGalleryTitle(item, lang))}</a></li>`)
    .join("");
  const featuredCards = items
    .slice(0, 12)
    .map((item) => {
      const thumbUrl = `${galleryAssetBase}${item.imageUrl.replace("/assets/gallery/", "/assets/gallery/thumbs/")}`;
      const itemTitle = escapeHtml(getUniqueSeoGalleryTitle(item, lang));
      return `<a class="prompt-category-card" href="${getDetailPath(item, lang)}">
        <img src="${thumbUrl}" alt="${itemTitle}" loading="lazy" decoding="async">
        <strong>${itemTitle}</strong>
        <span>${escapeHtml((item.tags || []).slice(0, 3).map((tag) => (isZh ? (seoTagZhMap[tag] || tag) : titleCaseSeoToken(tag))).join(isZh ? "、" : " · "))}</span>
      </a>`;
    })
    .join("");
  const tagCloud = Array.from(new Set(items.flatMap((item) => item.tags || [])))
    .slice(0, 16)
    .map((tag) => {
      const labelText = isZh ? (seoTagZhMap[tag] || tag) : titleCaseSeoToken(tag);
      return `<a href="${isZh ? "/zh/gallery/" : "/gallery/"}?tag=${encodeURIComponent(tag)}">${escapeHtml(labelText)}</a>`;
    })
    .join("");
  const faq = guide.faq
    .map(([question, answer]) => `<details><summary>${escapeHtml(question)}</summary><p>${escapeHtml(answer)}</p></details>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="${isZh ? "zh-CN" : "en"}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} | PromptArc</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index,follow">
  <meta property="og:title" content="${escapeHtml(title)} | PromptArc">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:image" content="https://www.promptarc.cc/assets/og-cover.svg">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="${pageUrl}">
  <link rel="alternate" hreflang="${isZh ? "zh-CN" : "en"}" href="${pageUrl}">
  <link rel="alternate" hreflang="${isZh ? "en" : "zh-CN"}" href="${altUrl}">
  <link rel="alternate" hreflang="x-default" href="https://www.promptarc.cc${getCategoryPath(category, "en")}">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/style.css">
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": "${pageUrl}#webpage",
          "url": "${pageUrl}",
          "name": "${escapeHtml(title)}",
          "description": "${escapeHtml(description)}",
          "inLanguage": "${isZh ? "zh-CN" : "en"}"
        },
        {
          "@type": "FAQPage",
          "@id": "${pageUrl}#faq",
          "mainEntity": ${JSON.stringify(guide.faq.map(([name, text]) => ({
            "@type": "Question",
            name,
            acceptedAnswer: {
              "@type": "Answer",
              text
            }
          })), null, 10)}
        }
      ]
    }
  </script>
</head>
<body data-page="prompt-hub">
  <div class="prompt-page-shell">
    <header class="prompt-page-topbar">
      <a class="prompt-page-brand" href="${homePath}"><span class="prompt-page-logo">PA</span><span><strong data-site-name>PromptArc</strong><small>${isZh ? "AI 图像提示词库" : "AI image prompt library"}</small></span></a>
      ${nav}
      ${langSwitch}
    </header>
    <main class="prompt-page-main">
      <section class="prompt-subhero prompt-category-hero">
        <p class="prompt-page-kicker">${escapeHtml(label)} · ${count} ${isZh ? "套案例" : "examples"}</p>
        <h1>${escapeHtml(title)}</h1>
        <p>${guide.hero}</p>
        <div class="button-row">
          <a class="button" href="${isZh ? "/zh/tool/?mode=image" : "/tool/?mode=image"}">${isZh ? "改写一个提示词" : "Refine a prompt"}</a>
          <a class="button ghost" href="${isZh ? "/zh/gallery/" : "/gallery/"}">${isZh ? "返回完整图库" : "Back to full gallery"}</a>
        </div>
      </section>

      <section class="prompt-category-guide">
        <article class="prompt-panel">
          <h2>${isZh ? `怎么写更好的${label}提示词` : `How to write better ${meta.enLabel.toLowerCase()} prompts`}</h2>
          <p>${guide.writing}</p>
        </article>
        <article class="prompt-panel">
          <h2>${isZh ? "质量检查重点" : "Quality checklist"}</h2>
          <p>${guide.quality}</p>
        </article>
        <article class="prompt-panel">
          <h2>${isZh ? "热门主题词" : "Popular theme tags"}</h2>
          <div class="prompt-category-tags">${tagCloud}</div>
        </article>
      </section>

      <section class="prompt-panel prompt-category-examples">
        <div>
          <p class="eyebrow">${isZh ? "可索引案例" : "Indexable examples"}</p>
          <h2>${isZh ? "从这些详情页开始" : "Start with these detail pages"}</h2>
        </div>
        <ul class="template-list">${examples}</ul>
      </section>

      <section class="prompt-panel prompt-category-featured">
        <div>
          <p class="eyebrow">${isZh ? "精选图库入口" : "Featured gallery entries"}</p>
          <h2>${isZh ? `${label}提示词精选案例` : `Featured ${meta.enLabel.toLowerCase()} prompt examples`}</h2>
          <p>${isZh ? "这些入口把图片、主题词和提示词说明连接起来，适合用户快速浏览，也适合搜索引擎理解这个分类的主要内容。" : "These entries connect image previews, topic-focused titles, and prompt notes so users and search engines can understand the category faster."}</p>
        </div>
        <div class="prompt-category-card-grid">${featuredCards}</div>
      </section>

      <section class="prompt-panel prompt-category-faq">
        <h2>${isZh ? "常见问题" : "FAQ"}</h2>
        ${faq}
      </section>

      <section class="prompt-grid-panel">
        <div class="image-gallery-grid" data-gallery-grid data-gallery-category="${category}"></div>
      </section>
    </main>
  </div>
  <script src="/config.js"></script>
  <script src="/gallery/gallery-data.js"></script>
  <script src="/app.js"></script>
</body>
</html>`;
}

const byCategory = {};
const sitemapUrls = new Set([
  "https://www.promptarc.cc/",
  "https://www.promptarc.cc/tool/",
  "https://www.promptarc.cc/library/",
  "https://www.promptarc.cc/gallery/",
  "https://www.promptarc.cc/gallery/detail-pages/",
  "https://www.promptarc.cc/gallery/product/",
  "https://www.promptarc.cc/gallery/poster/",
  "https://www.promptarc.cc/gallery/ui/",
  "https://www.promptarc.cc/gallery/infographic/",
  "https://www.promptarc.cc/gallery/typography/",
  "https://www.promptarc.cc/gallery/photography/",
  "https://www.promptarc.cc/gallery/character/",
  "https://www.promptarc.cc/gallery/portrait/",
  "https://www.promptarc.cc/gallery/test/",
  "https://www.promptarc.cc/image-prompt-pack/",
  "https://www.promptarc.cc/free-pack/",
  "https://www.promptarc.cc/recommended-tools/",
  "https://www.promptarc.cc/about/",
  "https://www.promptarc.cc/contact/",
  "https://www.promptarc.cc/privacy/",
  "https://www.promptarc.cc/terms/",
  "https://www.promptarc.cc/zh/",
  "https://www.promptarc.cc/zh/tool/",
  "https://www.promptarc.cc/zh/library/",
  "https://www.promptarc.cc/zh/gallery/",
  "https://www.promptarc.cc/zh/gallery/detail-pages/",
  "https://www.promptarc.cc/zh/gallery/product/",
  "https://www.promptarc.cc/zh/gallery/poster/",
  "https://www.promptarc.cc/zh/gallery/ui/",
  "https://www.promptarc.cc/zh/gallery/infographic/",
  "https://www.promptarc.cc/zh/gallery/typography/",
  "https://www.promptarc.cc/zh/gallery/photography/",
  "https://www.promptarc.cc/zh/gallery/character/",
  "https://www.promptarc.cc/zh/gallery/portrait/",
  "https://www.promptarc.cc/zh/gallery/test/",
  "https://www.promptarc.cc/zh/image-prompt-pack/",
  "https://www.promptarc.cc/zh/free-pack/",
  "https://www.promptarc.cc/zh/recommended-tools/",
  "https://www.promptarc.cc/zh/about/",
  "https://www.promptarc.cc/zh/contact/",
  "https://www.promptarc.cc/zh/privacy/",
  "https://www.promptarc.cc/zh/terms/",
  "https://www.promptarc.cc/library/chatgpt-course-outline/",
  "https://www.promptarc.cc/library/claude-system-prompt/",
  "https://www.promptarc.cc/library/linkedin-post-hook/",
  "https://www.promptarc.cc/library/cold-email-personalization/",
  "https://www.promptarc.cc/library/seo-content-brief/",
  "https://www.promptarc.cc/library/youtube-script-outline/",
  "https://www.promptarc.cc/library/customer-support-reply/",
  "https://www.promptarc.cc/library/user-research-synthesis/",
  "https://www.promptarc.cc/library/shopify-product-description/",
  "https://www.promptarc.cc/library/sales-call-summary/",
  "https://www.promptarc.cc/library/real-estate-listing-copy/",
  "https://www.promptarc.cc/library/fitness-coach-plan/"
]);

for (let index = 0; index < galleryItems.length; index += 1) {
  const item = galleryItems[index];
  const previousItem = galleryItems[index - 1] || null;
  const nextItem = galleryItems[index + 1] || null;
  byCategory[item.category] ||= [];
  byCategory[item.category].push(item);
  const slug = slugify(item.title);

  writeFile(path.join(root, "gallery", item.category, slug, "index.html"), buildDetailPage(item, "en", previousItem, nextItem));
  writeFile(path.join(root, "zh", "gallery", item.category, slug, "index.html"), buildDetailPage(item, "zh", previousItem, nextItem));

  sitemapUrls.add(`https://www.promptarc.cc/gallery/${item.category}/${slug}/`);
  sitemapUrls.add(`https://www.promptarc.cc/zh/gallery/${item.category}/${slug}/`);
}

writeFile(path.join(root, "gallery", "detail-pages", "index.html"), buildDirectoryPage("en", byCategory));
writeFile(path.join(root, "zh", "gallery", "detail-pages", "index.html"), buildDirectoryPage("zh", byCategory));

for (const [category, items] of Object.entries(byCategory)) {
  writeFile(path.join(root, "gallery", category, "index.html"), buildCategoryPage(category, items, "en"));
  writeFile(path.join(root, "zh", "gallery", category, "index.html"), buildCategoryPage(category, items, "zh"));
}

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...Array.from(sitemapUrls).sort().map((url) => `  <url><loc>${url}</loc><lastmod>${today}</lastmod></url>`),
  "</urlset>"
].join("\n");

fs.writeFileSync(sitemapPath, sitemap, "utf8");
const imageSitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
  ...galleryItems.flatMap((item) => {
    const slug = slugify(item.title);
    const imageUrl = `${galleryAssetBase}${item.imageUrl}`;
    return [
      `  <url><loc>https://www.promptarc.cc/gallery/${item.category}/${slug}/</loc><image:image><image:loc>${imageUrl}</image:loc></image:image></url>`,
      `  <url><loc>https://www.promptarc.cc/zh/gallery/${item.category}/${slug}/</loc><image:image><image:loc>${imageUrl}</image:loc></image:image></url>`
    ];
  }),
  "</urlset>"
].join("\n");

fs.writeFileSync(imageSitemapPath, imageSitemap, "utf8");
console.log(`Generated ${galleryItems.length} EN/ZH detail page pairs plus directory indexes.`);
