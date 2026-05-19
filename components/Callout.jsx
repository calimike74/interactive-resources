'use client';

import { useState, useCallback } from 'react';
import { typography, spacing, borderRadius, transitions } from '@/lib/theme';

// ─── Callout Type Definitions ────────────────────────────────────────────────

const CALLOUT_TYPES = {
    question: {
        icon: '?',
        label: 'Check Your Understanding',
        colour: '#d97706',    // amber
        bgTint: '#d9770608',
    },
    definition: {
        icon: 'i',
        label: 'Key Term',
        colour: '#2563eb',    // blue
        bgTint: '#2563eb08',
    },
    tip: {
        icon: '!',
        label: 'Exam Tip',
        colour: '#059669',    // green
        bgTint: '#05966908',
    },
    listen: {
        icon: '♪',
        label: 'Try It',
        colour: '#9B7530',    // purple
        bgTint: '#9B753008',
    },
    visual: {
        icon: '◈',
        label: 'Visualise',
        colour: '#0891b2',    // teal
        bgTint: '#0891b208',
    },
    warning: {
        icon: '',
        label: 'Common Mistake',
        colour: '#dc2626',    // red
        bgTint: '#dc262608',
    },
};

// ─── Callout Component ───────────────────────────────────────────────────────
// Nestable, collapsible, colour-coded left border — inspired by Obsidian callouts.
//
// Usage:
//   <Callout type="question" title="Which waveform has the most harmonics?">
//     <Callout.Options
//       options={['Sine', 'Sawtooth', 'Square']}
//       correctIndex={1}
//       explanation="Sawtooth contains all harmonics..."
//     />
//   </Callout>
//
//   <Callout type="definition" title="Low-Pass Filter">
//     Allows frequencies below the cutoff to pass...
//     <Callout type="listen">
//       Sweep the cutoff slider above to hear the difference.
//     </Callout>
//   </Callout>

export default function Callout({
    type = 'tip',
    title,
    children,
    defaultOpen = true,
    collapsible = true,
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const config = CALLOUT_TYPES[type] || CALLOUT_TYPES.tip;

    return (
        <div
            style={{
                borderLeft: `3px solid ${config.colour}`,
                borderRadius: `0 ${borderRadius.lg} ${borderRadius.lg} 0`,
                background: config.bgTint,
                marginBottom: spacing[4],
                overflow: 'hidden',
                transition: `all ${transitions.normal} ${transitions.easing}`,
            }}
        >
            {/* Header — always visible */}
            <div
                onClick={collapsible ? () => setIsOpen(prev => !prev) : undefined}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[2],
                    padding: `${spacing[3]} ${spacing[4]}`,
                    cursor: collapsible ? 'pointer' : 'default',
                    userSelect: 'none',
                }}
            >
                {/* Type icon */}
                <span
                    style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: config.colour + '18',
                        color: config.colour,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: typography.weight.bold,
                        fontFamily: typography.fontFamilyMono,
                        flexShrink: 0,
                    }}
                >
                    {config.icon}
                </span>

                {/* Label + title */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <span
                        style={{
                            color: config.colour,
                            fontSize: typography.size.xs,
                            fontWeight: typography.weight.semibold,
                            textTransform: 'uppercase',
                            letterSpacing: '0.03em',
                        }}
                    >
                        {config.label}
                    </span>
                    {title && (
                        <span
                            style={{
                                color: '#1a1a2e',
                                fontSize: typography.size.sm,
                                fontWeight: typography.weight.medium,
                                marginLeft: spacing[2],
                            }}
                        >
                            — {title}
                        </span>
                    )}
                </div>

                {/* Chevron */}
                {collapsible && (
                    <span
                        style={{
                            color: config.colour,
                            fontSize: '0.75rem',
                            transition: `transform ${transitions.fast}`,
                            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                            flexShrink: 0,
                        }}
                    >
                        ▸
                    </span>
                )}
            </div>

            {/* Body — collapsible */}
            {isOpen && (
                <div
                    style={{
                        padding: `0 ${spacing[4]} ${spacing[4]}`,
                        paddingLeft: spacing[10], // indent past icon
                        color: '#4a4f5a',
                        fontSize: typography.size.sm,
                        lineHeight: typography.lineHeight.relaxed,
                    }}
                >
                    {children}
                </div>
            )}
        </div>
    );
}

// ─── Callout.Options — MCQ sub-component for question callouts ───────────────

function CalloutOptions({ options, correctIndex, explanation }) {
    const [selected, setSelected] = useState(null);
    const [revealed, setRevealed] = useState(false);

    const handleSelect = useCallback((index) => {
        if (revealed) return;
        setSelected(index);
        setRevealed(true);
    }, [revealed]);

    return (
        <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2], marginBottom: spacing[3] }}>
                {options.map((opt, i) => {
                    const isCorrect = i === correctIndex;
                    const isSelected = i === selected;
                    let bg = '#FFFFFF';
                    let borderCol = '#d1d5db';
                    let textCol = '#4a4f5a';

                    if (revealed) {
                        if (isCorrect) {
                            bg = '#d1fae5';
                            borderCol = '#059669';
                            textCol = '#065f46';
                        } else if (isSelected) {
                            bg = '#fee2e2';
                            borderCol = '#dc2626';
                            textCol = '#991b1b';
                        }
                    } else if (isSelected) {
                        bg = '#d9770612';
                        borderCol = '#d97706';
                        textCol = '#1a1a2e';
                    }

                    return (
                        <button
                            key={i}
                            onClick={() => handleSelect(i)}
                            style={{
                                border: `1.5px solid ${borderCol}`,
                                borderRadius: borderRadius.md,
                                padding: `${spacing[2]} ${spacing[3]}`,
                                background: bg,
                                color: textCol,
                                fontSize: typography.size.sm,
                                fontFamily: typography.fontFamily,
                                textAlign: 'left',
                                cursor: revealed ? 'default' : 'pointer',
                                transition: `all ${transitions.fast}`,
                            }}
                        >
                            {opt}
                        </button>
                    );
                })}
            </div>

            {/* Explanation — shown after answering */}
            {revealed && explanation && (
                <div
                    style={{
                        background: selected === correctIndex ? '#05966910' : '#dc262610',
                        borderRadius: borderRadius.md,
                        padding: `${spacing[2]} ${spacing[3]}`,
                        color: '#4a4f5a',
                        fontSize: typography.size.xs,
                        lineHeight: typography.lineHeight.relaxed,
                    }}
                >
                    {selected === correctIndex ? '✓ ' : '✗ '}
                    {explanation}
                </div>
            )}
        </div>
    );
}

// Attach as static property for clean API: <Callout.Options />
Callout.Options = CalloutOptions;
