'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { typography, spacing, borderRadius, transitions } from '@/lib/theme';

// ─── Design Tokens (light, warm, Ableton-inspired) ──────────────────────────

const COLORS = {
    bg: '#f5f4f2',
    surface: '#FFFFFF',
    text: '#1a1a2e',
    textSecondary: '#4a4f5a',
    textHint: '#8b909a',
    border: '#d1d5db',
    borderStrong: '#1a1a2e',
    // section accent colors — tiered by complexity
    easy: '#059669',      // green  — Threshold, Ratio
    medium: '#d97706',    // amber  — Attack, Release
    advanced: '#7c3aed',  // purple — Makeup Gain, Knee
    mastery: '#0891b2',   // teal   — Full Compressor (section 4)
};

const SECTION_ACCENTS = {
    1: COLORS.easy,
    2: COLORS.medium,
    3: COLORS.advanced,
    4: COLORS.mastery,
};

// ─── Presets ─────────────────────────────────────────────────────────────────

const PRESETS = [
    { name: 'Gentle Vocal', threshold: -18, ratio: 2.5, attack: 15, release: 150, knee: 10, makeupGain: 4, source: 'vocal' },
    { name: 'Punchy Drums', threshold: -12, ratio: 4, attack: 1, release: 80, knee: 0, makeupGain: 6, source: 'drums' },
    { name: 'Heavy Squeeze', threshold: -30, ratio: 12, attack: 5, release: 200, knee: 0, makeupGain: 12, source: 'bass' },
    { name: 'Bus Glue', threshold: -8, ratio: 2, attack: 30, release: 250, knee: 15, makeupGain: 2, source: 'mix' },
];

// ─── Source Configurations ──────────────────────────────────────────────────

const SOURCE_CONFIGS = {
    drums: { oscFreq: 80, lfoFreq: 4, lfoDepth: 0.9, label: 'Drums' },
    vocal: { oscFreq: 220, lfoFreq: 2, lfoDepth: 0.5, label: 'Vocal' },
    bass: { oscFreq: 60, lfoFreq: 1.5, lfoDepth: 0.6, label: 'Bass' },
    mix: { oscFreq: 150, lfoFreq: 3, lfoDepth: 0.7, label: 'Mix' },
};

// ─── Quiz ────────────────────────────────────────────────────────────────────

const QUIZ_QUESTIONS = [
    {
        question: 'What does the threshold control on a compressor determine?',
        options: ['How much the signal is boosted', 'The level above which compression begins', 'The speed of compression', 'The output volume'],
        correct: 1,
        explanation: 'The threshold sets the level (in dB) above which the compressor starts reducing gain. Signals below the threshold pass through unaffected.',
    },
    {
        question: 'A signal exceeds the threshold by 8 dB with a 4:1 ratio. How far above the threshold is the output?',
        options: ['8 dB', '4 dB', '2 dB', '1 dB'],
        correct: 2,
        explanation: 'With a 4:1 ratio, for every 4 dB the input exceeds the threshold, only 1 dB comes through. So 8 dB excess ÷ 4 = 2 dB above threshold at the output.',
    },
    {
        question: 'Why would you use a slow attack time on a drum bus?',
        options: ['To remove all transients', 'To let the initial transient through before compression kicks in', 'To make the compressor react faster', 'To increase the ratio'],
        correct: 1,
        explanation: 'A slow attack lets the initial transient (the "snap" or "punch") pass through uncompressed, preserving the percussive feel while still controlling the sustain.',
    },
    {
        question: 'What is the purpose of makeup gain on a compressor?',
        options: ['To add more compression', 'To change the threshold', 'To restore perceived loudness lost during compression', 'To adjust the attack time'],
        correct: 2,
        explanation: 'Compression reduces the peak level of a signal. Makeup gain boosts the overall output to restore the perceived loudness, making quiet parts relatively louder.',
    },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function KeyConcept({ children, label }) {
    const [copied, setCopied] = useState(false);
    const contentRef = useRef(null);

    const handleCopy = useCallback(async () => {
        const text = contentRef.current ? contentRef.current.innerText : (typeof children === 'string' ? children : '');
        if (!text) return;
        const formatted = label ? `${label}: ${text}` : text;
        try {
            await navigator.clipboard.writeText(formatted);
        } catch {
            // fallback
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }, [children, label]);

    return (
        <div
            onClick={handleCopy}
            title="Click to copy this definition"
            style={{
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: borderRadius.lg,
                padding: `${spacing[4]} ${spacing[5]}`,
                marginBottom: spacing[3],
                position: 'relative',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing[3] }}>
                <div style={{ flex: 1 }}>
                    {label && (
                        <div style={{
                            fontSize: typography.size.sm, color: COLORS.text,
                            fontWeight: typography.weight.semibold, marginBottom: spacing[1],
                        }}>
                            {label}
                        </div>
                    )}
                    <div ref={contentRef} style={{
                        color: COLORS.textSecondary, fontSize: typography.size.sm,
                        lineHeight: typography.lineHeight.relaxed,
                    }}>
                        {children}
                    </div>
                </div>
                <span style={{
                    flexShrink: 0,
                    background: copied ? '#059669' : COLORS.bg,
                    color: copied ? '#FFFFFF' : COLORS.textHint,
                    fontSize: typography.size.xs,
                    fontWeight: typography.weight.medium,
                    padding: `${spacing[1]} ${spacing[3]}`,
                    borderRadius: '100px',
                    border: `1px solid ${copied ? '#059669' : COLORS.border}`,
                    transition: 'all 0.2s ease',
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
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            // fallback
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [notes, title]);

    return (
        <button
            onClick={handleCopy}
            style={{
                display: 'flex', alignItems: 'center', gap: spacing[2],
                width: '100%',
                background: copied ? '#059669' : COLORS.text,
                border: 'none',
                borderRadius: borderRadius.lg,
                padding: `${spacing[3]} ${spacing[5]}`,
                cursor: 'pointer',
                fontFamily: typography.fontFamily,
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semibold,
                color: '#FFFFFF',
                marginTop: spacing[4],
                transition: 'all 0.2s ease',
                justifyContent: 'center',
            }}
        >
            <span style={{ fontSize: '0.9rem' }}>{copied ? '\u2713' : '\uD83D\uDCCB'}</span>
            {copied ? 'Copied to clipboard!' : 'Copy all definitions to notes'}
        </button>
    );
}

function InteractiveBox({ children, hint }) {
    return (
        <div style={{ marginBottom: spacing[6] }}>
            <div style={{
                border: `3px solid ${COLORS.borderStrong}`,
                borderRadius: borderRadius.lg,
                padding: spacing[5],
                background: COLORS.surface,
            }}>
                {children}
            </div>
            {hint && (
                <p style={{
                    color: COLORS.textHint, fontSize: typography.size.xs,
                    textAlign: 'center', marginTop: spacing[2],
                    lineHeight: typography.lineHeight.normal,
                }}>
                    {hint}
                </p>
            )}
        </div>
    );
}

function CompressorControl({ label, value, min, max, step, onChange, unit = '', color = COLORS.text, tierColor }) {
    const displayVal = step < 0.01 ? value.toFixed(3) : step < 1 ? value.toFixed(1) : Math.round(value);

    const handleChange = useCallback((e) => {
        onChange(parseFloat(e.target.value));
    }, [onChange]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[1], flex: 1, minWidth: '120px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <label style={{ color: COLORS.textSecondary, fontSize: typography.size.xs, fontWeight: typography.weight.medium, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {tierColor && <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: tierColor, flexShrink: 0 }} />}
                    {label}
                </label>
                <span style={{ color: COLORS.text, fontSize: typography.size.xs, fontFamily: typography.fontFamilyMono }}>{displayVal}{unit}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={handleChange}
                style={{ width: '100%', accentColor: color, cursor: 'pointer', height: '6px' }}
            />
        </div>
    );
}

// ─── SVG Visualizations ─────────────────────────────────────────────────────

function TransferCurveSVG({ threshold, ratio, knee = 0, makeupGain = 0, width = 400, height = 300, accentColor = COLORS.easy }) {
    const pad = { top: 20, right: 20, bottom: 35, left: 45 };
    const innerW = width - pad.left - pad.right;
    const innerH = height - pad.top - pad.bottom;

    const minDb = -60;
    const maxDb = 0;
    const range = maxDb - minDb;

    const dbToX = (db) => pad.left + ((db - minDb) / range) * innerW;
    const dbToY = (db) => pad.top + ((maxDb - db) / range) * innerH;

    // Build transfer curve points
    const points = [];
    for (let inputDb = minDb; inputDb <= maxDb; inputDb += 0.5) {
        let outputDb;
        const excess = inputDb - threshold;

        if (knee > 0 && Math.abs(excess) < knee / 2) {
            // Soft knee region
            const kneeRange = knee;
            const t = (excess + kneeRange / 2) / kneeRange;
            const effectiveRatio = 1 + (ratio - 1) * t;
            outputDb = threshold + (excess / effectiveRatio);
        } else if (inputDb > threshold) {
            // Above threshold — compress
            outputDb = threshold + excess / ratio;
        } else {
            // Below threshold — unity
            outputDb = inputDb;
        }

        outputDb += makeupGain;
        outputDb = Math.max(minDb, Math.min(maxDb + 12, outputDb));
        points.push({ x: dbToX(inputDb), y: dbToY(outputDb) });
    }

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    // Unity line (1:1)
    const unityD = `M${dbToX(minDb).toFixed(1)},${dbToY(minDb).toFixed(1)} L${dbToX(maxDb).toFixed(1)},${dbToY(maxDb).toFixed(1)}`;

    // Grid marks
    const dbMarks = [-48, -36, -24, -12, 0];

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
            <rect width={width} height={height} fill="#1a1a2e" rx={6} />

            {/* Grid */}
            {dbMarks.map(db => (
                <g key={db}>
                    <line x1={dbToX(db)} y1={pad.top} x2={dbToX(db)} y2={height - pad.bottom} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
                    <line x1={pad.left} y1={dbToY(db)} x2={width - pad.right} y2={dbToY(db)} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
                    <text x={dbToX(db)} y={height - 8} fill="rgba(255,255,255,0.35)" fontSize={9} textAnchor="middle" fontFamily={typography.fontFamilyMono}>
                        {db}
                    </text>
                    <text x={pad.left - 6} y={dbToY(db) + 3} fill="rgba(255,255,255,0.35)" fontSize={9} textAnchor="end" fontFamily={typography.fontFamilyMono}>
                        {db}
                    </text>
                </g>
            ))}

            {/* Axis labels */}
            <text x={width / 2} y={height - 1} fill="rgba(255,255,255,0.4)" fontSize={10} textAnchor="middle" fontFamily={typography.fontFamily}>
                Input (dB)
            </text>
            <text x={10} y={height / 2} fill="rgba(255,255,255,0.4)" fontSize={10} textAnchor="middle" fontFamily={typography.fontFamily} transform={`rotate(-90, 10, ${height / 2})`}>
                Output (dB)
            </text>

            {/* Unity line */}
            <path d={unityD} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1} strokeDasharray="4,4" />

            {/* Threshold vertical line */}
            <line x1={dbToX(threshold)} y1={pad.top} x2={dbToX(threshold)} y2={height - pad.bottom} stroke={accentColor} strokeWidth={1} strokeDasharray="6,3" strokeOpacity={0.6} />

            {/* Knee region highlight */}
            {knee > 0 && (
                <rect
                    x={dbToX(threshold - knee / 2)}
                    y={pad.top}
                    width={dbToX(threshold + knee / 2) - dbToX(threshold - knee / 2)}
                    height={innerH}
                    fill={accentColor}
                    fillOpacity={0.06}
                />
            )}

            {/* Transfer curve */}
            <path d={pathD} fill="none" stroke={accentColor} strokeWidth={2.5} />

            {/* Threshold label */}
            <text x={dbToX(threshold) + 4} y={pad.top + 12} fill={accentColor} fontSize={9} fontFamily={typography.fontFamilyMono}>
                T: {threshold} dB
            </text>
        </svg>
    );
}

function ThresholdDiagramSVG({ threshold, width = 400, height = 160, accentColor = COLORS.easy }) {
    const pad = { top: 10, right: 10, bottom: 10, left: 10 };
    const innerW = width - pad.left - pad.right;
    const innerH = height - pad.top - pad.bottom;
    const mid = pad.top + innerH / 2;

    // Generate a waveform-like shape
    const pts = 200;
    const wavePoints = [];
    for (let i = 0; i <= pts; i++) {
        const x = pad.left + (i / pts) * innerW;
        // Mix of frequencies for a dynamic-looking signal
        const t = i / pts;
        const amp = (Math.sin(t * Math.PI * 4) * 0.5 + Math.sin(t * Math.PI * 12) * 0.3 + Math.sin(t * Math.PI * 28) * 0.15) * 0.8;
        const y = mid - amp * (innerH / 2);
        wavePoints.push({ x, y });
    }

    // Threshold level as y position (threshold is negative dB, so scale: 0dB = top, -60dB = center)
    const thresholdNorm = Math.abs(threshold) / 60; // 0 at 0dB, 1 at -60dB
    const thresholdAmplitude = 1 - thresholdNorm; // amplitude fraction
    const thresholdYTop = mid - thresholdAmplitude * (innerH / 2);
    const thresholdYBot = mid + thresholdAmplitude * (innerH / 2);

    const wavePath = wavePoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
            <rect width={width} height={height} fill="#1a1a2e" rx={6} />

            {/* Center line */}
            <line x1={pad.left} y1={mid} x2={width - pad.right} y2={mid} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />

            {/* Compression zone fill */}
            <rect x={pad.left} y={pad.top} width={innerW} height={thresholdYTop - pad.top} fill={accentColor} fillOpacity={0.08} />
            <rect x={pad.left} y={thresholdYBot} width={innerW} height={height - pad.bottom - thresholdYBot} fill={accentColor} fillOpacity={0.08} />

            {/* Threshold lines */}
            <line x1={pad.left} y1={thresholdYTop} x2={width - pad.right} y2={thresholdYTop} stroke={accentColor} strokeWidth={1.5} strokeDasharray="6,3" />
            <line x1={pad.left} y1={thresholdYBot} x2={width - pad.right} y2={thresholdYBot} stroke={accentColor} strokeWidth={1.5} strokeDasharray="6,3" />

            {/* Waveform */}
            <path d={wavePath} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2} />

            {/* Labels */}
            <text x={width - pad.right - 4} y={thresholdYTop - 4} fill={accentColor} fontSize={9} textAnchor="end" fontFamily={typography.fontFamilyMono}>
                Threshold
            </text>
            <text x={pad.left + 4} y={mid - 4} fill="rgba(255,255,255,0.3)" fontSize={9} fontFamily={typography.fontFamilyMono}>
                No compression
            </text>
            <text x={pad.left + 4} y={thresholdYTop + 12} fill={`${accentColor}`} fontSize={9} fontFamily={typography.fontFamilyMono} fillOpacity={0.7}>
                Compressed
            </text>
        </svg>
    );
}

function TimingDiagramSVG({ attack, release, width = 400, height = 200, accentColor = COLORS.medium }) {
    const pad = { top: 15, right: 15, bottom: 30, left: 15 };
    const innerW = width - pad.left - pad.right;
    const innerH = height - pad.top - pad.bottom;

    // Normalize attack/release to visual scale (ms → fraction of width)
    const totalMs = 600; // total time window
    const transientStart = 0.1; // transient starts at 10% of timeline
    const transientDuration = 0.05; // transient peak lasts 5%

    const attackFraction = Math.min((attack / totalMs), 0.4);
    const releaseFraction = Math.min((release / totalMs), 0.4);

    const xStart = pad.left + transientStart * innerW;
    const xAttackEnd = xStart + attackFraction * innerW;
    const xSustain = xStart + (transientStart + transientDuration + attackFraction) * innerW * 0.5;
    const xReleaseStart = pad.left + 0.55 * innerW;
    const xReleaseEnd = xReleaseStart + releaseFraction * innerW;

    const yTop = pad.top;
    const yBot = pad.top + innerH;
    const yMid = pad.top + innerH * 0.5;

    // Input signal (simplified transient)
    const inputPath = `M${pad.left},${yMid} L${xStart},${yMid} L${xStart},${yTop + 5} L${(xStart + 20)},${yTop + 5} L${(xStart + 40)},${yMid * 0.7} L${xReleaseStart},${yMid * 0.7} L${xReleaseStart + 10},${yMid} L${width - pad.right},${yMid}`;

    // Gain reduction envelope
    const grYMax = yTop + innerH * 0.25;
    const grPath = `M${pad.left},${yBot} L${xStart},${yBot} L${xStart + attackFraction * innerW * 0.8},${grYMax} L${xReleaseStart},${grYMax} L${xReleaseEnd},${yBot} L${width - pad.right},${yBot}`;

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
            <rect width={width} height={height} fill="#1a1a2e" rx={6} />

            {/* Center line */}
            <line x1={pad.left} y1={yMid} x2={width - pad.right} y2={yMid} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />

            {/* Input signal */}
            <path d={inputPath} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={2} />

            {/* GR envelope */}
            <path d={grPath} fill={accentColor} fillOpacity={0.15} stroke={accentColor} strokeWidth={2} />

            {/* Attack label */}
            <line x1={xStart} y1={yBot + 5} x2={xStart + attackFraction * innerW * 0.8} y2={yBot + 5} stroke={accentColor} strokeWidth={1.5} />
            <text x={(xStart + xStart + attackFraction * innerW * 0.8) / 2} y={height - 5} fill={accentColor} fontSize={9} textAnchor="middle" fontFamily={typography.fontFamilyMono}>
                Attack: {Math.round(attack)} ms
            </text>

            {/* Release label */}
            <line x1={xReleaseStart} y1={yBot + 5} x2={xReleaseEnd} y2={yBot + 5} stroke={accentColor} strokeWidth={1.5} strokeOpacity={0.7} />
            <text x={(xReleaseStart + xReleaseEnd) / 2} y={height - 5} fill={accentColor} fontSize={9} textAnchor="middle" fontFamily={typography.fontFamilyMono} fillOpacity={0.7}>
                Release: {Math.round(release)} ms
            </text>

            {/* Labels */}
            <text x={pad.left + 4} y={yTop + 12} fill="rgba(255,255,255,0.4)" fontSize={9} fontFamily={typography.fontFamily}>
                Input Signal
            </text>
            <text x={pad.left + 4} y={yBot - 4} fill={accentColor} fontSize={9} fontFamily={typography.fontFamily} fillOpacity={0.7}>
                Gain Reduction
            </text>
        </svg>
    );
}

function GainReductionMeter({ reductionDb, width = 32, height = 200 }) {
    const maxGR = 30; // max displayed GR in dB
    const clampedGR = Math.min(Math.abs(reductionDb), maxGR);
    const fillFraction = clampedGR / maxGR;
    const fillHeight = fillFraction * height;

    // Color gradient: green → amber → red
    let fillColor = '#059669';
    if (clampedGR > 15) fillColor = '#dc2626';
    else if (clampedGR > 6) fillColor = '#d97706';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing[1] }}>
            <div style={{ color: COLORS.textHint, fontSize: '9px', fontFamily: typography.fontFamilyMono, letterSpacing: '0.05em' }}>GR</div>
            <svg width={width} height={height} style={{ display: 'block' }}>
                <rect width={width} height={height} fill="#1a1a2e" rx={4} />
                {/* Fill from top */}
                <rect x={2} y={2} width={width - 4} height={fillHeight} fill={fillColor} fillOpacity={0.8} rx={2} />
                {/* Tick marks */}
                {[0, 6, 12, 18, 24, 30].map(db => {
                    const y = (db / maxGR) * height;
                    return (
                        <g key={db}>
                            <line x1={0} y1={y} x2={4} y2={y} stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
                            <text x={width - 2} y={y + 3} fill="rgba(255,255,255,0.3)" fontSize={7} textAnchor="end" fontFamily={typography.fontFamilyMono}>
                                {db}
                            </text>
                        </g>
                    );
                })}
            </svg>
            <div style={{ color: COLORS.text, fontSize: '10px', fontFamily: typography.fontFamilyMono, fontWeight: typography.weight.semibold }}>
                {clampedGR > 0 ? `-${clampedGR.toFixed(1)}` : '0.0'}
            </div>
        </div>
    );
}

function LevelMeter({ level, label, width = 24, height = 160, color = '#059669' }) {
    const fillFraction = Math.max(0, Math.min(1, (level + 60) / 60)); // -60dB to 0dB
    const fillHeight = fillFraction * height;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing[1] }}>
            <div style={{ color: COLORS.textHint, fontSize: '9px', fontFamily: typography.fontFamilyMono }}>{label}</div>
            <svg width={width} height={height} style={{ display: 'block' }}>
                <rect width={width} height={height} fill="#1a1a2e" rx={3} />
                <rect x={2} y={height - fillHeight} width={width - 4} height={fillHeight} fill={color} fillOpacity={0.7} rx={2} />
            </svg>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function CompressorExplorer() {
    // Navigation
    const [currentSection, setCurrentSection] = useState(1);
    const [visitedSections, setVisitedSections] = useState(new Set([1]));

    // Compressor params
    const [threshold, setThreshold] = useState(-20);
    const [ratio, setRatio] = useState(4);
    const [attack, setAttack] = useState(10);
    const [release, setRelease] = useState(100);
    const [knee, setKnee] = useState(0);
    const [makeupGain, setMakeupGain] = useState(0);
    const [source, setSource] = useState('drums');

    // Audio
    const [isPlaying, setIsPlaying] = useState(false);
    const [grAmount, setGrAmount] = useState(0);
    const [inputLevel, setInputLevel] = useState(-60);
    const [outputLevel, setOutputLevel] = useState(-60);

    // Quiz
    const [quizAnswers, setQuizAnswers] = useState({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);

    // Tab indicator
    const tabListRef = useRef(null);
    const tabBtnRefs = useRef({});
    const [tabIndicator, setTabIndicator] = useState({ x: 0, width: 0, ready: false });

    // Nav button hover states
    const [prevHovered, setPrevHovered] = useState(false);
    const [nextHovered, setNextHovered] = useState(false);

    // Audio refs
    const audioCtxRef = useRef(null);
    const oscRef = useRef(null);
    const lfoRef = useRef(null);
    const lfoGainRef = useRef(null);
    const compressorRef = useRef(null);
    const makeupGainRef = useRef(null);
    const preAnalyserRef = useRef(null);
    const postAnalyserRef = useRef(null);
    const animFrameRef = useRef(null);

    const ensureAudioCtx = useCallback(() => {
        if (audioCtxRef.current) return audioCtxRef.current;

        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        audioCtxRef.current = ctx;

        // Pre-compressor analyser
        const preAnalyser = ctx.createAnalyser();
        preAnalyser.fftSize = 256;
        preAnalyserRef.current = preAnalyser;

        // DynamicsCompressor
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = threshold;
        comp.ratio.value = ratio;
        comp.attack.value = attack / 1000;
        comp.release.value = release / 1000;
        comp.knee.value = knee;
        compressorRef.current = comp;

        // Makeup gain
        const mgGain = ctx.createGain();
        mgGain.gain.value = Math.pow(10, makeupGain / 20);
        makeupGainRef.current = mgGain;

        // Post-compressor analyser
        const postAnalyser = ctx.createAnalyser();
        postAnalyser.fftSize = 256;
        postAnalyserRef.current = postAnalyser;

        // Chain: preAnalyser → compressor → makeupGain → postAnalyser → destination
        preAnalyser.connect(comp);
        comp.connect(mgGain);
        mgGain.connect(postAnalyser);
        postAnalyser.connect(ctx.destination);

        return ctx;
    }, [threshold, ratio, attack, release, knee, makeupGain]);

    // Sync compressor params
    useEffect(() => {
        if (!compressorRef.current || !audioCtxRef.current) return;
        const ctx = audioCtxRef.current;
        const now = ctx.currentTime;
        compressorRef.current.threshold.setValueAtTime(threshold, now);
        compressorRef.current.ratio.setValueAtTime(ratio, now);
        compressorRef.current.attack.setValueAtTime(attack / 1000, now);
        compressorRef.current.release.setValueAtTime(release / 1000, now);
        compressorRef.current.knee.setValueAtTime(knee, now);
    }, [threshold, ratio, attack, release, knee]);

    useEffect(() => {
        if (!makeupGainRef.current || !audioCtxRef.current) return;
        makeupGainRef.current.gain.setValueAtTime(Math.pow(10, makeupGain / 20), audioCtxRef.current.currentTime);
    }, [makeupGain]);

    const startAudio = useCallback(async () => {
        const ctx = ensureAudioCtx();
        if (ctx.state === 'suspended') await ctx.resume();

        // Stop existing
        if (oscRef.current) {
            try { oscRef.current.stop(); } catch (e) {}
            oscRef.current.disconnect();
        }
        if (lfoRef.current) {
            try { lfoRef.current.stop(); } catch (e) {}
            lfoRef.current.disconnect();
        }
        if (lfoGainRef.current) {
            lfoGainRef.current.disconnect();
        }

        const config = SOURCE_CONFIGS[source];

        // Main oscillator
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(config.oscFreq, ctx.currentTime);
        oscRef.current = osc;

        // LFO for amplitude modulation (creates dynamic source)
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(config.lfoFreq, ctx.currentTime);
        lfoRef.current = lfo;

        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(config.lfoDepth, ctx.currentTime);
        lfoGainRef.current = lfoGain;

        const oscGain = ctx.createGain();
        oscGain.gain.value = 0.5;

        // Connect LFO → oscGain.gain (AM)
        lfo.connect(lfoGain);
        lfoGain.connect(oscGain.gain);

        // Connect osc → oscGain → preAnalyser
        osc.connect(oscGain);
        oscGain.connect(preAnalyserRef.current);

        osc.start();
        lfo.start();
        setIsPlaying(true);

        // Start metering
        const meterLoop = () => {
            if (compressorRef.current) {
                setGrAmount(compressorRef.current.reduction);
            }
            if (preAnalyserRef.current) {
                const buf = new Float32Array(preAnalyserRef.current.fftSize);
                preAnalyserRef.current.getFloatTimeDomainData(buf);
                let peak = 0;
                for (let i = 0; i < buf.length; i++) peak = Math.max(peak, Math.abs(buf[i]));
                setInputLevel(peak > 0 ? 20 * Math.log10(peak) : -60);
            }
            if (postAnalyserRef.current) {
                const buf = new Float32Array(postAnalyserRef.current.fftSize);
                postAnalyserRef.current.getFloatTimeDomainData(buf);
                let peak = 0;
                for (let i = 0; i < buf.length; i++) peak = Math.max(peak, Math.abs(buf[i]));
                setOutputLevel(peak > 0 ? 20 * Math.log10(peak) : -60);
            }
            animFrameRef.current = requestAnimationFrame(meterLoop);
        };
        animFrameRef.current = requestAnimationFrame(meterLoop);
    }, [ensureAudioCtx, source]);

    const stopAudio = useCallback(() => {
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = null;
        }
        if (oscRef.current) {
            try { oscRef.current.stop(); } catch (e) {}
            oscRef.current.disconnect();
            oscRef.current = null;
        }
        if (lfoRef.current) {
            try { lfoRef.current.stop(); } catch (e) {}
            lfoRef.current.disconnect();
            lfoRef.current = null;
        }
        if (lfoGainRef.current) {
            lfoGainRef.current.disconnect();
            lfoGainRef.current = null;
        }
        setIsPlaying(false);
        setGrAmount(0);
        setInputLevel(-60);
        setOutputLevel(-60);
    }, []);

    const loadPreset = useCallback((preset) => {
        setThreshold(preset.threshold);
        setRatio(preset.ratio);
        setAttack(preset.attack);
        setRelease(preset.release);
        setKnee(preset.knee);
        setMakeupGain(preset.makeupGain);
        setSource(preset.source);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            if (oscRef.current) { try { oscRef.current.stop(); } catch (e) {} oscRef.current.disconnect(); }
            if (lfoRef.current) { try { lfoRef.current.stop(); } catch (e) {} lfoRef.current.disconnect(); }
            if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
        };
    }, []);

    const goToSection = useCallback((s) => {
        stopAudio();
        setCurrentSection(s);
        setVisitedSections(prev => new Set([...prev, s]));
    }, [stopAudio]);

    // Position sliding tab indicator
    useEffect(() => {
        const list = tabListRef.current;
        const btn = tabBtnRefs.current[currentSection];
        if (!list || !btn) return;
        const listRect = list.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();
        setTabIndicator({ x: btnRect.left - listRect.left, width: btnRect.width, ready: true });
    }, [currentSection]);

    useEffect(() => {
        const handler = () => {
            const list = tabListRef.current;
            const btn = tabBtnRefs.current[currentSection];
            if (!list || !btn) return;
            const listRect = list.getBoundingClientRect();
            const btnRect = btn.getBoundingClientRect();
            setTabIndicator({ x: btnRect.left - listRect.left, width: btnRect.width, ready: true });
        };
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, [currentSection]);

    const accent = SECTION_ACCENTS[currentSection];

    // ─── Shared Styles ────────────────────────────────────────────────────────

    const pageStyle = {
        background: COLORS.bg,
        minHeight: '100vh',
        fontFamily: typography.fontFamily,
        color: COLORS.text,
    };

    const contentCol = {
        maxWidth: '640px',
        margin: '0 auto',
        padding: `0 ${spacing[6]}`,
    };

    const h2Style = {
        fontSize: typography.size['3xl'],
        fontWeight: typography.weight.bold,
        color: COLORS.text,
        lineHeight: typography.lineHeight.tight,
        marginBottom: spacing[4],
    };

    const bodyStyle = {
        fontSize: typography.size.base,
        color: COLORS.textSecondary,
        lineHeight: typography.lineHeight.relaxed,
        marginBottom: spacing[8],
    };

    const btnStyle = (active) => ({
        border: `1.5px solid ${active ? COLORS.text : COLORS.border}`,
        cursor: 'pointer',
        fontFamily: typography.fontFamily,
        fontWeight: typography.weight.medium,
        borderRadius: borderRadius.md,
        padding: `${spacing[2]} ${spacing[4]}`,
        background: active ? COLORS.text : COLORS.surface,
        color: active ? '#FFFFFF' : COLORS.textSecondary,
        fontSize: typography.size.sm,
        transition: `all ${transitions.fast}`,
    });

    const actionBtn = (color = accent) => ({
        border: 'none',
        cursor: 'pointer',
        fontFamily: typography.fontFamily,
        fontWeight: typography.weight.semibold,
        borderRadius: borderRadius.md,
        padding: `${spacing[3]} ${spacing[6]}`,
        background: color,
        color: '#FFFFFF',
        fontSize: typography.size.sm,
        transition: `all ${transitions.fast}`,
    });

    // ─── Section 1: What is Compression? ─────────────────────────────────────

    const renderSection1 = () => (
        <div style={contentCol}>
            <div style={{ paddingTop: spacing[12], marginBottom: spacing[10] }}>
                <h2 style={h2Style}>What is Compression?</h2>
                <p style={bodyStyle}>
                    A compressor reduces the dynamic range of a signal — making loud parts quieter and (with makeup gain)
                    quiet parts relatively louder. The two fundamental controls are <strong>threshold</strong> and <strong>ratio</strong>.
                </p>
            </div>

            <InteractiveBox hint="Drag the threshold and ratio sliders to see how the transfer curve changes">
                <div style={{ display: 'flex', gap: spacing[6], marginBottom: spacing[5], flexWrap: 'wrap' }}>
                    <CompressorControl label="Threshold" value={threshold} min={-60} max={0} step={1} onChange={setThreshold} unit=" dB" color={accent} tierColor={COLORS.easy} />
                    <CompressorControl label="Ratio" value={ratio} min={1} max={20} step={0.5} onChange={setRatio} unit=":1" color={accent} tierColor={COLORS.easy} />
                </div>

                <TransferCurveSVG threshold={threshold} ratio={ratio} accentColor={accent} />

                <div style={{ marginTop: spacing[4] }}>
                    <ThresholdDiagramSVG threshold={threshold} accentColor={accent} />
                </div>

                <div style={{ display: 'flex', gap: spacing[4], alignItems: 'center', marginTop: spacing[4], flexWrap: 'wrap' }}>
                    <button
                        onClick={() => isPlaying ? stopAudio() : startAudio()}
                        style={isPlaying ? actionBtn('#dc2626') : actionBtn(accent)}
                    >
                        {isPlaying ? 'Stop' : 'Play'}
                    </button>
                    {isPlaying && (
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: spacing[3] }}>
                            <LevelMeter level={inputLevel} label="IN" height={80} color="rgba(255,255,255,0.5)" />
                            <GainReductionMeter reductionDb={grAmount} height={80} />
                            <LevelMeter level={outputLevel} label="OUT" height={80} color={accent} />
                        </div>
                    )}
                </div>
            </InteractiveBox>

            {/* Educational content */}
            <div style={{ marginBottom: spacing[12] }}>
                <h3 style={{ fontSize: typography.size.xl, fontWeight: typography.weight.semibold, color: COLORS.text, marginBottom: spacing[5] }}>
                    Understanding threshold & ratio
                </h3>
                <KeyConcept label="Threshold">
                    The level (in dB) above which the compressor begins to act. Signals below the threshold pass through unaffected. A lower threshold means more of the signal gets compressed.
                </KeyConcept>
                <KeyConcept label="Ratio">
                    Determines how much compression is applied above the threshold. A 4:1 ratio means for every 4 dB the input exceeds the threshold, only 1 dB comes through at the output.
                </KeyConcept>
                <KeyConcept label="Transfer Curve">
                    A graph showing the relationship between input and output levels. Below the threshold the line follows 1:1 (unity). Above the threshold the line flattens according to the ratio.
                </KeyConcept>
                <KeyConcept label="Gain Reduction (GR)">
                    The amount (in dB) by which the compressor is reducing the signal at any given moment. More GR means more compression is being applied.
                </KeyConcept>

                <CopyAllNotes
                    title="Compression Basics"
                    notes={[
                        { label: 'Threshold', text: 'The level (in dB) above which the compressor begins to act. Signals below the threshold pass through unaffected. A lower threshold means more of the signal gets compressed.' },
                        { label: 'Ratio', text: 'Determines how much compression is applied above the threshold. A 4:1 ratio means for every 4 dB the input exceeds the threshold, only 1 dB comes through at the output.' },
                        { label: 'Transfer Curve', text: 'A graph showing the relationship between input and output levels. Below the threshold the line follows 1:1 (unity). Above the threshold the line flattens according to the ratio.' },
                        { label: 'Gain Reduction (GR)', text: 'The amount (in dB) by which the compressor is reducing the signal at any given moment. More GR means more compression is being applied.' },
                    ]}
                />

                <div style={{
                    background: `${accent}0A`, borderRadius: borderRadius.lg,
                    padding: `${spacing[4]} ${spacing[5]}`, marginTop: spacing[6],
                }}>
                    <p style={{ color: COLORS.textSecondary, fontSize: typography.size.sm, lineHeight: typography.lineHeight.relaxed, margin: 0 }}>
                        <strong style={{ color: COLORS.text }}>Exam tip:</strong> A ratio of ∞:1 is called <em>limiting</em> — no signal can exceed the threshold. This is the most extreme form of compression.
                    </p>
                </div>
            </div>
        </div>
    );

    // ─── Section 2: Attack & Release ─────────────────────────────────────────

    const renderSection2 = () => (
        <div style={contentCol}>
            <div style={{ paddingTop: spacing[12], marginBottom: spacing[10] }}>
                <h2 style={h2Style}>Attack & Release</h2>
                <p style={bodyStyle}>
                    Attack and release control <em>how quickly</em> the compressor responds. A slow attack lets transients
                    through before clamping down; a fast release recovers quickly, keeping the sound punchy.
                </p>
            </div>

            <InteractiveBox hint="Adjust attack and release to see how the compressor responds to transients">
                <div style={{ display: 'flex', gap: spacing[6], marginBottom: spacing[5], flexWrap: 'wrap' }}>
                    <CompressorControl label="Attack" value={attack} min={0.1} max={200} step={0.1} onChange={setAttack} unit=" ms" color={accent} tierColor={COLORS.medium} />
                    <CompressorControl label="Release" value={release} min={10} max={1000} step={1} onChange={setRelease} unit=" ms" color={accent} tierColor={COLORS.medium} />
                </div>

                <div style={{ display: 'flex', gap: spacing[6], marginBottom: spacing[5], flexWrap: 'wrap' }}>
                    <CompressorControl label="Threshold" value={threshold} min={-60} max={0} step={1} onChange={setThreshold} unit=" dB" color={COLORS.easy} tierColor={COLORS.easy} />
                    <CompressorControl label="Ratio" value={ratio} min={1} max={20} step={0.5} onChange={setRatio} unit=":1" color={COLORS.easy} tierColor={COLORS.easy} />
                </div>

                <TimingDiagramSVG attack={attack} release={release} accentColor={accent} />

                <div style={{ display: 'flex', gap: spacing[4], alignItems: 'center', marginTop: spacing[4], flexWrap: 'wrap' }}>
                    <button
                        onClick={() => isPlaying ? stopAudio() : startAudio()}
                        style={isPlaying ? actionBtn('#dc2626') : actionBtn(accent)}
                    >
                        {isPlaying ? 'Stop' : 'Play'}
                    </button>

                    <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap' }}>
                        {Object.entries(SOURCE_CONFIGS).map(([key, cfg]) => (
                            <button key={key} onClick={() => setSource(key)} style={btnStyle(source === key)}>
                                {cfg.label}
                            </button>
                        ))}
                    </div>

                    {isPlaying && (
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: spacing[3] }}>
                            <LevelMeter level={inputLevel} label="IN" height={80} color="rgba(255,255,255,0.5)" />
                            <GainReductionMeter reductionDb={grAmount} height={80} />
                            <LevelMeter level={outputLevel} label="OUT" height={80} color={accent} />
                        </div>
                    )}
                </div>
            </InteractiveBox>

            {/* Educational content */}
            <div style={{ marginBottom: spacing[12] }}>
                <h3 style={{ fontSize: typography.size.xl, fontWeight: typography.weight.semibold, color: COLORS.text, marginBottom: spacing[5] }}>
                    Shaping the response
                </h3>
                <KeyConcept label="Attack Time">
                    How quickly the compressor reaches full gain reduction after the signal exceeds the threshold. Measured in milliseconds. Fast attack clamps immediately; slow attack lets the transient through.
                </KeyConcept>
                <KeyConcept label="Release Time">
                    How quickly the compressor stops reducing gain after the signal drops below the threshold. Fast release recovers quickly (punchier); slow release gives a smoother, more sustained effect.
                </KeyConcept>
                <KeyConcept label="Transient Shaping">
                    By adjusting attack time, a compressor can either preserve or suppress transients. Drums often use slower attack to keep the "snap", while vocals may use faster attack for consistent level.
                </KeyConcept>

                <CopyAllNotes
                    title="Attack & Release"
                    notes={[
                        { label: 'Attack Time', text: 'How quickly the compressor reaches full gain reduction after the signal exceeds the threshold. Measured in milliseconds. Fast attack clamps immediately; slow attack lets the transient through.' },
                        { label: 'Release Time', text: 'How quickly the compressor stops reducing gain after the signal drops below the threshold. Fast release recovers quickly (punchier); slow release gives a smoother, more sustained effect.' },
                        { label: 'Transient Shaping', text: 'By adjusting attack time, a compressor can either preserve or suppress transients. Drums often use slower attack to keep the "snap", while vocals may use faster attack for consistent level.' },
                    ]}
                />

                <div style={{
                    background: `${accent}0A`, borderRadius: borderRadius.lg,
                    padding: `${spacing[4]} ${spacing[5]}`, marginTop: spacing[6],
                }}>
                    <p style={{ color: COLORS.textSecondary, fontSize: typography.size.sm, lineHeight: typography.lineHeight.relaxed, margin: 0 }}>
                        <strong style={{ color: COLORS.text }}>Exam tip:</strong> When asked about compressor settings for drums, mention slow attack (to preserve transients) and fast release (to recover before the next hit).
                    </p>
                </div>
            </div>
        </div>
    );

    // ─── Section 3: Knee & Makeup Gain ───────────────────────────────────────

    const renderSection3 = () => (
        <div style={contentCol}>
            <div style={{ paddingTop: spacing[12], marginBottom: spacing[10] }}>
                <h2 style={h2Style}>Knee & Makeup Gain</h2>
                <p style={bodyStyle}>
                    The <strong>knee</strong> controls how gradually compression engages around the threshold. <strong>Makeup gain</strong> restores
                    the overall level after compression has reduced the peaks.
                </p>
            </div>

            <InteractiveBox hint="Compare hard knee (0 dB) vs soft knee (30 dB) on the transfer curve, then add makeup gain">
                <div style={{ display: 'flex', gap: spacing[6], marginBottom: spacing[5], flexWrap: 'wrap' }}>
                    <CompressorControl label="Knee" value={knee} min={0} max={30} step={1} onChange={setKnee} unit=" dB" color={accent} tierColor={COLORS.advanced} />
                    <CompressorControl label="Makeup Gain" value={makeupGain} min={0} max={24} step={0.5} onChange={setMakeupGain} unit=" dB" color={accent} tierColor={COLORS.advanced} />
                </div>

                <div style={{ display: 'flex', gap: spacing[6], marginBottom: spacing[5], flexWrap: 'wrap' }}>
                    <CompressorControl label="Threshold" value={threshold} min={-60} max={0} step={1} onChange={setThreshold} unit=" dB" color={COLORS.easy} tierColor={COLORS.easy} />
                    <CompressorControl label="Ratio" value={ratio} min={1} max={20} step={0.5} onChange={setRatio} unit=":1" color={COLORS.easy} tierColor={COLORS.easy} />
                </div>

                <TransferCurveSVG threshold={threshold} ratio={ratio} knee={knee} makeupGain={makeupGain} accentColor={accent} />

                <div style={{ display: 'flex', gap: spacing[4], alignItems: 'center', marginTop: spacing[4], flexWrap: 'wrap' }}>
                    <button
                        onClick={() => isPlaying ? stopAudio() : startAudio()}
                        style={isPlaying ? actionBtn('#dc2626') : actionBtn(accent)}
                    >
                        {isPlaying ? 'Stop' : 'Play'}
                    </button>
                    {isPlaying && (
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: spacing[3] }}>
                            <LevelMeter level={inputLevel} label="IN" height={80} color="rgba(255,255,255,0.5)" />
                            <GainReductionMeter reductionDb={grAmount} height={80} />
                            <LevelMeter level={outputLevel} label="OUT" height={80} color={accent} />
                        </div>
                    )}
                </div>
            </InteractiveBox>

            {/* Educational content */}
            <div style={{ marginBottom: spacing[12] }}>
                <h3 style={{ fontSize: typography.size.xl, fontWeight: typography.weight.semibold, color: COLORS.text, marginBottom: spacing[5] }}>
                    Advanced controls
                </h3>
                <KeyConcept label="Hard Knee">
                    Compression engages abruptly at the threshold — the transfer curve has a sharp angle. More aggressive and audible. Good for limiting and parallel compression.
                </KeyConcept>
                <KeyConcept label="Soft Knee">
                    Compression engages gradually as the signal approaches the threshold — the transfer curve has a smooth curve. More transparent and musical. Good for vocals and mix bus.
                </KeyConcept>
                <KeyConcept label="Makeup Gain">
                    A gain stage after the compressor that boosts the overall output. Since compression reduces peaks, makeup gain restores perceived loudness — making quiet parts relatively louder.
                </KeyConcept>

                <CopyAllNotes
                    title="Knee & Makeup Gain"
                    notes={[
                        { label: 'Hard Knee', text: 'Compression engages abruptly at the threshold — the transfer curve has a sharp angle. More aggressive and audible. Good for limiting and parallel compression.' },
                        { label: 'Soft Knee', text: 'Compression engages gradually as the signal approaches the threshold — the transfer curve has a smooth curve. More transparent and musical. Good for vocals and mix bus.' },
                        { label: 'Makeup Gain', text: 'A gain stage after the compressor that boosts the overall output. Since compression reduces peaks, makeup gain restores perceived loudness — making quiet parts relatively louder.' },
                    ]}
                />

                <div style={{
                    background: `${accent}0A`, borderRadius: borderRadius.lg,
                    padding: `${spacing[4]} ${spacing[5]}`, marginTop: spacing[6],
                }}>
                    <p style={{ color: COLORS.textSecondary, fontSize: typography.size.sm, lineHeight: typography.lineHeight.relaxed, margin: 0 }}>
                        <strong style={{ color: COLORS.text }}>Exam tip:</strong> Soft knee is often described as "more musical" or "transparent" — use this language in your answers when comparing compression approaches.
                    </p>
                </div>
            </div>
        </div>
    );

    // ─── Section 4: Full Compressor ──────────────────────────────────────────

    const renderSection4 = () => {
        const quizScore = Object.values(quizAnswers).filter((a, i) => a === QUIZ_QUESTIONS[i]?.correct).length;

        return (
            <div style={{ ...contentCol, maxWidth: '800px' }}>
                <div style={{ paddingTop: spacing[12], marginBottom: spacing[10] }}>
                    <h2 style={h2Style}>Full Compressor</h2>
                    <p style={bodyStyle}>
                        Combine all six parameters. Try the presets to hear classic compression settings, then experiment
                        with your own. Watch the meters respond in real-time.
                    </p>
                </div>

                <InteractiveBox>
                    {/* Presets */}
                    <div style={{ marginBottom: spacing[5] }}>
                        <div style={{ color: COLORS.textHint, fontSize: typography.size.xs, fontWeight: typography.weight.medium, marginBottom: spacing[2], textTransform: 'uppercase', letterSpacing: typography.letterSpacing.wide }}>
                            Presets
                        </div>
                        <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap' }}>
                            {PRESETS.map(p => (
                                <button key={p.name} onClick={() => loadPreset(p)} style={btnStyle(false)}>
                                    {p.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Source selector */}
                    <div style={{ marginBottom: spacing[5] }}>
                        <div style={{ color: COLORS.textHint, fontSize: typography.size.xs, fontWeight: typography.weight.medium, marginBottom: spacing[2], textTransform: 'uppercase', letterSpacing: typography.letterSpacing.wide }}>
                            Source
                        </div>
                        <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap' }}>
                            {Object.entries(SOURCE_CONFIGS).map(([key, cfg]) => (
                                <button key={key} onClick={() => setSource(key)} style={btnStyle(source === key)}>
                                    {cfg.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* All controls */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: spacing[4], marginBottom: spacing[5] }}>
                        <CompressorControl label="Threshold" value={threshold} min={-60} max={0} step={1} onChange={setThreshold} unit=" dB" color={COLORS.easy} tierColor={COLORS.easy} />
                        <CompressorControl label="Ratio" value={ratio} min={1} max={20} step={0.5} onChange={setRatio} unit=":1" color={COLORS.easy} tierColor={COLORS.easy} />
                        <CompressorControl label="Attack" value={attack} min={0.1} max={200} step={0.1} onChange={setAttack} unit=" ms" color={COLORS.medium} tierColor={COLORS.medium} />
                        <CompressorControl label="Release" value={release} min={10} max={1000} step={1} onChange={setRelease} unit=" ms" color={COLORS.medium} tierColor={COLORS.medium} />
                        <CompressorControl label="Knee" value={knee} min={0} max={30} step={1} onChange={setKnee} unit=" dB" color={COLORS.advanced} tierColor={COLORS.advanced} />
                        <CompressorControl label="Makeup Gain" value={makeupGain} min={0} max={24} step={0.5} onChange={setMakeupGain} unit=" dB" color={COLORS.advanced} tierColor={COLORS.advanced} />
                    </div>

                    {/* Visualization row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: spacing[4], marginBottom: spacing[5] }}>
                        <div>
                            <div style={{ color: COLORS.textHint, fontSize: typography.size.xs, marginBottom: spacing[2] }}>Transfer Curve</div>
                            <TransferCurveSVG threshold={threshold} ratio={ratio} knee={knee} makeupGain={makeupGain} height={200} accentColor={accent} />
                        </div>
                        <div>
                            <div style={{ color: COLORS.textHint, fontSize: typography.size.xs, marginBottom: spacing[2] }}>Timing Response</div>
                            <TimingDiagramSVG attack={attack} release={release} height={200} accentColor={COLORS.medium} />
                        </div>
                    </div>

                    {/* Play + Meters */}
                    <div style={{ display: 'flex', gap: spacing[4], alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => isPlaying ? stopAudio() : startAudio()}
                            style={isPlaying ? actionBtn('#dc2626') : actionBtn(accent)}
                        >
                            {isPlaying ? 'Stop' : 'Play'}
                        </button>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: spacing[3] }}>
                            <LevelMeter level={inputLevel} label="IN" height={100} color="rgba(255,255,255,0.5)" />
                            <GainReductionMeter reductionDb={grAmount} height={100} />
                            <LevelMeter level={outputLevel} label="OUT" height={100} color={accent} />
                        </div>
                    </div>
                </InteractiveBox>

                {/* Quiz */}
                <div style={{ marginBottom: spacing[12] }}>
                    <h3 style={{ fontSize: typography.size.xl, fontWeight: typography.weight.semibold, color: COLORS.text, marginBottom: spacing[5] }}>
                        Quick check
                    </h3>

                    {QUIZ_QUESTIONS.map((q, qi) => (
                        <div key={qi} style={{ marginBottom: spacing[6] }}>
                            <p style={{ color: COLORS.text, fontSize: typography.size.sm, fontWeight: typography.weight.medium, marginBottom: spacing[3] }}>
                                {qi + 1}. {q.question}
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                                {q.options.map((opt, oi) => {
                                    const selected = quizAnswers[qi] === oi;
                                    const isCorrect = oi === q.correct;
                                    let bg = COLORS.surface;
                                    let borderCol = COLORS.border;
                                    let textCol = COLORS.textSecondary;

                                    if (quizSubmitted) {
                                        if (isCorrect) { bg = '#d1fae5'; borderCol = '#059669'; textCol = '#065f46'; }
                                        else if (selected) { bg = '#fee2e2'; borderCol = '#dc2626'; textCol = '#991b1b'; }
                                    } else if (selected) {
                                        bg = `${accent}12`; borderCol = accent; textCol = COLORS.text;
                                    }

                                    return (
                                        <button
                                            key={oi}
                                            onClick={() => { if (!quizSubmitted) setQuizAnswers(prev => ({ ...prev, [qi]: oi })); }}
                                            style={{
                                                border: `1.5px solid ${borderCol}`,
                                                cursor: quizSubmitted ? 'default' : 'pointer',
                                                fontFamily: typography.fontFamily,
                                                fontWeight: typography.weight.normal,
                                                borderRadius: borderRadius.md,
                                                padding: `${spacing[2]} ${spacing[4]}`,
                                                background: bg,
                                                color: textCol,
                                                fontSize: typography.size.sm,
                                                textAlign: 'left',
                                                transition: `all ${transitions.fast}`,
                                            }}
                                        >
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>
                            {quizSubmitted && (
                                <div style={{
                                    marginTop: spacing[2], padding: `${spacing[2]} ${spacing[3]}`,
                                    background: `${accent}08`, borderRadius: borderRadius.md,
                                    color: COLORS.textSecondary, fontSize: typography.size.xs,
                                    lineHeight: typography.lineHeight.relaxed,
                                }}>
                                    {q.explanation}
                                </div>
                            )}
                        </div>
                    ))}

                    {!quizSubmitted ? (
                        <button
                            onClick={() => setQuizSubmitted(true)}
                            disabled={Object.keys(quizAnswers).length < QUIZ_QUESTIONS.length}
                            style={{
                                ...actionBtn(accent),
                                opacity: Object.keys(quizAnswers).length < QUIZ_QUESTIONS.length ? 0.4 : 1,
                                cursor: Object.keys(quizAnswers).length < QUIZ_QUESTIONS.length ? 'not-allowed' : 'pointer',
                            }}
                        >
                            Check Answers
                        </button>
                    ) : (
                        <p style={{ color: quizScore === QUIZ_QUESTIONS.length ? '#059669' : accent, fontSize: typography.size.base, fontWeight: typography.weight.semibold }}>
                            {quizScore}/{QUIZ_QUESTIONS.length} correct{quizScore === QUIZ_QUESTIONS.length && ' — Perfect!'}
                        </p>
                    )}
                </div>
            </div>
        );
    };

    // ─── Main Render ─────────────────────────────────────────────────────────

    return (
        <div style={pageStyle}>
            {/* Navigation */}
            <nav style={{
                position: 'sticky', top: 0, zIndex: 50,
                background: 'rgba(245,244,242,0.95)', backdropFilter: 'blur(8px)',
                borderBottom: `1px solid ${COLORS.border}`,
                padding: `${spacing[3]} ${spacing[6]}`,
            }}>
                <div
                    ref={tabListRef}
                    style={{
                        maxWidth: '520px', margin: '0 auto',
                        display: 'flex', position: 'relative',
                        background: '#e8e7e5',
                        borderRadius: '100px',
                        padding: '4px',
                    }}
                >
                    {/* Sliding pill indicator */}
                    <div style={{
                        position: 'absolute',
                        top: '4px', bottom: '4px', left: '4px',
                        background: COLORS.surface,
                        borderRadius: '100px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
                        zIndex: 1,
                        width: tabIndicator.width ? `${tabIndicator.width}px` : 'auto',
                        transform: `translateX(${tabIndicator.x}px)`,
                        transition: tabIndicator.ready
                            ? 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                            : 'none',
                        willChange: 'transform, width',
                    }} />
                    {[
                        { n: 1, label: 'Basics' },
                        { n: 2, label: 'Timing' },
                        { n: 3, label: 'Knee & Gain' },
                        { n: 4, label: 'Full Compressor' },
                    ].map(s => (
                        <button
                            key={s.n}
                            ref={el => { tabBtnRefs.current[s.n] = el; }}
                            onClick={() => goToSection(s.n)}
                            style={{
                                flex: 1,
                                border: 'none', cursor: 'pointer',
                                fontFamily: typography.fontFamily,
                                fontWeight: currentSection === s.n ? typography.weight.semibold : typography.weight.medium,
                                borderRadius: '100px',
                                padding: `${spacing[2]} ${spacing[3]}`,
                                background: 'transparent',
                                color: currentSection === s.n ? COLORS.text : (visitedSections.has(s.n) ? COLORS.textSecondary : COLORS.textHint),
                                fontSize: typography.size.sm,
                                position: 'relative',
                                zIndex: 2,
                                transition: 'color 0.3s ease',
                                whiteSpace: 'nowrap',
                                userSelect: 'none',
                                WebkitTapHighlightColor: 'transparent',
                            }}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </nav>

            {/* Hero */}
            <div style={{
                maxWidth: '640px', margin: '0 auto',
                padding: `${spacing[16]} ${spacing[6]} ${spacing[6]}`,
                textAlign: 'center',
            }}>
                <h1 style={{
                    fontSize: typography.size['4xl'],
                    fontWeight: typography.weight.bold,
                    color: COLORS.text,
                    lineHeight: typography.lineHeight.tight,
                    marginBottom: spacing[4],
                }}>
                    Compressor Explorer
                </h1>
                <p style={{
                    color: COLORS.textSecondary,
                    fontSize: typography.size.lg,
                    lineHeight: typography.lineHeight.relaxed,
                    maxWidth: '480px', margin: '0 auto',
                }}>
                    Learn how compressors control dynamics. Adjust threshold, ratio, attack, release, knee and makeup gain — hear and see the results in real-time.
                </p>
            </div>

            {/* Current section */}
            {currentSection === 1 && renderSection1()}
            {currentSection === 2 && renderSection2()}
            {currentSection === 3 && renderSection3()}
            {currentSection === 4 && renderSection4()}

            {/* Bottom navigation */}
            <div style={{
                maxWidth: '640px', margin: '0 auto',
                padding: `${spacing[4]} ${spacing[6]} ${spacing[12]}`,
                display: 'flex', justifyContent: 'space-between',
            }}>
                {currentSection > 1 ? (
                    <button
                        onMouseEnter={() => setPrevHovered(true)}
                        onMouseLeave={() => setPrevHovered(false)}
                        onClick={() => goToSection(currentSection - 1)}
                        style={{
                            border: 'none', cursor: 'pointer', fontFamily: typography.fontFamily,
                            background: prevHovered
                                ? 'radial-gradient(circle at center, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)'
                                : 'transparent',
                            color: COLORS.textHint,
                            fontSize: typography.size.sm, padding: spacing[2],
                            borderRadius: borderRadius.md,
                            transition: 'background 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                    >
                        ← Previous
                    </button>
                ) : <div />}
                {currentSection < 4 && (
                    <button
                        onMouseEnter={() => setNextHovered(true)}
                        onMouseLeave={() => setNextHovered(false)}
                        onClick={() => goToSection(currentSection + 1)}
                        style={{
                            border: 'none', cursor: 'pointer', fontFamily: typography.fontFamily,
                            fontWeight: typography.weight.semibold,
                            background: nextHovered
                                ? `radial-gradient(circle at center, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%), ${COLORS.surface}`
                                : COLORS.surface,
                            color: COLORS.text,
                            fontSize: typography.size.sm, padding: `${spacing[3]} ${spacing[5]}`,
                            borderRadius: borderRadius.md,
                            border: `1px solid ${COLORS.border}`,
                            transition: 'background 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                    >
                        Next →
                    </button>
                )}
            </div>
        </div>
    );
}
