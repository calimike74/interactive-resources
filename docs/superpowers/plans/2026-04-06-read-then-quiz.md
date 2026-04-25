# Read-Then-Quiz Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive Read-Then-Quiz component where students read a passage, then answer questions from memory — one open-ended self-explanation followed by 2-3 MCQs, with four scaffold levels.

**Architecture:** Phase Components + Orchestrator. A thin `ReadThenQuiz.jsx` manages state transitions between `ReadingPhase`, `OpenEndedPhase`, `MCQPhase`, and `ResultsPhase`. Topic content lives in JSON-style JS files under `lib/read-then-quiz/topics/`. Results persist to Supabase.

**Tech Stack:** Next.js 16 (App Router), React 19, Supabase (public insert, no RLS), inline styles via `lib/theme.js` design tokens.

**Spec:** `docs/superpowers/specs/2026-04-06-read-then-quiz-design.md`

---

## File Map

```
lib/read-then-quiz/
  topics/
    dynamic-compression.js    — first topic data (passage, questions, metadata)
    index.js                  — topic registry: maps resourceId → topic data

lib/resources/
  rtq-dynamic-compression.js  — resource metadata for registry

components/resources/ReadThenQuiz/
  ReadThenQuiz.jsx            — orchestrator (state machine, scaffold selector, Supabase persist)
  ReadingPhase.jsx            — passage display, key term highlights, min-time gate
  OpenEndedPhase.jsx          — self-explanation prompt, sentence starters, sub-questions
  MCQPhase.jsx                — one-at-a-time MCQ, hints, immediate/deferred feedback
  ResultsPhase.jsx            — score summary, timing, response review

Modify:
  lib/resources/index.js      — import + register rtq-dynamic-compression
  app/[resourceId]/ResourcePageClient.js — import + register ReadThenQuiz component
```

---

### Task 1: Supabase Table

**Files:**
- Create: `supabase-read-then-quiz.sql`

- [ ] **Step 1: Write the SQL migration file**

```sql
-- supabase-read-then-quiz.sql
-- Read-Then-Quiz response storage

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

- [ ] **Step 2: Run the migration in Supabase**

Open the Supabase dashboard SQL editor for the interactive-resources project and run the SQL above.

Verify: Check the Table Editor shows `read_then_quiz_responses` with all columns.

- [ ] **Step 3: Commit**

```bash
git add supabase-read-then-quiz.sql
git commit -m "feat: add read_then_quiz_responses table schema"
```

---

### Task 2: Topic Data File

**Files:**
- Create: `lib/read-then-quiz/topics/dynamic-compression.js`
- Create: `lib/read-then-quiz/topics/index.js`

- [ ] **Step 1: Create the topic data file**

Write `lib/read-then-quiz/topics/dynamic-compression.js`:

```javascript
const dynamicCompression = {
    id: 'rtq-dynamic-compression',
    title: 'Dynamic Range Compression',
    topic: '1.9',
    hidePassageDuringQuiz: true,
    passage: {
        text: `A compressor is a dynamic processing tool that reduces the dynamic range of an audio signal. It works by attenuating the level of sounds that exceed a set threshold. The amount of gain reduction applied is determined by the ratio — for example, a 4:1 ratio means that for every 4dB the signal goes above the threshold, only 1dB will pass through the compressor's output.

Two critical time-based controls shape how the compressor responds. The attack time sets how quickly the compressor begins to act once the signal exceeds the threshold — a fast attack clamps down almost immediately, while a slow attack lets the initial transient through before compression begins. The release time determines how quickly the compressor stops reducing gain once the signal drops back below the threshold.

After compression, the overall signal level is typically lower because the peaks have been reduced. Make-up gain (sometimes called output gain) is used to bring the compressed signal back up to a usable level. This is why compression is often described as making quiet parts louder and loud parts quieter — the peaks are reduced, then the whole signal is boosted, narrowing the gap between the quietest and loudest moments.

Compression is used across almost every genre of recorded music. On vocals, it evens out the natural dynamic variation so that every word sits clearly in the mix. On drums, it can add punch by letting the transient through (slow attack) and then pulling down the sustain portion of the sound. On a mix bus, gentle compression can 'glue' the elements of a mix together, giving it a more cohesive and polished feel.`,
        keyTerms: [
            { term: 'threshold', definition: 'The level above which the compressor begins to reduce gain' },
            { term: 'ratio', definition: 'How much gain reduction is applied, expressed as input:output (e.g. 4:1)' },
            { term: 'attack', definition: 'How quickly the compressor responds once the signal exceeds the threshold' },
            { term: 'release', definition: 'How quickly the compressor stops acting once the signal drops below the threshold' },
            { term: 'make-up gain', definition: 'Output gain used to restore level after compression has reduced peaks' },
            { term: 'dynamic range', definition: 'The difference between the quietest and loudest parts of an audio signal' },
            { term: 'transient', definition: 'The initial, short-lived peak at the start of a sound (e.g. a drum hit)' },
        ],
    },
    openEnded: {
        prompt: 'In your own words, explain how a compressor affects the dynamic range of an audio signal. Include the role of at least two compressor controls in your answer.',
        sentenceStarters: [
            'A compressor works by...',
            'When the signal level goes above the threshold...',
            'The ratio setting controls...',
        ],
        guidingSubQuestions: [
            'What triggers the compressor to start reducing gain?',
            'How does the ratio determine the amount of compression?',
            'Why is make-up gain needed after compression?',
        ],
    },
    mcq: [
        {
            question: 'A signal peaks at 12dB above the threshold with a ratio of 4:1. How much of that 12dB excess passes through?',
            options: [
                '12dB — the ratio only affects signals below the threshold',
                '4dB — the excess is divided by the first number in the ratio',
                '3dB — the excess is divided by the first number in the ratio',
                '1dB — only 1dB of every 4dB is allowed through',
            ],
            correct: 2,
            hint: 'The ratio tells you the relationship between input level above threshold and output level above threshold. With 4:1, for every 4dB over, only 1dB gets through.',
            explanation: 'With a 4:1 ratio, the 12dB excess is divided by 4, so 3dB passes through. The output is 3dB above the threshold instead of 12dB.',
        },
        {
            question: 'A drummer wants to preserve the initial "crack" of the snare but reduce the ringing sustain. Which compressor setting is most important?',
            options: [
                'A high ratio to maximise gain reduction',
                'A slow attack time to let the transient through before compression begins',
                'A fast release time to stop compression before the sustain',
                'A low threshold to catch every part of the signal',
            ],
            correct: 1,
            hint: 'Think about what happens in the first few milliseconds of a drum hit. Which control determines whether the compressor acts on that initial peak?',
            explanation: 'A slow attack lets the initial transient pass through uncompressed, preserving the "crack". The compressor then engages to reduce the sustain that follows.',
        },
        {
            question: 'After applying heavy compression to a vocal, the signal sounds quieter than the original even though the dynamics are more even. What should you adjust?',
            options: [
                'Increase the ratio to compress more aggressively',
                'Lower the threshold to catch more of the signal',
                'Increase the make-up gain to restore the output level',
                'Shorten the release time so compression disengages faster',
            ],
            correct: 2,
            hint: 'Compression reduces peaks, which lowers the overall level. There is a specific control designed to compensate for this.',
            explanation: 'Make-up gain (output gain) compensates for the level lost during compression. After the peaks are reduced, make-up gain brings the overall signal back up to a usable level.',
        },
    ],
};

export default dynamicCompression;
```

- [ ] **Step 2: Create the topic index**

Write `lib/read-then-quiz/topics/index.js`:

```javascript
import dynamicCompression from './dynamic-compression';

const topics = {
    'rtq-dynamic-compression': dynamicCompression,
};

export function getTopicData(resourceId) {
    return topics[resourceId] || null;
}

export function getAllTopicIds() {
    return Object.keys(topics);
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/read-then-quiz/
git commit -m "feat: add read-then-quiz topic data for dynamic compression"
```

---

### Task 3: ReadingPhase Component

**Files:**
- Create: `components/resources/ReadThenQuiz/ReadingPhase.jsx`

- [ ] **Step 1: Create the ReadingPhase component**

Write `components/resources/ReadThenQuiz/ReadingPhase.jsx`:

```jsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { theme, typography, spacing, borderRadius, transitions } from '@/lib/theme';

const t = theme.light;

export default function ReadingPhase({ passage, scaffoldLevel, onComplete }) {
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [ready, setReady] = useState(false);
    const intervalRef = useRef(null);

    const wordCount = passage.text.split(/\s+/).length;
    const minTimeSeconds = Math.ceil((wordCount / 200) * 60);

    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setTimeElapsed(prev => {
                const next = prev + 1;
                if (next >= minTimeSeconds) {
                    setReady(true);
                }
                return next;
            });
        }, 1000);
        return () => clearInterval(intervalRef.current);
    }, [minTimeSeconds]);

    const handleReady = useCallback(() => {
        clearInterval(intervalRef.current);
        onComplete({ readingTimeSeconds: timeElapsed });
    }, [timeElapsed, onComplete]);

    const showKeyTerms = scaffoldLevel === 'full' || scaffoldLevel === 'medium';
    const remainingSeconds = Math.max(0, minTimeSeconds - timeElapsed);

    const renderPassageText = () => {
        if (!showKeyTerms || !passage.keyTerms || passage.keyTerms.length === 0) {
            return passage.text;
        }

        let html = passage.text;
        passage.keyTerms.forEach(({ term, definition }) => {
            const regex = new RegExp(`\\b(${term})\\b`, 'gi');
            html = html.replace(regex, (match) =>
                `<span style="color:${t.accent.primary};border-bottom:1px dashed ${t.accent.primary};cursor:help" title="${definition}">${match}</span>`
            );
        });
        return <span dangerouslySetInnerHTML={{ __html: html }} />;
    };

    return (
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing[4],
            }}>
                <span style={{
                    color: t.accent.primary,
                    fontSize: typography.size.sm,
                    fontWeight: typography.weight.medium,
                }}>
                    Read carefully — this passage will disappear
                </span>
                <span style={{
                    background: t.bg.tertiary,
                    color: t.text.secondary,
                    padding: `${spacing[1]} ${spacing[3]}`,
                    borderRadius: borderRadius.full,
                    fontSize: typography.size.sm,
                }}>
                    Reading...
                </span>
            </div>

            <div style={{
                background: t.bg.tertiary,
                padding: spacing[6],
                borderRadius: borderRadius.lg,
                lineHeight: typography.lineHeight.relaxed,
                fontSize: typography.size.base,
                color: t.text.primary,
                whiteSpace: 'pre-line',
            }}>
                {renderPassageText()}
            </div>

            <div style={{ textAlign: 'center', marginTop: spacing[6] }}>
                <button
                    onClick={handleReady}
                    disabled={!ready}
                    style={{
                        padding: `${spacing[3]} ${spacing[8]}`,
                        borderRadius: borderRadius.lg,
                        border: 'none',
                        background: ready ? t.accent.primary : t.border.medium,
                        color: ready ? 'white' : t.text.tertiary,
                        fontSize: typography.size.base,
                        fontWeight: typography.weight.semibold,
                        cursor: ready ? 'pointer' : 'not-allowed',
                        fontFamily: typography.fontFamily,
                        transition: `all ${transitions.normal} ${transitions.easing}`,
                    }}
                >
                    {ready
                        ? "I'm Ready — Show Questions"
                        : `Read for at least ${remainingSeconds}s more...`
                    }
                </button>
                <p style={{
                    color: t.text.tertiary,
                    fontSize: typography.size.xs,
                    marginTop: spacing[2],
                }}>
                    {ready
                        ? 'The passage will disappear when you continue'
                        : 'Take your time — the button activates when you\'ve had enough time to read'
                    }
                </p>
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Verify no syntax errors**

```bash
cd "/Users/mikelehnert/Obsidian/Professional (AI)/interactive-resources" && npx next lint --file components/resources/ReadThenQuiz/ReadingPhase.jsx
```

- [ ] **Step 3: Commit**

```bash
git add components/resources/ReadThenQuiz/ReadingPhase.jsx
git commit -m "feat: add ReadingPhase component with min-time gate and key term highlights"
```

---

### Task 4: OpenEndedPhase Component

**Files:**
- Create: `components/resources/ReadThenQuiz/OpenEndedPhase.jsx`

- [ ] **Step 1: Create the OpenEndedPhase component**

Write `components/resources/ReadThenQuiz/OpenEndedPhase.jsx`:

```jsx
'use client';

import { useState } from 'react';
import { theme, typography, spacing, borderRadius, transitions } from '@/lib/theme';

const t = theme.light;

export default function OpenEndedPhase({ openEnded, scaffoldLevel, onComplete }) {
    const [response, setResponse] = useState('');

    const wordCount = response.trim() === '' ? 0 : response.trim().split(/\s+/).length;
    const showStarters = scaffoldLevel === 'full' || scaffoldLevel === 'medium';
    const showSubQuestions = scaffoldLevel === 'full';

    const handleSubmit = () => {
        if (wordCount === 0) return;
        onComplete({ openEndedResponse: response.trim(), wordCount });
    };

    return (
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            <h3 style={{
                fontSize: typography.size.lg,
                fontWeight: typography.weight.semibold,
                color: t.text.primary,
                marginBottom: spacing[4],
                lineHeight: typography.lineHeight.snug,
            }}>
                {openEnded.prompt}
            </h3>

            {showStarters && openEnded.sentenceStarters && (
                <div style={{
                    background: t.accent.infoLight,
                    border: `1px solid ${t.accent.info}`,
                    borderRadius: borderRadius.lg,
                    padding: spacing[4],
                    marginBottom: spacing[4],
                }}>
                    <p style={{
                        fontSize: typography.size.xs,
                        fontWeight: typography.weight.semibold,
                        color: t.accent.info,
                        marginBottom: spacing[2],
                        textTransform: 'uppercase',
                        letterSpacing: typography.letterSpacing.wide,
                    }}>
                        Sentence starters
                    </p>
                    <ul style={{
                        margin: 0,
                        paddingLeft: spacing[5],
                        color: t.text.secondary,
                        fontSize: typography.size.sm,
                        lineHeight: typography.lineHeight.relaxed,
                    }}>
                        {openEnded.sentenceStarters.map((starter, i) => (
                            <li key={i} style={{ marginBottom: spacing[1] }}>{starter}</li>
                        ))}
                    </ul>
                </div>
            )}

            {showSubQuestions && openEnded.guidingSubQuestions && (
                <div style={{
                    background: t.bg.tertiary,
                    border: `1px solid ${t.border.medium}`,
                    borderRadius: borderRadius.lg,
                    padding: spacing[4],
                    marginBottom: spacing[4],
                }}>
                    <p style={{
                        fontSize: typography.size.xs,
                        fontWeight: typography.weight.semibold,
                        color: t.accent.primary,
                        marginBottom: spacing[2],
                        textTransform: 'uppercase',
                        letterSpacing: typography.letterSpacing.wide,
                    }}>
                        Guiding questions
                    </p>
                    <ul style={{
                        margin: 0,
                        paddingLeft: spacing[5],
                        color: t.text.secondary,
                        fontSize: typography.size.sm,
                        lineHeight: typography.lineHeight.relaxed,
                    }}>
                        {openEnded.guidingSubQuestions.map((q, i) => (
                            <li key={i} style={{ marginBottom: spacing[1] }}>{q}</li>
                        ))}
                    </ul>
                </div>
            )}

            <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Type your answer here..."
                style={{
                    width: '100%',
                    minHeight: '160px',
                    padding: spacing[4],
                    borderRadius: borderRadius.lg,
                    border: `1px solid ${t.border.medium}`,
                    background: t.bg.primary,
                    color: t.text.primary,
                    fontSize: typography.size.base,
                    fontFamily: typography.fontFamily,
                    lineHeight: typography.lineHeight.relaxed,
                    resize: 'vertical',
                    outline: 'none',
                    boxSizing: 'border-box',
                }}
                onFocus={(e) => { e.target.style.borderColor = t.accent.primary; }}
                onBlur={(e) => { e.target.style.borderColor = t.border.medium; }}
            />

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: spacing[3],
            }}>
                <span style={{
                    color: t.text.tertiary,
                    fontSize: typography.size.sm,
                }}>
                    {wordCount} {wordCount === 1 ? 'word' : 'words'}
                </span>
                <button
                    onClick={handleSubmit}
                    disabled={wordCount === 0}
                    style={{
                        padding: `${spacing[2]} ${spacing[6]}`,
                        borderRadius: borderRadius.lg,
                        border: 'none',
                        background: wordCount > 0 ? t.accent.primary : t.border.medium,
                        color: wordCount > 0 ? 'white' : t.text.tertiary,
                        fontSize: typography.size.base,
                        fontWeight: typography.weight.medium,
                        cursor: wordCount > 0 ? 'pointer' : 'not-allowed',
                        fontFamily: typography.fontFamily,
                        transition: `all ${transitions.fast} ${transitions.easing}`,
                    }}
                >
                    Submit Answer →
                </button>
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Verify no syntax errors**

```bash
cd "/Users/mikelehnert/Obsidian/Professional (AI)/interactive-resources" && npx next lint --file components/resources/ReadThenQuiz/OpenEndedPhase.jsx
```

- [ ] **Step 3: Commit**

```bash
git add components/resources/ReadThenQuiz/OpenEndedPhase.jsx
git commit -m "feat: add OpenEndedPhase with scaffold-dependent starters and sub-questions"
```

---

### Task 5: MCQPhase Component

**Files:**
- Create: `components/resources/ReadThenQuiz/MCQPhase.jsx`

- [ ] **Step 1: Create the MCQPhase component**

Write `components/resources/ReadThenQuiz/MCQPhase.jsx`:

```jsx
'use client';

import { useState, useCallback } from 'react';
import { theme, typography, spacing, borderRadius, transitions } from '@/lib/theme';

const t = theme.light;

export default function MCQPhase({ questions, scaffoldLevel, questionOffset, onComplete }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [answers, setAnswers] = useState([]);

    const question = questions[currentIndex];
    const isLast = currentIndex === questions.length - 1;
    const showFeedback = scaffoldLevel !== 'independent';
    const showHintButton = scaffoldLevel === 'full';
    const isCorrect = selectedIndex === question.correct;

    const handleSubmit = useCallback(() => {
        if (selectedIndex === null) return;
        const answer = {
            questionIndex: currentIndex,
            selected: selectedIndex,
            correct: selectedIndex === question.correct,
        };
        setAnswers(prev => [...prev, answer]);
        setSubmitted(true);
    }, [selectedIndex, currentIndex, question.correct]);

    const handleNext = useCallback(() => {
        if (isLast) {
            const finalAnswers = [...answers];
            if (!submitted) {
                finalAnswers.push({
                    questionIndex: currentIndex,
                    selected: selectedIndex,
                    correct: selectedIndex === question.correct,
                });
            }
            const score = finalAnswers.filter(a => a.correct).length;
            onComplete({ mcqAnswers: finalAnswers, mcqScore: score, mcqTotal: questions.length });
        } else {
            setCurrentIndex(prev => prev + 1);
            setSelectedIndex(null);
            setSubmitted(false);
            setShowHint(false);
        }
    }, [isLast, answers, submitted, currentIndex, selectedIndex, question.correct, onComplete, questions.length]);

    const handleSelect = (i) => {
        if (submitted) return;
        setSelectedIndex(i);
        if (!showFeedback) {
            // Independent mode: auto-advance on selection
            const answer = {
                questionIndex: currentIndex,
                selected: i,
                correct: i === question.correct,
            };
            setAnswers(prev => [...prev, answer]);
            if (isLast) {
                const finalAnswers = [...answers, answer];
                const score = finalAnswers.filter(a => a.correct).length;
                setTimeout(() => {
                    onComplete({ mcqAnswers: finalAnswers, mcqScore: score, mcqTotal: questions.length });
                }, 300);
            } else {
                setTimeout(() => {
                    setCurrentIndex(prev => prev + 1);
                    setSelectedIndex(null);
                    setShowHint(false);
                }, 300);
            }
        }
    };

    return (
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            <p style={{
                fontSize: typography.size.sm,
                color: t.text.tertiary,
                marginBottom: spacing[2],
            }}>
                Question {questionOffset + currentIndex + 1} of {questionOffset + questions.length} — Multiple Choice
            </p>

            <h3 style={{
                fontSize: typography.size.lg,
                fontWeight: typography.weight.semibold,
                color: t.text.primary,
                marginBottom: spacing[4],
                lineHeight: typography.lineHeight.snug,
            }}>
                {question.question}
            </h3>

            {showHintButton && !submitted && !showHint && (
                <button
                    onClick={() => setShowHint(true)}
                    style={{
                        marginBottom: spacing[4],
                        padding: `${spacing[2]} ${spacing[4]}`,
                        borderRadius: borderRadius.lg,
                        border: `1px solid ${t.border.medium}`,
                        background: t.bg.tertiary,
                        color: t.text.secondary,
                        fontSize: typography.size.sm,
                        cursor: 'pointer',
                        fontFamily: typography.fontFamily,
                    }}
                >
                    💡 Show hint
                </button>
            )}

            {showHint && !submitted && (
                <div style={{
                    background: t.accent.warningLight,
                    border: `1px solid ${t.accent.warning}`,
                    borderRadius: borderRadius.lg,
                    padding: spacing[4],
                    marginBottom: spacing[4],
                    fontSize: typography.size.sm,
                    color: t.text.secondary,
                }}>
                    {question.hint}
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                {question.options.map((option, i) => {
                    const isSelected = selectedIndex === i;
                    let borderColor = t.border.medium;
                    let bgColor = t.bg.primary;

                    if (showFeedback && submitted && isSelected) {
                        borderColor = i === question.correct ? t.accent.success : t.accent.error;
                        bgColor = i === question.correct ? t.accent.successLight : t.accent.errorLight;
                    } else if (showFeedback && submitted && i === question.correct) {
                        borderColor = t.accent.success;
                        bgColor = t.accent.successLight;
                    } else if (isSelected) {
                        borderColor = t.accent.primary;
                        bgColor = t.accent.infoLight;
                    }

                    return (
                        <button
                            key={i}
                            onClick={() => handleSelect(i)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: spacing[3],
                                padding: `${spacing[3]} ${spacing[4]}`,
                                border: `2px solid ${borderColor}`,
                                borderRadius: borderRadius.lg,
                                background: bgColor,
                                cursor: submitted ? 'default' : 'pointer',
                                textAlign: 'left',
                                fontSize: typography.size.base,
                                fontFamily: typography.fontFamily,
                                color: t.text.primary,
                                transition: `all ${transitions.fast} ${transitions.easing}`,
                                width: '100%',
                            }}
                        >
                            <span style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: borderRadius.full,
                                border: `2px solid ${borderColor}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                fontSize: typography.size.sm,
                                fontWeight: typography.weight.semibold,
                                background: isSelected ? borderColor : 'transparent',
                                color: isSelected ? 'white' : t.text.secondary,
                            }}>
                                {String.fromCharCode(65 + i)}
                            </span>
                            <span>{option}</span>
                        </button>
                    );
                })}
            </div>

            {showFeedback && submitted && (
                <div style={{
                    marginTop: spacing[4],
                    padding: spacing[4],
                    borderRadius: borderRadius.lg,
                    background: isCorrect ? t.accent.successLight : t.accent.errorLight,
                    borderLeft: `4px solid ${isCorrect ? t.accent.success : t.accent.error}`,
                }}>
                    <p style={{
                        fontSize: typography.size.sm,
                        fontWeight: typography.weight.semibold,
                        color: isCorrect ? t.accent.success : t.accent.error,
                        marginBottom: spacing[1],
                    }}>
                        {isCorrect ? 'Correct!' : 'Not quite.'}
                    </p>
                    <p style={{ fontSize: typography.size.sm, color: t.text.secondary }}>
                        {question.explanation}
                    </p>
                </div>
            )}

            {showFeedback && !submitted && (
                <button
                    onClick={handleSubmit}
                    disabled={selectedIndex === null}
                    style={{
                        marginTop: spacing[4],
                        padding: `${spacing[2]} ${spacing[6]}`,
                        borderRadius: borderRadius.lg,
                        border: 'none',
                        background: selectedIndex !== null ? t.accent.primary : t.border.medium,
                        color: selectedIndex !== null ? 'white' : t.text.tertiary,
                        fontSize: typography.size.base,
                        fontWeight: typography.weight.medium,
                        cursor: selectedIndex !== null ? 'pointer' : 'not-allowed',
                        fontFamily: typography.fontFamily,
                    }}
                >
                    Check Answer
                </button>
            )}

            {showFeedback && submitted && (
                <button
                    onClick={handleNext}
                    style={{
                        marginTop: spacing[4],
                        padding: `${spacing[2]} ${spacing[6]}`,
                        borderRadius: borderRadius.lg,
                        border: 'none',
                        background: t.accent.primary,
                        color: 'white',
                        fontSize: typography.size.base,
                        fontWeight: typography.weight.medium,
                        cursor: 'pointer',
                        fontFamily: typography.fontFamily,
                    }}
                >
                    {isLast ? 'See Results' : 'Next Question →'}
                </button>
            )}
        </div>
    );
}
```

- [ ] **Step 2: Verify no syntax errors**

```bash
cd "/Users/mikelehnert/Obsidian/Professional (AI)/interactive-resources" && npx next lint --file components/resources/ReadThenQuiz/MCQPhase.jsx
```

- [ ] **Step 3: Commit**

```bash
git add components/resources/ReadThenQuiz/MCQPhase.jsx
git commit -m "feat: add MCQPhase with scaffold-dependent hints and feedback timing"
```

---

### Task 6: ResultsPhase Component

**Files:**
- Create: `components/resources/ReadThenQuiz/ResultsPhase.jsx`

- [ ] **Step 1: Create the ResultsPhase component**

Write `components/resources/ReadThenQuiz/ResultsPhase.jsx`:

```jsx
'use client';

import { theme, typography, spacing, borderRadius } from '@/lib/theme';

const t = theme.light;

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
}

export default function ResultsPhase({ results, questions, scaffoldLevel }) {
    const { mcqScore, mcqTotal, mcqAnswers, openEndedResponse, readingTimeSeconds, totalTimeSeconds } = results;

    return (
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: spacing[6] }}>
                <div style={{
                    fontSize: typography.size['4xl'],
                    fontWeight: typography.weight.bold,
                    color: mcqScore === mcqTotal ? t.accent.success :
                           mcqScore >= mcqTotal / 2 ? t.accent.warning : t.accent.error,
                }}>
                    {mcqScore}/{mcqTotal}
                </div>
                <div style={{
                    color: t.text.secondary,
                    fontSize: typography.size.sm,
                }}>
                    MCQ Score
                </div>
            </div>

            <div style={{
                display: 'flex',
                gap: spacing[3],
                marginBottom: spacing[6],
            }}>
                {[
                    { label: 'Reading Time', value: formatTime(readingTimeSeconds) },
                    { label: 'Total Time', value: formatTime(totalTimeSeconds) },
                    { label: 'Scaffold', value: scaffoldLevel.charAt(0).toUpperCase() + scaffoldLevel.slice(1) },
                ].map((stat) => (
                    <div key={stat.label} style={{
                        flex: 1,
                        background: t.bg.tertiary,
                        borderRadius: borderRadius.lg,
                        padding: spacing[4],
                        textAlign: 'center',
                    }}>
                        <div style={{
                            color: t.text.tertiary,
                            fontSize: typography.size.xs,
                            textTransform: 'uppercase',
                            letterSpacing: typography.letterSpacing.wide,
                        }}>
                            {stat.label}
                        </div>
                        <div style={{
                            color: t.text.primary,
                            fontWeight: typography.weight.semibold,
                            fontSize: typography.size.xl,
                            marginTop: spacing[1],
                        }}>
                            {stat.value}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{
                background: t.bg.tertiary,
                borderRadius: borderRadius.lg,
                padding: spacing[4],
                marginBottom: spacing[4],
            }}>
                <p style={{
                    fontSize: typography.size.xs,
                    fontWeight: typography.weight.semibold,
                    color: t.accent.primary,
                    marginBottom: spacing[2],
                    textTransform: 'uppercase',
                    letterSpacing: typography.letterSpacing.wide,
                }}>
                    Your written response
                </p>
                <p style={{
                    fontSize: typography.size.sm,
                    color: t.text.secondary,
                    lineHeight: typography.lineHeight.relaxed,
                    fontStyle: 'italic',
                }}>
                    &ldquo;{openEndedResponse}&rdquo;
                </p>
            </div>

            <div style={{
                background: t.bg.tertiary,
                borderRadius: borderRadius.lg,
                padding: spacing[4],
                marginBottom: spacing[6],
            }}>
                <p style={{
                    fontSize: typography.size.xs,
                    fontWeight: typography.weight.semibold,
                    color: t.accent.primary,
                    marginBottom: spacing[3],
                    textTransform: 'uppercase',
                    letterSpacing: typography.letterSpacing.wide,
                }}>
                    MCQ Review
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
                    {mcqAnswers.map((answer, i) => {
                        const q = questions[answer.questionIndex];
                        return (
                            <div key={i} style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: spacing[3],
                            }}>
                                <span style={{
                                    color: answer.correct ? t.accent.success : t.accent.error,
                                    fontSize: typography.size.base,
                                    flexShrink: 0,
                                    marginTop: '2px',
                                }}>
                                    {answer.correct ? '✓' : '✗'}
                                </span>
                                <div>
                                    <span style={{
                                        color: t.text.primary,
                                        fontSize: typography.size.sm,
                                    }}>
                                        {q.question}
                                    </span>
                                    {!answer.correct && (
                                        <p style={{
                                            color: t.accent.error,
                                            fontSize: typography.size.xs,
                                            marginTop: spacing[1],
                                        }}>
                                            You selected: {q.options[answer.selected]}
                                        </p>
                                    )}
                                    {!answer.correct && (
                                        <p style={{
                                            color: t.text.tertiary,
                                            fontSize: typography.size.xs,
                                            marginTop: spacing[1],
                                        }}>
                                            {q.explanation}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div style={{ textAlign: 'center' }}>
                <p style={{
                    color: t.text.tertiary,
                    fontSize: typography.size.sm,
                }}>
                    Your responses have been saved.
                </p>
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Verify no syntax errors**

```bash
cd "/Users/mikelehnert/Obsidian/Professional (AI)/interactive-resources" && npx next lint --file components/resources/ReadThenQuiz/ResultsPhase.jsx
```

- [ ] **Step 3: Commit**

```bash
git add components/resources/ReadThenQuiz/ResultsPhase.jsx
git commit -m "feat: add ResultsPhase with score, timing, and response review"
```

---

### Task 7: ReadThenQuiz Orchestrator

**Files:**
- Create: `components/resources/ReadThenQuiz/ReadThenQuiz.jsx`

- [ ] **Step 1: Create the orchestrator component**

Write `components/resources/ReadThenQuiz/ReadThenQuiz.jsx`:

```jsx
'use client';

import { useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getTopicData } from '@/lib/read-then-quiz/topics';
import { theme, typography, spacing, borderRadius, transitions } from '@/lib/theme';
import ReadingPhase from './ReadingPhase';
import OpenEndedPhase from './OpenEndedPhase';
import MCQPhase from './MCQPhase';
import ResultsPhase from './ResultsPhase';

const t = theme.light;

const SCAFFOLD_LEVELS = [
    { id: 'full', label: 'Full Support', description: 'Key terms, sentence starters, hints' },
    { id: 'medium', label: 'Medium', description: 'Key terms and sentence starters' },
    { id: 'minimal', label: 'Minimal', description: 'Questions only' },
    { id: 'independent', label: 'Independent', description: 'No scaffolds, deferred feedback' },
];

export default function ReadThenQuiz() {
    const { resourceId } = useParams();
    const topic = getTopicData(resourceId);

    const [phase, setPhase] = useState('entry');
    const [studentName, setStudentName] = useState('');
    const [scaffoldLevel, setScaffoldLevel] = useState('full');
    const [results, setResults] = useState({});
    const startTimeRef = useRef(null);

    const handleStartReading = useCallback(() => {
        startTimeRef.current = Date.now();
        setPhase('reading');
    }, []);

    const handleReadingComplete = useCallback(({ readingTimeSeconds }) => {
        setResults(prev => ({ ...prev, readingTimeSeconds }));
        setPhase('open-ended');
    }, []);

    const handleOpenEndedComplete = useCallback(({ openEndedResponse, wordCount }) => {
        setResults(prev => ({ ...prev, openEndedResponse, wordCount }));
        setPhase('mcq');
    }, []);

    const handleMCQComplete = useCallback(async ({ mcqAnswers, mcqScore, mcqTotal }) => {
        const totalTimeSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
        const finalResults = {
            ...results,
            mcqAnswers,
            mcqScore,
            mcqTotal,
            totalTimeSeconds,
        };
        setResults(finalResults);
        setPhase('results');

        await supabase.from('read_then_quiz_responses').insert({
            topic_id: topic.id,
            student_name: studentName.trim(),
            scaffold_level: scaffoldLevel,
            open_ended_response: finalResults.openEndedResponse,
            mcq_answers: mcqAnswers,
            mcq_score: mcqScore,
            mcq_total: mcqTotal,
            reading_time_seconds: finalResults.readingTimeSeconds,
            total_time_seconds: totalTimeSeconds,
        });
    }, [results, topic, studentName, scaffoldLevel]);

    if (!topic) {
        return (
            <div style={{ padding: spacing[8], textAlign: 'center', color: t.text.secondary }}>
                Topic data not found for this resource.
            </div>
        );
    }

    if (phase === 'entry') {
        const canStart = studentName.trim().length > 0;
        return (
            <div style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: spacing[3] }}>📖</div>
                <h2 style={{
                    fontSize: typography.size['2xl'],
                    fontWeight: typography.weight.bold,
                    color: t.text.primary,
                    marginBottom: spacing[2],
                }}>
                    Read &amp; Recall
                </h2>
                <p style={{
                    color: t.text.secondary,
                    fontSize: typography.size.sm,
                    lineHeight: typography.lineHeight.relaxed,
                    marginBottom: spacing[6],
                }}>
                    You&apos;ll read a short passage about {topic.title.toLowerCase()}, then answer questions from memory. The passage will disappear before the questions appear — so read carefully!
                </p>

                <div style={{
                    display: 'flex',
                    gap: spacing[3],
                    justifyContent: 'center',
                    marginBottom: spacing[6],
                }}>
                    <div style={{
                        background: t.bg.tertiary,
                        borderRadius: borderRadius.lg,
                        padding: `${spacing[3]} ${spacing[4]}`,
                        textAlign: 'center',
                    }}>
                        <div style={{ color: t.accent.primary, fontSize: typography.size.xs }}>Reading</div>
                        <div style={{ color: t.text.primary, fontWeight: typography.weight.semibold }}>
                            ~{Math.ceil(topic.passage.text.split(/\s+/).length / 200)} min
                        </div>
                    </div>
                    <div style={{
                        background: t.bg.tertiary,
                        borderRadius: borderRadius.lg,
                        padding: `${spacing[3]} ${spacing[4]}`,
                        textAlign: 'center',
                    }}>
                        <div style={{ color: t.accent.primary, fontSize: typography.size.xs }}>Questions</div>
                        <div style={{ color: t.text.primary, fontWeight: typography.weight.semibold }}>
                            1 written + {topic.mcq.length} MCQ
                        </div>
                    </div>
                </div>

                <div style={{ textAlign: 'left', marginBottom: spacing[4] }}>
                    <label style={{
                        display: 'block',
                        color: t.text.secondary,
                        fontSize: typography.size.sm,
                        marginBottom: spacing[2],
                    }}>
                        Your name
                    </label>
                    <input
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="Enter your name..."
                        style={{
                            width: '100%',
                            padding: `${spacing[3]} ${spacing[4]}`,
                            borderRadius: borderRadius.lg,
                            border: `1px solid ${t.border.medium}`,
                            background: t.bg.primary,
                            color: t.text.primary,
                            fontSize: typography.size.base,
                            fontFamily: typography.fontFamily,
                            outline: 'none',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>

                <div style={{ textAlign: 'left', marginBottom: spacing[6] }}>
                    <label style={{
                        display: 'block',
                        color: t.text.secondary,
                        fontSize: typography.size.sm,
                        marginBottom: spacing[2],
                    }}>
                        Support level
                    </label>
                    <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap' }}>
                        {SCAFFOLD_LEVELS.map(level => (
                            <button
                                key={level.id}
                                onClick={() => setScaffoldLevel(level.id)}
                                title={level.description}
                                style={{
                                    padding: `${spacing[2]} ${spacing[4]}`,
                                    borderRadius: borderRadius.lg,
                                    border: scaffoldLevel === level.id ? 'none' : `1px solid ${t.border.medium}`,
                                    background: scaffoldLevel === level.id ? t.accent.primary : t.bg.primary,
                                    color: scaffoldLevel === level.id ? 'white' : t.text.secondary,
                                    fontSize: typography.size.sm,
                                    fontWeight: typography.weight.medium,
                                    cursor: 'pointer',
                                    fontFamily: typography.fontFamily,
                                    transition: `all ${transitions.fast} ${transitions.easing}`,
                                }}
                            >
                                {level.label}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleStartReading}
                    disabled={!canStart}
                    style={{
                        padding: `${spacing[3]} ${spacing[8]}`,
                        borderRadius: borderRadius.lg,
                        border: 'none',
                        background: canStart ? t.accent.primary : t.border.medium,
                        color: canStart ? 'white' : t.text.tertiary,
                        fontSize: typography.size.base,
                        fontWeight: typography.weight.semibold,
                        cursor: canStart ? 'pointer' : 'not-allowed',
                        fontFamily: typography.fontFamily,
                        transition: `all ${transitions.normal} ${transitions.easing}`,
                    }}
                >
                    Start Reading
                </button>
            </div>
        );
    }

    if (phase === 'reading') {
        return (
            <ReadingPhase
                passage={topic.passage}
                scaffoldLevel={scaffoldLevel}
                onComplete={handleReadingComplete}
            />
        );
    }

    if (phase === 'open-ended') {
        return (
            <OpenEndedPhase
                openEnded={topic.openEnded}
                scaffoldLevel={scaffoldLevel}
                onComplete={handleOpenEndedComplete}
            />
        );
    }

    if (phase === 'mcq') {
        return (
            <MCQPhase
                questions={topic.mcq}
                scaffoldLevel={scaffoldLevel}
                questionOffset={1}
                onComplete={handleMCQComplete}
            />
        );
    }

    if (phase === 'results') {
        return (
            <ResultsPhase
                results={results}
                questions={topic.mcq}
                scaffoldLevel={scaffoldLevel}
            />
        );
    }

    return null;
}
```

- [ ] **Step 2: Verify no syntax errors**

```bash
cd "/Users/mikelehnert/Obsidian/Professional (AI)/interactive-resources" && npx next lint --file components/resources/ReadThenQuiz/ReadThenQuiz.jsx
```

- [ ] **Step 3: Commit**

```bash
git add components/resources/ReadThenQuiz/ReadThenQuiz.jsx
git commit -m "feat: add ReadThenQuiz orchestrator with state machine and Supabase persistence"
```

---

### Task 8: Resource Registration and Wiring

**Files:**
- Create: `lib/resources/rtq-dynamic-compression.js`
- Modify: `lib/resources/index.js`
- Modify: `app/[resourceId]/ResourcePageClient.js`

- [ ] **Step 1: Create the resource metadata file**

Write `lib/resources/rtq-dynamic-compression.js`:

```javascript
const rtqDynamicCompression = {
    id: 'rtq-dynamic-compression',
    title: 'Read & Recall: Dynamic Range Compression',
    description: 'Read a passage about compression, then answer questions from memory. Tests understanding of threshold, ratio, attack, release, and make-up gain through self-explanation and multiple choice.',
    topic: '1.9 Dynamic Processing',
    relatedTopics: [],
    type: 'practice',
    icon: '📖',
    estimatedTime: '5-8 minutes',
    learningObjectives: [
        'Explain how a compressor affects dynamic range',
        'Identify the role of threshold, ratio, attack, release, and make-up gain',
        'Apply compression concepts to practical scenarios',
    ],
    prepFor: [],
    component: 'ReadThenQuiz',
    keywords: ['compression', 'compressor', 'threshold', 'ratio', 'attack', 'release', 'make-up gain', 'dynamic range', 'retrieval practice'],
    difficulty: 'foundation',
};

export default rtqDynamicCompression;
```

- [ ] **Step 2: Register in the resource index**

Open `lib/resources/index.js`. Add the import alongside the other resource imports:

```javascript
import rtqDynamicCompression from './rtq-dynamic-compression';
```

Add the resource to the `resources` object alongside the others:

```javascript
'rtq-dynamic-compression': rtqDynamicCompression,
```

- [ ] **Step 3: Register the component in ResourcePageClient**

Open `app/[resourceId]/ResourcePageClient.js`.

Add the import at the top with the other component imports (after line 48):

```javascript
import ReadThenQuiz from '@/components/resources/ReadThenQuiz/ReadThenQuiz';
```

Add the mapping in the `resourceComponents` object (before the closing comment):

```javascript
'ReadThenQuiz': ReadThenQuiz,
```

- [ ] **Step 4: Build and verify**

```bash
cd "/Users/mikelehnert/Obsidian/Professional (AI)/interactive-resources" && npm run build
```

Expected: Build succeeds with no errors. The page `/rtq-dynamic-compression` should be generated in the static params.

- [ ] **Step 5: Manual smoke test**

```bash
cd "/Users/mikelehnert/Obsidian/Professional (AI)/interactive-resources" && npm run dev
```

Open `http://localhost:3000/rtq-dynamic-compression` in a browser. Verify:
1. Entry screen shows with name input, scaffold selector, estimated time
2. Entering a name and clicking "Start Reading" shows the passage
3. Button is disabled until minimum reading time passes
4. At Full scaffold, key terms have tooltips
5. Clicking "I'm Ready" transitions to open-ended question with sentence starters
6. Submitting text transitions to MCQ
7. MCQ shows one question at a time with feedback
8. Results screen shows score, timing, written response, and MCQ review
9. Check Supabase table for the inserted row

- [ ] **Step 6: Commit**

```bash
git add lib/resources/rtq-dynamic-compression.js lib/resources/index.js app/\[resourceId\]/ResourcePageClient.js
git commit -m "feat: register Read & Recall dynamic compression in resource system"
```

---

### Task 9: Deploy and Verify

- [ ] **Step 1: Push to GitHub**

```bash
cd "/Users/mikelehnert/Obsidian/Professional (AI)/interactive-resources" && git push
```

Vercel will auto-deploy from the push.

- [ ] **Step 2: Verify Supabase table exists in production**

If the SQL migration from Task 1 hasn't been run against production Supabase yet, run it now via the Supabase dashboard SQL editor.

- [ ] **Step 3: Verify deployed URL**

Open `https://resources.musictechstudio.co.uk/rtq-dynamic-compression` and run through the full flow:
1. Enter name, select scaffold, start reading
2. Complete all phases
3. Verify the response appears in Supabase `read_then_quiz_responses` table

- [ ] **Step 4: Check Deployment Protection is disabled**

Vercel Settings → Deployment Protection → Vercel Authentication should be disabled (public-facing site).
