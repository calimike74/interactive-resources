# Review rulings applied — Handoff (2026-07-20)

**Branch:** `learn-revise-gap`, commits `2a7c91d`..`dffeac3` (4 commits). **Not pushed, not deployed.**
**⚠️ Same deploy-time lineage note as the revise banks:** this branch's history still contains the parallel Signature Machine session's compression-press wip (`1f6fdf7`). Deploying as-is ships that hidden resource. The cherry-pick set is now 13 commits rather than 9 — say the word and I'll build a clean branch off `main`.

## The headline: one root cause explained three of your complaints

You reported three separate things — the subtractive hold button, "can't hear any difference" on envelopes, and the same problem on EQ. They were one bug.

Every audio control was **hold-to-play**: `onPointerDown` started the sound, `onPointerUp` stopped it. With a single pointer you cannot hold that button *and* drag a slider — so the live parameter updates the audio engine already implements (`filter.frequency.setTargetAtTime(...)`, and the envelope preset retriggering every 900 ms with a live `set()`) were **unreachable by anyone**. The engineering was right; the gesture was wrong. You weren't mishearing the envelope — you could never get to it.

All 15 controls now toggle: click to play, adjust freely, click to stop. This also closed a genuine accessibility bug — the keyboard handler already toggled, so pointer and keyboard behaved differently.

Verified in-browser on the three chapters you named: one click starts, the sound **survives moving the slider**, a second click stops. 15/15 Playwright checks.

## The expandable-underline gap — you were right, and it was measurable

"Most of the learn pages don't have the underlined area." Measured across all 116 rows:

| Course | Before | After |
|---|---|---|
| reverb | 27% (11 of 15 rows bare) | 100% |
| sampling | 38% (10 of 16 rows bare) | 100% |
| delay | 42% (7 of 12 rows bare) | 100% |
| synthesis / EQ / dynamics | already 100% | unchanged |

28 rows rendered with **zero** expandable terms. Reverb was the worst, which is exactly the course you were looking at. Added **97 expansions**; density on those three courses now 2.67–2.81 per row (EQ is 2.63, synthesis 3.40). Every trigger verified as an exact substring of its own row's description — the orphan and substring-collision guards stay green.

## Your other rulings

- **ADT** — note added on the Learn row: textbooks quote ~100 ms, current mark schemes credit the short range, so quote the short one and recognise the longer figure if you meet it. The two surfaces that disagreed with the course are aligned (DelayFlashcards 5–40 ms, DelayEffects quiz 1–40 ms, both now 15–40 ms). **⚑ Worth your eye:** you said "the reference book says this, but the exam board has said it's longer" — I've written it the way our own materials already attribute it (textbook = longer ~100 ms, mark scheme = shorter). If you meant it the other way round, it's a one-line edit.
- **Phantom power** — softened. "Which is *capable of* carrying phantom power" became "which is *the standard connector for delivering*" it, and the explanation no longer asserts TRS cannot carry it; it rejects that option on its misdescribed mechanism instead. Defensible to a challenging colleague.
- **Mixing bank** — retired. Deleted, unregistered, and the guard test inverted so it catches the bank silently returning. 12 banks for 12 Learn topics.
- **Delay bank** — confirmed present; it was built on 07-18, so delay has parity with every other topic.
- **UK spelling** — applied to prose site-wide (analog→analogue, equalizer→equaliser, math→maths, behavior→behaviour, and the -ize/-ise family). Deliberately **not** changed: CSS `color`/`center`/`gray`, the `scroll-behavior` property and `behavior: 'smooth'` scrollIntoView option (DOM API names — changing them breaks pages), "program" in the computing sense, and the MIDI "program change" message name.
- **"Classic wah"** — already fixed on `post-rollout-polish` (`9321ad6`); your "go ahead" confirms it.
- **Delay chapter 1 thin** — parked on your instruction, to expand in coming weeks.

## Verification

31/31 tests · production build clean · eslint clean on changed files (6 pre-existing errors remain in 4 files I did not touch) · Gate 1 `--audience=alevel` on 4 pages: 8/8 pass, 0 warn, 0 fail · Gate 2: 15/15 independent Playwright DOM checks · zero hazard files touched, verified per commit.

## Deliberately not done

**Audio exclusivity.** Now that controls latch, two interactives on one page can drone simultaneously — previously impossible. The fix needs an `onStopped` callback through all 15 components to avoid button-state desync; that's a bigger change than your report warranted, so I left it. Flagging it rather than silently shipping it.

## Cross-topic audit (prompted by the expansion work)

Expansions apply globally to every course, not per topic — so tripling the coverage tripled the collision surface. I audited all 268 triggers: **5 fire outside their home course.** Four are legitimate shared vocabulary and worth keeping — "low-pass filter" from synthesis landing on the EQ filters row is precisely what your own EQ/synth bridge resource teaches ("LPF = LPF = LPF"), and "dynamic range" and "quantisation noise" mean the same thing on the sampling and digital-analogue rows.

One was a real mismatch: **"modulation depth"** on MIDI's *Beyond the Note* row means mod-wheel range, but it was serving an FM lecture about carriers and sidebands. Fixed by rewriting the entry to lead with the general meaning and treat FM as the specific case — correct on both rows now. Per-topic scoping would also have fixed it but would have destroyed the four useful cross-matches, so I did not go that way.

**Also worth knowing:** the delay course's ADT row previously counted as "covered" only because the bare word "LFO" from the *synthesis* course happens to appear in its text. That row now has two genuine ADT-specific expansions, both mechanism-only with no millisecond figures, pending your ADT ruling.

## Two content facts flagged for you

1. **Sampling, sample-rate row:** "44.1 kHz survives from the CD format, while 48 kHz became the standard in professional production and video work." Industry convention, not stated in the course's own text.
2. **Sampling, root-note row:** octave transposition described as "exactly doubles the speed." Restates the course's own logic; the twelfth-root-of-two factor was deliberately avoided to keep it non-calculator-safe.

## Still open — genuinely yours

1. **The six wave-3 chapter maps** (`docs/superpowers/specs/2026-07-17-learn-rollout-wave3-chapter-maps.md`) — your standing #1 gate, not yet ruled on.
2. **Ear-checks** on wave 1 and 2 audio — you set these aside; they're the last unverified surface.
3. **Flagged claims** — reverb consonant-clarity / allpass definition / standing-waves mechanism; sampling "envelope shape"; recording buffer-latency (thinnest-sourced); dig-ana anchor borrowing a question shape; line-level "balanced" simplification.
4. **Deploy calls** — `post-rollout-polish` is clean and can ship alone; this branch needs the cherry-pick.
5. **Recording course build** — spec approved by you; ~8-task build awaits your go.
