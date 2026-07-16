'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { startPreset } from '@/lib/learn/audio-presets';
import { editorial as ED } from '@/lib/theme';

export default function FeedbackDial() {
    const [percent, setPercent] = useState(0);
    const [playing, setPlaying] = useState(false);
    const handleRef = useRef(null);

    const stop = useCallback(() => { handleRef.current?.stop(); handleRef.current = null; setPlaying(false); }, []);
    const start = useCallback(() => {
        if (handleRef.current) return;
        handleRef.current = startPreset('ctl-feedback');
        handleRef.current.set({ feedback: percent / 100 });
        setPlaying(true);
    }, [percent]);
    useEffect(() => stop, [stop]);

    const onChange = (e) => {
        const value = Number(e.target.value);
        setPercent(value);
        handleRef.current?.set({ feedback: value / 100 });
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
                    Try it — feedback
                </span>
                <span style={{ fontFamily: ED.mono, fontSize: '11px', color: ED.accent, fontVariantNumeric: 'tabular-nums' }}>
                    one repeat ⇄ long tail
                </span>
            </div>
            <input
                type="range" min="0" max="85" step="1" value={percent}
                onChange={onChange}
                aria-label="Delay feedback amount, 0 to 85 percent"
                style={{ width: '100%', accentColor: ED.accent }}
            />
            <button
                type="button"
                onPointerDown={start} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop}
                onKeyDown={e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); playing ? stop() : start(); } }}
                aria-label={playing ? 'Release to stop the repeating pluck' : 'Hold to hear the repeating pluck'}
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
