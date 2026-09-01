// The Synth bench (1.3): the model behind the voice.
//
// One subtractive voice, the paper's own drawing of a synthesiser: two
// oscillators into a filter into an amplifier, an envelope asking, an LFO
// moving something too slowly to hear. Everything here is arithmetic over
// one state: the harmonics each waveform carries, the filter's magnitude
// at each of them (the RBJ biquad the BiquadFilterNode also runs, so the
// curve on the stage is the curve the node makes), the envelope's four
// straight lines, the LFO's shape, and the checks the papers' questions
// make. No audio node in this file; SynthBench.jsx plays it.
//
// The part the voice plays is the job the paper asks about: a synth bass
// (2024 Q6, 2023 AS Q3), a pad (2019 Q6), synth fills (2020, 2023 Q2), a
// keyboard part on two saws (2022, 2024 AS Q2). Judging a patch for a job
// is the Q6 idiom, section by section.

import { sectionResponse } from './eq-model.js';

export const BPM = 100;
export const BEATS_PER_BAR = 4;
export const SIXTEENTHS = 16;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const clamp01 = (v) => clamp(v, 0, 1);

// ---- pitch ----------------------------------------------------------------------
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const midiHz = (midi) => 440 * 2 ** ((midi - 69) / 12);
export const noteName = (midi) => `${NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
export function fmtHz(hz) { return hz >= 1000 ? `${(hz / 1000).toFixed(hz >= 10000 ? 1 : 2).replace(/\.?0+$/, '')} kHz` : `${hz < 100 ? hz.toFixed(1) : Math.round(hz)} Hz`; }
export function fmtMs(ms) { return ms >= 1000 ? `${(ms / 1000).toFixed(ms >= 10000 ? 0 : 1).replace(/\.0$/, '')} s` : `${Math.round(ms)} ms`; }
export const fmtCents = (c) => `${Math.round(c)} ct`;
export const fmtRate = (hz) => (hz >= 10 ? `${Math.round(hz)} Hz` : `${hz.toFixed(1)} Hz`);

// A dial that walks a log range: the dial's position 0..100 to the value.
export const posToLog = (pos, min, max) => min * (max / min) ** (clamp(pos, 0, 100) / 100);
export const logToPos = (v, min, max) => 100 * Math.log(clamp(v, min, max) / min) / Math.log(max / min);

// ---- the oscillators --------------------------------------------------------------
// The four waveforms the spec names, with the harmonic series each carries
// (the spec's Waveform Mathematics; the vault's 1.3 (1) Oscillators note).
// OscillatorNode makes the same band-limited series, so the bars on the
// stage are the harmonics the node plays.
export const WAVE_IDS = ['square', 'saw', 'triangle', 'sine'];
export const WAVES = {
    square: { label: 'Square', type: 'square', said: 'a square wave', harmonics: 'odd harmonics only, each at 1/n', short: 'odd harmonics, 1/n', character: 'hollow, reedy', colour: 'var(--gen-3)' },
    saw: { label: 'Saw', type: 'sawtooth', said: 'a saw wave', harmonics: 'every harmonic, each at 1/n', short: 'every harmonic, 1/n', character: 'bright, buzzy', colour: 'var(--gen-4)' },
    triangle: { label: 'Triangle', type: 'triangle', said: 'a triangle wave', harmonics: 'odd harmonics only, falling fast at 1/n²', short: 'odd harmonics, 1/n²', character: 'soft, hollow', colour: 'var(--gen-6)' },
    sine: { label: 'Sine', type: 'sine', said: 'a sine wave', harmonics: 'the fundamental alone, no harmonics', short: 'the fundamental alone', character: 'pure, smooth', colour: 'var(--teal)' },
};
export function harmonicAmp(wave, n) {
    if (wave === 'sine') return n === 1 ? 1 : 0;
    if (wave === 'saw') return 1 / n;
    if (n % 2 === 0) return 0;
    if (wave === 'square') return 1 / n;
    return 1 / (n * n); // triangle
}
export const N_HARMONICS = 40;

export const OCTAVE_IDS = [-1, 0, 1];
export const octaveSaid = (o) => (o === 0 ? 'at the part\'s own octave' : o < 0 ? 'an octave down' : 'an octave up');
export const DETUNE_MIN = 0;
export const DETUNE_MAX = 50;
export const OSC2_IDS = ['pair', 'fifth', 'sub', 'off'];
export const OSC2 = {
    pair: { label: 'Pair', said: 'a second oscillator of the same wave, detuned against the first (fine tuning)' },
    fifth: { label: 'Fifth', said: 'a second oscillator of the same wave a fifth above, seven semitones (coarse tuning)' },
    sub: { label: 'Sub', said: 'a sub-oscillator: a square wave an octave below the first' },
    off: { label: 'Off', said: 'one oscillator' },
};
// The second oscillator's frequency against the first's.
export const osc2Ratio = (state) => (state.osc2 === 'sub' ? 0.5 : state.osc2 === 'fifth' ? 2 ** (7 / 12) : 1);
// The arpeggiator: a held chord's notes stepped through in sixteenths (the spec names it; the pad and keys have chords).
export const ARP_IDS = ['off', 'up'];
export const ARPS = { off: { label: 'Off', said: 'chords sound together' }, up: { label: 'Up', said: 'the arpeggiator steps up through each chord in sixteenths' } };

// ---- the filter ---------------------------------------------------------------------
export const FILTER_IDS = ['lpf', 'hpf', 'bpf'];
export const FILTERS = {
    lpf: { label: 'LPF', name: 'low-pass filter', type: 'lowpass', does: 'passes what is below the cutoff and removes what is above: darker' },
    hpf: { label: 'HPF', name: 'high-pass filter', type: 'highpass', does: 'passes what is above the cutoff and removes what is below: thinner' },
    bpf: { label: 'BPF', name: 'band-pass filter', type: 'bandpass', does: 'passes a band around the cutoff and removes both sides: nasal' },
};
export const CUTOFF_MIN = 40;
export const CUTOFF_MAX = 16000;
export const RES_MIN = 0;
export const RES_MAX = 100;
export const ENV_AMT_MIN = 0;
export const ENV_AMT_MAX = 100;
export const ENV_OCTAVES_MAX = 4; // Env at 100 % lifts the cutoff four octaves at the envelope's peak
export const SAMPLE_RATE = 48000;

// Resonance as the node takes it. Web Audio's lowpass and highpass take Q
// in dB (a Butterworth section is -3.01 dB there); bandpass takes Q as Q.
// 0 % is the flat Butterworth corner, 100 % a peak of 24 dB, near the
// ringing the vault's filter note calls self-oscillation.
export const RES_DB_MIN = -3;
export const RES_DB_MAX = 24;
export const resDb = (res) => RES_DB_MIN + (clamp(res, RES_MIN, RES_MAX) / 100) * (RES_DB_MAX - RES_DB_MIN);
export const resQ = (res) => 10 ** (resDb(res) / 20);
export const nodeQ = (state) => (state.filter === 'bpf' ? resQ(state.res) : resDb(state.res));
export const envOctaves = (state) => (clamp(state.envAmt, ENV_AMT_MIN, ENV_AMT_MAX) / 100) * ENV_OCTAVES_MAX;

// RBJ Audio EQ Cookbook coefficients for the three synth filters, as
// BiquadFilterNode computes them (the EQ bench holds lowpass and highpass
// too; bandpass is the constant-0-dB-peak form).
export function filterCoefficients(type, hz, q, sampleRate = SAMPLE_RATE) {
    const w0 = (2 * Math.PI * clamp(hz, 1, sampleRate / 2 - 1)) / sampleRate;
    const cos = Math.cos(w0);
    const sin = Math.sin(w0);
    const alpha = sin / (2 * q);
    let b0; let b1; let b2;
    if (type === 'lowpass') { b0 = (1 - cos) / 2; b1 = 1 - cos; b2 = (1 - cos) / 2; }
    else if (type === 'highpass') { b0 = (1 + cos) / 2; b1 = -(1 + cos); b2 = (1 + cos) / 2; }
    else if (type === 'bandpass') { b0 = alpha; b1 = 0; b2 = -alpha; }
    else throw new Error(`unknown filter type ${type}`);
    const a0 = 1 + alpha; const a1 = -2 * cos; const a2 = 1 - alpha;
    return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
}
export const filterCoef = (state, cutoff = state.cutoff) => filterCoefficients(FILTERS[state.filter].type, cutoff, resQ(state.res));
// |H| in dB at one frequency for the filter as set.
export function filterDb(state, hz, coef = filterCoef(state)) { return sectionResponse(coef, hz, SAMPLE_RATE).db; }
export const filterMag = (state, hz, coef) => 10 ** (filterDb(state, hz, coef) / 20);
// The curve across the stage's axis.
export function filterCurve(state, freqs) { const c = filterCoef(state); return freqs.map((hz) => ({ hz, db: filterDb(state, hz, c) })); }
export const HZ_LO = 30;
export const HZ_HI = 12000;
export const posOfHz = (hz, lo = HZ_LO, hi = HZ_HI) => Math.log(clamp(hz, lo, hi) / lo) / Math.log(hi / lo);
export const hzOfPos = (pos, lo = HZ_LO, hi = HZ_HI) => lo * (hi / lo) ** clamp01(pos);
export const logFreqs = (n = 200, lo = HZ_LO, hi = HZ_HI) => Array.from({ length: n }, (_, i) => hzOfPos(i / (n - 1), lo, hi));

// ---- the envelope -------------------------------------------------------------------
// Attack, decay and release are times; sustain is a level (the vault's ADSR
// note: "CRITICAL DISTINCTION"). Straight lines, the drawing the 2021
// paper marks.
export const ATTACK_MIN = 1; export const ATTACK_MAX = 2000;
export const DECAY_MIN = 10; export const DECAY_MAX = 2000;
export const SUSTAIN_MIN = 0; export const SUSTAIN_MAX = 100;
export const RELEASE_MIN = 10; export const RELEASE_MAX = 3000;
// The envelope's value 0..1 at t ms after key-down, the key held for gateMs.
export function adsrAt(state, tMs, gateMs) {
    const A = state.attack; const D = state.decay; const S = state.sustain / 100; const R = state.release;
    const gate = (t) => {
        if (t <= 0) return 0;
        if (t < A) return t / A;
        const td = t - A;
        if (td < D) return 1 - (1 - S) * (td / D);
        return S;
    };
    if (tMs <= gateMs) return gate(tMs);
    const atOff = gate(gateMs);
    const tr = tMs - gateMs;
    return tr >= R ? 0 : atOff * (1 - tr / R);
}
export function envelopeWord(state) {
    if (state.attack >= 200) return 'swelling';
    if (state.sustain <= 20 && state.decay <= 500) return 'plucked';
    if (state.release >= 800) return 'ringing';
    return 'held';
}

// ---- the LFO ------------------------------------------------------------------------
export const LFO_TARGET_IDS = ['pitch', 'cutoff', 'amp'];
export const LFO_TARGETS = {
    pitch: { label: 'Pitch', said: 'the pitch', effect: 'vibrato', full: 200, unit: 'cents' },
    cutoff: { label: 'Cutoff', said: 'the cutoff', effect: 'a filter wobble', full: 2400, unit: 'cents' },
    amp: { label: 'Amp', said: 'the level', effect: 'tremolo', full: 1, unit: '' },
};
export const LFO_RATE_MIN = 0.1;
export const LFO_RATE_MAX = 20;
export const LFO_DEPTH_MIN = 0;
export const LFO_DEPTH_MAX = 100;
export const LFO_SHAPE_IDS = ['triangle', 'sine', 'square'];
export const LFO_SHAPES = { triangle: { label: 'Triangle', said: 'a triangle' }, sine: { label: 'Sine', said: 'a sine' }, square: { label: 'Square', said: 'a square' } };
export function lfoValue(shape, rateHz, tSec) {
    const p = ((tSec * rateHz) % 1 + 1) % 1;
    if (shape === 'sine') return Math.sin(p * Math.PI * 2);
    if (shape === 'square') return p < 0.5 ? 1 : -1;
    return p < 0.25 ? p * 4 : p < 0.75 ? 2 - p * 4 : p * 4 - 4;
}
// How far the LFO moves its target at this depth: cents for pitch and cutoff, a fraction of the level for amp.
export const lfoSwing = (state) => (clamp(state.lfoDepth, LFO_DEPTH_MIN, LFO_DEPTH_MAX) / 100) * LFO_TARGETS[state.lfoTarget].full;
export const lfoOn = (state) => state.lfoDepth > 0;
// The short word for a console readout.
export function lfoShort(state) {
    if (!lfoOn(state)) return 'off';
    const t = state.lfoTarget;
    if (t === 'pitch') return state.lfoDepth > 40 ? 'wide wobble' : 'vibrato';
    if (t === 'cutoff') return state.lfoRate < 2 ? 'filter sweep' : state.lfoRate < 8 ? 'filter wobble' : 'growl';
    return 'tremolo';
}
export function lfoWord(state) {
    if (!lfoOn(state)) return 'off';
    const t = state.lfoTarget;
    if (t === 'pitch') return state.lfoRate >= 3 && state.lfoRate <= 8 && state.lfoDepth <= 30 ? 'vibrato' : state.lfoDepth > 40 ? 'a wide pitch wobble' : 'a pitch wobble';
    if (t === 'cutoff') return state.lfoRate < 2 ? 'a slow filter sweep' : state.lfoRate < 8 ? 'a filter wobble' : 'a filter growl';
    return state.lfoRate < 8 ? 'tremolo' : 'a fast tremolo';
}

// ---- voices and glide -----------------------------------------------------------------
export const VOICES_IDS = ['poly', 'mono'];
export const VOICES = { poly: { label: 'Poly', said: 'polyphonic: every note of a chord sounds' }, mono: { label: 'Mono', said: 'monophonic: one note at a time, each new note cutting the last' } };
export const GLIDE_IDS = ['off', 'subtle', 'long'];
export const GLIDES = { off: { label: 'Off', ms: 0, said: 'no portamento' }, subtle: { label: 'Subtle', ms: 60, said: 'a subtle portamento' }, long: { label: 'Long', ms: 300, said: 'a long portamento' } };

// ---- the parts: what the voice plays, at 100 bpm in A minor -----------------------------
// Steps are sixteenths over two bars; len in sixteenths; the gate is a
// fraction of the len. A chord is several events on one step, lowest first,
// so Mono keeps the top note (the 2022 report: a monophonic patch "did not
// play the complete chords").
const ev = (s, midi, len) => ({ s, midi, len });
const chord = (s, midis, len) => midis.map((m) => ev(s, m, len));
export const PART_IDS = ['bass', 'pad', 'lead', 'keys'];
export const PARTS = {
    bass: {
        label: 'Bass', said: 'the bass part', job: 'a synth bass', keyC: 36, gate: 0.8, bars: 2,
        notes: [ev(0, 33, 2), ev(2, 33, 2), ev(4, 45, 2), ev(6, 33, 2), ev(8, 31, 2), ev(10, 31, 2), ev(12, 33, 2), ev(14, 36, 2), ev(16, 29, 2), ev(18, 29, 2), ev(20, 41, 2), ev(22, 29, 2), ev(24, 31, 2), ev(26, 31, 2), ev(28, 43, 2), ev(30, 31, 2)],
    },
    pad: {
        label: 'Pad', said: 'the pad', job: 'a synth pad', keyC: 48, gate: 0.94, bars: 2,
        notes: [...chord(0, [45, 48, 52, 57], 16), ...chord(16, [41, 45, 48, 53], 16)],
    },
    lead: {
        label: 'Lead', said: 'the lead line', job: 'a synth lead', keyC: 60, gate: 0.85, bars: 2,
        notes: [ev(0, 69, 4), ev(4, 72, 2), ev(6, 71, 2), ev(8, 69, 4), ev(12, 64, 4), ev(16, 67, 4), ev(20, 69, 4), ev(24, 72, 6), ev(30, 71, 2)],
    },
    keys: {
        label: 'Keys', said: 'the keyboard part', job: 'a keyboard part', keyC: 48, gate: 0.9, bars: 2,
        notes: [...chord(0, [57, 60, 64], 3), ...chord(6, [57, 60, 64], 3), ...chord(10, [57, 60, 64], 4), ...chord(16, [53, 57, 60], 3), ...chord(22, [53, 57, 60], 3), ...chord(26, [53, 57, 60], 4)],
    },
};
export const KEYBOARD_KEYS = 'awsedftgyhujk'; // C to C, a computer keyboard's octave
export const stepSec = (bpm = BPM) => 60 / bpm / 4;
// The length of a typical note of the part, for the timeline: its first event's gate.
export function gateMs(state, bpm = BPM) {
    const p = PARTS[state.part];
    const first = p.notes[0];
    const chord = p.notes.filter((e) => e.s === first.s).length > 1;
    const len = state.arp === 'up' && chord ? 1 : first.len;
    return Math.round(len * stepSec(bpm) * p.gate * 1000);
}
// The events a bar plays: the arpeggiator spreads a chord over its own length, one note a sixteenth, lowest first.
export function arpeggiate(events, state) {
    if (state.arp !== 'up') return events;
    const byStep = new Map();
    for (const e of events) { if (!byStep.has(e.s)) byStep.set(e.s, []); byStep.get(e.s).push(e); }
    const out = [];
    for (const [s, group] of byStep) {
        if (group.length < 2) { out.push(...group); continue; }
        const notes = [...group].sort((a, b) => a.midi - b.midi);
        for (let i = 0; i < group[0].len; i += 1) out.push({ s: s + i, midi: notes[i % notes.length].midi, len: 1 });
    }
    return out.sort((a, b) => a.s - b.s);
}
export function homeMidi(state) { return PARTS[state.part].notes[0].midi + 12 * state.octave; }

// ---- state --------------------------------------------------------------------------------
function baseState() {
    return {
        part: 'bass',
        wave: 'square', octave: 0, detune: 8, osc2: 'pair',
        filter: 'lpf', cutoff: 900, res: 15, envAmt: 30,
        attack: 5, decay: 200, sustain: 60, release: 80,
        lfoTarget: 'pitch', lfoRate: 5, lfoDepth: 0, lfoShape: 'triangle',
        voices: 'poly', glide: 'off', arp: 'off',
        task: null, presetId: null, volume: 0.8,
    };
}

// ---- the papers' questions ---------------------------------------------------------------
// Sources: the 9MT0/04 and 9MT0/41 question papers and mark schemes as
// extracted from the vault's exam PDFs, 2019 to 2025. Each scheme task
// names the settings it marks; the Judge tasks are the Q6 idiom, a patch
// made for one job set to another.
export const TASKS = {
    as2023: { id: 'as2023', name: '2023 paper', part: 'bass', stem: 'Create a synth bass sound that is similar to the example. Use two square wave oscillators. Ensure the detuning between the oscillators matches the example. Ensure the filter setting matches the example. Ensure that the octave matches the example.', scheme: '"Square wave (1); Detune added, suitable amount (1); Correct filter setting (1); Correct octave (both oscillators) (1)"', source: '2023 AS Q3(a)' },
    as2024: { id: 'as2024', name: '2024 paper', part: 'keys', stem: 'Create a keyboard sound that matches the example. Use two sawtooth oscillators with no effects. Ensure that the octave matches the example. Copy the detune in the example. Copy the filtering in the example.', scheme: '"Two sawtooth oscillators (1)"; "Both in same octave and transposed to correct octave (1)"; "Slight detune applied (1)"; "LPF matches example / equal or duller (1)"', source: '2024 AS Q2(c)' },
    a2025: { id: 'a2025', name: '2025 paper', part: 'lead', stem: 'Create a synth sound that matches the example in octave, waveform, polyphony, portamento, amplitude envelope, filter and LFO, with no effects.', scheme: '"Square wave (1). Allow saw, pulse or triangle. Not sine"; "Monophonic without note overlaps (1)"; "Subtle portamento (1)"; "A=soft, D=max, S=max, R=short (1)"; "Muted sound from low cut off frequency ... resonance isn\'t a feature (1)"; "LFO giving subtle Fc wobble (1)"', source: '2025 Q3(a)' },
    fills2023: { id: 'fills2023', name: 'Fills', part: 'lead', stem: 'Create a synth sound that matches the timbre of the synth fills example.', scheme: '"Square wave (1). Allow saw or pulse"; "A=0, D=max, S=max, R=enough release so that the drop in octave is heard in the release phase"; "Matching LPF with no resonance"', source: '2023 Q2(d); the same fills in 2020 Q2(b): "A=0, D=max, S=max, R=0"' },
    judge: { id: 'judge', name: 'Judge', stem: 'Evaluate the suitability of the settings to produce the part.', scheme: 'AO3 for naming the sections and their settings; AO4 for the impact of each on the sound and its suitability for the job, section by section', source: '2019 Q6 (a synth pad) and 2024 Q6 (a synth bass), a 1982 synthesiser in the figure' },
};

export const PRESETS = [
    { id: 'as2023', name: '2023 paper', task: 'as2023', blurb: 'The 2023 AS bass: two square waves, detuned, a low-pass filter, the right octave. Four marks, one a setting', set: { part: 'bass', wave: 'square', octave: 0, detune: 12, osc2: 'pair', filter: 'lpf', cutoff: 700, res: 10, envAmt: 20, attack: 5, decay: 250, sustain: 50, release: 90, lfoDepth: 0, voices: 'mono', glide: 'off' } },
    { id: 'as2024', name: '2024 paper', task: 'as2024', blurb: 'The 2024 AS keyboard part: two saws, slightly detuned, the same octave, a low-pass filter no brighter than the example', set: { part: 'keys', wave: 'saw', octave: 0, detune: 7, osc2: 'pair', filter: 'lpf', cutoff: 2500, res: 5, envAmt: 0, attack: 10, decay: 300, sustain: 70, release: 200, lfoDepth: 0, voices: 'poly', glide: 'off' } },
    { id: 'a2025', name: '2025 paper', task: 'a2025', blurb: 'The 2025 lead: a square wave, mono, a subtle portamento, a soft attack, a muted low cutoff with no resonance and no filter envelope, and an LFO wobbling the cutoff', set: { part: 'lead', wave: 'square', octave: 0, detune: 0, osc2: 'off', filter: 'lpf', cutoff: 500, res: 0, envAmt: 0, attack: 40, decay: 2000, sustain: 100, release: 60, lfoTarget: 'cutoff', lfoRate: 4, lfoDepth: 15, lfoShape: 'triangle', voices: 'mono', glide: 'subtle' } },
    { id: 'fills2023', name: 'Fills', task: 'fills2023', blurb: 'The synth fills of 2020 and 2023: a square wave with an instant attack, full sustain and a release long enough to hear, through a low-pass filter with no resonance', set: { part: 'lead', wave: 'square', octave: 0, detune: 0, osc2: 'off', filter: 'lpf', cutoff: 1200, res: 0, envAmt: 0, attack: 1, decay: 2000, sustain: 100, release: 300, lfoDepth: 0, voices: 'poly', glide: 'off' } },
    { id: 'judgeBass', name: 'Judge: a bass', task: 'judge', blurb: 'A patch made for a pad, playing the bass part. Judge it section by section, the way the 2024 paper asked of a 1982 synthesiser', set: { part: 'bass', wave: 'saw', octave: 0, detune: 14, osc2: 'pair', filter: 'lpf', cutoff: 1500, res: 20, envAmt: 10, attack: 600, decay: 400, sustain: 80, release: 900, lfoTarget: 'cutoff', lfoRate: 0.5, lfoDepth: 30, lfoShape: 'triangle', voices: 'poly', glide: 'off' } },
    { id: 'judgePad', name: 'Judge: a pad', task: 'judge', blurb: 'A patch made for a bass, playing the pad. Judge it section by section, the way the 2019 paper asked', set: { part: 'pad', wave: 'square', octave: 0, detune: 0, osc2: 'sub', filter: 'lpf', cutoff: 500, res: 10, envAmt: 40, attack: 2, decay: 200, sustain: 30, release: 60, lfoDepth: 0, voices: 'mono', glide: 'off' } },
];
export function applyPreset(state, id) {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return state;
    return { ...baseState(), volume: state.volume, ...p.set, task: p.task, presetId: id };
}
export const DEFAULT_STATE = applyPreset(baseState(), 'as2023');

// ---- edits ----------------------------------------------------------------------------------
const drop = (state) => ({ ...state, presetId: null });
const one = (key, ids) => (state, v) => (ids.includes(v) && v !== state[key] ? { ...drop(state), [key]: v } : state);
const num = (key, lo, hi, round = (x) => Math.round(x)) => (state, v) => { const n = clamp(round(v), lo, hi); return n === state[key] ? state : { ...drop(state), [key]: n }; };
// A log dial's value keeps three significant figures, so one keyboard step
// (half a position) moves it even at the bottom of its range.
const sig3 = (x) => Number(Number(x).toPrecision(3));
export const setPart = (state, part) => (PARTS[part] && part !== state.part ? { ...state, part, presetId: state.task === 'judge' ? state.presetId : null } : state);
export const setWave = one('wave', WAVE_IDS);
export const setOctave = one('octave', OCTAVE_IDS);
export const setDetune = num('detune', DETUNE_MIN, DETUNE_MAX);
export const setOsc2 = one('osc2', OSC2_IDS);
export const setFilter = one('filter', FILTER_IDS);
export const setCutoff = num('cutoff', CUTOFF_MIN, CUTOFF_MAX, sig3);
export const setRes = num('res', RES_MIN, RES_MAX);
export const setEnvAmt = num('envAmt', ENV_AMT_MIN, ENV_AMT_MAX);
export const setAttack = num('attack', ATTACK_MIN, ATTACK_MAX, sig3);
export const setDecay = num('decay', DECAY_MIN, DECAY_MAX, sig3);
export const setSustain = num('sustain', SUSTAIN_MIN, SUSTAIN_MAX);
export const setRelease = num('release', RELEASE_MIN, RELEASE_MAX, sig3);
export const setLfoTarget = one('lfoTarget', LFO_TARGET_IDS);
export const setLfoRate = num('lfoRate', LFO_RATE_MIN, LFO_RATE_MAX, sig3);
export const setLfoDepth = num('lfoDepth', LFO_DEPTH_MIN, LFO_DEPTH_MAX);
export const setLfoShape = one('lfoShape', LFO_SHAPE_IDS);
export const setVoices = one('voices', VOICES_IDS);
export const setGlide = one('glide', GLIDE_IDS);
export const setArp = one('arp', ARP_IDS);
export function setVolume(state, volume) { return { ...state, volume: clamp01(volume) }; }
// The dot on the harmonics screen: across is the cutoff, up is the resonance
// (its height is the peak the filter makes at the cutoff, in dB).
export function dragDot(state, hz, db) {
    const next = setCutoff(state, hz);
    if (db == null) return next;
    return setRes(next, ((clamp(db, RES_DB_MIN, RES_DB_MAX) - RES_DB_MIN) / (RES_DB_MAX - RES_DB_MIN)) * 100);
}

// What plays while the button in the play column is held: the oscillators
// alone, the filter open, the envelope a switch, no LFO.
export function rawOf(state) {
    return { ...state, bypass: true, attack: 2, decay: 10, sustain: 100, release: 20, envAmt: 0, lfoDepth: 0 };
}

// ---- reading the voice --------------------------------------------------------------------
// The harmonics the two oscillators put into the filter, and what comes
// out, for one fundamental. amp is the oscillator's series, out is amp
// times the filter's magnitude; both normalised so the loudest bar is 1.
export function spectrum(state, f0 = midiHz(homeMidi(state)), { hi = HZ_HI, n = N_HARMONICS } = {}) {
    const coef = filterCoef(state);
    const lines = [];
    const put = (hz, amp, osc) => { if (hz <= hi && amp > 0.003) lines.push({ hz, amp, osc, out: amp * (state.bypass ? 1 : filterMag(state, hz, coef)) }); };
    const cents = state.osc2 === 'pair' ? state.detune / 2 : 0;
    const f1 = f0 * 2 ** (-cents / 1200);
    for (let k = 1; k <= n; k += 1) put(f1 * k, harmonicAmp(state.wave, k), 1);
    if (state.osc2 === 'pair') { const f2 = f0 * 2 ** (cents / 1200); for (let k = 1; k <= n; k += 1) put(f2 * k, harmonicAmp(state.wave, k), 2); }
    if (state.osc2 === 'fifth') { const f2 = f0 * osc2Ratio(state); for (let k = 1; k <= n; k += 1) put(f2 * k, harmonicAmp(state.wave, k), 2); }
    if (state.osc2 === 'sub') { for (let k = 1; k <= n; k += 1) put((f0 / 2) * k, harmonicAmp('square', k), 2); }
    lines.sort((a, b) => a.hz - b.hz);
    return lines;
}
// The wave the voice makes at this setting: the oscillators' series summed,
// before and after the filter, over `cycles` of the fundamental. Detune is
// left out here (a slow beat is not a shape); the sub is in.
export function waveShape(state, { n = 256, cycles = 2, harmonics = N_HARMONICS } = {}) {
    const raw = new Float32Array(n);
    const out = new Float32Array(n);
    const f0 = midiHz(homeMidi(state));
    const coef = filterCoef(state);
    const gain = state.osc2 === 'off' ? 1 : 0.6;
    const series = [{ f: 1, wave: state.wave, g: gain }];
    if (state.osc2 === 'pair') series.push({ f: 1, wave: state.wave, g: gain });
    if (state.osc2 === 'fifth') series.push({ f: osc2Ratio(state), wave: state.wave, g: gain });
    if (state.osc2 === 'sub') series.push({ f: 0.5, wave: 'square', g: gain });
    for (const { f, wave, g } of series) {
        for (let k = 1; k <= harmonics; k += 1) {
            const a = harmonicAmp(wave, k);
            if (!a) continue;
            const hz = f0 * f * k;
            if (hz > HZ_HI * 2) break;
            const m = state.bypass ? 1 : filterMag(state, hz, coef);
            const sign = wave === 'triangle' && k % 4 === 3 ? -1 : 1;
            for (let i = 0; i < n; i += 1) {
                const ph = (i / n) * cycles * Math.PI * 2 * f * k;
                const s = Math.sin(ph) * sign;
                raw[i] += a * g * s;
                out[i] += a * g * m * s;
            }
        }
    }
    let peak = 0;
    for (let i = 0; i < n; i += 1) peak = Math.max(peak, Math.abs(raw[i]), Math.abs(out[i]));
    if (peak > 0) for (let i = 0; i < n; i += 1) { raw[i] /= peak; out[i] /= peak; }
    return { raw, out, f0 };
}
// One note in time, sampled every `stepMs`: the gate, the envelope, what
// the amplifier does (the envelope times the tremolo), what the cutoff does
// (the envelope's lift plus the LFO's wobble), and the LFO itself.
export function timeline(state, { stepMs = 2, tailMs = 120 } = {}) {
    const gate = gateMs(state);
    const span = gate + state.release + tailMs;
    const n = Math.ceil(span / stepMs) + 1;
    const t = new Float32Array(n); const env = new Float32Array(n); const amp = new Float32Array(n); const cutoff = new Float32Array(n); const lfo = new Float32Array(n);
    const swing = lfoSwing(state);
    const oct = envOctaves(state);
    for (let i = 0; i < n; i += 1) {
        const ms = i * stepMs;
        t[i] = ms;
        const e = adsrAt(state, ms, gate);
        const l = lfoOn(state) ? lfoValue(state.lfoShape, state.lfoRate, ms / 1000) : 0;
        env[i] = e;
        lfo[i] = l;
        amp[i] = e * (state.lfoTarget === 'amp' ? 1 - (swing / 2) * (1 - l) : 1);
        cutoff[i] = state.cutoff * 2 ** (oct * e + (state.lfoTarget === 'cutoff' ? (swing * l) / 1200 : 0));
    }
    return { t, env, amp, cutoff, lfo, gateMs: gate, spanMs: span, stepMs };
}
export function brightnessWord(state) {
    if (state.bypass) return 'open';
    const c = state.cutoff;
    if (state.filter === 'hpf') return c < 200 ? 'full' : c < 1000 ? 'thin' : 'a whisper';
    if (state.filter === 'bpf') return c < 500 ? 'boxy' : c < 2000 ? 'nasal' : 'piercing';
    return c < 300 ? 'dark' : c < 1000 ? 'warm' : c < 4000 ? 'bright' : 'open';
}
export function readings(state) {
    const midi = homeMidi(state);
    return {
        midi, note: noteName(midi), hz: midiHz(midi), brightness: brightnessWord(state), envelope: envelopeWord(state), lfo: lfoWord(state), lfoShort: lfoShort(state), gateMs: gateMs(state), job: PARTS[state.part].job,
    };
}

// ---- the judge: a patch for a job, section by section ---------------------------------------
// The Q6 idiom (2019: a pad; 2024: a bass), applied to the four parts. The
// grounds are the schemes and reports in the vault: a bass wants a fast
// attack and release (2024 report: "the most common AO4 marks were for
// describing the fast attack and release"), harmonics for the filter to
// work on, the right octave (2023 AS report: "one octave too high"); a pad
// wants a slow attack, a long release, polyphony (2020 scheme: "with
// polyphony"; 2022 report: a mono patch "did not play the complete chords")
// and movement (2019 report: chorus and PWM credited); a lead is one note
// at a time (2025: "monophonic without note overlaps"); the 2022 and 2024
// keyboard parts are two saws, bright. The vault's ADSR note gives the
// typical times (bass attack 0 to 20 ms; pad attack 500 to 3000 ms).
const V = (grade, why) => ({ grade, why });
export const SECTION_IDS = ['osc', 'filter', 'env', 'lfo', 'voices'];
export const SECTIONS = {
    osc: { label: 'VCO', name: 'oscillators' },
    filter: { label: 'VCF', name: 'filter' },
    env: { label: 'ENV', name: 'envelope' },
    lfo: { label: 'LFO', name: 'LFO' },
    voices: { label: 'VCA', name: 'amplifier and voices' },
};
export function judgeSection(state, section, part = state.part) {
    const s = state;
    const w = s.wave;
    if (section === 'osc') {
        if (part === 'bass') {
            if (s.octave > 0) return V('poor', 'an octave up: the bass sits where the keyboard part lives, the 2023 report\'s most common fault');
            if (w === 'sine') return V('poor', 'a sine has no harmonics, so the filter has nothing to remove and the note is a pure sub');
            if (w === 'triangle') return V('partly', 'a triangle gives the filter little to work on; a square or a saw would fill the low end');
            if (s.osc2 === 'sub') return V('good', `${WAVES[w].said} with a sub-oscillator an octave down: harmonics to filter and weight beneath`);
            if (s.osc2 === 'fifth') return V('partly', `${WAVES[w].said} with a second a fifth above: thicker, but the fifth blurs the root of a bass line`);
            return V('good', `${WAVES[w].said}${s.osc2 === 'pair' && s.detune > 0 ? ' in a detuned pair' : ''}: harmonics for the filter to shape`);
        }
        if (part === 'pad') {
            if (w === 'sine') return V('partly', 'a sine pad is a hum: nothing for the filter to open or close');
            if (s.osc2 === 'off') return V('partly', 'one oscillator stands still; a detuned pair gives a pad its width');
            if (s.osc2 === 'pair' && s.detune < 4) return V('partly', 'the pair is barely detuned, so the two waves sit on top of each other with no movement');
            return V('good', `${WAVES[w].said} ${s.osc2 === 'pair' ? `in a pair ${s.detune} cents apart: width and slow movement` : s.osc2 === 'fifth' ? 'with a second a fifth above: the chord grows a voice' : 'with a sub beneath: weight'}`);
        }
        if (part === 'lead') {
            if (w === 'sine') return V('partly', 'a sine lead is thin and pure; the 2025 scheme allows square, saw, pulse or triangle, not sine');
            if (s.octave < 0) return V('partly', 'an octave down the lead sits in the keyboard part\'s register');
            if (s.osc2 === 'fifth') return V('partly', 'a fifth above every note: a melody in parallel fifths, thick but not the single line the 2025 scheme marks');
            return V('good', `${WAVES[w].said}${s.osc2 === 'pair' && s.detune > 0 ? ', detuned' : ''}: the shape the 2025 and 2023 schemes name`);
        }
        if (w === 'saw') return V(s.osc2 === 'fifth' ? 'partly' : 'good', `a saw${s.osc2 === 'pair' ? ` pair, ${s.detune} cents apart` : s.osc2 === 'fifth' ? ' with a fifth above, which thickens the chords past the two saws the schemes name' : ''}: the 2022 and 2024 keyboard parts are two saws`);
        if (w === 'square') return V('partly', 'a square is hollow where the 2022 and 2024 keyboard parts are saw-bright');
        return V('poor', `${WAVES[w].said} has too few harmonics for a bright keyboard part`);
    }
    if (section === 'filter') {
        const c = s.cutoff;
        if (part === 'bass') {
            if (s.filter === 'hpf') return V('poor', 'a high-pass filter on a bass removes the bass');
            if (s.filter === 'bpf') return V('partly', 'a band-pass leaves a nasal band and thins the low end');
            if (c > 4000) return V('partly', 'the cutoff is so high the low-pass barely touches the harmonics: bright for a bass');
            if (c < 120) return V('partly', 'the cutoff is below the bass\'s own harmonics: only the fundamental gets through');
            if (s.res > 70) return V('partly', 'a ringing peak at the cutoff; the 2024 report wanted resonance\'s impact on the sound, and here it whistles');
            return V('good', `a low-pass at ${fmtHz(c)}: the top removed, the weight kept${s.envAmt > 0 ? ', the envelope opening it on each note' : ''}`);
        }
        if (part === 'pad') {
            if (s.filter === 'hpf') return V('partly', 'a high-pass thins a pad; it can sit under a vocal that way, but it loses its warmth');
            if (s.filter === 'bpf') return V('partly', 'a band-pass makes a pad nasal');
            if (c < 250) return V('partly', 'the cutoff is so low the pad is a murmur');
            if (s.res > 70) return V('partly', 'a ringing peak on a pad draws the ear to the cutoff instead of the chord');
            return V('good', `a low-pass at ${fmtHz(c)}: soft on top, the chord kept`);
        }
        if (part === 'lead') {
            if (s.filter === 'hpf') return V('partly', 'a high-pass on a lead removes its body');
            if (s.res > 80) return V('partly', 'the peak at the cutoff whistles over the melody');
            if (c < 300) return V('partly', 'the cutoff is so low the lead is muffled');
            return V('good', `a ${FILTERS[s.filter].name} at ${fmtHz(c)}: ${c < 1000 ? 'muted, the 2025 scheme\'s word' : 'clear'}`);
        }
        if (s.filter !== 'lpf') return V('partly', `a ${FILTERS[s.filter].name} on a keyboard part: the 2024 scheme marks a low-pass`);
        if (c < 1000) return V('partly', `a low-pass at ${fmtHz(c)} is duller than the bright saws the 2022 scheme credits`);
        return V('good', `a low-pass at ${fmtHz(c)}, high cutoff: "bright timbre with high cutoff on LPF and no/little resonance" (2022)`);
    }
    if (section === 'env') {
        const { attack: a, release: r, sustain: su } = s;
        if (part === 'bass') {
            if (a > 150) return V('poor', `a ${fmtMs(a)} attack: the note swells in after the beat; a bass wants a fast attack (2024 report)`);
            if (r > 1000) return V('poor', `a ${fmtMs(r)} release: each note rings into the next and the line smears`);
            if (a > 30) return V('partly', `a ${fmtMs(a)} attack softens the front of every note`);
            if (r > 400) return V('partly', `a ${fmtMs(r)} release lets notes overlap on the quavers`);
            return V('good', `a fast attack (${fmtMs(a)}) and a short release (${fmtMs(r)}): the 2024 report's most common AO4 credit`);
        }
        if (part === 'pad') {
            if (a < 60) return V('poor', `a ${fmtMs(a)} attack: the chord arrives like a stab; a pad swells in over hundreds of milliseconds`);
            if (r < 150) return V('poor', `a ${fmtMs(r)} release: the chord stops dead; a pad fades`);
            if (su < 50) return V('partly', `sustain at ${su} %: the chord dies away under the hand`);
            if (a < 200) return V('partly', `a ${fmtMs(a)} attack is on the quick side for a pad`);
            if (r < 400) return V('partly', `a ${fmtMs(r)} release is short for a pad`);
            return V('good', `a slow attack (${fmtMs(a)}), full sustain and a long release (${fmtMs(r)}): the shape a pad wants`);
        }
        if (part === 'lead') {
            if (a > 200) return V('poor', `a ${fmtMs(a)} attack: the melody arrives late on every note`);
            if (r > 1500) return V('poor', `a ${fmtMs(r)} release: notes pile up under the melody`);
            if (a > 60) return V('partly', `a ${fmtMs(a)} attack softens the melody`);
            if (r > 500) return V('partly', `a ${fmtMs(r)} release blurs the line`);
            return V('good', `attack ${fmtMs(a)}, release ${fmtMs(r)}: each note speaks and stops`);
        }
        if (a > 80) return V('partly', `a ${fmtMs(a)} attack softens the stabs`);
        if (r > 600) return V('partly', `a ${fmtMs(r)} release lets the stabs overlap`);
        return V('good', `attack ${fmtMs(a)}, release ${fmtMs(r)}: the stabs stay stabs`);
    }
    if (section === 'lfo') {
        if (!lfoOn(s)) return part === 'pad' ? V('partly', 'no LFO: the pad stands still; the 2019 report credited chorus and pulse-width movement') : V('good', 'no LFO: nothing needed');
        const deep = s.lfoDepth > 40;
        if (s.lfoTarget === 'pitch') {
            if (deep) return V('poor', `the pitch swings ${Math.round(lfoSwing(s))} cents: out of tune, not vibrato`);
            if (s.lfoRate > 9) return V('partly', `${fmtRate(s.lfoRate)} is too fast for vibrato: a warble`);
            if (s.lfoRate < 3) return V('partly', `${fmtRate(s.lfoRate)} is too slow for vibrato: a slow drift`);
            return V('good', `vibrato: the pitch moved ${Math.round(lfoSwing(s))} cents either way at ${fmtRate(s.lfoRate)}, a control signal, never heard as a note`);
        }
        if (s.lfoTarget === 'cutoff') {
            if (deep && s.lfoRate > 4) return V('poor', `the cutoff swings ${(lfoSwing(s) / 1200).toFixed(1)} octaves at ${fmtRate(s.lfoRate)}: a growl over the part`);
            if (s.lfoRate > 8) return V('partly', `${fmtRate(s.lfoRate)} on the cutoff is a growl`);
            return V('good', `the cutoff wobbles ${(lfoSwing(s) / 1200).toFixed(1)} octaves at ${fmtRate(s.lfoRate)}: ${part === 'pad' ? 'movement, which a pad wants' : 'the 2025 scheme\'s "subtle Fc wobble"'}`);
        }
        if (deep) return V('poor', `the level drops to ${Math.round((1 - lfoSwing(s)) * 100)} % on every cycle: a stutter`);
        return V(part === 'bass' ? 'partly' : 'good', `tremolo at ${fmtRate(s.lfoRate)}${part === 'bass' ? ': the bass\'s level pumps under the mix' : ''}`);
    }
    // voices
    if (part === 'pad' || part === 'keys') return s.voices === 'mono' ? V('poor', 'monophonic: one note of each chord sounds; the 2022 report found a mono patch "did not play the complete chords"') : V('good', 'polyphonic: every note of the chord sounds');
    if (part === 'lead') return s.voices === 'mono' ? V('good', `monophonic${s.glide !== 'off' ? ` with ${GLIDES[s.glide].said}` : ''}: one note at a time, the 2025 scheme's "without note overlaps"`) : V('partly', 'polyphonic: held notes overlap the next, which the 2025 scheme marks down');
    return s.voices === 'mono' ? V('good', `monophonic${s.glide !== 'off' ? ` with ${GLIDES[s.glide].said}` : ''}: a bass is one note at a time`) : V('partly', 'polyphonic: a bass line is one note at a time, and overlaps blur it');
}
export function judgeAll(state, part = state.part) {
    const out = {};
    for (const id of SECTION_IDS) out[id] = judgeSection(state, id, part);
    return out;
}
export const GRADE_WORD = { good: 'suits', partly: 'partly', poor: 'does not suit' };

// ---- the schemes' checks --------------------------------------------------------------------
// One point per mark the scheme names; ok when every point lands.
export function schemePoints(state) {
    const t = state.task;
    const s = state;
    const P = (id, name, ok, said) => ({ id, name, ok, said });
    if (t === 'as2023') {
        return [
            P('wave', 'square wave', s.wave === 'square', s.wave === 'square' ? 'square waves' : `${WAVES[s.wave].said}, not the square the question sets`),
            P('detune', 'detune, a suitable amount', s.osc2 === 'pair' && s.detune >= 4 && s.detune <= 30, s.osc2 !== 'pair' ? 'the second oscillator is not a detuned pair' : s.detune < 4 ? 'no detune to speak of' : s.detune > 30 ? `${s.detune} cents apart, past detune into out of tune` : `${s.detune} cents apart`),
            P('filter', 'the filter setting', s.filter === 'lpf' && s.cutoff >= 250 && s.cutoff <= 2000, s.filter !== 'lpf' ? `a ${FILTERS[s.filter].name}, not the low-pass of the example` : s.cutoff > 2000 ? `the cutoff at ${fmtHz(s.cutoff)}, brighter than the example` : s.cutoff < 250 ? `the cutoff at ${fmtHz(s.cutoff)}, duller than the example` : `a low-pass at ${fmtHz(s.cutoff)}`),
            P('octave', 'the octave, both oscillators', s.octave === 0 && s.part === 'bass', s.part !== 'bass' ? 'not the bass part' : s.octave > 0 ? 'an octave too high' : s.octave < 0 ? 'an octave too low' : 'the example\'s octave'),
        ];
    }
    if (t === 'as2024') {
        return [
            P('wave', 'two sawtooth oscillators', s.wave === 'saw' && s.osc2 === 'pair', s.wave !== 'saw' ? `${WAVES[s.wave].said}, not saws` : s.osc2 !== 'pair' ? 'one saw, not two' : 'two saws'),
            P('octave', 'the same octave, transposed to the example', s.octave === 0 && s.part === 'keys', s.part !== 'keys' ? 'not the keyboard part' : s.octave === 0 ? 'the example\'s octave' : `an octave ${s.octave > 0 ? 'up' : 'down'}`),
            P('detune', 'slight detune', s.osc2 === 'pair' && s.detune >= 3 && s.detune <= 15, s.osc2 !== 'pair' ? 'the second oscillator is not a detuned pair' : s.detune < 3 ? 'no detune' : s.detune > 15 ? `${s.detune} cents is more than slight` : `${s.detune} cents, slight`),
            P('filter', 'LPF equal or duller', s.filter === 'lpf' && s.cutoff <= 4000, s.filter !== 'lpf' ? `a ${FILTERS[s.filter].name}` : s.cutoff > 4000 ? `the cutoff at ${fmtHz(s.cutoff)}, brighter than the example` : `a low-pass at ${fmtHz(s.cutoff)}`),
        ];
    }
    if (t === 'a2025') {
        return [
            P('wave', 'square (allow saw, pulse, triangle; not sine)', s.wave !== 'sine', s.wave === 'sine' ? 'a sine, which the scheme excludes' : WAVES[s.wave].said),
            P('mono', 'monophonic, no overlaps', s.voices === 'mono', s.voices === 'mono' ? 'monophonic' : 'polyphonic, so notes overlap'),
            P('glide', 'subtle portamento', s.glide === 'subtle', s.glide === 'off' ? 'no portamento' : s.glide === 'long' ? 'a long glide, more than subtle' : 'a subtle portamento'),
            P('env', 'A soft, D max, S max, R short', s.attack >= 15 && s.attack <= 150 && s.sustain >= 90 && s.release <= 150, s.attack < 15 ? 'the attack is instant, not soft' : s.attack > 150 ? 'the attack is slow, past soft' : s.sustain < 90 ? 'the sustain is below max' : s.release > 150 ? `a ${fmtMs(s.release)} release, not short` : 'soft attack, full sustain, short release'),
            P('filter', 'muted, low cutoff, no filter envelope, no resonance', s.filter === 'lpf' && s.cutoff <= 800 && s.envAmt <= 10 && s.res <= 15, s.filter !== 'lpf' ? `a ${FILTERS[s.filter].name}` : s.cutoff > 800 ? `the cutoff at ${fmtHz(s.cutoff)}, not muted` : s.envAmt > 10 ? 'the envelope is opening the filter' : s.res > 15 ? 'resonance is a feature here' : `a low-pass at ${fmtHz(s.cutoff)}, muted`),
            P('lfo', 'a subtle LFO wobble on the cutoff', s.lfoTarget === 'cutoff' && s.lfoDepth >= 5 && s.lfoDepth <= 40 && s.lfoRate >= 1 && s.lfoRate <= 10, !lfoOn(s) ? 'no LFO' : s.lfoTarget !== 'cutoff' ? `the LFO is on ${LFO_TARGETS[s.lfoTarget].said}, not the cutoff` : s.lfoDepth > 40 ? 'the wobble is deep, not subtle' : s.lfoRate > 10 || s.lfoRate < 1 ? `${fmtRate(s.lfoRate)} is not a similar speed` : `a wobble at ${fmtRate(s.lfoRate)}`),
        ];
    }
    if (t === 'fills2023') {
        return [
            P('wave', 'square (allow saw or pulse)', s.wave === 'square' || s.wave === 'saw', s.wave === 'square' || s.wave === 'saw' ? WAVES[s.wave].said : `${WAVES[s.wave].said}, which the scheme does not allow`),
            P('env', 'A = 0, D = max, S = max, R enough to hear', s.attack <= 10 && s.decay >= 1500 && s.sustain >= 90 && s.release >= 150 && s.release <= 600, s.attack > 10 ? `a ${fmtMs(s.attack)} attack, not instant` : s.sustain < 90 ? 'the sustain is below max' : s.decay < 1500 ? 'the decay is short, so the note falls to the sustain early' : s.release < 150 ? 'the release is too short to hear' : s.release > 600 ? 'the release rings past the next fill' : 'instant attack, full sustain, a release you can hear'),
            P('filter', 'a matching LPF, no resonance', s.filter === 'lpf' && s.res <= 10, s.filter !== 'lpf' ? `a ${FILTERS[s.filter].name}` : s.res > 10 ? `resonance at ${s.res} %` : 'a low-pass with no resonance'),
        ];
    }
    return [];
}
// The task's key state: for the gate and the stage.
export function verdict(state) {
    if (!state.task) return { key: 'free', ok: null };
    if (state.task === 'judge') {
        const all = judgeAll(state);
        const poor = SECTION_IDS.filter((id) => all[id].grade === 'poor');
        const partly = SECTION_IDS.filter((id) => all[id].grade === 'partly');
        return { key: poor.length ? `poor-${poor.join('-')}` : partly.length ? `partly-${partly.join('-')}` : 'suits', ok: null, sections: all, poor, partly };
    }
    const points = schemePoints(state);
    const missed = points.filter((p) => !p.ok);
    return { key: missed.length ? `missed-${missed.map((p) => p.id).join('-')}` : 'directed', ok: missed.length === 0, points, missed };
}
