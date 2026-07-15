'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: a fixed/static value fades in and out first (the thing an envelope
// replaces), then an ADSR trace draws itself over a key-down/key-up timeline, stages labelled
// A/D/S/R, then a playhead sweeps the shape once so the "triggered per note" idea reads clearly.
export default function EnvelopeConcept() {
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

        // ADSR parameters (normalized 0-1) — same shape family as Filter/Amp envelope diagrams
        const A = 0.12;
        const D = 0.18;
        const S = 0.55;
        const sustainDur = 0.35;
        const R = 0.2;
        const keyUpT = A + D + sustainDur; // release begins here

        const envValue = (t) => {
            if (t < A) return t / A;
            if (t < A + D) return 1 - (1 - S) * ((t - A) / D);
            if (t < keyUpT) return S;
            if (t < keyUpT + R) return S * (1 - (t - keyUpT) / R);
            return 0;
        };

        const draw = () => {
            frameRef.current = (frameRef.current + 1) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);

            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            const envLeft = 50;
            const envRight = W - 30;
            const envTop = 50;
            const envH = 96;
            const envW = envRight - envLeft;
            const envBase = envTop + envH;

            // Title
            ctx.fillStyle = '#1a1a6e';
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('What Is an Envelope?', W / 2, 18);

            // --- Phase 1 (20-130): a static, fixed value fades in then fades out ---
            const staticIn = progress(f, 20, 25);
            const staticOut = progress(f, 130, 30);
            const staticAlpha = clamp(staticIn - staticOut, 0, 1);

            if (staticAlpha > 0) {
                ctx.globalAlpha = staticAlpha;
                ctx.fillStyle = '#6b7280';
                ctx.font = '9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('One fixed value — parked here forever, no matter what note plays', envLeft, 38);

                const staticY = envTop + 0.45 * envH;
                ctx.setLineDash([4, 4]);
                ctx.strokeStyle = '#9ca3af';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(envLeft, staticY);
                ctx.lineTo(envRight, staticY);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.globalAlpha = 1;
            }

            // --- Phase 2 (160-250): ADSR shape draws progressively, replacing the static line ---
            const envDraw = progress(f, 160, 90);

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

            // --- Phase 3 (260-320): A/D/S/R segment labels ---
            const segLabels = [
                { label: 'A', start: 0, end: A, frame: 260 },
                { label: 'D', start: A, end: A + D, frame: 275 },
                { label: 'S', start: A + D, end: keyUpT, frame: 290 },
                { label: 'R', start: keyUpT, end: 1, frame: 305 },
            ];

            segLabels.forEach((seg) => {
                const lp = progress(f, seg.frame, 18);
                if (lp <= 0) return;

                ctx.globalAlpha = lp;
                const x1 = envLeft + seg.start * envW;
                const x2 = envLeft + seg.end * envW;
                const centerX = (x1 + x2) / 2;

                ctx.strokeStyle = '#1a1a6e';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x1, envBase + 6);
                ctx.lineTo(x1, envBase + 12);
                ctx.lineTo(x2, envBase + 12);
                ctx.lineTo(x2, envBase + 6);
                ctx.stroke();

                ctx.fillStyle = '#1a1a6e';
                ctx.font = 'bold 10px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(seg.label, centerX, envBase + 24);

                ctx.globalAlpha = 1;
            });

            // --- Phase 4 (330-...): key-down / key-up gate strip ---
            const gateP = progress(f, 330, 30);
            const gateY = 196;
            const gateHigh = gateY + 4;
            const gateLow = gateY + 22;
            const keyUpX = envLeft + keyUpT * envW;

            if (gateP > 0) {
                ctx.globalAlpha = gateP;

                ctx.fillStyle = '#fff';
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(envLeft - 5, gateY - 10, envW + 10, 54, 6);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#6b7280';
                ctx.font = '9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('Note gate — triggers the shape once per note', envLeft, gateY - 2);

                // Gate step line: high while the key is held, low after
                ctx.strokeStyle = '#1a1a6e';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(envLeft, gateHigh);
                ctx.lineTo(keyUpX, gateHigh);
                ctx.lineTo(keyUpX, gateLow);
                ctx.lineTo(envRight, gateLow);
                ctx.stroke();

                // Key-down tick
                ctx.strokeStyle = '#059669';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(envLeft, gateHigh - 6);
                ctx.lineTo(envLeft, gateLow + 6);
                ctx.stroke();
                ctx.fillStyle = '#059669';
                ctx.font = 'bold 8px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('Key down', envLeft, gateLow + 18);

                // Key-up tick
                ctx.strokeStyle = '#DC2626';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(keyUpX, gateHigh - 6);
                ctx.lineTo(keyUpX, gateLow + 6);
                ctx.stroke();
                ctx.fillStyle = '#DC2626';
                ctx.font = 'bold 8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Key up', keyUpX, gateLow + 18);

                ctx.globalAlpha = 1;
            }

            // --- Phase 5 (360-480): playhead sweeps the curve + gate together ---
            if (f >= 360 && f < 480) {
                const playT = clamp((f - 360) / 120, 0, 1);
                const playX = envLeft + playT * envW;
                const envVal = envValue(playT);
                const playY = envBase - envVal * envH;

                ctx.globalAlpha = 0.3;
                ctx.strokeStyle = '#DC2626';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(playX, envTop);
                ctx.lineTo(playX, gateLow);
                ctx.stroke();

                ctx.globalAlpha = 1;
                ctx.fillStyle = '#DC2626';
                ctx.beginPath();
                ctx.arc(playX, playY, 4, 0, Math.PI * 2);
                ctx.fill();

                const gateDotY = playT < keyUpT ? gateHigh : gateLow;
                ctx.beginPath();
                ctx.arc(playX, gateDotY, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            // Phase indicator
            const phase = f < 160 ? 'Fixed value' : f < 260 ? 'Envelope draws' : f < 330 ? 'Stages' : f < 360 ? 'Gate' : f < 480 ? 'Playing' : 'Complete';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - 20, H - 8);

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
