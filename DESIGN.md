# Design

## System Summary

PromptArc Generate is a dark professional AI image creation workspace. The visual system should be restrained, image-first, and task-focused. It borrows from Linear and Raycast for quiet dark product surfaces, from Apple and Tesla for image-first restraint, from Figma for grouped tools, and from Replicate for AI creation energy.

## Colors

```yaml
colors:
  canvas: "#07090d"
  canvas-deep: "#05070b"
  surface-1: "#0d0f14"
  surface-2: "#111318"
  surface-3: "#181b22"
  surface-control: "#1d2027"
  border-soft: "rgba(255,255,255,0.07)"
  border-strong: "rgba(255,255,255,0.16)"
  text-primary: "#f5f7fb"
  text-secondary: "rgba(245,247,251,0.72)"
  text-tertiary: "rgba(245,247,251,0.52)"
  text-disabled: "rgba(245,247,251,0.36)"
  accent: "#57f779"
  accent-hover: "#7dff91"
  accent-ink: "#07120a"
  danger: "#ff7864"
  success: "#57f779"
  focus-ring: "rgba(87,247,121,0.88)"
```

## Typography

```yaml
typography:
  family-ui: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', 'PingFang SC', sans-serif"
  page-title:
    size: "24px to 32px"
    weight: 800
    lineHeight: 1.12
  section-title:
    size: "18px to 22px"
    weight: 750
    lineHeight: 1.25
  body:
    size: "14px to 16px"
    weight: 500
    lineHeight: 1.5
  prompt:
    size: "14px to 15px"
    weight: 700
    lineHeight: 1.65
  label:
    size: "12px to 13px"
    weight: 700
    lineHeight: 1.35
  button:
    size: "12px to 14px"
    weight: 700
    lineHeight: 1.2
```

Typography rules:

- Use one UI family for product surfaces.
- Do not use display fonts in labels, buttons, or compact panels.
- Keep button labels literal: Download, Save, Share, More, Close, Previous, Next.
- Avoid temporary-looking glyphs when a clear text label works better.

## Spacing And Radius

```yaml
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
radius:
  control: "8px"
  panel: "10px to 14px"
  image: "10px to 14px"
  pill: "999px"
```

Rules:

- Product controls should stay compact.
- Cards and panels should not exceed 16px radius unless the element is intentionally image-led.
- Use spacing and low-contrast borders before decorative shadows.

## Components

### Composer

The composer is the generation command center. It should be prominent before generation and settle near the bottom after results exist. Parameter controls are secondary. The generate button is the single primary action.

### Parameter Panel

The parameter panel should use clear labels, grouped controls, and outside-click close behavior. It must not cover the primary generation action in a confusing way.

### Result Group

Result groups adapt by count and ratio:

- One image: one large image with breathing room.
- Two images: balanced pair.
- Four images: candidate array.
- Horizontal, vertical, and square images preserve aspect ratio.

### Detail Workspace

The generated image detail view is a workspace, not a generic lightbox. It includes:

- Main image stage.
- Candidate thumbnails.
- Prompt information.
- Generation metadata.
- Quiet tool actions.
- Close, previous, and next controls.

Action buttons should use clear text labels. Glyph-only controls are allowed only when the icon style is consistent and familiar.

### Buttons

```yaml
button-primary:
  background: "{colors.accent}"
  text: "{colors.accent-ink}"
  height: "40px to 48px"
  radius: "{radius.control}"
button-secondary:
  background: "{colors.surface-control}"
  text: "{colors.text-primary}"
  height: "40px"
  radius: "{radius.control}"
button-tertiary:
  background: "rgba(255,255,255,0.035)"
  text: "{colors.text-secondary}"
  height: "36px to 40px"
  radius: "{radius.control}"
```

All buttons need default, hover, active, focus, disabled, and loading states.

## Layout States

```yaml
states:
  initial:
    composer: "centered task entry"
    result: "hidden"
  parameter-expanded:
    parameterPanel: "secondary floating panel"
    closeBehavior: "outside click closes"
  generating:
    result: "reserved stable slots"
    status: "explicit count and queue"
  result:
    result: "primary content"
    composer: "bottom anchored"
  detail:
    imageStage: "visual center"
    inspector: "metadata and actions"
  mobile:
    detail: "image first, then metadata and actions"
```

## Anti-patterns

- Generic modal/lightbox for generated image detail.
- Random symbol buttons with mismatched glyphs.
- Heavy accents on inactive tools.
- One rigid grid for all result counts.
- Ignoring image aspect ratio.
- Mobile as a shrunken desktop.
- Over-large typography inside product panels.
- Multiple unrelated accent colors.
- Glassmorphism as decoration.

## QA Standard

Every meaningful generator UI change must be checked in:

- Desktop initial state.
- Parameter expanded state.
- Generating state.
- Result state with 1, 2, and 4 images.
- Detail workspace.
- Mobile result and detail states.
- Hover, focus, disabled, loading, and error states.

Use screenshots and a mismatch list before calling a UI change complete.
