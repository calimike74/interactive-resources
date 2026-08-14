'use client';

import { useEffect, useRef } from 'react';

// Every line in this diagram (the fader rail, the fixed pre-fader send and the
// moving post-fader send) is confined to y in [45,210] by construction: the
// rail runs y=50-208, the fixed pre-tap line sits at y=55, and the post-tap
// line's only y-values are the moving fader position (55-205) and its fixed
// elbow at y=127 — all inside [45,210]. Every label in this file is placed at
// y<=37 (title/legend) or y>=222 (meter names/caption/phase) — outside that
// band entirely — so no label can ever be crossed by a line, independent of
// the fader's current animated position. Meter bars themselves (x>=225) are
// not "lines" in the crossing sense; their own name labels sit at y=222, 17px
// below the rail's bottom (208) and 12px below the bars' own bottom (210).
export default function PrePostFaderTap() {
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

        const railX = 100;
        const railTop = 50;
        const railBot = 208;
        const preY = 55;
        const elbowX = 180;
        const postElbowY = 127;
        const meterPre = { x: 225, w: 18, top: 50, bot: 205 };
        const meterPost = { x: 280, w: 18, top: 50, bot: 205 };

        const PHASE_RAIL = 20;
        const PHASE_LEGEND = 55;
        const PHASE_METERS = 85;
        const PULL_START = 130;
        // illustrative — not a measured value (see w2-task-6-report)
        const PULL_DUR = 180;
        const HOLD = 40;
        const RETURN_DUR = 80;
        const PULL_END = PULL_START + PULL_DUR; // 310
        const HOLD_END = PULL_END + HOLD; // 350
        const RETURN_END = HOLD_END + RETURN_DUR; // 430

        const faderY = (f) => {
            if (f < PULL_START) return preY;
            if (f < PULL_END) {
                const p = easeOut((f - PULL_START) / PULL_DUR);
                return preY + 150 * p;
            }
            if (f < HOLD_END) return 205;
            if (f < RETURN_END) {
                const p = easeOut((f - HOLD_END) / RETURN_DUR);
                return 205 - 150 * p;
            }
            return preY;
        };

        const draw = () => {
            frameRef.current = (frameRef.current + 0.6) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            const titleP = progress(f, 0, 20);
            ctx.globalAlpha = titleP;
            ctx.fillStyle = '#1a1a2e';
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Pre-Fader vs Post-Fader Sends', W / 2, 16);
            ctx.globalAlpha = 1;

            const legP = progress(f, PHASE_LEGEND, 20);
            if (legP > 0) {
                ctx.globalAlpha = legP;
                ctx.fillStyle = '#14b8a6';
                ctx.font = 'bold 8px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('● PRE: before the fader, always full', 20, 35);
                ctx.fillStyle = '#e85d75';
                ctx.textAlign = 'right';
                ctx.fillText('POST: after the fader, follows it down ●', 460, 35);
                ctx.globalAlpha = 1;
            }

            const railP = progress(f, PHASE_RAIL, 25);
            if (railP > 0) {
                ctx.globalAlpha = railP;
                ctx.strokeStyle = '#374151';
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.moveTo(railX, railTop);
                ctx.lineTo(railX, railBot);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            const metersP = progress(f, PHASE_METERS, 25);
            if (metersP > 0) {
                ctx.globalAlpha = metersP;
                ctx.strokeStyle = '#d1d5db';
                ctx.lineWidth = 1.2;
                [meterPre, meterPost].forEach((m) => {
                    ctx.strokeRect(m.x, m.top, m.w, m.bot - m.top);
                });
                ctx.globalAlpha = 1;
            }

            let fy = preY;
            if (railP >= 1) {
                fy = faderY(f);

                // PRE line: fixed, horizontal, at y=55, x 100 -> 225
                ctx.globalAlpha = metersP;
                ctx.strokeStyle = '#14b8a6';
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                ctx.moveTo(railX, preY);
                ctx.lineTo(meterPre.x, preY);
                ctx.stroke();

                // POST line: Manhattan, follows the fader cap, elbow at x=180,y=127
                ctx.strokeStyle = '#e85d75';
                ctx.beginPath();
                ctx.moveTo(railX, fy);
                ctx.lineTo(elbowX, fy);
                ctx.lineTo(elbowX, postElbowY);
                ctx.lineTo(meterPost.x, postElbowY);
                ctx.stroke();
                ctx.globalAlpha = 1;

                // Tap dots
                ctx.fillStyle = '#14b8a6';
                ctx.beginPath();
                ctx.arc(railX, preY, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#e85d75';
                ctx.beginPath();
                ctx.arc(railX, fy, 3, 0, Math.PI * 2);
                ctx.fill();

                // Fader cap (handle)
                ctx.fillStyle = '#374151';
                ctx.fillRect(railX - 12, fy - 3, 24, 6);

                // Meter fills
                const preFillH = meterPre.bot - meterPre.top;
                ctx.fillStyle = '#14b8a6';
                ctx.fillRect(meterPre.x, meterPre.bot - preFillH, meterPre.w, preFillH);

                const postFrac = clamp((205 - fy) / 150, 0, 1);
                const postFillH = (meterPost.bot - meterPost.top) * postFrac;
                ctx.fillStyle = '#e85d75';
                ctx.fillRect(meterPost.x, meterPost.bot - postFillH, meterPost.w, postFillH);
            }

            if (metersP > 0) {
                ctx.globalAlpha = metersP;
                ctx.fillStyle = '#374151';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('FADER', railX, 222);
                ctx.fillStyle = '#14b8a6';
                ctx.fillText('PRE', meterPre.x + meterPre.w / 2, 222);
                ctx.fillStyle = '#e85d75';
                ctx.fillText('POST', meterPost.x + meterPost.w / 2, 222);
                ctx.globalAlpha = 1;
            }

            let caption = '';
            let captionStart = 0;
            if (f >= HOLD_END) {
                caption = 'The pre-fader send never noticed: it keeps feeding the reverb regardless';
                captionStart = HOLD_END;
            } else if (f >= PULL_END) {
                caption = 'At the bottom, the post-fader send has followed the fader to nothing';
                captionStart = PULL_END;
            } else if (f >= PULL_START) {
                caption = 'Pull the fader down: the post-fader send follows it toward silence';
                captionStart = PULL_START;
            } else if (f >= PHASE_METERS + 10) {
                caption = 'Pre-fader taps before the fader; post-fader taps after it';
                captionStart = PHASE_METERS + 10;
            }
            if (caption) {
                const capP = progress(f, captionStart, 20);
                ctx.globalAlpha = capP;
                ctx.fillStyle = '#1a1a2e';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(caption, W / 2, 245);
                ctx.globalAlpha = 1;
            }

            const phase = f < PULL_START ? 'Fader up'
                : f < PULL_END ? 'Pulling down'
                : f < HOLD_END ? 'Silence'
                : 'Returning';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - 20, H - 8);

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
