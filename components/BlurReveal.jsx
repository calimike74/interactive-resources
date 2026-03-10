'use client';

import { useState, useEffect } from 'react';
import { transitions } from '@/lib/theme';

/**
 * BlurReveal — Spell UI inspired
 * Text transitions from blurred + transparent to clear on mount.
 * Re-mount by changing the `key` prop to replay the animation.
 */
export default function BlurReveal({ children, delay = 0, duration = 700, blur = 14, style = {} }) {
    const [revealed, setRevealed] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setRevealed(true), delay + 10);
        return () => clearTimeout(timer);
    }, [delay]);

    return (
        <span
            style={{
                display: 'inline-block',
                filter: revealed ? 'blur(0px)' : `blur(${blur}px)`,
                opacity: revealed ? 1 : 0,
                transform: revealed ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.97)',
                transition: `filter ${duration}ms ${transitions.easing}, opacity ${duration * 0.6}ms ${transitions.easing}, transform ${duration}ms ${transitions.easing}`,
                willChange: 'filter, opacity, transform',
                ...style,
            }}
        >
            {children}
        </span>
    );
}
