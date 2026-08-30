// The Oscilloscope (2.5): the model behind the trace.
//
// One sound plays and the scope draws it against time in milliseconds, the
// way the written paper prints its figures ("Displacement / Time (ms) 1 2
// 3 4 5"). Everything here is arithmetic over one state: the frequency the
// source is playing at (its own pitch, the octave chip, and the stretch the
// student dragged the period bracket to), the period that frequency gives
// in ms and in s, the note it sits on, the LFO's rate from the tempo, the
// file's size from its channels, rate and depth, and the checks the
// papers' questions make. No audio node in this file; Oscilloscope.jsx
// plays it.
//
// The numeracy is the bench's, never the student's: the period is a length
// on the screen, the octave a halving of it, and the ladder (ms → s → Hz)
// is written out at A-level the way the scheme marks it.

export const DIVS = 5; // the paper's figure: five divisions across

// Three real notes generated on Mike's ElevenLabs account (30 Aug 2026,
// pitch measured by scratchpad scope/qc.py), and the four waveforms the
// paper draws. A real note's pitch is the file's; a waveform's is set.
export const SOURCE_IDS = ['cello', 'bass', 'voice', 'sine', 'square', 'saw', 'triangle'];
export const SOURCES = {
    cello: { label: 'Cello', said: 'a bowed cello note', kind: 'file', file: '/bench-audio/scope/cello.mp3', hz: 173.8, shape: 'a rich, repeating wave: the bow\'s fundamental with its harmonics riding on it', colour: 'var(--gen-1)' },
    bass: { label: 'Bass', said: 'a plucked bass note', kind: 'file', file: '/bench-audio/scope/bass.mp3', hz: 103.8, shape: 'a long, rounded wave with a little ripple: mostly fundamental', colour: 'var(--gen-2)' },
    voice: { label: 'Voice', said: 'a sung vowel', kind: 'file', file: '/bench-audio/scope/voice.mp3', hz: 258, shape: 'a wave with a few bumps a cycle: the vowel\'s formants', colour: 'var(--gen-5)' },
    sine: { label: 'Sine', said: 'a sine wave', kind: 'osc', type: 'sine', hz: 250, shape: 'one smooth curve, no harmonics', colour: 'var(--teal)' },
    square: { label: 'Square', said: 'a square wave', kind: 'osc', type: 'square', hz: 500, shape: 'flat tops and bottoms, vertical edges: odd harmonics', colour: 'var(--gen-3)' },
    saw: { label: 'Saw', said: 'a saw wave', kind: 'osc', type: 'sawtooth', hz: 500, shape: 'a ramp and a drop: every harmonic', colour: 'var(--gen-4)' },
    triangle: { label: 'Triangle', said: 'a triangle wave', kind: 'osc', type: 'triangle', hz: 250, shape: 'straight rises and falls: odd harmonics, falling fast', colour: 'var(--gen-6)' },
};

export const OCTAVE_IDS = ['down', 'as', 'up'];
export const OCTAVES = {
    down: { label: 'Octave down', short: 'Down', factor: 0.5, said: 'an octave lower' },
    as: { label: 'As played', short: 'As played', factor: 1, said: 'as played' },
    up: { label: 'Octave up', short: 'Up', factor: 2, said: 'an octave higher' },
};

export const TIME_BASE_IDS = [1, 2, 5, 10, 50, 100]; // ms per division
export const TIME_BASES = Object.fromEntries(TIME_BASE_IDS.map((ms) => [ms, { label: `${ms} ms`, ms, span: ms * DIVS }]));

export const LEVEL_MIN = -12;
export const LEVEL_MAX = 12;

// The LFO, timed to the tempo the 2020 paper set: 120 bpm, a crotchet
// every half second.
export const BPM = 120;
export const LFO_IDS = ['off', 'crotchet', 'quaver', 'semiquaver'];
export const LFOS = {
    off: { label: 'Off', perBeat: 0, said: 'no LFO' },
    crotchet: { label: 'Crotchet', perBeat: 1, said: 'once a crotchet' },
    quaver: { label: 'Quaver', perBeat: 2, said: 'once a quaver' },
    semiquaver: { label: 'Semiquaver', perBeat: 4, said: 'once a semiquaver' },
};
export const lfoHz = (id) => (LFOS[id].perBeat * BPM) / 60;

// The file: the 2024 paper's base, a 10 MB mono 44.1 kHz 16-bit wav.
export const CHANNEL_IDS = [1, 2];
export const RATE_IDS = [8, 22.05, 44.1, 88.2];
export const DEPTH_IDS = [8, 16, 24];
export const FILE_BASE = { mb: 10, channels: 1, rate: 44.1, depth: 16 };
export function fileMb({ channels, rate, depth }) {
    return (FILE_BASE.mb * channels * rate * depth) / (FILE_BASE.channels * FILE_BASE.rate * FILE_BASE.depth);
}
export function bytesPerSecond({ channels, rate, depth }) { return channels * rate * 1000 * (depth / 8); }
export const fmtMb = (mb) => (Number.isInteger(mb) ? `${mb} MB` : `${mb.toFixed(1)} MB`);

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const clamp01 = (v) => clamp(v, 0, 1);
export const STRETCH_MIN = 0.5;
export const STRETCH_MAX = 2;

// ---- frequency, period, note --------------------------------------------------
export const periodMs = (hz) => 1000 / hz;
export const periodS = (hz) => 1 / hz;
export function fmtHz(hz) { return hz >= 1000 ? `${(hz / 1000).toFixed(hz >= 10000 ? 1 : 2).replace(/\.?0+$/, '')} kHz` : `${hz < 100 ? hz.toFixed(1) : Math.round(hz)} Hz`; }
export function fmtMs(ms) { return ms >= 100 ? `${Math.round(ms)} ms` : ms >= 10 ? `${ms.toFixed(1)} ms` : `${ms.toFixed(2)} ms`; }
export function fmtS(s) { return s >= 0.1 ? `${s.toFixed(2)} s` : `${s.toFixed(4).replace(/0+$/, '')} s`; }
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export function noteOf(hz) {
    const n = 69 + 12 * Math.log2(hz / 440);
    const midi = Math.round(n);
    const cents = Math.round((n - midi) * 100);
    return { midi, name: `${NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`, cents };
}
export function noteWord(hz) {
    const n = noteOf(hz);
    if (Math.abs(n.cents) <= 12) return n.name;
    return `between ${n.cents < 0 ? NAMES[((n.midi - 1) % 12 + 12) % 12] : n.name.replace(/\d+$/, '')} and ${n.cents < 0 ? n.name.replace(/\d+$/, '') : NAMES[((n.midi + 1) % 12) % 12]}`;
}
// The amplitude a level in dB gives, relative to unity, and the word for it.
export const dbToGain = (db) => 10 ** (db / 20);
export function levelWord(db) {
    if (db >= 5.5 && db <= 6.5) return 'twice the height';
    if (db >= 11.5) return 'four times the height';
    if (db <= -5.5 && db >= -6.5) return 'half the height';
    if (db <= -11.5) return 'a quarter of the height';
    if (Math.abs(db) < 0.5) return 'as played';
    return db > 0 ? 'louder' : 'quieter';
}
// How many cycles the screen shows at this time base.
export const cyclesShown = (state) => TIME_BASES[state.timeBase].span / periodMs(frequency(state));

// ---- the papers' questions ----------------------------------------------------
// Sources: the 9MT0/04 and 9MT0/41 question papers and mark schemes as
// extracted from the vault's exam PDFs, 2019 to 2026.
export const TASKS = {
    note: { id: 'note', name: 'A real note', stem: 'Listen to the note. Read its period off the screen, and say the pitch.', scheme: 'the period as a length, the pitch as a note', source: 'the ladder every paper walks (2025 Q3(c), 2026 Q1(d))' },
    period: { id: 'period', name: 'Read the period', stem: 'Identify the waveform. State the period of the wave in ms. State the period of the wave in s. Calculate the frequency of the wave in Hz. Draw the approximate pitch on the keyboard.', scheme: 'a square wave; period 2 ms; 0.002 s; 500 Hz; the pitch from the frequency', source: '2025 Q3(c)(i) to (v)', hz: 500 },
    octave: { id: 'octave', name: '294 Hz, an octave up', stem: 'The frequency of the sample is 294 Hz. Calculate the frequency of a note an octave higher. Show your working.', scheme: '"294 × 2 / 294 + 294 (1); 588 (Hz) (2). Award 2 for 588 with no working."', source: '2019 Q4(c)(ii)', hz: 294, want: 'up' },
    lower: { id: 'lower', name: 'An octave lower', stem: 'The graph shows a square wave with a period of 1 ms. On the graph below, draw a saw wave one octave lower.', scheme: '"Saw wave (1); period of 2 ms (1)"; the 2025 version: "a square wave with the same amplitude as figure 1 and period of 4 ms"', source: '2023 Q2(e)(ii); 2025 Q3(c)(vii)', hz: 1000, want: { source: 'saw', octave: 'down' } },
    kick: { id: 'kick', name: '200 Hz', stem: 'The initial frequency of the kick drum is about 200 Hz. Calculate the period of a 200 Hz wave in seconds. Show your working. State your answer in milliseconds.', scheme: '"1/200 (1); 0.005 / 5 × 10⁻³ (1). Award 2 marks for 0.005 with no working." Then "5 (1)"', source: '2026 Q1(d)', hz: 200 },
    louder: { id: 'louder', name: 'Louder', stem: 'On the graph below, draw the same wave as in Figure 1, but louder.', scheme: '"a louder square wave with period of 2 ms and no DC offset (1)"', source: '2025 Q3(c)(vi)', hz: 500, want: { level: 6 } },
    lfo: { id: 'lfo', name: 'The LFO', stem: 'The tempo is 120 bpm so the duration of a crotchet is 0.5 seconds. The LFO is timed in quavers. Calculate the frequency in Hz of the LFO. Show your working.', scheme: 'a crotchet every 0.5 s is 2 Hz; a quaver, half of that, is 0.25 s: 4 Hz', source: '2020 Q3(a)(iv)', want: { lfo: 'quaver' } },
    file: { id: 'file', name: 'The file', stem: 'An audio file has a file size of 10 MB: .wav, mono, 44.1 kHz, 16 bit. Calculate the file size if it were converted to stereo. Calculate the file size if it were converted to stereo, 88.2 kHz, 24 bit.', scheme: '"20 (1)" then "60 (1)"; "ignore working out"', source: '2024 Q3(b)', want: { channels: 2, rate: 88.2, depth: 24 } },
};
export const TASK_IDS = Object.keys(TASKS);

export const PRESETS = [
    { id: 'note', name: 'A real note', task: 'note', blurb: 'A bowed cello note on the screen: its period as a length you can read, its pitch as a note', set: { source: 'cello', timeBase: 2 } },
    { id: 'period', name: 'Read the period', task: 'period', blurb: 'The 2025 figure: a square wave, five milliseconds across. Period in ms, in s, then the frequency and the pitch', set: { source: 'square', timeBase: 1 } },
    { id: 'octave', name: '294 Hz, an octave up', task: 'octave', blurb: 'The 2019 question: a sine at 294 Hz; press Octave up and read 588 off the screen, the period halved', set: { source: 'sine', hz: 294, timeBase: 1 } },
    { id: 'lower', name: 'An octave lower', task: 'lower', blurb: 'The 2023 drawing: a square wave with a 1 ms period; the answer is a saw wave with a 2 ms period. Switch the source and the octave', set: { source: 'square', hz: 1000, timeBase: 1 } },
    { id: 'kick', name: '200 Hz', task: 'kick', blurb: 'The 2026 kick: a 200 Hz wave is 5 ms a cycle, 0.005 s. The screen is five milliseconds wide', set: { source: 'sine', hz: 200, timeBase: 1 } },
    { id: 'louder', name: 'Louder', task: 'louder', blurb: 'The 2025 drawing: the same wave, louder. Level up 6 dB and the trace doubles in height; the period does not move', set: { source: 'square', timeBase: 1 } },
    { id: 'lfo', name: 'The LFO', task: 'lfo', blurb: 'The 2020 question: at 120 bpm an LFO timed in quavers runs at 4 Hz. Slow the time base and count the tremolo', set: { source: 'cello', timeBase: 100, lfo: 'crotchet' } },
    { id: 'file', name: 'The file', task: 'file', blurb: 'The 2024 question: a 10 MB mono file at 44.1 kHz and 16 bit, then stereo, then stereo at 88.2 kHz and 24 bit. The Extension strip does the multiplying', set: { source: 'voice', timeBase: 2 } },
];

function baseState() {
    return {
        source: 'cello',
        hz: null, // a set frequency for a waveform; null means the source's own
        octave: 'as',
        stretch: 1,
        timeBase: 2,
        level: 0,
        lfo: 'off',
        channels: 1,
        rate: 44.1,
        depth: 16,
        task: null,
        presetId: null,
        volume: 0.8,
    };
}
export function applyPreset(state, id) {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return state;
    return { ...baseState(), volume: state.volume, ...p.set, task: p.task, presetId: id };
}
export const DEFAULT_STATE = applyPreset(baseState(), 'note');

// The source's own frequency: a waveform can be set to the paper's number.
export function sourceHz(state) { return state.hz && SOURCES[state.source].kind === 'osc' ? state.hz : SOURCES[state.source].hz; }
export function frequency(state) { return (sourceHz(state) * OCTAVES[state.octave].factor) / state.stretch; }

// ---- edits --------------------------------------------------------------------
const drop = (state) => ({ ...state, presetId: null });
export function setSource(state, source) {
    if (!SOURCES[source] || source === state.source) return state;
    return { ...drop(state), source, hz: SOURCES[source].kind === 'osc' && state.hz && SOURCES[state.source].kind === 'osc' ? state.hz : null, stretch: 1 };
}
export function setOctave(state, octave) { return OCTAVES[octave] && octave !== state.octave ? { ...drop(state), octave, stretch: 1 } : state; }
export function setTimeBase(state, ms) { return TIME_BASES[ms] && ms !== state.timeBase ? { ...state, timeBase: ms } : state; }
export function setLevel(state, db) { const v = clamp(Math.round(db * 2) / 2, LEVEL_MIN, LEVEL_MAX); return v === state.level ? state : { ...drop(state), level: v }; }
export function setLfo(state, lfo) { return LFOS[lfo] && lfo !== state.lfo ? { ...drop(state), lfo } : state; }
export function setChannels(state, channels) { return CHANNEL_IDS.includes(channels) && channels !== state.channels ? { ...state, channels } : state; }
export function setRate(state, rate) { return RATE_IDS.includes(rate) && rate !== state.rate ? { ...state, rate } : state; }
export function setDepth(state, depth) { return DEPTH_IDS.includes(depth) && depth !== state.depth ? { ...state, depth } : state; }
export function setVolume(state, volume) { return { ...state, volume: clamp01(volume) }; }
// The period bracket dragged to a new length: the wave stretches, the pitch
// falls; squeezed, it rises. Within an octave either way of the chip.
export function stretchTo(state, factor) {
    const v = clamp(Math.round(factor * 1000) / 1000, STRETCH_MIN, STRETCH_MAX);
    return Math.abs(v - state.stretch) < 1e-9 ? state : { ...drop(state), stretch: v };
}

// ---- reading the screen ------------------------------------------------------------
export function readings(state) {
    const hz = frequency(state);
    const ms = periodMs(hz);
    const src = SOURCES[state.source];
    return {
        hz, ms, s: periodS(hz), note: noteOf(hz), noteWord: noteWord(hz), cycles: TIME_BASES[state.timeBase].span / ms,
        shape: src.shape, kind: src.kind, lfoHz: lfoHz(state.lfo), fileMb: fileMb(state), bytesPerSecond: bytesPerSecond(state),
        gain: dbToGain(state.level), levelWord: levelWord(state.level), stretched: Math.abs(state.stretch - 1) > 1e-9,
    };
}

// The task's key state: for the gate and the stage.
export function verdict(state) {
    const task = state.task ? TASKS[state.task] : null;
    if (!task) return { key: 'free', ok: null };
    const hz = frequency(state);
    if (task.id === 'note' || task.id === 'period' || task.id === 'kick') {
        const shown = cyclesShown(state);
        const readable = shown >= 1 && shown <= 12;
        return { key: readable ? 'readable' : shown < 1 ? 'too-short' : 'too-long', ok: readable, cycles: shown };
    }
    if (task.id === 'octave') { const ok = state.octave === 'up' && Math.abs(hz - 588) < 2; return { key: ok ? 'directed' : state.octave === 'down' ? 'wrong-way' : 'not-yet', ok }; }
    if (task.id === 'lower') {
        const ok = state.source === 'saw' && state.octave === 'down' && Math.abs(periodMs(hz) - 2) < 0.05;
        const key = ok ? 'directed' : state.source !== 'saw' ? 'wrong-shape' : state.octave !== 'down' ? 'wrong-octave' : 'stretched';
        return { key, ok };
    }
    if (task.id === 'louder') { const ok = state.level >= 5.5 && state.level <= 6.5 && state.octave === 'as' && !readings(state).stretched; return { key: ok ? 'directed' : state.level <= 0.5 ? 'not-yet' : state.level > 6.5 ? 'too-loud' : state.octave !== 'as' || readings(state).stretched ? 'period-moved' : 'not-yet', ok }; }
    if (task.id === 'lfo') { const ok = state.lfo === 'quaver'; return { key: ok ? 'directed' : state.lfo === 'off' ? 'no-lfo' : `lfo-${state.lfo}`, ok }; }
    if (task.id === 'file') {
        const stereo = state.channels === 2;
        const full = stereo && state.rate === 88.2 && state.depth === 24;
        return { key: full ? 'directed' : stereo && state.rate === 44.1 && state.depth === 16 ? 'stereo' : state.channels === 1 && state.rate === 44.1 && state.depth === 16 ? 'base' : 'other', ok: full, mb: fileMb(state) };
    }
    return { key: 'free', ok: null };
}
export { periodMs as period };
