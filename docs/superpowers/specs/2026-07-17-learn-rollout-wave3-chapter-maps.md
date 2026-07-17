# Learn Rollout — Wave 3 Chapter Maps (Minor Topics)

**Date:** 2026-07-17
**Status:** Authored by Claude under Mike's wave-3 go ("wave three is a go", 2026-07-17). Mike reviews these maps as part of his wave-3 gate — he approved the wave, not the maps.
**Parent spec:** `2026-07-16-learn-uniform-rollout-design.md` (all hard constraints inherited). Wave-2 addendum conventions (one preset per row, chapter self-containment, anchor vocabulary law) carry over.

## Scope

Six MINOR topics become single-chapter courses on the synthesis template: `distortion`, `midi`, `recording`, `digital-analogue`, `numeracy`, `leads-and-signals`. One chapter each, 3–5 rows, chapter-level `examAnchor`, final-card outro ("Now go play" → named resource, "Prove it" → Revise anchor — the existing lesson page already renders this for any lesson with no `next`, verified at `app/learn/[topicId]/[lessonId]/page.js:33-47`).

`general` gets no Learn course (parent spec).

## The rationale line (new, structural)

Parent spec: each minor "opens with a visible rationale line (register: honest, exam-smart)", 10–18 words where possible.

**Mechanism:** a `learnRationales` map in `lib/learn/topics/index.js` + `getLearnRationale(topicId)` accessor. `LearnPickerClient` renders it **in place of** the generic non-course intro paragraph (the `<p>` at the picker header — same element, same styles, zero visual redesign). Course topics (`isCourse`) are unaffected. Topics with no rationale keep the generic line.

**Per-topic lines (Mike's spot-check list — each ≤18 words):**

| Topic | Rationale line |
|---|---|
| distortion | "Past papers ask about distortion briefly — a type, a parameter, a purpose. This covers exactly that." |
| midi | "MIDI earns a handful of reliable marks — messages, quantise, editing. One chapter banks them." |
| recording | "Past papers touch recording lightly — signal flow, formats, latency. This chapter covers the essentials." |
| digital-analogue | "One dependable question: Nyquist, bit depth or the conversion chain. Learn the numbers, take the marks." |
| numeracy | "Numeracy is quick arithmetic for easy marks — five number families, no calculator needed." |
| leads-and-signals | "Leads questions are quick wins: name the connector, explain balanced, order the chain." |

## Sources (all in-repo, already student-facing)

Per topic: the `specSummary` block in `lib/topics.js` (quote-faithful mining), plus the named resource components below. Content not traceable to these gets flagged in the report, exactly as waves 1–2.

- distortion: `components/resources/CombinedDistortionLab.jsx`, `lib/resources/combined-distortion-lab.js`
- midi: `components/resources/MIDIBinaryAssessment.jsx`, `components/resources/MIDIPitchBendController.jsx`
- recording: `components/resources/MixingProduction.jsx`, `components/resources/StereoPanning.jsx`, `lib/resources/stereo-recording-essay.js` (+ component if present)
- digital-analogue: `components/resources/ADCExplorer.jsx`, `components/resources/DigitalAudioAssessment.jsx`, `components/resources/SignalChainEurorack.jsx`; the deployed sampling course ch2 (`lib/learn/topics/sampling.js` rate-depth) for cross-references — do NOT duplicate its teaching, point to it
- numeracy: `components/resources/OctavePeriodTrainer.jsx`, `components/resources/BPMDelayCalculator.jsx`, `components/resources/LevelsMeteringAssessment.jsx`, `components/resources/WaveformDrawingAssessment.jsx`; the deployed delay course timed-delay chapter for the BPM maths (same law: point, don't duplicate)
- leads-and-signals: `components/resources/AudioLeadsFlashcards.jsx`, `components/resources/PatchBaySimulator.jsx`, `components/resources/SignalChainEurorack.jsx`

## Diagram policy

Reuse registered diagrams where the concept is identical (they are shared components, not topic property). New diagrams follow wave-2 discipline: 480×280 @2×, +0.6 frame increment, RAF with cleanup, markers computed from the curve/data, no line crosses a label (verified algebraically incl. animation extremes), palette = existing union only, illustrative values disclosed in-file and in the report.

**Reused (no new code):** `bit-depth-staircase`, `sample-rate-grid`, `aliasing-foldback`, `dynamic-range-gap`, `bpm-to-ms-family`, `dotted-triplet-multipliers`, `log-frequency-axis`, `send-vs-insert-routing`.
**New (15):** listed per chapter below.

## Audio & interactives

One new preset family + one new interactive, both for distortion (its core parameter deserves the knob):

- `dist-drive` preset — the house pluck/tone through a `WaveShaperNode` soft-clip curve at a fixed musical drive; `ctl-drive` controllable variant (curve amount 0–10, clamped, k-curve `y = (1+k)x / (1+k|x|)` or equivalent soft-clip documented in-file; level conservative 0.15; standard teardown).
- **DriveSlider** interactive — byte-faithful to `DelayTimeSlider` anatomy, `ctl-drive`. Readout = value-led, single em-dash, parenthesised detail (the `BitDepthSlider` pattern): `drive 0 — clean (no clipping)` for 0–1, `drive 3 — warm (soft clipping)` for 2–4, `drive 6 — driven (audibly distorted)` for 5–7, `drive 9 — fuzz (heavily clipped)` for 8–10 (numeral = live slider value; zone/detail words fixed per band). *(Amended 2026-07-17 after task-2 review: the original table's zone strings carried an internal em-dash, which composed with the value prefix into a double-dash readout — off-anatomy. Single em-dash signature is law.)*

**Reused:** `ctl-bit-depth` + `BitDepthSlider` on the digital-analogue bit-depth row (already registered; zero new code). `smp-crushed`/`smp-full-depth` presets are NOT re-placed (the slider covers the continuum).

One preset per row; A/B pairs = single presets on adjacent rows (wave-2 law).

## Chapter maps

Subtitles use the established convention. Every chapter has `examAnchor { question, modelPoints, examTip }`; the guard test is extended (Task 1) to require this for ALL learn topics, single-chapter included.

### 1. Distortion — `lib/learn/topics/distortion.js` → `DISTORTION_CHAPTERS`

Chapter `drive` — **"Drive, Clipping & Colour"** — subtitle "Topic 1.12 — Component 4". 4 rows:

1. **`what-distortion-is`** — pushing a signal past what the circuit can carry; the family: overdrive (gentle) → distortion → fuzz (extreme); saturation as the subtlest warmth. Diagram NEW **`clipping-shapes`** (soft vs hard clipping on a sine — rounded shoulders vs flat tops).
2. **`drive-tone-level`** — the core parameters: drive/gain pushes in, tone shapes the edge, output level compensates, mix/blend for parallel. Diagram NEW **`drive-tone-level-chain`**. Audio: `dist-drive`. Interactive: **DriveSlider** (`ctl-drive`).
3. **`harmonic-colour`** — clipping creates harmonics; symmetric clipping (hard or soft) produces odd harmonics; asymmetric circuits (tube saturation) add even harmonics (warm) — mine the lab's harmonic content teaching verbatim where possible. Diagram NEW **`odd-even-harmonics`** (spectrum bars). *(Amended 2026-07-17 during task 3: the original gloss inverted the symmetric/asymmetric → odd/even mapping; the lab source and the implementation carry the correct physics — source wins.)*
4. **`analogue-vs-digital-dirt`** — tube/transistor/transformer colour vs digital waveshaping and bitcrushing; bitcrushing = quantisation as an effect. Diagram REUSE **`bit-depth-staircase`**. Expansion cross-link to the sampling course's Transforms chapter.

examAnchor: identify the distortion type from a described sound and justify parameter choices (spec 1.12 vocabulary: overdrive/distortion/fuzz/saturation, drive, tone, mix). examTip: name the type first, then the parameter that gets you there.
Outro → `combined-distortion-lab`.

### 2. MIDI & Sequencing — `lib/learn/topics/midi.js` → `MIDI_CHAPTERS`

Chapter `notes-as-data` — **"Notes as Data"** — subtitle "Topic 1.5 — Component 4". 4 rows:

1. **`what-midi-carries`** — instructions, not audio: note on/off, pitch, velocity, channel; why a MIDI file is tiny and editable. Diagram NEW **`midi-message-anatomy`** (status byte + two data bytes, labelled — mine MIDIBinaryAssessment for the byte layout).
2. **`two-ways-in`** — real-time input (play the keyboard) vs non-real-time (step grid / pencil); when each wins. Diagram NEW **`realtime-vs-step-input`**.
3. **`quantise-and-edit`** — hard quantise to the grid, swing/percentage strength, then piano-roll editing: velocity, note length, looping, duplicating. Diagram NEW **`quantise-grid-snap`** (before/after snap, swing offset).
4. **`beyond-the-note`** — controllers: pitch bend (LSB/MSB for resolution), mod wheel/CC, tempo as data. Diagram NEW **`pitch-bend-resolution`** (mine MIDIPitchBendController's 14-bit teaching).

examAnchor: MIDI data-byte question (note on/off, which byte says which — MIDIBinaryAssessment holds the real question shapes). examTip: status says what happened, data bytes say which note and how hard.
Outro → `midi-pitch-bend-controller`.

### 3. Recording & Production — `lib/learn/topics/recording.js` → `RECORDING_CHAPTERS`

Chapter `signal-path` — **"From Source to DAW"** — subtitle "Topic 1.1 — Component 4". 3 rows:

1. **`the-chain`** — source → mic → preamp → converter (interface) → DAW → monitors; what each stage does to the signal. Diagram NEW **`recording-signal-flow`** (left-to-right chain, no line crosses a label).
2. **`captured-quality`** — file formats and the capture settings: bit depth, sample rate, WAV vs compressed; the trade-offs (quality/size/editability). Diagram REUSE **`sample-rate-grid`**. Expansion cross-link to digital-analogue chapter.
3. **`hearing-yourself`** — input monitoring, buffer size and latency when tracking: small buffer = low latency but more CPU; direct monitoring sidesteps it. Diagram NEW **`buffer-latency-tradeoff`**.

examAnchor: order the recording signal chain / name the stage that converts analogue to digital (spec 1.1 vocabulary). examTip: walk the chain left to right and name every box — sequence marks are the easiest to drop.
Outro → `stereo-panning`.
**Handoff note (parent-spec flag):** recording remains the promotion candidate if a verified source appears; this chapter is deliberately not built speculatively.

### 4. Digital & Analogue — `lib/learn/topics/digital-analogue.js` → `DIGITAL_ANALOGUE_CHAPTERS`

Chapter `conversion` — **"Crossing the Line"** — subtitle "Topic 2.4 — Component 4". 4 rows:

1. **`two-worlds`** — analogue = continuous voltage, digital = discrete numbers; what each is good at (warmth/degradation vs perfect copies/editing). Diagram NEW **`continuous-vs-discrete`** (same wave, smooth line vs stepped samples side by side).
2. **`the-round-trip`** — ADC on the way in, DAC on the way out: mic → ADC → DAW → DAC → monitors. Diagram NEW **`adc-dac-pipeline`**.
3. **`fast-enough`** — sample rate as temporal resolution; Nyquist: rate ≥ 2× highest frequency; 44.1 kHz covers hearing; alias when you break the rule. Diagrams REUSE **`aliasing-foldback`**. Expansion points at the sampling course's From Sound to Numbers chapter for the full treatment.
4. **`deep-enough`** — bit depth as amplitude resolution; quantisation error as the noise floor; ~6 dB per bit, 16 bits ≈ 96 dB. Diagram REUSE **`bit-depth-staircase`**. Interactive: **BitDepthSlider** (reused, `ctl-bit-depth`).

examAnchor: Nyquist/bit-depth calculation with mentally tractable values (e.g. highest frequency capturable at 48 kHz; dB range at 16-bit) — mine DigitalAudioAssessment for the asked shapes. examTip: two formulas carry the whole topic — write them before you write anything else.
Outro → `adc-explorer`.

### 5. Numeracy — `lib/learn/topics/numeracy.js` → `NUMERACY_CHAPTERS`

Chapter `the-numbers` — **"The Numbers That Come Up"** — subtitle "Topic 2.5 — Component 4". 4 rows. ⚑ Non-calculator law: every value mentally tractable.

1. **`pitch-numbers`** — A4 = 440 Hz; octave = doubling; period = 1/frequency (1 kHz ⇄ 1 ms family). Diagram REUSE **`log-frequency-axis`**. *(Amended 2026-07-17: the original map text used ↔, which is banned in A-level student-facing content — ⇄ is the house bidirectional glyph. Source quotes containing ↔ may be cited in code comments but never rendered.)*
2. **`level-numbers`** — dB is logarithmic; −6 dB ≈ half the voltage; dynamic range as the dB gap between the quietest and loudest parts. Diagram REUSE **`dynamic-range-gap`**. *(Amended 2026-07-17 after task-7 review: the original line defined dynamic range as noise-floor-to-ceiling, but the mandated reused diagram — and the deployed dynamics course it belongs to — teach the programme sense (gap between quietest and loudest). Row aligns with the diagram and the site's deployed definition; the noise-floor sense lives in digital-analogue's deep-enough row.)*
3. **`tempo-numbers`** — 60,000 ÷ BPM = one beat in ms; the 120 BPM → 500 ms family; dotted = ×1.5, triplet = ×⅔. Diagram REUSE **`bpm-to-ms-family`**. Expansion points at the delay course's Timed Delay chapter.
4. **`size-numbers`** — file size = rate × depth × channels × time; work in the exam's units (mine LevelsMeteringAssessment / DigitalAudioAssessment for the asked shapes; keep the worked example tractable). Diagram NEW **`file-size-arithmetic`**.

examAnchor: one worked calculation in the past-paper shape (delay time or file size), non-calculator values only. examTip: write the formula, substitute, then simplify in steps — method marks survive arithmetic slips.
Outro → `octave-period-trainer`.

### 6. Leads & Signals — `lib/learn/topics/leads-and-signals.js` → `LEADS_SIGNALS_CHAPTERS`

Chapter `connections` — **"Plugs, Paths & Order"** — subtitle "Topic 2.3 — Component 4". 4 rows:

1. **`the-connectors`** — XLR, TRS, TS, RCA: what each looks like and where it lives (mine AudioLeadsFlashcards verbatim where possible). Diagram NEW **`connector-lineup`** (four connectors, labelled, no crossing lines).
2. **`balanced-vs-unbalanced`** — hot/cold/ground, why flipping and summing cancels noise on long runs; TS = unbalanced, XLR/TRS = balanced. Diagram NEW **`balanced-noise-rejection`**.
3. **`levels-and-di`** — mic level vs instrument level vs line level; the DI box's job (impedance + balance). Diagram NEW **`signal-levels-ladder`**.
4. **`order-and-routing`** — effect-chain order (clean-up → dynamics → time-based → limiting) and insert vs aux send. Diagram REUSE **`send-vs-insert-routing`**. Expansion cross-link to the reverb course's routing chapter.

examAnchor: choose the right lead for a described connection and justify it (balanced/unbalanced, level) — flashcard bank holds the vocabulary. examTip: connector, balance, level — answer all three even when the question only asks one.
Outro → `patch-bay-simulator`.

## Expansions & tests

- New expansion entries per topic in `lib/learn/expansions.js`; triggers verbatim in row text; the wave-2 guard test stays green in every commit (each topic task lands content + expansions + wiring in the same task — no KNOWN_ORPHANS bridges needed; if an implementer must split commits, the dated-bridge pattern applies).
- Task 1 extends `learn-courses.test.mjs`: exam-anchor requirement covers every topic in `learnTopics` (drop the multi-chapter restriction), and add a rationale guard — every topic whose lessons length is 1 must have a `learnRationales` entry of 10–18 words (assert word count bounds loosely, ≤20).
- New `ctl-drive` preset gets shape coverage in `audio-presets.test.mjs` (clamp, curve monotonicity in [0,1] input range, teardown).

## Non-goals

No changes to core courses or synthesis, no learnResources picker additions (topic pages already list the minors' resources; the outro is the pointer), no new question banks, no Explore/Revise re-filing, no SRS wiring, no visual redesign.
