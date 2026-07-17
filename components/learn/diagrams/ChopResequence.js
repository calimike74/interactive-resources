'use client';

import { useEffect, useRef } from 'react';

// One bar, 8 equal slices (380px / 8 = 47.5px exactly — a clean division, disclosed).
// TYPES holds an illustrative breakbeat-style pattern (kick/hihat/snare/hihat/kick/kick/
// snare/hihat) — NOT a transcription of the Winstons' Amen break; the row only credits
// the culture and the technical advantage, it doesn't hand us a bar to transcribe, so
// inventing one and labelling it "the Amen break" would be an unsupported claim. PERM is
// a genuine permutation of slice indices 1-8 (verified: each of 1-8 appears exactly
// once) — panel B is built by re-reading TYPES through PERM, not by hand-typing a second
// pattern, so "same slices, new order" is structurally true, not just claimed. Colour is
// keyed to hit TYPE (kick/snare/hihat), so a given original slice carries the same colour
// wherever it lands — "same slice = same width + colour" holds by construction, since
// every slice is drawn at the identical 47.5px width in both panels regardless of type.
//
// Label-clearance: panel A's blocks occupy y=[60,96], its slice-number labels sit at
// y=106 (10px below); panel B's blocks occupy y=[163,199], its numbers sit at y=209
// (10px below). The two panels themselves are 163-106=57px apart, with the transition
// label at y=130 sitting in that gap, clear of both blocks' y-bands. No line in this
// diagram (there are no connecting lines between panels, only colour + number match) can
// cross a label.
export default function ChopResequence() {
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

        const X0 = 60;
        const X1 = 440;
        const N = 8;
        const SLICE_W = (X1 - X0) / N; // 47.5, exact
        const sliceLeft = (slot) => X0 + slot * SLICE_W;

        // Illustrative breakbeat pattern — disclosed as such, not a real transcription.
        const TYPES = ['K', 'H', 'S', 'H', 'K', 'K', 'S', 'H'];
        const COLORS = { K: '#374151', S: '#e85d75', H: '#DCC892' };
        const TEXT_COLORS = { K: '#fff', S: '#fff', H: '#374151' };

        // A genuine permutation of original slice numbers 1-8 (verified elsewhere: each
        // used exactly once). Panel B is TYPES read through this order, not re-typed.
        const PERM = [3, 6, 1, 8, 2, 7, 4, 5];

        const drawSlice = (slot, y0, y1, origIndex, alpha) => {
            const type = TYPES[origIndex - 1];
            const x0 = sliceLeft(slot) + 1.5;
            const w = SLICE_W - 3;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = COLORS[type];
            ctx.beginPath();
            ctx.roundRect(x0, y0, w, y1 - y0, 3);
            ctx.fill();
            ctx.fillStyle = TEXT_COLORS[type];
            ctx.font = 'bold 10px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(type, x0 + w / 2, (y0 + y1) / 2 + 4);
            ctx.globalAlpha = 1;
        };

        const blockPhaseA = (i) => 45 + i * 12;
        const blockPhaseB = (i) => 220 + i * 12;
        const PHASE_LABEL_A = 20;
        const PHASE_TRANSITION = 175;
        const PHASE_LABEL_B = 195;
        const PHASE_CAPTION = 340;

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
            ctx.fillText('Chop the Break, Reorder the Hits', W / 2, 16);
            ctx.globalAlpha = 1;

            const labelAP = progress(f, PHASE_LABEL_A, 20);
            if (labelAP > 0) {
                ctx.globalAlpha = labelAP;
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Original break — one bar, 8 hits', W / 2, 44);
                ctx.globalAlpha = 1;
            }

            for (let i = 0; i < N; i++) {
                const bp = progress(f, blockPhaseA(i), 20);
                if (bp <= 0) continue;
                const origIndex = i + 1; // panel A slot i holds original slice i+1
                drawSlice(i, 60, 96, origIndex, bp);
                const numP = progress(f, blockPhaseA(i) + 10, 15);
                if (numP > 0) {
                    ctx.globalAlpha = numP;
                    ctx.fillStyle = '#9ca3af';
                    ctx.font = '6.5px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(String(origIndex), sliceLeft(i) + SLICE_W / 2, 106);
                    ctx.globalAlpha = 1;
                }
            }

            const transP = progress(f, PHASE_TRANSITION, 20);
            if (transP > 0) {
                ctx.globalAlpha = transP;
                ctx.fillStyle = '#f97316';
                ctx.font = 'italic bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('chopped onto pads, reordered', W / 2, 130);
                ctx.globalAlpha = 1;
            }

            const labelBP = progress(f, PHASE_LABEL_B, 20);
            if (labelBP > 0) {
                ctx.globalAlpha = labelBP;
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Resequenced — a pattern its drummer never played', W / 2, 155);
                ctx.globalAlpha = 1;
            }

            for (let i = 0; i < N; i++) {
                const bp = progress(f, blockPhaseB(i), 20);
                if (bp <= 0) continue;
                const origIndex = PERM[i]; // panel B slot i holds original slice PERM[i]
                drawSlice(i, 163, 199, origIndex, bp);
                const numP = progress(f, blockPhaseB(i) + 10, 15);
                if (numP > 0) {
                    ctx.globalAlpha = numP;
                    ctx.fillStyle = '#9ca3af';
                    ctx.font = '6.5px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(String(origIndex), sliceLeft(i) + SLICE_W / 2, 209);
                    ctx.globalAlpha = 1;
                }
            }

            const capP = progress(f, PHASE_CAPTION, 25);
            if (capP > 0) {
                ctx.globalAlpha = capP;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Same 8 slices, same widths and colours — only the order has changed', W / 2, 228);
                ctx.globalAlpha = 1;
            }

            const phase = f < PHASE_TRANSITION ? 'Original' : f < blockPhaseB(N - 1) ? 'Resequencing' : 'Complete';
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
