'use client';

import { useState, useEffect, useRef } from 'react';

function useAnimationFrame(callback, active = true) {
    const ref = useRef(callback);
    ref.current = callback;
    useEffect(() => {
        if (!active) return;
        let id;
        const loop = (t) => { ref.current(t); id = requestAnimationFrame(loop); };
        id = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(id);
    }, [active]);
}

function WaveformLetters({ text, waveType = 'sine', amplitude = 10, speed = 2, color = '#1a1a6e', fontSize = 28 }) {
    const [time, setTime] = useState(0);
    const [hovered, setHovered] = useState(false);

    useAnimationFrame((t) => setTime(t * 0.001 * speed), hovered);

    const getY = (i, t) => {
        const phase = i * 0.4 + t;
        if (waveType === 'sine') return Math.sin(phase) * amplitude;
        if (waveType === 'square') return (Math.sin(phase) > 0 ? 1 : -1) * amplitude;
        if (waveType === 'saw') return ((phase % (Math.PI * 2)) / (Math.PI * 2) * 2 - 1) * amplitude;
        if (waveType === 'triangle') {
            const p = ((phase % (Math.PI * 2)) / (Math.PI * 2));
            return (p < 0.5 ? (p * 4 - 1) : (3 - p * 4)) * amplitude;
        }
        return Math.sin(phase) * amplitude;
    };

    return (
        <span
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{ display: 'inline-flex', cursor: 'pointer' }}
        >
            {text.split('').map((char, i) => (
                <span key={i} style={{
                    display: 'inline-block',
                    fontSize,
                    fontWeight: 800,
                    color,
                    transform: hovered ? `translateY(${getY(i, time)}px)` : 'translateY(0)',
                    transition: hovered ? 'none' : 'transform 0.5s cubic-bezier(0.4,0,0.2,1)',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                }}>
                    {char === ' ' ? '\u00A0' : char}
                </span>
            ))}
        </span>
    );
}

const WAVEFORMS = [
    { id: 'saw', label: 'Sawtooth', color: '#1a1a6e', desc: 'All harmonics — bright, buzzy' },
    { id: 'square', label: 'Square', color: '#7c3aed', desc: 'Odd harmonics — hollow, reedy' },
    { id: 'triangle', label: 'Triangle', color: '#0891b2', desc: 'Weak harmonics — mellow' },
    { id: 'sine', label: 'Sine', color: '#059669', desc: 'No harmonics — pure fundamental' },
];

export default function WaveformTextInteractive({ topicColor = '#1a1a6e' }) {
    const [selected, setSelected] = useState('saw');
    const current = WAVEFORMS.find(w => w.id === selected);

    return (
        <div style={{
            padding: '16px 20px',
            borderRadius: '0.75rem',
            background: '#f8f7f5',
            border: '1px solid #E5E7EB',
            marginTop: '1rem',
        }}>
            <div style={{
                fontSize: '0.625rem',
                color: '#9CA3AF',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: 600,
                marginBottom: '0.625rem',
            }}>
                See the waveshape in the letters — hover to animate
            </div>

            <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                {WAVEFORMS.map(w => (
                    <button
                        key={w.id}
                        onClick={() => setSelected(w.id)}
                        style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '0.5rem',
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            background: selected === w.id ? w.color + '12' : 'transparent',
                            border: `1px solid ${selected === w.id ? w.color + '40' : '#E5E7EB'}`,
                            color: selected === w.id ? w.color : '#9CA3AF',
                            transition: 'all 0.2s ease',
                            fontFamily: 'inherit',
                        }}
                    >
                        {w.label}
                    </button>
                ))}
            </div>

            <WaveformLetters
                text="OSCILLATOR"
                waveType={selected}
                color={current.color}
                fontSize={28}
                amplitude={selected === 'square' ? 8 : selected === 'triangle' ? 9 : 10}
            />

            <div style={{
                fontSize: '0.75rem',
                color: current.color,
                marginTop: '0.5rem',
                fontWeight: 500,
                transition: 'color 0.2s ease',
            }}>
                {current.desc}
            </div>
        </div>
    );
}
