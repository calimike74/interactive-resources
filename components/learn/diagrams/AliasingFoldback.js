'use client';

import { useEffect, useRef } from 'react';

// Frequency-axis diagram. RATE=40 kHz and SOURCE=30 kHz are the brief's own
// tractable illustrative values (not a real format — CD is 44.1 kHz — this is
// disclosed on-screen via the axis subtitle). NYQUIST and ALIAS are both
// COMPUTED from RATE/SOURCE, never hand-typed: NYQUIST=RATE/2=20, ALIAS=
// RATE-SOURCE=10. Because pxX() is a single linear map, equal frequency spans
// either side of Nyquist always earn equal pixel spans: pxX(SOURCE)-pxX(NYQUIST)
// = pxX(NYQUIST)-pxX(ALIAS) by construction (verified: 354-252 = 252-150 = 102px)
// — the mirror-image requirement holds algebraically, not by eye. The fold is
// drawn as a two-leg dashed "tent" from the source point up to the Nyquist
// line and down to the alias point.
//
// Label-clearance (checked against the tent's own leg equations): leg 1 runs
// (354,150)->(252,90); at y=110 it is at x=286. Leg 2 runs (252,90)->(150,150);
// at y=110 it is at x=218. The Source label ("Source — 30 kHz") is centred at
// x=354, y=110, width ~70px, spanning [319,389] — 286 sits 33px clear. The
// Alias label is centred at x=150, y=110, spanning [117,182] — 218 sits 36px
// clear. The Nyquist label sits at y=54, 36px above the tent's apex (y=90),
// so no leg reaches it. The axis-tick row (y=165) and the closing caption
// (y=225) both sit below the axis (y=150) and below every tent leg (max
// tent y=150), so neither can be crossed either.
export default function AliasingFoldback() {
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

        const RATE = 40; // kHz — illustrative grid, not a real sample rate
        const SOURCE = 30;
        const NYQUIST = RATE / 2; // 20
        const ALIAS = RATE - SOURCE; // 10, computed

        const axisX0 = 48;
        const axisX1 = 456;
        const axisW = axisX1 - axisX0;
        const axisY = 150;
        const pxX = (khz) => axisX0 + (khz / RATE) * axisW;

        const zoneTop = 70;
        const zoneBottom = 230;

        const PHASE_ZONES = 20;
        const PHASE_AXIS = 55;
        const PHASE_NYQUIST = 95;
        const PHASE_SOURCE = 145;
        const PHASE_ALIAS = 195;
        const PHASE_FOLD = 235;
        const PHASE_FORMULA = 285;
        const PHASE_CAPTION = 330;

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
            ctx.fillText('Aliasing: Folding Back Around Nyquist', W / 2, 16);
            ctx.font = 'italic 8px -apple-system, sans-serif';
            ctx.fillStyle = '#9ca3af';
            ctx.fillText('(illustrative 40 kHz grid — not a real recording format)', W / 2, 30);
            ctx.globalAlpha = 1;

            const zoneP = progress(f, PHASE_ZONES, 30);
            if (zoneP > 0) {
                ctx.globalAlpha = zoneP * 0.5;
                ctx.fillStyle = 'rgba(20, 184, 166, 0.12)';
                ctx.fillRect(pxX(0), zoneTop, pxX(NYQUIST) - pxX(0), zoneBottom - zoneTop);
                ctx.fillStyle = 'rgba(232, 93, 117, 0.12)';
                ctx.fillRect(pxX(NYQUIST), zoneTop, pxX(RATE) - pxX(NYQUIST), zoneBottom - zoneTop);
                ctx.globalAlpha = 1;
            }

            const axisP = progress(f, PHASE_AXIS, 30);
            if (axisP > 0) {
                ctx.globalAlpha = axisP;
                ctx.strokeStyle = '#d1d5db';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(axisX0, axisY);
                ctx.lineTo(axisX1, axisY);
                ctx.stroke();
                ctx.fillStyle = '#9ca3af';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                for (let khz = 0; khz <= RATE; khz += 10) {
                    ctx.beginPath();
                    ctx.moveTo(pxX(khz), axisY - 3);
                    ctx.lineTo(pxX(khz), axisY + 3);
                    ctx.stroke();
                    ctx.fillText(`${khz}`, pxX(khz), axisY + 16);
                }
                ctx.fillText('kHz', axisX1 + 10, axisY + 4);
                ctx.globalAlpha = 1;
            }

            const nyqP = progress(f, PHASE_NYQUIST, 30);
            if (nyqP > 0) {
                ctx.globalAlpha = nyqP;
                ctx.strokeStyle = '#374151';
                ctx.lineWidth = 1.3;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(pxX(NYQUIST), zoneTop - 10);
                ctx.lineTo(pxX(NYQUIST), zoneBottom);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`Nyquist — ${NYQUIST} kHz (rate ÷ 2)`, pxX(NYQUIST), 54);
                ctx.globalAlpha = 1;
            }

            const srcP = progress(f, PHASE_SOURCE, 30);
            if (srcP > 0) {
                ctx.globalAlpha = srcP;
                ctx.strokeStyle = '#e85d75';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(pxX(SOURCE), axisY);
                ctx.lineTo(pxX(SOURCE), 118);
                ctx.stroke();
                ctx.fillStyle = '#e85d75';
                ctx.beginPath();
                ctx.arc(pxX(SOURCE), axisY, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.font = 'bold 8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`Source — ${SOURCE} kHz`, pxX(SOURCE), 110);
                ctx.globalAlpha = 1;
            }

            const foldP = progress(f, PHASE_FOLD, 40);
            if (foldP > 0) {
                ctx.globalAlpha = foldP;
                ctx.strokeStyle = '#f97316';
                ctx.lineWidth = 1.3;
                ctx.setLineDash([2, 3]);
                const apexX = pxX(NYQUIST);
                const apexY = 90;
                const legLen = foldP <= 0.5 ? foldP * 2 : 1;
                const leg2Len = foldP > 0.5 ? (foldP - 0.5) * 2 : 0;
                ctx.beginPath();
                ctx.moveTo(pxX(SOURCE), axisY);
                ctx.lineTo(pxX(SOURCE) + (apexX - pxX(SOURCE)) * legLen, axisY + (apexY - axisY) * legLen);
                ctx.stroke();
                if (leg2Len > 0) {
                    ctx.beginPath();
                    ctx.moveTo(apexX, apexY);
                    ctx.lineTo(apexX + (pxX(ALIAS) - apexX) * leg2Len, apexY + (axisY - apexY) * leg2Len);
                    ctx.stroke();
                }
                ctx.setLineDash([]);
                ctx.globalAlpha = 1;
            }

            const aliasP = progress(f, PHASE_ALIAS, 30);
            if (aliasP > 0) {
                ctx.globalAlpha = aliasP;
                ctx.strokeStyle = '#14b8a6';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(pxX(ALIAS), axisY);
                ctx.lineTo(pxX(ALIAS), 118);
                ctx.stroke();
                ctx.fillStyle = '#14b8a6';
                ctx.beginPath();
                ctx.arc(pxX(ALIAS), axisY, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.font = 'bold 8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`Alias — ${ALIAS} kHz`, pxX(ALIAS), 110);
                ctx.globalAlpha = 1;
            }

            const formulaP = progress(f, PHASE_FORMULA, 25);
            if (formulaP > 0) {
                ctx.globalAlpha = formulaP;
                ctx.fillStyle = '#fff';
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(150, 178, 180, 20, 6);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = '#1a1a2e';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`alias = rate − source = ${RATE} − ${SOURCE} = ${ALIAS} kHz`, W / 2, 191);
                ctx.globalAlpha = 1;
            }

            const capP = progress(f, PHASE_CAPTION, 30);
            if (capP > 0) {
                ctx.globalAlpha = capP;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Content above Nyquist doesn’t vanish — it folds back in at a false, lower pitch', W / 2, 225);
                ctx.globalAlpha = 1;
            }

            const phase = f < PHASE_SOURCE ? 'Nyquist'
                : f < PHASE_FOLD ? 'Source'
                : f < PHASE_ALIAS + 30 ? 'Folding'
                : 'Alias';
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
