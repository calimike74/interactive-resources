'use client';

import { useEffect, useRef } from 'react';
import { borderRadius } from '@/lib/theme';
import { HARM_STAGE, HARMONIC_COUNT, chainScaleDivisor, idealHarmonics } from '@/lib/additive-recipes';

/**
 * The waveform, drawn as a chain of spinning circles — one per harmonic.
 *
 * Mike's ask, 2026-07-30, pointing at the additive explorer's stage: "it might be
 * cool just to have the student visualise how a circle can form a sine wave, or,
 * if they push on a square, how the circles can form this."
 *
 * WHY IT BELONGS ON A SUBTRACTIVE TOOL. The Oscillators section says a square has
 * more harmonics than a sine and shows the bars to prove it. What it never says is
 * where those harmonics come from. This is that missing step, and it is the same
 * picture as the additive explorer's stage in the same eight colours, so the two
 * tools teach one idea rather than two.
 *
 * WHAT IT DOES THAT THE LAB VERSION CANNOT. The circles here are sized by the
 * REAL filter. Each harmonic's radius is its ideal strength multiplied by the
 * actual magnitude response of the same BiquadFilterNode the student is hearing,
 * at that harmonic's own frequency. Close the cutoff and the outer circles shrink
 * and drop away, and the wave the pen draws rounds off towards a sine. That is
 * subtractive synthesis in one image, and the lab tool could not show it because
 * its filter stage was removed in July.
 *
 * The first version of this said all that and then quietly undid it, by scaling
 * the drawing to whatever was left after filtering — see chainScaleDivisor. The
 * lesson is worth keeping: a display that fits itself to its own data cannot
 * show data getting smaller.
 *
 * PHASE IS NOT OPTIONAL. A low-pass does not only make a harmonic quieter, it
 * delays it, and a harmonic that arrives late changes the SHAPE of the sum. If
 * this drew magnitude only, the curve here would disagree with the oscilloscope
 * measuring the same sound two panes away — the page would be arguing with
 * itself. So each harmonic carries the filter's phase response as well, and
 * tests plus a pixel-level check against the live scope keep it honest.
 *
 * The response comes from a scratch BiquadFilterNode on an OfflineAudioContext
 * rather than from the live filterRef, for two reasons: the live node does not
 * exist until the first user gesture (a ref captured at mount would be null and
 * never re-read — the fault the oscilloscope on this page shipped with), and an
 * offline context needs no gesture, so the drawing is correct before a note has
 * been played.
 */

const STAGE = '#211C15';
const STAGE_LINE = 'rgba(250,242,228,0.10)';
const WAVE = '#F3E6C7';
const BASE_LINE = 'rgba(246,236,216,0.16)';

const BASE_OMEGA = 2 * Math.PI * 0.4;
const PERIODS = 2;                        // fewer than the additive tool's 4: this
const SPAN = PERIODS * 2 * Math.PI;       // pane is roughly half the width
const FULL_T = SPAN / BASE_OMEGA;

function waveVal(amp, phase, t) {
    let v = 0;
    for (let i = 0; i < HARMONIC_COUNT; i++) {
        if (!amp[i]) continue;
        v += amp[i] * Math.sin((i + 1) * t + phase[i]);
    }
    return v;
}


export default function EpicycleWave({
    waveform = 'sawtooth',
    filterType = 'lowpass',
    cutoff = 2000,
    resonance = 1,
    freqRef,
    width = 500,
    height = 160,
}) {
    const canvasRef = useRef(null);
    const rafRef = useRef(null);

    // Latest props, read inside the animation loop. The loop is started once; a
    // dependency array that included cutoff would restart the pen sweep on every
    // pixel of slider travel.
    const propsRef = useRef({ waveform, filterType, cutoff, resonance });
    propsRef.current = { waveform, filterType, cutoff, resonance };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return undefined;
        const ctx = canvas.getContext('2d');
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // The backing store MUST match the rendered size, or the browser scales
        // the drawing by a different factor on each axis and every circle comes
        // out an ellipse. The sibling displays get away with a fixed 500-wide
        // buffer because bars and traces survive being squashed; a shape whose
        // whole claim is "this is a circle" does not.
        let W = width;
        let H = height;
        const fit = () => {
            const dpr = window.devicePixelRatio || 1;
            const box = canvas.parentElement;
            W = box ? box.clientWidth : width;
            H = height;
            canvas.width = Math.max(1, Math.round(W * dpr));
            canvas.height = Math.max(1, Math.round(H * dpr));
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        fit();

        // A scratch filter, purely to ask what the real one does. Offline, so it
        // needs no user gesture and exists from the first paint.
        const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
        const probeCtx = OfflineCtx ? new OfflineCtx(1, 128, 44100) : null;
        const probe = probeCtx ? probeCtx.createBiquadFilter() : null;

        const freqs = new Float32Array(HARMONIC_COUNT);
        const mags = new Float32Array(HARMONIC_COUNT);
        const phases = new Float32Array(HARMONIC_COUNT);
        const amp = new Array(HARMONIC_COUNT).fill(0);
        const phase = new Array(HARMONIC_COUNT).fill(0);
        // Kept alongside the filtered amplitudes so the drawing can be scaled
        // against the waveform BEFORE the filter touched it — see
        // chainScaleDivisor for why that is the difference between showing the
        // filter's work and hiding it.
        let idealAmp = new Array(HARMONIC_COUNT).fill(0);

        const recompute = () => {
            const p = propsRef.current;
            const ideal = idealHarmonics(p.waveform);
            idealAmp = ideal.amp;
            const f0 = (freqRef?.current) || 220;

            if (probe) {
                probe.type = p.filterType;
                probe.frequency.value = Math.max(10, p.cutoff);
                probe.Q.value = Math.max(0.0001, p.resonance);
                for (let i = 0; i < HARMONIC_COUNT; i++) freqs[i] = f0 * (i + 1);
                probe.getFrequencyResponse(freqs, mags, phases);
            }

            for (let i = 0; i < HARMONIC_COUNT; i++) {
                const m = probe ? mags[i] : 1;
                amp[i] = ideal.amp[i] * (Number.isFinite(m) ? m : 1);
                const ph = probe ? phases[i] : 0;
                phase[i] = ideal.phase[i] + (Number.isFinite(ph) ? ph : 0);
            }
        };

        const drawFrame = (t) => {
            recompute();

            ctx.fillStyle = STAGE;
            ctx.fillRect(0, 0, W, H);

            // Where the chain of circles gets to live. The old rule capped this at
            // a flat 66px, which was right when the pane was 260px wide and wrong
            // the moment the two-column rework made it 500-plus: the circles kept
            // their tiny corner while the wave stretched across everything, and
            // the part of the picture the section is ABOUT read as a footnote.
            //
            // Now it takes whichever is smaller — a fifth of the width, or just
            // enough for a chain as tall as the pane allows. On a wide pane the
            // height binds and the circles fill their half properly; on a narrow
            // one the width binds, exactly as before, so nothing gets squeezed.
            const halfH = H * 0.42;
            const originX = Math.min(W * 0.22, halfH + 12);
            const originY = H / 2;
            const s = chainScaleDivisor(idealAmp, amp);
            const scale = Math.min(originX - 10, halfH) / s;
            const waveX0 = originX + s * scale + 14;
            const waveW = Math.max(40, W - waveX0 - 6);

            const headPhase = BASE_OMEGA * t;
            const penPhase = headPhase % SPAN;
            const firstSweep = headPhase < SPAN;
            const steps = Math.max(120, Math.floor(waveW));

            ctx.strokeStyle = BASE_LINE;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(waveX0, originY);
            ctx.lineTo(W - 4, originY);
            ctx.stroke();

            const wavePath = (from, to) => {
                ctx.beginPath();
                for (let st = from; st <= to; st++) {
                    const ph = (st / steps) * SPAN;
                    const px = waveX0 + (ph / SPAN) * waveW;
                    const py = originY - waveVal(amp, phase, ph) * scale;
                    if (st === from) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                }
                ctx.stroke();
            };

            if (!firstSweep) {
                ctx.save();
                ctx.globalAlpha = 0.26;
                ctx.strokeStyle = WAVE;
                ctx.lineWidth = 1.6;
                ctx.lineJoin = 'round';
                wavePath(0, steps);
                ctx.restore();
            }

            ctx.save();
            ctx.strokeStyle = WAVE;
            ctx.lineWidth = 2;
            ctx.lineJoin = 'round';
            wavePath(0, Math.max(1, Math.round(steps * (penPhase / SPAN))));
            ctx.restore();

            let x = originX;
            let y = originY;
            for (let i = 0; i < HARMONIC_COUNT; i++) {
                if (amp[i] <= 0.0008) continue;
                const r = amp[i] * scale;
                const angle = (i + 1) * headPhase + phase[i];
                const nx = x + r * Math.cos(angle);
                const ny = y - r * Math.sin(angle);

                ctx.globalAlpha = 0.5;
                ctx.strokeStyle = HARM_STAGE[i];
                ctx.lineWidth = 1.1;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = 1;

                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(nx, ny);
                ctx.lineWidth = 1.6;
                ctx.stroke();

                x = nx;
                y = ny;
            }

            const penX = waveX0 + (penPhase / SPAN) * waveW;
            const penY = originY - waveVal(amp, phase, penPhase) * scale;

            ctx.strokeStyle = 'rgba(243,230,199,.40)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 4]);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(penX, penY);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = WAVE;
            ctx.beginPath();
            ctx.arc(penX, penY, 2.8, 0, Math.PI * 2);
            ctx.fill();
        };

        if (reduceMotion) {
            drawFrame(FULL_T);
            const roStill = new ResizeObserver(() => { fit(); drawFrame(FULL_T); });
            if (canvas.parentElement) roStill.observe(canvas.parentElement);
            return () => roStill.disconnect();
        }

        let t0 = null;
        const loop = (ts) => {
            rafRef.current = requestAnimationFrame(loop);
            if (t0 === null) t0 = ts;
            drawFrame((ts - t0) / 1000);
        };
        rafRef.current = requestAnimationFrame(loop);

        const ro = new ResizeObserver(fit);
        if (canvas.parentElement) ro.observe(canvas.parentElement);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            ro.disconnect();
        };
    }, [freqRef, width, height]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            style={{
                width: '100%',
                height: `${height}px`,
                borderRadius: borderRadius.md,
                display: 'block',
                background: STAGE,
            }}
            role="img"
            aria-label="One spinning circle for each harmonic in the current waveform, joined end to end. The chain's tip traces out the wave. Closing the filter shrinks the outer circles and the wave becomes smoother."
        />
    );
}
