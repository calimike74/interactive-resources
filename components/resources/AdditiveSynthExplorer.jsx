'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    HARM,
    HARM_STAGE,
    HARMONIC_COUNT,
    SOUNDS,
    SOUND_ORDER,
    waveVal,
} from '@/lib/additive-recipes';

/**
 * Additive Synth Explorer — the other half of 1.3 Synthesis.
 *
 * WHERE THIS CAME FROM. This is the FFT/waveform tool Mike shaped over three
 * design passes in late July (Overnight-Runs/2026-07-22/FFT-Waveform-Explorer.html,
 * mirrored on the lab at studio-lab/public/waveform-spectrum/index.html). It was
 * finished work sitting on the experiments subdomain, which is the wrong side of
 * the 28 July rule that decided work ships to the product's own site and the lab
 * holds experiments only. So it is here, with the site's chrome, its fonts and
 * its free/paid manifest, and the lab copy can retire.
 *
 * WHY IT IS CALLED THE ADDITIVE EXPLORER. The lab called it "Waveform & Spectrum",
 * which describes the displays rather than the topic. Named as the additive
 * explorer it pairs with /subtractive-synth-explorer, and the two halves of the
 * spec point sit next to each other in the topic list: build a sound up from
 * simple tones, or start with a rich one and filter it down.
 *
 * THE DESIGN IS MIKE'S, PORTED NOT REDESIGNED. The stage, the five sound cards,
 * the eight sliders and the exam notes are as approved. Three things changed, all
 * of them consequences of moving:
 *
 *   1. The spectrum now uses the same bright palette as the circles above it. The
 *      lab's caption promises "same colour as its circle above" and the lab does
 *      not quite keep that promise — it draws circles from HARM_STAGE and bars
 *      from HARM, so H3's circle and H3's bar are different yellows. On one page
 *      that is a small blemish; across two sibling tools it would read as two
 *      different colour systems.
 *   2. The spectrum sits on the same warm-dark stage as the subtractive tool's
 *      spectrum, so a student moving between the two sees one display, not two.
 *   3. No maths vocabulary reaches the screen, per the ruling that took the
 *      Fourier language out of the lab version in the first place.
 *
 * The bars here are drawn from the recipe rather than measured from an analyser,
 * and that is deliberate. On the subtractive tool the spectrum is a MEASUREMENT —
 * it reports what the filter did to a sound you did not specify harmonic by
 * harmonic. Here the eight numbers are the controls themselves: the bars and the
 * sliders are the same eight values, so measuring them would be reporting the
 * student's own input back with extra latency and a blank display until the first
 * note. tests/additive-recipes.test.mjs checks the recipes are the waveforms they
 * claim to be, and the audio is generated from the same array the bars are drawn
 * from, so the picture and the sound cannot drift apart.
 */

// The palette, the recipes and the one function that turns eight numbers into a
// shape all live in lib/additive-recipes.js, where the test suite can reach them.
const C = {
    bg: '#f5f4f2',
    surface: '#FFFFFF',
    text: '#23201B',
    muted: '#6B655C',
    line: '#E9E2D6',
    accent: '#B5623C',
    accentInk: '#8F4B2E',
    accentSoft: '#D9A98A',
    stage: '#211C15',
    stageInk: '#F3E9D8',
    stageMuted: '#C6B9A2',
    stageLine: 'rgba(250,242,228,0.10)',
    stageWave: '#F3E6C7',
    stageBase: 'rgba(246,236,216,0.16)',
    shadow: '0 1px 2px rgba(30,20,10,.04), 0 8px 24px rgba(30,20,10,.07)',
};

const CANVAS_FONT = '11px Inter, system-ui, sans-serif';

// ─── Stage geometry ─────────────────────────────────────────────────────────
const BASE_OMEGA = 2 * Math.PI * 0.4;   // turns per second for the fundamental
const PERIODS = 4;                       // full cycles drawn across the width
const SPAN = PERIODS * 2 * Math.PI;      // total phase across the width
const FULL_T = SPAN / BASE_OMEGA;        // seconds for the pen to cross once

const STAGE_H = 260;
const SPEC_H = 200;

function sumOf(arr) {
    let t = 0;
    for (let i = 0; i < arr.length; i++) t += arr[i];
    return t;
}

/** Size a canvas to its container at device resolution and return CSS dimensions. */
function fitCanvas(canvas, cssHeight) {
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.parentElement ? canvas.parentElement.clientWidth : canvas.width;
    canvas.width = Math.max(1, Math.round(cssWidth * dpr));
    canvas.height = Math.max(1, Math.round(cssHeight * dpr));
    canvas.style.width = '100%';
    canvas.style.height = `${cssHeight}px`;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w: cssWidth, h: cssHeight };
}

export default function AdditiveSynthExplorer() {
    const [soundName, setSoundName] = useState('pure');
    const [amps, setAmps] = useState(() => SOUNDS.pure.amp.slice());
    const [signs, setSigns] = useState(() => SOUNDS.pure.sign.slice());
    const [fundamental, setFundamental] = useState(220);
    const [volume, setVolume] = useState(50);
    const [playing, setPlaying] = useState(false);

    // The animation loop must see the CURRENT recipe every frame. Reading state
    // through the closure would freeze it at whatever it was when the effect ran,
    // and a ref's identity never changes, so the effect would not re-run to fix
    // it. That is the exact fault the oscilloscope on the subtractive tool had
    // for its whole life; mirroring into refs is the cheap way to not repeat it.
    const ampsRef = useRef(amps);
    const signsRef = useRef(signs);
    ampsRef.current = amps;
    signsRef.current = signs;

    const stageRef = useRef(null);
    const specRef = useRef(null);
    const rafRef = useRef(null);
    const tRef = useRef(0);          // seconds the circles have been turning
    const lastTsRef = useRef(0);
    const restartRef = useRef(false); // set when the pen should redraw from empty

    const audioRef = useRef(null);   // { ctx, oscs[], gains[], master }
    const playingRef = useRef(false);
    const fundRef = useRef(220);
    const volRef = useRef(50);
    playingRef.current = playing;
    fundRef.current = fundamental;
    volRef.current = volume;

    // ── audio ────────────────────────────────────────────────────────────────
    const ensureAudio = useCallback(() => {
        if (audioRef.current) {
            if (audioRef.current.ctx.state === 'suspended') audioRef.current.ctx.resume();
            return audioRef.current;
        }
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        const ctx = new Ctx();

        const master = ctx.createGain();
        master.gain.value = volRef.current / 100;

        // Eight sines summing to well over unity at full tilt, so the limiter is
        // load-bearing rather than decorative.
        const limiter = ctx.createDynamicsCompressor();
        limiter.threshold.value = -8;
        limiter.knee.value = 6;
        limiter.ratio.value = 14;
        limiter.attack.value = 0.003;
        limiter.release.value = 0.18;

        master.connect(limiter);
        limiter.connect(ctx.destination);

        const oscs = [];
        const gains = [];
        for (let i = 0; i < HARMONIC_COUNT; i++) {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = fundRef.current * (i + 1);
            const g = ctx.createGain();
            g.gain.value = 0;
            osc.connect(g);
            g.connect(master);
            osc.start();
            oscs.push(osc);
            gains.push(g);
        }

        audioRef.current = { ctx, oscs, gains, master };
        return audioRef.current;
    }, []);

    /** Push the current recipe, pitch and volume at the running graph. */
    const updateAudio = useCallback(() => {
        const a = audioRef.current;
        if (!a) return;
        const now = a.ctx.currentTime;
        const amp = ampsRef.current;
        const sign = signsRef.current;
        const on = playingRef.current ? 1 : 0;
        for (let i = 0; i < HARMONIC_COUNT; i++) {
            a.oscs[i].frequency.setValueAtTime(fundRef.current * (i + 1), now);
            a.gains[i].gain.setTargetAtTime(on * 0.15 * amp[i] * sign[i], now, 0.04);
        }
        a.master.gain.setTargetAtTime(volRef.current / 100, now, 0.04);
    }, []);

    useEffect(() => { updateAudio(); }, [amps, signs, fundamental, volume, playing, updateAudio]);

    // Silence and release the context on unmount, or a page change leaves eight
    // oscillators running.
    useEffect(() => () => {
        const a = audioRef.current;
        if (a) {
            try { a.oscs.forEach((o) => o.stop()); } catch { /* already stopped */ }
            a.ctx.close();
            audioRef.current = null;
        }
    }, []);

    // ── the stage: coloured circles drawing the wave ─────────────────────────
    useEffect(() => {
        const canvas = stageRef.current;
        if (!canvas) return undefined;

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let geom = fitCanvas(canvas, STAGE_H);

        const drawFrame = (t) => {
            const { ctx, w: W, h: H } = geom;
            const amp = ampsRef.current;
            const sign = signsRef.current;

            ctx.clearRect(0, 0, W, H);

            const originX = Math.min(140, W * 0.15);
            const originY = H / 2;
            const s = Math.max(0.4, sumOf(amp));
            // One scale for the circles AND the wave, so the chain's tip and the
            // pen sit at the same height — the whole point of the picture.
            //
            // 0.44 rather than the lab's 0.4 because this stage is 260px where the
            // lab's was 300: at 0.4 the wave used only 80% of the height it had
            // and the panel read as mostly empty. The cap is still whichever of
            // the two limits binds first, so the circles can never overrun the
            // wave's starting column.
            const scale = Math.min(originX - 18, H * 0.44) / s;
            const reach = s * scale;
            const waveX0 = originX + reach + 24;
            const waveW = Math.max(60, W - waveX0 - 8);

            const headPhase = BASE_OMEGA * t;
            const penPhase = headPhase % SPAN;
            const firstSweep = headPhase < SPAN;
            const steps = Math.max(180, Math.floor(waveW));

            ctx.strokeStyle = C.stageBase;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(waveX0, originY);
            ctx.lineTo(W - 6, originY);
            ctx.stroke();

            const wavePath = (from, to) => {
                ctx.beginPath();
                for (let st = from; st <= to; st++) {
                    const ph = (st / steps) * SPAN;
                    const px = waveX0 + (ph / SPAN) * waveW;
                    const py = originY - waveVal(amp, sign, ph) * scale;
                    if (st === from) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                }
                ctx.stroke();
            };

            // Hold the finished wave faintly after the first pass, so the loop
            // never flashes back to an empty stage.
            if (!firstSweep) {
                ctx.save();
                ctx.globalAlpha = 0.26;
                ctx.strokeStyle = C.stageWave;
                ctx.lineWidth = 2;
                ctx.lineJoin = 'round';
                wavePath(0, steps);
                ctx.restore();
            }

            ctx.save();
            ctx.strokeStyle = C.stageWave;
            ctx.lineWidth = 2.4;
            ctx.lineJoin = 'round';
            ctx.shadowColor = 'rgba(243,230,199,.4)';
            ctx.shadowBlur = 7;
            wavePath(0, Math.max(1, Math.round(steps * (penPhase / SPAN))));
            ctx.restore();

            // the chain of coloured circles
            let x = originX;
            let y = originY;
            for (let i = 0; i < HARMONIC_COUNT; i++) {
                if (amp[i] <= 0.0008) continue;
                const r = amp[i] * scale;
                const angle = (i + 1) * headPhase + (sign[i] < 0 ? Math.PI : 0);
                // -sin, not +sin: canvas y grows downward, and the chain's tip has
                // to agree with the wave it is drawing.
                const nx = x + r * Math.cos(angle);
                const ny = y - r * Math.sin(angle);

                ctx.globalAlpha = 0.5;
                ctx.strokeStyle = HARM_STAGE[i];
                ctx.lineWidth = 1.3;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = 1;

                ctx.save();
                ctx.shadowColor = HARM_STAGE[i];
                ctx.shadowBlur = 6;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(nx, ny);
                ctx.stroke();
                ctx.restore();

                x = nx;
                y = ny;
            }

            const penX = waveX0 + (penPhase / SPAN) * waveW;
            const penY = originY - waveVal(amp, sign, penPhase) * scale;

            ctx.strokeStyle = 'rgba(243,230,199,.45)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 4]);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(penX, penY);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = C.stageWave;
            ctx.beginPath();
            ctx.arc(x, y, 3.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.save();
            ctx.shadowColor = C.stageWave;
            ctx.shadowBlur = 9;
            ctx.beginPath();
            ctx.arc(penX, penY, 3.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        };

        if (reduceMotion) {
            drawFrame(FULL_T);   // the finished wave, no animation
            const ro = new ResizeObserver(() => { geom = fitCanvas(canvas, STAGE_H); drawFrame(FULL_T); });
            ro.observe(canvas.parentElement);
            return () => ro.disconnect();
        }

        const loop = (ts) => {
            rafRef.current = requestAnimationFrame(loop);
            if (!lastTsRef.current) lastTsRef.current = ts;
            const dt = (ts - lastTsRef.current) / 1000;
            lastTsRef.current = ts;
            if (restartRef.current) {
                tRef.current = 0;
                restartRef.current = false;
            } else {
                tRef.current += dt;
            }
            drawFrame(tRef.current);
        };
        rafRef.current = requestAnimationFrame(loop);

        const ro = new ResizeObserver(() => { geom = fitCanvas(canvas, STAGE_H); });
        ro.observe(canvas.parentElement);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            ro.disconnect();
        };
    }, []);

    // ── the spectrum ─────────────────────────────────────────────────────────
    useEffect(() => {
        const canvas = specRef.current;
        if (!canvas) return undefined;

        const draw = () => {
            const { ctx, w, h } = fitCanvas(canvas, SPEC_H);
            const amp = ampsRef.current;

            ctx.fillStyle = C.stage;
            ctx.fillRect(0, 0, w, h);

            const baseline = h - 24;
            const usable = baseline - 14;
            const gap = w * 0.026;
            const barW = (w - gap * (HARMONIC_COUNT + 1)) / HARMONIC_COUNT;

            ctx.strokeStyle = C.stageLine;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, baseline + 0.5);
            ctx.lineTo(w, baseline + 0.5);
            ctx.stroke();

            for (let i = 0; i < HARMONIC_COUNT; i++) {
                const barH = Math.max(2, amp[i] * usable);
                const x = gap + i * (barW + gap);
                ctx.fillStyle = HARM_STAGE[i];
                // A harmonic that is off stays visible as a ghost. "This one is
                // missing" is the actual lesson on a hollow sound, and a bar that
                // disappears cannot teach it.
                ctx.globalAlpha = amp[i] > 0.001 ? 1 : 0.18;
                ctx.fillRect(x, baseline - barH, barW, barH);
                ctx.globalAlpha = 1;

                ctx.fillStyle = C.stageMuted;
                ctx.font = CANVAS_FONT;
                ctx.textAlign = 'center';
                ctx.fillText(`H${i + 1}`, x + barW / 2, baseline + 16);
            }
        };

        draw();
        const ro = new ResizeObserver(draw);
        ro.observe(canvas.parentElement);
        return () => ro.disconnect();
    }, [amps]);

    // ── interaction ──────────────────────────────────────────────────────────
    const pickSound = (name) => {
        const def = SOUNDS[name];
        setSoundName(name);
        setAmps(def.amp.slice());
        setSigns(def.sign.slice());
        restartRef.current = true;   // watch the new sound get drawn from empty
        // Tapping a sound plays it: the change in timbre is the thing being
        // taught, and it has to be heard as well as seen.
        ensureAudio();
        setPlaying(true);
    };

    const setHarmonic = (i, value) => {
        setAmps((prev) => {
            const next = prev.slice();
            next[i] = value / 100;
            return next;
        });
        setSoundName('custom');
    };

    const togglePlay = () => {
        ensureAudio();
        setPlaying((p) => !p);
    };

    const recipe = soundName === 'custom' ? null : SOUNDS[soundName];

    // ── styles ───────────────────────────────────────────────────────────────
    const card = {
        background: C.surface,
        border: `1px solid ${C.line}`,
        borderRadius: '16px',
        boxShadow: C.shadow,
        padding: '20px 22px',
    };
    const eyebrow = {
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        fontSize: '0.68rem',
        fontWeight: 700,
        color: C.accentInk,
        margin: 0,
    };
    const h2 = {
        fontFamily: 'var(--font-fraunces), Georgia, serif',
        fontSize: '1.05rem',
        fontWeight: 600,
        letterSpacing: '-0.01em',
        margin: '0 0 12px',
        color: C.text,
    };

    return (
        <div
            style={{
                background: C.bg,
                color: C.text,
                fontFamily: 'var(--font-manrope), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                padding: '28px 20px 56px',
                lineHeight: 1.5,
            }}
        >
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* ── hero ─────────────────────────────────────────────────── */}
                <header
                    style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        justifyContent: 'space-between',
                        gap: '16px',
                        flexWrap: 'wrap',
                        marginBottom: '18px',
                    }}
                >
                    <div>
                        <p style={eyebrow}>1.3 Synthesis · Additive</p>
                        <h1
                            style={{
                                fontFamily: 'var(--font-fraunces), Georgia, serif',
                                fontSize: '1.7rem',
                                fontWeight: 600,
                                letterSpacing: '-0.01em',
                                lineHeight: 1.2,
                                margin: '2px 0 0',
                            }}
                        >
                            Additive Synth Explorer
                        </h1>
                    </div>
                    <p
                        style={{
                            color: C.muted,
                            fontSize: '0.9rem',
                            maxWidth: '34ch',
                            textAlign: 'right',
                            margin: 0,
                        }}
                    >
                        Every rich sound is simple tones stacked up. Pick one, watch it get built, hear it.
                    </p>
                </header>

                {/* ── the stage ────────────────────────────────────────────── */}
                <section
                    style={{
                        ...card,
                        background: C.stage,
                        border: `1px solid ${C.stageLine}`,
                        color: C.stageInk,
                        marginBottom: '18px',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'baseline',
                            gap: '18px',
                            flexWrap: 'wrap',
                            marginBottom: '14px',
                        }}
                    >
                        <div>
                            <p style={{ ...eyebrow, color: C.accentSoft }}>Watch it build</p>
                            <h2 style={{ ...h2, color: C.stageInk, margin: '2px 0 0' }}>
                                Every harmonic is its own spinning circle
                            </h2>
                        </div>
                        <p
                            style={{
                                color: C.stageMuted,
                                fontSize: '0.86rem',
                                maxWidth: '56ch',
                                margin: 0,
                            }}
                        >
                            Each harmonic keeps its own colour — here as a spinning circle, and in the
                            spectrum below as a matching bar. Stack the circles and the last point traces
                            out the wave across the screen.
                        </p>
                    </div>

                    <div>
                        <canvas
                            ref={stageRef}
                            style={{
                                display: 'block',
                                width: '100%',
                                height: `${STAGE_H}px`,
                                background: 'transparent',
                                border: `1px solid ${C.stageLine}`,
                                borderRadius: '12px',
                            }}
                            role="img"
                            aria-label="Coloured spinning circles, one for each harmonic in the current sound, drawing that sound's waveform across the screen from left to right."
                        />
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            gap: '18px',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            marginTop: '16px',
                        }}
                    >
                        <button
                            type="button"
                            onClick={togglePlay}
                            aria-pressed={playing}
                            style={{
                                background: C.accent,
                                color: '#fff',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '11px 26px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                boxShadow: C.shadow,
                            }}
                        >
                            {playing ? '■ Stop' : '▸ Play'}
                        </button>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                            <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>Pitch</span>
                            <input
                                type="range"
                                min={110}
                                max={440}
                                step={1}
                                value={fundamental}
                                onChange={(e) => setFundamental(parseInt(e.target.value, 10))}
                                aria-label="Pitch of the base note in hertz"
                                style={{ width: '120px', accentColor: C.accent, cursor: 'pointer' }}
                            />
                            <span
                                style={{
                                    color: C.stageMuted,
                                    fontVariantNumeric: 'tabular-nums',
                                    minWidth: '60px',
                                }}
                            >
                                {fundamental} Hz
                            </span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                            <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>Volume</span>
                            <input
                                type="range"
                                min={0}
                                max={100}
                                step={1}
                                value={volume}
                                onChange={(e) => setVolume(parseInt(e.target.value, 10))}
                                aria-label="Volume"
                                style={{ width: '120px', accentColor: C.accent, cursor: 'pointer' }}
                            />
                            <span
                                style={{
                                    color: C.stageMuted,
                                    fontVariantNumeric: 'tabular-nums',
                                    minWidth: '48px',
                                }}
                            >
                                {volume}%
                            </span>
                        </label>

                        <span
                            style={{
                                color: C.stageMuted,
                                fontSize: '0.8rem',
                                flex: 1,
                                minWidth: '200px',
                                textAlign: 'right',
                            }}
                        >
                            Same note every time — only the timbre changes.
                        </span>
                    </div>
                </section>

                {/* ── pick a sound + spectrum ──────────────────────────────── */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: '18px',
                        alignItems: 'start',
                        marginBottom: '18px',
                    }}
                >
                    <section style={card}>
                        <h2 style={h2}>Pick a sound</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            {SOUND_ORDER.map((name) => {
                                const def = SOUNDS[name];
                                const on = soundName === name;
                                return (
                                    <button
                                        key={name}
                                        type="button"
                                        onClick={() => pickSound(name)}
                                        aria-pressed={on}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-start',
                                            gap: '2px',
                                            border: `1px solid ${on ? C.accent : C.line}`,
                                            background: on ? C.accent : C.surface,
                                            color: on ? '#fff' : C.text,
                                            borderRadius: '12px',
                                            padding: '11px 14px',
                                            cursor: 'pointer',
                                            fontFamily: 'inherit',
                                            textAlign: 'left',
                                        }}
                                    >
                                        <span style={{ fontWeight: 700, fontSize: '0.98rem', letterSpacing: '-0.01em' }}>
                                            {def.label}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: '0.73rem',
                                                color: on ? 'rgba(255,255,255,0.86)' : C.muted,
                                            }}
                                        >
                                            {def.sub}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <p
                            style={{
                                margin: '14px 0 0',
                                fontSize: '0.92rem',
                                color: C.muted,
                                background: C.bg,
                                border: `1px solid ${C.line}`,
                                borderRadius: '10px',
                                padding: '10px 14px',
                            }}
                            aria-live="polite"
                        >
                            {recipe ? (
                                <>
                                    <strong style={{ color: C.text }}>{recipe.label}</strong> — {recipe.desc}
                                </>
                            ) : (
                                <>
                                    <strong style={{ color: C.text }}>Your own blend</strong> — mixed from the
                                    eight harmonic sliders below.
                                </>
                            )}
                        </p>
                    </section>

                    <section style={card}>
                        <h2 style={h2}>The harmonics inside</h2>
                        <div>
                            <canvas
                                ref={specRef}
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    height: `${SPEC_H}px`,
                                    borderRadius: '12px',
                                    background: C.stage,
                                }}
                                role="img"
                                aria-label="Bar chart of the harmonics in the current sound. Each bar is coloured to match its circle on the stage above; a taller bar means more of that harmonic."
                            />
                        </div>
                        <p style={{ margin: '10px 0 0', color: C.muted, fontSize: '0.84rem', maxWidth: '64ch' }}>
                            Each bar is one harmonic&apos;s strength — the same colour as its circle above.
                            This bar-code <strong style={{ color: C.text, fontWeight: 600 }}>is</strong>{' '}
                            the timbre; a DAW&apos;s spectrum analyser shows you the same thing for any
                            recording.
                        </p>
                    </section>
                </div>

                {/* ── build your own ───────────────────────────────────────── */}
                <section style={{ ...card, marginBottom: '18px' }}>
                    <h2 style={h2}>Build your own — nudge the eight harmonics</h2>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                            gap: '14px',
                        }}
                    >
                        {amps.map((a, i) => (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'baseline',
                                        fontSize: '0.78rem',
                                        gap: '6px',
                                    }}
                                >
                                    <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <span
                                            style={{
                                                width: '9px',
                                                height: '9px',
                                                borderRadius: '50%',
                                                background: HARM[i],
                                                flex: '0 0 auto',
                                            }}
                                        />
                                        H{i + 1}
                                        {i === 0 && (
                                            <small style={{ fontWeight: 400, color: C.muted }}>(base)</small>
                                        )}
                                    </span>
                                    <span
                                        style={{
                                            color: C.muted,
                                            fontVariantNumeric: 'tabular-nums',
                                            fontSize: '0.7rem',
                                        }}
                                    >
                                        {fundamental * (i + 1)} Hz
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={1}
                                    value={Math.round(a * 100)}
                                    onChange={(e) => setHarmonic(i, parseInt(e.target.value, 10))}
                                    aria-label={`Strength of harmonic ${i + 1}`}
                                    style={{ width: '100%', accentColor: HARM[i], cursor: 'pointer' }}
                                />
                                <output
                                    style={{
                                        fontSize: '0.74rem',
                                        color: C.muted,
                                        fontVariantNumeric: 'tabular-nums',
                                        textAlign: 'right',
                                    }}
                                >
                                    {Math.round(a * 100)}%
                                </output>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── exam notes ───────────────────────────────────────────── */}
                <section style={{ ...card, marginBottom: '18px' }}>
                    <h2 style={h2}>Why this matters for the exam</h2>
                    <ul
                        style={{
                            margin: 0,
                            padding: 0,
                            listStyle: 'none',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                            gap: '14px',
                        }}
                    >
                        <li
                            style={{
                                fontSize: '0.88rem',
                                color: C.muted,
                                background: C.bg,
                                border: `1px solid ${C.line}`,
                                borderRadius: '12px',
                                padding: '13px 15px',
                            }}
                        >
                            <strong style={{ color: C.text, display: 'block', marginBottom: '3px' }}>
                                1.3 Synthesis — additive
                            </strong>
                            This whole page is additive synthesis: build a rich timbre by stacking simple
                            tones above the base note, one slider per harmonic.
                        </li>
                        <li
                            style={{
                                fontSize: '0.88rem',
                                color: C.muted,
                                background: C.bg,
                                border: `1px solid ${C.line}`,
                                borderRadius: '12px',
                                padding: '13px 15px',
                            }}
                        >
                            <strong style={{ color: C.text, display: 'block', marginBottom: '3px' }}>
                                1.11 EQ
                            </strong>
                            Every EQ move — cut, boost, shelf — changes the height of certain bars on this
                            spectrum. Brighter means taller bars on the right; warmer means shorter ones.
                        </li>
                        <li
                            style={{
                                fontSize: '0.88rem',
                                color: C.muted,
                                background: C.bg,
                                border: `1px solid ${C.line}`,
                                borderRadius: '12px',
                                padding: '13px 15px',
                            }}
                        >
                            <strong style={{ color: C.text, display: 'block', marginBottom: '3px' }}>
                                The spectrum analyser
                            </strong>
                            Every DAW has one. Point it at any recording and it shows this same bar-chart of
                            what is in the sound — the picture you are building here, read the other way
                            round.
                        </li>
                    </ul>
                </section>

                {/* ── the pair ─────────────────────────────────────────────── */}
                <section style={{ ...card, display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: C.muted, maxWidth: '62ch' }}>
                        <strong style={{ color: C.text }}>The other way round.</strong> Here you build a
                        sound up from nothing. A subtractive synth starts with a waveform that already has
                        all of these harmonics in it, and takes them away with a filter.
                    </p>
                    <Link
                        href="/subtractive-synth-explorer"
                        style={{
                            color: '#fff',
                            background: C.accent,
                            textDecoration: 'none',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            padding: '10px 20px',
                            borderRadius: '12px',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        Subtractive Synth Explorer →
                    </Link>
                </section>
            </div>
        </div>
    );
}
