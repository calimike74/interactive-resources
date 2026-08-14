'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: L and R channels appear → dry shown on both (centred) → first repeat lands on R → chain alternates L-R-L-R with zigzag arrows → annotation
export default function PingPong() {
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
        const progress = (frame, start, dur) =>
            clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);

        const PHASE_1 = 20;   // channels appear with dry
        const PHASE_2 = 110;  // first repeat on R
        const PHASE_3 = 180;  // chain alternates L-R-L-R
        const PHASE_4 = 380;  // annotation fade

        const margin = { left: 60, right: 30 };
        const plotW = W - margin.left - margin.right;

        const lY = 110;
        const rY = 180;

        const dryX = margin.left + 30;

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
            ctx.fillText('Ping-Pong: repeats alternate between channels', W / 2, 20);
            ctx.globalAlpha = 1;

            // Channel baselines + labels
            const baseP = progress(f, PHASE_1, 25);
            if (baseP > 0) {
                ctx.globalAlpha = baseP;
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(margin.left, lY);
                ctx.lineTo(W - margin.right, lY);
                ctx.moveTo(margin.left, rY);
                ctx.lineTo(W - margin.right, rY);
                ctx.stroke();

                ctx.fillStyle = '#1a1a2e';
                ctx.font = 'bold 11px -apple-system, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText('L', margin.left - 12, lY + 4);
                ctx.fillText('R', margin.left - 12, rY + 4);
                ctx.globalAlpha = 1;
            }

            // Dry hit — appears equally on L and R (centred pan)
            if (f >= PHASE_1 + 15) {
                const dryP = progress(f, PHASE_1 + 15, 25);
                drawWavelet(ctx, dryX, lY, 20 * dryP, '#374151', 1);
                drawWavelet(ctx, dryX, rY, 20 * dryP, '#374151', 1);

                if (f < PHASE_2 + 20) {
                    const lblP = progress(f, PHASE_1 + 25, 25)
                        * clamp(1 - (f - (PHASE_2 + 15)) / 20, 0, 1);
                    ctx.globalAlpha = lblP;
                    ctx.fillStyle = '#6b7280';
                    ctx.font = 'italic 9px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('dry on both (centred)', dryX, rY + 38);
                    ctx.globalAlpha = 1;
                }
            }

            // Repeat chain — phase 2 introduces first repeat on R, phase 3 continues
            const repeatGap = 50; // px between repeats
            const maxRepeats = 5;
            for (let i = 1; i <= maxRepeats; i++) {
                const appearFrame = PHASE_2 + (i - 1) * 35;
                const p = progress(f, appearFrame, 25);
                if (p > 0) {
                    const x = dryX + i * repeatGap;
                    const y = i % 2 === 1 ? rY : lY; // first → R, then alternate
                    const decay = Math.pow(0.78, i - 1);
                    drawWavelet(ctx, x, y, 19 * p * decay, '#14b8a6', 0.9);
                }
            }

            // Zigzag arrows — phase 3+
            if (f >= PHASE_3) {
                const zigP = progress(f, PHASE_3, 40)
                    * clamp(1 - (f - (CYCLE - 60)) / 30, 0, 1);
                ctx.globalAlpha = zigP * 0.4;
                ctx.strokeStyle = '#14b8a6';
                ctx.lineWidth = 1.2;
                ctx.setLineDash([3, 3]);
                for (let i = 1; i <= maxRepeats; i++) {
                    const x1 = dryX + (i - 1) * repeatGap;
                    const x2 = dryX + i * repeatGap;
                    const y1 = i === 1 ? lY : (i - 1) % 2 === 1 ? rY : lY;
                    const y2 = i % 2 === 1 ? rY : lY;
                    ctx.beginPath();
                    ctx.moveTo(x1 + 12, y1 === lY ? y1 + 10 : y1 - 10);
                    ctx.lineTo(x2 - 12, y2 === lY ? y2 + 10 : y2 - 10);
                    ctx.stroke();
                }
                ctx.setLineDash([]);
                ctx.globalAlpha = 1;
            }

            // First-repeat label (phase 2)
            if (f >= PHASE_2 && f < PHASE_3 + 60) {
                const lblP = progress(f, PHASE_2 + 20, 20)
                    * clamp(1 - (f - (PHASE_3 + 40)) / 20, 0, 1);
                if (lblP > 0) {
                    ctx.globalAlpha = lblP;
                    ctx.fillStyle = '#14b8a6';
                    ctx.font = 'bold 9px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('1st repeat → R', dryX + repeatGap, rY - 30);
                    ctx.globalAlpha = 1;
                }
            }

            // Phase 4 summary annotation
            if (f >= PHASE_4) {
                const p4 = progress(f, PHASE_4, 30)
                    * clamp(1 - (f - (CYCLE - 60)) / 30, 0, 1);
                ctx.globalAlpha = p4;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 10px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('dry stays central · wet bounces L ⇄ R', W / 2, H - 30);
                ctx.globalAlpha = 1;
            }

            // Phase indicator + time axis
            const phase = f < PHASE_2 ? 'Dry centred'
                : f < PHASE_3 ? '1st repeat'
                : f < PHASE_4 ? 'Alternating'
                : 'Summary';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - 20, H - 10);
            ctx.textAlign = 'center';
            ctx.fillText('time →', W / 2, H - 48);

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
