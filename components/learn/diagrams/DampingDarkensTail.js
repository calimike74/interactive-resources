'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: four frequency-band bars all at full length (start of the tail) →
// they shrink at DIFFERENT rates as an elapsed-time progress value p (0→1) advances, high
// shrinking fastest → live % readouts → a rotating caption ending on the tone-not-level point.
//
// Every bar's length is computed each frame from level(band, p) = exp(−band.rate · p), the
// single source of truth (same discipline as the curve/marker diagrams) — nothing is set by
// hand per frame. p stands in for "elapsed time within the tail"; it is NOT calibrated to real
// RT60 seconds, and the four per-band rate constants (1.0 / 1.8 / 2.8 / 4.2) are illustrative,
// chosen only to give low < low-mid < high-mid < high a visibly widening decay gap — disclosed
// here and in the task report.
export default function DampingDarkensTail() {
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

        const BANDS = [
            { name: 'Low', rate: 1.0, color: '#374151' },
            { name: 'Low-Mid', rate: 1.8, color: '#14b8a6' },
            { name: 'High-Mid', rate: 2.8, color: '#DCC892' },
            { name: 'High', rate: 4.2, color: '#f97316' },
        ];
        const level = (rate, p) => Math.exp(-rate * p);

        const originX = 150;
        const maxWidth = 260;
        const barH = 22;
        const rowGap = 44;
        const firstY = 88;

        const PHASE_INTRO = 15;
        const PHASE_BARS = 60;
        const BARS_DUR = 280;
        const PHASE_CAPTION_MID = PHASE_BARS + BARS_DUR * 0.35;
        const PHASE_CAPTION_LATE = PHASE_BARS + BARS_DUR * 0.85;

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
            ctx.fillText('Damping: Which Frequencies Survive the Tail', W / 2, 16);
            ctx.globalAlpha = 1;

            // Intro line
            const introP = progress(f, PHASE_INTRO, 25);
            if (introP > 0) {
                ctx.globalAlpha = introP;
                ctx.fillStyle = '#9ca3af';
                ctx.font = 'italic 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Same clap, later in the tail — which frequencies survive?', W / 2, 36);
                ctx.globalAlpha = 1;
            }

            const p = progress(f, PHASE_BARS, BARS_DUR);

            BANDS.forEach((band, i) => {
                const y = firstY + i * rowGap;
                const frac = level(band.rate, p);
                const w = maxWidth * frac;

                // Band name
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(band.name, originX - 10, y + 4);

                // Track (full-length ghost)
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 1;
                ctx.strokeRect(originX, y - barH / 2, maxWidth, barH);

                // Current level bar
                ctx.fillStyle = band.color;
                ctx.fillRect(originX, y - barH / 2, w, barH);

                // % readout
                ctx.fillStyle = band.color;
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(`${Math.round(frac * 100)}%`, originX + maxWidth + 10, y + 4);
            });

            // --- Rotating caption ---
            let caption = '';
            if (f >= PHASE_CAPTION_LATE) {
                caption = 'Tone changes, not loudness — the tail’s overall length barely moves';
            } else if (f >= PHASE_CAPTION_MID) {
                caption = 'Highs are already fading fastest — the tail is darkening';
            } else if (f >= PHASE_BARS) {
                caption = 'All bands present — like the very start of the wash';
            }
            if (caption) {
                const capStart = f >= PHASE_CAPTION_LATE ? PHASE_CAPTION_LATE : f >= PHASE_CAPTION_MID ? PHASE_CAPTION_MID : PHASE_BARS;
                const capP = progress(f, capStart, 20);
                ctx.globalAlpha = capP;
                ctx.fillStyle = '#1a1a2e';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(caption, W / 2, 252);
                ctx.globalAlpha = 1;
            }

            // Phase indicator
            const phase = f < PHASE_BARS ? 'Start'
                : f < PHASE_CAPTION_MID ? 'Even'
                : f < PHASE_CAPTION_LATE ? 'Darkening'
                : 'Late tail';
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
