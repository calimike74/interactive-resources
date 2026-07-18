# Revise Question Banks — Closing the Revise Gap (2026-07-18)

**Status:** Designed autonomously under Mike's 2026-07-18 direction ("Close the Revise gap", selected alongside three other work streams, with "keep running" while away). **Mike has approved the direction, not this design — this spec is his review gate**, exactly like the wave-2/3 chapter maps.

## Problem

The Learn door is uniform (12/12 topics) but the Revise door is not. Four topics have no SRS question bank: **distortion, delay, digital-analogue, leads-and-signals**. Every new Learn chapter ends "Prove it → `/topic/<id>#revise`", and for distortion that lands on a *"Revision quizzes and flashcards coming soon"* placeholder — a navigation dead-end of exactly the kind the Learn overhaul was started to eliminate (distortion has no bank AND no retrieval/practice resources).

## Goal

Four new question banks so every Learn-course topic has a Revise deck. After this: 12/12 Learn topics have banks; the deck link renders on all 12 topic pages; the distortion placeholder is gone.

## Mechanism (no app changes, no locked files)

- Four new data files: `lib/questions/{delay,distortion,digital-analogue,leads-and-signals}.json`
- Four imports + registry entries in `lib/questions/index.js` (clean in the working tree; NOT on the parallel-session hazard list)
- `/revise/[topicId]` already static-generates for every topic and `TopicPageClient` already gates the deck link on `getAvailableTopics()` — banks slot in with **zero component or route changes**
- One new guard test file `tests/question-banks.test.mjs` (see Verification)

**Hazard discipline (unchanged from waves):** never touch `app/[resourceId]/*`, `app/topic/[topicId]/page.js`, `lib/resources/index.js`, `lib/topics.js`, `*compression-press*`. Never `git add -A`/`.`/stash; stage by explicit path only.

## Bank conventions (from the nine existing banks — all uniform)

- `{ "topicId": "<id>", "questions": [ ... ] }`, **exactly 20 questions**
- Type mix **10 mcq / 5 numeric / 5 short** — with ONE disclosed exception: **leads-and-signals runs 12 / 3 / 5** because the chapter honestly supports only three calculation families (the dBu-ladder differences); forcing five would invent arithmetic the course never taught. Mike can overrule.
- ids `{topic}-{mcq|num|short}-NN`, two-digit, sequential per type; types interleaved through the array in blocks (see midi.json for the pattern)
- mcq: `question, options[4], correctIndex, explanation`; numeric: `question, answer, tolerance, unit, explanation`; short: `question, sampleAnswer, keyPoints[], explanation`
- Explanations are teaching-quality, 2–4 sentences, stating why the answer is right and why the tempting wrong answer is wrong (match midi.json's register)

## Content laws (binding on every question)

1. **Derivation-only.** Every question derives from a named source: the topic's Learn course rows/assessments/exam anchors, or an existing live reviewed resource named in that bank's map below. No new facts. Where a stem needs a definitional lead-in the source doesn't spell out (e.g. "harmonics are whole-number multiples of the fundamental"), put the definition IN the stem so the question stays self-contained — never test the untaught definition itself.
2. **No verbatim clones.** Don't restate an existing bank's question with the same values (numeracy's numerics: 250 Hz period, 3-min/44.1k/16-bit file size, 90 BPM dotted quaver, 48k mono bit rate, inverse-square). Don't clone the Learn course's own assessment questions with identical values — same family, different values. Cross-surface reuse of a *fact* is fine; cloning a *question* is not.
3. **ADT exclusion (delay bank).** Mike's wave-1 gate on the ADT millisecond range (15–30 ms correction) is still open. The delay bank must not test ANY ADT ms figure. ADT may appear only as purpose/technique (thickening, no audible echo, subtle modulation), never with a number.
4. **Claim inheritance.** distortion/digital-analogue/leads derive from wave-3 chapters whose maps await Mike's review; the leads numerics derive from the dBu ladder the wave-3 handoff already flags as invented-but-standard. If his review amends a map, the bank amends with it. (This is why the branch stays undeployed until his call.)
5. Glyph law (▸/⇄ only, ▶/↔ banned), UK English, professional A-level register, non-calculator arithmetic with mentally tractable values only.

---

## Bank maps (Mike's review gate — one per bank)

### delay.json (10/5/5) — sources: `lib/learn/topics/delay.js` (4 chapters), `lib/resources/delay-assessment.js`, `lib/resources/delay-flashcards.js`

**Numerics (values pinned, recomputed at review):**
| # | Question family | Values | Answer |
|---|---|---|---|
| 1 | Quarter-note delay from 60,000÷BPM | 120 BPM | 500 ms (tol 0) |
| 2 | Quarter-note delay, less-common tempo | 75 BPM | 800 ms (tol 0) |
| 3 | Dotted multiplier ×1.5 | 100 BPM quarter (600 ms) → dotted quarter | 900 ms (tol 0) |
| 4 | Subdivision halving | 150 BPM quarter (400 ms) → eighth | 200 ms (tol 0) |
| 5 | Triplet multiplier ×⅔ | 120 BPM quarter (500 ms) → triplet quarter | 333 ms (tol 1) |

**MCQ targets (10):** fully-wet wet/dry consequence · sub-20 ms heard as thickening not echo · feedback = repeat count/decay, runaway at 100% · classic slapback parameter set · tape vs pristine digital repeats (why old repeats darken) · true ping-pong architecture (two lines, crossed feedback) vs panned single delay · filtered/EQ'd repeats fixing sibilant build-up · ADT purpose only (no ms) · one high-feedback delay vs multi-tap for evenly spaced repeats · dotted/triplet multiplier concept.

**Short (5):** tape-echo darkening mechanism · feedback parameter behaviour incl. self-oscillation · slapback recipe and its classic use · true ping-pong architecture · why 60,000÷BPM works (60,000 ms per minute).

### distortion.json (10/5/5) — sources: `lib/learn/topics/distortion.js` (drive chapter), `lib/resources/combined-distortion-lab.js`

**Numerics — all harmonic-series arithmetic (integer multiples; definitional lead-in in stem if the row doesn't state it):**
| # | Family | Values | Answer |
|---|---|---|---|
| 1 | nth harmonic | 200 Hz fundamental, 3rd harmonic | 600 Hz (tol 0) |
| 2 | Even harmonic | 150 Hz, 2nd harmonic | 300 Hz (tol 0) |
| 3 | Lowest new harmonic from symmetric (odd-emphasis) clipping | 100 Hz fundamental | 300 Hz (tol 0) |
| 4 | Higher odd harmonic | 250 Hz, 5th harmonic | 1250 Hz (tol 0) |
| 5 | Even series | 120 Hz, 4th harmonic | 480 Hz (tol 0) |

**MCQ targets (10):** the gentlest→most-extreme family ordering exactly as the course row teaches it (do not re-derive it) · drive control's dual effect (more clipping + louder/harsher) · odd vs even harmonic sound character (thin/buzzy vs warm/full — per the AMENDED map: symmetric→odd, asymmetric/tube→even) · tube/asymmetric→even association · bitcrushing ≠ tube saturation (mechanism difference) · soft vs hard clipping shape/sound · level control's compensating role · "gently warmed" listening ID → saturation · fuzz character ID · tone control as post-distortion filter.

**Short (5):** what clipping does to the waveform and why it sounds louder/brighter · overdrive vs fuzz character comparison · symmetric vs asymmetric clipping → harmonic flavour (course's amended framing) · drive/tone/level roles in the chain · why bitcrushing and analogue saturation are different families of "dirt".

### digital-analogue.json (10/5/5) — sources: `lib/learn/topics/digital-analogue.js` (conversion chapter), `lib/resources/digital-audio-assessment.js`

**Numerics:**
| # | Family | Values | Answer |
|---|---|---|---|
| 1 | Inverse Nyquist (minimum rate for a bandwidth) | capture up to 20 kHz | 40,000 Hz minimum (tol 0) |
| 2 | Quantisation levels 2^bits | 4-bit | 16 levels (tol 0) |
| 3 | Dynamic range ≈ 6 dB/bit | 24-bit | 144 dB (tol 0) |
| 4 | Dynamic range ≈ 6 dB/bit | 8-bit | 48 dB (tol 0) |
| 5 | Sample count | 2 s at 48 kHz | 96,000 samples (tol 0) |

(Avoids cloning the course anchor's forward-Nyquist 48→24 kHz values and numeracy's file-size/bit-rate questions.)

**MCQ targets (10):** analogue generation loss vs identical digital copies · ADC role and position · DAC role and position · sample rate definition · bit depth definition · aliasing cause (frequency above Nyquist folds back) · Nyquist rule statement · each extra bit doubles the step count · audible result of very low bit depth (quantisation noise/staircase) · what stays analogue in the chain (mic signal before ADC, speaker signal after DAC).

**Short (5):** ADC/DAC round-trip placement and roles · why digital copies are identical but tape generations degrade · Nyquist rule + aliasing consequence in one answer · how bit depth sets noise floor/dynamic range · what changes (and what doesn't) dropping 16-bit → 8-bit at fixed sample rate.

### leads-and-signals.json (12/3/5 — disclosed deviation) — sources: `lib/learn/topics/leads-and-signals.js` (connections chapter), `lib/resources/audio-leads-flashcards.js`

**Numerics — dBu-ladder differences (ladder: mic ≈ −50 dBu, instrument ≈ −20 dBu, line = +4 dBu; inherits the wave-3 "invented-but-standard" flag):**
| # | Family | Values | Answer |
|---|---|---|---|
| 1 | Mic → line gain | −50 → +4 dBu | 54 dB (tol 0) |
| 2 | Instrument → line gain | −20 → +4 dBu | 24 dB (tol 0) |
| 3 | Mic vs instrument gap | −50 vs −20 dBu | 30 dB (tol 0) |

**MCQ targets (12):** XLR identification/use · TRS vs TS conductor difference · RCA context (consumer/unbalanced) · which connector carries phantom power (XLR) — **AMENDED 2026-07-18 during Task 5:** the original map claimed this traces to the flashcards; implementation grepped all three named sources and found NO phantom-power statement in any of them (my trace error). Target retained as a disclosed beyond-source item: the fact is uncontested, exam-standard, and already asserted on a live reviewed surface (`lib/questions/recording.json`'s phantom-power MCQ, which this question must not clone); the vault also holds a verified Mike Senior extract covering phantom power for the future recording course. Flag stays in the handoff for Mike · balanced rejection principle (inverted copy + difference) · long runs → balanced rule · DI box output (mic level, low impedance, balanced) · guitar-into-line-input fault diagnosis · why the limiter goes last in the chain · sensible chain order (EQ → compression → limiter per the course row) · which level tier a keyboard/line synth outputs · impedance mismatch symptom (thin/weak signal).

**Short (5):** balanced-cable noise-rejection mechanism step by step · why a DI box for guitar → desk · XLR vs TS choice for two named scenarios · chain-order reasoning (what goes wrong with limiter first) · the three level tiers and why matching matters.

---

## Verification design

**Guard test `tests/question-banks.test.mjs`** (TDD-first, KNOWN_MISSING pattern mirroring `KNOWN_ORPHANS`):
- Schema: every bank file parses; topicId matches filename; every question has the exact field set for its type; correctIndex in range; options length 4; unique ids; ids follow `{topic}-{type}-NN`
- Counts: exactly 20 questions; type mix equals a per-topic literal map (default 10/5/5, leads-and-signals 12/3/5) — exact-asserted so it can't drift silently
- Coverage: every id in `learnTopics` has a bank, EXCEPT ids listed in `KNOWN_MISSING` (exact-content-asserted, dated comments; starts `['delay','distortion','digital-analogue','leads-and-signals']` and shrinks to `[]` as tasks land). The orphaned `mixing` bank (no topic page — Mike's open decision) is asserted as known-unreachable, not deleted.
- Content lint: no ▶/↔ anywhere in any bank; no `$` unicode escapes for the banned glyphs
- The existing nine banks must pass every schema/count assertion from day one (they set the convention)

**Gate 1:** `checks.mjs --audience=alevel` on `/topic/distortion`, `/topic/delay`, `/topic/digital-analogue`, `/topic/leads-and-signals`, `/revise/distortion`.
**Gate 2 (Playwright, independent):** deck link now renders on all four topic pages (and the distortion "coming soon" placeholder is GONE); `/revise/distortion` serves the quiz shell; glyph scan on rendered pages. **Disclosed limit:** the quiz itself sits behind AuthGate (real student token via Supabase RPC), so live question rendering can't be driven end-to-end without student credentials; question content is verified at data level by the guard test plus per-task review recomputation of every numeric.

## Out of scope (parked, unchanged)

Sampling/distortion retrieval *resource cards* (banks give them decks; card parity is a follow-up) · the orphaned `mixing` bank decision · delay-flashcards/assessment refresh · anything behind the locked files.
