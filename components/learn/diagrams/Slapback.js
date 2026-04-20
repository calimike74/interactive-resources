'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: tape reels appear → dry signal enters tape → one repeat emerges at ~80 ms → "feedback = 0%" shown, no further repeats
export default function Slapback() {
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

        const CYCLE = 500;
        let animId;

        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) =>
            clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);

        const PHASE_1 = 20;   // tape reels appear
        const PHASE_2 = 100;  // dry signal enters
        const PHASE_3 = 200;  // single repeat emerges
        const PHASE_4 = 340;  // feedback = 0 annotation

        const reelY = 75;
        const leftReelX = 105;
        const rightReelX = 375;
        const reelR = 30;

        const tlY = 185;
        const tlStart = 50;
        const tlEnd = W - 30;

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
            ctx.fillText('Slapback — single short repeat, no feedback', W / 2, 20);
            ctx.globalAlpha = 1;

            // ===== Phase 1: Tape reels appear =====
            const reelP = progress(f, PHASE_1, 30);
            if (reelP > 0) {
                ctx.globalAlpha = reelP;

                // Tape line
                ctx.strokeStyle = '#9ca3af';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(leftReelX + reelR, reelY);
                ctx.lineTo(rightReelX - reelR, reelY);
                ctx.stroke();

                // Playback head mark
                const headX = (leftReelX + rightReelX) / 2;
                ctx.strokeStyle = '#6b7280';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(headX - 4, reelY - 6);
                ctx.lineTo(headX - 4, reelY + 6);
                ctx.lineTo(headX + 4, reelY + 6);
                ctx.lineTo(headX + 4, reelY - 6);
                ctx.stroke();
                ctx.fillStyle = '#6b7280';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('playback head', headX, reelY + 22);

                drawReel(ctx, leftReelX, reelY, reelR, f * 0.04);
                drawReel(ctx, rightReelX, reelY, reelR, f * 0.04);

                ctx.globalAlpha = 1;
            }

            // ===== Phase 2: Dry signal travels along tape =====
            if (f >= PHASE_2) {
                const travelFrame = (f - PHASE_2) % 200;
                const travelP = travelFrame / 200;

                // Dry hit fires (restarts with each travel cycle)
                const hitEnv = burstEnv(travelFrame, 30);
                if (hitEnv > 0) {
                    drawWavelet(ctx, leftReelX + reelR + 10, reelY, 18 * hitEnv, '#374151', 1);
                }

                // Travelling marker dot
                if (travelFrame > 5 && travelFrame < 140) {
                    const startX = leftReelX + reelR;
                    const endX = rightReelX - reelR;
                    const x = startX + (endX - startX) * (travelP * 1.42); // moves across
                    if (x < endX) {
                        ctx.fillStyle = '#374151';
                        ctx.globalAlpha = 0.8;
                        ctx.beginPath();
                        ctx.arc(x, reelY, 3.5, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.globalAlpha = 1;
                    }
                }
            }

            // ===== Timeline at bottom (phase 3 onwards) =====
            if (f >= PHASE_3) {
                const tlP = progress(f, PHASE_3, 25);
                ctx.globalAlpha = tlP;
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(tlStart, tlY);
                ctx.lineTo(tlEnd, tlY);
                ctx.stroke();

                // Dry hit on timeline
                drawWavelet(ctx, tlStart + 50, tlY, 22, '#374151', 1);
                ctx.fillStyle = '#374151';
                ctx.font = '9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('dry', tlStart + 50, tlY + 36);

                // Slapback repeat
                const repP = progress(f, PHASE_3 + 20, 25);
                if (repP > 0) {
                    const repX = tlStart + 200;
                    drawWavelet(ctx, repX, tlY, 20 * repP, '#14b8a6', 0.9);

                    // Gap annotation
                    ctx.globalAlpha = tlP * repP;
                    ctx.fillStyle = '#14b8a6';
                    ctx.font = '9px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('+80 ms', (tlStart + 50 + repX) / 2, tlY - 26);
                    ctx.fillText('single repeat', repX, tlY + 36);

                    // Bracket
                    ctx.strokeStyle = '#9ca3af';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(tlStart + 50, tlY - 18);
                    ctx.lineTo(tlStart + 50, tlY - 14);
                    ctx.lineTo(repX, tlY - 14);
                    ctx.lineTo(repX, tlY - 18);
                    ctx.stroke();
                    ctx.globalAlpha = tlP;
                }

                ctx.globalAlpha = 1;
            }

            // ===== Phase 4: "feedback = 0%" — chain stops =====
            if (f >= PHASE_4) {
                const p4 = progress(f, PHASE_4, 30);
                ctx.globalAlpha = p4;

                const stopX = tlStart + 280;

                // Dotted line indicating what feedback WOULD do
                ctx.strokeStyle = '#d1d5db';
                ctx.setLineDash([3, 3]);
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(stopX, tlY);
                ctx.lineTo(tlEnd - 20, tlY);
                ctx.stroke();
                ctx.setLineDash([]);

                // Red X indicating chain stops
                ctx.strokeStyle = '#DC2626';
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.moveTo(stopX - 5, tlY - 5);
                ctx.lineTo(stopX + 5, tlY + 5);
                ctx.moveTo(stopX + 5, tlY - 5);
                ctx.lineTo(stopX - 5, tlY + 5);
                ctx.stroke();

                ctx.fillStyle = '#DC2626';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('feedback = 0%', stopX + 10, tlY + 2);
                ctx.fillStyle = '#6b7280';
                ctx.font = 'italic 9px -apple-system, sans-serif';
                ctx.fillText('no chain, no further repeats', stopX + 10, tlY + 14);

                ctx.globalAlpha = 1;
            }

            // Phase indicator
            const phase = f < PHASE_2 ? 'Tape'
                : f < PHASE_3 ? 'Signal'
                : f < PHASE_4 ? 'Repeat'
                : 'No feedback';
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

function drawReel(ctx, x, y, r, rotation) {
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#374151';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) {
        const angle = rotation + (i * Math.PI * 2) / 5;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(angle) * 7, y + Math.sin(angle) * 7);
        ctx.lineTo(x + Math.cos(angle) * (r - 4), y + Math.sin(angle) * (r - 4));
        ctx.stroke();
    }
}

function burstEnv(local, duration) {
    if (local < 0 || local > duration) return 0;
    const t = local / duration;
    return Math.pow(1 - t, 2.5);
}

function drawWavelet(ctx, x, y, amplitude, color, alpha) {
    const prev = ctx.globalAlpha;
    ctx.globalAlpha = prev * alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const width = 18;
    for (let dx = -width; dx <= width; dx++) {
        const env = Math.exp(-Math.abs(dx) / 7);
        const yOffset = Math.sin(dx * 0.8) * amplitude * env;
        const px = x + dx;
        const py = y + yOffset;
        if (dx === -width) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.globalAlpha = prev;
}
