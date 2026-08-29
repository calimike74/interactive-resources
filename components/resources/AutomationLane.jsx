'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BenchFrame from '@/components/bench/BenchFrame';
import { Dial, Chips, Why, MoreButton } from '@/components/bench/controls';
import { PlayColumn, Presets, Legal, ExamCallout, useBenchMode, useBenchDepth, DEPTHS } from '@/components/bench/BenchBits';
import { useBenchAudio, glide } from '@/components/bench/useBenchAudio';
import styles from '@/components/bench/bench.module.css';
import { memberTopicHref, useStudioArrival } from '@/lib/studio-return';
import { DEPTH_LINES, DEPTH_TEACH, judge, open as openMachine, hearingLine, nextMove } from '@/lib/bench/lane-depth';
import {
    PART_IDS,
    PARTS,
    TARGET_IDS,
    TARGETS,
    SHAPE_IDS,
    SHAPES,
    GRID_IDS,
    GRIDS,
    SONG,
    BEATS,
    BARS,
    TASKS,
    PRESETS,
    DEFAULT_STATE,
    applyPreset,
    setPart,
    setTarget,
    setShape,
    setGrid,
    movePoint,
    addPoint,
    removePoint,
    writePoint, touchRelease,
    resetLane,
    flattenLane,
    setLevel,
    valueAt,
    curveFor,
    restUnit,
    verdict,
    fmtValue,
    valueWord,
    fmtBeat,
    listBars,
    movingBars,
    UNITY,
} from '@/lib/bench/lane-model';

// The Automation Lane (1.8), sixth bench to the Bench Standard. One loop
// of one song; one part carries one lane on one target, drawn the way a
// DAW draws it: the clip above, the lane beneath, points you drag. The
// lane is sampled once a millisecond and booked onto the parameter ahead of
// the beat, so the picture and the sound are one series (law 6). Presets
// are the papers' own practicals and the faults their reports name. Three
// jobs (lib/bench/lane-depth.js): Core shows the lane, A-level marks it
// against the stem's own shape, Extension opens the channel and records a
// move by hand. The point on the lane is the control (law 21).

const CODE = '1.8 Automation';
const TITLE = 'Automation Lane';
const FILES = SONG.files;
const LOOP_BPM = 240 / SONG.loopSec; // one scheduler bar is the whole loop
const CURVE_N = Math.round(SONG.loopSec * 1000); // one value a millisecond
const ORIENTS = {
    core: 'The part\'s clip above, its automation lane below, as your DAW draws them. Drag a point; click the lane to add one; double-click a point to remove it.',
    alevel: 'The stem\'s shape is dashed for you to match and the bars it names are shaded. Where the lane fails a check, the fault is marked in coral.',
    extension: 'Under the lane, the channel: the lit box is where this lane writes. Grab the Value dial while the loop runs and the lane records the move.',
};
const CHAIN = ['file', 'filter', 'fader', 'pan', 'send', 'room', 'bus'];
const LANE_TOOLS = [{ id: 'reset', label: 'Back to the stem' }, { id: 'flat', label: 'Flatten' }];
const dbToGain = (db) => 10 ** (db / 20);

// ---- the graph ------------------------------------------------------------
// Four strips: source -> low-pass filter -> the bench's mix trim -> fader ->
// pan -> the bus, with a post-fade send from every fader into one shared
// room. The lane writes to one parameter of one strip: the filter's
// cut-off, the fader's gain, the pan, or the send. Everything else sits at
// rest.
function makeIR(ctx) {
    const sr = ctx.sampleRate;
    const n = Math.round(sr * 2.6);
    const buf = ctx.createBuffer(2, n, sr);
    let seed = 7654321; // the same room every time
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return (seed / 4294967296) * 2 - 1; };
    for (let c = 0; c < 2; c += 1) {
        const d = buf.getChannelData(c);
        let lp = 0;
        for (let i = 0; i < n; i += 1) {
            const t = i / sr;
            const env = Math.exp((-t * 6.9) / 2.0);
            lp += 0.5 * (rnd() - lp);
            d[i] = lp * env * (i < 48 ? i / 48 : 1);
        }
    }
    return buf;
}

function buildLaneGraph(ctx, input, master, song) {
    const bus = ctx.createGain();
    const trim = ctx.createGain();
    trim.gain.value = 0.75;
    bus.connect(trim);
    trim.connect(master);
    input.connect(master);
    const reverbIn = ctx.createGain();
    const conv = ctx.createConvolver();
    conv.buffer = makeIR(ctx);
    const reverbOut = ctx.createGain();
    reverbOut.gain.value = 1.3;
    reverbIn.connect(conv);
    conv.connect(reverbOut);
    reverbOut.connect(bus);
    const strips = {};
    for (const id of PART_IDS) {
        const inp = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = restUnit('filter');
        filter.Q.value = 0.9;
        const mix = ctx.createGain();
        mix.gain.value = dbToGain(song.mixTrim[id]);
        const solo = ctx.createGain(); // the DAW's S button: the other parts to 0
        const fader = ctx.createGain();
        const pan = ctx.createStereoPanner();
        const send = ctx.createGain();
        send.gain.value = 0;
        inp.connect(filter);
        filter.connect(mix);
        mix.connect(solo);
        solo.connect(fader);
        fader.connect(pan);
        pan.connect(bus);
        fader.connect(send);
        send.connect(reverbIn);
        strips[id] = { inp, filter, solo, fader, pan, send };
    }
    const paramOf = (id, target) => (target === 'vol' ? strips[id].fader.gain : target === 'pan' ? strips[id].pan.pan : target === 'filter' ? strips[id].filter.frequency : strips[id].send.gain);
    let loops = []; // the loop passes booked so far: { start, dur }
    let active = null; // { id, target, curve }
    let held = false;
    let loopStart = null;
    let loopDur = 0;

    function bookLoop(p, curve, start, dur, from) {
        const t0 = Math.max(start, from);
        const i0 = Math.min(curve.length - 2, Math.max(0, Math.round(((t0 - start) / dur) * curve.length)));
        const slice = i0 ? curve.subarray(i0) : curve;
        const d = start + dur - t0 - 0.002;
        if (d <= 0.005 || slice.length < 2) return;
        try { p.setValueCurveAtTime(slice, t0, d); } catch { /* a pass already booked here */ }
    }
    // Every strip's every parameter back to rest, then the lane booked on the
    // one it writes to, from now, for every pass already booked.
    function rebook() {
        const now = ctx.currentTime;
        loops = loops.filter((l) => l.start + l.dur > now);
        for (const id of PART_IDS) {
            for (const tg of TARGET_IDS) {
                const p = paramOf(id, tg);
                p.cancelScheduledValues(now);
                try { p.cancelAndHoldAtTime(now); } catch { /* older engine */ }
                if (!active || held || id !== active.id || tg !== active.target) p.setTargetAtTime(restUnit(tg), now, 0.02);
            }
        }
        if (!active || held) return;
        const p = paramOf(active.id, active.target);
        const from = now + 0.03;
        for (const l of loops) {
            if (l.start >= from) { bookLoop(p, active.curve, l.start, l.dur, l.start); continue; }
            const i0 = Math.min(active.curve.length - 1, Math.max(0, Math.round(((from - l.start) / l.dur) * active.curve.length)));
            p.linearRampToValueAtTime(active.curve[i0], from - 0.001);
            bookLoop(p, active.curve, l.start, l.dur, from);
        }
    }
    function apply(state) {
        active = { id: state.part, target: state.target, curve: curveFor(state, CURVE_N) };
        rebook();
    }
    function hold(on) { held = on; rebook(); }
    function schedule(at, dur) {
        loopStart = at; loopDur = dur;
        loops.push({ start: at, dur });
        const now = ctx.currentTime;
        loops = loops.filter((l) => l.start + l.dur > now);
        if (active && !held) bookLoop(paramOf(active.id, active.target), active.curve, at, dur, at);
    }
    function clear() {
        loopStart = null; loops = [];
        const now = ctx.currentTime;
        for (const id of PART_IDS) {
            for (const tg of TARGET_IDS) {
                const p = paramOf(id, tg);
                p.cancelScheduledValues(now);
                try { p.cancelAndHoldAtTime(now); } catch { /* older engine */ }
            }
        }
    }
    function soloPart(id) {
        const now = ctx.currentTime;
        for (const sid of PART_IDS) strips[sid].solo.gain.setTargetAtTime(id && id !== sid ? 0 : 1, now, 0.02);
    }
    function position() {
        if (loopStart == null || !loopDur) return null;
        const pos = ctx.currentTime - loopStart;
        if (pos < 0) return 0;
        return (pos % loopDur) / loopDur;
    }
    return { strips, apply, hold, schedule, clear, position, solo: soloPart };
}

// A clip's envelope over the loop: peaks at `bins` points, normalised, and
// the bins where a note begins (the transients the 2020 report means).
function clipEnvelope(buffer, offsetSec, loopSec, bins) {
    if (!buffer) return null;
    const ch = buffer.getChannelData(0);
    const sr = buffer.sampleRate;
    const start = Math.round(offsetSec * sr);
    const len = Math.min(ch.length - start, Math.round(loopSec * sr));
    const step = Math.max(1, Math.floor(len / bins));
    const env = new Float32Array(bins);
    let peak = 0;
    for (let i = 0; i < bins; i += 1) {
        let m = 0;
        const s = start + i * step;
        const e = Math.min(ch.length, s + step);
        for (let j = s; j < e; j += 1) { const a = Math.abs(ch[j]); if (a > m) m = a; }
        env[i] = m;
        if (m > peak) peak = m;
    }
    if (peak > 0) for (let i = 0; i < bins; i += 1) env[i] /= peak;
    const onsets = [];
    let last = -99;
    for (let i = 3; i < bins; i += 1) {
        const before = Math.max(env[i - 1], env[i - 2], env[i - 3]);
        if (env[i] - before > 0.22 && i - last >= Math.round(bins / BEATS / 4)) { onsets.push(i); last = i; }
    }
    return { env, onsets };
}

// ---- the bench ------------------------------------------------------------
export default function AutomationLane({ back }) {
    const [state, setState] = useState(DEFAULT_STATE);
    const [further, setFurther] = useState(false);
    const [mode, setMode] = useBenchMode();
    const [depth, setDepth] = useBenchDepth();
    const [hover, setHover] = useState(null);
    const [last, setLast] = useState('preset');
    const [announce, setAnnounce] = useState(null);
    const [held, setHeld] = useState(false);
    const [live, setLive] = useState(50);
    const stateRef = useRef(state);
    stateRef.current = state;
    const hoverRef = useRef(null);
    hoverRef.current = hover;
    const heldRef = useRef(false);
    const [solo, setSolo] = useState(false); // hear the lane's part alone
    const soloRef = useRef(false);
    soloRef.current = solo;
    const { studioOrigin } = useStudioArrival();
    const teach = mode === 'teacher';
    const ext = depth === 'extension';
    const maths = depth !== 'core';

    const graphRef = useRef(null);
    const offsetRef = useRef(0);
    const envRef = useRef({});

    const onSchedule = useCallback((tick) => {
        const g = graphRef.current;
        if (!g) return;
        const dur = tick.beatSec * tick.beatsPerBar;
        for (const id of PART_IDS) {
            tick.playBuffer(id, tick.barStart, { destination: g.strips[id].inp, offset: offsetRef.current, duration: dur });
        }
        g.schedule(tick.barStart, dur);
    }, []);
    const buildGraph = useCallback((ctx, input, master) => {
        const g = buildLaneGraph(ctx, input, master, SONG);
        graphRef.current = g;
        g.apply(stateRef.current);
        if (heldRef.current) g.hold(true);
        if (soloRef.current) g.solo(stateRef.current.part);
        return g;
    }, []);
    const audio = useBenchAudio({ files: FILES, bpm: LOOP_BPM, onSchedule, buildGraph });
    const { ctxRef, nodesRef, began, playing, ready, getBuffer } = audio;
    const playingRef = useRef(false);
    playingRef.current = playing;

    // The mp3s carry an encoder delay some decoders keep: if the decoded
    // stem is longer than the loop, play from where the music starts. Then
    // the clips' envelopes, from the same samples that play.
    useEffect(() => {
        if (!ready) return;
        const b = getBuffer('drums');
        if (!b) return;
        const extra = b.length - Math.round(SONG.loopSec * b.sampleRate);
        offsetRef.current = extra > 200 ? Math.min(extra, 1105 * (b.sampleRate / 48000)) / b.sampleRate : 0;
        const out = {};
        for (const id of PART_IDS) out[id] = clipEnvelope(getBuffer(id), offsetRef.current, SONG.loopSec, 512);
        envRef.current = out;
    }, [ready, getBuffer]);

    // Every state change lands on the graph as a fresh curve.
    useEffect(() => {
        const g = graphRef.current;
        if (g) g.apply(state);
    }, [state.points, state.shape, state.part, state.target, began]);
    useEffect(() => {
        const ctx = ctxRef.current;
        const nodes = nodesRef.current;
        if (ctx && nodes) glide(nodes.level.gain, state.level, ctx);
    }, [state.level, began, ctxRef, nodesRef]);
    useEffect(() => { graphRef.current?.solo(solo ? state.part : null); }, [solo, state.part, began]);

    const touch = (what) => { setLast(what); setAnnounce(null); };
    const chooseDepth = (id) => { setDepth(id); setAnnounce(id); };
    const choosePart = (id) => { setState((s) => setPart(s, id)); touch('part'); };
    const chooseTarget = (id) => { setState((s) => setTarget(s, id)); touch('target'); };
    const chooseShape = (id) => { setState((s) => setShape(s, id)); touch('shape'); };
    const chooseGrid = (id) => { setState((s) => setGrid(s, id)); touch('grid'); };
    const choosePreset = (id) => { setState((s) => applyPreset(s, id)); touch('preset'); };
    const laneTool = (id) => { setState((s) => (id === 'reset' ? resetLane(s) : flattenLane(s))); touch(id === 'reset' ? 'preset' : 'point'); };
    const holdOff = (on) => {
        heldRef.current = on;
        setHeld(on);
        graphRef.current?.hold(on);
    };
    // Touch: the dial moved while the loop ran writes a point at the
    // playhead, every 16th of a beat; letting go hands the lane back to
    // what it was when the touch began.
    const touchRef = useRef(null);
    const write = (v) => {
        const g = graphRef.current;
        const frac = g?.position();
        if (frac == null || !playingRef.current) return;
        if (!touchRef.current) touchRef.current = { before: stateRef.current };
        setState((s) => writePoint(s, frac * BEATS, v / 100));
        touch('write');
    };
    const release = () => {
        const before = touchRef.current?.before;
        touchRef.current = null;
        const frac = graphRef.current?.position();
        if (!before || frac == null || !playingRef.current) return;
        setState((s) => touchRelease(s, before, frac * BEATS));
    };
    const { start, stop } = audio;
    const togglePlay = useCallback(() => (playingRef.current ? stop() : start()), [start, stop]);

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

    // Everything the stage draws and the console reads, from one state.
    const vd = useMemo(() => verdict(state), [state]);
    const moving = useMemo(() => movingBars(state), [state]);
    const vdRef = useRef(vd); vdRef.current = vd;
    const task = state.task ? TASKS[state.task] : null;

    // ---- stage ----
    const canvasRef = useRef(null);
    const geomRef = useRef(null);
    const dragRef = useRef(null);
    const depthRef = useRef(depth);
    depthRef.current = depth;
    const legendRef = useRef(null);
    const legendWRef = useRef(0);
    const frameRef = useRef(0);
    const barRef = useRef(null);
    const readRef = useRef(null);
    const liveRef = useRef(50);
    const stageOf = (d) => (d === 'core' ? 'lane' : d === 'alevel' ? 'paper' : 'machine');
    const geom = (w, h2, d) => {
        const padL = 44; const padR = 22; const top = 54; const bottom = h2 - 24;
        const H = bottom - top;
        // the lane keeps its height when the bar grows: the clip and the
        // machine give way first
        const clipH = d === 'extension' ? Math.max(30, Math.min(64, Math.round(H * 0.2))) : Math.max(40, Math.min(84, Math.round(H * 0.3)));
        const gap = d === 'extension' ? 8 : 10;
        const base = { w, h: h2, top, bottom, settingY: top - 10, clip: { x0: padL, x1: w - padR, top, bottom: top + clipH } };
        if (d === 'extension') {
            const machH = 54;
            return { ...base, lane: { x0: padL, x1: w - padR, top: top + clipH + gap, bottom: bottom - machH - 22 }, mach: { x0: padL, x1: w - padR, top: bottom - machH, bottom } };
        }
        return { ...base, lane: { x0: padL, x1: w - padR, top: top + clipH + gap, bottom }, mach: null };
    };

    useEffect(() => {
        const first = canvasRef.current;
        if (!first) return undefined;
        let raf = 0;
        const css = getComputedStyle(first.parentElement);
        const v = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
        const col = {
            drums: v('--gen-2', '#7fb0c4'),
            bass: v('--gen-1', '#7fb39b'),
            guitar: v('--gen-5', '#dbb170'),
            keys: v('--gen-3', '#a395c9'),
            vol: '#ffffff',
            pan: v('--teal', '#7cc4b8'),
            filter: v('--gen-4', '#d08fa8'),
            send: v('--gen-6', '#d08a80'),
            coral: v('--gen-6', '#d08a80'),
            goldBright: v('--gold-bright', '#f0d48a'),
            white: '#ffffff',
            inkSoft: 'rgba(255, 255, 255, 0.62)',
            inkFaint: 'rgba(255, 255, 255, 0.38)',
            grid: 'rgba(255, 255, 255, 0.08)',
            gridBar: 'rgba(255, 255, 255, 0.2)',
            line: 'rgba(255, 255, 255, 0.22)',
        };
        const monoFace = v('--mono', 'monospace');
        const mono = `11.5px ${monoFace}`;
        const monoSmall = `10px ${monoFace}`;

        // the lane's path from its points, exact for step and line, sampled for
        // a curve (16 per segment)
        function lanePath(g2, pts, shape, xOf, yOf) {
            g2.beginPath();
            if (!pts.length) return;
            g2.moveTo(xOf(0), yOf(pts[0].v));
            for (let i = 0; i < pts.length; i += 1) {
                const a = pts[i]; const b = pts[i + 1];
                if (i === 0 && a.t > 0) g2.lineTo(xOf(a.t), yOf(a.v));
                if (!b) { g2.lineTo(xOf(BEATS), yOf(a.v)); break; }
                if (shape === 'step') { g2.lineTo(xOf(b.t), yOf(a.v)); g2.lineTo(xOf(b.t), yOf(b.v)); continue; }
                if (shape === 'line' || b.t - a.t < 1e-9) { g2.lineTo(xOf(b.t), yOf(b.v)); continue; }
                for (let k = 1; k <= 16; k += 1) { const t = a.t + ((b.t - a.t) * k) / 16; g2.lineTo(xOf(t), yOf(valueAt(pts, shape, t))); }
            }
        }

        function draw() {
            const canvas = canvasRef.current;
            if (!canvas) { raf = requestAnimationFrame(draw); return; }
            const g2 = canvas.getContext('2d');
            const s = stateRef.current;
            const d = depthRef.current;
            const vdd = vdRef.current;
            const isHeld = heldRef.current;
            const tsk = s.task ? TASKS[s.task] : null;
            const dpr = window.devicePixelRatio || 1;
            const w = canvas.clientWidth;
            const hgt = canvas.clientHeight;
            if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(hgt * dpr)) {
                canvas.width = Math.round(w * dpr);
                canvas.height = Math.round(hgt * dpr);
            }
            g2.setTransform(dpr, 0, 0, dpr, 0, 0);
            g2.clearRect(0, 0, w, hgt);
            const g = geom(w, hgt, d);
            const C = g.clip; const L = g.lane;
            const xOf = (t) => L.x0 + (t / BEATS) * (L.x1 - L.x0);
            const tOf = (x) => ((x - L.x0) / (L.x1 - L.x0)) * BEATS;
            const pad = 7;
            const yOf = (val) => L.bottom - pad - Math.max(0, Math.min(1, val)) * (L.bottom - L.top - pad * 2);
            const vOf = (y) => (L.bottom - pad - y) / (L.bottom - L.top - pad * 2);
            const tcol = col[s.target];
            const pcol = col[s.part];
            g2.font = mono; g2.lineWidth = 1;
            const gr = graphRef.current;
            const frac = playingRef.current && gr ? gr.position() : null;
            const beatNow = frac == null ? 0 : frac * BEATS;

            // ---- A-level: the bars the stem names, shaded under everything ----
            if (d === 'alevel' && tsk && tsk.part === s.part && tsk.target === s.target) {
                const [a, b] = tsk.span;
                g2.fillStyle = col.goldBright; g2.globalAlpha = 0.07;
                g2.fillRect(xOf(a), C.top, xOf(b) - xOf(a), L.bottom - C.top);
                g2.globalAlpha = 1;
            }

            // ---- the grid: beats faint, bars stronger, numbered under the lane ----
            for (let t = 0; t <= BEATS; t += 1) {
                const x = Math.round(xOf(t)) + 0.5;
                const isBar = t % 4 === 0;
                g2.strokeStyle = isBar ? col.gridBar : col.grid;
                g2.beginPath(); g2.moveTo(x, C.top); g2.lineTo(x, L.bottom); g2.stroke();
                if (isBar && t < BEATS) { g2.fillStyle = col.inkFaint; g2.font = monoSmall; g2.textAlign = 'left'; g2.fillText(`bar ${t / 4 + 1}`, x + 4, L.bottom + 14); }
            }

            // ---- the clip: the part's envelope as a region ----
            g2.fillStyle = pcol; g2.globalAlpha = 0.12; g2.fillRect(C.x0, C.top, C.x1 - C.x0, C.bottom - C.top); g2.globalAlpha = 1;
            g2.strokeStyle = pcol; g2.globalAlpha = 0.6; g2.strokeRect(C.x0 + 0.5, C.top + 0.5, C.x1 - C.x0 - 1, C.bottom - C.top - 1); g2.globalAlpha = 1;
            const env = envRef.current[s.part];
            const mid = (C.top + C.bottom) / 2 + 4;
            const half = (C.bottom - C.top) / 2 - 8;
            if (env) {
                g2.fillStyle = pcol; g2.globalAlpha = 0.55;
                g2.beginPath();
                const n = env.env.length;
                for (let i = 0; i < n; i += 1) { const x = C.x0 + ((i + 0.5) / n) * (C.x1 - C.x0); const y = mid - env.env[i] * half; if (i === 0) g2.moveTo(x, y); else g2.lineTo(x, y); }
                for (let i = n - 1; i >= 0; i -= 1) { const x = C.x0 + ((i + 0.5) / n) * (C.x1 - C.x0); g2.lineTo(x, mid + env.env[i] * half); }
                g2.closePath(); g2.fill(); g2.globalAlpha = 1;
                // the transients, ticked under the region
                g2.strokeStyle = col.inkSoft;
                for (const i of env.onsets) { const x = Math.round(C.x0 + ((i + 0.5) / n) * (C.x1 - C.x0)) + 0.5; g2.beginPath(); g2.moveTo(x, C.bottom - 6); g2.lineTo(x, C.bottom - 1); g2.stroke(); }
            } else {
                g2.fillStyle = col.inkFaint; g2.font = monoSmall; g2.textAlign = 'center'; g2.fillText('loading the clip', (C.x0 + C.x1) / 2, mid + 3);
            }
            g2.fillStyle = pcol; g2.font = monoSmall; g2.textAlign = 'left';
            g2.fillText(PARTS[s.part].short.toUpperCase(), C.x0 + 6, C.top + 11);
            g2.fillStyle = col.inkFaint; g2.textAlign = 'right'; g2.fillText('transients ticked', C.x1 - 6, C.top + 11);

            // ---- the lane ----
            g2.strokeStyle = col.line; g2.strokeRect(L.x0 + 0.5, L.top + 0.5, L.x1 - L.x0 - 1, L.bottom - L.top - 1);
            g2.fillStyle = col.inkFaint; g2.font = monoSmall; g2.textAlign = 'right';
            for (const [val, label] of TARGETS[s.target].ticks) {
                const y = Math.round(yOf(val)) + 0.5;
                g2.strokeStyle = col.grid; g2.beginPath(); g2.moveTo(L.x0, y); g2.lineTo(L.x1, y); g2.stroke();
                g2.fillText(label, L.x0 - 5, y + 3.5);
            }
            // the rest line: where the parameter sits with no lane
            const restY = Math.round(yOf(TARGETS[s.target].rest)) + 0.5;
            g2.save(); g2.setLineDash([3, 4]); g2.strokeStyle = col.inkFaint; g2.beginPath(); g2.moveTo(L.x0, restY); g2.lineTo(L.x1, restY); g2.stroke(); g2.restore();
            g2.fillStyle = tcol; g2.textAlign = 'left'; g2.font = monoSmall;
            g2.fillText(`${(TARGETS[s.target].lane || TARGETS[s.target].label).toUpperCase()} · ${PARTS[s.part].short.toLowerCase()}`, L.x0 + 6, L.top + 11);

            // the stem's own lane, dashed, at A-level
            if (d === 'alevel' && tsk && tsk.part === s.part && tsk.target === s.target) {
                g2.save(); g2.setLineDash([5, 4]); g2.strokeStyle = col.goldBright; g2.lineWidth = 1.5; g2.globalAlpha = 0.9;
                lanePath(g2, tsk.model.points, tsk.model.shape, xOf, yOf); g2.stroke();
                g2.restore();
                g2.fillStyle = col.goldBright; g2.font = monoSmall; g2.textAlign = 'left';
                g2.fillText(`only ${listBars(Array.from({ length: (tsk.span[1] - tsk.span[0]) / 4 }, (_, i) => tsk.span[0] / 4 + 1 + i))}`, xOf(tsk.span[0]) + 4, L.top + 24);
            }

            // the lane itself, filled to the floor, then the line, then the points
            const pts = s.points;
            lanePath(g2, pts, s.shape, xOf, yOf);
            g2.lineTo(xOf(BEATS), L.bottom - 1); g2.lineTo(xOf(0), L.bottom - 1); g2.closePath();
            g2.fillStyle = tcol; g2.globalAlpha = isHeld ? 0.05 : 0.13; g2.fill(); g2.globalAlpha = 1;
            lanePath(g2, pts, s.shape, xOf, yOf);
            g2.strokeStyle = tcol; g2.lineWidth = isHeld ? 1 : 2; g2.globalAlpha = isHeld ? 0.45 : 1; g2.stroke(); g2.globalAlpha = 1; g2.lineWidth = 1;
            if (d === 'extension') {
                // what the engine plays: the sampled values, every eighth of a beat
                g2.fillStyle = tcol; g2.globalAlpha = 0.7;
                for (let t = 0; t < BEATS; t += 1 / 8) { g2.beginPath(); g2.arc(xOf(t), yOf(valueAt(pts, s.shape, t)), 1.3, 0, Math.PI * 2); g2.fill(); }
                g2.globalAlpha = 1;
            }
            const handles = pts.map((p, i) => ({ i, x: xOf(p.t), y: yOf(p.v), t: p.t, v: p.v }));
            const dragging = dragRef.current;
            const hv = hoverRef.current;
            const dense = handles.length > 24; // a touched passage: one point a 16th
            for (const hnd of handles) {
                const hot = (dragging && dragging.i === hnd.i) || (hv && hv.kind === 'point' && hv.i === hnd.i);
                g2.beginPath(); g2.arc(hnd.x, hnd.y, hot ? 6.5 : dense ? 2.5 : 4.5, 0, Math.PI * 2);
                g2.fillStyle = tcol; g2.fill();
                g2.strokeStyle = '#17172b'; g2.lineWidth = 1.5; g2.stroke(); g2.lineWidth = 1;
            }

            // ---- A-level: the faults marked where they are ----
            if (d === 'alevel' && vdd.key !== 'free') {
                const f = vdd.faults[0];
                g2.font = monoSmall;
                if (!f) {
                    g2.fillStyle = col.goldBright; g2.textAlign = 'right'; g2.fillText('as directed', L.x1 - 6, L.top + 11);
                } else {
                    g2.fillStyle = col.coral; g2.textAlign = 'right';
                    const word = { placement: 'landed off the barline', direction: 'the wrong way round', position: 'not full travel', scope: 'leaks outside the bars', smooth: 'not smooth', start: 'wrong at the start', rate: 'too slow to rise', arrival: 'does not arrive' }[f.id] || f.id;
                    g2.fillText(word, L.x1 - 6, L.top + 11);
                    g2.strokeStyle = col.coral; g2.fillStyle = col.coral; g2.lineWidth = 1.5;
                    if (f.id === 'placement' && f.edge != null) {
                        const x0 = xOf(f.edge); const x1 = xOf(f.edge + f.off); const y = L.top + 34;
                        g2.beginPath(); g2.moveTo(x0, y - 5); g2.lineTo(x0, y + 5); g2.moveTo(x0, y); g2.lineTo(x1, y); g2.moveTo(x1, y - 5); g2.lineTo(x1, y + 5); g2.stroke();
                        g2.textAlign = 'left'; g2.fillText(`${f.off > 0 ? '+' : '−'}${f.ms} ms`, Math.max(x0, x1) + 5, y + 3.5);
                    }
                    if (f.id === 'scope' && f.bar) {
                        const x0 = xOf((f.bar - 1) * 4); const x1 = xOf(f.bar * 4);
                        g2.beginPath(); g2.moveTo(x0 + 2, L.bottom - 3.5); g2.lineTo(x1 - 2, L.bottom - 3.5); g2.stroke();
                        g2.textAlign = 'center'; g2.fillText('should not move', (x0 + x1) / 2, L.bottom - 8);
                    }
                    if (f.id === 'arrival' && f.at != null) {
                        const x = xOf(f.at) - 2;
                        g2.beginPath(); g2.moveTo(x, yOf(f.have)); g2.lineTo(x, yOf(f.want)); g2.stroke();
                        g2.beginPath(); g2.moveTo(x - 4, yOf(f.want)); g2.lineTo(x + 4, yOf(f.want)); g2.stroke();
                        g2.textAlign = 'right'; g2.fillText('short', x - 6, (yOf(f.have) + yOf(f.want)) / 2 + 3.5);
                    }
                    if (f.id === 'position' && f.span) {
                        const x = f.atEnd === false || f.atEnd === undefined ? xOf(f.span[0]) + 3 : xOf(f.span[1]) - 3;
                        g2.beginPath(); g2.moveTo(x, yOf(f.have)); g2.lineTo(x, yOf(f.want)); g2.stroke();
                        g2.textAlign = 'left'; g2.fillText('to the edge', x + 5, yOf((f.have + f.want) / 2) + 3.5);
                    }
                    if (f.id === 'direction' && tsk) {
                        const y = L.top + 34; const x0 = xOf(tsk.span[0]) + 6; const x1 = xOf(tsk.span[1]) - 6;
                        g2.beginPath(); g2.moveTo(x0, y); g2.lineTo(x1, y); g2.lineTo(x1 - 6, y - 4); g2.moveTo(x1, y); g2.lineTo(x1 - 6, y + 4); g2.stroke();
                        g2.textAlign = 'left'; g2.fillText('left, then right', x0, y - 6);
                    }
                    g2.lineWidth = 1;
                }
            }

            // ---- Extension: the channel, and what the DAW stores ----
            if (d === 'extension' && g.mach) {
                const M = g.mach;
                const lit = TARGETS[s.target].node;
                const boxW = Math.min(96, (M.x1 - M.x0 - 24) / CHAIN.length - 14);
                const gapX = (M.x1 - M.x0 - boxW * CHAIN.length) / (CHAIN.length - 1);
                const y = M.top + 14; const bh = 22;
                g2.font = monoSmall; g2.textAlign = 'left'; g2.fillStyle = col.inkFaint;
                g2.fillText(`the channel: where this lane writes · ${lit}, ${lit === 'filter' ? 'inside the insert' : 'on the channel'}`, M.x0, M.top + 8);
                CHAIN.forEach((name, i) => {
                    const x = M.x0 + i * (boxW + gapX);
                    const on = name === lit;
                    g2.strokeStyle = on ? tcol : col.line; g2.lineWidth = on ? 1.5 : 1;
                    if (on) { g2.fillStyle = tcol; g2.globalAlpha = 0.18; g2.fillRect(x, y, boxW, bh); g2.globalAlpha = 1; }
                    g2.strokeRect(x + 0.5, y + 0.5, boxW - 1, bh - 1);
                    g2.fillStyle = on ? tcol : col.inkSoft; g2.textAlign = 'center'; g2.font = mono;
                    g2.fillText(name, x + boxW / 2, y + bh / 2 + 4);
                    if (i < CHAIN.length - 1) {
                        const ax = x + boxW + 3; const ay = y + bh / 2;
                        g2.strokeStyle = col.line; g2.lineWidth = 1; g2.beginPath(); g2.moveTo(ax, ay); g2.lineTo(ax + gapX - 6, ay); g2.stroke();
                        g2.beginPath(); g2.moveTo(ax + gapX - 6, ay - 3); g2.lineTo(ax + gapX - 2, ay); g2.lineTo(ax + gapX - 6, ay + 3); g2.stroke();
                    }
                });
                g2.lineWidth = 1;
                // what the DAW stores, one line
                const stored = pts.slice(0, 8).map((p) => `${fmtBeat(p.t).replace('bar ', '').replace(' beat ', '.')} ${fmtValue(s.target, p.v)}`).join(' · ');
                g2.fillStyle = col.inkSoft; g2.font = monoSmall; g2.textAlign = 'left';
                g2.fillText(`stored: ${pts.length} point${pts.length === 1 ? '' : 's'} · ${stored}${pts.length > 8 ? ' …' : ''} · played: ${CURVE_N.toLocaleString('en-GB')} values a pass`, M.x0, M.bottom - 2);
            }

            // ---- the playhead and the live value ----
            let liveV = valueAt(pts, s.shape, beatNow);
            if (isHeld) liveV = TARGETS[s.target].rest;
            if (frac != null) {
                const x = Math.round(xOf(beatNow)) + 0.5;
                g2.strokeStyle = col.white; g2.globalAlpha = 0.8; g2.beginPath(); g2.moveTo(x, C.top - 4); g2.lineTo(x, L.bottom + 4); g2.stroke(); g2.globalAlpha = 1;
                g2.beginPath(); g2.arc(x, yOf(liveV), 5, 0, Math.PI * 2); g2.fillStyle = col.white; g2.fill(); g2.strokeStyle = tcol; g2.lineWidth = 2; g2.stroke(); g2.lineWidth = 1;
            }
            const liveInt = Math.round(liveV * 100);
            if (liveInt !== liveRef.current && frameRef.current % 4 === 0) { liveRef.current = liveInt; setLive(liveInt); }
            if (readRef.current) {
                const txt = frac == null ? '' : ` · ${fmtBeat(Math.floor(beatNow * 2) / 2)} · ${fmtValue(s.target, liveV)}`;
                if (readRef.current.textContent !== txt) readRef.current.textContent = txt;
            }

            // the setting line, for the depth, stopping short of the legend
            const segs = [`${SONG.bars} bars`, `${PARTS[s.part].short.toLowerCase()} · ${TARGETS[s.target].label.toLowerCase()} · ${SHAPES[s.shape].label.toLowerCase()}`];
            segs.push(isHeld ? 'lane off' : s.presetId ? PRESETS.find((p) => p.id === s.presetId)?.name.toLowerCase() : 'your lane');
            if (d !== 'core' && vdd.key !== 'free') segs.push(vdd.ok ? 'as directed' : 'not as directed');
            if (d === 'extension') segs.push(`grid ${GRIDS[s.grid].label.toLowerCase()}`);
            g2.fillStyle = col.goldBright; g2.font = mono; g2.textAlign = 'left';
            if (frameRef.current % 20 === 0 && legendRef.current) legendWRef.current = legendRef.current.getBoundingClientRect().width;
            frameRef.current += 1;
            const room = w - 18 - legendWRef.current - 16 - (L.x0 + 6);
            let label = segs.join(' · ');
            while (segs.length > 2 && g2.measureText(label).width > room) { segs.pop(); label = segs.join(' · '); }
            g2.fillText(label, L.x0, g.settingY);

            // the bar counter in the eyebrow
            if (barRef.current) {
                const txt = frac == null ? '' : ` · bar ${Math.min(BARS, Math.floor(frac * BARS) + 1)} of ${BARS}`;
                if (barRef.current.textContent !== txt) barRef.current.textContent = txt;
            }

            geomRef.current = { g, handles, xOf, tOf, yOf, vOf };
            // what this frame drew, told to the DOM for check-bench (laws 18 and 21)
            const hIdx = handles.length > 1 ? 1 : 0;
            const hnd = handles[hIdx];
            const handleTag = hnd ? `${Math.round(hnd.x)}:${Math.round(hnd.y)}` : '';
            if (canvas.dataset.handle !== handleTag) canvas.dataset.handle = handleTag;
            const pointTag = hnd ? hnd.v.toFixed(3) : '';
            if (canvas.dataset.point !== pointTag) canvas.dataset.point = pointTag;
            const laneTag = `${pts.length}:${pts.map((p) => `${p.t}/${p.v}`).join(',')}`;
            if (canvas.dataset.lane !== laneTag) canvas.dataset.lane = laneTag;
            const stageTag = stageOf(d);
            if (canvas.dataset.stage !== stageTag) canvas.dataset.stage = stageTag;
            if (canvas.dataset.verdict !== vdd.key) canvas.dataset.verdict = vdd.key;

            raf = requestAnimationFrame(draw);
        }
        raf = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(raf);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // A point is dragged; the empty lane takes a new point where you press.
    const hitPoint = (px, py) => {
        const gm = geomRef.current;
        if (!gm) return null;
        let best = null;
        for (const h of gm.handles) {
            const dist = Math.hypot(h.x - px, h.y - py);
            if (dist <= 10 && (!best || dist < best.dist)) best = { ...h, dist };
        }
        return best;
    };
    const inLane = (px, py) => {
        const gm = geomRef.current;
        if (!gm) return false;
        const L = gm.g.lane;
        return px >= L.x0 && px <= L.x1 && py >= L.top && py <= L.bottom;
    };
    const onStageDown = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const px = e.clientX - rect.left; const py = e.clientY - rect.top;
        const gm = geomRef.current;
        const hit = hitPoint(px, py);
        if (hit) {
            e.currentTarget.dataset.drag = `point:${hit.i}`;
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            dragRef.current = { i: hit.i };
            return;
        }
        if (gm && inLane(px, py)) {
            e.currentTarget.dataset.drag = 'add';
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            let idx = -1;
            setState((s) => { const r = addPoint(s, gm.tOf(px), gm.vOf(py)); idx = r.index; return r.state; });
            dragRef.current = { i: idx, pending: true, px, py };
            touch('point');
            return;
        }
        e.currentTarget.dataset.drag = '';
    };
    const onStageMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const px = e.clientX - rect.left; const py = e.clientY - rect.top;
        const gm = geomRef.current;
        const dg = dragRef.current;
        if (dg && gm) {
            if (dg.pending) {
                // the index the add gave us is known once the state landed
                const pts = stateRef.current.points;
                const t = gm.tOf(dg.px);
                let best = 0; let bd = Infinity;
                pts.forEach((p, i) => { const dd = Math.abs(p.t - t); if (dd <= bd) { bd = dd; best = i; } });
                dg.i = best; dg.pending = false;
            }
            setState((s) => movePoint(s, dg.i, gm.tOf(px), gm.vOf(py)));
            if (!dg.moved) { dg.moved = true; touch('point'); }
            return;
        }
        if (!teach) { if (hover) setHover(null); return; }
        const hit = hitPoint(px, py);
        if (hit) {
            if (hover && hover.kind === 'point' && hover.i === hit.i) return;
            setHover({ kind: 'point', i: hit.i, t: hit.t, v: hit.v, x: hit.x, y: hit.y, stageW: rect.width, stageH: rect.height });
            return;
        }
        if (gm && inLane(px, py)) {
            const t = Math.floor(gm.tOf(px) * 2) / 2;
            if (hover && hover.kind === 'lane' && hover.t === t) return;
            setHover({ kind: 'lane', t, v: gm.vOf(py), x: px, y: py, stageW: rect.width, stageH: rect.height });
            return;
        }
        if (hover) setHover(null);
    };
    const onStageUp = (e) => {
        if (!dragRef.current) return;
        dragRef.current = null;
        try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* gone */ }
    };
    const onStageDouble = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const hit = hitPoint(e.clientX - rect.left, e.clientY - rect.top);
        if (!hit) return;
        setState((s) => removePoint(s, hit.i));
        setHover(null);
        touch('point');
    };

    // ---- drawer content ----
    const topicHref = (slug) => memberTopicHref(null, slug, studioOrigin);
    const drawerTabs = useMemo(() => [
        {
            id: 'reference',
            label: 'Reference',
            render: () => (
                <>
                    <h2>Automation, in the spec&apos;s words</h2>
                    <p>Automation is a parameter changing over time, drawn or recorded into a lane and played back the same way every pass. The spec names what gets automated (volume, panning, effect parameters, sends, instrument parameters), the shapes the data takes (linear, curved, step) and the timing (grid-synchronised or free-form, drawn, recorded, edited). The practical paper sets one move a year and marks the doing.</p>
                    <h3>Terms</h3>
                    <dl>
                        <dt>Lane</dt><dd>The strip under a track where one parameter&apos;s value is drawn against time. One lane per parameter; this bench shows one at a time.</dd>
                        <dt>Breakpoint</dt><dd>A point on the lane: a time and a value. What the DAW stores. Everything between two points is the shape&apos;s rule, not data.</dd>
                        <dt>Step</dt><dd>The value holds until the next point, then jumps. The papers&apos; hard-pan-by-bar move is a step; so is a mute.</dd>
                        <dt>Linear</dt><dd>A constant rate from one point to the next: the fade, the sweep, the ramp to a named level.</dd>
                        <dt>Curved</dt><dd>The rate changes through the move, fast then easing (or the reverse): the filter that opens with intent, the fade that breathes.</dd>
                        <dt>Grid-synchronised</dt><dd>Points snap to the bar or the beat, so a jump lands on the barline and the transient.</dd>
                        <dt>Free-form</dt><dd>Points land where you put them, which is what a recorded pass gives you.</dd>
                        <dt>Read · Write · Touch · Latch</dt><dd>The DAW&apos;s automation modes. Read plays the lane. Write records everything as it passes, erasing what was there. Touch records while you hold the control and returns to the lane when you let go. Latch keeps writing the last value after you let go. The Value dial on this bench is Touch.</dd>
                        <dt>Channel or plug-in</dt><dd>A fader, a pan pot and a send live on the channel; a cut-off lives inside the insert. Automating one is not automating the other, and the written paper asks which.</dd>
                        <dt>LFO</dt><dd>Not automation. A low-frequency oscillator is a modulation source that moves a parameter in a cycle by itself; a lane is drawn or recorded. Both are on the spec, in different places (1.12 Modulation for the LFO).</dd>
                    </dl>
                    <h3>In your DAW</h3>
                    <table>
                        <thead><tr><th>On this bench</th><th>Ableton Live</th><th>Logic Pro</th></tr></thead>
                        <tbody>
                            <tr><td>The lane</td><td>Show automation (A); pick the parameter at the top of the track</td><td>Show automation (A); pick the parameter on the track header</td></tr>
                            <tr><td>Add a point</td><td>Click the line; double-click removes</td><td>Click the line; double-click removes</td></tr>
                            <tr><td>Shape between points</td><td>Alt-drag a segment to curve it; draw mode (B) for steps on the grid</td><td>Drag a segment&apos;s middle handle to curve it; pencil for steps</td></tr>
                            <tr><td>Grid</td><td>The grid setting; Alt for free-form</td><td>Snap to grid; Control for free-form</td></tr>
                            <tr><td>Touch</td><td>Arm automation (the arm button), move the control while playing; re-enable to return to the lane</td><td>Set the track&apos;s mode to Touch, move the control while playing</td></tr>
                        </tbody>
                    </table>
                    <p className={styles.source}>As the controls appear in Live 12 and Logic Pro 11. Check against your own version if they move.</p>
                    <h3>Beyond the paper<span className={styles.ext}>EXT</span></h3>
                    <dl>
                        <dt>What plays is a rule, not the points</dt><dd>The engine samples the shape between points once a millisecond and books the values ahead of the beat. Two lanes with the same points and different shapes are different sounds.</dd>
                        <dt>Why a step must land on the transient</dt><dd>The attack of a note is where the ear places it. A pan that arrives 70 ms late lets the attack play in the old position; the rest of the note moving is heard as a drift, not a placement.</dd>
                        <dt>Sends and depth</dt><dd>A send lane is not a level lane: more send is further back, not louder. A send that opens at a section boundary is heard as the room changing, which is what the listening paper asks you to name.</dd>
                    </dl>
                    <p className={styles.source}>The reading behind this bench is the topic&apos;s own Learn chapters and the 1.8 mark schemes and examiner reports, 2017 to 2023.</p>
                </>
            ),
        },
        {
            id: 'teacher',
            label: 'Teacher',
            render: () => (
                <>
                    <h2>What to listen for</h2>
                    <p>Press Play and the keys jump hard left for bar 2 and hard right for bar 3. Hold the lane off and the keys sit in the centre: that difference is the move. Every preset is a real practical re-scoped to these four bars, and the ones named for a fault are what the reports say candidates handed in. When you can hear the late step before the stage marks it, and say why the mark went, you are doing what the practical marks.</p>
                    <h3>What cost candidates marks</h3>
                    <p>2020, the pan: &quot;The majority of candidates were successful at panning the synth riff. Some weaker candidates were a little sloppy with the placement of automation so the transients were not hard panned properly.&quot;</p>
                    <p>2020, the filter: &quot;The most common problem that candidates had was that the cut-off frequency either started too low, or was too slow to rise so the synth riff was not audible in bar 10.&quot;</p>
                    <p>2022 AS, the ramp: &quot;Often done well, problems were uneven volume ramp and not reaching a suitable level by the end of the chord. Some students failed to get a suitable final level because the volume envelope of the patch had a fast decay.&quot;</p>
                    <p>2023, the sweep: &quot;most candidates seem to be able to perform basic automation mix moves. There were a few who inverted the answer panning from right to left.&quot;</p>
                    <p>2022, the part that was not there: candidates who omitted the scratch vocal from the mix &quot;scored 0 because there was no part to pan&quot;.</p>
                    <p className={styles.source}>Source: Edexcel 9MT0 mark schemes and Principal Examiner reports, 2017 AS Q5(a), 2019 AS Q5(b), 2020 A Q5(a) and Q5(b), 2021 A Q5(a), 2022 AS Q2(c), 2022 A Q5(b), 2023 A Q5(b).</p>
                    <p>Those are the moves on this bench: press <b>Late step</b> and hear the first note of bar 2 play centred; press <b>Backwards</b> and say what is wrong before the stage does; press <b>Slow to rise</b> and hear the keys go missing; press <b>Falls short</b> and count the marks gone.</p>
                    <h3>Do these now</h3>
                    <ul>
                        <li>Press <b>Hard pan</b>, play, and hold the lane off on bar 2. Say what the move adds in one sentence: the part, the bars, the positions, the order.</li>
                        <li>Press <b>Late step</b>, switch to A-level, and read the bracket. Then set the grid to Bar and drag the jump onto the line; watch the verdict change.</li>
                        <li>Press <b>Sweep</b>, then switch the shape to Step. Say which word in the stem the step breaks.</li>
                        <li>Press <b>Filter build</b>, then switch the target to Send. Same shape, different job: say what you hear the room do.</li>
                        <li>Press <b>Ramp</b> and hold the lane off at bar 3. Then drag the first point of the ramp down until the keys are inaudible, and say which of the three marks that loses.</li>
                        <li>Switch to Extension, press Play, and grab the Value dial through bar 2. Look at what the lane recorded, and say what Latch would have done differently.</li>
                    </ul>
                    <h3>Exam practice</h3>
                    <ExamCallout
                        prompt="Apply automated panning to the synth riff. Only bars 4–5 should be affected; all other bars should be panned to the centre. Bar 4 should be panned hard left. Bar 5 should be panned hard right. (3 marks, 2020)"
                        answer="The scheme is four words, &quot;L – R as directed&quot;, so the marks are in the doing: a step lane on the riff's pan, centre until bar 4, hard left on the barline of bar 4, hard right on the barline of bar 5, centre again on bar 6. Grid on, the jumps on the transients. The report's deduction was placement: transients not hard panned because the step landed late."
                    />
                    <ExamCallout
                        prompt="Apply volume automation to the long chord that plays from the end of bar 24 to the end of bar 25. The chord should be quiet but still audible when it starts playing. It should gradually get louder through to the end of bar 25, finishing at the original level. There must be no other volume changes in the keyboard part. (3 marks, 2022 AS)"
                        answer="One mark each: audible at the start; the rise smooth; the end at the original level with nothing else changed. A linear lane from about −17 dB at the chord's start to 0 dB at the end of bar 25, flat at 0 dB everywhere else. The report's faults: an uneven ramp, and not reaching the level, sometimes because the patch's own decay fought the ramp."
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
                    <a className={styles.conn} href={topicHref('stereo')}>
                        <i>1.10 Stereo</i>
                        <b>What a pan is</b>
                        <span>Six of the topic&apos;s eight practicals are pan moves. The pan law, hard positions and the stereo image are that topic; the lane only moves the pot.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('eq-filters')}>
                        <i>1.11 EQ and filters</i>
                        <b>The cut-off the lane opens</b>
                        <span>The filter build is a low-pass filter with its cut-off on a timeline. What a cut-off is, and what a slope does, is the EQ bench.</span>
                    </a>
                    <a className={topicHref ? styles.conn : styles.conn} href={topicHref('balance-blend')}>
                        <i>1.13 Balance and blend</i>
                        <b>The fader that moves</b>
                        <span>A balance that is right in the verse is wrong in the chorus. Volume automation is the desk&apos;s fader given a timeline; the ramp preset is one bar of it.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('reverb')}>
                        <i>1.12 Reverb</i>
                        <b>A send on a timeline</b>
                        <span>Put the lane on Send and the same shape opens the room instead of the tone. Depth as a move rather than a setting.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('modulation')}>
                        <i>1.12 Modulation</i>
                        <b>The LFO is not a lane</b>
                        <span>Tremolo and auto-pan move a parameter in a cycle by themselves. That is a modulation source; the spec keeps it apart from drawn automation, and so does this bench.</span>
                    </a>
                </>
            ),
        },
    ], [studioOrigin]);

    // ---- the bench's one line to the student ----
    let say;
    if (announce) {
        say = <><b>{DEPTHS.find((d) => d.id === announce)?.label}:</b> {DEPTH_LINES[announce]}</>;
    } else if (depth === 'alevel') {
        const segs = judge({ state, last });
        const colon = segs[0].text.indexOf(':');
        const lead = colon > 0 && colon < 48 ? segs[0].text.slice(0, colon + 1) : null;
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
        const next = nextMove(state);
        say = teach
            ? <>{hearingLine(state)} <b>Try:</b> {next}.</>
            : <><b>Try:</b> {next.charAt(0).toUpperCase() + next.slice(1)}.</>;
    }

    // ---- console ----
    const partOptions = PART_IDS.map((id) => ({ id, label: PARTS[id].short, title: `${PARTS[id].label}: the lane moves to this part` }));
    const targetOptions = TARGET_IDS.map((id) => ({ id, label: TARGETS[id].label, title: `${TARGETS[id].label}: the same points, on this parameter` }));
    const shapeOptions = SHAPE_IDS.map((id) => ({ id, label: SHAPES[id].label, title: SHAPES[id].does }));
    const gridOptions = GRID_IDS.map((id) => ({ id, label: GRIDS[id].label, title: GRIDS[id].short }));
    const verdictWord = vd.key === 'free' ? 'no stem' : vd.ok ? 'as directed' : 'not yet';
    const nodeWord = { vol: 'the fader', pan: 'the pan pot', filter: 'the cut-off, inside the insert', send: 'the send, into the room' }[state.target];
    const hearOptions = [{ id: 'mix', label: 'the mix', title: 'All four parts, as the examiner hears the move' }, { id: 'solo', label: 'solo', title: 'This part alone: the DAW\'s S button, for hearing exactly what the lane does to it' }];

    const consoleSlot = (
        <>
            <PlayColumn
                playing={playing}
                onTogglePlay={togglePlay}
                onHoldDry={holdOff}
                level={state.level}
                onLevel={(v2) => setState((s) => setLevel(s, v2))}
                teach={teach}
                holdLabel="hold: lane off"
                holdTitle="Hold to hear the loop with the lane switched off"
                holdWhy="switches the lane off while you hold it, so you hear what the move is adding"
                playWhy="runs the four bars round"
            />

            <div className={`${styles.sec} ${styles.secPart}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>Part</span><span className={styles.value}>{PARTS[state.part].short}</span></div>
                <Chips label="Part" options={partOptions} value={state.part} onChange={choosePart} />
                <Chips label="Hear" options={hearOptions} value={solo ? 'solo' : 'mix'} onChange={(id) => { setSolo(id === 'solo'); touch('solo'); }} />
                <div className={styles.meaning}>{solo ? `${PARTS[state.part].short.toLowerCase()} alone` : task && task.part === state.part ? 'the part the stem names' : 'the lane moves with you'}</div>
                <Why>The papers name one part: the keyboards in 2019, a synth riff in 2020, the bass in 2021, a riser in the drums in 2023, a vocal phrase in 2017. The lane belongs to whichever part is chosen here; the other three play as they are.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secTarget}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>Target</span><span className={styles.value}>{TARGETS[state.target].label}</span></div>
                <Chips label="Target" options={targetOptions} value={state.target} onChange={chooseTarget} />
                <div className={styles.meaning}>writes to {nodeWord}</div>
                <Why>The parameter the lane writes to. The points stay when you switch, so the same shape can be heard doing four jobs: a step on the pan is a rhythmic effect, on the filter a gate, on a send a mistake. Volume, pan and send live on the channel; the cut-off lives inside the insert.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secJoin}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>Shape</span><span className={styles.value}>{SHAPES[state.shape].label}</span></div>
                <Chips label="Shape" options={shapeOptions} value={state.shape} onChange={chooseShape} />
                <div className={styles.meaning}>{SHAPES[state.shape].short}</div>
                <Why>How the value gets from one point to the next. The spec&apos;s three data types: step (hold, then jump), linear (a constant rate), curved (fast, then easing in). The stems say which: a list of hard positions is a step; &quot;smoothly&quot; is a ramp.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secGrid}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>Grid</span><span className={styles.value}>{GRIDS[state.grid].label}</span></div>
                <Chips label="Grid" options={gridOptions} value={state.grid} onChange={chooseGrid} />
                <div className={styles.meaning}>{GRIDS[state.grid].short}</div>
                <Why>Grid-synchronised or free-form, the spec&apos;s two timings. On the bar or the beat a jump lands on the barline and the transient; free is where a hand-recorded pass puts its points, and where the 2020 report&apos;s sloppy placement came from.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secValue}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>Value</span><span className={styles.value}>{fmtValue(state.target, live / 100)}</span></div>
                <div className={styles.knob}>
                    <Dial
                        label={TARGETS[state.target].dial}
                        value={live}
                        min={0}
                        max={100}
                        step={1}
                        format={(x) => fmtValue(state.target, x / 100)}
                        pointer={TARGETS[state.target].colour}
                        pixels={160}
                        disabled={!playing}
                        onChange={write}
                        onRelease={release}
                        title={playing ? 'Moves with the lane. Grab it while the loop runs and the lane records your move (Touch)' : 'Press Play: the dial then moves with the lane, and writes to it when you grab it'}
                    />
                    <span className={styles.readout}>{playing ? (last === 'write' ? 'writing' : 'grab to write') : 'press Play'}</span>
                </div>
                <Why>The control the lane is moving, seen moving: the picture of automation in every DAW. While the loop runs, grab it and the lane records what you do at the playhead, a point every 16th of a beat whatever the grid, and hands the lane back when you let go. That is Touch mode.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secHear}`} data-teach={teach || undefined} data-lane="true">
                <div className={styles.secHead}><span className={styles.eyebrow}>What you should hear</span></div>
                <div className={styles.stats} aria-live="polite">
                    <div><b>{valueWord(state.target, live / 100)}</b><span>{TARGETS[state.target].noun} now</span></div>
                    <div><b>{SHAPES[state.shape].label} · {state.points.length} point{state.points.length === 1 ? '' : 's'}</b><span>the lane</span></div>
                    <div><b>{listBars(moving)}</b><span>where it moves</span></div>
                    {maths
                        ? <div><b>{verdictWord}</b><span>the scheme&apos;s checks{ext ? <span className={styles.ext}>EXT</span> : null}</span></div>
                        : <div><b>{held ? 'lane off' : solo ? `${PARTS[state.part].short.toLowerCase()} alone` : 'your lane'}</b><span>what is playing</span></div>}
                </div>
                {teach ? <div className={styles.meaning}>all from the points, the shape and the stem</div> : null}
                <Legal />
                <Why>Every word here comes from the lane: the value at the playhead in the stem&apos;s words, how many points and which shape join them, the bars it moves in, and whether it passes every check the scheme makes for the stem it was set.</Why>
            </div>
        </>
    );

    const bar = (
        <>
            <Presets presets={PRESETS} presetId={state.presetId} onPreset={choosePreset} wrap />
            <div className={styles.say} data-mode={mode} data-depth={depth}>{say}</div>
            <MoreButton open={further} onOpen={() => setFurther(true)} />
        </>
    );

    const more = further ? (
        <div className={styles.moreItem}>
            <span className={styles.eyebrow}>Lane</span>
            <Chips label="Lane" options={LANE_TOOLS} value={null} onChange={laneTool} />
            <span className={styles.chipNote}>{task ? 'back to the stem\'s own lane, or a flat lane at rest to draw from' : 'a flat lane at rest to draw from; press a preset for a stem'}</span>
        </div>
    ) : null;

    const stage = (
        <>
            <canvas
                ref={canvasRef}
                aria-label={maths ? (ext ? 'The clip, its automation lane, and the channel the lane writes to' : 'The clip, its automation lane, and the stem\'s own shape to match') : 'The clip and its automation lane, as a DAW draws them'}
                role="img"
                onPointerDown={onStageDown}
                onPointerMove={onStageMove}
                onPointerUp={onStageUp}
                onPointerCancel={onStageUp}
                onDoubleClick={onStageDouble}
                onPointerLeave={() => { if (!dragRef.current) setHover(null); }}
            />
            <div className={styles.stageNote}>
                <b>{SONG.title} · {SONG.bpm} bpm<span ref={barRef} /><span ref={readRef} /></b>
                <span>{ORIENTS[depth] || ORIENTS.core}</span>
            </div>
            <div ref={legendRef} className={`${styles.stageLegend} ${styles.legendTop}`} aria-hidden="true">
                <span><i style={{ background: PARTS[state.part].colour }} />clip</span>
                <span><i style={{ background: TARGETS[state.target].colour }} />lane</span>
                {depth === 'alevel' ? <span><i style={{ background: 'transparent', border: '1.5px dashed var(--gold-bright)', borderRadius: 0 }} />as directed</span> : null}
                {depth === 'alevel' ? <span><i style={{ background: 'var(--gen-6)' }} />fault</span> : null}
                {depth === 'extension' ? <span><i style={{ background: TARGETS[state.target].colour, opacity: 0.6, width: 5, height: 5 }} />played</span> : null}
            </div>
            {hover && teach ? (
                <div
                    className={styles.tip}
                    style={{
                        left: Math.max(12, Math.min(hover.stageW - 290, hover.x - 135)),
                        top: Math.max(44, Math.min(hover.stageH - 110, hover.y + 22)),
                    }}
                >
                    {hover.kind === 'point'
                        ? <><i>{fmtBeat(hover.t)} · {fmtValue(state.target, hover.v)}</i><p>{cap(valueWord(state.target, hover.v))}. Drag it; double-click to remove it.</p></>
                        : <><i>{fmtBeat(hover.t)}</i><p>The lane here is {valueWord(state.target, valueAt(state.points, state.shape, hover.t))} ({fmtValue(state.target, valueAt(state.points, state.shape, hover.t))}). Click to add a point.</p></>}
                </div>
            ) : null}
            {!began ? (
                <div className={styles.begin}>
                    <button type="button" className={styles.beginBtn} onClick={() => audio.start()}>
                        <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1.2v9.6L11 6z" fill="currentColor" /></svg>
                        <span>
                            Play the bench
                            <small>One loop, one lane, the move the paper sets. Headphones help.</small>
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

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
