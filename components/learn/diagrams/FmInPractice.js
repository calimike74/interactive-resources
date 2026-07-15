'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: three recipe cards build in side by side — Bell, Electric Piano, Bass —
// each stamped with its modulator:carrier ratio and a small sideband pattern (reusing the same
// harmonic/inharmonic bar logic as FmRatios), then its own envelope shape draws underneath so
// "ratio + envelope character" read together as one recipe per sound, exactly as row 4 asks.
export default function FmInPractice() {
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
        const drawRR = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };

        const cards = [
            {
                name: 'Bell', ratioLabel: '≈3.5 · inharmonic', color: '#9B7530', drawFrame: 40,
                sidebands: [2, 3, 5, 7, 8], // uneven, clustered slot indices (0-8) around center 4
                env: { a: 0.03, d: 0.55, s: 0, sustainDur: 0.02, r: 0.35 },
            },
            {
                name: 'Electric Piano', ratioLabel: '2.0 · harmonic', color: '#1a1a6e', drawFrame: 150,
                sidebands: [1, 2, 4, 6, 7], // evenly spaced either side of center 4
                env: { a: 0.02, d: 0.30, s: 0.22, sustainDur: 0.20, r: 0.22 },
            },
            {
                name: 'Bass', ratioLabel: '1.0 · harmonic', color: '#DC2626', drawFrame: 260,
                sidebands: [3, 4, 5], // tight cluster right around the carrier
                env: { a: 0.01, d: 0.18, s: 0.12, sustainDur: 0.08, r: 0.12 },
            },
        ];

        const envVal = (p, t) => {
            if (t < p.a) return t / p.a;
            if (t < p.a + p.d) return 1 - (1 - p.s) * ((t - p.a) / p.d);
            if (t < p.a + p.d + p.sustainDur) return p.s;
            if (t < p.a + p.d + p.sustainDur + p.r) return p.s * (1 - (t - p.a - p.d - p.sustainDur) / p.r);
            return 0;
        };

        const panelW = 130;
        const gap = 15;
        const leftMargin = 30;

        const draw = () => {
            frameRef.current = (frameRef.current + 1) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            ctx.fillStyle = '#1a1a6e';
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Three FM Recipes', W / 2, 18);

            const playP = f >= 380 && f < 480 ? clamp((f - 380) / 100, 0, 1) : (f >= 480 ? 1 : null);

            cards.forEach((card) => {
                const idx = cards.indexOf(card);
                const panelX = leftMargin + idx * (panelW + gap);
                const panelCenter = panelX + panelW / 2;

                const drawP = progress(f, card.drawFrame, 70);
                if (drawP <= 0) return;
                ctx.globalAlpha = drawP;

                // Card frame
                ctx.fillStyle = '#fff';
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 1;
                drawRR(panelX, 30, panelW, 210, 8);
                ctx.fill();
                ctx.stroke();

                // Name + ratio
                ctx.fillStyle = card.color;
                ctx.font = 'bold 11px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(card.name, panelCenter, 48);
                ctx.font = '8px -apple-system, sans-serif';
                ctx.fillStyle = '#6b7280';
                ctx.fillText(card.ratioLabel, panelCenter, 60);

                // Mini spectrum: 9 slots, carrier at slot 4
                const specTop = 70;
                const specH = 34;
                const specBase = specTop + specH;
                const slots = 9;
                const slotW = (panelW - 20) / slots;
                const barW = slotW - 3;
                const specLeft = panelX + 10;

                for (let s = 0; s < slots; s++) {
                    const bx = specLeft + s * slotW;
                    const isCarrier = s === 4;
                    const isSideband = card.sidebands.includes(s);
                    if (!isCarrier && !isSideband) continue;
                    const h = isCarrier ? specH * 0.85 : specH * (0.3 + 0.25 * (1 - Math.abs(s - 4) / 4));
                    ctx.fillStyle = isCarrier ? '#1a1a6e' : card.color;
                    ctx.fillRect(bx, specBase - h, barW, h);
                }

                // Envelope curve
                const plotTop = 130;
                const plotH = 78;
                const plotBase = plotTop + plotH;
                const plotLeft = panelX + 10;
                const plotRight = panelX + panelW - 10;
                const plotW = plotRight - plotLeft;

                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(plotLeft, plotBase);
                ctx.lineTo(plotRight, plotBase);
                ctx.stroke();

                ctx.fillStyle = '#9ca3af';
                ctx.font = '7px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('envelope', plotLeft, plotTop - 6);

                const totalPoints = Math.floor(plotW * drawP);
                ctx.fillStyle = card.color + '15';
                ctx.beginPath();
                ctx.moveTo(plotLeft, plotBase);
                for (let px = 0; px <= totalPoints; px++) {
                    const t = px / plotW;
                    ctx.lineTo(plotLeft + px, plotBase - envVal(card.env, t) * plotH);
                }
                ctx.lineTo(plotLeft + totalPoints, plotBase);
                ctx.fill();

                ctx.strokeStyle = card.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let px = 0; px <= totalPoints; px++) {
                    const t = px / plotW;
                    const y = plotBase - envVal(card.env, t) * plotH;
                    if (px === 0) ctx.moveTo(plotLeft + px, y);
                    else ctx.lineTo(plotLeft + px, y);
                }
                ctx.stroke();

                // Shared playhead once fully drawn
                if (playP !== null && drawP >= 1) {
                    const val = envVal(card.env, playP);
                    const px = plotLeft + playP * plotW;
                    const py = plotBase - val * plotH;
                    ctx.globalAlpha = drawP * 0.25;
                    ctx.strokeStyle = card.color;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(px, plotTop);
                    ctx.lineTo(px, plotBase);
                    ctx.stroke();
                    ctx.globalAlpha = drawP;
                    ctx.fillStyle = card.color;
                    ctx.beginPath();
                    ctx.arc(px, py, 3, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.globalAlpha = 1;
            });

            // Phase indicator
            const phase = f < 150 ? 'Bell' : f < 260 ? '+ E-Piano' : f < 380 ? '+ Bass' : f < 480 ? 'Playing' : 'Complete';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - 20, H - 8);

            // Fade out
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
