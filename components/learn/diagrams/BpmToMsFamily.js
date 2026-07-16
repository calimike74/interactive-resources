'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: formula banner ("quarter-note ms = 60,000 ÷ BPM") appears →
// four rows draw in turn (60, 100, 120, 150 BPM), each showing the full arithmetic
// ("60,000 ÷ 60 = 1000 ms") AND a proportional bar whose length is exactly ms/1000 of
// the max width — so the ÷ relationship is both stated and drawn (longer bar = longer
// quarter note = slower tempo), then a closing line on non-calculator tractability.
//
// FAMILY is the single source of truth: every ms value is computed as 60000/bpm in
// code, never hand-typed, so it cannot drift from the row's own arithmetic.
export default function BpmToMsFamily() {
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

        // Single source of truth — quarter-note ms = 60,000 ÷ BPM, computed, not typed.
        const FAMILY = [60, 100, 120, 150].map((bpm) => ({ bpm, ms: 60000 / bpm }));
        const MAX_MS = Math.max(...FAMILY.map((r) => r.ms)); // 1000, at 60 BPM

        const barX0 = 50;
        const maxBarWidth = 380;
        const scale = maxBarWidth / MAX_MS;

        const rowTops = [54, 98, 142, 186];
        const rowStarts = [80, 150, 220, 290];
        const PHASE_CLOSE = 380;

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
            ctx.fillText('The 60,000 ÷ BPM Family', W / 2, 16);
            ctx.globalAlpha = 1;

            // Formula banner
            const bannerP = progress(f, 20, 30);
            if (bannerP > 0) {
                ctx.globalAlpha = bannerP;
                ctx.fillStyle = '#fff';
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(60, 26, 360, 24, 6);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = '#1a1a2e';
                ctx.font = 'bold 10px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('quarter-note ms = 60,000 ÷ BPM', W / 2, 42);
                ctx.globalAlpha = 1;
            }

            // Four family rows
            FAMILY.forEach((row, i) => {
                const rowP = progress(f, rowStarts[i], 40);
                if (rowP <= 0) return;
                const top = rowTops[i];
                const barW = row.ms * scale * rowP;

                ctx.globalAlpha = rowP;
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 10px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(
                    `${row.bpm} BPM  →  60,000 ÷ ${row.bpm} = ${row.ms} ms`,
                    barX0,
                    top + 9
                );

                ctx.fillStyle = '#14b8a6';
                ctx.fillRect(barX0, top + 16, barW, 12);

                if (rowP > 0.6) {
                    const labelAlpha = (rowP - 0.6) / 0.4;
                    ctx.globalAlpha = rowP * labelAlpha;
                    ctx.fillStyle = '#14b8a6';
                    ctx.font = 'bold 9px -apple-system, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText(`${row.ms} ms`, barX0 + barW + 8, top + 25);
                }
                ctx.globalAlpha = 1;
            });

            // Closing caption
            const closeP = progress(f, PHASE_CLOSE, 30)
                * clamp(1 - (f - (CYCLE - 60)) / 30, 0, 1);
            if (closeP > 0) {
                ctx.globalAlpha = closeP;
                ctx.fillStyle = '#1a1a2e';
                ctx.font = 'italic bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('No calculator needed — every family value divides cleanly', W / 2, 245);
                ctx.globalAlpha = 1;
            }

            // Phase indicator
            const phase = f < rowStarts[0] ? 'Formula'
                : f < rowStarts[1] ? '60 BPM'
                : f < rowStarts[2] ? '100 BPM'
                : f < rowStarts[3] ? '120 BPM'
                : f < PHASE_CLOSE ? '150 BPM'
                : 'Family';
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
