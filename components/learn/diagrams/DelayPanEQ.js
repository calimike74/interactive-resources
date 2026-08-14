'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: stereo field with dry+wet centred → pan wet to right → frequency spectrum added → high-cut applied to wet (cutoff sweeps in)
export default function DelayPanEQ() {
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

        const PHASE_1 = 20;
        const PHASE_2 = 130; // pan wet right
        const PHASE_3 = 260; // frequency spectrum appears
        const PHASE_4 = 380; // high-cut applied

        // Stereo field layout (left half of canvas)
        const fieldX = 40;
        const fieldY = 85;
        const fieldW = 180;
        const fieldH = 50;

        // Spectrum layout (right half)
        const specX = 270;
        const specY = 85;
        const specW = 190;
        const specH = 80;

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
            ctx.fillText('Delay Pan & EQ', W / 2, 22);
            ctx.globalAlpha = 1;

            // ===== LEFT: Stereo field =====
            const fieldP = progress(f, PHASE_1, 30);
            if (fieldP > 0) {
                ctx.globalAlpha = fieldP;

                // Section header
                ctx.fillStyle = '#6b7280';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('PAN: stereo field', fieldX, fieldY - 12);

                // Field rectangle
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 1;
                ctx.strokeRect(fieldX, fieldY, fieldW, fieldH);

                // L / C / R labels
                ctx.fillStyle = '#9ca3af';
                ctx.font = '9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('L', fieldX, fieldY + fieldH + 14);
                ctx.fillText('C', fieldX + fieldW / 2, fieldY + fieldH + 14);
                ctx.fillText('R', fieldX + fieldW, fieldY + fieldH + 14);

                // Centre tick
                ctx.strokeStyle = '#e5e7eb';
                ctx.beginPath();
                ctx.moveTo(fieldX + fieldW / 2, fieldY + fieldH);
                ctx.lineTo(fieldX + fieldW / 2, fieldY + fieldH + 4);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            // Dry — always centered
            const dryP = progress(f, PHASE_1 + 15, 25);
            if (dryP > 0) {
                const dryX = fieldX + fieldW / 2;
                const dryY = fieldY + fieldH / 2;
                ctx.globalAlpha = dryP;
                ctx.fillStyle = '#374151';
                ctx.beginPath();
                ctx.arc(dryX, dryY, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('DRY', dryX, dryY + 3);
                ctx.globalAlpha = 1;
            }

            // Wet — starts centered, moves right in phase 2
            const wetP = progress(f, PHASE_1 + 30, 25);
            if (wetP > 0) {
                // Pan position animates between phase boundaries
                let panTarget = 0.5; // centred initially
                let tween = 0;
                if (f < PHASE_2) {
                    panTarget = 0.5;
                } else {
                    tween = progress(f, PHASE_2, 50);
                    panTarget = 0.5 + tween * 0.32; // moves to 82%
                }
                const wetX = fieldX + fieldW * panTarget;
                const wetY = fieldY + fieldH / 2;

                ctx.globalAlpha = wetP;
                ctx.fillStyle = '#14b8a6';
                ctx.beginPath();
                ctx.arc(wetX, wetY, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('WET', wetX, wetY + 3);
                ctx.globalAlpha = 1;

                // Pan annotation on phase 2
                if (f >= PHASE_2) {
                    const annP = progress(f, PHASE_2 + 20, 25)
                        * clamp(1 - (f - (PHASE_3 + 30)) / 25, 0, 1);
                    if (annP > 0) {
                        ctx.globalAlpha = annP;
                        ctx.fillStyle = '#14b8a6';
                        ctx.font = 'italic 9px -apple-system, sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillText('panned opposite to dry', fieldX + fieldW / 2, fieldY + fieldH + 30);
                        ctx.globalAlpha = 1;
                    }
                }
            }

            // Divider
            const divP = progress(f, PHASE_1 + 20, 25);
            if (divP > 0) {
                ctx.globalAlpha = divP * 0.5;
                ctx.strokeStyle = '#e5e7eb';
                ctx.beginPath();
                ctx.moveTo(245, 55);
                ctx.lineTo(245, H - 50);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            // ===== RIGHT: Spectrum (phase 3 onwards) =====
            if (f >= PHASE_3) {
                const specP = progress(f, PHASE_3, 30);
                ctx.globalAlpha = specP;

                // Header
                ctx.fillStyle = '#6b7280';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('EQ: frequency response', specX, specY - 12);

                // Axis
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(specX, specY + specH);
                ctx.lineTo(specX + specW, specY + specH);
                ctx.stroke();

                // Axis labels
                ctx.fillStyle = '#9ca3af';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('low', specX, specY + specH + 12);
                ctx.textAlign = 'right';
                ctx.fillText('high', specX + specW, specY + specH + 12);

                // Dry curve (flat broadband, slight natural rolloff)
                ctx.strokeStyle = '#374151';
                ctx.lineWidth = 1.5;
                ctx.globalAlpha = specP * 0.75;
                ctx.beginPath();
                for (let x = 0; x <= specW; x++) {
                    const px = specX + x;
                    const norm = x / specW;
                    const py = specY + specH - 45 - Math.sin(norm * Math.PI * 0.8) * 6;
                    if (x === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.stroke();

                // Wet curve — starts flat, then gets high-cut applied in phase 4
                ctx.strokeStyle = '#14b8a6';
                ctx.lineWidth = 2;
                ctx.globalAlpha = specP;

                // Cutoff position animates from 1.0 (no cut) down to 0.4 in phase 4
                let cutoff = 1.0;
                if (f >= PHASE_4) {
                    const ct = progress(f, PHASE_4, 60);
                    cutoff = 1.0 - ct * 0.6; // sweeps down from 1.0 → 0.4
                }

                ctx.beginPath();
                for (let x = 0; x <= specW; x++) {
                    const px = specX + x;
                    const norm = x / specW;
                    let gain = 50;
                    if (norm > cutoff) {
                        const rolloff = (norm - cutoff) / Math.max(1 - cutoff, 0.01);
                        gain = 50 * Math.pow(1 - clamp(rolloff, 0, 1), 1.8);
                    }
                    const py = specY + specH - 10 - gain;
                    if (x === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.stroke();

                // Cutoff marker line + label
                if (cutoff < 0.99) {
                    const cutX = specX + specW * cutoff;
                    ctx.strokeStyle = '#14b8a6';
                    ctx.globalAlpha = specP * 0.5;
                    ctx.setLineDash([3, 3]);
                    ctx.beginPath();
                    ctx.moveTo(cutX, specY);
                    ctx.lineTo(cutX, specY + specH);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.fillStyle = '#14b8a6';
                    ctx.font = 'bold 8px -apple-system, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.globalAlpha = specP;
                    ctx.fillText('cutoff', cutX + 3, specY + 10);
                }

                // Legend
                ctx.fillStyle = '#374151';
                ctx.beginPath();
                ctx.arc(specX + 10, specY - 28, 3.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.font = '9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillStyle = '#1a1a2e';
                ctx.fillText('dry', specX + 18, specY - 25);

                ctx.fillStyle = '#14b8a6';
                ctx.beginPath();
                ctx.arc(specX + 50, specY - 28, 3.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#1a1a2e';
                ctx.fillText('wet', specX + 58, specY - 25);

                ctx.globalAlpha = 1;
            }

            // ===== Phase 4 annotation =====
            if (f >= PHASE_4 + 30) {
                const annP = progress(f, PHASE_4 + 30, 25)
                    * clamp(1 - (f - (CYCLE - 60)) / 30, 0, 1);
                ctx.globalAlpha = annP;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 10px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('high-cut on wet stops sibilance stacking on every repeat', W / 2, H - 30);
                ctx.globalAlpha = 1;
            }

            // Phase indicator
            const phase = f < PHASE_2 ? 'Set up'
                : f < PHASE_3 ? 'Pan'
                : f < PHASE_4 ? 'EQ'
                : 'High-cut';
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
