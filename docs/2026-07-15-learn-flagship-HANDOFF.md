# Learn Flagship — Handoff (2026-07-15)

**Branch:** `learn-flagship` (24 commits, HEAD `d18c76c`). **Not pushed, not deployed** — promotion through lab → production is Mike's call per the three-stage workflow.

## What shipped

1. **Door re-filing (site-wide):** all 51 resources carry a `kind`; Explore shows only sandboxes + interface explorers; Revise gains a "Practice materials" list (17 retrieval + 6 practice items relocated). No resource lost — per-topic totals conserved.
2. **Course system:** the Learn picker is a course map (chapter numbers, ✓ completed, one Continue button); every chapter ends with an outro card instead of the dead-end (ripple kept); completion stored in localStorage; legacy EQ/dynamics/delay lessons render exactly as before.
3. **Row blocks:** live Web Audio press-and-hold examples (11 presets + 5 controllable), five one-knob interactives, chapter-level "In the exam" anchors.
4. **Synthesis flagship course:** 5 chapters — Sound & Waveforms → Subtractive (+ new resonance row, closing a spec gap) → Envelopes → LFOs & Modulation → FM Synthesis. 20 sections, 20 applied assessments, 5 exam anchors, 14 new Canvas diagrams, ~30 new expansion entries. Old URL `/learn/synthesis/synthesis` redirects via vercel.json (deploy-time).

## Verification (verify-house-build)

- **Gate 1 (mechanical):** 8/8 pass, 0 warn, 0 fail on all 8 checked pages (course map, 5 chapters, /topic/synthesis, /topic/delay). Two fails found and fixed first: pre-existing Breadcrumbs duplicate-key console error (`d18c76c`), banned `↔` glyph in ADSR readout → `⇄`.
- **Gate 2 (judgement):** all items ticked. Independent Playwright checks (7/7 PASS, DOM deltas not screenshots): cutoff slider drives readout; ? opens assessment; scroll → ripple → outro card; completion written to localStorage; course map shows ✓ and Continue targets first incomplete chapter; exam anchor present.
- **Deliberate departures stated:** (1) page palette is the site's committed identity (#f5f4f2/white editorial), not warm-paper — Mike's explicit "leave the site as is" instruction governs; (2) diagrams use the site's existing inline-label + phase-caption idiom rather than formal legends — new diagrams match the committed convention.
- **Automated gates:** node tests 7/7 (incl. new exam-anchor and diagram-registry guards); lint clean on every branch-created/modified file; static export builds 123/123 pages; zero `app/api` changes; no new dependencies.
- **Final whole-branch review (independent):** "Ready to hand over: Yes" after one fix round (chapter 1 exam anchor was missing — added with regression test).
- **NOT machine-verifiable — Mike's gates below.**

## Mike's checklist (the two gates only you can run)

**1. Audio, by ear (speakers + iPhone Safari):** the four waveform presets, filter sweep, adsr pluck/swell, vibrato/tremolo/wah, FM ratio — plus the five interactives (cutoff slider, resonance knob, ADSR shaper, LFO depth dial, FM ratio slider). Levels are set conservative (0.15).

**2. Claims spot-check (content flagged as not verbatim-traceable to the Definitive Reference — full detail in `.superpowers/sdd/task-13..17-report.md`):**
- Ch1: foundational physics framing (vibration→pitch/loudness) — scaffolding, not in the C4 source (starts at oscillators); flute/violin diagram labels are illustrative.
- Ch2: "squelch"/"acid house" wording (spec'd by us; source says "classic acid patch"); Resonance diagram uses standard 2-pole filter math (visual only).
- Ch3: "bass stab keeps low end tight" generalises the source's brass-stab example; diagram-only sustain value 0.15.
- Ch4: three pedagogical restatements (rate-Hz parallel, rate/depth independence, tremolo elaboration) + illustrative "220 Hz" diagram label.
- Ch5: "punchy, clangy basses" (uncontested FM knowledge, not a source quote). DX7 mention IS source-backed, used once.
- Past-paper phrasing cross-check of the 5 exam anchors is yours per the spec-alignment rule.

## Parked decisions (yours)

- Orphaned `mixing` question bank — attach to a topic or retire (untouched).
- Delay topic still has no question bank (its flashcards now surface under Revise) — follow-up.
- `eq-assessment-prototype` classified `retrieval`; arguably `practice` (both route to Revise — cosmetic).
- Pre-existing `↔` glyphs in two delay resources (DelayTypesCarousel, PingPong diagram) — outside branch scope, same one-character fix if wanted.

## Follow-ups (triaged non-blocking by final review)

FMRatioSlider snap is text-only · no test asserts ctl-* presets return `set` · audio cleanup latency under background-tab throttling · HarmonicSeries 1/n falloff framed as "most vibrating sources" · ripple scroll listener persists after fire (pre-existing pattern, writes idempotent).

## Working-tree note

A parallel session's uncommitted compression-press work sits in the working tree (untouched by this branch; verified excluded from every commit). Coordinate before any checkout/stash on this repo.
