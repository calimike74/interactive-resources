'use client';

import { useEffect, useRef } from 'react';

// Two lanes sharing ONE grid (pxX(t), used by every marker in both lanes, so
// nothing can drift out of alignment with the reference ticks): real-time
// input (played, humanised timing) above, step input (grid-locked) below.
// Same shared-axis discipline as PlaybackModes.js / SampleRateGrid.js.
//
// Both lanes read their note positions from the SAME base grid array
// (GRID_T, 8 evenly spaced positions) — real-time adds a per-note jitter
// offset, step input adds none — so the two lanes are guaranteed to be the
// "same 8 notes, two different timings" rather than two independently
// hand-placed sets of dots.
//
// Invented illustrative values (disclosed in the w3-task-4 report): JITTER
// is a fixed illustrative array of small timing offsets (not real captured
// performance data) chosen so the real-time lane's notes visibly wobble
// around the grid — some early, some late — while staying obviously "close
// to" the same 8 beats the step lane locks onto exactly.
//
// Label-clearance: lane A's markers occupy y=[54,62] (r=4 dots centred on
// y=58); its label sits at y=44 (glyphs roughly y=[35,44], 10px clear above
// the marker row) and its caption at y=86 (24px clear below the marker
// row). Lane B's markers occupy y=[164,172] (centred on y=168); its label
// sits at y=154 and its caption at y=196, with the same clearances. There
// is no vertical reference line spanning both lanes — the only grid
// geometry drawn is the shared axis at y=224 (below both marker rows and
// captions, whose lowest point is y=196, 28px clear) with its own tick
// marks confined to y=[221,227] and axis caption at y=236 (9px clear of the
// ticks). The closing caption sits at y=256 (20px clear of the axis
// caption) and the phase indicator at y=272 (16px clear of the closing
// caption). No marker or tick is ever drawn outside its own row's y-band,
// so no lane's text can be crossed by another row's marks.
export default function RealtimeVsStepInput() {
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

        const axisX0 = 60;
        const axisX1 = 440;
        const N = 8; // 8 evenly spaced grid positions — a bar of straight 8th notes
        const GRID_T = Array.from({ length: N }, (_, i) => i / (N - 1));
        const pxX = (t) => axisX0 + t * (axisX1 - axisX0);

        // Illustrative humanised timing offsets — not real captured performance
        // data. Small enough that every real-time note still reads near its
        // grid position; alternating sign so the wobble is visually legible.
        const JITTER = [0.01, -0.018, 0.012, -0.02, 0.015, -0.01, 0.02, -0.006];
        const realTimeT = (i) => clamp(GRID_T[i] + JITTER[i], 0, 1);
        const stepT = (i) => GRID_T[i];

        const LANES = {
            real: { y: 58, labelY: 44, capY: 86, color: '#14b8a6', name: 'Real-time — play the keyboard' },
            step: { y: 168, labelY: 154, capY: 196, color: '#f97316', name: 'Step input — grid / pencil' },
        };
        const markerR = 4;

        const PHASE = {
            realLabel: 20, realDots: 45, realStagger: 16, realDur: 16, realCap: 190,
            stepLabel: 230, stepDots: 255, stepStagger: 16, stepDur: 16, stepCap: 400,
            axis: 20,
            final: 440,
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
            ctx.fillText('Two Ways to Get Notes In', W / 2, 16);
            ctx.globalAlpha = 1;

            const axisP = progress(f, PHASE.axis, 25);

            // --- Real-time lane ---
            const realLabelP = progress(f, PHASE.realLabel, 18);
            if (realLabelP > 0) {
                ctx.globalAlpha = realLabelP;
                ctx.fillStyle = LANES.real.color;
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(LANES.real.name, axisX0, LANES.real.labelY);
                ctx.globalAlpha = 1;
            }
            GRID_T.forEach((_, i) => {
                const dp = progress(f, PHASE.realDots + i * PHASE.realStagger, PHASE.realDur);
                if (dp <= 0) return;
                const t = realTimeT(i);
                const x = pxX(t);
                ctx.globalAlpha = dp;
                ctx.fillStyle = LANES.real.color;
                ctx.beginPath();
                ctx.arc(x, LANES.real.y, markerR, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            });
            const realCapP = progress(f, PHASE.realCap, 25);
            if (realCapP > 0) {
                ctx.globalAlpha = realCapP;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 8.5px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('captures natural feel — as fast/accurate as you can play', axisX0, LANES.real.capY);
                ctx.globalAlpha = 1;
            }

            // --- Step lane ---
            const stepLabelP = progress(f, PHASE.stepLabel, 18);
            if (stepLabelP > 0) {
                ctx.globalAlpha = stepLabelP;
                ctx.fillStyle = LANES.step.color;
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(LANES.step.name, axisX0, LANES.step.labelY);
                ctx.globalAlpha = 1;
            }
            GRID_T.forEach((_, i) => {
                const dp = progress(f, PHASE.stepDots + i * PHASE.stepStagger, PHASE.stepDur);
                if (dp <= 0) return;
                const t = stepT(i);
                const x = pxX(t);
                ctx.globalAlpha = dp;
                ctx.fillStyle = LANES.step.color;
                ctx.fillRect(x - markerR, LANES.step.y - markerR, markerR * 2, markerR * 2);
                ctx.globalAlpha = 1;
            });
            const stepCapP = progress(f, PHASE.stepCap, 25);
            if (stepCapP > 0) {
                ctx.globalAlpha = stepCapP;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 8.5px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('note-perfect, built one click at a time — however fast or complex', axisX0, LANES.step.capY);
                ctx.globalAlpha = 1;
            }

            // Shared axis
            if (axisP > 0) {
                ctx.globalAlpha = axisP;
                ctx.strokeStyle = '#d1d5db';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(axisX0, 224);
                ctx.lineTo(axisX1, 224);
                ctx.stroke();
                // Tick marks at each of the 8 grid positions — confined to
                // y=[221,227], well clear of the step caption above (max
                // y=196) and the axis label below (y=236).
                GRID_T.forEach((t) => {
                    const x = pxX(t);
                    ctx.beginPath();
                    ctx.moveTo(x, 221);
                    ctx.lineTo(x, 227);
                    ctx.stroke();
                });
                ctx.fillStyle = '#9ca3af';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('grid position →', W / 2, 236);
                ctx.globalAlpha = 1;
            }

            const finalP = progress(f, PHASE.final, 30);
            if (finalP > 0) {
                ctx.globalAlpha = finalP;
                ctx.fillStyle = '#1a1a2e';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Same 8 notes, two different ways in — with a different trade-off each time', W / 2, 256);
                ctx.globalAlpha = 1;
            }

            const phase = f < PHASE.stepLabel ? 'Real-time'
                : f < PHASE.final ? 'Step input'
                : 'Compare';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - 20, 272);

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
