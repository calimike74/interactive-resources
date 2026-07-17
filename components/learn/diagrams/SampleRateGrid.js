'use client';

import { useEffect, useRef } from 'react';

// Two stacked panels, dense (high rate) vs sparse (low rate), sharing one
// wave function and one plotY mapping. waveValue(t) is the SINGLE source of
// truth for the smooth reference curve; every sample dot in both panels calls
// plotY(midY, amp, t) = midY - amp*waveValue(t) directly, so no dot can ever
// float off the curve it is meant to sit on. CYCLES=6 (a fast wiggle) is an
// illustrative shape, not a real frequency — disclosed here and in the report.
//
// N_DENSE=25 samples over the same t-domain as N_SPARSE=7: 25 samples across
// 6 cycles resolves the wiggle; 7 samples across 6 cycles (~1.2/cycle, under
// the 2-per-cycle minimum) visibly cannot, which is the whole point.
//
// Label-clearance: panel A's oscillation occupies y=[63,127] (mid=95,
// amp=32); its label sits at y=48 (15px clear above) and its caption at
// y=150 (23px clear below). Panel B's oscillation occupies y=[183,247]
// (mid=215, amp=32); its label sits at y=168 (15px clear above) and its
// caption at y=262 (15px clear below, 10px clear of the phase indicator at
// y=272). The two panels themselves are 168-127=41px apart. No curve, dot or
// reconstruction line is ever drawn outside its own panel's y-band.
export default function SampleRateGrid() {
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
        const CYCLES = 6; // illustrative "fast wiggle" — not a real Hz value
        // Single source of truth for the curve's shape.
        const waveValue = (t) => Math.sin(t * 2 * Math.PI * CYCLES);
        const pxX = (t) => X0 + t * (X1 - X0);
        const plotY = (midY, amp, t) => midY - amp * waveValue(t);

        const sampleTs = (n) => Array.from({ length: n }, (_, i) => i / (n - 1));

        const PANELS = [
            { midY: 95, amp: 32, labelY: 48, capY: 150, n: 25, label: 'High rate — dense samples', color: '#14b8a6', cap: '25 samples trace the fast wiggle faithfully' },
            { midY: 215, amp: 32, labelY: 168, capY: 262, n: 7, label: 'Low rate — sparse samples', color: '#e85d75', cap: 'Only 7 samples — the wiggle is lost between them' },
        ];

        const drawSmoothCurve = (midY, amp, alpha) => {
            ctx.globalAlpha = alpha * 0.4;
            ctx.strokeStyle = '#d1d5db';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let i = 0; i <= 200; i++) {
                const t = i / 200;
                const x = pxX(t);
                const y = plotY(midY, amp, t);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
        };

        const PHASE = [
            { label: 20, curve: 45, dots: 80, dotStagger: 2.4, dotDur: 18, recon: 165, cap: 210 },
            { label: 250, curve: 275, dots: 300, dotStagger: 6, dotDur: 20, recon: 355, cap: 395 },
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
            ctx.fillText('Sample Rate: More Points, More Detail', W / 2, 16);
            ctx.globalAlpha = 1;

            PANELS.forEach((panel, pi) => {
                const ph = PHASE[pi];
                const ts = sampleTs(panel.n);

                const labelP = progress(f, ph.label, 20);
                if (labelP > 0) {
                    ctx.globalAlpha = labelP;
                    ctx.fillStyle = panel.color;
                    ctx.font = 'bold 9px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(panel.label, W / 2, panel.labelY);
                    ctx.globalAlpha = 1;
                }

                const curveP = progress(f, ph.curve, 30);
                if (curveP > 0) drawSmoothCurve(panel.midY, panel.amp, curveP);

                // Baseline zero line
                if (curveP > 0) {
                    ctx.globalAlpha = curveP * 0.5;
                    ctx.strokeStyle = '#e5e7eb';
                    ctx.lineWidth = 1;
                    ctx.setLineDash([2, 3]);
                    ctx.beginPath();
                    ctx.moveTo(X0, panel.midY);
                    ctx.lineTo(X1, panel.midY);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.globalAlpha = 1;
                }

                // Reconstruction line (drawn under the dots)
                const reconP = progress(f, ph.recon, 30);
                if (reconP > 0) {
                    ctx.globalAlpha = reconP;
                    ctx.strokeStyle = panel.color;
                    ctx.lineWidth = 1.4;
                    ctx.beginPath();
                    ts.forEach((t, i) => {
                        const x = pxX(t);
                        const y = plotY(panel.midY, panel.amp, t);
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    });
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }

                // Dots — every one computed from the SAME plotY(t) as the curve above.
                ts.forEach((t, i) => {
                    const dotP = progress(f, ph.dots + i * ph.dotStagger, ph.dotDur);
                    if (dotP <= 0) return;
                    const x = pxX(t);
                    const y = plotY(panel.midY, panel.amp, t);
                    ctx.globalAlpha = dotP;
                    ctx.fillStyle = panel.color;
                    ctx.beginPath();
                    ctx.arc(x, y, 2.6, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1;
                });

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

            const phase = f < PHASE[0].cap ? 'High rate'
                : f < PHASE[1].dots ? 'Compare'
                : 'Low rate';
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
