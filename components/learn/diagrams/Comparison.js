'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: Graphic side builds → Parametric side builds → VS badge → use cases appear
export default function Comparison() {
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

        const CYCLE = 510;
        let animId;

        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);

        const draw = () => {
            frameRef.current = (frameRef.current + 1) % CYCLE;
            const f = frameRef.current;
            const t = f / 60;
            ctx.clearRect(0, 0, W, H);

            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            const halfW = W / 2 - 8;
            const divX = W / 2;

            // === Phase 1 (0-80): LEFT side — Graphic EQ ===
            const leftP = progress(f, 0, 50);
            if (leftP > 0) {
                ctx.globalAlpha = leftP;

                // Title
                ctx.fillStyle = '#f97316';
                ctx.font = 'bold 12px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Graphic EQ', halfW / 2 + 4, 28);

                // Strength badge
                ctx.fillStyle = '#f97316';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.fillText('Quick & Broad', halfW / 2 + 4, 44);

                // Mini graphic EQ
                const gBands = 8;
                const gMargin = 18;
                const gSlotW = (halfW - gMargin * 2) / gBands;
                const gCenterY = 110;

                for (let i = 0; i < gBands; i++) {
                    const x = gMargin + i * gSlotW + gSlotW / 2;
                    const sliderAppear = progress(f, 10 + i * 5, 20);
                    const target = Math.sin(i * 0.7 + t * 0.5) * 22 * sliderAppear;

                    // Track
                    ctx.strokeStyle = '#e5e7eb';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(x, gCenterY - 30);
                    ctx.lineTo(x, gCenterY + 30);
                    ctx.stroke();

                    // Thumb
                    ctx.fillStyle = '#f97316';
                    ctx.beginPath();
                    ctx.roundRect(x - 5, gCenterY - target - 3, 10, 6, 2);
                    ctx.fill();
                }

                ctx.globalAlpha = 1;
            }

            // === Phase 2 (100-180): RIGHT side — Parametric EQ ===
            const rightP = progress(f, 100, 50);
            if (rightP > 0) {
                ctx.globalAlpha = rightP;
                const rOffset = divX + 8;

                // Title
                ctx.fillStyle = '#2563EB';
                ctx.font = 'bold 12px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Parametric EQ', rOffset + halfW / 2 - 4, 28);

                // Strength badge
                ctx.fillStyle = '#2563EB';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.fillText('Precise & Surgical', rOffset + halfW / 2 - 4, 44);

                // Mini parametric curve
                const pCenterY = 110;
                const pMargin = 12;
                const pW = halfW - pMargin * 2;

                // Zero line
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(rOffset + pMargin, pCenterY);
                ctx.lineTo(rOffset + pMargin + pW, pCenterY);
                ctx.stroke();

                // Animated notch + boost
                const notchPos = 0.35 + 0.03 * Math.sin(t * 0.3);
                const boostPos = 0.7 + 0.03 * Math.sin(t * 0.4);

                ctx.strokeStyle = '#2563EB';
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let px = 0; px <= pW; px++) {
                    const nx = px / pW;
                    const notch = -0.6 * Math.exp(-20 * Math.pow(nx - notchPos, 2));
                    const boost = 0.4 * Math.exp(-3 * Math.pow(nx - boostPos, 2));
                    const y = pCenterY - (notch + boost) * 40 * rightP;
                    if (px === 0) ctx.moveTo(rOffset + pMargin + px, y);
                    else ctx.lineTo(rOffset + pMargin + px, y);
                }
                ctx.stroke();

                // Control dots
                ctx.fillStyle = '#2563EB';
                ctx.beginPath();
                ctx.arc(rOffset + pMargin + notchPos * pW, pCenterY + 24 * rightP, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(rOffset + pMargin + boostPos * pW, pCenterY - 16 * rightP, 3, 0, Math.PI * 2);
                ctx.fill();

                // Labels on dots
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('Notch cut', rOffset + pMargin + notchPos * pW + 6, pCenterY + 28 * rightP);
                ctx.fillText('Shelf boost', rOffset + pMargin + boostPos * pW + 6, pCenterY - 20 * rightP);

                ctx.globalAlpha = 1;
            }

            // === Phase 3 (200-240): VS badge + divider ===
            const vsP = progress(f, 200, 30);
            if (vsP > 0) {
                // Divider line
                ctx.globalAlpha = vsP * 0.3;
                ctx.strokeStyle = '#d1d5db';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(divX, 55);
                ctx.lineTo(divX, H - 10);
                ctx.stroke();

                // VS badge
                ctx.globalAlpha = vsP;
                ctx.fillStyle = '#1A1A2E';
                ctx.beginPath();
                ctx.arc(divX, 28, 13, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('VS', divX, 31);
                ctx.globalAlpha = 1;
            }

            // === Phase 4 (260-400): Use cases appear line by line ===
            const leftCases = [
                { text: 'Live sound', icon: '🎤' },
                { text: 'DJ booth monitoring', icon: '🎧' },
                { text: 'Room correction', icon: '🏠' },
                { text: 'Quick tonal fixes', icon: '⚡' },
            ];
            const rightCases = [
                { text: 'Mix engineering', icon: '🎚' },
                { text: 'Mastering', icon: '💿' },
                { text: 'Removing resonances', icon: '🔍' },
                { text: 'Surgical corrections', icon: '🎯' },
            ];

            leftCases.forEach((c, i) => {
                const caseP = progress(f, 260 + i * 20, 20);
                if (caseP <= 0) return;
                ctx.globalAlpha = caseP;
                const y = 152 + i * 22;
                ctx.fillStyle = '#374151';
                ctx.font = '10px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(`${c.icon}  ${c.text}`, 18, y);
                ctx.globalAlpha = 1;
            });

            rightCases.forEach((c, i) => {
                const caseP = progress(f, 280 + i * 20, 20);
                if (caseP <= 0) return;
                ctx.globalAlpha = caseP;
                const y = 152 + i * 22;
                ctx.fillStyle = '#374151';
                ctx.font = '10px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(`${c.icon}  ${c.text}`, divX + 14, y);
                ctx.globalAlpha = 1;
            });

            // === Phase 5 (420+): Summary labels ===
            const summaryP = progress(f, 420, 30);
            if (summaryP > 0) {
                ctx.globalAlpha = summaryP;

                ctx.fillStyle = '#f97316';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Speed over precision', halfW / 2 + 4, H - 14);

                ctx.fillStyle = '#2563EB';
                ctx.fillText('Precision over speed', divX + halfW / 2 + 4, H - 14);

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
