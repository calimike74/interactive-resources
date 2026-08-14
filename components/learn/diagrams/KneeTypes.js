'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: hard knee curve → soft knee curve → overlaid comparison
export default function KneeTypes() {
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

        const CYCLE = 460;
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

            const margin = { left: 50, right: 25, top: 25, bottom: 45 };
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
            ctx.fillText('Input (dB)', originX + plotW / 2, H - 6);
            ctx.save();
            ctx.translate(12, margin.top + plotH / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText('Output (dB)', 0, 0);
            ctx.restore();

            // Threshold at 50% of the plot
            const threshFrac = 0.5;
            const ratio = 4; // 4:1

            // 1:1 reference line (faint)
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(originX, originY);
            ctx.lineTo(originX + plotW, margin.top);
            ctx.stroke();
            ctx.setLineDash([]);

            // Threshold marker
            const threshX = originX + threshFrac * plotW;
            ctx.strokeStyle = '#d1d5db';
            ctx.lineWidth = 0.5;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.moveTo(threshX, margin.top);
            ctx.lineTo(threshX, originY);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Threshold', threshX, originY + 12);

            // Hard knee transfer function
            const hardKnee = (inputFrac) => {
                if (inputFrac <= threshFrac) return inputFrac;
                const excess = inputFrac - threshFrac;
                return threshFrac + excess / ratio;
            };

            // Soft knee transfer function
            const kneeWidth = 0.15;
            const softKnee = (inputFrac) => {
                if (inputFrac <= threshFrac - kneeWidth / 2) return inputFrac;
                if (inputFrac >= threshFrac + kneeWidth / 2) {
                    const excess = inputFrac - threshFrac;
                    return threshFrac + excess / ratio;
                }
                // In the knee region — smooth transition
                const kneePos = (inputFrac - (threshFrac - kneeWidth / 2)) / kneeWidth;
                const smoothRatio = 1 + (1 / ratio - 1) * kneePos * kneePos;
                const excess = inputFrac - (threshFrac - kneeWidth / 2);
                return (threshFrac - kneeWidth / 2) + excess * (1 + (smoothRatio - 1) * kneePos);
            };

            const drawCurve = (fn, color, lineWidth, alpha) => {
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = color;
                ctx.lineWidth = lineWidth;
                ctx.beginPath();
                for (let i = 0; i <= 100; i++) {
                    const inputFrac = i / 100;
                    const outputFrac = fn(inputFrac);
                    const x = originX + inputFrac * plotW;
                    const y = originY - outputFrac * plotH;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
                ctx.globalAlpha = 1;
            };

            // --- Phase 1 (0-120): Hard knee ---
            const p1 = progress(f, 0, 80);

            if (p1 > 0) {
                drawCurve(hardKnee, '#e85d75', 2.5, p1);

                ctx.globalAlpha = p1;
                ctx.fillStyle = '#e85d75';
                ctx.font = 'bold 10px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('Hard Knee', originX + plotW * 0.6, margin.top + 18);

                // Angle annotation at the knee point
                const annotP = progress(f, 60, 30);
                if (annotP > 0) {
                    ctx.globalAlpha = annotP;
                    ctx.fillStyle = '#e85d75';
                    ctx.font = '9px -apple-system, sans-serif';
                    ctx.fillText('Sharp angle', originX + plotW * 0.6, margin.top + 32);
                    ctx.fillStyle = '#6b7280';
                    ctx.fillText('Precise: can sound obvious', originX + plotW * 0.6, margin.top + 44);

                    // Circle at knee point
                    ctx.strokeStyle = '#e85d75';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.arc(threshX, originY - threshFrac * plotH, 6, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.globalAlpha = 1;
            }

            // --- Phase 2 (150-280): Soft knee ---
            const p2 = progress(f, 150, 80);
            const p1Fade = f >= 150 ? 1 - progress(f, 150, 40) : 1;

            // Fade hard knee labels but keep curve faintly
            if (p1 > 0 && f >= 150) {
                drawCurve(hardKnee, '#e85d75', 1.5, p1Fade * 0.3);
            }

            if (p2 > 0) {
                drawCurve(softKnee, '#2563EB', 2.5, p2);

                ctx.globalAlpha = p2;
                ctx.fillStyle = '#2563EB';
                ctx.font = 'bold 10px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('Soft Knee', originX + plotW * 0.05, margin.top + 18);

                const annotP2 = progress(f, 200, 30);
                if (annotP2 > 0) {
                    ctx.globalAlpha = annotP2;
                    ctx.fillStyle = '#2563EB';
                    ctx.font = '9px -apple-system, sans-serif';
                    ctx.fillText('Gradual curve', originX + plotW * 0.05, margin.top + 32);
                    ctx.fillStyle = '#6b7280';
                    ctx.fillText('Musical: more transparent', originX + plotW * 0.05, margin.top + 44);

                    // Bracket showing knee region
                    ctx.strokeStyle = 'rgba(37, 99, 235, 0.3)';
                    ctx.lineWidth = 1;
                    const kStart = originX + (threshFrac - kneeWidth / 2) * plotW;
                    const kEnd = originX + (threshFrac + kneeWidth / 2) * plotW;
                    ctx.fillStyle = 'rgba(37, 99, 235, 0.06)';
                    ctx.fillRect(kStart, margin.top, kEnd - kStart, plotH);
                }
                ctx.globalAlpha = 1;
            }

            // --- Phase 3 (310-420): Both overlaid for comparison ---
            const p3 = progress(f, 310, 50);

            if (p3 > 0) {
                drawCurve(hardKnee, '#e85d75', 2, p3 * 0.8);
                drawCurve(softKnee, '#2563EB', 2, p3 * 0.8);

                ctx.globalAlpha = p3;
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Same ratio (4:1), different transition', W / 2, H - 18);
                ctx.globalAlpha = 1;
            }

            // Phase indicator
            const phase = f < 150 ? 'Hard' : f < 310 ? 'Soft' : 'Compare';
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
