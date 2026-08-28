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
    outputDb,
    staticGainDb,
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
// What the stage is, for the depth: three levels, three pictures (28 Aug 2026).
const ORIENTS = {
    core: 'The filled shape is the sound after the processor; the ghost line is before. The coral band is what is being taken off. Drag the gold threshold line.',
    alevel: "Before and after against the beat; the paper's drawing beside it, input across, output up, the dot is the loop now. Drag inside it to read a level off.",
    extension: 'Dotted coral is what the gain computer asks for; the band is what attack and release let it apply. On the drawing, the dot leaves the curve by that lag.',
};
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
    const probeRef = useRef(null); // an input level the student is reading off the drawing
    const trailRef = useRef({ run: null, pts: [] }); // Extension: where the live dot has been
    const legendRef = useRef(null); // the legend's width, so the setting label stops short of it
    const legendWRef = useRef(0);
    const frameRef = useRef(0);
    // Three levels, three pictures (Mike, 28 Aug 2026). Core: the lane alone,
    // the loop against the beat. A-level: the paper's drawing at the left,
    // input across and output up, sharing the lane's dB axis, with a probe
    // the student drags to read a level off. Extension: the same, plus what
    // the gain computer asks for against what attack and release let it
    // apply, and the dot's trail leaving the curve by that lag.
    const stageOf = (d) => (d === 'core' ? 'lane' : d === 'alevel' ? 'graph' : 'machine');
    const geom = (w, h, d) => {
        const padR = 22; const top = 66; const bottom = h - 38;
        const plotH = bottom - top;
        if (d === 'core') {
            const padL = 44;
            return { padR, top, bottom, plotH, graph: null, labelX: padL - 8, laneX0: padL, laneX1: w - padR, laneW: w - padR - padL };
        }
        const x0 = 60;
        const gw = Math.round(Math.max(180, Math.min(plotH * 1.33, 330)));
        const laneX0 = x0 + gw + 58;
        return { padR, top, bottom, plotH, graph: { x0, x1: x0 + gw, w: gw }, labelX: x0 - 8, laneX0, laneX1: w - padR, laneW: w - padR - laneX0 };
    };
    const yOfDb = (db, g) => g.top + ((0 - Math.max(LANE_MIN, Math.min(0, db))) / (0 - LANE_MIN)) * g.plotH;
    const dbOfY = (y, g) => 0 - ((y - g.top) / g.plotH) * (0 - LANE_MIN);
    const xOfIn = (db, g) => g.graph.x0 + ((Math.max(LANE_MIN, Math.min(0, db)) - LANE_MIN) / (0 - LANE_MIN)) * g.graph.w;
    const inOfX = (x, g) => LANE_MIN + ((x - g.graph.x0) / g.graph.w) * (0 - LANE_MIN);
    const num = (v) => (Math.abs(v) < 0.05 ? '0' : `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(1).replace(/\.0$/, '')}`);

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
            plate: css.backgroundColor && css.backgroundColor !== 'rgba(0, 0, 0, 0)' ? css.backgroundColor : '#17172b',
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
            const d = depthRef.current;
            const dpr = window.devicePixelRatio || 1;
            const w = canvas.clientWidth;
            const h = canvas.clientHeight;
            if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
                canvas.width = Math.round(w * dpr);
                canvas.height = Math.round(h * dpr);
            }
            g2.setTransform(dpr, 0, 0, dpr, 0, 0);
            g2.clearRect(0, 0, w, h);
            const g = geom(w, h, d);
            const gp = g.graph;
            const pat = PATTERNS[s.source];
            const bars = pat.bars;
            const xOfFrac = (f) => g.laneX0 + f * g.laneW;
            const yOf = (db) => yOfDb(db, g);
            const rowY = g.bottom + 15; // the one row of labels under the plot
            const sDef = MODES[s.mode];
            const sDown = isDownward(s.mode);

            // the beat, as faint lines down the lane
            g2.lineWidth = 1;
            g2.font = mono;
            const beats = bars * 4;
            for (let b = 0; b < beats; b += 1) {
                const x = Math.round(xOfFrac(b / beats)) + 0.5;
                const downbeat = b % 4 === 0;
                g2.strokeStyle = downbeat ? col.downbeat : col.beat;
                g2.beginPath(); g2.moveTo(x, g.top - 6); g2.lineTo(x, g.bottom + 6); g2.stroke();
                if (downbeat) { g2.fillStyle = col.inkFaint; g2.textAlign = 'left'; g2.fillText(`bar ${b / 4 + 1}`, x + 6, rowY); }
            }
            // the dB grid across the drawing and the lane: one scale, labelled once
            for (const db of GRID_DB) {
                const y = Math.round(yOf(db)) + 0.5;
                g2.strokeStyle = db === 0 ? col.zero : col.grid;
                g2.beginPath();
                if (gp) { g2.moveTo(gp.x0, y); g2.lineTo(gp.x1, y); }
                g2.moveTo(g.laneX0, y); g2.lineTo(g.laneX1, y);
                g2.stroke();
                g2.fillStyle = col.inkFaint; g2.textAlign = 'right';
                g2.fillText(String(db), g.labelX, y + 4);
            }

            // the loop: input as a ghost line, output filled, from the same series
            if (r && lp) {
                const n = lp.envDb.length;
                const cols = Math.max(1, Math.floor(g.laneW));
                const colMax = (arr, i, sign, floor) => {
                    const i0 = Math.floor((i / cols) * n);
                    const i1 = Math.max(i0 + 1, Math.floor(((i + 1) / cols) * n));
                    let m = floor;
                    for (let k = i0; k < i1 && k < n; k += 1) if (sign * arr[k] > m) m = sign * arr[k];
                    return m;
                };
                const level = (arr, i) => colMax(arr, i, 1, LANE_MIN - 10);
                const grAt = (i) => colMax(r.gainDb, i, -1, 0);
                g2.beginPath();
                g2.moveTo(g.laneX0, g.bottom);
                for (let i = 0; i <= cols; i += 1) g2.lineTo(g.laneX0 + i, yOf(level(r.outDb, i)));
                g2.lineTo(g.laneX0 + cols, g.bottom);
                g2.closePath();
                // Craft pass 29 Aug 2026: the body of the sound is a lit
                // volume, not a flat wash. Densest at the floor where the
                // level sits, thinning as it rises, with its own top edge
                // picked out so the shape of the loop reads at a glance.
                const bodyFill = g2.createLinearGradient(0, g.top, 0, g.bottom);
                bodyFill.addColorStop(0, 'rgba(127, 179, 155, 0.16)');
                bodyFill.addColorStop(0.55, 'rgba(127, 179, 155, 0.30)');
                bodyFill.addColorStop(1, 'rgba(127, 179, 155, 0.46)');
                g2.fillStyle = bodyFill; g2.fill();
                g2.beginPath();
                for (let i = 0; i <= cols; i += 1) { const y = yOf(level(r.outDb, i)); if (i === 0) g2.moveTo(g.laneX0 + i, y); else g2.lineTo(g.laneX0 + i, y); }
                g2.strokeStyle = 'rgba(178, 221, 203, 0.75)'; g2.lineWidth = 1; g2.stroke();
                g2.beginPath();
                for (let i = 0; i <= cols; i += 1) { const y = yOf(level(lp.envDb, i)); if (i === 0) g2.moveTo(g.laneX0 + i, y); else g2.lineTo(g.laneX0 + i, y); }
                g2.strokeStyle = col.ghost; g2.lineWidth = 1; g2.stroke();
                // gain reduction, hanging from the top: the same scale, coral
                g2.beginPath();
                g2.moveTo(g.laneX0, g.top);
                for (let i = 0; i <= cols; i += 1) g2.lineTo(g.laneX0 + i, yOf(-grAt(i)));
                g2.lineTo(g.laneX0 + cols, g.top);
                g2.closePath();
                const grFill = g2.createLinearGradient(0, g.top, 0, g.bottom);
                grFill.addColorStop(0, 'rgba(208, 138, 128, 0.40)');
                grFill.addColorStop(1, 'rgba(208, 138, 128, 0.10)');
                g2.fillStyle = grFill; g2.fill();
                g2.beginPath();
                for (let i = 0; i <= cols; i += 1) { const y = yOf(-grAt(i)); if (i === 0) g2.moveTo(g.laneX0 + i, y); else g2.lineTo(g.laneX0 + i, y); }
                g2.strokeStyle = col.coral; g2.lineWidth = 1.25; g2.stroke(); g2.lineWidth = 1;
                // Extension: what the gain computer asked for, before attack and release
                if (d === 'extension' && r.wantDb) {
                    const wantAt = (i) => colMax(r.wantDb, i, -1, 0);
                    g2.setLineDash([2, 3]); g2.strokeStyle = col.coral; g2.globalAlpha = 0.9;
                    g2.beginPath();
                    for (let i = 0; i <= cols; i += 1) { const y = yOf(-wantAt(i)); if (i === 0) g2.moveTo(g.laneX0 + i, y); else g2.lineTo(g.laneX0 + i, y); }
                    g2.stroke(); g2.setLineDash([]); g2.globalAlpha = 1;
                }
            }

            // the threshold: the gold line, with its handle at the right
            const ty = Math.round(yOf(s.threshold)) + 0.5;
            g2.strokeStyle = col.gold; g2.lineWidth = 1.5;
            g2.setLineDash(s.on ? [] : [4, 4]);
            if (s.on) { g2.shadowColor = 'rgba(240, 212, 138, 0.55)'; g2.shadowBlur = 8; }
            g2.beginPath(); g2.moveTo(g.laneX0, ty); g2.lineTo(g.laneX1, ty); g2.stroke();
            g2.shadowBlur = 0;
            g2.setLineDash([]); g2.lineWidth = 1;
            const hx = g.laneX1 - 12; const hy = ty;
            const hovered = hoverRef.current?.id === 'threshold' || dragRef.current?.where === 'lane';
            g2.beginPath(); g2.arc(hx, hy, 7, 0, Math.PI * 2); g2.fillStyle = col.gold; g2.fill();
            g2.beginPath(); g2.arc(hx, hy, hovered ? 12 : 11, 0, Math.PI * 2); g2.strokeStyle = '#ffffff'; g2.lineWidth = hovered ? 1.5 : 1; g2.stroke(); g2.lineWidth = 1;
            handleRef.current = { x: hx, y: hy, ty, g };
            g2.fillStyle = col.gold; g2.font = mono; g2.textAlign = 'left';
            const tLabel = `threshold ${fmtDb(s.threshold)}`;
            g2.fillText(tLabel, g.laneX0 + 6, ty > g.top + 20 ? ty - 6 : ty + 15);

            // the playhead, and where the loop is
            const ag = graphRef.current;
            const frac = playingRef.current && ag ? ag.position() : null;
            let idx = null;
            if (frac != null && r) {
                const x = Math.round(xOfFrac(frac)) + 0.5;
                g2.strokeStyle = 'rgba(255,255,255,0.7)'; g2.beginPath(); g2.moveTo(x, g.top - 4); g2.lineTo(x, g.bottom + 4); g2.stroke();
                idx = Math.min(r.outDb.length - 1, Math.floor(frac * r.outDb.length));
            }

            // the chosen setting, for the depth (read from the state, not the render closure)
            // (it stops short of the legend: the last parts go first, and they are on the drawing and the dials anyway)
            const segs = [`${sDef.label} · ${fmtDb(s.threshold)}`];
            if (hasRatio(s.mode) || s.mode === 'limiter') segs.push(ratioLabel(s));
            segs.push(`${fmtMs(s.attack)} in, ${fmtMs(s.release)} out`);
            if (r && !sDown) segs.push(`up to ${fmtDb(-r.stats.maxGr).replace('−', '')} off`);
            if (r && sDown) segs.push(`${s.mode === 'gate' ? 'open' : 'untouched'} ${Math.round(100 - r.stats.overPct)}% of the loop`);
            if (d === 'extension') segs.push(`knee ${hasKnee(s.mode) ? `${s.knee} dB` : 'hard'}`, `make-up ${fmtDb(s.makeup)}`);
            g2.fillStyle = col.gold; g2.font = mono; g2.textAlign = 'left';
            if (frameRef.current % 20 === 0 && legendRef.current) legendWRef.current = legendRef.current.getBoundingClientRect().width;
            frameRef.current += 1;
            const room = w - 18 - legendWRef.current - 16 - (g.laneX0 + 6);
            let label = segs.join(' · ');
            while (segs.length > 3 && g2.measureText(label).width > room) { segs.pop(); label = segs.join(' · '); }
            g2.fillText(label, g.laneX0 + 6, g.top - 10);

            // the paper's drawing: input across, output up, on the lane's own dB scale
            if (gp) {
                const xIn = (db) => xOfIn(db, g);
                g2.strokeStyle = col.grid;
                for (const db of GRID_DB) { const x = Math.round(xIn(db)) + 0.5; g2.beginPath(); g2.moveTo(x, g.top); g2.lineTo(x, g.bottom); g2.stroke(); }
                g2.strokeStyle = col.zero;
                g2.beginPath(); g2.moveTo(gp.x0 + 0.5, g.top); g2.lineTo(gp.x0 + 0.5, g.bottom + 0.5); g2.lineTo(gp.x1, g.bottom + 0.5); g2.stroke();
                // unity, out = in, the line the paper wants drawn first
                g2.setLineDash([4, 4]); g2.strokeStyle = col.ghost;
                g2.beginPath(); g2.moveTo(xIn(LANE_MIN), yOf(LANE_MIN)); g2.lineTo(xIn(0), yOf(0)); g2.stroke();
                g2.setLineDash([]);
                g2.save();
                g2.translate(gp.x0 + gp.w * 0.74, g.bottom - g.plotH * 0.74);
                g2.rotate(-Math.atan2(g.plotH, gp.w));
                g2.fillStyle = col.inkFaint; g2.font = `10px ${monoFace}`; g2.textAlign = 'center';
                g2.fillText('unity · out = in', 0, -7);
                g2.restore();
                // the axes, named and ticked
                g2.fillStyle = col.inkFaint; g2.font = mono; g2.textAlign = 'center';
                for (const db of GRID_DB) g2.fillText(String(db), xIn(db), rowY);
                g2.textAlign = 'left'; g2.fillText('in →', gp.x1 + 12, rowY);
                g2.save(); g2.translate(14, (g.top + g.bottom) / 2); g2.rotate(-Math.PI / 2); g2.textAlign = 'center'; g2.fillText('out (dB) ↑', 0, 4); g2.restore();
                // the threshold, on the input axis
                const tx = Math.round(xIn(s.threshold)) + 0.5;
                const tRight = tx > gp.x0 + gp.w / 2;
                g2.setLineDash([4, 4]); g2.strokeStyle = col.gold; g2.globalAlpha = 0.6;
                g2.beginPath(); g2.moveTo(tx, g.top); g2.lineTo(tx, g.bottom); g2.stroke();
                g2.setLineDash([]); g2.globalAlpha = 1;
                g2.fillStyle = col.gold; g2.font = `10px ${monoFace}`; g2.textAlign = tRight ? 'right' : 'left';
                g2.fillText(`thr ${fmtDb(s.threshold)}`, tRight ? tx - 5 : tx + 5, g.top + 13);
                // Extension: the knee, bracketed
                if (d === 'extension' && hasKnee(s.mode) && s.knee > 0) {
                    const kx0 = Math.round(xIn(s.threshold - s.knee / 2)) + 0.5; const kx1 = Math.round(xIn(s.threshold + s.knee / 2)) + 0.5;
                    g2.strokeStyle = col.purple; g2.setLineDash([2, 3]);
                    g2.beginPath(); g2.moveTo(kx0, g.top); g2.lineTo(kx0, g.bottom); g2.moveTo(kx1, g.top); g2.lineTo(kx1, g.bottom); g2.stroke();
                    g2.setLineDash([]);
                    g2.fillStyle = col.purple; g2.font = `600 9.5px ${monoFace}`;
                    g2.fillText(`knee ${s.knee} dB EXT`, tRight ? tx - 5 : tx + 5, g.top + 26);
                }
                // the processor, the way the paper names it
                g2.fillStyle = '#ffffff'; g2.font = `600 10.5px ${monoFace}`; g2.textAlign = 'right';
                g2.fillText(sDef.label.toUpperCase(), gp.x1 - 7, g.bottom - 7);
                // the curve: the paper's own drawing, so it is the brightest
                // object on the graph. Craft pass 29 Aug 2026: a wash under
                // the trace to give the plot a floor, then the trace itself
                // struck twice, once wide and dim for the glow and once tight
                // and bright, the way a scope line reads.
                const curve = transferCurve(s, CURVE_N);
                const tracePath = () => {
                    g2.beginPath();
                    curve.forEach((p, i) => { const x = xIn(p.inDb); const y = yOf(p.outDb); if (i === 0) g2.moveTo(x, y); else g2.lineTo(x, y); });
                };
                g2.beginPath();
                curve.forEach((p, i) => { const x = xIn(p.inDb); const y = yOf(p.outDb); if (i === 0) g2.moveTo(x, y); else g2.lineTo(x, y); });
                g2.lineTo(xIn(curve[curve.length - 1].inDb), g.bottom);
                g2.lineTo(xIn(curve[0].inDb), g.bottom);
                g2.closePath();
                const under = g2.createLinearGradient(0, g.top, 0, g.bottom);
                under.addColorStop(0, 'rgba(240, 212, 138, 0.13)');
                under.addColorStop(1, 'rgba(240, 212, 138, 0.02)');
                g2.fillStyle = under; g2.fill();
                g2.lineJoin = 'round'; g2.lineCap = 'round';
                // The bloom comes from a shadow on the trace itself, not from
                // a second wider stroke: a translucent warm stroke over navy
                // reads as a grey halo, a shadow reads as light.
                tracePath();
                g2.shadowColor = 'rgba(240, 212, 138, 0.75)'; g2.shadowBlur = 11;
                g2.strokeStyle = col.gold; g2.lineWidth = 2.5; g2.stroke();
                g2.shadowBlur = 0;
                tracePath();
                g2.stroke();
                g2.lineWidth = 1; g2.lineCap = 'butt';
                // a point on the drawing: the dot, dotted lines to both axes, the output on its axis
                const mark = (inDb, outDb, colour, alpha, ring) => {
                    const px = xIn(inDb); const py = yOf(outDb);
                    g2.save(); g2.globalAlpha = alpha; g2.strokeStyle = colour; g2.fillStyle = colour; g2.setLineDash([2, 3]);
                    g2.beginPath(); g2.moveTo(gp.x0, py); g2.lineTo(px, py); g2.lineTo(px, g.bottom); g2.stroke();
                    g2.setLineDash([]);
                    g2.beginPath(); g2.arc(gp.x0, py, 3, 0, Math.PI * 2); g2.fill();
                    g2.restore();
                    g2.beginPath(); g2.arc(px, py, ring ? 6 : 4.5, 0, Math.PI * 2);
                    if (ring) { g2.fillStyle = col.plate; g2.fill(); g2.strokeStyle = colour; g2.lineWidth = 2; g2.stroke(); g2.lineWidth = 1; }
                    else { g2.fillStyle = colour; g2.fill(); }
                    return { px, py };
                };
                // Extension: where the dot has been, which is the lag drawn
                const tr = trailRef.current;
                if (d === 'extension') {
                    if (tr.run !== r) { tr.run = r; tr.pts = []; }
                    tr.pts.forEach((p, i) => { g2.globalAlpha = 0.08 + (0.5 * i) / tr.pts.length; g2.fillStyle = col.blue; g2.beginPath(); g2.arc(p.x, p.y, 2, 0, Math.PI * 2); g2.fill(); });
                    g2.globalAlpha = 1;
                }
                if (idx != null && r && lp) {
                    const p = mark(lp.envDb[idx], r.outDb[idx], '#ffffff', 0.35, false);
                    if (d === 'extension') {
                        const lastP = tr.pts[tr.pts.length - 1];
                        if (!lastP || Math.hypot(lastP.x - p.px, lastP.y - p.py) > 1.5) { tr.pts.push({ x: p.px, y: p.py }); if (tr.pts.length > 120) tr.pts.shift(); }
                    }
                }
                // the probe: a level the student is reading off, the 2022 paper's make-up question
                const probe = probeRef.current;
                g2.font = mono; g2.textAlign = 'left';
                if (probe != null) {
                    const outAt = outputDb(probe, s);
                    const off = -staticGainDb(probe, s);
                    mark(probe, outAt, col.gold, 0.85, true);
                    g2.fillStyle = col.gold;
                    g2.fillText(`in ${num(probe)} → out ${num(outAt)}${off > 0.05 ? ` · ${num(off)} dB off` : ''}`, gp.x0, g.top - 10);
                } else {
                    g2.fillStyle = col.inkSoft;
                    g2.fillText('drag inside to read a level off', gp.x0, g.top - 10);
                }
            }

            // what this frame drew, told to the DOM for check-bench (laws 17 and 18)
            const tag = String(s.threshold);
            if (canvas.dataset.threshold !== tag) canvas.dataset.threshold = tag;
            const handle = `${Math.round(hx)}:${Math.round(hy)}`;
            if (canvas.dataset.handle !== handle) canvas.dataset.handle = handle;
            const grTag = r ? r.stats.maxGr.toFixed(1) : '';
            if (canvas.dataset.gr !== grTag) canvas.dataset.gr = grTag;
            const stageTag = stageOf(d);
            if (canvas.dataset.stage !== stageTag) canvas.dataset.stage = stageTag;
            const probeTag = probeRef.current == null ? '' : String(probeRef.current);
            if (canvas.dataset.probe !== probeTag) canvas.dataset.probe = probeTag;

            raf = requestAnimationFrame(draw);
        }
        raf = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(raf);
    }, [ctxRef, nodesRef]); // eslint-disable-line react-hooks/exhaustive-deps

    // Drag the threshold (the gold line on the lane, or its handle), or a probe inside the drawing.
    const hitThreshold = (px, py) => {
        const hd = handleRef.current;
        if (!hd) return false;
        const g = hd.g;
        if (Math.hypot(px - hd.x, py - hd.y) < 16) return true;
        return px >= g.laneX0 && px <= g.laneX1 && Math.abs(py - hd.ty) < 9;
    };
    const hitGraph = (px, py) => {
        const g = handleRef.current?.g;
        return Boolean(g?.graph) && px >= g.graph.x0 - 4 && px <= g.graph.x1 + 4 && py >= g.top - 4 && py <= g.bottom + 4;
    };
    const probeAt = (px) => {
        const g = handleRef.current?.g;
        if (!g?.graph) return;
        probeRef.current = Math.round(Math.max(LANE_MIN, Math.min(0, inOfX(px, g))) * 2) / 2;
    };
    const onStageDown = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const px = e.clientX - rect.left; const py = e.clientY - rect.top;
        let where = null;
        if (hitThreshold(px, py)) where = 'lane';
        else if (hitGraph(px, py)) { where = 'probe'; probeAt(px); }
        if (!where) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        dragRef.current = { where };
    };
    const onStageMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const px = e.clientX - rect.left; const py = e.clientY - rect.top;
        const hd = handleRef.current;
        if (dragRef.current && hd) {
            if (dragRef.current.where === 'probe') { probeAt(px); return; }
            const db = dbOfY(py, hd.g);
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
    // A double click inside the drawing clears the probe.
    const onStageDouble = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        if (hitGraph(e.clientX - rect.left, e.clientY - rect.top)) probeRef.current = null;
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
                <div className={styles.meaning}>
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

            <div className={`${styles.sec} ${styles.secKnob}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>Attack</span></div>
                <div className={styles.knob}>
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
                    <span className={styles.value}>{fmtMs(state.attack)}</span>
                </div>
                <div className={styles.meaning}>{attackWord(state.attack)}</div>
                <Why>Attack is how long the {def.name} takes to {down ? 'open' : 'act'} once the signal crosses the threshold. Slow it and the front of each hit gets through before the level comes down; that is the transient the paper asks about.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secKnob}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>Release</span></div>
                <div className={styles.knob}>
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
                    <span className={styles.value}>{fmtMs(state.release)}</span>
                </div>
                <div className={styles.meaning}>{releaseWord(state.release)}</div>
                <Why>Release is how long the {def.name} takes to {down ? 'close again' : 'let the level back up'} once the signal falls back under the threshold. Shorten it and the level swings with the beat, which is what pumping is.</Why>
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
                aria-label={maths ? "The loop before and after the processor, with the threshold, and the paper's drawing of input against output" : 'The loop before and after the processor, with the threshold'}
                role="img"
                onPointerDown={onStageDown}
                onPointerMove={onStageMove}
                onPointerUp={onStageUp}
                onPointerCancel={onStageUp}
                onDoubleClick={onStageDouble}
                onPointerLeave={() => { if (!dragRef.current) setHover(null); }}
            />
            <div className={styles.stageNote}>
                <b>{pattern.bars} bars · 0 to −48 dB · {pattern.label}</b>
                <span>{ORIENTS[depth] || ORIENTS.core}</span>
            </div>
            <div ref={legendRef} className={`${styles.stageLegend} ${styles.legendTop}`} aria-hidden="true">
                <span><i style={{ background: 'rgba(255,255,255,0.35)' }} />before</span>
                <span><i style={{ background: 'var(--gen-1)', opacity: 0.5 }} />after</span>
                <span><i style={{ background: 'var(--gen-6)', opacity: 0.7 }} />taken off</span>
                {ext ? <span><i style={{ background: 'transparent', borderTop: '2px dotted var(--gen-6)', height: 0, borderRadius: 0 }} />wanted</span> : null}
                <span><i style={{ background: 'var(--gold-bright)', borderRadius: '50%' }} />threshold</span>
                {maths ? <span><i style={{ background: 'transparent', border: '2px solid var(--gold-bright)', borderRadius: '50%' }} />probe</span> : null}
                {ext ? <span><i style={{ background: 'var(--gen-2)', borderRadius: '50%', width: 6, height: 6 }} />trail</span> : null}
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
