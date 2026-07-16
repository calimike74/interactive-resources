'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: three proportional bars stacked on the same scale — the
// 100 BPM quarter note (600 ms, neutral grey), the dotted quarter (×1.5 = 900 ms,
// orange — longer), and the triplet quarter (×⅔ = 400 ms, teal — shorter) — with the
// full arithmetic printed above each bar so the numbers are readable, not just implied
// by length. A closing caption bridges to the dotted-eighth shortcut (quarter × 0.75)
// already taught by the TimedDelay diagram, without drawing it as a fourth bar (it
// belongs to a different row's own worked example, not this row's 600/900/400 figures).
//
// BASE_MS/DOTTED_MULT/TRIPLET_MULT are the single source of truth — dottedMs and
// tripletMs are computed, never hand-typed, so they cannot drift from the row's text.
export default function DottedTripletMultipliers() {
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

        // Single source of truth — 100 BPM quarter note, dotted (×1.5), triplet (×⅔).
        const BASE_MS = 600;
        const DOTTED_MS = BASE_MS * 1.5; // 900
        const TRIPLET_MS = BASE_MS * (2 / 3); // 400

        const rows = [
            { label: 'QUARTER NOTE @ 100 BPM', formula: '600 ms', ms: BASE_MS, color: '#374151' },
            { label: 'DOTTED (×1.5)', formula: `600 × 1.5 = ${DOTTED_MS} ms`, ms: DOTTED_MS, color: '#f97316' },
            { label: 'TRIPLET (×⅔)', formula: `600 × ⅔ = ${TRIPLET_MS} ms`, ms: TRIPLET_MS, color: '#14b8a6' },
        ];

        const barX0 = 70;
        const maxBarWidth = 380;
        const scale = maxBarWidth / DOTTED_MS; // longest bar (900 ms) fills the full width

        const rowTops = [58, 112, 166];
        const rowStarts = [70, 150, 230];
        const PHASE_CAPTION1 = 320;
        const PHASE_CAPTION2 = 410;

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
            ctx.fillText('Dotted & Triplet Multipliers', W / 2, 16);
            ctx.globalAlpha = 1;

            // Intro line
            const introP = progress(f, 20, 25);
            if (introP > 0) {
                ctx.globalAlpha = introP;
                ctx.fillStyle = '#6b7280';
                ctx.font = 'italic 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('dotted = ×1.5 of itself   ·   triplet = ×⅔ of itself', W / 2, 34);
                ctx.globalAlpha = 1;
            }

            // Three proportional rows
            rows.forEach((row, i) => {
                const rowP = progress(f, rowStarts[i], 40);
                if (rowP <= 0) return;
                const top = rowTops[i];
                const barW = row.ms * scale * rowP;

                ctx.globalAlpha = rowP;
                ctx.fillStyle = row.color;
                ctx.font = 'bold 10px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(`${row.label}: ${row.formula}`, barX0, top + 9);

                ctx.fillStyle = row.color;
                ctx.fillRect(barX0, top + 16, barW, 14);
                ctx.globalAlpha = 1;
            });

            // Rotating closing caption slot
            let caption = '';
            let captionStart = 0;
            if (f >= PHASE_CAPTION2) {
                caption = 'Same ×1.5/×⅔ pattern behind the dotted-eighth shortcut: quarter × 0.75';
                captionStart = PHASE_CAPTION2;
            } else if (f >= PHASE_CAPTION1) {
                caption = 'Dotted lengthens the note, triplet shortens it — both checkable by hand';
                captionStart = PHASE_CAPTION1;
            }
            if (caption) {
                const capP = progress(f, captionStart, 25)
                    * clamp(1 - (f - (CYCLE - 40)) / 25, 0, 1);
                ctx.globalAlpha = capP;
                ctx.fillStyle = '#1a1a2e';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(caption, W / 2, 224);
                ctx.globalAlpha = 1;
            }

            // Phase indicator
            const phase = f < rowStarts[0] ? 'Intro'
                : f < rowStarts[1] ? 'Quarter'
                : f < rowStarts[2] ? 'Dotted'
                : f < PHASE_CAPTION1 ? 'Triplet'
                : f < PHASE_CAPTION2 ? 'Compare'
                : 'Bridge';
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
