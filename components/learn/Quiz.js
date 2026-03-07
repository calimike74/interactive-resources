'use client';

import { useState } from 'react';
import { theme, typography, spacing, borderRadius, transitions } from '@/lib/theme';

const t = theme.light;

export default function Quiz({ data, onComplete }) {
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = () => {
        if (selectedIndex === null) return;
        setSubmitted(true);
    };

    const selected = data.options[selectedIndex];
    const isCorrect = selected?.correct;

    return (
        <div>
            <h3 style={{
                fontSize: typography.size.lg,
                fontWeight: typography.weight.semibold,
                color: t.text.primary,
                marginBottom: spacing[4],
                lineHeight: typography.lineHeight.snug,
            }}>
                {data.question}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                {data.options.map((option, i) => {
                    const isSelected = selectedIndex === i;
                    let borderColor = t.border.medium;
                    let bgColor = 'white';

                    if (submitted && isSelected) {
                        borderColor = option.correct ? t.accent.success : t.accent.error;
                        bgColor = option.correct ? t.accent.successLight : t.accent.errorLight;
                    } else if (submitted && option.correct) {
                        borderColor = t.accent.success;
                        bgColor = t.accent.successLight;
                    } else if (isSelected) {
                        borderColor = t.accent.primary;
                        bgColor = '#EFF6FF';
                    }

                    return (
                        <button
                            key={i}
                            onClick={() => !submitted && setSelectedIndex(i)}
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
                            <span>{option.text}</span>
                        </button>
                    );
                })}
            </div>

            {/* Feedback */}
            {submitted && selected && (
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
                        {selected.feedback}
                    </p>
                </div>
            )}

            {/* Actions */}
            {!submitted ? (
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
            ) : (
                <button
                    onClick={() => onComplete({ correct: isCorrect, selectedIndex })}
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
                    Continue
                </button>
            )}
        </div>
    );
}
