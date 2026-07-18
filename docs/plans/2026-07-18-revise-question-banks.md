# Revise Question Banks Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Four SRS question banks (delay, distortion, digital-analogue, leads-and-signals) so every Learn-course topic has a Revise deck and the distortion "coming soon" dead-end is gone.

**Architecture:** Pure data additions — four JSON banks under `lib/questions/` + registry entries in `lib/questions/index.js`, guarded by a new TDD-first test file. Zero component/route changes; `/revise/[topicId]` and the topic-page deck gate already consume `getAvailableTopics()`.

**Tech stack:** Next.js static export; `node:test` suite; JSON data files.

**Governing spec:** `docs/superpowers/specs/2026-07-18-revise-question-banks-design.md` — the bank maps in it are BINDING (pinned numeric values, mcq/short target lists, per-bank sources).

---

## Global constraints (copy into every dispatch)

- **⚠️ Working-tree hazard:** the checkout contains ANOTHER SESSION'S uncommitted work. NEVER `git add -A`, `git add .`, `git stash`, or `git checkout -- .`. Stage files ONLY by explicit path. Files you must never touch or stage: `app/[resourceId]/ResourcePageClient.js`, `app/[resourceId]/page.js`, `app/topic/[topicId]/page.js`, `lib/resources/index.js`, `lib/topics.js`, anything matching `*compression-press*`. (Reading them as content sources is fine.)
- Branch: `learn-revise-gap`. Base: `post-rollout-polish` (9321ad6).
- Spec content laws bind every question: derivation-only from the named sources; no verbatim clones (of other banks OR the course's own assessment questions); ADT ms figures banned in the delay bank; glyph law (▸/⇄ only, ▶/↔ banned); UK English; A-level register; non-calculator values; explanations 2–4 sentences in midi.json's register.
- Bank shape: exactly 20 questions; type mix 10/5/5 (leads-and-signals: 12/3/5); ids `{topic}-{mcq|num|short}-NN` two-digit sequential per type; types interleaved in blocks like midi.json; field sets per type exactly as in existing banks (mcq: question/options[4]/correctIndex/explanation · numeric: question/answer/tolerance/unit/explanation · short: question/sampleAnswer/keyPoints[]/explanation).
- After every task: `npm test` green, `npx eslint` on touched JS files clean, commit by explicit path.

## Task 1: Guard test `tests/question-banks.test.mjs` (TDD scaffold)

**Files:** Create `tests/question-banks.test.mjs`.

Assertions per the spec's Verification design: schema (field sets per type, options length 4, correctIndex range, unique ids, id format, topicId matches filename); counts (20 questions; per-topic type-mix literal map — all existing nine banks 10/5/5); coverage (every `learnTopics` id has a bank except a `KNOWN_MISSING` exact-asserted literal starting `['delay','distortion','digital-analogue','leads-and-signals']`, each with a dated comment; `mixing` asserted known-unreachable — bank with no topic — not deleted); content lint (no ▶ or ↔ character anywhere in any bank's JSON text). All nine existing banks must pass — if one doesn't, STOP and report (spec conflict), do not "fix" the bank.

Run `npm test`: new file green against existing banks, `KNOWN_MISSING` documents the four gaps. Commit.

## Tasks 2–5: One bank per task — delay (T2), distortion (T3), digital-analogue (T4), leads-and-signals (T5)

**Files per task:** Create `lib/questions/<topic>.json`; modify `lib/questions/index.js` (add import + registry entry); modify `tests/question-banks.test.mjs` (remove `<topic>` from `KNOWN_MISSING`).

Steps per task:
1. Read the spec's bank map for this topic — it is the requirements document: pinned numeric values (use EXACTLY those values/answers/tolerances), mcq target list, short target list, named sources.
2. Read the named sources fully (the Learn topic file + named resource files). Derive every question from them per the content laws.
3. Write the bank; wire the registry import/entry (alphabetical-adjacent placement, match file style); shrink `KNOWN_MISSING`.
4. `npm test` (guard now validates your bank — 20 questions, right mix, schema, coverage), `npx eslint lib/questions/index.js` clean.
5. Spot-check live: `curl -s http://localhost:3000/topic/<topic> | grep -c "revise/<topic>"` ≥ 1 (deck link now renders; dev server on :3000 serves this checkout).
6. Commit `lib/questions/<topic>.json lib/questions/index.js tests/question-banks.test.mjs` by explicit path.

Task-specific notes:
- **T2 delay:** ADT exclusion law is absolute — grep your bank for "ms" near "ADT" before committing. Avoid numeracy's 90 BPM dotted-quaver values and the course's own 375 ms/1000 ms worked examples as question values.
- **T3 distortion:** odd/even harmonic framing follows the AMENDED map (symmetric→odd, asymmetric/tube→even). Harmonic-multiple definitional lead-in goes in the stem if the row doesn't state it.
- **T4 digital-analogue:** do not clone the course anchor's 48→24 kHz forward-Nyquist values; the spec's five numeric families are the variation.
- **T5 leads-and-signals:** 12/3/5 mix (the ONLY non-default bank — the guard's mix map must carry it); dBu ladder values are the chapter's own (−50/−20/+4).

## Task 6: Final whole-branch review + gates + handoff

1. Dispatch final whole-branch reviewer (review package `post-rollout-polish..HEAD`): spec-vs-implementation on all four maps (recompute EVERY numeric answer independently), content-law sweep (derivation, clones, ADT, glyphs, register), cross-file integrity (registry entries ↔ files ↔ learnTopics coverage), hazard isolation per-commit.
2. Gate 1 (`checks.mjs --audience=alevel`) on the four topic pages + `/revise/distortion`. Gate 2 Playwright: deck link on all four topic pages; distortion "coming soon" placeholder GONE; `/revise/distortion` serves quiz shell; glyph scan. (AuthGate limit disclosed in handoff.)
3. `npm run build` clean; full `npm test`; eslint on all branch-touched files.
4. Write `docs/2026-07-18-revise-question-banks-HANDOFF.md`: what shipped, Mike's gates (the four bank maps in the spec = his #1 gate; claim-inheritance items), verification report, parked items. Commit. NOT pushed, NOT deployed — his call.
