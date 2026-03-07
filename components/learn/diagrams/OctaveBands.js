'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: axis appears → first band → second band doubles → bracket + ×2 → all bands cascade
export default function OctaveBands() {
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

        const octaves = [
            { freq: 31.25, label: '31' },
            { freq: 62.5, label: '63' },
            { freq: 125, label: '125' },
            { freq: 250, label: '250' },
            { freq: 500, label: '500' },
            { freq: 1000, label: '1k' },
            { freq: 2000, label: '2k' },
            { freq: 4000, label: '4k' },
            { freq: 8000, label: '8k' },
            { freq: 16000, label: '16k' },
        ];

        const margin = 40;
        const lineY = H / 2 + 20;
        const usableW = W - margin * 2;
        const minLog = Math.log2(octaves[0].freq);
        const maxLog = Math.log2(octaves[octaves.length - 1].freq);
        const getX = (freq) => margin + ((Math.log2(freq) - minLog) / (maxLog - minLog)) * usableW;

        const draw = () => {
            frameRef.current = (frameRef.current + 1) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);

            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            // --- Phase 1 (0-40): Axis line draws in ---
            const axisP = progress(f, 0, 40);
            if (axisP > 0) {
                ctx.strokeStyle = '#d1d5db';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(margin, lineY);
                ctx.lineTo(margin + usableW * axisP, lineY);
                ctx.stroke();
            }

            // --- Phase 2 (50-200): Bands appear one by one ---
            octaves.forEach((band, i) => {
                const bandP = progress(f, 50 + i * 12, 20);
                if (bandP <= 0) return;

                const x = getX(band.freq);

                ctx.globalAlpha = bandP;

                // Tick
                ctx.strokeStyle = '#9ca3af';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x, lineY - 10 * bandP);
                ctx.lineTo(x, lineY + 10 * bandP);
                ctx.stroke();

                // Dot
                ctx.fillStyle = '#d1d5db';
                ctx.beginPath();
                ctx.arc(x, lineY, 3, 0, Math.PI * 2);
                ctx.fill();

                // Label
                ctx.fillStyle = '#6b7280';
                ctx.font = '9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(band.label + 'Hz', x, lineY + 26);

                ctx.globalAlpha = 1;
            });

            // --- Phase 3 (220-420): Highlight pairs sequentially with ×2 brackets ---
            const pairStart = 220;
            const pairDur = 45; // frames per pair
            const numPairs = octaves.length - 1;
            const activePairFloat = (f - pairStart) / pairDur;
            const activePair = Math.floor(activePairFloat);

            if (f >= pairStart && activePair < numPairs) {
                const pairP = progress(f, pairStart + activePair * pairDur, 25);
                const i = activePair;

                const xA = getX(octaves[i].freq);
                const xB = getX(octaves[i + 1].freq);

                // Highlight dots
                ctx.fillStyle = '#f97316';
                ctx.beginPath();
                ctx.arc(xA, lineY, 5 * pairP, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(xB, lineY, 5 * pairP, 0, Math.PI * 2);
                ctx.fill();

                // Highlight labels
                ctx.globalAlpha = pairP;
                ctx.fillStyle = '#f97316';
                ctx.font = 'bold 10px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(octaves[i].label + 'Hz', xA, lineY + 26);
                ctx.fillText(octaves[i + 1].label + 'Hz', xB, lineY + 26);

                // Bracket
                const arrowY = lineY - 36;
                ctx.strokeStyle = '#f97316';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(xA, lineY - 14);
                ctx.lineTo(xA, arrowY);
                ctx.lineTo(xB, arrowY);
                ctx.lineTo(xB, lineY - 14);
                ctx.stroke();

                // Arrow head
                ctx.beginPath();
                ctx.moveTo(xB - 5, arrowY - 4);
                ctx.lineTo(xB, arrowY);
                ctx.lineTo(xB - 5, arrowY + 4);
                ctx.stroke();

                // ×2 label
                ctx.fillStyle = '#f97316';
                ctx.font = 'bold 14px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('×2', (xA + xB) / 2, arrowY - 8);

                // Equation below
                ctx.font = '10px -apple-system, sans-serif';
                ctx.fillText(
                    `${octaves[i].label} × 2 = ${octaves[i + 1].label}`,
                    W / 2, lineY + 50
                );

                ctx.globalAlpha = 1;
            }

            // --- Title ---
            const titleP = progress(f, 0, 30);
            ctx.globalAlpha = titleP;
            ctx.fillStyle = '#374151';
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Octave Spacing', W / 2, 22);
            ctx.fillStyle = '#9ca3af';
            ctx.font = '10px -apple-system, sans-serif';
            ctx.fillText('Each band is double the frequency of the one before', W / 2, 36);
            ctx.globalAlpha = 1;

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
