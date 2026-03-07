'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: flat response → problem frequencies appear → EQ curve shapes to fix
export default function FrequencySpectrum() {
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

        const CYCLE = 420; // 14 seconds at 30fps
        let animId;

        // Easing
        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) => clamp(easeOut((frame - start) / dur), 0, 1);

        const draw = () => {
            frameRef.current = (frameRef.current + 1) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);

            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            const margin = { left: 45, right: 20, top: 12, bottom: 28 };
            const plotW = W - margin.left - margin.right;
            const plotH = H - margin.top - margin.bottom;
            const zeroY = margin.top + plotH / 2;

            // Grid
            ctx.strokeStyle = '#eee';
            ctx.lineWidth = 0.5;
            for (let i = 0; i <= 4; i++) {
                const y = margin.top + (i / 4) * plotH;
                ctx.beginPath();
                ctx.moveTo(margin.left, y);
                ctx.lineTo(W - margin.right, y);
                ctx.stroke();
            }

            // Axis labels
            ctx.fillStyle = '#9ca3af';
            ctx.font = '9px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ['20', '100', '500', '1k', '5k', '20k'].forEach((label, i) => {
                ctx.fillText(label, margin.left + (i / 5) * plotW, H - 6);
            });

            // Zero line
            ctx.strokeStyle = '#d1d5db';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(margin.left, zeroY);
            ctx.lineTo(W - margin.right, zeroY);
            ctx.stroke();
            ctx.setLineDash([]);

            // --- Phase 1 (0-60): "Original signal" label + flat line ---
            const p1 = progress(f, 0, 40);

            if (p1 > 0) {
                ctx.globalAlpha = p1;
                ctx.strokeStyle = '#9ca3af';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(margin.left, zeroY);
                ctx.lineTo(margin.left + plotW * p1, zeroY);
                ctx.stroke();

                // Label
                ctx.fillStyle = '#6b7280';
                ctx.font = '10px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('Original signal — flat response', margin.left + 4, zeroY - 12);
                ctx.globalAlpha = 1;
            }

            // --- Phase 2 (70-180): Problem frequencies emerge ---
            const p2 = progress(f, 70, 60);

            // Problem: muddy low-mids and harsh peak
            const muddyCenter = 0.25; // ~200Hz region
            const harshCenter = 0.65; // ~4kHz region

            if (p2 > 0) {
                // Draw the problematic spectrum
                ctx.strokeStyle = '#DC2626';
                ctx.lineWidth = 2;
                ctx.globalAlpha = p2 * 0.7;
                ctx.beginPath();
                for (let px = 0; px <= plotW; px++) {
                    const nx = px / plotW;
                    const muddy = 35 * Math.exp(-Math.pow((nx - muddyCenter) * 6, 2));
                    const harsh = 25 * Math.exp(-Math.pow((nx - harshCenter) * 8, 2));
                    const y = zeroY - (muddy + harsh) * p2;
                    if (px === 0) ctx.moveTo(margin.left + px, y);
                    else ctx.lineTo(margin.left + px, y);
                }
                ctx.stroke();
                ctx.globalAlpha = 1;

                // Problem region highlights
                const highlightRegion = (center, width, label, labelY) => {
                    const x1 = margin.left + (center - width) * plotW;
                    const x2 = margin.left + (center + width) * plotW;
                    ctx.fillStyle = `rgba(220, 38, 38, ${0.06 * p2})`;
                    ctx.fillRect(x1, margin.top, x2 - x1, plotH);

                    ctx.fillStyle = `rgba(220, 38, 38, ${p2})`;
                    ctx.font = 'bold 9px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(label, margin.left + center * plotW, labelY);
                };

                highlightRegion(muddyCenter, 0.08, 'Muddy', margin.top + 18);
                highlightRegion(harshCenter, 0.06, 'Harsh', margin.top + 18);
            }

            // --- Phase 3 (200-340): EQ correction curve appears ---
            const p3 = progress(f, 200, 80);

            if (p3 > 0) {
                // Correction: cut muddy, cut harsh
                ctx.strokeStyle = '#f97316';
                ctx.lineWidth = 2.5;
                ctx.globalAlpha = p3;
                ctx.beginPath();
                for (let px = 0; px <= plotW; px++) {
                    const nx = px / plotW;
                    const cutMuddy = -30 * Math.exp(-Math.pow((nx - muddyCenter) * 6, 2));
                    const cutHarsh = -20 * Math.exp(-Math.pow((nx - harshCenter) * 8, 2));
                    const boost = 15 * Math.exp(-Math.pow((nx - 0.45) * 5, 2)); // gentle presence boost
                    const total = (cutMuddy + cutHarsh + boost) * p3;
                    const y = zeroY - total;
                    if (px === 0) ctx.moveTo(margin.left + px, y);
                    else ctx.lineTo(margin.left + px, y);
                }
                ctx.stroke();
                ctx.globalAlpha = 1;

                // EQ correction labels
                const labelAlpha = progress(f, 260, 30);
                if (labelAlpha > 0) {
                    ctx.globalAlpha = labelAlpha;

                    // Cut labels
                    ctx.fillStyle = '#f97316';
                    ctx.font = 'bold 9px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('Cut −6dB', margin.left + muddyCenter * plotW, zeroY + 30 * p3 + 14);
                    ctx.fillText('Cut −4dB', margin.left + harshCenter * plotW, zeroY + 22 * p3 + 14);

                    // Boost label
                    ctx.fillText('+3dB presence', margin.left + 0.45 * plotW, zeroY - 18 * p3 - 6);

                    // Arrows
                    ctx.strokeStyle = '#f97316';
                    ctx.lineWidth = 1;
                    const drawArrow = (x, y1, y2) => {
                        ctx.beginPath();
                        ctx.moveTo(x, y1);
                        ctx.lineTo(x, y2);
                        ctx.stroke();
                        const dir = y2 > y1 ? 1 : -1;
                        ctx.beginPath();
                        ctx.moveTo(x - 3, y2 - 4 * dir);
                        ctx.lineTo(x, y2);
                        ctx.lineTo(x + 3, y2 - 4 * dir);
                        ctx.stroke();
                    };
                    drawArrow(margin.left + muddyCenter * plotW, zeroY + 4, zeroY + 28 * p3);
                    drawArrow(margin.left + harshCenter * plotW, zeroY + 4, zeroY + 20 * p3);
                    drawArrow(margin.left + 0.45 * plotW, zeroY - 4, zeroY - 16 * p3);

                    ctx.globalAlpha = 1;
                }
            }

            // --- Phase 4 (340-420): Hold complete picture, then fade ---
            const fadeOut = f > CYCLE - 40 ? progress(f, CYCLE - 40, 40) : 0;
            if (fadeOut > 0) {
                ctx.fillStyle = `rgba(245, 244, 242, ${fadeOut * 0.9})`;
                ctx.fillRect(0, 0, W, H);
            }

            // Phase indicator
            const phase = f < 70 ? 'Signal' : f < 200 ? 'Problem' : f < 340 ? 'EQ Fix' : 'Complete';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - margin.right, H - 6);

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
