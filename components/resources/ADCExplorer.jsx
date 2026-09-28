'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BenchFrame from '@/components/bench/BenchFrame';
import { Dial, Chips, Why, MoreButton } from '@/components/bench/controls';
import { PlayColumn, Presets, Legal, ExamCallout, useBenchMode, useBenchDepth, DEPTHS } from '@/components/bench/BenchBits';
import { useBenchAudio, glide } from '@/components/bench/useBenchAudio';
import styles from '@/components/bench/bench.module.css';
import { memberTopicHref, useStudioArrival } from '@/lib/studio-return';
import { DEPTH_LINES, DEPTH_TEACH, judge, open as openMachine, hearingLine, nextMove } from '@/lib/bench/adc-depth';
import {
    RATES, BITS_MIN, BITS_MAX, DIVS, SOURCE_IDS, SOURCES, FILE_WINDOW_MS, PRESETS, DEFAULT_STATE,
    FILTER_QS, WORKLET_NAME, workletSource, makeConverter, converterDelay, hostStep, qToDb, filterCutoffHz, filterGain, filterRun,
    picture, readings, binaryWord, rateIndex, rateFromPeriod, fmtKhz, fmtHzKhz, fmtLevels,
    applyPreset, setSource, setRateIndex, setRate, setBits, setFilter, setDither, setVolume, nyquist, levels,
} from '@/lib/bench/adc-model';

// The ADC Explorer (2.4), rebuilt 28 Sep 2026 to the Bench Standard from a
// stacked reading page (two tabs, a slider, definition cards to copy). The
// stage is the converter at work on one picture: time across, voltage up,
// the sound going in, the samples taken at the sample rate and rounded to
// the bit depth's levels, and the wave the DAC draws back. Three jobs
// (lib/bench/adc-depth.js): Core shows that picture; A-level adds the
// paper's two numbers beside it (half the rate kept, about 6 dB a bit) and
// the rounding error beneath; Extension opens the converter into its parts
// and prints every sample as the binary word it is stored as.
//
// The sound is the picture: the converter in lib/bench/adc-model.js runs in
// an AudioWorklet (its source is that function's text), after eight biquads
// that are the anti-alias filter, so what is heard at a setting is what the
// stage draws at it. Every source is a real recording, the song first
// (Mike, 28 Sep 2026: the test tone went).

const CODE = '2.4 Digital and Analogue';
const TITLE = 'ADC Explorer';
const FILES = Object.fromEntries(SOURCE_IDS.map((id) => [id, SOURCES[id].file]));
const ORIENTS = {
    core: 'Time runs across, voltage up. Blue is the sound going in; each dot is one sample.',
    alevel: 'Beside the samples, the paper\'s two numbers: the highest frequency kept, and the dynamic range.',
    extension: 'Inside the converter: filter, sample and hold, quantiser, then every sample as a binary word.',
};
const TRIM_MIN_DB = -9;
const TRIM_MAX_DB = 3;
const GOOD_PEAK = 0.45; // a window worth drawing reaches this share of the file's peak

// ---- the graph ------------------------------------------------------------
// input -> [anti-alias: eight biquads | straight through] -> the converter
// (AudioWorklet) -> trim (the level match) -> wet -> master
// input -> delay (the converter's own lag) -> dry -> master   (hold: analogue)
function buildAdcGraph(ctx, input, master) {
    const sr = ctx.sampleRate;
    const lag = converterDelay(sr);
    const aa = FILTER_QS.map((q) => { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = qToDb(q); return f; });
    input.connect(aa[0]);
    for (let i = 1; i < aa.length; i += 1) aa[i - 1].connect(aa[i]);
    const aaOn = ctx.createGain();
    const aaOff = ctx.createGain();
    aaOff.gain.value = 0;
    aa[aa.length - 1].connect(aaOn);
    input.connect(aaOff);
    const into = ctx.createGain();
    aaOn.connect(into);
    aaOff.connect(into);
    const trim = ctx.createGain();
    const wet = ctx.createGain();
    trim.connect(wet);
    wet.connect(master);
    const delay = ctx.createDelay(1);
    delay.delayTime.value = lag / sr;
    const dry = ctx.createGain();
    dry.gain.value = 0;
    input.connect(delay);
    delay.connect(dry);
    dry.connect(master);

    let node = null;
    let pending = null;
    const url = URL.createObjectURL(new Blob([workletSource()], { type: 'application/javascript' }));
    const ready = ctx.audioWorklet.addModule(url).then(() => {
        node = new AudioWorkletNode(ctx, WORKLET_NAME, { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1], channelCount: 1, channelCountMode: 'explicit', channelInterpretation: 'speakers' });
        into.connect(node);
        node.connect(trim);
        node.port.postMessage({ delay: lag });
        if (pending) node.port.postMessage(pending);
    }).catch(() => {}).finally(() => URL.revokeObjectURL(url));

    function set(state) {
        const fc = filterCutoffHz(state.rate, sr);
        const t = ctx.currentTime;
        for (const f of aa) { f.frequency.cancelScheduledValues(t); f.frequency.setTargetAtTime(fc, t, 0.01); }
        glide(aaOn.gain, state.filter ? 1 : 0, ctx, 0.01);
        glide(aaOff.gain, state.filter ? 0 : 1, ctx, 0.01);
        const msg = { P: hostStep(sr, state.rate), bits: state.bits, dither: state.dither };
        pending = msg;
        if (node) node.port.postMessage(msg);
    }
    function setTrim(gain) { glide(trim.gain, gain, ctx, 0.05); }
    function hold(on) { glide(wet.gain, on ? 0 : 1, ctx, 0.01); glide(dry.gain, on ? 1 : 0, ctx, 0.01); }
    function clear() { if (node) node.port.postMessage({ reset: true }); }
    return { set, setTrim, hold, clear, ready, sampleRate: sr };
}

// A buffer's mono mix, cached on the buffer.
function monoOf(buf) {
    if (!buf) return null;
    if (buf.__mono) return buf.__mono;
    const a = buf.getChannelData(0);
    let m = a;
    if (buf.numberOfChannels > 1) {
        const b = buf.getChannelData(1);
        m = new Float32Array(a.length);
        for (let i = 0; i < a.length; i += 1) m[i] = 0.5 * (a[i] + b[i]);
    }
    buf.__mono = m;
    return m;
}
// The loudest 5 ms of a recording (by RMS), cached on the buffer: where
// the picture rests before Play, and what it holds while the playhead is
// somewhere too quiet to show the levels (28 Sep 2026: a 4-bit vocal caught
// in near-silence drew a flat line and an empty error lane).
function loudestOf(buf) {
    if (buf.__loud) return buf.__loud;
    const m = monoOf(buf);
    const sr = buf.sampleRate;
    const n = Math.round(sr * FILE_WINDOW_MS / 1000);
    const hop = Math.round(n / 2);
    let best = 0; let at = 0; let peak = 0;
    for (let i = 0; i < m.length; i += 1) { const a = Math.abs(m[i]); if (a > peak) peak = a; }
    for (let i = Math.round(sr * 0.05); i + n < m.length - Math.round(sr * 0.05); i += hop) {
        let e = 0;
        for (let j = i; j < i + n; j += 1) e += m[j] * m[j];
        if (e > best) { best = e; at = i; }
    }
    buf.__loud = { at: at / sr, peak };
    return buf.__loud;
}
function windowPeak(m, sr, pos) {
    const i0 = Math.max(0, Math.round(pos * sr)); const i1 = Math.min(m.length, i0 + Math.round(sr * FILE_WINDOW_MS / 1000));
    let pk = 0;
    for (let i = i0; i < i1; i += 1) { const a = Math.abs(m[i]); if (a > pk) pk = a; }
    return pk;
}
function interp(arr, x) {
    const i = Math.floor(x);
    if (i < 0) return arr[0] || 0;
    if (i >= arr.length - 1) return arr[arr.length - 1] || 0;
    const f = x - i;
    return arr[i] + (arr[i + 1] - arr[i]) * f;
}
// The converter's output level against its input's, for a stretch of the
// source, so turning a dial changes the sound and not the loudness. The
// same converter the worklet runs; a boost is capped, so what the rounding
// swallows stays swallowed.
function levelMatch(state, getBuffer) {
    const buf = getBuffer(state.source);
    if (!buf) return 1;
    const sr = buf.sampleRate;
    const m = monoOf(buf);
    const from = Math.round(sr * 0.5);
    const x = m.subarray(from, Math.min(m.length, from + Math.round(sr * 1.6)));
    const into = state.filter ? filterRun(x, filterCutoffHz(state.rate, sr), sr) : x;
    const c = makeConverter();
    c.set({ P: hostStep(sr, state.rate), bits: state.bits, dither: state.dither, delay: converterDelay(sr) });
    const y = new Float32Array(into.length);
    c.process(into, y);
    const skip = Math.round(sr * 0.05);
    let si = 0; let so = 0;
    for (let i = skip; i < x.length; i += 1) { si += x[i] * x[i]; so += y[i] * y[i]; }
    if (so <= 0) return 10 ** (TRIM_MAX_DB / 20);
    const db = Math.max(TRIM_MIN_DB, Math.min(TRIM_MAX_DB, 10 * Math.log10(si / so)));
    return 10 ** (db / 20);
}

// ---- the bench ------------------------------------------------------------
export default function ADCExplorer({ back }) {
    const [state, setState] = useState(DEFAULT_STATE);
    const [further, setFurther] = useState(false);
    const [mode, setMode] = useBenchMode();
    const [depth, setDepth] = useBenchDepth();
    const [last, setLast] = useState('preset');
    const [announce, setAnnounce] = useState(null);
    const [held, setHeld] = useState(false);
    const stateRef = useRef(state);
    const { studioOrigin } = useStudioArrival();
    const teach = mode === 'teacher';
    const rd = useMemo(() => readings(state), [state]);
    const rdRef = useRef(rd);

    // ---- audio ----
    const graphRef = useRef(null);
    const passRef = useRef(null);
    const onSchedule = useCallback(({ barStart, playBuffer }) => {
        const s = stateRef.current;
        const node = playBuffer(s.source, barStart, { gain: 1 });
        passRef.current = { start: barStart, dur: node ? node.buffer.duration : 0, source: s.source };
    }, []);
    const buildGraph = useCallback((ctx, input, master) => {
        const g = buildAdcGraph(ctx, input, master);
        graphRef.current = g;
        return g;
    }, []);
    // One bar is one pass of the source, the phrase and its silence.
    const bpm = 240 / SOURCES[state.source].pass;
    const audio = useBenchAudio({ files: FILES, bpm, onSchedule, buildGraph });
    const { ctxRef, nodesRef, began, playing, getBuffer, ready } = audio;
    const playingRef = useRef(false);
    // The draw loop and the handlers read the latest render through refs.
    useEffect(() => { stateRef.current = state; rdRef.current = rd; playingRef.current = playing; });

    // The converter follows the state; the trim follows it a beat later.
    useEffect(() => { graphRef.current?.set(state); }, [state.rate, state.bits, state.filter, state.dither, began]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => {
        const g = graphRef.current;
        if (!g) return undefined;
        const id = window.setTimeout(() => {
            g.setTrim(levelMatch(stateRef.current, getBuffer));
        }, 90);
        return () => window.clearTimeout(id);
    }, [state.source, state.rate, state.bits, state.filter, state.dither, began, ready, getBuffer]);
    useEffect(() => { graphRef.current?.hold(held); }, [held, began]);
    useEffect(() => {
        const ctx = ctxRef.current;
        const nodes = nodesRef.current;
        if (ctx && nodes) glide(nodes.level.gain, state.volume, ctx);
    }, [state.volume, began, ctxRef, nodesRef]);
    // A new source starts a new pass straight away.
    const { restart } = audio;
    useEffect(() => { if (playingRef.current) restart(); }, [state.source]); // eslint-disable-line react-hooks/exhaustive-deps

    const touch = (what) => { setLast(what); setAnnounce(null); };
    const chooseDepth = (id) => { setDepth(id); setAnnounce(id); };
    const chooseSource = (id) => { setState((s) => setSource(s, id)); touch('source'); };
    const chooseRate = (i) => { setState((s) => setRateIndex(s, i)); touch('rate'); };
    const chooseBits = (b) => { setState((s) => setBits(s, b)); touch('bits'); };
    const chooseFilter = (on) => { setState((s) => setFilter(s, on === 'on')); touch('filter'); };
    const chooseDither = (on) => { setState((s) => setDither(s, on === 'on')); touch('dither'); };
    const choosePreset = (id) => { setState((s) => applyPreset(s, id)); touch('preset'); };
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
    const depthRef = useRef(depth);
    const heldRef = useRef(false);
    useEffect(() => { depthRef.current = depth; heldRef.current = held; });
    const geomRef = useRef(null);
    const dragRef = useRef(null);
    const readRef = useRef(null);
    const lastPicRef = useRef(null);
    const zoomRef = useRef(1);
    const stageOf = (d) => (d === 'core' ? 'samples' : d === 'alevel' ? 'nyquist' : 'chain');

    useEffect(() => {
        const first = canvasRef.current;
        if (!first) return undefined;
        let raf = 0;
        const css = getComputedStyle(first.parentElement);
        const v = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
        const col = {
            blue: v('--gen-2', '#7fb0c4'),
            coral: v('--gen-6', '#d08a80'),
            pink: v('--gen-4', '#d08fa8'),
            gold: v('--gold-bright', '#f0d48a'),
            lilac: v('--gen-3', '#a395c9'),
            white: '#ffffff',
            ink: 'rgba(255, 255, 255, 0.86)',
            inkSoft: 'rgba(255, 255, 255, 0.62)',
            inkFaint: 'rgba(255, 255, 255, 0.4)',
            grid: 'rgba(255, 255, 255, 0.07)',
            gridDiv: 'rgba(255, 255, 255, 0.16)',
            gridMid: 'rgba(255, 255, 255, 0.3)',
            line: 'rgba(255, 255, 255, 0.22)',
            level: 'rgba(163, 149, 201, 0.34)',
            screen: 'rgba(0, 0, 0, 0.18)',
            box: 'rgba(255, 255, 255, 0.04)',
        };
        const monoFace = v('--mono', 'monospace');
        const mono = `11.5px ${monoFace}`;
        const monoSmall = `10.5px ${monoFace}`;
        const monoBig = `13px ${monoFace}`;
        const monoHuge = `15px ${monoFace}`;

        // The signal the stage draws: the recording's own samples at the
        // playhead, filtered as the nodes
        // filter them and triggered on a rising zero so it stands still.
        function signalNow(s, sr) {
            const buf = getBuffer(s.source);
            if (!buf) return null;
            const m = monoOf(buf);
            const bsr = buf.sampleRate;
            const ctx = ctxRef.current;
            const pass = passRef.current;
            // Follow the playhead only through moments loud enough to fill the
            // grid; otherwise hold the last one that did, or the loudest.
            const loud = loudestOf(buf);
            let pos = loud.at;
            let live = false;
            const held = lastPicRef.current && lastPicRef.current.source === s.source ? lastPicRef.current : null;
            if (playingRef.current && ctx && pass && pass.source === s.source) {
                const p = ctx.currentTime - pass.start;
                if (p >= 0 && p < pass.dur - 0.05 && windowPeak(m, bsr, p) >= GOOD_PEAK * loud.peak) { pos = p; live = true; }
                else if (held && held.filter === s.filter && held.rate === s.rate) return held.sig;
            }
            const W = FILE_WINDOW_MS;
            const i0 = Math.max(0, Math.round((pos - 0.04) * bsr));
            const i1 = Math.min(m.length, Math.round((pos + W / 1000 + 0.03) * bsr));
            const raw = m.subarray(i0, i1);
            const filt = s.filter ? filterRun(raw, filterCutoffHz(s.rate, sr), bsr) : raw;
            let j = Math.round((pos) * bsr) - i0;
            const lim = Math.min(filt.length - Math.round((W / 1000 + 0.012) * bsr), j + Math.round(0.012 * bsr));
            for (let k = j + 1; k < lim; k += 1) if (filt[k - 1] < 0 && filt[k] >= 0) { j = k; break; }
            const per = bsr / 1000;
            const sig = {
                signal: (t) => interp(filt, j + t * per),
                raw: (t) => interp(raw, j + t * per),
                windowMs: W,
                live,
            };
            lastPicRef.current = { source: s.source, sig, filter: s.filter, rate: s.rate };
            return sig;
        }

        // ---- the time plot: shared by all three levels ----
        function drawPlot(g2, P, s, pic, opts) {
            const { x0, x1, top, bottom } = P;
            const W = x1 - x0;
            const H = bottom - top;
            const mid = (top + bottom) / 2;
            const half = H / 2 - 4;
            const xOf = (t) => x0 + (t / pic.windowMs) * W;
            const zm = pic.zoom || 1;
            const yOf = (val) => mid - Math.max(-1.08, Math.min(1.08, val * zm)) * half;
            // the screen: five divisions across, the full scale up
            g2.fillStyle = col.screen; g2.fillRect(x0, top, W, H);
            for (let i = 0; i <= DIVS; i += 1) {
                const x = Math.round(x0 + (i / DIVS) * W) + 0.5;
                g2.strokeStyle = col.gridDiv; g2.lineWidth = 1;
                g2.beginPath(); g2.moveTo(x, top); g2.lineTo(x, bottom); g2.stroke();
            }
            // the levels: every code the bit depth allows, drawn when they are
            // far enough apart to see
            const step = 1 / 2 ** (s.bits - 1);
            const gap = step * zm * half;
            if (gap >= 3.2) {
                g2.strokeStyle = col.level;
                const n = 2 ** (s.bits - 1);
                const reach = Math.ceil(1.08 / (step * zm));
                for (let c = Math.max(-n, -reach); c <= Math.min(n - 1, reach); c += 1) {
                    const y = Math.round(yOf(c * step)) + 0.5;
                    g2.beginPath(); g2.moveTo(x0, y); g2.lineTo(x1, y); g2.stroke();
                }
            }
            g2.strokeStyle = col.gridMid;
            g2.beginPath(); g2.moveTo(x0, Math.round(mid) + 0.5); g2.lineTo(x1, Math.round(mid) + 0.5); g2.stroke();
            g2.strokeStyle = col.line; g2.strokeRect(x0 + 0.5, top + 0.5, W - 1, H - 1);
            // axes, named on the stage
            g2.font = monoSmall; g2.fillStyle = col.inkFaint; g2.textAlign = 'center';
            const divMs = pic.windowMs / DIVS;
            if (!opts.compact) for (let i = 1; i <= DIVS; i += 1) g2.fillText(fmtMsShort(i * divMs), x0 + (i / DIVS) * W, bottom + 13);
            else g2.fillText(`${fmtMsShort(pic.windowMs)} ms`, x1 - 14, bottom + 13);
            g2.textAlign = 'left'; g2.fillStyle = col.inkSoft;
            g2.fillText('Time (ms) →', x0 + 2, bottom + (opts.narrow ? 27 : 13));
            g2.save(); g2.translate(x0 - 38, mid); g2.rotate(-Math.PI / 2); g2.textAlign = 'center'; g2.fillText('Voltage', 0, 0); g2.restore();
            g2.textAlign = 'right'; g2.fillStyle = col.inkFaint;
            g2.fillText('+', x0 - 6, mid - half + 4); g2.fillText('0', x0 - 6, mid + 4); g2.fillText('−', x0 - 6, mid + half + 4);
            if (zm > 1) { g2.textAlign = 'left'; g2.fillStyle = col.inkSoft; g2.fillText(`zoomed ×${zm} to fit`, x0 + 6, bottom - 8); }
            if (opts.axes) {
                // Sample rate lives on the time axis, bit depth on the voltage
                // axis: each axis in its dial's colour, with its dial's number,
                // because the two are the pair candidates swap.
                g2.lineWidth = 2;
                g2.strokeStyle = col.gold; g2.beginPath(); g2.moveTo(x0, bottom + 0.5); g2.lineTo(x1, bottom + 0.5); g2.stroke();
                g2.strokeStyle = col.lilac; g2.beginPath(); g2.moveTo(x0 - 0.5, top); g2.lineTo(x0 - 0.5, bottom); g2.stroke();
                g2.lineWidth = 1;
                const tag = `bit depth ${s.bits} ↕ 2${sup(s.bits)} = ${fmtLevels(s.bits)} levels${gap < 3.2 ? ', too fine to draw' : ''}`;
                g2.font = mono; g2.textAlign = 'right';
                const tw = g2.measureText(tag).width;
                const tx = gap >= 6 ? x1 - 30 : x1 - 8; // clear of the step bracket
                g2.fillStyle = 'rgba(23, 23, 43, 0.82)'; g2.fillRect(tx - tw - 6, bottom - 22, tw + 12, 18);
                g2.fillStyle = col.lilac; g2.fillText(tag, tx, bottom - 9);
                g2.font = monoSmall;
            } else if (gap < 3.2 && !opts.compact && !opts.narrow) {
                g2.textAlign = 'right'; g2.fillStyle = col.lilac;
                g2.fillText(`${fmtLevels(s.bits)} levels: too fine to draw here`, x1 - 8, bottom - 8);
            } else if (!opts.compact && !opts.narrow) {
                g2.textAlign = 'right'; g2.fillStyle = col.lilac;
                g2.fillText(`${levels(s.bits)} levels`, x1 - 8, bottom - 8);
            }

            g2.save();
            g2.beginPath(); g2.rect(x0, top - 2, W, H + 4); g2.clip();
            // the wave before the filter, where the filter changed it
            if (pic.before && beforeShown(s)) {
                {
                    g2.strokeStyle = col.blue; g2.globalAlpha = 0.4; g2.setLineDash([4, 4]); g2.lineWidth = 1.2;
                    g2.beginPath();
                    pic.before.forEach((val, i) => { const x = x0 + (i / (pic.before.length - 1)) * W; if (i === 0) g2.moveTo(x, yOf(val)); else g2.lineTo(x, yOf(val)); });
                    g2.stroke(); g2.setLineDash([]); g2.globalAlpha = 1;
                    opts.legend.before = true;
                }
            }
            // the analogue wave going in
            g2.strokeStyle = col.blue; g2.lineWidth = 4; g2.lineJoin = 'round';
            g2.beginPath();
            pic.line.forEach((val, i) => { const x = x0 + (i / (pic.line.length - 1)) * W; if (i === 0) g2.moveTo(x, yOf(val)); else g2.lineTo(x, yOf(val)); });
            g2.stroke();
            // sample and hold: each stored level held until the next sample
            const inside = pic.inside;
            const T = 1 / s.rate;
            const spacing = (T / pic.windowMs) * W;
            if (opts.stair !== false) {
                g2.strokeStyle = 'rgba(255, 255, 255, 0.34)'; g2.lineWidth = 1;
                g2.beginPath();
                inside.forEach((sm, i) => {
                    const x = xOf(sm.t); const xe = xOf(sm.t + T); const y = yOf(sm.q);
                    if (i === 0) g2.moveTo(x, y); else g2.lineTo(x, y);
                    g2.lineTo(xe, y);
                });
                g2.stroke();
            }
            // the DAC's wave back, drawn over the blue: where it matches, the
            // blue shows as its edges
            g2.strokeStyle = col.gold; g2.lineWidth = 1.8;
            g2.beginPath();
            pic.back.forEach((val, i) => { const x = x0 + (i / (pic.back.length - 1)) * W; if (i === 0) g2.moveTo(x, yOf(val)); else g2.lineTo(x, yOf(val)); });
            g2.stroke();
            // the samples: the dot is the stored level; a tick joins it to the true voltage
            const r = spacing > 16 ? 4.2 : spacing > 7 ? 3.2 : spacing > 3.5 ? 2.2 : 1.5;
            inside.forEach((sm) => {
                const x = xOf(sm.t); const yv = yOf(sm.v); const yq = yOf(sm.q);
                if (Math.abs(yv - yq) > 1.5 && spacing > 3.5) {
                    g2.strokeStyle = col.pink; g2.lineWidth = 1.5;
                    g2.beginPath(); g2.moveTo(x, yv); g2.lineTo(x, yq); g2.stroke();
                }
                g2.fillStyle = col.white;
                g2.beginPath(); g2.arc(x, yq, r, 0, Math.PI * 2); g2.fill();
            });
            if (opts.numbers) {
                g2.font = monoSmall; g2.fillStyle = col.inkSoft; g2.textAlign = 'center';
                inside.slice(0, opts.numbers).forEach((sm, i) => { const x = xOf(sm.t); const y = yOf(sm.q); g2.fillText(`${i + 1}`, x, y + (sm.q >= 0 ? -9 : 17)); });
            }
            g2.restore();

            // the sample period, bracketed and draggable (Core and A-level)
            let handle = null;
            if (opts.bracket && inside.length >= 2) {
                const bx0 = xOf(0); const bx1 = xOf(T); const by = top + 12;
                g2.strokeStyle = col.gold; g2.lineWidth = 1.5;
                g2.beginPath(); g2.moveTo(bx0, by - 5); g2.lineTo(bx0, by + 5); g2.moveTo(bx0, by); g2.lineTo(bx1, by); g2.moveTo(bx1, by - 5); g2.lineTo(bx1, by + 5); g2.stroke();
                const hot = dragRef.current != null;
                g2.beginPath(); g2.arc(bx1, by, hot ? 7 : 5.5, 0, Math.PI * 2); g2.fillStyle = col.gold; g2.fill(); g2.strokeStyle = '#17172b'; g2.lineWidth = 1.5; g2.stroke(); g2.lineWidth = 1;
                g2.font = mono; g2.fillStyle = col.gold; g2.textAlign = 'left';
                const btxt = opts.axes
                    ? `sample rate ${fmtKhz(s.rate)} ↔ a sample every ${fmtMsShort(T)} ms`
                    : `one sample: ${fmtMsShort(T)} ms`;
                const bw = g2.measureText(btxt).width;
                if (opts.axes) { g2.fillStyle = 'rgba(23, 23, 43, 0.82)'; g2.fillRect(bx1 + 6, by - 9, bw + 8, 18); g2.fillStyle = col.gold; }
                g2.fillText(btxt, bx1 + 10, by + 4);
                handle = { x: bx1, y: by, x0: bx0 };
            }
            // one step (A-level), bracketed below the centre line at the right,
            // drawn last so the wave never covers it
            if (opts.axes && gap >= 6) {
                const sx = x1 - 12; const y0 = yOf(0); const y1 = yOf(-step);
                g2.strokeStyle = col.lilac; g2.lineWidth = 2;
                g2.beginPath(); g2.moveTo(sx - 5, y0); g2.lineTo(sx + 5, y0); g2.moveTo(sx, y0); g2.lineTo(sx, y1); g2.moveTo(sx - 5, y1); g2.lineTo(sx + 5, y1); g2.stroke(); g2.lineWidth = 1;
                g2.font = mono; g2.textAlign = 'right';
                const lw = g2.measureText('one step').width; const ly2 = (y0 + y1) / 2;
                g2.fillStyle = 'rgba(23, 23, 43, 0.9)'; g2.fillRect(sx - lw - 14, ly2 - 9, lw + 8, 17);
                g2.fillStyle = col.lilac; g2.fillText('one step', sx - 10, ly2 + 4);
            }
            return { xOf, yOf, handle, half, mid };
        }

        // ---- A-level: the paper's two numbers, beside the plot ----
        function drawNumbers(g2, R, s, rdd) {
            const { x0, x1, top, bottom } = R;
            const W = x1 - x0;
            const hB = Math.max(72, Math.min(96, Math.round((bottom - top) * 0.4)));
            // (1) the frequency line: 0 to the rate, half of it marked, the
            // source's top band on it: kept, cut by the filter, or folding
            const A = { top, bottom: bottom - hB - 8 };
            g2.strokeStyle = col.line; g2.strokeRect(x0 + 0.5, A.top + 0.5, W - 1, A.bottom - A.top - 1);
            g2.font = monoSmall; g2.fillStyle = col.gold; g2.textAlign = 'left';
            g2.fillText('SAMPLE RATE → HIGHEST FREQUENCY KEPT', x0 + 10, A.top + 16);
            const maxK = Math.max(s.rate, 22);
            const lx0 = x0 + 18; const lx1 = x1 - 18;
            const ly = Math.round(Math.max(A.top + 64, Math.min(A.bottom - 36, A.top + (A.bottom - A.top) * 0.66)));
            const xk = (k) => lx0 + (Math.min(k, maxK) / maxK) * (lx1 - lx0);
            const ny = nyquist(s.rate);
            const band = Math.max(12, Math.min(26, ly - A.top - 44));
            g2.fillStyle = 'rgba(127, 176, 196, 0.16)'; g2.fillRect(xk(0), ly - band, xk(ny) - xk(0), band);
            g2.fillStyle = col.blue; g2.textAlign = 'center'; g2.font = monoSmall;
            if (xk(ny) - xk(0) > 44) g2.fillText('kept', (xk(0) + xk(ny)) / 2, ly - band - 5);
            if (ny < 20 && s.filter) {
                g2.fillStyle = 'rgba(208, 138, 128, 0.18)'; g2.fillRect(xk(ny), ly - band, xk(20) - xk(ny), band);
                g2.fillStyle = col.coral; g2.fillText('cut', (xk(ny) + xk(20)) / 2, ly - band - 5);
            }
            // the source's top band, as a bar on the line
            const sb = rdd.band;
            g2.fillStyle = col.blue; g2.globalAlpha = 0.85;
            g2.fillRect(xk(sb.lo), ly - 7, xk(sb.hi) - xk(sb.lo), 6); g2.globalAlpha = 1;
            if (rdd.fold) {
                // folding: the part above half the rate lands back below it
                const xf = (xk(Math.max(sb.lo, ny)) + xk(sb.hi)) / 2;
                const xa0 = xk(rdd.fold.lo); const xa1 = xk(rdd.fold.hi);
                g2.fillStyle = col.coral; g2.fillRect(xa0, ly - 7, Math.max(2, xa1 - xa0), 6);
                const xa = (xa0 + xa1) / 2;
                g2.strokeStyle = col.coral; g2.lineWidth = 1.5;
                const apex = Math.max(A.top + 26, ly - band - 16);
                g2.beginPath(); g2.moveTo(xf, ly - 10); g2.quadraticCurveTo((xf + xa) / 2, 2 * apex - (ly - 10), xa, ly - 10); g2.stroke(); g2.lineWidth = 1;
                g2.fillStyle = col.coral; g2.beginPath(); g2.moveTo(xa, ly - 8); g2.lineTo(xa - 5, ly - 17); g2.lineTo(xa + 5, ly - 17); g2.fill();
            }
            g2.strokeStyle = col.inkSoft; g2.beginPath(); g2.moveTo(lx0, ly + 0.5); g2.lineTo(lx1, ly + 0.5); g2.stroke();
            g2.strokeStyle = col.gold; g2.lineWidth = 2; g2.beginPath(); g2.moveTo(xk(ny), ly - band - 4); g2.lineTo(xk(ny), ly + 4); g2.stroke(); g2.lineWidth = 1;
            // row one under the line: 0, half the rate, the rate
            g2.font = monoSmall; g2.fillStyle = col.inkFaint;
            g2.textAlign = 'left'; g2.fillText('0', lx0 - 3, ly + 14);
            const halfTxt = `half: ${fmtKhz(ny)}`;
            const hw = g2.measureText(halfTxt).width;
            const hx = Math.max(lx0 + 12 + hw / 2, Math.min(lx1 - hw / 2 - 40, xk(ny)));
            if (xk(s.rate) - (hx + hw / 2) > 36 && s.rate <= maxK) { g2.textAlign = 'right'; g2.fillText(fmtKhz(s.rate), Math.min(lx1 + 3, xk(s.rate) + 12), ly + 14); }
            g2.fillStyle = col.gold; g2.textAlign = 'center'; g2.fillText(halfTxt, hx, ly + 14);
            // row two: what the band is, and where it went
            g2.textAlign = 'left'; g2.fillStyle = col.blue;
            const what = rdd.fold ? `${sb.name}, ${sb.lo} to ${sb.hi} kHz: fold to ${rdd.fold.lo < 0.1 ? 0 : fmtHzKhz(rdd.fold.lo).replace(' kHz', '')} to ${fmtHzKhz(rdd.fold.hi)}` : `${sb.name}, ${sb.lo} to ${sb.hi} kHz: ${sb.hi <= ny ? 'kept' : sb.lo < ny ? `cut above ${fmtKhz(ny)}` : 'cut by the filter'}`;
            g2.fillStyle = rdd.fold ? col.coral : col.blue; g2.fillText(what, lx0 - 3, ly + 29);
            // (2) the levels and the range: n bits, 2^n levels, about 6 dB a bit
            const B = { top: bottom - hB, bottom };
            g2.strokeStyle = col.line; g2.strokeRect(x0 + 0.5, B.top + 0.5, W - 1, B.bottom - B.top - 1);
            g2.font = monoSmall; g2.fillStyle = col.lilac; g2.textAlign = 'left';
            g2.fillText('BIT DEPTH → DYNAMIC RANGE', x0 + 10, B.top + 16);
            g2.font = monoBig; g2.fillStyle = col.ink;
            g2.fillText(`2${sup(s.bits)} = ${fmtLevels(s.bits)} levels`, x0 + 10, B.top + 36);
            const bx0 = x0 + 12; const bx1 = x1 - 14; const byy = B.bottom - 20;
            const xd = (db) => bx0 + (db / 144) * (bx1 - bx0);
            g2.fillStyle = 'rgba(163, 149, 201, 0.22)'; g2.fillRect(bx0, byy - 9, bx1 - bx0, 9);
            g2.fillStyle = col.lilac; g2.fillRect(bx0, byy - 9, xd(rdd.dynamicRange) - bx0, 9);
            g2.font = monoSmall; g2.textAlign = 'center';
            for (const [db, name] of [[48, '8 bit'], [96, '16'], [144, '24']]) {
                g2.strokeStyle = col.inkFaint; g2.beginPath(); g2.moveTo(xd(db) + 0.5, byy - 12); g2.lineTo(xd(db) + 0.5, byy + 2); g2.stroke();
                g2.fillStyle = col.inkFaint; g2.fillText(name, Math.min(bx1 - 10, xd(db)), byy + 13);
            }
            g2.textAlign = 'right'; g2.fillStyle = col.lilac; g2.font = monoBig;
            g2.fillText(`${s.bits} × 6 ≈ ${rdd.dynamicRange} dB`, x1 - 10, B.top + 16);
        }

        // ---- A-level: the rounding error, beneath the plot ----
        function drawError(g2, E, s, pic, plot) {
            const { x0, x1, top, bottom } = E;
            const mid = (top + bottom) / 2;
            const halfH = (bottom - top) / 2 - 4;
            const halfStep = 0.5 / 2 ** (s.bits - 1);
            g2.fillStyle = col.screen; g2.fillRect(x0, top, x1 - x0, bottom - top);
            g2.strokeStyle = col.line; g2.strokeRect(x0 + 0.5, top + 0.5, x1 - x0 - 1, bottom - top - 1);
            g2.strokeStyle = col.pink; g2.globalAlpha = 0.5; g2.setLineDash([3, 3]);
            for (const y of [mid - halfH * 0.8, mid + halfH * 0.8]) { g2.beginPath(); g2.moveTo(x0, Math.round(y) + 0.5); g2.lineTo(x1, Math.round(y) + 0.5); g2.stroke(); }
            g2.setLineDash([]); g2.globalAlpha = 1;
            g2.strokeStyle = col.gridMid; g2.beginPath(); g2.moveTo(x0, Math.round(mid) + 0.5); g2.lineTo(x1, Math.round(mid) + 0.5); g2.stroke();
            const spacing = ((1 / s.rate) / pic.windowMs) * (x1 - x0);
            g2.fillStyle = col.pink;
            pic.inside.forEach((sm) => {
                const e = (sm.v - sm.q) / halfStep; // -1..1
                const x = plot.xOf(sm.t);
                const h = e * halfH * 0.8;
                const bw = Math.max(1.5, Math.min(6, spacing * 0.5));
                g2.fillRect(x - bw / 2, Math.min(mid, mid - h), bw, Math.max(1, Math.abs(h)));
            });
            g2.font = monoSmall; g2.textAlign = 'right'; g2.fillStyle = col.pink;
            g2.fillText('ROUNDING ERROR: never more than half a step', x1, top - 5);
        }

        // ---- Extension: the converter opened, and the words it stores ----
        function drawChain(g2, R, s, pic, rdd, sr) {
            const { x0, x1, top, bottom } = R;
            const names = ['ANTI-ALIAS FILTER', 'SAMPLE AND HOLD', 'QUANTISER', 'BINARY WORDS', 'DAC'];
            const gapX = 26;
            const bw = (x1 - x0 - gapX * 4) / 5;
            const boxes = names.map((nm, i) => ({ nm, x0: x0 + i * (bw + gapX), x1: x0 + i * (bw + gapX) + bw, top, bottom }));
            boxes.forEach((b, i) => {
                g2.fillStyle = col.box; g2.fillRect(b.x0, b.top, bw, b.bottom - b.top);
                g2.strokeStyle = i === 0 && !s.filter ? col.coral : col.line; g2.setLineDash(i === 0 && !s.filter ? [4, 3] : []);
                g2.strokeRect(b.x0 + 0.5, b.top + 0.5, bw - 1, b.bottom - b.top - 1); g2.setLineDash([]);
                g2.font = monoSmall; g2.fillStyle = col.gold; g2.textAlign = 'left';
                g2.fillText(b.nm, b.x0 + 8, b.top + 15);
                if (i < 4) {
                    const ax = b.x1 + 4; const ay = (b.top + b.bottom) / 2;
                    g2.strokeStyle = col.inkSoft; g2.lineWidth = 1.5;
                    g2.beginPath(); g2.moveTo(ax, ay); g2.lineTo(ax + gapX - 8, ay); g2.stroke();
                    g2.beginPath(); g2.moveTo(ax + gapX - 8, ay); g2.lineTo(ax + gapX - 14, ay - 4); g2.moveTo(ax + gapX - 8, ay); g2.lineTo(ax + gapX - 14, ay + 4); g2.stroke(); g2.lineWidth = 1;
                }
            });
            const inner = (b) => ({ x0: b.x0 + 8, x1: b.x1 - 8, top: b.top + 24, bottom: b.bottom - 20 });
            // 1: the filter's curve over 0 .. the rate, the source's top band shaded
            {
                const I = inner(boxes[0]);
                const maxK = Math.max(s.rate, rdd.band.hi * 1.1, 4);
                const xk = (k) => I.x0 + (k / maxK) * (I.x1 - I.x0);
                const yg = (gv) => I.bottom - gv * (I.bottom - I.top);
                g2.strokeStyle = col.gridDiv; g2.beginPath(); g2.moveTo(I.x0, I.bottom + 0.5); g2.lineTo(I.x1, I.bottom + 0.5); g2.stroke();
                const ny = nyquist(s.rate);
                g2.strokeStyle = col.gold; g2.setLineDash([2, 3]); g2.beginPath(); g2.moveTo(xk(ny), I.top); g2.lineTo(xk(ny), I.bottom); g2.stroke(); g2.setLineDash([]);
                g2.strokeStyle = s.filter ? col.ink : col.coral; g2.lineWidth = 1.8; g2.beginPath();
                for (let i = 0; i <= 60; i += 1) { const k = (i / 60) * maxK; const gv = s.filter ? filterGain(k, s.rate, sr) : 1; if (i === 0) g2.moveTo(xk(k), yg(gv)); else g2.lineTo(xk(k), yg(gv)); }
                g2.stroke(); g2.lineWidth = 1;
                g2.fillStyle = col.blue; g2.globalAlpha = 0.3; g2.fillRect(xk(rdd.band.lo), I.top, xk(rdd.band.hi) - xk(rdd.band.lo), I.bottom - I.top); g2.globalAlpha = 1;
                g2.font = monoSmall; g2.fillStyle = s.filter ? col.inkFaint : col.coral; g2.textAlign = 'left';
                g2.fillText(s.filter ? `cuts at ${fmtHzKhz(filterCutoffHz(s.rate, sr) / 1000)}` : 'off: all passes', I.x0, boxes[0].bottom - 6);
            }
            // 2-5: the first samples of the window, held, rounded, written, drawn back
            const n = Math.min(pic.inside.length, 10);
            const first = pic.inside.slice(0, n);
            const span = first.length > 1 ? first[first.length - 1].t + 1 / s.rate : 1 / s.rate;
            const mini = (b, fn) => {
                const I = inner(b);
                const xt = (t) => I.x0 + (t / span) * (I.x1 - I.x0);
                const mid = (I.top + I.bottom) / 2; const hh = (I.bottom - I.top) / 2;
                const yv = (val) => mid - Math.max(-1.1, Math.min(1.1, val * (pic.zoom || 1))) * hh;
                g2.strokeStyle = col.gridDiv; g2.beginPath(); g2.moveTo(I.x0, Math.round(mid) + 0.5); g2.lineTo(I.x1, Math.round(mid) + 0.5); g2.stroke();
                g2.save(); g2.beginPath(); g2.rect(I.x0 - 4, I.top - 4, I.x1 - I.x0 + 8, I.bottom - I.top + 8); g2.clip();
                fn(I, xt, yv);
                g2.restore();
            };
            mini(boxes[1], (I, xt, yv) => {
                g2.strokeStyle = col.blue; g2.globalAlpha = 0.5; g2.lineWidth = 1; g2.beginPath();
                const pts = 80;
                for (let i = 0; i <= pts; i += 1) { const t = (i / pts) * span; const idx = Math.min(pic.line.length - 1, Math.round((t / pic.windowMs) * (pic.line.length - 1))); if (i === 0) g2.moveTo(xt(t), yv(pic.line[idx])); else g2.lineTo(xt(t), yv(pic.line[idx])); }
                g2.stroke(); g2.globalAlpha = 1;
                g2.strokeStyle = col.white; g2.lineWidth = 1.5; g2.beginPath();
                first.forEach((sm, i) => { const x = xt(sm.t); const y = yv(sm.v); if (i === 0) g2.moveTo(x, y); else g2.lineTo(x, y); g2.lineTo(xt(sm.t + 1 / s.rate), y); });
                g2.stroke(); g2.lineWidth = 1;
            });
            mini(boxes[2], (I, xt, yv) => {
                const step = 1 / 2 ** (s.bits - 1);
                if (step * ((I.bottom - I.top) / 2) >= 3) {
                    g2.strokeStyle = col.level; const nn = 2 ** (s.bits - 1);
                    for (let c = -nn; c < nn; c += 1) { const y = Math.round(yv(c * step)) + 0.5; g2.beginPath(); g2.moveTo(I.x0, y); g2.lineTo(I.x1, y); g2.stroke(); }
                }
                g2.fillStyle = col.white;
                first.forEach((sm) => { g2.beginPath(); g2.arc(xt(sm.t), yv(sm.q), 2.6, 0, Math.PI * 2); g2.fill(); });
            });
            {
                const b = boxes[3]; const I = inner(b);
                g2.font = monoSmall; g2.fillStyle = col.ink; g2.textAlign = 'left';
                const rows = Math.max(1, Math.floor((I.bottom - I.top + 10) / 14));
                first.slice(0, rows).forEach((sm, i) => {
                    let w = binaryWord(sm.code, s.bits);
                    while (g2.measureText(w).width > I.x1 - I.x0 && w.length > 4) w = `…${w.slice(-(w.length - 2))}`;
                    g2.fillText(w, I.x0, I.top + 8 + i * 14);
                });
            }
            mini(boxes[4], (I, xt, yv) => {
                g2.strokeStyle = col.gold; g2.lineWidth = 1.8; g2.beginPath();
                const pts = 80;
                for (let i = 0; i <= pts; i += 1) { const t = (i / pts) * span; const idx = Math.min(pic.back.length - 1, Math.round((t / pic.windowMs) * (pic.back.length - 1))); if (i === 0) g2.moveTo(xt(t), yv(pic.back[idx])); else g2.lineTo(xt(t), yv(pic.back[idx])); }
                g2.stroke(); g2.lineWidth = 1;
                g2.fillStyle = col.white;
                first.forEach((sm) => { g2.beginPath(); g2.arc(xt(sm.t), yv(sm.q), 2, 0, Math.PI * 2); g2.fill(); });
            });
            g2.font = monoSmall; g2.fillStyle = col.inkFaint; g2.textAlign = 'left';
            g2.fillText(`${fmtKhz(s.rate)}: a sample every ${fmtMsShort(1 / s.rate)} ms`, boxes[1].x0 + 8, boxes[1].bottom - 6);
            g2.fillText(`${fmtLevels(s.bits)} levels`, boxes[2].x0 + 8, boxes[2].bottom - 6);
            g2.fillText(`${s.bits} bits a word`, boxes[3].x0 + 8, boxes[3].bottom - 6);
            g2.fillText('back to a voltage', boxes[4].x0 + 8, boxes[4].bottom - 6);
        }
        function drawWords(g2, R, s, pic) {
            const { x0, x1, top, bottom } = R;
            g2.strokeStyle = col.line; g2.strokeRect(x0 + 0.5, top + 0.5, x1 - x0 - 1, bottom - top - 1);
            const cols = { n: x0 + 12, v: x0 + 38, c: x0 + 112, w: x0 + 184 };
            g2.font = monoSmall; g2.textAlign = 'left';
            g2.fillStyle = col.inkFaint;
            g2.fillText('#', cols.n, top + 17); g2.fillText('voltage', cols.v, top + 17); g2.fillText('code', cols.c, top + 17);
            g2.fillStyle = col.gold; g2.fillText(`STORED AS ${s.bits} BITS`, cols.w, top + 17);
            const rowH = 17;
            const rows = Math.max(1, Math.min(8, Math.floor((bottom - top - 44) / rowH)));
            g2.font = mono;
            pic.inside.slice(0, rows).forEach((sm, i) => {
                const y = top + 38 + i * rowH;
                g2.fillStyle = col.inkSoft; g2.fillText(`${i + 1}`, cols.n, y);
                const vt = Math.abs(sm.v) < 0.0005 ? ' 0.000' : `${sm.v > 0 ? '+' : '−'}${Math.abs(sm.v).toFixed(3)}`;
                g2.fillStyle = col.blue; g2.fillText(vt, cols.v, y);
                g2.fillStyle = col.ink; g2.fillText(`${sm.code}`, cols.c, y);
                let wd = binaryWord(sm.code, s.bits);
                const room = x1 - 10 - cols.w;
                while (g2.measureText(wd).width > room && wd.length > 4) wd = `…${wd.slice(2)}`;
                g2.fillStyle = col.coral; g2.fillText(wd.charAt(0), cols.w, y);
                g2.fillStyle = col.gold; g2.fillText(wd.slice(1), cols.w + g2.measureText(wd.charAt(0)).width, y);
            });
            g2.font = monoSmall; g2.fillStyle = col.coral; g2.textAlign = 'right';
            g2.fillText('first digit: the sign', x1 - 10, bottom - 8);
        }

        function draw() {
            const canvas = canvasRef.current;
            if (!canvas) { raf = requestAnimationFrame(draw); return; }
            const g2 = canvas.getContext('2d');
            const s = stateRef.current;
            const d = depthRef.current;
            const rdd = rdRef.current;
            const dpr = window.devicePixelRatio || 1;
            const w = canvas.clientWidth;
            const hgt = canvas.clientHeight;
            if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(hgt * dpr)) {
                canvas.width = Math.round(w * dpr);
                canvas.height = Math.round(hgt * dpr);
            }
            g2.setTransform(dpr, 0, 0, dpr, 0, 0);
            g2.clearRect(0, 0, w, hgt);
            const sr = graphRef.current?.sampleRate || 48000;
            const sig = signalNow(s, sr);
            const legend = {};
            let handle = null;
            let plot = null;
            const narrow = w < 700;
            if (sig) {
                const pic = picture({ signal: sig.signal, raw: sig.raw, windowMs: sig.windowMs, rateKhz: s.rate, bits: s.bits, points: Math.max(240, Math.min(900, Math.round(w))) });
                // A recording is zoomed to what is there, in powers of two and
                // named on the axis (the Edit bench's rule: a DAW zooms both
                // ways); the levels zoom with it, so a quiet moment shows how
                // few of them it uses.
                {
                    let peak = 0;
                    for (const v2 of pic.line) peak = Math.max(peak, Math.abs(v2));
                    let z = zoomRef.current || 1;
                    if (peak * z > 1.02 || peak * z < 0.3) z = Math.max(1, Math.min(64, 2 ** Math.floor(Math.log2(0.95 / Math.max(peak, 1e-4)))));
                    zoomRef.current = z;
                }
                pic.zoom = zoomRef.current;
                const top = narrow ? 118 : 66;
                if (d === 'core' || narrow) {
                    const P = { x0: 56, x1: w - 22, top, bottom: hgt - (narrow ? 78 : 30) };
                    plot = drawPlot(g2, P, s, pic, { legend, bracket: true, narrow });
                    handle = plot.handle;
                } else if (d === 'alevel') {
                    const pw = Math.round(Math.max(250, Math.min(360, w * 0.3)));
                    const avail = hgt - top - 30;
                    const errH = Math.round(Math.max(46, Math.min(90, avail * 0.24)));
                    const P = { x0: 56, x1: w - 22 - pw - 20, top, bottom: hgt - 14 - errH - 34 };
                    plot = drawPlot(g2, P, s, pic, { legend, bracket: true, axes: true });
                    handle = plot.handle;
                    drawError(g2, { x0: P.x0, x1: P.x1, top: P.bottom + 34, bottom: hgt - 14 }, s, pic, plot);
                    drawNumbers(g2, { x0: w - 22 - pw, x1: w - 22, top, bottom: hgt - 14 }, s, rdd);
                } else {
                    const chainH = Math.round(Math.max(96, Math.min(180, (hgt - top - 30) * 0.4)));
                    drawChain(g2, { x0: 22, x1: w - 22, top, bottom: top + chainH }, s, pic, rdd, sr);
                    const lowTop = top + chainH + 22;
                    const px1 = Math.round(56 + (w - 78) * 0.5);
                    // the first eight samples, close up: the rows of the table
                    const zoom = picture({ signal: sig.signal, raw: sig.raw, windowMs: 7.5 / s.rate, rateKhz: s.rate, bits: s.bits, points: 360 });
                    // the close-up zooms to its own eight samples, in powers of two
                    let zp = 0;
                    for (const v2 of zoom.line) zp = Math.max(zp, Math.abs(v2));
                    zoom.zoom = Math.max(1, Math.min(64, 2 ** Math.floor(Math.log2(0.95 / Math.max(zp, 1e-4)))));
                    plot = drawPlot(g2, { x0: 56, x1: px1, top: lowTop, bottom: hgt - 30 }, s, zoom, { legend, numbers: 8, compact: true });
                    drawWords(g2, { x0: px1 + 22, x1: w - 22, top: lowTop - 8, bottom: hgt - 10 }, s, zoom);
                }
                // what happened, said on the stage where the eye is (Core and A-level)
                if (plot && (d !== 'extension' || narrow)) {
                    let msg = null; let c = col.coral;
                    if (rdd.key === 'alias') msg = `filter off: the ${rdd.band.name} fold down as false tones`;
                    else if (rdd.key === 'swallowed') { msg = `${s.bits} bit: most of it rounds to silence`; c = col.pink; }
                    else if (rdd.key === 'grit') { msg = 'few levels: you hear the rounding as grit'; c = col.pink; }
                    else if (rdd.key === 'hiss') { msg = 'fewer levels: a hiss under the quiet parts'; c = col.pink; }
                    else if (rdd.key === 'dull') { msg = rdd.nyquist >= 8 ? `nothing above ${fmtKhz(rdd.nyquist)} is kept` : `nothing above ${fmtKhz(rdd.nyquist)}: the top end has gone`; c = col.blue; }
                    if (msg) {
                        g2.font = narrow ? mono : monoBig; g2.textAlign = narrow ? 'left' : 'right';
                        // on a phone, the part after the colon when the whole will not fit
                        if (narrow && g2.measureText(msg).width > w - 44 && msg.includes(': ')) msg = msg.slice(msg.indexOf(': ') + 2);
                        const mw = g2.measureText(msg).width;
                        // on a phone the caption sits above the plot, clear of the waves
                        const x1 = narrow ? 20 + mw : d === 'core' ? w - 30 : w - 22 - Math.round(Math.max(250, Math.min(360, w * 0.3))) - 28;
                        const y = narrow ? top - 14 : top + (d === 'alevel' ? 36 : 16);
                        g2.fillStyle = 'rgba(23, 23, 43, 0.82)'; g2.fillRect(x1 - mw - 6, y - 13, mw + 12, 19);
                        g2.fillStyle = c; g2.fillText(msg, narrow ? 20 : x1, y);
                    }
                }
                canvas.dataset.samples = String(pic.inside.length);
            }
            if (heldRef.current) {
                g2.font = monoBig; g2.fillStyle = col.blue; g2.textAlign = 'left';
                g2.fillText('holding: you hear the analogue sound, before the converter', 56, hgt - 12 > 0 ? 58 : 58);
            }

            if (readRef.current) {
                const txt = `\u00a0· up to ${fmtKhz(rdd.nyquist)}`;
                if (readRef.current.textContent !== txt) readRef.current.textContent = txt;
            }
            geomRef.current = { handle, plot };
            const handleTag = handle ? `${Math.round(handle.x)}:${Math.round(handle.y)}` : '';
            if (canvas.dataset.handle !== handleTag) canvas.dataset.handle = handleTag;
            const rateTag = String(s.rate);
            if (canvas.dataset.rate !== rateTag) canvas.dataset.rate = rateTag;
            if (canvas.dataset.bits !== String(s.bits)) canvas.dataset.bits = String(s.bits);
            const foldTag = rdd.fold ? `${rdd.fold.lo}-${rdd.fold.hi}` : '';
            if (canvas.dataset.fold !== foldTag) canvas.dataset.fold = foldTag;
            if (canvas.dataset.key !== rdd.key) canvas.dataset.key = rdd.key;
            const stageTag = narrow ? 'samples' : stageOf(d);
            if (canvas.dataset.stage !== stageTag) canvas.dataset.stage = stageTag;
            raf = requestAnimationFrame(draw);
        }
        raf = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(raf);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // The sample-period bracket's end is dragged: the rate follows the
    // length, to the nearest step on the dial.
    const nearHandle = (px, py) => {
        const h = geomRef.current?.handle;
        return Boolean(h && Math.hypot(h.x - px, h.y - py) <= 12);
    };
    const onStageDown = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const px = e.clientX - rect.left; const py = e.clientY - rect.top;
        if (!nearHandle(px, py)) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        const h = geomRef.current.handle;
        const plot = geomRef.current.plot;
        dragRef.current = { x0: h.x0, perPx: (h.x - h.x0) > 0 ? (1 / stateRef.current.rate) / (h.x - h.x0) : 0, plot };
        touch('rate');
    };
    const onStageMove = (e) => {
        const dr = dragRef.current;
        const rect = e.currentTarget.getBoundingClientRect();
        const px = e.clientX - rect.left; const py = e.clientY - rect.top;
        e.currentTarget.style.cursor = dr || nearHandle(px, py) ? 'ew-resize' : '';
        if (!dr || !dr.perPx) return;
        const ms = Math.max(1 / RATES[RATES.length - 1], (px - dr.x0) * dr.perPx);
        const next = rateFromPeriod(ms);
        setState((s) => setRate(s, next));
    };
    const onStageUp = (e) => {
        if (!dragRef.current) return;
        dragRef.current = null;
        try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* gone */ }
    };

    // ---- drawer content ----
    const drawerTabs = useMemo(() => {
        const topicHref = (slug) => memberTopicHref(null, slug, studioOrigin);
        return [
        {
            id: 'reference',
            label: 'Reference',
            render: () => (
                <>
                    <h2>Digital and analogue, in the spec&apos;s words</h2>
                    <p>A microphone gives a voltage that varies continuously. An ADC turns it into numbers by measuring it at regular intervals and rounding each measurement to a fixed set of levels; a DAC turns the numbers back into a voltage for the speakers. The stage is that round trip, drawn and heard.</p>
                    <h3>Terms</h3>
                    <dl>
                        <dt>Analogue</dt><dd>A signal that varies continuously, its voltage following the sound wave. The blue line.</dd>
                        <dt>Digital</dt><dd>The same sound as a list of numbers, one for each moment it was measured. The dots, and the words in Extension.</dd>
                        <dt>ADC · DAC</dt><dd>The analogue-to-digital converter on the way in (mic to DAW); the digital-to-analogue converter on the way out (DAW to monitors). The gold line is the DAC&apos;s.</dd>
                        <dt>Sampling · sample rate</dt><dd>Measuring the voltage at regular intervals; the rate is how many measurements a second, in kHz. CD is 44.1 kHz; video and most studios 48 kHz; high-resolution recording 96 kHz.</dd>
                        <dt>Nyquist</dt><dd>The sample rate must be more than twice the highest frequency you want to keep. Half the sample rate is the highest frequency kept: 22.05 kHz for CD, just above the 20 kHz top of hearing.</dd>
                        <dt>Aliasing</dt><dd>A frequency above half the sample rate, sampled anyway, comes back as a false lower one: 3 kHz sampled at 4 kHz returns as 1 kHz. An anti-alias filter before the converter removes those frequencies first.</dd>
                        <dt>Bit depth</dt><dd>How many bits each sample is stored with. n bits give 2^n levels: 16 bit is 65,536, 24 bit is 16,777,216.</dd>
                        <dt>Quantisation</dt><dd>Rounding each sample to the nearest level. The difference, never more than half a step, is quantisation error; heard as noise or distortion when there are few levels.</dd>
                        <dt>File size · bit rate</dt><dd>Channels × sample rate × bit depth is the bits a second, so the file&apos;s size. Bit rate (kbps) is how much data a second a lossy file like an mp3 keeps; it is not bit depth.</dd>
                        <dt>Dynamic range</dt><dd>From the loudest level a format can hold down to its noise floor: about 6 dB for every bit. 16 bit is about 96 dB, 24 bit about 144 dB.</dd>
                    </dl>
                    <h3>In your DAW</h3>
                    <table>
                        <thead><tr><th>On this bench</th><th>Ableton Live</th><th>Logic Pro</th></tr></thead>
                        <tbody>
                            <tr><td>Sample rate</td><td>Settings, Audio: In/Out Sample Rate</td><td>Project Settings, Audio: Sample Rate</td></tr>
                            <tr><td>Bit depth (recording)</td><td>Settings, Record: Bit Depth</td><td>Settings, Audio, General: 24-bit recording</td></tr>
                            <tr><td>Bit depth (export)</td><td>Export Audio: Bit Depth, with Dither Options</td><td>Bounce: Resolution, with Dithering</td></tr>
                            <tr><td>Lowering both, as an effect</td><td>Redux (Downsample, Bit Depth)</td><td>Bitcrusher (Resolution, Downsampling)</td></tr>
                        </tbody>
                    </table>
                    <p className={styles.source}>As the settings appear in Live 12 and Logic Pro 11. Check against your own version if they move.</p>
                    <h3>Beyond the paper<span className={styles.ext}>EXT</span></h3>
                    <dl>
                        <dt>Sample and hold</dt><dd>The converter freezes the voltage for the moment it takes to measure it, which is why a sampled wave is drawn as steps before the DAC smooths it.</dd>
                        <dt>Two&apos;s complement</dt><dd>How a signed sample is written in binary. The first bit is the sign: 0 above the centre line, 1 below.</dd>
                        <dt>Dither</dt><dd>A very quiet noise added before rounding. The error stops following the music and becomes a steady hiss, which the ear forgives more easily than grit.</dd>
                        <dt>The DAC&apos;s filter</dt><dd>The gold line is not joined dots: the DAC&apos;s reconstruction filter draws the one smooth wave, below half the rate, that passes through every sample.</dd>
                    </dl>
                </>
            ),
        },
        {
            id: 'teacher',
            label: 'Teacher',
            render: () => (
                <>
                    <h2>What to listen for</h2>
                    <p>Press Play and the song plays while the stage draws five milliseconds of it: the blue wave going in, a white dot for each sample, the gold wave the DAC gives back on top of the blue. Turn Sample rate down and the dots spread; the filter smooths the blue wave, the dashed wave shows what it took, and the hi-hats lose their shine. Turn the filter off in More and they fold down as false, clangy tones instead. Turn Bit depth down and the levels appear as lines; each dot snaps to one, and the song gains a gritty edge.</p>
                    <h3>Do these now</h3>
                    <ul>
                        <li>Press <b>Aliasing</b>, then turn the filter on in More. Say what went, and why a converter always has that filter.</li>
                        <li>Press <b>CD</b>, then take Sample rate down to 8 kHz. Name what is lost, and why the answer is not &quot;it gets quieter&quot;.</li>
                        <li>Press <b>4-bit file</b> and hold the button in the play column. Say where in the phrase the crunch is worst, and why.</li>
                        <li>Press <b>Akai S900, 7.5k</b>, then <b>Akai S900, 40k</b>. Say what changed and which dial did it; then say what the 12 bits still cost against CD.</li>
                        <li>Switch to A-level and read the two numbers for the setting; switch to Extension and count the digits in a word.</li>
                    </ul>
                    <h3>Exam practice</h3>
                    <ExamCallout
                        prompt="A recording is made at 48 kHz and 16 bit. State the highest frequency it can capture, and its approximate dynamic range. (2 marks)"
                        answer="Half the sample rate: 24 kHz. About 6 dB a bit: 16 × 6 = 96 dB. The first comes from the rate, the second from the bit depth; mixing them up is the common slip."
                    />
                    <ExamCallout
                        prompt="Explain what happens to a 15 kHz sound recorded at a sample rate of 20 kHz with no filter before the converter. (2 marks)"
                        answer="Half of 20 kHz is 10 kHz, so 15 kHz is above the highest frequency the rate can keep. It aliases: it comes back as a false 5 kHz tone (20 − 15). An anti-alias filter, or a rate over 30 kHz, prevents it."
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
                    <a className={styles.conn} href={topicHref('sampling')}>
                        <i>1.4 Sampling</i>
                        <b>Rate and depth, in a sampler</b>
                        <span>The same two numbers set what a sampler keeps; lowering them on purpose is the lo-fi sound.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('numeracy')}>
                        <i>2.5 Numeracy</i>
                        <b>The file</b>
                        <span>Rate times depth times channels is the bits a second, and so the file&apos;s size. The Oscilloscope works it out.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('levels')}>
                        <i>2.6 Levels</i>
                        <b>The noise floor</b>
                        <span>Dynamic range is headroom plus the distance to the noise floor, which the bit depth sets.</span>
                    </a>
                </>
            ),
        },
    ];
    }, [studioOrigin]);

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
                        <i className={styles.ao} data-ao={sg.ao}>AO{sg.ao}</i>{' '}
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
    const sourceOptions = SOURCE_IDS.map((id) => ({ id, label: SOURCES[id].label, title: `A real recording: ${SOURCES[id].said}, its ${SOURCES[id].band.name} at ${SOURCES[id].band.lo} to ${SOURCES[id].band.hi} kHz` }));
    const onOff = [{ id: 'on', label: 'On' }, { id: 'off', label: 'Off' }];
    const hearWord = {
        clean: 'clean', dull: 'duller', hiss: 'hiss', grit: 'grit', swallowed: 'mostly silence', alias: 'false tones',
    }[rd.key];
    const aLevel = depth !== 'core';

    const consoleSlot = (
        <>
            <PlayColumn
                playing={playing}
                onTogglePlay={togglePlay}
                onHoldDry={setHeld}
                level={state.volume}
                onLevel={(v2) => setState((s) => setVolume(s, v2))}
                teach={teach}
                holdLabel="hold: analogue"
                holdTitle="Hold to hear the sound before the converter"
                holdWhy="plays the sound as it went in, before sampling and rounding, while you hold it"
                playWhy="plays the source through the converter, a phrase at a time"
            />

            <div className={`${styles.sec} ${styles.secSrc}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>Source</span><span className={styles.value}>{SOURCES[state.source].label}</span></div>
                <Chips label="Source" options={sourceOptions} value={state.source} onChange={chooseSource} />
                <div className={styles.meaning}>its {SOURCES[state.source].band.name}: {SOURCES[state.source].band.lo} to {SOURCES[state.source].band.hi} kHz</div>
                <Why>Three real recordings. The song&apos;s hi-hats sit high, so a low sample rate takes them first; the vocal&apos;s quiet tail shows what few bits do.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secAdc}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>Sample rate</span><span className={styles.value}>{String(state.rate)}<small>kHz</small></span></div>
                <div className={styles.adcKnob}>
                    <Dial label="Sample rate" value={rateIndex(state.rate)} min={0} max={RATES.length - 1} step={1} format={(i) => fmtKhz(RATES[i])} pointer="var(--gold-bright)" pixels={220} onChange={chooseRate} title="Samples a second, in kHz: drag up for more" />
                    <span className={styles.adcRead}><b>{fmtKhz(rd.nyquist)}</b> highest kept</span>
                </div>
                <div className={styles.meaning}>{aLevel ? `half the rate: ${fmtKhz(rd.nyquist)}` : 'more dots, finer detail in time'}</div>
                <Why>How many times a second the converter measures the voltage. Half this number is the highest frequency it can keep; the bracket on the stage is one sample&apos;s time, and dragging its end sets the rate.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secAdc}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>Bit depth</span><span className={styles.value}>{state.bits}<small>bit</small></span></div>
                <div className={styles.adcKnob}>
                    <Dial label="Bit depth" value={state.bits} min={BITS_MIN} max={BITS_MAX} step={1} format={(b) => `${b} bit`} pointer="var(--gen-3)" pixels={200} onChange={chooseBits} title="Bits for each sample: drag up for more levels" />
                    <span className={styles.adcRead}><b>{fmtLevels(state.bits)}</b> levels</span>
                </div>
                <div className={styles.meaning}>{aLevel ? `about ${rd.dynamicRange} dB of range` : 'more levels, finer detail in voltage'}</div>
                <Why>How many bits each sample is stored with. n bits give 2^n levels, and each dot is rounded to the nearest; each bit adds about 6 dB of dynamic range.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secHear}`} data-teach={teach || undefined} data-scope="true">
                <div className={styles.secHead}><span className={styles.eyebrow}>What you should hear</span></div>
                <div className={styles.stats} aria-live="polite">
                    <div><b>{hearWord}</b><span>what comes back</span></div>
                    <div><b>{fmtKhz(rd.nyquist)}</b><span>highest frequency kept</span></div>
                    <div><b>{fmtLevels(state.bits)}</b><span>levels</span></div>
                    <div><b>≈ {rd.dynamicRange} dB</b><span>dynamic range</span></div>
                </div>
                <Legal />
                <Why>Every number here comes from the two dials: half the sample rate is the highest frequency kept; 2 to the power of the bit depth is the levels; about 6 dB a bit is the dynamic range.</Why>
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
                <span className={styles.eyebrow}>Anti-alias filter</span>
                <Chips label="Anti-alias filter" options={onOff} value={state.filter ? 'on' : 'off'} onChange={chooseFilter} />
            </div>
            <div className={styles.moreItem}>
                <span className={styles.eyebrow}>Dither</span>
                <Chips label="Dither" options={onOff} value={state.dither ? 'on' : 'off'} onChange={chooseDither} />
                <span className={styles.chipNote}>{state.dither ? 'a quiet hiss, on purpose' : 'off'}</span>
            </div>
        </>
    ) : null;

    const stage = (
        <>
            <canvas
                ref={canvasRef}
                aria-label={depth === 'core' ? 'The converter: the wave in, the samples, the levels and the wave the DAC gives back' : depth === 'alevel' ? 'The samples, the rounding error, and the highest frequency kept and the dynamic range' : 'Inside the converter, and every sample as a binary word'}
                role="img"
                onPointerDown={onStageDown}
                onPointerMove={onStageMove}
                onPointerUp={onStageUp}
                onPointerCancel={onStageUp}
            />
            <div className={styles.stageNote}>
                <b>{fmtKhz(state.rate)} · {state.bits} bit<span ref={readRef} style={{ '--read': '16ch' }} /></b>
                <span>{ORIENTS[depth] || ORIENTS.core}</span>
            </div>
            <div className={`${styles.stageLegend} ${styles.legendTop} ${styles.adcLegend}`} aria-hidden="true">
                <span><i style={{ background: 'var(--gen-2)' }} />analogue in</span>
                <span><i style={{ background: '#fff', borderRadius: 5 }} />sample</span>
                <span><i style={{ background: 'var(--gen-3)', height: 2 }} />levels</span>
                <span><i style={{ background: 'var(--gold-bright)' }} />DAC out</span>
                {beforeShown(state) ? <span><i style={{ background: 'transparent', borderTop: '2px dashed var(--gen-2)', height: 0, width: 12 }} />before the filter</span> : null}
            </div>
            {!began ? (
                <div className={styles.begin}>
                    <button type="button" className={styles.beginBtn} onClick={() => audio.start()}>
                        <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1.2v9.6L11 6z" fill="currentColor" /></svg>
                        <span>
                            Play the bench
                            <small>A sound through a converter, drawn as it is sampled. Headphones help.</small>
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

// The wave before the anti-alias filter is drawn (dashed) where the filter
// visibly changes it: once the cut is under 16 kHz. The legend names it by the same rule.
function beforeShown(s) {
    if (!s.filter) return false;
    return filterCutoffHz(s.rate) < 16000;
}
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
function sup(n) { return String(n).split('').map((c) => SUP[Number(c)]).join(''); }
function fmtMsShort(ms) {
    if (ms >= 1) return ms.toFixed(ms >= 10 ? 1 : 2).replace(/\.?0+$/, '');
    return ms.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}
