'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: one slope at a time fans out from a shared cut-off, gentlest first —
// 6, 12, 24, 48 dB/octave — each held as a big numeric callout with earlier slopes kept as faint
// ghosts, then all four shown together fanning out so the "close to a brick wall" comparison reads
// at a glance.
export default function FilterSlopeDbOctave() {
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

        const margin = { left: 46, right: 30, top: 40, bottom: 46 };
        const plotW = W - margin.left - margin.right;
        const plotH = H - margin.top - margin.bottom;
        const originX = margin.left;
        const originY = margin.top;
        const cutNorm = 0.3;
        const cutoffX = originX + cutNorm * plotW;
        const octavesAcross = 4; // remaining width represents ~4 octaves above the cut-off
        const floorDb = 60; // plot bottom = -60 dB

        const stages = [
            { slope: 6, label: '6 dB/octave', desc: 'one pole — the gentlest standard slope', color: '#2563EB', start: 30 },
            { slope: 12, label: '12 dB/octave', desc: 'two poles — a standard slope', color: '#9B7530', start: 130 },
            { slope: 24, label: '24 dB/octave', desc: 'four poles — steep', color: '#f97316', start: 230 },
            { slope: 48, label: '48 dB/octave', desc: 'eight poles — close to a brick wall', color: '#DC2626', start: 330 },
        ];

        const dbToY = (db) => originY + clamp(db / floorDb, 0, 1) * plotH;

        const drawSlopeLine = (slope, color, alpha, drawP) => {
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            const runW = (originX + plotW - cutoffX) * drawP;
            const steps = 60;
            for (let i = 0; i <= steps; i++) {
                const px = (i / steps) * runW;
                const octaves = (px / (originX + plotW - cutoffX)) * octavesAcross;
                const db = slope * octaves;
                const x = cutoffX + px;
                const y = dbToY(db);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
        };

        const draw = () => {
            frameRef.current = (frameRef.current + 1) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            const titleP = progress(f, 0, 20);
            ctx.globalAlpha = titleP;
            ctx.fillStyle = '#1a1a6e';
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Slope: dB per Octave', W / 2, 16);
            ctx.globalAlpha = 1;

            // Axes
            ctx.strokeStyle = '#d1d5db';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(originX, originY);
            ctx.lineTo(originX, originY + plotH);
            ctx.lineTo(originX + plotW, originY + plotH);
            ctx.stroke();

            // Flat pass region up to the cut-off (0 dB, shared by every slope)
            ctx.strokeStyle = '#374151';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(originX, dbToY(0));
            ctx.lineTo(cutoffX, dbToY(0));
            ctx.stroke();

            // Cut-off marker
            ctx.strokeStyle = '#6b7280';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(cutoffX, originY);
            ctx.lineTo(cutoffX, originY + plotH);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#6b7280';
            ctx.font = 'bold 8px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Cut-off', cutoffX, originY - 6);

            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('0 dB', originX + 4, dbToY(0) - 4);
            ctx.textAlign = 'right';
            ctx.fillText('−60 dB', originX - 6, originY + plotH);
            ctx.textAlign = 'left';
            ctx.fillText('frequency →', originX + plotW - 60, originY + plotH + 14);

            // Determine active stage
            let activeIdx = -1;
            for (let i = stages.length - 1; i >= 0; i--) {
                if (f >= stages[i].start) { activeIdx = i; break; }
            }

            const compareStart = 440;
            const isCompare = f >= compareStart;

            if (isCompare) {
                const compP = progress(f, compareStart, 40);
                stages.forEach((s) => drawSlopeLine(s.slope, s.color, compP, 1));
                // Labels staggered at different x fractions (steep slopes labelled near the
                // cut-off, gentle ones further out) so each sits on open curve, before any of
                // them have flattened onto the shared floor line — avoids stacking at a shared x
                const runW = originX + plotW - cutoffX;
                stages.forEach((s, idx) => {
                    const xFrac = 0.85 - idx * 0.2;
                    const octaves = xFrac * octavesAcross;
                    const db = s.slope * octaves;
                    const x = cutoffX + xFrac * runW;
                    const y = dbToY(db);
                    ctx.globalAlpha = compP;
                    ctx.fillStyle = s.color;
                    ctx.font = 'bold 8px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${s.slope}`, x, y - 7);
                    ctx.globalAlpha = 1;
                });
                const capP = progress(f, compareStart + 40, 30) * (f < CYCLE - 60 ? 1 : clamp(1 - (f - (CYCLE - 60)) / 30, 0, 1));
                if (capP > 0) {
                    ctx.globalAlpha = capP;
                    ctx.fillStyle = '#374151';
                    ctx.font = 'bold 9px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('Same cut-off, four very different roll-offs', W / 2, H - 26);
                    ctx.globalAlpha = 1;
                }
            } else if (activeIdx >= 0) {
                const stage = stages[activeIdx];
                const stageP = progress(f, stage.start, 60);

                // Ghost previous slopes
                stages.forEach((s, i) => {
                    if (i >= activeIdx) return;
                    drawSlopeLine(s.slope, s.color, 0.18, 1);
                });

                drawSlopeLine(stage.slope, stage.color, 1, stageP);

                ctx.globalAlpha = stageP;
                ctx.fillStyle = stage.color;
                ctx.font = 'bold 16px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(stage.label, W / 2, H - 40);
                ctx.fillStyle = '#374151';
                ctx.font = '9px -apple-system, sans-serif';
                ctx.fillText(stage.desc, W / 2, H - 26);
                ctx.globalAlpha = 1;
            }

            const phase = activeIdx < 0 ? 'Cut-off' : isCompare ? 'Compare' : stages[activeIdx].label;
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

    return (
        <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', borderRadius: '0.75rem' }}
        />
    );
}
