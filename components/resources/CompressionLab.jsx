'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Callout from '@/components/Callout';
import {
    computeOutputDb,
    gainReductionDb,
    curvePoints,
    scoreDrawnCurve,
    CURVE_QUESTION_MARKS,
} from '@/lib/compression/engine';

// ═══════════════════════════════════════════════════════════════════════════
// The Compression Lab — 1.9 Dynamic Processing
//
// One live compressor, taught the way the professional field teaches
// (isolate each parameter alone, combine only at the end, sandbox as the
// payoff), anchored to the written paper throughout. The maths lives in
// lib/compression/engine.js — the SVG curve, the live meter dot and the
// drawing bench's marking all read from the same functions.
// ═══════════════════════════════════════════════════════════════════════════

const FRAUNCES = 'font-[family-name:var(--font-fraunces)]';
const MONO = 'font-[family-name:var(--font-jbmono)]';
const CARD_SHADOW = 'shadow-[0_1px_0_rgba(43,36,24,0.04),0_18px_40px_-24px_rgba(43,36,24,0.22)]';

// One colour language across every diagram in this lab (and deliberately
// matching the transfer-curve conventions used elsewhere on the site):
// ink = the signal / the student's own line · sienna = the true curve and
// gain reduction · field = thresholds and "correct" states.
const INK = '#1F2A1C';
const SIENNA = '#A0522D';
const FIELD = '#3A4A35';
const CREAM = '#F2EBE0';
const PAPER = '#F8F2E8';
const LINE = 'rgba(43,36,24,0.18)';

// ─── dB ↔ pixel mapping shared by the curve and the bench ───────────────────

const DB_MIN = -60;
const DB_MAX = 0;
const PLOT = { x0: 44, y0: 12, w: 256, h: 256 }; // inner plot box in a 320×320 viewBox

function dbToX(db) {
    return PLOT.x0 + ((db - DB_MIN) / (DB_MAX - DB_MIN)) * PLOT.w;
}
function dbToY(db) {
    return PLOT.y0 + PLOT.h - ((db - DB_MIN) / (DB_MAX - DB_MIN)) * PLOT.h;
}
function yToDb(y) {
    const db = DB_MIN + ((PLOT.y0 + PLOT.h - y) / PLOT.h) * (DB_MAX - DB_MIN);
    return Math.max(DB_MIN, Math.min(DB_MAX, db));
}
function xToDb(x) {
    const db = DB_MIN + ((x - PLOT.x0) / PLOT.w) * (DB_MAX - DB_MIN);
    return Math.max(DB_MIN, Math.min(DB_MAX, db));
}

function curvePath(params) {
    return curvePoints(params, DB_MIN, DB_MAX, 1)
        .map((p, i) => `${i === 0 ? 'M' : 'L'}${dbToX(p.inDb).toFixed(1)},${dbToY(p.outDb).toFixed(1)}`)
        .join(' ');
}

// ─── The audio engine ───────────────────────────────────────────────────────
// A short two-bar groove with DELIBERATELY wild dynamics — ghost snares at a
// quarter of the accent level, a sustained bass under everything — so the
// compressor has something audible to do. All synthesised on the fly: no
// samples, nothing to license, nothing to download.

const BPM = 96;
const STEPS = 32; // two bars of 16ths
const STEP_S = 60 / BPM / 4;

// velocity per 16th step (0 = silent)
const KICK = [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0.6, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0.7, 0, 1, 0, 0, 0, 0, 0, 0, 0];
const SNARE = [0, 0, 0, 0.22, 1, 0, 0, 0.25, 0, 0.2, 0, 0, 1, 0, 0, 0.3, 0, 0, 0.22, 0, 1, 0, 0.25, 0, 0, 0, 0, 0, 1, 0, 0.35, 0.5];
const HAT = [0.7, 0, 0.4, 0, 0.8, 0, 0.4, 0, 0.7, 0, 0.4, 0.3, 0.8, 0, 0.4, 0, 0.7, 0, 0.4, 0, 0.8, 0, 0.4, 0, 0.7, 0.3, 0.4, 0, 0.8, 0, 0.5, 0];
// bass: step index → midi-ish frequency, sustained a quaver each
const BASS = { 0: 55, 6: 55, 8: 65.4, 14: 49, 16: 55, 22: 55, 24: 43.7, 30: 49 };

function useCompressionAudio() {
    const ctxRef = useRef(null);
    const nodesRef = useRef(null);
    const schedRef = useRef(null);
    const stepRef = useRef(0);
    const nextTimeRef = useRef(0);
    const meterRef = useRef({ inDb: -60, outDb: -60, grDb: 0 });
    const [running, setRunning] = useState(false);
    const [bypassed, setBypassed] = useState(false);

    const buildGraph = useCallback((ctx) => {
        const input = ctx.createGain();
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -24;
        comp.ratio.value = 4;
        comp.knee.value = 0;
        comp.attack.value = 0.01;
        comp.release.value = 0.18;
        const makeup = ctx.createGain();
        const wet = ctx.createGain();
        const dry = ctx.createGain();
        dry.gain.value = 0;
        const master = ctx.createGain();
        master.gain.value = 0.7;

        const inMeter = ctx.createAnalyser();
        inMeter.fftSize = 1024;
        const outMeter = ctx.createAnalyser();
        outMeter.fftSize = 1024;

        // A silent, always-on source keeps the gain nodes "hot": Chromium
        // reads stale gain automation on nodes fed only by one-shot
        // buffer sources between triggers.
        const keepAlive = ctx.createConstantSource();
        keepAlive.offset.value = 0;
        keepAlive.connect(input);
        keepAlive.start();

        input.connect(inMeter);
        input.connect(comp);
        comp.connect(makeup);
        makeup.connect(wet);
        input.connect(dry);
        wet.connect(master);
        dry.connect(master);
        makeup.connect(outMeter);
        master.connect(ctx.destination);

        // shared noise buffer for snare + hats
        const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
        const nd = noiseBuf.getChannelData(0);
        for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

        return { input, comp, makeup, wet, dry, master, inMeter, outMeter, noiseBuf, keepAlive };
    }, []);

    const scheduleStep = useCallback((step, t) => {
        const ctx = ctxRef.current;
        const n = nodesRef.current;
        if (!ctx || !n) return;

        const kv = KICK[step];
        if (kv) {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.exponentialRampToValueAtTime(46, t + 0.11);
            g.gain.setValueAtTime(kv * 0.95, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
            osc.connect(g).connect(n.input);
            osc.start(t);
            osc.stop(t + 0.26);
        }
        const sv = SNARE[step];
        if (sv) {
            const src = ctx.createBufferSource();
            src.buffer = n.noiseBuf;
            const bp = ctx.createBiquadFilter();
            bp.type = 'bandpass';
            bp.frequency.value = 1900;
            bp.Q.value = 0.8;
            const g = ctx.createGain();
            g.gain.setValueAtTime(sv * 0.8, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
            src.connect(bp).connect(g).connect(n.input);
            src.start(t, 0.05);
            src.stop(t + 0.18);
            const body = ctx.createOscillator();
            const bg = ctx.createGain();
            body.type = 'triangle';
            body.frequency.value = 196;
            bg.gain.setValueAtTime(sv * 0.35, t);
            bg.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
            body.connect(bg).connect(n.input);
            body.start(t);
            body.stop(t + 0.1);
        }
        const hv = HAT[step];
        if (hv) {
            const src = ctx.createBufferSource();
            src.buffer = n.noiseBuf;
            const hp = ctx.createBiquadFilter();
            hp.type = 'highpass';
            hp.frequency.value = 7200;
            const g = ctx.createGain();
            g.gain.setValueAtTime(hv * 0.22, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
            src.connect(hp).connect(g).connect(n.input);
            src.start(t, 0.21);
            src.stop(t + 0.06);
        }
        const bf = BASS[step];
        if (bf) {
            const osc = ctx.createOscillator();
            const lp = ctx.createBiquadFilter();
            lp.type = 'lowpass';
            lp.frequency.value = 500;
            const g = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = bf;
            const len = STEP_S * 2 * 0.92;
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(0.5, t + 0.02);
            g.gain.setValueAtTime(0.5, t + len - 0.06);
            g.gain.exponentialRampToValueAtTime(0.001, t + len);
            osc.connect(lp).connect(g).connect(n.input);
            osc.start(t);
            osc.stop(t + len + 0.02);
        }
    }, []);

    const start = useCallback(() => {
        if (running) return;
        let ctx = ctxRef.current;
        if (!ctx) {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            ctxRef.current = ctx;
            nodesRef.current = buildGraph(ctx);
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
    }, [running, buildGraph, scheduleStep]);

    const stop = useCallback(() => {
        if (schedRef.current) clearInterval(schedRef.current);
        schedRef.current = null;
        if (ctxRef.current && ctxRef.current.state === 'running') ctxRef.current.suspend();
        setRunning(false);
    }, []);

    const setBypass = useCallback((by) => {
        const n = nodesRef.current;
        const ctx = ctxRef.current;
        setBypassed(by);
        if (!n || !ctx) return;
        const t = ctx.currentTime;
        n.wet.gain.setTargetAtTime(by ? 0 : 1, t, 0.02);
        n.dry.gain.setTargetAtTime(by ? 1 : 0, t, 0.02);
    }, []);

    const setParams = useCallback((p) => {
        const n = nodesRef.current;
        const ctx = ctxRef.current;
        if (!n || !ctx) return;
        const t = ctx.currentTime;
        if (p.thresholdDb !== undefined) n.comp.threshold.setTargetAtTime(p.thresholdDb, t, 0.02);
        if (p.ratio !== undefined) n.comp.ratio.setTargetAtTime(p.ratio, t, 0.02);
        if (p.kneeDb !== undefined) n.comp.knee.setTargetAtTime(p.kneeDb, t, 0.02);
        if (p.attackS !== undefined) n.comp.attack.setTargetAtTime(p.attackS, t, 0.02);
        if (p.releaseS !== undefined) n.comp.release.setTargetAtTime(p.releaseS, t, 0.02);
        if (p.makeupDb !== undefined) n.makeup.gain.setTargetAtTime(Math.pow(10, p.makeupDb / 20), t, 0.02);
    }, []);

    // meter polling — writes to a ref; canvases read it in their own rAF
    useEffect(() => {
        let raf;
        const inBuf = new Float32Array(1024);
        const outBuf = new Float32Array(1024);
        const smooth = { in: -60, out: -60 };
        const tick = () => {
            const n = nodesRef.current;
            if (n) {
                n.inMeter.getFloatTimeDomainData(inBuf);
                n.outMeter.getFloatTimeDomainData(outBuf);
                const rms = (b) => {
                    let s = 0;
                    for (let i = 0; i < b.length; i++) s += b[i] * b[i];
                    const r = Math.sqrt(s / b.length);
                    return r > 0.00001 ? Math.max(-60, 20 * Math.log10(r)) : -60;
                };
                const a = 0.25;
                smooth.in += (rms(inBuf) - smooth.in) * a;
                smooth.out += (rms(outBuf) - smooth.out) * a;
                meterRef.current = {
                    inDb: smooth.in,
                    outDb: smooth.out,
                    grDb: n.comp.reduction ? -n.comp.reduction : 0,
                };
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, []);

    // teardown
    useEffect(() => {
        return () => {
            if (schedRef.current) clearInterval(schedRef.current);
            if (ctxRef.current) ctxRef.current.close();
        };
    }, []);

    return { running, bypassed, start, stop, setBypass, setParams, meterRef };
}

// ─── Meter ribbon: input trace, output trace, gain-reduction band ──────────

function MeterRibbon({ meterRef, running, height = 130 }) {
    const canvasRef = useRef(null);
    const histRef = useRef([]);

    useEffect(() => {
        let raf;
        const draw = () => {
            const canvas = canvasRef.current;
            if (canvas) {
                const dpr = window.devicePixelRatio || 1;
                const W = canvas.clientWidth;
                const H = canvas.clientHeight;
                if (canvas.width !== W * dpr) {
                    canvas.width = W * dpr;
                    canvas.height = H * dpr;
                }
                const g = canvas.getContext('2d');
                g.setTransform(dpr, 0, 0, dpr, 0, 0);
                const hist = histRef.current;
                if (running) {
                    hist.push({ ...meterRef.current });
                    if (hist.length > 260) hist.shift();
                }
                g.fillStyle = PAPER;
                g.fillRect(0, 0, W, H);
                // dB gridlines at -12 / -24 / -36 / -48
                g.strokeStyle = LINE;
                g.lineWidth = 1;
                g.font = '9px monospace';
                g.fillStyle = 'rgba(31,42,28,0.45)';
                for (const db of [-12, -24, -36, -48]) {
                    const y = ((0 - db) / 60) * (H - 18);
                    g.beginPath();
                    g.moveTo(30, y);
                    g.lineTo(W, y);
                    g.stroke();
                    g.fillText(`${db}`, 4, y + 3);
                }
                const px = (i) => 30 + ((W - 30) * i) / 259;
                const py = (db) => ((0 - Math.max(-60, db)) / 60) * (H - 18);
                // input trace (light)
                g.strokeStyle = 'rgba(31,42,28,0.32)';
                g.lineWidth = 1.4;
                g.beginPath();
                hist.forEach((h, i) => (i === 0 ? g.moveTo(px(i), py(h.inDb)) : g.lineTo(px(i), py(h.inDb))));
                g.stroke();
                // output trace (ink)
                g.strokeStyle = INK;
                g.lineWidth = 1.8;
                g.beginPath();
                hist.forEach((h, i) => (i === 0 ? g.moveTo(px(i), py(h.outDb)) : g.lineTo(px(i), py(h.outDb))));
                g.stroke();
                // gain-reduction band along the bottom (sienna, downwards = more reduction)
                g.strokeStyle = SIENNA;
                g.lineWidth = 1.8;
                g.beginPath();
                hist.forEach((h, i) => {
                    const y = H - 16 + Math.min(14, (h.grDb / 20) * 14) * 1;
                    i === 0 ? g.moveTo(px(i), y) : g.lineTo(px(i), y);
                });
                g.stroke();
                g.fillStyle = 'rgba(160,82,45,0.85)';
                g.font = '9px monospace';
                g.fillText('gain reduction', 30, H - 2);
            }
            raf = requestAnimationFrame(draw);
        };
        raf = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(raf);
    }, [running, meterRef]);

    return (
        <div>
            <canvas ref={canvasRef} style={{ width: '100%', height }} className="rounded-xl border border-line" />
            <div className={`${MONO} mt-1.5 flex gap-4 text-[11px] text-ink/60`}>
                <span><span className="inline-block h-[2px] w-4 align-middle" style={{ background: 'rgba(31,42,28,0.32)' }} /> into the compressor</span>
                <span><span className="inline-block h-[2px] w-4 align-middle" style={{ background: INK }} /> out of it</span>
                <span><span className="inline-block h-[2px] w-4 align-middle" style={{ background: SIENNA }} /> how hard it is working</span>
            </div>
        </div>
    );
}

// ─── The transfer curve, draggable ─────────────────────────────────────────

function TransferCurve({ params, onChange, meterRef, running, interactive = true }) {
    const svgRef = useRef(null);
    const dotRef = useRef(null);
    const [drag, setDrag] = useState(null);

    // live dot rides the static curve at the current input level
    useEffect(() => {
        let raf;
        const tick = () => {
            const dot = dotRef.current;
            if (dot && running) {
                const inDb = meterRef.current.inDb;
                dot.setAttribute('cx', dbToX(inDb));
                dot.setAttribute('cy', dbToY(computeOutputDb(inDb, params)));
                dot.setAttribute('opacity', '1');
            } else if (dot) {
                dot.setAttribute('opacity', '0');
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [params, running, meterRef]);

    const svgPoint = (e) => {
        const svg = svgRef.current;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        return pt.matrixTransform(svg.getScreenCTM().inverse());
    };

    const handleMove = (e) => {
        if (!drag || !interactive) return;
        const p = svgPoint(e);
        if (drag === 'threshold') {
            const thr = Math.round(Math.max(-54, Math.min(-6, xToDb(p.x))));
            onChange({ ...params, thresholdDb: thr });
        } else if (drag === 'ratio') {
            // handle sits at input 0 dB; its height sets the ratio
            const outAtZero = Math.max(params.thresholdDb + 0.5, Math.min(0, yToDb(p.y)));
            const ratio = Math.min(20, Math.max(1, (0 - params.thresholdDb) / (outAtZero - params.thresholdDb)));
            onChange({ ...params, ratio: Math.round(ratio * 10) / 10 });
        }
    };

    const nudge = (which, e) => {
        const step = e.shiftKey ? 4 : 1;
        if (which === 'threshold' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
            e.preventDefault();
            const d = e.key === 'ArrowLeft' ? -step : step;
            onChange({ ...params, thresholdDb: Math.max(-54, Math.min(-6, params.thresholdDb + d)) });
        }
        if (which === 'ratio' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
            e.preventDefault();
            const d = e.key === 'ArrowUp' ? -0.5 : 0.5;
            onChange({ ...params, ratio: Math.min(20, Math.max(1, Math.round((params.ratio + d) * 10) / 10)) });
        }
    };

    const outAtZero = computeOutputDb(0, { ...params, makeupDb: 0 });
    const kneeY = dbToY(computeOutputDb(params.thresholdDb, { ...params, makeupDb: 0 }));

    return (
        <svg
            ref={svgRef}
            viewBox="0 0 320 320"
            className="w-full max-w-[340px] touch-none select-none"
            onPointerMove={handleMove}
            onPointerUp={() => setDrag(null)}
            onPointerLeave={() => setDrag(null)}
            role="img"
            aria-label={`Compressor transfer curve: threshold ${params.thresholdDb} dB, ratio ${params.ratio} to 1`}
        >
            <rect x="0" y="0" width="320" height="320" fill={PAPER} rx="14" />
            <rect x={PLOT.x0} y={PLOT.y0} width={PLOT.w} height={PLOT.h} fill={CREAM} stroke={LINE} />
            {[-48, -36, -24, -12].map((db) => (
                <g key={db}>
                    <line x1={dbToX(db)} y1={PLOT.y0} x2={dbToX(db)} y2={PLOT.y0 + PLOT.h} stroke={LINE} strokeDasharray="2 4" />
                    <line x1={PLOT.x0} y1={dbToY(db)} x2={PLOT.x0 + PLOT.w} y2={dbToY(db)} stroke={LINE} strokeDasharray="2 4" />
                    <text x={dbToX(db)} y={PLOT.y0 + PLOT.h + 14} textAnchor="middle" fontSize="9" fill={INK} opacity="0.55" fontFamily="monospace">{db}</text>
                    <text x={PLOT.x0 - 6} y={dbToY(db) + 3} textAnchor="end" fontSize="9" fill={INK} opacity="0.55" fontFamily="monospace">{db}</text>
                </g>
            ))}
            <text x={PLOT.x0 + PLOT.w / 2} y="314" textAnchor="middle" fontSize="10" fill={INK} opacity="0.7">input level (dB)</text>
            <text x="12" y={PLOT.y0 + PLOT.h / 2} textAnchor="middle" fontSize="10" fill={INK} opacity="0.7" transform={`rotate(-90 12 ${PLOT.y0 + PLOT.h / 2})`}>output level (dB)</text>

            {/* unity reference */}
            <line x1={dbToX(DB_MIN)} y1={dbToY(DB_MIN)} x2={dbToX(DB_MAX)} y2={dbToY(DB_MAX)} stroke={LINE} strokeDasharray="4 4" />
            {/* the curve itself */}
            <path d={curvePath({ ...params, makeupDb: 0 })} fill="none" stroke={INK} strokeWidth="2.4" />
            {params.makeupDb ? (
                <path d={curvePath(params)} fill="none" stroke={FIELD} strokeWidth="1.6" strokeDasharray="5 3" />
            ) : null}

            {/* threshold marker */}
            <line x1={dbToX(params.thresholdDb)} y1={PLOT.y0} x2={dbToX(params.thresholdDb)} y2={PLOT.y0 + PLOT.h} stroke={FIELD} strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />

            {/* live dot */}
            <circle ref={dotRef} r="5" fill={SIENNA} opacity="0" stroke={PAPER} strokeWidth="1.5" />

            {interactive && (
                <>
                    <circle
                        cx={dbToX(params.thresholdDb)}
                        cy={kneeY}
                        r="9"
                        fill={FIELD}
                        stroke={PAPER}
                        strokeWidth="2"
                        style={{ cursor: 'ew-resize' }}
                        tabIndex={0}
                        role="slider"
                        aria-label={`Threshold, ${params.thresholdDb} dB. Arrow keys to adjust.`}
                        aria-valuenow={params.thresholdDb}
                        aria-valuemin={-54}
                        aria-valuemax={-6}
                        onPointerDown={(e) => { e.target.setPointerCapture?.(e.pointerId); setDrag('threshold'); }}
                        onKeyDown={(e) => nudge('threshold', e)}
                    />
                    <text x={dbToX(params.thresholdDb)} y={kneeY - 14} textAnchor="middle" fontSize="9" fill={FIELD} fontFamily="monospace">threshold</text>
                    <circle
                        cx={dbToX(0)}
                        cy={dbToY(outAtZero)}
                        r="9"
                        fill={SIENNA}
                        stroke={PAPER}
                        strokeWidth="2"
                        style={{ cursor: 'ns-resize' }}
                        tabIndex={0}
                        role="slider"
                        aria-label={`Ratio, ${params.ratio} to 1. Up and down arrow keys to adjust.`}
                        aria-valuenow={params.ratio}
                        aria-valuemin={1}
                        aria-valuemax={20}
                        onPointerDown={(e) => { e.target.setPointerCapture?.(e.pointerId); setDrag('ratio'); }}
                        onKeyDown={(e) => nudge('ratio', e)}
                    />
                    <text x={dbToX(0) - 4} y={dbToY(outAtZero) - 14} textAnchor="end" fontSize="9" fill={SIENNA} fontFamily="monospace">{params.ratio.toFixed(1)}:1</text>
                </>
            )}
        </svg>
    );
}

// ─── Movement scaffolding ───────────────────────────────────────────────────

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

function LabSlider({ label, unit, min, max, step, value, onChange, format }) {
    return (
        <label className="block">
            <span className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-ink/80">{label}</span>
                <span className={`${MONO} text-sm text-ink`}>{format ? format(value) : `${value}${unit || ''}`}</span>
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
                {running ? 'Stop the groove' : startLabel}
            </button>
            <button
                type="button"
                onClick={() => onBypass(!bypassed)}
                aria-pressed={!bypassed}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${bypassed ? 'border-line bg-paper text-ink/70' : 'border-field-600 bg-field-100 text-field-700'}`}
            >
                {bypassed ? 'Compressor: bypassed' : 'Compressor: in'}
            </button>
        </div>
    );
}

// ─── The drawing bench ─────────────────────────────────────────────────────

const BENCH_PROMPTS = [
    { thresholdDb: -24, ratio: 4, kneeDb: 0, ask: 'threshold −24 dB, ratio 4:1, hard knee' },
    { thresholdDb: -30, ratio: 8, kneeDb: 0, ask: 'threshold −30 dB, ratio 8:1, hard knee' },
    { thresholdDb: -18, ratio: 2, kneeDb: 0, ask: 'threshold −18 dB, ratio 2:1, hard knee' },
    { thresholdDb: -36, ratio: 12, kneeDb: 0, ask: 'threshold −36 dB, ratio 12:1 — close to limiting' },
];

const BENCH_XS = [-60, -48, -36, -24, -12, -6, 0];

function DrawBench() {
    const svgRef = useRef(null);
    const [promptIx, setPromptIx] = useState(0);
    const [handles, setHandles] = useState(BENCH_XS.map((x) => ({ inDb: x, outDb: x })));
    const [dragIx, setDragIx] = useState(null);
    const [result, setResult] = useState(null);
    const prompt = BENCH_PROMPTS[promptIx];

    const svgPoint = (e) => {
        const svg = svgRef.current;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        return pt.matrixTransform(svg.getScreenCTM().inverse());
    };

    const move = (e) => {
        if (dragIx === null || result) return;
        const p = svgPoint(e);
        const outDb = Math.round(yToDb(p.y) * 2) / 2;
        setHandles((hs) => hs.map((h, i) => (i === dragIx ? { ...h, outDb } : h)));
    };

    const nudgeHandle = (i, e) => {
        if (result) return;
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
        e.preventDefault();
        const d = (e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 4 : 1);
        setHandles((hs) => hs.map((h, ix) => (ix === i ? { ...h, outDb: Math.max(DB_MIN, Math.min(DB_MAX, h.outDb + d)) } : h)));
    };

    const reveal = () => setResult(scoreDrawnCurve(handles, prompt));
    const reset = (nextIx = promptIx) => {
        setPromptIx(nextIx);
        setHandles(BENCH_XS.map((x) => ({ inDb: x, outDb: x })));
        setResult(null);
    };

    const drawnPath = handles.map((h, i) => `${i === 0 ? 'M' : 'L'}${dbToX(h.inDb).toFixed(1)},${dbToY(h.outDb).toFixed(1)}`).join(' ');

    return (
        <div className={`mt-5 rounded-2xl border border-line bg-paper p-5 ${CARD_SHADOW}`}>
            <p className="text-sm leading-relaxed text-ink/80">
                <span className="font-semibold text-ink">Sketch the transfer curve</span> for a compressor set to{' '}
                <span className={`${MONO} text-ink`}>{prompt.ask}</span>. Drag the seven handles (or focus one and use the
                arrow keys), then reveal the real curve over your attempt.
            </p>
            <div className="mt-4 flex flex-wrap items-start gap-6">
                <svg
                    ref={svgRef}
                    viewBox="0 0 320 320"
                    className="w-full max-w-[340px] touch-none select-none"
                    onPointerMove={move}
                    onPointerUp={() => setDragIx(null)}
                    onPointerLeave={() => setDragIx(null)}
                    role="img"
                    aria-label="Drawing area: output level against input level, both from minus sixty to zero dB"
                >
                    <rect x="0" y="0" width="320" height="320" fill={PAPER} rx="14" />
                    <rect x={PLOT.x0} y={PLOT.y0} width={PLOT.w} height={PLOT.h} fill={CREAM} stroke={LINE} />
                    {[-48, -36, -24, -12].map((db) => (
                        <g key={db}>
                            <line x1={dbToX(db)} y1={PLOT.y0} x2={dbToX(db)} y2={PLOT.y0 + PLOT.h} stroke={LINE} strokeDasharray="2 4" />
                            <line x1={PLOT.x0} y1={dbToY(db)} x2={PLOT.x0 + PLOT.w} y2={dbToY(db)} stroke={LINE} strokeDasharray="2 4" />
                            <text x={dbToX(db)} y={PLOT.y0 + PLOT.h + 14} textAnchor="middle" fontSize="9" fill={INK} opacity="0.55" fontFamily="monospace">{db}</text>
                            <text x={PLOT.x0 - 6} y={dbToY(db) + 3} textAnchor="end" fontSize="9" fill={INK} opacity="0.55" fontFamily="monospace">{db}</text>
                        </g>
                    ))}
                    <text x={PLOT.x0 + PLOT.w / 2} y="314" textAnchor="middle" fontSize="10" fill={INK} opacity="0.7">input level (dB)</text>
                    <text x="12" y={PLOT.y0 + PLOT.h / 2} textAnchor="middle" fontSize="10" fill={INK} opacity="0.7" transform={`rotate(-90 12 ${PLOT.y0 + PLOT.h / 2})`}>output level (dB)</text>
                    <line x1={dbToX(DB_MIN)} y1={dbToY(DB_MIN)} x2={dbToX(DB_MAX)} y2={dbToY(DB_MAX)} stroke={LINE} strokeDasharray="4 4" />

                    {/* student's line */}
                    <path d={drawnPath} fill="none" stroke={INK} strokeWidth="2.2" />
                    {handles.map((h, i) => (
                        <circle
                            key={h.inDb}
                            cx={dbToX(h.inDb)}
                            cy={dbToY(h.outDb)}
                            r="8"
                            fill={result ? 'rgba(31,42,28,0.35)' : INK}
                            stroke={PAPER}
                            strokeWidth="2"
                            style={{ cursor: result ? 'default' : 'ns-resize' }}
                            tabIndex={result ? -1 : 0}
                            role="slider"
                            aria-label={`Output at ${h.inDb} dB input: ${h.outDb} dB. Up and down arrows to adjust.`}
                            aria-valuenow={h.outDb}
                            aria-valuemin={DB_MIN}
                            aria-valuemax={DB_MAX}
                            onPointerDown={(e) => { if (!result) { e.target.setPointerCapture?.(e.pointerId); setDragIx(i); } }}
                            onKeyDown={(e) => nudgeHandle(i, e)}
                        />
                    ))}

                    {/* true curve, on reveal */}
                    {result && <path d={curvePath(prompt)} fill="none" stroke={SIENNA} strokeWidth="2.6" strokeDasharray="6 3" />}
                </svg>

                <div className="min-w-[220px] flex-1">
                    {!result ? (
                        <button
                            type="button"
                            onClick={reveal}
                            className="rounded-full bg-field-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-field-700"
                        >
                            Reveal the real curve
                        </button>
                    ) : (
                        <div>
                            <p className={`${FRAUNCES} text-2xl text-ink`}>
                                {result.marks}/{CURVE_QUESTION_MARKS}
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
                            <p className={`${MONO} mt-3 text-[11px] text-ink/50`}>
                                Your line sits {result.meanAbsDb.toFixed(1)} dB from the true curve on average. The dashed
                                sienna line is the answer.
                            </p>
                            <div className="mt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => reset((promptIx + 1) % BENCH_PROMPTS.length)}
                                    className="rounded-full bg-field-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-field-700"
                                >
                                    Try another setting
                                </button>
                                <button
                                    type="button"
                                    onClick={() => reset(promptIx)}
                                    className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink/70"
                                >
                                    Redraw this one
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Gate vs compressor misconception check ────────────────────────────────

function MiniCurve({ kind }) {
    // compressor: unity below threshold, reduced slope above.
    // gate: silence (floor) below threshold, unity above.
    const path =
        kind === 'compressor'
            ? `M${dbToX(-60)},${dbToY(-60)} L${dbToX(-24)},${dbToY(-24)} L${dbToX(0)},${dbToY(-18)}`
            : `M${dbToX(-60)},${dbToY(-59.5)} L${dbToX(-24.01)},${dbToY(-59.5)} L${dbToX(-24)},${dbToY(-24)} L${dbToX(0)},${dbToY(0)}`;
    return (
        <svg viewBox="0 0 320 320" className="w-full max-w-[180px]">
            <rect x="0" y="0" width="320" height="320" fill={PAPER} rx="14" />
            <rect x={PLOT.x0} y={PLOT.y0} width={PLOT.w} height={PLOT.h} fill={CREAM} stroke={LINE} />
            <line x1={dbToX(DB_MIN)} y1={dbToY(DB_MIN)} x2={dbToX(DB_MAX)} y2={dbToY(DB_MAX)} stroke={LINE} strokeDasharray="4 4" />
            <line x1={dbToX(-24)} y1={PLOT.y0} x2={dbToX(-24)} y2={PLOT.y0 + PLOT.h} stroke={FIELD} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
            <path d={path} fill="none" stroke={INK} strokeWidth="2.6" />
        </svg>
    );
}

function GateVsCompressor() {
    const [choice, setChoice] = useState(null);
    return (
        <div className={`mt-5 rounded-2xl border border-line bg-paper p-5 ${CARD_SHADOW}`}>
            <p className="text-sm leading-relaxed text-ink/80">
                <span className="font-semibold text-ink">One of these curves is a compressor. The other is a noise gate.</span>{' '}
                Both have their threshold at −24 dB. Which is the gate?
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4">
                {['A', 'B'].map((label, i) => {
                    const kind = i === 0 ? 'compressor' : 'gate';
                    const isGate = kind === 'gate';
                    const chosen = choice === label;
                    return (
                        <button
                            key={label}
                            type="button"
                            onClick={() => setChoice(label)}
                            className={`rounded-xl border p-3 text-left transition-colors ${
                                chosen ? (isGate ? 'border-field-600 bg-field-100' : 'border-sienna-600 bg-sienna-100') : 'border-line hover:border-ink/40'
                            }`}
                        >
                            <span className={`${MONO} text-xs font-semibold text-ink/70`}>Curve {label}</span>
                            <MiniCurve kind={kind} />
                        </button>
                    );
                })}
            </div>
            {choice && (
                <p className="mt-4 max-w-[65ch] text-sm leading-relaxed text-ink/80">
                    {choice === 'B' ? (
                        <>
                            <span className="font-semibold text-field-700">Right — B is the gate.</span> Below its threshold a gate
                            shuts the signal off entirely (the flat floor on the left); above it, the signal passes untouched at
                            1:1. A compressor is the opposite way round: it leaves quiet material alone and turns the LOUD
                            material down.
                        </>
                    ) : (
                        <>
                            <span className="font-semibold text-sienna-700">A is the compressor.</span> It leaves everything below
                            the threshold untouched and reduces only what goes over. The gate is B: silence below the
                            threshold, unity above. They are mirror images of intent — the gate acts on quiet material, the
                            compressor on loud.
                        </>
                    )}
                </p>
            )}
        </div>
    );
}

// ─── Hero ───────────────────────────────────────────────────────────────────
// A functional motif, not decoration: the left waveform is the groove's
// actual velocity pattern, and the right waveform is the SAME pattern passed
// through lib/compression/engine.js at −24 dB / 4:1. The hero literally
// cannot disagree with the lab below it. Deterministic (no randomness), so
// the server and client render identical markup.

const HERO_PARAMS = { thresholdDb: -24, ratio: 3, kneeDb: 6 };
const HERO_BARS = [0.22, 1, 0.3, 0.55, 0.25, 0.95, 0.2, 0.45, 1, 0.28, 0.6, 0.22, 0.9, 0.35, 0.5, 1];
const heroDb = (v) => 20 * Math.log10(Math.max(0.02, v));
const heroH = (db) => Math.max(3, ((db + 60) / 60) * 46);
const HERO_OUT = HERO_BARS.map((v) => heroH(computeOutputDb(heroDb(v), HERO_PARAMS) + 6)); // +6 dB make-up
const HERO_IN = HERO_BARS.map((v) => heroH(heroDb(v)));

function Hero() {
    return (
        <div
            className="relative overflow-hidden"
            style={{
                background: 'linear-gradient(160deg, #24301F 0%, #1F2A1C 45%, #1A241A 100%)',
            }}
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
                        C4 · 1.9 Dynamic Processing · a lab
                    </p>
                    <h1 className={`${FRAUNCES} mt-2 text-4xl font-medium text-[#F2EBE0] sm:text-[2.75rem] sm:leading-tight`}>
                        The Compression Lab
                    </h1>
                    <p className="mt-3 text-base leading-relaxed text-[#F2EBE0]/75">
                        One real compressor on a live drum groove. Take its controls one at a time, drag the transfer
                        curve itself, then draw it the way the written paper asks.
                    </p>
                </div>
                <svg
                    viewBox="0 0 300 120"
                    className="w-full max-w-[320px] shrink-0"
                    role="img"
                    aria-label="An uneven waveform entering a compressor and leaving evened out"
                >
                    {HERO_IN.map((h, i) => (
                        <rect key={`in${i}`} x={4 + i * 7} y={92 - h} width="4.4" height={h} rx="2" fill="#F2EBE0" opacity={0.34 + HERO_BARS[i] * 0.5} />
                    ))}
                    {/* the curve between the two: the lab's actual transfer shape */}
                    <g transform="translate(126,26)">
                        <rect x="0" y="0" width="48" height="48" rx="9" fill="rgba(242,235,224,0.08)" stroke="rgba(242,235,224,0.25)" />
                        <path
                            d={curvePoints(HERO_PARAMS, -60, 0, 4)
                                .map((p, i) => `${i === 0 ? 'M' : 'L'}${(6 + ((p.inDb + 60) / 60) * 36).toFixed(1)},${(42 - ((p.outDb + 60) / 60) * 36).toFixed(1)}`)
                                .join(' ')}
                            fill="none"
                            stroke="#DCC892"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                        />
                    </g>
                    {HERO_OUT.map((h, i) => (
                        <rect key={`out${i}`} x={186 + i * 7} y={92 - h} width="4.4" height={h} rx="2" fill="#DCC892" opacity={0.5 + HERO_BARS[i] * 0.35} />
                    ))}
                    <text x="4" y="112" fontSize="9" fill="rgba(242,235,224,0.55)" fontFamily="monospace">in — wild dynamics</text>
                    <text x="186" y="112" fontSize="9" fill="rgba(220,200,146,0.75)" fontFamily="monospace">out — under control</text>
                </svg>
            </div>
        </div>
    );
}

// ─── The page ───────────────────────────────────────────────────────────────

const DEFAULTS = { thresholdDb: -24, ratio: 4, kneeDb: 0, attackS: 0.01, releaseS: 0.18, makeupDb: 0 };

export default function CompressionLab() {
    const audio = useCompressionAudio();
    const [params, setParamsState] = useState(DEFAULTS);

    const update = useCallback(
        (next) => {
            setParamsState(next);
            audio.setParams(next);
        },
        [audio],
    );

    const set = (key) => (value) => update({ ...params, [key]: value });

    return (
        <div className="min-h-screen bg-cream">
            <Hero />
            <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
            {/* ── intro ── */}
            <section className="pt-8">
                <Prose>
                    Compression is the most-used process on the paper after EQ — and the one examiners keep saying
                    candidates describe rather than understand. This lab is one real compressor running on a live drum
                    groove. You will take its controls one at a time, then draw its behaviour the way the written paper
                    asks you to.
                </Prose>
                <Callout type="tip" title="Why applying beats reciting">
                    From the Principal Examiner&rsquo;s report on the 2022 paper (bass-pedal signal chain, 20 marks):
                    &ldquo;There were cases where candidates wrote a whole page about compression and scored 1 mark for
                    &lsquo;reduces dynamic range&rsquo; because they were not applying their revision to the specific
                    scenario.&rdquo; Every movement below ends with something you can <em>apply</em>.
                </Callout>
            </section>

            {/* ── movement 1: hear it ── */}
            <Movement number="1" title="Hear what the problem is">
                <Prose>
                    This groove is deliberately uneven: the snare&rsquo;s accents are around four times the level of its
                    ghost notes, and the bass sits underneath everything. Play it dry first. Then switch the compressor in
                    and listen to what happens to the gap between loudest and quietest.
                </Prose>
                <PlayBar
                    running={audio.running}
                    bypassed={audio.bypassed}
                    onStart={audio.start}
                    onStop={audio.stop}
                    onBypass={audio.setBypass}
                    startLabel="Play the drum groove"
                />
                <ListenFor>
                    dry: ghost notes almost vanish behind the accents · compressed: the quiet hits step forward, the
                    accents stop jumping out, the whole groove sits at a steadier level.
                </ListenFor>
                <div className="mt-4">
                    <MeterRibbon meterRef={audio.meterRef} running={audio.running} />
                </div>
            </Movement>

            {/* ── movement 2: threshold ── */}
            <Movement number="2" title="Threshold — where the compressor starts caring">
                <Prose>
                    The threshold is a level, in dB. Signal below it passes untouched; signal above it gets turned down.
                    Only this one control is live here. Drag it down into the groove and watch the sienna
                    gain-reduction band on the ribbon: nothing happens until peaks start crossing the line.
                </Prose>
                <div className="mt-4 max-w-md">
                    <LabSlider
                        label="Threshold"
                        min={-54}
                        max={-6}
                        step={1}
                        value={params.thresholdDb}
                        onChange={set('thresholdDb')}
                        format={(v) => `${v} dB`}
                    />
                </div>
                <ListenFor>
                    with the threshold high (−6 dB) almost nothing changes; as you pull it down past the accents&rsquo;
                    level the loud hits soften first — the ghosts only get caught when the threshold drops below them too.
                </ListenFor>
            </Movement>

            {/* ── movement 3: ratio ── */}
            <Movement number="3" title="Ratio — how hard it turns loud things down">
                <Prose>
                    Ratio is written as in:out. At 4:1, every 4 dB the signal rises above the threshold comes out as just
                    1 dB. At 1:1 the compressor does nothing at all; past about 10:1 it is behaving as a limiter — a
                    ceiling rather than a slope. Threshold is parked at {params.thresholdDb} dB from movement 2.
                </Prose>
                <div className="mt-4 max-w-md">
                    <LabSlider
                        label="Ratio"
                        min={1}
                        max={20}
                        step={0.5}
                        value={params.ratio}
                        onChange={set('ratio')}
                        format={(v) => `${v}:1`}
                    />
                </div>
                <ListenFor>
                    2:1 is gentle glue; 8:1 flattens the snare accents into the groove; 20:1 nails everything to one
                    level — listen to how the bass stops breathing.
                </ListenFor>
            </Movement>

            {/* ── movement 4: attack & release ── */}
            <Movement number="4" title="Attack and release — how fast it reacts">
                <Prose>
                    Attack is how quickly the compressor clamps down once the signal crosses the threshold; release is how
                    quickly it lets go afterwards. Fast attack catches the drum transients themselves and dulls the punch.
                    Short release makes the level surge back between hits — the audible &ldquo;pumping&rdquo; the paper
                    expects you to recognise.
                </Prose>
                <div className="mt-4 grid max-w-md gap-4">
                    <LabSlider
                        label="Attack"
                        min={0.001}
                        max={0.1}
                        step={0.001}
                        value={params.attackS}
                        onChange={set('attackS')}
                        format={(v) => `${Math.round(v * 1000)} ms`}
                    />
                    <LabSlider
                        label="Release"
                        min={0.04}
                        max={1}
                        step={0.01}
                        value={params.releaseS}
                        onChange={set('releaseS')}
                        format={(v) => `${Math.round(v * 1000)} ms`}
                    />
                </div>
                <ListenFor>
                    attack at 1 ms: the kick loses its click. Attack at 60 ms: the click gets through before the clamp.
                    Release at 40 ms with a low threshold: the whole groove pumps in time with the kick.
                </ListenFor>
                <Callout type="tip" title="The 2025 paper asked exactly this">
                    Question 2 of the 2025 paper asked how a bass note&rsquo;s amplitude envelope changes when its release
                    time is altered — the same cause-and-effect you are hearing now, asked about a synth envelope instead
                    of a compressor. Time-behaviour questions recur; be the candidate who has heard it, not memorised it.
                </Callout>
            </Movement>

            {/* ── movement 5: the curve ── */}
            <Movement number="5" title="The transfer curve — the whole compressor in one picture">
                <Prose>
                    Everything you have set so far lives on one diagram: input level along the bottom, output level up the
                    side. The 45° dashed line is &ldquo;no change&rdquo;. Drag the green handle to move the threshold; drag
                    the sienna handle at the right-hand edge to change the ratio. While the groove plays, the sienna dot is
                    the live signal riding your curve.
                </Prose>
                <div className="mt-5 flex flex-wrap items-start gap-6">
                    <TransferCurve params={params} onChange={update} meterRef={audio.meterRef} running={audio.running} />
                    <div className="min-w-[220px] max-w-xs flex-1 space-y-4">
                        <LabSlider
                            label="Soft knee"
                            min={0}
                            max={24}
                            step={1}
                            value={params.kneeDb}
                            onChange={set('kneeDb')}
                            format={(v) => (v === 0 ? 'hard (0 dB)' : `${v} dB wide`)}
                        />
                        <LabSlider
                            label="Make-up gain"
                            min={0}
                            max={12}
                            step={0.5}
                            value={params.makeupDb}
                            onChange={set('makeupDb')}
                            format={(v) => `+${v} dB`}
                        />
                        <p className="text-sm leading-relaxed text-ink/70">
                            Make-up gain lifts the <em>whole</em> curve (the dashed green line) after compression has done
                            its work. It changes how loud the result is — it does <span className="font-semibold">not</span>{' '}
                            change how much compression is happening. The gain-reduction band on the ribbon stays exactly
                            the same while you raise it.
                        </p>
                    </div>
                </div>
                <Callout type="tip" title="Make-up gain is a known mark-loser">
                    The Principal Examiner on the 2023 vocal-chain essay: &ldquo;Most candidates were able to see that the
                    very high ratio would result in a heavily compressed vocal. The function of the make-up gain was often
                    confused and misunderstood.&rdquo; The sentence that earns the mark: <em>make-up gain restores the
                    level lost to gain reduction, so the compressed signal matches its original loudness.</em>
                </Callout>
            </Movement>

            {/* ── movement 6: the bench ── */}
            <Movement number="6" title="The exam bench — draw it, then defend it">
                <Prose>
                    The 2025 paper carried a compression-curve question worth up to seven marks. Curve questions award
                    features: the unity line below the threshold, the kink placed at the threshold, and the slope above it
                    set by the ratio. Draw first — the answer only appears after you commit.
                </Prose>
                <DrawBench />
                <Prose>
                    And one distinction the examiners single out — from the 2020 report: &ldquo;Many students confused
                    gating with compression, thinking that the gate was a compressor.&rdquo;
                </Prose>
                <GateVsCompressor />
            </Movement>

            {/* ── movement 7: sandbox ── */}
            <Movement number="7" title="The sandbox — all of it at once">
                <Prose>
                    Every control is live above and every one of them talks to the same curve, ribbon and groove. Three
                    things worth trying, now that each parameter is yours:
                </Prose>
                <ul className="mt-3 max-w-[65ch] list-disc space-y-2 pl-5 text-base leading-relaxed text-ink/75">
                    <li>
                        <span className="font-semibold text-ink/90">Glue:</span> threshold just under the accents, 2:1,
                        slow attack, medium release, a touch of make-up — the groove tightens without obviously changing.
                    </li>
                    <li>
                        <span className="font-semibold text-ink/90">Pump:</span> threshold deep in the signal, 8:1,
                        fastest release — the classic dance-music breathing, made deliberately.
                    </li>
                    <li>
                        <span className="font-semibold text-ink/90">Limit:</span> 20:1, fast attack, threshold at −12 dB —
                        watch the output trace flatten against a ceiling while the input still swings.
                    </li>
                </ul>
                <div className="mt-6 rounded-2xl border border-line bg-cream/60 p-5">
                    <p className={`${MONO} text-xs uppercase tracking-wide text-sienna-600`}>What you can now write</p>
                    <ul className="mt-2 max-w-[65ch] space-y-2 text-sm leading-relaxed text-ink/80">
                        <li>
                            &ldquo;With the threshold at −24 dB and a 4:1 ratio, a snare accent peaking 12 dB over the
                            threshold is reduced by 9 dB, evening it out against the ghost notes.&rdquo;
                        </li>
                        <li>
                            &ldquo;The fast release causes audible pumping, as the level surges back between kick
                            hits.&rdquo;
                        </li>
                        <li>
                            &ldquo;Make-up gain restores the level lost to gain reduction without altering the amount of
                            compression applied.&rdquo;
                        </li>
                    </ul>
                    <p className="mt-3 text-sm leading-relaxed text-ink/60">
                        Notice each sentence names a setting, a number and a consequence — application, not recitation.
                    </p>
                </div>
                <p className="mt-6 text-base leading-relaxed text-ink/75">
                    When it holds in your head without the page,{' '}
                    <a href="/revise/dynamics" className="font-semibold text-field-700 underline decoration-field-500/40 underline-offset-2 hover:decoration-field-500">
                        take the dynamics revision quiz
                    </a>
                    .
                </p>
            </Movement>
            </div>
        </div>
    );
}
