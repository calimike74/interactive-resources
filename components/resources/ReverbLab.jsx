'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Callout from '@/components/Callout';
import {
    irEnvelope,
    envelopePoints,
    wetDryLevels,
    scoreMatch,
    MATCH_ROUND_MARKS,
} from '@/lib/reverb/engine';

// ═══════════════════════════════════════════════════════════════════════════
// The Reverb Lab — 1.12 Reverb
//
// The band a paying student most expects to HEAR, and until tonight the
// sharpest gap on the site (a hotspot diagram and a quiz). One live
// convolution reverb whose impulse responses are GENERATED from
// lib/reverb/engine.js — the decay plot, the sound and the ear-bench
// marking all read the same maths. Structure per INTERACTIVE-BAR.md:
// isolate each parameter, combine at the end, sandbox as the payoff.
// ═══════════════════════════════════════════════════════════════════════════

const FRAUNCES = 'font-[family-name:var(--font-fraunces)]';
const MONO = 'font-[family-name:var(--font-jbmono)]';
const CARD_SHADOW = 'shadow-[0_1px_0_rgba(43,36,24,0.04),0_18px_40px_-24px_rgba(43,36,24,0.22)]';

// Same colour language as the Compression Lab: ink = the dry signal,
// sienna = the tail / what the effect adds, field = markers and "correct".
const INK = '#1F2A1C';
const SIENNA = '#A0522D';
const FIELD = '#3A4A35';
const CREAM = '#F2EBE0';
const PAPER = '#F8F2E8';
const LINE = 'rgba(43,36,24,0.18)';

// ─── The audio engine ───────────────────────────────────────────────────────
// A sparse percussion phrase with deliberate SILENCES — a reverb tail is
// only audible in the gaps after a hit, so unlike the Compression Lab's
// dense groove, this source leaves room to listen. All synthesised; the
// impulse responses are generated, not sampled.

const BPM = 76;
const STEPS = 32; // two bars of 16ths
const STEP_S = 60 / BPM / 4;

// velocity per step — mostly empty on purpose
const CLICK = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.8, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const SNARE = [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0.5, 0, 0, 0, 0];
const STAB = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.7, 0];

function makeImpulseResponse(ctx, { rt60S, gated, gateHoldS }) {
    // Pre-delay lives on a DelayNode (instant, clickless changes), so the
    // IR itself starts decaying at t = 0.
    const p = { rt60S, preDelayS: 0, gated, gateHoldS };
    const lengthS = Math.min(4.2, gated ? gateHoldS + 0.08 : rt60S * 1.05 + 0.05);
    const n = Math.max(1, Math.floor(ctx.sampleRate * lengthS));
    const buf = ctx.createBuffer(2, n, ctx.sampleRate);
    let energy = 0;
    for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        for (let i = 0; i < n; i++) {
            const env = irEnvelope(i / ctx.sampleRate, p);
            d[i] = (Math.random() * 2 - 1) * env;
            if (ch === 0) energy += env * env;
        }
    }
    // Energy compensation: without it, longer tails sound louder simply
    // because more of the IR is non-zero, and the decay slider reads as a
    // volume slider — the exact confusion the lab exists to remove.
    const scale = 5.5 / Math.sqrt(Math.max(1, energy));
    for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        for (let i = 0; i < n; i++) d[i] *= scale;
    }
    return buf;
}

function useReverbAudio() {
    const ctxRef = useRef(null);
    const nodesRef = useRef(null);
    const schedRef = useRef(null);
    const stepRef = useRef(0);
    const nextTimeRef = useRef(0);
    const regenTimerRef = useRef(null);
    const [running, setRunning] = useState(false);
    const [bypassed, setBypassed] = useState(false);
    // which chain the source feeds: 'user' (default) or 'ref' (ear bench)
    const routeRef = useRef('user');

    const buildChain = useCallback((ctx, master) => {
        const inGate = ctx.createGain(); // route switch
        const dry = ctx.createGain();
        const preDelay = ctx.createDelay(0.25);
        const convolver = ctx.createConvolver();
        const wet = ctx.createGain();
        inGate.connect(dry);
        inGate.connect(preDelay);
        preDelay.connect(convolver);
        convolver.connect(wet);
        dry.connect(master);
        wet.connect(master);
        return { inGate, dry, preDelay, convolver, wet };
    }, []);

    const applyParams = useCallback((chain, ctx, { preDelayMs, mix }) => {
        const t = ctx.currentTime;
        const { wet, dry } = wetDryLevels(mix);
        chain.preDelay.delayTime.setTargetAtTime(preDelayMs / 1000, t, 0.02);
        chain.wet.gain.setTargetAtTime(wet, t, 0.03);
        chain.dry.gain.setTargetAtTime(dry, t, 0.03);
    }, []);

    const build = useCallback((ctx) => {
        const source = ctx.createGain();
        const master = ctx.createGain();
        master.gain.value = 0.75;
        master.connect(ctx.destination);

        const user = buildChain(ctx, master);
        const ref = buildChain(ctx, master);
        source.connect(user.inGate);
        source.connect(ref.inGate);
        user.inGate.gain.value = 1;
        ref.inGate.gain.value = 0;

        // keep the gain graph "hot" between one-shot sources (Chromium
        // reads stale automation otherwise)
        const keepAlive = ctx.createConstantSource();
        keepAlive.offset.value = 0;
        keepAlive.connect(source);
        keepAlive.start();

        const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
        const nd = noiseBuf.getChannelData(0);
        for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

        return { source, master, user, ref, noiseBuf, keepAlive };
    }, [buildChain]);

    const scheduleStep = useCallback((step, t) => {
        const ctx = ctxRef.current;
        const n = nodesRef.current;
        if (!ctx || !n) return;
        const cv = CLICK[step];
        if (cv) {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1500, t);
            osc.frequency.exponentialRampToValueAtTime(900, t + 0.02);
            g.gain.setValueAtTime(cv * 0.5, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
            osc.connect(g).connect(n.source);
            osc.start(t);
            osc.stop(t + 0.05);
        }
        const sv = SNARE[step];
        if (sv) {
            const src = ctx.createBufferSource();
            src.buffer = n.noiseBuf;
            const bp = ctx.createBiquadFilter();
            bp.type = 'bandpass';
            bp.frequency.value = 2100;
            bp.Q.value = 0.9;
            const g = ctx.createGain();
            g.gain.setValueAtTime(sv * 0.85, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
            src.connect(bp).connect(g).connect(n.source);
            src.start(t, 0.03);
            src.stop(t + 0.15);
        }
        const tv = STAB[step];
        if (tv) {
            const freqs = [220, 277.18, 329.63]; // A minor-ish stab
            for (const f of freqs) {
                const osc = ctx.createOscillator();
                const lp = ctx.createBiquadFilter();
                lp.type = 'lowpass';
                lp.frequency.value = 1600;
                const g = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.value = f;
                g.gain.setValueAtTime(0.0001, t);
                g.gain.exponentialRampToValueAtTime(tv * 0.16, t + 0.01);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
                osc.connect(lp).connect(g).connect(n.source);
                osc.start(t);
                osc.stop(t + 0.24);
            }
        }
    }, []);

    const start = useCallback(() => {
        if (running) return;
        let ctx = ctxRef.current;
        if (!ctx) {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            ctxRef.current = ctx;
            nodesRef.current = build(ctx);
        }
        if (ctx.state === 'suspended') ctx.resume();
        stepRef.current = 0;
        nextTimeRef.current = ctx.currentTime + 0.06;
        schedRef.current = setInterval(() => {
            const lookahead = ctx.currentTime + 0.12;
            while (nextTimeRef.current < lookahead) {
                scheduleStep(stepRef.current, nextTimeRef.current);
                stepRef.current = (stepRef.current + 1) % STEPS;
                nextTimeRef.current += STEP_S;
            }
        }, 30);
        setRunning(true);
    }, [running, build, scheduleStep]);

    const stop = useCallback(() => {
        if (schedRef.current) clearInterval(schedRef.current);
        schedRef.current = null;
        if (ctxRef.current && ctxRef.current.state === 'running') ctxRef.current.suspend();
        setRunning(false);
    }, []);

    const setBypass = useCallback((by) => {
        setBypassed(by);
        const n = nodesRef.current;
        const ctx = ctxRef.current;
        if (!n || !ctx) return;
        const t = ctx.currentTime;
        // bypass = force the user chain fully dry (chain routing unchanged)
        if (by) {
            n.user.wet.gain.setTargetAtTime(0, t, 0.02);
            n.user.dry.gain.setTargetAtTime(1, t, 0.02);
        }
    }, []);

    /** Apply pre-delay/mix instantly; regenerate the IR (decay/gate) after a
     *  short debounce so slider drags don't build hundreds of buffers. */
    const setUserParams = useCallback((p) => {
        const ctx = ctxRef.current;
        const n = nodesRef.current;
        if (!ctx || !n) return;
        applyParams(n.user, ctx, p);
        if (regenTimerRef.current) clearTimeout(regenTimerRef.current);
        regenTimerRef.current = setTimeout(() => {
            const ctx2 = ctxRef.current;
            const n2 = nodesRef.current;
            if (!ctx2 || !n2) return;
            n2.user.convolver.buffer = makeImpulseResponse(ctx2, {
                rt60S: p.rt60S,
                gated: p.gated,
                gateHoldS: p.gateHoldS,
            });
        }, 160);
    }, [applyParams]);

    const setRefParams = useCallback((p) => {
        const ctx = ctxRef.current;
        const n = nodesRef.current;
        if (!ctx || !n) return;
        applyParams(n.ref, ctx, p);
        n.ref.convolver.buffer = makeImpulseResponse(ctx, {
            rt60S: p.rt60S,
            gated: false,
            gateHoldS: 0.25,
        });
    }, [applyParams]);

    const setRoute = useCallback((route) => {
        routeRef.current = route;
        const n = nodesRef.current;
        const ctx = ctxRef.current;
        if (!n || !ctx) return;
        const t = ctx.currentTime;
        n.user.inGate.gain.setTargetAtTime(route === 'user' ? 1 : 0, t, 0.02);
        n.ref.inGate.gain.setTargetAtTime(route === 'ref' ? 1 : 0, t, 0.02);
    }, []);

    useEffect(() => {
        return () => {
            if (schedRef.current) clearInterval(schedRef.current);
            if (regenTimerRef.current) clearTimeout(regenTimerRef.current);
            if (ctxRef.current) ctxRef.current.close();
        };
    }, []);

    return { running, bypassed, start, stop, setBypass, setUserParams, setRefParams, setRoute };
}

// ─── Decay envelope plot ────────────────────────────────────────────────────

const PLOT_W = 340;
const PLOT_H = 170;
const PAD = { l: 40, r: 12, t: 14, b: 30 };
const T_MAX = 3.2;

function tToX(tS) {
    return PAD.l + (tS / T_MAX) * (PLOT_W - PAD.l - PAD.r);
}
function levelToY(level) {
    return PAD.t + (1 - level) * (PLOT_H - PAD.t - PAD.b);
}

function EnvelopePlot({ params }) {
    const p = {
        rt60S: params.rt60S,
        preDelayS: params.preDelayMs / 1000,
        gated: params.gated,
        gateHoldS: params.gateHoldS,
    };
    const pts = envelopePoints(p, 0, T_MAX, 0.01);
    const tail = `M${tToX(p.preDelayS).toFixed(1)},${levelToY(0).toFixed(1)} ` +
        pts
            .filter((q) => q.tS >= p.preDelayS)
            .map((q) => `L${tToX(q.tS).toFixed(1)},${levelToY(q.level).toFixed(1)}`)
            .join(' ') +
        ` L${tToX(T_MAX).toFixed(1)},${levelToY(0).toFixed(1)} Z`;
    const rt60End = p.preDelayS + params.rt60S;

    return (
        <svg
            viewBox={`0 0 ${PLOT_W} ${PLOT_H}`}
            className="w-full max-w-[420px]"
            role="img"
            aria-label={`Decay envelope: pre-delay ${params.preDelayMs} milliseconds, decay time ${params.rt60S} seconds${params.gated ? ', gated' : ''}`}
        >
            <rect x="0" y="0" width={PLOT_W} height={PLOT_H} fill={PAPER} rx="12" />
            <rect x={PAD.l} y={PAD.t} width={PLOT_W - PAD.l - PAD.r} height={PLOT_H - PAD.t - PAD.b} fill={CREAM} stroke={LINE} />
            {[1, 2, 3].map((s) => (
                <g key={s}>
                    <line x1={tToX(s)} y1={PAD.t} x2={tToX(s)} y2={PLOT_H - PAD.b} stroke={LINE} strokeDasharray="2 4" />
                    <text x={tToX(s)} y={PLOT_H - PAD.b + 13} textAnchor="middle" fontSize="9" fill={INK} opacity="0.6" fontFamily="monospace">{s}s</text>
                </g>
            ))}
            <text x={PAD.l - 6} y={levelToY(1) + 3} textAnchor="end" fontSize="9" fill={INK} opacity="0.6" fontFamily="monospace">0 dB</text>
            <text x={PAD.l - 6} y={levelToY(0) + 3} textAnchor="end" fontSize="9" fill={INK} opacity="0.6" fontFamily="monospace">−60</text>

            {/* the dry hit */}
            <rect x={tToX(0) - 1.5} y={levelToY(1)} width="3" height={levelToY(0) - levelToY(1)} fill={INK} rx="1.5" />
            <text x={tToX(0) + 5} y={PAD.t + 10} fontSize="9" fill={INK} opacity="0.7" fontFamily="monospace">dry hit</text>

            {/* the tail */}
            <path d={tail} fill="rgba(160,82,45,0.28)" stroke={SIENNA} strokeWidth="1.8" />

            {/* pre-delay gap marker */}
            {params.preDelayMs > 4 && (
                <>
                    <line x1={tToX(0)} y1={levelToY(0) + 8} x2={tToX(p.preDelayS)} y2={levelToY(0) + 8} stroke={FIELD} strokeWidth="1.4" />
                    <text x={tToX(p.preDelayS / 2)} y={levelToY(0) + 19} textAnchor="middle" fontSize="9" fill={FIELD} fontFamily="monospace">{params.preDelayMs} ms</text>
                </>
            )}

            {/* RT60 marker (where the tail reaches −60 dB) */}
            {!params.gated && rt60End <= T_MAX && (
                <>
                    <line x1={tToX(rt60End)} y1={PAD.t} x2={tToX(rt60End)} y2={PLOT_H - PAD.b} stroke={FIELD} strokeDasharray="3 3" />
                    <text x={tToX(rt60End)} y={PAD.t + 10} textAnchor="middle" fontSize="9" fill={FIELD} fontFamily="monospace">RT60</text>
                </>
            )}

            {/* gate cut */}
            {params.gated && (
                <>
                    <line x1={tToX(p.preDelayS + params.gateHoldS)} y1={PAD.t} x2={tToX(p.preDelayS + params.gateHoldS)} y2={PLOT_H - PAD.b} stroke={INK} strokeWidth="1.6" />
                    <text x={tToX(p.preDelayS + params.gateHoldS) + 4} y={PAD.t + 10} fontSize="9" fill={INK} fontFamily="monospace">gate cuts</text>
                </>
            )}
        </svg>
    );
}

// ─── Shared scaffolding (same idiom as the Compression Lab) ─────────────────

function Movement({ number, title, children }) {
    return (
        <section className="mt-14">
            <p className={`${MONO} text-xs uppercase tracking-wide text-sienna-600`}>Movement {number}</p>
            <h2 className={`${FRAUNCES} mt-1 text-2xl font-medium text-ink sm:text-3xl`}>{title}</h2>
            {children}
        </section>
    );
}

function Prose({ children }) {
    return <p className="mt-3 max-w-[65ch] text-base leading-relaxed text-ink/75">{children}</p>;
}

function ListenFor({ children }) {
    return (
        <p className={`${MONO} mt-3 rounded-xl bg-field-100 px-4 py-2.5 text-[13px] leading-relaxed text-field-700`}>
            Listen for: {children}
        </p>
    );
}

function LabSlider({ label, min, max, step, value, onChange, format }) {
    return (
        <label className="block">
            <span className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-ink/80">{label}</span>
                <span className={`${MONO} text-sm text-ink`}>{format(value)}</span>
            </span>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="mt-1.5 w-full accent-[#3A4A35]"
            />
        </label>
    );
}

function PlayBar({ running, bypassed, onStart, onStop, onBypass, startLabel }) {
    return (
        <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
                type="button"
                onClick={running ? onStop : onStart}
                className={`rounded-full px-5 py-2 text-sm font-semibold text-white transition-colors ${running ? 'bg-sienna-600 hover:bg-sienna-700' : 'bg-field-600 hover:bg-field-700'}`}
            >
                {running ? 'Stop the phrase' : startLabel}
            </button>
            <button
                type="button"
                onClick={() => onBypass(!bypassed)}
                aria-pressed={!bypassed}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${bypassed ? 'border-line bg-paper text-ink/70' : 'border-field-600 bg-field-100 text-field-700'}`}
            >
                {bypassed ? 'Room: bypassed (dry)' : 'Room: in'}
            </button>
        </div>
    );
}

// ─── The ear bench ─────────────────────────────────────────────────────────

const BENCH_ROUNDS = [
    {
        name: 'Round 1 — a tight space',
        target: { rt60S: 0.6, preDelayMs: 10, mix: 0.25 },
    },
    {
        name: 'Round 2 — a big room, held off the voice',
        target: { rt60S: 2.4, preDelayMs: 65, mix: 0.45 },
    },
    {
        name: 'Round 3 — deliberately drowned',
        target: { rt60S: 1.4, preDelayMs: 25, mix: 0.75 },
    },
];

function EarBench({ audio }) {
    const [roundIx, setRoundIx] = useState(0);
    const [guess, setGuess] = useState({ rt60S: 1.2, preDelayMs: 30, mix: 0.4 });
    const [listening, setListening] = useState('yours'); // 'yours' | 'reference'
    const [result, setResult] = useState(null);
    const [totals, setTotals] = useState([]);
    const round = BENCH_ROUNDS[roundIx];

    // keep the audio chains in step with bench state while the bench is in use
    const applyGuess = (g) => {
        setGuess(g);
        audio.setUserParams({ ...g, gated: false, gateHoldS: 0.25 });
    };

    const listen = (which) => {
        setListening(which);
        if (which === 'reference') {
            audio.setRefParams(round.target);
            audio.setRoute('ref');
        } else {
            audio.setUserParams({ ...guess, gated: false, gateHoldS: 0.25 });
            audio.setRoute('user');
        }
        if (!audio.running) audio.start();
    };

    const commit = () => {
        setResult(scoreMatch(guess, round.target));
        audio.setRoute('user');
    };

    const next = () => {
        setTotals((ts) => [...ts, result.marks]);
        setResult(null);
        setGuess({ rt60S: 1.2, preDelayMs: 30, mix: 0.4 });
        setListening('yours');
        setRoundIx((i) => Math.min(i + 1, BENCH_ROUNDS.length - 1));
    };

    const finished = totals.length === BENCH_ROUNDS.length;
    const grandTotal = totals.reduce((a, b) => a + b, 0);

    return (
        <div className={`mt-5 rounded-2xl border border-line bg-paper p-5 ${CARD_SHADOW}`}>
            {!finished ? (
                <>
                    <p className="text-sm leading-relaxed text-ink/80">
                        <span className="font-semibold text-ink">{round.name}.</span> Both buttons play the same phrase
                        through different rooms — the reference&rsquo;s settings are hidden. Set your three controls until
                        the two rooms sound identical, then commit.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={() => listen('reference')}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${listening === 'reference' ? 'bg-ink text-cream' : 'border border-line text-ink/70'}`}
                        >
                            ▸ Play the reference room
                        </button>
                        <button
                            type="button"
                            onClick={() => listen('yours')}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${listening === 'yours' ? 'bg-field-600 text-white' : 'border border-line text-ink/70'}`}
                        >
                            ▸ Play your version
                        </button>
                    </div>
                    <div className="mt-4 grid max-w-md gap-4">
                        <LabSlider label="Decay time" min={0.2} max={5} step={0.1} value={guess.rt60S} onChange={(v) => applyGuess({ ...guess, rt60S: v })} format={(v) => `${v.toFixed(1)} s`} />
                        <LabSlider label="Pre-delay" min={0} max={120} step={5} value={guess.preDelayMs} onChange={(v) => applyGuess({ ...guess, preDelayMs: v })} format={(v) => `${v} ms`} />
                        <LabSlider label="Amount (wet/dry)" min={0} max={1} step={0.05} value={guess.mix} onChange={(v) => applyGuess({ ...guess, mix: v })} format={(v) => `${Math.round(v * 100)}% wet`} />
                    </div>
                    {!result ? (
                        <button
                            type="button"
                            onClick={commit}
                            className="mt-5 rounded-full bg-field-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-field-700"
                        >
                            Commit my match
                        </button>
                    ) : (
                        <div className="mt-5">
                            <p className={`${FRAUNCES} text-2xl text-ink`}>
                                {result.marks}/{MATCH_ROUND_MARKS}
                            </p>
                            <ul className="mt-3 space-y-2.5">
                                {result.breakdown.map((b) => (
                                    <li key={b.feature} className="text-sm leading-snug">
                                        <span className={`${MONO} mr-1.5 ${b.earned === b.max ? 'text-field-700' : 'text-sienna-700'}`}>
                                            {b.earned}/{b.max}
                                        </span>
                                        <span className="font-semibold text-ink/85">{b.feature}.</span>{' '}
                                        <span className="text-ink/70">{b.comment}</span>
                                    </li>
                                ))}
                            </ul>
                            <p className={`${MONO} mt-3 text-[11px] text-ink/55`}>
                                The reference was: decay {round.target.rt60S.toFixed(1)} s · pre-delay {round.target.preDelayMs} ms ·{' '}
                                {Math.round(round.target.mix * 100)}% wet.
                            </p>
                            <button
                                type="button"
                                onClick={next}
                                className="mt-4 rounded-full bg-field-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-field-700"
                            >
                                {roundIx === BENCH_ROUNDS.length - 1 ? 'Finish' : 'Next round'}
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div>
                    <p className={`${FRAUNCES} text-2xl text-ink`}>
                        {grandTotal}/{MATCH_ROUND_MARKS * BENCH_ROUNDS.length} across the three rooms
                    </p>
                    <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-ink/75">
                        Matching a space by ear is exactly the skill the production questions reward — the 2019 paper&rsquo;s
                        Q5 asked candidates to match a reverb amount on a real mix. If a dimension kept costing you marks,
                        go back to its movement above and listen again with the plot in view.
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            setTotals([]);
                            setRoundIx(0);
                            setResult(null);
                            setGuess({ rt60S: 1.2, preDelayMs: 30, mix: 0.4 });
                        }}
                        className="mt-4 rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink/70"
                    >
                        Run the bench again
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Hero ───────────────────────────────────────────────────────────────────
// Engine-computed: the two tails are envelopePoints() for a tight room and
// a hall — the hero cannot disagree with the lab. Deterministic markup.

const HERO_ROOM = envelopePoints({ rt60S: 0.5, preDelayS: 0.02 }, 0, 2.6, 0.04);
const HERO_HALL = envelopePoints({ rt60S: 2.2, preDelayS: 0.07 }, 0, 2.6, 0.04);

function heroPath(pts, w, h, x0, y0) {
    return (
        `M${x0},${y0 + h} ` +
        pts.map((p) => `L${(x0 + (p.tS / 2.6) * w).toFixed(1)},${(y0 + (1 - p.level) * h).toFixed(1)}`).join(' ') +
        ` L${x0 + w},${y0 + h} Z`
    );
}

function Hero() {
    return (
        <div
            className="relative overflow-hidden"
            style={{ background: 'linear-gradient(160deg, #24301F 0%, #1F2A1C 45%, #1A241A 100%)' }}
        >
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        'radial-gradient(90% 60% at 20% 0%, rgba(220,200,146,0.08), transparent 60%), radial-gradient(70% 50% at 90% 100%, rgba(160,82,45,0.10), transparent 60%)',
                }}
            />
            <div className="relative mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 sm:py-14 md:flex-row md:items-center md:justify-between">
                <div className="max-w-lg">
                    <p className={`${MONO} text-xs uppercase tracking-[0.18em] text-[#DCC892]`}>
                        C4 · 1.12 Reverb · a lab
                    </p>
                    <h1 className={`${FRAUNCES} mt-2 text-4xl font-medium text-[#F2EBE0] sm:text-[2.75rem] sm:leading-tight`}>
                        The Reverb Lab
                    </h1>
                    <p className="mt-3 text-base leading-relaxed text-[#F2EBE0]/75">
                        A real space you can resize while a phrase plays inside it. Decay, pre-delay and amount taken one
                        at a time — then three hidden rooms to match by ear alone.
                    </p>
                </div>
                <svg viewBox="0 0 300 120" className="w-full max-w-[320px] shrink-0" role="img" aria-label="Two decay tails: a tight room and a long hall">
                    <rect x="6" y="14" width="3" height="78" rx="1.5" fill="#F2EBE0" />
                    <path d={heroPath(HERO_HALL, 270, 78, 10, 14)} fill="rgba(220,200,146,0.20)" stroke="#DCC892" strokeWidth="1.6" />
                    <path d={heroPath(HERO_ROOM, 270, 78, 10, 14)} fill="rgba(160,82,45,0.30)" stroke="#A0522D" strokeWidth="1.6" />
                    <text x="10" y="112" fontSize="9" fill="rgba(160,82,45,0.9)" fontFamily="monospace">room — 0.5 s</text>
                    <text x="190" y="112" fontSize="9" fill="rgba(220,200,146,0.8)" fontFamily="monospace">hall — 2.2 s</text>
                </svg>
            </div>
        </div>
    );
}

// ─── The page ───────────────────────────────────────────────────────────────

const DEFAULTS = { rt60S: 1.2, preDelayMs: 20, mix: 0.35, gated: false, gateHoldS: 0.25 };

export default function ReverbLab() {
    const audio = useReverbAudio();
    const [params, setParamsState] = useState(DEFAULTS);

    const update = useCallback(
        (next) => {
            setParamsState(next);
            audio.setUserParams(next);
            audio.setRoute('user');
        },
        [audio],
    );
    const set = (key) => (value) => update({ ...params, [key]: value });

    return (
        <div className="min-h-screen bg-cream">
            <Hero />
            <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
                <section className="pt-8">
                    <Prose>
                        Every space you have ever heard music in is a reverb. The paper asks for its parameters by name —
                        decay, pre-delay, wet/dry — and its production questions expect you to judge them by ear. This lab
                        is a real convolution reverb whose room you can resize while a phrase plays inside it.
                    </Prose>
                    <Callout type="tip" title="How the examiners frame it">
                        The 2020 paper&rsquo;s 20-mark question put EQ, gating and reverb on two guitars. The Principal
                        Examiner: &ldquo;The best responses discussed the merits of opposite EQs on the different guitars,
                        correctly described how the gating would sound and commented on the suitability of the
                        reverb.&rdquo; Suitability — not the definition. That judgement is what this lab trains.
                    </Callout>
                </section>

                <Movement number="1" title="Hear the space switch on">
                    <Prose>
                        The phrase below is deliberately sparse — a reverb tail only shows itself in the silence after a
                        hit. Play it bone dry first, then switch the room in and listen to what fills the gaps.
                    </Prose>
                    <PlayBar
                        running={audio.running}
                        bypassed={audio.bypassed}
                        onStart={() => {
                            audio.start();
                            audio.setUserParams(params);
                            audio.setRoute('user');
                        }}
                        onStop={audio.stop}
                        onBypass={(by) => {
                            audio.setBypass(by);
                            if (!by) audio.setUserParams(params);
                        }}
                        startLabel="Play the phrase"
                    />
                    <ListenFor>
                        dry: each hit stops dead, the silences are absolute · room in: every hit leaves a tail behind it,
                        and the space between the notes has air in it.
                    </ListenFor>
                </Movement>

                <Movement number="2" title="Decay — how long the space keeps ringing">
                    <Prose>
                        Decay time (written RT60) is how long the tail takes to fall by 60 decibels — effectively, to
                        silence. Small tiled rooms sit near half a second; concert halls run past two. Only this control
                        is live here: drag it and watch the tail on the plot stretch exactly as far as what you hear.
                    </Prose>
                    <div className="mt-5 flex flex-wrap items-start gap-6">
                        <EnvelopePlot params={params} />
                        <div className="min-w-[220px] max-w-xs flex-1">
                            <LabSlider label="Decay time (RT60)" min={0.2} max={5} step={0.1} value={params.rt60S} onChange={set('rt60S')} format={(v) => `${v.toFixed(1)} s`} />
                        </div>
                    </div>
                    <ListenFor>
                        at 0.3 s the room is a cupboard — the tail is gone before the next hit; at 4 s the snare is still
                        ringing when the synth stab arrives, and the phrase starts to smear.
                    </ListenFor>
                </Movement>

                <Movement number="3" title="Pre-delay — the gap before the room answers">
                    <Prose>
                        Pre-delay holds the tail back for a few milliseconds after the dry sound. It is the mix
                        engineer&rsquo;s trick for keeping a vocal intelligible inside a big reverb: the word lands clean,
                        THEN the room blooms behind it. On the plot it is the flat gap between the dry hit and the tail.
                    </Prose>
                    <div className="mt-5 flex flex-wrap items-start gap-6">
                        <EnvelopePlot params={params} />
                        <div className="min-w-[220px] max-w-xs flex-1">
                            <LabSlider label="Pre-delay" min={0} max={120} step={5} value={params.preDelayMs} onChange={set('preDelayMs')} format={(v) => `${v} ms`} />
                        </div>
                    </div>
                    <ListenFor>
                        at 0 ms the hit and its tail arrive as one sound; by 80 ms you can hear the room answer a beat
                        late — the click stays crisp, the wash arrives behind it.
                    </ListenFor>
                </Movement>

                <Movement number="4" title="Amount — how far away the music sits">
                    <Prose>
                        Wet/dry is the balance between the source and the room, and the ear reads it as distance: drier is
                        closer, wetter is further away. The crossfade here is equal-power, so the overall loudness stays
                        put while the position moves — what changes is where the phrase seems to BE.
                    </Prose>
                    <div className="mt-4 max-w-md">
                        <LabSlider label="Amount (wet/dry)" min={0} max={1} step={0.05} value={params.mix} onChange={set('mix')} format={(v) => `${Math.round(v * 100)}% wet`} />
                    </div>
                    <ListenFor>
                        10% wet: the phrase is in the room with you · 70% wet: it has moved to the far end of the hall,
                        and detail starts to drown.
                    </ListenFor>
                </Movement>

                <Movement number="5" title="Gated reverb — the tail, cut dead">
                    <Prose>
                        Put a noise gate after a big reverb and the tail is chopped off the instant it falls below the
                        gate&rsquo;s threshold — an explosive burst of room that stops dead. The classic 1980s snare
                        sound. On the plot, the gate simply amputates the tail at the hold line.
                    </Prose>
                    <div className="mt-5 flex flex-wrap items-start gap-6">
                        <EnvelopePlot params={params} />
                        <div className="min-w-[220px] max-w-xs flex-1 space-y-4">
                            <button
                                type="button"
                                onClick={() => update({ ...params, gated: !params.gated, rt60S: params.gated ? params.rt60S : Math.max(params.rt60S, 2.5) })}
                                aria-pressed={params.gated}
                                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${params.gated ? 'border-ink bg-ink text-cream' : 'border-line bg-paper text-ink/70'}`}
                            >
                                {params.gated ? 'Gate: in (tail truncated)' : 'Gate: out'}
                            </button>
                            {params.gated && (
                                <LabSlider label="Gate hold" min={0.08} max={0.5} step={0.02} value={params.gateHoldS} onChange={set('gateHoldS')} format={(v) => `${Math.round(v * 1000)} ms`} />
                            )}
                        </div>
                    </div>
                    <ListenFor>
                        gate in: the snare throws a huge splash of room that cuts to silence mid-bloom — no natural
                        fade-out at all.
                    </ListenFor>
                    <Callout type="tip" title="This exact setup defeated a whole cohort">
                        The 2020 paper asked candidates to build a side-chained gated reverb on an aux send — the
                        Principal Examiner noted that only one of the 22 candidates scored the full 6 marks. And the 2022
                        paper&rsquo;s piano-timbre question flagged &ldquo;reverb vs compression confusion&rdquo;: reverb
                        ADDS a tail in time; compression reshapes LEVEL. If you can hear this movement, you cannot mix
                        those two up.
                    </Callout>
                </Movement>

                <Movement number="6" title="The ear bench — match three hidden rooms">
                    <Prose>
                        Production questions do not show you the settings — they play you the sound. Three rooms follow,
                        each with its parameters hidden. Match them by ear; each is marked per dimension, so you learn
                        WHICH aspect of a space you mishear.
                    </Prose>
                    <EarBench audio={audio} />
                </Movement>

                <Movement number="7" title="The sandbox — every control at once">
                    <Prose>Worth building deliberately, now that each control is yours:</Prose>
                    <ul className="mt-3 max-w-[65ch] list-disc space-y-2 pl-5 text-base leading-relaxed text-ink/75">
                        <li>
                            <span className="font-semibold text-ink/90">A vocal plate:</span> decay 1.8 s, pre-delay
                            60&ndash;80 ms, 30% wet — the word stays clear, the bloom follows.
                        </li>
                        <li>
                            <span className="font-semibold text-ink/90">A drum room:</span> decay 0.5 s, no pre-delay,
                            20% wet — glue, not wash.
                        </li>
                        <li>
                            <span className="font-semibold text-ink/90">The 1980s snare:</span> decay 3 s+, gate in, hold
                            ~180 ms, 50% wet — enormous and then instantly gone.
                        </li>
                    </ul>
                    <div className="mt-6 rounded-2xl border border-line bg-cream/60 p-5">
                        <p className={`${MONO} text-xs uppercase tracking-wide text-sienna-600`}>What you can now write</p>
                        <ul className="mt-2 max-w-[65ch] space-y-2 text-sm leading-relaxed text-ink/80">
                            <li>
                                &ldquo;A 60 ms pre-delay separates the dry vocal from the onset of the reverb tail, keeping
                                the lyric intelligible inside a 2-second decay.&rdquo;
                            </li>
                            <li>
                                &ldquo;The long decay time is unsuitable here: the tail of each snare hit masks the
                                following hit, smearing the rhythm.&rdquo;
                            </li>
                            <li>
                                &ldquo;Gating the reverb truncates the tail below the threshold, producing the abrupt
                                cut-off characteristic of 1980s drum production.&rdquo;
                            </li>
                        </ul>
                        <p className="mt-3 text-sm leading-relaxed text-ink/60">
                            Each names a setting, a consequence and a judgement about suitability — the three things the
                            20-markers reward.
                        </p>
                    </div>
                    <p className="mt-6 text-base leading-relaxed text-ink/75">
                        When the three dimensions feel obvious,{' '}
                        <a href="/revise/reverb" className="font-semibold text-field-700 underline decoration-field-500/40 underline-offset-2 hover:decoration-field-500">
                            take the reverb revision quiz
                        </a>
                        .
                    </p>
                </Movement>
            </div>
        </div>
    );
}
