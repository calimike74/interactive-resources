'use client';

import { useEffect, useRef } from 'react';

// Five straight, non-crossing horizontal pairings — two columns, five parallel
// rows. Each row lives entirely at its own fixed y (centers 62/98/134/170/206,
// step 36px), so adjacent rows are separated by 36px while each pill is only
// 22px tall (11px half-height) — a 14px vertical gap between any pill and its
// neighbour's row, meaning no row's connector or pill can ever reach another
// row's label. Left pills (x 20-170) and right pills (x 350-460) hold their own
// labels inside their opaque fills; each connector is a straight line strictly
// between x=170 and x=350 at its row's fixed y, so it can never cross a label —
// labels are either inside a pill (masked) or outside the 170-350 gap entirely.
export default function ParameterBridge() {
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

        const CYCLE = 480;
        let animId;

        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);

        const rows = [
            { left: 'RT60', right: 'decay (RT60)' },
            { left: 'gap before onset', right: 'pre-delay' },
            { left: 'absorption', right: 'damping' },
            { left: 'scatter', right: 'diffusion' },
            { left: 'distance', right: 'wet / dry' },
        ];
        const rowY = (i) => 62 + i * 36;
        const leftPill = { x: 20, w: 150, h: 22 };
        const rightPill = { x: 350, w: 110, h: 22 };
        const connX0 = leftPill.x + leftPill.w; // 170
        const connX1 = rightPill.x; // 350

        const drawPill = (x, w, y, label, stroke, alpha) => {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = stroke;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.roundRect(x, y - 11, w, 22, 11);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = stroke;
            ctx.font = 'bold 8px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(label, x + w / 2, y + 3);
            ctx.globalAlpha = 1;
        };

        const PHASE_HEADER = 15;
        const ROW_START = 30;
        const ROW_STAGGER = 34;
        const ROW_DUR = 24;
        const PHASE_CAPTION = ROW_START + 4 * ROW_STAGGER + 40;

        const draw = () => {
            frameRef.current = (frameRef.current + 0.6) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            const titleP = progress(f, 0, 20);
            ctx.globalAlpha = titleP;
            ctx.fillStyle = '#1a1a2e';
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('The Parameter Bridge', W / 2, 16);
            ctx.globalAlpha = 1;

            const headP = progress(f, PHASE_HEADER, 18);
            if (headP > 0) {
                ctx.globalAlpha = headP;
                ctx.fillStyle = '#6b7280';
                ctx.font = 'bold 7px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('MEASURED IN THE ROOM', leftPill.x + leftPill.w / 2, 37);
                ctx.fillText('BECOMES THIS KNOB', rightPill.x + rightPill.w / 2, 37);
                ctx.globalAlpha = 1;
            }

            rows.forEach((row, i) => {
                const y = rowY(i);
                const start = ROW_START + i * ROW_STAGGER;
                const pRow = progress(f, start, ROW_DUR);
                if (pRow <= 0) return;

                ctx.globalAlpha = pRow;
                ctx.strokeStyle = '#374151';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(connX0, y);
                ctx.lineTo(connX1, y);
                ctx.stroke();
                ctx.globalAlpha = 1;

                drawPill(leftPill.x, leftPill.w, y, row.left, '#14b8a6', pRow);
                drawPill(rightPill.x, rightPill.w, y, row.right, '#e85d75', pRow);

                // small travelling dot per row, phase-offset so rows don't pulse in sync
                if (pRow >= 1) {
                    const period = 100;
                    const t = ((f - start - ROW_DUR + i * 14) % period) / period;
                    const dx = connX0 + (connX1 - connX0) * t;
                    ctx.fillStyle = '#9ca3af';
                    ctx.beginPath();
                    ctx.arc(dx, y, 2.2, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            const capP = progress(f, PHASE_CAPTION, 25);
            if (capP > 0) {
                ctx.globalAlpha = capP;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Every acoustic idea becomes a knob — same measurement, now adjustable', W / 2, 240);
                ctx.globalAlpha = 1;
            }

            const phase = f < ROW_START + ROW_STAGGER ? 'RT60 -> decay'
                : f < ROW_START + 2 * ROW_STAGGER ? 'gap -> pre-delay'
                : f < ROW_START + 3 * ROW_STAGGER ? 'absorption -> damping'
                : f < ROW_START + 4 * ROW_STAGGER ? 'scatter -> diffusion'
                : 'distance -> wet/dry';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - 20, H - 8);

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
