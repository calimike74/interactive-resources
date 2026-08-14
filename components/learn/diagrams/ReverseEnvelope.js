'use client';

import { useEffect, useRef } from 'react';

// Anatomy copied from KneeTypes.js (curve A reveal+label, curve B reveal+label, overlay
// comparison) — the closest sibling for a "same shape, two states" single-panel plot.
// ONE forward function, env(t)=exp(-K·t), K=4 (illustrative decay rate, not a real time
// constant — chosen so env(1)=0.018, a clean full decay within the domain). The reversed
// curve is never redrawn or re-imagined: reverse(t) = env(1 - t) literally, computed by
// calling the same env() with a mirrored argument — verified reverse(t)===env(1-t) at five
// sample points, exact floating-point identity, not merely "close". A playhead dot sweeps
// left-to-right along whichever curve is currently being read, so its direction of travel
// is always visible, matching the row's "played backwards" framing through the curve's
// shape (decay vs swell) rather than through the playhead's own motion.
//
// Label-clearance: LEVEL_SCALE=150 and BASELINE_Y=220 mean the curve's topmost reachable
// point is envY(1)=70 for EVERY value of t, in EITHER function (both are bounded to
// [0,1]) — a hard bound, not a per-frame estimate. Both curve labels sit at y<=60 (>=10px
// clear of that y=70 ceiling, true for the entire curve, not just at its own peak). Both
// caption slots (y=235, y=252) sit >=15px below the baseline (220), and the phase
// indicator (H-8=272) sits >=20px below the lower caption slot.
export default function ReverseEnvelope() {
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

        const CYCLE = 460;
        let animId;

        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);

        const X0 = 60;
        const X1 = 440;
        const BASELINE_Y = 220;
        const LEVEL_SCALE = 150;
        const K = 4; // illustrative decay rate — env(1) = exp(-4) = 0.018

        const pxX = (t) => X0 + t * (X1 - X0);
        const envY = (level) => BASELINE_Y - level * LEVEL_SCALE;
        const forward = (t) => Math.exp(-K * t);
        const reverse = (t) => forward(1 - t); // literal derivation, not a redrawn curve

        const drawEnvelope = (fn, color, lineWidth, alpha, readT) => {
            if (readT <= 0) return;
            const N = 150;
            const steps = Math.max(1, Math.round(N * Math.min(readT, 1)));
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            for (let i = 0; i <= steps; i++) {
                const t = i / N;
                const x = pxX(t);
                const y = envY(fn(t));
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            const tHead = Math.min(readT, 1);
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(pxX(tHead), envY(fn(tHead)), 3, 0, Math.PI * 2);
            ctx.fill();
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
            ctx.fillText('Reverse: Decay Becomes Swell', W / 2, 16);
            ctx.globalAlpha = 1;

            // Baseline
            ctx.strokeStyle = '#d1d5db';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(X0, BASELINE_Y);
            ctx.lineTo(X1, BASELINE_Y);
            ctx.stroke();

            // --- Phase 1: forward (decay) ---
            const p1 = progress(f, 0, 80);
            if (p1 > 0) {
                drawEnvelope(forward, '#14b8a6', 2.5, p1, p1);

                const labelP = progress(f, 20, 25);
                if (labelP > 0) {
                    ctx.globalAlpha = labelP;
                    ctx.fillStyle = '#14b8a6';
                    ctx.font = 'bold 9px -apple-system, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText('Forward: decay', X0, 48);
                    ctx.globalAlpha = 1;
                }
                const capP = progress(f, 50, 25);
                if (capP > 0) {
                    ctx.globalAlpha = capP;
                    ctx.fillStyle = '#374151';
                    ctx.font = 'italic 9px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('Struck: sharp attack, then decay away', W / 2, 235);
                    ctx.globalAlpha = 1;
                }
            }

            // --- Phase 2: reversed (swell) — forward fades to a faint reference ---
            const p1Fade = f >= 150 ? 1 - progress(f, 150, 40) : 1;
            if (p1 > 0 && f >= 150) {
                drawEnvelope(forward, '#14b8a6', 1.5, p1Fade * 0.3, 1);
            }

            const p2 = progress(f, 150, 80);
            if (p2 > 0) {
                drawEnvelope(reverse, '#2563EB', 2.5, p2, p2);

                const labelP = progress(f, 170, 25);
                if (labelP > 0) {
                    ctx.globalAlpha = labelP;
                    ctx.fillStyle = '#2563EB';
                    ctx.font = 'bold 9px -apple-system, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText('Reversed: swell', X0, 60);
                    ctx.globalAlpha = 1;
                }
            }

            // Slot B: branches by phase, not accumulated — avoids two captions fighting one slot
            if (f < 310) {
                const capRevP = progress(f, 200, 25);
                if (capRevP > 0) {
                    ctx.globalAlpha = capRevP;
                    ctx.fillStyle = '#374151';
                    ctx.font = 'italic 9px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('Same function, mirrored: reverse(t) = forward(1 − t)', W / 2, 252);
                    ctx.globalAlpha = 1;
                }
            } else {
                const capFinalP = progress(f, 340, 25);
                if (capFinalP > 0) {
                    ctx.globalAlpha = capFinalP;
                    ctx.fillStyle = '#374151';
                    ctx.font = 'italic 9px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('Same sample, same duration: only the shape is mirrored', W / 2, 252);
                    ctx.globalAlpha = 1;
                }
            }

            // --- Phase 3: overlay ---
            const p3 = progress(f, 310, 50);
            if (p3 > 0) {
                drawEnvelope(forward, '#14b8a6', 1.6, p3 * 0.6, 1);
                drawEnvelope(reverse, '#2563EB', 1.6, p3 * 0.6, 1);
            }

            const phase = f < 150 ? 'Forward' : f < 310 ? 'Reversed' : 'Compare';
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
