# Learn Rollout Wave 1 — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Convert the three legacy Learn lessons (EQ, dynamics, delay) into full multi-chapter courses using the synthesis course template.

**Architecture:** Pure content + registry work on the existing course system (`lib/learn/*`, `components/learn/*`). No page/route changes — the course map, Continue button, completion tracking and outros activate automatically when a topic's lessons array has >1 entry. New audio presets and one-knob interactives follow the patterns established by the synthesis flagship.

**Tech Stack:** Next.js 16 static export, React 19, Web Audio API, Canvas 2D, Node built-in test runner (`npm test` → `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test 'tests/**/*.test.mjs'`).

**Spec:** `docs/superpowers/specs/2026-07-16-learn-uniform-rollout-design.md` — chapter maps, row assignments, and sources are normative there; this plan adds file-level mechanics.

---

## Global constraints (every task, verbatim into every brief)

1. **⚠️ Working-tree hazard:** the checkout contains ANOTHER SESSION'S uncommitted work. NEVER `git add -A`, `git add .`, `git stash`, or `git checkout -- .`. Stage files ONLY by explicit path. Files you must never touch or stage: `app/[resourceId]/ResourcePageClient.js`, `app/[resourceId]/page.js`, `app/topic/[topicId]/page.js`, `lib/resources/index.js`, `lib/topics.js`, anything matching `*compression-press*` or `components/resources/CompressionPress.jsx` or `docs/signature-machine-pattern.md`.
2. **Zero visual redesign.** Reuse existing components and their exact styles. New components copy the anatomy of the closest synthesis-flagship sibling.
3. **Learn DNA:** row descriptions ≤~70 words; depth goes into expansion entries, not longer paragraphs.
4. **Existing legacy rows move verbatim** (heading, description, animation, assessment) unless the task brief states a source-justified correction.
5. **Glyphs:** ▸ and ⇄ only. ▶ and ↔ are banned (A-level register; enforced by verify-house-build).
6. **ESM discipline:** relative imports in `lib/**` need explicit `.js` extensions (Node test runner requirement).
7. **Audio discipline** (from `lib/learn/audio-presets.js` — read the existing builders first): single lazy AudioContext, master gain at 0.15 with 15 ms ramps, builders return EVERY node they create, stopper disconnects the gain in its teardown timeout.
8. **Content sourcing:** new row text is mined from the topic's reference (`/Users/mikelehnert/Obsidian/_sandbox/<topic>-reference/src/content/learn.tsx` and `teach.ts`). Content you cannot trace to the reference or the legacy lesson must be listed under "flagged claims" in your report. The vault file pattern "1.3 (4) ... BAD.md" class of sources is banned.
9. **Numeracy values must be mentally tractable** (non-calculator paper): 60,000 ÷ BPM families like 120 BPM → 500 ms; dB examples like 12 dB above threshold at 3:1.
10. **Tests:** run `npm test` before commit; all suites green. Run `npx next lint --file <changed files>` equivalent via `npm run lint` if quick; at minimum ensure no new warnings in files you created.
11. **Commit messages** end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

## Task 1 — Audio presets for EQ, dynamics, delay

**Files:** Modify `lib/learn/audio-presets.js`; Modify `tests/audio-presets.test.mjs`.

New static presets (each a builder following the house pattern):
- `eq-tone-flat` — harmonically rich tone (saw osc ~110 Hz through a gentle lowpass) with no EQ, the A/B baseline.
- `eq-low-shelf-boost`, `eq-presence-boost`, `eq-highpass` — same tone through one `BiquadFilterNode` each (`lowshelf` +9 dB @ 200 Hz; `peaking` +9 dB @ 3 kHz Q 1.2; `highpass` @ 300 Hz).
- `comp-drums-raw` — generated two-bar loop at 100 BPM: sine-drop kick (150→50 Hz pitch env) on beats, noise-burst snare (bandpass ~1.8 kHz, 80 ms decay) on 2 and 4, scheduled with a lookahead interval timer that the stopper clears.
- `comp-drums-squashed` — same loop through `DynamicsCompressorNode` (threshold −35 dB, ratio 12:1, attack 0.003, release 0.25) + makeup gain ×2 — audibly pumped.
- `delay-single` — plucked tone (triangle osc, fast decay envelope) into `DelayNode` 0.35 s, feedback gain 0 (one repeat, wet 0.5).
- `delay-pingpong` — same pluck into two cross-fed `DelayNode`s (0.3 s) panned hard L/R via `StereoPannerNode`s, feedback 0.45.

New controllable presets (return `{ stop, set }`):
- `ctl-eq-sweep` — rich tone through a `peaking` filter (+10 dB, Q 1.5); `set({ frequency })` ramps `filter.frequency` (60 Hz–12 kHz).
- `ctl-threshold` — the drum loop through a compressor; `set({ threshold })` sets `compressor.threshold.value` (0 to −60 dB) with makeup compensation `gain = 1 + (−threshold)/60`.
- `ctl-delay-time` — repeating pluck (every 1.6 s) with one delay; `set({ time })` sets `delay.delayTime` via ramp (0.015–0.45 s), feedback fixed 0.35.
- `ctl-feedback` — same pluck; delay fixed 0.32 s; `set({ feedback })` clamps 0–0.85 on the feedback gain.

**Steps:** (1) Read the existing file top-to-bottom; (2) write failing tests: every new preset id exists in the registry, every `ctl-*` preset in the WHOLE file returns both `stop` and `set` functions (mock/OfflineAudioContext pattern already used by the existing tests — follow it), clamp behaviour for `ctl-feedback`; (3) run tests, confirm RED for the new ids; (4) implement; (5) `npm test` green; (6) commit `feat(learn): audio presets for EQ, dynamics and delay courses`.

Closes flagship follow-up: the ctl-shape test now guards ALL controllable presets including the synthesis five.

## Task 2 — One-knob interactive components

**Files:** Create `components/learn/interactives/EQSweepKnob.js`, `ThresholdSlider.js`, `DelayTimeSlider.js`, `FeedbackDial.js`; Modify `components/learn/interactives/index.js`.

Each copies the anatomy of the closest sibling — `CutoffSlider` for the two sliders, `ResonanceKnob`/`LFODepthDial` for the two knobs: same container/border/typography styles, press-and-hold pill button (`onPointerDown/Up/Leave/Cancel`, `touchAction: 'none'`, keyboard toggle, ▸/■ glyphs), readout with `⇄` where a range is described.

- `EQSweepKnob` — `ctl-eq-sweep`; log-scale knob 60 Hz–12 kHz; readout shows Hz/kHz + zone word (mud / boxy / honk / presence / air).
- `ThresholdSlider` — `ctl-threshold`; 0 → −60 dB; readout "barely touching ⇄ squashed".
- `DelayTimeSlider` — `ctl-delay-time`; 15–450 ms; readout shows ms + perception word (thickens / slapback / echo) at the taught boundaries (~30 ms, ~120 ms).
- `FeedbackDial` — `ctl-feedback`; 0–85%; readout "one repeat ⇄ long tail".

Registry keys: `eq-sweep`, `threshold`, `delay-time`, `feedback`. aria-labels on every input and button. Verify in browser via dev server (`npm run dev:clean` if Turbopack cache errors) — the components aren't wired to any page yet, so a scratch check with a temporary render or unit-level lint/build check suffices; full DOM verification happens in Tasks 5/8/11. Commit `feat(learn): one-knob interactives for EQ, dynamics and delay`.

## Task 3 — EQ course content

**Files:** Rewrite `lib/learn/topics/eq.js` (export `EQ_CHAPTERS`, keep no `EQ_TOPIC`); Modify `lib/learn/expansions.js`.

Follow the spec's EQ chapter map exactly (4 chapters: `spectrum`, `filters`, `graphic-parametric`, `eq-at-work`). Structure and field names copy `lib/learn/topics/synthesis.js` (read it first — chapters carry `id`, `title`, `subtitle`, `description`, `rows`, `examAnchor`; the last chapter carries `outroResourceId: 'eq8-image-explorer'`). Legacy rows move verbatim per the spec's (existing) markers, keeping `animation` and `assessment` untouched. New rows: 2–3 in `spectrum`, 3–4 in `filters`, 1–2 in `eq-at-work`, each with `animation` id (Task 4 will build these — use descriptive kebab ids and list them in your report), sourced from `_sandbox/eq-reference/src/content/learn.tsx` + `teach.ts`. Wire `audio` onto rows where a preset teaches the point (`eq-low-shelf-boost` etc.) and `interactive: 'eq-sweep'` in `eq-at-work`. Four exam anchors per spec. Add expansion entries for new terms (triggers verbatim in row text; check no orphans — the expansions test enforces). Subtitle stays "Topic 1.11 — Component 4". `npm test` green (learn-courses guard will fail until Task 5 wires the course — if so, note it and ensure the failure is ONLY the wiring; coordinate: run the topic-file syntax through `node -e "import('./lib/learn/topics/eq.js').then(m=>console.log(m.EQ_CHAPTERS.length))"`). Commit `feat(learn): EQ 4-chapter course content`.

## Task 4 — EQ diagrams

**Files:** Create `components/learn/diagrams/` Canvas components for every new `animation` id from Task 3's report; Modify `components/learn/diagrams/index.js`; Modify `tests/diagram-registry.test.mjs` expectations if it counts entries.

House Canvas convention (read two flagship diagrams first, e.g. `HarmonicSeries` and `LfoBasics`): 480×280 logical at 2× scale, RAF loop with `cancelAnimationFrame` cleanup, inline labels + phase captions, site palette only. Likely set: spectrum-ranges strip (named zones), filter response shapes (HP/LP with slope, shelf), sweep-and-cut technique, EQ-at-work before/after curve. Labels must not be crossed by lines (verify with getBBox-style bounds where applicable). `npm test` green. Commit `feat(learn): EQ course diagrams`.

## Task 5 — Wire EQ course + redirect + verify

**Files:** Modify `lib/learn/topics/index.js` (`eq: EQ_CHAPTERS` — import updates, `.js` extension); Modify `vercel.json` (redirect `/learn/eq/eq` → `/learn/eq`, permanent).

Steps: wire; `npm test` green (exam-anchor guard now covers EQ); `npm run build` completes (static export — confirm `/learn/eq/spectrum` etc. in output); dev-server DOM check with the verify-house-build skill's playwright-core: course map shows 4 chapters + Continue; open `spectrum` chapter, drag the EQ sweep knob → readout changes; scroll to bottom → outro card links `filters`; localStorage `learn-progress:eq` written. Report evidence (DOM deltas, not screenshots). Commit `feat(learn): wire EQ course, redirect legacy lesson URL`.

## Task 6 — Dynamics course content

**Files:** Create `lib/learn/topics/dynamics.js` (export `DYNAMICS_CHAPTERS`); Delete `lib/learn/topics/compression.js`; Modify `lib/learn/expansions.js`.

Spec chapter map (4 chapters: `dynamic-range`, `compressor-controls`, `attack-release`, `dynamics-family`). Legacy rows from `compression.js` move verbatim per spec. New rows sourced from `_sandbox/compression-reference/src/content/learn.tsx` + `teach.ts` — including the transfer-curve row ("The graph the exam asks you to draw") in `compressor-controls`. Audio wiring: `comp-drums-raw`/`comp-drums-squashed` A/B rows in `dynamic-range` or `attack-release`; `interactive: 'threshold'` in `compressor-controls`. `outroResourceId: 'compressor-image-explorer'` on the final chapter. Exam anchor for `compressor-controls` uses a mentally tractable gain-reduction calc. Note: `lib/learn/topics/index.js` still imports `compression.js` at this point — update ONLY the import path/name in `index.js` if tests require the module to resolve, but do NOT change the `dynamics:` mapping to the new chapters array yet (that is Task 8); keep `dynamics: [/* old single-lesson shape */]`… if that proves awkward, wire fully and say so in your report — the reviewer treats early wiring as acceptable if tests and build are green. Commit `feat(learn): dynamics 4-chapter course content`.

## Task 7 — Dynamics diagrams

Same conventions as Task 4. Likely set: dynamic-range gap visual, precise transfer-curve graph (input/output axes, threshold knee, ratio slope — geometrically accurate, this one is exam-drawable), pumping envelope, limiter/gate/expander family panel, side-chain trigger/target routing. Register all; `npm test` green. Commit `feat(learn): dynamics course diagrams`.

## Task 8 — Wire dynamics course + redirect + verify

As Task 5 for dynamics: `lib/learn/topics/index.js` maps `dynamics: DYNAMICS_CHAPTERS`; `vercel.json` redirect `/learn/dynamics/compression` → `/learn/dynamics`; tests, build, Playwright DOM checks (threshold slider drives readout; completion flow). Commit `feat(learn): wire dynamics course, redirect legacy lesson URL`.

## Task 9 — Delay course content

**Files:** Rewrite `lib/learn/topics/delay.js` (export `DELAY_CHAPTERS`); Modify `lib/learn/expansions.js`.

Spec chapter map (4 chapters: `delay-line`, `feedback-types`, `timed-delay`, `stereo-adt`). All 8 legacy rows survive per spec. New rows: tape-echo character (from "Tape: why old repeats get darker") in `feedback-types`; 1–2 numeracy rows in `timed-delay` (60,000 ÷ BPM anchor table values: 60/90/120/150 BPM families, dotted ×0.75, triplet ×⅔ — tractable only). Audio wiring: `delay-single` on `delay-line`, `delay-pingpong` on `stereo-adt`; `interactive: 'delay-time'` in `delay-line`, `'feedback'` in `feedback-types`. Final outro: no obvious flagship resource — omit `outroResourceId` so the final card uses the topic Explore anchor (confirm `ChapterOutro` handles the absent-resource path; it does for synthesis-style final links — if not, report BLOCKED rather than inventing UI). Exam anchors per spec. Commit `feat(learn): delay 4-chapter course content`.

## Task 10 — Delay diagrams

Same conventions. Likely set: tape darkening (repeats losing highs), BPM→ms anchor visual, any new-row needs from Task 9's report. `npm test` green. Commit `feat(learn): delay course diagrams`.

## Task 11 — Wire delay course + redirect + verify

As Task 5: `delay: DELAY_CHAPTERS`; redirect `/learn/delay/delay` → `/learn/delay`; tests, build, Playwright DOM checks (delay-time slider readout crosses perception boundaries; feedback dial; completion flow). Commit `feat(learn): wire delay course, redirect legacy lesson URL`.

## Task 12 — Final whole-branch review

Dispatch on the most capable model with the review package for `main..HEAD`. Reviewer checks: spec compliance against BOTH spec docs, template uniformity across the three courses (identical anatomy, register, glyphs), sourcing flags collated, Minor-findings triage from the ledger.

## Task 13 — verify-house-build (controller runs this, not a subagent)

Gate 1 `checks.mjs --audience=alevel` on: 3 course maps + all 12 chapters + `/topic/eq`, `/topic/dynamics`, `/topic/delay`. Gate 2 checklist incl. independent Playwright control checks (one interactive per topic, one full completion→course-map flow), curriculum spot-checks, numeracy tractability. Gate 3 report + wave-1 handoff doc (`docs/2026-07-16-learn-rollout-wave1-HANDOFF.md`): flagged claims for Mike, audio ear-check list, deploy decision = Mike's.
