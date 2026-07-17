'use client';

import { useEffect, useRef } from 'react';

// Two stacked spectrum-bar panels — symmetric clipping (odd harmonics only)
// vs asymmetric clipping (odd + even) — mirroring HarmonicSeries.js's bar
// layout, extended to a second panel for the comparison this row teaches.
//
// harmonicAmp(n, includeEven) is the SINGLE function both panels' bars (and
// the "present/absent" state of every bar) are computed from — panel A
// calls it with includeEven=false, panel B with includeEven=true. No bar
// height or presence/absence is hardcoded separately from this function.
//
// Illustrative values (disclosed in the w3-task-3 report, not measured from
// any source): the 1/n amplitude decay for odd harmonics and the 0.6/n
// weighting for added even harmonics are simplified, mentally-clean shapes
// chosen to make the odd-only vs odd+even contrast legible as a bar chart —
// CombinedDistortionLab.jsx's own harmonic-bar visualisation uses a similarly
// illustrative decay, not a measured spectrum.
export default function OddEvenHarmonics() {
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

        const CYCLE = 640;
        let animId;

        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);

        const HARMONIC_COUNT = 8;
        const ODD_COLOR = '#e85d75';
        const EVEN_COLOR = '#14b8a6';
        const FUND_COLOR = '#9ca3af';

        // Single source of truth for every bar's amplitude in both panels.
        function harmonicAmp(n, includeEven) {
            if (n === 1) return 1.0; // fundamental — always present
            const isOdd = n % 2 === 1;
            if (isOdd) return 1 / n; // odd harmonics present in both scenarios
            return includeEven ? 0.6 / n : 0; // even harmonics only when asymmetric
        }

        const margin = { left: 46, right: 20 };
        const plotW = W - margin.left - margin.right;
        const barSlot = plotW / HARMONIC_COUNT;
        const barW = barSlot - 14;

        // capY is deliberately 10px+ clear of each panel's ODD/EVEN tag row
        // (baseY + 10, drawn in drawPanel below) so the caption's italic text
        // never sits adjacent to the small per-bar tags above it.
        const PANELS = [
            { includeEven: false, top: 50, h: 66, labelY: 40, capY: 142, name: 'Symmetric clipping — hard or soft' },
            { includeEven: true, top: 172, h: 66, labelY: 162, capY: 262, name: 'Asymmetric clipping — e.g. tube saturation' },
        ];

        const PHASE = [
            { label: 20, barStart: 45, barStep: 16, cap: 190 },
            { label: 250, barStart: 275, barStep: 16, cap: 420 },
        ];

        const drawPanel = (panel, ph, f) => {
            const baseY = panel.top + panel.h;
            const labelP = progress(f, ph.label, 20);
            if (labelP > 0) {
                ctx.globalAlpha = labelP;
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(panel.name, W / 2, panel.labelY);
                ctx.globalAlpha = 1;
            }
            if (labelP <= 0) return;

            for (let n = 1; n <= HARMONIC_COUNT; n++) {
                const i = n - 1;
                const barP = progress(f, ph.barStart + i * ph.barStep, 26);
                if (barP <= 0) continue;

                const amp = harmonicAmp(n, panel.includeEven);
                const x = margin.left + i * barSlot + (barSlot - barW) / 2;
                const isOdd = n % 2 === 1;
                const color = n === 1 ? FUND_COLOR : isOdd ? ODD_COLOR : EVEN_COLOR;

                ctx.globalAlpha = labelP * barP;

                if (amp > 0) {
                    const barHeight = panel.h * amp * barP;
                    ctx.fillStyle = color;
                    ctx.fillRect(x, baseY - barHeight, barW, barHeight);
                } else {
                    // Absent even harmonic — a faint baseline tick so the absence reads
                    // as deliberate, not just empty space.
                    ctx.strokeStyle = '#d1d5db';
                    ctx.lineWidth = 1;
                    ctx.setLineDash([2, 2]);
                    ctx.beginPath();
                    ctx.moveTo(x, baseY);
                    ctx.lineTo(x + barW, baseY);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }

                ctx.fillStyle = n === 1 ? FUND_COLOR : color;
                ctx.font = 'bold 7.5px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(n === 1 ? 'Fund' : `×${n}`, x + barW / 2, baseY - Math.max(4, panel.h * amp * barP) - 4);

                if (n > 1) {
                    ctx.fillStyle = color;
                    ctx.font = '6.5px -apple-system, sans-serif';
                    ctx.fillText(isOdd ? 'ODD' : (panel.includeEven ? 'EVEN' : ''), x + barW / 2, baseY + 10);
                }

                ctx.globalAlpha = 1;
            }
        };

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
            ctx.fillText('Odd vs Even Harmonics', W / 2, 16);
            ctx.globalAlpha = 1;

            drawPanel(PANELS[0], PHASE[0], f);
            drawPanel(PANELS[1], PHASE[1], f);

            const capAP = progress(f, PHASE[0].cap, 25);
            if (capAP > 0) {
                ctx.globalAlpha = capAP;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 8.5px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Odd harmonics only (3rd, 5th, 7th…) — hollow, buzzy character', W / 2, PANELS[0].capY);
                ctx.globalAlpha = 1;
            }

            const capBP = progress(f, PHASE[1].cap, 25);
            if (capBP > 0) {
                ctx.globalAlpha = capBP;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 8.5px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Even harmonics (2nd, 4th, 6th…) join in — the "warm" character', W / 2, PANELS[1].capY);
                ctx.globalAlpha = 1;
            }

            const phase = f < PHASE[0].cap ? 'Symmetric' : f < PHASE[1].barStart ? 'Compare' : 'Asymmetric';
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
