---
shaping: true
---

# Revision Quiz — Shaping

## Requirements (R)

| ID | Requirement | Status |
|----|-------------|--------|
| **R0** | **Revision must be active retrieval — terminology, applied understanding, and calculations** | Core goal |
| **R1** | **Student self-assessment** | |
| R1.1 | Students can see their own strengths and weaknesses by topic | Must-have |
| R1.2 | Wrong answers show explanations + students see their learning trajectory over time | Must-have |
| **R2** | **Teacher visibility** | |
| R2.1 | Teacher can see who is revising and how they're performing — real-time, question-level detail | Must-have |
| R2.2 | Results stored in Supabase with question-level granularity | Must-have |
| **R3** | **Question design** | |
| R3.1 | Questions go beyond glossary definitions — include numeric, short answer, and applied | Must-have |
| R3.2 | Question banks are a mix of hand-written and AI-generated, per topic | Must-have |
| R3.3 | Same questions per topic each attempt — mastery through repetition | Must-have |
| **R4** | **Platform constraints** | |
| R4.1 | Lives inside interactive-resources, in the Revise section of topic pages | Must-have |
| R4.2 | Students authenticate via token (reuse grades-dashboard pattern) | Must-have |
| R4.3 | Self-directed use (homework/revision) | Constraint |
| R4.4 | Scoped to current U6 cohort | Constraint |

---

## Shapes Considered

### A: Quiz Widget in Topic Page (rejected)
Inline quiz in Revise section. Too lightweight — fails R1.1, R1.2, R2.1.

### C: Spaced Retrieval Queue (rejected)
Cross-topic Anki-style queue. Conflicts with R3.3 (same questions each attempt) and R4.1 (per-topic structure).

### B: Dedicated Revision App (selected)

| Part | Mechanism |
|------|-----------|
| **B1** | `/revise/[topicId]` route with dedicated revision UI |
| **B2** | Topic page Revise section shows progress summary + "Start Revision" link |
| **B3** | Question banks as JSON files in `lib/questions/` per topic |
| **B4** | Token auth — gate before first quiz, stored in localStorage |
| **B5** | Results POST to Supabase per question in real-time |
| **B6** | Post-question feedback with explanation |
| **B7** | End-of-session summary with topic breakdown (strong/weak areas) |
| **B8** | Learning trajectory — scores over repeated attempts |
| **B9** | Teacher dashboard in grades-dashboard — per-student activity, question-level detail |

## Fit Check: R × B

| Req | Requirement | Status | B |
|-----|-------------|--------|---|
| R0 | Active retrieval — terminology, applied understanding, calculations | Core goal | ✅ |
| R1.1 | Students see strengths/weaknesses by topic | Must-have | ✅ |
| R1.2 | Wrong answers show explanations + learning trajectory over time | Must-have | ✅ |
| R2.1 | Teacher sees who is revising, real-time, question-level | Must-have | ✅ |
| R2.2 | Results in Supabase with question-level granularity | Must-have | ✅ |
| R3.1 | Beyond glossary — numeric, short answer, applied | Must-have | ✅ |
| R3.2 | Hand-written + AI-generated question banks per topic | Must-have | ✅ |
| R3.3 | Same questions per topic each attempt | Must-have | ✅ |
| R4.1 | Lives in interactive-resources, Revise section | Must-have | ✅ |
| R4.2 | Token auth (reuse grades-dashboard) | Must-have | ✅ |
| R4.3 | Self-directed use | Constraint | ✅ |
| R4.4 | Scoped to U6 cohort | Constraint | ✅ |

---

## Detail B: Breadboard

### Places

| # | Place | Description |
|---|-------|-------------|
| P1 | Topic Page (Revise section) | Existing page — progress summary + entry point |
| P2 | Auth Gate | Token entry — blocks quiz until authenticated |
| P3 | Quiz Session (`/revise/[topicId]`) | One question at a time, answer + feedback loop |
| P4 | Quiz Results | End-of-session summary, trajectory chart |
| P5 | Backend | Supabase tables + API routes |
| P6 | Teacher Dashboard | Revision activity view (grades-dashboard) |

### UI Affordances

| # | Place | Component | Affordance | Control | Wires Out | Returns To |
|---|-------|-----------|------------|---------|-----------|------------|
| U1 | P1 | TopicPageClient | Progress card (attempts, best score, last date) | render | — | — |
| U2 | P1 | TopicPageClient | "Start Revision" button | click | → P2 or P3 | — |
| U3 | P2 | AuthGate | Token input field | type | — | — |
| U4 | P2 | AuthGate | "Enter" button | click | → N1 | — |
| U5 | P2 | AuthGate | Error message (invalid token) | render | — | — |
| U6 | P3 | QuizSession | Progress bar (Q3 of 12) | render | — | — |
| U7 | P3 | QuizSession | Question text | render | — | — |
| U8 | P3 | QuizSession | MCQ option buttons | click | → N5 | — |
| U9 | P3 | QuizSession | Numeric answer input | type | — | — |
| U10 | P3 | QuizSession | Short answer text area | type | — | — |
| U11 | P3 | QuizSession | "Submit Answer" button (numeric/short) | click | → N5 | — |
| U12 | P3 | QuizSession | Feedback panel (correct/wrong + explanation) | render | — | — |
| U13 | P3 | QuizSession | "Next Question" button | click | → N6 | — |
| U14 | P4 | QuizResults | Score summary (7/12, 58%) | render | — | — |
| U15 | P4 | QuizResults | Per-question breakdown (green/red) | render | — | — |
| U16 | P4 | QuizResults | Learning trajectory chart | render | — | — |
| U17 | P4 | QuizResults | Strength/weakness labels per question type | render | — | — |
| U18 | P4 | QuizResults | "Try Again" button | click | → P3 | — |
| U19 | P4 | QuizResults | "Back to Topic" link | click | → P1 | — |
| U20 | P6 | RevisionActivity | Student list with last activity + score | render | — | — |
| U21 | P6 | RevisionActivity | Per-student drill-down | click | → U22 | — |
| U22 | P6 | RevisionActivity | Question-level detail table | render | — | — |
| U23 | P6 | RevisionActivity | Topic filter / heatmap | render | — | — |

### Code Affordances

| # | Place | Component | Affordance | Control | Wires Out | Returns To |
|---|-------|-----------|------------|---------|-----------|------------|
| N1 | P2 | AuthGate | `verifyToken()` — POST to `/api/verify-token` | call | → N2 | → U5 (on fail) |
| N2 | P5 | API route | `get_student_by_token` RPC on Supabase | call | — | → N1 |
| N3 | P2 | AuthGate | Store token + student_id in localStorage | write | → S1 | — |
| N4 | P3 | QuizSession | `loadQuestions(topicId)` | call | — | → S2 |
| N5 | P3 | QuizSession | `submitAnswer(questionId, answer)` | call | → N7, → S3 | → U12 |
| N6 | P3 | QuizSession | `nextQuestion()` — advance or → P4 if last | call | → S4 | → U6, U7 |
| N7 | P5 | API route | `POST /api/quiz-result` | call | → N8 | — |
| N8 | P5 | Supabase | Insert into `quiz_responses` | write | → S5 | — |
| N9 | P3 | QuizSession | `loadHistory(studentId, topicId)` | call | → N10 | → S6 |
| N10 | P5 | API route | `GET /api/quiz-history` | call | — | → N9 |
| N11 | P4 | QuizResults | `calculateSummary(responses)` | call | — | → U14, U15, U16, U17 |
| N12 | P1 | TopicPageClient | `loadProgress(studentId, topicId)` | call | → N13 | → U1 |
| N13 | P5 | API route | `GET /api/quiz-progress` | call | — | → N12 |
| N14 | P6 | RevisionActivity | `loadAllActivity()` | call | → N15 | → U20, U23 |
| N15 | P5 | Supabase | Query `quiz_responses` joined with students | call | — | → N14 |

### Data Stores

| # | Place | Store | Description |
|---|-------|-------|-------------|
| S1 | P2/P3 | localStorage `student_token`, `student_id` | Auth persistence |
| S2 | P3 | `questions[]` | Loaded question bank for current topic |
| S3 | P3 | `currentResponses[]` | This session's answers |
| S4 | P3 | `questionIndex` | Current question position |
| S5 | P5 | `quiz_responses` table | Supabase — per-question results |
| S6 | P3/P4 | `history[]` | Previous attempts from Supabase |

### Supabase Schema: `quiz_responses`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| student_id | uuid | FK → students |
| topic_id | text | e.g. "eq", "compression" |
| question_id | text | e.g. "eq-mcq-03" |
| question_type | text | "mcq", "numeric", "short" |
| answer | text | Student's answer |
| correct | boolean | Was it correct |
| attempt_number | int | Which attempt at this topic |
| created_at | timestamptz | When answered |

---

## Slices

| # | Slice | Parts | Demo |
|---|-------|-------|------|
| V1 | Quiz engine works | B1, B3, B6 | "Open /revise/eq, answer questions, see feedback with explanations" |
| V2 | Auth gate | B4 | "Enter token, get verified, proceed to quiz" |
| V3 | Results summary | B7 | "Finish quiz, see score and per-question breakdown" |
| V4 | Supabase persistence | B5 | "Answer questions, check Supabase — rows appearing in real-time" |
| V5 | Progress + trajectory | B2, B8 | "See progress card on topic page, take quiz twice, see trajectory chart" |
| V6 | Teacher dashboard | B9 | "Open grades-dashboard, see who's revising, drill into question-level detail" |

### Dependencies

V1 → V2 (auth gates quiz access)
V1 → V3 (results need session data)
V2 + V3 → V4 (persistence needs student_id + results)
V4 → V5 (trajectory needs stored data)
V4 → V6 (teacher view needs stored data)

### V1: Quiz Engine Works

| # | Affordance | Control | Wires Out | Returns To |
|---|------------|---------|-----------|------------|
| U6 | Progress bar (Q3 of 12) | render | — | — |
| U7 | Question text | render | — | — |
| U8 | MCQ option buttons | click | → N5 | — |
| U9 | Numeric answer input | type | — | — |
| U10 | Short answer text area | type | — | — |
| U11 | "Submit Answer" button | click | → N5 | — |
| U12 | Feedback panel (correct/wrong + explanation) | render | — | — |
| U13 | "Next Question" button | click | → N6 | — |
| N4 | `loadQuestions(topicId)` | call | — | → S2 |
| N5 | `submitAnswer(questionId, answer)` | call | → S3 | → U12 |
| N6 | `nextQuestion()` | call | → S4 | → U6, U7 |

Also needed: one question bank JSON (EQ topic, ~12 questions across MCQ/numeric/short).

### V2: Auth Gate

| # | Affordance | Control | Wires Out | Returns To |
|---|------------|---------|-----------|------------|
| U2 | "Start Revision" button | click | → P2 or P3 | — |
| U3 | Token input field | type | — | — |
| U4 | "Enter" button | click | → N1 | — |
| U5 | Error message | render | — | — |
| N1 | `verifyToken()` | call | → N2 | → U5 |
| N2 | `get_student_by_token` RPC | call | — | → N1 |
| N3 | Store in localStorage | write | → S1 | — |

### V3: Results Summary

| # | Affordance | Control | Wires Out | Returns To |
|---|------------|---------|-----------|------------|
| U14 | Score summary (7/12, 58%) | render | — | — |
| U15 | Per-question breakdown | render | — | — |
| U17 | Strength/weakness labels | render | — | — |
| U18 | "Try Again" button | click | → P3 | — |
| U19 | "Back to Topic" link | click | → P1 | — |
| N11 | `calculateSummary(responses)` | call | — | → U14, U15, U17 |

### V4: Supabase Persistence

| # | Affordance | Control | Wires Out | Returns To |
|---|------------|---------|-----------|------------|
| N7 | `POST /api/quiz-result` | call | → N8 | — |
| N8 | Insert into `quiz_responses` | write | → S5 | — |

Also needed: Supabase migration for `quiz_responses` table.

### V5: Progress + Trajectory

| # | Affordance | Control | Wires Out | Returns To |
|---|------------|---------|-----------|------------|
| U1 | Progress card | render | — | — |
| U16 | Learning trajectory chart | render | — | — |
| N9 | `loadHistory(studentId, topicId)` | call | → N10 | → S6 |
| N10 | `GET /api/quiz-history` | call | — | → N9 |
| N12 | `loadProgress(studentId, topicId)` | call | → N13 | → U1 |
| N13 | `GET /api/quiz-progress` | call | — | → N12 |

### V6: Teacher Dashboard

| # | Affordance | Control | Wires Out | Returns To |
|---|------------|---------|-----------|------------|
| U20 | Student list with activity + score | render | — | — |
| U21 | Per-student drill-down | click | → U22 | — |
| U22 | Question-level detail table | render | — | — |
| U23 | Topic filter / heatmap | render | — | — |
| N14 | `loadAllActivity()` | call | → N15 | → U20, U23 |
| N15 | Query `quiz_responses` joined with students | call | — | → N14 |
