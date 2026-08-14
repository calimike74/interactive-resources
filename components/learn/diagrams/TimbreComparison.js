'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: two spectra grow side by side, sharing the same fundamental height (same pitch) —
// one thin (fast-decaying harmonics), one rich (slow-decaying harmonics) — bridged by a "same pitch" bracket
export default function TimbreComparison() {
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

        const CYCLE = 520;
        let animId;

        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);

        const panels = [
            {
                name: 'Flute-like',
                color: '#0891b2',
                amps: [1, 0.32, 0.14, 0.05, 0.02],
                caption: 'Few harmonics: thin, pure',
            },
            {
                name: 'Violin-like',
                color: '#9B7530',
                amps: [1, 0.72, 0.56, 0.42, 0.3],
                caption: 'Many harmonics: rich, dense',
            },
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
            ctx.fillText('Same Pitch, Different Recipe', W / 2, 18);
            ctx.globalAlpha = 1;

            const cols = 2;
            const gap = 24;
            const cellW = (W - 40 - gap) / cols;
            const plotTop = 60;
            const plotH = 110;
            const baseY = plotTop + plotH;
            const nBars = 5;

            const panelX = (col) => 20 + col * (cellW + gap);

            const barGeom = [];

            panels.forEach((panel, col) => {
                const cx = panelX(col);
                const barSlot = cellW / nBars;
                const barW = barSlot - 10;
                const panelAppear = progress(f, 40 + col * 90, 30);
                if (panelAppear <= 0) return;

                ctx.globalAlpha = panelAppear;

                // Panel name
                ctx.fillStyle = panel.color;
                ctx.font = 'bold 10px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(panel.name, cx + cellW / 2, plotTop - 12);

                for (let i = 0; i < nBars; i++) {
                    const barP = progress(f, 60 + col * 90 + i * 16, 26);
                    if (barP <= 0) continue;
                    const barHeight = plotH * panel.amps[i] * barP;
                    const x = cx + i * barSlot + (barSlot - barW) / 2;
                    const y = baseY - barHeight;

                    ctx.globalAlpha = panelAppear * barP;
                    ctx.fillStyle = panel.color;
                    ctx.fillRect(x, y, barW, barHeight);

                    ctx.fillStyle = '#9ca3af';
                    ctx.font = '7px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(`×${i + 1}`, x + barW / 2, baseY + 11);

                    if (i === 0) {
                        barGeom[col] = { x: x + barW / 2, top: baseY - plotH * panel.amps[0] };
                    }
                }
                ctx.globalAlpha = panelAppear;

                // Caption below panel
                const capP = progress(f, 240 + col * 20, 25);
                if (capP > 0) {
                    ctx.globalAlpha = panelAppear * capP;
                    ctx.fillStyle = '#6b7280';
                    ctx.font = '9px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(panel.caption, cx + cellW / 2, baseY + 30);
                    ctx.globalAlpha = panelAppear;
                }

                ctx.globalAlpha = 1;
            });

            // Baseline under both panels
            const baseP = progress(f, 40, 30);
            if (baseP > 0) {
                ctx.globalAlpha = baseP;
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(20, baseY);
                ctx.lineTo(W - 20, baseY);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            // "Same fundamental" markers — short accent ticks above each fundamental bar
            // (no horizontal bridge, so nothing crosses the panel-name row)
            const bridgeP = progress(f, 300, 30);
            if (bridgeP > 0 && barGeom[0] && barGeom[1]) {
                ctx.globalAlpha = bridgeP;
                ctx.strokeStyle = '#059669';
                ctx.lineWidth = 2;
                [barGeom[0], barGeom[1]].forEach((g) => {
                    ctx.beginPath();
                    ctx.moveTo(g.x, g.top);
                    ctx.lineTo(g.x, g.top - 8);
                    ctx.stroke();
                });
                ctx.globalAlpha = 1;
            }

            // Closing lines — two short rows, well clear of everything above
            const close1P = progress(f, 330, 25);
            if (close1P > 0) {
                ctx.globalAlpha = close1P;
                ctx.fillStyle = '#059669';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Same fundamental → same pitch', W / 2, H - 24);
                ctx.globalAlpha = 1;
            }
            const close2P = progress(f, 365, 25);
            if (close2P > 0) {
                ctx.globalAlpha = close2P;
                ctx.fillStyle = '#1a1a6e';
                ctx.font = '9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Different harmonics above it → different timbre', W / 2, H - 10);
                ctx.globalAlpha = 1;
            }

            const phase = f < 130 ? 'Spectra' : f < 300 ? 'Compare' : f < 460 ? 'Timbre' : 'Complete';
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
