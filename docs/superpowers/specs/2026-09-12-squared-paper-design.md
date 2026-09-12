# Squared Paper (2.5): design record

**Date:** 12 September 2026. **Status:** built on branch `feat/squared-paper`, not pushed and not deployed. **Not a bench**: an exam page, and the first of its kind on the site (see §2 for why, and the Bench Standard's addendum of the same day). The second resource for 2.5 Numeracy after the Oscilloscope, which is a bench and stays one. It replaces the 2024 Waveform Drawing Explorer (`/waveform-explorer`), which was silent, scrolled, and had no grid of its own; that id is a retired stub now (`app/waveform-explorer/page.js`), so the Week 01 Class Tasks page's "Finished early?" link still lands somewhere.

## 1. What the topic is, and what the exam does with it

A sweep of every 9MT0/04 and 9MT0/41 paper in the vault, 2018 to 2026, AS and A2, found that **every waveform-drawing and period-on-a-grid question in nine years is on the A2 paper**, and that a wave on a grid has run in seven of the eight A2 sittings (2019, 2020, 2022, 2023, 2024, 2025, 2026; 2021 substituted an ADSR and a filter grid). The grids are always labelled `Displacement` up the side and `Time (ms)` along the bottom with gridlines printed 1 2 3 4 5; the phrases "ms per division" and "time base" appear nowhere in any paper, so one division is 1 ms by the axis alone.

Two families, plus a numeracy strand:

- **A free-standing wave on the grid** (2023 Q2(e), 2024 Q4(a), 2025 Q3(c)(vi) and (vii)): draw a named shape at a named period, or the given figure changed, an octave lower, louder, or with its polarity inverted.
- **Clipping over a printed waveform** (2019 Q3, 2022 Q3(a)(iii)): "On top of the original waveform, draw the change in the waveform shape once distortion has been added." Not built here; see §8.
- **f = 1 ÷ T as arithmetic** (2019 Q4(c)(ii) the octave, 2020 Q3(a)(iv) the LFO, 2025 Q3(c)(ii) to (iv), 2026 Q1(d)), which the examiner reports flag every single year, the s to ms conversion by name in both 2025 and 2026.

The reports say the same three things go wrong, year after year: **"Very few candidates knew that an octave lower was double the period"** (2023); **"a very common error was drawing another square wave, not a saw wave"** (2023); **"Many candidates drew the same wave lower on the graph, i.e. with a negative DC offset"** (2023). And, on the same paper family, **"Some candidates only drew one cycle of the wave so did not score credit"** (2025) and **"Period was often labelled incorrectly as being the width of half a cycle rather than a complete cycle"** (2024).

The house law bites here as it did on the Oscilloscope: a resource never asks the student to compute. So the numeracy stays the page's: the student draws, the page measures.

## 2. Mike's 12 September verdict, and why the bench frame was the wrong shape

The first build of this was a bench: the Bench Standard's frame, with a stage, a console of chips and dials, a Student and Teacher switch, a Core, A-level and Extension switch, and sound. Mike looked at it three times in one day and each look took a layer off.

1. **"I'm not really understanding what this could be used for ... you're not very accurate with your instructions on this. It's very difficult to see what this is. If I get something wrong, how do I go to the next question?"** The question's wording lived in the A-level marks panel, so at Core a student saw two grids and a hint; and the papers were presets on a row, not a sequence.
2. **"We don't need to hear anything."** And: "the problem with it is that I have to hear a tone, and if this is going to resemble the actual paper, we're not hearing a tone."
3. **"I don't want you to have one model for 3D and one model for 2D that you're just going to copy and paste new ideas into. I think it's a really good idea that the resources that the student has are going to reflect the actual task in front of them, rather than this fitting into something that doesn't really make sense."**

The third is the one that settles the shape. A bench models a piece of studio kit you work: a delay, an EQ, a synthesiser, an oscilloscope. The frame is right for those because the student is turning the thing's own controls. A drawing question is not a piece of kit. The task in front of the student is **a sheet of paper with a question on it and a grid to draw on**, so that is what the resource is. Everything the bench frame was giving it (a stage, a console, a drawer, two toggles, a transport) was furniture in the way of a pencil.

So Squared Paper leaves the bench estate. The Bench Standard keeps the other ten; this page keeps the engine that measures a drawing, which was the good half of the bench, and its own gate.

## 3. What the page is

One sheet of paper, 820 px wide, on a dark desk, and nothing else on the screen but the way home and one strip of controls.

On the sheet, in the paper's own order:

- **The sheet's head:** "Question 3 of 12" at the left, and at the right where the question comes from ("2023 Q2(e)(ii)", or "Practice, in the shape of 2023 Q2(e)(i)" where it is not a paper question). A question never claims to be a paper question that is not one, and a test pins that.
- **Figure 1**, where the paper prints one: the question's wave on its own grid at 13 px a square, with the caption the paper gives it.
- **The question:** the part label hanging at the left ("(e) (ii)"), the stem in the paper's own words, and the marks in brackets at the right ("(2)"). A question that is a bulleted list (2024 Q4(a)) is printed as one, with the marks against each bullet, as the paper prints it.
- **The answer grid:** 25 small squares across, five to a division, 20 down, the zero line heavy through the middle and the left edge heavy, the divisions numbered 1 to 5 just under the zero line, "Time (ms)" at the end of that line and "Displacement" turned up the side. 20 px a square, so the grid is 500 by 400. The student draws on it with the pointer, one height per column, in pencil grey.
- **The marking**, after Check (§5).

Under the sheet, one strip, held at the foot of the window: `← Back` · `Question 3 of 12` · `Next →` · `Check` · `Clear`. Nothing else. It fades out of the way while the pointer is drawing, because on a question that prints a figure the grid can run under it.

The page may run taller than the window and scroll. It is a page, not a bench: that is the point.

## 4. The twelve questions, in teaching order

The four waveforms first, drawn from a blank grid, because that is the practice Mike asked for ("especially different waveforms, as opposed to the exact same waveform or a waveform that's an octave higher or lower"). Then the changes to a given figure. Then the papers' own questions, in the papers' own words.

| # | Source | The question | Figure | Grid | Marks |
|---|---|---|---|---|---|
| 1 | Practice, in the shape of 2023 Q2(e)(i) | a sine wave with a period of 2 ms | none | 1 ms | Sine wave (1); Period of 2ms (1) |
| 2 | **2023 Q2(e)(i)**, verbatim | a square wave with a period of 1 ms | none | 1 ms | Square wave (1); Period of 1ms (1) |
| 3 | Practice, same shape | a saw wave with a period of 2 ms | none | 1 ms | Saw wave (1); Period of 2ms (1) |
| 4 | Practice, same shape | a triangle wave with a period of 1 ms | none | 1 ms | Triangle wave (1); Period of 1ms (1) |
| 5 | Practice, in the shape of 2025 Q3(c)(vii) | the same wave an octave higher | sine, 2 ms | 1 ms | Sine wave (1); Period of 1ms (1) |
| 6 | Practice, same shape | the same wave an octave lower | square, 1 ms | 1 ms | Square wave (1); Period of 2ms (1) |
| 7 | **2025 Q3(c)(vi)** | the same wave, but louder | square, 2 ms | 1 ms | "Award 1 mark for a louder square wave with period of 2ms and no DC offset" |
| 8 | **2024 Q4(b)**, with the figure printed for you | the same wave with the polarity inverted | saw, 2 ms | 1 ms | "Credit graph of the same waveform but in reversed polarity (1)" |
| 9 | **2023 Q2(e)(ii)** | a saw wave one octave lower | square, 1 ms | 1 ms | "Saw wave (1) (allow inverted saw wave)"; "Period of 2ms (1)" |
| 10 | **2025 Q3(c)(vii)** | the same wave an octave lower | square, 2 ms | 2 ms | "Award 1 mark for a square wave with same amplitude as figure 1 and period of 4ms and no DC offset" |
| 11 | **2024 Q4(a)** | draw a square wave, label the axes, the amplitude and the period | none, and a bare grid | 1 ms | "Waveshape (1)"; "Voltage / V / displacement (1)"; "s / ms / time (1)"; "amplitude (1). Allow peak to peak amplitude"; "Period (1)" |
| 12 | **2026 Q1(d)**, drawn rather than calculated | a wave with the period of a 200 Hz wave | none | 2 ms | A wave with a period of 5 ms (1) |

Then **the blank paper**, thirteenth and last: no question, no marking, and Check reads the drawing back ("You drew a triangle wave, one cycle every 1.25 ms, which is 800 Hz").

Two departures from the papers, both deliberate and both said on the sheet. **2024 Q4(b)** asks for the inversion of the wave the candidate drew in part (a); the page prints a saw at 2 ms as Figure 1 instead, so the question stands on its own. **2026 Q1(d)** asks for the arithmetic (1/200, then 0.005 s, then 5 ms); the page asks for the wave instead, because a resource never asks a student to compute, and prints the paper's own arithmetic under the marking.

The 2 ms grid on questions 10 and 12 is the one thing on the page the written paper does not print. A 4 ms or a 5 ms answer needs two cycles of room to be read, and "some candidates only drew one cycle of the wave so did not score credit" (2025 report). A test asserts every scheme answer has two whole cycles of room on the grid its question sets.

## 5. Check, and what the marking says

Before Check the page is just the paper. Check marks it the way a script comes back:

- **A tick or a cross in the margin a mark**, in red pen, with the scheme's own wording beside it and what the page measured underneath ("you drew 1.00 ms, and the scheme wants 2.00 ms").
- **The total beside the marks bracket**: "(2)" and under it "1/2" in red.
- **The model answer** laid over the grid in red dashes, except where the scheme accepts any period (2024 Q4(a), 2026 Q1(d)), which has no single answer to draw.
- **The ladder**, once there is a period to read: `T = 2.00 ms = 0.002 s   f = 1 ÷ T = 500 Hz`.
- **The scheme's own allowances** where it makes them ("Accept DC offset. Accept different amplitude.").
- **One examiner line, only when a mark is lost**, from the report for that question: "Very few candidates knew that an octave lower was double the period. (2023 examiner report)". Each one is quoted from the report in the vault, and a test asserts every report line names its year.

There is no level switch. The marking is the A-level content, and it arrives when the student asks for it.

**One scheme line is one mark entry**, and an entry is earned when every criterion it names is met. That is how a one-mark line which asks for four things at once ("a louder square wave with period of 2ms and no DC offset") is marked the way the scheme marks it, while a two-mark question is marked as two lines that can be lost separately. The criteria are shape, period, polarity, louder, same amplitude, amplitude drawn, no DC offset, and the two axis labels.

**Question 11 earns its axis marks.** 2024 Q4(a) prints a grid with nothing on it at all, because labelling the axes is two of its five marks, so this question prints the same bare grid: no axis names and no division numbers. Two write-in boxes stand beside the vertical axis and under the horizontal one, and Check reads what the student wrote as words, against the scheme's own list ("Voltage / V / displacement", "s / ms / time", plus the scheme's "Allow volume / level / amplitude / dB" and pressure, which is the same quantity by another name). So "time in ms" scores and "frequency" or "Hz" does not, which is the mistake the 2024 report names on the y-axis. The amplitude and the period cannot be written in with a pointer, so Check labels them on the student's own wave in red, an arrow from the centre line to a peak and a bracket over one cycle, and the margin says "labelled for you here; on paper you write these in". Those two are ticked only when the wave has a readable period and a height to measure.

## 6. The engine

`lib/bench/paper-model.js` is the half of the bench worth keeping, and it is unchanged in its measuring:

- **The drawing is one displacement per column** (`COLS = 240`), so lifting and redrawing over a stretch replaces it, and the line is a function of time by construction.
- **The period** comes off the line by autocorrelation (`detectPeriod`): detrended and normalised, lags from a tenth to six tenths of the grid scored as a normalised cross-correlation over both overlapping windows, the shortest lag within a whisker of the best peak winning so twice the period never answers for the period, and a peak only counted as a period if the line troughs half way to it and comes back at twice it. Without that last test a wave too wide for the paper reads five times too short, which a test pins.
- **The reading is snapped to a tenth of a division**, the way a candidate reads squared paper, so a 2 ms cycle reads 500 Hz and not 499.
- **The shape** is named by cross-correlating one detected cycle, mean removed, against sine, square, saw and triangle at 64 phases and both polarities, at 0.8 or better. Both polarities because 2023 allows an inverted saw and 2024 Q4(b) asks for an inversion on purpose.
- **The height** is half the peak to peak, measured centre line to peak, in dB against the figure's own; the midline is the **DC offset**, measured separately from loudness, which is the fault the reports name.

Gone with the bench: the audio graph, the harmonics (they were Extension's picture), the pitch name, and `paper-depth.js`, which held the three levels' copy. The scheme wording and the examiner lines it carried now live on the questions.

## 7. Gates

- `npm test`: **370 tests, all passing**, of which 20 are `tests/squared-paper.test.mjs`. One draws the scheme's own answer on every one of the twelve and asserts the marking passes it; others pin the errors the reports name (the period kept, another square wave, the same height, the upright saw) and the walk.
- `npx next build`: compiled, 196 static pages, `/squared-paper` prerenders.
- `node scripts/check-paper.mjs <url>` against the built export (served by `scripts/serve-out.mjs`): **all clear**. Every question renders with its stem, part label and marks bracket; nothing is clipped at 1280 wide; Back and Next walk 1 to 12 and the blank paper and neither wraps; the scheme's answer drawn with the pointer and checked scores full marks on all twelve; question 11 scores 3 of 5 with the axes blank, 5 of 5 written in and 4 of 5 with "Hz" on the vertical axis; the marking scrolls clear of the floating strip at 1280 by 700; a wrong answer is crossed in the scheme's words with the examiner's line; no em-dash and no "utilise" reach the page.
- `node scripts/check-bench.mjs` on the ten remaining benches: **all clear**. Squared Paper's fixture and law 27 are out of that script.
- Screenshots at 1280 wide of questions 1, 6, 9 and 11, before and after Check, looked at.

**What looking caught on the second pass:** Figure 1's division numbers still sat on the axis line under the square wave's verticals and could not be read, so every grid's numbers now sit a little lower on a paper-white halo and read through a line; and the page's foot is now `the strip's height + its offset + a margin`, measured by the gate at 1280 by 700 so the last mark line and the examiner's box can always scroll clear of the floating strip.

**What looking caught that no gate did:** the figure's division numbers at 8 px sat on the axis line and were buried by the wave crossing them (the labels are drawn last now, and never smaller than 10 px); the bulleted question printed its total bracket in a second column beside the bullets' own, which read as a second set of marks; the model answer was drawn over a question that accepts any period, which made a right answer look wrong; and a period mark that was earned still said "and the scheme wants 2.00 ms".

## 8. What is not built, and what was taken out

- **The keyboard route is gone.** The bench had Shape, Period and Height chips that filled the grid, which was the route for a student who cannot use a pointer. Mike took the console out on 12 Sep; the drawing is the pointer only for now. If it comes back it belongs on the sheet as a small "fill the grid" control, not as a console.
- **No sound.** Mike: "we don't need to hear anything." The paper has no tone.
- **The clipping family is not built.** 2019 Q3 and 2022 Q3(a)(iii) ask a candidate to draw a distorted waveform on top of a printed one, scored 2 for correct clipping and 1 for "clipped at different amplitude levels, rather like a bitcrusher". That is a drawing over a given trace, marked on where it flattens: a thirteenth question, or the Distortion resource the ceiling scan lists as a gap. Mike's call.
- **2024 Q4(c)** (what happens when a wave and its inversion are added) is a written answer, not a drawing, so it is not a question here. It sits one step beyond question 8.
- **The resource is still registered as `kind: 'bench'`** in `lib/resources/squared-paper.js`, which is what gives it the whole page with no site header and no footer. The field is the site's word for "this resource draws its own chrome", and changing it would wrap the sheet in furniture. Worth renaming across the site one day; not today.
- **Not pushed, not deployed.** `resources.musictechstudio.co.uk` is unchanged.
