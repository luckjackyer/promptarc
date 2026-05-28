import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.argv[2] || process.cwd());

const sections = [
  {
    relativePath: "index.html",
    anchor: '      <section class="prompt-grid-panel">',
    position: "before",
    marker: "home-en",
    block: `
      <!-- seo-cluster:home-en:start -->
      <section class="prompt-seo-strip">
        <h2>Primary traffic clusters</h2>
        <p>PromptArc should win on two commercial search paths first: <strong>AI product ad prompts</strong> for ecommerce, launch, and conversion visuals, and <strong>AI poster prompts</strong> for campaign, event, and announcement layouts.</p>
        <div class="prompt-seo-links">
          <a href="/gallery/product/">Explore AI product ad prompts</a>
          <a href="/gallery/poster/">Explore AI poster prompts</a>
          <a href="/image-prompt-pack/">Open the numbered prompt catalog</a>
          <a href="/pricing/#credit-waitlist">Join the image credit waitlist</a>
        </div>
      </section>
      <!-- seo-cluster:home-en:end -->

`,
  },
  {
    relativePath: "zh/index.html",
    anchor: '      <section class="prompt-grid-panel">',
    position: "before",
    marker: "home-zh",
    block: `
      <!-- seo-cluster:home-zh:start -->
      <section class="prompt-seo-strip">
        <h2>当前最重要的两条流量主线</h2>
        <p>PromptArc 现阶段应该优先拿下两条最接近商业转化的搜索路径：<strong>产品广告提示词</strong>，解决电商首图、上新图、商业展示图；以及 <strong>海报提示词</strong>，解决活动宣传、视觉主海报和 campaign 画面。</p>
        <div class="prompt-seo-links">
          <a href="/zh/gallery/product/">进入产品广告提示词</a>
          <a href="/zh/gallery/poster/">进入海报提示词</a>
          <a href="/zh/image-prompt-pack/">查看编号提示词目录</a>
          <a href="/zh/pricing/#credit-waitlist">加入生图积分早鸟名单</a>
        </div>
      </section>
      <!-- seo-cluster:home-zh:end -->

`,
  },
  {
    relativePath: "gallery/index.html",
    anchor: '      <section class="prompt-grid-panel">',
    position: "before",
    marker: "gallery-en",
    block: `
      <!-- seo-cluster:gallery-en:start -->
      <section class="prompt-seo-strip">
        <h2>Primary SEO clusters</h2>
        <p><strong>Product ad prompt cluster</strong> covers product hero shots, launch creatives, and commercial image testing. <strong>Poster prompt cluster</strong> covers event posters, campaign layouts, and title-safe visuals that need stronger hierarchy.</p>
        <div class="prompt-seo-links">
          <a href="/gallery/product/">Product ad cluster hub</a>
          <a href="/gallery/poster/">Poster cluster hub</a>
          <a href="/gallery/topics/product-hero/">Product hero topic</a>
          <a href="/gallery/topics/event/">Event poster topic</a>
          <a href="/gallery/topics/launch/">Launch visuals topic</a>
        </div>
      </section>
      <!-- seo-cluster:gallery-en:end -->

`,
  },
  {
    relativePath: "zh/gallery/index.html",
    anchor: '      <section class="prompt-grid-panel">',
    position: "before",
    marker: "gallery-zh",
    block: `
      <!-- seo-cluster:gallery-zh:start -->
      <section class="prompt-seo-strip">
        <h2>现在要优先强化的主 SEO 集群</h2>
        <p><strong>产品广告主集群</strong> 负责承接商品首图、上新图、商业展示图和电商出图需求。<strong>海报主集群</strong> 负责承接活动海报、campaign 视觉和需要标题留白的宣传图需求。</p>
        <div class="prompt-seo-links">
          <a href="/zh/gallery/product/">产品广告主集群</a>
          <a href="/zh/gallery/poster/">海报主集群</a>
          <a href="/zh/gallery/topics/product-hero/">产品首图主题页</a>
          <a href="/zh/gallery/topics/event/">活动海报主题页</a>
          <a href="/zh/gallery/topics/launch/">上新视觉主题页</a>
        </div>
      </section>
      <!-- seo-cluster:gallery-zh:end -->

`,
  },
  {
    relativePath: "gallery/product/index.html",
    anchor: '      <section class="prompt-grid-panel">',
    position: "before",
    marker: "product-en",
    block: `
      <!-- seo-cluster:product-en:start -->
      <section class="prompt-panel">
        <h2>AI product ad prompts that turn into commercial assets</h2>
        <p>This category is the core <strong>AI product ad prompts</strong> hub inside PromptArc. The best use for it is a repeatable <strong>commercial image workflow</strong>: study a reference image, copy the prompt structure, adapt the subject, then move into credits when you are ready to generate production-ready variants.</p>
        <div class="prompt-seo-links">
          <a href="/gallery/topics/product-hero/">Open product hero examples</a>
          <a href="/gallery/topics/launch/">Open launch visuals</a>
          <a href="/image-prompt-pack/">Get the numbered prompt catalog</a>
          <a href="/pricing/#credit-waitlist">Join the image credit waitlist</a>
        </div>
      </section>
      <!-- seo-cluster:product-en:end -->

`,
  },
  {
    relativePath: "gallery/poster/index.html",
    anchor: '      <section class="prompt-grid-panel">',
    position: "before",
    marker: "poster-en",
    block: `
      <!-- seo-cluster:poster-en:start -->
      <section class="prompt-panel">
        <h2>AI poster prompts for campaigns and events</h2>
        <p>This category is the main <strong>AI poster prompts</strong> hub. The strongest use case is a <strong>campaign poster workflow</strong>: collect a layout reference, protect title-safe space, tune hierarchy, then move into generation credits when the concept is ready for repeated output tests.</p>
        <div class="prompt-seo-links">
          <a href="/gallery/topics/event/">Open event poster examples</a>
          <a href="/gallery/topics/launch/">Open launch poster examples</a>
          <a href="/image-prompt-pack/">Get the numbered prompt catalog</a>
          <a href="/pricing/#credit-waitlist">Join the image credit waitlist</a>
        </div>
      </section>
      <!-- seo-cluster:poster-en:end -->

`,
  },
  {
    relativePath: "zh/gallery/product/index.html",
    anchor: '      <section class="prompt-grid-panel">',
    position: "before",
    marker: "product-zh",
    block: `
      <!-- seo-cluster:product-zh:start -->
      <section class="prompt-panel">
        <h2>产品广告提示词如何承接商业需求</h2>
        <p>这一页应该被当成 PromptArc 的核心 <strong>产品广告提示词</strong> 分类页来经营。最适合的用法是形成一条稳定的 <strong>商业出图工作流</strong>：先挑参考图，复制提示词结构，替换主体，再进入积分生成阶段反复测试可转化的商品图。</p>
        <div class="prompt-seo-links">
          <a href="/zh/gallery/topics/product-hero/">进入产品首图案例</a>
          <a href="/zh/gallery/topics/launch/">进入上新视觉案例</a>
          <a href="/zh/image-prompt-pack/">查看编号提示词目录</a>
          <a href="/zh/pricing/#credit-waitlist">加入生图积分早鸟名单</a>
        </div>
      </section>
      <!-- seo-cluster:product-zh:end -->

`,
  },
  {
    relativePath: "zh/gallery/poster/index.html",
    anchor: '      <section class="prompt-grid-panel">',
    position: "before",
    marker: "poster-zh",
    block: `
      <!-- seo-cluster:poster-zh:start -->
      <section class="prompt-panel">
        <h2>海报提示词如何承接 campaign 流量</h2>
        <p>这一页应该作为 PromptArc 的核心 <strong>海报提示词</strong> 分类页。最适合的路径是建立一条清晰的 <strong>海报出图工作流</strong>：先确认主视觉和标题留白，再挑参考 prompt，最后进入积分生成阶段做多个海报版本测试。</p>
        <div class="prompt-seo-links">
          <a href="/zh/gallery/topics/event/">进入活动海报案例</a>
          <a href="/zh/gallery/topics/launch/">进入上新海报案例</a>
          <a href="/zh/image-prompt-pack/">查看编号提示词目录</a>
          <a href="/zh/pricing/#credit-waitlist">加入生图积分早鸟名单</a>
        </div>
      </section>
      <!-- seo-cluster:poster-zh:end -->

`,
  },
  {
    relativePath: "gallery/topics/product-hero/index.html",
    anchor: "    </main>",
    position: "before",
    marker: "topic-product-hero-en",
    block: `
      <!-- seo-cluster:topic-product-hero-en:start -->
      <section class="prompt-panel">
        <h2>This topic belongs to the product ad cluster</h2>
        <p>The <strong>product ad cluster</strong> is where PromptArc is most commercially aligned. Product hero pages are the bridge between inspiration traffic and paid generation demand because users here usually need variations, not just ideas.</p>
        <div class="prompt-seo-links">
          <a href="/gallery/product/">Return to the product ad cluster</a>
          <a href="/pricing/#credit-waitlist">Join the image credit waitlist</a>
        </div>
      </section>
      <!-- seo-cluster:topic-product-hero-en:end -->

`,
  },
  {
    relativePath: "gallery/topics/event/index.html",
    anchor: "    </main>",
    position: "before",
    marker: "topic-event-en",
    block: `
      <!-- seo-cluster:topic-event-en:start -->
      <section class="prompt-panel">
        <h2>This topic belongs to the poster prompt cluster</h2>
        <p>The <strong>poster prompt cluster</strong> should absorb event, workshop, and announcement searches. Event pages are valuable because they naturally connect inspiration traffic, reusable poster layouts, and downloadable prompt assets.</p>
        <div class="prompt-seo-links">
          <a href="/gallery/poster/">Return to the poster prompt cluster</a>
          <a href="/image-prompt-pack/">Open the numbered prompt catalog</a>
        </div>
      </section>
      <!-- seo-cluster:topic-event-en:end -->

`,
  },
  {
    relativePath: "gallery/topics/launch/index.html",
    anchor: "    </main>",
    position: "before",
    marker: "topic-launch-en",
    block: `
      <!-- seo-cluster:topic-launch-en:start -->
      <section class="prompt-panel">
        <h2>Launch visuals connect both core clusters</h2>
        <p>Launch pages sit between the <strong>product ad cluster</strong> and the <strong>poster prompt cluster</strong>. They are useful because product launches often need both hero product images and campaign poster layouts, which makes them a strong bridge into paid credits.</p>
        <div class="prompt-seo-links">
          <a href="/gallery/product/">Browse product launch visuals</a>
          <a href="/gallery/poster/">Browse launch poster visuals</a>
          <a href="/pricing/#credit-waitlist">Join the image credit waitlist</a>
        </div>
      </section>
      <!-- seo-cluster:topic-launch-en:end -->

`,
  },
  {
    relativePath: "zh/gallery/topics/product-hero/index.html",
    anchor: "    </main>",
    position: "before",
    marker: "topic-product-hero-zh",
    block: `
      <!-- seo-cluster:topic-product-hero-zh:start -->
      <section class="prompt-panel">
        <h2>这个主题页属于产品广告主集群</h2>
        <p><strong>产品广告主集群</strong> 是 PromptArc 当前最接近商业成交的内容方向。产品首图主题页最有价值，因为来到这里的用户通常不是只想看灵感，而是要做多轮商品图测试和出图。</p>
        <div class="prompt-seo-links">
          <a href="/zh/gallery/product/">返回产品广告主集群</a>
          <a href="/zh/pricing/#credit-waitlist">加入生图积分早鸟名单</a>
        </div>
      </section>
      <!-- seo-cluster:topic-product-hero-zh:end -->

`,
  },
  {
    relativePath: "zh/gallery/topics/event/index.html",
    anchor: "    </main>",
    position: "before",
    marker: "topic-event-zh",
    block: `
      <!-- seo-cluster:topic-event-zh:start -->
      <section class="prompt-panel">
        <h2>这个主题页属于海报主集群</h2>
        <p><strong>海报主集群</strong> 应该重点承接活动、工作坊、展览和 campaign 流量。活动主题页很适合作为中间层，因为它天然连接了灵感搜索、海报布局参考和可下载提示词资产。</p>
        <div class="prompt-seo-links">
          <a href="/zh/gallery/poster/">返回海报主集群</a>
          <a href="/zh/image-prompt-pack/">查看编号提示词目录</a>
        </div>
      </section>
      <!-- seo-cluster:topic-event-zh:end -->

`,
  },
  {
    relativePath: "zh/gallery/topics/launch/index.html",
    anchor: "    </main>",
    position: "before",
    marker: "topic-launch-zh",
    block: `
      <!-- seo-cluster:topic-launch-zh:start -->
      <section class="prompt-panel">
        <h2>上新视觉连接两条核心集群</h2>
        <p>上新页天然横跨 <strong>产品广告主集群</strong> 和 <strong>海报主集群</strong>。这类流量最有价值，因为真实上新场景往往同时需要商品首图和宣传海报，也更容易转向生图积分。</p>
        <div class="prompt-seo-links">
          <a href="/zh/gallery/product/">浏览商品上新图</a>
          <a href="/zh/gallery/poster/">浏览上新海报图</a>
          <a href="/zh/pricing/#credit-waitlist">加入生图积分早鸟名单</a>
        </div>
      </section>
      <!-- seo-cluster:topic-launch-zh:end -->

`,
  },
];

function upsertBlock(content, section) {
  const startMarker = `<!-- seo-cluster:${section.marker}:start -->`;
  const endMarker = `<!-- seo-cluster:${section.marker}:end -->`;
  const pattern = new RegExp(
    `\\n?\\s*${escapeRegExp(startMarker)}[\\s\\S]*?${escapeRegExp(endMarker)}\\n?`,
    "g"
  );
  const clean = content.replace(pattern, "\n");
  const injection = section.block.replace(/\n/g, "\r\n");

  if (!clean.includes(section.anchor)) {
    throw new Error(`${section.relativePath}: anchor not found`);
  }

  if (section.position === "after") {
    return clean.replace(section.anchor, `${section.anchor}${injection}`);
  }

  return clean.replace(section.anchor, `${injection}${section.anchor}`);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

for (const section of sections) {
  const filePath = path.join(root, section.relativePath);
  const source = await readFile(filePath, "utf8");
  const next = upsertBlock(source, section);
  if (next !== source) {
    await writeFile(filePath, next, "utf8");
  }
}

console.log(`Reinforced SEO clusters across ${sections.length} pages.`);
