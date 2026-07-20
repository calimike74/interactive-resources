'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { startPreset } from '@/lib/learn/audio-presets';
import { editorial as ED } from '@/lib/theme';

function repitchWord(st) {
    const magnitude = Math.abs(st);
    if (magnitude >= 8) return st > 0 ? 'chipmunk territory' : 'slow motion';
    return st > 0 ? 'faster and higher' : 'slower and deeper';
}

function repitchReadout(st) {
    if (st === 0) return 'root — as recorded';
    const sign = st > 0 ? '+' : '−';
    return `${sign}${Math.abs(st)} st — ${repitchWord(st)}`;
}

export default function RepitchSlider() {
    const [semitones, setSemitones] = useState(0);
    const [playing, setPlaying] = useState(false);
    const handleRef = useRef(null);

    const stop = useCallback(() => { handleRef.current?.stop(); handleRef.current = null; setPlaying(false); }, []);
    const start = useCallback(() => {
        if (handleRef.current) return;
        handleRef.current = startPreset('ctl-repitch');
        handleRef.current.set({ semitones });
        setPlaying(true);
    }, [semitones]);
    useEffect(() => stop, [stop]);

    const onChange = (e) => {
        const value = Number(e.target.value);
        setSemitones(value);
        handleRef.current?.set({ semitones: value });
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
                    Try it — repitch
                </span>
                <span style={{ fontFamily: ED.mono, fontSize: '11px', color: ED.accent, fontVariantNumeric: 'tabular-nums' }}>
                    {repitchReadout(semitones)}
                </span>
            </div>
            <input
                type="range" min="-12" max="12" step="1" value={semitones}
                onChange={onChange}
                aria-label="Repitch, minus 12 to plus 12 semitones"
                style={{ width: '100%', accentColor: ED.accent }}
            />
            <button
                type="button"
                onClick={() => (playing ? stop() : start())}
                aria-label={playing ? 'Stop the looped phrase' : 'Play the looped phrase'}
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
