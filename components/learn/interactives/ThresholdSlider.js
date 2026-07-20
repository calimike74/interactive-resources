'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { startPreset } from '@/lib/learn/audio-presets';
import { editorial as ED } from '@/lib/theme';

export default function ThresholdSlider() {
    const [threshold, setThreshold] = useState(0);
    const [playing, setPlaying] = useState(false);
    const handleRef = useRef(null);

    const stop = useCallback(() => { handleRef.current?.stop(); handleRef.current = null; setPlaying(false); }, []);
    const start = useCallback(() => {
        if (handleRef.current) return;
        handleRef.current = startPreset('ctl-threshold');
        handleRef.current.set({ threshold });
        setPlaying(true);
    }, [threshold]);
    useEffect(() => stop, [stop]);

    const onChange = (e) => {
        const db = Number(e.target.value);
        setThreshold(db);
        handleRef.current?.set({ threshold: db });
    };

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
                    Try it — threshold
                </span>
                <span style={{ fontFamily: ED.mono, fontSize: '11px', color: ED.accent, fontVariantNumeric: 'tabular-nums' }}>
                    barely touching ⇄ squashed
                </span>
            </div>
            <input
                type="range" min="-60" max="0" step="1" value={threshold}
                onChange={onChange}
                aria-label="Compressor threshold, 0 to minus 60 decibels"
                style={{ width: '100%', accentColor: ED.accent }}
            />
            <button
                type="button"
                onClick={() => (playing ? stop() : start())}
                aria-label={playing ? 'Stop the drum loop' : 'Play the drum loop'}
                style={{
                    marginTop: '0.6rem', padding: '0.35rem 0.9rem', borderRadius: '9999px',
                    border: `1.5px solid ${playing ? ED.accent : ED.accentFaint}`,
                    background: playing ? ED.accent + '15' : 'transparent',
                    color: ED.accent, fontFamily: 'inherit', fontSize: '0.75rem', fontWeight: 600,
                    cursor: 'pointer', WebkitUserSelect: 'none', userSelect: 'none', touchAction: 'none',
                }}
            >
                {playing ? '■ playing — tap to stop' : '▸ play it'}
            </button>
        </div>
    );
}
