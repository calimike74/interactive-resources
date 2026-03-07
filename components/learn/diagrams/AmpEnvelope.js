'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: "Percussive" preset → morphs to "Pad" → morphs to "Pluck"
export default function AmpEnvelope() {
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

        const CYCLE = 500;
        let animId;

        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);
        const lerp = (a, b, t) => a + (b - a) * t;

        // Presets: { attack, decay, sustain, release } (durations as fractions, sustain as level)
        const presets = [
            { name: 'Percussive', sub: 'Fast attack, no sustain — drums, hits', a: 0.02, d: 0.25, s: 0, sustainDur: 0.05, r: 0.15, color: '#DC2626' },
            { name: 'Pad', sub: 'Slow attack, long release — strings, pads', a: 0.25, d: 0.1, s: 0.7, sustainDur: 0.3, r: 0.3, color: '#1a1a6e' },
            { name: 'Pluck', sub: 'Fast attack, medium decay — guitar, keys', a: 0.02, d: 0.35, s: 0.15, sustainDur: 0.15, r: 0.25, color: '#059669' },
        ];

        // Get envelope value for a preset at time t (0-1)
        const envVal = (p, t) => {
            if (t < p.a) return t / p.a;
            if (t < p.a + p.d) return 1 - (1 - p.s) * ((t - p.a) / p.d);
            if (t < p.a + p.d + p.sustainDur) return p.s;
            if (t < p.a + p.d + p.sustainDur + p.r) return p.s * (1 - (t - p.a - p.d - p.sustainDur) / p.r);
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
            const envTop = 55;
            const envH = 110;
            const envW = envRight - envLeft;
            const envBase = envTop + envH;

            // Title
            const titleP = progress(f, 0, 25);
            ctx.globalAlpha = titleP;
            ctx.fillStyle = '#1a1a6e';
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Amplitude Envelope — Presets', W / 2, 18);
            ctx.globalAlpha = 1;

            // Base line
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(envLeft, envBase);
            ctx.lineTo(envRight, envBase);
            ctx.stroke();

            // Max line
            ctx.setLineDash([3, 3]);
            ctx.strokeStyle = '#d1d5db';
            ctx.beginPath();
            ctx.moveTo(envLeft, envTop);
            ctx.lineTo(envRight, envTop);
            ctx.stroke();
            ctx.setLineDash([]);

            // Y axis labels
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('Max', envLeft - 6, envTop + 4);
            ctx.fillText('0', envLeft - 6, envBase + 4);

            // X axis
            ctx.textAlign = 'center';
            ctx.fillText('Time →', (envLeft + envRight) / 2, envBase + 16);

            // Determine which preset(s) to show and morph between
            // Phase 1: 0-140 = Percussive
            // Phase 2: 140-280 = morph to Pad
            // Phase 3: 280-420 = morph to Pluck
            let currentPreset;
            let morphT = 0;
            let fromP, toP;

            if (f < 140) {
                currentPreset = presets[0];
                fromP = toP = presets[0];
                morphT = 0;
            } else if (f < 200) {
                // Morphing from percussive to pad
                fromP = presets[0];
                toP = presets[1];
                morphT = progress(f, 140, 50);
                currentPreset = toP;
            } else if (f < 300) {
                currentPreset = presets[1];
                fromP = toP = presets[1];
                morphT = 0;
            } else if (f < 360) {
                // Morphing from pad to pluck
                fromP = presets[1];
                toP = presets[2];
                morphT = progress(f, 300, 50);
                currentPreset = toP;
            } else {
                currentPreset = presets[2];
                fromP = toP = presets[2];
                morphT = 0;
            }

            // Interpolated envelope
            const drawEnv = (t) => {
                if (fromP === toP) return envVal(fromP, t);
                return lerp(envVal(fromP, t), envVal(toP, t), morphT);
            };

            // Active color
            const activeColor = morphT > 0 ? toP.color : currentPreset.color;

            // Draw envelope shape
            const envAppear = progress(f, 10, 50);
            ctx.globalAlpha = envAppear;

            // Fill under curve
            ctx.fillStyle = activeColor + '10';
            ctx.beginPath();
            ctx.moveTo(envLeft, envBase);
            for (let px = 0; px <= envW; px++) {
                const t = px / envW;
                const val = drawEnv(t);
                ctx.lineTo(envLeft + px, envBase - val * envH);
            }
            ctx.lineTo(envRight, envBase);
            ctx.fill();

            // Stroke
            ctx.strokeStyle = activeColor;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            for (let px = 0; px <= envW; px++) {
                const t = px / envW;
                const val = drawEnv(t);
                const y = envBase - val * envH;
                if (px === 0) ctx.moveTo(envLeft + px, y);
                else ctx.lineTo(envLeft + px, y);
            }
            ctx.stroke();

            ctx.globalAlpha = 1;

            // Preset name label
            const nameP = f < 140 ? progress(f, 30, 25) :
                f < 200 ? 1 :
                    f < 300 ? progress(f, 200, 25) :
                        f < 360 ? 1 :
                            progress(f, 360, 25);

            ctx.globalAlpha = nameP;
            ctx.fillStyle = activeColor;
            ctx.font = 'bold 12px -apple-system, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(currentPreset.name, envLeft, 42);

            ctx.fillStyle = '#6b7280';
            ctx.font = '9px -apple-system, sans-serif';
            ctx.fillText(currentPreset.sub, envLeft, 52);
            ctx.globalAlpha = 1;

            // Volume meter visualization at bottom
            const meterY = 200;
            const meterH = 30;

            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(envLeft - 5, meterY, envW + 10, meterH + 24, 6);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#6b7280';
            ctx.font = '9px -apple-system, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('Volume over time', envLeft, meterY + 12);

            // Animated volume level bar
            if (f >= 50) {
                const cycleLen = 120;
                const localF = (f - 50) % cycleLen;
                const playT = clamp(localF / cycleLen, 0, 1);
                const vol = drawEnv(playT);

                // Volume bar background
                ctx.fillStyle = '#e5e7eb';
                ctx.fillRect(envLeft, meterY + 18, envW, meterH - 6);

                // Volume bar fill
                ctx.fillStyle = activeColor + '40';
                ctx.fillRect(envLeft, meterY + 18, vol * envW, meterH - 6);

                // Playhead position
                const playX = envLeft + playT * envW;
                ctx.fillStyle = activeColor;
                ctx.fillRect(playX - 1, meterY + 16, 2, meterH - 2);
            }

            // Preset indicators at bottom
            const indicatorY = H - 18;
            presets.forEach((p, i) => {
                const isCurrent = currentPreset === p;
                const dotX = W / 2 - 60 + i * 60;

                ctx.fillStyle = isCurrent ? p.color : '#d1d5db';
                ctx.beginPath();
                ctx.arc(dotX, indicatorY, isCurrent ? 4 : 3, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = isCurrent ? p.color : '#9ca3af';
                ctx.font = `${isCurrent ? 'bold ' : ''}8px -apple-system, sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText(p.name, dotX, indicatorY + 12);
            });

            // Phase indicator
            const phase = f < 140 ? 'Percussive' : f < 300 ? 'Pad' : 'Pluck';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - 20, 18);

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
