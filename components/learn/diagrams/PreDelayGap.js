'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: direct spike → dimensioned gap bracket ("80 ms — pre-delay") grows →
// reverb onset, drawn as a dense wash texture (NOT a single repeat wavelet) so it reads as
// "the room answers" rather than "an echo repeats" → caption states the distinction → hold →
// fade → loop. Anatomy copies DelayTime.js's gap-bracket mechanism exactly (bracket below the
// timeline, dimension text in the zone's colour); the 80 ms figure matches the verb-predelay
// audio preset's own pre-delay value (spec: hall + 80 ms DelayNode on the wet path) — it is one
// illustrative point inside the row's stated 0–200 ms+ range, not the row's full range.
export default function PreDelayGap() {
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

        const CYCLE = 480;
        let animId;

        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);

        const timelineY = 140;
        const dryX = 80;
        const GAP_PX = 140;
        const wetX0 = dryX + GAP_PX;
        const wetX1 = wetX0 + 140;

        const WASH_N = 20;
        const washStep = (wetX1 - wetX0) / (WASH_N - 1);
        const washBars = Array.from({ length: WASH_N }, (_, i) => ({
            x: wetX0 + i * washStep,
            amp: 22 * Math.exp(-i / 9) * (0.7 + 0.3 * Math.abs(Math.sin(i * 1.9))),
        }));

        const PHASE_DRY = 20;
        const PHASE_GAP = 70;
        const GAP_DUR = 35;
        const PHASE_GAP_LABEL = PHASE_GAP + GAP_DUR + 10;
        const PHASE_WASH0 = 160;
        const WASH_STAGGER = 4;
        const PHASE_WASH_LABEL = PHASE_WASH0 + WASH_N * WASH_STAGGER + 20;
        const PHASE_CAPTION = PHASE_WASH_LABEL + 30;

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
            ctx.fillText('Pre-Delay: the Gap Before the Room Answers', W / 2, 16);
            ctx.globalAlpha = 1;

            // Baseline
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(30, timelineY);
            ctx.lineTo(450, timelineY);
            ctx.stroke();

            // --- Direct spike ---
            const dryP = progress(f, PHASE_DRY, 25);
            if (dryP > 0) {
                drawWavelet(ctx, dryX, timelineY, 24 * dryP, '#374151', 1);
                ctx.globalAlpha = dryP * 0.85;
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Direct', dryX, timelineY + 42);
                ctx.globalAlpha = 1;
            }

            // --- Gap bracket (dimensioned) ---
            const gapP = progress(f, PHASE_GAP, GAP_DUR);
            if (gapP > 0) {
                const bracketEndX = dryX + gapP * GAP_PX;
                ctx.globalAlpha = gapP;
                ctx.strokeStyle = '#9ca3af';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(dryX, timelineY + 20);
                ctx.lineTo(dryX, timelineY + 26);
                ctx.lineTo(bracketEndX, timelineY + 26);
                if (gapP >= 0.999) ctx.lineTo(bracketEndX, timelineY + 20);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
            const gapLabelP = progress(f, PHASE_GAP_LABEL, 25);
            if (gapLabelP > 0) {
                ctx.globalAlpha = gapLabelP;
                ctx.fillStyle = '#14b8a6';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('80 ms — pre-delay', (dryX + wetX0) / 2, timelineY + 44);
                ctx.fillStyle = '#9ca3af';
                ctx.font = 'italic 8px -apple-system, sans-serif';
                ctx.fillText('silence — nothing repeats here', (dryX + wetX0) / 2, timelineY + 56);
                ctx.globalAlpha = 1;
            }

            // --- Reverb onset: a wash, not a repeat spike ---
            for (let i = 0; i < WASH_N; i++) {
                const appear = PHASE_WASH0 + i * WASH_STAGGER;
                const p = progress(f, appear, 14);
                if (p <= 0) continue;
                const bar = washBars[i];
                const h = bar.amp * p;
                ctx.globalAlpha = p * 0.85;
                ctx.fillStyle = '#14b8a6';
                ctx.fillRect(bar.x - 1.5, timelineY - h / 2, 3, h);
                ctx.globalAlpha = 1;
            }
            const washLabelP = progress(f, PHASE_WASH_LABEL, 25);
            if (washLabelP > 0) {
                ctx.globalAlpha = washLabelP;
                ctx.fillStyle = '#14b8a6';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Reverb onset (wash)', (wetX0 + wetX1) / 2, timelineY - 34);
                ctx.globalAlpha = 1;
            }

            // --- Caption ---
            const capP = progress(f, PHASE_CAPTION, 25);
            if (capP > 0) {
                ctx.globalAlpha = capP;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Not an echo — the onset is a wash, not a repeat spike', W / 2, timelineY + 78);
                ctx.globalAlpha = 1;
            }

            // Phase indicator
            const phase = f < PHASE_GAP ? 'Direct'
                : f < PHASE_WASH0 ? 'Pre-delay gap'
                : f < PHASE_WASH_LABEL ? 'Reverb onset'
                : 'Complete';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - 20, H - 10);
            ctx.textAlign = 'left';
            ctx.fillText('time →', 30, H - 10);

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

function drawWavelet(ctx, x, y, amplitude, color, alpha) {
    const prev = ctx.globalAlpha;
    ctx.globalAlpha = prev * alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const width = 16;
    for (let dx = -width; dx <= width; dx++) {
        const env = Math.exp(-Math.abs(dx) / 6);
        const yOffset = Math.sin(dx * 0.85) * amplitude * env;
        const px = x + dx;
        const py = y + yOffset;
        if (dx === -width) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.globalAlpha = prev;
}
