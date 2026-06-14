# Generate Workspace Redesign Design

## Goal

Redesign PromptArc's image generation page as a professional creation workspace for desktop and mobile, without changing the existing image generation backend contract in this phase.

## Product Position

PromptArc Generate should feel like a calm AI image creation tool, not a form page, marketing page, admin dashboard, or generic image lightbox. The interface should help users move through four moments:

1. Describe the image.
2. Choose only the parameters that matter.
3. Watch generation progress with clear status.
4. Inspect, compare, download, or continue from a result.

The design must prioritize the generated image after generation starts. Controls stay precise and available, but they should not compete with the artwork.

## Design Thesis

Prompt first, image centered, controls quiet.

The prompt is the user's creative command. The image is the primary object. Parameters, history, metadata, and tools are secondary surfaces that appear where they help the task.

## Non-Goals

- Do not redesign the backend generation API.
- Do not add account, billing, payment, or database changes.
- Do not redesign the whole PromptArc site.
- Do not preserve yesterday's detail modal structure if it conflicts with the new workspace.
- Do not create a decorative landing page before the actual generator.

## Recommended Approach

Use a front-end redesign of the generator surface while preserving the existing backend integration.

This means:

- Keep `/generate/` and `/zh/generate/` as the same public routes.
- Keep existing generate API calls and request fields unless a UI field needs a front-end-only mapping.
- Keep mock QA support with `?mock-result=1`, `?mock-result=2`, and `?mock-result=4`.
- Rebuild the page structure, state classes, CSS, and front-end rendering around a new workspace model.

## Aesthetic Standard

The interface should feel close to a dark professional product workspace: Linear and Raycast for surface discipline, Figma for tool grouping, Apple product inspection for image priority, and Replicate for restrained AI creation energy.

Use:

- Near-black canvas, not pure black.
- One green action accent for the primary generate action and selected states.
- Low-contrast borders and surface steps instead of decorative shadows.
- One system font stack.
- Clear text labels for unfamiliar actions.
- Familiar icons only when the icon is standard and visually consistent.

Avoid:

- Random glyph buttons.
- Glass panels as decoration.
- Large gradients.
- Over-rounded cards.
- Heavy drop shadows.
- Marketing-scale typography inside tool surfaces.
- Mobile as a shrunken desktop.

## Core Layout: Desktop

Desktop uses a three-zone creation workspace after the page shell navigation.

### Left Rail: Composer And Parameters

The left rail is the user's creation command area.

Contents:

- Prompt textarea.
- Generate button.
- Core parameter row: ratio, count, quality, variation.
- Secondary parameter groups in disclosure panels.
- Compact helper text for queue and variation rules.

Behavior:

- Before generation, the left rail may visually widen or sit closer to the center to make input feel primary.
- After results exist, the left rail becomes a stable command rail.
- Parameter panels close when clicking outside them.
- Generate remains the only primary action in this rail.

Rules:

- Use grouped controls, not one long exposed form.
- Show values directly on closed controls.
- Variation must be explicit and understandable: "Add light variation when generating more than one image."
- Count controls must allow 1, 2, and 4 if the backend flow supports sequential generation.

### Center Stage: Results

The center stage is the visual core.

States:

- Empty: quiet prompt-oriented canvas with one useful empty state.
- Generating: reserved output slots, each with clear status.
- Partial result: completed images appear while later images remain queued or generating.
- Complete: result layout adapts to count and ratio.
- Error: failed slots show retry context without collapsing the group.

Layouts:

- One image: one large centered image with breathing room.
- Two images: balanced pair, respecting the selected ratio.
- Four images: candidate array, clear enough to compare.
- Horizontal images should look horizontal because their ratio demands it.
- Vertical images should retain vertical presence and not be forced into a landscape gallery.

### Right Rail: Selected Image Inspector

The right rail appears when there is at least one result or a selected generated image.

Contents:

- Selected result thumbnail summary.
- Prompt.
- Parameters used.
- Download, save, share, more.
- Continue actions: regenerate, light variation, edit/canvas, upscale, expand.

Behavior:

- The right rail is quiet by default.
- Primary inspection belongs here, not in floating random buttons.
- Actions are grouped by purpose: file actions, creation actions, edit tools.
- If no result is selected, the rail shows a useful status summary or remains collapsed.

## Core Layout: Mobile

Mobile uses a single-column image-first flow.

Structure:

- Top bar: page title, compact history/search or utility actions.
- Main area: empty state, generating state, or result stage.
- Bottom composer: fixed or sticky prompt input and generate action.
- Parameters: bottom drawer.
- Detail: full-height or near-full-height detail workspace with image first, then metadata and actions.

Rules:

- Do not shrink the desktop three-column layout.
- Keep the image large enough to inspect.
- Keep primary actions reachable by thumb.
- Use 44px preferred touch targets for main controls.
- Bottom composer must not cover final results without enough padding.
- Detail close control must be visible and reachable.

## Interaction Model

### Initial

The user sees a focused composer and a calm empty result area.

Required elements:

- Prompt input.
- Generate button.
- Compact access to parameters.
- Clear current defaults.

### Parameter Expanded

The user can inspect or change parameters without losing the prompt.

Required behavior:

- Click outside parameter panel closes it.
- Escape closes it.
- Focus stays logical for keyboard users.
- Closed control reflects selected value.

### Generating

The user must know what is happening.

Required behavior:

- Show requested count.
- Show per-slot state: queued, generating, completed, failed.
- If generation is sequential, communicate that directly.
- Successful slots remain visible even if later slots fail.
- The generate button enters loading or disabled state without resizing.

### Result

Generated images become the primary content.

Required behavior:

- Composer moves to bottom on mobile and remains accessible.
- Desktop keeps the command rail visible.
- Results are selectable.
- Selected image updates the inspector.
- Result group can be regenerated from the original prompt.

### Detail Workspace

Clicking an image opens a detail workspace.

Required structure:

- Image stage.
- Candidate navigation if multiple images exist.
- Prompt section.
- Parameter section.
- Action groups.
- Close control.

Rules:

- It should feel like an image detail workspace, not a generic lightbox.
- The close button belongs to the layer's top-right or the image stage top-right.
- It must never sit on the split between image and inspector.
- Single-image detail may keep one thumbnail, but it should not dominate.
- Multi-image detail may make candidate thumbnails more visible.

## Component System

### Buttons

Button hierarchy:

- Primary: Generate.
- Secondary: Download, Regenerate, Use prompt.
- Tertiary: Save, Share, More, utility tools.
- Disabled: unavailable actions.
- Loading: active generation.

Every button must have default, hover, active, focus, disabled, and loading states where applicable.

Button labels should describe the action:

- Generate image.
- Generate 4 images.
- Download image.
- Save image.
- Share image.
- Add variation.
- Edit prompt.

### Inputs

Prompt input:

- Supports multiline text.
- Does not resize the whole layout unpredictably.
- Shows a useful placeholder.
- Keeps submit action obvious.

Parameter controls:

- Ratio: segmented or select-style control.
- Count: segmented 1, 2, 4.
- Quality/resolution: select-style.
- Variation: switch with helper text.

### Result Tiles

Each tile has:

- Stable aspect-ratio frame.
- Loading skeleton.
- Completed image.
- Failure message.
- Selected state.
- Hover affordance on desktop.
- Tap affordance on mobile.

### Inspector Sections

Sections:

- Image actions.
- Prompt.
- Generation settings.
- Continue editing.

The inspector should read like metadata and next steps, not a pile of unrelated controls.

## Content And Copy

Chinese UI should be concise and literal.

Recommended Chinese labels:

- 生成图片
- 生成 4 张
- 参数
- 比例
- 数量
- 清晰度
- 轻微变化
- 下载
- 收藏
- 分享
- 更多
- 重新编辑
- 再生成
- 扩图
- 高清
- 关闭

Helper text:

- "生成数量大于 1 张时生效。"
- "多张图片会按队列依次生成，已完成的结果会先显示。"
- "点击图片查看详情和后续工具。"

## Accessibility

Requirements:

- WCAG AA contrast for body text and controls.
- Visible focus states.
- Keyboard support for parameter panels, result selection, and detail close.
- `Escape` closes panels and detail layers.
- Images need meaningful alt text based on prompt and result index.
- Loading and error states must be announced with status semantics where reasonable.
- Reduced-motion support for transitions.

## Responsive Requirements

Desktop:

- Wide screen: three-zone workspace.
- Medium screen: collapse right rail into an inspector drawer or below-stage panel.
- Narrow tablet: two-zone layout, composer plus result stage.

Mobile:

- Single-column layout.
- Bottom composer.
- Parameter bottom drawer.
- Detail stacks image, actions, prompt, and metadata.

No text may overflow its container at 390px width.

## Test And QA Requirements

Mock routes:

- `/zh/generate/?mock-result=1`
- `/zh/generate/?mock-result=2`
- `/zh/generate/?mock-result=4`
- `/zh/generate/?mock-result=4&verify=detail`

Required checks:

- Desktop initial state.
- Desktop parameter expanded state.
- Desktop generating state.
- Desktop result state with 1, 2, and 4 images.
- Desktop detail workspace.
- Mobile initial state.
- Mobile parameter drawer.
- Mobile result state.
- Mobile detail workspace.
- Keyboard close behavior.
- Outside-click parameter close behavior.
- No blank images from empty `img src`.
- No clipped dropdowns or drawers.
- No horizontal overflow at 390px.

Verification commands:

- `py -3 -m unittest tests.ui_ux_contract_test`
- `node --check app.js`
- `node C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs --json app.js style.css zh/generate/index.html generate/index.html`

## Implementation Boundaries

Expected files:

- `zh/generate/index.html`
- `generate/index.html`
- `style.css`
- `app.js`
- `tests/ui_ux_contract_test.py`

Allowed additions:

- Small front-end helper functions inside `app.js`.
- CSS sections for the new workspace.
- Contract tests for layout tokens, states, and QA routes.

Avoid:

- New frontend framework.
- Backend route changes.
- Database changes.
- Auth changes.
- Payment changes.
- Global redesign outside generator routes.

## Acceptance Criteria

The redesign is acceptable when:

- The generator reads as a coherent creation workspace on desktop.
- Mobile has its own usable flow, not a compressed desktop.
- Result layouts adapt to image count and ratio.
- Parameter controls are discoverable but secondary.
- Multi-image sequential generation status is explicit.
- Detail view feels like an image workspace.
- Buttons share one visual system.
- Tests and detector checks pass.
- Screenshots show no obvious overflow, clipping, awkward button placement, or mismatched typography.
