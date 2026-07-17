'use client';

import { useEffect, useRef } from 'react';

// Two stacked panels, one shared wave function (wave(t)=sin(4πt), CYCLES=2 — illustrative
// "sustained pad" shape, not a real frequency), each showing the SAME loop repeated twice
// so the seam sits at the same pixel (u=1 of a u∈[0,2] domain) in both panels. Panel A's
// loop points (BAD_L1=0.15, BAD_L2=0.55) are arbitrary — neither is a zero crossing, so
// wave(L2)=0.588 and wave(L1)=0.951 genuinely disagree: the seam is drawn as the real
// vertical difference between those two computed values, not a decorative mark. Panel B's
// loop points are never hand-picked to "look" zero — findZeroCrossingAfter() (the same
// step-search/interpolate solver as ZeroCrossingCut) finds the true crossings forward of
// each bad point (0.25 and 0.75). Verified: both resolve to ~0, AND their slopes match in
// sign (-12.57 each), so the join is smooth in value and direction, not just amplitude —
// the step at panel B's seam is not merely small, it is the same zero twice over.
//
// Label-clearance: panel A's curve is confined to y=[57,113] (midY=85, amp=28); its label
// sits at y=38 (19px clear above) and its step callout at y=128 (15px clear below). Panel
// B's curve occupies y=[170,226] (midY=198, amp=28); its label sits at y=155 (15px clear
// above) and its callout at y=241 (15px clear below). The two panels' label zones (up to
// y=128, from y=155) are 27px apart with no overlap. No curve or seam marker is ever drawn
// outside its own panel's y-band, so none can reach a label.
export default function LoopPointJoin() {
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
        const CYCLES = 2; // illustrative sustained shape — not a real frequency

        const wave = (t) => Math.sin(t * 2 * Math.PI * CYCLES);
        const pxU = (u) => X0 + (u / 2) * (X1 - X0); // u domain is [0,2] — two repeats
        const seamX = pxU(1); // = 250, always the panel midpoint

        const findZeroCrossingAfter = (startT, fn, step = 0.002, maxSteps = 500) => {
            let t0 = startT;
            let v0 = fn(t0);
            for (let i = 1; i <= maxSteps; i++) {
                const t1 = startT + i * step;
                const v1 = fn(t1);
                if (v0 !== 0 && Math.sign(v1) !== Math.sign(v0)) {
                    return t0 + (0 - v0) * (t1 - t0) / (v1 - v0);
                }
                t0 = t1;
                v0 = v1;
            }
            return startT;
        };

        const BAD_L1 = 0.15;
        const BAD_L2 = 0.55;
        const GOOD_L1 = findZeroCrossingAfter(BAD_L1, wave); // solves to 0.25
        const GOOD_L2 = findZeroCrossingAfter(BAD_L2, wave); // solves to 0.75

        const PANELS = [
            { midY: 85, amp: 28, labelY: 38, calloutY: 128, L1: BAD_L1, L2: BAD_L2, color: '#e85d75', label: 'Bad join — end value ≠ start value', callout: 'step — end doesn’t match start' },
            { midY: 198, amp: 28, labelY: 155, calloutY: 241, L1: GOOD_L1, L2: GOOD_L2, color: '#14b8a6', label: 'Good join — both on a zero crossing', callout: 'no step — same value, same direction' },
        ];

        const loopWave = (u, L1, L2) => {
            const frac = u - Math.floor(u); // u mod 1
            return wave(L1 + frac * (L2 - L1));
        };
        const plotY = (midY, amp, v) => midY - amp * v;

        const drawRepeat = (panel, uStart, uEnd, alpha) => {
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = '#374151';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            const N = 120;
            for (let i = 0; i <= N; i++) {
                const u = uStart + (i / N) * (uEnd - uStart);
                const x = pxU(u);
                const y = plotY(panel.midY, panel.amp, loopWave(u, panel.L1, panel.L2));
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
        };

        const PHASE = [
            { label: 20, rep1: 40, seam: 90, rep2: 120, callout: 165 },
            { label: 210, rep1: 230, seam: 280, rep2: 310, callout: 355 },
        ];
        const PHASE_CAPTION = 390;

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
            ctx.fillText('The Loop Point Is a Cut Too', W / 2, 16);
            ctx.globalAlpha = 1;

            PANELS.forEach((panel, pi) => {
                const ph = PHASE[pi];

                const labelP = progress(f, ph.label, 20);
                if (labelP > 0) {
                    ctx.globalAlpha = labelP;
                    ctx.fillStyle = panel.color;
                    ctx.font = 'bold 9px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(panel.label, W / 2, panel.labelY);
                    ctx.globalAlpha = 1;
                }

                const rep1P = progress(f, ph.rep1, 40);
                const rep2P = progress(f, ph.rep2, 40);
                if (rep1P > 0 || rep2P > 0) {
                    // Seam guide, confined to this panel's own band
                    ctx.globalAlpha = Math.max(rep1P, rep2P) * 0.4;
                    ctx.strokeStyle = '#d1d5db';
                    ctx.lineWidth = 1;
                    ctx.setLineDash([2, 3]);
                    ctx.beginPath();
                    ctx.moveTo(seamX, panel.midY - panel.amp);
                    ctx.lineTo(seamX, panel.midY + panel.amp);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.globalAlpha = 1;
                }
                if (rep1P > 0) drawRepeat(panel, 0, rep1P, rep1P > 0.99 ? 1 : rep1P);
                if (rep2P > 0) drawRepeat(panel, 1, 1 + rep2P, rep2P > 0.99 ? 1 : rep2P);

                const seamP = progress(f, ph.seam, 25);
                if (seamP > 0) {
                    const yEnd1 = plotY(panel.midY, panel.amp, wave(panel.L2));
                    const yStart2 = plotY(panel.midY, panel.amp, wave(panel.L1));
                    const curY = yEnd1 + (yStart2 - yEnd1) * seamP;
                    ctx.globalAlpha = seamP;
                    ctx.strokeStyle = panel.color;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(seamX, yEnd1);
                    ctx.lineTo(seamX, curY);
                    ctx.stroke();
                    ctx.fillStyle = panel.color;
                    ctx.beginPath();
                    ctx.arc(seamX, yEnd1, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(seamX, yStart2, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1;
                }

                const calloutP = progress(f, ph.callout, 20);
                if (calloutP > 0) {
                    ctx.globalAlpha = calloutP;
                    ctx.fillStyle = panel.color;
                    ctx.font = 'italic 8.5px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(panel.callout, seamX, panel.calloutY);
                    ctx.globalAlpha = 1;
                }
            });

            const capP = progress(f, PHASE_CAPTION, 25);
            if (capP > 0) {
                ctx.globalAlpha = capP;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('The stutter is the same skill, deliberately: copy, paste, repeat in rhythm', W / 2, 258);
                ctx.globalAlpha = 1;
            }

            const phase = f < PHASE[0].callout ? 'Bad join'
                : f < PHASE[1].label ? 'Compare'
                : f < PHASE[1].callout ? 'Good join'
                : 'Complete';
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
