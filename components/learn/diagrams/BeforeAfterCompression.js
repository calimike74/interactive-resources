'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: uncompressed waveform → threshold + gain reduction → compressed waveform → labels
export default function BeforeAfterCompression() {
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

        // Generate a waveform with varying amplitude
        const sampleCount = 300;
        const waveform = [];
        for (let i = 0; i < sampleCount; i++) {
            const t = i / sampleCount;
            // Envelope: varies between quiet and loud
            let env;
            if (t < 0.1) env = 0.2;
            else if (t < 0.15) env = 0.2 + (0.9 - 0.2) * ((t - 0.1) / 0.05);
            else if (t < 0.3) env = 0.9 - (t - 0.15) * 2;
            else if (t < 0.45) env = 0.2 + Math.sin(t * 40) * 0.05;
            else if (t < 0.5) env = 0.2 + (0.8 - 0.2) * ((t - 0.45) / 0.05);
            else if (t < 0.65) env = 0.8 - (t - 0.5) * 1.5;
            else if (t < 0.78) env = 0.15 + Math.sin(t * 50) * 0.04;
            else if (t < 0.83) env = 0.15 + (0.95 - 0.15) * ((t - 0.78) / 0.05);
            else if (t < 0.92) env = 0.95 - (t - 0.83) * 4;
            else env = 0.15;
            // Add some high-frequency detail
            const detail = Math.sin(i * 0.8) * 0.03 + Math.sin(i * 2.1) * 0.02;
            waveform.push(clamp(env + detail, 0.05, 1));
        }

        const drawWave = (x, y, w, h, data, color, alpha) => {
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (let i = 0; i < data.length; i++) {
                const px = x + (i / data.length) * w;
                const val = data[i];
                // Draw as mirrored waveform (positive and negative)
                const topY = y + (h / 2) - val * (h / 2);
                if (i === 0) ctx.moveTo(px, topY);
                else ctx.lineTo(px, topY);
            }
            ctx.stroke();
            // Mirror
            ctx.beginPath();
            for (let i = 0; i < data.length; i++) {
                const px = x + (i / data.length) * w;
                const val = data[i];
                const botY = y + (h / 2) + val * (h / 2);
                if (i === 0) ctx.moveTo(px, botY);
                else ctx.lineTo(px, botY);
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

            const margin = { left: 20, right: 20, top: 10, bottom: 20 };
            const plotW = W - margin.left - margin.right;
            const waveH = 95;

            // --- Phase 1 (0-80): Uncompressed waveform on top ---
            const p1 = progress(f, 0, 60);
            const topWaveY = margin.top + 14;

            if (p1 > 0) {
                ctx.globalAlpha = p1;
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('Before', margin.left, topWaveY + 2);
                ctx.globalAlpha = 1;

                const visibleData = waveform.slice(0, Math.floor(p1 * waveform.length));
                drawWave(margin.left, topWaveY + 4, plotW, waveH, visibleData, '#9ca3af', p1 * 0.7);

                // Center line
                ctx.globalAlpha = p1 * 0.3;
                ctx.strokeStyle = '#d1d5db';
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(margin.left, topWaveY + 4 + waveH / 2);
                ctx.lineTo(margin.left + plotW, topWaveY + 4 + waveH / 2);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            // --- Phase 2 (80-160): Dynamic range bracket ---
            const p2 = progress(f, 80, 40);

            if (p2 > 0) {
                ctx.globalAlpha = p2;

                // Bracket on right side
                const bracketX = W - margin.right - 8;
                const topBound = topWaveY + 8;
                const botBound = topWaveY + waveH;

                ctx.strokeStyle = '#e85d75';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(bracketX - 5, topBound);
                ctx.lineTo(bracketX, topBound);
                ctx.lineTo(bracketX, botBound);
                ctx.lineTo(bracketX - 5, botBound);
                ctx.stroke();

                ctx.fillStyle = '#e85d75';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText('Wide', bracketX - 8, topWaveY + waveH / 2 - 2);
                ctx.fillText('range', bracketX - 8, topWaveY + waveH / 2 + 8);

                ctx.globalAlpha = 1;
            }

            // --- Phase 3 (160-280): Threshold line + processing indicator ---
            const p3 = progress(f, 160, 40);

            if (p3 > 0) {
                ctx.globalAlpha = p3;

                // Threshold line on the before waveform
                const threshLevel = 0.4;
                const threshTopY = topWaveY + 4 + (waveH / 2) * (1 - threshLevel);
                const threshBotY = topWaveY + 4 + (waveH / 2) * (1 + threshLevel);

                ctx.strokeStyle = '#e85d75';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(margin.left, threshTopY);
                ctx.lineTo(margin.left + plotW, threshTopY);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(margin.left, threshBotY);
                ctx.lineTo(margin.left + plotW, threshBotY);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.fillStyle = '#e85d75';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('Threshold', margin.left + 2, threshTopY - 3);

                // Compressor processing arrow
                const arrowP = progress(f, 190, 30);
                if (arrowP > 0) {
                    ctx.globalAlpha = arrowP;
                    const arrowY = topWaveY + waveH + 12;
                    ctx.fillStyle = '#e85d75';
                    ctx.font = 'bold 9px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('▼  Compressor  ▼', W / 2, arrowY);
                }

                ctx.globalAlpha = 1;
            }

            // --- Phase 4 (240-400): Compressed waveform below ---
            const p4 = progress(f, 240, 60);
            const botWaveY = topWaveY + waveH + 26;

            // Compressed + make-up gain waveform
            const compWaveform = waveform.map(v => {
                const thresh = 0.4;
                let comp = v;
                if (comp > thresh) comp = thresh + (comp - thresh) * 0.25;
                return clamp(comp + 0.18, 0.05, 0.85); // make-up gain
            });

            if (p4 > 0) {
                ctx.globalAlpha = p4;
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('After', margin.left, botWaveY + 2);
                ctx.globalAlpha = 1;

                const visibleData = compWaveform.slice(0, Math.floor(p4 * compWaveform.length));
                drawWave(margin.left, botWaveY + 4, plotW, waveH, visibleData, '#e85d75', p4 * 0.7);

                // Center line
                ctx.globalAlpha = p4 * 0.3;
                ctx.strokeStyle = '#d1d5db';
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(margin.left, botWaveY + 4 + waveH / 2);
                ctx.lineTo(margin.left + plotW, botWaveY + 4 + waveH / 2);
                ctx.stroke();
                ctx.globalAlpha = 1;

                // Controlled range bracket
                const bracketP = progress(f, 300, 30);
                if (bracketP > 0) {
                    ctx.globalAlpha = bracketP;
                    const bracketX = W - margin.right - 8;
                    const topBound = botWaveY + 18;
                    const botBound = botWaveY + waveH - 8;

                    ctx.strokeStyle = '#16a34a';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(bracketX - 5, topBound);
                    ctx.lineTo(bracketX, topBound);
                    ctx.lineTo(bracketX, botBound);
                    ctx.lineTo(bracketX - 5, botBound);
                    ctx.stroke();

                    ctx.fillStyle = '#16a34a';
                    ctx.font = '8px -apple-system, sans-serif';
                    ctx.textAlign = 'right';
                    ctx.fillText('Controlled', bracketX - 8, botWaveY + waveH / 2 - 2);
                    ctx.fillText('range', bracketX - 8, botWaveY + waveH / 2 + 8);

                    ctx.globalAlpha = 1;
                }
            }

            // --- Phase 5 (380+): Summary ---
            const p5 = progress(f, 380, 40);

            if (p5 > 0) {
                ctx.globalAlpha = p5;
                ctx.fillStyle = '#16a34a';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Consistent level — sits better in the mix', W / 2, H - 6);
                ctx.globalAlpha = 1;
            }

            // Phase indicator
            const phase = f < 80 ? 'Before' : f < 160 ? 'Range' : f < 240 ? 'Process' : f < 380 ? 'After' : 'Result';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - margin.right, margin.top + 6);

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
