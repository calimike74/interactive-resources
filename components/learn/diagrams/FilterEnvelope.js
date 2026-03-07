'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: ADSR shape builds → playhead animates along it → filter cutoff display responds
export default function FilterEnvelope() {
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

        // ADSR parameters (normalized 0-1)
        const A = 0.12; // attack duration
        const D = 0.18; // decay duration
        const S = 0.55; // sustain level
        const sustainDur = 0.35; // sustain hold duration
        const R = 0.2;  // release duration

        // Get envelope value at normalized position (0-1)
        const envValue = (t) => {
            if (t < A) return t / A; // Attack
            if (t < A + D) return 1 - (1 - S) * ((t - A) / D); // Decay
            if (t < A + D + sustainDur) return S; // Sustain
            if (t < A + D + sustainDur + R) return S * (1 - (t - A - D - sustainDur) / R); // Release
            return 0;
        };

        const draw = () => {
            frameRef.current = (frameRef.current + 1) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);

            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            const envLeft = 45;
            const envRight = W - 20;
            const envTop = 40;
            const envH = 120;
            const envW = envRight - envLeft;
            const envBase = envTop + envH;

            // Title
            const titleP = progress(f, 0, 25);
            ctx.globalAlpha = titleP;
            ctx.fillStyle = '#1a1a6e';
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Filter Envelope (ADSR)', W / 2, 20);
            ctx.globalAlpha = 1;

            // --- Phase 1 (0-100): ADSR shape draws progressively ---
            const envDraw = progress(f, 10, 80);

            if (envDraw > 0) {
                ctx.globalAlpha = envDraw;

                // Base line
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(envLeft, envBase);
                ctx.lineTo(envRight, envBase);
                ctx.stroke();

                // Max line (dashed)
                ctx.setLineDash([3, 3]);
                ctx.strokeStyle = '#d1d5db';
                ctx.beginPath();
                ctx.moveTo(envLeft, envTop);
                ctx.lineTo(envRight, envTop);
                ctx.stroke();
                ctx.setLineDash([]);

                // Sustain line (dashed)
                const sustainY = envBase - S * envH;
                ctx.setLineDash([3, 3]);
                ctx.strokeStyle = '#d1d5db';
                ctx.beginPath();
                ctx.moveTo(envLeft, sustainY);
                ctx.lineTo(envRight, sustainY);
                ctx.stroke();
                ctx.setLineDash([]);

                // Draw ADSR path
                ctx.strokeStyle = '#1a1a6e';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                const totalPoints = Math.floor(envW * envDraw);
                for (let px = 0; px <= totalPoints; px++) {
                    const t = px / envW;
                    const val = envValue(t);
                    const y = envBase - val * envH;
                    if (px === 0) ctx.moveTo(envLeft + px, y);
                    else ctx.lineTo(envLeft + px, y);
                }
                ctx.stroke();

                // Fill under curve
                ctx.fillStyle = 'rgba(26, 26, 110, 0.06)';
                ctx.beginPath();
                ctx.moveTo(envLeft, envBase);
                for (let px = 0; px <= totalPoints; px++) {
                    const t = px / envW;
                    const val = envValue(t);
                    ctx.lineTo(envLeft + px, envBase - val * envH);
                }
                ctx.lineTo(envLeft + totalPoints, envBase);
                ctx.fill();

                ctx.globalAlpha = 1;
            }

            // --- Phase 2 (100-170): ADSR segment labels appear ---
            const segLabels = [
                { label: 'A', start: 0, end: A, frame: 100 },
                { label: 'D', start: A, end: A + D, frame: 115 },
                { label: 'S', start: A + D, end: A + D + sustainDur, frame: 130 },
                { label: 'R', start: A + D + sustainDur, end: 1, frame: 145 },
            ];

            segLabels.forEach((seg) => {
                const lp = progress(f, seg.frame, 20);
                if (lp <= 0) return;

                ctx.globalAlpha = lp;
                const x1 = envLeft + seg.start * envW;
                const x2 = envLeft + seg.end * envW;
                const centerX = (x1 + x2) / 2;

                // Bracket line
                ctx.strokeStyle = '#1a1a6e';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x1, envBase + 8);
                ctx.lineTo(x1, envBase + 14);
                ctx.lineTo(x2, envBase + 14);
                ctx.lineTo(x2, envBase + 8);
                ctx.stroke();

                // Label
                ctx.fillStyle = '#1a1a6e';
                ctx.font = 'bold 10px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(seg.label, centerX, envBase + 26);

                ctx.globalAlpha = 1;
            });

            // --- Phase 3 (180-360): Animated playhead + filter cutoff display ---
            const playP = progress(f, 180, 10);
            if (f >= 180 && f < 380) {
                const playT = clamp((f - 180) / 180, 0, 1); // playhead position
                const playX = envLeft + playT * envW;
                const envVal = envValue(playT);
                const playY = envBase - envVal * envH;

                // Vertical guide line
                ctx.globalAlpha = playP * 0.3;
                ctx.strokeStyle = '#DC2626';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(playX, envTop);
                ctx.lineTo(playX, envBase);
                ctx.stroke();

                // Playhead dot
                ctx.globalAlpha = 1;
                ctx.fillStyle = '#DC2626';
                ctx.beginPath();
                ctx.arc(playX, playY, 4, 0, Math.PI * 2);
                ctx.fill();

                // --- Filter cutoff display below ---
                const filterY = 200;
                const filterH2 = 50;
                const filterBase = filterY + filterH2;

                // Filter box
                ctx.fillStyle = '#fff';
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(envLeft - 5, filterY - 8, envW + 10, filterH2 + 20, 6);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#6b7280';
                ctx.font = '9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('Filter Cutoff Response', envLeft, filterY);

                // Frequency axis
                ctx.fillStyle = '#9ca3af';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('Low', envLeft, filterBase + 14);
                ctx.textAlign = 'right';
                ctx.fillText('High', envRight, filterBase + 14);

                // Draw low-pass response with cutoff driven by envelope
                const cutoffPos = 0.2 + envVal * 0.6; // map envelope to cutoff position

                ctx.strokeStyle = '#1a1a6e';
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let px = 0; px <= envW; px++) {
                    const nx = px / envW;
                    const diff = (nx - cutoffPos) * 10;
                    const gain = diff <= 0 ? 1 : 1 / (1 + diff * diff);
                    const y = filterBase - gain * filterH2;
                    if (px === 0) ctx.moveTo(envLeft + px, y);
                    else ctx.lineTo(envLeft + px, y);
                }
                ctx.stroke();

                // Cutoff position marker
                ctx.strokeStyle = '#DC2626';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(envLeft + cutoffPos * envW, filterY);
                ctx.lineTo(envLeft + cutoffPos * envW, filterBase);
                ctx.stroke();
                ctx.setLineDash([]);

                // Connection line between envelope and filter
                ctx.strokeStyle = 'rgba(220, 38, 38, 0.3)';
                ctx.lineWidth = 1;
                ctx.setLineDash([2, 2]);
                ctx.beginPath();
                ctx.moveTo(playX, envBase + 30);
                ctx.lineTo(envLeft + cutoffPos * envW, filterY - 4);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // Phase indicator
            const phase = f < 100 ? 'Building' : f < 170 ? 'Labels' : f < 380 ? 'Playing' : 'Complete';
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
