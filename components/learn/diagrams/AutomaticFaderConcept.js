'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: input level envelope + threshold line → a playhead sweeps
// across it → a single fader widget mirrors the playhead's level, pulling DOWN only
// while the envelope is above the threshold, then returning — the automatic-fader
// idea made literal. Closing beat lists the four mark-scheme reasons to compress.
export default function AutomaticFaderConcept() {
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

        const margin = { left: 24, right: 24, top: 40 };
        const plotW = W - margin.left - margin.right;

        const THRESHOLD = 0.42;

        // Single source of truth for the level envelope — two loud passages over a
        // steady quiet base, shared by the drawn curve, the playhead and the fader.
        const envelopeAt = (t) => {
            const hump = (center, width, height) => {
                const d = Math.abs(t - center) / width;
                return d < 1 ? height * Math.cos((d * Math.PI) / 2) : 0;
            };
            return clamp(0.2 + hump(0.28, 0.16, 0.55) + hump(0.68, 0.14, 0.48), 0, 1);
        };

        // Gain the automatic fader applies: 1 (untouched) below threshold, pulled
        // down proportionally to the excess above it.
        const gainAt = (t) => {
            const lvl = envelopeAt(t);
            if (lvl <= THRESHOLD) return 1;
            const excess = lvl - THRESHOLD;
            return clamp(1 - excess * 1.1, 0.35, 1);
        };

        const envTop = margin.top;
        const envH = 90;
        const envBase = envTop + envH;

        const faderX = W - margin.right - 46;
        const faderTop = envBase + 46;
        const faderH = 96;
        const faderTrackX = faderX + 30;

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
            ctx.fillText('The Automatic Fader', W / 2, 16);
            ctx.globalAlpha = 1;

            // --- Envelope + threshold ---
            const envP = progress(f, 20, 40);
            if (envP > 0) {
                ctx.globalAlpha = envP;
                ctx.fillStyle = '#6b7280';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('Input level', margin.left, envTop - 8);

                const threshY = envBase - THRESHOLD * envH;
                ctx.strokeStyle = '#e85d75';
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(margin.left, threshY);
                ctx.lineTo(margin.left + plotW, threshY);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = '#e85d75';
                ctx.font = 'bold 8px -apple-system, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText('Chosen level', margin.left + plotW, threshY - 4);

                ctx.strokeStyle = '#1a1a6e';
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                const steps = 120;
                for (let i = 0; i <= steps; i++) {
                    const t = i / steps;
                    const y = envBase - envelopeAt(t) * envH;
                    const x = margin.left + t * plotW;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            // --- Fader widget (drawn once envelope has appeared) ---
            const faderAppear = progress(f, 70, 30);
            if (faderAppear > 0) {
                ctx.globalAlpha = faderAppear;
                ctx.fillStyle = '#6b7280';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('Fader', faderX - 4, faderTop - 10);

                ctx.strokeStyle = '#d1d5db';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(faderTrackX, faderTop);
                ctx.lineTo(faderTrackX, faderTop + faderH);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            // --- Playhead sweep + synced fader thumb ---
            const sweepStart = 110;
            const sweepDur = 340;
            if (f >= sweepStart) {
                const cyclePos = ((f - sweepStart) % sweepDur) / sweepDur;
                const t = cyclePos;
                const px = margin.left + t * plotW;
                const py = envBase - envelopeAt(t) * envH;
                const gain = gainAt(t);

                // Playhead line
                ctx.strokeStyle = '#9B7530';
                ctx.lineWidth = 1;
                ctx.setLineDash([2, 2]);
                ctx.beginPath();
                ctx.moveTo(px, envTop - 4);
                ctx.lineTo(px, envBase + 6);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.fillStyle = '#9B7530';
                ctx.beginPath();
                ctx.arc(px, py, 3.5, 0, Math.PI * 2);
                ctx.fill();

                // Fader thumb: track spans 0 (bottom, silent) .. 1 (top, unity) —
                // gain 1 sits near the top, pulled down as gain falls.
                const thumbY = faderTop + (1 - gain) * faderH;
                const isDucking = gain < 0.999;

                ctx.fillStyle = isDucking ? '#e85d75' : '#374151';
                ctx.beginPath();
                ctx.roundRect(faderTrackX - 10, thumbY - 6, 20, 12, 3);
                ctx.fill();

                ctx.strokeStyle = '#9B7530';
                ctx.lineWidth = 1;
                ctx.setLineDash([2, 2]);
                ctx.beginPath();
                ctx.moveTo(faderTrackX + 10, thumbY);
                ctx.lineTo(faderX + 44, thumbY);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            const captionP = progress(f, 130, 30);
            if (captionP > 0) {
                ctx.globalAlpha = captionP;
                ctx.fillStyle = '#374151';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('Above the chosen level, the fader', margin.left, faderTop + 12);
                ctx.fillText('pulls itself down — automatically.', margin.left, faderTop + 24);
                ctx.fillText('Below it, the fader stays put.', margin.left, faderTop + 36);
                ctx.globalAlpha = 1;
            }

            const listP = progress(f, 420, 40);
            if (listP > 0) {
                ctx.globalAlpha = listP;
                ctx.fillStyle = '#16a34a';
                ctx.font = 'bold 8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Control peaks · Consistent volume · Raise average (RMS) level · Sit in the mix', W / 2, H - 8);
                ctx.globalAlpha = 1;
            }

            const phase = f < 110 ? 'Level' : f < 130 ? 'Fader' : f < 420 ? 'Automatic' : 'Why compress';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - margin.right, H - 22);

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
