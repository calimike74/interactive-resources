# Read-Then-Quiz Component Design

**Date**: 2026-04-06
**Status**: Approved
**First topic**: 1.9 Dynamic Range Compression

## Purpose

A self-contained interactive tool where students read a short passage on a curriculum topic, then answer questions from memory. Grounded in Cho's research on self-explanation (Chi et al., 1994) and retrieval practice (Karpicke, 2012) — reading for comprehension followed by retrieval strengthens conceptual understanding and transfer.

Fits the validated Read-Then-Interact pattern: students read curated content (Obsidian book extracts or teacher-written passages), then interact with a tool that forces retrieval.

## Architecture

Phase Components + Orchestrator pattern. A thin orchestrator manages state transitions between four focused phase components. Topic content lives in JSON data files.

### Component Files

```
components/resources/ReadThenQuiz/
  ReadThenQuiz.jsx        — orchestrator (state machine, scaffold selector, Supabase persistence)
  ReadingPhase.jsx        — passage display, key term highlights, minimum time gate
  OpenEndedPhase.jsx      — self-explanation prompt, sentence starters, guiding sub-questions
  MCQPhase.jsx            — one-at-a-time MCQ, hints, immediate/deferred feedback
  ResultsPhase.jsx        — score summary, timing, written response review, MCQ review

lib/read-then-quiz/topics/
  dynamic-compression.json — first topic data file
```

### Data Flow

```
Topic JSON → ReadThenQuiz (orchestrator)
               ├── manages: phase, answers, timing, scaffold level
               ├── renders: current phase component
               └── on completion: Supabase insert with all collected data
```

## Student Flow

### Step 1: Entry
- Student enters their name
- Selects scaffold level (Full / Medium / Minimal / Independent)
- Brief explanation: "You'll read a short passage, then answer questions from memory. The passage disappears before the questions appear."
- Shows estimated time and question count
- "Start Reading" button

### Step 2: Reading Phase
- Passage displayed with comfortable reading typography
- At Full/Medium scaffold: key terms highlighted with tooltip definitions
- At Minimal/Independent scaffold: plain text
- Minimum reading time gate: button disabled until minimum time elapsed (calculated at ~200 WPM from passage word count)
- "I'm Ready — Show Questions" button activates after minimum time
- Status indicator shows "Reading..." (no countdown — self-paced, not anxiety-inducing)
- Warning text: "The passage will disappear when you continue"

### Step 3: Open-Ended Phase
- Passage fades out with CSS transition
- Single self-explanation question appears (e.g. "In your own words, explain how a compressor affects the dynamic range of a signal")
- Scaffold-dependent support:
  - **Full**: sentence starters + guiding sub-questions
  - **Medium**: sentence starters only
  - **Minimal**: just the question prompt
  - **Independent**: just the question prompt
- Text area with word count
- "Submit Answer" button

### Step 4: MCQ Phase
- 2-3 multiple choice questions, displayed one at a time
- 4 options per question (A/B/C/D)
- Scaffold-dependent behaviour:
  - **Full**: hint button available ("Think about..."), immediate feedback with explanation after each question
  - **Medium**: immediate feedback with explanation, no hints
  - **Minimal**: immediate feedback with explanation, no hints
  - **Independent**: no immediate feedback — just "Next Question" after selecting. All feedback shown at results stage.
- "Next Question" button after answering

### Step 5: Results Phase
- MCQ score (e.g. "2/3")
- Reading time and total time
- Scaffold level used
- Written response displayed back to student (read-only)
- MCQ review: each question with tick/cross, what they selected, correct answer and explanation
- "Done" button
- Supabase insert fires at this stage with all collected data

## Passage Visibility Configuration

The orchestrator holds a `hidePassageDuringQuiz` flag (default: `true`). When `true`, the passage fades before the open-ended phase. When `false`, the passage remains visible during the open-ended phase but hides before MCQ.

This allows softening the difficulty without changing phase components — only the orchestrator's transition logic changes. Can be set globally or per topic in the JSON data file.

## Scaffold Level Mapping

| Level | Reading Phase | Open-Ended | MCQ |
|-------|--------------|------------|-----|
| Full | Key terms highlighted + tooltips | Sentence starters + guiding sub-questions | Hint button + immediate feedback |
| Medium | Key terms highlighted + tooltips | Sentence starters only | Immediate feedback, no hints |
| Minimal | Plain passage | Just the prompt | Immediate feedback, no hints |
| Independent | Plain passage | Just the prompt | No immediate feedback (all at results) |

## Topic Data File Format

```json
{
  "id": "rtq-dynamic-compression",
  "title": "Dynamic Range Compression",
  "topic": "1.9",
  "passage": {
    "text": "A compressor reduces the dynamic range...",
    "wordCount": 200,  // optional — computed from text at runtime if omitted
    "keyTerms": [
      { "term": "threshold", "definition": "The level above which gain reduction begins" },
      { "term": "ratio", "definition": "Expressed as X:1, determines how much the signal is reduced" },
      { "term": "attack", "definition": "How quickly the compressor responds once the signal exceeds the threshold" },
      { "term": "release", "definition": "How quickly the compressor stops acting once the signal drops below the threshold" }
    ]
  },
  "openEnded": {
    "prompt": "In your own words, explain how a compressor affects the dynamic range of a signal.",
    "sentenceStarters": [
      "A compressor works by...",
      "When the signal exceeds the threshold..."
    ],
    "guidingSubQuestions": [
      "What triggers the compressor to act?",
      "How does the ratio control the amount of reduction?"
    ]
  },
  "mcq": [
    {
      "question": "What happens when an audio signal exceeds the compressor's threshold?",
      "options": [
        "It is amplified to match the threshold level",
        "Gain reduction is applied according to the ratio",
        "The signal is muted until it drops below the threshold",
        "The attack time automatically increases"
      ],
      "correct": 1,
      "hint": "Think about what the threshold represents — a boundary between unprocessed and processed signal.",
      "explanation": "When the signal exceeds the threshold, the compressor applies gain reduction according to the ratio setting."
    }
  ]
}
```

## Supabase Schema

```sql
CREATE TABLE read_then_quiz_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    topic_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    scaffold_level TEXT NOT NULL CHECK (scaffold_level IN ('full','medium','minimal','independent')),
    open_ended_response TEXT,
    mcq_answers JSONB,
    mcq_score INTEGER,
    mcq_total INTEGER,
    reading_time_seconds INTEGER,
    total_time_seconds INTEGER,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);
```

`mcq_answers` stores: `[{questionIndex: 0, selected: 1, correct: true}, ...]`

No RLS — public insert, same pattern as `essay_responses`.

## Resource Registry Integration

Each topic JSON maps to a resource entry:

```javascript
{
  id: 'rtq-dynamic-compression',
  title: 'Read & Recall: Dynamic Range Compression',
  component: 'ReadThenQuiz',
  topic: '1.9 Dynamic Processing',
  type: 'practice',
  difficulty: 'foundation',
  estimatedTime: '5-8 minutes',
  learningObjectives: [
    'Explain how a compressor affects dynamic range',
    'Identify the role of threshold and ratio'
  ],
  dataFile: 'dynamic-compression'
}
```

- **ID convention**: `rtq-[topic-slug]`
- **Display title**: "Read & Recall: [Topic Name]"
- **URL**: `/rtq-dynamic-compression` (existing `[resourceId]` dynamic route)
- **Type**: `practice`

## Styling

Follows existing app conventions:
- Uses `theme.js` design tokens (colours, typography, spacing)
- Dark theme consistent with other resources
- Passage uses comfortable reading typography (larger line-height, constrained max-width)
- Phase transitions use CSS fade animations
- Mobile responsive (students access on phones and tablets)

## Out of Scope

- Teacher dashboard view of responses (use Supabase dashboard or future feature)
- AI-powered feedback on open-ended responses
- Adaptive difficulty (adjusting questions based on performance)
- Audio passages (text only for v1)
- Multiple passages per session (one passage, one question set per topic)
