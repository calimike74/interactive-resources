'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: bar grid appears → quarter-note delay pulses on every beat → dotted-8th hits on syncopated positions → formula reveal at bottom
export default function TimedDelay() {
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

        const CYCLE = 560;
        let animId;

        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) =>
            clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);

        const PHASE_1 = 20;   // grid appears
        const PHASE_2 = 90;   // quarter-note pulses through bar
        const PHASE_3 = 270;  // dotted-eighth pulses through bar
        const PHASE_4 = 450;  // formula reveal

        const margin = { left: 40, right: 40 };
        const plotW = W - margin.left - margin.right;
        const stepsPerBar = 16;
        const stepW = plotW / stepsPerBar;

        const quarterY = 110;
        const dottedY = 195;

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
            ctx.fillText('Timed Delay — locked to tempo', W / 2, 20);
            ctx.globalAlpha = 1;

            // ===== Both grids fade in during phase 1 =====
            const gridP = progress(f, PHASE_1, 30);
            if (gridP > 0) {
                drawGrid(ctx, margin.left, quarterY, plotW, stepW, stepsPerBar, gridP, '1/4');
                drawGrid(ctx, margin.left, dottedY, plotW, stepW, stepsPerBar, gridP, '1/8D');
            }

            // ===== Quarter-note row: active during phase 2 and 4 =====
            const quarterHits = [0, 4, 8, 12];
            const quarterActive = f >= PHASE_2;
            if (quarterActive) {
                const rowCycle = 180;
                const rowFrame = (f - PHASE_2) % rowCycle;
                const playX = margin.left + (rowFrame / rowCycle) * plotW;

                // Playhead
                drawPlayhead(ctx, playX, quarterY, '#14b8a6', 0.4);

                // Draw hit markers + pulses
                quarterHits.forEach(step => {
                    const stepFrame = (step / stepsPerBar) * rowCycle;
                    const passed = rowFrame - stepFrame;
                    const pulse = passed >= 0 && passed < 25 ? (1 - passed / 25) : 0;
                    drawHitDot(ctx, margin.left + step * stepW, quarterY, pulse, step === 0, '#14b8a6');
                });

                // Row label
                const labelP = progress(f, PHASE_2, 25);
                ctx.globalAlpha = labelP;
                ctx.fillStyle = '#14b8a6';
                ctx.font = 'bold 10px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('QUARTER-NOTE (1/4)', margin.left, quarterY - 36);
                ctx.fillStyle = '#6b7280';
                ctx.font = '9px -apple-system, sans-serif';
                ctx.fillText('hits on every beat', margin.left, quarterY - 24);
                ctx.globalAlpha = 1;
            }

            // ===== Dotted-eighth row: active from phase 3 =====
            const dottedHits = [0, 3, 6, 9, 12, 15];
            const dottedActive = f >= PHASE_3;
            if (dottedActive) {
                const rowCycle = 180;
                const rowFrame = (f - PHASE_3) % rowCycle;
                const playX = margin.left + (rowFrame / rowCycle) * plotW;

                drawPlayhead(ctx, playX, dottedY, '#f97316', 0.4);

                dottedHits.forEach(step => {
                    const stepFrame = (step / stepsPerBar) * rowCycle;
                    const passed = rowFrame - stepFrame;
                    const pulse = passed >= 0 && passed < 25 ? (1 - passed / 25) : 0;
                    drawHitDot(ctx, margin.left + step * stepW, dottedY, pulse, step === 0, '#f97316');
                });

                const labelP = progress(f, PHASE_3, 25);
                ctx.globalAlpha = labelP;
                ctx.fillStyle = '#f97316';
                ctx.font = 'bold 10px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('DOTTED-EIGHTH (1/8D)', margin.left, dottedY - 36);
                ctx.fillStyle = '#6b7280';
                ctx.font = '9px -apple-system, sans-serif';
                ctx.fillText('syncopated — The Edge pattern', margin.left, dottedY - 24);
                ctx.globalAlpha = 1;
            }

            // ===== Phase 4: Formula box =====
            if (f >= PHASE_4) {
                const p4 = progress(f, PHASE_4, 30)
                    * clamp(1 - (f - (CYCLE - 60)) / 30, 0, 1);
                ctx.globalAlpha = p4;

                const boxX = W / 2 - 170;
                const boxY = H - 52;
                const boxW = 340;
                const boxH = 32;

                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(boxX, boxY, boxW, boxH, 6);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#1a1a2e';
                ctx.font = 'bold 10px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(
                    'quarter (ms) = 60,000 ÷ BPM    ·    dotted-8th = quarter × 0.75',
                    boxX + boxW / 2,
                    boxY + 14
                );
                ctx.fillStyle = '#14b8a6';
                ctx.font = '9px -apple-system, sans-serif';
                ctx.fillText('at 120 BPM → 500 ms / 375 ms', boxX + boxW / 2, boxY + 26);
                ctx.globalAlpha = 1;
            }

            // Phase indicator
            const phase = f < PHASE_2 ? 'Grid'
                : f < PHASE_3 ? '1/4 delay'
                : f < PHASE_4 ? '1/8D delay'
                : 'Formula';
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

function drawGrid(ctx, x, y, w, stepW, stepsPerBar, alpha, noteLabel) {
    ctx.globalAlpha = alpha;

    // Grid ticks
    for (let i = 0; i <= stepsPerBar; i++) {
        const tx = x + i * stepW;
        ctx.strokeStyle = i % 4 === 0 ? '#9ca3af' : '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tx, y - 16);
        ctx.lineTo(tx, y + 16);
        ctx.stroke();
    }

    // Beat numbers
    ctx.fillStyle = '#9ca3af';
    ctx.font = '8px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    for (let beat = 1; beat <= 4; beat++) {
        const bx = x + (beat - 1) * 4 * stepW + stepW * 2;
        ctx.fillText(String(beat), bx, y + 28);
    }

    ctx.globalAlpha = 1;
}

function drawPlayhead(ctx, x, y, color, alpha) {
    const prev = ctx.globalAlpha;
    ctx.globalAlpha = prev * alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - 16);
    ctx.lineTo(x, y + 16);
    ctx.stroke();
    ctx.globalAlpha = prev;
}

function drawHitDot(ctx, x, y, pulse, isDry, color) {
    // Pulse ring
    if (pulse > 0) {
        ctx.globalAlpha = pulse * 0.7;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 6 + pulse * 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    // Dot — dry is dark grey, wet repeats are in colour
    ctx.fillStyle = isDry ? '#374151' : color;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
}
