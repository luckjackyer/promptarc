# PromptArc Generate Visual Standard

## Purpose

This document is the visual and UX baseline for the PromptArc image generation page. It exists to prevent uncontrolled UI drift: every future change to `/zh/generate/` or `/generate/` must be checked against this standard before implementation and before launch.

The page should feel like a professional AI image creation workspace: image-first, restrained, precise, and calm.

## Reference Positioning

PromptArc should borrow selectively from these references:

- Linear and Raycast: dark professional tool workspace, quiet surface ladder, hairline borders, low visual noise.
- Apple and Tesla: the created image is the product; UI chrome must recede.
- Figma: clear tool grouping, predictable controls, legible interface hierarchy.
- Replicate: AI creation and experiment energy, but controlled and readable.
- ui-ux-pro-max: complete interaction states, accessibility, mobile behavior, loading feedback, and visual QA.

PromptArc should not become:

- a marketing landing page;
- an admin dashboard;
- a generic lightbox;
- a random modal with buttons attached;
- a desktop layout merely shrunk onto mobile;
- a mixed theme of glass, neon, gradients, heavy cards, and unrelated colors.

## Core Aesthetic Sentence

Let the image be the protagonist, and let every tool around it behave like a calm professional workstation.

## Visual Principles

### 1. Image First

Generated images are always the primary visual object after generation.

Rules:

- The result area owns the visual center after generation.
- The prompt input moves to a bottom composer position after results exist.
- Side panels, toolbars, parameters, and text must support the image, not compete with it.
- Image aspect ratio must be respected. Horizontal, vertical, and square outputs should create different layouts.
- Single image, two images, and four images must each have a purpose-built layout.
- Thumbnails are navigation aids, not the main content.

Failure signs:

- Images are too small, too far left, or visually secondary.
- All image counts use the same rigid grid.
- A vertical image is forced into a horizontal-looking stage.
- Tool buttons feel louder than the image.

### 2. Dark Workspace Consistency

The generate page should use one dark professional system.

Recommended role ladder:

- `canvas`: near-black page background, not pure black.
- `surface-1`: main panels, slightly lighter than canvas.
- `surface-2`: raised controls and result containers.
- `surface-3`: active, hover, or selected surfaces.
- `border-soft`: low-opacity hairline borders.
- `text-primary`: near-white.
- `text-secondary`: muted gray-white.
- `text-tertiary`: subdued gray.
- `accent`: one brand/action accent only.
- `danger`: delete or destructive actions only.
- `success`: completion states only.

Rules:

- Do not mix multiple theme languages on the same page.
- Use borders and spacing before shadows.
- Use one accent color intentionally; do not decorate with many colors.
- Avoid large decorative gradients unless they become the entire brand system.

Failure signs:

- Glass panels mixed with solid cards.
- Random glowing buttons.
- Multiple unrelated accent colors.
- Borders, backgrounds, and shadows all competing at once.

### 3. Typography Discipline

The generate page is a tool interface, not a hero page.

Recommended scale:

- Page title: 24-32px.
- Result section title: 18-22px.
- Main prompt/input text: 15-16px.
- Body/detail text: 14-16px.
- Parameter labels: 13-14px.
- Button labels: 13-14px.
- Helper text and metadata: 12-13px.

Rules:

- Use consistent line height, usually 1.4-1.6.
- Right-side detail text must be grouped with clear labels.
- Prompt text inside detail view should read like artwork metadata.
- Helper text must remain readable; do not make it decorative gray dust.
- Avoid oversized type inside compact panels.

Failure signs:

- Big marketing-scale text inside tool surfaces.
- Tiny unreadable metadata.
- Inconsistent font sizes in neighboring controls.
- Prompt text looks like an unstyled paragraph pasted into a panel.

### 4. Layout By State

The page has separate states. One layout cannot serve them all.

#### Initial State

- The composer may sit near the visual center.
- Parameter access should be visible but quiet.
- The page should feel open, focused, and ready for input.

#### Parameter Expanded State

- Parameter controls should appear as a clear secondary panel.
- Clicking outside the parameter panel should close it.
- The panel must not cover the main action in a confusing way.
- Labels, values, and helper text must align consistently.

#### Generating State

- The user must know that generation is happening.
- If multiple images are requested, the UI must communicate sequence or queue status.
- The page should show stable placeholders so layout does not jump.
- Failure and retry states must be explicit.

#### Result State

- Results become the primary content.
- The composer moves to the bottom.
- Search, history, or view tools may sit in the top/right utility area.
- Result layout must adapt to image count and image aspect ratio.

#### Detail Workspace State

- Clicking a thumbnail opens a dedicated image detail workspace.
- The main image stage is the visual center.
- The right side contains metadata and actions in grouped sections.
- The close button belongs at the detail layer's top-right or image stage top-right, never on the split line.
- The middle divide should be soft. The layer should feel unified.
- The layer should be large enough to feel intentional, but it should not waste height.

#### Mobile State

- Mobile is not a scaled desktop.
- Use a single-column image-first flow.
- The composer should sit at or near the bottom.
- Parameters should become a drawer or compact panel.
- Detail view should stack image, metadata, and actions vertically.
- Close and primary actions must remain reachable.

## Component Standards

### Buttons

Button hierarchy:

- Primary: highest intent, usually Generate or Confirm.
- Secondary: important but not primary, such as Download or Regenerate.
- Tertiary/tool: inspect, copy, favorite, zoom, more.
- Destructive: delete, clear, or irreversible action.

Rules:

- Only one strongest primary action should be visible in a local region.
- Icon buttons should be used for compact tools when the icon is familiar.
- Button groups need spacing and alignment; do not scatter buttons.
- All buttons must have default, hover, active, focus, disabled, and loading states.
- Loading buttons must not resize.

Failure signs:

- Buttons float in awkward positions.
- Tool buttons visually overpower the image.
- Multiple buttons look equally primary.
- Disabled and loading states are unclear.

### Inputs And Composer

Rules:

- The composer is the generation command center.
- It must remain visually stable before, during, and after generation.
- In result state, it should anchor the bottom without hiding results.
- Parameter entry must be discoverable but secondary.
- The send/generate action must be obvious.

Failure signs:

- Composer jumps unexpectedly.
- Parameter panel hides important controls.
- The generate button and parameter controls compete for attention.
- Bottom composer overlaps image content on small screens.

### Result Grid

Rules:

- One image: display as one clear artwork with enough stage breathing room.
- Two images: pair them in a balanced layout, respecting aspect ratios.
- Four images: use a clear candidate array, similar to professional AI tools.
- Loading placeholders should reserve the final image footprint.
- Each image tile should have a clear hover affordance.

Failure signs:

- Thumbnails look like tiny gallery leftovers.
- Result group is too far left or unbalanced.
- The grid ignores vertical versus horizontal images.
- The second or later generated image has no visible queue state.

### Detail Workspace

Required structure:

- Main image stage.
- Candidate thumbnail strip or compact candidate group.
- Prompt section.
- Generation parameters section.
- Action section.
- Close control.

Rules:

- The image stage should be calm, centered, and not jammed against navigation.
- Right panel should feel like artwork information, not a button pile.
- Single-image detail view may keep one small thumbnail, but it should not dominate.
- Multi-image detail view may emphasize candidate thumbnails more.
- Action buttons should be grouped by purpose.

Failure signs:

- It looks like a generic lightbox.
- The close button sits between panels.
- The right side is cramped.
- The vertical divider is too hard.
- Large empty bottom space makes the layer feel unfinished.

## Interaction Standards

Every interactive element must answer:

- What can I click?
- What happened after I clicked?
- Can I undo or close it?
- Is the system still working?
- What state am I in now?

Required interactions:

- Click outside parameter panel closes it.
- Click thumbnail opens detail workspace.
- Close returns to the result page, preserving generated results.
- Escape closes the active overlay when appropriate.
- Loading image slots show progress or stable placeholders.
- Multiple image generation shows count, queue, or per-image status.
- Errors show a clear message and a retry path.

## Responsive Standards

Breakpoints should be behavior-based, not just width-based.

Desktop:

- Results and detail workspace may use multi-column layout.
- Detail layer can use image stage plus right inspector.
- Bottom composer should not cover important content.

Tablet:

- Preserve image priority.
- Reduce side-panel density.
- Keep touch targets comfortable.

Mobile:

- Stack vertically.
- Use drawers for parameters.
- Keep close and primary actions visible.
- Touch targets should be at least 40px.
- Avoid horizontal overflow.

## Visual QA Checklist

Every UI change must be checked in these states:

1. Desktop initial state.
2. Desktop parameter expanded state.
3. Desktop generating one image.
4. Desktop generating multiple images.
5. Desktop result with one image.
6. Desktop result with two images.
7. Desktop result with four images.
8. Desktop detail workspace.
9. Mobile initial state.
10. Mobile result state.
11. Mobile detail state.
12. Hover, active, focus, disabled, loading, error.

QA output must include:

- Current screenshot.
- Reference or intended standard.
- After screenshot.
- Mismatch list.
- Remaining risks.

## Non-Negotiable Rejection Criteria

A change should not ship if any of these are true:

- The generated image is not the visual center after generation.
- The detail view feels like a generic modal/lightbox.
- Close control placement is awkward or ambiguous.
- Button hierarchy is unclear.
- Single, two, and four image states are not considered.
- Image aspect ratio is ignored.
- Mobile is only a shrunken desktop layout.
- Loading or queue state makes the user guess what is happening.
- Theme style mixes unrelated visual languages.
- Text is misaligned, cramped, clipped, or visually inconsistent.

## Implementation Discipline

Future implementation should follow this sequence:

1. Define the state being changed.
2. Identify the relevant standard in this document.
3. Make the smallest scoped change.
4. Capture screenshots for desktop and mobile.
5. Compare against the standard.
6. Fix drift before moving to another state.

Do not combine visual redesign, backend behavior, generation queue behavior, and deployment in one uncontrolled change unless explicitly planned and approved.
