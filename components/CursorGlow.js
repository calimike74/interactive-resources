'use client';

import { useState, useEffect } from 'react';

/**
 * CursorGlow - Ambient glow effect that follows the mouse cursor
 * Uses muted iridescent colors matching the design aesthetic
 * Hidden on touch devices
 */
export default function CursorGlow() {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isVisible, setIsVisible] = useState(false);
    const [isTouchDevice, setIsTouchDevice] = useState(false);

    useEffect(() => {
        // Detect touch device
        const checkTouchDevice = () => {
            setIsTouchDevice(
                'ontouchstart' in window ||
                navigator.maxTouchPoints > 0 ||
                window.matchMedia('(pointer: coarse)').matches
            );
        };
        checkTouchDevice();

        // Don't add listeners on touch devices
        if (isTouchDevice) return;

        const handleMouseMove = (e) => {
            setPosition({ x: e.clientX, y: e.clientY });
            if (!isVisible) setIsVisible(true);
        };

        const handleMouseLeave = () => {
            setIsVisible(false);
        };

        const handleMouseEnter = () => {
            setIsVisible(true);
        };

        window.addEventListener('mousemove', handleMouseMove);
        document.body.addEventListener('mouseleave', handleMouseLeave);
        document.body.addEventListener('mouseenter', handleMouseEnter);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            document.body.removeEventListener('mouseleave', handleMouseLeave);
            document.body.removeEventListener('mouseenter', handleMouseEnter);
        };
    }, [isTouchDevice, isVisible]);

    // Don't render on touch devices or SSR
    if (isTouchDevice || typeof window === 'undefined') {
        return null;
    }

    return (
        <div
            style={{
                position: 'fixed',
                left: position.x - 160,
                top: position.y - 160,
                width: 320,
                height: 320,
                borderRadius: '50%',
                pointerEvents: 'none',
                zIndex: 9999,
                opacity: isVisible ? 0.25 : 0,
                transition: 'opacity 0.3s ease-out',
                background: `radial-gradient(
                    circle,
                    rgba(168, 155, 200, 0.5) 0%,
                    rgba(200, 144, 154, 0.3) 30%,
                    rgba(212, 188, 138, 0.2) 50%,
                    transparent 70%
                )`,
                filter: 'blur(40px)',
                mixBlendMode: 'screen',
            }}
            aria-hidden="true"
        />
    );
}
