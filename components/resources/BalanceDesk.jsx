'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BenchFrame from '@/components/bench/BenchFrame';
import { Dial, Fader, Chips, Why, MoreButton } from '@/components/bench/controls';
import { PlayColumn, Presets, Legal, ExamCallout, useBenchMode, useBenchDepth, DEPTHS } from '@/components/bench/BenchBits';
import { useBenchAudio, glide } from '@/components/bench/useBenchAudio';
import styles from '@/components/bench/bench.module.css';
import { memberTopicHref, useStudioArrival } from '@/lib/studio-return';
import { DEPTH_LINES, DEPTH_TEACH, judge, open as openMachine, hearingLine, nextMove } from '@/lib/bench/balance-depth';
import {
    STEM_IDS,
    STEMS,
    SONGS,
    BAND_EDGES,
    EAR_DB,
    DEFAULT_STATE,
    PRESETS,
    FADER_MIN,
    FADER_MAX,
    FLOOR,
    TOL,
    applyPreset,
    setParam,
    setFader,
    setPan,
    setSend,
    referenceState,
    hierarchy,
    maskingExtra,
    maskingAdded,
    band,
    delta,
    bandLevels,
    stemLevel,
    bandWords,
    fmtDb,
    fmtPan,
    fmtSend,
    deltaWord,
} from '@/lib/bench/balance-model';

// The Balance Desk (1.13), fifth bench to the Bench Standard. Five stems of
// one song arrive the way the exam supplies them: each file trimmed to a
// deliberately wrong level, every fader at unity. The trim is a hidden gain
// in the graph, so the faders say nothing and the ears have to. Hold the
// play column's button and every fader, pan and send swaps to the reference
// on the same beat. Three jobs (lib/bench/balance-depth.js): Core shows the
// mix as a plan, A-level judges it the way the paper does over the live
// spectrum, Extension opens the ladder of what the examiner did to each
// file. The block on the plan is the fader (law 20).

const CODE = '1.13 Balance';
const TITLE = 'Balance Desk';
const SONG = SONGS.kites;
const FILES = SONG.files;
const LOOP_BPM = 240 / SONG.loopSec; // one scheduler bar is the whole loop
const FADER_SCALE = [12, 0, -10, -20, -40, -60];
const ORIENTS = {
    core: 'Each block is a part: taller is louder for the ear, shifted sideways by its pan, raised by its send. Drag one up for its fader, sideways for its pan.',
    alevel: "The plan above; below it, every part's live spectrum on one axis. Where two curves ride together, the shaded region is the paper's masking.",
    extension: 'Below the plan, the ladder: each file as it was, the examiner\'s trim, your fader, and what you hear, weighted for the ear. Mono is in the More row.',
};
const MONO_OPTIONS = [{ id: 'stereo', label: 'Stereo' }, { id: 'mono', label: 'Mono' }];
const dbToGain = (db) => (db <= FLOOR ? 0 : 10 ** (db / 20));

// ---- the graph ------------------------------------------------------------
// Five strips: source -> the examiner's trim -> fader -> pan -> the bus, with
// a post-fade send from every fader into one shared reverb. An analyser sits
// after each fader for the meters and the spectrum. Mono is a second path to
// the master whose input is forced to one channel.
function makeIR(ctx) {
    const sr = ctx.sampleRate;
    const n = Math.round(sr * 1.8);
    const buf = ctx.createBuffer(2, n, sr);
    let seed = 1234567; // the same room every time
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return (seed / 4294967296) * 2 - 1; };
    for (let c = 0; c < 2; c += 1) {
        const d = buf.getChannelData(c);
        let lp = 0;
        for (let i = 0; i < n; i += 1) {
            const t = i / sr;
            const env = Math.exp((-t * 6.9) / 1.3); // about 1.3 s to -60 dB
            lp += 0.2 * (rnd() - lp); // the room's damping
            d[i] = lp * env * (i < 48 ? i / 48 : 1);
        }
    }
    return buf;
}

function buildDeskGraph(ctx, input, master, song) {
    const bus = ctx.createGain();
    const stereo = ctx.createGain();
    const mono = ctx.createGain();
    mono.channelCount = 1;
    mono.channelCountMode = 'explicit';
    mono.channelInterpretation = 'speakers';
    mono.gain.value = 0;
    const trim = ctx.createGain();
    trim.gain.value = 0.5; // five parts summed keep their headroom under the kit's limiter
    bus.connect(stereo);
    bus.connect(mono);
    stereo.connect(trim);
    mono.connect(trim);
    trim.connect(master);
    input.connect(master);
    const reverbIn = ctx.createGain();
    const conv = ctx.createConvolver();
    conv.buffer = makeIR(ctx);
    const reverbOut = ctx.createGain();
    reverbOut.gain.value = 0.7;
    reverbIn.connect(conv);
    conv.connect(reverbOut);
    reverbOut.connect(bus);
    const strips = {};
    for (const id of STEM_IDS) {
        const inp = ctx.createGain();
        const supplied = ctx.createGain();
        supplied.gain.value = dbToGain(song.supplied[id]);
        const fader = ctx.createGain();
        const pan = ctx.createStereoPanner();
        const send = ctx.createGain();
        send.gain.value = 0;
        const an = ctx.createAnalyser();
        an.fftSize = 2048;
        an.smoothingTimeConstant = 0.8;
        an.minDecibels = -90;
        an.maxDecibels = -10;
        inp.connect(supplied);
        supplied.connect(fader);
        fader.connect(pan);
        pan.connect(bus);
        fader.connect(an);
        fader.connect(send);
        send.connect(reverbIn);
        strips[id] = { inp, fader, pan, send, an, freq: new Uint8Array(an.frequencyBinCount) };
    }
    let loopStart = null;
    let loopDur = 0;
    function apply(state) {
        for (const id of STEM_IDS) {
            const s = strips[id];
            glide(s.fader.gain, dbToGain(state.fader[id]), ctx);
            glide(s.pan.pan, state.pan[id], ctx);
            glide(s.send.gain, state.send[id] * 0.9, ctx);
        }
        glide(stereo.gain, state.mono ? 0 : 1, ctx);
        glide(mono.gain, state.mono ? 1 : 0, ctx);
    }
    function schedule(at, dur) { loopStart = at; loopDur = dur; }
    function clear() { loopStart = null; }
    function position() {
        if (loopStart == null || !loopDur) return null;
        const pos = ctx.currentTime - loopStart;
        if (pos < 0) return 0;
        return (pos % loopDur) / loopDur;
    }
    return { strips, apply, schedule, clear, position };
}

// The ear's weight for an analyser bin, from the band table.
function earWeights(binCount, sr) {
    const w = new Float32Array(binCount);
    for (let i = 0; i < binCount; i += 1) {
        const f = (i * sr) / 2 / binCount;
        let k = 0;
        while (k < BAND_EDGES.length - 2 && f >= BAND_EDGES[k + 1]) k += 1;
        w[i] = f < 30 ? 0 : 10 ** (EAR_DB[k] / 10);
    }
    return w;
}

// ---- the bench ------------------------------------------------------------
export default function BalanceDesk({ back }) {
    const [state, setState] = useState(DEFAULT_STATE);
    const [further, setFurther] = useState(false);
    const [mode, setMode] = useBenchMode();
    const [depth, setDepth] = useBenchDepth();
    const [hover, setHover] = useState(null);
    const [last, setLast] = useState('fader:vocal');
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
    const offsetRef = useRef(0);
    const reference = useMemo(() => referenceState(state.song), [state.song]);

    const onSchedule = useCallback((tick) => {
        const g = graphRef.current;
        if (!g) return;
        const dur = tick.beatSec * tick.beatsPerBar;
        for (const id of STEM_IDS) {
            tick.playBuffer(id, tick.barStart, { destination: g.strips[id].inp, offset: offsetRef.current, duration: dur });
        }
        g.schedule(tick.barStart, dur);
    }, []);
    const buildGraph = useCallback((ctx, input, master) => {
        const g = buildDeskGraph(ctx, input, master, SONG);
        graphRef.current = g;
        g.apply(heldRef.current ? referenceState(stateRef.current.song) : stateRef.current);
        return g;
    }, []);
    const audio = useBenchAudio({ files: FILES, bpm: LOOP_BPM, onSchedule, buildGraph });
    const { ctxRef, nodesRef, began, playing, ready, getBuffer } = audio;
    const playingRef = useRef(false);
    playingRef.current = playing;

    // The mp3s carry an encoder delay some decoders keep: if the decoded
    // stem is longer than the loop, play from where the music starts.
    useEffect(() => {
        if (!ready) return;
        const b = getBuffer('vocal');
        if (!b) return;
        const extra = b.length - Math.round(SONG.loopSec * b.sampleRate);
        offsetRef.current = extra > 200 ? Math.min(extra, 1105 * (b.sampleRate / 48000)) / b.sampleRate : 0;
    }, [ready, getBuffer]);

    // Every state change lands on the graph; while the reference is held the
    // graph plays the reference and the state waits.
    useEffect(() => {
        const g = graphRef.current;
        if (g && !heldRef.current) g.apply(state);
    }, [state, began]);
    useEffect(() => {
        const ctx = ctxRef.current;
        const nodes = nodesRef.current;
        if (ctx && nodes) glide(nodes.level.gain, state.level, ctx);
    }, [state.level, began, ctxRef, nodesRef]);

    const touch = (what) => { setLast(what); setAnnounce(null); };
    const chooseDepth = (id) => { setDepth(id); setAnnounce(id); };
    const fader = (id, db) => { setState((s) => setFader(s, id, db)); touch(`fader:${id}`); };
    const panTo = (id, p) => { setState((s) => setPan(s, id, p)); touch(`pan:${id}`); };
    const sendTo = (id, v) => { setState((s) => setSend(s, id, v)); touch(`send:${id}`); };
    const chooseMono = (on) => { setState((s) => setParam(s, { mono: on })); touch('mono'); };
    const choosePreset = (id) => { setState((s) => applyPreset(s, id)); touch('preset'); };
    const holdReference = (on) => {
        heldRef.current = on;
        setHeld(on);
        graphRef.current?.apply(on ? referenceState(stateRef.current.song) : stateRef.current);
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
    const h = useMemo(() => hierarchy(state), [state]);
    const verdict = useMemo(() => band(state), [state]);
    const extra = useMemo(() => maskingExtra(state), [state]);
    const added = useMemo(() => maskingAdded(state), [state]);
    const fight = extra > TOL.maskExtra ? added.worst : null;
    const hRef = useRef(h); hRef.current = h;
    const verdictRef = useRef(verdict); verdictRef.current = verdict;
    const fightRef = useRef(fight); fightRef.current = fight;

    // ---- stage ----
    const canvasRef = useRef(null);
    const geomRef = useRef(null);
    const dragRef = useRef(null);
    const depthRef = useRef(depth);
    depthRef.current = depth;
    const legendRef = useRef(null);
    const legendWRef = useRef(0);
    const frameRef = useRef(0);
    const meterRefs = useRef({});
    const liveRef = useRef(Object.fromEntries(STEM_IDS.map((id) => [id, 0])));
    const barRef = useRef(null);
    const stageOf = (d) => (d === 'core' ? 'plan' : d === 'alevel' ? 'spectrum' : 'ladder');
    const geom = (w, h2, d) => {
        const padL = 30; const padR = 22; const top = 54; const bottom = h2 - 22;
        const base = { w, h: h2, top, bottom, settingY: top - 10 };
        if (d === 'core') return { ...base, plan: { x0: padL, x1: w - padR, top, bottom }, lower: null };
        const gap = 34;
        const planH = Math.round((bottom - top - gap) * 0.5);
        return { ...base, plan: { x0: padL, x1: w - padR, top, bottom: top + planH }, lower: { x0: padL + 30, x1: w - padR, top: top + planH + gap, bottom } };
    };

    useEffect(() => {
        const first = canvasRef.current;
        if (!first) return undefined;
        let raf = 0;
        const css = getComputedStyle(first.parentElement);
        const v = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
        const col = {
            vocal: v('--gen-5', '#dbb170'),
            drums: v('--gen-2', '#7fb0c4'),
            bass: v('--gen-1', '#7fb39b'),
            bvox: v('--gen-4', '#d08fa8'),
            synth: v('--gen-3', '#a395c9'),
            coral: v('--gen-6', '#d08a80'),
            goldBright: v('--gold-bright', '#f0d48a'),
            white: '#ffffff',
            inkSoft: 'rgba(255, 255, 255, 0.62)',
            inkFaint: 'rgba(255, 255, 255, 0.38)',
            grid: 'rgba(255, 255, 255, 0.08)',
            line: 'rgba(255, 255, 255, 0.22)',
        };
        const monoFace = v('--mono', 'monospace');
        const mono = `11.5px ${monoFace}`;
        const monoSmall = `10px ${monoFace}`;
        let weights = null;
        let weightsDb = null;
        let weightsSr = 0;
        const fmtHz = (f) => (f >= 1000 ? `${f / 1000}k` : `${f}`);

        function liveLevels() {
            const g = graphRef.current;
            const ctx = ctxRef.current;
            const out = liveRef.current;
            if (!g || !ctx || !playingRef.current) {
                for (const id of STEM_IDS) out[id] *= 0.9;
                return;
            }
            const first2 = g.strips.vocal.an;
            if (!weights || weightsSr !== ctx.sampleRate) { weights = earWeights(first2.frequencyBinCount, ctx.sampleRate); weightsDb = Float32Array.from(weights, (x) => (x > 0 ? 10 * Math.log10(x) : -60)); weightsSr = ctx.sampleRate; }
            for (const id of STEM_IDS) {
                const s = g.strips[id];
                s.an.getByteFrequencyData(s.freq);
                let acc = 0;
                for (let i = 1; i < s.freq.length; i += 1) {
                    if (!s.freq[i]) continue;
                    const db = -90 + (s.freq[i] / 255) * 80;
                    acc += weights[i] * 10 ** (db / 10);
                }
                const db = 10 * Math.log10(Math.max(acc, 1e-12));
                // -62 dB is silence on this meter, -14 the top of it
                const fill = Math.max(0, Math.min(1, (db + 62) / 48));
                out[id] = fill > out[id] ? fill : out[id] * 0.86 + fill * 0.14;
            }
        }

        function draw() {
            const canvas = canvasRef.current;
            if (!canvas) { raf = requestAnimationFrame(draw); return; }
            const g2 = canvas.getContext('2d');
            const s = stateRef.current;
            const d = depthRef.current;
            const hh = hRef.current;
            const vd = verdictRef.current;
            const fg = fightRef.current;
            const isHeld = heldRef.current;
            const ref = referenceState(s.song);
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
            liveLevels();
            const live = liveRef.current;
            for (const id of STEM_IDS) {
                const el = meterRefs.current[id];
                if (el) el.style.setProperty('--fill', live[id].toFixed(3));
            }
            g2.font = mono; g2.lineWidth = 1;

            // ---- the plan: a lane per part; height is level, a sideways shift
            // is the pan, the base rises with the send ----
            const P = g.plan;
            const pw = P.x1 - P.x0; const ph = P.bottom - P.top;
            const laneW = pw / STEM_IDS.length;
            g2.strokeStyle = col.line; g2.strokeRect(P.x0 + 0.5, P.top + 0.5, pw, ph);
            g2.strokeStyle = col.grid;
            for (let i = 1; i < STEM_IDS.length; i += 1) { const x = Math.round(P.x0 + i * laneW) + 0.5; g2.beginPath(); g2.moveTo(x, P.top); g2.lineTo(x, P.bottom); g2.stroke(); }
            g2.fillStyle = col.inkFaint; g2.font = monoSmall; g2.textAlign = 'left';
            g2.fillText('back', P.x0 + 6, P.top + 12);
            g2.fillText('front', P.x0 + 6, P.bottom - 22);
            const blockW = Math.max(48, Math.min(96, laneW * 0.46));
            const shift = laneW / 2 - blockW / 2 - 6;
            const usable = ph - 40;
            const hOf = (lv) => Math.max(0.05, Math.min(1, (lv + 40) / 40)) * usable + 6;
            const layout = (st) => STEM_IDS.map((id, i) => {
                const lv = stemLevel(st.song, id, st.fader[id]);
                const bh = st.fader[id] <= FLOOR ? 4 : hOf(lv);
                const cx = P.x0 + i * laneW + laneW / 2 + st.pan[id] * shift;
                const base = P.bottom - 18 - st.send[id] * Math.max(0, ph - bh - 30);
                return { id, lv, x: cx - blockW / 2, y: base - bh, w: blockW, h: bh, base, send: st.send[id], cx, laneX: P.x0 + i * laneW };
            });
            const cur = layout(s);
            const blocks = [];
            g2.font = monoSmall;
            for (const b of cur) {
                // the lane's own centre tick and the part's name along the bottom
                g2.strokeStyle = col.line; g2.beginPath(); g2.moveTo(Math.round(b.laneX + laneW / 2) + 0.5, P.bottom - 14); g2.lineTo(Math.round(b.laneX + laneW / 2) + 0.5, P.bottom - 8); g2.stroke();
                g2.fillStyle = col[b.id]; g2.textAlign = 'center';
                g2.fillText(STEMS[b.id].short.toUpperCase(), b.laneX + laneW / 2, P.bottom - 5);
                g2.fillStyle = col.inkFaint; g2.textAlign = 'left'; g2.fillText('L', b.laneX + 5, P.bottom - 5);
                g2.textAlign = 'right'; g2.fillText('R', b.laneX + laneW - 5, P.bottom - 5);
                g2.save();
                g2.globalAlpha = s.fader[b.id] <= FLOOR ? 0.3 : 0.5;
                g2.fillStyle = col[b.id];
                g2.fillRect(b.x, b.y, b.w, b.h);
                g2.globalAlpha = 1;
                g2.strokeStyle = col[b.id]; g2.lineWidth = 1.5;
                g2.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
                // the live meter inside the block
                const mh = live[b.id] * (b.h - 4);
                if (mh > 0.5) { g2.globalAlpha = 0.9; g2.fillRect(b.x + b.w * 0.3, b.base - 2 - mh, b.w * 0.4, mh); g2.globalAlpha = 1; }
                g2.restore();
                blocks.push(b);
            }
            // the reference, only while it is being heard
            if (isHeld) {
                const rb = layout(ref);
                g2.save();
                g2.setLineDash([4, 3]); g2.strokeStyle = col.white; g2.lineWidth = 1.2; g2.globalAlpha = 0.85;
                for (const b of rb) g2.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
                g2.setLineDash([]);
                g2.restore();
            }
            // what is on top, in the plan's corner
            g2.font = monoSmall; g2.textAlign = 'right';
            g2.fillStyle = hh.vocalOnTop ? col.goldBright : col.coral;
            g2.fillText(isHeld ? 'the reference, dashed' : hh.vocalOnTop ? 'vocal on top' : `${STEMS[hh.top].short.toLowerCase()} on top, not the vocal`, P.x1 - 8, P.top + 12);
            const vb = blocks.find((b) => b.id === 'vocal');
            const hx = vb ? vb.x + vb.w / 2 : P.x0; const hy = vb ? vb.y + Math.min(10, vb.h / 2) : P.top;

            // ---- A-level: the spectrum ----
            if (d === 'alevel' && g.lower) {
                const S = g.lower;
                const sw = S.x1 - S.x0; const sh = S.bottom - S.top;
                const fMin = 40; const fMax = 16000;
                const xOfF = (f) => S.x0 + (Math.log(f / fMin) / Math.log(fMax / fMin)) * sw;
                g2.strokeStyle = col.line; g2.beginPath(); g2.moveTo(S.x0, S.bottom + 0.5); g2.lineTo(S.x1, S.bottom + 0.5); g2.stroke();
                g2.strokeStyle = col.grid; g2.fillStyle = col.inkFaint; g2.font = monoSmall; g2.textAlign = 'center';
                for (const f of [50, 100, 200, 500, 1000, 2000, 5000, 10000]) {
                    const x = Math.round(xOfF(f)) + 0.5;
                    g2.beginPath(); g2.moveTo(x, S.top); g2.lineTo(x, S.bottom); g2.stroke();
                    g2.fillText(`${fmtHz(f)}${f === 50 ? ' Hz' : ''}`, x, S.bottom + 13);
                }
                g2.save(); g2.translate(S.x0 - 14, S.top + sh / 2); g2.rotate(-Math.PI / 2); g2.textAlign = 'center'; g2.fillText('louder for the ear', 0, 0); g2.restore();
                // the shared region
                if (fg && fg.bands.length) {
                    const lo = BAND_EDGES[fg.bands[0]]; const hi = BAND_EDGES[fg.bands[fg.bands.length - 1] + 1];
                    g2.fillStyle = col.coral; g2.globalAlpha = 0.14;
                    g2.fillRect(xOfF(lo), S.top, xOfF(hi) - xOfF(lo), sh);
                    g2.globalAlpha = 1;
                    g2.fillStyle = col.coral; g2.textAlign = 'left'; g2.font = mono;
                    g2.fillText(`${STEMS[fg.a].short} and ${STEMS[fg.b].short} share ${bandWords(fg.bands)}`, Math.max(S.x0 + 4, Math.min(xOfF(lo) + 4, S.x1 - 240)), S.top + 12);
                } else {
                    g2.fillStyle = col.inkFaint; g2.textAlign = 'left'; g2.font = mono;
                    g2.fillText('no region shared beyond the release', S.x0 + 4, S.top + 12);
                }
                const gr = graphRef.current;
                const ctx = ctxRef.current;
                const yOfDb = (db) => S.bottom - Math.max(0, Math.min(1, (db + 90) / 80)) * (sh - 4);
                if (gr && ctx && playingRef.current) {
                    const bins = gr.strips.vocal.an.frequencyBinCount;
                    const binHz = ctx.sampleRate / 2 / bins;
                    for (const id of STEM_IDS) {
                        const st = gr.strips[id];
                        g2.strokeStyle = col[id]; g2.lineWidth = 1.5; g2.globalAlpha = id === 'drums' ? 0.55 : 0.95;
                        g2.beginPath();
                        let started = false;
                        for (let i = 1; i < bins; i += 1) {
                            const f = i * binHz;
                            if (f < fMin || f > fMax) continue;
                            const v3 = (st.freq[i - 1] + st.freq[i] + (st.freq[i + 1] || 0)) / 3;
                            const db = -90 + (v3 / 255) * 80 + (weightsDb ? weightsDb[i] : 0);
                            const x = xOfF(f); const y = yOfDb(db);
                            if (!started) { g2.moveTo(x, y); started = true; } else g2.lineTo(x, y);
                        }
                        g2.stroke();
                        g2.globalAlpha = 1; g2.lineWidth = 1;
                    }
                } else {
                    // before Play: the model's bands, so the picture is there first
                    const all = STEM_IDS.map((id) => ({ id, b: bandLevels(s.song, id, s.fader[id]) }));
                    const top = Math.max(...all.flatMap((a) => a.b));
                    for (const { id, b } of all) {
                        if (s.fader[id] <= FLOOR) continue;
                        g2.strokeStyle = col[id]; g2.lineWidth = 1.5; g2.globalAlpha = id === 'drums' ? 0.55 : 0.95;
                        g2.beginPath();
                        b.forEach((db, k) => {
                            const y = yOfDb(db - top - 14);
                            const x0 = xOfF(BAND_EDGES[k]); const x1 = xOfF(BAND_EDGES[k + 1]);
                            if (k === 0) g2.moveTo(x0, y); else g2.lineTo(x0, y);
                            g2.lineTo(x1, y);
                        });
                        g2.stroke();
                        g2.globalAlpha = 1; g2.lineWidth = 1;
                    }
                    g2.fillStyle = col.inkFaint; g2.textAlign = 'right'; g2.font = monoSmall;
                    g2.fillText('press Play for the live spectrum', S.x1 - 4, S.top + 12);
                }
            }

            // ---- Extension: the ladder ----
            if (d === 'extension' && g.lower) {
                const S = g.lower;
                const sw = S.x1 - S.x0 - 300; const sh = S.bottom - S.top;
                const dbMin = -50; const dbMax = 6;
                const xOfDb = (db) => S.x0 + (Math.max(dbMin, Math.min(dbMax, db)) - dbMin) / (dbMax - dbMin) * sw;
                g2.strokeStyle = col.grid; g2.fillStyle = col.inkFaint; g2.font = monoSmall; g2.textAlign = 'center';
                for (const db of [-50, -40, -30, -20, -10, 0]) {
                    const x = Math.round(xOfDb(db)) + 0.5;
                    g2.beginPath(); g2.moveTo(x, S.top + 8); g2.lineTo(x, S.bottom - 12); g2.stroke();
                    g2.fillText(`${db}`, x, S.bottom - 1);
                }
                g2.textAlign = 'left'; g2.fillText('dB, for the ear', S.x0, S.top + 4);
                g2.fillText('file · trim (coral up, blue down) · fader (white) · what you hear', xOfDb(-38), S.top + 4);
                const rowH = (sh - 22) / 5;
                STEM_IDS.forEach((id, i) => {
                    const y = S.top + 14 + i * rowH + rowH / 2;
                    const heard = stemLevel(s.song, id, s.fader[id]);
                    const trim = SONG.supplied[id];
                    const file = heard - trim - s.fader[id];
                    const afterTrim = file + trim;
                    g2.strokeStyle = col.grid; g2.beginPath(); g2.moveTo(S.x0, y + 0.5); g2.lineTo(S.x0 + sw, y + 0.5); g2.stroke();
                    const bar = (a, b, colour, thick) => { g2.strokeStyle = colour; g2.lineWidth = thick; g2.beginPath(); g2.moveTo(xOfDb(a), y); g2.lineTo(xOfDb(b), y); g2.stroke(); g2.lineWidth = 1; };
                    bar(file, afterTrim, trim >= 0 ? col.coral : col.drums, 5);
                    bar(afterTrim, heard, col.white, 3);
                    g2.beginPath(); g2.arc(xOfDb(file), y, 4, 0, Math.PI * 2); g2.fillStyle = '#17172b'; g2.fill(); g2.strokeStyle = col[id]; g2.lineWidth = 1.5; g2.stroke(); g2.lineWidth = 1;
                    g2.beginPath(); g2.arc(xOfDb(heard), y, 4.5, 0, Math.PI * 2); g2.fillStyle = col[id]; g2.fill();
                    g2.fillStyle = col[id]; g2.font = monoSmall; g2.textAlign = 'right'; g2.fillText(STEMS[id].short.toUpperCase(), S.x0 - 6, y + 4);
                    g2.fillStyle = col.inkSoft; g2.textAlign = 'left';
                    g2.fillText(`${fmtDb(file).replace(' dB', '')} · ${fmtDb(trim).replace(' dB', '')} · ${fmtDb(s.fader[id]).replace(' dB', '')} · heard ${fmtDb(heard)}`, S.x0 + sw + 12, y + 4);
                });
            }

            // the setting line, for the depth, stopping short of the legend
            const segs = [`${SONG.bars} bars · five stems`];
            segs.push(isHeld ? 'hearing the reference' : s.presetId ? PRESETS.find((p) => p.id === s.presetId)?.name.toLowerCase() : 'your balance');
            if (s.mono) segs.push('mono');
            if (d !== 'core') segs.push(vd.band === 3 ? 'balanced and blended' : vd.band === 2 ? 'a few misjudgements' : vd.band === 1 ? 'one part off' : 'a part missing');
            if (d === 'extension') segs.push(`trims hidden at unity: ${STEM_IDS.map((id) => `${STEMS[id].short} ${fmtDb(SONG.supplied[id])}`).join(', ')}`);
            g2.fillStyle = col.goldBright; g2.font = mono; g2.textAlign = 'left';
            if (frameRef.current % 20 === 0 && legendRef.current) legendWRef.current = legendRef.current.getBoundingClientRect().width;
            frameRef.current += 1;
            const room = w - 18 - legendWRef.current - 16 - (P.x0 + 6);
            let label = segs.join(' · ');
            while (segs.length > 2 && g2.measureText(label).width > room) { segs.pop(); label = segs.join(' · '); }
            g2.fillText(label, P.x0, g.settingY);

            // the bar counter in the eyebrow
            const gr2 = graphRef.current;
            const frac = playingRef.current && gr2 ? gr2.position() : null;
            if (barRef.current) {
                const txt = ` · bar ${frac == null ? 1 : Math.min(SONG.bars, Math.floor(frac * SONG.bars) + 1)} of ${SONG.bars}`;
                if (barRef.current.textContent !== txt) barRef.current.textContent = txt;
            }

            geomRef.current = { g, blocks, hx, hy, blockW, usable, shift };
            // what this frame drew, told to the DOM for check-bench (laws 18 and 20)
            const faderTag = String(s.fader.vocal);
            if (canvas.dataset.fader !== faderTag) canvas.dataset.fader = faderTag;
            const handle = `${Math.round(hx)}:${Math.round(hy)}`;
            if (canvas.dataset.handle !== handle) canvas.dataset.handle = handle;
            const stageTag = stageOf(d);
            if (canvas.dataset.stage !== stageTag) canvas.dataset.stage = stageTag;
            const bandTag = String(vd.band);
            if (canvas.dataset.band !== bandTag) canvas.dataset.band = bandTag;
            const topTag = hh.top;
            if (canvas.dataset.top !== topTag) canvas.dataset.top = topTag;

            raf = requestAnimationFrame(draw);
        }
        raf = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(raf);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Drag a block: up and down is its fader, left and right is its pan.
    const hitBlock = (px, py) => {
        const gm = geomRef.current;
        if (!gm) return null;
        // front parts sit on top of back ones: test in reverse draw order
        const list = [...gm.blocks].reverse();
        return list.find((b) => px >= b.x && px <= b.x + b.w && py >= b.y - 6 && py <= b.base + 2) || null;
    };
    const onStageDown = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const px = e.clientX - rect.left; const py = e.clientY - rect.top;
        const b = hitBlock(px, py);
        e.currentTarget.dataset.drag = b ? b.id : '';
        if (!b) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        const st = stateRef.current;
        dragRef.current = { id: b.id, x0: px, y0: py, fader0: st.fader[b.id], pan0: st.pan[b.id], moved: null };
    };
    const onStageMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const px = e.clientX - rect.left; const py = e.clientY - rect.top;
        const gm = geomRef.current;
        const dg = dragRef.current;
        if (dg && gm) {
            const dy = dg.y0 - py; const dx = px - dg.x0;
            const dbPerPx = 40 / gm.usable;
            const panPerPx = 1 / gm.shift;
            const nextFader = dg.fader0 + dy * dbPerPx;
            const nextPan = dg.pan0 + dx * panPerPx;
            setState((s) => setPan(setFader(s, dg.id, nextFader), dg.id, nextPan));
            const kind = Math.abs(dx) > Math.abs(dy) * 1.5 ? 'pan' : 'fader';
            if (dg.moved !== kind) { dg.moved = kind; touch(`${kind}:${dg.id}`); }
            return;
        }
        if (!teach) { if (hover) setHover(null); return; }
        const b = hitBlock(px, py);
        if (!b) { if (hover) setHover(null); return; }
        if (hover && hover.id === b.id) return;
        setHover({ id: b.id, x: b.x + b.w / 2, y: b.y, stageW: rect.width, stageH: rect.height });
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
                    <h2>Balance and blend, in the spec&apos;s words</h2>
                    <p>Balance is the level of every part against every other; blend is whether they sit together as one sound. The paper marks both on outcome, by ear, against a reference mix, and the stems it supplies are trimmed to wrong levels on purpose. Everything on this bench is that judgement: what is on top, what is fighting, what is where.</p>
                    <h3>Terms</h3>
                    <dl>
                        <dt>Balance</dt><dd>The relative level of the parts. The exam&apos;s three practical marks: &quot;Balanced and blended across all parts of the mix. Vocals sit on top of mix.&quot;</dd>
                        <dt>Blend</dt><dd>Parts sitting together as one sound rather than as five recordings. Level, pan, frequency and depth all do it.</dd>
                        <dt>Hierarchy</dt><dd>Foreground to background: the lead first, the drums driving under it, the bass present, the pads and backing parts behind. The 2023 report: after the vocals the drums &quot;should be the most important musical element&quot;.</dd>
                        <dt>Masking</dt><dd>One part hiding another because they share a frequency region at a similar level. The shaded region on the A-level stage.</dd>
                        <dt>Making space</dt><dd>Resolving masking without turning everything up: a cut on one part where the other lives, a pan, a part set back.</dd>
                        <dt>Pan</dt><dd>Where a part sits left to right. Lead, bass and kick in the centre; the parts that fight for a region apart.</dd>
                        <dt>Depth</dt><dd>Front to back, made with reverb and delay: the more reverberant a part, the further away it sounds, without getting quieter.</dd>
                        <dt>Send</dt><dd>A copy of a part after its fader into a shared effect. Post-fade on this desk, so the reverb follows the fader.</dd>
                        <dt>Mono-compatible</dt><dd>A mix that still works when left and right are summed: the space a pan bought is spent, and what returns is the masking.</dd>
                        <dt>Stems</dt><dd>The separate parts of a song as audio files. The exam&apos;s are &quot;deliberately mastered at wildly varying volumes&quot;.</dd>
                        <dt>Reference</dt><dd>The mix the examiner marks against; the scheme names its file, &quot;MS q5.wav&quot;. On this desk, hold to hear it.</dd>
                    </dl>
                    <h3>In your DAW</h3>
                    <table>
                        <thead><tr><th>On this bench</th><th>Ableton Live</th><th>Logic Pro</th></tr></thead>
                        <tbody>
                            <tr><td>Fader</td><td>The track&apos;s volume slider in the mixer section</td><td>The channel strip&apos;s fader in the Mixer</td></tr>
                            <tr><td>Pan</td><td>The pan dial above the fader</td><td>The pan knob on the channel strip</td></tr>
                            <tr><td>Send to a shared reverb</td><td>A Return track with a reverb; each track&apos;s Send A dial</td><td>A bus with a reverb on an aux; each channel&apos;s send knob</td></tr>
                            <tr><td>Hold the reference</td><td>Solo a track carrying the reference on the same transport</td><td>Same: a muted reference track you solo to compare</td></tr>
                            <tr><td>Mono</td><td>Utility on the master, Width at 0%</td><td>Gain plug-in on the output, Mono</td></tr>
                        </tbody>
                    </table>
                    <p className={styles.source}>As the controls appear in Live 12 and Logic Pro 11. Check against your own version if they move.</p>
                    <h3>Beyond the paper<span className={styles.ext}>EXT</span></h3>
                    <dl>
                        <dt>Why RMS lies</dt><dd>A meter adds every frequency equally; the ear does not. The low end counts for less, the upper mids for more. A released pop mix has the drums 8 dB over the vocal on a meter and the vocal still on top.</dd>
                        <dt>A fader is not a level</dt><dd>What you hear is the file, plus whatever was done to it before you got it, plus the fader. At unity a fader only says &quot;unchanged&quot;.</dd>
                        <dt>The pan law</dt><dd>A pan is two gains that follow an equal-power curve, so a part holds its level for the ear as it moves across.</dd>
                        <dt>Why panning apart works</dt><dd>The ear separates two sounds in the same region when they come from different places. Nothing gets quieter; the fight stops.</dd>
                    </dl>
                    <p className={styles.source}>The reading behind this bench is the topic&apos;s own Learn chapter and the 1.13 mark schemes, 2017 to 2025.</p>
                </>
            ),
        },
        {
            id: 'teacher',
            label: 'Teacher',
            render: () => (
                <>
                    <h2>What to listen for</h2>
                    <p>Press Play and you hear the five files as the examiner sent them, every fader at unity. Nothing on the desk tells you the bass was mastered loud and the vocal left quiet; only listening does. Hold the reference and hear where the parts belong; let go and hear how far yours are from it. When you can hear a part that is &quot;a touch over&quot; before the stage names it, you are doing what the three practical marks are for.</p>
                    <h3>What cost candidates marks</h3>
                    <p>Every A-level report since 2019 opens Q5 the same way: &quot;The stems are deliberately mastered at wildly varying volumes to ensure that the candidate needed to listen (rather than look at fader positions) to earn credit.&quot;</p>
                    <p>2018: &quot;Mix level of drums was the most common problem, being too quiet. Vocal or keyboard often dominant.&quot; 2020: &quot;Many candidates had a tendency to leave the drums too quiet as in the original audio files.&quot; 2023: &quot;The majority of 2 mark mixes were because the chorus synth was too loud, or the drums too quiet. Candidates failed to recognise the importance of the drums in music of this nature, which after the vocals should be the most important musical element.&quot;</p>
                    <p>2019: &quot;Many candidates had a tendency to leave the bass and backing vocals too loud as on the original CD.&quot; 2022: &quot;Most candidates had a tendency to leave the bass too quiet.&quot; 2024: &quot;most gaining 2 marks due to one part being under or over balanced, most commonly the rhythm guitar was too loud&quot;.</p>
                    <p>2025, the scheme names the trap: the bass supplied at &minus;2 dB peak, &quot;mastered loud as possible&quot;; the acoustic guitar at &minus;6; the vocals quiet at &minus;9. Three marks for &quot;Balanced and blended across all parts of the mix. Vocals sit on top of mix&quot;; two for &quot;Most tracks are balanced with some masking. A few misjudgements, e.g. synth over vocals at start of chorus&quot;; one for &quot;Balanced so that one track is barely audible or is too dominant&quot;; none if not all tracks are present.</p>
                    <p className={styles.source}>Source: Edexcel 9MT0 mark schemes and Principal Examiner reports, 2018 AS Q5(e), 2019 A Q5(f), 2020 A Q5(f), 2022 A Q5(f), 2023 A Q5(g), 2024 A Q5(g), 2025 A Q5(e).</p>
                    <p>Those are the moves on this bench: press <b>As supplied</b> and say which part is on top and which is missing; press <b>Drums too quiet</b> and say what the mix has lost; press <b>As on the CD</b> and hold the reference; press <b>Synth over the vocal</b>, switch to A-level, and read the shaded region.</p>
                    <h3>Do these now</h3>
                    <ul>
                        <li>Press <b>As supplied</b>, play, and balance the five parts by ear before you hold the reference. Then hold it. Say which part you were furthest out on, and whether the fader position would have told you.</li>
                        <li>Press <b>Drums too quiet</b> and write the 2023 sentence in your own words: why the drums, after the vocal, matter most in music like this.</li>
                        <li>Press <b>Synth over the vocal</b>, switch to A-level, and name the region the two share from the stage. Then fix it three ways: the synth&apos;s fader, its pan, its send. Say which one the scheme would call &quot;making space&quot;.</li>
                        <li>Press <b>The reference</b>, open More, and fold the mix to Mono. Then pan the backing vocals and the synth apart, and fold again. Say what mono-compatible means from what you heard.</li>
                        <li>Press <b>Vocal buried</b> and say why one part barely audible costs two of the three marks whatever the rest of the mix does.</li>
                        <li>Switch to Extension and read the ladder for the bass. Say what the fader at unity was actually doing when the file arrived.</li>
                    </ul>
                    <h3>Exam practice</h3>
                    <ExamCallout
                        prompt="Balance the levels of the mix. (3 marks, 2025)"
                        answer="Three: balanced and blended across all parts, vocals on top, the synth blended as on the reference. Two: most tracks balanced with some masking, a few misjudgements such as the synth over the vocals at the start of the chorus. One: one track barely audible or too dominant, or not all of a track present, or erratic level changes. None: no mix, or not all tracks present."
                    />
                    <ExamCallout
                        prompt="What does the examiner listen for in a balanced mix? (AS scheme, 2024)"
                        answer="&quot;Balanced mix: vocals lead; all parts clear; bass present; minimal masking; stable levels.&quot; Five things, each one a fader, a pan or an EQ decision you can point to."
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
                        <b>Cut where the vocal lives</b>
                        <span>The shaded region on the A-level stage is an EQ decision waiting to be made: a cut on the part that matters less, in the region the lead needs.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('stereo')}>
                        <i>1.10 Stereo</i>
                        <b>Space sideways, and the mono check</b>
                        <span>Panning two parts apart relieves masking without a fader moving; folding to mono takes it back. The pan law and mono compatibility are that topic.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('reverb')}>
                        <i>1.12 Reverb</i>
                        <b>Depth is a send</b>
                        <span>The send on every strip feeds one room. More send is further away, not quieter: the fourth of the paper&apos;s tools after level, pan and frequency.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('automation')}>
                        <i>1.8 Automation</i>
                        <b>The fader that moves</b>
                        <span>A balance that is right in the verse is wrong in the chorus. Automation is the fader on this desk given a timeline.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('dynamic-processing')}>
                        <i>1.9 Dynamics</i>
                        <b>Level is not loudness</b>
                        <span>A part that peaks high and sits low for the ear is the compressor&apos;s job; the ladder on the Extension stage is where the two numbers part.</span>
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
    const stripWhy = {
        vocal: 'The lead. The scheme\'s first line on every paper since 2017 is that the vocals sit on top; the 2023 report called it a noticeable improvement when candidates stopped burying them. Centre, and dry enough to stay at the front.',
        drums: 'The drive. Too quiet is the most repeated deduction in nine years of reports; the 2020 scheme wants them equal to the vocal or louder. They share every band with everything, which is why they never count as masking here.',
        bass: 'The foundation. Supplied loud in 2019 and 2025, left too quiet in 2022: the bass is the part candidates misjudge both ways. Centre, for a mono-compatible low end.',
        bvox: 'The support. Left loud "as on the original CD" in 2019, and living in the same region as the lead: the first candidate for a pan apart or a send back.',
        synth: 'The pad. The 2023 chorus synth and the 2025 "synth over vocals at start of chorus" are the same fault: a sustained part in the lead\'s region, left loud. Ease it, pan it, or set it back.',
    };
    const pairText = fight ? `${STEMS[fight.a].short} · ${STEMS[fight.b].short}` : 'none';
    const lineWord = verdict.band === 3 ? 'balanced' : verdict.band === 2 ? 'misjudged' : verdict.band === 1 ? 'one part off' : 'a part missing';

    const consoleSlot = (
        <>
            <PlayColumn
                playing={playing}
                onTogglePlay={togglePlay}
                onHoldDry={holdReference}
                level={state.level}
                onLevel={(v) => setState((s) => ({ ...s, level: v }))}
                teach={teach}
                holdLabel="hold: reference"
                holdTitle="Hold to hear the track as released, on the same beat"
                holdWhy="swaps every fader, pan and send to the reference while you hold it, so you hear how far your balance is from it without losing your place"
                playWhy="runs the four bars round"
            />

            {STEM_IDS.map((id) => (
                <div key={id} className={`${styles.sec} ${styles.secStrip}`} data-teach={teach || undefined} data-stem={id} style={{ '--stem': STEMS[id].colour }}>
                    <div className={styles.secHead}>
                        <span className={styles.stripName}><i aria-hidden="true" />{STEMS[id].short}</span>
                        <span className={styles.value} data-tone={id === 'vocal' && h.vocalOnTop ? 'green' : undefined}>{fmtDb(state.fader[id])}</span>
                    </div>
                    <div className={styles.stripBody}>
                        <Fader
                            label={`${STEMS[id].label} fader`}
                            value={state.fader[id]}
                            min={FADER_MIN}
                            max={FADER_MAX}
                            step={0.5}
                            format={fmtDb}
                            colour={STEMS[id].colour}
                            scale={FADER_SCALE}
                            onChange={(v) => fader(id, v)}
                            title={`${STEMS[id].label}: drag up for louder. The block on the stage is the same fader`}
                        />
                        <div className={styles.meter} ref={(el) => { meterRefs.current[id] = el; }} aria-hidden="true"><i /></div>
                        <div className={styles.stripDials}>
                            <div className={styles.stripDial}>
                                <small>Pan</small>
                                <Dial
                                    label={`${STEMS[id].label} pan`}
                                    value={Math.round(state.pan[id] * 100)}
                                    min={-100}
                                    max={100}
                                    step={5}
                                    size="small"
                                    format={(v2) => fmtPan(v2 / 100)}
                                    pointer={STEMS[id].colour}
                                    pixels={150}
                                    onChange={(v2) => panTo(id, v2 / 100)}
                                    title="Left to right. Drag the block on the stage sideways for the same thing"
                                />
                                <span className={styles.readout}>{fmtPan(state.pan[id])}</span>
                            </div>
                            <div className={styles.stripDial}>
                                <small>Send</small>
                                <Dial
                                    label={`${STEMS[id].label} send`}
                                    value={Math.round(state.send[id] * 100)}
                                    min={0}
                                    max={100}
                                    step={5}
                                    size="small"
                                    format={(v2) => fmtSend(v2 / 100)}
                                    pointer="var(--teal)"
                                    pixels={150}
                                    onChange={(v2) => sendTo(id, v2 / 100)}
                                    title="How much of this part goes to the shared reverb: further back, not quieter"
                                />
                                <span className={styles.readout}>{fmtSend(state.send[id])}</span>
                            </div>
                        </div>
                    </div>
                    <Why>{stripWhy[id]}</Why>
                </div>
            ))}

            <div className={`${styles.sec} ${styles.secHear}`} data-teach={teach || undefined} data-desk="true">
                <div className={styles.secHead}><span className={styles.eyebrow}>What you should hear</span></div>
                <div className={styles.stats} aria-live="polite">
                    <div><b>{STEMS[h.top].short}</b><span>loudest, for the ear</span></div>
                    <div><b>{h.vocalOnTop ? 'yes' : 'no'}</b><span>vocal on top</span></div>
                    <div><b>{pairText}</b><span>{fight ? `share ${bandWords(fight.bands)}` : 'share a region'}</span></div>
                    {maths
                        ? <div><b>{lineWord}</b><span>the scheme&apos;s line{ext ? <span className={styles.ext}>EXT</span> : null}</span></div>
                        : <div><b>{held ? 'reference' : 'yours'}</b><span>what is playing</span></div>}
                </div>
                {teach ? <div className={styles.meaning}>all from the files and the faders, weighted for the ear</div> : null}
                <Legal />
                <Why>Every word here comes from the song&apos;s measured levels and the five strips: which part is loudest for the ear, whether the vocal is on top the way the scheme means it, which two parts share a region beyond what the release shared, and which of the scheme&apos;s lines the balance sits on.</Why>
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
            <span className={styles.eyebrow}>Sum</span>
            <Chips label="Sum" options={MONO_OPTIONS} value={state.mono ? 'mono' : 'stereo'} onChange={(id) => chooseMono(id === 'mono')} />
            <span className={styles.chipNote}>{state.mono ? 'left and right summed: every pan is back in the centre' : 'fold to mono to check the pans have not done the balancing'}</span>
        </div>
    ) : null;

    const stage = (
        <>
            <canvas
                ref={canvasRef}
                aria-label={maths ? (ext ? 'The mix as a plan, and the ladder of what the examiner did to each file' : 'The mix as a plan, and the live spectrum of every part with the shared region marked') : 'The mix as a plan: pan across, level up, depth back'}
                role="img"
                onPointerDown={onStageDown}
                onPointerMove={onStageMove}
                onPointerUp={onStageUp}
                onPointerCancel={onStageUp}
                onPointerLeave={() => { if (!dragRef.current) setHover(null); }}
            />
            <div className={styles.stageNote}>
                <b>{SONG.title} · {SONG.bpm} bpm<span ref={barRef} style={{ '--read': '13ch' }} /></b>
                <span>{ORIENTS[depth] || ORIENTS.core}</span>
            </div>
            <div ref={legendRef} className={`${styles.stageLegend} ${styles.legendTop}`} aria-hidden="true">
                {STEM_IDS.map((id) => <span key={id}><i style={{ background: STEMS[id].colour }} />{STEMS[id].short.toLowerCase()}</span>)}
                <span><i style={{ background: 'transparent', border: '1.5px dashed #fff', borderRadius: 0 }} />reference</span>
                {depth === 'alevel' ? <span><i style={{ background: 'var(--gen-6)', opacity: 0.5 }} />shared</span> : null}
            </div>
            {hover && teach ? (
                <div
                    className={styles.tip}
                    style={{
                        left: Math.max(12, Math.min(hover.stageW - 290, hover.x - 135)),
                        top: Math.max(44, Math.min(hover.stageH - 120, hover.y + 22)),
                    }}
                >
                    <i>{STEMS[hover.id].label} · {fmtDb(state.fader[hover.id])}</i>
                    <p>
                        {cap(deltaWord(delta(state, hover.id)))} for the ear, {fmtPan(state.pan[hover.id]) === 'C' ? 'in the centre' : `panned ${fmtPan(state.pan[hover.id])}`}{state.send[hover.id] > 0.05 ? `, ${Math.round(state.send[hover.id] * 100)}% to the room` : ''}. Drag up or down for the fader, sideways for the pan.
                    </p>
                </div>
            ) : null}
            {!began ? (
                <div className={styles.begin}>
                    <button type="button" className={styles.beginBtn} onClick={() => audio.start()}>
                        <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1.2v9.6L11 6z" fill="currentColor" /></svg>
                        <span>
                            Play the bench
                            <small>Five stems of one song, as the examiner sends them. Headphones help.</small>
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
