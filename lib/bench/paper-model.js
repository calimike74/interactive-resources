// Squared Paper (2.5): the engine behind the exam page.
//
// The written paper hands a candidate a grid marked "Displacement" up the
// side and "Time (ms)" along the bottom, five divisions across, and asks for
// a wave on it. This file is that paper as arithmetic: the twelve questions
// the page sets, the line the student drew stored as one displacement per
// column, the period read off it by autocorrelation, the shape named by
// cross-correlating one cycle against the four the spec lists, the height
// measured against the figure the question gave, and the check each
// question's mark scheme makes. No drawing and no audio in this file;
// components/resources/SquaredPaper.jsx draws the page.
//
// The numeracy is the page's, never the student's (the 2.5 law the
// Oscilloscope set on 30 Aug 2026): the student draws, the page measures.
// Every scheme line and every examiner line quoted below is the 9MT0/41 and
// 9MT0/04 mark scheme's or examiner report's own wording, from the papers in
// Professional/Assessment-and-Grades/A-level/Official-Papers.

export const DIVS = 5; // the paper's figure: five divisions across
export const COLS = 240; // one displacement per column: 48 columns a division
export const SQUARES = 5; // small squares a division, as the paper rules them
export const ROWS = 20; // small squares down the grid, the paper's proportion

// The grid is the paper's five divisions; the question says what a division
// is worth. 1 ms is the figure every paper prints; 2 ms is there because a
// 4 ms or 5 ms answer needs two cycles of room to be read (2025 Q3(c)(vii),
// 2026 Q1(d)).
export const TIME_BASES = { 1: { ms: 1, label: '1 ms', span: 5 }, 2: { ms: 2, label: '2 ms', span: 10 } };

// The four shapes the spec names and the paper draws. `at` is the ideal
// wave at a phase from 0 to 1, on the paper's own scale of -1 to +1.
export const SHAPE_IDS = ['sine', 'square', 'saw', 'triangle'];
export const SHAPES = {
    sine: { id: 'sine', label: 'Sine', said: 'a sine wave', at: (p) => Math.sin(2 * Math.PI * p) },
    square: { id: 'square', label: 'Square', said: 'a square wave', at: (p) => (p < 0.5 ? 1 : -1) },
    saw: { id: 'saw', label: 'Saw', said: 'a saw wave', at: (p) => 2 * p - 1 },
    triangle: { id: 'triangle', label: 'Triangle', said: 'a triangle wave', at: (p) => (p < 0.25 ? 4 * p : p < 0.75 ? 2 - 4 * p : 4 * p - 4) },
};
export const shapeAt = (id, p) => SHAPES[id].at(((p % 1) + 1) % 1);

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// ---- the ladder, in the paper's own units ----------------------------------
export const hzOf = (ms) => 1000 / ms;
export function fmtHz(hz) { return hz >= 1000 ? `${(hz / 1000).toFixed(hz >= 10000 ? 1 : 2).replace(/\.?0+$/, '')} kHz` : `${hz < 100 ? hz.toFixed(1) : Math.round(hz)} Hz`; }
export function fmtMs(ms) { return ms >= 100 ? `${Math.round(ms)} ms` : ms >= 10 ? `${ms.toFixed(1)} ms` : `${ms.toFixed(2)} ms`; }
export function fmtS(s) { return s >= 0.1 ? `${s.toFixed(2)} s` : `${s.toFixed(4).replace(/0+$/, '')} s`; }
export function fmtDb(db) { return `${db > 0.05 ? '+' : ''}${db.toFixed(1)} dB`; }
export const dbToGain = (db) => 10 ** (db / 20);
export const gainToDb = (g) => 20 * Math.log10(Math.max(1e-6, g));
export function heightWord(db) {
    if (db >= 5 && db <= 7.5) return 'twice the height';
    if (db > 7.5) return 'more than twice the height';
    if (db <= -5 && db >= -7.5) return 'half the height';
    if (db < -7.5) return 'less than half the height';
    if (Math.abs(db) < 1.5) return 'the same height';
    return db > 0 ? 'taller' : 'shorter';
}

// ---- the scheme's answer, and the marking ----------------------------------
export const PERIOD_TOL = 0.12; // a hand-drawn line: within about a tenth
export const OFFSET_TOL = 0.08; // of the grid's half height
export const SAME_AMP_TOL = 3; // dB, for "same amplitude as figure 1"
export const LOUDER_DB = 3; // "a louder square wave": at least this much taller

// ---- the twelve questions, and the blank paper ------------------------------
// In teaching order: the four waveforms first, drawn from a blank grid, then
// the changes to a given figure (an octave, louder, inverted), then the
// papers' own questions in the papers' own words. Mike, 12 Sep 2026: "if this
// is going to be to practise drawing in waveforms, especially different
// waveforms, this needs to be much more clear."
//
// Each question carries what the paper prints (the part label, the stem, the
// figure, the marks in brackets), what the grid is worth (timeBase), what the
// scheme wants (want), the scheme's own mark lines (marks) and the examiner
// report's line for the mark most often lost (report). `source` says which
// paper it is, or that it is a practice question written in that paper's
// shape; nothing claims to be a paper question that is not one.
const accept = 'Accept DC offset. Accept different amplitude.';
const REPORTS = {
    period2023: 'Most candidates drew a square wave but a very common error was a period of 2ms. (2023 examiner report)',
    shape2023: 'A very common error was drawing another square wave, not a saw wave. (2023 examiner report)',
    octave2023: 'Very few candidates knew that an octave lower was double the period. (2023 examiner report)',
    offset2023: 'Many candidates drew the same wave lower on the graph, i.e. with a negative DC offset. (2023 examiner report)',
    period2024: 'Period was often labelled incorrectly as being the width of half a cycle rather than a complete cycle. (2024 examiner report)',
    polarity2024: 'Some of those that did not score had inadvertently drawn a DC offset and failed to mirror it on the graph below. (2024 examiner report)',
    cycle2025: 'Some candidates only drew one cycle of the wave so did not score credit. (2025 examiner report)',
    ms2026: 'A common error was to incorrectly convert from seconds to milliseconds. (2026 examiner report)',
};

const shapeMark = (id, worth = 1) => ({ id: 'shape', words: `${SHAPES[id].label} wave (1)`, worth, checks: ['shape'] });
const periodMark = (ms, worth = 1) => ({ id: 'period', words: `Period of ${ms}ms (1)`, worth, checks: ['period'] });

export const QUESTIONS = [
    {
        id: 'sine2', n: 1, source: 'Practice, in the shape of 2023 Q2(e)(i)', part: '(a)',
        stem: 'On the graph below, draw a sine wave with a period of 2 ms.',
        figure: null, timeBase: 1,
        want: { shape: 'sine', periodMs: 2 },
        marks: [shapeMark('sine'), periodMark(2)],
        accept, report: REPORTS.period2024,
    },
    {
        id: 'square1', n: 2, source: '2023 Q2(e)(i)', part: '(e) (i)',
        stem: 'On the graph below draw a square wave with a period of 1 ms.',
        figure: null, timeBase: 1,
        want: { shape: 'square', periodMs: 1 },
        marks: [shapeMark('square'), periodMark(1)],
        accept, report: REPORTS.period2023,
    },
    {
        id: 'saw2', n: 3, source: 'Practice, in the shape of 2023 Q2(e)(i)', part: '(a)',
        stem: 'On the graph below, draw a saw wave with a period of 2 ms.',
        figure: null, timeBase: 1,
        want: { shape: 'saw', periodMs: 2 },
        marks: [shapeMark('saw'), periodMark(2)],
        accept, report: REPORTS.shape2023,
    },
    {
        id: 'triangle1', n: 4, source: 'Practice, in the shape of 2023 Q2(e)(i)', part: '(a)',
        stem: 'On the graph below, draw a triangle wave with a period of 1 ms.',
        figure: null, timeBase: 1,
        want: { shape: 'triangle', periodMs: 1 },
        marks: [shapeMark('triangle'), periodMark(1)],
        accept, report: REPORTS.shape2023,
    },
    {
        id: 'higher', n: 5, source: 'Practice, in the shape of 2025 Q3(c)(vii)', part: '(b)',
        stem: 'On the graph below, draw the same wave as in Figure 1, but an octave higher.',
        figure: { shape: 'sine', periodMs: 2, amp: 0.6, caption: 'Figure 1' }, timeBase: 1,
        want: { shape: 'sine', periodMs: 1 },
        marks: [shapeMark('sine'), periodMark(1)],
        accept, report: REPORTS.octave2023,
    },
    {
        id: 'lower', n: 6, source: 'Practice, in the shape of 2025 Q3(c)(vii)', part: '(b)',
        stem: 'On the graph below, draw the same wave as in Figure 1, but an octave lower.',
        figure: { shape: 'square', periodMs: 1, amp: 0.6, caption: 'Figure 1' }, timeBase: 1,
        want: { shape: 'square', periodMs: 2 },
        marks: [shapeMark('square'), periodMark(2)],
        accept, report: REPORTS.octave2023,
    },
    {
        id: 'louder2025', n: 7, source: '2025 Q3(c)(vi)', part: '(c) (vi)',
        stem: 'On the graph below, draw the same wave as in Figure 1, but louder.',
        figure: { shape: 'square', periodMs: 2, amp: 0.45, caption: 'Figure 1' }, timeBase: 1,
        want: { shape: 'square', periodMs: 2, louderThanDb: LOUDER_DB, offset: 'none' },
        marks: [{ id: 'all', words: 'Award 1 mark for a louder square wave with period of 2ms and no DC offset', worth: 1, checks: ['shape', 'period', 'louder', 'noOffset'] }],
        report: REPORTS.cycle2025,
    },
    {
        id: 'inverted2024', n: 8, source: '2024 Q4(b), with the figure printed for you', part: '(b)',
        stem: 'On the graph below, draw the same wave as in Figure 1 with the polarity inverted.',
        figure: { shape: 'saw', periodMs: 2, amp: 0.5, caption: 'Figure 1' }, timeBase: 1,
        want: { shape: 'saw', periodMs: 2, inverted: true },
        marks: [{ id: 'polarity', words: 'Credit graph of the same waveform but in reversed polarity (1)', worth: 1, checks: ['shape', 'period', 'polarity'] }],
        report: REPORTS.polarity2024,
    },
    {
        id: 'lower2023', n: 9, source: '2023 Q2(e)(ii)', part: '(e) (ii)',
        stem: 'On the graph below, draw a saw wave one octave lower.',
        figure: { shape: 'square', periodMs: 1, amp: 0.6, caption: 'Figure 1' }, timeBase: 1,
        want: { shape: 'saw', periodMs: 2 },
        marks: [
            { id: 'shape', words: 'Saw wave (1) (allow inverted saw wave)', worth: 1, checks: ['shape'] },
            periodMark(2),
        ],
        accept, report: REPORTS.octave2023,
    },
    {
        id: 'lower2025', n: 10, source: '2025 Q3(c)(vii)', part: '(c) (vii)',
        stem: 'On the graph below, draw the same wave as in Figure 1, but an octave lower.',
        figure: { shape: 'square', periodMs: 2, amp: 0.5, caption: 'Figure 1' }, timeBase: 2,
        want: { shape: 'square', periodMs: 4, sameAmp: true, offset: 'none' },
        marks: [{ id: 'all', words: 'Award 1 mark for a square wave with same amplitude as figure 1 and period of 4ms and no DC offset', worth: 1, checks: ['shape', 'sameAmp', 'period', 'noOffset'] }],
        report: REPORTS.octave2023,
    },
    {
        id: 'label2024', n: 11, source: '2024 Q4(a)', part: '(a)',
        stem: 'On the graph below:',
        bullets: [
            { text: 'Draw a square wave.', worth: 1 },
            { text: 'Label the axes.', worth: 2 },
            { text: 'Label the amplitude of the wave.', worth: 1 },
            { text: 'Label the period of the wave.', worth: 1 },
        ],
        figure: null, timeBase: 1,
        want: { shape: 'square', periodMs: 'any', offset: 'any' },
        marks: [
            { id: 'shape', words: 'Waveshape (1)', worth: 1, checks: ['shape'] },
            { id: 'axes', words: 'Voltage / V / displacement (1); s / ms / time (1)', worth: 2, checks: ['axes'] },
            { id: 'amplitude', words: 'amplitude (1). Allow peak to peak amplitude', worth: 1, checks: ['amplitude'] },
            { id: 'period', words: 'Period (1)', worth: 1, checks: ['period'] },
        ],
        accept: 'Accept DC offsets.', report: REPORTS.period2024,
    },
    {
        id: 'kick2026', n: 12, source: '2026 Q1(d), drawn rather than calculated', part: '(d)',
        stem: 'The initial frequency of the kick drum is about 200 Hz. On the graph below, draw a wave with the period of a 200 Hz wave.',
        figure: null, timeBase: 2,
        want: { shape: 'any', periodMs: 5, offset: 'any' },
        marks: [{ id: 'period', words: 'A wave with a period of 5 ms (1)', worth: 1, checks: ['period'] }],
        accept: 'The paper asks for the arithmetic: 1/200 (1), 0.005 s (1), then 5 ms (1).',
        report: REPORTS.ms2026,
    },
    {
        id: 'blank', n: null, source: 'No question', part: '',
        stem: 'Blank paper. Draw any wave you like and the page reads it back to you.',
        figure: null, timeBase: 1,
        want: null, marks: [], accept: null, report: null,
    },
];

export const COUNT = QUESTIONS.filter((q) => q.n).length;
export const questionAt = (i) => QUESTIONS[clamp(i, 0, QUESTIONS.length - 1)];
export const questionOf = (state) => questionAt(state.q);
export const figureOf = (state) => questionOf(state).figure || null;
export const isBlank = (state) => !questionOf(state).want;
export const totalMarks = (q) => q.marks.reduce((s, m) => s + (m.worth || 1), 0);
export const tagOf = (state) => {
    const q = questionOf(state);
    return q.n ? `${q.n}/${COUNT}` : 'blank';
};

// A clean wave written into the columns: the model answer laid over the
// grid, and the wave a test draws to prove the marking.
export function fillLine({ shape, periodMs: per, amp = 0.6, offset = 0, span, phase = 0, inverted = false }) {
    const out = new Array(COLS);
    const step = span / COLS;
    for (let i = 0; i < COLS; i += 1) {
        const ms = (i + 0.5) * step;
        const v = shapeAt(shape, ms / per + phase) * amp * (inverted ? -1 : 1) + offset;
        out[i] = clamp(v, -1, 1);
    }
    return out;
}

// ---- reading the drawing ---------------------------------------------------
// The longest run of columns the student actually drew.
function longestRun(line) {
    let best = null; let start = -1;
    for (let i = 0; i <= line.length; i += 1) {
        const on = i < line.length && line[i] != null;
        if (on && start < 0) start = i;
        if (!on && start >= 0) {
            const run = { from: start, to: i - 1, n: i - start };
            if (!best || run.n > best.n) best = run;
            start = -1;
        }
    }
    return best;
}

export const LAG_MIN = 0.1; // of the grid span
export const LAG_MAX = 0.6;

// The period by autocorrelation of the drawn line: detrended, normalised,
// candidate lags between a tenth and six tenths of the grid. A clear peak
// is a maximum that beats the trough before it; without one there is not
// enough wave on the paper to read, and the bench says so.
export function detectPeriod(line) {
    const run = longestRun(line);
    if (!run || run.n < 24) return { cols: null, why: 'blank' };
    const x = new Array(run.n);
    let mean = 0;
    for (let i = 0; i < run.n; i += 1) { x[i] = line[run.from + i]; mean += x[i]; }
    mean /= run.n;
    let ss = 0;
    for (let i = 0; i < run.n; i += 1) { x[i] -= mean; ss += x[i] * x[i]; }
    if (ss / run.n < 1e-4) return { cols: null, why: 'flat', run };
    const rms = Math.sqrt(ss / run.n);
    for (let i = 0; i < run.n; i += 1) x[i] /= rms;

    const kMin = Math.max(6, Math.round(LAG_MIN * COLS));
    const kMax = Math.min(run.n - 8, Math.round(LAG_MAX * COLS));
    if (kMax <= kMin) return { cols: null, why: 'short', run };
    // Normalised against the energy of both overlapping windows, so a long
    // lag is not flattered by having fewer samples under it: a lag that is
    // exactly one cycle scores 1, whatever the lag.
    const r = [];
    for (let k = kMin; k <= kMax; k += 1) {
        let s = 0; let ea = 0; let eb = 0;
        const n = run.n - k;
        for (let i = 0; i < n; i += 1) { s += x[i] * x[i + k]; ea += x[i] * x[i]; eb += x[i + k] * x[i + k]; }
        const d = Math.sqrt(ea * eb);
        r.push(d > 1e-9 ? s / d : 0);
    }
    // a clear peak: the highest local maximum, taken at the shortest lag
    // that comes within a whisker of it (so 2T never answers for T)
    let best = -Infinity;
    for (const v of r) if (v > best) best = v;
    if (best < 0.55) return { cols: null, why: 'unclear', run, best };
    let pick = -1;
    for (let i = 0; i < r.length; i += 1) {
        // the ends of the range count as peaks too, or a wave at the shortest
        // lag the bench looks at is answered for by twice its own period
        const before = i > 0 ? r[i - 1] : -Infinity;
        const after = i < r.length - 1 ? r[i + 1] : -Infinity;
        if (r[i] >= before && r[i] >= after && r[i] >= best * 0.92) { pick = i; break; }
    }
    if (pick < 0) return { cols: null, why: 'unclear', run, best };
    // parabolic refinement on the three points around the peak
    let adj = 0;
    if (pick > 0 && pick < r.length - 1) {
        const y0 = r[pick - 1]; const y1 = r[pick]; const y2 = r[pick + 1];
        const denom = y0 - 2 * y1 + y2;
        adj = Math.abs(denom) > 1e-9 ? clamp((0.5 * (y0 - y2)) / denom, -1, 1) : 0;
    }
    const cols = kMin + pick + adj;
    // A peak is only a period if the line comes back to it: there must be a
    // trough half way to it and a second peak at twice it, where the grid is
    // long enough to look. Without this, a wave too wide for the paper (one
    // and a bit cycles, the thing the 2025 report refuses) scores well at the
    // shortest lag the bench looks at, and the bench answers confidently with
    // a period five times too short.
    const rAt = (k) => { const i = Math.round(k) - kMin; return i >= 0 && i < r.length ? r[i] : null; };
    const peak = r[pick];
    const trough = rAt(cols * 1.5);
    const second = rAt(cols * 2);
    if (trough != null && trough > peak - 0.4) return { cols: null, why: 'unclear', run, best };
    if (second != null && second < peak - 0.35) return { cols: null, why: 'unclear', run, best };
    if (run.n < cols * 1.9) return { cols: null, why: 'short', run, best };
    return { cols, why: null, run, best: r[pick] };
}

// One cycle of the drawing, resampled to N points, with its mean taken off:
// the shape without the offset, so a wave drawn low is still named.
export function cycleOf(line, cols, run, N = 64) {
    if (!cols || !run) return null;
    const out = new Float64Array(N);
    const start = run.from;
    let mean = 0;
    for (let i = 0; i < N; i += 1) {
        const pos = start + (i / N) * cols;
        const a = Math.floor(pos);
        const t = pos - a;
        const v0 = line[clamp(a, run.from, run.to)];
        const v1 = line[clamp(a + 1, run.from, run.to)];
        out[i] = v0 + (v1 - v0) * t;
        mean += out[i];
    }
    mean /= N;
    for (let i = 0; i < N; i += 1) out[i] -= mean;
    return out;
}

export const SHAPE_MIN = 0.8; // the score that earns a name

// The shape by cross-correlation of one cycle against the four templates at
// every phase, and at both polarities (the 2023 scheme allows an inverted
// saw; the 2024 paper asks for an inversion on purpose).
export function nameShape(cycle) {
    if (!cycle) return { shape: null, score: 0, inverted: false, phase: 0 };
    const N = cycle.length;
    let norm = 0;
    for (let i = 0; i < N; i += 1) norm += cycle[i] * cycle[i];
    norm = Math.sqrt(norm);
    if (norm < 1e-6) return { shape: null, score: 0, inverted: false, phase: 0 };
    let best = { shape: null, score: -Infinity, inverted: false, phase: 0 };
    for (const id of SHAPE_IDS) {
        const tpl = new Float64Array(N);
        let tn = 0; let tm = 0;
        for (let i = 0; i < N; i += 1) { tpl[i] = shapeAt(id, (i + 0.5) / N); tm += tpl[i]; }
        tm /= N;
        for (let i = 0; i < N; i += 1) { tpl[i] -= tm; tn += tpl[i] * tpl[i]; }
        tn = Math.sqrt(tn);
        for (let ph = 0; ph < N; ph += 1) {
            let dot = 0;
            for (let i = 0; i < N; i += 1) dot += cycle[i] * tpl[(i + ph) % N];
            const score = dot / (norm * tn);
            if (score > best.score) best = { shape: id, score, inverted: false, phase: ph / N };
            if (-score > best.score) best = { shape: id, score: -score, inverted: true, phase: ph / N };
        }
    }
    return best.score >= SHAPE_MIN ? best : { ...best, shape: null };
}

// A period is read off squared paper, so it is read to the paper's own
// ruling: a tenth of a division. Without this the column grid's own
// rounding writes 499 Hz where the scheme says 500.
export function snapMs(ms, span) {
    const step = span / DIVS / 10;
    return Math.round((Math.round(ms / step) * step) * 10000) / 10000;
}

// ---- the state the page holds ----------------------------------------------
// The question the student is on, the line they have drawn on the answer
// grid, and whether they have pressed Check. Nothing else: Back and Next
// carry only the index, so every question opens on clean paper.
export const emptyLine = () => new Array(COLS).fill(null);
export function stateAt(i) {
    return { q: clamp(Math.round(i), 0, QUESTIONS.length - 1), line: emptyLine(), checked: false };
}
export const INITIAL = stateAt(0);
export const spanOf = (state) => TIME_BASES[questionOf(state).timeBase].span;
export const msPerCol = (state) => spanOf(state) / COLS;

// One column written by the pointer, with the columns between the last one
// and this one filled in so a fast drag leaves no holes. A new stroke takes
// the marking off: a marked script cannot be half redrawn.
export function drawAt(state, col, y, fromCol = null, fromY = null) {
    const c = Math.round(col);
    if (!(c >= 0 && c < COLS)) return state;
    const line = state.line.slice();
    const v = clamp(y, -1, 1);
    if (fromCol != null && fromY != null && Math.abs(c - fromCol) > 1) {
        const a = Math.round(fromCol);
        const stepN = c > a ? 1 : -1;
        for (let i = a; i !== c; i += stepN) {
            if (i < 0 || i >= COLS) continue;
            const t = (i - a) / (c - a);
            line[i] = clamp(fromY + (v - fromY) * t, -1, 1);
        }
    }
    line[c] = v;
    return { ...state, line, checked: false };
}
export function clearLine(state) { return { ...state, line: emptyLine(), checked: false }; }
export function setChecked(state, on) { return Boolean(on) === state.checked ? state : { ...state, checked: Boolean(on) }; }

// Back and Next walk the twelve and the blank paper. Neither wraps: the
// first and the last say so by disabling their button.
export const canStep = (state, by) => (by < 0 ? state.q > 0 : state.q < QUESTIONS.length - 1);
export function stepQuestion(state, by) { return canStep(state, by) ? stateAt(state.q + by) : state; }
export const nextWord = (state) => {
    const at = questionAt(state.q + 1);
    if (state.q >= QUESTIONS.length - 1) return 'Next';
    return at.n ? 'Next' : 'Blank paper';
};

// ---- everything the page shows, from the line alone -------------------------
// A drag makes a new line array sixty times a second and several callers read
// it each render, so the answer is cached against the array itself: one
// autocorrelation an edit, not one a caller.
const READ_CACHE = new WeakMap();
export function read(state) {
    let byKey = READ_CACHE.get(state.line);
    if (!byKey) { byKey = new Map(); READ_CACHE.set(state.line, byKey); }
    const key = String(state.q);
    if (byKey.has(key)) return byKey.get(key);
    const value = computeRead(state);
    byKey.set(key, value);
    return value;
}

function computeRead(state) {
    const line = state.line;
    const span = spanOf(state);
    const det = detectPeriod(line);
    const run = det.run || longestRun(line);
    const drawn = run ? run.n / COLS : 0;
    let hi = -Infinity; let lo = Infinity;
    if (run) for (let i = run.from; i <= run.to; i += 1) { const v = line[i]; if (v > hi) hi = v; if (v < lo) lo = v; }
    const amplitude = run ? (hi - lo) / 2 : 0;
    const offset = run ? (hi + lo) / 2 : 0;
    const ms = det.cols ? snapMs(det.cols * (span / COLS), span) : null;
    const cycle = det.cols ? cycleOf(line, det.cols, run) : null;
    const named = nameShape(cycle);
    const f = figureOf(state);
    return {
        span,
        drawn,
        run,
        periodMs: ms,
        hz: ms ? hzOf(ms) : null,
        s: ms ? ms / 1000 : null,
        cycles: ms && run ? (run.n * (span / COLS)) / ms : 0,
        why: det.why,
        shape: named.shape,
        shapeScore: named.score,
        inverted: named.inverted,
        amplitude,
        offset,
        peak: Math.max(Math.abs(hi === -Infinity ? 0 : hi), Math.abs(lo === Infinity ? 0 : lo)),
        db: f && amplitude > 0 ? gainToDb(amplitude / f.amp) : null,
        heightWord: f && amplitude > 0 ? heightWord(gainToDb(amplitude / f.amp)) : null,
        cycle,
    };
}

// The wave the scheme draws, laid over the grid in dashes when the page is
// checked.
export function answerOf(state) {
    const q = questionOf(state);
    if (!q.want) return null;
    const f = q.figure;
    const w = q.want;
    const shape = w.shape === 'any' ? 'sine' : w.shape;
    const per = w.periodMs === 'any' ? (f ? f.periodMs : 2) : w.periodMs;
    let amp = f ? f.amp : 0.55;
    if (w.louderThanDb) amp = Math.min(0.92, amp * dbToGain(6));
    // A question that accepts any period (2024 Q4(a), 2026 Q1(d) drawn any
    // shape) has no single wave to lay over the grid, and the page says so by
    // not drawing one.
    return { shape, periodMs: per, amp, offset: 0, inverted: Boolean(w.inverted), anyPeriod: w.periodMs === 'any', anyShape: w.shape === 'any' };
}

// ---- the marking ------------------------------------------------------------
// One scheme line is one mark entry, and a mark entry is earned when every
// criterion it names is met, which is how a one-mark line that asks for four
// things at once ("a louder square wave with period of 2ms and no DC offset")
// is marked the way the scheme marks it.
const CHECKS = {
    shape: {
        ok: (r, w) => (w.shape === 'any' ? r.shape != null : r.shape === w.shape),
        note: (r, w) => (r.shape
            ? `you drew ${SHAPES[r.shape].said}`
            : r.drawn > 0 ? 'the line is not one of the four shapes yet' : 'nothing drawn yet'),
    },
    period: {
        ok: (r, w) => r.periodMs != null && (w.periodMs === 'any' || Math.abs(r.periodMs - w.periodMs) / w.periodMs <= PERIOD_TOL),
        note: (r, w, ok) => (r.periodMs == null
            ? 'no whole cycle to measure yet'
            : w.periodMs === 'any' || ok
                ? `you drew one cycle every ${fmtMs(r.periodMs)}`
                : `you drew ${fmtMs(r.periodMs)}, and the scheme wants ${fmtMs(w.periodMs)}`),
    },
    polarity: {
        ok: (r) => r.shape != null && r.inverted === true,
        note: (r) => (r.shape == null ? 'no shape to turn over yet' : r.inverted ? 'your wave runs the other way up' : 'your wave runs the same way up as the figure'),
    },
    louder: {
        ok: (r) => r.db != null && r.db >= LOUDER_DB,
        note: (r) => (r.db == null ? 'nothing drawn to measure' : `${fmtDb(r.db)} on the figure: ${r.heightWord}`),
    },
    sameAmp: {
        ok: (r) => r.db != null && Math.abs(r.db) <= SAME_AMP_TOL,
        note: (r) => (r.db == null ? 'nothing drawn to measure' : `${fmtDb(r.db)} on the figure: ${r.heightWord}`),
    },
    amplitude: {
        ok: (r) => r.amplitude > 0.08,
        note: (r) => (r.amplitude > 0.08 ? `centre line to peak: ${Math.round(r.amplitude * 100)} per cent of the grid` : 'nothing drawn to measure'),
    },
    noOffset: {
        ok: (r) => Math.abs(r.offset) <= OFFSET_TOL,
        note: (r) => (Math.abs(r.offset) <= OFFSET_TOL ? 'your wave sits on the centre line' : `your wave sits ${r.offset > 0 ? 'above' : 'below'} the centre line: a DC offset`),
    },
    axes: {
        ok: () => true,
        note: () => 'the axes are printed on this paper, so the scheme gives you these',
    },
};

export function marksFor(state) {
    const q = questionOf(state);
    if (!q.want) return [];
    const r = read(state);
    return q.marks.map((m) => {
        const failed = m.checks.find((c) => !CHECKS[c].ok(r, q.want));
        const said = failed || m.checks[0];
        return {
            id: m.id,
            words: m.words,
            worth: m.worth || 1,
            ok: !failed,
            note: CHECKS[said].note(r, q.want, !failed),
        };
    });
}

export function scoreOf(state) {
    const q = questionOf(state);
    const marks = marksFor(state);
    return { got: marks.filter((m) => m.ok).reduce((s, m) => s + m.worth, 0), total: totalMarks(q) };
}

// One word for the page and for its gate.
export function verdict(state) {
    const q = questionOf(state);
    const r = read(state);
    if (r.drawn === 0) return 'blank';
    if (r.periodMs == null) return r.why === 'flat' ? 'flat' : r.why === 'short' ? 'short' : 'unclear';
    if (!q.want) return 'read';
    const { got, total } = scoreOf(state);
    return got === total ? 'full' : got > 0 ? 'partial' : 'none';
}
