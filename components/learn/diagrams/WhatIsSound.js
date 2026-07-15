'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: vibrating source radiates a pressure wave (top) →
// that wave drawn as a waveform with amplitude (loudness) and one cycle (frequency/pitch) labelled (bottom)
export default function WhatIsSound() {
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

        const CYCLE = 560;
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

            // Title
            const titleP = progress(f, 0, 25);
            ctx.globalAlpha = titleP;
            ctx.fillStyle = '#1a1a6e';
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('What Is Sound?', W / 2, 18);
            ctx.globalAlpha = 1;

            const boxLeft = 16;
            const boxRight = W - 16;
            const boxW = boxRight - boxLeft;

            // --- Panel 1: vibration → pressure wave (y 32–140) ---
            const p1Top = 32;
            const p1H = 106;
            const p1Appear = progress(f, 12, 30);

            if (p1Appear > 0) {
                ctx.globalAlpha = p1Appear;
                ctx.fillStyle = '#fff';
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(boxLeft, p1Top, boxW, p1H, 6);
                ctx.fill();
                ctx.stroke();

                // Clip to the panel so ripples don't bleed out
                ctx.save();
                ctx.beginPath();
                ctx.roundRect(boxLeft, p1Top, boxW, p1H, 6);
                ctx.clip();

                const srcX = boxLeft + 46;
                const srcY = p1Top + p1H / 2;

                // Expanding pressure-wave rings (right-opening arcs)
                const ringCount = 4;
                const ringPeriod = 92;
                for (let k = 0; k < ringCount; k++) {
                    const t = (f + k * (ringPeriod / ringCount)) % ringPeriod;
                    const radius = 10 + t * 3.1;
                    const alpha = Math.max(0, 1 - t / ringPeriod);
                    if (alpha <= 0) continue;
                    ctx.globalAlpha = p1Appear * alpha * 0.55;
                    ctx.strokeStyle = '#1a1a6e';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.arc(srcX, srcY, radius, -Math.PI / 2.4, Math.PI / 2.4);
                    ctx.stroke();
                }
                ctx.globalAlpha = p1Appear;

                // Oscillating source
                const bounce = Math.sin(f * 0.22) * 9;
                ctx.fillStyle = '#1a1a6e';
                ctx.beginPath();
                ctx.arc(srcX, srcY + bounce, 7, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
                ctx.globalAlpha = p1Appear;

                // Captions
                const cap1 = progress(f, 45, 25);
                if (cap1 > 0) {
                    ctx.globalAlpha = cap1;
                    ctx.fillStyle = '#6b7280';
                    ctx.font = '9px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('Vibrating source', srcX, p1Top + p1H - 10);
                    ctx.globalAlpha = 1;
                }
                const cap2 = progress(f, 75, 25);
                if (cap2 > 0) {
                    ctx.globalAlpha = cap2;
                    ctx.fillStyle = '#1a1a6e';
                    ctx.font = '9px -apple-system, sans-serif';
                    ctx.textAlign = 'right';
                    ctx.fillText('Pressure wave travels outward', boxRight - 12, p1Top + 16);
                    ctx.globalAlpha = 1;
                }

                ctx.globalAlpha = 1;
            }

            // --- Panel 2: waveform with amplitude & frequency labelled (y 150–260) ---
            const p2Top = 150;
            const p2H = 108;
            const p2Left = boxLeft + 34;
            const p2Right = boxRight - 14;
            const p2W = p2Right - p2Left;
            const p2Base = p2Top + 38; // zero line sits in the upper part of the box, leaving room below for the cycle bracket + label
            const p2Appear = progress(f, 110, 30);

            if (p2Appear > 0) {
                ctx.globalAlpha = p2Appear;
                ctx.fillStyle = '#fff';
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(boxLeft, p2Top, boxW, p2H, 6);
                ctx.fill();
                ctx.stroke();

                // Zero line
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 0.5;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(p2Left, p2Base);
                ctx.lineTo(p2Right, p2Base);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.fillStyle = '#9ca3af';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText('Time →', p2Right, p2Top + p2H - 4);

                // Progressive sine wave draw (2 cycles across the panel)
                const waveDraw = progress(f, 140, 90);
                const peakAmp = 30;
                if (waveDraw > 0) {
                    ctx.strokeStyle = '#1a1a6e';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    const points = Math.floor(p2W * waveDraw);
                    for (let px = 0; px <= points; px++) {
                        const nx = px / p2W;
                        const y = p2Base - Math.sin(nx * 2 * Math.PI * 2) * peakAmp;
                        if (px === 0) ctx.moveTo(p2Left + px, y);
                        else ctx.lineTo(p2Left + px, y);
                    }
                    ctx.stroke();
                }

                // Amplitude double-arrow (first peak)
                const ampP = progress(f, 250, 30);
                if (ampP > 0) {
                    const ax = p2Left + p2W * 0.125; // first peak position (quarter of first cycle)
                    ctx.globalAlpha = p2Appear * ampP;
                    ctx.strokeStyle = '#059669';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(ax, p2Base);
                    ctx.lineTo(ax, p2Base - peakAmp);
                    ctx.stroke();
                    // arrowheads
                    ctx.beginPath();
                    ctx.moveTo(ax - 3, p2Base - peakAmp + 5);
                    ctx.lineTo(ax, p2Base - peakAmp);
                    ctx.lineTo(ax + 3, p2Base - peakAmp + 5);
                    ctx.stroke();
                    ctx.fillStyle = '#059669';
                    ctx.font = 'bold 9px -apple-system, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText('Amplitude → Loudness', ax + 6, p2Base - peakAmp / 2);
                    ctx.globalAlpha = p2Appear;
                }

                // One-cycle bracket
                const cycP = progress(f, 300, 30);
                if (cycP > 0) {
                    const cx1 = p2Left;
                    const cx2 = p2Left + p2W / 2; // one full cycle (2 cycles drawn across full width)
                    const by = p2Base + peakAmp + 10;
                    ctx.globalAlpha = p2Appear * cycP;
                    ctx.strokeStyle = '#9B7530';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(cx1, by - 4);
                    ctx.lineTo(cx1, by);
                    ctx.lineTo(cx2, by);
                    ctx.lineTo(cx2, by - 4);
                    ctx.stroke();
                    ctx.fillStyle = '#9B7530';
                    ctx.font = 'bold 9px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('1 cycle → Frequency → Pitch', (cx1 + cx2) / 2, by + 12);
                    ctx.globalAlpha = p2Appear;
                }

                ctx.globalAlpha = 1;
            }

            // Phase indicator
            const phase = f < 110 ? 'Vibration' : f < 250 ? 'Waveform' : f < 480 ? 'Pitch & Loudness' : 'Complete';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - 16, H - 6);

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
