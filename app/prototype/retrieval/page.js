'use client';

import { useState } from 'react';
import Link from 'next/link';

const C = {
    bg: '#0b0b12',
    bgCard: '#13131e',
    bgInner: '#19192a',
    surface: '#1e1e30',
    text: '#e8e8f0',
    textSecondary: '#8888a0',
    textMuted: '#555568',
    accent: '#5b8def',
    accentSoft: 'rgba(91, 141, 239, 0.12)',
    green: '#34d399',
    greenSoft: 'rgba(52, 211, 153, 0.12)',
    amber: '#fbbf24',
    amberSoft: 'rgba(251, 191, 36, 0.12)',
    border: '#222235',
    borderSubtle: '#1a1a2d',
    lineColor: '#333348',
    iconBg: '#161625',
    iconBorder: '#252540',
};

const font = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const mono = 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace';

const scaffoldFull = [
    { verb: 'Define', text: 'compression and its role in controlling dynamic range' },
    { verb: 'Explain', text: 'threshold, ratio, attack & release with practical examples' },
    { verb: 'Evaluate', text: 'creative vs corrective compression — when and why each is used' },
    { verb: 'Compare', text: 'parallel compression to standard insert processing' },
    { verb: 'Conclude', text: 'with impact on final mix balance and commercial loudness' },
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
            background: C.bgCard, borderRadius: 16,
            border: `1px solid ${C.border}`, overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.02)',
            width: '100%',
        }}>
            <div style={{
                display: 'flex', alignItems: 'center',
                padding: '12px 16px',
                borderBottom: `1px solid ${C.borderSubtle}`, gap: 12,
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

export default function RetrievalPrototype() {
    const [revealed, setRevealed] = useState(false);
    const [attempt, setAttempt] = useState('');

    return (
        <div style={{
            minHeight: '100vh', background: C.bg,
            fontFamily: font, color: C.text,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '60px 40px',
        }}>
            <div style={{
                maxWidth: 1100, width: '100%',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 40,
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', maxWidth: 600 }}>
                    <Link href="/prototype" style={{
                        color: C.textMuted, textDecoration: 'none',
                        fontSize: 13, display: 'inline-block', marginBottom: 20,
                    }}>← Back to Prototypes</Link>
                    <h1 style={{
                        fontSize: 40, fontWeight: 700, lineHeight: 1.15,
                        marginBottom: 12, letterSpacing: '-0.02em',
                    }}>
                        <span style={{ color: C.text }}>Blank-First </span>
                        <span style={{
                            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>Retrieval</span>
                    </h1>
                    <p style={{ fontSize: 15, lineHeight: 1.6, color: C.textSecondary }}>
                        Try to plan the essay structure from memory first. Then reveal the scaffold to check your thinking.
                    </p>
                </div>

                {/* Card */}
                <div style={{ position: 'relative', width: '100%', maxWidth: 720, display: 'flex', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 0 }}>
                        <SideLabel icon="" label="Recall" side="left" y={60} />
                        <SideLabel icon="✍️" label="Attempt" side="left" y={220} />
                        <SideLabel icon="" label="Compare" side="left" y={380} />
                    </div>

                    <BrowserCard title="essay-scaffold · retrieval">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            {/* LEFT — Question + Student attempt */}
                            <div>
                                <div style={{
                                    color: C.textMuted, fontSize: 11,
                                    textTransform: 'uppercase', letterSpacing: '0.1em',
                                    fontWeight: 600, marginBottom: 10,
                                }}>Exam Question</div>
                                <div style={{
                                    background: C.bgInner, border: `1px solid ${C.border}`,
                                    borderRadius: 10, padding: 16,
                                    marginBottom: 14,
                                }}>
                                    <p style={{ color: C.text, fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                                        Evaluate the use of dynamics processing in the production of a modern pop track.
                                    </p>
                                </div>

                                {/* Student attempt area */}
                                <div style={{
                                    color: C.textMuted, fontSize: 11,
                                    textTransform: 'uppercase', letterSpacing: '0.1em',
                                    fontWeight: 600, marginBottom: 8,
                                }}>Your Plan</div>
                                <div style={{ position: 'relative' }}>
                                    <textarea
                                        value={attempt}
                                        onChange={(e) => setAttempt(e.target.value)}
                                        placeholder="How would you structure this essay? List your key points before revealing the scaffold..."
                                        style={{
                                            width: '100%',
                                            minHeight: 180,
                                            background: C.bgInner,
                                            border: `1px solid ${attempt ? 'rgba(251,191,36,0.3)' : C.border}`,
                                            borderRadius: 10,
                                            padding: 14,
                                            color: C.text,
                                            fontSize: 13,
                                            fontFamily: font,
                                            lineHeight: 1.6,
                                            resize: 'vertical',
                                            outline: 'none',
                                            transition: 'border-color 0.3s ease',
                                            boxSizing: 'border-box',
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = 'rgba(251,191,36,0.5)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = attempt ? 'rgba(251,191,36,0.3)' : C.border;
                                        }}
                                    />
                                    {attempt.length > 0 && (
                                        <div style={{
                                            position: 'absolute', bottom: 10, right: 10,
                                            fontSize: 11, color: C.textMuted,
                                        }}>
                                            {attempt.length} chars
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* RIGHT — Hidden / Revealed scaffold */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                    <span style={{
                                        color: C.textMuted, fontSize: 11,
                                        textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600,
                                    }}>Scaffold</span>
                                    <span style={{
                                        background: revealed ? C.greenSoft : C.amberSoft,
                                        color: revealed ? C.green : C.amber,
                                        fontSize: 11, fontWeight: 600,
                                        padding: '3px 10px', borderRadius: 20,
                                        border: `1px solid ${revealed ? 'rgba(52,211,153,0.2)' : 'rgba(251,191,36,0.2)'}`,
                                    }}>
                                        {revealed ? 'Revealed' : 'Hidden'}
                                    </span>
                                </div>

                                <div style={{
                                    background: C.bgInner,
                                    border: `1px solid ${C.border}`,
                                    borderRadius: 10,
                                    padding: 16,
                                    fontFamily: mono,
                                    fontSize: 12.5,
                                    lineHeight: 1.7,
                                    color: C.textSecondary,
                                    minHeight: 320,
                                    position: 'relative',
                                    overflow: 'hidden',
                                }}>
                                    {/* Scaffold content — always rendered, blurred when hidden */}
                                    <div style={{
                                        filter: revealed ? 'none' : 'blur(8px)',
                                        transition: 'filter 0.6s ease',
                                        userSelect: revealed ? 'auto' : 'none',
                                    }}>
                                        <div style={{ color: C.textMuted, marginBottom: 6 }}>---</div>
                                        <div><span style={{ color: C.accent }}>topic:</span> Dynamics Processing</div>
                                        <div><span style={{ color: C.accent }}>marks:</span> 10 (AO3: 5, AO4: 5)</div>
                                        <div style={{ color: C.textMuted, marginBottom: 10 }}>---</div>
                                        <div style={{ color: C.text, fontWeight: 700, marginBottom: 8 }}>## Structure</div>
                                        {scaffoldFull.map((point, i) => (
                                            <div key={i} style={{ marginBottom: 6 }}>
                                                {i + 1}. <span style={{ color: C.text, fontWeight: 600 }}>{point.verb}</span>{' '}
                                                {point.text}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Overlay when hidden */}
                                    {!revealed && (
                                        <div style={{
                                            position: 'absolute',
                                            inset: 0,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 16,
                                            background: 'rgba(25, 25, 42, 0.4)',
                                        }}>
                                            <div style={{
                                                fontSize: 40, marginBottom: 4,
                                            }}></div>
                                            <div style={{
                                                fontSize: 14, color: C.text, fontWeight: 600,
                                                fontFamily: font, textAlign: 'center',
                                            }}>
                                                Write your plan first
                                            </div>
                                            <div style={{
                                                fontSize: 12, color: C.textSecondary,
                                                fontFamily: font, textAlign: 'center',
                                                maxWidth: 200, lineHeight: 1.5,
                                            }}>
                                                Attempting from memory before checking strengthens your recall
                                            </div>
                                            <button
                                                onClick={() => setRevealed(true)}
                                                style={{
                                                    background: attempt.length > 20
                                                        ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
                                                        : C.surface,
                                                    color: attempt.length > 20 ? '#0b0b12' : C.textMuted,
                                                    border: attempt.length > 20
                                                        ? 'none'
                                                        : `1px solid ${C.border}`,
                                                    borderRadius: 10,
                                                    padding: '10px 24px',
                                                    fontSize: 14,
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    fontFamily: font,
                                                    transition: 'all 0.3s ease',
                                                    boxShadow: attempt.length > 20
                                                        ? '0 0 20px rgba(251,191,36,0.3)'
                                                        : 'none',
                                                }}
                                            >
                                                {attempt.length > 20 ? 'Reveal Scaffold' : 'Reveal (try writing first)'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Post-reveal comparison prompt */}
                                {revealed && attempt.length > 0 && (
                                    <div style={{
                                        marginTop: 14,
                                        background: C.greenSoft,
                                        border: `1px solid rgba(52,211,153,0.2)`,
                                        borderRadius: 10,
                                        padding: 14,
                                    }}>
                                        <div style={{ fontSize: 13, color: C.green, fontWeight: 600, marginBottom: 4 }}>
                                            ✓ Now compare
                                        </div>
                                        <div style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.5 }}>
                                            Look at your plan on the left and the scaffold on the right. What did you remember? What did you miss? The gaps are where to focus your revision.
                                        </div>
                                    </div>
                                )}

                                {/* Reset button */}
                                {revealed && (
                                    <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                                        <button
                                            onClick={() => { setRevealed(false); setAttempt(''); }}
                                            style={{
                                                background: C.surface,
                                                border: `1px solid ${C.border}`,
                                                borderRadius: 8, padding: '7px 14px',
                                                fontSize: 12, color: C.textSecondary,
                                                fontFamily: font, cursor: 'pointer',
                                            }}
                                        >
                                            ⟳ Try Again
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </BrowserCard>

                    <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 0 }}>
                        <SideLabel icon="" label="Reveal" side="right" y={60} />
                        <SideLabel icon="" label="Check" side="right" y={220} />
                        <SideLabel icon="" label="Improve" side="right" y={380} />
                    </div>
                </div>
            </div>
        </div>
    );
}
