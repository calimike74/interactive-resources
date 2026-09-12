# Squared Paper (2.5): design record

**Date:** 12 September 2026. **Status:** built on branch `feat/squared-paper`, not pushed and not deployed. Tenth bench to the Bench Standard and the second for 2.5 Numeracy after the Oscilloscope. It replaces the 2024 Waveform Drawing Explorer (`/waveform-explorer`), which was silent, scrolled, and had no grid of its own; that id is a retired stub now (`app/waveform-explorer/page.js`), so the Week 01 Class Tasks page's "Finished early?" link still lands somewhere.

## 1. What the topic is, and what the exam does with it

A sweep of every 9MT0/04 and 9MT0/41 paper in the vault, 2018 to 2026, AS and A2, found that **every waveform-drawing and period-on-a-grid question in nine years is on the A2 paper**, and that a wave on a grid has run in seven of the eight A2 sittings (2019, 2020, 2022, 2023, 2024, 2025, 2026; 2021 substituted an ADSR and a filter grid). The grids are always labelled `Displacement` up the side and `Time (ms)` along the bottom with gridlines printed 1 2 3 4 5; the phrases "ms per division" and "time base" appear nowhere in any paper, so one division is 1 ms by the axis alone.

Two families, plus a numeracy strand:

- **A free-standing wave on the grid** (2023 Q2(e), 2024 Q4(a), 2025 Q3(c)(vi) and (vii)): draw a named shape at a named period, or the given figure changed, an octave lower, louder, or with its polarity inverted.
- **Clipping over a printed waveform** (2019 Q3, 2022 Q3(a)(iii)): "On top of the original waveform, draw the change in the waveform shape once distortion has been added." Not built here; see §8.
- **f = 1 ÷ T as arithmetic** (2019 Q4(c)(ii) the octave, 2020 Q3(a)(iv) the LFO, 2025 Q3(c)(ii) to (iv), 2026 Q1(d)), which the examiner reports flag every single year, the s to ms conversion by name in both 2025 and 2026.

The reports say the same three things go wrong, year after year: **"Very few candidates knew that an octave lower was double the period"** (2023); **"a very common error was drawing another square wave, not a saw wave"** (2023); **"Many candidates drew the same wave lower on the graph, i.e. with a negative DC offset"** (2023). And, on the same paper family, **"Some candidates only drew one cycle of the wave so did not score credit"** (2025) and **"Period was often labelled incorrectly as being the width of half a cycle rather than a complete cycle"** (2024).

The house laws bite here as they did on the Oscilloscope: no maths on screen at Core, a bench never asks the student to compute, sound first. So the numeracy stays the bench's: the student draws, the bench measures.

## 2. The judgement: the paper's own grid, handed over blank, then read and heard

The Oscilloscope shows a wave and lets you read it. Squared Paper is the opposite direction: it hands over the blank grid the exam hands over, asks for the answer, then plays what you drew and marks it the way the scheme does.

The stage is two grids side by side, both the paper's own figure. **Left, the FIGURE**: the question's printed wave, drawn by the bench. **Right and larger, YOUR ANSWER**: the same grid, blank. Draw on it with the pointer.

- **The question** is printed above the two grids at every level, numbered one of seven, with Back and Next question beside it (§7a).
- **The drawing is one displacement per column** (`COLS = 240`, 48 a division), so lifting and redrawing over a stretch replaces it, and the line is a function of time by construction. A `Clear` chip empties it.
- **The period** comes off the line by autocorrelation (`detectPeriod`): the run is detrended and normalised, lags from a tenth to six tenths of the grid span are scored as a normalised cross-correlation over both overlapping windows, and the shortest lag within a whisker of the best peak wins, so twice the period never answers for the period. A peak only counts as a period if the line troughs half way to it and comes back at twice it; without that a wave too wide for the paper scores well at the shortest lag and the bench answers five times too short (found by the listening harness, §6). The reading is then snapped to a tenth of a division, the way a candidate reads squared paper, so a 2 ms cycle reads 500 Hz and not 499.
- **The shape** is named by cross-correlating one detected cycle, mean removed, against sine, square, saw and triangle at every one of 64 phases and both polarities; a name is given at 0.8 or better. Both polarities because the 2023 scheme says "allow inverted saw wave" and the 2024 paper asks for an inversion on purpose.
- **The height** is half the peak-to-peak, which is amplitude measured centre line to peak, and the midline is the **DC offset**: the fault the reports name, measured separately from loudness, exactly as the Numeracy chapter insists ("Pitch lives in the horizontal spacing. Loudness lives in the vertical size. Neither lives in the vertical position.").
- **The keyboard route** is the console: the **Shape** chips fill the paper with a clean wave at the width and height already there, **Period** (Halve · As given · Double) works off the figure's own period, and **Height** is a dial in dB against the figure. A student who cannot use a pointer can reach every scheme answer.
- **Show answer** lays the scheme's wave over the drawing in dashed gold, so the difference in width, shape and height is a picture.
- **The paper** chip is 1 ms or 2 ms a division. The written paper always prints 1 ms; 2 ms exists because a 4 ms answer (2025 (vii)) or a 5 ms one (2026) needs two cycles of room to be read, and two cycles is also what the 2025 report credits. **This is the one departure from the paper's own figure, and it is deliberate.**

`data-period-ms`, `data-hz`, `data-shape`, `data-verdict`, `data-stage` and `data-paper` on the stage canvas; the console's readouts carry the same strings (law 27).

## 3. Three jobs, three pictures

- **Core, `data-stage=paper`:** the two grids and the drawing, with one cycle bracketed in gold and named "one cycle" but not measured. The line names the shape, the width in ms, how many cycles are on the paper, and how it compares to the figure ("twice as wide: an octave lower"), then says what to try. No arithmetic on the screen.
- **A-level, `data-stage=marked`:** a marks panel beside the paper. Every mark in the scheme's own wording with the year in the panel's head, ticked or not, each with what the bench measured beneath it (the question's own stem stands above both papers, at every level, since 12 Sep; see §7a); then the ladder, `T = 2.00 ms = 0.002 s   f = 1 ÷ T = 500 Hz`; and "as directed" or "not yet" in the corner. On the paper itself the bracket gains its number and an amplitude arrow appears from the centre line to the peak, which is what 2024 Q4(a) asks a candidate to label. A DC offset is drawn as a coral dashed line where the wave actually sits.
- **Extension, `data-stage=harmonics`:** the drawn cycle's first eight harmonics as bars beside the named shape's ideal ones, from a DFT of the one cycle. A square shows the odd harmonics only, a saw every one falling as one over its number. This is the tie to Synthesis chapter 1, the four waveforms by harmonic content, which the class reads the same week.

## 4. The papers' questions as presets

Eight, each pinned by a test in `tests/bench-paper-model.test.mjs`, and each judge line pinned in `tests/bench-paper-depth.test.mjs`:

| Preset | Paper | The figure | The scheme |
|---|---|---|---|
| 2023: an octave lower | 2023 Q2(e)(ii) | square, 1 ms | "Saw wave (1) (allow inverted saw wave)"; "Period of 2ms (1)"; "Accept DC offset. Accept different amplitude" |
| 2025: louder | 2025 Q3(c)(vi) | square, 2 ms | "Award 1 mark for a louder square wave with period of 2ms and no DC offset" |
| 2025: an octave lower | 2025 Q3(c)(vii) | square, 2 ms, 2 ms a division | "Award 1 mark for a square wave with same amplitude as figure 1 and period of 4ms and no DC offset" |
| 2024: label it | 2024 Q4(a) | none, the grid is blank | "Waveshape (1)"; "Voltage / V / displacement (1)" and "s / ms / time (1)"; "amplitude (1). Allow peak to peak amplitude"; "Period (1)" |
| 2026: 200 Hz | 2026 Q1(d) | none, 2 ms a division | "1/200 (1)"; "0.005 / 5x10-3 (1). Award 2 marks for 0.005 with no working"; then "5 (1)" |
| An octave higher | the Numeracy chapter, Drawing an Octave | sine, 2 ms | "An octave lower doubles the period. An octave higher halves it" |
| Judge: the period kept | 2023 Q2(e)(ii) report | square, 1 ms | arrives with a saw already drawn at 1 ms: the right shape at the wrong width, one mark of two |
| Blank paper | none | none | no question; the bench reads the drawing back |

A test also draws the bench's own answer on every paper preset and asserts its own marking passes it, and asserts that every scheme answer gets two cycles of room on the paper it is set on.

## 5. Audio

No files. The figure and the scheme's answer sound on oscillators, the topic's own object (the paper asks you to identify and draw the four shapes), so the bench declares `synthesis`; the drawing sounds as **one detected cycle resampled into an AudioBuffer exactly `sampleRate × period` long, looped**, so the pitch you hear is the width you drew. Three targets on the Hear row: The figure, Yours, The answer. Yours is disabled with a title saying why until a period is readable; The figure is disabled on a question that prints none.

**The three play at one level on purpose.** The buffer is normalised to the RMS the Oscilloscope's four measured oscillator gains come to (0.245), so the ear is comparing pitch and shape rather than loudness. Louder is a height you read off the grid and the bench writes in dB beside the paper, which is the distinction the 2025 report says candidates lose marks on. The Reference drawer says so in as many words.

The `hold` button plays the question's own figure while held, so a drawing and the figure can be compared by ear.

## 6. Measured (`scripts/measure-paper.mjs`, 12 Sep, headless Chromium)

| Reading | Result |
|---|---|
| The figure, level | −17.9 dB mean |
| Yours, level | −16.5 dB mean |
| The answer, level | −18.1 dB mean |
| Spread across the three | **1.59 dB** (the bench claims under 3) |
| A square drawn at 2 ms, played as Yours | stage 2.00 ms / 500 Hz; **heard 500.0 Hz** |
| The same square an octave lower (4 ms, 2 ms a division) | stage 4.00 ms / 250 Hz; **heard 250.0 Hz**, ratio 2.00 |
| 2023: an octave lower, answered by the chips | saw · 2.00 ms · 500 Hz · directed; heard 500.0 Hz |
| 2025: louder, answered by the chips and the Height dial | square · 2.00 ms · 500 Hz · directed; heard 500.0 Hz |
| 2025: an octave lower | square · 4.00 ms · 250 Hz · directed; heard 250.0 Hz |
| An octave higher | sine · 1.00 ms · 1000 Hz · directed; heard 1000.0 Hz |
| The four shapes drawn by hand with the mouse, four cycles | each read as itself; 1.20 ms; heard 827.5 Hz at −16.5 dB |

**What the harness caught that the gate could not.** Drawing one and a quarter cycles of a 4 ms square on a 5 ms paper made the bench report 0.50 ms with confidence, because the flat stretches of a square match each other at any short lag and the true period was outside the search range. The fix is the trough-and-return test in §2, and a test pins it (`a wave too wide for the paper is refused, not answered with a period five times too short`). The same pass showed the harness's own scenario was wrong: a 4 ms answer needs the 2 ms paper, which is what the 2025 preset does.

## 7. Gates

- `npm test`: **385 tests, all passing** (35 of them new, across `tests/bench-paper-model.test.mjs` and `tests/bench-paper-depth.test.mjs`).
- `npm run build`: compiled successfully; `/squared-paper` prerenders.
- `node scripts/check-bench.mjs http://localhost:PORT/squared-paper`: **all clear in Chromium and in WebKit**, at 1280×700 and 1440×900. Point it at the built export (`npx next build`, then serve `out/` with clean URLs, the way the site is served): the dev server fails law 9, and a `.html` URL fails both the fixture lookup and the client router. Fixture `squared-paper`: presets 2023: an octave lower / 2025: louder, judge `Judge: the period kept` landing `data-verdict = period-kept`; stages `paper` / `marked` / `harmonics`.
- **Law 27** added to `check-bench`, for this bench: Clear takes the paper back to `data-verdict = blank`; the Square chip fills it and the canvas and the console agree on shape, period and frequency; and a wave dragged across the answer paper with the mouse is read back, the console following (`sine · 1.10 ms · 909 Hz` in both engines).
- **Law 24 strengthened for every bench**: the stage note's orientation sentence must not be empty. Squared Paper's was, at Core, because the sentences were keyed by the depth's name and looked up by the stage's. The law now reads the text; the estate's eleven benches were re-run under it and are all clear.
- `npx eslint` on every file touched: clean.
- Screenshots at 1280×700 and 1440×900 in the session scratchpad, looked at: the three stages, the 2023 preset blank and answered, the judge preset with Show answer, the 2025 octave-lower on the 2 ms paper, a hand-drawn 2024 answer, and the drawer.

**What looking caught that no gate did:** the figure never drew at all, because `GIVENS` carry no `offset` key and `undefined` in the y arithmetic makes the whole path NaN. Then: the stage note, the legend, the paper titles and the setting line all shared one row, so the top of the stage was unreadable; the setting line moved to the foot and the papers dropped clear. Then: the marks panel drew the question's stem right-aligned (the verdict word above it had left `textAlign` set to `right`) so it ran across the answer paper, and drew the **first render's** question rather than this frame's, so the 2024 preset showed the 2023 stem and header. All four are the kind of fault `check-bench` reads as passing.

## 7a. Mike's first look, 12 September: the question, the walk, and the silent open

Three things, and his words for them. **"I'm not really understanding what this could be used for ... you're not very accurate with your instructions on this. It's very difficult to see what this is."** **"If I get something wrong, how do I go to the next question?"** **"I have to hear a tone, and if this is going to resemble the actual paper, we're not hearing a tone."**

- **The question is on the stage at every level.** It was only ever in the A-level marks panel; at Core the student saw a "Try:" hint and two blank grids. Now the row above the papers carries the number ("Question 1 of 7"), the paper's own reference ("2023 Q2(e)(ii)") and the question in the paper's words, at 15 px, at Core, A-level and Extension alike. `stemOf(state)` in `paper-model.js` is the only place that wording lives, so the stage and the panel cannot drift; the panel prints the marks alone now, which is also the room the 2024 question's fourth mark needed. Two stems were rewritten to read as one line: the 2023 one drops the parenthetical the figure already shows, and the 2026 one asks for a wave at 200 Hz rather than for a calculation, because a bench never asks a student to compute.
- **The seven papers are a numbered walk.** `QUESTION_IDS`, `stepQuestion` and `nextWord` make the presets a sequence in the order they sit on the row; `Back` and `Next question` stand at the right of the question's line, reachable by keyboard. Next clears the drawing and Show answer and keeps the level, the mode and the output level, because it is `applyPreset` underneath. At 7 of 7 Next reads **"Start again"** and returns to one rather than going dead, so a keyboard walk never dead-ends; from the blank paper it reads "Question 1". Back is disabled on the first question. The chips carry the number too ("1 · 2023: an octave lower"), and the blank paper stays outside the count. `data-question="3/7"` on the stage canvas, and `check-bench` law 27 walks it.
- **The bench opens silent, and that is the paper's own behaviour.** The "Play the bench" overlay is gone from this bench only: the written paper hands over a grid and a pencil, not a tone, so the grid is drawable the moment the page loads. The AudioContext is built by the first press of a Hear target or of the hold button, and that press both starts it and plays, so law 5 ("no AudioContext before a deliberate action") holds exactly as before. Sound here is the payoff after drawing, not a precondition for it. `check-bench` presses the console's own Play button where a bench has no overlay, and `measure-paper` does the same; the harness read the same table after the change as before it.

What the question's row cost the picture: the papers start 14 px lower, the legend moved from the top right to the foot beside the setting line (the setting drops segments until it clears it), and the marks panel lost its copy of the stem. Measured at 1280×700 and 1440×900, every question at every level: the question's line reads whole in both sizes, and `check-bench` is clear in Chromium and in WebKit.

## 8. Held, and what is not built

- **The clipping family is not built.** 2019 Q3 and 2022 Q3(a)(iii) ask a candidate to draw a distorted waveform on top of a printed one, scored 2 for correct clipping and 1 for "clipped at different amplitude levels, rather like a bitcrusher". That is a different picture (a drawing over a given trace, marked on where it flattens) and belongs either here as a second family or on the Distortion bench the ceiling scan already lists as a gap. Mike's call.
- **2024 Q4(b) and (c)** (the same wave with the polarity inverted, and the silence when the two are added) are quoted in the Teacher drawer but are not a preset. The model already names an inverted saw, so the detection exists; the preset and the "play both and hear silence" moment are a small addition if Mike wants them.
- **2020 Q3(a)(v)** (draw the LFO's wave, label the axes, the amplitude and the period) is the same shape as 2024 Q4(a) and is covered by that preset rather than duplicated.
- **The 2 ms a division chip** is not on the written paper. It is here so a 4 ms or 5 ms answer can show two cycles. If Mike would rather the bench refuse those questions than open the paper, the chip goes and two presets go with it.
- **Level in dB** was read as the drawn wave's height against the figure's, reported in the console and driven by a dial, rather than as an output level in dB. The play column keeps the kit's own output slider.
- **Not pushed, not deployed.** `resources.musictechstudio.co.uk` is unchanged.
