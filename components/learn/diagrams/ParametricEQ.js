'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: empty plot → Band 1 appears → sweeps freq → Band 2 adds → Q adjusts → combined curve
export default function ParametricEQ() {
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

        const CYCLE = 510;
        let animId;

        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);
        const lerp = (a, b, t) => a + (b - a) * t;

        const bands = [
            { color: '#f97316', label: 'Band 1' },
            { color: '#2563EB', label: 'Band 2' },
            { color: '#059669', label: 'Band 3' },
        ];

        const margin = { left: 42, right: 20, top: 48, bottom: 28 };

        const draw = () => {
            frameRef.current = (frameRef.current + 1) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);

            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            const plotW = W - margin.left - margin.right;
            const plotH = H - margin.top - margin.bottom;
            const centerY = margin.top + plotH / 2;

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

            // Zero line
            ctx.strokeStyle = '#d1d5db';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(margin.left, centerY);
            ctx.lineTo(W - margin.right, centerY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Axis labels
            ctx.fillStyle = '#9ca3af';
            ctx.font = '9px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ['20', '100', '500', '1k', '5k', '20k'].forEach((l, i) => {
                ctx.fillText(l, margin.left + (i / 5) * plotW, H - 6);
            });

            // Band parameters — animated
            const bandParams = [];

            // --- Phase 1 (0-100): Band 1 appears and sweeps frequency ---
            const b1appear = progress(f, 20, 30);
            const b1sweep = progress(f, 60, 80);
            const b1freq = lerp(0.15, 0.35, b1sweep);
            bandParams.push({
                active: b1appear,
                freq: b1freq,
                gain: 0.5 * b1appear,
                q: 4,
                color: bands[0].color,
                label: bands[0].label,
            });

            // --- Phase 2 (140-220): Band 2 appears below (cut) ---
            const b2appear = progress(f, 140, 30);
            const b2sweep = progress(f, 180, 60);
            const b2freq = lerp(0.7, 0.6, b2sweep);
            bandParams.push({
                active: b2appear,
                freq: b2freq,
                gain: -0.4 * b2appear,
                q: 3,
                color: bands[1].color,
                label: bands[1].label,
            });

            // --- Phase 3 (250-340): Band 3 appears, then Q narrows ---
            const b3appear = progress(f, 250, 30);
            const b3qChange = progress(f, 300, 60);
            const b3q = lerp(2, 8, b3qChange);
            bandParams.push({
                active: b3appear,
                freq: 0.48,
                gain: -0.55 * b3appear,
                q: b3q,
                color: bands[2].color,
                label: bands[2].label,
            });

            // Draw individual band curves
            bandParams.forEach((bp) => {
                if (bp.active <= 0) return;

                ctx.strokeStyle = bp.color;
                ctx.lineWidth = 1.5;
                ctx.globalAlpha = bp.active * 0.6;
                ctx.beginPath();
                for (let px = 0; px <= plotW; px++) {
                    const nx = px / plotW;
                    const dist = (nx - bp.freq) * 10;
                    const response = bp.gain * Math.exp(-bp.q * dist * dist);
                    const y = centerY - response * (plotH / 2);
                    if (px === 0) ctx.moveTo(margin.left + px, y);
                    else ctx.lineTo(margin.left + px, y);
                }
                ctx.stroke();
                ctx.globalAlpha = 1;

                // Control point dot
                ctx.globalAlpha = bp.active;
                ctx.fillStyle = bp.color;
                const dotX = margin.left + bp.freq * plotW;
                const dotY = centerY - bp.gain * (plotH / 2);
                ctx.beginPath();
                ctx.arc(dotX, dotY, 5, 0, Math.PI * 2);
                ctx.fill();

                // Label with parameter values
                ctx.font = '9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                const freqHz = Math.round(20 * Math.pow(1000, bp.freq));
                const gainDb = (bp.gain * 12).toFixed(1);
                const labelX = dotX + 8;
                const labelY = dotY + (bp.gain > 0 ? -6 : 14);
                ctx.fillText(`${bp.label}`, labelX, labelY);

                // Show parameter values after they've settled
                if (bp.active > 0.8) {
                    ctx.fillStyle = '#6b7280';
                    ctx.font = '8px -apple-system, sans-serif';
                    ctx.fillText(`${freqHz}Hz  ${gainDb}dB  Q=${bp.q.toFixed(1)}`, labelX, labelY + 10);
                }

                ctx.globalAlpha = 1;
            });

            // --- Phase 4 (360-420): Combined curve draws ---
            const combinedP = progress(f, 360, 40);
            if (combinedP > 0) {
                ctx.strokeStyle = '#1A1A2E';
                ctx.lineWidth = 2.5;
                ctx.globalAlpha = combinedP;
                ctx.beginPath();
                for (let px = 0; px <= plotW; px++) {
                    const nx = px / plotW;
                    let total = 0;
                    bandParams.forEach(bp => {
                        if (bp.active <= 0) return;
                        const dist = (nx - bp.freq) * 10;
                        total += bp.gain * Math.exp(-bp.q * dist * dist);
                    });
                    const y = centerY - total * (plotH / 2);
                    if (px === 0) ctx.moveTo(margin.left + px, y);
                    else ctx.lineTo(margin.left + px, y);
                }
                ctx.stroke();

                // "Combined" label
                const labelP = progress(f, 380, 20);
                ctx.globalAlpha = labelP;
                ctx.fillStyle = '#1A1A2E';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText('Combined curve', W - margin.right - 4, margin.top + 14);
                ctx.globalAlpha = 1;
            }

            // --- Annotation: "Sweepable" at top ---
            const sweepLabel = progress(f, 80, 25);
            if (sweepLabel > 0 && f < 300) {
                ctx.globalAlpha = sweepLabel * (f < 260 ? 1 : progress(300, f, 40));
                ctx.fillStyle = '#f97316';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                const dotX = margin.left + b1freq * plotW;
                ctx.fillText('← Sweepable frequency →', dotX, margin.top - 6);
                ctx.globalAlpha = 1;
            }

            // Title
            ctx.fillStyle = '#374151';
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Parametric EQ', W / 2, 16);
            ctx.fillStyle = '#9ca3af';
            ctx.font = '10px -apple-system, sans-serif';
            ctx.fillText('Frequency + Gain + Q per band', W / 2, 30);

            // Legend
            bandParams.forEach((bp, i) => {
                if (bp.active <= 0) return;
                ctx.globalAlpha = bp.active;
                const lx = margin.left + 6 + i * 80;
                ctx.fillStyle = bp.color;
                ctx.fillRect(lx, 38, 10, 6);
                ctx.fillStyle = '#6b7280';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(bp.label, lx + 14, 44);
                ctx.globalAlpha = 1;
            });

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
