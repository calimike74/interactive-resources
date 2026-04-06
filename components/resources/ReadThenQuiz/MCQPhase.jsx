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
    const showFeedback = true;
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
                    Show hint
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
