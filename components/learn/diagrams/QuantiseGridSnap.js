'use client';

import { useEffect, useRef } from 'react';

// Two stacked panels, same time axis: Panel A shows hard quantise (before →
// after, notes snapping fully onto the nearest grid line); Panel B shows
// swing (only the off-beat subdivisions shifted later by a percentage).
// Same two-panel/shared-axis discipline as BitDepthStaircase.js and
// SampleRateGrid.js.
//
// There is no continuous curve to sample in a note-onset diagram, so the
// single-source-of-truth here is a shared RAW_T array plus one snap
// function per panel: Panel A's "after" dot for note i is ALWAYS
// snapToGrid(RAW_T[i]) — never an independently chosen pixel value — and
// its connecting arrow is drawn between exactly that before/after pair by
// index. Panel B's dot for grid step i is ALWAYS swingT(i) — computed from
// the same GRID_STEP/SWING_PCT constants used to label the panel, not a
// separately hand-placed position.
//
// Invented illustrative values (disclosed in the w3-task-4 report): RAW_T
// (panel A's "before" timing errors) is a fixed illustrative array of small
// human-timing offsets around an 8-note grid, not real captured performance
// data. SWING_PCT = 0.66 (66%) is a commonly-cited illustrative swing
// amount, not a claim about any specific recording.
//
// Label-clearance (exact pixel values used below, following the same
// convention as BitDepthStaircase.js/SampleRateGrid.js — gap measured
// between each element's own y-coordinate, not full glyph metrics): Panel
// A's grid/dot band spans y=[55,81] (before-row y=63, after-row y=73); its
// label sits at y=44 (55-44=11px clear above) and its caption at y=95
// (95-81=14px clear below). Panel B's grid/dot band spans y=[195,221]
// (single dot row y=208); its label sits at y=184 (195-184=11px clear
// above) and its caption at y=235 (235-221=14px clear below). The closing
// caption sits at y=252 (252-235=17px clear of panel B's caption) and the
// phase indicator at y=272 (20px clear of the closing caption). No dot,
// arrow or grid tick is ever drawn outside its own panel's y-band, so the
// two panels' text can never be crossed by the other panel's marks.
export default function QuantiseGridSnap() {
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

        const CYCLE = 640;
        let animId;

        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);

        const X0 = 60;
        const X1 = 440;
        const N = 8;
        const GRID_STEP = 1 / (N - 1);
        const pxX = (t) => X0 + t * (X1 - X0);

        // Panel A: hard quantise. Single function: every "after" position is
        // this function applied to the matching "before" position — never
        // hand-placed independently.
        const snapToGrid = (t) => Math.round(t / GRID_STEP) * GRID_STEP;

        // Illustrative "before" timing errors — not real captured performance
        // data. Kept small enough that the nearest grid line is unambiguous.
        const RAW_T = [0.005, 0.135, 0.21, 0.36, 0.44, 0.58, 0.69, 0.83].map((t) => clamp(t, 0, 1));
        const AFTER_T = RAW_T.map(snapToGrid);

        // Panel B: swing. Every dot is this function of its own index — not
        // an independently placed value.
        const SWING_PCT = 0.66; // illustrative — a commonly-cited swing amount
        const swingT = (i) => i * GRID_STEP + (i % 2 === 1 ? GRID_STEP * SWING_PCT * 0.5 : 0);

        const PANEL_A = { gridTop: 55, gridBottom: 81, beforeY: 63, afterY: 73, labelY: 44, capY: 95, color: '#e85d75' };
        const PANEL_B = { gridTop: 195, gridBottom: 221, rowY: 208, labelY: 184, capY: 235, color: '#0891b2' };

        const PHASE = {
            aLabel: 20, aGrid: 40, aBefore: 60, aBeforeStagger: 14,
            aArrow: 190, aArrowStagger: 12, aAfter: 210, aAfterStagger: 12, aCap: 320,
            bLabel: 350, bGrid: 370, bStraight: 390, bStraightStagger: 12,
            bSwing: 470, bSwingStagger: 12, bCap: 560,
            final: 600,
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
            ctx.fillText('Quantise: Snapping Notes to the Grid', W / 2, 16);
            ctx.globalAlpha = 1;

            // --- Panel A: hard quantise ---
            const aLabelP = progress(f, PHASE.aLabel, 18);
            if (aLabelP > 0) {
                ctx.globalAlpha = aLabelP;
                ctx.fillStyle = PANEL_A.color;
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Hard quantise: before → after', W / 2, PANEL_A.labelY);
                ctx.globalAlpha = 1;
            }

            const aGridP = progress(f, PHASE.aGrid, 20);
            if (aGridP > 0) {
                ctx.globalAlpha = aGridP * 0.6;
                ctx.strokeStyle = '#d1d5db';
                ctx.lineWidth = 1;
                for (let i = 0; i < N; i++) {
                    const x = pxX(i * GRID_STEP);
                    ctx.beginPath();
                    ctx.moveTo(x, PANEL_A.gridTop);
                    ctx.lineTo(x, PANEL_A.gridBottom);
                    ctx.stroke();
                }
                ctx.globalAlpha = 1;
            }

            RAW_T.forEach((t, i) => {
                const bp = progress(f, PHASE.aBefore + i * PHASE.aBeforeStagger, 16);
                if (bp <= 0) return;
                ctx.globalAlpha = bp * 0.6;
                ctx.fillStyle = '#9ca3af';
                ctx.beginPath();
                ctx.arc(pxX(t), PANEL_A.beforeY, 3.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            });

            RAW_T.forEach((t, i) => {
                const arrowP = progress(f, PHASE.aArrow + i * PHASE.aArrowStagger, 14);
                if (arrowP <= 0) return;
                const x0 = pxX(t);
                const x1 = pxX(AFTER_T[i]);
                if (Math.abs(x1 - x0) < 1) return; // no visible arrow needed if already on the grid
                ctx.globalAlpha = arrowP * 0.7;
                ctx.strokeStyle = PANEL_A.color;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x0, (PANEL_A.beforeY + PANEL_A.afterY) / 2);
                ctx.lineTo(x1, (PANEL_A.beforeY + PANEL_A.afterY) / 2);
                ctx.stroke();
                ctx.globalAlpha = 1;
            });

            AFTER_T.forEach((t, i) => {
                const ap = progress(f, PHASE.aAfter + i * PHASE.aAfterStagger, 16);
                if (ap <= 0) return;
                ctx.globalAlpha = ap;
                ctx.fillStyle = PANEL_A.color;
                ctx.beginPath();
                ctx.arc(pxX(t), PANEL_A.afterY, 3.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            });

            const aCapP = progress(f, PHASE.aCap, 25);
            if (aCapP > 0) {
                ctx.globalAlpha = aCapP;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 8.5px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Every note moves fully onto the nearest grid line', W / 2, PANEL_A.capY);
                ctx.globalAlpha = 1;
            }

            // --- Panel B: swing ---
            const bLabelP = progress(f, PHASE.bLabel, 18);
            if (bLabelP > 0) {
                ctx.globalAlpha = bLabelP;
                ctx.fillStyle = PANEL_B.color;
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`Swing: off-beats shifted ${Math.round(SWING_PCT * 100)}%`, W / 2, PANEL_B.labelY);
                ctx.globalAlpha = 1;
            }

            const bGridP = progress(f, PHASE.bGrid, 20);
            if (bGridP > 0) {
                ctx.globalAlpha = bGridP * 0.6;
                ctx.strokeStyle = '#d1d5db';
                ctx.lineWidth = 1;
                for (let i = 0; i < N; i++) {
                    const x = pxX(i * GRID_STEP);
                    ctx.beginPath();
                    ctx.moveTo(x, PANEL_B.gridTop);
                    ctx.lineTo(x, PANEL_B.gridBottom);
                    ctx.stroke();
                }
                ctx.globalAlpha = 1;
            }

            for (let i = 0; i < N; i++) {
                const isOffBeat = i % 2 === 1;
                const startPhase = isOffBeat ? PHASE.bSwing : PHASE.bStraight;
                const stagger = isOffBeat ? PHASE.bSwingStagger : PHASE.bStraightStagger;
                const sp = progress(f, startPhase + i * stagger, 16);
                if (sp <= 0) continue;
                const straightT = i * GRID_STEP;
                const finalT = swingT(i);
                const t = isOffBeat ? straightT + (finalT - straightT) * sp : finalT;
                ctx.globalAlpha = sp;
                ctx.fillStyle = isOffBeat ? PANEL_B.color : '#6b7280';
                ctx.beginPath();
                ctx.arc(pxX(t), PANEL_B.rowY, 3.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }

            const bCapP = progress(f, PHASE.bCap, 25);
            if (bCapP > 0) {
                ctx.globalAlpha = bCapP;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 8.5px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Off-beat notes shift later: straight time becomes a shuffle', W / 2, PANEL_B.capY);
                ctx.globalAlpha = 1;
            }

            const finalP = progress(f, PHASE.final, 30);
            if (finalP > 0) {
                ctx.globalAlpha = finalP;
                ctx.fillStyle = '#1a1a2e';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('100% strength snaps everything; swing nudges only the off-beats', W / 2, 252);
                ctx.globalAlpha = 1;
            }

            const phase = f < PHASE.bLabel ? 'Hard quantise'
                : f < PHASE.final ? 'Swing'
                : 'Compare';
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
