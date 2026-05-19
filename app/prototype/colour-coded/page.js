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
    border: '#222235',
    borderSubtle: '#1a1a2d',
    lineColor: '#333348',
    iconBg: '#161625',
    iconBorder: '#252540',
    // AO colours
    ao3: '#06b6d4',         // cyan
    ao3Soft: 'rgba(6, 182, 212, 0.10)',
    ao3Border: 'rgba(6, 182, 212, 0.25)',
    ao4: '#DCC892',         // purple
    ao4Soft: 'rgba(167, 139, 250, 0.10)',
    ao4Border: 'rgba(167, 139, 250, 0.25)',
};

const font = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const mono = 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace';

const scaffoldPoints = [
    { ao: 3, verb: 'Define', text: 'compression and its role in controlling dynamic range', tip: 'Show technical understanding' },
    { ao: 3, verb: 'Explain', text: 'threshold, ratio, attack & release with practical examples', tip: 'Demonstrate applied knowledge' },
    { ao: 4, verb: 'Evaluate', text: 'creative vs corrective compression — when and why each is used', tip: 'Make a judgement with reasoning' },
    { ao: 4, verb: 'Compare', text: 'parallel compression to standard insert processing', tip: 'Weigh advantages and limitations' },
    { ao: 4, verb: 'Conclude', text: 'with impact on final mix balance and commercial loudness', tip: 'Synthesise your argument' },
];

const ao3Count = scaffoldPoints.filter(p => p.ao === 3).length;
const ao4Count = scaffoldPoints.filter(p => p.ao === 4).length;
const ao3Pct = Math.round((ao3Count / scaffoldPoints.length) * 100);
const ao4Pct = 100 - ao3Pct;

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

function AOBadge({ ao }) {
    const isAO3 = ao === 3;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: isAO3 ? C.ao3Soft : C.ao4Soft,
            color: isAO3 ? C.ao3 : C.ao4,
            fontSize: 10, fontWeight: 700,
            padding: '2px 8px', borderRadius: 6,
            border: `1px solid ${isAO3 ? C.ao3Border : C.ao4Border}`,
            fontFamily: mono, letterSpacing: '0.05em',
        }}>
            <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: isAO3 ? C.ao3 : C.ao4,
            }} />
            AO{ao}
        </span>
    );
}

export default function ColourCodedPrototype() {
    const [hoveredPoint, setHoveredPoint] = useState(null);

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
                        <span style={{ color: C.text }}>Colour-Coded </span>
                        <span style={{
                            background: 'linear-gradient(135deg, #06b6d4 0%, #DCC892 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>Assessment Objectives</span>
                    </h1>
                    <p style={{ fontSize: 15, lineHeight: 1.6, color: C.textSecondary }}>
                        Every scaffold point tagged by AO. See the balance between analysis and evaluation at a glance.
                    </p>
                </div>

                {/* AO Balance bar */}
                <div style={{ width: '100%', maxWidth: 400 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 10, height: 10, borderRadius: 3, background: C.ao3 }} />
                            <span style={{ fontSize: 13, color: C.ao3, fontWeight: 600 }}>AO3 — Analysis</span>
                            <span style={{ fontSize: 12, color: C.textMuted }}>({ao3Pct}%)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 12, color: C.textMuted }}>({ao4Pct}%)</span>
                            <span style={{ fontSize: 13, color: C.ao4, fontWeight: 600 }}>AO4 — Evaluation</span>
                            <span style={{ width: 10, height: 10, borderRadius: 3, background: C.ao4 }} />
                        </div>
                    </div>
                    <div style={{
                        height: 8, borderRadius: 4, overflow: 'hidden',
                        display: 'flex', background: C.bgInner,
                    }}>
                        <div style={{ width: `${ao3Pct}%`, background: C.ao3, transition: 'width 0.5s ease' }} />
                        <div style={{ width: `${ao4Pct}%`, background: C.ao4, transition: 'width 0.5s ease' }} />
                    </div>
                </div>

                {/* Card */}
                <div style={{ position: 'relative', width: '100%', maxWidth: 720, display: 'flex', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 0 }}>
                        <SideLabel icon="" label="Analyse" side="left" y={60} />
                        <SideLabel icon="" label="Apply" side="left" y={220} />
                        <SideLabel icon="" label="Technical" side="left" y={380} />
                    </div>

                    <BrowserCard title="essay-scaffold · ao-view">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            {/* LEFT — Question */}
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

                                {/* Legend */}
                                <div style={{
                                    background: C.bgInner, border: `1px solid ${C.border}`,
                                    borderRadius: 10, padding: 14, marginBottom: 14,
                                }}>
                                    <div style={{
                                        fontSize: 11, color: C.textMuted, textTransform: 'uppercase',
                                        letterSpacing: '0.1em', fontWeight: 600, marginBottom: 10,
                                    }}>Colour Key</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <AOBadge ao={3} />
                                            <span style={{ fontSize: 12, color: C.textSecondary }}>
                                                Analyse — show technical knowledge
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <AOBadge ao={4} />
                                            <span style={{ fontSize: 12, color: C.textSecondary }}>
                                                Evaluate — make reasoned judgements
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Tip */}
                                <div style={{
                                    background: C.bgInner, border: `1px solid ${C.border}`,
                                    borderRadius: 10, padding: 14,
                                }}>
                                    <div style={{ fontSize: 12, color: C.accent, fontWeight: 600, marginBottom: 4 }}>
                                         Examiner Tip
                                    </div>
                                    <div style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.5 }}>
                                        {hoveredPoint !== null
                                            ? scaffoldPoints[hoveredPoint].tip
                                            : 'Hover over a scaffold point to see what the examiner is looking for.'}
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
                                </div>

                                <div style={{
                                    background: C.bgInner, border: `1px solid ${C.border}`,
                                    borderRadius: 10, padding: 16,
                                    fontFamily: mono, fontSize: 12.5,
                                    lineHeight: 1.7, color: C.textSecondary,
                                    minHeight: 340,
                                }}>
                                    <div style={{ color: C.textMuted, marginBottom: 6 }}>---</div>
                                    <div><span style={{ color: C.accent }}>topic:</span> Dynamics Processing</div>
                                    <div><span style={{ color: C.accent }}>marks:</span> 10 (<span style={{ color: C.ao3 }}>AO3: 5</span>, <span style={{ color: C.ao4 }}>AO4: 5</span>)</div>
                                    <div style={{ color: C.textMuted, marginBottom: 10 }}>---</div>
                                    <div style={{ color: C.text, fontWeight: 700, marginBottom: 10 }}>## Structure</div>

                                    {scaffoldPoints.map((point, i) => {
                                        const isAO3 = point.ao === 3;
                                        const isHovered = hoveredPoint === i;
                                        return (
                                            <div
                                                key={i}
                                                onMouseEnter={() => setHoveredPoint(i)}
                                                onMouseLeave={() => setHoveredPoint(null)}
                                                style={{
                                                    marginBottom: 8,
                                                    padding: '6px 10px',
                                                    borderRadius: 8,
                                                    borderLeft: `3px solid ${isAO3 ? C.ao3 : C.ao4}`,
                                                    background: isHovered
                                                        ? (isAO3 ? C.ao3Soft : C.ao4Soft)
                                                        : 'transparent',
                                                    transition: 'background 0.2s ease',
                                                    cursor: 'default',
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                                    <AOBadge ao={point.ao} />
                                                    <span style={{ color: C.text, fontWeight: 600 }}>{i + 1}. {point.verb}</span>
                                                </div>
                                                <div style={{ paddingLeft: 2, fontSize: 12 }}>
                                                    {point.text}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </BrowserCard>

                    <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 0 }}>
                        <SideLabel icon="" label="Evaluate" side="right" y={60} />
                        <SideLabel icon="" label="Judge" side="right" y={220} />
                        <SideLabel icon="" label="Balance" side="right" y={380} />
                    </div>
                </div>
            </div>
        </div>
    );
}
