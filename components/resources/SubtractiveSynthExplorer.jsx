'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { theme, typography, spacing, borderRadius, transitions } from '@/lib/theme';
import ProductionCopyButton from '@/components/ui/ProductionCopyButton';
import { buildSynthCopyMarkdown } from '@/lib/copy-for-ai';
import Callout from '@/components/Callout';
import HarmonicSpectrum from '@/components/resources/HarmonicSpectrum';
import EpicycleWave from '@/components/resources/EpicycleWave';
import Link from 'next/link';

// ─── Design Tokens (light, warm, Ableton-inspired) ──────────────────────────

const COLORS = {
    bg: '#f5f4f2',           // warm off-white
    surface: '#FFFFFF',       // white cards
    text: '#1a1a2e',          // deep navy
    textSecondary: '#4a4f5a', // muted
    textHint: '#8b909a',      // hints, captions
    border: '#d1d5db',        // subtle borders
    borderStrong: '#1a1a2e',  // interactive container borders
    // section accent colors
    osc: '#9B7530',           // purple - oscillators
    filter: '#0891b2',        // teal - filters
    env: '#059669',           // green - envelopes
    patch: '#d97706',         // amber - patch builder
};

// ─── Constants ───────────────────────────────────────────────────────────────

const WAVEFORMS = [
    { id: 'sine', label: 'Sine' },
    { id: 'triangle', label: 'Triangle' },
    { id: 'sawtooth', label: 'Sawtooth' },
    { id: 'square', label: 'Square' },
];

const FILTER_TYPES = [
    { id: 'lowpass', label: 'Low-Pass (LPF)' },
    { id: 'highpass', label: 'High-Pass (HPF)' },
    { id: 'bandpass', label: 'Band-Pass (BPF)' },
];

const PRESETS = [
    { name: 'Warm Pad', waveform: 'sawtooth', cutoff: 800, resonance: 1.5, attack: 0.4, decay: 0.3, sustain: 0.7, release: 1.2, filterType: 'lowpass', octave: 0 },
    { name: 'Plucky Bass', waveform: 'sawtooth', cutoff: 1200, resonance: 4, attack: 0.005, decay: 0.25, sustain: 0.1, release: 0.3, filterType: 'lowpass', octave: -1 },
    { name: 'Bright Lead', waveform: 'square', cutoff: 6000, resonance: 2, attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.4, filterType: 'lowpass', octave: 1 },
    { name: 'Sub Bass', waveform: 'sine', cutoff: 400, resonance: 0.7, attack: 0.01, decay: 0.05, sustain: 1.0, release: 0.5, filterType: 'lowpass', octave: -2 },
];

const NOTE_FREQUENCIES = {
    'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56,
    'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00,
    'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
    'C4': 261.63,
};

const KEYBOARD_NOTES = [
    { note: 'C3', isBlack: false }, { note: 'C#3', isBlack: true },
    { note: 'D3', isBlack: false }, { note: 'D#3', isBlack: true },
    { note: 'E3', isBlack: false },
    { note: 'F3', isBlack: false }, { note: 'F#3', isBlack: true },
    { note: 'G3', isBlack: false }, { note: 'G#3', isBlack: true },
    { note: 'A3', isBlack: false }, { note: 'A#3', isBlack: true },
    { note: 'B3', isBlack: false },
    { note: 'C4', isBlack: false },
];

const QUIZ_QUESTIONS = [
    {
        question: 'Which waveform contains only odd harmonics?',
        options: ['Sine', 'Sawtooth', 'Square', 'Triangle'],
        correct: 2,
        explanation: 'A square wave contains only odd harmonics (1st, 3rd, 5th...), giving it a hollow, buzzy character.',
    },
    {
        question: 'What does a low-pass filter remove from a signal?',
        options: ['Low frequencies', 'High frequencies', 'The fundamental', 'All harmonics equally'],
        correct: 1,
        explanation: 'A low-pass filter allows frequencies below the cutoff to pass and attenuates frequencies above it — removing high-frequency harmonics.',
    },
    {
        question: 'In an ADSR envelope, which stage determines the volume while a key is held down?',
        options: ['Attack', 'Decay', 'Sustain', 'Release'],
        correct: 2,
        explanation: 'The Sustain level sets the steady-state amplitude maintained while the note is held, after the Attack and Decay stages complete.',
    },
    {
        question: 'Why is it called "subtractive" synthesis?',
        options: [
            'You subtract waveforms from each other',
            'You start with a harmonically rich signal and filter out frequencies',
            'The envelope subtracts volume over time',
            'You subtract the fundamental frequency'
        ],
        correct: 1,
        explanation: 'Subtractive synthesis starts with a harmonically rich waveform (like sawtooth) and uses filters to subtract/remove frequencies, sculpting the timbre.',
    },
];

// The scope's stage, changed from the old cool navy #1a1a2e to the warm dark
// used by the approved FFT lab. Not a taste edit: the spectrum now sits directly
// beside the scope, and two dark panels in two different darks read as two
// instruments bolted together rather than two views of one sound.
// The scope and the spectrum, side by side — two views of one sound.
//
// An earlier attempt let this pair break out of the 640px reading column with a
// negative-margin trick, on the reasoning that prose and instruments want
// opposite widths. It looked wrong immediately: these sit inside a bordered
// card, so the displays escaped their own box and overhung the border on both
// sides. Widening the instrument is still the right idea — it just has to be the
// CARD that widens, which is what the workbench below finally does.
const displayStack = {
    display: 'grid',
    gap: '0.9rem',
};

const SCOPE_STAGE = '#211C15';
const SCOPE_LINE = 'rgba(250,242,228,0.10)';

// Caption over each display. Small, quiet, and always present: an unlabelled
// oscilloscope beside an unlabelled spectrum is two mystery rectangles.
const paneLabel = {
    margin: `0 0 6px`,
    fontSize: '0.72rem',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#6B655C',
};

const SECTION_ACCENTS = {
    1: COLORS.osc,
    2: COLORS.filter,
    3: COLORS.env,
    4: COLORS.patch,
};

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
                    transition: 'transform, opacity, background-color, color, border-color, box-shadow 0.2s ease',
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
        <button type="button"
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
                transition: 'transform, opacity, background-color, color, border-color, box-shadow 0.2s ease',
                justifyContent: 'center',
            }}
        >
            <span style={{ fontSize: '0.9rem' }}>{copied ? '\u2713' : '\uD83D\uDCCB'}</span>
            {copied ? 'Copied to clipboard!' : 'Copy all definitions to notes'}
        </button>
    );
}

function WaveformIcon({ type, size = 40, color = COLORS.text }) {
    const w = size;
    const h = size * 0.6;
    const mid = h / 2;
    const amp = h * 0.35;

    const r = (n) => Math.round(n * 100) / 100; // round to 2dp for deterministic SSR
    let path = '';
    const pts = 60;
    if (type === 'sine') {
        for (let i = 0; i <= pts; i++) {
            const x = r((i / pts) * w);
            const y = r(mid - Math.sin((i / pts) * Math.PI * 2) * amp);
            path += (i === 0 ? 'M' : 'L') + `${x},${y}`;
        }
    } else if (type === 'triangle') {
        path = `M0,${r(mid)} L${r(w * 0.25)},${r(mid - amp)} L${r(w * 0.75)},${r(mid + amp)} L${r(w)},${r(mid)}`;
    } else if (type === 'sawtooth') {
        path = `M0,${r(mid + amp)} L${r(w * 0.5)},${r(mid - amp)} L${r(w * 0.5)},${r(mid + amp)} L${r(w)},${r(mid - amp)}`;
    } else if (type === 'square') {
        path = `M0,${r(mid + amp)} L0,${r(mid - amp)} L${r(w * 0.5)},${r(mid - amp)} L${r(w * 0.5)},${r(mid + amp)} L${r(w)},${r(mid + amp)} L${r(w)},${r(mid - amp)}`;
    }

    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
            <line x1={0} y1={mid} x2={w} y2={mid} stroke={color} strokeOpacity={0.15} strokeWidth={1} />
            <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function SynthControl({ label, value, min, max, step, onChange, unit = '', color = COLORS.text, logScale = false }) {
    const displayVal = logScale
        ? (value >= 1000 ? `${(value / 1000).toFixed(1)}k` : Math.round(value))
        : (step < 0.01 ? value.toFixed(3) : step < 1 ? value.toFixed(2) : Math.round(value));

    const handleChange = useCallback((e) => {
        const raw = parseFloat(e.target.value);
        if (logScale) {
            const minLog = Math.log(min);
            const maxLog = Math.log(max);
            const val = Math.exp(minLog + (raw / 100) * (maxLog - minLog));
            onChange(val);
        } else {
            onChange(raw);
        }
    }, [min, max, logScale, onChange]);

    const sliderValue = logScale
        ? ((Math.log(value) - Math.log(min)) / (Math.log(max) - Math.log(min))) * 100
        : value;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[1], flex: 1, minWidth: '120px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <label style={{ color: COLORS.textSecondary, fontSize: typography.size.xs, fontWeight: typography.weight.medium }}>{label}</label>
                <span style={{ color: COLORS.text, fontSize: typography.size.xs, fontFamily: typography.fontFamilyMono }}>{displayVal}{unit}</span>
            </div>
            <input aria-label={label}
                type="range"
                min={logScale ? 0 : min}
                max={logScale ? 100 : max}
                step={logScale ? 0.1 : step}
                value={sliderValue}
                onChange={handleChange}
                style={{ width: '100%', accentColor: color, cursor: 'pointer', height: '6px' }}
            />
        </div>
    );
}

function WaveformCanvas({ analyserRef, width = 500, height = 160, color = COLORS.osc }) {
    const canvasRef = useRef(null);
    const animFrameRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let dataArray = null;

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const drawStage = () => {
            ctx.fillStyle = SCOPE_STAGE;
            ctx.fillRect(0, 0, width, height);
            ctx.strokeStyle = SCOPE_LINE;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, height / 2);
            ctx.lineTo(width, height / 2);
            ctx.stroke();
        };

        const draw = () => {
            animFrameRef.current = requestAnimationFrame(draw);

            // Read the ref every frame. The analyser does not exist until the
            // first user gesture builds the audio graph, and a ref's identity
            // never changes — so capturing it here (as this did) meant the
            // effect ran once against null, bailed, and never ran again. The
            // scope stayed blank on first visit and only came alive after
            // leaving the section and returning, which remounts the canvas.
            const analyser = analyserRef.current;
            drawStage();
            if (!analyser) return;

            const bufferLength = analyser.fftSize;
            if (!dataArray || dataArray.length !== bufferLength) {
                dataArray = new Float32Array(bufferLength);
            }
            analyser.getFloatTimeDomainData(dataArray);

            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            const sliceWidth = width / bufferLength;
            let x = 0;
            for (let i = 0; i < bufferLength; i++) {
                const y = (height / 2) * (1 - dataArray[i]);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                x += sliceWidth;
            }
            ctx.stroke();
        };

        if (reduceMotion) {
            drawStage();
        } else {
            draw();
        }
        return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
    }, [analyserRef, width, height, color]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            style={{ width: '100%', height: `${height}px`, borderRadius: borderRadius.md, display: 'block' }}
        />
    );
}

function FilterResponseSVG({ type, cutoff, resonance, width = 500, height = 160, accentColor = COLORS.filter }) {
    const padding = { top: 10, right: 10, bottom: 25, left: 35 };
    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;

    const freqToX = useCallback((f) => {
        const minLog = Math.log10(20);
        const maxLog = Math.log10(20000);
        return padding.left + ((Math.log10(f) - minLog) / (maxLog - minLog)) * innerW;
    }, [innerW]);

    const dbToY = useCallback((db) => {
        const minDb = -36;
        const maxDb = 24;
        return padding.top + ((maxDb - db) / (maxDb - minDb)) * innerH;
    }, [innerH]);

    const points = [];
    const numPts = 200;
    for (let i = 0; i <= numPts; i++) {
        const logF = Math.log10(20) + (i / numPts) * (Math.log10(20000) - Math.log10(20));
        const freq = Math.pow(10, logF);
        let db = 0;

        if (type === 'lowpass') {
            if (freq > cutoff) {
                const octaves = Math.log2(freq / cutoff);
                db = -12 * octaves;
            }
            if (resonance > 1) {
                const peakBoost = (resonance - 1) * 3;
                const dist = Math.abs(Math.log2(freq / cutoff));
                db += peakBoost * Math.exp(-dist * dist * 8);
            }
        } else if (type === 'highpass') {
            if (freq < cutoff) {
                const octaves = Math.log2(cutoff / freq);
                db = -12 * octaves;
            }
            if (resonance > 1) {
                const peakBoost = (resonance - 1) * 3;
                const dist = Math.abs(Math.log2(freq / cutoff));
                db += peakBoost * Math.exp(-dist * dist * 8);
            }
        } else if (type === 'bandpass') {
            const octaves = Math.abs(Math.log2(freq / cutoff));
            const bw = 2 / Math.max(resonance, 0.5);
            db = -12 * (octaves / bw);
        }

        db = Math.max(-36, Math.min(24, db));
        points.push({ x: freqToX(freq), y: dbToY(db) });
    }

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const fillD = pathD + ` L${points[points.length - 1].x.toFixed(1)},${dbToY(-36).toFixed(1)} L${points[0].x.toFixed(1)},${dbToY(-36).toFixed(1)} Z`;

    const freqMarks = [100, 1000, 10000];
    const dbMarks = [-24, -12, 0, 12];

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
            <rect width={width} height={height} fill="#1a1a2e" rx={6} />
            {freqMarks.map(f => (
                <g key={f}>
                    <line x1={freqToX(f)} y1={padding.top} x2={freqToX(f)} y2={height - padding.bottom} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
                    <text x={freqToX(f)} y={height - 5} fill="rgba(255,255,255,0.35)" fontSize={10} textAnchor="middle" fontFamily={typography.fontFamilyMono}>
                        {f >= 1000 ? `${f / 1000}k` : f}
                    </text>
                </g>
            ))}
            {dbMarks.map(db => (
                <g key={db}>
                    <line x1={padding.left} y1={dbToY(db)} x2={width - padding.right} y2={dbToY(db)} stroke={db === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'} strokeWidth={1} />
                    <text x={padding.left - 4} y={dbToY(db) + 3} fill="rgba(255,255,255,0.35)" fontSize={9} textAnchor="end" fontFamily={typography.fontFamilyMono}>
                        {db > 0 ? '+' : ''}{db}
                    </text>
                </g>
            ))}
            <path d={fillD} fill={accentColor} fillOpacity={0.15} />
            <path d={pathD} fill="none" stroke={accentColor} strokeWidth={2.5} />
            <line x1={freqToX(cutoff)} y1={padding.top} x2={freqToX(cutoff)} y2={height - padding.bottom} stroke="rgba(255,255,255,0.3)" strokeWidth={1} strokeDasharray="4,3" />
            {/* −12 dB/oct slope label */}
            {type !== 'bandpass' && (
                <text
                    x={type === 'highpass' ? freqToX(cutoff) - 8 : freqToX(cutoff) + 8}
                    y={padding.top + innerH * 0.55}
                    fill={accentColor}
                    fillOpacity={0.75}
                    fontSize={9}
                    textAnchor={type === 'highpass' ? 'end' : 'start'}
                    fontFamily={typography.fontFamilyMono}
                >
                    −12 dB/oct
                </text>
            )}
            {/* Legend */}
            <g transform={`translate(${padding.left + 4}, ${padding.top + innerH - 22})`}>
                <line x1={0} y1={4} x2={14} y2={4} stroke="rgba(255,255,255,0.3)" strokeWidth={1} strokeDasharray="4,3" />
                <text x={18} y={8} fill="rgba(255,255,255,0.5)" fontSize={9} fontFamily={typography.fontFamilyMono}>Cutoff</text>
                <rect x={0} y={14} width={14} height={6} fill={accentColor} fillOpacity={0.4} />
                <text x={18} y={21} fill="rgba(255,255,255,0.5)" fontSize={9} fontFamily={typography.fontFamilyMono}>Filter response</text>
            </g>
        </svg>
    );
}

function EnvelopeShapeSVG({ attack, decay, sustain, release, width = 400, height = 140, accentColor = COLORS.env }) {
    const pad = { top: 15, right: 15, bottom: 30, left: 15 };
    const innerW = width - pad.left - pad.right;
    const innerH = height - pad.top - pad.bottom;

    const totalTime = attack + decay + 0.3 + release;
    const scale = innerW / totalTime;

    const x0 = pad.left;
    const y0 = pad.top + innerH;
    const yTop = pad.top;

    const xAttack = x0 + attack * scale;
    const xDecay = xAttack + decay * scale;
    const xSustainEnd = xDecay + 0.3 * scale;
    const xRelease = xSustainEnd + release * scale;

    const ySustain = yTop + (1 - sustain) * innerH;

    const pathD = `M${x0},${y0} L${xAttack},${yTop} L${xDecay},${ySustain} L${xSustainEnd},${ySustain} L${xRelease},${y0}`;
    const fillD = pathD + ` L${x0},${y0} Z`;

    const stages = [
        { label: 'Atk', x: (x0 + xAttack) / 2 },
        { label: 'Dec', x: (xAttack + xDecay) / 2 },
        { label: 'Sus', x: (xDecay + xSustainEnd) / 2 },
        { label: 'Rel', x: (xSustainEnd + xRelease) / 2 },
    ];

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
            <rect width={width} height={height} fill="#1a1a2e" rx={6} />
            <line x1={pad.left} y1={y0} x2={width - pad.right} y2={y0} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
            <path d={fillD} fill={accentColor} fillOpacity={0.12} />
            <path d={pathD} fill="none" stroke={accentColor} strokeWidth={2.5} strokeLinejoin="round" />
            {[xAttack, xDecay, xSustainEnd].map((x, i) => (
                <line key={i} x1={x} y1={pad.top} x2={x} y2={y0} stroke="rgba(255,255,255,0.08)" strokeWidth={1} strokeDasharray="3,3" />
            ))}
            {[
                { cx: x0, cy: y0 }, { cx: xAttack, cy: yTop },
                { cx: xDecay, cy: ySustain }, { cx: xSustainEnd, cy: ySustain },
                { cx: xRelease, cy: y0 },
            ].map((p, i) => (
                <circle key={i} cx={p.cx} cy={p.cy} r={3.5} fill={accentColor} />
            ))}
            {stages.map(s => (
                <text key={s.label} x={s.x} y={height - 8} fill="rgba(255,255,255,0.5)" fontSize={11} textAnchor="middle" fontWeight="bold" fontFamily={typography.fontFamilyMono}>
                    {s.label}
                </text>
            ))}
        </svg>
    );
}

function MiniKeyboard({ onNoteOn, onNoteOff, activeNote }) {
    const whiteKeys = KEYBOARD_NOTES.filter(k => !k.isBlack);
    const blackKeys = KEYBOARD_NOTES.filter(k => k.isBlack);
    const whiteW = 38;
    const whiteH = 120;
    const blackW = 24;
    const blackH = 72;
    const totalW = whiteKeys.length * whiteW;

    const blackKeyOffsets = {};
    let whiteIdx = 0;
    for (const k of KEYBOARD_NOTES) {
        if (!k.isBlack) whiteIdx++;
        else blackKeyOffsets[k.note] = (whiteIdx - 1) * whiteW + whiteW - blackW / 2;
    }

    const handlePointerDown = useCallback((note) => (e) => {
        e.preventDefault();
        onNoteOn(note);
    }, [onNoteOn]);

    const handlePointerUp = useCallback((note) => (e) => {
        e.preventDefault();
        onNoteOff(note);
    }, [onNoteOff]);

    const handleKeyDown = useCallback((note) => (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onNoteOn(note);
        }
    }, [onNoteOn]);

    const handleKeyUp = useCallback((note) => (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onNoteOff(note);
        }
    }, [onNoteOff]);

    return (
        <div style={{ position: 'relative', width: totalW, height: whiteH, userSelect: 'none', touchAction: 'none' }}>
            {whiteKeys.map((k, i) => (
                <div
                    key={k.note}
                    role="button"
                    tabIndex={0}
                    aria-label={k.note}
                    aria-pressed={activeNote === k.note}
                    onPointerDown={handlePointerDown(k.note)}
                    onPointerUp={handlePointerUp(k.note)}
                    onPointerLeave={handlePointerUp(k.note)}
                    onKeyDown={handleKeyDown(k.note)}
                    onKeyUp={handleKeyUp(k.note)}
                    style={{
                        position: 'absolute', left: i * whiteW, top: 0,
                        width: whiteW - 2, height: whiteH,
                        background: activeNote === k.note ? `${COLORS.patch}30` : '#FFFFFF',
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: `0 0 ${borderRadius.sm} ${borderRadius.sm}`,
                        cursor: 'pointer', display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                        paddingBottom: spacing[1], transition: 'background 0.05s',
                    }}
                >
                    <span style={{ fontSize: '9px', color: COLORS.textHint, fontFamily: typography.fontFamilyMono }}>{k.note}</span>
                </div>
            ))}
            {blackKeys.map(k => (
                <div
                    key={k.note}
                    role="button"
                    tabIndex={0}
                    aria-label={k.note}
                    aria-pressed={activeNote === k.note}
                    onPointerDown={handlePointerDown(k.note)}
                    onPointerUp={handlePointerUp(k.note)}
                    onPointerLeave={handlePointerUp(k.note)}
                    onKeyDown={handleKeyDown(k.note)}
                    onKeyUp={handleKeyUp(k.note)}
                    style={{
                        position: 'absolute', left: blackKeyOffsets[k.note], top: 0,
                        width: blackW, height: blackH,
                        background: activeNote === k.note ? COLORS.patch : COLORS.text,
                        border: `1px solid ${COLORS.text}`,
                        borderRadius: `0 0 ${borderRadius.sm} ${borderRadius.sm}`,
                        cursor: 'pointer', zIndex: 2,
                    }}
                />
            ))}
        </div>
    );
}

// ─── Interactive Container (bordered box for interactive widgets) ─────────────

function InteractiveBox({ children, hint, flush }) {
    return (
        // `flush` drops the bottom margin: inside a sticky rack that margin is
        // dead space at the foot of the panel, and dead space is the difference
        // between pinning on a laptop and not.
        <div style={{ marginBottom: flush ? 0 : spacing[6] }}>
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

// ─── The workbench: instrument on one side, reading on the other ─────────────
//
// Mike, 2026-07-31, on the Filter section: "it is only half delivered... this is
// going to go on a paid site. I want this to be full throttle."
//
// The half that was missing was not a display, it was an ARRANGEMENT. The cutoff
// slider lived in Section 2 and the spinning circles in Section 1, so the single
// thing this page exists to show — close the filter, watch the harmonics shrink
// and drop away — could not be done and seen at the same time. No amount of
// polish on either half fixes that; they have to share a screen.
//
// So a section is now an instrument and a text, not a stack of both. The rack
// holds every control AND every display for that section and stays put while the
// reading scrolls past it, which means slider and circles are together at any
// scroll position. It also answers the older complaint that got the hero cut
// down ("I'm having to scroll up and down a lot"): two columns of roughly equal
// height are about half as tall as the same material stacked.
//
// Below 1024px it collapses to one column with the rack first — the order the
// page already had, so nothing changes on a phone.
//
// A <style> block rather than a style object because sticky positioning and a
// breakpoint cannot be expressed inline.
//
// Sticky is CONDITIONAL, and that took three attempts to get honest. A panel
// pinned with `top` alone and taller than the space below it never shows its own
// bottom — it pins on arrival and the rest is unreachable, so the Play button
// simply ceases to exist on a short laptop. Capping the height and letting it
// scroll inside itself is worse still: the controls are technically reachable
// but behind a second scrollbar nobody expects. So the panel is measured against
// the space available, and where it does not fit it stops being sticky and just
// scrolls with the page. You lose the convenience on a small window; you never
// lose the controls.
const BENCH_CSS = `
.sse-bench { display: grid; grid-template-columns: minmax(0, 1fr); gap: 1.25rem; }
.sse-bench__rack { order: -1; min-width: 0; }
.sse-bench__read { min-width: 0; }
@media (min-width: 1024px) {
  .sse-bench {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.06fr);
    gap: 2.25rem;
    align-items: start;
  }
  .sse-bench__rack { order: 0; }
  .sse-bench__rack--pinned {
    position: sticky;
    top: var(--sse-stick, 76px);
  }
}
`;

function Workbench({ rack, rackRef, pinned, children }) {
    return (
        <div className="sse-bench">
            <div className="sse-bench__read">{children}</div>
            <div ref={rackRef} className={`sse-bench__rack${pinned ? ' sse-bench__rack--pinned' : ''}`}>{rack}</div>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SubtractiveSynthExplorer() {
    // Navigation
    const [currentSection, setCurrentSection] = useState(1);
    const [visitedSections, setVisitedSections] = useState(new Set([1]));

    // Synth params
    const [waveform, setWaveform] = useState('sawtooth');
    const [filterType, setFilterType] = useState('lowpass');
    const [cutoff, setCutoff] = useState(2000);
    const [resonance, setResonance] = useState(1);
    const [attack, setAttack] = useState(0.01);
    const [decay, setDecay] = useState(0.2);
    const [sustain, setSustain] = useState(0.7);
    const [release, setRelease] = useState(0.3);
    const [octave, setOctave] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeNote, setActiveNote] = useState(null);

    // Quiz
    const [quizAnswers, setQuizAnswers] = useState({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);

    // Tab indicator refs
    const tabListRef = useRef(null);
    const tabBtnRefs = useRef({});
    const [tabIndicator, setTabIndicator] = useState({ x: 0, width: 0, ready: false });

    // How far down the sticky rack has to sit to clear the furniture above it.
    // Measured rather than guessed: the nav's height depends on the tab labels,
    // which wrap at narrow widths, and a hardcoded offset would let the rack
    // slide underneath.
    //
    // Measuring also turned up a bug that predates this rework. The section tabs
    // are sticky at top:0 and so is the site header, which has the higher
    // z-index — so the moment you scrolled, the tab bar pinned itself
    // underneath the header and became invisible AND unclickable. Nobody had
    // noticed because until now there was no reason to look at the top of the
    // window while scrolled. The tabs now pin below the header instead.
    const navRef = useRef(null);
    const rackRef = useRef(null);
    const [headerH, setHeaderH] = useState(0);
    const [stickTop, setStickTop] = useState(76);
    const [pinned, setPinned] = useState(false);

    // Audio refs
    const audioCtxRef = useRef(null);
    const oscRef = useRef(null);
    const filterRef = useRef(null);
    const envGainRef = useRef(null);
    const masterGainRef = useRef(null);
    const analyserRef = useRef(null);
    const releaseTimeoutRef = useRef(null);
    // The fundamental currently sounding. HarmonicSpectrum needs it to know
    // where H1..H8 actually are — the harmonic positions move with the note,
    // so a fixed axis would put the bars in the wrong place an octave down.
    // A ref, not state: it is read inside a requestAnimationFrame loop and must
    // not re-render the tool sixty times a second.
    const currentFreqRef = useRef(220);

    const ensureAudioCtx = useCallback(() => {
        if (audioCtxRef.current) return audioCtxRef.current;

        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        audioCtxRef.current = ctx;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2000;
        filter.Q.value = 1;
        filterRef.current = filter;

        const envGain = ctx.createGain();
        envGain.gain.value = 0;
        envGainRef.current = envGain;

        const masterGain = ctx.createGain();
        masterGain.gain.value = 0.35;
        masterGainRef.current = masterGain;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        analyserRef.current = analyser;

        filter.connect(envGain);
        envGain.connect(masterGain);
        masterGain.connect(analyser);
        analyser.connect(ctx.destination);

        return ctx;
    }, []);

    const startTone = useCallback(async (freq) => {
        currentFreqRef.current = freq;
        const ctx = ensureAudioCtx();
        if (ctx.state === 'suspended') await ctx.resume();

        if (oscRef.current) {
            try { oscRef.current.stop(); } catch (e) {}
            oscRef.current.disconnect();
        }

        const osc = ctx.createOscillator();
        osc.type = waveform;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.connect(filterRef.current);
        oscRef.current = osc;

        filterRef.current.type = filterType;
        filterRef.current.frequency.setValueAtTime(cutoff, ctx.currentTime);
        filterRef.current.Q.setValueAtTime(resonance, ctx.currentTime);

        envGainRef.current.gain.cancelScheduledValues(ctx.currentTime);
        envGainRef.current.gain.setValueAtTime(0.8, ctx.currentTime);

        osc.start();
        setIsPlaying(true);
    }, [ensureAudioCtx, waveform, filterType, cutoff, resonance]);

    const stopTone = useCallback(() => {
        if (oscRef.current) {
            const ctx = audioCtxRef.current;
            if (ctx) {
                envGainRef.current.gain.cancelScheduledValues(ctx.currentTime);
                envGainRef.current.gain.setValueAtTime(envGainRef.current.gain.value, ctx.currentTime);
                envGainRef.current.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
            }
            setTimeout(() => {
                if (oscRef.current) {
                    try { oscRef.current.stop(); } catch (e) {}
                    oscRef.current.disconnect();
                    oscRef.current = null;
                }
            }, 60);
        }
        setIsPlaying(false);
    }, []);

    const triggerNote = useCallback(async (freq) => {
        currentFreqRef.current = freq;
        const ctx = ensureAudioCtx();
        if (ctx.state === 'suspended') await ctx.resume();

        if (releaseTimeoutRef.current) clearTimeout(releaseTimeoutRef.current);

        if (oscRef.current) {
            try { oscRef.current.stop(); } catch (e) {}
            oscRef.current.disconnect();
        }

        const osc = ctx.createOscillator();
        osc.type = waveform;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.connect(filterRef.current);
        oscRef.current = osc;

        filterRef.current.type = filterType;
        filterRef.current.frequency.setValueAtTime(cutoff, ctx.currentTime);
        filterRef.current.Q.setValueAtTime(resonance, ctx.currentTime);

        const now = ctx.currentTime;
        const gain = envGainRef.current.gain;
        gain.cancelScheduledValues(now);
        gain.setValueAtTime(0, now);
        gain.linearRampToValueAtTime(1.0, now + attack);
        gain.linearRampToValueAtTime(sustain, now + attack + decay);

        osc.start();
    }, [ensureAudioCtx, waveform, filterType, cutoff, resonance, attack, decay, sustain]);

    const releaseNote = useCallback(() => {
        const ctx = audioCtxRef.current;
        if (!ctx || !oscRef.current) return;

        const now = ctx.currentTime;
        const gain = envGainRef.current.gain;
        gain.cancelScheduledValues(now);
        gain.setValueAtTime(gain.value, now);
        gain.linearRampToValueAtTime(0, now + release);

        releaseTimeoutRef.current = setTimeout(() => {
            if (oscRef.current) {
                try { oscRef.current.stop(); } catch (e) {}
                oscRef.current.disconnect();
                oscRef.current = null;
            }
        }, (release + 0.05) * 1000);
    }, [release]);

    const handleNoteOn = useCallback((note) => {
        const freq = NOTE_FREQUENCIES[note] * Math.pow(2, octave);
        setActiveNote(note);
        triggerNote(freq);
    }, [triggerNote, octave]);

    const handleNoteOff = useCallback(() => {
        setActiveNote(null);
        releaseNote();
    }, [releaseNote]);

    useEffect(() => {
        if (!filterRef.current || !audioCtxRef.current) return;
        const ctx = audioCtxRef.current;
        filterRef.current.type = filterType;
        filterRef.current.frequency.setValueAtTime(cutoff, ctx.currentTime);
        filterRef.current.Q.setValueAtTime(resonance, ctx.currentTime);
    }, [filterType, cutoff, resonance]);

    useEffect(() => {
        if (oscRef.current && audioCtxRef.current) oscRef.current.type = waveform;
    }, [waveform]);

    const loadPreset = useCallback((preset) => {
        setWaveform(preset.waveform);
        setFilterType(preset.filterType);
        setCutoff(preset.cutoff);
        setResonance(preset.resonance);
        setAttack(preset.attack);
        setDecay(preset.decay);
        setSustain(preset.sustain);
        setRelease(preset.release);
        setOctave(preset.octave);
    }, []);

    useEffect(() => {
        return () => {
            if (releaseTimeoutRef.current) clearTimeout(releaseTimeoutRef.current);
            if (oscRef.current) {
                try { oscRef.current.stop(); } catch (e) {}
                oscRef.current.disconnect();
            }
            if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
        };
    }, []);

    const goToSection = useCallback((s) => {
        stopTone();
        if (activeNote) { releaseNote(); setActiveNote(null); }
        setCurrentSection(s);
        setVisitedSections(prev => new Set([...prev, s]));
    }, [stopTone, activeNote, releaseNote]);

    // Position sliding tab indicator
    useEffect(() => {
        const list = tabListRef.current;
        const btn = tabBtnRefs.current[currentSection];
        if (!list || !btn) return;

        const listRect = list.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();
        const offsetLeft = btnRect.left - listRect.left;

        setTabIndicator({ x: offsetLeft, width: btnRect.width, ready: true });
    }, [currentSection]);

    // Reposition indicator on window resize
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

    useEffect(() => {
        const measure = () => {
            const hdr = document.querySelector('header');
            // Only a header that pins itself to the top eats space; one that
            // scrolls away with the page does not.
            const pinned = hdr && ['sticky', 'fixed'].includes(getComputedStyle(hdr).position);
            const h = pinned ? Math.round(hdr.getBoundingClientRect().height) : 0;
            const navH = navRef.current ? Math.round(navRef.current.getBoundingClientRect().height) : 0;
            setHeaderH(h);
            setStickTop(h + navH + 12);
        };
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, []);

    // Pin the panel only where it fits. Measured with a ResizeObserver as well
    // as on resize, because the displays are canvases that settle a frame or two
    // after the section renders.
    useEffect(() => {
        const el = rackRef.current;
        if (!el) return undefined;
        const check = () => {
            const twoColumn = window.matchMedia('(min-width: 1024px)').matches;
            const room = window.innerHeight - stickTop - 20;
            setPinned(twoColumn && el.scrollHeight <= room);
        };
        check();
        const ro = new ResizeObserver(check);
        ro.observe(el);
        window.addEventListener('resize', check);
        return () => { ro.disconnect(); window.removeEventListener('resize', check); };
    }, [currentSection, stickTop]);

    // Clicking a section tab lands the student on the instrument, not on
    // whatever part of the page they happened to be scrolled to. Without this
    // the Filter panel opens two-thirds below the fold and the circles — the
    // whole point of that section — are off screen until you scroll.
    const sectionTopRef = useRef(null);
    const mountedRef = useRef(false);
    useEffect(() => {
        if (!mountedRef.current) { mountedRef.current = true; return; }
        const el = sectionTopRef.current;
        if (!el) return;
        const y = window.scrollY + el.getBoundingClientRect().top - stickTop + 4;
        window.scrollTo({
            top: Math.max(0, y),
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        });
    }, [currentSection, stickTop]);

    const baseFreq = 220 * Math.pow(2, octave);
    const accent = SECTION_ACCENTS[currentSection];

    // ─── Shared Styles ─────────────────────────────────────────────────────────

    const pageStyle = {
        background: COLORS.bg,
        minHeight: '100vh',
        fontFamily: typography.fontFamily,
        color: COLORS.text,
    };

    // Wide enough for two columns, and no wider: at 1180px the reading side lands
    // at roughly 65 characters, which is where prose wants to be.
    const benchCol = {
        maxWidth: '1180px',
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

    // The section's opening paragraph is prose and keeps a reading measure even
    // though its container is now nearly twice as wide.
    const introStyle = { ...bodyStyle, maxWidth: '640px' };

    const btnStyle = (active, activeColor = accent) => ({
        border: 'none',
        cursor: 'pointer',
        fontFamily: typography.fontFamily,
        fontWeight: typography.weight.medium,
        borderRadius: borderRadius.md,
        padding: `${spacing[2]} ${spacing[4]}`,
        background: active ? COLORS.text : COLORS.surface,
        color: active ? '#FFFFFF' : COLORS.textSecondary,
        border: `1.5px solid ${active ? COLORS.text : COLORS.border}`,
        fontSize: typography.size.sm,
        transition: `all ${transitions.fast}`,
    });

    const pillBtn = (active) => ({
        border: 'none',
        cursor: 'pointer',
        fontFamily: typography.fontFamilyMono,
        fontWeight: typography.weight.medium,
        borderRadius: borderRadius.full,
        padding: `${spacing[1]} ${spacing[3]}`,
        background: active ? COLORS.text : 'transparent',
        color: active ? '#FFFFFF' : COLORS.textHint,
        border: `1px solid ${active ? COLORS.text : COLORS.border}`,
        fontSize: typography.size.xs,
        transition: `all ${transitions.fast}`,
        minWidth: '32px',
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

    // ─── Section 1: Oscillators ────────────────────────────────────────────────

    const renderSection1 = () => (
        <div style={benchCol}>
            <div style={{ paddingTop: spacing[10], marginBottom: spacing[6] }}>
                <h2 style={h2Style}>Oscillators</h2>
                <p style={introStyle}>
                    Every subtractive synth starts with an oscillator. It generates a raw waveform — the
                    harmonic content you will later shape with filters. Choose a waveform and press
                    play to hear how they differ.
                </p>
            </div>

            <Workbench rackRef={rackRef} pinned={pinned} rack={
                <InteractiveBox flush>
                    {/* Transport above the waveform tiles for the same reason as the
                        Filter panel: the control that starts the sound is the one that
                        must never be the first thing a short window cuts off. */}
                    <div style={{ display: 'flex', gap: spacing[3], alignItems: 'center', marginBottom: spacing[4], flexWrap: 'wrap' }}>
                        <button type="button"
                            onClick={() => isPlaying ? stopTone() : startTone(baseFreq)}
                            style={{ ...(isPlaying ? actionBtn('#dc2626') : actionBtn(accent)), padding: `${spacing[2]} ${spacing[5]}` }}
                        >
                            {isPlaying ? 'Stop' : 'Play'}
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                            <span style={{ color: COLORS.textHint, fontSize: typography.size.xs }}>Octave</span>
                            {[-2, -1, 0, 1, 2].map(o => (
                                <button type="button"
                                    key={o}
                                    onClick={() => { setOctave(o); if (isPlaying) startTone(220 * Math.pow(2, o)); }}
                                    style={pillBtn(octave === o)}
                                >
                                    {o > 0 ? `+${o}` : o}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Waveform selector. Icon beside the label rather than above it:
                        the stacked tiles were 76px tall for 20px of information. */}
                    <div style={{ display: 'flex', gap: spacing[2], marginBottom: spacing[4], flexWrap: 'wrap', justifyContent: 'center' }}>
                        {WAVEFORMS.map(w => (
                            <button type="button"
                                key={w.id}
                                onClick={() => setWaveform(w.id)}
                                style={{
                                    ...btnStyle(waveform === w.id),
                                    display: 'flex', alignItems: 'center',
                                    gap: spacing[2], padding: `${spacing[2]} ${spacing[3]}`,
                                }}
                            >
                                <WaveformIcon type={w.id} size={26} color={waveform === w.id ? '#FFFFFF' : COLORS.textSecondary} />
                                {w.label}
                            </button>
                        ))}
                    </div>

                    {/* Waveform display */}
                    {/* Two views of one sound: the shape, and the recipe. Stacked rather
                        than side by side now that the rack is a column — each display
                        gets the full width of the panel, which the circles in particular
                        want, since they need room for the chain AND the wave it draws. */}
                    <div style={displayStack}>
                        <div>
                            <p style={paneLabel}>How the shape gets made</p>
                            {/* The circles REPLACE the oscilloscope here rather than joining
                                it, and that is the whole reason this fits: they draw the same
                                waveform, so the pane costs no extra height. */}
                            <EpicycleWave
                                waveform={waveform}
                                filterType={filterType}
                                cutoff={cutoff}
                                resonance={resonance}
                                freqRef={currentFreqRef}
                                height={170}
                            />
                        </div>
                        <div>
                            <p style={paneLabel}>The harmonics inside it</p>
                            <HarmonicSpectrum analyserRef={analyserRef} freqRef={currentFreqRef} height={150} />
                        </div>
                    </div>

                    <p style={{
                        margin: `${spacing[3]} 0 0`,
                        fontSize: '0.82rem',
                        lineHeight: 1.5,
                        color: COLORS.textSecondary,
                    }}>
                        Each circle is one harmonic, turning at its own speed.{' '}
                        <Link
                            href="/additive-synth-explorer"
                            style={{ color: accent, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '2px' }}
                        >
                            Build a sound this way
                        </Link>{' '}
                        on the additive explorer, where you set every harmonic yourself.
                    </p>
                </InteractiveBox>
            }>
            {/* Inline check — interleaved after hands-on exploration */}
            <Callout type="question" title="Which waveform would you start with for subtractive synthesis?">
                <Callout.Options
                    options={['Sine — it has the cleanest sound', 'Sawtooth — it has the richest harmonics', 'Square — it sounds the loudest', 'Triangle — it is the most balanced']}
                    correctIndex={1}
                    explanation="You need harmonics to subtract! A sawtooth contains all harmonics (odd and even), giving you the most material to shape with a filter."
                />
            </Callout>

            {/* Educational content */}
            <div style={{ marginBottom: spacing[12] }}>
                <h3 style={{ fontSize: typography.size.xl, fontWeight: typography.weight.semibold, color: COLORS.text, marginBottom: spacing[5] }}>
                    Understanding waveforms
                </h3>
                <KeyConcept label="Sine Wave">
                    Contains only the fundamental frequency — no harmonics. Produces a pure, smooth tone. This is the simplest waveform.
                </KeyConcept>
                <KeyConcept label="Triangle Wave">
                    Contains odd harmonics only (1st, 3rd, 5th…), each falling as 1/n² — much faster than a square wave. This is why it sounds warmer and softer.
                </KeyConcept>
                <KeyConcept label="Sawtooth Wave">
                    Contains ALL harmonics (odd and even) at decreasing amplitude. Sounds bright and buzzy — the most common starting point for subtractive synthesis.
                </KeyConcept>
                <KeyConcept label="Square Wave">
                    Contains only odd harmonics (1/n amplitude law), each louder than the corresponding triangle harmonic (which fall as 1/n²). Sounds hollow and woody — often used for bass and pad sounds.
                </KeyConcept>

                <CopyAllNotes
                    title="Waveforms"
                    notes={[
                        { label: 'Sine Wave', text: 'Contains only the fundamental frequency — no harmonics. Produces a pure, smooth tone. This is the simplest waveform.' },
                        { label: 'Triangle Wave', text: 'Contains odd harmonics only (1st, 3rd, 5th…), each falling as 1/n² — much faster than a square wave. This is why it sounds warmer and softer.' },
                        { label: 'Sawtooth Wave', text: 'Contains ALL harmonics (odd and even) at decreasing amplitude. Sounds bright and buzzy — the most common starting point for subtractive synthesis.' },
                        { label: 'Square Wave', text: 'Contains only odd harmonics (1/n amplitude law), each louder than the corresponding triangle harmonic (which fall as 1/n²). Sounds hollow and woody — often used for bass and pad sounds.' },
                    ]}
                />

                <div style={{
                    background: `${accent}0A`, borderRadius: borderRadius.lg,
                    padding: `${spacing[4]} ${spacing[5]}`, marginTop: spacing[6],
                }}>
                    <p style={{ color: COLORS.textSecondary, fontSize: typography.size.sm, lineHeight: typography.lineHeight.relaxed, margin: 0 }}>
                        <strong style={{ color: COLORS.text }}>Exam tip:</strong> A sawtooth is the go-to starting waveform for subtractive synthesis because it has the richest harmonic content to filter.
                    </p>
                </div>
            </div>
            </Workbench>
        </div>
    );

    // ─── Section 2: The Filter ─────────────────────────────────────────────────

    const renderSection2 = () => (
        <div style={benchCol}>
            <div style={{ paddingTop: spacing[10], marginBottom: spacing[6] }}>
                <h2 style={h2Style}>The Filter</h2>
                <p style={introStyle}>
                    This is the "subtractive" part. A filter removes frequencies from the oscillator's
                    waveform. Press play, then drag the cutoff down and watch the outer circles shrink
                    away as you hear the sound get darker — that is the harmonics being taken out.
                </p>
            </div>

            {/* No hint under this panel: it carries three displays and the
                opening paragraph already says what to do with the slider, so the
                extra line was two centimetres the rack could not spare. */}
            <Workbench rackRef={rackRef} pinned={pinned} rack={
                <InteractiveBox flush>
                    {/* Transport first, not last. This panel is the tallest on the
                        page, so on a short window its bottom edge is the part that
                        gets cut — and the one control that must never be out of
                        reach is the one that starts the sound. */}
                    <div style={{ display: 'flex', gap: spacing[2], marginBottom: spacing[4], flexWrap: 'wrap', alignItems: 'center' }}>
                        <button type="button"
                            onClick={() => isPlaying ? stopTone() : startTone(baseFreq)}
                            style={{ ...(isPlaying ? actionBtn('#dc2626') : actionBtn(accent)), padding: `${spacing[2]} ${spacing[5]}` }}
                        >
                            {isPlaying ? 'Stop' : 'Play'}
                        </button>
                        {FILTER_TYPES.map(f => (
                            <button type="button" key={f.id} onClick={() => setFilterType(f.id)} style={btnStyle(filterType === f.id)}>
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* Sliders. These are the reason the whole page was rearranged: the
                        cutoff control and the circles it acts on now sit in one panel,
                        so the cause and the effect are on screen together. */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: spacing[5], marginBottom: spacing[4] }}>
                        <SynthControl label="Cutoff" value={cutoff} min={20} max={20000} step={1} onChange={setCutoff} unit="Hz" color={accent} logScale />
                        <SynthControl label="Resonance" value={resonance} min={0.5} max={20} step={0.1} onChange={setResonance} color={accent} />
                    </div>

                    {/* Three answers to one slider. The circles come FIRST, directly
                        under the control that acts on them, because they are the answer
                        Mike asked for and the one a student should meet before any
                        diagram: cause and headline effect within a few centimetres of
                        each other. The response curve and the bars sit below as the
                        supporting evidence.

                        The oscilloscope that used to sit here has gone: the circles draw
                        the same filtered shape and say WHY it looks like that, so keeping
                        both was one display too many for the height available. */}
                    <div style={displayStack}>
                        <div>
                            <p style={paneLabel}>What it does to each harmonic</p>
                            <EpicycleWave
                                waveform={waveform}
                                filterType={filterType}
                                cutoff={cutoff}
                                resonance={resonance}
                                freqRef={currentFreqRef}
                                height={165}
                            />
                        </div>
                        <div>
                            <p style={paneLabel}>What is left of the sound</p>
                            {/* The analyser sits AFTER the filter, so this is measured
                                rather than modelled — closing the cutoff visibly removes
                                the top bars. Subtractive synthesis, on screen. */}
                            <HarmonicSpectrum analyserRef={analyserRef} freqRef={currentFreqRef} height={125} />
                        </div>
                    </div>

                    <p style={{ color: COLORS.textHint, fontSize: typography.size.xs, margin: `${spacing[3]} 0 0` }}>
                        Filtering a <strong style={{ color: COLORS.textSecondary, fontWeight: 600 }}>{WAVEFORMS.find(w => w.id === waveform)?.label.toLowerCase()}</strong> wave
                        {' · '}change that in Oscillators
                    </p>
                </InteractiveBox>
            }>
            {/* Inline definition with nested try-it prompt */}
            <Callout type="definition" title="Cutoff Frequency">
                The frequency at which the filter begins to attenuate the signal. Below this point (for a low-pass filter), frequencies pass through unchanged. Above it, they are progressively reduced.
                <Callout type="listen" title="Hear the difference" collapsible={false}>
                    Set the filter to Low-Pass, press play, then drag the cutoff slowly from 20kHz down to 200Hz. The bright, buzzy harmonics disappear from the sound, the outer circles shrink to nothing, and the bars fall away one by one — three views of the same thing, which is subtractive synthesis in action.
                </Callout>
            </Callout>

            {/* Educational content */}
            <div style={{ marginBottom: spacing[12] }}>
                <h3 style={{ fontSize: typography.size.xl, fontWeight: typography.weight.semibold, color: COLORS.text, marginBottom: spacing[4] }}>
                    How filters work
                </h3>

                {/* The response curve reads better here than in the panel. It is a
                    DIAGRAM — the shape a student has to recognise and draw in the
                    exam — so it belongs beside the words that name it, where it
                    redraws itself as they read about each type. Moving it also gave
                    the panel back the height it needed to fit a laptop window. */}
                <div style={{ marginBottom: spacing[5] }}>
                    <p style={paneLabel}>{FILTER_TYPES.find(f => f.id === filterType)?.label} — the shape of its response</p>
                    <FilterResponseSVG type={filterType} cutoff={cutoff} resonance={resonance} height={130} accentColor={accent} />
                </div>

                <KeyConcept label="Low-Pass Filter (LPF)">
                    Passes frequencies below the cutoff and attenuates those above. Sweeping the cutoff down makes the sound darker and more muffled — the most common filter in subtractive synthesis. A typical synth LPF rolls off at −12 or −24 dB per octave; steeper slopes remove harmonics faster.
                </KeyConcept>
                <KeyConcept label="High-Pass Filter (HPF)">
                    Passes frequencies above the cutoff and attenuates those below. Makes the sound thinner and brighter. Useful for removing low-end rumble.
                </KeyConcept>
                <KeyConcept label="Band-Pass Filter (BPF)">
                    Passes a band of frequencies around the cutoff and attenuates both sides. Creates a "nasal" or "telephone" quality at narrow bandwidth.
                </KeyConcept>
                <KeyConcept label="Resonance (Q)">
                    Boosts frequencies at the cutoff point, creating a peak. High resonance produces a whistling or ringing quality. At extreme values, the filter self-oscillates.
                </KeyConcept>

                <CopyAllNotes
                    title="Filters"
                    notes={[
                        { label: 'Low-Pass Filter (LPF)', text: 'Passes frequencies below the cutoff and attenuates those above. Sweeping the cutoff down makes the sound darker and more muffled — the most common filter in subtractive synthesis. A typical synth LPF rolls off at −12 or −24 dB per octave; steeper slopes remove harmonics faster.' },
                        { label: 'High-Pass Filter (HPF)', text: 'Passes frequencies above the cutoff and attenuates those below. Makes the sound thinner and brighter. Useful for removing low-end rumble.' },
                        { label: 'Band-Pass Filter (BPF)', text: 'Passes a band of frequencies around the cutoff and attenuates both sides. Creates a "nasal" or "telephone" quality at narrow bandwidth.' },
                        { label: 'Resonance (Q)', text: 'Boosts frequencies at the cutoff point, creating a peak. High resonance produces a whistling or ringing quality. At extreme values, the filter self-oscillates.' },
                    ]}
                />

                <div style={{
                    background: `${accent}0A`, borderRadius: borderRadius.lg,
                    padding: `${spacing[4]} ${spacing[5]}`, marginTop: spacing[6],
                }}>
                    <p style={{ color: COLORS.textSecondary, fontSize: typography.size.sm, lineHeight: typography.lineHeight.relaxed, margin: 0 }}>
                        <strong style={{ color: COLORS.text }}>Exam tip:</strong> The "subtractive" in subtractive synthesis refers to this filtering stage — you start with rich harmonics and subtract what you don't need.
                    </p>
                </div>
            </div>
            </Workbench>
        </div>
    );

    // ─── Section 3: Envelope ───────────────────────────────────────────────────

    const renderSection3 = () => (
        <div style={benchCol}>
            <div style={{ paddingTop: spacing[10], marginBottom: spacing[6] }}>
                <h2 style={h2Style}>Amplitude Envelope</h2>
                <p style={introStyle}>
                    The ADSR envelope controls how the volume changes over time when a note is played.
                    It gives each sound its characteristic "shape" — from plucky stabs to swelling pads.
                </p>
            </div>

            <Workbench rackRef={rackRef} pinned={pinned} rack={
                <InteractiveBox flush hint="Adjust the sliders and press Trigger Note to hear the envelope shape">
                    {/* Envelope viz */}
                    <div style={{ marginBottom: spacing[4] }}>
                        <EnvelopeShapeSVG attack={attack} decay={decay} sustain={sustain} release={release} height={130} accentColor={accent} />
                    </div>

                    {/* ADSR sliders */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: spacing[4], marginBottom: spacing[4] }}>
                        <SynthControl label="Attack" value={attack} min={0.001} max={2} step={0.001} onChange={setAttack} unit="s" color={accent} />
                        <SynthControl label="Decay" value={decay} min={0.001} max={2} step={0.001} onChange={setDecay} unit="s" color={accent} />
                        <SynthControl label="Sustain" value={sustain} min={0} max={1} step={0.01} onChange={setSustain} color={accent} />
                        <SynthControl label="Release" value={release} min={0.001} max={3} step={0.001} onChange={setRelease} unit="s" color={accent} />
                    </div>

                    {/* Trigger */}
                    <button type="button"
                        onClick={() => {
                            triggerNote(baseFreq);
                            setTimeout(() => releaseNote(), (attack + decay + 0.3) * 1000);
                        }}
                        style={actionBtn(accent)}
                    >
                        Trigger Note
                    </button>

                    {/* Waveform */}
                    <div style={{ marginTop: spacing[4] }}>
                        <p style={paneLabel}>The sound as it happens</p>
                        <WaveformCanvas analyserRef={analyserRef} height={130} color={accent} />
                    </div>
                </InteractiveBox>
            }>
            {/* Inline warning — common exam mistake */}
            <Callout type="warning" title="Sustain is a level, not a time">
                Students often describe sustain as "how long the sound holds." That is wrong — sustain is the <strong>amplitude level</strong> maintained while the key is held. The hold duration depends on how long the player keeps the key pressed, not on the sustain value. Set sustain to 0 above and trigger a note to hear the difference.
            </Callout>

            {/* Educational content */}
            <div style={{ marginBottom: spacing[12] }}>
                <h3 style={{ fontSize: typography.size.xl, fontWeight: typography.weight.semibold, color: COLORS.text, marginBottom: spacing[5] }}>
                    The four ADSR stages
                </h3>
                <KeyConcept label="Attack">
                    The time it takes for the sound to rise from silence to full volume after the key is pressed. Short attack = instant punch. Long attack = slow swell.
                </KeyConcept>
                <KeyConcept label="Decay">
                    The time it takes for the sound to fall from the peak to the sustain level. A short decay with low sustain creates a percussive "pluck" character.
                </KeyConcept>
                <KeyConcept label="Sustain">
                    The level (not a time!) the sound holds at while the key remains pressed. This is the only ADSR parameter measured as a level.
                </KeyConcept>
                <KeyConcept label="Release">
                    The time it takes for the sound to fade to silence after the key is released. Long release = notes that ring out. Short release = tight cutoff.
                </KeyConcept>

                <CopyAllNotes
                    title="ADSR Envelope"
                    notes={[
                        { label: 'Attack', text: 'The time it takes for the sound to rise from silence to full volume after the key is pressed. Short attack = instant punch. Long attack = slow swell.' },
                        { label: 'Decay', text: 'The time it takes for the sound to fall from the peak to the sustain level. A short decay with low sustain creates a percussive "pluck" character.' },
                        { label: 'Sustain', text: 'The level (not a time!) the sound holds at while the key remains pressed. This is the only ADSR parameter measured as a level.' },
                        { label: 'Release', text: 'The time it takes for the sound to fade to silence after the key is released. Long release = notes that ring out. Short release = tight cutoff.' },
                    ]}
                />

                <div style={{
                    background: `${accent}0A`, borderRadius: borderRadius.lg,
                    padding: `${spacing[4]} ${spacing[5]}`, marginTop: spacing[6],
                }}>
                    <p style={{ color: COLORS.textSecondary, fontSize: typography.size.sm, lineHeight: typography.lineHeight.relaxed, margin: 0 }}>
                        <strong style={{ color: COLORS.text }}>Exam tip:</strong> Sustain is the only ADSR stage measured as a level (amplitude). Attack, Decay, and Release are all measured in time.
                    </p>
                </div>
            </div>
            </Workbench>
        </div>
    );

    // ─── Section 4: Build a Patch ──────────────────────────────────────────────

    const renderSection4 = () => {
        const quizScore = Object.values(quizAnswers).filter((a, i) => a === QUIZ_QUESTIONS[i]?.correct).length;

        return (
            // No sticky rack here. The patch panel carries every control on the
            // page plus a keyboard, so it is taller than a laptop window — pinning
            // it would put its own bottom half permanently out of reach. It takes
            // the full width instead, which lets its internal grids spread out and
            // costs less height than the 800px column it had before.
            <div style={benchCol}>
                <div style={{ paddingTop: spacing[10], marginBottom: spacing[6] }}>
                    <h2 style={h2Style}>Build a Patch</h2>
                    <p style={introStyle}>
                        Combine everything: oscillator waveform, filter settings, and ADSR envelope.
                        Try the presets to hear classic synth sounds, then tweak to create your own.
                    </p>
                </div>

                <InteractiveBox>
                    {/* Presets */}
                    <div style={{ marginBottom: spacing[5] }}>
                        <div style={{ color: COLORS.textHint, fontSize: typography.size.xs, fontWeight: typography.weight.medium, marginBottom: spacing[2], textTransform: 'uppercase', letterSpacing: typography.letterSpacing.wide }}>
                            Presets
                        </div>
                        <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap', alignItems: 'center' }}>
                            {PRESETS.map(p => (
                                <button type="button" key={p.name} onClick={() => loadPreset(p)} style={btnStyle(false)}>
                                    {p.name}
                                </button>
                            ))}
                            <div style={{ marginLeft: 'auto' }}>
                                <ProductionCopyButton
                                    accent={COLORS.mastery || '#0891b2'}
                                    buildContent={(mode, learnMode) => {
                                        const matchedPreset = PRESETS.find(p =>
                                            p.waveform === waveform && p.cutoff === cutoff && p.filterType === filterType
                                        );
                                        const quizResults = quizSubmitted ? QUIZ_QUESTIONS.map((q, i) => ({
                                            question: q.question,
                                            studentAnswer: q.options[quizAnswers[i]] || '(none)',
                                            correctAnswer: q.options[q.correct],
                                            correct: quizAnswers[i] === q.correct,
                                            explanation: q.explanation,
                                        })) : null;
                                        return buildSynthCopyMarkdown({
                                            waveform, filterType, cutoff, resonance,
                                            attack, decay, sustain, release, octave,
                                            presetName: matchedPreset?.name,
                                            quizResults,
                                            mode, learnMode,
                                        });
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Controls grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: spacing[6], marginBottom: spacing[5] }}>
                        {/* Left: Oscillator + Filter */}
                        <div>
                            <div style={{ color: COLORS.textHint, fontSize: typography.size.xs, marginBottom: spacing[3], textTransform: 'uppercase', letterSpacing: typography.letterSpacing.wide }}>
                                Oscillator
                            </div>
                            <div style={{ display: 'flex', gap: spacing[2], marginBottom: spacing[4], flexWrap: 'wrap' }}>
                                {WAVEFORMS.map(w => (
                                    <button type="button" key={w.id} onClick={() => setWaveform(w.id)} style={{
                                        ...btnStyle(waveform === w.id),
                                        padding: `${spacing[1]} ${spacing[3]}`, fontSize: typography.size.xs,
                                    }}>
                                        {w.label}
                                    </button>
                                ))}
                            </div>

                            <div style={{ color: COLORS.textHint, fontSize: typography.size.xs, marginBottom: spacing[3], textTransform: 'uppercase', letterSpacing: typography.letterSpacing.wide }}>
                                Filter
                            </div>
                            <div style={{ display: 'flex', gap: spacing[2], marginBottom: spacing[3], flexWrap: 'wrap' }}>
                                {FILTER_TYPES.map(f => (
                                    <button type="button" key={f.id} onClick={() => setFilterType(f.id)} style={{
                                        ...btnStyle(filterType === f.id),
                                        padding: `${spacing[1]} ${spacing[3]}`, fontSize: typography.size.xs,
                                    }}>
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
                                <SynthControl label="Cutoff" value={cutoff} min={20} max={20000} step={1} onChange={setCutoff} unit="Hz" color={COLORS.filter} logScale />
                                <SynthControl label="Resonance" value={resonance} min={0.5} max={20} step={0.1} onChange={setResonance} color={COLORS.filter} />
                            </div>
                        </div>

                        {/* Right: Envelope */}
                        <div>
                            <div style={{ color: COLORS.textHint, fontSize: typography.size.xs, marginBottom: spacing[3], textTransform: 'uppercase', letterSpacing: typography.letterSpacing.wide }}>
                                Envelope
                            </div>
                            <div style={{ marginBottom: spacing[3] }}>
                                <EnvelopeShapeSVG attack={attack} decay={decay} sustain={sustain} release={release} height={100} accentColor={COLORS.env} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
                                <SynthControl label="Attack" value={attack} min={0.001} max={2} step={0.001} onChange={setAttack} unit="s" color={COLORS.env} />
                                <SynthControl label="Decay" value={decay} min={0.001} max={2} step={0.001} onChange={setDecay} unit="s" color={COLORS.env} />
                                <SynthControl label="Sustain" value={sustain} min={0} max={1} step={0.01} onChange={setSustain} color={COLORS.env} />
                                <SynthControl label="Release" value={release} min={0.001} max={3} step={0.001} onChange={setRelease} unit="s" color={COLORS.env} />
                            </div>
                        </div>
                    </div>

                    {/* Visualizations */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: spacing[4], marginBottom: spacing[5] }}>
                        <div>
                            <div style={{ color: COLORS.textHint, fontSize: typography.size.xs, marginBottom: spacing[2] }}>Filter Response</div>
                            <FilterResponseSVG type={filterType} cutoff={cutoff} resonance={resonance} height={120} accentColor={COLORS.filter} />
                        </div>
                        <div>
                            <div style={{ color: COLORS.textHint, fontSize: typography.size.xs, marginBottom: spacing[2] }}>Waveform</div>
                            <WaveformCanvas analyserRef={analyserRef} height={120} color={COLORS.osc} />
                        </div>
                    </div>

                    {/* Keyboard */}
                    <div style={{ color: COLORS.textHint, fontSize: typography.size.xs, marginBottom: spacing[2], textTransform: 'uppercase', letterSpacing: typography.letterSpacing.wide }}>
                        Keyboard
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4], marginBottom: spacing[4], flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                            <span style={{ color: COLORS.textHint, fontSize: typography.size.xs }}>Oct</span>
                            {[-2, -1, 0, 1, 2].map(o => (
                                <button type="button" key={o} onClick={() => setOctave(o)} style={pillBtn(octave === o)}>
                                    {o > 0 ? `+${o}` : o}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <MiniKeyboard onNoteOn={handleNoteOn} onNoteOff={handleNoteOff} activeNote={activeNote} />
                    </div>
                </InteractiveBox>

                {/* Quiz */}
                <div style={{ marginBottom: spacing[12] }}>
                    <h3 style={{ fontSize: typography.size.xl, fontWeight: typography.weight.semibold, color: COLORS.text, marginBottom: spacing[5] }}>
                        Quick check
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: `0 ${spacing[8]}`, alignItems: 'start' }}>
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
                                        bg = `${COLORS.patch}12`; borderCol = COLORS.patch; textCol = COLORS.text;
                                    }

                                    return (
                                        <button type="button"
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
                    </div>

                    {!quizSubmitted ? (
                        <button type="button"
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
                        <p style={{ color: quizScore === QUIZ_QUESTIONS.length ? '#059669' : COLORS.patch, fontSize: typography.size.base, fontWeight: typography.weight.semibold }}>
                            {quizScore}/{QUIZ_QUESTIONS.length} correct{quizScore === QUIZ_QUESTIONS.length && ' — Perfect!'}
                        </p>
                    )}
                </div>
            </div>
        );
    };

    // ─── Main Render ───────────────────────────────────────────────────────────

    return (
        <div style={{ ...pageStyle, '--sse-stick': `${stickTop}px` }}>
            <style>{BENCH_CSS}</style>

            {/* Navigation */}
            <nav ref={navRef} style={{
                position: 'sticky', top: headerH, zIndex: 50,
                background: 'rgba(245,244,242,0.95)', backdropFilter: 'blur(8px)',
                borderBottom: `1px solid ${COLORS.border}`,
                padding: `${spacing[3]} ${spacing[6]}`,
            }}>
                <div
                    ref={tabListRef}
                    style={{
                        maxWidth: '480px', margin: '0 auto',
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
                        { n: 1, label: 'Oscillators' },
                        { n: 2, label: 'Filter' },
                        { n: 3, label: 'Envelope' },
                        { n: 4, label: 'Build a Patch' },
                    ].map(s => (
                        <button type="button"
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
                                transition: `color 0.3s ease`,
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
                // Was marginTop spacing[16] + minHeight 240px, which pinned the band
                // open however much the padding inside it came down — the reason a
                // first pass at shrinking this changed nothing at all.
                marginTop: spacing[6],
                marginBottom: spacing[6],
                minHeight: '150px',
            }}>
                <video aria-hidden="true"
                    autoPlay
                    muted
                    loop
                    playsInline
                    onLoadedData={(e) => {
                        e.target.style.opacity = 1;
                        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) e.target.pause();
                    }}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: 0,
                        transition: 'opacity 0.8s ease-out',
                    }}
                    src="/synthesis-hero.mp4"
                />
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to bottom, rgba(26,26,46,0.4) 0%, rgba(26,26,46,0.7) 100%)',
                }} />
                {/* Compressed from a 350px full-bleed poster to a band, 2026-07-30.
                    Mike: "I'm having to scroll up and down a lot, and it isn't just
                    on one page." On a tool page the instrument is the content, and a
                    third of a screen of decorative video before you reach a single
                    control is the most expensive thing here. The video stays — it is
                    good, and it says "synthesis" faster than a sentence — it just
                    stops being the first screen. */}
                <div style={{
                    position: 'relative',
                    maxWidth: '760px', margin: '0 auto',
                    padding: `${spacing[6]} ${spacing[6]} ${spacing[5]}`,
                    textAlign: 'center',
                }}>
                    <h1 style={{
                        fontSize: typography.size['2xl'],
                        fontWeight: typography.weight.bold,
                        color: '#ffffff',
                        lineHeight: typography.lineHeight.tight,
                        marginBottom: spacing[2],
                        textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}>
                        Subtractive Synthesis
                    </h1>
                    <p style={{
                        color: 'rgba(255,255,255,0.85)',
                        fontSize: typography.size.base,
                        lineHeight: typography.lineHeight.normal,
                        maxWidth: '560px', margin: '0 auto',
                        textShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    }}>
                        Build sounds from scratch. Choose waveforms, shape them with filters, sculpt dynamics with envelopes.
                    </p>
                </div>
            </div>

            {/* Current section */}
            <div ref={sectionTopRef} />
            {currentSection === 1 && renderSection1()}
            {currentSection === 2 && renderSection2()}
            {currentSection === 3 && renderSection3()}
            {currentSection === 4 && renderSection4()}

            {/* Bottom navigation */}
            <div style={{
                ...benchCol,
                padding: `${spacing[4]} ${spacing[6]} ${spacing[12]}`,
                display: 'flex', justifyContent: 'space-between',
            }}>
                {currentSection > 1 ? (
                    <button type="button" onClick={() => goToSection(currentSection - 1)} style={{
                        border: 'none', cursor: 'pointer', fontFamily: typography.fontFamily,
                        background: 'transparent', color: COLORS.textHint,
                        fontSize: typography.size.sm, padding: spacing[2],
                    }}>
                        ← Previous
                    </button>
                ) : <div />}
                {currentSection < 4 && (
                    <button type="button" onClick={() => goToSection(currentSection + 1)} style={{
                        border: 'none', cursor: 'pointer', fontFamily: typography.fontFamily,
                        fontWeight: typography.weight.semibold,
                        background: COLORS.surface, color: COLORS.text,
                        fontSize: typography.size.sm, padding: `${spacing[3]} ${spacing[5]}`,
                        borderRadius: borderRadius.md,
                        border: `1px solid ${COLORS.border}`,
                    }}>
                        Next →
                    </button>
                )}
            </div>
        </div>
    );
}
