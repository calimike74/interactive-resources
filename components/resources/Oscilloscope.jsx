'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BenchFrame from '@/components/bench/BenchFrame';
import { Dial, Chips, Why, MoreButton } from '@/components/bench/controls';
import { PlayColumn, Presets, Legal, ExamCallout, useBenchMode, useBenchDepth, DEPTHS } from '@/components/bench/BenchBits';
import { useBenchAudio, glide } from '@/components/bench/useBenchAudio';
import styles from '@/components/bench/bench.module.css';
import { memberTopicHref, useStudioArrival } from '@/lib/studio-return';
import { DEPTH_LINES, DEPTH_TEACH, judge, open as openMachine, hearingLine, nextMove } from '@/lib/bench/scope-depth';
import {
    DIVS, SOURCE_IDS, SOURCES, OCTAVE_IDS, OCTAVES, TIME_BASE_IDS, TIME_BASES, LEVEL_MIN, LEVEL_MAX, LFO_IDS, LFOS, BPM,
    CHANNEL_IDS, RATE_IDS, DEPTH_IDS, FILE_BASE, PRESETS, TASKS, DEFAULT_STATE,
    applyPreset, setSource, setOctave, setTimeBase, setLevel, setLfo, setChannels, setRate, setDepth, setVolume, stretchTo,
    frequency, sourceHz, periodMs, fmtHz, fmtMs, fmtS, fmtMb, dbToGain, lfoHz, fileMb, bytesPerSecond, readings, verdict,
} from '@/lib/bench/scope-model';

// The Oscilloscope (2.5), eighth bench to the Bench Standard. One sound
// against time in milliseconds, five divisions across, as the written
// paper prints its figures: the period as a length you can read, the
// octave as a halving of it, louder as height, the LFO as a wave slow
// enough to count, the file as bytes a second. Three jobs
// (lib/bench/scope-depth.js): Core shows the screen, A-level works the
// paper's ladder beside it, Extension shows the samples and the file.
// The bracket on the screen is the control (law 23): drag its end and the
// wave stretches, and the note falls.
//
// The four waveforms play on oscillators, the topic's own object (the
// paper asks you to identify and draw them), so the bench declares
// synthesis; the three notes are recordings.

const CODE = '2.5 Numeracy';
const TITLE = 'Oscilloscope';
const FILES = Object.fromEntries(SOURCE_IDS.filter((id) => SOURCES[id].kind === 'file').map((id) => [id, SOURCES[id].file]));
const ORIENTS = {
    core: 'The sound against time in ms, as the paper prints it. Drag the bracket\'s end to stretch or squeeze the wave.',
    alevel: 'Beside the screen, the paper\'s ladder: the period in ms and in s, the frequency, the pitch. One mark a rung.',
    extension: 'The trace as the samples a converter keeps, dots at the file\'s sample rate; beneath it the file as bytes a second.',
};
const OSC_GAIN = { sine: 0.35, triangle: 0.42, square: 0.25, sawtooth: 0.42 }; // measured 30 Aug: every waveform within a decibel of the recordings
const ROLL_MS = 1400;

// ---- the graph ------------------------------------------------------------
// source (a looping recording or an oscillator) -> tremolo -> level -> the
// analyser the screen reads -> master. The LFO is an oscillator into the
// tremolo gain, at the rate the tempo gives.
function buildScopeGraph(ctx, input, master) {
    const trem = ctx.createGain();
    trem.gain.value = 1;
    const level = ctx.createGain();
    level.gain.value = 1;
    const tap = ctx.createAnalyser();
    tap.fftSize = 8192;
    tap.smoothingTimeConstant = 0;
    trem.connect(level);
    level.connect(tap);
    tap.connect(master);
    input.connect(master);
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0;
    const depth = ctx.createGain();
    depth.gain.value = 0;
    lfo.connect(depth);
    depth.connect(trem.gain);
    lfo.start();
    const buf = new Float32Array(tap.fftSize);
    let cur = null;
    function stopCur() {
        if (!cur) return;
        const { node, g } = cur;
        const t = ctx.currentTime;
        g.gain.setTargetAtTime(0, t, 0.008);
        try { node.stop(t + 0.06); } catch { /* ended */ }
        cur = null;
    }
    function play(state, getBuffer) {
        stopCur();
        const s = SOURCES[state.source];
        const hz = frequency(state);
        const t = ctx.currentTime;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.connect(trem);
        if (s.kind === 'file') {
            const b = getBuffer(state.source);
            if (!b) return;
            const src = ctx.createBufferSource();
            src.buffer = b;
            src.loop = true;
            src.playbackRate.value = hz / s.hz;
            src.connect(g);
            g.gain.linearRampToValueAtTime(1, t + 0.025);
            src.start(t);
            cur = { node: src, g, kind: 'file', base: s.hz };
        } else {
            const osc = ctx.createOscillator();
            osc.type = s.type;
            osc.frequency.value = hz;
            osc.connect(g);
            g.gain.linearRampToValueAtTime(OSC_GAIN[s.type] || 0.5, t + 0.025);
            osc.start(t);
            cur = { node: osc, g, kind: 'osc' };
        }
    }
    function setPitch(state) {
        if (!cur) return;
        const hz = frequency(state);
        const t = ctx.currentTime;
        const p = cur.kind === 'file' ? cur.node.playbackRate : cur.node.frequency;
        p.cancelScheduledValues(t);
        p.setTargetAtTime(cur.kind === 'file' ? hz / cur.base : hz, t, 0.02);
    }
    function setLevelDb(db) { glide(level.gain, dbToGain(db), ctx, 0.02); }
    function setLfoHz(hz) {
        const t = ctx.currentTime;
        lfo.frequency.setValueAtTime(hz || 0, t);
        depth.gain.setTargetAtTime(hz ? 0.45 : 0, t, 0.02);
        trem.gain.setTargetAtTime(hz ? 0.55 : 1, t, 0.02);
    }
    function frame() { tap.getFloatTimeDomainData(buf); return buf; }
    function clear() { stopCur(); }
    return { play, setPitch, setLevelDb, setLfoHz, frame, clear, sampleRate: ctx.sampleRate, live: () => Boolean(cur) };
}

// ---- the bench ------------------------------------------------------------
export default function Oscilloscope({ back }) {
    const [state, setState] = useState(DEFAULT_STATE);
    const [further, setFurther] = useState(false);
    const [mode, setMode] = useBenchMode();
    const [depth, setDepth] = useBenchDepth();
    const [hover, setHover] = useState(null);
    const [last, setLast] = useState('preset');
    const [announce, setAnnounce] = useState(null);
    const [held, setHeld] = useState(false);
    const stateRef = useRef(state);
    stateRef.current = state;
    const hoverRef = useRef(null);
    hoverRef.current = hover;
    const heldRef = useRef(false);
    const { studioOrigin } = useStudioArrival();
    const teach = mode === 'teacher';
    const ext = depth === 'extension';
    const maths = depth !== 'core';

    const graphRef = useRef(null);
    const onSchedule = useCallback(() => {}, []);
    const buildGraph = useCallback((ctx, input, master) => {
        const g = buildScopeGraph(ctx, input, master);
        graphRef.current = g;
        return g;
    }, []);
    const audio = useBenchAudio({ files: FILES, bpm: BPM, onSchedule, buildGraph });
    const { ctxRef, nodesRef, began, playing, getBuffer } = audio;
    const playingRef = useRef(false);
    playingRef.current = playing;

    // What plays: the state, or the sound as played while the button is held.
    const heard = useCallback((s) => (heldRef.current ? { ...s, octave: 'as', stretch: 1, level: 0, lfo: 'off' } : s), []);
    const apply = useCallback((s, restart) => {
        const g = graphRef.current;
        if (!g || !playingRef.current) return;
        const h = heard(s);
        if (restart || !g.live()) g.play(h, getBuffer); else g.setPitch(h);
        g.setLevelDb(h.level);
        g.setLfoHz(lfoHz(h.lfo));
    }, [getBuffer, heard]);
    useEffect(() => { if (playing) apply(stateRef.current, true); }, [playing, apply]);
    useEffect(() => { apply(state, true); }, [state.source]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { apply(state, false); }, [state.octave, state.stretch, state.hz, state.level, state.lfo, held]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => {
        const ctx = ctxRef.current;
        const nodes = nodesRef.current;
        if (ctx && nodes) glide(nodes.level.gain, state.volume, ctx);
    }, [state.volume, began, ctxRef, nodesRef]);

    const touch = (what) => { setLast(what); setAnnounce(null); };
    const chooseDepth = (id) => { setDepth(id); setAnnounce(id); };
    const chooseSource = (id) => { setState((s) => setSource(s, id)); touch('source'); };
    const chooseOctave = (id) => { setState((s) => setOctave(s, id)); touch('octave'); };
    const chooseTimeBase = (id) => { setState((s) => setTimeBase(s, id)); touch('screen'); };
    const chooseLevel = (v) => { setState((s) => setLevel(s, v)); touch('level'); };
    const chooseLfo = (id) => { setState((s) => setLfo(s, id)); touch('lfo'); };
    const chooseFile = (kind, v) => { setState((s) => (kind === 'ch' ? setChannels(s, v) : kind === 'rate' ? setRate(s, v) : setDepth(s, v))); touch('file'); };
    const choosePreset = (id) => { setState((s) => applyPreset(s, id)); touch('preset'); };
    const holdAsPlayed = (on) => { heldRef.current = on; setHeld(on); };
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

    const vd = useMemo(() => verdict(state), [state]);
    const rd = useMemo(() => readings(state), [state]);
    const vdRef = useRef(vd); vdRef.current = vd;
    const rdRef = useRef(rd); rdRef.current = rd;
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
    const readRef = useRef(null);
    const rollRef = useRef([]);
    const stageOf = (d) => (d === 'core' ? 'scope' : d === 'alevel' ? 'paper' : 'digital');
    const geom = (w, h2, d) => {
        const short = h2 < 330;
        const padL = 52; const padR = 16; const top = short ? 48 : 54; const bottom = h2 - (short ? 20 : 26);
        const paperW = d === 'alevel' ? Math.round(Math.max(300, Math.min(420, w * 0.34))) : 0;
        const fileH = d === 'extension' ? (short ? 50 : 58) : 0;
        const x1 = w - padR - paperW - (paperW ? 12 : 0);
        return {
            w, h: h2, top, bottom, settingY: top - 10,
            screen: { x0: padL, x1, top, bottom: bottom - fileH - (fileH ? 10 : 0) },
            paper: paperW ? { x0: x1 + 12, x1: w - padR, top, bottom: bottom - fileH - (fileH ? 10 : 0) } : null,
            file: fileH ? { x0: padL, x1: w - padR, top: bottom - fileH, bottom } : null,
        };
    };

    useEffect(() => {
        const first = canvasRef.current;
        if (!first) return undefined;
        let raf = 0;
        const css = getComputedStyle(first.parentElement);
        const v = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
        const col = {
            teal: v('--teal', '#7cc4b8'),
            coral: v('--gen-6', '#d08a80'),
            goldBright: v('--gold-bright', '#f0d48a'),
            purple: v('--purple', '#a395c9'),
            white: '#ffffff',
            ink: 'rgba(255, 255, 255, 0.86)',
            inkSoft: 'rgba(255, 255, 255, 0.62)',
            inkFaint: 'rgba(255, 255, 255, 0.38)',
            grid: 'rgba(255, 255, 255, 0.07)',
            gridDiv: 'rgba(255, 255, 255, 0.18)',
            gridMid: 'rgba(255, 255, 255, 0.3)',
            line: 'rgba(255, 255, 255, 0.22)',
            screen: 'rgba(0, 0, 0, 0.18)',
        };
        const srcCol = (id) => v(SOURCES[id].colour.replace(/^var\(|\)$/g, ''), '#7fb0c4');
        const monoFace = v('--mono', 'monospace');
        const mono = `11.5px ${monoFace}`;
        const monoSmall = `10px ${monoFace}`;
        const monoBig = `13px ${monoFace}`;

        function draw() {
            const canvas = canvasRef.current;
            if (!canvas) { raf = requestAnimationFrame(draw); return; }
            const g2 = canvas.getContext('2d');
            const s = stateRef.current;
            const d = depthRef.current;
            const vdd = vdRef.current;
            const rdd = rdRef.current;
            const isHeld = heldRef.current;
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
            const S = g.screen;
            const W = S.x1 - S.x0;
            const H = S.bottom - S.top;
            const mid = (S.top + S.bottom) / 2;
            const half = H / 2 - 6;
            const tb = TIME_BASES[s.timeBase];
            const span = tb.span;
            const xOfMs = (ms) => S.x0 + (ms / span) * W;
            const msOfX = (x) => ((x - S.x0) / W) * span;
            const pcol = srcCol(s.source);
            const gr = graphRef.current;
            const live = playingRef.current && gr && gr.live();
            const heardHz = isHeld ? sourceHz(s) : rdd.hz;
            const heardMs = periodMs(heardHz);
            g2.font = mono; g2.lineWidth = 1;

            // ---- the screen: graph paper, five divisions across, four down ----
            g2.fillStyle = col.screen; g2.fillRect(S.x0, S.top, W, H);
            for (let i = 0; i <= DIVS * 5; i += 1) {
                const x = Math.round(S.x0 + (i / (DIVS * 5)) * W) + 0.5;
                g2.strokeStyle = i % 5 === 0 ? col.gridDiv : col.grid;
                g2.beginPath(); g2.moveTo(x, S.top); g2.lineTo(x, S.bottom); g2.stroke();
            }
            for (let i = 0; i <= 8; i += 1) {
                const y = Math.round(S.top + (i / 8) * H) + 0.5;
                g2.strokeStyle = i === 4 ? col.gridMid : i % 2 === 0 ? col.gridDiv : col.grid;
                g2.beginPath(); g2.moveTo(S.x0, y); g2.lineTo(S.x1, y); g2.stroke();
            }
            g2.strokeStyle = col.line; g2.strokeRect(S.x0 + 0.5, S.top + 0.5, W - 1, H - 1);
            // the paper's axis labels
            g2.fillStyle = col.inkFaint; g2.font = monoSmall; g2.textAlign = 'center';
            for (let i = 1; i <= DIVS; i += 1) g2.fillText(`${i * tb.ms}`, xOfMs(i * tb.ms), S.bottom + 13);
            g2.textAlign = 'left'; g2.fillText('Time (ms)', S.x0 + 4, S.bottom + 13);
            g2.save(); g2.translate(S.x0 - 40, mid); g2.rotate(-Math.PI / 2); g2.textAlign = 'center'; g2.fillText('Displacement', 0, 0); g2.restore();
            g2.textAlign = 'right'; g2.fillText('+', S.x0 - 5, S.top + 10); g2.fillText('0', S.x0 - 5, mid + 3.5); g2.fillText('−', S.x0 - 5, S.bottom - 3);

            // ---- the trace ----
            let handle = null;
            const roll = rollRef.current;
            if (live) {
                const buf = gr.frame();
                const sr = gr.sampleRate;
                const N = buf.length;
                const need = Math.round((span / 1000) * sr);
                // roll: the newest 16 ms of every frame, for the slow time bases
                let lo = 1; let hi = -1;
                const tailN = Math.min(N, Math.round(sr * 0.016));
                for (let i = N - tailN; i < N; i += 1) { const x = buf[i]; if (x < lo) lo = x; if (x > hi) hi = x; }
                roll.push({ t: performance.now(), lo, hi });
                while (roll.length && roll[0].t < performance.now() - ROLL_MS) roll.shift();
                if (need <= N - 96) {
                    // triggered: a rising zero crossing after a trough, so the trace stands still
                    let start = 64;
                    let peak = 0;
                    for (let i = 0; i < N; i += 1) { const a = Math.abs(buf[i]); if (a > peak) peak = a; }
                    const thr = peak * 0.12;
                    let seenTrough = false;
                    for (let i = 65; i < N - need; i += 1) {
                        if (buf[i] < -thr) seenTrough = true;
                        if (seenTrough && buf[i - 1] < 0 && buf[i] >= 0) { start = i; break; }
                    }
                    const step = Math.max(1, Math.floor(need / 1600));
                    g2.strokeStyle = pcol; g2.lineWidth = 1.8; g2.globalAlpha = isHeld ? 0.7 : 1;
                    g2.beginPath();
                    for (let j = 0; j < need; j += step) {
                        const x = S.x0 + (j / need) * W;
                        const y = mid - Math.max(-1.05, Math.min(1.05, buf[start + j])) * half;
                        if (j === 0) g2.moveTo(x, y); else g2.lineTo(x, y);
                    }
                    g2.stroke(); g2.globalAlpha = 1; g2.lineWidth = 1;
                    // Extension: the samples a converter keeps, at the file's rate
                    if (d === 'extension') {
                        const per = sr / (s.rate * 1000);
                        const dots = need / per;
                        if (dots <= 900) {
                            g2.fillStyle = col.white;
                            for (let k = 0; k * per < need; k += 1) {
                                const j = Math.round(k * per);
                                g2.beginPath(); g2.arc(S.x0 + (j / need) * W, mid - Math.max(-1.05, Math.min(1.05, buf[start + j])) * half, dots > 300 ? 1.2 : 1.9, 0, Math.PI * 2); g2.fill();
                            }
                        } else {
                            g2.fillStyle = col.inkFaint; g2.font = monoSmall; g2.textAlign = 'left';
                            g2.fillText(`${Math.round(dots).toLocaleString('en-GB')} samples across the screen at ${s.rate} kHz: too many to dot; set a shorter time base`, S.x0 + 8, S.bottom - 8);
                        }
                    }
                    // the period bracket: one cycle from the trigger point
                    const pxLen = (heardMs / span) * W;
                    const bx0 = S.x0; const bx1 = Math.min(S.x1, S.x0 + pxLen);
                    const by = S.top + 16;
                    g2.strokeStyle = col.goldBright; g2.lineWidth = 1.5;
                    g2.beginPath(); g2.moveTo(bx0, by - 6); g2.lineTo(bx0, by + 6); g2.moveTo(bx0, by); g2.lineTo(bx1, by); g2.moveTo(bx1, by - 6); g2.lineTo(bx1, by + 6); g2.stroke();
                    if (pxLen > W) { g2.beginPath(); g2.moveTo(bx1 - 8, by - 4); g2.lineTo(bx1, by); g2.lineTo(bx1 - 8, by + 4); g2.stroke(); }
                    g2.lineWidth = 1;
                    const hot = (dragRef.current && dragRef.current.kind === 'bracket') || (hoverRef.current && hoverRef.current.kind === 'handle');
                    g2.beginPath(); g2.arc(bx1, by, hot ? 7 : 5, 0, Math.PI * 2); g2.fillStyle = col.goldBright; g2.fill(); g2.strokeStyle = '#17172b'; g2.lineWidth = 1.5; g2.stroke(); g2.lineWidth = 1;
                    g2.fillStyle = col.goldBright; g2.font = monoBig; g2.textAlign = 'left';
                    const label = pxLen > W ? `one cycle: ${fmtMs(heardMs)}, longer than the screen` : `one cycle: ${fmtMs(heardMs)}`;
                    g2.fillText(label, Math.min(bx0 + 8, S.x1 - 8 - g2.measureText(label).width), by + 22);
                    handle = { x: bx1, y: by };
                } else {
                    // rolled: the envelope of the last span ms, right edge is now
                    const now = performance.now();
                    g2.fillStyle = pcol; g2.globalAlpha = 0.55;
                    g2.beginPath();
                    const pts = roll.filter((p) => p.t >= now - span);
                    pts.forEach((p, i) => { const x = S.x1 - ((now - p.t) / span) * W; const y = mid - Math.min(1.05, p.hi) * half; if (i === 0) g2.moveTo(x, y); else g2.lineTo(x, y); });
                    for (let i = pts.length - 1; i >= 0; i -= 1) { const p = pts[i]; const x = S.x1 - ((now - p.t) / span) * W; g2.lineTo(x, mid - Math.max(-1.05, p.lo) * half); }
                    g2.closePath(); g2.fill(); g2.globalAlpha = 1;
                    g2.fillStyle = col.inkFaint; g2.font = monoSmall; g2.textAlign = 'left';
                    g2.fillText(`${span} ms rolling by: each cycle is ${fmtMs(heardMs)}, too short to bracket here; the envelope shows the LFO`, S.x0 + 8, S.bottom - 8);
                    if (s.lfo !== 'off' && !isHeld) {
                        const lms = 1000 / lfoHz(s.lfo);
                        const bx1 = S.x1 - 8; const bx0 = Math.max(S.x0, bx1 - (lms / span) * W); const by = S.top + 16;
                        g2.strokeStyle = col.teal; g2.lineWidth = 1.5;
                        g2.beginPath(); g2.moveTo(bx0, by - 6); g2.lineTo(bx0, by + 6); g2.moveTo(bx0, by); g2.lineTo(bx1, by); g2.moveTo(bx1, by - 6); g2.lineTo(bx1, by + 6); g2.stroke(); g2.lineWidth = 1;
                        g2.fillStyle = col.teal; g2.font = monoBig; g2.textAlign = 'right';
                        g2.fillText(`one swell: ${fmtMs(lms)} · ${lfoHz(s.lfo)} Hz`, bx1, by + 22);
                    }
                }
            } else {
                g2.fillStyle = col.inkFaint; g2.font = mono; g2.textAlign = 'center';
                g2.fillText(began ? 'press Play and the trace draws' : '', (S.x0 + S.x1) / 2, mid + 4);
                roll.length = 0;
            }

            // ---- A-level: the paper's ladder beside the screen ----
            if (g.paper) {
                const P = g.paper;
                g2.strokeStyle = col.line; g2.strokeRect(P.x0 + 0.5, P.top + 0.5, P.x1 - P.x0 - 1, P.bottom - P.top - 1);
                g2.fillStyle = col.goldBright; g2.font = monoSmall; g2.textAlign = 'left';
                g2.fillText('THE LADDER', P.x0 + 8, P.top + 13);
                const lines = [];
                const src = SOURCES[s.source];
                lines.push([col.inkFaint, 'waveform', col.ink, src.kind === 'osc' ? `${src.label.toLowerCase()} wave` : `${src.said}`]);
                lines.push([col.inkFaint, 'period', col.ink, `${fmtMs(heardMs)}`]);
                lines.push([col.inkFaint, 'in seconds', col.ink, `${fmtS(heardMs / 1000)}`]);
                lines.push([col.inkFaint, 'f = 1 ÷ T', col.ink, `${fmtHz(heardHz)}`]);
                lines.push([col.inkFaint, 'pitch', col.ink, `${rdd.noteWord}${Math.abs(rdd.note.cents) > 12 ? ` (${rdd.note.name} ${rdd.note.cents > 0 ? '+' : ''}${rdd.note.cents} cents)` : ''}`]);
                if (s.octave !== 'as') lines.push([col.inkFaint, 'octave', col.ink, `${OCTAVES[s.octave].said}: ${s.octave === 'up' ? '× 2' : '÷ 2'} on the frequency, ${s.octave === 'up' ? '÷ 2' : '× 2'} on the period`]);
                if (Math.abs(s.level) >= 0.5) lines.push([col.inkFaint, 'level', col.ink, `${s.level > 0 ? '+' : ''}${s.level} dB: ${rdd.levelWord}`]);
                if (s.lfo !== 'off') lines.push([col.inkFaint, 'LFO', col.ink, `${LFOS[s.lfo].label.toLowerCase()} at ${BPM} bpm: ${(60 / BPM / LFOS[s.lfo].perBeat).toFixed(2)} s, ${lfoHz(s.lfo)} Hz`]);
                let y = P.top + 34;
                g2.font = mono;
                for (const [c1, k, c2, val] of lines) {
                    g2.fillStyle = c1; g2.textAlign = 'left'; g2.fillText(k, P.x0 + 8, y);
                    g2.fillStyle = c2; g2.fillText(val, P.x0 + 96, y);
                    y += 17;
                }
                if (vdd.ok != null) {
                    g2.fillStyle = vdd.ok ? col.goldBright : col.coral; g2.font = monoSmall; g2.textAlign = 'right';
                    g2.fillText(vdd.ok ? 'as directed' : 'not yet', P.x1 - 8, P.top + 13);
                }
                if (s.task) {
                    const stem = TASKS[s.task].stem;
                    g2.fillStyle = col.inkFaint; g2.font = monoSmall; g2.textAlign = 'left';
                    const words = stem.split(' ');
                    let lineTxt = ''; let ly = Math.max(y + 8, P.bottom - 64);
                    const maxW = P.x1 - P.x0 - 16;
                    const out = [];
                    for (const wd of words) { const t2 = lineTxt ? `${lineTxt} ${wd}` : wd; if (g2.measureText(t2).width > maxW) { out.push(lineTxt); lineTxt = wd; } else lineTxt = t2; }
                    if (lineTxt) out.push(lineTxt);
                    const shownLines = out.slice(0, Math.max(1, Math.floor((P.bottom - 10 - ly) / 13)));
                    for (const l of shownLines) { g2.fillText(l, P.x0 + 8, ly); ly += 13; }
                }
            }

            // ---- Extension: the file ----
            if (g.file) {
                const F = g.file;
                g2.strokeStyle = col.line; g2.strokeRect(F.x0 + 0.5, F.top + 0.5, F.x1 - F.x0 - 1, F.bottom - F.top - 1);
                g2.fillStyle = col.purple; g2.font = monoSmall; g2.textAlign = 'left';
                g2.fillText('THE FILE', F.x0 + 8, F.top + 13);
                const bps = bytesPerSecond(s);
                const mb = fileMb(s);
                g2.fillStyle = col.ink; g2.font = mono;
                g2.fillText(`${s.channels} ${s.channels === 1 ? 'channel' : 'channels'} × ${(s.rate * 1000).toLocaleString('en-GB')} samples/s × ${s.depth} bits = ${(bps * 8).toLocaleString('en-GB')} bits/s = ${Math.round(bps / 1000).toLocaleString('en-GB')} kB/s`, F.x0 + 76, F.top + 31);
                // the 2024 file as a bar against its 10 MB base
                const barX = F.x0 + 76; const barW = Math.min(F.x1 - barX - 260, 520); const barY = F.top + 41; const bh = 9;
                const frac = Math.min(1, mb / 60);
                g2.fillStyle = col.purple; g2.globalAlpha = 0.25; g2.fillRect(barX, barY, barW, bh); g2.globalAlpha = 1;
                g2.fillRect(barX, barY, barW * frac, bh);
                g2.strokeStyle = col.inkFaint; g2.beginPath(); g2.moveTo(barX + barW * (10 / 60) + 0.5, barY - 2); g2.lineTo(barX + barW * (10 / 60) + 0.5, barY + bh + 2); g2.stroke();
                g2.fillStyle = col.ink; g2.textAlign = 'left';
                g2.fillText(`the 2024 file: ${fmtMb(mb)}  (10 MB mono at 44.1 kHz and 16 bit)`, barX + barW + 12, barY + 9);
            }

            // ---- the setting line, for the depth ----
            const segs = [`${SOURCES[s.source].label.toLowerCase()}`, OCTAVES[s.octave].said, `${tb.label} a division`];
            if (rdd.stretched) segs.push('stretched');
            if (Math.abs(s.level) >= 0.5) segs.push(`${s.level > 0 ? '+' : ''}${s.level} dB`);
            if (s.lfo !== 'off') segs.push(`LFO ${LFOS[s.lfo].label.toLowerCase()}`);
            segs.push(isHeld ? 'as played' : s.presetId ? PRESETS.find((p) => p.id === s.presetId)?.name.toLowerCase() : 'your screen');
            if (d !== 'core' && vdd.ok != null) segs.push(vdd.ok ? 'as directed' : 'not as directed');
            g2.fillStyle = col.goldBright; g2.font = mono; g2.textAlign = 'left';
            if (frameRef.current % 20 === 0 && legendRef.current) legendWRef.current = legendRef.current.getBoundingClientRect().width;
            frameRef.current += 1;
            const roomW = w - 18 - legendWRef.current - 16 - (S.x0 + 6);
            let label = segs.join(' · ');
            while (segs.length > 2 && g2.measureText(label).width > roomW) { segs.pop(); label = segs.join(' · '); }
            g2.fillText(label, S.x0, g.settingY);

            if (readRef.current) {
                // the setting's period is known at rest too, so the slot always reads
                const txt = ` · one cycle ${fmtMs(heardMs)}${d !== 'core' ? ` · ${fmtHz(heardHz)}` : ''}`; // d, not the render's maths: the draw closure is older than the level
                if (readRef.current.textContent !== txt) readRef.current.textContent = txt;
            }

            geomRef.current = { g, handle, xOfMs, msOfX };
            // what this frame drew, told to the DOM for check-bench (laws 18 and 23)
            const handleTag = handle ? `${Math.round(handle.x)}:${Math.round(handle.y)}` : '';
            if (canvas.dataset.handle !== handleTag) canvas.dataset.handle = handleTag;
            const periodTag = rdd.ms.toFixed(2);
            if (canvas.dataset.period !== periodTag) canvas.dataset.period = periodTag;
            const hzTag = String(Math.round(rdd.hz));
            if (canvas.dataset.hz !== hzTag) canvas.dataset.hz = hzTag;
            const stageTag = stageOf(d);
            if (canvas.dataset.stage !== stageTag) canvas.dataset.stage = stageTag;
            if (canvas.dataset.verdict !== vdd.key) canvas.dataset.verdict = vdd.key;

            raf = requestAnimationFrame(draw);
        }
        raf = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(raf);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // The bracket's end is dragged: the wave stretches to the new length.
    const nearHandle = (px, py) => {
        const gm = geomRef.current;
        if (!gm || !gm.handle) return false;
        return Math.hypot(gm.handle.x - px, gm.handle.y - py) <= 12;
    };
    const inScreen = (px, py) => {
        const gm = geomRef.current;
        if (!gm) return false;
        const S = gm.g.screen;
        return px >= S.x0 && px <= S.x1 && py >= S.top && py <= S.bottom;
    };
    const stretchFrom = (px) => {
        const gm = geomRef.current;
        const s = stateRef.current;
        if (!gm) return;
        const ms = Math.max(0.05, gm.msOfX(px));
        const baseMs = periodMs(sourceHz(s) * OCTAVES[s.octave].factor);
        setState((st) => stretchTo(st, ms / baseMs));
    };
    const onStageDown = (e) => {
        if (heldRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const px = e.clientX - rect.left; const py = e.clientY - rect.top;
        if (nearHandle(px, py)) {
            e.currentTarget.dataset.drag = 'bracket';
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            dragRef.current = { kind: 'bracket' };
            touch('stretch');
            return;
        }
        e.currentTarget.dataset.drag = '';
    };
    const onStageMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const px = e.clientX - rect.left; const py = e.clientY - rect.top;
        if (dragRef.current && dragRef.current.kind === 'bracket') { stretchFrom(px); return; }
        if (!teach) { if (hover) setHover(null); return; }
        if (nearHandle(px, py)) {
            if (hover && hover.kind === 'handle') return;
            setHover({ kind: 'handle', x: px, y: py, stageW: rect.width, stageH: rect.height });
            return;
        }
        if (inScreen(px, py)) {
            const gm = geomRef.current;
            const ms = Math.round(gm.msOfX(px) * 10) / 10;
            if (hover && hover.kind === 'screen' && hover.ms === ms) return;
            setHover({ kind: 'screen', ms, x: px, y: py, stageW: rect.width, stageH: rect.height });
            return;
        }
        if (hover) setHover(null);
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
                    <h2>Numeracy, in the spec&apos;s words</h2>
                    <p>The spec asks for the arithmetic of sound: frequency and period, the octave as a doubling, decibels as a ratio, sample rate and bit depth and the file size they make, and tempo turned into time. The written paper prints a wave on graph paper marked in milliseconds and asks you to read it; this screen is that figure, live.</p>
                    <h3>Terms</h3>
                    <dl>
                        <dt>Period</dt><dd>The time one cycle takes, in milliseconds on the paper and in seconds for the working. The bracket on the screen is one period.</dd>
                        <dt>Frequency</dt><dd>Cycles a second, in hertz. f = 1 ÷ T, with T in seconds: a 2 ms period is 0.002 s, so 500 Hz. The slip the reports name is leaving T in milliseconds.</dd>
                        <dt>Octave</dt><dd>A doubling of frequency, so a halving of period. 294 Hz up an octave is 588 Hz; a 1 ms square wave down an octave has a 2 ms period. Down the octave the wave stretches to twice its length on the screen.</dd>
                        <dt>Amplitude</dt><dd>The height of the wave, how loud. Louder changes the height and nothing else; the period stays. +6 dB is twice the amplitude, −6 dB half.</dd>
                        <dt>Waveform</dt><dd>The shape of one cycle. Sine: one smooth curve. Square: flat tops, vertical edges. Saw: a ramp and a drop. Triangle: straight rises and falls. The paper asks you to identify one and draw another.</dd>
                        <dt>LFO rate</dt><dd>A low-frequency oscillator is a wave slow enough to count. At 120 bpm a crotchet is 0.5 s, so an LFO once a crotchet runs at 2 Hz and once a quaver at 4 Hz.</dd>
                        <dt>Sample rate · bit depth</dt><dd>How many samples a second a converter keeps, and how many bits each one is. They set a file&apos;s size: channels × rate × depth is the bits a second. Stereo doubles a file; 88.2 kHz doubles it again; 24 bit is one and a half times 16.</dd>
                        <dt>Pitch from frequency</dt><dd>A4 is 440 Hz; every octave doubles. 500 Hz sits between B4 (494 Hz) and C5 (523 Hz); the scheme accepts &quot;between B and C&quot;.</dd>
                    </dl>
                    <h3>In your DAW</h3>
                    <table>
                        <thead><tr><th>On this bench</th><th>Ableton Live</th><th>Logic Pro</th></tr></thead>
                        <tbody>
                            <tr><td>The screen</td><td>Max for Live&apos;s Oscilloscope device on the track; the Spectrum device shows frequency, not time</td><td>No oscilloscope on the mixer; zoom into a region in the editor with the ruler set to samples or time</td></tr>
                            <tr><td>The period</td><td>Zoom into a clip until one cycle fills the view; the ruler in Time shows ms</td><td>Same, in the Audio File Editor with the ruler in Time</td></tr>
                            <tr><td>The octave</td><td>Transpose +12 or −12 on the clip (Warp off for the tape-style change)</td><td>Transpose +12 or −12 in the region inspector; Flex off for the tape-style change</td></tr>
                            <tr><td>Level in dB</td><td>The clip gain or the track fader, in dB</td><td>The region gain or the fader, in dB</td></tr>
                            <tr><td>The file</td><td>Export: sample rate, bit depth, channels on the dialog; the size follows</td><td>Bounce: the same three settings</td></tr>
                        </tbody>
                    </table>
                    <p className={styles.source}>As the controls appear in Live 12 and Logic Pro 11. Check against your own version if they move.</p>
                    <h3>Beyond the paper<span className={styles.ext}>EXT</span></h3>
                    <dl>
                        <dt>Why the trace stands still</dt><dd>A scope triggers: it waits for the wave to cross zero upwards and starts drawing there, so every cycle lands in the same place. Without a trigger the wave slides.</dd>
                        <dt>Playback speed and pitch</dt><dd>The recordings go up an octave by playing at twice the speed, the tape way: the period halves because the samples go past twice as fast. A pitch shifter that keeps the length is a different machine (1.7).</dd>
                        <dt>Why dots</dt><dd>At Extension the trace is drawn as the samples a converter keeps. At 8 kHz there are eight a millisecond; at 44.1 kHz the dots run together, which is why the wave sounds continuous.</dd>
                    </dl>
                    <p className={styles.source}>The reading behind this bench is the topic&apos;s own Learn chapters and the 9MT0/04 question papers and mark schemes, 2019 to 2026.</p>
                </>
            ),
        },
        {
            id: 'teacher',
            label: 'Teacher',
            render: () => (
                <>
                    <h2>What to listen for</h2>
                    <p>Press Play and a bowed cello note stands on the screen, one cycle bracketed. Press <b>Octave up</b> and the bracket halves as the note jumps; drag the bracket wider and the note falls as the wave stretches. That one picture is most of the topic: pitch is the length of a cycle, and every question is a reading off it.</p>
                    <h3>What the schemes say</h3>
                    <p>2019, the octave: &quot;294 × 2 / 294 + 294 (1); 588 (Hz) (2). Award 2 for 588 with no working.&quot;</p>
                    <p>2023, the drawing: &quot;Saw wave (1); period of 2 ms (1). Accept DC offset. Accept different amplitude.&quot; 2025: &quot;a louder square wave with period of 2 ms and no DC offset (1)&quot;; &quot;a square wave with same amplitude as figure 1 and period of 4 ms and no DC offset (1)&quot;.</p>
                    <p>2025, the pitch: &quot;award 1 mark for the correct pitch derived from the frequency ... allow description of the pitch if the candidate identifies that it is between two notes (e.g. between B and C)&quot;.</p>
                    <p>2026, the kick: &quot;1/200 (1); 0.005 / 5 × 10⁻³ (1). Award 2 marks for 0.005 with no working.&quot; Then &quot;5 (1)&quot; for the milliseconds.</p>
                    <p>2024, the file: &quot;20 (1)&quot; then &quot;60 (1)&quot;; &quot;Ignore working out&quot;.</p>
                    <p className={styles.source}>Source: Edexcel 9MT0/04 and 9MT0/41 mark schemes, 2019 Q4(c)(ii), 2023 Q2(e), 2024 Q3(b), 2025 Q3(c), 2026 Q1(d). The 2020 LFO stem (Q3(a)(iv)) gives the crotchet as 0.5 s and asks for the quaver&apos;s rate; its scheme is not in the vault.</p>
                    <h3>Do these now</h3>
                    <ul>
                        <li>Press <b>Read the period</b>, switch to A-level, and cover the ladder with your hand. Read the period off the grid, write it in seconds, then the frequency; uncover and check each rung.</li>
                        <li>Press <b>294 Hz, an octave up</b>, then Octave up. Say what happened to the bracket before you say what happened to the number.</li>
                        <li>Press <b>An octave lower</b> and make the trace the scheme draws: the source and the octave. Then say why the amplitude does not matter and a DC offset does.</li>
                        <li>Press <b>Louder</b>, turn Level to +6 dB, and say which of the two numbers on the screen changed.</li>
                        <li>Press <b>The LFO</b>, then Quaver in the More row, and count the swells across half a second.</li>
                        <li>Switch to Extension, press <b>The file</b>, and make it 60 MB with the three chips, reading the strip each time.</li>
                    </ul>
                    <h3>Exam practice</h3>
                    <ExamCallout
                        prompt="Figure 1 shows a wave over 5 ms. State the period of the wave in ms. State the period in s. Calculate the frequency of the wave in Hz. (3 marks, 2025)"
                        answer="Read one full cycle off the grid: 2 ms. In seconds, 0.002 s. Frequency is 1 ÷ T with T in seconds: 1 ÷ 0.002 = 500 Hz. Each rung is its own mark, and the ms-to-s rung is where the marks go missing."
                    />
                    <ExamCallout
                        prompt="An audio file has a file size of 10 MB: .wav, mono, 44.1 kHz, 16 bit. Calculate the file size if it were converted to stereo, 88.2 kHz, 24 bit. (1 mark, 2024)"
                        answer="Stereo doubles it (20 MB); 88.2 kHz doubles it again (40 MB); 24 bit is 1.5 times 16 bit (60 MB). The scheme wants the number and ignores the working: 60."
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
                        <b>The four waveforms</b>
                        <span>Sine, square, saw and triangle are the oscillator&apos;s shapes. Here they are identified and drawn; there they are chosen and filtered.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('digital-analogue')}>
                        <i>2.4 Digital and Analogue</i>
                        <b>The dots</b>
                        <span>The samples a converter keeps, at a rate and a depth. Extension draws them; that topic explains what happens above half the rate.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('modulation')}>
                        <i>1.12 Modulation</i>
                        <b>The LFO</b>
                        <span>A tremolo is a wave slow enough to count. The rate here comes from the tempo; the effect it makes is that topic.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('sequencing')}>
                        <i>1.5 Sequencing</i>
                        <b>Bits, the other way</b>
                        <span>A bit depth here is bits a sample; on the Piano Roll a velocity is seven bits a message. Both are the same counting.</span>
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
    const sourceOptions = SOURCE_IDS.map((id) => ({ id, label: SOURCES[id].label, title: `${SOURCES[id].said}: ${SOURCES[id].shape}` }));
    const octaveOptions = OCTAVE_IDS.map((id) => ({ id, label: OCTAVES[id].short, title: `${OCTAVES[id].label}: ${id === 'as' ? 'the source at its own pitch' : id === 'up' ? 'twice the frequency, half the period' : 'half the frequency, twice the period'}` }));
    const tbOptions = TIME_BASE_IDS.map((ms) => ({ id: ms, label: TIME_BASES[ms].label, title: `${ms} ms a division: ${ms * DIVS} ms across the screen` }));
    const lfoOptions = LFO_IDS.map((id) => ({ id, label: LFOS[id].label, title: id === 'off' ? 'No tremolo' : `${LFOS[id].said} at ${BPM} bpm: ${lfoHz(id)} Hz` }));
    const chOptions = CHANNEL_IDS.map((c) => ({ id: c, label: c === 1 ? 'Mono' : 'Stereo', title: c === 1 ? 'One channel' : 'Two channels: twice the size' }));
    const rateOptions = RATE_IDS.map((r) => ({ id: r, label: `${r}k`, title: `${r} kHz: ${r * 1000} samples a second` }));
    const depthOptions = DEPTH_IDS.map((b) => ({ id: b, label: `${b} bit`, title: `${b} bits a sample` }));
    const verdictWord = vd.key === 'free' ? 'no stem' : vd.ok == null ? 'a reading' : vd.ok ? (task?.id === 'note' || task?.id === 'period' || task?.id === 'kick' ? 'readable' : 'as directed') : 'not yet';
    const srcKind = SOURCES[state.source].kind;

    const consoleSlot = (
        <>
            <PlayColumn
                playing={playing}
                onTogglePlay={togglePlay}
                onHoldDry={holdAsPlayed}
                level={state.volume}
                onLevel={(v2) => setState((s) => setVolume(s, v2))}
                teach={teach}
                holdLabel="hold: as played"
                holdTitle="Hold to hear the sound as played: no octave, no stretch, level 0, LFO off"
                holdWhy="plays the sound as it was played, with your octave, stretch, level and LFO taken off, while you hold it"
                playWhy="plays the sound round and round; the screen draws it live"
            />

            <div className={`${styles.sec} ${styles.secSrc}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>Source</span><span className={styles.value}>{SOURCES[state.source].label}</span></div>
                <Chips label="Source" options={sourceOptions} value={state.source} onChange={chooseSource} />
                <div className={styles.meaning}>{srcKind === 'file' ? 'a recording, at its own pitch' : `a waveform at ${fmtHz(sourceHz(state))}`}</div>
                <Why>Three recordings and the four waveforms the paper draws. A recording plays at its own pitch, harmonics and all; a waveform is set to the paper&apos;s number. Switching keeps the octave and the screen.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secPitch}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>Pitch</span><span className={styles.value} data-hz={Math.round(rd.hz)}>{rd.noteWord.length > 12 ? rd.note.name : rd.noteWord}</span></div>
                <Chips label="Octave" options={octaveOptions} value={state.octave} onChange={chooseOctave} />
                <div className={styles.meaning}>{maths ? `${fmtHz(rd.hz)} · one cycle ${fmtMs(rd.ms)}` : `one cycle every ${fmtMs(rd.ms)}`}{rd.stretched ? ' · stretched' : ''}</div>
                <Why>An octave up is twice the frequency, so half the period: the bracket halves. Down, it doubles. Dragging the bracket&apos;s end on the screen stretches the wave by any amount up to an octave either way; a chip resets the stretch.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secScreen}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>Screen</span><span className={styles.value}>{TIME_BASES[state.timeBase].label}<small>/div</small></span></div>
                <Chips label="Time base" options={tbOptions} value={state.timeBase} onChange={chooseTimeBase} />
                <div className={styles.meaning}>{TIME_BASES[state.timeBase].span} ms across · {rd.cycles < 1 ? 'under a cycle' : `${rd.cycles.toFixed(1)} cycles`}</div>
                <Why>The time base: how many milliseconds each of the five divisions is. The paper prints one figure at 1 ms a division. The wave never changes when you change this; only how much of it you see. The slow settings are for the LFO.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secDb}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>Level</span><span className={styles.value}>{state.level > 0 ? '+' : ''}{state.level}<small>dB</small></span></div>
                <div className={styles.knob}>
                    <Dial label="Level" value={state.level} min={LEVEL_MIN} max={LEVEL_MAX} step={0.5} unit="dB" pointer="var(--gold-bright)" pixels={160} onChange={chooseLevel} title="The height of the wave, in dB: +6 is twice, −6 is half" />
                    <span className={styles.readout}>{rd.levelWord}</span>
                </div>
                <Why>Louder is height. +6 dB doubles the amplitude and the trace; the period does not move. The 2025 paper asks for the same wave drawn louder, and marks the period as much as the height.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secHear}`} data-teach={teach || undefined} data-scope="true">
                <div className={styles.secHead}><span className={styles.eyebrow}>What you should hear</span></div>
                <div className={styles.stats} aria-live="polite">
                    <div><b data-period-ms={rd.ms.toFixed(2)}>{fmtMs(rd.ms)}</b><span>one cycle</span></div>
                    <div><b>{maths ? fmtHz(rd.hz) : (rd.noteWord.length > 12 ? rd.note.name : rd.noteWord)}</b><span>{maths ? 'frequency' : 'the pitch'}</span></div>
                    <div><b>{state.lfo !== 'off' ? `${lfoHz(state.lfo)} Hz` : rd.cycles < 1 ? 'under 1' : rd.cycles.toFixed(1)}</b><span>{state.lfo !== 'off' ? 'the LFO' : 'cycles on screen'}</span></div>
                    {maths
                        ? <div><b>{verdictWord}</b><span>the paper&apos;s check{ext ? <span className={styles.ext}>EXT</span> : null}</span></div>
                        : <div><b>{held ? 'as played' : rd.stretched ? 'stretched' : OCTAVES[state.octave].short.toLowerCase()}</b><span>what is playing</span></div>}
                </div>
                {teach ? <div className={styles.meaning}>all from the source&apos;s pitch, the octave, the bracket and the screen</div> : null}
                <Legal />
                <Why>Every number here comes from the source&apos;s own pitch and what you did to it: the period as the bracket&apos;s length, the frequency it gives, how many cycles the time base shows, and whether the screen matches the question the preset set.</Why>
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
        <>
            <div className={styles.moreItem}>
                <span className={styles.eyebrow}>LFO</span>
                <Chips label="LFO" options={lfoOptions} value={state.lfo} onChange={chooseLfo} />
                <span className={styles.chipNote}>{state.lfo === 'off' ? `a tremolo timed to ${BPM} bpm` : `${lfoHz(state.lfo)} Hz at ${BPM} bpm`}</span>
            </div>
            <div className={styles.moreItem}>
                <span className={styles.eyebrow}>File</span>
                <Chips label="Channels" options={chOptions} value={state.channels} onChange={(v2) => chooseFile('ch', v2)} />
                <Chips label="Sample rate" options={rateOptions} value={state.rate} onChange={(v2) => chooseFile('rate', v2)} />
                <Chips label="Bit depth" options={depthOptions} value={state.depth} onChange={(v2) => chooseFile('depth', v2)} />
                <span className={styles.chipNote}>{fmtMb(rd.fileMb)} for the 2024 file · the size, not the sound</span>
            </div>
        </>
    ) : null;

    const stage = (
        <>
            <canvas
                ref={canvasRef}
                aria-label={maths ? (ext ? 'The oscilloscope screen, the samples a converter keeps, and the file as bytes' : 'The oscilloscope screen and the paper\'s ladder beside it') : 'The oscilloscope screen: the sound against time in milliseconds'}
                role="img"
                onPointerDown={onStageDown}
                onPointerMove={onStageMove}
                onPointerUp={onStageUp}
                onPointerCancel={onStageUp}
                onPointerLeave={() => { if (!dragRef.current) setHover(null); }}
            />
            <div className={styles.stageNote}>
                <b>{DIVS} divisions · {TIME_BASES[state.timeBase].span} ms across<span ref={readRef} style={{ '--read': maths ? '31ch' : '20ch' }} /></b>
                <span>{ORIENTS[depth] || ORIENTS.core}</span>
            </div>
            <div ref={legendRef} className={`${styles.stageLegend} ${styles.legendTop}`} aria-hidden="true">
                <span><i style={{ background: SOURCES[state.source].colour }} />trace</span>
                <span><i style={{ background: 'var(--gold-bright)' }} />one cycle</span>
                {state.lfo !== 'off' ? <span><i style={{ background: 'var(--teal)' }} />one swell</span> : null}
                {depth === 'extension' ? <span><i style={{ background: '#fff', width: 5, height: 5 }} />sample</span> : null}
            </div>
            {hover && teach ? (
                <div
                    className={styles.tip}
                    style={{
                        left: Math.max(12, Math.min(hover.stageW - 290, hover.x - 135)),
                        top: Math.max(44, Math.min(hover.stageH - 110, hover.y + 22)),
                    }}
                >
                    {hover.kind === 'handle'
                        ? <><i>one cycle · {fmtMs(rd.ms)}</i><p>Drag to stretch the wave: longer is lower, shorter is higher. An octave either way.</p></>
                        : <><i>{hover.ms} ms</i><p>{`${hover.ms} ms from the trigger: ${(hover.ms / rd.ms).toFixed(1)} cycles in.`}</p></>}
                </div>
            ) : null}
            {!began ? (
                <div className={styles.begin}>
                    <button type="button" className={styles.beginBtn} onClick={() => audio.start()}>
                        <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1.2v9.6L11 6z" fill="currentColor" /></svg>
                        <span>
                            Play the bench
                            <small>A sound against time, as the paper draws it. Headphones help.</small>
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
            synthesis
        />
    );
}
