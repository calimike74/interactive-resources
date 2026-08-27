'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BenchFrame from '@/components/bench/BenchFrame';
import { Dial, DragNumber, Chips, Why, MoreButton } from '@/components/bench/controls';
import { PlayColumn, Presets, Legal, ExamCallout, useBenchMode, useBenchDepth } from '@/components/bench/BenchBits';
import { useBenchAudio, glide, envelopeOf } from '@/components/bench/useBenchAudio';
import styles from '@/components/bench/bench.module.css';
import { memberTopicHref, useStudioArrival } from '@/lib/studio-return';
import {
    NOTE_VALUES,
    CORE_NOTE_IDS,
    FURTHER_NOTE_IDS,
    delayTimeSec,
    repeatMarks,
    mixGains,
    highCutHz,
    beatGrid,
    PRESETS,
    applyPreset,
    DEFAULT_STATE,
    BPM_MIN,
    BPM_MAX,
    stageShape,
} from '@/lib/bench/delay-model';

// The Delay bench (1.12) — the reference bench for BENCH-STANDARD.md.
// One graph makes the sound and the picture: lib/bench/delay-model.js
// holds the numbers, the Web Audio graph below plays them, the stage
// draws them. Design doc: docs/superpowers/specs/2026-08-21-delay-bench-design.md
// Look: Mike's pick from Claude Design, 21 Aug 2026 ("3A, the explorable
// bench", with 3B's Core / A-level / Extension switch). Teacher mode is
// the bench acting as the student's teacher: it says what they are
// hearing, what to try next and why, and explains any dial or repeat they
// hover.

const AUDIO = '/bench-audio/delay';
const FILES = {
    'funk-kick': `${AUDIO}/funk-kick.mp3`,
    'funk-snare': `${AUDIO}/funk-snare.mp3`,
    'funk-hat': `${AUDIO}/funk-hat.mp3`,
    'funk-openhat': `${AUDIO}/funk-openhat.mp3`,
    '808-kick': `${AUDIO}/808-kick.mp3`,
    '808-snare': `${AUDIO}/808-snare.mp3`,
    '808-hat': `${AUDIO}/808-hat.mp3`,
    '808-openhat': `${AUDIO}/808-openhat.mp3`,
    vocal: `${AUDIO}/vocal-phrase.mp3`,
    'stab-brass': `${AUDIO}/stab-brass.mp3`,
    'stab-guitar': `${AUDIO}/stab-guitar.mp3`,
};

// Patterns in 16ths over two bars. The same arrays feed the scheduler and
// the stage, so what is drawn is what is booked.
// Bar widths on the stage, in px: a hit and one of its repeats. Mike, 27
// Aug 2026: 7 and 5 were too thin to tell what they were.
const BAR_W = { hit: 10, repeat: 7 };

const PATTERNS = {
    drums: {
        label: 'Drums',
        said: 'the drums',
        bars: 2,
        steps: [
            ...[0, 10, 16, 26].map((s) => ({ s, name: 'funk-kick', g: 1 })),
            ...[4, 12, 20, 28].map((s) => ({ s, name: 'funk-snare', g: 0.9 })),
            ...[0, 4, 8, 12, 16, 20, 24, 28].map((s) => ({ s, name: 'funk-hat', g: 0.35 })),
            { s: 14, name: 'funk-openhat', g: 0.45 },
            { s: 30, name: 'funk-openhat', g: 0.45 },
        ],
    },
    electronic: {
        label: '808',
        said: 'the 808',
        bars: 2,
        steps: [
            ...[0, 4, 8, 12, 16, 20, 24, 28].map((s) => ({ s, name: '808-kick', g: 1 })),
            ...[4, 12, 20, 28].map((s) => ({ s, name: '808-snare', g: 0.8 })),
            ...Array.from({ length: 8 }, (_, i) => ({ s: i * 4 + 2, name: '808-hat', g: 0.35 })),
            { s: 30, name: '808-openhat', g: 0.5 },
        ],
    },
    vocal: { label: 'Vocal', said: 'the vocal', bars: 4, steps: [{ s: 0, name: 'vocal', g: 1, phrase: true }] },
    stab: { label: 'Stab', said: 'the stabs', bars: 2, steps: [{ s: 0, name: 'stab-brass', g: 1 }, { s: 16, name: 'stab-guitar', g: 1 }] },
};
const SOURCE_IDS = ['drums', 'electronic', 'vocal', 'stab'];

const CODE = '1.12 Delay';
const TITLE = 'Delay bench';
const ORIENT = 'Each pale mark is a hit; the coloured ones to its right are its repeats, one colour per trip round the loop.';

const GEN_VARS = ['--gen-1', '--gen-2', '--gen-3', '--gen-4', '--gen-5', '--gen-6'];
const FRACTIONS = { 1: '1 beat', 0.5: '½ beat', 0.25: '¼ beat', 2: '2 beats', 0.75: '¾ beat' };
const fractionOf = (noteId) => {
    const b = NOTE_VALUES[noteId]?.beats;
    if (noteId === 'tripletEighth') return '⅓ beat';
    return FRACTIONS[b] || `${b} beats`;
};
const SUB = ['', ' e', ' and', ' a'];
const WHERE = {
    quarter: 'so each repeat lands on the next beat',
    eighth: 'so each repeat lands on the off-beat',
    sixteenth: 'so the repeats fill the gaps between the beats',
    half: 'so each repeat lands two beats later',
    dottedEighth: 'so the repeats push against the beat, the classic dotted pattern',
    tripletEighth: 'so the repeats swing in threes',
};

function fmtMs(sec) {
    return sec >= 1 ? (sec).toFixed(2).replace(/0$/, '') + ' s' : Math.round(sec * 1000) + ' ms';
}

// ---- the graph ------------------------------------------------------------
function buildDelayGraph(ctx, input, master) {
    const dry = ctx.createGain();
    input.connect(dry);
    dry.connect(master);

    const mk = () => {
        const delay = ctx.createDelay(2.5);
        const tone = ctx.createBiquadFilter();
        tone.type = 'lowpass';
        tone.Q.value = 0.5;
        const wet = ctx.createGain();
        const pan = ctx.createStereoPanner();
        delay.connect(tone);
        tone.connect(wet);
        wet.connect(pan);
        pan.connect(master);
        return { delay, tone, wet, pan };
    };
    const A = mk();
    const B = mk();
    input.connect(A.delay);

    // Three feedback paths: A back into itself (mono), A into B and B into A
    // (ping-pong). Which ones carry signal is decided by set().
    const fbAA = ctx.createGain();
    const fbAB = ctx.createGain();
    const fbBA = ctx.createGain();
    A.tone.connect(fbAA); fbAA.connect(A.delay);
    A.tone.connect(fbAB); fbAB.connect(B.delay);
    B.tone.connect(fbBA); fbBA.connect(A.delay);

    let current = null;
    let dryHeld = false;

    function set(state) {
        current = state;
        const d = delayTimeSec(state);
        const fb = Math.min(1, Math.max(0, state.feedback / 100));
        const { dry: dg, wet: wg } = mixGains(state.mix);
        const hc = highCutHz(state.highCut);
        const pp = state.stereo === 'pingpong';
        glide(A.delay.delayTime, d, ctx, 0.03);
        glide(B.delay.delayTime, d, ctx, 0.03);
        glide(A.tone.frequency, hc, ctx);
        glide(B.tone.frequency, hc, ctx);
        glide(fbAA.gain, pp ? 0 : fb, ctx);
        glide(fbAB.gain, pp ? fb : 0, ctx);
        glide(fbBA.gain, pp ? fb : 0, ctx);
        glide(A.wet.gain, dryHeld ? 0 : wg, ctx);
        glide(B.wet.gain, dryHeld || !pp ? 0 : wg, ctx);
        glide(A.pan.pan, pp ? 0.85 : 0, ctx);
        glide(B.pan.pan, pp ? -0.85 : 0, ctx);
        glide(dry.gain, dryHeld ? 1 : dg, ctx);
    }
    function holdDry(held) {
        dryHeld = held;
        if (current) set(current);
    }
    // Empty the loop: cut the feedback paths for longer than the longest
    // delay, then put them back.
    function clear() {
        const t = ctx.currentTime;
        for (const g of [fbAA, fbAB, fbBA]) {
            g.gain.cancelScheduledValues(t);
            g.gain.setValueAtTime(0, t);
        }
        A.delay.delayTime.cancelScheduledValues(t);
        B.delay.delayTime.cancelScheduledValues(t);
        if (current) window.setTimeout(() => set(current), 60);
    }
    return { set, holdDry, clear };
}

// ---- the bench ------------------------------------------------------------
export default function DelayBench({ back }) {
    const [state, setState] = useState(DEFAULT_STATE);
    const [further, setFurther] = useState(false);
    const [mode, setMode] = useBenchMode();
    const [depth, setDepth] = useBenchDepth();
    const [hover, setHover] = useState(null);
    const stateRef = useRef(state);
    stateRef.current = state;
    const hoverRef = useRef(null);
    hoverRef.current = hover;
    const { studioOrigin } = useStudioArrival();
    const teach = mode === 'teacher';
    const ext = depth === 'extension';
    const maths = depth !== 'core';

    const pattern = PATTERNS[state.source];
    const bars = pattern.bars;

    const originRef = useRef(0);
    const onSchedule = useCallback(({ bar, barStart, beatSec, playBuffer }) => {
        const s = stateRef.current;
        const pat = PATTERNS[s.source];
        const local = bar % pat.bars;
        if (local === 0) originRef.current = barStart;
        const sixteenth = beatSec / 4;
        for (const step of pat.steps) {
            const stepBar = Math.floor(step.s / 16);
            if (stepBar !== local) continue;
            playBuffer(step.name, barStart + (step.s % 16) * sixteenth, { gain: step.g });
        }
    }, []);

    const audio = useBenchAudio({ files: FILES, bpm: state.bpm, onSchedule, buildGraph: buildDelayGraph });
    const { ctxRef, nodesRef, bpmRef, getBuffer, began, playing } = audio;
    const playingRef = useRef(false);
    playingRef.current = playing;

    // Every state change goes to the graph, smoothed there.
    useEffect(() => {
        nodesRef.current?.graph?.set(state);
    }, [state, began, nodesRef]);

    // Output level
    useEffect(() => {
        const ctx = ctxRef.current;
        const nodes = nodesRef.current;
        if (ctx && nodes) glide(nodes.level.gain, state.level, ctx);
    }, [state.level, began, ctxRef, nodesRef]);

    const update = (patch) => setState((s) => ({ ...s, ...patch, presetId: null }));
    const choosePreset = (id) => {
        const preset = PRESETS.find((p) => p.id === id);
        // A preset that reaches a further control opens that section, so
        // the student can see which control made the difference.
        if (preset && (preset.state.highCut < 100 || preset.state.stereo === 'pingpong')) setFurther(true);
        setState((s) => applyPreset(s, id));
    };
    const chooseNote = (id) => {
        if (id === 'off') update({ sync: false });
        else update({ sync: true, noteId: id });
    };
    // A new source starts from bar one straight away and cuts the old one.
    // The scheduler reads stateRef on the very next tick, so it is written
    // here as well as through React.
    const chooseSource = (id) => {
        stateRef.current = { ...stateRef.current, source: id, presetId: null };
        update({ source: id });
        if (playingRef.current) audio.restart();
    };
    const { start, stop } = audio;
    const togglePlay = useCallback(() => (playingRef.current ? stop() : start()), [start, stop]);

    // The space bar is the transport, wherever the focus is, as in a DAW
    // (Mike, 21 Aug walk: "just as I've done on other things"). The
    // exceptions are the places Space has another job: a text field, the
    // hold-for-dry button, the open drawer and anything outside the bench.
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

    const delaySec = delayTimeSec(state);
    const beatSec = 60 / state.bpm;
    // What the loop will do to one hit: repeats louder than -40 dB of the
    // original, from the same recursion the stage draws.
    const audible = repeatMarks({ t0: 0, amp: 1, delaySec, feedback: state.feedback, windowEnd: 8, floor: 0.01 }).length;
    const audibleLabel = state.feedback >= 100 ? 'no decay' : audible >= 30 ? '30+' : String(audible);
    const fb = state.feedback / 100;
    const dbPass = state.feedback <= 0 ? '−∞' : state.feedback >= 100 ? '0.0' : (20 * Math.log10(fb)).toFixed(1);
    const tailS = state.feedback >= 100 ? '∞' : (audible * delaySec).toFixed(1);
    const beatMs = Math.round(60000 / state.bpm);
    const legendN = Math.min(6, Math.max(1, state.feedback >= 100 ? 6 : audible));

    // ---- stage ----
    const canvasRef = useRef(null);
    const rectsRef = useRef([]);
    const depthRef = useRef(depth);
    depthRef.current = depth;
    useEffect(() => {
        const first = canvasRef.current;
        if (!first) return undefined;
        let raf = 0;
        const css = getComputedStyle(first.parentElement);
        const v = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
        const col = {
            hit: v('--hit', '#f6f3ec'),
            gens: GEN_VARS.map((g, i) => v(g, ['#7fb39b', '#7fb0c4', '#a395c9', '#d08fa8', '#dbb170', '#d08a80'][i])),
            gold: v('--gold-bright', '#f0d48a'),
            purple: '#a395c9',
            inkSoft: 'rgba(255, 255, 255, 0.62)',
            inkFaint: 'rgba(255, 255, 255, 0.38)',
            beat: 'rgba(255, 255, 255, 0.08)',
            downbeat: 'rgba(255, 255, 255, 0.22)',
            ghost: 'rgba(255, 255, 255, 0.3)',
        };
        const monoFace = v('--mono', 'monospace');
        const mono = `11.5px ${monoFace}`;

        function draw() {
            const canvas = canvasRef.current;
            if (!canvas) { raf = requestAnimationFrame(draw); return; }
            const ctx2d = canvas.getContext('2d');
            const s = stateRef.current;
            const pat = PATTERNS[s.source];
            const dpr = window.devicePixelRatio || 1;
            const w = canvas.clientWidth;
            const h = canvas.clientHeight;
            if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
                canvas.width = Math.round(w * dpr);
                canvas.height = Math.round(h * dpr);
            }
            ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx2d.clearRect(0, 0, w, h);

            const actx = ctxRef.current;
            const bpmNow = (playingRef.current && bpmRef.current) || s.bpm;
            const grid = beatGrid({ bpm: bpmNow, bars: pat.bars });
            const win = grid.windowSec;
            const padL = 26;
            const padR = 26;
            const top = 72;
            const bottom = h - 40;
            const plotW = w - padL - padR;
            const plotH = bottom - top;
            const xOf = (t) => padL + (((t % win) + win) % win) / win * plotW;
            const pp = s.stereo === 'pingpong';
            const lanes = pp
                ? { L: { y0: top, y1: top + plotH / 2 - 6 }, R: { y0: top + plotH / 2 + 6, y1: bottom }, C: { y0: top, y1: bottom } }
                : { L: { y0: top, y1: bottom }, R: { y0: top, y1: bottom }, C: { y0: top, y1: bottom } };

            // the beat, as faint lines (downbeats a little stronger)
            ctx2d.lineWidth = 1;
            for (const l of grid.lines) {
                if (l.index === grid.lines.length - 1) continue;
                const x = xOf(l.t);
                ctx2d.strokeStyle = l.downbeat ? col.downbeat : col.beat;
                ctx2d.beginPath();
                ctx2d.moveTo(x + 0.5, top - 6);
                ctx2d.lineTo(x + 0.5, bottom + 6);
                ctx2d.stroke();
                if (l.downbeat) {
                    ctx2d.fillStyle = col.inkFaint;
                    ctx2d.font = mono;
                    ctx2d.textAlign = 'left';
                    ctx2d.fillText(`bar ${Math.floor(l.index / 4) + 1}`, x + 6, h - 14);
                }
            }
            // sixteenth ticks when synced to a short value
            if (s.sync && (s.noteId === 'sixteenth' || s.noteId === 'eighth' || s.noteId === 'dottedEighth' || s.noteId === 'tripletEighth')) {
                const sub = s.noteId === 'tripletEighth' ? grid.beatSec / 3 : grid.beatSec / 4;
                ctx2d.strokeStyle = col.downbeat;
                for (let t = 0; t < win; t += sub) {
                    const x = xOf(t);
                    ctx2d.beginPath();
                    ctx2d.moveTo(x + 0.5, bottom + 1);
                    ctx2d.lineTo(x + 0.5, bottom + 6);
                    ctx2d.stroke();
                }
            }
            // lane labels
            if (pp) {
                ctx2d.fillStyle = col.inkSoft;
                ctx2d.font = mono;
                ctx2d.textAlign = 'right';
                ctx2d.fillText('L', padL - 8, (lanes.L.y0 + lanes.L.y1) / 2 + 4);
                ctx2d.fillText('R', padL - 8, (lanes.R.y0 + lanes.R.y1) / 2 + 4);
                ctx2d.strokeStyle = col.downbeat;
                ctx2d.beginPath();
                ctx2d.moveTo(padL, top + plotH / 2 + 0.5);
                ctx2d.lineTo(w - padR, top + plotH / 2 + 0.5);
                ctx2d.stroke();
            }

            // hits and repeats
            const now = actx && playingRef.current ? actx.currentTime : null;
            const sixteenth = grid.beatSec / 4;
            const d = delayTimeSec({ ...s, bpm: bpmNow });
            const glowWindow = 0.09;
            const hovered = hoverRef.current?.key || null;
            const rects = [];

            const gains = mixGains(s.mix);
            const genColour = (n) => col.gens[Math.min(n - 1, col.gens.length - 1)];
            // A hit is a slim pale bar whose height is its level; a repeat
            // the same in its generation's colour, fainter as it decays.
            // Only a step the pattern marks as a phrase (the vocal) keeps its
            // envelope shape (stageShape: never the sample's length), drawn
            // light so the repeats behind it still read. Nothing here is
            // decoration: x is the time the graph plays it, height is the
            // gain it plays it at.
            const pxPerSec = plotW / win;
            // What this frame drew, told to the canvas for check-bench (law 13).
            let nBars = 0;
            let nEnvelopes = 0;
            function drawShape(t0, level, lane, buffer, n, sounding, ghostLevel = 0, envelope = false) {
                const lane_ = lanes[lane] || lanes.C;
                const laneH = lane_.y1 - lane_.y0;
                const maxH = laneH * 0.9;
                const x0 = xOf(t0);
                const baseline = lane_.y1;
                const long = envelope && buffer;
                const isRepeat = n > 0;
                ctx2d.fillStyle = sounding ? '#ffffff' : isRepeat ? genColour(n) : col.hit;
                if (long) {
                    nEnvelopes += 1;
                    const env = envelopeOf(buffer, 160);
                    const wpx = Math.min(buffer.duration * pxPerSec, plotW);
                    const cnt = env.length;
                    const step = wpx / cnt;
                    ctx2d.globalAlpha = isRepeat ? 0.22 + 0.5 * level : 0.6;
                    ctx2d.beginPath();
                    ctx2d.moveTo(x0, baseline);
                    for (let i = 0; i < cnt; i += 1) {
                        const x = x0 + i * step;
                        if (x > padL + plotW) break;
                        ctx2d.lineTo(x, baseline - Math.max(1, env[i] * Math.max(level, 0.02) * maxH));
                    }
                    ctx2d.lineTo(Math.min(x0 + wpx, padL + plotW), baseline);
                    ctx2d.closePath();
                    ctx2d.fill();
                    ctx2d.globalAlpha = 1;
                    return;
                }
                nBars += 1;
                const wpx = isRepeat ? BAR_W.repeat : BAR_W.hit;
                if (ghostLevel > 0) {
                    ctx2d.globalAlpha = 0.5;
                    ctx2d.fillStyle = col.ghost;
                    ctx2d.fillRect(x0 - 0.5, baseline - ghostLevel * maxH, 1, ghostLevel * maxH);
                    ctx2d.fillStyle = sounding ? '#ffffff' : col.hit;
                }
                ctx2d.globalAlpha = isRepeat ? Math.min(1, 0.35 + 0.65 * level) : 1;
                const hh = Math.max(2, level * maxH);
                ctx2d.beginPath();
                ctx2d.roundRect(x0 - wpx / 2, baseline - hh, wpx, hh, [2, 2, 0, 0]);
                ctx2d.fill();
                ctx2d.globalAlpha = 1;
            }

            const loopOrigin = originRef.current;
            const isSounding = (tAbs) => now != null && Math.abs(((now - tAbs) % win + win) % win) < glowWindow;
            const hits = pat.steps.map((step) => ({ step, tLocal: step.s * sixteenth, buffer: getBuffer(step.name) }));

            // Columns: everything that sounds at one moment in one lane,
            // the hit first, then each repeat that lands there, stacked.
            // A column taller than its lane is scaled down as a whole, so
            // every repeat stays visible and in proportion (the limiter on
            // the master is doing the same to the sound).
            const columns = new Map();
            const GAP = 1.5;
            const add = (lane, t, entry) => {
                const key = `${lane}:${Math.round(xOf(t) / 3)}`;
                if (!columns.has(key)) columns.set(key, { lane, t, items: [] });
                columns.get(key).items.push(entry);
            };
            for (const { step, tLocal, buffer } of hits) {
                const level = step.g * gains.dry;
                const sounding = isSounding(loopOrigin + tLocal);
                if (stageShape(step) === 'envelope') {
                    drawShape(tLocal, level, 'C', buffer, 0, sounding, step.g, true);
                } else {
                    add('C', tLocal, { level, ghost: step.g, n: 0, sounding });
                    if (pp) { add('L', tLocal, { level: 0, ghost: 0, n: 0, sounding: false, spacer: true }); }
                }
            }
            for (const { step, tLocal, buffer } of hits) {
                const marks = repeatMarks({ t0: tLocal, amp: step.g, delaySec: d, feedback: s.feedback, windowEnd: tLocal + win, stereo: s.stereo });
                for (const m of marks) {
                    const level = Math.min(1, m.level * gains.wet);
                    const lane = pp ? m.lane : 'C';
                    const sounding = isSounding(loopOrigin + m.t);
                    if (stageShape(step) === 'envelope') {
                        drawShape(m.t, level, lane, buffer, m.n, sounding, 0, true);
                        continue;
                    }
                    add(lane, m.t, { level, n: m.n, sounding, step, key: `${lane}:${step.s}:${step.name}:${m.n}` });
                }
            }
            for (const col_ of columns.values()) {
                const lane_ = lanes[col_.lane] || lanes.C;
                const laneH = lane_.y1 - lane_.y0;
                const maxH = laneH * 0.9;
                const items = col_.items.filter((i) => !i.spacer);
                if (!items.length) continue;
                nBars += items.length;
                const heights = items.map((i) => Math.max(2, i.level * maxH));
                const total = heights.reduce((a, b) => a + b, 0) + GAP * (items.length - 1);
                const scale = total > maxH ? maxH / total : 1;
                const x0 = xOf(col_.t);
                let y = lane_.y1;
                const hit = items.find((i) => i.n === 0);
                if (hit && hit.ghost > 0) {
                    ctx2d.globalAlpha = 0.5;
                    ctx2d.fillStyle = col.ghost;
                    ctx2d.fillRect(x0 - 0.5, lane_.y1 - hit.ghost * maxH * scale, 1, hit.ghost * maxH * scale);
                }
                items.forEach((it, i) => {
                    const hh = heights[i] * scale;
                    const bw = it.n > 0 ? BAR_W.repeat : BAR_W.hit;
                    const isHover = it.key && it.key === hovered;
                    ctx2d.fillStyle = it.sounding ? '#ffffff' : it.n > 0 ? genColour(it.n) : col.hit;
                    ctx2d.globalAlpha = it.n > 0 ? Math.min(1, 0.35 + 0.65 * it.level) : 1;
                    ctx2d.beginPath();
                    ctx2d.roundRect(x0 - bw / 2, y - hh, bw, hh, i === items.length - 1 ? [2, 2, 0, 0] : 0);
                    ctx2d.fill();
                    if (isHover) {
                        ctx2d.globalAlpha = 1;
                        ctx2d.strokeStyle = '#ffffff';
                        ctx2d.lineWidth = 2;
                        ctx2d.strokeRect(x0 - bw / 2 - 2.5, y - hh - 2.5, bw + 5, hh + 5);
                        ctx2d.lineWidth = 1;
                    }
                    if (it.n > 0) rects.push({ x: x0 - bw / 2, y: y - hh, w: bw, h: hh, n: it.n, step: it.step, key: it.key, lane: col_.lane });
                    y -= hh + GAP * scale;
                });
                ctx2d.globalAlpha = 1;
            }
            rectsRef.current = rects;
            const shapes = `bars:${nBars} envelopes:${nEnvelopes}`;
            if (canvas.dataset.shapes !== shapes) canvas.dataset.shapes = shapes;

            // the delay-time bracket on the first hit, labelled for the depth
            const first = pat.steps[0];
            if (first) {
                const xa = xOf(first.s * sixteenth);
                const xb = xOf(first.s * sixteenth + d);
                const y = top - 10;
                ctx2d.strokeStyle = col.gold;
                ctx2d.fillStyle = col.gold;
                ctx2d.lineWidth = 1;
                if (xb > xa) {
                    ctx2d.beginPath();
                    ctx2d.moveTo(xa + 0.5, y + 6); ctx2d.lineTo(xa + 0.5, y);
                    ctx2d.lineTo(xb + 0.5, y); ctx2d.lineTo(xb + 0.5, y + 6);
                    ctx2d.stroke();
                    ctx2d.font = mono;
                    ctx2d.textAlign = 'left';
                    const ms = fmtMs(d);
                    const perBeat = Math.round(60000 / bpmNow);
                    let label;
                    if (depthRef.current === 'core') label = `${ms} later, the first repeat`;
                    else if (s.sync) label = `${perBeat} ms per beat × ${fractionOf(s.noteId)} = ${ms}`;
                    else label = `${ms} = ${(d / (60 / bpmNow)).toFixed(2)} beats at ${bpmNow} BPM`;
                    ctx2d.fillText(label, xa, y - 8);
                }
            }

            // Extension: the law behind the picture, at the right
            if (depthRef.current === 'extension') {
                const fbv = s.feedback / 100;
                const n = repeatMarks({ t0: 0, amp: 1, delaySec: d, feedback: s.feedback, windowEnd: 8, floor: 0.01 }).length;
                const tail = s.feedback >= 100 ? '∞' : `${(n * d).toFixed(1)} s`;
                ctx2d.font = mono;
                ctx2d.textAlign = 'right';
                ctx2d.fillStyle = col.gens[0];
                ctx2d.fillText(`amplitude = ${fbv.toFixed(2)} ⁿ`, w - padR - 30, top - 26);
                ctx2d.fillStyle = col.inkSoft;
                ctx2d.fillText(`tail ≈ ${s.feedback >= 100 ? 'no decay' : `${n} × ${fmtMs(d)} = ${tail}`}`, w - padR - 30, top - 10);
                ctx2d.fillStyle = col.purple;
                ctx2d.font = `600 9.5px ${monoFace}`;
                ctx2d.fillText('EXT', w - padR, top - 26);
                ctx2d.fillText('EXT', w - padR, top - 10);
            }

            // playhead
            if (now != null) {
                const x = xOf(now - loopOrigin);
                ctx2d.strokeStyle = 'rgba(255, 255, 255, 0.85)';
                ctx2d.lineWidth = 1.5;
                ctx2d.beginPath();
                ctx2d.moveTo(x, top - 12);
                ctx2d.lineTo(x, bottom + 8);
                ctx2d.stroke();
            }

            raf = requestAnimationFrame(draw);
        }
        raf = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(raf);
    }, [ctxRef, bpmRef, getBuffer]);

    // Teacher on: hovering a repeat makes the bench explain it.
    const onStageMove = (e) => {
        if (!teach) { if (hover) setHover(null); return; }
        const rect = e.currentTarget.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        let best = null;
        let bestDx = 7;
        for (const r of rectsRef.current) {
            if (py < r.y - 3 || py > r.y + r.h + 3) continue;
            const dx = Math.abs(px - (r.x + r.w / 2));
            if (dx < bestDx) { bestDx = dx; best = r; }
        }
        if (!best) { if (hover) setHover(null); return; }
        if (hover && hover.key === best.key) return;
        const bar = Math.floor(best.step.s / 16) + 1;
        const beat = Math.floor((best.step.s % 16) / 4) + 1;
        const sub = SUB[best.step.s % 4];
        setHover({
            key: best.key,
            n: best.n,
            where: `bar ${bar}, beat ${beat}${sub}`,
            lane: best.lane,
            x: best.x,
            y: best.y,
            stageW: rect.width,
            stageH: rect.height,
        });
    };

    // ---- drawer content ----
    const topicHref = (slug) => memberTopicHref(null, slug, studioOrigin);
    const drawerTabs = useMemo(() => [
        {
            id: 'reference',
            label: 'Reference',
            render: () => (
                <>
                    <h2>Delay, in the spec&apos;s words</h2>
                    <p>The six controls on this bench are the six things an exam answer about delay is built from.</p>
                    <h3>Terms</h3>
                    <dl>
                        <dt>Delay time</dt><dd>How long after the original each repeat arrives, in milliseconds, or as a note value when synced to tempo.</dd>
                        <dt>Feedback</dt><dd>How much of the repeat is fed back into the delay. It sets the number of repeats: 0% gives one echo, 100% never decays.</dd>
                        <dt>Wet / dry (mix)</dt><dd>The balance of repeats against the original. The repeats usually sit below the original unless the echo is the part.</dd>
                        <dt>Tempo sync</dt><dd>The delay time is taken from the tempo as a note value (1/4, 1/8, 1/16), so the repeats fall on the beat.</dd>
                        <dt>Slapback</dt><dd>A single short repeat, roughly 80 to 140 ms, low feedback. A thickening, not a tail.</dd>
                        <dt>Ping-pong</dt><dd>Repeats alternate between left and right. Two delay lines feeding each other, panned apart.</dd>
                        <dt>Tone of repeats</dt><dd>Tape and analogue delays lose top end on every pass, so repeats darken. The High cut control does that here.</dd>
                    </dl>
                    <h3>In your DAW</h3>
                    <table>
                        <thead><tr><th>On this bench</th><th>Ableton Live</th><th>Logic Pro</th></tr></thead>
                        <tbody>
                            <tr><td>Time / Sync</td><td>Delay: Time, Sync, note buttons</td><td>Tape Delay: Delay Time, Note</td></tr>
                            <tr><td>Feedback</td><td>Delay: Feedback</td><td>Tape Delay: Feedback</td></tr>
                            <tr><td>Mix</td><td>Delay: Dry/Wet</td><td>Tape Delay: Dry / Wet sliders</td></tr>
                            <tr><td>High cut</td><td>Delay: Filter (on) and its frequency</td><td>Tape Delay: High Cut</td></tr>
                            <tr><td>Ping-pong</td><td>Delay: Ping Pong mode</td><td>Stereo Delay: crossfeed and separate L/R times</td></tr>
                        </tbody>
                    </table>
                    <p className={styles.source}>Control names as they appear in Live 12 and Logic Pro 11 device panels. Check against your own version if they move.</p>
                </>
            ),
        },
        {
            id: 'teacher',
            label: 'Teacher',
            render: () => (
                <>
                    <h2>What to listen for</h2>
                    <p>The stage is showing you the feedback loop itself. Each repeat is the one before it, scaled by the Feedback amount and pushed along by the Delay time. Once you can see that, you will stop describing feedback as &quot;volume&quot; or &quot;distortion&quot;, which is where marks go.</p>
                    <h3>What cost candidates marks in 2023</h3>
                    <p>On the 2023 paper&apos;s Q6 (a vocal chain with compression, EQ and a delay), the Principal Examiner wrote: &quot;most candidates were able to identify that the high feedback was inappropriate and would cause too many repeats, but some candidates thought that the feedback setting was related to distortion or heavy metal in general. Very few candidates were able to work out that the delay time was tempo synced at a quaver. Some candidates incorrectly argued that the offset in delay times was a mistake and that changing the times to be identical would improve the stereo image.&quot;</p>
                    <p className={styles.source}>Source: Edexcel Principal Examiner Feedback, 9MT0/04, Summer 2023, Question 6.</p>
                    <p>Those three mistakes are your three moves on this bench: raise Feedback and count the repeats; switch Sync to 1/8 and watch them land on the beat; set Ping-pong and hear why two different-sided delay times are the point, not a mistake.</p>
                    <h3>Do these now</h3>
                    <ul>
                        <li>Hold the dry button while it plays, let go, and say out loud what came back.</li>
                        <li>Set Time by ear until the repeats sit on the beat at 110 BPM, then switch Sync on and compare your number with the bench&apos;s.</li>
                        <li>Push Feedback to 100% and decide when you would turn it down. Then ask what the limiter is doing for you.</li>
                        <li>Pick Long tail and work out why the later repeats are duller, before you look at High cut.</li>
                    </ul>
                    <h3>Exam practice</h3>
                    <ExamCallout
                        prompt="A producer wants exactly three audible repeats that fade away. Which control, and roughly where?"
                        answer="Feedback, set low to moderate (around 30 to 40% on this bench). The delay time sets how far apart the three repeats are, not how many there are."
                    />
                    <ExamCallout
                        prompt="The repeats sound duller than the original. On a tape delay, what is responsible?"
                        answer="Each pass through the tape loses high frequencies, so every repeat is darker than the last. A plugin models this with a high-cut (low-pass) filter in the feedback path."
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
                        <b>Delay time from tempo</b>
                        <span>The bracket on the stage is 60,000 ÷ BPM × the note value. The Numeracy topic works the relationship the way the paper asks it.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('eq-filters')}>
                        <i>1.11 EQ and filters</i>
                        <b>Why repeats darken</b>
                        <span>High cut on this bench is a low-pass filter in the feedback loop. The EQ topic shows what a low-pass filter does to a sound.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('balance-blend')}>
                        <i>1.13 Balance and blend</i>
                        <b>Where the wet sits</b>
                        <span>The Mix control is a balance decision. The Balance topic covers how effects sit under a part in a mix.</span>
                    </a>
                    <a className={styles.conn} href={`${topicHref('delay')}#explore`}>
                        <i>1.12 Delay</i>
                        <b>Inside the Echo</b>
                        <span>The same delay as a tape machine in 3D: the head gap is the delay time, the re-recorded band is the feedback.</span>
                    </a>
                </>
            ),
        },
    ], [studioOrigin]);

    // ---- the bench's one line to the student ----
    let next;
    if (!state.sync) next = 'switch Sync to 1/8 and listen to the repeats lock to the beat';
    else if (state.feedback < 50) next = 'raise Feedback to 60% and count how many more repeats appear before they blur';
    else if (state.stereo !== 'pingpong') next = 'open More, choose Ping-pong, and watch the repeats alternate sides';
    else if (state.highCut > 50) next = 'pull High cut down and listen to the later repeats darken, the way tape does';
    else next = 'press Slapback and ask yourself why a 110 ms gap stops sounding like an echo';
    let hearing;
    if (state.mix === 0) {
        hearing = `Mix is at 0%, so you are hearing ${pattern.said} dry: the delay is running but none of it reaches the mix.`;
    } else if (state.sync) {
        hearing = `You are hearing ${pattern.said} with a repeat every ${fmtMs(delaySec)}, which is ${NOTE_VALUES[state.noteId].label} at ${state.bpm} BPM, ${WHERE[state.noteId]}.`;
    } else {
        const beats = delaySec / beatSec;
        const onGrid = Math.abs(beats - Math.round(beats * 4) / 4) < 0.02;
        hearing = `You are hearing ${pattern.said} with a repeat every ${fmtMs(delaySec)}. That is ${beats.toFixed(2)} beats at ${state.bpm} BPM, so the repeats ${onGrid ? 'sit on the grid' : 'drift against the beat'}.`;
    }
    const loop = state.feedback === 0
        ? 'Feedback is at 0%, so each hit gets one echo and nothing more.'
        : state.feedback >= 100
            ? 'Feedback is at 100%, so nothing decays: the loop is running away and only the limiter is holding it.'
            : `Each repeat is ${state.feedback}% as loud as the one before, so about ${audible} of them are loud enough to hear.`;
    const say = teach
        ? <>{hearing} {loop} <b>Try:</b> {next}.</>
        : <><b>Try:</b> {next.charAt(0).toUpperCase() + next.slice(1)}.</>;

    // ---- console ----
    const syncOptions = [
        { id: 'off', label: 'Off' },
        ...CORE_NOTE_IDS.map((id) => ({ id, label: NOTE_VALUES[id].label })),
    ];
    const furtherNoteOptions = FURTHER_NOTE_IDS.map((id) => ({ id, label: NOTE_VALUES[id].label }));
    const syncValue = state.sync ? state.noteId : 'off';
    const timeMs = state.sync ? Math.round(delaySec * 1000) : state.timeMs;

    // the Time diagram: where the repeats fall in one bar at this tempo
    const barMs = beatMs * 4;
    const timeTicks = [];
    for (let t = 0; t <= barMs && timeTicks.length < 40; t += delaySec * 1000) timeTicks.push((t / barMs) * 100);
    // the Feedback diagram: seven passes round the loop
    const stair = Array.from({ length: 7 }, (_, i) => Math.pow(fb, i));

    const consoleSlot = (
        <>
            <PlayColumn
                playing={playing}
                onTogglePlay={togglePlay}
                onHoldDry={(held) => nodesRef.current?.graph?.holdDry(held)}
                level={state.level}
                onLevel={(v) => setState((s) => ({ ...s, level: v }))}
                teach={teach}
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
                <Why>Four sounds, four shapes. A short hit shows the repeats cleanly; the vocal is long enough for its repeats to smear into one another. Switching starts the pattern again from bar one.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secTime}`} data-teach={teach || undefined}>
                <div className={styles.secHead}>
                    <span className={styles.eyebrow} data-hot="true">Time</span>
                    <span className={styles.value}>{fmtMs(delaySec)}</span>
                </div>
                <div className={styles.instrument}>
                    <Dial
                        label="Delay time"
                        value={timeMs}
                        min={20}
                        max={2000}
                        step={1}
                        unit="ms"
                        pointer="var(--gold)"
                        hot
                        pixels={400}
                        onChange={(v) => update({ timeMs: v, sync: false })}
                        title={state.sync ? 'Set by Sync. Drag to set the time by hand.' : 'Delay time in milliseconds'}
                    />
                    <div className={styles.diagram} aria-hidden="true">
                        <small>repeats in one bar</small>
                        {[25, 50, 75].map((x) => <span key={x} className={styles.tickBeat} style={{ left: `${x}%` }} />)}
                        {timeTicks.map((x, i) => <span key={i} className={styles.tick} style={{ left: `calc(${x}% - 1px)`, opacity: i === 0 ? 0.35 : 1 }} />)}
                    </div>
                </div>
                <Chips label="Sync" options={syncOptions} value={syncValue} onChange={chooseNote}>
                    <span className={styles.chipNote}>
                        <DragNumber label="Tempo" value={state.bpm} min={BPM_MIN} max={BPM_MAX} unit="BPM" onChange={(v) => update({ bpm: v })} title="Drag up and down, or use the arrow keys" />
                    </span>
                </Chips>
                <div className={styles.meaning} data-ext={maths && state.sync ? 'true' : undefined}>
                    {maths && state.sync ? `60,000 ÷ ${state.bpm} = ${beatMs} ms per beat` : 'the gap between one repeat and the next'}
                </div>
                <Why>The gap between one repeat and the next. Under about 120 ms the ear hears a thickening rather than an echo. Drag the dial to set it by hand; pick a note value and the bench takes it from the tempo instead.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secFeedback}`} data-teach={teach || undefined}>
                <div className={styles.secHead}>
                    <span className={styles.eyebrow}>Feedback</span>
                    <span className={styles.value} data-tone="green">{state.feedback} %</span>
                </div>
                <div className={styles.instrument}>
                    <Dial label="Feedback" value={state.feedback} min={0} max={100} unit="%" pointer="var(--green)" onChange={(v) => update({ feedback: v })} />
                    <div className={styles.diagram} aria-hidden="true">
                        <div className={styles.stair}>
                            {stair.map((a, i) => (
                                <i key={i} style={{ height: `${Math.max(3, a * 100)}%`, background: i === 0 ? 'var(--ink)' : `var(--gen-${Math.min(i, 6)})`, opacity: i === 0 ? 1 : 0.88 }} />
                            ))}
                        </div>
                    </div>
                </div>
                <div className={styles.meaning} data-ext={ext ? 'true' : undefined}>
                    {ext ? <>≈ {dbPass} dB per pass · tail ≈ {tailS}{state.feedback < 100 ? ' s' : ''}<span className={styles.ext}>EXT</span></> : 'how much of each repeat is fed back in'}
                </div>
                <Why>How much of each repeat goes back round the loop. At 100% the repeats never die away. Where does it stop being an echo and start being a drone?</Why>
            </div>

            <div className={`${styles.sec} ${styles.secMix}`} data-teach={teach || undefined}>
                <div className={styles.secHead}>
                    <span className={styles.eyebrow}>Mix</span>
                    <span className={styles.value}>{state.mix} % wet</span>
                </div>
                <div className={styles.instrument}>
                    <Dial label="Mix" value={state.mix} min={0} max={100} unit="% wet" onChange={(v) => update({ mix: v })} />
                    <div className={styles.split} aria-hidden="true">
                        <div className={styles.splitBar}>
                            <i style={{ width: `${100 - state.mix}%`, background: 'var(--ink)' }} />
                            <i style={{ width: `${state.mix}%`, background: 'var(--green)' }} />
                        </div>
                        <div className={styles.splitLabels}><span>dry {100 - state.mix} %</span><span>wet {state.mix} %</span></div>
                    </div>
                </div>
                <div className={styles.meaning} data-ext={ext ? 'true' : undefined}>
                    {ext ? <>equal power at 50 %<span className={styles.ext}>EXT</span></> : 'balance of original against repeats'}
                </div>
                <Why>The balance of the repeats against the original. Past 50% the echo is louder than the part it came from. That is a decision, not a mistake, if you can say why.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secHear}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>What you should hear</span></div>
                <div className={styles.stats} aria-live="polite">
                    <div><b>{fmtMs(delaySec)}</b><span>between repeats</span></div>
                    <div><b>{audibleLabel}</b><span>repeats you can hear</span></div>
                    {ext ? (
                        <>
                            <div><b>{dbPass} dB</b><span>per pass<span className={styles.ext}>EXT</span></span></div>
                            <div><b>{tailS}{state.feedback < 100 ? ' s' : ''}</b><span>tail length<span className={styles.ext}>EXT</span></span></div>
                        </>
                    ) : (
                        <>
                            <div><b>{state.feedback}%</b><span>of the last, each pass</span></div>
                            <div><b>{state.mix}%</b><span>wet in the mix</span></div>
                        </>
                    )}
                </div>
                {teach ? <div className={styles.meaning}>every number here comes from the dials</div> : null}
                <Legal />
                <Why>Every number here comes from the dials: the gap from Time, the count from Feedback, the level from Mix. These are the four things an exam answer about delay is built from.</Why>
            </div>
        </>
    );

    const bar = (
        <>
            <Presets presets={PRESETS} presetId={state.presetId} onPreset={choosePreset} />
            <div className={styles.say} data-mode={mode}>{say}</div>
            <MoreButton open={further} onOpen={() => setFurther(true)} />
        </>
    );

    const more = further ? (
        <>
            <div className={styles.moreItem}>
                <span className={styles.eyebrow}>High cut</span>
                <Dial
                    label="High cut"
                    value={state.highCut}
                    min={0}
                    max={100}
                    size="small"
                    format={(v) => { const hz = highCutHz(v); return hz >= 19000 ? 'open' : hz >= 1000 ? (hz / 1000).toFixed(1) + ' kHz' : Math.round(hz) + ' Hz'; }}
                    onChange={(v) => update({ highCut: v })}
                />
                <span className={styles.value}>{(() => { const hz = highCutHz(state.highCut); return hz >= 19000 ? 'open' : hz >= 1000 ? (hz / 1000).toFixed(1) + ' kHz' : Math.round(hz) + ' Hz'; })()}</span>
            </div>
            <div className={styles.moreItem}>
                <span className={styles.eyebrow}>Stereo</span>
                <Chips
                    label="Stereo"
                    options={[{ id: 'mono', label: 'Mono' }, { id: 'pingpong', label: 'Ping-pong' }]}
                    value={state.stereo}
                    onChange={(id) => update({ stereo: id })}
                />
            </div>
            <div className={styles.moreItem}>
                <span className={styles.eyebrow}>More note values</span>
                <Chips label="More note values" options={furtherNoteOptions} value={syncValue} onChange={chooseNote} />
            </div>
        </>
    ) : null;

    const stage = (
        <>
            <canvas
                ref={canvasRef}
                aria-label="Hits and their repeats against the beat"
                role="img"
                onPointerMove={onStageMove}
                onPointerLeave={() => setHover(null)}
            />
            <div className={styles.stageNote}>
                <b>{bars} bars · {playing ? bpmRef.current : state.bpm} BPM{state.stereo === 'pingpong' ? ' · L and R' : ''}</b>
                <span>{ORIENT}</span>
            </div>
            <div className={styles.stageLegend} aria-hidden="true">
                <span><i style={{ background: 'var(--hit)' }} />hit</span>
                {Array.from({ length: legendN }, (_, i) => (
                    <span key={i}><i style={{ background: `var(--gen-${i + 1})` }} />{i + 1}</span>
                ))}
                <em>← trips round the loop</em>
            </div>
            {hover && teach ? (
                <div
                    className={styles.tip}
                    style={{
                        left: hover.x + 284 > hover.stageW ? hover.x - 286 : hover.x + 16,
                        top: Math.max(44, Math.min(hover.stageH - 120, hover.y - 30)),
                    }}
                >
                    <i>Repeat {hover.n} · of the hit on {hover.where}</i>
                    <p>
                        Arrived <b>{fmtMs(delaySec * hover.n)}</b> after its hit. {hover.n === 1 ? 'One trip' : `${hover.n} trips`} round the loop, so it is <b>{Math.round(Math.pow(fb, hover.n) * 100)}%</b> as loud as the original{hover.lane === 'L' || hover.lane === 'R' ? `, on the ${hover.lane === 'L' ? 'left' : 'right'}` : ''}.
                    </p>
                </div>
            ) : null}
            {!began ? (
                <div className={styles.begin}>
                    <button type="button" className={styles.beginBtn} onClick={() => audio.start()}>
                        <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1.2v9.6L11 6z" fill="currentColor" /></svg>
                        <span>
                            Play the bench
                            <small>Real drums through a real delay. Headphones help.</small>
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
            onDepth={setDepth}
            stage={stage}
            bar={bar}
            more={more}
            console={consoleSlot}
            drawerTabs={drawerTabs}
        />
    );
}
