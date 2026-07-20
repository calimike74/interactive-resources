'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { startPreset } from '@/lib/learn/audio-presets';
import { editorial as ED } from '@/lib/theme';

function spaceWord(s) {
    if (s < 0.6) return 'small room';
    if (s < 1.2) return 'live room';
    if (s <= 2.2) return 'hall';
    return 'cathedral';
}

export default function ReverbDecaySlider() {
    const [decay, setDecay] = useState(1.2);
    const [playing, setPlaying] = useState(false);
    const handleRef = useRef(null);

    const stop = useCallback(() => { handleRef.current?.stop(); handleRef.current = null; setPlaying(false); }, []);
    const start = useCallback(() => {
        if (handleRef.current) return;
        handleRef.current = startPreset('ctl-reverb-decay');
        handleRef.current.set({ decay });
        setPlaying(true);
    }, [decay]);
    useEffect(() => stop, [stop]);

    const onChange = (e) => {
        const value = Number(e.target.value);
        setDecay(value);
        handleRef.current?.set({ decay: value });
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
                    Try it — reverb decay
                </span>
                <span style={{ fontFamily: ED.mono, fontSize: '11px', color: ED.accent, fontVariantNumeric: 'tabular-nums' }}>
                    {decay.toFixed(1)} s — {spaceWord(decay)}
                </span>
            </div>
            <input
                type="range" min="0.3" max="3.0" step="0.1" value={decay}
                onChange={onChange}
                aria-label="Reverb decay time, 0.3 to 3.0 seconds"
                style={{ width: '100%', accentColor: ED.accent }}
            />
            <button
                type="button"
                onClick={() => (playing ? stop() : start())}
                aria-label={playing ? 'Stop the repeating tick' : 'Play the repeating tick'}
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
