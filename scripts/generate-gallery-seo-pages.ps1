$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$root = Split-Path -Parent $PSScriptRoot
$galleryDataPath = Join-Path $root "gallery\gallery-data.js"
$sitemapPath = Join-Path $root "sitemap.xml"
$today = "2026-05-22"

function Decode-JsString {
  param([string]$Value)

  $decoded = $Value -replace '\\\"', '"' -replace "\\\\", '\\' -replace "\\n", "`n" -replace "\\r", ""
  return $decoded
}

function Slugify-Title {
  param([string]$Title)

  $slug = $Title.ToLowerInvariant()
  $slug = [regex]::Replace($slug, "[^a-z0-9]+", "-")
  $slug = $slug.Trim("-")
  return $slug
}

function Html-Encode {
  param([string]$Value)
  return [System.Net.WebUtility]::HtmlEncode($Value)
}

function Get-TagLine {
  param([string[]]$Tags)

  if (-not $Tags -or $Tags.Count -eq 0) {
    return ""
  }

  if ($Tags.Count -eq 1) {
    return $Tags[0]
  }

  if ($Tags.Count -eq 2) {
    return "$($Tags[0]) and $($Tags[1])"
  }

  $lead = $Tags[0..($Tags.Count - 2)] -join ", "
  return "$lead, and $($Tags[-1])"
}

function Get-CategoryMeta {
  param([string]$Category)

  switch ($Category) {
    "product" {
      return [pscustomobject]@{
        EnLabel = "Product ads"
        ZhLabel = "产品广告"
        EnDescription = "premium ecommerce product shots, launch creatives, and conversion-focused commercial visuals"
        ZhDescription = "高级电商产品图、上新广告图和偏商业转化的视觉"
        EnFocus = "lighting, negative space, staging, commercial polish"
        ZhFocus = "光线、留白、摆场和商业质感"
        EnAdapt = "Swap the product object, keep the composition logic, and add a surface, prop, or copy-safe space that matches your niche."
        ZhAdapt = "替换商品主体，保留构图逻辑，再补一个符合你行业的表面材质、辅助道具或标题留白。"
      }
    }
    "poster" {
      return [pscustomobject]@{
        EnLabel = "Poster prompts"
        ZhLabel = "海报设计"
        EnDescription = "event posters, campaign artwork, editorial one-pagers, and print-style visual systems"
        ZhDescription = "活动海报、宣传视觉、编辑风单页和印刷型画面"
        EnFocus = "central visual, title-safe zones, print energy, and hierarchy"
        ZhFocus = "主体视觉、标题区域、印刷感和层级"
        EnAdapt = "Keep the core visual metaphor, then rewrite the mood, palette, and blank title zones for your event or campaign."
        ZhAdapt = "保留主要视觉隐喻，再按你的活动或 campaign 改写氛围、色板和标题留白区。"
      }
    }
    "ui" {
      return [pscustomobject]@{
        EnLabel = "UI mockups"
        ZhLabel = "UI Mockup"
        EnDescription = "mobile dashboards, product concept shots, SaaS heroes, and interface exploration"
        ZhDescription = "移动端仪表盘、产品概念图、SaaS 头图和界面探索"
        EnFocus = "layout clarity, realistic spacing, hierarchy, and interface fidelity"
        ZhFocus = "布局清晰度、真实留白、层级和界面完成度"
        EnAdapt = "Change the app type and primary workflow, but keep one strong primary action and a believable navigation pattern."
        ZhAdapt = "换掉应用类型和核心工作流，但保留明确主操作和可信的导航结构。"
      }
    }
    "infographic" {
      return [pscustomobject]@{
        EnLabel = "Infographic prompts"
        ZhLabel = "信息图"
        EnDescription = "workflow explainers, educational diagrams, visual guides, and process maps"
        ZhDescription = "工作流解释图、教育图示、视觉指南和流程图"
        EnFocus = "modular sections, clear hierarchy, icons, and readable structure"
        ZhFocus = "模块分区、清晰层级、图标和可读结构"
        EnAdapt = "Start from the information architecture, then add icons, section rhythm, and a clear readability constraint."
        ZhAdapt = "先从信息架构入手，再补图标、分区节奏和可读性限制。"
      }
    }
    "typography" {
      return [pscustomobject]@{
        EnLabel = "Typography prompts"
        ZhLabel = "字体排版"
        EnDescription = "lettering artwork, title treatments, wordmark-style scenes, and type-led editorial layouts"
        ZhDescription = "字形艺术、标题处理、文字主导的画面和编辑风排版"
        EnFocus = "letter shape, composition, texture, and readability control"
        ZhFocus = "字形、构图、材质和可读性控制"
        EnAdapt = "Decide whether the output should be readable or purely expressive, then anchor the material and composition cues."
        ZhAdapt = "先明确结果要可读还是偏表现型，再锁定材质和构图线索。"
      }
    }
    "photography" {
      return [pscustomobject]@{
        EnLabel = "Photography prompts"
        ZhLabel = "摄影参考"
        EnDescription = "realistic editorial scenes, documentary stills, and light-driven photo studies"
        ZhDescription = "真实编辑场景、纪实静帧和以光线驱动的摄影研究"
        EnFocus = "subject framing, lens feel, believable light, and natural imperfection"
        ZhFocus = "主体取景、镜头感、可信光线和自然瑕疵"
        EnAdapt = "Keep the scene and mood, then tune lens feel, time of day, and realism constraints for your subject."
        ZhAdapt = "保留场景和情绪，再按主体去调整镜头感、时间段和真实感限制。"
      }
    }
    "portrait" {
      return [pscustomobject]@{
        EnLabel = "Portrait prompts"
        ZhLabel = "人像摄影"
        EnDescription = "editorial portraits, founder headshots, cinematic people shots, and lookbook consistency studies"
        ZhDescription = "编辑人像、创始人照片、电影感人物图和 lookbook 一致性练习"
        EnFocus = "expression, framing, skin texture, and believable atmosphere"
        ZhFocus = "表情、取景、皮肤质感和可信氛围"
        EnAdapt = "Rewrite the environment and emotion, then protect realism with clean anatomy and natural skin-detail constraints."
        ZhAdapt = "改场景和情绪，再用真实皮肤细节和正常结构限制去保护真实感。"
      }
    }
    "character" {
      return [pscustomobject]@{
        EnLabel = "Character prompts"
        ZhLabel = "角色设计"
        EnDescription = "mascots, sticker sets, brand companions, and repeatable original character systems"
        ZhDescription = "吉祥物、贴纸组、品牌陪伴角色和可重复使用的原创角色系统"
        EnFocus = "silhouette consistency, expression range, style control, and originality"
        ZhFocus = "轮廓一致性、表情变化、风格控制和原创性"
        EnAdapt = "Change the role and world-building cues, then keep silhouette, color range, and limb-count constraints stable."
        ZhAdapt = "调整角色定位和世界观线索，再把轮廓、色彩范围和肢体数量限制保持稳定。"
      }
    }
    "test" {
      return [pscustomobject]@{
        EnLabel = "Style tests"
        ZhLabel = "风格测试"
        EnDescription = "comparison prompts, quality checks, style studies, and controlled visual experiments"
        ZhDescription = "对比提示词、质量检查、风格研究和可控视觉实验"
        EnFocus = "controlled variables, comparison logic, and evaluation clarity"
        ZhFocus = "变量控制、对比逻辑和评估清晰度"
        EnAdapt = "Keep one variable fixed, change one factor at a time, and define what success should look like before generation."
        ZhAdapt = "固定一个变量，每次只改一个因素，并在生成前先写清楚成功标准。"
      }
    }
    default {
      return [pscustomobject]@{
        EnLabel = "Image prompts"
        ZhLabel = "图像提示词"
        EnDescription = "general AI image prompt references"
        ZhDescription = "通用 AI 图像提示词参考"
        EnFocus = "clarity, structure, and output quality"
        ZhFocus = "清晰度、结构和输出质量"
        EnAdapt = "Keep the core subject and make the scene, style, and constraints more specific."
        ZhAdapt = "保留核心主体，把场景、风格和限制写得更具体。"
      }
    }
  }
}

function Ensure-Dir {
  param([string]$Path)
  if (-not (Test-Path $Path)) {
    New-Item -ItemType Directory -Path $Path | Out-Null
  }
}

function Write-Utf8File {
  param(
    [string]$Path,
    [string]$Content
  )

  $directory = Split-Path -Parent $Path
  Ensure-Dir $directory
  [System.IO.File]::WriteAllText($Path, $Content, [System.Text.UTF8Encoding]::new($false))
}

$raw = Get-Content -Raw -Encoding UTF8 $galleryDataPath
$pattern = '(?s)\{\s*id:\s*"(?<id>[^"]+)",\s*title:\s*"(?<title>[^"]+)",\s*category:\s*"(?<category>[^"]+)",\s*tags:\s*\[(?<tags>[^\]]*)\],\s*imageUrl:\s*"(?<imageUrl>[^"]+)",\s*sourceLabel:\s*"(?<sourceLabel>[^"]+)",\s*prompt:\s*"(?<prompt>(?:[^"\\]|\\.)*)"\s*\}'
$matches = [regex]::Matches($raw, $pattern)

$items = @()
foreach ($match in $matches) {
  $tags = [regex]::Matches($match.Groups["tags"].Value, '"([^"]+)"') | ForEach-Object { $_.Groups[1].Value }
  $title = Decode-JsString $match.Groups["title"].Value
  $prompt = Decode-JsString $match.Groups["prompt"].Value
  $category = Decode-JsString $match.Groups["category"].Value
  $slug = Slugify-Title $title
  $meta = Get-CategoryMeta $category

  $items += [pscustomobject]@{
    Id = Decode-JsString $match.Groups["id"].Value
    Title = $title
    Category = $category
    Tags = @($tags)
    Prompt = $prompt
    ImageUrl = Decode-JsString $match.Groups["imageUrl"].Value
    Slug = $slug
    Meta = $meta
  }
}

$categoryGroups = $items | Group-Object Category | Sort-Object Name
$detailUrls = New-Object System.Collections.Generic.List[string]

foreach ($item in $items) {
  $title = $item.Title
  $slug = $item.Slug
  $prompt = $item.Prompt
  $tags = $item.Tags
  $category = $item.Category
  $meta = $item.Meta
  $imageUrl = $item.ImageUrl
  $thumbUrl = $imageUrl -replace "/assets/gallery/", "/assets/gallery/thumbs/"
  $detailUrl = "https://www.promptarc.cc/gallery/$category/$slug/"
  $zhDetailUrl = "https://www.promptarc.cc/zh/gallery/$category/$slug/"
  $galleryUrl = "https://www.promptarc.cc/gallery/$category/"
  $zhGalleryUrl = "https://www.promptarc.cc/zh/gallery/$category/"
  $promptEncoded = [System.Uri]::EscapeDataString($prompt)
  $htmlPrompt = Html-Encode $prompt
  $htmlTitle = Html-Encode $title
  $tagLine = Get-TagLine $tags
  $htmlTagLine = Html-Encode $tagLine
  $imageAltEn = Html-Encode("$title AI image example.")
  $imageAltZh = Html-Encode("$title AI 图像示例。")
  $ogImage = "https://www.promptarc.cc$imageUrl"
  $contentIntroEn = "Use this $title prompt when you need $($meta.EnDescription)."
  if ($tagLine) {
    $contentIntroEn = "$contentIntroEn The tags on this example point to $tagLine."
  }
  $contentIntroZh = "这条 $title 提示词适合做$($meta.ZhDescription)。"
  if ($tagLine) {
    $contentIntroZh = "$contentIntroZh 这个案例的标签重点包括 $tagLine。"
  }
  $whyEn = "This prompt works because it defines the scene, the output style, and the quality guardrails without becoming overloaded. For $($meta.EnLabel.ToLowerInvariant()), that balance usually leads to more stable results."
  $whyZh = "这条提示词之所以有效，是因为它把场景、输出风格和质量限制都写清楚了，但没有堆太多噪音描述。对于$($meta.ZhLabel)，这种写法通常更稳定。"
  $bestEn = "This example is best for $($meta.EnDescription). The main strength here is $($meta.EnFocus)."
  $bestZh = "这个案例更适合$($meta.ZhDescription)。它最强的地方在于$($meta.ZhFocus)。"
  $adaptEn = $meta.EnAdapt
  $adaptZh = $meta.ZhAdapt

  $enContent = @"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>$htmlTitle Prompt | PromptArc</title>
  <meta name="description" content="Study this $htmlTitle prompt for $([System.Net.WebUtility]::HtmlEncode($meta.EnDescription)).">
  <meta name="robots" content="index,follow">
  <meta property="og:title" content="$htmlTitle Prompt | PromptArc">
  <meta property="og:description" content="A PromptArc example page with the prompt, image preview, and notes for $([System.Net.WebUtility]::HtmlEncode($meta.EnLabel.ToLowerInvariant())).">
  <meta property="og:type" content="article">
  <meta property="og:url" content="$detailUrl">
  <meta property="og:image" content="$ogImage">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="$detailUrl">
  <link rel="alternate" hreflang="en" href="$detailUrl">
  <link rel="alternate" hreflang="zh-CN" href="$zhDetailUrl">
  <link rel="alternate" hreflang="x-default" href="$detailUrl">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/style.css">
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "ImageObject",
          "@id": "$detailUrl#image",
          "contentUrl": "$ogImage",
          "thumbnailUrl": "https://www.promptarc.cc$thumbUrl",
          "caption": "$([System.Net.WebUtility]::HtmlEncode($title))",
          "name": "$([System.Net.WebUtility]::HtmlEncode($title))"
        },
        {
          "@type": "CreativeWork",
          "@id": "$detailUrl#work",
          "name": "$([System.Net.WebUtility]::HtmlEncode($title)) Prompt",
          "headline": "$([System.Net.WebUtility]::HtmlEncode($title)) Prompt",
          "description": "$([System.Net.WebUtility]::HtmlEncode($contentIntroEn))",
          "inLanguage": "en",
          "image": {
            "@id": "$detailUrl#image"
          }
        },
        {
          "@type": "BreadcrumbList",
          "@id": "$detailUrl#breadcrumb",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://www.promptarc.cc/"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Gallery",
              "item": "https://www.promptarc.cc/gallery/"
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": "$([System.Net.WebUtility]::HtmlEncode($meta.EnLabel))",
              "item": "$galleryUrl"
            },
            {
              "@type": "ListItem",
              "position": 4,
              "name": "$([System.Net.WebUtility]::HtmlEncode($title))",
              "item": "$detailUrl"
            }
          ]
        }
      ]
    }
  </script>
</head>
<body data-page="prompt-hub">
  <div class="prompt-page-shell">
    <header class="prompt-page-topbar">
      <a class="prompt-page-brand" href="/"><span class="prompt-page-logo">PA</span><span><strong data-site-name>PromptArc</strong><small>AI image prompt library</small></span></a>
      <nav class="prompt-page-nav"><a href="/">Home</a><a href="/gallery/">Gallery</a><a href="/tool/">Tool</a><a href="/library/">Library</a></nav>
      <div class="prompt-page-lang" aria-label="Language switch"><span class="is-active">EN</span><a href="/zh/gallery/$category/$slug/">中文</a></div>
    </header>
    <main class="section prose-page">
      <p class="eyebrow">$([System.Net.WebUtility]::HtmlEncode($meta.EnLabel))</p>
      <h1>$htmlTitle Prompt</h1>
      <p>$([System.Net.WebUtility]::HtmlEncode($contentIntroEn))</p>
      <p><img src="$imageUrl" alt="$imageAltEn" loading="eager" decoding="async"></p>
      <div class="gallery-tags">
        $(($tags | ForEach-Object { '<span class="tag">' + (Html-Encode $_) + '</span>' }) -join '')
      </div>
      <h2>Prompt</h2>
      <pre class="code-block" id="prompt-$slug">$htmlPrompt</pre>
      <p><button class="button" type="button" data-copy-target="#prompt-$slug">Copy prompt</button> <a class="button ghost" href="/tool/?prompt=$promptEncoded">Remix this prompt</a></p>
      <h2>Why this prompt works</h2>
      <p>$([System.Net.WebUtility]::HtmlEncode($whyEn))</p>
      <h2>Best use cases</h2>
      <p>$([System.Net.WebUtility]::HtmlEncode($bestEn))</p>
      <h2>How to adapt it</h2>
      <p>$([System.Net.WebUtility]::HtmlEncode($adaptEn))</p>
      <p><a href="/gallery/$category/">Back to $([System.Net.WebUtility]::HtmlEncode($meta.EnLabel.ToLowerInvariant()))</a> · <a href="/gallery/detail-pages/">Browse all prompt pages</a></p>
    </main>
  </div>
  <script src="/config.js"></script>
  <script src="/app.js"></script>
</body>
</html>
"@

  $zhContent = @"
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>$htmlTitle 提示词 | PromptArc</title>
  <meta name="description" content="查看这条 $htmlTitle 提示词，适合做$([System.Net.WebUtility]::HtmlEncode($meta.ZhDescription)).">
  <meta name="robots" content="index,follow">
  <meta property="og:title" content="$htmlTitle 提示词 | PromptArc">
  <meta property="og:description" content="一个包含图片案例、提示词正文和改写建议的 PromptArc 单页。">
  <meta property="og:type" content="article">
  <meta property="og:url" content="$zhDetailUrl">
  <meta property="og:image" content="$ogImage">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="$zhDetailUrl">
  <link rel="alternate" hreflang="en" href="$detailUrl">
  <link rel="alternate" hreflang="zh-CN" href="$zhDetailUrl">
  <link rel="alternate" hreflang="x-default" href="$detailUrl">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/style.css">
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "ImageObject",
          "@id": "$zhDetailUrl#image",
          "contentUrl": "$ogImage",
          "thumbnailUrl": "https://www.promptarc.cc$thumbUrl",
          "caption": "$([System.Net.WebUtility]::HtmlEncode($title))",
          "name": "$([System.Net.WebUtility]::HtmlEncode($title))"
        },
        {
          "@type": "CreativeWork",
          "@id": "$zhDetailUrl#work",
          "name": "$([System.Net.WebUtility]::HtmlEncode($title)) 提示词",
          "headline": "$([System.Net.WebUtility]::HtmlEncode($title)) 提示词",
          "description": "$([System.Net.WebUtility]::HtmlEncode($contentIntroZh))",
          "inLanguage": "zh-CN",
          "image": {
            "@id": "$zhDetailUrl#image"
          }
        },
        {
          "@type": "BreadcrumbList",
          "@id": "$zhDetailUrl#breadcrumb",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "首页",
              "item": "https://www.promptarc.cc/zh/"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "图库",
              "item": "https://www.promptarc.cc/zh/gallery/"
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": "$([System.Net.WebUtility]::HtmlEncode($meta.ZhLabel))",
              "item": "$zhGalleryUrl"
            },
            {
              "@type": "ListItem",
              "position": 4,
              "name": "$([System.Net.WebUtility]::HtmlEncode($title))",
              "item": "$zhDetailUrl"
            }
          ]
        }
      ]
    }
  </script>
</head>
<body data-page="prompt-hub">
  <div class="prompt-page-shell">
    <header class="prompt-page-topbar">
      <a class="prompt-page-brand" href="/zh/"><span class="prompt-page-logo">PA</span><span><strong data-site-name>PromptArc</strong><small>AI 图像提示词库</small></span></a>
      <nav class="prompt-page-nav"><a href="/zh/">首页</a><a href="/zh/gallery/">图库</a><a href="/zh/tool/">工具</a><a href="/zh/library/">模板库</a></nav>
      <div class="prompt-page-lang" aria-label="语言切换"><a href="/gallery/$category/$slug/">EN</a><span class="is-active">中文</span></div>
    </header>
    <main class="section prose-page">
      <p class="eyebrow">$([System.Net.WebUtility]::HtmlEncode($meta.ZhLabel))</p>
      <h1>$htmlTitle 提示词</h1>
      <p>$([System.Net.WebUtility]::HtmlEncode($contentIntroZh))</p>
      <p><img src="$imageUrl" alt="$imageAltZh" loading="eager" decoding="async"></p>
      <div class="gallery-tags">
        $(($tags | ForEach-Object { '<span class="tag">' + (Html-Encode $_) + '</span>' }) -join '')
      </div>
      <h2>提示词</h2>
      <pre class="code-block" id="prompt-$slug-zh">$htmlPrompt</pre>
      <p><button class="button" type="button" data-copy-target="#prompt-$slug-zh">复制提示词</button> <a class="button ghost" href="/zh/tool/?prompt=$promptEncoded">做同款</a></p>
      <h2>这条提示词为什么有效</h2>
      <p>$([System.Net.WebUtility]::HtmlEncode($whyZh))</p>
      <h2>适合的使用场景</h2>
      <p>$([System.Net.WebUtility]::HtmlEncode($bestZh))</p>
      <h2>怎么改写成你自己的版本</h2>
      <p>$([System.Net.WebUtility]::HtmlEncode($adaptZh))</p>
      <p><a href="/zh/gallery/$category/">返回$([System.Net.WebUtility]::HtmlEncode($meta.ZhLabel))</a> · <a href="/zh/gallery/detail-pages/">浏览全部提示词详情页</a></p>
    </main>
  </div>
  <script src="/config.js"></script>
  <script src="/app.js"></script>
</body>
</html>
"@

  Write-Utf8File -Path (Join-Path $root "gallery\$category\$slug\index.html") -Content $enContent
  Write-Utf8File -Path (Join-Path $root "zh\gallery\$category\$slug\index.html") -Content $zhContent
  $detailUrls.Add($detailUrl)
  $detailUrls.Add($zhDetailUrl)
}

$directorySectionsEn = foreach ($group in $categoryGroups) {
  $meta = Get-CategoryMeta $group.Name
  $links = foreach ($entry in ($group.Group | Sort-Object Title)) {
    '<li><a href="/gallery/' + $entry.Category + '/' + $entry.Slug + '/">' + (Html-Encode $entry.Title) + '</a></li>'
  }

  @"
      <section class="card compact-top">
        <p class="eyebrow">$([System.Net.WebUtility]::HtmlEncode($meta.EnLabel))</p>
        <ul class="template-list">
$($links -join "`n")
        </ul>
      </section>
"@
}

$directorySectionsZh = foreach ($group in $categoryGroups) {
  $meta = Get-CategoryMeta $group.Name
  $links = foreach ($entry in ($group.Group | Sort-Object Title)) {
    '<li><a href="/zh/gallery/' + $entry.Category + '/' + $entry.Slug + '/">' + (Html-Encode $entry.Title) + '</a></li>'
  }

  @"
      <section class="card compact-top">
        <p class="eyebrow">$([System.Net.WebUtility]::HtmlEncode($meta.ZhLabel))</p>
        <ul class="template-list">
$($links -join "`n")
        </ul>
      </section>
"@
}

$detailIndexEn = @"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>All AI Image Prompt Pages | PromptArc</title>
  <meta name="description" content="Browse the full directory of PromptArc AI image prompt pages by category.">
  <meta name="robots" content="index,follow">
  <meta property="og:title" content="All AI Image Prompt Pages | PromptArc">
  <meta property="og:description" content="A category-by-category directory of PromptArc image prompt detail pages.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://www.promptarc.cc/gallery/detail-pages/">
  <meta property="og:image" content="https://www.promptarc.cc/assets/og-cover.svg">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="https://www.promptarc.cc/gallery/detail-pages/">
  <link rel="alternate" hreflang="en" href="https://www.promptarc.cc/gallery/detail-pages/">
  <link rel="alternate" hreflang="zh-CN" href="https://www.promptarc.cc/zh/gallery/detail-pages/">
  <link rel="alternate" hreflang="x-default" href="https://www.promptarc.cc/gallery/detail-pages/">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/style.css">
</head>
<body data-page="prompt-hub">
  <div class="prompt-page-shell">
    <header class="prompt-page-topbar">
      <a class="prompt-page-brand" href="/"><span class="prompt-page-logo">PA</span><span><strong data-site-name>PromptArc</strong><small>AI image prompt library</small></span></a>
      <nav class="prompt-page-nav"><a href="/">Home</a><a href="/gallery/">Gallery</a><a href="/tool/">Tool</a><a href="/library/">Library</a></nav>
      <div class="prompt-page-lang" aria-label="Language switch"><span class="is-active">EN</span><a href="/zh/gallery/detail-pages/">中文</a></div>
    </header>
    <main class="prompt-page-main">
      <section class="prompt-subhero">
        <p class="prompt-page-kicker">Prompt page directory</p>
        <h1>All AI image prompt detail pages.</h1>
        <p>Use this page to browse every PromptArc image prompt landing page by category. It is built to help users and search engines discover the full library.</p>
      </section>
$($directorySectionsEn -join "`n")
    </main>
  </div>
</body>
</html>
"@

$detailIndexZh = @"
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>全部图像提示词详情页 | PromptArc</title>
  <meta name="description" content="按分类浏览 PromptArc 的全部 AI 图像提示词详情页。">
  <meta name="robots" content="index,follow">
  <meta property="og:title" content="全部图像提示词详情页 | PromptArc">
  <meta property="og:description" content="一个按分类整理的 PromptArc 图像提示词详情页目录。">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://www.promptarc.cc/zh/gallery/detail-pages/">
  <meta property="og:image" content="https://www.promptarc.cc/assets/og-cover.svg">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="https://www.promptarc.cc/zh/gallery/detail-pages/">
  <link rel="alternate" hreflang="en" href="https://www.promptarc.cc/gallery/detail-pages/">
  <link rel="alternate" hreflang="zh-CN" href="https://www.promptarc.cc/zh/gallery/detail-pages/">
  <link rel="alternate" hreflang="x-default" href="https://www.promptarc.cc/gallery/detail-pages/">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/style.css">
</head>
<body data-page="prompt-hub">
  <div class="prompt-page-shell">
    <header class="prompt-page-topbar">
      <a class="prompt-page-brand" href="/zh/"><span class="prompt-page-logo">PA</span><span><strong data-site-name>PromptArc</strong><small>AI 图像提示词库</small></span></a>
      <nav class="prompt-page-nav"><a href="/zh/">首页</a><a href="/zh/gallery/">图库</a><a href="/zh/tool/">工具</a><a href="/zh/library/">模板库</a></nav>
      <div class="prompt-page-lang" aria-label="Language switch"><a href="/gallery/detail-pages/">EN</a><span class="is-active">中文</span></div>
    </header>
    <main class="prompt-page-main">
      <section class="prompt-subhero">
        <p class="prompt-page-kicker">提示词详情页目录</p>
        <h1>全部图像提示词详情页。</h1>
        <p>这个页面按分类整理了 PromptArc 的全部图像提示词落地页，方便用户和搜索引擎发现完整内容库。</p>
      </section>
$($directorySectionsZh -join "`n")
    </main>
  </div>
</body>
</html>
"@

Write-Utf8File -Path (Join-Path $root "gallery\detail-pages\index.html") -Content $detailIndexEn
Write-Utf8File -Path (Join-Path $root "zh\gallery\detail-pages\index.html") -Content $detailIndexZh

$staticUrls = @(
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
)

$allUrls = @($staticUrls + $detailUrls) | Sort-Object -Unique
$sitemapLines = @('<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
foreach ($url in $allUrls) {
  $sitemapLines += "  <url><loc>$url</loc><lastmod>$today</lastmod></url>"
}
$sitemapLines += '</urlset>'
Write-Utf8File -Path $sitemapPath -Content ($sitemapLines -join "`n")

Write-Output ("Generated {0} EN/ZH detail pages, directory pages, and sitemap entries." -f $items.Count)
