'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { startPreset, describePreset } from '@/lib/learn/audio-presets';
import { editorial as ED } from '@/lib/theme';

export default function AudioBlock({ preset, params, label = 'Play to listen' }) {
    const [playing, setPlaying] = useState(false);
    const handleRef = useRef(null);

    const stop = useCallback(() => {
        handleRef.current?.stop();
        handleRef.current = null;
        setPlaying(false);
    }, []);

    const start = useCallback(() => {
        if (handleRef.current) return;
        handleRef.current = startPreset(preset, params);
        setPlaying(true);
    }, [preset, params]);

    useEffect(() => stop, [stop]);

    return (
        <div style={{ marginTop: '0.9rem' }}>
            <button
                type="button"
                aria-pressed={playing}
                aria-label={`${label}: ${describePreset(preset)}`}
                onClick={() => (playing ? stop() : start())}
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.5rem 1rem', borderRadius: '9999px',
                    border: `1.5px solid ${playing ? ED.accent : ED.accentFaint}`,
                    background: playing ? ED.accent + '15' : 'transparent',
                    color: ED.accent, fontFamily: 'inherit',
                    fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 150ms ease',
                    WebkitUserSelect: 'none', userSelect: 'none', touchAction: 'none',
                }}
            >
                <span aria-hidden="true" style={{ fontSize: '0.7rem' }}>{playing ? '■' : '▸'}</span>
                {playing ? 'Playing — tap to stop' : label}
            </button>
        </div>
    );
}
