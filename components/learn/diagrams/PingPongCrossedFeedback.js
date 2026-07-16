'use client';

import { useEffect, useRef } from 'react';

// Node-link routing diagram: MONO IN splits into two delay lines (DELAY L / DELAY R) →
// each line's own output feeds its own OUT L / OUT R (panned hard to that side) →
// the credited mechanism: an X-shaped crossed-feedback pair between the two delay
// boxes — DELAY L's output feeds DELAY R's input, DELAY R's output feeds DELAY L's
// input — with a travelling dot showing the loop is live, not static routing.
//
// All box/port coordinates are named constants (same discipline as
// SidechainTriggerTarget.js). Every connector is Manhattan-routed (or, for the
// feedback pair, a deliberate diagonal X) so its bounding rectangle is easy to state
// exactly; the single external caption row sits at y>=217, and every connector's
// bounding rectangle tops out at y<=204 (the lowest box edge) — a uniform 13px
// vertical clearance that makes any caption/connector intersection impossible
// regardless of horizontal position. In-box labels (MONO IN, DELAY L, DELAY R,
// OUT L, OUT R) are excluded from the check as structurally safe: every connector
// terminates exactly at a box boundary and never enters a box's interior, where the
// box's own opaque fill would mask any incidental overlap anyway (same precedent as
// SidechainTriggerTarget's "key in"/box-interior labels). See task-10-report.md for
// the numeric verification.
export default function PingPongCrossedFeedback() {
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

        const CYCLE = 520;
        let animId;

        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) =>
            clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);

        // --- Fixed layout — every box/port position is a named constant. ---
        const monoIn = { x: 20, y: 106, w: 65, h: 30 };
        const delayL = { x: 168, y: 44, w: 96, h: 32 };
        const delayR = { x: 168, y: 172, w: 96, h: 32 };
        const outL = { x: 378, y: 44, w: 82, h: 32 };
        const outR = { x: 378, y: 172, w: 82, h: 32 };
        const elbowX = 125;
        const monoInY = monoIn.y + monoIn.h / 2; // 121
        const delayLY = delayL.y + delayL.h / 2; // 60
        const delayRY = delayR.y + delayR.h / 2; // 188

        const drawBox = (b, label, stroke, alpha) => {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = stroke;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.roundRect(b.x, b.y, b.w, b.h, 5);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = stroke;
            ctx.font = 'bold 9px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2 + 3);
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

        const PHASE_MONO = 20;
        const PHASE_SPLIT = 60;
        const PHASE_OUT = 150;
        const PHASE_FEEDBACK = 240;
        const PHASE_CLOSE = 360;

        const draw = () => {
            frameRef.current = (frameRef.current + 1) % CYCLE;
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
            ctx.fillText('Ping-Pong — two delay lines, crossed feedback', W / 2, 16);
            ctx.globalAlpha = 1;

            // --- Phase 1: MONO IN ---
            const p1 = progress(f, PHASE_MONO, 25);
            if (p1 > 0) drawBox(monoIn, 'MONO IN', '#374151', p1);

            // --- Phase 2: split trunk + branches, DELAY L / DELAY R boxes ---
            const p2 = progress(f, PHASE_SPLIT, 35);
            if (p2 > 0) {
                ctx.globalAlpha = p2;
                ctx.strokeStyle = '#374151';
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.moveTo(monoIn.x + monoIn.w, monoInY);
                ctx.lineTo(elbowX, monoInY);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(elbowX, monoInY);
                ctx.lineTo(elbowX, delayLY);
                ctx.lineTo(delayL.x, delayLY);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(elbowX, monoInY);
                ctx.lineTo(elbowX, delayRY);
                ctx.lineTo(delayR.x, delayRY);
                ctx.stroke();
                ctx.globalAlpha = 1;

                drawBox(delayL, 'DELAY L', '#14b8a6', p2);
                drawBox(delayR, 'DELAY R', '#14b8a6', p2);
            }

            // --- Phase 3: DELAY -> OUT lines + OUT boxes ---
            const p3 = progress(f, PHASE_OUT, 35);
            if (p3 > 0) {
                ctx.globalAlpha = p3;
                ctx.strokeStyle = '#14b8a6';
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                ctx.moveTo(delayL.x + delayL.w, delayLY);
                ctx.lineTo(outL.x, delayLY);
                ctx.stroke();
                arrowHead(outL.x, delayLY, 5, 0, '#14b8a6');
                ctx.beginPath();
                ctx.moveTo(delayR.x + delayR.w, delayRY);
                ctx.lineTo(outR.x, delayRY);
                ctx.stroke();
                arrowHead(outR.x, delayRY, 5, 0, '#14b8a6');
                ctx.globalAlpha = 1;

                drawBox(outL, 'OUT L', '#f97316', p3);
                drawBox(outR, 'OUT R', '#f97316', p3);
            }

            // --- Phase 4: crossed feedback X between the two delay lines ---
            const p4 = progress(f, PHASE_FEEDBACK, 40);
            const legA = { from: [delayL.x + 20, delayL.y + delayL.h], to: [delayR.x + 76, delayR.y] };
            const legB = { from: [delayR.x + 20, delayR.y], to: [delayL.x + 76, delayL.y + delayL.h] };
            if (p4 > 0) {
                ctx.globalAlpha = p4;
                ctx.strokeStyle = '#f97316';
                ctx.lineWidth = 1.6;
                ctx.setLineDash([4, 3]);
                [legA, legB].forEach((leg) => {
                    ctx.beginPath();
                    ctx.moveTo(leg.from[0], leg.from[1]);
                    ctx.lineTo(leg.to[0], leg.to[1]);
                    ctx.stroke();
                });
                ctx.setLineDash([]);
                arrowHead(legA.to[0], legA.to[1], 5, 4, '#f97316');
                arrowHead(legB.to[0], legB.to[1], -5, 4, '#f97316');
                ctx.globalAlpha = 1;
            }

            // Travelling dot on the feedback loop (alternates legA / legB)
            if (f >= PHASE_FEEDBACK + 40) {
                const cyclePos = ((f - PHASE_FEEDBACK - 40) % 90) / 90;
                const leg = cyclePos < 0.5 ? legA : legB;
                const t = cyclePos < 0.5 ? cyclePos * 2 : (cyclePos - 0.5) * 2;
                const dx = leg.from[0] + (leg.to[0] - leg.from[0]) * t;
                const dy = leg.from[1] + (leg.to[1] - leg.from[1]) * t;
                ctx.fillStyle = '#f97316';
                ctx.beginPath();
                ctx.arc(dx, dy, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            // --- Single dynamic caption row (y >= 217, clear of every connector) ---
            let caption = '';
            let captionStart = 0;
            if (f >= PHASE_CLOSE) {
                caption = 'A single delay panned one way has no crossed feedback';
                captionStart = PHASE_CLOSE;
            } else if (f >= PHASE_FEEDBACK + 20) {
                caption = "Feedback paths cross: L feeds R's input, R feeds L's input";
                captionStart = PHASE_FEEDBACK + 20;
            } else if (f >= PHASE_OUT + 20) {
                caption = "Each line's output pans hard to its own side";
                captionStart = PHASE_OUT + 20;
            } else if (f >= PHASE_MONO + 20) {
                caption = 'Mono input splits to two delay lines';
                captionStart = PHASE_MONO + 20;
            }
            if (caption) {
                const capP = progress(f, captionStart, 20);
                ctx.globalAlpha = capP;
                ctx.fillStyle = '#1a1a2e';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(caption, W / 2, 226);
                ctx.globalAlpha = 1;
            }

            // Phase indicator
            const phase = f < PHASE_SPLIT ? 'Mono in'
                : f < PHASE_OUT ? 'Split'
                : f < PHASE_FEEDBACK ? 'Panned out'
                : f < PHASE_CLOSE ? 'Crossed feedback'
                : 'Not ping-pong';
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
