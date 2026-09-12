// Squared Paper's three levels, as three jobs (the pattern set on the Delay
// bench, 27 Aug 2026, and three PICTURES since the Dynamics bench, 28 Aug):
//
//   Core       the bench SHOWS: it names what you drew and says what to try.
//              The period is a width, an octave a doubling of it, louder a
//              height. No arithmetic on the screen.
//   A-level    the bench MARKS the way the scheme does: each mark in the
//              scheme's own wording with its year, ticked or not, and the
//              ladder (ms to s to Hz) for the period you drew.
//   Extension  the bench OPENS THE MACHINE: the drawn cycle's first eight
//              harmonics beside the named shape's, which is why a square
//              sounds hollow and a saw buzzes (1.3 Synthesis chapter 1).
//
// Every scheme line quoted below is the mark scheme's own wording, from the
// 9MT0/04 and 9MT0/41 papers in the vault: 2023 Q2(e), 2024 Q4(a), 2025
// Q3(c)(vi) and (vii), 2026 Q1(d). The examiner reports quoted are the
// matching pef documents. Pure functions over the model; SquaredPaper.jsx
// renders them.

import {
    SHAPES,
    fmtHz, fmtMs, fmtS, fmtDb, givenOf, taskOf, read, verdict, marksFor,
} from './paper-model.js';

export const DEPTH_LINES = {
    core: 'the bench names what you drew and tells you what to try next. The stage is the paper\'s own grid: the question\'s figure at the left, your answer paper at the right. Draw on it with the pointer, or fill it from the Shape and Period chips, and press Yours to hear the line you drew.',
    alevel: 'the bench now marks your paper the way the scheme does: the shape, the period and the height as separate marks in the scheme\'s own wording with its year, each ticked or not, and the ladder from the width you drew to the frequency it gives.',
    extension: 'the bench opens the machine: your cycle\'s first eight harmonics stand beside the ideal shape\'s, so a square shows the odd harmonics only and a saw shows every one. That is the same picture the Synthesis chapter draws for the four waveforms.',
};

export const DEPTH_TEACH = {
    alevel: 'Say the shape first, then the period, then the height: the scheme marks them separately.',
    extension: 'The harmonics are not on the paper. They are why the four shapes sound different.',
};

const seg = (ao, text) => ({ ao, text });
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const cyclesWord = (c) => `${Math.round(c * 10) / 10} cycles`;

// ---- the schemes, quoted ---------------------------------------------------
export const Q = {
    lower2023: '"Saw wave (1); Period of 2ms (1) ... Accept different amplitude" (2023)',
    report2023: 'The 2023 report: "Very few candidates knew that an octave lower was double the period"',
    offset2023: 'The 2023 report: "Many candidates drew the same wave lower on the graph, i.e. with a negative DC offset"',
    shape2023: 'The 2023 report: "a very common error was drawing another square wave, not a saw wave"',
    louder2025: '"a louder square wave with period of 2ms and no DC offset" (2025)',
    lower2025: '"a square wave with same amplitude as figure 1 and period of 4ms and no DC offset" (2025)',
    report2025: 'The 2025 report: "Around half of candidates drew a wave with double the period"',
    onecycle2025: 'The 2025 report: "Some candidates only drew one cycle ... so did not score credit"',
    label2024: '"Waveshape (1) ... amplitude (1). Allow peak to peak amplitude ... Period (1)" (2024)',
    report2024: 'The 2024 report: period was "often labelled ... half a cycle rather than a complete cycle"',
    kick2026: '"1/200 (1); 0.005 / 5x10-3 (1)", then "5 (1)" (2026)',
    report2026: 'The 2026 report: "a common error ... was to incorrectly convert from seconds to milliseconds"',
    octave2019: '"294*2 / 294+294 (1); 588 (Hz) (2)" (2019)',
};
const ladder = (ms) => `T = ${fmtMs(ms)} = ${fmtS(ms / 1000)}; f = 1 ÷ T = ${fmtHz(1000 / ms)}`;

// ---- Core: what you drew, and the next move --------------------------------
export function drawingLine(state) {
    const r = read(state);
    const g = givenOf(state);
    if (r.drawn === 0) return `The answer paper is blank. ${g ? `The figure at the left is ${SHAPES[g.shape].said}, one cycle every ${fmtMs(g.periodMs)}.` : 'Draw any wave on it and the bench will read it back.'}`;
    if (r.periodMs == null) {
        const why = r.why === 'flat' ? 'the line is flat, so there is no cycle to measure' : 'the bench cannot find a cycle that repeats';
        return `You drew a line across ${Math.round(r.drawn * 100)} per cent of the paper, and ${why}. Two whole cycles side by side is what the bench reads, and what the 2025 report says a candidate must draw.`;
    }
    const shape = r.shape ? `${SHAPES[r.shape].said}${r.inverted && r.shape === 'saw' ? ', inverted' : ''}` : 'a wave that is not one of the four';
    const cmp = g
        ? ` The figure is ${fmtMs(g.periodMs)} a cycle, so yours is ${widthWord(r.periodMs / g.periodMs)}${r.db != null ? ` and ${r.heightWord}` : ''}.`
        : '';
    const off = Math.abs(r.offset) > 0.08 ? ` It sits ${r.offset > 0 ? 'above' : 'below'} the centre line, which is a DC offset.` : '';
    return `You drew ${shape}: one cycle every ${fmtMs(r.periodMs)}, ${cyclesWord(r.cycles)} on the paper.${cmp}${off}`;
}

function widthWord(ratio) {
    if (ratio > 1.8 && ratio < 2.2) return 'twice as wide: an octave lower';
    if (ratio > 0.45 && ratio < 0.56) return 'half as wide: an octave higher';
    if (ratio > 0.9 && ratio < 1.1) return 'the same width, so the same pitch';
    return ratio > 1 ? `${(Math.round(ratio * 10) / 10)} times as wide, so lower` : `${(Math.round((1 / ratio) * 10) / 10)} times narrower, so higher`;
}

const PRESET_MOVES = {
    lower2023: 'press Saw, then Double: the paper fills with the wave the scheme draws, twice as wide as the figure',
    louder2025: 'turn the Height dial up to +6 dB and watch the wave grow taller while its width stays put',
    lower2025: 'press Double and count the cycles: two of them now, where the figure had five',
    label2024: 'draw a square wave anywhere on the paper, then switch to A-level: the bench labels the period and the amplitude the way the scheme wants them',
    kick2026: 'press Sine, then drag the wave until the bench reads 5 ms a cycle: that is 200 Hz',
    higher: 'press Halve: the wave squeezes to half its width and the note jumps an octave',
    kept: 'switch to A-level and read which of the two marks this candidate lost',
    blank: 'draw two cycles of anything and watch the bench name the shape and read the period',
};
export function nextMove(state) {
    const r = read(state);
    const v = verdict(state);
    if (r.drawn === 0 && state.presetId && PRESET_MOVES[state.presetId]) return PRESET_MOVES[state.presetId];
    if (v.key === 'short' || v.key === 'unclear') return 'draw at least two whole cycles side by side, so the bench has a repeat to measure';
    if (v.key === 'flat') return 'draw a wave rather than a straight line: something that goes up and comes back down';
    if (v.key === 'blank') return 'draw two cycles of a wave on the answer paper and the bench will read it back';
    if (r.shape == null) return 'make the cycles match each other: the bench names a shape when it looks like one of the four';
    if (state.presetId && PRESET_MOVES[state.presetId]) return PRESET_MOVES[state.presetId];
    if (!state.showAnswer && taskOf(state)) return 'press Show answer and lay the scheme\'s wave over yours';
    return 'switch to A-level and read the marks beside your paper';
}

// ---- A-level: the marking --------------------------------------------------
const SCHEME = {
    lower2023: Q.lower2023,
    kept: Q.lower2023,
    louder2025: Q.louder2025,
    lower2025: Q.lower2025,
    label2024: Q.label2024,
    kick2026: Q.kick2026,
    higher: '"An octave higher halves it", the Numeracy chapter on Drawing an Octave',
};
const REPORT = {
    lower2023: Q.report2023,
    kept: Q.report2023,
    louder2025: Q.onecycle2025,
    lower2025: Q.report2025,
    label2024: Q.report2024,
    kick2026: Q.report2026,
    higher: Q.octave2019,
};

export function judge({ state, last }) {
    const task = taskOf(state);
    const r = read(state);
    const v = verdict(state);
    const g = givenOf(state);
    if (!task) {
        if (r.periodMs == null) {
            const state2 = r.drawn === 0
                ? 'Blank paper, nothing to read yet: the bench measures a line the moment two cycles of it are on the grid.'
                : `A line across ${Math.round(r.drawn * 100)} per cent of the paper, ${r.why === 'flat' ? 'flat, so there is no cycle in it' : 'with no repeat the bench can lock on to'}.`;
            return [
                seg(3, state2),
                seg(4, `No question is set. Draw two whole cycles, or press a paper's preset, and the bench marks it the way that year's scheme does.`),
            ];
        }
        return [
            seg(3, `${cap(r.shape ? SHAPES[r.shape].said : 'a wave the bench cannot name')}: one cycle every ${fmtMs(r.periodMs)}, ${cyclesWord(r.cycles)} across the grid, the peak ${Math.round(r.amplitude * 100)} per cent of the half grid.`),
            seg(4, `No question is set, so the ladder alone: ${ladder(r.periodMs)}; the pitch ${r.noteWord}. Press a paper's preset to be marked.`),
        ];
    }
    const scheme = SCHEME[task.id];
    const report = REPORT[task.id];
    if (r.drawn === 0) {
        return [
            seg(3, `Nothing on the answer paper yet; the question is printed above it.`),
            seg(4, `The scheme: ${scheme}. Draw it, or fill the paper from the Shape and Period chips.`),
        ];
    }
    if (r.periodMs == null) {
        return [
            seg(3, `A line across ${Math.round(r.drawn * 100)} per cent of the paper, but ${r.why === 'flat' ? 'flat, so there is no cycle in it' : 'no repeat the bench can lock on to'}.`),
            seg(4, `Not yet: ${Q.onecycle2025}. Draw two whole cycles side by side and the bench can measure the period.`),
        ];
    }
    const ms = marksFor(state);
    // the axes mark counts in the tally (the bench prints them, so it is
    // earned), but never in the verdict: paper-model.js decides that.
    const scored = ms.filter((m) => m.id !== 'note');
    const got = scored.filter((m) => m.ok).length;
    const said = scored.map((m) => `${m.words}: ${m.ok ? 'yes' : 'not yet'}`).join('; ');
    if (v.ok) {
        return [
            seg(3, `${cap(r.shape ? SHAPES[r.shape].said : 'your wave')} at ${fmtMs(r.periodMs)} a cycle, ${g ? `${widthWord(r.periodMs / g.periodMs)} than the figure` : `${cyclesWord(r.cycles)} on the grid`}${r.db != null ? `, ${r.heightWord}` : ''}.`),
            seg(4, `As directed, ${got} of ${scored.length}: ${scheme}. ${ladder(r.periodMs)}. ${report}`),
        ];
    }
    const why = v.key === 'period-kept'
        ? `the width has not changed: ${fmtMs(r.periodMs)} a cycle, the same as the figure`
        : v.key === 'wrong-period'
            ? `one cycle every ${fmtMs(r.periodMs)}, which is not the width the scheme wants`
            : v.key === 'wrong-shape'
                ? `the shape reads as ${r.shape ? SHAPES[r.shape].said : 'none of the four'}, and the question names another`
                : v.key === 'wrong-offset'
                    ? `the wave sits ${r.offset > 0 ? 'above' : 'below'} the centre line: a DC offset, which this scheme refuses`
                    : `the height is ${r.db != null ? `${fmtDb(r.db)} on the figure` : 'not what the scheme asks for'}`;
    return [
        seg(3, `${cap(r.shape ? SHAPES[r.shape].said : 'a wave')} on the paper, and ${why}.`),
        seg(4, `Not yet, ${got} of ${scored.length}: ${said}. ${scheme}`),
    ];
}

// ---- Extension: the machine ------------------------------------------------
const HARM_WORDS = {
    sine: 'one harmonic and nothing else, which is why it has no edge to it',
    square: 'the odd harmonics only, each one falling as one over its number: 1, a third, a fifth, a seventh',
    saw: 'every harmonic, odd and even, falling as one over its number: that is the buzz',
    triangle: 'the odd harmonics again, but falling as one over the square of the number, so the third is a ninth and it sounds soft',
};
export function open({ state, last }) {
    const r = read(state);
    if (r.periodMs == null) return `Nothing to take apart yet: the harmonics are worked out from one whole cycle, so the bench needs two cycles on the paper before it can draw them. A wave is the sum of sine waves at whole multiples of its own frequency, and which of them are there is the whole of why the four shapes sound different.`;
    const f = 1000 / r.periodMs;
    const named = r.shape ? `Named as ${SHAPES[r.shape].said}, which carries ${HARM_WORDS[r.shape]}.` : 'The bench cannot name it as one of the four, so there is no ideal set of bars to stand beside yours.';
    const h = r.harmonics || [];
    const second = h[1] != null ? `${Math.round(h[1] * 100)} per cent` : 'nothing';
    const third = h[2] != null ? `${Math.round(h[2] * 100)} per cent` : 'nothing';
    return `Your cycle is ${fmtMs(r.periodMs)} long, so its fundamental is ${fmtHz(f)} and its harmonics sit at ${fmtHz(f * 2)}, ${fmtHz(f * 3)}, ${fmtHz(f * 4)} and on up. Measured off the line you drew: the second harmonic is ${second} of the fundamental, the third ${third}. ${named}`;
}
