'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: parallel diagram builds → signal flows → then series builds → signal flows → comparison labels
export default function Routing() {
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

        const CYCLE = 540;
        let animId;

        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);

        const drawRR = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };

        const draw = () => {
            frameRef.current = (frameRef.current + 1) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);

            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            // ======== TOP: PARALLEL (Graphic EQ) ========
            const topY = 52;
            const pBands = ['125Hz', '500Hz', '1kHz', '4kHz'];
            const bandW = 44;
            const bandStartX = 108;
            const bandGap = 56;

            // --- Phase 1 (0-60): Title + input/output boxes ---
            const p1 = progress(f, 0, 40);
            ctx.globalAlpha = p1;

            ctx.fillStyle = '#374151';
            ctx.font = 'bold 10px -apple-system, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('PARALLEL ROUTING', 20, 20);
            ctx.fillStyle = '#f97316';
            ctx.font = '9px -apple-system, sans-serif';
            ctx.fillText('Graphic EQ', 145, 20);

            // Input box
            ctx.fillStyle = '#e5e7eb';
            drawRR(20, topY, 48, 22, 4); ctx.fill();
            ctx.fillStyle = '#6b7280';
            ctx.font = '9px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('IN', 44, topY + 14);

            // Output box
            ctx.fillStyle = '#e5e7eb';
            drawRR(W - 68, topY, 48, 22, 4); ctx.fill();
            ctx.fillStyle = '#6b7280';
            ctx.fillText('OUT', W - 44, topY + 14);

            ctx.globalAlpha = 1;

            // --- Phase 2 (40-120): Band boxes appear one by one ---
            pBands.forEach((freq, i) => {
                const boxP = progress(f, 40 + i * 15, 25);
                if (boxP <= 0) return;

                const bx = bandStartX + i * bandGap;
                ctx.globalAlpha = boxP;

                // Connectors
                ctx.strokeStyle = '#d1d5db';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(68, topY + 11);
                ctx.lineTo(bx, topY + 11);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(bx + bandW, topY + 11);
                ctx.lineTo(W - 68, topY + 11);
                ctx.stroke();

                // Box
                ctx.fillStyle = '#fff';
                ctx.strokeStyle = '#f97316';
                ctx.lineWidth = 1;
                drawRR(bx, topY, bandW, 22, 4);
                ctx.fill(); ctx.stroke();
                ctx.fillStyle = '#f97316';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(freq, bx + bandW / 2, topY + 14);

                ctx.globalAlpha = 1;
            });

            // --- Phase 3 (130-210): Signal dots flow through parallel paths ---
            if (f >= 130 && f < 350) {
                const signalPhase = ((f - 130) % 60) / 60;
                pBands.forEach((_, i) => {
                    const bx = bandStartX + i * bandGap;
                    let dotX;
                    if (signalPhase < 0.25) {
                        dotX = 68 + (signalPhase / 0.25) * (bx - 68);
                    } else if (signalPhase < 0.75) {
                        dotX = bx + ((signalPhase - 0.25) / 0.5) * bandW;
                    } else {
                        dotX = bx + bandW + ((signalPhase - 0.75) / 0.25) * (W - 68 - bx - bandW);
                    }
                    ctx.fillStyle = '#f97316';
                    ctx.beginPath();
                    ctx.arc(dotX, topY + 11, 3, 0, Math.PI * 2);
                    ctx.fill();
                });
            }

            // Parallel annotation
            const parallelLabel = progress(f, 160, 25);
            if (parallelLabel > 0) {
                ctx.globalAlpha = parallelLabel;
                ctx.fillStyle = '#059669';
                ctx.font = 'bold 8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('All bands process simultaneously', W / 2, topY + 36);
                ctx.fillText('✓ No cumulative phase shift', W / 2, topY + 48);
                ctx.globalAlpha = 1;
            }

            // ======== BOTTOM: SERIES (Parametric EQ) ========
            const botY = 178;
            const sBands = ['Band 1', 'Band 2', 'Band 3', 'Band 4'];
            const sStartX = 96;
            const sGap = 76;

            // --- Phase 4 (220-280): Series title + boxes build left to right ---
            const p4 = progress(f, 220, 30);
            ctx.globalAlpha = p4;

            ctx.fillStyle = '#374151';
            ctx.font = 'bold 10px -apple-system, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('SERIES ROUTING', 20, botY - 32);
            ctx.fillStyle = '#2563EB';
            ctx.font = '9px -apple-system, sans-serif';
            ctx.fillText('Parametric EQ', 140, botY - 32);

            // Input
            ctx.fillStyle = '#e5e7eb';
            drawRR(20, botY, 48, 22, 4); ctx.fill();
            ctx.fillStyle = '#6b7280';
            ctx.font = '9px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('IN', 44, botY + 14);

            // Output
            ctx.fillStyle = '#e5e7eb';
            drawRR(W - 68, botY, 48, 22, 4); ctx.fill();
            ctx.fillStyle = '#6b7280';
            ctx.fillText('OUT', W - 44, botY + 14);

            ctx.globalAlpha = 1;

            sBands.forEach((name, i) => {
                const boxP = progress(f, 240 + i * 15, 25);
                if (boxP <= 0) return;

                const bx = sStartX + i * sGap;
                ctx.globalAlpha = boxP;

                // Connector from previous
                const prevEnd = i === 0 ? 68 : sStartX + (i - 1) * sGap + 50;
                ctx.strokeStyle = '#d1d5db';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(prevEnd, botY + 11);
                ctx.lineTo(bx, botY + 11);
                ctx.stroke();

                // Arrow
                ctx.fillStyle = '#d1d5db';
                ctx.beginPath();
                ctx.moveTo(bx, botY + 11);
                ctx.lineTo(bx - 4, botY + 7);
                ctx.lineTo(bx - 4, botY + 15);
                ctx.fill();

                // Box
                ctx.fillStyle = '#fff';
                ctx.strokeStyle = '#2563EB';
                ctx.lineWidth = 1;
                drawRR(bx, botY, 50, 22, 4);
                ctx.fill(); ctx.stroke();
                ctx.fillStyle = '#2563EB';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(name, bx + 25, botY + 14);

                // Phase label under each
                const phaseP = progress(f, 320 + i * 10, 20);
                if (phaseP > 0) {
                    ctx.globalAlpha = phaseP;
                    ctx.fillStyle = '#DC2626';
                    ctx.font = '8px -apple-system, sans-serif';
                    ctx.fillText(`+φ${i + 1}`, bx + 25, botY + 36);
                    ctx.globalAlpha = 1;
                }

                ctx.globalAlpha = 1;
            });

            // Last connector
            const lastBoxP = progress(f, 240 + 3 * 15, 25);
            if (lastBoxP > 0) {
                ctx.globalAlpha = lastBoxP;
                ctx.strokeStyle = '#d1d5db';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(sStartX + 3 * sGap + 50, botY + 11);
                ctx.lineTo(W - 68, botY + 11);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            // --- Phase 5 (340-420): Signal dot flows through series chain ---
            if (f >= 340 && f < 500) {
                const totalLen = W - 88;
                const signalPhase = ((f - 340) % 80) / 80;
                const dotX = 20 + signalPhase * totalLen;
                ctx.fillStyle = '#2563EB';
                ctx.beginPath();
                ctx.arc(dotX, botY + 11, 3.5, 0, Math.PI * 2);
                ctx.fill();
            }

            // Series annotation
            const seriesLabel = progress(f, 360, 25);
            if (seriesLabel > 0) {
                ctx.globalAlpha = seriesLabel;
                ctx.fillStyle = '#DC2626';
                ctx.font = 'bold 8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Signal passes through each band in sequence', W / 2, botY + 50);
                ctx.fillText('Cumulative phase shift: φ₁ + φ₂ + φ₃ + φ₄', W / 2, botY + 62);
                ctx.globalAlpha = 1;
            }

            // Fade out
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
