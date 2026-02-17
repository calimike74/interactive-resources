'use client';

import { useRef, useEffect, useState } from 'react';

/**
 * LiquidHero — Three.js liquid distortion hero banner
 * Renders text to an offscreen Canvas 2D, exports as PNG data URL,
 * then feeds it into a Three.js liquid shader loaded from CDN.
 * Shows static text fallback while the shader loads, then crossfades.
 */

const CDN_URL = 'https://cdn.jsdelivr.net/npm/threejs-components@0.0.30/build/backgrounds/liquid1.min.js';

const COLORS = {
    bg: '#f5f4f2',
    text: '#1a1a2e',
};

function renderTextToDataUrl({ badge, title, tagline }) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.min(window.innerWidth, 1400);
    const height = 280;

    const canvas = document.createElement('canvas');
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, width, height);

    // Responsive font sizing
    const isMobile = width < 640;
    const isTablet = width < 1024;

    const badgeSize = isMobile ? 11 : 13;
    const titleSize = isMobile ? 36 : isTablet ? 48 : 60;
    const taglineSize = isMobile ? 13 : 15;

    const centerX = width / 2;
    ctx.textAlign = 'center';

    // Badge
    const badgeY = isMobile ? 40 : 50;
    ctx.font = `600 ${badgeSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.letterSpacing = '1.5px';
    ctx.fillStyle = '#059669';
    ctx.fillText(badge.toUpperCase(), centerX, badgeY);

    // Title lines
    ctx.fillStyle = COLORS.text;
    ctx.letterSpacing = '-1px';
    const lines = Array.isArray(title) ? title : [title];
    const lineHeight = titleSize * 1.15;
    const titleBlockHeight = lines.length * lineHeight;
    const titleStartY = (height / 2) - (titleBlockHeight / 2) + titleSize * 0.35 + (isMobile ? 5 : 0);

    lines.forEach((line, i) => {
        ctx.font = `700 ${titleSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.fillText(line, centerX, titleStartY + i * lineHeight);
    });

    // Tagline
    const taglineY = height - (isMobile ? 30 : 40);
    ctx.font = `500 ${taglineSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = '#6B7280';
    ctx.letterSpacing = '3px';
    ctx.fillText(tagline, centerX, taglineY);

    return canvas.toDataURL('image/png');
}

export default function LiquidHero({
    badge = 'A-Level Music Technology',
    title = ['Interactive', 'Resources'],
    tagline = 'Explore  •  Learn  •  Practice',
}) {
    const canvasRef = useRef(null);
    const [liquidLoaded, setLiquidLoaded] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dataUrl = renderTextToDataUrl({ badge, title, tagline });

        // Load the liquid shader as an ES module via dynamic script injection
        const script = document.createElement('script');
        script.type = 'module';
        script.textContent = `
            import LiquidBackground from '${CDN_URL}';
            const canvas = document.getElementById('liquid-hero-canvas');
            if (canvas) {
                const app = LiquidBackground(canvas);
                app.loadImage('${dataUrl}');
                app.setRain(false);
                app.liquidPlane.material.metalness = 0.35;
                app.liquidPlane.material.roughness = 0.45;
                app.liquidPlane.uniforms.displacementScale.value = 2;
                window.__liquidApp = app;
                // Signal that the liquid effect is ready
                canvas.dispatchEvent(new CustomEvent('liquid-ready'));
            }
        `;
        document.body.appendChild(script);

        // Listen for the liquid-ready event from the module script
        const handleReady = () => setLiquidLoaded(true);
        canvas.addEventListener('liquid-ready', handleReady);

        return () => {
            canvas.removeEventListener('liquid-ready', handleReady);
            if (window.__liquidApp && window.__liquidApp.dispose) {
                window.__liquidApp.dispose();
                window.__liquidApp = null;
            }
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, [badge, title, tagline]);

    const lines = Array.isArray(title) ? title : [title];

    return (
        <div style={{ position: 'relative' }}>
            {/* Static text fallback — visible until liquid shader loads */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: COLORS.bg,
                    zIndex: liquidLoaded ? 0 : 1,
                    opacity: liquidLoaded ? 0 : 1,
                    transition: 'opacity 0.6s ease-out',
                    pointerEvents: liquidLoaded ? 'none' : 'auto',
                }}
                aria-hidden={liquidLoaded}
            >
                <span
                    style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        letterSpacing: '1.5px',
                        color: '#059669',
                        textTransform: 'uppercase',
                        marginBottom: '16px',
                    }}
                >
                    {badge}
                </span>
                {lines.map((line, i) => (
                    <span
                        key={i}
                        style={{
                            fontSize: 'clamp(36px, 5vw, 60px)',
                            fontWeight: 700,
                            color: COLORS.text,
                            lineHeight: 1.15,
                            letterSpacing: '-1px',
                        }}
                    >
                        {line}
                    </span>
                ))}
                <span
                    style={{
                        fontSize: '15px',
                        fontWeight: 500,
                        color: '#6B7280',
                        letterSpacing: '3px',
                        marginTop: '16px',
                    }}
                >
                    {tagline}
                </span>
            </div>

            {/* WebGL canvas for liquid effect */}
            <canvas
                id="liquid-hero-canvas"
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: '280px',
                    display: 'block',
                    background: COLORS.bg,
                    cursor: 'grab',
                }}
                aria-label={`${badge} — ${lines.join(' ')}`}
                role="img"
            />

            {/* Bottom fade to blend into page background */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '40px',
                    background: 'linear-gradient(to bottom, transparent, #F8F9FA)',
                    pointerEvents: 'none',
                    zIndex: 2,
                }}
                aria-hidden="true"
            />
        </div>
    );
}
