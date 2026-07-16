'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure, the row's technique acted out in real time: a narrow high-Q boost
// sweeps across the spectrum over a faint hidden resonance → as it nears the resonance the
// combined peak visibly flares and rings → the sweep locks onto the resonance's exact frequency →
// the boost flips through zero into a cut at that same frequency → the resonance is gone, only a
// clean narrow notch remains.
export default function SweepAndCutTechnique() {
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
        const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);

        const FREQ_MIN = 60;
        const FREQ_MAX = 12000; // matches the ctl-eq-sweep interactive range on this row
        const margin = { left: 40, right: 40 };
        const plotW = W - margin.left - margin.right;
        const plotY = 40;
        const plotH = 130;
        const baseY = plotY + plotH * 0.68;
        const maxBump = plotH * 0.42;

        const freqToX = (freq) =>
            margin.left + (Math.log10(freq / FREQ_MIN) / Math.log10(FREQ_MAX / FREQ_MIN)) * plotW;

        // The row's chapter exam anchor names 400 Hz as the boxy/nasal resonance to find
        const resonanceFreq = 400;
        const resonanceX = freqToX(resonanceFreq);

        const SWEEP_START = 20;
        const SWEEP_END = 300;
        const LOCK_END = 360;
        const FLIP_END = 460;
        const HOLD_END = 560;

        const bellAt = (px, centerX, halfWidthPx, amp) => {
            const d = (px - centerX) / (halfWidthPx * 0.4);
            return amp * Math.exp(-d * d);
        };

        const draw = () => {
            frameRef.current = (frameRef.current + 1) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            const titleP = progress(f, 0, 20);
            ctx.globalAlpha = titleP;
            ctx.fillStyle = '#1a1a6e';
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('The Sweep-and-Cut Technique', W / 2, 14);
            ctx.globalAlpha = 1;

            // 0 dB baseline
            ctx.strokeStyle = '#d1d5db';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(margin.left, baseY);
            ctx.lineTo(W - margin.right, baseY);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('60 Hz', margin.left, plotY + plotH + 14);
            ctx.textAlign = 'right';
            ctx.fillText('12 kHz', W - margin.right, plotY + plotH + 14);

            // Hidden resonance — a faint natural bump in the material, always present until fixed
            const resonanceStillPresent = f < FLIP_END;
            const resonanceAlpha = f < LOCK_END ? 0.22 : f < FLIP_END ? 0.22 * (1 - progress(f, LOCK_END, FLIP_END - LOCK_END)) : 0;
            if (resonanceStillPresent && resonanceAlpha > 0) {
                ctx.globalAlpha = resonanceAlpha;
                ctx.strokeStyle = '#DC2626';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([2, 2]);
                ctx.beginPath();
                for (let px = 0; px <= plotW; px++) {
                    const x = margin.left + px;
                    const bump = bellAt(x, resonanceX, plotW * 0.06, maxBump * 0.55);
                    const y = baseY - bump;
                    if (px === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.globalAlpha = 1;
            }

            let sweepCenterX = null;
            let sweepAmp = 0;
            let flareBoost = 0;

            if (f < SWEEP_END) {
                // Sweeping phase — a narrow boost travels the full range, back and forth once
                const t = clamp((f - SWEEP_START) / (SWEEP_END - SWEEP_START), 0, 1);
                const wobble = t < 0.55 ? t / 0.55 : 1 - (t - 0.55) / 0.45 * 0.15; // slight overshoot past centre, settles back
                sweepCenterX = margin.left + clamp(wobble, 0, 1) * plotW;
                sweepAmp = maxBump * 0.6 * progress(f, SWEEP_START, 20);
                // Flare when the sweep passes near the resonance
                const dist = Math.abs(sweepCenterX - resonanceX);
                flareBoost = Math.exp(-Math.pow(dist / 26, 2)) * maxBump * 0.35;
            } else if (f < LOCK_END) {
                // Locking phase — sweep eases onto the exact resonance frequency
                const lockT = easeInOut(progress(f, SWEEP_END, LOCK_END - SWEEP_END));
                const fromX = margin.left + plotW; // wherever the sweep ended
                sweepCenterX = fromX + (resonanceX - fromX) * lockT;
                sweepAmp = maxBump * 0.6;
                const dist = Math.abs(sweepCenterX - resonanceX);
                flareBoost = Math.exp(-Math.pow(dist / 26, 2)) * maxBump * 0.35;
            } else if (f < FLIP_END) {
                // Flip phase — boost tweens through zero into a cut, same frequency
                const flipT = easeInOut(progress(f, LOCK_END, FLIP_END - LOCK_END));
                sweepCenterX = resonanceX;
                sweepAmp = maxBump * 0.6 * (1 - 2 * flipT); // +0.6 → -0.6
                flareBoost = 0;
            } else {
                // Settled cut
                sweepCenterX = resonanceX;
                sweepAmp = -maxBump * 0.6;
                flareBoost = 0;
            }

            // Draw the moving/settled band + combined-with-resonance curve
            if (sweepCenterX !== null) {
                ctx.strokeStyle = f >= LOCK_END ? '#2563EB' : '#f97316';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                for (let px = 0; px <= plotW; px++) {
                    const x = margin.left + px;
                    const resBump = resonanceStillPresent ? bellAt(x, resonanceX, plotW * 0.06, maxBump * 0.55) : 0;
                    const flare = f < LOCK_END ? bellAt(x, resonanceX, plotW * 0.045, flareBoost) : 0;
                    const sweepBump = bellAt(x, sweepCenterX, plotW * 0.05, sweepAmp);
                    const y = baseY - resBump - flare - sweepBump;
                    if (px === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }

            // Resonance marker + frequency label once located (from locking phase onward)
            if (f >= SWEEP_END) {
                ctx.globalAlpha = progress(f, SWEEP_END, 20);
                ctx.strokeStyle = '#6b7280';
                ctx.lineWidth = 1;
                ctx.setLineDash([2, 2]);
                ctx.beginPath();
                ctx.moveTo(resonanceX, plotY);
                ctx.lineTo(resonanceX, plotY + plotH);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('400 Hz', resonanceX, plotY - 8);
                ctx.globalAlpha = 1;
            }

            // Phase captions — one clear line, positioned well below the plot
            const capY = plotY + plotH + 34;
            let caption = '';
            if (f < SWEEP_END) caption = 'Sweeping a narrow, high-Q boost across the spectrum…';
            else if (f < LOCK_END) caption = 'Found it — 400 Hz rings out louder than everything around it';
            else if (f < FLIP_END) caption = 'Flip the boost into a cut, same frequency';
            else caption = 'Fixed — the resonance is gone, nothing else touched';

            const capAlpha = f < HOLD_END ? 1 : clamp(1 - (f - HOLD_END) / (CYCLE - HOLD_END - 40), 0, 1);
            ctx.globalAlpha = capAlpha;
            ctx.fillStyle = '#374151';
            ctx.font = 'bold 9px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(caption, W / 2, capY);
            ctx.globalAlpha = 1;

            const phase = f < SWEEP_END ? 'Sweeping' : f < LOCK_END ? 'Locking' : f < FLIP_END ? 'Flipping' : 'Fixed';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - margin.right, 14);

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
