'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: axes + ticks → −60 dB gridline → small-room decay line + marker →
// hall decay line + marker → caption comparing the two.
//
// Geometry discipline copies CompressorTransferCurve.js exactly: levelAt(t, RT60) = −60·t/RT60
// is the single source of truth (linear in dB — the "straight falling line" the row text
// describes). Each line's −60 dB marker sits at t = RT60 BY CONSTRUCTION (levelAt(RT60, RT60)
// === −60 always), never a placed guess. Each line is drawn only up to the time where it
// crosses the DB_MIN gridline, so a short RT60 doesn't overshoot the chart.
//
// RT60 = 0.4 s (small room) and RT60 = 1.8 s (hall) are not invented — they are the exact
// values documented for the verb-room and verb-hall audio presets (wave-2 chapter-maps spec,
// "Audio presets" section), so the diagram matches the row's own audio example precisely.
export default function Rt60DecayCurve() {
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

        const T_MAX = 2.2;
        const DB_MIN = -70;
        const DB_MAX = 4;
        const DB_SPAN = DB_MAX - DB_MIN;

        const pxX = (t) => originX + (t / T_MAX) * plotW;
        const dbFrac = (db) => (db - DB_MIN) / DB_SPAN;
        const pxY = (db) => originY - dbFrac(db) * plotH;

        // Single source of truth: a straight falling line in dB space.
        const levelAt = (t, rt60) => -60 * t / rt60;
        // Where each line crosses the bottom of the chart — so a fast decay doesn't overshoot.
        const timeAtLevel = (db, rt60) => (db * rt60) / -60;

        // labelT differs per room (rather than both anchored at their shared t=0 start) so the
        // two inline labels never land on top of each other.
        const ROOMS = [
            { rt60: 0.4, color: '#14b8a6', label: 'Small room', labelT: 0.08, markerLabel: 'RT60 = 0.4 s' },
            { rt60: 1.8, color: '#e85d75', label: 'Hall', labelT: 0.9, markerLabel: 'RT60 = 1.8 s' },
        ];
        ROOMS.forEach((room) => {
            room.tEnd = Math.min(T_MAX, timeAtLevel(DB_MIN, room.rt60));
        });

        const Y_TICKS = [0, -20, -40, -60];
        const X_TICKS = [0, 0.5, 1.0, 1.5, 2.0];

        const PHASE_AXES = 10;
        const PHASE_TICKS = 40;
        const PHASE_GRIDLINE = 90;
        const PHASE_ROOM0 = 140;
        const PHASE_ROOM1 = 280;
        const PHASE_CAPTION = 420;

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
            ctx.fillText('RT60: Time to Fall 60 dB', W / 2, 16);
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
                ctx.fillText('Time (s)', originX + plotW / 2, originY + 41);
                ctx.save();
                ctx.translate(12, margin.top + plotH / 2);
                ctx.rotate(-Math.PI / 2);
                ctx.fillText('Level (dB)', 0, 0);
                ctx.restore();

                ctx.font = '8px -apple-system, sans-serif';
                X_TICKS.forEach((t) => {
                    ctx.textAlign = 'center';
                    ctx.fillText(t.toFixed(1), pxX(t), originY + 12);
                });
                Y_TICKS.forEach((db) => {
                    ctx.textAlign = 'right';
                    ctx.fillText(`${db}`, originX - 6, pxY(db) + 3);
                });
                ctx.globalAlpha = 1;
            }

            // −60 dB gridline
            const gridP = progress(f, PHASE_GRIDLINE, 30);
            if (gridP > 0) {
                ctx.globalAlpha = gridP;
                ctx.strokeStyle = '#9ca3af';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(originX, pxY(-60));
                ctx.lineTo(originX + plotW, pxY(-60));
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = '#9ca3af';
                ctx.font = 'bold 8px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('−60 dB', originX + plotW - 44, pxY(-60) - 5);
                ctx.globalAlpha = 1;
            }

            // Room decay lines
            [
                { room: ROOMS[0], phaseStart: PHASE_ROOM0 },
                { room: ROOMS[1], phaseStart: PHASE_ROOM1 },
            ].forEach(({ room, phaseStart }) => {
                const p = progress(f, phaseStart, 100);
                if (p <= 0) return;
                ctx.globalAlpha = p;
                const endT = p * room.tEnd;
                ctx.strokeStyle = room.color;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(pxX(0), pxY(levelAt(0, room.rt60)));
                ctx.lineTo(pxX(endT), pxY(levelAt(endT, room.rt60)));
                ctx.stroke();

                if (p >= 0.999) {
                    const labelT = Math.min(room.labelT, room.tEnd);
                    ctx.fillStyle = room.color;
                    ctx.font = 'bold 9px -apple-system, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText(room.label, pxX(labelT) + 4, pxY(levelAt(labelT, room.rt60)) - 6);
                }
                ctx.globalAlpha = 1;

                // Marker at t = RT60, computed from the same levelAt() function.
                if (p >= 0.999 && room.rt60 <= room.tEnd) {
                    const mx = pxX(room.rt60);
                    const my = pxY(levelAt(room.rt60, room.rt60));
                    ctx.strokeStyle = room.color;
                    ctx.lineWidth = 1;
                    ctx.setLineDash([2, 3]);
                    ctx.beginPath();
                    ctx.moveTo(mx, my);
                    ctx.lineTo(mx, originY);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    ctx.fillStyle = room.color;
                    ctx.beginPath();
                    ctx.arc(mx, my, 3.5, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.font = 'bold 8px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(room.markerLabel, mx, my + 14 > originY - 10 ? my - 10 : my + 14);
                }
            });

            // --- Caption ---
            const capP = progress(f, PHASE_CAPTION, 30);
            if (capP > 0) {
                ctx.globalAlpha = capP;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Small room and hall both fall 60 dB: the hall just takes over four times longer', W / 2, H - 8);
                ctx.globalAlpha = 1;
            }

            // Phase indicator
            const phase = f < PHASE_ROOM0 ? 'Axes'
                : f < PHASE_ROOM1 ? 'Small room'
                : f < PHASE_CAPTION ? 'Hall'
                : 'Compare';
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
