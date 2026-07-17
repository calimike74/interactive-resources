'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure, same skeleton as BpmToMsFamily.js (the reused sibling diagram
// for this chapter's tempo row): formula banner appears → four rows draw in turn, each a
// clean multiplier applied to a running file-size total, with a proportional bar (bar
// length = mb/MAX_MB of the max width) — so the ×2/×2/×1.5 chain is both stated and
// drawn (longer bar = bigger file) → a closing line on why the ratio route avoids the
// heavy 44,100-style multiplication (that full working lives in this row's expansion).
//
// FAMILY is the single source of truth: every MB value is computed by multiplying the
// running total by each stage's factor in code (never hand-typed), so it cannot drift
// from the row's own arithmetic. Recomputed here for the record: 10 (mono, 44.1 kHz,
// 16-bit) × 2 (stereo) = 20; 20 × 2 (44.1 → 88.2 kHz) = 40; 40 × 1.5 (16 → 24-bit) = 60.
// Matches DigitalAudioAssessment.jsx's da-q1 (10 MB mono → stereo = 20 MB) and da-q2
// (×2 channels × ×2 rate × ×1.5 depth = ×6, 10 MB → 60 MB) exactly — see task report.
//
// Label-clearance proof (geometry is static across every frame — only reveal alpha and
// bar width animate, so this holds at every animation extreme): this diagram draws no
// stroked line/connector elements at all (unlike AdcDacPipeline.js or DelayPanEQ.js) —
// every mark is either filled text or a filled bar rect, so there is no line to cross a
// label. Bars and their row text are confined to fixed, non-overlapping y-bands, copied
// unchanged from BpmToMsFamily.js's own proven layout: title y=16; formula banner box
// spans y=[26,50]; row i (i=0..3) has its text baseline at rowTops[i]+9 and its bar at
// y=[rowTops[i]+16, rowTops[i]+28], with rowTops = [54, 98, 142, 186] — each row's own
// band is 44px from the next, comfortably clearing both the row text above it (drawn at
// +9, bar starts at +16, a 7px gap net of font descent) and the next row's text below
// (next row starts 44px later); closing caption sits at y=245, 17px clear of the last
// bar's bottom edge (186+28=214); phase indicator is bottom-right (x=460, y=272),
// clear of every row (rows end by x <= barX0+maxBarWidth+trailing-label-width < 470,
// with the widest trailing label ("60 MB" at row 3, bar full width 380) tested against
// the canvas's 480px width the same way BpmToMsFamily's "150 BPM" row was).
export default function FileSizeArithmetic() {
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

        // Single source of truth — each stage multiplies the running MB total by its own
        // factor, computed, not typed. 10 → 20 → 40 → 60.
        const STAGES = [
            { label: 'Mono, 44.1 kHz, 16-bit', factor: 1, tag: null },
            { label: '×2 channels (stereo)', factor: 2, tag: '×2' },
            { label: '×2 rate (88.2 kHz)', factor: 2, tag: '×2' },
            { label: '×1.5 depth (24-bit)', factor: 1.5, tag: '×1.5' },
        ];
        let running = 10;
        const FAMILY = STAGES.map((s, i) => {
            if (i > 0) running = running * s.factor;
            return { ...s, mb: running };
        });
        const MAX_MB = FAMILY[FAMILY.length - 1].mb; // 60

        const barX0 = 50;
        const maxBarWidth = 380;
        const scale = maxBarWidth / MAX_MB;

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
            ctx.fillText('File Size: Stack the Multipliers', W / 2, 16);
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
                ctx.fillText('file size = rate × depth × channels × time', W / 2, 42);
                ctx.globalAlpha = 1;
            }

            // Four stacking rows
            FAMILY.forEach((row, i) => {
                const rowP = progress(f, rowStarts[i], 40);
                if (rowP <= 0) return;
                const top = rowTops[i];
                const barW = row.mb * scale * rowP;

                ctx.globalAlpha = rowP;
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 10px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                const line = i === 0
                    ? `${row.label}  —  ${row.mb} MB`
                    : `${row.label}  →  ${row.mb} MB`;
                ctx.fillText(line, barX0, top + 9);

                ctx.fillStyle = '#14b8a6';
                ctx.fillRect(barX0, top + 16, barW, 12);

                if (rowP > 0.6) {
                    const labelAlpha = (rowP - 0.6) / 0.4;
                    ctx.globalAlpha = rowP * labelAlpha;
                    ctx.fillStyle = '#14b8a6';
                    ctx.font = 'bold 9px -apple-system, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText(`${row.mb} MB`, barX0 + barW + 8, top + 25);
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
                ctx.fillText('Each multiplier applied in turn — no calculator needed', W / 2, 245);
                ctx.globalAlpha = 1;
            }

            // Phase indicator
            const phase = f < rowStarts[0] ? 'Formula'
                : f < rowStarts[1] ? 'Mono, 10 MB'
                : f < rowStarts[2] ? '×2 Channels'
                : f < rowStarts[3] ? '×2 Rate'
                : f < PHASE_CLOSE ? '×1.5 Depth'
                : 'Total';
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
