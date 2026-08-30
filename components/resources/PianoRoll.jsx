'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BenchFrame from '@/components/bench/BenchFrame';
import { Dial, Chips, Why, MoreButton } from '@/components/bench/controls';
import { PlayColumn, Presets, Legal, ExamCallout, useBenchMode, useBenchDepth, DEPTHS } from '@/components/bench/BenchBits';
import { useBenchAudio, glide } from '@/components/bench/useBenchAudio';
import styles from '@/components/bench/bench.module.css';
import { memberTopicHref, useStudioArrival } from '@/lib/studio-return';
import { DEPTH_LINES, DEPTH_TEACH, judge, open as openMachine, hearingLine, nextMove } from '@/lib/bench/midi-depth';
import {
    BPM, BARS, BEATS, PPQ,
    PART_IDS, PARTS, KIT_IDS, KITS, SOUND_IDS, SOUNDS, DRUM_NOTES, BASS_RANGE,
    GRID_IDS, GRIDS, RANGE_IDS, RANGES, BEND_MIN, BEND_MAX,
    PRESETS, TASKS, DEFAULT_STATE,
    applyPreset, referenceOf, setPart, setKit, setGrid, setStrength, setRange, setLane, select, setLevel,
    moveNote, addNote, removeNote, setVelocity, resetPart, clearBar, assign,
    placed, placedTime, selectedNote, verdict, readings, velocityTable, mapFaults, smallestValue, feelWord,
    bendAt, bendSemitones, noteName, toBinary, fmtPos, fmtBeat, velWord, bits8, hex2, noteOnBytes, bendBytes, bendUnsigned, eventList, otherMessages, barOf, snapTo,
} from '@/lib/bench/midi-model';

// The Piano Roll (1.5), seventh bench to the Bench Standard. The MIDI
// file the paper hands over, on the bench: four bars of one part on the
// piano roll with the velocity lane beneath it, as a DAW draws them, and
// the papers' own questions as presets: the velocity table, the wrong
// drum sounds, the quantise value, the triplet trap, the bend range, the
// bar to draw. Three jobs (lib/bench/midi-depth.js): Core shows the roll,
// A-level opens the list editor and answers the paper, Extension shows
// the bytes on the wire. The note on the roll is the control (law 22).
//
// The bass plays on a square-wave synth, the papers' own part (2020,
// 2023, 2026: "use a square wave", "match the pitch bend range", "copy the
// velocity sensitive filtering"): the one place the standard admits an
// oscillator, and the bench declares it (synthesis).

const CODE = '1.5 Sequencing';
const TITLE = 'Piano Roll';
const AUDIO = '/bench-audio/midi';
const FILES = Object.fromEntries(KIT_IDS.flatMap((kit) => SOUND_IDS.map((id) => [`${kit}-${id}`, `${AUDIO}/${kit}-${id}.mp3`])));
const ORIENTS = {
    core: 'The piano roll and its velocity lane. Drag a note in time or onto another row; drag its velocity bar; click an empty cell to add a note.',
    alevel: 'The list editor beside the roll: each note a row, its position in bar, beat, division and tick, and its velocity in binary. Faults in coral.',
    extension: 'Under the roll, the wire: the selected note\'s three bytes, and the last message sent as it plays. The first bit of every byte is the flag.',
};
const ROLL_TOOLS = [{ id: 'reset', label: 'Back to the file' }, { id: 'clear2', label: 'Clear bar 2' }];
const velGain = (vel) => (vel / 127) ** 1.6;
const TOL = 1 / 64;

// ---- the graph ------------------------------------------------------------
// Two parts into the master: the drums as one-shots from the kit, the bass
// as a square-wave voice a note at a time. One part plays at once, as the
// paper bounces it. Every event booked is also pushed to the wire for the
// Extension strip.
function buildRollGraph(ctx, input, master) {
    const drumsIn = ctx.createGain();
    drumsIn.gain.value = 0.9;
    const bassIn = ctx.createGain();
    bassIn.gain.value = 0.42; // measured 30 Aug: the bass sat 3 dB over the kits at 0.55
    drumsIn.connect(master);
    bassIn.connect(master);
    input.connect(master);
    const live = new Set();
    let beats = []; // { beat, time, beatSec }
    const wire = []; // the last messages sent: { time, bytes, label }

    function voice(when, n, s, beatSec) {
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.value = 440 * 2 ** ((n.note - 69) / 12);
        const filt = ctx.createBiquadFilter();
        filt.type = 'lowpass';
        filt.Q.value = 1.6;
        const vel = n.vel / 127;
        const dur = Math.max(0.05, n.len * beatSec);
        const peak = 500 + vel * vel * 3600; // velocity-sensitive filtering
        const floor = Math.max(160, peak * 0.22);
        filt.frequency.setValueAtTime(peak, when);
        filt.frequency.exponentialRampToValueAtTime(floor, when + Math.min(dur, 0.32));
        const env = ctx.createGain();
        env.gain.setValueAtTime(0, when);
        env.gain.linearRampToValueAtTime(0.5, when + 0.006);
        env.gain.setValueAtTime(0.5, when + dur);
        env.gain.setTargetAtTime(0, when + dur, 0.018);
        // the bend lane, in cents, sampled every 32nd of a beat across the note
        const steps = Math.max(2, Math.ceil(n.len * 8) + 1);
        const curve = new Float32Array(steps);
        for (let i = 0; i < steps; i += 1) curve[i] = bendSemitones(bendAt(s.bends, n.at + (i / (steps - 1)) * n.len), s.bendRange) * 100;
        try { osc.detune.setValueCurveAtTime(curve, when, dur); } catch { /* a very short note */ }
        osc.connect(filt);
        filt.connect(env);
        env.connect(bassIn);
        osc.start(when);
        osc.stop(when + dur + 0.12);
        const item = { osc, env };
        live.add(item);
        osc.onended = () => live.delete(item);
    }
    function send(time, bytes, label) {
        wire.push({ time, bytes, label });
        if (wire.length > 64) wire.splice(0, wire.length - 64);
    }
    function schedule(beat, time, beatSec) {
        beats.push({ beat, time, beatSec });
        // the loop's origin, for scripts/measure-roll.mjs
        if (beat % BEATS === 0) window.__benchLoopStart = time;
        const now = ctx.currentTime;
        beats = beats.filter((b) => b.time > now - 2 || b === beats[beats.length - 1]);
    }
    function clear() {
        const now = ctx.currentTime;
        for (const { osc, env } of live) { try { env.gain.setTargetAtTime(0, now, 0.004); osc.stop(now + 0.03); } catch { /* ended */ } }
        live.clear();
        beats = [];
        wire.length = 0;
    }
    function position() {
        if (!beats.length) return null;
        const now = ctx.currentTime;
        let cur = null;
        for (const b of beats) if (b.time <= now) cur = b;
        if (!cur) return 0;
        const frac = (now - cur.time) / cur.beatSec;
        return ((cur.beat % BEATS) + Math.min(frac, 0.999)) / BEATS;
    }
    return { drumsIn, bassIn, voice, send, schedule, clear, position, wire, live };
}

// ---- the bench ------------------------------------------------------------
export default function PianoRoll({ back }) {
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
    const refRef = useRef(referenceOf(DEFAULT_STATE));
    useEffect(() => { refRef.current = referenceOf(state); }, [state]);

    // One beat a tick: the scheduler's "bar" is a beat, so a held example or
    // an edit lands within a beat rather than a bar.
    const onSchedule = useCallback((tick) => {
        const g = graphRef.current;
        if (!g) return;
        const s = heldRef.current ? refRef.current : stateRef.current;
        const beat = tick.bar % BEATS;
        const notes = placed(s, s.part);
        for (const n of notes) {
            if (n.at < beat || n.at >= beat + 1) continue;
            const when = tick.barStart + (n.at - beat) * tick.beatSec;
            if (s.part === 'drums') {
                const sound = s.map[n.note];
                if (!sound) continue;
                tick.playBuffer(`${s.kit}-${sound}`, when, { gain: velGain(n.vel), destination: g.drumsIn });
                g.send(when, noteOnBytes(PARTS.drums.channel, n.note, n.vel), `Note On ${noteName(n.note)} ${SOUNDS[sound].short.toLowerCase()} ${n.vel}`);
            } else {
                g.voice(when, n, s, tick.beatSec);
                g.send(when, noteOnBytes(PARTS.bass.channel, n.note, n.vel), `Note On ${noteName(n.note)} ${n.vel}`);
            }
        }
        if (s.part === 'bass') {
            for (const b of s.bends) {
                if (b.t < beat || b.t >= beat + 1) continue;
                g.send(tick.barStart + (b.t - beat) * tick.beatSec, bendBytes(PARTS.bass.channel, b.v), `Pitch bend ${b.v}`);
            }
        }
        g.schedule(tick.bar, tick.barStart, tick.beatSec);
    }, []);
    const buildGraph = useCallback((ctx, input, master) => {
        const g = buildRollGraph(ctx, input, master);
        graphRef.current = g;
        return g;
    }, []);
    const audio = useBenchAudio({ files: FILES, bpm: BPM, beatsPerBar: 1, onSchedule, buildGraph });
    const { ctxRef, nodesRef, began, playing } = audio;
    const playingRef = useRef(false);
    playingRef.current = playing;

    useEffect(() => {
        const ctx = ctxRef.current;
        const nodes = nodesRef.current;
        if (ctx && nodes) glide(nodes.level.gain, state.level, ctx);
    }, [state.level, began, ctxRef, nodesRef]);

    const touch = (what) => { setLast(what); setAnnounce(null); };
    const chooseDepth = (id) => { setDepth(id); setAnnounce(id); };
    const choosePart = (id) => { setState((s) => setPart(s, id)); touch('part'); };
    const chooseKit = (id) => { setState((s) => setKit(s, id)); touch('kit'); };
    const chooseGrid = (id) => { setState((s) => setGrid(s, id)); touch('grid'); };
    const chooseStrength = (v) => { setState((s) => setStrength(s, v)); touch('grid'); };
    const chooseRange = (id) => { setState((s) => setRange(s, id)); touch('range'); };
    const chooseLane = (id) => { setState((s) => setLane(s, id)); touch('lane'); };
    const choosePreset = (id) => { setState((s) => applyPreset(s, id)); touch('preset'); };
    const chooseSound = (id) => { setState((s) => { const n = selectedNote(s); return n ? assign(s, n.note, id) : s; }); touch('sound'); };
    const rollTool = (id) => { setState((s) => (id === 'reset' ? resetPart(s) : clearBar(s, 2))); touch(id === 'reset' ? 'preset' : 'note'); };
    const holdExample = (on) => { heldRef.current = on; setHeld(on); };
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
    const vd = useMemo(() => verdict(state), [state]);
    const rd = useMemo(() => readings(state), [state]);
    const vdRef = useRef(vd); vdRef.current = vd;
    const rdRef = useRef(rd); rdRef.current = rd;
    const task = state.task ? TASKS[state.task] : null;
    const sel = rd.sel;

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
    const stageOf = (d) => (d === 'core' ? 'roll' : d === 'alevel' ? 'list' : 'wire');
    const rowsOf = (s) => (s.part === 'drums' ? DRUM_NOTES : Array.from({ length: BASS_RANGE[1] - BASS_RANGE[0] + 1 }, (_, i) => BASS_RANGE[0] + i));
    const geom = (w, h2, d, s) => {
        const short = h2 < 330;
        const padL = d !== 'core' && s.part === 'drums' ? 92 : 50; const padR = 16; const top = short ? 48 : 54; const bottom = h2 - (short ? 18 : 24);
        const listW = d === 'alevel' ? Math.round(Math.max(330, Math.min(470, w * 0.4))) : 0;
        const wireH = d === 'extension' ? 58 : 0;
        const x1 = w - padR - listW - (listW ? 12 : 0);
        const laneH = d === 'extension' ? (short ? 44 : 54) : (short ? 56 : 64);
        const gap = short ? 8 : 10;
        const rollBottom = bottom - wireH - (wireH ? 10 : 0) - laneH - gap;
        return {
            w, h: h2, top, bottom, settingY: top - 10,
            roll: { x0: padL, x1, top, bottom: rollBottom },
            lane: { x0: padL, x1, top: rollBottom + gap, bottom: bottom - wireH - (wireH ? 10 : 0) },
            list: listW ? { x0: x1 + 12, x1: w - padR, top, bottom: bottom - wireH - (wireH ? 10 : 0) } : null,
            wire: wireH ? { x0: padL, x1: w - padR, top: bottom - wireH, bottom } : null,
            rows: rowsOf(s),
        };
    };

    useEffect(() => {
        const first = canvasRef.current;
        if (!first) return undefined;
        let raf = 0;
        const css = getComputedStyle(first.parentElement);
        const v = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
        const col = {
            drums: v('--gen-2', '#7fb0c4'),
            bass: v('--gen-1', '#7fb39b'),
            teal: v('--teal', '#7cc4b8'),
            purple: v('--purple', '#a395c9'),
            coral: v('--gen-6', '#d08a80'),
            goldBright: v('--gold-bright', '#f0d48a'),
            white: '#ffffff',
            ink: 'rgba(255, 255, 255, 0.86)',
            inkSoft: 'rgba(255, 255, 255, 0.62)',
            inkFaint: 'rgba(255, 255, 255, 0.38)',
            grid: 'rgba(255, 255, 255, 0.07)',
            gridBeat: 'rgba(255, 255, 255, 0.14)',
            gridBar: 'rgba(255, 255, 255, 0.26)',
            line: 'rgba(255, 255, 255, 0.22)',
            black: 'rgba(0, 0, 0, 0.16)',
            rowHot: 'rgba(255, 255, 255, 0.05)',
        };
        const monoFace = v('--mono', 'monospace');
        const mono = `11.5px ${monoFace}`;
        const monoSmall = `10px ${monoFace}`;
        const monoTiny = `9px ${monoFace}`;

        function draw() {
            const canvas = canvasRef.current;
            if (!canvas) { raf = requestAnimationFrame(draw); return; }
            const g2 = canvas.getContext('2d');
            const s = stateRef.current;
            const d = depthRef.current;
            const vdd = vdRef.current;
            const isHeld = heldRef.current;
            const shown = isHeld ? refRef.current : s;
            const dpr = window.devicePixelRatio || 1;
            const w = canvas.clientWidth;
            const hgt = canvas.clientHeight;
            if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(hgt * dpr)) {
                canvas.width = Math.round(w * dpr);
                canvas.height = Math.round(hgt * dpr);
            }
            g2.setTransform(dpr, 0, 0, dpr, 0, 0);
            g2.clearRect(0, 0, w, hgt);
            const g = geom(w, hgt, d, shown);
            const R = g.roll; const L = g.lane;
            const rows = g.rows;
            const rowH = (R.bottom - R.top) / rows.length;
            const xOf = (t) => R.x0 + (t / BEATS) * (R.x1 - R.x0);
            const tOf = (x) => ((x - R.x0) / (R.x1 - R.x0)) * BEATS;
            const yRow = (note) => R.bottom - (rows.indexOf(note) + 1) * rowH; // the row's top
            const rowAt = (y) => rows[Math.max(0, Math.min(rows.length - 1, Math.floor((R.bottom - y) / rowH)))];
            const pad = 6;
            const laneY = (val01) => L.bottom - pad - Math.max(0, Math.min(1, val01)) * (L.bottom - L.top - pad * 2);
            const laneV = (y) => (L.bottom - pad - y) / (L.bottom - L.top - pad * 2);
            const pcol = col[shown.part];
            const notes = placed(shown, shown.part);
            const faults = shown.part === 'drums' ? mapFaults(shown) : [];
            const faultNotes = new Set(faults.map((f) => f.note));
            const gr = graphRef.current;
            const frac = playingRef.current && gr ? gr.position() : null;
            const beatNow = frac == null ? null : frac * BEATS;
            const gridBeats = shown.grid === 'off' ? 0.25 : GRIDS[shown.grid].beats;
            const bendLane = shown.part === 'bass' && shown.lane === 'bend';
            g2.font = mono; g2.lineWidth = 1;

            // ---- the roll: rows, black keys, wrong-sound rows, the grid ----
            rows.forEach((note, i) => {
                const y = R.bottom - (i + 1) * rowH;
                const isBlack = shown.part === 'bass' && [1, 3, 6, 8, 10].includes(note % 12);
                if (isBlack) { g2.fillStyle = col.black; g2.fillRect(R.x0, y, R.x1 - R.x0, rowH); }
                if (faultNotes.has(note) && d !== 'core') { g2.fillStyle = col.coral; g2.globalAlpha = 0.12; g2.fillRect(R.x0, y, R.x1 - R.x0, rowH); g2.globalAlpha = 1; }
                g2.strokeStyle = col.grid; g2.beginPath(); g2.moveTo(R.x0, Math.round(y) + 0.5); g2.lineTo(R.x1, Math.round(y) + 0.5); g2.stroke();
                // the row's name: the sound on a drum row, the note on a bass row
                const label = shown.part === 'drums' ? SOUNDS[shown.map[note]]?.short || '' : noteName(note);
                const showLabel = shown.part === 'drums' || rowH >= 11 || note % 12 === 0 || note % 12 === 9;
                if (showLabel) {
                    g2.fillStyle = faultNotes.has(note) && d !== 'core' ? col.coral : shown.part === 'bass' && isBlack ? col.inkFaint : col.inkSoft;
                    g2.font = shown.part === 'drums' ? monoSmall : monoTiny; g2.textAlign = 'right';
                    g2.fillText(label, R.x0 - (shown.part === 'drums' && d !== 'core' ? 46 : 5), y + rowH / 2 + 3.5);
                }
                if (shown.part === 'drums' && d !== 'core') {
                    g2.fillStyle = col.inkFaint; g2.font = monoTiny; g2.textAlign = 'right';
                    g2.fillText(`${noteName(note)} ${note}`, R.x0 - 5, y + rowH / 2 + 3.5);
                }
            });
            for (let t = 0; t <= BEATS + 1e-9; t += gridBeats) {
                const x = Math.round(xOf(t)) + 0.5;
                const isBar = Math.abs(t / 4 - Math.round(t / 4)) < 1e-9;
                const isBeat = Math.abs(t - Math.round(t)) < 1e-9;
                g2.strokeStyle = isBar ? col.gridBar : isBeat ? col.gridBeat : col.grid;
                g2.beginPath(); g2.moveTo(x, R.top); g2.lineTo(x, L.bottom); g2.stroke();
                if (isBar && t < BEATS) { g2.fillStyle = col.inkFaint; g2.font = monoSmall; g2.textAlign = 'left'; g2.fillText(`bar ${t / 4 + 1}`, x + 4, L.bottom + 14); }
            }
            // the task's bar shaded at A-level
            if (d === 'alevel' && (shown.task === 'draw' || shown.task === 'triplets' || shown.task === 'velocity')) {
                const b = TASKS[shown.task].bar || 2;
                g2.fillStyle = col.goldBright; g2.globalAlpha = 0.06; g2.fillRect(xOf((b - 1) * 4), R.top, xOf(b * 4) - xOf((b - 1) * 4), L.bottom - R.top); g2.globalAlpha = 1;
            }
            g2.strokeStyle = col.line; g2.strokeRect(R.x0 + 0.5, R.top + 0.5, R.x1 - R.x0 - 1, R.bottom - R.top - 1);

            // ---- the notes: ghost where played, the block where placed ----
            const handles = [];
            const stackKeys = new Map();
            for (const n of notes) { const k = `${n.note}:${Math.round(n.at * 64)}`; stackKeys.set(k, (stackKeys.get(k) || 0) + 1); }
            for (const n of notes) {
                const y = yRow(n.note);
                if (y == null || Number.isNaN(y)) continue;
                const x0 = xOf(n.at); const x1 = Math.max(x0 + 3, xOf(Math.min(BEATS, n.at + n.len)));
                const isSel = !isHeld && n.id === s.selected;
                const stackedHere = stackKeys.get(`${n.note}:${Math.round(n.at * 64)}`) > 1;
                if (Math.abs(n.at - n.t) > TOL) {
                    g2.save(); g2.setLineDash([2, 3]); g2.strokeStyle = col.inkFaint; g2.strokeRect(xOf(n.t) + 0.5, y + 2.5, Math.max(3, x1 - x0) - 1, rowH - 5); g2.restore();
                }
                g2.fillStyle = pcol; g2.globalAlpha = isHeld ? 0.5 : isSel ? 1 : 0.78;
                g2.fillRect(x0 + 1, y + 2, x1 - x0 - 2, rowH - 4);
                g2.globalAlpha = 1;
                if (isSel) { g2.strokeStyle = col.white; g2.lineWidth = 1.5; g2.strokeRect(x0 + 1.5, y + 2.5, x1 - x0 - 3, rowH - 5); g2.lineWidth = 1; }
                if (stackedHere && d !== 'core') { g2.strokeStyle = col.coral; g2.lineWidth = 1.5; g2.strokeRect(x0 + 0.5, y + 1.5, x1 - x0 - 1, rowH - 3); g2.lineWidth = 1; }
                // the velocity tint: quieter notes paler inside the block
                if (rowH >= 10) { g2.fillStyle = '#17172b'; g2.globalAlpha = 0.55 * (1 - n.vel / 127); g2.fillRect(x0 + 1, y + 2, x1 - x0 - 2, rowH - 4); g2.globalAlpha = 1; }
                handles.push({ id: n.id, x0, x1, y, h: rowH, cx: (x0 + Math.min(x1, x0 + 14)) / 2, cy: y + rowH / 2, note: n.note, at: n.at, t: n.t, vel: n.vel, len: n.len });
            }
            // ---- A-level: the faults where they are ----
            if (d === 'alevel' && faults.length) {
                g2.font = monoSmall; g2.textAlign = 'right';
                for (const f of faults.slice(0, 8)) {
                    const txt = `wants ${SOUNDS[f.want].short.toLowerCase()}`;
                    const tw = g2.measureText(txt).width;
                    const ty = yRow(f.note) + rowH / 2;
                    g2.fillStyle = '#17172b'; g2.globalAlpha = 0.88; g2.fillRect(R.x1 - 10 - tw, ty - 6.5, tw + 8, 13); g2.globalAlpha = 1;
                    g2.fillStyle = col.coral; g2.fillText(txt, R.x1 - 6, ty + 3.5);
                }
            }
            if (d === 'alevel' && vdd.key === 'broken') {
                g2.fillStyle = col.coral; g2.font = monoSmall; g2.textAlign = 'center';
                g2.fillText('the triplets pushed onto sixteenths', (xOf(4) + xOf(8)) / 2, R.top + 12);
            }
            if (d === 'alevel' && vdd.key === 'stacked') {
                g2.fillStyle = col.coral; g2.font = monoSmall; g2.textAlign = 'right';
                g2.fillText(`${vdd.stacked} hits share a step: the rhythm changed`, R.x1 - 6, R.top + 12);
            }
            if (d === 'alevel' && vdd.key === 'directed') {
                g2.fillStyle = col.goldBright; g2.font = monoSmall; g2.textAlign = 'right';
                g2.fillText('as directed', R.x1 - 6, R.top + 12);
            }

            // ---- the lower lane: velocity, or the bend ----
            g2.strokeStyle = col.line; g2.strokeRect(L.x0 + 0.5, L.top + 0.5, L.x1 - L.x0 - 1, L.bottom - L.top - 1);
            const laneHandles = [];
            if (!bendLane) {
                g2.fillStyle = col.inkFaint; g2.font = monoTiny; g2.textAlign = 'right';
                g2.fillText('127', L.x0 - 5, laneY(1) + 3); g2.fillText('64', L.x0 - 5, laneY(0.5) + 3); g2.fillText('1', L.x0 - 5, laneY(0) + 3);
                g2.strokeStyle = col.grid; g2.beginPath(); g2.moveTo(L.x0, Math.round(laneY(0.5)) + 0.5); g2.lineTo(L.x1, Math.round(laneY(0.5)) + 0.5); g2.stroke();
                const table = d !== 'core' ? velocityTable(notes, 2) : null;
                for (const n of notes) {
                    const x = Math.round(xOf(n.at)) + 0.5;
                    const y = laneY(n.vel / 127);
                    const isSel = !isHeld && n.id === s.selected;
                    g2.strokeStyle = pcol; g2.globalAlpha = isSel ? 1 : 0.7; g2.lineWidth = isSel ? 2.5 : 1.5;
                    g2.beginPath(); g2.moveTo(x, L.bottom - pad); g2.lineTo(x, y); g2.stroke();
                    g2.fillStyle = isSel ? col.white : pcol; g2.beginPath(); g2.arc(x, y, isSel ? 3.5 : 2.5, 0, Math.PI * 2); g2.fill();
                    g2.globalAlpha = 1; g2.lineWidth = 1;
                    laneHandles.push({ id: n.id, x, y, vel: n.vel, note: n.note });
                    if (table && (n.id === table.hi.id || n.id === table.lo.id)) {
                        g2.fillStyle = col.goldBright; g2.font = monoSmall; g2.textAlign = 'left';
                        g2.fillText(`${n.vel} · ${toBinary(n.vel)}`, x + 5, n.id === table.hi.id ? y - 4 : Math.min(L.bottom - 8, y + 12));
                    }
                }
                g2.fillStyle = pcol; g2.font = monoSmall; g2.textAlign = 'left';
                g2.fillText(`VELOCITY · ${shown.part}`, L.x0 + 6, L.top + 11);
            } else {
                const yB = (bv) => L.bottom - pad - ((bv - BEND_MIN) / (BEND_MAX - BEND_MIN)) * (L.bottom - L.top - pad * 2);
                g2.fillStyle = col.inkFaint; g2.font = monoTiny; g2.textAlign = 'right';
                g2.fillText('8191', L.x0 - 5, yB(BEND_MAX) + 3); g2.fillText('0', L.x0 - 5, yB(0) + 3); g2.fillText('−8192', L.x0 - 5, yB(BEND_MIN) + 3);
                g2.strokeStyle = col.gridBeat; g2.beginPath(); g2.moveTo(L.x0, Math.round(yB(0)) + 0.5); g2.lineTo(L.x1, Math.round(yB(0)) + 0.5); g2.stroke();
                g2.strokeStyle = col.teal; g2.lineWidth = 2; g2.beginPath();
                g2.moveTo(xOf(0), yB(bendAt(shown.bends, 0)));
                for (let t = 0; t <= BEATS; t += 1 / 16) g2.lineTo(xOf(t), yB(bendAt(shown.bends, t)));
                g2.stroke(); g2.lineWidth = 1;
                for (const p of shown.bends) { g2.fillStyle = col.teal; g2.beginPath(); g2.arc(xOf(p.t), yB(p.v), 3, 0, Math.PI * 2); g2.fill(); }
                g2.fillStyle = col.teal; g2.font = monoSmall; g2.textAlign = 'left';
                g2.fillText(`PITCH BEND · range ${shown.bendRange} semitones · the data are the file's, the range is the synth's`, L.x0 + 6, L.top + 11);
            }

            // ---- A-level: the list editor ----
            if (g.list) {
                const Ls = g.list;
                g2.strokeStyle = col.line; g2.strokeRect(Ls.x0 + 0.5, Ls.top + 0.5, Ls.x1 - Ls.x0 - 1, Ls.bottom - Ls.top - 1);
                g2.fillStyle = col.goldBright; g2.font = monoSmall; g2.textAlign = 'left';
                g2.fillText('LIST EDITOR', Ls.x0 + 8, Ls.top + 13);
                const cols = { pos: Ls.x0 + 8, status: Ls.x0 + 122, note: Ls.x0 + 200, vel: Ls.x0 + 258, bin: Ls.x0 + 296 };
                const lineH = 15;
                let y = Ls.top + 30;
                g2.fillStyle = col.inkFaint;
                g2.fillText('bar beat div tick', cols.pos, y); g2.fillText('status', cols.status, y); g2.fillText('note', cols.note, y); g2.fillText('vel', cols.vel, y); g2.fillText('binary', cols.bin, y);
                y += lineH;
                const rowsL = eventList(shown, shown.part);
                const barShown = beatNow != null ? Math.floor(beatNow / 4) + 1 : (s.selected != null ? barOf(notes.find((n) => n.id === s.selected)?.at ?? 0) : 1);
                const metas = rowsL.filter((r) => r.kind === 'meta' && r.t === 0);
                for (const r of metas) {
                    g2.fillStyle = col.inkFaint; g2.fillText('1 1 1 0', cols.pos, y);
                    g2.fillStyle = col.inkSoft; g2.fillText(r.name, cols.status, y);
                    g2.fillStyle = col.inkFaint; g2.fillText(r.value, cols.vel, y);
                    y += lineH;
                }
                const inBar = rowsL.filter((r) => r.kind !== 'meta' && barOf(r.t) === barShown);
                const room = Math.floor((Ls.bottom - 8 - y) / lineH);
                const shownRows = inBar.slice(0, room);
                for (const r of shownRows) {
                    const isSel = r.kind === 'on' && !isHeld && r.id === s.selected;
                    const isNow = beatNow != null && r.t <= beatNow && r.t > beatNow - 0.3;
                    if (isSel) { g2.fillStyle = col.goldBright; g2.globalAlpha = 0.14; g2.fillRect(Ls.x0 + 3, y - 11, Ls.x1 - Ls.x0 - 6, lineH); g2.globalAlpha = 1; }
                    g2.fillStyle = isSel ? col.goldBright : isNow ? col.white : col.ink;
                    g2.fillText(fmtPos(r.t), cols.pos, y);
                    if (r.kind === 'on') {
                        g2.fillText('Note On', cols.status, y);
                        g2.fillText(`${noteName(r.note)} ${r.note}`, cols.note, y);
                        g2.fillText(String(r.vel), cols.vel, y);
                        g2.fillText(toBinary(r.vel), cols.bin, y);
                    } else {
                        g2.fillStyle = col.teal; g2.fillText('Pitch bend', cols.status, y);
                        g2.fillText(String(r.value), cols.note, y);
                        g2.fillStyle = col.inkFaint; g2.fillText(String(bendUnsigned(r.value)), cols.vel, y);
                    }
                    y += lineH;
                }
                if (inBar.length > shownRows.length) { g2.fillStyle = col.inkFaint; g2.fillText(`… ${inBar.length - shownRows.length} more in bar ${barShown}`, cols.pos, y); }
                else if (!inBar.length) { g2.fillStyle = col.inkFaint; g2.fillText(`bar ${barShown}: no events`, cols.pos, y); }
                g2.fillStyle = col.inkFaint; g2.textAlign = 'right'; g2.fillText(`bar ${barShown} · ${otherMessages(shown).length} other messages`, Ls.x1 - 8, Ls.top + 13);
            }

            // ---- Extension: the wire ----
            if (g.wire) {
                const W = g.wire;
                g2.strokeStyle = col.line; g2.strokeRect(W.x0 + 0.5, W.top + 0.5, W.x1 - W.x0 - 1, W.bottom - W.top - 1);
                g2.font = monoSmall; g2.textAlign = 'left';
                g2.fillStyle = col.purple; g2.fillText('THE WIRE', W.x0 + 8, W.top + 13);
                const drawBytes = (bytes, x, y, label) => {
                    let cx = x;
                    g2.font = mono;
                    bytes.forEach((b, i) => {
                        const bits = bits8(b);
                        g2.fillStyle = i === 0 ? col.goldBright : col.teal;
                        g2.fillText(bits[0], cx, y);
                        const fw = g2.measureText(bits[0]).width;
                        g2.fillStyle = col.ink;
                        g2.fillText(bits.slice(1), cx + fw, y);
                        const bw = g2.measureText(bits).width;
                        g2.fillStyle = col.inkFaint; g2.font = monoTiny;
                        const sub = ` ${hex2(b)}·${b}`;
                        g2.fillText(sub, cx + bw, y);
                        const sw = g2.measureText(sub).width;
                        g2.font = mono;
                        cx += bw + sw + 16;
                    });
                    g2.fillStyle = col.inkSoft; g2.font = monoSmall;
                    g2.fillText(label, cx + 4, y);
                    return cx;
                };
                const selN = !isHeld && s.selected != null ? notes.find((n) => n.id === s.selected) : null;
                const y1 = W.top + 31;
                if (selN) {
                    const bytes = noteOnBytes(PARTS[shown.part].channel, selN.note, selN.vel);
                    drawBytes(bytes, W.x0 + 76, y1, `Note On · ch ${PARTS[shown.part].channel} · ${noteName(selN.note)} · velocity ${selN.vel}  (status 1, data 0)`);
                    g2.fillStyle = col.inkFaint; g2.font = monoSmall; g2.fillText('selected', W.x0 + 8, y1);
                } else {
                    g2.fillStyle = col.inkFaint; g2.font = monoSmall; g2.fillText('select a note to see its bytes', W.x0 + 76, y1);
                }
                const y2 = W.top + 49;
                const lastMsg = gr && playingRef.current ? gr.wire.filter((m) => m.time <= (ctxRef.current?.currentTime || 0)).pop() : null;
                if (lastMsg) {
                    drawBytes(lastMsg.bytes, W.x0 + 76, y2, lastMsg.label);
                    g2.fillStyle = col.inkFaint; g2.font = monoSmall; g2.fillText('sent', W.x0 + 8, y2);
                } else if (bendLane) {
                    const lo = bendBytes(PARTS.bass.channel, BEND_MIN);
                    drawBytes(lo, W.x0 + 76, y2, `Pitch bend · ${BEND_MIN} from the centre, ${bendUnsigned(BEND_MIN)} from the bottom · 14 bits`);
                    g2.fillStyle = col.inkFaint; g2.font = monoSmall; g2.fillText('the bend', W.x0 + 8, y2);
                } else {
                    g2.fillStyle = col.inkFaint; g2.font = monoSmall; g2.fillText('press Play and the last message sent shows here', W.x0 + 76, y2);
                }
            }

            // ---- the playhead ----
            if (frac != null) {
                const x = Math.round(xOf(beatNow)) + 0.5;
                g2.strokeStyle = col.white; g2.globalAlpha = 0.8; g2.beginPath(); g2.moveTo(x, R.top - 4); g2.lineTo(x, L.bottom + 4); g2.stroke(); g2.globalAlpha = 1;
                if (bendLane) {
                    const yB = L.bottom - pad - ((bendAt(shown.bends, beatNow) - BEND_MIN) / (BEND_MAX - BEND_MIN)) * (L.bottom - L.top - pad * 2);
                    g2.beginPath(); g2.arc(x, yB, 4.5, 0, Math.PI * 2); g2.fillStyle = col.white; g2.fill();
                }
            }
            if (readRef.current) {
                // at rest the transport reads the loop's start, as a DAW's does
                const bAt = beatNow == null ? 0 : beatNow;
                const txt = ` · ${fmtPos(bAt)}${bendLane ? ` · bend ${Math.round(bendAt(shown.bends, bAt))}` : ''}`;
                if (readRef.current.textContent !== txt) readRef.current.textContent = txt;
            }

            // ---- the setting line, for the depth ----
            const segs = [`${BARS} bars`, `${PARTS[shown.part].short.toLowerCase()} · ${shown.part === 'drums' ? KITS[shown.kit].label.toLowerCase() : 'square wave'}`, `quantise ${shown.grid === 'off' ? 'off' : `${GRIDS[shown.grid].label} at ${shown.strength}%`}`];
            segs.push(isHeld ? 'the example' : s.presetId ? PRESETS.find((p) => p.id === s.presetId)?.name.toLowerCase() : 'your file');
            if (d !== 'core' && vdd.ok != null) segs.push(vdd.ok ? 'as directed' : 'not as directed');
            if (d === 'extension') segs.push(`channel ${PARTS[shown.part].channel}`);
            g2.fillStyle = col.goldBright; g2.font = mono; g2.textAlign = 'left';
            if (frameRef.current % 20 === 0 && legendRef.current) legendWRef.current = legendRef.current.getBoundingClientRect().width;
            frameRef.current += 1;
            const roomW = w - 18 - legendWRef.current - 16 - (R.x0 + 6);
            let label = segs.join(' · ');
            while (segs.length > 2 && g2.measureText(label).width > roomW) { segs.pop(); label = segs.join(' · '); }
            g2.fillText(label, R.x0, g.settingY);

            geomRef.current = { g, handles, laneHandles, xOf, tOf, rowAt, laneV, rowH, yRow };
            // what this frame drew, told to the DOM for check-bench (laws 18 and 22)
            const hnd = !isHeld && s.selected != null ? handles.find((h) => h.id === s.selected) : null;
            const handleTag = hnd ? `${Math.round(hnd.cx)}:${Math.round(hnd.cy)}` : '';
            if (canvas.dataset.handle !== handleTag) canvas.dataset.handle = handleTag;
            const noteTag = hnd ? String(hnd.note) : '';
            if (canvas.dataset.note !== noteTag) canvas.dataset.note = noteTag;
            const velTag = hnd ? String(hnd.vel) : '';
            if (canvas.dataset.vel !== velTag) canvas.dataset.vel = velTag;
            const rollTag = `${notes.length}:${notes.map((n) => `${n.id}/${n.note}/${Math.round(n.at * 64)}/${n.vel}`).join(',')}`;
            if (canvas.dataset.roll !== rollTag) canvas.dataset.roll = rollTag;
            const stageTag = stageOf(d);
            if (canvas.dataset.stage !== stageTag) canvas.dataset.stage = stageTag;
            if (canvas.dataset.verdict !== vdd.key) canvas.dataset.verdict = vdd.key;

            raf = requestAnimationFrame(draw);
        }
        raf = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(raf);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // A note block is selected and dragged; an empty cell takes a new note;
    // a velocity bar is dragged in the lane.
    const hitNote = (px, py) => {
        const gm = geomRef.current;
        if (!gm) return null;
        for (const h of gm.handles) if (px >= h.x0 - 2 && px <= h.x1 + 2 && py >= h.y && py <= h.y + h.h) return h;
        return null;
    };
    const hitLane = (px, py) => {
        const gm = geomRef.current;
        if (!gm) return null;
        const L = gm.g.lane;
        if (py < L.top || py > L.bottom || px < L.x0 || px > L.x1) return null;
        let best = null;
        for (const h of gm.laneHandles) { const dist = Math.abs(h.x - px); if (dist <= 7 && (!best || dist < best.dist)) best = { ...h, dist }; }
        return best;
    };
    const inRoll = (px, py) => {
        const gm = geomRef.current;
        if (!gm) return false;
        const R = gm.g.roll;
        return px >= R.x0 && px <= R.x1 && py >= R.top && py <= R.bottom;
    };
    const onStageDown = (e) => {
        if (heldRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const px = e.clientX - rect.left; const py = e.clientY - rect.top;
        const gm = geomRef.current;
        const hit = hitNote(px, py);
        if (hit) {
            e.currentTarget.dataset.drag = `note:${hit.id}`;
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            dragRef.current = { kind: 'note', id: hit.id, dx: px - hit.x0, moved: false };
            setState((s) => select(s, hit.id));
            touch('select');
            return;
        }
        const lane = hitLane(px, py);
        if (lane && stateRef.current.lane !== 'bend') {
            e.currentTarget.dataset.drag = `vel:${lane.id}`;
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            dragRef.current = { kind: 'vel', id: lane.id };
            setState((s) => setVelocity(select(s, lane.id), lane.id, Math.round(gm.laneV(py) * 127)));
            touch('vel');
            return;
        }
        if (gm && inRoll(px, py)) {
            e.currentTarget.dataset.drag = 'add';
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            let id = null;
            setState((s) => { const r = addNote(s, gm.tOf(px), gm.rowAt(py)); id = r.id; return r.state; });
            dragRef.current = { kind: 'note', id, dx: 0, moved: false };
            touch('note');
            return;
        }
        e.currentTarget.dataset.drag = '';
    };
    const onStageMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const px = e.clientX - rect.left; const py = e.clientY - rect.top;
        const gm = geomRef.current;
        const dg = dragRef.current;
        if (dg && gm) {
            if (dg.kind === 'note' && dg.id != null) {
                setState((s) => moveNote(s, dg.id, gm.tOf(px - dg.dx), gm.rowAt(py)));
                if (!dg.moved) { dg.moved = true; touch('note'); }
            } else if (dg.kind === 'vel') {
                setState((s) => setVelocity(s, dg.id, Math.round(gm.laneV(py) * 127)));
            }
            return;
        }
        if (!teach) { if (hover) setHover(null); return; }
        const hit = hitNote(px, py);
        if (hit) {
            if (hover && hover.kind === 'note' && hover.id === hit.id) return;
            setHover({ kind: 'note', id: hit.id, note: hit.note, at: hit.at, t: hit.t, vel: hit.vel, x: px, y: py, stageW: rect.width, stageH: rect.height });
            return;
        }
        if (gm && inRoll(px, py)) {
            const t = snapTo(gm.tOf(px), 0.25);
            const row = gm.rowAt(py);
            if (hover && hover.kind === 'cell' && hover.t === t && hover.row === row) return;
            setHover({ kind: 'cell', t, row, x: px, y: py, stageW: rect.width, stageH: rect.height });
            return;
        }
        if (hover) setHover(null);
    };
    const onStageUp = (e) => {
        if (!dragRef.current) return;
        dragRef.current = null;
        try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* gone */ }
    };
    const onStageDouble = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const hit = hitNote(e.clientX - rect.left, e.clientY - rect.top);
        if (!hit) return;
        setState((s) => removeNote(s, hit.id));
        setHover(null);
        touch('note');
    };

    // ---- drawer content ----
    const topicHref = (slug) => memberTopicHref(null, slug, studioOrigin);
    const drawerTabs = useMemo(() => [
        {
            id: 'reference',
            label: 'Reference',
            render: () => (
                <>
                    <h2>MIDI, in the spec&apos;s words</h2>
                    <p>MIDI is data, not sound: messages that say which note, how hard, when, on which channel, and what else changed. A sequencer stores them on a piano roll (pitch up the side, time along the bottom) and lists them in a list editor. The spec names real-time input from a keyboard and non-real-time input on the grid, quantise (hard values, swing and percentage), editing (velocity, length, the piano roll, the list editor) and the data itself: note on and off, pitch, controllers, pitch bend, LSB and MSB, tempo. The practical paper opens every year with a MIDI file on the bench.</p>
                    <h3>Terms</h3>
                    <dl>
                        <dt>Note On · Note Off</dt><dd>The message that starts a note and the one that ends it. Three bytes each: a status byte (which message, which channel) and two data bytes (the note number, the velocity).</dd>
                        <dt>Velocity</dt><dd>How hard the key was struck, 1 to 127. A drum sampler and a synth read it as level, and often as brightness too (velocity-sensitive filtering). Why it varies: expression, accents, ghost hits, a human feel (2024).</dd>
                        <dt>Status byte · data byte</dt><dd>A byte is 8 bits, but its first bit is the flag: 1 for a status byte, 0 for data. That leaves 7 bits for the value, 2<sup>7</sup> = 128 values, 0 to 127. The 2021 and 2026 question.</dd>
                        <dt>Pitch bend</dt><dd>A message with two data bytes, the LSB and the MSB, 7 bits each: 14 bits, 16,384 values. Shown as −8192 to 8191 by a DAW that counts from the centre, or 0 to 16383 by one that counts from the bottom; the centre is 0 or 8192. The range is set on the synth in semitones, so the same data can be a tone or an octave.</dd>
                        <dt>Controller (CC)</dt><dd>A numbered message for anything else: modulation is CC1, the sustain pedal CC64, volume CC7, pan CC10. The 2019 scheme&apos;s list of other messages: modulation, damper, pitch bend, tempo, time signature, key, text, track name, instrument name, end position.</dd>
                        <dt>Quantise</dt><dd>Moving notes onto a grid. The value is the grid (1/8, 1/16, 1/12 for triplets, 1/32); the strength is how far they move. The most appropriate value for a part is its smallest note value; anything coarser changes the rhythm.</dd>
                        <dt>Bar · beat · division · tick</dt><dd>A position in a DAW. 960 ticks to a quarter note on this bench, a division a sixteenth, so 4 2 1 161 is bar 4, beat 2, the first sixteenth, 161 ticks in.</dd>
                        <dt>Drum map</dt><dd>Which note plays which sound. On a General MIDI kit the kick is C1 (36), the snare D1 (38), the closed hat F#1 (42). A file whose notes were &quot;assigned to the incorrect sounds&quot; is fixed on the kit, not on the roll.</dd>
                    </dl>
                    <h3>In your DAW</h3>
                    <table>
                        <thead><tr><th>On this bench</th><th>Ableton Live</th><th>Logic Pro</th></tr></thead>
                        <tbody>
                            <tr><td>The piano roll</td><td>Double-click a MIDI clip: the note editor</td><td>Double-click a region: the Piano Roll editor</td></tr>
                            <tr><td>The velocity lane</td><td>The envelope lane under the notes, Velocity chosen</td><td>MIDI Draw, or the velocity tool in the Piano Roll</td></tr>
                            <tr><td>The list editor</td><td>No list; the note&apos;s row shows its values, and a pitch bend is an envelope</td><td>Window › Event List: position, status, channel, num, val</td></tr>
                            <tr><td>Quantise</td><td>Quantize settings (Ctrl/Cmd-Shift-U): grid, amount</td><td>Time Quantize in the Piano Roll inspector: value, strength, swing</td></tr>
                            <tr><td>Pitch bend display</td><td>−8192 to 8191, centre 0</td><td>0 to 16383, centre 8192</td></tr>
                            <tr><td>The drum map</td><td>Drum Rack: drag a sound to the pad the note plays</td><td>Drum Kit Designer, or Drum Machine Designer: pick the sound on the pad</td></tr>
                        </tbody>
                    </table>
                    <p className={styles.source}>As the controls appear in Live 12 and Logic Pro 11. Check against your own version if they move.</p>
                    <h3>Beyond the paper<span className={styles.ext}>EXT</span></h3>
                    <dl>
                        <dt>Why a bend needs two bytes</dt><dd>Seven bits give 128 steps, which is coarse for a pitch that sweeps. Two data bytes give 16,384 steps across the range, and the ear hears the sweep as continuous.</dd>
                        <dt>Running status</dt><dd>On a real cable the status byte can be sent once and the data bytes follow for every note on that channel until the status changes; the DAW shows every message whole.</dd>
                        <dt>Quantise against warp</dt><dd>Quantise moves MIDI notes; warping moves audio. The 2020 paper asks both in one question: fix the MIDI drums with a value, fix the audio drums with an edit.</dd>
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
                    <p>Press Play and the drum file plays on an acoustic kit, accents on the beat and ghost notes between. Press <b>Wrong sounds</b> and the same notes come out of the wrong drums: the rhythm is right, the kit is not. Every preset is one of the papers&apos; opening questions on the same four bars, and the moves the reports mark down are the ones the bench lets you make: quantise the roll to 1/16, leave the bend range at 2.</p>
                    <h3>What the schemes say</h3>
                    <p>2019, the drum map: &quot;1 mark for each correctly assigned drum sound that plays the correct rhythm, in sync throughout. To award both the crash and the ride, they must be distinct and the crash more crash-like than the ride. Max 4 if the drum kit is not acoustic.&quot;</p>
                    <p>2022, the quantise value: &quot;A 1/64. B, C, D are incorrect because the smallest note value is 1/64 in the hi-hats.&quot; 2023: &quot;C 1/16. A, B, D are incorrect because the smallest note value is 1/16.&quot;</p>
                    <p>2022, the bend: &quot;3 MIDI pitch bend matches; 2 changes vox pitch with a wide pitch range; 1 changes vox pitch in some small way, i.e. 2 semitones; 0 no MIDI pitch bend.&quot; 2023: &quot;Pitch bend range is 12 semitones (1).&quot;</p>
                    <p>2026, why 127: &quot;Byte is 8 bits but first bit is used / always 0 (1); (to indicate) data byte (1); velocity is 7 bits (1); 2<sup>7</sup> (1); 128 different values (including 0) (1).&quot; 2023, the bend&apos;s range: &quot;Two (data) bytes (instead of one) (1); 14 bits (1).&quot;</p>
                    <p>2025, quantise as feel: unquantised, groove, swing, percent, humanise against hard quantise; &quot;loose / live / human / realistic feel&quot; against &quot;mechanical / tight(er) / in time&quot;.</p>
                    <p className={styles.source}>Source: Edexcel 9MT0/04 and 9MT0/41 mark schemes, 2019 Q2(a)-(c), 2021 Q2(a)-(c), 2022 Q1(b)-(c) and Q4, 2023 Q1(a) and Q2(b)-(d), 2024 Q1(a)-(c), 2025 Q2(a)-(b) and Q3(d), 2026 Q2(b)-(c).</p>
                    <h3>Do these now</h3>
                    <ul>
                        <li>Press <b>Velocity table</b>, switch to A-level, and read the two gold numbers in the lane. Write the binary yourself before you read it.</li>
                        <li>Press <b>Wrong sounds</b> and fix the kit with the Sound chips only. Then say why moving the notes would have lost the marks.</li>
                        <li>Press <b>Hi-hat roll</b>, set Quantise to 1/16 at 100, and listen to bars 2 and 4. Say the quantise value the paper wants and why.</li>
                        <li>Press <b>Played</b>, turn Strength from 0 to 100 and back to 50. Give one feel word for each of the three.</li>
                        <li>Press <b>Bend range</b>, hold the example, then set 12. Say what changed in the data (nothing) and in the sound.</li>
                        <li>Switch to Extension, select the kick, and read its three bytes aloud: which is the status byte, and what its first bit means.</li>
                    </ul>
                    <h3>Exam practice</h3>
                    <ExamCallout
                        prompt="Note velocity uses 7 bits to store a range of values from 0–127. Explain why note velocities cannot exceed 127 in the MIDI protocol. (2 marks, 2021)"
                        answer="A byte is 8 bits, but the first bit of every MIDI byte is a flag: 1 for a status byte, 0 for a data byte. A velocity is a data byte, so 7 bits are left for the value, and 7 bits give 2 to the power 7 = 128 values, 0 to 127."
                    />
                    <ExamCallout
                        prompt="MIDI controllers usually have a range of 0–127. Pitch bend values have a range between −8192 and 8191. State how pitch bend's greater range of values is achieved within the MIDI specification. (1 mark, 2023)"
                        answer="Two data bytes instead of one: 7 bits each, 14 bits together, 16,384 values. The scheme accepts 'two (data) bytes' or '14 bits', and rejects '8 bits'."
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
                        <b>The synth the bass plays</b>
                        <span>A square wave, an amplitude envelope, a filter the velocity opens: the papers&apos; synth task is the other half of every MIDI question, and it is that topic.</span>
                    </a>
                    <a className={topicHref ? styles.conn : styles.conn} href={topicHref('numeracy')}>
                        <i>2.5 Numeracy</i>
                        <b>Binary, done by hand</b>
                        <span>The velocity table is a conversion. 64, 32, 16, 8, 4, 2, 1: which of those add up to the number, and a 1 under each that does.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('audio-editing')}>
                        <i>1.6 Audio editing</i>
                        <b>Quantise is for MIDI; warp is for audio</b>
                        <span>The same paper sets both: a value for the MIDI drums, an edit for the audio drums. The Edit bench is the other one.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('automation')}>
                        <i>1.8 Automation</i>
                        <b>The bend is a lane</b>
                        <span>A pitch bend drawn under the notes is automation of one parameter of the synth. The Automation Lane is the same picture on a fader, a pan pot and a filter.</span>
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
    const partOptions = PART_IDS.map((id) => ({ id, label: PARTS[id].short, title: id === 'drums' ? 'The drum file: the paper\'s Question 2' : 'The bass file on the square-wave synth: the paper\'s Question 1' }));
    const kitOptions = KIT_IDS.map((id) => ({ id, label: KITS[id].label, title: `${KITS[id].paper}: the same notes on ${KITS[id].said}`, disabled: state.part !== 'drums' }));
    const gridOptions = GRID_IDS.map((id) => ({ id, label: GRIDS[id].label, title: GRIDS[id].short }));
    const soundOptions = SOUND_IDS.map((id) => ({ id, label: SOUNDS[id].short, title: `${SOUNDS[id].label}: the sound this row plays` }));
    const rangeOptions = RANGE_IDS.map((id) => ({ id, label: RANGES[id].label, title: `${RANGES[id].word}: full bend is ${RANGES[id].said}` }));
    const laneOptions = [{ id: 'velocity', label: 'Velocity', title: 'The velocity lane under the roll' }, { id: 'bend', label: 'Bend', title: 'The pitch bend lane under the roll: the data the file holds' }];
    const selRow = sel ? (state.part === 'drums' ? state.map[sel.note] : null) : null;
    const verdictWord = vd.key === 'free' ? 'no stem' : vd.ok == null ? (vd.key === 'table' ? 'the table' : rd.feel.word) : vd.ok ? 'as directed' : 'not yet';
    const feelStat = state.part === 'drums' ? rd.feel.word : (rd.smallest ? `${GRIDS[rd.smallest].label} smallest` : 'unquantised');

    const consoleSlot = (
        <>
            <PlayColumn
                playing={playing}
                onTogglePlay={togglePlay}
                onHoldDry={holdExample}
                level={state.level}
                onLevel={(v2) => setState((s) => setLevel(s, v2))}
                teach={teach}
                holdLabel="hold: the example"
                holdTitle="Hold to hear the paper's example: the file as it should sound"
                holdWhy="plays the file the way the paper's example does (the right sounds, the right range, every note) while you hold it"
                playWhy="runs the four bars round, one part at a time, as the paper bounces it"
            />

            <div className={`${styles.sec} ${styles.secKit}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>Part</span><span className={styles.value}>{PARTS[state.part].short}</span></div>
                <Chips label="Part" options={partOptions} value={state.part} onChange={choosePart} />
                <Chips label="Kit" options={kitOptions} value={state.part === 'drums' ? state.kit : null} onChange={chooseKit} />
                <div className={styles.meaning}>{state.part === 'drums' ? `${KITS[state.kit].said}, channel 10` : 'square wave, channel 1'}</div>
                <Why>The papers hand over two MIDI files: the drums (&quot;drums.mid&quot;, assigned to a kit) and a bass or synth part. One plays at a time, as the paper bounces them. The kit is the stem&apos;s word: &quot;using an acoustic drum kit&quot; loses marks on a drum machine.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secQuant}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>Quantise</span><span className={styles.value}>{state.grid === 'off' ? 'Off' : `${GRIDS[state.grid].label} · ${state.strength}%`}</span></div>
                <div className={styles.quantRow}>
                    <Chips label="Quantise" options={gridOptions} value={state.grid} onChange={chooseGrid} />
                    <div className={styles.knob}>
                        <Dial label="Strength" value={state.strength} min={0} max={100} step={5} unit="%" size="small" pixels={120} pointer="var(--teal)" disabled={state.grid === 'off'} onChange={chooseStrength} title={state.grid === 'off' ? 'Choose a grid first' : 'How far each note moves to its step: 100 is hard, 50 is percentage quantise'} />
                        <span className={styles.readout}>strength</span>
                    </div>
                </div>
                <div className={styles.meaning}>{state.grid === 'off' ? 'notes where they were played' : `${GRIDS[state.grid].short}, moved ${state.strength}% of the way`}</div>
                <Why>The grid and how hard the notes are pulled to it. The paper&apos;s value is the smallest note value in the part; 1/12 is the triplet grid. Strength under 100 is percentage quantise, which the 2025 scheme names as a feel. Notes that move draw a dashed ghost where they were.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secNote}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>Note</span><span className={styles.value} data-note-number={sel ? sel.note : undefined}>{sel ? noteName(sel.note) : 'none'}</span></div>
                <div className={styles.knob}>
                    <Dial label="Velocity" value={sel ? sel.vel : 1} min={1} max={127} step={1} pixels={200} pointer={PARTS[state.part].colour} disabled={!sel} onChange={(v2) => { if (sel) { setState((s) => setVelocity(s, sel.id, v2)); touch('vel'); } }} title={sel ? 'The selected note\'s velocity, 1 to 127' : 'Select a note on the roll'} />
                    <span className={styles.readout}>{sel ? (maths ? `${sel.vel} · ${toBinary(sel.vel)}` : `velocity ${sel.vel}`) : 'select a note'}</span>
                </div>
                <div className={styles.meaning}>{sel ? `${selRow ? `${SOUNDS[selRow].label.toLowerCase()} · ` : ''}${fmtPos(sel.at)}` : 'click a note on the roll'}</div>
                <Why>The selected note: its name and number, its velocity in decimal (and in binary from A-level), its position in bar, beat, division and tick. Drag it on the roll to move it in time or onto another row; the dial and the lane both set the velocity.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secSound}`} data-teach={teach || undefined}>
                {state.part === 'drums' ? (
                    <>
                        <div className={styles.secHead}><span className={styles.eyebrow}>Sound</span><span className={styles.value}>{selRow ? SOUNDS[selRow].short : 'none'}</span></div>
                        <Chips label="Sound" options={soundOptions} value={selRow} onChange={chooseSound} disabled={!sel} />
                        <div className={styles.meaning}>{sel ? `on row ${noteName(sel.note)} (${sel.note})` : 'select a row'}</div>
                        <Why>The sound the selected note&apos;s row plays: the drum map. The papers&apos; fix for &quot;assigned to the incorrect sounds&quot; is here, on the kit, never on the roll: &quot;you should not change the rhythm&quot;.</Why>
                    </>
                ) : (
                    <>
                        <div className={styles.secHead}><span className={styles.eyebrow}>Bend</span><span className={styles.value}>{RANGES[state.bendRange].word}</span></div>
                        <Chips label="Bend range" options={rangeOptions} value={state.bendRange} onChange={chooseRange} />
                        <Chips label="Lane" options={laneOptions} value={state.lane} onChange={chooseLane} />
                        <div className={styles.meaning}>full bend is {RANGES[state.bendRange].said}</div>
                        <Why>The synth&apos;s pitch bend range in semitones. The file&apos;s bend data never change; what a full bend does to the pitch is this setting, which is why the papers say &quot;match the pitch bend range with the example&quot;. Lane shows the data under the roll.</Why>
                    </>
                )}
            </div>

            <div className={`${styles.sec} ${styles.secHear}`} data-teach={teach || undefined} data-roll="true">
                <div className={styles.secHead}><span className={styles.eyebrow}>What you should hear</span></div>
                <div className={styles.stats} aria-live="polite">
                    <div><b>{feelStat}</b><span>{state.part === 'drums' ? 'the timing' : 'note value'}</span></div>
                    <div><b>{rd.count} notes</b><span>{sel ? `selected ${fmtPos(sel.at)}` : 'on the roll'}</span></div>
                    {rd.table ? <div><b>{rd.table.hi.vel} · {rd.table.lo.vel}</b><span>bar 2 loudest · quietest</span></div> : <div><b>bar 2 empty</b><span>nothing to table</span></div>}
                    {maths
                        ? <div><b>{verdictWord}</b><span>the paper&apos;s check{ext ? <span className={styles.ext}>EXT</span> : null}</span></div>
                        : <div><b>{held ? 'the example' : rd.faults.length ? `${rd.faults.length} wrong` : 'your file'}</b><span>{rd.faults.length && !held ? 'sounds on the kit' : 'what is playing'}</span></div>}
                </div>
                {teach ? <div className={styles.meaning}>all from the notes, the map, the grid and the range</div> : null}
                <Legal />
                <Why>Every word here comes from the file: how the timing sits against the grid, how many notes and which is selected, the loudest and quietest velocity in bar 2 (the table every paper asks for), and whether the file passes the check the preset set.</Why>
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
            <span className={styles.eyebrow}>Roll</span>
            <Chips label="Roll" options={ROLL_TOOLS} value={null} onChange={rollTool} />
            <span className={styles.chipNote}>{task ? 'back to the file the preset loaded, or an empty bar 2 to draw into' : 'the file as it came, or an empty bar 2'}</span>
        </div>
    ) : null;

    const stage = (
        <>
            <canvas
                ref={canvasRef}
                aria-label={maths ? (ext ? 'The piano roll, its lower lane, and the bytes on the wire' : 'The piano roll, its lower lane, and the list editor beside them') : 'The piano roll and its velocity lane, as a DAW draws them'}
                role="img"
                onPointerDown={onStageDown}
                onPointerMove={onStageMove}
                onPointerUp={onStageUp}
                onPointerCancel={onStageUp}
                onDoubleClick={onStageDouble}
                onPointerLeave={() => { if (!dragRef.current) setHover(null); }}
            />
            <div className={styles.stageNote}>
                <b>{state.part === 'drums' ? 'drums.mid' : 'bass.mid'} · {BPM} bpm<span ref={readRef} style={{ '--read': state.part === 'bass' && state.lane === 'bend' ? '25ch' : '12ch' }} /></b>
                <span>{ORIENTS[depth] || ORIENTS.core}</span>
            </div>
            <div ref={legendRef} className={`${styles.stageLegend} ${styles.legendTop}`} aria-hidden="true">
                <span><i style={{ background: PARTS[state.part].colour }} />note</span>
                <span><i style={{ background: 'transparent', border: '1px dashed rgba(255,255,255,0.5)', borderRadius: 0 }} />played</span>
                {state.part === 'bass' && state.lane === 'bend' ? <span><i style={{ background: 'var(--teal)' }} />bend</span> : null}
                {depth === 'alevel' ? <span><i style={{ background: 'var(--gen-6)' }} />fault</span> : null}
                {depth === 'extension' ? <span><i style={{ background: 'var(--gold-bright)' }} />status bit</span> : null}
            </div>
            {hover && teach ? (
                <div
                    className={styles.tip}
                    style={{
                        left: Math.max(12, Math.min(hover.stageW - 290, hover.x - 135)),
                        top: Math.max(44, Math.min(hover.stageH - 110, hover.y + 22)),
                    }}
                >
                    {hover.kind === 'note'
                        ? <><i>{noteName(hover.note)} · {fmtPos(hover.at)} · velocity {hover.vel}</i><p>{cap(velWord(hover.vel))}{state.part === 'drums' ? `, ${SOUNDS[state.map[hover.note]]?.said || 'no sound'}` : ''}{Math.abs(hover.at - hover.t) > TOL ? `, played at ${fmtPos(hover.t)}` : ''}. Drag it; double-click to remove it.</p></>
                        : <><i>{fmtBeat(hover.t)} · {state.part === 'drums' ? SOUNDS[state.map[hover.row]]?.label || noteName(hover.row) : noteName(hover.row)}</i><p>Click to add a note here.</p></>}
                </div>
            ) : null}
            {!began ? (
                <div className={styles.begin}>
                    <button type="button" className={styles.beginBtn} onClick={() => audio.start()}>
                        <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1.2v9.6L11 6z" fill="currentColor" /></svg>
                        <span>
                            Play the bench
                            <small>The MIDI file the paper hands you, on the roll. Headphones help.</small>
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

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
