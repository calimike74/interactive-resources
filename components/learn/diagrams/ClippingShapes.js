'use client';

import { useEffect, useRef } from 'react';

// Two stacked panels, same time axis, same amplitude axis: a driven sine
// (gray, "original") overlaid with its hard-clipped (panel A) and
// soft-clipped (panel B) shapes. rawSine(t) is the SINGLE function both
// panels' gray trace reads from; hardClip(x) and softClip(x) are the SINGLE
// functions each panel's coloured trace is computed from — no hardcoded
// curve points anywhere, only these three functions sampled at render time.
//
// softClip reuses the exact driveCurve() shape from lib/learn/audio-presets.js
// (y = (1+k)x / (1+k|x|)) at k = DIST_DRIVE_FIXED_K (4) — the same k the
// dist-drive audio preset (row 2's audio block) uses, so the "rounded
// shoulders" drawn here match what that preset actually sounds like.
//
// Invented illustrative values (disclosed in the w3-task-3 report):
// INPUT_AMPLITUDE = 1.4 (chosen so the driven wave visibly overshoots the
// ±1.0 hard-clip threshold on both halves) and CYCLES = 2.5 (chosen purely
// so the panels show a legible, non-cluttered number of clipped peaks).
//
// Label-clearance: panel A's plot occupies y=[55,165]; its label sits at
// y=44 (11px clear above) and its caption at y=178 (13px clear below).
// Panel B's plot occupies y=[200,250]; its label sits at y=192 (8px clear
// above) and its caption at y=262 (12px clear below, 10px clear of the phase
// indicator at y=272). No trace is drawn outside its own panel's y-band, so
// the two panels' text can never be crossed by the other panel's lines —
// same geometry discipline as BitDepthStaircase.js, whose panel-B numbers
// this diagram reuses exactly.
export default function ClippingShapes() {
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

        const CYCLE = 620;
        let animId;

        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);

        const X0 = 60;
        const X1 = 440;
        const CYCLES = 2.5; // illustrative — chosen for a legible number of clipped peaks
        const INPUT_AMPLITUDE = 1.4; // illustrative — overshoots the ±1.0 hard threshold on both halves
        const HARD_THRESHOLD = 1.0;
        const SOFT_K = 4; // matches DIST_DRIVE_FIXED_K in lib/learn/audio-presets.js

        const rawSine = (t) => INPUT_AMPLITUDE * Math.sin(t * 2 * Math.PI * CYCLES);
        const hardClip = (x) => clamp(x, -HARD_THRESHOLD, HARD_THRESHOLD);
        const softClip = (x) => ((1 + SOFT_K) * x) / (1 + SOFT_K * Math.abs(x));

        const pxX = (t) => X0 + t * (X1 - X0);

        const AMP_RANGE = 1.6; // headroom above the 1.4 peak so no trace touches the panel edge
        const ampToY = (panel, amp) => {
            const mid = (panel.top + panel.bottom) / 2;
            const halfH = (panel.bottom - panel.top) / 2;
            return mid - (amp / AMP_RANGE) * halfH;
        };

        const PANELS = [
            { name: 'hard', top: 55, bottom: 165, labelY: 44, capY: 178, color: '#e85d75' },
            { name: 'soft', top: 200, bottom: 250, labelY: 192, capY: 262, color: '#14b8a6' },
        ];

        const PHASE = [
            { label: 30, threshold: 55, original: 90, clipped: 160, cap: 235 },
            { label: 275, original: 305, clipped: 375, cap: 455 },
        ];

        const drawTrace = (panel, fn, alpha, revealFrac) => {
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            const points = Math.max(1, Math.floor(200 * revealFrac));
            for (let i = 0; i <= points; i++) {
                const t = i / 200;
                const x = pxX(t);
                const y = ampToY(panel, fn(t));
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
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
            ctx.fillText('Hard vs Soft Clipping', W / 2, 16);
            ctx.globalAlpha = 1;

            PANELS.forEach((panel, pi) => {
                const ph = PHASE[pi];

                const labelP = ph.label !== undefined ? progress(f, ph.label, 20) : 1;
                if (labelP > 0) {
                    ctx.globalAlpha = labelP;
                    ctx.fillStyle = panel.color;
                    ctx.font = 'bold 9px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(
                        panel.name === 'hard' ? 'Hard clipping: threshold at ±1.0' : 'Soft clipping: the same driven sine',
                        W / 2,
                        panel.labelY
                    );
                    ctx.globalAlpha = 1;
                }

                // Zero line
                if (labelP > 0) {
                    ctx.globalAlpha = labelP * 0.6;
                    ctx.strokeStyle = '#d1d5db';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(X0, ampToY(panel, 0));
                    ctx.lineTo(X1, ampToY(panel, 0));
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }

                // Threshold dashed lines — hard-clip panel only
                if (panel.name === 'hard') {
                    const threshP = progress(f, ph.threshold, 20);
                    if (threshP > 0) {
                        ctx.globalAlpha = threshP * 0.8;
                        ctx.strokeStyle = '#9ca3af';
                        ctx.lineWidth = 1;
                        ctx.setLineDash([3, 3]);
                        [HARD_THRESHOLD, -HARD_THRESHOLD].forEach((v) => {
                            ctx.beginPath();
                            ctx.moveTo(X0, ampToY(panel, v));
                            ctx.lineTo(X1, ampToY(panel, v));
                            ctx.stroke();
                        });
                        ctx.setLineDash([]);
                        ctx.globalAlpha = 1;
                    }
                }

                const origP = progress(f, ph.original, 55);
                if (origP > 0) {
                    ctx.strokeStyle = '#9ca3af';
                    ctx.lineWidth = 1.2;
                    drawTrace(panel, rawSine, origP * 0.65, origP);
                }

                const clipP = progress(f, ph.clipped, 65);
                if (clipP > 0) {
                    ctx.strokeStyle = panel.color;
                    ctx.lineWidth = 2;
                    const clipFn = panel.name === 'hard' ? (t) => hardClip(rawSine(t)) : (t) => softClip(rawSine(t));
                    drawTrace(panel, clipFn, clipP, clipP);
                }

                const capP = progress(f, ph.cap, 25);
                if (capP > 0) {
                    ctx.globalAlpha = capP;
                    ctx.fillStyle = '#374151';
                    ctx.font = 'italic 8.5px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    const cap = panel.name === 'hard'
                        ? 'Flat tops: everything past the threshold is simply cut off'
                        : 'Rounded shoulders: the peak is gently compressed, never sliced flat';
                    ctx.fillText(cap, W / 2, panel.capY);
                    ctx.globalAlpha = 1;
                }
            });

            const phase = f < PHASE[0].cap ? 'Hard clipping'
                : f < PHASE[1].clipped ? 'Compare'
                : 'Soft clipping';
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
