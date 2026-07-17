'use client';

import { useEffect, useRef } from 'react';

// Linear 6-box chain — source -> mic -> preamp -> converter -> DAW -> monitors
// — the recording signal path (spec 1.1). All six boxes sit on ONE row
// (y=130..162, mid=146), the same one-row-plus-in-box-labels pattern as
// TransductionChain.js, extended from 5 boxes to 6: w=64, gap=12.8, margin=16,
// x_i = 16 + i*76.8 for i=0..5 (x = 16, 92.8, 169.6, 246.4, 323.2, 400; last
// box's right edge = 400+64 = 464 = 480-16, so the row is exactly centred
// with 16px margins both sides, matching TransductionChain's own margin).
//
// Label-clearance proof (geometry is static across every frame — only reveal
// alpha animates, so this holds at every animation extreme, not just steady
// state):
//   - Every box label/sub-label is drawn INSIDE its own box's fill (masked,
//     same precedent as TransductionChain/SidechainTriggerTarget), centred
//     within that box's OWN x-range [x_i, x_i+64] — never wider than the box.
//   - Connector arrows are the only line elements outside box fills. Each
//     connector i spans x=[x_i+64, x_(i+1)] at fixed y=146 — i.e. strictly
//     the empty gap between box i and box i+1. Every box's label lives inside
//     [x_i, x_i+64]; every connector lives inside a disjoint gap interval
//     [x_i+64, x_(i+1)]. Box x-ranges and gap x-ranges never overlap by
//     construction, so no connector can ever cross any box's label.
//   - ANALOGUE / DIGITAL bracket labels + their bracket lines sit at y=112
//     (label) and y=120 (line) — 10px clear above the box row's top edge
//     (y=130) at the closest point (the bracket line), 18px clear at the
//     label. Bracket lines never enter y=[130,162] (the only band any
//     connector or box occupies), so they cannot cross a box label either.
//   - Title (y=16) sits ~110px above the box row. Caption (y=195) sits 33px
//     below the box row's bottom edge (162), matching TransductionChain's own
//     33px caption clearance. Phase indicator (y=272) sits even further
//     clear. None of these ever coincide with y=146 (the only y at which a
//     connector is ever drawn) or with any box's y-band.
//   - The travelling pulse (phase >= PULSE_START) is a single 3px-radius
//     point marker riding y=146 across the full chain width, not a
//     persistent line — same precedent as TransductionChain's own pulse.
//
// Invented/illustrative note: "A -> D" / analogue-digital framing follows
// directly from lib/topics.js's specSummary wording ("Signal flow from
// source -> mic -> preamp -> converter -> DAW -> monitors"); no named source
// spells out what each individual stage does to the signal beyond that
// vocabulary list, so the per-stage sub-labels here are standard,
// uncontested recording-engineering description, not a verbatim source
// quote. Flagged in the task report.
export default function RecordingSignalFlow() {
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

        const CYCLE = 760;
        let animId;

        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);

        const BOX_W = 64;
        const GAP = 12.8;
        const boxX = (i) => 16 + i * (BOX_W + GAP);
        const BOX_Y = 130;
        const BOX_H = 32;
        const midY = BOX_Y + BOX_H / 2; // 146

        const boxes = [
            { label: 'SOURCE', sub: 'sound', color: '#374151' },
            { label: 'MIC', sub: 'transducer', color: '#374151' },
            { label: 'PREAMP', sub: 'boosts level', color: '#374151' },
            { label: 'CONVERTER', sub: 'A → D', color: '#374151' },
            { label: 'DAW', sub: 'records', color: '#374151' },
            { label: 'MONITORS', sub: 'you hear it', color: '#374151' },
        ];

        const drawBox = (i, alpha) => {
            const b = boxes[i];
            const x = boxX(i);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = b.color;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.roundRect(x, BOX_Y, BOX_W, BOX_H, 5);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#374151';
            ctx.font = 'bold 7.5px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(b.label, x + BOX_W / 2, BOX_Y + BOX_H / 2 - 2);
            ctx.font = '6.5px -apple-system, sans-serif';
            ctx.fillStyle = '#6b7280';
            ctx.fillText(b.sub, x + BOX_W / 2, BOX_Y + BOX_H / 2 + 9);
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

        const PHASE_B = [20, 74, 128, 182, 236, 290];
        const PHASE_A = [50, 104, 158, 212, 266];
        const BRACKET_START = 340;
        const CAPTION_START = 390;
        const PULSE_START = 450;
        const PULSE_PERIOD = 180;

        const stageNames = ['Source', 'Mic', 'Preamp', 'Converter', 'DAW', 'Monitors'];

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
            ctx.fillText('The Recording Signal Chain', W / 2, 16);
            ctx.globalAlpha = 1;

            // Arrows first, so box fills mask their ends cleanly.
            for (let i = 0; i < PHASE_A.length; i++) {
                const p = progress(f, PHASE_A[i], 18);
                if (p <= 0) continue;
                const x0 = boxX(i) + BOX_W;
                const x1 = boxX(i + 1);
                ctx.globalAlpha = p;
                ctx.strokeStyle = '#14b8a6';
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.moveTo(x0, midY);
                ctx.lineTo(x1, midY);
                ctx.stroke();
                arrowHead(x1, midY, 5, 0, '#14b8a6');
                ctx.globalAlpha = 1;
            }

            for (let i = 0; i < boxes.length; i++) {
                const p = progress(f, PHASE_B[i], 24);
                if (p > 0) drawBox(i, p);
            }

            // ANALOGUE bracket over boxes 0-2, DIGITAL bracket over boxes 3-5.
            // Bracket line at y=120 (10px clear above box top y=130); label
            // at y=112 (18px clear). Both stay outside y=[130,162] always.
            const bracketP = progress(f, BRACKET_START, 30);
            if (bracketP > 0) {
                ctx.globalAlpha = bracketP;
                const aStart = boxX(0);
                const aEnd = boxX(2) + BOX_W;
                const dStart = boxX(3);
                const dEnd = boxX(5) + BOX_W;
                const lineY = 120;

                ctx.strokeStyle = '#9ca3af';
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.moveTo(aStart, lineY);
                ctx.lineTo(aEnd, lineY);
                ctx.stroke();
                ctx.fillStyle = '#9ca3af';
                ctx.font = 'bold 8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('ANALOGUE', (aStart + aEnd) / 2, 112);

                ctx.strokeStyle = '#14b8a6';
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.moveTo(dStart, lineY);
                ctx.lineTo(dEnd, lineY);
                ctx.stroke();
                ctx.fillStyle = '#14b8a6';
                ctx.fillText('DIGITAL', (dStart + dEnd) / 2, 112);
                ctx.globalAlpha = 1;
            }

            const capP = progress(f, CAPTION_START, 30);
            if (capP > 0) {
                ctx.globalAlpha = capP;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('The converter is where analogue becomes digital', W / 2, 195);
                ctx.globalAlpha = 1;
            }

            // Travelling pulse — a point marker, not a persistent line (same
            // precedent as TransductionChain.js).
            if (f >= PULSE_START) {
                const cyclePos = ((f - PULSE_START) % PULSE_PERIOD) / PULSE_PERIOD;
                const t = cyclePos < 0.5 ? cyclePos * 2 : (1 - cyclePos) * 2;
                const x0 = boxX(0) + BOX_W / 2;
                const x1 = boxX(5) + BOX_W / 2;
                const px = x0 + (x1 - x0) * t;
                ctx.fillStyle = '#14b8a6';
                ctx.beginPath();
                ctx.arc(px, midY, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            let phase = 'Chain complete';
            for (let i = 0; i < PHASE_B.length; i++) {
                if (f < PHASE_B[i] + 24) { phase = stageNames[i]; break; }
            }
            if (f >= PHASE_B[5] + 24 && f < BRACKET_START) phase = 'Monitors';
            else if (f >= BRACKET_START && f < CAPTION_START) phase = 'Analogue / Digital';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - 20, H - 8);

            if (f > CYCLE - 50) {
                const fadeOut = progress(f, CYCLE - 50, 50);
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
