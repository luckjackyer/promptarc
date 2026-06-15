# PromptArc UI/UX Redesign Standards

This document is the control plan for the PromptArc visual redesign. It exists to prevent scattered polish work. Each phase must pass its gate before the next phase starts.

## Phase 1: Desktop Homepage Foundation

Goal: make the desktop homepage read as an image-generation product in the first viewport.

Files:
- `index.html`
- `style.css`
- `tests/homepage_target_contract.test.mjs`

Required outcome:
- Desktop navigation order is `Generate`, `Gallery`, `Pricing`, `Account`.
- The logo is a real brand lockup: mark plus `PromptArc`, not only a floating `PA` badge.
- The first viewport contains headline, prompt composer, primary Generate action, and visible image previews.
- The first visual signal is image creation, not SaaS metrics.
- Hero typography stays controlled: desktop H1 target 56-72px, line-height 1.05-1.12, no forced nowrap dependency.
- Product panels use restrained radii: composer and hero surfaces target 14-18px.
- No payment, auth, API, deployment, or database behavior changes.

Gate:
- Contract test passes.
- Browser screenshot at 1440px shows image previews in the hero.
- No horizontal overflow at 1440px and 390px.
- `impeccable` detector has no new homepage findings.
- Manual UI/UX self-check confirms Generate is the dominant action.

## Phase 2: GPT-image2 Visual Asset Set

Goal: replace placeholder/legacy hero visuals with product-proof generated image assets.

Files:
- `assets/home/` generated images
- `index.html`
- `style.css`

Required outcome:
- At least 4 desktop hero assets: product photo, poster, campaign visual, social/ad creative.
- Assets have consistent quality, no watermarks, no malformed readable text, no accidental brand logos.
- First viewport uses the strongest 3-4 assets.
- Images support the prompt-generation story, not decoration.

Gate:
- Generated assets inspected visually.
- Hero still passes Phase 1 layout checks.
- Image file sizes are reasonable for web use.
- Alt text describes the image role.

## Phase 3: Featured Results And Section Hierarchy

Goal: make the second section image-first and reduce title dominance.

Required outcome:
- Featured results appear immediately after the hero with images as the main weight.
- Section title target 30-38px on desktop.
- `Open full gallery` remains readable and does not wrap vertically.
- Cards do not use oversized rounded corners or heavy shadows.

Gate:
- Desktop screenshot confirms images dominate the second viewport.
- Mobile screenshot confirms images appear by the second screen.
- No card text overflow.

## Phase 4: Cross-Page Visual Consistency

Goal: align Gallery, Generate, Pricing, Account, and Chinese equivalents with the homepage system.

Required outcome:
- Shared logo/nav rhythm.
- Shared color, radius, typography, button, focus, and panel vocabulary.
- Generate page remains the deepest product workspace.
- Pricing does not look like a separate marketing template.

Gate:
- Existing UI contract tests pass.
- Responsive render audit passes.
- Manual screenshots for desktop homepage, gallery, generator, pricing.

## Phase 5: Final Accessibility And Interaction Audit

Goal: verify keyboard, focus, loading, empty, error, and mobile states.

Required outcome:
- Visible focus ring on every interactive control.
- Generate loading and error states are explicit.
- Parameter menus are keyboard reachable and closable.
- Mobile has no horizontal overflow and no unusable tiny controls.

Gate:
- Automated tests pass.
- Manual keyboard pass on homepage and generator.
- Visual review finds no blocking UI defects.
