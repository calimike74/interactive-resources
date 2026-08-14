'use client';

import { useEffect, useRef } from 'react';

// Two panels sharing one canvas, separated by a 76px vertical gap (panel A bottom
// 78 -> panel B top 154) with nothing drawn in that gap except the mechanism
// caption at y=95 (17px clear of 78, 55px clear of 154).
//
// Panel A (mechanism, y 36-118): DRIVER and PICKUP boxes with a zigzag "coil"
// between them; a dot bounces back and forth along the coil (riding the same
// sine formula the coil is drawn with, so it visually stays on the spring),
// and each rightward arrival at the pickup ticks a small decaying bar in a
// 3-bar reflection-count readout above the pickup box.
//
// Panel B (waveform comparison, y 150-259): INPUT is a single narrow wavelet;
// OUTPUT sums six wavelets of increasing width and decreasing amplitude —
// illustrative dispersion constants disclosed below — smearing a sharp spike
// into the twang. Both "INPUT"/"OUTPUT" row labels sit at x=20-50, and every
// wavelet in that row starts no earlier than x=102, so labels and waveforms
// are separated purely by x-domain (52px+ gap) regardless of animation state.
export default function SpringReverbMechanism() {
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

        const driver = { x: 20, y: 50, w: 56, h: 28 };
        const pickup = { x: 404, y: 50, w: 56, h: 28 };
        const coilY = 64;
        const coilX0 = driver.x + driver.w; // 76
        const coilX1 = pickup.x; // 404
        // illustrative — not a measured value (see w2-task-6-report)
        const coilAmp = 9;
        const coilPeriods = 8;
        const coilK = (Math.PI * 2 * coilPeriods) / (coilX1 - coilX0);
        const coilShape = (x) => coilY + coilAmp * Math.sin((x - coilX0) * coilK);

        const drawBox = (b, label, alpha) => {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#374151';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.roundRect(b.x, b.y, b.w, b.h, 5);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#374151';
            ctx.font = 'bold 9px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2 + 3);
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

        const PHASE_BOXES = 15;
        const PHASE_COIL = 45;
        const COIL_DUR = 40;
        const PHASE_BOUNCE = 95;
        // illustrative — not a measured value (see w2-task-6-report)
        const PASS_DUR = 50;
        const PASS_COUNT = 3;
        const PHASE_MECH_CAPTION = PHASE_BOUNCE + PASS_COUNT * PASS_DUR + 20;
        const PHASE_INPUT = PHASE_MECH_CAPTION + 20;
        const PHASE_OUTPUT = PHASE_INPUT + 40;
        const PHASE_CAPTION2 = PHASE_OUTPUT + 40;

        // Illustrative dispersion constants (not sourced from the reference): later
        // reflections are spaced increasingly far apart and get progressively wider,
        // which is what "smears" the output's shape relative to the sharp input.
        const humpCount = 6;
        const humpX = (i) => 130 + i * 32 + i * i * 3;
        const humpAmp = (i) => 24 * Math.pow(0.72, i);
        const humpWidth = (i) => 16 + i * 3;

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
            ctx.fillText('Spring Reverb: Dispersion Smears the Twang', W / 2, 16);
            ctx.globalAlpha = 1;

            // --- Panel A: mechanism ---
            const pBoxes = progress(f, PHASE_BOXES, 25);
            if (pBoxes > 0) {
                drawBox(driver, 'DRIVER', pBoxes);
                drawBox(pickup, 'PICKUP', pBoxes);
            }

            const pCoil = progress(f, PHASE_COIL, COIL_DUR);
            if (pCoil > 0) {
                ctx.globalAlpha = pCoil;
                ctx.strokeStyle = '#9ca3af';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                const revealX1 = coilX0 + (coilX1 - coilX0) * pCoil;
                for (let x = coilX0; x <= revealX1; x += 2) {
                    const y = coilShape(x);
                    if (x === coilX0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            // Bouncing dot + decaying reflection ticks
            let passesDone = 0;
            if (f >= PHASE_BOUNCE) {
                const elapsed = f - PHASE_BOUNCE;
                const passIdx = Math.min(PASS_COUNT - 1, Math.floor(elapsed / PASS_DUR));
                const localT = clamp((elapsed - passIdx * PASS_DUR) / PASS_DUR, 0, 1);
                const goingRight = passIdx % 2 === 0;
                const t = goingRight ? localT : 1 - localT;
                const dotX = coilX0 + (coilX1 - coilX0) * t;
                const dotY = coilShape(dotX);
                ctx.globalAlpha = 1 - passIdx * 0.15;
                ctx.fillStyle = '#14b8a6';
                ctx.beginPath();
                ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
                passesDone = Math.floor(elapsed / PASS_DUR);
            } else if (f >= PHASE_MECH_CAPTION) {
                passesDone = PASS_COUNT;
            }

            // Reflection ticks: 3 bars at x=408,424,440, y from 44 up to (44-height),
            // heights decaying per pass (tallest first) — clear of title (bottom ~19,
            // bars top >=26) and clear of pickup box top (50, bars bottom <=44, 6px gap).
            for (let i = 0; i < PASS_COUNT; i++) {
                if (i >= passesDone) continue;
                // illustrative — not a measured value (see w2-task-6-report)
                const h = 14 * Math.pow(0.6, i);
                ctx.fillStyle = '#f97316';
                ctx.fillRect(408 + i * 16, 44 - h, 10, h);
            }

            const mechCapP = progress(f, PHASE_MECH_CAPTION, 20);
            if (mechCapP > 0) {
                ctx.globalAlpha = mechCapP;
                ctx.fillStyle = '#374151';
                ctx.font = '9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Wave runs the coil, reflects, passes the pickup repeatedly', W / 2, 100);
                ctx.globalAlpha = 1;
            }

            // --- Panel B: input spike vs smeared output ---
            const pInput = progress(f, PHASE_INPUT, 25);
            if (pInput > 0) {
                ctx.globalAlpha = pInput;
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('INPUT', 20, 181);
                ctx.globalAlpha = 1;
                drawWavelet(110, 178, 24 * pInput, 8, '#374151', 1);
            }

            const pOutput = progress(f, PHASE_OUTPUT, 30);
            if (pOutput > 0) {
                ctx.globalAlpha = pOutput;
                ctx.fillStyle = '#e85d75';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('OUTPUT', 20, 225);
                ctx.globalAlpha = 1;
                for (let i = 0; i < humpCount; i++) {
                    drawWavelet(humpX(i), 222, humpAmp(i) * pOutput, humpWidth(i), '#e85d75', 1);
                }
            }

            const cap2P = progress(f, PHASE_CAPTION2, 25);
            if (cap2P > 0) {
                ctx.globalAlpha = cap2P;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Dispersion smears the sharp attack into the characteristic twang', W / 2, 258);
                ctx.globalAlpha = 1;
            }

            const phase = f < PHASE_BOUNCE ? 'Coil'
                : f < PHASE_MECH_CAPTION ? 'Reflecting'
                : f < PHASE_INPUT ? 'Passing the pickup'
                : f < PHASE_OUTPUT ? 'Input'
                : 'Output: the twang';
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
