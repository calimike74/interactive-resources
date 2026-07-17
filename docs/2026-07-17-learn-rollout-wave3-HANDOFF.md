# Learn Rollout Wave 3 — Handoff (2026-07-17)

**Branch:** `learn-rollout-wave3` (based on `ca7bce9` = deployed wave 2). **Not pushed, not deployed** — your call, per the promotion workflow.

## What shipped

Every minor topic now has a Learn course. Six single-chapter courses on the synthesis template — same rows, diagrams, expansions, exam anchor and final-card outro ("Now go play" → the topic's flagship tool, "Prove it" → Revise). Each opens with your past-paper rationale line in the picker. With waves 1–2, the Learn door is now uniform across all 12 curriculum topics.

| Course | Chapter | Rows | Diagrams | Outro → |
|---|---|---|---|---|
| **Distortion** (`/learn/distortion`) | Drive, Clipping & Colour | 4 | 3 new + 1 reused | Distortion Lab |
| **MIDI & Sequencing** (`/learn/midi`) | Notes as Data | 4 | 4 new | Pitch-Bend Controller |
| **Recording** (`/learn/recording`) | From Source to DAW | 3 | 2 new + 1 reused | Stereo Panning |
| **Digital & Analogue** (`/learn/digital-analogue`) | Crossing the Line | 4 | 2 new + 2 reused | ADC Explorer |
| **Numeracy** (`/learn/numeracy`) | The Numbers That Come Up | 4 | 1 new + 3 reused | Octave-Period Trainer |
| **Leads & Signals** (`/learn/leads-and-signals`) | Plugs, Paths & Order | 4 | 3 new + 1 reused | Patch Bay Simulator |

New audio: one preset family (`dist-drive` soft-clip) + one interactive (DriveSlider — "drive 3 — warm (soft clipping)" style readouts). Digital & Analogue reuses the sampling course's bit-depth slider. No other topics gained audio (effort weighted by exam marks, per the rollout spec). No app/ changes beyond passing the rationale to the picker; no new dependencies; core courses untouched.

## ⚑ REVIEW FIRST: the six chapter maps + rationale lines

Same deal as wave 2 — you approved the wave, not the maps. All six chapters' structure, emphasis and rationale wording are my design, mined from in-repo sources (your `specSummary` blocks + the topics' own resource components). Maps: `docs/superpowers/specs/2026-07-17-learn-rollout-wave3-chapter-maps.md` (one page per course, four dated amendments show where implementation corrected me).

## Flagged claims (beyond-source content — priority order)

1. **Recording, row 3 (buffer/latency)** — thinnest sourcing of the wave: rests on one specSummary bullet plus standard engineering exposition (64/1024-sample buffers at 48 kHz → ≈1.3/21.3 ms one-way figures, disclosed in-file). Recording stays the promotion candidate; a future full course needs verified sources for mic types/polar patterns and buffer mechanics (currently zero source material).
2. **Digital & Analogue exam anchor** — DigitalAudioAssessment holds NO Nyquist/bit-depth numeric questions, so the anchor borrows its question *shape* (scenario → calculation → working) rather than a real asked question.
3. **Distortion harmonics row** — teaches symmetric clipping → odd harmonics, tube/asymmetric → even. My original map had this inverted; the lab source (and physics) won. Worth 30 seconds of your subject knowledge.
4. **Leads, DI row** — the flashcard source's own answer field is internally confused; the chapter states DI output = mic level, balanced, low impedance (the card's other fields + standard practice). Invented-but-standard dBu ladder: mic ≈ −50, instrument ≈ −20, line = +4. One simplification the final review flags for your eyes: the ladder calls line level "standardised, balanced" — true of pro TRS/XLR line paths, but consumer RCA line level is unbalanced. Fine at this level, or a one-word soften if you prefer.
5. **Numeracy** — invented worked examples (−50/−10 dBFS → 40 dB range; 200 BPM anchor chosen to avoid cloning the delay course's family); "five number families" counts pitch+period as two families in one row.
6. **MIDI** — row 1 generalises the byte architecture from the sources' pitch-bend worked example to Note On; pitch bend framed under a loose "controllers" umbrella (matches the spec's own wording).

## Verification

- **Per-task:** 8 build tasks, 8 independent reviews, 3 fix loops (DriveSlider double em-dash readout; recording "round trip" vs one-way latency figures; numeracy banned ↔ glyph + dynamic-range sense mismatch) — every fix re-verified by the original reviewer.
- **Reviews recomputed the load-bearing facts themselves:** soft-clip curve monotonicity, 14-bit maths, latency arithmetic, Nyquist/6-dB-per-bit numbers, balanced-cancellation trace (literal computed sum), connector-label clearances, every displayed number on the numeracy diagrams.
- **Final whole-branch review:** "Ready to hand over: Yes" — zero Critical, zero Important. It re-ran every gate itself (tests, build, lint, live page checks on all 12 pages), verified cross-file integrity from the registries (all animation ids, interactive keys, presets, outro resources resolve), checked hazard isolation per-commit across all 14 commits, and proved the new guard tests actually bite by fault injection (removed a rationale, then an exam anchor — both tests failed naming the right topic, then restored clean). Full review: `.superpowers/sdd/w3-final-review.md`.
- **verify-house-build:** Gate 1 `--audience=alevel` on 14 pages (6 pickers + 6 chapters + 2 topic pages): **0 warns, 0 fails**. Gate 2: **16/16** independent Playwright DOM checks — all six rationale lines byte-exact, all four DriveSlider zones, BitDepthSlider reuse, canvases render (4/4 after lazy-mount scroll), outro flows (distortion → lab + Revise anchor; numeracy → trainer), exam anchors in SSR, non-course picker mode (no "CHAPTER 1" badge), zero banned glyphs rendered.
- **Automated:** tests 25/25 (guards extended: exam anchor now required on every Learn topic incl. single-chapter; every single-chapter topic must carry an 8–20-word rationale); build 156 static pages; eslint clean on touched files.

## Your gates

1. **Chapter maps + rationale lines + flagged claims** (list above — items 1–3 are the ones worth real attention).
2. **Quick ear/eye pass:** the DriveSlider on `/learn/distortion/drive` (hold to hear, sweep 0→10 — clean to fuzz on the sustained tone) is the wave's only new audio. Everything else is diagrams: the six chapters take ~5 minutes each to scroll.

## Parked / notes

- **Pre-existing:** the `/learn/numeracy` picker renders one ↔ glyph from `lib/topics.js`'s specSummary ("BPM ↔ milliseconds") — read-only file (other session's working tree), predates this wave, one-word edit whenever that file is safe to touch.
- The two wave-2 parked items (wave-1 "classic wah" orphan; sampling learnResources parity) are unchanged.
- `general` has no Learn course by design (parent spec: nothing conceptual to first-teach).

## What's next (nothing awaits a build)

The rollout spec is complete: all core topics have full courses, all minors have single chapters. Remaining moves are yours: deploy wave 3, run your wave-1/2 gates against production, and decide on recording's future promotion if a verified source appears.
