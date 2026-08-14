'use client';

import { useEffect, useRef } from 'react';

// Three boxes in series — STATUS, DATA 1, DATA 2 — same layout discipline as
// DriveToneLevelChain.js (the closest existing sibling for a linear,
// labelled-box process chain), reduced from four boxes to three.
//
// Node-link label clearance (AABB vs segment), verified algebraically, not
// just by eye: with startX=30, boxW=120, gap=30, the three box x-ranges are
// [30,150], [180,300], [330,450] and the two connector-arrow x-ranges are
// exactly the complementary gaps [150,180] and [300,330] — each arrow is a
// single horizontal segment confined to its own gap range, at fixed
// y = chainY + boxH/2 (inside every box's vertical mid, never on a label
// row). Every label (box title, role line, value line, per-box caption) is
// drawn ONLY inside its own box's x-range, centred, on top of that box's
// opaque white fill. Box x-ranges and gap x-ranges are disjoint by
// construction (gap = box.x + boxW to nextBox.x, zero overlap), so no
// connector segment's path can ever intersect a label's bounding box, at any
// frame — reveal is alpha-only, no box or arrow ever changes position, so
// this containment holds at every animation extreme (frame 0 through the
// fully-revealed hold and the closing fade).
//
// Invented illustrative values (disclosed in the w3-task-4 report): the
// worked example is Note On, Channel 1, note number 60 (Middle C), velocity
// 100 — chosen for teaching clarity (a familiar note name, a "confident but
// not maximum" velocity), not drawn from any real recorded performance.
// Neither named source (MIDIBinaryAssessment.jsx, MIDIPitchBendController.jsx)
// gives a Note On status-byte hex value, so none is shown here — only the
// architecture (status byte, then two data bytes) both sources establish.
export default function MidiMessageAnatomy() {
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

        const chainY = 82;
        const boxW = 120;
        const boxH = 78;
        const gap = 30;
        const totalW = 3 * boxW + 2 * gap;
        const startX = (W - totalW) / 2;

        const COLOR = '#1a1a2e';

        const boxes = [
            {
                label: 'STATUS',
                role: 'says WHAT happened',
                lines: ['Note On', 'Channel 1'],
                x: startX,
                frame: 30,
                color: '#14b8a6',
                cap: 'identifies the message type + channel',
            },
            {
                label: 'DATA 1',
                role: 'says WHICH note',
                lines: ['Note number', '60 (Middle C)'],
                x: startX + boxW + gap,
                frame: 130,
                color: '#f97316',
                cap: '7 bits = 128 values (0–127)',
            },
            {
                label: 'DATA 2',
                role: 'says HOW hard',
                lines: ['Velocity', '100'],
                x: startX + 2 * (boxW + gap),
                frame: 230,
                color: '#e85d75',
                cap: '7 bits = 128 values (0–127)',
            },
        ];

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
            ctx.fillText('A MIDI Message: Status + Two Data Bytes', W / 2, 18);
            ctx.globalAlpha = 1;

            const flowP = progress(f, 20, 20);
            if (flowP > 0) {
                ctx.globalAlpha = flowP;
                ctx.fillStyle = '#9ca3af';
                ctx.font = '9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Three bytes, sent as one message  →', W / 2, chainY - 10);
                ctx.globalAlpha = 1;
            }

            boxes.forEach((box, i) => {
                const bp = progress(f, box.frame, 35);
                if (bp <= 0) return;
                ctx.globalAlpha = bp;

                ctx.fillStyle = '#fff';
                ctx.strokeStyle = box.color;
                ctx.lineWidth = 1.8;
                drawRR(box.x, chainY, boxW, boxH, 7);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = COLOR;
                ctx.font = 'bold 10px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(box.label, box.x + boxW / 2, chainY + 18);

                ctx.fillStyle = box.color;
                ctx.font = 'italic 8px -apple-system, sans-serif';
                ctx.fillText(box.role, box.x + boxW / 2, chainY + 31);

                ctx.fillStyle = '#374151';
                ctx.font = '9px -apple-system, sans-serif';
                ctx.fillText(box.lines[0], box.x + boxW / 2, chainY + 48);
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.fillText(box.lines[1], box.x + boxW / 2, chainY + 62);

                ctx.globalAlpha = 1;

                // Per-box caption, revealed slightly after the box itself.
                const capP = progress(f, box.frame + 40, 25);
                if (capP > 0) {
                    ctx.globalAlpha = capP;
                    ctx.fillStyle = '#6b7280';
                    ctx.font = '7.5px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(box.cap, box.x + boxW / 2, chainY + boxH + 18);
                    ctx.globalAlpha = 1;
                }

                // Arrow to next box — confined strictly to the gap x-range.
                if (i < boxes.length - 1) {
                    const arrowP = progress(f, box.frame + 25, 20);
                    if (arrowP > 0) {
                        ctx.globalAlpha = arrowP;
                        const ax1 = box.x + boxW;
                        const ax2 = boxes[i + 1].x;
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
                        ctx.globalAlpha = 1;
                    }
                }
            });

            const capP = progress(f, 320, 30);
            if (capP > 0) {
                ctx.globalAlpha = capP;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Three small bytes: why a MIDI file can be kilobytes,', W / 2, 232);
                ctx.fillText('not megabytes, and every note stays editable', W / 2, 245);
                ctx.globalAlpha = 1;
            }

            const phase = f < boxes[1].frame ? 'Status'
                : f < boxes[2].frame ? 'Data 1'
                : f < 320 ? 'Data 2'
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
