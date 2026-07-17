# Learn Rollout Wave 2 — Chapter Maps (Reverb + Sampling)

**Date:** 2026-07-17
**Status:** Addendum to `2026-07-16-learn-uniform-rollout-design.md` (approved). Wave 2 authorized by Mike 2026-07-17 ("Deploy wave one. Start now on wave two."). Chapter maps designed from the verified references; they go in the wave handoff for his review, per the wave protocol.
**Parent constraints apply unchanged:** zero visual redesign; Learn DNA (≤~70-word rows, depth in expansions); verified sources only; one knob = law; ▸/⇄ glyphs only; UK English; mentally tractable numeracy.

## Scope

1. **First item:** automated expansions orphan/collision guard test (replaces the manual per-task sweeps of wave 1).
2. **Reverb course** — brand-new, `lib/learn/topics/reverb.js` → `REVERB_CHAPTERS` (5 chapters, 15 rows). Source: `_sandbox/reverb-reference/src/content/{learn.tsx,teach.ts}`.
3. **Sampling course** — brand-new, `lib/learn/topics/sampling.js` → `SAMPLING_CHAPTERS` (5 chapters, 16 rows). Source: `_sandbox/sampling-reference/src/content/{learn.tsx,teach.ts}`.

No legacy Learn lessons exist for either topic: **all rows are new**, there are no redirects to add, and `learnResources` picker entries stay untouched (`reverb` already lists its explorer; `sampling` has none — that is fine, the function returns `[]`).

Wiring is one line per topic in `lib/learn/topics/index.js` (`reverb: REVERB_CHAPTERS`, `sampling: SAMPLING_CHAPTERS`); course map, Continue, completion and outros activate automatically.

## Reverb course — `REVERB_CHAPTERS`

Follows the reference's journey: one clap → the tail → mechanical → digital → routing. Chapters 1–2 are grounded in 2.1 Acoustics (the reference prescribes 2.1-before-1.12); subtitles: ch1–2 `Topics 1.12 & 2.1 — Component 4`, ch3–5 `Topic 1.12 — Component 4`.

### Ch 1 `one-clap` — One Clap in a Room
| Row | Teaches | Animation |
|---|---|---|
| `direct-early-tail` | Three arrivals in strict order: direct (defines dry), early reflections ~50–80 ms (the size cue), then the wash | `clap-timeline` + audio `verb-hall` |
| `pre-delay-gap` | Pre-delay = the gap between direct sound and reverb onset (0–200 ms and beyond); not an echo effect | `pre-delay-gap` + audio `verb-predelay` (A/B counterpart = previous row, wave-1 adjacent-row pattern) |
| `distance-rd-ratio` | Direct falls 6 dB per doubling of distance, room holds steady → R/D ratio rises; wet/dry is really a distance control | `distance-rd-ratio` + interactive `reverb-mix` + audio `verb-dry` |

**Exam anchor:** explain how moving a source further away changes what we hear (R/D ratio rises; direct falls 6 dB per doubling; source recedes into the space).

### Ch 2 `the-tail` — The Tail: RT60 & Damping
| Row | Teaches | Animation |
|---|---|---|
| `rt60-decay` | RT60 = time for the decay to fall 60 dB; small live room well under 1 s, hall 1–2 s, cathedral beyond | `rt60-decay-curve` (−60 dB marker geometrically exact) + interactive `reverb-decay` + audio `verb-room` |
| `absorption-damping` | Absorption converts energy to heat, takes highs first → damping darkens the tail (tone, not level) | `damping-darkens-tail` |
| `diffusion-scatter` | Diffusion scatters reflections instead of removing them: smoother decay, similar length | `absorb-vs-diffuse` |

**Exam anchor:** "Explain how room size affects RT60" (named recurring question) — longer paths, less loss per second; more absorption = shorter RT60. "Soundproofing" is the flagged wrong word (2018 AS Q6 report).

### Ch 3 `spring-plate` — Reverb Without a Room
| Row | Teaches | Animation |
|---|---|---|
| `transduction-chain` | Signal in → something physical vibrates → signal out; the chain shared with mics and speakers | `transduction-chain` |
| `spring-twang` | Transducer twists a steel coil; dispersion smears transients into the twang; guitar amplifiers | `spring-reverb-mechanism` |
| `plate-emt140` | Tensioned steel sheet, driven centre, edge pickups; dense, bright, **non-spatial**; EMT 140's movable damping plate = mechanical decay control | `plate-reverb-mechanism` |

**Exam anchor:** type identification by character — spec adjectives verbatim: spring = characteristic twang on transients; plate = dense, bright, non-spatial (EMT 140).

### Ch 4 `digital-reverb` — Digital Reverb: Algorithm & Fingerprint
| Row | Teaches | Animation |
|---|---|---|
| `algorithmic-plumbing` | Comb filters recirculate short delays into a decaying echo train; allpass filters smear them dense; acoustics become knobs | `comb-allpass-network` (node-link: label-clearance law) |
| `convolution-fingerprint` | Impulse response = the room's recorded fingerprint; strikingly realistic, stubbornly fixed | `impulse-response-fingerprint` |
| `hybrid-parameter-bridge` | Hybrid (Live 12): sampled early reflections + algorithmic tail; the bridge: RT60→decay, gap→pre-delay, absorption→damping, scatter→diffusion, distance→wet/dry | `parameter-bridge` |

**Exam anchor:** spec wording — algorithmic = real-time synthesis using delay lines, comb and allpass filters; convolution = impulse-response sampling of real spaces, realistic but less editable; name hybrid for the synthesis of both.

### Ch 5 `routing` — Wiring It In: Sends, Inserts & Faders
| Row | Teaches | Animation |
|---|---|---|
| `send-vs-insert` | Send/return: many sources share one reverb and it holds its stereo position; insert reverb pans with the source (the recurring examiner complaint) | `send-vs-insert-routing` |
| `pre-post-fader` | Post-fader: wet follows the fader (usual mix behaviour); pre-fader: wet survives a silent fader | `pre-post-fader-tap` |
| `reverb-fade-trick` | The fade task: dry falls to silence through the bars, wet holds constant — the singer walks away into the room; only a pre-fader send can do it | `reverb-fade-automation` |

**Exam anchor:** 2023 AS Q5(d) — insert-routed reverb panned with the vocal and lost the mark; 2025 A Q5(d) — full credit = dry to silence, wet constant (pre-fader send).
**Final outro:** `outroResourceId: 'reverb-image-explorer'`.

## Sampling course — `SAMPLING_CHAPTERS`

Follows the reference's journey: the instrument → the numbers → the edit → the map → the transforms. Subtitle all chapters: `Topic 1.4 — Component 4`.

### Ch 1 `the-sampler` — A Recording You Can Play (4 rows)
| Row | Teaches | Animation |
|---|---|---|
| `two-mark-definition` | A sample = a **digital recording** triggered using a **MIDI keyboard** — both halves earn the marks; "a sound" earns nothing | `sampler-record-store-trigger` |
| `sampler-lineage` | Mellotron tape strips (1963) → Fairlight CMI (1979, 8-bit, ~1 s) → Akai S1000 (CD quality) → MPC pads → your DAW | `sampler-lineage` |
| `why-sample-drums` | The mark-scheme advantages bank: no mics/spill, quantise, change tempo, retune per hit, identical timbre, impossible rhythms | `why-sample-drums` |
| `one-shot-gated-loop` | One-shot plays whole however briefly tapped; gated follows the key; a loop region cycles to sustain | `playback-modes` |

**Exam anchor:** 2018 AS Q1(a)(i)+(ii) — the two-mark definition, then the advantages bank. (Copyright clearance → expansion, not a row.)

### Ch 2 `rate-depth` — From Sound to Numbers
| Row | Teaches | Animation |
|---|---|---|
| `sample-rate-nyquist` | Rate = measurements per second (44.1 kHz CD, 48 kHz production); capture reaches **half** the rate — Nyquist | `sample-rate-grid` |
| `aliasing-foldback` | Above Nyquist, content folds back into the audible range at a false pitch: aliasing | `aliasing-foldback` |
| `bit-depth-staircase` | Depth = levels per measurement; ~6 dB of range per bit; 16-bit ≈ 96 dB; too few bits = staircase = quantisation noise | `bit-depth-staircase` + interactive `bit-depth` + audio `smp-full-depth`/`smp-crushed` |

**Exam anchor:** quiz-bank Nyquist — rate must be at least twice the highest frequency; aliasing = distortion from an insufficient rate. (File-size arithmetic → expansion: the values aren't mental-maths tractable and the reference flags it as 2.4/2.5 shared ground.)

### Ch 3 `the-edit` — The Edit: Where the Marks Live
| Row | Teaches | Animation |
|---|---|---|
| `clicks-zero-crossings` | A click = an instantaneous jump in the waveform; cut where it crosses the centre line and there is no jump to hear | `zero-crossing-cut` |
| `truncate-crossfade` | Truncate dead air so the sample speaks on trigger; a short fade/crossfade spreads an unavoidable jump until inaudible | `truncate-and-fade` |
| `loop-points-stutter` | Loop end must meet loop start without a step; crossfade looping blends sustained joins; stutter = copy one word, paste in rhythm | `loop-point-join` + audio `smp-loop-click`/`smp-loop-clean` |

**Exam anchor:** 2019 A Q4(d) — starts truncated correctly (1), no clicks (1); 2022 AS Q3(b) — copied word (1), timing/no glitches (1), three repetitions (1).

### Ch 4 `the-map` — One Sample Across a Keyboard
| Row | Teaches | Animation |
|---|---|---|
| `root-note` | The sampler transposes by changing playback speed; root note = the key where the sample plays as recorded; wrong root = every key transposed by the wrong interval (the 2022 octave error) | `root-note-map` |
| `speed-pitch-timbre` | Speed and pitch move together, so timbre drifts with distance: chipmunk up, slow-motion down; large transpositions sounding unnatural is a creditable point | `speed-pitch-link` + interactive `repitch` |
| `multisampling-zones` | Multisampling: recordings every few notes assigned to key zones; velocity **layering** (the bare word "velocity" earned nothing) stacks soft and hard | `key-zones-velocity-layers` |

**Exam anchor:** 2019 AS Q4(d) point by point — sample different pitches; assign to zones; root note; small intervals; large transpositions unnatural; single notes not phrases. (Assignment-settings list — volume, key/zone, root, start/end, one-shot, direction, pan, NOT envelope/filter — → expansion + modelPoints.)

### Ch 5 `transforms` — Pitch Against Time
| Row | Teaches | Animation |
|---|---|---|
| `repitch-stretch-shift` | The 2×2: repitch couples pitch and duration; time-stretch holds pitch; pitch-shift holds duration; extremes and wrong algorithms give audible artefacts | `pitch-time-matrix` |
| `reverse-swell` | Reverse turns every decay into a swell — the reversed cymbal is the classic build into a downbeat | `reverse-envelope` + audio `smp-forward`/`smp-reversed` |
| `chop-layer-culture` | Bronx DJs extended breaks with two copies; samplers absorbed it: chop a break to pads for per-hit timing/tuning/processing; layer a punchy kick under a sub-heavy one | `chop-resequence` |

**Exam anchor:** 2022 A Q4(c)(ii) — 85→75 BPM without pitch change = time stretch; 2020 A Q1(a) — the cymbal in bar 13 is reversed.
**Final outro:** `outroResourceId: 'sampling-playground'`.

## Audio presets (wave 2)

All follow the established discipline: single lazy context, master gain 0.15, 15 ms ramps, builders return every node, stopper disconnects in teardown. Registry names are collision-free against the existing registry.

**Reverb** — synthetic impulse response through `ConvolverNode` (noise burst × exponential decay; envelope = 10^(−3t/RT60) so −60 dB lands at RT60 by definition; mono IR; `normalize` left at default `true`). Source = repeating percussive tick (lookahead interval timer, the drum-loop pattern) so the tail is audible between hits.
- `verb-dry` / `verb-hall` (RT60 1.8 s) / `verb-room` (RT60 0.4 s) / `verb-predelay` (hall + 80 ms DelayNode on the wet path) — placed ONE per row on adjacent rows (the wave-1 A/B mechanism; `AudioBlock` takes a single preset). Tick spacing follows the active decay (max(1.2, decay + 0.4) s).
- `ctl-reverb-mix` — `set({mix})` 0→1, equal-power crossfade (dry = cos(mix·π/2), wet = sin(mix·π/2))
- `ctl-reverb-decay` — `set({decay})` 0.3→3.0 s, regenerates the IR buffer and reassigns `convolver.buffer`

**Sampling** — constructed `AudioBuffer`s (deterministic sample-by-sample generation, no offline render).
- `smp-loop-click` / `smp-loop-clean` — looped tone whose buffer length is a non-integer vs integer multiple of the waveform period: the click IS the phase step at the loop point
- `smp-forward` / `smp-reversed` — same decaying buffer, reversed in place: decay becomes swell
- `smp-full-depth` / `smp-crushed` — tone through a `WaveShaperNode` staircase curve (identity vs ~4-bit quantise)
- `ctl-bit-depth` — `set({bits})` 2→16, regenerates the staircase curve: `round(x·L)/L`, `L = 2^(bits−1)`
- `ctl-repitch` — looped melodic pluck buffer, `set({semitones})` −12→+12 via `playbackRate = 2^(st/12)`

## Interactives (wave 2) — one knob = law

| Registry key | Component | Chapter | Range & readout |
|---|---|---|---|
| `reverb-mix` | `ReverbMixSlider` | reverb ch1 | 0–100% wet; readout speaks distance: "mostly direct — up close" → "mostly room — far away" |
| `reverb-decay` | `ReverbDecaySlider` | reverb ch2 | 0.3–3.0 s; readout names the space: <0.6 small room / 0.6–1.2 live room / 1.2–2.2 hall / >2.2 cathedral |
| `bit-depth` | `BitDepthSlider` | sampling ch2 | 16→2 bits; readout: "16 bits — clean (~96 dB range)" → "4 bits — audible staircase" |
| `repitch` | `RepitchSlider` | sampling ch4 | −12→+12 semitones; readout at 0: "root — as recorded"; extremes: "chipmunk territory" / "slow motion" |

Accessibility: aria-labels stating parameter and range, matching wave-1 pattern.

## Expansions

New entries per topic in `lib/learn/expansions.js`; triggers verbatim in row text; guarded by the new automated test. Known candidates: sample-clearance/copyright, file-size arithmetic, the Digidesign zero-crossing hex story, assignment-settings list, EMT 140, impulse response, comb filter, allpass filter, standing waves/bass traps, RT60 at different frequencies.

## Verification (same bar as wave 1)

Per-task reviews + final whole-branch review; verify-house-build Gate 1 (`--audience=alevel`) on both course maps + all 10 chapters + both topic pages; Gate 2 independent Playwright DOM-delta checks (all four interactives, completion flow, exam anchors in SSR, outro links); tests green incl. the two guards + new expansions guard; handoff doc with claims list for Mike.
