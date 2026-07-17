'use client';

import { useEffect, useRef } from 'react';

// One recording, two-stage edit. soundWave(x) = exp(-1.2x)*sin(2π*3.35x) over the local
// span of the "sound" region only (x=local fraction 0-1 across T1..T2) — decay envelope ×
// oscillation, a struck-and-decaying hit. Dead air on either side (t<T1, t>T2) is drawn
// flat at zero. T1=0.20, T2=0.72, the 1.2 decay rate and 3.35 cycle count are illustrative
// (chosen so the sound's own tail is still audibly non-zero at T2 — verified: g(1)=0.244,
// about a quarter of full amplitude — which is exactly why truncating alone still clicks).
//
// Stage 1 (truncate): bracket markers slide in from the recording's own edges to T1/T2,
// discarding dead air. Stage 2 (fade): FADE_START=0.92 (local fraction, illustrative)
// marks where a short linear ramp is applied — fadedG(x) = g(x) × fadeMul(x) — continuous
// with the unfaded curve at its own start (verified: g(0.92)=fadedG(0.92)=0.1634) and
// exactly zero at T2 (fadedG(1)=0), so the taper introduces no new discontinuity of its
// own while removing the one truncation left behind.
//
// Label-clearance (recomputed from the actual draw calls): the curve itself is confined
// to y=[95,185] (midY=140, amp=45), but the truncate brackets are drawn taller, y=[90,190],
// and the small fade-window bracket reaches up to y=[78,84] — so the true combined band
// covering every line in this diagram is y=[78,190], not just the curve's own range. The
// fade/click label (y=64) sits 14px clear above that band's top (78); the dead-air/
// truncate labels (y=205) sit 15px clear below its bottom (190); the closing caption
// (y=228) sits 38px clear below it, and the phase indicator (H-8=272) 44px below that.
export default function TruncateAndFade() {
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

        const CYCLE = 520;
        let animId;

        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);

        const X0 = 60;
        const X1 = 440;
        const midY = 140;
        const amp = 45;

        const T1 = 0.20;
        const T2 = 0.72;
        const DECAY_RATE = 1.2; // illustrative percussive decay — not a real time constant
        const OSC_CYCLES = 3.35; // non-integer on purpose so T2 lands off a zero crossing
        const FADE_START = 0.92; // local fraction of the sound span where the ramp begins

        const pxX = (t) => X0 + t * (X1 - X0);
        const soundWave = (x) => Math.exp(-DECAY_RATE * x) * Math.sin(2 * Math.PI * OSC_CYCLES * x); // x local 0-1 over [T1,T2]
        const fadeMul = (x) => (x <= FADE_START ? 1 : Math.max(0, (1 - x) / (1 - FADE_START)));
        const fullWave = (t) => {
            if (t < T1 || t > T2) return 0;
            return soundWave((t - T1) / (T2 - T1));
        };
        const plotY = (v) => midY - amp * v;

        const x1 = pxX(T1);
        const x2 = pxX(T2);
        const fadeT0 = T1 + FADE_START * (T2 - T1);
        const fadeX0 = pxX(fadeT0);

        const PHASE = {
            title: 0,
            subtitle: 15,
            curve: 30,
            brackets: 100,
            deadAirGrey: 150,
            truncLabel: 165,
            clickMarker: 210,
            clickLabel: 235,
            fadeBracket: 285,
            fadeLabel: 310,
            caption: 350,
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
            ctx.fillText('Truncate, Then Fade', W / 2, 16);
            ctx.globalAlpha = 1;

            const subP = progress(f, PHASE.subtitle, 20);
            if (subP > 0) {
                ctx.globalAlpha = subP;
                ctx.fillStyle = '#6b7280';
                ctx.font = 'italic 8.5px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Two different jobs on the same edit point', W / 2, 32);
                ctx.globalAlpha = 1;
            }

            const curveP = progress(f, PHASE.curve, 40);
            const bracketP = progress(f, PHASE.brackets, 40);
            const deadAirP = progress(f, PHASE.deadAirGrey, 25);
            const clickMarkerP = progress(f, PHASE.clickMarker, 25);
            const fadeBracketP = progress(f, PHASE.fadeBracket, 25);
            const fadeCurveP = progress(f, PHASE.fadeBracket, 30);

            if (curveP > 0) {
                ctx.globalAlpha = curveP * 0.5;
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 1;
                ctx.setLineDash([2, 3]);
                ctx.beginPath();
                ctx.moveTo(X0, midY);
                ctx.lineTo(X1, midY);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.globalAlpha = 1;

                // Dead air (front + back) — greys out once truncate brackets have landed
                const deadAlpha = curveP * (1 - deadAirP * 0.75);
                ctx.globalAlpha = deadAlpha;
                ctx.strokeStyle = '#9ca3af';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(X0, midY);
                ctx.lineTo(x1, midY);
                ctx.moveTo(x2, midY);
                ctx.lineTo(X1, midY);
                ctx.stroke();
                ctx.globalAlpha = 1;

                // Sound region — hard-edge version (drawn every frame as the base curve)
                ctx.globalAlpha = curveP;
                ctx.strokeStyle = '#374151';
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                for (let i = 0; i <= 200; i++) {
                    const localX = i / 200;
                    const t = T1 + localX * (T2 - T1);
                    const x = pxX(t);
                    const y = plotY(soundWave(localX));
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            // Truncate brackets — slide from the recording's own edges to T1/T2
            if (bracketP > 0) {
                const bx1 = X0 + (x1 - X0) * bracketP;
                const bx2 = X1 - (X1 - x2) * bracketP;
                ctx.globalAlpha = bracketP;
                ctx.strokeStyle = '#f97316';
                ctx.lineWidth = 1.5;
                [bx1, bx2].forEach((bx) => {
                    ctx.beginPath();
                    ctx.moveTo(bx, 90);
                    ctx.lineTo(bx, 190);
                    ctx.stroke();
                });
                ctx.globalAlpha = 1;

                const labelP = progress(f, PHASE.truncLabel, 20);
                if (labelP > 0) {
                    ctx.globalAlpha = labelP;
                    ctx.fillStyle = '#f97316';
                    ctx.font = 'bold 8.5px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('dead air trimmed', X0 + (x1 - X0) / 2, 205);
                    ctx.fillText('dead air trimmed', x2 + (X1 - x2) / 2, 205);
                    ctx.globalAlpha = 1;
                }
            }

            // Hard-cut click marker at T2 — the residual jump truncation alone leaves
            const edgeV = soundWave(1);
            const edgeY = plotY(edgeV);
            let markerAlpha = 1;
            if (clickMarkerP > 0) {
                markerAlpha = clickMarkerP * (1 - fadeCurveP);
                if (markerAlpha > 0.01) {
                    const curEndY = edgeY + (midY - edgeY) * clickMarkerP;
                    ctx.globalAlpha = markerAlpha;
                    ctx.strokeStyle = '#e85d75';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(x2, edgeY);
                    ctx.lineTo(x2, curEndY);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
            }
            const clickLabelP = progress(f, PHASE.clickLabel, 20) * (1 - fadeBracketP);
            if (clickLabelP > 0.01) {
                ctx.globalAlpha = clickLabelP;
                ctx.fillStyle = '#e85d75';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('still non-zero → click', x2, 64);
                ctx.globalAlpha = 1;
            }

            // Fade ramp — replaces the hard edge with a smooth taper to zero
            if (fadeBracketP > 0) {
                ctx.globalAlpha = fadeBracketP;
                ctx.strokeStyle = '#14b8a6';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(fadeX0, 84);
                ctx.lineTo(fadeX0, 78);
                ctx.lineTo(x2, 78);
                ctx.lineTo(x2, 84);
                ctx.stroke();
                ctx.globalAlpha = 1;

                const fadeLabelP = progress(f, PHASE.fadeLabel, 20);
                if (fadeLabelP > 0) {
                    ctx.globalAlpha = fadeLabelP;
                    ctx.fillStyle = '#14b8a6';
                    ctx.font = 'bold 9px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('short fade → smooth to silence', (fadeX0 + x2) / 2, 64);
                    ctx.globalAlpha = 1;
                }
            }
            if (fadeCurveP > 0) {
                ctx.globalAlpha = fadeCurveP;
                ctx.strokeStyle = '#14b8a6';
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let i = 0; i <= 40; i++) {
                    const localX = FADE_START + (i / 40) * (1 - FADE_START);
                    const t = T1 + localX * (T2 - T1);
                    const x = pxX(t);
                    const y = plotY(soundWave(localX) * fadeMul(localX));
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            const capP = progress(f, PHASE.caption, 25);
            if (capP > 0) {
                ctx.globalAlpha = capP;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Truncate removes the silence; fade removes the click truncation alone can’t', W / 2, 228);
                ctx.globalAlpha = 1;
            }

            const phase = f < PHASE.brackets ? 'Recording'
                : f < PHASE.clickMarker ? 'Truncate'
                : f < PHASE.fadeBracket ? 'Still clicks'
                : 'Fade';
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
