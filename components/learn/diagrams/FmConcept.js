'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: MODULATOR box → arrow → CARRIER box fade in → a carrier output trace
// below shows real FM phase-modulation maths (sin(carrier + index*sin(modulator))): slow, shallow
// modulation reads as vibrato, then rate and index both ramp up until the ripple stops looking
// like a wobble and starts looking like a new, denser waveform → a spectrum panel then grows
// sidebands (amber) symmetrically around the carrier bin (indigo) as that same drive increases.
export default function FmConcept() {
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

        const CYCLE = 760;
        let animId;

        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);
        const lerp = (a, b, t) => a + (b - a) * t;
        const drawRR = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };

        const VIOLET = '#7c3aed'; // modulator (the shaking force)
        const INDIGO = '#1a1a6e'; // carrier (the audible tone)
        const AMBER = '#9B7530';  // sidebands (new frequency content)

        const modBox = { x: 40, y: 34, w: 92, h: 50 };
        const carBox = { x: 348, y: 34, w: 92, h: 50 };

        const draw = () => {
            frameRef.current = (frameRef.current + 1) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            // Title
            const titleP = progress(f, 0, 25);
            ctx.globalAlpha = titleP;
            ctx.fillStyle = INDIGO;
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Modulator Shakes the Carrier', W / 2, 18);
            ctx.globalAlpha = 1;

            // --- Boxes + arrow ---
            const boxP = progress(f, 25, 40);
            if (boxP > 0) {
                ctx.globalAlpha = boxP;
                [{ b: modBox, label: 'MODULATOR', sub: 'shakes frequency', color: VIOLET },
                 { b: carBox, label: 'CARRIER', sub: 'heard as pitch', color: INDIGO }].forEach(({ b, label, sub, color }) => {
                    ctx.fillStyle = '#fff';
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 1.5;
                    drawRR(b.x, b.y, b.w, b.h, 6);
                    ctx.fill();
                    ctx.stroke();
                    ctx.fillStyle = color;
                    ctx.font = 'bold 9px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(label, b.x + b.w / 2, b.y + 18);
                    ctx.fillStyle = '#6b7280';
                    ctx.font = '7.5px -apple-system, sans-serif';
                    ctx.fillText(sub, b.x + b.w / 2, b.y + 30);

                    // mini sine icon
                    const iconW = b.w - 24;
                    const iconX = b.x + 12;
                    const iconY = b.y + 40;
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 1.2;
                    ctx.beginPath();
                    const iconPhase = (f % 160) / 160;
                    for (let px = 0; px <= iconW; px++) {
                        const nx = px / iconW + iconPhase;
                        const y = iconY - Math.sin(nx * Math.PI * 2) * 5;
                        if (px === 0) ctx.moveTo(iconX + px, y);
                        else ctx.lineTo(iconX + px, y);
                    }
                    ctx.stroke();
                });

                // Arrow modulator → carrier
                const arrowY = modBox.y + modBox.h / 2;
                ctx.strokeStyle = '#9ca3af';
                ctx.lineWidth = 1.3;
                ctx.beginPath();
                ctx.moveTo(modBox.x + modBox.w + 3, arrowY);
                ctx.lineTo(carBox.x - 3, arrowY);
                ctx.stroke();
                ctx.fillStyle = '#9ca3af';
                ctx.beginPath();
                ctx.moveTo(carBox.x - 3, arrowY);
                ctx.lineTo(carBox.x - 9, arrowY - 3);
                ctx.lineTo(carBox.x - 9, arrowY + 3);
                ctx.fill();
                ctx.fillStyle = '#9ca3af';
                ctx.font = '7.5px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('modulates frequency', W / 2, arrowY - 6);

                ctx.globalAlpha = 1;
            }

            // --- Waveform panel: real FM equation, slow/shallow → fast/deep ---
            const waveTop = 100;
            const waveH = 58;
            const waveLeft = 40;
            const waveRight = W - 40;
            const waveW = waveRight - waveLeft;
            const waveMidY = waveTop + waveH / 2;

            const wavePanelP = progress(f, 90, 30);
            if (wavePanelP > 0) {
                ctx.globalAlpha = wavePanelP;
                ctx.fillStyle = '#fff';
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 1;
                drawRR(waveLeft - 8, waveTop - 16, waveW + 16, waveH + 24, 6);
                ctx.fill();
                ctx.stroke();

                // drive: 0 = slow shallow (vibrato-like), 1 = audio-rate deep (sidebands)
                const drive = progress(f, 300, 110);
                const modCycles = lerp(1.2, 9, drive);
                const modIndex = lerp(2.2, 15, drive);
                const carrierCycles = 26;

                ctx.strokeStyle = INDIGO;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                for (let px = 0; px <= waveW; px++) {
                    const nx = px / waveW;
                    const phase = carrierCycles * nx * Math.PI * 2 + modIndex * Math.sin(modCycles * nx * Math.PI * 2);
                    const y = waveMidY - Math.sin(phase) * (waveH * 0.42);
                    if (px === 0) ctx.moveTo(waveLeft + px, y);
                    else ctx.lineTo(waveLeft + px, y);
                }
                ctx.stroke();

                ctx.fillStyle = drive < 0.5 ? VIOLET : AMBER;
                ctx.font = 'bold 8px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(drive < 0.5 ? 'Slow modulation: heard as vibrato' : 'Audio-rate modulation: a new, denser waveform', waveLeft - 4, waveTop - 22);

                ctx.globalAlpha = 1;
            }

            // --- Spectrum panel: carrier bin + growing sidebands ---
            const specTop = 196;
            const specH = 56;
            const specLeft = 40;
            const specRight = W - 40;
            const specW = specRight - specLeft;
            const specBase = specTop + specH;

            const specPanelP = progress(f, 470, 30);
            if (specPanelP > 0) {
                ctx.globalAlpha = specPanelP;
                ctx.fillStyle = '#fff';
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 1;
                drawRR(specLeft - 8, specTop - 16, specW + 16, specH + 22, 6);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#6b7280';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('Spectrum: no filter used', specLeft - 4, specTop - 22);

                const slots = 9;
                const slotW = specW / slots;
                const barW = slotW - 10;
                const centerSlot = 4;

                // Carrier bin
                const carrierBarH = specH * 0.75;
                const cx = specLeft + centerSlot * slotW + slotW / 2;
                ctx.fillStyle = INDIGO;
                ctx.fillRect(cx - barW / 2, specBase - carrierBarH, barW, carrierBarH);

                // Sidebands grow in, pair by pair
                const pairs = [
                    { n: 1, frame: 500 },
                    { n: 2, frame: 540 },
                    { n: 3, frame: 580 },
                ];
                pairs.forEach((pair) => {
                    const pP = progress(f, pair.frame, 35);
                    if (pP <= 0) return;
                    const h = carrierBarH * (0.62 / pair.n) * pP;
                    [-1, 1].forEach((sign) => {
                        const slot = centerSlot + sign * pair.n;
                        if (slot < 0 || slot >= slots) return;
                        const bx = specLeft + slot * slotW + slotW / 2;
                        ctx.globalAlpha = specPanelP * pP;
                        ctx.fillStyle = AMBER;
                        ctx.fillRect(bx - barW / 2, specBase - h, barW, h);
                    });
                    ctx.globalAlpha = specPanelP;
                });

                ctx.globalAlpha = specPanelP;
                ctx.fillStyle = INDIGO;
                ctx.font = '7px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('carrier', cx, specBase + 11);
                if (progress(f, 500, 35) > 0.5) {
                    ctx.fillStyle = AMBER;
                    ctx.fillText('sidebands', cx, specBase + 20);
                }

                ctx.globalAlpha = 1;
            }

            // Phase indicator
            const phase = f < 90 ? 'Modulator → Carrier' : f < 300 ? 'Vibrato' : f < 470 ? 'Audio rate' : f < 620 ? 'Sidebands' : 'Complete';
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
