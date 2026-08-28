# The Dynamics bench (1.9), third bench to the Bench Standard

*2026-08-28. Fable. Governed by `Professional (AI)/Planning-and-Admin/Interactive-Resources-Upgrade/BENCH-STANDARD.md`; the Delay bench is the reference, the EQ bench (`2026-08-27-eq-bench-design.md`) the nearest precedent. Mike's "ok lets go" on the Explore ledger of 27 Aug is the approval (step 2: "one bench with a processor switch, compressor / limiter / gate / expander; the 2023 paper vocal chain is the preset"); his 28 Aug note is the latitude: the bench layout is the pathway, not a cage.*

## 1 · Why this bench

The ledger's verdict on the Compressor Explorer: threshold and ratio do not move the visual, the knee is wrong, "might need to come out". Dynamics is in Q6 three years of seven, and the practical paper compresses or gates something every year from 2017 to 2025. A gate has had no explanation on the site beyond an Ableton device walkthrough. The bench replaces the explorer at `/dynamics-bench`; `/compressor-explorer` is a retired stub.

## 2 · What the student does

They press Play on a real source (the same four loops as the EQ bench) and hear it through one of four processors, chosen by a chip: compressor, limiter, gate, expander. The stage is a time lane, not a frequency plot (the change of direction the topic needs): the loop's level in dB against time, the input as a ghost outline, the output as a filled shape, the threshold as a gold line the student drags, and the gain reduction as a coral band hanging from the top, so "what is being taken off" is read against the beat. Beside it, the transfer curve the paper asks students to draw, live, with the current operating point moving along it. Hold-dry bypasses the processor. Presets: Gentle, Vocal level, Drum punch, Sustain, Limiter, Gate the hats, 2022 paper, 2023 paper.

## 3 · The model (one set of numbers)

`lib/bench/comp-model.js`, pure and tested. The loop is deterministic (known samples, known tempo, known gains), so the bench mixes it offline from the decoded buffers exactly where the scheduler books it (`mixPattern`), reads its peak level every half millisecond (`envelopeDb`), and runs the gain computer over that (`runLoop`): a feed-forward static curve with a quadratic soft knee (compressor slope 1/R above the threshold; limiter slope 0; expander slope R below; gate vertical, to an 80 dB floor) and one-pole attack/release smoothing in dB, with attack and release swapped for the downward pair, run twice so the loop's start is its steady state. The same gain series is written to a GainNode as an automation curve (`gainCurve`) and drawn on the stage, so the picture cannot drift from the sound. Make-up is a separate gain stage after it and never counts as reduction. Stats for the console come from the same run: most gain reduction, loudest moment before and after, share of the loop over (or under) the threshold, loud-to-soft range before and after.

## 4 · Three jobs (`lib/bench/comp-depth.js`)

Core shows: the hearing line reads the settings and the loop; the next move walks threshold, ratio, attack, gate, then the paper. A-level judges the control touched last the way the paper does, setting defined (AO3) then effect on this part, verdict and change (AO4), source-aware and stats-aware, anchored in the reports: the 2023 report's "very high ratio" and "make-up gain often confused", the 2023 AS paper's "very few could" label ∞:1 as limiting, the 2019 gate-threshold faults either side of "set musically", the 2025 mark scheme's "attack too long causing excessive transients", the 2022 paper's disadvantages of compression and the piano-sustain question most answered with reverb, the 2019 report's gain-versus-dynamic-range confusion. Extension opens the machine: slopes, time constants (63%), the knee's quadratic, make-up lifting the whole curve, look-ahead, hysteresis and hold, peak against RMS detection.

## 5 · Verification

`tests/bench-comp-model.test.mjs` and `tests/bench-comp-depth.test.mjs`. `scripts/check-bench.mjs` gains a fixture for `dynamics-bench` (presets, the judge preset's landing) and law 17: the canvas reports the threshold (`data-threshold`) and it equals the Threshold dial; dragging the line's handle down lowers the dial. Clear in Chromium and WebKit at 1280×700 and 1440×900 before deploy, and again on prod.

## 6 · Member side

`grades-dashboard`: `TOPIC_RESOURCE_MAP['dynamic-processing'] = '/dynamics-bench'`; the 1.9 Explore band's Compressor Explorer card becomes the Dynamics bench card, first on the rail (new still `public/explore/dynamic-processing-1.jpg`, new moves, preview redrawn as the bench's stage); Inside the Compressor, the Compression Workshop and the Gate Controls Explorer stay.

## Addendum, 28 August 2026, evening: three levels, three pictures

Mike walked the bench: "core, A-level and extension are too similar; use this site to see how I want the graph to look", pointing at his `dynamics-live-compressor.html` (the transfer plot as a proper graph: dB axes with ticks and a grid, the unity diagonal named, the threshold marked, a probe dragged inside the plot with dotted projections to both axes, the processor named inside the plot). The stage now changes with the depth and the gate proves it (law 18 reads `data-stage`): **Core** is the lane alone, the loop against the beat. **A-level** opens the paper's drawing at the left of the stage, input across and output up on the lane's own dB scale (one set of labels serves both), the live dot riding the curve, and a probe the student drags inside the drawing to read a level off (the 2022 make-up question, answered by reading). **Extension** adds what the gain computer asked for (dotted coral, `runLoop().wantDb`) against what attack and release let it apply, the knee bracketed, and the dot's trail leaving the curve by that lag. Also from the walk: Timing is split into an Attack section and a Release section, each one dial with its readout beneath (88 px each; Hear keeps its 294 at 1280), and the Threshold meaning line is in the sans at every depth (it had switched to the mono at A-level).
