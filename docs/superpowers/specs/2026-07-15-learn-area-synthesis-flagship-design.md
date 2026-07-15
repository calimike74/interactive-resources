# Learn Area Overhaul — Synthesis Flagship + Door Re-filing

**Date:** 2026-07-15
**Status:** Approved by Mike (pending written-spec review)
**Scope:** resources.musictechstudio.co.uk (`interactive-resources` repo)

## Problem

The site's Learn → Explore → Revise architecture is sound, but the content doesn't respect it:

1. **Learn is a stub.** 4 of 13 topics have Learn content — exactly one lesson each, none covering its full spec area. Every lesson ends at a ripple animation with no onward path (dead-end at `LearnSpineLayout.js`, "You've reached the end of the lesson").
2. **Explore is the attic.** All 51 registered resources are dealt into the Explore grid regardless of kind. 17 of them are retrieval content (13 assessments, 3 flashcard decks, 1 read-then-quiz) and ~7 are essay/exam practice — they belong behind Revise.
3. **Revise is disconnected.** Question banks exist for 8 of 13 topics; one bank (`mixing`) is orphaned and unreachable from any topic page; delay's flashcards substitute for its missing bank from the wrong door.
4. **Synthesis (1.3) is incomplete against its own spec summary.** The single lesson covers subtractive only. FM synthesis has no lesson; LFOs get one passing mention.

## Decisions (locked with Mike, 2026-07-15)

| Decision | Choice |
|---|---|
| Role of a Learn lesson | **First teach** — must take a student from zero to exam-ready on its own |
| Structure | **Guided course** — numbered chapters in a fixed teaching order, never a dead-end |
| Chapter ingredients | Fuller teaching (via layers, see DNA), **audio examples**, **embedded one-knob interactives**, **exam anchoring** |
| Three doors | **Sharpened, not merged**: Learn = understand (one-knob, worked examples) · Explore = play (many-knob sandboxes) · Revise = prove (retrieval at volume) |
| Scope | **Full frame**: synthesis flagship course AND site-wide kind re-filing |
| Visual identity | **Untouched. Hard constraint.** No colour, font, layout, or component-style changes anywhere. Structure and content only. |
| Learn DNA | **Preserved. Hard constraint.** Short visual sections, spine layout, ? checks, expandable terms, end-of-lesson ripple. Students who don't want to read much scroll a visual page; depth *folds open* (expandable terms, optional layers) — never walls of forced text. |
| C3/C4 synthesis work | **Mined, not imported.** Verified content, diagrams, and interaction patterns from the Synthesis Workshop, C4 Synthesis Definitive Reference, 3D Synth Explorer, and dual-oscillator lab are source material. Their denser format is NOT brought over. Consolidation, not creation. |

## Design

### 1. Resource kinds (site-wide re-filing)

Each entry in `lib/resources/` gains one field:

```js
kind: 'sandbox' | 'interface' | 'retrieval' | 'practice'
```

- **sandbox** — open-ended explorers/tools (~20: subtractive-synth-explorer, compressor-explorer, sampling-playground, waveform-explorer, bpm-delay-calculator, …)
- **interface** — the 7 Ableton image explorers (compressor, gate, autofilter, eq8, reverb, delay, operator)
- **retrieval** — the 13 `*-assessment` resources + 3 `*-flashcards` + `rtq-dynamic-compression` (17 total)
- **practice** — essay/analysis work (~7: essay-scaffold, essay-scaffold-practice, stereo-recording-essay, compressor-curve-practice, mixing-production, production-analysis, acoustics-psychoacoustics)

Classification above is by naming convention; **verify each resource module by reading it during implementation** (acoustics-psychoacoustics in particular). Missing `kind` falls back to `'sandbox'` so nothing vanishes if an entry is missed.

`TopicPageClient` changes:

- **Explore section** filters to `kind: sandbox | interface` (existing card grid, unchanged styling).
- **Revise section** gains a "Practice materials" list below the Start Revision / Exam Mode cards: the topic's `retrieval` + `practice` resources, rendered with the existing ResourceCard component. Topics with no question bank but with retrieval resources (delay, digital-analogue, leads-and-signals, general) show this list instead of the "coming soon" placeholder.
- Resource pages themselves do not change at all.

### 2. Courses (Learn door)

The learn data model already supports multiple lessons per topic (`lib/learn/topics/index.js` maps topicId → array). A course is simply that array, ordered, with light metadata:

```js
// each chapter (existing lesson shape, extended)
{
  id: 'waveforms',          // → /learn/synthesis/waveforms
  chapterNumber: 1,
  title: 'Sound & Waveforms',
  subtitle: 'Chapter 1 — Topic 1.3',
  description: '…',
  estimatedTime: '10–15 minutes',
  rows: [...],
  examAnchor: { ... },      // chapter-level, see §4
}
```

- `/learn/[topicId]` (the current picker) becomes the **course map**: chapters rendered as numbered cards in order using the existing card styling, with the student's position marked and a single **Continue** button (first incomplete chapter). Linked `learnResources` entries remain listed below the chapters, unchanged.
- EQ, dynamics, and delay keep working untouched as 1-chapter courses (their existing single lessons render identically; `chapterNumber` defaults to 1).
- URLs unchanged: `/learn/synthesis/[chapterId]`. The existing lesson id `synthesis` is retired in favour of chapter ids; a redirect from `/learn/synthesis/synthesis` → `/learn/synthesis/subtractive` preserves old links.

**Progress:** a chapter is complete when its end ripple fires (student reached the end). Stored in `localStorage` under `learn-progress:<topicId>` as `{ [chapterId]: 'completed' }` plus `lastVisited`. When a student token is present, the existing section-persistence answers continue to work exactly as now (unchanged backend; no new tables, no new data collection).

### 3. Chapter outro (dead-end fix)

The ripple animation and "You've reached the end of the lesson" message **stay**. Beneath them, a new `ChapterOutro` component renders:

- Chapters 1–(n−1): one card — "Next: Chapter N — Title".
- Final chapter: two cards — "Now go play" and "Prove it". For synthesis these point at the Operator image explorer and `/revise/synthesis`. For topics without a designated flagship resource (EQ, dynamics, delay as 1-chapter courses), the cards link to the topic page's Explore and Revise sections — no per-topic configuration required, with an optional `outroResourceId` field on the course when a topic later wants a specific target.
- Styling reuses the existing lesson-card idiom. No new visual language.

### 4. New optional row blocks (spine sections)

Rows without these render exactly as today — additive, backwards-compatible.

- **`audio`** — `{ preset: 'waveform-saw' | 'filter-sweep' | 'adsr-pluck' | 'lfo-vibrato' | 'fm-ratio' | …, params }`. Rendered as a press-and-hold listen button (`AudioBlock` component). All synthesis audio is generated live with Web Audio (oscillators/filters/envelopes — no samples needed). The press gesture doubles as the iOS AudioContext unlock. One shared AudioContext, hard-stopped on release/unmount.
- **`interactive`** — string id resolved from a small registry (`components/learn/interactives/`). **One knob per interactive, by law**: CutoffSlider, ResonanceKnob, ADSRShaper, LFODepthDial, FMRatioSlider. Anything with more knobs belongs in Explore. (The existing `interactive: 'waveform-text'` field on the oscillators row is folded into this registry.)
- **`examAnchor`** (chapter-level, not per-row) — `{ question, modelPoints: [...], examTip }`. Rendered as an "In the exam" section after the last row, before the ripple: how Edexcel asks about this chapter, one worked exam-style question with mark-scheme language, one tip. Content checked against the 1.3 spec AND past papers (spec-alignment rule).

### 5. The synthesis course (flagship content)

| Ch | id | Title | Status | Sections (draft) | Audio / interactive |
|---|---|---|---|---|---|
| 1 | `waveforms` | Sound & Waveforms | new | what sound is (frequency/amplitude) · harmonics & the series · the four waveforms · timbre = harmonic content | hear each waveform; waveform selector |
| 2 | `subtractive` | Subtractive Synthesis | deepen existing | what-is (kept) · oscillators (kept) · filters (kept) · **resonance (new — it's in the spec)** · signal flow (kept) | filter-sweep audio; CutoffSlider; ResonanceKnob |
| 3 | `envelopes` | Envelopes | grow existing | what an envelope is · amplitude ADSR (moved) · filter ADSR (moved) · envelope recipes (pad/pluck/bass) | pluck vs swell audio; ADSRShaper |
| 4 | `lfo-modulation` | LFOs & Modulation | new | what an LFO is · rate & depth · targets: pitch=vibrato, amp=tremolo, filter=wah · LFO vs envelope | vibrato/tremolo/wah audio; LFODepthDial |
| 5 | `fm-synthesis` | FM Synthesis | new | carrier & modulator · operators & algorithms (Operator) · ratios: harmonic vs inharmonic · FM in practice (bells, bass, DX7) | fm-ratio audio; FMRatioSlider |

Every chapter: existing spine format, ? checks on sections, expandable terms, chapter-level exam anchor, outro. Chapter 5's outro → Operator image explorer + synthesis revision bank.

Content sources (accuracy already verified there): C4 Synthesis Definitive Reference, Synthesis Workshop, subtractive-synth-explorer's existing audio graph code, dual-oscillator lab. Format: this site's DNA only.

### 6. Loose ends

- **Delay question bank**: missing; its flashcards now surface under delay's Revise door. Writing the bank is a noted follow-up, not in scope.
- **Orphaned `mixing` bank**: `lib/questions/mixing.json` is unreachable (no `mixing` topic id). **Open question for Mike** — attach to a topic, or retire. Not touched in this build.
- **`bpm-delay-calculator`** is deliberately cross-listed under delay and numeracy — keep.

## Non-goals

- No visual redesign of anything (hard constraint).
- No changes to individual resource pages.
- No SRS wiring, no new API routes, no new Supabase tables, no new data collection (GDPR posture unchanged).
- No Learn content for topics other than synthesis in this build.
- No deploy: built and verified locally; promotion through lab → production is Mike's call per the three-stage workflow.

## Testing & verification

- `npm run build` passes.
- Playwright **DOM checks** (not screenshots): course map lists 5 synthesis chapters in order; each chapter route renders its sections; every outro link resolves; old URL `/learn/synthesis/synthesis` redirects; per-topic door counts match the kind classification (Explore shows only sandbox+interface, Revise lists retrieval+practice); EQ/dynamics/delay lessons still render.
- Audio blocks: automated check that the button renders and the Web Audio graph constructs; actual sound quality signed off by Mike by ear (cannot be auto-verified — flagged, not skipped silently).
- `verify-house-build` gates run before any "done" claim.
- API security checklist: no route changes expected; grep confirms no new unauthenticated routes.

## Implementation phasing (for the plan)

1. **Re-filing** — add `kind` to all 51 resources, filter doors, Revise practice list. Smallest, ships the site-wide tidy.
2. **Course shell** — course map, progress, ChapterOutro, redirect. Fixes the dead-end for all existing lessons.
3. **Block types** — AudioBlock, interactives registry, examAnchor rendering.
4. **Content** — the five synthesis chapters, mined then verified against spec + past papers.
