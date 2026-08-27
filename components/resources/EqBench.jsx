'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BenchFrame from '@/components/bench/BenchFrame';
import { Dial, Chips, Why, MoreButton } from '@/components/bench/controls';
import { PlayColumn, Presets, Legal, ExamCallout, useBenchMode, useBenchDepth, DEPTHS } from '@/components/bench/BenchBits';
import { useBenchAudio, glide } from '@/components/bench/useBenchAudio';
import styles from '@/components/bench/bench.module.css';
import { memberTopicHref, useStudioArrival } from '@/lib/studio-return';
import { FILES, PATTERNS, SOURCE_IDS, scheduleBar } from '@/lib/bench/sources';
import { DEPTH_LINES, DEPTH_TEACH, judge, open as openMachine, hearingLine, nextMove } from '@/lib/bench/eq-depth';
import {
    BAND_IDS,
    BANDS,
    DEFAULT_STATE,
    PRESETS,
    applyPreset,
    setBand,
    sectionsOf,
    response,
    logFreqs,
    bandwidthOctaves,
    slopeFacts,
    peakOf,
    matchTrimDb,
    regionOf,
    hasGain,
    hasQ,
    hasSlope,
    hzFromPos,
    posFromHz,
    snapOctave,
    fmtHz,
    fmtDb,
    GAIN_MIN,
    GAIN_MAX,
    Q_MIN,
    Q_MAX,
    BUTTERWORTH_Q_DB,
    DB_SPAN,
    HZ_MIN,
    HZ_MAX,
    unwrapPhase,
} from '@/lib/bench/eq-model';

// The EQ bench (1.11), second bench to the Bench Standard after the Delay
// bench. One set of numbers makes the sound and the picture: lib/bench/
// eq-model.js holds the bands, the biquad chain below plays them, the
// stage draws the same RBJ response over the live spectrum of the source.
// Three jobs (lib/bench/eq-depth.js): Core shows, A-level judges the way
// the paper does, Extension opens the machine.

const CODE = '1.11 EQ';
const TITLE = 'EQ bench';
const ORIENT = 'The gold line is what the EQ does to every frequency; the green shape under it is the sound right now. Drag a band’s dot.';
const BPM = 110;
const GRID_HZ = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
const GRID_DB = [-12, -6, 0, 6, 12];
const CURVE_N = 220;

// ---- the graph ------------------------------------------------------------
function buildEqGraph(ctx, input, master) {
    const dry = ctx.createGain();
    dry.gain.value = 0;
    input.connect(dry);
    dry.connect(master);

    const mk = (type) => { const f = ctx.createBiquadFilter(); f.type = type; return f; };
    const nodes = {
        hpf: [mk('highpass'), mk('highpass')],
        low: [mk('lowshelf')],
        mid: [mk('peaking')],
        high: [mk('highshelf')],
        lpf: [mk('lowpass'), mk('lowpass')],
    };
    const chain = BAND_IDS.flatMap((id) => nodes[id]);
    const pre = ctx.createAnalyser();
    const post = ctx.createAnalyser();
    for (const an of [pre, post]) { an.fftSize = 2048; an.smoothingTimeConstant = 0.8; an.minDecibels = -96; an.maxDecibels = -8; }
    const trim = ctx.createGain();
    const wet = ctx.createGain();
    input.connect(pre);
    let prev = input;
    for (const n of chain) { prev.connect(n); prev = n; }
    prev.connect(trim);
    trim.connect(wet);
    wet.connect(master);
    trim.connect(post);

    let current = null;
    let dryHeld = false;
    function set(state) {
        current = state;
        for (const id of BAND_IDS) {
            const secs = sectionsOf(state, id);
            nodes[id].forEach((node, i) => {
                const sec = secs[i];
                if (!sec) {
                    // a band that is out, or the second section of a 12 dB
                    // filter: parked where it changes nothing audible
                    if (id === 'hpf') { glide(node.frequency, 10, ctx); glide(node.Q, BUTTERWORTH_Q_DB, ctx); }
                    else if (id === 'lpf') { glide(node.frequency, 22000, ctx); glide(node.Q, BUTTERWORTH_Q_DB, ctx); }
                    else glide(node.gain, 0, ctx);
                    return;
                }
                glide(node.frequency, sec.hz, ctx);
                if (id === 'hpf' || id === 'lpf') glide(node.Q, BUTTERWORTH_Q_DB, ctx);
                else if (id === 'mid') { glide(node.Q, sec.q, ctx); glide(node.gain, sec.gain, ctx); }
                else glide(node.gain, sec.gain, ctx);
            });
        }
        glide(trim.gain, Math.pow(10, matchTrimDb(state) / 20), ctx);
        glide(wet.gain, dryHeld ? 0 : 1, ctx);
        glide(dry.gain, dryHeld ? 1 : 0, ctx);
    }
    function holdDry(held) {
        dryHeld = held;
        if (current) set(current);
    }
    function clear() { /* nothing rings on in an EQ */ }
    return { set, holdDry, clear, pre, post };
}

// ---- the bench ------------------------------------------------------------
export default function EqBench({ back }) {
    const [state, setState] = useState(DEFAULT_STATE);
    const [further, setFurther] = useState(false);
    const [mode, setMode] = useBenchMode();
    const [depth, setDepth] = useBenchDepth();
    const [hover, setHover] = useState(null);
    // The control the student touched last: what A-level judges and what
    // Extension opens. A level change announces itself until the next touch.
    const [last, setLast] = useState('preset');
    const [announce, setAnnounce] = useState(null);
    const stateRef = useRef(state);
    stateRef.current = state;
    const hoverRef = useRef(null);
    hoverRef.current = hover;
    const { studioOrigin } = useStudioArrival();
    const teach = mode === 'teacher';
    const ext = depth === 'extension';
    const maths = depth !== 'core';

    const pattern = PATTERNS[state.source];
    const bandId = state.band;
    const band = state[bandId];
    const def = BANDS[bandId];

    const onSchedule = useCallback((tick) => { scheduleBar(PATTERNS[stateRef.current.source], tick); }, []);
    const audio = useBenchAudio({ files: FILES, bpm: BPM, onSchedule, buildGraph: buildEqGraph });
    const { ctxRef, nodesRef, began, playing } = audio;
    const playingRef = useRef(false);
    playingRef.current = playing;

    useEffect(() => { nodesRef.current?.graph?.set(state); }, [state, began, nodesRef]);
    useEffect(() => {
        const ctx = ctxRef.current;
        const nodes = nodesRef.current;
        if (ctx && nodes) glide(nodes.level.gain, state.level, ctx);
    }, [state.level, began, ctxRef, nodesRef]);

    const touch = (what) => { setLast(what); setAnnounce(null); };
    const chooseDepth = (id) => { setDepth(id); setAnnounce(id); };
    const patchBand = (patch, what) => {
        setState((s) => setBand(s, s.band, patch));
        touch(what);
    };
    const chooseBand = (id) => { setState((s) => ({ ...s, band: id })); touch('band'); };
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

    // The space bar is the transport, wherever the focus is (as on the
    // Delay bench), except where Space has another job.
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

    // Numbers the console and the line read, from the model once.
    const peak = peakOf(state);
    const bandOn = band.on;
    const midHz = bandId === 'mid' && state.graphic ? snapOctave(band.hz, def.hzMin, def.hzMax) : band.hz;
    const bw = hasQ(bandId) ? bandwidthOctaves(state.graphic ? 1.41 : band.q) : null;
    const slope = hasSlope(bandId) ? slopeFacts(bandId, { ...state, [bandId]: { ...band, on: true } }) : null;
    const region = regionOf(midHz);
    const trimDb = matchTrimDb(state);

    // ---- stage ----
    const canvasRef = useRef(null);
    const handlesRef = useRef([]);
    const dragRef = useRef(null);
    const depthRef = useRef(depth);
    depthRef.current = depth;
    const freqs = useMemo(() => logFreqs(CURVE_N), []);
    useEffect(() => {
        const first = canvasRef.current;
        if (!first) return undefined;
        let raf = 0;
        const css = getComputedStyle(first.parentElement);
        const v = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
        const col = {
            gold: v('--gold-bright', '#f0d48a'),
            green: v('--gen-1', '#7fb39b'),
            purple: '#a395c9',
            inkSoft: 'rgba(255, 255, 255, 0.62)',
            inkFaint: 'rgba(255, 255, 255, 0.38)',
            grid: 'rgba(255, 255, 255, 0.08)',
            zero: 'rgba(255, 255, 255, 0.26)',
            ghost: 'rgba(255, 255, 255, 0.28)',
        };
        const bandCol = {};
        for (const id of BAND_IDS) bandCol[id] = v(BANDS[id].colour.replace(/^var\((.*)\)$/, '$1'), '#7fb0c4');
        const monoFace = v('--mono', 'monospace');
        const mono = `11.5px ${monoFace}`;
        const specPre = new Uint8Array(1024);
        const specPost = new Uint8Array(1024);

        function draw() {
            const canvas = canvasRef.current;
            if (!canvas) { raf = requestAnimationFrame(draw); return; }
            const g = canvas.getContext('2d');
            const s = stateRef.current;
            const dpr = window.devicePixelRatio || 1;
            const w = canvas.clientWidth;
            const h = canvas.clientHeight;
            if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
                canvas.width = Math.round(w * dpr);
                canvas.height = Math.round(h * dpr);
            }
            g.setTransform(dpr, 0, 0, dpr, 0, 0);
            g.clearRect(0, 0, w, h);

            const padL = 44;
            const padR = 26;
            const top = 66;
            const bottom = h - 38;
            const plotW = w - padL - padR;
            const plotH = bottom - top;
            const midY = top + plotH / 2;
            const xOf = (hz) => padL + posFromHz(hz, HZ_MIN, HZ_MAX) * plotW;
            const yOf = (db) => midY - (db / DB_SPAN) * (plotH / 2);

            // grid: frequency decades and dB lines
            g.lineWidth = 1;
            g.font = mono;
            for (const hz of GRID_HZ) {
                const x = Math.round(xOf(hz)) + 0.5;
                g.strokeStyle = col.grid;
                g.beginPath(); g.moveTo(x, top); g.lineTo(x, bottom); g.stroke();
                g.fillStyle = col.inkFaint;
                g.textAlign = hz === 20 ? 'left' : hz === 20000 ? 'right' : 'center';
                g.fillText(hz >= 1000 ? `${hz / 1000}k` : String(hz), x, h - 16);
            }
            for (const db of GRID_DB) {
                const y = Math.round(yOf(db)) + 0.5;
                g.strokeStyle = db === 0 ? col.zero : col.grid;
                g.beginPath(); g.moveTo(padL, y); g.lineTo(w - padR, y); g.stroke();
                g.fillStyle = col.inkFaint;
                g.textAlign = 'right';
                g.fillText(db > 0 ? `+${db}` : String(db), padL - 8, y + 4);
            }

            // the sound right now: post-EQ as a filled shape, pre-EQ as a line
            const graph = nodesRef.current?.graph;
            const actx = ctxRef.current;
            if (graph && actx && playingRef.current) {
                graph.pre.getByteFrequencyData(specPre);
                graph.post.getByteFrequencyData(specPost);
                const binHz = actx.sampleRate / graph.pre.fftSize;
                const cols = Math.floor(plotW);
                const specH = plotH * 0.72;
                const level = (arr, i) => {
                    const hz0 = hzFromPos(i / cols, HZ_MIN, HZ_MAX);
                    const hz1 = hzFromPos((i + 1) / cols, HZ_MIN, HZ_MAX);
                    let b0 = Math.floor(hz0 / binHz);
                    let b1 = Math.max(b0 + 1, Math.floor(hz1 / binHz));
                    b0 = Math.min(1023, b0); b1 = Math.min(1024, b1);
                    let m = 0;
                    for (let b = b0; b < b1; b += 1) if (arr[b] > m) m = arr[b];
                    return m / 255;
                };
                g.beginPath();
                g.moveTo(padL, bottom);
                for (let i = 0; i <= cols; i += 1) g.lineTo(padL + i, bottom - level(specPost, i) * specH);
                g.lineTo(padL + cols, bottom);
                g.closePath();
                g.fillStyle = col.green;
                g.globalAlpha = 0.3;
                g.fill();
                g.globalAlpha = 1;
                g.beginPath();
                for (let i = 0; i <= cols; i += 1) {
                    const y = bottom - level(specPre, i) * specH;
                    if (i === 0) g.moveTo(padL + i, y); else g.lineTo(padL + i, y);
                }
                g.strokeStyle = col.ghost;
                g.lineWidth = 1;
                g.stroke();
            }

            // each band's own curve, faint, then the total in gold
            const total = response(s, freqs);
            for (const id of BAND_IDS) {
                if (!s[id].on) continue;
                const r = response(s, freqs, { only: id });
                g.beginPath();
                r.forEach((p, i) => { const x = xOf(p.hz); const y = yOf(Math.max(-DB_SPAN - 4, Math.min(DB_SPAN + 4, p.db))); if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); });
                g.strokeStyle = bandCol[id];
                g.globalAlpha = id === s.band ? 0.7 : 0.35;
                g.lineWidth = 1;
                g.stroke();
                g.globalAlpha = 1;
            }
            g.beginPath();
            total.forEach((p, i) => { const x = xOf(p.hz); const y = yOf(Math.max(-DB_SPAN - 4, Math.min(DB_SPAN + 4, p.db))); if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); });
            g.strokeStyle = col.gold;
            g.lineWidth = 2.5;
            g.lineJoin = 'round';
            g.stroke();
            g.lineWidth = 1;

            // Extension: the phase the curve costs, dotted
            if (depthRef.current === 'extension') {
                g.beginPath();
                g.setLineDash([3, 4]);
                unwrapPhase(total).forEach((p, i) => { const x = xOf(p.hz); const y = midY - (p.phase / (2 * Math.PI)) * (plotH / 2) * 0.9; if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); });
                g.strokeStyle = col.purple;
                g.stroke();
                g.setLineDash([]);
                g.fillStyle = col.purple;
                g.font = mono;
                g.textAlign = 'left';
                g.fillText('dotted: phase, ±360° top to bottom', padL, top - 10);
                g.font = `600 9.5px ${monoFace}`;
                g.fillText('EXT', padL + g.measureText('dotted: phase, ±360° top to bottom').width * 1.22 + 8, top - 10);
                g.font = mono;
            }

            // handles: one per band that is in; the chosen band's is ringed
            const handles = [];
            const hovered = hoverRef.current?.id || null;
            for (const id of BAND_IDS) {
                const b = s[id];
                if (!b.on) continue;
                const hz = id === 'mid' && s.graphic ? snapOctave(b.hz, BANDS.mid.hzMin, BANDS.mid.hzMax) : b.hz;
                let db;
                if (hasGain(id)) db = b.gain;
                else db = response(s, [hz], { only: id })[0].db;
                const x = xOf(hz);
                const y = yOf(Math.max(-DB_SPAN, Math.min(DB_SPAN, db)));
                const chosen = id === s.band;
                g.beginPath();
                g.arc(x, y, chosen ? 7 : 5, 0, Math.PI * 2);
                g.fillStyle = bandCol[id];
                g.fill();
                if (chosen || id === hovered) {
                    g.beginPath();
                    g.arc(x, y, chosen ? 11 : 9, 0, Math.PI * 2);
                    g.strokeStyle = '#ffffff';
                    g.lineWidth = chosen ? 1.5 : 1;
                    g.stroke();
                    g.lineWidth = 1;
                }
                handles.push({ id, x, y, hz, db });
            }
            handlesRef.current = handles;

            // the chosen band's label, for the depth
            const chosen = handles.find((hd) => hd.id === s.band);
            if (chosen) {
                const b = s[s.band];
                const d = BANDS[s.band];
                let label = `${d.label} · ${fmtHz(chosen.hz)}`;
                if (hasGain(s.band)) label += ` · ${fmtDb(b.gain)}`;
                if (hasSlope(s.band)) label += ` · ${b.slope} dB/oct`;
                if (depthRef.current === 'core') label += ` · ${regionOf(chosen.hz).name}`;
                else if (hasQ(s.band)) label += ` · Q ${(s.graphic ? 1.41 : b.q).toFixed(1)} = ${bandwidthOctaves(s.graphic ? 1.41 : b.q).toFixed(1)} oct wide`;
                else if (hasSlope(s.band)) label += ` · ${fmtDb(chosen.db)} at the cutoff`;
                if (depthRef.current === 'extension' && hasQ(s.band)) {
                    const half = Math.pow(2, bandwidthOctaves(s.graphic ? 1.41 : b.q) / 2);
                    label += ` · half power at ${fmtHz(chosen.hz / half)} and ${fmtHz(chosen.hz * half)}`;
                }
                if (depthRef.current === 'extension' && hasSlope(s.band)) label += ` · order ${b.slope === 24 ? 4 : 2}`;
                g.font = mono;
                g.fillStyle = col.gold;
                const above = chosen.y > top + 40;
                const ty = above ? chosen.y - 18 : chosen.y + 26;
                const tw = g.measureText(label).width;
                let tx = chosen.x - tw / 2;
                tx = Math.max(padL, Math.min(w - padR - tw, tx));
                g.textAlign = 'left';
                g.fillText(label, tx, ty);
            }

            // what this frame drew, told to the canvas for check-bench (law 15)
            const pk = peakOf(s, 96);
            const tag = chosen ? `${s.band}:${Math.round(chosen.hz)}:${hasGain(s.band) ? s[s.band].gain : s[s.band].slope}` : `${s.band}:out`;
            if (canvas.dataset.band !== tag) canvas.dataset.band = tag;
            const curve = `max:${pk.maxDb.toFixed(1)} min:${pk.minDb.toFixed(1)}`;
            if (canvas.dataset.curve !== curve) canvas.dataset.curve = curve;
            const dot = chosen ? `${Math.round(chosen.x)}:${Math.round(chosen.y)}` : "";
            if (canvas.dataset.dot !== dot) canvas.dataset.dot = dot;

            raf = requestAnimationFrame(draw);
        }
        raf = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(raf);
    }, [ctxRef, nodesRef, freqs]);

    // Drag a band's dot: x is its frequency, y its gain (filters: frequency only).
    const stageGeom = (el) => {
        const rect = el.getBoundingClientRect();
        const padL = 44; const padR = 26; const top = 66; const bottom = rect.height - 38;
        const plotW = rect.width - padL - padR;
        const plotH = bottom - top;
        return { rect, padL, plotW, top, plotH, midY: top + plotH / 2 };
    };
    const onStageDown = (e) => {
        const { rect } = stageGeom(e.currentTarget);
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        let best = null; let bestD = 16;
        for (const hd of handlesRef.current) {
            const d = Math.hypot(px - hd.x, py - hd.y);
            if (d < bestD) { bestD = d; best = hd; }
        }
        if (!best) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        dragRef.current = { id: best.id };
        if (best.id !== stateRef.current.band) chooseBand(best.id);
    };
    const onStageMove = (e) => {
        const geom = stageGeom(e.currentTarget);
        const px = e.clientX - geom.rect.left;
        const py = e.clientY - geom.rect.top;
        if (dragRef.current) {
            const id = dragRef.current.id;
            const d = BANDS[id];
            const hz = hzFromPos((px - geom.padL) / geom.plotW, HZ_MIN, HZ_MAX);
            const patch = { hz: Math.max(d.hzMin, Math.min(d.hzMax, hz)) };
            if (hasGain(id)) patch.gain = Math.max(GAIN_MIN, Math.min(GAIN_MAX, ((geom.midY - py) / (geom.plotH / 2)) * DB_SPAN));
            setState((s) => setBand(s, id, patch));
            touch('band');
            return;
        }
        if (!teach) { if (hover) setHover(null); return; }
        let best = null; let bestD = 14;
        for (const hd of handlesRef.current) {
            const dd = Math.hypot(px - hd.x, py - hd.y);
            if (dd < bestD) { bestD = dd; best = hd; }
        }
        if (!best) { if (hover) setHover(null); return; }
        if (hover && hover.id === best.id) return;
        setHover({ id: best.id, x: best.x, y: best.y, hz: best.hz, db: best.db, stageW: geom.rect.width, stageH: geom.rect.height });
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
                    <h2>EQ, in the spec&apos;s words</h2>
                    <p>The five bands on this bench are the five things an exam answer about EQ is built from: two filters, two shelves and a parametric band.</p>
                    <h3>Terms</h3>
                    <dl>
                        <dt>High-pass filter</dt><dd>Lets the highs through and rolls the lows off below its cutoff. The cutoff is where the level is 3 dB down, not where the sound stops.</dd>
                        <dt>Low-pass filter</dt><dd>The same the other way up: the top end rolls off above the cutoff.</dd>
                        <dt>Slope</dt><dd>How fast the roll-off falls, in dB per octave. 12 dB/oct is one filter section; 24 dB/oct is two in series.</dd>
                        <dt>Shelf</dt><dd>A boost or cut that levels off: everything below (low shelf) or above (high shelf) the corner is lifted or lowered by the same amount.</dd>
                        <dt>Parametric band</dt><dd>A bell with three parameters: frequency, gain, and Q. A boost or cut centred on one frequency.</dd>
                        <dt>Q and bandwidth</dt><dd>Q is how narrow the bell is. Bandwidth is the same thing as a distance in octaves between the two half-power points: Q 1 is about 1.4 octaves wide, Q 4 about a third of an octave.</dd>
                        <dt>Graphic EQ</dt><dd>Fixed bands at set frequencies, usually an octave or a third of an octave apart, each with a gain slider and nothing else. Fast to read, no choice of frequency or width.</dd>
                        <dt>Parametric EQ</dt><dd>Every band free in frequency, gain and width. Slower to read, precise: it can take out one ringing frequency and leave its neighbours alone.</dd>
                    </dl>
                    <h3>In your DAW</h3>
                    <table>
                        <thead><tr><th>On this bench</th><th>Ableton Live</th><th>Logic Pro</th></tr></thead>
                        <tbody>
                            <tr><td>HPF, LPF and slope</td><td>EQ Eight: filter type, 12 / 24 / 48 dB</td><td>Channel EQ: the two outer bands, slope menu</td></tr>
                            <tr><td>Low and high shelf</td><td>EQ Eight: shelf types</td><td>Channel EQ: bands 2 and 7</td></tr>
                            <tr><td>Parametric band</td><td>EQ Eight: bell, with Freq / Gain / Q</td><td>Channel EQ: bands 3 to 6</td></tr>
                            <tr><td>Graphic mode</td><td>No graphic EQ in Live: use fixed frequencies on EQ Eight</td><td>Linear Phase EQ or a Channel EQ with fixed bands; Logic has no graphic EQ either</td></tr>
                            <tr><td>Level match</td><td>EQ Eight: Gain (output)</td><td>Channel EQ: Gain (master)</td></tr>
                        </tbody>
                    </table>
                    <p className={styles.source}>Control names as they appear in Live 12 and Logic Pro 11 device panels. Check against your own version if they move.</p>
                    <h3>Beyond the paper<span className={styles.ext}>EXT</span></h3>
                    <dl>
                        <dt>Minimum phase</dt><dd>Every one of these filters delays the frequencies around its corner a little, and the steeper the filter the more it delays. The dotted line at Extension is that phase. A linear-phase EQ removes it, at the cost of delay and pre-ringing.</dd>
                        <dt>Order</dt><dd>A 12 dB/oct filter is second order (one biquad); 24 dB/oct is fourth order (two). Two identical Butterworth sections put the cutoff 6 dB down rather than 3, which is how a Linkwitz-Riley crossover is made.</dd>
                        <dt>Resonance</dt><dd>Raise the Q of a high-pass or low-pass and it peaks at its cutoff before it rolls off. That peak is the synth filter of 1.3: the same filter, played.</dd>
                    </dl>
                    <p className={styles.source}>Cipriani and Giri, Electronic Music and Sound Design vol. 1, ch. 3 (filters), the reading behind the A* tier at Sherborne.</p>
                </>
            ),
        },
        {
            id: 'teacher',
            label: 'Teacher',
            render: () => (
                <>
                    <h2>What to listen for</h2>
                    <p>The stage shows the EQ&apos;s curve over the sound as it is now. Hold the dry button and the green shape shows you the sound without the curve; let go and watch what the curve takes away or adds. Once you can hear a cut as a cut and not as &quot;quieter&quot;, you are describing EQ the way the paper marks it.</p>
                    <h3>Do these now</h3>
                    <ul>
                        <li>Press <b>Too much</b>, switch the bench to A-level, and judge the band from what you hear before you read the line. Then fix it, and say what you changed and why.</li>
                        <li>Choose the 808, press In on the HPF, and drag its dot up until the kick loses its weight. Note the frequency. Then do the same on the vocal and note where the voice thins.</li>
                        <li>On the vocal, set the Mid band to +8 dB, Q 8, and sweep the frequency slowly across the mids. The place it honks is the place a cut goes. Turn the gain to −4 and leave it there.</li>
                        <li>Press <b>Telephone</b>, then read the two filters off the stage and say what the pair is called.</li>
                        <li>Open More, switch the Mid band to Graphic, and try to put a cut at 350 Hz. Say what a graphic EQ cannot do.</li>
                    </ul>
                    <h3>Exam practice</h3>
                    <ExamCallout
                        prompt="A vocal recording has a low rumble from the stand and a boomy quality around 300 Hz. Name two EQ moves, with settings."
                        answer="A high-pass filter with the cutoff around 80 to 100 Hz (12 dB/oct) removes the rumble below the voice; a parametric cut of about 3 to 4 dB at 300 Hz, Q around 1.5, takes the boom out without thinning the voice."
                    />
                    <ExamCallout
                        prompt="What can a parametric EQ do that a graphic EQ cannot?"
                        answer="Choose the exact centre frequency and the width (Q) of a band, so one ringing frequency can be cut narrowly and its neighbours left alone. A graphic EQ's bands are fixed in frequency and width; only their gain moves."
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
                        <b>The same filter, played</b>
                        <span>A synth&apos;s low-pass filter is the LPF on this bench with its resonance up and an envelope on the cutoff.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('delay')}>
                        <i>1.12 Delay</i>
                        <b>A filter inside a loop</b>
                        <span>The Delay bench&apos;s High cut is a low-pass filter in the feedback path, so every repeat goes through it once more.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('balance-blend')}>
                        <i>1.13 Balance and blend</i>
                        <b>Cuts make room</b>
                        <span>Two parts fighting for the same frequencies mask each other. The Balance topic is where a cut on one part lets the other through.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('dynamic-processing')}>
                        <i>1.9 Dynamic processing</i>
                        <b>EQ before or after the compressor</b>
                        <span>A cut before the compressor changes what it reacts to; a boost after it changes only the tone. The order is an exam point.</span>
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
        const segs = judge({ state, last, part: pattern.said });
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
        say = <>{openMachine({ state, last, part: pattern.said })}{teach ? <> {DEPTH_TEACH.extension}</> : null}</>;
    } else {
        const next = nextMove(state);
        say = teach
            ? <>{hearingLine(state, pattern.said)} <b>Try:</b> {next}.</>
            : <><b>Try:</b> {next.charAt(0).toUpperCase() + next.slice(1)}.</>;
    }

    // ---- console ----
    const hzPos = Math.round(posFromHz(band.hz, def.hzMin, def.hzMax) * 1000);
    const qShown = hasQ(bandId) ? (state.graphic ? 1.41 : band.q) : null;
    const qPos = qShown != null ? Math.round(posFromHz(qShown, Q_MIN, Q_MAX) * 100) : 50;
    const bandOptions = BAND_IDS.map((id) => ({ id, label: BANDS[id].label, title: BANDS[id].name }));
    // the Frequency diagram: the regions, and where every band that is in sits
    const regionTicks = [60, 250, 500, 2000, 5000, 8000].map((hz) => posFromHz(hz, HZ_MIN, HZ_MAX) * 100);
    const bandMarks = BAND_IDS.filter((id) => state[id].on).map((id) => ({ id, x: posFromHz(id === 'mid' && state.graphic ? snapOctave(state[id].hz) : state[id].hz, HZ_MIN, HZ_MAX) * 100 }));
    // the Shape diagram: the chosen band's own curve
    const shapePts = useMemo(() => {
        const s = { ...state, [bandId]: { ...band, on: true } };
        const pts = response(s, logFreqs(48), { only: bandId });
        return pts.map((p, i) => `${(i / 47) * 100},${50 - (Math.max(-15, Math.min(15, p.db)) / 15) * 42}`).join(' ');
    }, [state, bandId, band]);

    const consoleSlot = (
        <>
            <PlayColumn
                playing={playing}
                onTogglePlay={togglePlay}
                onHoldDry={(held) => nodesRef.current?.graph?.holdDry(held)}
                level={state.level}
                onLevel={(v) => setState((s) => ({ ...s, level: v }))}
                teach={teach}
                holdTitle="Hold to hear the source with no EQ"
                holdWhy="bypasses every band while you hold it, so you can hear what the EQ is changing"
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
                <Why>Four sounds with four different spectrums. The 808 lives in the sub; the vocal has its body in the low mids and its consonants above 5 kHz; the stabs sit in the mids. The same EQ move means something different on each.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secBand}`} data-teach={teach || undefined}>
                <div className={styles.secHead}>
                    <span className={styles.eyebrow}>Band</span>
                    <span className={styles.value} data-tone={bandOn ? 'green' : undefined}>{bandOn ? 'in' : 'out'}</span>
                </div>
                <Chips label="Band" options={bandOptions} value={bandId} onChange={chooseBand} />
                <Chips
                    label="In or out"
                    options={[{ id: 'in', label: 'In' }, { id: 'out', label: 'Out' }]}
                    value={bandOn ? 'in' : 'out'}
                    onChange={(id) => patchBand({ on: id === 'in' }, 'in')}
                />
                <div className={styles.meaning}>{def.name}{hasSlope(bandId) ? `, ${band.slope} dB/oct` : ''}</div>
                <Why>Five bands in the order the signal meets them: a high-pass, a low shelf, one parametric bell, a high shelf, a low-pass. Choose one and the dials belong to it. In and Out is the bypass for that band alone.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secTime}`} data-teach={teach || undefined}>
                <div className={styles.secHead}>
                    <span className={styles.eyebrow} data-hot="true">Frequency</span>
                    <span className={styles.value}>{fmtHz(midHz)}</span>
                </div>
                <div className={styles.instrument}>
                    <Dial
                        label="Frequency"
                        value={hzPos}
                        min={0}
                        max={1000}
                        step={1}
                        format={() => fmtHz(midHz)}
                        pointer="var(--gold)"
                        hot
                        pixels={360}
                        onChange={(v) => patchBand({ hz: hzFromPos(v / 1000, def.hzMin, def.hzMax) }, 'hz')}
                        title={`${def.name}: ${fmtHz(def.hzMin)} to ${fmtHz(def.hzMax)}`}
                    />
                    <div className={styles.diagram} aria-hidden="true">
                        <small>20 Hz to 20 kHz</small>
                        {regionTicks.map((x) => <span key={x} className={styles.tickBeat} style={{ left: `${x}%` }} />)}
                        {bandMarks.map((m) => (
                            <span key={m.id} className={styles.tick} style={{ left: `calc(${m.x}% - 1px)`, background: BANDS[m.id].colour, opacity: m.id === bandId ? 1 : 0.45, top: m.id === bandId ? 14 : 20 }} />
                        ))}
                    </div>
                </div>
                {hasSlope(bandId) ? (
                    <Chips label="Slope" options={[{ id: '12', label: '12 dB/oct' }, { id: '24', label: '24 dB/oct' }]} value={String(band.slope)} onChange={(id) => patchBand({ slope: Number(id) }, 'slope')} />
                ) : (
                    <div className={styles.chips} aria-hidden="true"><span className={styles.chipNote} style={{ marginLeft: 0 }}>{region.name}</span></div>
                )}
                <div className={styles.meaning} data-ext={maths && hasSlope(bandId) ? 'true' : undefined}>
                    {maths && hasSlope(bandId) && slope
                        ? `${fmtDb(slope.atCutoffDb)} at the cutoff, ${fmtDb(slope.octaveDb)} an octave ${bandId === 'hpf' ? 'below' : 'above'}`
                        : hasSlope(bandId) ? 'where the roll-off starts' : `the ${bandId === 'mid' ? 'centre' : 'corner'} of the band`}
                </div>
                <Why>{hasSlope(bandId)
                    ? 'The cutoff is the frequency where the filter is already 3 dB down; the slope is how fast it falls beyond that, in dB for every octave. Drag the dial, or drag the band’s dot on the stage.'
                    : bandId === 'mid'
                        ? 'The centre of the bell. Sweep it while the gain is up to find where a sound honks or rings, then cut there. The scale is logarithmic, like the ear.'
                        : 'The corner of the shelf: below it (low shelf) or above it (high shelf) the whole range moves by the gain.'}</Why>
            </div>

            <div className={`${styles.sec} ${styles.secShape}`} data-teach={teach || undefined}>
                <div className={styles.secHead}>
                    <span className={styles.eyebrow}>Shape</span>
                    <span className={styles.value} data-tone={hasGain(bandId) && band.gain !== 0 ? 'green' : undefined}>
                        {hasGain(bandId) ? fmtDb(band.gain) : `${band.slope} dB/oct`}
                        {qShown != null ? <small>Q {qShown.toFixed(1)}</small> : null}
                    </span>
                </div>
                <div className={styles.instrument}>
                    <Dial
                        label="Gain"
                        value={hasGain(bandId) ? band.gain : 0}
                        min={GAIN_MIN}
                        max={GAIN_MAX}
                        step={0.5}
                        format={(v) => fmtDb(v)}
                        pointer="var(--green)"
                        disabled={!hasGain(bandId)}
                        onChange={(v) => patchBand({ gain: v }, 'gain')}
                        title={hasGain(bandId) ? 'Boost or cut, in dB' : 'A filter has a slope, not a gain'}
                    />
                    <Dial
                        label="Q"
                        value={qPos}
                        min={0}
                        max={100}
                        step={1}
                        size="small"
                        format={() => (qShown != null ? `Q ${qShown.toFixed(1)}` : "no Q")}
                        disabled={!hasQ(bandId) || state.graphic}
                        onChange={(v) => patchBand({ q: hzFromPos(v / 100, Q_MIN, Q_MAX) }, 'q')}
                        title={hasQ(bandId) ? (state.graphic ? 'Locked at an octave in Graphic mode' : 'Q: the width of the bell') : 'Only the parametric band has a Q'}
                    />
                    <div className={styles.diagram} aria-hidden="true">
                        <small>{def.name}</small>
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={styles.shapeSvg}>
                            <line x1="0" y1="50" x2="100" y2="50" />
                            <polyline points={shapePts} style={{ stroke: def.colour }} />
                        </svg>
                    </div>
                </div>
                <div className={styles.meaning} data-ext={maths && hasQ(bandId) ? 'true' : undefined}>
                    {maths && hasQ(bandId) && bw != null
                        ? `Q ${qShown.toFixed(1)} = ${bw.toFixed(1)} octaves between the half-power points`
                        : hasQ(bandId) ? 'gain is how much, Q is how wide' : hasGain(bandId) ? 'how far the shelf lifts or lowers' : 'a filter has a slope, not a gain'}
                </div>
                <Why>{hasQ(bandId)
                    ? 'Gain is how much the band boosts or cuts; Q is how narrow it is. Cuts are usually narrow and boosts wide: a narrow boost rings, a wide cut thins. In the exam, name both numbers.'
                    : hasGain(bandId) ? 'A shelf has gain and a corner, nothing else: it lifts or lowers the whole range past the corner by this much.' : 'A high-pass or low-pass has no gain of its own: choose the cutoff and the slope, and the roll-off does the rest.'}</Why>
            </div>

            <div className={`${styles.sec} ${styles.secHear}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>What you should hear</span></div>
                <div className={styles.stats} aria-live="polite">
                    <div><b>{bandOn ? (hasGain(bandId) ? fmtDb(band.gain) : `${band.slope} dB/oct`) : 'out'}</b><span>{def.label} at {fmtHz(midHz)}</span></div>
                    <div><b>{hasQ(bandId) && bw != null ? `${bw.toFixed(1)} oct` : hasSlope(bandId) && slope ? fmtDb(slope.atCutoffDb) : region.name}</b><span>{hasQ(bandId) ? 'wide, between half-power points' : hasSlope(bandId) ? 'at the cutoff' : 'the region for the ear'}</span></div>
                    {ext ? (
                        <>
                            <div><b>{fmtDb(peak.maxDb)}</b><span>curve peak at {fmtHz(peak.maxHz)}<span className={styles.ext}>EXT</span></span></div>
                            <div><b>{trimDb ? fmtDb(trimDb) : 'off'}</b><span>level match trim<span className={styles.ext}>EXT</span></span></div>
                        </>
                    ) : (
                        <>
                            <div><b>{fmtDb(peak.maxDb)}</b><span>the curve&apos;s biggest boost</span></div>
                            <div><b>{fmtDb(peak.minDb)}</b><span>its deepest cut</span></div>
                        </>
                    )}
                </div>
                {teach ? <div className={styles.meaning}>every number here comes from the dials</div> : null}
                <Legal />
                <Why>Every number here comes from the dials: the band you chose, its frequency, its gain or slope, and what the whole curve adds up to. Those are the things an exam answer about EQ names first.</Why>
            </div>
        </>
    );

    const bar = (
        <>
            <Presets presets={PRESETS} presetId={state.presetId} onPreset={choosePreset} />
            <div className={styles.say} data-mode={mode} data-depth={depth}>{say}</div>
            <MoreButton open={further} onOpen={() => setFurther(true)} />
        </>
    );

    const more = further ? (
        <>
            <div className={styles.moreItem}>
                <span className={styles.eyebrow}>Mid band</span>
                <Chips
                    label="Mid band type"
                    options={[{ id: 'parametric', label: 'Parametric' }, { id: 'graphic', label: 'Graphic' }]}
                    value={state.graphic ? 'graphic' : 'parametric'}
                    onChange={(id) => { setState((s) => ({ ...s, graphic: id === 'graphic', band: 'mid', presetId: null })); touch('graphic'); }}
                />
            </div>
            <div className={styles.moreItem}>
                <span className={styles.eyebrow}>Level match</span>
                <Chips
                    label="Level match"
                    options={[{ id: 'off', label: 'Off' }, { id: 'on', label: 'On' }]}
                    value={state.match ? 'on' : 'off'}
                    onChange={(id) => { setState((s) => ({ ...s, match: id === 'on' })); touch('match'); }}
                />
            </div>
        </>
    ) : null;

    const hoverDef = hover ? BANDS[hover.id] : null;
    const stage = (
        <>
            <canvas
                ref={canvasRef}
                aria-label="The EQ curve over the spectrum of the source"
                role="img"
                onPointerDown={onStageDown}
                onPointerMove={onStageMove}
                onPointerUp={onStageUp}
                onPointerCancel={onStageUp}
                onPointerLeave={() => { if (!dragRef.current) setHover(null); }}
            />
            <div className={styles.stageNote}>
                <b>20 Hz to 20 kHz · ±{DB_SPAN} dB · {PATTERNS[state.source].label}</b>
                <span>{ORIENT}</span>
            </div>
            <div className={`${styles.stageLegend} ${styles.legendTop}`} aria-hidden="true">
                <span><i style={{ background: 'var(--gold-bright)' }} />the curve</span>
                <span><i style={{ background: 'var(--gen-1)', opacity: 0.5 }} />after EQ</span>
                <span><i style={{ background: 'rgba(255,255,255,0.35)' }} />before</span>
                {BAND_IDS.filter((id) => state[id].on).map((id) => (
                    <span key={id}><i style={{ background: BANDS[id].colour, borderRadius: '50%' }} />{BANDS[id].label}</span>
                ))}
            </div>
            {hover && teach && hoverDef ? (
                <div
                    className={styles.tip}
                    style={{
                        left: hover.x + 284 > hover.stageW ? hover.x - 286 : hover.x + 16,
                        top: Math.max(44, Math.min(hover.stageH - 120, hover.y - 30)),
                    }}
                >
                    <i>{hoverDef.name} · {fmtHz(hover.hz)}</i>
                    <p>
                        {hasGain(hover.id) ? <>{fmtDb(state[hover.id].gain)} {hover.id === 'mid' ? 'at the centre' : 'past the corner'}.</> : <>{state[hover.id].slope} dB/oct, {fmtDb(hover.db)} here at the cutoff.</>}
                        {' '}{regionOf(hover.hz).name}: {regionOf(hover.hz).line}. Drag the dot to move it.
                    </p>
                </div>
            ) : null}
            {!began ? (
                <div className={styles.begin}>
                    <button type="button" className={styles.beginBtn} onClick={() => audio.start()}>
                        <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1.2v9.6L11 6z" fill="currentColor" /></svg>
                        <span>
                            Play the bench
                            <small>Real drums through a real EQ. Headphones help.</small>
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
