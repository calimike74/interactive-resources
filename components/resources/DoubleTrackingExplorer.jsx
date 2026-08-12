import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';

// ============================================
// DOUBLE TRACKING vs COPYING EXPLORER
// A* Extension for 1.4 Sampling
// ============================================

// Quiz question bank
const QUIZ_QUESTIONS = {
    easy: [
        {
            type: 'multiple_choice',
            question: 'What does ADT stand for?',
            options: ['Audio Digital Transfer', 'Automatic Double Tracking', 'Advanced Delay Technology', 'Audio Delay Timing'],
            correct: 1,
            explanation: 'ADT = Automatic Double Tracking, invented at Abbey Road Studios in 1966.'
        },
        {
            type: 'multiple_choice',
            question: 'What happens when you copy a track and layer it?',
            options: ['Creates double tracking effect', 'Makes it sound wider', 'Only increases the level', 'Adds stereo width'],
            correct: 2,
            explanation: 'Identical waveforms sum together (constructive interference), only making it louder - NOT creating double tracking.'
        },
        {
            type: 'multiple_choice',
            question: 'True double tracking requires recording the same part how many times?',
            options: ['Once with effects', 'Twice (two separate takes)', 'Three times minimum', 'It depends on the BPM'],
            correct: 1,
            explanation: 'True double tracking means recording the same part twice - the natural timing/pitch variations create the effect.'
        },
        {
            type: 'true_false',
            question: 'Copying a vocal track creates the characteristic "thickness" of double tracking.',
            correct: false,
            explanation: 'FALSE - Copying creates identical waveforms that simply add together, increasing level but NOT creating thickness.'
        },
    ],
    medium: [
        {
            type: 'multiple_choice',
            question: 'What delay range does ADT typically use?',
            options: ['1-5ms', '10-40ms', '50-100ms', '100-200ms'],
            correct: 1,
            explanation: 'ADT uses 10-40ms delay - short enough to fuse with the original (Haas Effect) but long enough to create variation.'
        },
        {
            type: 'multiple_choice',
            question: 'Why is the 30-40ms threshold important for ADT?',
            options: ['It matches the BPM', 'Below this, sounds fuse rather than echo', 'It prevents feedback', 'It matches human reaction time'],
            correct: 1,
            explanation: 'The Haas Effect: sounds arriving within 30-40ms are perceived as one fused image, not separate echoes.'
        },
        {
            type: 'multiple_choice',
            question: 'What pitch variation range does ADT typically use?',
            options: ['1-2 cents', '5-20 cents', '50-100 cents', '100+ cents (semitone)'],
            correct: 1,
            explanation: 'ADT uses subtle pitch modulation of plus/minus 5-20 cents - enough to create variation without obvious detuning.'
        },
        {
            type: 'fill_blank',
            question: 'ADT was invented to save _____ from having to sing parts twice.',
            correct: ['john lennon', 'lennon', 'john'],
            explanation: 'Ken Townsend at Abbey Road invented ADT in 1966 because John Lennon found double tracking tedious.'
        },
    ],
    hard: [
        {
            type: 'identify_answer',
            question: 'Which answer would score marks for "How would you create a double-tracked vocal?"',
            options: [
                'Copy the vocal track and layer them together',
                'Record the vocal twice, keeping both takes for natural timing variation',
            ],
            correct: 1,
            explanation: 'The first answer is the zero-marks response flagged in examiner reports (2022-2024). Simply copying creates no variation.'
        },
        {
            type: 'multiple_choice',
            question: 'When identical waveforms combine, what phenomenon occurs?',
            options: ['Destructive interference', 'Constructive interference', 'Phase cancellation', 'Frequency masking'],
            correct: 1,
            explanation: 'Identical waveforms combine through constructive interference, adding their amplitudes (+3 to +6dB) without creating thickness.'
        },
        {
            type: 'multiple_choice',
            question: 'What TWO elements must vary between signals to create the double-tracking effect?',
            options: ['Level and panning', 'Timing and pitch', 'EQ and compression', 'Reverb and delay'],
            correct: 1,
            explanation: 'Timing variation (delay) and pitch variation (modulation) are the two essential elements that distinguish a second performance.'
        },
        {
            type: 'identify_answer',
            question: 'Which describes how ADT works?',
            options: [
                'ADT uses delay to create the double tracking effect.',
                'ADT processes a single take with short delay (10-40ms) and subtle pitch modulation (plus/minus 5-20 cents) to simulate the natural variations of a second performance.',
            ],
            correct: 1,
            explanation: 'The first answer is too vague for full marks. The second demonstrates understanding of BOTH parameters and WHY they work.'
        },
    ]
};

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
            marginTop: '1.5rem'
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
// WAVEFORM DISPLAY COMPONENT
// ============================================
const WaveformDisplay = ({ cycles, color, label, width = 300, height = 100, showCycleCount = true, offset = 0, freqMod = 0 }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

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
            const t = progress * cycles * 2 * Math.PI + offset;
            const y = midY - Math.sin(t * (1 + freqMod)) * amplitude;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

    }, [cycles, color, width, height, offset, freqMod]);

    return (
        <div style={{ position: 'relative' }}>
            {label && (
                <div style={{
                    marginBottom: '0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: color,
                    fontFamily: 'monospace'
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
                    fontSize: '0.7rem',
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
// PART 1: THE COMMON MISTAKE
// ============================================
const MistakeSection = ({ onComplete }) => {
    const [showCorrect, setShowCorrect] = useState(false);

    return (
        <div style={{ padding: '1.5rem' }}>
            {/* Examiner Warning */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, #101218 100%)',
                borderRadius: '16px',
                padding: '1.5rem',
                marginBottom: '2rem',
                border: '1px solid rgba(239, 68, 68, 0.3)'
            }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <AlertTriangle size={28} strokeWidth={1.75} color="#ef4444" aria-hidden="true" />
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ef4444', margin: '0 0 0.5rem 0' }}>
                            EXAMINER WARNING (2022-2024)
                        </h3>
                        <blockquote style={{
                            margin: '0 0 1rem 0',
                            padding: '0.75rem 1rem',
                            background: 'rgba(0,0,0,0.3)',
                            borderLeft: '3px solid #ef4444',
                            borderRadius: '0 8px 8px 0',
                            fontStyle: 'italic',
                            color: '#fca5a5'
                        }}>
                            "Merely copying vocal to another track just adds level - doesn't sound like separate vocal."
                        </blockquote>
                        <p style={{ margin: '0', color: '#c9cdd4', fontSize: '0.9rem', lineHeight: '1.6' }}>
                            This error has appeared in examiner reports for <strong style={{ color: '#f8f9fa' }}>three consecutive years</strong>.
                        </p>
                    </div>
                </div>
            </div>

            {/* The Wrong Answer */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, #101218 100%)',
                borderRadius: '16px',
                padding: '2rem',
                marginBottom: '2rem',
                border: '2px solid #ef4444'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ef4444', margin: 0 }}>WRONG: "Just copy the track"</h3>
                        <p style={{ color: '#8b909a', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>This is what students write - and lose marks every year</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
                    <div style={{ background: '#16181f', borderRadius: '12px', padding: '1rem' }}>
                        <WaveformDisplay cycles={4} color="#8b909a" label="Original Vocal" width={280} height={90} showCycleCount={false} />
                    </div>
                    <div style={{ background: '#16181f', borderRadius: '12px', padding: '1rem', position: 'relative' }}>
                        <WaveformDisplay cycles={4} color="#ef4444" label="Copied (IDENTICAL)" width={280} height={90} showCycleCount={false} />
                        <div style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            background: '#ef4444',
                            color: '#fff',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.65rem',
                            fontWeight: '700'
                        }}>
                            Same waveform!
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
                    <strong>Why this fails:</strong> Identical waveforms = constructive interference = just LOUDER (+3-6dB).
                    No timing variation. No pitch variation. Sounds like ONE louder voice, not TWO voices.
                </div>
            </div>

            {/* The Correct Answer */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(34,197,94,0.1) 0%, #101218 100%)',
                borderRadius: '16px',
                padding: '2rem',
                marginBottom: '2rem',
                border: '2px solid #22c55e',
                filter: showCorrect ? 'none' : 'blur(6px)',
                transition: 'filter 0.5s'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '2.5rem' }}>✓</span>
                    <div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#22c55e', margin: 0 }}>CORRECT: Timing + Pitch Variation</h3>
                        <p style={{ color: '#8b909a', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>The waveforms must be DIFFERENT - either naturally or via ADT</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
                    <div style={{ background: '#16181f', borderRadius: '12px', padding: '1rem' }}>
                        <WaveformDisplay cycles={4} color="#DCC892" label="Original Take" width={280} height={90} showCycleCount={false} />
                    </div>
                    <div style={{ background: '#16181f', borderRadius: '12px', padding: '1rem' }}>
                        <WaveformDisplay cycles={4} color="#DCC892" label="Second Take (VARIED)" width={280} height={90} showCycleCount={false} offset={0.5} freqMod={0.03} />
                    </div>
                </div>

                <div style={{
                    background: 'rgba(34,197,94,0.2)',
                    padding: '1rem',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    color: '#86efac'
                }}>
                    <strong>Why this works:</strong> Natural timing variations (5-20ms) + pitch variations (5-20 cents) create
                    the chorus-like thickening effect. The brain perceives TWO performances.
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

            {/* Three Approaches Comparison */}
            <div style={{ background: '#101218', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', color: '#f8f9fa', marginBottom: '1rem' }}>Three Approaches Compared</h4>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.15)' }}>
                                <th style={{ padding: '0.75rem', textAlign: 'left', color: '#c9cdd4' }}>Approach</th>
                                <th style={{ padding: '0.75rem', textAlign: 'center', color: '#c9cdd4' }}>Works?</th>
                                <th style={{ padding: '0.75rem', textAlign: 'left', color: '#c9cdd4' }}>Why?</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '0.75rem', color: '#f8f9fa' }}>True Double (2 takes)</td>
                                <td style={{ padding: '0.75rem', textAlign: 'center', color: '#22c55e', fontSize: '1.1rem' }}>✓</td>
                                <td style={{ padding: '0.75rem', color: '#8b909a' }}>Natural timing/pitch variation</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '0.75rem', color: '#f8f9fa' }}>ADT (processed)</td>
                                <td style={{ padding: '0.75rem', textAlign: 'center', color: '#22c55e', fontSize: '1.1rem' }}>✓</td>
                                <td style={{ padding: '0.75rem', color: '#8b909a' }}>Artificial timing/pitch variation</td>
                            </tr>
                            <tr style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                                <td style={{ padding: '0.75rem', color: '#ef4444', fontWeight: '600' }}>Copying</td>
                                <td style={{ padding: '0.75rem', textAlign: 'center', color: '#ef4444', fontSize: '1.1rem' }}>✗</td>
                                <td style={{ padding: '0.75rem', color: '#fca5a5' }}>Identical = louder only</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Copyable Notes */}
            <CopyableNote title="The Common Mistake - Why Copying Fails" color="#ef4444" variant="warning">
                <strong>COPYING DOES NOT CREATE DOUBLE TRACKING</strong><br/><br/>
                When you copy a track and layer it:<br/>
                • Every sample is IDENTICAL<br/>
                • Identical waveforms = constructive interference<br/>
                • Result: +3 to +6dB louder, but sounds like ONE voice<br/><br/>
                <strong>EXAMINER QUOTE (2022-2024):</strong><br/>
                "Merely copying vocal to another track just adds level - doesn't sound like separate vocal."
            </CopyableNote>

            <CopyableNote title="What Makes Double Tracking Work" color="#22c55e" variant="key">
                <strong>TWO ELEMENTS MUST VARY:</strong><br/><br/>
                1. <strong>TIMING VARIATION</strong> (5-20ms difference)<br/>
                   - Creates width and space<br/>
                   - Falls within Haas Effect threshold (under 40ms)<br/><br/>
                2. <strong>PITCH VARIATION</strong> (5-20 cents difference)<br/>
                   - Creates chorus-like thickening<br/>
                   - Below perception threshold for detuning<br/><br/>
                These variations make the brain perceive TWO separate performances.
            </CopyableNote>
        </div>
    );
};

// ============================================
// PART 2: ADT EXPLORER
// ============================================
const ExploreSection = () => {
    const canvasRef = useRef(null);
    const [delayMs, setDelayMs] = useState(25);
    const [pitchCents, setPitchCents] = useState(12);
    const [isAnimating, setIsAnimating] = useState(true);
    const animationRef = useRef(null);
    const phaseRef = useRef(0);

    // Respect prefers-reduced-motion on first mount
    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setIsAnimating(false);
    }, []);

    const width = 550;
    const height = 220;
    const padding = 40;

    const draw = useCallback((phase) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const innerWidth = width - padding * 2;
        const midY = height / 2;
        const amplitude = 60;

        ctx.fillStyle = '#050507';
        ctx.fillRect(0, 0, width, height);

        // Centre line
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, midY);
        ctx.lineTo(width - padding, midY);
        ctx.stroke();

        const timingOffset = Math.max(0, ((delayMs - 10) / 30) * 0.15 + 0.02);
        const freqMod = ((pitchCents - 5) / 15) * 0.03 + 0.01;

        // Original waveform
        ctx.strokeStyle = '#DCC892';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#DCC892';
        ctx.shadowBlur = 6;
        ctx.beginPath();

        for (let i = 0; i <= innerWidth; i++) {
            const x = padding + i;
            const t = (i / innerWidth) * 4 * Math.PI + phase;
            const y = midY - Math.sin(t) * amplitude * 0.8;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // ADT processed waveform
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 6;
        ctx.beginPath();

        for (let i = 0; i <= innerWidth; i++) {
            const x = padding + i;
            const t = (i / innerWidth) * 4 * Math.PI + phase + timingOffset * Math.PI * 2;
            const y = midY - Math.sin(t * (1 + freqMod)) * amplitude * 0.8;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Legend
        ctx.font = '11px monospace';
        ctx.fillStyle = '#DCC892';
        ctx.textAlign = 'left';
        ctx.fillText('Original', padding, 25);
        ctx.fillStyle = '#22c55e';
        ctx.fillText('ADT Processed', padding + 80, 25);

    }, [delayMs, pitchCents]);

    useEffect(() => {
        const animate = () => {
            phaseRef.current += 0.02;
            draw(phaseRef.current);

            if (isAnimating) {
                animationRef.current = requestAnimationFrame(animate);
            }
        };

        if (isAnimating) {
            animationRef.current = requestAnimationFrame(animate);
        } else {
            draw(phaseRef.current);
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isAnimating, draw]);

    const inHaasZone = delayMs <= 40;

    return (
        <div style={{ padding: '1.5rem' }}>
            {/* ADT Intro */}
            <div style={{ background: 'linear-gradient(135deg, #101218 0%, #16181f 100%)', borderRadius: '20px', padding: '2rem', marginBottom: '2rem', border: '1px solid #ffffff10' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ background: 'linear-gradient(135deg, #DCC892 0%, #DCC892 100%)', color: '#050507', padding: '0.5rem 1.25rem', borderRadius: '24px', fontSize: '0.75rem', fontWeight: '700', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>ADT</div>
                    <div style={{ fontSize: '0.7rem', color: '#DCC892', fontFamily: 'monospace', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Automatic Double Tracking</div>
                </div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.75rem', color: '#f8f9fa' }}>Explore the Parameters</h2>
                <p style={{ color: '#8b909a', maxWidth: '700px', fontSize: '1rem', lineHeight: '1.7' }}>
                    ADT was invented at <strong style={{ color: '#f8f9fa' }}>Abbey Road Studios in 1966</strong> to save John Lennon from
                    re-singing. Adjust the controls to see how <span style={{ color: '#DCC892' }}>delay</span> and <span style={{ color: '#DCC892' }}>pitch modulation</span> create the effect.
                </p>
            </div>

            {/* Canvas */}
            <div style={{ background: '#101218', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <canvas
                        ref={canvasRef}
                        width={width}
                        height={height}
                        role="img"
                        aria-label="Animated waveform comparison: Original signal (gold) and ADT-processed signal (green) showing adjustable delay and pitch modulation."
                        style={{
                            maxWidth: '100%',
                            height: 'auto',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}
                    />
                </div>

                {/* Controls */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ background: '#16181f', borderRadius: '12px', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <span style={{ color: '#DCC892', fontSize: '0.8rem', fontWeight: '600' }}>Delay Time</span>
                            <span style={{ color: '#DCC892', fontFamily: 'monospace', fontWeight: '700', fontSize: '1.1rem' }}>{delayMs}ms</span>
                        </div>
                        <input aria-label="Delay Time in milliseconds"
                            type="range"
                            min="5"
                            max="80"
                            value={delayMs}
                            onChange={(e) => setDelayMs(parseInt(e.target.value))}
                            style={{ width: '100%', accentColor: '#DCC892' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.7rem', color: '#4a4f5a' }}>
                            <span>5ms</span>
                            <span style={{ color: inHaasZone ? '#22c55e' : '#ef4444' }}>
                                {inHaasZone ? 'Haas Zone (fusion)' : 'Echo zone'}
                            </span>
                            <span>80ms</span>
                        </div>
                    </div>

                    <div style={{ background: '#16181f', borderRadius: '12px', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <span style={{ color: '#DCC892', fontSize: '0.8rem', fontWeight: '600' }}>Pitch Modulation</span>
                            <span style={{ color: '#DCC892', fontFamily: 'monospace', fontWeight: '700', fontSize: '1.1rem' }}>+/-{pitchCents}c</span>
                        </div>
                        <input aria-label="Pitch Modulation in cents"
                            type="range"
                            min="0"
                            max="30"
                            value={pitchCents}
                            onChange={(e) => setPitchCents(parseInt(e.target.value))}
                            style={{ width: '100%', accentColor: '#DCC892' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.7rem', color: '#4a4f5a' }}>
                            <span>0c</span>
                            <span style={{ color: pitchCents >= 5 && pitchCents <= 20 ? '#22c55e' : '#DCC892' }}>
                                {pitchCents < 5 ? 'Too subtle' : pitchCents > 20 ? 'Noticeable' : 'Sweet spot'}
                            </span>
                            <span>30c</span>
                        </div>
                    </div>
                </div>

                {/* Haas Zone Indicator */}
                <div style={{
                    padding: '1rem',
                    background: inHaasZone ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '10px',
                    border: `1px solid ${inHaasZone ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    marginBottom: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>{inHaasZone ? '✓' : '!'}</span>
                        <div>
                            <div style={{ fontWeight: '600', color: inHaasZone ? '#22c55e' : '#ef4444', fontSize: '0.95rem' }}>
                                {inHaasZone ? 'Haas Effect Zone - Sounds Fuse' : 'Outside Haas Zone - Distinct Echo'}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#8b909a' }}>
                                {inHaasZone
                                    ? 'Delays under ~40ms fuse into one thickened sound.'
                                    : 'Delays over ~40ms are heard as separate echoes.'}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button type="button"
                        onClick={() => setIsAnimating(!isAnimating)}
                        style={{
                            padding: '0.5rem 1.25rem',
                            background: isAnimating ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                            border: `1px solid ${isAnimating ? '#ef4444' : '#22c55e'}`,
                            borderRadius: '8px',
                            color: isAnimating ? '#ef4444' : '#22c55e',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            fontFamily: 'monospace'
                        }}
                    >
                        {isAnimating ? 'Pause' : 'Play'}
                    </button>
                </div>
            </div>

            {/* ADT Parameters Reference */}
            <div style={{ background: '#101218', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', color: '#f8f9fa', marginBottom: '1rem' }}>ADT Parameters Reference</h4>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.15)' }}>
                                <th style={{ padding: '0.75rem', textAlign: 'left', color: '#c9cdd4' }}>Parameter</th>
                                <th style={{ padding: '0.75rem', textAlign: 'center', color: '#c9cdd4' }}>Range</th>
                                <th style={{ padding: '0.75rem', textAlign: 'left', color: '#c9cdd4' }}>Purpose</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '0.75rem', color: '#DCC892', fontFamily: 'monospace' }}>Delay</td>
                                <td style={{ padding: '0.75rem', textAlign: 'center', color: '#f8f9fa', fontFamily: 'monospace' }}>10-40ms</td>
                                <td style={{ padding: '0.75rem', color: '#8b909a' }}>Timing variation (below Haas threshold)</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '0.75rem', color: '#DCC892', fontFamily: 'monospace' }}>Pitch Mod</td>
                                <td style={{ padding: '0.75rem', textAlign: 'center', color: '#f8f9fa', fontFamily: 'monospace' }}>+/-5-20c</td>
                                <td style={{ padding: '0.75rem', color: '#8b909a' }}>Pitch variation via LFO modulation</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Copyable Notes */}
            <CopyableNote title="ADT - How It Works" color="#DCC892" variant="definition">
                <strong>AUTOMATIC DOUBLE TRACKING (ADT)</strong><br/><br/>
                <strong>Invented:</strong> Abbey Road Studios, 1966 (Ken Townsend)<br/>
                <strong>Purpose:</strong> Simulate double tracking from a single take<br/><br/>
                <strong>SIGNAL PATH:</strong><br/>
                Original signal → Short delay (10-40ms) + Pitch modulation (+/-5-20 cents) → Mix with original<br/><br/>
                <strong>WHY IT WORKS:</strong><br/>
                • Delay creates timing variation (simulates imperfect timing)<br/>
                • Pitch mod creates pitch variation (simulates imperfect pitch)<br/>
                • Result sounds like two separate performances
            </CopyableNote>

            <CopyableNote title="The Haas Effect" color="#DCC892" variant="key">
                <strong>HAAS EFFECT (PRECEDENCE EFFECT)</strong><br/><br/>
                Sounds arriving within 30-40ms are perceived as ONE fused sound, not separate echoes.<br/><br/>
                <strong>FOR ADT:</strong><br/>
                • Delay UNDER 40ms: Sounds fuse = thickening effect<br/>
                • Delay OVER 40ms: Sounds separate = distinct echo<br/><br/>
                ADT exploits this by keeping delay just below the threshold - creating width and thickness without obvious echo.
            </CopyableNote>
        </div>
    );
};

// ============================================
// QUIZ COMPONENT
// ============================================
const Quiz = () => {
    const [difficulty, setDifficulty] = useState('easy');
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [userInput, setUserInput] = useState('');
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState({ correct: 0, total: 0 });

    const getNewQuestion = useCallback(() => {
        const questions = QUIZ_QUESTIONS[difficulty];
        const q = questions[Math.floor(Math.random() * questions.length)];
        setCurrentQuestion(q);
        setSelectedAnswer(null);
        setUserInput('');
        setShowResult(false);
    }, [difficulty]);

    useEffect(() => {
        getNewQuestion();
    }, [difficulty, getNewQuestion]);

    const checkAnswer = () => {
        if (currentQuestion.type === 'fill_blank' && !userInput.trim()) return;
        if ((currentQuestion.type === 'multiple_choice' || currentQuestion.type === 'identify_answer') && selectedAnswer === null) return;
        if (currentQuestion.type === 'true_false' && selectedAnswer === null) return;

        let correct = false;

        if (currentQuestion.type === 'fill_blank') {
            correct = currentQuestion.correct.some(ans =>
                userInput.toLowerCase().trim().includes(ans.toLowerCase())
            );
        } else if (currentQuestion.type === 'true_false') {
            correct = selectedAnswer === currentQuestion.correct;
        } else {
            correct = selectedAnswer === currentQuestion.correct;
        }

        setShowResult(true);
        setScore(prev => ({
            correct: prev.correct + (correct ? 1 : 0),
            total: prev.total + 1
        }));
    };

    const isCorrect = () => {
        if (!currentQuestion) return false;

        if (currentQuestion.type === 'fill_blank') {
            return currentQuestion.correct.some(ans =>
                userInput.toLowerCase().trim().includes(ans.toLowerCase())
            );
        } else if (currentQuestion.type === 'true_false') {
            return selectedAnswer === currentQuestion.correct;
        } else {
            return selectedAnswer === currentQuestion.correct;
        }
    };

    const renderQuestion = () => {
        if (!currentQuestion) return null;

        switch (currentQuestion.type) {
            case 'multiple_choice':
            case 'identify_answer':
                return (
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                        {currentQuestion.options.map((option, idx) => (
                            <button type="button"
                                key={idx}
                                onClick={() => !showResult && setSelectedAnswer(idx)}
                                disabled={showResult}
                                style={{
                                    padding: '0.75rem 1rem',
                                    background: showResult
                                        ? idx === currentQuestion.correct
                                            ? 'rgba(34, 197, 94, 0.2)'
                                            : selectedAnswer === idx
                                                ? 'rgba(239, 68, 68, 0.2)'
                                                : '#16181f'
                                        : selectedAnswer === idx
                                            ? 'rgba(167, 139, 250, 0.2)'
                                            : '#16181f',
                                    border: `1px solid ${
                                        showResult
                                            ? idx === currentQuestion.correct
                                                ? '#22c55e'
                                                : selectedAnswer === idx
                                                    ? '#ef4444'
                                                    : 'rgba(255,255,255,0.05)'
                                            : selectedAnswer === idx
                                                ? '#DCC892'
                                                : 'rgba(255,255,255,0.05)'
                                    }`,
                                    borderRadius: '8px',
                                    color: '#c9cdd4',
                                    fontSize: '0.9rem',
                                    textAlign: 'left',
                                    cursor: showResult ? 'default' : 'pointer',
                                    transition: 'transform, opacity, background-color, color, border-color, box-shadow 0.2s'
                                }}
                            >
                                <span style={{
                                    display: 'inline-block',
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    background: selectedAnswer === idx ? '#DCC892' : 'rgba(255,255,255,0.1)',
                                    color: selectedAnswer === idx ? '#050507' : '#8b909a',
                                    textAlign: 'center',
                                    lineHeight: '24px',
                                    marginRight: '0.75rem',
                                    fontSize: '0.8rem',
                                    fontWeight: '600'
                                }}>
                                    {String.fromCharCode(65 + idx)}
                                </span>
                                {option}
                            </button>
                        ))}
                    </div>
                );

            case 'true_false':
                return (
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        {[true, false].map((val) => (
                            <button type="button"
                                key={String(val)}
                                onClick={() => !showResult && setSelectedAnswer(val)}
                                disabled={showResult}
                                style={{
                                    padding: '1rem 2rem',
                                    background: showResult
                                        ? val === currentQuestion.correct
                                            ? 'rgba(34, 197, 94, 0.2)'
                                            : selectedAnswer === val
                                                ? 'rgba(239, 68, 68, 0.2)'
                                                : '#16181f'
                                        : selectedAnswer === val
                                            ? 'rgba(167, 139, 250, 0.2)'
                                            : '#16181f',
                                    border: `2px solid ${
                                        showResult
                                            ? val === currentQuestion.correct
                                                ? '#22c55e'
                                                : selectedAnswer === val
                                                    ? '#ef4444'
                                                    : 'rgba(255,255,255,0.1)'
                                            : selectedAnswer === val
                                                ? '#DCC892'
                                                : 'rgba(255,255,255,0.1)'
                                    }`,
                                    borderRadius: '12px',
                                    color: val ? '#22c55e' : '#ef4444',
                                    fontSize: '1.1rem',
                                    fontWeight: '700',
                                    cursor: showResult ? 'default' : 'pointer'
                                }}
                            >
                                {val ? 'TRUE' : 'FALSE'}
                            </button>
                        ))}
                    </div>
                );

            case 'fill_blank':
                return (
                    <input aria-label="Input"
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !showResult && checkAnswer()}
                        disabled={showResult}
                        placeholder="Type your answer..."
                        style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            background: showResult
                                ? isCorrect() ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'
                                : '#050507',
                            border: `1px solid ${showResult ? (isCorrect() ? '#22c55e' : '#ef4444') : 'rgba(255,255,255,0.1)'}`,
                            borderRadius: '10px',
                            color: '#f8f9fa',
                            fontSize: '1.1rem',
                            fontFamily: 'monospace',
                            outline: 'none'
                        }}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div style={{ padding: '1.5rem' }}>
            <div style={{ background: '#101218', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#f8f9fa', margin: 0 }}>
                            Quick Quiz
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: '#8b909a', margin: '0.25rem 0 0 0' }}>
                            Test your understanding of double tracking
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {['easy', 'medium', 'hard'].map(level => (
                            <button type="button"
                                key={level}
                                onClick={() => setDifficulty(level)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: difficulty === level
                                        ? (level === 'easy' ? '#22c55e' : level === 'medium' ? '#DCC892' : '#ef4444')
                                        : 'transparent',
                                    border: `1px solid ${difficulty === level ? 'transparent' : 'rgba(255,255,255,0.15)'}`,
                                    borderRadius: '8px',
                                    color: difficulty === level ? '#050507' : '#8b909a',
                                    fontSize: '0.8rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    textTransform: 'capitalize'
                                }}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Score */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <div style={{
                        padding: '0.5rem 1.5rem',
                        background: '#16181f',
                        borderRadius: '8px',
                        fontFamily: 'monospace'
                    }}>
                        <span style={{ color: '#22c55e', fontWeight: '700', fontSize: '1.25rem' }}>{score.correct}</span>
                        <span style={{ color: '#4a4f5a' }}> / </span>
                        <span style={{ color: '#8b909a', fontSize: '1.25rem' }}>{score.total}</span>
                    </div>
                </div>

                {/* Question */}
                <div style={{
                    padding: '1.5rem',
                    background: '#16181f',
                    borderRadius: '12px',
                    marginBottom: '1rem'
                }}>
                    <div style={{ fontSize: '0.7rem', color: '#DCC892', fontFamily: 'monospace', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                        {currentQuestion?.type === 'identify_answer' ? 'Which answer scores marks?' : 'Question'}
                    </div>
                    <div style={{ fontSize: '1.1rem', color: '#f8f9fa', lineHeight: '1.5', marginBottom: '1.25rem' }}>
                        {currentQuestion?.question}
                    </div>

                    {renderQuestion()}
                </div>

                {/* Check/Next buttons */}
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                    {!showResult ? (
                        <button type="button"
                            onClick={checkAnswer}
                            disabled={
                                (currentQuestion?.type === 'fill_blank' && !userInput.trim()) ||
                                ((currentQuestion?.type === 'multiple_choice' || currentQuestion?.type === 'identify_answer' || currentQuestion?.type === 'true_false') && selectedAnswer === null)
                            }
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                background: 'linear-gradient(135deg, #DCC892 0%, #9B7530 100%)',
                                border: 'none',
                                borderRadius: '10px',
                                color: '#fff',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                opacity: (
                                    (currentQuestion?.type === 'fill_blank' && !userInput.trim()) ||
                                    ((currentQuestion?.type === 'multiple_choice' || currentQuestion?.type === 'identify_answer' || currentQuestion?.type === 'true_false') && selectedAnswer === null)
                                ) ? 0.5 : 1
                            }}
                        >
                            Check Answer
                        </button>
                    ) : (
                        <button type="button"
                            onClick={getNewQuestion}
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                background: 'linear-gradient(135deg, #DCC892 0%, #DCC892 100%)',
                                border: 'none',
                                borderRadius: '10px',
                                color: '#050507',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Next Question
                        </button>
                    )}
                </div>

                {/* Result */}
                {showResult && (
                    <div style={{
                        padding: '1rem',
                        background: isCorrect() ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        borderRadius: '10px',
                        border: `1px solid ${isCorrect() ? '#22c55e' : '#ef4444'}`
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>{isCorrect() ? '✓' : '✗'}</span>
                            <span style={{ fontSize: '1rem', fontWeight: '600', color: isCorrect() ? '#22c55e' : '#ef4444' }}>
                                {isCorrect() ? 'Correct!' : 'Not quite'}
                            </span>
                        </div>
                        <div style={{
                            fontSize: '0.9rem',
                            color: '#c9cdd4',
                            padding: '0.75rem',
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: '6px',
                            lineHeight: '1.5'
                        }}>
                            {currentQuestion?.explanation}
                        </div>
                    </div>
                )}
            </div>

            {/* Exam Technique Notes */}
            <CopyableNote title="A* Exam Answer - Double Tracking" color="#DCC892" variant="exam">
                <strong>QUESTION: "How would you create a double-tracked vocal effect?"</strong><br/><br/>
                <strong>ZERO-MARKS ANSWER:</strong><br/>
                "Copy the vocal track and layer them together."<br/><br/>
                <strong>A* ANSWER:</strong><br/>
                "True double tracking involves recording a second vocal take, capturing the natural timing and pitch variations that occur between performances. Alternatively, ADT (Automatic Double Tracking) can simulate this effect by processing a single take with a short delay (10-40ms) and subtle pitch modulation (+/-5-20 cents). The small timing and pitch differences create a thickened, wider sound without obvious echo artefacts. Simply copying the track would only increase level, as identical waveforms combine constructively without creating the characteristic 'two voices' effect."
            </CopyableNote>
        </div>
    );
};

// ============================================
// MAIN APP
// ============================================
export default function DoubleTrackingExplorer() {
    const [activeTab, setActiveTab] = useState('mistake');

    const tabs = [
        { id: 'mistake', label: 'The Mistake', icon: '' },
        { id: 'explore', label: 'Explore ADT', icon: '' },
        { id: 'quiz', label: 'Quiz', icon: '?' },
    ];

    return (
        <div style={{ minHeight: '100vh', background: '#050507', color: '#c9cdd4', fontFamily: 'var(--font-manrope), -apple-system, BlinkMacSystemFont, sans-serif' }}>
            {/* Header */}
            <header style={{ background: 'linear-gradient(180deg, #101218 0%, #0a0b0f 100%)', borderBottom: '1px solid #ffffff10', position: 'sticky', top: 0, zIndex: 100 }}>
                <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h1 style={{ fontSize: '1rem', fontWeight: '600', letterSpacing: '0.1em', color: '#f8f9fa', margin: 0 }}>
                                <span style={{ color: '#DCC892' }}>Double Tracking</span> <span style={{ color: '#ef4444' }}>vs Copying</span>
                            </h1>
                            <div style={{ fontSize: '0.65rem', color: '#4a4f5a', fontFamily: 'monospace', marginTop: '0.25rem' }}>
                                A-Level Music Technology | 1.4 Sampling | A* Extension
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {tabs.map(tab => (
                                <button type="button"
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: activeTab === tab.id ? 'linear-gradient(135deg, #DCC892 0%, #DCC892 100%)' : 'transparent',
                                        border: `1px solid ${activeTab === tab.id ? 'transparent' : '#ffffff15'}`,
                                        borderRadius: '8px',
                                        color: activeTab === tab.id ? '#050507' : '#8b909a',
                                        fontSize: '0.8rem',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <span style={{ fontFamily: 'monospace' }}>{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero with video background */}
            <div style={{
                position: 'relative',
                overflow: 'hidden',
                width: '100vw',
                marginLeft: 'calc(-50vw + 50%)',
                marginBottom: '1.5rem',
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
                    src="/stereo-hero.mp4"
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
                    <h1 style={{
                        fontSize: '2.25rem',
                        fontWeight: 700,
                        color: '#ffffff',
                        lineHeight: 1.2,
                        marginBottom: '1rem',
                        textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}>
                        Double Tracking vs Copying
                    </h1>
                    <p style={{
                        color: 'rgba(255,255,255,0.85)',
                        fontSize: '1.125rem',
                        lineHeight: 1.6,
                        maxWidth: '480px', margin: '0 auto',
                        textShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    }}>
                        Understand why copying a track just makes it louder, and how ADT simulates the thickness and density of a second vocal performance.
                    </p>
                </div>
            </div>

            {/* Content */}
            <main style={{ maxWidth: '900px', margin: '0 auto' }}>
                {activeTab === 'mistake' && <MistakeSection />}
                {activeTab === 'explore' && <ExploreSection />}
                {activeTab === 'quiz' && <Quiz />}

                {/* Key Rules - Always visible */}
                <div style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
                    <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.1) 0%, #101218 100%)', borderRadius: '16px', border: '1px solid rgba(167, 139, 250, 0.3)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#DCC892', marginBottom: '1rem' }}>Key Rules to Remember</h3>
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', padding: '0.75rem', background: '#16181f', borderRadius: '8px' }}>
                                <span style={{ color: '#ef4444', fontSize: '1.25rem', fontWeight: '700' }}>1</span>
                                <div>
                                    <div style={{ fontWeight: '600', color: '#f8f9fa' }}>COPYING = LOUDER, NOT DOUBLED</div>
                                    <div style={{ fontSize: '0.85rem', color: '#8b909a' }}>Identical waveforms sum = constructive interference</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', padding: '0.75rem', background: '#16181f', borderRadius: '8px' }}>
                                <span style={{ color: '#22c55e', fontSize: '1.25rem', fontWeight: '700' }}>2</span>
                                <div>
                                    <div style={{ fontWeight: '600', color: '#f8f9fa' }}>TIMING + PITCH VARIATION = THE KEY</div>
                                    <div style={{ fontSize: '0.85rem', color: '#8b909a' }}>Both must vary to create double-tracking effect</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', padding: '0.75rem', background: '#16181f', borderRadius: '8px' }}>
                                <span style={{ color: '#DCC892', fontSize: '1.25rem', fontWeight: '700' }}>3</span>
                                <div>
                                    <div style={{ fontWeight: '600', color: '#f8f9fa' }}>ADT: DELAY 10-40ms + PITCH +/-5-20 cents</div>
                                    <div style={{ fontSize: '0.85rem', color: '#8b909a' }}>Short delay (Haas zone) + subtle pitch modulation</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer style={{ background: '#0a0b0f', borderTop: '1px solid #ffffff10', padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#4a4f5a' }}>
                    A-Level Music Technology | Component 4: Producing and Analysing | 1.4 Sampling
                </div>
            </footer>
        </div>
    );
}
