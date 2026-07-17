'use client';

import { useEffect, useRef } from 'react';

// Linear 4-box chain — RECORD -> STORE -> TRIGGER -> PLAYBACK — dramatising the
// exam's own two-mark definition (a digital recording, triggered using a MIDI
// keyboard). Anatomy copies TransductionChain.js exactly: one row of boxes
// (y=130..162, mid=146), arrows drawn before boxes so the fills mask the arrow
// ends. Two bracket labels sit BELOW the chain (y=170..178, ticks pointing up
// at the boxes) grouping RECORD+STORE under "a digital recording — 1 mark" and
// TRIGGER+PLAYBACK under "triggered using a MIDI keyboard — 1 mark".
//
// Label-clearance: every connector/arrow lives strictly at y=146 (box row,
// y in [130,162]). Both bracket labels sit at y=192, 30px clear of the box
// row; the caption sits at y=222, the phase indicator at y=H-8=272 — neither
// region is ever touched by the y=146 connector line or the two y=[170,178]
// brackets (which themselves stop at y=178, 14px above the label text).
// Bracket text spans: "a digital recording — 1 mark" centred x=130 (~130px
// wide) vs "triggered using a MIDI keyboard — 1 mark" centred x=350 (~190px
// wide) — bounding boxes [65,195] and [255,445] do not overlap (60px gap).
export default function SamplerRecordStoreTrigger() {
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

        // Four boxes, one row: x_i = 30 + i*110, width 90, gap 20, margins 30 both sides.
        const boxes = [
            { x: 30, y: 130, w: 90, h: 32, label: 'RECORD', sub: 'mic / waveform in' },
            { x: 140, y: 130, w: 90, h: 32, label: 'STORE', sub: 'digital memory' },
            { x: 250, y: 130, w: 90, h: 32, label: 'TRIGGER', sub: 'MIDI key' },
            { x: 360, y: 130, w: 90, h: 32, label: 'PLAYBACK', sub: 'sample sounds' },
        ];
        const midY = 146;
        const boxBottom = 162;

        const drawBox = (b, alpha, ringAlpha) => {
            if (ringAlpha > 0) {
                ctx.globalAlpha = ringAlpha;
                ctx.strokeStyle = '#e85d75';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(b.x - 4, b.y - 4, b.w + 8, b.h + 8, 8);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#374151';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.roundRect(b.x, b.y, b.w, b.h, 5);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#374151';
            ctx.font = 'bold 9px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 - 2);
            ctx.font = '7px -apple-system, sans-serif';
            ctx.fillStyle = '#6b7280';
            ctx.fillText(b.sub, b.x + b.w / 2, b.y + b.h / 2 + 10);
            ctx.globalAlpha = 1;
        };

        const arrowHead = (x, y, dx, dy, color) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - dx - dy, y - dy + dx);
            ctx.lineTo(x - dx + dy, y - dy - dx);
            ctx.closePath();
            ctx.fill();
        };

        const path = (pts) => {
            ctx.beginPath();
            pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
            ctx.stroke();
        };

        const PHASE_B = [20, 72, 124, 176];
        const PHASE_A = [48, 100, 152];
        const PHASE_BRACKETS = 210;
        const PHASE_CAPTION = 250;
        const PULSE_START = 300;
        const PULSE_PERIOD = 160;

        const legs = [
            { from: [boxes[0].x + boxes[0].w, midY], to: [boxes[1].x, midY] },
            { from: [boxes[1].x + boxes[1].w, midY], to: [boxes[2].x, midY] },
            { from: [boxes[2].x + boxes[2].w, midY], to: [boxes[3].x, midY] },
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
            ctx.fillText('A Sample: Record, Store, Trigger', W / 2, 16);
            ctx.globalAlpha = 1;

            // Arrows first (masked cleanly by the box fills drawn after).
            for (let i = 0; i < PHASE_A.length; i++) {
                const p = progress(f, PHASE_A[i], 18);
                if (p <= 0) continue;
                const leg = legs[i];
                ctx.globalAlpha = p;
                ctx.strokeStyle = '#14b8a6';
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.moveTo(leg.from[0], leg.from[1]);
                ctx.lineTo(leg.to[0], leg.to[1]);
                ctx.stroke();
                arrowHead(leg.to[0], leg.to[1], 5, 0, '#14b8a6');
                ctx.globalAlpha = 1;
            }

            // Ring flash on PLAYBACK when the travelling pulse arrives.
            let playbackRing = 0;
            if (f >= PULSE_START) {
                const cyclePos = ((f - PULSE_START) % PULSE_PERIOD) / PULSE_PERIOD;
                if (cyclePos > 0.9) playbackRing = (1 - (cyclePos - 0.9) / 0.1) * 0.9;
            }

            for (let i = 0; i < boxes.length; i++) {
                const p = progress(f, PHASE_B[i], 22);
                if (p > 0) drawBox(boxes[i], p, i === 3 ? playbackRing : 0);
            }

            // Bracket 1: RECORD + STORE = "a digital recording"
            const bracketP = progress(f, PHASE_BRACKETS, 30);
            if (bracketP > 0) {
                ctx.globalAlpha = bracketP;
                const b1x0 = boxes[0].x;
                const b1x1 = boxes[1].x + boxes[1].w;
                ctx.strokeStyle = '#14b8a6';
                ctx.lineWidth = 1.2;
                path([[b1x0, boxBottom + 8], [b1x0, boxBottom + 16], [b1x1, boxBottom + 16], [b1x1, boxBottom + 8]]);
                ctx.fillStyle = '#14b8a6';
                ctx.font = 'bold 8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('a digital recording — 1 mark', (b1x0 + b1x1) / 2, boxBottom + 30);

                const b2x0 = boxes[2].x;
                const b2x1 = boxes[3].x + boxes[3].w;
                ctx.strokeStyle = '#e85d75';
                path([[b2x0, boxBottom + 8], [b2x0, boxBottom + 16], [b2x1, boxBottom + 16], [b2x1, boxBottom + 8]]);
                ctx.fillStyle = '#e85d75';
                ctx.fillText('triggered using a MIDI keyboard — 1 mark', (b2x0 + b2x1) / 2, boxBottom + 30);
                ctx.globalAlpha = 1;
            }

            const capP = progress(f, PHASE_CAPTION, 30);
            if (capP > 0) {
                ctx.globalAlpha = capP;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Both halves earn a mark — a recording alone, or a trigger alone, is not enough', W / 2, boxBottom + 60);
                ctx.globalAlpha = 1;
            }

            // Travelling pulse: RECORD -> STORE -> TRIGGER -> PLAYBACK, looping.
            if (f >= PULSE_START) {
                const cyclePos = ((f - PULSE_START) % PULSE_PERIOD) / PULSE_PERIOD;
                if (cyclePos <= 0.9) {
                    const legPos = (cyclePos / 0.9) * legs.length;
                    const legIdx = Math.min(legs.length - 1, Math.floor(legPos));
                    const localT = legPos - legIdx;
                    const leg = legs[legIdx];
                    const px = leg.from[0] + (leg.to[0] - leg.from[0]) * localT;
                    const py = leg.from[1] + (leg.to[1] - leg.from[1]) * localT;
                    ctx.fillStyle = '#14b8a6';
                    ctx.beginPath();
                    ctx.arc(px, py, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            const phase = f < PHASE_B[1] ? 'Record'
                : f < PHASE_B[2] ? 'Store'
                : f < PHASE_B[3] ? 'Trigger'
                : f < PULSE_START ? 'Playback'
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
