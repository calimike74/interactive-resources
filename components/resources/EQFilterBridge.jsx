'use client';

import React, { useState, useCallback, useRef } from 'react';

// ============================================
// SYNTHESIS FILTER CONCEPTS (1.3 Review)
// ============================================
const SYNTHESIS_CONCEPTS = [
    {
        id: 'lpf',
        term: 'LPF (Low-Pass Filter)',
        definition: 'Allows frequencies BELOW the cutoff to pass through. Removes high frequencies.',
        synthContext: 'Creates warm, dark sounds. Classic subtractive synthesis sound.',
        svgType: 'lpf',
        color: '#00d4ff',
        glowColor: 'rgba(0, 212, 255, 0.4)'
    },
    {
        id: 'hpf',
        term: 'HPF (High-Pass Filter)',
        definition: 'Allows frequencies ABOVE the cutoff to pass through. Removes low frequencies.',
        synthContext: 'Creates thin, bright sounds. Useful for filter sweeps upward.',
        svgType: 'hpf',
        color: '#00ff88',
        glowColor: 'rgba(0, 255, 136, 0.4)'
    },
    {
        id: 'bpf',
        term: 'BPF (Band-Pass Filter)',
        definition: 'Allows only frequencies AROUND the cutoff to pass. Removes both highs and lows.',
        synthContext: 'Creates telephone/radio effect. Focused, nasal sound. Passes a band centred on the cutoff; bandwidth is set by Q.',
        svgType: 'bpf',
        color: '#ff6b00',
        glowColor: 'rgba(255, 107, 0, 0.4)'
    },
    {
        id: 'notch',
        term: 'Notch Filter',
        definition: 'REMOVES frequencies at the cutoff point. The opposite of band-pass.',
        synthContext: 'Creates phaser-like effects when swept. Removes specific frequencies.',
        svgType: 'notch',
        color: '#ff0066',
        glowColor: 'rgba(255, 0, 102, 0.4)'
    },
    {
        id: 'cutoff',
        term: 'Cutoff Frequency',
        definition: 'The frequency at which the signal is reduced by 3 dB (half power). Above or below this point, attenuation increases.',
        synthContext: 'Sweep the cutoff for classic "wah" sounds. The heart of filter control.',
        svgType: 'cutoff',
        color: '#ffd700',
        glowColor: 'rgba(255, 215, 0, 0.4)'
    },
    {
        id: 'resonance',
        term: 'Q / Resonance',
        definition: 'Boosts frequencies at the cutoff point. Higher Q = more emphasis.',
        synthContext: 'High resonance creates squelchy, acidic sounds. Can self-oscillate!',
        svgType: 'q',
        color: '#C99F44',
        glowColor: 'rgba(168, 85, 247, 0.4)'
    },
    {
        id: 'slope',
        term: 'Slope (dB/octave)',
        definition: 'How steeply the filter attenuates. 6dB, 12dB, 18dB, or 24dB per octave.',
        synthContext: '24dB/oct (4-pole) = aggressive. 12dB/oct (2-pole) = gentle, musical.',
        svgType: 'slope',
        color: '#14b8a6',
        glowColor: 'rgba(20, 184, 166, 0.4)'
    }
];

// ============================================
// COPYABLE NOTE COMPONENT
// ============================================
const CopyableNote = ({ title, children, color = '#74b9ff', variant = 'definition' }) => {
    const [copied, setCopied] = useState(false);
    const contentRef = useRef(null);

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
        warning: ''
    };

    return (
        <div style={{
            background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
            border: `1px solid ${color}50`,
            borderLeft: `4px solid ${color}`,
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            marginTop: '1rem'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '0.5rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1rem' }}>{icons[variant]}</span>
                    <span style={{
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        color: color,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        fontFamily: 'monospace'
                    }}>
                        {title || 'Copy to Notes'}
                    </span>
                </div>
                <button type="button"
                    onClick={handleCopy}
                    style={{
                        background: copied ? '#34d399' : '#1c1f28',
                        border: `1px solid ${copied ? '#34d399' : '#ffffff20'}`,
                        borderRadius: '6px',
                        padding: '0.35rem 0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        color: copied ? '#050507' : '#8b909a',
                        fontSize: '0.7rem',
                        fontFamily: 'monospace'
                    }}
                >
                    {copied ? '✓ Copied!' : 'Copy'}
                </button>
            </div>
            <div ref={contentRef} style={{ color: '#c9cdd4', fontSize: '0.9rem', lineHeight: '1.6' }}>
                {children}
            </div>
        </div>
    );
};

// ============================================
// FILTER CURVE SVG COMPONENT
// ============================================
const FilterCurveSVG = ({ type, color, isHovered }) => {
    const width = 120;
    const height = 70;
    const padding = 8;

    const generatePath = () => {
        const innerW = width - padding * 2;
        const innerH = height - padding * 2;
        const midY = padding + innerH / 2;
        const startX = padding;
        const endX = width - padding;

        switch(type) {
            case 'lpf':
                return `M ${startX} ${midY} L ${startX + innerW * 0.5} ${midY} Q ${startX + innerW * 0.65} ${midY} ${startX + innerW * 0.75} ${midY + innerH * 0.3} Q ${startX + innerW * 0.9} ${midY + innerH * 0.5} ${endX} ${padding + innerH}`;
            case 'hpf':
                return `M ${startX} ${padding + innerH} Q ${startX + innerW * 0.1} ${midY + innerH * 0.5} ${startX + innerW * 0.25} ${midY + innerH * 0.3} Q ${startX + innerW * 0.35} ${midY} ${startX + innerW * 0.5} ${midY} L ${endX} ${midY}`;
            case 'bpf':
                return `M ${startX} ${padding + innerH * 0.8} Q ${startX + innerW * 0.25} ${midY} ${startX + innerW * 0.5} ${padding + innerH * 0.15} Q ${startX + innerW * 0.75} ${midY} ${endX} ${padding + innerH * 0.8}`;
            case 'notch':
                return `M ${startX} ${midY - innerH * 0.15} Q ${startX + innerW * 0.35} ${midY - innerH * 0.15} ${startX + innerW * 0.45} ${midY + innerH * 0.35} L ${startX + innerW * 0.5} ${padding + innerH * 0.95} L ${startX + innerW * 0.55} ${midY + innerH * 0.35} Q ${startX + innerW * 0.65} ${midY - innerH * 0.15} ${endX} ${midY - innerH * 0.15}`;
            case 'cutoff':
                return `M ${startX + innerW * 0.5} ${padding} L ${startX + innerW * 0.5} ${padding + innerH}`;
            case 'q':
                return `M ${startX} ${midY + innerH * 0.2} Q ${startX + innerW * 0.3} ${midY + innerH * 0.2} ${startX + innerW * 0.4} ${midY - innerH * 0.1} Q ${startX + innerW * 0.5} ${padding} ${startX + innerW * 0.5} ${padding} Q ${startX + innerW * 0.5} ${padding} ${startX + innerW * 0.6} ${midY - innerH * 0.1} Q ${startX + innerW * 0.7} ${midY + innerH * 0.2} ${endX} ${midY + innerH * 0.2}`;
            case 'slope':
                return `M ${startX + innerW * 0.3} ${padding + innerH * 0.2} L ${endX - innerW * 0.1} ${padding + innerH * 0.9}`;
            default:
                return `M ${startX} ${midY} L ${endX} ${midY}`;
        }
    };

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="3,3" />
            <path d={generatePath()} fill="none" stroke={color} strokeWidth={isHovered ? 3 : 2.5} strokeLinecap="round" strokeLinejoin="round" />
            {type === 'cutoff' && <circle cx={width / 2} cy={height / 2} r="5" fill={color} />}
        </svg>
    );
};

// ============================================
// FLASHCARD COMPONENT
// ============================================
const Flashcard = ({ concept, isFlipped, onFlip }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e) => {
        e.stopPropagation();
        const text = `${concept.term}\n\nDefinition: ${concept.definition}\n\nSynthesis Context (1.3): ${concept.synthContext}`;
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.log('Copy failed');
        }
    };

    return (
        <div
            role="button"
            tabIndex={0}
            aria-label={`${concept.term}: press to reveal definition`}
            aria-pressed={isFlipped}
            onClick={onFlip}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onFlip()}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ perspective: '1000px', cursor: 'pointer', width: '100%', height: '220px' }}
        >
            <div style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
            }}>
                {/* Front - Just the term and visual */}
                <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backfaceVisibility: 'hidden',
                    background: 'linear-gradient(135deg, #1c1f28 0%, #16181f 100%)',
                    borderRadius: '16px',
                    border: `1px solid ${isHovered ? concept.color : '#ffffff15'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                    boxShadow: isHovered ? `0 8px 32px ${concept.glowColor}` : '0 4px 16px rgba(0,0,0,0.3)'
                }}>
                    <div style={{ marginBottom: '0.75rem' }}>
                        <FilterCurveSVG type={concept.svgType} color={concept.color} isHovered={isHovered} />
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600', color: isHovered ? concept.color : '#f8f9fa', textAlign: 'center' }}>
                        {concept.term}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#767b88', marginTop: '0.75rem', fontFamily: 'monospace', padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                        Click to reveal →
                    </div>
                </div>

                {/* Back - Solid bright color background with dark text */}
                <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    background: `linear-gradient(135deg, ${concept.color} 0%, ${concept.color}cc 100%)`,
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '1rem',
                    boxShadow: `0 8px 32px ${concept.glowColor}`
                }}>
                    {/* Header with title and copy button */}
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        marginBottom: '0.6rem'
                    }}>
                        <div style={{ 
                            fontSize: '0.7rem', 
                            fontWeight: '700', 
                            color: '#050507', 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.1em', 
                            fontFamily: 'monospace'
                        }}>
                            {concept.term}
                        </div>
                        <button type="button"
                            onClick={handleCopy}
                            style={{
                                background: copied ? '#050507' : 'rgba(0,0,0,0.2)',
                                border: 'none',
                                borderRadius: '5px',
                                padding: '0.3rem 0.5rem',
                                cursor: 'pointer',
                                color: copied ? concept.color : '#050507',
                                fontSize: '0.65rem',
                                fontFamily: 'monospace',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                flexShrink: 0
                            }}
                        >
                            {copied ? '✓' : ''}
                        </button>
                    </div>
                    
                    {/* Definition */}
                    <div style={{ 
                        fontSize: '0.85rem', 
                        fontWeight: '600', 
                        color: '#050507', 
                        marginBottom: '0.6rem', 
                        lineHeight: '1.45', 
                        flex: 1 
                    }}>
                        {concept.definition}
                    </div>
                    
                    {/* Synthesis context */}
                    <div style={{ 
                        fontSize: '0.75rem', 
                        color: '#050507', 
                        lineHeight: '1.4', 
                        padding: '0.5rem 0.6rem', 
                        background: 'rgba(0,0,0,0.15)', 
                        borderRadius: '8px'
                    }}>
                        <span style={{ fontWeight: '700' }}>1.3: </span>
                        {concept.synthContext}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================
// FREQUENCY RESPONSE GRAPH
// ============================================
const FrequencyResponseGraph = ({ filterType, frequency, gain, q }) => {
    const width = 700;
    const height = 300;
    const padding = { top: 30, right: 40, bottom: 50, left: 60 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;

    const calculateResponse = useCallback((freq, ft, fc, g, qVal) => {
        if (ft === 'highpass') {
            // 2-pole Butterworth: smooth -3 dB at fc, no hard corner
            return -10 * Math.log10(1 + Math.pow(fc / freq, 4));
        }
        if (ft === 'lowpass') {
            // 2-pole Butterworth: smooth -3 dB at fc, no hard corner
            return -10 * Math.log10(1 + Math.pow(freq / fc, 4));
        }
        if (ft === 'lowshelf') {
            const ratio = freq / fc;
            const rolloff = 1 / (1 + Math.pow(ratio, 2));
            return g * rolloff;
        }
        if (ft === 'highshelf') {
            const ratio = fc / freq;
            const rolloff = 1 / (1 + Math.pow(ratio, 2));
            return g * rolloff;
        }
        if (ft === 'bell') {
            const logRatio = Math.log10(freq / fc);
            const bandwidth = 1 / qVal;
            const response = Math.exp(-Math.pow(logRatio / (bandwidth * 0.5), 2));
            return g * response;
        }
        if (ft === 'notch') {
            const logRatio = Math.log10(freq / fc);
            const bandwidth = 1 / (qVal * 2);
            const distance = Math.abs(logRatio);
            if (distance < bandwidth * 0.3) return -48;
            const response = Math.exp(-Math.pow(logRatio / (bandwidth * 0.5), 2));
            return -48 * response;
        }
        return 0;
    }, []);

    const generateCurve = useCallback(() => {
        const points = [];
        const numPoints = 200;

        for (let i = 0; i <= numPoints; i++) {
            const logFreq = Math.log10(20) + (Math.log10(20000) - Math.log10(20)) * (i / numPoints);
            const freq = Math.pow(10, logFreq);
            let response = calculateResponse(freq, filterType, frequency, gain, q);
            response = Math.max(-24, Math.min(24, response));

            const x = padding.left + ((logFreq - Math.log10(20)) / (Math.log10(20000) - Math.log10(20))) * innerWidth;
            const y = padding.top + innerHeight / 2 - (response / 24) * (innerHeight / 2);

            points.push({ x, y, freq, response });
        }

        return points;
    }, [filterType, frequency, gain, q, calculateResponse, innerWidth, innerHeight]);

    const curvePoints = generateCurve();
    const pathData = curvePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
    const fillPathData = pathData + ` L ${padding.left + innerWidth} ${padding.top + innerHeight / 2} L ${padding.left} ${padding.top + innerHeight / 2} Z`;

    const freqLabels = [
        { freq: 20, label: '20' }, { freq: 100, label: '100' }, { freq: 500, label: '500' },
        { freq: 1000, label: '1k' }, { freq: 5000, label: '5k' }, { freq: 20000, label: '20k' }
    ];

    const dbLabels = [-24, -12, 0, 12, 24];

    const getFilterColor = () => {
        if (filterType === 'highpass') return '#00ff88';
        if (filterType === 'lowpass') return '#00d4ff';
        if (filterType === 'lowshelf' || filterType === 'highshelf') return '#e879f9';
        if (filterType === 'bell') return '#22d3ee';
        if (filterType === 'notch') return '#ff0066';
        return '#ff9f43';
    };

    const filterColor = getFilterColor();

    return (
        <div style={{ background: 'linear-gradient(180deg, #16181f 0%, #101218 100%)', borderRadius: '16px', padding: '1.5rem', border: '1px solid #ffffff10' }}>
            <svg width={width} height={height} style={{ display: 'block', margin: '0 auto', maxWidth: '100%' }}>
                <defs>
                    <linearGradient id="fillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={filterColor} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={filterColor} stopOpacity="0.02" />
                    </linearGradient>
                </defs>

                <rect x={padding.left} y={padding.top} width={innerWidth} height={innerHeight} fill="#050507" rx="8"/>

                {/* Grid lines */}
                {freqLabels.map(({ freq }) => {
                    const x = padding.left + ((Math.log10(freq) - Math.log10(20)) / (Math.log10(20000) - Math.log10(20))) * innerWidth;
                    return <line key={`v-${freq}`} x1={x} y1={padding.top} x2={x} y2={padding.top + innerHeight} stroke="rgba(255,255,255,0.05)" />;
                })}
                {dbLabels.map((db) => {
                    const y = padding.top + innerHeight / 2 - (db / 24) * (innerHeight / 2);
                    return <line key={`h-${db}`} x1={padding.left} y1={y} x2={padding.left + innerWidth} y2={y} stroke={db === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)'} />;
                })}

                {/* Fill and curve */}
                <path d={fillPathData} fill="url(#fillGradient)" />
                <path d={pathData} fill="none" stroke={filterColor} strokeWidth="3" strokeLinecap="round" />

                {/* Labels */}
                {freqLabels.map(({ freq, label }) => {
                    const x = padding.left + ((Math.log10(freq) - Math.log10(20)) / (Math.log10(20000) - Math.log10(20))) * innerWidth;
                    return <text key={`fl-${freq}`} x={x} y={height - 15} fill="#8b909a" fontSize="11" textAnchor="middle" fontFamily="monospace">{label}</text>;
                })}
                {dbLabels.map((db) => {
                    const y = padding.top + innerHeight / 2 - (db / 24) * (innerHeight / 2);
                    return <text key={`dl-${db}`} x={padding.left - 10} y={y + 4} fill="#8b909a" fontSize="11" textAnchor="end" fontFamily="monospace">{db > 0 ? '+' : ''}{db}</text>;
                })}
                <text x={width / 2} y={height - 2} fill="#c9cdd4" fontSize="12" textAnchor="middle">Frequency (Hz)</text>
                <text x={15} y={height / 2} fill="#c9cdd4" fontSize="12" textAnchor="middle" transform={`rotate(-90, 15, ${height/2})`}>Gain (dB)</text>
            </svg>
        </div>
    );
};

// ============================================
// PART 1: WHAT YOU ALREADY KNOW
// ============================================
const Part1Review = ({ onComplete }) => {
    const [flippedCards, setFlippedCards] = useState(new Set());
    const [allRevealed, setAllRevealed] = useState(false);

    const toggleCard = (id) => {
        const newFlipped = new Set(flippedCards);
        if (newFlipped.has(id)) newFlipped.delete(id);
        else newFlipped.add(id);
        setFlippedCards(newFlipped);
        if (newFlipped.size === SYNTHESIS_CONCEPTS.length) setAllRevealed(true);
    };

    const revealAll = () => {
        setFlippedCards(new Set(SYNTHESIS_CONCEPTS.map(c => c.id)));
        setAllRevealed(true);
    };

    return (
        <div style={{ padding: '1.5rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #101218 0%, #16181f 100%)', borderRadius: '20px', padding: '2rem', marginBottom: '2rem', border: '1px solid #ffffff10' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ background: 'linear-gradient(135deg, #DCC892 0%, #74b9ff 100%)', color: '#050507', padding: '0.5rem 1.25rem', borderRadius: '24px', fontSize: '0.75rem', fontWeight: '700', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Part 1</div>
                    <div style={{ fontSize: '0.7rem', color: '#DCC892', fontFamily: 'monospace', letterSpacing: '0.15em', textTransform: 'uppercase' }}>From 1.3 Synthesis</div>
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.75rem', color: '#f8f9fa' }}>What You Already Know</h2>
                <p style={{ color: '#8b909a', maxWidth: '600px', fontSize: '1rem', lineHeight: '1.7' }}>
                    These filter concepts from Topic 1.3 Synthesis are the foundation for understanding EQ.
                    <span style={{ color: '#ff9f43' }}> Click each card</span> to reveal what you should already know.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {SYNTHESIS_CONCEPTS.map(concept => (
                    <Flashcard key={concept.id} concept={concept} isFlipped={flippedCards.has(concept.id)} onFlip={() => toggleCard(concept.id)} />
                ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: '#101218', borderRadius: '16px', border: '1px solid #ffffff10' }}>
                <div>
                    <div style={{ fontSize: '0.7rem', color: '#767b88', marginBottom: '0.25rem', fontFamily: 'monospace', textTransform: 'uppercase' }}>Cards Revealed</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#DCC892' }}>{flippedCards.size} / {SYNTHESIS_CONCEPTS.length}</div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {!allRevealed && (
                        <button type="button" onClick={revealAll} style={{ padding: '0.875rem 1.5rem', background: 'transparent', border: '1px solid #ffffff15', borderRadius: '12px', color: '#8b909a', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }}>
                            Flip all cards to show definitions
                        </button>
                    )}
                    <button type="button" onClick={onComplete} disabled={!allRevealed} style={{ padding: '0.875rem 1.5rem', background: allRevealed ? 'linear-gradient(135deg, #DCC892 0%, #74b9ff 100%)' : '#16181f', border: 'none', borderRadius: '12px', color: allRevealed ? '#050507' : '#767b88', cursor: allRevealed ? 'pointer' : 'default', fontSize: '0.9rem', fontWeight: '600' }}>
                        Continue to Part 2 {allRevealed && '→'}
                    </button>
                </div>
            </div>

            <CopyableNote title="Filter Types - Key Definitions" color="#DCC892" variant="definition">
                <strong>FILTER TYPES (from 1.3 Synthesis):</strong><br/><br/>
                • <strong>LPF (Low-Pass Filter):</strong> Allows frequencies BELOW the cutoff to pass. Removes high frequencies. Creates warm, dark sounds.<br/><br/>
                • <strong>HPF (High-Pass Filter):</strong> Allows frequencies ABOVE the cutoff to pass. Removes low frequencies. Creates thin, bright sounds.<br/><br/>
                • <strong>BPF (Band-Pass Filter):</strong> Allows only frequencies AROUND the cutoff to pass. Removes both highs and lows. Creates telephone/radio effect.<br/><br/>
                • <strong>Notch Filter:</strong> REMOVES frequencies at the cutoff point. The opposite of band-pass. Used for phaser effects when swept.
            </CopyableNote>

            <CopyableNote title="Filter Parameters - Key Definitions" color="#ffd700" variant="key">
                <strong>FILTER PARAMETERS:</strong><br/><br/>
                • <strong>Cutoff Frequency:</strong> The frequency at which the signal is reduced by 3 dB (half power). Sweeping this creates the classic "wah" sound.<br/><br/>
                • <strong>Q / Resonance:</strong> Boosts frequencies at the cutoff point. Higher Q = more emphasis. Can create squelchy, acidic sounds and even self-oscillate.<br/><br/>
                • <strong>Slope (dB/octave):</strong> How steeply the filter attenuates. 24dB/oct (4-pole) = aggressive. 12dB/oct (2-pole) = gentle, musical.
            </CopyableNote>
        </div>
    );
};

// ============================================
// PART 2: THE BRIDGE
// ============================================
const Part2Bridge = ({ onComplete }) => {
    const comparisons = [
        { aspect: 'Primary Purpose', synthesis: { text: 'Creative sound design', icon: '' }, eq: { text: 'Corrective mixing', icon: '' } },
        { aspect: 'What It Affects', synthesis: { text: 'Raw synthesised waveforms', icon: '〜' }, eq: { text: 'Recorded audio', icon: '' } },
        { aspect: 'How It\'s Used', synthesis: { text: 'Dynamic - sweeps, modulation, LFO', icon: '↗' }, eq: { text: 'Static - set and forget', icon: '▬' } },
        { aspect: 'Resonance Use', synthesis: { text: 'Extreme - self-oscillation, acid', icon: '' }, eq: { text: 'Gentle peak at centre frequency; rarely pushed to extremes', icon: '' } },
        { aspect: 'Typical Settings', synthesis: { text: 'Wide sweeps, high resonance', icon: '' }, eq: { text: 'Precise frequencies, 3-6dB', icon: '' } }
    ];

    return (
        <div style={{ padding: '1.5rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #101218 0%, #16181f 100%)', borderRadius: '20px', padding: '2rem', marginBottom: '2rem', border: '1px solid #ffffff10' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ background: 'linear-gradient(135deg, #DCC892 0%, #34d399 100%)', color: '#050507', padding: '0.5rem 1.25rem', borderRadius: '24px', fontSize: '0.75rem', fontWeight: '700', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Part 2</div>
                    <div style={{ fontSize: '0.7rem', color: '#767b88', fontFamily: 'monospace', letterSpacing: '0.15em', textTransform: 'uppercase' }}>The Connection</div>
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.75rem', color: '#f8f9fa' }}>Same Tools, Different Job</h2>
                <p style={{ color: '#8b909a', maxWidth: '700px', fontSize: '1rem', lineHeight: '1.7' }}>
                    The filter types you learned in synthesis are <strong style={{ color: '#f8f9fa' }}>exactly the same</strong> as EQ filter types.
                    The difference is in <span style={{ color: '#ff9f43' }}>how</span> and <span style={{ color: '#ff9f43' }}>why</span> we use them.
                </p>
            </div>

            <div style={{ background: '#101218', borderRadius: '16px', padding: '2rem', marginBottom: '2rem', textAlign: 'center', border: '1px solid rgba(255,200,100,0.15)' }}>
                <div style={{ position: 'relative', height: '4px', background: 'linear-gradient(90deg, #DCC892, #34d399)', borderRadius: '2px', marginBottom: '1.5rem' }} />
                <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem', fontFamily: 'monospace', background: 'linear-gradient(90deg, #DCC892, #ff9f43, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    LPF = LPF = LPF
                </div>
                <p style={{ color: '#8b909a', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
                    A Low-Pass Filter in a synthesiser works <em>identically</em> to a Low-Pass Filter in an EQ.
                    <br />
                    <strong style={{ color: '#c9cdd4' }}>The maths is the same. The physics is the same. Only the application differs.</strong>
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ background: 'linear-gradient(180deg, rgba(167,139,250,0.1) 0%, #101218 100%)', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(167,139,250,0.3)' }}>
                    <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: '#DCC892', marginBottom: '0.5rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>1.3 Synthesis Context</div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: '#f8f9fa' }}>Creative Filtering</h3>
                    {comparisons.map((item, idx) => (
                        <div key={idx} style={{ padding: '0.75rem', background: '#16181f', borderRadius: '10px', marginBottom: idx < comparisons.length - 1 ? '0.5rem' : 0 }}>
                            <div style={{ fontSize: '0.65rem', color: '#767b88', marginBottom: '0.25rem' }}>{item.aspect}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>{item.synthesis.icon}</span>
                                <span style={{ color: '#c9cdd4', fontSize: '0.85rem' }}>{item.synthesis.text}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#ff9f43', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: '700', color: '#050507', boxShadow: '0 4px 20px rgba(255,159,67,0.4)' }}>=</div>
                </div>

                <div style={{ background: 'linear-gradient(180deg, rgba(52,211,153,0.1) 0%, #101218 100%)', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(52,211,153,0.3)' }}>
                    <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: '#34d399', marginBottom: '0.5rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>1.11 EQ Context</div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: '#f8f9fa' }}>Corrective Mixing</h3>
                    {comparisons.map((item, idx) => (
                        <div key={idx} style={{ padding: '0.75rem', background: '#16181f', borderRadius: '10px', marginBottom: idx < comparisons.length - 1 ? '0.5rem' : 0 }}>
                            <div style={{ fontSize: '0.65rem', color: '#767b88', marginBottom: '0.25rem' }}>{item.aspect}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>{item.eq.icon}</span>
                                <span style={{ color: '#c9cdd4', fontSize: '0.85rem' }}>{item.eq.text}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1.5rem', background: '#101218', borderRadius: '16px', border: '1px solid #ffffff10' }}>
                <button type="button" onClick={onComplete} style={{ padding: '0.875rem 1.75rem', background: 'linear-gradient(135deg, #34d399 0%, #0ea5e9 100%)', border: 'none', borderRadius: '12px', color: '#050507', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}>
                    Continue to Part 3: New EQ Concepts →
                </button>
            </div>

            <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: 'linear-gradient(90deg, rgba(255,159,67,0.08) 0%, transparent 100%)', borderRadius: '12px', borderLeft: '3px solid #ff9f43', display: 'flex', gap: '1rem' }}>
                <span style={{ background: '#ff9f43', color: '#050507', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.9rem', flexShrink: 0 }}>!</span>
                <div>
                    <div style={{ fontWeight: '600', color: '#ff9f43', marginBottom: '0.25rem' }}>Key Exam Distinction</div>
                    <div style={{ fontSize: '0.9rem', color: '#8b909a', lineHeight: '1.6' }}>
                        If asked about filters in a <strong>synthesis</strong> question, emphasise creative/dynamic use.
                        If asked in a <strong>mixing</strong> question, emphasise corrective/static use.
                        The filter itself works the same way!
                    </div>
                </div>
            </div>

            <CopyableNote title="Synthesis vs EQ - Key Differences" color="#ff9f43" variant="exam">
                <strong>SAME FILTERS, DIFFERENT CONTEXT:</strong><br/><br/>
                <strong>SYNTHESIS (1.3) - Creative Filtering:</strong><br/>
                • Applied to raw synthesised waveforms<br/>
                • Used dynamically with sweeps, LFO modulation<br/>
                • Extreme resonance for acid sounds<br/>
                • Part of BUILDING sounds<br/><br/>
                <strong>EQ (1.11) - Corrective Mixing:</strong><br/>
                • Applied to recorded audio<br/>
                • Usually static - set and forget<br/>
                • Subtle resonance for surgical cuts<br/>
                • Part of FIXING sounds<br/><br/>
                <strong>KEY POINT:</strong> A Low-Pass Filter works identically in both contexts. The maths and physics are the same - only the application differs.
            </CopyableNote>
        </div>
    );
};

// ============================================
// AUDIO ENGINE COMPONENT
// ============================================
const AudioEngine = ({ filterType, frequency, gain, q, categoryColor }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioContextRef = useRef(null);
    const sourceNodeRef = useRef(null);
    const filterNodeRef = useRef(null);
    const gainNodeRef = useRef(null);
    const noiseBufferRef = useRef(null);

    // Create white noise buffer
    const createNoiseBuffer = useCallback((ctx) => {
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        // Generate white noise: random values between -1 and 1
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }, []);

    // Map our filter types to Web Audio BiquadFilter types
    const getWebAudioFilterType = useCallback((ft) => {
        const mapping = {
            'highpass': 'highpass',
            'lowpass': 'lowpass',
            'lowshelf': 'lowshelf',
            'highshelf': 'highshelf',
            'bell': 'peaking',
            'notch': 'notch'
        };
        return mapping[ft] || 'lowpass';
    }, []);

    // Update filter parameters when they change
    React.useEffect(() => {
        if (filterNodeRef.current && audioContextRef.current) {
            filterNodeRef.current.type = getWebAudioFilterType(filterType);
            filterNodeRef.current.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
            filterNodeRef.current.Q.setValueAtTime(q, audioContextRef.current.currentTime);
            if (filterType === 'lowshelf' || filterType === 'highshelf' || filterType === 'bell') {
                filterNodeRef.current.gain.setValueAtTime(gain, audioContextRef.current.currentTime);
            }
        }
    }, [filterType, frequency, gain, q, getWebAudioFilterType]);

    const startAudio = useCallback(() => {
        // Create audio context if needed
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            noiseBufferRef.current = createNoiseBuffer(audioContextRef.current);
        }

        const ctx = audioContextRef.current;

        // Resume if suspended
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        // Stop any existing source
        if (sourceNodeRef.current) {
            try {
                sourceNodeRef.current.stop();
            } catch (e) {}
            sourceNodeRef.current.disconnect();
        }

        // Create filter
        filterNodeRef.current = ctx.createBiquadFilter();
        filterNodeRef.current.type = getWebAudioFilterType(filterType);
        filterNodeRef.current.frequency.setValueAtTime(frequency, ctx.currentTime);
        filterNodeRef.current.Q.setValueAtTime(q, ctx.currentTime);
        if (filterType === 'lowshelf' || filterType === 'highshelf' || filterType === 'bell') {
            filterNodeRef.current.gain.setValueAtTime(gain, ctx.currentTime);
        }

        // Create gain node for volume control
        gainNodeRef.current = ctx.createGain();
        gainNodeRef.current.gain.setValueAtTime(0.3, ctx.currentTime);

        // Create white noise source
        sourceNodeRef.current = ctx.createBufferSource();
        sourceNodeRef.current.buffer = noiseBufferRef.current;
        sourceNodeRef.current.loop = true;

        // Connect: source -> filter -> gain -> output
        sourceNodeRef.current.connect(filterNodeRef.current);
        filterNodeRef.current.connect(gainNodeRef.current);
        gainNodeRef.current.connect(ctx.destination);

        sourceNodeRef.current.start();
        setIsPlaying(true);
    }, [filterType, frequency, gain, q, createNoiseBuffer, getWebAudioFilterType]);

    const stopAudio = useCallback(() => {
        if (sourceNodeRef.current) {
            try {
                sourceNodeRef.current.stop();
            } catch (e) {}
            sourceNodeRef.current.disconnect();
            sourceNodeRef.current = null;
        }
        if (filterNodeRef.current) {
            filterNodeRef.current.disconnect();
            filterNodeRef.current = null;
        }
        if (gainNodeRef.current) {
            gainNodeRef.current.disconnect();
            gainNodeRef.current = null;
        }
        setIsPlaying(false);
    }, []);

    const toggleAudio = () => {
        if (isPlaying) {
            stopAudio();
        } else {
            startAudio();
        }
    };

    // Cleanup on unmount
    React.useEffect(() => {
        return () => {
            stopAudio();
        };
    }, [stopAudio]);

    return (
        <div style={{ 
            background: 'linear-gradient(135deg, #16181f 0%, #101218 100%)', 
            borderRadius: '14px', 
            padding: '1.25rem', 
            marginBottom: '1.5rem',
            border: `1px solid ${isPlaying ? categoryColor + '50' : '#ffffff10'}`
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button type="button"
                    onClick={toggleAudio}
                    style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: isPlaying 
                            ? `linear-gradient(135deg, ${categoryColor} 0%, ${categoryColor}cc 100%)`
                            : 'linear-gradient(135deg, #1c1f28 0%, #16181f 100%)',
                        border: `2px solid ${isPlaying ? categoryColor : '#ffffff20'}`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                        color: isPlaying ? '#050507' : '#8b909a',
                        boxShadow: isPlaying ? `0 0 20px ${categoryColor}60` : 'none',
                        transition: 'transform, opacity, background-color, color, border-color, box-shadow 0.2s'
                    }}
                >
                    {isPlaying ? '' : '▶'}
                </button>
                <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#f8f9fa' }}>
                        {isPlaying ? 'Playing White Noise...' : 'Hear the Filter'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#767b88' }}>
                        {isPlaying ? 'Adjust the sliders to hear the filter change' : 'White noise contains all frequencies equally'}
                    </div>
                </div>
            </div>

            {isPlaying && (
                <div style={{ 
                    marginTop: '1rem', 
                    padding: '0.75rem', 
                    background: 'rgba(255,255,255,0.03)', 
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    color: '#8b909a'
                }}>
                     <strong style={{ color: '#c9cdd4' }}>Try this:</strong> Move the frequency slider while listening. 
                    Notice how the {filterType === 'highpass' || filterType === 'lowpass' ? 'cutoff point' : 
                    filterType === 'bell' ? 'centre of the boost/cut' : 'filter'} changes which frequencies you hear.
                </div>
            )}
        </div>
    );
};

// ============================================
// PART 3: NEW EQ CONCEPTS
// ============================================
const Part3NewConcepts = ({ onComplete }) => {
    const [filterType, setFilterType] = useState('highpass');
    const [frequency, setFrequency] = useState(1000);
    const [gain, setGain] = useState(6);
    const [q, setQ] = useState(1.4);
    const [activeCategory, setActiveCategory] = useState(0);

    const filterCategories = [
        {
            name: 'Pass Filters',
            description: 'Remove frequencies completely above or below a point',
            color: '#00ff88',
            isNew: false,
            filters: [
                { id: 'highpass', name: 'High-Pass (HPF)' },
                { id: 'lowpass', name: 'Low-Pass (LPF)' }
            ]
        },
        {
            name: 'Shelf Filters',
            description: 'Boost or cut all frequencies above or below a point',
            color: '#e879f9',
            isNew: true,
            filters: [
                { id: 'lowshelf', name: 'Low Shelf' },
                { id: 'highshelf', name: 'High Shelf' }
            ]
        },
        {
            name: 'Bell / Parametric',
            description: 'Boost or cut frequencies around a centre point',
            color: '#22d3ee',
            isNew: true,
            filters: [
                { id: 'bell', name: 'Bell (Parametric)' },
                { id: 'notch', name: 'Notch' }
            ]
        }
    ];

    const formatFreq = (f) => f >= 1000 ? `${(f/1000).toFixed(1)}k` : f;

    const handleFilterSelect = (filter) => {
        setFilterType(filter.id);
        if (filter.id === 'bell') { setGain(6); setQ(1.4); }
        else if (filter.id === 'notch') { setQ(8); }
        else if (filter.id === 'lowshelf' || filter.id === 'highshelf') { setGain(6); }
    };

    return (
        <div style={{ padding: '1.5rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #101218 0%, #16181f 100%)', borderRadius: '20px', padding: '2rem', marginBottom: '2rem', border: '1px solid #ffffff10' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ background: 'linear-gradient(135deg, #34d399 0%, #0ea5e9 100%)', color: '#050507', padding: '0.5rem 1.25rem', borderRadius: '24px', fontSize: '0.75rem', fontWeight: '700', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Part 3</div>
                    <div style={{ fontSize: '0.7rem', color: '#34d399', fontFamily: 'monospace', letterSpacing: '0.15em', textTransform: 'uppercase' }}>New in EQ</div>
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.75rem', color: '#f8f9fa' }}>New EQ Filter Types</h2>
                <p style={{ color: '#8b909a', maxWidth: '700px', fontSize: '1rem', lineHeight: '1.7' }}>
                    EQ adds two important filter types you haven't seen in synthesis:
                    <strong style={{ color: '#e879f9' }}> Shelf filters</strong> and <strong style={{ color: '#22d3ee' }}>Bell/Parametric filters</strong>.
                </p>
            </div>

            {/* Category Tabs */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {filterCategories.map((cat, idx) => (
                    <button type="button"
                        key={idx}
                        onClick={() => { setActiveCategory(idx); handleFilterSelect(cat.filters[0]); }}
                        style={{
                            padding: '0.75rem 1.25rem',
                            background: activeCategory === idx ? cat.color : '#16181f',
                            border: `1px solid ${activeCategory === idx ? cat.color : '#ffffff15'}`,
                            borderRadius: '12px',
                            color: activeCategory === idx ? '#050507' : '#8b909a',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            position: 'relative'
                        }}
                    >
                        {cat.isNew && (
                            <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ff9f43', color: '#050507', fontSize: '0.55rem', fontWeight: '700', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>NEW</span>
                        )}
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Filter Type Buttons */}
            <div style={{ background: '#101218', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem', border: `1px solid ${filterCategories[activeCategory].color}30` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: filterCategories[activeCategory].color, marginBottom: '0.5rem' }}>{filterCategories[activeCategory].name}</h3>
                        <p style={{ color: '#8b909a', fontSize: '0.9rem' }}>{filterCategories[activeCategory].description}</p>
                    </div>
                    {!filterCategories[activeCategory].isNew && (
                        <div style={{ background: 'rgba(167,139,250,0.15)', color: '#DCC892', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '600', fontFamily: 'monospace' }}>From 1.3</div>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {filterCategories[activeCategory].filters.map(filter => (
                        <button type="button"
                            key={filter.id}
                            onClick={() => handleFilterSelect(filter)}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: filterType === filter.id ? filterCategories[activeCategory].color : '#16181f',
                                border: `1px solid ${filterType === filter.id ? filterCategories[activeCategory].color : '#ffffff15'}`,
                                borderRadius: '10px',
                                color: filterType === filter.id ? '#050507' : '#8b909a',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: '500'
                            }}
                        >
                            {filter.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Audio Engine */}
            <AudioEngine 
                filterType={filterType} 
                frequency={frequency} 
                gain={gain} 
                q={q} 
                categoryColor={filterCategories[activeCategory].color}
            />

            {/* Frequency Response Graph */}
            <FrequencyResponseGraph filterType={filterType} frequency={frequency} gain={gain} q={q} />

            {/* Parameter Controls */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
                <div style={{ background: '#101218', borderRadius: '14px', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ color: '#8b909a', fontSize: '0.85rem' }}>Frequency</span>
                        <span style={{ color: filterCategories[activeCategory].color, fontFamily: 'monospace', fontWeight: '600' }}>{formatFreq(frequency)} Hz</span>
                    </div>
                    <input aria-label="Cutoff frequency" type="range" min={0} max={1000} value={Math.round(((Math.log10(frequency) - Math.log10(20)) / (Math.log10(20000) - Math.log10(20))) * 1000)} onChange={(e) => { const minLog = Math.log10(20); const maxLog = Math.log10(20000); setFrequency(Math.round(Math.pow(10, minLog + (Number(e.target.value) / 1000) * (maxLog - minLog)))); }} style={{ width: '100%', accentColor: filterCategories[activeCategory].color }} />
                </div>
                <div style={{ background: '#101218', borderRadius: '14px', padding: '1.25rem', opacity: filterType === 'highpass' || filterType === 'lowpass' || filterType === 'notch' ? 0.4 : 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ color: '#8b909a', fontSize: '0.85rem' }}>Gain</span>
                        <span style={{ color: filterCategories[activeCategory].color, fontFamily: 'monospace', fontWeight: '600' }}>{gain > 0 ? '+' : ''}{gain} dB</span>
                    </div>
                    <input aria-label={`Gain, ${gain} dB`} type="range" min={-18} max={18} value={gain} onChange={(e) => setGain(Number(e.target.value))} disabled={filterType === 'highpass' || filterType === 'lowpass' || filterType === 'notch'} style={{ width: '100%', accentColor: filterCategories[activeCategory].color }} />
                </div>
                <div style={{ background: '#101218', borderRadius: '14px', padding: '1.25rem', opacity: filterType === 'bell' || filterType === 'notch' ? 1 : 0.4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ color: '#8b909a', fontSize: '0.85rem' }}>Q / Bandwidth (higher Q = narrower)</span>
                        <span style={{ color: filterCategories[activeCategory].color, fontFamily: 'monospace', fontWeight: '600' }}>{q.toFixed(1)}</span>
                    </div>
                    <input aria-label="Q bandwidth" type="range" min={0.3} max={18} step={0.1} value={q} onChange={(e) => setQ(Number(e.target.value))} disabled={filterType !== 'bell' && filterType !== 'notch'} style={{ width: '100%', accentColor: filterCategories[activeCategory].color }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.65rem', color: '#767b88' }}>
                        <span>Wide (musical)</span>
                        <span>Narrow (surgical)</span>
                    </div>
                </div>
            </div>

            {/* Quick Reference */}
            <div style={{ marginTop: '2rem', background: '#101218', borderRadius: '14px', padding: '1.5rem', border: '1px solid #ffffff10' }}>
                <h4 style={{ marginBottom: '1rem', fontWeight: '600', color: '#f8f9fa' }}>Quick Reference: All EQ Filter Types</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    {[
                        { color: '#00ff88', label: 'Pass Filters (HPF/LPF)', desc: 'Remove frequencies completely' },
                        { color: '#e879f9', label: 'Shelf Filters', desc: 'Boost/cut above or below a point' },
                        { color: '#22d3ee', label: 'Bell/Parametric', desc: 'Boost/cut a specific frequency range' },
                        { color: '#ff0066', label: 'Notch Filter', desc: 'Remove a narrow band completely' }
                    ].map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: item.color, boxShadow: `0 0 10px ${item.color}60` }} />
                            <span style={{ color: '#8b909a', fontSize: '0.85rem' }}>
                                <strong style={{ color: '#c9cdd4' }}>{item.label}:</strong> {item.desc}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', padding: '1.5rem', background: '#101218', borderRadius: '16px', border: '1px solid #ffffff10' }}>
                <button type="button" onClick={onComplete} style={{ padding: '0.875rem 1.75rem', background: 'linear-gradient(135deg, #74b9ff 0%, #0ea5e9 100%)', border: 'none', borderRadius: '12px', color: '#050507', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}>
                    Continue to Part 4: Practice Drawing →
                </button>
            </div>

            <CopyableNote title="NEW EQ Filter Types - Definitions" color="#34d399" variant="definition">
                <strong>NEW IN EQ (not in synthesis):</strong><br/><br/>
                • <strong>Shelf Filters:</strong> Boost or cut ALL frequencies above (high shelf) or below (low shelf) a point. Unlike pass filters, they don't remove - they adjust level. Used for: adding "air" (high shelf boost), warmth (low shelf boost), or reducing rumble (low shelf cut).<br/><br/>
                • <strong>Bell / Parametric Filter:</strong> Boost or cut frequencies AROUND a centre frequency. The Q controls bandwidth - high Q = narrow surgical cuts, low Q = broad musical boosts. The most common EQ type used in mixing.
            </CopyableNote>

            <CopyableNote title="All EQ Filter Types Summary" color="#22d3ee" variant="key">
                <strong>COMPLETE EQ FILTER TYPES:</strong><br/><br/>
                <strong>From Synthesis (1.3):</strong><br/>
                • Pass Filters (HPF/LPF) - Remove frequencies completely<br/>
                • Notch Filter - Remove a narrow band<br/><br/>
                <strong>New in EQ (1.11):</strong><br/>
                • Shelf Filters - Boost/cut above or below a point<br/>
                • Bell/Parametric - Boost/cut around a centre frequency with adjustable Q
            </CopyableNote>
        </div>
    );
};

// ============================================
// PART 4: PRACTICE WITH DRAWING CANVAS
// ============================================
const Part4Practice = () => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [userPoints, setUserPoints] = useState([]);
    const [showSolution, setShowSolution] = useState(false);
    const [challenge, setChallenge] = useState(null);
    const [drawingMode, setDrawingMode] = useState('guided'); // 'guided' or 'challenge'
    const [score, setScore] = useState(null);
    const [feedback, setFeedback] = useState(null);

    const canvasWidth = 600;
    const canvasHeight = 400;
    const padding = { top: 40, right: 40, bottom: 50, left: 60 };

    const challenges = [
        { name: 'High-Pass Filter', type: 'highpass', frequency: 200, gain: 0, q: 1, color: '#00ff88', hint: 'Flat at 0dB, then drops steeply to the LEFT of the cutoff' },
        { name: 'High-Pass Filter', type: 'highpass', frequency: 80, gain: 0, q: 1, color: '#00ff88', hint: 'Flat at 0dB, then drops steeply to the LEFT of the cutoff' },
        { name: 'Low-Pass Filter', type: 'lowpass', frequency: 8000, gain: 0, q: 1, color: '#00d4ff', hint: 'Flat at 0dB, then drops steeply to the RIGHT of the cutoff' },
        { name: 'Low-Pass Filter', type: 'lowpass', frequency: 3000, gain: 0, q: 1, color: '#00d4ff', hint: 'Flat at 0dB, then drops steeply to the RIGHT of the cutoff' },
        { name: 'Low Shelf Boost', type: 'lowshelf', frequency: 200, gain: 6, q: 1, color: '#e879f9', hint: 'Boosted on the LEFT, transitions to 0dB on the right' },
        { name: 'Low Shelf Cut', type: 'lowshelf', frequency: 150, gain: -6, q: 1, color: '#e879f9', hint: 'Cut on the LEFT, transitions to 0dB on the right' },
        { name: 'High Shelf Boost', type: 'highshelf', frequency: 8000, gain: 6, q: 1, color: '#e879f9', hint: 'Boosted on the RIGHT, transitions from 0dB on the left' },
        { name: 'High Shelf Cut', type: 'highshelf', frequency: 10000, gain: -4, q: 1, color: '#e879f9', hint: 'Cut on the RIGHT, transitions from 0dB on the left' },
        { name: 'Bell Boost (Wide)', type: 'bell', frequency: 1000, gain: 6, q: 0.7, color: '#22d3ee', hint: 'Symmetrical bump centred on the frequency, wide curve' },
        { name: 'Bell Boost (Narrow)', type: 'bell', frequency: 2500, gain: 8, q: 4, color: '#22d3ee', hint: 'Symmetrical bump centred on the frequency, narrow curve' },
        { name: 'Bell Cut (Surgical)', type: 'bell', frequency: 400, gain: -9, q: 6, color: '#22d3ee', hint: 'Symmetrical dip centred on the frequency, narrow curve' },
        { name: 'Notch Filter', type: 'notch', frequency: 1000, gain: 0, q: 10, color: '#ff0066', hint: 'Sharp narrow dip at the frequency, almost like a spike downward' },
        { name: 'Notch Filter', type: 'notch', frequency: 50, gain: 0, q: 8, color: '#ff0066', hint: 'Sharp narrow dip at the frequency, almost like a spike downward' },
    ];

    const freqToX = useCallback((freq) => {
        const minLog = Math.log10(20);
        const maxLog = Math.log10(20000);
        const logFreq = Math.log10(freq);
        return padding.left + ((logFreq - minLog) / (maxLog - minLog)) * (canvasWidth - padding.left - padding.right);
    }, []);

    const xToFreq = useCallback((x) => {
        const minLog = Math.log10(20);
        const maxLog = Math.log10(20000);
        const ratio = (x - padding.left) / (canvasWidth - padding.left - padding.right);
        return Math.pow(10, minLog + ratio * (maxLog - minLog));
    }, []);

    const dbToY = useCallback((db) => {
        const innerHeight = canvasHeight - padding.top - padding.bottom;
        return padding.top + innerHeight / 2 - (db / 24) * (innerHeight / 2);
    }, []);

    const yToDb = useCallback((y) => {
        const innerHeight = canvasHeight - padding.top - padding.bottom;
        return ((padding.top + innerHeight / 2 - y) / (innerHeight / 2)) * 24;
    }, []);

    const calculateResponse = useCallback((freq, ch) => {
        if (!ch) return 0;
        const { type, frequency: fc, gain: g, q: qVal } = ch;
        
        if (type === 'highpass') {
            // 2-pole Butterworth: smooth -3 dB at fc, no hard corner
            return Math.max(-48, -10 * Math.log10(1 + Math.pow(fc / freq, 4)));
        }
        if (type === 'lowpass') {
            // 2-pole Butterworth: smooth -3 dB at fc, no hard corner
            return Math.max(-48, -10 * Math.log10(1 + Math.pow(freq / fc, 4)));
        }
        if (type === 'lowshelf') {
            const ratio = freq / fc;
            const rolloff = 1 / (1 + Math.pow(ratio, 2));
            return g * rolloff;
        }
        if (type === 'highshelf') {
            const ratio = fc / freq;
            const rolloff = 1 / (1 + Math.pow(ratio, 2));
            return g * rolloff;
        }
        if (type === 'bell') {
            const logRatio = Math.log10(freq / fc);
            const bandwidth = 1 / qVal;
            const response = Math.exp(-Math.pow(logRatio / (bandwidth * 0.5), 2));
            return g * response;
        }
        if (type === 'notch') {
            const logRatio = Math.log10(freq / fc);
            const bandwidth = 1 / (qVal * 2);
            const distance = Math.abs(logRatio);
            if (distance < bandwidth * 0.3) return -48;
            const response = Math.exp(-Math.pow(logRatio / (bandwidth * 0.5), 2));
            return -48 * response;
        }
        return 0;
    }, []);

    const generateNewChallenge = useCallback(() => {
        const newChallenge = challenges[Math.floor(Math.random() * challenges.length)];
        setChallenge(newChallenge);
        setShowSolution(false);
        setUserPoints([]);
        setScore(null);
        setFeedback(null);
    }, []);

    // Initialize with a challenge
    React.useEffect(() => {
        if (!challenge) {
            generateNewChallenge();
        }
    }, [challenge, generateNewChallenge]);

    // Calculate accuracy score
    const calculateScore = useCallback(() => {
        if (!challenge || userPoints.length < 10) {
            setFeedback("Draw more of the curve to get feedback!");
            return;
        }

        let totalError = 0;
        let pointsChecked = 0;

        // Sample at 50 fixed log-spaced frequencies so score is independent of drawing speed
        const sampleFreqs = Array.from({ length: 50 }, (_, k) => {
            const minLog = Math.log10(20);
            const maxLog = Math.log10(20000);
            return Math.pow(10, minLog + (k / 49) * (maxLog - minLog));
        });

        sampleFreqs.forEach((sampleFreq) => {
            const correctDb = calculateResponse(sampleFreq, challenge);
            const sampleX = freqToX(sampleFreq);
            // Find closest drawn point within a 20px tolerance window
            let closestError = null;
            userPoints.forEach((pt) => {
                if (Math.abs(pt.x - sampleX) <= 20) {
                    const userDb = yToDb(pt.y);
                    const err = Math.abs(userDb - correctDb);
                    if (closestError === null || err < closestError) closestError = err;
                }
            });
            if (closestError !== null) {
                totalError += closestError;
                pointsChecked++;
            }
        });

        if (pointsChecked === 0) {
            setFeedback("Draw more of the curve to get feedback!");
            return;
        }

        const avgError = totalError / pointsChecked;
        const accuracy = Math.max(0, Math.min(100, 100 - (avgError * 3)));
        setScore(Math.round(accuracy));

        // Generate feedback
        if (accuracy >= 85) {
            setFeedback("Excellent! Your curve shape is very accurate. You clearly understand this filter type.");
        } else if (accuracy >= 70) {
            if (challenge.type === 'bell' || challenge.type === 'notch') {
                setFeedback(`Good work! The overall shape is right. Check how wide your curve is: Q = ${challenge.q} means a ${challenge.q > 2 ? 'narrow' : 'wide'} peak.`);
            } else {
                setFeedback("Good work! The overall shape is right. Check the steepness of the slope.");
            }
        } else if (accuracy >= 50) {
            setFeedback("Getting there! You've got the basic idea, but review the curve direction and where it starts changing.");
        } else {
            // More specific feedback based on filter type
            if (challenge.type === 'highpass') {
                setFeedback("Remember: HPF drops to the LEFT of the cutoff. The right side should be flat at 0dB.");
            } else if (challenge.type === 'lowpass') {
                setFeedback("Remember: LPF drops to the RIGHT of the cutoff. The left side should be flat at 0dB.");
            } else if (challenge.type === 'lowshelf' || challenge.type === 'highshelf') {
                setFeedback("Shelf filters transition between two levels - they don't drop to silence like pass filters.");
            } else if (challenge.type === 'bell') {
                setFeedback("Bell curves are symmetrical around the centre frequency. Check your boost/cut direction.");
            } else if (challenge.type === 'notch') {
                setFeedback("Notch filters have a very narrow, deep cut. It should look like a sharp spike downward.");
            }
        }
    }, [challenge, userPoints, yToDb, freqToX, calculateResponse]);

    const drawGrid = useCallback((ctx) => {
        const innerWidth = canvasWidth - padding.left - padding.right;
        const innerHeight = canvasHeight - padding.top - padding.bottom;

        // Background
        ctx.fillStyle = '#050507';
        ctx.fillRect(padding.left, padding.top, innerWidth, innerHeight);

        // Vertical grid lines (frequency)
        const freqMarkers = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        freqMarkers.forEach(freq => {
            const x = freqToX(freq);
            ctx.beginPath();
            ctx.moveTo(x, padding.top);
            ctx.lineTo(x, canvasHeight - padding.bottom);
            ctx.stroke();
        });

        // Horizontal grid lines (dB)
        for (let db = -24; db <= 24; db += 6) {
            const y = dbToY(db);
            ctx.strokeStyle = db === 0 ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = db === 0 ? 1.5 : 1;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(canvasWidth - padding.right, y);
            ctx.stroke();
        }

        // Axes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, canvasHeight - padding.bottom);
        ctx.lineTo(canvasWidth - padding.right, canvasHeight - padding.bottom);
        ctx.stroke();

        // Labels
        ctx.fillStyle = '#8b909a';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';

        // X-axis labels
        [20, 100, 500, '1k', '5k', '20k'].forEach((label, i) => {
            const freqs = [20, 100, 500, 1000, 5000, 20000];
            const x = freqToX(freqs[i]);
            ctx.fillText(String(label), x, canvasHeight - padding.bottom + 18);
        });

        // Y-axis labels
        ctx.textAlign = 'right';
        for (let db = -24; db <= 24; db += 12) {
            const y = dbToY(db);
            ctx.fillText(`${db > 0 ? '+' : ''}${db}`, padding.left - 8, y + 4);
        }

        // Axis titles
        ctx.fillStyle = '#c9cdd4';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Frequency (Hz)', canvasWidth / 2, canvasHeight - 8);

        ctx.save();
        ctx.translate(15, canvasHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Gain (dB)', 0, 0);
        ctx.restore();
    }, [freqToX, dbToY]);

    // Draw guided mode hints
    const drawGuidedHints = useCallback((ctx) => {
        if (!challenge || drawingMode !== 'guided') return;

        // Draw faded solution curve as guide
        ctx.strokeStyle = challenge.color + '40'; // 25% opacity
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        for (let x = padding.left; x <= canvasWidth - padding.right; x += 2) {
            const freq = xToFreq(x);
            const db = calculateResponse(freq, challenge);
            const y = dbToY(db);

            if (x === padding.left) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();

        // Draw frequency marker
        const markerX = freqToX(challenge.frequency);
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(markerX, padding.top);
        ctx.lineTo(markerX, canvasHeight - padding.bottom);
        ctx.stroke();
        ctx.setLineDash([]);

        // Frequency label
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        const freqLabel = challenge.frequency >= 1000 ? `${challenge.frequency / 1000}kHz` : `${challenge.frequency}Hz`;
        ctx.fillText(freqLabel, markerX, padding.top - 10);

        // Draw gain marker for shelf/bell
        if (challenge.type !== 'highpass' && challenge.type !== 'lowpass' && challenge.type !== 'notch') {
            const gainY = dbToY(challenge.gain);
            ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(padding.left, gainY);
            ctx.lineTo(canvasWidth - padding.right, gainY);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#C99F44';
            ctx.textAlign = 'left';
            ctx.fillText(`${challenge.gain > 0 ? '+' : ''}${challenge.gain}dB`, canvasWidth - padding.right + 5, gainY + 4);
        }
    }, [challenge, drawingMode, freqToX, dbToY, xToFreq, calculateResponse]);

    const drawUserLine = useCallback((ctx) => {
        if (userPoints.length < 2) return;

        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = '#3b82f6';
        ctx.shadowBlur = 6;

        ctx.beginPath();
        ctx.moveTo(userPoints[0].x, userPoints[0].y);
        for (let i = 1; i < userPoints.length; i++) {
            ctx.lineTo(userPoints[i].x, userPoints[i].y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
    }, [userPoints]);

    const drawSolutionCurve = useCallback((ctx) => {
        if (!challenge || !showSolution) return;

        ctx.strokeStyle = challenge.color;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = challenge.color;
        ctx.shadowBlur = 10;

        ctx.beginPath();
        for (let x = padding.left; x <= canvasWidth - padding.right; x += 2) {
            const freq = xToFreq(x);
            const db = calculateResponse(freq, challenge);
            const y = dbToY(db);

            if (x === padding.left) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw frequency marker
        const markerX = freqToX(challenge.frequency);
        ctx.strokeStyle = 'rgba(255, 200, 100, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(markerX, padding.top);
        ctx.lineTo(markerX, canvasHeight - padding.bottom);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label
        ctx.fillStyle = '#ffd700';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        const freqLabel = challenge.frequency >= 1000 ? `${challenge.frequency / 1000}kHz` : `${challenge.frequency}Hz`;
        ctx.fillText(freqLabel, markerX, padding.top - 8);
    }, [challenge, showSolution, calculateResponse, dbToY, freqToX, xToFreq]);

    const redrawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        drawGrid(ctx);
        drawGuidedHints(ctx);
        drawUserLine(ctx);
        drawSolutionCurve(ctx);
    }, [drawGrid, drawGuidedHints, drawUserLine, drawSolutionCurve]);

    React.useEffect(() => {
        redrawCanvas();
    }, [redrawCanvas, userPoints, showSolution, challenge, drawingMode]);

    const getMousePos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    const handleMouseDown = (e) => {
        const pos = getMousePos(e);
        if (pos.x >= padding.left && pos.x <= canvasWidth - padding.right &&
            pos.y >= padding.top && pos.y <= canvasHeight - padding.bottom) {
            setIsDrawing(true);
            setUserPoints([pos]);
            setScore(null);
            setFeedback(null);
        }
    };

    const handleMouseMove = (e) => {
        if (!isDrawing) return;
        const pos = getMousePos(e);
        if (pos.x >= padding.left && pos.x <= canvasWidth - padding.right &&
            pos.y >= padding.top && pos.y <= canvasHeight - padding.bottom) {
            setUserPoints(prev => [...prev, pos]);
        }
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
    };

    const handleMouseLeave = () => {
        setIsDrawing(false);
    };

    const clearDrawing = () => {
        setUserPoints([]);
        setShowSolution(false);
        setScore(null);
        setFeedback(null);
    };

    const checkAnswer = () => {
        setShowSolution(true);
        calculateScore();
    };

    const formatFreq = (f) => f >= 1000 ? `${f / 1000}k` : f;

    return (
        <div style={{ padding: '1.5rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #101218 0%, #16181f 100%)', borderRadius: '20px', padding: '2rem', marginBottom: '2rem', border: '1px solid #ffffff10' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ background: 'linear-gradient(135deg, #74b9ff 0%, #0ea5e9 100%)', color: '#050507', padding: '0.5rem 1.25rem', borderRadius: '24px', fontSize: '0.75rem', fontWeight: '700', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Part 4</div>
                    <div style={{ fontSize: '0.7rem', color: '#74b9ff', fontFamily: 'monospace', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Draw & Practice</div>
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.75rem', color: '#f8f9fa' }}>Practice Drawing EQ Curves</h2>
                <p style={{ color: '#8b909a', maxWidth: '700px', fontSize: '1rem', lineHeight: '1.7' }}>
                    Test your understanding by drawing the frequency response curve for each challenge.
                    <span style={{ color: '#ff9f43' }}> Draw on the canvas</span>, then check your answer.
                </p>
            </div>

            {/* Mode Selector */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <button type="button"
                    onClick={() => { setDrawingMode('guided'); clearDrawing(); }}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: drawingMode === 'guided' ? 'linear-gradient(135deg, #34d399 0%, #10b981 100%)' : '#16181f',
                        border: `1px solid ${drawingMode === 'guided' ? '#34d399' : '#ffffff15'}`,
                        borderRadius: '12px',
                        color: drawingMode === 'guided' ? '#050507' : '#8b909a',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600'
                    }}
                >
                     Guided Mode
                </button>
                <button type="button"
                    onClick={() => { setDrawingMode('challenge'); clearDrawing(); }}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: drawingMode === 'challenge' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : '#16181f',
                        border: `1px solid ${drawingMode === 'challenge' ? '#f59e0b' : '#ffffff15'}`,
                        borderRadius: '12px',
                        color: drawingMode === 'challenge' ? '#050507' : '#8b909a',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600'
                    }}
                >
                     Challenge Mode
                </button>
                <div style={{ marginLeft: 'auto', padding: '0.75rem 1rem', background: '#16181f', borderRadius: '12px', fontSize: '0.8rem', color: '#8b909a' }}>
                    {drawingMode === 'guided' ? 'Faded guide curve visible • Trace over it to learn the shape' : 'No hints • Draw from memory'}
                </div>
            </div>

            {/* Challenge Display */}
            {challenge && (
                <div style={{ background: '#101218', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', border: `1px solid ${challenge.color}50` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <div style={{ fontSize: '0.7rem', color: '#767b88', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Current Challenge</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: challenge.color }}>{challenge.name}</div>
                            {drawingMode === 'guided' && (
                                <div style={{ fontSize: '0.85rem', color: '#8b909a', marginTop: '0.5rem', fontStyle: 'italic' }}>
                                     {challenge.hint}
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.65rem', color: '#767b88', textTransform: 'uppercase' }}>Frequency</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#ffd700', fontFamily: 'monospace' }}>{formatFreq(challenge.frequency)} Hz</div>
                            </div>
                            {(challenge.type === 'lowshelf' || challenge.type === 'highshelf' || challenge.type === 'bell') && (
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.65rem', color: '#767b88', textTransform: 'uppercase' }}>Gain</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#C99F44', fontFamily: 'monospace' }}>{challenge.gain > 0 ? '+' : ''}{challenge.gain} dB</div>
                                </div>
                            )}
                            {(challenge.type === 'bell' || challenge.type === 'notch') && (
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.65rem', color: '#767b88', textTransform: 'uppercase' }}>Q</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#14b8a6', fontFamily: 'monospace' }}>{challenge.q}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Canvas Container */}
            <div style={{ background: '#101218', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #ffffff10' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button type="button"
                            onClick={checkAnswer}
                            style={{
                                padding: '0.75rem 1.25rem',
                                background: showSolution ? '#34d399' : '#16181f',
                                border: `1px solid ${showSolution ? '#34d399' : '#ffffff15'}`,
                                borderRadius: '10px',
                                color: showSolution ? '#050507' : '#c9cdd4',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: '600'
                            }}
                        >
                            ✓ Check Answer
                        </button>
                        <button type="button"
                            onClick={clearDrawing}
                            style={{
                                padding: '0.75rem 1.25rem',
                                background: '#16181f',
                                border: '1px solid #ffffff15',
                                borderRadius: '10px',
                                color: '#c9cdd4',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: '600'
                            }}
                        >
                            ✕ Clear Drawing
                        </button>
                        <button type="button"
                            onClick={generateNewChallenge}
                            style={{
                                padding: '0.75rem 1.25rem',
                                background: 'linear-gradient(135deg, #74b9ff 0%, #0ea5e9 100%)',
                                border: 'none',
                                borderRadius: '10px',
                                color: '#050507',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: '600'
                            }}
                        >
                             New Challenge
                        </button>
                    </div>

                    {/* Legend */}
                    <div style={{ background: '#16181f', borderRadius: '8px', padding: '0.75rem 1rem' }}>
                        <div style={{ fontSize: '0.65rem', color: '#767b88', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Legend</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '20px', height: '3px', background: '#3b82f6', borderRadius: '2px' }} />
                                <span style={{ color: '#8b909a' }}>Your drawing</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '20px', height: '3px', background: challenge?.color || '#22d3ee', borderRadius: '2px' }} />
                                <span style={{ color: '#8b909a' }}>Correct curve</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Canvas */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <canvas
                        ref={canvasRef}
                        width={canvasWidth}
                        height={canvasHeight}
                        onPointerDown={handleMouseDown}
                        onPointerMove={handleMouseMove}
                        onPointerUp={handleMouseUp}
                        onPointerLeave={handleMouseLeave}
                        style={{
                            borderRadius: '12px',
                            cursor: 'crosshair',
                            maxWidth: '100%',
                            height: 'auto',
                            touchAction: 'none'
                        }}
                    />
                </div>

                {/* Score and Feedback */}
                {(score !== null || feedback) && (
                    <div style={{ 
                        marginTop: '1.5rem', 
                        padding: '1.25rem', 
                        background: score >= 70 ? 'rgba(52, 211, 153, 0.1)' : score >= 50 ? 'rgba(251, 191, 36, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        borderRadius: '12px',
                        border: `1px solid ${score >= 70 ? '#34d39950' : score >= 50 ? '#fbbf2450' : '#ef444450'}`
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                            <div style={{ 
                                fontSize: '2rem', 
                                fontWeight: '700', 
                                color: score >= 70 ? '#34d399' : score >= 50 ? '#fbbf24' : '#ef4444',
                                fontFamily: 'monospace'
                            }}>
                                {score !== null ? `${score}%` : '–'}
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: '600', color: '#f8f9fa' }}>
                                {score >= 85 ? 'Excellent!' : score >= 70 ? 'Good work!' : score >= 50 ? 'Getting there!' : 'Keep practising!'}
                            </div>
                        </div>
                        {feedback && (
                            <div style={{ fontSize: '0.9rem', color: '#c9cdd4', lineHeight: '1.6' }}>
                                {feedback}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Key Takeaways */}
            <div style={{ background: '#101218', borderRadius: '16px', padding: '2rem', marginBottom: '2rem', border: '1px solid #ffffff10' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#f8f9fa', marginBottom: '1.5rem' }}>Key Takeaways</h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {[
                        { icon: '', title: 'Same Filters, Different Context', desc: 'LPF, HPF, BPF, and Notch work identically in synthesis and EQ - only the application differs.' },
                        { icon: '', title: 'Synthesis = Creative, EQ = Corrective', desc: 'Synthesis uses dynamic sweeps and extreme resonance. EQ uses static, subtle settings.' },
                        { icon: '', title: 'New in EQ: Shelf Filters', desc: 'Boost or cut all frequencies above/below a point without removing them completely.' },
                        { icon: '', title: 'New in EQ: Bell/Parametric', desc: 'The most common EQ type - boost or cut around a centre frequency with adjustable Q.' }
                    ].map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '1rem', padding: '1rem', background: '#16181f', borderRadius: '12px' }}>
                            <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
                            <div>
                                <div style={{ fontWeight: '600', color: '#f8f9fa', marginBottom: '0.25rem' }}>{item.title}</div>
                                <div style={{ fontSize: '0.9rem', color: '#8b909a' }}>{item.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <CopyableNote title="EQ Curve Drawing Tips" color="#74b9ff" variant="exam">
                <strong>Drawing frequency response curves for exams:</strong><br/><br/>
                • HPF: Flat line at 0dB, drops steeply LEFT of cutoff<br/>
                • LPF: Flat line at 0dB, drops steeply RIGHT of cutoff<br/>
                • Shelf: Transitions gradually to target gain level<br/>
                • Bell: Symmetrical curve centred on frequency, width determined by Q<br/>
                • Higher Q = narrower curve | Lower Q = wider curve<br/>
                • Steeper slope (24dB/oct) = sharper drop than gentle slope (12dB/oct)
            </CopyableNote>

            <CopyableNote title="Complete EQ Summary for Exams" color="#34d399" variant="key">
                <strong>FILTER TYPES:</strong><br/>
                • HPF - Removes lows, passes highs<br/>
                • LPF - Removes highs, passes lows<br/>
                • BPF - Passes band around cutoff<br/>
                • Notch - Removes narrow band at cutoff<br/>
                • Low Shelf - Boosts/cuts below frequency<br/>
                • High Shelf - Boosts/cuts above frequency<br/>
                • Bell/Parametric - Boosts/cuts around frequency<br/><br/>
                <strong>PARAMETERS:</strong><br/>
                • Frequency - Where the filter acts<br/>
                • Gain - How much boost/cut (shelves & bells only)<br/>
                • Q - Width of effect (bells & notches mainly)<br/>
                • Slope - Steepness of rolloff (pass filters)
            </CopyableNote>

            <div style={{ marginTop: '2rem', padding: '2rem', background: 'linear-gradient(135deg, rgba(52,211,153,0.1) 0%, #101218 100%)', borderRadius: '16px', border: '1px solid rgba(52,211,153,0.3)', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#34d399', marginBottom: '0.5rem' }}>Well Done!</h3>
                <p style={{ color: '#8b909a', maxWidth: '500px', margin: '0 auto' }}>
                    You've bridged your synthesis knowledge to EQ. Use the navigation above to revisit any section, and copy the notes to your notes app for revision.
                </p>
            </div>
        </div>
    );
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function EQFilterBridge() {
    const [currentPart, setCurrentPart] = useState(1);
    const [visitedParts, setVisitedParts] = useState(new Set([1]));

    const goToPart = (part) => {
        setCurrentPart(part);
        setVisitedParts(prev => new Set([...prev, part]));
    };

    const partColors = { 1: '#DCC892', 2: '#ff9f43', 3: '#34d399', 4: '#74b9ff' };
    const partSubtitles = { 1: 'What You Know', 2: 'Same Tools', 3: 'New Filters', 4: 'Draw Curves' };

    return (
        <div style={{ minHeight: '100vh', background: '#050507', color: '#c9cdd4', fontFamily: 'var(--font-manrope), -apple-system, BlinkMacSystemFont, sans-serif' }}>
            {/* Hero with video background */}
            <div style={{
                position: 'relative',
                overflow: 'hidden',
                width: '100vw',
                marginLeft: 'calc(-50vw + 50%)',
                minHeight: '240px',
            }}>
                <video aria-hidden="true"
                    autoPlay muted loop playsInline
                    onLoadedData={(e) => { e.target.style.opacity = 1; }}
                    style={{
                        position: 'absolute', inset: 0,
                        width: '100%', height: '100%',
                        objectFit: 'cover',
                        opacity: 1, transition: 'opacity 0.8s ease-out',
                    }}
                    poster="/eq-hero-poster.jpg"
                    src="/eq-hero.mp4"
                />
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to bottom, rgba(5,5,7,0.3) 0%, rgba(5,5,7,0.8) 100%)',
                }} />
                <div style={{
                    position: 'relative',
                    maxWidth: '640px', margin: '0 auto',
                    padding: '3rem 1.5rem 2.5rem',
                    textAlign: 'center',
                }}>
                    <h1 style={{
                        fontSize: '2.25rem',
                        fontWeight: '700',
                        color: '#ffffff',
                        lineHeight: '1.2',
                        marginBottom: '1rem',
                        textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}>From Synthesis to EQ</h1>
                    <p style={{
                        color: 'rgba(255,255,255,0.85)',
                        fontSize: '1.125rem',
                        lineHeight: '1.6',
                        maxWidth: '480px', margin: '0 auto',
                    }}>Bridge the gap between filter concepts in synthesis and their application in equalisation</p>
                </div>
            </div>

            {/* Header */}
            <header style={{ background: 'linear-gradient(180deg, #101218 0%, #0a0b0f 100%)', borderBottom: '1px solid #ffffff10', position: 'sticky', top: 0, zIndex: 100 }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '0.9rem', fontWeight: '400', letterSpacing: '0.15em', color: '#8b909a', textTransform: 'uppercase', margin: 0 }}>
                            From <span style={{ color: '#DCC892', fontWeight: '600' }}>Synthesis</span> to <span style={{ color: '#34d399', fontWeight: '600' }}>EQ</span>
                        </h1>
                        <div style={{ fontSize: '0.65rem', color: '#767b88', fontFamily: 'monospace', marginTop: '0.25rem' }}>
                            A-Level Music Technology | 1.3 → 1.11 Bridge
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {[1, 2, 3, 4].map(part => (
                            <button type="button"
                                key={part}
                                onClick={() => goToPart(part)}
                                title={`Part ${part}: ${partSubtitles[part]}`}
                                style={{
                                    padding: '0.4rem 1rem',
                                    background: currentPart === part ? partColors[part] : 'transparent',
                                    border: `1px solid ${currentPart === part ? 'transparent' : visitedParts.has(part) ? 'rgba(255,200,100,0.15)' : '#ffffff10'}`,
                                    borderRadius: '8px',
                                    color: currentPart === part ? '#050507' : visitedParts.has(part) ? '#c9cdd4' : '#767b88',
                                    cursor: 'pointer',
                                    fontFamily: 'monospace',
                                    textAlign: 'center',
                                    lineHeight: 1.3,
                                }}
                            >
                                <div style={{ fontSize: '0.75rem', fontWeight: '600' }}>Part {part}</div>
                                <div style={{ fontSize: '0.6rem', fontWeight: '400', opacity: 0.85, textTransform: 'none', letterSpacing: 0 }}>{partSubtitles[part]}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Content */}
            <main style={{ maxWidth: '1100px', margin: '0 auto' }}>
                {currentPart === 1 && <Part1Review onComplete={() => goToPart(2)} />}
                {currentPart === 2 && <Part2Bridge onComplete={() => goToPart(3)} />}
                {currentPart === 3 && <Part3NewConcepts onComplete={() => goToPart(4)} />}
                {currentPart === 4 && <Part4Practice />}
            </main>

            {/* Footer */}
            <footer style={{ background: '#101218', borderTop: '1px solid #ffffff10', padding: '2rem', marginTop: '3rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#767b88', fontFamily: 'monospace', letterSpacing: '0.1em' }}>
                    A-Level Music Technology | Component 4: Producing and Analysing
                </div>
                <div style={{ fontSize: '0.65rem', color: '#767b88', marginTop: '0.5rem' }}>
                    Topic 1.11 EQ | Bridging from 1.3 Synthesis
                </div>
            </footer>
        </div>
    );
}
