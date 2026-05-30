# PromptArc Product Work Plan

## Goal

PromptArc's next phase should prioritize fixing live conversion and UX trust problems before expanding generator, account, and membership infrastructure.

The current site already has real user paths live. Several of those paths now misalign button promise, user intent, and actual outcome. That makes UX repair the highest-priority product work, ahead of new membership layers.

## Current Product Direction

PromptArc should evolve in this order:

1. Fix live UX and funnel mismatches.
2. Strengthen the generator-first journey.
3. Make gallery actions real and reusable.
4. Improve lead capture quality and funnel measurement.
5. Then expand history, account, quota, and membership systems.

## Priority Rules

- P0: Anything that causes live intent mismatch, trust loss, or conversion pollution.
- P1: Anything that shortens the main generation path or removes dead-end interactions.
- P2: Anything that improves post-submit flow quality, control clarity, or analytics quality.
- P3: Backend and membership expansion that depends on a cleaner front-end funnel.

## Verified Live UX Findings

These issues were verified on the production site, not only in local code:

- Pricing waitlist submission currently behaves like sample download flow.
- Shared email-gate logic treats different user intents as the same action.
- Gallery "Saved only" exists without any visible save action.
- Gallery "Remix" opens preview/copy flow instead of a real generator handoff.
- Free-pack page has weaker post-submit continuation than image-prompt-pack.
- Gallery "Sort" and "Shuffle" overlap on the same random outcome.
- Homepage and generator entry still split attention instead of dominating around "generate now."

## Rewritten Work Plan

### P0. Repair Live Conversion Mismatches

#### 1. Split email capture flows by user intent

Problem:

- All `[data-email-gate]` forms currently share one success path.
- The default behavior assumes submit success means "start a download."

Required changes:

- Replace one generic email-gate behavior with explicit action types.
- Add a clear front-end action contract such as:
  - `data-email-action="download-sample"`
  - `data-email-action="join-credit-waitlist"`
  - `data-email-action="join-catalog-list"`
  - `data-email-action="reveal-next-step"`
- Route submit success behavior by action instead of by one shared fallback.
- Ensure each action has its own feedback copy and optional next-step block.

Success outcome:

- Different buttons stop collapsing into one behavior bucket.
- Funnel data becomes interpretable again.
- Users receive the result they thought they were asking for.

#### 2. Remove sample-download behavior from pricing waitlist

Problem:

- Pricing waitlist currently promises early access but triggers sample-download messaging.
- This damages trust and pollutes the credit waitlist.

Required changes:

- Remove sample-download configuration from the pricing waitlist form in both English and Chinese.
- Reclassify pricing waitlist as a waitlist-only action.
- Add a dedicated success state instead of keeping the form unchanged with a generic feedback line.
- Success state should clearly confirm:
  - the email was received
  - this is a credit launch waitlist
  - what the user will hear about
  - what they can do now

Recommended success actions:

- Primary next step: start free generation
- Secondary next step: learn how credits will work

Success outcome:

- The pricing page starts behaving like a pricing page instead of a disguised lead magnet page.

#### 3. Split success copy by task type

Problem:

- The current generic success copy is accurate for sample download only.
- It is misleading for waitlist and reveal-only flows.

Required changes:

- Create separate success copy groups for:
  - sample download started
  - waitlist joined
  - next step unlocked
  - catalog list joined
- Keep English and Chinese versions aligned.

Success outcome:

- Success messages reinforce trust instead of causing confusion.

### P1. Fix Dead-End UI And Restore Main User Tasks

#### 4. Make gallery saving a real feature

Problem:

- "Saved only" is visible, but no visible save action exists on gallery cards.

Required changes:

- Add a visible save button to each gallery card.
- Reuse the existing saved prompt state logic instead of introducing a new storage system.
- Add clear active/inactive button states:
  - `Save`
  - `Saved`
- Ensure unsaving while "Saved only" is active immediately removes the card from the filtered view.

Success outcome:

- Saved-only becomes a working user workflow instead of a fake control.

#### 5. Turn Remix into a truthful action

Problem:

- "Remix" currently promises "do something with this prompt" but actually opens preview/copy behavior.

Required changes:

- Choose one of these two directions and apply it consistently:

Option A:

- Rename card CTA to preview-oriented wording.
- Keep preview modal behavior but stop implying direct generation.

Option B:

- Make the main card CTA send the prompt into `/generate/`.
- Pre-fill prompt, category, and ratio when possible.
- Keep preview as a secondary action.

Recommended direction:

- Use Option B.
- Reserve "Remix" or "Use in generator" for a real generator handoff.
- Move preview into a secondary action or image click.

Success outcome:

- Gallery becomes a generator feeder, not only a content browser.

#### 6. Upgrade the preview modal from passive viewer to next-step hub

Problem:

- The modal is currently a content preview layer with weak continuation.

Required changes:

- Add action buttons for:
  - use in generator
  - copy prompt
  - save
  - next/previous prompt
- Ensure at least one CTA moves the user deeper into the generation workflow.

Success outcome:

- Modal interactions stop ending in copy-only behavior.

#### 7. Make homepage hero dominate around generation

Problem:

- Homepage now includes a generator, but the first-screen experience still competes with multiple alternative paths.

Required changes:

- Keep the hero's primary CTA focused on generation.
- Demote Gallery, History, Prompt Builder, and similar links to secondary positions.
- Keep support links visible, but not equal in emphasis to "Generate image."
- Treat gallery discovery as assistive, not co-equal.

Success outcome:

- New users understand the site's main task within seconds: generate first.

### P2. Improve Post-Submit Continuation And Interaction Clarity

#### 8. Bring free-pack up to the same continuation standard as image-prompt-pack

Problem:

- Free-pack is a short download page with weak post-submit continuation.
- Image-prompt-pack has a better post-submit reveal pattern.

Required changes:

- Add a success-target section to free-pack.
- Reveal a structured next step after submission:
  - compare sample vs full catalog
  - join credit early access
  - start free generation
  - visit the full pack page

Success outcome:

- Free-pack becomes a useful funnel step instead of a one-and-done exit page.

#### 9. Add stronger pricing-page post-submit state

Problem:

- Pricing currently talks about credits, but the post-submit experience does not feel like a credit product flow.

Required changes:

- Add a dedicated waitlist confirmation block with:
  - what happens next
  - what launch access may include
  - where to go now
- Optionally hide or collapse the original form after success.
- Add an "edit email" or "use another email" affordance if practical.

Success outcome:

- Users feel progress and clarity after signup.

#### 10. Remove sort/random control overlap

Problem:

- Sort and Shuffle both reach random mode.

Required changes:

- Keep `Sort` for deterministic ordering only, such as latest/oldest.
- Keep `Shuffle` for random reordering only.
- Update labels so the distinction is obvious.

Success outcome:

- Gallery controls become easier to learn and trust.

### P2. Rebuild Measurement Around User Intent

#### 11. Split funnel analytics by actual user task

Problem:

- Mixed flows currently contaminate conversion data.

Required changes:

- Add distinct events for:
  - credit waitlist submit
  - sample download start
  - catalog sample submit
  - gallery save
  - gallery saved-only toggle
  - gallery generator handoff click
  - gallery preview open
  - homepage generation start
- Attach key metadata:
  - page
  - CTA label
  - CTA type
  - prompt id
  - language
  - intent

Success outcome:

- Product decisions can be based on real intent, not mixed buckets.

### P3. Generator, History, Account, And Membership Expansion

These remain important, but they should come after the live UX funnel is made coherent.

#### 12. Anonymous history workspace

Status:

- Already in progress.

Keep:

- Generate without login.
- Revisit recent results in the same browser.
- Download, copy prompt, copy parameters, remix, delete.

#### 13. Durable D1 generation records

Value:

- Makes history durable.
- Enables quotas, billing, moderation, and analytics consistency.

#### 14. Quotas before payment

Value:

- Prevents cost spikes.
- Makes free vs paid behavior understandable.

Recommended beta guardrails:

- Anonymous: 3-5 images/day or 8/hour.
- Logged-in free: higher daily limit.
- Paid: monthly quota plus optional credit packs.

#### 15. Lightweight login

Preferred first version:

- Email magic link or Google login.

#### 16. Member dashboard

Keep it narrow:

- history
- quota remaining
- download
- remix/use again
- delete
- billing link
- gallery submission

#### 17. Public gallery review queue

Rule:

- Generated user output should not auto-publish into the SEO gallery.

## New Recommended Build Order

1. Rebuild email capture into intent-based actions.
2. Fix pricing waitlist so it no longer behaves like sample download.
3. Split success copy and success-state blocks by flow type.
4. Add working gallery save buttons and validate saved-only flow.
5. Turn gallery remix into real generator handoff.
6. Upgrade preview modal CTAs.
7. Tighten homepage around generate-first behavior.
8. Add free-pack success continuation.
9. Add pricing-page waitlist confirmation state.
10. Remove sort/shuffle overlap.
11. Add intent-based analytics events.
12. Continue D1/history/quota/account/membership work after the front-end funnel is coherent.

## What Not To Prioritize First

Do not prioritize these ahead of P0/P1 funnel repair:

- advanced member dashboard expansion
- billing UI polish
- deep account features
- public submission workflows
- broader SEO/gallery additions

Reason:

- If the main funnel is still misleading or dead-ended, new infrastructure will amplify a broken journey instead of improving it.

## Definition Of Done For This Phase

This phase is complete only when:

- waitlist forms no longer behave like download forms
- each email CTA maps to one clear user intent
- gallery saved-only is a real working flow
- gallery remix leads to a truthful next action
- homepage clearly prioritizes generation
- free-pack and pricing pages have clear post-submit continuation
- analytics distinguish between waitlist, download, preview, save, and generate actions
