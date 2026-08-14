'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import { theme, typography, borderRadius, spacing, transitions } from '@/lib/theme';

// ─── Study content ─────────────────────────────────────────────────────────────

const STUDY_TEXT = `Equalisation (or EQ) is the process of adjusting the balance between frequency components within an audio signal. Every sound you hear is made up of multiple frequencies, and EQ gives you the tools to shape which frequencies are louder or quieter.

The foundation of EQ lies in four filter types. A lowpass filter allows frequencies below a cutoff point to pass through while attenuating everything above it: creating warmer, darker sounds by removing high-frequency content. A highpass filter does the opposite, letting high frequencies through while cutting the lows: useful for removing rumble and mud from a recording.

A bandpass filter isolates a specific range of frequencies, attenuating everything above and below its passband. This creates focused, vocal-like tones. The bandreject or notch filter is its inverse: it removes a narrow band of frequencies while leaving the rest untouched. This is essential for eliminating electrical hum at 50Hz or 60Hz.

The cutoff frequency is where the filter begins to take effect. The filter slope, measured in dB per octave, determines how aggressively frequencies are attenuated beyond that point. A gentle 6dB/octave slope creates subtle transitions, while a steep 24dB/octave slope creates near-total removal.

Q factor (the quality factor) defines how narrow or wide a filter's effect is. It is calculated as the centre frequency divided by the bandwidth. A high Q creates a narrow, surgical cut or boost. A low Q creates a broad, gentle adjustment. Q and bandwidth are inversely proportional: as Q goes up, bandwidth narrows.

There are two main EQ architectures. A graphic equaliser splits the spectrum into fixed bands (typically 10 or 31) each with its own gain slider. The bands are spaced at octave or third-octave intervals, and filters are routed in parallel. You get a visual "graph" of your frequency curve, but the frequencies are locked. You can only adjust gain, not frequency or Q.

A parametric equaliser takes a different approach. It offers fewer bands (typically 4 to 7) but each band gives you full control over three parameters: centre frequency, gain, and Q. Filters are routed in series, cascading through each band. This gives you surgical precision for targeting specific frequency problems.

Shelving filters complete the toolkit. A high shelf boosts or cuts all frequencies above its shelf point by an equal amount, unlike a lowpass filter where attenuation increases with frequency. A low shelf does the same for frequencies below its point. Peak and notch filters boost or cut around a centre frequency while leaving surrounding frequencies untouched. These shelving filters are the building blocks of most parametric EQ designs.`;

// ─── Diagram SVG generators ────────────────────────────────────────────────────

function filterTypesSVG(w, h) {
    const mid = h / 2;
    const cx = w / 2;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="#0f172a" rx="10"/>
    <text x="${cx}" y="20" text-anchor="middle" font-size="11" fill="rgba(255,255,255,0.35)" font-family="system-ui">FOUR FILTER TYPES</text>
    <line x1="10" y1="${mid}" x2="${w-10}" y2="${mid}" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    ${[
        { label: 'LPF', x: w*0.15, color: '#60a5fa', path: `M${w*0.05},${mid-25} Q${w*0.15},${mid-25} ${w*0.15},${mid} Q${w*0.15},${mid+25} ${w*0.25},${mid+25}` },
        { label: 'HPF', x: w*0.38, color: '#D4724F', path: `M${w*0.28},${mid+25} Q${w*0.38},${mid+25} ${w*0.38},${mid} Q${w*0.38},${mid-25} ${w*0.48},${mid-25}` },
        { label: 'BPF', x: w*0.62, color: '#fbbf24', path: `M${w*0.52},${mid+20} Q${w*0.57},${mid+20} ${w*0.62},${mid-20} Q${w*0.67},${mid+20} ${w*0.72},${mid+20}` },
        { label: 'Notch', x: w*0.85, color: '#DCC892', path: `M${w*0.75},${mid-20} Q${w*0.80},${mid-20} ${w*0.85},${mid+20} Q${w*0.90},${mid-20} ${w*0.95},${mid-20}` },
    ].map(f => `
        <path d="${f.path}" fill="none" stroke="${f.color}" stroke-width="2.5" opacity="0.85"/>
        <text x="${f.x}" y="${h-12}" text-anchor="middle" font-size="10" fill="${f.color}" font-family="monospace" font-weight="600">${f.label}</text>
    `).join('')}
    </svg>`;
}

function qFactorSVG(w, h) {
    const mid = h / 2;
    const cx = w / 2;
    const narrow = [];
    const wide = [];
    for (let i = 0; i <= 100; i++) {
        const x = (i / 100) * w;
        const t = ((i / 100) - 0.5) * 8;
        narrow.push(`${x},${mid - Math.exp(-t*t*4) * (h*0.35)}`);
        wide.push(`${x},${mid - Math.exp(-t*t*0.3) * (h*0.25)}`);
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="#0f172a" rx="10"/>
    <text x="${cx}" y="20" text-anchor="middle" font-size="11" fill="rgba(255,255,255,0.35)" font-family="system-ui">Q FACTOR</text>
    <line x1="10" y1="${mid}" x2="${w-10}" y2="${mid}" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    <polyline points="${wide.join(' ')}" fill="none" stroke="#22c55e" stroke-width="2" opacity="0.6"/>
    <polyline points="${narrow.join(' ')}" fill="none" stroke="#ef4444" stroke-width="2.5" opacity="0.85"/>
    <text x="${cx - 30}" y="${mid - h*0.3}" text-anchor="middle" font-size="10" fill="#ef4444" font-family="monospace">High Q</text>
    <text x="${cx + 40}" y="${mid - h*0.12}" text-anchor="end" font-size="10" fill="#22c55e" font-family="monospace">Low Q</text>
    </svg>`;
}

function graphicEqSVG(w, h) {
    const bands = [3, -2, 1, 4, -1, 2, -3, 5, 0, -2];
    const labels = ['31', '63', '125', '250', '500', '1k', '2k', '4k', '8k', '16k'];
    const colors = ['#ef4444','#f97316','#fbbf24','#22c55e','#3b82f6','#5F7058','#B85A3F','#06b6d4','#84cc16','#f43f5e'];
    const mid = h / 2;
    const bw = (w - 40) / bands.length;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="#0f172a" rx="10"/>
    <text x="${w/2}" y="18" text-anchor="middle" font-size="11" fill="rgba(255,255,255,0.35)" font-family="system-ui">GRAPHIC EQ: 10 BAND</text>
    <line x1="20" y1="${mid}" x2="${w-20}" y2="${mid}" stroke="rgba(255,255,255,0.08)" stroke-width="1" stroke-dasharray="3,3"/>
    ${bands.map((g, i) => {
        const x = 20 + i * bw + bw/2;
        const barH = Math.abs(g) * (h * 0.06);
        const barY = g > 0 ? mid - barH : mid;
        return `<rect x="${x-8}" y="${barY}" width="16" height="${barH}" rx="3" fill="${colors[i]}44" stroke="${colors[i]}88" stroke-width="1"/>
        <circle cx="${x}" cy="${g > 0 ? mid - barH : mid + barH}" r="3.5" fill="${colors[i]}"/>
        <text x="${x}" y="${h-8}" text-anchor="middle" font-size="8" fill="rgba(255,255,255,0.3)" font-family="monospace">${labels[i]}</text>`;
    }).join('')}
    </svg>`;
}

function parametricEqSVG(w, h) {
    const mid = h / 2 + 5;
    const points = [];
    for (let i = 0; i <= 200; i++) {
        const x = (i / 200) * w;
        const t = i / 200;
        let y = mid;
        y -= Math.exp(-Math.pow((t - 0.15) * 12, 2)) * 25;
        y += Math.exp(-Math.pow((t - 0.35) * 8, 2)) * 35;
        y -= Math.exp(-Math.pow((t - 0.65) * 6, 2)) * 20;
        y -= Math.exp(-Math.pow((t - 0.88) * 10, 2)) * 15;
        points.push(`${x},${y}`);
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="#0f172a" rx="10"/>
    <text x="${w/2}" y="18" text-anchor="middle" font-size="11" fill="rgba(255,255,255,0.35)" font-family="system-ui">PARAMETRIC EQ CURVE</text>
    <line x1="10" y1="${mid}" x2="${w-10}" y2="${mid}" stroke="rgba(255,255,255,0.08)" stroke-width="1" stroke-dasharray="3,3"/>
    <polyline points="${points.join(' ')}" fill="none" stroke="#3b82f6" stroke-width="2.5" opacity="0.85"/>
    <circle cx="${w*0.15}" cy="${mid-25}" r="5" fill="#ef4444" opacity="0.9"/>
    <circle cx="${w*0.35}" cy="${mid+35}" r="5" fill="#f97316" opacity="0.9"/>
    <circle cx="${w*0.65}" cy="${mid-20}" r="5" fill="#22c55e" opacity="0.9"/>
    <circle cx="${w*0.88}" cy="${mid-15}" r="5" fill="#5F7058" opacity="0.9"/>
    <text x="${w*0.15}" y="${mid-35}" text-anchor="middle" font-size="9" fill="#ef4444" font-family="monospace">+3dB</text>
    <text x="${w*0.35}" y="${mid+50}" text-anchor="middle" font-size="9" fill="#f97316" font-family="monospace">-4dB</text>
    <text x="${w*0.65}" y="${mid-30}" text-anchor="middle" font-size="9" fill="#22c55e" font-family="monospace">+2dB</text>
    <text x="${w*0.88}" y="${mid-25}" text-anchor="middle" font-size="9" fill="#5F7058" font-family="monospace">+1.5dB</text>
    </svg>`;
}

function shelvingSVG(w, h) {
    const mid = h / 2 + 5;
    const hiShelf = [];
    const loShelf = [];
    for (let i = 0; i <= 200; i++) {
        const x = (i / 200) * w;
        const t = i / 200;
        const hiY = mid - 20 / (1 + Math.exp(-20 * (t - 0.7)));
        hiShelf.push(`${x},${hiY}`);
        const loY = mid + 18 / (1 + Math.exp(20 * (t - 0.3)));
        loShelf.push(`${x},${loY}`);
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="#0f172a" rx="10"/>
    <text x="${w/2}" y="18" text-anchor="middle" font-size="11" fill="rgba(255,255,255,0.35)" font-family="system-ui">SHELVING FILTERS</text>
    <line x1="10" y1="${mid}" x2="${w-10}" y2="${mid}" stroke="rgba(255,255,255,0.08)" stroke-width="1" stroke-dasharray="3,3"/>
    <polyline points="${hiShelf.join(' ')}" fill="none" stroke="#3b82f6" stroke-width="2.5" opacity="0.8"/>
    <polyline points="${loShelf.join(' ')}" fill="none" stroke="#D4724F" stroke-width="2.5" opacity="0.8"/>
    <text x="${w*0.85}" y="${mid-28}" font-size="10" fill="#3b82f6" font-family="monospace" text-anchor="middle">High shelf +</text>
    <text x="${w*0.15}" y="${mid+32}" font-size="10" fill="#D4724F" font-family="monospace" text-anchor="middle">Low shelf +</text>
    </svg>`;
}

// ─── Diagram definitions ───────────────────────────────────────────────────────

const DIAGRAMS = [
    { id: 'filter-types', label: 'Four Filter Types', svgFn: filterTypesSVG, defaultX: 20, defaultY: 80, w: 320, h: 120 },
    { id: 'q-factor', label: 'Q Factor', svgFn: qFactorSVG, defaultX: 400, defaultY: 320, w: 240, h: 140 },
    { id: 'graphic-eq', label: 'Graphic EQ', svgFn: graphicEqSVG, defaultX: 20, defaultY: 540, w: 340, h: 130 },
    { id: 'parametric-eq', label: 'Parametric EQ Curve', svgFn: parametricEqSVG, defaultX: 380, defaultY: 640, w: 280, h: 140 },
    { id: 'shelving', label: 'Shelving Filters', svgFn: shelvingSVG, defaultX: 20, defaultY: 880, w: 280, h: 130 },
];

// ─── PreText-powered layout engine ─────────────────────────────────────────────

function computeTextLayout(text, containerWidth, lineHeight, fontSize, obstacles) {
    // Simple word-wrap engine that respects obstacles
    // Each line checks which obstacles overlap its vertical band,
    // then shortens available width and offsets text accordingly
    const words = text.split(/\s+/);
    const lines = [];
    let y = 0;
    let wordIndex = 0;
    const charWidth = fontSize * 0.48; // approximate average char width

    while (wordIndex < words.length) {
        // Find obstacles overlapping this line's vertical band
        const lineTop = y;
        const lineBottom = y + lineHeight;
        let availableLeft = 0;
        let availableWidth = containerWidth;

        for (const obs of obstacles) {
            if (obs.bottom <= lineTop || obs.top >= lineBottom) continue;
            // Obstacle overlaps this line
            const obsLeft = obs.left;
            const obsRight = obs.right;

            if (obsLeft <= containerWidth / 2) {
                // Obstacle on left side — text starts after it
                const newLeft = Math.max(availableLeft, obsRight + 16);
                availableWidth -= (newLeft - availableLeft);
                availableLeft = newLeft;
            } else {
                // Obstacle on right side — text ends before it
                availableWidth = Math.min(availableWidth, obsLeft - availableLeft - 16);
            }
        }

        availableWidth = Math.max(availableWidth, 60);

        // Fill line with words
        let lineText = '';
        let lineWidth = 0;

        while (wordIndex < words.length) {
            const word = words[wordIndex];
            const wordWidth = word.length * charWidth;
            const spaceWidth = lineText ? charWidth : 0;

            if (lineWidth + spaceWidth + wordWidth > availableWidth && lineText) break;

            lineText += (lineText ? ' ' : '') + word;
            lineWidth += spaceWidth + wordWidth;
            wordIndex++;
        }

        if (lineText) {
            lines.push({ text: lineText, x: availableLeft, y, width: availableWidth });
        }

        y += lineHeight;

        // Safety: prevent infinite loops
        if (y > 20000) break;
    }

    return { lines, totalHeight: y };
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function StudyFlowClient() {
    const t = theme.light;
    const containerRef = useRef(null);
    const [mode, setMode] = useState('read'); // 'read' | 'arrange'
    const [containerWidth, setContainerWidth] = useState(680);
    const [diagrams, setDiagrams] = useState(() =>
        DIAGRAMS.map(d => ({ ...d, x: d.defaultX, y: d.defaultY }))
    );
    const [dragging, setDragging] = useState(null);

    // Measure container
    useEffect(() => {
        if (!containerRef.current) return;
        const obs = new ResizeObserver(entries => {
            for (const entry of entries) {
                setContainerWidth(entry.contentRect.width);
            }
        });
        obs.observe(containerRef.current);
        return () => obs.disconnect();
    }, []);

    // Build obstacle list from diagram positions
    const obstacles = useMemo(() =>
        diagrams.map(d => ({
            id: d.id,
            left: d.x,
            right: d.x + d.w,
            top: d.y,
            bottom: d.y + d.h + 8, // padding below
        })),
    [diagrams]);

    // Compute text layout
    const fontSize = 15;
    const lineHeight = 26;
    const layout = useMemo(
        () => computeTextLayout(STUDY_TEXT, containerWidth, lineHeight, fontSize, obstacles),
        [containerWidth, obstacles]
    );

    // Drag handlers
    const handlePointerDown = useCallback((e, diagramId) => {
        if (mode !== 'arrange') return;
        e.preventDefault();
        const diagram = diagrams.find(d => d.id === diagramId);
        if (!diagram) return;
        setDragging({
            id: diagramId,
            startX: e.clientX - diagram.x,
            startY: e.clientY - diagram.y,
        });
    }, [mode, diagrams]);

    const handlePointerMove = useCallback((e) => {
        if (!dragging) return;
        e.preventDefault();
        setDiagrams(prev => prev.map(d =>
            d.id === dragging.id
                ? { ...d, x: Math.max(0, Math.min(e.clientX - dragging.startX, containerWidth - d.w)), y: Math.max(0, e.clientY - dragging.startY) }
                : d
        ));
    }, [dragging, containerWidth]);

    const handlePointerUp = useCallback(() => {
        setDragging(null);
    }, []);

    const handleReset = useCallback(() => {
        setDiagrams(DIAGRAMS.map(d => ({ ...d, x: d.defaultX, y: d.defaultY })));
    }, []);

    return (
        <div
            style={{
                minHeight: '100vh',
                background: '#0a0a12',
                fontFamily: 'var(--font-manrope), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                color: '#e0e0e0',
            }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
        >
            {/* Header bar */}
            <header style={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                background: 'rgba(10,10,18,0.92)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                padding: '12px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Link href="/learn/eq" style={{
                        color: 'rgba(255,255,255,0.4)',
                        textDecoration: 'none',
                        fontSize: 13,
                    }}>
                        &larr; Back
                    </Link>
                    <div>
                        <h1 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>
                            Study: EQ &amp; Filters
                        </h1>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                            {mode === 'read' ? 'Read through the content first' : 'Drag diagrams to build your revision layout'}
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {mode === 'arrange' && (
                        <button type="button"
                            onClick={handleReset}
                            style={{
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 8,
                                padding: '6px 12px',
                                color: 'rgba(255,255,255,0.5)',
                                fontSize: 12,
                                cursor: 'pointer',
                            }}
                        >
                            Reset layout
                        </button>
                    )}
                    <div style={{
                        display: 'flex',
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: 8,
                        padding: 3,
                        gap: 2,
                    }}>
                        <button type="button"
                            onClick={() => setMode('read')}
                            style={{
                                padding: '6px 16px',
                                borderRadius: 6,
                                border: 'none',
                                background: mode === 'read' ? 'rgba(255,255,255,0.12)' : 'none',
                                color: mode === 'read' ? '#fff' : 'rgba(255,255,255,0.4)',
                                fontSize: 13,
                                fontWeight: 500,
                                cursor: 'pointer',
                            }}
                        >
                            Read
                        </button>
                        <button type="button"
                            onClick={() => setMode('arrange')}
                            style={{
                                padding: '6px 16px',
                                borderRadius: 6,
                                border: 'none',
                                background: mode === 'arrange' ? 'rgba(96,165,250,0.2)' : 'none',
                                color: mode === 'arrange' ? '#60a5fa' : 'rgba(255,255,255,0.4)',
                                fontSize: 13,
                                fontWeight: 500,
                                cursor: 'pointer',
                            }}
                        >
                            Arrange
                        </button>
                    </div>
                </div>
            </header>

            {/* Instruction banner */}
            {mode === 'read' && (
                <div style={{
                    maxWidth: 720,
                    margin: '24px auto 0',
                    padding: '12px 20px',
                    background: 'rgba(96,165,250,0.08)',
                    border: '1px solid rgba(96,165,250,0.15)',
                    borderRadius: 10,
                    fontSize: 13,
                    color: 'rgba(96,165,250,0.8)',
                    textAlign: 'center',
                }}>
                    Read through this content first. When you are ready, tap <strong>Arrange</strong> to build your own study layout.
                </div>
            )}
            {mode === 'arrange' && (
                <div style={{
                    maxWidth: 720,
                    margin: '24px auto 0',
                    padding: '12px 20px',
                    background: 'rgba(34,197,94,0.08)',
                    border: '1px solid rgba(34,197,94,0.15)',
                    borderRadius: 10,
                    fontSize: 13,
                    color: 'rgba(34,197,94,0.8)',
                    textAlign: 'center',
                }}>
                    Drag diagrams to where they make sense in the text. The text will reflow around them.
                </div>
            )}

            {/* Main study area */}
            <main
                ref={containerRef}
                style={{
                    position: 'relative',
                    maxWidth: 720,
                    margin: '24px auto 80px',
                    padding: '0 20px',
                    userSelect: dragging ? 'none' : 'auto',
                    minHeight: layout.totalHeight + 200,
                    // Dot grid in arrange mode
                    backgroundImage: mode === 'arrange'
                        ? 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)'
                        : 'none',
                    backgroundSize: mode === 'arrange' ? '24px 24px' : 'auto',
                }}
            >
                {/* Text lines */}
                {layout.lines.map((line, i) => (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            left: line.x,
                            top: line.y,
                            width: line.width,
                            fontSize,
                            lineHeight: `${lineHeight}px`,
                            color: 'rgba(255,255,255,0.72)',
                            fontFamily: 'Georgia, "Times New Roman", serif',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {line.text}
                    </div>
                ))}

                {/* Diagrams */}
                {diagrams.map(d => (
                    <div
                        key={d.id}
                        onPointerDown={(e) => handlePointerDown(e, d.id)}
                        style={{
                            position: 'absolute',
                            left: d.x,
                            top: d.y,
                            width: d.w,
                            height: d.h,
                            cursor: mode === 'arrange' ? (dragging?.id === d.id ? 'grabbing' : 'grab') : 'default',
                            borderRadius: 10,
                            overflow: 'hidden',
                            boxShadow: dragging?.id === d.id
                                ? '0 8px 32px rgba(96,165,250,0.25)'
                                : '0 2px 12px rgba(0,0,0,0.4)',
                            border: mode === 'arrange'
                                ? `1px solid ${dragging?.id === d.id ? 'rgba(96,165,250,0.5)' : 'rgba(255,255,255,0.08)'}`
                                : '1px solid rgba(255,255,255,0.04)',
                            transition: dragging?.id === d.id ? 'none' : `box-shadow ${transitions.normal} ${transitions.easing}`,
                            zIndex: dragging?.id === d.id ? 50 : 10,
                            touchAction: 'none',
                        }}
                        dangerouslySetInnerHTML={{ __html: d.svgFn(d.w, d.h) }}
                    />
                ))}

                {/* Diagram labels in arrange mode */}
                {mode === 'arrange' && diagrams.map(d => (
                    <div
                        key={`label-${d.id}`}
                        style={{
                            position: 'absolute',
                            left: d.x,
                            top: d.y + d.h + 4,
                            fontSize: 11,
                            color: 'rgba(255,255,255,0.25)',
                            fontFamily: 'system-ui',
                            pointerEvents: 'none',
                        }}
                    >
                        {d.label}
                    </div>
                ))}
            </main>
        </div>
    );
}
