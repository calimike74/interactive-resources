'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: four waveforms appear one by one with harmonic labels
export default function OscillatorWaveforms() {
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

        const waveforms = [
            {
                name: 'Sawtooth',
                harmonics: 'All harmonics',
                color: '#1a1a6e',
                fn: (x) => {
                    // Sawtooth from harmonics
                    let v = 0;
                    for (let n = 1; n <= 12; n++) v += Math.sin(n * x * Math.PI * 2) / n;
                    return v * 0.6;
                },
            },
            {
                name: 'Square',
                harmonics: 'Odd harmonics',
                color: '#9B7530',
                fn: (x) => {
                    let v = 0;
                    for (let n = 1; n <= 12; n += 2) v += Math.sin(n * x * Math.PI * 2) / n;
                    return v * 0.6;
                },
            },
            {
                name: 'Triangle',
                harmonics: 'Weak harmonics',
                color: '#0891b2',
                fn: (x) => {
                    let v = 0;
                    for (let n = 1; n <= 12; n += 2) {
                        const sign = ((n - 1) / 2) % 2 === 0 ? 1 : -1;
                        v += sign * Math.sin(n * x * Math.PI * 2) / (n * n);
                    }
                    return v * 0.6 * 8 / (Math.PI * Math.PI);
                },
            },
            {
                name: 'Sine',
                harmonics: 'Fundamental only',
                color: '#059669',
                fn: (x) => Math.sin(x * Math.PI * 2) * 0.6,
            },
        ];

        const draw = () => {
            frameRef.current = (frameRef.current + 1) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);

            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            const cols = 2;
            const rows = 2;
            const cellW = (W - 40) / cols;
            const cellH = (H - 50) / rows;
            const padX = 20;
            const padY = 35;

            // Title
            const titleP = progress(f, 0, 25);
            ctx.globalAlpha = titleP;
            ctx.fillStyle = '#1a1a6e';
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Oscillator Waveforms', W / 2, 18);
            ctx.globalAlpha = 1;

            waveforms.forEach((wave, i) => {
                const col = i % cols;
                const row = Math.floor(i / cols);
                const cx = padX + col * cellW;
                const cy = padY + row * cellH;
                const waveW = cellW - 20;
                const waveH = cellH - 36;
                const centerY = cy + 20 + waveH / 2;

                // Each waveform appears in sequence
                const appear = progress(f, 20 + i * 60, 40);
                if (appear <= 0) return;

                ctx.globalAlpha = appear;

                // Cell background
                ctx.fillStyle = '#fff';
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(cx + 4, cy + 4, cellW - 8, cellH - 8, 6);
                ctx.fill();
                ctx.stroke();

                // Zero line
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 0.5;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(cx + 12, centerY);
                ctx.lineTo(cx + 12 + waveW, centerY);
                ctx.stroke();
                ctx.setLineDash([]);

                // Draw waveform — animate drawing from left to right
                const drawProgress = progress(f, 30 + i * 60, 50);
                ctx.strokeStyle = wave.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                const numPoints = Math.floor(waveW * drawProgress);
                for (let px = 0; px <= numPoints; px++) {
                    const nx = px / waveW; // 0-1 across two cycles
                    const val = wave.fn(nx * 2);
                    const y = centerY - val * (waveH / 2) * 0.8;
                    if (px === 0) ctx.moveTo(cx + 12 + px, y);
                    else ctx.lineTo(cx + 12 + px, y);
                }
                ctx.stroke();

                // Name label
                ctx.fillStyle = wave.color;
                ctx.font = 'bold 10px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(wave.name, cx + 12, cy + 18);

                // Harmonics label — appears slightly after waveform
                const labelP = progress(f, 60 + i * 60, 25);
                if (labelP > 0) {
                    ctx.globalAlpha = labelP;
                    ctx.fillStyle = '#6b7280';
                    ctx.font = '9px -apple-system, sans-serif';
                    ctx.textAlign = 'right';
                    ctx.fillText(wave.harmonics, cx + cellW - 12, cy + 18);
                }

                ctx.globalAlpha = 1;
            });

            // Brightness indicator label after all are shown
            const summaryP = progress(f, 300, 30);
            if (summaryP > 0) {
                ctx.globalAlpha = summaryP;
                ctx.fillStyle = '#1a1a6e';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Brightest', padX + cellW / 2, H - 6);

                // Arrow
                ctx.strokeStyle = '#9ca3af';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(padX + cellW, H - 10);
                ctx.lineTo(W - padX - cellW, H - 10);
                ctx.stroke();
                // Arrowhead
                ctx.beginPath();
                ctx.moveTo(W - padX - cellW - 4, H - 14);
                ctx.lineTo(W - padX - cellW, H - 10);
                ctx.lineTo(W - padX - cellW - 4, H - 6);
                ctx.stroke();

                ctx.fillStyle = '#059669';
                ctx.fillText('Darkest', W - padX - cellW / 2, H - 6);
                ctx.globalAlpha = 1;
            }

            // Phase indicator
            const phase = f < 80 ? 'Sawtooth' : f < 140 ? 'Square' : f < 200 ? 'Triangle' : f < 260 ? 'Sine' : 'Complete';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - 20, 18);

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
