'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: a ratio track with a marker sweeping between 2.00 and 2.37 (a big
// numeric readout mirrors QFactor's convention) sits above a spectrum panel. Sideband positions
// are the real fc ± n*(fc*ratio) relationship in carrier-frequency units: at ratio 2.00 they land
// exactly on the dashed harmonic grid (indigo, evenly spaced); as the ratio drifts to 2.37 they
// drift off-grid into a clustered, unevenly spaced pattern (amber) — harmonic vs inharmonic, live.
export default function FmRatios() {
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
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);
        const lerp = (a, b, t) => a + (b - a) * t;
        const drawRR = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };
        const hexToRgb = (hex) => {
            const v = parseInt(hex.slice(1), 16);
            return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
        };
        const lerpColor = (c1, c2, t) => {
            const a = hexToRgb(c1), b = hexToRgb(c2);
            const r = Math.round(lerp(a[0], b[0], t));
            const g = Math.round(lerp(a[1], b[1], t));
            const bl = Math.round(lerp(a[2], b[2], t));
            return `rgb(${r}, ${g}, ${bl})`;
        };

        const INDIGO = '#1a1a6e';
        const AMBER = '#9B7530';

        const trackLeft = 90;
        const trackRight = W - 90;
        const trackW = trackRight - trackLeft;
        const ratioMin = 0.5;
        const ratioMax = 4;
        const ratioToX = (r) => trackLeft + ((r - ratioMin) / (ratioMax - ratioMin)) * trackW;

        const draw = () => {
            frameRef.current = (frameRef.current + 1) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            const titleP = progress(f, 0, 25);
            ctx.globalAlpha = titleP;
            ctx.fillStyle = INDIGO;
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Ratio Sets the Character', W / 2, 18);
            ctx.globalAlpha = 1;

            // Sweep ratio between 2.00 and 2.37 once the track is on screen (triangle wave)
            const trackP = progress(f, 40, 35);
            const sweepStart = 110;
            let ratio = 2.0;
            let closeness = 1; // 1 = exactly on a whole number, 0 = maximally off-grid
            if (f >= sweepStart) {
                const period = 220;
                const t = ((f - sweepStart) % period) / period;
                const tri = t < 0.5 ? t * 2 : 2 - t * 2; // 0→1→0
                ratio = lerp(2.0, 2.37, tri);
                const distFromInt = Math.abs(ratio - Math.round(ratio));
                closeness = clamp(1 - distFromInt / 0.37, 0, 1);
            }
            const isHarmonic = closeness > 0.9;

            if (trackP > 0) {
                ctx.globalAlpha = trackP;

                // Readout
                ctx.fillStyle = lerpColor(AMBER, INDIGO, closeness);
                ctx.font = 'bold 18px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`ratio ${ratio.toFixed(2)}`, W / 2, 42);
                ctx.font = '10px -apple-system, sans-serif';
                ctx.fillText(isHarmonic ? 'harmonic — musical' : 'inharmonic — bell-like, metallic', W / 2, 56);

                // Track
                const trackY = 74;
                ctx.strokeStyle = '#d1d5db';
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(trackLeft, trackY);
                ctx.lineTo(trackRight, trackY);
                ctx.stroke();
                ctx.lineCap = 'butt';

                // Tick marks at whole-number ratios
                [1, 2, 3, 4].forEach((n) => {
                    const tx = ratioToX(n);
                    ctx.strokeStyle = '#9ca3af';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(tx, trackY - 5);
                    ctx.lineTo(tx, trackY + 5);
                    ctx.stroke();
                    ctx.fillStyle = '#9ca3af';
                    ctx.font = '7px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${n}:1`, tx, trackY + 16);
                });

                // Marker
                const markerX = ratioToX(ratio);
                ctx.fillStyle = lerpColor(AMBER, INDIGO, closeness);
                ctx.beginPath();
                ctx.arc(markerX, trackY, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                ctx.globalAlpha = 1;
            }

            // --- Spectrum panel: sidebands at 1 ± n*ratio (carrier-frequency units) ---
            const specTop = 116;
            const specH = 108;
            const specLeft = 44;
            const specRight = W - 44;
            const specW = specRight - specLeft;
            const specBase = specTop + specH;
            const unitMin = 0, unitMax = 10;
            const unitToX = (u) => specLeft + ((u - unitMin) / (unitMax - unitMin)) * specW;

            const specPanelP = progress(f, 260, 35);
            if (specPanelP > 0) {
                ctx.globalAlpha = specPanelP;
                ctx.fillStyle = '#fff';
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 1;
                drawRR(specLeft - 10, specTop - 10, specW + 20, specH + 34, 6);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#6b7280';
                ctx.font = '8.5px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('Spectrum — sideband positions around the carrier', specLeft, specTop - 16);

                // Dashed harmonic grid — every whole-number position
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 1;
                ctx.setLineDash([2, 3]);
                for (let u = unitMin; u <= unitMax; u++) {
                    const gx = unitToX(u);
                    ctx.beginPath();
                    ctx.moveTo(gx, specTop);
                    ctx.lineTo(gx, specBase);
                    ctx.stroke();
                }
                ctx.setLineDash([]);

                const carrierUnit = 5;
                const barW = (specW / (unitMax - unitMin)) * 0.7;
                const barColor = lerpColor(AMBER, INDIGO, closeness);

                // Carrier bin
                const carrierH = specH * 0.7;
                const ccx = unitToX(carrierUnit);
                ctx.fillStyle = INDIGO;
                ctx.fillRect(ccx - barW / 2, specBase - carrierH, barW, carrierH);
                ctx.fillStyle = INDIGO;
                ctx.font = '7px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('carrier', ccx, specBase + 12);

                // Sidebands: n = 1, 2, 3
                [1, 2, 3].forEach((n) => {
                    const h = carrierH * (0.6 / n);
                    [-1, 1].forEach((sign) => {
                        const u = carrierUnit + sign * n * ratio;
                        if (u < unitMin - 0.3 || u > unitMax + 0.3) return;
                        const bx = unitToX(clamp(u, unitMin, unitMax));
                        ctx.fillStyle = barColor;
                        ctx.fillRect(bx - barW / 2, specBase - h, barW, h);
                    });
                });

                ctx.globalAlpha = 1;
            }

            // Phase indicator
            const phase = f < 110 ? 'Track' : f < 260 ? 'Sweeping' : isHarmonic ? 'Harmonic' : 'Inharmonic';
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
