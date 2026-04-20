'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: dry signal draws → delay creates the wet repeat (with arrow + label) → wet/dry mix demonstrated via live slider → bypass toggle shows effect off
export default function DelayBasics() {
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
        const progress = (frame, start, dur) =>
            clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);

        // Layout
        const margin = { left: 70, right: 30 };
        const plotW = W - margin.left - margin.right;
        const dryY = 80;
        const wetY = 170;
        const timelineLen = 200; // frames-worth of timeline represented on the x-axis
        const pxPerFrame = plotW / timelineLen;
        const hits = [40, 130]; // dry hits in frame units
        const DELAY_FRAMES = 35;

        // Phase boundaries
        const PHASE_1_START = 20;
        const PHASE_2_START = 110;
        const PHASE_3_START = 240;
        const PHASE_4_START = 370;
        const PHASE_4_TOGGLE = 410;

        const draw = () => {
            frameRef.current = (frameRef.current + 0.6) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            // ===== Title =====
            const titleP = progress(f, 0, 25);
            ctx.globalAlpha = titleP;
            ctx.fillStyle = '#1a1a2e';
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('What Delay Does', W / 2, 22);
            ctx.globalAlpha = 1;

            // ===== Baselines (both timelines) =====
            const baseP = progress(f, 10, 30);
            if (baseP > 0) {
                ctx.globalAlpha = baseP;
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(margin.left, dryY);
                ctx.lineTo(W - margin.right, dryY);
                ctx.moveTo(margin.left, wetY);
                ctx.lineTo(W - margin.right, wetY);
                ctx.stroke();

                ctx.fillStyle = '#374151';
                ctx.font = 'bold 10px -apple-system, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText('DRY', margin.left - 10, dryY + 4);

                // WET label greys out until phase 2
                ctx.fillStyle = f < PHASE_2_START ? '#d1d5db' : '#14b8a6';
                ctx.fillText('WET', margin.left - 10, wetY + 4);
                ctx.textAlign = 'left';
                ctx.globalAlpha = 1;
            }

            // Compute wet amplitude modifier from phases 3 and 4
            let wetScale = 1.0;
            let wetGlobalAlpha = 1.0;

            // Phase 3: animated wet/dry slider
            if (f >= PHASE_3_START && f < PHASE_4_START) {
                const sliderCyc = (f - PHASE_3_START) / 70;
                wetScale = 0.2 + 0.9 * Math.abs(Math.sin(sliderCyc * Math.PI));
            }

            // Phase 4: bypass toggles wet off at PHASE_4_TOGGLE
            let bypassOn = false;
            if (f >= PHASE_4_TOGGLE) {
                bypassOn = true;
                wetGlobalAlpha = clamp(1 - (f - PHASE_4_TOGGLE) / 15, 0, 1);
            }

            // ===== Dry waveforms (visible from phase 1 onwards, animate in) =====
            if (f >= PHASE_1_START) {
                hits.forEach((hitStart, i) => {
                    const appear = progress(f, PHASE_1_START + i * 25, 30);
                    if (appear > 0) {
                        const x = margin.left + hitStart * pxPerFrame;
                        drawWavelet(ctx, x, dryY, 24 * appear, '#374151', 1);
                    }
                });
            }

            // "input" annotation (phase 1 only, fades out)
            const inP = progress(f, 60, 25) * clamp(1 - (f - 105) / 15, 0, 1);
            if (inP > 0) {
                ctx.globalAlpha = inP * 0.8;
                ctx.fillStyle = '#6b7280';
                ctx.font = 'italic 9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('input signal →', margin.left, dryY - 22);
                ctx.globalAlpha = 1;
            }

            // ===== Wet waveforms (visible from phase 2 onwards) =====
            if (f >= PHASE_2_START) {
                ctx.globalAlpha = wetGlobalAlpha;
                hits.forEach((hitStart, i) => {
                    const appear = progress(f, PHASE_2_START + 10 + i * 20, 35);
                    if (appear > 0) {
                        const x = margin.left + (hitStart + DELAY_FRAMES) * pxPerFrame;
                        drawWavelet(ctx, x, wetY, 20 * appear * wetScale, '#14b8a6', 0.9);
                    }
                });
                ctx.globalAlpha = 1;
            }

            // ===== Phase 2 annotation: dashed arrow + "+80 ms" label =====
            if (f >= PHASE_2_START) {
                const arrowFade = progress(f, PHASE_2_START + 5, 25)
                    * clamp(1 - (f - (PHASE_3_START - 20)) / 20, 0, 1);
                if (arrowFade > 0) {
                    ctx.globalAlpha = arrowFade * 0.7;
                    const x1 = margin.left + hits[0] * pxPerFrame;
                    const x2 = margin.left + (hits[0] + DELAY_FRAMES) * pxPerFrame;

                    ctx.strokeStyle = '#14b8a6';
                    ctx.lineWidth = 1.3;
                    ctx.setLineDash([3, 3]);
                    ctx.beginPath();
                    ctx.moveTo(x1, dryY + 20);
                    ctx.bezierCurveTo(
                        x1 + 10, dryY + 55,
                        x2 - 10, wetY - 55,
                        x2, wetY - 20
                    );
                    ctx.stroke();
                    ctx.setLineDash([]);

                    // Arrowhead
                    ctx.fillStyle = '#14b8a6';
                    ctx.beginPath();
                    ctx.moveTo(x2, wetY - 18);
                    ctx.lineTo(x2 - 4, wetY - 25);
                    ctx.lineTo(x2 + 4, wetY - 25);
                    ctx.closePath();
                    ctx.fill();

                    // Delay-time label alongside arrow
                    ctx.fillStyle = '#14b8a6';
                    ctx.font = 'bold 9px -apple-system, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText('+80 ms', x1 + 14, (dryY + wetY) / 2 + 2);
                    ctx.globalAlpha = 1;
                }

                // Caption "the dry is not replaced — the repeat sits alongside"
                const capP = progress(f, PHASE_2_START + 30, 25)
                    * clamp(1 - (f - (PHASE_3_START - 20)) / 20, 0, 1);
                if (capP > 0) {
                    ctx.globalAlpha = capP;
                    ctx.fillStyle = '#374151';
                    ctx.font = 'italic 9px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('dry is not replaced — repeat sits alongside it', W / 2, wetY + 40);
                    ctx.globalAlpha = 1;
                }
            }

            // ===== Phase 3 overlay: live wet/dry slider =====
            if (f >= PHASE_3_START && f < PHASE_4_START) {
                const p3 = progress(f, PHASE_3_START, 20)
                    * clamp(1 - (f - (PHASE_4_START - 20)) / 20, 0, 1);
                ctx.globalAlpha = p3;

                const sX = W - 140;
                const sY = 220;
                const sW = 110;
                const sH = 22;

                // Slider frame
                ctx.strokeStyle = '#14b8a6';
                ctx.fillStyle = '#ffffff';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.roundRect(sX, sY, sW, sH, 4);
                ctx.fill();
                ctx.stroke();

                // Slider track
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(sX + 10, sY + sH / 2);
                ctx.lineTo(sX + sW - 10, sY + sH / 2);
                ctx.stroke();

                // Slider thumb animates left/right in sync with wetScale
                const thumbX = sX + 10 + wetScale * (sW - 20);
                ctx.fillStyle = '#14b8a6';
                ctx.beginPath();
                ctx.arc(thumbX, sY + sH / 2, 6, 0, Math.PI * 2);
                ctx.fill();

                // Labels
                ctx.fillStyle = '#14b8a6';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('WET / DRY MIX', sX + sW / 2, sY - 5);

                ctx.fillStyle = '#9ca3af';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('dry', sX + 4, sY + sH + 10);
                ctx.textAlign = 'right';
                ctx.fillText('wet', sX + sW - 4, sY + sH + 10);

                ctx.globalAlpha = 1;
            }

            // ===== Phase 4 overlay: bypass button + struck-through wet label =====
            if (f >= PHASE_4_START) {
                const p4 = progress(f, PHASE_4_START, 20);
                ctx.globalAlpha = p4;

                const bX = W - 140;
                const bY = 220;
                const bW = 110;
                const bH = 22;

                ctx.strokeStyle = bypassOn ? '#DC2626' : '#14b8a6';
                ctx.fillStyle = bypassOn ? '#FEF2F2' : '#ffffff';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.roundRect(bX, bY, bW, bH, 4);
                ctx.fill();
                ctx.stroke();

                // Toggle dot — slides right when bypass engages
                const togglePos = bypassOn
                    ? clamp((f - PHASE_4_TOGGLE) / 12, 0, 1)
                    : 0;
                const toggleX = bX + 8 + togglePos * (bW - 16);
                ctx.fillStyle = bypassOn ? '#DC2626' : '#14b8a6';
                ctx.beginPath();
                ctx.arc(toggleX, bY + bH / 2, 6, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = bypassOn ? '#DC2626' : '#14b8a6';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('BYPASS', bX + bW / 2, bY - 5);

                // Supporting label that changes with the toggle state
                ctx.fillStyle = '#9ca3af';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(
                    bypassOn ? 'effect off — only dry is heard' : 'effect on — hearing both',
                    bX + bW / 2,
                    bY + bH + 12
                );

                // Strike-through over WET label when bypass on
                if (bypassOn) {
                    const strikeP = clamp((f - PHASE_4_TOGGLE) / 10, 0, 1);
                    ctx.strokeStyle = '#DC2626';
                    ctx.lineWidth = 1.8;
                    ctx.beginPath();
                    ctx.moveTo(margin.left - 28, wetY);
                    ctx.lineTo(margin.left - 28 + strikeP * 24, wetY);
                    ctx.stroke();
                }

                ctx.globalAlpha = 1;
            }

            // ===== Time axis arrow =====
            const timeAxisP = progress(f, 50, 30);
            if (timeAxisP > 0) {
                ctx.globalAlpha = timeAxisP * 0.6;
                ctx.fillStyle = '#9ca3af';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('time →', W / 2, H - 10);
                ctx.globalAlpha = 1;
            }

            // ===== Phase indicator (bottom-right) =====
            const phase = f < PHASE_2_START ? 'Dry signal'
                : f < PHASE_3_START ? 'Delay'
                : f < PHASE_4_START ? 'Wet/dry mix'
                : 'Bypass';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - 20, H - 10);

            // ===== End-of-cycle fade-out =====
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

// Short damped sinusoid burst centred on (x, y).
// Preserves the caller's globalAlpha by multiplying with `alpha`.
function drawWavelet(ctx, x, y, amplitude, color, alpha) {
    const prev = ctx.globalAlpha;
    ctx.globalAlpha = prev * alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const width = 22;
    for (let dx = -width; dx <= width; dx++) {
        const env = Math.exp(-Math.abs(dx) / 8);
        const yOffset = Math.sin(dx * 0.7) * amplitude * env;
        const px = x + dx;
        const py = y + yOffset;
        if (dx === -width) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.globalAlpha = prev;
}
