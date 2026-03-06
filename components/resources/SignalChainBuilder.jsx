'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { theme, typography, spacing, borderRadius, transitions } from '@/lib/theme';

// ============================================
// Signal Chain Builder
// A-Level Music Technology — Topic 2.4
// Drag-and-drop signal chain ordering exercise
// ============================================

const t = theme.light;

const CORRECT_ORDER = [
    { id: 'sound', text: 'Acoustic Sound', domain: 'acoustic', hint: 'Sound waves travel through the air from the source' },
    { id: 'mic', text: 'Microphone', domain: 'transducer', hint: 'Transducer: converts air pressure variations into electrical voltage' },
    { id: 'antialiasing', text: 'Anti-Aliasing Filter', domain: 'analogue', hint: 'Analogue lowpass filter removes frequencies above the Nyquist frequency before sampling' },
    { id: 'adc', text: 'ADC', domain: 'conversion', hint: 'Analogue-to-Digital Converter: samples the signal and converts to binary data' },
    { id: 'digital', text: 'Digital Processing (DAW)', domain: 'digital', hint: 'Editing, effects, mixing — all in the digital domain' },
    { id: 'dac', text: 'DAC', domain: 'conversion', hint: 'Digital-to-Analogue Converter: converts binary data back to a varying voltage' },
    { id: 'reconstruction', text: 'Reconstruction Filter', domain: 'analogue', hint: 'Analogue lowpass filter smooths the stepped DAC output into a continuous waveform' },
    { id: 'amp', text: 'Amplifier & Speakers', domain: 'transducer', hint: 'Transducer: converts electrical signal back into acoustic sound' },
];

const DOMAIN_COLOURS = {
    acoustic: { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
    transducer: { bg: '#E0E7FF', text: '#3730A3', border: '#A5B4FC' },
    analogue: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
    conversion: { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
    digital: { bg: '#EDE9FE', text: '#5B21B6', border: '#C4B5FD' },
};

const card = {
    background: t.bg.elevated,
    borderRadius: borderRadius.xl,
    border: `1px solid ${t.border.subtle}`,
    padding: spacing[6],
};

const sectionLabel = {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    display: 'block',
    marginBottom: spacing[3],
    color: t.text.tertiary,
};

export default function SignalChainBuilder() {
    const [available, setAvailable] = useState([]);
    const [chain, setChain] = useState([]);
    const [status, setStatus] = useState(null);
    const [showHints, setShowHints] = useState(false);
    const [attempts, setAttempts] = useState(0);

    useEffect(() => { resetGame(); }, []);

    const resetGame = () => {
        const shuffled = [...CORRECT_ORDER].sort(() => Math.random() - 0.5);
        setAvailable(shuffled);
        setChain([]);
        setStatus(null);
    };

    const addToChain = (item) => {
        setAvailable(prev => prev.filter(i => i.id !== item.id));
        setChain(prev => [...prev, item]);
        setStatus(null);
    };

    const removeFromChain = (item) => {
        setChain(prev => prev.filter(i => i.id !== item.id));
        setAvailable(prev => [...prev, item]);
        setStatus(null);
    };

    const checkAnswer = () => {
        if (chain.length !== CORRECT_ORDER.length) {
            setStatus('incomplete');
            return;
        }
        const isCorrect = chain.every((item, idx) => item.id === CORRECT_ORDER[idx].id);
        setAttempts(prev => prev + 1);
        setStatus(isCorrect ? 'correct' : 'incorrect');
        if (!isCorrect && attempts >= 1) {
            setShowHints(true);
        }
    };

    const chipStyle = (domain, isInChain) => {
        const colours = DOMAIN_COLOURS[domain];
        return {
            padding: `${spacing[3]} ${spacing[4]}`,
            borderRadius: borderRadius.lg,
            border: `1px solid ${colours.border}`,
            background: isInChain ? colours.bg : t.bg.elevated,
            color: colours.text,
            fontSize: typography.size.sm,
            fontWeight: typography.weight.medium,
            fontFamily: typography.fontFamily,
            cursor: 'pointer',
            transition: `all ${transitions.fast} ${transitions.easing}`,
        };
    };

    return (
        <div style={{
            maxWidth: '56rem',
            margin: '0 auto',
            padding: spacing[6],
            fontFamily: typography.fontFamily,
            display: 'flex',
            flexDirection: 'column',
            gap: spacing[6],
        }}>
            {/* Instructions */}
            <div style={card}>
                <p style={{
                    fontSize: typography.size.sm,
                    color: t.text.secondary,
                    lineHeight: typography.lineHeight.relaxed,
                }}>
                    Build the complete signal chain for <strong style={{ color: t.text.primary }}>recording
                    and playing back audio</strong>. Click components from the bank to add them to your
                    signal path in the correct order. Click a placed component to remove it.
                </p>
            </div>

            {/* Components bank */}
            <div>
                <span style={sectionLabel}>Components Bank (click to add)</span>
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: spacing[3],
                    padding: spacing[5],
                    background: t.bg.secondary,
                    borderRadius: borderRadius.xl,
                    border: `1px solid ${t.border.subtle}`,
                    minHeight: '4rem',
                }}>
                    {available.map(item => (
                        <button
                            key={item.id}
                            onClick={() => addToChain(item)}
                            style={chipStyle(item.domain, false)}
                        >
                            {item.text}
                        </button>
                    ))}
                    {available.length === 0 && (
                        <span style={{
                            color: t.text.tertiary,
                            fontStyle: 'italic',
                            fontSize: typography.size.sm,
                        }}>
                            All components placed.
                        </span>
                    )}
                </div>
            </div>

            {/* Signal chain */}
            <div>
                <span style={sectionLabel}>Your Signal Path (click to remove)</span>
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: spacing[2],
                    alignItems: 'center',
                    padding: spacing[5],
                    background: t.bg.elevated,
                    borderRadius: borderRadius.xl,
                    border: `2px dashed ${t.border.medium}`,
                    minHeight: '5rem',
                }}>
                    {chain.map((item, idx) => (
                        <span key={item.id} style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                            <button
                                onClick={() => removeFromChain(item)}
                                style={chipStyle(item.domain, true)}
                            >
                                {item.text}
                            </button>
                            {idx < chain.length - 1 && (
                                <span style={{
                                    color: t.text.tertiary,
                                    fontSize: typography.size.lg,
                                    userSelect: 'none',
                                }}>&rarr;</span>
                            )}
                        </span>
                    ))}
                    {chain.length === 0 && (
                        <span style={{
                            color: t.text.tertiary,
                            fontStyle: 'italic',
                            fontSize: typography.size.sm,
                            width: '100%',
                            textAlign: 'center',
                        }}>
                            Click components above to build your signal chain.
                        </span>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: spacing[3], justifyContent: 'flex-end' }}>
                <button onClick={resetGame} style={{
                    padding: `${spacing[3]} ${spacing[5]}`,
                    borderRadius: borderRadius.lg,
                    border: `1px solid ${t.border.medium}`,
                    background: t.bg.elevated,
                    color: t.text.secondary,
                    fontSize: typography.size.sm,
                    fontWeight: typography.weight.medium,
                    fontFamily: typography.fontFamily,
                    cursor: 'pointer',
                }}>
                    Reset
                </button>
                <button onClick={checkAnswer} style={{
                    padding: `${spacing[3]} ${spacing[5]}`,
                    borderRadius: borderRadius.lg,
                    border: 'none',
                    background: t.accent.primary,
                    color: t.text.inverse,
                    fontSize: typography.size.sm,
                    fontWeight: typography.weight.semibold,
                    fontFamily: typography.fontFamily,
                    cursor: 'pointer',
                }}>
                    Check Path
                </button>
            </div>

            {/* Feedback */}
            {status === 'correct' && (
                <div style={{
                    ...card,
                    background: t.accent.successLight,
                    borderColor: t.accent.success,
                    borderLeft: `4px solid ${t.accent.success}`,
                }}>
                    <p style={{
                        fontSize: typography.size.sm,
                        color: '#065F46',
                        fontWeight: typography.weight.semibold,
                    }}>
                        Correct! The complete signal chain runs from acoustic sound through the
                        analogue and digital domains and back to acoustic sound.
                    </p>
                    {/* Show domain annotations */}
                    <div style={{
                        marginTop: spacing[4],
                        display: 'flex',
                        flexDirection: 'column',
                        gap: spacing[2],
                    }}>
                        {CORRECT_ORDER.map(item => (
                            <div key={item.id} style={{
                                display: 'flex',
                                gap: spacing[3],
                                alignItems: 'baseline',
                            }}>
                                <span style={{
                                    ...chipStyle(item.domain, true),
                                    padding: `${spacing[1]} ${spacing[3]}`,
                                    fontSize: typography.size.xs,
                                    cursor: 'default',
                                    minWidth: '160px',
                                    textAlign: 'center',
                                }}>
                                    {item.text}
                                </span>
                                <span style={{
                                    fontSize: typography.size.xs,
                                    color: t.text.secondary,
                                }}>
                                    {item.hint}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {status === 'incorrect' && (
                <div style={{
                    ...card,
                    background: t.accent.errorLight,
                    borderColor: t.accent.error,
                    borderLeft: `4px solid ${t.accent.error}`,
                }}>
                    <p style={{
                        fontSize: typography.size.sm,
                        color: '#991B1B',
                        fontWeight: typography.weight.semibold,
                    }}>
                        Not quite right. Think about the order: what happens first when sound enters a
                        studio, and what's needed before and after each converter?
                    </p>
                    {showHints && (
                        <div style={{
                            marginTop: spacing[3],
                            padding: spacing[3],
                            background: 'rgba(255,255,255,0.5)',
                            borderRadius: borderRadius.md,
                        }}>
                            <p style={{ fontSize: typography.size.xs, color: t.text.secondary }}>
                                <strong>Hint:</strong> The chain starts with acoustic sound and ends with
                                acoustic sound. Each converter (ADC/DAC) has a filter partner — the anti-aliasing
                                filter goes <em>before</em> the ADC, the reconstruction filter goes <em>after</em> the DAC.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {status === 'incomplete' && (
                <div style={{
                    ...card,
                    background: t.accent.warningLight,
                    borderColor: t.accent.warning,
                    borderLeft: `4px solid ${t.accent.warning}`,
                }}>
                    <p style={{
                        fontSize: typography.size.sm,
                        color: '#92400E',
                        fontWeight: typography.weight.semibold,
                    }}>
                        Place all {CORRECT_ORDER.length} components before checking your answer.
                    </p>
                </div>
            )}

            {/* Key Definitions */}
            <div>
                <h3 style={{
                    fontSize: typography.size.xl,
                    fontWeight: typography.weight.semibold,
                    color: t.text.primary,
                    marginBottom: spacing[5],
                }}>
                    Key Definitions
                </h3>
                {SIGNAL_CHAIN_DEFINITIONS.map(def => (
                    <KeyConcept key={def.label} label={def.label}>
                        {def.text}
                    </KeyConcept>
                ))}
                <CopyAllNotes
                    title="Signal Chain — Key Definitions (Section 2.4)"
                    notes={SIGNAL_CHAIN_DEFINITIONS}
                />
            </div>

            {/* Exam context */}
            <div style={{
                ...card,
                background: t.accent.infoLight,
                borderLeft: `4px solid ${t.accent.info}`,
            }}>
                <span style={{
                    ...sectionLabel,
                    color: t.accent.info,
                }}>
                    Why This Matters for the Exam
                </span>
                <p style={{
                    fontSize: typography.size.sm,
                    color: t.text.secondary,
                    lineHeight: typography.lineHeight.relaxed,
                }}>
                    Signal chain ordering questions appear regularly in Edexcel papers. You need to know
                    the <strong style={{ color: t.text.primary }}>seven-stage sequence</strong> and understand
                    that both filters are analogue and sit immediately either side of their
                    respective converter. Remember: a digital signal <strong style={{ color: t.text.primary }}>must
                    always</strong> be converted back to analogue before you can hear it.
                </p>
            </div>
        </div>
    );
}

// ─── Definitions Data ───────────────────────────────────────────
const SIGNAL_CHAIN_DEFINITIONS = [
    { label: 'Transducer', text: 'A device that converts energy from one form to another. A microphone converts acoustic energy to electrical energy. A speaker does the reverse.' },
    { label: 'Anti-Aliasing Filter', text: 'An analogue lowpass filter applied before the ADC to remove frequencies above the Nyquist frequency, preventing aliasing artefacts in the digital signal.' },
    { label: 'ADC (Analogue-to-Digital Converter)', text: 'Converts the analogue electrical signal into digital binary data through sampling and quantisation. Found in audio interfaces.' },
    { label: 'DAC (Digital-to-Analogue Converter)', text: 'Converts digital binary data back into a continuously varying analogue electrical signal for playback. Produces a stepped output that needs filtering.' },
    { label: 'Reconstruction Filter', text: 'An analogue lowpass filter placed after the DAC that smooths the stepped staircase output into a continuous waveform by removing high-frequency artefacts.' },
    { label: 'Signal Chain', text: 'The complete path audio travels: Acoustic sound > Microphone > Anti-aliasing filter > ADC > Digital processing > DAC > Reconstruction filter > Amplifier & Speakers > Acoustic sound.' },
];

// ─── KeyConcept (click-to-copy) ─────────────────────────────────
function KeyConcept({ children, label }) {
    const [copied, setCopied] = useState(false);
    const contentRef = useRef(null);

    const handleCopy = useCallback(async () => {
        const text = contentRef.current ? contentRef.current.innerText : '';
        if (!text) return;
        const formatted = label ? `${label}: ${text}` : text;
        try { await navigator.clipboard.writeText(formatted); } catch {}
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }, [label]);

    return (
        <div
            onClick={handleCopy}
            title="Click to copy this definition"
            style={{
                background: t.bg.elevated,
                border: `1px solid ${t.border.subtle}`,
                borderRadius: borderRadius.lg,
                padding: `${spacing[4]} ${spacing[5]}`,
                marginBottom: spacing[3],
                cursor: 'pointer',
                transition: `border-color ${transitions.fast} ${transitions.easing}`,
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing[3] }}>
                <div style={{ flex: 1 }}>
                    {label && (
                        <div style={{
                            fontSize: typography.size.sm, color: t.text.primary,
                            fontWeight: typography.weight.semibold, marginBottom: spacing[1],
                        }}>
                            {label}
                        </div>
                    )}
                    <div ref={contentRef} style={{
                        color: t.text.secondary, fontSize: typography.size.sm,
                        lineHeight: typography.lineHeight.relaxed,
                    }}>
                        {children}
                    </div>
                </div>
                <span style={{
                    flexShrink: 0,
                    background: copied ? '#059669' : t.bg.secondary,
                    color: copied ? '#FFFFFF' : t.text.tertiary,
                    fontSize: typography.size.xs,
                    fontWeight: typography.weight.medium,
                    padding: `${spacing[1]} ${spacing[3]}`,
                    borderRadius: borderRadius.full,
                    border: `1px solid ${copied ? '#059669' : t.border.subtle}`,
                    transition: `all ${transitions.fast} ${transitions.easing}`,
                    whiteSpace: 'nowrap',
                }}>
                    {copied ? 'Copied!' : 'Copy'}
                </span>
            </div>
        </div>
    );
}

function CopyAllNotes({ notes, title }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
        const text = (title ? `${title}\n${'─'.repeat(title.length)}\n\n` : '')
            + notes.map(n => `${n.label}: ${n.text}`).join('\n\n');
        try { await navigator.clipboard.writeText(text); } catch {}
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [notes, title]);

    return (
        <button
            onClick={handleCopy}
            style={{
                display: 'flex', alignItems: 'center', gap: spacing[2],
                width: '100%',
                background: copied ? '#059669' : t.text.primary,
                border: 'none',
                borderRadius: borderRadius.lg,
                padding: `${spacing[3]} ${spacing[5]}`,
                cursor: 'pointer',
                fontFamily: typography.fontFamily,
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semibold,
                color: '#FFFFFF',
                marginTop: spacing[4],
                transition: `all ${transitions.fast} ${transitions.easing}`,
                justifyContent: 'center',
            }}
        >
            {copied ? '\u2713 Copied to clipboard!' : '\uD83D\uDCCB Copy all definitions to notes'}
        </button>
    );
}
