'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// ─── Design Tokens ───────────────────────────────────────────────────────────

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
    amber: '#fbbf24',
    amberSoft: 'rgba(251, 191, 36, 0.12)',
    purple: '#DCC892',
    purpleSoft: 'rgba(167, 139, 250, 0.12)',
    border: '#222235',
    borderSubtle: '#1a1a2d',
    lineColor: '#333348',
    iconBg: '#161625',
    iconBorder: '#252540',
    // AO colours
    ao3: '#06b6d4',
    ao3Soft: 'rgba(6, 182, 212, 0.10)',
    ao3Border: 'rgba(6, 182, 212, 0.25)',
    ao4: '#DCC892',
    ao4Soft: 'rgba(167, 139, 250, 0.10)',
    ao4Border: 'rgba(167, 139, 250, 0.25)',
};

const font = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const mono = 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace';

const TABS = [
    { key: 'understand', label: 'Understand', icon: '' },
    { key: 'practice', label: 'Practice', icon: '' },
    { key: 'test', label: 'Test', icon: '' },
];

// ─── Shared scaffold data ────────────────────────────────────────────────────

const scaffoldPoints = [
    { ao: 3, verb: 'Define', full: 'compression and its role in controlling dynamic range', partial: 'compression and its role in _____', tip: 'Show technical understanding' },
    { ao: 3, verb: 'Explain', full: 'threshold, ratio, attack & release with practical examples', partial: 'threshold, ratio, _____ & _____ with practical examples', tip: 'Demonstrate applied knowledge' },
    { ao: 4, verb: 'Evaluate', full: 'creative vs corrective compression — when and why each is used', partial: null, tip: 'Make a judgement with reasoning' },
    { ao: 4, verb: 'Compare', full: 'parallel compression to standard insert processing', partial: null, tip: 'Weigh advantages and limitations' },
    { ao: 4, verb: 'Conclude', full: 'with impact on final mix balance and commercial loudness', partial: 'with impact on _____', tip: 'Synthesise your argument' },
];

const ao3Count = scaffoldPoints.filter(p => p.ao === 3).length;
const ao4Count = scaffoldPoints.filter(p => p.ao === 4).length;
const ao3Pct = Math.round((ao3Count / scaffoldPoints.length) * 100);
const ao4Pct = 100 - ao3Pct;

const LEVELS = [
    { key: 'full', label: 'Full', icon: '' },
    { key: 'partial', label: 'Partial', icon: '' },
    { key: 'minimal', label: 'Minimal', icon: '' },
];

// ─── SideLabel ───────────────────────────────────────────────────────────────

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

// ─── BrowserCard ─────────────────────────────────────────────────────────────

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

// ─── AO Badge ────────────────────────────────────────────────────────────────

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
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: isAO3 ? C.ao3 : C.ao4 }} />
            AO{ao}
        </span>
    );
}

// ─── Question Panel (shared left side) ───────────────────────────────────────

function QuestionPanel() {
    return (
        <div>
            <div style={{
                color: C.textMuted, fontSize: 11,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                fontWeight: 600, marginBottom: 10,
            }}>Exam Question</div>
            <div style={{
                background: C.bgInner, border: `1px solid ${C.border}`,
                borderRadius: 10, padding: 16, marginBottom: 14,
            }}>
                <p style={{ color: C.text, fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                    Evaluate the use of dynamics processing in the production of a modern pop track.
                </p>
            </div>
            <div style={{
                background: C.bgInner, border: `1px solid ${C.border}`,
                borderRadius: 10, padding: 14,
            }}>
                <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 8 }}>
                    Mark Allocation
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ background: C.accentSoft, color: C.accent, fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 8 }}>AO3: 5 marks</span>
                    <span style={{ background: C.accentSoft, color: C.accent, fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 8 }}>AO4: 5 marks</span>
                </div>
            </div>
        </div>
    );
}

// ─── Tab 1: Understand (Colour-Coded AOs) ────────────────────────────────────

function UnderstandTab() {
    const [hoveredPoint, setHoveredPoint] = useState(null);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
                <QuestionPanel />

                {/* Colour key */}
                <div style={{
                    background: C.bgInner, border: `1px solid ${C.border}`,
                    borderRadius: 10, padding: 14, marginTop: 14,
                }}>
                    <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 10 }}>
                        Colour Key
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <AOBadge ao={3} />
                            <span style={{ fontSize: 12, color: C.textSecondary }}>Analyse — show technical knowledge</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <AOBadge ao={4} />
                            <span style={{ fontSize: 12, color: C.textSecondary }}>Evaluate — make reasoned judgements</span>
                        </div>
                    </div>
                </div>

                {/* Examiner tip */}
                <div style={{
                    background: C.bgInner, border: `1px solid ${C.border}`,
                    borderRadius: 10, padding: 14, marginTop: 14,
                }}>
                    <div style={{ fontSize: 12, color: C.accent, fontWeight: 600, marginBottom: 4 }}>Examiner Tip</div>
                    <div style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.5 }}>
                        {hoveredPoint !== null
                            ? scaffoldPoints[hoveredPoint].tip
                            : 'Hover over a scaffold point to see what the examiner is looking for.'}
                    </div>
                </div>
            </div>

            <div>
                {/* AO Balance bar */}
                <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ width: 8, height: 8, borderRadius: 2, background: C.ao3 }} />
                            <span style={{ fontSize: 11, color: C.ao3, fontWeight: 600 }}>AO3</span>
                            <span style={{ fontSize: 10, color: C.textMuted }}>({ao3Pct}%)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ fontSize: 10, color: C.textMuted }}>({ao4Pct}%)</span>
                            <span style={{ fontSize: 11, color: C.ao4, fontWeight: 600 }}>AO4</span>
                            <span style={{ width: 8, height: 8, borderRadius: 2, background: C.ao4 }} />
                        </div>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, overflow: 'hidden', display: 'flex', background: C.bgInner }}>
                        <div style={{ width: `${ao3Pct}%`, background: C.ao3 }} />
                        <div style={{ width: `${ao4Pct}%`, background: C.ao4 }} />
                    </div>
                </div>

                {/* Scaffold with colour-coded points */}
                <div style={{
                    background: C.bgInner, border: `1px solid ${C.border}`,
                    borderRadius: 10, padding: 16,
                    fontFamily: mono, fontSize: 12.5,
                    lineHeight: 1.7, color: C.textSecondary,
                    minHeight: 320,
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
                                    marginBottom: 8, padding: '6px 10px', borderRadius: 8,
                                    borderLeft: `3px solid ${isAO3 ? C.ao3 : C.ao4}`,
                                    background: isHovered ? (isAO3 ? C.ao3Soft : C.ao4Soft) : 'transparent',
                                    transition: 'background 0.2s ease', cursor: 'default',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                    <AOBadge ao={point.ao} />
                                    <span style={{ color: C.text, fontWeight: 600 }}>{i + 1}. {point.verb}</span>
                                </div>
                                <div style={{ paddingLeft: 2, fontSize: 12 }}>{point.full}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ─── Tab 2: Practice (Faded Levels) ──────────────────────────────────────────

function PracticeTab() {
    const [activeLevel, setActiveLevel] = useState('full');
    const levelTabListRef = useRef(null);
    const levelTabBtnRefs = useRef({});
    const [levelIndicator, setLevelIndicator] = useState({ x: 0, width: 0, ready: false });

    useEffect(() => {
        const list = levelTabListRef.current;
        const btn = levelTabBtnRefs.current[activeLevel];
        if (!list || !btn) return;
        const listRect = list.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();
        setLevelIndicator({ x: btnRect.left - listRect.left, width: btnRect.width, ready: true });
    }, [activeLevel]);

    useEffect(() => {
        const handler = () => {
            const list = levelTabListRef.current;
            const btn = levelTabBtnRefs.current[activeLevel];
            if (!list || !btn) return;
            const listRect = list.getBoundingClientRect();
            const btnRect = btn.getBoundingClientRect();
            setLevelIndicator({ x: btnRect.left - listRect.left, width: btnRect.width, ready: true });
        };
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, [activeLevel]);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
                <QuestionPanel />

                {/* Level info */}
                <div style={{
                    background: C.greenSoft,
                    border: `1px solid rgba(52,211,153,0.2)`,
                    borderRadius: 10, padding: 14, marginTop: 14,
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

            <div>
                {/* Sub-level tabs — sliding pill */}
                <div style={{ marginBottom: 12 }}>
                    <div
                        ref={levelTabListRef}
                        style={{
                            display: 'inline-flex', position: 'relative',
                            background: C.bgInner, borderRadius: 100,
                            padding: 4, border: `1px solid ${C.border}`,
                        }}
                    >
                        <div style={{
                            position: 'absolute', top: 4, bottom: 4, left: 4,
                            background: C.accent, borderRadius: 100,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                            zIndex: 1,
                            width: levelIndicator.width ? `${levelIndicator.width}px` : 'auto',
                            transform: `translateX(${levelIndicator.x}px)`,
                            transition: levelIndicator.ready
                                ? 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                : 'none',
                            willChange: 'transform, width',
                        }} />
                        {LEVELS.map((level) => (
                            <button
                                key={level.key}
                                ref={el => { levelTabBtnRefs.current[level.key] = el; }}
                                onClick={() => setActiveLevel(level.key)}
                                style={{
                                    position: 'relative', zIndex: 2,
                                    background: 'transparent', border: 'none', borderRadius: 100,
                                    padding: '6px 18px', fontSize: 13, fontWeight: 600,
                                    fontFamily: font,
                                    color: activeLevel === level.key ? '#fff' : C.textMuted,
                                    cursor: 'pointer', transition: 'color 0.3s ease',
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    whiteSpace: 'nowrap', userSelect: 'none',
                                    WebkitTapHighlightColor: 'transparent',
                                }}
                            >
                                <span style={{ fontSize: 14 }}>{level.icon}</span>
                                {level.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Scaffold */}
                <div style={{
                    background: C.bgInner, border: `1px solid ${C.border}`,
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
                                    borderRadius: 6, padding: '2px 12px',
                                    color: C.accent, fontSize: 11, fontStyle: 'italic',
                                }}>what goes here?</span>
                            );
                        } else {
                            content = (
                                <span style={{
                                    display: 'inline-block',
                                    background: 'rgba(251,191,36,0.06)',
                                    border: `1px dashed rgba(251,191,36,0.25)`,
                                    borderRadius: 6, padding: '2px 40px', minWidth: 180,
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
                                                        borderRadius: 4, padding: '1px 16px', margin: '0 2px',
                                                        color: C.accent, fontSize: 11,
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

                {/* Independence meter */}
                <div style={{ marginTop: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: C.textMuted }}>Independence</span>
                        <span style={{ fontSize: 11, color: C.textMuted }}>
                            {activeLevel === 'full' ? 'Guided' : activeLevel === 'partial' ? 'Supported' : 'Independent'}
                        </span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: C.bgInner }}>
                        <div style={{
                            height: '100%', borderRadius: 2,
                            background: activeLevel === 'full' ? C.green : activeLevel === 'partial' ? C.accent : C.amber,
                            width: activeLevel === 'full' ? '33%' : activeLevel === 'partial' ? '66%' : '100%',
                            transition: 'all 0.5s ease',
                        }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Tab 3: Test (Retrieval) ─────────────────────────────────────────────────

function TestTab() {
    const [revealed, setRevealed] = useState(false);
    const [attempt, setAttempt] = useState('');

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
                <QuestionPanel />

                {/* Student attempt area */}
                <div style={{ marginTop: 14 }}>
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
                                width: '100%', minHeight: 160,
                                background: C.bgInner,
                                border: `1px solid ${attempt ? 'rgba(251,191,36,0.3)' : C.border}`,
                                borderRadius: 10, padding: 14,
                                color: C.text, fontSize: 13, fontFamily: font,
                                lineHeight: 1.6, resize: 'vertical', outline: 'none',
                                transition: 'border-color 0.3s ease',
                                boxSizing: 'border-box',
                            }}
                            onFocus={(e) => { e.target.style.borderColor = 'rgba(251,191,36,0.5)'; }}
                            onBlur={(e) => { e.target.style.borderColor = attempt ? 'rgba(251,191,36,0.3)' : C.border; }}
                        />
                        {attempt.length > 0 && (
                            <div style={{ position: 'absolute', bottom: 10, right: 10, fontSize: 11, color: C.textMuted }}>
                                {attempt.length} chars
                            </div>
                        )}
                    </div>
                </div>
            </div>

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
                    background: C.bgInner, border: `1px solid ${C.border}`,
                    borderRadius: 10, padding: 16,
                    fontFamily: mono, fontSize: 12.5,
                    lineHeight: 1.7, color: C.textSecondary,
                    minHeight: 320, position: 'relative', overflow: 'hidden',
                }}>
                    {/* Scaffold — blurred when hidden */}
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
                        {scaffoldPoints.map((point, i) => (
                            <div key={i} style={{ marginBottom: 6 }}>
                                {i + 1}. <span style={{ color: C.text, fontWeight: 600 }}>{point.verb}</span>{' '}
                                {point.full}
                            </div>
                        ))}
                    </div>

                    {/* Lock overlay */}
                    {!revealed && (
                        <div style={{
                            position: 'absolute', inset: 0,
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', gap: 14,
                            background: 'rgba(25, 25, 42, 0.4)',
                        }}>
                            <div style={{ fontSize: 36 }}></div>
                            <div style={{ fontSize: 14, color: C.text, fontWeight: 600, fontFamily: font, textAlign: 'center' }}>
                                Write your plan first
                            </div>
                            <div style={{ fontSize: 12, color: C.textSecondary, fontFamily: font, textAlign: 'center', maxWidth: 200, lineHeight: 1.5 }}>
                                Attempting from memory before checking strengthens your recall
                            </div>
                            <button
                                onClick={() => setRevealed(true)}
                                style={{
                                    background: attempt.length > 20
                                        ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : C.surface,
                                    color: attempt.length > 20 ? '#0b0b12' : C.textMuted,
                                    border: attempt.length > 20 ? 'none' : `1px solid ${C.border}`,
                                    borderRadius: 10, padding: '10px 24px',
                                    fontSize: 14, fontWeight: 600,
                                    cursor: 'pointer', fontFamily: font,
                                    transition: 'all 0.3s ease',
                                    boxShadow: attempt.length > 20 ? '0 0 20px rgba(251,191,36,0.3)' : 'none',
                                }}
                            >
                                {attempt.length > 20 ? 'Reveal Scaffold' : 'Reveal (try writing first)'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Post-reveal comparison */}
                {revealed && attempt.length > 0 && (
                    <div style={{
                        marginTop: 14, background: C.greenSoft,
                        border: `1px solid rgba(52,211,153,0.2)`,
                        borderRadius: 10, padding: 14,
                    }}>
                        <div style={{ fontSize: 13, color: C.green, fontWeight: 600, marginBottom: 4 }}>✓ Now compare</div>
                        <div style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.5 }}>
                            Look at your plan on the left and the scaffold on the right. What did you remember? What did you miss? The gaps are where to focus your revision.
                        </div>
                    </div>
                )}

                {revealed && (
                    <div style={{ marginTop: 10 }}>
                        <button
                            onClick={() => { setRevealed(false); setAttempt(''); }}
                            style={{
                                background: C.surface, border: `1px solid ${C.border}`,
                                borderRadius: 8, padding: '7px 14px',
                                fontSize: 12, color: C.textSecondary,
                                fontFamily: font, cursor: 'pointer',
                            }}
                        >⟳ Try Again</button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Side icon configs per tab ───────────────────────────────────────────────

const SIDE_ICONS = {
    understand: {
        left: [
            { icon: '', label: 'Analyse', y: 60 },
            { icon: '', label: 'Apply', y: 220 },
            { icon: '', label: 'Technical', y: 380 },
        ],
        right: [
            { icon: '⚖️', label: 'Evaluate', y: 60 },
            { icon: '', label: 'Judge', y: 220 },
            { icon: '', label: 'Balance', y: 380 },
        ],
    },
    practice: {
        left: [
            { icon: '❓', label: 'Question', y: 60 },
            { icon: '', label: 'Focus', y: 220 },
            { icon: '', label: 'Plan', y: 380 },
        ],
        right: [
            { icon: '', label: 'AO3', y: 60 },
            { icon: '⚖️', label: 'AO4', y: 220 },
            { icon: '', label: 'Marks', y: 380 },
        ],
    },
    test: {
        left: [
            { icon: '', label: 'Recall', y: 60 },
            { icon: '✍️', label: 'Attempt', y: 220 },
            { icon: '', label: 'Compare', y: 380 },
        ],
        right: [
            { icon: '', label: 'Reveal', y: 60 },
            { icon: '', label: 'Check', y: 220 },
            { icon: '', label: 'Improve', y: 380 },
        ],
    },
};

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function PrototypePage() {
    const [activeTab, setActiveTab] = useState('understand');

    // Sliding pill tab refs
    const tabListRef = useRef(null);
    const tabBtnRefs = useRef({});
    const [tabIndicator, setTabIndicator] = useState({ x: 0, width: 0, ready: false });

    const updateIndicator = useCallback(() => {
        const list = tabListRef.current;
        const btn = tabBtnRefs.current[activeTab];
        if (!list || !btn) return;
        const listRect = list.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();
        setTabIndicator({ x: btnRect.left - listRect.left, width: btnRect.width, ready: true });
    }, [activeTab]);

    useEffect(() => { updateIndicator(); }, [updateIndicator]);

    useEffect(() => {
        window.addEventListener('resize', updateIndicator);
        return () => window.removeEventListener('resize', updateIndicator);
    }, [updateIndicator]);

    const sideIcons = SIDE_ICONS[activeTab];

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
                alignItems: 'center', gap: 36,
            }}>
                {/* Title */}
                <div style={{ textAlign: 'center', maxWidth: 600 }}>
                    <h1 style={{
                        fontSize: 40, fontWeight: 700, lineHeight: 1.15,
                        marginBottom: 14, letterSpacing: '-0.02em',
                    }}>
                        <span style={{ color: C.text }}>Essay Scaffold for </span>
                        <span style={{
                            background: 'linear-gradient(135deg, #5b8def 0%, #5F7058 50%, #06b6d4 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>Music Technology</span>
                    </h1>
                    <p style={{ fontSize: 15, lineHeight: 1.6, color: C.textSecondary }}>
                        Three ways to engage with exam essay structure — understand the criteria, practise with support, then test from memory.
                    </p>
                </div>

                {/* ─── Main Tabs (Sliding Pill) ─── */}
                <div
                    ref={tabListRef}
                    style={{
                        display: 'inline-flex', position: 'relative',
                        background: C.bgInner, borderRadius: 100,
                        padding: 5,
                        border: `1px solid ${C.border}`,
                    }}
                >
                    {/* Sliding pill */}
                    <div style={{
                        position: 'absolute', top: 5, bottom: 5, left: 5,
                        background: C.surfaceHover,
                        borderRadius: 100,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.05)',
                        zIndex: 1,
                        width: tabIndicator.width ? `${tabIndicator.width}px` : 'auto',
                        transform: `translateX(${tabIndicator.x}px)`,
                        transition: tabIndicator.ready
                            ? 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                            : 'none',
                        willChange: 'transform, width',
                    }} />
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            ref={el => { tabBtnRefs.current[tab.key] = el; }}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                position: 'relative', zIndex: 2,
                                background: 'transparent', border: 'none', borderRadius: 100,
                                padding: '10px 28px', fontSize: 15, fontWeight: 600,
                                fontFamily: font,
                                color: activeTab === tab.key ? C.text : C.textMuted,
                                cursor: 'pointer', transition: 'color 0.3s ease',
                                display: 'flex', alignItems: 'center', gap: 8,
                                whiteSpace: 'nowrap', userSelect: 'none',
                                WebkitTapHighlightColor: 'transparent',
                            }}
                        >
                            <span style={{ fontSize: 16 }}>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ─── Card with Side Icons ─── */}
                <div style={{ position: 'relative', width: '100%', maxWidth: 720, display: 'flex', justifyContent: 'center' }}>
                    {/* Left icons */}
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 0 }}>
                        {sideIcons.left.map((ic, i) => (
                            <SideLabel key={`${activeTab}-l-${i}`} icon={ic.icon} label={ic.label} side="left" y={ic.y} />
                        ))}
                    </div>

                    <BrowserCard title="essay-scaffold">
                        {activeTab === 'understand' && <UnderstandTab />}
                        {activeTab === 'practice' && <PracticeTab />}
                        {activeTab === 'test' && <TestTab />}
                    </BrowserCard>

                    {/* Right icons */}
                    <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 0 }}>
                        {sideIcons.right.map((ic, i) => (
                            <SideLabel key={`${activeTab}-r-${i}`} icon={ic.icon} label={ic.label} side="right" y={ic.y} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
