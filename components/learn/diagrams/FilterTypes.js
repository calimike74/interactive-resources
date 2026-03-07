'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: low-pass → high-pass → band-pass, each in its own clean panel
export default function FilterTypes() {
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

        const drawFilterPanel = (filt, appear, sweepP) => {
            const { x, y, w, h, type, color, label } = filt;
            ctx.save();
            ctx.globalAlpha = appear;

            // Panel background
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(x, y, w, h, 6);
            ctx.fill();
            ctx.stroke();

            // Title
            ctx.fillStyle = color;
            ctx.font = 'bold 10px -apple-system, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(label, x + 8, y + 14);

            // Plot area within panel
            const plotX = x + 8;
            const plotY = y + 22;
            const plotW = w - 16;
            const plotH = h - 34;

            // 0 dB baseline
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(plotX, plotY);
            ctx.lineTo(plotX + plotW, plotY);
            ctx.stroke();

            // Cutoff position
            let cutoffX;
            if (type === 'lp') {
                const cutoffNorm = 0.85 - sweepP * 0.35; // sweeps from 0.85 down to 0.50
                cutoffX = plotX + cutoffNorm * plotW;
            } else if (type === 'hp') {
                cutoffX = plotX + 0.35 * plotW;
            } else {
                cutoffX = plotX + 0.50 * plotW;
            }

            // Pass/Cut region fills
            ctx.globalAlpha = appear * 0.12;
            if (type === 'lp') {
                ctx.fillStyle = '#059669';
                ctx.fillRect(plotX, plotY, cutoffX - plotX, plotH);
                ctx.fillStyle = '#DC2626';
                ctx.fillRect(cutoffX, plotY, plotX + plotW - cutoffX, plotH);
            } else if (type === 'hp') {
                ctx.fillStyle = '#DC2626';
                ctx.fillRect(plotX, plotY, cutoffX - plotX, plotH);
                ctx.fillStyle = '#059669';
                ctx.fillRect(cutoffX, plotY, plotX + plotW - cutoffX, plotH);
            } else {
                const bw = plotW * 0.15;
                ctx.fillStyle = '#DC2626';
                ctx.fillRect(plotX, plotY, cutoffX - bw - plotX, plotH);
                ctx.fillStyle = '#059669';
                ctx.fillRect(cutoffX - bw, plotY, bw * 2, plotH);
                ctx.fillStyle = '#DC2626';
                ctx.fillRect(cutoffX + bw, plotY, plotX + plotW - cutoffX - bw, plotH);
            }
            ctx.globalAlpha = appear;

            // Frequency response curve
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            for (let px = 0; px <= plotW; px++) {
                const nx = px / plotW;
                let gain;
                if (type === 'lp') {
                    const cutNorm = 0.85 - sweepP * 0.35;
                    const diff = (nx - cutNorm) * 10;
                    gain = diff <= 0 ? 1 : 1 / (1 + diff * diff);
                } else if (type === 'hp') {
                    const diff = (0.35 - nx) * 10;
                    gain = diff <= 0 ? 1 : 1 / (1 + diff * diff);
                } else {
                    const dist = Math.abs(nx - 0.50) / 0.12;
                    gain = 1 / (1 + dist * dist * 4);
                }
                const py = plotY + (1 - gain) * plotH;
                if (px === 0) ctx.moveTo(plotX + px, py);
                else ctx.lineTo(plotX + px, py);
            }
            ctx.stroke();

            // Cutoff/Center dashed marker line
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.globalAlpha = appear * 0.6;
            ctx.beginPath();
            ctx.moveTo(cutoffX, plotY);
            ctx.lineTo(cutoffX, plotY + plotH);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalAlpha = appear;

            // Cutoff label below panel plot
            ctx.fillStyle = color;
            ctx.font = 'bold 8px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(type === 'bp' ? 'Center' : 'Cutoff', cutoffX, plotY + plotH + 9);

            // Pass/Cut labels — positioned inside region fills, vertically centered
            ctx.font = '8px -apple-system, sans-serif';
            const labelY = plotY + plotH * 0.5 + 3;
            if (type === 'lp') {
                ctx.fillStyle = '#059669';
                ctx.textAlign = 'center';
                ctx.fillText('Pass', plotX + (cutoffX - plotX) * 0.5, labelY);
                ctx.fillStyle = '#DC2626';
                ctx.fillText('Cut', cutoffX + (plotX + plotW - cutoffX) * 0.5, labelY);
            } else if (type === 'hp') {
                ctx.fillStyle = '#DC2626';
                ctx.textAlign = 'center';
                ctx.fillText('Cut', plotX + (cutoffX - plotX) * 0.5, labelY);
                ctx.fillStyle = '#059669';
                ctx.fillText('Pass', cutoffX + (plotX + plotW - cutoffX) * 0.5, labelY);
            } else {
                const bw = plotW * 0.15;
                ctx.fillStyle = '#DC2626';
                ctx.textAlign = 'center';
                ctx.fillText('Cut', plotX + (cutoffX - bw - plotX) * 0.5, labelY);
                ctx.fillStyle = '#059669';
                ctx.fillText('Pass', cutoffX, labelY);
                ctx.fillStyle = '#DC2626';
                ctx.fillText('Cut', cutoffX + bw + (plotX + plotW - cutoffX - bw) * 0.5, labelY);
            }

            ctx.restore();
        };

        const draw = () => {
            frameRef.current = (frameRef.current + 1) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            // Three panels stacked with proper spacing
            const panelW = W - 40;
            const panelH = 76;
            const gap = 8;
            const topY = 12;

            const filters = [
                { x: 20, y: topY, w: panelW, h: panelH, type: 'lp', color: '#1a1a6e', label: 'Low-Pass Filter' },
                { x: 20, y: topY + panelH + gap, w: panelW, h: panelH, type: 'hp', color: '#7c3aed', label: 'High-Pass Filter' },
                { x: 20, y: topY + (panelH + gap) * 2, w: panelW, h: panelH, type: 'bp', color: '#0891b2', label: 'Band-Pass Filter' },
            ];

            filters.forEach((filt, idx) => {
                const appear = progress(f, idx * 90, 50);
                const sweepP = progress(f, idx * 90 + 30, 70);
                if (appear > 0) drawFilterPanel(filt, appear, sweepP);
            });

            // Frequency axis label at bottom
            const axisP = progress(f, 200, 40);
            if (axisP > 0) {
                ctx.globalAlpha = axisP * 0.5;
                ctx.fillStyle = '#9ca3af';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('Low freq →', 24, H - 6);
                ctx.textAlign = 'right';
                ctx.fillText('→ High freq', W - 24, H - 6);
                ctx.globalAlpha = 1;
            }

            // Phase indicator
            const phase = f < 90 ? 'Low-Pass' : f < 180 ? 'High-Pass' : f < 270 ? 'Band-Pass' : 'Complete';
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
