'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: low-shelf boost draws first (flat plateau below its corner, smooth
// transition down to 0 dB above it) → high-shelf boost draws the mirror image (flat at 0 dB below
// its corner, plateau above it) → both held together so the shared "flat plateau, not a continued
// climb" behaviour — the thing that separates a shelf from a filter — reads clearly.
export default function ShelvingFilters() {
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
        const FREQ_MAX = 20000;
        const margin = { left: 46, right: 30 };
        const plotW = W - margin.left - margin.right;
        const plotY = 60;
        const plotH = 130;
        const baseY = plotY + plotH * 0.65; // 0 dB reference line
        const boostPx = plotH * 0.32; // pixel height of the +9 dB plateau

        const freqToX = (freq) =>
            margin.left + (Math.log10(freq / FREQ_MIN) / Math.log10(FREQ_MAX / FREQ_MIN)) * plotW;

        // Sourced corners: low-shelf 200 Hz from the eq-low-shelf-boost preset; high-shelf 8 kHz
        // from this row's own assessment answer ("a high shelf boost above 8 kHz").
        const lowCorner = 200;
        const highCorner = 8000;

        const shelfGain = (freq, corner, side) => {
            // side 'low': plateau below corner, transitions to 0 above it
            // side 'high': 0 below corner, transitions to plateau above it
            const ratio = Math.log10(freq / corner);
            const width = 0.6; // transition width in decades
            const t = clamp((side === 'low' ? -ratio : ratio) / width + 0.5, 0, 1);
            return t; // 0..1 fraction of the plateau
        };

        const drawShelf = (corner, side, color, alpha, drawP) => {
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            const steps = 120;
            for (let i = 0; i <= steps * drawP; i++) {
                const nx = i / steps;
                const freq = FREQ_MIN * Math.pow(FREQ_MAX / FREQ_MIN, nx);
                const t = shelfGain(freq, corner, side);
                const x = freqToX(freq);
                const y = baseY - t * boostPx;
                if (i === 0) ctx.moveTo(x, y);
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
            ctx.fillText('Shelving Filters', W / 2, 16);
            ctx.globalAlpha = 1;

            // 0 dB baseline
            const baseP = progress(f, 20, 25);
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
                ctx.fillText('0 dB', margin.left, baseY + 14);
                ctx.globalAlpha = 1;
            }

            // Frequency axis reference ticks
            if (baseP > 0) {
                ctx.globalAlpha = baseP * 0.7;
                ctx.fillStyle = '#9ca3af';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('20 Hz', margin.left, plotY + plotH + 14);
                ctx.textAlign = 'right';
                ctx.fillText('20 kHz', W - margin.right, plotY + plotH + 14);
                ctx.globalAlpha = 1;
            }

            // --- Phase 1 (40-190): low shelf ---
            const lowP = progress(f, 40, 100);
            const lowFade = f >= 220 ? 1 - progress(f, 220, 30) : 1;
            if (lowP > 0 && lowFade > 0) {
                drawShelf(lowCorner, 'low', '#9B7530', lowFade, lowP);
                if (lowP > 0.6) {
                    const lx = freqToX(lowCorner);
                    ctx.globalAlpha = lowFade * ((lowP - 0.6) / 0.4);
                    ctx.strokeStyle = '#9B7530';
                    ctx.lineWidth = 1;
                    ctx.setLineDash([2, 2]);
                    ctx.beginPath();
                    ctx.moveTo(lx, baseY - boostPx - 8);
                    ctx.lineTo(lx, baseY + 4);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.fillStyle = '#9B7530';
                    ctx.font = 'bold 9px -apple-system, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText('Low Shelf — corner 200 Hz', margin.left, plotY - 4);
                    ctx.font = '8px -apple-system, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText('plateau below · flat 0 dB above', margin.left, plotY + plotH + 30);
                    ctx.globalAlpha = 1;
                }
            }

            // --- Phase 2 (250-400): high shelf ---
            const highP = progress(f, 250, 100);
            if (highP > 0) {
                drawShelf(highCorner, 'high', '#0891b2', 1, highP);
                if (highP > 0.6) {
                    const hx = freqToX(highCorner);
                    ctx.globalAlpha = (highP - 0.6) / 0.4;
                    ctx.strokeStyle = '#0891b2';
                    ctx.lineWidth = 1;
                    ctx.setLineDash([2, 2]);
                    ctx.beginPath();
                    ctx.moveTo(hx, baseY - boostPx - 8);
                    ctx.lineTo(hx, baseY + 4);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.fillStyle = '#0891b2';
                    ctx.font = 'bold 9px -apple-system, sans-serif';
                    ctx.textAlign = 'right';
                    ctx.fillText('High Shelf — corner 8 kHz', W - margin.right, plotY - 4);
                    ctx.font = '8px -apple-system, sans-serif';
                    ctx.textAlign = 'right';
                    ctx.fillText('flat 0 dB below · plateau above', W - margin.right, plotY + plotH + 30);
                    ctx.globalAlpha = 1;
                }
            }

            // --- Phase 3 (420+): shared caption ---
            const capP = progress(f, 420, 40) * (f < CYCLE - 60 ? 1 : clamp(1 - (f - (CYCLE - 60)) / 30, 0, 1));
            if (capP > 0) {
                ctx.globalAlpha = capP;
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('A shelf holds its new level flat — a filter keeps removing', W / 2, H - 8);
                ctx.globalAlpha = 1;
            }

            const phase = f < 220 ? 'Low Shelf' : f < 420 ? 'High Shelf' : 'Both';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - margin.right, 16);

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
