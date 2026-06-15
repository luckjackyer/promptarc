# Pricing Decision Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the PromptArc pricing page into a trustworthy image-credit purchase decision page without copying the ProjectFlow SaaS template.

**Architecture:** Keep the page static and frontend-only. Update the English and Chinese pricing HTML plus scoped CSS, then extend contract tests to prevent regressions in navigation, payment honesty, credit-plan structure, FAQ coverage, and responsive layout.

**Tech Stack:** Static HTML, shared `style.css`, existing Node and Python UI contract tests, manual browser visual QA.

---

## Product Standard For The Target Pricing Page

The target page must follow PromptArc's product system, not the ProjectFlow reference theme.

- Visual register: dark, restrained, image-first, consistent with Generate, Gallery, Account, and homepage.
- Primary user question: "Which image generation credit path should I choose?"
- Main conversion path: use free credits, join image-credit rollout, or buy prompt catalog first.
- Payment honesty: do not show fake buy buttons, fake monthly pricing, or fake public checkout if paid credits are still in private rollout.
- Desktop priority: 1440px desktop must feel complete, aligned, and ready for payment decision.
- Mobile secondary: mobile must remain usable, no horizontal overflow, no hidden primary actions, touch targets at least 40px.
- Page must not look like a separate SaaS pricing template.

## Target Page Structure

1. Global nav
   - Same logo, nav order, active Pricing state, and language switch as the rest of the site.

2. Pricing hero
   - H1: clear and compact, about image credits.
   - Supporting copy: explains free testing before buying credits.
   - Primary action: `Open generator`.
   - Secondary action: `Join credit rollout`.
   - Right side: real image proof board, not abstract decoration.

3. Credit decision strip
   - Three compact paths:
     - Free credits: test image quality.
     - Prompt catalog: buy reusable directions first.
     - Image credits: for repeated output.
   - Each path has a clear next action or status.

4. Plan cards
   - Maximum three cards:
     - Free / Explore
     - Credits / Create
     - Studio / Scale
   - Each card must answer:
     - Who this is for.
     - Price or rollout status.
     - Usage model.
     - Key included items.
     - Clear action.
   - Only one card may be visually featured.

5. Credit rules panel
   - Shows payment-critical rules:
     - Failed generation policy.
     - Credit validity.
     - Login/history relationship.
     - Refund or review policy.
   - This replaces a heavy SaaS-style feature comparison table unless real paid SKUs exist.

6. FAQ
   - Must focus on payment anxiety, not generic marketing.
   - Required topics:
     - Does a failed generation consume credits?
     - Do credits expire?
     - Can I use free credits before paying?
     - What happens after payment?
     - Can I get an invoice or refund?
     - Why are credits in private rollout?

7. Final CTA
   - Quiet, direct, no fake urgency.
   - Primary action remains generator or waitlist, depending on current rollout status.

## Files

- Modify: `pricing/index.html`
  - English pricing content and semantic structure.
- Modify: `zh/pricing/index.html`
  - Chinese pricing content and semantic structure matching English.
- Modify: `style.css`
  - Scoped styles under `body[data-page="prompt-hub"][data-surface="pricing"]`.
  - No global visual drift.
- Modify: `tests/site-artifact-contract.test.mjs`
  - Verify pricing artifact structure and payment honesty.
- Modify: `tests/ui_ux_contract_test.py`
  - Verify pricing page contains required credit/payment decision content.
- Optional modify: `docs/PROMPTARC-UI-UX-REDESIGN-STANDARDS.md`
  - Add pricing-specific completion standard only if execution reveals a lasting rule worth preserving.

## Non-Goals

- Do not change payment provider integration.
- Do not change API provider URL.
- Do not add fake checkout routes.
- Do not add fake public prices unless the business has confirmed them.
- Do not import ProjectFlow CSS or copy its visual language.
- Do not change auth, database, Worker, or payment backend behavior.

---

### Task 1: Write Pricing Content Contract Tests

**Files:**
- Modify: `tests/site-artifact-contract.test.mjs`
- Modify: `tests/ui_ux_contract_test.py`

- [ ] **Step 1: Add English pricing structure assertions**

In `tests/site-artifact-contract.test.mjs`, add assertions that parse `pricing/index.html` and verify:

```js
assertIncludes(pricingHtml, 'Credits for image generation');
assertIncludes(pricingHtml, 'Free credits');
assertIncludes(pricingHtml, 'Credit packs');
assertIncludes(pricingHtml, 'Monthly credit plans');
assertIncludes(pricingHtml, 'Failed generations');
assertIncludes(pricingHtml, 'Open generator');
assertIncludes(pricingHtml, 'Join credit rollout');
```

- [ ] **Step 2: Add Chinese pricing structure assertions**

In the same test file, parse `zh/pricing/index.html` and verify:

```js
assertIncludes(zhPricingHtml, '图片生成额度');
assertIncludes(zhPricingHtml, '免费额度');
assertIncludes(zhPricingHtml, '额度包');
assertIncludes(zhPricingHtml, '月度额度计划');
assertIncludes(zhPricingHtml, '失败生成');
assertIncludes(zhPricingHtml, '打开生成器');
assertIncludes(zhPricingHtml, '加入额度内测');
```

- [ ] **Step 3: Add payment honesty assertions**

Add assertions that block unsupported fake checkout copy while rollout is private:

```js
assertDoesNotInclude(pricingHtml, 'Buy now');
assertDoesNotInclude(pricingHtml, 'Start paid checkout');
assertDoesNotInclude(zhPricingHtml, '立即付款');
assertDoesNotInclude(zhPricingHtml, '立即购买额度');
```

- [ ] **Step 4: Run tests and confirm failure before implementation**

Run:

```powershell
node tests/site-artifact-contract.test.mjs
py tests/ui_ux_contract_test.py -v
```

Expected:

- At least one pricing assertion fails before the page is updated.
- No unrelated syntax errors.

---

### Task 2: Rebuild English Pricing HTML Structure

**Files:**
- Modify: `pricing/index.html`

- [ ] **Step 1: Replace pricing hero copy**

The hero should use this content direction:

```html
<p class="pricing-label">Image credits</p>
<h1><span>Credits for image generation.</span></h1>
<p>Start with free credits, test the prompt direction, then move into credit packs or monthly credit plans when you need repeated output.</p>
```

- [ ] **Step 2: Keep two clear hero actions**

Use:

```html
<a class="pricing-primary-action" href="/generate/">Open generator</a>
<a class="pricing-secondary-action" href="#credit-rollout">Join credit rollout</a>
```

- [ ] **Step 3: Replace decision strip with three payment paths**

Use three entries:

```html
<strong>Free credits</strong>
<strong>Prompt catalog</strong>
<strong>Credit packs</strong>
```

Each entry must include one sentence explaining when to choose it.

- [ ] **Step 4: Replace plan cards with three cards**

Use:

```html
<article class="pricing-plan">
  <div class="pricing-plan-head">
    <span>Free</span>
    <strong>Explore</strong>
  </div>
  ...
</article>
```

Use the same structure for:

- Free / Explore
- Credits / Create
- Studio / Scale

Only `Credits / Create` gets `is-featured`.

- [ ] **Step 5: Add credit rules panel**

Add a new section after plan cards:

```html
<section class="pricing-credit-rules" aria-label="Credit rules">
  <div>
    <span>Failed generations</span>
    <strong>Reviewed before paid rollout rules are finalized.</strong>
    <p>During rollout, failed outputs are reviewed so the credit policy can stay fair before public checkout opens.</p>
  </div>
  ...
</section>
```

Include four rule blocks:

- Failed generations
- Credit validity
- Account history
- Refund and invoice

- [ ] **Step 6: Add FAQ section**

Add six FAQ items with payment-focused questions:

```html
<section class="pricing-faq" aria-label="Pricing questions">
```

Questions:

- Can I test image quality before paying?
- Does a failed generation consume credits?
- Do credits expire?
- What happens after payment opens?
- Can I get a refund or invoice?
- Why is credit purchase in private rollout?

No accordion JavaScript is required for this phase. Static FAQ is acceptable and more stable.

---

### Task 3: Rebuild Chinese Pricing HTML Structure

**Files:**
- Modify: `zh/pricing/index.html`

- [ ] **Step 1: Mirror the English structure**

Use the same section order and class names as `pricing/index.html`.

- [ ] **Step 2: Use clear Chinese payment copy**

Required phrases:

```html
图片生成额度
免费额度
额度包
月度额度计划
失败生成
打开生成器
加入额度内测
```

- [ ] **Step 3: Keep payment honesty**

Do not use:

```html
立即付款
立即购买额度
公开购买
```

unless real checkout is confirmed.

- [ ] **Step 4: Keep language and nav consistency**

Verify:

```html
<html lang="zh-CN">
```

and active pricing nav state remains on the Chinese pricing page.

---

### Task 4: Style The Pricing Page With PromptArc System

**Files:**
- Modify: `style.css`

- [ ] **Step 1: Scope all new styles**

Every new pricing style must start with:

```css
body[data-page="prompt-hub"][data-surface="pricing"]
```

- [ ] **Step 2: Set desktop layout**

Target desktop:

```css
.pricing-hero {
  display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(420px, 1.08fr);
  gap: 24px;
}

.pricing-plan-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}
```

- [ ] **Step 3: Add credit rules layout**

Use a compact 4-column desktop grid:

```css
.pricing-credit-rules {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
```

- [ ] **Step 4: Add FAQ layout**

Use a 2-column desktop grid:

```css
.pricing-faq-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
```

- [ ] **Step 5: Enforce product style details**

Pricing styles must meet:

- Card radius: 10px to 14px.
- No purple SaaS gradient.
- No decorative blobs.
- No glassmorphism as decoration.
- Primary action uses PromptArc green accent.
- Body text contrast meets WCAG AA target.
- Button height at least 40px desktop and 44px mobile where primary.

- [ ] **Step 6: Add responsive behavior**

At `max-width: 980px`:

```css
.pricing-hero,
.pricing-decision-strip,
.pricing-plan-grid,
.pricing-credit-rules,
.pricing-faq-grid {
  grid-template-columns: 1fr;
}
```

At `max-width: 620px`:

- Hero actions become one-column full-width.
- Plan card buttons become full-width.
- Proof board remains visible, but may reduce text.
- No horizontal overflow.

---

### Task 5: Run Automated Verification

**Files:**
- Test only

- [ ] **Step 1: Run pricing artifact contract**

Run:

```powershell
node tests/site-artifact-contract.test.mjs
```

Expected:

- Pass.

- [ ] **Step 2: Run UI/UX contract suite**

Run:

```powershell
py tests/ui_ux_contract_test.py -v
```

Expected:

- All tests pass.

- [ ] **Step 3: Run existing page-specific contracts**

Run:

```powershell
node tests/gallery_surface_contract.test.mjs
node tests/generate_fold_contract.test.mjs
node tests/global_nav_surface_contract.test.mjs
node tests/core_nav_consistency.test.mjs
```

Expected:

- All pass.

---

### Task 6: Visual QA Before Upload

**Files:**
- No code changes unless QA finds defects.

- [ ] **Step 1: Start local server**

Use the existing local static server method for this repo. If no server is running, use:

```powershell
py -m http.server 8787
```

- [ ] **Step 2: Desktop pricing QA**

Open:

```text
http://localhost:8787/pricing/
```

Check at `1440x900`:

- Navigation order is correct.
- Logo lockup is consistent.
- Language switch is visible.
- Hero and proof board fit in first viewport.
- Primary button is obvious.
- The featured plan is visually clear but not noisy.
- Credit rules are visible below the plan cards.
- No ProjectFlow purple template look.
- No horizontal overflow.

- [ ] **Step 3: Chinese desktop QA**

Open:

```text
http://localhost:8787/zh/pricing/
```

Check:

- Chinese text is not garbled.
- Button labels fit.
- Same layout rhythm as English.

- [ ] **Step 4: Mobile QA**

Check both pages at `390x844`:

- Nav does not overlap.
- Language switch remains reachable.
- Primary actions are visible and tappable.
- Cards stack cleanly.
- No text overflow.
- No horizontal scrolling.

- [ ] **Step 5: Accessibility spot-check**

Check:

- Keyboard tab order reaches hero actions, plan actions, and waitlist form.
- Focus ring is visible.
- Images have useful alt text.
- Form label is connected to input.

---

### Task 7: Deploy Only After QA Passes

**Files:**
- Deployment artifact only

- [ ] **Step 1: Confirm risk**

Risk level is medium only because deployment/CI/CD is involved. The code changes themselves are low-risk frontend changes.

- [ ] **Step 2: Deploy using the existing deployment script**

Use the existing deployment workflow already proven for this project. If R2 image sync is unrelated, keep it skipped:

```powershell
$env:SKIP_R2_SYNC='1'
.\AUTO-PUSH-AND-DEPLOY.ps1
```

- [ ] **Step 3: Verify live routes**

Run:

```powershell
$routes=@(
  'https://www.promptarc.cc/pricing/',
  'https://www.promptarc.cc/zh/pricing/'
)
foreach($r in $routes){
  $res=Invoke-WebRequest -Uri $r -UseBasicParsing -TimeoutSec 20
  Write-Output "$($res.StatusCode) $r"
}
```

Expected:

- `200` for both routes.

- [ ] **Step 4: Live visual smoke check**

Open live pages:

```text
https://www.promptarc.cc/pricing/
https://www.promptarc.cc/zh/pricing/
```

Check at desktop and mobile widths:

- New content is visible.
- New CSS loaded.
- No old cached layout.
- No obvious visual regression.

---

## Completion Standard

The pricing page is complete only when:

- English and Chinese pricing pages use the new payment decision structure.
- Automated tests pass.
- Desktop and mobile visual QA pass before upload.
- Live routes return `200`.
- Live pages show the new pricing content.
- No backend/payment/auth/API behavior was changed.
- No fake public checkout is introduced.

## Self-Review

- Spec coverage: The plan covers structure, content, visual system, tests, desktop QA, mobile QA, accessibility spot-check, and deployment.
- Placeholder scan: No `TBD`, `TODO`, or undefined implementation placeholders remain.
- Risk control: Payment provider, auth, database, API provider, and backend are explicitly excluded.
- Consistency: English and Chinese pages share section order and class names.
