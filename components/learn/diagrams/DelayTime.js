'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: dry hit appears → wet appears at <30 ms (fused/thickening) → moves to 50–120 ms (slapback) → moves to >120 ms (echo)
export default function DelayTime() {
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

        const margin = { left: 70, right: 30 };
        const plotW = W - margin.left - margin.right;
        const timelineY = 150;

        const PHASE_1 = 20;   // dry hit appears
        const PHASE_2 = 100;  // short (<30ms) — thickening
        const PHASE_3 = 220;  // medium (50–120ms) — slapback
        const PHASE_4 = 340;  // long (>120ms) — echo

        // Positions (in px from dry) for each phase's wet
        const DRY_X_FACTOR = 0.10; // dry at 10% across plot

        const draw = () => {
            frameRef.current = (frameRef.current + 0.6) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            // Title
            const titleP = progress(f, 0, 25);
            ctx.globalAlpha = titleP;
            ctx.fillStyle = '#1a1a2e';
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Delay Time', W / 2, 22);
            ctx.globalAlpha = 1;

            // Baseline
            const baseP = progress(f, 10, 25);
            if (baseP > 0) {
                ctx.globalAlpha = baseP;
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(margin.left, timelineY);
                ctx.lineTo(W - margin.right, timelineY);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            // Determine current zone + wet position
            let wetGap = 0;
            let zoneLabel = '';
            let zoneMs = '';
            let zoneColor = '#14b8a6';

            if (f < PHASE_2) {
                wetGap = 0; // no wet yet
            } else if (f < PHASE_3) {
                wetGap = 18;
                zoneLabel = 'thickening';
                zoneMs = '< 30 ms';
                zoneColor = '#DCC892';
            } else if (f < PHASE_4) {
                wetGap = 70;
                zoneLabel = 'slapback';
                zoneMs = '50–120 ms';
                zoneColor = '#14b8a6';
            } else {
                wetGap = 170;
                zoneLabel = 'echo';
                zoneMs = '> 120 ms';
                zoneColor = '#f97316';
            }

            // Dry hit
            if (f >= PHASE_1) {
                const dryP = progress(f, PHASE_1, 30);
                const dryX = margin.left + plotW * DRY_X_FACTOR;
                drawWavelet(ctx, dryX, timelineY, 26 * dryP, '#374151', 1);

                // "dry" label
                ctx.globalAlpha = dryP * 0.8;
                ctx.fillStyle = '#374151';
                ctx.font = '9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('dry', dryX, timelineY + 42);
                ctx.globalAlpha = 1;
            }

            // Wet hit (animates across zones with smooth tween)
            if (f >= PHASE_2) {
                // Smooth tween between zone gaps
                let targetGap = 18;
                let prevGap = 0;
                let tweenStart = PHASE_2;
                if (f < PHASE_3) {
                    tweenStart = PHASE_2;
                    prevGap = 0;
                    targetGap = 18;
                } else if (f < PHASE_4) {
                    tweenStart = PHASE_3;
                    prevGap = 18;
                    targetGap = 70;
                } else {
                    tweenStart = PHASE_4;
                    prevGap = 70;
                    targetGap = 170;
                }
                const tween = progress(f, tweenStart, 40);
                const animatedGap = prevGap + (targetGap - prevGap) * tween;

                const dryX = margin.left + plotW * DRY_X_FACTOR;
                const wetX = dryX + animatedGap;
                const wetP = progress(f, tweenStart, 25);

                drawWavelet(ctx, wetX, timelineY, 22 * wetP, zoneColor, 0.9);

                // Gap bracket (below timeline)
                if (wetP > 0.4) {
                    ctx.globalAlpha = (wetP - 0.4) / 0.6;
                    ctx.strokeStyle = '#9ca3af';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(dryX, timelineY + 24);
                    ctx.lineTo(dryX, timelineY + 28);
                    ctx.lineTo(wetX, timelineY + 28);
                    ctx.lineTo(wetX, timelineY + 24);
                    ctx.stroke();

                    // ms number in the bracket
                    ctx.fillStyle = zoneColor;
                    ctx.font = 'bold 9px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(zoneMs, (dryX + wetX) / 2, timelineY + 42);
                    ctx.globalAlpha = 1;
                }

                // "wet" label
                ctx.globalAlpha = wetP * 0.8;
                ctx.fillStyle = zoneColor;
                ctx.font = '9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('wet', wetX, timelineY - 34);
                ctx.globalAlpha = 1;
            }

            // Big zone callout (top-centre)
            if (f >= PHASE_2 && zoneLabel) {
                const calloutP = progress(f, f < PHASE_3 ? PHASE_2 : f < PHASE_4 ? PHASE_3 : PHASE_4, 30)
                    * (f > CYCLE - 60 ? clamp(1 - (f - (CYCLE - 60)) / 30, 0, 1) : 1);
                ctx.globalAlpha = calloutP;

                // Zone pill background
                const pillY = 58;
                const pillW = 150;
                const pillH = 28;
                const pillX = W / 2 - pillW / 2;

                ctx.fillStyle = zoneColor + '18';
                ctx.strokeStyle = zoneColor;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(pillX, pillY, pillW, pillH, 14);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = zoneColor;
                ctx.font = 'bold 11px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(zoneLabel.toUpperCase(), W / 2, pillY + 18);
                ctx.globalAlpha = 1;
            }

            // Perceptual description strip (bottom) — updates with zone
            const descTextMap = {
                'thickening': 'repeat fuses with dry: heard as a thicker, phasey tone',
                'slapback': 'one distinct slap heard close to the dry',
                'echo': 'repeats clearly heard as separate events',
            };
            if (zoneLabel) {
                const descP = progress(f, f < PHASE_3 ? PHASE_2 + 15 : f < PHASE_4 ? PHASE_3 + 15 : PHASE_4 + 15, 25)
                    * (f > CYCLE - 60 ? clamp(1 - (f - (CYCLE - 60)) / 30, 0, 1) : 1);
                ctx.globalAlpha = descP;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 10px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(descTextMap[zoneLabel], W / 2, timelineY + 85);
                ctx.globalAlpha = 1;
            }

            // Phase indicator
            const phase = f < PHASE_2 ? 'Dry'
                : f < PHASE_3 ? 'Thickening'
                : f < PHASE_4 ? 'Slapback'
                : 'Echo';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - 20, H - 10);
            ctx.textAlign = 'center';
            ctx.fillText('time →', W / 2, H - 10);

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
    const width = 20;
    for (let dx = -width; dx <= width; dx++) {
        const env = Math.exp(-Math.abs(dx) / 8);
        const yOffset = Math.sin(dx * 0.75) * amplitude * env;
        const px = x + dx;
        const py = y + yOffset;
        if (dx === -width) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.globalAlpha = prev;
}
