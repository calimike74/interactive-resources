'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BenchFrame from '@/components/bench/BenchFrame';
import { Dial, Chips, Why, MoreButton } from '@/components/bench/controls';
import { PlayColumn, Presets, Legal, ExamCallout, useBenchMode, useBenchDepth, DEPTHS } from '@/components/bench/BenchBits';
import { useBenchAudio, glide, envelopeOf } from '@/components/bench/useBenchAudio';
import styles from '@/components/bench/bench.module.css';
import { memberTopicHref, useStudioArrival } from '@/lib/studio-return';
import { DEPTH_LINES, DEPTH_TEACH, hearingLine, judge, open as openMachine, nextMove, sectionOfLast } from '@/lib/bench/reverb-depth';
import {
    TYPES, TYPE_IDS, SOURCES, SOURCE_IDS,
    TIME_MIN, TIME_MAX, PREDELAY_MIN, PREDELAY_MAX, WET_MIN, WET_MAX, DRY_MIN, DRY_MAX,
    DAMPING_MIN, DAMPING_MAX, PAN_MIN, PAN_MAX,
    BPM, BEATS_PER_BAR, MODEL_RATE, GATE_HOLD, GATE_CLOSE, DB_FLOOR, DB_RT60,
    posToLog, logToPos, sig3, round4, fmtSec, fmtMs, dbOfAmp, dampedTime, envelopeAt,
    impulse, impulseLength, readings, verdict, judgeAll, SECTIONS,
    PRESETS, presetsFor, applyPreset, DEFAULT_STATE,
    setSource, setType, setPredelay, setTime, setWet, setDry, setDamping, setStereo, setRouting, setPan,
    wetGain, dryGain, dryPan, wetPan, predelaySec, boxGrade,
    tailShape, timeFromShape, predelayFromShape, pathBoxes, machineLanes, stageOf,
} from '@/lib/bench/reverb-model';

// The Reverb bench (1.12) : the tenth bench, built 2 Sep 2026 to
// BENCH-STANDARD.md. lib/bench/reverb-model.js makes the impulse response;
// the graph below convolves the source with it and the stage draws the same
// envelope the noise was shaped by, so the picture is the sound (law 6).
// Design record: docs/superpowers/specs/2026-09-02-reverb-bench-design.md
//
// The console is the paper's own answer sheet: 2019 C3 Q3(a) drew Type,
// Pre-delay (ms) and Reverb time (s) as dials and 2021 C3 Q1(d) added Wet
// level %, so those are the dials here, with the practical paper's routing
// controls in the More row.

const AUDIO = '/bench-audio/reverb';
const FILES = {
    vocal: `${AUDIO}/vocal.mp3`,
    guitar: `${AUDIO}/guitar.mp3`,
    snare: `${AUDIO}/snare.mp3`,
};

const CODE = '1.12 Reverb';
const TITLE = 'Reverb bench';
const ORIENTS = {
    core: 'The dry mark at zero, the gap, the first reflections, then the tail falling to the named floor.',
    alevel: 'The channel across the top, the send and the return beneath it, each part judged for the job.',
    extension: 'The dry, the answer the space gives one clap, and the wet the two of them make together.',
};

// Set from scripts/measure-reverb.mjs, not from the files' own RMS
// (BENCH-STANDARD, 29 Aug 2026: a bench balance is measured).
// Set from scripts/measure-reverb.mjs, 2 Sep 2026: the three sources through
// the same hall within about 3 dB on their peaks (the phrases carry silence,
// so their means sit lower than the snare's).
const SOURCE_TRIM = { vocal: 1, guitar: 1.28, snare: 0.66 };

const PRE_MAX_SEC = 0.6;
const XFADE = 0.06;

// ---- the graph ------------------------------------------------------------
// source -> dry gain -> dry pan -> master
// source -> send (wet) -> pre-delay -> convolver -> wet pan -> master
// Two convolvers alternate: a change of type, time, damping or stereo builds
// the new answer into the idle one and crossfades 60 ms, so nothing clicks
// and the old tail is allowed to finish. The ceiling compressor is the
// shared kit's limiter, between master and the destination.
function buildReverbGraph(ctx, input, master) {
    const dry = ctx.createGain();
    const dryPanner = ctx.createStereoPanner();
    input.connect(dry);
    dry.connect(dryPanner);
    dryPanner.connect(master);

    const send = ctx.createGain();
    send.gain.value = 0;
    const pre = ctx.createDelay(PRE_MAX_SEC);
    input.connect(send);
    send.connect(pre);

    // The gate on the return: a real gated reverb shuts the RETURN, not the
    // answer, so a snare that keeps ringing is cut with it. Opened when the
    // answer arrives (the hit plus the pre-delay), held 120 ms, shut in 10.
    const gate = ctx.createGain();
    const wetPanner = ctx.createStereoPanner();
    gate.connect(wetPanner);
    wetPanner.connect(master);
    const meter = ctx.createAnalyser();
    meter.fftSize = 512;
    meter.smoothingTimeConstant = 0.4;
    wetPanner.connect(meter);

    const conv = [ctx.createConvolver(), ctx.createConvolver()];
    const cg = [ctx.createGain(), ctx.createGain()];
    conv.forEach((c, i) => {
        c.normalize = false;
        pre.connect(c);
        c.connect(cg[i]);
        cg[i].connect(gate);
        cg[i].gain.value = i === 0 ? 1 : 0;
    });

    let active = 0;
    let current = null;
    let dryHeld = false;

    function setBuffer(buf) {
        if (!buf) return;
        const next = 1 - active;
        try { conv[next].buffer = buf; } catch { return; }
        const t = ctx.currentTime;
        for (const g of cg) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); }
        cg[next].gain.linearRampToValueAtTime(1, t + XFADE);
        cg[active].gain.linearRampToValueAtTime(0, t + XFADE);
        active = next;
    }
    function gateHit(t, state) {
        if (state.type !== 'gated' || !SOURCES[state.source].oneShot) return;
        const open = t + predelaySec(state);
        gate.gain.cancelScheduledValues(t);
        gate.gain.setValueAtTime(1, t);
        gate.gain.setValueAtTime(1, open + GATE_HOLD);
        gate.gain.linearRampToValueAtTime(0, open + GATE_HOLD + GATE_CLOSE);
    }
    function set(state) {
        const wasGated = current && current.type === 'gated' && SOURCES[current.source].oneShot;
        const isGated = state.type === 'gated' && SOURCES[state.source].oneShot;
        if (wasGated && !isGated) {
            const t = ctx.currentTime;
            gate.gain.cancelScheduledValues(t);
            gate.gain.setValueAtTime(1, t);
        }
        current = state;
        glide(dry.gain, dryGain(state), ctx);
        glide(send.gain, dryHeld ? 0 : wetGain(state), ctx);
        glide(pre.delayTime, predelaySec(state), ctx, 0.05);
        glide(dryPanner.pan, dryPan(state), ctx);
        glide(wetPanner.pan, wetPan(state), ctx);
    }
    function holdDry(held) {
        dryHeld = held;
        if (current) set(current);
    }
    // Empty both answers so a restart does not play the last one's tail.
    function clear() {
        for (const c of conv) {
            const b = c.buffer;
            try { c.buffer = null; c.buffer = b; } catch { /* engine kept it, fine */ }
        }
    }
    const buf = new Float32Array(meter.fftSize);
    function wetLevel() {
        meter.getFloatTimeDomainData(buf);
        let s = 0;
        for (let i = 0; i < buf.length; i += 1) s += buf[i] * buf[i];
        return Math.sqrt(s / buf.length);
    }
    return { set, setBuffer, holdDry, clear, wetLevel, gateHit };
}

// A log dial, its position rounded: Node's and the browser's Math.log differ
// in the last digit and a hydrated aria-valuenow would not match (2 Sep 2026).
const LogDial = ({ value, min, max, onChange, format, ...rest }) => (
    <Dial
        {...rest}
        value={round4(logToPos(value, min, max))}
        min={0}
        max={100}
        step={0.5}
        format={(pos) => format(posToLog(pos, min, max))}
        onChange={(pos) => onChange(posToLog(pos, min, max))}
    />
);

// The wet's envelope is the dry's envelope convolved with the answer's:
// every sample of the dry stamps a copy, and the copies add up. Drawn at
// the bin resolution of the two envelopes, not per sample.
function convolveEnvelopes(dryEnv, dryBinSec, ansEnv, ansBinSec, outBins, outBinSec) {
    const out = new Float32Array(outBins);
    if (!dryEnv || !ansEnv) return out;
    for (let i = 0; i < dryEnv.length; i += 1) {
        const a = dryEnv[i];
        if (a < 0.004) continue;
        const t0 = i * dryBinSec;
        for (let j = 0; j < ansEnv.length; j += 1) {
            const k = Math.round((t0 + j * ansBinSec) / outBinSec);
            if (k >= outBins) break;
            out[k] += a * a * ansEnv[j] * ansEnv[j];
        }
    }
    let peak = 0;
    for (let i = 0; i < outBins; i += 1) { out[i] = Math.sqrt(out[i]); if (out[i] > peak) peak = out[i]; }
    if (peak > 0) for (let i = 0; i < outBins; i += 1) out[i] /= peak;
    return out;
}

// ---- the bench ------------------------------------------------------------
export default function ReverbBench({ back }) {
    const [state, setState] = useState(DEFAULT_STATE);
    const [further, setFurther] = useState(false);
    const [mode, setMode] = useBenchMode();
    const [depth, setDepth] = useBenchDepth();
    const [hover, setHover] = useState(null);
    const [last, setLast] = useState('preset');
    const [announce, setAnnounce] = useState(null);
    const [sr, setSr] = useState(MODEL_RATE);
    const stateRef = useRef(state);
    stateRef.current = state;
    const { studioOrigin } = useStudioArrival();
    const teach = mode === 'teacher';
    const ext = depth === 'extension';
    const maths = depth !== 'core';

    // ---- audio ----
    const onSchedule = useCallback(({ bar, barStart, beatSec, playBuffer }) => {
        const s = stateRef.current;
        const src = SOURCES[s.source];
        if (bar % src.bars !== 0) return;
        for (const b of src.beats) {
            const t = barStart + b * beatSec;
            playBuffer(src.file, t, { gain: SOURCE_TRIM[s.source] });
            nodesRef.current?.graph?.gateHit?.(t, s);
        }
    }, []);
    const audio = useBenchAudio({ files: FILES, bpm: BPM, beatsPerBar: BEATS_PER_BAR, onSchedule, buildGraph: buildReverbGraph });
    const { ctxRef, nodesRef, getBuffer, began, playing, start, stop, restart } = audio;
    const playingRef = useRef(false);
    playingRef.current = playing;

    // The answer, built once per setting at the context's own rate (headless
    // Chromium runs at 48 kHz; a browser may not, so read it rather than
    // assume it).
    useEffect(() => {
        if (began && ctxRef.current && ctxRef.current.sampleRate !== sr) setSr(ctxRef.current.sampleRate);
    }, [began, sr, ctxRef]);
    const imp = useMemo(
        () => impulse({ type: state.type, time: state.time, damping: state.damping, stereo: state.stereo }, sr),
        [state.type, state.time, state.damping, state.stereo, sr],
    );
    const impRef = useRef(imp);
    impRef.current = imp;

    // the answer into the idle convolver, crossfaded
    useEffect(() => {
        const ctx = ctxRef.current;
        const graph = nodesRef.current?.graph;
        if (!ctx || !graph) return;
        const buf = ctx.createBuffer(2, imp.left.length, imp.sampleRate);
        buf.copyToChannel(imp.left, 0);
        buf.copyToChannel(imp.right, 1);
        graph.setBuffer(buf);
    }, [imp, began, ctxRef, nodesRef]);

    // every other state change goes to the graph, smoothed there
    useEffect(() => { nodesRef.current?.graph?.set(state); }, [state, began, nodesRef]);
    useEffect(() => {
        const ctx = ctxRef.current;
        const nodes = nodesRef.current;
        if (ctx && nodes) glide(nodes.level.gain, state.level, ctx);
    }, [state.level, began, ctxRef, nodesRef]);

    // ---- edits ----
    const touch = (what) => { setLast(what); setAnnounce(null); };
    const chooseDepth = (id) => { setDepth(id); setAnnounce(id); };
    const edit = (fn, what) => (v) => { setState((s) => fn(s, v)); touch(what); };
    const choosePreset = (id) => {
        const preset = PRESETS.find((p) => p.id === id);
        if (!preset) return;
        if (preset.set.routing !== 'send' || preset.set.stereo !== 'stereo' || preset.set.pan !== 0 || preset.set.dry !== 100) setFurther(true);
        const next = applyPreset(stateRef.current, id);
        const fresh = next.source !== stateRef.current.source;
        stateRef.current = next;
        setState(next);
        touch('preset');
        if (fresh && playingRef.current) restart();
    };
    const chooseSource = (id) => {
        stateRef.current = setSource(stateRef.current, id);
        setState((s) => setSource(s, id));
        touch('source');
        if (playingRef.current) restart();
    };
    const togglePlay = useCallback(() => (playingRef.current ? stop() : start()), [start, stop]);

    // The space bar is the transport, wherever the focus is, as in a DAW.
    useEffect(() => {
        function onKey(e) {
            if (e.key !== ' ' || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
            const el = e.target;
            const tag = el?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el?.isContentEditable) return;
            if (el?.closest?.('[data-hold]')) return;
            if (document.getElementById('bench-drawer')?.dataset.open === 'true') return;
            if (el !== document.body && !el?.closest?.('[data-bench-frame]')) return;
            e.preventDefault();
            togglePlay();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [togglePlay]);

    const rd = readings(state);
    const vdd = verdict(state);
    const grades = judgeAll(state);

    // ---- the wet lane, computed off the frame ----
    const srcBuf = getBuffer(SOURCES[state.source].file);
    const wetEnv = useMemo(() => {
        if (!srcBuf) return null;
        const dryEnv = envelopeOf(srcBuf, 160);
        const dryBin = srcBuf.duration / 160;
        const ansBin = imp.length / imp.envelope.length;
        const span = srcBuf.duration + imp.length;
        const bins = 300;
        return { a: convolveEnvelopes(dryEnv, dryBin, imp.envelope, ansBin, bins, span / bins), span, bins };
    }, [srcBuf, imp]);

    // ---- the stage ----
    const canvasRef = useRef(null);
    const readRef = useRef(null);
    const geomRef = useRef(null);
    const dragRef = useRef(null);
    const depthRef = useRef(depth);
    depthRef.current = depth;
    const impDrawRef = useRef(imp);
    impDrawRef.current = imp;
    const wetEnvRef = useRef(wetEnv);
    wetEnvRef.current = wetEnv;
    const srcBufRef = useRef(srcBuf);
    srcBufRef.current = srcBuf;
    const gradesRef = useRef(grades);
    gradesRef.current = grades;
    const vddRef = useRef(vdd);
    vddRef.current = vdd;

    useEffect(() => {
        const first = canvasRef.current;
        if (!first) return undefined;
        let raf = 0;
        const css = getComputedStyle(first.parentElement);
        const v = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
        const col = {
            dry: v('--hit', '#f6f3ec'),
            tail: v('--gen-1', '#7fb39b'),
            high: v('--gen-2', '#7fb0c4'),
            gold: v('--gold-bright', '#f0d48a'),
            purple: '#a395c9',
            ink: 'rgba(255, 255, 255, 0.62)',
            faint: 'rgba(255, 255, 255, 0.38)',
            grid: 'rgba(255, 255, 255, 0.08)',
            gridStrong: 'rgba(255, 255, 255, 0.2)',
            white: '#ffffff',
        };
        const monoFace = v('--mono', 'monospace');
        const mono = `11.5px ${monoFace}`;
        const monoSmall = `10px ${monoFace}`;

        function draw() {
            const canvas = canvasRef.current;
            if (!canvas) { raf = requestAnimationFrame(draw); return; }
            const g = canvas.getContext('2d');
            const s = stateRef.current;
            const d = depthRef.current;
            const im = impDrawRef.current;
            const dpr = window.devicePixelRatio || 1;
            const w = canvas.clientWidth;
            const h = canvas.clientHeight;
            if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
                canvas.width = Math.round(w * dpr);
                canvas.height = Math.round(h * dpr);
            }
            g.setTransform(dpr, 0, 0, dpr, 0, 0);
            g.clearRect(0, 0, w, h);

            const padL = 46;
            const padR = 24;
            const top = 62;
            const bottom = h - 34;
            const box = { x0: padL, y0: top, x1: w - padR, y1: bottom };
            let handle = null;
            let preHandle = null;

            if (d === 'core') {
                // ---- the tail, described (the spec's own words) ----
                const t = tailShape(s, box, im);
                geomRef.current = { d, t, box };
                handle = t.handle;
                preHandle = t.preHandle;

                // dB grid
                g.font = monoSmall;
                g.textAlign = 'right';
                for (let db = 0; db >= DB_FLOOR; db -= 12) {
                    const y = Math.round(t.yOf(db)) + 0.5;
                    const named = db === DB_RT60;
                    g.strokeStyle = named ? col.gridStrong : col.grid;
                    g.setLineDash(named ? [4, 4] : []);
                    g.beginPath();
                    g.moveTo(padL, y);
                    g.lineTo(w - padR, y);
                    g.stroke();
                    g.setLineDash([]);
                    g.fillStyle = named ? col.ink : col.faint;
                    g.fillText(named ? '-60 dB' : `${db}`, padL - 8, y + 3.5);
                }
                // time axis
                const step = t.tMax > 6 ? 1 : t.tMax > 2.5 ? 0.5 : t.tMax > 1 ? 0.2 : 0.1;
                g.textAlign = 'center';
                g.fillStyle = col.faint;
                for (let ts = 0; ts <= t.tMax + 1e-6; ts += step) {
                    const x = Math.round(t.xOf(ts)) + 0.5;
                    g.strokeStyle = col.grid;
                    g.beginPath();
                    g.moveTo(x, t.baseY);
                    g.lineTo(x, t.baseY + 4);
                    g.stroke();
                    g.fillText(ts >= 1 ? `${ts.toFixed(ts % 1 ? 1 : 0)} s` : ts === 0 ? '0' : `${Math.round(ts * 1000)} ms`, x, bottom + 16);
                }

                // the tail the gate cut, so what was lost can be seen
                if (t.ghost.length) {
                    g.strokeStyle = col.faint;
                    g.setLineDash([3, 4]);
                    g.lineWidth = 1;
                    g.beginPath();
                    t.ghost.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
                    g.stroke();
                    g.setLineDash([]);
                }

                // the tail: the envelope the noise really runs under
                const grad = g.createLinearGradient(0, top, 0, bottom);
                grad.addColorStop(0, 'rgba(127, 179, 155, 0.42)');
                grad.addColorStop(1, 'rgba(127, 179, 155, 0.04)');
                g.beginPath();
                g.moveTo(t.points[0][0], t.baseY);
                for (const p of t.points) g.lineTo(p[0], p[1]);
                g.lineTo(t.points[t.points.length - 1][0], t.baseY);
                g.closePath();
                g.fillStyle = grad;
                g.fill();
                g.strokeStyle = col.tail;
                g.lineWidth = 1.6;
                g.beginPath();
                t.points.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
                g.stroke();

                // the first reflections, as spikes
                g.strokeStyle = col.gold;
                g.lineWidth = 1.6;
                for (const tap of t.taps) {
                    g.beginPath();
                    g.moveTo(Math.round(tap.x) + 0.5, t.baseY);
                    g.lineTo(Math.round(tap.x) + 0.5, tap.y);
                    g.stroke();
                }

                // the dry event
                g.fillStyle = col.dry;
                g.fillRect(t.dryX - 3, t.dryY, 6, t.baseY - t.dryY);
                g.font = mono;
                g.textAlign = 'left';
                g.fillStyle = col.ink;
                g.fillText(`dry ${s.dry} %`, t.dryX + 8, t.dryY - 6);

                // the pre-delay gap, bracketed in ms
                if (t.gapX1 - t.gapX0 > 2) {
                    const by = t.preHandle.y;
                    g.strokeStyle = col.purple;
                    g.lineWidth = 1;
                    g.beginPath();
                    g.moveTo(t.gapX0, by - 5); g.lineTo(t.gapX0, by + 5);
                    g.moveTo(t.gapX0, by); g.lineTo(t.gapX1, by);
                    g.moveTo(t.gapX1, by - 5); g.lineTo(t.gapX1, by + 5);
                    g.stroke();
                    g.fillStyle = col.purple;
                    g.font = mono;
                    g.textAlign = 'left';
                    g.fillText(`pre-delay ${fmtMs(s.predelay)}`, t.gapX1 + 6, by + 4);
                }

                // the reverb time, bracketed in seconds at the crossing
                const cx = t.handle.x;
                g.strokeStyle = col.tail;
                g.lineWidth = 1;
                g.beginPath();
                g.moveTo(t.gapX1, t.floorY + 14); g.lineTo(cx, t.floorY + 14);
                g.moveTo(t.gapX1, t.floorY + 9); g.lineTo(t.gapX1, t.floorY + 19);
                g.moveTo(cx, t.floorY + 9); g.lineTo(cx, t.floorY + 19);
                g.stroke();
                g.fillStyle = col.tail;
                g.font = mono;
                g.textAlign = 'center';
                g.fillText(s.type === 'gated' ? `gate shuts ${fmtMs(GATE_HOLD * 1000)}` : `reverb time ${rdText(s)}`, (t.gapX1 + cx) / 2, t.floorY + 30);

                // the source's own envelope, dotted, while it plays
                const ctxA = ctxRef.current;
                const buffer = srcBufRef.current;
                if (playingRef.current && ctxA && buffer) {
                    const env = envelopeOf(buffer, 160);
                    const evs = audio.eventsRef.current;
                    const lastEv = evs.length ? evs[evs.length - 1] : null;
                    if (lastEv) {
                        const since = ctxA.currentTime - lastEv.time;
                        g.strokeStyle = col.white;
                        g.globalAlpha = 0.22;
                        g.setLineDash([2, 3]);
                        g.lineWidth = 1;
                        g.beginPath();
                        for (let i = 0; i < env.length; i += 1) {
                            const ts = (i / env.length) * buffer.duration;
                            const x = t.xOf(ts);
                            const y = t.yOf(dbOfAmp(Math.max(env[i], 1e-4)));
                            if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
                        }
                        g.stroke();
                        g.setLineDash([]);
                        g.globalAlpha = 1;
                        // the playhead
                        if (since >= 0 && since <= t.tMax) {
                            const x = Math.round(t.xOf(since)) + 0.5;
                            g.strokeStyle = col.white;
                            g.globalAlpha = 0.4;
                            g.beginPath();
                            g.moveTo(x, top);
                            g.lineTo(x, t.baseY);
                            g.stroke();
                            g.globalAlpha = 1;
                        }
                    }
                }

                // the handles: the tail's end is the Reverb time dial (law 26)
                if (s.type !== 'gated') {
                    g.fillStyle = col.tail;
                    g.strokeStyle = col.white;
                    g.lineWidth = 1.5;
                    g.beginPath();
                    g.arc(t.handle.x, t.handle.y, 6, 0, Math.PI * 2);
                    g.fill();
                    g.stroke();
                } else handle = null;
                g.fillStyle = col.purple;
                g.fillRect(t.preHandle.x - 4, t.preHandle.y - 4, 8, 8);

                // ---- the first 120 ms, magnified: at the plot's scale a 40 ms gap is
                // fifteen pixels and six reflections are six hairlines (2 Sep 2026 critique)
                {
                    g.globalAlpha = 1;
                    g.setLineDash([]);
                    const iw = Math.min(330, Math.round((w - padL - padR) * 0.32));
                    const ih = Math.min(96, Math.round((bottom - top) * 0.34));
                    const ox = w - padR - iw;
                    const oy = top + 10;
                    const ib = { x0: ox + 30, y0: oy + 22, x1: ox + iw - 12, y1: oy + 22 + ih };
                    const win = Math.max(0.12, t.pre + 0.1);
                    const ti = tailShape(s, ib, im, win);
                    g.fillStyle = 'rgba(23, 23, 43, 0.97)';
                    g.strokeStyle = col.gridStrong;
                    g.lineWidth = 1;
                    g.beginPath();
                    g.roundRect(ox + 0.5, oy + 0.5, iw, ih + 46, 6);
                    g.fill();
                    g.stroke();
                    g.font = monoSmall;
                    g.fillStyle = col.faint;
                    g.textAlign = 'left';
                    g.fillText(`the first ${Math.round(win * 1000)} ms`, ox + 10, oy + 14);
                    g.strokeStyle = col.grid;
                    g.beginPath();
                    g.moveTo(ib.x0, ti.baseY + 0.5);
                    g.lineTo(ib.x1, ti.baseY + 0.5);
                    g.stroke();
                    g.strokeStyle = col.tail;
                    g.lineWidth = 1.4;
                    g.beginPath();
                    ti.points.filter((pt) => pt[0] < ib.x1 - 0.5).forEach((pt, i) => (i ? g.lineTo(pt[0], pt[1]) : g.moveTo(pt[0], pt[1])));
                    g.stroke();
                    g.strokeStyle = col.gold;
                    g.lineWidth = 1.6;
                    for (const tap of ti.taps) {
                        if (tap.x >= ib.x1 - 0.5) continue;
                        g.beginPath();
                        g.moveTo(Math.round(tap.x) + 0.5, ti.baseY);
                        g.lineTo(Math.round(tap.x) + 0.5, tap.y);
                        g.stroke();
                    }
                    g.fillStyle = col.dry;
                    g.fillRect(ti.dryX - 2, ti.dryY, 4, ti.baseY - ti.dryY);
                    if (ti.gapX1 - ti.gapX0 > 2) {
                        const by = ti.preHandle.y;
                        g.strokeStyle = col.purple;
                        g.lineWidth = 1;
                        g.beginPath();
                        g.moveTo(ti.gapX0, by); g.lineTo(ti.gapX1, by);
                        g.moveTo(ti.gapX1, by - 4); g.lineTo(ti.gapX1, by + 4);
                        g.stroke();
                        g.fillStyle = col.purple;
                        g.textAlign = 'left';
                        g.fillText(`${fmtMs(s.predelay)} gap`, ti.gapX1 + 4, by + 3.5);
                    }
                    g.fillStyle = col.faint;
                    g.textAlign = 'center';
                    const tick = win >= 0.3 ? 100 : 20;
                    for (let ms = 0; ms <= win * 1000 + 1e-6; ms += tick) g.fillText(`${ms}`, ti.xOf(ms / 1000), ti.baseY + 13);
                }
            } else if (d === 'alevel') {
                // ---- the paper's signal path, judged ----
                const p = pathBoxes(s, box);
                geomRef.current = { d, p, box };
                const gr = gradesRef.current;
                const WORD = { good: 'suits', partly: 'partly', poor: 'does not suit' };
                g.lineWidth = 1;
                // the wires
                g.strokeStyle = col.faint;
                for (let i = 0; i < p.top.length - 1; i += 1) {
                    const a = p.top[i];
                    const y = a.y + a.h / 2;
                    g.beginPath();
                    g.moveTo(a.x + a.w, y);
                    g.lineTo(p.top[i + 1].x, y);
                    g.stroke();
                    arrow(g, p.top[i + 1].x, y, col.faint);
                }
                // the send drops out of the channel and the return comes back to the mix
                const chan = p.top[0];
                const sendBox = p.bottom[0];
                const retBox = p.bottom[1];
                const mixBox = p.top[4];
                g.strokeStyle = col.tail;
                g.beginPath();
                g.moveTo(chan.x + chan.w / 2, chan.y + chan.h);
                g.lineTo(chan.x + chan.w / 2, sendBox.y + sendBox.h / 2);
                g.lineTo(sendBox.x, sendBox.y + sendBox.h / 2);
                g.stroke();
                arrow(g, sendBox.x, sendBox.y + sendBox.h / 2, col.tail);
                g.beginPath();
                g.moveTo(sendBox.x + sendBox.w, sendBox.y + sendBox.h / 2);
                g.lineTo(retBox.x, retBox.y + retBox.h / 2);
                g.stroke();
                arrow(g, retBox.x, retBox.y + retBox.h / 2, col.tail);
                g.beginPath();
                g.moveTo(retBox.x + retBox.w, retBox.y + retBox.h / 2);
                g.lineTo(mixBox.x + mixBox.w / 2, retBox.y + retBox.h / 2);
                g.lineTo(mixBox.x + mixBox.w / 2, mixBox.y + mixBox.h);
                g.stroke();
                arrow(g, mixBox.x + mixBox.w / 2, mixBox.y + mixBox.h, col.tail, 'up');

                for (const b of p.boxes) {
                    const grade = boxGrade(s, b.id, gr);
                    g.strokeStyle = grade === 'poor' ? col.white : grade === 'partly' ? col.ink : col.faint;
                    g.lineWidth = grade === 'poor' ? 2 : 1;
                    g.setLineDash(grade === 'partly' ? [5, 4] : []);
                    g.fillStyle = 'rgba(255, 255, 255, 0.05)';
                    g.beginPath();
                    g.roundRect(b.x, b.y, b.w, b.h, 6);
                    g.fill();
                    g.stroke();
                    g.setLineDash([]);
                    g.fillStyle = col.ink;
                    g.font = monoSmall;
                    g.textAlign = 'left';
                    g.fillText(b.label, b.x + 9, b.y + 15);
                    g.fillStyle = col.white;
                    g.font = mono;
                    g.fillText(fit(g, b.sub, b.w - 18), b.x + 9, b.y + 32);
                    if (grade) {
                        g.fillStyle = grade === 'good' ? col.tail : col.gold;
                        g.font = monoSmall;
                        g.fillText(WORD[grade], b.x + 9, b.y + 48);
                    }
                }
                // the return's width
                g.fillStyle = col.tail;
                g.font = monoSmall;
                g.textAlign = 'center';
                g.fillText(s.stereo === 'stereo' ? 'STEREO RETURN' : 'MONO RETURN', retBox.x + retBox.w / 2, retBox.y + retBox.h + 16);
                g.fillStyle = col.faint;
                g.textAlign = 'left';
                g.fillText(s.routing === 'send' ? 'SEND AND RETURN' : 'CHANNEL INSERT', sendBox.x, sendBox.y - 10);
                if (vddRef.current.ok != null) {
                    g.fillStyle = vddRef.current.ok ? col.tail : col.gold;
                    g.font = mono;
                    g.textAlign = 'right';
                    g.fillText(vddRef.current.ok ? 'as directed' : 'not yet', box.x1, box.y1);
                }
            } else {
                // ---- the machine, opened: three lanes in time ----
                const m = machineLanes(box);
                geomRef.current = { d, m, box };
                const we = wetEnvRef.current;
                const buffer = srcBufRef.current;
                const span = we ? we.span : imp.length + 1;
                const xOf = (ts) => m.x0 + (Math.max(0, Math.min(span, ts)) / span) * (m.x1 - m.x0);
                for (const lane of m.lanes) {
                    g.strokeStyle = col.grid;
                    g.lineWidth = 1;
                    g.beginPath();
                    g.moveTo(m.x0, Math.round(lane.bottom) + 0.5);
                    g.lineTo(m.x1, Math.round(lane.bottom) + 0.5);
                    g.stroke();
                    g.fillStyle = col.ink;
                    g.font = monoSmall;
                    g.textAlign = 'left';
                    g.fillText(lane.id === 'answer' && s.predelay > 0 ? `${lane.label} · gap ${fmtMs(s.predelay)}` : lane.label, m.x0, lane.top - 4);
                    g.fillStyle = col.faint;
                    g.textAlign = 'right';
                    g.fillText(lane.title, m.x1, lane.top - 4);
                }
                const [dryLane, ansLane, wetLane] = m.lanes;
                // DRY: the source's own samples
                if (buffer) {
                    const env = envelopeOf(buffer, 240);
                    g.fillStyle = col.dry;
                    const hgt = dryLane.bottom - dryLane.top;
                    for (let i = 0; i < env.length; i += 1) {
                        const x = xOf((i / env.length) * buffer.duration);
                        const y = dryLane.bottom - Math.max(1, env[i] * hgt * 0.92);
                        g.fillRect(x, y, 1.4, dryLane.bottom - y);
                    }
                }
                // THE ANSWER: the impulse response's real samples
                {
                    const hgt = ansLane.bottom - ansLane.top;
                    const mid = ansLane.bottom;
                    const pre = predelaySec(s);
                    const n = im.left.length;
                    const cols = Math.max(60, Math.round((im.length / span) * (m.x1 - m.x0)));
                    let peak = 0;
                    for (let i = 0; i < n; i += 1) { const a = Math.abs(im.left[i]); if (a > peak) peak = a; }
                    const k = peak > 0 ? 1 / peak : 0;
                    g.fillStyle = col.tail;
                    for (let c = 0; c < cols; c += 1) {
                        const i0 = Math.floor((c / cols) * n);
                        const i1 = Math.max(i0 + 1, Math.floor(((c + 1) / cols) * n));
                        let mx = 0;
                        for (let i = i0; i < i1; i += 1) { const a = Math.abs(im.left[i]); if (a > mx) mx = a; }
                        const x = xOf(pre + (i0 / n) * im.length);
                        const hh = Math.max(0.6, mx * k * hgt * 0.9);
                        g.fillRect(x, mid - hh, 1.4, hh);
                    }
                    // the high band, drawn thin, fading first under damping
                    g.strokeStyle = col.high;
                    g.lineWidth = 1;
                    g.beginPath();
                    const hiT = dampedTime(s.time, s.damping);
                    for (let i = 0; i <= 120; i += 1) {
                        const ts = (i / 120) * im.length;
                        const a = s.type === 'reversed'
                            ? Math.exp(-Math.log(1000) * (im.length - ts) / hiT)
                            : Math.exp(-Math.log(1000) * ts / hiT) * (s.type === 'gated' && ts > GATE_HOLD ? 0 : 1);
                        const x = xOf(pre + ts);
                        const y = mid - Math.min(1, a) * hgt * 0.9 * TYPES[s.type].hiGain;
                        if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
                    }
                    g.stroke();
                    // the gap and the first reflections, named in milliseconds
                    g.fillStyle = col.purple;
                    g.font = monoSmall;
                    g.textAlign = 'left';
                    if (pre > 0) {
                        g.strokeStyle = col.purple;
                        g.beginPath();
                        g.moveTo(m.x0, ansLane.top + 10);
                        g.lineTo(xOf(pre), ansLane.top + 10);
                        g.stroke();
                    }
                    g.fillStyle = col.gold;
                    let lastX = -30;
                    for (const tap of im.earlyTaps.slice(0, 8)) {
                        const x = xOf(pre + tap.t);
                        if (x - lastX < 30) continue;
                        lastX = x;
                        g.fillText(`${Math.round(tap.t * 1000)}`, x + 2, ansLane.top + 20);
                    }
                }
                // WET: the two of them convolved
                if (we) {
                    const hgt = wetLane.bottom - wetLane.top;
                    g.fillStyle = col.high;
                    for (let i = 0; i < we.a.length; i += 1) {
                        const x = xOf((i / we.a.length) * we.span);
                        const hh = Math.max(0.6, we.a[i] * hgt * 0.92);
                        g.fillRect(x, wetLane.bottom - hh, 1.6, hh);
                    }
                }
                g.fillStyle = col.faint;
                g.font = monoSmall;
                g.textAlign = 'center';
                for (let ts = 0; ts <= span; ts += span > 8 ? 2 : 1) g.fillText(`${ts} s`, xOf(ts), bottom + 16);
            }

            // the live readout in its reserved slot (law 24)
            if (readRef.current) {
                const graph = nodesRef.current?.graph;
                const lvl = graph && playingRef.current ? graph.wetLevel() : null;
                const txt = lvl == null ? '\u00a0· stopped' : `\u00a0· out ${Math.max(-99, Math.round(dbOfAmp(lvl)))} dB`;
                if (readRef.current.textContent !== txt) readRef.current.textContent = txt;
            }

            // what this frame drew, told to the DOM for check-bench (laws 18 and 26)
            const rt = String(sig3(s.time));
            if (canvas.dataset.rt60 !== rt) canvas.dataset.rt60 = rt;
            const pd = String(Math.round(s.predelay));
            if (canvas.dataset.predelay !== pd) canvas.dataset.predelay = pd;
            const stageTag = stageOf(d);
            if (canvas.dataset.stage !== stageTag) canvas.dataset.stage = stageTag;
            if (canvas.dataset.verdict !== vddRef.current.key) canvas.dataset.verdict = vddRef.current.key;
            const handleTag = handle ? `${Math.round(handle.x)}:${Math.round(handle.y)}` : '';
            if (canvas.dataset.handle !== handleTag) canvas.dataset.handle = handleTag;
            const preTag = preHandle && d === 'core' ? `${Math.round(preHandle.x)}:${Math.round(preHandle.y)}` : '';
            if (canvas.dataset.prehandle !== preTag) canvas.dataset.prehandle = preTag;

            raf = requestAnimationFrame(draw);
        }
        raf = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(raf);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ---- the stage's pointer ----
    const nearHandle = (px, py, which) => {
        const c = canvasRef.current;
        const tag = which === 'pre' ? c?.dataset.prehandle : c?.dataset.handle;
        if (!tag) return false;
        const [hx, hy] = tag.split(':').map(Number);
        return Math.hypot(hx - px, hy - py) <= 14;
    };
    const hitBox = (px, py) => {
        const gm = geomRef.current;
        if (!gm || gm.d !== 'alevel') return null;
        return gm.p.boxes.find((b) => px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) || null;
    };
    const onStageDown = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        if (nearHandle(px, py, 'pre')) {
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            dragRef.current = { kind: 'pre', shape: geomRef.current?.t };
            touch('stagePre');
            return;
        }
        if (nearHandle(px, py, 'end')) {
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            dragRef.current = { kind: 'end', shape: geomRef.current?.t };
            touch('stage');
            return;
        }
        const b = hitBox(px, py);
        if (b?.section) touch(b.section === 'mix' ? 'wet' : b.section === 'routing' ? 'routing' : b.section);
    };
    const onStageMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        const gm = geomRef.current;
        if (dragRef.current?.kind === 'end' && dragRef.current.shape) {
            const shape = dragRef.current.shape;
            setState((st) => setTime(st, timeFromShape(shape, st, px)));
            return;
        }
        if (dragRef.current?.kind === 'pre' && dragRef.current.shape) {
            const shape = dragRef.current.shape;
            setState((st) => setPredelay(st, predelayFromShape(shape, px)));
            return;
        }
        if (nearHandle(px, py, 'end') || nearHandle(px, py, 'pre')) {
            if (hover?.kind !== 'handle') setHover({ kind: 'handle', x: px, y: py, stageW: rect.width, stageH: rect.height });
            return;
        }
        if (!teach) { if (hover) setHover(null); return; }
        const b = hitBox(px, py);
        if (b) {
            if (hover?.kind === 'box' && hover.id === b.id) return;
            setHover({ kind: 'box', id: b.id, section: b.section, label: b.label, x: px, y: py, stageW: rect.width, stageH: rect.height });
            return;
        }
        if (hover) setHover(null);
    };
    const onStageUp = (e) => {
        if (!dragRef.current) return;
        dragRef.current = null;
        try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* gone */ }
    };

    // ---- drawer ----
    const topicHref = (slug) => memberTopicHref(null, slug, studioOrigin);
    const drawerTabs = useMemo(() => [
        {
            id: 'reference',
            label: 'Reference',
            render: () => (
                <>
                    <h2>Reverb, in the spec&apos;s words</h2>
                    <p>The specification lists six types and one number: &quot;Reverb: Room; hall; plate; spring; gated; reversed. Reverb time.&quot; Under acoustics it adds &quot;Describing a reverb tail; pre-delay time; reverb time (RT60)&quot;, and under core parameters &quot;Wet/dry and bypass settings&quot;. Those are the dials on this bench, in the order the 2019 paper drew them. The rest of the machine is this bench&apos;s own: the gate&apos;s 120 ms hold, the spring&apos;s pulse every 55 ms, the reflections&apos; times and the 2 kHz split are numbers chosen to be heard, not figures a scheme gives.</p>
                    <h3>Terms</h3>
                    <dl>
                        <dt>Reverb time (RT60)</dt><dd>How long the tail takes to fall by 60 decibels. On the stage it is the point where the tail crosses the named floor line, and it is the handle you drag.</dd>
                        <dt>Pre-delay</dt><dd>The gap between the dry sound and the first thing the space sends back. A longer gap keeps the voice in front while the space stays where it is.</dd>
                        <dt>Early reflections</dt><dd>The first few distinct returns, before the tail becomes too dense to count. On this bench a room&apos;s arrive inside 35 ms and a hall&apos;s spread out to 80 ms: the bench&apos;s own numbers, not the exam&apos;s.</dd>
                        <dt>Wet and dry</dt><dd>The balance of the reverb against the original. On this bench Wet feeds the send and Dry is the channel fader, so taking Dry to zero leaves the reverb alone. Hold the dry button and the reverb is bypassed: the spec&apos;s bypass setting, heard.</dd>
                        <dt>Damping</dt><dd>How much faster the top end decays than the rest. On this bench the band above 2 kHz decays first, so the tail darkens as it falls.</dd>
                        <dt>Send and return</dt><dd>The reverb lives on its own channel and several parts can feed it. On an insert it lives inside one channel, so it pans, fades and gates with that channel.</dd>
                        <dt>Gated reverb</dt><dd>A gate across the reverb return, held open and then shut. The length comes from the gate, not the decay, which is why the Reverb time dial changes the density here and not the length.</dd>
                    </dl>
                    <h3>In your DAW</h3>
                    <table>
                        <thead><tr><th>On this bench</th><th>Ableton Live</th><th>Logic Pro</th></tr></thead>
                        <tbody>
                            <tr><td>Type</td><td>Hybrid Reverb: Algorithm and IR pages; Reverb</td><td>ChromaVerb: Room Type; Space Designer IR browser</td></tr>
                            <tr><td>Reverb time</td><td>Reverb: Decay Time</td><td>ChromaVerb: Decay; Space Designer: Length</td></tr>
                            <tr><td>Pre-delay</td><td>Reverb: Predelay</td><td>ChromaVerb: Predelay; Space Designer: Pre-Dly</td></tr>
                            <tr><td>Wet</td><td>Reverb: Dry/Wet, or a Return track send</td><td>Mix slider, or a Bus send to an Aux</td></tr>
                            <tr><td>Damping</td><td>Reverb: High Shelf in the Diffusion Network</td><td>ChromaVerb: Damping; Space Designer: Filter</td></tr>
                            <tr><td>Send or Insert</td><td>Return track A/B versus a device on the channel</td><td>Bus to an Aux versus an insert slot</td></tr>
                        </tbody>
                    </table>
                    <p className={styles.source}>Control names as they appear in Live 12 and Logic Pro 11 device panels. Check against your own version if they move.</p>
                    <h3>Beyond the paper<span className={styles.ext}>EXT</span></h3>
                    <dl>
                        <dt>The answer is synthesised</dt><dd>This bench builds its impulse response rather than playing a recorded one: shaped noise under an exponential decay, with the early reflections written in by hand. A convolution reverb does the same arithmetic with an answer recorded in a real space, which is why swapping one for the other is a change of file, not a change of method.</dd>
                        <dt>Convolution</dt><dd>Every sample of the dry sound stamps a scaled copy of the answer, and the wet signal is all those copies added together. That is what the Extension stage draws, and it is why a longer answer costs more processing rather than sounding different in kind.</dd>
                        <dt>Why 60 decibels</dt><dd>Wallace Sabine measured reverberation as the time for a sound to fall to inaudibility in a quiet hall, which is about 60 dB below its start. The bench builds the tail under exp(-6.91 t / T), which is exactly -60 dB at t = T.</dd>
                    </dl>
                    <p className={styles.source}>Sabine, Collected Papers on Acoustics (1922); Cipriani and Giri, Electronic Music and Sound Design vol. 2, ch. 6.</p>
                </>
            ),
        },
        {
            id: 'teacher',
            label: 'Teacher',
            render: () => (
                <>
                    <h2>What to listen for</h2>
                    <p>Reverb marks are lost in four places, and every one of them is a control on this bench: how much, how long, where it is routed, and whether it is in stereo. Read the reports below, then set the fault yourself and listen to it.</p>
                    <h3>How much</h3>
                    <p>On the 2018 AS task the Principal Examiner wrote: &quot;A good proportion of students managed to choose a suitable reverb length. The amount was the common problem, vocals being too wet or even completely swamped. Short reverbs occurred but only occasionally. No reverb at all was rare.&quot;</p>
                    <p className={styles.source}>Source: Edexcel Principal Examiner Feedback, 9MT0/41, Summer 2018, Question 5(c).</p>
                    <h3>Where it is routed</h3>
                    <p>On the 2023 AS task: &quot;Few got the third mark for maintaining the reverb in stereo on panned vocal, some because of unsuccessful vocal pan, but most because they used reverb on a channel insert so it panned with vocals. It&apos;s surprising that after many years of highlighting this as bad practice it still happens.&quot; And on the 2019 A gating task: &quot;Sometimes the reverb was gated as well as the vocal, proving that the candidate hadn&apos;t used an aux for the reverb in 5(a), or had the inserts in the wrong order.&quot;</p>
                    <p className={styles.source}>Sources: Edexcel Principal Examiner Feedback, 9MT0/41 Summer 2023 Q5(d); 9MT0/04 Summer 2019 Q5(d).</p>
                    <h3>Which parameter changed</h3>
                    <p>On the 2023 A automation task: &quot;Most either applied a static reverb or simply automated the wet/dry balance. But those with more advanced analytical skills noticed that it was the reverb time that was increasing rather than the wet amount.&quot; On the 2023 listening paper: &quot;Many recognised the dry signal disappeared, leaving only the wet; a significant number incorrectly stated the wet signal had got louder or the reverb was longer.&quot;</p>
                    <p className={styles.source}>Sources: Edexcel Principal Examiner Feedback, 9MT0/04 Summer 2023 Q5(f); 9MT0/03 Summer 2023 Q2(a)(i).</p>
                    <h3>Do these now</h3>
                    <ul>
                        <li>Press <b>Judge: swamped</b>, switch to A-level and touch the Wet dial. Read the verdict before you fix it, then fix it.</li>
                        <li>Press <b>Judge: an insert</b> and hold the dry button while it plays. Then open More, switch Routing to Send, and say what moved.</li>
                        <li>Set the vocal, take Dry to zero and leave Wet alone. That is the 2023 change on Funkytown: many heard the dry go, and a significant number said the wet had got louder.</li>
                        <li>On <b>Gated</b>, drag Reverb time from 4 s down to 1 s. The answer thins but never shortens. Say why, in one sentence, using the word gate.</li>
                        <li>Set <b>2019 dials</b>, then drag Pre-delay to zero and back. That dial is the only pre-delay number any scheme has ever put a range on.</li>
                    </ul>
                    <h3>Exam practice</h3>
                    <ExamCallout
                        prompt="A vocal reverb is clearly audible but the voice still sounds close and clear. Which two settings are doing that?"
                        answer="A wet level inside about 10 to 30 per cent, and a pre-delay long enough to hear as a gap. The 2024 scheme credits a medium or long pre-delay and a medium to high wet send in the same answer."
                    />
                    <ExamCallout
                        prompt="A candidate gates a vocal and its reverb disappears with it. What does that prove about their routing?"
                        answer="The reverb was an insert on the vocal channel, not a send to an aux, so the gate took both. The 2019 examiner report treats this as proof no aux was used."
                    />
                </>
            ),
        },
        {
            id: 'connections',
            label: 'Connections',
            render: () => (
                <>
                    <h2>Where this leads</h2>
                    <a className={styles.conn} href={topicHref('acoustics')}>
                        <i>2.1 Acoustics</i>
                        <b>RT60 and the tail</b>
                        <span>The floor line on this stage is the -60 dB the acoustics topic defines. The same number, measured in a room rather than set on a dial.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('delay')}>
                        <i>1.12 Delay</i>
                        <b>Discrete repeats against a dense tail</b>
                        <span>The Delay bench counts repeats you can hear apart. Reverb is the same idea past the point where you can count them.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('signal-flow')}>
                        <i>2.3 Signal flow</i>
                        <b>Send against insert</b>
                        <span>The routing that loses the most reverb marks is a signal-flow question. The topic covers aux sends, returns and insert order.</span>
                    </a>
                    <a className={styles.conn} href={`${topicHref('reverb')}#explore`}>
                        <i>1.12 Reverb</i>
                        <b>Inside the Room</b>
                        <span>The same space in 3D: the walls that make the early reflections, and the absorption that shortens the tail.</span>
                    </a>
                </>
            ),
        },
    ], [studioOrigin]);

    // ---- the bench's one line to the student ----
    let say;
    if (announce) {
        say = <><b>{DEPTHS.find((dd) => dd.id === announce)?.label}:</b> {DEPTH_LINES[announce]}</>;
    } else if (depth === 'alevel') {
        const segs = judge({ state, last });
        const colon = segs[0].text.indexOf(':');
        const lead = colon > 0 && colon < 44 ? segs[0].text.slice(0, colon + 1) : null;
        say = (
            <>
                {segs.map((sg, i) => (
                    <span key={i}>
                        {i === 0 && lead ? <b>{lead}</b> : null}
                        {i === 0 && lead ? sg.text.slice(colon + 1) : sg.text}
                        <i className={styles.ao} data-ao={sg.ao}>AO{sg.ao}</i>
                    </span>
                ))}
                {teach ? DEPTH_TEACH.alevel : null}
            </>
        );
    } else if (depth === 'extension') {
        say = <>{openMachine({ state, last })}{teach ? <> {DEPTH_TEACH.extension}</> : null}</>;
    } else {
        const move = nextMove(state);
        say = teach
            ? <>{hearingLine(state)} <b>Try:</b> {move}.</>
            : <>{hearingLine(state)}</>;
    }

    // ---- console ----
    const typeOptions = TYPE_IDS.map((id) => ({ id, label: TYPES[id].label, title: `${TYPES[id].mech} Good for ${TYPES[id].job}.` }));
    const tapSpread = rd.taps === 0 ? 'none' : `${rd.taps} from ${rd.firstTapMs} ms`;

    const consoleSlot = (
        <>
            <PlayColumn
                playing={playing}
                onTogglePlay={togglePlay}
                onHoldDry={(held) => nodesRef.current?.graph?.holdDry(held)}
                level={state.level}
                onLevel={(v) => setState((s) => ({ ...s, level: v }))}
                teach={teach}
                holdTitle="Hold to hear the source with no reverb"
                holdWhy="mutes the reverb while you hold it, so you can hear what the space is adding"
                playWhy="runs the source round its loop, with room after it for the tail"
            />

            <div className={`${styles.sec} ${styles.secRvSource}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>Source</span></div>
                <div className={styles.srcCol} role="group" aria-label="Source">
                    {SOURCE_IDS.map((id) => (
                        <button key={id} type="button" className={styles.srcBtn} aria-pressed={state.source === id} onClick={() => chooseSource(id)} title={SOURCES[id].note}>
                            {SOURCES[id].label}
                        </button>
                    ))}
                </div>
                <Why>Each is a phrase and then silence, so the tail is heard on its own. The vocal is the paper&apos;s subject in ten of the twelve practical tasks; the guitar is the spring&apos;s; the snare is the plate&apos;s and the gate&apos;s.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secRvType}`} data-teach={teach || undefined}>
                <div className={styles.secHead}>
                    <span className={styles.eyebrow}>Type</span>
                    <span className={styles.value}>{TYPES[state.type].label}</span>
                </div>
                <Chips label="Type" options={typeOptions} value={state.type} onChange={edit(setType, 'type')} />
                <div className={styles.meaning} data-ext={maths ? 'true' : undefined}>
                    {maths ? `first reflections: ${tapSpread}` : 'the shape of the answer'}
                </div>
                <Why>A type is the shape of the answer: where its first reflections fall, how dense it starts and how it ends. These six are the spec&apos;s own list, in the spec&apos;s own order. The presets choose a part for each type; to compare types on one part, use these chips.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secRvDial}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>Pre-delay</span></div>
                <div className={styles.knob}>
                    <Dial
                        label="Pre-delay"
                        value={state.predelay}
                        min={PREDELAY_MIN}
                        max={PREDELAY_MAX}
                        step={1}
                        unit="ms"
                        pointer="var(--purple)"
                        pixels={260}
                        onChange={edit(setPredelay, 'predelay')}
                        title="The gap between the sound and the first thing the space sends back"
                    />
                    <span className={styles.value} data-predelay={Math.round(state.predelay)}>{Math.round(state.predelay)}<small>ms</small></span>
                </div>
                <Why>The gap before the answer. The 2019 scheme accepts &quot;any value between 200ms-400ms&quot; for a hall on a lead vocal: long enough to hear the word clear before the space replies.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secRvDial}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow} data-hot="true">Time</span></div>
                <div className={styles.knob}>
                    <LogDial
                        label="Reverb time"
                        value={state.time}
                        min={TIME_MIN}
                        max={TIME_MAX}
                        unit="s"
                        pointer="var(--gold)"
                        hot
                        pixels={260}
                        format={(t) => fmtSec(sig3(t))}
                        onChange={edit(setTime, 'time')}
                        title="RT60: how long the tail takes to fall by 60 decibels. Drag the tail's end on the stage to set it there."
                    />
                    <span className={styles.value} data-rt60={String(sig3(state.time))}>{fmtSec(sig3(state.time))}</span>
                </div>
                <Why>RT60: how long the tail takes to fall by 60 decibels. The 2024 scheme credits a vocal reverb of 1.5 to 4 seconds, and the other schemes&apos; bands sit inside it. On the stage this is the tail&apos;s end, and you can drag it.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secRvDial}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>Wet</span></div>
                <div className={styles.knob}>
                    <Dial
                        label="Wet"
                        value={state.wet}
                        min={WET_MIN}
                        max={WET_MAX}
                        step={1}
                        unit="%"
                        pointer="var(--green)"
                        pixels={200}
                        onChange={edit(setWet, 'wet')}
                        title="How much of the reverb reaches the mix"
                    />
                    <span className={styles.value} data-wet={Math.round(state.wet)}>{Math.round(state.wet)}<small>%</small></span>
                </div>
                <Why>How much of the answer reaches the mix. The 2021 scheme accepts &quot;any value between 10-30&quot; on a verse vocal; the 2018 report calls too much of it &quot;the common problem&quot;.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secHear}`} data-reverb="true" data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>What you should hear</span></div>
                <div className={styles.stats} aria-live="polite">
                    {state.type === 'gated'
                        ? <div><b>{fmtMs((GATE_HOLD + GATE_CLOSE) * 1000)}</b><span>gate shuts</span></div>
                        : <div><b>{rd.rt60Text}</b><span>to fall 60 dB</span></div>}
                    <div><b>{fmtMs(state.predelay)}</b><span>before the answer</span></div>
                    <div><b>{state.wet} %</b><span>wet in the mix</span></div>
                    <div><b>{tapSpread}</b><span>first reflections</span></div>
                    {ext ? (
                        <>
                            <div><b>{fmtSec(rd.hiTime)}</b><span>above 2 kHz<span className={styles.ext}>EXT</span></span></div>
                            <div><b>{rd.lengthText}</b><span>answer length<span className={styles.ext}>EXT</span></span></div>
                        </>
                    ) : (
                        <>
                            <div><b>{state.stereo === 'stereo' ? 'stereo' : 'mono'}</b><span>{state.routing === 'send' ? 'on a send' : 'on an insert'}</span></div>
                            <div><b>{rd.amount}</b><span>against {state.dry} % dry</span></div>
                        </>
                    )}
                </div>
                {teach ? <div className={styles.meaning}>every number here comes from the dials</div> : null}
                <Legal />
                <Why>Every number here comes from the dials, and the same numbers make the tail on the stage and the answer in the convolver. These are the four things an exam answer about reverb is built from.</Why>
            </div>
        </>
    );

    const bar = (
        <>
            <Presets presets={presetsFor(depth)} presetId={state.presetId} onPreset={choosePreset} wrap />
            <div className={styles.say} data-mode={mode} data-depth={depth}>{say}</div>
            <MoreButton open={further} onOpen={() => setFurther(true)} />
        </>
    );

    const more = further ? (
        <>
            <div className={styles.moreItem}>
                <span className={styles.eyebrow}>Damping</span>
                <Dial label="Damping" value={state.damping} min={DAMPING_MIN} max={DAMPING_MAX} size="small" unit="%" onChange={edit(setDamping, 'damping')} title="How much faster the band above 2 kHz decays" />
                <span className={styles.value}>{state.damping} %</span>
            </div>
            <div className={styles.moreItem}>
                <span className={styles.eyebrow}>Width</span>
                <Chips
                    label="Width"
                    options={[{ id: 'stereo', label: 'Stereo' }, { id: 'mono', label: 'Mono' }]}
                    value={state.stereo}
                    onChange={edit(setStereo, 'stereo')}
                />
            </div>
            <div className={styles.moreItem}>
                <span className={styles.eyebrow}>Routing</span>
                <Chips
                    label="Routing"
                    options={[{ id: 'send', label: 'Send' }, { id: 'insert', label: 'Insert' }]}
                    value={state.routing}
                    onChange={edit(setRouting, 'routing')}
                />
            </div>
            <div className={styles.moreItem}>
                <span className={styles.eyebrow}>Pan</span>
                <Dial label="Pan" value={state.pan} min={PAN_MIN} max={PAN_MAX} step={5} size="small" format={(p) => (p === 0 ? 'centre' : `${Math.abs(p)} ${p < 0 ? 'L' : 'R'}`)} onChange={edit(setPan, 'pan')} title="Where the part sits. On a send the reverb stays centred; on an insert it goes with the part." />
                <span className={styles.value}>{state.pan === 0 ? 'centre' : `${Math.abs(state.pan)} ${state.pan < 0 ? 'L' : 'R'}`}</span>
            </div>
            <div className={styles.moreItem}>
                <span className={styles.eyebrow}>Dry</span>
                <Dial label="Dry" value={state.dry} min={DRY_MIN} max={DRY_MAX} size="small" unit="%" onChange={edit(setDry, 'dry')} title="The channel fader. Take it to zero and only the reverb is left." />
                <span className={styles.value}>{state.dry} %</span>
            </div>
        </>
    ) : null;

    const stage = (
        <>
            <canvas
                ref={canvasRef}
                aria-label={depth === 'core' ? 'The reverb tail in decibels against time: the dry mark, the pre-delay gap, the first reflections and the tail falling to the minus sixty floor' : depth === 'alevel' ? 'The channel, its insert, pan and fader across the top, with the send and the reverb return beneath, each part judged' : 'Three lanes in time: the dry source, the space\'s answer to one clap, and the wet the two of them make'}
                role="img"
                onPointerDown={onStageDown}
                onPointerMove={onStageMove}
                onPointerUp={onStageUp}
                onPointerCancel={onStageUp}
                onPointerLeave={() => { if (!dragRef.current) setHover(null); }}
            />
            <div className={styles.stageNote}>
                <b>{TYPES[state.type].label} · {fmtSec(sig3(state.time))} · {fmtMs(state.predelay)}<span ref={readRef} style={{ '--read': '14ch' }} /></b>
                <span>{ORIENTS[depth] || ORIENTS.core}</span>
            </div>
            <div className={`${styles.stageLegend} ${styles.legendTop}`} aria-hidden="true">
                {depth === 'core' ? (
                    <>
                        <span><i style={{ background: 'var(--hit)' }} />dry</span>
                        <span><i style={{ background: 'var(--gold-bright)' }} />first reflections</span>
                        <span><i style={{ background: 'var(--gen-1)' }} />tail</span>
                    </>
                ) : depth === 'alevel' ? (
                    <>
                        <span><i style={{ background: 'var(--gen-1)' }} />the reverb path</span>
                        <em>click a box for its verdict</em>
                    </>
                ) : (
                    <>
                        <span><i style={{ background: 'var(--hit)' }} />dry</span>
                        <span><i style={{ background: 'var(--gen-1)' }} />the answer</span>
                        <span><i style={{ background: 'var(--gen-2)' }} />above 2 kHz, and the wet</span>
                    </>
                )}
            </div>
            {hover && (teach || hover.kind === 'handle') ? (
                <div
                    className={styles.tip}
                    style={{
                        left: hover.x + 284 > hover.stageW ? hover.x - 286 : hover.x + 16,
                        top: Math.max(44, Math.min(hover.stageH - 130, hover.y - 30)),
                    }}
                >
                    {hover.kind === 'handle' ? (
                        <>
                            <i>The stage is the dial</i>
                            <p>Drag the round handle and <b>Reverb time</b> follows it; drag the square one and <b>Pre-delay</b> does. The numbers on the console are the numbers in the convolver.</p>
                        </>
                    ) : (
                        <>
                            <i>{hover.label}{hover.section ? ` · ${SECTIONS[hover.section].name}` : ''}</i>
                            <p>{hover.section ? grades[hover.section].why : 'The part the source comes from, before anything is done to it.'}{hover.section && grades[hover.section].cite ? ` ${grades[hover.section].cite}` : ''}</p>
                        </>
                    )}
                </div>
            ) : null}
            {!began ? (
                <div className={styles.begin}>
                    <button type="button" className={styles.beginBtn} onClick={() => audio.start()}>
                        <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1.2v9.6L11 6z" fill="currentColor" /></svg>
                        <span>
                            Play the bench
                            <small>A vocal, a guitar and a snare through a real reverb. Headphones help.</small>
                        </span>
                    </button>
                </div>
            ) : null}
        </>
    );

    return (
        <BenchFrame
            code={CODE}
            title={TITLE}
            orientation={ORIENTS[depth] || ORIENTS.core}
            back={back}
            mode={mode}
            onMode={setMode}
            depth={depth}
            onDepth={chooseDepth}
            stage={stage}
            bar={bar}
            more={more}
            console={consoleSlot}
            drawerTabs={drawerTabs}
        />
    );
}

// ---- small canvas helpers ----
function arrow(g, x, y, colour, dir = 'right') {
    g.fillStyle = colour;
    g.beginPath();
    if (dir === 'up') { g.moveTo(x, y); g.lineTo(x - 4, y + 6); g.lineTo(x + 4, y + 6); } else { g.moveTo(x, y); g.lineTo(x - 6, y - 4); g.lineTo(x - 6, y + 4); }
    g.closePath();
    g.fill();
}
function fit(g, text, width) {
    if (g.measureText(text).width <= width) return text;
    let t = text;
    while (t.length > 3 && g.measureText(`${t}…`).width > width) t = t.slice(0, -1);
    return `${t}…`;
}
const rdText = (s) => fmtSec(sig3(s.time));
