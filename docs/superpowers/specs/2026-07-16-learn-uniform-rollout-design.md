# Learn Uniform Rollout — Design Spec

**Date:** 2026-07-16
**Status:** Approved by Mike (design presented and approved in session; shape chosen: two-tier)
**Parent spec:** `2026-07-15-learn-area-synthesis-flagship-design.md` — the synthesis course is the canonical template. Everything in the parent spec's hard constraints applies here unchanged.

## Goal

Roll the synthesis course template out to every curriculum topic so the Learn door is uniform site-wide: same course map, same chapter anatomy, same outros. Effort weighted by exam marks (Mike's core-vs-minor ruling, 2026-07-10).

## Hard constraints (inherited, restated)

1. **Zero visual redesign.** Every colour, font, and component stays as committed. Structure and content only.
2. **Learn DNA preserved.** Short visual rows (≤~70 words visible), depth folds open via expansion terms, never walls of text.
3. **Verified sources only.** Chapter content is mined from the C4 Definitive References (`_sandbox/<topic>-reference/src/content/learn.tsx` + `teach.ts`) and the existing legacy lessons. Content not traceable to a source gets flagged in the wave handoff for Mike's spot-check, exactly as the flagship did.
4. **One knob = law.** Inline interactives isolate one parameter. Multi-control sandboxes stay in Explore.
5. **Existing rows are assets.** Legacy lesson rows (headings, descriptions, animations, assessments) move into chapters **verbatim unless a correction is source-justified**. Their existing diagram components are reused, not rebuilt.

## The two tiers

**CORE — full multi-chapter courses** (synthesis ✅ done): EQ, dynamics, delay, reverb, sampling.

**MINOR — single-chapter courses, same template**: distortion, MIDI & sequencing, recording, digital/analogue, numeracy, leads & signals. Each opens with a visible rationale line (register: honest, exam-smart): *"Our past-paper analysis shows this topic comes up briefly — so we cover it briefly, and point you at exactly what earns the marks."* Wording per-topic, 10–18 words where possible.

**No Learn course:** General Skills (nothing conceptual to first-teach; its materials live in Revise/Explore).

**Flag:** recording is the minor most likely to deserve future promotion to a full course; blocked on a verified source existing. Note in handoff, do not build speculatively.

## Waves

- **Wave 1 (this spec's build scope):** convert the three legacy lessons to full courses — EQ, dynamics, delay.
- **Wave 2:** new courses for reverb + sampling, mined from their references.
- **Wave 3:** minor-tier single chapters.

Each wave: own branch, subagent-driven execution with per-task reviews, verify-house-build gates, Mike reviews between waves. Within a wave, no check-ins.

## Chapter anatomy (the template, per chapter)

Identical to synthesis: `id`, `title`, `subtitle` (spec row reference), `description`, 3–5 rows (`heading`, `description`, `animation`, optional `audio`, optional `interactive`, `assessment`), chapter-level `examAnchor { question, modelPoints, examTip }` (guard test enforces presence on every chapter of a multi-chapter course), and outro handled by the existing course system (`ChapterOutro`: next-chapter card, or final card with "Now go play" → topic Explore anchor / flagship resource + "Prove it" → Revise anchor).

## Wave-1 chapter maps

Row ids marked **(existing)** move verbatim from the legacy lesson (keeping their `animation` and `assessment`). Rows marked **(new)** are authored from the named reference sections.

### EQ course — `lib/learn/topics/eq.js` → `EQ_CHAPTERS` (4 chapters)

Reference: `_sandbox/eq-reference/` — sections: *The spectrum / Filters / Parametric EQ / Graphic EQ / EQ at work*.

1. **`spectrum` — The Frequency Spectrum.** what-eq-solves (existing) + new rows from "The spectrum: every sound is a stack": named ranges (sub-bass → air) and what lives where; boost vs cut philosophy. Exam anchor: identify the frequency range for a described problem.
2. **`filters` — Filters.** All new, from "Filters: the shapes that take away": high-pass/low-pass, shelving, slope (dB/octave), practical filter uses. This closes the legacy lesson's biggest spec gap (1.11 covers filter types; the old lesson had none). Exam anchor: choose and justify a filter type.
3. **`graphic-parametric` — Graphic vs Parametric.** graphic-eq, frequency-bands, parametric-eq, comparison (all existing). Exam anchor: compare the two for a given scenario.
4. **`eq-at-work` — Q & EQ Decisions.** q-factor, routing (existing) + new from "EQ at work: fixing, shaping, matching": sweep-and-cut technique, mix-context decisions. Exam anchor: describe an EQ fix with parameter values. Final outro → Explore (`eq8-image-explorer` as "Now go play" resource).

### Dynamics course — `lib/learn/topics/compression.js` → `DYNAMICS_CHAPTERS` (4 chapters)

Reference: `_sandbox/compression-reference/` — sections: *Why engineers squeeze / The graph the exam asks you to draw / Attack and release / Limiter, expander, gate / The side-chain*.

1. **`dynamic-range` — Dynamic Range.** what-compression-solves (existing) + new from "Why engineers squeeze": what dynamic range is, dB gap, why control beats volume-riding. Exam anchor: define dynamic range / why compress.
2. **`compressor-controls` — The Compressor's Controls.** threshold-ratio, knee, makeup-gain (existing) + new row from "The graph the exam asks you to draw": reading/drawing the transfer curve (input-vs-output graph). Transfer-curve diagram must be geometrically precise (house rule). Exam anchor: gain-reduction calculation from threshold + ratio (mentally tractable values only).
3. **`attack-release` — Attack, Release & Punch.** attack-release, before-after (existing) + new: pumping as an audible artefact/creative effect. Exam anchor: explain a punch-loss scenario via attack.
4. **`dynamics-family` — Limiters, Gates & the Side-chain.** All new, from "Limiter, expander, gate" + "The side-chain": limiter as ∞:1, gate/expander for noise, side-chain trigger/target (ducking). Exam anchor: pick the right dynamics processor for a scenario. Final outro → Explore (`compressor-image-explorer`).

### Delay course — `lib/learn/topics/delay.js` → `DELAY_CHAPTERS` (4 chapters)

Reference: `_sandbox/delay-reference/` — sections: *The delay line / Feedback / Timed delay / Tape / Stereo delay / ADT*.

1. **`delay-line` — The Delay Line.** what-delay-does, delay-time (existing). Exam anchor: perception ranges (fusing / slap / distinct echo).
2. **`feedback-types` — Feedback, Slapback & Tape.** feedback-repeats, slapback (existing) + new from "Tape: why old repeats get darker": tape echo character, each repeat darker/degraded. Exam anchor: parameter recipe for slapback.
3. **`timed-delay` — Timed Delay & the Maths.** timed-delay (existing) + new numeracy rows: 60,000 ÷ BPM anchors, dotted/triplet multipliers — non-calculator-tractable values only (120 BPM → 500 ms family). Exam anchor: dotted-eighth calculation.
4. **`stereo-adt` — Stereo Delay & ADT.** ping-pong, delay-pan-eq, adt (existing). Exam anchor: describe ping-pong routing / ADT recipe. Final outro → Explore (topic Explore anchor).

## Audio & interactives (wave 1)

New presets in `lib/learn/audio-presets.js`, following the established discipline (single lazy context, master gain, 15 ms ramps, all nodes returned + torn down, conservative 0.15 level):

- **EQ:** `eq-sweep` family on a harmonically rich generated tone; `ctl-eq-sweep` (peaking-filter frequency controllable). Interactive: **EQSweepKnob** — one knob, sweep a boost across the spectrum to hear mud/honk/presence/air.
- **Dynamics:** generated drum-ish pattern (sine kick + noise-burst snare) through `DynamicsCompressorNode`; `ctl-threshold`. Interactive: **ThresholdSlider** — hear compression grab as threshold drops. Presets for pumping demo.
- **Delay:** plucked tone through `DelayNode` + feedback gain; `ctl-feedback` and `ctl-delay-time`. Interactives: **DelayTimeSlider** (15 ms → 450 ms: thickening → slapback → echo, teaching the perception ranges) and **FeedbackDial** (one repeat → decaying chain). Ping-pong preset via cross-panned dual delays.

One interactive per concept, placed in the chapter that teaches that parameter. Glyphs: ▸/⇄ only (▶/↔ banned).

## Routing, redirects, expansions, tests

- Course wiring in `lib/learn/topics/index.js` (`eq: EQ_CHAPTERS`, etc.). The course map, Continue button, completion and outros all activate automatically (`isCourse = lessons.length > 1`).
- Old lesson URLs redirect in `vercel.json` (deploy-time, static export has no runtime redirects): `/learn/eq/eq` → `/learn/eq`, `/learn/dynamics/compression` → `/learn/dynamics`, `/learn/delay/delay` → `/learn/delay` (course maps — old single lessons don't map 1:1 to any one chapter).
- `learnResources` picker links (interface explorers, video overview) stay untouched.
- Expansions: new entries per topic in `lib/learn/expansions.js`; triggers must appear verbatim in row text; no orphaned triggers (test-guarded).
- Existing tests must stay green; `learn-courses.test.mjs` exam-anchor guard now covers three more multi-chapter courses automatically. Add preset-shape coverage for new `ctl-*` presets (flagship follow-up, cheap to include here).

## Non-goals (wave 1)

No Explore/Revise changes, no visual redesign, no SRS wiring, no reverb/sampling/minor topics (waves 2–3), no changes to synthesis, no new question banks (delay's missing bank stays a parked Mike decision).

## Verification

Per-task reviews + final whole-branch review + verify-house-build (audience=alevel) on: all three course maps, all 12 chapters, spot-check topic pages. Playwright DOM-delta checks for one interactive per topic + completion flow. Handoff doc lists claims not verbatim-traceable to sources, for Mike's spot-check, plus his audio ear-check list.
