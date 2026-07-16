'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: ticks placed at linear positions (five of ten octave-doublings crammed
// into the first 3% of the axis) → the same ticks tween across to their log positions → labels
// fade in now that they have room → two equal-width octave brackets (one low, one high) show that
// the same musical step always earns the same physical distance on a log axis.
export default function LogFrequencyAxis() {
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
        const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);

        // Ten octave doublings from 20 Hz — the point of the diagram is that these are equal
        // musical steps, however uneven they look in raw Hz.
        const freqs = [20, 40, 80, 160, 320, 640, 1280, 2560, 5120, 10240, 20480];
        const labels = ['20', '40', '80', '160', '320', '640', '1.3k', '2.5k', '5k', '10k', '20k'];

        const axisLeft = 44;
        const axisRight = 444;
        const axisW = axisRight - axisLeft;
        const axisY = 150;
        const fMin = freqs[0];
        const fMax = freqs[freqs.length - 1];

        const linearX = (freq) => axisLeft + (freq / fMax) * axisW;
        const logX = (freq) => axisLeft + (Math.log10(freq / fMin) / Math.log10(fMax / fMin)) * axisW;

        const draw = () => {
            frameRef.current = (frameRef.current + 1) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);

            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            const titleP = progress(f, 0, 25);
            ctx.globalAlpha = titleP;
            ctx.fillStyle = '#1a1a6e';
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('The Log Frequency Axis', W / 2, 18);
            ctx.globalAlpha = 1;

            // Axis line
            const axisP = progress(f, 20, 40);
            if (axisP > 0) {
                ctx.globalAlpha = axisP;
                ctx.strokeStyle = '#d1d5db';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(axisLeft, axisY);
                ctx.lineTo(axisLeft + axisW * axisP, axisY);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            // --- Phase 1 (60-160): ticks at LINEAR positions, bunched left ---
            const p1 = progress(f, 60, 50);
            // --- Phase 2 (170-330): tween tick x from linear to log ---
            const tweenT = progress(f, 170, 160);
            const tween = easeInOut(tweenT);
            // --- Phase 3 (300-360): value labels fade in once spread out ---
            const labelP = progress(f, 300, 60);

            if (p1 > 0) {
                freqs.forEach((freq) => {
                    const lx = linearX(freq);
                    const ly = logX(freq);
                    const x = lx + (ly - lx) * tween;

                    ctx.globalAlpha = p1;
                    ctx.strokeStyle = '#1a1a6e';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(x, axisY - 6);
                    ctx.lineTo(x, axisY + 6);
                    ctx.stroke();

                    if (labelP > 0) {
                        ctx.globalAlpha = labelP;
                        ctx.fillStyle = '#1a1a6e';
                        ctx.font = '8px -apple-system, sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillText(labels[freqs.indexOf(freq)], x, axisY - 12);
                    }
                    ctx.globalAlpha = 1;
                });
            }

            // Bunched-cluster callout — only while still in the linear layout
            const bracketFade = 1 - progress(f, 150, 30);
            if (p1 > 0 && bracketFade > 0 && tweenT < 0.3) {
                const alpha = p1 * bracketFade;
                ctx.globalAlpha = alpha;
                const bx1 = linearX(freqs[0]);
                const bx2 = linearX(freqs[5]);
                ctx.fillStyle = 'rgba(220, 38, 38, 0.10)';
                ctx.fillRect(bx1 - 2, axisY - 30, bx2 - bx1 + 4, 24);
                ctx.strokeStyle = '#DC2626';
                ctx.lineWidth = 1;
                ctx.strokeRect(bx1 - 2, axisY - 30, bx2 - bx1 + 4, 24);
                ctx.fillStyle = '#DC2626';
                ctx.font = 'bold 8px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('5 of 10 doublings inside 3% of the axis', bx2 + 8, axisY - 14);
                ctx.globalAlpha = 1;
            }

            // Caption for the linear phase
            const capA = p1 * bracketFade;
            if (capA > 0) {
                ctx.globalAlpha = capA;
                ctx.fillStyle = '#6b7280';
                ctx.font = '9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Linear axis — equal Hz steps, wildly unequal musical steps', W / 2, axisY + 34);
                ctx.globalAlpha = 1;
            }

            // Caption once spread into log layout
            const capB = progress(f, 340, 40) * (f < CYCLE - 60 ? 1 : clamp(1 - (f - (CYCLE - 60)) / 30, 0, 1));
            if (capB > 0) {
                ctx.globalAlpha = capB;
                ctx.fillStyle = '#6b7280';
                ctx.font = '9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Log axis — every octave doubling gets equal room', W / 2, axisY + 34);
                ctx.globalAlpha = 1;
            }

            // --- Phase 4 (380-520): two equal-width octave brackets below the axis ---
            const bktP = progress(f, 380, 50);
            if (bktP > 0) {
                ctx.globalAlpha = bktP;
                const drawBracket = (iStart, iEnd, y) => {
                    const x1 = logX(freqs[iStart]);
                    const x2 = logX(freqs[iEnd]);
                    ctx.strokeStyle = '#9B7530';
                    ctx.lineWidth = 1.2;
                    ctx.beginPath();
                    ctx.moveTo(x1, y);
                    ctx.lineTo(x1, y + 6);
                    ctx.lineTo(x2, y + 6);
                    ctx.lineTo(x2, y);
                    ctx.stroke();
                    ctx.fillStyle = '#9B7530';
                    ctx.font = 'bold 8px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('1 octave', (x1 + x2) / 2, y + 18);
                };
                drawBracket(2, 3, axisY + 44); // 80 → 160
                drawBracket(7, 8, axisY + 44); // 2.56k → 5.12k
                ctx.globalAlpha = 1;
            }

            const finalCap = progress(f, 440, 40) * (f < CYCLE - 60 ? 1 : clamp(1 - (f - (CYCLE - 60)) / 30, 0, 1));
            if (finalCap > 0) {
                ctx.globalAlpha = finalCap;
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText("Same width, low or high — that's why the axis is drawn this way", W / 2, axisY + 78);
                ctx.globalAlpha = 1;
            }

            const phase = f < 170 ? 'Linear' : f < 330 ? 'Tweening' : f < 380 ? 'Log' : 'Octaves';
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

    return (
        <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', borderRadius: '0.75rem' }}
        />
    );
}
