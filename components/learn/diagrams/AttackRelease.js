'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: signal crossing threshold → fast attack demo → slow attack demo → release behaviour
export default function AttackRelease() {
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

        const draw = () => {
            frameRef.current = (frameRef.current + 1) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);

            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            const margin = { left: 20, right: 20, top: 15, bottom: 20 };
            const plotW = W - margin.left - margin.right;
            const halfH = 125;

            // === TOP HALF: Fast Attack vs Slow Attack ===
            const topY = margin.top;

            // Threshold line (top section)
            const threshLevel = 0.4;
            const threshLineY = topY + halfH * (1 - threshLevel);

            // --- Phase 1 (0-60): Signal envelope crossing threshold ---
            const p1 = progress(f, 0, 50);

            if (p1 > 0) {
                ctx.globalAlpha = p1;

                // Threshold line
                ctx.strokeStyle = '#e85d75';
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(margin.left, threshLineY);
                ctx.lineTo(W - margin.right, threshLineY);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.fillStyle = '#e85d75';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('Threshold', margin.left + 2, threshLineY - 4);

                // Input signal envelope (a transient hit)
                ctx.strokeStyle = '#d1d5db';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                const sigPoints = 100;
                for (let i = 0; i <= sigPoints * p1; i++) {
                    const t = i / sigPoints;
                    let amp;
                    if (t < 0.05) amp = t / 0.05; // fast rise
                    else if (t < 0.15) amp = 1.0 - (t - 0.05) * 3; // quick decay
                    else if (t < 0.6) amp = 0.7 - (t - 0.15) * 0.5; // sustain/slow decay
                    else amp = 0.45 - (t - 0.6) * 1.0; // release
                    amp = clamp(amp, 0, 1);
                    const x = margin.left + t * plotW;
                    const y = topY + halfH * (1 - amp);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();

                ctx.fillStyle = '#6b7280';
                ctx.font = '9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('Input signal (transient hit)', margin.left, topY + halfH + 14);
                ctx.globalAlpha = 1;
            }

            // --- Phase 2 (80-200): Fast attack ---
            const p2 = progress(f, 80, 60);

            if (p2 > 0) {
                ctx.globalAlpha = p2;

                // Fast attack gain reduction — kicks in almost immediately
                ctx.strokeStyle = '#e85d75';
                ctx.lineWidth = 2;
                ctx.beginPath();
                const sigPoints = 100;
                for (let i = 0; i <= sigPoints; i++) {
                    const t = i / sigPoints;
                    let amp;
                    if (t < 0.05) amp = t / 0.05;
                    else if (t < 0.15) amp = 1.0 - (t - 0.05) * 3;
                    else if (t < 0.6) amp = 0.7 - (t - 0.15) * 0.5;
                    else amp = 0.45 - (t - 0.6) * 1.0;
                    amp = clamp(amp, 0, 1);

                    // Fast attack: compress almost immediately when above threshold
                    if (amp > threshLevel) {
                        const attackFactor = t < 0.07 ? (t - 0.05) / 0.02 : 1;
                        const excess = amp - threshLevel;
                        amp = threshLevel + excess * (1 - clamp(attackFactor, 0, 1) * 0.75);
                    }

                    const x = margin.left + t * plotW * 0.48;
                    const y = topY + halfH * (1 - amp);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();

                // Label
                ctx.fillStyle = '#e85d75';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Fast Attack', margin.left + plotW * 0.24, topY + 12);
                ctx.font = '8px -apple-system, sans-serif';
                ctx.fillStyle = '#6b7280';
                ctx.fillText('Clamps transient', margin.left + plotW * 0.24, topY + 23);

                ctx.globalAlpha = 1;
            }

            // --- Phase 3 (200-340): Slow attack ---
            const p3 = progress(f, 200, 60);

            if (p3 > 0) {
                ctx.globalAlpha = p3;

                // Slow attack gain reduction — lets transient through
                ctx.strokeStyle = '#2563EB';
                ctx.lineWidth = 2;
                ctx.beginPath();
                const sigPoints = 100;
                for (let i = 0; i <= sigPoints; i++) {
                    const t = i / sigPoints;
                    let amp;
                    if (t < 0.05) amp = t / 0.05;
                    else if (t < 0.15) amp = 1.0 - (t - 0.05) * 3;
                    else if (t < 0.6) amp = 0.7 - (t - 0.15) * 0.5;
                    else amp = 0.45 - (t - 0.6) * 1.0;
                    amp = clamp(amp, 0, 1);

                    // Slow attack: lets transient through, compresses later
                    if (amp > threshLevel) {
                        const attackFactor = t < 0.2 ? (t - 0.05) / 0.15 : 1;
                        const excess = amp - threshLevel;
                        amp = threshLevel + excess * (1 - clamp(attackFactor, 0, 1) * 0.75);
                    }

                    const x = margin.left + plotW * 0.52 + t * plotW * 0.48;
                    const y = topY + halfH * (1 - amp);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();

                // Label
                ctx.fillStyle = '#2563EB';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Slow Attack', margin.left + plotW * 0.76, topY + 12);
                ctx.font = '8px -apple-system, sans-serif';
                ctx.fillStyle = '#6b7280';
                ctx.fillText('Transient passes through', margin.left + plotW * 0.76, topY + 23);

                // Transient arrow
                const arrowX = margin.left + plotW * 0.54;
                ctx.strokeStyle = '#2563EB';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(arrowX, topY + halfH * 0.15);
                ctx.lineTo(arrowX, topY + halfH * 0.05);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(arrowX - 3, topY + halfH * 0.09);
                ctx.lineTo(arrowX, topY + halfH * 0.05);
                ctx.lineTo(arrowX + 3, topY + halfH * 0.09);
                ctx.stroke();

                ctx.globalAlpha = 1;
            }

            // === BOTTOM: Release behaviour ===
            // --- Phase 4 (340-440): Release illustration ---
            const p4 = progress(f, 340, 60);

            if (p4 > 0) {
                const botY = topY + halfH + 28;
                const botH = 80;
                ctx.globalAlpha = p4;

                // Gain reduction meter style
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('Gain Reduction Recovery (Release)', margin.left, botY - 2);

                // Fast release
                ctx.strokeStyle = '#e85d75';
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let i = 0; i <= 80; i++) {
                    const t = i / 80;
                    let gr;
                    if (t < 0.2) gr = 1; // full compression
                    else gr = Math.max(0, 1 - (t - 0.2) * 2.5); // fast release
                    const x = margin.left + t * plotW * 0.45;
                    const y = botY + (1 - gr) * botH;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();

                ctx.fillStyle = '#e85d75';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Fast Release', margin.left + plotW * 0.22, botY + botH + 14);

                // Slow release
                ctx.strokeStyle = '#2563EB';
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let i = 0; i <= 80; i++) {
                    const t = i / 80;
                    let gr;
                    if (t < 0.2) gr = 1;
                    else gr = Math.max(0, 1 - (t - 0.2) * 0.8); // slow release
                    const x = margin.left + plotW * 0.55 + t * plotW * 0.45;
                    const y = botY + (1 - gr) * botH;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();

                ctx.fillStyle = '#2563EB';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Slow Release', margin.left + plotW * 0.78, botY + botH + 14);

                // Zero line for gain reduction
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 0.5;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(margin.left, botY + botH);
                ctx.lineTo(W - margin.right, botY + botH);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.fillStyle = '#9ca3af';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText('0 dB GR', margin.left - 4, botY + botH + 3);

                ctx.globalAlpha = 1;
            }

            // Phase indicator
            const phase = f < 80 ? 'Signal' : f < 200 ? 'Fast Atk' : f < 340 ? 'Slow Atk' : 'Release';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - margin.right, H - 6);

            // Fade out at end
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
