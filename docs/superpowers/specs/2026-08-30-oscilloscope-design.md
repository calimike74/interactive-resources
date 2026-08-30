# The Oscilloscope (2.5): design record

**Date:** 30 August 2026. **Status:** built and live at `resources.musictechstudio.co.uk/oscilloscope`, eighth bench to the Bench Standard, the second built in one day while Mike was away ("start working on the next few while I'm away ... focus on areas where we need to get an explore on"). Chosen from the ledger: 2.5 is the topic the examiner reports flag in every one of seven years, and its Explore band held a rail of three old cards with nothing at the bar; the ledger's own line was "a numeracy bench after the core".

## 1. What the topic is, and what the exam does with it

Numeracy is the arithmetic of sound: frequency and period, the octave as a doubling, decibels as a ratio, sample rate and bit depth and the file they make, tempo turned into time. The written paper prints a wave on graph paper marked in milliseconds and asks the same ladder every time: state the period in ms, state it in s, calculate the frequency, draw the pitch on a keyboard (2025 Q3(c)); calculate the period of a 200 Hz wave in seconds, then in ms (2026 Q1(d)); a note an octave higher than 294 Hz (2019 Q4(c)(ii): "294 × 2 (1); 588 (2); award 2 for 588 with no working"); draw a saw wave one octave lower than a 1 ms square (2023 Q2(e): "Saw wave (1); period of 2 ms (1)"); draw the same wave louder, and an octave lower (2025 Q3(c)(vi), (vii)); an LFO timed in quavers at 120 bpm (2020 Q3(a)(iv)); a 10 MB mono file made stereo, then stereo at 88.2 kHz and 24 bit (2024 Q3(b): "20 (1)", "60 (1)", "ignore working out").

The house laws bite here: no maths on screen at Core, a bench never asks the student to compute, sound first. So the numeracy is the bench's, never the student's: the period is a length on a screen, the octave is a halving of it you can see and hear, and the ladder is written out at A-level the way the scheme marks it.

## 2. The judgement: the paper's figure, on a screen you can hear

The stage is an oscilloscope: one sound drawn against time in milliseconds, five divisions across with "Displacement" up the side and "Time (ms)" along the bottom, which is the figure the paper prints. The trace is live from an analyser on the bench's own output, triggered on a rising zero crossing after a trough so the wave stands still. One cycle is bracketed in gold with its length in ms.

- **Sources** (`lib/bench/scope-model.js`): three recordings sealed into seamless loops (a bowed cello at 173.8 Hz, a plucked bass at 103.8 Hz, a sung vowel at 258 Hz, each pitch measured) and the four waveforms the paper draws (sine, square, saw, triangle) on oscillators, the topic's own object, declared with `synthesis`. A recording plays at its own pitch, harmonics and all; a waveform can be set to the paper's number (500 Hz, 294 Hz, 1 kHz, 200 Hz).
- **The octave** is a chip (Down · As played · Up): a recording goes up an octave by playing at twice the speed, the tape way, so the period halves because the samples go past twice as fast; an oscillator doubles its frequency. Either way the bracket halves.
- **The bracket is the control** (law 23, `check-bench`): drag its end and the wave stretches to that length and the note falls (`stretchTo`, within an octave either way; a chip resets it). `data-period` and `data-hz` on the canvas equal the console's readouts (`data-period-ms`, `data-hz`); dragging the handle right grows the period and lowers the frequency on both.
- **The time base** (1, 2, 5, 10, 50, 100 ms a division) changes the screen, never the wave: the judge says so when a preset's figure is set to a base that shows no whole cycle or too many. The slow settings are for the LFO, where the screen rolls and shows the envelope.
- **Level in dB** is height: +6 dB doubles the trace; the bracket does not move. **The LFO** (More row: off, crotchet, quaver, semiquaver at 120 bpm) is a tremolo on the sound, a wave slow enough to count. **The file** (More row: channels, rate, depth) is a size, not a sound; Extension multiplies it out.
- **Hold plays the sound as played**: octave off, stretch off, level 0, LFO off, so what the student changed is heard against the source.

## 3. Three jobs, three pictures

- **Core, `data-stage=scope`:** the screen with the trace, the bracket and its ms, the axis in the paper's words. The line names the source, its pitch as a note, one cycle every so many ms, how many cycles the screen shows, and the shape; and says what to try.
- **A-level, `data-stage=paper`:** the ladder beside the screen: waveform, period in ms, in seconds, f = 1 ÷ T, the pitch (with the 2025 scheme's "between B and C" wording when it sits between notes), then the octave, level or LFO line when one is set; the task's stem beneath; "as directed" or "not yet" in the corner. The judge answers the preset's question in the scheme's line with its year, AO3 then AO4.
- **Extension, `data-stage=digital`:** the trace drawn as the samples a converter keeps, dots at the file's sample rate (8 kHz is eight a millisecond and legible; 44.1 kHz runs together), and beneath it the file: channels × samples/s × bits = bits/s = kB/s, and the 2024 file as a bar against its 10 MB base.

## 4. The papers' questions as presets

Eight: **A real note** (the cello, the period as a length, the pitch as a note), **Read the period** (the 2025 figure: a square at 500 Hz at 1 ms a division, 2.5 cycles across), **294 Hz, an octave up** (2019), **An octave lower** (2023: the 1 ms square; the answer is Saw plus Octave down), **200 Hz** (2026: one cycle fills the screen), **Louder** (2025), **The LFO** (2020: the cello at 100 ms a division with the LFO on the crotchet; the answer is Quaver), **The file** (2024: the strip). Each is pinned to its verdict by a test (`tests/bench-scope-model.test.mjs`) and each judge line to its shape (`tests/bench-scope-depth.test.mjs`).

## 5. Audio

A new bench brings its own audio: three sustained notes generated on Mike's ElevenLabs account on 30 Aug, measured for pitch per 100 ms frame (`scratchpad scope/qc.py`) and the steadiest take of each kept, cut at rising zero crossings to the steady window and sealed into a loop with the tail crossfaded into the head over 60 ms (`scope/loop.py`), normalised to −3 dBFS. Credited under `scope/` in `docs/audio-credits.md`. The waveforms are oscillators, declared.

## 6. Measured (`scripts/measure-scope.mjs`, 30 Aug, headless Chromium at 48 kHz)

Two analysers in front of the destination: a short one (21 ms) for level, a long one (170 ms) for pitch by a 0.5 Hz DFT sweep with an octave check.

- **Level.** As played: cello −12.7 dB, bass −15.8, voice −12.7, sine −12.4, square −13.7, saw −14.0, triangle −12.5. The oscillators first ran 4 dB hotter than the recordings (sine −7.7) and +6 dB then ran into the master limiter (4.9 dB measured); their gains came down and +6 dB now measures 6.0 dB (square −13.7 then −7.7).
- **Pitch.** Cello 174.0 Hz (the file's 173.8), bass 103.5 (103.8), voice 257.5 (258), sine 250.0, square 500.0.
- **Octave.** The sine at 294 then 588 then 147 Hz with the chips; the cello 174.0 then 346.5 (× 1.99) at twice the speed.
- **Stretch.** The bracket dragged 60 px right on the 2025 figure: the period 2.00 to 2.41 ms on the stage, the sound at 414.5 Hz (1000 ÷ 2.41 is 414.9).
- **LFO.** Swells a second, counted as peaks of the level series at least 60 ms apart: quaver 4.34 (4 expected), crotchet 2.34 (2), semiquaver 7.67 (8), the cello's own small peaks adding the fraction; depth −8 to −47 dB. A first counter that crossed a mid-line read half, because the cello's level rises through a pass and the early swells never reached the line.

## 7. Gates

`node scripts/check-bench.mjs <url>` in Chromium and WebKit at 1280×700 and 1440×900: fixture `oscilloscope` (presets Read the period / Louder / judge "294 Hz, an octave up" landing `data-hz=294`; stages scope / paper / digital) and law 23. 306 unit tests across the estate (18 new: model and depth). Console at 1280: Play 104 + Source 200 + Pitch 190 + Screen 170 + Level 120 + Hear 494 = 1278.

## 8. Held, and what is not built

- **Unwalked by Mike.** As Valve, Plate, the Edit bench, the Balance Desk, the Lane and the Piano Roll.
- **The 2020 LFO scheme** is not in the vault, so its judge line is the arithmetic and the stem, not a quote.
- **The file is a size, not a sound.** No bit-crusher or downsampler: the sample rate and bit depth change the strip and the dots, and the line says so. Hearing them is 2.4's bench.
- **The Octave Period Trainer** stays on the resources site and in the 2.5 topic band; the member rail now leads with the Oscilloscope, then Tape & Heads, then the Waveform Drawing Explorer.
- **The pitch is a constant per source**, measured once; the bench does not track pitch live, so a stretched recording's readout is the arithmetic of the stretch, which the harness confirms within a hertz.

## First look (Mike, 30 Aug 2026, evening)

"You have the text that says 'drag the...' then stops." The Core line (175 characters) was clipped by 424 px at 1280 beside the setting's readout. Fixed the same evening: "the screen ·" dropped from the setting, the readout in a slot reserved at 20ch (31ch with the Hz), the Core and A-level lines cut to 107 characters, and the draw loop now reads the level from `depthRef` (its `maths` was the render's, one closure old, so Core still showed the Hz). Law 24 in `check-bench` holds every bench to it. Otherwise: "this is great".
