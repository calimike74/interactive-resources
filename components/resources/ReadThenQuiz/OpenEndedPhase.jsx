'use client';

import { useState } from 'react';
import { theme, typography, spacing, borderRadius, transitions } from '@/lib/theme';

const t = theme.light;

function checkKeyTerms(text, keyTerms) {
    const lower = text.toLowerCase();
    return keyTerms.map(({ term }) => ({
        term,
        found: lower.includes(term.toLowerCase()),
    }));
}

export default function OpenEndedPhase({ openEnded, keyTerms, scaffoldLevel, onComplete }) {
    const [response, setResponse] = useState('');

    const wordCount = response.trim() === '' ? 0 : response.trim().split(/\s+/).length;
    const showStarters = scaffoldLevel === 'full' || scaffoldLevel === 'medium';
    const showSubQuestions = scaffoldLevel === 'full';

    const handleSubmit = () => {
        if (wordCount === 0) return;
        const keyTermResults = keyTerms ? checkKeyTerms(response, keyTerms) : [];
        onComplete({
            openEndedResponse: response.trim(),
            wordCount,
            keyTermResults,
        });
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
