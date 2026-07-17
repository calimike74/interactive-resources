'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: a dashed reference decay draws in both panels → the absorption panel's
// solid curve draws and visibly stops short (shorter RT, same raggedness) → the diffusion
// panel's solid curve draws the full width (same RT as the reference) but smoothed → caption.
//
// Both panels share the identical time domain (T_MAX) and pixel-per-second scale, so a viewer
// can read "ends earlier" and "same length" directly off the shared axis rather than trusting a
// caption. Both treated curves are the SAME envelope(t, RT, noiseAmp) function as the reference,
// with exactly one parameter changed each — RT_ABSORBED < RT_REF (same raggedness, shorter),
// NOISE_DIFFUSED < NOISE_REF at the SAME RT_REF (same length, smoother) — never two independently
// hand-drawn shapes. Each curve is drawn only up to where it crosses a shared 5% amplitude
// threshold, computed from the same envelope function (tEnd = RT · −ln(0.05)), which is why the
// absorbed curve visibly ends inside the panel while the reference and diffused curves (equal
// RT) both reach the right edge. RT_REF = 1.0 s, RT_ABSORBED = 0.4 s and the 5% threshold are
// illustrative reference values — disclosed in the task report.
export default function AbsorbVsDiffuse() {
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

        const T_MAX = 1.5;
        const RT_REF = 1.0;
        const NOISE_REF = 0.35;
        const THRESHOLD = 0.05;
        const RT_ABSORBED = 0.4;
        const RT_DIFFUSED = RT_REF; // same length, by construction
        const NOISE_DIFFUSED = NOISE_REF * 0.15; // heavily smoothed, same underlying shape

        // Deterministic pseudo-ragged texture — a fixed function of t, so the reference,
        // absorbed and diffused curves share exactly the same "shape" (only RT/noiseAmp differ).
        const raggedNoise = (t) => Math.sin(t * 37) * 0.5 + Math.sin(t * 71 + 1.3) * 0.3 + Math.sin(t * 113 + 0.7) * 0.2;
        const envelope = (t, rt, noiseAmp) => Math.max(0, Math.exp(-t / rt) * (1 + noiseAmp * raggedNoise(t)));
        const timeAtThreshold = (rt) => rt * -Math.log(THRESHOLD);

        const tEndAbsorbed = Math.min(T_MAX, timeAtThreshold(RT_ABSORBED));
        const tEndRef = Math.min(T_MAX, timeAtThreshold(RT_REF));
        const tEndDiffused = Math.min(T_MAX, timeAtThreshold(RT_DIFFUSED));

        const panelTop = 66;
        const panelH = 140;
        const panelW = 185;
        const panelGap = 50;
        const panelAx0 = 25;
        const panelBx0 = panelAx0 + panelW + panelGap;
        const baseY = panelTop + panelH;

        const pxX = (t, x0) => x0 + (t / T_MAX) * panelW;
        const pxY = (amp) => baseY - amp * panelH;

        const drawEnvelope = (x0, rt, noiseAmp, tEnd, color, lineWidth, alpha, revealT) => {
            const steps = 60;
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            let started = false;
            for (let i = 0; i <= steps; i++) {
                const t = (i / steps) * Math.min(tEnd, revealT);
                if (t > tEnd) break;
                const y = pxY(envelope(t, rt, noiseAmp));
                const x = pxX(t, x0);
                if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
                if (t >= revealT) break;
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
        };

        const PHASE_AXES = 15;
        const PHASE_REF = 50;
        const REF_DUR = 60;
        const PHASE_ABSORBED = 130;
        const ABSORBED_DUR = 90;
        const PHASE_DIFFUSED = 250;
        const DIFFUSED_DUR = 100;
        const PHASE_CAPTION = 380;

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
            ctx.fillText('Absorption Shortens; Diffusion Smooths', W / 2, 16);
            ctx.globalAlpha = 1;

            // Panel axes + headers
            const axesP = progress(f, PHASE_AXES, 30);
            if (axesP > 0) {
                ctx.globalAlpha = axesP;
                [
                    { x0: panelAx0, title: 'Absorption', color: '#e85d75' },
                    { x0: panelBx0, title: 'Diffusion', color: '#14b8a6' },
                ].forEach(({ x0, title, color }) => {
                    ctx.strokeStyle = '#d1d5db';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x0, panelTop);
                    ctx.lineTo(x0, baseY);
                    ctx.lineTo(x0 + panelW, baseY);
                    ctx.stroke();

                    ctx.fillStyle = color;
                    ctx.font = 'bold 10px -apple-system, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText(title, x0, panelTop - 8);
                });
                ctx.fillStyle = '#9ca3af';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('time →', panelAx0 + panelW / 2, baseY + 16);
                ctx.fillText('time →', panelBx0 + panelW / 2, baseY + 16);
                ctx.globalAlpha = 1;
            }

            // Reference (dashed grey) — same in both panels
            const refP = progress(f, PHASE_REF, REF_DUR);
            if (refP > 0) {
                ctx.setLineDash([3, 3]);
                drawEnvelope(panelAx0, RT_REF, NOISE_REF, tEndRef, '#9ca3af', 1.3, refP * 0.8, refP * tEndRef);
                drawEnvelope(panelBx0, RT_REF, NOISE_REF, tEndRef, '#9ca3af', 1.3, refP * 0.8, refP * tEndRef);
                ctx.setLineDash([]);
            }

            // Absorbed curve — same shape (same noiseAmp), shorter RT, visibly ends early
            const absP = progress(f, PHASE_ABSORBED, ABSORBED_DUR);
            if (absP > 0) {
                drawEnvelope(panelAx0, RT_ABSORBED, NOISE_REF, tEndAbsorbed, '#e85d75', 2.2, 1, absP * tEndAbsorbed);
                if (absP >= 0.999) {
                    const ex = pxX(tEndAbsorbed, panelAx0);
                    const ey = pxY(envelope(tEndAbsorbed, RT_ABSORBED, NOISE_REF));
                    ctx.fillStyle = '#e85d75';
                    ctx.beginPath();
                    ctx.arc(ex, ey, 3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.font = 'bold 8px -apple-system, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText('ends early', ex + 5, ey + 3);
                    ctx.font = 'italic 8px -apple-system, sans-serif';
                    ctx.fillStyle = '#374151';
                    ctx.textAlign = 'center';
                    ctx.fillText('same shape, earlier end', panelAx0 + panelW / 2, baseY + 30);
                }
            }

            // Diffused curve — same RT as reference (same length), heavily smoothed
            const difP = progress(f, PHASE_DIFFUSED, DIFFUSED_DUR);
            if (difP > 0) {
                drawEnvelope(panelBx0, RT_DIFFUSED, NOISE_DIFFUSED, tEndDiffused, '#14b8a6', 2.2, 1, difP * tEndDiffused);
                if (difP >= 0.999) {
                    ctx.font = 'italic 8px -apple-system, sans-serif';
                    ctx.fillStyle = '#374151';
                    ctx.textAlign = 'center';
                    ctx.fillText('same length, smoother', panelBx0 + panelW / 2, baseY + 30);
                }
            }

            // --- Caption ---
            const capP = progress(f, PHASE_CAPTION, 30);
            if (capP > 0) {
                ctx.globalAlpha = capP;
                ctx.fillStyle = '#1a1a2e';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Absorption shortens the tail’s length; diffusion only smooths its texture', W / 2, H - 10);
                ctx.globalAlpha = 1;
            }

            // Phase indicator
            const phase = f < PHASE_ABSORBED ? 'Reference'
                : f < PHASE_DIFFUSED ? 'Absorption'
                : f < PHASE_CAPTION ? 'Diffusion'
                : 'Compare';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - 25, panelTop - 8);

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
