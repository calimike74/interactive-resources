# Examiner Hint Popovers

**Date**: 2026-03-10
**Status**: Approved
**Scope**: Interactive Resources + Grades Dashboard

## Summary

Surface curated examiner guidance snippets (from Principal Examiner's Reports) across both sites via click-triggered popovers. Helps students understand what examiners are looking for, directly in context where they're studying.

## Decisions

- **Per-topic hints** (not per-question) — curated 1-3 snippets per topic code, reusable across both sites
- **Duplicate data file** in each project (`lib/examiner-hints.js`) — static data, updated once per exam cycle
- **Port existing Popover.jsx** from grades-dashboard to interactive-resources, adapted to inline styles/theme.js
- **Flowbite-style layout** — tinted header bar ("Examiner says"), white body with hint text, arrow to trigger
- **Click-triggered** (not hover) — matches accessibility best practices for interactive content
- **Structured content** (option 2) — title + snippet text, no revision links in v1

## Data Structure

```js
// lib/examiner-hints.js (identical file in both projects)
export const examinerHints = {
  '1.3': [
    { title: 'Synthesis', hint: 'Candidates often confuse subtractive and additive synthesis...' },
  ],
  '1.9': [
    { title: 'Dynamic Processing', hint: '...' },
  ],
  // keyed by spec reference, 1-3 hints per topic
};
```

**Source data**: CSVs in `Professional/Planning-and-Admin/Music Technology Comp_4/`:
- `2025_ARCHIVE/intermediate_csvs/complete_2025_questions_with_examiner_feedback.csv` (Component 4)
- `COMPONENT_3_PROCESSING/output_files/component3_2025_questions_with_feedback.csv` (Component 3)

## Integration Points

### Interactive Resources (3 points)

1. **TopicCard.jsx** — examiner badge next to spec ref badge (top-right). Click opens popover.
2. **ResourcePageClient.js** — badge in breadcrumb/header area next to topic name. Click opens popover.
3. **RevisePageClient.js** — after incorrect answer, append examiner hint inline (no popover).

### Grades Dashboard (2 points)

1. **QuestionTreeView.jsx** — badge next to topic code badges (lines 221-232). Click opens popover.
2. **ExamResultsView.jsx** — add examiner hints section inside existing TopicPopover.

## Component Architecture

### New Files
- `interactive-resources/components/ui/Popover.jsx` — ported from grades-dashboard, inline styles
- `interactive-resources/components/ui/ExaminerHintBadge.jsx` — trigger badge + popover content
- `interactive-resources/lib/examiner-hints.js` — data file
- `grades-dashboard/components/ui/ExaminerHintBadge.jsx` — trigger badge + popover content
- `grades-dashboard/lib/examiner-hints.js` — data file

### Modified Files
- `interactive-resources/components/TopicCard.jsx` — add ExaminerHintBadge
- `interactive-resources/app/[resourceId]/ResourcePageClient.js` — add ExaminerHintBadge
- `interactive-resources/app/revise/[topicId]/RevisePageClient.js` — inline hint on wrong answers
- `grades-dashboard/components/QuestionTreeView.jsx` — add ExaminerHintBadge
- `grades-dashboard/components/ui/TopicPopover.jsx` — add examiner hints section

## Implementation Order

1. Read examiner CSVs → curate hints → write `lib/examiner-hints.js`
2. Port Popover.jsx to interactive-resources
3. Build ExaminerHintBadge component (both projects)
4. Integrate into interactive-resources (TopicCard → ResourcePage → ReviseClient)
5. Integrate into grades-dashboard (QuestionTreeView → TopicPopover)
6. Build both projects, verify

## Popover Design

```
┌─────────────────────────────┐
│ Examiner says          1.9  │  ← tinted header (topic accent colour)
├─────────────────────────────┤
│ Many candidates cannot      │  ← white body
│ clearly explain threshold   │
│ vs ratio independently.     │
│                             │
│ Sidechain compression is    │  ← multiple hints separated
│ frequently misunderstood... │
└──────────────┬──────────────┘
               ▽                  ← arrow to trigger
          [ 📋 badge ]
```
