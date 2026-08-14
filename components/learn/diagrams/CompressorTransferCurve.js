'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: axes + ticks → 1:1 unity diagonal → threshold marker →
// below-threshold segment (coincides with unity) → above-threshold 4:1 segment →
// worked example (8 dB in → 2 dB out) with dashed guides → optional soft-knee overlay.
//
// Geometry is exact, not illustrative: domain is -40 dB to 0 dB on BOTH axes (same
// dbFrac mapping used for x and y), threshold = -20 dB, ratio = 4:1 — the exact figure
// this chapter's row text states ("at 4:1 four decibels in becomes one decibel out").
// transferOut() is the single source of truth for the curve; the worked-example dot,
// guide lines and callout all read their coordinates from it, so they cannot drift
// apart from the drawn curve (same discipline as the Task 4 HighPassLowPassFilters fix).
export default function CompressorTransferCurve() {
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

        const margin = { left: 55, right: 25, top: 34, bottom: 58 };
        const plotW = W - margin.left - margin.right;
        const plotH = H - margin.top - margin.bottom;
        const originX = margin.left;
        const originY = margin.top + plotH;

        const DOMAIN_MIN = -40;
        const DOMAIN_MAX = 0;
        const SPAN = DOMAIN_MAX - DOMAIN_MIN;
        const THRESHOLD = -20;
        const RATIO = 4;

        const dbFrac = (db) => (db - DOMAIN_MIN) / SPAN;
        const pxX = (db) => originX + dbFrac(db) * plotW;
        const pxY = (db) => originY - dbFrac(db) * plotH;

        // Single source of truth for the compressor's behaviour.
        const transferOut = (inputDb) => {
            if (inputDb <= THRESHOLD) return inputDb;
            return THRESHOLD + (inputDb - THRESHOLD) / RATIO;
        };

        const TICKS = [0, -10, -20, -30, -40];

        // Worked example point: 8 dB above threshold.
        const exampleIn = THRESHOLD + 8; // -12 dB
        const exampleOut = transferOut(exampleIn); // -18 dB (exactly 2 dB above threshold)

        const draw = () => {
            frameRef.current = (frameRef.current + 1) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);

            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            // --- Title ---
            const titleP = progress(f, 0, 20);
            ctx.globalAlpha = titleP;
            ctx.fillStyle = '#1a1a6e';
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('The Transfer Curve', W / 2, 16);
            ctx.globalAlpha = 1;

            // --- Axes ---
            const axesP = progress(f, 10, 30);
            if (axesP > 0) {
                ctx.globalAlpha = axesP;
                ctx.strokeStyle = '#d1d5db';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(originX, margin.top);
                ctx.lineTo(originX, originY);
                ctx.lineTo(originX + plotW, originY);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            // --- Axis titles + tick labels ---
            const tickP = progress(f, 40, 40);
            if (tickP > 0) {
                ctx.globalAlpha = tickP;
                ctx.fillStyle = '#9ca3af';
                ctx.font = '9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Input Level (dBFS)', originX + plotW / 2, originY + 41);
                ctx.save();
                ctx.translate(12, margin.top + plotH / 2);
                ctx.rotate(-Math.PI / 2);
                ctx.fillText('Output Level (dBFS)', 0, 0);
                ctx.restore();

                ctx.font = '8px -apple-system, sans-serif';
                TICKS.forEach((db) => {
                    const x = pxX(db);
                    const y = pxY(db);
                    ctx.fillStyle = '#d1d5db';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${db}`, x, originY + 12);
                    ctx.textAlign = 'right';
                    ctx.fillText(`${db}`, originX - 6, y + 3);
                });
                ctx.globalAlpha = 1;
            }

            // --- 1:1 unity diagonal (reference) ---
            const unityP = progress(f, 90, 50);
            if (unityP > 0) {
                ctx.globalAlpha = unityP;
                ctx.strokeStyle = '#9ca3af';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(pxX(DOMAIN_MIN), pxY(DOMAIN_MIN));
                const endDb = DOMAIN_MIN + unityP * SPAN;
                ctx.lineTo(pxX(endDb), pxY(endDb));
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.fillStyle = '#9ca3af';
                ctx.font = '9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('1:1, no compression', pxX(-38), pxY(-38) - 8);
                ctx.globalAlpha = 1;
            }

            // --- Threshold marker ---
            const threshP = progress(f, 150, 40);
            if (threshP > 0) {
                ctx.globalAlpha = threshP;
                ctx.strokeStyle = '#e85d75';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(pxX(THRESHOLD), margin.top);
                ctx.lineTo(pxX(THRESHOLD), originY);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.fillStyle = '#e85d75';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('Threshold', pxX(THRESHOLD) + 6, margin.top + 12);
                ctx.fillText('−20 dB', pxX(THRESHOLD) + 6, margin.top + 24);
                ctx.globalAlpha = 1;
            }

            // --- Below-threshold segment (drawn as the curve, coincides with unity) ---
            const belowP = progress(f, 190, 50);
            if (belowP > 0) {
                ctx.globalAlpha = belowP;
                ctx.strokeStyle = '#e85d75';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                const endDb = DOMAIN_MIN + belowP * (THRESHOLD - DOMAIN_MIN);
                ctx.moveTo(pxX(DOMAIN_MIN), pxY(transferOut(DOMAIN_MIN)));
                ctx.lineTo(pxX(endDb), pxY(transferOut(endDb)));
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            // --- Above-threshold segment: the exact 4:1 slope ---
            const aboveP = progress(f, 250, 60);
            if (aboveP > 0) {
                ctx.globalAlpha = aboveP;
                ctx.strokeStyle = '#e85d75';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                const endDb = THRESHOLD + aboveP * (DOMAIN_MAX - THRESHOLD);
                ctx.moveTo(pxX(THRESHOLD), pxY(transferOut(THRESHOLD)));
                ctx.lineTo(pxX(endDb), pxY(transferOut(endDb)));
                ctx.stroke();

                const labelP = progress(f, 300, 30);
                if (labelP > 0) {
                    ctx.globalAlpha = labelP;
                    ctx.fillStyle = '#e85d75';
                    ctx.font = 'bold 10px -apple-system, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText('4:1', pxX(-14), pxY(transferOut(-14)) - 20);
                    ctx.globalAlpha = 1;
                }
                ctx.globalAlpha = 1;
            }

            // --- Worked example: 8 dB above threshold → 2 dB above threshold ---
            const exampleP = progress(f, 350, 50);
            if (exampleP > 0) {
                ctx.globalAlpha = exampleP;
                const ex = pxX(exampleIn);
                const ey = pxY(exampleOut);

                ctx.strokeStyle = '#DC2626';
                ctx.lineWidth = 1;
                ctx.setLineDash([2, 3]);
                ctx.beginPath();
                ctx.moveTo(ex, ey);
                ctx.lineTo(ex, originY);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(ex, ey);
                ctx.lineTo(originX, ey);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.fillStyle = '#DC2626';
                ctx.beginPath();
                ctx.arc(ex, ey, 3.5, 0, Math.PI * 2);
                ctx.fill();

                const captionP = progress(f, 390, 30);
                if (captionP > 0) {
                    ctx.globalAlpha = captionP;
                    ctx.fillStyle = '#374151';
                    ctx.font = 'bold 9px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('8 dB above threshold in → exactly 2 dB above threshold out (4:1)', W / 2, originY + 27);
                }
                ctx.globalAlpha = 1;
            }

            // --- Optional soft-knee overlay (clearly secondary: thin, faint, later) ---
            const kneeP = progress(f, 440, 50);
            if (kneeP > 0) {
                ctx.globalAlpha = kneeP * 0.6;
                ctx.strokeStyle = '#2563EB';
                ctx.lineWidth = 1;
                ctx.setLineDash([2, 2]);
                ctx.beginPath();
                const kneeWidth = 8; // blend from -24 dB to -16 dB
                const steps = 40;
                for (let i = 0; i <= steps; i++) {
                    const db = (THRESHOLD - kneeWidth) + (i / steps) * (kneeWidth * 2);
                    // Smooth blend of ratio across the knee — cosmetic only, the hard-knee
                    // line above remains the geometrically exact, exam-drawable curve.
                    const half = kneeWidth / 2;
                    let outDb;
                    if (db <= THRESHOLD - half) outDb = db;
                    else if (db >= THRESHOLD + half) outDb = transferOut(db);
                    else {
                        const kPos = (db - (THRESHOLD - half)) / kneeWidth;
                        const smoothRatioInv = 1 + (1 / RATIO - 1) * kPos * kPos;
                        outDb = (THRESHOLD - half) + (db - (THRESHOLD - half)) * smoothRatioInv;
                    }
                    const x = pxX(db);
                    const y = pxY(outDb);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.globalAlpha = 1;

                const kneeLabelP = progress(f, 470, 30);
                if (kneeLabelP > 0) {
                    ctx.globalAlpha = kneeLabelP;
                    ctx.fillStyle = '#2563EB';
                    ctx.font = '8px -apple-system, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText('(soft knee rounds the corner: optional)', 265, 155);
                    ctx.globalAlpha = 1;
                }
            }

            // Phase indicator
            const phase = f < 90 ? 'Axes' : f < 150 ? 'Unity' : f < 250 ? 'Threshold' : f < 350 ? 'Ratio' : f < 440 ? 'Example' : 'Knee';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - margin.right, originY + 41);

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
