// The Automation Lane (1.8): the model behind the lane.
//
// One loop of one song plays; one part carries one lane on one target, and
// the lane is a list of breakpoints joined by a shape. Everything here is
// pure arithmetic over the points: the value at any beat, the sampled curve
// the engine writes to the parameter, and the checks the paper's schemes
// make (scope, placement, direction, position, smoothness, start, arrival).
// No audio node in this file; AutomationLane.jsx plays it.
//
// Values are kept normalised, 0 to 1, whatever the target, so the same
// shape can be moved from pan to filter to send and heard doing a different
// job (the topic's own lesson). Each target says what its 0 and 1 mean.

export const PART_IDS = ['drums', 'bass', 'guitar', 'keys'];
export const PARTS = {
    drums: { label: 'Drums', short: 'Drums', said: 'the drums', poss: "the drums'", colour: 'var(--gen-2)' },
    bass: { label: 'Bass', short: 'Bass', said: 'the bass', poss: "the bass's", colour: 'var(--gen-1)' },
    guitar: { label: 'Guitar', short: 'Guitar', said: 'the guitar', poss: "the guitar's", colour: 'var(--gen-5)' },
    keys: { label: 'Keys', short: 'Keys', said: 'the keys', poss: "the keys'", colour: 'var(--gen-3)' },
};

export const VOL_MIN = -36;
export const VOL_MAX = 6;
export const UNITY = (0 - VOL_MIN) / (VOL_MAX - VOL_MIN); // the lane's value at 0 dB
export const FILTER_MIN = 100;
export const FILTER_MAX = 16000;

export const TARGET_IDS = ['vol', 'pan', 'filter', 'send'];
export const TARGETS = {
    vol: { label: 'Volume', dial: 'Volume', noun: 'volume', said: 'the volume', rest: UNITY, colour: '#ffffff', node: 'fader', ticks: [[1, '+6'], [UNITY, '0'], [(-12 - VOL_MIN) / 42, '−12'], [(-24 - VOL_MIN) / 42, '−24'], [0, '−36']] },
    pan: { label: 'Pan', dial: 'Pan', noun: 'pan', said: 'the pan', rest: 0.5, colour: 'var(--teal)', node: 'pan', ticks: [[1, 'R'], [0.5, 'C'], [0, 'L']] },
    filter: { label: 'Filter', dial: 'Cut-off', noun: 'cut-off', said: 'the filter cut-off', rest: 1, colour: 'var(--gen-4)', node: 'filter', ticks: [[1, '16k'], [Math.log(4000 / 100) / Math.log(160), '4k'], [Math.log(1000 / 100) / Math.log(160), '1k'], [Math.log(250 / 100) / Math.log(160), '250'], [0, '100']] },
    send: { label: 'Send', dial: 'Send', noun: 'send', said: 'the send', rest: 0, colour: 'var(--gen-6)', node: 'send', ticks: [[1, 'wet'], [0.5, '50%'], [0, 'dry']] },
};

export const SHAPE_IDS = ['step', 'line', 'curve'];
export const SHAPES = {
    step: { label: 'Step', said: 'a step', short: 'hold, then jump', does: 'holds each value until the next point, then jumps' },
    line: { label: 'Line', said: 'a line', short: 'a constant rate', does: 'moves at a constant rate from one point to the next' },
    curve: { label: 'Curve', said: 'a curve', short: 'fast, then eases in', does: 'moves fast at first and eases into the next point' },
};

export const GRID_IDS = ['bar', 'beat', 'free'];
export const GRIDS = {
    bar: { label: 'Bar', beats: 4, said: 'the bar', short: 'points snap to the barline' },
    beat: { label: 'Beat', beats: 1, said: 'the beat', short: 'points snap to the beat' },
    free: { label: 'Free', beats: 1 / 8, said: 'free', short: 'points land where you put them' },
};

export const BEATS = 16; // four bars of four
export const BARS = 4;

export const SONG = {
    id: 'groove',
    title: 'Dry Groove',
    style: 'funk, instrumental, 103 bpm',
    bpm: 103,
    bars: BARS,
    loopSec: 9.3204,
    files: {
        drums: '/bench-audio/lane/groove-drums.mp3',
        bass: '/bench-audio/lane/groove-bass.mp3',
        guitar: '/bench-audio/lane/groove-guitar.mp3',
        keys: '/bench-audio/lane/groove-keys.mp3',
    },
    // measured from the cut (scratchpad auto/cut.py, 29 Aug 2026): RMS in
    // dBFS of each stem as it plays
    stats: { drums: -20.1, bass: -18.1, guitar: -35.6, keys: -34.9 },
    // the bench's own balance, in dB: the guitar and keys sit 15 dB under
    // the rhythm section in the release, and a lane on a part you cannot
    // hear teaches nothing
    mixTrim: { drums: -3, bass: -4, guitar: 7, keys: 8 },
};

// ---- values --------------------------------------------------------------
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const clamp01 = (v) => clamp(v, 0, 1);

// A lane value in the target's own units.
export function toUnit(target, v) {
    const x = clamp01(v);
    if (target === 'vol') return x <= 0.005 ? -Infinity : VOL_MIN + x * (VOL_MAX - VOL_MIN);
    if (target === 'pan') return (x - 0.5) * 2;
    if (target === 'filter') return FILTER_MIN * (FILTER_MAX / FILTER_MIN) ** x;
    return x;
}
// ...and back, for the ticks and the dial
export function fromUnit(target, u) {
    if (target === 'vol') return u === -Infinity ? 0 : clamp01((u - VOL_MIN) / (VOL_MAX - VOL_MIN));
    if (target === 'pan') return clamp01(u / 2 + 0.5);
    if (target === 'filter') return clamp01(Math.log(u / FILTER_MIN) / Math.log(FILTER_MAX / FILTER_MIN));
    return clamp01(u);
}

export function fmtValue(target, v) {
    const u = toUnit(target, v);
    if (target === 'vol') return u === -Infinity ? 'off' : `${u > 0 ? '+' : u < 0 ? '−' : ''}${Math.abs(u).toFixed(1)} dB`;
    if (target === 'pan') { const p = Math.round(u * 100); return p === 0 ? 'C' : p < 0 ? `L ${-p}` : `R ${p}`; }
    if (target === 'filter') return u >= 1000 ? `${(u / 1000).toFixed(u >= 10000 ? 0 : 1)} kHz` : `${Math.round(u)} Hz`;
    return u <= 0.005 ? 'dry' : `${Math.round(u * 100)}%`;
}

// The word for a value, the way the stems say it.
export function valueWord(target, v) {
    const x = clamp01(v);
    if (target === 'pan') {
        if (x <= 0.05) return 'hard left';
        if (x >= 0.95) return 'hard right';
        if (Math.abs(x - 0.5) < 0.04) return 'centre';
        return x < 0.5 ? 'left of centre' : 'right of centre';
    }
    if (target === 'vol') {
        if (x <= 0.005) return 'silent';
        if (x < 0.3) return 'barely audible';
        if (x < UNITY - 0.06) return 'quiet';
        if (x <= UNITY + 0.03) return 'original level';
        return 'over the level';
    }
    if (target === 'filter') {
        if (x >= 0.9) return 'open';
        if (x >= 0.55) return 'a little closed';
        if (x >= 0.25) return 'half closed';
        return 'closed';
    }
    if (x <= 0.02) return 'dry';
    if (x < 0.35) return 'a little room';
    if (x < 0.7) return 'in the room';
    return 'wet';
}

// ---- time ----------------------------------------------------------------
export const barOf = (t) => Math.floor(t / 4) + 1;
export function fmtBeat(t) {
    const bar = Math.floor(t / 4) + 1;
    const beat = t - (bar - 1) * 4;
    if (Math.abs(beat) < 0.01) return `bar ${Math.min(bar, BARS + 1)}`;
    const b = Math.floor(beat) + 1;
    const frac = beat - Math.floor(beat);
    return `bar ${bar} beat ${frac < 0.01 ? b : (b + frac).toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}`;
}
export function snapT(t, grid) {
    const g = GRIDS[grid]?.beats || 1 / 8;
    return clamp(Math.round(t / g) * g, 0, BEATS);
}

// ---- the lane ------------------------------------------------------------
const ease = (x) => 1 - (1 - x) * (1 - x);

// Points are kept sorted by time; two at the same time are a jump, the
// later one winning from that instant.
export function sortPoints(points) {
    return points.map((p, i) => ({ ...p, i })).sort((a, b) => (a.t - b.t) || (a.i - b.i)).map(({ t, v }) => ({ t, v }));
}

export function valueAt(points, shape, t) {
    if (!points.length) return 0;
    const pts = points;
    if (t < pts[0].t) return pts[0].v;
    let k = 0;
    for (let i = 0; i < pts.length; i += 1) if (pts[i].t <= t) k = i;
    const a = pts[k];
    const b = pts[k + 1];
    if (!b) return a.v;
    if (shape === 'step') return a.v;
    const span = b.t - a.t;
    if (span <= 1e-9) return a.v;
    const x = (t - a.t) / span;
    const y = shape === 'curve' ? ease(x) : x;
    return a.v + (b.v - a.v) * y;
}

// The lane at n evenly spaced times over the loop (the last sample sits
// just before the loop's end).
export function sampleLane(points, shape, n) {
    const out = new Float64Array(n);
    for (let i = 0; i < n; i += 1) out[i] = valueAt(points, shape, (i / n) * BEATS);
    return out;
}

// The curve the engine books on the parameter, in the target's units.
export function curveFor(state, n) {
    const s = sampleLane(state.points, state.shape, n);
    const out = new Float32Array(n);
    for (let i = 0; i < n; i += 1) {
        const u = toUnit(state.target, s[i]);
        out[i] = state.target === 'vol' ? (u === -Infinity ? 0 : 10 ** (u / 20)) : state.target === 'send' ? u * 0.9 : u;
    }
    return out;
}
export const restUnit = (target) => {
    const u = toUnit(target, TARGETS[target].rest);
    return target === 'vol' ? 10 ** (u / 20) : target === 'send' ? u * 0.9 : u;
};

// ---- the papers' moves ---------------------------------------------------
// Each task re-scopes a real practical to the loop's four bars. Sources:
// the vault's per-question files (1.8 Automation/05 - Assessment Tools/Past
// Paper Questions): 2017 AS Q5(a), 2019 AS Q5(b), 2020 A Q5(a) and Q5(b),
// 2021 A Q5(a), 2022 AS Q2(c), 2023 A Q5(b).
export const TASKS = {
    'pan-step': {
        id: 'pan-step',
        name: 'Hard pan by bar',
        part: 'keys',
        target: 'pan',
        span: [4, 12],
        edges: [4, 8, 12],
        stem: 'Pan the keys. Only bars 2 and 3 should be affected; all other bars should be panned to the centre. Bar 2 should be panned hard left. Bar 3 should be panned hard right.',
        scheme: 'L – R as directed',
        source: '2019 AS Q5(b), the keyboards; the same move on a synth riff in 2020 A Q5(a) and a vocal phrase in 2017 AS Q5(a)',
        model: { shape: 'step', grid: 'bar', points: [{ t: 0, v: 0.5 }, { t: 4, v: 0 }, { t: 8, v: 1 }, { t: 12, v: 0.5 }] },
    },
    'pan-sweep': {
        id: 'pan-sweep',
        name: 'Smooth sweep',
        part: 'bass',
        target: 'pan',
        span: [8, 12],
        edges: [8, 12],
        stem: 'Apply automated panning to the bass. Only bar 3 should be affected; all other bars should be panned to the centre. Pan the bass in bar 3 smoothly from hard left to hard right.',
        scheme: 'L – R as directed; "L to R smoothly as directed"',
        source: '2021 A Q5(a), the bass in one bar; the same sweep on a riser in 2023 A Q5(b)',
        model: { shape: 'line', grid: 'bar', points: [{ t: 0, v: 0.5 }, { t: 8, v: 0.5 }, { t: 8, v: 0 }, { t: 12, v: 1 }, { t: 12, v: 0.5 }] },
    },
    'filter-build': {
        id: 'filter-build',
        name: 'Filter build',
        part: 'keys',
        target: 'filter',
        span: [4, 16],
        edges: [],
        stem: 'Apply an automated low-pass filter to the keys. At the beginning of bar 2 the cut-off should be the same as in bar 1. Gradually increase the cut-off so that the effect continues to build until the end of bar 4.',
        scheme: 'The cut-off frequency of the low pass filter smoothly rises; the cut-off at the start matches the bar before',
        source: '2020 A Q5(b), a synth riff over bars 10 to 13',
        model: { shape: 'curve', grid: 'bar', points: [{ t: 0, v: 0.3 }, { t: 4, v: 0.3 }, { t: 16, v: 1 }] },
    },
    'vol-ramp': {
        id: 'vol-ramp',
        name: 'Volume ramp',
        part: 'keys',
        target: 'vol',
        span: [8, 12],
        edges: [8],
        stem: 'Apply volume automation to the keys in bar 3. They should be quiet but still audible at the start of the bar, gradually get louder through the bar, and finish at the original level. There must be no other volume changes.',
        scheme: 'Audible at the start (1); volume rises smoothly (1); finishes at the original level, no other changes (1)',
        source: '2022 AS Q2(c), a long chord over one bar',
        model: { shape: 'line', grid: 'bar', points: [{ t: 0, v: UNITY }, { t: 8, v: UNITY }, { t: 8, v: 0.45 }, { t: 12, v: UNITY }] },
    },
};
export const TASK_IDS = Object.keys(TASKS);

export const PRESETS = [
    { id: 'pan', name: 'Hard pan', task: 'pan-step', blurb: 'The move the papers set most: bar 2 hard left, bar 3 hard right, the rest centred (2017, 2019, 2020)' },
    { id: 'late', name: 'Late step', task: 'pan-step', blurb: 'The 2020 report\'s fault: the same step, landing 70 ms after the barline, so the first note plays centred', lane: { shape: 'step', grid: 'free', points: [{ t: 0, v: 0.5 }, { t: 4.125, v: 0 }, { t: 8.125, v: 1 }, { t: 12.125, v: 0.5 }] } },
    { id: 'sweep', name: 'Sweep', task: 'pan-sweep', blurb: 'The bass across bar 3, smoothly hard left to hard right (2021)' },
    { id: 'backwards', name: 'Backwards', task: 'pan-sweep', blurb: 'The 2023 report\'s fault: a perfect sweep run right to left', lane: { shape: 'line', grid: 'bar', points: [{ t: 0, v: 0.5 }, { t: 8, v: 0.5 }, { t: 8, v: 1 }, { t: 12, v: 0 }, { t: 12, v: 0.5 }] } },
    { id: 'filter', name: 'Filter build', task: 'filter-build', blurb: 'The keys half closed for bar 1, opening across bars 2 to 4 (2020)' },
    { id: 'slow', name: 'Slow to rise', task: 'filter-build', blurb: 'The 2020 report\'s fault: started too low, too slow to rise, the part inaudible where it should be heard', lane: { shape: 'line', grid: 'bar', points: [{ t: 0, v: 0.08 }, { t: 4, v: 0.08 }, { t: 16, v: 0.5 }] } },
    { id: 'ramp', name: 'Ramp', task: 'vol-ramp', blurb: 'The keys quiet but audible at the start of bar 3, up to the original level by its end (2022)' },
    { id: 'short', name: 'Falls short', task: 'vol-ramp', blurb: 'The 2022 report\'s two faults at once: an uneven ramp that does not reach the level', lane: { shape: 'line', grid: 'free', points: [{ t: 0, v: UNITY }, { t: 8, v: UNITY }, { t: 8, v: 0.45 }, { t: 9.5, v: 0.62 }, { t: 10.5, v: 0.5 }, { t: 12, v: 0.72 }, { t: 12, v: UNITY }] } },
];

export const DEFAULT_STATE = {
    part: 'keys',
    target: 'pan',
    shape: 'step',
    grid: 'bar',
    points: TASKS['pan-step'].model.points,
    task: 'pan-step',
    presetId: 'pan',
    level: 0.8,
};

export function applyPreset(state, id) {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return state;
    const task = TASKS[p.task];
    const lane = p.lane || task.model;
    return { ...state, part: task.part, target: task.target, shape: lane.shape, grid: lane.grid, points: sortPoints(lane.points), task: task.id, presetId: id };
}
export const flatLane = (target) => [{ t: 0, v: TARGETS[target].rest }];
export function setPart(state, part) {
    if (!PARTS[part] || part === state.part) return state;
    return { ...state, part, task: null, presetId: null };
}
export function setTarget(state, target) {
    if (!TARGETS[target] || target === state.target) return state;
    return { ...state, target, task: null, presetId: null };
}
export function setShape(state, shape) {
    if (!SHAPES[shape] || shape === state.shape) return state;
    return { ...state, shape, presetId: null };
}
export function setGrid(state, grid) {
    if (!GRIDS[grid] || grid === state.grid) return state;
    return { ...state, grid };
}
// Move a point: time snapped to the grid and held between its neighbours,
// value clamped.
export function movePoint(state, i, t, v) {
    const pts = state.points;
    if (i < 0 || i >= pts.length) return state;
    const lo = i > 0 ? pts[i - 1].t : 0;
    const hi = i < pts.length - 1 ? pts[i + 1].t : BEATS;
    const nt = clamp(snapT(t, state.grid), lo, hi);
    const nv = Math.round(clamp01(v) * 200) / 200;
    if (Math.abs(nt - pts[i].t) < 1e-9 && Math.abs(nv - pts[i].v) < 1e-9) return state;
    const next = pts.slice();
    next[i] = { t: nt, v: nv };
    return { ...state, points: next, presetId: null };
}
export function addPoint(state, t, v) {
    const nt = snapT(t, state.grid);
    const nv = Math.round(clamp01(v) * 200) / 200;
    const pts = sortPoints([...state.points, { t: nt, v: nv }]);
    // the new point is the last one at its time
    let i = -1;
    for (let k = 0; k < pts.length; k += 1) if (Math.abs(pts[k].t - nt) < 1e-9) i = k;
    return { state: { ...state, points: pts, presetId: null }, index: i };
}
export function removePoint(state, i) {
    if (state.points.length <= 1 || i < 0 || i >= state.points.length) return state;
    return { ...state, points: state.points.filter((_, k) => k !== i), presetId: null };
}
// Touch: the dial moved at time t while the loop played. Points within half
// a grid step of t are replaced by the new one.
export function writePoint(state, t, v) {
    const g = GRIDS[state.grid]?.beats || 1 / 8;
    const nt = snapT(t, state.grid);
    const nv = Math.round(clamp01(v) * 200) / 200;
    const kept = state.points.filter((p) => Math.abs(p.t - nt) >= g / 2 - 1e-9);
    return { ...state, points: sortPoints([...kept, { t: nt, v: nv }]), presetId: null };
}
export function resetLane(state) {
    const task = state.task ? TASKS[state.task] : null;
    if (task) return { ...state, shape: task.model.shape, grid: task.model.grid, points: sortPoints(task.model.points), presetId: PRESETS.find((p) => p.task === task.id && !p.lane)?.id || null };
    return { ...state, points: flatLane(state.target), presetId: null };
}
export function flattenLane(state) {
    return { ...state, points: flatLane(state.target), presetId: null };
}
export function setLevel(state, level) { return { ...state, level: clamp01(level) }; }

// ---- reading the lane ----------------------------------------------------
const N = 512; // samples per loop for the checks: 32 per beat
const idxOf = (t) => clamp(Math.round((t / BEATS) * N), 0, N - 1);
const meanOver = (s, a, b) => { let acc = 0; let n = 0; for (let i = idxOf(a); i < idxOf(b); i += 1) { acc += s[i]; n += 1; } return n ? acc / n : s[idxOf(a)]; };
const minOver = (s, a, b) => { let m = Infinity; for (let i = idxOf(a); i < idxOf(b); i += 1) m = Math.min(m, s[i]); return m === Infinity ? s[idxOf(a)] : m; };
const maxOver = (s, a, b) => { let m = -Infinity; for (let i = idxOf(a); i < idxOf(b); i += 1) m = Math.max(m, s[i]); return m === -Infinity ? s[idxOf(a)] : m; };

// Where the lane crosses halfway between its value a beat before an edge
// and a beat after, in beats from the edge (positive is late). Null when it
// never moves there.
export function crossingAt(points, shape, edge) {
    const before = valueAt(points, shape, Math.max(0, edge - 1));
    const after = valueAt(points, shape, Math.min(BEATS - 1e-6, edge + 1));
    if (Math.abs(after - before) < 0.1) return null;
    const mid = (before + after) / 2;
    const step = 1 / 128;
    for (let t = Math.max(0, edge - 1); t <= Math.min(BEATS, edge + 1); t += step) {
        const v = valueAt(points, shape, t);
        if (before < after ? v >= mid : v <= mid) return Math.round((t - edge) * 128) / 128;
    }
    return null;
}
export const beatMs = (beats) => Math.round(beats * (60 / SONG.bpm) * 1000);

// Is the lane monotonic over a span, and does it move in jumps?
function runOver(s, a, b, tol = 0.002) {
    let rises = 0; let falls = 0; let jump = 0;
    for (let i = idxOf(a) + 1; i < idxOf(b); i += 1) {
        const d = s[i] - s[i - 1];
        if (d > tol) rises += 1; else if (d < -tol) falls += 1;
        jump = Math.max(jump, Math.abs(d));
    }
    return { rises, falls, jump };
}

// The checks the schemes make, in the order a marker reads them. Each is
// { id, ok, text }; the text says what the lane does where it fails.
export function checks(state) {
    const task = state.task ? TASKS[state.task] : null;
    if (!task || task.part !== state.part || task.target !== state.target) return [];
    const s = sampleLane(state.points, state.shape, N);
    const rest = TARGETS[task.target].rest;
    const out = [];
    const push = (id, ok, text, at = {}) => out.push({ id, ok, text, ...at });
    const [a, b] = task.span;

    if (task.id === 'pan-step') {
        // placement: each jump against its barline
        for (const e of task.edges) {
            const off = crossingAt(state.points, state.shape, e);
            if (off == null) { push('placement', false, `nothing changes at bar ${barOf(e)}: the stem wants a jump on that barline`); break; }
            if (Math.abs(off) > 0.04) { push('placement', false, `the jump at bar ${barOf(e)} lands ${beatMs(Math.abs(off))} ms ${off > 0 ? 'late' : 'early'}, so the first note of the bar plays ${off > 0 ? 'where the last bar left it' : 'in the new position before the bar begins'}`, { edge: e, off, ms: beatMs(Math.abs(off)) }); break; }
        }
        if (!out.some((c) => c.id === 'placement')) push('placement', true, 'every jump lands on its barline');
        const l = meanOver(s, 4, 8); const r = meanOver(s, 8, 12);
        if (l > 0.5 && r < 0.5) push('direction', false, 'bar 2 sits right and bar 3 left: the direction is inverted');
        else push('direction', true, 'left in bar 2, then right in bar 3');
        const lHard = maxOver(s, 4.2, 8) <= 0.06; const rHard = minOver(s, 8.2, 12) >= 0.94;
        if (!lHard) push('position', false, `bar 2 reaches ${valueWord('pan', maxOver(s, 4.2, 8))} (${fmtValue('pan', maxOver(s, 4.2, 8))}), not hard left`, { span: [4, 8], have: maxOver(s, 4.2, 8), want: 0 });
        else if (!rHard) push('position', false, `bar 3 reaches ${valueWord('pan', minOver(s, 8.2, 12))} (${fmtValue('pan', minOver(s, 8.2, 12))}), not hard right`, { span: [8, 12], have: minOver(s, 8.2, 12), want: 1 });
        else push('position', true, 'hard left and hard right, full travel');
        const leak = scopeLeak(s, a, b, rest, 0.3);
        if (leak) push('scope', false, `bar ${leak.bar} sits at ${fmtValue('pan', leak.v)} instead of the centre: only bars 2 and 3 should move`, { bar: leak.bar });
        else push('scope', true, 'bars 1 and 4 stay centred');
    }
    if (task.id === 'pan-sweep') {
        const start = s[idxOf(8) + 1]; const end = s[idxOf(12) - 1];
        const run = runOver(s, 8.05, 11.95);
        if (start > end) push('direction', false, `the bass runs right to left (${fmtValue('pan', start)} to ${fmtValue('pan', end)}): the stem says hard left to hard right`);
        else push('direction', true, 'left to right, as directed');
        if (state.shape === 'step' || run.jump > 0.15) push('smooth', false, 'the pan jumps: "smoothly" rules out a step, the move has to be one continuous ramp');
        else if (run.falls > 2 && run.rises > 2) push('smooth', false, 'the sweep turns back on itself: one continuous ramp, no dip');
        else push('smooth', true, 'one continuous ramp');
        if (start > 0.06 || end < 0.94) push('position', false, `bar 3 runs from ${fmtValue('pan', start)} to ${fmtValue('pan', end)}: it should start hard left and end hard right`, { span: [8, 12], have: start > 0.06 ? start : end, want: start > 0.06 ? 0 : 1, atEnd: !(start > 0.06) });
        else push('position', true, 'hard left to hard right, full travel');
        const off = crossingAt(state.points, state.shape, 8);
        if (off != null && Math.abs(off) > 0.06) push('placement', false, `the sweep begins ${beatMs(Math.abs(off))} ms ${off > 0 ? 'after' : 'before'} bar 3 begins`, { edge: 8, off, ms: beatMs(Math.abs(off)) });
        else push('placement', true, 'the sweep starts on the barline');
        const leak = scopeLeak(s, a, b, rest, 0.3);
        if (leak) push('scope', false, `bar ${leak.bar} sits at ${fmtValue('pan', leak.v)}: only bar 3 should move`, { bar: leak.bar });
        else push('scope', true, 'bars 1, 2 and 4 stay centred');
    }
    if (task.id === 'filter-build') {
        const start = meanOver(s, 0, 4);
        const at2 = s[idxOf(4) + 1];
        const mid = s[idxOf(12)];
        const end = s[idxOf(16) - 1];
        if (start < 0.15) push('start', false, `bar 1 sits at ${fmtValue('filter', start)}: started too low, the keys are barely there before the build begins`);
        else if (start > 0.6) push('start', false, `bar 1 sits at ${fmtValue('filter', start)}: already open, so there is nothing left to build`);
        else if (Math.abs(at2 - start) > 0.08) push('start', false, `bar 2 begins at ${fmtValue('filter', at2)} where bar 1 sat at ${fmtValue('filter', start)}: the join jumps`);
        else push('start', true, `bar 2 begins where bar 1 was, ${fmtValue('filter', start)}`);
        const run = runOver(s, 4.05, 15.95);
        const expectMid = start + (1 - start) * 0.5;
        if (run.falls > 2) push('smooth', false, 'the cut-off falls back on the way up: one continuous rise');
        else if (mid < expectMid) push('rate', false, `by the end of bar 3 the cut-off is only ${fmtValue('filter', mid)}: too slow to rise`);
        else push('rate', true, 'rising all the way');
        if (end < 0.9) push('arrival', false, `bar 4 ends at ${fmtValue('filter', end)}: the build should reach fully open`, { at: 16, have: end, want: 1 });
        else push('arrival', true, 'fully open by the end of bar 4');
        if (state.shape === 'step' || run.jump > 0.15) push('smooth', false, 'the cut-off moves in jumps: the scheme says smoothly');
    }
    if (task.id === 'vol-ramp') {
        const start = s[idxOf(8) + 1]; const end = s[idxOf(12) - 1];
        const run = runOver(s, 8.05, 11.95);
        if (start < 0.15) push('start', false, `bar 3 begins ${valueWord('vol', start)} (${fmtValue('vol', start)}): the chord must be audible when it starts`);
        else if (start > UNITY - 0.08) push('start', false, `bar 3 begins at ${fmtValue('vol', start)}: not quiet, so there is no rise to hear`);
        else push('start', true, `quiet but audible at the start, ${fmtValue('vol', start)}`);
        if (state.shape === 'step' || run.jump > 0.15) push('smooth', false, 'the level moves in jumps: the scheme wants a smooth rise');
        else if (run.falls > 2) push('smooth', false, 'the ramp dips on the way up: uneven');
        else push('smooth', true, 'one smooth rise');
        if (end < UNITY - 0.03) push('arrival', false, `the bar ends at ${fmtValue('vol', end)}, ${(Math.abs(toUnit('vol', end))).toFixed(0)} dB short of the original level`, { at: 12, have: end, want: UNITY });
        else if (end > UNITY + 0.03) push('arrival', false, `the bar ends at ${fmtValue('vol', end)}: over the original level`, { at: 12, have: end, want: UNITY });
        else push('arrival', true, 'back at the original level by the end of the bar');
        const leak = scopeLeak(s, a, b, rest, 0.3);
        if (leak) push('scope', false, `bar ${leak.bar} sits at ${fmtValue('vol', leak.v)}: no other volume changes`, { bar: leak.bar });
        else push('scope', true, 'no other volume changes');
    }
    return out;
}

// The first bar outside the span where the lane leaves the rest value for
// longer than `minBeats`.
function scopeLeak(s, a, b, rest, minBeats) {
    const per = BEATS / N;
    let runStart = null;
    for (let i = 0; i < N; i += 1) {
        const t = i * per;
        const outside = t < a || t >= b;
        const off = outside && Math.abs(s[i] - rest) > 0.03;
        if (off && runStart == null) runStart = t;
        if ((!off || i === N - 1) && runStart != null) {
            if (t - runStart >= minBeats) return { bar: barOf(runStart), v: s[Math.min(N - 1, idxOf(runStart) + 2)] };
            runStart = null;
        }
    }
    return null;
}

// One word for the gate and the stage: 'directed' or the first failing check.
export function verdict(state) {
    const cs = checks(state);
    if (!cs.length) return { key: 'free', ok: null, faults: [] };
    const faults = cs.filter((c) => !c.ok);
    return { key: faults.length ? faults[0].id : 'directed', ok: !faults.length, faults, checks: cs };
}

// The lane in words, point by point (up to six), for the Core line.
export function pointWords(state) {
    const pts = state.points;
    const tg = state.target;
    if (pts.length === 1) return `${valueWord(tg, pts[0].v)} all the way through`;
    const bits = [];
    for (let i = 0; i < pts.length; i += 1) {
        const p = pts[i];
        const next = pts[i + 1];
        if (next && Math.abs(next.t - p.t) < 1e-9) continue; // the jump's first half
        bits.push(`${valueWord(tg, p.v)} ${p.t === 0 ? 'from the start' : `at ${fmtBeat(p.t)}`}`);
    }
    if (bits.length > 6) return `${pts.length} points, from ${valueWord(tg, minOver(sampleLane(pts, state.shape, N), 0, BEATS))} to ${valueWord(tg, maxOver(sampleLane(pts, state.shape, N), 0, BEATS))}`;
    return bits.join(', ');
}
// Which bars the lane moves in.
export function movingBars(state) {
    const s = sampleLane(state.points, state.shape, N);
    const bars = [];
    for (let b = 0; b < BARS; b += 1) {
        const lo = minOver(s, b * 4, b * 4 + 4); const hi = maxOver(s, b * 4, b * 4 + 4);
        const prev = b > 0 ? s[idxOf(b * 4) - 1] : s[0];
        if (hi - lo > 0.03 || Math.abs(s[idxOf(b * 4)] - prev) > 0.03) bars.push(b + 1);
    }
    return bars;
}
export const listBars = (bars) => (bars.length === 0 ? 'no bar' : bars.length === 1 ? `bar ${bars[0]}` : bars.length === BARS ? 'every bar' : `bars ${bars.slice(0, -1).join(', ')} and ${bars[bars.length - 1]}`);
