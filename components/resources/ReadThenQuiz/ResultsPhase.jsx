'use client';

import { theme, typography, spacing, borderRadius } from '@/lib/theme';

const t = theme.light;

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
}

export default function ResultsPhase({ results, questions, scaffoldLevel, studentName }) {
    const { mcqScore, mcqTotal, mcqAnswers, openEndedResponse, keyTermResults, readingTimeSeconds, totalTimeSeconds } = results;
    const keyTermsFound = keyTermResults ? keyTermResults.filter(k => k.found).length : 0;
    const keyTermsTotal = keyTermResults ? keyTermResults.length : 0;

    return (
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            {studentName && (
                <p style={{
                    textAlign: 'center',
                    color: t.text.secondary,
                    fontSize: typography.size.sm,
                    marginBottom: spacing[2],
                }}>
                    Results for {studentName}
                </p>
            )}
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

            {keyTermResults && keyTermResults.length > 0 && (
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
                        Key concepts mentioned — {keyTermsFound}/{keyTermsTotal}
                    </p>
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: spacing[2],
                        marginTop: spacing[2],
                    }}>
                        {keyTermResults.map(({ term, found }) => (
                            <span key={term} style={{
                                padding: `${spacing[1]} ${spacing[3]}`,
                                borderRadius: borderRadius.full,
                                fontSize: typography.size.xs,
                                fontWeight: typography.weight.medium,
                                background: found ? `${t.accent.success}18` : `${t.accent.error}18`,
                                color: found ? t.accent.success : t.accent.error,
                                border: `1px solid ${found ? t.accent.success : t.accent.error}30`,
                            }}>
                                {found ? '✓' : '✗'} {term}
                            </span>
                        ))}
                    </div>
                </div>
            )}

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
