'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { theme, typography, spacing, borderRadius, transitions } from '@/lib/theme';

// ============================================
// ADC Explorer
// A-Level Music Technology — Topic 2.4
// Three tabs mapped to book extract sections
// ============================================

const t = theme.light;

const TABS = [
    { id: 'sampling', label: 'Sampling' },
    { id: 'bitdepth', label: 'Bit Depth' },
];

// Tier colours matching the book extract difficulty levels
const TIER = {
    foundation: '#059669',
    intermediate: '#d97706',
    advanced: '#DC2626',
};

// ─── Shared styles ──────────────────────────────────────────────
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
    marginBottom: spacing[2],
};

const bodyText = {
    fontSize: typography.size.sm,
    color: t.text.secondary,
    lineHeight: typography.lineHeight.relaxed,
};

const strongText = {
    color: t.text.primary,
    fontWeight: typography.weight.semibold,
};

// ─── Main component ─────────────────────────────────────────────
export default function ADCExplorer() {
    const [activeTab, setActiveTab] = useState('sampling');

    return (
        <div style={{
            maxWidth: '64rem',
            margin: '0 auto',
            padding: spacing[6],
            fontFamily: typography.fontFamily,
        }}>
            {/* Tab navigation */}
            <div style={{
                display: 'flex',
                gap: spacing[1],
                marginBottom: spacing[6],
                background: t.bg.secondary,
                borderRadius: borderRadius.lg,
                padding: spacing[1],
            }}>
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            flex: 1,
                            padding: `${spacing[3]} ${spacing[4]}`,
                            borderRadius: borderRadius.md,
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: typography.size.sm,
                            fontWeight: typography.weight.semibold,
                            fontFamily: typography.fontFamily,
                            background: activeTab === tab.id ? t.bg.elevated : 'transparent',
                            color: activeTab === tab.id ? t.accent.primary : t.text.tertiary,
                            boxShadow: activeTab === tab.id ? t.shadow.sm : 'none',
                            transition: `all ${transitions.fast} ${transitions.easing}`,
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            {activeTab === 'sampling' && <SamplingTab />}
            {activeTab === 'bitdepth' && <BitDepthTab />}
        </div>
    );
}

// ─── Tab 1: Sampling ────────────────────────────────────────────
function SamplingTab() {
    const [sampleRate, setSampleRate] = useState(20);
    const frequency = 3;

    const samplesPerCycle = (sampleRate / frequency).toFixed(1);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[6] }}>
            {/* Context */}
            <div style={card}>
                <span style={{ ...sectionLabel, color: TIER.foundation }}>
                    What is Sampling?
                </span>
                <p style={bodyText}>
                    When sound enters a microphone, it produces a <strong style={strongText}>continuously varying electrical signal</strong> (the
                    blue wave below). To store this digitally, the ADC takes <strong style={strongText}>measurements at regular
                    intervals</strong> — each measurement is called a <strong style={strongText}>sample</strong>.
                    Use the slider to change how many samples are taken.
                </p>
            </div>

            {/* Visualisation */}
            <WaveformVisualiser
                frequency={frequency}
                sampleRate={sampleRate}
                bitDepth={16}
                showStaircase={false}
                showQuantisationLines={false}
            />

            {/* Control */}
            <Slider
                label="Sample Rate"
                value={sampleRate}
                min={4}
                max={80}
                step={2}
                setter={setSampleRate}
                colour={TIER.foundation}
                unit=" samples"
            />

            {/* Dynamic feedback */}
            <div style={card}>
                <span style={{ ...sectionLabel, color: TIER.foundation }}>
                    What You're Seeing
                </span>
                <p style={bodyText}>
                    The ADC is taking <strong style={strongText}>{sampleRate} samples</strong> across
                    this wave, giving <strong style={strongText}>{samplesPerCycle} samples per cycle</strong>.
                    {Number(samplesPerCycle) < 3
                        ? ' That\'s very few — the shape of the wave is barely captured. The digital version would sound nothing like the original.'
                        : Number(samplesPerCycle) < 8
                            ? ' The basic shape is captured, but the curves aren\'t smooth. Some detail is lost between samples.'
                            : ' The wave shape is captured well. More samples means a more accurate digital copy of the original sound.'
                    }
                </p>
                <div style={{
                    marginTop: spacing[4],
                    padding: spacing[3],
                    background: t.bg.secondary,
                    borderRadius: borderRadius.md,
                    borderLeft: `3px solid ${TIER.foundation}`,
                }}>
                    <p style={{ ...bodyText, fontSize: typography.size.xs, fontStyle: 'italic' }}>
                        In real audio: CD quality uses 44,100 samples per second. Professional recording uses 48,000 or 96,000.
                        The slider above is simplified — but the principle is identical.
                    </p>
                </div>
            </div>

            {/* Key Definitions */}
            <DefinitionsSection
                title="Sampling — Key Definitions (Section 2.4)"
                definitions={SAMPLING_DEFINITIONS}
            />
        </div>
    );
}



// ─── Tab 3: Bit Depth ───────────────────────────────────────────
function BitDepthTab() {
    const [bitDepth, setBitDepth] = useState(3);
    const sampleRate = 30;
    const frequency = 3;

    const levels = Math.pow(2, bitDepth);
    const dynamicRange = bitDepth * 6;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[6] }}>
            {/* Context */}
            <div style={card}>
                <span style={{ ...sectionLabel, color: TIER.intermediate }}>
                    What is Bit Depth?
                </span>
                <p style={bodyText}>
                    Bit depth determines <strong style={strongText}>how many amplitude levels</strong> are
                    available for each sample. More bits means more levels, which means
                    a <strong style={strongText}>more accurate representation</strong> of the original sound
                    and a <strong style={strongText}>wider dynamic range</strong>.
                </p>
            </div>

            {/* Visualisation — with staircase and quantisation lines */}
            <WaveformVisualiser
                frequency={frequency}
                sampleRate={sampleRate}
                bitDepth={bitDepth}
                showStaircase={true}
                showQuantisationLines={true}
            />

            {/* Control */}
            <Slider
                label="Bit Depth"
                value={bitDepth}
                min={1}
                max={8}
                step={1}
                setter={setBitDepth}
                colour={TIER.intermediate}
                unit="-bit"
            />

            {/* Dynamic feedback */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[4] }}>
                <div style={card}>
                    <span style={{ ...sectionLabel, color: TIER.intermediate }}>
                        Quantisation Levels
                    </span>
                    <p style={{
                        fontSize: typography.size['2xl'],
                        fontWeight: typography.weight.bold,
                        color: t.text.primary,
                    }}>
                        {levels.toLocaleString()}
                    </p>
                    <p style={{ ...bodyText, marginTop: spacing[2] }}>
                        2<sup>{bitDepth}</sup> = {levels} possible amplitude values.
                        {bitDepth <= 3
                            ? ' Very coarse — you can see the steps clearly. This would sound distorted.'
                            : bitDepth <= 5
                                ? ' The steps are getting finer. Sound quality improves noticeably.'
                                : ' Fine enough for clean audio. CD uses 16-bit (65,536 levels).'
                        }
                    </p>
                </div>
                <div style={card}>
                    <span style={{ ...sectionLabel, color: TIER.intermediate }}>
                        Dynamic Range
                    </span>
                    <p style={{
                        fontSize: typography.size['2xl'],
                        fontWeight: typography.weight.bold,
                        color: t.text.primary,
                    }}>
                        ~{dynamicRange} dB
                    </p>
                    <p style={{ ...bodyText, marginTop: spacing[2] }}>
                        Bit depth &times; 6 = dynamic range in dB.
                        {dynamicRange < 24
                            ? ' Very limited — the difference between quiet and loud is tiny.'
                            : dynamicRange < 48
                                ? ' Moderate range. Quiet passages would still have audible noise.'
                                : ' Good range. CD quality (96 dB) can capture whispers to loud drums.'
                        }
                    </p>
                </div>
            </div>

            {/* Exam tip */}
            <div style={{
                ...card,
                background: t.accent.infoLight,
                borderLeft: `4px solid ${t.accent.info}`,
            }}>
                <span style={{ ...sectionLabel, color: t.accent.info }}>
                    Exam Formula
                </span>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing[2],
                    fontFamily: typography.fontFamilyMono,
                    fontSize: typography.size.sm,
                    color: t.text.primary,
                    padding: `${spacing[3]} 0`,
                }}>
                    <p>Quantisation levels = 2<sup>n</sup> (where n = bit depth)</p>
                    <p>Dynamic range &asymp; bit depth &times; 6 dB</p>
                </div>
                <p style={{ ...bodyText, fontSize: typography.size.xs }}>
                    16-bit = 65,536 levels = ~96 dB. 24-bit = 16,777,216 levels = ~144 dB.
                    You're expected to know the formula, not memorise the numbers.
                </p>
            </div>

            {/* Key Definitions */}
            <DefinitionsSection
                title="Bit Depth & Dynamic Range — Key Definitions (Section 2.4)"
                definitions={BITDEPTH_DEFINITIONS}
            />
        </div>
    );
}

// ─── Key Definitions Data ────────────────────────────────────────
const SAMPLING_DEFINITIONS = [
    { label: 'Sampling', text: 'The process of measuring the amplitude of an analogue signal at regular intervals in time. Each measurement is called a sample.' },
    { label: 'Sample Rate', text: 'The number of samples taken per second, measured in Hertz (Hz). CD quality = 44,100 Hz. Professional = 48,000 Hz or 96,000 Hz.' },
    { label: 'ADC (Analogue-to-Digital Converter)', text: 'A device that converts a continuously varying analogue electrical signal into a stream of binary numerical data by sampling the signal at regular intervals.' },
    { label: 'Analogue Signal', text: 'A continuously varying electrical signal whose voltage is proportional to the original sound wave. Produced by microphones.' },
    { label: 'Digital Signal', text: 'A signal represented as a series of discrete binary numbers, each encoding the amplitude of the sound at a specific moment in time.' },
];

const BITDEPTH_DEFINITIONS = [
    { label: 'Bit Depth', text: 'The number of bits used to represent each sample\'s amplitude. More bits = more amplitude levels = more accurate representation. CD = 16-bit, professional = 24-bit.' },
    { label: 'Dynamic Range', text: 'The ratio between the loudest and quietest sounds that can be represented. Calculated as bit depth x 6 dB. 16-bit = ~96 dB, 24-bit = ~144 dB.' },
    { label: 'DAC (Digital-to-Analogue Converter)', text: 'A device that converts binary numerical data back into a continuously varying analogue electrical signal for playback through speakers or headphones.' },
];

// ─── Shared: KeyConcept (click-to-copy) ─────────────────────────
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

// ─── Shared: Definitions section ────────────────────────────────
function DefinitionsSection({ title, definitions }) {
    return (
        <div>
            <h3 style={{
                fontSize: typography.size.xl,
                fontWeight: typography.weight.semibold,
                color: t.text.primary,
                marginBottom: spacing[5],
            }}>
                Key Definitions
            </h3>
            {definitions.map(def => (
                <KeyConcept key={def.label} label={def.label}>
                    {def.text}
                </KeyConcept>
            ))}
            <CopyAllNotes title={title} notes={definitions} />
        </div>
    );
}

// ─── Shared: Waveform Visualiser ────────────────────────────────
function WaveformVisualiser({ frequency, sampleRate, bitDepth, showStaircase, showQuantisationLines }) {
    const containerRef = useRef(null);
    const [svgWidth, setSvgWidth] = useState(700);
    const svgHeight = 260;

    useEffect(() => {
        const measure = () => {
            if (containerRef.current) {
                setSvgWidth(Math.max(400, containerRef.current.clientWidth - 48));
            }
        };
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, []);

    const midY = svgHeight / 2;
    const amplitude = (svgHeight / 2) - 24;

    const { analogPath, staircasePath, samplePoints, qLines } = useMemo(() => {
        const w = svgWidth;
        let aPath = `M 0 ${midY}`;
        let sPath = '';
        let pts = [];
        let lines = [];

        const levels = Math.pow(2, bitDepth);
        const stepY = (amplitude * 2) / (levels - 1 || 1);
        const minY = midY - amplitude;

        if (showQuantisationLines) {
            for (let i = 0; i < levels; i++) {
                lines.push(minY + i * stepY);
            }
        }

        // Analogue path
        for (let x = 0; x <= w; x++) {
            const phase = (x / w) * frequency * Math.PI * 2;
            const y = midY - Math.sin(phase) * amplitude;
            aPath += ` L ${x} ${y}`;
        }

        // Sample points and staircase
        const stepX = w / sampleRate;
        for (let x = 0; x <= w; x += stepX) {
            const phase = (x / w) * frequency * Math.PI * 2;
            const rawY = midY - Math.sin(phase) * amplitude;

            let quantY = rawY;
            if (showStaircase && bitDepth <= 8) {
                const idx = Math.round((rawY - minY) / stepY);
                quantY = minY + idx * stepY;
            }

            pts.push({ x, y: showStaircase ? quantY : rawY });

            if (showStaircase) {
                if (x === 0) {
                    sPath = `M ${x} ${quantY}`;
                } else {
                    const prev = pts[pts.length - 2];
                    sPath += ` L ${x} ${prev.y} L ${x} ${quantY}`;
                }
            }
        }
        if (showStaircase && pts.length > 0) {
            sPath += ` L ${w} ${pts[pts.length - 1].y}`;
        }

        return { analogPath: aPath, staircasePath: sPath, samplePoints: pts, qLines: lines };
    }, [frequency, sampleRate, bitDepth, svgWidth, showStaircase, showQuantisationLines, midY, amplitude]);

    return (
        <div ref={containerRef} style={{
            ...card,
            padding: spacing[4],
            background: '#0F172A',
        }}>
            <svg
                width={svgWidth}
                height={svgHeight}
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                style={{ display: 'block', width: '100%', height: 'auto' }}
            >
                {/* Quantisation level lines */}
                {qLines.map((y, i) => (
                    <line key={i} x1="0" y1={y} x2={svgWidth} y2={y}
                        stroke="rgba(148, 163, 184, 0.15)" strokeWidth="1" />
                ))}

                {/* Centre line */}
                <line x1="0" y1={midY} x2={svgWidth} y2={midY}
                    stroke="rgba(148, 163, 184, 0.3)" strokeWidth="1" />

                {/* Analogue wave */}
                <path d={analogPath} fill="none" stroke="#60A5FA" strokeWidth="2" opacity="0.5" />

                {/* Staircase */}
                {showStaircase && staircasePath && (
                    <path d={staircasePath} fill="none" stroke="#34D399" strokeWidth="2" />
                )}

                {/* Sample points */}
                {samplePoints.map((pt, i) => (
                    <circle key={i} cx={pt.x} cy={pt.y} r="4" fill="#FB923C" />
                ))}

                {/* Labels */}
                <text x="8" y="16" fill="rgba(148,163,184,0.6)" fontSize="10"
                    fontFamily={typography.fontFamily}>Amplitude +</text>
                <text x="8" y={svgHeight - 8} fill="rgba(148,163,184,0.6)" fontSize="10"
                    fontFamily={typography.fontFamily}>Amplitude -</text>
                <text x={svgWidth - 50} y={midY - 8} fill="rgba(148,163,184,0.6)" fontSize="10"
                    fontFamily={typography.fontFamily}>Time &rarr;</text>
            </svg>

            {/* Legend */}
            <div style={{
                display: 'flex',
                gap: spacing[6],
                marginTop: spacing[3],
                justifyContent: 'center',
            }}>
                <LegendItem colour="#60A5FA" label="Analogue signal (continuous)" />
                <LegendItem colour="#FB923C" label="Sample points (discrete)" />
                {showStaircase && <LegendItem colour="#34D399" label="Quantised output (staircase)" />}
            </div>
        </div>
    );
}

function LegendItem({ colour, label }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
            <div style={{
                width: '12px', height: '12px', borderRadius: borderRadius.full,
                background: colour,
            }} />
            <span style={{ fontSize: typography.size.xs, color: 'rgba(148,163,184,0.8)' }}>
                {label}
            </span>
        </div>
    );
}

// ─── Shared: Slider control ─────────────────────────────────────
function Slider({ label, value, min, max, step, setter, colour, unit }) {
    return (
        <div style={card}>
            <label style={{
                ...sectionLabel,
                color: colour,
                marginBottom: spacing[3],
            }}>
                {label}: {value}{unit}
            </label>
            <input
                type="range"
                min={min} max={max} step={step}
                value={value}
                onChange={e => setter(Number(e.target.value))}
                style={{ width: '100%', accentColor: colour }}
            />
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: spacing[1],
            }}>
                <span style={{ fontSize: typography.size.xs, color: t.text.tertiary }}>{min}{unit}</span>
                <span style={{ fontSize: typography.size.xs, color: t.text.tertiary }}>{max}{unit}</span>
            </div>
        </div>
    );
}
