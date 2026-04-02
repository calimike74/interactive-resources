# Interactive Essay Feedback — Design Document

**Date**: 2026-03-30 (updated 2026-04-01)
**Status**: Prototype complete — UI polished, ready for real student data
**Location**: `interactive-resources` project, route `/feedback/[essayId]`

## Overview

Replace the current manual copy-paste essay feedback workflow with an interactive HTML page where students explore their marked essay by tapping colour-coded annotations. Students control what feedback they see, configure accessibility settings, and export their personalised view to OneNote.

## Data Model

Each marked essay is a JSON object stored in `lib/feedback/`:

```json
{
  "studentId": "lower-sixth-student-01",
  "essayTitle": "Stereo Recording Techniques",
  "topic": "1.2 Recording",
  "submittedAt": "2026-03-28",
  "essayText": "Full essay text as a single string...",
  "annotations": [
    {
      "id": "ann-1",
      "startChar": 0,
      "endChar": 52,
      "type": "ao3",
      "level": "strong",
      "mark": 2,
      "maxMark": 2,
      "descriptor": "Accurate description of spaced pair operation",
      "comment": "Clear technical explanation of time-of-arrival differences.",
      "improvement": null
    },
    {
      "id": "ann-2",
      "startChar": 120,
      "endChar": 198,
      "type": "ao4",
      "level": "partial",
      "mark": 1,
      "maxMark": 2,
      "descriptor": "Evaluation of technique suitability",
      "comment": "You identify the wide stereo image but don't compare to other techniques.",
      "improvement": "Push further by comparing spaced pair's width to XY's narrower but phase-safe image."
    }
  ],
  "summary": {
    "ao3": { "awarded": 8, "total": 12 },
    "ao4": { "awarded": 5, "total": 8 },
    "combined": { "awarded": 13, "total": 20 },
    "level": "Level 3"
  }
}
```

Key fields:
- `startChar`/`endChar` — character ranges tying annotations to exact passages
- `type` — `ao3` or `ao4`
- `level` — `strong` / `partial` / `weak` (maps to green / amber / red)
- `improvement` — only present on partial/weak annotations; drives "Show Improvements" filter

## Interactive Viewer

### Top Bar (sticky)
- Essay title and topic
- Three score badges: AO3, AO4, combined total with level
- Toggle buttons: Off | Show All | Show Improvements

### Essay Body
- **Off**: clean essay text, no annotations. First-read reflection.
- **Show All**: highlighted passages with green/amber/red colour coding. Mark badge on each (e.g., `2/2`).
- **Show Improvements**: only partial/weak annotations visible. Focuses on what to fix.

### Tap Interaction
- Tap highlighted passage → inline panel slides open below
- Shows: mark, AO descriptor, comment, improvement suggestion
- One panel open at a time
- Tap again to collapse

### Accessibility Toolbar (below top bar)
- Font size +/- buttons
- Font toggle: default / OpenDyslexic
- Background tint: white / cream / pale blue
- Line spacing: normal / wide

### Copy My View (sticky bottom)
- Captures essay + visible annotations + expanded panels
- Rich text clipboard (colours preserved in OneNote/Word)
- Plain text fallback for unsupported apps
- Respects current accessibility settings

## Marking Workflow

1. Student writes essay in existing `StereoRecordingEssay` scaffold
2. Claude does first-pass marking → outputs annotation JSON
3. Teacher reviews and adjusts (edit marks, reword suggestions)
4. Reviewed JSON saved to `lib/feedback/` and deployed
5. Student receives URL and explores feedback

## Prototype Scope

### In
- One real Lower Sixth stereo recording essay with annotations
- Full viewer: top bar, three toggles, tap-to-expand, accessibility toolbar
- Copy My View with rich text + plain text fallback
- Mobile-first responsive layout
- Route: `/feedback/[essayId]` in interactive-resources

### Out (future iterations)
- Pretext typography / Knuth-Plass justification
- Pinch-to-expand gesture
- Separate AO3/AO4 toggle filters
- Teacher review UI
- Supabase storage / upload API
- Engagement tracking
- ElevenLabs audio read-aloud
- Per-student auth

## Tech Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Project | interactive-resources | Students already use this site |
| Styling | Inline styles + `lib/theme.js` | Matches existing codebase |
| Data | Static JSON in `lib/feedback/` | Simplest for prototype |
| Annotations | Split text at char ranges, wrap in spans | Proven syntax-highlighter pattern |
| Expand panels | CSS max-height transition | No extra dependencies |
| Accessibility | React state → CSS custom properties | Font, spacing, background via CSS vars |
| Copy | clipboard.write() rich text + plain fallback | OneNote preserves colours |
| Dependencies | None new | Zero new packages |

## Pedagogical Grounding

- **Desirable difficulty** (Bjork) — student must actively tap to reveal feedback
- **Elaborative interrogation** — "why did I get this mark?" answered in context
- **Spaced engagement** — toggles encourage multiple reads with different lenses
- **Metacognitive export** — choosing what to copy is itself a learning exercise
