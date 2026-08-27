# The EQ bench (1.11), second bench to the Bench Standard

*2026-08-27. Fable. Governed by `Professional (AI)/Planning-and-Admin/Interactive-Resources-Upgrade/BENCH-STANDARD.md`; the Delay bench (`2026-08-21-delay-bench-design.md`) is the reference. Mike's "go" on the Explore ledger of 27 Aug is the approval; his 21 Aug walk notes for 1.11 are the brief.*

## 1 · Why this bench

Mike's 1.11 note on Graphic vs Parametric EQ: beige, exam tips as question-and-answer instead of think-then-reveal, the two signal-flow diagrams misaligned, a "test yourself" that logs nowhere, Ableton-only copy on the neighbour. EQ is in Q6 four years of seven. The bench replaces that page at `/eq-bench`; `/graphic-parametric-eq` is a retired stub.

## 2 · What the student does

They press Play on a real source (funk kit, 808, a vocal phrase, stabs; the same files as the Delay bench) and hear it through a five-band channel-strip EQ: high-pass (cutoff, 12 or 24 dB/oct), low shelf, one parametric band (frequency, gain, Q), high shelf, low-pass. The stage draws the EQ's curve in gold over the live spectrum of the sound (after EQ as a filled shape, before as a line), with a dot per band that is in; the dot is draggable and is the dial. Hold-dry bypasses every band. Presets: Flat, Vocal clean-up, Drum weight, Telephone, Too much. More: Mid band Parametric or Graphic (frequency snapped to octave centres, Q locked at an octave), Level match (output trimmed by the curve's peak).

## 3 · The model (one set of numbers)

`lib/bench/eq-model.js`, pure and tested (`tests/bench-eq-model.test.mjs`): the RBJ cookbook coefficients that `BiquadFilterNode` also implements, so the curve drawn before Play is the curve the nodes make. `sectionsOf(state, band)` gives each band's biquad sections (a 24 dB filter is two Butterworth sections in series, 6 dB down at the corner); `response(state, freqs)` sums them in dB; `unwrapPhase` for the Extension line. Web Audio takes lowpass and highpass Q in dB, so Butterworth is written as −3.01 dB there. Gain ±15 dB, Q 0.3 to 10 (log dial), stage ±18 dB, 20 Hz to 20 kHz on a log axis.

## 4 · Three jobs (`lib/bench/eq-depth.js`)

Core shows: names the bands that are in and says what to try next. A-level judges the band the student touched last the way Q6 does, setting (AO3) then effect on this part, verdict and change (AO4), source-aware: where a voice, a kit, an 808 and a stab keep their weight, what a boost that size costs in headroom, why cuts are narrow and boosts wide. Extension opens the machine: the cutoff as the −3 dB point, slope as filter order, Q as octaves between half-power points, phase, the graphic EQ as a parametric with two numbers locked, level matching.

## 5 · Verification

`scripts/check-bench.mjs` now reads per-bench fixtures (`BENCHES`): laws 13 and 14 name each bench's presets and the control its "judge it" preset must land; law 15 (EQ) reads the canvas's `data-band` and `data-dot`, checks they equal the Frequency and Gain dials, and drags the dot to prove it moves the dial. All clear locally in Chromium and WebKit at 1280×700 and 1440×900. 165 unit tests.

## 6 · Member side

`grades-dashboard`: `TOPIC_RESOURCE_MAP['eq-filters'] = '/eq-bench'`; the 1.11 Explore band's first card is the EQ bench (new still `public/explore/eq-filters-1.jpg`, new moves, new preview drawing); the EQ Workshop card stays.
