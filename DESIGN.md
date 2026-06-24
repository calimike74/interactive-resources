---
name: Music Tech Studio — Interactive Resources
description: Botanical Press — warm earthen colour, editorial type, the quiet confidence of something thought about longer than a sprint.
colors:
  field: "#3A4A35"
  field-deep: "#2D3A2A"
  field-soft: "#5F7058"
  sienna: "#B85A3F"
  sienna-deep: "#95421F"
  mustard: "#C99F44"
  mustard-deep: "#9B7530"
  cream-bg: "#F2EBE0"
  paper: "#F8F2E8"
  ink: "#1F2A1C"
  muted: "#6B6F5C"
  line: "#D4C9B4"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(3rem, 1.5rem + 4vw, 4rem)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "2rem"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "-0.005em"
  title:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "1.375rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "normal"
  lede:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "1.1875rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "Geist, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(1rem, 0.98rem + 0.2vw, 1.0625rem)"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  caption:
    fontFamily: "Geist, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  label:
    fontFamily: "Geist, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.14em"
  mono:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontWeight: 400
    letterSpacing: "normal"
rounded:
  compact: "12px"
  card: "16px"
  code: "8px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
  4xl: "96px"
components:
  button-primary:
    backgroundColor: "{colors.field}"
    textColor: "{colors.cream-bg}"
    rounded: "{rounded.pill}"
    padding: "0.8rem 1.4rem"
  button-primary-hover:
    backgroundColor: "{colors.field-deep}"
    textColor: "{colors.cream-bg}"
    rounded: "{rounded.pill}"
    padding: "0.8rem 1.4rem"
  button-secondary:
    backgroundColor: "{colors.sienna}"
    textColor: "{colors.cream-bg}"
    rounded: "{rounded.pill}"
    padding: "0.8rem 1.4rem"
  button-ghost:
    backgroundColor: "{colors.cream-bg}"
    textColor: "{colors.field}"
    rounded: "{rounded.pill}"
    padding: "0.8rem 1.4rem"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "24px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.compact}"
    padding: "12px 14px"
  badge:
    backgroundColor: "{colors.mustard}"
    textColor: "{colors.field}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
---

# Design System: Music Tech Studio — Interactive Resources

## 1. Overview

**Creative North Star: "The Independent Press"**

This is what a serious independent textbook publisher would look like if it had a software studio. Warm earthen colour, editorial typography in a real serif, and the quiet confidence of something that has been thought about for longer than a sprint. It is a learning instrument first: a student should trust it the way they trust a well-made tool, and a teacher should recognise the care a good textbook carries. Stillness is allowed. The page does not shout; it states its position and lets the reader work.

The surface is never flat and never cold. A warm cream ground (`#F2EBE0`) carries a faint paper noise and two off-page radial washes — mustard from the top-left, moss from the bottom-right — so the page feels lit from somewhere, without ever resorting to a glow or a gradient on a component. Depth is paper-on-paper: a hairline warm line and a soft, low-opacity shadow, the way one card sits on another, never a UI element floating above a synthwave horizon.

This system explicitly rejects two things its audience sees too much of. It is **not generic AI-template / neobrutalist** work — no harsh borders, clashing brights, sticker drop-shadows, or default training-data fonts; no punchy, playful, deliberately anti-aesthetic styling. And it is **not childish edtech** — no cartoon mascots, primary-colour blocks, or gamified-badge clutter. The register is credibly A-Level, not primary-school, and credibly editorial, not SaaS.

**Key Characteristics:**
- Warm cream ground, layered (noise + radial washes), never flat or pure-white or plain-dark.
- One accent per surface, drawn from a strict three-tier hierarchy.
- Editorial serif display (Fraunces) over a clean sans body (Geist).
- Paper-on-paper depth: a 1px warm line plus a faint layered shadow, never a floating drop shadow.
- Motion that focuses in rather than flicks on, and that always honours reduced-motion.

## 2. Colors

A three-accent system on a warm cream background, where colour is rationed and hierarchical rather than decorative.

### Primary
- **Field Moss** (`#3A4A35`): the brand itself. Headings, primary CTAs, navigation, links, primary statistics. When in doubt, default to Field. Deepens to **Field Deep** (`#2D3A2A`) on hover; **Field Soft** (`#5F7058`) carries supporting text and quiet hovers.

### Secondary
- **Burnt Sienna** (`#B85A3F`): the data. Anything a reader should remember as a number — key statistics, important figures, secondary CTAs, emphasis — sits in sienna. Deepens to **Sienna Deep** (`#95421F`) on hover.

### Tertiary
- **Mustard Ochre** (`#C99F44`): the texture. Adds warmth without claiming attention — badges, tags, gentle highlights, "in progress" indicators. Never used for errors. Deepens to **Mustard Deep** (`#9B7530`) on hover.

### Neutral
- **Cream Ground** (`#F2EBE0`): the page background.
- **Paper** (`#F8F2E8`): elevated surfaces — cards, dialogs, raised panels and inputs.
- **Ink** (`#1F2A1C`): a deep-forest near-black for body text and headlines.
- **Muted** (`#6B6F5C`): captions, metadata, supporting copy.
- **Line** (`#D4C9B4`): borders, dividers, table rules — a warm hairline, never a heavy stroke.

### Named Rules

**The One Accent Rule.** A surface uses exactly one accent. A button is Field, OR Sienna, OR Mustard — never a gradient between them. Gradients are reserved for genuine atmospheric backgrounds (large hero washes), never for components.

**The Hierarchy-Never-Reverses Rule.** Field is the brand, Sienna is the data, Mustard is the texture. The tiers do not swap roles: a key number is never mustard, a tag is never field.

## 3. Typography

**Display Font:** Fraunces (with Georgia, serif fallback)
**Body Font:** Geist (with system-ui, sans-serif fallback)
**Label/Mono Font:** Geist Mono (with ui-monospace fallback)

**Character:** A variable serif with soft-axis warmth set against a clean, modern sans. Fraunces does the work of "this is a serious publication"; used in italic it becomes the editorial voice, in roman it feels printed and considered. Geist keeps the running text quiet and legible. The pairing reads as a textbook that respects its reader.

### Hierarchy
- **Display** (Fraunces 400, `clamp(3rem, 4vw, 4rem)` ≈ 48–64px, line-height 1.05): hero and page titles; one italic word allowed for emphasis.
- **Headline** (Fraunces 400, 2rem/32px, line-height 1.15): major section titles.
- **Title** (Fraunces 500 italic, 1.375rem/22px): card and subsection titles.
- **Lede** (Fraunces italic 400, 1.1875rem/19px): standfirst / intro paragraphs beneath a headline.
- **Body** (Geist 400, 16–17px, line-height 1.6): running text. Aim for a 65–75ch measure.
- **Caption** (Geist 500, 0.8125rem/13px): metadata, helper text, micro-trends.
- **Label / Eyebrow** (Geist 600, 0.6875rem/11px, uppercase, 0.14em tracking): section markers, field labels, table headers.

### Named Rules

**The Fraunces-Carries-It Rule.** Headings are always Fraunces; body is always Geist. Strong is Geist 600 — never 700 black, which is too heavy against the cream.

**The Mono-Is-For-Numbers Rule.** Geist Mono is reserved for data readouts (Hz, ms, BPM), keyboard shortcuts, and numerical positions. Never for headlines or body, and used sparingly.

## 4. Elevation

Depth is paper-on-paper, not Material elevation. A surface lifts off the page through a hairline warm **line** (`#D4C9B4`) and a soft, very-low-opacity shadow that reads as one sheet resting on another — never a hard, dark, floating drop shadow. Atmosphere comes from two fixed off-page radial washes (mustard top-left ~10%, moss bottom-right ~8%) plus a faint noise overlay, so the page feels lit without any glow on a component.

### Shadow Vocabulary
- **Light** (`box-shadow: 0 1px 0 rgba(43,36,24,0.06), 0 8px 24px -16px rgba(43,36,24,0.18)`): default raised surface — hovers, popovers, small panels.
- **Card** (`box-shadow: 0 1px 0 rgba(43,36,24,0.04), 0 18px 40px -24px rgba(43,36,24,0.22)`): the standard content card, paper-on-paper.

### Named Rules

**The Paper-On-Paper Rule.** Depth is a faint contact line plus a soft ambient spread, both at very low opacity. If a shadow looks dark, it is wrong. Never Material elevation-tier shadows, never glow-coloured shadows, and never any drop shadow under a button.

## 5. Components

For each component: a short character line, then shape, colour, states, and motion behaviour.

### Buttons
Tactile and confident, never floating.
- **Shape:** full pill (`999px`).
- **Padding:** `0.8rem 1.4rem`.
- **Primary:** Field background, cream text, no border. **Secondary:** Sienna background, cream text. **Ghost/Tertiary:** transparent background, Field text, 1px Field border.
- **Hover:** deepen the accent (`field-deep` / `sienna-deep`) and lift `translateY(-1px)`. **Press:** `scale(0.97)` on the fast duration — a firm press, not a collapse.
- **Never:** drop shadows on buttons; gradient buttons.

### Cards / Containers
- **Corner Style:** `16px` (compact cards `12px`); inner content radius scales concentrically.
- **Background:** Paper (`#F8F2E8`) on the cream ground.
- **Border:** a single 1px Line (`#D4C9B4`), not a heavy stroke.
- **Shadow Strategy:** the **Card** shadow from Elevation — paper-on-paper, never floating.
- **Optional top stripe:** 3px solid accent (Field / Sienna / Mustard) for category coding.
- **Internal Padding:** 22–28px. Generous.

### Inputs / Fields
- **Style:** Paper background (a slight lift from the page), 1px Line border, `12px` radius.
- **Focus:** border thickens to 1px Field plus a 3px Field-at-18% box-shadow ring.
- **Placeholder:** muted, italic Fraunces.

### Chips / Badges
- **Style:** pill, a subtle tinted background (mustard at 10–18%, or moss at 10%), text in the deepened accent. No border for tag chips; a 1px Line only for "filter" chips.

### Navigation
- **Style:** Field text on cream; active state in solid Field. Eyebrow-style labels where space is tight. On mobile, a bottom tab bar (the app ships to iOS via Capacitor) — touch targets ≥44px.

### Motion (applies across components)
- **Entrances focus in:** opacity 0→1, a 6px upward rise, and a 2px blur that clears, ~280–320ms on the smooth easing curve. Never a plain fade, never a flick-on.
- **Reveal height** with `grid-template-rows: 0fr → 1fr`, never a `max-height` hack.
- **Press** registers on every interactive element (`scale(0.97)`, fast duration).
- Easing uses the house token set (see `.impeccable/design.json`); the browser defaults `ease` / `ease-in-out` and the Material curve are forbidden.

### Signature: the category band card
A Paper card with a 3px top stripe in its topic accent (Field / Sienna / Mustard), opening a panel of criterion blocks beneath — the recurring shape for topic, feedback, and coursework surfaces.

## 6. Do's and Don'ts

### Do:
- **Do** default to Field, and use exactly one accent per surface (Field > Sienna > Mustard) — never a gradient between accents.
- **Do** keep the background a warm cream (`#F2EBE0`), layered with subtle noise and two off-page radial washes — never flat, never pure-white, never plain-dark.
- **Do** set display type in Fraunces and body in Geist; reserve Geist Mono for data readouts (Hz, ms, BPM).
- **Do** convey depth with a 1px warm Line (`#D4C9B4`) plus a faint layered shadow (paper-on-paper).
- **Do** make entrances focus in (opacity + 6px rise + 2px blur clear, ~300ms on `--ease-smooth`) and give every interactive element a press (`scale(0.97)`).
- **Do** animate expand/collapse with `grid-template-rows: 0fr → 1fr`.
- **Do** honour `prefers-reduced-motion` (already enforced) and favour `transform`/`opacity` on long lists and large surfaces.

### Don't:
- **Don't** use the browser default `ease` / `ease-in-out`, or the Material curve `cubic-bezier(0.4, 0, 0.2, 1)` — use the house easing tokens. The default curve is the clearest "an LLM built this" tell.
- **Don't** put a drop shadow under a button, use Material elevation-tier shadows, or glow-coloured shadows.
- **Don't** use indigo, purple, or violet anywhere; no indigo→purple gradients; no gradient text on headings.
- **Don't** use glassmorphism (frosted, blurred overlays) **in the product UI** (`learn` / `revise` / `exam` / `topic` / `teacher`). Glass is permitted only on brand-register marketing/home surfaces (e.g. the landing hero).
- **Don't** use plain-dark backgrounds (`#0a0a14`, pure `#000`) or flat single-colour surfaces.
- **Don't** use left-border colour stripes as decoration, or italicised serif "highlight" words mid-sentence (the Fraunces-highlight tell).
- **Don't** put Lucide icons on visible surfaces (nav, CTAs, hero) — use Phosphor or hand-drawn there; keep Lucide for invisible utility/admin only.
- **Don't** ship the **generic AI-template / neobrutalism** look (harsh borders, clashing brights, sticker shadows, default fonts) or **childish edtech** (cartoon mascots, primary-colour blocks, gamified-badge clutter).
- **Don't** write asyndetic tricolon CTAs ("Fast. Simple. Powerful.") or stock CTA verbs ("Get started", "Learn more", "Discover").
