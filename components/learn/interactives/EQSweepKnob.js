'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { startPreset } from '@/lib/learn/audio-presets';
import { editorial as ED } from '@/lib/theme';

const MIN_HZ = 60;
const MAX_HZ = 12000;
const POS_MAX = 1000;

function positionToHz(pos) {
    return MIN_HZ * Math.pow(MAX_HZ / MIN_HZ, pos / POS_MAX);
}

function hzToPosition(hz) {
    return Math.round(POS_MAX * Math.log(hz / MIN_HZ) / Math.log(MAX_HZ / MIN_HZ));
}

function formatHz(hz) {
    return hz >= 1000 ? `${(hz / 1000).toFixed(1)} kHz` : `${Math.round(hz)} Hz`;
}

function zoneWord(hz) {
    if (hz < 250) return 'mud';
    if (hz < 600) return 'boxy';
    if (hz < 2000) return 'honk';
    if (hz < 6000) return 'presence';
    return 'air';
}

export default function EQSweepKnob() {
    const [position, setPosition] = useState(() => hzToPosition(1000));
    const [playing, setPlaying] = useState(false);
    const handleRef = useRef(null);

    const hz = positionToHz(position);

    const stop = useCallback(() => { handleRef.current?.stop(); handleRef.current = null; setPlaying(false); }, []);
    const start = useCallback(() => {
        if (handleRef.current) return;
        handleRef.current = startPreset('ctl-eq-sweep');
        handleRef.current.set({ frequency: hz });
        setPlaying(true);
    }, [hz]);
    useEffect(() => stop, [stop]);

    const onChange = (e) => {
        const pos = Number(e.target.value);
        setPosition(pos);
        handleRef.current?.set({ frequency: positionToHz(pos) });
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
                    Try it: EQ sweep
                </span>
                <span style={{ fontFamily: ED.mono, fontSize: '11px', color: ED.accent, fontVariantNumeric: 'tabular-nums' }}>
                    {formatHz(hz)}: {zoneWord(hz)}
                </span>
            </div>
            <input
                type="range" min="0" max={POS_MAX} step="1" value={position}
                onChange={onChange}
                aria-label="EQ sweep frequency, 60 hertz to 12 kilohertz"
                style={{ width: '100%', accentColor: ED.accent }}
            />
            <button
                type="button"
                onClick={() => (playing ? stop() : start())}
                aria-label={playing ? 'Stop the EQ sweep tone' : 'Play the EQ sweep tone'}
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
