'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: 1:1 line → threshold marker → ratio slopes animate through 2:1, 4:1, 8:1
export default function ThresholdRatio() {
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

        const draw = () => {
            frameRef.current = (frameRef.current + 1) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);

            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            const margin = { left: 55, right: 25, top: 25, bottom: 45 };
            const plotW = W - margin.left - margin.right;
            const plotH = H - margin.top - margin.bottom;
            const originX = margin.left;
            const originY = margin.top + plotH;

            // Axes
            ctx.strokeStyle = '#d1d5db';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(originX, margin.top);
            ctx.lineTo(originX, originY);
            ctx.lineTo(originX + plotW, originY);
            ctx.stroke();

            // Axis labels
            ctx.fillStyle = '#9ca3af';
            ctx.font = '9px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Input Level (dB)', originX + plotW / 2, H - 6);
            ctx.save();
            ctx.translate(12, margin.top + plotH / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText('Output Level (dB)', 0, 0);
            ctx.restore();

            // dB markers along axes
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            for (let dB = 0; dB <= 40; dB += 10) {
                const frac = dB / 40;
                const x = originX + frac * plotW;
                const y = originY - frac * plotH;
                ctx.fillStyle = '#d1d5db';
                ctx.fillText(`-${40 - dB}`, originX - 4, y + 3);
                ctx.textAlign = 'center';
                ctx.fillText(`-${40 - dB}`, x, originY + 12);
                ctx.textAlign = 'right';
            }

            // Threshold position: -20 dB means 0.5 along axis
            const threshFrac = 0.5;
            const threshX = originX + threshFrac * plotW;
            const threshY = originY - threshFrac * plotH;

            // --- Phase 1 (0-80): 1:1 unity line ---
            const p1 = progress(f, 0, 50);

            if (p1 > 0) {
                ctx.globalAlpha = p1;
                ctx.strokeStyle = '#9ca3af';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(originX, originY);
                const endFrac = p1;
                ctx.lineTo(originX + endFrac * plotW, originY - endFrac * plotH);
                ctx.stroke();
                ctx.setLineDash([]);

                // 1:1 label
                ctx.fillStyle = '#9ca3af';
                ctx.font = '9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('1:1 (no compression)', originX + plotW * 0.55, margin.top + 18);
                ctx.globalAlpha = 1;
            }

            // --- Phase 2 (80-140): Threshold line appears ---
            const p2 = progress(f, 80, 40);

            if (p2 > 0) {
                ctx.globalAlpha = p2;
                ctx.strokeStyle = '#e85d75';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(threshX, margin.top);
                ctx.lineTo(threshX, originY);
                ctx.stroke();
                ctx.setLineDash([]);

                // Threshold label
                ctx.fillStyle = '#e85d75';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Threshold', threshX, margin.top + 12);
                ctx.fillText('−20 dB', threshX, margin.top + 23);
                ctx.globalAlpha = 1;
            }

            // --- Phase 3 (150-420): Ratio lines animate through 2:1, 4:1, 8:1 ---
            const ratios = [
                { ratio: 2, label: '2:1', start: 150, dur: 70 },
                { ratio: 4, label: '4:1', start: 240, dur: 70 },
                { ratio: 8, label: '8:1', start: 330, dur: 70 },
            ];

            ratios.forEach(({ ratio, label, start, dur }, idx) => {
                const pRatio = progress(f, start, dur);
                // Fade out previous ratios when next appears
                const nextStart = idx < ratios.length - 1 ? ratios[idx + 1].start : CYCLE;
                const fadeAlpha = idx < ratios.length - 1 ? 1 - progress(f, nextStart - 10, 30) : 1;
                const alpha = pRatio * fadeAlpha;

                if (alpha > 0.01) {
                    ctx.globalAlpha = alpha;

                    // Below threshold: 1:1 line (solid)
                    ctx.strokeStyle = '#e85d75';
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.moveTo(originX, originY);
                    ctx.lineTo(threshX, threshY);
                    ctx.stroke();

                    // Above threshold: compressed slope
                    const slope = 1 / ratio;
                    ctx.beginPath();
                    ctx.moveTo(threshX, threshY);
                    const remainFrac = 1 - threshFrac;
                    const outFrac = remainFrac * slope;
                    ctx.lineTo(threshX + remainFrac * plotW * pRatio, threshY - outFrac * plotH * pRatio);
                    ctx.stroke();

                    // Ratio label
                    ctx.fillStyle = '#e85d75';
                    ctx.font = 'bold 11px -apple-system, sans-serif';
                    ctx.textAlign = 'left';
                    const labelX = threshX + remainFrac * plotW * 0.5 * pRatio + 8;
                    const labelY = threshY - outFrac * plotH * 0.5 * pRatio - 6;
                    ctx.fillText(label, labelX, labelY);

                    ctx.globalAlpha = 1;
                }
            });

            // --- Phase 4 (380+): Example annotation ---
            const p4 = progress(f, 400, 40);

            if (p4 > 0) {
                ctx.globalAlpha = p4;

                // Example: 8dB above threshold at 4:1 = 2dB out
                ctx.fillStyle = '#374151';
                ctx.font = '9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Example: 8 dB above threshold → only 1 dB out (8:1)', W / 2, H - 18);

                ctx.globalAlpha = 1;
            }

            // Phase indicator
            const phase = f < 80 ? 'Unity' : f < 150 ? 'Threshold' : f < 400 ? 'Ratios' : 'Example';
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
