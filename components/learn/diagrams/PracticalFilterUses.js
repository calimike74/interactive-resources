'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: three small-multiple panels reveal in sequence, each mirroring one of
// the row's own examples — HPF clearing vocal rumble, narrow notches pulling out mains hum and
// its harmonics, a band-pass carving the creative "telephone effect" — then all three held
// together with a shared caption.
export default function PracticalFilterUses() {
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
        const panelH = 74;
        const gap = 8;
        const topY = 26;

        const panels = [
            { x: 20, y: topY, w: panelW, h: panelH, kind: 'hpf', color: '#9B7530', title: 'Vocal Rumble — HPF', sub: '80–120 Hz cut-off, plosives too', start: 20 },
            { x: 20, y: topY + panelH + gap, w: panelW, h: panelH, kind: 'notch', color: '#DC2626', title: 'Mains Hum — Notches', sub: '50 Hz + harmonics (100, 150 Hz)', start: 200 },
            { x: 20, y: topY + (panelH + gap) * 2, w: panelW, h: panelH, kind: 'bandpass', color: '#0891b2', title: 'Telephone Effect — Band-Pass', sub: 'creative — breakdowns & transitions', start: 380 },
        ];

        const drawPanel = (panel, appear) => {
            const { x, y, w, h, kind, color, title, sub } = panel;
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
            ctx.font = 'bold 9px -apple-system, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(title, x + 10, y + 14);
            ctx.fillStyle = '#6b7280';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.fillText(sub, x + 10, y + 25);

            // Mini plot region, right two-thirds of the panel — kept well below both text
            // rows (title, subtitle) so a flat curve baseline can never sit at the same height
            // as the text regardless of how far the text extends horizontally
            const plotX = x + w * 0.34;
            const plotY = y + 34;
            const plotW = w * 0.6;
            const plotH = h - 40;
            const midY = plotY + plotH / 2;

            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(plotX, midY);
            ctx.lineTo(plotX + plotW, midY);
            ctx.stroke();

            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();

            if (kind === 'hpf') {
                const cutX = plotX + plotW * 0.28;
                for (let px = 0; px <= plotW; px++) {
                    const nx = px / plotW;
                    const diff = (0.28 - nx) * 10;
                    const gain = diff <= 0 ? 1 : 1 / (1 + diff * diff);
                    const py = midY + plotH / 2 - gain * plotH * 0.85;
                    if (px === 0) ctx.moveTo(plotX + px, py);
                    else ctx.lineTo(plotX + px, py);
                }
                ctx.stroke();
                ctx.setLineDash([2, 2]);
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(cutX, plotY);
                ctx.lineTo(cutX, plotY + plotH);
                ctx.stroke();
                ctx.setLineDash([]);
            } else if (kind === 'notch') {
                const notches = [0.2, 0.42, 0.6];
                for (let px = 0; px <= plotW; px++) {
                    const nx = px / plotW;
                    let dip = 0;
                    notches.forEach((n) => {
                        const d = (nx - n) * 26;
                        dip += Math.exp(-d * d);
                    });
                    const py = midY - plotH * 0.3 + dip * plotH * 0.65;
                    if (px === 0) ctx.moveTo(plotX + px, py);
                    else ctx.lineTo(plotX + px, py);
                }
                ctx.stroke();
            } else {
                // band-pass: narrow pass window
                for (let px = 0; px <= plotW; px++) {
                    const nx = px / plotW;
                    const dist = Math.abs(nx - 0.5) / 0.14;
                    const gain = 1 / (1 + dist * dist * 4);
                    const py = midY + plotH / 2 - gain * plotH * 0.85;
                    if (px === 0) ctx.moveTo(plotX + px, py);
                    else ctx.lineTo(plotX + px, py);
                }
                ctx.stroke();
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
            ctx.fillText('Filters in Practice', W / 2, 14);
            ctx.globalAlpha = 1;

            panels.forEach((panel) => {
                const appear = progress(f, panel.start, 60);
                if (appear > 0) drawPanel(panel, appear);
            });

            const capP = progress(f, 470, 40) * (f < CYCLE - 60 ? 1 : clamp(1 - (f - (CYCLE - 60)) / 30, 0, 1));
            if (capP > 0) {
                ctx.globalAlpha = capP;
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Same filter shapes, different jobs — corrective and creative', W / 2, H - 8);
                ctx.globalAlpha = 1;
            }

            const phase = f < 200 ? 'HPF' : f < 380 ? 'Notches' : f < 470 ? 'Band-Pass' : 'Complete';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - 20, 14);

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
