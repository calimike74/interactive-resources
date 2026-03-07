'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: original signal → compressed (lower) → make-up gain applied → result comparison
export default function MakeupGain() {
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

        const CYCLE = 500;
        let animId;

        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);

        // Level meter bar data — represents signal levels over time
        const barCount = 40;
        const levels = [];
        for (let i = 0; i < barCount; i++) {
            const t = i / barCount;
            let lvl;
            if (t < 0.15) lvl = 0.3 + Math.sin(t * 30) * 0.08;
            else if (t < 0.2) lvl = 0.3 + (0.95 - 0.3) * ((t - 0.15) / 0.05);
            else if (t < 0.35) lvl = 0.95 - (t - 0.2) * 1.5;
            else if (t < 0.5) lvl = 0.35 + Math.sin(t * 25) * 0.06;
            else if (t < 0.55) lvl = 0.35 + (0.85 - 0.35) * ((t - 0.5) / 0.05);
            else if (t < 0.7) lvl = 0.85 - (t - 0.55) * 1.2;
            else if (t < 0.85) lvl = 0.25 + Math.sin(t * 35) * 0.05;
            else lvl = 0.25 + (0.7 - 0.25) * ((t - 0.85) / 0.15);
            levels.push(clamp(lvl, 0.1, 1));
        }

        const drawMeter = (x, y, w, h, data, boostAmount, color, alpha) => {
            ctx.globalAlpha = alpha;
            const barW = w / data.length - 1;
            for (let i = 0; i < data.length; i++) {
                const lvl = clamp(data[i] + boostAmount, 0, 1);
                const barH = lvl * h;
                const bx = x + (i / data.length) * w;

                // Color: green for low, yellow for mid, red for high
                if (lvl > 0.85) ctx.fillStyle = '#DC2626';
                else if (lvl > 0.6) ctx.fillStyle = color;
                else ctx.fillStyle = '#6b7280';

                ctx.fillRect(bx, y + h - barH, barW, barH);
            }
            ctx.globalAlpha = 1;
        };

        const draw = () => {
            frameRef.current = (frameRef.current + 1) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);

            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            const margin = { left: 20, right: 20, top: 10, bottom: 20 };
            const plotW = W - margin.left - margin.right;
            const rowH = 55;
            const gap = 14;

            // --- Phase 1 (0-80): Original signal ---
            const p1 = progress(f, 0, 60);
            const y1 = margin.top + 14;

            if (p1 > 0) {
                ctx.globalAlpha = p1;
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('1. Original', margin.left, y1);
                ctx.globalAlpha = 1;

                drawMeter(margin.left + 80, y1 - 8, plotW - 90, rowH, levels, 0, '#e85d75', p1);

                // Peak marker
                ctx.globalAlpha = p1;
                ctx.fillStyle = '#DC2626';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText('Peaks hit 0 dB', W - margin.right, y1);
                ctx.globalAlpha = 1;
            }

            // --- Phase 2 (100-200): After compression (reduced) ---
            const p2 = progress(f, 100, 60);
            const y2 = y1 + rowH + gap;

            // Compressed levels: reduce everything above threshold
            const compressedLevels = levels.map(v => {
                const thresh = 0.5;
                if (v > thresh) return thresh + (v - thresh) * 0.25;
                return v;
            });

            if (p2 > 0) {
                ctx.globalAlpha = p2;
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('2. Compressed', margin.left, y2);
                ctx.globalAlpha = 1;

                drawMeter(margin.left + 80, y2 - 8, plotW - 90, rowH, compressedLevels, 0, '#e85d75', p2);

                // Annotation: overall level is now lower
                ctx.globalAlpha = p2;
                ctx.fillStyle = '#6b7280';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText('Peaks tamed — but quieter overall', W - margin.right, y2);
                ctx.globalAlpha = 1;
            }

            // --- Phase 3 (240-360): Make-up gain applied ---
            const p3 = progress(f, 240, 60);
            const y3 = y2 + rowH + gap;
            const makeupAmount = 0.25;

            if (p3 > 0) {
                ctx.globalAlpha = p3;
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('3. + Make-Up Gain', margin.left, y3);
                ctx.globalAlpha = 1;

                drawMeter(margin.left + 80, y3 - 8, plotW - 90, rowH, compressedLevels, makeupAmount * p3, '#16a34a', p3);

                // Arrow showing boost
                const arrowAppear = progress(f, 280, 30);
                if (arrowAppear > 0) {
                    ctx.globalAlpha = arrowAppear;
                    ctx.strokeStyle = '#16a34a';
                    ctx.lineWidth = 1.5;
                    const arrowX = margin.left + 72;
                    ctx.beginPath();
                    ctx.moveTo(arrowX, y3 + rowH - 10);
                    ctx.lineTo(arrowX, y3 - 4);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(arrowX - 4, y3 + 2);
                    ctx.lineTo(arrowX, y3 - 4);
                    ctx.lineTo(arrowX + 4, y3 + 2);
                    ctx.fill();

                    ctx.fillStyle = '#16a34a';
                    ctx.font = 'bold 8px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('+6 dB', arrowX, y3 + rowH + 4);
                    ctx.globalAlpha = 1;
                }
            }

            // --- Phase 4 (380+): Result annotation ---
            const p4 = progress(f, 380, 40);

            if (p4 > 0) {
                ctx.globalAlpha = p4;
                ctx.fillStyle = '#16a34a';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Quiet parts louder — peaks still controlled — sounds "louder"', W / 2, H - 8);
                ctx.globalAlpha = 1;
            }

            // Phase indicator
            const phase = f < 100 ? 'Original' : f < 240 ? 'Compressed' : f < 380 ? 'Make-Up' : 'Result';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - margin.right, H - 6);

            // Fade out at end
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
