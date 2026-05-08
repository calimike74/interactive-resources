'use client';

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { theme, typography, borderRadius, spacing } from '@/lib/theme';

const TOGGLE_MODES = [
    { id: 'off', label: 'Off' },
    { id: 'all', label: 'Show All' },
    { id: 'improvements', label: 'Show Improvements' },
];

const LEVEL_COLOURS = {
    strong: { underline: '#059669', text: '#065F46', badge: '#059669', badgeBg: '#D1FAE5' },
    partial: { underline: '#D97706', text: '#92400E', badge: '#D97706', badgeBg: '#FEF3C7' },
    weak: { underline: '#DC2626', text: '#991B1B', badge: '#DC2626', badgeBg: '#FEE2E2' },
};

const TYPE_LABELS = { ao3: 'AO3', ao4: 'AO4' };

// AO colours from colour-coded prototype
const AO_STYLES = {
    ao3: {
        colour: '#06b6d4',
        soft: 'rgba(6, 182, 212, 0.10)',
        border: 'rgba(6, 182, 212, 0.25)',
    },
    ao4: {
        colour: '#DCC892',
        soft: 'rgba(167, 139, 250, 0.10)',
        border: 'rgba(167, 139, 250, 0.25)',
    },
};

const mono = 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace';

// Fallback level descriptors if not provided in data
const DEFAULT_LEVELS_20 = [
    { level: 'Level 1', marks: '1\u20134', descriptors: ['Limited knowledge (AO3)', 'Limited analysis with little reasoning (AO4)'] },
    { level: 'Level 2', marks: '5\u20138', descriptors: ['Occasionally relevant knowledge (AO3)', 'Some analysis with simplistic reasoning (AO4)'] },
    { level: 'Level 3', marks: '9\u201312', descriptors: ['Clear, mostly accurate knowledge (AO3)', 'Clear analysis with competent reasoning (AO4)'] },
    { level: 'Level 4', marks: '13\u201316', descriptors: ['Detailed, relevant knowledge (AO3)', 'Detailed analysis with logical reasoning (AO4)'] },
    { level: 'Level 5', marks: '17\u201320', descriptors: ['Sophisticated knowledge throughout (AO3)', 'Sophisticated analysis with logical reasoning throughout (AO4)'] },
];

const BG_TINTS = [
    { id: 'white', label: 'White', value: '#FFFFFF' },
    { id: 'cream', label: 'Cream', value: '#FFF8F0' },
    { id: 'blue', label: 'Blue', value: '#F0F4FF' },
];

function buildSegments(essayText, annotations, toggleMode) {
    const visible = annotations.filter(ann => {
        if (toggleMode === 'off') return false;
        if (toggleMode === 'improvements') return ann.level === 'partial' || ann.level === 'weak';
        return true;
    });

    const sorted = [...visible].sort((a, b) => a.startChar - b.startChar);
    const segments = [];
    let cursor = 0;

    for (const ann of sorted) {
        if (ann.startChar < cursor) continue;

        if (ann.startChar > cursor) {
            segments.push({ type: 'plain', text: essayText.slice(cursor, ann.startChar) });
        }

        segments.push({
            type: 'annotated',
            text: essayText.slice(ann.startChar, ann.endChar),
            annotation: ann,
        });

        cursor = ann.endChar;
    }

    if (cursor < essayText.length) {
        segments.push({ type: 'plain', text: essayText.slice(cursor) });
    }

    return segments;
}

function ScoreBadge({ label, awarded, total, colour }) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '6px',
            background: 'rgba(255,255,255,0.1)',
            fontSize: typography.size.sm,
        }}>
            <span style={{ opacity: 0.7, fontSize: '0.85em' }}>{label}</span>
            <span style={{
                fontWeight: 700,
                color: colour || '#fff',
                fontFamily: mono,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '0.02em',
            }}>
                {awarded}/{total}
            </span>
        </div>
    );
}

function LevelStrip({ currentLevel, levels }) {
    const [hoveredLevel, setHoveredLevel] = useState(null);
    const currentNum = parseInt(currentLevel.replace('Level ', ''), 10);
    const levelData = levels || DEFAULT_LEVELS_20;

    return (
        <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
                {levelData.map((ld, i) => {
                    const levelNum = i + 1;
                    const isActive = levelNum === currentNum;

                    return (
                        <button
                            key={ld.level}
                            onMouseEnter={() => setHoveredLevel(levelNum)}
                            onMouseLeave={() => setHoveredLevel(null)}
                            onClick={() => setHoveredLevel(prev => prev === levelNum ? null : levelNum)}
                            aria-label={`${ld.level}: ${ld.marks} marks`}
                            style={{
                                flex: 1,
                                padding: '8px 4px',
                                minHeight: '40px',
                                borderRadius: '6px',
                                textAlign: 'center',
                                cursor: 'pointer',
                                border: 'none',
                                backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)',
                                boxShadow: isActive
                                    ? 'inset 0 0 0 1.5px rgba(255,255,255,0.5)'
                                    : 'inset 0 0 0 1.5px transparent',
                                color: '#fff',
                                transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
                                fontVariantNumeric: 'tabular-nums',
                            }}
                        >
                            <div style={{
                                fontSize: '0.7em',
                                fontWeight: isActive ? 800 : 500,
                                opacity: isActive ? 1 : 0.6,
                                letterSpacing: '0.02em',
                            }}>
                                L{levelNum}
                            </div>
                            <div style={{
                                fontSize: '0.6em',
                                opacity: isActive ? 0.9 : 0.4,
                            }}>
                                {ld.marks}
                            </div>
                        </button>
                    );
                })}
            </div>

            {hoveredLevel && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '8px',
                    padding: '14px 16px',
                    backgroundColor: '#fff',
                    color: '#1A1A2E',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08), 0 12px 40px rgba(0,0,0,0.16)',
                    zIndex: 200,
                    fontSize: '0.8em',
                    lineHeight: 1.5,
                    animation: 'fadeSlideIn 0.15s ease',
                }}>
                    <div style={{
                        fontWeight: 700,
                        marginBottom: '8px',
                        fontSize: '0.9em',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <span>Level {hoveredLevel}</span>
                        <span style={{
                            fontWeight: 500,
                            opacity: 0.5,
                            fontSize: '0.9em',
                            fontVariantNumeric: 'tabular-nums',
                        }}>
                            {levelData[hoveredLevel - 1].marks} marks
                        </span>
                    </div>
                    <ul style={{
                        margin: 0,
                        paddingLeft: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                    }}>
                        {levelData[hoveredLevel - 1].descriptors.map((desc, j) => (
                            <li key={j} style={{ fontSize: '0.85em', color: '#374151' }}>
                                {desc}
                            </li>
                        ))}
                    </ul>
                    {hoveredLevel === currentNum && (
                        <div style={{
                            marginTop: '10px',
                            padding: '5px 10px',
                            backgroundColor: '#D1FAE5',
                            color: '#065F46',
                            borderRadius: '6px',
                            fontSize: '0.8em',
                            fontWeight: 600,
                            textAlign: 'center',
                        }}>
                            Your current level
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function AnnotationPanel({ segment, isOpen, onToggle }) {
    const ann = segment.annotation;
    const colours = LEVEL_COLOURS[ann.level];
    const aoStyle = AO_STYLES[ann.type];
    const typeLabel = TYPE_LABELS[ann.type];

    return (
        <span style={{ display: 'inline' }}>
            <span
                onClick={onToggle}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
                style={{
                    borderBottom: `2px solid ${colours.underline}`,
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease',
                }}
            >
                {segment.text}
            </span>
            <span
                onClick={onToggle}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginLeft: '3px',
                    padding: '2px 7px',
                    borderRadius: '5px',
                    backgroundColor: aoStyle.soft,
                    color: aoStyle.colour,
                    border: `1px solid ${aoStyle.border}`,
                    fontSize: '0.6em',
                    fontWeight: 700,
                    fontFamily: mono,
                    lineHeight: 1.4,
                    verticalAlign: 'middle',
                    cursor: 'pointer',
                    letterSpacing: '0.05em',
                    transition: 'opacity 0.15s ease',
                }}
            >
                <span style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    backgroundColor: aoStyle.colour,
                    flexShrink: 0,
                }} />
                {typeLabel}
            </span>
        </span>
    );
}

function ExpandedPanel({ annotation }) {
    const colours = LEVEL_COLOURS[annotation.level];

    return (
        <div style={{
            margin: '8px 0 12px 0',
            padding: '14px 16px',
            borderLeft: `4px solid ${colours.underline}`,
            backgroundColor: colours.badgeBg,
            borderRadius: '0 10px 10px 0',
            fontSize: '0.9em',
            lineHeight: 1.6,
            animation: 'fadeSlideIn 0.2s ease',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04)',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
                opacity: 0,
                animation: 'fadeSlideIn 0.2s ease 0.05s forwards',
            }}>
                <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 8px',
                    borderRadius: '5px',
                    backgroundColor: AO_STYLES[annotation.type].soft,
                    color: AO_STYLES[annotation.type].colour,
                    border: `1px solid ${AO_STYLES[annotation.type].border}`,
                    fontSize: '0.8em',
                    fontWeight: 700,
                    fontFamily: mono,
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '0.03em',
                }}>
                    <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: AO_STYLES[annotation.type].colour,
                    }} />
                    {TYPE_LABELS[annotation.type]}
                    <span style={{ opacity: 0.5 }}>·</span>
                    {annotation.mark}/{annotation.maxMark}
                </span>
                <span style={{
                    fontSize: '0.85em',
                    color: colours.text,
                    fontWeight: 600,
                }}>
                    {annotation.level === 'strong' ? 'Strong' : annotation.level === 'partial' ? 'Partial' : 'Weak'}
                </span>
            </div>

            <div style={{
                marginBottom: '6px',
                fontWeight: 600,
                color: colours.text,
                opacity: 0,
                animation: 'fadeSlideIn 0.2s ease 0.1s forwards',
            }}>
                {annotation.descriptor}
            </div>

            <div style={{
                color: '#374151',
                marginBottom: annotation.improvement ? '10px' : 0,
                opacity: 0,
                animation: 'fadeSlideIn 0.2s ease 0.15s forwards',
            }}>
                {annotation.comment}
            </div>

            {annotation.improvement && (
                <div style={{
                    marginTop: '8px',
                    padding: '10px 12px',
                    backgroundColor: 'rgba(255,255,255,0.7)',
                    borderRadius: '6px',
                    boxShadow: `inset 0 0 0 1px ${colours.underline}33`,
                    opacity: 0,
                    animation: 'fadeSlideIn 0.2s ease 0.2s forwards',
                }}>
                    <div style={{
                        fontSize: '0.8em',
                        fontWeight: 700,
                        color: colours.badge,
                        marginBottom: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                    }}>
                        How to improve
                    </div>
                    <div style={{ color: '#1A1A2E' }}>
                        {annotation.improvement}
                    </div>
                </div>
            )}
        </div>
    );
}

function TextBlock({ text }) {
    // Split on double newlines (paragraphs) and single newlines (line breaks / bullets)
    const paragraphs = text.split(/\n\n/);

    return (
        <>
            {paragraphs.map((para, pi) => {
                const lines = para.split(/\n/);
                const isBulletBlock = lines.some(l => /^\s*[\u2022\u2023\u25E6\-\*]\s/.test(l));

                if (isBulletBlock) {
                    return (
                        <React.Fragment key={pi}>
                            {pi > 0 && <span style={{ display: 'block', height: '0.8em' }} />}
                            {lines.map((line, li) => {
                                const bulletMatch = line.match(/^\s*[\u2022\u2023\u25E6\-\*]\s*(.*)/);
                                if (bulletMatch) {
                                    return (
                                        <div key={li} style={{
                                            display: 'flex',
                                            gap: '8px',
                                            paddingLeft: '4px',
                                            marginBottom: '2px',
                                        }}>
                                            <span style={{ opacity: 0.4, flexShrink: 0 }}>{'\u2022'}</span>
                                            <span>{bulletMatch[1]}</span>
                                        </div>
                                    );
                                }
                                return line ? <span key={li}>{line}</span> : null;
                            })}
                        </React.Fragment>
                    );
                }

                return (
                    <React.Fragment key={pi}>
                        {pi > 0 && <span style={{ display: 'block', height: '0.8em' }} />}
                        {lines.map((line, li) => (
                            <React.Fragment key={li}>
                                {li > 0 && <br />}
                                {line}
                            </React.Fragment>
                        ))}
                    </React.Fragment>
                );
            })}
        </>
    );
}

export default function EssayFeedbackViewer({ feedbackData }) {
    const t = theme.light;
    const [toggleMode, setToggleMode] = useState('off');
    const [expandedId, setExpandedId] = useState(null);
    const [fontSize, setFontSize] = useState(18);
    const [fontFamily, setFontFamily] = useState('default');
    const [bgTint, setBgTint] = useState('white');
    const [lineSpacing, setLineSpacing] = useState('normal');
    const [copyState, setCopyState] = useState('idle');
    const essayRef = useRef(null);

    const { essayText, annotations, summary, essayTitle, topic, markScheme } = feedbackData;

    const segments = useMemo(
        () => buildSegments(essayText, annotations, toggleMode),
        [essayText, annotations, toggleMode]
    );

    const handleToggleAnnotation = useCallback((annId) => {
        setExpandedId(prev => prev === annId ? null : annId);
    }, []);

    const bgColour = BG_TINTS.find(b => b.id === bgTint)?.value || '#FFFFFF';

    const fontFamilyValue = fontFamily === 'dyslexic'
        ? '"OpenDyslexic", "Comic Sans MS", sans-serif'
        : typography.fontFamily;

    const lineHeightValue = lineSpacing === 'wide' ? 2.2 : 1.8;

    const handleCopy = useCallback(async () => {
        if (!essayRef.current || copyState === 'copied') return;

        try {
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(essayRef.current);
            selection.removeAllRanges();
            selection.addRange(range);

            if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
                const htmlContent = essayRef.current.innerHTML;
                const plainContent = essayRef.current.innerText;

                const blob = new ClipboardItem({
                    'text/html': new Blob([htmlContent], { type: 'text/html' }),
                    'text/plain': new Blob([plainContent], { type: 'text/plain' }),
                });
                await navigator.clipboard.write([blob]);
            } else {
                document.execCommand('copy');
            }

            selection.removeAllRanges();
            setCopyState('copied');
            setTimeout(() => setCopyState('idle'), 1500);
        } catch {
            const text = essayRef.current.innerText;
            await navigator.clipboard.writeText(text);
            setCopyState('copied');
            setTimeout(() => setCopyState('idle'), 1500);
        }
    }, [copyState]);

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: bgColour,
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            transition: 'background-color 0.3s ease',
        }}>
            <style>{`
                @import url('https://fonts.cdnfonts.com/css/opendyslexic');
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(-4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .copy-btn:active {
                    transform: scale(0.97);
                }
                .toolbar-btn:active {
                    transform: scale(0.95);
                }
            `}</style>

            {/* Top Bar */}
            <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
                color: '#fff',
                padding: '14px 16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1), 0 8px 24px rgba(0,0,0,0.1)',
            }}>
                <div style={{ maxWidth: '720px', margin: '0 auto' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '8px',
                        marginBottom: '10px',
                    }}>
                        <div style={{ flex: 1 }}>
                            <div style={{
                                fontSize: typography.size.lg,
                                fontWeight: 700,
                                textWrap: 'balance',
                                letterSpacing: '-0.01em',
                            }}>
                                <span>Essay Feedback</span>
                                <span style={{ opacity: 0.4, margin: '0 6px' }}>·</span>
                                <span style={{
                                    background: 'linear-gradient(135deg, #06b6d4 0%, #DCC892 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}>
                                    {essayTitle}
                                </span>
                            </div>
                            <div style={{ fontSize: typography.size.sm, opacity: 0.7 }}>
                                {topic}
                            </div>
                        </div>

                        <div style={{
                            display: 'flex',
                            gap: '6px',
                            flexWrap: 'wrap',
                        }}>
                            <ScoreBadge label="AO3" awarded={summary.ao3.awarded} total={summary.ao3.total} colour="#06b6d4" />
                            <ScoreBadge label="AO4" awarded={summary.ao4.awarded} total={summary.ao4.total} colour="#DCC892" />
                            <ScoreBadge label="Total" awarded={summary.combined.awarded} total={summary.combined.total} colour="#fff" />
                        </div>
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                        <LevelStrip currentLevel={summary.level} levels={markScheme?.levels} />
                    </div>

                    {/* Toggle buttons */}
                    <div style={{
                        display: 'flex',
                        gap: '4px',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '10px',
                        padding: '3px',
                    }}>
                        {TOGGLE_MODES.map(mode => (
                            <button
                                key={mode.id}
                                onClick={() => { setToggleMode(mode.id); setExpandedId(null); }}
                                style={{
                                    flex: 1,
                                    padding: '8px 12px',
                                    minHeight: '40px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: typography.size.sm,
                                    fontWeight: toggleMode === mode.id ? 700 : 400,
                                    backgroundColor: toggleMode === mode.id ? 'rgba(255,255,255,0.2)' : 'transparent',
                                    color: '#fff',
                                    transition: 'background-color 0.15s ease, font-weight 0.15s ease',
                                }}
                            >
                                {mode.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Accessibility Toolbar */}
            <div style={{
                position: 'sticky',
                top: '160px',
                zIndex: 99,
                backgroundColor: bgTint === 'white'
                    ? 'rgba(255, 255, 255, 0.85)'
                    : bgTint === 'cream'
                        ? 'rgba(255, 248, 240, 0.85)'
                        : 'rgba(240, 244, 255, 0.85)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.02)',
                padding: '10px 16px',
                transition: 'background-color 0.3s ease',
            }}>
                <div style={{
                    maxWidth: '720px',
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                    fontSize: typography.size.sm,
                    color: t.text.tertiary,
                }}>
                    {/* Font size */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '0.85em', opacity: 0.6 }}>Aa</span>
                        <button
                            className="toolbar-btn"
                            onClick={() => setFontSize(s => Math.max(14, s - 2))}
                            style={toolbarBtnStyle(t)}
                            aria-label="Decrease font size"
                        >
                            &minus;
                        </button>
                        <span style={{
                            minWidth: '28px',
                            textAlign: 'center',
                            fontVariantNumeric: 'tabular-nums',
                        }}>
                            {fontSize}
                        </span>
                        <button
                            className="toolbar-btn"
                            onClick={() => setFontSize(s => Math.min(28, s + 2))}
                            style={toolbarBtnStyle(t)}
                            aria-label="Increase font size"
                        >
                            +
                        </button>
                    </div>

                    <div style={{ width: '1px', height: '20px', backgroundColor: t.border.subtle, opacity: 0.5 }} />

                    {/* Font family */}
                    <button
                        className="toolbar-btn"
                        onClick={() => setFontFamily(f => f === 'default' ? 'dyslexic' : 'default')}
                        style={{
                            ...toolbarBtnStyle(t),
                            fontFamily: fontFamily === 'dyslexic' ? '"OpenDyslexic", sans-serif' : 'inherit',
                            backgroundColor: fontFamily === 'dyslexic' ? t.accent.infoLight : 'transparent',
                            padding: '4px 12px',
                        }}
                    >
                        {fontFamily === 'dyslexic' ? 'Dyslexic' : 'Font'}
                    </button>

                    <div style={{ width: '1px', height: '20px', backgroundColor: t.border.subtle, opacity: 0.5 }} />

                    {/* Background tint */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {BG_TINTS.map(tint => (
                            <button
                                key={tint.id}
                                onClick={() => setBgTint(tint.id)}
                                title={tint.label}
                                aria-label={`${tint.label} background`}
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    border: 'none',
                                    backgroundColor: tint.value,
                                    cursor: 'pointer',
                                    boxShadow: bgTint === tint.id
                                        ? `0 0 0 2px ${bgColour}, 0 0 0 3.5px ${t.accent.primary}`
                                        : '0 0 0 1px rgba(0,0,0,0.1)',
                                    transition: 'box-shadow 0.15s ease',
                                }}
                            />
                        ))}
                    </div>

                    <div style={{ width: '1px', height: '20px', backgroundColor: t.border.subtle, opacity: 0.5 }} />

                    {/* Line spacing */}
                    <button
                        className="toolbar-btn"
                        onClick={() => setLineSpacing(s => s === 'normal' ? 'wide' : 'normal')}
                        style={{
                            ...toolbarBtnStyle(t),
                            backgroundColor: lineSpacing === 'wide' ? t.accent.infoLight : 'transparent',
                            padding: '4px 12px',
                        }}
                    >
                        {lineSpacing === 'wide' ? 'Wide' : 'Spacing'}
                    </button>
                </div>
            </div>

            {/* Essay Body */}
            <div style={{
                maxWidth: '720px',
                margin: '0 auto',
                padding: '24px 16px 100px 16px',
            }}>
                {toggleMode === 'off' && (
                    <div style={{
                        textAlign: 'center',
                        padding: '16px 20px',
                        marginBottom: '20px',
                        backgroundColor: 'rgba(37, 99, 235, 0.05)',
                        borderRadius: '10px',
                        color: t.text.tertiary,
                        fontSize: typography.size.sm,
                        lineHeight: 1.6,
                        textWrap: 'pretty',
                    }}>
                        Read through your essay first. When you're ready, tap <strong>Show All</strong> or <strong>Show Improvements</strong> to see feedback.
                    </div>
                )}

                <div
                    ref={essayRef}
                    style={{
                        fontFamily: fontFamilyValue,
                        fontSize: `${fontSize}px`,
                        lineHeight: lineHeightValue,
                        color: t.text.secondary,
                        textWrap: 'pretty',
                        transition: 'font-size 0.2s ease, line-height 0.2s ease, font-family 0.2s ease',
                    }}
                >
                    {segments.map((segment, i) => {
                        if (segment.type === 'plain') {
                            return <TextBlock key={i} text={segment.text} />;
                        }

                        const ann = segment.annotation;
                        const isExpanded = expandedId === ann.id;

                        return (
                            <React.Fragment key={ann.id}>
                                <AnnotationPanel
                                    segment={segment}
                                    isOpen={isExpanded}
                                    onToggle={() => handleToggleAnnotation(ann.id)}
                                />
                                {isExpanded && <ExpandedPanel annotation={ann} />}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Copy My View — sticky bottom */}
            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '12px 16px',
                backgroundColor: bgTint === 'white'
                    ? 'rgba(255, 255, 255, 0.9)'
                    : bgTint === 'cream'
                        ? 'rgba(255, 248, 240, 0.9)'
                        : 'rgba(240, 244, 255, 0.9)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: '0 -1px 3px rgba(0,0,0,0.04), 0 -4px 12px rgba(0,0,0,0.04)',
                zIndex: 100,
                transition: 'background-color 0.3s ease',
            }}>
                <div style={{ maxWidth: '720px', margin: '0 auto' }}>
                    <button
                        className="copy-btn"
                        onClick={handleCopy}
                        style={{
                            width: '100%',
                            padding: '14px',
                            borderRadius: '12px',
                            border: 'none',
                            background: copyState === 'copied'
                                ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                                : 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
                            color: '#fff',
                            fontSize: typography.size.base,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease, transform 0.1s ease',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.08)',
                        }}
                    >
                        {copyState === 'copied' ? 'Copied!' : 'Copy My View'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function toolbarBtnStyle(t) {
    return {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '40px',
        minHeight: '40px',
        borderRadius: '8px',
        border: 'none',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        fontSize: typography.size.sm,
        color: t.text.secondary,
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
        transition: 'background-color 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease',
    };
}
