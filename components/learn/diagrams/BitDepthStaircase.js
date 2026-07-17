'use client';

import { useEffect, useRef } from 'react';

// Two stacked panels: 3 bits = 2³ = 8 levels (the mandatory worked example —
// every level line is drawn and individually labelled 0-7 so it can be
// counted), then 2 bits = 2² = 4 levels for contrast. LEVELS is always
// Math.pow(2, BITS), never hand-typed, so the count is an exact power of two
// by construction. quantizeNorm(t, levels) = round(ampNorm(t)*(levels-1))/
// (levels-1) is the SINGLE function used both to place the level gridlines'
// implied values and to compute every point of the staircase — the staircase
// cannot float off a level that isn't drawn. The x-resolution used to draw
// the staircase (NX=48 steps) is a rendering choice only, unrelated to
// sample-rate/Nyquist (bit depth is the vertical/amplitude axis, not the
// horizontal/time axis) — noted so the two concepts are not conflated.
//
// Label-clearance: panel A's plot occupies y=[55,165]; its label sits at
// y=44 (11px clear above) and its caption at y=178 (13px clear below).
// Panel B's plot occupies y=[200,250]; its label sits at y=192 (8px clear
// above) and its caption at y=262 (12px clear below, 10px clear of the phase
// indicator at y=272). No curve or staircase segment is drawn outside its
// own panel's y-band, so the two panels' text can never be crossed by the
// other panel's lines.
export default function BitDepthStaircase() {
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

        const CYCLE = 580;
        let animId;

        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);

        const X0 = 60;
        const X1 = 440;
        const CYCLES = 2; // gentle shape — chosen for clean, countable level crossings
        const ampNorm = (t) => 0.5 + 0.5 * Math.sin(t * 2 * Math.PI * CYCLES);
        const pxX = (t) => X0 + t * (X1 - X0);

        // Single source of truth: round-to-level of the wave function.
        const quantizeNorm = (t, levels) => Math.round(ampNorm(t) * (levels - 1)) / (levels - 1);

        const NX = 48; // rendering resolution for the staircase steps only

        const PANELS = [
            { bits: 3, top: 55, bottom: 165, labelY: 44, capY: 178, color: '#e85d75' },
            { bits: 2, top: 200, bottom: 250, labelY: 192, capY: 262, color: '#f97316' },
        ];

        const plotYFromNorm = (panel, norm) => panel.bottom - norm * (panel.bottom - panel.top);

        const PHASE = [
            { label: 25, gridStart: 55, gridStep: 12, curve: 165, stair: 195, cap: 300 },
            { label: 335, gridStart: 355, gridStep: 10, curve: 400, stair: 425, cap: 480 },
        ];

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
            ctx.fillText('Bit Depth: Snapping to a Staircase', W / 2, 16);
            ctx.globalAlpha = 1;

            PANELS.forEach((panel, pi) => {
                const ph = PHASE[pi];
                const levels = Math.pow(2, panel.bits);

                const labelP = progress(f, ph.label, 20);
                if (labelP > 0) {
                    ctx.globalAlpha = labelP;
                    ctx.fillStyle = panel.color;
                    ctx.font = 'bold 9px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${panel.bits} bits = 2^${panel.bits} = ${levels} levels`, W / 2, panel.labelY);
                    ctx.globalAlpha = 1;
                }

                // Level gridlines, counted in one by one.
                for (let L = 0; L < levels; L++) {
                    const p = progress(f, ph.gridStart + L * ph.gridStep, 14);
                    if (p <= 0) continue;
                    const norm = L / (levels - 1);
                    const y = plotYFromNorm(panel, norm);
                    ctx.globalAlpha = p * 0.7;
                    ctx.strokeStyle = '#d1d5db';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(X0, y);
                    ctx.lineTo(X1, y);
                    ctx.stroke();
                    ctx.globalAlpha = p;
                    ctx.fillStyle = '#9ca3af';
                    ctx.font = '7px -apple-system, sans-serif';
                    ctx.textAlign = 'right';
                    ctx.fillText(String(L), X0 - 6, y + 2.5);
                    ctx.globalAlpha = 1;
                }

                const curveP = progress(f, ph.curve, 30);
                if (curveP > 0) {
                    ctx.globalAlpha = curveP * 0.5;
                    ctx.strokeStyle = '#9ca3af';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    for (let i = 0; i <= 200; i++) {
                        const t = i / 200;
                        const x = pxX(t);
                        const y = plotYFromNorm(panel, ampNorm(t));
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }

                const stairP = progress(f, ph.stair, 90);
                if (stairP > 0) {
                    ctx.globalAlpha = 1;
                    ctx.strokeStyle = panel.color;
                    ctx.lineWidth = 1.6;
                    ctx.beginPath();
                    const stepsToShow = Math.max(1, Math.round(NX * stairP));
                    let prevY = null;
                    for (let i = 0; i <= stepsToShow; i++) {
                        const t = i / NX;
                        const x = pxX(t);
                        const y = plotYFromNorm(panel, quantizeNorm(t, levels));
                        if (i === 0) {
                            ctx.moveTo(x, y);
                        } else {
                            ctx.lineTo(x, prevY); // horizontal hold
                            ctx.lineTo(x, y); // vertical step
                        }
                        prevY = y;
                    }
                    ctx.stroke();
                }

                const capP = progress(f, ph.cap, 25);
                if (capP > 0) {
                    ctx.globalAlpha = capP;
                    ctx.fillStyle = '#374151';
                    ctx.font = 'italic 8.5px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    const cap = panel.bits === 3
                        ? 'The wave snaps to the nearest of 8 levels — a coarse staircase'
                        : 'Fewer levels still — even coarser, more audible quantisation noise';
                    ctx.fillText(cap, W / 2, panel.capY);
                    ctx.globalAlpha = 1;
                }
            });

            const phase = f < PHASE[0].cap ? '3 bits — 8 levels'
                : f < PHASE[1].stair ? 'Compare'
                : '2 bits — 4 levels';
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
