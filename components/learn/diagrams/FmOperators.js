'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: four operator boxes (oscillator + envelope, each) build in a vertical
// STACKED chain — each modulating the next — then physically rearrange (lerped positions) into a
// horizontal PARALLEL layout where each operator instead feeds straight into a shared output bus.
// Same four boxes, same four letters — only the routing (the algorithm) changes.
export default function FmOperators() {
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

        const CYCLE = 820;
        let animId;

        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const easeInOut = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);
        const lerp = (a, b, t) => a + (b - a) * t;
        const drawRR = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };

        const INDIGO = '#1a1a6e';
        const VIOLET = '#7c3aed';

        const boxW = 74;
        const boxH = 46;
        const letters = ['A', 'B', 'C', 'D'];

        // Stacked (chain) layout: vertical column, A at top modulating down to D
        const stackedX = W / 2 - boxW / 2;
        const stackedPositions = [0, 1, 2, 3].map((i) => ({ x: stackedX, y: 30 + i * 56 }));

        // Parallel layout: horizontal row, each straight down to a shared output bus
        const parallelGap = 18;
        const parallelTotalW = 4 * boxW + 3 * parallelGap;
        const parallelStartX = (W - parallelTotalW) / 2;
        const parallelPositions = [0, 1, 2, 3].map((i) => ({ x: parallelStartX + i * (boxW + parallelGap), y: 60 }));

        const drawOperatorBox = (x, y, letter, color, alpha) => {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            drawRR(x, y, boxW, boxH, 6);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = color;
            ctx.font = 'bold 12px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`OP ${letter}`, x + boxW / 2, y + 18);

            // Tiny oscillator + envelope icon
            const iconY = y + 34;
            const iconW = boxW - 20;
            const iconX = x + 10;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(iconX, iconY);
            ctx.lineTo(iconX + iconW * 0.15, iconY - 6);
            ctx.lineTo(iconX + iconW * 0.35, iconY - 1);
            ctx.lineTo(iconX + iconW * 0.6, iconY - 1);
            ctx.lineTo(iconX + iconW, iconY + 3);
            ctx.stroke();

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
            ctx.fillStyle = INDIGO;
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Same Four Operators, Different Algorithm', W / 2, 18);
            ctx.globalAlpha = 1;

            // Timeline: 30-260 build stacked, 260-320 hold, 380-540 rearrange, 540-780 hold parallel
            const buildP = progress(f, 30, 40); // boxes fade in
            const rearrangeRaw = clamp((f - 380) / 160, 0, 1);
            const rearrangeP = easeInOut(rearrangeRaw);
            const isRearranging = f >= 380 && f < 540;
            const showChainArrows = f < 460; // chain arrows fade out partway through the move
            const showParallelArrows = f >= 420; // parallel arrows fade in partway through the move
            const chainArrowAlpha = f < 380 ? 1 : clamp(1 - (f - 380) / 80, 0, 1);
            const parallelArrowAlpha = f < 420 ? 0 : clamp((f - 420) / 100, 0, 1);

            if (buildP <= 0) {
                animId = requestAnimationFrame(draw);
                return;
            }

            // Interpolated position per operator
            const positions = letters.map((_, i) => ({
                x: lerp(stackedPositions[i].x, parallelPositions[i].x, rearrangeP),
                y: lerp(stackedPositions[i].y, parallelPositions[i].y, rearrangeP),
            }));

            // Chain arrows (A→B→C→D, each modulating the next) — vertical, fade out on rearrange
            if (chainArrowAlpha > 0) {
                for (let i = 0; i < 3; i++) {
                    const from = positions[i];
                    const to = positions[i + 1];
                    const ax = from.x + boxW / 2;
                    const ay1 = from.y + boxH;
                    const ay2 = to.y;
                    if (ay2 - ay1 < 6) continue; // boxes have merged horizontally, skip degenerate arrow
                    ctx.globalAlpha = buildP * chainArrowAlpha;
                    ctx.strokeStyle = VIOLET;
                    ctx.lineWidth = 1.3;
                    ctx.beginPath();
                    ctx.moveTo(ax, ay1 + 2);
                    ctx.lineTo(ax, ay2 - 2);
                    ctx.stroke();
                    ctx.fillStyle = VIOLET;
                    ctx.beginPath();
                    ctx.moveTo(ax, ay2 - 2);
                    ctx.lineTo(ax - 3, ay2 - 8);
                    ctx.lineTo(ax + 3, ay2 - 8);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
            }

            // Operator boxes
            letters.forEach((letter, i) => {
                drawOperatorBox(positions[i].x, positions[i].y, letter, INDIGO, buildP);
            });

            // Parallel output bus + straight arrows — fade in once rearranged
            if (parallelArrowAlpha > 0) {
                const busY = parallelPositions[0].y + boxH + 46;
                const busX = parallelStartX;
                const busW = parallelTotalW;
                ctx.globalAlpha = buildP * parallelArrowAlpha;

                positions.forEach((p) => {
                    const ax = p.x + boxW / 2;
                    ctx.strokeStyle = '#9ca3af';
                    ctx.lineWidth = 1.2;
                    ctx.beginPath();
                    ctx.moveTo(ax, p.y + boxH + 2);
                    ctx.lineTo(ax, busY - 2);
                    ctx.stroke();
                    ctx.fillStyle = '#9ca3af';
                    ctx.beginPath();
                    ctx.moveTo(ax, busY - 2);
                    ctx.lineTo(ax - 3, busY - 8);
                    ctx.lineTo(ax + 3, busY - 8);
                    ctx.fill();
                });

                ctx.fillStyle = '#fff';
                ctx.strokeStyle = INDIGO;
                ctx.lineWidth = 1.5;
                drawRR(busX, busY, busW, 24, 5);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = INDIGO;
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('OUTPUT', busX + busW / 2, busY + 16);

                ctx.globalAlpha = 1;
            }

            // Caption
            const captionP = progress(f, 60, 30);
            if (captionP > 0) {
                ctx.globalAlpha = captionP;
                ctx.fillStyle = '#6b7280';
                ctx.font = '9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                const caption = rearrangeP < 0.5
                    ? 'Stacked algorithm: A modulates B modulates C modulates D'
                    : 'Parallel algorithm: each operator adds straight to the output';
                ctx.fillText(caption, W / 2, H - 20);
                ctx.globalAlpha = 1;
            }

            // Phase indicator
            const phase = f < 380 ? 'Stacked' : isRearranging ? 'Rearranging' : 'Parallel';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - 20, H - 6);

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
