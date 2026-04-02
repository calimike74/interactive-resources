'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: OSC box → FILTER box → AMP box → OUTPUT → signal dots flow through chain → envelope connections
export default function SynthSignalFlow() {
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

        const CYCLE = 940;
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

            // Title
            const titleP = progress(f, 0, 25);
            ctx.globalAlpha = titleP;
            ctx.fillStyle = '#1a1a6e';
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Subtractive Synth — Signal Flow', W / 2, 18);
            ctx.globalAlpha = 1;

            // Main chain layout
            const chainY = 80;
            const boxW = 80;
            const boxH = 60;
            const gap = 24;
            const totalW = 4 * boxW + 3 * gap;
            const startX = (W - totalW) / 2;

            const stages = [
                { label: 'OSCILLATOR', sub: 'Generate', x: startX, frame: 30 },
                { label: 'FILTER', sub: 'Shape tone', x: startX + boxW + gap, frame: 100 },
                { label: 'AMPLIFIER', sub: 'Control volume', x: startX + 2 * (boxW + gap), frame: 170 },
                { label: 'OUTPUT', sub: 'Speaker', x: startX + 3 * (boxW + gap), frame: 240 },
            ];

            // Draw stages
            stages.forEach((stage, i) => {
                const sp = progress(f, stage.frame, 35);
                if (sp <= 0) return;

                ctx.globalAlpha = sp;

                // Box
                ctx.fillStyle = '#fff';
                ctx.strokeStyle = '#1a1a6e';
                ctx.lineWidth = 1.5;
                drawRR(stage.x, chainY, boxW, boxH, 6);
                ctx.fill();
                ctx.stroke();

                // Label
                ctx.fillStyle = '#1a1a6e';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(stage.label, stage.x + boxW / 2, chainY + 18);

                // Sub label
                ctx.fillStyle = '#6b7280';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.fillText(stage.sub, stage.x + boxW / 2, chainY + 32);

                // Mini visual inside each box
                const miniY = chainY + 38;
                const miniW = boxW - 16;
                const miniH = 16;
                const miniX = stage.x + 8;

                if (i === 0) {
                    // Sawtooth wave
                    ctx.strokeStyle = '#1a1a6e';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    for (let px = 0; px < miniW; px++) {
                        const nx = (px / miniW) * 3; // 3 cycles
                        const frac = nx % 1;
                        const val = frac * 2 - 1;
                        const y = miniY + miniH / 2 - val * miniH * 0.4;
                        if (px === 0) ctx.moveTo(miniX + px, y);
                        else ctx.lineTo(miniX + px, y);
                    }
                    ctx.stroke();
                } else if (i === 1) {
                    // Filter curve
                    ctx.strokeStyle = '#1a1a6e';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    for (let px = 0; px < miniW; px++) {
                        const nx = px / miniW;
                        const gain = nx < 0.5 ? 1 : 1 / (1 + Math.pow((nx - 0.5) * 8, 2));
                        const y = miniY + miniH - gain * miniH * 0.85;
                        if (px === 0) ctx.moveTo(miniX + px, y);
                        else ctx.lineTo(miniX + px, y);
                    }
                    ctx.stroke();
                } else if (i === 2) {
                    // ADSR envelope
                    ctx.strokeStyle = '#1a1a6e';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    const pts = [[0, 1], [0.15, 0], [0.35, 0.4], [0.7, 0.4], [1, 1]];
                    pts.forEach(([px, py], j) => {
                        const x = miniX + px * miniW;
                        const y = miniY + py * miniH;
                        if (j === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    });
                    ctx.stroke();
                } else {
                    // Speaker icon (simple)
                    ctx.strokeStyle = '#1a1a6e';
                    ctx.lineWidth = 1;
                    const cx = miniX + miniW / 2;
                    const cy = miniY + miniH / 2;
                    // Speaker body
                    ctx.fillStyle = '#1a1a6e';
                    ctx.fillRect(cx - 6, cy - 4, 6, 8);
                    // Cone
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - 4);
                    ctx.lineTo(cx + 6, cy - 7);
                    ctx.lineTo(cx + 6, cy + 7);
                    ctx.lineTo(cx, cy + 4);
                    ctx.fill();
                    // Sound waves
                    ctx.strokeStyle = '#1a1a6e';
                    ctx.lineWidth = 1;
                    for (let r = 0; r < 2; r++) {
                        ctx.beginPath();
                        ctx.arc(cx + 8, cy, 4 + r * 4, -0.5, 0.5);
                        ctx.stroke();
                    }
                }

                // Arrow to next stage
                if (i < 3) {
                    const arrowP = progress(f, stage.frame + 20, 20);
                    if (arrowP > 0) {
                        ctx.globalAlpha = arrowP;
                        const ax1 = stage.x + boxW;
                        const ax2 = stages[i + 1].x;
                        const ay = chainY + boxH / 2;

                        ctx.strokeStyle = '#9ca3af';
                        ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        ctx.moveTo(ax1 + 2, ay);
                        ctx.lineTo(ax2 - 2, ay);
                        ctx.stroke();

                        // Arrowhead
                        ctx.fillStyle = '#9ca3af';
                        ctx.beginPath();
                        ctx.moveTo(ax2 - 2, ay);
                        ctx.lineTo(ax2 - 7, ay - 3);
                        ctx.lineTo(ax2 - 7, ay + 3);
                        ctx.fill();
                    }
                }

                ctx.globalAlpha = 1;
            });

            // --- Phase 5: Signal dots flow through chain ---
            if (f >= 340 && f < CYCLE - 80) {
                const dotCycle = 150;
                const localT = ((f - 200) % dotCycle) / dotCycle;
                const chainStart = startX;
                const chainEnd = startX + totalW;
                const chainLen = chainEnd - chainStart;
                const dotX = chainStart + localT * chainLen;
                const dotY = chainY + boxH / 2;

                // Glowing dot
                ctx.fillStyle = 'rgba(26, 26, 110, 0.15)';
                ctx.beginPath();
                ctx.arc(dotX, dotY, 8, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#1a1a6e';
                ctx.beginPath();
                ctx.arc(dotX, dotY, 3.5, 0, Math.PI * 2);
                ctx.fill();

                // Second dot offset
                const localT2 = ((f - 340 + dotCycle / 2) % dotCycle) / dotCycle;
                const dotX2 = chainStart + localT2 * chainLen;
                ctx.fillStyle = 'rgba(26, 26, 110, 0.1)';
                ctx.beginPath();
                ctx.arc(dotX2, dotY, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(26, 26, 110, 0.6)';
                ctx.beginPath();
                ctx.arc(dotX2, dotY, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }

            // --- Phase 6: Envelope connections from below ---
            const envLabels = [
                { label: 'Filter Envelope', targetIdx: 1, frame: 430, color: '#7c3aed' },
                { label: 'Amp Envelope', targetIdx: 2, frame: 510, color: '#DC2626' },
                { label: 'LFO (optional)', targetIdx: 0, frame: 590, color: '#0891b2' },
            ];

            const envY = chainY + boxH + 40;

            envLabels.forEach((env) => {
                const ep = progress(f, env.frame, 35);
                if (ep <= 0) return;

                ctx.globalAlpha = ep;
                const target = stages[env.targetIdx];
                const targetCX = target.x + boxW / 2;
                const envBoxW = 90;
                const envBoxH = 22;
                const envBoxX = targetCX - envBoxW / 2;

                // Envelope box
                ctx.fillStyle = '#fff';
                ctx.strokeStyle = env.color;
                ctx.lineWidth = 1;
                drawRR(envBoxX, envY, envBoxW, envBoxH, 4);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = env.color;
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(env.label, targetCX, envY + 14);

                // Connection arrow (up to stage box)
                ctx.strokeStyle = env.color;
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 2]);
                ctx.beginPath();
                ctx.moveTo(targetCX, envY);
                ctx.lineTo(targetCX, chainY + boxH + 2);
                ctx.stroke();
                ctx.setLineDash([]);

                // Arrow tip
                ctx.fillStyle = env.color;
                ctx.beginPath();
                ctx.moveTo(targetCX, chainY + boxH + 2);
                ctx.lineTo(targetCX - 3, chainY + boxH + 7);
                ctx.lineTo(targetCX + 3, chainY + boxH + 7);
                ctx.fill();

                // "Modulates" label
                const modP = progress(f, env.frame + 20, 20);
                if (modP > 0) {
                    ctx.globalAlpha = modP * 0.7;
                    ctx.fillStyle = env.color;
                    ctx.font = '7px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('modulates', targetCX + 18, chainY + boxH + 22);
                }

                ctx.globalAlpha = 1;
            });

            // Signal flow direction label
            const flowP = progress(f, 310, 40);
            if (flowP > 0) {
                ctx.globalAlpha = flowP;
                ctx.fillStyle = '#9ca3af';
                ctx.font = '9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Signal flow  →', W / 2, chainY - 8);
                ctx.globalAlpha = 1;
            }

            // Phase indicator
            const phase = f < 280 ? 'Building' : f < 430 ? 'Signal' : f < 680 ? 'Modulation' : 'Complete';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - 20, H - 6);

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
