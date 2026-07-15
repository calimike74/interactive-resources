'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: harmonic spectrum bars grow in one by one (3rd harmonic highlighted) →
// time-domain overlay shows the fundamental and 3rd harmonic literally fitting 1:3
export default function HarmonicSeries() {
    const canvasRef = useRef(null);
    const frameRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = 480;
        const H = 280;
        canvas.width = W * 2;
        canvas.height = H * 2;
        ctx.scale(2, 2);

        const CYCLE = 560;
        let animId;

        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);

        const harmonics = [
            { n: 1, hz: 110, amp: 1.0 },
            { n: 2, hz: 220, amp: 0.5 },
            { n: 3, hz: 330, amp: 0.33 },
            { n: 4, hz: 440, amp: 0.25 },
            { n: 5, hz: 550, amp: 0.2 },
            { n: 6, hz: 660, amp: 0.17 },
        ];

        const draw = () => {
            frameRef.current = (frameRef.current + 1) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);

            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            const titleP = progress(f, 0, 25);
            ctx.globalAlpha = titleP;
            ctx.fillStyle = '#1a1a6e';
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('The Harmonic Series', W / 2, 18);
            ctx.globalAlpha = 1;

            // --- Panel 1: spectrum bar chart (y 32–150) ---
            const margin = { left: 46, right: 20 };
            const plotTop = 46;
            const plotH = 84;
            const baseY = plotTop + plotH;
            const plotW = W - margin.left - margin.right;
            const barSlot = plotW / harmonics.length;
            const barW = barSlot - 14;

            const panelAppear = progress(f, 12, 25);
            if (panelAppear > 0) {
                ctx.globalAlpha = panelAppear;
                ctx.fillStyle = '#6b7280';
                ctx.font = '9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('Amplitude', 6, 34);

                harmonics.forEach((h, i) => {
                    const barP = progress(f, 40 + i * 22, 30);
                    if (barP <= 0) return;
                    const barHeight = plotH * h.amp * barP;
                    const x = margin.left + i * barSlot + (barSlot - barW) / 2;
                    const y = baseY - barHeight;
                    const isThird = h.n === 3;

                    ctx.globalAlpha = panelAppear * barP;
                    ctx.fillStyle = isThird ? '#9B7530' : '#1a1a6e';
                    ctx.fillRect(x, y, barW, barHeight);

                    // Harmonic number label above bar
                    ctx.fillStyle = isThird ? '#9B7530' : '#6b7280';
                    ctx.font = 'bold 8px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(`×${h.n}`, x + barW / 2, y - 5);

                    // Hz label below baseline
                    const hzP = progress(f, 58 + i * 22, 20);
                    if (hzP > 0) {
                        ctx.globalAlpha = panelAppear * hzP;
                        ctx.fillStyle = '#9ca3af';
                        ctx.font = '8px -apple-system, sans-serif';
                        ctx.fillText(`${h.hz}Hz`, x + barW / 2, baseY + 12);
                    }
                    ctx.globalAlpha = panelAppear;
                });

                // 3rd-harmonic callout
                const calloutP = progress(f, 200, 30);
                if (calloutP > 0) {
                    ctx.globalAlpha = panelAppear * calloutP;
                    ctx.fillStyle = '#9B7530';
                    ctx.font = 'bold 9px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('3rd harmonic = 3 × 110 Hz = 330 Hz', W / 2, plotTop - 8 + 0);
                    ctx.globalAlpha = panelAppear;
                }

                ctx.globalAlpha = 1;
            }

            // --- Panel 2: time-domain overlay, fundamental vs 3rd harmonic (y 168–260) ---
            const p2Top = 176;
            const p2H = 84;
            const p2Left = margin.left;
            const p2Right = W - margin.right;
            const p2W = p2Right - p2Left;
            const p2Base = p2Top + p2H / 2;

            const p2Appear = progress(f, 250, 30);
            if (p2Appear > 0) {
                ctx.globalAlpha = p2Appear;
                ctx.fillStyle = '#fff';
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(p2Left - 10, p2Top - 6, p2W + 20, p2H + 16, 6);
                ctx.fill();
                ctx.stroke();

                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 0.5;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(p2Left, p2Base);
                ctx.lineTo(p2Right, p2Base);
                ctx.stroke();
                ctx.setLineDash([]);

                // Fundamental — 2 cycles across the panel
                const fundP = progress(f, 280, 60);
                const fundAmp = (p2H / 2) * 0.75;
                if (fundP > 0) {
                    ctx.strokeStyle = '#1a1a6e';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    const points = Math.floor(p2W * fundP);
                    for (let px = 0; px <= points; px++) {
                        const nx = px / p2W;
                        const y = p2Base - Math.sin(nx * 2 * Math.PI * 2) * fundAmp;
                        if (px === 0) ctx.moveTo(p2Left + px, y);
                        else ctx.lineTo(p2Left + px, y);
                    }
                    ctx.stroke();
                }

                // 3rd harmonic — 6 cycles across the same panel (3× the frequency), smaller amplitude
                const harmP = progress(f, 340, 60);
                const harmAmp = fundAmp * 0.33;
                if (harmP > 0) {
                    ctx.strokeStyle = '#9B7530';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    const points = Math.floor(p2W * harmP);
                    for (let px = 0; px <= points; px++) {
                        const nx = px / p2W;
                        const y = p2Base - Math.sin(nx * 2 * Math.PI * 6) * harmAmp;
                        if (px === 0) ctx.moveTo(p2Left + px, y);
                        else ctx.lineTo(p2Left + px, y);
                    }
                    ctx.stroke();
                }

                const labelP = progress(f, 400, 25);
                if (labelP > 0) {
                    ctx.globalAlpha = p2Appear * labelP;
                    ctx.fillStyle = '#1a1a6e';
                    ctx.font = '9px -apple-system, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText('Fundamental (110 Hz)', p2Left, p2Top - 12);
                    ctx.fillStyle = '#9B7530';
                    ctx.textAlign = 'right';
                    ctx.fillText('3rd harmonic (330 Hz) — 3× as fast', p2Right, p2Top - 12);
                    ctx.globalAlpha = p2Appear;
                }

                ctx.globalAlpha = 1;
            }

            const phase = f < 250 ? 'Spectrum' : f < 400 ? 'Time domain' : f < 480 ? 'Complete' : 'Complete';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - 16, H - 6);

            if (f > CYCLE - 40) {
                const fadeOut = progress(f, CYCLE - 40, 40);
                ctx.fillStyle = `rgba(245, 244, 242, ${fadeOut * 0.9})`;
                ctx.fillRect(0, 0, W, H);
            }

            animId = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(animId);
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', borderRadius: '0.75rem' }}
        />
    );
}
