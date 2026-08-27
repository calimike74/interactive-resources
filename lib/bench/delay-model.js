// The Delay bench's model: pure functions, no DOM, no Web Audio. The audio
// graph and the stage both read THESE numbers, so the picture can never
// drift from the sound (Bench Standard §3 law 6). Tested in
// tests/bench-delay-model.test.mjs.

// The exam's note values first (Mike, 1.12 note: "the exam board gives out
// main beats"), dotted and triplet behind Go further.
export const NOTE_VALUES = {
    quarter: { label: '1/4', beats: 1 },
    eighth: { label: '1/8', beats: 0.5 },
    sixteenth: { label: '1/16', beats: 0.25 },
    half: { label: '1/2', beats: 2 },
    dottedEighth: { label: '1/8 dotted', beats: 0.75 },
    tripletEighth: { label: '1/8 triplet', beats: 1 / 3 },
};
export const CORE_NOTE_IDS = ['quarter', 'eighth', 'sixteenth'];
export const FURTHER_NOTE_IDS = ['half', 'dottedEighth', 'tripletEighth'];

export const TIME_MIN_SEC = 0.02;
export const TIME_MAX_SEC = 2.0;
export const BPM_MIN = 60;
export const BPM_MAX = 180;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// One expression feeds the DelayNode and the readout.
export function delayTimeSec({ sync = false, timeMs = 250, bpm = 120, noteId = 'eighth' } = {}) {
    if (sync) {
        const beats = NOTE_VALUES[noteId]?.beats ?? 0.5;
        return clamp((60 / clamp(bpm, BPM_MIN, BPM_MAX)) * beats, TIME_MIN_SEC, TIME_MAX_SEC);
    }
    return clamp(timeMs / 1000, TIME_MIN_SEC, TIME_MAX_SEC);
}

// The repeats of one hit: the n-th repeat sounds at t0 + n × delay at
// amp × fb^n. This is the feedback loop's own recursion, so a 100% setting
// gives a line of equal marks (runaway) and 0% gives the single echo.
// Stops below 2% of the original or at the window's end, never infinite.
export function repeatMarks({
    t0 = 0,
    amp = 1,
    delaySec = 0.25,
    feedback = 50,
    windowEnd = 4,
    stereo = 'mono',
    floor = 0.02,
} = {}) {
    const fb = clamp(feedback, 0, 100) / 100;
    const marks = [];
    const d = Math.max(TIME_MIN_SEC, delaySec);
    for (let n = 1; ; n += 1) {
        const t = t0 + n * d;
        if (t > windowEnd) break;
        const level = amp * Math.pow(fb, n);
        if (n > 1 && level < floor) break;
        let lane = 'C';
        if (stereo === 'pingpong') lane = n % 2 === 1 ? 'R' : 'L';
        marks.push({ n, t, level, lane });
        if (fb === 0) break;
    }
    return marks;
}

// Equal-power wet/dry so the middle of the travel does not dip.
export function mixGains(mix = 50) {
    const x = clamp(mix, 0, 100) / 100;
    const theta = x * (Math.PI / 2);
    return { dry: Math.cos(theta), wet: Math.sin(theta) };
}

// High cut on the repeats: 0 = tape-dark (1.5 kHz), 100 = open (20 kHz),
// logarithmic so the audible change feels even across the travel.
export function highCutHz(pos = 100) {
    const x = clamp(pos, 0, 100) / 100;
    const lo = Math.log(1500);
    const hi = Math.log(20000);
    return Math.exp(lo + (hi - lo) * x);
}

export const PRESETS = [
    {
        id: 'slapback',
        name: 'Slapback',
        blurb: 'One quick repeat, the 1950s vocal sound.',
        state: { sync: false, timeMs: 110, feedback: 5, mix: 35, highCut: 60, stereo: 'mono' },
    },
    {
        id: 'rhythmic',
        name: 'Rhythmic 1/8',
        blurb: 'Repeats locked to the beat.',
        state: { sync: true, noteId: 'eighth', feedback: 35, mix: 40, highCut: 100, stereo: 'mono' },
    },
    {
        id: 'longtail',
        name: 'Long tail',
        blurb: 'Slow, darkening repeats that hang.',
        state: { sync: true, noteId: 'quarter', feedback: 65, mix: 45, highCut: 30, stereo: 'mono' },
    },
    {
        id: 'pingpong',
        name: 'Ping-pong',
        blurb: 'Repeats bounce left and right.',
        state: { sync: true, noteId: 'eighth', feedback: 50, mix: 45, highCut: 80, stereo: 'pingpong' },
    },
];

export const DEFAULT_STATE = Object.freeze({
    presetId: 'rhythmic',
    source: 'drums',
    sync: true,
    noteId: 'eighth',
    timeMs: 250,
    feedback: 35,
    mix: 40,
    bpm: 110,
    highCut: 100,
    stereo: 'mono',
    level: 0.8,
});

export function applyPreset(state, presetId) {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return { ...state };
    const next = { ...state, ...preset.state, presetId };
    if (!('noteId' in preset.state)) next.noteId = state.noteId ?? DEFAULT_STATE.noteId;
    if (!('timeMs' in preset.state)) next.timeMs = state.timeMs ?? DEFAULT_STATE.timeMs;
    return next;
}

// Bars and beats for the stage grid: beat lines across a window of `bars`
// bars at `bpm`, with the downbeats marked.
export function beatGrid({ bpm = 120, bars = 2, beatsPerBar = 4 } = {}) {
    const beat = 60 / clamp(bpm, BPM_MIN, BPM_MAX);
    const lines = [];
    for (let i = 0; i <= bars * beatsPerBar; i += 1) {
        lines.push({ t: i * beat, downbeat: i % beatsPerBar === 0, index: i });
    }
    return { beatSec: beat, barSec: beat * beatsPerBar, windowSec: beat * beatsPerBar * bars, lines };
}

// What the stage draws for a step: a bar for a hit, however long its sample
// rings (the open hi-hats decode to 1.5 s), an envelope only for a step the
// pattern marks as a phrase. The picture is the pattern's call, never the
// sample's length, which differs by decoder.
export function stageShape(step) {
    return step && step.phrase ? 'envelope' : 'bar';
}
