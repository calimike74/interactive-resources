'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

const C = {
    bg: '#0b0b12',
    bgCard: '#13131e',
    bgInner: '#19192a',
    surface: '#1e1e30',
    surfaceHover: '#252540',
    text: '#e8e8f0',
    textSecondary: '#8888a0',
    textMuted: '#555568',
    accent: '#5b8def',
    accentSoft: 'rgba(91, 141, 239, 0.12)',
    green: '#34d399',
    greenSoft: 'rgba(52, 211, 153, 0.12)',
    border: '#222235',
    borderSubtle: '#1a1a2d',
    lineColor: '#333348',
    iconBg: '#161625',
    iconBorder: '#252540',
};

const font = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const mono = 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace';

const LEVELS = [
    { key: 'full', label: 'Full', icon: '' },
    { key: 'partial', label: 'Partial', icon: '' },
    { key: 'minimal', label: 'Minimal', icon: '' },
];

const scaffoldPoints = [
    {
        verb: 'Define',
        full: 'compression and its role in controlling dynamic range',
        partial: 'compression and its role in _____',
        minimal: '',
    },
    {
        verb: 'Explain',
        full: 'threshold, ratio, attack & release with practical examples',
        partial: 'threshold, ratio, _____ & _____ with practical examples',
        minimal: '',
    },
    {
        verb: 'Evaluate',
        full: 'creative vs corrective compression — when and why each is used',
        partial: null,
        minimal: '',
    },
    {
        verb: 'Compare',
        full: 'parallel compression to standard insert processing',
        partial: null,
        minimal: '',
    },
    {
        verb: 'Conclude',
        full: 'with impact on final mix balance and commercial loudness',
        partial: 'with impact on _____',
        minimal: '',
    },
];

function SideLabel({ icon, label, side = 'left', lineWidth = 55, y = 0 }) {
    const [hovered, setHovered] = useState(false);
    const isLeft = side === 'left';
    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex', alignItems: 'center', gap: 0,
                flexDirection: isLeft ? 'row' : 'row-reverse',
                position: 'absolute', top: y,
                [isLeft ? 'right' : 'left']: '100%',
                cursor: 'default',
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: hovered
                        ? 'linear-gradient(145deg, rgba(91,141,239,0.15), rgba(91,141,239,0.06))'
                        : `linear-gradient(145deg, ${C.iconBg}, #101018)`,
                    border: `1px solid ${hovered ? 'rgba(91,141,239,0.4)' : C.iconBorder}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: hovered
                        ? '0 0 20px rgba(91,141,239,0.2), inset 0 1px 1px rgba(255,255,255,0.05)'
                        : 'inset 0 1px 1px rgba(255,255,255,0.03), 0 2px 8px rgba(0,0,0,0.3)',
                }}>
                    <span style={{
                        fontSize: 22, lineHeight: 1,
                        transition: 'all 0.3s ease',
                        transform: hovered ? 'scale(1.08)' : 'scale(1)',
                        filter: hovered ? 'brightness(1.2)' : 'brightness(0.85)',
                    }}>{icon}</span>
                </div>
                <div style={{
                    color: hovered ? C.text : C.textMuted,
                    fontSize: 11, fontFamily: font, fontWeight: 500,
                    whiteSpace: 'nowrap', textAlign: 'center',
                    transition: 'color 0.3s ease',
                }}>{label}</div>
            </div>
            <svg width={lineWidth} height={3} style={{
                flexShrink: 0,
                [isLeft ? 'marginLeft' : 'marginRight']: 8,
                marginBottom: 24,
            }}>
                <line x1={0} y1={1.5} x2={lineWidth} y2={1.5}
                    stroke={hovered ? C.accent : C.lineColor}
                    strokeWidth={2} strokeLinecap="round"
                    style={{ transition: 'stroke 0.3s ease' }}
                />
            </svg>
        </div>
    );
}

function BrowserCard({ children, title = '' }) {
    return (
        <div style={{
            background: C.bgCard,
            borderRadius: 16,
            border: `1px solid ${C.border}`,
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.02)',
            width: '100%',
        }}>
            <div style={{
                display: 'flex', alignItems: 'center',
                padding: '12px 16px',
                borderBottom: `1px solid ${C.borderSubtle}`,
                gap: 12,
            }}>
                <div style={{ display: 'flex', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
                </div>
                {title && (
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                        <div style={{
                            background: C.surface, borderRadius: 8,
                            padding: '5px 20px', fontSize: 12,
                            fontFamily: mono, color: C.textMuted,
                            border: `1px solid ${C.borderSubtle}`,
                        }}>{title}</div>
                    </div>
                )}
                <div style={{ width: 50 }} />
            </div>
            <div style={{ padding: 24 }}>{children}</div>
        </div>
    );
}

export default function LevelsPrototype() {
    const [activeLevel, setActiveLevel] = useState('full');
    const [pillStyle, setPillStyle] = useState({});
    const tabRefs = useRef({});

    useEffect(() => {
        const el = tabRefs.current[activeLevel];
        if (el) {
            setPillStyle({
                left: el.offsetLeft,
                width: el.offsetWidth,
            });
        }
    }, [activeLevel]);

    return (
        <div style={{
            minHeight: '100vh',
            background: C.bg,
            fontFamily: font,
            color: C.text,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 40px',
        }}>
            <div style={{
                maxWidth: 1100, width: '100%',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 40,
            }}>
                {/* Back + Title */}
                <div style={{ textAlign: 'center', maxWidth: 600 }}>
                    <Link href="/prototype" style={{
                        color: C.textMuted, textDecoration: 'none',
                        fontSize: 13, display: 'inline-block', marginBottom: 20,
                    }}>← Back to Prototypes</Link>
                    <h1 style={{
                        fontSize: 40, fontWeight: 700, lineHeight: 1.15,
                        marginBottom: 12, letterSpacing: '-0.02em',
                    }}>
                        <span style={{ color: C.text }}>Faded </span>
                        <span style={{
                            background: 'linear-gradient(135deg, #34d399 0%, #5b8def 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>Scaffold Levels</span>
                    </h1>
                    <p style={{ fontSize: 15, lineHeight: 1.6, color: C.textSecondary }}>
                        Progress from a complete worked example to building your own essay structure independently.
                    </p>
                </div>

                {/* Level tabs — sliding pill */}
                <div style={{
                    position: 'relative',
                    display: 'inline-flex',
                    background: C.bgInner,
                    borderRadius: 12,
                    padding: 4,
                    border: `1px solid ${C.border}`,
                }}>
                    {/* Sliding pill */}
                    <div style={{
                        position: 'absolute',
                        top: 4,
                        height: 'calc(100% - 8px)',
                        background: C.accent,
                        borderRadius: 9,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        ...pillStyle,
                    }} />
                    {LEVELS.map((level) => (
                        <button
                            key={level.key}
                            ref={(el) => { tabRefs.current[level.key] = el; }}
                            onClick={() => setActiveLevel(level.key)}
                            style={{
                                position: 'relative', zIndex: 1,
                                background: 'transparent',
                                border: 'none', borderRadius: 9,
                                padding: '8px 24px',
                                fontSize: 14, fontWeight: 600,
                                fontFamily: font,
                                color: activeLevel === level.key ? '#fff' : C.textMuted,
                                cursor: 'pointer',
                                transition: 'color 0.3s ease',
                                display: 'flex', alignItems: 'center', gap: 8,
                            }}
                        >
                            <span>{level.icon}</span>
                            {level.label}
                        </button>
                    ))}
                </div>

                {/* Card with side icons */}
                <div style={{ position: 'relative', width: '100%', maxWidth: 720, display: 'flex', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 0 }}>
                        <SideLabel icon="❓" label="Question" side="left" y={60} />
                        <SideLabel icon="" label="Focus" side="left" y={210} />
                        <SideLabel icon="" label="Plan" side="left" y={360} />
                    </div>

                    <BrowserCard title="essay-scaffold">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            {/* LEFT — Question */}
                            <div>
                                <div style={{
                                    color: C.textMuted, fontSize: 11,
                                    textTransform: 'uppercase', letterSpacing: '0.1em',
                                    fontWeight: 600, marginBottom: 10,
                                }}>Exam Question</div>
                                <div style={{
                                    background: C.bgInner,
                                    border: `1px solid ${C.border}`,
                                    borderRadius: 10, padding: 16,
                                    minHeight: 100, marginBottom: 14,
                                }}>
                                    <p style={{ color: C.text, fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                                        Evaluate the use of dynamics processing in the production of a modern pop track.
                                    </p>
                                </div>

                                <div style={{
                                    background: C.bgInner,
                                    border: `1px solid ${C.border}`,
                                    borderRadius: 10, padding: 14,
                                    marginBottom: 14,
                                }}>
                                    <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 8 }}>
                                        Mark Allocation
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <span style={{ background: C.accentSoft, color: C.accent, fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 8 }}>
                                            AO3: 5 marks
                                        </span>
                                        <span style={{ background: C.accentSoft, color: C.accent, fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 8 }}>
                                            AO4: 5 marks
                                        </span>
                                    </div>
                                </div>

                                {/* Level indicator */}
                                <div style={{
                                    background: C.greenSoft,
                                    border: `1px solid rgba(52,211,153,0.2)`,
                                    borderRadius: 10, padding: 14,
                                }}>
                                    <div style={{ fontSize: 13, color: C.green, fontWeight: 600, marginBottom: 4 }}>
                                        {activeLevel === 'full' && 'Full Scaffold — Study the structure'}
                                        {activeLevel === 'partial' && 'Partial Scaffold — Fill the gaps'}
                                        {activeLevel === 'minimal' && 'Minimal Scaffold — Build it yourself'}
                                    </div>
                                    <div style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.5 }}>
                                        {activeLevel === 'full' && 'Read through the complete scaffold. Understand why each point is included and in this order.'}
                                        {activeLevel === 'partial' && 'Some points are complete, others have blanks. Fill in the missing content from memory.'}
                                        {activeLevel === 'minimal' && 'Only the command words are given. Write your own content for each point.'}
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT — Scaffold */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                    <span style={{
                                        color: C.textMuted, fontSize: 11,
                                        textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600,
                                    }}>Scaffold</span>
                                    <span style={{
                                        background: activeLevel === 'full' ? C.greenSoft : activeLevel === 'partial' ? C.accentSoft : 'rgba(251,191,36,0.12)',
                                        color: activeLevel === 'full' ? C.green : activeLevel === 'partial' ? C.accent : '#fbbf24',
                                        fontSize: 11, fontWeight: 600,
                                        padding: '3px 10px', borderRadius: 20,
                                        border: `1px solid ${activeLevel === 'full' ? 'rgba(52,211,153,0.2)' : activeLevel === 'partial' ? 'rgba(91,141,239,0.2)' : 'rgba(251,191,36,0.2)'}`,
                                    }}>
                                        {activeLevel === 'full' ? 'Complete' : activeLevel === 'partial' ? 'Gaps to fill' : 'Your turn'}
                                    </span>
                                </div>

                                <div style={{
                                    background: C.bgInner,
                                    border: `1px solid ${C.border}`,
                                    borderRadius: 10, padding: 16,
                                    fontFamily: mono, fontSize: 12.5,
                                    lineHeight: 1.7, color: C.textSecondary,
                                    minHeight: 320,
                                }}>
                                    <div style={{ color: C.textMuted, marginBottom: 6 }}>---</div>
                                    <div><span style={{ color: C.accent }}>topic:</span> Dynamics Processing</div>
                                    <div><span style={{ color: C.accent }}>marks:</span> 10 (AO3: 5, AO4: 5)</div>
                                    <div style={{ color: C.textMuted, marginBottom: 10 }}>---</div>
                                    <div style={{ color: C.text, fontWeight: 700, marginBottom: 8 }}>## Structure</div>

                                    {scaffoldPoints.map((point, i) => {
                                        let content;
                                        if (activeLevel === 'full') {
                                            content = point.full;
                                        } else if (activeLevel === 'partial') {
                                            content = point.partial !== null ? point.partial : (
                                                <span style={{
                                                    display: 'inline-block',
                                                    background: 'rgba(91,141,239,0.08)',
                                                    border: `1px dashed rgba(91,141,239,0.3)`,
                                                    borderRadius: 6,
                                                    padding: '2px 12px',
                                                    color: C.accent,
                                                    fontSize: 11,
                                                    fontStyle: 'italic',
                                                }}>what goes here?</span>
                                            );
                                        } else {
                                            content = (
                                                <span style={{
                                                    display: 'inline-block',
                                                    background: 'rgba(251,191,36,0.06)',
                                                    border: `1px dashed rgba(251,191,36,0.25)`,
                                                    borderRadius: 6,
                                                    padding: '2px 40px',
                                                    minWidth: 180,
                                                }}>&nbsp;</span>
                                            );
                                        }

                                        const blankInText = activeLevel === 'partial' && typeof content === 'string' && content.includes('_____');

                                        return (
                                            <div key={i} style={{ marginBottom: 6 }}>
                                                {i + 1}. <span style={{ color: C.text, fontWeight: 600 }}>{point.verb}</span>{' '}
                                                {blankInText ? (
                                                    <span>
                                                        {content.split('_____').map((part, j, arr) => (
                                                            <span key={j}>
                                                                {part}
                                                                {j < arr.length - 1 && (
                                                                    <span style={{
                                                                        display: 'inline-block',
                                                                        background: 'rgba(91,141,239,0.08)',
                                                                        border: `1px dashed rgba(91,141,239,0.3)`,
                                                                        borderRadius: 4,
                                                                        padding: '1px 16px',
                                                                        margin: '0 2px',
                                                                        color: C.accent,
                                                                        fontSize: 11,
                                                                    }}>?</span>
                                                                )}
                                                            </span>
                                                        ))}
                                                    </span>
                                                ) : content}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Progress bar */}
                                <div style={{ marginTop: 14 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <span style={{ fontSize: 11, color: C.textMuted }}>Independence</span>
                                        <span style={{ fontSize: 11, color: C.textMuted }}>
                                            {activeLevel === 'full' ? 'Guided' : activeLevel === 'partial' ? 'Supported' : 'Independent'}
                                        </span>
                                    </div>
                                    <div style={{
                                        height: 4, borderRadius: 2,
                                        background: C.bgInner,
                                    }}>
                                        <div style={{
                                            height: '100%', borderRadius: 2,
                                            background: activeLevel === 'full' ? C.green : activeLevel === 'partial' ? C.accent : '#fbbf24',
                                            width: activeLevel === 'full' ? '33%' : activeLevel === 'partial' ? '66%' : '100%',
                                            transition: 'all 0.5s ease',
                                        }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </BrowserCard>

                    <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 0 }}>
                        <SideLabel icon="" label="AO3" side="right" y={60} />
                        <SideLabel icon="⚖️" label="AO4" side="right" y={210} />
                        <SideLabel icon="" label="Marks" side="right" y={360} />
                    </div>
                </div>
            </div>
        </div>
    );
}
