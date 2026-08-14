'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: an LFO trace (violet, continuous sine) draws above an envelope trace
// (navy ADSR, one-shot then flat) — both share the same timeline and the same key-down/key-up
// gate strip below them. A single playhead sweep proves the contrast: the LFO dot keeps cycling
// all the way to the right edge while the envelope dot settles at zero once release ends.
export default function LfoVsEnvelope() {
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

        const CYCLE = 620;
        let animId;

        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);

        const VIOLET = '#7c3aed';

        const timelineLeft = 50;
        const timelineRight = 450;
        const timelineW = timelineRight - timelineLeft;

        // Envelope shape, keyed to the shared timeline (0-1)
        const keyDownT = 0.06;
        const A = 0.08;
        const D = 0.10;
        const S = 0.5;
        const sustainDur = 0.22;
        const R = 0.15;
        const keyUpT = keyDownT + A + D + sustainDur;
        const releaseEndT = keyUpT + R;

        const envValue = (t) => {
            const te = t - keyDownT;
            if (te < 0) return 0;
            if (te < A) return te / A;
            if (te < A + D) return 1 - (1 - S) * ((te - A) / D);
            if (te < A + D + sustainDur) return S;
            if (te < A + D + sustainDur + R) return S * (1 - (te - A - D - sustainDur) / R);
            return 0; // one-shot: stays at zero, does not retrigger
        };

        const lfoCycles = 3.5;
        const lfoValue = (t) => Math.sin(t * lfoCycles * Math.PI * 2);

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
            ctx.fillText('LFO vs Envelope', W / 2, 18);
            ctx.globalAlpha = 1;

            const lfoTop = 32, lfoH = 48, lfoBase = lfoTop + lfoH, lfoMid = lfoTop + lfoH / 2;
            const envTop = 96, envH = 48, envBase = envTop + envH;

            // --- LFO panel ---
            const lfoPanelP = progress(f, 25, 20);
            if (lfoPanelP > 0) {
                ctx.globalAlpha = lfoPanelP;
                ctx.fillStyle = VIOLET;
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('LFO: cycles continuously, ignores the gate', timelineLeft, lfoTop - 4);
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(timelineLeft, lfoMid);
                ctx.lineTo(timelineRight, lfoMid);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            const lfoDraw = progress(f, 50, 90);
            if (lfoDraw > 0) {
                ctx.globalAlpha = lfoDraw;
                ctx.strokeStyle = VIOLET;
                ctx.lineWidth = 2;
                ctx.beginPath();
                const numPoints = Math.floor(timelineW * lfoDraw);
                for (let px = 0; px <= numPoints; px++) {
                    const t = px / timelineW;
                    const y = lfoMid - lfoValue(t) * (lfoH * 0.42);
                    if (px === 0) ctx.moveTo(timelineLeft + px, y);
                    else ctx.lineTo(timelineLeft + px, y);
                }
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            // --- Envelope panel ---
            const envPanelP = progress(f, 150, 20);
            if (envPanelP > 0) {
                ctx.globalAlpha = envPanelP;
                ctx.fillStyle = '#1a1a6e';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('Envelope: one shot per note, then done', timelineLeft, envTop - 4);
                ctx.globalAlpha = 1;
            }

            const envDraw = progress(f, 175, 90);
            if (envDraw > 0) {
                ctx.globalAlpha = envDraw;
                ctx.strokeStyle = '#1a1a6e';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                const numPoints = Math.floor(timelineW * envDraw);
                for (let px = 0; px <= numPoints; px++) {
                    const t = px / timelineW;
                    const y = envBase - envValue(t) * envH;
                    if (px === 0) ctx.moveTo(timelineLeft + px, y);
                    else ctx.lineTo(timelineLeft + px, y);
                }
                ctx.stroke();

                ctx.fillStyle = 'rgba(26, 26, 110, 0.06)';
                ctx.beginPath();
                ctx.moveTo(timelineLeft, envBase);
                for (let px = 0; px <= numPoints; px++) {
                    const t = px / timelineW;
                    ctx.lineTo(timelineLeft + px, envBase - envValue(t) * envH);
                }
                ctx.lineTo(timelineLeft + numPoints, envBase);
                ctx.fill();

                // "done" marker where release finishes
                if (envDraw > 0.85) {
                    const doneX = timelineLeft + releaseEndT * timelineW;
                    ctx.strokeStyle = '#9ca3af';
                    ctx.setLineDash([2, 2]);
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(doneX, envTop);
                    ctx.lineTo(doneX, envBase + 10);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.fillStyle = '#9ca3af';
                    ctx.font = '7px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('done', doneX, envBase + 20);
                }
                ctx.globalAlpha = 1;
            }

            // --- Shared gate strip ---
            const gateP = progress(f, 260, 30);
            const gateY = 182;
            const gateHigh = gateY + 4;
            const gateLow = gateY + 20;
            const keyDownX = timelineLeft + keyDownT * timelineW;
            const keyUpX = timelineLeft + keyUpT * timelineW;

            if (gateP > 0) {
                ctx.globalAlpha = gateP;
                ctx.fillStyle = '#fff';
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(timelineLeft - 5, gateY - 10, timelineW + 10, 52, 6);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#6b7280';
                ctx.font = '9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('Shared timeline: same key-press for both traces above', timelineLeft, gateY - 2);

                ctx.strokeStyle = '#1a1a6e';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(timelineLeft, gateLow);
                ctx.lineTo(keyDownX, gateLow);
                ctx.lineTo(keyDownX, gateHigh);
                ctx.lineTo(keyUpX, gateHigh);
                ctx.lineTo(keyUpX, gateLow);
                ctx.lineTo(timelineRight, gateLow);
                ctx.stroke();

                ctx.strokeStyle = '#059669';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(keyDownX, gateHigh - 6);
                ctx.lineTo(keyDownX, gateLow + 6);
                ctx.stroke();
                ctx.fillStyle = '#059669';
                ctx.font = 'bold 7px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('Key down', keyDownX + 3, gateLow + 15);

                ctx.strokeStyle = '#DC2626';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(keyUpX, gateHigh - 6);
                ctx.lineTo(keyUpX, gateLow + 6);
                ctx.stroke();
                ctx.fillStyle = '#DC2626';
                ctx.font = 'bold 7px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Key up', keyUpX, gateLow + 15);

                ctx.globalAlpha = 1;
            }

            // --- Playhead sweeps all three together ---
            if (f >= 300 && f < 500) {
                const playT = clamp((f - 300) / 200, 0, 1);
                const playX = timelineLeft + playT * timelineW;

                ctx.globalAlpha = 0.3;
                ctx.strokeStyle = '#DC2626';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(playX, lfoTop);
                ctx.lineTo(playX, gateLow);
                ctx.stroke();
                ctx.globalAlpha = 1;

                const lfoY = lfoMid - lfoValue(playT) * (lfoH * 0.42);
                ctx.fillStyle = VIOLET;
                ctx.beginPath();
                ctx.arc(playX, lfoY, 4, 0, Math.PI * 2);
                ctx.fill();

                const envY = envBase - envValue(playT) * envH;
                ctx.fillStyle = '#1a1a6e';
                ctx.beginPath();
                ctx.arc(playX, envY, 4, 0, Math.PI * 2);
                ctx.fill();

                const gateDotY = (playT >= keyDownT && playT < keyUpT) ? gateHigh : gateLow;
                ctx.fillStyle = '#DC2626';
                ctx.beginPath();
                ctx.arc(playX, gateDotY, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            // --- Summary line ---
            const summaryP = progress(f, 510, 30);
            if (summaryP > 0) {
                ctx.globalAlpha = summaryP;
                ctx.fillStyle = '#6b7280';
                ctx.font = '9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('The LFO never stops · the envelope fires once, then rests', W / 2, 246);
                ctx.globalAlpha = 1;
            }

            // Phase indicator
            const phase = f < 150 ? 'LFO trace' : f < 260 ? 'Envelope trace' : f < 300 ? 'Gate' : f < 500 ? 'Playing' : 'Complete';
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
