'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: record head → tape loop → playback head, with a dashed
// feedback arrow labelled "re-records through the loop" → a timeline of dry + 5
// repeats where each repeat is drawn shorter (level) AND its colour is interpolated
// from the bright teal accent toward the palette's dull tan (#DCC892, already used
// by DelayTime.js for its "thickening" zone) → a mini 4-band spectrum under each
// repeat where the high band shrinks fastest, showing highs are lost fastest →
// a single caption slot (like DelayTime.js's zone strip) names what changes: level,
// then highs, then both together.
//
// Colour interpolation is computed between two EXISTING palette colours only
// (#14b8a6 and #DCC892, both already used elsewhere in the delay diagram family) —
// no new hex values are introduced, intermediate frames are procedural blends.
export default function TapeEchoDarkening() {
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
        const progress = (frame, start, dur) =>
            clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);

        const REPEATS = 5;
        const LEVEL_DECAY = 0.72;

        // Endpoint colours — both already exist in the delay diagram family.
        const hexToRgb = (hex) => {
            const n = parseInt(hex.slice(1), 16);
            return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
        };
        const BRIGHT = hexToRgb('#14b8a6');
        const DULL = hexToRgb('#DCC892');
        const lerpColor = (t) => {
            const r = Math.round(BRIGHT.r + (DULL.r - BRIGHT.r) * t);
            const g = Math.round(BRIGHT.g + (DULL.g - BRIGHT.g) * t);
            const b = Math.round(BRIGHT.b + (DULL.b - BRIGHT.b) * t);
            return `rgb(${r},${g},${b})`;
        };

        // Mini-spectrum bands (illustrative — no exact dB/Hz figures are claimed).
        // Low band decays slowest, high band decays fastest — the visual claim the
        // row makes: every pass loses high-frequency content fastest.
        const BANDS = [
            { baseH: 30, decay: 0.97 },
            { baseH: 25, decay: 0.87 },
            { baseH: 20, decay: 0.70 },
            { baseH: 15, decay: 0.50 },
        ];

        const margin = { left: 30, right: 30 };
        const dryX = 90;
        const colGap = 65;
        const timelineY = 120;
        const specBaseY = 230;

        const PHASE_DIAGRAM = 20;
        const PHASE_ARROW = 55;
        const PHASE_TIMELINE = 130;
        const REPEAT_STEP = 32;
        const PHASE_SPECTRUM = PHASE_TIMELINE + (REPEATS + 1) * REPEAT_STEP + 20; // after last repeat settles
        const SPEC_STEP = 20;
        const PHASE_CLOSE = PHASE_SPECTRUM + (REPEATS + 1) * SPEC_STEP + 30;

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
            ctx.fillText('Tape Echo: why old repeats get darker', W / 2, 16);
            ctx.globalAlpha = 1;

            // --- Tape mechanism: REC head — tape line — PB head ---
            const recBox = { x: 60, y: 26, w: 60, h: 20 };
            const pbBox = { x: 360, y: 26, w: 60, h: 20 };
            const diagP = progress(f, PHASE_DIAGRAM, 30);
            if (diagP > 0) {
                ctx.globalAlpha = diagP;
                [{ b: recBox, label: 'REC' }, { b: pbBox, label: 'PB' }].forEach(({ b, label }) => {
                    ctx.fillStyle = '#fff';
                    ctx.strokeStyle = '#374151';
                    ctx.lineWidth = 1.2;
                    ctx.beginPath();
                    ctx.roundRect(b.x, b.y, b.w, b.h, 4);
                    ctx.fill();
                    ctx.stroke();
                    ctx.fillStyle = '#374151';
                    ctx.font = 'bold 9px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2 + 3);
                });

                // Tape line between the two heads
                ctx.strokeStyle = '#9ca3af';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(recBox.x + recBox.w, recBox.y + recBox.h / 2);
                ctx.lineTo(pbBox.x, pbBox.y + pbBox.h / 2);
                ctx.stroke();

                ctx.fillStyle = '#6b7280';
                ctx.font = 'italic 8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('tape loop', W / 2, recBox.y - 4);
                ctx.globalAlpha = 1;
            }

            // --- Feedback arrow: PB output loops back into REC input ---
            const arrowP = progress(f, PHASE_ARROW, 30);
            if (arrowP > 0) {
                ctx.globalAlpha = arrowP;
                const fromX = pbBox.x + pbBox.w * 0.3;
                const fromY = pbBox.y + pbBox.h;
                const toX = recBox.x + recBox.w * 0.7;
                const toY = recBox.y + recBox.h;
                ctx.strokeStyle = '#f97316';
                ctx.lineWidth = 1.3;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(fromX, fromY);
                ctx.bezierCurveTo(fromX, fromY + 18, toX, toY + 18, toX, toY);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.fillStyle = '#f97316';
                ctx.beginPath();
                ctx.moveTo(toX, toY);
                ctx.lineTo(toX - 3, toY + 7);
                ctx.lineTo(toX + 3, toY + 7);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = '#f97316';
                ctx.font = 'italic 8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('feedback: re-records through the loop', W / 2, fromY + 30);
                ctx.globalAlpha = 1;
            }

            // --- Main pulse timeline: dry + REPEATS decaying, dulling repeats ---
            const dryP = progress(f, PHASE_TIMELINE, 25);
            if (dryP > 0) {
                drawWavelet(ctx, dryX, timelineY, 22 * dryP, '#374151', 1);
                ctx.globalAlpha = dryP * 0.8;
                ctx.fillStyle = '#374151';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('dry', dryX, timelineY + 40);
                ctx.globalAlpha = 1;
            }

            for (let i = 1; i <= REPEATS; i++) {
                const appearFrame = PHASE_TIMELINE + i * REPEAT_STEP;
                const p = progress(f, appearFrame, 24);
                if (p <= 0) continue;
                const x = dryX + i * colGap;
                const amp = 22 * Math.pow(LEVEL_DECAY, i) * p;
                const t = i / REPEATS;
                const color = lerpColor(t);
                drawWavelet(ctx, x, timelineY, amp, color, 0.95);

                ctx.globalAlpha = p * 0.8;
                ctx.fillStyle = color;
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(String(i), x, timelineY + 40);
                ctx.globalAlpha = 1;
            }

            // --- Mini spectrum row: dry (i=0, full) then 5 repeats losing highs fastest ---
            for (let i = 0; i <= REPEATS; i++) {
                const appearFrame = PHASE_SPECTRUM + i * SPEC_STEP;
                const p = progress(f, appearFrame, 18);
                if (p <= 0) continue;
                const x = dryX + i * colGap;
                const color = i === 0 ? '#374151' : lerpColor(i / REPEATS);
                ctx.globalAlpha = p;
                BANDS.forEach((band, bi) => {
                    const h = band.baseH * Math.pow(band.decay, i) * p;
                    const bx = x - 9 + bi * 6;
                    ctx.fillStyle = color;
                    ctx.fillRect(bx, specBaseY - h, 4, h);
                });
                ctx.globalAlpha = 1;
            }
            // Sits above the bars (baseline 188), not below them, so it never shares
            // a text row with the rotating caption slot at y=252 — 40px of clean
            // vertical band between the numbers row (baseline 160) and the bar tops
            // (y=200) fits this with room either side. See task-10-report.md fix
            // section for the bounding-box check against the caption.
            const specLabelP = progress(f, PHASE_SPECTRUM, 20);
            if (specLabelP > 0) {
                ctx.globalAlpha = specLabelP;
                ctx.fillStyle = '#9ca3af';
                ctx.font = 'italic 8px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('mini spectrum: low → high', margin.left, specBaseY - 42);
                ctx.globalAlpha = 1;
            }

            // --- Dynamic caption slot (single row, text changes with phase) ---
            let caption = '';
            if (f >= PHASE_CLOSE) {
                caption = 'Quieter AND darker, together: the tape signature';
            } else if (f >= PHASE_SPECTRUM) {
                caption = 'Highs ↓: each pass loses top-end content fastest';
            } else if (f >= PHASE_TIMELINE + REPEAT_STEP) {
                caption = 'Level ↓: each pass is quieter than the last';
            }
            if (caption) {
                const capP = progress(f, f >= PHASE_CLOSE ? PHASE_CLOSE : f >= PHASE_SPECTRUM ? PHASE_SPECTRUM : PHASE_TIMELINE + REPEAT_STEP, 20);
                ctx.globalAlpha = capP;
                ctx.fillStyle = '#1a1a2e';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(caption, W / 2, 252);
                ctx.globalAlpha = 1;
            }

            // Phase indicator
            const phase = f < PHASE_ARROW ? 'Tape loop'
                : f < PHASE_TIMELINE ? 'Feedback'
                : f < PHASE_SPECTRUM ? 'Level'
                : f < PHASE_CLOSE ? 'Highs'
                : 'Signature';
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

function drawWavelet(ctx, x, y, amplitude, color, alpha) {
    const prev = ctx.globalAlpha;
    ctx.globalAlpha = prev * alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const width = 18;
    for (let dx = -width; dx <= width; dx++) {
        const env = Math.exp(-Math.abs(dx) / 7);
        const yOffset = Math.sin(dx * 0.8) * amplitude * env;
        const px = x + dx;
        const py = y + yOffset;
        if (dx === -width) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.globalAlpha = prev;
}
