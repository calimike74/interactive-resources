# Learn Rollout Wave 2 — Handoff (2026-07-17)

**Branch:** `learn-rollout-wave2` (25 commits, HEAD `ea34111`, based on `07e4952` = deployed wave 1). **Not pushed, not deployed** — your call, per the promotion workflow.

## What shipped

Two **brand-new** full courses on the synthesis template — course map, Continue, chapter outros, completion tracking, exam anchors. Neither topic had a Learn lesson before; every row is new, mined from your two Definitive References.

| Course | Chapters | Rows | Diagrams | Audio | Interactives |
|---|---|---|---|---|---|
| **Reverb** (`/learn/reverb`) | One Clap in a Room → The Tail: RT60 & Damping → Spring & Plate → Digital: Algorithm & Fingerprint → Sends, Inserts & Faders | 15 | 15 | 4 presets (convolution IR: dry/room/hall/pre-delay) | Wet/dry-as-distance slider + RT60 decay slider |
| **Sampling** (`/learn/sampling`) | A Recording You Can Play → From Sound to Numbers → The Edit → One Sample Across a Keyboard → Pitch Against Time | 16 | 16 | 4 presets (loop-click vs clean, forward vs reversed) | Bit-depth crusher slider + repitch slider |

Plus **wave-2 item 1 from your list**: the expansions orphan/collision guard is now an automated test (mirrors the runtime's exact matching semantics; it caught one pre-existing wave-1 orphan — "classic wah of analogue synths" never matches because the row text has quote marks — allowlisted, yours to fix or leave). No redirects needed (no legacy URLs); synthesis and wave-1 courses untouched; `app/` untouched; no new dependencies.

## ⚑ THE THING TO REVIEW FIRST: the chapter maps themselves

Unlike wave 1 (which converted lessons you'd already seen), these ten chapters' **structure and emphasis are my design**, built from `_sandbox/reverb-reference` and `_sandbox/sampling-reference`. You approved the wave, not the maps — they're in `docs/superpowers/specs/2026-07-17-learn-rollout-wave2-chapter-maps.md` (2 pages per course). The exam anchors quote real papers via your references: 2023 AS Q5(d) + 2025 A Q5(d) (reverb routing), 2018 AS Q1(a), 2019 A + AS Q4(d), 2022 AS Q3(b), 2022 A Q4(c), 2020 A Q1(a) (sampling).

## Flagged claims (beyond-reference content, all disclosed — priority order)

**Reverb** (full list in `.superpowers/sdd/w2-task-4-report.md`):
1. Pre-delay row: "keeps a vocal's consonants clear of the reflections" — generalised from your reference's A* model answer (70 ms example), not stated as a general rule there.
2. Allpass expansion: full DSP definition (equal level, phase scrambling) — invented beyond the reference's one line.
3. Standing-waves expansion: mechanism explanation — the reference only names the topic.

**Sampling** (full list in `.superpowers/sdd/w2-task-10-report.md`):
4. Ch5 examTip's "envelope shape" framing (only reversal changes the envelope) — accurate synthesis, not source text.
5. Three light elaborations (clearance "case-by-case", hex-editing "automated now", "turntable got there first") + two anchors missing literal question-number citations.

**Invented-but-disclosed numbers** (engineering choices, not curriculum claims): reverb tick timbre + spacing headroom (+0.4 s), fixed mix 0.5, click-rate ~3 Hz, strike decay ~1 s, bit-curve resolution 65536, diagram illustrative values (40 kHz aliasing grid, "Late 1980s" Akai label — inferred from "within a decade" of 1979; real S1000 = 1988), DampingDarkensTail band constants.

## Verification

- **Per-task:** 13 build tasks, 13 independent reviews, 4 fix loops (tick-interval pile-up at long RT60s; content-disclosure gaps; audio-pair row shape; readout boundary) — all re-verified by the original reviewer. Reviewers recomputed every load-bearing number themselves: IR −60 dB landing, equal-power identity, loop phase-step, quantiser step, alias mirror, root-finds, matrix cells.
- **Final whole-branch review:** "Ready to hand over: Yes." Cross-file integrity, hazard isolation, course-to-course coherence, UK register all independently confirmed; its two mechanical fixes (one off-palette hex, in-file disclosure comments) applied as `ea34111`.
- **verify-house-build:** Gate 1 `--audience=alevel` on 14 pages (2 course maps + 10 chapters + 2 topic pages): **0 warns, 0 fails** (cleaner than wave 1). Gate 2: 13/13 independent Playwright DOM-delta checks — all four interactives' readouts including boundary cases (2.2 s reads "hall"; "16 bits — clean (~96 dB range)" → "4 bits — audible staircase"; "+12 st — chipmunk territory" / "−12 st — slow motion"), completion flows on both courses (outro → localStorage → ✓ badge → Continue retarget), final outros (reverb → interface explorer, sampling → playground), exam anchors in SSR.
- **Automated:** tests 20/20 (4 new suites this wave incl. the expansions guard); build 144 static pages; eslint clean on all touched files.

## Your gates (the two only you can run)

1. **Audio, by ear** (speakers + iPhone Safari): reverb — dry vs hall tick, the 80 ms pre-delay gap, room vs hall size, then ride the mix slider (distance illusion) and decay slider (the tick spacing breathes with the tail length); sampling — the loop click vs the clean join (ch3's whole lesson in two buttons), forward vs reversed strike, clean vs crushed, then crush the bit slider and sweep repitch to both extremes. Levels conservative (0.15).
2. **Chapter maps + claims spot-check** as above.

## Parked (yours)

- Wave-1 orphan "classic wah of analogue synths" (quote-mark mismatch — one-word row edit fixes it, or leave allowlisted).
- Sampling has no `learnResources` picker extras (reverb has its interface explorer; sampling's playground is the outro) — add links later if you want parity.
- All wave-1 parked items unchanged.

## Wave 3 (next, on your go)

Minor topics as single-chapter courses + your "covered briefly because past-paper analysis" rationale note: distortion, MIDI & sequencing, recording, digital/analogue, numeracy, leads & signals. (Recording remains the promotion candidate if a verified source appears.)
