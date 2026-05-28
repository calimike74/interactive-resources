'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Target } from 'lucide-react';

// ============================================
// CORE CONCEPTS (What students need to know)
// ============================================
const WAVEFORM_CONCEPTS = [
    {
        id: 'xaxis',
        term: 'X-Axis: Time',
        definition: 'The horizontal axis represents TIME (milliseconds or seconds). Shows how the waveform changes over time.',
        keyPoint: 'Period is measured along the X-axis. Lower pitch = wider cycles along the X-axis.',
        svgType: 'xaxis',
        color: '#DCC892',
        glowColor: 'rgba(220, 200, 146, 0.35)'
    },
    {
        id: 'yaxis',
        term: 'Y-Axis: Amplitude',
        definition: 'The vertical axis represents AMPLITUDE (air pressure displacement or voltage). Shows the strength of the signal.',
        keyPoint: 'Amplitude determines LOUDNESS, not pitch. Changing octave does NOT change amplitude.',
        svgType: 'yaxis',
        color: '#DCC892',
        glowColor: 'rgba(220, 200, 146, 0.35)'
    },
    {
        id: 'period',
        term: 'Period (T)',
        definition: 'The time for ONE complete cycle of the waveform. Measured in seconds or milliseconds.',
        keyPoint: 'Period = 1 / Frequency. Lower frequency = longer period = wider cycles.',
        svgType: 'period',
        color: '#DCC892',
        glowColor: 'rgba(220, 200, 146, 0.35)'
    },
    {
        id: 'frequency',
        term: 'Frequency (f)',
        definition: 'The number of complete cycles per second. Measured in Hertz (Hz).',
        keyPoint: 'Frequency = 1 / Period. Higher frequency = higher pitch = more cycles per second.',
        svgType: 'frequency',
        color: '#DCC892',
        glowColor: 'rgba(220, 200, 146, 0.35)'
    },
    {
        id: 'octave',
        term: 'Octave',
        definition: 'A doubling or halving of frequency. Going up one octave = frequency x 2. Going down = frequency / 2.',
        keyPoint: 'Octave up = period HALVES. Octave down = period DOUBLES.',
        svgType: 'octave',
        color: '#DCC892',
        glowColor: 'rgba(220, 200, 146, 0.35)'
    }
];

// ============================================
// COPYABLE NOTE COMPONENT
// ============================================
const CopyableNote = ({ title, children, color = '#DCC892', variant = 'definition' }) => {
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
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>
            <div ref={contentRef} style={{ color: '#c9cdd4', fontSize: '0.9rem', lineHeight: '1.6' }}>
                {children}
            </div>
        </div>
    );
};

// ============================================
// CONCEPT SVG ICONS
// ============================================
const ConceptSVG = ({ type, color, isHovered }) => {
    const width = 120;
    const height = 70;

    const renderIcon = () => {
        switch(type) {
            case 'xaxis':
                return (
                    <g>
                        <line x1="10" y1="35" x2="110" y2="35" stroke={color} strokeWidth={isHovered ? 3 : 2} />
                        <polygon points="105,30 115,35 105,40" fill={color} />
                        <text x="60" y="55" fill={color} fontSize="10" textAnchor="middle" fontWeight="bold">TIME</text>
                    </g>
                );
            case 'yaxis':
                return (
                    <g>
                        <line x1="35" y1="60" x2="35" y2="10" stroke={color} strokeWidth={isHovered ? 3 : 2} />
                        <polygon points="30,15 35,5 40,15" fill={color} />
                        <text x="70" y="40" fill={color} fontSize="9" textAnchor="middle" fontWeight="bold">AMPLITUDE</text>
                    </g>
                );
            case 'period':
                return (
                    <g>
                        <path d="M 10 35 Q 30 10, 50 35 Q 70 60, 90 35 Q 95 28, 100 35" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                        <line x1="10" y1="55" x2="50" y2="55" stroke={color} strokeWidth={isHovered ? 3 : 2} />
                        <line x1="10" y1="50" x2="10" y2="60" stroke={color} strokeWidth="2" />
                        <line x1="50" y1="50" x2="50" y2="60" stroke={color} strokeWidth="2" />
                        <text x="30" y="68" fill={color} fontSize="9" textAnchor="middle" fontWeight="bold">T</text>
                    </g>
                );
            case 'frequency':
                return (
                    <g>
                        <path d="M 5 35 Q 15 15, 25 35 Q 35 55, 45 35 Q 55 15, 65 35 Q 75 55, 85 35 Q 95 15, 105 35" fill="none" stroke={color} strokeWidth={isHovered ? 2.5 : 2} />
                        <text x="60" y="60" fill={color} fontSize="9" textAnchor="middle" fontWeight="bold">4 cycles = 4Hz</text>
                    </g>
                );
            case 'octave':
                return (
                    <g>
                        <path d="M 5 35 Q 25 15, 45 35 Q 65 55, 85 35 Q 90 28, 95 35" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
                        <path d="M 5 35 Q 15 20, 25 35 Q 35 50, 45 35 Q 55 20, 65 35 Q 75 50, 85 35 Q 95 20, 105 35" fill="none" stroke={color} strokeWidth={isHovered ? 2.5 : 2} />
                        <text x="55" y="60" fill={color} fontSize="8" textAnchor="middle" fontWeight="bold">x2 = octave up</text>
                    </g>
                );
            default:
                return null;
        }
    };

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            <rect x="0" y="0" width={width} height={height} fill="transparent" />
            {renderIcon()}
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
        const text = `${concept.term}\n\nDefinition: ${concept.definition}\n\nKey Point: ${concept.keyPoint}`;
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
            onClick={onFlip}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ perspective: '1000px', cursor: 'pointer', width: '100%', height: '200px' }}
        >
            <div style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
            }}>
                {/* Front */}
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
                        <ConceptSVG type={concept.svgType} color={concept.color} isHovered={isHovered} />
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600', color: isHovered ? concept.color : '#f8f9fa', textAlign: 'center' }}>
                        {concept.term}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#4a4f5a', marginTop: '0.75rem', fontFamily: 'monospace', padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                        Click to reveal
                    </div>
                </div>

                {/* Back */}
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
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '0.5rem'
                    }}>
                        <div style={{
                            fontSize: '0.65rem',
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
                                fontFamily: 'monospace'
                            }}
                        >
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    </div>

                    <div style={{
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        color: '#050507',
                        marginBottom: '0.5rem',
                        lineHeight: '1.4',
                        flex: 1
                    }}>
                        {concept.definition}
                    </div>

                    <div style={{
                        fontSize: '0.75rem',
                        color: '#050507',
                        lineHeight: '1.3',
                        padding: '0.5rem 0.6rem',
                        background: 'rgba(0,0,0,0.15)',
                        borderRadius: '8px'
                    }}>
                        <span style={{ fontWeight: '700' }}>Key: </span>
                        {concept.keyPoint}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================
// WAVEFORM CANVAS COMPONENT
// ============================================
const WaveformDisplay = ({ cycles, color, label, width = 400, height = 120, showCycleCount = true }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Clear
        ctx.fillStyle = '#050507';
        ctx.fillRect(0, 0, width, height);

        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += width / 8) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Centre line
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        // Waveform
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.beginPath();

        const amplitude = (height * 0.7) / 2;
        const midY = height / 2;

        for (let x = 0; x <= width; x++) {
            const progress = x / width;
            const y = midY - Math.sin(progress * cycles * 2 * Math.PI) * amplitude;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

    }, [cycles, color, width, height]);

    return (
        <div style={{ position: 'relative' }}>
            {label && (
                <div style={{
                    marginBottom: '0.5rem',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: color
                }}>
                    {label}
                </div>
            )}
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '8px',
                    border: `1px solid ${color}40`
                }}
            />
            {showCycleCount && (
                <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    background: 'rgba(0,0,0,0.7)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    color: color
                }}>
                    {cycles} cycle{cycles !== 1 ? 's' : ''}
                </div>
            )}
        </div>
    );
};

// ============================================
// PART 1: UNDERSTANDING THE AXES
// ============================================
const Part1Foundations = ({ onComplete }) => {
    const [flippedCards, setFlippedCards] = useState(new Set());
    const [allRevealed, setAllRevealed] = useState(false);

    const toggleCard = (id) => {
        const newFlipped = new Set(flippedCards);
        if (newFlipped.has(id)) newFlipped.delete(id);
        else newFlipped.add(id);
        setFlippedCards(newFlipped);
        if (newFlipped.size === WAVEFORM_CONCEPTS.length) setAllRevealed(true);
    };

    const revealAll = () => {
        setFlippedCards(new Set(WAVEFORM_CONCEPTS.map(c => c.id)));
        setAllRevealed(true);
    };

    return (
        <div style={{ padding: '1.5rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #101218 0%, #16181f 100%)', borderRadius: '20px', padding: '2rem', marginBottom: '2rem', border: '1px solid #ffffff10' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ background: 'linear-gradient(135deg, #DCC892 0%, #DCC892 100%)', color: '#050507', padding: '0.5rem 1.25rem', borderRadius: '24px', fontSize: '0.75rem', fontWeight: '700', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Part 1</div>
                    <div style={{ fontSize: '0.7rem', color: '#DCC892', fontFamily: 'monospace', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Foundation Concepts</div>
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.75rem', color: '#f8f9fa' }}>Understanding Waveform Diagrams</h2>
                <p style={{ color: '#8b909a', maxWidth: '600px', fontSize: '1rem', lineHeight: '1.7' }}>
                    Before you can draw transposed waveforms, you need to understand what each axis represents.
                    <span style={{ color: '#DCC892' }}> Click each card</span> to reveal the key concepts.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {WAVEFORM_CONCEPTS.map(concept => (
                    <Flashcard key={concept.id} concept={concept} isFlipped={flippedCards.has(concept.id)} onFlip={() => toggleCard(concept.id)} />
                ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: '#101218', borderRadius: '16px', border: '1px solid #ffffff10' }}>
                <div>
                    <div style={{ fontSize: '0.7rem', color: '#4a4f5a', marginBottom: '0.25rem', fontFamily: 'monospace', textTransform: 'uppercase' }}>Cards Revealed</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#DCC892' }}>{flippedCards.size} / {WAVEFORM_CONCEPTS.length}</div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {!allRevealed && (
                        <button type="button" onClick={revealAll} style={{ padding: '0.875rem 1.5rem', background: 'transparent', border: '1px solid #ffffff15', borderRadius: '12px', color: '#8b909a', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }}>
                            Reveal All
                        </button>
                    )}
                    <button type="button" onClick={onComplete} style={{ padding: '0.875rem 1.5rem', background: allRevealed ? 'linear-gradient(135deg, #DCC892 0%, #DCC892 100%)' : '#16181f', border: 'none', borderRadius: '12px', color: allRevealed ? '#050507' : '#4a4f5a', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}>
                        Continue to Part 2 {allRevealed && '→'}
                    </button>
                </div>
            </div>

            <CopyableNote title="Waveform Axes - Key Definitions" color="#DCC892" variant="definition">
                <strong>WAVEFORM DIAGRAM AXES:</strong><br/><br/>
                • <strong>X-Axis (Horizontal):</strong> TIME - measured in milliseconds (ms) or seconds (s). Period is measured along this axis.<br/><br/>
                • <strong>Y-Axis (Vertical):</strong> AMPLITUDE - the strength of the signal. Determines LOUDNESS, not pitch.<br/><br/>
                <strong>CRITICAL RULE:</strong> Pitch changes affect the X-axis (time/period). Loudness changes affect the Y-axis (amplitude). They are independent!
            </CopyableNote>

            <CopyableNote title="Period and Frequency Relationship" color="#DCC892" variant="key">
                <strong>THE FUNDAMENTAL RELATIONSHIP:</strong><br/><br/>
                Period (T) = 1 / Frequency (f)<br/>
                Frequency (f) = 1 / Period (T)<br/><br/>
                • Higher frequency = shorter period = narrower cycles<br/>
                • Lower frequency = longer period = wider cycles<br/><br/>
                <strong>OCTAVE RELATIONSHIP:</strong><br/>
                • Octave UP = frequency x 2 = period / 2<br/>
                • Octave DOWN = frequency / 2 = period x 2
            </CopyableNote>
        </div>
    );
};

// ============================================
// PART 2: THE COMMON MISTAKE
// ============================================
const Part2Mistake = ({ onComplete }) => {
    const [showCorrect, setShowCorrect] = useState(false);

    return (
        <div style={{ padding: '1.5rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #101218 0%, #16181f 100%)', borderRadius: '20px', padding: '2rem', marginBottom: '2rem', border: '1px solid #ffffff10' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ background: '#ef4444', color: '#fff', padding: '0.5rem 1.25rem', borderRadius: '24px', fontSize: '0.75rem', fontWeight: '700', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Part 2</div>
                    <div style={{ fontSize: '0.7rem', color: '#ef4444', fontFamily: 'monospace', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Critical Warning</div>
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.75rem', color: '#f8f9fa' }}>The Common Mistake</h2>
                <p style={{ color: '#8b909a', maxWidth: '700px', fontSize: '1rem', lineHeight: '1.7' }}>
                    The 2023 examiner report noted that <strong style={{ color: '#ef4444' }}>"very few candidates"</strong> understood this correctly.
                    Most students make the same error.
                </p>
            </div>

            {/* The Mistake */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, #101218 100%)',
                borderRadius: '16px',
                padding: '2rem',
                marginBottom: '2rem',
                border: '2px solid #ef4444'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ef4444', margin: 0 }}>WRONG: "Lower = Down on the Page"</h3>
                        <p style={{ color: '#8b909a', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>This is what most students draw when asked for "one octave lower"</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
                    <div style={{ background: '#16181f', borderRadius: '12px', padding: '1rem' }}>
                        <div style={{ fontSize: '0.75rem', color: '#8b909a', marginBottom: '0.5rem', fontFamily: 'monospace' }}>Original</div>
                        <WaveformDisplay cycles={4} color="#8b909a" width={300} height={100} showCycleCount={false} />
                    </div>
                    <div style={{ background: '#16181f', borderRadius: '12px', padding: '1rem', position: 'relative' }}>
                        <div style={{ fontSize: '0.75rem', color: '#ef4444', marginBottom: '0.5rem', fontFamily: 'monospace' }}>Student's Answer (WRONG)</div>
                        {/* Shifted down waveform */}
                        <svg width="100%" viewBox="0 0 300 100" style={{ display: 'block' }}>
                            <rect width="300" height="100" fill="#050507" />
                            <line x1="0" y1="50" x2="300" y2="50" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                            {/* Same frequency but shifted down */}
                            <path
                                d="M 0 80 Q 18.75 60, 37.5 80 Q 56.25 100, 75 80 Q 93.75 60, 112.5 80 Q 131.25 100, 150 80 Q 168.75 60, 187.5 80 Q 206.25 100, 225 80 Q 243.75 60, 262.5 80 Q 281.25 100, 300 80"
                                fill="none"
                                stroke="#ef4444"
                                strokeWidth="3"
                            />
                        </svg>
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            right: '10px',
                            background: '#ef4444',
                            color: '#fff',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.65rem',
                            fontWeight: '700'
                        }}>
                            Same frequency!
                        </div>
                    </div>
                </div>

                <div style={{
                    background: 'rgba(239,68,68,0.2)',
                    padding: '1rem',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    color: '#fca5a5'
                }}>
                    <strong>Why this is wrong:</strong> Students confuse "lower pitch" with "lower position on the graph".
                    Moving the waveform DOWN on the Y-axis would represent <strong>quieter</strong>, not lower pitch!
                </div>
            </div>

            {/* The Correct Answer */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(34,197,94,0.1) 0%, #101218 100%)',
                borderRadius: '16px',
                padding: '2rem',
                marginBottom: '2rem',
                border: '2px solid #22c55e',
                opacity: showCorrect ? 1 : 0.4,
                transition: 'opacity 0.5s'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#22c55e', margin: 0 }}>CORRECT: "Lower = Wider Cycles"</h3>
                        <p style={{ color: '#8b909a', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>The waveform stretches HORIZONTALLY, not moves down</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
                    <div style={{ background: '#16181f', borderRadius: '12px', padding: '1rem' }}>
                        <div style={{ fontSize: '0.75rem', color: '#8b909a', marginBottom: '0.5rem', fontFamily: 'monospace' }}>Original (4 cycles)</div>
                        <WaveformDisplay cycles={4} color="#8b909a" width={300} height={100} />
                    </div>
                    <div style={{ background: '#16181f', borderRadius: '12px', padding: '1rem' }}>
                        <div style={{ fontSize: '0.75rem', color: '#22c55e', marginBottom: '0.5rem', fontFamily: 'monospace' }}>One Octave Lower (2 cycles)</div>
                        <WaveformDisplay cycles={2} color="#22c55e" width={300} height={100} />
                    </div>
                </div>

                <div style={{
                    background: 'rgba(34,197,94,0.2)',
                    padding: '1rem',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    color: '#86efac'
                }}>
                    <strong>Why this is correct:</strong> Octave lower = frequency halved = period doubled.
                    Each cycle takes <strong>twice as long</strong>, so only <strong>half as many cycles</strong> fit in the same time window.
                    The amplitude (height) stays the same!
                </div>
            </div>

            {!showCorrect && (
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <button type="button"
                        onClick={() => setShowCorrect(true)}
                        style={{
                            padding: '1rem 2rem',
                            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: '0 4px 20px rgba(34,197,94,0.3)'
                        }}
                    >
                        Show the Correct Answer
                    </button>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1.5rem', background: '#101218', borderRadius: '16px', border: '1px solid #ffffff10' }}>
                <button type="button" onClick={onComplete} style={{ padding: '0.875rem 1.75rem', background: showCorrect ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : '#16181f', border: 'none', borderRadius: '12px', color: showCorrect ? '#fff' : '#4a4f5a', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}>
                    Continue to Part 3: Interactive Examples →
                </button>
            </div>

            <CopyableNote title="The Common Mistake - Examiner Insight" color="#ef4444" variant="warning">
                <strong>EXAMINER REPORT (2023):</strong><br/><br/>
                "Very few candidates understood that when asked to draw a waveform one octave lower, the correct response is to double the period (stretch horizontally) while maintaining the same amplitude."<br/><br/>
                <strong>COMMON ERROR:</strong> Students shift the waveform DOWN on the Y-axis, thinking "lower pitch = lower position". This is WRONG.<br/><br/>
                <strong>CORRECT APPROACH:</strong> Lower pitch = lower frequency = longer period = WIDER cycles (horizontal stretch). The amplitude (height) stays the same.
            </CopyableNote>

            <CopyableNote title="Critical Rule for Waveform Drawing" color="#22c55e" variant="key">
                <strong>PITCH CHANGES = HORIZONTAL CHANGES</strong><br/><br/>
                • Lower pitch: Waveform stretches HORIZONTALLY (wider cycles)<br/>
                • Higher pitch: Waveform compresses HORIZONTALLY (narrower cycles)<br/><br/>
                <strong>LOUDNESS CHANGES = VERTICAL CHANGES</strong><br/><br/>
                • Quieter: Waveform gets shorter (lower amplitude)<br/>
                • Louder: Waveform gets taller (higher amplitude)<br/><br/>
                <strong>REMEMBER:</strong> Pitch and loudness are INDEPENDENT. Changing one does not affect the other!
            </CopyableNote>
        </div>
    );
};

// ============================================
// PART 3: INTERACTIVE EXPLORATION
// ============================================
const Part3Explore = () => {
    const [originalCycles, setOriginalCycles] = useState(4);
    const [octaveShift, setOctaveShift] = useState(-1); // -2, -1, 0, +1, +2

    const getTransposedCycles = () => {
        if (octaveShift === 0) return originalCycles;
        if (octaveShift > 0) return originalCycles * Math.pow(2, octaveShift);
        return originalCycles / Math.pow(2, Math.abs(octaveShift));
    };

    const transposedCycles = getTransposedCycles();

    const octaveDescriptions = {
        '-2': { label: '2 Octaves Lower', color: '#DCC892', explanation: 'Frequency ÷ 4, Period × 4' },
        '-1': { label: '1 Octave Lower', color: '#22c55e', explanation: 'Frequency ÷ 2, Period × 2' },
        '0': { label: 'Original', color: '#8b909a', explanation: 'No change' },
        '1': { label: '1 Octave Higher', color: '#DCC892', explanation: 'Frequency × 2, Period ÷ 2' },
        '2': { label: '2 Octaves Higher', color: '#ef4444', explanation: 'Frequency × 4, Period ÷ 4' }
    };

    const currentDesc = octaveDescriptions[octaveShift.toString()];

    return (
        <div style={{ padding: '1.5rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #101218 0%, #16181f 100%)', borderRadius: '20px', padding: '2rem', marginBottom: '2rem', border: '1px solid #ffffff10' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ background: 'linear-gradient(135deg, #DCC892 0%, #DCC892 100%)', color: '#050507', padding: '0.5rem 1.25rem', borderRadius: '24px', fontSize: '0.75rem', fontWeight: '700', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Part 3</div>
                    <div style={{ fontSize: '0.7rem', color: '#DCC892', fontFamily: 'monospace', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Interactive Exploration</div>
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.75rem', color: '#f8f9fa' }}>See the Relationship</h2>
                <p style={{ color: '#8b909a', maxWidth: '700px', fontSize: '1rem', lineHeight: '1.7' }}>
                    Adjust the controls to see how octave transposition affects the waveform.
                    <span style={{ color: '#DCC892' }}> Count the cycles</span> and observe how they change.
                </p>
            </div>

            {/* Controls */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ background: '#101218', borderRadius: '14px', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <span style={{ color: '#8b909a', fontSize: '0.9rem' }}>Original Cycles</span>
                        <span style={{ color: '#DCC892', fontFamily: 'monospace', fontWeight: '600', fontSize: '1.25rem' }}>{originalCycles}</span>
                    </div>
                    <input aria-label="Slider"
                        type="range"
                        min={2}
                        max={8}
                        value={originalCycles}
                        onChange={(e) => setOriginalCycles(Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#DCC892' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.7rem', color: '#4a4f5a' }}>
                        <span>2</span>
                        <span>8</span>
                    </div>
                </div>

                <div style={{ background: '#101218', borderRadius: '14px', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <span style={{ color: '#8b909a', fontSize: '0.9rem' }}>Transposition</span>
                        <span style={{ color: currentDesc.color, fontFamily: 'monospace', fontWeight: '600', fontSize: '1rem' }}>{currentDesc.label}</span>
                    </div>
                    <input aria-label="Slider"
                        type="range"
                        min={-2}
                        max={2}
                        value={octaveShift}
                        onChange={(e) => setOctaveShift(Number(e.target.value))}
                        style={{ width: '100%', accentColor: currentDesc.color }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.7rem', color: '#4a4f5a' }}>
                        <span>-2 Oct</span>
                        <span>Original</span>
                        <span>+2 Oct</span>
                    </div>
                </div>
            </div>

            {/* Waveform Comparison */}
            <div style={{ background: '#101218', borderRadius: '16px', padding: '2rem', marginBottom: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '1rem', fontWeight: '600', color: '#8b909a' }}>Original</span>
                            <span style={{
                                background: 'rgba(139,144,154,0.2)',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '8px',
                                fontFamily: 'monospace',
                                fontSize: '0.9rem',
                                color: '#c9cdd4'
                            }}>
                                {originalCycles} cycles
                            </span>
                        </div>
                        <WaveformDisplay cycles={originalCycles} color="#8b909a" width={350} height={140} showCycleCount={false} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '1rem', fontWeight: '600', color: currentDesc.color }}>{currentDesc.label}</span>
                            <span style={{
                                background: `${currentDesc.color}30`,
                                padding: '0.25rem 0.75rem',
                                borderRadius: '8px',
                                fontFamily: 'monospace',
                                fontSize: '0.9rem',
                                color: currentDesc.color
                            }}>
                                {transposedCycles} cycles
                            </span>
                        </div>
                        <WaveformDisplay cycles={transposedCycles} color={currentDesc.color} width={350} height={140} showCycleCount={false} />
                    </div>
                </div>

                {/* Explanation */}
                <div style={{
                    marginTop: '2rem',
                    padding: '1.5rem',
                    background: `${currentDesc.color}15`,
                    borderRadius: '12px',
                    border: `1px solid ${currentDesc.color}40`
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: currentDesc.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#050507',
                            fontWeight: '700',
                            fontFamily: 'monospace'
                        }}>
                            {octaveShift > 0 ? '+' : ''}{octaveShift}
                        </div>
                        <div>
                            <div style={{ fontWeight: '600', color: '#f8f9fa', marginBottom: '0.25rem' }}>{currentDesc.explanation}</div>
                            <div style={{ fontSize: '0.85rem', color: '#8b909a' }}>
                                {originalCycles} cycles → {transposedCycles} cycles in the same time window
                            </div>
                        </div>
                    </div>

                    {octaveShift !== 0 && (
                        <div style={{ fontSize: '0.9rem', color: '#c9cdd4', lineHeight: '1.6' }}>
                            {octaveShift < 0 ? (
                                <>
                                    <strong>Lower pitch</strong> means <strong>lower frequency</strong> (fewer cycles per second).
                                    Since period = 1/frequency, the period <strong>increases</strong> (each cycle takes longer).
                                    The waveform stretches <strong>horizontally</strong> - cycles are <strong>wider</strong>.
                                </>
                            ) : (
                                <>
                                    <strong>Higher pitch</strong> means <strong>higher frequency</strong> (more cycles per second).
                                    Since period = 1/frequency, the period <strong>decreases</strong> (each cycle is shorter).
                                    The waveform compresses <strong>horizontally</strong> - cycles are <strong>narrower</strong>.
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Reference Table */}
            <div style={{ background: '#101218', borderRadius: '16px', padding: '2rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#f8f9fa', marginBottom: '1.5rem' }}>Quick Reference: Octave Transformations</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #ffffff15' }}>
                                <th style={{ padding: '0.75rem', textAlign: 'left', color: '#8b909a', fontWeight: '600' }}>Transposition</th>
                                <th style={{ padding: '0.75rem', textAlign: 'center', color: '#8b909a', fontWeight: '600' }}>Frequency</th>
                                <th style={{ padding: '0.75rem', textAlign: 'center', color: '#8b909a', fontWeight: '600' }}>Period</th>
                                <th style={{ padding: '0.75rem', textAlign: 'center', color: '#8b909a', fontWeight: '600' }}>Cycles in Same Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { shift: '2 Octaves Lower', freq: '÷ 4', period: '× 4', cycles: '÷ 4', color: '#DCC892' },
                                { shift: '1 Octave Lower', freq: '÷ 2', period: '× 2', cycles: '÷ 2', color: '#22c55e' },
                                { shift: 'Original', freq: '—', period: '—', cycles: '—', color: '#8b909a' },
                                { shift: '1 Octave Higher', freq: '× 2', period: '÷ 2', cycles: '× 2', color: '#DCC892' },
                                { shift: '2 Octaves Higher', freq: '× 4', period: '÷ 4', cycles: '× 4', color: '#ef4444' },
                            ].map((row, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #ffffff08' }}>
                                    <td style={{ padding: '0.75rem', color: row.color, fontWeight: '500' }}>{row.shift}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center', color: '#c9cdd4', fontFamily: 'monospace' }}>{row.freq}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center', color: '#c9cdd4', fontFamily: 'monospace' }}>{row.period}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center', color: '#c9cdd4', fontFamily: 'monospace' }}>{row.cycles}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <CopyableNote title="Octave Transformation Rules" color="#DCC892" variant="key">
                <strong>OCTAVE RELATIONSHIPS:</strong><br/><br/>
                <strong>1 OCTAVE LOWER:</strong><br/>
                • Frequency ÷ 2 (halved)<br/>
                • Period × 2 (doubled)<br/>
                • Half as many cycles in the same time<br/><br/>
                <strong>1 OCTAVE HIGHER:</strong><br/>
                • Frequency × 2 (doubled)<br/>
                • Period ÷ 2 (halved)<br/>
                • Twice as many cycles in the same time<br/><br/>
                <strong>2 OCTAVES:</strong> Apply the rule twice (×4 or ÷4)
            </CopyableNote>
        </div>
    );
};

// ============================================
// MAIN APP
// ============================================
export default function OctavePeriodTrainer() {
    const [currentPart, setCurrentPart] = useState(1);
    const [visitedParts, setVisitedParts] = useState(new Set([1]));

    const goToPart = (part) => {
        setCurrentPart(part);
        setVisitedParts(prev => new Set([...prev, part]));
    };

    const partColors = { 1: '#DCC892', 2: '#ef4444', 3: '#DCC892' };
    const partNames = { 1: 'Foundations', 2: 'The Mistake', 3: 'Explore' };

    return (
        <div style={{ minHeight: '100vh', background: '#050507', color: '#c9cdd4', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
            {/* Header */}
            <header style={{ background: 'linear-gradient(180deg, #101218 0%, #0a0b0f 100%)', borderBottom: '1px solid #ffffff10', position: 'sticky', top: 0, zIndex: 100 }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '0.9rem', fontWeight: '400', letterSpacing: '0.15em', color: '#8b909a', textTransform: 'uppercase', margin: 0 }}>
                            <span style={{ color: '#DCC892', fontWeight: '600' }}>Octave</span> = Double the <span style={{ color: '#DCC892', fontWeight: '600' }}>Period</span>
                        </h1>
                        <div style={{ fontSize: '0.65rem', color: '#4a4f5a', fontFamily: 'monospace', marginTop: '0.25rem' }}>
                            A-Level Music Technology | 2.5 Numeracy
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {[1, 2, 3].map(part => (
                            <button type="button"
                                key={part}
                                onClick={() => goToPart(part)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: currentPart === part ? partColors[part] : 'transparent',
                                    border: `1px solid ${currentPart === part ? 'transparent' : visitedParts.has(part) ? 'rgba(255,200,100,0.15)' : '#ffffff10'}`,
                                    borderRadius: '8px',
                                    color: currentPart === part ? '#050507' : visitedParts.has(part) ? '#c9cdd4' : '#4a4f5a',
                                    cursor: 'pointer',
                                    fontFamily: 'monospace',
                                    fontSize: '0.75rem',
                                    fontWeight: '600'
                                }}
                            >
                                {partNames[part]}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Hero with video background */}
            <div style={{
                position: 'relative',
                overflow: 'hidden',
                width: '100vw',
                marginLeft: 'calc(-50vw + 50%)',
                marginBottom: '1rem',
                minHeight: '240px',
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
                        opacity: 0,
                        transition: 'opacity 0.8s ease-out',
                    }}
                    src="/numeracy-hero.mp4"
                />
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to bottom, rgba(5,5,7,0.4) 0%, rgba(5,5,7,0.7) 100%)',
                }} />
                <div style={{
                    position: 'relative',
                    maxWidth: '640px', margin: '0 auto',
                    padding: '3rem 1.5rem 2.5rem',
                    textAlign: 'center',
                }}>
                    <h2 style={{
                        fontSize: '2.25rem',
                        fontWeight: '700',
                        color: '#ffffff',
                        lineHeight: 1.15,
                        marginBottom: '1rem',
                        textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}>
                        Octave Period Trainer
                    </h2>
                    <p style={{
                        color: 'rgba(255,255,255,0.85)',
                        fontSize: '1.1rem',
                        lineHeight: 1.6,
                        maxWidth: '480px', margin: '0 auto',
                    }}>
                        Explore the mathematical relationship between frequency and period
                    </p>
                </div>
            </div>

            {/* Content */}
            <main style={{ maxWidth: '1100px', margin: '0 auto' }}>
                {currentPart === 1 && <Part1Foundations onComplete={() => goToPart(2)} />}
                {currentPart === 2 && <Part2Mistake onComplete={() => goToPart(3)} />}
                {currentPart === 3 && <Part3Explore />}
            </main>

            {/* Footer */}
            <footer style={{ background: '#0a0b0f', borderTop: '1px solid #ffffff10', padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#4a4f5a' }}>
                    A-Level Music Technology | Component 4: Producing and Analysing | 2.5 Numeracy
                </div>
            </footer>
        </div>
    );
}
