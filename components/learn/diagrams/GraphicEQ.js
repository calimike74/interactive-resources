'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: empty rack → bands appear one by one → sliders move → curve forms
export default function GraphicEQ() {
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

        const CYCLE = 450;
        let animId;

        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);

        const bands = [
            { freq: '31', target: 0, dB: '0' },
            { freq: '63', target: -3, dB: '-3' },
            { freq: '125', target: 2, dB: '+2' },
            { freq: '250', target: 5, dB: '+5' },
            { freq: '500', target: 8, dB: '+8' },
            { freq: '1k', target: 4, dB: '+4' },
            { freq: '2k', target: -2, dB: '-2' },
            { freq: '4k', target: -6, dB: '-6' },
            { freq: '8k', target: -4, dB: '-4' },
            { freq: '16k', target: -8, dB: '-8' },
        ];

        const draw = () => {
            frameRef.current = (frameRef.current + 1) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);

            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            const marginX = 50;
            const slotWidth = (W - marginX * 2) / bands.length;
            const centerY = H / 2 + 8;
            const maxTravel = 75;

            // Zero line
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(marginX, centerY);
            ctx.lineTo(W - marginX, centerY);
            ctx.stroke();

            // +/- labels
            ctx.fillStyle = '#9ca3af';
            ctx.font = '9px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('+12dB', marginX - 6, centerY - maxTravel + 4);
            ctx.fillText('0dB', marginX - 6, centerY + 4);
            ctx.fillText('-12dB', marginX - 6, centerY + maxTravel + 4);

            // --- Phase 1 (0-120): Tracks appear one by one ---
            bands.forEach((band, i) => {
                const x = marginX + i * slotWidth + slotWidth / 2;
                const trackAppear = progress(f, i * 8, 25);

                if (trackAppear <= 0) return;

                ctx.globalAlpha = trackAppear;

                // Track
                ctx.strokeStyle = '#d1d5db';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x, centerY - maxTravel);
                ctx.lineTo(x, centerY + maxTravel);
                ctx.stroke();

                // Frequency label
                ctx.fillStyle = '#6b7280';
                ctx.font = '9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(band.freq, x, H - 10);

                // --- Phase 2 (120-280): Sliders move to positions ---
                const sliderMove = progress(f, 120 + i * 10, 50);
                const sliderY = centerY - band.target * (maxTravel / 12) * sliderMove;

                // Fill from center
                const isBoost = band.target * sliderMove > 0;
                if (sliderMove > 0) {
                    ctx.fillStyle = isBoost ? 'rgba(249, 115, 22, 0.12)' : 'rgba(37, 99, 235, 0.10)';
                    ctx.fillRect(x - 8, Math.min(centerY, sliderY), 16, Math.abs(sliderY - centerY));
                }

                // Thumb
                ctx.fillStyle = sliderMove > 0 ? (isBoost ? '#f97316' : '#2563EB') : '#d1d5db';
                ctx.beginPath();
                ctx.roundRect(x - 10, sliderY - 5, 20, 10, 3);
                ctx.fill();

                // --- Phase 3 (300-360): dB labels appear on active sliders ---
                if (band.target !== 0) {
                    const labelAppear = progress(f, 300, 30);
                    if (labelAppear > 0) {
                        ctx.globalAlpha = labelAppear;
                        ctx.fillStyle = isBoost ? '#f97316' : '#2563EB';
                        ctx.font = 'bold 8px -apple-system, sans-serif';
                        ctx.textAlign = 'center';
                        const labelY = sliderY + (isBoost ? -12 : 18);
                        ctx.fillText(band.dB, x, labelY);
                    }
                }

                ctx.globalAlpha = 1;
            });

            // --- Phase 3 (300+): "Fixed frequencies" annotation ---
            const annotAppear = progress(f, 310, 30);
            if (annotAppear > 0) {
                ctx.globalAlpha = annotAppear;

                // Highlight the constraint: fixed positions
                ctx.strokeStyle = '#f97316';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                const y = H - 22;
                ctx.beginPath();
                ctx.moveTo(marginX + slotWidth / 2, y);
                ctx.lineTo(marginX + (bands.length - 0.5) * slotWidth, y);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.fillStyle = '#f97316';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Fixed frequency positions — you get what you get', W / 2, y - 4);

                ctx.globalAlpha = 1;
            }

            // Title
            const titleAppear = progress(f, 0, 30);
            ctx.globalAlpha = titleAppear;
            ctx.fillStyle = '#374151';
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('10-Band Graphic EQ', W / 2, 18);
            ctx.globalAlpha = 1;

            // Fade out at end
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
