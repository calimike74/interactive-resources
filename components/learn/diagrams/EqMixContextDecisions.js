'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: two instrument spectral silhouettes appear, overlapping heavily in the
// low end → the clash zone is highlighted ("fighting for the same space") → a high-pass filter
// clears rumble below the bass part's own range (an illustrative kick/bass example — the row
// itself only says "clearing rumble below an instrument's range with a high-pass filter", it does
// not name kick/bass or 90 Hz) → the two shapes settle into mostly separate territory, each with
// room of its own.
export default function EqMixContextDecisions() {
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

        const FREQ_MIN = 20;
        const FREQ_MAX = 5000;
        const margin = { left: 34, right: 34 };
        const plotW = W - margin.left - margin.right;
        const plotY = 46;
        const plotH = 140;
        const baseY = plotY + plotH;

        const freqToX = (freq) =>
            margin.left + (Math.log10(freq / FREQ_MIN) / Math.log10(FREQ_MAX / FREQ_MIN)) * plotW;

        // Kick: sub-focused hill. Bass: wider hill that originally overlaps the kick's territory
        // until the high-pass filter clears its own rumble — kick/bass is an illustrative example
        // of the row's general statement, not a detail the row itself names.
        const kick = { center: freqToX(70), width: plotW * 0.12, peak: plotH * 0.62, color: '#1a1a6e', name: 'Kick' };
        const bassFull = { center: freqToX(180), width: plotW * 0.34, peak: plotH * 0.5, color: '#9B7530', name: 'Bass' };

        const hpCutoffFreq = 90;
        const hpCutoffX = freqToX(hpCutoffFreq);

        const hillHeight = (x, shape, hpCutX) => {
            const d = (x - shape.center) / (shape.width * 0.5);
            let h = shape.peak * Math.exp(-d * d);
            if (hpCutX !== null && x < hpCutX) {
                // high-pass roll-off below the cut-off
                const t = clamp((hpCutX - x) / (shape.width * 0.25), 0, 1);
                h *= 1 - t;
            }
            return h;
        };

        const drawHill = (shape, hpCutX, alpha, color) => {
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.moveTo(margin.left, baseY);
            for (let px = 0; px <= plotW; px++) {
                const x = margin.left + px;
                const h = hillHeight(x, shape, hpCutX);
                const y = baseY - h;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(margin.left + plotW, baseY);
            ctx.closePath();
            ctx.fillStyle = color + '2e';
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let px = 0; px <= plotW; px++) {
                const x = margin.left + px;
                const h = hillHeight(x, shape, hpCutX);
                const y = baseY - h;
                if (px === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
        };

        const draw = () => {
            frameRef.current = (frameRef.current + 1) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            const titleP = progress(f, 0, 20);
            ctx.globalAlpha = titleP;
            ctx.fillStyle = '#1a1a6e';
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('EQ Decisions in a Mix', W / 2, 14);
            ctx.globalAlpha = 1;

            ctx.strokeStyle = '#d1d5db';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(margin.left, baseY);
            ctx.lineTo(margin.left + plotW, baseY);
            ctx.stroke();

            const isFixed = f >= 340;
            const hpProgress = isFixed ? progress(f, 340, 60) : 0;
            const hpCutX = isFixed ? hpCutoffX : null;

            // Phase 1 (30-140): both shapes appear, fully overlapping
            const appearP = progress(f, 30, 60);
            if (appearP > 0) {
                // Interpolate the HP roll-off in as it phases in, applied only to the bass shape
                const bassHp = hpProgress > 0 ? hpCutoffX : null;
                drawHill(kick, null, appearP, kick.color);
                drawHill(bassFull, hpProgress > 0 ? bassHp : null, appearP, bassFull.color);
            }

            // Instrument name labels — placed directly above each hill's own peak, comfortably
            // clear of both curves (10px above the tallest point either shape reaches at that x)
            if (appearP > 0) {
                ctx.globalAlpha = appearP;
                ctx.fillStyle = kick.color;
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(kick.name, kick.center, baseY - kick.peak - 12);
                ctx.fillStyle = bassFull.color;
                ctx.fillText(bassFull.name, bassFull.center, baseY - bassFull.peak - 12);
                ctx.globalAlpha = 1;
            }

            // Phase 2 (150-260): clash zone highlighted
            const clashP = progress(f, 150, 60) * (f < 300 ? 1 : clamp(1 - (f - 300) / 30, 0, 1));
            if (clashP > 0) {
                const overlapLeft = Math.max(kick.center - kick.width * 0.5, bassFull.center - bassFull.width * 0.5);
                const overlapRight = Math.min(kick.center + kick.width * 0.5, bassFull.center + bassFull.width * 0.5);
                if (overlapRight > overlapLeft) {
                    ctx.globalAlpha = clashP * 0.18;
                    ctx.fillStyle = '#DC2626';
                    ctx.fillRect(overlapLeft, plotY, overlapRight - overlapLeft, plotH);
                    ctx.globalAlpha = clashP;
                    ctx.fillStyle = '#DC2626';
                    ctx.font = 'bold 9px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('Fighting for the same space', (overlapLeft + overlapRight) / 2, plotY - 6);
                    ctx.globalAlpha = 1;
                }
            }

            // Phase 3 (340-460): HPF sweeps in, clearing the bass's low end
            if (isFixed) {
                ctx.globalAlpha = hpProgress;
                ctx.strokeStyle = '#059669';
                ctx.lineWidth = 1;
                ctx.setLineDash([2, 2]);
                ctx.beginPath();
                ctx.moveTo(hpCutoffX, plotY);
                ctx.lineTo(hpCutoffX, baseY);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = '#059669';
                ctx.font = 'bold 8px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('HPF 90 Hz clears bass rumble', hpCutoffX + 6, plotY + 12);
                ctx.globalAlpha = 1;
            }

            // Final caption
            const capP = progress(f, 440, 40) * (f < CYCLE - 60 ? 1 : clamp(1 - (f - (CYCLE - 60)) / 30, 0, 1));
            if (capP > 0) {
                ctx.globalAlpha = capP;
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('A mix-context decision: each part earns its own room', W / 2, H - 8);
                ctx.globalAlpha = 1;
            }

            const phase = f < 150 ? 'Overlap' : f < 340 ? 'Clash' : f < 440 ? 'Clear' : 'Resolved';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - margin.right, 14);

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
