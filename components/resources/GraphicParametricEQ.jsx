'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { theme, typography, borderRadius, spacing, transitions } from '@/lib/theme';
import ProductionCopyButton from '@/components/ui/ProductionCopyButton';
import { buildEQCopyMarkdown } from '@/lib/copy-for-ai';

// ============================================
// CONSTANTS
// ============================================
const GRAPHIC_EQ_BANDS = [
    { freq: 31, label: '31' },
    { freq: 63, label: '63' },
    { freq: 125, label: '125' },
    { freq: 250, label: '250' },
    { freq: 500, label: '500' },
    { freq: 1000, label: '1k' },
    { freq: 2000, label: '2k' },
    { freq: 4000, label: '4k' },
    { freq: 8000, label: '8k' },
    { freq: 16000, label: '16k' },
];

const GRAPHIC_PRESETS = {
    flat: { name: 'Flat', gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    smile: { name: 'Smile', gains: [6, 4, 2, 0, -2, -2, 0, 2, 4, 6] },
    bassBoost: { name: 'Bass Boost', gains: [8, 6, 4, 2, 0, 0, 0, 0, 0, 0] },
    highCut: { name: 'High Cut', gains: [0, 0, 0, 0, 0, -2, -4, -6, -8, -10] },
};

const QUIZ_QUESTIONS = [
    {
        question: 'Why is it called a "graphic" equaliser?',
        options: [
            'Because it uses graphs to calculate EQ',
            'Because the slider positions visually represent the EQ curve',
            'Because it was invented by a graphic designer',
            'Because it uses graphical user interfaces',
        ],
        correct: 1,
        explanation: 'The sliders create a visual "graph" of your EQ settings - what you see is what you get!',
    },
    {
        question: 'In a 10-band graphic EQ, what interval separates each band?',
        options: ['Half octave', 'Third octave', 'One octave', 'Two octaves'],
        correct: 2,
        explanation: 'Bands are separated by approximately one octave — each band is roughly double the previous one (31 → 63 → 125 Hz uses ISO standard centre frequencies).',
    },
    {
        question: 'What can you adjust on each band of a graphic EQ?',
        options: [
            'Frequency, gain, and Q',
            'Only the gain (boost or cut)',
            'Frequency and gain only',
            'Q and gain only',
        ],
        correct: 1,
        explanation: 'On a graphic EQ, frequency and Q are fixed. You can only adjust the gain per band.',
    },
    {
        question: 'What can you control on a parametric EQ that you cannot on a graphic EQ?',
        options: [
            'Gain amount',
            'Number of bands',
            'Centre frequency and Q (bandwidth)',
            'Output volume',
        ],
        correct: 2,
        explanation: 'Parametric EQ allows control of centre frequency, gain, AND Q for each band - multiple parameters.',
    },
    {
        question: 'A mixing engineer needs to remove a specific resonant frequency at 847Hz. Which EQ type offers better precision?',
        options: [
            'Graphic EQ - more bands means more precision',
            'Parametric EQ - can dial in the exact frequency',
            'Both are equally precise',
            'Neither can target specific frequencies',
        ],
        correct: 1,
        explanation: 'Parametric EQ can dial in exactly 847Hz. A graphic EQ would force you to use the nearest fixed band (800Hz or 1kHz).',
    },
    {
        question: 'Why might a live sound engineer prefer graphic EQ while a studio engineer prefers parametric?',
        options: [
            'Graphic is cheaper, parametric is expensive',
            'Graphic offers fast visual feedback, parametric offers surgical precision',
            'Graphic is digital, parametric is analogue',
            'Graphic has more bands, parametric has fewer',
        ],
        correct: 1,
        explanation: 'Live sound needs speed and visual feedback. Studio mixing allows time for precise, surgical corrections.',
    },
];

// ============================================
// THEME CONSTANTS
// ============================================
const CYAN = '#3A4A35';   // was neon cyan #22d3ee — house field (moss), "graphic EQ" side of the compare
const ORANGE = '#B85A3F'; // was neon orange #f97316 — house sienna, "parametric EQ" side of the compare
const PURPLE = '#C99F44'; // unused (kept as-is — not a rendering defect)

// ============================================
// COPYABLE NOTE COMPONENT
// ============================================
const CopyableNote = ({ title, children, variant = 'definition' }) => {
    const [copied, setCopied] = useState(false);
    const contentRef = useRef(null);
    const t = theme.light;

    const variantColors = {
        definition: t.accent.info,
        key: '#f59e0b',
        exam: t.accent.primary,
        warning: t.accent.warning,
    };

    const color = variantColors[variant] || variantColors.definition;

    const handleCopy = async () => {
        if (contentRef.current) {
            const text = contentRef.current.innerText;
            try {
                await navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                const range = document.createRange();
                range.selectNode(contentRef.current);
                window.getSelection().removeAllRanges();
                window.getSelection().addRange(range);
                document.execCommand('copy');
                window.getSelection().removeAllRanges();
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        }
    };

    const icons = {
        definition: '',
        key: '',
        exam: '',
        warning: '',
    };

    return (
        <div
            style={{
                background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
                border: `1px solid ${color}50`,
                borderLeft: `4px solid ${color}`,
                borderRadius: borderRadius.xl,
                padding: spacing[4],
                marginTop: spacing[3],
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: spacing[2],
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                    <span style={{ fontSize: typography.size.base }}>{icons[variant]}</span>
                    <span
                        style={{
                            fontSize: typography.size.xs,
                            fontWeight: typography.weight.bold,
                            color: color,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                        }}
                    >
                        {title || 'Copy to Notes'}
                    </span>
                </div>
                <button type="button"
                    onClick={handleCopy}
                    style={{
                        background: copied ? t.accent.success : t.bg.tertiary,
                        border: `1px solid ${copied ? t.accent.success : t.border.medium}`,
                        borderRadius: borderRadius.md,
                        padding: `${spacing[1]} ${spacing[3]}`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing[1],
                        color: copied ? t.text.inverse : t.text.secondary,
                        fontSize: typography.size.xs,
                        transition: `all ${transitions.fast}`,
                    }}
                >
                    {copied ? '✓ Copied!' : 'Copy'}
                </button>
            </div>
            <div
                ref={contentRef}
                style={{ color: t.text.secondary, fontSize: typography.size.sm, lineHeight: typography.lineHeight.relaxed }}
            >
                {children}
            </div>
        </div>
    );
};

// ============================================
// SIGNAL FLOW ANIMATION COMPONENT
// ============================================
const SignalFlowDiagram = ({ type, isActive }) => {
    const [animationOffset, setAnimationOffset] = useState(0);
    const t = theme.light;

    useEffect(() => {
        if (!isActive) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const interval = setInterval(() => {
            setAnimationOffset((prev) => (prev + 2) % 100);
        }, 50);
        return () => clearInterval(interval);
    }, [isActive]);

    const color = type === 'parallel' ? CYAN : ORANGE;
    const width = 300;
    const height = type === 'parallel' ? 180 : 100;

    const legend = (
        <p style={{ fontSize: '10px', color: t.text.tertiary, marginTop: '4px', textAlign: 'center' }}>
            Moving dots represent audio signal travelling through each filter band.
        </p>
    );

    if (type === 'parallel') {
        // Parallel routing - all bands process simultaneously
        return (
            <div>
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                {/* Input */}
                <rect x={10} y={75} width={40} height={30} fill={t.bg.tertiary} stroke={t.border.medium} rx={4} />
                <text x={30} y={95} textAnchor="middle" fontSize="10" fill={t.text.secondary}>IN</text>

                {/* Split lines */}
                <line x1={50} y1={90} x2={70} y2={90} stroke={color} strokeWidth={2} />
                {[30, 60, 90, 120, 150].map((y, i) => (
                    <React.Fragment key={i}>
                        <line x1={70} y1={90} x2={90} y2={y} stroke={color} strokeWidth={1.5} />
                        <rect x={90} y={y - 12} width={100} height={24} fill={`${color}20`} stroke={color} strokeWidth={1} rx={4} />
                        <text x={140} y={y + 4} textAnchor="middle" fontSize="9" fill={t.text.secondary}>
                            Band {i + 1}
                        </text>
                        <line x1={190} y1={y} x2={210} y2={90} stroke={color} strokeWidth={1.5} />

                        {/* Animated dot */}
                        {isActive && (
                            <circle
                                cx={90 + (animationOffset * 1.2)}
                                cy={y}
                                r={3}
                                fill={color}
                                opacity={animationOffset < 83 ? 1 : 0}
                            />
                        )}
                    </React.Fragment>
                ))}

                {/* Sum symbol */}
                <circle cx={220} cy={90} r={12} fill={t.bg.tertiary} stroke={color} strokeWidth={2} />
                <text x={220} y={94} textAnchor="middle" fontSize="14" fill={color}>Σ</text>

                {/* Output */}
                <line x1={232} y1={90} x2={250} y2={90} stroke={color} strokeWidth={2} />
                <rect x={250} y={75} width={40} height={30} fill={t.bg.tertiary} stroke={t.border.medium} rx={4} />
                <text x={270} y={95} textAnchor="middle" fontSize="10" fill={t.text.secondary}>OUT</text>
            </svg>
            {legend}
            </div>
        );
    }

    // Series routing - cascaded filters
    return (
        <div>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {/* Input */}
            <rect x={10} y={35} width={35} height={30} fill={t.bg.tertiary} stroke={t.border.medium} rx={4} />
            <text x={27} y={55} textAnchor="middle" fontSize="10" fill={t.text.secondary}>IN</text>

            {/* Series chain */}
            {[0, 1, 2].map((i) => {
                const x = 60 + i * 70;
                return (
                    <React.Fragment key={i}>
                        <line x1={x - 15} y1={50} x2={x} y2={50} stroke={color} strokeWidth={2} />
                        <rect x={x} y={30} width={55} height={40} fill={`${color}20`} stroke={color} strokeWidth={1} rx={4} />
                        <text x={x + 27} y={55} textAnchor="middle" fontSize="9" fill={t.text.secondary}>Band {i + 1}</text>

                        {/* Animated dot */}
                        {isActive && (
                            <circle
                                cx={x - 15 + (animationOffset * 0.85)}
                                cy={50}
                                r={3}
                                fill={color}
                                opacity={(animationOffset + i * 33) % 100 < 80 ? 1 : 0}
                            />
                        )}
                    </React.Fragment>
                );
            })}

            {/* Output */}
            <line x1={255} y1={50} x2={265} y2={50} stroke={color} strokeWidth={2} />
            <rect x={265} y={35} width={35} height={30} fill={t.bg.tertiary} stroke={t.border.medium} rx={4} />
            <text x={282} y={55} textAnchor="middle" fontSize="10" fill={t.text.secondary}>OUT</text>
        </svg>
        {legend}
        </div>
    );
};

// ============================================
// FREQUENCY RESPONSE SVG
// ============================================
const FrequencyResponseSVG = ({ gains, bands, type = 'graphic', parametricBands = [] }) => {
    const t = theme.light;
    const width = 400;
    const height = 200;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;

    const color = type === 'graphic' ? CYAN : ORANGE;

    // Log scale conversion
    const freqToX = (freq) => {
        const minLog = Math.log10(20);
        const maxLog = Math.log10(20000);
        return padding.left + ((Math.log10(freq) - minLog) / (maxLog - minLog)) * innerWidth;
    };

    const gainToY = (gain) => {
        const maxGain = 12;
        return padding.top + innerHeight / 2 - (gain / maxGain) * (innerHeight / 2);
    };

    // Generate curve path
    const generatePath = () => {
        const points = [];

        for (let freq = 20; freq <= 20000; freq *= 1.05) {
            let totalGain = 0;

            if (type === 'graphic') {
                // Sum contribution from each graphic EQ band (parallel routing)
                bands.forEach((band, i) => {
                    const bandGain = gains[i] || 0;
                    const octaveDistance = Math.abs(Math.log2(freq / band.freq));
                    const bandwidth = 0.7; // About 1 octave Q
                    const contribution = bandGain * Math.exp(-(octaveDistance * octaveDistance) / (2 * bandwidth * bandwidth));
                    totalGain += contribution;
                });
            } else {
                // Parametric EQ (series routing - gains multiply/add in dB)
                parametricBands.forEach((band) => {
                    const octaveDistance = Math.abs(Math.log2(freq / band.freq));
                    const qFactor = band.q;
                    const bandwidth = 1 / qFactor;
                    const contribution = band.gain * Math.exp(-(octaveDistance * octaveDistance) / (2 * bandwidth * bandwidth));
                    totalGain += contribution;
                });
            }

            points.push({ x: freqToX(freq), y: gainToY(totalGain) });
        }

        return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    };

    const freqLabels = [20, 100, 1000, 10000, 20000];

    return (
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
            {/* Grid */}
            <defs>
                <pattern id={`grid-${type}`} width="40" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 20" fill="none" stroke={t.border.subtle} strokeWidth="0.5" />
                </pattern>
            </defs>
            <rect x={padding.left} y={padding.top} width={innerWidth} height={innerHeight} fill={`url(#grid-${type})`} />

            {/* 0dB line */}
            <line
                x1={padding.left}
                y1={gainToY(0)}
                x2={width - padding.right}
                y2={gainToY(0)}
                stroke={t.border.strong}
                strokeWidth={1}
                strokeDasharray="4,4"
            />
            <text x={padding.left - 5} y={gainToY(0) + 4} textAnchor="end" fontSize="10" fill={t.text.tertiary}>
                0dB
            </text>

            {/* +12dB and -12dB labels */}
            <text x={padding.left - 5} y={gainToY(12) + 4} textAnchor="end" fontSize="10" fill={t.text.tertiary}>
                +12
            </text>
            <text x={padding.left - 5} y={gainToY(-12) + 4} textAnchor="end" fontSize="10" fill={t.text.tertiary}>
                -12
            </text>

            {/* Frequency labels */}
            {freqLabels.map((freq) => (
                <text
                    key={freq}
                    x={freqToX(freq)}
                    y={height - padding.bottom + 15}
                    textAnchor="middle"
                    fontSize="10"
                    fill={t.text.tertiary}
                >
                    {freq >= 1000 ? `${freq / 1000}k` : freq}
                </text>
            ))}

            {/* Axis labels */}
            <text x={width / 2} y={height - 5} textAnchor="middle" fontSize="11" fill={t.text.secondary}>
                Frequency (Hz)
            </text>
            <text
                x={10}
                y={height / 2}
                textAnchor="middle"
                fontSize="11"
                fill={t.text.secondary}
                transform={`rotate(-90, 10, ${height / 2})`}
            >
                Gain (dB)
            </text>

            {/* Response curve */}
            <path
                d={generatePath()}
                fill="none"
                stroke={color}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Fill under curve */}
            <path
                d={`${generatePath()} L ${width - padding.right} ${gainToY(0)} L ${padding.left} ${gainToY(0)} Z`}
                fill={`${color}20`}
            />
        </svg>
    );
};

// ============================================
// GRAPHIC EQ SLIDER
// ============================================
const GraphicEQSlider = ({ band, gain, onChange }) => {
    const t = theme.light;

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: spacing[2],
            }}
        >
            <span style={{ fontSize: typography.size.xs, color: t.text.tertiary, fontWeight: typography.weight.medium }}>
                {gain > 0 ? '+' : ''}{gain}
            </span>
            <div
                style={{
                    position: 'relative',
                    width: '28px',
                    height: '120px',
                    background: t.bg.tertiary,
                    borderRadius: borderRadius.lg,
                    display: 'flex',
                    justifyContent: 'center',
                }}
            >
                {/* Track */}
                <div
                    style={{
                        position: 'absolute',
                        top: '10px',
                        bottom: '10px',
                        width: '4px',
                        background: t.border.medium,
                        borderRadius: borderRadius.full,
                    }}
                />
                {/* Center line */}
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '4px',
                        right: '4px',
                        height: '2px',
                        background: t.border.strong,
                    }}
                />
                {/* Slider input */}
                <input aria-label={`${band.label} Hz gain, ${gain} dB`}
                    type="range"
                    min={-12}
                    max={12}
                    step={1}
                    value={gain}
                    onChange={(e) => onChange(Number(e.target.value))}
                    style={{
                        position: 'absolute',
                        width: '120px',
                        height: '28px',
                        transform: 'rotate(-90deg) translateX(-46px)',
                        transformOrigin: 'center center',
                        cursor: 'pointer',
                        accentColor: CYAN,
                    }}
                />
            </div>
            <span style={{ fontSize: typography.size.xs, color: t.text.secondary, fontWeight: typography.weight.medium }}>
                {band.label}
            </span>
        </div>
    );
};

// ============================================
// PARAMETRIC EQ BAND
// ============================================
const ParametricEQBand = ({ band, index, onChange }) => {
    const t = theme.light;

    const formatFreq = (freq) => {
        if (freq >= 1000) return `${(freq / 1000).toFixed(1)}kHz`;
        return `${freq}Hz`;
    };

    return (
        <div
            style={{
                background: t.bg.tertiary,
                borderRadius: borderRadius.xl,
                padding: spacing[4],
                border: `1px solid ${ORANGE}40`,
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: spacing[3],
                }}
            >
                <span
                    style={{
                        fontSize: typography.size.sm,
                        fontWeight: typography.weight.semibold,
                        color: ORANGE,
                    }}
                >
                    Band {index + 1}
                </span>
            </div>

            {/* Frequency */}
            <div style={{ marginBottom: spacing[3] }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing[1] }}>
                    <span style={{ fontSize: typography.size.xs, color: t.text.tertiary }}>Frequency</span>
                    <span style={{ fontSize: typography.size.xs, color: t.text.secondary, fontWeight: typography.weight.medium }}>
                        {formatFreq(band.freq)}
                    </span>
                </div>
                <input aria-label="Centre frequency"
                    type="range"
                    min={0}
                    max={1000}
                    value={((Math.log10(band.freq) - Math.log10(20)) / (Math.log10(20000) - Math.log10(20))) * 1000}
                    onChange={(e) => {
                        const minLog = Math.log10(20);
                        const maxLog = Math.log10(20000);
                        const log = minLog + (Number(e.target.value) / 1000) * (maxLog - minLog);
                        onChange({ ...band, freq: Math.round(Math.pow(10, log)) });
                    }}
                    style={{ width: '100%', accentColor: ORANGE }}
                />
            </div>

            {/* Gain */}
            <div style={{ marginBottom: spacing[3] }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing[1] }}>
                    <span style={{ fontSize: typography.size.xs, color: t.text.tertiary }}>Gain</span>
                    <span style={{ fontSize: typography.size.xs, color: t.text.secondary, fontWeight: typography.weight.medium }}>
                        {band.gain > 0 ? '+' : ''}{band.gain}dB
                    </span>
                </div>
                <input aria-label={`Gain, ${band.gain} dB`}
                    type="range"
                    min={-12}
                    max={12}
                    step={0.5}
                    value={band.gain}
                    onChange={(e) => onChange({ ...band, gain: Number(e.target.value) })}
                    style={{ width: '100%', accentColor: ORANGE }}
                />
            </div>

            {/* Q */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing[1] }}>
                    <span style={{ fontSize: typography.size.xs, color: t.text.tertiary }}>Q / Bandwidth (higher Q = narrower)</span>
                    <span style={{ fontSize: typography.size.xs, color: t.text.secondary, fontWeight: typography.weight.medium }}>
                        {band.q.toFixed(1)}
                    </span>
                </div>
                <input aria-label="Q bandwidth"
                    type="range"
                    min={0.5}
                    max={10}
                    step={0.1}
                    value={band.q}
                    onChange={(e) => onChange({ ...band, q: Number(e.target.value) })}
                    style={{ width: '100%', accentColor: ORANGE }}
                />
            </div>
        </div>
    );
};

// ============================================
// QUIZ COMPONENT
// ============================================
const Quiz = ({ questions }) => {
    const t = theme.light;
    const [answers, setAnswers] = useState({});
    const [showResults, setShowResults] = useState(false);

    const score = Object.entries(answers).filter(
        ([qIndex, answer]) => answer === questions[Number(qIndex)].correct
    ).length;

    const handleAnswer = (questionIndex, optionIndex) => {
        if (showResults) return;
        setAnswers({ ...answers, [questionIndex]: optionIndex });
    };

    const handleReset = () => {
        setAnswers({});
        setShowResults(false);
    };

    const handleShowResults = () => {
        setShowResults(true);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[6] }}>
            {questions.map((q, qIndex) => {
                const userAnswer = answers[qIndex];
                const isAnswered = userAnswer !== undefined;
                const isCorrect = userAnswer === q.correct;

                return (
                    <div
                        key={qIndex}
                        style={{
                            background: t.bg.primary,
                            borderRadius: borderRadius.xl,
                            padding: spacing[5],
                            border: `1px solid ${t.border.subtle}`,
                            boxShadow: t.shadow.sm,
                        }}
                    >
                        <div style={{ display: 'flex', gap: spacing[3], marginBottom: spacing[4] }}>
                            <span
                                style={{
                                    background: t.accent.infoLight,
                                    color: t.accent.info,
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: borderRadius.full,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: typography.size.sm,
                                    fontWeight: typography.weight.semibold,
                                    flexShrink: 0,
                                }}
                            >
                                {qIndex + 1}
                            </span>
                            <p style={{ fontSize: typography.size.base, color: t.text.primary, fontWeight: typography.weight.medium }}>
                                {q.question}
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2], marginLeft: spacing[10] }}>
                            {q.options.map((option, oIndex) => {
                                const isSelected = userAnswer === oIndex;
                                const isCorrectOption = oIndex === q.correct;

                                let bgColor = t.bg.tertiary;
                                let borderColor = t.border.medium;
                                let textColor = t.text.secondary;

                                if (showResults) {
                                    if (isCorrectOption) {
                                        bgColor = t.accent.successLight;
                                        borderColor = t.accent.success;
                                        textColor = t.text.primary;
                                    } else if (isSelected && !isCorrectOption) {
                                        bgColor = t.accent.errorLight;
                                        borderColor = t.accent.error;
                                        textColor = t.text.primary;
                                    }
                                } else if (isSelected) {
                                    bgColor = t.accent.infoLight;
                                    borderColor = t.accent.info;
                                    textColor = t.text.primary;
                                }

                                return (
                                    <button type="button"
                                        key={oIndex}
                                        onClick={() => handleAnswer(qIndex, oIndex)}
                                        disabled={showResults}
                                        style={{
                                            background: bgColor,
                                            border: `1px solid ${borderColor}`,
                                            borderRadius: borderRadius.lg,
                                            padding: `${spacing[3]} ${spacing[4]}`,
                                            textAlign: 'left',
                                            cursor: showResults ? 'default' : 'pointer',
                                            color: textColor,
                                            fontSize: typography.size.sm,
                                            transition: `all ${transitions.fast}`,
                                        }}
                                    >
                                        {option}
                                    </button>
                                );
                            })}
                        </div>

                        {showResults && (
                            <div
                                style={{
                                    marginTop: spacing[4],
                                    marginLeft: spacing[10],
                                    padding: spacing[3],
                                    background: isCorrect ? t.accent.successLight : t.accent.warningLight,
                                    borderRadius: borderRadius.lg,
                                    fontSize: typography.size.sm,
                                    color: t.text.primary,
                                }}
                            >
                                <strong>{isCorrect ? '✓ Correct!' : '✗ Not quite.'}</strong> {q.explanation}
                            </div>
                        )}
                    </div>
                );
            })}

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: spacing[4],
                    marginTop: spacing[4],
                }}
            >
                {!showResults ? (
                    <button type="button"
                        onClick={handleShowResults}
                        disabled={Object.keys(answers).length < questions.length}
                        style={{
                            background: Object.keys(answers).length < questions.length ? t.bg.tertiary : t.accent.primary,
                            color: Object.keys(answers).length < questions.length ? t.text.tertiary : t.text.inverse,
                            border: 'none',
                            borderRadius: borderRadius.lg,
                            padding: `${spacing[3]} ${spacing[6]}`,
                            fontSize: typography.size.base,
                            fontWeight: typography.weight.semibold,
                            cursor: Object.keys(answers).length < questions.length ? 'not-allowed' : 'pointer',
                            transition: `all ${transitions.fast}`,
                        }}
                    >
                        Check Answers ({Object.keys(answers).length}/{questions.length})
                    </button>
                ) : (
                    <>
                        <div
                            style={{
                                background: score === questions.length ? t.accent.successLight : t.bg.tertiary,
                                color: score === questions.length ? t.accent.success : t.text.primary,
                                borderRadius: borderRadius.lg,
                                padding: `${spacing[3]} ${spacing[6]}`,
                                fontSize: typography.size.lg,
                                fontWeight: typography.weight.bold,
                            }}
                        >
                            Score: {score}/{questions.length}
                        </div>
                        <button type="button"
                            onClick={handleReset}
                            style={{
                                background: t.bg.tertiary,
                                color: t.text.secondary,
                                border: `1px solid ${t.border.medium}`,
                                borderRadius: borderRadius.lg,
                                padding: `${spacing[3]} ${spacing[6]}`,
                                fontSize: typography.size.base,
                                fontWeight: typography.weight.medium,
                                cursor: 'pointer',
                                transition: `all ${transitions.fast}`,
                            }}
                        >
                            Try Again
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

// ============================================
// TAB NAVIGATION
// ============================================
const TabNav = ({ tabs, activeTab, onTabChange }) => {
    const t = theme.light;

    return (
        <div
            style={{
                display: 'flex',
                gap: spacing[1],
                background: t.bg.tertiary,
                borderRadius: borderRadius.xl,
                padding: spacing[1],
                marginBottom: spacing[6],
                flexWrap: 'wrap',
            }}
        >
            {tabs.map((tab) => (
                <button type="button"
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    style={{
                        flex: 1,
                        minWidth: '120px',
                        padding: `${spacing[3]} ${spacing[4]}`,
                        borderRadius: borderRadius.lg,
                        border: 'none',
                        background: activeTab === tab.id ? t.bg.primary : 'transparent',
                        color: activeTab === tab.id ? t.text.primary : t.text.secondary,
                        fontSize: typography.size.sm,
                        fontWeight: activeTab === tab.id ? typography.weight.semibold : typography.weight.medium,
                        cursor: 'pointer',
                        boxShadow: activeTab === tab.id ? t.shadow.sm : 'none',
                        transition: `all ${transitions.fast}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: spacing[2],
                    }}
                >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                </button>
            ))}
        </div>
    );
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function GraphicParametricEQ() {
    const t = theme.light;
    const [activeTab, setActiveTab] = useState('concept');
    const [graphicGains, setGraphicGains] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const [parametricBands, setParametricBands] = useState([
        { freq: 200, gain: 0, q: 2 },
        { freq: 1000, gain: 0, q: 2 },
        { freq: 5000, gain: 0, q: 2 },
    ]);

    const tabs = [
        { id: 'concept', label: 'Concept', icon: '' },
        { id: 'compare', label: 'Compare', icon: '' },
        { id: 'practice', label: 'In Practice', icon: '' },
        { id: 'quiz', label: 'Test Yourself', icon: '' },
    ];

    const handleGraphicPreset = (presetKey) => {
        setGraphicGains([...GRAPHIC_PRESETS[presetKey].gains]);
    };

    const updateParametricBand = (index, newBand) => {
        const newBands = [...parametricBands];
        newBands[index] = newBand;
        setParametricBands(newBands);
    };

    return (
        <div
            style={{
                maxWidth: '1100px',
                margin: '0 auto',
                padding: spacing[6],
                fontFamily: typography.fontFamily,
            }}
        >
            {/* Hero with video background */}
            <div style={{
                position: 'relative',
                overflow: 'hidden',
                width: '100vw',
                marginLeft: 'calc(-50vw + 50%)',
                marginBottom: spacing[8],
                minHeight: '200px',
            }}>
                <video aria-hidden="true"
                    autoPlay
                    muted
                    loop
                    playsInline
                    onLoadedData={(e) => { e.target.style.opacity = 1; }}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: 1,
                        transition: 'opacity 0.8s ease-out',
                    }}
                    poster="/eq-hero-poster.jpg"
                    src="/eq-hero.mp4"
                />
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to bottom, rgba(31,42,28,0.4) 0%, rgba(31,42,28,0.75) 100%)',
                }} />
                <div style={{
                    position: 'relative',
                    textAlign: 'center',
                    padding: `${spacing[10]} ${spacing[6]} ${spacing[8]}`,
                }}>
                    <h1 style={{
                        fontFamily: 'var(--font-fraunces), Georgia, serif',
                        fontSize: typography.size['3xl'],
                        fontWeight: typography.weight.bold,
                        color: '#ffffff',
                        marginBottom: spacing[2],
                        textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}>
                        Graphic vs Parametric EQ
                    </h1>
                    <p style={{
                        fontSize: typography.size.lg,
                        color: 'rgba(255,255,255,0.85)',
                        textShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    }}>
                        Compare two essential equaliser types through interactive exploration
                    </p>
                </div>
            </div>

            {/* Tab Navigation */}
            <TabNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Tab Content */}
            <div
                style={{
                    background: t.bg.primary,
                    borderRadius: borderRadius['2xl'],
                    padding: spacing[6],
                    boxShadow: t.shadow.md,
                }}
            >
                {/* ===== CONCEPT TAB ===== */}
                {activeTab === 'concept' && (
                    <div>
                        <h2
                            style={{
                                fontFamily: 'var(--font-fraunces), Georgia, serif',
                                fontSize: typography.size['2xl'],
                                fontWeight: typography.weight.semibold,
                                color: t.text.primary,
                                marginBottom: spacing[6],
                            }}
                        >
                            Understanding the Two Types
                        </h2>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: spacing[6] }}>
                            {/* Graphic EQ Card */}
                            <div
                                style={{
                                    background: `linear-gradient(135deg, ${CYAN}10 0%, ${CYAN}05 100%)`,
                                    border: `2px solid ${CYAN}40`,
                                    borderRadius: borderRadius.xl,
                                    padding: spacing[5],
                                }}
                            >
                                <h3
                                    style={{
                                        fontFamily: 'var(--font-fraunces), Georgia, serif',
                                        fontSize: typography.size.xl,
                                        fontWeight: typography.weight.semibold,
                                        color: CYAN,
                                        marginBottom: spacing[3],
                                    }}
                                >
                                    Graphic Equaliser
                                </h3>
                                <p style={{ color: t.text.secondary, marginBottom: spacing[4], lineHeight: typography.lineHeight.relaxed }}>
                                    A <strong>filter bank</strong> with many bands at fixed frequencies. You can only adjust the <strong>gain</strong> of each band.
                                </p>

                                <div
                                    style={{
                                        background: t.bg.tertiary,
                                        borderRadius: borderRadius.lg,
                                        padding: spacing[3],
                                        marginBottom: spacing[4],
                                    }}
                                >
                                    <p
                                        style={{
                                            fontSize: typography.size.sm,
                                            color: t.text.secondary,
                                            marginBottom: spacing[2],
                                            fontWeight: typography.weight.medium,
                                        }}
                                    >
                                         Key Concept:
                                    </p>
                                    <p style={{ fontSize: typography.size.lg, color: t.text.primary, fontWeight: typography.weight.semibold }}>
                                        Many bands, few controls
                                    </p>
                                </div>

                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    {[
                                        'Fixed centre frequencies',
                                        'Fixed Q per band',
                                        'Only gain is adjustable',
                                        'Parallel filter routing',
                                        '10, 20, or 30 bands common',
                                    ].map((item, i) => (
                                        <li
                                            key={i}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: spacing[2],
                                                marginBottom: spacing[2],
                                                color: t.text.secondary,
                                                fontSize: typography.size.sm,
                                            }}
                                        >
                                            <span style={{ color: CYAN }}>•</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>

                                <div style={{ marginTop: spacing[4] }}>
                                    <p
                                        style={{
                                            fontSize: typography.size.xs,
                                            color: t.text.tertiary,
                                            marginBottom: spacing[2],
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                        }}
                                    >
                                        Signal Flow (Parallel):
                                    </p>
                                    <SignalFlowDiagram type="parallel" isActive={true} />
                                </div>
                            </div>

                            {/* Parametric EQ Card */}
                            <div
                                style={{
                                    background: `linear-gradient(135deg, ${ORANGE}10 0%, ${ORANGE}05 100%)`,
                                    border: `2px solid ${ORANGE}40`,
                                    borderRadius: borderRadius.xl,
                                    padding: spacing[5],
                                }}
                            >
                                <h3
                                    style={{
                                        fontFamily: 'var(--font-fraunces), Georgia, serif',
                                        fontSize: typography.size.xl,
                                        fontWeight: typography.weight.semibold,
                                        color: ORANGE,
                                        marginBottom: spacing[3],
                                    }}
                                >
                                    Parametric Equaliser
                                </h3>
                                <p style={{ color: t.text.secondary, marginBottom: spacing[4], lineHeight: typography.lineHeight.relaxed }}>
                                    Fewer bands but <strong>full control</strong> over each: frequency, gain, AND Q (bandwidth).
                                </p>

                                <div
                                    style={{
                                        background: t.bg.tertiary,
                                        borderRadius: borderRadius.lg,
                                        padding: spacing[3],
                                        marginBottom: spacing[4],
                                    }}
                                >
                                    <p
                                        style={{
                                            fontSize: typography.size.sm,
                                            color: t.text.secondary,
                                            marginBottom: spacing[2],
                                            fontWeight: typography.weight.medium,
                                        }}
                                    >
                                         Key Concept:
                                    </p>
                                    <p style={{ fontSize: typography.size.lg, color: t.text.primary, fontWeight: typography.weight.semibold }}>
                                        Few bands, full control
                                    </p>
                                </div>

                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    {[
                                        'Adjustable centre frequency',
                                        'Adjustable Q (bandwidth)',
                                        'Adjustable gain',
                                        'Series filter routing',
                                        'Typically 3-7 bands',
                                    ].map((item, i) => (
                                        <li
                                            key={i}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: spacing[2],
                                                marginBottom: spacing[2],
                                                color: t.text.secondary,
                                                fontSize: typography.size.sm,
                                            }}
                                        >
                                            <span style={{ color: ORANGE }}>•</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>

                                <div style={{ marginTop: spacing[4] }}>
                                    <p
                                        style={{
                                            fontSize: typography.size.xs,
                                            color: t.text.tertiary,
                                            marginBottom: spacing[2],
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                        }}
                                    >
                                        Signal Flow (Series):
                                    </p>
                                    <SignalFlowDiagram type="series" isActive={true} />
                                </div>
                            </div>
                        </div>

                        <CopyableNote title="Key Definitions" variant="definition">
                            <p><strong>Graphic Equaliser:</strong> A filter bank with bandpass filters routed in parallel, with fixed centre frequencies separated by regular intervals (octave, half-octave, or third-octave). Only gain is adjustable per band.</p>
                            <br />
                            <p><strong>Parametric Equaliser:</strong> An equaliser with fewer bands but more parameters per band. Allows control of centre frequency, gain, and Q for each band. Filters are routed in series.</p>
                        </CopyableNote>

                        <CopyableNote title="Exam Tip" variant="exam">
                            <p>A common exam question format: "Explain TWO advantages of parametric EQ over graphic EQ."</p>
                            <p>Answer: (1) Adjustable centre frequency for precise targeting, (2) Adjustable Q for controlling the width of the affected range.</p>
                        </CopyableNote>
                    </div>
                )}

                {/* ===== COMPARE TAB ===== */}
                {activeTab === 'compare' && (
                    <div>
                        <h2
                            style={{
                                fontFamily: 'var(--font-fraunces), Georgia, serif',
                                fontSize: typography.size['2xl'],
                                fontWeight: typography.weight.semibold,
                                color: t.text.primary,
                                marginBottom: spacing[6],
                            }}
                        >
                            Side-by-Side Comparison
                        </h2>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: spacing[6] }}>
                            {/* Graphic EQ Panel */}
                            <div
                                style={{
                                    background: t.bg.secondary,
                                    borderRadius: borderRadius.xl,
                                    padding: spacing[5],
                                    border: `2px solid ${CYAN}30`,
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[4] }}>
                                    <h3 style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: CYAN }}>
                                        10-Band Graphic EQ
                                    </h3>
                                    <span
                                        style={{
                                            background: `${CYAN}20`,
                                            color: CYAN,
                                            padding: `${spacing[1]} ${spacing[3]}`,
                                            borderRadius: borderRadius.full,
                                            fontSize: typography.size.xs,
                                        }}
                                    >
                                        Octave Bands
                                    </span>
                                </div>

                                {/* Presets */}
                                <div style={{ display: 'flex', gap: spacing[2], marginBottom: spacing[4], flexWrap: 'wrap', alignItems: 'center' }}>
                                    {Object.entries(GRAPHIC_PRESETS).map(([key, preset]) => (
                                        <button type="button"
                                            key={key}
                                            onClick={() => handleGraphicPreset(key)}
                                            style={{
                                                background: t.bg.tertiary,
                                                border: `1px solid ${t.border.medium}`,
                                                borderRadius: borderRadius.md,
                                                padding: `${spacing[1]} ${spacing[3]}`,
                                                fontSize: typography.size.xs,
                                                color: t.text.secondary,
                                                cursor: 'pointer',
                                                transition: `all ${transitions.fast}`,
                                            }}
                                        >
                                            {preset.name}
                                        </button>
                                    ))}
                                    <div style={{ marginLeft: 'auto' }}>
                                        <ProductionCopyButton
                                            accent={t.accent.primary}
                                            buildContent={(mode, learnMode) => {
                                                const matchedPreset = Object.values(GRAPHIC_PRESETS).find(p =>
                                                    p.gains.every((g, i) => g === graphicGains[i])
                                                );
                                                return buildEQCopyMarkdown({
                                                    bands: GRAPHIC_EQ_BANDS,
                                                    gains: graphicGains,
                                                    presetName: matchedPreset?.name,
                                                    quizResults: null,
                                                    mode, learnMode,
                                                });
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Frequency Response */}
                                <div style={{ marginBottom: spacing[4] }}>
                                    <FrequencyResponseSVG gains={graphicGains} bands={GRAPHIC_EQ_BANDS} type="graphic" />
                                </div>

                                {/* Sliders */}
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        padding: `${spacing[3]} ${spacing[2]}`,
                                        background: t.bg.tertiary,
                                        borderRadius: borderRadius.lg,
                                        overflowX: 'auto',
                                    }}
                                >
                                    {GRAPHIC_EQ_BANDS.map((band, i) => (
                                        <GraphicEQSlider
                                            key={band.freq}
                                            band={band}
                                            gain={graphicGains[i]}
                                            onChange={(gain) => {
                                                const newGains = [...graphicGains];
                                                newGains[i] = gain;
                                                setGraphicGains(newGains);
                                            }}
                                        />
                                    ))}
                                </div>

                                <div
                                    style={{
                                        marginTop: spacing[4],
                                        padding: spacing[3],
                                        background: `${CYAN}10`,
                                        borderRadius: borderRadius.lg,
                                        fontSize: typography.size.sm,
                                        color: t.text.secondary,
                                    }}
                                >
                                    <strong style={{ color: CYAN }}>Notice:</strong> You can only move sliders up/down (gain). The frequencies are fixed!
                                </div>
                            </div>

                            {/* Parametric EQ Panel */}
                            <div
                                style={{
                                    background: t.bg.secondary,
                                    borderRadius: borderRadius.xl,
                                    padding: spacing[5],
                                    border: `2px solid ${ORANGE}30`,
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[4] }}>
                                    <h3 style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: ORANGE }}>
                                        3-Band Parametric EQ
                                    </h3>
                                    <span
                                        style={{
                                            background: `${ORANGE}20`,
                                            color: ORANGE,
                                            padding: `${spacing[1]} ${spacing[3]}`,
                                            borderRadius: borderRadius.full,
                                            fontSize: typography.size.xs,
                                        }}
                                    >
                                        Full Control
                                    </span>
                                </div>

                                {/* Frequency Response */}
                                <div style={{ marginBottom: spacing[4] }}>
                                    <FrequencyResponseSVG gains={[]} bands={[]} type="parametric" parametricBands={parametricBands} />
                                </div>

                                {/* Band Controls */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
                                    {parametricBands.map((band, i) => (
                                        <ParametricEQBand
                                            key={i}
                                            band={band}
                                            index={i}
                                            onChange={(newBand) => updateParametricBand(i, newBand)}
                                        />
                                    ))}
                                </div>

                                <div
                                    style={{
                                        marginTop: spacing[4],
                                        padding: spacing[3],
                                        background: `${ORANGE}10`,
                                        borderRadius: borderRadius.lg,
                                        fontSize: typography.size.sm,
                                        color: t.text.secondary,
                                    }}
                                >
                                    <strong style={{ color: ORANGE }}>Challenge:</strong> Try targeting exactly 847Hz. With parametric EQ, you can!
                                </div>
                            </div>
                        </div>

                        <CopyableNote title="Key Insight" variant="key">
                            <p><strong>Same Problem, Different Approach:</strong> If you need to boost 1kHz, a graphic EQ has a slider right there. But if you need to cut 847Hz specifically, the graphic EQ forces you to use 800Hz or 1kHz - parametric EQ lets you dial in exactly 847Hz.</p>
                        </CopyableNote>
                    </div>
                )}

                {/* ===== IN PRACTICE TAB ===== */}
                {activeTab === 'practice' && (
                    <div>
                        <h2
                            style={{
                                fontFamily: 'var(--font-fraunces), Georgia, serif',
                                fontSize: typography.size['2xl'],
                                fontWeight: typography.weight.semibold,
                                color: t.text.primary,
                                marginBottom: spacing[6],
                            }}
                        >
                            When to Use Each Type
                        </h2>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: spacing[6] }}>
                            {/* Live Sound Scenario */}
                            <div
                                style={{
                                    background: t.bg.secondary,
                                    borderRadius: borderRadius.xl,
                                    padding: spacing[5],
                                    border: `1px solid ${t.border.subtle}`,
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], marginBottom: spacing[4] }}>
                                    <h3 style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: t.text.primary }}>
                                        Live Sound
                                    </h3>
                                </div>

                                <div
                                    style={{
                                        background: `${CYAN}10`,
                                        border: `1px solid ${CYAN}30`,
                                        borderRadius: borderRadius.lg,
                                        padding: spacing[4],
                                        marginBottom: spacing[4],
                                    }}
                                >
                                    <p style={{ fontSize: typography.size.sm, color: CYAN, fontWeight: typography.weight.semibold, marginBottom: spacing[2] }}>
                                        ✓ Graphic EQ Preferred
                                    </p>
                                </div>

                                <p style={{ color: t.text.secondary, marginBottom: spacing[4], lineHeight: typography.lineHeight.relaxed }}>
                                    <strong>Scenario:</strong> Room resonance causing feedback at multiple frequencies during a concert.
                                </p>

                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: spacing[4] }}>
                                    {[
                                        'Fast visual feedback - see the EQ curve instantly',
                                        'Quick adjustments during live show',
                                        'Room correction done in broad strokes',
                                        'Same frequencies across different venues',
                                    ].map((item, i) => (
                                        <li
                                            key={i}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: spacing[2],
                                                marginBottom: spacing[2],
                                                color: t.text.secondary,
                                                fontSize: typography.size.sm,
                                            }}
                                        >
                                            <span style={{ color: t.accent.success }}>✓</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>

                                <div
                                    style={{
                                        background: t.bg.tertiary,
                                        borderRadius: borderRadius.lg,
                                        padding: spacing[3],
                                        fontSize: typography.size.xs,
                                        color: t.text.tertiary,
                                    }}
                                >
                                    <strong>Common use:</strong> 31-band graphic EQ on main PA system for room correction
                                </div>
                            </div>

                            {/* Studio Mixing Scenario */}
                            <div
                                style={{
                                    background: t.bg.secondary,
                                    borderRadius: borderRadius.xl,
                                    padding: spacing[5],
                                    border: `1px solid ${t.border.subtle}`,
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], marginBottom: spacing[4] }}>
                                    <h3 style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: t.text.primary }}>
                                        Studio Mixing
                                    </h3>
                                </div>

                                <div
                                    style={{
                                        background: `${ORANGE}10`,
                                        border: `1px solid ${ORANGE}30`,
                                        borderRadius: borderRadius.lg,
                                        padding: spacing[4],
                                        marginBottom: spacing[4],
                                    }}
                                >
                                    <p style={{ fontSize: typography.size.sm, color: ORANGE, fontWeight: typography.weight.semibold, marginBottom: spacing[2] }}>
                                        ✓ Parametric EQ Preferred
                                    </p>
                                </div>

                                <p style={{ color: t.text.secondary, marginBottom: spacing[4], lineHeight: typography.lineHeight.relaxed }}>
                                    <strong>Scenario:</strong> Vocal sibilance (harsh 's' sounds) at a specific frequency needing surgical removal.
                                </p>

                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: spacing[4] }}>
                                    {[
                                        'Precise surgical corrections',
                                        'Time to dial in exact frequencies',
                                        'Each source has unique problems',
                                        'Greater flexibility for sound design',
                                    ].map((item, i) => (
                                        <li
                                            key={i}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: spacing[2],
                                                marginBottom: spacing[2],
                                                color: t.text.secondary,
                                                fontSize: typography.size.sm,
                                            }}
                                        >
                                            <span style={{ color: t.accent.success }}>✓</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>

                                <div
                                    style={{
                                        background: t.bg.tertiary,
                                        borderRadius: borderRadius.lg,
                                        padding: spacing[3],
                                        fontSize: typography.size.xs,
                                        color: t.text.tertiary,
                                    }}
                                >
                                    <strong>Common use:</strong> a parametric EQ plugin (e.g. EQ Eight in Ableton Live) for mixing individual tracks
                                </div>
                            </div>
                        </div>

                        <CopyableNote title="Exam Strategy" variant="exam">
                            <p>This is a great example of <strong>context-dependent tool selection</strong>. Exams love asking about "appropriate" choices - show you understand WHY different situations call for different tools.</p>
                            <br />
                            <p><strong>Don't assume parametric is always "better".</strong> Graphic EQ is excellent for quick overall tone shaping and is very intuitive. Parametric is better for surgical precision. Use the right tool for the job!</p>
                        </CopyableNote>

                        <div
                            style={{
                                marginTop: spacing[6],
                                background: t.bg.secondary,
                                borderRadius: borderRadius.xl,
                                padding: spacing[5],
                            }}
                        >
                            <h3 style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: t.text.primary, marginBottom: spacing[4] }}>
                                Quick Reference Table
                            </h3>

                            <div style={{ overflowX: 'auto' }}>
                                <table
                                    style={{
                                        width: '100%',
                                        borderCollapse: 'collapse',
                                        fontSize: typography.size.sm,
                                    }}
                                >
                                    <thead>
                                        <tr style={{ background: t.bg.tertiary }}>
                                            <th style={{ padding: spacing[3], textAlign: 'left', borderBottom: `1px solid ${t.border.medium}` }}>
                                                Feature
                                            </th>
                                            <th
                                                style={{
                                                    padding: spacing[3],
                                                    textAlign: 'center',
                                                    borderBottom: `1px solid ${t.border.medium}`,
                                                    color: CYAN,
                                                }}
                                            >
                                                Graphic EQ
                                            </th>
                                            <th
                                                style={{
                                                    padding: spacing[3],
                                                    textAlign: 'center',
                                                    borderBottom: `1px solid ${t.border.medium}`,
                                                    color: ORANGE,
                                                }}
                                            >
                                                Parametric EQ
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            ['Number of bands', '10-30 (many)', '3-7 (few)'],
                                            ['Frequency control', 'Fixed', 'Adjustable'],
                                            ['Q control', 'Fixed', 'Adjustable'],
                                            ['Signal routing', 'Parallel', 'Series'],
                                            ['Speed of use', 'Fast', 'Slower'],
                                            ['Precision', 'Lower', 'Higher'],
                                            ['Visual feedback', 'Excellent', 'Moderate'],
                                            ['Best for', 'Live sound, room EQ', 'Mixing, mastering'],
                                        ].map(([feature, graphic, parametric], i) => (
                                            <tr key={i} style={{ background: i % 2 === 0 ? t.bg.primary : t.bg.secondary }}>
                                                <td style={{ padding: spacing[3], borderBottom: `1px solid ${t.border.subtle}`, color: t.text.secondary }}>
                                                    {feature}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: spacing[3],
                                                        textAlign: 'center',
                                                        borderBottom: `1px solid ${t.border.subtle}`,
                                                        color: t.text.secondary,
                                                    }}
                                                >
                                                    {graphic}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: spacing[3],
                                                        textAlign: 'center',
                                                        borderBottom: `1px solid ${t.border.subtle}`,
                                                        color: t.text.secondary,
                                                    }}
                                                >
                                                    {parametric}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== QUIZ TAB ===== */}
                {activeTab === 'quiz' && (
                    <div>
                        <h2
                            style={{
                                fontFamily: 'var(--font-fraunces), Georgia, serif',
                                fontSize: typography.size['2xl'],
                                fontWeight: typography.weight.semibold,
                                color: t.text.primary,
                                marginBottom: spacing[2],
                            }}
                        >
                            Test Your Understanding
                        </h2>
                        <p style={{ color: t.text.secondary, marginBottom: spacing[6] }}>
                            Answer all questions, then check your results.
                        </p>

                        <Quiz questions={QUIZ_QUESTIONS} />
                    </div>
                )}
            </div>
        </div>
    );
}
