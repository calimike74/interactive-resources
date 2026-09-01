# The Synth bench (1.3): design record

**Date:** 1 September 2026. **Status:** built to the gate; the 2D treatment of Inside the Synthesiser. Commissioned by Mike the same day ("ok lets start with ... Synth and Compressor to 2D") from the 31 Aug estate verdict: a synthesiser is a panel of controls, and a panel of controls fails the internal / spatial rule that keeps a thing in 3D. The verdict's one condition: "Any 2D replacement MUST keep the playable / draggable panel or the move is a net loss." The design sheet (three mocked benches at 1280 × 700, the rail changes, one question) was walked in his browser and approved: "ok lets do this".

The Compressor's half of the same commission needed no build. The Dynamics bench (28 Aug) is already its 2D, walked, with three pictures, and its Extension draws demand against applied gain, which is what the 3D dashpot showed. Inside the Compressor is retired from the 1.9 rail and the workshops landing, with a refresh stub at the old address.

## 1. What the topic is, and what the exam does with it

Synthesis is the paper's own drawing of an instrument: oscillators into a filter into an amplifier, an envelope asking, an LFO moving something too slowly to hear. The written paper asks it two ways. The practical tasks name settings and mark them one at a time: two square oscillators, detuned, filtered, in the right octave (2023 AS Q3(a): "Square wave (1); Detune added, suitable amount (1); Correct filter setting (1); Correct octave (both oscillators) (1)"); two saws, slightly detuned, the same octave, a low-pass no brighter than the example (2024 AS Q2(c)); a lead that is square, mono, with a subtle portamento, a soft attack, full sustain, a short release, a muted cutoff with no resonance and no filter envelope, and an LFO wobbling the cutoff (2025 Q3(a)); the fills with "A=0, D=max, S=max, R=enough release so that the drop in octave is heard" (2023 Q2(d); 2020 Q2(b)). And Q6 shows an unfamiliar 1982 synthesiser and asks whether its settings suit a job: a pad (2019), a bass (2024), for 20 marks.

The reports say where the marks go. 2024: "Candidates who divided up their writing into subheadings, one for each synthesiser section, provided the most concise and structured writing yielding highest marks"; "The most common AO4 marks were for describing the fast attack and release"; "Very commonly, candidates mistakenly thought that the LFO was something audible rather than a control signal"; "many learners misidentified it as a boost/cut rather than an LPF and would discuss what resonance was but didn't discuss its impact on the sound". 2019: "only the top performing candidates noticed that the envelope parameters were routed to the filter cutoff and not the amplitude". 2023 AS: the common issues were no detune and the wrong octave, one octave too high. 2022 AS: a monophonic patch "did not play the complete chords". 2020: "Only the best candidates noticed that the release was very short".

## 2. The judgement: the console is the panel, the stage is three pictures

The console is the playable panel the verdict demanded, in the paper's own sections: Part (Bass, Pad, Lead, Keys), Oscillators (wave, octave, Detune), Filter (LPF / HPF / BPF, Cutoff, Resonance, Env), Envelope (A, D, S, R as four dials), LFO (Pitch / Cutoff / Amp, Rate, Depth); the More row adds Voices (Poly / Mono), Glide (Off / Subtle / Long), Osc 2 (Pair / Sub / Off) and the LFO's shape. Every dial is a drag target, as the 3D's knobs were. Hold plays the oscillators raw: the filter open, the envelope a switch, the LFO off, so what the rest of the panel takes away is heard.

- **The voice** (`lib/bench/synth-model.js`, `SynthBench.jsx`): oscillators, the one subject the Bench Standard admits them for (§3 law 5), declared with `synthesis`. Two per note (a detuned pair, or a square sub an octave down, or one), a BiquadFilterNode, a GainNode the envelope drives, a tremolo gain, one LFO OscillatorNode for the bench feeding three gains (cents into the oscillators' detune, cents into the filter's detune, a fraction into the tremolo). The amplitude envelope is booked on `amp.gain` and the filter envelope on `filter.detune`, so Cutoff moves live on `filter.frequency` and the LFO adds into the same param.
- **What is drawn is what is heard.** The harmonic series per wave is the band-limited series OscillatorNode makes (square odd 1/n, saw all 1/n, triangle odd 1/n², sine the fundamental). The filter curve is the RBJ biquad BiquadFilterNode runs (`filterCoefficients`, with the EQ bench's `sectionResponse`), and resonance is written the way Web Audio takes it: in dB for lowpass and highpass (0 % is the Butterworth corner at -3 dB, 100 % a 24 dB peak), as Q for bandpass. The envelope is four straight lines (`adsrAt`) and the graph books the same lines with linear ramps; a key that lifts mid-attack releases from the model's value at that instant.
- **The parts are the jobs.** Four note lists at 100 bpm in A minor: a bass in quavers, a pad in whole-bar chords, a lead melody, a keyboard part in stabs. The part a patch plays is the job the paper asks about, so a pad patch can be heard on the bass, which is what Q6 asks a candidate to judge. In Mono, a chord keeps its top note only, the 2022 fault.
- **The dot is the dial** (law 25, `check-bench`): the gold curve on the harmonics screen is the filter, its dot at the cutoff; drag across and the Cutoff dial follows, drag up and the resonance rises (the dot's height is the peak in dB). `data-cutoff` on the canvas equals the console's. The keys at the foot of the stage play the voice, and so do A to K; pressing the C key makes the stage report a note (`data-note`).

## 3. Three jobs, three pictures

- **Core, `data-stage=scope`:** three tiles across the top (OSCILLATORS, FILTER, AMPLIFIER; the one last touched is lit); the WAVE screen with two cycles leaving the synth, the pre-filter wave dotted behind it; the HARMONICS screen with the two oscillators' lines on a log axis and the filter drawn over them in gold with its draggable dot; the keyboard. The line names what you hear (the part, the waves and how far apart, the filter and its brightness word, how the note starts and stops, the LFO) and says what to try.
- **A-level, `data-stage=sections`:** the paper's drawing. VCO, VCF and VCA across in signal order with OUT, ENV and LFO beneath, control routes dashed when not routed, each box carrying its settings in the paper's words and a verdict for the part it is playing (suits, partly, does not suit). Touch a box and the line judges that section: AO3 the setting and its effect, AO4 the verdict, the better setting, and the report that says so. With a paper's task set, the line is the scheme's own points with its year, "as directed" or "not yet: <the point missed>".
- **Extension, `data-stage=machine`:** one note in time on five lanes: GATE (key down for the part's note length, key up), ENVELOPE (asks: the four straight lines with A, D, S and R marked), AMPLIFIER (obeys: the note's shape, with the tremolo if the LFO is on the level), CUTOFF (obeys the envelope's lift and the LFO's wobble, on a log axis), LFO (drawn to scale, one cycle labelled, never heard). A playhead crosses it while the bench plays. The line opens the machine: the envelope as a control signal, the filter routing the 2019 report names, the LFO as a wave too slow to hear.

## 4. The papers' questions as presets

Six: **2023 paper** (the AS bass), **2024 paper** (the AS keyboard), **2025 paper** (the lead), **Fills** (2023 and 2020), **Judge: a bass** (a pad patch on the bass part: saw pair, 600 ms attack, 900 ms release, a slow cutoff wobble) and **Judge: a pad** (a bass patch on the pad: square with a sub, 2 ms attack, 60 ms release, mono). The four scheme presets land "as directed" and each point breaks the way the reports describe (an octave up, no detune, a saw for a square, a release too short to hear); the two Judge presets are the Q6 idiom, a patch made for one job set to another, never a claim about the paper's figure (the Q6 AO3 and AO4 grids are not in the vault). Each is pinned by a test (`tests/bench-synth-model.test.mjs`, 19 tests) and each line by its shape (`tests/bench-synth-depth.test.mjs`, 6).

## 5. Audio

No recording: the subject is the oscillator. Credited as such under `synth/` in `docs/audio-credits.md`. The per-wave gains are the Oscilloscope's measured ones (30 Aug: each waveform within a decibel of a recording), with a pair at 0.62 each and a part gain so a four-note pad sits with the bass.

## 6. Gates

`node scripts/check-bench.mjs <url>` in Chromium and WebKit at 1280 × 700 and 1440 × 900: fixture `synth-bench` (presets 2023 paper / 2024 paper / judge "Judge: a bass" landing Attack = 600 ms; stages scope / sections / machine) and law 25. Console at 1280: Play 104 + Part 150 + Oscillators 190 + Filter 212 + Envelope 232 + LFO 150 + Hear 240 = 1278.

## 6b. Measured (`scripts/measure-synth.mjs`, 1 Sep, headless Chromium at 48 kHz)

Two analysers in front of the destination: a short one (10.7 ms) for level, a long one (170 ms) for pitch by a 0.5 Hz DFT sweep with an octave check; the keys pressed by their `data-key` position.

- **Level.** The six presets between -15 and -22 dB mean (2023 paper -15.1, 2024 -16.2, 2025 -18.7, Fills -15.6, Judge: a bass -19.0, Judge: a pad -21.8). A held C2 on each pair through the 700 Hz low-pass: square -22.2, saw -19.9, triangle -23.4, sine -23.4; the same with the filter open, to 0.1 dB, because a 65 Hz note's energy is below the cutoff whatever the wave. The oscillator gains were retuned from the Oscilloscope's (sine 0.35 to 0.27, triangle 0.42 to 0.33, saw 0.42 to 0.55) after a first pass ran the sine pair 7 dB over the saw pair.
- **Pitch.** The C key on the bass: 65.5 Hz at octave 0, 131.0 at +1, 32.5 at -1 (65.4, 130.8, 32.7); on the lead, 261.5 (261.6). A first pass read 49 Hz at octave 0: the bass's last quaver, still booked when Stop faded the master, came back the moment a key raised it. Stop now cuts every booked voice (`clear({ keys: false })`).
- **Detune.** A held C2 pair at 0 cents: the level steady within 0.2 dB. At 50 cents: a 38 dB swing, the beat of the fundamentals at 1.9 Hz with the third harmonic's at 5.7 riding on it.
- **Filter.** The bass's spectral centroid through a 700 Hz low-pass 118 Hz, through a 700 Hz high-pass 1168 Hz: the high-pass removes the bass.
- **Envelope.** A held key with A 600, D 400, S 80, R 900: -32.9 dB at 50 ms, -22.0 at 150, -19.5 at 300, -15.0 at 600, -16.3 at 1000 (the decay to 80 %). With A 5, D 250, S 50, R 90: -12.0 at 20 ms, -18.8 at 300, -20.0 at 600 (8 dB down, the sustain at half). The 900 ms release traced every 100 ms after key-up reaches silence at 900 ms; the early samples wobble 2 dB around the model's straight line because the pair beats.
- **LFO.** Tremolo at 4 Hz, depth 100 %, on the pad: 14 swells in 3 s (12 expected), the level to silence at each trough.
- **Mono.** The pad chord in Mono -28.7 dB, in Poly -21.7: four notes against one. A first pass read the two the same, because Mono was not thinning the sequenced chord; it now keeps the top note of each step, the 2022 fault.
- **The dials.** A log dial's keyboard step could not leave its minimum (1 ms attack, 0.1 Hz rate) because the setters rounded to a unit coarser than half a position; they now keep three significant figures.

## 7. The retirements

- `subtractive-synth-explorer` is a refresh stub (`app/subtractive-synth-explorer/page.js`), out of the registry, the 1.3 band and the free manifest; the glossary's fourteen 1.3 terms now point at `synth-bench`; the Additive explorer's link follows.
- The 3D Inside the Synthesiser leaves the member 1.3 rail, `lib/member/map.js`, the studio hub (five machines to four) and the workshops routes (`/studio/explorers/synth/` becomes a refresh to the bench). Inside the Compressor leaves the 1.9 rail and the workshops landing (`/compressor/` refreshes to the Dynamics bench).

## 8. Held, and what is not built

- **FM is not here.** Operator stays with its own card; a method chip can join the bench later.
- **Velocity-sensitive filtering** (2020 and 2023: bright on the loud bars, filtered on the quiet ones) is not modelled: the parts carry no velocities. The Fills preset marks wave, envelope and filter, and says so.
- **Pulse width and PWM** (the Q6 figure's LFO target, the 2019 report's discriminator) are not on the panel: OscillatorNode has no pulse width. The detuned pair is the same movement by another route, and the Reference says so.
- **Pitch bend** stays on the Piano Roll and the retired MIDI controller.
- **Unwalked by Mike.** Built to the gate with the critique pass; his walk is owed.
