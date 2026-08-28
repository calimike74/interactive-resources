'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BenchFrame from '@/components/bench/BenchFrame';
import { Dial, Chips, Why, MoreButton } from '@/components/bench/controls';
import { PlayColumn, Presets, Legal, ExamCallout, useBenchMode, useBenchDepth, DEPTHS } from '@/components/bench/BenchBits';
import { useBenchAudio, glide } from '@/components/bench/useBenchAudio';
import styles from '@/components/bench/bench.module.css';
import { memberTopicHref, useStudioArrival } from '@/lib/studio-return';
import { FILES, PATTERNS, SOURCE_IDS, scheduleBar } from '@/lib/bench/sources';
import { DEPTH_LINES, DEPTH_TEACH, judge, open as openMachine, hearingLine, nextMove } from '@/lib/bench/comp-depth';
import {
    MODE_IDS,
    MODES,
    DEFAULT_STATE,
    PRESETS,
    applyPreset,
    setParam,
    loopOf,
    runLoop,
    gainCurve,
    transferCurve,
    ratioLabel,
    hasRatio,
    hasKnee,
    isDownward,
    attackWord,
    releaseWord,
    fromPos,
    toPos,
    fmtDb,
    fmtMs,
    THRESH_MIN,
    THRESH_MAX,
    RATIO_MIN,
    RATIO_MAX,
    KNEE_MAX,
    ATTACK_MIN,
    ATTACK_MAX,
    RELEASE_MIN,
    RELEASE_MAX,
    MAKEUP_MAX,
} from '@/lib/bench/comp-model';

// The Dynamics bench (1.9), third bench to the Bench Standard. One set of
// numbers makes the sound and the picture: lib/bench/comp-model.js runs the
// gain computer over the loop's envelope once, the GainNode below plays that
// gain series as an automation curve, and the stage draws the same series
// against the beat. Three jobs (lib/bench/comp-depth.js): Core shows,
// A-level judges the way the paper does, Extension opens the machine.

const CODE = '1.9 Dynamics';
const TITLE = 'Dynamics bench';
const ORIENT = 'The filled shape is the sound after the processor; the ghost line is before. The coral band is what is being taken off. Drag the gold threshold line.';
const BPM = 110;
const LANE_MIN = -48; // the lane's floor in dB; 0 dB at the top
const GRID_DB = [0, -12, -24, -36, -48];
const CURVE_N = 97;
const dbToLin = (db) => Math.pow(10, db / 20);

// ---- the graph ------------------------------------------------------------
// input → comp (the gain series, by automation) → makeup → wet → master, with
// a dry path for hold-dry. The loop's curve is booked when the scheduler
// starts bar one of the pattern; a change mid-loop is re-booked from where
// the loop is now, so a dial move is heard at once.
function buildDynGraph(ctx, input, master) {
    const dry = ctx.createGain();
    dry.gain.value = 0;
    input.connect(dry);
    dry.connect(master);

    const comp = ctx.createGain();
    const makeup = ctx.createGain();
    const trim = ctx.createGain();
    const wet = ctx.createGain();
    input.connect(comp);
    comp.connect(makeup);
    makeup.connect(trim);
    trim.connect(wet);
    wet.connect(master);

    let curve = null; // Float32Array of linear gain over the loop
    let loopStart = null;
    let loopDur = 0;
    let dryHeld = false;

    function book(at, dur) {
        if (!curve || dur <= 0.02) return;
        try {
            comp.gain.setValueCurveAtTime(curve, at, dur - 0.002);
        } catch { /* an overlap: the next loop start books it cleanly */ }
    }
    // Called by the scheduler at bar one of the pattern.
    function schedule(barStart, dur) {
        loopStart = barStart;
        loopDur = dur;
        book(barStart, dur);
    }
    // Re-book the rest of the loop from where it is now.
    function rebook() {
        if (!curve || loopStart == null || !loopDur) return;
        const now = ctx.currentTime;
        try {
            if (comp.gain.cancelAndHoldAtTime) comp.gain.cancelAndHoldAtTime(now);
            else { comp.gain.cancelScheduledValues(now); comp.gain.setValueAtTime(comp.gain.value, now); }
        } catch { /* nothing scheduled */ }
        const pos = now - loopStart;
        if (pos < 0) { book(loopStart, loopDur); return; }
        const inLoop = pos % loopDur;
        const idx = Math.min(curve.length - 1, Math.floor((inLoop / loopDur) * curve.length));
        const rest = curve.subarray(idx);
        const at = now + 0.005;
        const dur = loopDur - inLoop - 0.005;
        if (dur <= 0.02 || rest.length < 2) return;
        try {
            comp.gain.setValueCurveAtTime(rest, at, dur - 0.002);
        } catch { /* the loop start books the next one */ }
    }
    function setCurve(next) {
        curve = next;
        rebook();
    }
    function set(state, trimDb) {
        glide(makeup.gain, dbToLin(state.on ? state.makeup : 0), ctx);
        glide(trim.gain, dbToLin(trimDb), ctx);
        glide(wet.gain, dryHeld ? 0 : 1, ctx);
        glide(dry.gain, dryHeld ? 1 : 0, ctx);
    }
    function holdDry(held) {
        dryHeld = held;
        glide(wet.gain, held ? 0 : 1, ctx);
        glide(dry.gain, held ? 1 : 0, ctx);
    }
    function clear() {
        try { comp.gain.cancelScheduledValues(ctx.currentTime); comp.gain.setValueAtTime(1, ctx.currentTime); } catch { /* fine */ }
        loopStart = null;
    }
    function position() {
        if (loopStart == null || !loopDur) return null;
        const pos = ctx.currentTime - loopStart;
        if (pos < 0) return 0;
        return (pos % loopDur) / loopDur;
    }
    // For scripts/check-bench.mjs: the gain the node is at right now.
    if (typeof window !== 'undefined') window.__benchGainProbe = () => comp.gain.value;
    return { set, setCurve, schedule, holdDry, clear, position };
}

// ---- the bench ------------------------------------------------------------
export default function DynamicsBench({ back }) {
    const [state, setState] = useState(DEFAULT_STATE);
    const [further, setFurther] = useState(false);
    const [match, setMatch] = useState(false);
    const [mode, setMode] = useBenchMode();
    const [depth, setDepth] = useBenchDepth();
    const [hover, setHover] = useState(null);
    const [last, setLast] = useState('threshold');
    const [announce, setAnnounce] = useState(null);
    const [loopTick, setLoopTick] = useState(0);
    const stateRef = useRef(state);
    stateRef.current = state;
    const hoverRef = useRef(null);
    hoverRef.current = hover;
    const { studioOrigin } = useStudioArrival();
    const teach = mode === 'teacher';
    const ext = depth === 'extension';
    const maths = depth !== 'core';

    const pattern = PATTERNS[state.source];
    const def = MODES[state.mode];
    const down = isDownward(state.mode);

    // The loop's envelope, once per source, from the decoded buffers.
    const loopsRef = useRef({});
    const graphRef = useRef(null);
    const onSchedule = useCallback((tick) => {
        const pat = PATTERNS[stateRef.current.source];
        const first = scheduleBar(pat, tick);
        if (first) graphRef.current?.schedule(tick.barStart, pat.bars * tick.beatsPerBar * tick.beatSec);
    }, []);
    const buildGraph = useCallback((ctx, input, master) => {
        const g = buildDynGraph(ctx, input, master);
        graphRef.current = g;
        return g;
    }, []);
    const audio = useBenchAudio({ files: FILES, bpm: BPM, onSchedule, buildGraph });
    const { ctxRef, nodesRef, began, playing, ready, getBuffer } = audio;
    const playingRef = useRef(false);
    playingRef.current = playing;

    useEffect(() => {
        if (!ready) return;
        let changed = false;
        for (const id of SOURCE_IDS) {
            if (loopsRef.current[id]) continue;
            const buffers = {};
            for (const step of PATTERNS[id].steps) buffers[step.name] = getBuffer(step.name);
            const loop = loopOf(PATTERNS[id], buffers, BPM);
            if (loop) { loopsRef.current[id] = loop; changed = true; }
        }
        if (changed) setLoopTick((t) => t + 1);
    }, [ready, getBuffer]);

    const loop = loopsRef.current[state.source] || null;
    // Everything the stage draws and the console reads, from one run.
    const run = useMemo(() => (loop ? runLoop(state, loop.envDb, loop.dtMs) : null), [state, loop, loopTick]); // eslint-disable-line react-hooks/exhaustive-deps
    const stats = run ? run.stats : null;
    const runRef = useRef(run);
    runRef.current = run;
    const loopRef = useRef(loop);
    loopRef.current = loop;
    // Level match: pull the output so the loudest moment is no louder than before.
    const trimDb = match && stats ? Math.min(0, stats.peakIn - stats.peakOut) : 0;

    useEffect(() => { if (run) graphRef.current?.setCurve(gainCurve(run.gainDb)); }, [run, began]);
    useEffect(() => { graphRef.current?.set(state, trimDb); }, [state, trimDb, began]);
    useEffect(() => {
        const ctx = ctxRef.current;
        const nodes = nodesRef.current;
        if (ctx && nodes) glide(nodes.level.gain, state.level, ctx);
    }, [state.level, began, ctxRef, nodesRef]);

    const touch = (what) => { setLast(what); setAnnounce(null); };
    const chooseDepth = (id) => { setDepth(id); setAnnounce(id); };
    const patch = (p, what) => { setState((s) => setParam(s, p)); touch(what); };
    const chooseMode = (id) => { setState((s) => ({ ...setParam(s, {}), mode: id })); touch('mode'); };
    const choosePreset = (id) => {
        const preset = PRESETS.find((p) => p.id === id);
        if (!preset) return;
        const next = applyPreset(stateRef.current, id);
        const fresh = next.source !== stateRef.current.source;
        stateRef.current = next;
        setState(next);
        touch('preset');
        if (fresh && playingRef.current) audio.restart();
    };
    const chooseSource = (id) => {
        stateRef.current = { ...stateRef.current, source: id };
        setState((s) => ({ ...s, source: id }));
        touch('source');
        if (playingRef.current) audio.restart();
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

    // ---- stage ----
    const canvasRef = useRef(null);
    const handleRef = useRef(null);
    const dragRef = useRef(null);
    const depthRef = useRef(depth);
    depthRef.current = depth;
    const geom = (w, h) => {
        const padL = 44; const padR = 22; const top = 66; const bottom = h - 38;
        const plotH = bottom - top;
        const inset = Math.min(plotH, 236);
        const insetX = w - padR - inset;
        const laneX0 = padL; const laneX1 = insetX - 56;
        return { padL, padR, top, bottom, plotH, inset, insetX, laneX0, laneX1, laneW: laneX1 - laneX0 };
    };
    const yOfDb = (db, g) => g.top + ((0 - Math.max(LANE_MIN, Math.min(0, db))) / (0 - LANE_MIN)) * g.plotH;
    const dbOfY = (y, g) => 0 - ((y - g.top) / g.plotH) * (0 - LANE_MIN);

    useEffect(() => {
        const first = canvasRef.current;
        if (!first) return undefined;
        let raf = 0;
        const css = getComputedStyle(first.parentElement);
        const v = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
        const col = {
            gold: v('--gold-bright', '#f0d48a'),
            green: v('--gen-1', '#7fb39b'),
            coral: v('--gen-6', '#d08a80'),
            blue: v('--gen-2', '#7fb0c4'),
            purple: '#a395c9',
            inkSoft: 'rgba(255, 255, 255, 0.62)',
            inkFaint: 'rgba(255, 255, 255, 0.38)',
            grid: 'rgba(255, 255, 255, 0.08)',
            beat: 'rgba(255, 255, 255, 0.08)',
            downbeat: 'rgba(255, 255, 255, 0.22)',
            ghost: 'rgba(255, 255, 255, 0.34)',
            zero: 'rgba(255, 255, 255, 0.26)',
        };
        const monoFace = v('--mono', 'monospace');
        const mono = `11.5px ${monoFace}`;

        function draw() {
            const canvas = canvasRef.current;
            if (!canvas) { raf = requestAnimationFrame(draw); return; }
            const g2 = canvas.getContext('2d');
            const s = stateRef.current;
            const r = runRef.current;
            const lp = loopRef.current;
            const dpr = window.devicePixelRatio || 1;
            const w = canvas.clientWidth;
            const h = canvas.clientHeight;
            if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
                canvas.width = Math.round(w * dpr);
                canvas.height = Math.round(h * dpr);
            }
            g2.setTransform(dpr, 0, 0, dpr, 0, 0);
            g2.clearRect(0, 0, w, h);
            const g = geom(w, h);
            const pat = PATTERNS[s.source];
            const bars = pat.bars;
            const xOfFrac = (f) => g.laneX0 + f * g.laneW;
            const yOf = (db) => yOfDb(db, g);

            // the beat, as faint lines; dB lines across the lane
            g2.lineWidth = 1;
            g2.font = mono;
            const beats = bars * 4;
            for (let b = 0; b < beats; b += 1) {
                const x = Math.round(xOfFrac(b / beats)) + 0.5;
                const downbeat = b % 4 === 0;
                g2.strokeStyle = downbeat ? col.downbeat : col.beat;
                g2.beginPath(); g2.moveTo(x, g.top - 6); g2.lineTo(x, g.bottom + 6); g2.stroke();
                if (downbeat) { g2.fillStyle = col.inkFaint; g2.textAlign = 'left'; g2.fillText(`bar ${b / 4 + 1}`, x + 6, h - 14); }
            }
            for (const db of GRID_DB) {
                const y = Math.round(yOf(db)) + 0.5;
                g2.strokeStyle = db === 0 ? col.zero : col.grid;
                g2.beginPath(); g2.moveTo(g.laneX0, y); g2.lineTo(g.laneX1, y); g2.stroke();
                g2.fillStyle = col.inkFaint; g2.textAlign = 'right';
                g2.fillText(String(db), g.padL - 8, y + 4);
            }

            // the loop: input as a ghost line, output filled, from the same series
            if (r && lp) {
                const n = lp.envDb.length;
                const cols = Math.max(1, Math.floor(g.laneW));
                const level = (arr, i) => {
                    const i0 = Math.floor((i / cols) * n);
                    const i1 = Math.max(i0 + 1, Math.floor(((i + 1) / cols) * n));
                    let m = LANE_MIN - 10;
                    for (let k = i0; k < i1 && k < n; k += 1) if (arr[k] > m) m = arr[k];
                    return m;
                };
                g2.beginPath();
                g2.moveTo(g.laneX0, g.bottom);
                for (let i = 0; i <= cols; i += 1) g2.lineTo(g.laneX0 + i, yOf(level(r.outDb, i)));
                g2.lineTo(g.laneX0 + cols, g.bottom);
                g2.closePath();
                g2.fillStyle = col.green; g2.globalAlpha = 0.32; g2.fill(); g2.globalAlpha = 1;
                g2.beginPath();
                for (let i = 0; i <= cols; i += 1) { const y = yOf(level(lp.envDb, i)); if (i === 0) g2.moveTo(g.laneX0 + i, y); else g2.lineTo(g.laneX0 + i, y); }
                g2.strokeStyle = col.ghost; g2.lineWidth = 1; g2.stroke();
                // gain reduction, hanging from the top: the same scale, coral
                const grAt = (i) => {
                    const i0 = Math.floor((i / cols) * n);
                    const i1 = Math.max(i0 + 1, Math.floor(((i + 1) / cols) * n));
                    let m = 0;
                    for (let k = i0; k < i1 && k < n; k += 1) if (-r.gainDb[k] > m) m = -r.gainDb[k];
                    return m;
                };
                g2.beginPath();
                g2.moveTo(g.laneX0, g.top);
                for (let i = 0; i <= cols; i += 1) g2.lineTo(g.laneX0 + i, yOf(-grAt(i)));
                g2.lineTo(g.laneX0 + cols, g.top);
                g2.closePath();
                g2.fillStyle = col.coral; g2.globalAlpha = 0.28; g2.fill(); g2.globalAlpha = 1;
                g2.beginPath();
                for (let i = 0; i <= cols; i += 1) { const y = yOf(-grAt(i)); if (i === 0) g2.moveTo(g.laneX0 + i, y); else g2.lineTo(g.laneX0 + i, y); }
                g2.strokeStyle = col.coral; g2.lineWidth = 1.25; g2.stroke(); g2.lineWidth = 1;
            }

            // the threshold: the gold line, with its handle at the right
            const ty = Math.round(yOf(s.threshold)) + 0.5;
            g2.strokeStyle = col.gold; g2.lineWidth = 1.5;
            g2.setLineDash(s.on ? [] : [4, 4]);
            g2.beginPath(); g2.moveTo(g.laneX0, ty); g2.lineTo(g.laneX1, ty); g2.stroke();
            g2.setLineDash([]); g2.lineWidth = 1;
            const hx = g.laneX1 - 12; const hy = ty;
            const hovered = hoverRef.current?.id === 'threshold' || dragRef.current;
            g2.beginPath(); g2.arc(hx, hy, 7, 0, Math.PI * 2); g2.fillStyle = col.gold; g2.fill();
            g2.beginPath(); g2.arc(hx, hy, hovered ? 12 : 11, 0, Math.PI * 2); g2.strokeStyle = '#ffffff'; g2.lineWidth = hovered ? 1.5 : 1; g2.stroke(); g2.lineWidth = 1;
            handleRef.current = { x: hx, y: hy, ty, g };
            g2.fillStyle = col.gold; g2.font = mono; g2.textAlign = 'left';
            const tLabel = `threshold ${fmtDb(s.threshold)}`;
            g2.fillText(tLabel, g.laneX0 + 6, ty > g.top + 20 ? ty - 6 : ty + 15);

            // the playhead, and where the loop is
            const gr = graphRef.current;
            const frac = playingRef.current && gr ? gr.position() : null;
            let idx = null;
            if (frac != null && r) {
                const x = Math.round(xOfFrac(frac)) + 0.5;
                g2.strokeStyle = 'rgba(255,255,255,0.7)'; g2.beginPath(); g2.moveTo(x, g.top - 4); g2.lineTo(x, g.bottom + 4); g2.stroke();
                idx = Math.min(r.outDb.length - 1, Math.floor(frac * r.outDb.length));
            }

            // the chosen setting, for the depth (read from the state, not the render closure)
            const sDef = MODES[s.mode];
            const sDown = isDownward(s.mode);
            let label = `${sDef.label} · ${fmtDb(s.threshold)}`;
            if (hasRatio(s.mode) || s.mode === 'limiter') label += ` · ${ratioLabel(s)}`;
            label += ` · ${fmtMs(s.attack)} in, ${fmtMs(s.release)} out`;
            if (r && !sDown) label += ` · up to ${fmtDb(-r.stats.maxGr).replace('−', '')} off`;
            if (r && sDown) label += ` · ${s.mode === 'gate' ? 'open' : 'untouched'} ${Math.round(100 - r.stats.overPct)}% of the loop`;
            if (depthRef.current === 'extension') label += ` · knee ${hasKnee(s.mode) ? `${s.knee} dB` : 'hard'} · make-up ${fmtDb(s.makeup)}`;
            g2.fillStyle = col.gold; g2.font = mono; g2.textAlign = 'left';
            g2.fillText(label, g.laneX0 + 6, g.top - 10);

            // the transfer curve: the paper's drawing, in against out
            const ix = g.insetX; const iy = g.top; const side = g.inset;
            const xIn = (db) => ix + ((Math.max(LANE_MIN, Math.min(0, db)) - LANE_MIN) / (0 - LANE_MIN)) * side;
            const yOut = (db) => iy + side - ((Math.max(LANE_MIN, Math.min(0, db)) - LANE_MIN) / (0 - LANE_MIN)) * side;
            g2.strokeStyle = col.grid;
            for (const db of GRID_DB) {
                const x = Math.round(xIn(db)) + 0.5; const y = Math.round(yOut(db)) + 0.5;
                g2.beginPath(); g2.moveTo(x, iy); g2.lineTo(x, iy + side); g2.stroke();
                g2.beginPath(); g2.moveTo(ix, y); g2.lineTo(ix + side, y); g2.stroke();
            }
            g2.strokeStyle = col.zero;
            g2.beginPath(); g2.moveTo(ix + 0.5, iy); g2.lineTo(ix + 0.5, iy + side); g2.lineTo(ix + side, iy + side + 0.5); g2.stroke();
            g2.setLineDash([3, 4]); g2.strokeStyle = col.ghost;
            g2.beginPath(); g2.moveTo(xIn(LANE_MIN), yOut(LANE_MIN)); g2.lineTo(xIn(0), yOut(0)); g2.stroke();
            g2.setLineDash([]);
            // threshold on both axes
            g2.strokeStyle = col.gold; g2.globalAlpha = 0.5;
            g2.beginPath(); g2.moveTo(Math.round(xIn(s.threshold)) + 0.5, iy); g2.lineTo(Math.round(xIn(s.threshold)) + 0.5, iy + side); g2.stroke();
            g2.globalAlpha = 1;
            const curve = transferCurve(s, CURVE_N);
            g2.beginPath();
            curve.forEach((p, i) => { const x = xIn(p.inDb); const y = yOut(p.outDb); if (i === 0) g2.moveTo(x, y); else g2.lineTo(x, y); });
            g2.strokeStyle = col.gold; g2.lineWidth = 2.5; g2.lineJoin = 'round'; g2.stroke(); g2.lineWidth = 1;
            if (idx != null && r && lp) {
                const px = xIn(lp.envDb[idx]); const py = yOut(r.outDb[idx]);
                g2.beginPath(); g2.arc(px, py, 5, 0, Math.PI * 2); g2.fillStyle = '#ffffff'; g2.fill();
            }
            g2.fillStyle = col.inkFaint; g2.font = mono;
            g2.textAlign = 'left'; g2.fillText('−48', ix, iy + side + 16);
            g2.textAlign = 'center'; g2.fillText('in →', ix + side / 2, iy + side + 16);
            g2.textAlign = 'right'; g2.fillText('0', ix + side, iy + side + 16);
            g2.textAlign = 'left'; g2.fillStyle = col.inkSoft; g2.fillText("the paper's drawing", ix + 4, iy + 14);
            g2.fillStyle = col.inkFaint; g2.fillText('out ↑', ix + 4, iy + 28);
            if (depthRef.current === 'extension' && hasKnee(s.mode) && s.knee > 0) {
                g2.strokeStyle = col.purple; g2.setLineDash([2, 3]);
                const kx0 = Math.round(xIn(s.threshold - s.knee / 2)) + 0.5; const kx1 = Math.round(xIn(s.threshold + s.knee / 2)) + 0.5;
                g2.beginPath(); g2.moveTo(kx0, iy); g2.lineTo(kx0, iy + side); g2.moveTo(kx1, iy); g2.lineTo(kx1, iy + side); g2.stroke();
                g2.setLineDash([]);
                g2.fillStyle = col.purple; g2.font = `600 9.5px ${monoFace}`; g2.textAlign = 'left'; g2.fillText('knee EXT', kx1 + 4, iy + side - 6); g2.font = mono;
            }

            // what this frame drew, told to the DOM for check-bench (law 17)
            const tag = String(s.threshold);
            if (canvas.dataset.threshold !== tag) canvas.dataset.threshold = tag;
            const handle = `${Math.round(hx)}:${Math.round(hy)}`;
            if (canvas.dataset.handle !== handle) canvas.dataset.handle = handle;
            const grTag = r ? r.stats.maxGr.toFixed(1) : '';
            if (canvas.dataset.gr !== grTag) canvas.dataset.gr = grTag;

            raf = requestAnimationFrame(draw);
        }
        raf = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(raf);
    }, [ctxRef, nodesRef]); // eslint-disable-line react-hooks/exhaustive-deps

    // Drag the threshold: the gold line on the lane, or the knee on the drawing.
    const hitThreshold = (px, py) => {
        const hd = handleRef.current;
        if (!hd) return false;
        const g = hd.g;
        if (Math.hypot(px - hd.x, py - hd.y) < 16) return true;
        if (px >= g.laneX0 && px <= g.laneX1 && Math.abs(py - hd.ty) < 9) return true;
        if (px >= g.insetX && px <= g.insetX + g.inset && py >= g.top && py <= g.top + g.inset) {
            const tx = g.insetX + ((stateRef.current.threshold - LANE_MIN) / (0 - LANE_MIN)) * g.inset;
            if (Math.abs(px - tx) < 12) return 'inset';
        }
        return false;
    };
    const onStageDown = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const px = e.clientX - rect.left; const py = e.clientY - rect.top;
        const hit = hitThreshold(px, py);
        if (!hit) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        dragRef.current = { where: hit === 'inset' ? 'inset' : 'lane' };
    };
    const onStageMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const px = e.clientX - rect.left; const py = e.clientY - rect.top;
        const hd = handleRef.current;
        if (dragRef.current && hd) {
            const g = hd.g;
            let db;
            if (dragRef.current.where === 'inset') db = LANE_MIN + ((px - g.insetX) / g.inset) * (0 - LANE_MIN);
            else db = dbOfY(py, g);
            patch({ threshold: Math.max(THRESH_MIN, Math.min(THRESH_MAX, Math.round(db * 2) / 2)) }, 'threshold');
            return;
        }
        if (!teach) { if (hover) setHover(null); return; }
        const hit = hitThreshold(px, py);
        if (!hit) { if (hover) setHover(null); return; }
        if (hover && hover.id === 'threshold') return;
        setHover({ id: 'threshold', x: hd.x, y: hd.y, stageW: rect.width, stageH: rect.height });
    };
    const onStageUp = (e) => {
        if (!dragRef.current) return;
        dragRef.current = null;
        try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* gone */ }
    };

    // ---- drawer content ----
    const topicHref = (slug) => memberTopicHref(null, slug, studioOrigin);
    const drawerTabs = useMemo(() => [
        {
            id: 'reference',
            label: 'Reference',
            render: () => (
                <>
                    <h2>Dynamics, in the spec&apos;s words</h2>
                    <p>Every dynamic processor does one thing: it changes the level of a signal according to how loud that signal is right now. The four on this bench are the four the spec names, and they share their controls.</p>
                    <h3>Terms</h3>
                    <dl>
                        <dt>Threshold</dt><dd>The level, in dB, at which the processor starts to work: above it for a compressor or limiter, below it for a gate or expander.</dd>
                        <dt>Ratio</dt><dd>How much a compressor turns the signal down once it is over the threshold: 4:1 means 4 dB in for every 1 dB out. Infinity to one is a limiter.</dd>
                        <dt>Attack</dt><dd>How long the processor takes to act once the signal crosses the threshold, in milliseconds. Slow, and the front of a sound gets through.</dd>
                        <dt>Release</dt><dd>How long it takes to stop acting once the signal falls back. Too short and the level pumps; too long and the whole part sits lower.</dd>
                        <dt>Knee</dt><dd>Whether the ratio arrives all at once at the threshold (hard) or gradually across a few dB around it (soft).</dd>
                        <dt>Make-up gain</dt><dd>Level added after the compressor to replace what it took away. It lifts the output; it does not change the gain reduction.</dd>
                        <dt>Gain reduction</dt><dd>How much the processor is turning the signal down at this moment, in dB: the coral band on the stage, and the meter on every compressor.</dd>
                        <dt>Limiter</dt><dd>A compressor whose ratio is infinity: nothing passes the threshold. Used to stop peaks, not to shape a part.</dd>
                        <dt>Gate</dt><dd>Shuts the signal off below the threshold: noise between notes, spill, the tail of a sound. Its range (or floor) is how far down it shuts; real gates add a hold time.</dd>
                        <dt>Expander</dt><dd>The gate&apos;s gentle cousin: below the threshold it turns the signal further down by a ratio, rather than off.</dd>
                        <dt>Side-chain</dt><dd>Feeding the processor a different signal to listen to from the one it acts on: a gate on a synth keyed from the kick, a compressor on a bass ducking to the kick. Not on this bench; on the practical paper most years.</dd>
                    </dl>
                    <h3>In your DAW</h3>
                    <table>
                        <thead><tr><th>On this bench</th><th>Ableton Live</th><th>Logic Pro</th></tr></thead>
                        <tbody>
                            <tr><td>Compressor, limiter</td><td>Compressor: Thresh, Ratio, Attack, Release, Knee, Out gain</td><td>Compressor: Threshold, Ratio, Attack, Release, Knee, Make Up</td></tr>
                            <tr><td>Ratio ∞:1</td><td>Compressor with the ratio at ∞, or Limiter</td><td>Compressor with the ratio at its top, or Limiter / Adaptive Limiter</td></tr>
                            <tr><td>Gate</td><td>Gate: Threshold, Return, Attack, Hold, Release, Floor</td><td>Noise Gate: Threshold, Reduction, Attack, Hold, Release, Hysteresis</td></tr>
                            <tr><td>Expander</td><td>Gate with the Floor raised, or Multiband Dynamics below its threshold</td><td>Expander</td></tr>
                            <tr><td>Level match</td><td>Compressor: Out gain</td><td>Compressor: Make Up / Auto Gain</td></tr>
                        </tbody>
                    </table>
                    <p className={styles.source}>Control names as they appear in Live 12 and Logic Pro 11 device panels. Check against your own version if they move.</p>
                    <h3>Beyond the paper<span className={styles.ext}>EXT</span></h3>
                    <dl>
                        <dt>Look-ahead</dt><dd>A limiter with no look-ahead lets the first fraction of a millisecond of every peak through. A mastering limiter delays the signal by a few milliseconds so the gain is already down when the peak arrives.</dd>
                        <dt>Peak against RMS</dt><dd>This bench reads the level as a peak every half millisecond. An RMS detector averages over tens of milliseconds and follows loudness instead of transients, which is why two compressors set the same can sound different.</dd>
                        <dt>Parallel compression</dt><dd>A heavily compressed copy mixed under the dry signal: the quiet parts come up without the peaks being flattened. The ear notices peaks reduced more than quiet sounds raised.</dd>
                        <dt>Hysteresis and hold</dt><dd>A gate that opens and closes at the same level chatters on a signal hovering there. Real gates close at a lower level than they open (Return, Hysteresis) and hold open for a set time after the signal falls.</dd>
                    </dl>
                    <p className={styles.source}>Cipriani and Giri, Electronic Music and Sound Design vol. 2, ch. 7 (dynamic processors); Owsinski, The Mixing Engineer&apos;s Handbook, ch. 7, on ratios and parallel compression: the reading behind the A* tier at Sherborne.</p>
                </>
            ),
        },
        {
            id: 'teacher',
            label: 'Teacher',
            render: () => (
                <>
                    <h2>What to listen for</h2>
                    <p>The stage shows the loop before and after the processor, and the coral band is what is being taken off. Hold the dry button and the filled shape becomes the ghost line; let go and watch what the threshold catches. Once you can hear a hit being held rather than &quot;quieter&quot;, you are describing dynamics the way the paper marks it.</p>
                    <h3>What cost candidates marks</h3>
                    <p>2023, a vocal chain: &quot;Most candidates were able to see that the very high ratio would result in a heavily compressed vocal. The function of the make-up gain was often confused and misunderstood.&quot; And: &quot;Some of the better students missed out on their full complement of AO3 points by not providing a definition of a parameter which they clearly knew (threshold, ratio, attack, release etc).&quot;</p>
                    <p>2022, drawing the compressor&apos;s curve: &quot;Nearly all candidates managed to score 2 though for the axes. A few got the full 7 marks... In order of the most common first, marks were given for the flatter line, hard knee, 1:1 threshold mark, 10:1 slope, and then the gain make-up.&quot;</p>
                    <p>2023 AS, labelling which of 1:1 and ∞:1 is limiting: &quot;Very few could do this.&quot;</p>
                    <p>2019, a gate on a bass: &quot;Most candidates understood the concept of a noise gate, but also many confused the process with limiting, compressing or filtering... &apos;Below the threshold the frequencies are cut&apos; therefore no credit could be given.&quot; And on the practical: &quot;Very few students scored full marks... because they didn&apos;t set the threshold carefully to remove the noise but leave the bass intact.&quot;</p>
                    <p>2025, compressing a vocal, the two-mark fault in the mark scheme: &quot;Attack too long causing excessive transients.&quot;</p>
                    <p className={styles.source}>Source: Edexcel Principal Examiner Feedback and mark schemes, 9MT0/04, Summer 2019 (Q1), 2022 (Q4), 2023 (Q6), 2023 AS (Q4), 2025 (Q5).</p>
                    <p>Those are the moves on this bench: define every parameter before you judge it; press <b>2022 paper</b> and read the seven marks off the drawing; press <b>Limiter</b> and name the flat line; press <b>Gate the hats</b> and find the threshold that keeps the kit; slow the attack on the vocal and hear the transients get through.</p>
                    <h3>Do these now</h3>
                    <ul>
                        <li>Press <b>2023 paper</b>, switch the bench to A-level, and judge the ratio and the make-up from what you hear before you read the examiner above. Then fix it: bring the ratio to 4:1, match the level, and say what came back.</li>
                        <li>Press <b>2022 paper</b> and draw the transfer curve on paper from the stage: dB on both axes, 1:1 up to −30, a flatter line above it, a hard corner, the whole thing lifted by the make-up. Seven marks.</li>
                        <li>Press <b>Limiter</b>, then switch the processor back to Compressor at 20:1 and say what changed on the drawing. Then say which line the 2023 AS paper called limiting.</li>
                        <li>Press <b>Gate the hats</b>, then drag the threshold above the snare and below the hats. Say what the 2019 report would have said about each.</li>
                        <li>Choose the vocal at <b>Vocal level</b>, turn the attack up to 60 ms and hold dry against it: hear the front of each word get through. That is the 2025 mark scheme&apos;s two-mark fault.</li>
                        <li>Press <b>Drum punch</b>, then turn the attack down to 1 ms. Say what happened to the kick, and why a drum compressor is set slower than a vocal one.</li>
                        <li>Press <b>Sustain</b> and hold dry against it. Say which processor the 2022 paper was asking about, and why most candidates said reverb.</li>
                    </ul>
                    <h3>Exam practice</h3>
                    <ExamCallout
                        prompt="A compressor reduces dynamic range. Give a reason why the recording engineer compressed the rap vocal, and state a disadvantage of doing so. (2 marks, 2022)"
                        answer="Reasons the scheme credited: control the peaks, keep the volume consistent, increase the average level, help the vocal sit in the mix. Disadvantages: increased noise, louder breaths, more reverb, increased sibilance. 'Dynamics' alone was not credited because dynamic range was given in the question."
                    />
                    <ExamCallout
                        prompt="On a noise gate, describe how the threshold control affects the signal. (2 marks, 2019)"
                        answer="Sound below the threshold is removed or reduced; the higher the threshold, the more is cut. The report: 'the threshold is the point at which the gate is activated' scored nothing, because it says neither below nor what a gate does."
                    />
                    <ExamCallout
                        prompt="Draw and label lines on the graph showing compression ratios of 1:1 and ∞:1 using the threshold shown, and label which is limiting. (3 marks, 2023 AS)"
                        answer="1:1 is the diagonal, output equal to input. ∞:1 follows the diagonal up to the threshold and then runs almost horizontally: the output stays at the threshold however loud the input. The horizontal one is limiting. The report: very few could label it."
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
                    <a className={styles.conn} href={topicHref('eq-filters')}>
                        <i>1.11 EQ</i>
                        <b>Before or after the compressor</b>
                        <span>A cut before the compressor changes what it reacts to; a boost after it changes only the tone. The order is an exam point.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('synthesis')}>
                        <i>1.3 Synthesis</i>
                        <b>Two attacks</b>
                        <span>A synth&apos;s envelope attack is how fast the sound starts; a compressor&apos;s attack is how fast the gain comes down. The 2025 report found candidates mixing them up.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('balance-blend')}>
                        <i>1.13 Balance and blend</i>
                        <b>Sitting in the mix</b>
                        <span>The paper&apos;s reasons for compressing a vocal end with &quot;help it sit in the mix&quot;: dynamics are a balance decision as much as a level one.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('reverb')}>
                        <i>1.12 Reverb</i>
                        <b>A gate on a reverb</b>
                        <span>Gate the reverb return and the tail is cut off before it decays: the gated drum sound of the 1980s, a gate used as an effect rather than a cleaner.</span>
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
        const segs = judge({ state, last, part: pattern.said, stats });
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
        say = <>{openMachine({ state, last, part: pattern.said, stats })}{teach ? <> {DEPTH_TEACH.extension}</> : null}</>;
    } else {
        const next = nextMove(state, stats);
        say = teach
            ? <>{hearingLine(state, pattern.said, stats)} <b>Try:</b> {next}.</>
            : <><b>Try:</b> {next.charAt(0).toUpperCase() + next.slice(1)}.</>;
    }

    // ---- console ----
    const modeOptions = MODE_IDS.map((id) => ({ id, label: MODES[id].label, title: MODES[id].does }));
    const ratioPos = Math.round(toPos(Math.max(RATIO_MIN, Math.min(RATIO_MAX, state.ratio)), RATIO_MIN, RATIO_MAX) * 1000);
    const attackPos = Math.round(toPos(state.attack, ATTACK_MIN, ATTACK_MAX) * 1000);
    const releasePos = Math.round(toPos(state.release, RELEASE_MIN, RELEASE_MAX) * 1000);
    const ladderX = (db) => ((Math.max(LANE_MIN, Math.min(0, db)) - LANE_MIN) / (0 - LANE_MIN)) * 100;
    const ladderTicks = [-36, -24, -12].map(ladderX);
    // the Ratio micro-diagram: the transfer curve, small
    const shapePts = useMemo(() => transferCurve(state, 33).map((p) => `${((p.inDb - LANE_MIN) / (0 - LANE_MIN)) * 100},${100 - ((Math.max(LANE_MIN, Math.min(0, p.outDb)) - LANE_MIN) / (0 - LANE_MIN)) * 100}`).join(' '), [state]);
    const slopeLine = state.mode === 'limiter' ? 'over the threshold, nothing gets out' : state.mode === 'gate' ? 'under the threshold, shut' : down ? `under the threshold, 1 dB in is ${state.ratio} dB out` : `over the threshold, ${state.ratio} dB in is 1 dB out`;
    const over = stats ? Math.round(stats.overPct) : 0;

    const consoleSlot = (
        <>
            <PlayColumn
                playing={playing}
                onTogglePlay={togglePlay}
                onHoldDry={(held) => graphRef.current?.holdDry(held)}
                level={state.level}
                onLevel={(v) => setState((s) => ({ ...s, level: v }))}
                teach={teach}
                holdTitle="Hold to hear the source with no processing"
                holdWhy="bypasses the processor while you hold it, so you can hear what it is changing"
            />

            <div className={`${styles.sec} ${styles.secSource}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>Source</span></div>
                <div className={styles.grid2} role="group" aria-label="Source">
                    {SOURCE_IDS.map((id) => (
                        <button key={id} type="button" className={styles.srcBtn} aria-pressed={state.source === id} onClick={() => chooseSource(id)}>
                            {PATTERNS[id].label}
                        </button>
                    ))}
                </div>
                <Why>Four sounds with four different dynamics. The kit is all hits; the 808 has long tails; the vocal rises and falls by the word; the stabs have a front and a tail. The same setting means something different on each.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secProc}`} data-teach={teach || undefined}>
                <div className={styles.secHead}>
                    <span className={styles.eyebrow}>Processor</span>
                    <span className={styles.value} data-tone={state.on ? 'green' : undefined}>{state.on ? 'in' : 'out'}</span>
                </div>
                <Chips label="Processor" options={modeOptions} value={state.mode} onChange={chooseMode} />
                <Chips
                    label="In or out"
                    options={[{ id: 'in', label: 'In' }, { id: 'out', label: 'Out' }]}
                    value={state.on ? 'in' : 'out'}
                    onChange={(id) => patch({ on: id === 'in' }, 'in')}
                />
                <Why>Four processors, one machine. A compressor turns the loud parts down; a limiter is a compressor that lets nothing past; a gate shuts the quiet parts off; an expander turns them further down. In and Out is the bypass.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secLevel}`} data-teach={teach || undefined}>
                <div className={styles.secHead}>
                    <span className={styles.eyebrow} data-hot="true">Threshold</span>
                    <span className={styles.value}>{fmtDb(state.threshold)}</span>
                </div>
                <div className={styles.instrument}>
                    <Dial
                        label="Threshold"
                        value={state.threshold}
                        min={THRESH_MIN}
                        max={THRESH_MAX}
                        step={0.5}
                        format={(v) => fmtDb(v)}
                        pointer="var(--gold)"
                        hot
                        pixels={300}
                        onChange={(v) => patch({ threshold: v }, 'threshold')}
                        title={`The level ${down ? 'below' : 'above'} which the ${def.name} works`}
                    />
                    <Dial
                        label="Make-up"
                        value={state.makeup}
                        min={0}
                        max={MAKEUP_MAX}
                        step={0.5}
                        size="small"
                        format={(v) => `+${v} dB`}
                        pointer="var(--green)"
                        disabled={down}
                        onChange={(v) => patch({ makeup: v }, 'makeup')}
                        title={down ? 'A gate or expander adds no make-up' : 'Make-up gain, after the compression'}
                    />
                    <div className={styles.diagram} aria-hidden="true">
                        <small>level</small>
                        {ladderTicks.map((x) => <span key={x} className={styles.tickBeat} style={{ left: `${x}%` }} />)}
                        {stats ? <span className={styles.tick} style={{ left: `calc(${ladderX(stats.softIn)}% - 1px)`, background: 'rgba(24,20,16,0.35)', top: 20 }} /> : null}
                        {stats ? <span className={styles.tick} style={{ left: `calc(${ladderX(stats.peakIn)}% - 1px)`, background: 'var(--ink)', top: 20 }} /> : null}
                        <span className={styles.tick} style={{ left: `calc(${ladderX(state.threshold)}% - 1px)`, background: 'var(--gold)', top: 14 }} />
                    </div>
                </div>
                <div className={styles.meaning} data-ext={maths ? 'true' : undefined}>
                    {stats ? `${over}% of the loop ${down ? 'under' : 'over'} it${maths && !down ? `, up to ${fmtDb(-stats.maxGr).replace('−', '')} taken off` : ''}` : 'where the processor starts to work'}
                </div>
                <Why>The level at which the {def.name} starts to work: {down ? 'below it' : 'above it'}. The ruler shows the loop&apos;s loudest hit (dark) and its quiet level (grey) against the threshold (gold). Drag the dial, or drag the gold line on the stage.{down ? '' : ' Make-up is added after the compression, to put the level back.'}</Why>
            </div>

            <div className={`${styles.sec} ${styles.secRatio}`} data-teach={teach || undefined}>
                <div className={styles.secHead}>
                    <span className={styles.eyebrow}>Ratio</span>
                    <span className={styles.value}>
                        {ratioLabel(state)}
                        {hasKnee(state.mode) ? <small>knee {state.knee} dB</small> : null}
                    </span>
                </div>
                <div className={styles.instrument}>
                    <Dial
                        label="Ratio"
                        value={ratioPos}
                        min={0}
                        max={1000}
                        step={1}
                        format={() => ratioLabel(state)}
                        pointer="var(--green)"
                        disabled={!hasRatio(state.mode)}
                        pixels={300}
                        onChange={(v) => patch({ ratio: fromPos(v / 1000, RATIO_MIN, RATIO_MAX) }, 'ratio')}
                        title={hasRatio(state.mode) ? 'How hard it works past the threshold' : `A ${def.name} has its ratio at infinity`}
                    />
                    <Dial
                        label="Knee"
                        value={hasKnee(state.mode) ? state.knee : 0}
                        min={0}
                        max={KNEE_MAX}
                        step={0.5}
                        size="small"
                        format={(v) => (hasKnee(state.mode) ? `${v} dB` : 'hard')}
                        disabled={!hasKnee(state.mode)}
                        onChange={(v) => patch({ knee: v }, 'knee')}
                        title={hasKnee(state.mode) ? 'Knee: 0 is hard, more is softer' : `A ${def.name} is hard by nature`}
                    />
                    <div className={styles.diagram} aria-hidden="true">
                        <small>curve</small>
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={styles.shapeSvg}>
                            <line x1="0" y1="100" x2="100" y2="0" className={styles.oneToOne} />
                            <polyline points={shapePts} style={{ stroke: 'var(--gold)' }} />
                        </svg>
                    </div>
                </div>
                <div className={styles.meaning}>{slopeLine}</div>
                <Why>{down
                    ? 'Below the threshold an expander turns the signal down by its ratio; a gate shuts it off. The drawing is the transfer curve: input across, output up.'
                    : 'For every this-many dB the input goes over the threshold, the output goes over it by one. Infinity is a limiter. The knee is how sharply the ratio arrives; the drawing is the transfer curve the paper asks you to draw.'}</Why>
            </div>

            <div className={`${styles.sec} ${styles.secTiming}`} data-teach={teach || undefined}>
                <div className={styles.secHead}>
                    <span className={styles.eyebrow}>Timing</span>
                    <span className={styles.value}>{fmtMs(state.attack).replace(' ms', '')}<small>/ {fmtMs(state.release)}</small></span>
                </div>
                <div className={styles.instrument}>
                    <Dial
                        label="Attack"
                        value={attackPos}
                        min={0}
                        max={1000}
                        step={1}
                        format={() => fmtMs(state.attack)}
                        pointer="var(--gen-2)"
                        pixels={300}
                        onChange={(v) => patch({ attack: fromPos(v / 1000, ATTACK_MIN, ATTACK_MAX) }, 'attack')}
                        title={`Attack: how fast it ${down ? 'opens' : 'acts'}`}
                    />
                    <Dial
                        label="Release"
                        value={releasePos}
                        min={0}
                        max={1000}
                        step={1}
                        format={() => fmtMs(state.release)}
                        pointer="var(--gen-3)"
                        pixels={300}
                        onChange={(v) => patch({ release: fromPos(v / 1000, RELEASE_MIN, RELEASE_MAX) }, 'release')}
                        title={`Release: how fast it ${down ? 'closes' : 'lets go'}`}
                    />
                </div>
                <div className={styles.meaning}>{attackWord(state.attack)} attack, {releaseWord(state.release)} release</div>
                <Why>Attack is how long the {def.name} takes to {down ? 'open' : 'act'} once the signal crosses the threshold; release is how long it takes to {down ? 'close' : 'let go'} once it falls back. Slow the attack and the front of each hit gets through; shorten the release and the level swings with the beat.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secHear}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>What you should hear</span></div>
                <div className={styles.stats} aria-live="polite">
                    <div><b>{stats ? fmtDb(-stats.maxGr).replace('−', '') : '…'}</b><span>most gain reduction</span></div>
                    <div><b>{stats ? fmtDb(stats.peakOut) : '…'}</b><span>loudest moment after</span></div>
                    <div><b>{stats ? `${over}%` : '…'}</b><span>of the loop {down ? 'under' : 'over'} the threshold</span></div>
                    {ext
                        ? <div><b>{stats ? fmtDb(-stats.meanGr).replace('−', '') : '…'}</b><span>average reduction<span className={styles.ext}>EXT</span></span></div>
                        : <div><b>{stats ? fmtDb(stats.peakOut - stats.peakIn) : '…'}</b><span>loudest moment, before to after</span></div>}
                </div>
                {teach ? <div className={styles.meaning}>all from the dials and the loop</div> : null}
                <Legal />
                <Why>Every number here comes from the dials and the loop: how much the loudest hits are turned down, how loud the result is, how much of the loop the processor is working on, and whether the loudest moment ends up louder or quieter than it started, which is what make-up gain decides.</Why>
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
            <span className={styles.eyebrow}>Level match</span>
            <Chips
                label="Level match"
                options={[{ id: 'off', label: 'Off' }, { id: 'on', label: 'On' }]}
                value={match ? 'on' : 'off'}
                onChange={(id) => { setMatch(id === 'on'); touch('makeup'); }}
            />
            <span className={styles.chipNote}>{match && trimDb ? `${fmtDb(trimDb)} trim` : 'loudest moment no louder than before'}</span>
        </div>
    ) : null;

    const stage = (
        <>
            <canvas
                ref={canvasRef}
                aria-label="The loop before and after the processor, with the threshold and the transfer curve"
                role="img"
                onPointerDown={onStageDown}
                onPointerMove={onStageMove}
                onPointerUp={onStageUp}
                onPointerCancel={onStageUp}
                onPointerLeave={() => { if (!dragRef.current) setHover(null); }}
            />
            <div className={styles.stageNote}>
                <b>{pattern.bars} bars · 0 to −48 dB · {pattern.label}</b>
                <span>{ORIENT}</span>
            </div>
            <div className={`${styles.stageLegend} ${styles.legendTop}`} aria-hidden="true">
                <span><i style={{ background: 'rgba(255,255,255,0.35)' }} />before</span>
                <span><i style={{ background: 'var(--gen-1)', opacity: 0.5 }} />after</span>
                <span><i style={{ background: 'var(--gen-6)', opacity: 0.7 }} />taken off</span>
                <span><i style={{ background: 'var(--gold-bright)', borderRadius: '50%' }} />threshold</span>
            </div>
            {hover && teach ? (
                <div
                    className={styles.tip}
                    style={{
                        left: hover.x - 300,
                        top: Math.max(44, Math.min(hover.stageH - 120, hover.y - 30)),
                    }}
                >
                    <i>threshold · {fmtDb(state.threshold)}</i>
                    <p>
                        {over}% of the loop is {down ? 'under' : 'over'} it{stats && !down ? `, and up to ${fmtDb(-stats.maxGr).replace('−', '')} is taken off there` : ''}. Drag the line up or down; the {def.name} works {down ? 'below' : 'above'} it.
                    </p>
                </div>
            ) : null}
            {!began ? (
                <div className={styles.begin}>
                    <button type="button" className={styles.beginBtn} onClick={() => audio.start()}>
                        <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1.2v9.6L11 6z" fill="currentColor" /></svg>
                        <span>
                            Play the bench
                            <small>Real drums through a real compressor. Headphones help.</small>
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
            orientation={ORIENT}
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
