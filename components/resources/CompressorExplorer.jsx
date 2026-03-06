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

function DescriptionStrip({ threshold, ratio, attack, release, knee, makeupGain, grAmount, section = 'all' }) {
    const parts = [];

    // Threshold feedback (sections 1, 3, 4)
    if (section === 'all' || section === 1 || section === 3) {
        if (threshold >= -10) parts.push({ text: 'High threshold', detail: 'only the loudest peaks affected.', type: 'normal' });
        else if (threshold >= -25) parts.push({ text: 'Moderate threshold', detail: 'catching louder moments.', type: 'normal' });
        else if (threshold >= -40) parts.push({ text: 'Low threshold', detail: 'most of the signal is compressed.', type: 'warn' });
        else parts.push({ text: 'Very low threshold', detail: 'almost everything compressed, removing natural dynamics.', type: 'warn' });
    }

    // Ratio feedback (sections 1, 3, 4)
    if (section === 'all' || section === 1 || section === 3) {
        if (ratio <= 2) parts.push({ text: `Gentle ratio (${ratio}:1)`, detail: 'subtle, transparent.', type: 'good' });
        else if (ratio <= 4) parts.push({ text: `Moderate ratio (${ratio}:1)`, detail: 'standard for vocals/mix bus.', type: 'normal' });
        else if (ratio <= 8) parts.push({ text: `Heavy ratio (${ratio}:1)`, detail: 'significant squashing.', type: 'warn' });
        else if (ratio <= 12) parts.push({ text: `Very heavy (${ratio}:1)`, detail: 'approaching limiting.', type: 'warn' });
        else parts.push({ text: `Brick-wall limiting (${ratio}:1)`, detail: 'peaks are flattened.', type: 'warn' });
    }

    // Attack feedback (sections 2, 4)
    if (section === 'all' || section === 2) {
        if (attack < 2) parts.push({ text: 'Ultra-fast attack', detail: 'kills transients, drums lose punch.', type: 'warn' });
        else if (attack <= 30) parts.push({ text: 'Medium attack', detail: 'transients punch through.', type: 'good' });
        else parts.push({ text: 'Slow attack', detail: 'transients pass, only sustained sound compressed.', type: 'normal' });
    }

    // Release feedback (sections 2, 4)
    if (section === 'all' || section === 2) {
        if (release < 40) parts.push({ text: 'Fast release', detail: 'risk of audible pumping.', type: 'warn' });
        else if (release < 200) parts.push({ text: 'Natural release', detail: '', type: 'good' });
        else parts.push({ text: 'Slow release', detail: 'smooth, "glued" sound.', type: 'normal' });
    }

    // Extreme combos (section 4)
    if (section === 'all') {
        if (threshold <= -35 && ratio >= 8) {
            parts.push({ text: 'This would choke the signal', detail: 'flat, lifeless, heavily distorted.', type: 'warn' });
        } else if (threshold <= -25 && ratio >= 6 && attack < 3) {
            parts.push({ text: 'Aggressive', detail: 'transients killed, dynamics flattened.', type: 'warn' });
        }
    }

    // GR feedback (when playing)
    const absGR = Math.abs(grAmount);
    if (absGR > 0.5) {
        const label = absGR > 12 ? 'Extreme' : absGR > 6 ? 'Heavy' : absGR > 3 ? 'Moderate' : 'Light';
        parts.push({ text: `Peak GR: -${absGR.toFixed(1)} dB`, detail: `(${label})`, type: 'note' });
    }

    if (parts.length === 0) return null;

    const colorMap = {
        normal: COLORS.text,
        good: '#16a34a',
        warn: '#c44d20',
        note: COLORS.textHint,
    };

    return (
        <div style={{
            background: COLORS.bg,
            border: `1px solid ${COLORS.border}`,
            borderRadius: borderRadius.md,
            padding: `${spacing[2]} ${spacing[4]}`,
            marginTop: spacing[3],
            fontSize: typography.size.sm,
            color: COLORS.textSecondary,
            lineHeight: typography.lineHeight.relaxed,
        }}>
            {parts.map((p, i) => (
                <span key={i}>
                    {i > 0 && <span style={{ color: COLORS.textHint, margin: `0 ${spacing[2]}` }}>&middot;</span>}
                    <strong style={{ color: colorMap[p.type] || COLORS.text }}>{p.text}</strong>
                    {p.detail && ` — ${p.detail}`}
                </span>
            ))}
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

function CompactParam({ label, value, min, max, step, onChange, unit = '' }) {
    const displayVal = step < 0.01 ? value.toFixed(3) : step < 1 ? value.toFixed(1) : Math.round(value);

    const handleChange = useCallback((e) => {
        onChange(parseFloat(e.target.value));
    }, [onChange]);

    return (
        <div style={{
            background: '#fafaf9',
            border: '1px solid #eee',
            borderRadius: '8px',
            padding: '6px 8px',
            textAlign: 'center',
        }}>
            <div style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#aaa', fontWeight: 600, marginBottom: '1px' }}>
                {label}
            </div>
            <div>
                <span style={{ fontSize: '1rem', fontWeight: 700, fontFamily: typography.fontFamilyMono, color: '#1a1a2e' }}>
                    {displayVal}
                </span>
                <span style={{ fontSize: '0.55rem', color: '#ccc', fontWeight: 500 }}>{unit}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={handleChange}
                style={{ width: '100%', height: '3px', WebkitAppearance: 'none', background: '#e8e6e2', borderRadius: '2px', outline: 'none', marginTop: '4px', display: 'block', accentColor: '#FF6B35', cursor: 'pointer' }}
            />
        </div>
    );
}

// ─── SVG Visualizations ─────────────────────────────────────────────────────

function TransferCurveSVG({ threshold, ratio, knee = 0, makeupGain = 0, width = 500, height = 340, accentColor = COLORS.easy, onThresholdChange, onRatioChange }) {
    const svgRef = useRef(null);
    const draggingRef = useRef(null);
    const [hoveringDot, setHoveringDot] = useState(false);

    const pad = { top: 20, right: 20, bottom: 35, left: 45 };
    const innerW = width - pad.left - pad.right;
    const innerH = height - pad.top - pad.bottom;

    const minDb = -60;
    const maxDb = 0;
    const range = maxDb - minDb;

    const dbToX = (db) => pad.left + ((db - minDb) / range) * innerW;
    const dbToY = (db) => pad.top + ((maxDb - db) / range) * innerH;
    const xToDb = (x) => minDb + ((x - pad.left) / innerW) * range;
    const yToDb = (y) => maxDb - ((y - pad.top) / innerH) * range;

    // Compute output for a given input dB (used for threshold dot position)
    const compOut = (inputDb) => {
        const excess = inputDb - threshold;
        if (knee > 0 && Math.abs(excess) < knee / 2) {
            const t = (excess + knee / 2) / knee;
            const effectiveRatio = 1 + (ratio - 1) * t;
            return threshold + (excess / effectiveRatio);
        } else if (inputDb > threshold) {
            return threshold + excess / ratio;
        }
        return inputDb;
    };

    // SVG-space position from mouse/touch event
    const getSvgPoint = useCallback((e) => {
        const svg = svgRef.current;
        if (!svg) return { x: 0, y: 0 };
        const rect = svg.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: (clientX - rect.left) * (width / rect.width),
            y: (clientY - rect.top) * (height / rect.height),
        };
    }, [width, height]);

    const handlePointerDown = useCallback((e) => {
        if (!onThresholdChange && !onRatioChange) return;
        const p = getSvgPoint(e);
        const thX = dbToX(threshold);
        const thY = dbToY(compOut(threshold) + makeupGain);
        const dx = p.x - thX;
        const dy = p.y - thY;
        if (Math.sqrt(dx * dx + dy * dy) < 20) {
            draggingRef.current = 'threshold';
        } else if (p.x > thX + 5 && onRatioChange) {
            draggingRef.current = 'ratio';
        }
        if (draggingRef.current) e.preventDefault();
    }, [threshold, ratio, knee, makeupGain, onThresholdChange, onRatioChange, getSvgPoint]);

    const handlePointerMove = useCallback((e) => {
        if (!draggingRef.current) return;
        const p = getSvgPoint(e);
        if (draggingRef.current === 'threshold' && onThresholdChange) {
            const newThreshold = Math.round(Math.max(-60, Math.min(0, xToDb(p.x))));
            onThresholdChange(newThreshold);
        } else if (draggingRef.current === 'ratio' && onRatioChange) {
            const inDb = xToDb(p.x);
            if (inDb > threshold) {
                const outDb = yToDb(p.y) - makeupGain;
                const d = inDb - threshold;
                const od = outDb - threshold;
                if (od > 0 && d > 0) {
                    const newRatio = Math.round(Math.max(1, Math.min(20, d / od)) * 2) / 2;
                    onRatioChange(newRatio);
                }
            }
        }
    }, [threshold, makeupGain, onThresholdChange, onRatioChange, getSvgPoint]);

    const handlePointerUp = useCallback(() => {
        draggingRef.current = null;
    }, []);

    // Global move/up listeners for drag
    useEffect(() => {
        const move = (e) => handlePointerMove(e);
        const up = () => handlePointerUp();
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
        window.addEventListener('touchmove', move, { passive: false });
        window.addEventListener('touchend', up);
        return () => {
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', up);
            window.removeEventListener('touchmove', move);
            window.removeEventListener('touchend', up);
        };
    }, [handlePointerMove, handlePointerUp]);

    // Build transfer curve points
    const points = [];
    for (let inputDb = minDb; inputDb <= maxDb; inputDb += 0.5) {
        let outputDb = compOut(inputDb);
        outputDb += makeupGain;
        outputDb = Math.max(minDb, Math.min(maxDb + 12, outputDb));
        points.push({ x: dbToX(inputDb), y: dbToY(outputDb) });
    }

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const unityD = `M${dbToX(minDb).toFixed(1)},${dbToY(minDb).toFixed(1)} L${dbToX(maxDb).toFixed(1)},${dbToY(maxDb).toFixed(1)}`;
    const dbMarks = [-48, -36, -24, -12, 0];

    // Threshold dot position
    const thDotX = dbToX(threshold);
    const thDotY = dbToY(Math.max(minDb, Math.min(maxDb + 12, compOut(threshold) + makeupGain)));
    const isDraggable = onThresholdChange || onRatioChange;

    return (
        <svg
            ref={svgRef}
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            style={{ width: '100%', height: 'auto', display: 'block', cursor: isDraggable ? (hoveringDot ? 'grab' : 'crosshair') : 'default' }}
            onMouseDown={handlePointerDown}
            onTouchStart={handlePointerDown}
        >
            <rect width={width} height={height} fill="#fcfcfb" rx={6} stroke="#eae8e4" strokeWidth={1} />

            {/* Grid */}
            {dbMarks.map(db => (
                <g key={db}>
                    <line x1={dbToX(db)} y1={pad.top} x2={dbToX(db)} y2={height - pad.bottom} stroke={db % 20 === 0 ? '#e2e0dc' : '#eeede9'} strokeWidth={db % 20 === 0 ? 0.6 : 0.3} />
                    <line x1={pad.left} y1={dbToY(db)} x2={width - pad.right} y2={dbToY(db)} stroke={db % 20 === 0 ? '#e2e0dc' : '#eeede9'} strokeWidth={db % 20 === 0 ? 0.6 : 0.3} />
                    <text x={dbToX(db)} y={height - 8} fill="#888" fontSize={9} textAnchor="middle" fontFamily={typography.fontFamilyMono}>
                        {db}
                    </text>
                    <text x={pad.left - 6} y={dbToY(db) + 3} fill="#888" fontSize={9} textAnchor="end" fontFamily={typography.fontFamilyMono}>
                        {db}
                    </text>
                </g>
            ))}

            {/* Axis labels */}
            <text x={width / 2} y={height - 1} fill="#aaa" fontSize={10} textAnchor="middle" fontFamily={typography.fontFamily}>
                Input (dB)
            </text>
            <text x={10} y={height / 2} fill="#aaa" fontSize={10} textAnchor="middle" fontFamily={typography.fontFamily} transform={`rotate(-90, 10, ${height / 2})`}>
                Output (dB)
            </text>

            {/* Unity line */}
            <path d={unityD} fill="none" stroke="#dddbd7" strokeWidth={1} strokeDasharray="4,4" />

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

            {/* Threshold dot with glow */}
            {isDraggable && (
                <>
                    <circle cx={thDotX} cy={thDotY} r={14} fill={accentColor} fillOpacity={hoveringDot ? 0.15 : 0.08} />
                    <circle
                        cx={thDotX} cy={thDotY} r={7}
                        fill={accentColor} stroke="#fff" strokeWidth={2.5}
                        onMouseEnter={() => setHoveringDot(true)}
                        onMouseLeave={() => setHoveringDot(false)}
                        style={{ cursor: 'grab' }}
                    />
                </>
            )}

            {/* Threshold label */}
            <text x={dbToX(threshold) + (isDraggable ? 16 : 4)} y={isDraggable ? thDotY - 10 : pad.top + 12} fill={accentColor} fontSize={9} fontFamily={typography.fontFamilyMono}>
                T: {threshold} dB
            </text>
            {isDraggable && ratio > 1 && (
                <text x={dbToX(Math.min(threshold + 15, -5)) + 10} y={dbToY(Math.min(compOut(Math.min(threshold + 15, -5)) + makeupGain, maxDb)) - 10} fill="#666" fontSize={11} fontWeight="bold" fontFamily={typography.fontFamilyMono}>
                    {ratio}:1
                </text>
            )}
        </svg>
    );
}

function ThresholdDiagramSVG({ threshold, width = 500, height = 180, accentColor = COLORS.easy }) {
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
            <rect width={width} height={height} fill="#fcfcfb" rx={6} stroke="#eae8e4" strokeWidth={1} />

            {/* Center line */}
            <line x1={pad.left} y1={mid} x2={width - pad.right} y2={mid} stroke="#e8e6e2" strokeWidth={0.5} />

            {/* Compression zone fill */}
            <rect x={pad.left} y={pad.top} width={innerW} height={thresholdYTop - pad.top} fill={accentColor} fillOpacity={0.08} />
            <rect x={pad.left} y={thresholdYBot} width={innerW} height={height - pad.bottom - thresholdYBot} fill={accentColor} fillOpacity={0.08} />

            {/* Threshold lines */}
            <line x1={pad.left} y1={thresholdYTop} x2={width - pad.right} y2={thresholdYTop} stroke={accentColor} strokeWidth={1.5} strokeDasharray="6,3" />
            <line x1={pad.left} y1={thresholdYBot} x2={width - pad.right} y2={thresholdYBot} stroke={accentColor} strokeWidth={1.5} strokeDasharray="6,3" />

            {/* Waveform */}
            <path d={wavePath} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth={2} />

            {/* Labels */}
            <text x={width - pad.right - 4} y={thresholdYTop - 4} fill={accentColor} fontSize={9} textAnchor="end" fontFamily={typography.fontFamilyMono}>
                Threshold
            </text>
            <text x={pad.left + 4} y={mid - 4} fill="#bbb" fontSize={9} fontFamily={typography.fontFamilyMono}>
                No compression
            </text>
            <text x={pad.left + 4} y={thresholdYTop + 12} fill={`${accentColor}`} fontSize={9} fontFamily={typography.fontFamilyMono} fillOpacity={0.7}>
                Compressed
            </text>
        </svg>
    );
}

function TimingDiagramSVG({ attack, release, width = 500, height = 240, accentColor = COLORS.medium }) {
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
            <rect width={width} height={height} fill="#fcfcfb" rx={6} stroke="#eae8e4" strokeWidth={1} />

            {/* Center line */}
            <line x1={pad.left} y1={yMid} x2={width - pad.right} y2={yMid} stroke="#e8e6e2" strokeWidth={0.5} />

            {/* Input signal */}
            <path d={inputPath} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth={2} />

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
            <text x={pad.left + 4} y={yTop + 12} fill="#aaa" fontSize={9} fontFamily={typography.fontFamily}>
                Input Signal
            </text>
            <text x={pad.left + 4} y={yBot - 4} fill={accentColor} fontSize={9} fontFamily={typography.fontFamily} fillOpacity={0.7}>
                Gain Reduction
            </text>
        </svg>
    );
}

function WaveformSVG({ threshold, ratio, knee = 0, makeupGain = 0, attack = 10, release = 100, width = 540, height = 440, accentColor = '#FF6B35' }) {
    const pad = 12;
    const gw = width - pad * 2;
    const gh = height - pad * 2;
    const cy = pad + gh / 2;
    const NSAMP = 400;

    // Generate synthetic waveform (same formula as prototype)
    const wave = [];
    for (let i = 0; i < NSAMP; i++) {
        const t = i / NSAMP;
        let v = Math.sin(t * Math.PI * 8) * 0.5 + Math.sin(t * Math.PI * 19) * 0.25;
        v += Math.sin(t * Math.PI * 37) * 0.12 + Math.sin(t * Math.PI * 4) * 0.35;
        v += Math.exp(-Math.pow((t - 0.15) * 35, 2)) * 0.7;
        v += Math.exp(-Math.pow((t - 0.45) * 35, 2)) * 0.85;
        v += Math.exp(-Math.pow((t - 0.72) * 35, 2)) * 0.55;
        wave.push(Math.max(-1, Math.min(1, v)));
    }

    // Compression math with attack/release envelope
    const compOut = (inDb) => {
        if (knee <= 0) return inDb <= threshold ? inDb : threshold + (inDb - threshold) / ratio;
        const hk = knee / 2;
        if (inDb < threshold - hk) return inDb;
        if (inDb > threshold + hk) return threshold + (inDb - threshold) / ratio;
        const x = inDb - threshold + hk;
        return inDb + ((1 / ratio - 1) * x * x) / (2 * knee);
    };
    const ampToDb = (a) => a <= 0 ? -60 : Math.max(-60, 20 * Math.log10(a));
    const dbToAmp = (d) => Math.pow(10, d / 20);

    const atkC = Math.exp(-1 / (attack * 0.6));
    const relC = Math.exp(-1 / (release * 0.6));
    let env = 0;
    const comp = [];
    const gr = [];
    for (let i = 0; i < NSAMP; i++) {
        const amp = Math.abs(wave[i]);
        const inDb = ampToDb(amp);
        const outDb = compOut(inDb);
        const tGR = Math.max(0, inDb - outDb);
        env = tGR > env ? atkC * env + (1 - atkC) * tGR : relC * env + (1 - relC) * tGR;
        gr.push(env);
        comp.push(wave[i] * dbToAmp(-env + makeupGain));
    }

    // Threshold amplitude lines
    const thAmp = dbToAmp(threshold);
    const thTop = cy - thAmp * gh / 2;
    const thBot = cy + thAmp * gh / 2;

    // Build SVG paths
    const inputFillD = `M${pad},${cy} ` + wave.map((v, i) => `L${pad + (i / NSAMP) * gw},${cy - v * gh / 2}`).join(' ') + ` L${pad + gw},${cy} Z`;
    const inputStrokeD = wave.map((v, i) => `${i === 0 ? 'M' : 'L'}${pad + (i / NSAMP) * gw},${cy - v * gh / 2}`).join(' ');
    const compD = comp.map((v, i) => `${i === 0 ? 'M' : 'L'}${pad + (i / NSAMP) * gw},${cy - Math.max(-1, Math.min(1, v)) * gh / 2}`).join(' ');
    const grFillD = `M${pad},${pad} ` + gr.map((v, i) => `L${pad + (i / NSAMP) * gw},${pad + (v / 30) * (gh * 0.3)}`).join(' ') + ` L${pad + gw},${pad} Z`;
    const grLineD = gr.map((v, i) => `${i === 0 ? 'M' : 'L'}${pad + (i / NSAMP) * gw},${pad + (v / 30) * (gh * 0.3)}`).join(' ');

    // Peak GR for label
    const maxGR = Math.max(...gr);

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
            <rect width={width} height={height} fill="#fcfcfb" rx={6} stroke="#eae8e4" strokeWidth={1} />

            {/* Center line */}
            <line x1={pad} y1={cy} x2={pad + gw} y2={cy} stroke="#e8e6e2" strokeWidth={0.5} />

            {/* Threshold dashed lines */}
            <line x1={pad} y1={thTop} x2={pad + gw} y2={thTop} stroke="rgba(255,107,53,0.22)" strokeWidth={1} strokeDasharray="3,3" />
            <line x1={pad} y1={thBot} x2={pad + gw} y2={thBot} stroke="rgba(255,107,53,0.22)" strokeWidth={1} strokeDasharray="3,3" />
            <text x={pad + gw - 4} y={thTop - 4} fill="rgba(255,107,53,0.4)" fontSize={10} textAnchor="end" fontFamily={typography.fontFamilyMono} fontWeight={500}>
                {threshold} dB
            </text>

            {/* GR fill area */}
            <path d={grFillD} fill="rgba(34,197,94,0.08)" />

            {/* Input fill */}
            <path d={inputFillD} fill="rgba(176,184,196,0.1)" />

            {/* Input stroke */}
            <path d={inputStrokeD} fill="none" stroke="#b0b8c4" strokeWidth={1} />

            {/* Compressed waveform */}
            <path d={compD} fill="none" stroke={accentColor} strokeWidth={1.5} />

            {/* GR line */}
            <path d={grLineD} fill="none" stroke="#22c55e" strokeWidth={1.5} />

            {/* GR label */}
            {maxGR > 0.1 && (
                <text x={pad + 6} y={pad + 16} fill="#22c55e" fontSize={11} fontFamily={typography.fontFamilyMono} fontWeight={600}>
                    -{maxGR.toFixed(1)} dB GR
                </text>
            )}
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
                <rect width={width} height={height} fill="#fcfcfb" rx={4} stroke="#eae8e4" strokeWidth={1} />
                {/* Fill from top */}
                <rect x={2} y={2} width={width - 4} height={fillHeight} fill={fillColor} fillOpacity={0.8} rx={2} />
                {/* Tick marks */}
                {[0, 6, 12, 18, 24, 30].map(db => {
                    const y = (db / maxGR) * height;
                    return (
                        <g key={db}>
                            <line x1={0} y1={y} x2={4} y2={y} stroke="#ccc" strokeWidth={1} />
                            <text x={width - 2} y={y + 3} fill="#aaa" fontSize={7} textAnchor="end" fontFamily={typography.fontFamilyMono}>
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
                <rect width={width} height={height} fill="#fcfcfb" rx={3} stroke="#eae8e4" strokeWidth={1} />
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
        maxWidth: '1040px',
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

            <InteractiveBox hint="Drag the threshold and ratio sliders — or drag directly on the transfer curve to adjust">
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(300px, 1.4fr)', gap: spacing[6] }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        <div style={{ paddingBottom: spacing[5] }}>
                            <CompressorControl label="Threshold" value={threshold} min={-60} max={0} step={1} onChange={setThreshold} unit=" dB" color={accent} tierColor={COLORS.easy} />
                            <p style={{ color: COLORS.textSecondary, fontSize: typography.size.sm, lineHeight: typography.lineHeight.relaxed, margin: 0, marginTop: spacing[3] }}>
                                The level above which compression begins. Lower values compress more of the signal.
                            </p>
                        </div>
                        <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: spacing[5] }}>
                            <CompressorControl label="Ratio" value={ratio} min={1} max={20} step={0.5} onChange={setRatio} unit=":1" color={accent} tierColor={COLORS.easy} />
                            <p style={{ color: COLORS.textSecondary, fontSize: typography.size.sm, lineHeight: typography.lineHeight.relaxed, margin: 0, marginTop: spacing[3] }}>
                                How much the signal is reduced above the threshold. 4:1 means 4 dB in produces 1 dB out.
                            </p>
                        </div>
                    </div>
                    <div>
                        <TransferCurveSVG threshold={threshold} ratio={ratio} accentColor={accent} width={500} height={340} onThresholdChange={setThreshold} onRatioChange={setRatio} />
                        <div style={{ marginTop: spacing[3] }}>
                            <ThresholdDiagramSVG threshold={threshold} accentColor={accent} width={500} height={180} />
                        </div>
                    </div>
                </div>
            </InteractiveBox>
            <DescriptionStrip threshold={threshold} ratio={ratio} attack={attack} release={release} knee={knee} makeupGain={makeupGain} grAmount={grAmount} section={1} />

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
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(300px, 1.4fr)', gap: spacing[6] }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        <div style={{ paddingBottom: spacing[5] }}>
                            <CompressorControl label="Attack" value={attack} min={0.1} max={200} step={0.1} onChange={setAttack} unit=" ms" color={accent} tierColor={COLORS.medium} />
                            <p style={{ color: COLORS.textSecondary, fontSize: typography.size.sm, lineHeight: typography.lineHeight.relaxed, margin: 0, marginTop: spacing[3] }}>
                                How fast compression engages. Slow attack lets transients punch through before clamping down.
                            </p>
                        </div>
                        <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: spacing[5], paddingBottom: spacing[5] }}>
                            <CompressorControl label="Release" value={release} min={10} max={1000} step={1} onChange={setRelease} unit=" ms" color={accent} tierColor={COLORS.medium} />
                            <p style={{ color: COLORS.textSecondary, fontSize: typography.size.sm, lineHeight: typography.lineHeight.relaxed, margin: 0, marginTop: spacing[3] }}>
                                How fast compression lets go. Too fast causes audible pumping; too slow smooths everything out.
                            </p>
                        </div>
                        <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: spacing[4] }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
                                <CompressorControl label="Threshold" value={threshold} min={-60} max={0} step={1} onChange={setThreshold} unit=" dB" color={COLORS.easy} tierColor={COLORS.easy} />
                                <CompressorControl label="Ratio" value={ratio} min={1} max={20} step={0.5} onChange={setRatio} unit=":1" color={COLORS.easy} tierColor={COLORS.easy} />
                            </div>
                        </div>
                    </div>
                    <div>
                        <TimingDiagramSVG attack={attack} release={release} accentColor={accent} width={500} height={240} />
                    </div>
                </div>
            </InteractiveBox>
            <DescriptionStrip threshold={threshold} ratio={ratio} attack={attack} release={release} knee={knee} makeupGain={makeupGain} grAmount={grAmount} section={2} />

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
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(300px, 1.4fr)', gap: spacing[6] }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        <div style={{ paddingBottom: spacing[5] }}>
                            <CompressorControl label="Knee" value={knee} min={0} max={30} step={1} onChange={setKnee} unit=" dB" color={accent} tierColor={COLORS.advanced} />
                            <p style={{ color: COLORS.textSecondary, fontSize: typography.size.sm, lineHeight: typography.lineHeight.relaxed, margin: 0, marginTop: spacing[3] }}>
                                How gradually compression engages. 0 dB = hard knee (abrupt). Higher values = soft knee (smoother, more musical).
                            </p>
                        </div>
                        <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: spacing[5], paddingBottom: spacing[5] }}>
                            <CompressorControl label="Makeup Gain" value={makeupGain} min={0} max={24} step={0.5} onChange={setMakeupGain} unit=" dB" color={accent} tierColor={COLORS.advanced} />
                            <p style={{ color: COLORS.textSecondary, fontSize: typography.size.sm, lineHeight: typography.lineHeight.relaxed, margin: 0, marginTop: spacing[3] }}>
                                Boosts the output after compression. Restores perceived loudness — making quiet parts relatively louder.
                            </p>
                        </div>
                        <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: spacing[4] }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
                                <CompressorControl label="Threshold" value={threshold} min={-60} max={0} step={1} onChange={setThreshold} unit=" dB" color={COLORS.easy} tierColor={COLORS.easy} />
                                <CompressorControl label="Ratio" value={ratio} min={1} max={20} step={0.5} onChange={setRatio} unit=":1" color={COLORS.easy} tierColor={COLORS.easy} />
                            </div>
                        </div>
                    </div>
                    <div>
                        <TransferCurveSVG threshold={threshold} ratio={ratio} knee={knee} makeupGain={makeupGain} accentColor={accent} width={500} height={340} onThresholdChange={setThreshold} onRatioChange={setRatio} />
                    </div>
                </div>
            </InteractiveBox>
            <DescriptionStrip threshold={threshold} ratio={ratio} attack={attack} release={release} knee={knee} makeupGain={makeupGain} grAmount={grAmount} section={3} />

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

    const vizLabelStyle = {
        fontSize: '0.58rem',
        textTransform: 'uppercase',
        letterSpacing: '1.6px',
        color: '#ccc',
        marginBottom: '4px',
        fontWeight: 600,
    };

    const renderSection4 = () => {
        const quizScore = Object.values(quizAnswers).filter((a, i) => a === QUIZ_QUESTIONS[i]?.correct).length;

        return (
            <div style={{ ...contentCol, maxWidth: '1040px' }}>
                <div style={{ paddingTop: spacing[12], marginBottom: spacing[10] }}>
                    <h2 style={h2Style}>Full Compressor</h2>
                    <p style={bodyStyle}>
                        Combine all six parameters. Try the presets to hear classic compression settings, then experiment
                        with your own. Watch the meters respond in real-time.
                    </p>
                </div>

                <InteractiveBox>
                    {/* Two visualizations side by side at the top */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                        <div>
                            <div style={vizLabelStyle}>Transfer Curve</div>
                            <TransferCurveSVG threshold={threshold} ratio={ratio} knee={knee} makeupGain={makeupGain} width={540} height={440} accentColor={accent} onThresholdChange={setThreshold} onRatioChange={setRatio} />
                        </div>
                        <div>
                            <div style={vizLabelStyle}>Signal & Gain Reduction</div>
                            <WaveformSVG threshold={threshold} ratio={ratio} knee={knee} makeupGain={makeupGain} attack={attack} release={release} width={540} height={440} accentColor={accent} />
                            <div style={{ display: 'flex', gap: '12px', fontSize: '0.62rem', color: '#aaa', marginTop: '3px' }}>
                                <span><span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#b0b8c4', marginRight: '4px', verticalAlign: 'middle' }} />Input</span>
                                <span><span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#FF6B35', marginRight: '4px', verticalAlign: 'middle' }} />Compressed</span>
                                <span><span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', marginRight: '4px', verticalAlign: 'middle' }} />Gain reduction</span>
                            </div>
                        </div>
                    </div>

                    {/* 6-across compact parameter strip */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', marginBottom: '10px' }}>
                        <CompactParam label="Threshold" value={threshold} min={-60} max={0} step={1} onChange={setThreshold} unit=" dB" />
                        <CompactParam label="Ratio" value={ratio} min={1} max={20} step={0.5} onChange={setRatio} unit=" :1" />
                        <CompactParam label="Knee" value={knee} min={0} max={30} step={1} onChange={setKnee} unit=" dB" />
                        <CompactParam label="Makeup" value={makeupGain} min={0} max={24} step={0.5} onChange={setMakeupGain} unit=" dB" />
                        <CompactParam label="Attack" value={attack} min={0.1} max={200} step={0.1} onChange={setAttack} unit=" ms" />
                        <CompactParam label="Release" value={release} min={10} max={1000} step={1} onChange={setRelease} unit=" ms" />
                    </div>

                    {/* Description strip */}
                    <DescriptionStrip threshold={threshold} ratio={ratio} attack={attack} release={release} knee={knee} makeupGain={makeupGain} grAmount={grAmount} section={'all'} />

                    {/* Presets */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], flexWrap: 'wrap', marginTop: spacing[4] }}>
                        <span style={{ color: COLORS.textHint, fontSize: typography.size.xs, fontWeight: typography.weight.medium, textTransform: 'uppercase', letterSpacing: typography.letterSpacing.wide }}>
                            Presets
                        </span>
                        <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap' }}>
                            {PRESETS.map(p => (
                                <button key={p.name} onClick={() => loadPreset(p)} style={btnStyle(false)}>
                                    {p.name}
                                </button>
                            ))}
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

            {/* Hero with video background */}
            <div style={{
                position: 'relative',
                overflow: 'hidden',
                width: '100vw',
                marginLeft: 'calc(-50vw + 50%)',
                marginTop: spacing[16],
                marginBottom: spacing[6],
                minHeight: '240px',
            }}>
                <video
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
                        opacity: 0,
                        transition: 'opacity 0.8s ease-out',
                    }}
                    src="/compressor-hero.mp4"
                />
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to bottom, rgba(26,26,46,0.4) 0%, rgba(26,26,46,0.7) 100%)',
                }} />
                <div style={{
                    position: 'relative',
                    maxWidth: '640px', margin: '0 auto',
                    padding: `${spacing[12]} ${spacing[6]} ${spacing[10]}`,
                    textAlign: 'center',
                }}>
                    <h1 style={{
                        fontSize: typography.size['4xl'],
                        fontWeight: typography.weight.bold,
                        color: '#ffffff',
                        lineHeight: typography.lineHeight.tight,
                        marginBottom: spacing[4],
                        textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}>
                        Compressor Explorer
                    </h1>
                    <p style={{
                        color: 'rgba(255,255,255,0.85)',
                        fontSize: typography.size.lg,
                        lineHeight: typography.lineHeight.relaxed,
                        maxWidth: '480px', margin: '0 auto',
                        textShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    }}>
                        Learn how compressors control dynamics. Adjust threshold, ratio, attack, release, knee and makeup gain — hear and see the results in real-time.
                    </p>
                </div>
            </div>

            {/* Current section */}
            {currentSection === 1 && renderSection1()}
            {currentSection === 2 && renderSection2()}
            {currentSection === 3 && renderSection3()}
            {currentSection === 4 && renderSection4()}

            {/* Bottom navigation */}
            <div style={{
                maxWidth: '1040px', margin: '0 auto',
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
