# The Balance Desk (1.13): design record

*29 Aug 2026. Fifth bench to the Bench Standard, after Delay, EQ, Dynamics and Edit. Built on Mike's "let's move on to the next one for the balance desk" and the four answers below, decided by recommendation. Governs `components/resources/BalanceDesk.jsx`, `lib/bench/balance-model.js`, `lib/bench/balance-depth.js`, `public/bench-audio/balance/`.*

## 1 · What a student does

Five stems of one song arrive the way the exam supplies them: each file trimmed by the examiner to a deliberately wrong level, every fader at unity. The student presses Play, hears a wrong balance, and balances by ear: fader, pan and one send to a shared reverb on each of five strips. They hold the play column's button and hear the reference on the same beat; they let go and hear how far theirs is from it. The bench tells them what it heard, in the scheme's own lines, never as a mark.

## 2 · The four answers

1. **Diagnostic or practice?** Practice, returned to before every mock. The diagnostic moment is the first press of Compare.
2. **Whose reference?** A state, not a file: six numbers per part (fader, pan, send). Until Mike mixes it on the bench, the reference is the track as released (the stems at unity, which is what Suno's stems sum to), labelled as such.
3. **How many stems?** Five, as every A-level Q5 since 2019 ("all five parts"): vocal, drums, bass, backing vocals, synth. The song chose the cast: Paper Kites' guitar is absent in the only window where the other five all play.
4. **Mark or describe?** Describe, in the 2025 band's lines: three ("Balanced and blended across all parts of the mix. Vocals sit on top of mix"), two ("Most tracks are balanced with some masking. A few misjudgements"), one ("Balanced so that one track is barely audible or is too dominant"), none ("Not all tracks present"). The desk reports the line the mix sits on. No number is awarded.

## 3 · The trap lives in the graph, not the faders

The exam's stems are mastered at wildly varying volumes so that the candidate must listen rather than read the faders. The desk reproduces that exactly: `SONGS.kites.supplied` is a fixed gain per strip between the source and the fader (vocal −9, drums −6, bass +6, backing vocals +5, synth +9, the 2025 paper's shape with the 2018/2020/2023 drums, the 2019 backing vocals and the 2023/2025 synth). The faders start at 0 dB and the sound is wrong. The trims are invisible at Core and A-level and drawn at Extension (the ladder), which is the bench opening the machine.

The files themselves are the release. Cutting them (scratchpad `balance/cut.py`) applied one pack-wide gain and 4 ms edge fades and nothing else, so the stems at unity are the track as Suno mixed it, and the reference is `fader = −supplied` for every part.

## 4 · Levels for the ear

"Vocals sit on top" is prominence, not RMS: the released mix has the drums 8 dB over the vocal on a meter and the vocal on top for the ear, and the 2020 scheme says so ("Vocals sit on top of mix and drums are equal or louder"). So every level on the desk is the part's nine band densities (measured from the samples) turned into energies and weighted by a coarse A-curve (`EAR_DB`), plus the trim, plus the fader. The plan's block heights, the list at the right, the ladder and the judge all read that one number. The live meters weight the analysers the same way.

Masking is between pitched parts only (the kit shares every band with everything). Two parts fight for a band when both are prominent there and within 6 dB of each other, the score fading out over the gap; panning them apart relieves it. The judge counts only what the student added over the release's own overlap (`maskingExtra`), because a vocal and its backing vocals share a region by design.

## 5 · Three levels, three pictures

- **Core, the plan (`data-stage="plan"`).** Each part a block: x is pan, height is level for the ear, the base rises with the send (further back). A live meter fills each block. The list at the right orders the parts loudest first and says whether the vocal is on top. While the reference is held its blocks appear dashed; otherwise the answer is never drawn, because the point is listening. Dragging a block is the fader (up and down) and the pan (sideways); the strip follows (law 20).
- **A-level, the spectrum (`spectrum`).** The plan above; below it, every part's live spectrum on one log axis, with the pair that fights beyond the release shaded coral and named. Before Play, the model's stepped bands stand in so the picture exists first. The bench's line judges in AO3 and AO4 segments and quotes the scheme's line.
- **Extension, the ladder (`ladder`).** The plan above; below it, for each part: the file's level, the trim (coral up, blue down), the fader (white) and what is heard, with the four numbers written out. The More row's Mono chip folds the pans to the centre; the line explains what returns.

## 6 · Presets: the paper's faults as states to judge

As supplied (the trap, band 1 on the scheme because the synth dominates) · Drums too quiet (band 2; 2018, 2020, 2023) · As on the CD (bass and backing vocals loud, band 2; 2019) · Synth over the vocal (band 2; 2023, 2025's two-mark example) · Vocal buried (band 1) · The reference (band 3). `tests/bench-balance-model.test.mjs` pins each preset to its band.

## 7 · Audio

`public/bench-audio/balance/kites-*.mp3`: bars 22 to 25 of "Paper Kites" (Suno, Mike's account, July 2026, for the C3 Aural Trainer; raw stems still in `~/Downloads/Paper Kites Stems (100BPM)/`), the one window where vocal, backing vocals, drums, bass and synth all play. 9.6 s at 100 bpm; the scheduler's bar is the loop (`bpm = 240 / 9.6`). The mp3s' encoder delay is read off the decoded length at load and skipped. Mike's next Suno track (pop-rock, male vocal, rhythm guitar, chorus synth, per the adapted SUNO-BRIEF prompt) lands as a second song with its own `supplied` and `reference`.

## 8 · Gate

`scripts/check-bench.mjs` fixture `balance-desk`: law 14 (Drums too quiet, Synth over the vocal, The reference landing the vocal fader at +9), law 18 (plan / spectrum / ladder), law 20 (new: `data-fader` equals the Vocal fader's `aria-valuenow`; dragging the vocal block up raises it and the strip follows; `data-band` reported). Chromium and WebKit, 1280×700 and 1440×900.

## 9 · Held for Mike

- Unwalked.
- His reference mix: mix it on the bench, copy the six numbers per part, and they replace `SONGS.kites.reference`.
- His second song, when the stems arrive.
- The 1.13 member page's Explore band gains the desk beside Inside the Console (grades-dashboard).
