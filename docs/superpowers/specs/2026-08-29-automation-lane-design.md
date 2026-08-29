# The Automation Lane (1.8): design record

**Date:** 29 August 2026. **Status:** built and live at `resources.musictechstudio.co.uk/automation-lane`, sixth bench to the Bench Standard. Built on Mike's "let's move on to the automation line. If you feel that this may lend itself to a new type of design which sort of resembles what we've done, great, go for it. If not, you be the judge of what's best."

## 1. What the topic is, and what the exam does with it

Automation is a parameter changing over time, drawn or recorded into a lane. The spec (9MT0 area 1.8) names the targets (volume, panning, effect parameters, sends, instrument parameters), the data types (linear, curved, step; an LFO is a separate modulation source) and the timing (grid-synchronised or free-form; drawing, recording, editing). The practical paper sets one automation move almost every year, and the mark schemes are short ("L – R as directed"), so the marks live in execution. The eight practicals in the vault's per-question files, 2017 to 2023: six pan moves (hard positions by bar in 2017, 2019, 2020, 2022; a smooth sweep in 2021 and 2023), one filter build (2020), one volume ramp (2022 AS). The examiner reports name the faults: sloppy placement so transients were not hard panned (2020), the cut-off started too low or rose too slowly (2020), an uneven ramp that did not reach the level (2022), the sweep inverted right to left (2023).

Nothing on the estate taught this before today (`docs/benches/1.8-automation.md` in grades-dashboard: "genuine gap").

## 2. The judgement: a lane under a clip, as the DAW draws it

The shaping proposal held that 1.13 and 1.8 share an engine and that the second would be half the cost. It is. The Balance Desk's graph (source → gain → pan → bus, a post-fade send into one shared room) gains a low-pass filter per strip and loses the hidden trims; the lane writes to one parameter of one strip.

The picture is the one every student already recognises: the part's clip above, the automation lane beneath, points joined by a shape, a playhead crossing both. That was the call Mike left open ("a new type of design which sort of resembles what we've done"): the bench family's frame, console grammar and three jobs, with the stage drawn as a DAW's track view rather than as a plan or a spectrum, because the topic's picture is that picture.

- **One part, one target, one lane.** The papers name one part and one move. Part chips (Drums · Bass · Guitar · Keys), Target chips (Volume · Pan · Filter · Send), Shape chips (Step · Line · Curve), Grid chips (Bar · Beat · Free). Switching the target keeps the points, so the same shape can be heard doing four jobs (the proposal's lesson: a step on the pan is a rhythmic effect, on the filter a gate, on a send a mistake). Switching part or target drops the stem, so the judge describes rather than marks until a preset sets one again.
- **Values normalised.** The lane holds 0 to 1 whatever the target; each target says what its ends mean (`toUnit`): −36 to +6 dB with unity at 0.857, hard left to hard right, 100 Hz to 16 kHz on a log, dry to wet. No numbers on screen at Core beyond the DAW's own axis labels.
- **The point on the lane is the control.** Drag a point (time snapped to the grid and held between its neighbours, value clamped); click the lane to add one; double-click to remove. Two points at the same time are a jump, the later winning, which is how a DAW draws a step inside a line lane. Law 21 in `check-bench`: `data-point` is the handle point's value, dragging the handle up raises it and `data-lane` changes.
- **Hold the lane off.** The play column's hold button switches the lane off on the same beat (the parameter to rest), so the student hears what the move adds without losing their place. The desk's "hold: reference" pattern, re-aimed.
- **The engine plays a rule, not the points.** `curveFor` samples the shape once a millisecond in the parameter's units (9,320 values a pass) and `setValueCurveAtTime` books it for every loop pass already scheduled; an edit cancels from now, holds, ramps into the new curve one millisecond later and re-books the remainder (`rebook`). Law 6 (picture and sound are one series) holds by construction, as on the Dynamics bench.
- **The moving control.** The Value dial in the console follows the lane while the loop runs: the picture of automation in every DAW. Grab it while playing and it writes (`writePoint`, Touch: replaces points within half a grid step of the playhead, stops when you let go). Disabled until Play, so it never does nothing.

## 3. Three jobs, three pictures

- **Core, `data-stage=lane`:** the clip (the part's envelope from the decoded samples, transients ticked under it, the region in the part's colour), the lane (axis labels for the target, beat and bar grid, the rest line dashed, the lane filled to the floor in the target's colour, the points), the playhead with the live value read in the title row. The line names what the lane does from its points ("centre from the start, hard left at bar 2…") and says what to try.
- **A-level, `data-stage=paper`:** the stem's own lane drawn dashed gold for the student to match, the bars it names shaded, and the faults marked where they are: a coral bracket from the barline to the late jump ("+73 ms"), an underline on a bar that should not move, a vertical gap where a ramp falls short, an arrow for the wrong direction. The judge reads every check the scheme makes (`checks`: placement, direction, position, scope for the pan moves; direction, smoothness, position, placement, scope for the sweep; start, rate, arrival, smoothness for the filter; start, smoothness, arrival, scope for the ramp) and writes two segments, AO3 then AO4, quoting one examiner sentence with its year. No numeric marks (the house rule from the desk: describe in the scheme's lines).
- **Extension, `data-stage=machine`:** the lane plus the channel drawn as a row (file → filter → fader → pan → send → room → bus) with the automated box lit and named "on the channel" or "inside the insert" (the written paper's distinction), the stored breakpoints listed in bar.beat form against the 9,320 values played, the sampled values dotted along the lane, and Touch on the dial. The line explains the modes (Read, Write, Touch, Latch) after a touch.

## 4. The papers' moves as presets

Each task re-scopes a real practical to the loop's four bars (2019's "bars 34 to 35" become bars 2 and 3; 2020's four-bar filter build becomes bars 2 to 4 starting where bar 1 sat; 2022's one-bar ramp becomes bar 3). Clean and faulty in pairs: **Hard pan** / **Late step** (2020's placement, 73 ms late), **Sweep** / **Backwards** (2023's inversion), **Filter build** / **Slow to rise** (2020's "started too low, or was too slow to rise"), **Ramp** / **Falls short** (2022's "uneven volume ramp and not reaching a suitable level"). Every preset is pinned to its verdict by a test (`tests/bench-lane-model.test.mjs`).

## 5. Audio

The second Suno song on the estate: "Dry Groove" (103 bpm, instrumental funk), the July 2026 generation for the C3 Aural Trainer whose raw stems sat unused in `~/Downloads/Dry Groove Stems (103BPM)/`. Bars 18 to 21 on the drums' beat grid, the one four-bar window where drums, bass, guitar and keys all play in every bar (`scratchpad/auto/cut.py`, stats in `SONG.stats`). The bench applies a fixed balance in the graph (`mixTrim`) because the guitar and keys sit 15 dB under the rhythm section in the release. Credited under `lane/` in `docs/audio-credits.md`. Nothing from the ElevenLabs set (Mike's 28 Aug ruling).

## 6. Held, and what is not built

- **Unwalked by Mike.** As Valve, Plate, the Edit bench and the Balance Desk.
- **The C3 listening half** of the shaping proposal (eight clips, each with one move to name) is not in v1. The bench's hold-the-lane-off is the seed of it: the Teacher tab's first move is to say in one sentence what the move adds.
- **A riser and a vocal** (2023's drum riser, 2017's vocal phrase) are not in the loop; the Groove has neither. The presets map those stems to the keys and the bass, and say so.
- **Latch and Write** are explained, not built; Touch is built.
- **The 1.8 Learn landing** carries no Explore band until the member page is wired (this session, grades-dashboard).

## 7. Gates

`node scripts/check-bench.mjs <url>` in Chromium and WebKit at 1280×700 and 1440×900: fixture `automation-lane` (presets Sweep / Filter build / judge Late step landing `data-verdict=placement`; stages lane / paper / machine) and law 21. 285 unit tests across the estate (20 new: model and depth). Console at 1280: Play 104 + Part 150 + Target 166 + Shape 150 + Grid 132 + Value 150 + Hear 426 = 1278.
