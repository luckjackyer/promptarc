import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const galleryDataPath = path.join(root, "gallery", "gallery-data.js");
const sitemapPath = path.join(root, "sitemap.xml");
const today = "2026-05-22";

const raw = fs.readFileSync(galleryDataPath, "utf8");
const match = raw.match(/window\.PROMPTARC_GALLERY\s*=\s*(\[[\s\S]*\]);?\s*$/);
if (!match) {
  throw new Error("Could not parse gallery data");
}

const galleryItems = Function(`"use strict"; return (${match[1]});`)();

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

function buildDetailPage(item, lang) {
  const slug = slugify(item.title);
  const meta = categoryMeta[item.category] || categoryMeta.product;
  const isZh = lang === "zh";
  const basePath = isZh ? `/zh/gallery/${item.category}/${slug}/` : `/gallery/${item.category}/${slug}/`;
  const pageUrl = `https://www.promptarc.cc${basePath}`;
  const altUrl = `https://www.promptarc.cc${isZh ? `/gallery/${item.category}/${slug}/` : `/zh/gallery/${item.category}/${slug}/`}`;
  const categoryUrl = `https://www.promptarc.cc${isZh ? `/zh/gallery/${item.category}/` : `/gallery/${item.category}/`}`;
  const promptEncoded = encodeURIComponent(item.prompt);
  const imageUrl = `https://www.promptarc.cc${item.imageUrl}`;
  const thumbPath = item.imageUrl.replace("/assets/gallery/", "/assets/gallery/thumbs/");
  const thumbUrl = `https://www.promptarc.cc${thumbPath}`;
  const title = escapeHtml(item.title);
  const seoTitle = escapeHtml(getSeoGalleryTitle(item, lang));
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
      <section class="prompt-detail-hero">
        <figure class="prompt-detail-media">
          <a href="${item.imageUrl}" aria-label="${fullImageText}">
            <img src="${thumbPath}" alt="${title} ${isZh ? "AI 图像示例" : "AI image example"}." loading="eager" decoding="async" fetchpriority="high">
          </a>
          <figcaption>${imageCaption} · ${sourceText} · <a href="${item.imageUrl}">${fullImageText}</a></figcaption>
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
      </section>
      <nav class="prompt-detail-links">
        <a href="${isZh ? `/zh/gallery/${item.category}/` : `/gallery/${item.category}/`}">${backText}</a>
        <a href="${isZh ? "/zh/gallery/detail-pages/" : "/gallery/detail-pages/"}">${allText}</a>
      </nav>
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
          return `<li><a href="${href}">${escapeHtml(getSeoGalleryTitle(item, lang))}</a></li>`;
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

for (const item of galleryItems) {
  byCategory[item.category] ||= [];
  byCategory[item.category].push(item);
  const slug = slugify(item.title);

  writeFile(path.join(root, "gallery", item.category, slug, "index.html"), buildDetailPage(item, "en"));
  writeFile(path.join(root, "zh", "gallery", item.category, slug, "index.html"), buildDetailPage(item, "zh"));

  sitemapUrls.add(`https://www.promptarc.cc/gallery/${item.category}/${slug}/`);
  sitemapUrls.add(`https://www.promptarc.cc/zh/gallery/${item.category}/${slug}/`);
}

writeFile(path.join(root, "gallery", "detail-pages", "index.html"), buildDirectoryPage("en", byCategory));
writeFile(path.join(root, "zh", "gallery", "detail-pages", "index.html"), buildDirectoryPage("zh", byCategory));

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...Array.from(sitemapUrls).sort().map((url) => `  <url><loc>${url}</loc><lastmod>${today}</lastmod></url>`),
  "</urlset>"
].join("\n");

fs.writeFileSync(sitemapPath, sitemap, "utf8");
console.log(`Generated ${galleryItems.length} EN/ZH detail page pairs plus directory indexes.`);
