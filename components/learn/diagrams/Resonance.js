'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: low-pass response with resonance (Q) stepped through stages —
// a peak grows at the cutoff as Q rises, culminating in self-oscillation
export default function Resonance() {
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
        const lerp = (a, b, t) => a + (b - a) * t;

        // Plot geometry
        const plotX = 40;
        const plotW = W - 80;
        const plotTop = 54;
        const plotBottom = 200;
        const dbMin = -24;
        const dbMax = 26;
        const cutoffNorm = 0.42; // fraction across plot where cutoff sits
        const spanDecades = 3.2; // decades of frequency covered by the plot width
        const cutoffX = plotX + cutoffNorm * plotW;

        const dbToY = (dB) => {
            const t = clamp((dB - dbMin) / (dbMax - dbMin), 0, 1);
            return plotBottom - t * (plotBottom - plotTop);
        };

        // Magnitude response of a resonant 2-pole low-pass filter, in dB
        const responseDb = (nx, q) => {
            const exponent = (nx - cutoffNorm) * spanDecades;
            const r = Math.pow(10, exponent);
            const denom = Math.pow(1 - r * r, 2) + Math.pow(r / q, 2);
            return -10 * Math.log10(Math.max(denom, 1e-8));
        };

        const stages = [
            { q: 0.7, label: 'Q = 0.7', desc: 'No resonance: smooth roll-off, no peak', start: 30, color: '#1a1a6e' },
            { q: 2, label: 'Q = 2.0', desc: 'Light resonance: subtle peak at cutoff', start: 120, color: '#9B7530' },
            { q: 6, label: 'Q = 6.0', desc: 'High resonance: pronounced, vocal peak', start: 210, color: '#f97316' },
            { q: 15, label: 'Q = 15', desc: 'Self-oscillation: the filter rings on its own', start: 300, color: '#DC2626' },
        ];

        const draw = () => {
            frameRef.current = (frameRef.current + 1) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);

            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            // Find active stage
            let activeIdx = -1;
            for (let i = stages.length - 1; i >= 0; i--) {
                if (f >= stages[i].start) { activeIdx = i; break; }
            }

            // Static axes/labels that are always visible
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(plotX, dbToY(0));
            ctx.lineTo(plotX + plotW, dbToY(0));
            ctx.stroke();

            // Cutoff dashed marker
            ctx.strokeStyle = '#6b7280';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.moveTo(cutoffX, plotTop);
            ctx.lineTo(cutoffX, plotBottom);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalAlpha = 1;

            ctx.fillStyle = '#6b7280';
            ctx.font = 'bold 8px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Cutoff', cutoffX, plotBottom + 14);

            // Frequency axis labels
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('Low freq →', plotX, plotBottom + 32);
            ctx.textAlign = 'right';
            ctx.fillText('→ High freq', plotX + plotW, plotBottom + 32);
            ctx.globalAlpha = 1;

            if (activeIdx < 0) {
                animId = requestAnimationFrame(draw);
                return;
            }

            const stage = stages[activeIdx];
            const stageP = progress(f, stage.start, 50);
            const prevQ = activeIdx > 0 ? stages[activeIdx - 1].q : stage.q;
            const q = lerp(prevQ, stage.q, stageP);

            // Ghost curves for previous stages
            stages.forEach((s, i) => {
                if (i >= activeIdx) return;
                ctx.strokeStyle = s.color;
                ctx.lineWidth = 1;
                ctx.globalAlpha = 0.15;
                ctx.beginPath();
                for (let px = 0; px <= plotW; px++) {
                    const nx = px / plotW;
                    const y = dbToY(responseDb(nx, s.q));
                    if (px === 0) ctx.moveTo(plotX + px, y);
                    else ctx.lineTo(plotX + px, y);
                }
                ctx.stroke();
                ctx.globalAlpha = 1;
            });

            // Active curve
            ctx.strokeStyle = stage.color;
            ctx.lineWidth = 2.5;
            ctx.globalAlpha = stageP;
            ctx.beginPath();
            for (let px = 0; px <= plotW; px++) {
                const nx = px / plotW;
                const y = dbToY(responseDb(nx, q));
                if (px === 0) ctx.moveTo(plotX + px, y);
                else ctx.lineTo(plotX + px, y);
            }
            ctx.stroke();

            // Fill under active curve
            ctx.fillStyle = stage.color + '0F';
            ctx.beginPath();
            ctx.moveTo(plotX, dbToY(dbMin));
            for (let px = 0; px <= plotW; px++) {
                const nx = px / plotW;
                const y = dbToY(responseDb(nx, q));
                ctx.lineTo(plotX + px, y);
            }
            ctx.lineTo(plotX + plotW, dbToY(dbMin));
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1;

            // Self-oscillation marker — a small pulsing ring at the peak tip once resonance is high
            if (q > 10) {
                const peakDb = responseDb(cutoffNorm, q);
                const peakY = dbToY(peakDb);
                const pulse = 2.5 + Math.sin(f * 0.35) * 1.5;
                ctx.strokeStyle = '#DC2626';
                ctx.lineWidth = 1.5;
                ctx.globalAlpha = 0.7;
                ctx.beginPath();
                ctx.arc(cutoffX, peakY, 5 + pulse, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = 1;

                ctx.fillStyle = '#DC2626';
                ctx.font = 'bold 8px -apple-system, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText('self-oscillating', plotX + plotW, plotTop + 10);
            }

            // Q value display — large and clear
            ctx.fillStyle = stage.color;
            ctx.font = 'bold 22px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(stage.label, W / 2, 26);

            // Description
            ctx.fillStyle = '#374151';
            ctx.font = '11px -apple-system, sans-serif';
            ctx.fillText(stage.desc, W / 2, 47);

            // Stage indicator dots
            stages.forEach((s, i) => {
                const dotX = W / 2 - 30 + i * 20;
                const dotY = 254;
                ctx.fillStyle = i <= activeIdx ? s.color : '#d1d5db';
                ctx.beginPath();
                ctx.arc(dotX, dotY, i === activeIdx ? 4 : 3, 0, Math.PI * 2);
                ctx.fill();
            });

            // Phase indicator, top-right
            const phase = q > 10 ? 'Self-oscillating' : q > 4 ? 'Peak growing' : 'Building resonance';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - 20, 10);

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
