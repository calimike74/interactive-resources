# The Edit bench (1.6), fourth bench to the Bench Standard

*2026-08-28, evening. Fable. Governed by `Professional (AI)/Planning-and-Admin/Interactive-Resources-Upgrade/BENCH-STANDARD.md`; the Dynamics bench (`2026-08-28-dynamics-bench-design.md`) is the nearest precedent. Mike's "go with your recommendations" on the evening's proposal is the approval: the Edit Bench for 1.6 Audio Editing, three exercises (the click, the fade, the truncation), comping out of v1, a stand-in take until he records one, placed as the 1.6 page's own Explore band.*

## 1 · Why this bench

1.6 had nothing: no bench, no explorer, no Explore band. The Signal Map coverage audit named it the strongest missing plate, and its marks are craft marks in almost every practical question: "no clicks or glitches" carries its own mark most years, and the 2024 report found unsmoothed edit points made 2 of 4 "the most common score". The fault is audible and binary, so it is the cheapest honest hear-it bench there is.

## 2 · What the student does

One take on a timeline with a cut they drag. Two takes, two edits: the vocal is a splice (region A ends at the cut, region B comes in after a removed section, 0.5 s by default); the cymbal is a trim (the region ends, silence follows). They press Play and the loop runs through the join about once a second. They drag the cut, hear the click a mid-cycle join makes, snap it to a zero crossing and hear it go with no fade at all; then fade it, 0 to 500 ms, linear, equal power or S-curve, from a 10 ms repair to a half-second transition. Hold-dry plays the untouched take from the same point, so what the cut removed (or the tail the trim threw away) is heard against the edit. Presets: The click, Zero crossing, Repair fade, Linear long, Equal power long, The tail, 2022 paper (a waveform cut when it is not at zero displacement, the mark scheme's own diagram), 2024 paper (the smooth edit point the examiner wanted at every join). More: how much the splice removes.

## 3 · The model (one set of samples)

`lib/bench/edit-model.js`, pure and tested. The bench decodes the take once and bounces the edit exactly as a DAW would (`renderEdit`): a splice crossfades across the cut using the material either side of the region edges; a trim fades inside the region to the cut and pads silence. The bounce is what plays (a rendered `AudioBuffer`, booked per bar through `useBenchAudio`'s `playBuffer`, which gained `buffer`, `offset` and `duration`), and the stage draws the same samples around the join, so the click the student hears is the step the model measures (`stepAt`: the last sample of A against the first of B). Snap moves the cut to the nearest rising zero crossing on both sides and writes it into the state, so the dial, the stage and the sound read one number. Fade shapes: linear, equal power (sine and cosine, powers sum to one), S-curve (raised cosine); `sumDb` and `dipDb` give the level through a crossfade of unrelated sounds (linear dips 3.01 dB at the middle). `tailEndIdx` finds where a take stops sounding, so the trim can say how much tail it threw away. The loop window sits 0.9 s before the join and 0.9 s after it (or into a second of silence on a trim); its length sets the bench's bar, so the kit's scheduler books it like any pattern.

Cut points measured on the takes themselves: the vocal at 2.500 s sits at +0.42 of full scale mid-cycle and at 3.000 s at −0.29, so the default join jumps 72%: a pop. The hat's 20 ms peak falls under 0.05 at 0.58 s but rings to 1.48 s.

## 4 · Three jobs (`lib/bench/edit-depth.js`) and three pictures

Core shows: the join at cycle zoom, gold for the take up to the cut, blue for what follows, the jump between them as a coral bar labelled with its size; the whole take above it with the cut marker (coarse drag) and the loop shaded. A-level judges the control touched last the way the paper does, setting defined (AO3) then effect, verdict and change (AO4), anchored in the 2019 AS Q3(c) mark scheme ("discontinuity/not zero point", "fade/crossfade creates a zero point", "sustaining sounds"), the 2018 report ("expand the screen and use short fades"), the 2024 report ("failed to create smooth edit points... 2 marks, the most common score"; "not fading/removing the glitch at the end") and the 2022 Q2(b) scheme ("cuts waveform when it's not at 0 displacement", a diagram credited); and the paper's drawing opens under the join on the same time axis: the two regions as blocks, fade out and fade in as gain against time, the crossfade bracketed and named, a probe dragged inside to read both gains off. Extension opens the machine: the level through the crossfade as the two powers add (dotted, on a dB scale at the right), the dip named, the zero crossings ticked on the centre line, and the lines on why a click is every frequency, why equal power holds and equal gain does not, and where a tail really ends. The gate proves the three pictures (`data-stage`: join, drawing, machine).

## 5 · Verification

`tests/bench-edit-model.test.mjs` (14) and `tests/bench-edit-depth.test.mjs` (9). `scripts/check-bench.mjs` gains a fixture for `edit-bench` and law 19: the canvas reports the cut (`data-cut`) and it equals the Cut dial; dragging the join's handle to the right moves the cut later on both. Clear in Chromium and WebKit at 1280×700 and 1440×900 before deploy, the other three benches re-gated (the kit and the stylesheet changed), and again on prod.

Two things the gate did not see and the eye did: the stage eyebrow painted under the orientation sentence (`.stageNote b` now `flex: none`, the `.scope * { min-width: 0 }` trap again), and a cymbal's join at ±1 is a flat line (the wave now scales to the loudest sample in its window and the axis says so). One thing React saw: a polyline of sixteen-digit sines hydrates differently in Node and Chromium; the points are rounded.

## 6 · Member side

`grades-dashboard`: `TOPIC_RESOURCE_MAP['audio-editing'] = '/edit-bench'` with its member route; `lib/member/map.js` `audio-editing: bench: true`; the 1.6 page gains an Explore band (one bench, `ExploreConsole` on a `Shelf`, still `public/explore/audio-editing-1.jpg` shot from the live bench), Revise renumbered 03.

## 7 · Held for Mike

The vocal is the estate's ElevenLabs a-cappella phrase and the cymbal is the funk open hat: stand-ins until he records a four-bar phrase and a crash. Comping (three takes, a lane) is out of v1 by his answer.
