# Learn Rollout Wave 2 Implementation Plan — Reverb + Sampling Courses

> **For Claude:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Fresh implementer per task, task review after each, final whole-branch review.

**Goal:** Build two brand-new Learn courses — reverb (5 chapters / 15 rows) and sampling (5 chapters / 16 rows) — on the synthesis course template, plus the automated expansions guard test, on branch `learn-rollout-wave2`.

**Architecture:** Chapter data modules in `lib/learn/topics/`, Canvas diagram components in `components/learn/diagrams/`, Web Audio presets in `lib/learn/audio-presets.js`, one-knob interactives in `components/learn/interactives/`. Wiring one line per topic in `lib/learn/topics/index.js` activates course map/Continue/completion automatically. No legacy lessons exist for either topic: all rows are new, no redirects, no `learnResources` changes.

**Requirements source:** `docs/superpowers/specs/2026-07-17-learn-rollout-wave2-chapter-maps.md` (chapter maps, preset specs, interactive specs — exact values live THERE) + parent spec `2026-07-16-learn-uniform-rollout-design.md`.

**Tech stack:** Next.js 16 App Router static export, plain JS, Node test runner (`npm test`), Canvas 2D diagrams at 480×280 logical / 2× scale.

---

## Global constraints (every task, verbatim into every brief)

1. **⚠️ Working-tree hazard:** the checkout contains ANOTHER SESSION'S uncommitted work. NEVER `git add -A`, `git add .`, `git stash`, or `git checkout -- .`. Stage files ONLY by explicit path. Files you must never touch or stage: `app/[resourceId]/ResourcePageClient.js`, `app/[resourceId]/page.js`, `app/topic/[topicId]/page.js`, `lib/resources/index.js`, `lib/topics.js`, anything matching `*compression-press*` or `components/resources/CompressionPress.jsx` or `docs/signature-machine-pattern.md`.
2. **Zero visual redesign.** Reuse existing components and their exact styles. New components copy the anatomy of the closest existing sibling (wave-1 files are the freshest exemplars).
3. **Learn DNA:** row descriptions ≤~70 words; depth goes into expansion entries, not longer paragraphs.
4. **Content sourcing:** row text is mined from the topic's reference (`/Users/mikelehnert/Obsidian/_sandbox/<topic>-reference/src/content/learn.tsx` and `teach.ts`). Content you cannot trace to the reference must be listed under "flagged claims" in your report.
5. **Chapter self-containment:** no row, assessment, or exam anchor may reference another chapter by name or number ("as we saw in Chapter 1" is banned). Exam anchors may only test vocabulary taught in that chapter's own rows.
6. **Glyphs:** ▸ and ⇄ only. ▶ and ↔ are banned. UK English throughout (equalisation, synthesiser, artefact).
7. **ESM discipline:** relative imports in `lib/**` need explicit `.js` extensions (Node test runner requirement).
8. **Audio discipline** (read `lib/learn/audio-presets.js` builders first): single lazy AudioContext, master gain at 0.15 with 15 ms ramps, builders return EVERY node they create, stopper disconnects the gain in its teardown timeout, `ctl-*` presets return `{stop, set}` (shape-guarded by test).
9. **Diagram discipline** (read wave-1 exemplars in `components/learn/diagrams/` first): 480×280 logical at 2× scale, RAF + cancelAnimationFrame cleanup, inline labels + phase captions, existing palette only. Any marker/dot on a curve must be COMPUTED from the same function that draws the curve, never hardcoded. State your frame increment and keep it consistent. On node-link diagrams no line may cross a label: verify clearance algebraically (AABB vs segment) in your self-review. Invented illustrative values must be disclosed in your report and marked with a code comment.
10. **Numeracy values must be mentally tractable** (non-calculator paper). If a real-world number isn't (44,100 × 16 × 2 ÷ 8), it belongs in an expansion with the arithmetic shown, not in a row.
11. **Tests:** run `npm test` before commit; all suites green. No new lint warnings in files you created.
12. **Commit messages** end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

## Task 1 — Expansions orphan/collision guard test

**Files:** Create `tests/expansions.test.mjs`.

Automate the manual sweep every wave-1 content task ran. Import `lib/learn/expansions.js` and `lib/learn/topics/index.js` (use `getLearnTopicIds()`/`getLearnLessons()`):

1. **Orphan guard:** every expansion trigger must appear verbatim (case-insensitive) in at least one wired row's visible text (heading + description) OR chapter description. If genuinely pre-existing orphans surface, allowlist them in an explicit `KNOWN_ORPHANS` array with a dated comment — the test must pass on the current tree, and the allowlist must not grow silently (assert its exact contents).
2. **Collision guard:** expansion matching is longest-substring; assert no trigger is a strict substring of another trigger in a way that makes the shorter one unreachable from every row where both match (flag pairs where the shorter trigger never wins anywhere).
3. Test runs under `npm test` glob (`tests/**/*.test.mjs`), no new dependencies.

**Verify:** `npm test` green (13 suites incl. this one). **Commit:** `test: expansions orphan/collision guard`.

## Task 2 — Reverb audio presets

**Files:** Modify `lib/learn/audio-presets.js`; extend `tests/audio-presets.test.mjs` if preset-list assertions need the new names.

Per the spec addendum's "Audio presets (wave 2) — Reverb" section, exactly: `verb-dry`, `verb-room`, `verb-hall`, `verb-predelay`, `ctl-reverb-mix`, `ctl-reverb-decay`. Synthetic IR: noise × 10^(−3t/RT60) envelope (−60 dB at RT60 by definition), mono buffer, ConvolverNode `normalize` default. Source = repeating percussive tick via the established lookahead interval-timer pattern (see `comp-drums-*`), cleared by the stopper. `ctl-reverb-mix` = equal-power crossfade; `ctl-reverb-decay` regenerates the IR on `set({decay})`. Descriptions ≤ 25 words each, matching existing register.

**Verify:** `npm test` green (ctl shape guard picks up the two new ctl presets automatically). **Commit:** `feat(learn): reverb audio presets — convolution IR, mix and decay controls`.

## Task 3 — Reverb interactives

**Files:** Create `components/learn/interactives/ReverbMixSlider.js`, `components/learn/interactives/ReverbDecaySlider.js`; register keys `reverb-mix`, `reverb-decay` in `components/learn/interactives/index.js`.

Copy the anatomy of `DelayTimeSlider.js`/`ThresholdSlider.js` (hold-to-hear button, ctl preset lifecycle, readout span). Ranges/readouts per the spec addendum's interactives table — readout zone boundaries exactly as specified there. Aria-labels state parameter and range (match wave-1 phrasing pattern).

**Verify:** `npm test`; manual dev-server smoke on any page is NOT required (chapters don't exist yet) — a component-level render is enough if a harness exists, else lint + review. **Commit:** `feat(learn): reverb mix + decay one-knob interactives`.

## Task 4 — Reverb course content

**Files:** Create `lib/learn/topics/reverb.js` exporting `REVERB_CHAPTERS`; extend `lib/learn/expansions.js` with reverb entries. Do NOT touch `lib/learn/topics/index.js` (wiring is Task 7).

Implement the five chapters exactly per the spec addendum's reverb chapter map: ids, row ids, animation ids, audio/interactive placements, exam-anchor content, subtitles (`Topics 1.12 & 2.1 — Component 4` for ch1–2, `Topic 1.12 — Component 4` for ch3–5), final chapter `outroResourceId: 'reverb-image-explorer'`. Row anatomy matches `lib/learn/topics/delay.js` (freshest exemplar): heading, description ≤~70 words, animation, optional audio/interactive, assessment (3 options, 1 correct, teaching feedback on every option). Exam anchors: `{question, modelPoints, examTip}` with mark-scheme-traceable model points (the reference's `staff.mark` blocks are the source). Expansion entries for at least: EMT 140, impulse response, comb filter, allpass filter, standing waves, RT60-varies-with-frequency — triggers verbatim in row text.

**Verify:** `npm test` green (expansions guard now enforces trigger reachability once wired — run the guard's logic mentally against your rows; the automated check lands at Task 7). **Commit:** `feat(learn): reverb course content — 5 chapters, 15 rows, expansions`.

## Task 5 — Reverb diagrams A (chapters 1–2)

**Files:** Create in `components/learn/diagrams/`: `ClapTimeline.js`, `PreDelayGap.js`, `DistanceRdRatio.js`, `Rt60DecayCurve.js`, `DampingDarkensTail.js`, `AbsorbVsDiffuse.js`; register ids `clap-timeline`, `pre-delay-gap`, `distance-rd-ratio`, `rt60-decay-curve`, `damping-darkens-tail`, `absorb-vs-diffuse` in `components/learn/diagrams/index.js`.

Content per the spec addendum rows. Geometry that must be exact: `Rt60DecayCurve` draws exponential decay in dB space (a straight line on a dB axis) and its −60 dB marker must land at the labelled RT60 — compute the marker from the decay function. `DistanceRdRatio`: direct level falls 6 dB per doubling of distance; reverberant level holds — the crossover must emerge from those two rules, not be sketched.

**Verify:** `npm test`; visual smoke via any temporary harness is optional — reviewer recomputes geometry. **Commit:** `feat(learn): reverb diagrams — arrivals, RT60, damping, diffusion`.

## Task 6 — Reverb diagrams B (chapters 3–5)

**Files:** Create `TransductionChain.js`, `SpringReverbMechanism.js`, `PlateReverbMechanism.js`, `CombAllpassNetwork.js`, `ImpulseResponseFingerprint.js`, `ParameterBridge.js`, `SendVsInsertRouting.js`, `PrePostFaderTap.js`, `ReverbFadeAutomation.js`; register ids per the spec addendum.

Node-link diagrams here (`comb-allpass-network`, `parameter-bridge`, `send-vs-insert-routing`, `pre-post-fader-tap`, `transduction-chain`): the label-clearance law applies — no signal line may cross a label; verify algebraically. `ReverbFadeAutomation`: dry line falls to silence across the bars, wet line constant — two lines, unmistakable legend-by-inline-label. `ParameterBridge`: five acoustic measurements paired to five knobs; straight non-crossing pairings.

**Verify:** `npm test`. **Commit:** `feat(learn): reverb diagrams — mechanical, digital, routing`.

## Task 7 — Wire reverb course

**Files:** Modify `lib/learn/topics/index.js` only: import `REVERB_CHAPTERS`, add `reverb: REVERB_CHAPTERS` to `learnTopics`.

**Verify:** `npm test` green — this activates the exam-anchor guard, diagram-registry guard, and expansions guard for reverb; `npm run build` succeeds and `out/learn/reverb.html` + all five chapter pages exist in the export. Dev-server spot check `/learn/reverb` renders the course map with 5 chapters. **Commit:** `feat(learn): wire reverb course`.

## Task 8 — Sampling audio presets

**Files:** Modify `lib/learn/audio-presets.js`; extend preset tests if name-list assertions exist.

Per the spec addendum's "Sampling" preset section, exactly: `smp-loop-click`/`smp-loop-clean` (buffer length non-integer vs integer multiple of the tone period — the click IS the phase step), `smp-forward`/`smp-reversed` (same decaying buffer reversed in place), `smp-full-depth`/`smp-crushed` (WaveShaper staircase, identity vs ~4-bit), `ctl-bit-depth` (`set({bits})` 2→16 regenerating `round(x·L)/L`, `L = 2^(bits−1)`), `ctl-repitch` (looped melodic pluck buffer, `set({semitones})` −12→+12 via `playbackRate = 2^(st/12)`). All buffers generated deterministically sample-by-sample — no offline render, no external assets.

**Verify:** `npm test` green (ctl shape guard covers the two new ctl presets). **Commit:** `feat(learn): sampling audio presets — loop click, reverse, bit depth, repitch`.

## Task 9 — Sampling interactives

**Files:** Create `components/learn/interactives/BitDepthSlider.js`, `components/learn/interactives/RepitchSlider.js`; register keys `bit-depth`, `repitch`.

Anatomy copies the wave-1 sliders. Ranges/readouts per the spec addendum table: BitDepthSlider 16→2 bits (integer steps; note the slider runs high→low so "down" degrades); RepitchSlider −12→+12 semitones with 0 = "root — as recorded" and signed readout ("+7 st — faster and higher"). Aria-labels per wave-1 pattern.

**Verify:** `npm test`; lint clean. **Commit:** `feat(learn): bit-depth + repitch one-knob interactives`.

## Task 10 — Sampling course content

**Files:** Create `lib/learn/topics/sampling.js` exporting `SAMPLING_CHAPTERS`; extend `lib/learn/expansions.js` with sampling entries. Do NOT touch `lib/learn/topics/index.js` (wiring is Task 13).

Implement the five chapters exactly per the spec addendum's sampling chapter map (ch1 has 4 rows; subtitles `Topic 1.4 — Component 4`; final chapter `outroResourceId: 'sampling-playground'`). Mark-scheme fidelity matters most here — the anchors quote real papers (2018 AS Q1(a), 2019 AS/A Q4(d), 2022 AS Q3(b), 2022 A Q4(c), 2020 A Q1(a)); keep model points to what those schemes credit. Expansion entries for at least: clearance/copyright, file-size arithmetic (with the ÷8 working shown), the Digidesign zero-crossing story, the assignment-settings list, Amen break, warp modes, velocity layering precision.

**Verify:** `npm test` green. **Commit:** `feat(learn): sampling course content — 5 chapters, 16 rows, expansions`.

## Task 11 — Sampling diagrams A (chapters 1–2)

**Files:** Create `SamplerRecordStoreTrigger.js`, `SamplerLineage.js`, `WhySampleDrums.js`, `PlaybackModes.js`, `SampleRateGrid.js`, `AliasingFoldback.js`, `BitDepthStaircase.js`; register ids per the spec addendum.

Geometry that must be exact: `SampleRateGrid` — sample points sit ON the drawn waveform (computed from the same function); `AliasingFoldback` — a source above Nyquist and its alias must be mirror images around the Nyquist line (alias frequency = rate − source frequency; use tractable values, e.g. rate 40 kHz shown as grid, source 30 kHz → alias 10 kHz, disclosed as illustrative); `BitDepthStaircase` — staircase levels = 2^bits for a small bits value (e.g. 3 bits → 8 levels, count them). `PlaybackModes` — three key-press timelines (one-shot / gated / loop) sharing one time axis.

**Verify:** `npm test`. **Commit:** `feat(learn): sampling diagrams — sampler, lineage, rate and depth`.

## Task 12 — Sampling diagrams B (chapters 3–5)

**Files:** Create `ZeroCrossingCut.js`, `TruncateAndFade.js`, `LoopPointJoin.js`, `RootNoteMap.js`, `SpeedPitchLink.js`, `KeyZonesVelocityLayers.js`, `PitchTimeMatrix.js`, `ReverseEnvelope.js`, `ChopResequence.js`; register ids per the spec addendum.

Geometry that must be exact: `ZeroCrossingCut` — the "bad cut" marker sits at a visibly non-zero sample of the drawn wave, the "good cut" at a computed zero crossing of the same function; `LoopPointJoin` — the step at the bad join is the actual value difference of the drawn waveform; `ReverseEnvelope` — the reversed envelope is the same curve mirrored, computed not redrawn; `PitchTimeMatrix` — 2×2 grid (what changes / what holds) for repitch, stretch, shift; `RootNoteMap` — keyboard strip with root marked and per-key speed arrows, no line crossing a label.

**Verify:** `npm test`. **Commit:** `feat(learn): sampling diagrams — editing, mapping, transforms`.

## Task 13 — Wire sampling course

**Files:** Modify `lib/learn/topics/index.js` only: import `SAMPLING_CHAPTERS`, add `sampling: SAMPLING_CHAPTERS`.

**Verify:** `npm test` green (all guards now cover sampling); `npm run build` — `out/learn/sampling.html` + five chapter pages exist; dev-server spot check `/learn/sampling`. **Commit:** `feat(learn): wire sampling course`.

## Task 14 — Verification, final review, handoff

Controller-run (not a subagent implementer): verify-house-build Gate 1 (`--audience=alevel`) on both course maps + 10 chapters + `/topic/reverb` + `/topic/sampling`; Gate 2 independent Playwright DOM-delta script (four interactives drive readouts, completion flow on both courses, exam anchors in SSR, final outros); adjudicate WARNs. Then final whole-branch review (most capable model) with review package from merge-base, one fix subagent for any findings list, re-verify. Then `docs/2026-07-17-learn-rollout-wave2-HANDOFF.md`: what shipped, verification report, flagged-claims list per course (chapter maps themselves lead the list — Mike hasn't reviewed them), Mike's two gates, parked items, wave-3 preview. **Commit:** `docs: wave-2 handoff`.
