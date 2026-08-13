'use client';

import { useState, useEffect } from 'react';

// WO-10: the [Ableton Live | Logic Pro] switch for device explorers with a
// Logic counterpart, following the lab effects rack's proven pattern —
// same localStorage key ('effects-daw'), so a student's DAW choice carries
// across every page that offers one. Defaults to Ableton.

const STORAGE_KEY = 'effects-daw';

export function useDawChoice() {
    const [daw, setDaw] = useState('ableton');

    useEffect(() => {
        try {
            const stored = window.localStorage.getItem(STORAGE_KEY);
            if (stored === 'logic' || stored === 'ableton') setDaw(stored);
        } catch {
            /* private mode — session-only choice */
        }
    }, []);

    const choose = (next) => {
        setDaw(next);
        try {
            window.localStorage.setItem(STORAGE_KEY, next);
        } catch {
            /* ignore */
        }
    };

    return [daw, choose];
}

export default function DawToggle({ value, onChange }) {
    return (
        <div
            role="group"
            aria-label="Choose your DAW"
            style={{
                display: 'inline-flex',
                gap: 4,
                background: '#F8F2E8',
                border: '1px solid rgba(43,36,24,0.18)',
                borderRadius: 999,
                padding: 4,
                marginBottom: 16,
            }}
        >
            {[
                ['ableton', 'Ableton Live'],
                ['logic', 'Logic Pro'],
            ].map(([key, label]) => (
                <button
                    key={key}
                    type="button"
                    onClick={() => onChange(key)}
                    aria-pressed={value === key}
                    style={{
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: 999,
                        padding: '7px 16px',
                        fontSize: 13,
                        fontWeight: 600,
                        fontFamily: 'inherit',
                        background: value === key ? '#3A4A35' : 'transparent',
                        color: value === key ? '#F8F2E8' : 'rgba(31,42,28,0.7)',
                        transition: 'background-color 0.15s ease, color 0.15s ease',
                    }}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}
