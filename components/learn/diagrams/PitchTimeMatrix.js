'use client';

import { useEffect, useRef } from 'react';

// A 3-row × 2-column table (label column + Pitch/Duration data columns), rows sourced
// directly from this row's own description — "Repitching moves speed, pitch and duration
// together... Time-stretching breaks the link one way: duration changes, pitch holds.
// Pitch-shifting breaks it the other way: pitch changes, duration holds." Reversal is a
// separate row (`reverse-swell`, its own `reverse-envelope` diagram) and is deliberately
// left out here — this table only covers what `repitch-stretch-shift` itself teaches.
// Every cell renders one of two DRAWN icons, never text glyphs: an up-arrow (teal) for
// "changes", a flat bar (grey) for "holds" — matching the brief's "ticks/crosses or
// arrows per cell".
//
// Label-clearance (AABB check): the whole table frame is confined to [70,410]×[54,204].
// Row labels sit centred in their own 140px-wide label column with >=43px clearance from
// either border. The vertical column-divider lines run the FULL table height, y=[54,204]
// (TABLE_Y0 to TABLE_Y1) — including the header row — so headers aren't missed by the
// dividers running short, they're missed on the x-axis: "Pitch" (centred x=260) sits
// >=38.75px clear of its column's dividers, and "Duration" (centred x=360, the tighter of
// the two) sits >=32px clear of its own. The closing caption sits at y=222 (18px below the
// table's bottom edge, y>204). No table-frame line is drawn outside [70,410]×[54,204], so
// none can reach the caption or the phase indicator.
export default function PitchTimeMatrix() {
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

        const TABLE_X0 = 70;
        const TABLE_X1 = 410;
        const LABEL_COL_W = 140;
        const DATA_COL_W = 100;
        const colX = {
            labelLeft: TABLE_X0,
            pitchLeft: TABLE_X0 + LABEL_COL_W,
            durLeft: TABLE_X0 + LABEL_COL_W + DATA_COL_W,
            right: TABLE_X1,
        };
        const labelCenter = TABLE_X0 + LABEL_COL_W / 2;
        const pitchCenter = colX.pitchLeft + DATA_COL_W / 2;
        const durCenter = colX.durLeft + DATA_COL_W / 2;

        const HEADER_TOP = 54;
        const ROW_H = 40;
        const rows = [
            { label: 'Repitch', pitch: 'changes', dur: 'changes', y: HEADER_TOP + 30 },
            { label: 'Time-stretch', pitch: 'holds', dur: 'changes', y: HEADER_TOP + 30 + ROW_H },
            { label: 'Pitch-shift', pitch: 'changes', dur: 'holds', y: HEADER_TOP + 30 + ROW_H * 2 },
        ];
        const TABLE_Y0 = HEADER_TOP;
        const TABLE_Y1 = HEADER_TOP + 30 + ROW_H * 3;

        const drawChangesIcon = (x, y, alpha) => {
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = '#14b8a6';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(x, y + 7);
            ctx.lineTo(x, y - 5);
            ctx.stroke();
            ctx.fillStyle = '#14b8a6';
            ctx.beginPath();
            ctx.moveTo(x, y - 9);
            ctx.lineTo(x - 4, y - 3);
            ctx.lineTo(x + 4, y - 3);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1;
        };
        const drawHoldsIcon = (x, y, alpha) => {
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = '#9ca3af';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(x - 7, y);
            ctx.lineTo(x + 7, y);
            ctx.stroke();
            ctx.globalAlpha = 1;
        };

        const PHASE_SUB = 15;
        const PHASE_FRAME = 35;
        const PHASE_HEADERS = 60;
        const rowPhase = (i) => 90 + i * 40;
        const PHASE_CAPTION = 90 + rows.length * 40 + 15;

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
            ctx.fillText('Repitch, Stretch, Shift', W / 2, 16);
            ctx.globalAlpha = 1;

            const subP = progress(f, PHASE_SUB, 20);
            if (subP > 0) {
                ctx.globalAlpha = subP;
                ctx.fillStyle = '#6b7280';
                ctx.font = 'italic 8.5px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('What changes, what holds', W / 2, 36);
                ctx.globalAlpha = 1;
            }

            const frameP = progress(f, PHASE_FRAME, 30);
            if (frameP > 0) {
                ctx.globalAlpha = frameP;
                ctx.strokeStyle = '#d1d5db';
                ctx.lineWidth = 1;
                ctx.strokeRect(TABLE_X0, TABLE_Y0, TABLE_X1 - TABLE_X0, TABLE_Y1 - TABLE_Y0);
                ctx.beginPath();
                ctx.moveTo(TABLE_X0, HEADER_TOP + 30);
                ctx.lineTo(TABLE_X1, HEADER_TOP + 30);
                ctx.stroke();
                [colX.pitchLeft, colX.durLeft].forEach((x) => {
                    ctx.beginPath();
                    ctx.moveTo(x, TABLE_Y0);
                    ctx.lineTo(x, TABLE_Y1);
                    ctx.stroke();
                });
                rows.slice(0, -1).forEach((row, i) => {
                    const rowBottom = HEADER_TOP + 30 + ROW_H * (i + 1);
                    ctx.beginPath();
                    ctx.moveTo(TABLE_X0, rowBottom);
                    ctx.lineTo(TABLE_X1, rowBottom);
                    ctx.stroke();
                });
                ctx.globalAlpha = 1;
            }

            const headP = progress(f, PHASE_HEADERS, 20);
            if (headP > 0) {
                ctx.globalAlpha = headP;
                ctx.fillStyle = '#1a1a2e';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Pitch', pitchCenter, HEADER_TOP + 19);
                ctx.fillText('Duration', durCenter, HEADER_TOP + 19);
                ctx.globalAlpha = 1;
            }

            rows.forEach((row, i) => {
                const rp = progress(f, rowPhase(i), 30);
                if (rp <= 0) return;
                ctx.globalAlpha = rp;
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(row.label, labelCenter, row.y + 4);
                ctx.globalAlpha = 1;

                if (row.pitch === 'changes') drawChangesIcon(pitchCenter, row.y, rp);
                else drawHoldsIcon(pitchCenter, row.y, rp);
                if (row.dur === 'changes') drawChangesIcon(durCenter, row.y, rp);
                else drawHoldsIcon(durCenter, row.y, rp);
            });

            const capP = progress(f, PHASE_CAPTION, 25);
            if (capP > 0) {
                ctx.globalAlpha = capP;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Repitch changes both together; stretch and shift each hold one fixed', W / 2, 222);
                ctx.globalAlpha = 1;
            }

            const phase = f < PHASE_HEADERS ? 'Table' : f < rowPhase(rows.length - 1) ? 'Filling rows' : 'Complete';
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
