'use client';

import { useEffect, useRef } from 'react';

// Two stacked panels, same underlying gesture, same amplitude axis: a wheel
// push from centre up to max, back through centre to min, and back to
// centre — bendValue(t) is the SINGLE function both panels' grey reference
// trace reads from, and quantizeToLevels(t, levels) = round(bendValue(t) *
// (levels-1)) / (levels-1) is the SINGLE function every rendered step in
// both panels is computed from (matches BitDepthStaircase.js's
// quantizeNorm pattern exactly, applied to a value axis instead of an
// amplitude axis). No step is ever a hardcoded point.
//
// Rendered step counts (STEPS_COARSE=12, STEPS_FINE=56) are a REDUCED
// illustrative visualization chosen for on-canvas visibility only — 128 or
// 16,384 individual gridlines cannot be rendered as distinguishable marks
// in a ~120px-tall panel. The real MIDI values (128 for 7-bit CC, 16,384
// for 14-bit pitch bend) are the actual teaching content and are stated as
// text on each panel, not implied by the rendered step count — same
// disclosure pattern as SampleRateGrid.js's N_DENSE/N_SPARSE ("illustrative
// ... not a real Hz value"). Disclosed in the w3-task-4 report.
//
// bendValue(t) = sin(2*PI*t) is an invented illustrative gesture shape (a
// full up-bend/down-bend sweep), not a real captured wheel movement.
// Disclosed in the w3-task-4 report.
//
// Label-clearance: panel A's plot occupies y=[55,150] (mid=102.5, so the
// 0/64/127 value labels sit inside this band); its label sits at y=44
// (11px clear above) and its caption at y=163 (13px clear below). Panel B's
// plot occupies y=[198,250] (mid=224); its label sits at y=187 (11px clear
// above) and its caption at y=263 (13px clear below, 9px clear of the phase
// indicator at y=272). No trace or value label is ever drawn outside its
// own panel's y-band, so the two panels' text can never be crossed by the
// other panel's lines — same geometry discipline as BitDepthStaircase.js.
export default function PitchBendResolution() {
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

        const CYCLE = 600;
        let animId;

        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);

        const X0 = 60;
        const X1 = 440;
        // Illustrative gesture: centre -> full up-bend -> centre -> full
        // down-bend -> centre. Not a real captured wheel movement.
        const bendValue = (t) => Math.sin(2 * Math.PI * t);
        const pxX = (t) => X0 + t * (X1 - X0);

        // Single source of truth: round-to-level of the gesture, shared by
        // both panels (only `levels` differs).
        const quantizeToLevels = (t, levels) => Math.round(((bendValue(t) + 1) / 2) * (levels - 1)) / (levels - 1) * 2 - 1;

        // Reduced illustrative step counts for on-canvas visibility — NOT the
        // real MIDI values. The real values (128, 16,384) are stated as text
        // on each panel below; see header comment.
        const STEPS_COARSE = 12;
        const STEPS_FINE = 56;

        const PANELS = [
            { top: 55, bottom: 150, mid: 102.5, labelY: 44, capY: 163, steps: STEPS_COARSE, color: '#f97316', title: '7-bit — one data byte (128 real positions, 0–127)', cap: 'audible steps — the "zipper" effect' },
            { top: 198, bottom: 250, mid: 224, labelY: 187, capY: 263, steps: STEPS_FINE, color: '#14b8a6', title: '14-bit — status + LSB + MSB (16,384 real positions)', cap: 'far too fine to hear a step — reads as smooth' },
        ];
        const plotY = (panel, norm) => panel.mid - norm * (panel.mid - panel.top);

        const PHASE = [
            { label: 20, curve: 45, stair: 100, cap: 220 },
            { label: 260, curve: 285, stair: 340, cap: 460 },
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
            ctx.fillText('Pitch Bend Resolution: One Byte vs Two', W / 2, 16);
            ctx.globalAlpha = 1;

            PANELS.forEach((panel, pi) => {
                const ph = PHASE[pi];

                const labelP = progress(f, ph.label, 20);
                if (labelP > 0) {
                    ctx.globalAlpha = labelP;
                    ctx.fillStyle = panel.color;
                    ctx.font = 'bold 9px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(panel.title, W / 2, panel.labelY);
                    ctx.globalAlpha = 1;
                }

                // Centre reference line (value = 0, i.e. no bend).
                if (labelP > 0) {
                    ctx.globalAlpha = labelP * 0.5;
                    ctx.strokeStyle = '#d1d5db';
                    ctx.lineWidth = 1;
                    ctx.setLineDash([2, 3]);
                    ctx.beginPath();
                    ctx.moveTo(X0, panel.mid);
                    ctx.lineTo(X1, panel.mid);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.globalAlpha = 1;
                }

                const curveP = progress(f, ph.curve, 30);
                if (curveP > 0) {
                    ctx.globalAlpha = curveP * 0.45;
                    ctx.strokeStyle = '#9ca3af';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    for (let i = 0; i <= 200; i++) {
                        const t = i / 200;
                        const x = pxX(t);
                        const y = plotY(panel, bendValue(t));
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
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    const NX = panel.steps * 4;
                    const stepsToShow = Math.max(1, Math.round(NX * stairP));
                    let prevY = null;
                    for (let i = 0; i <= stepsToShow; i++) {
                        const t = i / NX;
                        const y = plotY(panel, quantizeToLevels(t, panel.steps));
                        const x = pxX(t);
                        if (i === 0) {
                            ctx.moveTo(x, y);
                        } else {
                            ctx.lineTo(x, prevY);
                            ctx.lineTo(x, y);
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
                    ctx.fillText(panel.cap, W / 2, panel.capY);
                    ctx.globalAlpha = 1;
                }
            });

            const phase = f < PHASE[0].cap ? '7-bit'
                : f < PHASE[1].stair ? 'Compare'
                : '14-bit';
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
