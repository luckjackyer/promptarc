# PromptArc Workflow Rules

Last updated: 2026-05-22

## Core Rule

Before every meaningful website change, we must first research current best-in-class comparable sites, summarize what works, and only then implement.

Every substantial change must also follow the gated plan in [CHANGE-PLAN-QUALITY-GATE.md](C:/Users/Administrator/Documents/AI网站90天/CHANGE-PLAN-QUALITY-GATE.md): define one modification item, implement only that item, run its self-check, fix issues, mark it passed, then continue to the next item.

This is now a required step for:

- new pages
- feature changes
- UI changes
- content changes
- SEO changes
- monetization changes
- gallery, prompt, and lead magnet changes

## Mandatory Pre-Change Research

Before editing code or content, we must do all of the following:

1. Search for at least 3 relevant comparable sites or pages.
2. Review how they handle:
   - value proposition and hero copy
   - navigation and page structure
   - feature modules
   - UI layout and card patterns
   - content blocks and trust signals
   - SEO structure, titles, internal linking, and landing-page patterns
   - conversion points such as email capture, paid products, and affiliate placement
3. Review at least 2 examples of pages that appear built for search traffic or repeat user engagement.
4. Record findings in [COMPETITOR-OBSERVATION.md](C:/Users/Administrator/Documents/AI网站90天/COMPETITOR-OBSERVATION.md) before implementation when the change is substantial.
5. Then implement a PromptArc-specific version, not a verbatim clone.

## Required Research Summary Format

For each substantial change, add a dated note to [COMPETITOR-OBSERVATION.md](C:/Users/Administrator/Documents/AI网站90天/COMPETITOR-OBSERVATION.md) covering:

- change target
- sites reviewed
- best patterns worth adapting
- weak patterns to avoid
- content patterns likely to attract traffic
- conversion patterns worth testing
- what PromptArc will implement differently

## What We Should Actively Learn From

- strong landing-page structure
- search-first or browse-first navigation
- filters, tags, card layouts, and detail-page patterns
- how prompt galleries present examples and copy actions
- how tool pages reduce friction and clarify the first action
- content formats that target real search intent
- internal linking structures that expand topical authority
- monetization placements that do not damage trust
- mobile UX and page speed patterns

## What “Imitate” Means In Practice

We are explicitly allowed to:

- borrow structural patterns
- borrow interaction patterns
- borrow page architecture
- borrow content formats and topic angles
- borrow proven layout ideas
- borrow conversion placements
- borrow SEO page models

We must transform them into PromptArc’s own version by changing:

- copy
- visual treatment
- page composition
- examples
- use-case framing
- positioning
- ordering and prioritization

## Copyright And Safety Boundary

We must not:

- copy text verbatim from competitors unless it is a very short fair-use reference
- copy competitor images or illustrations without rights
- copy proprietary code from live sites
- mirror full articles, galleries, or data collections
- create misleading lookalike branding

We may:

- paraphrase and reframe ideas
- recreate common UI patterns from scratch
- use the same feature model if we implement it ourselves
- use the same content format with our own examples and wording

## Traffic And Content Rule

When making content changes, we must prefer:

- pages built around clear search intent
- examples with practical reuse value
- titles and sections that match how users actually search
- content that helps users act, not just browse
- pages that can rank, convert, and support internal linking at the same time

We should avoid:

- thin generic AI content
- purely decorative article pages
- pages with no clear keyword intent
- copy that sounds auto-generated or interchangeable

## Change Approval Rule For Ourselves

Before implementing, we should be able to answer:

- Which 3+ comparable pages did we study?
- What exactly worked on them?
- Which parts are we adapting?
- How is PromptArc’s version better, more focused, or safer?

If we cannot answer those questions, the research step is incomplete.

## Prompt And Image Production Rule

For gallery growth, do not add prompts directly to the public site first. Use the content pipeline:

- Add new ideas to `content-pipeline/prompt-candidates.json`.
- Generate 3-4 image candidates for each prompt.
- Score the best candidate with `content-pipeline/review-rubric.json`.
- Run `node scripts/audit-content-pipeline.mjs` before publishing.
- Publish only if the selected image reaches the quality threshold, passes IP safety, and is not repetitive.

The public gallery should contain curated prompt-image pairs, not every generated result.
