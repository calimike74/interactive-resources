'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: single peak appears → Q label shows → Q narrows step by step → bandwidth arrows track
export default function QFactor() {
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
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);
        const lerp = (a, b, t) => a + (b - a) * t;

        const draw = () => {
            frameRef.current = (frameRef.current + 1) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);

            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            const centerX = W / 2;
            const centerY = H / 2 + 20;
            const plotH = 120;
            const bellW = W - 80;

            // Zero line
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(40, centerY);
            ctx.lineTo(W - 40, centerY);
            ctx.stroke();

            // Q stages — step through discrete values
            const stages = [
                { q: 0.8, label: 'Q = 0.8', desc: 'Very wide — affects many frequencies', start: 30, color: '#2563EB' },
                { q: 2, label: 'Q = 2.0', desc: 'Moderate width', start: 120, color: '#7c3aed' },
                { q: 5, label: 'Q = 5.0', desc: 'Narrow — more surgical', start: 210, color: '#f97316' },
                { q: 12, label: 'Q = 12.0', desc: 'Very narrow — targets one frequency', start: 300, color: '#DC2626' },
            ];

            // Find active stage
            let activeIdx = -1;
            for (let i = stages.length - 1; i >= 0; i--) {
                if (f >= stages[i].start) { activeIdx = i; break; }
            }

            if (activeIdx < 0) {
                // Phase 0: empty plot, just the axis
                animId = requestAnimationFrame(draw);
                return;
            }

            const stage = stages[activeIdx];
            const stageP = progress(f, stage.start, 50);

            // Previous stage Q (for smooth transition)
            const prevQ = activeIdx > 0 ? stages[activeIdx - 1].q : stage.q;
            const q = lerp(prevQ, stage.q, stageP);

            // Draw ghost curves for previous stages
            stages.forEach((s, i) => {
                if (i >= activeIdx) return;
                ctx.strokeStyle = s.color;
                ctx.lineWidth = 1;
                ctx.globalAlpha = 0.15;
                ctx.beginPath();
                for (let px = 0; px <= bellW; px++) {
                    const nx = (px / bellW) * 2 - 1;
                    const response = Math.exp(-s.q * nx * nx);
                    const y = centerY - response * plotH * 0.7;
                    if (px === 0) ctx.moveTo(40 + px, y);
                    else ctx.lineTo(40 + px, y);
                }
                ctx.stroke();
                ctx.globalAlpha = 1;
            });

            // Draw active curve
            ctx.strokeStyle = stage.color;
            ctx.lineWidth = 2.5;
            ctx.globalAlpha = stageP;
            ctx.beginPath();
            for (let px = 0; px <= bellW; px++) {
                const nx = (px / bellW) * 2 - 1;
                const response = Math.exp(-q * nx * nx);
                const y = centerY - response * plotH * 0.7;
                if (px === 0) ctx.moveTo(40 + px, y);
                else ctx.lineTo(40 + px, y);
            }
            ctx.stroke();

            // Fill under active curve
            ctx.fillStyle = stage.color.replace(')', ', 0.06)').replace('rgb', 'rgba').replace('#', '');
            // Use hex alpha instead
            ctx.fillStyle = stage.color + '0F';
            ctx.beginPath();
            ctx.moveTo(40, centerY);
            for (let px = 0; px <= bellW; px++) {
                const nx = (px / bellW) * 2 - 1;
                const response = Math.exp(-q * nx * nx);
                const y = centerY - response * plotH * 0.7;
                ctx.lineTo(40 + px, y);
            }
            ctx.lineTo(40 + bellW, centerY);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1;

            // Bandwidth arrows at -3dB
            const halfPowerWidth = Math.sqrt(1 / q);
            const halfPowerY = centerY - Math.exp(-1) * plotH * 0.7;
            const arrowXLeft = centerX - halfPowerWidth * (bellW / 2);
            const arrowXRight = centerX + halfPowerWidth * (bellW / 2);

            if (arrowXLeft > 42 && arrowXRight < W - 42) {
                ctx.globalAlpha = stageP;
                ctx.strokeStyle = '#6b7280';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(arrowXLeft, halfPowerY);
                ctx.lineTo(arrowXRight, halfPowerY);
                ctx.stroke();
                ctx.setLineDash([]);

                // Arrow heads
                ctx.fillStyle = '#6b7280';
                ctx.beginPath();
                ctx.moveTo(arrowXLeft, halfPowerY);
                ctx.lineTo(arrowXLeft + 5, halfPowerY - 3);
                ctx.lineTo(arrowXLeft + 5, halfPowerY + 3);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(arrowXRight, halfPowerY);
                ctx.lineTo(arrowXRight - 5, halfPowerY - 3);
                ctx.lineTo(arrowXRight - 5, halfPowerY + 3);
                ctx.fill();

                // Bandwidth label
                ctx.font = '9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('bandwidth (−3dB)', (arrowXLeft + arrowXRight) / 2, halfPowerY - 8);
                ctx.globalAlpha = 1;
            }

            // Q value display — large and clear
            ctx.fillStyle = stage.color;
            ctx.font = 'bold 22px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(stage.label, W / 2, 28);

            // Description
            ctx.fillStyle = '#374151';
            ctx.font = '11px -apple-system, sans-serif';
            ctx.fillText(stage.desc, W / 2, 46);

            // Stage indicators (dots showing progression)
            stages.forEach((s, i) => {
                const dotX = W / 2 - 30 + i * 20;
                const dotY = H - 16;
                ctx.fillStyle = i <= activeIdx ? s.color : '#d1d5db';
                ctx.beginPath();
                ctx.arc(dotX, dotY, i === activeIdx ? 4 : 3, 0, Math.PI * 2);
                ctx.fill();
            });

            // Centre frequency label
            ctx.fillStyle = '#9ca3af';
            ctx.font = '9px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Centre Frequency', centerX, centerY + 20);

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
