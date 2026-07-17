'use client';

import { useEffect, useRef } from 'react';

// Two stacked panels, same skeleton as ClippingShapes.js (title -> panel A ->
// panel B -> phase indicator): panel A shows hot and cold as sent down the
// cable, each carrying the SAME picked-up noise; panel B flips cold back and
// sums it with hot.
//
// SAME-FUNCTION LAW: signal(t) and noise(t) are the only two hand-defined
// waveform functions. Every other trace is derived from them by composition,
// and — critically — the panel-B "sum" trace is drawn by literally calling
// hot(t) + coldFlipped(t) at render time (see drawTrace(panelB, sumFn, ...)
// below, where sumFn = (t) => hot(t) + coldFlipped(t)), not by shortcutting
// to 2*signal(t) directly. Algebraically the two are identical —
//   hot(t)        = signal(t) + noise(t)
//   coldSent(t)   = -signal(t) + noise(t)   (cold carries an inverted copy)
//   coldFlipped(t)= -coldSent(t) = signal(t) - noise(t)   (receiver flips it back)
//   sum(t) = hot(t) + coldFlipped(t)
//          = [signal(t)+noise(t)] + [signal(t)-noise(t)]
//          = 2*signal(t)   <- noise term cancels, signal doubles
// — but the code path that draws the sum trace is the addition itself, so
// the on-screen cancellation is computed, never hand-placed.
//
// Invented illustrative values (disclosed in the w3-task-8 report):
// SIGNAL_CYCLES = 2, NOISE_FREQ_1 = 11, NOISE_FREQ_2 = 19 (chosen purely so
// noise reads visually as faster jitter riding on a slower wanted signal,
// the same "noise is higher-frequency than the signal" convention
// AudioLeadsFlashcards.jsx's own balanced-signal illustration uses).
// SIGNAL_AMP = 0.5, NOISE_AMP_1 = 0.28, NOISE_AMP_2 = 0.12 — chosen so
// |hot|/|coldSent| stay under 0.9 and |sum| stays at exactly 1.0, comfortably
// inside AMP_RANGE = 1.3's headroom.
//
// Label-clearance proof (geometry is static across every frame — only reveal
// alpha and per-trace reveal fraction animate): panel A occupies y=[55,140];
// its label sits at y=44 (11px clear above) and its caption at y=152 (12px
// clear below). Panel B occupies y=[175,250]; its label sits at y=167 (8px
// clear above) and its caption at y=262 (12px clear below, 10px clear of the
// phase indicator at y=272) — identical margins to ClippingShapes.js's own
// proven-clear two-panel layout, which this diagram's geometry copies
// exactly. No trace is ever drawn outside its own panel's y-band (ampToY()
// is scoped per panel), so no panel's traces can cross the other panel's
// text, and neither panel draws any line at y=16 (title), y=44/167 (labels)
// or y=152/262 (captions) — those bands carry text only.
export default function BalancedNoiseRejection() {
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

        const X0 = 60;
        const X1 = 440;
        const SIGNAL_CYCLES = 2; // illustrative — legible number of cycles across the panel width
        const NOISE_FREQ_1 = 11; // illustrative — visually "faster than the signal"
        const NOISE_FREQ_2 = 19;
        const SIGNAL_AMP = 0.5; // illustrative
        const NOISE_AMP_1 = 0.28; // illustrative
        const NOISE_AMP_2 = 0.12; // illustrative

        const signal = (t) => SIGNAL_AMP * Math.sin(t * 2 * Math.PI * SIGNAL_CYCLES);
        const noise = (t) =>
            NOISE_AMP_1 * Math.sin(t * 2 * Math.PI * NOISE_FREQ_1) +
            NOISE_AMP_2 * Math.sin(t * 2 * Math.PI * NOISE_FREQ_2 + 1.3);

        const hot = (t) => signal(t) + noise(t);
        const coldSent = (t) => -signal(t) + noise(t);
        const coldFlipped = (t) => -coldSent(t);
        const sum = (t) => hot(t) + coldFlipped(t); // literal sum — see SAME-FUNCTION LAW note above

        const pxX = (t) => X0 + t * (X1 - X0);
        const AMP_RANGE = 1.3; // headroom over the 1.0-peak sum trace and the 0.9-peak hot/cold traces

        const ampToY = (panel, amp) => {
            const mid = (panel.top + panel.bottom) / 2;
            const halfH = (panel.bottom - panel.top) / 2;
            return mid - (amp / AMP_RANGE) * halfH;
        };

        const PANEL_A = { top: 55, bottom: 140, labelY: 44, capY: 152 };
        const PANEL_B = { top: 175, bottom: 250, labelY: 167, capY: 262 };

        const drawTrace = (panel, fn, alpha, revealFrac, color, lineWidth, dashed) => {
            if (alpha <= 0) return;
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            if (dashed) ctx.setLineDash([3, 2]);
            ctx.beginPath();
            const points = Math.max(1, Math.floor(200 * revealFrac));
            for (let i = 0; i <= points; i++) {
                const t = i / 200;
                const x = pxX(t);
                const y = ampToY(panel, fn(t));
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalAlpha = 1;
        };

        const drawZero = (panel, alpha) => {
            if (alpha <= 0) return;
            ctx.globalAlpha = alpha * 0.6;
            ctx.strokeStyle = '#d1d5db';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(X0, ampToY(panel, 0));
            ctx.lineTo(X1, ampToY(panel, 0));
            ctx.stroke();
            ctx.globalAlpha = 1;
        };

        const PHASE = {
            labelA: 20, zeroA: 30, noiseRef: 55, hotA: 85, coldA: 140, capA: 200,
            labelB: 260, flipB: 290, sumB: 350, capB: 420,
        };

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
            ctx.fillText('Balanced: Flip and Sum Cancels the Noise', W / 2, 16);
            ctx.globalAlpha = 1;

            // Panel A — hot and cold as sent, same noise on both
            const labelAP = progress(f, PHASE.labelA, 18);
            if (labelAP > 0) {
                ctx.globalAlpha = labelAP;
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('On the cable — hot and cold both pick up the same noise', W / 2, PANEL_A.labelY);
                ctx.globalAlpha = 1;
            }
            drawZero(PANEL_A, progress(f, PHASE.zeroA, 15));

            const noiseRefP = progress(f, PHASE.noiseRef, 40);
            drawTrace(PANEL_A, noise, noiseRefP * 0.7, noiseRefP, '#9ca3af', 1, true);

            const hotAP = progress(f, PHASE.hotA, 50);
            drawTrace(PANEL_A, hot, hotAP, hotAP, '#e85d75', 1.8, false);

            const coldAP = progress(f, PHASE.coldA, 50);
            drawTrace(PANEL_A, coldSent, coldAP, coldAP, '#2563EB', 1.8, false);

            const capAP = progress(f, PHASE.capA, 25);
            if (capAP > 0) {
                ctx.globalAlpha = capAP;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 8.5px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Red = hot (signal + noise)   Blue = cold (inverted signal + same noise)', W / 2, PANEL_A.capY);
                ctx.globalAlpha = 1;
            }

            // Panel B — flip cold, then sum with hot
            const labelBP = progress(f, PHASE.labelB, 18);
            if (labelBP > 0) {
                ctx.globalAlpha = labelBP;
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('At the receiver — flip cold back, then add it to hot', W / 2, PANEL_B.labelY);
                ctx.globalAlpha = 1;
            }
            drawZero(PANEL_B, labelBP);

            const flipBP = progress(f, PHASE.flipB, 45);
            drawTrace(PANEL_B, hot, flipBP * 0.4, flipBP, '#e85d75', 1.2, true);
            drawTrace(PANEL_B, coldFlipped, flipBP * 0.4, flipBP, '#2563EB', 1.2, true);

            const sumBP = progress(f, PHASE.sumB, 55);
            drawTrace(PANEL_B, sum, sumBP, sumBP, '#16a34a', 2.2, false);

            const capBP = progress(f, PHASE.capB, 25);
            if (capBP > 0) {
                ctx.globalAlpha = capBP;
                ctx.fillStyle = '#16a34a';
                ctx.font = 'italic bold 8.5px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Noise cancels, signal doubles — the green trace is hot + flipped cold', W / 2, PANEL_B.capY);
                ctx.globalAlpha = 1;
            }

            const phase = f < PHASE.labelB ? 'Hot & Cold' : 'Flip & Sum';
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
