'use client';

import { useEffect, useRef } from 'react';

// Node-link topology, deliberately simple per the brief: IN -> two combs in
// parallel -> one allpass -> OUT. Every box/port coordinate is a named constant
// (same discipline as SidechainTriggerTarget.js/PingPongCrossedFeedback.js).
//
// Label-clearance plan (checked before any line was drawn):
//   - Box labels ("IN", "COMB 1", "COMB 2", "ALLPASS", "OUT") are inside opaque
//     box fills — structurally safe, same precedent as the wave-1 exemplars.
//   - The two "delay+fb" loop labels sit at x in [160,262], y=30 (above comb1)
//     and y=163 (between comb1 and comb2, above comb2). Every signal line with
//     x < 240 only exists at y=121 (fan-out mid) or the vertical run at x=110 —
//     neither reaches x>=160, so the loop labels never intersect a fan-out line.
//     Every signal line with x >= 240 (comb->allpass) only exists at y in
//     {60,116,188,132} plus the x=290 vertical runs — none of those y-values are
//     within 15px of y=30 or y=163, so the loop labels are clear of those too.
//   - The single dynamic caption sits at y=226 — comb2's box bottom is y=204,
//     22px clear; every line/port lives at y<=204.
export default function CombAllpassNetwork() {
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

        const inBox = { x: 20, y: 106, w: 60, h: 30 };
        const comb1 = { x: 150, y: 44, w: 90, h: 32 };
        const comb2 = { x: 150, y: 172, w: 90, h: 32 };
        const allpass = { x: 330, y: 107, w: 90, h: 34 };
        const outBox = { x: 430, y: 109, w: 40, h: 30 };

        const inMidY = inBox.y + inBox.h / 2; // 121
        const comb1MidY = comb1.y + comb1.h / 2; // 60
        const comb2MidY = comb2.y + comb2.h / 2; // 188
        const allpassMidY = allpass.y + allpass.h / 2; // 124
        const outMidY = outBox.y + outBox.h / 2; // 124
        const elbow1X = 110;
        const elbow2X = 290;
        const allpassInTop = allpassMidY - 8; // 116
        const allpassInBot = allpassMidY + 8; // 132

        const drawBox = (b, label, sub, stroke, alpha) => {
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
            ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2 + (sub ? -2 : 3));
            if (sub) {
                ctx.font = '7px -apple-system, sans-serif';
                ctx.fillStyle = '#6b7280';
                ctx.fillText(sub, b.x + b.w / 2, b.y + b.h / 2 + 10);
            }
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

        const PHASE_IN = 20;
        const PHASE_FANOUT = 55;
        const PHASE_COMBS = 55;
        const PHASE_LOOPS = 100;
        const PHASE_TOALLPASS = 150;
        const PHASE_ALLPASS = 150;
        const PHASE_TOOUT = 210;
        const PHASE_OUT = 210;
        const PHASE_CLOSE = 320;

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
            ctx.fillText('Algorithmic Reverb — Comb Filters, Then Allpass', W / 2, 16);
            ctx.globalAlpha = 1;

            const pIn = progress(f, PHASE_IN, 25);
            if (pIn > 0) drawBox(inBox, 'IN', null, '#374151', pIn);

            const pFan = progress(f, PHASE_FANOUT, 35);
            if (pFan > 0) {
                ctx.globalAlpha = pFan;
                ctx.strokeStyle = '#374151';
                ctx.lineWidth = 1.4;
                path([[inBox.x + inBox.w, inMidY], [elbow1X, inMidY]]);
                path([[elbow1X, inMidY], [elbow1X, comb1MidY], [comb1.x, comb1MidY]]);
                path([[elbow1X, inMidY], [elbow1X, comb2MidY], [comb2.x, comb2MidY]]);
                ctx.globalAlpha = 1;
            }

            const pCombs = progress(f, PHASE_COMBS, 35);
            if (pCombs > 0) {
                drawBox(comb1, 'COMB 1', null, '#14b8a6', pCombs);
                drawBox(comb2, 'COMB 2', null, '#14b8a6', pCombs);
            }

            // Feedback-loop brackets — 3-segment path above each comb box, well
            // clear of the title above and the fan-out lines below (see header note).
            const pLoops = progress(f, PHASE_LOOPS, 30);
            if (pLoops > 0) {
                ctx.globalAlpha = pLoops;
                ctx.strokeStyle = '#f97316';
                ctx.lineWidth = 1.3;
                path([[170, 44], [170, 32], [215, 32], [215, 44]]);
                arrowHead(215, 44, 0, 4, '#f97316');
                path([[170, 172], [170, 160], [215, 160], [215, 172]]);
                arrowHead(215, 172, 0, 4, '#f97316');
                ctx.globalAlpha = 1;
                ctx.font = '7px -apple-system, sans-serif';
                ctx.fillStyle = '#f97316';
                ctx.textAlign = 'left';
                ctx.globalAlpha = pLoops;
                ctx.fillText('delay+fb', 222, 35);
                ctx.fillText('delay+fb', 222, 163);
                ctx.globalAlpha = 1;
            }

            const pToAllpass = progress(f, PHASE_TOALLPASS, 40);
            if (pToAllpass > 0) {
                ctx.globalAlpha = pToAllpass;
                ctx.strokeStyle = '#14b8a6';
                ctx.lineWidth = 1.5;
                path([[comb1.x + comb1.w, comb1MidY], [elbow2X, comb1MidY], [elbow2X, allpassInTop], [allpass.x, allpassInTop]]);
                arrowHead(allpass.x, allpassInTop, 5, 0, '#14b8a6');
                path([[comb2.x + comb2.w, comb2MidY], [elbow2X, comb2MidY], [elbow2X, allpassInBot], [allpass.x, allpassInBot]]);
                arrowHead(allpass.x, allpassInBot, 5, 0, '#14b8a6');
                ctx.globalAlpha = 1;
            }

            const pAllpass = progress(f, PHASE_ALLPASS, 35);
            if (pAllpass > 0) drawBox(allpass, 'ALLPASS', 'smears dense', '#e85d75', pAllpass);

            const pToOut = progress(f, PHASE_TOOUT, 30);
            if (pToOut > 0) {
                ctx.globalAlpha = pToOut;
                ctx.strokeStyle = '#e85d75';
                ctx.lineWidth = 1.6;
                path([[allpass.x + allpass.w, allpassMidY], [outBox.x, outMidY]]);
                arrowHead(outBox.x, outMidY, 5, 0, '#e85d75');
                ctx.globalAlpha = 1;
            }
            const pOut = progress(f, PHASE_OUT, 30);
            if (pOut > 0) drawBox(outBox, 'OUT', null, '#374151', pOut);

            // Travelling dots: two in parallel through the combs, one onward to allpass/out
            if (f >= PHASE_TOALLPASS + 40 && f < PHASE_CLOSE) {
                const period = 90;
                const cyclePos = ((f - PHASE_TOALLPASS - 40) % period) / period;
                const legs1 = [
                    { from: [comb1.x + comb1.w, comb1MidY], to: [elbow2X, comb1MidY] },
                    { from: [elbow2X, comb1MidY], to: [elbow2X, allpassInTop] },
                    { from: [elbow2X, allpassInTop], to: [allpass.x, allpassInTop] },
                ];
                const legs2 = [
                    { from: [comb2.x + comb2.w, comb2MidY], to: [elbow2X, comb2MidY] },
                    { from: [elbow2X, comb2MidY], to: [elbow2X, allpassInBot] },
                    { from: [elbow2X, allpassInBot], to: [allpass.x, allpassInBot] },
                ];
                [legs1, legs2].forEach((legs) => {
                    const legPos = cyclePos * legs.length;
                    const legIdx = Math.min(legs.length - 1, Math.floor(legPos));
                    const localT = legPos - legIdx;
                    const leg = legs[legIdx];
                    const dx = leg.from[0] + (leg.to[0] - leg.from[0]) * localT;
                    const dy = leg.from[1] + (leg.to[1] - leg.from[1]) * localT;
                    ctx.fillStyle = '#14b8a6';
                    ctx.beginPath();
                    ctx.arc(dx, dy, 2.6, 0, Math.PI * 2);
                    ctx.fill();
                });
            }

            let caption = '';
            let captionStart = 0;
            if (f >= PHASE_CLOSE) {
                caption = 'Comb builds the echoes; allpass fuses them into a tail';
                captionStart = PHASE_CLOSE;
            } else if (f >= PHASE_TOOUT + 15) {
                caption = 'Both echo trains feed one allpass filter, which smears them dense';
                captionStart = PHASE_TOOUT + 15;
            } else if (f >= PHASE_LOOPS + 20) {
                caption = "Each comb's delay+feedback loop builds a decaying echo train";
                captionStart = PHASE_LOOPS + 20;
            } else if (f >= PHASE_FANOUT + 15) {
                caption = 'Signal splits into two comb filters, each recirculating short delays';
                captionStart = PHASE_FANOUT + 15;
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

            const phase = f < PHASE_COMBS ? 'Split'
                : f < PHASE_TOALLPASS ? 'Recirculating'
                : f < PHASE_TOOUT ? 'Allpass'
                : 'Out';
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
