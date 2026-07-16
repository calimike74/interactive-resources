'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: a boost bell rises above 0 dB with a bouncy overshoot (energetic,
// "adding") → fades and a cut bell settles below 0 dB with a slow, steady ease (calm,
// "removing") → both redrawn together at equal size so the visual weight difference — bounce vs
// settle — carries the row's point that the cut is the calmer default.
export default function BoostVsCutPhilosophy() {
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
        // Overshoot ease for the boost — reads as energetic, a little unstable
        const easeOutBack = (t) => {
            const c1 = 1.70158;
            const c3 = c1 + 1;
            return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
        };
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);
        const progressBack = (frame, start, dur) => clamp(easeOutBack(clamp((frame - start) / dur, 0, 1)), 0, 1);

        const margin = { left: 40, right: 40 };
        const plotW = W - margin.left - margin.right;
        const baseY = 150;
        const bellW = plotW * 0.5;
        const bellCenter = W / 2;
        const maxAmp = 55;

        const bellShape = (px, halfWidth) => Math.exp(-Math.pow(px / (halfWidth * 0.45), 2));

        const drawBell = (amp, color, alpha) => {
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            for (let px = -bellW / 2; px <= bellW / 2; px++) {
                const shape = bellShape(px, bellW);
                const y = baseY - shape * amp;
                const x = bellCenter + px;
                if (px === -bellW / 2) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            ctx.lineTo(bellCenter + bellW / 2, baseY);
            ctx.lineTo(bellCenter - bellW / 2, baseY);
            ctx.closePath();
            ctx.fillStyle = color + '1a';
            ctx.fill();
            ctx.globalAlpha = 1;
        };

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
            ctx.fillText('Boost vs Cut Philosophy', W / 2, 18);
            ctx.globalAlpha = 1;

            // 0 dB baseline
            const baseP = progress(f, 15, 25);
            if (baseP > 0) {
                ctx.globalAlpha = baseP;
                ctx.strokeStyle = '#d1d5db';
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(margin.left, baseY);
                ctx.lineTo(W - margin.right, baseY);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = '#9ca3af';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('0 dB', margin.left, baseY - 5);
                ctx.globalAlpha = 1;
            }

            // --- Phase 1 (40-160): Boost — bouncy overshoot, warm colour ---
            const boostP = progressBack(f, 40, 100);
            const boostFade = f >= 200 ? 1 - progress(f, 200, 40) : 1;
            if (boostP > 0 && boostFade > 0) {
                drawBell(maxAmp * clamp(boostP, 0, 1.15), '#f97316', boostFade);
                const labelP = progress(f, 60, 40) * boostFade;
                if (labelP > 0) {
                    ctx.globalAlpha = labelP;
                    ctx.fillStyle = '#f97316';
                    ctx.font = 'bold 10px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('Boost — adds energy', bellCenter, baseY - maxAmp - 24);
                    ctx.font = '9px -apple-system, sans-serif';
                    ctx.fillText('can create a new problem', bellCenter, baseY - maxAmp - 10);
                    ctx.globalAlpha = 1;
                }
            }

            // --- Phase 2 (240-360): Cut — slow, steady settle, cool colour ---
            const cutP = progress(f, 240, 120);
            if (cutP > 0) {
                drawBell(-maxAmp * cutP, '#2563EB', cutP);
                const labelP = progress(f, 280, 40);
                if (labelP > 0) {
                    ctx.globalAlpha = labelP;
                    ctx.fillStyle = '#2563EB';
                    ctx.font = 'bold 10px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('Cut — removes energy', bellCenter, baseY + maxAmp + 26);
                    ctx.font = '9px -apple-system, sans-serif';
                    ctx.fillText('the safer corrective move', bellCenter, baseY + maxAmp + 40);
                    ctx.globalAlpha = 1;
                }
            }

            // --- Phase 3 (400-520): boost returns alongside the settled cut, working-rule caption ---
            const bothP = progress(f, 400, 50);
            if (bothP > 0) {
                drawBell(maxAmp * 0.85 * bothP, '#f97316', bothP * 0.7);

                const ruleP = progress(f, 450, 40) * (f < CYCLE - 60 ? 1 : clamp(1 - (f - (CYCLE - 60)) / 30, 0, 1));
                if (ruleP > 0) {
                    ctx.globalAlpha = ruleP;
                    ctx.fillStyle = '#374151';
                    ctx.font = 'bold 10px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('Cut to fix. Boost to enhance.', W / 2, H - 16);
                    ctx.globalAlpha = 1;
                }
            }

            const phase = f < 200 ? 'Boost' : f < 400 ? 'Cut' : 'Compare';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - margin.right, H - 6);

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
