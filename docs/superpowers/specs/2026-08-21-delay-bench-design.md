# The Delay bench (1.12) — reference bench for the Bench Standard

*2026-08-21. Fable. Governed by `Professional (AI)/Planning-and-Admin/Interactive-Resources-Upgrade/BENCH-STANDARD.md`; this doc is the first bench built to it and the one Mike walks before the standard rolls out.*

## 1 · Why this bench, why now

Mike's 1.12 note calls `delay-effects` "absolutely hideous … I would not even put this onto a free website." It has four tabs (Learn, Interactive, Quiz, Reference), a black canvas with orange sliders he has to scroll to reach, a BPM calculator whose numbers he could not change, a quiz that "doesn't say or do anything", and no sound of any kind. Delay is a main topic (2022 and 2024 examiner reports both flag feedback; the 2023 report flags the wet/dry line). The topic's 3D machine, Inside the Echo, is built and verified but not yet promoted (WO-13). After this work the 1.12 Explore band reads: watch the machine in 3D, then work the effect on the bench.

## 2 · What the student does

They press play on a real source, and a delay is already audible (preset: Rhythmic 1/8 at 110 BPM, feedback 35%, mix 40%). The stage shows the source's hits as marks on a timeline and each repeat as a fainter mark to the right, spaced by the delay time, over a beat grid for the current tempo. They drag Time and watch the repeats slide off the grid and hear the rhythm break; they switch Sync on and pick a note value and the repeats snap to the grid; they raise Feedback and the repeats multiply and decay more slowly, until at 100% they stop decaying; they move Mix and the repeats' height changes against the dry mark; under Go further they darken the repeats with a high cut (tape and analogue character, the spec's "tone of repeats"), flip to Ping-pong and watch the repeats alternate sides, and switch the source to a vocal or a guitar stab to hear the same settings on a different sound. Nothing is scored. Nothing scrolls.

## 3 · The model (one graph drives sound and picture)

```
source ──┬─────────────────────────────────────────────► dryGain ──┐
         │                                                         ├─► master ─► destination
         └─► inputGain ─► delayL ─► toneL (lowpass) ─► wetL ───────┤
                  ▲           │                          (pan L/R) │
                  │           └─► fbGain ─┐                        │
                  │                       │                        │
                  └───────────────────────┘ (mono) or crossed into delayR (ping-pong)
```

- `delayTimeSec = sync ? (60 / bpm) * noteBeats : timeMs / 1000`, with `noteBeats` from the table below. Displayed ms is computed from the same expression the DelayNode receives.
- `fbGain.gain = feedback / 100`, capped at 1.0 (100% is "runaway", shown and audible, with the master limiter below keeping it safe).
- `toneL.frequency` from the High cut control (20 kHz = off; 2 kHz = tape-dark).
- `wet.gain = mix / 100`, `dry.gain = 1 - mix / 100` (equal-power curve, so 50% does not dip).
- Ping-pong: two DelayNodes, feedback crossed (L feeds R, R feeds L), panned hard L and R; mono mode uses one line, panned centre.
- A `DynamicsCompressorNode` on master with a hard ceiling (threshold -3 dB, ratio 20) so 100% feedback never clips a student's headphones.
- All parameter writes go through `setTargetAtTime(value, now, 0.02)`; tempo changes re-schedule the loop from the next bar boundary.

Note-value table (the exam's values first; dotted and triplet live under Go further):

| Value | Beats | 120 BPM |
|---|---|---|
| 1/4 | 1 | 500 ms |
| 1/8 | 0.5 | 250 ms |
| 1/16 | 0.25 | 125 ms |
| 1/2 | 2 | 1000 ms |
| 1/8 dotted | 0.75 | 375 ms |
| 1/8 triplet | 1/3 | 167 ms |

The stage's repeat marks are placed at `t0 + n * delayTimeSec` with height `amp * feedback^n` for n = 1… until height < 2% or 4 seconds, the same recursion the feedback loop performs. The beat grid is drawn at `60 / bpm * k` for the visible window. The window is 2 bars at the current tempo, scrolling with the transport so the student sees hits arrive and repeat in time with what they hear.

## 4 · Sources (real audio only)

All files from the estate's own proven pipeline (`reference_real_audio_asset_pipeline`), credited in `docs/audio-credits.md`:

| Source | Files | How it plays |
|---|---|---|
| Drums | Beat Machine one-shots `808-kick/snare/hat/openhat` and `funk-*` (ElevenLabs sound-generation, QC'd, trimmed) | Sequenced live in Web Audio from a 2-bar pattern at the current BPM, so tempo is exact at any value and changes land on the bar |
| Vocal phrase | Pitch Repair `vocal-raw.mp3` (ElevenLabs music, a-cappella, 7.4 s) | Played as a loop, bar-aligned at its native tempo; tempo control disabled while selected (the bench says so) |
| Stabs | Inside the Echo `stab-brass`, `stab-guitar`, `stab-vox` (ElevenLabs one-shots) | One-shot on a pad or on the beat every bar, so each repeat is clearly heard |

Copied into `public/bench-audio/delay/` at build time of this branch. No oscillator anywhere in the bench. If Mike wants a fuller drum loop later, the pipeline's `/v1/music` route generates one at a fixed tempo and it becomes a fourth source.

## 5 · Layout (fits 1280×700 with no scroll; grows to 1400 wide)

```
┌─ header strip (44px) ─────────────────────────────────────────────────────────┬─┐
│ 1.12 DELAY · Delay bench   Each mark is a hit; the fainter ones are its repeats.  [Student|Teacher] │▐│
├─ stage (fills) ───────────────────────────────┬─ console (360px) ──────────────┤▐│
│  timeline, 2 bars, beat grid, dry marks ink,   │ SOURCE   [Drums][Vocal][Stab]  │▐│
│  repeat marks spruce, L/R lanes when ping-pong │ TIME     ────●────── 273 ms    │▐│
│                                                │ SYNC     [off][1/4][1/8][1/16] │▐│
│                                                │ FEEDBACK ──●──────── 35 %      │▐│
│                                                │ MIX      ────●────── 40 %      │▐│
│                                                │ TEMPO    ─────●───── 110 BPM   │▐│
│                                                │ ▸ Go further                   │▐│
│                                                │   HIGH CUT ────────● 20 kHz    │▐│
│                                                │   STEREO   [mono][ping-pong]   │▐│
│                                                │   [1/2][1/8·][1/8 ₃]           │▐│
├─ transport strip (52px) ──────────────────────┴────────────────────────────────┤▐│
│ ▶  ■   hold: DRY    level ───●───    presets: Slapback · Rhythmic 1/8 · Long tail · Ping-pong │
└────────────────────────────────────────────────────────────────────────────────┴─┘
```

Drawer (right edge handle, "Reference · Teacher notes · Connections"): slides to 40% width, page blurs, Escape closes, focus returns to the handle.

- **Reference**: delay time, feedback (number of repeats, runaway at 100%), wet/dry (mix), tempo sync and note values, slapback (80 to 140 ms, one repeat), ping-pong, tone of repeats (tape/analogue darker). "In your DAW" table: Ableton Live Delay / Echo vs Logic Pro Tape Delay / Stereo Delay names for the same six controls, and the neutral name.
- **Teacher notes**: the misconception each preset exposes (slapback is not reverb; feedback sets the number of repeats, not their volume; the wet should sit below the dry unless the effect IS the part); classroom moves ("mute the dry and ask what is left"); examiner evidence with sources (2019 AS Q4(e), 2022 and 2024 feedback, 2023 wet/dry), each carried only if verified against the original report before the bench ships, otherwise cut.
- **Connections**: 2.5 Numeracy bench (the 60,000 ÷ BPM relationship, shown not computed), 1.11 EQ (why repeats darken), 1.13 Balance (where the wet sits in a mix), Inside the Echo (the machine this bench's graph models).

Exam callouts (two, think-then-reveal, in Teacher notes and under Go further): "A producer wants exactly three audible repeats that fade. Which control, and roughly where?"; "The repeats sound duller than the original. Name the control responsible on a tape delay."

Student/Teacher toggle changes the console's prompt line only (Student: "Try…"; Teacher: "Ask…").

## 6 · Files

Shared (new, `components/bench/`): `BenchFrame.jsx`, `BenchDrawer.jsx`, `ModeToggle.jsx`, `controls.jsx` (Knob, Segmented, Toggle, GoFurther), `BenchTransport.jsx`, `ExamCallout.jsx`, `useBenchAudio.js`, `bench.css` (tokens, grid, no-scroll). The drawer's behaviour is lifted from `BPMDelayCalculator.jsx`'s `.tl-drawer` block and re-skinned; the Tape Lab itself is untouched by this branch.

Bench: `components/resources/DelayBench.jsx` (UI), `lib/bench/delay-model.js` (pure functions: note table, delayTimeSec, repeat marks, equal-power mix; unit-tested), `public/bench-audio/delay/*`.

Config: `lib/resources/delay-effects.js` gains `kind: 'bench'`, new title "Delay bench", description rewritten, keywords kept; the page route `app/[resourceId]/page.js` renders `kind === 'bench'` full-bleed (no hero, no tabs, no breadcrumb band, footer outside the frame). The id stays `delay-effects` so every existing link, the member topic page and the sitemap keep working.

Gate: `scripts/check-bench.mjs` (Playwright on the built export, per the standard §6), wired as `npm run check:bench`.

## 7 · Tests

- `tests/bench/delay-model.test.mjs`: note table ms at 120 BPM; sync vs free time; repeat marks count and decay at 35% and 100%; equal-power mix sums to ~1 at 50%; ping-pong alternation of lanes.
- `tests/bench/bench-config.test.mjs`: every `kind: 'bench'` resource declares `topic`, no `hero`, and its component exists.
- `check-bench` on `delay-effects` at 1280×700 and 1440×900.
- Existing `npm test` suite stays green; `npm run build` green.

## 8 · Out of scope for this branch

The other delay-family pages (`delay-flashcards` → Revise, `delay-assessment`, `delay-image-explorer`, `double-tracking`) and the re-filing of `bpm-delay-calculator` to 2.5; promoting Inside the Echo (WO-13); the member topic page's bench list (follows once the bench is live).
