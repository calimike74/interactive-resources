# The Acoustics bench (2.1) — design record

*Built 12 September 2026 to `Planning-and-Admin/Interactive-Resources-Upgrade/BENCH-STANDARD.md`. The eleventh bench, after Delay, EQ, Dynamics, Edit, the Balance Desk, the Automation Lane, the Piano Roll, the Oscilloscope, the Synth bench and the Reverb bench. It replaces the 2024 page "Acoustics & Psychoacoustics", whose Learn, Hearing Curve, Masking Lab, Room Treatment, Quiz and Reference tabs are the shape the standard bans from Explore, and which was silent.*

`resources.musictechstudio.co.uk/acoustics-bench` · `components/resources/AcousticsBench.jsx` · model `lib/bench/acoustics-model.js` · copy `lib/bench/acoustics-depth.js` · harness `scripts/measure-acoustics.mjs` · gate fixture `acoustics-bench` in `scripts/check-bench.mjs` · tests `tests/bench-acoustics-model.test.mjs`, `tests/bench-acoustics-depth.test.mjs`

---

## 1 · What the papers actually ask, and what they never ask

Every C4 question paper, mark scheme and Principal Examiner report in the vault from 2018 to 2026 was converted with `pdftotext -layout` and swept for masking, comb filtering, reflection, absorption, RT60, treatment, soundproofing, standing waves, room modes, equal loudness and hearing range. The C3 papers were swept too, to confirm the absences. What that found governs this bench, and the absences govern it as much as the findings.

**Acoustics is examined almost entirely inside the Section B evaluation**, where it is never named. It hides inside the phrase "including the studio environment". There are two Section A questions in nine years that touch hearing at all.

| What the bench could have claimed | What the sweep found |
|---|---|
| An RT60 calculation | **None.** "RT60" appears once in nine years of C4, in a 2025 report about a practical. "Reverberation time" appears nowhere. What does exist is reverb time as a practical instruction ("Apply a 2 second reverb", 2018 AS 5(c); "Use a 3 second reverb", 2019 A 5(a); "Apply a 1.5 second reverb", 2024 AS 5(a)) and as a judged value in schemes (">4s", 2021 A 5(d); "approximately 5 seconds", 2020 A 5(e); "[1.8s reverb quite wet]", 2025 A 5(d)). |
| An equal-loudness question | **None.** Fletcher, Munson, "equal loudness", "threshold of hearing", phon, sone, inverse square law, Sabine: all absent from both components, all nine years. The examinable ear content is exactly two things: 20 Hz to 20 kHz as the hearing range (2022 AS 3(e)(iii)), and "above where the ear is sensitive" as a graph-reading judgement (2020 A 4(e), 2019 A 4(e)). |
| A comb-filtering question | **Never asked, only rewarded.** No question paper contains the phrase. It lives in the indicative content of 20-mark essays, always attached to something visible. |
| The 3:1 rule | **Appears nowhere** in C3 or C4, 2018 to 2026. It is not on a judge line. |

So the bench claims none of those. It says, on the stage and in the drawer, which numbers are the paper's and which are its own.

### The four questions the presets are pinned to

| Preset | Paper | The scheme's own words | Pinned by |
|---|---|---|---|
| **2022 AS paper** | 2022 AS Q3(e)(iii), 2 marks. "Give two reasons why the values on the x-axis start at 20 and finish at 20 k." | "20Hz is lower end of human hearing range (1). 20kHz is upper end of hearing range. (1)" | `tests/bench-acoustics-depth.test.mjs`, the tone lands at 10 kHz |
| **2020 paper** | 2020 A Q4(e), 8 marks. "With reference to the graphs, evaluate the difference in sound quality between CD and AAC." | "AAC noise will be mostly masked in electronic/pop music (1). With music with a wide dynamic range / acoustic music (1) the noise will be more audible (1)" | the target must read as masked |
| **2021 paper** | 2021 A Q6, 20 marks. "Evaluate and compare the drum recording techniques for a rock recording." | "The side mic is closer to the snare than the overhead mic. Mics should be equidistant from the snare. Delay between two mics. Phase problems. Comb filtering." | the delay must be inside the colouration window and the two copies within a decibel of each other |
| **2024 AS paper** | 2024 AS Q6, 16 marks. "Evaluate the recording set up including the studio environment." | "Acoustic treatment on walls. Reduces reflections/reverb/ambience/absorbs sound energy. Only reduces mid and high frequency reflections. Too much acoustic treatment loses room character." | the low band must run more than three times the high band, or the scheme's line is not true of the bench |
| **Judge: soundproofing** | 2022 AS Q6, and the report | "Many responses used the word 'sound proofing' which is not correct in the context of acoustic treatment. Sound proofing is a vague term at the best of times but refers to the reduction of transmission of sound through building structures." | the impulse must be sample-for-sample identical with the chip on and off |
| **Judge: too dead** | 2022 AS Q6, the report | "a control room does not want to be completely acoustically dead as this is an uncomfortable environment for most people" | the verdict must read `dead` |

The trap is the best-evidenced line on the bench: three reports name it in near-identical words. 2018 AS: "Many referred to the acoustic treatment as 'sound proofing' which is a completely different thing." 2022 AS, at length, quoted above. 2026 A: "candidates continue to refer to 'soundproofing' when answering questions about acoustics in music technology ... This cannot be seen in the picture, and thus cannot be credited."

Caveats encoded rather than smoothed over: **2021 A and 2024 AS have no examiner report** (none was published), so their preset's report field is genuinely empty rather than invented.

---

## 2 · Three stations, one stage, one console

A chip row chooses the station; the stage redraws and the console's middle sections are replaced. The frame, the depth switch, the drawer and the transport never move.

### Loudness

Four tones (100 Hz, 1 kHz, 3 kHz, 10 kHz) at one gain, and a listening-level chip (Quiet, 40 dB SPL; Loud, 90 dB SPL). **The bench's own sound is honest: every tone leaves at −20 dBFS, and the harness proves it within 0.02 dB.** The drawing tells the story and the line says the same thing.

The contours are **ISO 226:2003's own formula** with the standard's Table 1 of af, Lu and Tf at 29 frequencies, interpolated in log frequency. Not a sketch of the curves: `splAt(1000, phon)` returns `phon` to within 0.01 dB, which is the definition of the phon, and the unit test pins it.

**3 kHz is a fourth chip that the commission did not ask for.** The estate's own EQ chapter says "human hearing is most sensitive in roughly the 2 kHz to 5 kHz region ... the ear canal ... behaves as a quarter-wave resonator with a broad resonance in the region of 3 kHz". A bench offering only 100 Hz, 1 kHz and 10 kHz draws a curve whose minimum the student can see but cannot hear or land on. With 3 kHz the chapter's claim is a chip: at a quiet level a 3 kHz tone at the same setting seems 4 phon *louder* than the 1 kHz reference, while 100 Hz seems 28 phon quieter.

| At the same output level | 100 Hz | 1 kHz | 3 kHz | 10 kHz |
|---|---|---|---|---|
| Quiet (40 dB SPL) | 12 phon | 40 phon | 44 phon | 25 phon |
| Loud (90 dB SPL) | 76 phon | 90 phon | 92 phon | 78 phon |

The whole lesson is the first column: **28 phon of bass given up when quiet, 14 when loud.**

ISO 226 is tabulated to 12.5 kHz, so the curves stop there and the stage says so with a marked line rather than letting the gap read as a rendering fault.

### Masking

A target tone (1 or 2 kHz) at a fixed −30 dBFS, with a Target on/off chip so the student can check it is really there, under a band of noise one critical band wide. The masker sits **Below, On it, or Above** the target, because the lesson is the asymmetry, not the level.

The spread is the two-slope model: **27 dB per Bark downward**, and upward a slope of `−(24 + 230/f − 0.2·L)` dB per Bark, which flattens as the masker gets louder. Bark is Zwicker and Terhardt's 1980 critical-band rate; the band's width is Zwicker's critical bandwidth, which reproduces the EQ chapter's description ("roughly 100 Hz wide below about 500 Hz, and roughly a fifth of the centre frequency above"). The offset is 5.5 dB, the noise-masking-tone figure.

What that buys, and what no other picture on the estate shows: **a masker below the target takes it; a masker above it never does, at any level.** The unit test walks the whole masker range from above and asserts the target survives every one. That is the upward spread of masking, and it is the single strongest thing this station can show.

The bench never removes the target. It raises what the target has to beat, and the readout says by how much.

### The Room

A dry stem (snare or vocal) with four controls and a chip row.

**Reflection** is one delayed copy, 0.5 to 40 ms, summed with the direct sound. The response drawn is `10·log10(1 + a² + 2a·cos(2πfT))`, which is what the DelayNode and the sum really do, so the curve is the graph. The first notch sits at 1/(2T) and the rest at its odd multiples.

The range runs to **40 ms, not the 20 the commission named**, because the acoustics chapter's law is the 25 ms boundary and its own Check Your Understanding question is "Explain why a reflection delayed by 2 ms causes audible comb filtering but a reflection delayed by 80 ms does not". A slider that cannot cross 25 ms cannot demonstrate the thing the chapter examines. The boundary is marked in the line and in the judge.

**Tail** is a ConvolverNode whose impulse the model builds: white noise split into three bands by one-pole filters, each band under its own exponential `exp(−ln1000·t/T)`, which is exactly −60 dB at T. Three bands, because the chapter is explicit that "RT60 is not one number for the whole spectrum".

**The walls chip row is where the exam marks are.** Each chip sets the dial and three band factors:

| Walls | Dial | Low (under 250 Hz) | Mid | High (over 2 kHz) | Widest gap |
|---|---|---|---|---|---|
| Bare | 2.2 s | 2.31 s | 2.20 s | 2.02 s | 1.14 to 1 |
| Some panels | 1.1 s | 2.04 s | 1.10 s | 0.46 s | **4.42 to 1** |
| Treated | 0.6 s | 0.69 s | 0.60 s | 0.49 s | 1.40 to 1 |

That middle row is the 2024 scheme's line made audible: "Only reduces mid and high frequency reflections". A room with panels alone is dead in the top and boomy in the bass, and the chapter's own tip says so. Treated is panels *and* bass traps, and the whole spectrum comes down together. The stage draws all three decays, and a readout names the widest gap.

**Room level** is the reverberant-to-direct balance, which the chapter calls "the single most consequential acoustic decision in any recording" and which the commission's three stations left out. In a real session it is set by moving the microphone; the dial's title says so.

**Soundproofing** changes nothing in the audio graph: no node is added, no coefficient moves. A unit test asserts the impulse is sample-for-sample identical with the chip on and off, and the harness measures 0.01 dB of difference at the output. The A-level stage draws the one thing it *does* change, which is the path through the dividing wall to the room next door, because the chapter's Figure 4 is careful that soundproofing is a real job done in a real place.

---

## 3 · Three levels, three pictures

`data-stage` is `ear` / `paper` / `machine`, and the gate reads it.

- **Core, `ear`.** The station's own picture: the contours with the tone as a dot on them; the masker's skirt with the target as an upright line under it; the room's comb above and its three decays below. A short line names what is heard and says what to try. No arithmetic anywhere, and the depth test asserts no Core line ever says calculate, work out, divide or multiply.
- **A-level, `paper`.** The paper's own figure. For the Room that is the Q6 photograph read as a plan: source, mic, walls, the dividing wall, and what is on the other side of it, each box graded and clickable for its verdict. The one number the question wants sits at the foot of the stage, and which number that is follows the question: a comb question wants the first notch, a treatment question wants the reverberation time. "as directed" or "not yet" in the corner, as the Oscilloscope has it.
- **Extension, `machine`.** The nodes in signal order with what each is set to, and for the Room the answer the convolver holds drawn to scale beneath them.

The judge writes in the paper's order: what is there tagged AO3, what it does to the sound and whether it suits the job tagged AO4, with the scheme's or the report's own line and its year. Every A-level pair is under 450 characters and every Extension line under 330, both tested across every preset and every control.

---

## 4 · What the gates and the harness measured

**`npm test`: 377 tests pass**, 27 of them this bench's, in two files (the estate stood at 350 before it).

**`node scripts/check-bench.mjs`: all clear**, in Chromium and WebKit, at 1280×700 and 1440×900, against the built static export. Law 27 is new and belongs to this bench: the first notch's marker on the comb is the Delay dial. The canvas reports `data-notch-hz` and `data-rt60`, both equal the console's readouts, and dragging the marker to the right raises the notch and shortens the delay on both (63 Hz to 102 Hz, 8 ms to 4.9 ms).

Run against the dev server, law 9 fails the *other* benches, because Next.js serves every chunk on every route in development and this bench's chunk contains `createOscillator`. Against the built export all three pass. Gate a bench on the export.

**`node scripts/measure-acoustics.mjs`** — the listening harness. The three the commission asked for, and what they read:

| What | Wanted | Measured |
|---|---|---|
| The four tones at the destination | within 1 dB of each other | **0.01 dB** spread; and the listening chip moves the output by 0.00 dB, because it is a drawing |
| The comb's first notch, 5 ms reflection at −2 dB | at least 12 dB under its neighbours | **15.6 dB** on the vocal, **15.9 dB** on the snare, at 100 Hz where the model says it lands. The model's steady-state ideal is 18.8 dB |
| The tail's RT60 against the dial | within 15 % | **+9.9 %** at 1.5 s, **+13.2 %** at 2 s, **+5.5 %** at 2.5 s, **+6.3 %** at 3 s |

And four more it proves along the way:

| What | Measured |
|---|---|
| The masker from its floor to its ceiling | 21.0 dB louder |
| The target, switched on against off | 19.8 dB at 1 kHz and 0.0 dB a band away: only the target moved |
| Panels against bare walls | **−9.7 dB in the top, 0.0 dB in the low end.** The 2024 scheme's line, measured |
| Soundproofing on against off | **0.01 dB.** It is not an acoustic treatment |

The tail's tilt, bare to panels to treated: −8.5, then −18.2, then −15.1 dB. Panels tilt the room hardest; treated brings it back.

---

## 5 · What this bench cost, and the four traps for the next one

- **A per-band RT60 cannot be measured through these stems, and the harness says so rather than printing a number.** The snare rings 0.72 s of its own, which is longer than the top band of a treated room, and the low band of a panelled room outruns the gap between hits so it never falls. Both ends are pinned by the model's unit test instead, where each band is −60 dB at its own time by construction. The first cut of this measurement printed 21.87 s for a 4.63 s band and was cut.
- **Normalise a generated impulse by its ONSET, not by its energy.** The first cut normalised each answer to unit energy, and the harness then read a panelled room as 6.3 dB *louder* in the bass than a bare one, which is the opposite of what absorption does. Scaling by the RMS of the first 20 ms makes every room answer the source at one loudness, so the only difference between them is how long each band runs on. That is the physically right framing and it made the lesson measurable (0.0 dB instead of +6.3).
- **An impulsive source cannot be averaged like a sustained one.** Summing power across every analyser frame drags a comb measurement toward the noise floor, because most frames are the silence between hits. Throw away frames more than 20 dB under the loudest first. The same reading went from 10.1 dB to 15.9 dB of notch depth with no change to the bench.
- **Find an onset by its RISE, not by a level.** A fixed threshold misses the second hit of a pair as soon as the tail stops falling back under it, and a missed hit lands in the middle of the next fit and reads it long (+30 %). A jump of more than 9 dB inside 20 ms, gated to frames near the run's peak, finds every hit at every reverb time.
- **The stage is about 190 px of usable height at 1280×700.** Boxes sized in fixed pixels ran one row into the next on the first contact sheet. Every box height on this bench is a fraction of the stage's own, and the verdict word is drawn only when the box is tall enough for a third line; otherwise the grade is a coloured bar on the box's left edge.
- **A comb past a few kHz has more notches than the stage has pixels.** Drawing it as a polyline aliases into something that reads as a fault. Drawn as the highest and lowest the response reaches in each column, it is one line where the notches are further apart than a pixel and a band where they are not, which is what an analyser does.

## 6 · Registration and the retired page

`lib/resources/acoustics-bench.js` (kind `bench`, topic `2.1 Acoustics`, related `1.12 Reverb`, `1.2 Microphones`, `2.2 Monitor Speakers`, `1.11 EQ` — the estate names microphones 1.2, not 3.5), registered in `lib/resources/index.js` and `app/[resourceId]/ResourcePageClient.js`, added to the 2.1 band in `lib/topics.js` and to the free manifest in `lib/access.js`.

`/acoustics-psychoacoustics` is now a refresh stub (`app/acoustics-psychoacoustics/page.js`), the WO-08 pattern: a canonical for search engines and an http-equiv refresh for a person holding the old link. It is out of the registry, out of the 2.1 band and out of the free manifest; the sitemap derives from the registry. Its metadata file and component are left on disk unregistered, which is what the Subtractive Synthesis Explorer and Graphic vs Parametric EQ did before it.
