'use client';

import { useEffect, useRef } from 'react';

// Two simple functions, matching the exam anchor's own "over four bars" wording:
//   dryLevel(t) = 100*(1-t)   — linear fall to silence
//   wetLevel(t) = 65          — constant (illustrative reference level, disclosed)
// converted to pixels via x(t)=50+390*t, y(level)=210-1.5*level.
//
// Label clearance (independently recomputed in Node, see report):
//   DRY label spans x=[90,190], text band y=[52,62]. dry_y(x) over that span
//   ranges 75.45 (at x=90) to 113.85 (at x=190) — minimum clearance to the
//   label's bottom (62) is 75.45-62=13.45px. The wet line (constant y=112.5)
//   is 50.5px below the label band — nowhere close.
//   WET label spans x=[300,400], text band y=[132,142]. dry_y(x) over that
//   span ranges 156.15 (x=300) to 194.55 (x=400) — minimum clearance to the
//   label's bottom (142) is 156.15-142=14.15px. The wet line (y=112.5) is
//   19.5px above the label's top (132).
// The two labels occupy disjoint x-ranges (190 < 300) so they cannot collide
// with each other either.
export default function ReverbFadeAutomation() {
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

        const X0 = 50;
        const X1 = 440;
        const dryLevel = (t) => 100 * (1 - t);
        const wetLevel = () => 65; // illustrative constant reference level, disclosed
        const xOf = (t) => X0 + (X1 - X0) * t;
        const yOf = (level) => 210 - 1.5 * level;

        const PHASE_AXIS = 20;
        const PHASE_LINES = 50;
        const LINES_DUR = 200;
        const PHASE_DRYLABEL = 130;
        const PHASE_WETLABEL = 235;
        const PHASE_CAPTION = 265;

        const draw = () => {
            frameRef.current = (frameRef.current + 0.6) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            const titleP = progress(f, 0, 20);
            ctx.globalAlpha = titleP;
            ctx.fillStyle = '#1a1a2e';
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('The Reverb-Fade Trick — Dry Falls, Wet Holds', W / 2, 16);
            ctx.globalAlpha = 1;

            const axisP = progress(f, PHASE_AXIS, 20);
            if (axisP > 0) {
                ctx.globalAlpha = axisP;
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(X0, 210);
                ctx.lineTo(X1, 210);
                ctx.stroke();
                ctx.fillStyle = '#9ca3af';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText('full', 42, 63);
                ctx.fillText('silence', 42, 210);
                ctx.textAlign = 'center';
                for (let bar = 1; bar <= 4; bar++) {
                    const bx = xOf((bar - 0.5) / 4);
                    ctx.fillText(`Bar ${bar}`, bx, 228);
                }
                ctx.globalAlpha = 1;
            }

            const linesP = progress(f, PHASE_LINES, LINES_DUR);
            if (linesP > 0) {
                ctx.globalAlpha = 1;
                // Dry line — computed, no hardcoded points
                ctx.strokeStyle = '#e85d75';
                ctx.lineWidth = 2;
                ctx.beginPath();
                const steps = 60;
                for (let i = 0; i <= steps; i++) {
                    const t = (i / steps) * linesP;
                    if (t > linesP) break;
                    const x = xOf(t);
                    const y = yOf(dryLevel(t));
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();

                // Wet line — constant
                ctx.strokeStyle = '#14b8a6';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(X0, yOf(wetLevel()));
                ctx.lineTo(xOf(linesP), yOf(wetLevel()));
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            const dryLabelP = progress(f, PHASE_DRYLABEL, 20);
            if (dryLabelP > 0) {
                ctx.globalAlpha = dryLabelP;
                ctx.fillStyle = '#e85d75';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('DRY — fades to silence', 90, 60);
                ctx.globalAlpha = 1;
            }

            const wetLabelP = progress(f, PHASE_WETLABEL, 20);
            if (wetLabelP > 0) {
                ctx.globalAlpha = wetLabelP;
                ctx.fillStyle = '#14b8a6';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('WET — holds constant', 300, 140);
                ctx.globalAlpha = 1;
            }

            const capP = progress(f, PHASE_CAPTION, 25);
            if (capP > 0) {
                ctx.globalAlpha = capP;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('The dry voice disappears while the wet room remains — the singer walks away', W / 2, 250);
                ctx.globalAlpha = 1;
            }

            const phase = f < PHASE_DRYLABEL ? 'Fading'
                : f < PHASE_WETLABEL ? 'Dry falling'
                : 'Wet survives';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - 20, H - 8);

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

    return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', borderRadius: '0.75rem' }} />;
}
