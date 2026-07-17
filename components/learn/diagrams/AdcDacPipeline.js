'use client';

import { useEffect, useRef } from 'react';

// Linear 5-box chain — mic -> ADC -> DAW -> DAC -> monitors — the round-trip
// conversion pipeline (spec 2.4). Same one-row-plus-in-box-labels pattern as
// RecordingSignalFlow.js's 6-box chain, here with 5 boxes: w=64, gap=32,
// margin=16, x_i = 16 + i*96 for i=0..4 (x = 16, 112, 208, 304, 400; last
// box's right edge = 400+64 = 464 = 480-16, so the row is exactly centred
// with 16px margins both sides, matching RecordingSignalFlow's own margin).
//
// This chain deliberately differs from RecordingSignalFlow's single
// "CONVERTER" box: it splits conversion into ADC (in) and DAC (out) as two
// separate nodes either side of the DAW, because THIS row's own teaching
// point is that conversion happens twice, in opposite directions — not the
// general recording chain RecordingSignalFlow already covers. Three domain
// brackets carry that point visually: ANALOGUE over box 0 alone (the mic's
// output), DIGITAL over boxes 1-3 (ADC's output through DAC's input), and
// ANALOGUE again over box 4 alone (the monitors' input) — an out-and-back
// shape, not RecordingSignalFlow's single two-way split. The four connector
// arrows are coloured from a small CONNECTOR_DOMAIN lookup (computed per
// connector index, not hand-picked per arrow) so the wire colour itself
// tracks which domain that wire carries: grey before the ADC and after the
// DAC, teal in between.
//
// Label-clearance proof (geometry is static across every frame — only reveal
// alpha and the travelling pulse's position animate, so this holds at every
// animation extreme):
//   - Every box label/sub-label is drawn INSIDE its own box's fill (masked,
//     same precedent as RecordingSignalFlow/TransductionChain), centred
//     within that box's OWN x-range [x_i, x_i+64] — never wider than the box.
//   - Connector arrows are the only line elements outside box fills. Each
//     connector i spans x=[x_i+64, x_(i+1)] at fixed y=146 — strictly the
//     empty gap between box i and box i+1. Box x-ranges and gap x-ranges
//     never overlap by construction, so no connector can ever cross any
//     box's label.
//   - The three bracket lines + labels sit at y=120 (line) and y=112
//     (label) — 10px clear above the box row's top edge (y=130) at the
//     closest point (the bracket line), 18px clear at the label — identical
//     margin to RecordingSignalFlow's own proven-clear bracket geometry.
//     Their x-centres (48, 240, 432) are 192px apart at minimum, so no
//     bracket label can reach another bracket's label either.
//   - Title (y=16) sits ~110px above the box row. Caption (y=195) sits 33px
//     below the box row's bottom edge (162). Neither ever coincides with
//     y=146 (the only y a connector is drawn at) or any box's y-band.
//   - The travelling pulse (phase >= PULSE_START) is a single 3px-radius
//     point marker riding y=146 across the full chain width, not a
//     persistent line — same precedent as RecordingSignalFlow's own pulse.
export default function AdcDacPipeline() {
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

        const CYCLE = 680;
        let animId;

        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);

        const BOX_W = 64;
        const GAP = 32;
        const boxX = (i) => 16 + i * (BOX_W + GAP);
        const BOX_Y = 130;
        const BOX_H = 32;
        const midY = BOX_Y + BOX_H / 2; // 146

        const boxes = [
            { label: 'MIC', sub: 'transducer' },
            { label: 'ADC', sub: 'A → D' },
            { label: 'DAW', sub: 'stores, edits' },
            { label: 'DAC', sub: 'D → A' },
            { label: 'MONITORS', sub: 'you hear it' },
        ];

        const DOMAIN_COLOR = { analogue: '#9ca3af', digital: '#14b8a6' };
        const CONNECTOR_DOMAIN = ['analogue', 'digital', 'digital', 'analogue'];

        const drawBox = (i, alpha) => {
            const b = boxes[i];
            const x = boxX(i);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#374151';
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

        const PHASE_B = [20, 74, 128, 182, 236];
        const PHASE_A = [50, 104, 158, 212];
        const BRACKET_START = 290;
        const CAPTION_START = 340;
        const PULSE_START = 410;
        const PULSE_PERIOD = 170;

        const stageNames = ['Mic', 'ADC', 'DAW', 'DAC', 'Monitors'];

        // Brackets: [box0] alone, [box1..box3] together, [box4] alone.
        const BRACKETS = [
            { from: 0, to: 0, label: 'ANALOGUE', color: '#9ca3af' },
            { from: 1, to: 3, label: 'DIGITAL', color: '#14b8a6' },
            { from: 4, to: 4, label: 'ANALOGUE', color: '#9ca3af' },
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
            ctx.fillText('The Round Trip: ADC In, DAC Out', W / 2, 16);
            ctx.globalAlpha = 1;

            // Arrows first, so box fills mask their ends cleanly.
            for (let i = 0; i < PHASE_A.length; i++) {
                const p = progress(f, PHASE_A[i], 18);
                if (p <= 0) continue;
                const x0 = boxX(i) + BOX_W;
                const x1 = boxX(i + 1);
                const color = DOMAIN_COLOR[CONNECTOR_DOMAIN[i]];
                ctx.globalAlpha = p;
                ctx.strokeStyle = color;
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.moveTo(x0, midY);
                ctx.lineTo(x1, midY);
                ctx.stroke();
                arrowHead(x1, midY, 5, 0, color);
                ctx.globalAlpha = 1;
            }

            for (let i = 0; i < boxes.length; i++) {
                const p = progress(f, PHASE_B[i], 24);
                if (p > 0) drawBox(i, p);
            }

            // Bracket line at y=120 (10px clear above box top y=130); label
            // at y=112 (18px clear). Both stay outside y=[130,162] always.
            const bracketP = progress(f, BRACKET_START, 30);
            if (bracketP > 0) {
                ctx.globalAlpha = bracketP;
                const lineY = 120;
                BRACKETS.forEach((br) => {
                    const bStart = boxX(br.from);
                    const bEnd = boxX(br.to) + BOX_W;
                    ctx.strokeStyle = br.color;
                    ctx.lineWidth = 1.4;
                    ctx.beginPath();
                    ctx.moveTo(bStart, lineY);
                    ctx.lineTo(bEnd, lineY);
                    ctx.stroke();
                    ctx.fillStyle = br.color;
                    ctx.font = 'bold 8px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(br.label, (bStart + bEnd) / 2, 112);
                });
                ctx.globalAlpha = 1;
            }

            const capP = progress(f, CAPTION_START, 30);
            if (capP > 0) {
                ctx.globalAlpha = capP;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Conversion happens twice: analogue in at the ADC, analogue out again at the DAC', W / 2, 195);
                ctx.globalAlpha = 1;
            }

            // Travelling pulse — a point marker, not a persistent line (same
            // precedent as RecordingSignalFlow.js's own pulse).
            if (f >= PULSE_START) {
                const cyclePos = ((f - PULSE_START) % PULSE_PERIOD) / PULSE_PERIOD;
                const t = cyclePos < 0.5 ? cyclePos * 2 : (1 - cyclePos) * 2;
                const x0 = boxX(0) + BOX_W / 2;
                const x1 = boxX(4) + BOX_W / 2;
                const px = x0 + (x1 - x0) * t;
                ctx.fillStyle = '#14b8a6';
                ctx.beginPath();
                ctx.arc(px, midY, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            let phase = 'Round trip';
            for (let i = 0; i < PHASE_B.length; i++) {
                if (f < PHASE_B[i] + 24) { phase = stageNames[i]; break; }
            }
            if (f >= PHASE_B[4] + 24 && f < BRACKET_START) phase = 'Monitors';
            else if (f >= BRACKET_START && f < CAPTION_START) phase = 'Analogue / Digital';
            else if (f >= CAPTION_START) phase = 'Round trip';
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
