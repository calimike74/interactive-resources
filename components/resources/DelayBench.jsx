'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BenchFrame from '@/components/bench/BenchFrame';
import { Knob, Segmented, GoFurther } from '@/components/bench/controls';
import { BenchTransport, ExamCallout, useBenchMode } from '@/components/bench/BenchBits';
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
} from '@/lib/bench/delay-model';

// The Delay bench (1.12) — the reference bench for BENCH-STANDARD.md.
// One graph makes the sound and the picture: lib/bench/delay-model.js
// holds the numbers, the Web Audio graph below plays them, the stage
// draws them. Design doc: docs/superpowers/specs/2026-08-21-delay-bench-design.md

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
const PATTERNS = {
    drums: {
        label: 'Drums',
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
        bars: 2,
        steps: [
            ...[0, 4, 8, 12, 16, 20, 24, 28].map((s) => ({ s, name: '808-kick', g: 1 })),
            ...[4, 12, 20, 28].map((s) => ({ s, name: '808-snare', g: 0.8 })),
            ...Array.from({ length: 8 }, (_, i) => ({ s: i * 4 + 2, name: '808-hat', g: 0.35 })),
            { s: 30, name: '808-openhat', g: 0.5 },
        ],
    },
    vocal: { label: 'Vocal', bars: 4, steps: [{ s: 0, name: 'vocal', g: 1 }] },
    stab: { label: 'Stab', bars: 2, steps: [{ s: 0, name: 'stab-brass', g: 1 }, { s: 16, name: 'stab-guitar', g: 1 }] },
};
const SOURCE_IDS = ['drums', 'electronic', 'vocal', 'stab'];

const CODE = '1.12 Delay';
const TITLE = 'Delay bench';
const ORIENT = 'Each dark mark is a hit; the lighter ones to its right are its repeats. The grid behind is the beat.';

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
    const stateRef = useRef(state);
    stateRef.current = state;
    const { studioOrigin } = useStudioArrival();

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
    const togglePlay = () => (playing ? audio.stop() : audio.start());

    const delaySec = delayTimeSec(state);
    // What the loop will do to one hit: repeats louder than -40 dB of the
    // original, from the same recursion the stage draws.
    const audible = repeatMarks({ t0: 0, amp: 1, delaySec, feedback: state.feedback, windowEnd: 8, floor: 0.01 }).length;
    const audibleLabel = state.feedback >= 100 ? 'no decay' : audible >= 30 ? '30+' : String(audible);

    // ---- stage ----
    const canvasRef = useRef(null);
    useEffect(() => {
        const first = canvasRef.current;
        if (!first) return undefined;
        let raf = 0;
        const css = getComputedStyle(first.parentElement);
        const col = {
            ink: css.getPropertyValue('--ink').trim() || '#181410',
            ink2: css.getPropertyValue('--ink-2').trim() || '#4d463c',
            ink3: css.getPropertyValue('--ink-3').trim() || '#8a857c',
            line: css.getPropertyValue('--line').trim() || '#d9d1be',
            accent: css.getPropertyValue('--accent').trim() || '#2d5d4f',
            blue: css.getPropertyValue('--blue').trim() || '#2767c4',
        };
        const mono = `11px ${css.getPropertyValue('--mono').trim() || 'monospace'}`;

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
            const padL = 44;
            const padR = 22;
            const top = 54;
            const bottom = h - 40;
            const plotW = w - padL - padR;
            const plotH = bottom - top;
            const xOf = (t) => padL + (((t % win) + win) % win) / win * plotW;
            const pp = s.stereo === 'pingpong';
            const lanes = pp
                ? { L: { y0: top, y1: top + plotH / 2 - 6 }, R: { y0: top + plotH / 2 + 6, y1: bottom }, C: { y0: top, y1: bottom } }
                : { L: { y0: top, y1: bottom }, R: { y0: top, y1: bottom }, C: { y0: top, y1: bottom } };

            // beat grid
            ctx2d.lineWidth = 1;
            for (const l of grid.lines) {
                if (l.index === grid.lines.length - 1) continue;
                const x = xOf(l.t);
                ctx2d.strokeStyle = l.downbeat ? col.ink3 : col.line;
                ctx2d.beginPath();
                ctx2d.moveTo(x + 0.5, top - 8);
                ctx2d.lineTo(x + 0.5, bottom + 8);
                ctx2d.stroke();
                if (l.downbeat) {
                    ctx2d.fillStyle = col.ink3;
                    ctx2d.font = mono;
                    ctx2d.textAlign = 'left';
                    ctx2d.fillText(`bar ${Math.floor(l.index / 4) + 1}`, x + 6, bottom + 22);
                }
            }
            // sixteenth ticks when synced to a short value
            if (s.sync && (s.noteId === 'sixteenth' || s.noteId === 'eighth' || s.noteId === 'dottedEighth' || s.noteId === 'tripletEighth')) {
                const sub = s.noteId === 'tripletEighth' ? grid.beatSec / 3 : grid.beatSec / 4;
                ctx2d.strokeStyle = col.line;
                for (let t = 0; t < win; t += sub) {
                    const x = xOf(t);
                    ctx2d.beginPath();
                    ctx2d.moveTo(x + 0.5, bottom + 2);
                    ctx2d.lineTo(x + 0.5, bottom + 8);
                    ctx2d.stroke();
                }
            }
            // lane labels
            if (pp) {
                ctx2d.fillStyle = col.ink3;
                ctx2d.font = mono;
                ctx2d.textAlign = 'right';
                ctx2d.fillText('L', padL - 10, (lanes.L.y0 + lanes.L.y1) / 2 + 4);
                ctx2d.fillText('R', padL - 10, (lanes.R.y0 + lanes.R.y1) / 2 + 4);
                ctx2d.strokeStyle = col.line;
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

            const gains = mixGains(s.mix);
            // A hit is a slim bar whose height is its level; a repeat the same
            // in the accent, fainter as it decays. Only a long phrase (the
            // vocal) keeps its envelope shape, drawn light so the repeats
            // behind it still read. Nothing here is decoration: x is the
            // time the graph plays it, height is the gain it plays it at.
            const pxPerSec = plotW / win;
            function drawShape(t0, level, lane, buffer, isRepeat, sounding, ghostLevel = 0) {
                const lane_ = lanes[lane] || lanes.C;
                const laneH = lane_.y1 - lane_.y0;
                const maxH = laneH * 0.9;
                const x0 = xOf(t0);
                const baseline = lane_.y1;
                const long = buffer && buffer.duration > 1.5;
                ctx2d.fillStyle = sounding ? col.blue : isRepeat ? col.accent : col.ink;
                if (long) {
                    const env = envelopeOf(buffer, 160);
                    const wpx = Math.min(buffer.duration * pxPerSec, plotW);
                    const n = env.length;
                    const step = wpx / n;
                    ctx2d.globalAlpha = isRepeat ? 0.22 + 0.5 * level : 0.55;
                    ctx2d.beginPath();
                    ctx2d.moveTo(x0, baseline);
                    for (let i = 0; i < n; i += 1) {
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
                const wpx = isRepeat ? 5 : 7;
                if (ghostLevel > 0) {
                    // where the hit sits even when the dry is mixed right out
                    ctx2d.globalAlpha = 0.35;
                    ctx2d.fillStyle = col.ink3;
                    ctx2d.fillRect(x0 - 0.5, baseline - ghostLevel * maxH, 1, ghostLevel * maxH);
                    ctx2d.fillStyle = sounding ? col.blue : col.ink;
                }
                ctx2d.globalAlpha = isRepeat ? Math.min(1, 0.3 + 0.7 * level) : 1;
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
                if (buffer && buffer.duration > 1.5) {
                    drawShape(tLocal, level, 'C', buffer, false, sounding, step.g);
                } else {
                    add('C', tLocal, { level, ghost: step.g, repeat: false, sounding });
                    if (pp) { add('L', tLocal, { level: 0, ghost: 0, repeat: false, sounding: false, spacer: true }); }
                }
            }
            for (const { step, tLocal, buffer } of hits) {
                const marks = repeatMarks({ t0: tLocal, amp: step.g, delaySec: d, feedback: s.feedback, windowEnd: tLocal + win, stereo: s.stereo });
                for (const m of marks) {
                    const level = Math.min(1, m.level * gains.wet);
                    const lane = pp ? m.lane : 'C';
                    const sounding = isSounding(loopOrigin + m.t);
                    if (buffer && buffer.duration > 1.5) {
                        drawShape(m.t, level, lane, buffer, true, sounding);
                        continue;
                    }
                    add(lane, m.t, { level, repeat: true, sounding });
                }
            }
            for (const col_ of columns.values()) {
                const lane_ = lanes[col_.lane] || lanes.C;
                const laneH = lane_.y1 - lane_.y0;
                const maxH = laneH * 0.9;
                const items = col_.items.filter((i) => !i.spacer);
                if (!items.length) continue;
                const heights = items.map((i) => Math.max(2, i.level * maxH));
                const total = heights.reduce((a, b) => a + b, 0) + GAP * (items.length - 1);
                const scale = total > maxH ? maxH / total : 1;
                const x0 = xOf(col_.t);
                let y = lane_.y1;
                const hit = items.find((i) => !i.repeat);
                if (hit && hit.ghost > 0) {
                    ctx2d.globalAlpha = 0.35;
                    ctx2d.fillStyle = col.ink3;
                    ctx2d.fillRect(x0 - 0.5, lane_.y1 - hit.ghost * maxH * scale, 1, hit.ghost * maxH * scale);
                }
                items.forEach((it, i) => {
                    const hh = heights[i] * scale;
                    const w = it.repeat ? 5 : 7;
                    ctx2d.fillStyle = it.sounding ? col.blue : it.repeat ? col.accent : col.ink;
                    ctx2d.globalAlpha = it.repeat ? Math.min(1, 0.35 + 0.65 * it.level) : 1;
                    ctx2d.beginPath();
                    ctx2d.roundRect(x0 - w / 2, y - hh, w, hh, i === items.length - 1 ? [2, 2, 0, 0] : 0);
                    ctx2d.fill();
                    y -= hh + GAP * scale;
                });
                ctx2d.globalAlpha = 1;
            }

            // the delay-time bracket on the first hit
            const first = pat.steps[0];
            if (first) {
                const xa = xOf(first.s * sixteenth);
                const xb = xOf(first.s * sixteenth + d);
                const y = top + 2;
                ctx2d.strokeStyle = col.accent;
                ctx2d.fillStyle = col.accent;
                ctx2d.lineWidth = 1;
                if (xb > xa) {
                    ctx2d.beginPath();
                    ctx2d.moveTo(xa + 0.5, y + 6); ctx2d.lineTo(xa + 0.5, y);
                    ctx2d.lineTo(xb + 0.5, y); ctx2d.lineTo(xb + 0.5, y + 6);
                    ctx2d.stroke();
                    ctx2d.font = mono;
                    ctx2d.textAlign = 'center';
                    const label = s.sync ? `${NOTE_VALUES[s.noteId].label} · ${fmtMs(d)}` : fmtMs(d);
                    ctx2d.fillText(label, (xa + xb) / 2, y - 6);
                }
            }

            // playhead
            if (now != null) {
                const x = xOf(now - loopOrigin);
                ctx2d.strokeStyle = col.ink;
                ctx2d.lineWidth = 1.5;
                ctx2d.beginPath();
                ctx2d.moveTo(x, top - 10);
                ctx2d.lineTo(x, bottom + 10);
                ctx2d.stroke();
            }

            raf = requestAnimationFrame(draw);
        }
        raf = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(raf);
    }, [ctxRef, bpmRef, getBuffer]);

    // ---- drawer content ----
    const topicHref = (slug) => memberTopicHref(null, slug, studioOrigin);
    const drawerTabs = useMemo(() => [
        {
            id: 'reference',
            label: 'Reference',
            render: () => (
                <>
                    <h2>Delay, in the spec's words</h2>
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
            label: 'Teacher notes',
            render: () => (
                <>
                    <h2>Why the bench is built this way</h2>
                    <p>The stage shows the feedback recursion itself: each repeat is the last one scaled by the feedback amount, spaced by the delay time. Students who can see that stop describing feedback as volume or distortion.</p>
                    <h3>What the examiners saw</h3>
                    <p>On the 2023 paper's Q6 (a vocal chain with compression, EQ and a delay), the Principal Examiner wrote: "most candidates were able to identify that the high feedback was inappropriate and would cause too many repeats, but some candidates thought that the feedback setting was related to distortion or heavy metal in general. Very few candidates were able to work out that the delay time was tempo synced at a quaver. Some candidates incorrectly argued that the offset in delay times was a mistake and that changing the times to be identical would improve the stereo image."</p>
                    <p className={styles.source}>Source: Edexcel Principal Examiner Feedback, 9MT0/04, Summer 2023, Question 6.</p>
                    <p>Those three errors are the bench's three moves: raise Feedback and count the repeats; switch Sync to 1/8 and watch the repeats land on the grid; set Ping-pong and hear why two different-sided delay times are the point, not a mistake.</p>
                    <h3>Classroom moves</h3>
                    <ul>
                        <li>Hold the dry button while the class listens, let go, and ask what came back.</li>
                        <li>Set Time by ear to land on the beat at 110 BPM, then switch Sync on and compare the numbers.</li>
                        <li>Raise Feedback to 100% and ask when it should be turned down. Then ask what a limiter is doing for them.</li>
                        <li>With Long tail selected, ask why the later repeats sound duller, then show High cut.</li>
                    </ul>
                    <h3>Exam callouts</h3>
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

    // ---- console ----
    const prompt = mode === 'teacher'
        ? <><b>Ask:</b> what changes when Feedback goes up, the number of repeats or their loudness?</>
        : <><b>Try:</b> switch Sync to 1/8, then raise Feedback until the repeats blur into one another.</>;

    const syncOptions = [
        { id: 'off', label: 'Off' },
        ...CORE_NOTE_IDS.map((id) => ({ id, label: NOTE_VALUES[id].label })),
    ];
    const furtherNoteOptions = FURTHER_NOTE_IDS.map((id) => ({ id, label: NOTE_VALUES[id].label }));
    const syncValue = state.sync ? state.noteId : 'off';

    const consoleSlot = (
        <>
            <div className={styles.prompt}>{prompt}</div>
            <div className={styles.group}>
                <Segmented
                    label="Source"
                    options={SOURCE_IDS.map((id) => ({ id, label: PATTERNS[id].label }))}
                    value={state.source}
                    onChange={(id) => update({ source: id })}
                />
                <Knob
                    label="Time"
                    value={state.sync ? Math.round(delaySec * 1000) : state.timeMs}
                    min={20}
                    max={2000}
                    step={1}
                    unit="ms"
                    disabled={state.sync}
                    onChange={(v) => update({ timeMs: v, sync: false })}
                    title={state.sync ? 'Set by Sync. Choose Off to set the time by hand.' : 'Delay time in milliseconds'}
                />
                <Segmented label="Sync" options={syncOptions} value={syncValue} onChange={chooseNote} />
                <Knob label="Feedback" value={state.feedback} min={0} max={100} unit="%" onChange={(v) => update({ feedback: v })} />
                <Knob label="Mix" value={state.mix} min={0} max={100} unit="%" onChange={(v) => update({ mix: v })} />
                <Knob label="Tempo" value={state.bpm} min={BPM_MIN} max={BPM_MAX} unit="BPM" onChange={(v) => update({ bpm: v })} />
            </div>
            <div className={styles.readout} aria-live="polite">
                <div><b>{fmtMs(delaySec)}</b><span>between repeats</span></div>
                <div><b>{audibleLabel}</b><span>repeats you can hear</span></div>
                <div><b>{state.feedback}%</b><span>of the last, each time</span></div>
                <div><b>{state.mix}%</b><span>wet in the mix</span></div>
            </div>
            <GoFurther open={further} onOpen={() => setFurther(true)}>
                <Knob
                    label="High cut"
                    value={state.highCut}
                    min={0}
                    max={100}
                    format={(v) => { const hz = highCutHz(v); return hz >= 19000 ? 'open' : hz >= 1000 ? (hz / 1000).toFixed(1) + ' kHz' : Math.round(hz) + ' Hz'; }}
                    onChange={(v) => update({ highCut: v })}
                />
                <Segmented
                    label="Stereo"
                    options={[{ id: 'mono', label: 'Mono' }, { id: 'pingpong', label: 'Ping-pong' }]}
                    value={state.stereo}
                    onChange={(id) => update({ stereo: id })}
                />
                <Segmented label="More" options={furtherNoteOptions} value={syncValue} onChange={chooseNote} ariaLabel="More note values" />
            </GoFurther>
        </>
    );

    const stage = (
        <>
            <canvas ref={canvasRef} aria-label="Hits and their repeats against the beat grid" role="img" />
            <div className={styles.stageLegend} aria-hidden="true">
                <span><i style={{ background: 'var(--ink)' }} />hit</span>
                <span><i style={{ background: 'var(--accent)' }} />repeat</span>
                <span><i style={{ background: 'var(--blue)' }} />sounding now</span>
            </div>
            <div className={styles.stageNote}>
                {bars} bars at {playing ? bpmRef.current : state.bpm} BPM · {state.stereo === 'pingpong' ? 'left and right lanes' : 'one lane'}
            </div>
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

    const transport = (
        <BenchTransport
            playing={playing}
            onTogglePlay={togglePlay}
            onHoldDry={(held) => nodesRef.current?.graph?.holdDry(held)}
            level={state.level}
            onLevel={(v) => setState((s) => ({ ...s, level: v }))}
            presets={PRESETS}
            presetId={state.presetId}
            onPreset={choosePreset}
        />
    );

    return (
        <BenchFrame
            code={CODE}
            title={TITLE}
            orientation={ORIENT}
            back={back}
            mode={mode}
            onMode={setMode}
            stage={stage}
            console={consoleSlot}
            transport={transport}
            drawerTabs={drawerTabs}
        />
    );
}
