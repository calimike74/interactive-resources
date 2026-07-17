'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: axes + ticks → direct line grows (computed from level = L0 − 6·log2(d/d0))
// → reverberant flat line grows (held at R0) → crossover marker, where the two functions are
// exactly equal, appears with dashed guides → caption states the meaning.
//
// Geometry discipline copies CompressorTransferCurve.js: directLevel() and reverbLevel() are the
// single sources of truth. crossoverDoublings is SOLVED from those two functions (L0 − R0) / 6 —
// never hardcoded — and it lands exactly on the existing "4×" gridline (because R0 = −12 dB was
// chosen to be a clean multiple of 6 dB below L0 = 0 dB), so the marker needs no invented number
// of its own. L0 = 0 dB and R0 = −12 dB are an illustrative reference pair (relative dB, not an
// absolute SPL) — disclosed in the task report.
export default function DistanceRdRatio() {
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

        const DOUBLINGS_MAX = 4; // 1×, 2×, 4×, 8×, 16× distance
        const DB_MIN = -28;
        const DB_MAX = 4;
        const DB_SPAN = DB_MAX - DB_MIN;

        const L0 = 0;   // direct level at reference distance d0
        const R0 = -12; // reverberant level — holds steady with distance

        const xFrac = (doublings) => doublings / DOUBLINGS_MAX;
        const pxX = (doublings) => originX + xFrac(doublings) * plotW;
        const dbFrac = (db) => (db - DB_MIN) / DB_SPAN;
        const pxY = (db) => originY - dbFrac(db) * plotH;

        // Single sources of truth for the two rules the row states.
        const directLevel = (doublings) => L0 - 6 * doublings;
        const reverbLevel = () => R0;

        // Solved, not sketched: the doublings at which the two functions are equal.
        const crossoverDoublings = (L0 - R0) / 6;

        const X_TICKS = [
            { d: 0, label: '1×' },
            { d: 1, label: '2×' },
            { d: 2, label: '4×' },
            { d: 3, label: '8×' },
            { d: 4, label: '16×' },
        ];
        const Y_TICKS = [0, -6, -12, -18, -24];

        const PHASE_AXES = 10;
        const PHASE_TICKS = 40;
        const PHASE_DIRECT = 90;
        const PHASE_REVERB = 220;
        const PHASE_CROSSOVER = 350;
        const PHASE_CAPTION = 410;

        const draw = () => {
            frameRef.current = (frameRef.current + 0.6) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            // Title
            const titleP = progress(f, 0, 20);
            ctx.globalAlpha = titleP;
            ctx.fillStyle = '#1a1a2e';
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Distance and the R/D Ratio', W / 2, 16);
            ctx.globalAlpha = 1;

            // Axes
            const axesP = progress(f, PHASE_AXES, 30);
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

            // Ticks + axis titles
            const tickP = progress(f, PHASE_TICKS, 35);
            if (tickP > 0) {
                ctx.globalAlpha = tickP;
                ctx.fillStyle = '#9ca3af';
                ctx.font = '9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Distance (multiples of d0)', originX + plotW / 2, originY + 41);
                ctx.save();
                ctx.translate(12, margin.top + plotH / 2);
                ctx.rotate(-Math.PI / 2);
                ctx.fillText('Level (dB, relative)', 0, 0);
                ctx.restore();

                ctx.font = '8px -apple-system, sans-serif';
                X_TICKS.forEach(({ d, label }) => {
                    ctx.textAlign = 'center';
                    ctx.fillText(label, pxX(d), originY + 12);
                });
                Y_TICKS.forEach((db) => {
                    ctx.textAlign = 'right';
                    ctx.fillText(`${db}`, originX - 6, pxY(db) + 3);
                });
                ctx.globalAlpha = 1;
            }

            // --- Direct line ---
            const directP = progress(f, PHASE_DIRECT, 90);
            if (directP > 0) {
                ctx.globalAlpha = directP;
                const endD = directP * DOUBLINGS_MAX;
                ctx.strokeStyle = '#374151';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(pxX(0), pxY(directLevel(0)));
                ctx.lineTo(pxX(endD), pxY(directLevel(endD)));
                ctx.stroke();

                if (directP > 0.25) {
                    const labelD = 0.6;
                    ctx.globalAlpha = clamp((directP - 0.25) / 0.2, 0, 1);
                    ctx.fillStyle = '#374151';
                    ctx.font = 'bold 9px -apple-system, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText('Direct — falls 6 dB per doubling', pxX(labelD) - 10, pxY(directLevel(labelD)) - 10);
                }
                ctx.globalAlpha = 1;
            }

            // --- Reverberant line (flat) ---
            const reverbP = progress(f, PHASE_REVERB, 90);
            if (reverbP > 0) {
                ctx.globalAlpha = reverbP;
                const endD = reverbP * DOUBLINGS_MAX;
                ctx.strokeStyle = '#14b8a6';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(pxX(0), pxY(reverbLevel()));
                ctx.lineTo(pxX(endD), pxY(reverbLevel()));
                ctx.stroke();

                if (reverbP > 0.7) {
                    const labelD = 3.3;
                    ctx.globalAlpha = clamp((reverbP - 0.7) / 0.2, 0, 1);
                    ctx.fillStyle = '#14b8a6';
                    ctx.font = 'bold 9px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('Reverberant — holds steady', pxX(labelD), pxY(reverbLevel()) - 10);
                }
                ctx.globalAlpha = 1;
            }

            // --- Crossover marker (computed, not hardcoded) ---
            const crossP = progress(f, PHASE_CROSSOVER, 40);
            if (crossP > 0) {
                ctx.globalAlpha = crossP;
                const cx = pxX(crossoverDoublings);
                const cy = pxY(reverbLevel()); // == pxY(directLevel(crossoverDoublings)) by construction

                ctx.strokeStyle = '#DC2626';
                ctx.lineWidth = 1;
                ctx.setLineDash([2, 3]);
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx, originY);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.fillStyle = '#DC2626';
                ctx.beginPath();
                ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#DC2626';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('crossover', cx, cy - 24);
                ctx.fillText('direct = reverberant', cx, cy - 12);
                ctx.globalAlpha = 1;
            }

            // --- Caption ---
            const capP = progress(f, PHASE_CAPTION, 30);
            if (capP > 0) {
                ctx.globalAlpha = capP;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Past the crossover, the room’s level dominates and the source sounds far away', W / 2, H - 8);
                ctx.globalAlpha = 1;
            }

            // Phase indicator
            const phase = f < PHASE_DIRECT ? 'Axes'
                : f < PHASE_REVERB ? 'Direct'
                : f < PHASE_CROSSOVER ? 'Reverberant'
                : 'Crossover';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - margin.right, margin.top - 10);

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
