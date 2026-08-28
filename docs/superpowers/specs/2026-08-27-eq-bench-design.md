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

## Addendum, 28 Aug 2026: up to three bells

Mike's walk of the live bench (28 Aug): "a really good benchmark", and one ask: more than one parametric band, so a student can boost in one place and cut in another, chosen as one, two or three bells rather than the eight of a DAW EQ. Built:

- The model carries three peaking bands (`mid`, `mid2`, `mid3`; `BELL_IDS`), in series between the shelves. `state.bells` (1 to 3) says how many the console shows; `setBells()` brings the revealed bells in at once (a bell at zero changes nothing, and a dot on the line answers "where did it go"), puts the hidden ones out but keeps their settings, and hands the dials to the newest bell. `visibleBands()` and `bandLabel()` ("Mid" alone, "Mid 1 / Mid 2 / Mid 3" in company) serve the console.
- Graphic mode locks every bell to an octave centre, not only the first; a preset puts the extra bells away unless it asks for them.
- New preset **Cut and boost** (vocal, two bells: −4 dB at 350 Hz Q 1.5, +3 dB at 3 kHz Q 1.0, HPF 100 Hz): the pair every vocal EQ answer is built on. Judged and opened in `eq-depth.js`; A-level also judges the bell count itself (`last: 'bells'`); Core's next move sends the student to a second bell once the first is a cut.
- Console: the Band section gains a **Bells 1 · 2 · 3** chip group beside In / Out; each bell has its own colour on the stage (`--gen-7` added for the third).
- Gate: the canvas writes `data-dots`; law 16 asks for three bells and expects two more dots and the dials on `mid3`.
