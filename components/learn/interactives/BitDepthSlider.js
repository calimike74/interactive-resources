'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { startPreset } from '@/lib/learn/audio-presets';
import { editorial as ED } from '@/lib/theme';

function depthWord(bits) {
    if (bits >= 12) return 'clean';
    if (bits >= 6) return 'faint quantisation noise';
    return 'audible staircase';
}

function depthReadout(bits) {
    const word = depthWord(bits);
    return bits >= 12 ? `${bits} bits: ${word} (~${bits * 6} dB range)` : `${bits} bits: ${word}`;
}

export default function BitDepthSlider() {
    const [bits, setBits] = useState(16);
    const [playing, setPlaying] = useState(false);
    const handleRef = useRef(null);

    const stop = useCallback(() => { handleRef.current?.stop(); handleRef.current = null; setPlaying(false); }, []);
    const start = useCallback(() => {
        if (handleRef.current) return;
        handleRef.current = startPreset('ctl-bit-depth');
        handleRef.current.set({ bits });
        setPlaying(true);
    }, [bits]);
    useEffect(() => stop, [stop]);

    const onChange = (e) => {
        const value = Number(e.target.value);
        setBits(value);
        handleRef.current?.set({ bits: value });
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
                    Try it: bit depth
                </span>
                <span style={{ fontFamily: ED.mono, fontSize: '11px', color: ED.accent, fontVariantNumeric: 'tabular-nums' }}>
                    {depthReadout(bits)}
                </span>
            </div>
            <input
                type="range" min="2" max="16" step="1" value={bits}
                onChange={onChange}
                aria-label="Bit depth, 2 to 16 bits"
                style={{ width: '100%', accentColor: ED.accent }}
            />
            <button
                type="button"
                onClick={() => (playing ? stop() : start())}
                aria-label={playing ? 'Stop the sustained tone' : 'Play the sustained tone'}
                style={{
                    marginTop: '0.6rem', padding: '0.35rem 0.9rem', borderRadius: '9999px',
                    border: `1.5px solid ${playing ? ED.accent : ED.accentFaint}`,
                    background: playing ? ED.accent + '15' : 'transparent',
                    color: ED.accent, fontFamily: 'inherit', fontSize: '0.75rem', fontWeight: 600,
                    cursor: 'pointer', WebkitUserSelect: 'none', userSelect: 'none', touchAction: 'none',
                }}
            >
                {playing ? '■ playing: tap to stop' : '▸ play it'}
            </button>
        </div>
    );
}
