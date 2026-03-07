'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: full harmonic spectrum → filter sweeps down removing highs → resulting filtered waveform
export default function SubtractiveConcept() {
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

        const draw = () => {
            frameRef.current = (frameRef.current + 1) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);

            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            const margin = { left: 45, right: 20, top: 40, bottom: 28 };
            const plotW = W - margin.left - margin.right;
            const plotH = H - margin.top - margin.bottom;
            const baseY = margin.top + plotH;

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
            ['f₀', '2f', '3f', '4f', '5f', '6f', '7f', '8f'].forEach((label, i) => {
                ctx.fillText(label, margin.left + ((i + 0.5) / 8) * plotW, H - 6);
            });

            ctx.textAlign = 'right';
            ctx.fillText('Amplitude', margin.left - 6, margin.top + 8);

            // Number of harmonics
            const numH = 8;
            const barW = plotW / numH - 4;

            // --- Phase 1 (0-80): Full harmonic spectrum appears ---
            const p1 = progress(f, 0, 60);

            if (p1 > 0) {
                ctx.globalAlpha = p1;

                // Title
                ctx.fillStyle = '#1a1a6e';
                ctx.font = 'bold 11px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Harmonically Rich Waveform (Sawtooth)', W / 2, 22);

                // Draw harmonic bars — sawtooth has all harmonics, amplitude = 1/n
                for (let n = 1; n <= numH; n++) {
                    const barHeight = (plotH * 0.85) * (1 / n) * p1;
                    const x = margin.left + ((n - 0.5) / numH) * plotW - barW / 2;
                    const y = baseY - barHeight;

                    ctx.fillStyle = '#1a1a6e';
                    ctx.fillRect(x, y, barW, barHeight);

                    // Harmonic number label
                    ctx.fillStyle = '#6b7280';
                    ctx.font = '8px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${n}`, x + barW / 2, y - 4);
                }

                // Label
                const labelP = progress(f, 50, 20);
                if (labelP > 0) {
                    ctx.globalAlpha = labelP;
                    ctx.fillStyle = '#6b7280';
                    ctx.font = '10px -apple-system, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText('All harmonics present', margin.left + 4, margin.top + 16);
                }

                ctx.globalAlpha = 1;
            }

            // --- Phase 2 (100-260): Filter cutoff sweeps down ---
            const p2 = progress(f, 100, 100);
            const filterSweep = progress(f, 100, 140);

            if (p2 > 0) {
                // Cutoff moves from harmonic 8 down to harmonic 3
                const cutoffN = 8 - filterSweep * 5; // 8 → 3
                const cutoffX = margin.left + ((cutoffN - 0.5) / numH) * plotW;

                // Shaded "removed" area
                ctx.fillStyle = `rgba(220, 38, 38, ${0.08 * p2})`;
                ctx.fillRect(cutoffX, margin.top, W - margin.right - cutoffX, plotH);

                // Cutoff line
                ctx.strokeStyle = '#DC2626';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]);
                ctx.globalAlpha = p2;
                ctx.beginPath();
                ctx.moveTo(cutoffX, margin.top);
                ctx.lineTo(cutoffX, baseY);
                ctx.stroke();
                ctx.setLineDash([]);

                // Cutoff label
                ctx.fillStyle = '#DC2626';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('CUTOFF', cutoffX, margin.top - 4);

                // Redraw bars with filtered ones dimmed
                for (let n = 1; n <= numH; n++) {
                    const barHeight = (plotH * 0.85) * (1 / n);
                    const x = margin.left + ((n - 0.5) / numH) * plotW - barW / 2;
                    const y = baseY - barHeight;

                    const isFiltered = n > cutoffN;
                    ctx.globalAlpha = isFiltered ? 0.15 * p2 : 1;
                    ctx.fillStyle = isFiltered ? '#9ca3af' : '#1a1a6e';
                    ctx.fillRect(x, y, barW, barHeight);
                }

                ctx.globalAlpha = 1;

                // "Removing frequencies" label
                const removeLabel = progress(f, 140, 25);
                if (removeLabel > 0) {
                    ctx.globalAlpha = removeLabel;
                    ctx.fillStyle = '#DC2626';
                    ctx.font = 'bold 9px -apple-system, sans-serif';
                    ctx.textAlign = 'right';
                    ctx.fillText('Removed by filter', W - margin.right - 4, margin.top + 16);
                    ctx.globalAlpha = 1;
                }

                // Update title
                const titleSwap = progress(f, 120, 20);
                if (titleSwap > 0) {
                    ctx.fillStyle = `rgba(250, 250, 250, ${titleSwap})`;
                    ctx.fillRect(0, 0, W, 30);
                    ctx.globalAlpha = titleSwap;
                    ctx.fillStyle = '#1a1a6e';
                    ctx.font = 'bold 11px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('Filter Sweeps Down — Removing Harmonics', W / 2, 22);
                    ctx.globalAlpha = 1;
                }
            }

            // --- Phase 3 (280-400): Result — simpler waveform ---
            const p3 = progress(f, 280, 50);
            if (p3 > 0) {
                // Overwrite title
                ctx.fillStyle = `rgba(250, 250, 250, ${p3})`;
                ctx.fillRect(0, 0, W, 30);
                ctx.globalAlpha = p3;
                ctx.fillStyle = '#1a1a6e';
                ctx.font = 'bold 11px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Result — Darker, Simpler Tone', W / 2, 22);

                // Result label
                ctx.fillStyle = '#059669';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('Only low harmonics remain', margin.left + 4, margin.top + 16);
                ctx.globalAlpha = 1;
            }

            // Phase indicator
            const phase = f < 100 ? 'Spectrum' : f < 280 ? 'Filtering' : f < 400 ? 'Result' : 'Complete';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - margin.right, H - 6);

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
