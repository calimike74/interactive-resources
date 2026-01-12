import React, { useState, useRef, useEffect, useCallback } from 'react';

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
// WAVEFORM COMPARISON VISUALIZER
// ============================================
const WaveformComparison = () => {
    const canvasRef = useRef(null);
    const [mode, setMode] = useState('copied'); // 'copied' or 'doubled'
    const [isAnimating, setIsAnimating] = useState(true);
    const animationRef = useRef(null);
    const phaseRef = useRef(0);

    const width = 600;
    const height = 400;
    const padding = 40;

    const draw = useCallback((phase) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const innerWidth = width - padding * 2;
        const sectionHeight = (height - padding * 3) / 3;

        // Clear
        ctx.fillStyle = '#050507';
        ctx.fillRect(0, 0, width, height);

        // Draw section labels
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = '#8b909a';
        ctx.textAlign = 'left';

        const sections = [
            { label: 'ORIGINAL', y: padding, color: '#22d3ee' },
            { label: mode === 'copied' ? 'COPY (IDENTICAL)' : 'SECOND TAKE (VARIED)', y: padding + sectionHeight + 20, color: mode === 'copied' ? '#22d3ee' : '#ff9f43' },
            { label: 'COMBINED RESULT', y: padding + (sectionHeight + 20) * 2, color: '#a78bfa' }
        ];

        sections.forEach(({ label, y, color }) => {
            ctx.fillStyle = color;
            ctx.fillText(label, padding, y - 5);

            // Centre line
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padding, y + sectionHeight / 2);
            ctx.lineTo(width - padding, y + sectionHeight / 2);
            ctx.stroke();
        });

        // Waveform parameters
        const frequency = 2; // cycles across width
        const amplitude = sectionHeight * 0.35;

        // Timing offset for doubled mode (simulating ~20ms at 1000Hz = 0.02 of a cycle)
        const timingOffset = mode === 'doubled' ? 0.08 : 0;
        // Pitch variation for doubled mode (slightly different frequency)
        const pitchVariation = mode === 'doubled' ? 0.05 : 0;
        // Amplitude variation for doubled mode
        const ampVariation = mode === 'doubled' ? 0.1 : 0;

        // Draw Original waveform
        const drawWave = (yBase, offset, freqMod, ampMod, color, shadowColor) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            ctx.shadowColor = shadowColor;
            ctx.shadowBlur = 6;
            ctx.beginPath();

            for (let i = 0; i <= innerWidth; i++) {
                const x = padding + i;
                const t = (i / innerWidth) * frequency * Math.PI * 2 + phase + offset;
                const y = yBase + sectionHeight / 2 - Math.sin(t * (1 + freqMod)) * amplitude * (1 + ampMod);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        };

        // Section 1: Original
        drawWave(sections[0].y, 0, 0, 0, '#22d3ee', '#22d3ee');

        // Section 2: Copy or Second Take
        if (mode === 'copied') {
            // Identical - same waveform
            drawWave(sections[1].y, 0, 0, 0, '#22d3ee', '#22d3ee');
        } else {
            // Varied - offset timing, slight pitch/amplitude variation
            drawWave(sections[1].y, timingOffset * Math.PI * 2, pitchVariation, ampVariation * Math.sin(phase * 0.5), '#ff9f43', '#ff9f43');
        }

        // Section 3: Combined Result
        ctx.strokeStyle = '#a78bfa';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#a78bfa';
        ctx.shadowBlur = 8;
        ctx.beginPath();

        for (let i = 0; i <= innerWidth; i++) {
            const x = padding + i;
            const t = (i / innerWidth) * frequency * Math.PI * 2 + phase;

            // Original wave
            const wave1 = Math.sin(t) * amplitude;

            // Second wave (copied or varied)
            let wave2;
            if (mode === 'copied') {
                wave2 = Math.sin(t) * amplitude; // Identical
            } else {
                const t2 = t + timingOffset * Math.PI * 2;
                wave2 = Math.sin(t2 * (1 + pitchVariation)) * amplitude * (1 + ampVariation * Math.sin(phase * 0.5));
            }

            // Combined (normalized to show the difference)
            const combined = (wave1 + wave2) / (mode === 'copied' ? 2 : 1.5);
            const y = sections[2].y + sectionHeight / 2 - combined;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Result annotation
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';

        if (mode === 'copied') {
            ctx.fillStyle = '#ef4444';
            ctx.fillText('SAME WAVEFORM, JUST LOUDER (+3-6dB)', width / 2, sections[2].y + sectionHeight + 15);
        } else {
            ctx.fillStyle = '#22c55e';
            ctx.fillText('THICKENED SOUND - NATURAL VARIATION CREATES WIDTH', width / 2, sections[2].y + sectionHeight + 15);
        }

    }, [mode]);

    useEffect(() => {
        const animate = () => {
            phaseRef.current += 0.03;
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

    return (
        <div style={{ background: '#101218', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#f8f9fa', margin: 0 }}>
                        Waveform Comparison
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#8b909a', margin: '0.25rem 0 0 0' }}>
                        See why copying fails vs true double tracking
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => setMode('copied')}
                        style={{
                            padding: '0.5rem 1rem',
                            background: mode === 'copied' ? '#ef4444' : 'transparent',
                            border: `1px solid ${mode === 'copied' ? '#ef4444' : 'rgba(255,255,255,0.15)'}`,
                            borderRadius: '8px',
                            color: mode === 'copied' ? '#fff' : '#8b909a',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Copied (WRONG)
                    </button>
                    <button
                        onClick={() => setMode('doubled')}
                        style={{
                            padding: '0.5rem 1rem',
                            background: mode === 'doubled' ? '#22c55e' : 'transparent',
                            border: `1px solid ${mode === 'doubled' ? '#22c55e' : 'rgba(255,255,255,0.15)'}`,
                            borderRadius: '8px',
                            color: mode === 'doubled' ? '#fff' : '#8b909a',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Double Tracked (CORRECT)
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <canvas
                    ref={canvasRef}
                    width={width}
                    height={height}
                    style={{
                        maxWidth: '100%',
                        height: 'auto',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                <button
                    onClick={() => setIsAnimating(!isAnimating)}
                    style={{
                        padding: '0.5rem 1rem',
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
                    {isAnimating ? 'Pause Animation' : 'Play Animation'}
                </button>
            </div>

            {/* Key insight box */}
            <div style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                background: mode === 'copied' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                borderRadius: '8px',
                border: `1px solid ${mode === 'copied' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                fontSize: '0.85rem',
                color: mode === 'copied' ? '#fca5a5' : '#86efac',
                textAlign: 'center'
            }}>
                {mode === 'copied' ? (
                    <><strong>Copying FAILS:</strong> Identical waveforms simply add together (constructive interference). Result = ONE louder voice, not TWO voices.</>
                ) : (
                    <><strong>Double Tracking WORKS:</strong> Timing and pitch variations create movement and width. The brain perceives two separate performances.</>
                )}
            </div>
        </div>
    );
};

// ============================================
// ADT SIMULATOR
// ============================================
const ADTSimulator = () => {
    const canvasRef = useRef(null);
    const [delayMs, setDelayMs] = useState(25);
    const [pitchCents, setPitchCents] = useState(12);
    const [isAnimating, setIsAnimating] = useState(true);
    const animationRef = useRef(null);
    const phaseRef = useRef(0);

    const width = 600;
    const height = 250;
    const padding = 40;

    const draw = useCallback((phase) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const innerWidth = width - padding * 2;
        const midY = height / 2;
        const amplitude = 60;

        // Clear
        ctx.fillStyle = '#050507';
        ctx.fillRect(0, 0, width, height);

        // Centre line
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, midY);
        ctx.lineTo(width - padding, midY);
        ctx.stroke();

        // Calculate offset based on delay (normalize 10-40ms to 0-0.15 of cycle)
        const timingOffset = ((delayMs - 10) / 30) * 0.15 + 0.02;
        // Calculate frequency mod based on pitch cents (normalize 5-20 cents to 0.01-0.04)
        const freqMod = ((pitchCents - 5) / 15) * 0.03 + 0.01;

        // Draw Original waveform
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#22d3ee';
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

        // Draw ADT processed waveform
        ctx.strokeStyle = '#ff9f43';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#ff9f43';
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
        ctx.fillStyle = '#22d3ee';
        ctx.textAlign = 'left';
        ctx.fillText('Original', padding, 25);
        ctx.fillStyle = '#ff9f43';
        ctx.fillText('ADT Processed', padding + 80, 25);

        // Offset visualization
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(255, 159, 67, 0.5)';
        ctx.lineWidth = 1;

        // Draw timing offset indicator at a peak
        const peakX = padding + innerWidth * 0.25;
        ctx.beginPath();
        ctx.moveTo(peakX, midY - amplitude * 0.8);
        ctx.lineTo(peakX, midY - amplitude * 0.8 - 30);
        ctx.stroke();

        const offsetPeakX = peakX + timingOffset * innerWidth * 0.5;
        ctx.beginPath();
        ctx.moveTo(offsetPeakX, midY - amplitude * 0.8);
        ctx.lineTo(offsetPeakX, midY - amplitude * 0.8 - 30);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(peakX, midY - amplitude * 0.8 - 25);
        ctx.lineTo(offsetPeakX, midY - amplitude * 0.8 - 25);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.fillStyle = '#ff9f43';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${delayMs}ms delay`, (peakX + offsetPeakX) / 2, midY - amplitude * 0.8 - 35);

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

    // Determine if in Haas zone
    const inHaasZone = delayMs <= 40;

    return (
        <div style={{ background: '#101218', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#f8f9fa', margin: 0 }}>
                    ADT Simulator
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#8b909a', margin: '0.25rem 0 0 0' }}>
                    Adjust delay and pitch modulation to see how ADT creates the double-tracking effect
                </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <canvas
                    ref={canvasRef}
                    width={width}
                    height={height}
                    style={{
                        maxWidth: '100%',
                        height: 'auto',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                />
            </div>

            {/* Controls */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
                {/* Delay slider */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <label style={{ fontSize: '0.75rem', color: '#ff9f43', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                            Delay Time
                        </label>
                        <span style={{ fontSize: '1rem', color: '#ff9f43', fontFamily: 'monospace', fontWeight: '700' }}>
                            {delayMs}ms
                        </span>
                    </div>
                    <input
                        type="range"
                        min="5"
                        max="80"
                        value={delayMs}
                        onChange={(e) => setDelayMs(parseInt(e.target.value))}
                        style={{
                            width: '100%',
                            accentColor: '#ff9f43'
                        }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#4a4f5a', marginTop: '0.25rem' }}>
                        <span>5ms</span>
                        <span style={{ color: inHaasZone ? '#22c55e' : '#ef4444' }}>
                            {inHaasZone ? 'Haas Zone (fusion)' : 'Echo zone (too long)'}
                        </span>
                        <span>80ms</span>
                    </div>
                </div>

                {/* Pitch slider */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <label style={{ fontSize: '0.75rem', color: '#a78bfa', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                            Pitch Modulation
                        </label>
                        <span style={{ fontSize: '1rem', color: '#a78bfa', fontFamily: 'monospace', fontWeight: '700' }}>
                            +/-{pitchCents} cents
                        </span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="30"
                        value={pitchCents}
                        onChange={(e) => setPitchCents(parseInt(e.target.value))}
                        style={{
                            width: '100%',
                            accentColor: '#a78bfa'
                        }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#4a4f5a', marginTop: '0.25rem' }}>
                        <span>0 cents</span>
                        <span style={{ color: pitchCents >= 5 && pitchCents <= 20 ? '#22c55e' : '#f59e0b' }}>
                            {pitchCents < 5 ? 'Too subtle' : pitchCents > 20 ? 'Noticeable detuning' : 'Sweet spot'}
                        </span>
                        <span>30 cents</span>
                    </div>
                </div>
            </div>

            {/* Haas zone indicator */}
            <div style={{
                padding: '0.75rem 1rem',
                background: inHaasZone ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                borderRadius: '8px',
                border: `1px solid ${inHaasZone ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                marginBottom: '1rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>{inHaasZone ? '✓' : '!'}</span>
                    <div>
                        <div style={{ fontWeight: '600', color: inHaasZone ? '#22c55e' : '#ef4444', fontSize: '0.9rem' }}>
                            {inHaasZone ? 'Haas Effect Zone - Sounds Fuse' : 'Outside Haas Zone - Distinct Echo'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#8b909a' }}>
                            {inHaasZone
                                ? 'Delays under ~40ms are perceived as one thickened sound, not separate echoes.'
                                : 'Delays over ~40ms are heard as distinct echoes, breaking the double-tracking illusion.'}
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                    onClick={() => setIsAnimating(!isAnimating)}
                    style={{
                        padding: '0.5rem 1rem',
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
                            <button
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
                                                ? '#a78bfa'
                                                : 'rgba(255,255,255,0.05)'
                                    }`,
                                    borderRadius: '8px',
                                    color: '#c9cdd4',
                                    fontSize: '0.9rem',
                                    textAlign: 'left',
                                    cursor: showResult ? 'default' : 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <span style={{
                                    display: 'inline-block',
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    background: selectedAnswer === idx ? '#a78bfa' : 'rgba(255,255,255,0.1)',
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
                            <button
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
                                                ? '#a78bfa'
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
                    <input
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
                        <button
                            key={level}
                            onClick={() => setDifficulty(level)}
                            style={{
                                padding: '0.5rem 1rem',
                                background: difficulty === level
                                    ? (level === 'easy' ? '#22c55e' : level === 'medium' ? '#f59e0b' : '#ef4444')
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
                <div style={{ fontSize: '0.7rem', color: '#a78bfa', fontFamily: 'monospace', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
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
                    <button
                        onClick={checkAnswer}
                        disabled={
                            (currentQuestion?.type === 'fill_blank' && !userInput.trim()) ||
                            ((currentQuestion?.type === 'multiple_choice' || currentQuestion?.type === 'identify_answer' || currentQuestion?.type === 'true_false') && selectedAnswer === null)
                        }
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
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
                    <button
                        onClick={getNewQuestion}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            background: 'linear-gradient(135deg, #74b9ff 0%, #0ea5e9 100%)',
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
    );
};

// ============================================
// REFERENCE SECTION
// ============================================
const ReferenceSection = () => {
    return (
        <div style={{ background: '#101218', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#f8f9fa', marginBottom: '1rem' }}>
                Quick Reference
            </h3>

            {/* ADT Parameters */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#ff9f43', marginBottom: '0.75rem', fontFamily: 'monospace' }}>
                    ADT PARAMETERS
                </h4>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.15)' }}>
                                <th style={{ padding: '0.5rem', textAlign: 'left', color: '#c9cdd4' }}>Parameter</th>
                                <th style={{ padding: '0.5rem', textAlign: 'center', color: '#c9cdd4' }}>Range</th>
                                <th style={{ padding: '0.5rem', textAlign: 'left', color: '#c9cdd4' }}>Purpose</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '0.5rem', color: '#22d3ee', fontFamily: 'monospace' }}>Delay</td>
                                <td style={{ padding: '0.5rem', textAlign: 'center', color: '#f8f9fa', fontFamily: 'monospace' }}>10-40ms</td>
                                <td style={{ padding: '0.5rem', color: '#8b909a' }}>Creates timing variation (below Haas threshold)</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '0.5rem', color: '#a78bfa', fontFamily: 'monospace' }}>Pitch Mod</td>
                                <td style={{ padding: '0.5rem', textAlign: 'center', color: '#f8f9fa', fontFamily: 'monospace' }}>+/-5-20 cents</td>
                                <td style={{ padding: '0.5rem', color: '#8b909a' }}>Simulates natural pitch variation via LFO</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Three Approaches */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#22d3ee', marginBottom: '0.75rem', fontFamily: 'monospace' }}>
                    THREE APPROACHES COMPARED
                </h4>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.15)' }}>
                                <th style={{ padding: '0.5rem', textAlign: 'left', color: '#c9cdd4' }}>Approach</th>
                                <th style={{ padding: '0.5rem', textAlign: 'center', color: '#c9cdd4' }}>Works?</th>
                                <th style={{ padding: '0.5rem', textAlign: 'left', color: '#c9cdd4' }}>Why?</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '0.5rem', color: '#f8f9fa' }}>True Double (2 takes)</td>
                                <td style={{ padding: '0.5rem', textAlign: 'center', color: '#22c55e', fontSize: '1.1rem' }}>✓</td>
                                <td style={{ padding: '0.5rem', color: '#8b909a' }}>Natural timing/pitch variation between performances</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '0.5rem', color: '#f8f9fa' }}>ADT (processed)</td>
                                <td style={{ padding: '0.5rem', textAlign: 'center', color: '#22c55e', fontSize: '1.1rem' }}>✓</td>
                                <td style={{ padding: '0.5rem', color: '#8b909a' }}>Artificially creates timing/pitch variation</td>
                            </tr>
                            <tr style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                                <td style={{ padding: '0.5rem', color: '#ef4444', fontWeight: '600' }}>Copying</td>
                                <td style={{ padding: '0.5rem', textAlign: 'center', color: '#ef4444', fontSize: '1.1rem' }}>✗</td>
                                <td style={{ padding: '0.5rem', color: '#fca5a5' }}>Identical waveforms = louder only, NO variation</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Key formulas */}
            <div style={{
                padding: '0.75rem',
                background: '#16181f',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-around',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: '#4a4f5a', marginBottom: '0.25rem' }}>HAAS THRESHOLD</div>
                    <div style={{ fontSize: '0.9rem', color: '#22c55e', fontFamily: 'monospace' }}>~30-40ms</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: '#4a4f5a', marginBottom: '0.25rem' }}>PITCH THRESHOLD</div>
                    <div style={{ fontSize: '0.9rem', color: '#a78bfa', fontFamily: 'monospace' }}>~3-5 cents</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: '#4a4f5a', marginBottom: '0.25rem' }}>COPIED LEVEL BOOST</div>
                    <div style={{ fontSize: '0.9rem', color: '#ef4444', fontFamily: 'monospace' }}>+3 to +6dB</div>
                </div>
            </div>
        </div>
    );
};

// ============================================
// EXAMINER WARNING
// ============================================
const ExaminerWarning = () => {
    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, #101218 100%)',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '2rem',
            border: '1px solid rgba(239, 68, 68, 0.3)'
        }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>!</span>
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
                        Students consistently lose marks by suggesting they would "copy the track" to achieve double tracking.
                    </p>
                    <div style={{
                        marginTop: '1rem',
                        padding: '0.75rem',
                        background: 'rgba(34, 197, 94, 0.1)',
                        borderRadius: '8px',
                        border: '1px solid rgba(34, 197, 94, 0.3)'
                    }}>
                        <div style={{ fontSize: '0.75rem', color: '#22c55e', fontFamily: 'monospace', marginBottom: '0.25rem' }}>
                            A* ANSWER INCLUDES:
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#86efac' }}>
                            Timing variation + Pitch variation + Why copying fails
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================
// MAIN APP
// ============================================
export default function DoubleTrackingExplorer() {
    const [activeTab, setActiveTab] = useState('visualizer');

    return (
        <div style={{ minHeight: '100vh', background: '#050507', color: '#c9cdd4', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
            {/* Header */}
            <header style={{ background: 'linear-gradient(180deg, #101218 0%, #0a0b0f 100%)', borderBottom: '1px solid #ffffff10', position: 'sticky', top: 0, zIndex: 100 }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h1 style={{ fontSize: '1rem', fontWeight: '600', letterSpacing: '0.1em', color: '#f8f9fa', margin: 0 }}>
                                <span style={{ color: '#22d3ee' }}>Double Tracking</span> <span style={{ color: '#ef4444' }}>vs Copying</span>
                            </h1>
                            <div style={{ fontSize: '0.65rem', color: '#4a4f5a', fontFamily: 'monospace', marginTop: '0.25rem' }}>
                                A-Level Music Technology | 1.4 Sampling | A* Extension
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {[
                                { id: 'visualizer', label: 'Visualizer', icon: '~' },
                                { id: 'adt', label: 'ADT Sim', icon: '+' },
                                { id: 'quiz', label: 'Quiz', icon: '?' },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: activeTab === tab.id ? 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)' : 'transparent',
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

            {/* Content */}
            <main style={{ maxWidth: '800px', margin: '0 auto', padding: '1.5rem' }}>
                {/* Examiner Warning - always visible */}
                <ExaminerWarning />

                {/* Tab content */}
                {activeTab === 'visualizer' && <WaveformComparison />}
                {activeTab === 'adt' && <ADTSimulator />}
                {activeTab === 'quiz' && <Quiz />}

                {/* Reference section - always visible */}
                <ReferenceSection />

                {/* Key Rules */}
                <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.1) 0%, #101218 100%)', borderRadius: '16px', border: '1px solid rgba(167, 139, 250, 0.3)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#a78bfa', marginBottom: '1rem' }}>Key Rules to Remember</h3>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', padding: '0.75rem', background: '#16181f', borderRadius: '8px' }}>
                            <span style={{ color: '#ef4444', fontSize: '1.25rem', fontWeight: '700' }}>1</span>
                            <div>
                                <div style={{ fontWeight: '600', color: '#f8f9fa' }}>COPYING = LOUDER, NOT DOUBLE TRACKED</div>
                                <div style={{ fontSize: '0.85rem', color: '#8b909a' }}>Identical waveforms sum through constructive interference</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', padding: '0.75rem', background: '#16181f', borderRadius: '8px' }}>
                            <span style={{ color: '#22c55e', fontSize: '1.25rem', fontWeight: '700' }}>2</span>
                            <div>
                                <div style={{ fontWeight: '600', color: '#f8f9fa' }}>TIMING + PITCH VARIATION = THE KEY</div>
                                <div style={{ fontSize: '0.85rem', color: '#8b909a' }}>Both elements must vary to create the double-tracking effect</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', padding: '0.75rem', background: '#16181f', borderRadius: '8px' }}>
                            <span style={{ color: '#ff9f43', fontSize: '1.25rem', fontWeight: '700' }}>3</span>
                            <div>
                                <div style={{ fontWeight: '600', color: '#f8f9fa' }}>ADT: DELAY 10-40ms + PITCH +/-5-20 CENTS</div>
                                <div style={{ fontSize: '0.85rem', color: '#8b909a' }}>Short delay (Haas zone) + subtle pitch modulation via LFO</div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer style={{ background: '#0a0b0f', borderTop: '1px solid #ffffff10', padding: '1.5rem', textAlign: 'center', marginTop: '2rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#4a4f5a' }}>
                    A-Level Music Technology | Component 4: Producing and Analysing | 1.4 Sampling
                </div>
            </footer>
        </div>
    );
}
