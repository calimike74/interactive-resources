'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: waveform with wide dynamics → label quiet/loud → show range bracket → compressed version
export default function DynamicRange() {
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

        // Pre-generate a waveform envelope with dynamic variation
        const envPoints = 200;
        const envelope = [];
        for (let i = 0; i < envPoints; i++) {
            const t = i / envPoints;
            // Quiet section 0-0.25, loud 0.25-0.55, quiet 0.55-0.7, loud 0.7-0.9, quiet 0.9-1
            let amp;
            if (t < 0.2) amp = 0.15 + 0.08 * Math.sin(t * 40);
            else if (t < 0.22) amp = 0.15 + (0.85 - 0.15) * ((t - 0.2) / 0.02);
            else if (t < 0.48) amp = 0.85 + 0.1 * Math.sin(t * 20);
            else if (t < 0.52) amp = 0.85 - (0.85 - 0.2) * ((t - 0.48) / 0.04);
            else if (t < 0.68) amp = 0.2 + 0.06 * Math.sin(t * 35);
            else if (t < 0.72) amp = 0.2 + (0.75 - 0.2) * ((t - 0.68) / 0.04);
            else if (t < 0.88) amp = 0.75 + 0.08 * Math.sin(t * 25);
            else amp = 0.75 - (0.75 - 0.12) * ((t - 0.88) / 0.12);
            envelope.push(clamp(amp, 0.05, 1));
        }

        const drawWaveform = (x, y, w, h, env, color, alpha) => {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = color;
            for (let i = 0; i < env.length; i++) {
                const px = x + (i / env.length) * w;
                const barH = env[i] * h;
                ctx.fillRect(px, y + (h - barH) / 2, w / env.length - 0.5, barH);
            }
            ctx.globalAlpha = 1;
        };

        const draw = () => {
            frameRef.current = (frameRef.current + 1) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);

            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            const margin = { left: 20, right: 20, top: 30, bottom: 30 };
            const plotW = W - margin.left - margin.right;

            // --- Phase 1 (0-80): Draw original waveform ---
            const p1 = progress(f, 0, 60);

            if (p1 > 0) {
                // Title
                ctx.globalAlpha = p1;
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 10px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('Original Signal', margin.left, 18);
                ctx.globalAlpha = 1;

                const waveY = margin.top;
                const waveH = 90;
                const visibleCount = Math.floor(p1 * envelope.length);
                drawWaveform(margin.left, waveY, plotW, waveH, envelope.slice(0, visibleCount), '#e85d75', 0.7);
            }

            // --- Phase 2 (80-160): Label quiet and loud sections ---
            const p2 = progress(f, 80, 50);

            if (p2 > 0) {
                ctx.globalAlpha = p2;

                // Quiet labels
                ctx.fillStyle = '#9ca3af';
                ctx.font = '9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Quiet', margin.left + 0.1 * plotW, margin.top + 105);
                ctx.fillText('Quiet', margin.left + 0.6 * plotW, margin.top + 105);

                // Loud labels
                ctx.fillStyle = '#e85d75';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.fillText('LOUD', margin.left + 0.35 * plotW, margin.top + 105);
                ctx.fillText('LOUD', margin.left + 0.8 * plotW, margin.top + 105);

                ctx.globalAlpha = 1;
            }

            // --- Phase 3 (160-240): Show dynamic range bracket ---
            const p3 = progress(f, 160, 50);

            if (p3 > 0) {
                ctx.globalAlpha = p3;
                const bracketX = W - margin.right - 15;
                const topY = margin.top + 5;
                const midY = margin.top + 45;
                const bottomY = margin.top + 85;

                // Bracket lines
                ctx.strokeStyle = '#374151';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(bracketX - 6, topY);
                ctx.lineTo(bracketX, topY);
                ctx.lineTo(bracketX, bottomY);
                ctx.lineTo(bracketX - 6, bottomY);
                ctx.stroke();

                // Arrow and label
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 8px -apple-system, sans-serif';
                ctx.textAlign = 'right';
                ctx.save();
                ctx.translate(bracketX + 12, midY);
                ctx.rotate(-Math.PI / 2);
                ctx.fillText('Dynamic Range', 0, 0);
                ctx.restore();

                ctx.globalAlpha = 1;
            }

            // --- Phase 4 (260-380): Compressed version below ---
            const p4 = progress(f, 260, 60);

            if (p4 > 0) {
                ctx.globalAlpha = p4;
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 10px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('After Compression', margin.left, 165);
                ctx.globalAlpha = 1;

                // Compressed envelope: reduce loud parts, keep quiet parts similar
                const compressedEnv = envelope.map(v => {
                    const threshold = 0.4;
                    if (v > threshold) {
                        return threshold + (v - threshold) * 0.3;
                    }
                    return v;
                });

                const compWaveY = 175;
                const compWaveH = 70;
                const visibleCount = Math.floor(p4 * compressedEnv.length);
                drawWaveform(margin.left, compWaveY, plotW, compWaveH, compressedEnv.slice(0, visibleCount), '#e85d75', 0.5);
            }

            // --- Phase 5 (380+): "More consistent" label ---
            const p5 = progress(f, 380, 40);

            if (p5 > 0) {
                ctx.globalAlpha = p5;
                ctx.fillStyle = '#16a34a';
                ctx.font = 'bold 10px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('More consistent: smaller dynamic range', W / 2, H - 10);
                ctx.globalAlpha = 1;
            }

            // Phase indicator
            const phase = f < 80 ? 'Signal' : f < 160 ? 'Dynamics' : f < 260 ? 'Range' : f < 380 ? 'Compressed' : 'Result';
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
