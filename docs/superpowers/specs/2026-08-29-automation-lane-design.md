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
- **The moving control.** The Value dial in the console follows the lane while the loop runs: the picture of automation in every DAW. Grab it while playing and it writes (`writePoint`, Touch: a point every 16th of a beat whatever the grid, `TOUCH_STEP`, replacing what was there; `touchRelease` on letting go returns the lane to what it was, one step on. Mike, 29 Aug: grid-step Touch was too coarse, the points sat on the beats). Disabled until Play, so it never does nothing.

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

## 8. After Mike's first listen (29 Aug, late)

Mike, on the live bench: the design is right, but a volume or filter lane should take the part out and did not seem to; pan did; what the send does, and where it goes, was not clear; and the points the Value dial wrote sat on the main beats. Measured before changing anything (`scripts/measure-lane.mjs`: an analyser in front of the destination, one part soloed at the source, mean RMS over one loop):

- The fader and the filter worked. Keys alone, lane on the floor: silence, every window. Filter at 100 Hz: 17.5 dB down.
- The mix hid it. At unity the bass measured −29.7 dB, the drums −35.1, the keys −35.2, the guitar −40.3: the bass carried six tenths of the power, so the keys vanishing moved the whole mix by 0.9 dB, the filter by 0.8, the send by 0.2. The release's balance is the song's, not the bench's.
- The room was there but faint: keys with the send full, +1 dB.
- Touch snapped to the edit grid by design (`snapT(t, state.grid)`), so with the grid on Bar a dial move landed on a barline, half the time the next one, and the dial did nothing audible until the bar came round.
- A stop then a start within a pass left the old bookings on the parameters: the first pass after a restart threw `NotSupportedError` in `setValueCurveAtTime` (swallowed), the lane off for that pass, and the old stems still sounding under the new ones.

What changed:

- **A bench balance, measured.** `SONG.mixTrim` is now drums −2, bass −7, guitar +13, keys +11 with the bus trim at 0.75: at unity the keys −29.5, bass −30.0, drums −31.4, guitar −32.5 dB, every part within 3 dB. In the mix the keys' fader now moves the whole by 1.5 dB at unity (3.6 to +6 dB), the filter by 1.5.
- **A room you can hear.** The IR is 2.6 s long, 2.0 s to −60, brighter (one-pole coefficient 0.5), return 1.3. Drums with the send full: +4.6 dB mean, and the gaps between hits rise from −66 to −40 dB. Keys: the gaps from −70 to −42.
- **Solo.** A `Hear` row under the Part chips, "the mix · solo": a gain per strip before the fader (so the send goes too) that mutes the other three. The DAW's S button, for hearing exactly what a lane does to its part. Keys alone −29.5 dB; lane to the floor, −∞.
- **The send says where it goes** at every depth: the lane's label reads SEND → ROOM, the Target line "writes to the send, into the room".
- **Touch at the automation's own resolution.** `TOUCH_STEP` = 1/16 beat (36 ms at 103), whatever the grid; a move within a step replaces the point there; `touchRelease` writes the value the lane had, one step after letting go, so the lane is handed back (Touch, not Latch). Dense lanes draw their points small. A drag over 1.8 s wrote 30 points from beat 3.4 to 6.3 with the return at 6.5.
- **Restart clean.** The hook's `stop` now stops every live source 120 ms after the fade (the Lane's stems run a whole pass; the other benches' one-shots are unaffected), and the Lane's `clear` cancels every parameter's bookings. Before and after a restart: −23.5 and −23.4 dB, both passes booked.
- **Extension caption** carries the lit box's words ("· pan, on the channel") so the stored-points line has its own line.

Not changed: the dial's range and the lane's floor (−36 dB then off); the presets' quiet-but-audible floors, which are the stems' words.
