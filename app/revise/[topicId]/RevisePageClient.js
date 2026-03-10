'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { theme, typography, borderRadius, spacing, transitions, glass } from '@/lib/theme';
import { getQuestions } from '@/lib/questions';
import { getNextAttemptNumber, saveQuizResponse, getQuizHistory, getQuestionPerformance } from '@/lib/quiz-persistence';
import { prioritiseQuestions } from '@/lib/spaced-repetition';
import { supabase } from '@/lib/supabase';
import AuthGate from './AuthGate';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function RevisePageClient({ topic }) {
    const t = theme.light;
    const [student, setStudent] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [currentAnswer, setCurrentAnswer] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [responses, setResponses] = useState([]);
    const [finished, setFinished] = useState(false);
    const [attemptNumber, setAttemptNumber] = useState(null);
    const [smartOrder, setSmartOrder] = useState(false);

    // Check localStorage for existing auth on mount
    useEffect(() => {
        const token = localStorage.getItem('revision_token');
        const studentId = localStorage.getItem('revision_student_id');
        const studentName = localStorage.getItem('revision_student_name');

        if (token && studentId && studentName) {
            setStudent({ token, studentId, studentName });
        }
        setAuthChecked(true);
    }, []);

    useEffect(() => {
        if (student) {
            const rawQuestions = getQuestions(topic.id);
            getNextAttemptNumber(student.studentId, topic.id)
                .then(setAttemptNumber)
                .catch(() => setAttemptNumber(1));

            const QUIZ_SIZE = 12;

            // Apply spaced repetition ordering then pick a subset
            getQuestionPerformance(student.studentId, topic.id)
                .then(perfMap => {
                    const ordered = prioritiseQuestions(rawQuestions, perfMap);
                    if (perfMap.size > 0) {
                        setSmartOrder(true);
                    }
                    setQuestions(ordered.slice(0, QUIZ_SIZE));
                })
                .catch(() => {
                    // No history — prioritiseQuestions shuffles by default
                    setQuestions(prioritiseQuestions(rawQuestions, new Map()).slice(0, QUIZ_SIZE));
                });
        }
    }, [topic.id, student]);

    function handleSignOut() {
        localStorage.removeItem('revision_token');
        localStorage.removeItem('revision_student_id');
        localStorage.removeItem('revision_student_name');
        setStudent(null);
        setQuestions([]);
        setQuestionIndex(0);
        setCurrentAnswer(null);
        setShowFeedback(false);
        setIsCorrect(false);
        setResponses([]);
        setFinished(false);
        setAttemptNumber(null);
    }

    // Show nothing until we've checked localStorage (avoids flash)
    if (!authChecked) {
        return (
            <div style={{ minHeight: '100vh', background: t.bg.secondary, fontFamily: typography.fontFamily }}>
                <QuizHeader topic={topic} t={t} />
            </div>
        );
    }

    // Not authenticated — show auth gate
    if (!student) {
        return (
            <div style={{ minHeight: '100vh', background: t.bg.secondary, fontFamily: typography.fontFamily }}>
                <QuizHeader topic={topic} t={t} />
                <main style={{ maxWidth: '720px', margin: '0 auto', padding: spacing[8] }}>
                    <AuthGate
                        topicColour={topic.colour}
                        onAuthenticated={setStudent}
                    />
                </main>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div style={{ minHeight: '100vh', background: t.bg.secondary, fontFamily: typography.fontFamily }}>
                <QuizHeader topic={topic} t={t} studentName={student?.studentName} onSignOut={handleSignOut} />
                <main style={{ maxWidth: '720px', margin: '0 auto', padding: spacing[8] }}>
                    <p style={{ color: t.text.secondary, textAlign: 'center' }}>
                        No questions available for this topic yet.
                    </p>
                </main>
            </div>
        );
    }

    const current = questions[questionIndex];
    const progress = questionIndex + 1;
    const total = questions.length;

    function submitAnswer(answer) {
        setCurrentAnswer(answer);
        let correct = false;

        if (current.type === 'mcq') {
            correct = answer === current.correctIndex;
        } else if (current.type === 'numeric') {
            const parsed = parseFloat(answer);
            correct = !isNaN(parsed) && Math.abs(parsed - current.answer) <= (current.tolerance || 0);
        } else if (current.type === 'short') {
            // Short answers are self-assessed — always show as "review"
            correct = false;
        }

        const correctValue = current.type === 'short' ? null : correct;

        setIsCorrect(correct);
        setShowFeedback(true);
        setResponses(prev => [...prev, {
            questionId: current.id,
            type: current.type,
            answer,
            correct: correctValue,
        }]);

        // Persist to Supabase (fire-and-forget)
        if (student && attemptNumber) {
            saveQuizResponse({
                studentId: student.studentId,
                topicId: topic.id,
                questionId: current.id,
                questionType: current.type,
                answer: current.type === 'mcq' ? current.options[answer] : String(answer),
                correct: correctValue,
                attemptNumber,
            });
        }
    }

    function nextQuestion() {
        if (questionIndex + 1 >= questions.length) {
            setFinished(true);

            // Fire-and-forget: write attempt summary + trigger signal processing
            if (student) {
                const scored = [...responses, {
                    questionId: current.id,
                    correct: current.type === 'short' ? null : isCorrect,
                }].filter(r => r.correct !== null);
                const correctCount = scored.filter(r => r.correct).length;
                const totalScored = scored.length;

                // Write to revision_quiz_attempts for teacher dashboard visibility
                supabase.from('revision_quiz_attempts').insert({
                    student_id: student.studentId,
                    topic_key: topic.id,
                    quiz_type: 'quick_recall',
                    responses: JSON.stringify(responses),
                    score: correctCount,
                    total: totalScored,
                }).then(() => {
                    // Trigger signal detection on grades-dashboard
                    fetch('https://grades-dashboard.vercel.app/api/process-signals', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            student_id: student.studentId,
                            topic_key: topic.id,
                            score: correctCount,
                            total: totalScored,
                        }),
                    }).catch(() => {}); // Silent fail — teacher insights are non-critical
                }).catch(err => console.error('Failed to write attempt summary:', err));
            }
        } else {
            setQuestionIndex(prev => prev + 1);
            setCurrentAnswer(null);
            setShowFeedback(false);
            setIsCorrect(false);
        }
    }

    if (finished) {
        return (
            <div style={{ minHeight: '100vh', background: t.bg.secondary, fontFamily: typography.fontFamily }}>
                <QuizHeader topic={topic} t={t} studentName={student?.studentName} onSignOut={handleSignOut} />
                <main style={{ maxWidth: '720px', margin: '0 auto', padding: spacing[8] }}>
                    <ResultsSummary
                        responses={responses}
                        questions={questions}
                        topic={topic}
                        studentId={student?.studentId}
                        t={t}
                    />
                </main>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: t.bg.secondary, fontFamily: typography.fontFamily }}>
            <QuizHeader topic={topic} t={t} studentName={student?.studentName} onSignOut={handleSignOut} />

            <main style={{ maxWidth: '720px', margin: '0 auto', padding: spacing[8] }}>
                {/* Progress bar */}
                <div style={{ marginBottom: spacing[6] }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: spacing[2],
                    }}>
                        <span style={{
                            fontSize: typography.size.sm,
                            fontWeight: typography.weight.medium,
                            color: t.text.secondary,
                        }}>
                            Question {progress} of {total}
                        </span>
                        <span style={{
                            fontSize: typography.size.sm,
                            color: t.text.tertiary,
                        }}>
                            {current.type === 'mcq' ? 'Multiple Choice' :
                             current.type === 'numeric' ? 'Calculation' : 'Short Answer'}
                        </span>
                    </div>
                    <div style={{
                        height: '6px',
                        background: 'rgba(255, 255, 255, 0.4)',
                        border: '1px solid ' + glass.border,
                        borderRadius: borderRadius.full,
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            height: '100%',
                            width: `${(progress / total) * 100}%`,
                            background: topic.colour,
                            borderRadius: borderRadius.full,
                            transition: `width ${transitions.normal} ${transitions.easing}`,
                        }} />
                    </div>
                </div>

                {/* Smart order indicator */}
                {smartOrder && (
                    <p style={{
                        fontSize: typography.size.xs,
                        color: t.text.tertiary,
                        textAlign: 'center',
                        marginBottom: spacing[4],
                        marginTop: `-${spacing[3]}`,
                    }}>
                        Questions ordered by your past performance
                    </p>
                )}

                {/* Question card */}
                <div style={{
                    background: glass.bg,
                    backdropFilter: 'blur(' + glass.blur + ')',
                    WebkitBackdropFilter: 'blur(' + glass.blur + ')',
                    borderRadius: borderRadius.xl,
                    border: `1px solid ${glass.border}`,
                    boxShadow: glass.shadow,
                    padding: spacing[8],
                }}>
                    <h2 style={{
                        fontSize: typography.size.xl,
                        fontWeight: typography.weight.semibold,
                        color: t.text.primary,
                        lineHeight: typography.lineHeight.snug,
                        marginBottom: spacing[6],
                    }}>
                        {current.question}
                    </h2>

                    {current.type === 'mcq' && (
                        <MCQOptions
                            options={current.options}
                            correctIndex={current.correctIndex}
                            selectedIndex={currentAnswer}
                            showFeedback={showFeedback}
                            onSelect={submitAnswer}
                            topicColour={topic.colour}
                            t={t}
                        />
                    )}

                    {current.type === 'numeric' && (
                        <NumericInput
                            unit={current.unit}
                            showFeedback={showFeedback}
                            onSubmit={submitAnswer}
                            t={t}
                        />
                    )}

                    {current.type === 'short' && (
                        <ShortAnswer
                            showFeedback={showFeedback}
                            onSubmit={submitAnswer}
                            sampleAnswer={current.sampleAnswer}
                            keyPoints={current.keyPoints}
                            t={t}
                        />
                    )}

                    {/* Feedback panel */}
                    {showFeedback && (
                        <div style={{
                            marginTop: spacing[6],
                            padding: spacing[5],
                            borderRadius: borderRadius.lg,
                            border: `1px solid ${current.type === 'short'
                                ? t.accent.info
                                : isCorrect ? t.accent.success : t.accent.error}`,
                            background: current.type === 'short'
                                ? t.accent.infoLight
                                : isCorrect ? t.accent.successLight : t.accent.errorLight,
                        }}>
                            {current.type !== 'short' && (
                                <p style={{
                                    fontWeight: typography.weight.semibold,
                                    fontSize: typography.size.base,
                                    color: isCorrect ? t.accent.success : t.accent.error,
                                    marginBottom: spacing[2],
                                }}>
                                    {isCorrect ? 'Correct!' : 'Not quite.'}
                                </p>
                            )}
                            {current.type === 'short' && (
                                <p style={{
                                    fontWeight: typography.weight.semibold,
                                    fontSize: typography.size.base,
                                    color: t.accent.info,
                                    marginBottom: spacing[2],
                                }}>
                                    Review your answer
                                </p>
                            )}
                            <p style={{
                                fontSize: typography.size.sm,
                                color: t.text.secondary,
                                lineHeight: typography.lineHeight.relaxed,
                            }}>
                                {current.explanation}
                            </p>
                        </div>
                    )}

                    {/* Next button */}
                    {showFeedback && (
                        <button
                            onClick={nextQuestion}
                            style={{
                                marginTop: spacing[5],
                                width: '100%',
                                padding: `${spacing[3]} ${spacing[6]}`,
                                background: topic.colour,
                                color: t.text.inverse,
                                border: 'none',
                                borderRadius: borderRadius.lg,
                                fontSize: typography.size.base,
                                fontWeight: typography.weight.semibold,
                                cursor: 'pointer',
                                backdropFilter: 'blur(8px)',
                                boxShadow: glass.shadowPrimary,
                                transition: `opacity ${transitions.fast}`,
                            }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                            {questionIndex + 1 >= questions.length ? 'See Results' : 'Next Question'}
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
}

function QuizHeader({ topic, t, studentName, onSignOut }) {
    return (
        <>
        <Breadcrumbs />
        <header style={{
            background: t.bg.primary,
            borderBottom: `3px solid ${topic.colour}`,
            padding: `${spacing[4]} ${spacing[8]}`,
        }}>
            <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                    <Link
                        href={`/topic/${topic.id}`}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: spacing[2],
                            color: t.text.secondary,
                            textDecoration: 'none',
                            fontSize: typography.size.sm,
                            padding: `${spacing[1]} ${spacing[3]}`,
                            borderRadius: borderRadius.md,
                            background: t.bg.tertiary,
                            transition: `all ${transitions.fast}`,
                        }}
                    >
                        ← Back
                    </Link>
                    <h1 style={{
                        fontSize: typography.size.lg,
                        fontWeight: typography.weight.semibold,
                        color: t.text.primary,
                    }}>
                        Revise: {topic.name}
                    </h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                    {studentName && (
                        <span style={{
                            fontSize: typography.size.sm,
                            color: t.text.tertiary,
                        }}>
                            {studentName}
                        </span>
                    )}
                    {onSignOut && (
                        <button
                            onClick={onSignOut}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: t.text.tertiary,
                                fontSize: typography.size.xs,
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                fontFamily: 'inherit',
                                padding: 0,
                            }}
                        >
                            sign out
                        </button>
                    )}
                    <span style={{
                        background: topic.colour + '18',
                        color: topic.colour,
                        padding: `${spacing[1]} ${spacing[3]}`,
                        borderRadius: borderRadius.full,
                        fontSize: typography.size.sm,
                        fontWeight: typography.weight.semibold,
                    }}>
                        {topic.specRef}
                    </span>
                </div>
            </div>
        </header>
        </>
    );
}

function MCQOptions({ options, correctIndex, selectedIndex, showFeedback, onSelect, topicColour, t }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
            {options.map((option, i) => {
                let bg = glass.bg;
                let borderColor = glass.border;
                let textColor = t.text.primary;

                if (showFeedback) {
                    if (i === correctIndex) {
                        bg = t.accent.successLight;
                        borderColor = t.accent.success;
                    } else if (i === selectedIndex && i !== correctIndex) {
                        bg = t.accent.errorLight;
                        borderColor = t.accent.error;
                    }
                } else if (i === selectedIndex) {
                    bg = topicColour + '15';
                    borderColor = topicColour;
                }

                return (
                    <button
                        key={i}
                        onClick={() => !showFeedback && onSelect(i)}
                        disabled={showFeedback}
                        style={{
                            textAlign: 'left',
                            padding: `${spacing[4]} ${spacing[5]}`,
                            background: bg,
                            border: `1.5px solid ${borderColor}`,
                            borderRadius: borderRadius.lg,
                            cursor: showFeedback ? 'default' : 'pointer',
                            fontSize: typography.size.base,
                            color: textColor,
                            lineHeight: typography.lineHeight.normal,
                            backdropFilter: 'blur(8px)',
                            transition: `all ${transitions.fast}`,
                            fontFamily: 'inherit',
                        }}
                    >
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '24px',
                            height: '24px',
                            borderRadius: borderRadius.full,
                            background: showFeedback && i === correctIndex ? t.accent.success
                                : showFeedback && i === selectedIndex ? t.accent.error
                                : t.bg.tertiary,
                            color: showFeedback && (i === correctIndex || i === selectedIndex) ? t.text.inverse : t.text.secondary,
                            fontSize: typography.size.xs,
                            fontWeight: typography.weight.semibold,
                            marginRight: spacing[3],
                            flexShrink: 0,
                        }}>
                            {String.fromCharCode(65 + i)}
                        </span>
                        {option}
                    </button>
                );
            })}
        </div>
    );
}

function NumericInput({ unit, showFeedback, onSubmit, t }) {
    const [value, setValue] = useState('');

    function handleSubmit(e) {
        e.preventDefault();
        if (value.trim() && !showFeedback) {
            onSubmit(value.trim());
        }
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: spacing[3], alignItems: 'center' }}>
            <input
                type="text"
                inputMode="decimal"
                value={value}
                onChange={e => setValue(e.target.value)}
                disabled={showFeedback}
                placeholder="Your answer"
                style={{
                    flex: 1,
                    padding: `${spacing[3]} ${spacing[4]}`,
                    fontSize: typography.size.lg,
                    border: `1.5px solid ${showFeedback ? t.border.input : glass.border}`,
                    borderRadius: borderRadius.lg,
                    background: showFeedback ? t.bg.tertiary : t.bg.primary,
                    color: t.text.primary,
                    fontFamily: typography.fontFamilyMono,
                    backdropFilter: 'blur(8px)',
                    outline: 'none',
                }}
            />
            {unit && (
                <span style={{
                    fontSize: typography.size.sm,
                    color: t.text.tertiary,
                    fontWeight: typography.weight.medium,
                    whiteSpace: 'nowrap',
                }}>
                    {unit}
                </span>
            )}
            {!showFeedback && (
                <button
                    type="submit"
                    disabled={!value.trim()}
                    style={{
                        padding: `${spacing[3]} ${spacing[5]}`,
                        background: value.trim() ? glass.bgPrimary : t.bg.tertiary,
                        color: value.trim() ? t.text.inverse : t.text.tertiary,
                        border: 'none',
                        borderRadius: borderRadius.lg,
                        fontSize: typography.size.base,
                        fontWeight: typography.weight.semibold,
                        cursor: value.trim() ? 'pointer' : 'default',
                        backdropFilter: 'blur(8px)',
                        boxShadow: value.trim() ? glass.shadowPrimary : 'none',
                        fontFamily: 'inherit',
                    }}
                >
                    Check
                </button>
            )}
        </form>
    );
}

function ShortAnswer({ showFeedback, onSubmit, sampleAnswer, keyPoints, t }) {
    const [value, setValue] = useState('');

    function handleSubmit(e) {
        e.preventDefault();
        if (value.trim() && !showFeedback) {
            onSubmit(value.trim());
        }
    }

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <textarea
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    disabled={showFeedback}
                    placeholder="Type your answer..."
                    rows={4}
                    style={{
                        width: '100%',
                        padding: spacing[4],
                        fontSize: typography.size.base,
                        border: `1.5px solid ${showFeedback ? t.border.input : glass.border}`,
                        borderRadius: borderRadius.lg,
                        background: showFeedback ? t.bg.tertiary : t.bg.primary,
                        color: t.text.primary,
                        lineHeight: typography.lineHeight.relaxed,
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        backdropFilter: 'blur(8px)',
                        outline: 'none',
                        boxSizing: 'border-box',
                    }}
                />
                {!showFeedback && (
                    <button
                        type="submit"
                        disabled={!value.trim()}
                        style={{
                            marginTop: spacing[3],
                            padding: `${spacing[3]} ${spacing[5]}`,
                            background: value.trim() ? glass.bgPrimary : t.bg.tertiary,
                            color: value.trim() ? t.text.inverse : t.text.tertiary,
                            border: 'none',
                            borderRadius: borderRadius.lg,
                            fontSize: typography.size.base,
                            fontWeight: typography.weight.semibold,
                            cursor: value.trim() ? 'pointer' : 'default',
                            backdropFilter: 'blur(8px)',
                            boxShadow: value.trim() ? glass.shadowPrimary : 'none',
                            fontFamily: 'inherit',
                        }}
                    >
                        Submit
                    </button>
                )}
            </form>

            {showFeedback && (
                <div style={{ marginTop: spacing[4] }}>
                    <p style={{
                        fontSize: typography.size.sm,
                        fontWeight: typography.weight.semibold,
                        color: t.text.secondary,
                        marginBottom: spacing[2],
                    }}>
                        Sample answer:
                    </p>
                    <p style={{
                        fontSize: typography.size.sm,
                        color: t.text.secondary,
                        lineHeight: typography.lineHeight.relaxed,
                        fontStyle: 'italic',
                        marginBottom: spacing[3],
                    }}>
                        {sampleAnswer}
                    </p>
                    <p style={{
                        fontSize: typography.size.xs,
                        color: t.text.tertiary,
                        marginBottom: spacing[1],
                    }}>
                        Key points to include:
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
                        {keyPoints.map((point, i) => (
                            <span key={i} style={{
                                background: t.bg.tertiary,
                                color: t.text.secondary,
                                padding: `${spacing[1]} ${spacing[2]}`,
                                borderRadius: borderRadius.md,
                                fontSize: typography.size.xs,
                            }}>
                                {point}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function TrajectoryChart({ history, topicColour, t }) {
    const width = 400;
    const height = 160;
    const padLeft = 36;
    const padRight = 16;
    const padTop = 16;
    const padBottom = 28;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    const points = history.map((h, i) => ({
        x: padLeft + (history.length === 1 ? chartW / 2 : (i / (history.length - 1)) * chartW),
        y: padTop + chartH - (h.percentage / 100) * chartH,
        pct: h.percentage,
        attempt: h.attemptNumber,
    }));

    const polyline = points.map(p => `${p.x},${p.y}`).join(' ');

    // Area fill under the line
    const area = `${padLeft},${padTop + chartH} ${polyline} ${points[points.length - 1].x},${padTop + chartH}`;

    return (
        <div style={{
            background: t.bg.secondary,
            borderRadius: borderRadius.lg,
            padding: spacing[4],
        }}>
            <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
                {/* Grid lines at 25%, 50%, 75% */}
                {[25, 50, 75].map(pct => {
                    const y = padTop + chartH - (pct / 100) * chartH;
                    return (
                        <g key={pct}>
                            <line x1={padLeft} y1={y} x2={padLeft + chartW} y2={y}
                                stroke={t.border.subtle} strokeWidth="1" strokeDasharray="4,4" />
                            <text x={padLeft - 6} y={y + 4} textAnchor="end"
                                fill={t.text.tertiary} fontSize="10" fontFamily={typography.fontFamily}>
                                {pct}%
                            </text>
                        </g>
                    );
                })}

                {/* Area fill */}
                <polygon points={area} fill={topicColour + '15'} />

                {/* Line */}
                <polyline points={polyline} fill="none" stroke={topicColour} strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round" />

                {/* Data points */}
                {points.map((p, i) => (
                    <g key={i}>
                        <circle cx={p.x} cy={p.y} r="5" fill={t.bg.primary} stroke={topicColour} strokeWidth="2.5" />
                        <text x={p.x} y={padTop + chartH + 16} textAnchor="middle"
                            fill={t.text.tertiary} fontSize="10" fontFamily={typography.fontFamily}>
                            #{p.attempt}
                        </text>
                    </g>
                ))}

                {/* Latest score label */}
                {points.length > 0 && (
                    <text
                        x={points[points.length - 1].x}
                        y={points[points.length - 1].y - 10}
                        textAnchor="middle"
                        fill={topicColour}
                        fontSize="12"
                        fontWeight="600"
                        fontFamily={typography.fontFamily}
                    >
                        {points[points.length - 1].pct}%
                    </text>
                )}
            </svg>
        </div>
    );
}

function calculateSummary(responses, questions) {
    const scored = responses.filter(r => r.correct !== null);
    const correctCount = scored.filter(r => r.correct).length;
    const totalScored = scored.length;
    const shortCount = responses.filter(r => r.correct === null).length;
    const percentage = totalScored > 0 ? Math.round((correctCount / totalScored) * 100) : 0;

    // Per-type breakdown
    const typeLabels = { mcq: 'Multiple Choice', numeric: 'Calculations', short: 'Short Answer' };
    const types = {};
    questions.forEach((q, i) => {
        const r = responses[i];
        if (!types[q.type]) types[q.type] = { total: 0, correct: 0, selfAssessed: 0 };
        types[q.type].total++;
        if (r?.correct === true) types[q.type].correct++;
        if (r?.correct === null) types[q.type].selfAssessed++;
    });

    const typeBreakdown = Object.entries(types).map(([type, stats]) => {
        const scoreable = stats.total - stats.selfAssessed;
        const pct = scoreable > 0 ? Math.round((stats.correct / scoreable) * 100) : null;
        let label = 'Needs work';
        if (pct === null) label = 'Self-assessed';
        else if (pct >= 80) label = 'Strong';
        else if (pct >= 50) label = 'Getting there';
        return { type, name: typeLabels[type] || type, ...stats, scoreable, pct, label };
    });

    return { correctCount, totalScored, shortCount, percentage, typeBreakdown };
}

function ResultsSummary({ responses, questions, topic, studentId, t }) {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (studentId) {
            getQuizHistory(studentId, topic.id).then(setHistory);
        }
    }, [studentId, topic.id]);

    const summary = calculateSummary(responses, questions);
    const { correctCount, totalScored, shortCount, percentage, typeBreakdown } = summary;

    const scoreColor = percentage >= 70 ? t.accent.success : percentage >= 40 ? t.accent.warning : t.accent.error;

    return (
        <div style={{
            background: t.bg.primary,
            borderRadius: borderRadius.xl,
            border: `1px solid ${t.border.subtle}`,
            boxShadow: t.shadow.md,
            padding: spacing[8],
        }}>
            <h2 style={{
                fontSize: typography.size['2xl'],
                fontWeight: typography.weight.bold,
                color: t.text.primary,
                textAlign: 'center',
                marginBottom: spacing[2],
            }}>
                Quiz Complete
            </h2>

            {/* Score circle */}
            <div style={{ textAlign: 'center', marginBottom: spacing[6] }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100px',
                    height: '100px',
                    borderRadius: borderRadius.full,
                    border: `4px solid ${scoreColor}`,
                    marginBottom: spacing[3],
                }}>
                    <span style={{
                        fontSize: typography.size['3xl'],
                        fontWeight: typography.weight.bold,
                        color: scoreColor,
                    }}>
                        {percentage}%
                    </span>
                </div>
                <p style={{ color: t.text.secondary, fontSize: typography.size.sm }}>
                    {correctCount} of {totalScored} scored questions correct
                    {shortCount > 0 && ` · ${shortCount} self-assessed`}
                </p>
                <p style={{ color: t.text.tertiary, fontSize: typography.size.xs, marginTop: spacing[1] }}>
                    {questions.length} questions from a bank of {getQuestions(topic.id).length} — try again for different questions
                </p>
            </div>

            {/* Strength / weakness by question type */}
            <div style={{ marginBottom: spacing[6] }}>
                <h3 style={{
                    fontSize: typography.size.base,
                    fontWeight: typography.weight.semibold,
                    color: t.text.primary,
                    marginBottom: spacing[3],
                }}>
                    By Question Type
                </h3>
                <div style={{ display: 'flex', gap: spacing[3], flexWrap: 'wrap' }}>
                    {typeBreakdown.map(tb => {
                        const labelColor = tb.label === 'Strong' ? t.accent.success
                            : tb.label === 'Getting there' ? t.accent.warning
                            : tb.label === 'Self-assessed' ? t.accent.info
                            : t.accent.error;
                        const labelBg = tb.label === 'Strong' ? t.accent.successLight
                            : tb.label === 'Getting there' ? t.accent.warningLight
                            : tb.label === 'Self-assessed' ? t.accent.infoLight
                            : t.accent.errorLight;

                        return (
                            <div key={tb.type} style={{
                                flex: '1 1 140px',
                                background: t.bg.secondary,
                                borderRadius: borderRadius.lg,
                                padding: spacing[4],
                                textAlign: 'center',
                            }}>
                                <p style={{
                                    fontSize: typography.size.xs,
                                    color: t.text.tertiary,
                                    textTransform: 'uppercase',
                                    letterSpacing: typography.letterSpacing.wide,
                                    marginBottom: spacing[2],
                                }}>
                                    {tb.name}
                                </p>
                                {tb.pct !== null ? (
                                    <p style={{
                                        fontSize: typography.size['2xl'],
                                        fontWeight: typography.weight.bold,
                                        color: labelColor,
                                        marginBottom: spacing[1],
                                    }}>
                                        {tb.correct}/{tb.scoreable}
                                    </p>
                                ) : (
                                    <p style={{
                                        fontSize: typography.size.lg,
                                        fontWeight: typography.weight.bold,
                                        color: t.accent.info,
                                        marginBottom: spacing[1],
                                    }}>
                                        {tb.total} done
                                    </p>
                                )}
                                <span style={{
                                    display: 'inline-block',
                                    padding: `${spacing[0.5]} ${spacing[2]}`,
                                    borderRadius: borderRadius.full,
                                    fontSize: typography.size.xs,
                                    fontWeight: typography.weight.medium,
                                    color: labelColor,
                                    background: labelBg,
                                }}>
                                    {tb.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Learning trajectory chart */}
            {history.length >= 2 && (
                <div style={{ marginBottom: spacing[6] }}>
                    <h3 style={{
                        fontSize: typography.size.base,
                        fontWeight: typography.weight.semibold,
                        color: t.text.primary,
                        marginBottom: spacing[3],
                    }}>
                        Your Progress
                    </h3>
                    <TrajectoryChart history={history} topicColour={topic.colour} t={t} />
                </div>
            )}

            {/* Per-question breakdown */}
            <div style={{ marginBottom: spacing[6] }}>
                <h3 style={{
                    fontSize: typography.size.base,
                    fontWeight: typography.weight.semibold,
                    color: t.text.primary,
                    marginBottom: spacing[3],
                }}>
                    Question Breakdown
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                    {questions.map((q, i) => {
                        const response = responses[i];
                        const icon = response?.correct === true ? '✓'
                            : response?.correct === false ? '✗'
                            : '—';
                        const color = response?.correct === true ? t.accent.success
                            : response?.correct === false ? t.accent.error
                            : t.accent.info;

                        return (
                            <div key={q.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: spacing[3],
                                padding: `${spacing[2]} ${spacing[3]}`,
                                background: t.bg.secondary,
                                borderRadius: borderRadius.md,
                            }}>
                                <span style={{
                                    width: '24px',
                                    height: '24px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: borderRadius.full,
                                    background: color + '20',
                                    color: color,
                                    fontSize: typography.size.xs,
                                    fontWeight: typography.weight.bold,
                                    flexShrink: 0,
                                }}>
                                    {icon}
                                </span>
                                <span style={{
                                    fontSize: typography.size.sm,
                                    color: t.text.secondary,
                                    flex: 1,
                                }}>
                                    {q.question.length > 80 ? q.question.slice(0, 80) + '...' : q.question}
                                </span>
                                <span style={{
                                    fontSize: typography.size.xs,
                                    color: t.text.tertiary,
                                    textTransform: 'uppercase',
                                    letterSpacing: typography.letterSpacing.wide,
                                }}>
                                    {q.type}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: spacing[3] }}>
                <Link
                    href={`/topic/${topic.id}`}
                    style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: `${spacing[3]} ${spacing[5]}`,
                        background: t.bg.tertiary,
                        color: t.text.secondary,
                        border: 'none',
                        borderRadius: borderRadius.lg,
                        fontSize: typography.size.base,
                        fontWeight: typography.weight.medium,
                        textDecoration: 'none',
                    }}
                >
                    Back to Topic
                </Link>
                <button
                    onClick={() => window.location.reload()}
                    style={{
                        flex: 1,
                        padding: `${spacing[3]} ${spacing[5]}`,
                        background: topic.colour,
                        color: t.text.inverse,
                        border: 'none',
                        borderRadius: borderRadius.lg,
                        fontSize: typography.size.base,
                        fontWeight: typography.weight.semibold,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                    }}
                >
                    Try Again
                </button>
            </div>
        </div>
    );
}
