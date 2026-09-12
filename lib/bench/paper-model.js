// Squared Paper (2.5): the model behind the drawing.
//
// The written paper hands a candidate a grid marked "Displacement" up the
// side and "Time (ms)" along the bottom, five divisions across, and asks
// for a wave on it. This file is that paper as arithmetic: the line the
// student drew stored as one displacement per column, the period read off
// it by autocorrelation, the shape named by cross-correlating one cycle
// against the four the spec lists, the height measured against the figure
// the question gave, and the check each year's mark scheme makes. No audio
// node in this file; SquaredPaper.jsx plays it.
//
// The numeracy is the bench's, never the student's (the 2.5 law the
// Oscilloscope set on 30 Aug 2026): the student draws, the bench measures.
// Every scheme line quoted in paper-depth.js comes from the 9MT0/04 and
// 9MT0/41 mark schemes in the vault, 2019 to 2026.

export const DIVS = 5; // the paper's figure: five divisions across
export const COLS = 240; // one displacement per column: 48 columns a division

// The screen is the paper's five divisions; the chip says what a division
// is worth. 1 ms is the figure every paper prints; 2 ms is there because a
// 4 ms or 5 ms answer needs two cycles of room to be read (2025 Q3(c)(vii),
// 2026 Q1(d)).
export const TIME_BASE_IDS = [1, 2];
export const TIME_BASES = Object.fromEntries(TIME_BASE_IDS.map((ms) => [ms, { id: ms, label: `${ms} ms`, ms, span: ms * DIVS }]));
export const spanOf = (state) => TIME_BASES[state.timeBase].span;
export const msPerCol = (state) => spanOf(state) / COLS;

// The four shapes the spec names and the paper draws. `at` is the ideal
// wave at a phase from 0 to 1, on the paper's own scale of −1 to +1.
export const SHAPE_IDS = ['sine', 'square', 'saw', 'triangle'];
export const SHAPES = {
    sine: { id: 'sine', label: 'Sine', said: 'a sine wave', osc: 'sine', colour: 'var(--teal)', at: (p) => Math.sin(2 * Math.PI * p) },
    square: { id: 'square', label: 'Square', said: 'a square wave', osc: 'square', colour: 'var(--gen-3)', at: (p) => (p < 0.5 ? 1 : -1) },
    saw: { id: 'saw', label: 'Saw', said: 'a saw wave', osc: 'sawtooth', colour: 'var(--gen-4)', at: (p) => 2 * p - 1 },
    triangle: { id: 'triangle', label: 'Triangle', said: 'a triangle wave', osc: 'triangle', colour: 'var(--gen-6)', at: (p) => (p < 0.25 ? 4 * p : p < 0.75 ? 2 - 4 * p : 4 * p - 4) },
};
export const shapeAt = (id, p) => SHAPES[id].at(((p % 1) + 1) % 1);

// The period chips: the keyboard's route to the answer, and the way to
// compare. An octave lower is double; an octave higher is half.
export const PERIOD_IDS = ['half', 'as', 'double'];
export const PERIODS = {
    half: { id: 'half', label: 'Halve', short: 'half', factor: 0.5, said: 'an octave higher' },
    as: { id: 'as', label: 'As given', short: 'as given', factor: 1, said: 'the same pitch' },
    double: { id: 'double', label: 'Double', short: 'double', factor: 2, said: 'an octave lower' },
};

export const HEIGHT_MIN = -12;
export const HEIGHT_MAX = 12;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const clamp01 = (v) => clamp(v, 0, 1);

// ---- the ladder, shared with the Oscilloscope's wording --------------------
export const periodMs = (hz) => 1000 / hz;
export const periodS = (hz) => 1 / hz;
export const hzOf = (ms) => 1000 / ms;
export function fmtHz(hz) { return hz >= 1000 ? `${(hz / 1000).toFixed(hz >= 10000 ? 1 : 2).replace(/\.?0+$/, '')} kHz` : `${hz < 100 ? hz.toFixed(1) : Math.round(hz)} Hz`; }
export function fmtMs(ms) { return ms >= 100 ? `${Math.round(ms)} ms` : ms >= 10 ? `${ms.toFixed(1)} ms` : `${ms.toFixed(2)} ms`; }
export function fmtS(s) { return s >= 0.1 ? `${s.toFixed(2)} s` : `${s.toFixed(4).replace(/0+$/, '')} s`; }
export function fmtDb(db) { return `${db > 0.05 ? '+' : ''}${db.toFixed(1)} dB`; }
export const dbToGain = (db) => 10 ** (db / 20);
export const gainToDb = (g) => 20 * Math.log10(Math.max(1e-6, g));
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
    const lower = n.cents < 0 ? NAMES[(((n.midi - 1) % 12) + 12) % 12] : n.name.replace(/-?\d+$/, '');
    const upper = n.cents < 0 ? n.name.replace(/-?\d+$/, '') : NAMES[((n.midi + 1) % 12) % 12];
    return `between ${lower} and ${upper}`;
}
export function heightWord(db) {
    if (db >= 5 && db <= 7.5) return 'twice the height';
    if (db > 7.5) return 'more than twice the height';
    if (db <= -5 && db >= -7.5) return 'half the height';
    if (db < -7.5) return 'less than half the height';
    if (Math.abs(db) < 1.5) return 'the same height';
    return db > 0 ? 'taller' : 'shorter';
}

// ---- the given figures the papers print ------------------------------------
// A given is the question's own Figure: a wave already on the left grid.
// `amp` is the height from the centre line to the peak, as a fraction of
// the grid's half height, so the paper's figure and a student's drawing are
// measured on one scale.
export const GIVENS = {
    square1: { shape: 'square', periodMs: 1, amp: 0.6, caption: 'Figure: a square wave, period 1 ms' },
    square2: { shape: 'square', periodMs: 2, amp: 0.5, caption: 'Figure 1: a square wave' },
    sine2: { shape: 'sine', periodMs: 2, amp: 0.6, caption: 'Figure: a sine wave, period 2 ms' },
};

// ---- the questions, quoted -------------------------------------------------
// Every `scheme` string is the mark scheme's own wording; every `stem` is
// the question paper's. Sources in paper-depth.js's Q table.
export const TASKS = {
    lower2023: {
        id: 'lower2023', name: '2023: an octave lower', year: 2023, ref: '2023 Q2(e)(ii)',
        stem: 'On the graph below, draw a saw wave one octave lower.',
        want: { shape: 'saw', periodMs: 2, offset: 'any', amp: 'any' },
        marks: [{ id: 'shape', words: 'Saw wave (1) (allow inverted saw wave)' }, { id: 'period', words: 'Period of 2ms (1)' }],
    },
    louder2025: {
        id: 'louder2025', name: '2025: louder', year: 2025, ref: '2025 Q3(c)(vi)',
        stem: 'On the graph below, draw the same wave as in Figure 1, but louder.',
        want: { shape: 'square', periodMs: 2, louderThanDb: 3, offset: 'none' },
        marks: [{ id: 'shape', words: 'a louder square wave' }, { id: 'period', words: 'with period of 2ms' }, { id: 'height', words: 'louder' }, { id: 'offset', words: 'and no DC offset' }],
    },
    lower2025: {
        id: 'lower2025', name: '2025: an octave lower', year: 2025, ref: '2025 Q3(c)(vii)',
        stem: 'On the graph below, draw the same wave as in Figure 1, but an octave lower.',
        want: { shape: 'square', periodMs: 4, sameAmp: true, offset: 'none' },
        marks: [{ id: 'shape', words: 'a square wave' }, { id: 'height', words: 'with same amplitude as figure 1' }, { id: 'period', words: 'and period of 4ms' }, { id: 'offset', words: 'and no DC offset' }],
    },
    label2024: {
        id: 'label2024', name: '2024: label it', year: 2024, ref: '2024 Q4(a)',
        stem: 'Draw a square wave. Label the axes. Label the amplitude of the wave. Label the period of the wave.',
        want: { shape: 'square', periodMs: 'any', offset: 'any' },
        marks: [{ id: 'shape', words: 'Waveshape (1)' }, { id: 'axes', words: 'Voltage / V / displacement (1); s / ms / time (1)' }, { id: 'height', words: 'amplitude (1). Allow peak to peak amplitude' }, { id: 'period', words: 'Period (1)' }],
    },
    kick2026: {
        id: 'kick2026', name: '2026: 200 Hz', year: 2026, ref: '2026 Q1(d)',
        stem: 'The kick drum starts at about 200 Hz. Draw a wave at that frequency on the answer paper.',
        want: { shape: 'any', periodMs: 5, offset: 'any' },
        marks: [{ id: 'period', words: '1/200 (1); 0.005 / 5x10-3 (1); then 5 (1)' }],
    },
    higher: {
        id: 'higher', name: 'An octave higher', year: null, ref: 'the Numeracy chapter',
        stem: 'The figure is a sine wave with a period of 2 ms. Draw the same wave one octave higher.',
        want: { shape: 'sine', periodMs: 1, offset: 'any' },
        marks: [{ id: 'shape', words: 'the same shape' }, { id: 'period', words: 'half the period: 1 ms' }],
    },
    kept: {
        id: 'kept', name: 'Judge: the period kept', year: 2023, ref: '2023 Q2(e)(ii), the report',
        stem: 'A candidate answered the 2023 question with this. Mark it the way the scheme does.',
        want: { shape: 'saw', periodMs: 2, offset: 'any', amp: 'any' },
        marks: [{ id: 'shape', words: 'Saw wave (1) (allow inverted saw wave)' }, { id: 'period', words: 'Period of 2ms (1)' }],
    },
};
export const TASK_IDS = Object.keys(TASKS);

// The presets are the seven papers' questions in teaching order, numbered
// on the chip and on the stage ("1 of 7"), plus the blank paper, which
// carries no number because it asks nothing (Mike, 12 Sep 2026: "if I get
// something wrong, how do I go to the next question?").
export const PRESETS = [
    { id: 'lower2023', num: 1, name: '2023: an octave lower', task: 'lower2023', blurb: 'The 2023 drawing: a square wave with a 1 ms period is given, and the answer is a saw wave with a 2 ms period', set: { given: 'square1', timeBase: 1 } },
    { id: 'louder2025', num: 2, name: '2025: louder', task: 'louder2025', blurb: 'The 2025 figure drawn louder: the same square, the same 2 ms period, a taller wave and no DC offset', set: { given: 'square2', timeBase: 1 } },
    { id: 'lower2025', num: 3, name: '2025: an octave lower', task: 'lower2025', blurb: 'The same 2025 figure an octave lower: a square wave at 4 ms, the same height, no DC offset. The screen opens to 2 ms a division so two cycles fit', set: { given: 'square2', timeBase: 2 } },
    { id: 'label2024', num: 4, name: '2024: label it', task: 'label2024', blurb: 'The 2024 question: a blank grid, a square wave of your own, and the bench labels the axes, the amplitude and the period the way the scheme marks them', set: { given: null, timeBase: 1 } },
    { id: 'kick2026', num: 5, name: '2026: 200 Hz', task: 'kick2026', blurb: 'The 2026 kick drum: draw a wave at 200 Hz. The bench reads the period back in ms and in seconds', set: { given: null, timeBase: 2 } },
    { id: 'higher', num: 6, name: 'An octave higher', task: 'higher', blurb: 'The chapter\'s own exercise: a 2 ms sine is given, and an octave higher halves the period to 1 ms', set: { given: 'sine2', timeBase: 1 } },
    { id: 'kept', num: 7, name: 'Judge: the period kept', task: 'kept', blurb: 'The error the 2023 report names most often: the right shape at the wrong period. Mark it and see where the mark goes', set: { given: 'square1', timeBase: 1, fill: { shape: 'saw', periodMs: 1, amp: 0.6, offset: 0 } } },
    { id: 'blank', name: 'Blank paper', task: null, blurb: 'No question and no figure: draw anything and the bench reads its shape, its period and its height back to you', set: { given: null, timeBase: 1 } },
];

// ---- the seven questions, in order -----------------------------------------
// A student who gets one wrong has to be able to walk to the next one, so
// the papers' presets are a numbered sequence: "1 of 7" on the stage, Next
// and Back beside it. The blank paper sits outside the count.
export const QUESTION_IDS = PRESETS.filter((p) => p.task).map((p) => p.task);
export const QUESTION_COUNT = QUESTION_IDS.length;
export const questionIndex = (state) => QUESTION_IDS.indexOf(state.task);
export const presetForTask = (taskId) => PRESETS.find((p) => p.task === taskId) || null;

// The question in one line, the paper's own words: the stage prints it
// above the grids at every level and the marks panel prints the same
// string, so the two can never disagree (Mike, 12 Sep 2026: "you're not
// very accurate with your instructions on this").
export function stemOf(state) {
    const task = taskOf(state);
    const i = questionIndex(state);
    if (!task || i < 0) {
        return { ask: 'Draw anything and the bench reads it back.', where: 'Blank paper', n: null, of: QUESTION_COUNT, tag: '' };
    }
    return { ask: task.stem, where: task.ref, n: i + 1, of: QUESTION_COUNT, tag: `${i + 1}/${QUESTION_COUNT}` };
}

// Next and Back walk the seven. Next from the blank paper, or from the last
// question, starts the walk again at one; Back from the first or from the
// blank paper has nowhere to go, and the button says so by being disabled.
export const canStep = (state, by) => {
    const i = questionIndex(state);
    if (by < 0) return i > 0;
    return true;
};
export function stepQuestion(state, by) {
    const i = questionIndex(state);
    if (by < 0) {
        if (i <= 0) return state;
        return applyPreset(state, presetForTask(QUESTION_IDS[i - 1]).id);
    }
    const next = i < 0 || i >= QUESTION_COUNT - 1 ? 0 : i + 1;
    return applyPreset(state, presetForTask(QUESTION_IDS[next]).id);
}
export const nextWord = (state) => {
    const i = questionIndex(state);
    if (i < 0) return 'Question 1';
    return i < QUESTION_COUNT - 1 ? 'Next question' : 'Start again';
};

// ---- state -----------------------------------------------------------------
export const emptyLine = () => new Array(COLS).fill(null);

function baseState() {
    return {
        given: 'square1',
        timeBase: 1,
        line: emptyLine(),
        showAnswer: false,
        task: 'lower2023',
        presetId: 'lower2023',
        volume: 0.5,
        target: 'given', // which of the three the Play column sounds
    };
}

// A clean wave written into the columns: the keyboard's route to a drawing,
// and what a preset's `fill` lays down.
export function fillLine({ shape, periodMs: per, amp = 0.6, offset = 0, span, phase = 0 }) {
    const out = new Array(COLS);
    const step = span / COLS;
    for (let i = 0; i < COLS; i += 1) {
        const ms = (i + 0.5) * step;
        const v = shapeAt(shape, ms / per + phase) * amp + offset;
        out[i] = clamp(v, -1, 1);
    }
    return out;
}

export function applyPreset(state, id) {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return state;
    const next = { ...baseState(), volume: state.volume, ...p.set, task: p.task, presetId: id, showAnswer: false, target: p.set.given ? 'given' : 'yours' };
    next.line = p.set.fill ? fillLine({ ...p.set.fill, span: TIME_BASES[next.timeBase].span }) : emptyLine();
    return next;
}
export const DEFAULT_STATE = applyPreset(baseState(), 'lower2023');

const drop = (state) => ({ ...state, presetId: null, showAnswer: state.showAnswer });

// One column written by the pointer, with the columns between the last one
// and this one filled in so a fast drag leaves no holes.
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
    return { ...drop(state), line };
}
export function clearLine(state) { return { ...drop(state), line: emptyLine(), showAnswer: state.showAnswer }; }
export function setTimeBase(state, ms) {
    if (!TIME_BASES[ms] || ms === state.timeBase) return state;
    // the drawing is a set of readings against time, so it keeps its shape
    // and its period when the screen opens: the columns are re-sampled.
    const before = spanOf(state);
    const after = TIME_BASES[ms].span;
    const line = new Array(COLS).fill(null);
    for (let i = 0; i < COLS; i += 1) {
        const ms2 = (i + 0.5) * (after / COLS);
        const j = Math.round((ms2 / before) * COLS - 0.5);
        line[i] = j >= 0 && j < COLS ? state.line[j] : null;
    }
    return { ...state, timeBase: ms, line };
}
export function setShape(state, shape) {
    if (!SHAPES[shape]) return state;
    const r = read(state);
    const per = r.periodMs || (givenOf(state)?.periodMs ?? spanOf(state) / 2.5);
    const amp = r.amplitude || givenOf(state)?.amp || 0.6;
    return { ...drop(state), line: fillLine({ shape, periodMs: per, amp, offset: 0, span: spanOf(state) }) };
}
export function setPeriod(state, id) {
    const p = PERIODS[id];
    if (!p) return state;
    const g = givenOf(state);
    const r = read(state);
    const shape = r.shape || g?.shape || 'square';
    const amp = r.amplitude || g?.amp || 0.6;
    const base = g ? g.periodMs : r.periodMs || spanOf(state) / 2.5;
    return { ...drop(state), line: fillLine({ shape, periodMs: base * p.factor, amp, offset: 0, span: spanOf(state) }) };
}
export function setHeight(state, db) {
    const v = clamp(Math.round(db * 2) / 2, HEIGHT_MIN, HEIGHT_MAX);
    const g = givenOf(state);
    const r = read(state);
    const shape = r.shape || g?.shape || 'square';
    const per = r.periodMs || g?.periodMs || spanOf(state) / 2.5;
    const base = g ? g.amp : 0.5;
    return { ...drop(state), line: fillLine({ shape, periodMs: per, amp: clamp(base * dbToGain(v), 0.05, 1), offset: 0, span: spanOf(state) }) };
}
export function setShowAnswer(state, on) { return on === state.showAnswer ? state : { ...state, showAnswer: Boolean(on) }; }
export function setTarget(state, target) { return target === state.target ? state : { ...state, target }; }
export function setVolume(state, volume) { return { ...state, volume: clamp01(volume) }; }

export const givenOf = (state) => (state.given ? GIVENS[state.given] : null);
export const taskOf = (state) => (state.task ? TASKS[state.task] : null);

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

// The first eight harmonics of one cycle, normalised so the fundamental is
// 1: the Extension picture, and the tie to Synthesis chapter 1.
export const HARMONICS = 8;
export function harmonicsOf(cycle) {
    if (!cycle) return null;
    const N = cycle.length;
    const out = [];
    for (let n = 1; n <= HARMONICS; n += 1) {
        let re = 0; let im = 0;
        for (let i = 0; i < N; i += 1) {
            const w = (2 * Math.PI * n * (i + 0.5)) / N;
            re += cycle[i] * Math.cos(w);
            im -= cycle[i] * Math.sin(w);
        }
        out.push((2 * Math.hypot(re, im)) / N);
    }
    const f = out[0];
    return f > 1e-9 ? out.map((v) => v / f) : out.map(() => 0);
}
// The same eight for an ideal shape, so the drawing's bars stand beside the
// shape they were named as.
export function idealHarmonics(id) {
    const N = 512;
    const cyc = new Float64Array(N);
    for (let i = 0; i < N; i += 1) cyc[i] = shapeAt(id, (i + 0.5) / N);
    return harmonicsOf(cyc);
}

// A period is read off squared paper, so it is read to the paper's own
// ruling: a tenth of a division. Without this the column grid's own
// rounding writes 499 Hz where the scheme says 500.
export function snapMs(ms, span) {
    const step = span / DIVS / 10;
    return Math.round((Math.round(ms / step) * step) * 10000) / 10000;
}

// Everything the console and the stage show, from the line alone. A drag
// makes a new line array sixty times a second and a dozen callers read it
// each render, so the answer is cached against the array itself: one
// autocorrelation an edit, not one a caller.
const READ_CACHE = new WeakMap();
export function read(state) {
    let byKey = READ_CACHE.get(state.line);
    if (!byKey) { byKey = new Map(); READ_CACHE.set(state.line, byKey); }
    const key = `${state.timeBase}:${state.given || ''}`;
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
    const g = givenOf(state);
    return {
        span,
        drawn,
        run,
        periodMs: ms,
        hz: ms ? hzOf(ms) : null,
        s: ms ? ms / 1000 : null,
        cycles: ms && run ? (run.n * (span / COLS)) / ms : 0,
        why: det.why,
        peakScore: det.best || 0,
        shape: named.shape,
        shapeScore: named.score,
        inverted: named.inverted,
        amplitude,
        offset,
        peak: Math.max(Math.abs(hi === -Infinity ? 0 : hi), Math.abs(lo === Infinity ? 0 : lo)),
        db: g && amplitude > 0 ? gainToDb(amplitude / g.amp) : null,
        // the same height against a half-grid reference, so the Height dial
        // reads honestly on the questions that print no figure
        dbAny: amplitude > 0 ? gainToDb(amplitude / (g ? g.amp : 0.5)) : null,
        heightWord: g && amplitude > 0 ? heightWord(gainToDb(amplitude / g.amp)) : null,
        cycle,
        harmonics: harmonicsOf(cycle),
        ideal: named.shape ? idealHarmonics(named.shape) : null,
        note: ms ? noteOf(hzOf(ms)) : null,
        noteWord: ms ? noteWord(hzOf(ms)) : null,
    };
}

// ---- the scheme's answer, and the marking ----------------------------------
export const PERIOD_TOL = 0.12; // a hand-drawn line: within about a tenth
export const OFFSET_TOL = 0.08; // of the grid's half height
export const SAME_AMP_TOL = 3; // dB, for "same amplitude as figure 1"

// The wave the scheme draws, for the gold overlay and for The answer button.
export function answerOf(state) {
    const task = taskOf(state);
    const g = givenOf(state);
    if (!task) return null;
    const w = task.want;
    const shape = w.shape === 'any' ? 'sine' : w.shape;
    const per = w.periodMs === 'any' ? (g ? g.periodMs : 2) : w.periodMs;
    let amp = g ? g.amp : 0.6;
    if (w.louderThanDb) amp = Math.min(0.92, amp * dbToGain(6));
    return { shape, periodMs: per, amp, offset: 0, anyShape: w.shape === 'any', anyPeriod: w.periodMs === 'any' };
}

// One mark, the way the scheme writes it.
function mark(id, words, ok, note) { return { id, words, ok, note }; }

export function marksFor(state) {
    const task = taskOf(state);
    const r = read(state);
    const g = givenOf(state);
    if (!task) return [];
    const w = task.want;
    const out = [];
    for (const m of task.marks) {
        if (m.id === 'shape') {
            if (w.shape === 'any') out.push(mark('shape', m.words, r.shape != null, r.shape ? `${SHAPES[r.shape].said}, any shape is allowed` : 'no shape the bench can name yet'));
            else out.push(mark('shape', m.words, r.shape === w.shape, r.shape ? `you drew ${SHAPES[r.shape].said}${r.inverted && r.shape === 'saw' ? ', inverted, which the scheme allows' : ''}` : 'the line is not one of the four yet'));
        } else if (m.id === 'period') {
            const want = w.periodMs === 'any' ? null : w.periodMs;
            const ok = r.periodMs != null && (want == null || Math.abs(r.periodMs - want) / want <= PERIOD_TOL);
            out.push(mark('period', m.words, ok, r.periodMs == null ? 'no period to read yet' : want == null ? `one cycle every ${fmtMs(r.periodMs)}` : `you drew ${fmtMs(r.periodMs)}${ok ? '' : `, and the scheme wants ${fmtMs(want)}`}`));
        } else if (m.id === 'height') {
            if (w.louderThanDb) {
                const ok = r.db != null && r.db >= w.louderThanDb;
                out.push(mark('height', m.words, ok, r.db == null ? 'nothing drawn to measure' : `${fmtDb(r.db)} on the figure: ${r.heightWord}`));
            } else if (w.sameAmp) {
                const ok = r.db != null && Math.abs(r.db) <= SAME_AMP_TOL;
                out.push(mark('height', m.words, ok, r.db == null ? 'nothing drawn to measure' : `${fmtDb(r.db)} on the figure: ${r.heightWord}`));
            } else {
                const ok = r.amplitude > 0.08;
                out.push(mark('height', m.words, ok, ok ? `centre line to peak: ${(r.amplitude * 100).toFixed(0)} per cent of the grid` : 'nothing drawn to measure'));
            }
        } else if (m.id === 'offset') {
            const ok = Math.abs(r.offset) <= OFFSET_TOL;
            out.push(mark('offset', m.words, ok, ok ? 'the wave sits on the centre line' : `the wave sits ${r.offset > 0 ? 'above' : 'below'} the centre line: a DC offset`));
        } else if (m.id === 'axes') {
            out.push(mark('axes', m.words, true, 'the paper\'s own axes are printed for you'));
        }
    }
    // A DC offset costs nothing where the scheme says "Accept DC offset",
    // but it is still the error the reports name, so it is always said.
    if (w.offset === 'any' && Math.abs(r.offset) > OFFSET_TOL) {
        out.push(mark('note', 'Accept DC offset', true, `the wave sits ${r.offset > 0 ? 'above' : 'below'} the centre line; this scheme allows it, the 2025 one does not`));
    }
    return out;
}

// One word for the stage, the console and the gate.
export function verdict(state) {
    const task = taskOf(state);
    const r = read(state);
    if (!task) {
        if (r.drawn === 0) return { key: 'blank', ok: null };
        if (r.periodMs == null) return { key: r.why === 'flat' ? 'flat' : r.why === 'unclear' ? 'unclear' : 'short', ok: null };
        return { key: 'read', ok: null };
    }
    if (r.drawn === 0) return { key: 'blank', ok: false };
    if (r.periodMs == null) return { key: r.why === 'flat' ? 'flat' : r.why === 'unclear' ? 'unclear' : 'short', ok: false };
    const ms = marksFor(state);
    const scored = ms.filter((m) => m.id !== 'note' && m.id !== 'axes');
    const bad = scored.filter((m) => !m.ok);
    if (!bad.length) return { key: 'directed', ok: true };
    const g = givenOf(state);
    const first = bad[0];
    if (first.id === 'period' && g && Math.abs(r.periodMs - g.periodMs) / g.periodMs <= PERIOD_TOL) return { key: 'period-kept', ok: false };
    return { key: `wrong-${first.id}`, ok: false };
}
