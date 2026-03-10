'use client';

import { useState, useEffect } from 'react';
import { transitions } from '@/lib/theme';

/**
 * SlideUpWords — Spell UI inspired
 * Splits text into words, each word slides up individually with stagger.
 * Re-mount by changing the `key` prop to replay.
 */
export default function SlideUpWords({
    text,
    stagger = 40,
    delay = 0,
    duration = 400,
    style = {},
    wordStyle = {},
}) {
    const [mounted, setMounted] = useState(false);
    const words = text.split(' ');

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 10);
        return () => clearTimeout(timer);
    }, []);

    return (
        <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0 0.3em', overflow: 'hidden', ...style }}>
            {words.map((word, i) => (
                <span
                    key={`${word}-${i}`}
                    style={{
                        display: 'inline-block',
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? 'translateY(0)' : 'translateY(100%)',
                        transition: `opacity ${duration}ms ${transitions.easing} ${delay + i * stagger}ms, transform ${duration}ms ${transitions.easing} ${delay + i * stagger}ms`,
                        willChange: 'opacity, transform',
                        ...wordStyle,
                    }}
                >
                    {word}
                </span>
            ))}
        </span>
    );
}
