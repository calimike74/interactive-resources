'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { startPreset } from '@/lib/learn/audio-presets';
import { editorial as ED } from '@/lib/theme';

export default function FMRatioSlider() {
    const [ratio, setRatio] = useState(2);
    const [playing, setPlaying] = useState(false);
    const handleRef = useRef(null);

    const stop = useCallback(() => { handleRef.current?.stop(); handleRef.current = null; setPlaying(false); }, []);
    const start = useCallback(() => {
        if (handleRef.current) return;
        handleRef.current = startPreset('ctl-fm-ratio');
        handleRef.current.set(ratio);
        setPlaying(true);
    }, [ratio]);
    useEffect(() => stop, [stop]);

    const onChange = (e) => {
        const value = Number(e.target.value);
        setRatio(value);
        handleRef.current?.set(value);
    };

    const isHarmonic = Math.abs(ratio - Math.round(ratio)) < 0.02;

    return (
        <div style={{
            marginTop: '0.9rem', padding: '0.9rem 1rem',
            border: `1px solid ${ED.accentFaint}`, borderRadius: '0.75rem', background: '#fafafa',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                <span style={{
                    fontFamily: ED.mono, fontSize: '10px', fontWeight: 500,
                    letterSpacing: '0.18em', textTransform: 'uppercase', color: ED.inkFade,
                }}>
                    Try it — FM ratio
                </span>
                <span style={{ fontFamily: ED.mono, fontSize: '11px', color: ED.accent, fontVariantNumeric: 'tabular-nums' }}>
                    ratio {ratio.toFixed(2)} — {isHarmonic ? 'harmonic' : 'inharmonic/bell-like'}
                </span>
            </div>
            <input
                type="range" min="0.5" max="8" step="0.01" value={ratio}
                onChange={onChange}
                aria-label="FM modulator-to-carrier ratio"
                style={{ width: '100%', accentColor: ED.accent }}
            />
            <button
                type="button"
                onPointerDown={start} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop}
                onKeyDown={e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); playing ? stop() : start(); } }}
                style={{
                    marginTop: '0.6rem', padding: '0.35rem 0.9rem', borderRadius: '9999px',
                    border: `1.5px solid ${playing ? ED.accent : ED.accentFaint}`,
                    background: playing ? ED.accent + '15' : 'transparent',
                    color: ED.accent, fontFamily: 'inherit', fontSize: '0.75rem', fontWeight: 600,
                    cursor: 'pointer', WebkitUserSelect: 'none', userSelect: 'none', touchAction: 'none',
                }}
            >
                {playing ? '■ release to stop' : '▸ hold to hear it'}
            </button>
        </div>
    );
}
