'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BenchFrame from '@/components/bench/BenchFrame';
import { Fader, Chips, Why, MoreButton } from '@/components/bench/controls';
import { PlayColumn, Legal, ExamCallout, useBenchMode, useBenchDepth, DEPTHS } from '@/components/bench/BenchBits';
import { useBenchAudio, glide } from '@/components/bench/useBenchAudio';
import styles from '@/components/bench/bench.module.css';
import { memberTopicHref, useStudioArrival } from '@/lib/studio-return';
import { DEPTH_LINES, DEPTH_TEACH, judge, open as openMachine, hearingLine, nextMove, sectionOfLast, noteLine } from '@/lib/bench/synth-depth';
import {
    BPM, OCTAVE_IDS, DETUNE_MIN, DETUNE_MAX, OSC2_IDS, OSC2, FILTER_IDS, FILTERS, CUTOFF_MIN, CUTOFF_MAX, RES_MIN, RES_MAX, ENV_AMT_MIN, ENV_AMT_MAX,
    ATTACK_MIN, ATTACK_MAX, DECAY_MIN, DECAY_MAX, SUSTAIN_MIN, SUSTAIN_MAX, RELEASE_MIN, RELEASE_MAX,
    LFO_TARGET_IDS, LFO_TARGETS, LFO_RATE_MIN, LFO_RATE_MAX, LFO_DEPTH_MIN, LFO_DEPTH_MAX, LFO_SHAPE_IDS, LFO_SHAPES, VOICES_IDS, VOICES, GLIDE_IDS, GLIDES,
    PART_IDS, PARTS, KEYBOARD_KEYS, PRESETS, DEFAULT_STATE, SECTION_IDS, SECTIONS, GRADE_WORD, ARP_IDS, ARPS,
    SOURCE_IDS, SOURCES, SOURCE_GAIN, SHAPE_IDS, SHAPES, setShape, waveGain, presetsFor, LEVEL_MIN, LEVEL_MAX, WIDTH_MIN, WIDTH_MAX, PWM_IDS, PWMS, SUB_OCT_IDS, SUB_OCTS, VCA_IDS, VCAS,
    applyPreset, setPart, setPulse, setSaw, setSub, setNoise, setWidth, setPwm, setSubOct, setVca, setOctave, setDetune, setOsc2, setFilter, setCutoff, setRes, setEnvAmt, setAttack, setDecay, setSustain, setRelease,
    setLfoTarget, setLfoRate, setLfoDepth, setLfoShape, setVoices, setGlide, setArp, setVolume, dragDot, rawOf, osc2Ratio, arpeggiate,
    midiHz, noteName, fmtHz, fmtMs, fmtRate, posToLog, logToPos, resDb, nodeQ, envOctaves, lfoSwing, lfoOn, adsrAt, octaveSaid, lfoValue, widthAt, pwmOn, isSquare, sourcesShort, harmonicsSaid, noiseLevel,
    spectrum, waveShape, timeline, filterCurve, logFreqs, posOfHz, hzOfPos, readings, verdict, judgeAll,
} from '@/lib/bench/synth-model';

// The Synth bench (1.3), ninth bench to the Bench Standard and the 2D
// treatment of Inside the Synthesiser (the 31 Aug 2026 estate verdict: a
// panel of controls fails the internal / spatial rule). The console is
// the paper's panel, LFO · VCO · SOURCE MIXER · VCF · VCA · ENV, re-cut to
// sliders on 2 Sep 2026 on Mike's steer (his picture of a 1982-style
// monophonic synthesiser, the kind in the 2024 Q6 figure): a VCO whose
// pulse width the LFO can move, a source mixer with a sub-oscillator and
// white noise, a VCA switched between the envelope and the gate, each
// slider a drag target. Three jobs (lib/bench/synth-depth.js): Core shows
// the wave and its harmonics with the filter drawn over them, A-level
// judges the patch as sections the way Q6 does, Extension opens the
// machine as control signals in time. The gold dot on the harmonics
// screen is the Cutoff dial (law 25); the keys on the stage play the
// voice, and so do A to K.
//
// The voice is oscillators: the subject of this bench IS the oscillator
// (Bench Standard §3 law 5), so the bench declares synthesis and brings
// no recordings. What the stage draws is what the graph runs: the same
// series, the same biquad, the same four straight lines on the envelope.

const CODE = '1.3 Synthesis';
const TITLE = 'Synth bench';
const FILES = {};
const ORIENTS = {
    core: 'The wave leaving the synth and its harmonics, the filter drawn over them in gold. Drag the dot; play the keys.',
    alevel: 'The synth as sections in signal order, the way the paper draws it, each judged for the part it plays.',
    extension: 'One note in time: the envelope asks, the amplifier and the cutoff obey, the LFO drawn to scale, too slow to hear.',
};
const PART_GAIN = { bass: 1, pad: 0.6, lead: 0.85, keys: 0.62 }; // the sources' own gains are SOURCE_GAIN in the model, measured (scripts/measure-synth.mjs)
const RANGE_WORD = { '-1': "16'", 0: "8'", 1: "4'" }; // the paper's feet: 8' is the part's own octave
const SHAPE_SHORT = { triangle: 'Tri', sine: 'Sine', square: 'Sq' };
const SETTER = { pulse: setPulse, saw: setSaw, sub: setSub, noise: setNoise };
const SOURCE_COLOUR = { pulse: 'var(--gen-3)', saw: 'var(--gen-4)', sub: 'var(--gen-7)', noise: 'var(--gen-7)' };
const KEY_HOLD_MS = 60000;

// ---- the graph ------------------------------------------------------------
// One LFO for the bench, three gains for its three targets; a voice per
// note: VCO (and a second for Pair / Fifth) + sub + noise -> filter -> amp
// -> tremolo -> the part's gain -> master. One saw oscillator serves a VCO's
// saw and its pulse: the pulse is the saw minus itself delayed by the
// width, so both are band-limited and the LFO moves the width by moving
// the delay (PWM). The amplitude envelope is booked on amp.gain (or the
// gate is, when the VCA says so) and the filter envelope on filter.detune
// (cents), so Cutoff stays free to move live on filter.frequency and the
// LFO adds into the same detune param.
function buildSynthGraph(ctx, input, master) {
    const bus = ctx.createGain();
    bus.gain.value = 1;
    bus.connect(master);
    input.connect(master);
    const lfo = ctx.createOscillator();
    lfo.type = 'triangle';
    lfo.frequency.value = 5;
    const lfoPitch = ctx.createGain(); lfoPitch.gain.value = 0;
    const lfoCut = ctx.createGain(); lfoCut.gain.value = 0;
    const lfoAmp = ctx.createGain(); lfoAmp.gain.value = 0;
    lfo.connect(lfoPitch); lfo.connect(lfoCut); lfo.connect(lfoAmp);
    lfo.start();
    const lfoStart = ctx.currentTime;
    // one white-noise buffer for the graph; each voice plays it looped
    const noiseBuf = ctx.createBuffer(1, Math.round(ctx.sampleRate * 2), ctx.sampleRate);
    { const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i += 1) d[i] = Math.random() * 2 - 1; }
    const voices = new Set();
    let lastSeqHz = null;
    let lastOn = -1;
    let cur = null; // the settings the voices were made with

    // the four straight lines, booked on a param from t0, the key held gateSec
    function bookEnvelope(param, t0, gateSec, h, peak, base) {
        const A = h.attack / 1000; const D = h.decay / 1000; const S = h.sustain / 100; const R = h.release / 1000;
        const sus = base + (peak - base) * S;
        param.cancelScheduledValues(t0);
        param.setValueAtTime(base, t0);
        if (gateSec == null) {
            param.linearRampToValueAtTime(peak, t0 + A);
            param.linearRampToValueAtTime(sus, t0 + A + D);
            return;
        }
        const tOff = t0 + gateSec;
        if (gateSec <= A) {
            param.linearRampToValueAtTime(base + (peak - base) * (gateSec / A), tOff);
        } else {
            param.linearRampToValueAtTime(peak, t0 + A);
            if (gateSec <= A + D) param.linearRampToValueAtTime(peak - (peak - sus) * ((gateSec - A) / D), tOff);
            else { param.linearRampToValueAtTime(sus, t0 + A + D); param.setValueAtTime(sus, tOff); }
        }
        param.linearRampToValueAtTime(base, tOff + R);
    }
    function releaseAt(v, when) {
        if (v.released) return;
        v.released = true;
        const h = v.h;
        const elapsedMs = Math.max(0, (when - v.t0) * 1000);
        const e = adsrAt(h, elapsedMs, elapsedMs + 1);
        const R = h.release / 1000;
        const gate = h.vca === 'gate';
        v.amp.gain.cancelScheduledValues(when);
        if (gate) { v.amp.gain.setValueAtTime(1, when); v.amp.gain.linearRampToValueAtTime(0, when + 0.006); }
        else { v.amp.gain.setValueAtTime(e, when); v.amp.gain.linearRampToValueAtTime(0, when + R); }
        v.filter.detune.cancelScheduledValues(when);
        v.filter.detune.setValueAtTime(e * envOctaves(h) * 1200, when);
        v.filter.detune.linearRampToValueAtTime(0, when + R);
        v.stopAll(when + (gate ? 0.02 : R) + 0.05);
        v.off = when;
    }
    function noteOn(midi, when, gateSec, s, { glideFromHz = null, held = false } = {}) {
        const h = s;
        const f0 = midiHz(midi) * 2 ** h.octave;
        const two = h.osc2 !== 'off';
        const pg = PART_GAIN[h.part] * (two ? 0.62 : 1);
        const gl = GLIDES[h.glide].ms / 1000;
        const filter = ctx.createBiquadFilter();
        filter.type = h.bypass ? 'allpass' : FILTERS[h.filter].type;
        filter.frequency.value = h.cutoff;
        filter.Q.value = h.bypass ? 0 : nodeQ(h);
        lfoCut.connect(filter.detune);
        bookEnvelope(filter.detune, when, held ? null : gateSec, h, envOctaves(h) * 1200, 0);
        const stops = [];
        const vcos = {};
        // a VCO: a saw makes the pulse (the saw minus itself delayed by the
        // width; the LFO moves that delay when PW is by LFO), and a second
        // oscillator of the chosen shape (saw, triangle or sine) is the wave slider
        const vco = (name, freq, detuneCents, fromHz) => {
            const saw = ctx.createOscillator();
            saw.type = 'sawtooth';
            const wave = ctx.createOscillator();
            wave.type = SHAPES[h.shape].node;
            for (const o of [saw, wave]) {
                if (fromHz && gl > 0) { o.frequency.setValueAtTime(fromHz, when); o.frequency.exponentialRampToValueAtTime(freq, when + gl); } else o.frequency.setValueAtTime(freq, when);
                o.detune.value = detuneCents;
                lfoPitch.connect(o.detune);
            }
            const gSaw = ctx.createGain(); gSaw.gain.value = (h.saw / 100) * waveGain(h) * pg;
            const gPul = ctx.createGain(); gPul.gain.value = (h.pulse / 100) * SOURCE_GAIN.pulse * pg;
            const gNeg = ctx.createGain(); gNeg.gain.value = -gPul.gain.value;
            const delay = ctx.createDelay(0.25);
            const period = 1 / freq;
            delay.delayTime.value = (pwmOn(h) ? 0.5 : h.width / 100) * period;
            const pw = ctx.createGain(); pw.gain.value = pwmOn(h) ? (0.5 - h.width / 100) * period : 0;
            lfo.connect(pw); pw.connect(delay.delayTime);
            wave.connect(gSaw); gSaw.connect(filter);
            saw.connect(gPul); gPul.connect(filter);
            saw.connect(delay); delay.connect(gNeg); gNeg.connect(filter);
            saw.start(when); wave.start(when);
            stops.push(saw, wave);
            vcos[name] = { saw, wave, gSaw, gPul, gNeg, delay, pw };
            return saw;
        };
        const osc1 = vco('a', f0, h.osc2 === 'pair' ? -h.detune / 2 : 0, glideFromHz);
        let osc2 = null;
        if (two) { const ratio = osc2Ratio(h); osc2 = vco('b', f0 * ratio, h.osc2 === 'pair' ? h.detune / 2 : 0, glideFromHz ? glideFromHz * ratio : null); }
        // the sub-oscillator: a square an octave or two down
        const sub = ctx.createOscillator();
        sub.type = 'square';
        const fs = f0 / 2 ** h.subOct;
        if (glideFromHz && gl > 0) { sub.frequency.setValueAtTime(glideFromHz / 2 ** h.subOct, when); sub.frequency.exponentialRampToValueAtTime(fs, when + gl); } else sub.frequency.setValueAtTime(fs, when);
        lfoPitch.connect(sub.detune);
        const gSub = ctx.createGain(); gSub.gain.value = (h.sub / 100) * SOURCE_GAIN.sub * PART_GAIN[h.part];
        sub.connect(gSub); gSub.connect(filter); sub.start(when); stops.push(sub);
        // white noise, looped
        const noise = ctx.createBufferSource(); noise.buffer = noiseBuf; noise.loop = true;
        const gNoise = ctx.createGain(); gNoise.gain.value = (h.noise / 100) * SOURCE_GAIN.noise * PART_GAIN[h.part];
        noise.connect(gNoise); gNoise.connect(filter); noise.start(when); stops.push(noise);
        // the amplifier: the envelope, or the gate (the key alone)
        const amp = ctx.createGain();
        if (h.vca === 'gate') {
            amp.gain.setValueAtTime(0, when); amp.gain.linearRampToValueAtTime(1, when + 0.004);
            if (!held) { amp.gain.setValueAtTime(1, when + gateSec); amp.gain.linearRampToValueAtTime(0, when + gateSec + 0.006); }
        } else bookEnvelope(amp.gain, when, held ? null : gateSec, h, 1, 0);
        const trem = ctx.createGain();
        trem.gain.value = 1 - (h.lfoTarget === 'amp' ? lfoSwing(h) / 2 : 0);
        lfoAmp.connect(trem.gain);
        filter.connect(amp); amp.connect(trem); trem.connect(bus);
        const stopAll = (t) => { for (const nd of stops) { try { nd.stop(t); } catch { /* ended */ } } };
        const tail = h.vca === 'gate' ? 0.02 : h.release / 1000;
        const v = { midi, f0, osc1, osc2, vcos, sub, gSub, noise, gNoise, filter, amp, trem, t0: when, off: held ? when + KEY_HOLD_MS / 1000 : when + gateSec, tail, h, held, released: false, seq: !held, stopAll };
        if (!held) { stopAll(when + gateSec + tail + 0.05); v.released = true; }
        else stopAll(when + KEY_HOLD_MS / 1000);
        voices.add(v);
        osc1.onended = () => voices.delete(v);
        if (when > lastOn) lastOn = when;
        return v;
    }
    // the sequenced part: one bar booked at a time
    function bookBar(s, { bar, barStart, beatSec }) {
        const p = PARTS[s.part];
        const local = bar % p.bars;
        const step = beatSec / 4;
        const mono = s.voices === 'mono';
        let evs = arpeggiate(p.notes.filter((e) => Math.floor(e.s / 16) === local), s);
        if (mono) {
            // one note at a time: a chord keeps its top note (the 2022 fault)
            const byStep = new Map();
            for (const e of evs) { const c = byStep.get(e.s); if (!c || e.midi > c.midi) byStep.set(e.s, e); }
            evs = [...byStep.values()].sort((a, b) => a.s - b.s);
        }
        for (const e of evs) {
            const when = barStart + (e.s % 16) * step;
            const gateSec = e.len * step * p.gate;
            const v = noteOn(e.midi, when, gateSec, s, { glideFromHz: mono ? lastSeqHz : null });
            if (mono) { lastSeqHz = v.f0; }
            else lastSeqHz = null;
        }
        return local === 0;
    }
    // the keys on the stage and A to K
    const held = new Map();
    function keyOn(midi, s) {
        if (held.has(midi)) return;
        const when = ctx.currentTime;
        let from = null;
        if (s.voices === 'mono') { for (const [, v] of held) { releaseAt(v, when); from = v.f0; } held.clear(); }
        const v = noteOn(midi, when, null, s, { glideFromHz: from, held: true });
        held.set(midi, v);
    }
    function keyOff(midi) {
        const v = held.get(midi);
        if (!v) return;
        held.delete(midi);
        releaseAt(v, ctx.currentTime);
    }
    function allKeysOff() { for (const midi of [...held.keys()]) keyOff(midi); }
    // live edits reach the voices that are sounding
    function apply(s) {
        cur = s;
        const t = ctx.currentTime;
        lfo.type = s.lfoShape;
        lfo.frequency.setTargetAtTime(s.lfoRate, t, 0.02);
        const swing = lfoSwing(s);
        lfoPitch.gain.setTargetAtTime(s.lfoTarget === 'pitch' ? swing : 0, t, 0.02);
        lfoCut.gain.setTargetAtTime(s.lfoTarget === 'cutoff' ? swing : 0, t, 0.02);
        lfoAmp.gain.setTargetAtTime(s.lfoTarget === 'amp' ? swing / 2 : 0, t, 0.02);
        for (const v of voices) {
            v.filter.type = s.bypass ? 'allpass' : FILTERS[s.filter].type;
            glide(v.filter.frequency, s.cutoff, ctx, 0.02);
            glide(v.filter.Q, s.bypass ? 0 : nodeQ(s), ctx, 0.02);
            const f0 = midiHz(v.midi) * 2 ** s.octave;
            v.f0 = f0;
            const two = v.osc2 != null;
            const pg = PART_GAIN[s.part] * (two ? 0.62 : 1);
            for (const [name, o] of Object.entries(v.vcos)) {
                const on = name === 'a' || s.osc2 !== 'off' ? 1 : 0;
                const freq = f0 * (name === 'b' ? osc2Ratio(s) : 1);
                for (const osc of [o.saw, o.wave]) { glide(osc.frequency, freq, ctx, 0.02); osc.detune.value = s.osc2 === 'pair' ? (name === 'a' ? -s.detune / 2 : s.detune / 2) : 0; }
                if (o.wave.type !== SHAPES[s.shape].node) o.wave.type = SHAPES[s.shape].node;
                const period = 1 / freq;
                const gp = (s.pulse / 100) * SOURCE_GAIN.pulse * pg * on;
                glide(o.gSaw.gain, (s.saw / 100) * waveGain(s) * pg * on, ctx, 0.02);
                glide(o.gPul.gain, gp, ctx, 0.02);
                glide(o.gNeg.gain, -gp, ctx, 0.02);
                glide(o.delay.delayTime, (pwmOn(s) ? 0.5 : s.width / 100) * period, ctx, 0.02);
                glide(o.pw.gain, pwmOn(s) ? (0.5 - s.width / 100) * period : 0, ctx, 0.02);
            }
            glide(v.sub.frequency, f0 / 2 ** s.subOct, ctx, 0.02);
            glide(v.gSub.gain, (s.sub / 100) * SOURCE_GAIN.sub * PART_GAIN[s.part], ctx, 0.02);
            glide(v.gNoise.gain, (s.noise / 100) * SOURCE_GAIN.noise * PART_GAIN[s.part], ctx, 0.02);
            glide(v.trem.gain, 1 - (s.lfoTarget === 'amp' ? swing / 2 : 0), ctx, 0.02);
        }
    }
    // Stop cuts what the loop booked ahead (the hook fades the master, but
    // a voice booked 120 ms ahead would otherwise come back the moment a
    // key raises it again); a restart cuts the keys too.
    function clear({ keys = true } = {}) {
        const t = ctx.currentTime;
        for (const v of voices) {
            if (!keys && v.held) continue;
            try { v.amp.gain.cancelScheduledValues(t); v.amp.gain.setTargetAtTime(0, t, 0.006); v.stopAll(t + 0.05); } catch { /* ended */ }
            voices.delete(v);
        }
        if (keys) held.clear();
        lastSeqHz = null;
    }
    // what is sounding now, for the stage
    function sounding() {
        const t = ctx.currentTime;
        const out = [];
        for (const v of voices) if (v.t0 <= t && (v.held ? !v.released : v.off + v.tail > t)) out.push(v.midi);
        return out;
    }
    return { noteOn, bookBar, keyOn, keyOff, allKeysOff, apply, clear, sounding, lastOn: () => lastOn, settings: () => cur, lfoTime: () => ctx.currentTime - lfoStart };
}

// ---- helpers for the stage ---------------------------------------------------
const rr = (g2, x, y, w, h, r) => { g2.beginPath(); g2.moveTo(x + r, y); g2.lineTo(x + w - r, y); g2.quadraticCurveTo(x + w, y, x + w, y + r); g2.lineTo(x + w, y + h - r); g2.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g2.lineTo(x + r, y + h); g2.quadraticCurveTo(x, y + h, x, y + h - r); g2.lineTo(x, y + r); g2.quadraticCurveTo(x, y, x + r, y); g2.closePath(); };
const WHITE_KEYS = [0, 2, 4, 5, 7, 9, 11, 12];
const BLACK_KEYS = [1, 3, 6, 8, 10];
const WHITE_LETTERS = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K'];
const BLACK_LETTERS = ['W', 'E', 'T', 'Y', 'U'];
const GRADE_TONE = { good: 'gold', partly: 'inkSoft', poor: 'coral' };
// A panel slider walking a log range (cutoff, the envelope's times, the LFO's rate).
// The position is rounded: Node's and the browser's Math.log can differ in
// the last digit, and a 3 ms attack hydrated as two different aria-valuenow
// strings (2 Sep 2026).
const LogFader = ({ value, min, max, onChange, format, ...rest }) => (
    <Fader {...rest} slim value={Math.round(logToPos(value, min, max) * 1e4) / 1e4} min={0} max={100} step={0.5} format={(pos) => format(posToLog(pos, min, max))} onChange={(pos) => onChange(posToLog(pos, min, max))} />
);
// A slider's column: its value above, the instrument, its name below.
const Slide = ({ name, shown, off = false, wide = false, children }) => (
    <div className={styles.slide} data-off={off || undefined} data-wide={wide || undefined}>
        <span className={styles.slideVal}>{shown}</span>
        {children}
        {typeof name === 'string' ? <span className={styles.slideName}>{name}</span> : name}
    </div>
);

// ---- the bench ------------------------------------------------------------
export default function SynthBench({ back }) {
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
    const lastRef = useRef(last);
    lastRef.current = last;
    const { studioOrigin } = useStudioArrival();
    const teach = mode === 'teacher';
    const ext = depth === 'extension';
    const maths = depth !== 'core';

    const graphRef = useRef(null);
    const heard = useCallback((s) => (heldRef.current ? rawOf(s) : s), []);
    const onSchedule = useCallback((info) => { const g = graphRef.current; if (g) g.bookBar(heard(stateRef.current), info); }, [heard]);
    const buildGraph = useCallback((ctx, input, master) => {
        const g = buildSynthGraph(ctx, input, master);
        graphRef.current = g;
        g.apply(heard(stateRef.current));
        return g;
    }, [heard]);
    const audio = useBenchAudio({ files: FILES, bpm: BPM, onSchedule, buildGraph });
    const { ctxRef, nodesRef, began, playing, start, stop, restart, begin } = audio;
    const playingRef = useRef(false);
    playingRef.current = playing;

    // live edits reach the graph; the part, the voices and hold restart the loop
    useEffect(() => { graphRef.current?.apply(heard(state)); }, [state, held, heard]);
    useEffect(() => { if (playingRef.current) restart(); }, [state.part, state.voices, state.arp, state.vca, held]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { if (!playing) graphRef.current?.clear({ keys: false }); }, [playing]);
    useEffect(() => {
        const ctx = ctxRef.current;
        const nodes = nodesRef.current;
        if (ctx && nodes) glide(nodes.level.gain, state.volume, ctx);
    }, [state.volume, began, ctxRef, nodesRef]);

    const touch = (what) => { setLast(what); setAnnounce(null); };
    const chooseDepth = (id) => { setDepth(id); setAnnounce(id); };
    const edit = (fn, what) => (v) => { setState((s) => fn(s, v)); touch(what); };
    const choosePart = (id) => { setState((s) => setPart(s, id)); touch('part'); };
    // A Judge preset's faults include the voices, and the 2025 lead is mono
    // with a glide: the row that fixes them opens with the preset, so the
    // diagnose-then-fix loop closes on the console (critique pass, 1 Sep).
    const choosePreset = (id) => { setState((s) => applyPreset(s, id)); touch('preset'); const p = PRESETS.find((x) => x.id === id); if (p && (p.task === 'judge' || p.set.glide === 'subtle')) setFurther(true); };
    const holdRaw = (on) => { heldRef.current = on; setHeld(on); };
    const togglePlay = useCallback(() => (playingRef.current ? stop() : start()), [start, stop]);

    // the keys: A to K play the voice at any level; space is the transport
    const keyOn = useCallback(async (midi) => {
        if (!ctxRef.current) await begin();
        const g = graphRef.current;
        const ctx = ctxRef.current;
        if (!g || !ctx) return;
        if (!playingRef.current && nodesRef.current) glide(nodesRef.current.master.gain, 1, ctx, 0.01);
        g.keyOn(midi, heard(stateRef.current));
        setState((s) => (s.lastKey === midi ? s : { ...s, lastKey: midi }));
    }, [begin, ctxRef, nodesRef, heard]);
    const keyOff = useCallback((midi) => { graphRef.current?.keyOff(midi); }, []);
    useEffect(() => {
        const down = new Set();
        function skip(e) {
            const el = e.target;
            const tag = el?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el?.isContentEditable) return true;
            if (document.getElementById('bench-drawer')?.dataset.open === 'true') return true;
            if (el !== document.body && !el?.closest?.('[data-bench-frame]')) return true;
            return false;
        }
        function onKey(e) {
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            if (e.key === ' ') {
                if (e.repeat || skip(e) || e.target?.closest?.('[data-hold]')) return;
                e.preventDefault();
                togglePlay();
                return;
            }
            const idx = KEYBOARD_KEYS.indexOf(e.key.toLowerCase());
            if (idx < 0 || e.repeat || skip(e) || !began) return;
            e.preventDefault();
            const midi = PARTS[stateRef.current.part].keyC + idx;
            down.add(midi);
            keyOn(midi);
        }
        function onUp(e) {
            const idx = KEYBOARD_KEYS.indexOf(e.key.toLowerCase());
            if (idx < 0) return;
            const midi = PARTS[stateRef.current.part].keyC + idx;
            if (down.delete(midi)) keyOff(midi);
        }
        function onBlur() { for (const m of down) keyOff(m); down.clear(); }
        window.addEventListener('keydown', onKey);
        window.addEventListener('keyup', onUp);
        window.addEventListener('blur', onBlur);
        return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onUp); window.removeEventListener('blur', onBlur); };
    }, [togglePlay, keyOn, keyOff, began]);

    const vd = useMemo(() => verdict(state), [state]);
    const rd = useMemo(() => readings(state), [state]);
    const vdRef = useRef(vd); vdRef.current = vd;
    const rdRef = useRef(rd); rdRef.current = rd;

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
    const stageOf = (d) => (d === 'core' ? 'scope' : d === 'alevel' ? 'sections' : 'machine');

    useEffect(() => {
        const first = canvasRef.current;
        if (!first) return undefined;
        let raf = 0;
        const css = getComputedStyle(first.parentElement);
        const v = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
        const col = {
            gold: v('--gold', '#c5a855'),
            goldBright: v('--gold-bright', '#f0d48a'),
            purple: v('--gen-3', '#a395c9'),
            amber: v('--gen-4', '#d9b26a'),
            green: v('--gen-1', '#7fb39b'),
            teal: v('--gen-7', '#7fd6de'),
            coral: v('--gen-6', '#d08a80'),
            white: '#ffffff',
            ink: 'rgba(255, 255, 255, 0.86)',
            inkSoft: 'rgba(255, 255, 255, 0.62)',
            inkFaint: 'rgba(255, 255, 255, 0.38)',
            grid: 'rgba(255, 255, 255, 0.07)',
            gridDiv: 'rgba(255, 255, 255, 0.16)',
            line: 'rgba(255, 255, 255, 0.22)',
            screen: 'rgba(0, 0, 0, 0.18)',
            keyWhite: 'rgba(255, 255, 255, 0.88)',
            keyBlack: '#22223a',
        };
        const monoFace = v('--mono', 'monospace');
        const mono = `11.5px ${monoFace}`;
        const monoSmall = `10px ${monoFace}`;
        const monoBold = `600 10.5px ${monoFace}`;
        const monoBig = `13px ${monoFace}`;
        const FREQS = logFreqs(220);
        const DB_TOP = 24; const DB_BOT = -48;

        function draw() {
            const canvas = canvasRef.current;
            if (!canvas) { raf = requestAnimationFrame(draw); return; }
            const g2 = canvas.getContext('2d');
            const s0 = stateRef.current;
            const s = heldRef.current ? rawOf(s0) : s0;
            const d = depthRef.current;
            const vdd = vdRef.current;
            const dpr = window.devicePixelRatio || 1;
            const w = canvas.clientWidth;
            const hgt = canvas.clientHeight;
            if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(hgt * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(hgt * dpr); }
            g2.setTransform(dpr, 0, 0, dpr, 0, 0);
            g2.clearRect(0, 0, w, hgt);
            const short = hgt < 330;
            const padL = 18; const padR = 16; const top = short ? 58 : 62; const bottom = hgt - 14;
            const settingY = 46;
            const gr = graphRef.current;
            const ctx = ctxRef.current;
            const sounding = gr && ctx ? gr.sounding() : [];
            // the pulse's width this frame: where the LFO has it, when PW is by LFO
            const lfoT = gr && ctx ? gr.lfoTime() : performance.now() / 1000;
            const wNow = pwmOn(s) ? widthAt(s, lfoValue(s.lfoShape, s.lfoRate, lfoT)) : s.width / 100;
            const keyC = PARTS[s.part].keyC;
            let handle = null; let keyPos = null; let boxes = null; let lanes = null;
            g2.font = mono; g2.lineWidth = 1; g2.textBaseline = 'alphabetic';

            if (d === 'core') {
                // ---- the tiles: where you are in the chain ----
                const sec = sectionOfLast(lastRef.current);
                const tiles = [['OSCILLATORS', 'osc'], ['FILTER', 'filter'], ['AMPLIFIER', 'env']];
                let tx = padL; const ty = top; const th = 18;
                g2.font = monoSmall;
                for (const [name, id] of tiles) {
                    const tw = g2.measureText(name).width + 16;
                    const lit = sec === id || (id === 'env' && sec === 'voices');
                    rr(g2, tx, ty, tw, th, 4);
                    g2.fillStyle = lit ? 'rgba(240, 212, 138, 0.16)' : 'rgba(255, 255, 255, 0.05)'; g2.fill();
                    g2.strokeStyle = lit ? col.goldBright : col.line; g2.stroke();
                    g2.fillStyle = lit ? col.goldBright : col.inkSoft; g2.textAlign = 'left';
                    g2.fillText(name, tx + 8, ty + 12.5);
                    tx += tw;
                    if (name !== 'AMPLIFIER') { g2.strokeStyle = col.line; g2.beginPath(); g2.moveTo(tx, ty + th / 2); g2.lineTo(tx + 12, ty + th / 2); g2.moveTo(tx + 9, ty + th / 2 - 3); g2.lineTo(tx + 12, ty + th / 2); g2.lineTo(tx + 9, ty + th / 2 + 3); g2.stroke(); tx += 12; }
                }
                g2.fillStyle = col.inkFaint; g2.fillText('the LFO and the envelope steer them; nothing else reaches the speakers', tx + 12, ty + 12.5);

                // ---- the keyboard at the foot ----
                const keyH = short ? 42 : 54;
                const kY = bottom - keyH; const kX0 = padL; const kW = w - padL - padR;
                const wkw = kW / 8;
                keyPos = { x: kX0 + wkw / 2, y: kY + keyH * 0.7 };
                const keys = [];
                WHITE_KEYS.forEach((semi, i) => {
                    const x = kX0 + i * wkw;
                    const on = sounding.includes(keyC + semi) || (dragRef.current?.kind === 'key' && dragRef.current.midi === keyC + semi);
                    rr(g2, x + 1, kY, wkw - 2, keyH, 3);
                    g2.fillStyle = on ? col.goldBright : col.keyWhite; g2.fill();
                    g2.fillStyle = on ? '#17172b' : 'rgba(26, 26, 46, 0.55)'; g2.font = monoSmall; g2.textAlign = 'center';
                    g2.fillText(WHITE_LETTERS[i], x + wkw / 2, kY + keyH - 6);
                    if (semi === 0 || semi === 12) { g2.fillStyle = 'rgba(26, 26, 46, 0.45)'; g2.fillText(noteName(keyC + semi), x + wkw / 2, kY + keyH - 18); }
                    keys.push({ midi: keyC + semi, x: x + 1, y: kY, w: wkw - 2, h: keyH, black: false });
                });
                const bkw = wkw * 0.58; const bkh = keyH * 0.6;
                const blackAt = [1, 2, 4, 5, 6]; // after which white key each black sits
                BLACK_KEYS.forEach((semi, i) => {
                    const x = kX0 + blackAt[i] * wkw - bkw / 2;
                    const on = sounding.includes(keyC + semi) || (dragRef.current?.kind === 'key' && dragRef.current.midi === keyC + semi);
                    rr(g2, x, kY, bkw, bkh, 2);
                    g2.fillStyle = on ? col.gold : col.keyBlack; g2.fill();
                    g2.fillStyle = on ? '#17172b' : 'rgba(255, 255, 255, 0.55)'; g2.font = monoSmall; g2.textAlign = 'center';
                    g2.fillText(BLACK_LETTERS[i], x + bkw / 2, kY + bkh - 6);
                    keys.unshift({ midi: keyC + semi, x, y: kY, w: bkw, h: bkh, black: true });
                });

                // ---- two screens ----
                const sTop = top + 30; const sBot = kY - 24;
                const sH = sBot - sTop;
                const gap = 16;
                const leftW = Math.round((w - padL - padR - gap) * 0.4);
                const L = { x0: padL, x1: padL + leftW, top: sTop, bottom: sBot };
                const R = { x0: padL + leftW + gap, x1: w - padR, top: sTop, bottom: sBot };
                for (const S of [L, R]) { g2.fillStyle = col.screen; g2.fillRect(S.x0, S.top, S.x1 - S.x0, sH); g2.strokeStyle = col.line; g2.strokeRect(S.x0 + 0.5, S.top + 0.5, S.x1 - S.x0 - 1, sH - 1); }

                // the wave leaving the synth
                const shape = waveShape(s, { width: wNow });
                const mid = (L.top + L.bottom) / 2; const half = sH / 2 - 12; const LW = L.x1 - L.x0;
                g2.strokeStyle = col.gridDiv; g2.beginPath(); g2.moveTo(L.x0, mid + 0.5); g2.lineTo(L.x1, mid + 0.5); g2.stroke();
                const trace = (arr) => { g2.beginPath(); for (let i = 0; i < arr.length; i += 1) { const x = L.x0 + (i / (arr.length - 1)) * LW; const y = mid - arr[i] * half; if (i === 0) g2.moveTo(x, y); else g2.lineTo(x, y); } };
                g2.strokeStyle = col.inkFaint; g2.lineWidth = 1; g2.setLineDash([3, 3]); trace(shape.raw); g2.stroke(); g2.setLineDash([]);
                const wc = s.saw > s.pulse ? col.amber : col.purple;
                g2.lineJoin = 'round'; g2.lineCap = 'round';
                trace(shape.out); g2.shadowColor = wc; g2.shadowBlur = 9; g2.strokeStyle = wc; g2.lineWidth = 2; g2.stroke(); g2.shadowBlur = 0;
                g2.lineWidth = 1; g2.lineCap = 'butt';
                g2.fillStyle = col.inkSoft; g2.font = monoBold; g2.textAlign = 'left';
                g2.fillText('WAVE', L.x0 + 8, L.top + 14);
                g2.fillStyle = col.inkFaint; g2.font = monoSmall;
                g2.fillText(`two cycles at ${fmtHz(shape.f0)}${s.pulse > 0 && (pwmOn(s) || s.width < 50) ? ` · width ${Math.round(wNow * 100)} %` : ''} · dotted: before the filter`, L.x0 + 8, L.bottom - 7);

                // the harmonics, with the filter over them
                const RW = R.x1 - R.x0; const RH = R.bottom - R.top;
                const xHz = (hz) => R.x0 + posOfHz(hz) * RW;
                const yDb = (db) => R.top + ((DB_TOP - Math.max(DB_BOT, Math.min(DB_TOP, db))) / (DB_TOP - DB_BOT)) * RH;
                g2.strokeStyle = col.grid;
                for (const hz of [50, 100, 200, 500, 1000, 2000, 5000, 10000]) { const x = Math.round(xHz(hz)) + 0.5; g2.beginPath(); g2.moveTo(x, R.top); g2.lineTo(x, R.bottom); g2.stroke(); }
                for (const db of [12, 0, -12, -24, -36]) { const y = Math.round(yDb(db)) + 0.5; g2.strokeStyle = db === 0 ? col.gridDiv : col.grid; g2.beginPath(); g2.moveTo(R.x0, y); g2.lineTo(R.x1, y); g2.stroke(); }
                g2.fillStyle = col.inkFaint; g2.font = monoSmall; g2.textAlign = 'center';
                for (const [hz, lab] of [[50, '50'], [100, '100'], [200, '200'], [500, '500'], [1000, '1k'], [2000, '2k'], [5000, '5k'], [10000, '10k']]) g2.fillText(lab, xHz(hz), R.bottom + 12);
                g2.textAlign = 'left'; g2.fillText('Hz', R.x1 - 14, R.bottom + 12);
                g2.textAlign = 'left'; g2.fillText('0 dB', R.x0 + 4, yDb(0) - 3); g2.fillText('−24', R.x0 + 4, yDb(-24) - 3);
                const lines = spectrum(s, undefined, { width: wNow });
                const nz = noiseLevel(s);
                const norm = Math.max(...lines.map((l) => l.amp), nz, 1e-6);
                const curve = s.bypass ? null : filterCurve(s, FREQS);
                // the noise: a floor across the screen, shaped by the filter
                if (nz > 0) {
                    const nDb = 20 * Math.log10(nz / norm);
                    const yAt = (i) => yDb(nDb + (curve ? curve[i].db : 0));
                    g2.beginPath(); g2.moveTo(R.x0, R.bottom);
                    FREQS.forEach((hz, i) => g2.lineTo(xHz(hz), yAt(i)));
                    g2.lineTo(R.x1, R.bottom); g2.closePath();
                    g2.fillStyle = col.teal; g2.globalAlpha = 0.14; g2.fill(); g2.globalAlpha = 1;
                    g2.beginPath(); FREQS.forEach((hz, i) => { const y = yAt(i); if (i === 0) g2.moveTo(xHz(hz), y); else g2.lineTo(xHz(hz), y); });
                    g2.strokeStyle = col.teal; g2.globalAlpha = 0.55; g2.stroke(); g2.globalAlpha = 1;
                    g2.fillStyle = col.teal; g2.font = monoSmall; g2.textAlign = 'left'; g2.fillText('noise', R.x0 + 4, Math.max(R.top + 26, yAt(0) - 4));
                }
                for (const l of lines) {
                    const x = xHz(l.hz);
                    const yRaw = yDb(20 * Math.log10(l.amp / norm));
                    const yOut = yDb(20 * Math.log10(Math.max(1e-6, l.out / norm)));
                    g2.strokeStyle = col.inkFaint; g2.globalAlpha = 0.35; g2.beginPath(); g2.moveTo(x, R.bottom); g2.lineTo(x, yRaw); g2.stroke(); g2.globalAlpha = 1;
                    g2.strokeStyle = l.src === 'sub' ? col.teal : l.osc === 2 ? col.green : l.src === 'saw' ? col.amber : col.purple; g2.lineWidth = 2;
                    g2.beginPath(); g2.moveTo(x, R.bottom); g2.lineTo(x, yOut); g2.stroke();
                    g2.lineWidth = 1;
                }
                // the filter's curve, gold, and its dot
                if (curve) {
                    g2.beginPath(); curve.forEach((p, i) => { const x = xHz(p.hz); const y = yDb(p.db); if (i === 0) g2.moveTo(x, y); else g2.lineTo(x, y); });
                    g2.shadowColor = 'rgba(240, 212, 138, 0.7)'; g2.shadowBlur = 10; g2.strokeStyle = col.goldBright; g2.lineWidth = 2; g2.lineJoin = 'round'; g2.stroke(); g2.shadowBlur = 0; g2.lineWidth = 1;
                    const dx = xHz(s.cutoff); const dy = yDb(resDb(s.res));
                    const hot = dragRef.current?.kind === 'dot' || hoverRef.current?.kind === 'dot';
                    g2.setLineDash([2, 3]); g2.strokeStyle = col.gold; g2.globalAlpha = 0.6; g2.beginPath(); g2.moveTo(dx, dy); g2.lineTo(dx, R.bottom); g2.stroke(); g2.setLineDash([]); g2.globalAlpha = 1;
                    g2.beginPath(); g2.arc(dx, dy, hot ? 7.5 : 5.5, 0, Math.PI * 2); g2.fillStyle = col.goldBright; g2.fill(); g2.strokeStyle = '#17172b'; g2.lineWidth = 1.5; g2.stroke(); g2.lineWidth = 1;
                    g2.fillStyle = col.goldBright; g2.font = monoBig; g2.textAlign = dx > R.x0 + RW * 0.6 ? 'right' : 'left';
                    g2.fillText(`cutoff ${fmtHz(s.cutoff)} · drag`, dx + (dx > R.x0 + RW * 0.6 ? -12 : 12), dy - 10);
                    handle = { x: dx, y: dy };
                } else {
                    g2.fillStyle = col.goldBright; g2.font = monoBig; g2.textAlign = 'left';
                    g2.fillText('filter open: the oscillators alone', R.x0 + 8, R.top + 30);
                }
                g2.fillStyle = col.inkSoft; g2.font = monoBold; g2.textAlign = 'left';
                g2.fillText('HARMONICS', R.x0 + 8, R.top + 14);
                g2.fillStyle = col.inkFaint; g2.font = monoSmall;
                {
                    const bits = harmonicsSaid(s).split(' · ');
                    if (s.osc2 === 'pair') bits.push(`doubled ${s.detune} ct apart`); else if (s.osc2 === 'fifth') bits.push('a second a fifth up');
                    let head = bits.join(' · ');
                    while (bits.length > 1 && g2.measureText(head).width > RW - 84) { bits.pop(); head = bits.join(' · '); }
                    g2.fillText(head, R.x0 + 74, R.top + 14);
                }
                geomRef.current = { d, L, R, keys, xHz, yDb, hzOfX: (x) => hzOfPos((x - R.x0) / RW), dbOfY: (y) => DB_TOP - ((y - R.top) / RH) * (DB_TOP - DB_BOT) };
            } else if (d === 'alevel') {
                // ---- the paper's drawing: sections in signal order ----
                const all = judgeAll(s0);
                const sec = sectionOfLast(lastRef.current);
                const job = PARTS[s0.part].job;
                g2.fillStyle = col.inkFaint; g2.font = monoSmall; g2.textAlign = 'left';
                g2.fillText(`THE PAPER'S DRAWING · a synthesiser as sections, in signal order · judged for ${job}`, padL, top + 6);
                const areaTop = top + 18; const areaBot = bottom - 4;
                const H = areaBot - areaTop;
                const gapX = 46; const gapY = short ? 14 : 20;
                const outW = 44;
                const bw = Math.floor((w - padL - padR - outW - gapX * 3) / 3);
                const bh = Math.floor((H - gapY) / 2);
                const row1 = areaTop; const row2 = areaTop + bh + gapY;
                const bx = (i) => padL + i * (bw + gapX);
                boxes = {
                    osc: { x: bx(0), y: row1, w: bw, h: bh },
                    filter: { x: bx(1), y: row1, w: bw, h: bh },
                    voices: { x: bx(2), y: row1, w: bw, h: bh },
                    lfo: { x: bx(0), y: row2, w: bw, h: bh },
                    env: { x: bx(1), y: row2, w: bw, h: bh },
                };
                const lineOf = {
                    osc: [`${sourcesShort(s0)}${s0.osc2 === 'pair' ? ' × 2' : s0.osc2 === 'fifth' ? ' + a fifth' : ''}`, `range ${RANGE_WORD[s0.octave]}${s0.osc2 === 'pair' ? ` · detune ${s0.detune} ct` : ''}${s0.pulse > 0 ? ` · PW ${pwmOn(s0) ? 'by LFO' : `${s0.width} %`}` : ''}`, harmonicsSaid(s0)],
                    filter: [`${FILTERS[s0.filter].label} · cutoff ${fmtHz(s0.cutoff)}`, `resonance ${s0.res} % (${resDb(s0.res) > 0 ? '+' : ''}${resDb(s0.res).toFixed(0)} dB peak)`, s0.envAmt > 0 ? `env → cutoff ${envOctaves(s0).toFixed(1)} oct` : 'no envelope on the cutoff'],
                    voices: [`VCA ${s0.vca} · ${VOICES[s0.voices].label.toLowerCase()}${GLIDES[s0.glide].label.toLowerCase() === 'off' ? '' : ` · glide ${GLIDES[s0.glide].ms} ms`}`, `level ${Math.round(s0.volume * 100)} %`, s0.vca === 'gate' ? 'the key sets its gain: on, then off' : 'the envelope sets its gain'],
                    lfo: lfoOn(s0) ? [`${LFO_SHAPES[s0.lfoShape].label.toLowerCase()} · ${fmtRate(s0.lfoRate)}`, `→ ${LFO_TARGETS[s0.lfoTarget].label.toLowerCase()} · depth ${s0.lfoDepth} %`, 'a control signal, never heard'] : ['depth 0 %', 'nothing modulated', 'a control signal, never heard'],
                    env: [`A ${fmtMs(s0.attack)} · D ${fmtMs(s0.decay)}`, `S ${s0.sustain} % · R ${fmtMs(s0.release)}`, 'times, times, a level, a time'],
                };
                const arrow = (x0, y0, x1, y1, colour, dashed) => {
                    g2.strokeStyle = colour; g2.setLineDash(dashed ? [4, 4] : []); g2.beginPath(); g2.moveTo(x0, y0); g2.lineTo(x1, y1); g2.stroke(); g2.setLineDash([]);
                    const a = Math.atan2(y1 - y0, x1 - x0);
                    g2.fillStyle = colour; g2.beginPath(); g2.moveTo(x1, y1); g2.lineTo(x1 - 7 * Math.cos(a - 0.4), y1 - 7 * Math.sin(a - 0.4)); g2.lineTo(x1 - 7 * Math.cos(a + 0.4), y1 - 7 * Math.sin(a + 0.4)); g2.closePath(); g2.fill();
                };
                // the signal path
                const my = row1 + bh / 2;
                arrow(boxes.osc.x + bw, my, boxes.filter.x, my, col.ink, false);
                arrow(boxes.filter.x + bw, my, boxes.voices.x, my, col.ink, false);
                arrow(boxes.voices.x + bw, my, boxes.voices.x + bw + outW - 6, my, col.ink, false);
                g2.fillStyle = col.inkSoft; g2.font = monoSmall; g2.textAlign = 'left'; g2.fillText('OUT', boxes.voices.x + bw + outW - 4, my - 6);
                // the control routes
                const envTop = boxes.env.y;
                arrow(boxes.env.x + bw * 0.62, envTop, boxes.voices.x + bw * 0.3, row1 + bh, s0.vca === 'gate' ? col.inkFaint : col.purple, s0.vca === 'gate');
                arrow(boxes.env.x + bw * 0.38, envTop, boxes.filter.x + bw * 0.5, row1 + bh, s0.envAmt > 0 ? col.purple : col.inkFaint, s0.envAmt === 0);
                const target = s0.lfoTarget === 'pitch' ? boxes.osc : s0.lfoTarget === 'cutoff' ? boxes.filter : boxes.voices;
                arrow(boxes.lfo.x + bw * 0.5, boxes.lfo.y, target.x + bw * (s0.lfoTarget === 'pitch' ? 0.5 : 0.18), row1 + bh, lfoOn(s0) ? col.purple : col.inkFaint, !lfoOn(s0));
                if (pwmOn(s0)) { arrow(boxes.lfo.x + bw * 0.22, boxes.lfo.y, boxes.osc.x + bw * 0.22, row1 + bh, col.purple, false); g2.fillStyle = col.purple; g2.font = monoSmall; g2.textAlign = 'left'; g2.fillText('PW', boxes.osc.x + bw * 0.22 + 5, row1 + bh + 12); }
                g2.fillStyle = col.purple; g2.font = monoSmall; g2.textAlign = 'left';
                g2.fillText('control, dashed when not routed', boxes.env.x + bw + 10, row2 + bh - 6);
                // the boxes
                for (const id of SECTION_IDS) {
                    const b = boxes[id];
                    const gd = all[id];
                    const lit = sec === id;
                    rr(g2, b.x, b.y, b.w, b.h, 6);
                    g2.fillStyle = 'rgba(0, 0, 0, 0.22)'; g2.fill();
                    g2.strokeStyle = lit ? col.goldBright : col.line; g2.lineWidth = lit ? 2 : 1; g2.stroke(); g2.lineWidth = 1;
                    g2.fillStyle = lit ? col.goldBright : col.ink; g2.font = `600 12px ${monoFace}`; g2.textAlign = 'left';
                    g2.fillText(SECTIONS[id].label, b.x + 10, b.y + 17);
                    g2.fillStyle = col.inkFaint; g2.font = monoSmall;
                    g2.fillText(SECTIONS[id].name, b.x + 10 + g2.measureText(SECTIONS[id].label).width + 18, b.y + 17);
                    g2.fillStyle = col.inkSoft; g2.font = mono;
                    const ls = lineOf[id];
                    const lh = short ? 14 : 16;
                    const fit = Math.max(1, Math.min(3, Math.floor((b.h - 36 - 12) / lh)));
                    ls.slice(0, fit).forEach((t, i) => { g2.fillStyle = i === 2 ? col.inkFaint : col.inkSoft; g2.font = i === 2 ? monoSmall : mono; g2.fillText(t, b.x + 10, b.y + 36 + i * lh); });
                    const tone = GRADE_TONE[gd.grade];
                    g2.fillStyle = tone === 'gold' ? col.goldBright : tone === 'coral' ? col.coral : col.inkSoft; g2.font = monoBold; g2.textAlign = 'right';
                    g2.fillText(gd.grade === 'good' ? `suits ${job}` : gd.grade === 'partly' ? 'partly' : `does not suit ${job}`, b.x + b.w - 10, b.y + b.h - 9);
                }
                g2.fillStyle = col.inkFaint; g2.font = monoSmall; g2.textAlign = 'left';
                g2.fillText(sec ? 'the section you touched last is outlined; touch another to judge it' : 'touch a section to judge it', boxes.lfo.x, boxes.lfo.y + bh + 14);
                geomRef.current = { d, boxes };
            } else {
                // ---- the machine: one note in time ----
                const tl = timeline(s0);
                const labX = padL; const X0 = padL + 176; const X1 = w - padR;
                const TW = X1 - X0;
                const areaTop = top + 6; const axisH = 18; const gateH = short ? 16 : 20; const gapY = short ? 8 : 10;
                const LH = Math.floor((bottom - axisH - areaTop - gateH - gapY * 4) / 4);
                const xOf = (ms) => X0 + (ms / tl.spanMs) * TW;
                const lanesDef = [
                    { id: 'gate', name: 'GATE', h: gateH, note: 'the key: down, then up' },
                    { id: 'env', name: 'ENVELOPE', h: LH, note: 'asks: A, D, S, R', colour: col.purple },
                    { id: 'amp', name: 'AMPLIFIER', h: LH, note: s0.vca === 'gate' ? 'obeys the gate: on, then off' : s0.lfoTarget === 'amp' && lfoOn(s0) ? 'obeys; the LFO is tremolo' : 'obeys: the note\'s shape', colour: col.green },
                    { id: 'cutoff', name: 'CUTOFF', h: LH, note: s0.envAmt > 0 ? (s0.lfoTarget === 'cutoff' && lfoOn(s0) ? 'obeys env; wobble = LFO' : 'obeys the envelope') : (s0.lfoTarget === 'cutoff' && lfoOn(s0) ? 'the wobble is the LFO' : 'not routed: stays put'), colour: col.goldBright },
                    { id: 'lfo', name: 'LFO', h: LH, note: lfoOn(s0) ? `→ ${LFO_TARGETS[s0.lfoTarget].label.toLowerCase()} ${Math.round(lfoSwing(s0) * (s0.lfoTarget === 'amp' ? 100 : 1))}${s0.lfoTarget === 'amp' ? ' %' : ' ct'}${pwmOn(s0) ? ' + PW' : ''}; never heard` : pwmOn(s0) ? `→ pulse width ${s0.width} to ${100 - s0.width} %; never heard` : 'depth 0: nothing moves', colour: col.purple },
                ];
                lanes = [];
                let y = areaTop;
                const cMin = Math.min(...tl.cutoff) / 1.5; const cMax = Math.max(...tl.cutoff) * 1.5;
                for (const ln of lanesDef) {
                    const lane = { ...ln, top: y, bottom: y + ln.h };
                    lanes.push(lane);
                    g2.fillStyle = col.screen; g2.fillRect(X0, lane.top, TW, ln.h);
                    g2.strokeStyle = col.line; g2.strokeRect(X0 + 0.5, lane.top + 0.5, TW - 1, ln.h - 1);
                    g2.fillStyle = col.ink; g2.font = monoBold; g2.textAlign = 'left';
                    g2.fillText(ln.name, labX, lane.top + 13);
                    g2.fillStyle = col.inkFaint; g2.font = monoSmall;
                    const words = ln.note.split(' '); let l1 = ''; const out = [];
                    for (const wd of words) { const t2 = l1 ? `${l1} ${wd}` : wd; if (g2.measureText(t2).width > 160) { out.push(l1); l1 = wd; } else l1 = t2; }
                    if (l1) out.push(l1);
                    out.slice(0, ln.h > 44 ? 2 : ln.h >= 30 ? 1 : 0).forEach((t, i) => g2.fillText(t, labX, lane.top + 27 + i * 12)); // a short lane keeps its name and drops its note
                    // the gate line and the ADSR marks on every lane
                    const gx = xOf(tl.gateMs);
                    g2.strokeStyle = col.gridDiv; g2.setLineDash([2, 3]); g2.beginPath(); g2.moveTo(Math.round(gx) + 0.5, lane.top); g2.lineTo(Math.round(gx) + 0.5, lane.bottom); g2.stroke(); g2.setLineDash([]);
                    y += ln.h + gapY;
                }
                // the curves
                const plot = (lane, arr, lo, hi, colour, { fill = false, log = false } = {}) => {
                    const yOf = (val) => { const p = log ? (Math.log(val) - Math.log(lo)) / (Math.log(hi) - Math.log(lo)) : (val - lo) / (hi - lo); return lane.bottom - 4 - Math.max(0, Math.min(1, p)) * (lane.h - 8); };
                    g2.beginPath();
                    for (let i = 0; i < arr.length; i += 1) { const x = xOf(tl.t[i]); const yy = yOf(arr[i]); if (i === 0) g2.moveTo(x, yy); else g2.lineTo(x, yy); }
                    if (fill) { g2.lineTo(xOf(tl.t[arr.length - 1]), lane.bottom - 4); g2.lineTo(X0, lane.bottom - 4); g2.closePath(); g2.fillStyle = colour; g2.globalAlpha = 0.22; g2.fill(); g2.globalAlpha = 1; g2.beginPath(); for (let i = 0; i < arr.length; i += 1) { const x = xOf(tl.t[i]); const yy = yOf(arr[i]); if (i === 0) g2.moveTo(x, yy); else g2.lineTo(x, yy); } }
                    g2.strokeStyle = colour; g2.lineWidth = 1.8; g2.lineJoin = 'round'; g2.stroke(); g2.lineWidth = 1;
                    return yOf;
                };
                const [gate, env, amp, cut, lfoL] = lanes;
                // gate: high while the key is down
                g2.fillStyle = col.ink; g2.globalAlpha = 0.5; g2.fillRect(X0, gate.top + 5, xOf(tl.gateMs) - X0, gate.h - 10); g2.globalAlpha = 1;
                g2.fillStyle = col.inkSoft; g2.font = monoSmall; g2.textAlign = 'left'; g2.fillText(`key down ${fmtMs(tl.gateMs)}`, X0 + 6, gate.top + gate.h / 2 + 3.5);
                g2.fillText('key up', xOf(tl.gateMs) + 6, gate.top + gate.h / 2 + 3.5);
                const yEnv = plot(env, tl.env, 0, 1, col.purple);
                // A D S R marked on the envelope lane
                const marks = [[s0.attack, `A ${fmtMs(s0.attack)}`], [s0.attack + s0.decay, `D ${fmtMs(s0.decay)}`]];
                g2.font = monoSmall;
                for (const [ms, lab] of marks) { if (ms < tl.gateMs) { const x = xOf(ms); g2.strokeStyle = col.purple; g2.globalAlpha = 0.5; g2.setLineDash([2, 3]); g2.beginPath(); g2.moveTo(x, env.top); g2.lineTo(x, env.bottom); g2.stroke(); g2.setLineDash([]); g2.globalAlpha = 1; g2.fillStyle = col.purple; g2.textAlign = 'left'; g2.fillText(lab, x + 4, env.top + 11); } }
                g2.fillStyle = col.purple; g2.textAlign = 'right';
                if (tl.gateMs > s0.attack + s0.decay) g2.fillText(`S ${s0.sustain} %`, xOf(tl.gateMs) - 4, yEnv(s0.sustain / 100) - 4);
                g2.textAlign = 'left'; g2.fillText(`R ${fmtMs(s0.release)}`, xOf(tl.gateMs) + 4, env.top + 11);
                plot(amp, tl.amp, 0, 1, col.green, { fill: true });
                const yCut = plot(cut, tl.cutoff, cMin, cMax, col.goldBright, { log: true });
                g2.fillStyle = col.goldBright; g2.font = monoSmall; g2.textAlign = 'left';
                g2.fillText(fmtHz(s0.cutoff), X0 + 6, yCut(s0.cutoff) - 4 < cut.top + 10 ? yCut(s0.cutoff) + 12 : yCut(s0.cutoff) - 4);
                if (s0.envAmt > 0) g2.fillText(`peak ${fmtHz(Math.max(...tl.cutoff))}`, xOf(s0.attack) + 6, cut.top + 11);
                plot(lfoL, tl.lfo, -1.15, 1.15, col.purple);
                if (lfoOn(s0) || pwmOn(s0)) { g2.fillStyle = col.purple; g2.textAlign = 'left'; g2.fillText(`one cycle ${fmtMs(1000 / s0.lfoRate)}`, X0 + 6, lfoL.top + 11); }
                // the time axis
                const axisY = bottom - 4;
                const tick = tl.spanMs > 2500 ? 500 : tl.spanMs > 1200 ? 200 : 100;
                g2.fillStyle = col.inkFaint; g2.font = monoSmall; g2.textAlign = 'center';
                for (let ms = 0; ms <= tl.spanMs; ms += tick) g2.fillText(ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms}`, xOf(ms), axisY);
                g2.textAlign = 'left'; g2.fillText('ms', X1 - 12, axisY);
                // the playhead: where the last note is
                if (gr && ctx && playingRef.current) {
                    const since = (ctx.currentTime - gr.lastOn()) * 1000;
                    if (since >= 0 && since <= tl.spanMs) { const x = Math.round(xOf(since)) + 0.5; g2.strokeStyle = col.white; g2.globalAlpha = 0.5; g2.beginPath(); g2.moveTo(x, areaTop); g2.lineTo(x, lanes[4].bottom); g2.stroke(); g2.globalAlpha = 1; }
                }
                geomRef.current = { d, lanes, X0, X1, xOf, msOfX: (x) => ((x - X0) / TW) * tl.spanMs };
            }

            // ---- the setting line, for the depth ----
            const segs = [PARTS[s0.part].label.toLowerCase(), `${sourcesShort(s0)}${s0.osc2 === 'pair' ? ' × 2' : s0.osc2 === 'fifth' ? ' + 5th' : ''}`, `${FILTERS[s0.filter].label} ${fmtHz(s0.cutoff)}`];
            if (s0.vca === 'gate') segs.push('VCA gate');
            if (lfoOn(s0)) segs.push(`LFO → ${LFO_TARGETS[s0.lfoTarget].label.toLowerCase()}${pwmOn(s0) ? ' + PW' : ''}`); else if (pwmOn(s0)) segs.push('LFO → PW');
            segs.push(heldRef.current ? 'raw' : s0.presetId ? PRESETS.find((p) => p.id === s0.presetId)?.name.toLowerCase() : 'your patch');
            if (d !== 'core' && vdd.ok != null) segs.push(vdd.ok ? 'as directed' : 'not as directed');
            g2.fillStyle = col.goldBright; g2.font = mono; g2.textAlign = 'left';
            if (frameRef.current % 20 === 0 && legendRef.current) legendWRef.current = legendRef.current.getBoundingClientRect().width;
            frameRef.current += 1;
            const roomW = w - 18 - legendWRef.current - 16 - (padL + 6);
            let label = segs.join(' · ');
            while (segs.length > 2 && g2.measureText(label).width > roomW) { segs.pop(); label = segs.join(' · '); }
            g2.fillText(label, padL, settingY);

            if (readRef.current) {
                const nowMidi = sounding.length ? Math.min(...sounding) : null;
                const txt = nowMidi != null ? ` · ${noteLine(nowMidi)}` : ` · ${noteLine(rdRef.current.midi)}`;
                if (readRef.current.textContent !== txt) readRef.current.textContent = txt;
            }

            // what this frame drew, told to the DOM for check-bench (laws 18 and 25)
            const handleTag = handle ? `${Math.round(handle.x)}:${Math.round(handle.y)}` : '';
            if (canvas.dataset.handle !== handleTag) canvas.dataset.handle = handleTag;
            const keyTag = keyPos ? `${Math.round(keyPos.x)}:${Math.round(keyPos.y)}` : '';
            if (canvas.dataset.key !== keyTag) canvas.dataset.key = keyTag;
            const cutTag = String(Math.round(s0.cutoff));
            if (canvas.dataset.cutoff !== cutTag) canvas.dataset.cutoff = cutTag;
            const noteTag = sounding.length ? String(Math.min(...sounding)) : '';
            if (canvas.dataset.note !== noteTag) canvas.dataset.note = noteTag;
            const stageTag = stageOf(d);
            if (canvas.dataset.stage !== stageTag) canvas.dataset.stage = stageTag;
            if (canvas.dataset.verdict !== vdd.key) canvas.dataset.verdict = vdd.key;

            raf = requestAnimationFrame(draw);
        }
        raf = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(raf);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ---- the stage's pointer: the dot, the keys, the sections ----
    const hitKey = (px, py) => { const gm = geomRef.current; if (!gm || gm.d !== 'core') return null; return gm.keys.find((k) => px >= k.x && px <= k.x + k.w && py >= k.y && py <= k.y + k.h) || null; };
    const nearDot = (px, py) => { const gm = geomRef.current; const c = canvasRef.current; if (!gm || gm.d !== 'core' || !c?.dataset.handle) return false; const [hx, hy] = c.dataset.handle.split(':').map(Number); return Math.hypot(hx - px, hy - py) <= 13; };
    const hitBox = (px, py) => { const gm = geomRef.current; if (!gm || gm.d !== 'alevel') return null; return SECTION_IDS.find((id) => { const b = gm.boxes[id]; return px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h; }) || null; };
    const dotTo = (px, py) => { const gm = geomRef.current; if (!gm || gm.d !== 'core') return; const hz = gm.hzOfX(Math.max(gm.R.x0, Math.min(gm.R.x1, px))); const db = gm.dbOfY(py); setState((st) => dragDot(st, hz, db)); };
    const onStageDown = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const px = e.clientX - rect.left; const py = e.clientY - rect.top;
        if (nearDot(px, py)) {
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            dragRef.current = { kind: 'dot' };
            touch('stage');
            return;
        }
        const k = hitKey(px, py);
        if (k) {
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            dragRef.current = { kind: 'key', midi: k.midi };
            keyOn(k.midi);
            return;
        }
        const b = hitBox(px, py);
        if (b) touch(b);
    };
    const onStageMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const px = e.clientX - rect.left; const py = e.clientY - rect.top;
        if (dragRef.current?.kind === 'dot') { dotTo(px, py); return; }
        if (dragRef.current?.kind === 'key') {
            const k = hitKey(px, py);
            if (k && k.midi !== dragRef.current.midi) { keyOff(dragRef.current.midi); dragRef.current.midi = k.midi; keyOn(k.midi); }
            return;
        }
        if (nearDot(px, py)) { if (hover?.kind !== 'dot') setHover({ kind: 'dot', x: px, y: py, stageW: rect.width, stageH: rect.height }); return; }
        if (!teach) { if (hover) setHover(null); return; }
        const b = hitBox(px, py);
        if (b) { if (hover?.kind === 'box' && hover.id === b) return; setHover({ kind: 'box', id: b, x: px, y: py, stageW: rect.width, stageH: rect.height }); return; }
        const k = hitKey(px, py);
        if (k) { if (hover?.kind === 'key' && hover.midi === k.midi) return; setHover({ kind: 'key', midi: k.midi, x: px, y: py, stageW: rect.width, stageH: rect.height }); return; }
        const gm = geomRef.current;
        if (gm?.d === 'extension' && px >= gm.X0 && px <= gm.X1) { const ms = Math.round(gm.msOfX(px)); if (hover?.kind === 'time' && hover.ms === ms) return; setHover({ kind: 'time', ms, x: px, y: py, stageW: rect.width, stageH: rect.height }); return; }
        if (hover) setHover(null);
    };
    const onStageUp = (e) => {
        if (!dragRef.current) return;
        if (dragRef.current.kind === 'key') keyOff(dragRef.current.midi);
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
                    <h2>Synthesis, in the spec&apos;s words</h2>
                    <p>The spec asks how synthesis is used to create sounds: selecting and mixing sine, triangle, pulse, square and saw waveforms; low-pass and high-pass filters with a cutoff and a resonance; envelopes with an attack, decay, sustain and release; a low frequency oscillator; envelopes and LFOs mapped to the filter cutoff and the pitch; oscillator octave and tuning; monophonic and polyphonic; portamento. This bench is that list as the paper&apos;s own panel: the 1982 monophonic synthesiser of the 2024 Q6 figure, cut into LFO, VCO, source mixer, VCF, VCA and ENV, the sections the report says many candidates &quot;did not identify&quot;.</p>
                    <h3>Terms</h3>
                    <dl>
                        <dt>VCO</dt><dd>The voltage-controlled oscillator, the sound source: a repeating wave at a chosen pitch. This panel&apos;s VCO gives a pulse and a second wave (saw, triangle or sine) at once, mixed below. A second VCO a few cents from the first beats against it, which is detune.</dd>
                        <dt>Source mixer</dt><dd>What goes into the filter, each at its own level: the pulse, the second wave (its slider&apos;s name is the switch: Saw, Tri, Sine), a square sub-oscillator an octave or two down, and white noise. The spec&apos;s &quot;selecting and mixing&quot; is this row of sliders.</dd>
                        <dt>Waveform</dt><dd>Saw: every harmonic at 1/n, the brightest, the usual start for subtractive synthesis. Square: odd harmonics at 1/n, hollow. Pulse: a square whose high and low halves are unequal; as the width narrows the even harmonics come in and it thins. Triangle: odd harmonics falling fast at 1/n², soft. Sine: the fundamental alone, nothing for a filter to remove. Noise: every frequency at once, no harmonics and no pitch. The Oscilloscope bench (2.5) draws the four plain shapes against time.</dd>
                        <dt>Pulse width and PWM</dt><dd>Width is how much of each cycle the pulse is high: 50 % is a square. Pulse-width modulation is the LFO moving that width, so the harmonics shift and the sound moves, like a chorus without one. The 2019 report: &quot;many candidates thought that this was a square wave and did not appreciate that the pulse width was being modulated by the LFO&quot;.</dd>
                        <dt>Range</dt><dd>The VCO&apos;s octave, in organ feet: 8&apos; the part&apos;s own, 16&apos; an octave down, 4&apos; an octave up. The papers mark the octave of the example, and the 2023 AS report&apos;s common fault was an octave too high.</dd>
                        <dt>Filter</dt><dd>Removes harmonics. Low-pass keeps what is below the cutoff (darker); high-pass keeps what is above (thinner); band-pass keeps a band (nasal). Subtractive synthesis is the filter doing the subtracting.</dd>
                        <dt>Cutoff</dt><dd>Where the filter takes hold: the frequency already 3 dB down. Sweeping it is the classic synthesiser movement. A 2-pole filter falls 12 dB an octave beyond it; this bench&apos;s filter is 2-pole.</dd>
                        <dt>Resonance</dt><dd>A peak at the cutoff. Low: a gentle emphasis. High: a ringing, whistling quality; at the top, the filter sings a note of its own.</dd>
                        <dt>Envelope (ADSR)</dt><dd>Attack: the time to rise to peak. Decay: the time to fall to the sustain. Sustain: the level held while the key is down, a level not a time. Release: the time to fall to silence after the key lifts. Routed to the amplifier it shapes the note; routed to the cutoff it opens and closes the brightness on every note.</dd>
                        <dt>VCA: Env or Gate</dt><dd>The voltage-controlled amplifier. On Env the envelope sets its gain. On Gate the key does: full while it is down, off when it lifts, the envelope disabled. Not a noise gate; the 2019 report found candidates confusing the two.</dd>
                        <dt>LFO</dt><dd>A low frequency oscillator: a wave below the range of hearing, used to move something. On the pitch it makes vibrato; on the level, tremolo; on the cutoff, a wobble or a sweep. Rate is its speed, depth how far it moves the target. It is a control signal, never heard as a note.</dd>
                        <dt>Mono · poly · portamento</dt><dd>Monophonic plays one note at a time, the usual for bass and lead; polyphonic plays chords, which pads and keyboard parts need. Portamento, or glide, slides the pitch from one note to the next.</dd>
                        <dt>Coarse and fine tuning</dt><dd>Fine tuning is cents, the detune between a pair. Coarse tuning is semitones: Osc 2 set to Fifth sits seven semitones above Osc 1, and Sub an octave below. Octave is the range the papers mark.</dd>
                        <dt>Arpeggiator</dt><dd>Steps through a held chord&apos;s notes in turn instead of sounding them together. The Arp chip in the More row does it to the pad and the keyboard part, in sixteenths, lowest note first.</dd>
                        <dt>Pitch bend range</dt><dd>How far the bend wheel moves the pitch at full travel, in semitones: 7 in the 2020 fills, 12 in 2023, 4 in 2023 Q3(b). This bench has no wheel; the Piano Roll bench (1.5) has it, and its bass is this patch.</dd>
                    </dl>
                    <h3>In your DAW</h3>
                    <table>
                        <thead><tr><th>On this bench</th><th>Ableton Live</th><th>Logic Pro</th></tr></thead>
                        <tbody>
                            <tr><td>VCO and source mixer</td><td>Analog: Osc 1 and Osc 2, each with a shape (including a rectangle with a pulse width and white noise), a level, an octave and a detune</td><td>Retro Synth: Osc 1 and Osc 2 with Shape, octave and detune, and a Mix between them</td></tr>
                            <tr><td>PW by LFO</td><td>Analog: the oscillator&apos;s pulse width with LFO modulation on it</td><td>Retro Synth: Shape Mod from the LFO</td></tr>
                            <tr><td>VCA Env / Gate</td><td>Analog: Amp Env with its sustain at full and its times at zero is the gate</td><td>Retro Synth: Amp Env set the same way</td></tr>
                            <tr><td>Filter</td><td>Analog: Filter 1, with type, Freq and Res; the Env amount beside it</td><td>Retro Synth: Filter with type, Cutoff and Resonance; the Env Depth beside it</td></tr>
                            <tr><td>Envelope</td><td>Analog: Amp Env and Filter Env, each A D S R</td><td>Retro Synth: Amp Env and Filter Env, each A D S R</td></tr>
                            <tr><td>LFO</td><td>Analog: LFO 1 with shape, Rate and a destination amount on the pitch, the filter or the amp</td><td>Retro Synth: LFO with shape, Rate and a target</td></tr>
                            <tr><td>Mono · Glide</td><td>Analog: Voices set to 1; Glide time</td><td>Retro Synth: Voices set to Mono; Glide</td></tr>
                        </tbody>
                    </table>
                    <p className={styles.source}>As the controls appear in Live 12 and Logic Pro 11. Check against your own version if they move.</p>
                    <h3>Beyond the paper<span className={styles.ext}>EXT</span></h3>
                    <dl>
                        <dt>Why a control signal</dt><dd>Inside an analogue synthesiser an audio signal and a control voltage are the same kind of thing: a voltage. What makes one a sound and the other a modulation is only where it is plugged in. The LFO&apos;s output goes to a parameter, not to the speakers.</dd>
                        <dt>Envelope to pitch</dt><dd>The spec also maps an envelope to the pitch: a sweep that starts high and falls on every note, the 2025 Q6 tom. This bench routes its envelope to the amplifier and the cutoff only; the LFO reaches the pitch. A pitch envelope is the one routing here that is written, not played.</dd>
                        <dt>Why the filter is a biquad</dt><dd>The curve on the stage is computed from the same equations the browser&apos;s filter node runs, so what is drawn is what is heard. Resonance is written to the node in decibels for a low-pass and high-pass, and as Q for a band-pass, which is how Web Audio takes it.</dd>
                        <dt>Two saws make a pulse</dt><dd>A saw minus a copy of itself delayed by part of a cycle is a pulse of that width, and moving the delay moves the width. That is how this bench makes its pulse and its PWM, from two band-limited saws, so the bars on the stage are the harmonics it plays. It is also why two saws detuned a whisker apart move like a chorus: their sum is a pulse whose width sweeps by itself.</dd>
                    </dl>
                    <p className={styles.source}>The reading behind this bench is the topic&apos;s own Learn chapters, the vault&apos;s oscillator, filter and envelope notes, and the 9MT0/04 and 9MT0/41 question papers and mark schemes, 2019 to 2025.</p>
                </>
            ),
        },
        {
            id: 'teacher',
            label: 'Teacher',
            render: () => (
                <>
                    <h2>What to listen for</h2>
                    <p>Press Play and the 2023 bass runs on two detuned squares through a low-pass. Pull <b>Detune</b> to zero and the two waves collapse into one; push it past 30 and detune becomes out of tune. Drag the gold dot left and the harmonics disappear from the top down. Set <b>PW by</b> to LFO and watch the WAVE screen breathe: that is pulse-width modulation, and the 2019 report says most candidates called it a square wave. Press <b>hold: raw</b> and you hear what the filter and the envelope were taking away. Then switch to A-level and read the sections: that is the Q6 answer, in the order the 2024 report asks for it.</p>
                    <h3>What the schemes and reports say</h3>
                    <p>2023 AS, the bass: &quot;Square wave (1); Detune added, suitable amount (1); Correct filter setting (1); Correct octave (both oscillators) (1)&quot;. The report&apos;s common issues: no detune, and the wrong octave, one octave too high.</p>
                    <p>2024 AS, the keyboard: &quot;Two sawtooth oscillators&quot;; &quot;Both in same octave and transposed to correct octave (1)&quot;; &quot;Slight detune applied (1)&quot;; &quot;LPF matches example / equal or duller (1)&quot;.</p>
                    <p>2025, the lead: &quot;Monophonic without note overlaps (1)&quot;; &quot;Subtle portamento (1)&quot;; &quot;A=soft, D=max, S=max, R=short&quot;; &quot;Muted sound from low cut off frequency ... resonance isn&apos;t a feature&quot;; &quot;LFO giving subtle Fc wobble&quot;.</p>
                    <p>2023 and 2020, the fills: &quot;A=0, D=max, S=max, R=enough release so that the drop in octave is heard&quot;; and the 2020 report: &quot;Only the best candidates noticed that the release was very short, many leaving an audible tail presumably from a preset&quot;.</p>
                    <p>2024 Q6, the synth bass on a 1982 monophonic synthesiser: &quot;Candidates who divided up their writing into subheadings, one for each synthesiser section, provided the most concise and structured writing yielding highest marks&quot;; &quot;Many candidates did not identify what LFO/VCO/VCA/VCF represented and simply used the label from the synth&quot;; &quot;The most common AO4 marks were for describing the fast attack and release&quot;; &quot;Very commonly, candidates mistakenly thought that the LFO was something audible rather than a control signal&quot;; &quot;It was very rare to see candidates that fully understood that the LFO was controlling the pulse width modulation of a pulse wave&quot;; &quot;Candidates were often successful in discussing the sub-oscillator&quot;; &quot;many learners misidentified it as a boost/cut rather than an LPF and would discuss what resonance was but didn&apos;t discuss its impact on the sound&quot;.</p>
                    <p>2019 Q6, the synth pad on a 1982 polyphonic synthesiser: &quot;only the top performing candidates noticed that the envelope parameters were routed to the filter cutoff and not the amplitude&quot;; candidates confused &quot;the VCA gate (disabling the envelope) with a noise gate designed to cut out background noise&quot;; &quot;a surprising number of candidates ... thought that the LFO was for audible bass, rather than a control signal&quot;; &quot;many candidates thought that this was a square wave and did not appreciate that the pulse width was being modulated by the LFO&quot;.</p>
                    <p className={styles.source}>Source: Edexcel 9MT0/04 and 9MT0/41 mark schemes and Principal Examiner reports, 2019 Q6, 2020 Q2(b), 2022 AS Q2, 2023 Q2(d), 2023 AS Q3(a), 2024 Q6, 2024 AS Q2(c), 2025 Q3(a). The Q6 AO3 and AO4 grids are not in the vault; the sections here are judged from the reports&apos; own words.</p>
                    <h3>Do these now</h3>
                    <ul>
                        <li>Press <b>2023 paper</b>, then push Range to 4&apos;. Say why the scheme&apos;s fourth mark has gone before the line tells you.</li>
                        <li>On the same patch set <b>PW by</b> to LFO and watch the WAVE screen. Say what a candidate who called this &quot;a square wave&quot; in 2019 was not seeing.</li>
                        <li>Press <b>Judge: a bass</b>, switch to A-level, and touch each box in signal order. Write one sentence per box: the setting, then its impact, then whether that suits a bass.</li>
                        <li>Press <b>2025 paper</b>, switch to Extension, and count the LFO&apos;s cycles in one note. Then say what you would hear if the LFO were &quot;audible&quot;, and why you do not.</li>
                        <li>Press <b>Fills</b>, turn Release to 10 ms, and listen for the tail that is now missing. Then turn it to 2 s and hear the fills pile up.</li>
                        <li>Press <b>Judge: a pad</b> and fix it: the VCA to Env, Poly in the More row, then Attack past 500 ms, then Release past 1 s. Watch the section verdicts change one at a time, and say which of the 2019 report&apos;s two gates the VCA&apos;s is.</li>
                        <li>Push Env in the VCF to 60 % on the bass and say which report credited noticing that routing.</li>
                        <li>Take Pulse and Saw to zero and push Noise up: the HARMONICS screen now shows the filter&apos;s own shape. Say why, and why noise alone cannot play the part.</li>
                    </ul>
                    <h3>Exam practice</h3>
                    <ExamCallout
                        prompt="Figure 1 shows a monophonic synthesiser from 1982. Evaluate the suitability of the settings to produce a synth bass. (20 marks, 2024)"
                        answer="Take it section by section under subheadings. VCO: name the wave, its pulse width and the range, say what harmonics that gives the filter, and whether the pitch sits where a bass sits. SOURCE MIXER: the sub-oscillator is a square an octave down, weight beneath the bass. VCF: name it as a low-pass (not a boost or cut), give the cutoff's effect on the harmonics and say what the resonance does to the sound. VCA: Env or Gate, and what each does to the note. ENV: fast attack and release suit a bass; say what a slow attack would do to the line. LFO: it is a control signal at a low rate, moving something; say what it moves (here the pulse width) and whether that suits a bass. Every point is AO3 for the name and the setting, AO4 for the impact and the judgement."
                    />
                    <ExamCallout
                        prompt="Create a synth bass sound that is similar to the example. Use two square wave oscillators. Ensure the detuning matches, the filter setting matches, and the octave matches. (4 marks, 2023 AS)"
                        answer="Two squares, a few cents apart (not zero, not tens of cents), a low-pass with its cutoff in the middle of the harmonics, and both oscillators in the example's octave. The report's lost marks were no detune and an octave too high."
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
                        <b>The four waveforms, drawn</b>
                        <span>The Oscilloscope draws sine, square, saw and triangle against time and asks you to identify and draw them. Here they are chosen and filtered.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('eq')}>
                        <i>1.11 EQ</i>
                        <b>The filter is an EQ</b>
                        <span>A low-pass at 12 dB an octave is the same biquad the EQ bench draws. That bench has the shelves and bells; this one has the resonance and the envelope.</span>
                    </a>
                    <a className={topicHref('dynamic-processing') ? styles.conn : styles.conn} href={topicHref('dynamic-processing')}>
                        <i>1.9 Dynamic Processing</i>
                        <b>Attack and release, the other way</b>
                        <span>An envelope&apos;s attack is how fast a note opens; a compressor&apos;s attack is how fast the gain closes. The Dynamics bench draws the second.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('modulation')}>
                        <i>1.12 Modulation</i>
                        <b>The LFO as an effect</b>
                        <span>Tremolo, vibrato and chorus are LFOs at work on a finished signal. That topic is the effects; this bench is the LFO inside the instrument.</span>
                    </a>
                    <a className={styles.conn} href={topicHref('sequencing')}>
                        <i>1.5 Sequencing</i>
                        <b>The bass on the roll</b>
                        <span>The Piano Roll&apos;s bass plays on a square wave with a velocity-sensitive filter, the papers&apos; own patch. This bench is that patch opened up.</span>
                    </a>
                </>
            ),
        },
    ], [studioOrigin]);

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

    // ---- console: the paper's panel ----
    const octaveOptions = OCTAVE_IDS.map((o) => ({ id: o, label: RANGE_WORD[o], title: `${RANGE_WORD[o]}: ${octaveSaid(o)}` }));
    const filterOptions = FILTER_IDS.map((id) => ({ id, label: FILTERS[id].label, title: `${FILTERS[id].name}: ${FILTERS[id].does}` }));
    const lfoOptions = LFO_TARGET_IDS.map((id) => ({ id, label: LFO_TARGETS[id].label, title: `${LFO_TARGETS[id].said}: ${LFO_TARGETS[id].effect}` }));
    const voicesOptions = VOICES_IDS.map((id) => ({ id, label: VOICES[id].label, title: VOICES[id].said }));
    const glideOptions = GLIDE_IDS.map((id) => ({ id, label: GLIDES[id].label, title: GLIDES[id].said }));
    const osc2Options = OSC2_IDS.map((id) => ({ id, label: OSC2[id].label, title: OSC2[id].said }));
    const shapeOptions = LFO_SHAPE_IDS.map((id) => ({ id, label: SHAPE_SHORT[id], title: `${LFO_SHAPES[id].said} wave` }));
    const shapeNext = SHAPE_IDS[(SHAPE_IDS.indexOf(state.shape) + 1) % SHAPE_IDS.length];
    const shapeSwitch = (
        <button type="button" className={`${styles.slideName} ${styles.slideShape}`} data-shape={state.shape} aria-label={`Wave shape: ${SHAPES[state.shape].label}. Press for ${SHAPES[shapeNext].label}`} title={`${SHAPES[state.shape].said}, ${SHAPES[state.shape].does}. Press for ${SHAPES[shapeNext].label}`} onClick={() => edit(setShape, 'shape')(shapeNext)}>{SHAPES[state.shape].label}</button>
    );
    const pwmOptions = PWM_IDS.map((id) => ({ id, label: PWMS[id].label, title: `pulse width ${PWMS[id].said}` }));
    const subOctOptions = SUB_OCT_IDS.map((id) => ({ id, label: SUB_OCTS[id].label, title: `the sub-oscillator ${SUB_OCTS[id].said}` }));
    const vcaOptions = VCA_IDS.map((id) => ({ id, label: VCAS[id].label, title: VCAS[id].said }));
    const arpOptions = ARP_IDS.map((id) => ({ id, label: ARPS[id].label, title: ARPS[id].said }));
    const verdictWord = vd.key === 'free' ? 'no stem' : vd.ok == null ? (vd.poor?.length ? 'a fault' : vd.partly?.length ? 'partly' : 'suits') : vd.ok ? 'as directed' : 'not yet';
    const lfoValue2 = lfoOn(state) || pwmOn(state) ? fmtRate(state.lfoRate) : 'off';
    const lfoMeaning = `${pwmOn(state) ? (rd.lfoShort === 'off' ? 'PW' : `${rd.lfoShort} + PW`) : rd.lfoShort} · a control signal`;

    const consoleSlot = (
        <>
            <PlayColumn
                playing={playing}
                onTogglePlay={togglePlay}
                onHoldDry={holdRaw}
                level={state.volume}
                onLevel={(v2) => setState((s) => setVolume(s, v2))}
                teach={teach}
                holdLabel="hold: raw"
                holdTitle="Hold to hear the sources alone: the filter open, the envelope a switch, no LFO"
                holdWhy="plays the source mixer raw while you hold it, with the filter open, the envelope a switch and the LFO off, so you hear what the rest of the panel takes away"
                playWhy="runs the part round two bars at 100 bpm in A minor"
            />

            <div className={`${styles.sec} ${styles.secSynth} ${styles.secLfo}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>LFO</span><span className={styles.value}>{lfoValue2}</span></div>
                <Chips label="LFO wave" options={shapeOptions} value={state.lfoShape} onChange={edit(setLfoShape, 'lfoShape')} />
                <div className={styles.slideRow}>
                    <Slide name="Rate" shown={fmtRate(state.lfoRate)}>
                        <LogFader label="Rate" value={state.lfoRate} min={LFO_RATE_MIN} max={LFO_RATE_MAX} format={fmtRate} colour="var(--purple)" pixels={92} onChange={edit(setLfoRate, 'lfoRate')} title="How fast the LFO cycles: below hearing" />
                    </Slide>
                    <Slide name="Depth" shown={`${state.lfoDepth} %`} off={state.lfoDepth === 0}>
                        <Fader slim label="Depth" value={state.lfoDepth} min={LFO_DEPTH_MIN} max={LFO_DEPTH_MAX} step={1} format={(dp) => `${dp} %`} colour="var(--purple)" pixels={92} onChange={edit(setLfoDepth, 'lfoDepth')} title="How far the LFO moves what it points at" />
                    </Slide>
                    <div className={styles.chipStack}>
                        <span className={styles.slideName}>to</span>
                        <Chips label="LFO target" options={lfoOptions} value={state.lfoTarget} onChange={edit(setLfoTarget, 'lfoTarget')} />
                    </div>
                </div>
                <div className={styles.meaning}>{lfoMeaning}</div>
                <Why>A low frequency oscillator is a wave too slow to hear, pointed at a parameter: the pitch for vibrato, the level for tremolo, the cutoff for a wobble. Rate is its speed, depth how far it moves the target; the wave is its shape. It also moves the pulse width when the VCO says PW by LFO. The 2024 report: candidates &quot;mistakenly thought that the LFO was something audible rather than a control signal&quot;.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secSynth} ${styles.secVco}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>VCO</span><span className={styles.value}>{rd.note} · {fmtHz(rd.hz)}</span></div>
                <div className={styles.slideRow}>
                    <Slide name="Range" shown={RANGE_WORD[state.octave]}>
                        <Fader slim label="Range" value={state.octave} min={-1} max={1} step={1} format={(o) => `${RANGE_WORD[o]}, ${octaveSaid(o)}`} colour="var(--gen-3)" pixels={60} onChange={edit(setOctave, 'octave')} title="The octave, in the paper's feet: 8' is the part's own octave, 16' an octave down, 4' up" />
                    </Slide>
                    <Slide name="Detune" shown={`${state.detune} ct`} off={state.osc2 !== 'pair'}>
                        <Fader slim label="Detune" value={state.detune} min={DETUNE_MIN} max={DETUNE_MAX} step={1} format={(c) => `${c} ct`} colour="var(--gen-3)" pixels={92} disabled={state.osc2 !== 'pair'} onChange={edit(setDetune, 'detune')} title="How far apart the two VCOs are, in cents; Osc 2 must be a Pair (the More row)" />
                    </Slide>
                    <Slide name="Width" shown={`${state.width} %`} off={state.pulse === 0}>
                        <Fader slim label="Pulse width" value={state.width} min={WIDTH_MIN} max={WIDTH_MAX} step={1} format={(w2) => `${w2} %`} colour="var(--gen-3)" pixels={92} onChange={edit(setWidth, 'width')} title="The pulse's width: 50 % is a square; narrower, the even harmonics come in. With PW by LFO, how far the LFO swings it" />
                    </Slide>
                    <div className={styles.chipStack}>
                        <span className={styles.slideName}>PW by</span>
                        <Chips label="PW by" options={pwmOptions} value={state.pwm} onChange={edit(setPwm, 'pwm')} />
                    </div>
                </div>
                <div className={styles.meaning}>{octaveSaid(state.octave)}{pwmOn(state) ? ' · PWM' : state.pulse > 0 && state.width < 45 ? ' · a narrow pulse' : ''}</div>
                <Why>One oscillator, the paper&apos;s VCO. Range is its octave in organ feet, 8&apos; the part&apos;s own, the setting the papers mark (the 2023 report: one octave too high). Detune spreads a second VCO a few cents from this one; past 30 it is out of tune. Width narrows the pulse from a square, and PW by LFO lets the LFO move it: the pulse-width modulation the 2019 and 2024 reports say very few candidates recognised.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secSynth} ${styles.secMixer}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>Source mixer</span><span className={styles.value}>{rd.sourceCount ? `${rd.sourceCount} on` : 'none'}</span></div>
                <div className={styles.slideRow}>
                    {SOURCE_IDS.map((id) => (
                        <Slide key={id} name={id === 'saw' ? shapeSwitch : SOURCES[id].label} shown={`${state[id]} %`} off={state[id] === 0}>
                            <Fader slim label={id === 'saw' ? SHAPES[state.shape].label : SOURCES[id].label} value={state[id]} min={LEVEL_MIN} max={LEVEL_MAX} step={1} format={(l) => `${l} %`} colour={SOURCE_COLOUR[id]} pixels={92} onChange={edit(SETTER[id], id)} title={id === 'saw' ? SHAPES[state.shape].does : SOURCES[id].does} />
                        </Slide>
                    ))}
                </div>
                <div className={styles.meaning}>{rd.sources} → the filter</div>
                <Why>What goes into the filter, mixed rather than chosen: the VCO&apos;s pulse and its second wave, a square sub-oscillator an octave or two down (the More row sets which), and white noise. The second wave&apos;s name is a switch: press it for Saw, Tri or Sine, the spec&apos;s &quot;selecting and mixing sine, triangle, pulse, square and saw&quot;. A saw has every harmonic, a square the odd ones, a narrow pulse the even ones too, a triangle faint odd ones, a sine one alone; noise is every frequency and no pitch. The 2024 report: &quot;Candidates were often successful in discussing the sub-oscillator&quot;.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secSynth} ${styles.secVcf}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>VCF</span><span className={styles.value} data-cutoff={Math.round(state.cutoff)}>{fmtHz(state.cutoff)}</span></div>
                <Chips label="Filter type" options={filterOptions} value={state.filter} onChange={edit(setFilter, 'filter')} />
                <div className={styles.slideRow}>
                    <Slide name="Cutoff" shown={fmtHz(state.cutoff)} wide>
                        <LogFader label="Cutoff" value={state.cutoff} min={CUTOFF_MIN} max={CUTOFF_MAX} format={fmtHz} colour="var(--gold-bright)" hot pixels={110} onChange={edit(setCutoff, 'cutoff')} title="Where the filter takes hold: the frequency 3 dB down. The gold dot on the stage is this slider" />
                    </Slide>
                    <Slide name="Res" shown={`${state.res} %`}>
                        <Fader slim label="Resonance" value={state.res} min={RES_MIN} max={RES_MAX} step={1} format={(r) => `${r} %`} colour="var(--gold-bright)" pixels={92} onChange={edit(setRes, 'res')} title="The peak at the cutoff: 0 % flat, 100 % ringing" />
                    </Slide>
                    <Slide name="Env" shown={`${state.envAmt} %`} off={state.envAmt === 0}>
                        <Fader slim label="Env" value={state.envAmt} min={ENV_AMT_MIN} max={ENV_AMT_MAX} step={1} format={(a) => `${a} %`} colour="var(--purple)" pixels={92} onChange={edit(setEnvAmt, 'envAmt')} title="How far the envelope lifts the cutoff on every note: 100 % is four octaves" />
                    </Slide>
                </div>
                <div className={styles.meaning}>{rd.brightness}{state.envAmt > 0 ? ` · env lifts ${envOctaves(state).toFixed(1)} oct` : ''}</div>
                <Why>Low-pass keeps what is below the cutoff, so lower is darker; high-pass keeps what is above; band-pass keeps a band. Resonance is a peak at the cutoff. Env routes the envelope to the cutoff, so each note opens bright and closes: the routing the 2019 report says only the top candidates noticed.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secSynth} ${styles.secVca}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>VCA</span></div>
                <div className={styles.chipStack}>
                    <Chips label="VCA" options={vcaOptions} value={state.vca} onChange={edit(setVca, 'vca')} />
                </div>
                <div className={styles.meaning}>{state.vca === 'gate' ? 'obeys the key' : 'obeys the env'}</div>
                <Why>The amplifier. On Env it obeys the envelope, so the note has its shape. On Gate it obeys the key alone: full while the key is down, nothing after, the envelope disabled. The 2019 report found candidates confusing &quot;the VCA gate (disabling the envelope) with a noise gate designed to cut out background noise&quot;.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secSynth} ${styles.secEnv}`} data-teach={teach || undefined}>
                <div className={styles.secHead}><span className={styles.eyebrow}>ENV</span><span className={styles.value}>{rd.envelope}</span></div>
                <div className={styles.slideRow}>
                    <Slide name="Attack" shown={fmtMs(state.attack)} wide>
                        <LogFader label="Attack" value={state.attack} min={ATTACK_MIN} max={ATTACK_MAX} format={fmtMs} colour="var(--purple)" pixels={92} onChange={edit(setAttack, 'attack')} title="The time to rise to full" />
                    </Slide>
                    <Slide name="Decay" shown={fmtMs(state.decay)} wide>
                        <LogFader label="Decay" value={state.decay} min={DECAY_MIN} max={DECAY_MAX} format={fmtMs} colour="var(--purple)" pixels={92} onChange={edit(setDecay, 'decay')} title="The time to fall to the sustain" />
                    </Slide>
                    <Slide name="Sustain" shown={`${state.sustain} %`} wide>
                        <Fader slim label="Sustain" value={state.sustain} min={SUSTAIN_MIN} max={SUSTAIN_MAX} step={1} format={(l) => `${l} %`} colour="var(--purple)" pixels={92} onChange={edit(setSustain, 'sustain')} title="The level held while the key is down: a level, not a time" />
                    </Slide>
                    <Slide name="Release" shown={fmtMs(state.release)} wide>
                        <LogFader label="Release" value={state.release} min={RELEASE_MIN} max={RELEASE_MAX} format={fmtMs} colour="var(--purple)" pixels={92} onChange={edit(setRelease, 'release')} title="The time to fall to silence after the key lifts" />
                    </Slide>
                </div>
                <div className={styles.meaning}>{state.vca === 'gate' ? (state.envAmt > 0 ? 'on the cutoff only' : 'reaches nothing: VCA on Gate') : `on the amplifier${state.envAmt > 0 ? ' and the cutoff' : ''}`}</div>
                <Why>Attack, decay and release are times; sustain is a level. A bass wants a fast attack and a short release, a pad a slow attack and a long release; the 2024 report&apos;s most common AO4 mark was the fast attack and release. The 2020 report: only the best candidates noticed the release was very short.</Why>
            </div>

            <div className={`${styles.sec} ${styles.secHear}`} data-teach={teach || undefined} data-synth="true">
                <div className={styles.secHead}><span className={styles.eyebrow}>Hear</span></div>
                <div className={styles.stats} aria-live="polite">
                    <div><b data-note-number={rd.midi}>{rd.note} · {fmtHz(rd.hz)}</b><span>home note</span></div>
                    <div><b data-wrap="true">{rd.sources}</b><span>into the filter</span></div>
                    <div><b>{rd.brightness}</b><span>the filter</span></div>
                    <div><b>{rd.envelope}</b><span>the envelope</span></div>
                    {maths
                        ? <div><b>{verdictWord}</b><span>the paper&apos;s check{ext ? <span className={styles.ext}>EXT</span> : null}</span></div>
                        : <div><b>{held ? 'raw' : rd.lfoShort}</b><span>{held ? 'what is playing' : 'the LFO'}</span></div>}
                </div>
                <Legal />
                <Why>Every word here comes from the panel: the home note from the part and the range, the sources from the mixer, the brightness from the filter and its cutoff, the shape from the envelope or the gate, and whether the patch matches the question the preset set.</Why>
            </div>
        </>
    );

    const bar = (
        <>
            <div className={styles.barWrap}>
                <span className={styles.presetLabel}>Part</span>
                <div role="group" aria-label="Part">
                    {PART_IDS.map((id) => (
                        <button key={id} type="button" className={styles.chip} aria-pressed={state.part === id} onClick={() => choosePart(id)} title={`${PARTS[id].said}: ${PARTS[id].job}, at ${BPM} bpm in A minor`}>{PARTS[id].label}</button>
                    ))}
                </div>
                <span className={styles.presetLabel}>Presets</span>
                <div role="group" aria-label="Presets">
                    {presetsFor(depth).map((pr) => (
                        <button key={pr.id} type="button" className={styles.preset} aria-pressed={state.presetId === pr.id} onClick={() => choosePreset(pr.id)} title={pr.blurb}>{pr.name}</button>
                    ))}
                </div>
            </div>
            <div className={styles.say} data-mode={mode} data-depth={depth}>{say}</div>
            <MoreButton open={further} onOpen={() => setFurther(true)} />
        </>
    );

    const more = further ? (
        <>
            <div className={styles.moreItem}>
                <span className={styles.eyebrow}>Voices</span>
                <Chips label="Voices" options={voicesOptions} value={state.voices} onChange={edit(setVoices, 'voices')} />
            </div>
            <div className={styles.moreItem}>
                <span className={styles.eyebrow}>Glide</span>
                <Chips label="Glide" options={glideOptions} value={state.glide} onChange={edit(setGlide, 'glide')} />
            </div>
            <div className={styles.moreItem}>
                <span className={styles.eyebrow}>Osc 2</span>
                <Chips label="Osc 2" options={osc2Options} value={state.osc2} onChange={edit(setOsc2, 'osc2')} />
            </div>
            <div className={styles.moreItem}>
                <span className={styles.eyebrow}>Sub</span>
                <Chips label="Sub octave" options={subOctOptions} value={state.subOct} onChange={edit(setSubOct, 'subOct')} />
            </div>
            <div className={styles.moreItem}>
                <span className={styles.eyebrow}>Arp</span>
                <Chips label="Arp" options={arpOptions} value={state.arp} onChange={edit(setArp, 'arp')} />
                <span className={styles.chipNote}>{state.arp === 'up' ? (state.part === 'pad' || state.part === 'keys' ? 'each chord stepped up in sixteenths' : 'no chords in this part to step through') : `${VOICES[state.voices].label.toLowerCase()}${state.glide !== 'off' ? ` · glide ${GLIDES[state.glide].ms} ms` : ''} · ${OSC2[state.osc2].label.toLowerCase() === 'off' ? 'one VCO' : `osc 2: ${OSC2[state.osc2].label.toLowerCase()}`}`}</span>
            </div>
        </>
    ) : null;

    const hoverTip = () => {
        if (!hover) return null;
        if (hover.kind === 'dot') return <><i>cutoff · {fmtHz(state.cutoff)}</i><p>Drag across to move the cutoff, up for more resonance. The Cutoff slider follows.</p></>;
        if (hover.kind === 'key') return <><i>{noteName(hover.midi)} · {fmtHz(midiHz(hover.midi) * 2 ** state.octave)}</i><p>Press to play the voice at this note; {KEYBOARD_KEYS.charAt(hover.midi - PARTS[state.part].keyC).toUpperCase()} on your keyboard does the same.</p></>;
        if (hover.kind === 'box') { const gd = judgeAll(state)[hover.id]; return <><i>{SECTIONS[hover.id].label} · {GRADE_WORD[gd.grade]} {PARTS[state.part].job}</i><p>{gd.why.charAt(0).toUpperCase() + gd.why.slice(1)}.</p></>; }
        if (hover.kind === 'time') { const g = readings(state).gateMs; const e = adsrAt(state, hover.ms, g); return <><i>{fmtMs(hover.ms)} · envelope {Math.round(e * 100)} %</i><p>{hover.ms <= g ? `The key is down: ${hover.ms < state.attack ? 'the attack is rising' : hover.ms < state.attack + state.decay ? 'the decay is falling to the sustain' : 'holding at the sustain'}.` : `The key is up: the release is ${Math.round((1 - Math.min(1, (hover.ms - g) / state.release)) * 100)} % of the way to silence.`}</p></>; }
        return null;
    };

    const stage = (
        <>
            <canvas
                ref={canvasRef}
                aria-label={maths ? (ext ? 'One note in time: the envelope, the amplifier, the cutoff and the LFO as lanes' : 'The synthesiser as sections in signal order, each judged for the part') : 'The wave leaving the synth, its harmonics with the filter drawn over them, and a keyboard'}
                role="img"
                onPointerDown={onStageDown}
                onPointerMove={onStageMove}
                onPointerUp={onStageUp}
                onPointerCancel={onStageUp}
                onPointerLeave={() => { if (!dragRef.current) setHover(null); }}
            />
            <div className={styles.stageNote}>
                <b>{PARTS[state.part].label} · {BPM} bpm<span ref={readRef} style={{ '--read': '17ch' }} /></b>
                <span>{ORIENTS[depth] || ORIENTS.core}</span>
            </div>
            <div ref={legendRef} className={`${styles.stageLegend} ${styles.legendTop}`} aria-hidden="true">
                {depth === 'core' ? (
                    <>
                        {state.pulse > 0 ? <span><i style={{ background: 'var(--gen-3)' }} />{isSquare(state) ? 'square' : 'pulse'}</span> : null}
                        {state.saw > 0 ? <span><i style={{ background: 'var(--gen-4)' }} />{state.shape}</span> : null}
                        {state.sub > 0 || state.noise > 0 ? <span><i style={{ background: 'var(--gen-7)' }} />{[state.sub > 0 ? 'sub' : null, state.noise > 0 ? 'noise' : null].filter(Boolean).join(' · ')}</span> : null}
                        {state.osc2 !== 'off' ? <span><i style={{ background: 'var(--gen-1)' }} />{state.osc2 === 'fifth' ? 'a fifth up' : 'osc 2'}</span> : null}
                        <span><i style={{ background: 'var(--gold-bright)' }} />filter</span>
                    </>
                ) : depth === 'alevel' ? (
                    <>
                        <span><i style={{ background: 'rgba(255,255,255,0.86)' }} />signal</span>
                        <span><i style={{ background: 'var(--gen-3)' }} />control</span>
                    </>
                ) : (
                    <>
                        <span><i style={{ background: 'var(--gen-3)' }} />asks</span>
                        <span><i style={{ background: 'var(--gen-1)' }} />amplifier</span>
                        <span><i style={{ background: 'var(--gold-bright)' }} />cutoff</span>
                    </>
                )}
            </div>
            {hover && (teach || hover.kind === 'dot') ? (
                <div
                    className={styles.tip}
                    style={{
                        left: Math.max(12, Math.min(hover.stageW - 290, hover.x - 135)),
                        top: Math.max(44, Math.min(hover.stageH - 110, hover.y + 22)),
                    }}
                >
                    {hoverTip()}
                </div>
            ) : null}
            {!began ? (
                <div className={styles.begin}>
                    <button type="button" className={styles.beginBtn} onClick={() => audio.start()}>
                        <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1.2v9.6L11 6z" fill="currentColor" /></svg>
                        <span>
                            Play the bench
                            <small>A synthesiser as the paper draws it, with sound. Headphones help.</small>
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
