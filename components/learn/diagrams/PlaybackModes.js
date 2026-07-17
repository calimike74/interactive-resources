'use client';

import { useEffect, useRef } from 'react';

// Three key-press timelines sharing ONE time axis (pxX(t), used by every bar
// in every lane, so nothing can drift out of alignment): one-shot, gated,
// loop. Time is an abstract illustrative unit 0-10 (not real ms — no clock
// value for "however briefly tapped" exists to be tractable about), disclosed
// as such via the "hold (illustrative units) ->" axis caption.
//
// Bindings: one-shot KEY=[0,1] (a brief tap) but PLAYBACK=[0,8] (plays the
// full sample regardless) — a dashed release marker at t=1 crosses through
// the extended bar to show the key lifting long before playback ends. Gated
// KEY=[0,5] and PLAYBACK=[0,5] are drawn from the identical pair, so their
// bars end at the exact same pixel by construction. Loop KEY=[0,8] and
// PLAYBACK is built from LOOP_WIDTH=2 repeated HOLD/LOOP_WIDTH=4 times
// (computed, and exact — 8/2 has no remainder), alternating shade per
// repeat so the four cycles are individually countable.
//
// Label-clearance: every bar/marker in a lane is confined to that lane's own
// y-band (e.g. lane 1: y=[52,77]); every label (lane name, caption) sits
// outside all three bands by >=6px, and the shared axis line (y=216) and its
// tick labels (y=228) sit below every bar (max bar bottom = 189) and above
// the final caption (y=250) with >=12px clearance in both directions.
export default function PlaybackModes() {
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

        const TIME_MAX = 10;
        const axisX0 = 60;
        const axisX1 = 450;
        const axisW = axisX1 - axisX0;
        const pxX = (t) => axisX0 + (t / TIME_MAX) * axisW;

        const LOOP_WIDTH = 2;
        const LOOP_HOLD = 8;
        const LOOP_REPEATS = LOOP_HOLD / LOOP_WIDTH; // 4, exact

        const LANES = [
            { name: 'One-shot', labelY: 46, keyY: 54, playY: 66, capY: 84, color: '#14b8a6', key: [0, 1], play: [0, 8], release: 1 },
            { name: 'Gated', labelY: 104, keyY: 112, playY: 124, capY: 142, color: '#e85d75', key: [0, 5], play: [0, 5], release: null },
            { name: 'Loop', labelY: 160, keyY: 168, playY: 180, capY: 198, color: '#DCC892', key: [0, 8], play: [0, 8], release: 8 },
        ];
        const barH = 9;

        const drawBar = (y, t0, t1, color, alpha) => {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = color;
            ctx.fillRect(pxX(t0), y, pxX(t1) - pxX(t0), barH);
            ctx.globalAlpha = 1;
        };

        const PHASE_AXIS = 20;
        const PHASE = {
            key: [60, 160, 250],
            play: [100, 190, 280],
            release: [85, null, 340],
            cap: [130, 220, 380],
        };
        const PHASE_FINAL = 420;

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
            ctx.fillText('One-Shot, Gated, Loop — One Time Axis', W / 2, 16);
            ctx.globalAlpha = 1;

            const axisP = progress(f, PHASE_AXIS, 30);
            if (axisP > 0) {
                ctx.globalAlpha = axisP;
                ctx.strokeStyle = '#d1d5db';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(axisX0, 216);
                ctx.lineTo(axisX1, 216);
                ctx.stroke();
                ctx.fillStyle = '#9ca3af';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                for (let t = 0; t <= TIME_MAX; t += 2) {
                    ctx.beginPath();
                    ctx.moveTo(pxX(t), 213);
                    ctx.lineTo(pxX(t), 219);
                    ctx.stroke();
                    ctx.fillText(String(t), pxX(t), 228);
                }
                ctx.fillText('hold (illustrative units) →', W / 2, 240);
                ctx.globalAlpha = 1;
            }

            LANES.forEach((lane, i) => {
                const labelP = progress(f, PHASE.key[i] - 10, 20);
                if (labelP > 0) {
                    ctx.globalAlpha = labelP;
                    ctx.fillStyle = lane.color;
                    ctx.font = 'bold 9px -apple-system, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText(lane.name, axisX0, lane.labelY);
                    ctx.globalAlpha = 1;
                }

                const keyP = progress(f, PHASE.key[i], 25);
                if (keyP > 0) {
                    const t1 = lane.key[0] + (lane.key[1] - lane.key[0]) * keyP;
                    ctx.globalAlpha = keyP;
                    ctx.fillStyle = '#374151';
                    ctx.font = '7px -apple-system, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText('key', axisX0 - 26, lane.keyY + 7);
                    ctx.globalAlpha = 1;
                    drawBar(lane.keyY, lane.key[0], t1, '#374151', keyP);
                }

                const playStart = PHASE.play[i];
                const playP = progress(f, playStart, 30);
                if (playP > 0) {
                    ctx.fillStyle = lane.color;
                    ctx.font = '7px -apple-system, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.globalAlpha = playP;
                    ctx.fillText('out', axisX0 - 22, lane.playY + 7);
                    ctx.globalAlpha = 1;

                    if (lane.name === 'Loop') {
                        for (let r = 0; r < LOOP_REPEATS; r++) {
                            const segStart = r * LOOP_WIDTH;
                            const segEnd = segStart + LOOP_WIDTH;
                            const segP = progress(f, playStart + r * 15, 20);
                            if (segP <= 0) continue;
                            const t1 = segStart + (segEnd - segStart) * segP;
                            // Odd segments drawn at reduced opacity (not a new hex) so all
                            // four repeats stay individually countable.
                            drawBar(lane.playY, segStart, t1, '#DCC892', r % 2 === 0 ? segP : segP * 0.6);
                        }
                    } else {
                        const t1 = lane.play[0] + (lane.play[1] - lane.play[0]) * playP;
                        drawBar(lane.playY, lane.play[0], t1, lane.color, playP);
                    }
                }

                if (lane.release !== null) {
                    const relP = progress(f, PHASE.release[i], 25);
                    if (relP > 0) {
                        ctx.globalAlpha = relP;
                        ctx.strokeStyle = '#DC2626';
                        ctx.lineWidth = 1;
                        ctx.setLineDash([2, 2]);
                        ctx.beginPath();
                        ctx.moveTo(pxX(lane.release), lane.keyY - 2);
                        ctx.lineTo(pxX(lane.release), lane.playY + barH + 2);
                        ctx.stroke();
                        ctx.setLineDash([]);
                        ctx.globalAlpha = 1;
                    }
                }

                const capP = progress(f, PHASE.cap[i], 25);
                if (capP > 0) {
                    ctx.globalAlpha = capP;
                    ctx.fillStyle = '#374151';
                    ctx.font = 'italic 8px -apple-system, sans-serif';
                    ctx.textAlign = 'left';
                    const captions = {
                        'One-shot': 'plays to the end however briefly tapped — ignores key-up',
                        'Gated': 'playback tracks the key exactly — release stops it',
                        'Loop': `a ${LOOP_WIDTH}-unit region repeats × ${LOOP_REPEATS} while held`,
                    };
                    ctx.fillText(captions[lane.name], axisX0, lane.capY);
                    ctx.globalAlpha = 1;
                }
            });

            const finalP = progress(f, PHASE_FINAL, 30);
            if (finalP > 0) {
                ctx.globalAlpha = finalP;
                ctx.fillStyle = '#1a1a2e';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Three answers to one question: what happens when the key comes up?', W / 2, 252);
                ctx.globalAlpha = 1;
            }

            const phase = f < PHASE.cap[0] ? 'One-shot'
                : f < PHASE.cap[1] ? 'Gated'
                : f < PHASE.cap[2] ? 'Loop'
                : 'Compare';
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
