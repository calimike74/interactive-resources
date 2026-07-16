# Learn Rollout Wave 1 — Handoff (2026-07-16)

**Branch:** `learn-rollout-wave1` (19 commits, HEAD `060cdcd`, based on `ac2273d` = the deployed flagship). **Not pushed, not deployed** — your call, per the promotion workflow.

## What shipped

The three legacy single lessons are now full courses on the synthesis template — course map, Continue button, chapter outros, completion tracking, exam anchors:

| Course | Chapters | Rows | New diagrams | Audio | Interactive |
|---|---|---|---|---|---|
| **EQ** (`/learn/eq`) | Spectrum → Filters → Graphic vs Parametric → Q & EQ Decisions | 16 (7 legacy + 9 new) | 9 | 4 presets | EQ sweep knob (zone words) |
| **Dynamics** (`/learn/dynamics`) | Dynamic Range → Compressor's Controls → Attack, Release & Punch → Limiters, Gates & Side-chain | 14 (6 legacy + 8 new) | 8 (incl. exam-drawable transfer curve) | drum-loop A/B pair | Threshold slider |
| **Delay** (`/learn/delay`) | Delay Line → Feedback, Slapback & Tape → Timed Delay & the Maths → Stereo Delay & ADT | 12 (8 legacy + 4 new) | 4 (incl. BPM→ms numeracy) | pluck + ping-pong | Delay-time slider + feedback dial |

All legacy rows preserved verbatim (one sourced exception below); the filters gap in the old EQ lesson is closed; old lesson URLs redirect via vercel.json (deploy-time). Synthesis course, Explore/Revise doors, and `app/` untouched. No new dependencies.

## ⚑ ONE CONTENT CORRECTION YOU MUST EYEBALL (top of the claims list)

**ADT delay-time figures corrected against your Delay Definitive Reference.** The legacy row taught "around 50–100 ms" with "~60 ms" as the graded answer. The reference states (verbatim): *"a short delay of 15 to 30 ms (up to about 40 for vocals)... zero feedback"* and *"older sources... describe ADT at around 100 ms, and the current mark schemes penalise that figure, with the 2023 report noting 'many created long delays'"*. The row, its assessment (old figure now a teaching distractor), and the ch4 exam anchor were updated to the credited range. Full before/after in `.superpowers/sdd/task-9-report.md`. Note: the reference's own provenance says it awaits your sign-off — if you disagree, this is one commit to revert (`1abca4f` + `2454c7a`).

## Verification

- **Per-task reviews:** 11 build tasks, each independently reviewed (spec + quality); 5 fix loops, all re-verified by the original reviewer. Reviewers recomputed arithmetic themselves (gain-reduction, BPM families, transfer-curve geometry, filter-curve maths) rather than trusting reports.
- **Final whole-branch review (Fable):** "Ready to hand over: Yes". Independent expansions sweep: 135 entries, 0 new orphans, 0 new cross-topic collisions.
- **verify-house-build:** Gate 1 `--audience=alevel` on 18 pages (3 course maps + 12 chapters + 3 topic pages): 0 fails. One WARN fixed (`equalization` → `equalisation` in the picker copy, `060cdcd`); one adjudicated pre-existing (below). Gate 2: 9/9 independent Playwright DOM-delta checks — EQ sweep readout ("1000 Hz — honk" → "12.0 kHz — air"), delay-time crossing all three perception zones (20→thickens, 80→slapback, 300→echo), threshold slider + live canvas, full completion flow (outro → localStorage → ✓ badge → Continue retarget), delay's no-resource final outro (`#explore` + `#revise`), exam anchors in SSR for all three courses. Old-URL behaviour confirmed: paths absent from the static export, redirects handle in production (flagship precedent verified live).
- **Automated:** tests 12/12 (new: ctl-preset shape guard covering ALL controllable presets — closes a flagship follow-up); build 132 static pages; eslint clean on all 33 branch-touched files.
- **Deliberate departures (same as flagship):** site's committed palette (not warm-paper) and inline-label + phase-caption diagram idiom — your "leave the site as is" instruction governs.

## Your gates (the two only you can run)

1. **Audio, by ear** (speakers + iPhone Safari): EQ tone + low-shelf/presence/highpass A/B, drum loop raw vs squashed, delay pluck single + ping-pong; then the four interactives — sweep the EQ knob across the zones, pull the threshold down while the loop plays, ride the delay-time slider across 30/120 ms, wind the feedback dial up. Levels conservative (0.15).
2. **Claims spot-check:** ADT correction above, then per-course flagged items (full lists in `.superpowers/sdd/task-{3,6,7,9,10}-report.md`): EQ — 48 dB/oct "mastering/anti-aliasing" expansion, shelf corner half-value definition, illustrative 90 Hz kick/bass example in one diagram; Dynamics — −40/−6 dBFS illustration, authored (verified-arithmetic) anchor numbers, 5 illustrative diagram values; Delay — tape-echo mini-spectrum bands illustrative. Past-paper phrasing of the 12 exam anchors is yours per the spec-alignment rule.

## Parked (yours)

- Pre-existing American spellings on `/topic/eq` resource copy (`equalizers`, `visualization`, `analyzer` in `lib/resources/*` — one is inside a resource URL id, so renaming = URL change).
- Delay chapter 1 has 2 rows (template norm 3–5) — faithful to the spec's chapter map; add a row in a later pass if it feels thin.
- Flagship's still-parked items (orphaned mixing bank, delay question bank, `↔` in two delay resources).

## Wave 2 (next, on your go)

1. **First item:** expansions orphan/collision guard test (the manual checks each task ran, automated).
2. Reverb + sampling — brand-new courses from their Definitive References.
3. Then wave 3: minor topics, single chapters + your "covered briefly" rationale note.
