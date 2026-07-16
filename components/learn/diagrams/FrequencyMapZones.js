'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: named zones fill in left to right along a log frequency strip, each
// with its own colour, name and (where the row states one) a numeric range. The two stretches the
// row doesn't name — 5–8 kHz and 12–20 kHz — stay unfilled rather than inventing boundaries.
export default function FrequencyMapZones() {
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

        const FREQ_MIN = 20;
        const FREQ_MAX = 20000;
        const stripLeft = 30;
        const stripRight = 450;
        const stripW = stripRight - stripLeft;
        const stripY = 110;
        const stripH = 60;

        const freqToX = (freq) =>
            stripLeft + (Math.log10(freq / FREQ_MIN) / Math.log10(FREQ_MAX / FREQ_MIN)) * stripW;

        // Zones exactly as the row states them; "Mids" has no numeric bounds in the source text,
        // so it fills the gap between low-mids and presence with a name only, no invented figures.
        const zones = [
            { name: 'Sub-bass', from: FREQ_MIN, to: 50, range: '', color: '#1a1a6e', start: 40 },
            { name: 'Bass', from: 50, to: 200, range: '50–200 Hz', color: '#9B7530', start: 100 },
            { name: 'Low-mids', from: 200, to: 500, range: '200–500 Hz', color: '#f97316', start: 160 },
            { name: 'Mids', from: 500, to: 2000, range: '', color: '#2563EB', start: 220 },
            { name: 'Presence', from: 2000, to: 5000, range: '2–5 kHz', color: '#0891b2', start: 280 },
            { name: 'Air', from: 8000, to: 12000, range: '8–12 kHz', color: '#059669', start: 340 },
        ];

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
            ctx.fillText('The Frequency Map', W / 2, 18);
            ctx.globalAlpha = 1;

            // Strip outline (drawn early so unlabelled gaps still read as part of the spectrum)
            const outlineP = progress(f, 15, 30);
            if (outlineP > 0) {
                ctx.globalAlpha = outlineP;
                ctx.fillStyle = '#fff';
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(stripLeft, stripY, stripW, stripH, 4);
                ctx.fill();
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            zones.forEach((zone) => {
                const zp = progress(f, zone.start, 60);
                if (zp <= 0) return;

                const x1 = freqToX(zone.from);
                const x2 = freqToX(zone.to);
                const zw = (x2 - x1) * zp;

                ctx.globalAlpha = zp;
                ctx.fillStyle = zone.color + '33';
                ctx.fillRect(x1, stripY, zw, stripH);
                ctx.strokeStyle = zone.color;
                ctx.lineWidth = 1;
                ctx.strokeRect(x1, stripY, zw, stripH);

                if (zp > 0.5) {
                    const labelAlpha = (zp - 0.5) / 0.5;
                    ctx.globalAlpha = labelAlpha;
                    ctx.fillStyle = zone.color;
                    ctx.textAlign = 'center';
                    const cx = x1 + (x2 - x1) / 2;
                    ctx.font = 'bold 9px -apple-system, sans-serif';
                    ctx.fillText(zone.name, cx, stripY + stripH / 2 - (zone.range ? 4 : 0));
                    if (zone.range) {
                        ctx.font = '8px -apple-system, sans-serif';
                        ctx.fillText(zone.range, cx, stripY + stripH / 2 + 10);
                    }
                }
                ctx.globalAlpha = 1;
            });

            // Frequency axis ticks below the strip
            const axisP = progress(f, 380, 40);
            if (axisP > 0) {
                ctx.globalAlpha = axisP;
                ctx.strokeStyle = '#d1d5db';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(stripLeft, stripY + stripH + 4);
                ctx.lineTo(stripRight, stripY + stripH + 4);
                ctx.stroke();

                [20, 50, 200, 500, 2000, 5000, 8000, 12000, 20000].forEach((freq) => {
                    const x = freqToX(freq);
                    ctx.beginPath();
                    ctx.moveTo(x, stripY + stripH + 2);
                    ctx.lineTo(x, stripY + stripH + 8);
                    ctx.stroke();
                });

                ctx.fillStyle = '#9ca3af';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('20 Hz', stripLeft, stripY + stripH + 22);
                ctx.textAlign = 'right';
                ctx.fillText('20 kHz', stripRight, stripY + stripH + 22);
                ctx.globalAlpha = 1;
            }

            // Caveat caption — matches the row's own hedge on the boundaries
            const capP = progress(f, 440, 40) * (f < CYCLE - 60 ? 1 : clamp(1 - (f - (CYCLE - 60)) / 30, 0, 1));
            if (capP > 0) {
                ctx.globalAlpha = capP;
                ctx.fillStyle = '#6b7280';
                ctx.font = 'italic 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Approximate zones, not hard lines — sources disagree on the exact edges', W / 2, stripY + stripH + 44);
                ctx.globalAlpha = 1;
            }

            const phase = f < 380 ? 'Zones' : f < 440 ? 'Axis' : 'Complete';
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
