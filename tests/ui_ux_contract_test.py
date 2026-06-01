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
        generate = read("generate/index.html")
        self.assertIn("data-generate-param-summary", generate)
        self.assertRegex(
            generate,
            r'<span data-generate-param-summary>[^<]*(?:HD|K)[^<]*3:4[^<]*2[^<]*</span>',
            "English generate page should show the active resolution, ratio, and image count in the collapsed parameter picker",
        )
        self.assertIn("HD 2K | 3:4 | 2 images", generate)
        self.assertNotIn('<span class="generate-tool-icon">?</span>\n              </summary>', generate)

        app = read("app.js")
        self.assertIn("function initGenerateParamSummary()", app)
        self.assertIn("[data-generate-param-summary]", app)


if __name__ == "__main__":
    unittest.main()
