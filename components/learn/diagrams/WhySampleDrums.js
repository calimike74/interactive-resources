'use client';

import { useEffect, useRef } from 'react';

// Split panel: LIVE KIT (left, x 20-220) vs SAMPLE PADS (right, x 260-460),
// divided by a vertical rule at x=240. Advantages are shown, not listed as a
// text wall: the left panel draws mics bleeding into each other and one fixed
// take; the right panel draws individually controllable pads and a snapping
// quantise grid.
//
// Quantise-snap geometry: GRID_TICKS is a computed evenly-spaced array
// (step 20px, ticks at 270,290,...,450). The demo dot starts at
// OFFGRID_X=322, deliberately off every tick, and animates to the array's
// own nearest tick (found by reduce(), not hand-typed) — 330, 8px away — so
// the "snap" target can never drift from the drawn grid.
//
// Label-clearance: left-panel text lives at y in {42,58,90(mic labels are
// inside dots, none),178} and the drum boxes occupy y=[100,126]; the spill
// arcs occupy y=[66,78] strictly between the y=58 label and the y=100 boxes.
// Right-panel tags sit at y=90 (12px above the y=100 pad tops); the grid and
// its ticks sit at y=150, 24px below the pad bottom (126) and 20px above its
// own label (178). The shared closing caption at y=255 sits 25px below every
// other element (bottom-most content is the y=178 labels). No drawn
// connector line exists outside its own box's fill, so none can cross text.
export default function WhySampleDrums() {
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

        const DIVIDER_X = 240;
        const CENTERS_L = [58, 120, 182];
        const CENTERS_R = CENTERS_L.map((c) => c + 240); // [298, 360, 422]
        const DRUM_LABELS = ['KICK', 'SNARE', 'HAT'];
        const boxW = 48;
        const boxH = 26;
        const boxY = 100;

        const drawBox = (cx, label, fill, stroke, alpha) => {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = fill;
            ctx.strokeStyle = stroke;
            ctx.lineWidth = 1.3;
            ctx.beginPath();
            ctx.roundRect(cx - boxW / 2, boxY, boxW, boxH, 5);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = fill === '#fff' ? '#374151' : '#fff';
            ctx.font = 'bold 8px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(label, cx, boxY + boxH / 2 + 3);
            ctx.globalAlpha = 1;
        };

        // Quantise grid: computed evenly-spaced ticks, snap target found on the array.
        const GRID_X0 = 270;
        const GRID_X1 = 450;
        const GRID_N = 10;
        const GRID_STEP = (GRID_X1 - GRID_X0) / (GRID_N - 1);
        const GRID_TICKS = Array.from({ length: GRID_N }, (_, i) => GRID_X0 + i * GRID_STEP);
        const OFFGRID_X = 322; // deliberately off-tick (ticks fall on multiples of 20 from 270)
        const NEAREST_TICK = GRID_TICKS.reduce((best, t) =>
            Math.abs(t - OFFGRID_X) < Math.abs(best - OFFGRID_X) ? t : best
        );
        const GRID_Y = 150;

        const PHASE_TITLES = 15;
        const PHASE_MICS = 45;
        const PHASE_SPILL = 75;
        const PHASE_DRUMS_L = 100;
        const PHASE_TAKE = 140;
        const PHASE_TAKE_LABEL = 175;
        const PHASE_PADS_R = 100;
        const PHASE_TAGS = 140;
        const PHASE_GRID = 180;
        const PHASE_SNAP = 220;
        const PHASE_GRID_LABEL = 255;
        const PHASE_CAPTION = 300;

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
            ctx.fillText('Live Kit vs Sample Pads', W / 2, 16);
            ctx.globalAlpha = 1;

            // Divider
            const divP = progress(f, 10, 30);
            if (divP > 0) {
                ctx.globalAlpha = divP * 0.5;
                ctx.strokeStyle = '#d1d5db';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(DIVIDER_X, 36);
                ctx.lineTo(DIVIDER_X, 200);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            const panelTitleP = progress(f, PHASE_TITLES, 20);
            if (panelTitleP > 0) {
                ctx.globalAlpha = panelTitleP;
                ctx.font = 'bold 10px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#374151';
                ctx.fillText('LIVE KIT', 120, 42);
                ctx.fillText('SAMPLE PADS', 360, 42);
                ctx.globalAlpha = 1;
            }

            // --- LEFT: mic dots + stands ---
            const micP = progress(f, PHASE_MICS, 25);
            if (micP > 0) {
                ctx.globalAlpha = micP;
                CENTERS_L.forEach((cx) => {
                    ctx.strokeStyle = '#9ca3af';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(cx, 80);
                    ctx.lineTo(cx, boxY);
                    ctx.stroke();
                    ctx.fillStyle = '#e85d75';
                    ctx.beginPath();
                    ctx.arc(cx, 76, 3.5, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.globalAlpha = 1;
            }

            // --- LEFT: spill arcs between adjacent mics ---
            const spillP = progress(f, PHASE_SPILL, 25);
            if (spillP > 0) {
                ctx.globalAlpha = spillP;
                ctx.strokeStyle = '#e85d75';
                ctx.lineWidth = 1;
                ctx.setLineDash([2, 2]);
                for (let i = 0; i < CENTERS_L.length - 1; i++) {
                    ctx.beginPath();
                    ctx.moveTo(CENTERS_L[i], 74);
                    ctx.quadraticCurveTo((CENTERS_L[i] + CENTERS_L[i + 1]) / 2, 62, CENTERS_L[i + 1], 74);
                    ctx.stroke();
                }
                ctx.setLineDash([]);
                ctx.fillStyle = '#e85d75';
                ctx.font = 'bold 7px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('spill between mics', 120, 58);
                ctx.globalAlpha = 1;
            }

            // --- LEFT: drum boxes ---
            const drumP = progress(f, PHASE_DRUMS_L, 25);
            if (drumP > 0) {
                CENTERS_L.forEach((cx, i) => drawBox(cx, DRUM_LABELS[i], '#fff', '#374151', drumP));
            }

            // --- LEFT: fixed "one take" waveform strip ---
            const takeP = progress(f, PHASE_TAKE, 30);
            if (takeP > 0) {
                ctx.globalAlpha = takeP;
                ctx.strokeStyle = '#9ca3af';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                const y0 = 158;
                for (let x = 30; x <= 210; x++) {
                    const dx = x - 120;
                    const env = Math.exp(-Math.abs(dx) / 60);
                    const y = y0 + Math.sin(dx * 0.5) * 10 * env;
                    if (x === 30) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
            const takeLabelP = progress(f, PHASE_TAKE_LABEL, 25);
            if (takeLabelP > 0) {
                ctx.globalAlpha = takeLabelP;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 7px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('one take — fixed once recorded', 120, 178);
                ctx.globalAlpha = 1;
            }

            // --- RIGHT: pads (filled, distinct colours = independently controllable) ---
            const padP = progress(f, PHASE_PADS_R, 25);
            const padColors = ['#14b8a6', '#DCC892', '#e85d75'];
            if (padP > 0) {
                CENTERS_R.forEach((cx, i) => drawBox(cx, DRUM_LABELS[i], padColors[i], padColors[i], padP));
            }

            // --- RIGHT: per-pad control tags ---
            const tagP = progress(f, PHASE_TAGS, 25);
            if (tagP > 0) {
                ctx.globalAlpha = tagP;
                ctx.font = 'bold 7px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                const tags = ['quantised', 'retuned', 'no spill'];
                CENTERS_R.forEach((cx, i) => {
                    ctx.fillStyle = padColors[i];
                    ctx.fillText(tags[i], cx, 90);
                });
                ctx.globalAlpha = 1;
            }

            // --- RIGHT: quantise grid + snapping dot ---
            const gridP = progress(f, PHASE_GRID, 25);
            if (gridP > 0) {
                ctx.globalAlpha = gridP;
                ctx.strokeStyle = '#d1d5db';
                ctx.lineWidth = 1;
                GRID_TICKS.forEach((tx) => {
                    ctx.beginPath();
                    ctx.moveTo(tx, GRID_Y - 5);
                    ctx.lineTo(tx, GRID_Y + 5);
                    ctx.stroke();
                });
                ctx.beginPath();
                ctx.moveTo(GRID_X0, GRID_Y);
                ctx.lineTo(GRID_X1, GRID_Y);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
            const snapP = progress(f, PHASE_SNAP, 30);
            if (snapP > 0) {
                const dotX = OFFGRID_X + (NEAREST_TICK - OFFGRID_X) * snapP;
                ctx.globalAlpha = 1;
                ctx.fillStyle = '#14b8a6';
                ctx.beginPath();
                ctx.arc(dotX, GRID_Y, 4, 0, Math.PI * 2);
                ctx.fill();
            }
            const gridLabelP = progress(f, PHASE_GRID_LABEL, 25);
            if (gridLabelP > 0) {
                ctx.globalAlpha = gridLabelP;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 7px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('every hit — quantised, retuned, no bleed', 360, 178);
                ctx.globalAlpha = 1;
            }

            const capP = progress(f, PHASE_CAPTION, 30);
            if (capP > 0) {
                ctx.globalAlpha = capP;
                ctx.fillStyle = '#1a1a2e';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Sampling trades the room for control — no spill, quantised, retuned, identical every time', W / 2, 255);
                ctx.globalAlpha = 1;
            }

            const phase = f < PHASE_DRUMS_L ? 'Live kit — spill'
                : f < PHASE_PADS_R + 40 ? 'One fixed take'
                : f < PHASE_GRID ? 'Sample pads'
                : 'Quantised';
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
