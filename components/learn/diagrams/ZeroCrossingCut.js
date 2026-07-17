'use client';

import { useEffect, useRef } from 'react';

// One drawn waveform, one function, two cut points on it. BAD_T=0.1 is an arbitrary
// non-crossing sample (illustrative — disclosed here, not a real ms value). GOOD_T is
// never hardcoded: findZeroCrossingAfter() walks forward from SEARCH_START in small
// steps until wave() changes sign, then linearly interpolates the crossing — a genuine
// step-search/solve, not a typed-in constant. SEARCH_START=0.6 (half the domain away
// from BAD_T) keeps the two callouts from crowding each other, not a nearest-neighbour
// requirement. CYCLES=2 is an illustrative "gentle wobble" shape, not a real frequency.
//
// The "click" itself is drawn, not just claimed: the bad-cut marker is a real vertical
// segment from the curve's own value at BAD_T down to the zero (silence) line, followed
// by a flat dashed "then: nothing" tail — the actual jump a truncation there would leave
// behind. The good-cut marker sits where the curve already is zero, so cutting there
// draws no segment at all.
//
// Label-clearance: the curve, baseline and both markers are confined to the band
// y=[75,165] (midY=120, amp=45, so no curve value can exceed that band). Both callout
// labels sit at y=185 (20px clear of the band's bottom edge) and the closing caption at
// y=210. No line in this diagram is ever drawn below y=165, so none can reach a label.
export default function ZeroCrossingCut() {
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

        const CYCLE = 460;
        let animId;

        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);

        const X0 = 60;
        const X1 = 440;
        const midY = 120;
        const amp = 45;
        const CYCLES = 2; // illustrative "gentle wobble" — not a real frequency

        const wave = (t) => Math.sin(t * 2 * Math.PI * CYCLES);
        const pxX = (t) => X0 + t * (X1 - X0);
        const plotY = (t) => midY - amp * wave(t);

        // Genuine step-search + linear-interpolation solve — never a hardcoded x.
        const findZeroCrossingAfter = (startT, fn, step = 0.002, maxSteps = 500) => {
            let t0 = startT;
            let v0 = fn(t0);
            for (let i = 1; i <= maxSteps; i++) {
                const t1 = startT + i * step;
                const v1 = fn(t1);
                if (v0 !== 0 && Math.sign(v1) !== Math.sign(v0)) {
                    return t0 + (0 - v0) * (t1 - t0) / (v1 - v0);
                }
                t0 = t1;
                v0 = v1;
            }
            return startT;
        };

        const BAD_T = 0.1; // arbitrary non-crossing sample — illustrative click point
        const SEARCH_START = 0.6; // kept well clear of BAD_T so the two callouts don't crowd
        const GOOD_T = findZeroCrossingAfter(SEARCH_START, wave); // solves to 0.75

        const xBad = pxX(BAD_T);
        const xGood = pxX(GOOD_T);
        const yBad = plotY(BAD_T);
        const yGood = plotY(GOOD_T);
        const zeroY = midY;

        const PHASE = {
            title: 0,
            subtitle: 15,
            curve: 30,
            badMarker: 100,
            badTail: 125,
            badLabel: 145,
            goodMarker: 190,
            goodLabel: 215,
            caption: 250,
        };

        const draw = () => {
            frameRef.current = (frameRef.current + 0.6) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            const titleP = progress(f, PHASE.title, 20);
            ctx.globalAlpha = titleP;
            ctx.fillStyle = '#1a1a2e';
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Cutting On Zero: Where Clicks Live', W / 2, 16);
            ctx.globalAlpha = 1;

            const subP = progress(f, PHASE.subtitle, 20);
            if (subP > 0) {
                ctx.globalAlpha = subP;
                ctx.fillStyle = '#6b7280';
                ctx.font = 'italic 8.5px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Same waveform, two cut points', W / 2, 32);
                ctx.globalAlpha = 1;
            }

            const curveP = progress(f, PHASE.curve, 40);
            if (curveP > 0) {
                // Baseline / zero (silence) line
                ctx.globalAlpha = curveP * 0.5;
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 1;
                ctx.setLineDash([2, 3]);
                ctx.beginPath();
                ctx.moveTo(X0, zeroY);
                ctx.lineTo(X1, zeroY);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.globalAlpha = 1;

                ctx.globalAlpha = curveP;
                ctx.strokeStyle = '#374151';
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                for (let i = 0; i <= 300; i++) {
                    const t = i / 300;
                    const x = pxX(t);
                    const y = plotY(t);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            const badP = progress(f, PHASE.badMarker, 25);
            if (badP > 0) {
                const curEndY = yBad + (zeroY - yBad) * badP;
                ctx.globalAlpha = badP;
                ctx.strokeStyle = '#e85d75';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(xBad, yBad);
                ctx.lineTo(xBad, curEndY);
                ctx.stroke();
                ctx.fillStyle = '#e85d75';
                ctx.beginPath();
                ctx.arc(xBad, yBad, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }

            const tailP = progress(f, PHASE.badTail, 20);
            if (tailP > 0) {
                ctx.globalAlpha = tailP;
                ctx.strokeStyle = '#e85d75';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(xBad, zeroY);
                ctx.lineTo(xBad + 20 * tailP, zeroY);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.globalAlpha = 1;
            }

            const badLabelP = progress(f, PHASE.badLabel, 20);
            if (badLabelP > 0) {
                ctx.globalAlpha = badLabelP;
                ctx.fillStyle = '#e85d75';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Bad cut — jump to silence', xBad, 185);
                ctx.globalAlpha = 1;
            }

            const goodP = progress(f, PHASE.goodMarker, 20);
            if (goodP > 0) {
                ctx.globalAlpha = goodP;
                ctx.strokeStyle = '#14b8a6';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(xGood, yGood, 4 * goodP, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fillStyle = '#14b8a6';
                ctx.beginPath();
                ctx.arc(xGood, yGood, 2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }

            const goodLabelP = progress(f, PHASE.goodLabel, 20);
            if (goodLabelP > 0) {
                ctx.globalAlpha = goodLabelP;
                ctx.fillStyle = '#14b8a6';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Good cut — no jump', xGood, 185);
                ctx.globalAlpha = 1;
            }

            const capP = progress(f, PHASE.caption, 25);
            if (capP > 0) {
                ctx.globalAlpha = capP;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('The click IS the jump — cut off zero and you hear it every time', W / 2, 210);
                ctx.globalAlpha = 1;
            }

            const phase = f < PHASE.badMarker ? 'Waveform'
                : f < PHASE.goodMarker ? 'Bad cut'
                : 'Good cut';
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
