from pathlib import Path
import re
import unittest


ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


class UiUxContractTest(unittest.TestCase):
    def test_source_html_files_do_not_start_with_bom(self):
        for path in ROOT.rglob("*.html"):
            relative = path.relative_to(ROOT).as_posix()
            if relative.startswith("_deploy/") or "/node_modules/" in relative or "/.git/" in relative:
                continue
            data = path.read_bytes()
            self.assertFalse(data.startswith(b"\xef\xbb\xbf"), f"{relative} starts with a UTF-8 BOM")

    def test_gallery_language_switch_uses_readable_chinese_label(self):
        gallery = read("gallery/index.html")
        self.assertIn('<option value="/zh/gallery/">中文</option>', gallery)
        self.assertNotIn('<option value="/zh/gallery/">??</option>', gallery)

    def test_zh_gallery_navigation_uses_launch_generator_routes(self):
        gallery = read("zh/gallery/index.html")
        css = read("style.css")
        self.assertIn('href="/zh/"', gallery)
        self.assertIn('href="/zh/gallery/" aria-current="page"', gallery)
        self.assertIn('href="/zh/generate-image-first/"', gallery)
        self.assertNotIn('href="/zh/home-next/"', gallery)
        self.assertNotIn('href="/zh/generate/">生图</a>', gallery)
        self.assertIn('a[href="/zh/"]::before', css)
        self.assertIn('a[href="/zh/generate-image-first/"]::before', css)

    def test_pricing_navigation_keeps_primary_order_before_extra_links(self):
        pricing = read("pricing/index.html")
        nav_match = re.search(r'<nav class="prompt-page-nav"[^>]*>(.*?)</nav>', pricing, re.S)
        self.assertIsNotNone(nav_match, "pricing page should keep a primary nav")
        nav = nav_match.group(1)
        labels = re.findall(r">([^<>]+)</a>", nav)
        self.assertEqual(labels[:3], ["Home", "Gallery", "Generate"])
        self.assertIn("Pricing", labels)

    def test_zh_pricing_navigation_uses_launch_generator_routes(self):
        pricing = read("zh/pricing/index.html")
        self.assertIn('data-page="prompt-hub" data-surface="pricing"', pricing)
        self.assertIn('href="/zh/"', pricing)
        self.assertIn('href="/zh/generate-image-first/"', pricing)
        self.assertIn('href="/zh/gallery/"', pricing)
        self.assertIn('href="/zh/pricing/" aria-current="page"', pricing)
        self.assertIn('data-email-gate', pricing)
        self.assertIn('href="#credit-waitlist"', pricing)
        self.assertNotIn('href="/zh/home-next/"', pricing)
        self.assertNotIn('href="/zh/generate/">', pricing)

    def test_static_info_pages_keep_clean_launch_navigation(self):
        english_expected = [
            ('/zh/generate-image-first/', 'Generate'),
            ('/gallery/', 'Gallery'),
            ('/image-prompt-pack/', 'Image Pack'),
            ('/pricing/', 'Pricing'),
        ]
        chinese_expected = [
            ('/zh/generate-image-first/', '生成图片'),
            ('/zh/gallery/', '图库'),
            ('/zh/image-prompt-pack/', '目录'),
            ('/zh/pricing/', '积分'),
        ]

        for path in ["about/index.html", "contact/index.html", "privacy/index.html", "terms/index.html"]:
            nav = re.search(r'<nav class="nav">(.*?)</nav>', read(path), re.S).group(1)
            links = re.findall(r'<a href="([^"]+)">([^<]+)</a>', nav)
            self.assertEqual(links, english_expected, path)

        for path in ["zh/about/index.html", "zh/contact/index.html", "zh/privacy/index.html", "zh/terms/index.html"]:
            nav = re.search(r'<nav class="nav">(.*?)</nav>', read(path), re.S).group(1)
            links = re.findall(r'<a href="([^"]+)">([^<]+)</a>', nav)
            self.assertEqual(links, chinese_expected, path)

    def test_public_english_pages_link_directly_to_launch_generator(self):
        paths = [
            "index.html",
            "gallery/index.html",
            "pricing/index.html",
            "image-prompt-pack/index.html",
            "about/index.html",
            "contact/index.html",
            "privacy/index.html",
            "terms/index.html",
            "gallery/product/index.html",
            "gallery/poster/index.html",
            "gallery/photography/index.html",
            "gallery/ui/index.html",
        ]
        for path in paths:
            page = read(path)
            self.assertNotIn('href="/generate/"', page, path)
            self.assertIn('href="/zh/generate-image-first/"', page, path)

    def test_404_page_has_real_recovery_routes(self):
        page = read("404.html")
        self.assertIn('href="/"', page)
        self.assertIn('href="/zh/generate-image-first/"', page)
        self.assertIn('href="/gallery/"', page)
        self.assertNotIn('href="/generate/"', page)
        self.assertNotIn('href="#"', page)

    def test_catalog_and_discovery_files_use_launch_generator_route(self):
        catalog = read("zh/image-prompt-pack/index.html")
        css = read("style.css")
        sitemap = read("sitemap.xml")
        llms = read("llms.txt")
        self.assertIn('href="/zh/"', catalog)
        self.assertIn('href="/zh/generate-image-first/"', catalog)
        self.assertNotIn('href="/zh/home-next/"', catalog)
        self.assertNotIn('href="/zh/generate/"', catalog)
        self.assertIn("https://www.promptarc.cc/zh/generate-image-first/", sitemap)
        self.assertIn("https://www.promptarc.cc/zh/generate-image-first/", llms)
        self.assertNotIn("https://www.promptarc.cc/generate/", sitemap)
        self.assertNotIn("https://www.promptarc.cc/zh/generate/", sitemap)
        self.assertNotIn("https://www.promptarc.cc/zh/generate/", llms)
        self.assertIn('body[data-page="prompt-hub"] .prompt-panel {', css)
        self.assertIn("color: #111827;", css)
        self.assertIn('body[data-page="prompt-hub"] .prompt-panel p', css)
        self.assertIn("color: #4b5563;", css)

    def test_launch_html_has_no_visible_mojibake(self):
        paths = [
            "zh/index.html",
            "zh/generate-image-first/index.html",
            "zh/gallery/index.html",
            "zh/pricing/index.html",
            "zh/image-prompt-pack/index.html",
            "zh/account/login/index.html",
            "zh/account/index.html",
            "zh/account/history/index.html",
            "zh/admin/members/index.html",
        ]
        mojibake_tokens = [
            "鍥",
            "鐢",
            "棣",
            "诲",
            "瀵",
            "鑸",
            "璇",
            "鏍",
            "绋",
            "妯",
            "姣",
            "鎻",
            "铏氬",
            "娓叉",
            "鈥?",
            "�",
        ]
        for path in paths:
            text = read(path)
            self.assertNotEqual(text[:1], "\ufeff", path)
            for token in mojibake_tokens:
                self.assertNotIn(token, text, f"{path} contains mojibake token {token!r}")

    def test_mobile_overflow_guard_rules_exist_for_core_pages(self):
        css = read("style.css")
        self.assertIn("ui-ux-pro-max mobile overflow repair", css)
        self.assertIn("overflow-x: hidden", css)
        self.assertIn("max-width: 100vw", css)
        self.assertIn("grid-template-columns: 1fr !important", css)

    def test_mobile_touch_targets_keep_44px_minimums(self):
        css = read("style.css")
        self.assertRegex(css, r"min-height:\s*44px\s*!important", "mobile controls need 44px touch targets")
        self.assertIn("outline: 2px solid rgba(87, 247, 121, 0.88)", css)

    def test_unified_responsive_layer_exists_for_core_surfaces(self):
        css = read("style.css")
        self.assertIn("ui-ux-pro-max unified responsive layer", css)
        self.assertIn("--pa-page-gutter", css)
        self.assertIn("--pa-content-max", css)
        for selector in [
            'body[data-page="home-canvas"] .home-stage-shell',
            'body[data-page="generate-app"] .generate-stage',
            'body[data-page="prompt-hub"] .prompt-page-shell',
        ]:
            self.assertIn(selector, css)

    def test_unified_responsive_layer_covers_desktop_tablet_and_mobile(self):
        css = read("style.css")
        self.assertIn("@media (min-width: 1180px)", css)
        self.assertIn("@media (max-width: 1024px)", css)
        self.assertIn("@media (max-width: 760px)", css)
        self.assertIn("@media (max-width: 520px)", css)

    def test_responsive_layer_scales_gallery_generator_and_pricing(self):
        css = read("style.css")
        self.assertIn("repeat(auto-fit, minmax(min(100%, 220px), 1fr))", css)
        self.assertIn("grid-template-columns: minmax(0, 1fr) minmax(280px, 0.42fr)", css)
        self.assertIn("grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr))", css)
        self.assertIn("width: min(100%, 860px)", css)

    def test_tablet_tool_layout_uses_single_column_composers(self):
        css = read("style.css")
        self.assertIn("ui-ux-pro-max tablet tool layout", css)
        self.assertIn("body[data-page=\"home-canvas\"] .home-console-side", css)
        self.assertIn("body[data-page=\"generate-app\"] .generate-upload-tile", css)
        self.assertIn("grid-template-columns: 1fr !important", css)

    def test_pricing_mobile_hero_has_safe_text_width(self):
        css = read("style.css")
        self.assertIn("ui-ux-pro-max pricing mobile text safety", css)
        self.assertIn('body[data-page="prompt-hub"][data-surface="pricing"] .prompt-subhero h1', css)
        self.assertIn("overflow-wrap: anywhere !important", css)
        self.assertIn("font-size: clamp(1.9rem, 9vw, 2.45rem) !important", css)

    def test_gallery_uses_thumbnails_for_large_lm_and_gh_assets(self):
        app = read("app.js")
        thumbnail_function = re.search(
            r"function getThumbnailUrl\(imageUrl\) \{(?P<body>.*?)\n    \}",
            app,
            re.S,
        )
        self.assertIsNotNone(thumbnail_function, "gallery should keep a thumbnail URL helper")
        body = thumbnail_function.group("body")
        self.assertIn('/assets/gallery/thumbs/', body)
        self.assertNotIn('fileName.startsWith("lm-")', body)
        self.assertNotIn('fileName.startsWith("gh-")', body)

    def test_zh_gallery_subpages_do_not_link_to_missing_tool_pages(self):
        paths = [
            "zh/gallery/product/index.html",
            "zh/gallery/poster/index.html",
            "zh/gallery/photography/index.html",
            "zh/gallery/ui/index.html",
            "zh/gallery/topics/coffee/index.html",
            "zh/gallery/topics/dashboard/index.html",
            "zh/gallery/topics/documentary/index.html",
            "zh/gallery/topics/event/index.html",
            "zh/gallery/topics/launch/index.html",
            "zh/gallery/topics/product-hero/index.html",
        ]
        for path in paths:
            page = read(path)
            self.assertNotIn('href="/zh/tool/', page, path)
            self.assertNotIn('href="/zh/recommended-tools/"', page, path)
            self.assertIn('href="/zh/generate-image-first/"', page, path)
            self.assertIn('href="/zh/pricing/"', page, path)

    def test_zh_gallery_subpages_do_not_link_to_missing_detail_pages(self):
        paths = [
            "zh/gallery/product/index.html",
            "zh/gallery/poster/index.html",
            "zh/gallery/photography/index.html",
            "zh/gallery/ui/index.html",
            "zh/gallery/topics/coffee/index.html",
            "zh/gallery/topics/dashboard/index.html",
            "zh/gallery/topics/documentary/index.html",
            "zh/gallery/topics/event/index.html",
            "zh/gallery/topics/launch/index.html",
            "zh/gallery/topics/product-hero/index.html",
        ]
        missing_detail_patterns = [
            r'href="/zh/gallery/product/[^"#?]+/"',
            r'href="/zh/gallery/poster/[^"#?]+/"',
            r'href="/zh/gallery/photography/[^"#?]+/"',
            r'href="/zh/gallery/ui/[^"#?]+/"',
            r'href="/zh/gallery/character/[^"#?]*/"',
            r'href="/zh/gallery/infographic/[^"#?]*/"',
            r'href="/zh/gallery/test/[^"#?]*/"',
            r'href="/zh/gallery/topics/(?!coffee/|dashboard/|documentary/|event/|launch/|product-hero/)[^"#?]+/"',
        ]
        for path in paths:
            page = read(path)
            for pattern in missing_detail_patterns:
                self.assertIsNone(re.search(pattern, page), f"{path} contains missing detail link pattern {pattern}")

    def test_en_gallery_subpages_do_not_link_to_missing_legacy_pages(self):
        paths = [
            "gallery/product/index.html",
            "gallery/poster/index.html",
            "gallery/photography/index.html",
            "gallery/ui/index.html",
            "gallery/topics/coffee/index.html",
            "gallery/topics/dashboard/index.html",
            "gallery/topics/documentary/index.html",
            "gallery/topics/event/index.html",
            "gallery/topics/launch/index.html",
            "gallery/topics/product-hero/index.html",
        ]
        missing_patterns = [
            r'href="/tool/',
            r'href="/recommended-tools/',
            r'href="/gallery/character/"',
            r'href="/gallery/infographic/"',
            r'href="/gallery/test/"',
            r'href="/gallery/product/[^"#?]+/"',
            r'href="/gallery/poster/[^"#?]+/"',
            r'href="/gallery/photography/[^"#?]+/"',
            r'href="/gallery/ui/[^"#?]+/"',
            r'href="/gallery/topics/(?!coffee/|dashboard/|documentary/|event/|launch/|product-hero/)[^"#?]+/"',
        ]
        for path in paths:
            page = read(path)
            self.assertNotIn('href="/pricing/">Tools</a>', page, path)
            self.assertIn('href="/pricing/">Pricing</a>', page, path)
            for pattern in missing_patterns:
                self.assertIsNone(re.search(pattern, page), f"{path} contains missing link pattern {pattern}")

    def test_static_info_pages_use_current_launch_navigation(self):
        paths = [
            "about/index.html",
            "contact/index.html",
            "privacy/index.html",
            "terms/index.html",
            "zh/about/index.html",
            "zh/contact/index.html",
            "zh/privacy/index.html",
            "zh/terms/index.html",
        ]
        for path in paths:
            page = read(path)
            for legacy in [
                'href="/tool/"',
                'href="/library/"',
                'href="/free-pack/"',
                'href="/recommended-tools/"',
                'href="/zh/tool/"',
                'href="/zh/library/"',
                'href="/zh/free-pack/"',
                'href="/zh/recommended-tools/"',
            ]:
                self.assertNotIn(legacy, page, path)

    def test_gallery_generation_scripts_do_not_reintroduce_legacy_routes(self):
        ps1 = read("scripts/generate-gallery-seo-pages.ps1")
        mjs = read("scripts/generate-gallery-seo-pages.mjs")

        for legacy in [
            'href="/tool/"',
            'href="/library/"',
            'href="/zh/tool/"',
            'href="/zh/library/"',
            'href="/tool/?prompt=',
            'href="/zh/tool/?prompt=',
            "https://www.promptarc.cc/tool/",
            "https://www.promptarc.cc/library/",
            "https://www.promptarc.cc/generate/",
            "https://www.promptarc.cc/free-pack/",
            "https://www.promptarc.cc/recommended-tools/",
            "https://www.promptarc.cc/zh/tool/",
            "https://www.promptarc.cc/zh/library/",
            "https://www.promptarc.cc/zh/free-pack/",
            "https://www.promptarc.cc/zh/recommended-tools/",
            '"/zh/generate/"',
        ]:
            self.assertNotIn(legacy, ps1 + mjs)

        self.assertIn('href="/zh/generate-image-first/?prompt=$promptEncoded"', ps1)
        self.assertIn('href="/zh/generate-image-first/">生图</a>', ps1)
        self.assertIn('"/zh/generate-image-first/"', mjs)

    def test_thumbnail_script_covers_png_jpg_jpeg_and_webp_assets(self):
        script = read("scripts/create-gallery-thumbnails.ps1")
        self.assertIn('".png"', script)
        self.assertIn('".jpg"', script)
        self.assertIn('".jpeg"', script)
        self.assertIn('".webp"', script)
        self.assertNotIn(r'\\\.jpg', script)

    def test_generate_parameter_picker_has_visible_summary(self):
        generate = read("zh/generate-image-first/index.html")
        self.assertIn("data-image-first-settings-summary", generate)
        self.assertRegex(
            generate,
            r'<span data-image-first-settings-summary>[^<]*gpt-image2[^<]*16:9[^<]*4[^<]*2K[^<]*</span>',
            "Image-first generate page should show the active model, ratio, count, and quality",
        )
        self.assertIn("gpt-image2 / 16:9 / 4 张 / 2K", generate)
        self.assertIn('<input type="radio" name="model" value="gpt-image-2" checked><span>gpt-image2</span>', generate)
        self.assertIn("<legend>尺寸</legend>", generate)
        self.assertIn('<input type="radio" name="resolution" value="1k"><span>1k</span></label>', generate)
        self.assertIn('<input type="radio" name="resolution" value="2k" checked><span>2k</span></label>', generate)
        self.assertIn('<input type="radio" name="resolution" value="4k"><span>4k</span></label>', generate)
        self.assertIn('<input type="radio" name="generationCount" value="1"><span>1 张</span></label>', generate)
        self.assertIn('<input type="radio" name="generationCount" value="2"><span>2 张</span></label>', generate)
        self.assertIn('<input type="radio" name="generationCount" value="4" checked><span>4 张</span></label>', generate)
        self.assertIn("生成数量大于 1 张时生效", generate)
        self.assertIn("generate-param-hint", read("style.css"))
        self.assertIn('name="variationMode" value="subtle" checked', generate)
        self.assertNotIn('name="generationCount" value="1" checked', generate)
        self.assertNotIn('<span class="generate-tool-icon">?</span>\n              </summary>', generate)

    def test_generate_parameter_picker_closes_on_outside_click(self):
        app = read("app.js")
        summary_function = re.search(
            r"function initGenerateParamSummary\(\) \{(?P<body>.*?)\n  \}",
            app,
            re.S,
        )
        self.assertIsNotNone(summary_function, "generator parameter picker should keep one interaction initializer")
        body = summary_function.group("body")
        self.assertIn('closest(".generate-param-picker")', body)
        self.assertIn('document.addEventListener("click"', body)
        self.assertIn("!picker.contains(event.target)", body)
        self.assertIn('picker.removeAttribute("open")', body)

    def test_generate_result_image_is_constrained_on_generate_page(self):
        css = read("style.css")
        self.assertIn('body[data-page="generate-app"] .generator-image-result', css)
        self.assertIn('body[data-page="generate-app"] .generator-result-thumb img', css)
        self.assertIn("height: clamp(190px, 22vw, 300px)", css)
        self.assertIn('body[data-page="generate-app"] .generator-image-result.is-count-1 .generator-result-strip', css)
        self.assertIn('body[data-page="generate-app"] .generator-image-result.is-count-2 .generator-result-strip', css)
        self.assertIn('body[data-page="generate-app"] .generator-image-result.is-ratio-16-9 .generator-result-thumb img', css)
        self.assertIn('body[data-page="generate-app"] .generator-image-result.is-ratio-2-3 .generator-result-thumb img', css)
        self.assertIn("object-fit: cover", css)
        self.assertIn('body[data-page="generate-app"] .generator-result-head', css)
        self.assertIn('body[data-page="generate-app"] .generator-image-result .button-row', css)
        self.assertIn("max-height: 5.2em", css)
        self.assertIn("-webkit-line-clamp: 3", css)
        self.assertIn("overflow: hidden", css)

    def test_generate_page_has_result_workspace_controls(self):
        generate = read("zh/generate-image-first/index.html")
        self.assertIn('class="image-first-topbar"', generate)
        self.assertIn('aria-label="主导航"', generate)
        self.assertIn('href="/zh/"', generate)
        self.assertIn('href="/zh/gallery/"', generate)
        self.assertIn('href="/zh/generate-image-first/" aria-current="page"', generate)
        self.assertIn('href="/zh/pricing/"', generate)
        self.assertIn('href="/zh/account/"', generate)
        self.assertIn("data-image-first-results", generate)
        self.assertIn("data-image-first-inspector", generate)
        self.assertIn("data-image-first-detail", generate)
        for unused_label in ["回到顶部", "历史记录", "作为参考图", "编辑图片", "放大", "去背景"]:
            self.assertNotIn(unused_label, generate)

    def test_image_first_generate_page_is_launch_ready_not_preview(self):
        generate = read("zh/generate-image-first/index.html")
        app = read("app.js")
        css = read("style.css")
        self.assertIn("<title>PromptArc AI 图片生成器 | PromptArc</title>", generate)
        self.assertIn('<meta name="robots" content="index,follow">', generate)
        self.assertNotIn("Image-First Generate Preview", generate)
        self.assertNotIn("noindex,nofollow", generate)
        self.assertNotIn("generate-upload-tile", generate)
        self.assertNotIn('aria-label="更多操作"', app)
        self.assertNotIn("data-generated-more", app)
        self.assertIn('body[data-page="generate-image-first"] .image-first-online-composer textarea', css)
        self.assertIn("grid-column: 1 / -1 !important", css)

    def test_email_gate_only_downloads_for_download_forms(self):
        app = read("app.js")
        css = read("style.css")
        pricing = read("zh/pricing/index.html")
        catalog = read("zh/image-prompt-pack/index.html")
        self.assertIn('data-email-gate data-success-target="#credit-waitlist"', pricing)
        self.assertNotIn("data-download-url", pricing)
        self.assertIn('data-download-url="/assets/promptarc-numbered-prompt-catalog.txt"', catalog)
        self.assertIn('const downloadUrl = form.getAttribute("data-download-url") || "";', app)
        self.assertIn("const hasDownload = Boolean(downloadUrl);", app)
        self.assertIn("if (!hasDownload) {\n            return;\n          }", app)
        self.assertIn('name: hasDownload ? "free_pack_downloaded" : "waitlist_joined"', app)
        self.assertNotIn('config.leadMagnetUrl || "/assets/prompt-ops-starter-kit.txt"', app)
        self.assertIn('body[data-page="prompt-hub"] .clean-email-form .prompt-page-button.primary', css)
        self.assertIn("width: 100%;", css)
        self.assertIn("background: #57f779;", css)

    def test_generate_result_stream_and_preview_contract(self):
        app = read("app.js")
        css = read("style.css")
        for token in [
            "generator-result-entry",
            "generator-result-group",
            "getResultRatioClass",
            "is-count-",
            "appendResultFailure",
            "generator-result-prompt",
            "generator-result-strip",
            "data-generated-preview",
            "initGeneratedResultPreview",
            "data-generated-preview-thumbs",
            "data-generated-preview-stepper",
            "generated-preview-info",
            "closestGroup.querySelectorAll",
            "fetchGeneratedCandidate",
            "maxAttempts",
            "document.body.classList.add(\"has-results\")",
        ]:
            self.assertIn(token, app)
        for token in [
            'body[data-page="generate-app"].has-results .generate-composer-card',
            'body[data-page="generate-app"].has-results .generate-result',
            'body[data-page="generate-app"].has-results .generate-composer h1',
            "generator-result-thumb-error",
            'body[data-page="generate-app"] .generate-composer-card',
            "position: sticky",
            "bottom: 18px",
            'body[data-page="generate-app"] .generator-result-strip',
            'body[data-page="generate-app"] .generated-preview-modal',
            'body[data-page="generate-app"] .generated-preview-side',
            "z-index: 1500",
            "grid-template-columns: minmax(0, 1fr) clamp(380px, 30vw, 440px)",
            "align-items: stretch",
            "padding: 0",
            "background: #0d0e12",
            "height: 100vh",
            "max-height: calc(100vh - 68px)",
            "max-width: min(760px, calc(100vw - 560px))",
            "scrollbar-width: none",
            'body[data-page="generate-app"] .generated-preview-info',
            "box-shadow: inset 1px 0 0 rgba(255, 255, 255, 0.045)",
            "body[data-page=\"generate-app\"] .generated-preview-modal:not(.has-multiple) .generated-preview-stepper",
            "display: none",
            "right: 18px",
            "overflow: auto",
            "overflow-x: hidden",
            "position: fixed",
            "grid-template-columns: repeat(4, minmax(0, 1fr))",
        ]:
            self.assertIn(token, css)

    def test_generate_page_keeps_mock_result_visual_qa_entry(self):
        app = read("app.js")
        for token in [
            'params.get("mock-result")',
            "renderMockGenerationResult",
            "mockGeneratedImages",
            "document.body.classList.add(\"has-results\")",
            "data-generated-preview",
            "data-image-url",
            "data-image-prompt",
            "data-image-meta",
        ]:
            self.assertIn(token, app)

    def test_generate_page_redirects_to_image_first_generator(self):
        generate = read("generate/index.html")
        zh_generate = read("zh/generate/index.html")
        for markup in [generate, zh_generate]:
            for token in [
                "window.location.replace",
                "generate-image-first",
                "http-equiv=\"refresh\"",
            ]:
                self.assertIn(token, markup)
            self.assertNotIn("PromptArc Generate", markup)
            self.assertNotIn("generate-workspace", markup)

    def test_generate_workspace_css_has_desktop_and_mobile_layouts(self):
        css = read("style.css")
        for token in [
            "PromptArc generate workspace redesign",
            'body[data-page="generate-app"] .generate-workspace',
            "grid-template-columns: minmax(280px, 360px) minmax(0, 1fr) minmax(300px, 360px)",
            'body[data-page="generate-app"] .generate-workspace-center',
            'body[data-page="generate-app"] .generate-workspace-right',
            'body[data-page="generate-app"] .generate-canvas',
            'body[data-page="generate-app"].has-results .generate-empty-state',
            "@media (max-width: 980px)",
            "grid-template-columns: 1fr",
            "position: sticky",
            "bottom: 0",
            'body[data-page="generate-app"] .generate-param-picker[open] .generate-param-panel',
        ]:
            self.assertIn(token, css)

    def test_generate_workspace_js_updates_inspector_and_slot_states(self):
        app = read("app.js")
        for token in [
            "function updateGenerateInspector",
            "[data-generate-inspector]",
            "[data-generate-inspector-prompt]",
            "[data-generate-inspector-meta]",
            "data-generator-slot-state",
            "is-generating",
            "is-complete",
            "is-failed",
            "data-generated-index",
        ]:
            self.assertIn(token, app)

    def test_experimental_generator_pages_redirect_to_launch_generator(self):
        for path in ["zh/generate-next/index.html", "zh/generate-studio/index.html"]:
            page = read(path)
            self.assertIn('name="robots" content="noindex,nofollow"', page)
            self.assertIn('http-equiv="refresh" content="0; url=/zh/generate-image-first/"', page)
            self.assertIn('window.location.replace("/zh/generate-image-first/"', page)
            self.assertIn('rel="canonical" href="https://www.promptarc.cc/zh/generate-image-first/"', page)
            self.assertNotIn('data-page="generate-next"', page)
            self.assertNotIn('data-page="generate-studio"', page)
            self.assertNotIn("data-next-generate-form", page)
            self.assertNotIn("data-studio-form", page)

    def test_zh_home_is_launch_generation_homepage(self):
        page = read("zh/index.html")
        app = read("app.js")
        for token in [
            'data-page="home-canvas"',
            '<title>PromptArc AI 图片生成器 | PromptArc</title>',
            'name="robots" content="index,follow"',
            'href="/zh/" aria-current="page"',
            'href="/zh/generate-image-first/"',
            "image-generator-form",
            "home-hero-console",
            "home-discovery-grid",
            "PromptArc AI 图片生成器",
        ]:
            self.assertIn(token, page)
        for token in [
            'name="prompt"',
            'name="ratio" value="1:1 square"',
            'name="generationCount" value="1"',
            '<button class="home-console-submit" type="submit">开始生图</button>',
        ]:
            self.assertIn(token, page)
        self.assertNotIn("mock-result", page)
        self.assertNotIn('href="/zh/home-next/"', page)
        self.assertNotIn('href="/zh/generate/"', page)
        self.assertNotIn("home-console-side-button", page)
        self.assertIn("function bindHomePicker", app)
        self.assertIn("[data-home-resolution-option]", app)
        self.assertIn("[data-home-ratio-option]", app)
        self.assertIn("[data-home-resolution-input]", app)
        self.assertIn("[data-home-ratio-input]", app)
        self.assertIn('menu.removeAttribute("open")', app)

    def test_homepages_do_not_show_fake_reference_upload_buttons(self):
        for path in ["index.html", "zh/index.html"]:
            page = read(path)
            self.assertNotIn("home-console-side-button", page, path)
            self.assertNotIn("Upload reference", page, path)

    def test_homepage_navigation_exposes_launch_product_routes(self):
        english = read("index.html")
        chinese = read("zh/index.html")
        css = read("style.css")
        for href in ['href="/gallery/"', 'href="/zh/generate-image-first/"', 'href="/pricing/"', 'href="/zh/account/"']:
            self.assertIn(href, english)
        for href in ['href="/zh/gallery/"', 'href="/zh/generate-image-first/"', 'href="/zh/pricing/"', 'href="/zh/account/"']:
            self.assertIn(href, chinese)
        self.assertNotIn('body[data-page="home-canvas"] .home-rail-nav a:nth-child(n+4)', css)

    def test_gallery_filter_controls_match_available_gallery_items(self):
        data = read("gallery/gallery-data.js")
        categories = set(re.findall(r'category:\s*"([^"]+)"', data))
        tags = set()
        for tag_block in re.findall(r'tags:\s*\[([^\]]*)\]', data, re.S):
            tags.update(re.findall(r'"([^"]+)"', tag_block))

        available = {value.lower() for value in categories | tags}
        self.assertIn("product", available)
        self.assertIn("poster", available)

        for path in ["gallery/index.html", "zh/gallery/index.html"]:
            page = read(path)
            filters = set(re.findall(r'data-gallery-filter="([^"]+)"', page))
            self.assertIn("all", filters, path)
            for filter_value in filters - {"all"}:
                self.assertIn(filter_value.lower(), available, f"{path} has an empty gallery filter: {filter_value}")

    def test_home_next_redirects_to_launch_homepage(self):
        page = read("zh/home-next/index.html")
        for token in [
            'name="robots" content="noindex,nofollow"',
            'http-equiv="refresh" content="0; url=/zh/"',
            'rel="canonical" href="https://www.promptarc.cc/zh/"',
            "window.location.replace('/zh/')",
            'href="/zh/"',
        ]:
            self.assertIn(token, page)
        self.assertNotIn('data-page="home-next"', page)

    def test_generate_image_first_preview_surface_exists(self):
        page = read("zh/generate-image-first/index.html")
        css = read("style.css")
        app = read("app.js")
        for token in [
            'data-page="generate-image-first"',
            '/config.js',
            "image-first-workspace",
            "image-first-result-feed",
            "image-first-command-box",
            "image-first-command-toggle",
            "image-first-command-drawer",
            "image-first-candidate-grid",
            "image-first-inspector",
            "image-first-detail-view",
            "data-image-first-form",
            "data-image-first-command-toggle",
            "data-image-first-command-drawer",
            "data-image-first-results",
            "data-image-first-inspector",
            "data-image-first-detail",
        ]:
            self.assertIn(token, page)
        for token in [
            "PromptArc generate image-first preview",
            'body[data-page="generate-image-first"] .image-first-workspace',
            'body[data-page="generate-image-first"] .image-first-command-box',
            'body[data-page="generate-image-first"] .image-first-command-toggle',
            'body[data-page="generate-image-first"] .image-first-command-drawer',
            'body[data-page="generate-image-first"] .image-first-candidate-grid',
            'body[data-page="generate-image-first"] .image-first-inspector',
            'body[data-page="generate-image-first"] .image-first-detail-view',
        ]:
            self.assertIn(token, css)
        for token in [
            "function initGenerateImageFirst()",
            "[data-image-first-form]",
            "[data-image-first-results]",
            "[data-image-first-command-toggle]",
            "[data-image-first-detail]",
            "renderImageFirstResults",
            "selectImageFirstCandidate",
            "openImageFirstDetail",
            "closeImageFirstDetail",
            "loadPromptArcSession",
            "redirectToLogin",
            "config.imageGeneratorEndpoint",
        ]:
            self.assertIn(token, app)

    def test_image_first_detail_navigation_buttons_are_wired(self):
        page = read("zh/generate-image-first/index.html")
        app = read("app.js")
        self.assertEqual(page.count('class="image-first-detail-nav"'), 2)
        self.assertIn('aria-label="上一张"', page)
        self.assertIn('aria-label="下一张"', page)
        self.assertIn("function moveImageFirstDetail(delta)", app)
        self.assertIn('event.target.closest(".image-first-detail-nav")', app)
        self.assertIn("moveImageFirstDetail(navButtons.indexOf(detailNav) === 0 ? -1 : 1)", app)

    def test_membership_d1_schema_foundation_exists(self):
        schema = read("workers/d1-schema.sql")
        for token in [
            "CREATE TABLE IF NOT EXISTS auth_challenges",
            "CREATE TABLE IF NOT EXISTS sessions",
            "CREATE TABLE IF NOT EXISTS memberships",
            "CREATE TABLE IF NOT EXISTS quota_events",
            "CREATE TABLE IF NOT EXISTS generation_requests",
            "CREATE TABLE IF NOT EXISTS admin_audit_log",
            "Membership generation writes must bind user_id",
            "anonymous_id remains only for pre-membership rollback and legacy records",
        ]:
            self.assertIn(token, schema)

    def test_account_pages_exist(self):
        for path in [
            "zh/account/login/index.html",
            "zh/account/index.html",
            "zh/account/history/index.html",
        ]:
            full = ROOT / path
            self.assertTrue(full.exists(), path)
            text = full.read_text(encoding="utf-8")
            self.assertIn('data-page="account"', text)
            self.assertIn('name="robots" content="noindex,nofollow"', text)

    def test_account_pages_are_hydrated(self):
        app = read("app.js")
        self.assertIn("function initAccountPages()", app)
        self.assertIn("loadPromptArcSession", app)
        self.assertIn("/api/auth/challenge", app)
        self.assertIn("/api/auth/verify", app)
        self.assertIn("/api/account/history", app)
        self.assertIn("[data-account-status]", app)
        self.assertIn("promptarc.pendingPrompt", app)
        self.assertEqual(app.count('loginForm.addEventListener("submit"'), 1)
        self.assertNotIn("登录接口接入后会向", app)
        self.assertNotIn("When the login endpoint is connected", app)
        for path in [
            "zh/account/login/index.html",
            "zh/account/index.html",
            "zh/account/history/index.html",
        ]:
            text = read(path)
            self.assertIn("data-account-status", text)

    def test_account_pages_route_to_launch_surfaces(self):
        login = read("zh/account/login/index.html")
        dashboard = read("zh/account/index.html")
        history = read("zh/account/history/index.html")
        admin = read("zh/admin/members/index.html")
        self.assertIn('href="/zh/"', login)
        self.assertIn('href="/zh/"', dashboard)
        self.assertIn('href="/zh/account/"', history)
        self.assertIn('href="/zh/"', admin)
        self.assertIn('href="/zh/account/login/"', dashboard)
        self.assertIn('href="/zh/account/login/"', history)
        self.assertIn('href="/zh/generate-image-first/"', dashboard)
        self.assertIn('href="/zh/generate-image-first/"', history)
        self.assertNotIn('href="/zh/home-next/"', login)
        self.assertNotIn('href="/zh/home-next/"', dashboard)
        self.assertNotIn('href="/zh/home-next/"', history)
        self.assertNotIn('href="/zh/home-next/"', admin)
        self.assertNotIn('href="/zh/generate/"', dashboard)
        self.assertNotIn('href="/zh/generate-next/"', dashboard)
        self.assertNotIn('href="/zh/generate-studio/"', dashboard)

    def test_generator_frontend_mentions_login_requirement(self):
        app = read("app.js")
        self.assertIn("/api/auth/session", app)
        self.assertIn("login_required", app)
        self.assertIn("redirectToLogin", app)

    def test_admin_members_page_exists(self):
        full = ROOT / "zh/admin/members/index.html"
        self.assertTrue(full.exists())
        text = full.read_text(encoding="utf-8")
        self.assertIn('data-page="admin-members"', text)
        self.assertIn('name="robots" content="noindex,nofollow"', text)
        app = read("app.js")
        self.assertIn("function initAdminMembersPage()", app)
        self.assertIn("/api/admin/members", app)
        self.assertIn("promptarc.adminToken", app)
        self.assertIn("history.replaceState", app)

    def test_deploy_workflow_publishes_clean_site_artifact_only(self):
        workflow = read(".github/workflows/deploy-pages.yml")
        builder = read("scripts/build-pages-artifact.mjs")

        self.assertIn("node scripts/build-pages-artifact.mjs", workflow)
        self.assertIn("path: _site", workflow)
        self.assertNotIn("path: .", workflow)
        for token in [
            "test -f _site/index.html",
            "test -f _site/zh/generate-image-first/index.html",
            "test ! -e _site/workers",
            "test ! -e _site/tests",
            "test ! -e _site/docs",
            "test ! -e _site/.github",
            "test ! -e _site/.env.example",
            "test ! -e _site/_deploy",
        ]:
            self.assertIn(token, workflow)

        for token in [
            '"zh"',
            '"assets"',
            '"gallery"',
            '"generate"',
            '"app.js"',
            '"style.css"',
            '".env.example"',
            '"workers"',
            '"tests"',
            '"docs"',
            '"_deploy"',
            '".github"',
            "assertSafeOutputDir",
            "assertForbiddenEntriesAbsent",
        ]:
            self.assertIn(token, builder)


if __name__ == "__main__":
    unittest.main()

