'use client';

import { useEffect, useRef } from 'react';

// Four boxes in series — DRIVE, TONE, LEVEL, MIX — connector arrows only in
// the horizontal gap between adjacent boxes, same layout discipline as
// SynthSignalFlow.js (the closest existing sibling for a linear process
// chain).
//
// Node-link label clearance (AABB vs segment), verified algebraically, not
// just by eye: with startX=39, boxW=84, gap=22, the four box x-ranges are
// [39,123], [145,229], [251,335], [357,441] and the three connector-arrow
// x-ranges are exactly the complementary gaps [123,145], [229,251],
// [335,357] — each arrow is drawn as a single horizontal segment confined to
// its own gap range, at fixed y = chainY + boxH/2 (never inside a box's
// y-range's label row). Every label (box title, sub-label, mini-icon) is
// drawn ONLY inside its own box's x-range, on top of that box's opaque white
// fill. Box x-ranges and gap x-ranges are disjoint by construction (the gap
// arithmetic is box.x + boxW to nextBox.x, with no overlap), so no
// connector segment's path can ever intersect a label's bounding box, at any
// frame — reveal is alpha-only, no box or arrow ever changes position, so
// this containment holds at every animation extreme (frame 0 through the
// fully-revealed hold and the closing fade).
//
// Mini-icon curves (DRIVE's clipped sine, TONE's low-pass roll-off) are
// computed live from the same softClip/lowpass formulas used elsewhere in
// this topic's diagrams/audio, not hardcoded point arrays.
export default function DriveToneLevelChain() {
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

        const CYCLE = 620;
        let animId;

        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);
        const drawRR = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };

        const SOFT_K = 4; // matches DIST_DRIVE_FIXED_K in lib/learn/audio-presets.js
        const softClip = (x) => ((1 + SOFT_K) * x) / (1 + SOFT_K * Math.abs(x));

        const chainY = 100;
        const boxW = 84;
        const boxH = 64;
        const gap = 22;
        const totalW = 4 * boxW + 3 * gap;
        const startX = (W - totalW) / 2;

        const stages = [
            { label: 'DRIVE', sub: 'Push harder in', x: startX, frame: 30, icon: 'drive' },
            { label: 'TONE', sub: 'Shape the edge', x: startX + boxW + gap, frame: 110, icon: 'tone' },
            { label: 'LEVEL', sub: 'Compensate', x: startX + 2 * (boxW + gap), frame: 190, icon: 'level' },
            { label: 'MIX', sub: 'Blend the dry', x: startX + 3 * (boxW + gap), frame: 270, icon: 'mix' },
        ];

        const COLOR = '#1a1a2e';

        const draw = () => {
            frameRef.current = (frameRef.current + 0.6) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            const titleP = progress(f, 0, 20);
            ctx.globalAlpha = titleP;
            ctx.fillStyle = COLOR;
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Drive → Tone → Level → Mix', W / 2, 18);
            ctx.globalAlpha = 1;

            const flowP = progress(f, 20, 20);
            if (flowP > 0) {
                ctx.globalAlpha = flowP;
                ctx.fillStyle = '#9ca3af';
                ctx.font = '9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Signal flow  →', W / 2, chainY - 10);
                ctx.globalAlpha = 1;
            }

            stages.forEach((stage, i) => {
                const sp = progress(f, stage.frame, 35);
                if (sp <= 0) return;
                ctx.globalAlpha = sp;

                ctx.fillStyle = '#fff';
                ctx.strokeStyle = COLOR;
                ctx.lineWidth = 1.5;
                drawRR(stage.x, chainY, boxW, boxH, 6);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = COLOR;
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(stage.label, stage.x + boxW / 2, chainY + 18);

                ctx.fillStyle = '#6b7280';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.fillText(stage.sub, stage.x + boxW / 2, chainY + 32);

                // Mini visual per stage
                const miniY = chainY + 40;
                const miniW = boxW - 16;
                const miniH = 16;
                const miniX = stage.x + 8;

                ctx.strokeStyle = COLOR;
                ctx.lineWidth = 1;

                if (stage.icon === 'drive') {
                    // Clipped sine, computed from the same softClip formula ClippingShapes uses.
                    ctx.beginPath();
                    for (let px = 0; px <= miniW; px++) {
                        const t = px / miniW;
                        const raw = 1.4 * Math.sin(t * 2 * Math.PI * 2);
                        const y = miniY + miniH / 2 - softClip(raw) * (miniH * 0.42);
                        if (px === 0) ctx.moveTo(miniX + px, y);
                        else ctx.lineTo(miniX + px, y);
                    }
                    ctx.stroke();
                } else if (stage.icon === 'tone') {
                    // Low-pass roll-off curve, same shape family as SynthSignalFlow's FILTER icon.
                    ctx.beginPath();
                    for (let px = 0; px <= miniW; px++) {
                        const nx = px / miniW;
                        const gain = nx < 0.5 ? 1 : 1 / (1 + Math.pow((nx - 0.5) * 8, 2));
                        const y = miniY + miniH - gain * miniH * 0.85;
                        if (px === 0) ctx.moveTo(miniX + px, y);
                        else ctx.lineTo(miniX + px, y);
                    }
                    ctx.stroke();
                } else if (stage.icon === 'level') {
                    // Three ascending bars — a simple, decorative "gain" glyph.
                    const barW = miniW / 5;
                    [0.4, 0.7, 1.0].forEach((h, bi) => {
                        const bx = miniX + bi * barW * 1.6;
                        const bh = miniH * h;
                        ctx.fillStyle = COLOR;
                        ctx.fillRect(bx, miniY + miniH - bh, barW, bh);
                    });
                } else {
                    // Two overlapping triangles converging — a simple, decorative "blend" glyph.
                    ctx.fillStyle = 'rgba(26, 26, 46, 0.55)';
                    ctx.beginPath();
                    ctx.moveTo(miniX, miniY);
                    ctx.lineTo(miniX + miniW * 0.65, miniY + miniH / 2);
                    ctx.lineTo(miniX, miniY + miniH);
                    ctx.fill();
                    ctx.fillStyle = 'rgba(20, 184, 166, 0.55)';
                    ctx.beginPath();
                    ctx.moveTo(miniX + miniW, miniY);
                    ctx.lineTo(miniX + miniW * 0.35, miniY + miniH / 2);
                    ctx.lineTo(miniX + miniW, miniY + miniH);
                    ctx.fill();
                }

                // Arrow to next stage — confined strictly to the gap x-range.
                if (i < stages.length - 1) {
                    const arrowP = progress(f, stage.frame + 20, 20);
                    if (arrowP > 0) {
                        ctx.globalAlpha = arrowP;
                        const ax1 = stage.x + boxW;
                        const ax2 = stages[i + 1].x;
                        const ay = chainY + boxH / 2;

                        ctx.strokeStyle = '#9ca3af';
                        ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        ctx.moveTo(ax1 + 2, ay);
                        ctx.lineTo(ax2 - 2, ay);
                        ctx.stroke();

                        ctx.fillStyle = '#9ca3af';
                        ctx.beginPath();
                        ctx.moveTo(ax2 - 2, ay);
                        ctx.lineTo(ax2 - 7, ay - 3);
                        ctx.lineTo(ax2 - 7, ay + 3);
                        ctx.fill();
                    }
                }

                ctx.globalAlpha = 1;
            });

            const capP = progress(f, 340, 30);
            if (capP > 0) {
                ctx.globalAlpha = capP;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Drive clips it, tone shapes it, level fixes the volume,', W / 2, 200);
                ctx.fillText('mix blends the distorted signal back against the dry original', W / 2, 213);
                ctx.globalAlpha = 1;
            }

            const phase = f < 110 ? 'Drive' : f < 190 ? 'Tone' : f < 270 ? 'Level' : f < 340 ? 'Mix' : 'Complete';
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
