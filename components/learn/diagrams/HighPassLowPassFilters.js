'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: high-pass panel draws first (pass/stop fills, cut-off line, the exact
// -3 dB point marked on the curve) → low-pass panel draws the mirror image → both held together
// with a caption on what the cut-off point actually means.
export default function HighPassLowPassFilters() {
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

        const panelW = W - 40;
        const panelH = 96;
        const gap = 14;
        const topY = 30;

        const panels = [
            { x: 20, y: topY, w: panelW, h: panelH, type: 'hp', color: '#9B7530', label: 'High-Pass Filter', start: 20 },
            { x: 20, y: topY + panelH + gap, w: panelW, h: panelH, type: 'lp', color: '#1a1a6e', label: 'Low-Pass Filter', start: 190 },
        ];

        // `diff` is signed distance from the cut-off: positive toward the stop band, negative
        // toward the pass band, zero exactly at cut-off. The logistic roll-off below is exactly
        // 0.5 (the true half-power / -3 dB point) at diff = 0, easing smoothly up toward 1 deep
        // in the pass band and down toward 0 deep in the stop band — so the curve is already down
        // at the marked level right at cut-off, which is the teaching point of this diagram.
        const gainAt = (nx, cutNorm, type) => {
            const diff = type === 'lp' ? (nx - cutNorm) * 9 : (cutNorm - nx) * 9;
            return 1 / (1 + Math.exp(2 * diff));
        };

        const drawPanel = (panel, appear) => {
            const { x, y, w, h, type, color, label } = panel;
            ctx.save();
            ctx.globalAlpha = appear;

            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(x, y, w, h, 6);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = color;
            ctx.font = 'bold 10px -apple-system, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(label, x + 10, y + 15);

            const plotX = x + 10;
            const plotY = y + 26;
            const plotW = w - 20;
            const plotH = h - 40;
            const cutNorm = 0.45;
            const cutoffX = plotX + cutNorm * plotW;

            // Pass / Stop region fills
            ctx.globalAlpha = appear * 0.10;
            if (type === 'lp') {
                ctx.fillStyle = '#059669';
                ctx.fillRect(plotX, plotY, cutoffX - plotX, plotH);
                ctx.fillStyle = '#DC2626';
                ctx.fillRect(cutoffX, plotY, plotX + plotW - cutoffX, plotH);
            } else {
                ctx.fillStyle = '#DC2626';
                ctx.fillRect(plotX, plotY, cutoffX - plotX, plotH);
                ctx.fillStyle = '#059669';
                ctx.fillRect(cutoffX, plotY, plotX + plotW - cutoffX, plotH);
            }
            ctx.globalAlpha = appear;

            // Response curve
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            for (let px = 0; px <= plotW; px++) {
                const nx = px / plotW;
                const gain = gainAt(nx, cutNorm, type);
                const py = plotY + (1 - gain) * plotH;
                if (px === 0) ctx.moveTo(plotX + px, py);
                else ctx.lineTo(plotX + px, py);
            }
            ctx.stroke();

            // Cut-off dashed marker
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.globalAlpha = appear * 0.55;
            ctx.beginPath();
            ctx.moveTo(cutoffX, plotY);
            ctx.lineTo(cutoffX, plotY + plotH);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalAlpha = appear;

            ctx.fillStyle = color;
            ctx.font = 'bold 8px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Cut-off', cutoffX, plotY + plotH + 11);

            // -3 dB point marked exactly on the curve at the cut-off — computed from gainAt()
            // itself (not a hardcoded constant) so the dot can never drift off the drawn curve
            const gainAtCutoff = gainAt(cutNorm, cutNorm, type);
            const markerY = plotY + (1 - gainAtCutoff) * plotH;
            ctx.beginPath();
            ctx.arc(cutoffX, markerY, 3, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();

            // -3 dB label placed clear of the curve, in the plot's empty upper corner —
            // offset further from the cut-off than the flat pass shoulder reaches
            const labelX = type === 'lp' ? cutoffX - 14 : cutoffX + 14;
            ctx.fillStyle = color;
            ctx.font = 'bold 8px -apple-system, sans-serif';
            ctx.textAlign = type === 'lp' ? 'right' : 'left';
            ctx.fillText('−3 dB here', labelX, plotY + 14);

            // Pass / Stop text, mid-height — clear of the curve, which sits near one edge or the other
            ctx.font = '8px -apple-system, sans-serif';
            const labelY = plotY + plotH * 0.5;
            if (type === 'lp') {
                ctx.fillStyle = '#059669';
                ctx.textAlign = 'center';
                ctx.fillText('Pass', plotX + (cutoffX - plotX) * 0.5, labelY);
                ctx.fillStyle = '#DC2626';
                ctx.fillText('Stop', cutoffX + (plotX + plotW - cutoffX) * 0.5, labelY);
            } else {
                ctx.fillStyle = '#DC2626';
                ctx.textAlign = 'center';
                ctx.fillText('Stop', plotX + (cutoffX - plotX) * 0.5, labelY);
                ctx.fillStyle = '#059669';
                ctx.fillText('Pass', cutoffX + (plotX + plotW - cutoffX) * 0.5, labelY);
            }

            ctx.restore();
        };

        const draw = () => {
            frameRef.current = (frameRef.current + 1) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            const titleP = progress(f, 0, 20);
            ctx.globalAlpha = titleP;
            ctx.fillStyle = '#1a1a6e';
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('High-Pass & Low-Pass', W / 2, 16);
            ctx.globalAlpha = 1;

            panels.forEach((panel) => {
                const appear = progress(f, panel.start, 60);
                if (appear > 0) drawPanel(panel, appear);
            });

            const captionP = progress(f, 380, 40) * (f < CYCLE - 60 ? 1 : clamp(1 - (f - (CYCLE - 60)) / 30, 0, 1));
            if (captionP > 0) {
                ctx.globalAlpha = captionP;
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('The name says what passes: cut-off is already 3 dB down, not the start of the cut', W / 2, H - 8);
                ctx.globalAlpha = 1;
            }

            const phase = f < 190 ? 'High-Pass' : f < 380 ? 'Low-Pass' : 'Both';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - 20, 16);

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
