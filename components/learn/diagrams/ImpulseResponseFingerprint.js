'use client';

import { useEffect, useRef } from 'react';

// Two panels, "Capture" (x 30-210) then "Use" (x 270-450), separated by a plain
// divider at x=240 that never intersects either panel's content. Each panel is a
// short linear flow (spike/signal -> box -> waveform), so every arrow is a short
// straight segment strictly between two element edges, and every label sits
// either inside a box (masked) or vertically offset from the nearest curve by a
// margin stated inline. Constants below are illustrative rendering choices
// (spike/hump shapes), not measurements — disclosed in the report.
export default function ImpulseResponseFingerprint() {
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

        const arrowHead = (x, y, dx, dy, color) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - dx - dy, y - dy + dx);
            ctx.lineTo(x - dx + dy, y - dy - dx);
            ctx.closePath();
            ctx.fill();
        };

        // Fixed deterministic "ragged" texture shared by both ragged waveforms —
        // same fixed-sum-of-sines technique as AbsorbVsDiffuse.js, not Math.random.
        const raggedNoise = (t) => 0.5 * Math.sin(t * 11) + 0.3 * Math.sin(t * 23 + 1) + 0.2 * Math.sin(t * 37 + 2);
        const raggedEnvelope = (xNorm, decay) => Math.max(0, Math.exp(-xNorm * decay) * (1 + 0.4 * raggedNoise(xNorm * 8)));

        const drawRaggedWaveform = (x0, x1, baseline, maxAmp, decay, phaseOffset, alpha) => {
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = '#DCC892';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            const n = 60;
            for (let i = 0; i <= n; i++) {
                const xNorm = i / n;
                const x = x0 + (x1 - x0) * xNorm;
                const env = raggedEnvelope(xNorm + phaseOffset, decay);
                const y = baseline - env * maxAmp * Math.sin(xNorm * 40 + phaseOffset * 5);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
        };

        const drawWavelet = (x, y, amplitude, width, color, alpha) => {
            const prev = ctx.globalAlpha;
            ctx.globalAlpha = prev * alpha;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (let dx = -width; dx <= width; dx++) {
                const env = Math.exp(-Math.abs(dx) / (width * 0.4));
                const yOffset = Math.sin(dx * (12 / width)) * amplitude * env;
                const px = x + dx;
                const py = y + yOffset;
                if (dx === -width) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.stroke();
            ctx.globalAlpha = prev;
        };

        const room = { x: 100, y: 75, w: 60, h: 30 };
        const irBox = { x: 340, y: 75, w: 60, h: 30 };

        const PHASE_HEADERS = 15;
        const PHASE_IMPULSE = 40;
        const PHASE_ROOM = 70;
        const PHASE_IR = 105;
        const PHASE_IRLABEL = 140;
        const PHASE_SIGNAL = 190;
        const PHASE_IRBOX = 215;
        const PHASE_OUTPUT = 250;
        const PHASE_OUTLABEL = 285;
        const PHASE_CAPTION = 320;

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
            ctx.fillText("Convolution: Capture the Room's Fingerprint, Then Use It", W / 2, 16);
            ctx.globalAlpha = 1;

            const headP = progress(f, PHASE_HEADERS, 20);
            if (headP > 0) {
                ctx.globalAlpha = headP;
                ctx.fillStyle = '#14b8a6';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('1. CAPTURE', 120, 36);
                ctx.fillStyle = '#e85d75';
                ctx.fillText('2. USE', 360, 36);
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(240, 40);
                ctx.lineTo(240, 235);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            // --- Panel A: capture ---
            const impP = progress(f, PHASE_IMPULSE, 22);
            if (impP > 0) {
                drawWavelet(60, 90, 22 * impP, 8, '#374151', 1);
                ctx.globalAlpha = impP;
                ctx.fillStyle = '#374151';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('impulse', 60, 132);
                ctx.globalAlpha = 1;
            }
            const roomP = progress(f, PHASE_ROOM, 22);
            if (roomP > 0) {
                ctx.globalAlpha = roomP;
                ctx.strokeStyle = '#374151';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(76, 90);
                ctx.lineTo(room.x, 90);
                ctx.stroke();
                arrowHead(room.x, 90, 5, 0, '#374151');
                ctx.globalAlpha = 1;
                drawBox(room, 'ROOM', null, '#374151', roomP);
            }
            const irArrowP = progress(f, PHASE_IR, 20);
            if (irArrowP > 0) {
                ctx.globalAlpha = irArrowP;
                ctx.strokeStyle = '#DCC892';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(130, room.y + room.h);
                ctx.lineTo(130, 145);
                ctx.stroke();
                arrowHead(130, 145, 0, 5, '#DCC892');
                ctx.globalAlpha = 1;
                drawRaggedWaveform(30, 210, 172, 20, 4.5, 0, irArrowP);
            }
            const irLabelP = progress(f, PHASE_IRLABEL, 20);
            if (irLabelP > 0) {
                ctx.globalAlpha = irLabelP;
                ctx.fillStyle = '#DCC892';
                ctx.font = 'bold 8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText("IR: the room's fingerprint", 120, 218);
                ctx.globalAlpha = 1;
            }

            // --- Panel B: use ---
            const sigP = progress(f, PHASE_SIGNAL, 22);
            if (sigP > 0) {
                ctx.globalAlpha = sigP;
                ctx.strokeStyle = '#374151';
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                for (let dx = -18; dx <= 18; dx++) {
                    const y = 90 + Math.sin(dx * 0.5) * 9;
                    if (dx === -18) ctx.moveTo(300 + dx, y);
                    else ctx.lineTo(300 + dx, y);
                }
                ctx.stroke();
                ctx.fillStyle = '#374151';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('signal', 300, 126);
                ctx.globalAlpha = 1;
            }
            const irBoxP = progress(f, PHASE_IRBOX, 22);
            if (irBoxP > 0) {
                ctx.globalAlpha = irBoxP;
                ctx.strokeStyle = '#374151';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(320, 90);
                ctx.lineTo(irBox.x, 90);
                ctx.stroke();
                arrowHead(irBox.x, 90, 5, 0, '#374151');
                ctx.globalAlpha = 1;
                drawBox(irBox, 'IR', 'convolution', '#e85d75', irBoxP);
            }
            const outArrowP = progress(f, PHASE_OUTPUT, 22);
            if (outArrowP > 0) {
                ctx.globalAlpha = outArrowP;
                ctx.strokeStyle = '#e85d75';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(370, irBox.y + irBox.h);
                ctx.lineTo(370, 145);
                ctx.stroke();
                arrowHead(370, 145, 0, 5, '#e85d75');
                ctx.globalAlpha = 1;
                drawRaggedWaveform(270, 450, 172, 20, 4.5, 0.35, outArrowP);
            }
            const outLabelP = progress(f, PHASE_OUTLABEL, 20);
            if (outLabelP > 0) {
                ctx.globalAlpha = outLabelP;
                ctx.fillStyle = '#e85d75';
                ctx.font = 'bold 8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText("output: carries the room's character", 360, 218);
                ctx.globalAlpha = 1;
            }

            const capP = progress(f, PHASE_CAPTION, 25);
            if (capP > 0) {
                ctx.globalAlpha = capP;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText("Realistic because it's a real space: but that space is now fixed", W / 2, 252);
                ctx.globalAlpha = 1;
            }

            const phase = f < PHASE_ROOM ? 'Fire the impulse'
                : f < PHASE_IR ? 'Record the room'
                : f < PHASE_SIGNAL ? 'The IR captured'
                : f < PHASE_IRBOX ? 'Your signal'
                : f < PHASE_OUTPUT ? 'Through the IR'
                : 'Fixed but realistic';
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
