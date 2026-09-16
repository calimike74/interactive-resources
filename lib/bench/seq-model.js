// The Sequence bench (1.5): a sixteen-step sequencer driving a small
// subtractive synth, as a pure model. Everything the stage draws, the
// console reads and the graph plays comes from one state: five lanes of
// sixteen steps (kick, snare, hat, bass, chord), a note per bass step and
// a chord per chord step, the tempo and the swing, the filter's cutoff and
// resonance, the envelope's decay. The papers' own questions about feel,
// the filter and the way a part is entered are the presets; the judge in
// lib/bench/seq-depth.js reads this state and nothing else.
//
// Built 16 Sep 2026 from the sandbox instrument Mike walked
// (Professional (AI)/_sandbox/sequence-bench) after the PHASE/16 brief.

import { coefficients, sectionResponse } from './eq-model.js';

export const STEPS = 16;
export const BPM_MIN = 70;
export const BPM_MAX = 160;
export const SWING_MAX = 60;
export const CUTOFF_MIN = 80;
export const CUTOFF_MAX = 12000;
export const DECAY_MIN = 40;
export const DECAY_MAX = 1200;
export const LOOKAHEAD_MS = 120; // the kit's scheduler books this far ahead

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// ---- the material: A minor ----------------------------------------------------
// The scale table runs A2 to E4 in the estate's note names (C3 is middle C,
// as Logic and the Piano Roll write it). The Bass row sounds an octave below
// the table, A1 to E3, so a bass line sits where a bass sits.
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const noteName = (m) => `${NOTE_NAMES[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 2}`;
export const midiHz = (m) => 440 * 2 ** ((m - 69) / 12);
export const SCALE = [45, 47, 48, 50, 52, 53, 55, 57, 59, 60, 62, 64];
export const BASS_LOW = 12;
export const bassMidi = (i) => SCALE[clamp(i, 0, SCALE.length - 1)] - BASS_LOW;
export const CHORDS = [
    { name: 'Am', notes: [57, 60, 64] },
    { name: 'F', notes: [53, 57, 60] },
    { name: 'C', notes: [55, 60, 64] },
    { name: 'G', notes: [55, 59, 62] },
    { name: 'Dm', notes: [50, 53, 57] },
    { name: 'Em', notes: [52, 55, 59] },
];
export const KEY_SIG = 'A minor';

export const LANE_IDS = ['kick', 'snare', 'hat', 'bass', 'chord'];
export const LANES = {
    kick: { id: 'kick', label: 'Kick', said: 'the kick', colour: 'var(--gen-2)', file: 'kick', drum: true },
    snare: { id: 'snare', label: 'Snare', said: 'the snare', colour: 'var(--gen-7)', file: 'snare', drum: true },
    hat: { id: 'hat', label: 'Hi-hat', said: 'the hi-hat', colour: 'var(--gen-1)', file: 'hat', drum: true },
    bass: { id: 'bass', label: 'Bass', said: 'the bass', colour: 'var(--gold-bright)', drum: false },
    chord: { id: 'chord', label: 'Chord', said: 'the chords', colour: 'var(--gen-3)', drum: false },
};
export const isTunable = (lane) => lane === 'bass' || lane === 'chord';

// ---- the timing ---------------------------------------------------------------
// A sixteenth at the tempo, in milliseconds; swing holds every second
// sixteenth back by up to half a step (60 % swing is 30 % of a step late).
export const stepMs = (tempo) => 15000 / tempo;
export const swingMs = (tempo, swing) => stepMs(tempo) * (swing / 100) * 0.5;
export const stepOffsetMs = (step, tempo, swing) => step * stepMs(tempo) + (step % 2 ? swingMs(tempo, swing) : 0);
export const barMs = (tempo) => stepMs(tempo) * STEPS;

// ---- the filter ---------------------------------------------------------------
// Resonance 0 to 100 becomes the Q the node gets. Web Audio takes a low-pass
// Q in dB (lib/bench/eq-model.js), so 30 % is a 3 dB lift at the corner
// and 100 % an 18 dB peak; the same number feeds the RBJ maths that draws
// the gold curve, so the curve before Play is the curve the voices make.
export const resToQdb = (res) => 0.5 + (clamp(res, 0, 100) / 100) ** 1.6 * 17.5;
export const qLinear = (qdb) => 10 ** (qdb / 20);
export function filterCurve(cutoff, res, freqs, sampleRate = 48000) {
    const coef = coefficients({ type: 'lowpass', hz: clamp(cutoff, CUTOFF_MIN, CUTOFF_MAX), q: qLinear(resToQdb(res)) }, sampleRate);
    return freqs.map((hz) => ({ hz, db: sectionResponse(coef, hz, sampleRate).db }));
}
export const fmtHz = (hz) => (hz >= 1000 ? `${(hz / 1000).toFixed(hz < 10000 ? 1 : 0)} kHz` : `${Math.round(hz)} Hz`);

// ---- state --------------------------------------------------------------------
const row = (bits) => bits.map(Boolean);
const empty = () => new Array(STEPS).fill(false);
const zeros = () => new Array(STEPS).fill(0);
const nulls = () => new Array(STEPS).fill(null);

export const DEFAULT_STATE = Object.freeze({
    tempo: 112,
    swing: 0,
    cutoff: 1400,
    res: 30,
    decay: 320,
    level: 0.8,
    lanes: { kick: empty(), snare: empty(), hat: empty(), bass: empty(), chord: empty() },
    bassNote: zeros(),   // index into SCALE
    chordIdx: zeros(),   // index into CHORDS
    bassHow: nulls(),    // how the note got there: 'step' (on the grid) or 'played' (from the keys)
    sweep: null,         // { from, to, bars }: the Filter sweep preset's automation
    record: false,
    presetId: null,
    task: null,
});

// ---- the papers' questions, as presets ----------------------------------------
export const TASKS = {
    feel: { id: 'feel', label: 'the feel', control: 'Swing', years: '2025' },
    filter: { id: 'filter', label: 'the filter', control: 'Cutoff', years: '2024' },
    input: { id: 'input', label: 'the way in', control: 'Record', years: 'the spec' },
};

const SIXTEENTH_HATS = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
export const PRESETS = [
    {
        id: 'bass', name: 'Bass and chords', task: null,
        blurb: 'A bass line and two chords over a four-to-the-floor kick: the pattern, the filter at 1.4 kHz',
        tempo: 112, swing: 0, cutoff: 1400, res: 30, decay: 320,
        kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1],
        snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        hat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
        bass: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
        bassNote: [0, 0, 0, 0, 0, 0, 7, 0, 5, 0, 0, 5, 0, 0, 6, 0],
        chord: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
        chordIdx: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    },
    {
        id: 'swing', name: 'Hats and swing', task: 'feel',
        blurb: 'Sixteenth hats with swing quantise at 45 %: the 2025 comparison, the loose side',
        tempo: 124, swing: 45, cutoff: 2600, res: 20, decay: 180,
        kick: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0],
        snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        hat: SIXTEENTH_HATS,
        bass: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
        bassNote: [0, 0, 0, 0, 7, 0, 7, 0, 0, 0, 0, 0, 2, 0, 2, 0],
        chord: empty().map(() => 0),
        chordIdx: zeros().map(() => 2),
    },
    {
        id: 'sweep', name: 'Filter sweep', task: 'filter',
        blurb: 'The cutoff climbs from 260 Hz to 6 kHz over four bars with the resonance up: the harmonics arrive in order',
        tempo: 100, swing: 0, cutoff: 260, res: 78, decay: 420,
        kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
        snare: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
        hat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
        bass: [1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1],
        bassNote: [0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 3, 3, 0, 3, 3],
        chord: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
        chordIdx: [0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0],
        sweep: { from: 260, to: 6000, bars: 4 },
    },
    {
        id: 'played', name: 'Played in', task: 'input',
        blurb: 'A bass line a keyboard player put in live, quantised to the sixteenth as it went: real-time input',
        tempo: 108, swing: 0, cutoff: 1800, res: 24, decay: 260,
        kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
        snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        hat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
        bass: [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1],
        bassNote: [0, 0, 0, 2, 0, 3, 0, 0, 0, 0, 0, 7, 0, 0, 5, 4],
        bassHow: ['played', null, null, 'played', null, 'played', null, null, 'played', null, null, 'played', null, null, 'played', 'played'],
        chord: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        chordIdx: zeros(),
    },
    {
        id: 'straight', name: 'Judge: straight', task: 'feel',
        blurb: 'The same sixteenth hats hard quantised, swing at 0: the 2025 comparison, the tight side',
        tempo: 124, swing: 0, cutoff: 2600, res: 20, decay: 180,
        kick: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0],
        snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        hat: SIXTEENTH_HATS,
        bass: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
        bassNote: [0, 0, 0, 0, 7, 0, 7, 0, 0, 0, 0, 0, 2, 0, 2, 0],
        chord: zeros(),
        chordIdx: zeros().map(() => 2),
    },
];
export const presetOf = (id) => PRESETS.find((p) => p.id === id) || null;

export function applyPreset(state, id) {
    const p = presetOf(id);
    if (!p) return state;
    return {
        ...state,
        tempo: p.tempo, swing: p.swing, cutoff: p.cutoff, res: p.res, decay: p.decay,
        lanes: { kick: row(p.kick), snare: row(p.snare), hat: row(p.hat), bass: row(p.bass), chord: row(p.chord) },
        bassNote: p.bassNote.slice(),
        chordIdx: p.chordIdx.slice(),
        bassHow: p.bassHow ? p.bassHow.slice() : p.bass.map((on) => (on ? 'step' : null)),
        sweep: p.sweep ? { ...p.sweep } : null,
        presetId: p.id,
        task: p.task,
    };
}

export function clearPattern(state) {
    return {
        ...state,
        lanes: { kick: empty(), snare: empty(), hat: empty(), bass: empty(), chord: empty() },
        bassNote: zeros(), chordIdx: zeros(), bassHow: nulls(),
        sweep: null, presetId: null, task: null,
    };
}

// ---- edits --------------------------------------------------------------------
const withLane = (state, lane, cells) => ({ ...state, lanes: { ...state.lanes, [lane]: cells } });
const touched = (state) => ({ ...state, presetId: state.presetId, sweep: state.sweep });

export function setStep(state, lane, s, on) {
    if (!LANE_IDS.includes(lane) || s < 0 || s >= STEPS) return state;
    if (state.lanes[lane][s] === on) return state;
    const cells = state.lanes[lane].slice();
    cells[s] = on;
    let next = withLane(state, lane, cells);
    if (lane === 'bass') { const how = state.bassHow.slice(); how[s] = on ? 'step' : null; next = { ...next, bassHow: how }; }
    return touched(next);
}
export const toggleStep = (state, lane, s) => setStep(state, lane, s, !state.lanes[lane][s]);

// Drag up or down on a Bass or Chord step: the note moves through the
// scale, the chord through the six; the step lights if it was dark.
export function nudgeNote(state, lane, s, delta) {
    if (!isTunable(lane) || !delta) return state;
    if (lane === 'bass') {
        const notes = state.bassNote.slice();
        notes[s] = clamp(notes[s] + delta, 0, SCALE.length - 1);
        return setStep({ ...state, bassNote: notes }, 'bass', s, true);
    }
    const idx = state.chordIdx.slice();
    idx[s] = clamp(idx[s] + delta, 0, CHORDS.length - 1);
    return setStep({ ...state, chordIdx: idx }, 'chord', s, true);
}
export function setBassNote(state, s, i) {
    const notes = state.bassNote.slice();
    notes[s] = clamp(i, 0, SCALE.length - 1);
    return setStep({ ...state, bassNote: notes }, 'bass', s, true);
}

// The nearest note of the scale to a played key, in the Bass row's octave:
// a key two octaves up folds down to its own pitch class.
export function nearestScaleIndex(midi) {
    let best = 0;
    let bestD = Infinity;
    SCALE.forEach((n, i) => {
        const b = n - BASS_LOW;
        // the same pitch class an octave or two up folds down; the fewer
        // octaves, the better, so E2 played is E2 in the row, not E1
        const d = Math.min(...[-1, 0, 1, 2].map((k) => Math.abs(b + 12 * k - midi) + Math.abs(k) * 0.01));
        if (d < bestD) { bestD = d; best = i; }
    });
    return best;
}
// The step a played note lands on: the one sounding, or the next if the
// key came down in the second half of it (quantised to the sixteenth on
// entry, which is what a step sequencer's Record does).
export const quantiseStep = (step, frac) => (frac > 0.5 ? (step + 1) % STEPS : step);
export function recordNote(state, midi, step, frac = 0) {
    if (!state.record) return state;
    const s = quantiseStep(step, frac);
    const notes = state.bassNote.slice();
    notes[s] = nearestScaleIndex(midi);
    const cells = state.lanes.bass.slice();
    cells[s] = true;
    const how = state.bassHow.slice();
    how[s] = 'played';
    return { ...withLane({ ...state, bassNote: notes, bassHow: how }, 'bass', cells) };
}

export const setTempo = (state, v) => ({ ...state, tempo: clamp(Math.round(v), BPM_MIN, BPM_MAX) });
export const setSwing = (state, v) => ({ ...state, swing: clamp(Math.round(v), 0, SWING_MAX) });
export const setCutoff = (state, v) => ({ ...state, cutoff: clamp(Math.round(v), CUTOFF_MIN, CUTOFF_MAX), sweep: null });
export const setRes = (state, v) => ({ ...state, res: clamp(Math.round(v), 0, 100) });
export const setDecay = (state, v) => ({ ...state, decay: clamp(Math.round(v), DECAY_MIN, DECAY_MAX) });
export const setLevel = (state, v) => ({ ...state, level: clamp(v, 0, 1) });
export const setRecord = (state, on) => ({ ...state, record: Boolean(on) });

// ---- readings -----------------------------------------------------------------
export const count = (cells) => cells.reduce((n, on) => n + (on ? 1 : 0), 0);
export function counts(state) {
    const out = {};
    for (const id of LANE_IDS) out[id] = count(state.lanes[id]);
    out.played = state.bassHow.filter((h, s) => h === 'played' && state.lanes.bass[s]).length;
    out.stepped = out.bass - out.played;
    out.all = LANE_IDS.reduce((n, id) => n + out[id], 0);
    return out;
}
export const bassNames = (state) => state.lanes.bass.map((on, s) => (on ? noteName(bassMidi(state.bassNote[s])) : null)).filter(Boolean);
export const chordNames = (state) => state.lanes.chord.map((on, s) => (on ? CHORDS[state.chordIdx[s]].name : null)).filter(Boolean);
export const cellText = (state, lane, s) => (lane === 'bass' ? noteName(bassMidi(state.bassNote[s])) : lane === 'chord' ? CHORDS[state.chordIdx[s]].name : '');

// What a step sends: the bass note and the chord, for the readout.
export function stepSends(state, s) {
    const parts = [];
    if (state.lanes.bass[s]) parts.push(`bass ${noteName(bassMidi(state.bassNote[s]))}`);
    if (state.lanes.chord[s]) parts.push(`chord ${CHORDS[state.chordIdx[s]].name}`);
    return parts.join(' + ');
}

// The cutoff at a moment of the Filter sweep preset: an exponential climb
// from `from` to `to` across `bars` bars, then back to the start.
export function sweepCutoffAt(sweep, bar, frac) {
    if (!sweep) return null;
    const phase = ((bar % sweep.bars) + clamp(frac, 0, 1)) / sweep.bars;
    return sweep.from * (sweep.to / sweep.from) ** phase;
}

// The task's verdict: the key names the state the paper's question is
// about. No fault to fix on this bench; both sides of the 2025 comparison
// are answers, so `ok` is null unless a preset sets a target.
export function verdict(state) {
    if (!state.task) return { key: 'free', ok: null };
    if (state.task === 'feel') {
        if (state.swing === 0) return { key: 'straight', ok: null };
        if (state.swing < 25) return { key: 'gentle', ok: null };
        return { key: 'swung', ok: null };
    }
    if (state.task === 'filter') {
        if (state.sweep) return { key: 'sweep', ok: null };
        if (state.cutoff < 500) return { key: 'closed', ok: null };
        if (state.cutoff > 3000) return { key: 'open', ok: null };
        return { key: 'partway', ok: null };
    }
    const c = counts(state);
    if (!c.bass) return { key: 'empty', ok: null };
    return { key: c.played ? 'played' : 'stepped', ok: null };
}

export function readings(state) {
    const c = counts(state);
    return {
        counts: c,
        stepMs: stepMs(state.tempo),
        swingMs: swingMs(state.tempo, state.swing),
        barMs: barMs(state.tempo),
        qdb: resToQdb(state.res),
        verdict: verdict(state),
        bassNames: bassNames(state),
        chordNames: chordNames(state),
    };
}

// A tag for the DOM: every lit step and its note, so check-bench can see
// the pattern change when a cell is clicked.
export function patternTag(state) {
    return LANE_IDS.map((id) => `${id}:${state.lanes[id].map((on, s) => (on ? (id === 'bass' ? state.bassNote[s] : id === 'chord' ? state.chordIdx[s] : 1) : '.')).join('')}`).join('|');
}
