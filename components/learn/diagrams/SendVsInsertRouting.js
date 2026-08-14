'use client';

import { useEffect, useRef } from 'react';

// Two mini mixer panels: Send/Return (x 20-230) vs Insert (x 260-460). Each
// panel's "stereo field" is a horizontal bar at a fixed y=100 with a dot that
// moves along it; the per-bar caption sits at y=115, a full 15px below that bar
// — since the dot only ever moves horizontally at y=100 (never changes y), the
// 15px vertical gap keeps every caption clear of the dot regardless of where it
// currently sits on the bar. The single dashed send connector (panel A) is a
// fixed 10px segment between the two boxes at y=68, nowhere near any label.
export default function SendVsInsertRouting() {
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
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);

        const drawBox = (b, label, sub, stroke, alpha) => {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = stroke;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.roundRect(b.x, b.y, b.w, b.h, 5);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = stroke;
            ctx.font = 'bold 9px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2 + (sub ? -2 : 3));
            if (sub) {
                ctx.font = '7px -apple-system, sans-serif';
                ctx.fillStyle = '#6b7280';
                ctx.fillText(sub, b.x + b.w / 2, b.y + b.h / 2 + 10);
            }
            ctx.globalAlpha = 1;
        };

        const channelA = { x: 35, y: 55, w: 90, h: 26 };
        const reverbA = { x: 135, y: 55, w: 90, h: 26 };
        const channelB = { x: 275, y: 55, w: 170, h: 26 };

        const barY = 100;
        const barA1 = { x0: 35, x1: 125 }; // under channelA
        const barA2 = { x0: 135, x1: 225 }; // under reverbA (fixed centre)
        const barB = { x0: 275, x1: 445 }; // under channelB

        // illustrative — not a measured value (see w2-task-6-report)
        const PANPERIOD = 240;
        const panOffset = (f) => Math.sin((2 * Math.PI * f) / PANPERIOD);

        const drawBar = (b, dotX, dotColor, alpha) => {
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = '#d1d5db';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(b.x0, barY);
            ctx.lineTo(b.x1, barY);
            ctx.stroke();
            ctx.fillStyle = dotColor;
            ctx.beginPath();
            ctx.arc(dotX, barY, 3.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        };

        const PHASE_HEADERS = 15;
        const PHASE_BOXES_A = 40;
        const PHASE_SEND = 75;
        const PHASE_BARS_A = 95;
        const PHASE_BOX_B = 40;
        const PHASE_BAR_B = 95;
        const PHASE_PAN = 140;

        const captions = [
            { start: 20, text: 'Send/return: every channel taps one shared reverb' },
            { start: 150, text: "The reverb holds its own stereo position as the channel pans" },
            { start: 280, text: "Insert: reverb sits inside the channel's own signal path" },
            { start: 400, text: 'Panning the channel pans its insert reverb right along with it' },
        ];

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
            ctx.fillText('Where Reverb Sits: Send/Return vs Insert', W / 2, 16);
            ctx.globalAlpha = 1;

            const headP = progress(f, PHASE_HEADERS, 18);
            if (headP > 0) {
                ctx.globalAlpha = headP;
                ctx.fillStyle = '#14b8a6';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Send / Return', 125, 36);
                ctx.fillStyle = '#e85d75';
                ctx.fillText('Insert', 360, 36);
                ctx.globalAlpha = 1;
            }

            const pA = progress(f, PHASE_BOXES_A, 25);
            if (pA > 0) {
                drawBox(channelA, 'CHANNEL', null, '#14b8a6', pA);
                drawBox(reverbA, 'REVERB', 'return', '#14b8a6', pA);
            }
            const pSend = progress(f, PHASE_SEND, 20);
            if (pSend > 0) {
                ctx.globalAlpha = pSend;
                ctx.strokeStyle = '#14b8a6';
                ctx.lineWidth = 1.3;
                ctx.setLineDash([3, 2]);
                ctx.beginPath();
                ctx.moveTo(channelA.x + channelA.w, 68);
                ctx.lineTo(reverbA.x, 68);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.globalAlpha = 1;
            }

            const pBoxB = progress(f, PHASE_BOX_B, 25);
            if (pBoxB > 0) drawBox(channelB, 'CHANNEL', '+ reverb inside', '#e85d75', pBoxB);

            const pBarsA = progress(f, PHASE_BARS_A, 20);
            if (pBarsA > 0) {
                const pan = f >= PHASE_PAN ? panOffset(f - PHASE_PAN) : 0;
                // illustrative — not a measured value (see w2-task-6-report)
                const dotAx = 80 + 40 * pan; // stays within [35,125] since |pan|<=1
                drawBar(barA1, dotAx, '#DC2626', pBarsA);
                drawBar(barA2, 180, '#14b8a6', pBarsA); // reverb dot fixed at centre
                ctx.globalAlpha = pBarsA;
                ctx.fillStyle = '#374151';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('channel pans', 80, 118);
                ctx.fillText('reverb stays put', 180, 118);
                ctx.globalAlpha = 1;
            }

            const pBarB = progress(f, PHASE_BAR_B, 20);
            if (pBarB > 0) {
                const pan = f >= PHASE_PAN ? panOffset(f - PHASE_PAN) : 0;
                // illustrative — not a measured value (see w2-task-6-report)
                const dotBx = 360 + 70 * pan; // stays within [275,445]
                drawBar(barB, dotBx, '#DC2626', pBarB);
                ctx.globalAlpha = pBarB;
                ctx.fillStyle = '#374151';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('everything pans together', 360, 118);
                ctx.globalAlpha = 1;
            }

            let caption = '';
            let captionStart = 0;
            for (const c of captions) {
                if (f >= c.start) {
                    caption = c.text;
                    captionStart = c.start;
                }
            }
            if (caption) {
                const capP = progress(f, captionStart, 20);
                ctx.globalAlpha = capP;
                ctx.fillStyle = '#1a1a2e';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(caption, W / 2, 232);
                ctx.globalAlpha = 1;
            }

            const phase = f < PHASE_PAN ? 'Wired up' : 'Panning...';
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
