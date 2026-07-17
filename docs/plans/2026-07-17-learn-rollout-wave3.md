# Learn Rollout Wave 3 Implementation Plan — Minor-Topic Single Chapters

> **For Claude:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Fresh implementer per task, task review after each, final whole-branch review.

**Goal:** Six minor topics become single-chapter courses on the synthesis template — distortion, midi, recording, digital-analogue, numeracy, leads-and-signals — each with a visible past-paper rationale line, on branch `learn-rollout-wave3`.

**Architecture:** Chapter data modules in `lib/learn/topics/`, Canvas diagram components in `components/learn/diagrams/`, one new preset family in `lib/learn/audio-presets.js`, one new interactive in `components/learn/interactives/`. Wiring one line per topic in `lib/learn/topics/index.js`. Single-lesson topics render in the picker's non-course mode; the final-card outro already works for any lesson with no successor (`app/learn/[topicId]/[lessonId]/page.js:33-47`). NEW structural element: `learnRationales` map + picker rendering (Task 1).

**Requirements source:** `docs/superpowers/specs/2026-07-17-learn-rollout-wave3-chapter-maps.md` (chapter maps, rationale lines, preset/interactive specs, reuse lists — exact values live THERE) + parent spec `2026-07-16-learn-uniform-rollout-design.md`.

**Tech stack:** Next.js 16 App Router static export, plain JS, Node test runner (`npm test`), Canvas 2D diagrams at 480×280 logical / 2× scale.

---

## Global constraints (every task, verbatim into every brief)

1. **⚠️ Working-tree hazard:** the checkout contains ANOTHER SESSION'S uncommitted work. NEVER `git add -A`, `git add .`, `git stash`, or `git checkout -- .`. Stage files ONLY by explicit path. Files you must never touch or stage: `app/[resourceId]/ResourcePageClient.js`, `app/[resourceId]/page.js`, `app/topic/[topicId]/page.js`, `lib/resources/index.js`, `lib/topics.js`, anything matching `*compression-press*` or `components/resources/CompressionPress.jsx` or `docs/signature-machine-pattern.md`. (Reading `lib/topics.js` and resource components is fine and expected — they are content sources.)
2. **Zero visual redesign.** Reuse existing components and their exact styles. New components copy the anatomy of the closest existing sibling (wave-1/2 files are the freshest exemplars).
3. **Learn DNA:** row descriptions ≤~70 words; depth goes into expansion entries, not longer paragraphs.
4. **Content sourcing:** row text is mined from IN-REPO sources — the topic's `specSummary` block in `lib/topics.js` and the resource components named per-topic in the spec addendum. Content you cannot trace to those sources must be listed under "flagged claims" in your report.
5. **Chapter self-containment:** no row, assessment, or exam anchor may reference another chapter by name or number. Exam anchors may only test vocabulary taught in that chapter's own rows. (Cross-links to OTHER COURSES' chapters go in expansions, phrased by course name — the spec addendum marks where.)
6. **Glyphs:** ▸ and ⇄ only. ▶ and ↔ are banned. UK English throughout (equalisation, synthesiser, artefact).
7. **ESM discipline:** relative imports in `lib/**` need explicit `.js` extensions (Node test runner requirement).
8. **Audio discipline** (read `lib/learn/audio-presets.js` builders first): single lazy AudioContext, master gain at 0.15 with 15 ms ramps, builders return EVERY node they create, stopper disconnects the gain in its teardown timeout, `ctl-*` presets return `{stop, set}` (shape-guarded by test).
9. **Diagram discipline** (read wave-1/2 exemplars in `components/learn/diagrams/` first): 480×280 logical at 2× scale, RAF + cancelAnimationFrame cleanup, inline labels + phase captions, existing palette only. Any marker/dot on a curve must be COMPUTED from the same function that draws the curve, never hardcoded. State your frame increment and keep it consistent. On node-link diagrams no line may cross a label: verify clearance algebraically (AABB vs segment) in your self-review. Invented illustrative values must be disclosed in your report and marked with a code comment.
10. **Numeracy values must be mentally tractable** (non-calculator paper). If a real-world number isn't, it belongs in an expansion with the arithmetic shown, not in a row.
11. **One preset per row** (`AudioBlock` takes a single preset). A/B comparisons = single presets on adjacent rows.
12. **Tests:** run `npm test` before commit; all suites green in EVERY commit (the expansions guard runs on the wired tree — land content + expansions + wiring within the same task; if you must split commits inside a task, use the dated `KNOWN_ORPHANS` bridge pattern from wave 2). No new lint warnings in files you created.
13. **Commit messages** end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

## Task 1 — Rationale mechanism + guard extensions (structural)

**Files:** Modify `lib/learn/topics/index.js` (add `learnRationales` map — empty for now — and `getLearnRationale(topicId)` export), `app/learn/[topicId]/LearnPickerClient.js` (accept and render rationale), `app/learn/[topicId]/page.js` (pass rationale), `tests/learn-courses.test.mjs`.

1. `getLearnRationale(topicId)` returns the string or null.
2. Picker: when `!isCourse` and a rationale exists, the header's intro `<p>` renders the rationale INSTEAD of the generic "Choose a lesson…" sentence. Same element, same styles, no new visual elements. Course topics unaffected.
3. `learn-courses.test.mjs`: (a) exam-anchor guard now iterates ALL topics in `learnTopics` (remove the multi-chapter restriction); (b) new assertion — every topic whose lessons array has length 1 must have a `learnRationales` entry of 8–20 words. Both pass vacuously on the current tree (no single-chapter topics yet).

**Verify:** `npm test` green; `npm run build` green. **Commit:** `feat(learn): rationale line mechanism + single-chapter guard extensions`.

## Task 2 — Distortion audio preset + DriveSlider

**Files:** Modify `lib/learn/audio-presets.js`; create `components/learn/interactives/DriveSlider.js`; register key `drive` in `components/learn/interactives/index.js`; extend `tests/audio-presets.test.mjs`.

Per the spec addendum's "Audio & interactives" section, exactly: `dist-drive` fixed preset + `ctl-drive` controllable (WaveShaper soft-clip, drive 0–10 clamped, curve documented in-file). DriveSlider copies `DelayTimeSlider.js` anatomy byte-faithfully; readout zones exactly as the addendum's table (em-dash signature). Preset test: clamp behaviour, curve monotonicity on [0,1], stopper teardown.

**Verify:** `npm test` green. **Commit:** `feat(learn): distortion drive preset + one-knob DriveSlider`.

## Tasks 3–8 — One task per topic (content + diagrams + wiring)

Order: **T3 distortion, T4 midi, T5 recording, T6 digital-analogue, T7 numeracy, T8 leads-and-signals.**

Each task, uniformly:

**Files:** Create `lib/learn/topics/<topic>.js`; create the NEW diagram components listed for that topic in the spec addendum (`components/learn/diagrams/`), register them in `components/learn/diagrams/index.js`; add the topic's expansion entries in `lib/learn/expansions.js`; wire the topic in `lib/learn/topics/index.js` (import + `learnTopics` entry + `learnRationales` entry, rationale text verbatim from the addendum's table).

1. Chapter data exactly per the addendum's map: chapter id/title/subtitle/description, rows (ids, teaching content mined from the named sources, ≤70 words), `animation` ids (NEW ones you create + REUSED ones exactly as named), `audio`/`interactive` placements only where the map says, `assessment` per row where the map's row teaches a testable fact (follow wave-2 row conventions), chapter `examAnchor` per the map, `outroResourceId` per the map.
2. New diagrams follow constraint 9; reused diagrams are referenced by registry id, NOT copied or modified.
3. Expansion triggers appear verbatim in row text; `npm test` green at commit (constraint 12).
4. Report lists flagged claims (content beyond the named sources) and invented illustrative values.

**Verify:** `npm test` green; `npm run build` green; dev-server page `/learn/<topic>` + chapter page render (dev server on :3000). **Commit:** `feat(learn): <topic> single-chapter course`.

## Task 9 — Final whole-branch review + gates + handoff (controller)

Final code review (most capable model) with review package over the whole branch; verify-house-build Gate 1 (`--audience=alevel`) on all 12 new pages (6 pickers + 6 chapters) + spot-check 2 topic pages; Gate 2 independent Playwright DOM checks (DriveSlider readout zones, BitDepthSlider reuse on digital-analogue, one completion/outro flow per 2–3 topics, rationale lines visible on all 6 pickers, exam anchors); handoff doc `docs/2026-07-17-learn-rollout-wave3-HANDOFF.md`.
