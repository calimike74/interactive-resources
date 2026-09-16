'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BenchFrame from '@/components/bench/BenchFrame';
import { Dial, DragNumber, Chips, Why, MoreButton } from '@/components/bench/controls';
import { PlayColumn, Presets, Legal, ExamCallout, useBenchMode, useBenchDepth, DEPTHS } from '@/components/bench/BenchBits';
import { useBenchAudio, glide } from '@/components/bench/useBenchAudio';
import styles from '@/components/bench/bench.module.css';
import { memberTopicHref, useStudioArrival } from '@/lib/studio-return';
import { DEPTH_LINES, DEPTH_TEACH, judge, open as openMachine, hearingLine, nextMove, chordTable, bassRange } from '@/lib/bench/seq-depth';
import {
    STEPS, BPM_MIN, BPM_MAX, SWING_MAX, CUTOFF_MIN, CUTOFF_MAX, DECAY_MIN, DECAY_MAX,
    SCALE, CHORDS, LANE_IDS, LANES, KEY_SIG, isTunable,
    noteName, midiHz, bassMidi, stepMs, swingMs, resToQdb, filterCurve, fmtHz,
    DEFAULT_STATE, PRESETS, TASKS, presetOf,
    applyPreset, clearPattern, setStep, toggleStep, nudgeNote, recordNote,
    setTempo, setSwing, setCutoff, setRes, setDecay, setLevel, setRecord,
    counts, cellText, stepSends, sweepCutoffAt, verdict, readings, patternTag,
} from '@/lib/bench/seq-model';

// The Sequence bench (1.5), the eleventh bench to the Bench Standard and the
// topic's second: the Piano Roll is the MIDI file the paper hands over; this
// is the instrument a part is made on. A sixteen-step sequencer drives a
// small subtractive synth: five lanes on the stage (the grid is the control),
// a piano in the console that lights the notes as they sound and writes what
// you play into the Bass row, swing on the clock, the filter's own curve on
// the spectrum. Three jobs (lib/bench/seq-depth.js): Core shows the steps
// and the wave, A-level judges the feel, the filter and the way in, and
// puts the spectrum under the gold curve; Extension opens the machine as a
// chain of four screens. Folded in from Mike's walked sandbox, 16 Sep 2026.
//
// The synth voice is the bench's own (two sawtooth oscillators, a low-pass
// filter, an amplifier envelope) because the sequenced part IS a synth,
// the Piano Roll's precedent; `synthesis` is declared on the frame. The
// drums are the Piano Roll's electronic kit, read from its folder.

const CODE = '1.5 Sequencing';
const TITLE = 'Sequence bench';
const AUDIO = '/bench-audio/midi';
const FILES = { kick: `${AUDIO}/electronic-kick.mp3`, snare: `${AUDIO}/electronic-snare.mp3`, hat: `${AUDIO}/electronic-chat.mp3` };
const ORIENTS = {
    core: 'The sixteen steps, and the wave after the filter. Click a step; drag a Bass or Chord step up or down for the note.',
    alevel: 'The spectrum under the filter: grey is the raw saw, blue is what passes. Drag the gold curve to move the cutoff.',
    extension: 'The voice as a chain: oscillators, filter, amplifier, output. Each screen is the real signal at that tap.',
};
const STAGE_OF = { core: 'steps', alevel: 'spectrum', extension: 'chain' };
// Typing: the bottom row is the C1 octave (the Bass row's register), the home
// row the C2 octave with its sharps on the row above.
const KEY_MAP = { z: 36, x: 38, c: 40, v: 41, b: 43, n: 45, m: 47, a: 48, w: 49, s: 50, e: 51, d: 52, f: 53, t: 54, g: 55, y: 56, h: 57, u: 58, j: 59, k: 60 };
const KEY_LETTER = Object.fromEntries(Object.entries(KEY_MAP).map(([k, m]) => [m, k]));
const KBD_LO = 33; // A0, the bottom of the Bass row
const KBD_HI = 64; // E3, the top of the chords
const isBlack = (m) => [1, 3, 6, 8, 10].includes(m % 12);
const PATTERN_TOOLS = [{ id: 'empty', label: 'Empty' }, { id: 'reset', label: 'Back to the preset' }];
const FMIN = 40;
const FMAX = 16000;
const RESP_N = 160;
const RESP_F = Array.from({ length: RESP_N }, (_, i) => FMIN * (FMAX / FMIN) ** (i / (RESP_N - 1)));
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
// The Cutoff dial travels a log scale: position 0 to 1000 across 80 Hz to 12 kHz.
const hzToPos = (hz) => Math.round((Math.log(clamp(hz, CUTOFF_MIN, CUTOFF_MAX) / CUTOFF_MIN) / Math.log(CUTOFF_MAX / CUTOFF_MIN)) * 1000);
const posToHz = (p) => CUTOFF_MIN * (CUTOFF_MAX / CUTOFF_MIN) ** (clamp(p, 0, 1000) / 1000);

// ---- the graph ------------------------------------------------------------
// Drums as one-shots into their own bus; each synth note is oscillators →
// its own low-pass filter → an amplifier envelope, the textbook order, with
// every filter driven from one shared cutoff and resonance control. Taps
// along the chain feed the screens: [osc] the raw oscillators, [filt] after
// the filters, [amp] after the envelopes; the output tap is added once the
// kit's level node exists.
function buildSeqGraph(ctx, input, master, initial) {
    const drums = ctx.createGain(); drums.gain.value = 0.8; drums.connect(master);
    input.connect(master);
    const cutoffCtl = ctx.createConstantSource(); cutoffCtl.offset.value = initial.cutoff; cutoffCtl.start();
    const qCtl = ctx.createConstantSource(); qCtl.offset.value = resToQdb(initial.res); qCtl.start();
    const mkTap = (gain, smoothing) => { const g = ctx.createGain(); g.gain.value = gain; const an = ctx.createAnalyser(); an.fftSize = 2048; an.smoothingTimeConstant = smoothing; g.connect(an); return { g, an }; }
    const osc = mkTap(0.22, 0.72);
    const filt = mkTap(0.22, 0.72);
    const synthBus = ctx.createGain(); synthBus.gain.value = 0.26;
    const amp = ctx.createAnalyser(); amp.fftSize = 2048; amp.smoothingTimeConstant = 0.6;
    synthBus.connect(amp); amp.connect(master);
    const out = ctx.createAnalyser(); out.fftSize = 2048; out.smoothingTimeConstant = 0.6;
    const live = new Set();
    let steps = []; // { step, bar, time, dur }

    function voice(midi, when, { decay = initial.decay / 1000, hold = false, level = 1 } = {}) {
        const hz = midiHz(midi);
        const o1 = ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = hz;
        const o2 = ctx.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = hz; o2.detune.value = 9;
        const vf = ctx.createBiquadFilter(); vf.type = 'lowpass'; vf.frequency.value = 0; vf.Q.value = 0;
        cutoffCtl.connect(vf.frequency); qCtl.connect(vf.Q);
        const env = ctx.createGain(); env.gain.value = 0;
        o1.connect(vf); o2.connect(vf); vf.connect(env); env.connect(synthBus);
        const tapO = ctx.createGain(); tapO.gain.value = level; o1.connect(tapO); o2.connect(tapO); tapO.connect(osc.g);
        const tapF = ctx.createGain(); tapF.gain.value = level; vf.connect(tapF); tapF.connect(filt.g);
        env.gain.setValueAtTime(0, when);
        env.gain.linearRampToValueAtTime(level, when + 0.006);
        if (hold) env.gain.setTargetAtTime(level * 0.55, when + 0.006, decay * 0.5);
        else env.gain.setTargetAtTime(0, when + 0.006, decay / 4);
        o1.start(when); o2.start(when);
        const item = { o1, o2, env };
        live.add(item);
        o1.onended = () => live.delete(item);
        const stopAt = (at) => { try { o1.stop(at); o2.stop(at); } catch { /* ended */ } };
        if (!hold) stopAt(when + decay * 2 + 0.05);
        return {
            release(at = ctx.currentTime) { env.gain.cancelScheduledValues(at); env.gain.setTargetAtTime(0, at, 0.08); stopAt(at + 0.5); },
        };
    }
    function book(step, bar, time, dur) {
        steps.push({ step, bar, time, dur });
        const now = ctx.currentTime;
        if (steps.length > 64) steps = steps.filter((s) => s.time > now - 2);
    }
    function clear() {
        const now = ctx.currentTime;
        for (const { o1, o2, env } of live) { try { env.gain.setTargetAtTime(0, now, 0.004); o1.stop(now + 0.03); o2.stop(now + 0.03); } catch { /* ended */ } }
        live.clear();
        steps = [];
    }
    // the step sounding now, and how far through it we are
    function position() {
        const now = ctx.currentTime;
        let cur = null;
        for (const s of steps) if (s.time <= now) cur = s;
        if (!cur) return null;
        return { step: cur.step, bar: cur.bar, frac: clamp((now - cur.time) / cur.dur, 0, 0.999), time: cur.time };
    }
    return { drums, cutoffCtl, qCtl, osc: osc.an, filt: filt.an, amp, out, synthBus, voice, book, clear, position, live };
}

// ---- the bench ------------------------------------------------------------
export default function SequenceBench({ back }) {
    const [state, setState] = useState(() => applyPreset(DEFAULT_STATE, 'bass'));
    const [further, setFurther] = useState(false);
    const [mode, setMode] = useBenchMode();
    const [depth, setDepth] = useBenchDepth();
    const [hover, setHover] = useState(null);
    const [last, setLast] = useState('preset');
    const [announce, setAnnounce] = useState(null);
    const [liveCutoff, setLiveCutoff] = useState(null); // the sweep's cutoff, so the console shows the graph's number
    const [lastKey, setLastKey] = useState(null);
    const stateRef = useRef(state);
    const hoverRef = useRef(null);
    const heldRef = useRef(false);
    const { studioOrigin } = useStudioArrival();
    const teach = mode === 'teacher';
    const graphRef = useRef(null);
    const heldVoices = useRef(new Map());

    // One beat a tick: four steps booked at a time, so a change lands within a beat.
    const onSchedule = useCallback((tick) => {
        const g = graphRef.current;
        if (!g) return;
        const s = stateRef.current;
        const beat = tick.bar;
        const bar = Math.floor(beat / 4);
        const first = (beat % 4) * 4;
        const stepSec = tick.beatSec / 4;
        const swingSec = stepSec * (s.swing / 100) * 0.5;
        if (beat % 4 === 0) {
            window.__benchLoopStart = tick.barStart;
            if (s.sweep && !heldRef.current) {
                const fc = g.cutoffCtl.offset;
                const from = sweepCutoffAt(s.sweep, bar, 0);
                const to = sweepCutoffAt(s.sweep, bar, 1);
                fc.cancelScheduledValues(tick.barStart);
                fc.setValueAtTime(from, tick.barStart);
                fc.exponentialRampToValueAtTime(to, tick.barStart + tick.beatSec * 4);
            }
        }
        for (let i = 0; i < 4; i += 1) {
            const step = first + i;
            const t = tick.barStart + i * stepSec + (step % 2 ? swingSec : 0);
            if (s.lanes.kick[step]) tick.playBuffer('kick', t, { gain: 1, destination: g.drums });
            if (s.lanes.snare[step]) tick.playBuffer('snare', t, { gain: 0.8, destination: g.drums });
            if (s.lanes.hat[step]) tick.playBuffer('hat', t, { gain: step % 2 ? 0.45 : 0.6, destination: g.drums });
            if (s.lanes.bass[step]) g.voice(bassMidi(s.bassNote[step]), t, { decay: s.decay / 1000, level: 1 });
            if (s.lanes.chord[step]) CHORDS[s.chordIdx[step]].notes.forEach((n) => g.voice(n, t, { decay: Math.max(0.5, (s.decay / 1000) * 2.2), level: 0.4 }));
            g.book(step, bar, t, stepSec);
        }
    }, []);
    const buildGraph = useCallback((ctx, input, master) => {
        const g = buildSeqGraph(ctx, input, master, stateRef.current);
        graphRef.current = g;
        return g;
    }, []);
    const audio = useBenchAudio({ files: FILES, bpm: state.tempo, beatsPerBar: 1, onSchedule, buildGraph });
    const { ctxRef, nodesRef, began, playing, start, stop, begin } = audio;
    const playingRef = useRef(false);

    // the output tap, once the kit's level node exists
    useEffect(() => {
        const ctx = ctxRef.current; const nodes = nodesRef.current; const g = graphRef.current;
        if (ctx && nodes && g && !g.outTapped) { nodes.level.connect(g.out); g.outTapped = true; }
        if (ctx && nodes) glide(nodes.level.gain, state.level, ctx);
    }, [state.level, began, ctxRef, nodesRef]);
    // the controls reach the graph through the shared cutoff and resonance.
    // A cutoff change (or a preset with a sweep) lands at once; the sweep's
    // own ramps are booked at each bar and are not disturbed by a resonance change.
    useEffect(() => {
        const ctx = ctxRef.current; const g = graphRef.current;
        if (!ctx || !g || heldRef.current) return;
        g.cutoffCtl.offset.cancelScheduledValues(ctx.currentTime);
        glide(g.cutoffCtl.offset, state.cutoff, ctx, 0.015);
    }, [state.cutoff, state.sweep, began, ctxRef]);
    useEffect(() => {
        const ctx = ctxRef.current; const g = graphRef.current;
        if (!ctx || !g) return;
        glide(g.qCtl.offset, resToQdb(state.res), ctx, 0.015);
    }, [state.res, began, ctxRef]);

    const touch = (what) => { setLast(what); setAnnounce(null); };
    const chooseDepth = (id) => { setDepth(id); setAnnounce(id); };
    const choosePreset = (id) => { setState((s) => applyPreset(s, id)); setLiveCutoff(null); touch('preset'); if (playingRef.current) audio.restart(); };
    const patternTool = (id) => { setState((s) => (id === 'empty' ? clearPattern(s) : s.presetId ? applyPreset(s, s.presetId) : applyPreset(s, 'bass'))); setLiveCutoff(null); touch('cell'); };
    const chooseCutoffPos = (p) => { setState((s) => setCutoff(s, posToHz(p))); setLiveCutoff(null); touch('cutoff'); };
    const chooseCutoffHz = (hz) => { setState((s) => setCutoff(s, hz)); setLiveCutoff(null); touch('cutoff'); };
    const holdOpen = (on) => {
        heldRef.current = on;
        const ctx = ctxRef.current; const g = graphRef.current;
        if (!ctx || !g) return;
        const fc = g.cutoffCtl.offset;
        fc.cancelScheduledValues(ctx.currentTime);
        glide(fc, on ? CUTOFF_MAX : stateRef.current.cutoff, ctx, 0.02);
    };
    const togglePlay = useCallback(() => (playingRef.current ? stop() : start()), [start, stop]);

    // ---- the keys: mouse, touch and typing; Record writes them in ----
    const keyRefs = useRef({});
    const lightKeys = useCallback((step) => {
        const s = stateRef.current;
        const want = {};
        if (step != null) {
            if (s.lanes.chord[step]) CHORDS[s.chordIdx[step]].notes.forEach((n) => { want[n] = 'chord'; });
            if (s.lanes.bass[step]) want[bassMidi(s.bassNote[step])] = 'bass';
        }
        for (const [m, el] of Object.entries(keyRefs.current)) {
            const lit = want[m] || '';
            if (el && (el.dataset.lit || '') !== lit) { if (lit) el.dataset.lit = lit; else delete el.dataset.lit; }
        }
    }, []);
    const noteOn = useCallback(async (m) => {
        if (heldVoices.current.has(m)) return;
        const ctx = await begin();
        const g = graphRef.current;
        if (!g) return;
        // the kit fades the master out on Stop; a key played while stopped opens it again
        if (!playingRef.current && nodesRef.current) glide(nodesRef.current.master.gain, 1, ctx, 0.01);
        heldVoices.current.set(m, g.voice(m, ctx.currentTime, { hold: true, decay: 0.6, level: 0.8 }));
        const el = keyRefs.current[m]; if (el) el.dataset.down = 'true';
        setLastKey(m);
        const pos = playingRef.current ? g.position() : null;
        if (stateRef.current.record && pos) { setState((s) => recordNote(s, m, pos.step, pos.frac)); touch('key'); }
    }, [begin]);
    const noteOff = useCallback((m) => {
        const v = heldVoices.current.get(m);
        if (!v) return;
        v.release(); heldVoices.current.delete(m);
        const el = keyRefs.current[m]; if (el) delete el.dataset.down;
    }, []);
    const toggleRecord = () => {
        const on = !stateRef.current.record;
        setState((s) => setRecord(s, on));
        touch('record');
        if (on && !playingRef.current) start();
    };

    useEffect(() => {
        function onKey(e) {
            if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
            const el = e.target;
            const tag = el?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el?.isContentEditable) return;
            if (document.getElementById('bench-drawer')?.dataset.open === 'true') return;
            if (el !== document.body && !el?.closest?.('[data-bench-frame]')) return;
            if (e.key === ' ') {
                if (el?.closest?.('[data-hold]')) return;
                e.preventDefault();
                togglePlay();
                return;
            }
            const m = KEY_MAP[e.key.toLowerCase()];
            if (m && !el?.closest?.('[role="slider"], [role="spinbutton"]')) { e.preventDefault(); noteOn(m); }
        }
        function onUp(e) { const m = KEY_MAP[e.key.toLowerCase()]; if (m) noteOff(m); }
        function onBlur() { [...heldVoices.current.keys()].forEach(noteOff); }
        window.addEventListener('keydown', onKey);
        window.addEventListener('keyup', onUp);
        window.addEventListener('blur', onBlur);
        return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onUp); window.removeEventListener('blur', onBlur); };
    }, [togglePlay, noteOn, noteOff]);

    // Everything the stage draws and the console reads, from one state.
    const rd = useMemo(() => readings(state), [state]);
    const vd = rd.verdict;
    const rdRef = useRef(rd);
    const task = state.task ? TASKS[state.task] : null;
    const shownCutoff = liveCutoff ?? state.cutoff;

    // ---- stage ----
    const canvasRef = useRef(null);
    const geomRef = useRef(null);
    const dragRef = useRef(null);
    const depthRef = useRef(depth);
    const readRef = useRef(null);
    const nowRef = useRef(null);
    const liveCutoffRef = useRef(null);
    // the draw loop and the scheduler read the latest of these without re-subscribing
    useEffect(() => { stateRef.current = state; hoverRef.current = hover; playingRef.current = playing; rdRef.current = rd; depthRef.current = depth; });

    useEffect(() => {
        const first = canvasRef.current;
        if (!first) return undefined;
        let raf = 0;
        const css = getComputedStyle(first.parentElement);
        const v = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
        const col = {
            kick: v('--gen-2', '#7fb0c4'), snare: v('--gen-7', '#7fd6de'), hat: v('--gen-1', '#7fb39b'), bass: v('--gold-bright', '#f0d48a'), chord: v('--gen-3', '#a395c9'),
            post: '#7aa2ff', gold: v('--gold', '#c5a855'), goldBright: v('--gold-bright', '#f0d48a'),
            ink: 'rgba(255, 255, 255, 0.86)', inkSoft: 'rgba(255, 255, 255, 0.62)', inkFaint: 'rgba(255, 255, 255, 0.38)',
            grid: 'rgba(255, 255, 255, 0.055)', gridStrong: 'rgba(255, 255, 255, 0.11)', pre: 'rgba(238, 241, 246, 0.34)',
            cellOff: 'rgba(255, 255, 255, 0.045)', cellEdge: 'rgba(0, 0, 0, 0.28)', navy: '#17172b',
        };
        const monoFace = v('--mono', 'monospace');
        const mono = `500 11px ${monoFace}`;
        const monoSmall = `500 10px ${monoFace}`;
        const timeBuf = new Float32Array(2048); const oscBuf = new Float32Array(2048); const ampBuf = new Float32Array(2048); const outBuf = new Float32Array(2048);
        const freqPre = new Uint8Array(1024); const freqPost = new Uint8Array(1024);
        const scopeGain = {};
        const withAlpha = (c, a) => { if (c[0] === '#') { const n = parseInt(c.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; } return c.replace(/,\s*[\d.]+\)$/, `,${a})`); };
        const fx = (f, x0, w) => x0 + (Math.log(f / FMIN) / Math.log(FMAX / FMIN)) * w;
        const xf = (x, x0, w) => FMIN * (FMAX / FMIN) ** clamp((x - x0) / w, 0, 1);
        let frame = 0;
        let lastLitStep = -2;

        function draw() {
            const canvas = canvasRef.current;
            if (!canvas) { raf = requestAnimationFrame(draw); return; }
            const g2 = canvas.getContext('2d');
            const s = stateRef.current;
            const d = depthRef.current;
            const rdd = rdRef.current;
            const dpr = window.devicePixelRatio || 1;
            const w = canvas.clientWidth; const hgt = canvas.clientHeight;
            if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(hgt * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(hgt * dpr); }
            g2.setTransform(dpr, 0, 0, dpr, 0, 0);
            g2.clearRect(0, 0, w, hgt);
            const gr = graphRef.current;
            const ctx = ctxRef.current;
            const isPlaying = playingRef.current;
            const pos = isPlaying && gr ? gr.position() : null;
            const nowStep = pos ? pos.step : null;
            // the cutoff the voices are using: the control, which the sweep moves
            const fcLive = gr ? gr.cutoffCtl.offset.value : s.cutoff;
            const sweeping = Boolean(s.sweep) && isPlaying && !heldRef.current;
            if (sweeping) {
                if (frame % 6 === 0 && Math.abs((liveCutoffRef.current || 0) - fcLive) > fcLive * 0.02) { liveCutoffRef.current = Math.round(fcLive); setLiveCutoff(Math.round(fcLive)); }
            } else if (liveCutoffRef.current != null) { liveCutoffRef.current = null; setLiveCutoff(null); }
            if (gr && ctx) {
                gr.filt.getFloatTimeDomainData(timeBuf);
                gr.osc.getFloatTimeDomainData(oscBuf);
                gr.amp.getFloatTimeDomainData(ampBuf);
                gr.out.getFloatTimeDomainData(outBuf);
                gr.osc.getByteFrequencyData(freqPre);
                gr.filt.getByteFrequencyData(freqPost);
            } else { timeBuf.fill(0); oscBuf.fill(0); ampBuf.fill(0); outBuf.fill(0); freqPre.fill(0); freqPost.fill(0); }

            // ---- geometry ----
            const short = hgt < 330;
            const top = short ? 40 : 46; const bottom = hgt - (short ? 24 : 30); const pad = 16; const gap = 14;
            const gridFrac = d === 'core' ? 0.56 : 0.44;
            const gridW = Math.round((w - pad * 2 - gap) * gridFrac);
            const G = { x0: pad, x1: pad + gridW, top, bottom };
            const P = { x0: G.x1 + gap, x1: w - pad, top, bottom };
            const labelW = 50; const numH = 14;
            const cellGap = 3;
            const cellW = (G.x1 - G.x0 - labelW - cellGap * (STEPS - 1)) / STEPS;
            const rowsH = G.bottom - G.top - numH - 4;
            const cellH = Math.min(52, (rowsH - cellGap * (LANE_IDS.length - 1)) / LANE_IDS.length);
            // a tall stage centres the grid beside the picture rather than leaving plate below it
            const gridH = numH + 4 + cellH * LANE_IDS.length + cellGap * (LANE_IDS.length - 1);
            const gridTop = G.top + Math.max(0, (G.bottom - G.top - gridH) / 2);
            const cellX = (st) => G.x0 + labelW + st * (cellW + cellGap);
            const cellY = (r) => gridTop + numH + 4 + r * (cellH + cellGap);
            const cells = [];
            const swingPx = (s.swing / 100) * 0.5 * (cellW + cellGap);

            // ---- the grid: the sequencer itself ----
            g2.font = monoSmall; g2.textBaseline = 'middle';
            for (let st = 0; st < STEPS; st += 1) {
                const isBeat = st % 4 === 0;
                g2.fillStyle = nowStep === st ? col.ink : isBeat ? col.inkSoft : col.inkFaint;
                g2.textAlign = 'center';
                g2.fillText(String(st + 1).padStart(2, '0'), cellX(st) + cellW / 2, gridTop + numH / 2);
            }
            if (nowStep != null) {
                const px = cellX(nowStep) - 2 + (nowStep % 2 ? swingPx : 0);
                g2.fillStyle = 'rgba(255, 255, 255, 0.07)';
                g2.fillRect(px, gridTop, cellW + 4, cellY(LANE_IDS.length - 1) + cellH - gridTop + 2);
                g2.fillStyle = col.ink; g2.fillRect(px, gridTop - 1, cellW + 4, 2);
            }
            if (swingPx > 0.5) {
                // swing as a distance: every second column's true time, dotted in gold
                g2.save(); g2.strokeStyle = withAlpha(col.gold, 0.5); g2.setLineDash([2, 3]); g2.beginPath();
                for (let st = 1; st < STEPS; st += 2) { const gx = Math.round(cellX(st) + swingPx) + 0.5; g2.moveTo(gx, gridTop + numH); g2.lineTo(gx, cellY(LANE_IDS.length - 1) + cellH + 2); }
                g2.stroke(); g2.restore();
            }
            LANE_IDS.forEach((lane, r) => {
                const y = cellY(r);
                const lc = col[lane];
                g2.fillStyle = lc; g2.beginPath(); g2.arc(G.x0 + 5, y + cellH / 2, 3, 0, Math.PI * 2); g2.fill();
                g2.fillStyle = col.inkSoft; g2.font = monoSmall; g2.textAlign = 'left';
                g2.fillText(LANES[lane].label, G.x0 + 13, y + cellH / 2);
                for (let st = 0; st < STEPS; st += 1) {
                    const x = cellX(st);
                    const on = s.lanes[lane][st];
                    const hot = hoverRef.current && hoverRef.current.lane === lane && hoverRef.current.step === st;
                    if (on) {
                        g2.fillStyle = lc; g2.globalAlpha = nowStep === st ? 1 : 0.82;
                        g2.fillRect(x, y, cellW, cellH);
                        g2.globalAlpha = 1;
                        if (nowStep === st) { g2.strokeStyle = col.ink; g2.lineWidth = 1.5; g2.strokeRect(x + 0.75, y + 0.75, cellW - 1.5, cellH - 1.5); g2.lineWidth = 1; }
                        const txt = cellText(s, lane, st);
                        if (txt && cellW >= 22) {
                            g2.fillStyle = col.navy; g2.font = cellW < 30 ? `600 9px ${monoFace}` : `600 10.5px ${monoFace}`; g2.textAlign = 'center';
                            g2.fillText(txt, x + cellW / 2, y + cellH / 2 + 0.5);
                            if (lane === 'bass' && s.bassHow[st] === 'played' && d !== 'core') { g2.fillStyle = col.navy; g2.beginPath(); g2.arc(x + cellW - 4, y + 4, 1.6, 0, Math.PI * 2); g2.fill(); }
                        }
                    } else {
                        g2.fillStyle = st % 4 === 0 ? 'rgba(255, 255, 255, 0.07)' : col.cellOff;
                        g2.fillRect(x, y, cellW, cellH);
                        g2.strokeStyle = hot ? col.inkSoft : col.cellEdge; g2.strokeRect(x + 0.5, y + 0.5, cellW - 1, cellH - 1);
                    }
                    cells.push({ lane, step: st, x0: x, x1: x + cellW, y0: y, y1: y + cellH, on });
                }
            });
            g2.fillStyle = col.inkFaint; g2.font = monoSmall; g2.textAlign = 'right'; g2.textBaseline = 'alphabetic';
            g2.fillText(KEY_SIG, G.x1, Math.min(G.bottom + (short ? 14 : 16), cellY(LANE_IDS.length - 1) + cellH + 18));

            // ---- the picture beside the grid ----
            const panel = (x, y, pw, ph, title) => {
                g2.fillStyle = 'rgba(0, 0, 0, 0.16)'; g2.fillRect(x, y, pw, ph);
                g2.strokeStyle = 'rgba(255, 255, 255, 0.09)'; g2.strokeRect(x + 0.5, y + 0.5, pw - 1, ph - 1);
                if (title) { g2.fillStyle = 'rgba(238, 241, 246, 0.55)'; g2.font = monoSmall; g2.textBaseline = 'top'; g2.textAlign = 'left'; g2.fillText(title, x + 10, y + 8); }
            };
            const gridLines = (x, y, pw, ph, nx, ny) => {
                g2.strokeStyle = col.grid; g2.beginPath();
                for (let i = 1; i < nx; i += 1) { const gx = Math.round(x + (pw * i) / nx) + 0.5; g2.moveTo(gx, y); g2.lineTo(gx, y + ph); }
                for (let i = 1; i < ny; i += 1) { const gy = Math.round(y + (ph * i) / ny) + 0.5; g2.moveTo(x, gy); g2.lineTo(x + pw, gy); }
                g2.stroke();
            };
            const triggerIndex = (buf) => { const n = buf.length; const a = Math.floor(n * 0.15); const b = Math.floor(n * 0.6); for (let i = a; i < b; i += 1) if (buf[i - 1] <= 0 && buf[i] > 0) return i; return a; };
            const drawScope = (buf, x, y, pw, ph, color, { fill = true, samples = 600, glow = true, key = 'a', ref = buf, fixed = false } = {}) => {
                let g1 = 1;
                if (!fixed) {
                    let pk = 0; for (let i = 0; i < ref.length; i += 2) pk = Math.max(pk, Math.abs(ref[i]));
                    const want = pk > 0.004 ? clamp(0.92 / pk, 0.5, 14) : (scopeGain[key] ?? 1);
                    scopeGain[key] = scopeGain[key] === undefined ? want : scopeGain[key] + (want - scopeGain[key]) * (want < scopeGain[key] ? 0.35 : 0.08);
                    g1 = scopeGain[key];
                }
                const i0 = triggerIndex(buf); const mid = y + ph / 2; const amp = (ph / 2 - 8) * g1;
                g2.save(); g2.beginPath();
                for (let i = 0; i < samples; i += 1) { const val = buf[Math.min(buf.length - 1, i0 + i)]; const px = x + (i / (samples - 1)) * pw; const py = clamp(mid - val * amp, y + 2, y + ph - 2); if (i) g2.lineTo(px, py); else g2.moveTo(px, py); }
                if (fill) { g2.save(); g2.lineTo(x + pw, mid); g2.lineTo(x, mid); g2.closePath(); g2.fillStyle = withAlpha(color, 0.10); g2.fill(); g2.restore(); }
                g2.strokeStyle = color; g2.lineWidth = 1.6; g2.lineJoin = 'round';
                if (glow) { g2.shadowColor = color; g2.shadowBlur = 9; }
                g2.stroke(); g2.restore();
                g2.strokeStyle = col.gridStrong; g2.beginPath(); g2.moveTo(x, Math.round(mid) + 0.5); g2.lineTo(x + pw, Math.round(mid) + 0.5); g2.stroke();
            };
            let handle = null;
            const drawSpectrum = (x, y, pw, ph, { labels = true } = {}) => {
                const t = y + 24; const b = y + ph - 22; const sh = b - t;
                g2.strokeStyle = col.grid; g2.beginPath();
                [50, 100, 200, 500, 1000, 2000, 5000, 10000].forEach((f) => { const gx = Math.round(fx(f, x, pw)) + 0.5; g2.moveTo(gx, t); g2.lineTo(gx, b); });
                for (let i = 1; i < 4; i += 1) { const gy = Math.round(t + (sh * i) / 4) + 0.5; g2.moveTo(x, gy); g2.lineTo(x + pw, gy); }
                g2.stroke();
                if (labels) { g2.fillStyle = 'rgba(238, 241, 246, 0.45)'; g2.font = monoSmall; g2.textBaseline = 'top'; g2.textAlign = 'center'; [[100, '100 Hz'], [1000, '1 kHz'], [10000, '10 kHz']].forEach(([f, l]) => g2.fillText(l, fx(f, x, pw), b + 6)); }
                if (ctx && gr) {
                    const nyq = ctx.sampleRate / 2; const bins = freqPre.length;
                    const path = (arr, close) => { g2.beginPath(); let started = false; for (let i = 1; i < bins; i += 1) { const f = (i / bins) * nyq; if (f < FMIN) continue; if (f > FMAX) break; const px = fx(f, x, pw); const py = b - (arr[i] / 255) * sh; if (started) g2.lineTo(px, py); else g2.moveTo(px, py); started = true; } if (close) { g2.lineTo(x + pw, b); g2.lineTo(fx(FMIN, x, pw), b); g2.closePath(); } };
                    g2.save();
                    path(freqPre, false); g2.strokeStyle = col.pre; g2.lineWidth = 1.2; g2.stroke();
                    path(freqPost, true); const grad = g2.createLinearGradient(0, t, 0, b); grad.addColorStop(0, 'rgba(122,162,255,0.55)'); grad.addColorStop(1, 'rgba(122,162,255,0.06)'); g2.fillStyle = grad; g2.fill();
                    path(freqPost, false); g2.strokeStyle = col.post; g2.lineWidth = 1.6; g2.shadowColor = col.post; g2.shadowBlur = 8; g2.stroke();
                    g2.restore();
                }
                // the filter's own response, the same RBJ maths the node runs
                const curve = filterCurve(fcLive, s.res, RESP_F);
                const dbY = (db) => t + sh * (1 - clamp((db + 36) / 54, 0, 1));
                g2.save(); g2.beginPath();
                curve.forEach((p, i) => { const px = fx(p.hz, x, pw); const py = dbY(p.db); if (i) g2.lineTo(px, py); else g2.moveTo(px, py); });
                g2.strokeStyle = col.gold; g2.lineWidth = 2; g2.shadowColor = col.gold; g2.shadowBlur = 10; g2.stroke();
                const hx = fx(fcLive, x, pw); const hy = dbY(filterCurve(fcLive, s.res, [fcLive])[0].db);
                g2.shadowBlur = 0;
                g2.strokeStyle = withAlpha(col.gold, 0.35); g2.setLineDash([3, 4]); g2.beginPath(); g2.moveTo(Math.round(hx) + 0.5, t); g2.lineTo(Math.round(hx) + 0.5, b); g2.stroke(); g2.setLineDash([]);
                g2.fillStyle = col.navy; g2.beginPath(); g2.arc(hx, hy, 6.5, 0, Math.PI * 2); g2.fill();
                g2.strokeStyle = col.goldBright; g2.lineWidth = 2; g2.stroke();
                if (pw > 300) { g2.fillStyle = col.goldBright; g2.font = monoSmall; g2.textBaseline = 'bottom'; g2.textAlign = hx > x + pw - 90 ? 'right' : 'left'; g2.fillText(`cutoff ${fmtHz(fcLive)}`, hx + (hx > x + pw - 90 ? -10 : 10), hy - 8); }
                g2.restore();
                handle = { x, w: pw, hx, hy, t, b, yAt: (px) => dbY(filterCurve(fcLive, s.res, [xf(px, x, pw)])[0].db) };
            };
            const PW = P.x1 - P.x0; const PH = P.bottom - P.top;
            if (d === 'core') {
                panel(P.x0, P.top, PW, PH, 'The wave, after the filter');
                gridLines(P.x0, P.top + 24, PW, PH - 24, 8, 4);
                drawScope(timeBuf, P.x0, P.top + 24, PW, PH - 24, col.post, { key: 'core' });
            } else if (d === 'alevel') {
                panel(P.x0, P.top, PW, PH, 'Spectrum, with the filter curve in gold');
                drawSpectrum(P.x0, P.top + 12, PW, PH - 12);
            } else {
                const gapX = 26; const gapY = 10;
                const pw = (PW - gapX) / 2; const ph = (PH - gapY) / 2;
                const titles = ['1 · Oscillators', '2 · Filter', '3 · Amplifier', '4 · Output'];
                const subs = ['2 × sawtooth, 9 cents apart', `cutoff ${fmtHz(fcLive)} · resonance ${s.res}%`, `envelope, decay ${s.decay} ms`, 'master, true scale'];
                const at = [[P.x0, P.top], [P.x0 + pw + gapX, P.top], [P.x0, P.top + ph + gapY], [P.x0 + pw + gapX, P.top + ph + gapY]];
                for (let i = 0; i < 4; i += 1) {
                    const [x, y] = at[i];
                    panel(x, y, pw, ph, titles[i]);
                    g2.save(); g2.beginPath(); g2.rect(x, y, pw - 6, 40); g2.clip(); g2.fillStyle = 'rgba(238,241,246,0.38)'; g2.font = `500 9.5px ${monoFace}`; g2.textBaseline = 'top'; g2.textAlign = 'left'; g2.fillText(subs[i], x + 10, y + 21); g2.restore();
                    const iy = y + 34; const ih = ph - 40;
                    if (i === 0) { gridLines(x, iy, pw, ih, 4, 2); drawScope(oscBuf, x, iy, pw, ih, 'rgba(238,241,246,0.9)', { samples: 400, glow: false, key: 'chain' }); }
                    if (i === 1) drawSpectrum(x, iy - 12, pw, ih + 12, { labels: pw > 220 });
                    if (i === 2) { gridLines(x, iy, pw, ih, 4, 2); drawScope(ampBuf, x, iy, pw, ih, col.post, { samples: 400, key: 'chain', ref: oscBuf }); }
                    if (i === 3) { gridLines(x, iy, pw, ih, 4, 2); drawScope(outBuf, x, iy, pw, ih, col.goldBright, { samples: 400, fixed: true }); }
                    // the arrows: 1 → 2 across, 2 → 3 down and back, 3 → 4 across
                    g2.save(); g2.strokeStyle = 'rgba(238,241,246,0.5)'; g2.fillStyle = 'rgba(238,241,246,0.5)'; g2.lineWidth = 1.5;
                    if (i === 0 || i === 2) { const ax = x + pw + 5; const ay = y + ph / 2; g2.beginPath(); g2.moveTo(ax, ay); g2.lineTo(ax + gapX - 13, ay); g2.stroke(); g2.beginPath(); g2.moveTo(ax + gapX - 13, ay - 4); g2.lineTo(ax + gapX - 7, ay); g2.lineTo(ax + gapX - 13, ay + 4); g2.closePath(); g2.fill(); }
                    g2.restore();
                }
            }

            // ---- the readouts, told to the DOM ----
            if (readRef.current) {
                const txt = pos ? ` · bar ${pos.bar + 1} · step ${String(pos.step + 1).padStart(2, '0')}` : ' · bar 1 · step 01';
                if (readRef.current.textContent !== txt) readRef.current.textContent = txt;
            }
            if (nowRef.current) {
                const txt = nowStep != null ? stepSends(s, nowStep) || 'silent' : 'stopped';
                if (nowRef.current.textContent !== txt) nowRef.current.textContent = txt;
            }
            if (nowStep !== lastLitStep) { lastLitStep = nowStep; lightKeys(nowStep); }
            geomRef.current = { cells, handle, spectrum: handle ? { x: handle.x, w: handle.w } : null };
            const tags = {
                stage: STAGE_OF[d],
                cutoff: String(Math.round(fcLive)),
                handle: handle ? `${Math.round(handle.hx)}:${Math.round(handle.hy)}` : '',
                pattern: patternTag(s),
                lit: String(rdd.counts.all),
                verdict: rdd.verdict.key,
                step: nowStep == null ? '' : String(nowStep),
                note: heldVoices.current.size ? String([...heldVoices.current.keys()].pop()) : '',
            };
            const firstDark = cells.find((c) => c.lane === 'snare' && !c.on);
            tags.cell = firstDark ? `${Math.round((firstDark.x0 + firstDark.x1) / 2)}:${Math.round((firstDark.y0 + firstDark.y1) / 2)}` : '';
            for (const [k, val] of Object.entries(tags)) if (canvas.dataset[k] !== val) canvas.dataset[k] = val;
            frame += 1;
            raf = requestAnimationFrame(draw);
        }
        raf = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(raf);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ---- the stage as a control: cells click, paint and tune; the gold curve drags ----
    const hitCell = (px, py) => { const gm = geomRef.current; if (!gm) return null; return gm.cells.find((c) => px >= c.x0 && px <= c.x1 && py >= c.y0 && py <= c.y1) || null; };
    const onCurve = (px, py) => {
        const h = geomRef.current?.handle; if (!h) return false;
        if (px < h.x - 8 || px > h.x + h.w + 8) return false;
        if (Math.hypot(px - h.hx, py - h.hy) < 16) return true;
        return Math.abs(py - h.yAt(clamp(px, h.x, h.x + h.w))) < 12;
    };
    const cutoffAt = (px) => { const h = geomRef.current?.handle; if (!h) return null; return FMIN * (FMAX / FMIN) ** clamp((px - h.x) / h.w, 0, 1); };
    const onStageDown = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const px = e.clientX - rect.left; const py = e.clientY - rect.top;
        if (onCurve(px, py)) {
            e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId);
            dragRef.current = { kind: 'curve' };
            chooseCutoffHz(cutoffAt(px));
            return;
        }
        const c = hitCell(px, py);
        if (c) {
            e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId);
            dragRef.current = { kind: 'cell', lane: c.lane, step: c.step, y0: py, base: c.lane === 'bass' ? stateRef.current.bassNote[c.step] : c.lane === 'chord' ? stateRef.current.chordIdx[c.step] : 0, moved: false, paintTo: null, was: c.on };
        }
    };
    const onStageMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const px = e.clientX - rect.left; const py = e.clientY - rect.top;
        const dg = dragRef.current;
        if (dg?.kind === 'curve') { chooseCutoffHz(cutoffAt(px)); return; }
        if (dg?.kind === 'cell') {
            if (isTunable(dg.lane)) {
                const delta = Math.round((dg.y0 - py) / 9);
                if (delta === 0 && !dg.moved) return;
                dg.moved = true;
                setState((s) => { const cur = dg.lane === 'bass' ? s.bassNote[dg.step] : s.chordIdx[dg.step]; return nudgeNote(s, dg.lane, dg.step, dg.base + delta - cur); });
                touch('cell');
            } else {
                const over = hitCell(px, py);
                if (!over || over.lane !== dg.lane) return;
                if (over.step === dg.step && dg.paintTo === null) return;
                if (dg.paintTo === null) { dg.paintTo = !dg.was; dg.moved = true; setState((s) => setStep(s, dg.lane, dg.step, dg.paintTo)); }
                setState((s) => setStep(s, dg.lane, over.step, dg.paintTo));
                touch('cell');
            }
            return;
        }
        e.currentTarget.style.cursor = onCurve(px, py) ? 'ew-resize' : hitCell(px, py) ? 'pointer' : '';
        const c = hitCell(px, py);
        if (!c) { if (hover) setHover(null); return; }
        if (hover && hover.lane === c.lane && hover.step === c.step) return;
        setHover({ lane: c.lane, step: c.step, x: px, y: py, stageW: rect.width, stageH: rect.height });
    };
    const onStageUp = (e) => {
        const dg = dragRef.current;
        if (!dg) return;
        dragRef.current = null;
        try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* gone */ }
        if (dg.kind === 'cell' && !dg.moved) { setState((s) => toggleStep(s, dg.lane, dg.step)); touch('cell'); }
    };

    // ---- drawer content ----
    const topicHref = useCallback((slug) => memberTopicHref(null, slug, studioOrigin), [studioOrigin]);
    const drawerTabs = useMemo(() => [
        {
            id: 'reference',
            label: 'Reference',
            render: () => (
                <>
                    <h2>Sequencing, in the spec&apos;s words</h2>
                    <p>A sequencer records and plays back instructions, not sound. The spec names two ways of putting a part in: real-time input from a MIDI keyboard, played against the clock, and non-real-time input on a step grid or with the pencil, one note at a time. It names quantise as hard values, swing and percentage, and editing on the piano roll and in the list editor. This bench is the step grid with a synth on the end of it: sixteen steps, a note or a chord on each, a swing on the clock, and the part heard through a low-pass filter.</p>
                    <h3>Terms</h3>
                    <dl>
                        <dt>Step sequencer</dt><dd>A grid of steps, here sixteen to a bar: a sixteenth each at the tempo. A lit step sends its note when the clock reaches it. Non-real-time input: the note is placed, not played.</dd>
                        <dt>Real-time input</dt><dd>Playing the part on a keyboard while the sequencer runs. Record on this bench writes each key to the nearest step as it is played: quantised on entry.</dd>
                        <dt>Swing</dt><dd>Every second sixteenth held back by a fraction of a step. At 120 bpm a sixteenth is 125 ms, so 60 % swing on this bench is 37.5 ms late. The 2025 scheme lists swing quantise with the loose, live answers.</dd>
                        <dt>Hard quantise</dt><dd>Every note exactly on its step: the mechanical, tight side of the same comparison. A step sequencer is hard quantised by nature; swing is what loosens it.</dd>
                        <dt>Low-pass filter · cutoff · resonance</dt><dd>The filter passes what sits below the cutoff and cuts what sits above; resonance lifts a peak at the corner. The gold curve on the A-level screen is the filter&apos;s own response.</dd>
                        <dt>Envelope · decay</dt><dd>The amplifier opens on each note and closes over the decay time. Short is a pluck; long is a pad.</dd>
                        <dt>Bar · step</dt><dd>The transport reads the bar it is on and the step within it. A pass is one bar; the Filter sweep preset takes four.</dd>
                    </dl>
                    <h3>The material</h3>
                    <p>Everything is in {KEY_SIG}. The Bass row runs {bassRange()}; the chords are {chordTable().map((c) => `${c.name} (${c.notes})`).join(', ')}.</p>
                    <h3>In your DAW</h3>
                    <table>
                        <thead><tr><th>On this bench</th><th>Ableton Live</th><th>Logic Pro</th></tr></thead>
                        <tbody>
                            <tr><td>The step grid</td><td>A MIDI clip on a Drum Rack: draw hits in the note editor</td><td>A Step Sequencer pattern region: a row per sound, a step per column</td></tr>
                            <tr><td>Record from the keys</td><td>Arm the track, press Record, play; Record Quantization sets the grid</td><td>Arm the track, press Record, play; Time Quantize in the region inspector</td></tr>
                            <tr><td>Swing</td><td>A groove from the Groove Pool, with its Timing amount</td><td>Time Quantize&apos;s Swing, or a Swing setting on the pattern</td></tr>
                            <tr><td>Cutoff and resonance</td><td>The filter section of Analog, Wavetable or Operator</td><td>The filter section of Alchemy, Retro Synth or ES2</td></tr>
                        </tbody>
                    </table>
                    <p className={styles.source}>As the controls appear in Live 12 and Logic Pro 11. Check against your own version if they move.</p>
                    <h3>Beyond the paper<span className={styles.ext}>EXT</span></h3>
                    <dl>
                        <dt>Why a sequencer books ahead</dt><dd>A clock in software cannot fire a note at the exact instant; it looks a little ahead and books each step at its true time, so the timing is the audio clock&apos;s, not the screen&apos;s. This bench books 120 ms ahead.</dd>
                        <dt>One filter per note</dt><dd>Every note has its own filter, all set from one cutoff and one resonance, so a chord&apos;s three notes do not share one cut. That is how a polyphonic synth does it.</dd>
                    </dl>
                    <p className={styles.source}>The reading behind this bench is the topic&apos;s own Learn chapters and the 9MT0 papers and reports, 2019 to 2026, as read for the Piano Roll and the Synth bench.</p>
                </>
            ),
        },
        {
            id: 'teacher',
            label: 'Teacher',
            render: () => (
                <>
                    <h2>What to listen for</h2>
                    <p>Press Play and the bass and two chords run under a four-to-the-floor kick. Press <b>Hats and swing</b> and every second hat lands late: that is the whole of swing, heard before it is named. Press <b>Filter sweep</b> and the harmonics arrive low first over four bars, which is what a low-pass cutoff does when it moves. Press <b>Played in</b>, arm Record and play a key while it runs: the note lands on a step, and the bench says how it got there.</p>
                    <h3>What the schemes and reports say</h3>
                    <p>2025, the feel: &quot;Unquantised / gently quantised / groove quantise / swing quantise / percent quantise / humanise: loose / live / human / realistic feel&quot; against &quot;hard quantised / 1/16 / 1/8: mechanical / tight(er) / in time&quot;. One mark for the type, one for the feel word.</p>
                    <p>2024, the filter: &quot;many learners misidentified it as a boost/cut rather than an LPF and would discuss what resonance was but didn&apos;t discuss its impact on the sound&quot;. The A-level screen puts the impact in front of them: what the blue spectrum lost against the grey.</p>
                    <p>2019, the envelope: &quot;only the top performing candidates noticed that the envelope parameters were routed to the filter cutoff and not the amplitude&quot;. On this bench the envelope is on the amplifier and the cutoff is a dial, so the two can be told apart before the Synth bench routes one to the other.</p>
                    <p className={styles.source}>Source: Edexcel 9MT0/04 mark scheme 2025 Q2; examiner reports 2019 and 2024, as quoted on the Piano Roll and the Synth bench. The spec&apos;s wording of 1.5 as summarised on the topic page.</p>
                    <h3>Do these now</h3>
                    <ul>
                        <li>Press <b>Judge: straight</b>, switch to A-level, and read the line. Raise Swing to 40 and read it again: name the two feel words and the two types.</li>
                        <li>Press <b>Bass and chords</b>, switch to A-level, and drag the gold curve down to 300 Hz. Say what the blue lost against the grey, then raise Resonance and watch the corner.</li>
                        <li>Press <b>Played in</b>, arm Record, and play the bottom row of your keyboard (Z to M) while it runs. Say what quantising on entry did to your timing.</li>
                        <li>Switch to Extension and watch screen 1 while the bass plays: the oscillators keep running after the note has died. Say which screen the envelope acts on.</li>
                        <li>Turn Tempo from 112 to 90 and read the milliseconds a step becomes in the Time section. Say why swing at the same percentage is now more milliseconds.</li>
                    </ul>
                    <h3>Exam practice</h3>
                    <ExamCallout
                        prompt="The 2025 scheme compares two kinds of quantise by the feel they give. Name a type from each side, and the feel word the scheme pairs with it."
                        answer="Loose side: unquantised, gently quantised, groove, swing, percent or humanise, with loose, live, human or realistic. Tight side: hard quantised to 1/16 or 1/8, with mechanical, tight or in time."
                    />
                    <ExamCallout
                        prompt="A student says a low-pass filter is 'a boost or cut'. What did the 2024 report say was missing, and what would a full answer add?"
                        answer="The report says learners misidentified the LPF as a boost or cut and described resonance without its impact. A full answer names the filter as a low-pass, says the harmonics above the cutoff are removed so the sound is duller or rounder, and says resonance lifts a peak at the cutoff that rings or whistles as it moves."
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
                        <b>The voice on the end of the sequencer</b>
                        <span>Two oscillators, a filter and an envelope is the Synth bench&apos;s whole subject. It routes the envelope to the cutoff too, and judges a patch section by section.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('sequencing')}>
                        <i>1.5 Sequencing</i>
                        <b>The file the paper hands you</b>
                        <span>The Piano Roll is the other half of this topic: the MIDI file on the roll, the velocity table, the wrong drum sounds, the quantise value and the bend range.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('automation')}>
                        <i>1.8 Automation</i>
                        <b>The sweep is a lane</b>
                        <span>The Filter sweep preset moves one parameter over four bars. The Automation Lane draws that movement as points you place on a fader, a pan pot and a filter.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('eq')}>
                        <i>1.11 EQ</i>
                        <b>The same curve on a mix</b>
                        <span>A low-pass filter on a synth and the LPF band on an EQ are the same maths. The EQ bench draws it on a whole mix, with the slope as a choice.</span>
                    </a>
                </>
            ),
        },
    ], [topicHref]);

    // ---- the bench's one line to the student ----
    let say;
    if (announce) {
        say = <><b>{DEPTHS.find((dd) => dd.id === announce)?.label}:</b> {DEPTH_LINES[announce]}</>;
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
    const keys = [];
    for (let m = KBD_LO; m <= KBD_HI; m += 1) keys.push(m);
    const whites = keys.filter((m) => !isBlack(m));
    const blackLeft = (m) => { const below = whites.findIndex((wm) => wm > m); return `calc(3px + (100% - 6px) * ${below / whites.length})`; };
    const verdictWord = { free: 'no question', straight: 'straight', gentle: 'gentle swing', swung: 'swung', sweep: 'sweeping', closed: 'closed', open: 'open', partway: 'part open', played: 'played in', stepped: 'stepped in', empty: 'no bass' }[vd.key] || vd.key;

    const consoleSlot = (
        <>
            <PlayColumn
                playing={playing}
                onTogglePlay={togglePlay}
                onHoldDry={holdOpen}
                level={state.level}
                onLevel={(v2) => setState((s) => setLevel(s, v2))}
                teach={teach}
                holdLabel="hold: no filter"
                holdTitle="Hold to hear the synth with the filter wide open"
                holdWhy="opens the cutoff to 12 kHz while you hold it, so you hear what the filter is taking away"
                playWhy="runs the sixteen steps round, a bar a pass"
            />

            <div className={`${styles.sec} ${styles.secSeqTime}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>Time</span><span className={styles.value}>{Math.round(rd.stepMs)}<small>ms</small></span></div>
                <div className={styles.seqRow}>
                    <div className={styles.knob}>
                        <DragNumber label="Tempo" value={state.tempo} min={BPM_MIN} max={BPM_MAX} step={1} unit="bpm" onChange={(v2) => { setState((s) => setTempo(s, v2)); touch('tempo'); }} title="Beats a minute: drag up or down, or use the arrow keys" />
                        <span className={styles.readout}>tempo</span>
                    </div>
                    <div className={styles.knob}>
                        <Dial label="Swing" value={state.swing} min={0} max={SWING_MAX} step={1} unit="%" size="small" pixels={120} pointer="var(--teal)" onChange={(v2) => { setState((s) => setSwing(s, v2)); touch('swing'); }} title="How late every second sixteenth lands: 0 is hard quantised" />
                        <span className={styles.readout}>swing {state.swing}%</span>
                    </div>
                </div>
                <div className={styles.meaning}>{state.swing ? `a step; second steps ${Math.round(rd.swingMs)} ms late` : 'a step, every one on the grid'}</div>
                <Why>The clock. A step is a sixteenth of a bar at the tempo, so the milliseconds change with it. Swing holds every second sixteenth back by a fraction of a step: the gold dotted lines on the grid are where those steps really sound.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secSeqFilter}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow} data-hot="true">Filter</span><span className={styles.value} data-cutoff={Math.round(shownCutoff)}>{fmtHz(shownCutoff)}</span></div>
                <div className={styles.seqRow}>
                    <div className={styles.knob}>
                        <Dial label="Cutoff" value={hzToPos(shownCutoff)} min={0} max={1000} step={5} pixels={200} pointer="var(--gold-ink)" hot format={(p) => fmtHz(posToHz(p))} onChange={chooseCutoffPos} title="The low-pass filter's corner: what sits above it is cut. Drag the gold curve on the A-level screen for the same dial" />
                        <span className={styles.readout}>cutoff</span>
                    </div>
                    <div className={styles.knob}>
                        <Dial label="Resonance" value={state.res} min={0} max={100} step={1} unit="%" size="small" pixels={140} pointer="var(--gold-ink)" onChange={(v2) => { setState((s) => setRes(s, v2)); touch('res'); }} title="The peak at the corner, up to 18 dB" />
                        <span className={styles.readout}>res {state.res}%</span>
                    </div>
                </div>
                <div className={styles.meaning}>{state.sweep && playing ? 'sweeping over four bars' : `${rd.qdb.toFixed(1)} dB at the corner`}</div>
                <Why>One low-pass filter setting for every note. Cutoff is where the cut begins; harmonics above it lose level at 12 dB an octave. Resonance is the lift at the corner, in dB. The Filter sweep preset moves the cutoff itself; touch the dial and the sweep stops.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secKnob}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>Env</span></div>
                <div className={styles.knob}>
                    <Dial label="Decay" value={state.decay} min={DECAY_MIN} max={DECAY_MAX} step={10} pixels={160} pointer="var(--teal)" format={(v2) => `${v2} ms`} onChange={(v2) => { setState((s) => setDecay(s, v2)); touch('decay'); }} title="How long the amplifier takes to close after each note" />
                    <span className={styles.readout}>{state.decay} ms</span>
                </div>
                <Why>The amplifier&apos;s envelope: it opens in 6 ms and closes over the decay. On this bench the envelope is on the amplifier, not the cutoff, so the two can be told apart.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secKeys}`} data-teach={teach || undefined}>
                <div className={styles.secHead}>
                    <span className={styles.eyebrow}>Keys</span>
                    <span className={styles.value}>{lastKey != null ? noteName(lastKey) : 'none yet'}<small>last key</small></span>
                </div>
                <div className={styles.seqKbd} role="group" aria-label="Keys">
                    {keys.map((m) => (
                        <button
                            key={m}
                            type="button"
                            ref={(el) => { keyRefs.current[m] = el; }}
                            className={isBlack(m) ? styles.seqBlack : styles.seqWhite}
                            data-key={m}
                            style={isBlack(m) ? { left: blackLeft(m), '--bkw': `calc((100% - 6px) / ${whites.length} * 0.6)` } : undefined}
                            aria-label={noteName(m)}
                            onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); noteOn(m); }}
                            onPointerUp={() => noteOff(m)}
                            onPointerCancel={() => noteOff(m)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); noteOn(m); } }}
                            onKeyUp={(e) => { if (e.key === 'Enter') noteOff(m); }}
                        >
                            {!isBlack(m) && m % 12 === 0 ? <span className={styles.seqOct}>{noteName(m)}</span> : null}
                            {KEY_LETTER[m] ? <span className={styles.seqLtr}>{KEY_LETTER[m]}</span> : null}
                        </button>
                    ))}
                </div>
                <div className={styles.seqKeysFoot}>
                    <button type="button" className={`${styles.chip} ${styles.seqRec}`} data-record aria-pressed={state.record} onClick={toggleRecord} title="Keys you play while it runs are written to the Bass row at the nearest step">Record</button>
                    <span className={styles.meaning}>{state.record ? 'keys write to the Bass row' : 'play a key, or type its letter'}</span>
                </div>
                <Why>The same voice the sequencer plays, from the mouse or the letters printed on the keys. Sequenced notes light their keys as they sound: gold for the bass, purple for the chord. Record arms real-time input: each key you play lands on the nearest step of the Bass row, quantised on entry.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secHear}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>What you should hear</span></div>
                <div className={styles.stats} aria-live="polite">
                    <div><b>{rd.counts.all} lit</b><span>of {STEPS * LANE_IDS.length} steps</span></div>
                    <div><b>{rd.counts.bass} · {rd.counts.chord}</b><span>bass notes · chords</span></div>
                    <div><b>{Math.round(rd.stepMs)} ms</b><span>a sixteenth at {state.tempo}</span></div>
                    <div><b>{verdictWord}</b><span>{task ? `${task.label} (${task.years})` : 'press a preset to set one'}{depth === 'extension' ? <span className={styles.ext}>EXT</span> : null}</span></div>
                </div>
                {teach ? <div className={styles.meaning}>all from the grid, the clock and the filter</div> : null}
                <Legal />
                <Why>Every number here comes from the state: how many steps are lit and of what, what a sixteenth is at this tempo, and where the pattern stands against the question the preset set.</Why>
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
            <span className={styles.eyebrow}>Pattern</span>
            <Chips label="Pattern" options={PATTERN_TOOLS} value={null} onChange={patternTool} />
            <span className={styles.chipNote}>an empty grid to build on, or the preset as it came</span>
        </div>
    ) : null;

    const hoverText = hover ? (() => {
        const on = state.lanes[hover.lane][hover.step];
        const name = LANES[hover.lane].label;
        if (isTunable(hover.lane)) return { i: `${name} · step ${String(hover.step + 1).padStart(2, '0')}${on ? ` · ${cellText(state, hover.lane, hover.step)}` : ''}`, p: on ? `${hover.lane === 'bass' && state.bassHow[hover.step] === 'played' ? 'Played in from the keys. ' : ''}Drag up or down to change the ${hover.lane === 'bass' ? 'note' : 'chord'}; click to clear it.` : 'Click to light it, or drag up or down to choose the note as you do.' };
        return { i: `${name} · step ${String(hover.step + 1).padStart(2, '0')}`, p: on ? 'Click to clear it; drag along the row to clear several.' : 'Click to light it; drag along the row to paint several.' };
    })() : null;

    const stage = (
        <>
            <canvas
                ref={canvasRef}
                aria-label={depth === 'core' ? 'The sixteen steps and the wave after the filter' : depth === 'alevel' ? 'The sixteen steps and the spectrum under the filter curve' : 'The sixteen steps and the signal chain on four screens'}
                role="img"
                onPointerDown={onStageDown}
                onPointerMove={onStageMove}
                onPointerUp={onStageUp}
                onPointerCancel={onStageUp}
                onPointerLeave={() => { if (!dragRef.current) setHover(null); }}
            />
            <div className={styles.stageNote}>
                <b>{presetOf(state.presetId)?.name.toLowerCase() || 'your pattern'} · {state.tempo} bpm<span ref={readRef} style={{ '--read': '19ch' }} /></b>
                <span>{ORIENTS[depth] || ORIENTS.core}</span>
            </div>
            <div className={styles.stageLegend} aria-hidden="true">
                {LANE_IDS.map((id) => <span key={id}><i style={{ background: LANES[id].colour }} />{LANES[id].label.toLowerCase()}</span>)}
                <em ref={nowRef} className={styles.seqNow}>stopped</em>
            </div>
            {hover && teach && hoverText ? (
                <div className={styles.tip} style={{ left: Math.max(12, Math.min(hover.stageW - 290, hover.x - 135)), top: Math.max(44, Math.min(hover.stageH - 100, hover.y + 22)) }}>
                    <i>{hoverText.i}</i><p>{hoverText.p}</p>
                </div>
            ) : null}
            {!began ? (
                <div className={styles.begin}>
                    <button type="button" className={styles.beginBtn} onClick={() => audio.start()}>
                        <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1.2v9.6L11 6z" fill="currentColor" /></svg>
                        <span>
                            Play the bench
                            <small>Sixteen steps, a synth on the end of them. Headphones help.</small>
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
