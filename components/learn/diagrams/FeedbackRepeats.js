'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: dry hit → feedback chain cascades (with feedback-loop arrow) → clear canvas → multi-tap shows independent fixed taps → side-by-side comparison
export default function FeedbackRepeats() {
    const canvasRef = useRef(null);
    const frameRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvasRef.current) return;
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
        const progress = (frame, start, dur) =>
            clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);

        const margin = { left: 30, right: 30 };
        const plotW = W - margin.left - margin.right;

        const PHASE_1 = 20;   // dry on top timeline
        const PHASE_2 = 80;   // feedback chain cascades in
        const PHASE_3 = 240;  // multi-tap introduced on bottom
        const PHASE_4 = 380;  // comparison labels fade in

        const topY = 90;
        const botY = 210;

        const draw = () => {
            frameRef.current = (frameRef.current + 0.6) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            // Title
            const titleP = progress(f, 0, 25);
            ctx.globalAlpha = titleP;
            ctx.fillStyle = '#1a1a2e';
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Feedback & Number of Repeats', W / 2, 20);
            ctx.globalAlpha = 1;

            // Top baseline + label
            const topP = progress(f, 10, 25);
            if (topP > 0) {
                ctx.globalAlpha = topP;
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(margin.left + 40, topY);
                ctx.lineTo(W - margin.right, topY);
                ctx.stroke();

                ctx.fillStyle = '#14b8a6';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('FEEDBACK (single-tap)', margin.left + 40, topY - 16);
                ctx.globalAlpha = 1;
            }

            // === TOP: Feedback chain ===
            // Dry hit
            if (f >= PHASE_1) {
                const dryP = progress(f, PHASE_1, 25);
                drawWavelet(ctx, margin.left + 60, topY, 22 * dryP, '#374151', 1);
            }

            // 5 decaying repeats — each appears in sequence
            const repeatGap = 55;
            const repeatStart = PHASE_2;
            const perRepeat = 22; // frames between each repeat appearing
            for (let i = 1; i <= 5; i++) {
                const appearFrame = repeatStart + (i - 1) * perRepeat;
                const p = progress(f, appearFrame, 20);
                if (p > 0) {
                    const x = margin.left + 60 + i * repeatGap;
                    const decay = Math.pow(0.68, i);
                    drawWavelet(ctx, x, topY, 22 * p * decay, '#14b8a6', 0.9);
                }
            }

            // Feedback loop arrow (top) — appears during phase 2
            if (f >= PHASE_2 + 30 && f < PHASE_3) {
                const loopP = progress(f, PHASE_2 + 30, 30)
                    * clamp(1 - (f - (PHASE_3 - 25)) / 25, 0, 1);
                ctx.globalAlpha = loopP;

                // Loop above the last repeat back to feedback input
                const loopStartX = margin.left + 60 + 55;
                const loopEndX = margin.left + 60 + 110;
                const loopTopY = topY - 40;
                ctx.strokeStyle = '#14b8a6';
                ctx.lineWidth = 1.3;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(loopEndX, topY - 18);
                ctx.bezierCurveTo(
                    loopEndX, loopTopY,
                    loopStartX, loopTopY,
                    loopStartX, topY - 18
                );
                ctx.stroke();
                ctx.setLineDash([]);

                // Arrowhead on loop return
                ctx.fillStyle = '#14b8a6';
                ctx.beginPath();
                ctx.moveTo(loopStartX, topY - 18);
                ctx.lineTo(loopStartX - 3, topY - 25);
                ctx.lineTo(loopStartX + 3, topY - 25);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = '#14b8a6';
                ctx.font = 'italic 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('output → input', (loopStartX + loopEndX) / 2, loopTopY - 4);
                ctx.globalAlpha = 1;
            }

            // === BOTTOM: Multi-tap ===
            if (f >= PHASE_3) {
                const botP = progress(f, PHASE_3, 25);
                ctx.globalAlpha = botP;

                // Baseline + label
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(margin.left + 40, botY);
                ctx.lineTo(W - margin.right, botY);
                ctx.stroke();

                ctx.fillStyle = '#14b8a6';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('MULTI-TAP (independent taps)', margin.left + 40, botY - 16);

                // Dry hit
                drawWavelet(ctx, margin.left + 60, botY, 22, '#374151', 1);
                ctx.globalAlpha = 1;

                // Three independent taps at SAME amplitude (key distinction from feedback decay)
                const tapOffsets = [90, 160, 280]; // pixel offsets from dry — irregular spacing
                tapOffsets.forEach((offset, i) => {
                    const appearFrame = PHASE_3 + 25 + i * 25;
                    const p = progress(f, appearFrame, 25);
                    if (p > 0) {
                        const x = margin.left + 60 + offset;
                        drawWavelet(ctx, x, botY, 22 * p, '#14b8a6', 0.9);
                    }
                });

                // Tap-position tick marks above line
                tapOffsets.forEach((offset, i) => {
                    const appearFrame = PHASE_3 + 25 + i * 25;
                    const p = progress(f, appearFrame + 10, 20);
                    if (p > 0) {
                        ctx.globalAlpha = p * 0.6;
                        const x = margin.left + 60 + offset;
                        ctx.strokeStyle = '#14b8a6';
                        ctx.lineWidth = 1;
                        ctx.setLineDash([2, 2]);
                        ctx.beginPath();
                        ctx.moveTo(x, botY - 22);
                        ctx.lineTo(x, botY - 8);
                        ctx.stroke();
                        ctx.setLineDash([]);
                        ctx.fillStyle = '#14b8a6';
                        ctx.font = '8px -apple-system, sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillText(`tap ${i + 1}`, x, botY - 26);
                        ctx.globalAlpha = 1;
                    }
                });
            }

            // === PHASE 4: Comparison labels ===
            if (f >= PHASE_4) {
                const p4 = progress(f, PHASE_4, 30)
                    * clamp(1 - (f - (CYCLE - 60)) / 30, 0, 1);
                ctx.globalAlpha = p4;

                // Top annotation
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 9px -apple-system, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText('decaying chain', W - margin.right, topY + 40);

                // Bottom annotation
                ctx.fillText('equal level, fixed times', W - margin.right, botY + 40);

                ctx.globalAlpha = 1;
            }

            // Phase indicator
            const phase = f < PHASE_2 ? 'Dry'
                : f < PHASE_3 ? 'Feedback chain'
                : f < PHASE_4 ? 'Multi-tap'
                : 'Compare';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - 20, H - 10);

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

    return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', borderRadius: '0.75rem' }} />;
}

function drawWavelet(ctx, x, y, amplitude, color, alpha) {
    const prev = ctx.globalAlpha;
    ctx.globalAlpha = prev * alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const width = 18;
    for (let dx = -width; dx <= width; dx++) {
        const env = Math.exp(-Math.abs(dx) / 7);
        const yOffset = Math.sin(dx * 0.8) * amplitude * env;
        const px = x + dx;
        const py = y + yOffset;
        if (dx === -width) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.globalAlpha = prev;
}
