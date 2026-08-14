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

    const isMobile = width < 640;
    const padding = isMobile ? 20 : 40; // horizontal padding each side
    const targetWidth = width - padding * 2;

    const badgeSize = isMobile ? 11 : 13;
    const taglineSize = isMobile ? 13 : 15;

    // Calculate title font size to fill the available width
    const titleText = Array.isArray(title) ? title.join(' ') : title;
    const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    let titleSize = 100; // start large, measure and shrink to fit
    ctx.letterSpacing = '-1px';
    ctx.font = `700 ${titleSize}px ${fontFamily}`;
    let measured = ctx.measureText(titleText).width;
    titleSize = Math.floor(titleSize * (targetWidth / measured));
    // Clamp to reasonable range
    titleSize = Math.min(titleSize, 140);
    titleSize = Math.max(titleSize, 24);

    const centerX = width / 2;
    ctx.textAlign = 'center';

    // Badge
    const badgeY = isMobile ? 35 : 45;
    ctx.font = `600 ${badgeSize}px ${fontFamily}`;
    ctx.letterSpacing = '1.5px';
    ctx.fillStyle = '#059669';
    ctx.fillText(badge.toUpperCase(), centerX, badgeY);

    // Title — single line, sized to fill width
    ctx.fillStyle = COLORS.text;
    ctx.letterSpacing = '-1px';
    ctx.font = `700 ${titleSize}px ${fontFamily}`;
    const titleY = height / 2 + titleSize * 0.35;
    ctx.fillText(titleText, centerX, titleY);

    // Tagline
    const taglineY = height - (isMobile ? 25 : 35);
    ctx.font = `500 ${taglineSize}px ${fontFamily}`;
    ctx.fillStyle = '#6B7280';
    ctx.letterSpacing = '3px';
    ctx.fillText(tagline, centerX, taglineY);

    return canvas.toDataURL('image/png');
}

export default function LiquidHero({
    badge = 'A-Level Music Technology',
    title = 'Interactive Resources',
    tagline = 'Explore  •  Walkthroughs  •  Practice',
}) {
    const canvasRef = useRef(null);
    const [liquidLoaded, setLiquidLoaded] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        let script = null;
        let cancelled = false;

        const loadLiquid = () => {
            if (cancelled) return;

            const dataUrl = renderTextToDataUrl({ badge, title, tagline });

            script = document.createElement('script');
            script.type = 'module';
            script.textContent = `
                import LiquidBackground from '${CDN_URL}';
                const canvas = document.getElementById('liquid-hero-canvas');
                if (canvas) {
                    const app = LiquidBackground(canvas);
                    app.loadImage('${dataUrl}');
                    app.setRain(false);
                    app.liquidPlane.material.metalness = 0.15;
                    app.liquidPlane.material.roughness = 0.65;
                    app.liquidPlane.uniforms.displacementScale.value = 1;
                    window.__liquidApp = app;
                    canvas.dispatchEvent(new CustomEvent('liquid-ready'));
                }
            `;
            document.body.appendChild(script);
        };

        // Defer loading until the browser is idle — don't block first paint
        const idleId = typeof requestIdleCallback !== 'undefined'
            ? requestIdleCallback(loadLiquid, { timeout: 3000 })
            : setTimeout(loadLiquid, 100);

        const handleReady = () => setLiquidLoaded(true);
        canvas.addEventListener('liquid-ready', handleReady);

        return () => {
            cancelled = true;
            canvas.removeEventListener('liquid-ready', handleReady);
            if (typeof cancelIdleCallback !== 'undefined' && typeof idleId === 'number') {
                cancelIdleCallback(idleId);
            }
            if (window.__liquidApp && window.__liquidApp.dispose) {
                window.__liquidApp.dispose();
                window.__liquidApp = null;
            }
            if (script && script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, [badge, title, tagline]);

    const titleText = Array.isArray(title) ? title.join(' ') : title;

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
                <span
                    style={{
                        fontSize: 'clamp(32px, 9.5vw, 130px)',
                        fontWeight: 700,
                        color: COLORS.text,
                        lineHeight: 1.1,
                        letterSpacing: '-1px',
                        whiteSpace: 'nowrap',
                        padding: '0 20px',
                    }}
                >
                    {Array.isArray(title) ? title.join(' ') : title}
                </span>
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
                aria-label={`${badge}: ${titleText}`}
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
                    background: 'linear-gradient(to bottom, transparent, #f5f4f2)',
                    pointerEvents: 'none',
                    zIndex: 2,
                }}
                aria-hidden="true"
            />
        </div>
    );
}
