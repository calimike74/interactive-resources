'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: KICK and BASS boxes appear → COMPRESSOR box appears with a
// key-input port → a dashed detector line runs from KICK to the key input (mustard,
// with a travelling dot) → a solid signal line runs BASS → compressor → an output box,
// dipping when the detector dot arrives → captions name trigger/target BELOW their own
// boxes (never on the connector paths themselves, so no label is ever crossed by a line).
export default function SidechainTriggerTarget() {
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
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);

        // --- Fixed layout — every box, port and label position is a named constant so
        // the routing (drawn below) and the label placement (drawn separately, always
        // offset away from any path) can be reasoned about independently. ---
        const kick = { x: 20, y: 46, w: 90, h: 30 };
        const bass = { x: 20, y: 158, w: 90, h: 30 };
        const comp = { x: 195, y: 96, w: 110, h: 88 };
        const out = { x: 388, y: 158, w: 92, h: 30 };

        const keyInPort = { x: comp.x + comp.w * 0.3, y: comp.y };
        const audioInY = comp.y + comp.h * 0.62;
        const audioOutPort = { x: comp.x + comp.w, y: comp.y + comp.h * 0.62 };

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

        const draw = () => {
            frameRef.current = (frameRef.current + 1) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            const titleP = progress(f, 0, 20);
            ctx.globalAlpha = titleP;
            ctx.fillStyle = '#1a1a6e';
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('The Side-chain: Trigger & Target', W / 2, 16);
            ctx.globalAlpha = 1;

            // --- Phase 1: KICK + BASS boxes ---
            const p1 = progress(f, 20, 30);
            if (p1 > 0) {
                drawBox(kick, 'KICK', null, '#9B7530', p1);
                drawBox(bass, 'BASS', null, '#e85d75', p1);
            }
            const capP1 = progress(f, 50, 30);
            if (capP1 > 0) {
                ctx.globalAlpha = capP1;
                ctx.fillStyle = '#9B7530';
                ctx.font = 'bold 8px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('trigger: what the compressor listens to', kick.x, kick.y + kick.h + 14);
                ctx.fillStyle = '#e85d75';
                ctx.fillText('target: what gets turned down', bass.x, bass.y + bass.h + 14);
                ctx.globalAlpha = 1;
            }

            // --- Phase 2: COMPRESSOR box ---
            const p2 = progress(f, 90, 30);
            if (p2 > 0) {
                drawBox(comp, 'COMPRESSOR', 'on BASS', '#374151', p2);
                ctx.globalAlpha = p2;
                ctx.fillStyle = '#9B7530';
                ctx.font = '7px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('key in', keyInPort.x + 8, keyInPort.y - 4);
                ctx.globalAlpha = 1;
            }

            // --- Phase 3: dashed detector path, KICK -> key input ---
            // Two legs only: horizontal at the kick's own mid-height (y=61, well above
            // the "trigger"/"target" captions at y≈83-90/194-202), then straight down
            // into the key-input port at x=228 — a column the captions never reach
            // (their text stops at x≤192), so this path can never cross a label.
            const p3 = progress(f, 140, 50);
            if (p3 > 0) {
                ctx.globalAlpha = p3;
                ctx.strokeStyle = '#9B7530';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([4, 3]);
                ctx.beginPath();
                ctx.moveTo(kick.x + kick.w, kick.y + kick.h / 2);
                ctx.lineTo(keyInPort.x, kick.y + kick.h / 2);
                ctx.lineTo(keyInPort.x, keyInPort.y);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.globalAlpha = 1;
            }

            // Travelling dot on the detector path
            if (f >= 200 && f < 340) {
                const cyclePos = ((f - 200) % 60) / 60;
                const legs = [
                    { from: [kick.x + kick.w, kick.y + kick.h / 2], to: [keyInPort.x, kick.y + kick.h / 2] },
                    { from: [keyInPort.x, kick.y + kick.h / 2], to: [keyInPort.x, keyInPort.y] },
                ];
                const legPos = cyclePos * legs.length;
                const legIdx = Math.min(legs.length - 1, Math.floor(legPos));
                const localT = legPos - legIdx;
                const leg = legs[legIdx];
                const dx = leg.from[0] + (leg.to[0] - leg.from[0]) * localT;
                const dy = leg.from[1] + (leg.to[1] - leg.from[1]) * localT;
                ctx.fillStyle = '#9B7530';
                ctx.beginPath();
                ctx.arc(dx, dy, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            // --- Phase 4: solid audio path, BASS -> compressor -> OUT ---
            const p4 = progress(f, 240, 50);
            if (p4 > 0) {
                ctx.globalAlpha = p4;
                ctx.strokeStyle = '#e85d75';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(bass.x + bass.w, bass.y + bass.h / 2);
                ctx.lineTo(comp.x, audioInY);
                ctx.stroke();

                drawBox(out, 'BASS', 'ducked', '#e85d75', p4);
                ctx.beginPath();
                ctx.moveTo(audioOutPort.x, audioOutPort.y);
                ctx.lineTo(out.x, out.y + out.h / 2);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            // Gain-reduction dip on the compressor box, synced to the detector dot arriving
            if (f >= 200 && f < 340) {
                const cyclePos = ((f - 200) % 60) / 60;
                if (cyclePos > 0.75) {
                    const dipP = (cyclePos - 0.75) / 0.25;
                    ctx.globalAlpha = Math.sin(dipP * Math.PI);
                    ctx.fillStyle = '#DC2626';
                    ctx.font = 'bold 8px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('gain ↓', comp.x + comp.w / 2, comp.y + comp.h - 10);
                    ctx.globalAlpha = 1;
                }
            }

            const closingP = progress(f, 400, 40);
            if (closingP > 0) {
                ctx.globalAlpha = closingP;
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Trigger and target are different signals: that\'s the side-chain', W / 2, H - 8);
                ctx.globalAlpha = 1;
            }

            const phase = f < 90 ? 'Tracks' : f < 140 ? 'Compressor' : f < 240 ? 'Trigger' : f < 400 ? 'Target' : 'Side-chain';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - 20, 16);

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

    return (
        <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', borderRadius: '0.75rem' }}
        />
    );
}
