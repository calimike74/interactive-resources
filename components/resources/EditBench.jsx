'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BenchFrame from '@/components/bench/BenchFrame';
import { Dial, Chips, Why, MoreButton } from '@/components/bench/controls';
import { PlayColumn, Presets, Legal, ExamCallout, useBenchMode, useBenchDepth, DEPTHS } from '@/components/bench/BenchBits';
import { useBenchAudio, glide } from '@/components/bench/useBenchAudio';
import styles from '@/components/bench/bench.module.css';
import { memberTopicHref, useStudioArrival } from '@/lib/studio-return';
import { FILES as ALL_FILES } from '@/lib/bench/sources';
import { DEPTH_LINES, DEPTH_TEACH, judge, open as openMachine, hearingLine, nextMove } from '@/lib/bench/edit-depth';
import {
    TAKE_IDS,
    TAKES,
    SHAPE_IDS,
    SHAPES,
    DEFAULT_STATE,
    PRESETS,
    LENGTH_MAX,
    PAD_SEC,
    applyPreset,
    setParam,
    isSplice,
    cutRange,
    snapCutMs,
    editStats,
    renderEdit,
    loopWindow,
    fadeCurve,
    fadeIn,
    fadeOut,
    sumDb,
    fmtMs,
    fmtSec,
    fmtDb,
    lengthWord,
} from '@/lib/bench/edit-model';

// The Edit bench (1.6), fourth bench to the Bench Standard and the first for
// a topic that had nothing. One take, one cut, one fade. The edit is bounced
// offline from the decoded samples (lib/bench/edit-model.js renderEdit), the
// bounce is what plays, and the stage draws the same samples around the
// join at cycle zoom, so the click the student hears is the step they can
// see. Three jobs (lib/bench/edit-depth.js): Core shows, A-level judges the
// way the paper does, Extension opens the machine.

const CODE = '1.6 Editing';
const TITLE = 'Edit bench';
const FILES = { vocal: ALL_FILES.vocal, 'funk-openhat': ALL_FILES['funk-openhat'] };
// What the stage is, for the depth: three levels, three pictures.
const ORIENTS = {
    core: 'Gold is the take up to the cut, blue is what follows it, zoomed until the cycles show. The coral bar at the line is the jump between them: the click. Drag the line, or the marker above.',
    alevel: "The join above; the paper's drawing below it on the same time axis: fade out and fade in as gain, the crossfade bracketed. Drag inside the drawing to read both gains off.",
    extension: 'Dotted white is the level through the crossfade, the two powers added: linear dips 3 dB in the middle, equal power holds. The ticks on the centre line are zero crossings.',
};
const DEFAULT_DUR = { vocal: 7360, cymbal: 1500 };
const GAPS = [{ id: 250, label: '0.25 s' }, { id: 500, label: '0.5 s' }, { id: 1000, label: '1 s' }];
const DEFAULT_CUT = { vocal: 2500, cymbal: 580 };

// ---- the graph ------------------------------------------------------------
// Two sources are booked every bar: the bounce into `wet`, the untouched
// take from the same point into `dry`. Hold-dry swaps them, so the student
// hears what the cut removed or the fade changed against the edit.
function buildEditGraph(ctx, input, master) {
    const wet = ctx.createGain();
    const dry = ctx.createGain();
    dry.gain.value = 0;
    wet.connect(master);
    dry.connect(master);
    input.connect(master);
    let loopStart = null;
    let loopDur = 0;
    function schedule(at, dur) { loopStart = at; loopDur = dur; }
    function holdDry(held) {
        glide(wet.gain, held ? 0 : 1, ctx);
        glide(dry.gain, held ? 1 : 0, ctx);
    }
    function clear() { loopStart = null; }
    function position() {
        if (loopStart == null || !loopDur) return null;
        const pos = ctx.currentTime - loopStart;
        if (pos < 0) return 0;
        return (pos % loopDur) / loopDur;
    }
    return { wet, dry, schedule, holdDry, clear, position };
}

const EDIT_KEYS = ['take', 'cut', 'gap', 'snap', 'shape', 'length'];

// ---- the bench ------------------------------------------------------------
export default function EditBench({ back }) {
    const [state, setState] = useState(DEFAULT_STATE);
    const [further, setFurther] = useState(false);
    const [mode, setMode] = useBenchMode();
    const [depth, setDepth] = useBenchDepth();
    const [hover, setHover] = useState(null);
    const [last, setLast] = useState('cut');
    const [announce, setAnnounce] = useState(null);
    const [bpm, setBpm] = useState(120);
    const stateRef = useRef(state);
    stateRef.current = state;
    const hoverRef = useRef(null);
    hoverRef.current = hover;
    const { studioOrigin } = useStudioArrival();
    const teach = mode === 'teacher';
    const ext = depth === 'extension';
    const maths = depth !== 'core';
    const take = TAKES[state.take];
    const splice = isSplice(state.take);

    const graphRef = useRef(null);
    const renderRef = useRef(null);
    const windowRef = useRef({ start: 0, length: 1 });
    const srRef = useRef(44100);
    const versionRef = useRef(0);

    const onSchedule = useCallback((tick) => {
        const r = renderRef.current;
        const g = graphRef.current;
        if (!r || !g) return;
        const sr = srRef.current;
        if (!r.buffer || r.buffer.__v !== r.version) {
            const b = tick.ctx.createBuffer(1, r.data.length, sr);
            b.copyToChannel(r.data, 0);
            b.__v = r.version;
            r.buffer = b;
        }
        const w = windowRef.current;
        const dur = tick.beatSec * tick.beatsPerBar;
        tick.playBuffer('edit', tick.barStart, { buffer: r.buffer, offset: w.start / sr, duration: dur, destination: g.wet });
        tick.playBuffer(TAKES[stateRef.current.take].file, tick.barStart, { offset: w.start / sr, duration: dur, destination: g.dry });
        g.schedule(tick.barStart, dur);
    }, []);
    const buildGraph = useCallback((ctx, input, master) => {
        const g = buildEditGraph(ctx, input, master);
        graphRef.current = g;
        return g;
    }, []);
    const audio = useBenchAudio({ files: FILES, bpm, onSchedule, buildGraph });
    const { ctxRef, nodesRef, began, playing, ready, getBuffer } = audio;
    const playingRef = useRef(false);
    playingRef.current = playing;

    const bufOf = useCallback((id) => getBuffer(TAKES[id].file), [getBuffer]);
    const buf = ready ? bufOf(state.take) : null;
    const ch = buf ? buf.getChannelData(0) : null;
    const sr = buf ? buf.sampleRate : 44100;
    srRef.current = sr;
    const durationMsOf = useCallback((id) => { const b = bufOf(id); return b ? b.duration * 1000 : DEFAULT_DUR[id]; }, [bufOf]);
    const range = cutRange(state.take, durationMsOf(state.take), state.gap);

    // Everything the stage draws and the console reads, from one edit.
    // (Keyed on the edit's own fields: the output level is not an edit.)
    const editKey = EDIT_KEYS.map((k) => state[k]).join('|');
    const stats = useMemo(() => (ch ? editStats(state, sr, ch) : null), [editKey, sr, ch]); // eslint-disable-line react-hooks/exhaustive-deps
    const render = useMemo(() => {
        if (!ch || !stats) return null;
        const r = renderEdit({
            a: ch,
            b: splice ? ch : null,
            outIdx: stats.outIdx,
            inIdx: stats.inIdx ?? 0,
            shape: state.shape,
            lengthSamples: stats.lengthSamples,
            padSamples: splice ? 0 : Math.round(PAD_SEC * sr),
        });
        versionRef.current += 1;
        r.version = versionRef.current;
        return r;
    }, [ch, stats, sr]); // eslint-disable-line react-hooks/exhaustive-deps
    const win = useMemo(() => (render ? loopWindow(state, render, sr) : null), [render, sr]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => {
        renderRef.current = render;
        if (win) {
            windowRef.current = win;
            setBpm(Math.max(20, Math.min(300, 240 / (win.length / sr))));
        }
    }, [render, win, sr]);
    // A new bounce is heard from bar one of the loop once the hand has rested
    // (dragging the cut re-bounces on every move; the loop does not stutter).
    const restartTimer = useRef(null);
    useEffect(() => {
        if (!render || !playingRef.current) return undefined;
        if (restartTimer.current) clearTimeout(restartTimer.current);
        restartTimer.current = setTimeout(() => { audio.restart(); }, 140);
        return undefined;
    }, [render]); // eslint-disable-line react-hooks/exhaustive-deps
    const statsRef = useRef(stats);
    statsRef.current = stats;
    const renderMemoRef = useRef(render);
    renderMemoRef.current = render;
    const winRef = useRef(win);
    winRef.current = win;

    useEffect(() => {
        const ctx = ctxRef.current;
        const nodes = nodesRef.current;
        if (ctx && nodes) glide(nodes.level.gain, state.level, ctx);
    }, [state.level, began, ctxRef, nodesRef]);

    const touch = (what) => { setLast(what); setAnnounce(null); };
    const chooseDepth = (id) => { setDepth(id); setAnnounce(id); };
    const patch = (p, what) => { setState((s) => setParam(s, p)); touch(what); };
    const setCut = (ms, what = 'cut') => {
        setState((s) => {
            const r = cutRange(s.take, durationMsOf(s.take), s.gap);
            let v = Math.max(r.lo, Math.min(r.hi, ms));
            const b = s.snap ? bufOf(s.take) : null;
            if (b) v = snapCutMs(b.getChannelData(0), b.sampleRate, v);
            return setParam(s, { cut: Math.round(v * 100) / 100 });
        });
        touch(what);
    };
    const chooseSnap = (on) => {
        setState((s) => {
            let cut = s.cut;
            const b = on ? bufOf(s.take) : null;
            if (b) cut = Math.round(snapCutMs(b.getChannelData(0), b.sampleRate, s.cut) * 100) / 100;
            return setParam(s, { snap: on, cut });
        });
        touch('snap');
    };
    const chooseTake = (id) => {
        setState((s) => (s.take === id ? s : setParam(s, { take: id, cut: DEFAULT_CUT[id] })));
        touch('take');
    };
    const choosePreset = (id) => {
        setState((s) => applyPreset(s, id));
        touch('preset');
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
    const geomRef = useRef(null);
    const dragRef = useRef(null);
    const depthRef = useRef(depth);
    depthRef.current = depth;
    const chRef = useRef(ch);
    chRef.current = ch;
    const probeRef = useRef(null); // ms from the cut, read off the drawing
    const legendRef = useRef(null);
    const legendWRef = useRef(0);
    const frameRef = useRef(0);
    // Three levels, three pictures. Core: the join at cycle zoom, and the
    // whole take above it. A-level: the paper's drawing under the join on the
    // same time axis: the two regions, fade out and fade in as gain, the
    // crossfade bracketed, a probe to read both gains off. Extension: the
    // level through the crossfade as the powers add, its dip named, and the
    // zero crossings ticked on the centre line.
    const stageOf = (d) => (d === 'core' ? 'join' : d === 'alevel' ? 'drawing' : 'machine');
    const geom = (w, h, d) => {
        const padL = 60; const padR = d === 'extension' ? 46 : 22;
        const ovTop = 50; const ovH = 26;
        const top = ovTop + ovH + 26;
        const bottom = h - 26;
        const laneX0 = padL; const laneX1 = w - padR;
        const base = { w, h, ovTop, ovH, laneX0, laneX1, laneW: laneX1 - laneX0, labelX: padL - 8, rowY: h - 11, settingY: ovTop + ovH + 15 };
        if (d === 'core') return { ...base, wave: { top, bottom }, draw: null };
        const gap = 26;
        const waveH = Math.round((bottom - top - gap) * 0.42);
        return { ...base, wave: { top, bottom: top + waveH }, draw: { top: top + waveH + gap, bottom } };
    };
    const winMsOf = (s) => Math.max(30, s.length * 1.6);

    useEffect(() => {
        const first = canvasRef.current;
        if (!first) return undefined;
        let raf = 0;
        const css = getComputedStyle(first.parentElement);
        const v = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
        const col = {
            gold: v('--gen-5', '#dbb170'),
            goldBright: v('--gold-bright', '#f0d48a'),
            blue: v('--gen-2', '#7fb0c4'),
            coral: v('--gen-6', '#d08a80'),
            purple: '#a395c9',
            white: '#ffffff',
            plate: css.backgroundColor && css.backgroundColor !== 'rgba(0, 0, 0, 0)' ? css.backgroundColor : '#17172b',
            inkSoft: 'rgba(255, 255, 255, 0.62)',
            inkFaint: 'rgba(255, 255, 255, 0.38)',
            grid: 'rgba(255, 255, 255, 0.08)',
            zero: 'rgba(255, 255, 255, 0.26)',
        };
        const monoFace = v('--mono', 'monospace');
        const mono = `11.5px ${monoFace}`;

        // A run of samples across [x0, x1): a polyline when the zoom shows
        // them, peak columns when it does not.
        function wave(g2, arr, i0, i1, x0, x1, yOf, colour, width = 1.25, alpha = 1) {
            const n = i1 - i0;
            if (n <= 0 || x1 <= x0) return;
            g2.save();
            g2.globalAlpha = alpha;
            g2.strokeStyle = colour; g2.fillStyle = colour; g2.lineWidth = width; g2.lineJoin = 'round';
            const perPx = n / (x1 - x0);
            g2.beginPath();
            if (perPx <= 2.5) {
                for (let i = i0; i < i1; i += 1) {
                    const val = i >= 0 && i < arr.length ? arr[i] : 0;
                    const x = x0 + ((i - i0) / n) * (x1 - x0);
                    if (i === i0) g2.moveTo(x, yOf(val)); else g2.lineTo(x, yOf(val));
                }
                g2.stroke();
            } else {
                const cols = Math.max(1, Math.round(x1 - x0));
                const tops = []; const bots = [];
                for (let c = 0; c < cols; c += 1) {
                    const a = i0 + Math.floor((c / cols) * n); const b = Math.max(a + 1, i0 + Math.floor(((c + 1) / cols) * n));
                    let lo = 0; let hi = 0;
                    for (let i = a; i < b; i += 1) { const val = i >= 0 && i < arr.length ? arr[i] : 0; if (val > hi) hi = val; if (val < lo) lo = val; }
                    tops.push(yOf(hi)); bots.push(yOf(lo));
                }
                g2.moveTo(x0, tops[0]);
                for (let c = 1; c < cols; c += 1) g2.lineTo(x0 + c, tops[c]);
                for (let c = cols - 1; c >= 0; c -= 1) g2.lineTo(x0 + c, bots[c]);
                g2.closePath();
                g2.fill();
            }
            g2.restore();
        }

        function draw() {
            const canvas = canvasRef.current;
            if (!canvas) { raf = requestAnimationFrame(draw); return; }
            const g2 = canvas.getContext('2d');
            const s = stateRef.current;
            const st = statsRef.current;
            const r = renderMemoRef.current;
            const lw = winRef.current;
            const chan = chRef.current;
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
            const sp = isSplice(s.take);
            const sr = srRef.current;
            const winMs = winMsOf(s);
            const winN = Math.round((winMs / 1000) * sr);
            const xOfMs = (ms) => g.laneX0 + (ms / winMs + 0.5) * g.laneW;
            const xOfOut = (idx) => (r ? xOfMs(((idx - r.join) / sr) * 1000) : g.laneX0);
            const wv = g.wave;
            const mid = (wv.top + wv.bottom) / 2;
            const amp = (wv.bottom - wv.top) / 2 - 6;
            // the vertical scale follows the loudest sample in the window (a
            // DAW zooms both ways); the axis says what it is
            let scale = 1;
            if (r && chan && st) {
                const j0 = r.join - Math.floor(winN / 2); const j1 = j0 + winN;
                let peak = 0;
                for (let i = Math.max(0, j0); i < Math.min(r.data.length, j1); i += 1) { const a = Math.abs(r.data[i]); if (a > peak) peak = a; }
                for (let i = Math.max(0, st.outIdx); i < Math.min(chan.length, st.outIdx + Math.ceil(winN / 2)); i += 1) { const a = Math.abs(chan[i]); if (a > peak) peak = a; }
                scale = peak >= 0.85 ? 1 : Math.max(0.02, peak * 1.15);
            }
            const yOfWave = (val) => mid - Math.max(-1, Math.min(1, val / scale)) * amp;
            const scaleLabel = scale === 1 ? '1' : scale.toFixed(2).replace(/^0/, '');
            let hx = xOfMs(0); let hy = wv.top - 12;
            g2.font = mono; g2.lineWidth = 1;

            // ---- the whole take, above: where the cut sits in it ----
            const ovY0 = g.ovTop; const ovY1 = g.ovTop + g.ovH; const ovMid = (ovY0 + ovY1) / 2;
            const takeN = chan ? chan.length : 1;
            const xOfTake = (idx) => g.laneX0 + (idx / takeN) * g.laneW;
            g2.fillStyle = col.inkFaint; g2.textAlign = 'right'; g2.fillText('take', g.labelX, ovMid + 4);
            if (chan && st) {
                const outX = xOfTake(st.outIdx);
                const inX = sp ? xOfTake(st.inIdx) : g.laneX1;
                g2.globalAlpha = 0.16;
                g2.fillStyle = col.gold; g2.fillRect(g.laneX0, ovY0, outX - g.laneX0, g.ovH);
                g2.fillStyle = col.coral; g2.fillRect(outX, ovY0, inX - outX, g.ovH);
                if (sp) { g2.fillStyle = col.blue; g2.fillRect(inX, ovY0, g.laneX1 - inX, g.ovH); }
                g2.globalAlpha = 1;
                wave(g2, chan, 0, chan.length, g.laneX0, g.laneX1, (val) => ovMid - Math.max(-1, Math.min(1, val)) * (g.ovH / 2 - 2), col.inkSoft, 1, 0.55);
                // the loop, in the take's own time: before the cut, and where region B carries on
                if (lw && r) {
                    g2.fillStyle = col.white; g2.globalAlpha = 0.1;
                    const preN = r.join - lw.start;
                    g2.fillRect(xOfTake(st.outIdx - preN), ovY0, outX - xOfTake(st.outIdx - preN), g.ovH);
                    if (sp) { const postN = lw.length - preN; g2.fillRect(inX, ovY0, xOfTake(st.inIdx + postN) - inX, g.ovH); }
                    g2.globalAlpha = 1;
                }
                // the cut marker, draggable
                g2.strokeStyle = col.goldBright; g2.lineWidth = 1.5;
                g2.beginPath(); g2.moveTo(Math.round(outX) + 0.5, ovY0 - 6); g2.lineTo(Math.round(outX) + 0.5, ovY1 + 6); g2.stroke();
                g2.fillStyle = col.goldBright;
                g2.beginPath(); g2.moveTo(outX - 5, ovY0 - 8); g2.lineTo(outX + 5, ovY0 - 8); g2.lineTo(outX, ovY0 - 1); g2.closePath(); g2.fill();
                g2.lineWidth = 1;
                if (sp) {
                    g2.strokeStyle = col.blue; g2.setLineDash([3, 3]);
                    g2.beginPath(); g2.moveTo(Math.round(inX) + 0.5, ovY0 - 4); g2.lineTo(Math.round(inX) + 0.5, ovY1 + 4); g2.stroke();
                    g2.setLineDash([]);
                }
                // the playhead across the take
                const ag = graphRef.current;
                const frac = playingRef.current && ag && lw ? ag.position() : null;
                if (frac != null && r) {
                    const outSample = lw.start + frac * lw.length;
                    const takeIdx = outSample < r.join ? outSample : sp ? st.inIdx + (outSample - r.join) : st.outIdx + (outSample - r.join);
                    const px = Math.min(g.laneX1 + 10, xOfTake(takeIdx));
                    g2.strokeStyle = 'rgba(255,255,255,0.7)'; g2.beginPath(); g2.moveTo(Math.round(px) + 0.5, ovY0 - 3); g2.lineTo(Math.round(px) + 0.5, ovY1 + 3); g2.stroke();
                }
                g2.fillStyle = col.inkFaint; g2.font = `9.5px ${monoFace}`; g2.textAlign = 'left';
                g2.fillText('0 s', g.laneX0 + 3, ovY0 + 9);
                g2.textAlign = 'right'; g2.fillText(`${(chan.length / sr).toFixed(1)} s`, g.laneX1 - 3, ovY0 + 9);
                g2.font = mono;
            }

            // ---- the join, zoomed ----
            // the time axis, relative to the cut
            const tickMs = winMs <= 40 ? 5 : winMs <= 120 ? 20 : winMs <= 400 ? 50 : 100;
            const axisY = g.draw ? g.draw.bottom : wv.bottom;
            g2.textAlign = 'center';
            for (let ms = -Math.floor(winMs / 2 / tickMs) * tickMs; ms <= winMs / 2; ms += tickMs) {
                const x = Math.round(xOfMs(ms)) + 0.5;
                g2.strokeStyle = ms === 0 ? col.zero : col.grid;
                g2.beginPath(); g2.moveTo(x, wv.top); g2.lineTo(x, axisY); g2.stroke();
                g2.fillStyle = col.inkFaint;
                g2.fillText(ms === 0 ? 'cut' : `${ms > 0 ? '+' : '−'}${Math.abs(ms)} ms`, x, g.rowY);
            }
            g2.strokeStyle = col.zero;
            g2.beginPath(); g2.moveTo(g.laneX0, Math.round(mid) + 0.5); g2.lineTo(g.laneX1, Math.round(mid) + 0.5); g2.stroke();
            g2.fillStyle = col.inkFaint; g2.textAlign = 'right'; g2.fillText('0', g.labelX, mid + 4);
            g2.fillText(`+${scaleLabel}`, g.labelX, wv.top + 4); g2.fillText(`−${scaleLabel}`, g.labelX, wv.bottom + 4);

            let stepPx = null;
            if (r && chan && st) {
                const j0 = r.join - Math.floor(winN / 2); const j1 = j0 + winN;
                const xA = (i) => xOfOut(i);
                // what was cut away: A carrying on past the cut, and B before its in point, both faint
                wave(g2, chan, st.outIdx, st.outIdx + Math.ceil(winN / 2), xOfMs(0), xOfMs(winMs / 2), yOfWave, col.gold, 1, 0.3);
                if (sp) wave(g2, chan, st.inIdx - Math.floor(winN / 2), st.inIdx, xOfMs(-winMs / 2), xOfMs(0), yOfWave, col.blue, 1, 0.3);
                // the bounce: A alone, the fade, B alone (or silence)
                const fs = Math.max(j0, r.fadeStart); const fe = Math.min(j1, r.fadeEnd);
                wave(g2, r.data, j0, fs, xA(j0), xA(fs), yOfWave, col.gold, 1.5);
                if (fe > fs) wave(g2, r.data, fs, fe, xA(fs), xA(fe), yOfWave, col.white, 1.5);
                wave(g2, r.data, Math.max(fe, j0), j1, xA(Math.max(fe, j0)), xA(j1), yOfWave, col.blue, 1.5);
                // Core: the fade's gains, faint, over the wave
                if (d === 'core' && s.length > 0) {
                    const pts = fadeCurve(s.shape, 65);
                    const yG = (gain) => wv.bottom - gain * (wv.bottom - wv.top);
                    g2.setLineDash([3, 3]); g2.globalAlpha = 0.7;
                    for (const [key, colour] of [['out', col.gold], ['in', col.blue]]) {
                        if (!sp && key === 'in') continue;
                        g2.strokeStyle = colour; g2.beginPath();
                        pts.forEach((p, i) => { const x = xA(r.fadeStart + p.t * (r.fadeEnd - r.fadeStart)); const y = yG(p[key]); if (i === 0) g2.moveTo(x, y); else g2.lineTo(x, y); });
                        g2.stroke();
                    }
                    g2.setLineDash([]); g2.globalAlpha = 1;
                }
                // the step at a hard cut: the jump between the last of A and the first of B
                if (s.length === 0) {
                    const aLast = chan[st.outIdx - 1] || 0;
                    const bFirst = sp ? chan[st.inIdx] || 0 : 0;
                    const x = Math.round(xOfMs(0)) + 0.5;
                    const y0 = yOfWave(aLast); const y1 = yOfWave(bFirst);
                    stepPx = Math.abs(y1 - y0);
                    if (st.step >= 0.03) {
                        g2.strokeStyle = col.coral; g2.lineWidth = 3.5;
                        g2.beginPath(); g2.moveTo(x, y0); g2.lineTo(x, y1); g2.stroke();
                        g2.lineWidth = 1;
                        g2.fillStyle = col.coral; g2.font = `600 11px ${monoFace}`; g2.textAlign = 'left';
                        g2.fillText(`click · ${st.stepPct}% jump`, x + 9, Math.min(y0, y1) - 6 > wv.top + 8 ? Math.min(y0, y1) - 6 : Math.max(y0, y1) + 14);
                    } else {
                        g2.fillStyle = col.inkSoft; g2.font = `600 11px ${monoFace}`; g2.textAlign = 'left';
                        g2.fillText('meets at zero · no click', x + 9, wv.top + 14);
                    }
                    g2.font = mono;
                } else if (d === 'core') {
                    // the fade, bracketed over the wave (the drawing carries it at A-level)
                    const x0 = xA(r.fadeStart); const x1 = xA(r.fadeEnd);
                    g2.strokeStyle = col.inkSoft;
                    g2.beginPath(); g2.moveTo(x0, wv.top - 5); g2.lineTo(x0, wv.top - 1); g2.moveTo(x0, wv.top - 3); g2.lineTo(x1, wv.top - 3); g2.moveTo(x1, wv.top - 5); g2.lineTo(x1, wv.top - 1); g2.stroke();
                    g2.fillStyle = col.inkSoft; g2.textAlign = 'center';
                    g2.fillText(`${sp ? 'crossfade' : 'fade out'} ${fmtMs(s.length)} · ${SHAPES[s.shape].name}`, (x0 + x1) / 2, wv.top - 8);
                }
                // the join line and its handle
                const jx = Math.round(xOfMs(0)) + 0.5;
                g2.strokeStyle = col.goldBright; g2.setLineDash([4, 4]); g2.lineWidth = 1.25;
                g2.beginPath(); g2.moveTo(jx, wv.top); g2.lineTo(jx, wv.bottom); g2.stroke();
                g2.setLineDash([]); g2.lineWidth = 1;
                hx = jx; hy = wv.top - 14;
                const hovered = hoverRef.current?.id === 'cut' || dragRef.current?.where === 'join';
                g2.beginPath(); g2.arc(hx, hy, 6, 0, Math.PI * 2); g2.fillStyle = col.goldBright; g2.fill();
                g2.beginPath(); g2.arc(hx, hy, hovered ? 11 : 10, 0, Math.PI * 2); g2.strokeStyle = col.white; g2.lineWidth = hovered ? 1.5 : 1; g2.stroke(); g2.lineWidth = 1;
                // the playhead inside the window
                const ag = graphRef.current;
                const frac = playingRef.current && ag && lw ? ag.position() : null;
                if (frac != null) {
                    const outSample = lw.start + frac * lw.length;
                    if (outSample >= j0 && outSample <= j1) {
                        const px = Math.round(xA(outSample)) + 0.5;
                        g2.strokeStyle = 'rgba(255,255,255,0.7)'; g2.beginPath(); g2.moveTo(px, wv.top - 4); g2.lineTo(px, wv.bottom + 4); g2.stroke();
                    }
                }
                // Extension: the zero crossings, ticked on the centre line
                if (d === 'extension') {
                    const tick = (idx, colour) => { const x = Math.round(xA(idx)) + 0.5; g2.strokeStyle = colour; g2.beginPath(); g2.moveTo(x, mid - 5); g2.lineTo(x, mid + 5); g2.stroke(); };
                    let count = 0;
                    for (let i = Math.max(1, j0); i < j1 && count < 80; i += 1) {
                        if (r.data[i - 1] <= 0 && r.data[i] > 0) { tick(i, i < r.join ? col.gold : col.blue); count += 1; }
                    }
                }

                // ---- the paper's drawing: regions and their gains ----
                if (g.draw) {
                    const dr = g.draw;
                    const yG = (gain) => dr.bottom - gain * (dr.bottom - dr.top);
                    const xFade0 = xA(r.fadeStart); const xFade1 = xA(r.fadeEnd);
                    // regions as blocks
                    g2.globalAlpha = 0.1;
                    g2.fillStyle = col.gold; g2.fillRect(g.laneX0, dr.top, Math.max(0, Math.min(g.laneX1, xFade1) - g.laneX0), dr.bottom - dr.top);
                    if (sp) { g2.fillStyle = col.blue; g2.fillRect(Math.max(g.laneX0, xFade0), dr.top, Math.max(0, g.laneX1 - Math.max(g.laneX0, xFade0)), dr.bottom - dr.top); }
                    g2.globalAlpha = 1;
                    // gain axis, ticked
                    for (const gain of [0, 0.5, 1]) {
                        const y = Math.round(yG(gain)) + 0.5;
                        g2.strokeStyle = gain === 0 ? col.zero : col.grid; g2.beginPath(); g2.moveTo(g.laneX0, y); g2.lineTo(g.laneX1, y); g2.stroke();
                        g2.fillStyle = col.inkFaint; g2.textAlign = 'right'; g2.fillText(gain === 0.5 ? '0.5' : String(gain), g.labelX, y + 4);
                    }
                    g2.save(); g2.translate(14, (dr.top + dr.bottom) / 2); g2.rotate(-Math.PI / 2); g2.textAlign = 'center'; g2.fillStyle = col.inkFaint; g2.fillText('gain ↑', 0, 4); g2.restore();
                    // the region names
                    g2.font = `600 10.5px ${monoFace}`; g2.textAlign = 'left'; g2.fillStyle = col.gold;
                    g2.fillText('REGION A', g.laneX0 + 6, dr.top + 13);
                    if (sp) { g2.textAlign = 'right'; g2.fillStyle = col.blue; g2.fillText('REGION B', g.laneX1 - 6, dr.top + 13); }
                    else { g2.textAlign = 'right'; g2.fillStyle = col.inkFaint; g2.fillText('SILENCE', g.laneX1 - 6, dr.top + 13); }
                    g2.font = mono;
                    // the curves: out gain (A), in gain (B)
                    const pts = fadeCurve(s.shape, 65);
                    const curve = (key, colour) => {
                        g2.strokeStyle = colour; g2.lineWidth = 2.5; g2.lineJoin = 'round';
                        g2.beginPath();
                        const before = key === 'out' ? 1 : 0; const after = key === 'out' ? 0 : 1;
                        g2.moveTo(g.laneX0, yG(before));
                        g2.lineTo(Math.max(g.laneX0, Math.min(g.laneX1, xFade0)), yG(before));
                        if (r.fadeEnd > r.fadeStart) pts.forEach((p) => g2.lineTo(Math.max(g.laneX0, Math.min(g.laneX1, xA(r.fadeStart + p.t * (r.fadeEnd - r.fadeStart)))), yG(p[key])));
                        g2.lineTo(Math.max(g.laneX0, Math.min(g.laneX1, xFade1)), yG(after));
                        g2.lineTo(g.laneX1, yG(after));
                        g2.stroke(); g2.lineWidth = 1;
                    };
                    curve('out', col.gold);
                    if (sp) curve('in', col.blue);
                    // the crossfade, bracketed
                    const bx0 = Math.max(g.laneX0, xFade0); const bx1 = Math.min(g.laneX1, xFade1); const by = dr.top - 8;
                    g2.strokeStyle = col.inkSoft;
                    g2.beginPath(); g2.moveTo(bx0, by - 4); g2.lineTo(bx0, by); g2.lineTo(bx1, by); g2.lineTo(bx1, by - 4); g2.stroke();
                    g2.fillStyle = col.inkSoft; g2.textAlign = 'center';
                    const bracketLabel = s.length === 0 ? 'hard cut · no fade' : `${sp ? 'crossfade' : 'fade out'} ${fmtMs(s.length)} · ${SHAPES[s.shape].name}`;
                    g2.fillText(bracketLabel, Math.max(g.laneX0 + 90, Math.min(g.laneX1 - 90, (bx0 + bx1) / 2)), by - 8);
                    // Extension: the level through the crossfade, the two powers added
                    if (d === 'extension' && sp) {
                        const yDb = (db) => dr.top + (Math.max(-6, Math.min(0, db)) / -6) * (dr.bottom - dr.top);
                        g2.setLineDash([2, 3]); g2.strokeStyle = col.white; g2.globalAlpha = 0.9;
                        g2.beginPath();
                        g2.moveTo(g.laneX0, yDb(0)); g2.lineTo(Math.max(g.laneX0, Math.min(g.laneX1, xFade0)), yDb(0));
                        if (r.fadeEnd > r.fadeStart) pts.forEach((p) => g2.lineTo(Math.max(g.laneX0, Math.min(g.laneX1, xA(r.fadeStart + p.t * (r.fadeEnd - r.fadeStart)))), yDb(p.sumDb)));
                        g2.lineTo(Math.max(g.laneX0, Math.min(g.laneX1, xFade1)), yDb(0)); g2.lineTo(g.laneX1, yDb(0));
                        g2.stroke(); g2.setLineDash([]); g2.globalAlpha = 1;
                        g2.fillStyle = col.inkFaint; g2.textAlign = 'left';
                        for (const db of [0, -3, -6]) g2.fillText(`${db === 0 ? '0' : db} dB`, g.laneX1 + 4, yDb(db) + 4);
                        if (s.length > 0 && st.dipDb < -0.5) {
                            const xm = (Math.max(g.laneX0, xFade0) + Math.min(g.laneX1, xFade1)) / 2;
                            g2.fillStyle = col.white; g2.font = `600 10.5px ${monoFace}`; g2.textAlign = 'center';
                            g2.fillText(`dips ${fmtDb(st.dipDb)}`, xm, yDb(st.dipDb) + 14);
                            g2.font = mono;
                        }
                    }
                    // the probe: a moment in the crossfade, both gains read off
                    const probe = probeRef.current;
                    g2.font = mono; g2.textAlign = 'left';
                    if (probe != null) {
                        const px = xOfMs(probe);
                        const fadeMs0 = ((r.fadeStart - r.join) / sr) * 1000; const fadeMs1 = ((r.fadeEnd - r.join) / sr) * 1000;
                        const t = fadeMs1 > fadeMs0 ? Math.max(0, Math.min(1, (probe - fadeMs0) / (fadeMs1 - fadeMs0))) : probe < 0 ? 0 : 1;
                        const gOut = fadeOut(s.shape, t); const gIn = sp ? fadeIn(s.shape, t) : 0;
                        g2.save(); g2.setLineDash([2, 3]); g2.strokeStyle = col.goldBright; g2.globalAlpha = 0.85;
                        g2.beginPath(); g2.moveTo(px, dr.top); g2.lineTo(px, dr.bottom); g2.stroke();
                        g2.beginPath(); g2.moveTo(g.laneX0, yG(gOut)); g2.lineTo(px, yG(gOut)); g2.stroke();
                        if (sp) { g2.beginPath(); g2.moveTo(g.laneX0, yG(gIn)); g2.lineTo(px, yG(gIn)); g2.stroke(); }
                        g2.restore();
                        const dot = (y, colour) => { g2.beginPath(); g2.arc(px, y, 5, 0, Math.PI * 2); g2.fillStyle = col.plate; g2.fill(); g2.strokeStyle = colour; g2.lineWidth = 2; g2.stroke(); g2.lineWidth = 1; g2.beginPath(); g2.arc(g.laneX0, y, 3, 0, Math.PI * 2); g2.fillStyle = colour; g2.fill(); };
                        dot(yG(gOut), col.gold);
                        if (sp) dot(yG(gIn), col.blue);
                        g2.fillStyle = col.goldBright;
                        const lvl = d === 'extension' && sp ? ` · level ${fmtDb(sumDb(s.shape, t))}` : '';
                        g2.fillText(`at ${probe >= 0 ? '+' : '−'}${Math.abs(probe).toFixed(1)} ms · out ${gOut.toFixed(2)}${sp ? ` · in ${gIn.toFixed(2)}` : ''}${lvl}`, g.laneX0 + 80, dr.top + 13);
                    } else {
                        g2.fillStyle = col.inkSoft;
                        g2.fillText('drag inside to read the gains off', g.laneX0 + 80, dr.top + 13);
                    }
                }
            }

            // the chosen edit, for the depth, stopping short of the legend
            const segs = [`${TAKES[s.take].label} · cut ${fmtSec(s.cut / 1000)}`];
            if (sp) segs.push(`${(s.gap / 1000).toFixed(2)} s removed`);
            segs.push(s.length === 0 ? 'hard cut' : `${sp ? 'crossfade' : 'fade'} ${fmtMs(s.length)} ${SHAPES[s.shape].name}`);
            if (s.snap) segs.push('snapped to zero');
            if (d === 'extension' && st && s.length > 0) segs.push(`${st.lengthSamples} samples`);
            if (d === 'extension') segs.push(`window ${fmtMs(winMs)}`);
            g2.fillStyle = col.goldBright; g2.font = mono; g2.textAlign = 'left';
            if (frameRef.current % 20 === 0 && legendRef.current) legendWRef.current = legendRef.current.getBoundingClientRect().width;
            frameRef.current += 1;
            const room = w - 18 - legendWRef.current - 16 - (g.laneX0 + 6);
            let label = segs.join(' · ');
            while (segs.length > 2 && g2.measureText(label).width > room) { segs.pop(); label = segs.join(' · '); }
            g2.fillText(label, g.laneX0, g.settingY);

            geomRef.current = { g, hx, hy, winMs };
            // what this frame drew, told to the DOM for check-bench (law 19 and law 18)
            const cutTag = String(s.cut);
            if (canvas.dataset.cut !== cutTag) canvas.dataset.cut = cutTag;
            const handle = `${Math.round(hx)}:${Math.round(hy)}`;
            if (canvas.dataset.handle !== handle) canvas.dataset.handle = handle;
            const stageTag = stageOf(d);
            if (canvas.dataset.stage !== stageTag) canvas.dataset.stage = stageTag;
            const stepTag = st ? String(st.stepPct) : '';
            if (canvas.dataset.step !== stepTag) canvas.dataset.step = stepTag;
            const probeTag = probeRef.current == null ? '' : String(probeRef.current);
            if (canvas.dataset.probe !== probeTag) canvas.dataset.probe = probeTag;

            raf = requestAnimationFrame(draw);
        }
        raf = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(raf);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Drag the cut: its handle or line in the zoom window (fine), the marker
    // in the take above (coarse), or a probe inside the drawing.
    const hitHandle = (px, py) => {
        const gm = geomRef.current;
        if (!gm) return false;
        if (Math.hypot(px - gm.hx, py - gm.hy) < 16) return true;
        return Math.abs(px - gm.hx) < 8 && py >= gm.g.wave.top && py <= gm.g.wave.bottom;
    };
    const hitOverview = (px, py) => {
        const gm = geomRef.current;
        if (!gm) return false;
        const g = gm.g;
        return px >= g.laneX0 - 6 && px <= g.laneX1 + 6 && py >= g.ovTop - 10 && py <= g.ovTop + g.ovH + 8;
    };
    const hitDraw = (px, py) => {
        const gm = geomRef.current;
        const dr = gm?.g.draw;
        return Boolean(dr) && px >= gm.g.laneX0 - 4 && px <= gm.g.laneX1 + 4 && py >= dr.top - 4 && py <= dr.bottom + 4;
    };
    const msAtOverview = (px) => {
        const gm = geomRef.current;
        const b = bufOf(stateRef.current.take);
        if (!gm || !b) return stateRef.current.cut;
        const frac = (px - gm.g.laneX0) / gm.g.laneW;
        return frac * b.duration * 1000;
    };
    const probeAt = (px) => {
        const gm = geomRef.current;
        if (!gm) return;
        const ms = ((px - gm.g.laneX0) / gm.g.laneW - 0.5) * gm.winMs;
        probeRef.current = Math.round(ms * 10) / 10;
    };
    const onStageDown = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const px = e.clientX - rect.left; const py = e.clientY - rect.top;
        let where = null;
        if (hitHandle(px, py)) where = { where: 'join', x0: px, cut0: stateRef.current.cut };
        else if (hitOverview(px, py)) { where = { where: 'overview' }; setCut(msAtOverview(px)); }
        else if (hitDraw(px, py)) { where = { where: 'probe' }; probeAt(px); }
        if (!where) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        dragRef.current = where;
    };
    const onStageMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const px = e.clientX - rect.left; const py = e.clientY - rect.top;
        const gm = geomRef.current;
        const dg = dragRef.current;
        if (dg && gm) {
            if (dg.where === 'probe') { probeAt(px); return; }
            if (dg.where === 'overview') { setCut(msAtOverview(px)); return; }
            const dms = ((px - dg.x0) / gm.g.laneW) * gm.winMs;
            setCut(dg.cut0 + dms);
            return;
        }
        if (!teach) { if (hover) setHover(null); return; }
        const hit = hitHandle(px, py);
        if (!hit) { if (hover) setHover(null); return; }
        if (hover && hover.id === 'cut') return;
        setHover({ id: 'cut', x: gm.hx, y: gm.hy, stageW: rect.width, stageH: rect.height });
    };
    const onStageUp = (e) => {
        if (!dragRef.current) return;
        dragRef.current = null;
        try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* gone */ }
    };
    const onStageDouble = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        if (hitDraw(e.clientX - rect.left, e.clientY - rect.top)) probeRef.current = null;
    };

    // ---- drawer content ----
    const topicHref = (slug) => memberTopicHref(null, slug, studioOrigin);
    const drawerTabs = useMemo(() => [
        {
            id: 'reference',
            label: 'Reference',
            render: () => (
                <>
                    <h2>Editing, in the spec&apos;s words</h2>
                    <p>An edit is a decision about where a region starts and ends, and what happens at the join. Everything on this bench is the join: the cut, whether it lands on a zero crossing, and the fade or crossfade over it.</p>
                    <h3>Terms</h3>
                    <dl>
                        <dt>Region</dt><dd>A piece of a recording placed on the timeline (a clip in Live). Editing moves its edges; the audio file underneath is untouched.</dd>
                        <dt>Edit point</dt><dd>Where a region ends or begins: the cut. The 40 milliseconds either side of it are where an edit is clean or not.</dd>
                        <dt>Zero crossing</dt><dd>A sample where the waveform passes through the centre line. A cut placed there has nothing to jump from or to.</dd>
                        <dt>Discontinuity</dt><dd>The waveform jumping from one value to an unrelated one at the join. Heard as a click or pop. The mark scheme&apos;s own word.</dd>
                        <dt>Click, not clipping</dt><dd>A click is a join fault and has nothing to do with level; clipping is a level fault, the peaks flattened. The 2019 scheme refuses &quot;clipping&quot; as the answer.</dd>
                        <dt>Fade in, fade out</dt><dd>A gain ramp from or to silence at a region&apos;s edge. Either one creates the zero point a hard cut lacks.</dd>
                        <dt>Crossfade</dt><dd>A fade out and a fade in at the same time, across an overlap between two regions, so the level through the join holds.</dd>
                        <dt>Linear</dt><dd>The gain changes by the same amount every millisecond. Straight in amplitude, curved in dB, and 3 dB down in the middle of a crossfade of two unrelated sounds.</dd>
                        <dt>Equal power</dt><dd>The two gains follow a sine and a cosine, so their powers always add to one: the level holds through the crossfade.</dd>
                        <dt>S-curve</dt><dd>Slow at both ends, quick in the middle: the fade-out shape that follows how a decay is heard.</dd>
                        <dt>Truncation</dt><dd>Cutting a sound off before it has finished: a reverb tail, a cymbal, a held chord. The waveform looks finished long before the sound is.</dd>
                        <dt>Non-destructive</dt><dd>Edits that change what plays without rewriting the file. A destructive edit rewrites it, and every other region using that file changes too (the 2024 report&apos;s bars 12 and 52).</dd>
                    </dl>
                    <h3>In your DAW</h3>
                    <table>
                        <thead><tr><th>On this bench</th><th>Ableton Live</th><th>Logic Pro</th></tr></thead>
                        <tbody>
                            <tr><td>Cut</td><td>Split at the insert marker, then trim the clip edges</td><td>Scissors tool, or split at the playhead, then trim the region</td></tr>
                            <tr><td>Snap to zero crossing</td><td>No snap: use the clip&apos;s fade handles instead (fades on clip edges are on by default)</td><td>Snap Edits to Zero Crossings, in the Edit menu</td></tr>
                            <tr><td>Fade in, fade out</td><td>Fade handles at each clip edge in Arrangement, with a curve handle</td><td>Fade In and Fade Out in the region inspector, with a curve</td></tr>
                            <tr><td>Crossfade</td><td>Overlap two clips; the fades become a crossfade</td><td>Fade Out set to a crossfade type on the overlap</td></tr>
                        </tbody>
                    </table>
                    <p className={styles.source}>As the controls appear in Live 12 and Logic Pro 11. Check against your own version if they move.</p>
                    <h3>Beyond the paper<span className={styles.ext}>EXT</span></h3>
                    <dl>
                        <dt>Why a click is every frequency</dt><dd>A step has no period, so it is not a pitch: it is energy at every frequency at once. That is why a click sounds the same on a bass note and a cymbal, and why no EQ removes it.</dd>
                        <dt>Equal power, equal gain</dt><dd>Two unrelated sounds add in power, so the crossfade wants equal power. Two copies of the same sound add in amplitude, and equal power then bumps 3 dB in the middle; DAWs offer equal gain for that case.</dd>
                        <dt>How short is short</dt><dd>At 44.1 kHz a 10 ms fade is 441 samples. Under about 5 ms a fade starts to be heard as a click of its own on low notes, because a cycle at 100 Hz is 10 ms long.</dd>
                        <dt>Where a tail ends</dt><dd>The waveform display is linear, so it hides the last 40 dB of a decay the ear still follows. A cymbal that looks finished at half a second is still sounding at one and a half.</dd>
                    </dl>
                    <p className={styles.source}>The reading behind this bench is the topic&apos;s own Learn chapter, Clean edit points, and the 1.6 mark schemes.</p>
                </>
            ),
        },
        {
            id: 'teacher',
            label: 'Teacher',
            render: () => (
                <>
                    <h2>What to listen for</h2>
                    <p>The stage is the join, zoomed until the cycles show. Press Play and the loop runs through the cut about once a second; the pop you hear on every pass is the coral bar at the line. Hold dry and you hear the take as it was, including what the cut removed. Once you can hear a click come and go as you drag the cut a few milliseconds, you are hearing what the practical mark schemes mark.</p>
                    <h3>What cost candidates marks</h3>
                    <p>2024, copying eight-bar phrases into place: &quot;Most candidates were able to copy the correct sections of audio to the right places, but they usually failed to create smooth edit points, therefore resulting in unprofessional clicks and crossfades to the finished audio, yielding 2 marks, the most common score.&quot; And among the most common errors: &quot;not fading/removing the glitch at the end.&quot;</p>
                    <p>2018, a tight vocal edit: &quot;Students clearly found this challenging, few getting a good edit... Students need to expand the screen and use short fades to get a clean and complete edit.&quot;</p>
                    <p>2019, the explain question, three marks for the mechanism: &quot;Removes the clicks (not &apos;clipping&apos;). Due to discontinuity/not zero point in audio signal at start or end of segment/clip/region. Fade/crossfade creates a zero point at start/end. Crossfade on overlapping join can be used to smooth two regions with sustaining sounds (e.g. cymbal crash or strummed guitar).&quot;</p>
                    <p>2022, a click from a synth&apos;s release: &quot;Release too short / 0ms; cuts waveform mid-cycle / cuts waveform when it&apos;s not at 0 displacement / credit a diagram showing waveform cut mid-cycle.&quot; The report: most scored one mark; &quot;fewer candidates were able to further comment on what is then happening from a waveform perspective.&quot;</p>
                    <p className={styles.source}>Source: Edexcel 9MT0 mark schemes and Principal Examiner reports, 2018 AS Q3(a), 2019 AS Q3(c), 2022 A Q2(b), 2024 A Q2(e).</p>
                    <p>Those are the moves on this bench: press <b>The click</b> and say what the coral bar is in the 2019 scheme&apos;s word; press <b>Zero crossing</b> and say what changed on the drawing; press <b>Repair fade</b> and say why 10 ms is enough; press <b>The tail</b>, hold dry, and say what the waveform hid.</p>
                    <h3>Do these now</h3>
                    <ul>
                        <li>Press <b>The click</b>, switch the bench to A-level, and write the 2019 answer from the stage before you read it above: the fault, its cause, what a fade does. Then snap the cut and check your second sentence against the drawing.</li>
                        <li>Press <b>2022 paper</b> and draw what the stage shows on paper: a waveform cut when it is not at zero displacement. That drawing is the second mark.</li>
                        <li>With <b>Repair fade</b> on, drag Length up to 300 ms with Linear chosen and listen to the middle of the crossfade. Switch to Equal power. Say which one the 2019 scheme means by &quot;smooth&quot;.</li>
                        <li>Press <b>The tail</b>, hold dry, and count how long the cymbal really rings. Then turn Length up until the fade reaches the silence, and say why the 2024 report named the glitch at the end.</li>
                        <li>Press <b>2024 paper</b>: a 15 ms equal-power crossfade at a zero crossing. Say what two of the four marks cost the candidates who left it out.</li>
                        <li>Turn Snap off, drag the cut one millisecond at a time, and watch the jump change size with the cycle. Say why a zero crossing is never far away on a sung note.</li>
                    </ul>
                    <h3>Exam practice</h3>
                    <ExamCallout
                        prompt="Explain why it is important to use fades or crossfades when joining two sections of truncated audio. (3 marks, 2019)"
                        answer="Removes the clicks (not clipping), which are caused by a discontinuity, a non-zero point in the signal at the start or end of the region; a fade or crossfade creates a zero point there; and a crossfade on an overlapping join smooths two regions of sustaining sound, such as a cymbal crash or a strummed guitar."
                    />
                    <ExamCallout
                        prompt="Explain why the envelope settings cause a click in bar 25. (2 marks, 2022)"
                        answer="The release is too short (0 ms), so the envelope cuts the waveform mid-cycle, when it is not at zero displacement. The scheme credits a diagram of the waveform cut mid-cycle: the stage on The click, drawn."
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
                    <a className={styles.conn} href={topicHref('synthesis')}>
                        <i>1.3 Synthesis</i>
                        <b>A release of 0 ms is a hard cut</b>
                        <span>The 2022 paper&apos;s click came from an envelope, not an edit: a release too short cuts the waveform mid-cycle, the same discontinuity by another route.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('sampling')}>
                        <i>1.4 Sampling</i>
                        <b>Truncation and loop points</b>
                        <span>A sample that is cut short is truncated; a loop that clicks has its points off the zero crossings. The same two faults, inside a sampler.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('pitch-correction')}>
                        <i>1.7 Pitch and rhythm correction</i>
                        <b>Slice, move, crossfade</b>
                        <span>Rhythm repair cuts audio at every transient and moves it; every one of those cuts is a join that needs the crossfade this bench makes.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('mastering')}>
                        <i>1.14 Mastering</i>
                        <b>The end of the file</b>
                        <span>The last edit in any bounce is the one candidates forget: the 2024 report&apos;s glitch at the end, and the 2025 scheme&apos;s final fade that must be smooth.</span>
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
        const segs = judge({ state, last, stats });
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
        say = <>{openMachine({ state, last, stats })}{teach ? <> {DEPTH_TEACH.extension}</> : null}</>;
    } else {
        const next = nextMove(state, stats);
        say = teach
            ? <>{hearingLine(state, stats)} <b>Try:</b> {next}.</>
            : <><b>Try:</b> {next.charAt(0).toUpperCase() + next.slice(1)}.</>;
    }

    // ---- console ----
    // the Cut micro-diagram: the last two milliseconds of A against the first two of B
    const stepPts = useMemo(() => {
        if (!ch || !stats) return null;
        const n = Math.round(sr * 0.002);
        const at = (i) => (i != null && i >= 0 && i < ch.length ? ch[i] : 0);
        let peak = 0.02;
        for (let k = 0; k < n; k += 1) { peak = Math.max(peak, Math.abs(at(stats.outIdx - n + k)), stats.inIdx == null ? 0 : Math.abs(at(stats.inIdx + k))); }
        const y = (val) => 50 - (val / peak) * 40;
        const a = []; const b = [];
        for (let k = 0; k < n; k += 1) {
            a.push(`${(k / n) * 50},${y(at(stats.outIdx - n + k))}`);
            b.push(`${50 + (k / n) * 50},${y(stats.inIdx == null ? 0 : at(stats.inIdx + k))}`);
        }
        return { a: a.join(' '), b: b.join(' '), y0: y(at(stats.outIdx - 1)), y1: y(stats.inIdx == null ? 0 : at(stats.inIdx)) };
    }, [ch, stats, sr]);
    const fadePts = useMemo(() => {
        const pts = fadeCurve(state.shape, 33);
        // rounded: the server and the browser disagree in the last digits of a sine, and React would call that a hydration mismatch
        const f = (v) => v.toFixed(2);
        return {
            out: pts.map((p) => `${f(p.t * 100)},${f(100 - p.out * 100)}`).join(' '),
            in: pts.map((p) => `${f(p.t * 100)},${f(100 - p.in * 100)}`).join(' '),
        };
    }, [state.shape]);
    const shapeOptions = SHAPE_IDS.map((id) => ({ id, label: SHAPES[id].label, title: SHAPES[id].does }));
    const cutMeaning = !stats ? 'where the region ends'
        : stats.faded ? `jump ${stats.stepPct}% under the fade` + (stats.atZero ? ', at zero anyway' : '')
            : stats.atZero ? 'meets at zero · no click' : `jump ${stats.stepPct}% · a click`;
    const fadeMeaning = state.length === 0 ? 'a hard cut: no fade'
        : !splice ? `${lengthWord(state.length)} · ends at the cut`
            : stats && stats.dipDb < -0.5 ? `level dips ${fmtDb(stats.dipDb)} mid-fade` : 'level steady through the join';

    const consoleSlot = (
        <>
            <PlayColumn
                playing={playing}
                onTogglePlay={togglePlay}
                onHoldDry={(held) => graphRef.current?.holdDry(held)}
                level={state.level}
                onLevel={(v) => setState((s) => ({ ...s, level: v }))}
                teach={teach}
                holdTitle="Hold to hear the take with no edit"
                holdWhy="plays the untouched take from the same point, so you can hear what the cut removed or the fade changed"
            />

            <div className={`${styles.sec} ${styles.secSource}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>Take</span></div>
                <div className={styles.grid2} role="group" aria-label="Take">
                    {TAKE_IDS.map((id) => (
                        <button key={id} type="button" className={styles.srcBtn} aria-pressed={state.take === id} onClick={() => chooseTake(id)}>
                            {TAKES[id].label}
                        </button>
                    ))}
                </div>
                <div className={styles.meaning}>{splice ? 'a splice' : 'a trim'}</div>
                <Why>Two takes, two edits. The vocal is a splice: a held note shortened by removing a section, so the join has a sound on both sides. The cymbal is a trim: one region ended, with silence after it, on a sound that decays for longer than it looks.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secCut}`} data-teach={teach || undefined}>
                <div className={styles.secHead}>
                    <span className={styles.eyebrow} data-hot="true">Cut</span>
                    <span className={styles.value}>{fmtSec(state.cut / 1000)}</span>
                </div>
                <div className={styles.instrument}>
                    <Dial
                        label="Cut"
                        value={state.cut}
                        min={range.lo}
                        max={range.hi}
                        step={1}
                        format={(v) => fmtSec(v / 1000)}
                        pointer="var(--gold)"
                        hot
                        pixels={700}
                        onChange={(v) => setCut(v)}
                        title="Where the region ends. Drag the line on the stage for the same thing"
                    />
                    <div className={styles.diagram} aria-hidden="true">
                        <small>the join</small>
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={styles.stepSvg}>
                            <line x1="0" y1="50" x2="100" y2="50" style={{ stroke: 'var(--hair)', strokeWidth: 1 }} />
                            {stepPts ? (
                                <>
                                    <polyline points={stepPts.a} style={{ stroke: 'var(--gen-5)', strokeWidth: 1.5 }} />
                                    <polyline points={stepPts.b} style={{ stroke: 'var(--gen-2)', strokeWidth: 1.5 }} />
                                    {state.length === 0 && stats && !stats.atZero ? <line x1="50" y1={stepPts.y0} x2="50" y2={stepPts.y1} style={{ stroke: 'var(--gen-6)', strokeWidth: 3 }} /> : null}
                                </>
                            ) : null}
                        </svg>
                    </div>
                </div>
                <Chips
                    label="Snap"
                    options={[{ id: 'off', label: 'Anywhere' }, { id: 'zero', label: 'Zero crossing' }]}
                    value={state.snap ? 'zero' : 'off'}
                    onChange={(id) => chooseSnap(id === 'zero')}
                />
                <div className={styles.meaning}>{cutMeaning}</div>
                <Why>Where region A ends. The small drawing is the last two milliseconds of A against the first two of B, and the coral bar between them is the jump a hard cut makes there. <b>Zero crossing</b> moves the cut to where the wave comes up through the centre line, on both sides, so there is nothing to jump.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secFade}`} data-teach={teach || undefined}>
                <div className={styles.secHead}>
                    <span className={styles.eyebrow}>Fade</span>
                    <span className={styles.value}>{state.length === 0 ? 'none' : fmtMs(state.length)}</span>
                </div>
                <div className={styles.instrument}>
                    <Dial
                        label="Length"
                        value={state.length}
                        min={0}
                        max={LENGTH_MAX}
                        step={1}
                        format={(v) => (v === 0 ? 'none' : fmtMs(v))}
                        pointer="var(--green)"
                        pixels={400}
                        onChange={(v) => patch({ length: v }, 'length')}
                        title={splice ? 'The crossfade, centred on the cut' : 'The fade out, ending at the cut'}
                    />
                    <div className={styles.diagram} aria-hidden="true">
                        <small>shape</small>
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={styles.shapeSvg}>
                            <polyline points={fadePts.out} style={{ stroke: 'var(--gen-5)' }} />
                            {splice ? <polyline points={fadePts.in} style={{ stroke: 'var(--gen-2)' }} /> : null}
                        </svg>
                    </div>
                </div>
                <Chips label="Shape" options={shapeOptions} value={state.shape} onChange={(id) => patch({ shape: id }, 'shape')} />
                <div className={styles.meaning}>{fadeMeaning}</div>
                <Why>{splice
                    ? 'A crossfade: region A fades down while region B fades up, across this many milliseconds centred on the cut. Ten milliseconds removes a click; a few hundred is a transition you can hear. The shape decides the level through the middle: linear dips, equal power holds.'
                    : 'A fade out: the gain falls to silence across this many milliseconds, ending at the cut. Long enough to reach where the cymbal is actually silent and nothing is chopped. Linear falls late then all at once; the S-curve follows the ear.'}</Why>
            </div>

            <div className={`${styles.sec} ${styles.secHear}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>What you should hear</span></div>
                <div className={styles.stats} aria-live="polite">
                    <div><b>{stats ? `${stats.stepPct}%` : '…'}</b><span>{stats && stats.faded ? 'jump, under the fade' : 'jump at the cut'}</span></div>
                    {splice
                        ? <div><b>{stats ? (stats.faded ? fmtDb(stats.dipDb) : '0 dB') : '…'}</b><span>dip through the fade</span></div>
                        : <div><b>{state.length === 0 ? 'none' : fmtMs(state.length)}</b><span>fade out to silence</span></div>}
                    {splice
                        ? <div><b>{stats ? `${stats.removedSec.toFixed(2)} s` : '…'}</b><span>removed after the cut</span></div>
                        : <div><b>{stats ? `${stats.tailLostSec.toFixed(2)} s` : '…'}</b><span>of tail cut off</span></div>}
                    {ext
                        ? <div><b>{stats ? stats.lengthSamples : '…'}</b><span>samples in the fade<span className={styles.ext}>EXT</span></span></div>
                        : splice
                            ? <div><b>{stats && stats.inSec != null ? fmtSec(stats.inSec) : '…'}</b><span>region B starts</span></div>
                            : <div><b>{stats ? fmtSec(stats.tailEndSec) : '…'}</b><span>the cymbal really ends</span></div>}
                </div>
                {teach ? <div className={styles.meaning}>all from the samples and the dials</div> : null}
                <Legal />
                <Why>Every number here comes from the samples and the dials: how far apart the two sides of the join sit, how much the level dips through the crossfade, how much of the take the edit removed or cut off, and where region B starts or where the cymbal is actually silent.</Why>
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
            <span className={styles.eyebrow}>Removed</span>
            <Chips
                label="Removed"
                options={GAPS.map((o) => ({ ...o, disabled: !splice }))}
                value={state.gap}
                onChange={(id) => { patch({ gap: id }, 'gap'); }}
            />
            <span className={styles.chipNote}>{splice ? 'how much of the take the splice takes out' : 'a trim removes nothing: it ends'}</span>
        </div>
    ) : null;

    const stage = (
        <>
            <canvas
                ref={canvasRef}
                aria-label={maths ? "The join at cycle zoom, the whole take above it, and the paper's drawing of the two regions and their fades" : 'The join at cycle zoom, with the whole take above it'}
                role="img"
                onPointerDown={onStageDown}
                onPointerMove={onStageMove}
                onPointerUp={onStageUp}
                onPointerCancel={onStageUp}
                onDoubleClick={onStageDouble}
                onPointerLeave={() => { if (!dragRef.current) setHover(null); }}
            />
            <div className={styles.stageNote}>
                <b>{take.label} · {fmtMs(winMsOf(state))} window</b>
                <span>{ORIENTS[depth] || ORIENTS.core}</span>
            </div>
            <div ref={legendRef} className={`${styles.stageLegend} ${styles.legendTop}`} aria-hidden="true">
                <span><i style={{ background: 'var(--gen-5)' }} />region A</span>
                {splice ? <span><i style={{ background: 'var(--gen-2)' }} />region B</span> : null}
                <span><i style={{ background: 'var(--gen-6)' }} />the jump</span>
                <span><i style={{ background: 'var(--gold-bright)', borderRadius: '50%' }} />cut</span>
                {maths ? <span><i style={{ background: 'transparent', border: '2px solid var(--gold-bright)', borderRadius: '50%' }} />probe</span> : null}
                {ext ? <span><i style={{ background: 'transparent', borderTop: '2px dotted #fff', height: 0, borderRadius: 0 }} />level</span> : null}
            </div>
            {hover && teach ? (
                <div
                    className={styles.tip}
                    style={{
                        left: Math.max(12, Math.min(hover.stageW - 290, hover.x - 135)),
                        top: Math.max(44, Math.min(hover.stageH - 120, hover.y + 22)),
                    }}
                >
                    <i>cut · {fmtSec(state.cut / 1000)}</i>
                    <p>
                        {stats && stats.atZero ? 'Both sides meet at zero here, so there is nothing to jump. ' : stats ? `The two sides of the join sit ${stats.stepPct}% of full scale apart, and that jump is the click. ` : ''}
                        Drag to move the cut a few milliseconds at a time; the marker above moves it through the whole take.
                    </p>
                </div>
            ) : null}
            {!began ? (
                <div className={styles.begin}>
                    <button type="button" className={styles.beginBtn} onClick={() => audio.start()}>
                        <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1.2v9.6L11 6z" fill="currentColor" /></svg>
                        <span>
                            Play the bench
                            <small>A real vocal take, cut by hand. Headphones help.</small>
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
