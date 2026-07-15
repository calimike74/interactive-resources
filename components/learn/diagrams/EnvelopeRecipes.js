'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: three small ADSR traces build in side by side — pad, pluck, bass stab —
// each with its own colour and shape, then a shared playhead sweeps all three at once so the
// contrast in attack/decay/sustain/release reads as cause-and-effect, not three unrelated shapes.
export default function EnvelopeRecipes() {
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

        // Recipes: { attack, decay, sustain, release } as normalized durations/level (0-1)
        const recipes = [
            {
                name: 'Pad', sub: 'Slow A · High S · Long R', color: '#1a1a6e',
                a: 0.30, d: 0.12, s: 0.75, sustainDur: 0.28, r: 0.30, drawFrame: 40,
            },
            {
                name: 'Pluck', sub: 'Instant A · Zero S', color: '#059669',
                a: 0.02, d: 0.16, s: 0, sustainDur: 0.02, r: 0.14, drawFrame: 130,
            },
            {
                name: 'Bass Stab', sub: 'Fast A · Short R', color: '#DC2626',
                a: 0.04, d: 0.24, s: 0.15, sustainDur: 0.10, r: 0.18, drawFrame: 220,
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
        const plotTop = 62;
        const plotH = 100;
        const plotBase = plotTop + plotH;

        const draw = () => {
            frameRef.current = (frameRef.current + 1) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);

            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            // Title
            ctx.fillStyle = '#1a1a6e';
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Three Envelope Recipes', W / 2, 20);

            const playP = f >= 340 && f < 460 ? clamp((f - 340) / 120, 0, 1) : (f >= 460 ? 1 : null);

            recipes.forEach((p, i) => {
                const panelX = leftMargin + i * (panelW + gap);
                const panelCenter = panelX + panelW / 2;
                const plotLeft = panelX;
                const plotRight = panelX + panelW;
                const plotW = panelW;

                const drawP = progress(f, p.drawFrame, 70);
                if (drawP <= 0) return;

                // Panel name + subtitle
                ctx.globalAlpha = drawP;
                ctx.fillStyle = p.color;
                ctx.font = 'bold 11px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(p.name, panelCenter, 40);

                ctx.fillStyle = '#6b7280';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.fillText(p.sub, panelCenter, 51);

                // Base + max guide lines
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(plotLeft, plotBase);
                ctx.lineTo(plotRight, plotBase);
                ctx.stroke();

                ctx.setLineDash([2, 3]);
                ctx.strokeStyle = '#d1d5db';
                ctx.beginPath();
                ctx.moveTo(plotLeft, plotTop);
                ctx.lineTo(plotRight, plotTop);
                ctx.stroke();
                ctx.setLineDash([]);

                // Envelope curve, drawing left-to-right
                const totalPoints = Math.floor(plotW * drawP);
                ctx.fillStyle = p.color + '12';
                ctx.beginPath();
                ctx.moveTo(plotLeft, plotBase);
                for (let px = 0; px <= totalPoints; px++) {
                    const t = px / plotW;
                    ctx.lineTo(plotLeft + px, plotBase - envVal(p, t) * plotH);
                }
                ctx.lineTo(plotLeft + totalPoints, plotBase);
                ctx.fill();

                ctx.strokeStyle = p.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let px = 0; px <= totalPoints; px++) {
                    const t = px / plotW;
                    const y = plotBase - envVal(p, t) * plotH;
                    if (px === 0) ctx.moveTo(plotLeft + px, y);
                    else ctx.lineTo(plotLeft + px, y);
                }
                ctx.stroke();
                ctx.globalAlpha = 1;

                // Shared playhead, once all three panels are drawn
                if (playP !== null && drawP >= 1) {
                    const val = envVal(p, playP);
                    const px = plotLeft + playP * plotW;
                    const py = plotBase - val * plotH;

                    ctx.globalAlpha = 0.25;
                    ctx.strokeStyle = p.color;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(px, plotTop);
                    ctx.lineTo(px, plotBase);
                    ctx.stroke();

                    ctx.globalAlpha = 1;
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(px, py, 3.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            // Time axis label, centred under all three panels
            const axisP = progress(f, 280, 30);
            if (axisP > 0) {
                ctx.globalAlpha = axisP;
                ctx.fillStyle = '#9ca3af';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Time →', W / 2, plotBase + 16);
                ctx.globalAlpha = 1;
            }

            // Phase indicator
            const phase = f < 130 ? 'Pad' : f < 220 ? '+ Pluck' : f < 340 ? '+ Bass Stab' : f < 460 ? 'Playing' : 'Complete';
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
