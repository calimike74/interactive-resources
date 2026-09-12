import test from 'node:test';
import assert from 'node:assert/strict';
import {
    DIVS, COLS, SHAPE_IDS, SHAPES, QUESTIONS, COUNT, TIME_BASES,
    INITIAL, stateAt, questionAt, questionOf, figureOf, totalMarks, tagOf, isBlank,
    drawAt, clearLine, setChecked, setLabel, stepQuestion, canStep, nextWord, spanOf, emptyLine,
    AXIS_WORDS, axisSaid,
    fillLine, detectPeriod, cycleOf, nameShape, snapMs, shapeAt,
    read, answerOf, marksFor, scoreOf, verdict,
    fmtMs, fmtS, fmtHz, fmtDb, heightWord, gainToDb, dbToGain, PERIOD_TOL,
} from '../lib/bench/paper-model.js';

const near = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol, `${a} not within ${tol} of ${b}`);
const noDash = (s) => assert.ok(!/—/.test(s) && !/\butilise/i.test(s), `house style: ${String(s).slice(0, 70)}`);
// A wave laid on the answer grid of a state, the way a student's pointer
// would leave it: one height per column.
const put = (state, wave) => ({ ...state, line: fillLine({ offset: 0, amp: 0.5, ...wave, span: spanOf(state) }) });
const at = (n) => stateAt(n - 1); // the question numbered n, on clean paper
const blankPaper = () => stateAt(QUESTIONS.length - 1); // the last sheet, which asks nothing
// The scheme's own answer, drawn on the paper the question sets.
const answered = (n) => {
    const s = at(n);
    const a = answerOf(s);
    const drawn = put(s, { shape: a.shape, periodMs: a.periodMs, amp: a.amp, inverted: a.inverted });
    // the 2024 question asks for the axes in writing, so a full answer to it
    // includes what the candidate writes
    return questionOf(s).blankAxes ? setLabel(setLabel(drawn, 'y', 'Displacement'), 'x', 'Time (ms)') : drawn;
};

// ---- the paper's own arithmetic --------------------------------------------

test('the ladder: a period in ms, in s, and the frequency it gives', () => {
    assert.equal(fmtMs(2), '2.00 ms');
    assert.equal(fmtS(0.002), '0.002 s');
    assert.equal(fmtS(0.005), '0.005 s');
    assert.equal(fmtHz(500), '500 Hz');
    assert.equal(fmtHz(200), '200 Hz');
    assert.equal(fmtHz(1000), '1 kHz');
    assert.equal(fmtDb(6), '+6.0 dB');
    near(dbToGain(6), 1.9953, 1e-3);
    near(gainToDb(2), 6.0206, 1e-3);
    assert.equal(heightWord(6), 'twice the height');
    assert.equal(heightWord(-6), 'half the height');
    assert.equal(heightWord(0), 'the same height');
});

test('the grid is the paper\'s: five divisions, and a division is 1 ms or 2 ms', () => {
    assert.equal(DIVS, 5);
    assert.equal(TIME_BASES[1].span, 5);
    assert.equal(TIME_BASES[2].span, 10);
    assert.equal(spanOf(at(1)), 5);
    assert.equal(spanOf(at(14)), 10, 'the 2025 octave question opens its grid to 2 ms a division');
    assert.equal(spanOf(at(16)), 10, 'a 5 ms answer needs two cycles of room');
});

test('a period is read off the paper to the paper\'s own ruling, so 2 ms is 500 Hz and not 499', () => {
    near(snapMs(2.0033, 5), 2);
    near(snapMs(4.0068, 10), 4);
    near(snapMs(5.0004, 10), 5);
    near(snapMs(2.084, 5), 2.1);
    const r = read(put(at(1), { shape: 'sine', periodMs: 2 }));
    near(r.periodMs, 2);
    near(r.hz, 500);
    near(r.s, 0.002);
});

test('the period comes off the drawing by autocorrelation, at every width the papers ask for', () => {
    for (const [span, per] of [[5, 1], [5, 2], [5, 2.5], [10, 4], [10, 5], [10, 2]]) {
        const line = fillLine({ shape: 'square', periodMs: per, amp: 0.5, offset: 0, span });
        const det = detectPeriod(line);
        assert.ok(det.cols, `${per} ms on a ${span} ms grid was not read (${det.why})`);
        near(snapMs(det.cols * (span / COLS), span), per, 0.06);
    }
});

test('under two cycles, a flat line and a scribble are refused, each for its own reason', () => {
    const s = at(13);
    const oneAndAbit = { ...s, line: fillLine({ shape: 'square', periodMs: 2, amp: 0.5, offset: 0, span: 5 }).map((v, i) => (i < 115 ? v : null)) };
    assert.equal(read(oneAndAbit).periodMs, null);
    assert.equal(verdict(oneAndAbit), 'short');
    const flat = { ...s, line: new Array(COLS).fill(0.2) };
    assert.equal(read(flat).why, 'flat');
    assert.equal(verdict(flat), 'flat');
    assert.equal(verdict(clearLine(s)), 'blank');
    const scribble = { ...s, line: new Array(COLS).fill(0).map((_, i) => Math.sin(i / 11) * 0.3 + Math.sin(i / 4.3) * 0.3) };
    assert.equal(read(scribble).shape, null);
});

test('a wave too wide for the paper is refused, not answered with a period five times too short', () => {
    for (const [span, per] of [[5, 4], [5, 3.57], [5, 3], [10, 8], [10, 7]]) {
        const line = fillLine({ shape: 'square', periodMs: per, amp: 0.6, offset: 0, span });
        assert.equal(detectPeriod(line).cols, null, `${per} ms on a ${span} ms paper was answered, and only ${(span / per).toFixed(2)} cycles are on it`);
    }
    for (const [span, per] of [[5, 2.5], [5, 1.25], [10, 5], [10, 4]]) {
        const line = fillLine({ shape: 'square', periodMs: per, amp: 0.6, offset: 0, span });
        assert.ok(detectPeriod(line).cols, `${per} ms on a ${span} ms paper was refused`);
    }
});

test('the shape is named by matching one cycle against the four, at every phase', () => {
    const s = blankPaper();
    for (const id of SHAPE_IDS) {
        for (const phase of [0, 0.17, 0.5, 0.83]) {
            const r = read(put(s, { shape: id, periodMs: 1.25, phase }));
            assert.equal(r.shape, id, `${id} at phase ${phase} read as ${r.shape}`);
            assert.ok(r.shapeScore >= 0.9, `${id}: ${r.shapeScore}`);
        }
    }
    const inv = read(put(s, { shape: 'saw', periodMs: 1.25, inverted: true }));
    assert.equal(inv.shape, 'saw');
    assert.equal(inv.inverted, true, 'an upside-down saw is still a saw, and the page knows which way up it is');
    const off = read(put(s, { shape: 'square', periodMs: 1.25, offset: -0.4 }));
    assert.equal(off.shape, 'square');
    near(off.offset, -0.4, 0.02);
    near(off.amplitude, 0.5, 0.02);
    assert.equal(cycleOf(null, null, null), null);
    assert.deepEqual(nameShape(null), { shape: null, score: 0, inverted: false, phase: 0 });
});

test('amplitude is the centre line to the peak, and the height is read in dB against the figure', () => {
    const s = at(11); // Figure 1 is a square wave at 0.45 of the half grid
    near(figureOf(s).amp, 0.45);
    near(read(put(s, { shape: 'square', periodMs: 2, amp: 0.45 })).db, 0, 0.2);
    const twice = read(put(s, { shape: 'square', periodMs: 2, amp: 0.9 }));
    near(twice.db, 6, 0.3);
    assert.equal(twice.heightWord, 'twice the height');
    near(read(put(s, { shape: 'square', periodMs: 2, amp: 0.225 })).db, -6, 0.3);
});

// ---- the sixteen questions --------------------------------------------------

test('sixteen questions and a blank paper, numbered in teaching order', () => {
    assert.equal(COUNT, QUESTIONS.filter((q) => q.n).length, 'the count is derived, never written down');
    assert.equal(QUESTIONS.length, COUNT + 1, 'the blank paper is the one sheet that is not a question');
    assert.deepEqual(QUESTIONS.filter((q) => q.n).map((q) => q.n), [...Array(COUNT)].map((_, i) => i + 1));
    assert.equal(QUESTIONS[QUESTIONS.length - 1].n, null, 'the blank paper is not numbered');
    assert.equal(new Set(QUESTIONS.map((q) => q.id)).size, QUESTIONS.length, 'the ids are unique');
    // the four waveforms first, from a blank grid, then the changes, then the papers
    assert.deepEqual(QUESTIONS.slice(0, 4).map((q) => q.want.shape), ['sine', 'square', 'saw', 'triangle']);
    for (const q of QUESTIONS.slice(0, 4)) assert.equal(q.figure, null, `${q.id} starts from a blank grid`);
    for (const q of QUESTIONS.slice(4, 14)) assert.ok(q.figure, `${q.id} prints a figure`);
    assert.equal(tagOf(at(3)), `3/${COUNT}`);
    assert.equal(tagOf(blankPaper()), 'blank');
    assert.equal(isBlank(blankPaper()), true);
    assert.equal(isBlank(at(1)), false);
});

test('every octave question asks for one octave, and never for two', () => {
    // Mike, 12 Sep 2026: "Don't go two octaves, only do one octave."
    const octaves = QUESTIONS.filter((q) => q.figure && q.want && q.want.periodMs !== 'any' && /octave/.test(q.stem));
    assert.equal(octaves.length, 8, 'six in the teaching run at questions 5 to 10, and the two the papers set');
    for (const q of octaves) {
        const ratio = q.want.periodMs / q.figure.periodMs;
        assert.ok(ratio === 2 || ratio === 0.5, `${q.id}: the answer is ${ratio} times the figure's period, and an octave is 2 or 0.5`);
        const said = /higher/.test(q.stem) ? 0.5 : 2;
        assert.equal(ratio, said, `${q.id}: the stem says ${said === 2 ? 'lower' : 'higher'} and the scheme wants the other`);
    }
    // the last four change the shape as well as the period
    const both = QUESTIONS.slice(6, 10);
    assert.deepEqual(both.map((q) => q.id), ['triHigher', 'sineToTriLower', 'squareToSineHigher', 'triToSquareLower']);
    assert.deepEqual(both.map((q) => q.figure.shape), ['triangle', 'sine', 'square', 'triangle']);
    assert.deepEqual(both.map((q) => q.want.shape), ['triangle', 'triangle', 'sine', 'square']);
    for (const q of both) {
        assert.equal(q.figure.amp, 0.6);
        assert.equal(q.figure.caption, 'Figure 1');
        assert.equal(q.timeBase, 1);
        assert.deepEqual(q.marks.map((m) => m.id), ['shape', 'period']);
        assert.equal(q.accept, 'Accept DC offset. Accept different amplitude.');
        assert.match(q.report, /an octave lower was double the period/);
    }
});

test('nothing the student can read names a paper, a part or a year', () => {
    // Mike, 12 Sep 2026: "I don't want to see the exam reference ... this is
    // going to tip the students off to which exams have this type of question
    // in them." So no year reaches any string the sheet prints. `source` and
    // `part` are the teacher's record and the page never renders them.
    const year = /\b20\d\d\b/;
    for (const q of QUESTIONS) {
        const said = [q.stem, q.accept, q.report, ...(q.bullets || []).map((b) => b.text), ...q.marks.map((m) => m.words), ...q.marks.map((m) => m.earned)];
        for (const line of said.filter(Boolean)) {
            assert.doesNotMatch(line, year, `${q.id}: "${line}" names a year`);
            assert.doesNotMatch(line, /\bQ\d/, `${q.id}: "${line}" names a paper question`);
        }
        if (q.figure) assert.doesNotMatch(q.figure.caption, year, q.id);
    }
    // and the record the page keeps to itself still says where each came from
    for (const q of QUESTIONS.filter((x) => x.n)) assert.match(q.source, /^(Practice, in the shape of )?20\d\d Q/, q.id);
});

test('every question prints a stem, a source and its marks, in the house style', () => {
    for (const q of QUESTIONS) {
        noDash(q.stem); noDash(q.source);
        // a stem that opens a bulleted list is short on purpose, as 2024 Q4(a) is
        assert.ok(q.stem.length > (q.bullets ? 14 : 20) && q.stem.length < 160, `${q.id}: the stem runs to ${q.stem.length} characters`);
        for (const b2 of q.bullets || []) { noDash(b2.text); assert.ok(b2.text.length > 8 && b2.worth >= 1, `${q.id}: ${b2.text}`); }
        assert.ok(q.stem.endsWith('.') || q.stem.endsWith(':'), `${q.id}: the stem is a sentence`);
        if (q.accept) noDash(q.accept);
        if (q.report) {
            noDash(q.report);
            assert.match(q.report, /\(examiner's report\)$/, `${q.id}: the examiner line is not signed`);
        }
        for (const m of q.marks) {
            noDash(m.words);
            assert.ok(m.checks.length >= 1, `${q.id}: a mark with nothing to check`);
            assert.ok((m.worth || 1) >= 1);
        }
    }
    // a question that is not a paper question says so, and one that is names it
    for (const q of QUESTIONS.filter((x) => x.n)) {
        const real = /^\d{4} Q/.test(q.source);
        assert.ok(real || /^Practice/.test(q.source), `${q.id}: "${q.source}" claims neither`);
    }
    assert.equal(QUESTIONS[1].source, '2023 Q2(e)(i)');
    assert.equal(QUESTIONS[1].stem, 'On the graph below draw a square wave with a period of 1 ms.');
    assert.equal(QUESTIONS[12].source, '2023 Q2(e)(ii)');
    assert.equal(QUESTIONS[12].stem, 'On the graph below, draw a saw wave one octave lower.');
});

test('the marks in brackets are the paper\'s own totals', () => {
    assert.equal(totalMarks(questionAt(1)), 2, '2023 Q2(e)(i) is two marks');
    assert.equal(totalMarks(questionAt(10)), 1, '2025 Q3(c)(vi) is one mark');
    assert.equal(totalMarks(questionAt(11)), 1, '2024 Q4(b) is one mark');
    assert.equal(totalMarks(questionAt(12)), 2, '2023 Q2(e)(ii) is two marks');
    assert.equal(totalMarks(questionAt(13)), 1, '2025 Q3(c)(vii) is one mark');
    assert.equal(totalMarks(questionAt(14)), 5, '2024 Q4(a) is five marks');
    assert.deepEqual(questionAt(14).bullets.map((b) => b.worth), [1, 2, 1, 1]);
    assert.equal(totalMarks(questionAt(15)), 1);
    for (const n of [7, 8, 9, 10]) assert.equal(totalMarks(questionAt(n - 1)), 2, `question ${n} is a shape mark and a period mark`);
});

test('the scheme\'s own answer, drawn on the paper, scores full marks on every question', () => {
    for (const q of QUESTIONS.filter((x) => x.want)) {
        const s = answered(q.n);
        const marks = marksFor(s);
        const score = scoreOf(s);
        assert.ok(marks.every((m) => m.ok), `${q.id}: ${marks.filter((m) => !m.ok).map((m) => `${m.words} (${m.note})`).join('; ')}`);
        assert.equal(score.got, score.total, q.id);
        assert.equal(verdict(s), 'full', q.id);
    }
});

test('every scheme answer has two whole cycles of room on the paper it is set on', () => {
    // "Some candidates only drew one cycle of the wave so did not score
    // credit" (2025 examiner report): the page must not set a question whose
    // own answer cannot show two.
    for (const q of QUESTIONS.filter((x) => x.want)) {
        const a = answerOf(stateAt(q.n - 1));
        const cycles = TIME_BASES[q.timeBase].span / a.periodMs;
        assert.ok(cycles >= 2, `${q.id}: the scheme's answer fits only ${cycles.toFixed(2)} cycles`);
    }
});

test('the errors the examiner reports name are marked the way the schemes mark them', () => {
    // 2023 Q2(e)(ii): the right shape at the figure's own width, one of two
    const kept = put(at(13), { shape: 'saw', periodMs: 1 });
    assert.deepEqual(marksFor(kept).map((m) => m.ok), [true, false]);
    assert.deepEqual(scoreOf(kept), { got: 1, total: 2 });
    assert.equal(verdict(kept), 'partial');
    // and another square wave, the other error the 2023 report names
    const square = put(at(13), { shape: 'square', periodMs: 2 });
    assert.deepEqual(marksFor(square).map((m) => m.ok), [false, true]);
    // an inverted saw scores, as the scheme allows
    const inverted = put(at(13), { shape: 'saw', periodMs: 2, inverted: true });
    assert.equal(verdict(inverted), 'full');
    // a DC offset is accepted on this one, and the page says so
    assert.equal(verdict(put(at(13), { shape: 'saw', periodMs: 2, offset: -0.35 })), 'full');
    // 2025 Q3(c)(vi): the same height is not louder, and an offset loses it
    assert.equal(verdict(put(at(11), { shape: 'square', periodMs: 2, amp: 0.45 })), 'none');
    assert.equal(verdict(put(at(11), { shape: 'square', periodMs: 2, amp: 0.9 })), 'full');
    assert.equal(verdict(put(at(11), { shape: 'square', periodMs: 2, amp: 0.9, offset: 0.3 })), 'none');
    // 2025 Q3(c)(vii): the same amplitude, four milliseconds, no offset
    assert.equal(verdict(put(at(14), { shape: 'square', periodMs: 4, amp: 0.5 })), 'full');
    assert.equal(verdict(put(at(14), { shape: 'square', periodMs: 2, amp: 0.5 })), 'none');
    assert.equal(verdict(put(at(14), { shape: 'square', periodMs: 4, amp: 0.12 })), 'none');
    // 2024 Q4(b): the same wave the other way up, and only that
    assert.equal(verdict(put(at(12), { shape: 'saw', periodMs: 2, inverted: true })), 'full');
    assert.equal(verdict(put(at(12), { shape: 'saw', periodMs: 2 })), 'none');
    // 2026 Q1(d): 200 Hz is 5 ms a cycle, whatever shape it is drawn as
    for (const shape of SHAPE_IDS) assert.equal(verdict(put(at(16), { shape, periodMs: 5 })), 'full', shape);
    assert.equal(verdict(put(at(16), { shape: 'sine', periodMs: 2 })), 'none');
    // 2024 Q4(a): any square wave, and the axes are the student's to write
    const drawn2024 = put(at(15), { shape: 'square', periodMs: 1.5, amp: 0.6 });
    assert.deepEqual(scoreOf(drawn2024), { got: 3, total: 5 }, 'the axis marks are not given away');
    const labelled = setLabel(setLabel(drawn2024, 'y', 'Displacement'), 'x', 'Time (ms)');
    assert.deepEqual(scoreOf(labelled), { got: 5, total: 5 });
});

test('the four shape-changing octaves are marked on the shape and the width together', () => {
    // question, what the figure prints, what the scheme wants
    const set = [
        { n: 7, figure: { shape: 'triangle', periodMs: 2 }, want: { shape: 'triangle', periodMs: 1 } },
        { n: 8, figure: { shape: 'sine', periodMs: 1 }, want: { shape: 'triangle', periodMs: 2 } },
        { n: 9, figure: { shape: 'square', periodMs: 2 }, want: { shape: 'sine', periodMs: 1 } },
        { n: 10, figure: { shape: 'triangle', periodMs: 1 }, want: { shape: 'square', periodMs: 2 } },
    ];
    for (const { n, figure, want } of set) {
        assert.deepEqual(figureOf(at(n)), { ...figure, amp: 0.6, caption: 'Figure 1' }, `question ${n} prints its figure`);
        // the scheme's own answer takes both marks
        const right = put(at(n), { ...want, amp: 0.6 });
        assert.deepEqual(scoreOf(right), { got: 2, total: 2 }, `question ${n}: ${want.shape} at ${want.periodMs} ms`);
        assert.equal(verdict(right), 'full');
        // the figure copied out unchanged never keeps the period mark
        const copied = put(at(n), { ...figure, amp: 0.6 });
        const periodMark = marksFor(copied).find((m) => m.id === 'period');
        assert.equal(periodMark.ok, false, `question ${n}: copying the figure kept the period mark`);
        if (want.shape === figure.shape) {
            // question 7 asks for the same shape, so that mark still stands
            assert.deepEqual(scoreOf(copied), { got: 1, total: 2 }, `question ${n}`);
            assert.equal(verdict(copied), 'partial');
        } else {
            assert.deepEqual(scoreOf(copied), { got: 0, total: 2 }, `question ${n}`);
            assert.equal(verdict(copied), 'none');
        }
        // two octaves is not an octave, whichever way it is drawn
        for (const per of [figure.periodMs * 4, figure.periodMs / 4]) {
            const twice = put(at(n), { shape: want.shape, periodMs: per, amp: 0.6 });
            assert.equal(marksFor(twice).find((m) => m.id === 'period').ok, false, `question ${n}: ${per} ms took the period mark`);
        }
    }
});

test('a mark that is lost says what the page measured, in its own margin', () => {
    const kept = put(at(13), { shape: 'saw', periodMs: 1 });
    const period = marksFor(kept).find((m) => m.id === 'period');
    assert.equal(period.ok, false);
    assert.match(period.note, /you drew 1\.00 ms, and the scheme wants 2\.00 ms/);
    const blank = at(13);
    assert.match(marksFor(blank).find((m) => m.id === 'shape').note, /nothing drawn yet/);
    const quiet = put(at(11), { shape: 'square', periodMs: 2, amp: 0.45 });
    assert.match(marksFor(quiet)[0].note, /on the figure: the same height/);
    for (const q of QUESTIONS.filter((x) => x.want)) {
        for (const m of marksFor(stateAt(q.n - 1))) noDash(m.note);
    }
});

// ---- the walk ----------------------------------------------------------------

test('Back and Next walk the sixteen and the blank paper, and neither wraps', () => {
    let s = INITIAL;
    assert.equal(s.q, 0);
    assert.equal(canStep(s, -1), false, 'Back is disabled on question 1');
    for (let n = 1; n <= COUNT; n += 1) {
        assert.equal(questionOf(s).n, n);
        assert.equal(canStep(s, 1), true);
        s = stepQuestion(s, 1);
    }
    assert.equal(isBlank(s), true, `after question ${COUNT} comes the blank paper`);
    assert.equal(canStep(s, 1), false, 'Next is disabled on the blank paper');
    assert.equal(stepQuestion(s, 1), s);
    assert.equal(nextWord(at(COUNT)), 'Blank paper');
    assert.equal(nextWord(at(1)), 'Next');
    assert.equal(questionOf(stepQuestion(s, -1)).n, COUNT, 'Back comes off the blank paper');
});

test('Back and Next carry nothing but the question: the drawing and the marking go', () => {
    const drawn = setChecked(put(at(1), { shape: 'sine', periodMs: 2 }), true);
    assert.equal(drawn.checked, true);
    const next = stepQuestion(drawn, 1);
    assert.equal(questionOf(next).n, 2);
    assert.equal(next.checked, false);
    assert.equal(read(next).drawn, 0, 'the answer grid is blank again');
    assert.deepEqual(next.line, emptyLine());
    // and a new stroke takes the marking off, because a marked script cannot
    // be half redrawn
    const redrawn = drawAt(drawn, 10, 0.5);
    assert.equal(redrawn.checked, false);
    assert.equal(clearLine(drawn).checked, false);
    assert.equal(read(clearLine(drawn)).drawn, 0);
});

test('the pointer writes one height per column, and going back over a stretch replaces it', () => {
    let s = blankPaper();
    s = drawAt(s, 10, 0.5);
    assert.equal(s.line[10], 0.5);
    s = drawAt(s, 20, -0.5, 10, 0.5);
    near(s.line[15], 0, 0.02); // the columns between are filled in
    assert.equal(s.line[20], -0.5);
    s = drawAt(s, 15, 0.9, 14, 0.9);
    assert.equal(s.line[15], 0.9, 'the second pass replaces the first');
    assert.equal(s.line[0], null, 'nothing is written where the pointer never went');
    assert.equal(drawAt(s, -3, 0.5), s);
    assert.equal(drawAt(s, COLS + 2, 0.5), s);
    assert.equal(shapeAt('square', 0.25), 1);
    assert.equal(shapeAt('square', 0.75), -1);
    near(shapeAt('sine', 0.25), 1, 1e-9);
    near(shapeAt('triangle', 0.25), 1, 1e-9);
});

test('the blank paper asks nothing, marks nothing, and still reads the line back', () => {
    const s = put(blankPaper(), { shape: 'triangle', periodMs: 1.25 });
    assert.equal(answerOf(s), null);
    assert.deepEqual(marksFor(s), []);
    assert.deepEqual(scoreOf(s), { got: 0, total: 0 });
    assert.equal(verdict(s), 'read');
    assert.equal(read(s).shape, 'triangle');
    near(read(s).periodMs, 1.25, 0.06);
});

test('a period within a tenth of the scheme\'s is credited, as a hand-drawn line must be', () => {
    const s = at(2); // a square wave with a period of 1 ms
    for (const per of [1, 1 + PERIOD_TOL * 0.8, 1 - PERIOD_TOL * 0.8]) {
        assert.equal(marksFor(put(s, { shape: 'square', periodMs: per })).find((m) => m.id === 'period').ok, true, `${per} ms`);
    }
    assert.equal(marksFor(put(s, { shape: 'square', periodMs: 1.25 })).find((m) => m.id === 'period').ok, false);
});

test('2024 Q4(a) asks for the axes in writing, and marks the words the scheme takes', () => {
    // "Most candidates were able to label both axes correctly although
    // 'frequency'/'Hz' was a common mistake on the y-axis" (2024 report), so
    // the page cannot give these two marks away.
    const q = questionAt(14);
    assert.equal(q.blankAxes, true, 'the 2024 grid prints bare, as the paper prints it');
    assert.deepEqual(q.marks.map((m) => m.id), ['shape', 'axisY', 'axisX', 'amplitude', 'period']);
    assert.deepEqual(q.marks.map((m) => m.worth), [1, 1, 1, 1, 1]);
    const drawn = put(at(15), { shape: 'square', periodMs: 1.5, amp: 0.6 });
    const mark = (s2, id) => marksFor(s2).find((m) => m.id === id);
    assert.equal(mark(drawn, 'axisY').ok, false);
    assert.match(mark(drawn, 'axisY').note, /not labelled/);
    // every word the scheme takes, on either axis
    for (const word of AXIS_WORDS.y) assert.equal(mark(setLabel(drawn, 'y', word), 'axisY').ok, true, word);
    for (const word of AXIS_WORDS.x) assert.equal(mark(setLabel(drawn, 'x', word), 'axisX').ok, true, word);
    // written as a candidate writes them, in any case and with the unit
    for (const said of ['Displacement', 'voltage (V)', 'AMPLITUDE', 'Level in dB']) {
        assert.equal(mark(setLabel(drawn, 'y', said), 'axisY').ok, true, said);
    }
    for (const said of ['Time (ms)', 'time in milliseconds', 'MS', 'seconds']) {
        assert.equal(mark(setLabel(drawn, 'x', said), 'axisX').ok, true, said);
    }
    // and the mistake the report names is not credited
    for (const wrong of ['frequency', 'Hz', 'pitch', '']) {
        assert.equal(mark(setLabel(drawn, 'y', wrong), 'axisY').ok, false, wrong || 'nothing');
    }
    for (const wrong of ['displacement', 'bars', 'Hz']) {
        assert.equal(mark(setLabel(drawn, 'x', wrong), 'axisX').ok, false, wrong);
    }
    assert.match(mark(setLabel(drawn, 'y', 'Displacement'), 'axisY').note, /you wrote "Displacement"/);
    assert.equal(axisSaid(null, 'y'), false);
    // the amplitude and the period are labelled on the drawing for the
    // student, and say so
    const full = setLabel(setLabel(drawn, 'y', 'Displacement'), 'x', 'Time (ms)');
    for (const id of ['amplitude', 'period']) {
        assert.equal(mark(full, id).ok, true);
        assert.match(mark(full, id).note, /labelled for you here; on paper you write these in/);
    }
    // but only when there is a wave to label
    const empty = setLabel(setLabel(at(15), 'y', 'Displacement'), 'x', 'Time (ms)');
    assert.equal(mark(empty, 'period').ok, false);
    assert.equal(mark(empty, 'amplitude').ok, false);
    assert.deepEqual(scoreOf(empty), { got: 2, total: 5 });
    // writing a label takes the marking off, as drawing does
    assert.equal(setLabel(setChecked(full, true), 'y', 'V').checked, false);
    assert.deepEqual(stepQuestion(full, 1).labels, { y: '', x: '' }, 'Next carries no labels');
});
