'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BenchFrame from '@/components/bench/BenchFrame';
import { Dial, Chips, Why, MoreButton } from '@/components/bench/controls';
import { PlayColumn, Presets, Legal, ExamCallout, useBenchMode, useBenchDepth, DEPTHS } from '@/components/bench/BenchBits';
import { useBenchAudio, glide } from '@/components/bench/useBenchAudio';
import styles from '@/components/bench/bench.module.css';
import { memberTopicHref, useStudioArrival } from '@/lib/studio-return';
import { DEPTH_LINES, DEPTH_TEACH, hearingLine, judge, open as openMachine, nextMove, sectionOfLast, paperNumber, pictures } from '@/lib/bench/acoustics-depth';
import {
    STATION_IDS, STATIONS, TONE_IDS, TONES, LEVEL_IDS, LEVELS, CONTOURS,
    TARGET_IDS, TARGETS, PLACE_IDS, PLACES, ABSORB_IDS, ABSORB, SOURCE_IDS, SOURCES,
    BAND_IDS, BANDS, SECTIONS, TASKS,
    DELAY_MIN, DELAY_MAX, REFLECT_MIN, REFLECT_MAX, RT60_MIN, RT60_MAX,
    ROOM_MIN, ROOM_MAX, MASKER_MIN, MASKER_MAX, TARGET_DBFS, TONE_DBFS,
    COLOUR_LIMIT_MS, HEARING_LOW, HEARING_HIGH, BPM, BEATS_PER_BAR, MODEL_RATE,
    DB_FLOOR, DB_RT60, SPL_FLOOR, SPL_CEIL, SPL_AT_FULL_SCALE,
    sig3, round4, fmtSec, fmtMs, fmtHz, fmtDb, dbOfAmp, ampOfDb,
    impulse, bandTimes, evenness, criticalBandwidth, maskerHzOf, firstNotchHz, combDepthDb,
    readings, verdict, judgeAll, PRESETS, presetsFor, applyPreset, DEFAULT_STATE,
    setStation, setTone, setListen, setTarget, setPlace, setMasker, setTargetOn,
    setSource, setDelay, setReflect, setRt60, setRoom, setAbsorb, setProof,
    roomGain, reflectGain, delaySec, maskerGain, targetGain, toneGain,
    contourShape, maskShape, combShape, decayShape, delayFromComb, rt60FromDecay,
    paperBoxes, machineBoxes, stageOf,
} from '@/lib/bench/acoustics-model';

// The Acoustics bench (2.1): the eleventh bench, built 12 Sep 2026 to
// BENCH-STANDARD.md, replacing the 2024 page "Acoustics & Psychoacoustics"
// (Learn / Hearing Curve / Masking Lab / Room Treatment / Quiz / Reference
// tabs, scrolling, silent). Three stations on one stage: how loud a tone
// seems, one sound hiding another, and what a room does to a sound.
//
// lib/bench/acoustics-model.js holds every number: ISO 226's own contours,
// the two-slope masking spread, the comb's response and the impulse the
// ConvolverNode is given. The stage draws those same numbers, so the picture
// is the sound (law 6).
//
// The tones and the noise band are oscillators and a noise buffer, so the
// frame declares `synthesis` (law 5's one exception, law 9's gate): at these
// two stations the subject IS the tone. The Room station plays measured
// stems from the estate.
//
// Design record: docs/superpowers/specs/2026-09-12-acoustics-bench-design.md

const AUDIO = '/bench-audio/reverb';
const FILES = {
    snare: `${AUDIO}/snare.mp3`,
    vocal: `${AUDIO}/vocal.mp3`,
};

const CODE = '2.1 Acoustics';
const TITLE = 'Acoustics bench';

// Law 24: each of these must read whole at 1280 with the live readout at its
// widest, so none runs past about 107 characters.
//
// 12 Sep 2026: the picture now names itself on the stage (PICTURES in
// acoustics-depth.js), so this line no longer describes the drawing. It says
// what the station is about at this level, and nothing is said twice.
const ORIENTS = {
    loudness: {
        core: 'What a tone measures and how loud it seems are two different things. This is the difference.',
        alevel: 'The two marks the papers give for the ear: the range it covers, and where it is sensitive.',
        extension: 'Every tone leaves this bench at one level. The only thing here that is not flat is the ear.',
    },
    masking: {
        core: 'One sound raising the level another one needs. Nothing is taken away, the bar is raised.',
        alevel: 'The 2020 question: noise buried under one kind of music and plainly audible under another.',
        extension: 'The tone is never taken away. What moves is the level it has to beat before the ear finds it.',
    },
    room: {
        core: 'Two things a room does: one early copy that colours the sound, and a tail that runs on after it.',
        alevel: 'The 2024 question is worth sixteen marks, and half of it is the room the mic is standing in.',
        extension: 'The room is an answer the bench writes, then stamps on every sample of the stem.',
    },
};

// Set from scripts/measure-acoustics.mjs, not from the files' own RMS
// (BENCH-STANDARD, 29 Aug 2026: a bench balance is measured).
const SOURCE_TRIM = { snare: 0.72, vocal: 1 };
const XFADE = 0.06;
const MAX_DELAY = 0.06;

// ---- the graph -------------------------------------------------------------
// Loudness  osc -> gain -> master
// Masking   noise -> band-pass -> gain -> master ; osc -> gain -> master
// The Room  stem -> sum -> direct -> master
//           stem -> delay -> reflection -> sum        (the comb)
//           sum  -> send -> convolver -> master       (the tail)
// One analyser sits in front of the destination so the stage can draw what is
// really leaving the bench, beside the model's own curve.
function buildAcousticsGraph(ctx, input, master) {
    // the tone, and the 1 kHz reference the hold button swaps to
    const tone = ctx.createOscillator();
    tone.type = 'sine';
    tone.frequency.value = 100;
    const toneG = ctx.createGain();
    toneG.gain.value = 0;
    tone.connect(toneG);
    toneG.connect(master);
    tone.start();

    // the masking station: a target tone and a band of noise
    const targ = ctx.createOscillator();
    targ.type = 'sine';
    targ.frequency.value = 1000;
    const targG = ctx.createGain();
    targG.gain.value = 0;
    targ.connect(targG);
    targG.connect(master);
    targ.start();

    const noiseBuf = ctx.createBuffer(1, Math.round(ctx.sampleRate * 2), ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    let seed = 1103515245;
    for (let i = 0; i < nd.length; i += 1) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        nd[i] = (seed / 0x3fffffff) - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    noise.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 700;
    band.Q.value = 5;
    const maskG = ctx.createGain();
    maskG.gain.value = 0;
    noise.connect(band);
    band.connect(maskG);
    maskG.connect(master);
    noise.start();

    // the room
    const sum = ctx.createGain();
    const del = ctx.createDelay(MAX_DELAY);
    const refl = ctx.createGain();
    refl.gain.value = 0;
    input.connect(sum);
    input.connect(del);
    del.connect(refl);
    refl.connect(sum);

    const direct = ctx.createGain();
    direct.gain.value = 1;
    sum.connect(direct);
    direct.connect(master);

    const send = ctx.createGain();
    send.gain.value = 0;
    sum.connect(send);
    const conv = [ctx.createConvolver(), ctx.createConvolver()];
    const cg = [ctx.createGain(), ctx.createGain()];
    conv.forEach((c, i) => {
        c.normalize = false;
        send.connect(c);
        c.connect(cg[i]);
        cg[i].connect(master);
        cg[i].gain.value = i === 0 ? 1 : 0;
    });
    let active = 0;

    const meter = ctx.createAnalyser();
    meter.fftSize = 4096;
    meter.smoothingTimeConstant = 0.55;
    master.connect(meter);
    const spec = new Float32Array(meter.frequencyBinCount);
    const wave = new Float32Array(meter.fftSize);

    let held = false;
    let current = null;

    function setBuffer(buf) {
        if (!buf) return;
        const next = 1 - active;
        try { conv[next].buffer = buf; } catch { return; }
        const t = ctx.currentTime;
        for (const g of cg) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); }
        cg[next].gain.linearRampToValueAtTime(1, t + XFADE);
        cg[active].gain.linearRampToValueAtTime(0, t + XFADE);
        active = next;
    }

    function set(state) {
        current = state;
        const on = (station) => state.station === station;
        // the tone: held swaps it to the 1 kHz reference so the two can be compared
        tone.frequency.setTargetAtTime(held && on('loudness') ? 1000 : state.tone, ctx.currentTime, 0.01);
        glide(toneG.gain, on('loudness') ? toneGain() : 0, ctx);
        // the masker: held mutes it so the target can be checked
        const mHz = maskerHzOf(state);
        band.frequency.setTargetAtTime(mHz, ctx.currentTime, 0.02);
        band.Q.setTargetAtTime(Math.max(1, mHz / criticalBandwidth(mHz)), ctx.currentTime, 0.02);
        glide(maskG.gain, on('masking') && !held ? maskerGain(state) * 6 : 0, ctx);
        targ.frequency.setTargetAtTime(state.target, ctx.currentTime, 0.01);
        glide(targG.gain, on('masking') ? targetGain(state) : 0, ctx);
        // the room: held mutes the reflection and the tail, leaving the direct
        glide(refl.gain, on('room') && !held ? reflectGain(state) : 0, ctx);
        glide(del.delayTime, delaySec(state), ctx, 0.04);
        glide(direct.gain, on('room') ? 1 - roomGain(state) : 0, ctx);
        glide(send.gain, on('room') && !held ? roomGain(state) : 0, ctx);
    }

    function holdDry(next) {
        held = next;
        if (current) set(current);
    }
    function clear() {
        for (const c of conv) {
            const b = c.buffer;
            try { c.buffer = null; c.buffer = b; } catch { /* the engine kept it, fine */ }
        }
    }
    function level() {
        meter.getFloatTimeDomainData(wave);
        let s = 0;
        for (let i = 0; i < wave.length; i += 1) s += wave[i] * wave[i];
        return Math.sqrt(s / wave.length);
    }
    function spectrum() {
        meter.getFloatFrequencyData(spec);
        return { data: spec, rate: ctx.sampleRate, bins: meter.frequencyBinCount };
    }
    return { set, setBuffer, holdDry, clear, level, spectrum };
}

// ---- the bench -------------------------------------------------------------
export default function AcousticsBench({ back }) {
    const [state, setState] = useState(DEFAULT_STATE);
    const [further, setFurther] = useState(false);
    const [mode, setMode] = useBenchMode();
    const [depth, setDepth] = useBenchDepth();
    const [hover, setHover] = useState(null);
    const [last, setLast] = useState('preset');
    const [announce, setAnnounce] = useState(null);
    const [sr, setSr] = useState(MODEL_RATE);
    const stateRef = useRef(state);
    const { studioOrigin } = useStudioArrival();
    const teach = mode === 'teacher';
    const station = state.station;

    // ---- audio ----
    const onSchedule = useCallback(({ bar, barStart, beatSec, playBuffer }) => {
        const s = stateRef.current;
        if (s.station !== 'room') return;
        const src = SOURCES[s.source];
        if (bar % src.bars !== 0) return;
        for (const b of src.beats) playBuffer(src.file, barStart + b * beatSec, { gain: SOURCE_TRIM[s.source] });
    }, []);
    const audio = useBenchAudio({ files: FILES, bpm: BPM, beatsPerBar: BEATS_PER_BAR, onSchedule, buildGraph: buildAcousticsGraph });
    const { ctxRef, nodesRef, began, playing, start, stop, restart } = audio;
    const playingRef = useRef(false);

    // The answer is built at the context's own rate: headless Chromium runs
    // at 48 kHz and a browser may not, so read it rather than assume it.
    useEffect(() => {
        if (began && ctxRef.current && ctxRef.current.sampleRate !== sr) setSr(ctxRef.current.sampleRate);
    }, [began, sr, ctxRef]);
    const imp = useMemo(() => impulse({ rt60: state.rt60, absorb: state.absorb }, sr), [state.rt60, state.absorb, sr]);

    useEffect(() => {
        const ctx = ctxRef.current;
        const graph = nodesRef.current?.graph;
        if (!ctx || !graph) return;
        const buf = ctx.createBuffer(2, imp.left.length, imp.sampleRate);
        buf.copyToChannel(imp.left, 0);
        buf.copyToChannel(imp.right, 1);
        graph.setBuffer(buf);
    }, [imp, began, ctxRef, nodesRef]);

    useEffect(() => { nodesRef.current?.graph?.set(state); }, [state, began, nodesRef]);
    useEffect(() => {
        const ctx = ctxRef.current;
        const nodes = nodesRef.current;
        if (ctx && nodes) glide(nodes.level.gain, state.level, ctx);
    }, [state.level, began, ctxRef, nodesRef]);

    // ---- edits ----
    const touch = (what) => { setLast(what); setAnnounce(null); };
    const chooseDepth = (id) => { setDepth(id); setAnnounce(id); };
    const edit = (fn, what) => (v) => { setState((s) => fn(s, v)); touch(what); };
    const chooseStation = (id) => {
        stateRef.current = setStation(stateRef.current, id);
        setState((s) => setStation(s, id));
        touch('station');
        if (playingRef.current) restart();
    };
    const chooseSource = (id) => {
        stateRef.current = setSource(stateRef.current, id);
        setState((s) => setSource(s, id));
        touch('source');
        if (playingRef.current) restart();
    };
    const choosePreset = (id) => {
        const preset = PRESETS.find((p) => p.id === id);
        if (!preset) return;
        const next = applyPreset(stateRef.current, id);
        const fresh = next.station !== stateRef.current.station || next.source !== stateRef.current.source;
        stateRef.current = next;
        setState(next);
        touch('preset');
        if (fresh && playingRef.current) restart();
    };
    const togglePlay = useCallback(() => (playingRef.current ? stop() : start()), [start, stop]);

    // The space bar is the transport, wherever the focus is, as in a DAW.
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

    const rd = readings(state);
    const vdd = verdict(state);
    const grades = judgeAll(state);

    // ---- the stage ----
    const canvasRef = useRef(null);
    const readRef = useRef(null);
    const geomRef = useRef(null);
    const dragRef = useRef(null);
    const depthRef = useRef(depth);
    const vddRef = useRef(vdd);
    const gradesRef = useRef(grades);

    // The draw loop is born once and reads these, so they are refreshed here
    // rather than during render: a ref written while rendering is a value the
    // renderer cannot see change.
    useEffect(() => {
        stateRef.current = state;
        playingRef.current = playing;
        depthRef.current = depth;
        vddRef.current = vdd;
        gradesRef.current = grades;
    });

    useEffect(() => {
        const first = canvasRef.current;
        if (!first) return undefined;
        let raf = 0;
        const css = getComputedStyle(first.parentElement);
        const v = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
        const col = {
            hit: v('--hit', '#f6f3ec'),
            one: v('--gen-1', '#7fb39b'),
            two: v('--gen-2', '#7fb0c4'),
            gold: v('--gold-bright', '#f0d48a'),
            purple: '#a395c9',
            ink: 'rgba(255, 255, 255, 0.62)',
            faint: 'rgba(255, 255, 255, 0.38)',
            grid: 'rgba(255, 255, 255, 0.08)',
            gridStrong: 'rgba(255, 255, 255, 0.2)',
            white: '#ffffff',
        };
        const monoFace = v('--mono', 'monospace');
        const mono = `11.5px ${monoFace}`;
        const monoSmall = `10px ${monoFace}`;
        const bandCol = { low: col.gold, mid: col.one, high: col.two };

        function draw() {
            const canvas = canvasRef.current;
            if (!canvas) { raf = requestAnimationFrame(draw); return; }
            const g = canvas.getContext('2d');
            const s = stateRef.current;
            const d = depthRef.current;
            const dpr = window.devicePixelRatio || 1;
            const w = canvas.clientWidth;
            const h = canvas.clientHeight;
            if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
                canvas.width = Math.round(w * dpr);
                canvas.height = Math.round(h * dpr);
            }
            g.setTransform(dpr, 0, 0, dpr, 0, 0);
            g.clearRect(0, 0, w, h);

            const padL = 48;
            const padR = 22;
            const top = 56;
            const bottom = h - 32;
            const pics = pictures(s.station, d);
            let handle = null;
            let tailHandle = null;

            if (d === 'core' && s.station === 'room') {
                // two pictures, because a room does two things: the comb the
                // reflection makes, and the tail the walls leave behind. Each
                // one carries its own name, so neither has to be guessed at.
                const axis = 22;
                const half = Math.round((bottom - top - 2 * HEAD - axis) / 2);
                const upper = { x0: padL, y0: top + HEAD, x1: w - padR, y1: top + HEAD + half };
                const lowTop = upper.y1 + axis;
                const lower = { x0: padL, y0: lowTop + HEAD, x1: w - padR, y1: bottom };
                drawHead(g, padL, w - padR, top, col, monoFace, pics[0], `${fmtMs(s.delay)} behind, ${s.delay <= COLOUR_LIMIT_MS ? 'heard as a colouration' : 'heard as a separate bounce'}`);
                drawHead(g, padL, w - padR, lowTop, col, monoFace, pics[1], `${ABSORB[s.absorb].label.toLowerCase()}, widest gap ${evenness(s.rt60, s.absorb).toFixed(1)} to 1`);
                handle = drawComb(g, s, upper, col, mono, monoSmall, nodesRef, playingRef);
                tailHandle = drawDecay(g, s, lower, col, mono, monoSmall, bandCol);
                geomRef.current = { d, comb: combShape(s, upper), decay: decayShape(s, lower) };
            } else {
                // the paper and the machine have no axis under them, so they
                // take back the strip Core keeps for its frequency labels and
                // the head costs them almost nothing
                const box = { x0: padL, y0: top + HEAD, x1: w - padR, y1: d === 'core' ? bottom : h - 12 };
                drawHead(g, padL, w - padR, top, col, monoFace, pics[0]);
                if (d === 'core') {
                    if (s.station === 'loudness') drawContours(g, s, box, col, mono, monoSmall, w, padL, padR, bottom);
                    else drawMasking(g, s, box, col, mono, monoSmall, bottom, nodesRef, playingRef);
                } else if (d === 'alevel') {
                    drawPaper(g, s, box, col, mono, monoSmall, gradesRef.current, vddRef.current);
                    geomRef.current = { d, p: paperBoxes(s, box) };
                } else {
                    drawMachine(g, s, box, col, mono, monoSmall);
                    geomRef.current = { d, m: machineBoxes(s, box) };
                }
            }

            // the live readout in its reserved slot (law 24)
            if (readRef.current) {
                const graph = nodesRef.current?.graph;
                const lvl = graph && playingRef.current ? graph.level() : null;
                const txt = lvl == null ? ' · stopped' : ` · out ${Math.max(-99, Math.round(dbOfAmp(lvl)))} dB`;
                if (readRef.current.textContent !== txt) readRef.current.textContent = txt;
            }

            // what this frame drew, told to the DOM for check-bench
            const set = (key, val) => { if (canvas.dataset[key] !== val) canvas.dataset[key] = val; };
            set('station', s.station);
            set('stage', stageOf(d));
            set('notchHz', String(Math.round(firstNotchHz(s.delay))));
            set('rt60', String(sig3(s.rt60)));
            set('verdict', vddRef.current.key);
            set('handle', handle ? `${Math.round(handle.x)}:${Math.round(handle.y)}` : '');
            set('tailhandle', tailHandle ? `${Math.round(tailHandle.x)}:${Math.round(tailHandle.y)}` : '');
            set('title', pics.map((pp) => pp.title).join(' / '));
            set('caption', pics.map((pp) => pp.caption).join(' / '));

            raf = requestAnimationFrame(draw);
        }
        raf = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(raf);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ---- the stage's pointer ----
    const nearHandle = (px, py, which) => {
        const c = canvasRef.current;
        const tag = which === 'tail' ? c?.dataset.tailhandle : c?.dataset.handle;
        if (!tag) return false;
        const [hx, hy] = tag.split(':').map(Number);
        return Math.hypot(hx - px, hy - py) <= 16;
    };
    const hitBox = (px, py) => {
        const gm = geomRef.current;
        const boxes = gm?.p?.boxes || gm?.m?.boxes;
        if (!boxes) return null;
        return boxes.find((b) => px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) || null;
    };
    const onStageDown = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        if (nearHandle(px, py, 'comb')) {
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            dragRef.current = { kind: 'comb', shape: geomRef.current?.comb };
            touch('stageComb');
            return;
        }
        if (nearHandle(px, py, 'tail')) {
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            dragRef.current = { kind: 'tail', shape: geomRef.current?.decay };
            touch('stageTail');
            return;
        }
        const b = hitBox(px, py);
        if (b?.section) touch(b.section === 'walls' ? 'absorb' : b.section === 'tail' ? 'rt60' : b.section === 'reflection' ? 'delay' : b.section);
    };
    const onStageMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        if (dragRef.current?.kind === 'comb' && dragRef.current.shape) {
            const shape = dragRef.current.shape;
            setState((st) => setDelay(st, delayFromComb(shape, px)));
            return;
        }
        if (dragRef.current?.kind === 'tail' && dragRef.current.shape) {
            const shape = dragRef.current.shape;
            setState((st) => setRt60(st, rt60FromDecay(shape, px)));
            return;
        }
        if (nearHandle(px, py, 'comb') || nearHandle(px, py, 'tail')) {
            if (hover?.kind !== 'handle') setHover({ kind: 'handle', x: px, y: py, stageW: rect.width, stageH: rect.height });
            return;
        }
        if (!teach) { if (hover) setHover(null); return; }
        const b = hitBox(px, py);
        if (b?.section) {
            if (hover?.kind === 'box' && hover.id === b.id) return;
            setHover({ kind: 'box', id: b.id, section: b.section, label: b.label, x: px, y: py, stageW: rect.width, stageH: rect.height });
            return;
        }
        if (hover) setHover(null);
    };
    const onStageUp = (e) => {
        if (!dragRef.current) return;
        dragRef.current = null;
        try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* gone */ }
    };

    // ---- drawer ----
    const topicHref = useCallback((slug) => memberTopicHref(null, slug, studioOrigin), [studioOrigin]);
    const drawerTabs = useMemo(() => [
        {
            id: 'reference',
            label: 'Reference',
            render: () => (
                <>
                    <h2>Acoustics, in the spec&apos;s words</h2>
                    <p>The specification asks for &quot;the effect of room acoustics on a recording&quot;, &quot;absorption, diffusion and reflection&quot;, &quot;reverberation time (RT60)&quot;, &quot;standing waves and room modes&quot; and, under psychoacoustics, &quot;the frequency range of human hearing&quot; and &quot;masking&quot;. Those are the three stations here. The bench&apos;s own numbers, said as its own and not as the exam&apos;s: the two listening levels it draws (40 and 90 dB SPL), the assumption that full scale is 100 dB SPL, the three band edges of the tail, and the 3 kHz tone, which is here because the ear is most sensitive between 2 and 5 kHz.</p>
                    <h3>Terms</h3>
                    <dl>
                        <dt>Equal-loudness contour</dt><dd>A line joining the levels at which tones of different frequencies sound equally loud. The curves on this stage are ISO 226:2003&apos;s own formula, not a sketch. At 1 kHz the phon and the decibel are the same number, which is what the phon is defined by.</dd>
                        <dt>Masking</dt><dd>One sound raising the level another needs before it can be heard. This bench never removes the target; it only raises the bar, and the readout says by how much.</dd>
                        <dt>Critical band</dt><dd>The width of the ear&apos;s own analysis at a frequency, about 100 Hz below 500 Hz and about a fifth of the centre frequency above. The masker here is a band of noise exactly that wide.</dd>
                        <dt>Upward spread of masking</dt><dd>A masker reaches further up the spectrum than down, and further still as it gets louder. Move the masker Above the target and it barely touches it; move it Below and it takes it.</dd>
                        <dt>Comb filtering</dt><dd>The peaks and notches a signal gets when it is summed with a short delayed copy of itself. The first notch sits at 1/(2T), and the rest follow at odd multiples of it.</dd>
                        <dt>Reverberation time (RT60)</dt><dd>How long the reflected sound takes to fall by 60 decibels after the source stops. On the stage it is where the line crosses the marked floor, and you can drag it.</dd>
                        <dt>Absorption and diffusion</dt><dd>Absorption removes energy and shortens the tail. Diffusion scatters it without removing it. Thin panels reach the mid and high frequencies only; bass traps are what reach the low end.</dd>
                        <dt>Soundproofing</dt><dd>Stopping sound passing through a structure to the outside or the next room. It is not acoustic treatment and it does nothing to the reflections inside a room, which is why the chip on this bench changes nothing you can hear.</dd>
                    </dl>
                    <h3>In your DAW</h3>
                    <table>
                        <thead><tr><th>On this bench</th><th>Ableton Live</th><th>Logic Pro</th></tr></thead>
                        <tbody>
                            <tr><td>Reflection delay</td><td>Delay: Delay Time in ms, Feedback at zero</td><td>Sample Delay, or Echo with no repeats</td></tr>
                            <tr><td>Reflection level</td><td>Delay: Dry/Wet</td><td>Echo: Mix</td></tr>
                            <tr><td>Reverb time</td><td>Reverb: Decay Time; Hybrid Reverb</td><td>ChromaVerb: Decay; Space Designer: Length</td></tr>
                            <tr><td>Room level</td><td>Reverb: Dry/Wet, or a Return track send</td><td>Mix slider, or a Bus send to an Aux</td></tr>
                            <tr><td>Walls (the tail&apos;s high end)</td><td>Reverb: High Shelf in the Diffusion Network</td><td>ChromaVerb: Damping; Space Designer: Filter</td></tr>
                            <tr><td>Masker band</td><td>Noise in Operator, then EQ Eight in Bandpass</td><td>Test Oscillator noise, then Channel EQ</td></tr>
                        </tbody>
                    </table>
                    <p className={styles.source}>Control names as they appear in Live 12 and Logic Pro 11 device panels. Check against your own version if they move.</p>
                    <h3>Beyond the paper<span className={styles.ext}>EXT</span></h3>
                    <dl>
                        <dt>Where the contours come from</dt><dd>ISO 226:2003 tabulates three values at each of 29 frequencies and gives one formula that turns them into a contour. This bench carries the table and runs the formula, which is why the curve at 1 kHz returns its own level exactly.</dd>
                        <dt>The Bark scale</dt><dd>Masking spread is not measured in hertz but in critical bands. Zwicker and Terhardt&apos;s 1980 formula turns a frequency into a band number, and the spread is a straight line in those units: 27 dB per band downward, and upward a slope that flattens as the masker gets louder.</dd>
                        <dt>Why the notches are odd multiples</dt><dd>A copy delayed by T is half a cycle late at 1/(2T), and half a cycle late again at three times that, five times that, and so on. The peaks fall between them, wherever the copy is a whole cycle late.</dd>
                        <dt>Why 60 decibels</dt><dd>Wallace Sabine measured reverberation as the time a sound takes to fall to inaudibility in a quiet hall, which is about 60 dB below where it started. Each band of this tail runs under exp(-6.91 t / T), which is exactly -60 dB at t = T.</dd>
                    </dl>
                    <p className={styles.source}>ISO 226:2003, Table 1 and §4.1; Zwicker and Terhardt, Journal of the Acoustical Society of America 68 (1980); Sabine, Collected Papers on Acoustics (1922).</p>
                </>
            ),
        },
        {
            id: 'teacher',
            label: 'Teacher',
            render: () => (
                <>
                    <h2>What the examiners keep writing</h2>
                    <p>Acoustics is almost never asked by name. It is marked inside the Section B evaluation, where the question says &quot;including the studio environment&quot;, and the reports say the same thing about it three years running. Read them, then set the fault on the bench and listen to it.</p>
                    <h3>The word that loses the marks</h3>
                    <p>2018: &quot;Few students seemed to have a real depth of knowledge about room acoustics and how they affect a recording. Many referred to the acoustic treatment as &apos;sound proofing&apos; which is a completely different thing.&quot;</p>
                    <p>2022: &quot;Many responses used the word &apos;sound proofing&apos; which is not correct in the context of acoustic treatment. Sound proofing is a vague term at the best of times but refers to the reduction of transmission of sound through building structures. Studios do not necessarily need to be sound proofed, except the live room needs some isolation from the control room.&quot;</p>
                    <p>2026: &quot;It is worthy of note that candidates continue to refer to &apos;soundproofing&apos; when answering questions about acoustics in music technology; this shows a misunderstanding about the purpose of the acoustic treatment visible in the studio. This cannot be seen in the picture, and thus cannot be credited.&quot;</p>
                    <p className={styles.source}>Sources: Edexcel Principal Examiner Feedback, 8MT0/41 Summer 2018 Q6; 8MT0/41 Summer 2022 Q6; 9MT0/04 Summer 2026 Q6.</p>
                    <h3>What a treated wall actually reaches</h3>
                    <p>2018, on the tiles in the photograph: &quot;Tiles will reduce reflection of mid range and high frequencies. Tiles not thick so will not reduce low frequencies. The wall is not completely covered with tiles so the room is not completely dead.&quot; 2024 says it again: &quot;Only reduces mid and high frequency reflections. Too much acoustic treatment loses room character.&quot; And the other way round, 2022: &quot;a control room does not want to be completely acoustically dead as this is an uncomfortable environment for most people.&quot;</p>
                    <p className={styles.source}>Sources: Edexcel mark schemes 8MT0/41 Summer 2018 Q6 and Summer 2024 Q6; Principal Examiner Feedback 8MT0/41 Summer 2022 Q6.</p>
                    <h3>Where comb filtering earns its mark</h3>
                    <p>No paper in nine years asks for the term. It is credited as an explanation attached to something visible: 2021, on two mics on one kit, &quot;The side mic is closer to the snare than the overhead mic. Mics should be equidistant from the snare. Delay between two mics. Phase problems. Comb filtering&quot;, and on a mic near a wall, &quot;Destructive interference/comb filtering from reflections&quot;. 2024 marks the mechanism on its own: a wave added to its own inversion gives &quot;Silence / destructive interference / cancel out / cancellation&quot;.</p>
                    <p className={styles.source}>Sources: Edexcel mark schemes 9MT0/04 Summer 2021 Q6 and 9MT0/41 Summer 2024 Q4(c) and (d).</p>
                    <h3>Do these now</h3>
                    <ul>
                        <li>Press <b>Judge: soundproofing</b> and hold the compare button while it plays. Nothing moves. Say in one sentence what soundproofing would have changed, and where.</li>
                        <li>Press <b>2024 AS paper</b>, read the low and high numbers in the Hear panel, then press <b>Treated</b>. Name the thing that made the difference in the low end.</li>
                        <li>Press <b>2021 paper</b> and drag Delay from 3 ms up past 25. Say where the colouration stops and a bounce starts, and why the ear changes its mind.</li>
                        <li>On <b>Masking</b>, put the masker Above the target and take its level to the top. Then move it Below at the same level. That difference is the upward spread of masking.</li>
                        <li>On <b>Loudness</b>, press Quiet and then Loud on the 100 Hz tone without touching anything else. The output has not moved; the drawing has.</li>
                    </ul>
                    <h3>Exam practice</h3>
                    <ExamCallout
                        prompt="A photograph shows fabric panels on the walls of a live room. A candidate writes that the room has been soundproofed. Why does that score nothing?"
                        answer="Soundproofing is the reduction of sound transmission through a structure. Panels on a wall are acoustic treatment: they absorb reflections inside the room to control reverberation and comb filtering. The 2026 report says this cannot be seen in the picture and cannot be credited."
                    />
                    <ExamCallout
                        prompt="Two microphones are placed on one snare drum at different distances. What is the risk, and what are the two fixes?"
                        answer="The two signals arrive at different times, so summing them cancels at a series of frequencies: comb filtering. The 2021 scheme credits moving the microphones so they are equidistant, and the polarity or phase button on the desk."
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
                    <a className={styles.conn} href={topicHref('reverb')}>
                        <i>1.12 Reverb</i>
                        <b>The same tail, on a dial</b>
                        <span>The Reverb bench sets the space rather than measuring it: the same minus sixty, reached from the other side.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('eq-and-filters')}>
                        <i>1.11 EQ</i>
                        <b>Masking, and the ear that causes it</b>
                        <span>Critical bands and the equal-loudness contours are the EQ chapter&apos;s own ground. This is what they sound like.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('microphones')}>
                        <i>1.2 Microphones</i>
                        <b>Two mics on one source</b>
                        <span>Where the comb on this bench comes from in a real session, and the two things a scheme credits for fixing it.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('monitor-speakers')}>
                        <i>2.2 Monitor Speakers</i>
                        <b>The room the monitors are in</b>
                        <span>The control room question is this bench and the monitor question in one answer, and it is worth sixteen marks.</span>
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
        const lead = colon > 0 && colon < 44 ? segs[0].text.slice(0, colon + 1) : null;
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
        say = teach
            ? <>{hearingLine(state)} <b>Try:</b> {nextMove(state)}.</>
            : <>{hearingLine(state)}</>;
    }

    // ---- console ----
    const stationChips = (
        <div className={`${styles.sec} ${styles.secAcStation}`} data-teach={teach || undefined}>
            <div className={styles.secHead}><span className={styles.eyebrow}>Station</span></div>
            <div className={styles.srcCol} role="group" aria-label="Station">
                {STATION_IDS.map((id) => (
                    <button key={id} type="button" className={styles.srcBtn} aria-pressed={station === id} onClick={() => chooseStation(id)} title={`${STATIONS[id].said}`}>
                        {STATIONS[id].label}
                    </button>
                ))}
            </div>
            <Why>Three things that happen between a sound and an ear: how loud a tone seems, one sound hiding another, and what a room does on the way. Each one redraws the stage and changes the controls beside it.</Why>
        </div>
    );

    const holdFor = {
        loudness: { label: 'hold: 1 kHz', title: 'Hold to swap the tone for the 1 kHz reference', why: 'swaps your tone for the 1 kHz reference at the same level, so the two can be compared by ear' },
        masking: { label: 'hold: no mask', title: 'Hold to mute the masker and hear the target alone', why: 'mutes the noise while you hold it, so you can hear whether the tone was there all along' },
        room: { label: 'hold: direct', title: 'Hold to mute the reflection and the room', why: 'mutes the reflection and the tail while you hold it, so you can hear what the room was adding' },
    }[station];

    const consoleSlot = (
        <>
            <PlayColumn
                playing={playing}
                onTogglePlay={togglePlay}
                onHoldDry={(held) => nodesRef.current?.graph?.holdDry(held)}
                level={state.level}
                onLevel={(v) => setState((s) => ({ ...s, level: v }))}
                teach={teach}
                holdLabel={holdFor.label}
                holdTitle={holdFor.title}
                holdWhy={holdFor.why}
                playWhy={station === 'room' ? 'plays the stem round its loop, with room after it for the tail' : 'holds the tones on, so a change is heard at once'}
            />
            {stationChips}

            {station === 'loudness' ? (
                <>
                    <div className={`${styles.sec} ${styles.secAcTone}`} data-teach={teach || undefined}>
                        <div className={styles.secHead}>
                            <span className={styles.eyebrow} data-hot="true">Tone</span>
                            <span className={styles.value}>{TONES[state.tone].label}</span>
                        </div>
                        <Chips label="Tone" options={TONE_IDS.map((id) => ({ id, label: TONES[id].label, title: `${TONES[id].said}: ${TONES[id].part}` }))} value={state.tone} onChange={edit(setTone, 'tone')} />
                        <div className={styles.meaning}>every tone at {fmtDb(TONE_DBFS)}</div>
                        <Why>Four tones at one level. 1 kHz is the reference the phon is defined against; 3 kHz is where the ear canal resonates; 100 Hz and 10 kHz are the two ends the paper asks about.</Why>
                    </div>
                    <div className={`${styles.sec} ${styles.secAcListen}`} data-teach={teach || undefined}>
                        <div className={styles.secHead}><span className={styles.eyebrow}>Listening</span></div>
                        <Chips label="Listening level" options={LEVEL_IDS.map((id) => ({ id, label: LEVELS[id].label, title: `the ${LEVELS[id].phon} dB SPL contour` }))} value={state.listen} onChange={edit(setListen, 'listen')} />
                        <div className={styles.meaning}>{LEVELS[state.listen].phon} dB SPL at 1 kHz</div>
                        <Why>How loudly the listener has it. The bench cannot know, so it says which contour it is drawing. Quiet is 40 dB SPL and loud is 90, the two the mixing advice is usually about.</Why>
                    </div>
                </>
            ) : null}

            {station === 'masking' ? (
                <>
                    <div className={`${styles.sec} ${styles.secAcTarget}`} data-teach={teach || undefined}>
                        <div className={styles.secHead}>
                            <span className={styles.eyebrow}>Target</span>
                            <span className={styles.value}>{TARGETS[state.target].label}</span>
                        </div>
                        <Chips label="Target" options={TARGET_IDS.map((id) => ({ id, label: TARGETS[id].label }))} value={state.target} onChange={edit(setTarget, 'target')} />
                        <Chips
                            label="Target on"
                            options={[{ id: 'on', label: 'On' }, { id: 'off', label: 'Off' }]}
                            value={state.targetOn ? 'on' : 'off'}
                            onChange={(v) => { setState((s) => setTargetOn(s, v === 'on')); touch('targetOn'); }}
                        />
                        <Why>The tone the masker is being asked to hide, held at {fmtDb(TARGET_DBFS)} throughout. Switch it off and on while the noise plays: if you cannot tell, it is masked.</Why>
                    </div>
                    <div className={`${styles.sec} ${styles.secAcMasker}`} data-teach={teach || undefined}>
                        <div className={styles.secHead}>
                            <span className={styles.eyebrow} data-hot="true">Masker</span>
                            <span className={styles.value}>{fmtHz(rd.maskerHz)}</span>
                        </div>
                        <Chips label="Masker" options={PLACE_IDS.map((id) => ({ id, label: PLACES[id].label, title: `${Math.round(state.target * PLACES[id].ratio)} Hz` }))} value={state.place} onChange={edit(setPlace, 'place')} />
                        <div className={styles.knob}>
                            <Dial
                                label="Masker level"
                                value={state.masker}
                                min={MASKER_MIN}
                                max={MASKER_MAX}
                                step={1}
                                unit="dB"
                                pointer="var(--gold)"
                                hot
                                pixels={240}
                                onChange={edit(setMasker, 'masker')}
                                title="How loud the band of noise is"
                            />
                            <span className={styles.value}>{fmtDb(state.masker)}</span>
                        </div>
                        <Why>A band of noise one critical band wide, {Math.round(rd.bandwidth)} Hz here. Below the target it reaches up past it; above the target it barely reaches down at all.</Why>
                    </div>
                </>
            ) : null}

            {station === 'room' ? (
                <>
                    <div className={`${styles.sec} ${styles.secAcSource}`} data-teach={teach || undefined}>
                        <div className={styles.secHead}><span className={styles.eyebrow}>Source</span></div>
                        <div className={styles.srcCol} role="group" aria-label="Source">
                            {SOURCE_IDS.map((id) => (
                                <button key={id} type="button" className={styles.srcBtn} aria-pressed={state.source === id} onClick={() => chooseSource(id)} title={SOURCES[id].note}>
                                    {SOURCES[id].label}
                                </button>
                            ))}
                        </div>
                        <Why>A hit and a phrase. The snare shows a bounce you can hear arrive; the vocal shows the colouration a comb puts on a sustained sound.</Why>
                    </div>
                    <div className={`${styles.sec} ${styles.secAcPair}`} data-teach={teach || undefined}>
                        <div className={styles.secHead}>
                            <span className={styles.eyebrow} data-hot="true">Reflection</span>
                            <span className={styles.value} data-notch-hz={String(Math.round(rd.notch))}>{rd.notchText}</span>
                        </div>
                        <div className={styles.pairRow}>
                            <div className={styles.knob}>
                                <Dial label="Delay" value={state.delay} min={DELAY_MIN} max={DELAY_MAX} step={0.5} pointer="var(--gold)" hot pixels={220} format={(x) => fmtMs(x)} onChange={edit(setDelay, 'delay')} title="How far behind the direct sound the copy arrives. Drag the first notch on the stage to set it there." />
                                <span className={styles.slideVal} data-delay-ms={String(state.delay)}>{fmtMs(state.delay)}</span>
                                <span className={styles.slideName}>Delay</span>
                            </div>
                            <div className={styles.knob}>
                                <Dial label="Reflection level" value={state.reflect} min={REFLECT_MIN} max={REFLECT_MAX} step={1} pixels={220} format={(x) => fmtDb(x)} onChange={edit(setReflect, 'reflect')} title="How loud the copy is against the direct sound" />
                                <span className={styles.slideVal}>{fmtDb(state.reflect)}</span>
                                <span className={styles.slideName}>Level</span>
                            </div>
                        </div>
                        <Why>One copy of the sound, arriving late off a nearby surface. The first notch sits at 1/(2T), so a shorter delay pushes every notch up the spectrum. Past {COLOUR_LIMIT_MS} ms the ear hears a bounce instead.</Why>
                    </div>
                    <div className={`${styles.sec} ${styles.secAcPair}`} data-teach={teach || undefined}>
                        <div className={styles.secHead}>
                            <span className={styles.eyebrow}>Tail</span>
                            <span className={styles.value} data-rt60={String(sig3(state.rt60))}>{fmtSec(state.rt60)}</span>
                        </div>
                        <div className={styles.pairRow}>
                            <div className={styles.knob}>
                                <Dial label="Reverb time" value={state.rt60} min={RT60_MIN} max={RT60_MAX} step={0.05} pixels={220} format={(x) => fmtSec(x)} onChange={edit(setRt60, 'rt60')} title="RT60: how long the room takes to fall by 60 decibels. Drag the tail's end on the stage to set it there." />
                                <span className={styles.slideVal}>{fmtSec(state.rt60)}</span>
                                <span className={styles.slideName}>RT60</span>
                            </div>
                            <div className={styles.knob}>
                                <Dial label="Room level" value={state.room} min={ROOM_MIN} max={ROOM_MAX} step={1} pixels={220} format={(x) => `${x} %`} onChange={edit(setRoom, 'room')} title="The balance of reflected against direct sound, which is mostly set by how far the mic is from the source" />
                                <span className={styles.slideVal}>{state.room} %</span>
                                <span className={styles.slideName}>Room</span>
                            </div>
                        </div>
                        <Why>RT60 is the time for the reflected sound to fall 60 dB after the source stops. Room is the balance against the direct sound, which in a real session is set by moving the microphone.</Why>
                    </div>
                    <div className={`${styles.sec} ${styles.secAcWalls}`} data-teach={teach || undefined}>
                        <div className={styles.secHead}>
                            <span className={styles.eyebrow}>Walls</span>
                            <span className={styles.value}>{ABSORB[state.absorb].label}</span>
                        </div>
                        <Chips label="Walls" options={ABSORB_IDS.map((id) => ({ id, label: ABSORB[id].label, title: ABSORB[id].mech }))} value={state.absorb} onChange={edit(setAbsorb, 'absorb')} />
                        <Chips
                            label="Soundproofing"
                            options={[{ id: 'off', label: 'No proofing' }, { id: 'on', label: 'Soundproofing' }]}
                            value={state.proof ? 'on' : 'off'}
                            onChange={(v) => { setState((s) => setProof(s, v === 'on')); touch('proof'); }}
                        />
                        <Why>Absorption removes energy and shortens the tail; thin panels reach the mid and high only, and bass traps reach the low end. Soundproofing stops sound leaving the room, so it changes nothing you can hear in here.</Why>
                    </div>
                </>
            ) : null}

            <div className={`${styles.sec} ${styles.secHear}`} data-acoustics={station} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>What you should hear</span></div>
                <div className={styles.stats} aria-live="polite">
                    {station === 'loudness' ? (
                        <>
                            <div><b>{Math.round(rd.phon)} phon</b><span>how loud it seems</span></div>
                            <div><b>{Math.round(rd.gap)} phon</b><span>under the 1 kHz</span></div>
                            <div><b>{Math.round(rd.needs)} dB</b><span>to match it</span></div>
                            <div><b>{Math.round(rd.threshold)} dB</b><span>threshold here</span></div>
                        </>
                    ) : null}
                    {station === 'masking' ? (
                        <>
                            <div><b>{rd.masked ? 'gone' : 'heard'}</b><span>the target</span></div>
                            <div><b>{Math.round(rd.threshold)} dB</b><span>it now needs</span></div>
                            <div><b>{rd.marginText}</b><span>against {TARGET_DBFS} dB</span></div>
                            <div><b>{Math.round(rd.bandwidth)} Hz</b><span>critical band</span></div>
                        </>
                    ) : null}
                    {station === 'room' ? (
                        <>
                            <div><b>{rd.notchText}</b><span>first notch</span></div>
                            <div><b>{rd.depthText}</b><span>peak to notch</span></div>
                            <div><b>{fmtSec(rd.times.low)}</b><span>{BANDS.low.label}</span></div>
                            <div><b>{fmtSec(rd.times.high)}</b><span>{BANDS.high.label}</span></div>
                        </>
                    ) : null}
                </div>
                {teach ? <div className={styles.meaning}>every number here comes from the controls</div> : null}
                <Legal />
                <Why>Every number here comes from the controls beside it, and the same numbers make the picture on the stage and the sound in the graph.</Why>
            </div>
        </>
    );

    const bar = (
        <>
            <Presets presets={presetsFor(depth)} presetId={state.presetId} onPreset={choosePreset} wrap />
            <div className={styles.say} data-mode={mode} data-depth={depth}>{say}</div>
            <MoreButton open={further} onOpen={() => setFurther(true)} />
        </>
    );

    const more = further ? (
        <>
            <div className={styles.moreItem}>
                <span className={styles.eyebrow}>Evenness</span>
                <span className={styles.value}>{station === 'room' ? `${evenness(state.rt60, state.absorb).toFixed(1)} to 1` : 'n/a'}</span>
            </div>
            <div className={styles.moreItem}>
                <span className={styles.eyebrow}>Notches</span>
                <span className={styles.value}>{station === 'room' ? `${rd.notches} under 20 kHz` : 'n/a'}</span>
            </div>
            <div className={styles.moreItem}>
                <span className={styles.eyebrow}>Full scale</span>
                <span className={styles.value}>{SPL_AT_FULL_SCALE} dB SPL</span>
            </div>
            <div className={styles.moreItem}>
                <span className={styles.eyebrow}>Task</span>
                <span className={styles.value}>{state.task ? TASKS[state.task].cite : 'none set'}</span>
            </div>
        </>
    ) : null;

    const settingLine = station === 'loudness'
        ? `${TONES[state.tone].label} · ${LEVELS[state.listen].label.toLowerCase()}`
        : station === 'masking'
            ? `${TARGETS[state.target].label} · noise ${fmtHz(rd.maskerHz)} · ${fmtDb(state.masker)}`
            : `${fmtMs(state.delay)} · ${rd.notchText} · ${fmtSec(state.rt60)}`;

    const stage = (
        <>
            <canvas
                ref={canvasRef}
                aria-label={stageLabel(station, depth)}
                role="img"
                onPointerDown={onStageDown}
                onPointerMove={onStageMove}
                onPointerUp={onStageUp}
                onPointerCancel={onStageUp}
                onPointerLeave={() => { if (!dragRef.current) setHover(null); }}
            />
            <div className={styles.stageNote}>
                <b>{settingLine}<span ref={readRef} style={{ '--read': '14ch' }} /></b>
                <span>{ORIENTS[station][depth] || ORIENTS[station].core}</span>
            </div>
            <div className={`${styles.stageLegend} ${styles.legendTop}`} aria-hidden="true">
                {depth === 'core' && station === 'loudness' ? (
                    <>
                        <span><i style={{ background: 'var(--gen-1)' }} />equal loudness</span>
                        <span><i style={{ background: 'var(--gold-bright)' }} />your tone</span>
                        <span><i style={{ background: 'var(--gen-2)' }} />threshold of hearing</span>
                    </>
                ) : null}
                {depth === 'core' && station === 'masking' ? (
                    <>
                        <span><i style={{ background: 'var(--gen-2)' }} />what is playing</span>
                        <span><i style={{ background: 'var(--gen-1)' }} />the masker reaches here</span>
                        <span><i style={{ background: 'var(--gold-bright)' }} />the target</span>
                    </>
                ) : null}
                {depth === 'core' && station === 'room' ? (
                    <em>drag the first notch, or the tail&apos;s end</em>
                ) : null}
                {depth === 'alevel' ? <em>click a box for its verdict</em> : null}
                {depth === 'extension' ? <em>the nodes, in signal order</em> : null}
            </div>
            {hover && (teach || hover.kind === 'handle') ? (
                <div
                    className={styles.tip}
                    style={{
                        left: hover.x + 284 > hover.stageW ? hover.x - 286 : hover.x + 16,
                        top: Math.max(44, Math.min(hover.stageH - 130, hover.y - 30)),
                    }}
                >
                    {hover.kind === 'handle' ? (
                        <>
                            <i>The stage is the dial</i>
                            <p>Drag the notch marker and <b>Delay</b> follows it; drag the tail&apos;s end and <b>Reverb time</b> does. The numbers on the console are the numbers in the graph.</p>
                        </>
                    ) : (
                        <>
                            <i>{hover.label}{hover.section ? ` · ${SECTIONS[hover.section].name}` : ''}</i>
                            <p>{hover.section && grades[hover.section] ? grades[hover.section].why : 'What the sound starts as, before the room gets to it.'}{hover.section && grades[hover.section]?.cite ? ` ${grades[hover.section].cite}` : ''}</p>
                        </>
                    )}
                </div>
            ) : null}
            {!began ? (
                <div className={styles.begin}>
                    <button type="button" className={styles.beginBtn} onClick={() => audio.start()}>
                        <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1.2v9.6L11 6z" fill="currentColor" /></svg>
                        <span>
                            Play the bench
                            <small>Tones, a band of noise, and a snare in a real room. Headphones help.</small>
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
            orientation={ORIENTS[station][depth] || ORIENTS[station].core}
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

function stageLabel(station, depth) {
    return pictures(station, depth).map((p) => `${p.title}. ${p.caption}`).join(' ');
}

// ---- the picture's own name ------------------------------------------------
// Mike, 12 Sep 2026: "the visuals, as far as the graphs are concerned, I don't
// really follow what that is". Every picture now says what it is, above
// itself, in the register of the stage's own lines: the title bright, the one
// line under it faint, and the station's own live tag at the right where the
// old head line used to be. HEAD is what that costs the picture in height.
const HEAD = 32;
function drawHead(g, x0, x1, yTop, col, monoFace, picture, tag) {
    if (!picture) return;
    g.font = `10px ${monoFace}`;
    const tagW = tag ? g.measureText(tag).width + 24 : 0;
    if (tag) {
        g.textAlign = 'right';
        g.fillStyle = col.faint;
        g.fillText(tag, x1, yTop + 11);
    }
    g.textAlign = 'left';
    g.fillStyle = col.hit;
    g.font = `600 13px ${monoFace}`;
    g.fillText(fit(g, picture.title, x1 - x0 - tagW), x0, yTop + 11);
    g.fillStyle = col.ink;
    g.font = `11.5px ${monoFace}`;
    g.fillText(fit(g, picture.caption, x1 - x0), x0, yTop + 26);
}

// ---- the drawings ----------------------------------------------------------
function axisLogHz(g, box, xOf, col, monoSmall, labels) {
    g.font = monoSmall;
    g.textAlign = 'center';
    for (const hz of labels) {
        const x = Math.round(xOf(hz)) + 0.5;
        g.strokeStyle = col.grid;
        g.beginPath();
        g.moveTo(x, box.y0);
        g.lineTo(x, box.y1);
        g.stroke();
        g.fillStyle = col.faint;
        g.fillText(fmtHz(hz), x, box.y1 + 14);
    }
}

function drawContours(g, s, box, col, mono, monoSmall, w, padL, padR, bottom) {
    const sh = contourShape(s, box);
    // the dB grid
    g.font = monoSmall;
    g.textAlign = 'right';
    for (let db = 0; db <= 120; db += 20) {
        const y = Math.round(sh.yOf(db)) + 0.5;
        g.strokeStyle = col.grid;
        g.beginPath();
        g.moveTo(box.x0, y);
        g.lineTo(box.x1, y);
        g.stroke();
        g.fillStyle = col.faint;
        g.fillText(`${db}`, box.x0 - 8, y + 3.5);
    }
    g.save();
    g.translate(14, (box.y0 + box.y1) / 2);
    g.rotate(-Math.PI / 2);
    g.textAlign = 'center';
    g.fillStyle = col.faint;
    g.fillText('level (dB SPL)', 0, 0);
    g.restore();
    axisLogHz(g, box, sh.xOf, col, monoSmall, [20, 100, 1000, 10000, 20000]);

    // the threshold of hearing
    g.strokeStyle = col.two;
    g.setLineDash([3, 3]);
    g.lineWidth = 1.2;
    g.beginPath();
    sh.threshold.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
    g.stroke();
    g.setLineDash([]);

    // the contours, the current one drawn solid
    sh.curves.forEach((c) => {
        const here = c.phon === LEVELS[s.listen].phon;
        g.strokeStyle = here ? col.one : col.grid;
        g.lineWidth = here ? 2 : 1;
        g.beginPath();
        c.points.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
        g.stroke();
        g.fillStyle = here ? col.one : col.faint;
        g.font = monoSmall;
        g.textAlign = 'left';
        g.fillText(`${c.phon} phon`, c.points[c.points.length - 1][0] - 46, c.points[c.points.length - 1][1] - 5);
    });

    // ISO 226 is tabulated to 12.5 kHz, so the curves stop there and the stage
    // says so rather than letting the gap read as a rendering fault
    {
        const xe = sh.xOf(12500);
        g.strokeStyle = col.grid;
        g.setLineDash([2, 3]);
        g.beginPath();
        g.moveTo(xe, box.y0);
        g.lineTo(xe, box.y1);
        g.stroke();
        g.setLineDash([]);
        g.save();
        g.translate(xe + 11, box.y1 - 8);
        g.rotate(-Math.PI / 2);
        g.font = monoSmall;
        g.textAlign = 'left';
        g.fillStyle = col.faint;
        g.fillText('ISO 226 ends here', 0, 0);
        g.restore();
    }

    // the level every tone leaves at, drawn across
    g.strokeStyle = col.faint;
    g.setLineDash([2, 4]);
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(box.x0, sh.line);
    g.lineTo(box.x1, sh.line);
    g.stroke();
    g.setLineDash([]);
    g.fillStyle = col.ink;
    g.font = mono;
    g.textAlign = 'left';
    g.fillText(`every tone arrives here, ${LEVELS[s.listen].phon} dB SPL`, box.x0 + 6, sh.line - 7);

    // what the tone needs to match the reference, and what it is
    g.strokeStyle = col.gold;
    g.lineWidth = 1;
    g.setLineDash([3, 3]);
    g.beginPath();
    g.moveTo(sh.dot.x, sh.dot.y);
    g.lineTo(sh.needs.x, sh.needs.y);
    g.stroke();
    g.setLineDash([]);
    g.fillStyle = col.gold;
    g.beginPath();
    g.arc(sh.dot.x, sh.dot.y, 6, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = col.white;
    g.lineWidth = 1.5;
    g.stroke();
    const r = readings(s);
    g.font = mono;
    g.fillStyle = col.gold;
    g.textAlign = sh.dot.x > box.x1 - 130 ? 'right' : 'left';
    const off = sh.dot.x > box.x1 - 130 ? -10 : 10;
    g.fillText(`${fmtHz(s.tone)} seems ${Math.round(r.phon)} phon`, sh.dot.x + off, sh.dot.y + 18);
    if (Math.abs(sh.needs.y - sh.dot.y) > 14) {
        g.fillStyle = col.ink;
        g.font = monoSmall;
        g.fillText(`${Math.round(Math.abs(r.extra))} dB ${r.extra > 0 ? 'short of' : 'over'} the contour`, sh.needs.x + off, sh.needs.y - 8);
    }
}

function drawMasking(g, s, box, col, mono, monoSmall, bottom, nodesRef, playingRef) {
    const sh = maskShape(s, box);
    g.font = monoSmall;
    g.textAlign = 'right';
    for (let db = 0; db >= -90; db -= 20) {
        const y = Math.round(sh.yOf(db)) + 0.5;
        g.strokeStyle = col.grid;
        g.beginPath();
        g.moveTo(box.x0, y);
        g.lineTo(box.x1, y);
        g.stroke();
        g.fillStyle = col.faint;
        g.fillText(`${db}`, box.x0 - 8, y + 3.5);
    }
    g.save();
    g.translate(14, (box.y0 + box.y1) / 2);
    g.rotate(-Math.PI / 2);
    g.textAlign = 'center';
    g.fillStyle = col.faint;
    g.fillText('level (dB)', 0, 0);
    g.restore();
    axisLogHz(g, box, sh.xOf, col, monoSmall, [100, 1000, 10000, 20000]);

    // what is really leaving the bench, from the analyser
    drawSpectrum(g, sh, col, nodesRef, playingRef, sh.lo, sh.hi);

    // the masker's skirt: the level a tone needs to be heard past it
    g.beginPath();
    g.moveTo(sh.skirt[0][0], box.y1);
    for (const p of sh.skirt) g.lineTo(p[0], p[1]);
    g.lineTo(sh.skirt[sh.skirt.length - 1][0], box.y1);
    g.closePath();
    g.fillStyle = 'rgba(127, 179, 155, 0.20)';
    g.fill();
    g.strokeStyle = col.one;
    g.lineWidth = 1.6;
    g.beginPath();
    sh.skirt.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
    g.stroke();

    // the masker, marked on the frequency axis. Its band level is not a level
    // a per-bin trace can be compared against, so the marker names where it is
    // and the skirt above carries what it does.
    g.fillStyle = col.one;
    g.beginPath();
    g.moveTo(sh.masker.x, box.y1 - 9);
    g.lineTo(sh.masker.x - 6, box.y1 + 1);
    g.lineTo(sh.masker.x + 6, box.y1 + 1);
    g.closePath();
    g.fill();
    g.font = mono;
    g.textAlign = 'center';
    g.fillText(`masker ${fmtHz(sh.masker.hz)} at ${fmtDb(s.masker)}`, sh.masker.x, box.y1 - 16);

    // the target, and whether it clears the skirt
    const r = readings(s);
    if (s.targetOn) {
        g.strokeStyle = col.gold;
        g.lineWidth = 3;
        g.setLineDash(r.masked ? [4, 4] : []);
        g.beginPath();
        g.moveTo(sh.target.x, box.y1);
        g.lineTo(sh.target.x, sh.target.y);
        g.stroke();
        g.setLineDash([]);
        g.fillStyle = col.gold;
        g.font = mono;
        g.textAlign = sh.target.x > box.x1 - 120 ? 'right' : 'left';
        g.fillText(`${fmtHz(s.target)} ${r.masked ? 'masked' : 'heard'}`, sh.target.x + (sh.target.x > box.x1 - 120 ? -8 : 8), sh.target.y - 8);
        // the gap between what it is and what it needs
        g.strokeStyle = col.white;
        g.globalAlpha = 0.5;
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(sh.target.x - 7, sh.target.threshold);
        g.lineTo(sh.target.x + 7, sh.target.threshold);
        g.stroke();
        g.globalAlpha = 1;
        g.fillStyle = col.ink;
        g.font = monoSmall;
        g.textAlign = 'left';
        // kept clear of the target's own label when the two land together
        const near = Math.abs(sh.target.threshold - sh.target.y) < 22;
        g.fillText(`needs ${Math.round(r.threshold)} dB`, sh.target.x + 10, sh.target.threshold + (near ? 16 : 4));
    }
}

function drawSpectrum(g, sh, col, nodesRef, playingRef, lo, hi) {
    const graph = nodesRef.current?.graph;
    if (!graph || !playingRef.current || !graph.spectrum) return;
    const { data, rate, bins } = graph.spectrum();
    g.strokeStyle = col.two;
    g.globalAlpha = 0.55;
    g.lineWidth = 1;
    g.beginPath();
    let started = false;
    for (let i = 1; i < bins; i += 1) {
        const hz = (i * rate) / (bins * 2);
        if (hz < lo || hz > hi) continue;
        const x = sh.xOf(hz);
        const y = sh.yOf(data[i]);
        if (!started) { g.moveTo(x, y); started = true; } else g.lineTo(x, y);
    }
    g.stroke();
    g.globalAlpha = 1;
}

function drawComb(g, s, box, col, mono, monoSmall, nodesRef, playingRef) {
    const sh = combShape(s, box);
    g.font = monoSmall;
    g.textAlign = 'right';
    for (let db = 6; db >= -30; db -= 12) {
        const y = Math.round(sh.yOf(db)) + 0.5;
        g.strokeStyle = db === 0 ? col.gridStrong : col.grid;
        g.beginPath();
        g.moveTo(box.x0, y);
        g.lineTo(box.x1, y);
        g.stroke();
        g.fillStyle = col.faint;
        g.fillText(`${db}`, box.x0 - 8, y + 3.5);
    }
    axisLogHz(g, box, sh.xOf, col, monoSmall, [20, 100, 1000, 10000, 20000]);
    drawSpectrum(g, sh, col, nodesRef, playingRef, sh.lo, sh.hi);

    // the response the delay and the sum really have, drawn as the highest and
    // lowest it reaches in each column: one line where the notches are further
    // apart than a pixel, a band where they are not
    g.fillStyle = 'rgba(127, 179, 155, 0.30)';
    g.beginPath();
    sh.band.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
    for (let i = sh.band.length - 1; i >= 0; i -= 1) g.lineTo(sh.band[i][0], sh.band[i][2]);
    g.closePath();
    g.fill();
    g.strokeStyle = col.one;
    g.lineWidth = 1.4;
    g.beginPath();
    sh.band.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
    g.stroke();
    g.globalAlpha = 0.7;
    g.beginPath();
    sh.band.forEach((p, i) => (i ? g.lineTo(p[0], p[2]) : g.moveTo(p[0], p[2])));
    g.stroke();
    g.globalAlpha = 1;

    // the first notch, named, and the ones after it ticked
    g.strokeStyle = col.gold;
    g.lineWidth = 1;
    for (const m of sh.marks.slice(1)) {
        if (m.x <= box.x0 + 1) continue;
        g.globalAlpha = 0.35;
        g.beginPath();
        g.moveTo(Math.round(m.x) + 0.5, box.y1 - 6);
        g.lineTo(Math.round(m.x) + 0.5, box.y1);
        g.stroke();
    }
    g.globalAlpha = 1;
    g.fillStyle = col.gold;
    g.beginPath();
    g.arc(sh.handle.x, sh.handle.y, 6, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = col.white;
    g.lineWidth = 1.5;
    g.stroke();
    g.fillStyle = col.gold;
    g.font = mono;
    g.textAlign = sh.handle.x > box.x1 - 150 ? 'right' : 'left';
    const off = sh.handle.x > box.x1 - 150 ? -10 : 10;
    g.fillText(`first notch ${fmtHz(sh.first)}`, sh.handle.x + off, sh.handle.y + 16);
    return sh.handle;
}

function drawDecay(g, s, box, col, mono, monoSmall, bandCol) {
    const sh = decayShape(s, box);
    g.font = monoSmall;
    g.textAlign = 'right';
    for (let db = 0; db >= DB_FLOOR; db -= 12) {
        const y = Math.round(sh.yOf(db)) + 0.5;
        const named = db === DB_RT60;
        g.strokeStyle = named ? col.gridStrong : col.grid;
        g.setLineDash(named ? [4, 4] : []);
        g.beginPath();
        g.moveTo(box.x0, y);
        g.lineTo(box.x1, y);
        g.stroke();
        g.setLineDash([]);
        if (db === 0 || named) {
            g.fillStyle = named ? col.ink : col.faint;
            g.fillText(named ? '-60 dB' : '0 dB', box.x0 - 8, y + 3.5);
        }
    }
    const step = sh.tMax > 2 ? 0.5 : sh.tMax > 1 ? 0.25 : 0.1;
    g.textAlign = 'center';
    for (let t = 0; t <= sh.tMax + 1e-6; t += step) {
        const x = Math.round(sh.xOf(t)) + 0.5;
        g.strokeStyle = col.grid;
        g.beginPath();
        g.moveTo(x, box.y1);
        g.lineTo(x, box.y1 + 4);
        g.stroke();
        g.fillStyle = col.faint;
        g.fillText(t === 0 ? '0' : `${Math.round(t * 100) / 100} s`, x, box.y1 + 16);
    }
    for (const lane of sh.lines) {
        g.strokeStyle = bandCol[lane.id];
        g.lineWidth = lane.id === 'mid' ? 2 : 1.3;
        g.setLineDash(lane.id === 'mid' ? [] : [5, 3]);
        g.beginPath();
        lane.points.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
        g.stroke();
        g.setLineDash([]);
        // the three times are stacked at the right edge rather than labelled
        // where each line crosses the floor: a treated room's three bands land
        // within a few pixels of each other and the labels sat on one another
        g.fillStyle = bandCol[lane.id];
        g.font = monoSmall;
        g.textAlign = 'right';
        g.fillText(`${lane.id} ${fmtSec(lane.time)}`, box.x1, box.y0 + 12 + BAND_IDS.indexOf(lane.id) * 13);
    }
    g.fillStyle = col.one;
    g.beginPath();
    g.arc(sh.handle.x, sh.handle.y, 6, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = col.white;
    g.lineWidth = 1.5;
    g.stroke();
    return sh.handle;
}

function drawPaper(g, s, box, col, mono, monoSmall, grades, vdd) {
    const p = paperBoxes(s, box);
    g.lineWidth = 1;
    if (s.station === 'room') {
        const cy = (b) => b.y + b.h / 2;
        const cx = (b) => b.x + b.w / 2;
        // the dividing wall: the only line soundproofing is about
        g.strokeStyle = col.ink;
        g.lineWidth = 4;
        g.beginPath();
        g.moveTo(p.divide, box.y0 + 4);
        g.lineTo(p.divide, box.y1 - 4);
        g.stroke();
        g.lineWidth = 1;
        // the direct path, and the copy that comes by way of a wall
        g.strokeStyle = col.gold;
        g.setLineDash([5, 4]);
        g.beginPath();
        g.moveTo(p.src.x + p.src.w, cy(p.src));
        g.lineTo(p.mic.x, cy(p.mic));
        g.stroke();
        g.setLineDash([]);
        arrow(g, p.mic.x, cy(p.mic), col.gold);
        g.strokeStyle = col.faint;
        g.beginPath();
        g.moveTo(cx(p.src), p.src.y);
        g.lineTo(cx(p.wall), p.wall.y + p.wall.h);
        g.lineTo(cx(p.mic), p.mic.y);
        g.stroke();
        arrow(g, cx(p.mic), p.mic.y, col.faint, 'down');
        g.font = monoSmall;
        g.fillStyle = col.gold;
        g.textAlign = 'center';
        g.fillText('direct', (p.src.x + p.src.w + p.mic.x) / 2, cy(p.src) - 7);
        g.fillStyle = col.faint;
        g.fillText('reflected', cx(p.wall), p.wall.y + p.wall.h + 13);
        // what the room sends after it
        g.strokeStyle = col.one;
        g.beginPath();
        g.moveTo(cx(p.room), p.room.y);
        g.lineTo(cx(p.mic), p.mic.y + p.mic.h);
        g.stroke();
        arrow(g, cx(p.mic), p.mic.y + p.mic.h, col.one, 'up');
        g.fillStyle = col.one;
        g.fillText('the tail, after it', cx(p.room), p.room.y - 5);
        // the path through the wall, which is the one soundproofing touches
        const py = cy(p.outside);
        g.strokeStyle = s.proof ? col.two : col.faint;
        g.setLineDash(s.proof ? [2, 5] : []);
        g.beginPath();
        g.moveTo(p.mic.x + p.mic.w, py);
        g.lineTo(p.outside.x, py);
        g.stroke();
        g.setLineDash([]);
        arrow(g, p.outside.x, py, s.proof ? col.two : col.faint);
        // run up the wall itself: the gap either side of it is narrower than
        // the words, and across the row the label sat on the MIC box
        g.save();
        g.translate(p.divide + 13, box.y1 - 6);
        g.rotate(-Math.PI / 2);
        g.fillStyle = s.proof ? col.two : col.faint;
        g.textAlign = 'left';
        g.fillText(s.proof ? 'stopped by mass' : 'straight through the wall', 0, 0);
        g.restore();
    }
    for (const b of p.boxes) {
        const grade = b.section && grades[b.section] ? grades[b.section].grade : null;
        g.strokeStyle = grade === 'poor' ? col.white : grade === 'partly' ? col.ink : col.faint;
        g.lineWidth = grade === 'poor' ? 2 : 1;
        g.setLineDash(grade === 'partly' ? [5, 4] : []);
        g.fillStyle = 'rgba(255, 255, 255, 0.05)';
        g.beginPath();
        g.roundRect(b.x, b.y, b.w, b.h, 6);
        g.fill();
        g.stroke();
        g.setLineDash([]);
        // the grade as a bar on the box's own edge: at 1280 the stage is too
        // short to spend a third line on the word in every box
        if (grade) {
            g.fillStyle = grade === 'good' ? col.one : grade === 'partly' ? col.gold : col.white;
            g.fillRect(b.x + 1, b.y + 6, 3, b.h - 12);
        }
        g.fillStyle = col.ink;
        g.font = monoSmall;
        g.textAlign = 'left';
        g.fillText(fit(g, b.label, b.w - 20), b.x + 11, b.y + 15);
        g.fillStyle = col.white;
        g.font = mono;
        g.fillText(fit(g, b.sub, b.w - 20), b.x + 11, b.y + 32);
        if (grade && b.words) {
            g.fillStyle = grade === 'good' ? col.one : col.gold;
            g.font = monoSmall;
            g.fillText(fit(g, { good: 'suits', partly: 'partly', poor: 'does not suit' }[grade], b.w - 20), b.x + 11, b.y + 48);
        }
    }
    // the one number the paper wants
    const num = paperNumber(s);
    g.fillStyle = col.gold;
    g.font = mono;
    g.textAlign = 'left';
    g.fillText(`${num.value}`, box.x0, box.y1 - 22);
    g.fillStyle = col.faint;
    g.font = monoSmall;
    g.fillText(fit(g, num.said, box.x1 - box.x0 - 140), box.x0, box.y1 - 8);
    if (vdd.ok != null) {
        g.fillStyle = vdd.ok ? col.one : col.gold;
        g.font = mono;
        g.textAlign = 'right';
        g.fillText(vdd.ok ? 'as directed' : 'not yet', box.x1, box.y1 - 8);
    }
}

function drawMachine(g, s, box, col, mono, monoSmall) {
    const m = machineBoxes(s, box);
    const wire = (a, b, colour) => {
        g.strokeStyle = colour;
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(a.x + a.w, a.y + a.h / 2);
        g.lineTo(b.x, b.y + b.h / 2);
        g.stroke();
        arrow(g, b.x, b.y + b.h / 2, colour);
    };
    for (let i = 0; i < m.top.length - 1; i += 1) wire(m.top[i], m.top[i + 1], col.faint);
    for (let i = 0; i < m.low.length - 1; i += 1) wire(m.low[i], m.low[i + 1], col.one);
    if (m.low.length && m.top.length) {
        const from = m.top[m.top.length - 1];
        const to = m.low[0];
        g.strokeStyle = col.one;
        g.beginPath();
        g.moveTo(from.x + from.w / 2, from.y + from.h);
        g.lineTo(from.x + from.w / 2, to.y + to.h / 2);
        g.lineTo(to.x, to.y + to.h / 2);
        g.stroke();
        arrow(g, to.x, to.y + to.h / 2, col.one);
    }
    for (const b of [...m.top, ...m.low]) {
        g.strokeStyle = col.faint;
        g.lineWidth = 1;
        g.fillStyle = 'rgba(255, 255, 255, 0.05)';
        g.beginPath();
        g.roundRect(b.x, b.y, b.w, b.h, 6);
        g.fill();
        g.stroke();
        g.fillStyle = col.ink;
        g.font = monoSmall;
        g.textAlign = 'left';
        g.fillText(b.label, b.x + 9, b.y + 16);
        g.fillStyle = col.white;
        g.font = mono;
        g.fillText(fit(g, b.sub, b.w - 18), b.x + 9, b.y + 36);
    }
    // the tail drawn to scale beneath the convolver, so the answer is visible
    if (s.station === 'room') {
        const times = bandTimes(s.rt60, s.absorb);
        const span = Math.max(...Object.values(times)) * 1.1;
        const lane = m.lane;
        const y = lane.y;
        const hgt = Math.max(18, lane.h - 14);
        g.strokeStyle = col.grid;
        g.beginPath();
        g.moveTo(lane.x0, y + 0.5);
        g.lineTo(lane.x1, y + 0.5);
        g.stroke();
        for (const id of BAND_IDS) {
            g.strokeStyle = { low: col.gold, mid: col.one, high: col.two }[id];
            g.lineWidth = id === 'mid' ? 1.8 : 1.2;
            g.setLineDash(id === 'mid' ? [] : [5, 3]);
            g.beginPath();
            for (let i = 0; i <= 100; i += 1) {
                const t = (i / 100) * span;
                const x = lane.x0 + (t / span) * (lane.x1 - lane.x0);
                const a = Math.exp((-Math.log(1000) * t) / times[id]);
                if (i === 0) g.moveTo(x, y - a * hgt); else g.lineTo(x, y - a * hgt);
            }
            g.stroke();
            g.setLineDash([]);
        }
        g.fillStyle = col.faint;
        g.font = monoSmall;
        g.textAlign = 'left';
        g.fillText(`the answer the convolver holds, ${fmtSec(span)} of it`, lane.x0, y - hgt - 8);
    }
}

function arrow(g, x, y, colour, dir = 'right') {
    g.fillStyle = colour;
    g.beginPath();
    if (dir === 'up') { g.moveTo(x, y); g.lineTo(x - 4, y + 6); g.lineTo(x + 4, y + 6); }
    else if (dir === 'down') { g.moveTo(x, y); g.lineTo(x - 4, y - 6); g.lineTo(x + 4, y - 6); }
    else { g.moveTo(x, y); g.lineTo(x - 6, y - 4); g.lineTo(x - 6, y + 4); }
    g.closePath();
    g.fill();
}

function fit(g, text, width) {
    if (g.measureText(text).width <= width) return text;
    let t = text;
    while (t.length > 3 && g.measureText(`${t}…`).width > width) t = t.slice(0, -1);
    return `${t}…`;
}
