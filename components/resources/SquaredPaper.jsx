'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BenchFrame from '@/components/bench/BenchFrame';
import { Dial, Chips, Why, MoreButton } from '@/components/bench/controls';
import { PlayColumn, Presets, Legal, ExamCallout, useBenchMode, useBenchDepth, DEPTHS } from '@/components/bench/BenchBits';
import { useBenchAudio, glide } from '@/components/bench/useBenchAudio';
import styles from '@/components/bench/bench.module.css';
import { memberTopicHref, useStudioArrival } from '@/lib/studio-return';
import { DEPTH_LINES, DEPTH_TEACH, judge, open as openMachine, drawingLine, nextMove } from '@/lib/bench/paper-depth';
import {
    DIVS, COLS, SHAPE_IDS, SHAPES, PERIOD_IDS, PERIODS, TIME_BASE_IDS, TIME_BASES,
    HEIGHT_MIN, HEIGHT_MAX, HARMONICS, PRESETS, DEFAULT_STATE,
    applyPreset, drawAt, clearLine, setTimeBase, setShape, setPeriod, setHeight, setShowAnswer, setTarget, setVolume,
    givenOf, taskOf, answerOf, read, verdict, marksFor, shapeAt, idealHarmonics,
    stemOf, stepQuestion, nextWord, canStep,
    fmtHz, fmtMs, fmtS, fmtDb, spanOf,
} from '@/lib/bench/paper-model';

// Squared Paper (2.5), tenth bench to the Bench Standard, and the second
// for this topic after the Oscilloscope. The Oscilloscope shows a wave and
// lets you read it; this bench hands over the blank grid the written paper
// hands over, asks for the answer, then plays what you drew and marks it
// the way the scheme does. It replaces the 2024 Waveform Drawing Explorer,
// which was silent, scrolled, and off the bar.
//
// The picture is the paper's own figure: five divisions across,
// "Displacement" up the side and "Time (ms)" along the bottom, the
// question's wave printed on the left grid and the right one blank, and
// the question itself in the paper's own words above them both, numbered
// one of seven with Next and Back beside it (Mike's first look, 12 Sep
// 2026). It opens silent, as the written paper does: nothing sounds until
// a Hear target or the hold button is pressed. Three
// jobs (lib/bench/paper-depth.js): Core draws and names, A-level marks in
// the scheme's own words with the year, Extension takes the drawn cycle
// apart into its first eight harmonics.
//
// The four waveforms sound on oscillators, the topic's own object (the
// paper asks you to identify and draw them), so the bench declares
// synthesis; the drawing sounds as a one-cycle buffer on a loop.

const CODE = '2.5 Numeracy';
const TITLE = 'Squared Paper';
const FILES = {};
const BPM = 120;
// Keyed by what the stage draws (data-stage), not by the depth's own name:
// the two must not drift apart, or a level's orientation sentence comes out
// empty (found by looking, 12 Sep 2026).
const ORIENTS = {
    paper: 'The question\'s figure at the left, your answer paper at the right. Draw on it with the pointer.',
    marked: 'Beside your paper, the scheme\'s marks in its own words: shape, period, height, each ticked or not.',
    harmonics: 'Your cycle taken apart: eight harmonic bars beside the ideal shape\'s, why the four sound different.',
};
const stageOf = (d) => (d === 'core' ? 'paper' : d === 'alevel' ? 'marked' : 'harmonics');
const orientOf = (d) => ORIENTS[stageOf(d)] || ORIENTS.paper;

// Measured on the Oscilloscope, 30 Aug 2026: every waveform within a
// decibel of the others at these gains.
const OSC_GAIN = { sine: 0.35, triangle: 0.42, square: 0.25, sawtooth: 0.42 };
const TARGET_RMS = 0.245; // what those four gains come to, so Yours matches them

// ---- the graph -------------------------------------------------------------
// One sounding thing at a time (an oscillator for the figure and for the
// scheme's answer, a looping one-cycle buffer for the drawing) into the
// level the output slider sets, then the master.
function buildPaperGraph(ctx, input, master) {
    const level = ctx.createGain();
    level.gain.value = 1;
    const tap = ctx.createAnalyser();
    tap.fftSize = 2048;
    tap.smoothingTimeConstant = 0;
    level.connect(tap);
    tap.connect(master);
    input.connect(master);
    let cur = null;
    function stopCur() {
        if (!cur) return;
        const { node, g } = cur;
        const t = ctx.currentTime;
        g.gain.setTargetAtTime(0, t, 0.008);
        try { node.stop(t + 0.06); } catch { /* already ended */ }
        cur = null;
    }
    function playOsc(type, hz) {
        stopCur();
        const t = ctx.currentTime;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.connect(level);
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = hz;
        osc.connect(g);
        g.gain.linearRampToValueAtTime(OSC_GAIN[type] || 0.3, t + 0.025);
        osc.start(t);
        cur = { node: osc, g, kind: 'osc' };
    }
    function playCycle(buffer) {
        stopCur();
        if (!buffer) return;
        const t = ctx.currentTime;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.connect(level);
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        src.connect(g);
        g.gain.linearRampToValueAtTime(1, t + 0.025);
        src.start(t);
        cur = { node: src, g, kind: 'cycle' };
    }
    function clear() { stopCur(); }
    return { playOsc, playCycle, clear, live: () => Boolean(cur), sampleRate: ctx.sampleRate, ctx };
}

// One cycle of the drawing as an AudioBuffer exactly one period long, so a
// loop of it is the pitch the paper says. Normalised to the oscillators'
// own loudness, because the three targets exist to be compared by ear.
function cycleBuffer(ctx, cycle, periodMs) {
    if (!cycle || !periodMs) return null;
    const n = Math.max(16, Math.round((ctx.sampleRate * periodMs) / 1000));
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    const N = cycle.length;
    for (let i = 0; i < n; i += 1) {
        const pos = (i / n) * N;
        const a = Math.floor(pos) % N;
        const b = (a + 1) % N;
        const t = pos - Math.floor(pos);
        d[i] = cycle[a] + (cycle[b] - cycle[a]) * t;
    }
    let ss = 0;
    for (let i = 0; i < n; i += 1) ss += d[i] * d[i];
    const rms = Math.sqrt(ss / n);
    const gain = rms > 1e-6 ? TARGET_RMS / rms : 0;
    for (let i = 0; i < n; i += 1) d[i] *= gain;
    return buf;
}

// ---- the bench -------------------------------------------------------------
export default function SquaredPaper({ back }) {
    const [state, setState] = useState(DEFAULT_STATE);
    const [further, setFurther] = useState(false);
    const [mode, setMode] = useBenchMode();
    const [depth, setDepth] = useBenchDepth();
    const [hover, setHover] = useState(null);
    const [last, setLast] = useState('preset');
    const [announce, setAnnounce] = useState(null);
    const [held, setHeld] = useState(false);
    const [drawing, setDrawing] = useState(false);
    const stateRef = useRef(state);
    const heldRef = useRef(false);
    const { studioOrigin } = useStudioArrival();
    const teach = mode === 'teacher';
    const maths = depth !== 'core';
    const ext = depth === 'extension';

    const rd = useMemo(() => read(state), [state]);
    const stem = useMemo(() => stemOf(state), [state]);
    const vd = useMemo(() => verdict(state), [state]);
    const marks = useMemo(() => marksFor(state), [state]);
    const given = givenOf(state);
    const task = taskOf(state);
    const answer = useMemo(() => answerOf(state), [state]);

    const graphRef = useRef(null);
    const onSchedule = useCallback(() => {}, []);
    const buildGraph = useCallback((ctx, input, master) => {
        const g = buildPaperGraph(ctx, input, master);
        graphRef.current = g;
        return g;
    }, []);
    const audio = useBenchAudio({ files: FILES, bpm: BPM, onSchedule, buildGraph });
    const { ctxRef, nodesRef, began, playing } = audio;
    const playingRef = useRef(false);

    // The draw loop and the audio handlers read this render's values off
    // refs. Writing them in an effect rather than during render keeps the
    // hooks lint clean, and this effect is declared before every effect that
    // reads them, so they are current by the time one runs.
    useEffect(() => {
        stateRef.current = state;
        playingRef.current = playing;
    });

    // Which of the three is sounding: the one the chips chose, or the
    // figure while the hold button is down.
    const soundKey = useMemo(() => {
        const t = held ? (given ? 'given' : state.target) : state.target;
        if (t === 'given') return given ? `given:${given.shape}:${given.periodMs}` : 'silent';
        if (t === 'answer') return answer ? `answer:${answer.shape}:${answer.periodMs}` : 'silent';
        if (drawing) return 'hold';
        return rd.periodMs ? `yours:${rd.periodMs}:${rd.shape || 'none'}:${Math.round(rd.drawn * 100)}` : 'silent';
    }, [held, given, answer, state.target, drawing, rd]);

    const apply = useCallback(() => {
        const g = graphRef.current;
        const ctx = ctxRef.current;
        if (!g || !ctx || !playingRef.current) return;
        const s = stateRef.current;
        const gi = givenOf(s);
        const t = heldRef.current ? (gi ? 'given' : s.target) : s.target;
        if (t === 'given') {
            if (!gi) { g.clear(); return; }
            g.playOsc(SHAPES[gi.shape].osc, 1000 / gi.periodMs);
            return;
        }
        if (t === 'answer') {
            const a = answerOf(s);
            if (!a) { g.clear(); return; }
            g.playOsc(SHAPES[a.shape].osc, 1000 / a.periodMs);
            return;
        }
        const r = read(s);
        if (!r.periodMs || !r.cycle) { g.clear(); return; }
        g.playCycle(cycleBuffer(ctx, r.cycle, r.periodMs));
    }, [ctxRef]);
    useEffect(() => { if (soundKey !== 'hold') apply(); }, [soundKey, playing, apply]);
    useEffect(() => {
        const ctx = ctxRef.current;
        const nodes = nodesRef.current;
        if (ctx && nodes) glide(nodes.level.gain, state.volume, ctx);
    }, [state.volume, began, ctxRef, nodesRef]);

    const touch = (what) => { setLast(what); setAnnounce(null); };
    const chooseDepth = (id) => { setDepth(id); setAnnounce(id); };
    const chooseShape = (id) => { setState((s) => setShape(s, id)); touch('shape'); };
    const choosePeriod = (id) => { setState((s) => setPeriod(s, id)); touch('period'); };
    const chooseHeight = (v) => { setState((s) => setHeight(s, v)); touch('height'); };
    const chooseTimeBase = (ms) => { setState((s) => setTimeBase(s, ms)); touch('screen'); };
    const chooseTarget = (id) => { setState((s) => setTarget(s, id)); touch('hear'); if (!playingRef.current) audio.start(); };
    const chooseAnswer = () => { setState((s) => setShowAnswer(s, !s.showAnswer)); touch('answer'); };
    const chooseClear = () => { setState((s) => clearLine(s)); touch('clear'); };
    const choosePreset = (id) => { setState((s) => applyPreset(s, id)); touch('preset'); };
    // Next and Back walk the seven papers: a new question, a blank answer
    // paper, Show answer off, the level and the output level kept.
    const stepQ = (by) => { setState((s) => stepQuestion(s, by)); touch('preset'); };
    // The bench opens silent, like the paper, so the first press of a Hear
    // target or of the hold button is what starts the context, and it plays.
    const holdGiven = (on) => { heldRef.current = on; setHeld(on); if (on && !playingRef.current) audio.start(); };
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
    const rdRef = useRef(rd);
    const vdRef = useRef(vd);
    const marksRef = useRef(marks);
    const readRef = useRef(null);
    const legendRef = useRef(null);
    const frameRef = useRef(0);

    useEffect(() => {
        depthRef.current = depth;
        rdRef.current = rd;
        vdRef.current = vd;
        marksRef.current = marks;
    });

    // The stage's rows, top to bottom: the stage note (a DOM element, 12 to
    // 30), the question with Back and Next (34 to 60), then the papers with
    // their titles above them, then the axis numbers, then the setting line
    // at the foot with the legend beside it. The titles need the papers to
    // start below the question's row, or the rows paint over each other
    // (found by looking, 12 Sep 2026).
    const geom = (w, h2, d) => {
        const short = h2 < 330;
        const top = short ? 76 : 82;
        // the foot carries the setting line and the legend on one row, below
        // the axis numbers
        const bottom = h2 - (short ? 34 : 40);
        const padR = 16;
        // The marks panel is as wide as the scheme's longest line needs: at
        // 328 px the 2024 axes mark wrapped to two lines and pushed the
        // fourth mark off the panel.
        const panelW = d === 'core' ? 0 : Math.round(Math.max(300, Math.min(380, w * 0.31)));
        const givenW = Math.round(panelW ? Math.max(180, Math.min(280, w * 0.23)) : Math.max(250, Math.min(400, w * 0.32)));
        const given = { x0: 44, x1: 44 + givenW, top, bottom };
        const answer = { x0: given.x1 + 50, x1: Math.max(given.x1 + 180, w - padR - panelW - (panelW ? 14 : 0)), top, bottom };
        const panel = panelW ? { x0: w - padR - panelW, x1: w - padR, top, bottom } : null;
        return { w, h: h2, top, bottom, settingY: h2 - 6, given, answer, panel };
    };

    useEffect(() => {
        const first = canvasRef.current;
        if (!first) return undefined;
        let raf = 0;
        const css = getComputedStyle(first.parentElement);
        const v = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
        const col = {
            gold: v('--gold-bright', '#f0d48a'),
            teal: v('--teal', '#7cc4b8'),
            coral: v('--gen-6', '#d08a80'),
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
        const shapeCol = (id) => (id ? v(SHAPES[id].colour.replace(/^var\(|\)$/g, ''), '#7fb0c4') : v('--gen-2', '#7fb0c4'));
        const monoFace = v('--mono', 'monospace');
        const mono = `11.5px ${monoFace}`;
        const monoSmall = `10px ${monoFace}`;
        const monoBig = `13px ${monoFace}`;

        // The paper itself: the grid the question prints, drawn twice.
        function paper(g2, P, span, title) {
            const W = P.x1 - P.x0;
            const H = P.bottom - P.top;
            const mid = (P.top + P.bottom) / 2;
            g2.fillStyle = col.screen; g2.fillRect(P.x0, P.top, W, H);
            for (let i = 0; i <= DIVS * 5; i += 1) {
                const x = Math.round(P.x0 + (i / (DIVS * 5)) * W) + 0.5;
                g2.strokeStyle = i % 5 === 0 ? col.gridDiv : col.grid;
                g2.beginPath(); g2.moveTo(x, P.top); g2.lineTo(x, P.bottom); g2.stroke();
            }
            for (let i = 0; i <= 8; i += 1) {
                const y = Math.round(P.top + (i / 8) * H) + 0.5;
                g2.strokeStyle = i === 4 ? col.gridMid : i % 2 === 0 ? col.gridDiv : col.grid;
                g2.beginPath(); g2.moveTo(P.x0, y); g2.lineTo(P.x1, y); g2.stroke();
            }
            g2.strokeStyle = col.line; g2.strokeRect(P.x0 + 0.5, P.top + 0.5, W - 1, H - 1);
            g2.font = monoSmall;
            g2.fillStyle = col.inkFaint; g2.textAlign = 'center';
            for (let i = 1; i <= DIVS; i += 1) g2.fillText(`${(i * span) / DIVS}`, P.x0 + (i / DIVS) * W, P.bottom + 13);
            g2.textAlign = 'left'; g2.fillText('Time (ms)', P.x0 + 4, P.bottom + 13);
            g2.save(); g2.translate(P.x0 - 34, mid); g2.rotate(-Math.PI / 2); g2.textAlign = 'center'; g2.fillText('Displacement', 0, 0); g2.restore();
            g2.textAlign = 'right';
            g2.fillText('+', P.x0 - 5, P.top + 10); g2.fillText('0', P.x0 - 5, mid + 3.5); g2.fillText('−', P.x0 - 5, P.bottom - 3);
            g2.fillStyle = col.inkSoft; g2.textAlign = 'left'; g2.font = monoSmall;
            g2.fillText(title, P.x0 + 2, P.top - 7);
            return { W, H, mid, half: H / 2 - 6 };
        }

        // An ideal wave across a paper: the figure, and the scheme's answer.
        function ideal(g2, P, box, span, w2, colour, dash) {
            g2.save();
            g2.beginPath();
            g2.rect(P.x0, P.top, box.W, box.H);
            g2.clip();
            g2.strokeStyle = colour; g2.lineWidth = dash ? 1.6 : 1.8;
            if (dash) g2.setLineDash([5, 4]);
            g2.beginPath();
            const steps = 480;
            const off = w2.offset || 0; // a figure carries no offset of its own
            for (let i = 0; i <= steps; i += 1) {
                const ms = (i / steps) * span;
                const y = box.mid - (shapeAt(w2.shape, ms / w2.periodMs) * w2.amp + off) * box.half;
                const x = P.x0 + (i / steps) * box.W;
                if (i === 0) g2.moveTo(x, y); else g2.lineTo(x, y);
            }
            g2.stroke();
            g2.setLineDash([]);
            g2.restore();
        }

        function draw() {
            const canvas = canvasRef.current;
            if (!canvas) { raf = requestAnimationFrame(draw); return; }
            const g2 = canvas.getContext('2d');
            const s = stateRef.current;
            const d = depthRef.current;
            const r = rdRef.current;
            const vdd = vdRef.current;
            const mk = marksRef.current;
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
            const span = TIME_BASES[s.timeBase].span;
            const gi = givenOf(s);
            const ans = answerOf(s);
            const tk = taskOf(s); // this frame's question, never the first render's
            const stm = stemOf(s); // its wording and its place in the seven
            const pcol = shapeCol(r.shape);
            g2.lineWidth = 1;

            // ---- the given figure ----
            const gBox = paper(g2, g.given, span, gi ? 'THE FIGURE' : 'NO FIGURE GIVEN');
            if (gi) ideal(g2, g.given, gBox, span, gi, col.inkSoft, false);
            else {
                g2.fillStyle = col.inkFaint; g2.font = monoSmall; g2.textAlign = 'center';
                g2.fillText('this question prints no figure', (g.given.x0 + g.given.x1) / 2, gBox.mid + 3);
            }

            // ---- the answer paper ----
            const aBox = paper(g2, g.answer, span, 'YOUR ANSWER');
            if (s.showAnswer && ans) ideal(g2, g.answer, aBox, span, ans, col.gold, true);
            // the line the student drew, column by column
            const colW = aBox.W / COLS;
            g2.strokeStyle = pcol; g2.lineWidth = 2.2; g2.lineJoin = 'round'; g2.lineCap = 'round';
            let open2 = false;
            g2.beginPath();
            for (let i = 0; i < COLS; i += 1) {
                const yv = s.line[i];
                if (yv == null) { open2 = false; continue; }
                const x = g.answer.x0 + (i + 0.5) * colW;
                const y = aBox.mid - yv * aBox.half;
                if (!open2) { g2.moveTo(x, y); open2 = true; } else g2.lineTo(x, y);
            }
            g2.stroke(); g2.lineWidth = 1;

            // the period bracket and the amplitude arrow: what the 2024
            // question asks a candidate to label, done for them
            if (r.periodMs && r.run) {
                const startMs = (r.run.from + 0.5) * (span / COLS);
                const x0 = g.answer.x0 + (startMs / span) * aBox.W;
                const x1 = Math.min(g.answer.x1 - 2, x0 + (r.periodMs / span) * aBox.W);
                const by = g.answer.top + 15;
                g2.strokeStyle = col.gold; g2.lineWidth = 1.5;
                g2.beginPath();
                g2.moveTo(x0, by - 6); g2.lineTo(x0, by + 6);
                g2.moveTo(x0, by); g2.lineTo(x1, by);
                g2.moveTo(x1, by - 6); g2.lineTo(x1, by + 6);
                g2.stroke(); g2.lineWidth = 1;
                g2.fillStyle = col.gold; g2.font = monoBig; g2.textAlign = 'left';
                const label = d === 'core' ? 'one cycle' : `one cycle · ${fmtMs(r.periodMs)}`;
                g2.fillText(label, Math.min(x0 + 6, g.answer.x1 - 8 - g2.measureText(label).width), by + 20);
                if (d !== 'core' && r.amplitude > 0.02) {
                    const ax = Math.min(g.answer.x1 - 12, x1 + 18);
                    const yTop = aBox.mid - (r.offset + r.amplitude) * aBox.half;
                    const yMid = aBox.mid - r.offset * aBox.half;
                    g2.strokeStyle = col.teal; g2.lineWidth = 1.4;
                    g2.beginPath();
                    g2.moveTo(ax, yMid); g2.lineTo(ax, yTop);
                    g2.moveTo(ax - 4, yTop + 5); g2.lineTo(ax, yTop); g2.lineTo(ax + 4, yTop + 5);
                    g2.moveTo(ax - 5, yMid); g2.lineTo(ax + 5, yMid);
                    g2.stroke(); g2.lineWidth = 1;
                    g2.fillStyle = col.teal; g2.font = monoSmall; g2.textAlign = 'left';
                    g2.fillText('amplitude', Math.min(ax + 6, g.answer.x1 - 62), (yTop + yMid) / 2 + 3);
                }
                if (d !== 'core' && Math.abs(r.offset) > 0.08) {
                    const oy = aBox.mid - r.offset * aBox.half;
                    g2.strokeStyle = col.coral; g2.setLineDash([4, 4]);
                    g2.beginPath(); g2.moveTo(g.answer.x0, oy); g2.lineTo(g.answer.x1, oy); g2.stroke();
                    g2.setLineDash([]);
                    g2.fillStyle = col.coral; g2.font = monoSmall; g2.textAlign = 'right';
                    g2.fillText('DC offset', g.answer.x1 - 6, oy - 5);
                }
            } else if (r.drawn === 0) {
                g2.fillStyle = col.inkFaint; g2.font = mono; g2.textAlign = 'center';
                g2.fillText('draw here', (g.answer.x0 + g.answer.x1) / 2, aBox.mid + 4);
            }

            // ---- A-level: the marks beside the paper ----
            if (g.panel && d === 'alevel') {
                const P = g.panel;
                g2.strokeStyle = col.line; g2.strokeRect(P.x0 + 0.5, P.top + 0.5, P.x1 - P.x0 - 1, P.bottom - P.top - 1);
                g2.fillStyle = col.gold; g2.font = monoSmall; g2.textAlign = 'left';
                g2.fillText(tk ? `THE MARKS · ${stm.where.toUpperCase()}` : 'THE MARKS', P.x0 + 8, P.top + 13);
                if (vdd.ok != null) {
                    g2.fillStyle = vdd.ok ? col.gold : col.coral; g2.textAlign = 'right';
                    g2.fillText(vdd.ok ? 'as directed' : 'not yet', P.x1 - 8, P.top + 13);
                }
                const wrap = (text, font, lines, indent = 0) => {
                    const maxW = P.x1 - P.x0 - 16 - indent;
                    g2.font = font;
                    const out = []; let lineTxt = '';
                    for (const word of text.split(' ')) {
                        const t2 = lineTxt ? `${lineTxt} ${word}` : word;
                        if (g2.measureText(t2).width > maxW) { out.push(lineTxt); lineTxt = word; } else lineTxt = t2;
                    }
                    if (lineTxt) out.push(lineTxt);
                    if (out.length > lines) { const cut = out.slice(0, lines); cut[lines - 1] = `${cut[lines - 1]}...`; return cut; }
                    return out;
                };
                const roomy = P.bottom - P.top > 210;
                // The question itself is above the papers now (stemOf, the one
                // place its wording lives), so the panel is the marks alone:
                // the 2024 question has four of them and the stem was pushing
                // the last one off the panel.
                let y = P.top + 30;
                if (!tk) {
                    g2.fillStyle = col.inkFaint; g2.font = monoSmall; g2.textAlign = 'left';
                    g2.fillText('no question is set on the blank paper:', P.x0 + 8, y);
                    g2.fillText('the bench reads your line back instead', P.x0 + 8, y + 13);
                }
                const floor = r.periodMs ? P.bottom - 26 : P.bottom - 10;
                for (const m of mk) {
                    if (y > floor - 20) break;
                    g2.fillStyle = m.ok ? col.gold : col.coral;
                    g2.font = mono; g2.textAlign = 'left';
                    g2.fillText(m.ok ? '✓' : '·', P.x0 + 8, y);
                    g2.fillStyle = col.ink;
                    for (const l of wrap(`"${m.words}"`, monoSmall, 2, 22)) { g2.fillText(l, P.x0 + 22, y); y += 12; }
                    g2.fillStyle = col.inkFaint;
                    for (const l of wrap(m.note, monoSmall, roomy ? 2 : 1, 22)) { g2.fillText(l, P.x0 + 22, y); y += 12; }
                    y += 3;
                }
                if (r.periodMs) {
                    g2.fillStyle = col.gold; g2.font = monoSmall; g2.textAlign = 'left';
                    const lad = `T = ${fmtMs(r.periodMs)} = ${fmtS(r.periodMs / 1000)}   f = 1 ÷ T = ${fmtHz(1000 / r.periodMs)}`;
                    g2.fillText(wrap(lad, monoSmall, 1, 0)[0], P.x0 + 8, P.bottom - 10);
                }
            }

            // ---- Extension: the harmonics ----
            if (g.panel && d === 'extension') {
                const P = g.panel;
                g2.strokeStyle = col.line; g2.strokeRect(P.x0 + 0.5, P.top + 0.5, P.x1 - P.x0 - 1, P.bottom - P.top - 1);
                g2.fillStyle = col.purple; g2.font = monoSmall; g2.textAlign = 'left';
                g2.fillText('HARMONICS OF ONE CYCLE', P.x0 + 8, P.top + 13);
                const h = r.harmonics;
                const idl = r.shape ? idealHarmonics(r.shape) : null;
                if (!h) {
                    g2.fillStyle = col.inkFaint; g2.font = monoSmall;
                    g2.fillText('two cycles on the paper and the', P.x0 + 8, P.top + 34);
                    g2.fillText('bars appear here', P.x0 + 8, P.top + 46);
                } else {
                    const base = P.bottom - 34;
                    const topY = P.top + 30;
                    const hh = base - topY;
                    const slot = (P.x1 - P.x0 - 20) / HARMONICS;
                    g2.strokeStyle = col.line;
                    g2.beginPath(); g2.moveTo(P.x0 + 8, base + 0.5); g2.lineTo(P.x1 - 8, base + 0.5); g2.stroke();
                    for (let n = 0; n < HARMONICS; n += 1) {
                        const x = P.x0 + 10 + n * slot;
                        const bw = Math.max(5, slot * 0.34);
                        if (idl) {
                            g2.fillStyle = 'rgba(255, 255, 255, 0.20)';
                            g2.fillRect(x + bw + 3, base - Math.min(1, idl[n]) * hh, bw, Math.min(1, idl[n]) * hh);
                        }
                        g2.fillStyle = pcol;
                        g2.fillRect(x, base - Math.min(1, h[n]) * hh, bw, Math.min(1, h[n]) * hh);
                        g2.fillStyle = col.inkFaint; g2.font = monoSmall; g2.textAlign = 'center';
                        g2.fillText(`${n + 1}`, x + bw + 1, base + 12);
                    }
                    g2.fillStyle = col.inkSoft; g2.font = monoSmall; g2.textAlign = 'left';
                    g2.fillText(r.shape ? `yours · ${SHAPES[r.shape].label.toLowerCase()} ideal` : 'yours · no ideal to compare', P.x0 + 8, P.bottom - 9);
                }
            }

            // ---- the setting line ----
            const segs = [];
            segs.push(gi ? `figure ${SHAPES[gi.shape].label.toLowerCase()} ${fmtMs(gi.periodMs)}` : 'no figure');
            segs.push(`${TIME_BASES[s.timeBase].label} a division`);
            if (r.shape) segs.push(`you drew ${SHAPES[r.shape].label.toLowerCase()}`);
            else if (r.drawn > 0) segs.push('a line the bench cannot name');
            if (s.showAnswer) segs.push('answer shown');
            segs.push(s.presetId ? PRESETS.find((p) => p.id === s.presetId)?.name.toLowerCase() : 'your paper');
            if (d !== 'core' && vdd.ok != null) segs.push(vdd.ok ? 'as directed' : 'not as directed');
            g2.fillStyle = col.gold; g2.font = mono; g2.textAlign = 'left';
            frameRef.current += 1;
            // the legend sits in the same row at the right, so the setting
            // drops segments until it clears it
            const legW = legendRef.current ? Math.ceil(legendRef.current.getBoundingClientRect().width) : 0;
            const roomW = w - 20 - g.given.x0 - (legW ? legW + 22 : 0);
            let label = segs.join(' · ');
            while (segs.length > 2 && g2.measureText(label).width > roomW) { segs.pop(); label = segs.join(' · '); }
            g2.fillText(label, g.given.x0, g.settingY);

            if (readRef.current) {
                const txt = r.periodMs
                    ? `\u00a0· one cycle ${fmtMs(r.periodMs)}${d !== 'core' ? ` · ${fmtHz(1000 / r.periodMs)}` : ''}`
                    : '\u00a0· nothing drawn yet';
                if (readRef.current.textContent !== txt) readRef.current.textContent = txt;
            }

            geomRef.current = { g, box: aBox, span };
            // what this frame drew, told to the DOM for check-bench
            const periodTag = r.periodMs ? r.periodMs.toFixed(2) : '';
            if (canvas.dataset.periodMs !== periodTag) canvas.dataset.periodMs = periodTag;
            const hzTag = r.periodMs ? String(Math.round(1000 / r.periodMs)) : '';
            if (canvas.dataset.hz !== hzTag) canvas.dataset.hz = hzTag;
            const shapeTag = r.shape || '';
            if (canvas.dataset.shape !== shapeTag) canvas.dataset.shape = shapeTag;
            if (canvas.dataset.verdict !== vdd.key) canvas.dataset.verdict = vdd.key;
            const stageTag = stageOf(d);
            if (canvas.dataset.stage !== stageTag) canvas.dataset.stage = stageTag;
            const paperTag = `${Math.round(g.answer.x0)}:${Math.round(g.answer.top)}:${Math.round(g.answer.x1)}:${Math.round(g.answer.bottom)}`;
            if (canvas.dataset.paper !== paperTag) canvas.dataset.paper = paperTag;
            if (canvas.dataset.question !== stm.tag) canvas.dataset.question = stm.tag;

            raf = requestAnimationFrame(draw);
        }
        raf = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(raf);
    }, []);

    // ---- drawing on the answer paper ----
    const atPoint = (px, py) => {
        const gm = geomRef.current;
        if (!gm) return null;
        const A = gm.g.answer;
        if (px < A.x0 - 4 || px > A.x1 + 4 || py < A.top - 20 || py > A.bottom + 20) return null;
        const colW = gm.box.W / COLS;
        const c = Math.round((px - A.x0) / colW - 0.5);
        const y = (gm.box.mid - py) / gm.box.half;
        return { col: Math.max(0, Math.min(COLS - 1, c)), y: Math.max(-1, Math.min(1, y)) };
    };
    const onStageDown = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const p = atPoint(e.clientX - rect.left, e.clientY - rect.top);
        if (!p) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        dragRef.current = p;
        setDrawing(true);
        setState((s) => drawAt(s, p.col, p.y));
        touch('draw');
    };
    const onStageMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        if (dragRef.current) {
            const p = atPoint(px, py);
            if (!p) return;
            const from = dragRef.current;
            dragRef.current = p;
            setState((s) => drawAt(s, p.col, p.y, from.col, from.y));
            return;
        }
        if (!teach) { if (hover) setHover(null); return; }
        const p = atPoint(px, py);
        if (p) {
            const gm = geomRef.current;
            const ms = Math.round(((p.col + 0.5) * (gm.span / COLS)) * 10) / 10;
            if (hover && hover.ms === ms) return;
            setHover({ ms, x: px, y: py, stageW: rect.width, stageH: rect.height });
            return;
        }
        if (hover) setHover(null);
    };
    const onStageUp = (e) => {
        if (!dragRef.current) return;
        dragRef.current = null;
        setDrawing(false);
        try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* gone */ }
    };

    // ---- drawer ----
    const drawerTabs = useMemo(() => {
        const topicHref = (slug) => memberTopicHref(null, slug, studioOrigin);
        return [
        {
            id: 'reference',
            label: 'Reference',
            render: () => (
                <>
                    <h2>The drawing question, in the spec&apos;s words</h2>
                    <p>The written paper prints a grid marked Displacement up the side and Time in milliseconds along the bottom, five divisions across, and asks for a wave on it. Sometimes a figure is given and the answer is that wave changed: an octave lower, an octave higher, louder, inverted. Sometimes the grid is blank and the wave and its labels are all yours. This bench is that grid, and it reads back what you draw.</p>
                    <h3>Terms</h3>
                    <dl>
                        <dt>Period</dt><dd>The time one whole cycle takes, read across the grid in milliseconds. One cycle runs from a point to the next identical point going the same way: peak to peak, or upward zero crossing to the next.</dd>
                        <dt>Octave</dt><dd>A doubling of frequency, so a halving of period. An octave lower doubles the width of each cycle; an octave higher halves it. It is a change of width, never of height and never of position.</dd>
                        <dt>Amplitude</dt><dd>The height from the centre line to the peak, not from trough to peak. Louder is taller in both directions, still centred on the same line.</dd>
                        <dt>DC offset</dt><dd>The whole wave shifted off the centre line, same size and shape, sitting entirely above or below zero. It is a fault, not a change of loudness or pitch: it wastes headroom and can click.</dd>
                        <dt>Waveform</dt><dd>The shape of one cycle. Sine is one smooth curve. Square has flat tops and vertical edges. Saw is a ramp and a drop. Triangle is straight rises and falls.</dd>
                        <dt>Frequency</dt><dd>Cycles a second, in hertz. f = 1 ÷ T with T in seconds, so a 2 ms period is 0.002 s and 500 Hz. Leaving T in milliseconds is the slip the reports name every year.</dd>
                    </dl>
                    <h3>In your DAW</h3>
                    <table>
                        <thead><tr><th>On this bench</th><th>Ableton Live</th><th>Logic Pro</th></tr></thead>
                        <tbody>
                            <tr><td>The grid in ms</td><td>Zoom into a clip with the ruler set to Time; the arrangement ruler reads in ms</td><td>The Audio File Editor with the ruler in Time</td></tr>
                            <tr><td>The four shapes</td><td>Operator or Analog: the oscillator&apos;s wave selector</td><td>Retro Synth or ES2: the oscillator&apos;s waveform</td></tr>
                            <tr><td>An octave</td><td>Transpose +12 or −12 on the clip or the instrument</td><td>Transpose +12 or −12 in the region inspector</td></tr>
                            <tr><td>Louder</td><td>Clip gain or the track fader, in dB</td><td>Region gain or the fader, in dB</td></tr>
                            <tr><td>A DC offset</td><td>Utility&apos;s DC filter removes one</td><td>Gain plug-in, DC Offset removal</td></tr>
                        </tbody>
                    </table>
                    <p className={styles.source}>As the controls appear in Live 12 and Logic Pro 11. Check against your own version if they move.</p>
                    <h3>Beyond the paper<span className={styles.ext}>EXT</span></h3>
                    <dl>
                        <dt>Why the three play at one level</dt><dd>The figure, your drawing and the scheme&apos;s answer all sound at the same loudness on purpose, so your ear is comparing pitch and shape. Louder is a height you read off the grid, and the bench writes it in dB beside the paper.</dd>
                        <dt>How the bench reads your line</dt><dd>It slides a copy of your line along itself and looks for the shift where the two match best. That shift is the period. Two whole cycles is the least it can work with, which is also the least the 2025 report will credit.</dd>
                        <dt>Harmonics</dt><dd>Any repeating wave is a sum of sine waves at whole multiples of its own frequency. Which ones are present, and how strong, is the whole of why the four shapes sound different. Extension takes your cycle apart and shows them.</dd>
                    </dl>
                    <p className={styles.source}>The reading behind this bench is the topic&apos;s own Learn chapters and the 9MT0/04 and 9MT0/41 question papers, mark schemes and examiner reports, 2019 to 2026.</p>
                </>
            ),
        },
        {
            id: 'teacher',
            label: 'Teacher',
            render: () => (
                <>
                    <h2>What to look for</h2>
                    <p>Press <b>2023: an octave lower</b>. The figure at the left is the square wave with a 1 ms period the paper gives; the paper at the right is blank, as it is in the exam. Draw the answer with the pointer, or press <b>Saw</b> and then <b>Double</b>. Now press <b>Yours</b> and then hold the figure button: two pitches an octave apart, and the width on the grid is the reason. That one picture is most of the topic.</p>
                    <h3>What the schemes say</h3>
                    <p>2023 Q2(e)(ii), the saw an octave lower: &quot;Saw wave (1) (allow inverted saw wave)&quot;; &quot;Period of 2ms (1) [allow error carried forward, i.e. one octave lower than graph shown in 2(e)(i)]&quot;; &quot;Accept DC offset. Accept different amplitude&quot;.</p>
                    <p>2025 Q3(c)(vi), louder: &quot;Award 1 mark for a louder square wave with period of 2ms and no DC offset.&quot; And (vii), an octave lower: &quot;Award 1 mark for a square wave with same amplitude as figure 1 and period of 4ms and no DC offset.&quot;</p>
                    <p>2024 Q4(a), the blank grid: &quot;Waveshape (1)&quot;; &quot;Voltage / V / displacement (1)&quot; and &quot;s / ms / time (1)&quot; for the axes; &quot;amplitude (1). Allow peak to peak amplitude&quot;; &quot;Period (1)&quot;. Part (b) then asks for the same wave with the polarity inverted, and (c) for what happens when the two are added: &quot;Silence / destructive interference / cancel out / cancellation (1)&quot;.</p>
                    <p>2026 Q1(d): &quot;1/200 (1)&quot;, &quot;0.005 / 5x10-3 (1). Award 2 marks for 0.005 with no working&quot;, then &quot;5 (1)&quot; for the milliseconds.</p>
                    <h3>What the reports say goes wrong</h3>
                    <p>2023: &quot;Very few candidates knew that an octave lower was double the period.&quot; And: &quot;a very common error was drawing another square wave, not a saw wave.&quot; And: &quot;Many candidates drew the same wave lower on the graph, i.e. with a negative DC offset.&quot;</p>
                    <p>2025: &quot;Around half of candidates drew a wave with double the period&quot; on the octave question, and on the louder one, &quot;Some candidates only drew one cycle of the wave so did not score credit.&quot;</p>
                    <p>2024: &quot;Period was often labelled incorrectly as being the width of half a cycle rather than a complete cycle.&quot;</p>
                    <p className={styles.source}>Source: Edexcel 9MT0/41 and 9MT0/04 question papers, mark schemes and examiner reports, 2023 Q2(e), 2024 Q4, 2025 Q3(c), 2026 Q1(d).</p>
                    <h3>Do these now</h3>
                    <ul>
                        <li>Press <b>Judge: the period kept</b> and switch to A-level. Say which of the two marks this candidate lost before you read the panel.</li>
                        <li>Press <b>2025: louder</b>, press <b>Square</b>, then turn Height to +6 dB. Say which of the two numbers beside the paper changed and which did not.</li>
                        <li>Press <b>2025: an octave lower</b> and count the cycles on the figure, then on your answer. Half as many is the whole of the question.</li>
                        <li>Press <b>2024: label it</b>, draw a square wave by hand, and check the bench&apos;s period bracket runs peak to peak, not peak to trough.</li>
                        <li>Press <b>2026: 200 Hz</b> and make the bench read 5 ms. Then read the ladder: 5 ms, 0.005 s, 200 Hz.</li>
                        <li>Switch to Extension with a square wave drawn, then a saw. Odd harmonics only, then every one.</li>
                    </ul>
                    <h3>Exam practice</h3>
                    <ExamCallout
                        prompt="A graph shows a square wave with a period of 1 ms. On the graph below, draw a saw wave one octave lower. (2 marks, 2023)"
                        answer="A saw wave, which is one mark, with a period of 2 ms, which is the other. An octave lower doubles the period, so each cycle is twice as wide and half as many fit on the grid. The scheme accepts an inverted saw, accepts a different amplitude and accepts a DC offset here; it does not accept a square wave or a 1 ms period."
                    />
                    <ExamCallout
                        prompt="Figure 1 shows a square wave. On the graph below, draw the same wave but louder. (1 mark, 2025)"
                        answer="The same square wave, the same 2 ms period, drawn taller from the centre line in both directions, still centred on that line. The scheme's mark is for a louder square wave with period of 2 ms and no DC offset, so moving the wave down the page instead of making it taller loses it."
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
                    <a className={styles.conn} href={topicHref('numeracy')}>
                        <i>2.5 Numeracy</i>
                        <b>The Oscilloscope</b>
                        <span>There a sound is drawn for you and you read the period off it. Here the grid is blank and the drawing is yours. Same figure, opposite direction.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('synthesis')}>
                        <i>1.3 Synthesis</i>
                        <b>The four waveforms</b>
                        <span>Extension takes your cycle apart into harmonics. That is the chapter&apos;s own picture of why a square is hollow and a saw buzzes.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('digital-analogue')}>
                        <i>2.4 Digital and Analogue</i>
                        <b>A wave as numbers</b>
                        <span>Your drawing is stored as one height per column, which is what a converter does with a sound. That topic is what happens between the columns.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('stereo')}>
                        <i>1.10 Stereo</i>
                        <b>Polarity</b>
                        <span>A wave added to its own inversion is silence, which the 2024 paper asks for in words. Out of phase is where that matters in a mix.</span>
                    </a>
                </>
            ),
        },
        ];
    }, [studioOrigin]);

    // ---- the bench's one line ----
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
            ? <>{drawingLine(state)} <b>Try:</b> {next}.</>
            : <><b>Try:</b> {next.charAt(0).toUpperCase() + next.slice(1)}.</>;
    }

    // ---- console ----
    const shapeOptions = SHAPE_IDS.map((id) => ({ id, label: SHAPES[id].label, title: `Fill the answer paper with ${SHAPES[id].said} at the width and height it already has` }));
    const periodOptions = PERIOD_IDS.map((id) => ({ id, label: PERIODS[id].label, title: `${PERIODS[id].label}: ${PERIODS[id].said}${given ? `, so ${fmtMs(given.periodMs * PERIODS[id].factor)} a cycle` : ''}` }));
    const tbOptions = TIME_BASE_IDS.map((ms) => ({ id: ms, label: TIME_BASES[ms].label, title: `${ms} ms a division: ${ms * DIVS} ms across the paper` }));
    const hearOptions = [
        { id: 'given', label: 'The figure', disabled: !given, title: given ? `${SHAPES[given.shape].said} at ${fmtHz(1000 / given.periodMs)}, the wave the question prints` : 'This question prints no figure' },
        { id: 'yours', label: 'Yours', disabled: !rd.periodMs, title: rd.periodMs ? `one cycle of your drawing on a loop, ${fmtHz(1000 / rd.periodMs)}` : 'Draw two whole cycles and the bench can loop one of them' },
        { id: 'answer', label: 'The answer', disabled: !answer, title: answer ? `${SHAPES[answer.shape].said} at ${fmtHz(1000 / answer.periodMs)}, the wave the scheme draws` : 'No question is set' },
    ];
    const periodChip = given && rd.periodMs
        ? (Math.abs(rd.periodMs - given.periodMs * 0.5) / given.periodMs < 0.1 ? 'half'
            : Math.abs(rd.periodMs - given.periodMs) / given.periodMs < 0.1 ? 'as'
                : Math.abs(rd.periodMs - given.periodMs * 2) / given.periodMs < 0.2 ? 'double' : null)
        : null;
    const shapeShort = rd.shape ? SHAPES[rd.shape].label.toLowerCase() : rd.drawn > 0 ? 'unnamed' : 'blank';
    const verdictWord = !task ? 'no question' : vd.ok == null ? 'a reading' : vd.ok ? 'as directed' : 'not yet';
    const heightDb = rd.dbAny == null ? 0 : Math.max(HEIGHT_MIN, Math.min(HEIGHT_MAX, Math.round(rd.dbAny * 2) / 2));

    const consoleSlot = (
        <>
            <PlayColumn
                playing={playing}
                onTogglePlay={togglePlay}
                onHoldDry={holdGiven}
                level={state.volume}
                onLevel={(v2) => setState((s) => setVolume(s, v2))}
                teach={teach}
                holdLabel="hold: the figure"
                holdTitle="Hold to hear the wave the question prints, so you can compare it with yours"
                holdWhy="plays the question's own figure while you hold it, so your drawing and the figure can be compared by ear"
                playWhy="plays whichever of the three the Hear row has chosen, round and round"
            />

            <div className={`${styles.sec} ${styles.secDraw}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>Shape</span><span className={styles.value} data-shape={rd.shape || ''}>{shapeShort}</span></div>
                <Chips label="Shape" options={shapeOptions} value={rd.shape || null} onChange={chooseShape} />
                <div className={styles.chips}>
                    <button type="button" className={styles.chip} onClick={chooseClear} aria-label="Clear the answer paper" title="Take everything off the answer paper">Clear</button>
                </div>
                <div className={styles.meaning}>{rd.drawn > 0 ? `${Math.round(rd.drawn * 100)} per cent drawn` : 'draw it, or fill it from a chip'}</div>
                <Why>Draw on the answer paper with the pointer: one height per column, so drawing back over a stretch replaces it. A chip fills the whole paper with a clean wave at the width and height already there, which is the keyboard&apos;s way in.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secPer}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>Period</span><span className={styles.value} data-hz={rd.periodMs ? Math.round(1000 / rd.periodMs) : ''}>{rd.periodMs ? fmtMs(rd.periodMs) : 'none'}</span></div>
                <Chips label="Period" options={periodOptions} value={periodChip} onChange={choosePeriod} />
                <div className={styles.meaning}>{rd.periodMs ? (maths ? `${fmtHz(1000 / rd.periodMs)} · ${rd.noteWord}` : `${Math.round(rd.cycles * 10) / 10} cycles on the paper`) : 'two cycles and the bench can read it'}</div>
                <Why>An octave lower is double the period, so twice the width on the grid; an octave higher is half. The chips work from the figure&apos;s own period, so Double on a 1 ms figure draws the 2 ms answer the 2023 scheme wants.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secHeight}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>Height</span></div>
                <div className={styles.knob}>
                    <Dial label="Height" value={heightDb} min={HEIGHT_MIN} max={HEIGHT_MAX} step={0.5} unit="dB" pointer="var(--teal)" pixels={160} onChange={chooseHeight} title="The height of your wave against the figure's: +6 dB is twice as tall" />
                    <span className={styles.value}>{rd.dbAny == null ? 'none' : fmtDb(rd.dbAny)}</span>
                </div>
                <Why>Louder is height, and nothing else. +6 dB is twice as tall, −6 dB is half; the width, and so the pitch, does not move. The 2025 question marks the period as hard as it marks the height.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secPaper}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>Paper</span><span className={styles.value}>{spanOf(state)}<small>ms</small></span></div>
                <Chips label="Screen" options={tbOptions} value={state.timeBase} onChange={chooseTimeBase} />
                <div className={styles.chips}>
                    <button type="button" className={styles.chip} aria-pressed={state.showAnswer} onClick={chooseAnswer} disabled={!answer} title={answer ? 'Lay the wave the scheme draws over yours in gold' : 'No question is set'}>Show answer</button>
                </div>
                <div className={styles.meaning}>{DIVS} divisions · {TIME_BASES[state.timeBase].label} each</div>
                <Why>What one division on the paper is worth. The written paper prints 1 ms a division; 2 ms is here because a 4 ms or 5 ms answer needs room for two cycles. Show answer lays the scheme&apos;s wave over yours in gold.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secHear}`} data-teach={teach || undefined} data-paper="true">
                <div className={styles.secHead}><span className={styles.eyebrow}>What you should hear{ext ? <span className={styles.ext}>EXT</span> : null}</span></div>
                <Chips label="Hear" options={hearOptions} value={state.target} onChange={chooseTarget} />
                <div className={styles.stats} aria-live="polite">
                    <div><b data-period-ms={rd.periodMs ? rd.periodMs.toFixed(2) : ''}>{rd.periodMs ? fmtMs(rd.periodMs) : 'no cycle'}</b><span>one cycle</span></div>
                    <div><b>{maths && rd.periodMs ? fmtHz(1000 / rd.periodMs) : shapeShort}</b><span>{maths && rd.periodMs ? 'frequency' : 'the shape'}</span></div>
                    <div><b>{rd.db == null ? (rd.amplitude > 0 ? `${Math.round(rd.amplitude * 100)}%` : rd.drawn > 0 ? 'flat' : 'none') : fmtDb(rd.db)}</b><span>{rd.db == null ? 'of the grid' : 'on the figure'}</span></div>
                    <div><b>{verdictWord}</b><span>the scheme&apos;s check</span></div>
                </div>
                {teach ? <div className={styles.meaning}>all three play at one level, so the ear compares pitch and shape</div> : null}
                <Legal />
                <Why>Every number here is measured off the line you drew: the period by sliding a copy of it along itself, the shape by matching one cycle against the four, the height from the centre line to the peak against the figure&apos;s own.</Why>
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
                <span className={styles.eyebrow}>Paper</span>
                <Chips label="Divisions" options={tbOptions} value={state.timeBase} onChange={chooseTimeBase} ariaLabel="Divisions" />
                <span className={styles.chipNote}>{spanOf(state)} ms across · {DIVS} divisions</span>
            </div>
            <div className={styles.moreItem}>
                <span className={styles.eyebrow}>Offset</span>
                <span className={styles.chipNote}>
                    {Math.abs(rd.offset) <= 0.08 ? 'your wave sits on the centre line' : `your wave sits ${rd.offset > 0 ? 'above' : 'below'} the centre line by ${Math.round(Math.abs(rd.offset) * 100)} per cent of the grid: a DC offset`}
                </span>
            </div>
        </>
    ) : null;

    const stage = (
        <>
            <canvas
                ref={canvasRef}
                aria-label={maths ? (ext ? 'The question\'s figure, your answer paper, and the harmonics of your cycle' : 'The question\'s figure, your answer paper, and the scheme\'s marks') : 'The question\'s figure at the left and your answer paper at the right'}
                role="img"
                onPointerDown={onStageDown}
                onPointerMove={onStageMove}
                onPointerUp={onStageUp}
                onPointerCancel={onStageUp}
                onPointerLeave={() => { if (!dragRef.current) setHover(null); }}
            />
            <div className={styles.stageNote}>
                <b>{DIVS} divisions · {spanOf(state)} ms across<span ref={readRef} style={{ '--read': maths ? '30ch' : '21ch' }} /></b>
                <span>{orientOf(depth)}</span>
            </div>
            <div className={styles.stageStem}>
                <b className={styles.stemNum}>{stem.n ? `Question ${stem.n} of ${stem.of}` : 'Blank paper'}</b>
                {stem.n ? <i className={styles.stemRef}>{stem.where}</i> : null}
                <span className={styles.stemAsk}>{stem.ask}</span>
                <span className={styles.stemNav}>
                    <button
                        type="button"
                        className={styles.stemBtn}
                        onClick={() => stepQ(-1)}
                        disabled={!canStep(state, -1)}
                        title="Back to the question before this one, on a blank answer paper"
                    >
                        &larr;&nbsp;Back
                    </button>
                    <button
                        type="button"
                        className={styles.stemBtn}
                        onClick={() => stepQ(1)}
                        title={`${nextWord(state)}: a blank answer paper and the next paper's question`}
                    >
                        {nextWord(state)}&nbsp;&rarr;
                    </button>
                </span>
            </div>
            <div ref={legendRef} className={`${styles.stageLegend} ${styles.legendStem}`} aria-hidden="true">
                <span><i style={{ background: rd.shape ? SHAPES[rd.shape].colour : 'var(--gen-2)' }} />your line</span>
                <span><i style={{ background: 'var(--gold-bright)' }} />one cycle</span>
                {state.showAnswer ? <span><i style={{ background: 'var(--gold-bright)' }} />the answer, dashed</span> : null}
                {maths ? <span><i style={{ background: 'var(--teal)' }} />amplitude</span> : null}
            </div>
            {hover && teach ? (
                <div
                    className={styles.tip}
                    style={{
                        left: Math.max(12, Math.min(hover.stageW - 290, hover.x - 135)),
                        top: Math.max(44, Math.min(hover.stageH - 110, hover.y + 22)),
                    }}
                >
                    <i>{hover.ms} ms</i>
                    <p>Drag across the paper to draw. One height per column, so going back over a stretch replaces it.</p>
                </div>
            ) : null}
        </>
    );

    return (
        <BenchFrame
            code={CODE}
            title={TITLE}
            orientation={orientOf(depth)}
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
