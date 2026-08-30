// The Piano Roll (1.5): the model behind the MIDI file on the bench.
//
// Four bars of one part play from a list of notes, the way a DAW plays a
// MIDI clip: every note has a recorded position, a length, a note number
// and a velocity. Everything here is pure arithmetic over that list: where
// each note lands once quantised, what the list editor shows (position in
// bar, beat, division and tick; velocity in decimal and in binary), what
// goes out on the wire (status and data bytes, the pitch bend's two data
// bytes), and the checks the papers make (the smallest note value, the
// wrong drum sounds, the bend range, the drawn bar). No audio node in this
// file; PianoRoll.jsx plays it.
//
// Times are kept in beats from the start of the loop (0 to 16). Ticks are
// Logic's 960 to a quarter, so a position reads the way the 2021 paper
// prints it: bar, beat, division (a sixteenth), tick (0 to 239).

export const BPM = 96;
export const BARS = 4;
export const BEATS = 16;
export const PPQ = 960;
export const TICKS_PER_DIV = PPQ / 4;

export const PART_IDS = ['drums', 'bass'];
export const PARTS = {
    drums: { label: 'Drums', short: 'Drums', said: 'the drums', poss: "the drums'", channel: 10, track: 'Drums', instrument: 'Drum kit', colour: 'var(--gen-2)' },
    bass: { label: 'Bass', short: 'Bass', said: 'the bass', poss: "the bass's", channel: 1, track: 'Synth bass', instrument: 'Square-wave synth', colour: 'var(--gen-1)' },
};

export const KIT_IDS = ['acoustic', 'electronic'];
export const KITS = {
    acoustic: { label: 'Acoustic', said: 'an acoustic kit', paper: 'Using an acoustic drum kit' },
    electronic: { label: 'Electronic', said: 'a drum machine', paper: 'Using an electronic drum kit' },
};

// The eight sounds the papers ask for, on the General MIDI notes a DAW's
// kit puts them on. The map (note → sound) is the thing the papers'
// "assigned to the incorrect sounds" task scrambles.
export const SOUND_IDS = ['kick', 'snare', 'chat', 'ohat', 'ride', 'crash', 'htom', 'ltom'];
export const SOUNDS = {
    kick: { label: 'Kick', short: 'Kick', said: 'the kick drum', note: 36 },
    snare: { label: 'Snare', short: 'Snare', said: 'the snare', note: 38 },
    chat: { label: 'Closed hat', short: 'Cl hat', said: 'the closed hi-hat', note: 42 },
    ohat: { label: 'Open hat', short: 'Op hat', said: 'the open hi-hat', note: 46 },
    ride: { label: 'Ride', short: 'Ride', said: 'the ride', note: 51 },
    crash: { label: 'Crash', short: 'Crash', said: 'the crash', note: 49 },
    htom: { label: 'High tom', short: 'Hi tom', said: 'the high tom', note: 48 },
    ltom: { label: 'Low tom', short: 'Lo tom', said: 'the low tom', note: 45 },
};
export const GM_MAP = Object.fromEntries(SOUND_IDS.map((id) => [SOUNDS[id].note, id]));
export const DRUM_NOTES = SOUND_IDS.map((id) => SOUNDS[id].note).sort((a, b) => a - b);
export const BASS_RANGE = [31, 47]; // G0 to B1 on the roll: the line with room to drag

export const GRID_IDS = ['off', '8', '16', '12', '32'];
export const GRIDS = {
    off: { label: 'Off', beats: null, said: 'no grid', short: 'notes stay where they were played' },
    8: { label: '1/8', beats: 0.5, said: 'eighths', short: 'two to the beat' },
    16: { label: '1/16', beats: 0.25, said: 'sixteenths', short: 'four to the beat' },
    12: { label: '1/12', beats: 1 / 3, said: 'eighth-note triplets', short: 'three to the beat' },
    32: { label: '1/32', beats: 0.125, said: 'thirty-seconds', short: 'eight to the beat' },
};
export const RANGE_IDS = [2, 7, 12, 24];
export const RANGES = {
    2: { label: '2', said: 'a tone', word: '2 semitones' },
    7: { label: '7', said: 'a fifth', word: '7 semitones' },
    12: { label: '12', said: 'an octave', word: '12 semitones' },
    24: { label: '24', said: 'two octaves', word: '24 semitones' },
};
export const BEND_MIN = -8192;
export const BEND_MAX = 8191;
export const BEND_CENTRE = 8192; // in the 0 to 16383 display

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const clamp01 = (v) => clamp(v, 0, 1);
const TOL = 1 / 64; // a beat's 64th: closer than that is "on" the grid

// ---- time -------------------------------------------------------------------
export function ticksOf(t) { return Math.round(clamp(t, 0, BEATS) * PPQ); }
export function positionOf(t) {
    const ticks = ticksOf(t);
    const bar = Math.floor(ticks / (PPQ * 4)) + 1;
    const beat = Math.floor((ticks % (PPQ * 4)) / PPQ) + 1;
    const div = Math.floor((ticks % PPQ) / TICKS_PER_DIV) + 1;
    const tick = ticks % TICKS_PER_DIV;
    return { bar, beat, div, tick };
}
export function fmtPos(t) {
    const p = positionOf(t);
    return `${p.bar} ${p.beat} ${p.div} ${p.tick}`;
}
export const barOf = (t) => Math.floor(t / 4) + 1;
export function fmtBeat(t) {
    const bar = barOf(t);
    const beat = t - (bar - 1) * 4;
    if (Math.abs(beat) < 0.01) return `bar ${Math.min(bar, BARS + 1)}`;
    const b = Math.floor(beat) + 1;
    const frac = beat - Math.floor(beat);
    return `bar ${bar} beat ${frac < 0.01 ? b : (b + frac).toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}`;
}

// ---- notes and numbers ------------------------------------------------------
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export function noteName(n) { return `${NAMES[((n % 12) + 12) % 12]}${Math.floor(n / 12) - 2}`; }
export function toBinary(v, bits = 7) { return clamp(Math.round(v), 0, 2 ** bits - 1).toString(2).padStart(bits, '0'); }
export const velWord = (v) => (v >= 112 ? 'an accent' : v >= 90 ? 'full' : v >= 70 ? 'medium' : v >= 45 ? 'soft' : 'a ghost note');

// ---- the wire ----------------------------------------------------------------
// A status byte starts with 1, a data byte with 0: that is why a data value
// stops at 127 (7 bits, 128 values), and why the pitch bend needs two.
export const bits8 = (b) => b.toString(2).padStart(8, '0');
export const hex2 = (b) => b.toString(16).toUpperCase().padStart(2, '0');
export function noteOnBytes(channel, note, vel) { return [0x90 | (channel - 1), note & 0x7f, vel & 0x7f]; }
export function noteOffBytes(channel, note) { return [0x80 | (channel - 1), note & 0x7f, 64]; }
export function bendBytes(channel, value) {
    const v14 = clamp(Math.round(value), BEND_MIN, BEND_MAX) + BEND_CENTRE;
    return [0xe0 | (channel - 1), v14 & 0x7f, (v14 >> 7) & 0x7f];
}
export function bendFromBytes(lsb, msb) { return ((msb & 0x7f) << 7 | (lsb & 0x7f)) - BEND_CENTRE; }
export const bendUnsigned = (value) => clamp(Math.round(value), BEND_MIN, BEND_MAX) + BEND_CENTRE;

// ---- quantise ----------------------------------------------------------------
export function snapTo(t, beats) { return beats ? Math.round(t / beats) * beats : t; }
export function placedTime(t, grid, strength) {
    const g = GRIDS[grid]?.beats;
    if (!g || !strength) return t;
    return clamp(t + (snapTo(t, g) - t) * (strength / 100), 0, BEATS - 1e-6);
}
// Every note of a part with its `at`: where the engine plays it.
export function placed(state, part = state.part) {
    return state.notes[part].map((n) => ({ ...n, at: placedTime(n.t, state.grid, state.strength) }));
}
const onGrid = (t, beats) => Math.abs(t - snapTo(t, beats)) < TOL;
// The smallest note value present: the coarsest grid every onset sits on.
// The paper's "most appropriate quantise value" (2021, 2022, 2023).
export function smallestValue(notes) {
    for (const id of ['8', '16', '12', '32']) if (notes.every((n) => onGrid(n.t, GRIDS[id].beats))) return id;
    return null;
}
// Bars where the notes sit on the triplet grid and not the sixteenth grid
// (2020 Q1(b): "a bar where quantising to 1/16 would incorrectly change the rhythm").
export function tripletBars(notes) {
    const bars = new Set();
    for (const n of notes) if (!onGrid(n.t, 0.25) && onGrid(n.t, 1 / 3)) bars.add(barOf(n.t));
    return [...bars].sort((a, b) => a - b);
}
// Notes the current quantise moves onto a step another note of the same
// lane already holds: the rhythm changed.
export function stacked(state, part = state.part) {
    const ps = placed(state, part);
    const seen = new Map();
    let count = 0;
    for (const n of ps) {
        const key = `${n.note}:${Math.round(n.at * 64)}`;
        if (seen.has(key)) count += 1; else seen.set(key, n.id);
    }
    return count;
}
// Notes the current quantise moves off where they were played (by more
// than a 64th): the rhythm changed, whether or not two now share a step.
export function displaced(state, part = state.part, bar = null) {
    let count = 0;
    for (const n of placed(state, part)) if ((bar == null || barOf(n.t) === bar) && Math.abs(n.at - n.t) > TOL) count += 1;
    return count;
}
// How far the played notes sit from the sixteenth grid, in ms: the feel.
export const beatMs = (beats) => Math.round(beats * (60 / BPM) * 1000);
export function looseness(notes) {
    if (!notes.length) return 0;
    let acc = 0;
    for (const n of notes) acc += Math.abs(n.t - snapTo(n.t, 0.25));
    return beatMs(acc / notes.length);
}
export function feelWord(state) {
    const part = state.part;
    const notes = placed(state, part);
    const off = looseness(notes.map((n) => ({ t: n.at })));
    const raw = looseness(state.notes[part]);
    if (raw < 3) return { key: 'hard', word: 'hard quantised', feel: 'mechanical, tight, exactly in time' };
    if (state.grid === 'off' || state.strength === 0) return { key: 'loose', word: 'unquantised', feel: 'loose, live, a human feel' };
    if (state.strength >= 100) return { key: 'hard', word: `hard quantised to ${GRIDS[state.grid].label}`, feel: 'mechanical, tight, exactly in time' };
    return { key: 'percent', word: `${state.strength}% quantise`, feel: off > 6 ? 'tightened, some of the feel kept' : 'nearly on the grid' };
}

// ---- the drum map --------------------------------------------------------------
export function mapFaults(state) {
    const out = [];
    for (const note of DRUM_NOTES) {
        const has = state.map[note];
        const want = GM_MAP[note];
        if (has !== want) out.push({ note, has, want });
    }
    return out;
}
export function assign(state, note, sound) {
    if (!SOUNDS[sound] || state.map[note] === sound) return state;
    return { ...state, map: { ...state.map, [note]: sound } };
}

// ---- the bend lane -----------------------------------------------------------
// Points (t, v) with v in −8192 to 8191, straight lines between, held before
// the first and after the last. The data are the file's; the range is the
// synth's, which is the topic's own lesson.
export function bendAt(bends, t) {
    if (!bends.length) return 0;
    if (t <= bends[0].t) return bends[0].v;
    for (let i = 0; i < bends.length - 1; i += 1) {
        const a = bends[i]; const b = bends[i + 1];
        if (t >= a.t && t <= b.t) { const span = b.t - a.t; return span < 1e-9 ? b.v : a.v + ((b.v - a.v) * (t - a.t)) / span; }
    }
    return bends[bends.length - 1].v;
}
export const bendSemitones = (v, range) => (v / 8192) * range;
export function bendExtent(bends) {
    let lo = 0; let hi = 0;
    for (const p of bends) { lo = Math.min(lo, p.v); hi = Math.max(hi, p.v); }
    return { lo, hi };
}
export function intervalWord(semis) {
    const s = Math.abs(semis);
    if (s < 0.5) return 'nothing';
    if (s < 1.5) return 'a semitone';
    if (s < 2.5) return 'a tone';
    if (s < 4.5) return 'a third';
    if (s < 6) return 'a fourth';
    if (s < 8.5) return 'a fifth';
    if (s < 13) return 'an octave';
    if (s < 20) return 'over an octave';
    return 'two octaves';
}

// ---- the list editor --------------------------------------------------------
// The messages a DAW lists for the part: the notes as Note On rows, and the
// other messages present (the 2019 scheme's list: tempo, time signature,
// key, track name, instrument name, pitch bend, end of track).
export function eventList(state, part = state.part) {
    const p = PARTS[part];
    const rows = [
        { t: 0, kind: 'meta', name: 'Tempo', value: `${BPM} bpm` },
        { t: 0, kind: 'meta', name: 'Time signature', value: '4/4' },
        { t: 0, kind: 'meta', name: 'Key', value: 'A minor' },
        { t: 0, kind: 'meta', name: 'Track name', value: p.track },
        { t: 0, kind: 'meta', name: 'Instrument name', value: p.instrument },
    ];
    for (const n of placed(state, part)) rows.push({ t: n.at, kind: 'on', id: n.id, note: n.note, vel: n.vel, len: n.len, channel: p.channel });
    if (part === 'bass') for (const b of state.bends) rows.push({ t: b.t, kind: 'bend', value: b.v, channel: p.channel });
    rows.push({ t: BEATS, kind: 'meta', name: 'End of track', value: '' });
    return rows.sort((a, b) => (a.t - b.t) || (a.kind === 'meta' ? -1 : 1) || ((a.note || 0) - (b.note || 0)));
}
export function otherMessages(state, part = state.part) {
    const names = ['Tempo', 'Time signature', 'Key', 'Track name', 'Instrument name'];
    if (part === 'bass' && state.bends.length) names.push('Pitch bend');
    names.push('End of track');
    return names;
}

// ---- velocities ------------------------------------------------------------
export function velocityTable(notes, bar) {
    const inBar = notes.filter((n) => barOf(n.at ?? n.t) === bar);
    if (!inBar.length) return null;
    let hi = inBar[0]; let lo = inBar[0];
    for (const n of inBar) { if (n.vel > hi.vel) hi = n; if (n.vel < lo.vel) lo = n; }
    return { bar, hi, lo, count: inBar.length, distinct: new Set(inBar.map((n) => n.vel)).size };
}

// ---- the papers' MIDI files ----------------------------------------------------
// Each file is four bars. Times in beats, lengths in beats, velocities
// chosen so the table the papers ask for has an accent and a ghost note
// in bar 2 (2024 Q1(a)(i): "expression, accents, ghost hits").
let nextId = 1;
const N = (t, note, vel, len = 0.25) => ({ id: nextId++, t, note, vel, len });
const K = SOUNDS.kick.note; const S = SOUNDS.snare.note; const CH = SOUNDS.chat.note; const OH = SOUNDS.ohat.note;
const RD = SOUNDS.ride.note; const CR = SOUNDS.crash.note; const HT = SOUNDS.htom.note; const LT = SOUNDS.ltom.note;

function rockDrums() {
    const out = [];
    for (let b = 0; b < 4; b += 1) {
        const o = b * 4;
        out.push(N(o, K, 112), N(o + 2, K, 112));
        if (b % 2 === 1) out.push(N(o + 3.5, K, 100));
        out.push(N(o + 1, S, 100), N(o + 3, S, 104));
        const cym = b < 2 ? CH : RD;
        const last = b % 2 === 1 ? 3 : 4; // the fill takes beat 4 of bars 2 and 4
        for (let e = 0; e < last * 2; e += 1) out.push(N(o + e / 2, cym, e % 2 === 0 ? (b < 2 ? 88 : 84) : (b < 2 ? 62 : 70), b < 2 ? 0.125 : 0.25));
        if (b % 2 === 1) out.push(N(o + 3, HT, 96), N(o + 3.25, HT, 98), N(o + 3.5, LT, 104), N(o + 3.75, LT, 108));
    }
    out.push(N(0, CR, 118, 1), N(8, CR, 118, 1));
    out.push(N(7.5 - 4, OH, 76, 0.5)); // bar 1 beat 4.5, the open hat before the turn
    return out;
}
function rollDrums() {
    const base = rockDrums().filter((n) => !(n.note === CH && n.t >= 6 && n.t < 8) && !(n.note === RD && n.t >= 14 && n.t < 16));
    for (const o of [6, 14]) {
        const cym = o < 8 ? CH : RD;
        for (let i = 0; i < 16; i += 1) base.push(N(o + i * 0.125, cym, 52 + Math.round((i / 15) * 48), 0.125));
    }
    return base;
}
// A take played by hand: every hit a little off the grid, the velocities
// breathing. Deterministic, so the picture is the same every visit.
function playedDrums() {
    let seed = 20260830;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    return rockDrums().map((n) => {
        const off = (rnd() * 2 - 1) * 0.045; // up to 28 ms at 96 bpm
        const vel = clamp(Math.round(n.vel + (rnd() * 2 - 1) * 9), 1, 127);
        return { ...n, t: clamp(n.t + off, 0, BEATS - 0.05), vel };
    });
}
const A1 = 33; const C2 = 36; const D2 = 38; const E2 = 40; const F2 = 41; const G2 = 43; const A2 = 45;
function bassLine() {
    const out = [];
    // bar 1
    out.push(N(0, A1, 108, 0.4), N(0.5, A1, 92, 0.4), N(1, A1, 104, 0.4), N(1.5, A1, 90, 0.4), N(2, E2, 112, 0.4), N(2.5, E2, 94, 0.4), N(3, G2, 106, 0.4), N(3.5, A2, 96, 0.4));
    // bar 2: the bar the paper asks you to draw
    out.push(N(4, A1, 108, 0.4), N(4.5, A1, 92, 0.4), N(5, C2, 104, 0.4), N(5.5, D2, 90, 0.4), N(6, E2, 112, 0.4), N(6.5, E2, 94, 0.4), N(7, D2, 100, 0.4), N(7.5, C2, 96, 0.4));
    // bar 3
    out.push(N(8, F2, 110, 0.4), N(8.5, F2, 92, 0.4), N(9, F2, 104, 0.4), N(9.5, F2, 90, 0.4), N(10, G2, 112, 0.4), N(10.5, G2, 94, 0.4), N(11, G2, 106, 0.4), N(11.5, G2, 96, 0.4));
    // bar 4: one long note the bend falls on
    out.push(N(12, A2, 118, 3.9));
    return out;
}
// The 2020 trap: a line in quarters with one bar in eighth-note triplets,
// so 1/12 holds every note and 1/16 breaks the one bar.
function tripletBass() {
    const out = [];
    [[0, A1], [1, A1], [2, E2], [3, G2], [8, F2], [9, F2], [10, G2], [11, G2]].forEach(([t, note], i) => out.push(N(t, note, i % 2 === 0 ? 108 : 96, 0.8)));
    const bar2 = [[4, A1], [4 + 1 / 3, A1], [4 + 2 / 3, A1], [5, C2], [5 + 1 / 3, C2], [5 + 2 / 3, C2], [6, E2], [6 + 1 / 3, E2], [6 + 2 / 3, E2], [7, D2], [7 + 1 / 3, D2], [7 + 2 / 3, C2]];
    bar2.forEach(([t, note], i) => out.push(N(t, note, i % 3 === 0 ? 108 : 90, 0.28)));
    out.push(N(12, A2, 118, 3.9));
    return out;
}
export const BEND_LANE = [{ t: 0, v: 0 }, { t: 13, v: 0 }, { t: 15, v: BEND_MIN }, { t: 15.9, v: 0 }];

// ---- the papers' tasks ------------------------------------------------------
// Sources: the 9MT0/04 (from 2022, 9MT0/41) question papers and mark
// schemes as extracted from the vault's exam PDFs, 2019 to 2026.
export const TASKS = {
    velocity: {
        id: 'velocity', name: 'Velocity table', part: 'drums',
        stem: 'Complete the table below to give the velocity in decimal and in binary of the highest and lowest velocity values in bar 2.',
        scheme: 'one mark for each value in decimal, one in binary; "Allow preceding 0s"',
        source: '2025 Q2(a); the same table every year since 2019',
    },
    map: {
        id: 'map', name: 'Wrong sounds', part: 'drums',
        stem: 'The notes in the MIDI file have been assigned to the incorrect sounds. Using an acoustic drum kit, assign the notes to the sounds listed to form a rock style drum part. You should not change the rhythm.',
        scheme: '1 mark for each correctly assigned drum sound that plays the correct rhythm, in sync throughout; the crash more crash-like than the ride',
        source: '2019 Q2(c); the same task in 2021, 2024 and 2025',
    },
    quantise: {
        id: 'quantise', name: 'Hi-hat roll', part: 'drums',
        stem: 'Identify the most appropriate quantise value for the drum part.',
        scheme: 'the smallest note value present',
        source: '2023 Q1(a), 1/16; 2022 Q1(b), 1/64 in the hi-hats; 2021 Q1(a)',
        answer: '32',
    },
    feel: {
        id: 'feel', name: 'Played', part: 'drums',
        stem: 'Compare the quantise used on the drums with the quantise used on the synth.',
        scheme: 'unquantised, groove, swing, percent, humanise (loose, live, human, realistic) against hard quantised 1/16 or 1/8 (mechanical, tight, in time)',
        source: '2025 Q3(d)',
    },
    triplets: {
        id: 'triplets', name: 'Triplet trap', part: 'bass',
        stem: 'Identify a bar where quantising to 1/16 would incorrectly change the rhythm.',
        scheme: 'the bar in triplets; 1/12 is the grid that holds it',
        source: '2020 Q1(b); 2021 Q1(a) offers 1/12 among the values',
        bar: 2,
    },
    bend: {
        id: 'bend', name: 'Bend range', part: 'bass',
        stem: 'Match the pitch bend range with the example.',
        scheme: 'pitch bend range is 12 semitones (1); a bend that changes the pitch in some small way, i.e. 2 semitones, is 1 of 3',
        source: '2023 Q2(d)(iii) and 2022 Q4; 2020 Q2(b)(iii) sets 7 semitones; 2026 Q2(b), one octave',
        range: 12,
    },
    draw: {
        id: 'draw', name: 'Draw the part', part: 'bass',
        stem: 'Draw the bass part for bar 2 on the piano roll editor. Bar 1 has been completed for you.',
        scheme: 'pitches and rhythm marked separately',
        source: '2021 Q1(c)(ii); the same task in 2019, 2020, 2023 and 2025',
        bar: 2,
    },
};
export const TASK_IDS = Object.keys(TASKS);

// A scrambled map, as the papers hand it over: every listed sound on
// another sound's lane.
const WRONG_MAP = { 36: 'crash', 38: 'ride', 42: 'kick', 45: 'ohat', 46: 'ltom', 48: 'htom', 49: 'chat', 51: 'snare' };

export const PRESETS = [
    { id: 'velocity', name: 'Velocity table', task: 'velocity', blurb: 'The drum file as the papers hand it over: read the highest and lowest velocity in bar 2, in decimal and in binary (every year since 2019)' },
    { id: 'wrong', name: 'Wrong sounds', task: 'map', blurb: 'The same notes, assigned to the wrong sounds: fix the kit without moving a note (2019, 2021, 2024, 2025)' },
    { id: 'roll', name: 'Hi-hat roll', task: 'quantise', blurb: 'A 1/32 roll on the hat in bars 2 and 4: the smallest note value is the quantise value (2022, 2023)' },
    { id: 'played', name: 'Played', task: 'feel', blurb: 'The drums as a drummer played them, every hit a little off the grid: quantise to taste and hear the feel go (2025)' },
    { id: 'triplets', name: 'Triplet trap', task: 'triplets', blurb: 'The bass with bar 2 in eighth-note triplets: the bar a 1/16 quantise would break (2020)' },
    { id: 'bend', name: 'Bend range', task: 'bend', blurb: 'The bass with an octave fall in bar 4 and the synth\'s range left at 2 semitones: the same data, a different sound (2022, 2023)' },
    { id: 'draw', name: 'Draw the part', task: 'draw', blurb: 'Bar 1 of the bass given, bar 2 empty: hold the example and draw it (2019 to 2025)' },
];

function baseState() {
    return {
        part: 'drums',
        kit: 'acoustic',
        notes: { drums: rockDrums(), bass: bassLine() },
        map: { ...GM_MAP },
        grid: 'off',
        strength: 100,
        bendRange: 12,
        bends: BEND_LANE,
        lane: 'velocity',
        selected: null,
        task: null,
        presetId: null,
        level: 0.8,
    };
}

export function applyPreset(state, id) {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return state;
    const task = TASKS[p.task];
    const s = { ...baseState(), level: state.level, part: task.part, task: task.id, presetId: id };
    if (id === 'wrong') s.map = { ...WRONG_MAP };
    if (id === 'roll') s.notes = { ...s.notes, drums: rollDrums() };
    if (id === 'played') { s.notes = { ...s.notes, drums: playedDrums() }; s.grid = '16'; s.strength = 0; }
    if (id === 'triplets') s.notes = { ...s.notes, bass: tripletBass() };
    if (id === 'bend') { s.bendRange = 2; s.lane = 'bend'; }
    if (id === 'draw') s.notes = { ...s.notes, bass: bassLine().filter((n) => barOf(n.t) !== task.bar) };
    const first = s.notes[s.part].slice().sort((a, b) => a.t - b.t || a.note - b.note)[0];
    s.selected = first ? first.id : null;
    return s;
}
// The example the paper plays: what the file should sound like. Hold plays it.
export function referenceOf(state) {
    const ref = state.presetId ? applyPreset(state, state.presetId) : { ...state };
    if (state.presetId === 'wrong') ref.map = { ...GM_MAP };
    if (state.presetId === 'bend') ref.bendRange = TASKS.bend.range;
    if (state.presetId === 'draw') ref.notes = { ...ref.notes, bass: bassLine() };
    if (state.presetId === 'played') { ref.grid = 'off'; ref.strength = 0; }
    ref.kit = state.kit;
    ref.level = state.level;
    return ref;
}
export const DEFAULT_STATE = applyPreset(baseState(), 'velocity');

// ---- edits --------------------------------------------------------------------
export function setPart(state, part) {
    if (!PARTS[part] || part === state.part) return state;
    const first = state.notes[part].slice().sort((a, b) => a.t - b.t || a.note - b.note)[0];
    return { ...state, part, selected: first ? first.id : null, lane: part === 'drums' ? 'velocity' : state.lane, task: null, presetId: null };
}
export function setKit(state, kit) { return KITS[kit] && kit !== state.kit ? { ...state, kit } : state; }
export function setGrid(state, grid) { return GRIDS[grid] && grid !== state.grid ? { ...state, grid } : state; }
export function setStrength(state, strength) { const v = clamp(Math.round(strength), 0, 100); return v === state.strength ? state : { ...state, strength: v }; }
export function setRange(state, range) { return RANGES[range] && range !== state.bendRange ? { ...state, bendRange: range } : state; }
export function setLane(state, lane) { return (lane === 'velocity' || lane === 'bend') && lane !== state.lane ? { ...state, lane } : state; }
export function select(state, id) { return id === state.selected ? state : { ...state, selected: id }; }
export function setLevel(state, level) { return { ...state, level: clamp01(level) }; }
export const noteById = (state, id, part = state.part) => state.notes[part].find((n) => n.id === id) || null;
export const selectedNote = (state) => (state.selected == null ? null : noteById(state, state.selected));

const editNotes = (state, part, fn) => ({ ...state, notes: { ...state.notes, [part]: fn(state.notes[part]) } });
const rowClamp = (part, note) => (part === 'drums' ? (DRUM_NOTES.includes(note) ? note : DRUM_NOTES.reduce((b, n) => (Math.abs(n - note) < Math.abs(b - note) ? n : b), DRUM_NOTES[0])) : clamp(Math.round(note), BASS_RANGE[0], BASS_RANGE[1]));
const dragSnap = (state) => (state.grid === 'off' ? 1 / 32 : GRIDS[state.grid].beats);

// Drag a note: its recorded time snaps to the grid (a 32nd with the grid
// off), its row to a lane of the kit or a key of the bass's range.
export function moveNote(state, id, t, note) {
    const part = state.part;
    const cur = noteById(state, id, part);
    if (!cur) return state;
    const nt = clamp(snapTo(t, dragSnap(state)), 0, BEATS - 0.05);
    const nn = rowClamp(part, note);
    if (Math.abs(nt - cur.t) < 1e-9 && nn === cur.note) return state;
    return { ...editNotes(state, part, (ns) => ns.map((n) => (n.id === id ? { ...n, t: nt, note: nn } : n))), presetId: state.presetId };
}
export function addNote(state, t, note, vel = 100) {
    const part = state.part;
    const nt = clamp(snapTo(t, dragSnap(state)), 0, BEATS - 0.05);
    const nn = rowClamp(part, note);
    const len = part === 'drums' ? 0.25 : 0.4;
    const fresh = N(nt, nn, vel, len);
    const next = editNotes(state, part, (ns) => [...ns, fresh]);
    return { state: { ...next, selected: fresh.id }, id: fresh.id };
}
export function removeNote(state, id) {
    const part = state.part;
    if (!noteById(state, id, part)) return state;
    const next = editNotes(state, part, (ns) => ns.filter((n) => n.id !== id));
    return { ...next, selected: state.selected === id ? null : state.selected };
}
export function setVelocity(state, id, vel) {
    const part = state.part;
    const v = clamp(Math.round(vel), 1, 127);
    const cur = noteById(state, id, part);
    if (!cur || cur.vel === v) return state;
    return editNotes(state, part, (ns) => ns.map((n) => (n.id === id ? { ...n, vel: v } : n)));
}
export function setLength(state, id, len) {
    const part = state.part;
    const l = clamp(Math.round(len * 32) / 32, 1 / 32, 4);
    const cur = noteById(state, id, part);
    if (!cur || Math.abs(cur.len - l) < 1e-9) return state;
    return editNotes(state, part, (ns) => ns.map((n) => (n.id === id ? { ...n, len: l } : n)));
}
export function resetPart(state) {
    if (state.presetId) return { ...applyPreset(state, state.presetId), kit: state.kit };
    return { ...state, notes: { ...state.notes, [state.part]: state.part === 'drums' ? rockDrums() : bassLine() }, map: { ...GM_MAP } };
}
export function clearBar(state, bar) {
    return editNotes(state, state.part, (ns) => ns.filter((n) => barOf(n.t) !== bar));
}

// ---- the drawn bar ---------------------------------------------------------------
export function drawCheck(state) {
    const bar = TASKS.draw.bar;
    const target = bassLine().filter((n) => barOf(n.t) === bar);
    const mine = state.notes.bass.filter((n) => barOf(n.t) === bar);
    const near = (a, b) => Math.abs(a - b) < TOL;
    const onsets = target.filter((t) => mine.some((m) => near(m.t, t.t))).length;
    const pitches = target.filter((t) => mine.some((m) => near(m.t, t.t) && m.note === t.note)).length;
    const extra = mine.filter((m) => !target.some((t) => near(m.t, t.t))).length;
    return { bar, wanted: target.length, drawn: mine.length, onsets, pitches, extra, rhythm: onsets === target.length && extra === 0, pitch: pitches === target.length && extra === 0 };
}

// ---- verdicts ----------------------------------------------------------------------
// One word for the gate and the stage: the task's key state.
export function verdict(state) {
    const task = state.task ? TASKS[state.task] : null;
    if (!task || task.part !== state.part) return { key: 'free', ok: null };
    if (task.id === 'map') { const f = mapFaults(state); return { key: f.length ? 'wrong-sounds' : 'directed', ok: !f.length, faults: f }; }
    if (task.id === 'quantise') { const st = stacked(state); return { key: st ? 'stacked' : 'directed', ok: !st, stacked: st, answer: smallestValue(state.notes.drums) }; }
    if (task.id === 'feel') { const f = feelWord(state); return { key: f.key, ok: null, feel: f }; }
    if (task.id === 'triplets') { const bars = tripletBars(state.notes.bass); const moved = displaced(state, 'bass', task.bar); return { key: moved ? 'broken' : bars.length ? 'triplets' : 'directed', ok: !moved, bars, moved }; }
    if (task.id === 'bend') { const ok = state.bendRange === task.range; return { key: ok ? 'directed' : `range-${state.bendRange}`, ok }; }
    if (task.id === 'draw') { const d = drawCheck(state); return { key: d.rhythm && d.pitch ? 'directed' : d.drawn ? 'drawing' : 'empty', ok: d.rhythm && d.pitch, draw: d }; }
    if (task.id === 'velocity') { const t = velocityTable(placed(state, 'drums'), 2); return { key: t ? 'table' : 'empty', ok: null, table: t }; }
    return { key: 'free', ok: null };
}

// The bench's own readings for the console, from one state.
export function readings(state) {
    const notes = placed(state);
    const sel = selectedNote(state);
    const table = velocityTable(notes, 2);
    return {
        count: notes.length,
        smallest: smallestValue(state.notes[state.part]),
        feel: feelWord(state),
        table,
        sel: sel ? { ...sel, at: placedTime(sel.t, state.grid, state.strength) } : null,
        faults: state.part === 'drums' ? mapFaults(state) : [],
        stacked: stacked(state),
        bend: state.part === 'bass' ? bendExtent(state.bends) : null,
    };
}
