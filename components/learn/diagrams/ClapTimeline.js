'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: direct spike → early-reflection spikes appear in sequence inside a
// dimensioned ~50–80 ms bracket → the wash builds as a dense bar texture, left to right → hold
// → fade → loop. Region x-positions are schematic (illustrative spacing, not a literal linear
// ms-per-pixel scale) — the same convention DelayTime.js already uses for its thickening/
// slapback/echo zones (its own zone gaps of 18/70/170px aren't proportional to 30/120/… ms
// either). Early-reflection amplitudes and the wash's per-bar heights are both fixed formulas
// (Math.pow / Math.exp / Math.sin), not Math.random, so the texture is identical every cycle.
export default function ClapTimeline() {
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

        const timelineY = 140;
        const directX = 70;

        const EARLY_X0 = 150;
        const EARLY_STEP = 18;
        const EARLY_COUNT = 5;
        const earlyAmp = (i) => 22 * Math.pow(0.8, i);

        const WASH_X0 = 250;
        const WASH_X1 = 430;
        const WASH_N = 36;
        const washStep = (WASH_X1 - WASH_X0) / (WASH_N - 1);
        const washBars = Array.from({ length: WASH_N }, (_, i) => ({
            x: WASH_X0 + i * washStep,
            amp: 24 * Math.exp(-i / 12) * (0.7 + 0.3 * Math.abs(Math.sin(i * 1.7))),
        }));

        const PHASE_DIRECT = 15;
        const PHASE_EARLY0 = 60;
        const EARLY_STAGGER = 16;
        const PHASE_EARLY_LABEL = PHASE_EARLY0 + (EARLY_COUNT - 1) * EARLY_STAGGER + 30;
        const PHASE_WASH0 = 190;
        const WASH_STAGGER = 3;
        const PHASE_WASH_LABEL = PHASE_WASH0 + WASH_N * WASH_STAGGER + 20;
        const PHASE_CAPTION = PHASE_WASH_LABEL + 40;

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
            ctx.fillText('One Clap, Three Arrivals', W / 2, 16);
            ctx.globalAlpha = 1;

            // Baseline
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(30, timelineY);
            ctx.lineTo(450, timelineY);
            ctx.stroke();

            // --- Direct spike ---
            const directP = progress(f, PHASE_DIRECT, 25);
            if (directP > 0) {
                drawWavelet(ctx, directX, timelineY, 24 * directP, '#374151', 1);
                ctx.globalAlpha = directP * 0.85;
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Direct', directX, timelineY + 42);
                ctx.globalAlpha = 1;
            }

            // --- Early reflections ---
            for (let i = 0; i < EARLY_COUNT; i++) {
                const appear = PHASE_EARLY0 + i * EARLY_STAGGER;
                const p = progress(f, appear, 18);
                if (p <= 0) continue;
                const x = EARLY_X0 + i * EARLY_STEP;
                drawWavelet(ctx, x, timelineY, earlyAmp(i) * p, '#14b8a6', 0.9);
            }
            const earlyLabelP = progress(f, PHASE_EARLY_LABEL, 25);
            if (earlyLabelP > 0) {
                ctx.globalAlpha = earlyLabelP;
                const bx0 = EARLY_X0 - 10;
                const bx1 = EARLY_X0 + (EARLY_COUNT - 1) * EARLY_STEP + 10;
                const by = timelineY - 34;
                ctx.strokeStyle = '#14b8a6';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(bx0, by + 6);
                ctx.lineTo(bx0, by);
                ctx.lineTo(bx1, by);
                ctx.lineTo(bx1, by + 6);
                ctx.stroke();
                ctx.fillStyle = '#14b8a6';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Early reflections — ~50–80 ms', (bx0 + bx1) / 2, by - 8);
                ctx.globalAlpha = 1;
            }

            // --- Wash ---
            for (let i = 0; i < WASH_N; i++) {
                const appear = PHASE_WASH0 + i * WASH_STAGGER;
                const p = progress(f, appear, 12);
                if (p <= 0) continue;
                const bar = washBars[i];
                const h = bar.amp * p;
                ctx.globalAlpha = p * 0.85;
                ctx.fillStyle = '#DCC892';
                ctx.fillRect(bar.x - 1.5, timelineY - h / 2, 3, h);
                ctx.globalAlpha = 1;
            }
            const washLabelP = progress(f, PHASE_WASH_LABEL, 25);
            if (washLabelP > 0) {
                ctx.globalAlpha = washLabelP;
                ctx.fillStyle = '#DCC892';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Tail (wash)', (WASH_X0 + WASH_X1) / 2, timelineY - 40);
                ctx.globalAlpha = 1;
            }

            // --- Caption ---
            const capP = progress(f, PHASE_CAPTION, 25);
            if (capP > 0) {
                ctx.globalAlpha = capP;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Direct defines dry, early reflections cue the room’s size, then the wash decays', W / 2, timelineY + 70);
                ctx.globalAlpha = 1;
            }

            // Phase indicator
            const phase = f < PHASE_EARLY0 ? 'Direct'
                : f < PHASE_WASH0 ? 'Early reflections'
                : f < PHASE_WASH_LABEL ? 'Wash'
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
