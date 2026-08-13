'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
    computeOutputDb,
    curvePoints,
    scoreDrawnCurve,
    CURVE_QUESTION_MARKS,
} from '@/lib/compression/engine';

// ═══════════════════════════════════════════════════════════════════════════
// The Compression Lab — 1.9 Dynamic Processing
//
// The Explore form: one viewport, no scroll. The transfer curve IS the
// compressor's control surface — signal flows visibly in (left meter),
// through the curve (the live dot rides it), and out (right meter), with
// the time story on the ribbon below. Words appear only as one-line
// captions reacting to what was just touched. The maths lives in
// lib/compression/engine.js — curve, live dot and draw-mode marking all
// read the same functions, so they cannot disagree.
// ═══════════════════════════════════════════════════════════════════════════

const FRAUNCES = 'font-[family-name:var(--font-fraunces)]';
const MONO = 'font-[family-name:var(--font-jbmono)]';

const INK = '#1F2A1C';
const SIENNA = '#A0522D';
const FIELD = '#3A4A35';
const CREAM = '#F2EBE0';
const PAPER = '#F8F2E8';
const LINE = 'rgba(43,36,24,0.18)';

const LAB_CSS = `
@keyframes labHalo { 0%,100% { stroke-width:2px; opacity:.6; } 50% { stroke-width:7px; opacity:.12; } }
.lab-halo { animation: labHalo 1.8s ease-in-out infinite; pointer-events:none; }
@keyframes labRing { 0%,100% { box-shadow:0 0 0 0 rgba(58,74,53,.45); } 50% { box-shadow:0 0 0 7px rgba(58,74,53,0); } }
.lab-ring { animation: labRing 1.8s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .lab-halo, .lab-ring { animation: none; } }
`;

// ─── dB ↔ pixel mapping shared by the curve and the draw mode ───────────────

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
// bass: step index → frequency, sustained a quaver each
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

// ─── Vertical level meter (the "in" and "out" of the signal path) ──────────

function LevelBar({ meterRef, field, label, running }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        let raf;
        const peak = { db: -60, hold: 0 };
        const draw = () => {
            const canvas = canvasRef.current;
            if (canvas) {
                const dpr = window.devicePixelRatio || 1;
                const W = canvas.clientWidth;
                const H = canvas.clientHeight;
                if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
                    canvas.width = W * dpr;
                    canvas.height = H * dpr;
                }
                const g = canvas.getContext('2d');
                g.setTransform(dpr, 0, 0, dpr, 0, 0);
                g.fillStyle = PAPER;
                g.fillRect(0, 0, W, H);
                const db = running ? meterRef.current[field] : -60;
                if (db > peak.db) {
                    peak.db = db;
                    peak.hold = 40;
                } else if (peak.hold > 0) {
                    peak.hold -= 1;
                } else {
                    peak.db = Math.max(-60, peak.db - 0.4);
                }
                const yFor = (d) => H - ((Math.max(-60, d) + 60) / 60) * H;
                // tick marks
                g.strokeStyle = LINE;
                g.lineWidth = 1;
                for (const t of [-12, -24, -36, -48]) {
                    g.beginPath();
                    g.moveTo(0, yFor(t));
                    g.lineTo(W, yFor(t));
                    g.stroke();
                }
                // bar
                const y = yFor(db);
                const grad = g.createLinearGradient(0, H, 0, 0);
                grad.addColorStop(0, 'rgba(58,74,53,0.55)');
                grad.addColorStop(1, 'rgba(58,74,53,0.95)');
                g.fillStyle = grad;
                g.fillRect(4, y, W - 8, H - y);
                // peak-hold tick
                g.fillStyle = SIENNA;
                g.fillRect(2, yFor(peak.db) - 1, W - 4, 2);
            }
            raf = requestAnimationFrame(draw);
        };
        raf = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(raf);
    }, [meterRef, field, running]);

    return (
        <div className="flex h-full min-h-0 flex-col items-center gap-1">
            <canvas ref={canvasRef} className="min-h-0 w-9 flex-1 rounded-lg border border-line" />
            <span className={`${MONO} text-[10px] uppercase tracking-wide text-ink/60`}>{label}</span>
        </div>
    );
}

// ─── Meter ribbon: the time story — in, out, and the gain-reduction band ───

function MeterRibbon({ meterRef, running }) {
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
                if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
                    canvas.width = W * dpr;
                    canvas.height = H * dpr;
                }
                const g = canvas.getContext('2d');
                g.setTransform(dpr, 0, 0, dpr, 0, 0);
                const hist = histRef.current;
                if (running) {
                    hist.push({ ...meterRef.current });
                    if (hist.length > 300) hist.shift();
                }
                g.fillStyle = PAPER;
                g.fillRect(0, 0, W, H);

                const BAND = 34; // gain-reduction strip along the bottom
                const topH = H - BAND - 6;
                g.strokeStyle = LINE;
                g.lineWidth = 1;
                g.font = '9px monospace';
                g.fillStyle = 'rgba(31,42,28,0.45)';
                for (const db of [-12, -24, -36, -48]) {
                    const y = ((0 - db) / 60) * topH;
                    g.beginPath();
                    g.moveTo(26, y);
                    g.lineTo(W, y);
                    g.stroke();
                    g.fillText(`${db}`, 2, y + 3);
                }
                // band divider + zero line for gain reduction
                g.strokeStyle = 'rgba(43,36,24,0.28)';
                g.beginPath();
                g.moveTo(0, H - BAND - 3);
                g.lineTo(W, H - BAND - 3);
                g.stroke();

                const px = (i) => 26 + ((W - 30) * i) / 299;
                const py = (db) => ((0 - Math.max(-60, db)) / 60) * topH;

                // input trace (light ink)
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
                // gain reduction as a filled area growing downwards
                if (hist.length > 1) {
                    g.beginPath();
                    g.moveTo(px(0), H - BAND);
                    hist.forEach((h, i) => g.lineTo(px(i), H - BAND + Math.min(BAND - 2, (h.grDb / 20) * (BAND - 2))));
                    g.lineTo(px(hist.length - 1), H - BAND);
                    g.closePath();
                    g.fillStyle = 'rgba(160,82,45,0.35)';
                    g.fill();
                    g.strokeStyle = SIENNA;
                    g.lineWidth = 1.6;
                    g.beginPath();
                    hist.forEach((h, i) => {
                        const y = H - BAND + Math.min(BAND - 2, (h.grDb / 20) * (BAND - 2));
                        i === 0 ? g.moveTo(px(i), y) : g.lineTo(px(i), y);
                    });
                    g.stroke();
                }
                // inline labels where the lines actually are
                if (hist.length > 8) {
                    const last = hist[hist.length - 1];
                    g.font = '10px monospace';
                    g.fillStyle = 'rgba(31,42,28,0.5)';
                    g.fillText('in', W - 18, py(last.inDb) - 4);
                    g.fillStyle = INK;
                    g.fillText('out', W - 26, py(last.outDb) + 12);
                }
                g.font = '9px monospace';
                g.fillStyle = 'rgba(160,82,45,0.9)';
                g.fillText('gain reduction — how hard it is working', 26, H - BAND + 12);
            }
            raf = requestAnimationFrame(draw);
        };
        raf = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(raf);
    }, [running, meterRef]);

    return <canvas ref={canvasRef} className="h-full w-full rounded-xl border border-line" />;
}

// ─── The transfer curve — the control surface itself ───────────────────────

function TransferCurve({ params, onChange, meterRef, running, focus }) {
    const svgRef = useRef(null);
    const dotRef = useRef(null);
    const dropRef = useRef(null);
    const [drag, setDrag] = useState(null);

    // live dot rides the curve; the sienna drop-line hangs from the unity
    // line down to the dot — the gain reduction, drawn where it happens
    useEffect(() => {
        let raf;
        const tick = () => {
            const dot = dotRef.current;
            const drop = dropRef.current;
            if (dot && drop && running) {
                const inDb = meterRef.current.inDb;
                const x = dbToX(inDb);
                const yCurve = dbToY(computeOutputDb(inDb, { ...params, makeupDb: 0 }));
                dot.setAttribute('cx', x);
                dot.setAttribute('cy', yCurve);
                dot.setAttribute('opacity', '1');
                drop.setAttribute('x1', x);
                drop.setAttribute('y1', dbToY(inDb));
                drop.setAttribute('x2', x);
                drop.setAttribute('y2', yCurve);
                drop.setAttribute('opacity', yCurve - dbToY(inDb) > 1.5 ? '0.55' : '0');
            } else if (dot && drop) {
                dot.setAttribute('opacity', '0');
                drop.setAttribute('opacity', '0');
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
        if (!drag) return;
        const p = svgPoint(e);
        if (drag === 'threshold') {
            const thr = Math.round(Math.max(-54, Math.min(-6, xToDb(p.x))));
            onChange({ ...params, thresholdDb: thr }, 'thresholdDb');
        } else if (drag === 'ratio') {
            // handle sits at input 0 dB; its height sets the ratio
            const outAtZero = Math.max(params.thresholdDb + 0.5, Math.min(0, yToDb(p.y)));
            const ratio = Math.min(20, Math.max(1, (0 - params.thresholdDb) / (outAtZero - params.thresholdDb)));
            onChange({ ...params, ratio: Math.round(ratio * 10) / 10 }, 'ratio');
        }
    };

    const nudge = (which, e) => {
        const step = e.shiftKey ? 4 : 1;
        if (which === 'threshold' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
            e.preventDefault();
            const d = e.key === 'ArrowLeft' ? -step : step;
            onChange({ ...params, thresholdDb: Math.max(-54, Math.min(-6, params.thresholdDb + d)) }, 'thresholdDb');
        }
        if (which === 'ratio' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
            e.preventDefault();
            const d = e.key === 'ArrowUp' ? -0.5 : 0.5;
            onChange({ ...params, ratio: Math.min(20, Math.max(1, Math.round((params.ratio + d) * 10) / 10)) }, 'ratio');
        }
    };

    const outAtZero = computeOutputDb(0, { ...params, makeupDb: 0 });
    const kneeY = dbToY(computeOutputDb(params.thresholdDb, { ...params, makeupDb: 0 }));

    return (
        <svg
            ref={svgRef}
            viewBox="0 0 320 320"
            className="h-full w-full touch-none select-none"
            onPointerMove={handleMove}
            onPointerUp={() => setDrag(null)}
            onPointerLeave={() => setDrag(null)}
            role="img"
            aria-label={`Compressor transfer curve: threshold ${params.thresholdDb} dB, ratio ${params.ratio} to 1. The handles on it are the compressor's controls.`}
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
            <text x={PLOT.x0 + PLOT.w / 2} y="314" textAnchor="middle" fontSize="10" fill={INK} opacity="0.7">quiet ← input level (dB) → loud</text>
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

            {/* live gain reduction, drawn where it happens */}
            <line ref={dropRef} stroke={SIENNA} strokeWidth="2" opacity="0" />
            <circle ref={dotRef} r="5" fill={SIENNA} opacity="0" stroke={PAPER} strokeWidth="1.5" />

            {focus === 'threshold' && (
                <circle cx={dbToX(params.thresholdDb)} cy={kneeY} r="15" fill="none" stroke={FIELD} className="lab-halo" />
            )}
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
            <text x={dbToX(params.thresholdDb)} y={kneeY - 14} textAnchor="middle" fontSize="9" fill={FIELD} fontFamily="monospace">threshold {params.thresholdDb}</text>

            {focus === 'ratio' && (
                <circle cx={dbToX(0)} cy={dbToY(outAtZero)} r="15" fill="none" stroke={SIENNA} className="lab-halo" />
            )}
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
        </svg>
    );
}

// ─── Draw mode: the same square becomes the answer paper ───────────────────

const BENCH_PROMPTS = [
    { thresholdDb: -24, ratio: 4, kneeDb: 0, chip: '−24 dB · 4:1', ask: 'threshold −24 dB, ratio 4:1, hard knee' },
    { thresholdDb: -30, ratio: 8, kneeDb: 0, chip: '−30 dB · 8:1', ask: 'threshold −30 dB, ratio 8:1, hard knee' },
    { thresholdDb: -18, ratio: 2, kneeDb: 0, chip: '−18 dB · 2:1', ask: 'threshold −18 dB, ratio 2:1, hard knee' },
    { thresholdDb: -36, ratio: 12, kneeDb: 0, chip: '−36 dB · 12:1', ask: 'threshold −36 dB, ratio 12:1 — close to limiting' },
];

const BENCH_XS = [-60, -48, -36, -24, -12, -6, 0];
const unityHandles = () => BENCH_XS.map((x) => ({ inDb: x, outDb: x }));

function BenchSquare({ handles, result, prompt, onHandles }) {
    const svgRef = useRef(null);
    const [dragIx, setDragIx] = useState(null);

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
        onHandles(handles.map((h, i) => (i === dragIx ? { ...h, outDb } : h)));
    };

    const nudgeHandle = (i, e) => {
        if (result) return;
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
        e.preventDefault();
        const d = (e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 4 : 1);
        onHandles(handles.map((h, ix) => (ix === i ? { ...h, outDb: Math.max(DB_MIN, Math.min(DB_MAX, h.outDb + d)) } : h)));
    };

    const drawnPath = handles.map((h, i) => `${i === 0 ? 'M' : 'L'}${dbToX(h.inDb).toFixed(1)},${dbToY(h.outDb).toFixed(1)}`).join(' ');

    return (
        <svg
            ref={svgRef}
            viewBox="0 0 320 320"
            className="h-full w-full touch-none select-none"
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

            {/* the setting being asked for, written on the paper itself —
                chip form, short enough to clear the unity line's top corner */}
            <text x={PLOT.x0 + 8} y={PLOT.y0 + 16} fontSize="10" fill={INK} opacity="0.75" fontFamily="monospace">draw: {prompt.chip} · hard knee</text>

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
    );
}

// ─── Small rack slider ─────────────────────────────────────────────────────

function RackSlider({ label, min, max, step, value, onChange, format, focused }) {
    return (
        <label className={`block rounded-lg px-2 py-1.5 ${focused ? 'lab-ring bg-field-100/60' : ''}`}>
            <span className="flex items-baseline justify-between">
                <span className="text-[12px] font-semibold text-ink/80">{label}</span>
                <span className={`${MONO} text-[12px] text-ink`}>{format(value)}</span>
            </span>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="mt-1 w-full accent-[#3A4A35]"
            />
        </label>
    );
}

// ─── Captions: one line, reacting to what was just touched ─────────────────

const ms = (s) => `${Math.round(s * 1000)} ms`;

function captionFor(key, p) {
    switch (key) {
        case 'thresholdDb':
            if (p.thresholdDb > -14) return `Threshold ${p.thresholdDb} dB — almost nothing crosses it, so the compressor barely works.`;
            if (p.thresholdDb > -34) return `Threshold ${p.thresholdDb} dB — accents cross and get turned down; ghost notes still pass untouched.`;
            return `Threshold ${p.thresholdDb} dB — everything crosses now, so even the ghost notes are being squeezed.`;
        case 'ratio':
            if (p.ratio < 2) return `Ratio ${p.ratio}:1 — gentle glue: peaks come down only slightly.`;
            if (p.ratio < 10) return `Ratio ${p.ratio}:1 — every ${Math.round(p.ratio)} dB over the threshold comes out as just 1 dB.`;
            return `Ratio ${p.ratio}:1 — that is limiting: a ceiling, not a slope.`;
        case 'attackS':
            if (p.attackS < 0.008) return `Attack ${ms(p.attackS)} — the clamp beats the drum transient, so the click is dulled.`;
            return `Attack ${ms(p.attackS)} — the click escapes before the clamp lands.`;
        case 'releaseS':
            if (p.releaseS < 0.15) return `Release ${ms(p.releaseS)} — the level surges back between hits: that is pumping.`;
            return `Release ${ms(p.releaseS)} — the compressor lets go gently between hits.`;
        case 'kneeDb':
            if (p.kneeDb === 0) return 'Hard knee — compression starts abruptly, exactly at the threshold.';
            return `Knee ${p.kneeDb} dB wide — the corner rounds off; compression fades in around the threshold.`;
        case 'makeupDb':
            return `Make-up +${p.makeupDb} dB — louder, yes; the gain-reduction band has not moved.`;
        default:
            return '';
    }
}

const SCENES = [
    {
        id: 'hear',
        label: 'Hear',
        params: { thresholdDb: -24, ratio: 4, kneeDb: 0, attackS: 0.01, releaseS: 0.18, makeupDb: 0 },
        focus: 'bypass',
        caption: 'The groove is deliberately uneven — flick the compressor in and out; hear the gap close.',
    },
    {
        id: 'threshold',
        label: 'Threshold',
        params: { thresholdDb: -12, ratio: 4, kneeDb: 0, makeupDb: 0 },
        focus: 'threshold',
        caption: 'Drag the green handle left — nothing changes until the drum peaks start crossing it.',
    },
    {
        id: 'ratio',
        label: 'Ratio',
        params: { thresholdDb: -28, ratio: 2, kneeDb: 0 },
        focus: 'ratio',
        caption: 'Drag the sienna handle down — the line above the threshold flattens as ratio rises.',
    },
    {
        id: 'time',
        label: 'Attack · Release',
        params: { thresholdDb: -30, ratio: 8, attackS: 0.03, releaseS: 0.4 },
        focus: 'time',
        caption: 'Shorten attack to dull the kick, then shorten release until the groove pumps.',
    },
    {
        id: 'makeup',
        label: 'Make-up',
        params: { thresholdDb: -28, ratio: 6, makeupDb: 0 },
        focus: 'makeup',
        caption: 'Raise make-up — everything gets louder, yet the gain-reduction band does not move.',
    },
    { id: 'draw', label: 'Draw it', focus: 'draw' },
];

// ─── The page: one screen, the instrument fills it ─────────────────────────

const DEFAULTS = { thresholdDb: -24, ratio: 4, kneeDb: 0, attackS: 0.01, releaseS: 0.18, makeupDb: 0 };

export default function CompressionLab() {
    const audio = useCompressionAudio();
    const [params, setParamsState] = useState(DEFAULTS);
    const [begun, setBegun] = useState(false);
    const [scene, setScene] = useState('hear');
    const [focus, setFocus] = useState('bypass');
    const [caption, setCaption] = useState('');
    const [bench, setBench] = useState({ promptIx: 0, handles: unityHandles(), result: null });
    const grRef = useRef(null);

    const drawMode = scene === 'draw';
    const prompt = BENCH_PROMPTS[bench.promptIx];

    // live gain-reduction readout, off the render path
    useEffect(() => {
        let raf;
        const tick = () => {
            const el = grRef.current;
            if (el) {
                const gr = audio.running ? audio.meterRef.current.grDb : 0;
                el.textContent = `−${gr.toFixed(1)} dB`;
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [audio.running, audio.meterRef]);

    const update = useCallback(
        (next, key) => {
            setParamsState(next);
            audio.setParams(next);
            if (key) setCaption(captionFor(key, next));
        },
        [audio],
    );

    const set = (key) => (value) => update({ ...params, [key]: value }, key);

    const chooseScene = (s) => {
        setScene(s.id);
        setFocus(s.focus);
        if (s.id === 'draw') {
            setBench((b) => ({ ...b, handles: unityHandles(), result: null }));
            setCaption(`Draw the curve for ${BENCH_PROMPTS[bench.promptIx].ask} — three features carry the ${CURVE_QUESTION_MARKS} marks.`);
            return;
        }
        if (s.params) update({ ...params, ...s.params });
        if (s.id === 'hear') audio.setBypass(true);
        setCaption(s.caption);
    };

    const begin = () => {
        setBegun(true);
        audio.start();
        audio.setBypass(true);
        setCaption('The groove is deliberately uneven — flick the compressor in and out; hear the gap close.');
    };

    const toggleBypass = () => {
        const by = !audio.bypassed;
        audio.setBypass(by);
        setCaption(
            by
                ? 'Bypassed — the raw groove: accents roughly four times the ghost notes.'
                : 'Compressor in — quiet hits step forward, accents stop jumping out.',
        );
    };

    const reveal = () => {
        setBench((b) => {
            const result = scoreDrawnCurve(b.handles, BENCH_PROMPTS[b.promptIx]);
            setCaption(`${result.marks}/${CURVE_QUESTION_MARKS} — your line sits ${result.meanAbsDb.toFixed(1)} dB from the true curve on average.`);
            return { ...b, result };
        });
    };

    const pickPrompt = (ix) => {
        setBench({ promptIx: ix, handles: unityHandles(), result: null });
        setCaption(`Draw the curve for ${BENCH_PROMPTS[ix].ask} — three features carry the ${CURVE_QUESTION_MARKS} marks.`);
    };

    return (
        <div className="flex h-full min-h-0 flex-col overflow-y-auto bg-cream lg:overflow-hidden">
            <style dangerouslySetInnerHTML={{ __html: LAB_CSS }} />

            {/* ── top bar: title · scenes · transport ── */}
            <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-4 py-2">
                <div className="flex items-baseline gap-2.5">
                    <span className={`${FRAUNCES} text-[17px] font-medium text-ink`}>The Compression Lab</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Scenes">
                    {SCENES.map((s) => (
                        <button
                            key={s.id}
                            type="button"
                            role="tab"
                            aria-selected={scene === s.id}
                            onClick={() => chooseScene(s)}
                            className={`${MONO} rounded-full px-3 py-1 text-[11.5px] transition-colors ${
                                scene === s.id
                                    ? 'bg-field-600 text-white'
                                    : 'border border-line bg-paper text-ink/70 hover:border-ink/40'
                            }`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <button
                        type="button"
                        onClick={audio.running ? audio.stop : () => { audio.start(); setBegun(true); }}
                        className={`rounded-full px-4 py-1.5 text-[13px] font-semibold text-white transition-colors ${
                            audio.running ? 'bg-sienna-600 hover:bg-sienna-700' : 'bg-field-600 hover:bg-field-700'
                        }`}
                    >
                        {audio.running ? 'Stop' : 'Play'}
                    </button>
                    <button
                        type="button"
                        onClick={toggleBypass}
                        aria-pressed={!audio.bypassed}
                        className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                            audio.bypassed ? 'border-line bg-paper text-ink/70' : 'border-field-600 bg-field-100 text-field-700'
                        } ${focus === 'bypass' && begun ? 'lab-ring' : ''}`}
                    >
                        {audio.bypassed ? 'Bypassed' : 'Compressor in'}
                    </button>
                </div>
            </div>

            {/* ── the instrument ── */}
            <div className="relative flex min-h-0 flex-1 flex-col">
                <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pt-3 lg:grid lg:grid-cols-[3.25rem_minmax(0,1fr)_3.25rem_14.5rem]">
                    {/* signal in */}
                    <div className="hidden lg:block">
                        <LevelBar meterRef={audio.meterRef} field="inDb" label="in" running={audio.running} />
                    </div>

                    {/* the square: curve or answer paper */}
                    <div className="flex min-h-0 items-center justify-center">
                        <div className="aspect-square w-full max-w-[460px] lg:h-full lg:w-auto lg:max-w-none">
                            {drawMode ? (
                                <BenchSquare
                                    handles={bench.handles}
                                    result={bench.result}
                                    prompt={prompt}
                                    onHandles={(hs) => setBench((b) => ({ ...b, handles: hs }))}
                                />
                            ) : (
                                <TransferCurve
                                    params={params}
                                    onChange={update}
                                    meterRef={audio.meterRef}
                                    running={audio.running}
                                    focus={focus}
                                />
                            )}
                        </div>
                    </div>

                    {/* signal out — the other side of the curve */}
                    <div className="hidden lg:block">
                        <LevelBar meterRef={audio.meterRef} field="outDb" label="out" running={audio.running} />
                    </div>

                    {/* right rail: readout + rack, or the draw controls */}
                    <div className="flex min-h-0 flex-col gap-2 overflow-y-auto">
                        {!drawMode ? (
                            <>
                                <div className="rounded-xl border border-line bg-paper px-3 py-2">
                                    <p className={`${MONO} text-[10px] uppercase tracking-wide text-sienna-600`}>gain reduction now</p>
                                    <p ref={grRef} className={`${MONO} text-[26px] leading-tight text-sienna-700`}>−0.0 dB</p>
                                </div>
                                <div className="rounded-xl border border-line bg-paper p-1.5">
                                    <RackSlider
                                        label="Attack"
                                        min={0.001}
                                        max={0.1}
                                        step={0.001}
                                        value={params.attackS}
                                        onChange={set('attackS')}
                                        format={(v) => ms(v)}
                                        focused={focus === 'time'}
                                    />
                                    <RackSlider
                                        label="Release"
                                        min={0.04}
                                        max={1}
                                        step={0.01}
                                        value={params.releaseS}
                                        onChange={set('releaseS')}
                                        format={(v) => ms(v)}
                                        focused={focus === 'time'}
                                    />
                                    <RackSlider
                                        label="Knee"
                                        min={0}
                                        max={24}
                                        step={1}
                                        value={params.kneeDb}
                                        onChange={set('kneeDb')}
                                        format={(v) => (v === 0 ? 'hard' : `${v} dB`)}
                                        focused={false}
                                    />
                                    <RackSlider
                                        label="Make-up"
                                        min={0}
                                        max={12}
                                        step={0.5}
                                        value={params.makeupDb}
                                        onChange={set('makeupDb')}
                                        format={(v) => `+${v} dB`}
                                        focused={focus === 'makeup'}
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="rounded-xl border border-line bg-paper p-2">
                                    <p className={`${MONO} text-[10px] uppercase tracking-wide text-ink/60`}>settings to draw</p>
                                    <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                                        {BENCH_PROMPTS.map((p, ix) => (
                                            <button
                                                key={p.chip}
                                                type="button"
                                                onClick={() => pickPrompt(ix)}
                                                className={`${MONO} rounded-lg border px-2 py-1.5 text-[11px] transition-colors ${
                                                    ix === bench.promptIx
                                                        ? 'border-field-600 bg-field-100 text-field-700'
                                                        : 'border-line bg-cream text-ink/70 hover:border-ink/40'
                                                }`}
                                            >
                                                {p.chip}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {!bench.result ? (
                                    <button
                                        type="button"
                                        onClick={reveal}
                                        className="rounded-full bg-field-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-field-700"
                                    >
                                        Reveal the real curve
                                    </button>
                                ) : (
                                    <div className="rounded-xl border border-line bg-paper p-3">
                                        <p className={`${FRAUNCES} text-2xl text-ink`}>
                                            {bench.result.marks}/{CURVE_QUESTION_MARKS}
                                        </p>
                                        <ul className="mt-2 space-y-2">
                                            {bench.result.breakdown.map((b) => (
                                                <li key={b.feature} className="text-[12px] leading-snug">
                                                    <span className={`${MONO} mr-1 ${b.earned === b.max ? 'text-field-700' : 'text-sienna-700'}`}>
                                                        {b.earned}/{b.max}
                                                    </span>
                                                    <span className="font-semibold text-ink/85">{b.feature}.</span>{' '}
                                                    <span className="text-ink/70">{b.comment}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => pickPrompt((bench.promptIx + 1) % BENCH_PROMPTS.length)}
                                                className="rounded-full bg-field-600 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-field-700"
                                            >
                                                Try another
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => pickPrompt(bench.promptIx)}
                                                className="rounded-full border border-line px-3 py-1.5 text-[12px] font-semibold text-ink/70"
                                            >
                                                Redraw
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* ── ribbon: the time story ── */}
                <div className="h-[132px] shrink-0 px-4 pt-2">
                    <MeterRibbon meterRef={audio.meterRef} running={audio.running} />
                </div>

                {/* ── caption: one line, reacting to the last thing touched ── */}
                <div className="flex h-10 shrink-0 items-center px-5">
                    <p aria-live="polite" className={`${MONO} truncate text-[12.5px] text-ink/75`} data-testid="lab-caption">
                        {caption}
                    </p>
                </div>

                {/* ── begin veil: names the sound before it starts ── */}
                {!begun && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-cream/95 backdrop-blur-sm">
                        <div className="max-w-md px-6 text-center">
                            <p className={`${MONO} text-[11px] uppercase tracking-[0.18em] text-sienna-600`}>
                                C4 · 1.9 Dynamic Processing
                            </p>
                            <h1 className={`${FRAUNCES} mt-2 text-4xl font-medium text-ink`}>The Compression Lab</h1>
                            <p className="mt-3 text-[15px] leading-relaxed text-ink/75">
                                A compressor turns loud moments down, closing the gap between loud and quiet.
                            </p>
                            <button
                                type="button"
                                onClick={begin}
                                className="mt-5 rounded-full bg-field-600 px-8 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-field-700"
                            >
                                Begin
                            </button>
                            <p className={`${MONO} mt-3 text-[11px] text-ink/55`}>
                                Sound starts straight away — a two-bar drum groove, looping.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
