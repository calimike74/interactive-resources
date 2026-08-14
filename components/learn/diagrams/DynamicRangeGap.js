'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: dBFS level axis appears → quiet bar (−40 dBFS) and loud bar
// (−6 dBFS) grow to their true levels → bracket labels the 34 dB gap between them →
// a second, compressed panel shows the same two bars with the loud one pulled down,
// narrowing the bracket — before/after in one picture, sourced from this row's own
// whisper/shout illustration (−40 dBFS / −6 dBFS / 34 dB span).
export default function DynamicRangeGap() {
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

        const CYCLE = 520;
        let animId;

        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);

        // dBFS level axis: 0 at top, −60 at bottom, shared by both panels.
        const dbToFrac = (db) => clamp((0 - db) / 60, 0, 1);

        const QUIET = -40;
        const LOUD_BEFORE = -6;
        const LOUD_AFTER = -24; // illustrative compressed level — not exam-sourced, see report

        const barNoise = (i, seed) => Math.sin(i * 0.9 + seed) * 0.4 + Math.sin(i * 2.3 + seed) * 0.2;

        const drawBars = (x, w, plotTop, plotH, peakDb, baseDb, color, alpha, count) => {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = color;
            const peakY = plotTop + dbToFrac(peakDb) * plotH;
            const baseY = plotTop + dbToFrac(baseDb) * plotH;
            const barW = w / count - 1;
            for (let i = 0; i < count; i++) {
                const jitter = 1 - Math.abs(barNoise(i, peakDb)) * 0.12;
                const topY = peakY + (baseY - peakY) * (1 - jitter);
                const bx = x + (i / count) * w;
                ctx.fillRect(bx, topY, barW, baseY - topY);
            }
            ctx.globalAlpha = 1;
        };

        const drawPanel = (opts) => {
            const { plotTop, plotH, plotLeft, plotW, quietAlpha, loudAlpha, loudDb, bracketAlpha, bracketLabel, title, titleAlpha } = opts;

            ctx.globalAlpha = titleAlpha;
            ctx.fillStyle = '#374151';
            ctx.font = 'bold 9px -apple-system, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(title, plotLeft, plotTop - 6);
            ctx.globalAlpha = 1;

            // dB reference axis (0, -20, -40, -60)
            ctx.strokeStyle = '#d1d5db';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(plotLeft, plotTop);
            ctx.lineTo(plotLeft, plotTop + plotH);
            ctx.stroke();
            [0, -20, -40, -60].forEach((db) => {
                const y = plotTop + dbToFrac(db) * plotH;
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(plotLeft, y);
                ctx.lineTo(plotLeft + plotW, y);
                ctx.stroke();
                ctx.fillStyle = '#9ca3af';
                ctx.font = '7px -apple-system, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(`${db}`, plotLeft - 4, y + 2.5);
            });

            const barsLeft = plotLeft + 28;
            const barsW = plotW - 40;
            const half = barsW / 2 - 6;

            if (quietAlpha > 0) {
                drawBars(barsLeft, half, plotTop, plotH, QUIET, -60, '#9ca3af', quietAlpha, 14);
                ctx.globalAlpha = quietAlpha;
                ctx.fillStyle = '#6b7280';
                ctx.font = 'bold 8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Quiet', barsLeft + half / 2, plotTop + plotH + 11);
                ctx.fillText('−40 dBFS', barsLeft + half / 2, plotTop + dbToFrac(QUIET) * plotH - 4);
                ctx.globalAlpha = 1;
            }

            if (loudAlpha > 0) {
                const loudX = barsLeft + half + 12;
                drawBars(loudX, half, plotTop, plotH, loudDb, -60, '#e85d75', loudAlpha, 14);
                ctx.globalAlpha = loudAlpha;
                ctx.fillStyle = '#e85d75';
                ctx.font = 'bold 8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Loud', loudX + half / 2, plotTop + plotH + 11);
                ctx.fillText(`${loudDb} dBFS`, loudX + half / 2, plotTop + dbToFrac(loudDb) * plotH - 4);
                ctx.globalAlpha = 1;
            }

            if (bracketAlpha > 0) {
                ctx.globalAlpha = bracketAlpha;
                const bx = plotLeft + plotW + 10;
                const topY = plotTop + dbToFrac(loudDb) * plotH;
                const botY = plotTop + dbToFrac(QUIET) * plotH;
                ctx.strokeStyle = '#374151';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(bx - 5, topY);
                ctx.lineTo(bx, topY);
                ctx.lineTo(bx, botY);
                ctx.lineTo(bx - 5, botY);
                ctx.stroke();

                ctx.fillStyle = '#374151';
                ctx.font = 'bold 8px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(bracketLabel, bx + 3, (topY + botY) / 2 + 3);
                ctx.globalAlpha = 1;
            }
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
            ctx.fillText('The dB Gap', W / 2, 16);
            ctx.globalAlpha = 1;

            const panelW = 118;
            const panelH = 108;
            const p1Top = 44;
            const p1Left = 30;

            // Panel 1: before
            const quietP = progress(f, 30, 40);
            const loudP = progress(f, 70, 50);
            const bracketP = progress(f, 140, 40);
            drawPanel({
                plotTop: p1Top, plotH: panelH, plotLeft: p1Left, plotW: panelW,
                quietAlpha: quietP, loudAlpha: loudP, loudDb: LOUD_BEFORE,
                bracketAlpha: bracketP, bracketLabel: '34 dB', title: 'Original',
                titleAlpha: quietP,
            });

            // Panel 2: after compression
            const p2Left = 300;
            const panel2P = progress(f, 220, 40);
            if (panel2P > 0) {
                const bracket2P = progress(f, 300, 40);
                drawPanel({
                    plotTop: p1Top, plotH: panelH, plotLeft: p2Left, plotW: panelW,
                    quietAlpha: panel2P, loudAlpha: panel2P, loudDb: LOUD_AFTER,
                    bracketAlpha: bracket2P, bracketLabel: '16 dB', title: 'After Compression',
                    titleAlpha: panel2P,
                });
            }

            // Arrow between panels
            const arrowP = progress(f, 250, 30);
            if (arrowP > 0) {
                ctx.globalAlpha = arrowP;
                const ay = p1Top + panelH / 2;
                ctx.strokeStyle = '#9B7530';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(p1Left + panelW + 26, ay);
                ctx.lineTo(p2Left - 12, ay);
                ctx.stroke();
                ctx.fillStyle = '#9B7530';
                ctx.beginPath();
                ctx.moveTo(p2Left - 12, ay);
                ctx.lineTo(p2Left - 19, ay - 5);
                ctx.lineTo(p2Left - 19, ay + 5);
                ctx.fill();
                ctx.globalAlpha = 1;
            }

            const closingP = progress(f, 380, 40);
            if (closingP > 0) {
                ctx.globalAlpha = closingP;
                ctx.fillStyle = '#16a34a';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Same two levels: compression narrows the gap between them', W / 2, H - 8);
                ctx.globalAlpha = 1;
            }

            const phase = f < 140 ? 'Levels' : f < 220 ? 'Gap' : f < 300 ? 'Compress' : f < 380 ? 'New Gap' : 'Result';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - 20, H - 22);

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
