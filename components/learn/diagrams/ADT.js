'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: dry vocal waveform draws → short-delay copy appears below (time offset only, rigid) → LFO pitch modulation applied (copy wobbles) → summed display shows thickened single-voice impression
export default function ADT() {
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

        const PHASE_1 = 20;   // dry draws
        const PHASE_2 = 130;  // delayed copy appears (rigid offset)
        const PHASE_3 = 260;  // LFO modulation kicks in
        const PHASE_4 = 380;  // summed display + annotation

        const margin = { left: 80, right: 30 };
        const plotW = W - margin.left - margin.right;

        const dryY = 75;
        const wetY = 135;
        const sumY = 215;

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
            ctx.fillText('ADT: short delay + LFO pitch modulation', W / 2, 20);
            ctx.globalAlpha = 1;

            // Row labels (appear progressively)
            const dryLabelP = progress(f, PHASE_1, 25);
            ctx.globalAlpha = dryLabelP;
            ctx.fillStyle = '#374151';
            ctx.font = 'bold 9px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('DRY', margin.left - 10, dryY + 4);
            ctx.globalAlpha = 1;

            if (f >= PHASE_2) {
                const wLP = progress(f, PHASE_2, 25);
                ctx.globalAlpha = wLP;
                ctx.fillStyle = '#14b8a6';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText('+60 ms', margin.left - 10, wetY + 4);
                if (f >= PHASE_3) {
                    const modP = progress(f, PHASE_3, 20);
                    ctx.globalAlpha = modP;
                    ctx.fillStyle = '#6b7280';
                    ctx.font = 'italic 8px -apple-system, sans-serif';
                    ctx.fillText('+ LFO', margin.left - 10, wetY + 15);
                }
                ctx.globalAlpha = 1;
            }

            if (f >= PHASE_4) {
                const sumLP = progress(f, PHASE_4, 25);
                ctx.globalAlpha = sumLP;
                ctx.fillStyle = '#1a1a2e';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText('SUMMED', margin.left - 10, sumY + 4);
                ctx.globalAlpha = 1;
            }

            // ===== DRY waveform — progressive draw in phase 1, then held =====
            const dryProgress = progress(f, PHASE_1, 60);
            drawVocalLine(ctx, margin.left, dryY, plotW, f, 0, 0, '#374151', 1, dryProgress);

            // ===== Delayed copy (phase 2) — rigid time offset, no pitch mod =====
            if (f >= PHASE_2) {
                const wetProgress = progress(f, PHASE_2, 50);
                // Phase 2 is rigid, phase 3 introduces LFO
                let lfoAmt = 0;
                if (f >= PHASE_3) {
                    lfoAmt = progress(f, PHASE_3, 40);
                }
                const lfoOffset = Math.sin(f * 0.018) * 2.5 * lfoAmt;
                drawVocalLine(ctx, margin.left, wetY, plotW, f, 16, lfoOffset, '#14b8a6', 0.9, wetProgress);

                // Comparison arrow showing time offset (phase 2 only)
                if (f < PHASE_3 + 20) {
                    const arrowP = progress(f, PHASE_2 + 20, 25)
                        * clamp(1 - (f - PHASE_3) / 20, 0, 1);
                    if (arrowP > 0) {
                        ctx.globalAlpha = arrowP * 0.6;
                        ctx.strokeStyle = '#14b8a6';
                        ctx.lineWidth = 1;
                        ctx.setLineDash([3, 3]);
                        const gapX = margin.left + 60;
                        ctx.beginPath();
                        ctx.moveTo(gapX, dryY + 15);
                        ctx.lineTo(gapX + 16, wetY - 15);
                        ctx.stroke();
                        ctx.setLineDash([]);
                        ctx.fillStyle = '#14b8a6';
                        ctx.font = 'italic 9px -apple-system, sans-serif';
                        ctx.textAlign = 'left';
                        ctx.fillText('short time offset', gapX + 22, (dryY + wetY) / 2 + 2);
                        ctx.globalAlpha = 1;
                    }
                }
            }

            // ===== LFO visualisation (phase 3) =====
            if (f >= PHASE_3 && f < PHASE_4 + 30) {
                const p3 = progress(f, PHASE_3 + 10, 25)
                    * clamp(1 - (f - (PHASE_4 + 10)) / 25, 0, 1);
                if (p3 > 0) {
                    ctx.globalAlpha = p3;
                    // Small sine above the wet row
                    ctx.strokeStyle = '#14b8a6';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    const lfoX = W - margin.right - 70;
                    const lfoY = wetY - 28;
                    for (let i = 0; i <= 60; i++) {
                        const nx = lfoX + i;
                        const ny = lfoY + Math.sin(i * 0.25 + f * 0.05) * 4;
                        if (i === 0) ctx.moveTo(nx, ny);
                        else ctx.lineTo(nx, ny);
                    }
                    ctx.stroke();
                    ctx.fillStyle = '#14b8a6';
                    ctx.font = 'italic 8px -apple-system, sans-serif';
                    ctx.textAlign = 'right';
                    ctx.fillText('LFO', lfoX - 4, lfoY + 3);
                    ctx.globalAlpha = 1;
                }
            }

            // ===== Summed display (phase 4) =====
            if (f >= PHASE_4) {
                const sumP = progress(f, PHASE_4, 40);
                const lfoOffset = Math.sin(f * 0.018) * 2.5;
                drawVocalLine(ctx, margin.left, sumY, plotW, f, 0, 0, '#374151', 0.8 * sumP, 1);
                drawVocalLine(ctx, margin.left, sumY, plotW, f, 16, lfoOffset, '#14b8a6', 0.6 * sumP, 1);

                // Envelope halo around summed line showing "thicker"
                ctx.globalAlpha = sumP * 0.2;
                ctx.strokeStyle = '#14b8a6';
                ctx.lineWidth = 8;
                ctx.beginPath();
                for (let i = 0; i <= 200; i += 4) {
                    const px = margin.left + (i / 200) * plotW;
                    const py = sumY;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.stroke();
                ctx.globalAlpha = 1;

                // Annotation
                const annP = progress(f, PHASE_4 + 20, 25)
                    * clamp(1 - (f - (CYCLE - 60)) / 30, 0, 1);
                ctx.globalAlpha = annP;
                ctx.fillStyle = '#1a1a2e';
                ctx.font = 'italic 10px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('reads as one thicker, wider voice', W / 2, H - 30);
                ctx.globalAlpha = 1;
            }

            // Phase indicator
            const phase = f < PHASE_2 ? 'Dry vocal'
                : f < PHASE_3 ? 'Rigid copy'
                : f < PHASE_4 ? 'LFO'
                : 'Summed';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - 20, H - 10);

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

// Vocal-ish waveform with a drawProgress param (0..1) so phase 1 can stroke it on progressively
function drawVocalLine(ctx, x, y, w, frame, timeOffset, horizontalJitter, color, alpha, drawProgress) {
    if (drawProgress <= 0) return;
    const prev = ctx.globalAlpha;
    ctx.globalAlpha = prev * alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const samples = 200;
    const last = Math.floor(samples * drawProgress);
    for (let i = 0; i <= last; i++) {
        const px = x + (i / samples) * w + horizontalJitter;
        const phase = i * 0.12 + (frame + timeOffset) * 0.05;
        const env1 = Math.sin(i * 0.04 + frame * 0.01) * 0.5 + 0.5;
        const env2 = Math.sin(i * 0.08 + frame * 0.02) * 0.4 + 0.6;
        const amp = env1 * env2 * 20;
        const py = y + Math.sin(phase) * amp;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.globalAlpha = prev;
}
