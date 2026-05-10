'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { theme, typography, borderRadius, spacing, transitions, glass, editorial as ED } from '@/lib/theme';
import { getQuestions } from '@/lib/questions';
import { getNextAttemptNumber, saveQuizResponse } from '@/lib/quiz-persistence';
import AuthGate from '@/app/revise/[topicId]/AuthGate';

export default function ExamModeClient({ topic }) {
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

    // Timer state
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [totalTime, setTotalTime] = useState(0);
    const [started, setStarted] = useState(false);
    const questionStartRef = useRef(Date.now());
    const [questionTimes, setQuestionTimes] = useState([]);
    const timerRef = useRef(null);

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
            const qs = getQuestions(topic.id);
            setQuestions(qs);
            const seconds = qs.length * 60; // 1 minute per question
            setTimeRemaining(seconds);
            setTotalTime(seconds);
            getNextAttemptNumber(student.token, topic.id)
                .then(setAttemptNumber)
                .catch(() => setAttemptNumber(1));
        }
    }, [topic.id, student]);

    const finishQuiz = useCallback((currentResponses, currentQuestionTimes) => {
        if (timerRef.current) clearInterval(timerRef.current);
        setFinished(true);

        // Submit any remaining unanswered questions as null
        const answered = currentResponses.length;
        const remaining = questions.length - answered;
        if (remaining > 0 && student && attemptNumber) {
            for (let i = answered; i < questions.length; i++) {
                saveQuizResponse({
                    token: student.token,
                    topicId: topic.id,
                    questionId: questions[i].id,
                    questionType: questions[i].type,
                    answer: '',
                    correct: null,
                    attemptNumber,
                    timeTakenMs: null,
                    mode: 'exam',
                });
            }
        }
    }, [questions, student, attemptNumber, topic.id]);

    // Timer countdown
    useEffect(() => {
        if (!started || finished) return;

        timerRef.current = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    // Auto-submit — need to finalize current question if unanswered
                    setFinished(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [started, finished]);

    function handleStart() {
        setStarted(true);
        questionStartRef.current = Date.now();
    }

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
        setStarted(false);
        setQuestionTimes([]);
    }

    if (!authChecked) {
        return (
            <div style={{ minHeight: '100vh', background: t.bg.secondary, fontFamily: typography.fontFamily }}>
                <ExamHeader topic={topic} t={t} />
            </div>
        );
    }

    if (!student) {
        return (
            <div style={{ minHeight: '100vh', background: t.bg.secondary, fontFamily: typography.fontFamily }}>
                <ExamHeader topic={topic} t={t} />
                <main style={{ maxWidth: '720px', margin: '0 auto', padding: spacing[8] }}>
                    <AuthGate onAuthenticated={setStudent} />
                </main>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div style={{ minHeight: '100vh', background: t.bg.secondary, fontFamily: typography.fontFamily }}>
                <ExamHeader topic={topic} t={t} studentName={student?.studentName} onSignOut={handleSignOut} />
                <main style={{ maxWidth: '720px', margin: '0 auto', padding: spacing[8] }}>
                    <p style={{ color: t.text.secondary, textAlign: 'center' }}>
                        No questions available for this topic yet.
                    </p>
                </main>
            </div>
        );
    }

    // Pre-exam screen
    if (!started) {
        const minutes = Math.ceil(totalTime / 60);
        return (
            <div style={{ minHeight: '100vh', background: t.bg.secondary, fontFamily: typography.fontFamily }}>
                <ExamHeader topic={topic} t={t} studentName={student?.studentName} onSignOut={handleSignOut} />
                <main style={{ maxWidth: '720px', margin: '0 auto', padding: spacing[8] }}>
                    <div style={{
                        background: glass.bg,
                        backdropFilter: 'blur(' + glass.blur + ')',
                        WebkitBackdropFilter: 'blur(' + glass.blur + ')',
                        borderRadius: borderRadius.xl,
                        border: `1px solid ${glass.border}`,
                        boxShadow: glass.shadowHover,
                        padding: spacing[8],
                        textAlign: 'center',
                    }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '64px',
                            height: '64px',
                            borderRadius: borderRadius.full,
                            background: ED.accentTint,
                            marginBottom: spacing[4],
                        }}>
                            <span style={{ fontSize: '2rem' }}>⏱️</span>
                        </div>
                        <h2 style={{
                            fontSize: typography.size['2xl'],
                            fontWeight: typography.weight.bold,
                            color: t.text.primary,
                            marginBottom: spacing[3],
                        }}>
                            Exam Mode
                        </h2>
                        <p style={{
                            fontSize: typography.size.base,
                            color: t.text.secondary,
                            lineHeight: typography.lineHeight.relaxed,
                            marginBottom: spacing[6],
                        }}>
                            {questions.length} questions · {minutes} minute{minutes !== 1 ? 's' : ''} · No going back
                        </p>
                        <div style={{
                            background: t.accent.warningLight,
                            border: `1px solid ${t.accent.warning}`,
                            borderRadius: borderRadius.lg,
                            padding: spacing[4],
                            marginBottom: spacing[6],
                        }}>
                            <p style={{
                                fontSize: typography.size.sm,
                                color: t.text.secondary,
                                lineHeight: typography.lineHeight.relaxed,
                            }}>
                                Once you start, the timer begins. You cannot go back to previous questions.
                                When time runs out, unanswered questions are automatically submitted.
                            </p>
                        </div>
                        <button
                            onClick={handleStart}
                            style={{
                                padding: `${spacing[3]} ${spacing[8]}`,
                                background: ED.accent,
                                color: t.text.inverse,
                                border: '1px solid ' + glass.border,
                                borderRadius: borderRadius.lg,
                                fontSize: typography.size.lg,
                                fontWeight: typography.weight.semibold,
                                cursor: 'pointer',
                                backdropFilter: 'blur(8px)',
                                boxShadow: glass.shadowPrimary,
                                fontFamily: 'inherit',
                            }}
                        >
                            Start Exam
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    // Finished — show results
    if (finished) {
        return (
            <div style={{ minHeight: '100vh', background: t.bg.secondary, fontFamily: typography.fontFamily }}>
                <ExamHeader topic={topic} t={t} studentName={student?.studentName} onSignOut={handleSignOut} />
                <main style={{ maxWidth: '720px', margin: '0 auto', padding: spacing[8] }}>
                    <ExamResultsSummary
                        responses={responses}
                        questions={questions}
                        topic={topic}
                        questionTimes={questionTimes}
                        totalTime={totalTime}
                        timeRemaining={timeRemaining}
                        t={t}
                    />
                </main>
            </div>
        );
    }

    // Active quiz
    const current = questions[questionIndex];
    const progress = questionIndex + 1;
    const total = questions.length;

    function submitAnswer(answer) {
        const timeTakenMs = Date.now() - questionStartRef.current;
        setCurrentAnswer(answer);

        let correct = false;
        if (current.type === 'mcq') {
            correct = answer === current.correctIndex;
        } else if (current.type === 'numeric') {
            const parsed = parseFloat(answer);
            correct = !isNaN(parsed) && Math.abs(parsed - current.answer) <= (current.tolerance || 0);
        } else if (current.type === 'short') {
            correct = false;
        }

        const correctValue = current.type === 'short' ? null : correct;
        setIsCorrect(correct);
        setShowFeedback(true);

        const newResponses = [...responses, {
            questionId: current.id,
            type: current.type,
            answer,
            correct: correctValue,
        }];
        setResponses(newResponses);

        const newTimes = [...questionTimes, timeTakenMs];
        setQuestionTimes(newTimes);

        // Persist to Supabase
        if (student && attemptNumber) {
            saveQuizResponse({
                token: student.token,
                topicId: topic.id,
                questionId: current.id,
                questionType: current.type,
                answer: current.type === 'mcq' ? current.options[answer] : String(answer),
                correct: correctValue,
                attemptNumber,
                timeTakenMs,
                mode: 'exam',
            });
        }
    }

    function nextQuestion() {
        if (questionIndex + 1 >= questions.length) {
            finishQuiz(responses, questionTimes);
        } else {
            setQuestionIndex(prev => prev + 1);
            setCurrentAnswer(null);
            setShowFeedback(false);
            setIsCorrect(false);
            questionStartRef.current = Date.now();
        }
    }

    // Timer colour
    const timePercent = totalTime > 0 ? timeRemaining / totalTime : 1;
    const timerColor = timePercent > 0.5 ? t.accent.success
        : timePercent > 0.25 ? t.accent.warning
        : t.accent.error;

    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const timerDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    return (
        <div style={{ minHeight: '100vh', background: t.bg.secondary, fontFamily: typography.fontFamily }}>
            <ExamHeader
                topic={topic}
                t={t}
                studentName={student?.studentName}
                onSignOut={handleSignOut}
                timerDisplay={timerDisplay}
                timerColor={timerColor}
            />

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
                            background: ED.accent,
                            borderRadius: borderRadius.full,
                            transition: `width ${transitions.normal} ${transitions.easing}`,
                        }} />
                    </div>
                </div>

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
                            t={t}
                        />
                    )}

                    {/* Feedback panel — brief in exam mode */}
                    {showFeedback && current.type !== 'short' && (
                        <div style={{
                            marginTop: spacing[6],
                            padding: spacing[4],
                            borderRadius: borderRadius.lg,
                            border: `1px solid ${isCorrect ? t.accent.success : t.accent.error}`,
                            background: isCorrect ? t.accent.successLight : t.accent.errorLight,
                        }}>
                            <p style={{
                                fontWeight: typography.weight.semibold,
                                fontSize: typography.size.base,
                                color: isCorrect ? t.accent.success : t.accent.error,
                            }}>
                                {isCorrect ? 'Correct!' : 'Incorrect'}
                            </p>
                        </div>
                    )}

                    {showFeedback && current.type === 'short' && (
                        <div style={{
                            marginTop: spacing[6],
                            padding: spacing[4],
                            borderRadius: borderRadius.lg,
                            border: `1px solid ${t.accent.info}`,
                            background: t.accent.infoLight,
                        }}>
                            <p style={{
                                fontWeight: typography.weight.semibold,
                                fontSize: typography.size.base,
                                color: t.accent.info,
                            }}>
                                Answer recorded
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
                                background: ED.accent,
                                color: t.text.inverse,
                                border: '1px solid ' + glass.border,
                                borderRadius: borderRadius.lg,
                                fontSize: typography.size.base,
                                fontWeight: typography.weight.semibold,
                                cursor: 'pointer',
                                backdropFilter: 'blur(8px)',
                                boxShadow: glass.shadowPrimary,
                                transition: `opacity ${transitions.fast}`,
                                fontFamily: 'inherit',
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

function ExamHeader({ topic, t, studentName, onSignOut, timerDisplay, timerColor }) {
    return (
        <header style={{
            background: glass.bg,
            backdropFilter: 'blur(' + glass.blur + ')',
            WebkitBackdropFilter: 'blur(' + glass.blur + ')',
            boxShadow: glass.shadow,
            borderBottom: `1px solid ${ED.rule}`,
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
                            background: glass.bg,
                            border: '1px solid ' + glass.border,
                            boxShadow: glass.iconShadow,
                            backdropFilter: 'blur(8px)',
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
                        Exam: {topic.name}
                    </h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                    {timerDisplay && (
                        <span style={{
                            fontFamily: typography.fontFamilyMono,
                            fontSize: typography.size.lg,
                            fontWeight: typography.weight.bold,
                            color: timerColor,
                            background: timerColor + '15',
                            padding: `${spacing[1]} ${spacing[3]}`,
                            borderRadius: borderRadius.md,
                            backdropFilter: 'blur(8px)',
                            border: '1px solid ' + glass.border,
                            minWidth: '70px',
                            textAlign: 'center',
                        }}>
                            {timerDisplay}
                        </span>
                    )}
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
                </div>
            </div>
        </header>
    );
}

// Reused question type components — simplified for exam mode

function MCQOptions({ options, correctIndex, selectedIndex, showFeedback, onSelect, t }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
            {options.map((option, i) => {
                let bg = glass.bg;
                let borderColor = t.border.subtle;

                if (showFeedback) {
                    if (i === correctIndex) {
                        bg = t.accent.successLight;
                        borderColor = t.accent.success;
                    } else if (i === selectedIndex && i !== correctIndex) {
                        bg = t.accent.errorLight;
                        borderColor = t.accent.error;
                    }
                } else if (i === selectedIndex) {
                    bg = ED.accentTint;
                    borderColor = ED.accent;
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
                            color: t.text.primary,
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

function ShortAnswer({ showFeedback, onSubmit, t }) {
    const [value, setValue] = useState('');

    function handleSubmit(e) {
        e.preventDefault();
        if (value.trim() && !showFeedback) {
            onSubmit(value.trim());
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <textarea
                value={value}
                onChange={e => setValue(e.target.value)}
                disabled={showFeedback}
                placeholder="Type your answer..."
                rows={3}
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
    );
}

function ExamResultsSummary({ responses, questions, topic, questionTimes, totalTime, timeRemaining, t }) {
    const scored = responses.filter(r => r.correct !== null);
    const correctCount = scored.filter(r => r.correct).length;
    const totalScored = scored.length;
    const shortCount = responses.filter(r => r.correct === null).length;
    const percentage = totalScored > 0 ? Math.round((correctCount / totalScored) * 100) : 0;
    const scoreColor = percentage >= 70 ? t.accent.success : percentage >= 40 ? t.accent.warning : t.accent.error;

    const timeUsed = totalTime - timeRemaining;
    const timeUsedMin = Math.floor(timeUsed / 60);
    const timeUsedSec = timeUsed % 60;
    const totalMin = Math.floor(totalTime / 60);

    // Calculate average time per question for "slow" detection
    const answeredTimes = questionTimes.filter(t => t != null);
    const avgTime = answeredTimes.length > 0
        ? answeredTimes.reduce((a, b) => a + b, 0) / answeredTimes.length
        : 0;

    return (
        <div style={{
            background: glass.bg,
            backdropFilter: 'blur(' + glass.blur + ')',
            WebkitBackdropFilter: 'blur(' + glass.blur + ')',
            borderRadius: borderRadius.xl,
            border: `1px solid ${glass.border}`,
            boxShadow: glass.shadowHover,
            padding: spacing[8],
        }}>
            <h2 style={{
                fontSize: typography.size['2xl'],
                fontWeight: typography.weight.bold,
                color: t.text.primary,
                textAlign: 'center',
                marginBottom: spacing[2],
            }}>
                Exam Complete
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
            </div>

            {/* Time summary */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: spacing[6],
                marginBottom: spacing[6],
                padding: `${spacing[4]} 0`,
                borderTop: `1px solid ${t.border.subtle}`,
                borderBottom: `1px solid ${t.border.subtle}`,
            }}>
                <div style={{ textAlign: 'center' }}>
                    <p style={{
                        fontSize: typography.size.lg,
                        fontWeight: typography.weight.bold,
                        color: t.text.primary,
                        fontFamily: typography.fontFamilyMono,
                    }}>
                        {timeUsedMin}:{String(timeUsedSec).padStart(2, '0')}
                    </p>
                    <p style={{ fontSize: typography.size.xs, color: t.text.tertiary }}>Time used</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <p style={{
                        fontSize: typography.size.lg,
                        fontWeight: typography.weight.bold,
                        color: t.text.primary,
                        fontFamily: typography.fontFamilyMono,
                    }}>
                        {totalMin}:00
                    </p>
                    <p style={{ fontSize: typography.size.xs, color: t.text.tertiary }}>Allowed</p>
                </div>
            </div>

            {/* Per-question breakdown with timing */}
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
                        const timeTaken = questionTimes[i];
                        const isSlow = timeTaken != null && avgTime > 0 && timeTaken > avgTime * 2;
                        const icon = response?.correct === true ? '✓'
                            : response?.correct === false ? '✗'
                            : response ? '—' : '⊘';
                        const color = response?.correct === true ? t.accent.success
                            : response?.correct === false ? t.accent.error
                            : response ? t.accent.info : t.text.tertiary;

                        const timeStr = timeTaken != null
                            ? timeTaken >= 60000
                                ? `${Math.floor(timeTaken / 60000)}m ${Math.round((timeTaken % 60000) / 1000)}s`
                                : `${Math.round(timeTaken / 1000)}s`
                            : 'skipped';

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
                                    {q.question.length > 60 ? q.question.slice(0, 60) + '...' : q.question}
                                </span>
                                <span style={{
                                    fontSize: typography.size.xs,
                                    fontFamily: typography.fontFamilyMono,
                                    color: isSlow ? t.accent.warning : t.text.tertiary,
                                    fontWeight: isSlow ? typography.weight.semibold : typography.weight.normal,
                                    whiteSpace: 'nowrap',
                                }}>
                                    {timeStr}{isSlow ? ' ⚠' : ''}
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
                        background: glass.bg,
                        color: t.text.secondary,
                        border: '1px solid ' + glass.border,
                        borderRadius: borderRadius.lg,
                        fontSize: typography.size.base,
                        fontWeight: typography.weight.medium,
                        boxShadow: glass.shadow,
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
                        background: ED.accent,
                        color: t.text.inverse,
                        border: '1px solid ' + glass.border,
                        borderRadius: borderRadius.lg,
                        fontSize: typography.size.base,
                        fontWeight: typography.weight.semibold,
                        cursor: 'pointer',
                        backdropFilter: 'blur(8px)',
                        boxShadow: glass.shadowPrimary,
                        fontFamily: 'inherit',
                    }}
                >
                    Try Again
                </button>
            </div>
        </div>
    );
}
