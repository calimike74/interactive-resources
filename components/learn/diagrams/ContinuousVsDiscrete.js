'use client';

import { useEffect, useRef } from 'react';

// Two stacked panels sharing ONE wave function — Panel A draws it as an
// unbroken continuous curve (analogue), Panel B draws the SAME wave as a
// sample-and-hold staircase built from only 16 discrete measurements
// (digital). This is deliberately a different mechanism from the two REUSED
// diagrams this chapter also cites: BitDepthStaircase quantises the
// AMPLITUDE axis at fine time resolution (a vertical/rounding staircase);
// this diagram quantises the TIME axis at full amplitude precision (a
// horizontal/hold staircase) — the axis this chapter's row 1 is actually
// teaching (continuous vs discrete), not either reused diagram's own axis.
//
// CYCLES=2 (a gentle, illustrative wave shape — not a real frequency) and
// N=16 (an illustrative sample count — not a real sample rate) are both
// invented for a clean, countable diagram. Disclosed here and in the task
// report. waveValue(t) is the SINGLE source of truth for both panels' curve
// AND every one of panel B's sample y-values (via plotY), so panel B's dots
// and hold-steps can never float off the wave panel A draws — literally the
// "same wave" the brief specifies.
//
// Label-clearance (geometry is static across every frame — only reveal alpha
// and stepsToShow animate, so this holds at every animation extreme):
//   - Panel A's curve occupies y=[95-32,95+32]=[63,127]. Its label sits at
//     y=48 (curve top 63 is 15px clear below the label) and its caption at
//     y=150 (curve bottom 127 is 23px clear above the caption) — the same
//     proven geometry SampleRateGrid.js uses for its own top panel.
//   - Panel B's dots, hold-steps and ghost curve are all bounded to
//     y=[215-32,215+32]=[183,247], because every sample's y comes from the
//     same plotY(midY,amp,t) call the curve uses, clamped to that panel's
//     own amplitude. Its label sits at y=168 (15px clear above) and its
//     caption at y=262 (15px clear below, 10px clear of the phase indicator
//     at y=272) — again SampleRateGrid.js's own proven numbers.
//   - No curve, dot or hold-step is ever drawn outside its own panel's
//     y-band, so panel A's elements can never reach panel B's label (or vice
//     versa), and neither panel's plot can ever reach the title (y=16).
export default function ContinuousVsDiscrete() {
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

        const X0 = 60;
        const X1 = 440;
        const CYCLES = 2; // illustrative "gentle wave" — not a real Hz value
        const N = 16; // illustrative sample count — not a real sample rate

        // Single source of truth for the curve BOTH panels share.
        const waveValue = (t) => Math.sin(t * 2 * Math.PI * CYCLES);
        const pxX = (t) => X0 + t * (X1 - X0);
        const plotY = (midY, amp, t) => midY - amp * waveValue(t);

        const sampleTs = (n) => Array.from({ length: n }, (_, i) => i / (n - 1));
        const ts = sampleTs(N);

        const PANEL_A = { midY: 95, amp: 32, labelY: 48, capY: 150, color: '#374151', label: 'Analogue: continuous voltage', cap: 'One unbroken line: a value exists at every instant' };
        const PANEL_B = { midY: 215, amp: 32, labelY: 168, capY: 262, color: '#14b8a6', label: `Digital: ${N} discrete samples`, cap: 'Only these measurements exist: held flat until the next one' };

        const drawSmoothCurve = (panel, alpha, faint) => {
            ctx.globalAlpha = faint ? alpha * 0.35 : alpha;
            ctx.strokeStyle = faint ? '#d1d5db' : panel.color;
            ctx.lineWidth = faint ? 1 : 1.6;
            ctx.beginPath();
            for (let i = 0; i <= 200; i++) {
                const t = i / 200;
                const x = pxX(t);
                const y = plotY(panel.midY, panel.amp, t);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
        };

        const drawBaseline = (panel, alpha) => {
            ctx.globalAlpha = alpha * 0.5;
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 3]);
            ctx.beginPath();
            ctx.moveTo(X0, panel.midY);
            ctx.lineTo(X1, panel.midY);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalAlpha = 1;
        };

        const PHASE_A = { label: 20, curve: 45, cap: 130 };
        const PHASE_B = { label: 230, ghost: 255, dots: 285, dotStagger: 4, dotDur: 16, holds: 365, cap: 430 };

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
            ctx.fillText('Analogue vs Digital: Continuous vs Discrete', W / 2, 16);
            ctx.globalAlpha = 1;

            // --- Panel A: continuous ---
            const aLabelP = progress(f, PHASE_A.label, 20);
            if (aLabelP > 0) {
                ctx.globalAlpha = aLabelP;
                ctx.fillStyle = PANEL_A.color;
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(PANEL_A.label, W / 2, PANEL_A.labelY);
                ctx.globalAlpha = 1;
            }
            const aCurveP = progress(f, PHASE_A.curve, 30);
            if (aCurveP > 0) {
                drawBaseline(PANEL_A, aCurveP);
                drawSmoothCurve(PANEL_A, aCurveP, false);
            }
            const aCapP = progress(f, PHASE_A.cap, 25);
            if (aCapP > 0) {
                ctx.globalAlpha = aCapP;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 8.5px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(PANEL_A.cap, W / 2, PANEL_A.capY);
                ctx.globalAlpha = 1;
            }

            // --- Panel B: discrete ---
            const bLabelP = progress(f, PHASE_B.label, 20);
            if (bLabelP > 0) {
                ctx.globalAlpha = bLabelP;
                ctx.fillStyle = PANEL_B.color;
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(PANEL_B.label, W / 2, PANEL_B.labelY);
                ctx.globalAlpha = 1;
            }
            const bGhostP = progress(f, PHASE_B.ghost, 30);
            if (bGhostP > 0) {
                drawBaseline(PANEL_B, bGhostP);
                drawSmoothCurve(PANEL_B, bGhostP, true);
            }

            // Dots — every one computed from the SAME plotY(t) as panel A's curve.
            ts.forEach((t, i) => {
                const dotP = progress(f, PHASE_B.dots + i * PHASE_B.dotStagger, PHASE_B.dotDur);
                if (dotP <= 0) return;
                const x = pxX(t);
                const y = plotY(PANEL_B.midY, PANEL_B.amp, t);
                ctx.globalAlpha = dotP;
                ctx.fillStyle = PANEL_B.color;
                ctx.beginPath();
                ctx.arc(x, y, 2.6, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            });

            // Sample-and-hold staircase: hold each sample's y flat until the
            // next sample's x, then jump — a zero-order hold, exactly what a
            // DAC reconstructs before smoothing. Revealed one segment at a
            // time via stepsToShow, same progressive-reveal idiom as
            // BitDepthStaircase.js's stair phase.
            const holdsP = progress(f, PHASE_B.holds, 60);
            if (holdsP > 0) {
                ctx.globalAlpha = 1;
                ctx.strokeStyle = PANEL_B.color;
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                const segsToShow = Math.max(0, Math.round((N - 1) * holdsP));
                let prevY = plotY(PANEL_B.midY, PANEL_B.amp, ts[0]);
                ctx.moveTo(pxX(ts[0]), prevY);
                for (let i = 1; i <= segsToShow; i++) {
                    const x = pxX(ts[i]);
                    const y = plotY(PANEL_B.midY, PANEL_B.amp, ts[i]);
                    ctx.lineTo(x, prevY); // hold flat at the previous sample's y
                    ctx.lineTo(x, y); // vertical jump to the new sample's y
                    prevY = y;
                }
                // Final hold from the last revealed sample out to X1, once
                // every segment is shown — the DAC output holds until the
                // NEXT (off-diagram) sample would arrive.
                if (segsToShow >= N - 1) {
                    ctx.lineTo(X1, prevY);
                }
                ctx.stroke();
            }

            const bCapP = progress(f, PHASE_B.cap, 25);
            if (bCapP > 0) {
                ctx.globalAlpha = bCapP;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 8.5px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(PANEL_B.cap, W / 2, PANEL_B.capY);
                ctx.globalAlpha = 1;
            }

            const phase = f < PHASE_A.cap ? 'Analogue'
                : f < PHASE_B.dots ? 'Compare'
                : 'Digital';
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
