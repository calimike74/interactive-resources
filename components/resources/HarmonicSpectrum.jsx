'use client';

import { useEffect, useRef } from 'react';
import { borderRadius } from '@/lib/theme';

/**
 * The spectrum, drawn as harmonics rather than as bins.
 *
 * Mike's ask, 2026-07-30: "on this subtractive synth explorer you have sine,
 * triangle, square, etc., wouldn't it be a good idea to put the FFT here so that
 * students can see the rendering of these waveforms?"
 *
 * WHY THIS IS NOT A NORMAL FFT DISPLAY. A stock analyser draws 1024 bins across
 * 0–22kHz, which for a 220Hz note is a spike in the leftmost 5% and a lot of
 * empty grey. Nothing is legible and nothing is learnable. What the exam
 * actually asks a student to know is the RULE — a sine is the fundamental alone,
 * a square has the odd harmonics, a sawtooth has all of them, and a low-pass
 * filter takes the top ones away. So the axis here runs 0 to 9×f0, and the eight
 * harmonics get eight fixed positions and eight fixed colours. H3 is the same
 * green whichever note you play, so "square keeps H1, H3, H5, H7" is something
 * you can see rather than something you are told.
 *
 * The faint curve behind the bars is the real continuous spectrum over the same
 * range. It earns its place on this tool specifically: subtractive synthesis IS
 * the filter slope, and the slope is a shape the bars alone cannot show.
 *
 * The analyser it reads sits AFTER the filter in the existing audio graph
 * (osc → filter → envGain → masterGain → analyser → destination), so the bars
 * fall as the cutoff comes down without any rewiring. That was luck, not design,
 * and it is worth knowing before anyone moves the analyser.
 *
 * Palette and the warm-dark stage are carried over verbatim from the approved
 * FFT lab (Overnight-Runs/2026-07-22/FFT-Waveform-Explorer.html), so the two
 * tools teach with the same colours — H1 is the same orange in both.
 */

// Verbatim from the lab's HARM_STAGE — the brighter set, for the dark stage.
const HARMONIC_COLOURS = [
    '#F08A57', '#F4A83E', '#EACB4F', '#A9CE5E',
    '#48CDB6', '#5FAAF0', '#9E90F2', '#E585C4',
];

const STAGE = '#211C15';
const STAGE_INK = '#F3E9D8';
const STAGE_MUTED = '#C6B9A2';
const STAGE_LINE = 'rgba(250,242,228,0.10)';

const HARMONIC_COUNT = 8;

// The analyser reports dB. Silence sits at the floor; a healthy harmonic is
// around -20. Mapping -88..-12 rather than the full -100..0 keeps the bars off
// both the floor and the ceiling, so a change in the cutoff is visible as a
// change in height instead of everything pinning.
const DB_FLOOR = -88;
const DB_CEIL = -12;

function dbToUnit(db) {
    if (!Number.isFinite(db)) return 0;
    return Math.max(0, Math.min(1, (db - DB_FLOOR) / (DB_CEIL - DB_FLOOR)));
}

export default function HarmonicSpectrum({
    analyserRef,
    freqRef,
    width = 500,
    height = 160,
    label = true,
}) {
    const canvasRef = useRef(null);
    const rafRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Drawn even with no analyser and no sound: an empty stage with eight
        // dim labelled slots reads as "nothing is playing yet", where a blank
        // rectangle reads as broken.
        const drawFrame = (levels, curve) => {
            ctx.fillStyle = STAGE;
            ctx.fillRect(0, 0, width, height);

            const baseline = height - 22;
            const usable = baseline - 12;
            const gap = width * 0.026;
            const barW = (width - gap * (HARMONIC_COUNT + 1)) / HARMONIC_COUNT;

            // the continuous spectrum, behind everything
            if (curve && curve.length > 1) {
                ctx.beginPath();
                ctx.moveTo(0, baseline);
                for (let x = 0; x < curve.length; x++) {
                    ctx.lineTo(x, baseline - curve[x] * usable);
                }
                ctx.lineTo(width, baseline);
                ctx.closePath();
                ctx.fillStyle = 'rgba(246,236,216,0.10)';
                ctx.fill();
            }

            // baseline
            ctx.strokeStyle = STAGE_LINE;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, baseline + 0.5);
            ctx.lineTo(width, baseline + 0.5);
            ctx.stroke();

            for (let i = 0; i < HARMONIC_COUNT; i++) {
                const level = levels ? levels[i] : 0;
                const barH = Math.max(2, level * usable);
                const x = gap + i * (barW + gap);
                const y = baseline - barH;

                ctx.fillStyle = HARMONIC_COLOURS[i];
                // The lab's idiom: a harmonic that is absent stays visible as a
                // ghost, because "this one is missing" is the actual lesson on a
                // square wave, and a bar that vanishes teaches nothing.
                ctx.globalAlpha = level > 0.02 ? 1 : 0.18;
                ctx.fillRect(x, y, barW, barH);
                ctx.globalAlpha = 1;

                ctx.fillStyle = STAGE_MUTED;
                ctx.font = '11px Inter, system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`H${i + 1}`, x + barW / 2, baseline + 15);
            }
        };

        if (reduceMotion) {
            drawFrame(null, null);
            return undefined;
        }

        // The analyser does not exist at mount — the audio graph is built lazily
        // inside ensureAudioCtx() on the first user gesture. So the ref is read
        // EVERY FRAME rather than captured once here.
        //
        // Capturing it is the bug the original oscilloscope has: its effect runs
        // once with a null analyser, returns early, and never runs again, because
        // a ref's identity does not change. The scope therefore stays blank until
        // something remounts it — leave the section and come back and it works,
        // which is exactly the kind of fault that survives a casual look.
        let bins = null;
        let binHz = 0;
        const curve = new Float32Array(width);
        const levels = new Float32Array(HARMONIC_COUNT);

        const draw = () => {
            rafRef.current = requestAnimationFrame(draw);

            const analyser = analyserRef?.current;
            if (!analyser) {
                drawFrame(null, null);
                return;
            }
            if (!bins || bins.length !== analyser.frequencyBinCount) {
                bins = new Float32Array(analyser.frequencyBinCount);
                binHz = analyser.context.sampleRate / analyser.fftSize;
            }
            analyser.getFloatFrequencyData(bins);

            const f0 = (freqRef?.current) || 220;
            const fMax = f0 * (HARMONIC_COUNT + 1);

            for (let x = 0; x < width; x++) {
                const bin = ((x / width) * fMax) / binHz;
                const i = Math.min(bins.length - 1, Math.max(0, Math.round(bin)));
                curve[x] = dbToUnit(bins[i]);
            }

            for (let n = 1; n <= HARMONIC_COUNT; n++) {
                const centre = (n * f0) / binHz;
                // A window of a couple of bins either side: the oscillator's
                // frequency will not land exactly on a bin centre, and without
                // this a harmonic that is plainly audible can read as absent
                // purely because of where the bin boundaries fell.
                const lo = Math.max(0, Math.round(centre) - 2);
                const hi = Math.min(bins.length - 1, Math.round(centre) + 2);
                let peak = -Infinity;
                for (let i = lo; i <= hi; i++) if (bins[i] > peak) peak = bins[i];
                levels[n - 1] = dbToUnit(peak);
            }

            drawFrame(levels, curve);
        };

        draw();
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [analyserRef, freqRef, width, height]);

    return (
        <div>
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
                aria-label={`Spectrum display. The eight bars are the fundamental and the seven harmonics above it. A taller bar means more of that harmonic is present in the sound.`}
            />
            {label && (
                <p
                    style={{
                        margin: '6px 0 0',
                        fontSize: '0.78rem',
                        lineHeight: 1.45,
                        color: '#6B655C',
                    }}
                >
                    <strong style={{ color: '#23201B', fontWeight: 600 }}>H1</strong> is the note you
                    played. <strong style={{ color: '#23201B', fontWeight: 600 }}>H2–H8</strong> are the
                    harmonics stacked above it: the part that makes a sawtooth sound different from a
                    sine.
                </p>
            )}
        </div>
    );
}
