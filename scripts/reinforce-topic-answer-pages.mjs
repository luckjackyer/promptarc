import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.argv[2] || process.cwd());

const sections = [
  {
    relativePath: "gallery/index.html",
    anchor: "    </main>",
    marker: "gallery-topic-index-en",
    block: `
      <!-- topic-answer:gallery-topic-index-en:start -->
      <section class="prompt-seo-strip">
        <h2>Long-tail topic pages</h2>
        <p>These topic pages are built as answer-first landing pages, not just tag lists. Each one should explain the use case, show prompt patterns, and connect the search query to a realistic image workflow.</p>
        <div class="prompt-seo-links">
          <a href="/gallery/topics/product-hero/">Product hero prompt page</a>
          <a href="/gallery/topics/event/">Event poster prompt page</a>
          <a href="/gallery/topics/launch/">Launch visual prompt page</a>
          <a href="/gallery/topics/coffee/">Coffee product prompt page</a>
          <a href="/gallery/topics/dashboard/">Dashboard UI prompt page</a>
          <a href="/gallery/topics/documentary/">Documentary photo prompt page</a>
        </div>
      </section>
      <!-- topic-answer:gallery-topic-index-en:end -->

`
  },
  {
    relativePath: "zh/gallery/index.html",
    anchor: "    </main>",
    marker: "gallery-topic-index-zh",
    block: `
      <!-- topic-answer:gallery-topic-index-zh:start -->
      <section class="prompt-seo-strip">
        <h2>长尾主题页</h2>
        <p>这些主题页不应该只是标签聚合页，而应该是可索引、可引用、能直接回答问题的长尾落地页。每一页都要解释使用场景、提示词结构和适合的出图工作流。</p>
        <div class="prompt-seo-links">
          <a href="/zh/gallery/topics/product-hero/">产品首图提示词页</a>
          <a href="/zh/gallery/topics/event/">活动海报提示词页</a>
          <a href="/zh/gallery/topics/launch/">上新视觉提示词页</a>
          <a href="/zh/gallery/topics/coffee/">咖啡产品提示词页</a>
          <a href="/zh/gallery/topics/dashboard/">仪表盘 UI 提示词页</a>
          <a href="/zh/gallery/topics/documentary/">纪实摄影提示词页</a>
        </div>
      </section>
      <!-- topic-answer:gallery-topic-index-zh:end -->

`
  },
  {
    relativePath: "gallery/topics/product-hero/index.html",
    anchor: "    </main>",
    marker: "topic-answer-product-hero-en",
    block: `
      <!-- topic-answer:topic-answer-product-hero-en:start -->
      <section class="prompt-panel">
        <h2>Best AI product hero prompts</h2>
        <p>Best for ecommerce hero images, launch banners, and premium product detail headers. A strong product hero prompt keeps one product as the focal object, protects headline space, and uses clean lighting instead of decorative clutter.</p>
      </section>
      <section class="prompt-panel">
        <h2>What makes a strong product hero prompt?</h2>
        <p>A strong product hero prompt names the product, surface, lighting direction, background density, and negative space requirement. It should also say what not to generate: no fake text, no extra products, no brand-like marks, and no cluttered props.</p>
      </section>
      <section class="prompt-panel">
        <h2>FAQ</h2>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What ratio works best for product hero prompts?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "4:5 works well for ecommerce cards, while 16:9 works better for landing page hero sections."
                }
              },
              {
                "@type": "Question",
                "name": "How do I adapt a product hero prompt fast?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Replace the product first, keep the lighting and composition logic, then adjust ratio and prop density for your sales channel."
                }
              }
            ]
          }
        </script>
        <div class="prompt-seo-links">
          <a href="/image-prompt-pack/">Download the prompt catalog sample</a>
          <a href="/pricing/#credit-waitlist">Join the image credit waitlist</a>
        </div>
      </section>
      <!-- topic-answer:topic-answer-product-hero-en:end -->

`
  },
  {
    relativePath: "gallery/topics/event/index.html",
    anchor: "    </main>",
    marker: "topic-answer-event-en",
    block: `
      <!-- topic-answer:topic-answer-event-en:start -->
      <section class="prompt-panel">
        <h2>AI event poster prompts</h2>
        <p>Best for workshops, fairs, and launch events. Event poster prompts work when the image supports a title-safe layout, one central visual metaphor, and enough blank structure for real event details to be added later.</p>
      </section>
      <section class="prompt-panel">
        <h2>What makes a strong event poster prompt?</h2>
        <p>A strong event poster prompt defines the focal object, the mood, the visual hierarchy, and the blank areas reserved for title and date. It should avoid relying on generated text and should keep the layout usable for post-editing.</p>
      </section>
      <section class="prompt-panel">
        <h2>FAQ</h2>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Should I trust generated poster text?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "No. Use AI for the layout and focal image, then replace titles and event details in post."
                }
              },
              {
                "@type": "Question",
                "name": "What ratio works best for event posters?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "4:5 and 2:3 are the most flexible poster ratios because they keep strong vertical hierarchy."
                }
              }
            ]
          }
        </script>
        <div class="prompt-seo-links">
          <a href="/image-prompt-pack/">Download the prompt catalog sample</a>
          <a href="/gallery/poster/">Browse the full poster cluster</a>
        </div>
      </section>
      <!-- topic-answer:topic-answer-event-en:end -->

`
  },
  {
    relativePath: "gallery/topics/launch/index.html",
    anchor: "    </main>",
    marker: "topic-answer-launch-en",
    block: `
      <!-- topic-answer:topic-answer-launch-en:start -->
      <section class="prompt-panel">
        <h2>AI launch campaign prompts</h2>
        <p>Best for product launches, brand campaigns, and announcement pages. Launch prompts matter because they often need both commercial product polish and campaign poster energy in the same visual system.</p>
      </section>
      <section class="prompt-panel">
        <h2>What makes a strong launch visual prompt?</h2>
        <p>A strong launch visual prompt states the launch object, the campaign mood, the message hierarchy, and the sales context. It should also ask for clean promotion-safe areas, controlled props, and a believable product scale.</p>
      </section>
      <section class="prompt-panel">
        <h2>FAQ</h2>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Do launch prompts belong to product or poster workflows?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Usually both. Launch visuals often start with product-ad structure and then add campaign hierarchy."
                }
              },
              {
                "@type": "Question",
                "name": "How do I make launch visuals conversion-ready?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Keep one main product, one clear message zone, and remove decorative noise that competes with the sales story."
                }
              }
            ]
          }
        </script>
        <div class="prompt-seo-links">
          <a href="/pricing/#credit-waitlist">Join the image credit waitlist</a>
          <a href="/gallery/product/">Browse product launch references</a>
        </div>
      </section>
      <!-- topic-answer:topic-answer-launch-en:end -->

`
  },
  {
    relativePath: "gallery/topics/coffee/index.html",
    anchor: "    </main>",
    marker: "topic-answer-coffee-en",
    block: `
      <!-- topic-answer:topic-answer-coffee-en:start -->
      <section class="prompt-panel">
        <h2>Coffee product prompt examples</h2>
        <p>Best for specialty coffee launches, packaging tests, cafe posters, and brewing guides. Coffee is valuable as a long-tail page because it crosses product, poster, photography, and infographic use cases with strong commercial intent.</p>
      </section>
      <section class="prompt-panel">
        <h2>What makes a strong coffee product prompt?</h2>
        <p>A strong coffee prompt defines the vessel or packaging, roast mood, surface styling, steam or texture cues, and whether the image is for a bag hero, drink launch, menu poster, or documentary cafe scene.</p>
      </section>
      <section class="prompt-panel">
        <h2>FAQ</h2>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Which coffee prompt type converts best?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Coffee bag hero images and premium drink launch visuals are usually the strongest commercial use cases."
                }
              },
              {
                "@type": "Question",
                "name": "How do I keep coffee prompts from looking generic?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Specify roast mood, cupware or packaging material, surface, steam, and negative space instead of only saying cozy cafe."
                }
              }
            ]
          }
        </script>
        <div class="prompt-seo-links">
          <a href="/gallery/product/">Browse product ad prompts</a>
          <a href="/image-prompt-pack/">Download the prompt catalog sample</a>
        </div>
      </section>
      <!-- topic-answer:topic-answer-coffee-en:end -->

`
  },
  {
    relativePath: "gallery/topics/dashboard/index.html",
    anchor: "    </main>",
    marker: "topic-answer-dashboard-en",
    block: `
      <!-- topic-answer:topic-answer-dashboard-en:start -->
      <section class="prompt-panel">
        <h2>AI dashboard UI prompts</h2>
        <p>Best for SaaS mockups, internal tools, and mobile dashboards. Dashboard topic pages are useful because searchers usually want concrete interface patterns, not abstract visual mood boards.</p>
      </section>
      <section class="prompt-panel">
        <h2>What makes a strong dashboard UI prompt?</h2>
        <p>A strong dashboard prompt defines the user role, the primary metric, the main action, and the screen density. It should tell the model whether the result is a mobile dashboard, a SaaS overview, or an internal ops interface.</p>
      </section>
      <section class="prompt-panel">
        <h2>FAQ</h2>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Should I optimize dashboard prompts for realism or style first?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Start with realistic hierarchy and spacing first, then add visual style once the layout makes product sense."
                }
              },
              {
                "@type": "Question",
                "name": "What UI details matter most in dashboard prompts?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Navigation structure, card hierarchy, one clear primary action, and believable whitespace matter more than decorative effects."
                }
              }
            ]
          }
        </script>
        <div class="prompt-seo-links">
          <a href="/gallery/ui/">Browse the full UI gallery</a>
          <a href="/gallery/topics/mobile-ui/">Open mobile UI prompts</a>
        </div>
      </section>
      <!-- topic-answer:topic-answer-dashboard-en:end -->

`
  },
  {
    relativePath: "gallery/topics/documentary/index.html",
    anchor: "    </main>",
    marker: "topic-answer-documentary-en",
    block: `
      <!-- topic-answer:topic-answer-documentary-en:start -->
      <section class="prompt-panel">
        <h2>Documentary photo prompts</h2>
        <p>Best for candid street scenes, editorial reference, and realistic photo studies. Documentary pages work as long-tail content because users search for realism, mood, and camera behavior rather than category names.</p>
      </section>
      <section class="prompt-panel">
        <h2>What makes a strong documentary prompt?</h2>
        <p>A strong documentary prompt defines the public scene, time of day, motion level, lens feel, and realism guardrails. It should remove brand logos, celebrity likeness, staged posing, and over-polished beauty retouching.</p>
      </section>
      <section class="prompt-panel">
        <h2>FAQ</h2>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How do documentary prompts avoid looking fake?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Use ordinary subjects, imperfect light, believable environments, and natural texture instead of cinematic polish."
                }
              },
              {
                "@type": "Question",
                "name": "Which documentary prompt scenes work best?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Markets, libraries, stations, cafes, workshops, and street corners usually create the most believable everyday scenes."
                }
              }
            ]
          }
        </script>
        <div class="prompt-seo-links">
          <a href="/gallery/photography/">Browse the photography gallery</a>
          <a href="/gallery/topics/night/">Open night documentary references</a>
        </div>
      </section>
      <!-- topic-answer:topic-answer-documentary-en:end -->

`
  },
  {
    relativePath: "zh/gallery/topics/product-hero/index.html",
    anchor: "    </main>",
    marker: "topic-answer-product-hero-zh",
    block: `
      <!-- topic-answer:topic-answer-product-hero-zh:start -->
      <section class="prompt-panel">
        <h2>最佳产品首图提示词</h2>
        <p>适合电商首图、上新横幅和高端商品页头图。产品首图提示词要把主体产品、光线方向、留白区域和背景复杂度写清楚，而不是只堆高级感形容词。</p>
      </section>
      <section class="prompt-panel">
        <h2>什么样的产品首图提示词更强？</h2>
        <p>更强的产品首图提示词会明确产品本体、摆放表面、灯光来源、构图方式，以及不要生成什么：不要假文字、不要多余产品、不要疑似品牌标识、不要过度道具。</p>
      </section>
      <section class="prompt-panel">
        <h2>FAQ</h2>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "产品首图最常用什么比例？",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "4:5 适合电商卡片，16:9 更适合落地页头图。"
                }
              },
              {
                "@type": "Question",
                "name": "怎么快速改写产品首图提示词？",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "先替换产品主体，再保留灯光和构图逻辑，最后按投放渠道调整比例与道具密度。"
                }
              }
            ]
          }
        </script>
        <div class="prompt-seo-links">
          <a href="/zh/image-prompt-pack/">下载提示词目录样本</a>
          <a href="/zh/pricing/#credit-waitlist">加入生图积分早鸟名单</a>
        </div>
      </section>
      <!-- topic-answer:topic-answer-product-hero-zh:end -->

`
  },
  {
    relativePath: "zh/gallery/topics/event/index.html",
    anchor: "    </main>",
    marker: "topic-answer-event-zh",
    block: `
      <!-- topic-answer:topic-answer-event-zh:start -->
      <section class="prompt-panel">
        <h2>活动海报提示词</h2>
        <p>适合工作坊、展会和上新活动。活动海报提示词的关键不是生成假文字，而是先做出可放真标题、真日期和真活动信息的画面结构。</p>
      </section>
      <section class="prompt-panel">
        <h2>什么样的活动海报提示词更强？</h2>
        <p>更强的活动海报提示词会写清楚主视觉、标题留白区、视觉层级和情绪方向，同时避免把画面挤满装饰元素，导致后期无法加真实文案。</p>
      </section>
      <section class="prompt-panel">
        <h2>FAQ</h2>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "活动海报可以直接用 AI 生成的文字吗？",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "不建议，AI 更适合先生成布局和主视觉，真实标题与时间信息最好后期替换。"
                }
              },
              {
                "@type": "Question",
                "name": "活动海报最常用什么比例？",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "4:5 和 2:3 最实用，因为更容易保留竖向海报层级。"
                }
              }
            ]
          }
        </script>
        <div class="prompt-seo-links">
          <a href="/zh/image-prompt-pack/">下载提示词目录样本</a>
          <a href="/zh/gallery/poster/">浏览完整海报集群</a>
        </div>
      </section>
      <!-- topic-answer:topic-answer-event-zh:end -->

`
  },
  {
    relativePath: "zh/gallery/topics/launch/index.html",
    anchor: "    </main>",
    marker: "topic-answer-launch-zh",
    block: `
      <!-- topic-answer:topic-answer-launch-zh:start -->
      <section class="prompt-panel">
        <h2>上新视觉提示词</h2>
        <p>适合产品上新、品牌 campaign 和公告页。上新视觉的难点在于要同时具备商品展示能力和宣传海报气质，所以它天然连接产品广告与海报两条主线。</p>
      </section>
      <section class="prompt-panel">
        <h2>什么样的上新视觉提示词更强？</h2>
        <p>更强的上新提示词会明确上新对象、活动氛围、文案留白区和销售语境，还会控制道具数量、产品尺度和 promotion-safe 的留白空间。</p>
      </section>
      <section class="prompt-panel">
        <h2>FAQ</h2>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "上新视觉更偏产品图还是海报图？",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "通常两者都需要，先保留产品广告结构，再叠加 campaign 层级会更稳。"
                }
              },
              {
                "@type": "Question",
                "name": "怎么让上新视觉更接近转化图？",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "保留一个核心产品、一个清晰信息区，减少与卖点竞争的装饰噪音。"
                }
              }
            ]
          }
        </script>
        <div class="prompt-seo-links">
          <a href="/zh/pricing/#credit-waitlist">加入生图积分早鸟名单</a>
          <a href="/zh/gallery/product/">浏览产品上新参考</a>
        </div>
      </section>
      <!-- topic-answer:topic-answer-launch-zh:end -->

`
  },
  {
    relativePath: "zh/gallery/topics/coffee/index.html",
    anchor: "    </main>",
    marker: "topic-answer-coffee-zh",
    block: `
      <!-- topic-answer:topic-answer-coffee-zh:start -->
      <section class="prompt-panel">
        <h2>咖啡产品提示词</h2>
        <p>适合精品咖啡上新、包装测试、咖啡店海报和冲煮说明图。咖啡是高价值长尾页，因为它天然横跨产品、海报、摄影和信息图四类实际需求。</p>
      </section>
      <section class="prompt-panel">
        <h2>什么样的咖啡产品提示词更强？</h2>
        <p>更强的咖啡提示词会定义杯具或包装、烘焙气质、表面材质、蒸汽与颗粒细节，以及这张图到底是做袋装首图、饮品上新、菜单海报还是纪实咖啡馆场景。</p>
      </section>
      <section class="prompt-panel">
        <h2>FAQ</h2>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "咖啡类提示词最容易成交的是哪种？",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "精品咖啡袋首图和高端饮品上新图通常最接近商业成交场景。"
                }
              },
              {
                "@type": "Question",
                "name": "怎么避免咖啡图看起来太普通？",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "不要只写 cozy cafe，要写清烘焙气质、器皿、表面、蒸汽和留白。"
                }
              }
            ]
          }
        </script>
        <div class="prompt-seo-links">
          <a href="/zh/gallery/product/">浏览产品广告提示词</a>
          <a href="/zh/image-prompt-pack/">下载提示词目录样本</a>
        </div>
      </section>
      <!-- topic-answer:topic-answer-coffee-zh:end -->

`
  },
  {
    relativePath: "zh/gallery/topics/dashboard/index.html",
    anchor: "    </main>",
    marker: "topic-answer-dashboard-zh",
    block: `
      <!-- topic-answer:topic-answer-dashboard-zh:start -->
      <section class="prompt-panel">
        <h2>仪表盘 UI 提示词</h2>
        <p>适合 SaaS mockup、内部工具和移动端仪表盘。仪表盘页的价值在于，用户通常不是在找抽象风格，而是在找可落地的界面层级和产品结构。</p>
      </section>
      <section class="prompt-panel">
        <h2>什么样的仪表盘 UI 提示词更强？</h2>
        <p>更强的仪表盘提示词会说明使用者角色、核心指标、主操作按钮和信息密度，还会明确这是移动端仪表盘、SaaS 总览页还是内部运营后台。</p>
      </section>
      <section class="prompt-panel">
        <h2>FAQ</h2>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "仪表盘提示词应该先追求风格还是先追求真实结构？",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "先保证层级和留白合理，再叠加风格会更接近真实产品设计。"
                }
              },
              {
                "@type": "Question",
                "name": "仪表盘提示词最重要的细节是什么？",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "导航结构、卡片层级、主操作和可信的留白，比装饰特效更重要。"
                }
              }
            ]
          }
        </script>
        <div class="prompt-seo-links">
          <a href="/zh/gallery/ui/">浏览完整 UI 图库</a>
          <a href="/zh/gallery/topics/mobile-ui/">查看移动端 UI 提示词</a>
        </div>
      </section>
      <!-- topic-answer:topic-answer-dashboard-zh:end -->

`
  },
  {
    relativePath: "zh/gallery/topics/documentary/index.html",
    anchor: "    </main>",
    marker: "topic-answer-documentary-zh",
    block: `
      <!-- topic-answer:topic-answer-documentary-zh:start -->
      <section class="prompt-panel">
        <h2>纪实摄影提示词</h2>
        <p>适合抓拍街景、编辑部参考和真实感摄影研究。纪实摄影能成为长尾入口，是因为搜索者更常问的是“怎么做出真实抓拍感”，而不是单纯按分类找图。</p>
      </section>
      <section class="prompt-panel">
        <h2>什么样的纪实摄影提示词更强？</h2>
        <p>更强的纪实摄影提示词会说明公共场景、时间段、运动程度、镜头感觉和真实感限制，并主动排除品牌标识、名人相似度、摆拍姿势和过度精修。</p>
      </section>
      <section class="prompt-panel">
        <h2>FAQ</h2>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "怎么让纪实摄影提示词不那么假？",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "优先用普通人物、不完美光线、可信场景和自然纹理，不要追求广告片式精致。"
                }
              },
              {
                "@type": "Question",
                "name": "哪些纪实场景最稳定？",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "市场、图书馆、车站、咖啡馆、工作坊和街角最容易形成可信的日常画面。"
                }
              }
            ]
          }
        </script>
        <div class="prompt-seo-links">
          <a href="/zh/gallery/photography/">浏览摄影图库</a>
          <a href="/zh/gallery/topics/night/">查看夜间纪实参考</a>
        </div>
      </section>
      <!-- topic-answer:topic-answer-documentary-zh:end -->

`
  }
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function upsertBlock(content, section) {
  const startMarker = `<!-- topic-answer:${section.marker}:start -->`;
  const endMarker = `<!-- topic-answer:${section.marker}:end -->`;
  const pattern = new RegExp(
    `\\n?\\s*${escapeRegExp(startMarker)}[\\s\\S]*?${escapeRegExp(endMarker)}\\n?`,
    "g"
  );
  const clean = content.replace(pattern, "\n");
  const injection = section.block.replace(/\n/g, "\r\n");

  if (!clean.includes(section.anchor)) {
    throw new Error(`${section.relativePath}: anchor not found`);
  }

  return clean.replace(section.anchor, `${injection}${section.anchor}`);
}

for (const section of sections) {
  const filePath = path.join(root, section.relativePath);
  const source = await readFile(filePath, "utf8");
  const next = upsertBlock(source, section);
  if (next !== source) {
    await writeFile(filePath, next, "utf8");
  }
}

console.log(`Reinforced topic answer pages across ${sections.length} sections.`);
