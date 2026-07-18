# Revise Question Banks — Handoff (2026-07-18)

**Branch:** `learn-revise-gap`. **Not pushed, not deployed** — your call, per the promotion workflow. **⚠️ Deploy-time note:** this branch's lineage contains the parallel Signature Machine session's compression-press wip commit (`1f6fdf7`, committed by that session mid-day). Deploying the branch as-is ships that hidden resource too. Alternatives when you decide: I cherry-pick the nine bank commits onto main (clean), or the compression-press work ships knowingly. `post-rollout-polish` (the small-fix sweep, `9321ad6`) is clean and can deploy alone.

## What shipped

Every Learn-course topic now has a Revise question deck — the Revise door catches up with the Learn door. Four new SRS banks in the house 20-question shape, every question derived from the deployed Learn courses and existing reviewed resources, all numerics pinned in the spec and independently recomputed at review:

| Bank | Mix | Primary sources | Kills |
|---|---|---|---|
| **Delay** | 10/5/5 | delay Learn course (4 chapters) | no-deck gap |
| **Distortion** | 10/5/5 | distortion Learn course + Combined Distortion Lab | **the "coming soon" placeholder dead-end** |
| **Digital & Analogue** | 10/5/5 | dig-ana Learn course + Digital Audio Assessment | no-deck gap |
| **Leads & Signals** | 12/3/5 (disclosed deviation — chapter honestly supports only 3 calculation families) | leads Learn course + Audio Leads Flashcards | no-deck gap |

Plus: a guard test (`tests/question-banks.test.mjs`) that schema-validates ALL 13 banks, enforces counts/mix/ids/coverage/glyphs, and is fault-injection-proven to bite. Zero component/route changes; zero hazard-file touches (verified per-commit across all nine commits).

Also on the underlying `post-rollout-polish` branch (separate, clean): the wave-1 "classic wah" expansion orphan fixed, recording cross-link names the *Crossing the Line* chapter, PingPong diagram glyph ⇄.

## ⚑ REVIEW FIRST: the four bank maps

`docs/superpowers/specs/2026-07-18-revise-question-banks-design.md` — same deal as the chapter maps: you approved the direction, not the question designs. The maps pin every numeric (values/answers/tolerances) and every mcq/short target. One dated amendment (phantom-power trace claim — my error, implementation caught it).

## Flagged items (priority order)

1. **ADT ranges disagree across live surfaces** (surfaced by the delay-bank review): the Learn course teaches 15–30 ms, `DelayFlashcards.jsx` says 5–40 ms, and the delay image-explorer's Haas/slapback boundaries drift from the Learn rows too. This is your open wave-1 ADT gate, now with a cross-surface inconsistency attached — one verdict from you settles all surfaces. The delay bank deliberately tests NO ADT millisecond figure, so it's safe whichever way you rule.
2. **Phantom-power question is beyond-source** (leads bank): none of the named sources actually state which connector carries phantom power; kept as a disclosed standard fact (recording.json already asserts phantom facts on a live surface; the vault's Mike Senior extract covers it for the future recording course). Spec amendment `1803538` records this.
3. **Two spec-mandated near-clones worth your eyes:** dig-ana short-05 (16-bit→8-bit scenario — my spec wording forces the same scenario the course's own assessment uses, with a new "what does NOT change" dimension added) and distortion mcq-06 (odd/even character test, abstracted to Signal A/B but high vocabulary overlap with the course row's own assessment).
4. **Balanced-cable noise rejection now tested in two banks** (recording + leads) — distinct framings, legitimate fact-reuse, flagged so you know three questions touch one mechanism.
5. **Lab glossary wording:** the distortion bank says "gentler" where the Combined Distortion Lab's glossary says "warmer" for soft clipping — deliberate, to keep "warm" reserved for even/asymmetric content per the amended harmonics law. If you agree, the Lab glossary's own text is the outlier (one-word edit, separate task).

## Verification

- 8 build/fix commits + 1 amendment; 5 independent per-task reviews (every numeric recomputed from scratch by the reviewer, all 20 questions source-traced per bank, MCQ answer keys read as a student); 2 fix loops (delay near-clones reframed; distortion array reordered), both re-verified by the ORIGINAL reviewer.
- Final whole-branch review (independent): **"Ready to hand over: Yes"**, zero Critical/Important. Re-ran tests (31/31), build (156 pages, clean), eslint, live checks itself; recomputed all 18 numerics across the four banks; cross-bank near-duplicate audit; per-commit hazard isolation; guard-test bite proven by three fault injections. Full review: `.superpowers/sdd/rqb-final-review.md`.
- verify-house-build: **Gate 1** `--audience=alevel` on 5 pages: 0 warns, 0 fails. **Gate 2** (independent Playwright DOM): 14/14 — deck links on all four topic pages, placeholder gone, quiz shells serve, no question-content leak before auth, glyph sweep clean, prior-wave surfaces untouched.
- **Disclosed limit:** the quiz itself sits behind AuthGate (real student token), so end-to-end question rendering wasn't driven; question content is verified at data level (guard test + reviewer recomputation) and the shell/gate/deck surfaces are DOM-verified.

## Your gates

1. The four bank maps + flagged items above (1–3 are the ones worth real attention).
2. Optional 5-minute sanity: log into `/revise/distortion` with a student token and run a few questions — the only surface automation couldn't reach.

## Parked / unchanged

Sampling/distortion retrieval resource *cards* (they have decks now; card parity is a follow-up) · orphaned `mixing` bank (your open decision) · pre-existing ↔ in `lib/topics.js` specSummary (other session's file) · delay-flashcards/assessment content refresh (ties into your ADT verdict, item 1).
