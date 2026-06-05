from pathlib import Path
import re
import unittest


ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


class UiUxContractTest(unittest.TestCase):
    def test_gallery_language_switch_uses_readable_chinese_label(self):
        gallery = read("gallery/index.html")
        self.assertIn('<option value="/zh/gallery/">中文</option>', gallery)
        self.assertNotIn('<option value="/zh/gallery/">??</option>', gallery)

    def test_pricing_navigation_keeps_primary_order_before_extra_links(self):
        pricing = read("pricing/index.html")
        nav_match = re.search(r'<nav class="prompt-page-nav"[^>]*>(.*?)</nav>', pricing, re.S)
        self.assertIsNotNone(nav_match, "pricing page should keep a primary nav")
        nav = nav_match.group(1)
        labels = re.findall(r">([^<>]+)</a>", nav)
        self.assertEqual(labels[:3], ["Home", "Gallery", "Generate"])
        self.assertIn("Pricing", labels)

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
            r'<span data-image-first-settings-summary>[^<]*图片 4\.1[^<]*16:9[^<]*4 张[^<]*2K[^<]*</span>',
            "Image-first generate page should show the active model, ratio, count, and quality",
        )
        self.assertIn("图片 4.1 / 16:9 / 4 张 / 2K", generate)
        self.assertIn('<input type="radio" name="generationCount" value="1"><span>1 张</span>', generate)
        self.assertIn('<input type="radio" name="generationCount" value="2"><span>2 张</span>', generate)
        self.assertIn('<input type="radio" name="generationCount" value="4" checked><span>4 张</span>', generate)
        self.assertIn("生成数量大于 1 张时生效", generate)
        self.assertIn("generate-param-hint", read("style.css"))
        self.assertIn('name="variationMode" value="subtle" checked', generate)
        self.assertNotIn('name="generationCount" value="1" checked', generate)
        self.assertNotIn('<span class="generate-tool-icon">?</span>\n              </summary>', generate)

        app = read("app.js")
        self.assertIn("function initGenerateParamSummary()", app)
        self.assertIn("[data-generate-param-summary]", app)
        self.assertIn('"generationCount", "variationMode"', app)
        self.assertIn("requestedCount", app)
        self.assertIn('generationCount: "1"', app)

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
        self.assertIn("image-first-view-tools", generate)
        self.assertIn("data-image-first-results", generate)
        self.assertIn("data-image-first-inspector", generate)
        self.assertIn("data-image-first-detail", generate)

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

    def test_generate_next_is_independent_redesign_surface(self):
        page = read("zh/generate-next/index.html")
        css = read("style.css")
        app = read("app.js")
        for token in [
            'data-page="generate-next"',
            "next-generate-shell",
            "next-command-surface",
            "next-result-flow",
            "next-focus-mode",
            "data-next-generate-form",
            "data-next-result-flow",
            "data-next-focus-mode",
            "data-next-param-sheet",
        ]:
            self.assertIn(token, page)
        for token in [
            "PromptArc generate next independent redesign",
            'body[data-page="generate-next"] .next-generate-shell',
            'body[data-page="generate-next"] .next-command-surface',
            'body[data-page="generate-next"] .next-result-flow',
            'body[data-page="generate-next"].has-next-results .next-command-surface',
            'body[data-page="generate-next"] .next-focus-mode',
            "@media (max-width: 760px)",
        ]:
            self.assertIn(token, css)
        for token in [
            "function initGenerateNext()",
            "[data-next-generate-form]",
            "[data-next-result-flow]",
            "[data-next-focus-mode]",
            "renderNextMockResults",
            "openNextFocusMode",
            "closeNextFocusMode",
        ]:
            self.assertIn(token, app)

    def test_generate_studio_uses_immersive_dock_layout(self):
        page = read("zh/generate-studio/index.html")
        css = read("style.css")
        app = read("app.js")
        for token in [
            'data-page="generate-studio"',
            "studio-canvas",
            "studio-lab-shell",
            "studio-result-board",
            "studio-inspector",
            "studio-candidate-grid",
            "studio-command-box",
            "studio-detail-panel",
            "studio-dock",
            "studio-filmstrip",
            "studio-orbit-panel",
            "data-studio-form",
            "data-studio-filmstrip",
            "data-studio-focus",
            "data-studio-orbit",
            "data-studio-stage-image",
        ]:
            self.assertIn(token, page)
        for token in [
            "PromptArc generate studio radical redesign",
            "PromptArc generate studio lab redesign",
            'body[data-page="generate-studio"] .studio-canvas',
            'body[data-page="generate-studio"] .studio-lab-shell',
            'body[data-page="generate-studio"] .studio-result-board',
            'body[data-page="generate-studio"] .studio-inspector',
            'body[data-page="generate-studio"] .studio-candidate-grid',
            'body[data-page="generate-studio"] .studio-command-box',
            'body[data-page="generate-studio"] .studio-detail-panel',
            'body[data-page="generate-studio"] .studio-dock',
            'body[data-page="generate-studio"] .studio-filmstrip',
            'body[data-page="generate-studio"] .studio-orbit-panel',
            'body[data-page="generate-studio"].studio-has-results .studio-dock',
            "@media (max-width: 760px)",
        ]:
            self.assertIn(token, css)
        for token in [
            "function initGenerateStudio()",
            "[data-studio-form]",
            "[data-studio-filmstrip]",
            "[data-studio-focus]",
            "renderStudioMockResults",
            "openStudioFocus",
            "closeStudioFocus",
        ]:
            self.assertIn(token, app)

    def test_home_next_is_image_first_generation_homepage(self):
        page = read("zh/home-next/index.html")
        css = read("style.css")
        for token in [
            'data-page="home-next"',
            "home-next-hero",
            "home-next-prompt-box",
            "home-next-visual-cloud",
            "home-next-live-examples",
            "home-next-masonry",
            "home-next-category-section",
            "home-next-before-after",
            "home-next-generate-link",
        ]:
            self.assertIn(token, page)
        for token in [
            "PromptArc image-first home next",
            'body[data-page="home-next"] .home-next-hero',
            'body[data-page="home-next"] .home-next-prompt-box',
            'body[data-page="home-next"] .home-next-visual-cloud',
            'body[data-page="home-next"] .home-next-masonry',
            'body[data-page="home-next"] .home-next-before-after',
            "@media (max-width: 760px)",
        ]:
            self.assertIn(token, css)

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
        for path in [
            "zh/account/login/index.html",
            "zh/account/index.html",
            "zh/account/history/index.html",
        ]:
            text = read(path)
            self.assertIn("data-account-status", text)

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


if __name__ == "__main__":
    unittest.main()
