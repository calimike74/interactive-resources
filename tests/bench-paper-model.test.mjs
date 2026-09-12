import test from 'node:test';
import assert from 'node:assert/strict';
import {
    DIVS, COLS, SHAPES, SHAPE_IDS, PRESETS, TASKS, GIVENS, TIME_BASES, DEFAULT_STATE, HARMONICS,
    applyPreset, fillLine, drawAt, clearLine, setTimeBase, setShape, setPeriod, setHeight, setShowAnswer, setTarget,
    detectPeriod, cycleOf, nameShape, harmonicsOf, idealHarmonics, snapMs, shapeAt,
    read, verdict, marksFor, answerOf, givenOf, spanOf,
    fmtMs, fmtS, fmtHz, fmtDb, noteWord, heightWord, gainToDb, dbToGain,
} from '../lib/bench/paper-model.js';

const near = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol, `${a} not within ${tol} of ${b}`);
// A wave laid on the answer paper of a state, the way a student's pointer
// would leave it: one height per column.
const put = (state, wave) => ({ ...state, line: fillLine({ offset: 0, amp: 0.5, ...wave, span: spanOf(state) }) });

test('the ladder: a period in ms, in s, and the frequency it gives', () => {
    near(1000 / 2, 500);
    assert.equal(fmtMs(2), '2.00 ms');
    assert.equal(fmtS(0.002), '0.002 s');
    assert.equal(fmtS(0.005), '0.005 s');
    assert.equal(fmtHz(500), '500 Hz');
    assert.equal(fmtHz(200), '200 Hz');
    assert.equal(fmtHz(1000), '1 kHz');
    assert.equal(fmtDb(6), '+6.0 dB');
    assert.equal(fmtDb(-6), '-6.0 dB');
    near(dbToGain(6), 1.9953, 1e-3);
    near(gainToDb(2), 6.0206, 1e-3);
    assert.equal(heightWord(6), 'twice the height');
    assert.equal(heightWord(-6), 'half the height');
    assert.equal(heightWord(0), 'the same height');
    assert.match(noteWord(500), /^between B and C$/);
});

test('the grid is the paper\'s: five divisions, and a division is 1 ms or 2 ms', () => {
    assert.equal(DIVS, 5);
    assert.equal(TIME_BASES[1].span, 5);
    assert.equal(TIME_BASES[2].span, 10);
    assert.equal(spanOf(applyPreset(DEFAULT_STATE, 'lower2023')), 5);
    assert.equal(spanOf(applyPreset(DEFAULT_STATE, 'lower2025')), 10);
    assert.equal(spanOf(applyPreset(DEFAULT_STATE, 'kick2026')), 10);
});

test('a period is read off the paper to the paper\'s own ruling, so 2 ms is 500 Hz and not 499', () => {
    near(snapMs(2.0033, 5), 2);
    near(snapMs(4.0068, 10), 4);
    near(snapMs(5.0004, 10), 5);
    near(snapMs(2.084, 5), 2.1); // a hand-drawn line keeps its own reading
    const s = put(applyPreset(DEFAULT_STATE, 'lower2023'), { shape: 'saw', periodMs: 2 });
    const r = read(s);
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
    const s = applyPreset(DEFAULT_STATE, 'lower2023');
    const oneAndAbit = { ...s, line: fillLine({ shape: 'square', periodMs: 2, amp: 0.5, offset: 0, span: 5 }).map((v, i) => (i < 115 ? v : null)) };
    assert.equal(read(oneAndAbit).periodMs, null);
    assert.equal(verdict(oneAndAbit).key, 'short');
    const flat = { ...s, line: new Array(COLS).fill(0.2) };
    assert.equal(read(flat).why, 'flat');
    assert.equal(verdict(flat).key, 'flat');
    const blank = clearLine(s);
    assert.equal(read(blank).drawn, 0);
    assert.equal(verdict(blank).key, 'blank');
    const scribble = { ...s, line: new Array(COLS).fill(0).map((_, i) => Math.sin(i / 11) * 0.3 + Math.sin(i / 4.3) * 0.3) };
    assert.equal(read(scribble).shape, null);
});

test('a wave too wide for the paper is refused, not answered with a period five times too short', () => {
    // Found by the listening harness, 12 Sep 2026: one and a bit cycles of a
    // square scores well at the shortest lag the bench looks at, because the
    // flat stretches match each other. A peak is only a period if the line
    // troughs half way to it and comes back at twice it.
    const s = applyPreset(DEFAULT_STATE, 'blank');
    for (const [span, per] of [[5, 4], [5, 3.57], [5, 3], [10, 8], [10, 7]]) {
        const line = fillLine({ shape: 'square', periodMs: per, amp: 0.6, offset: 0, span });
        assert.equal(detectPeriod(line).cols, null, `${per} ms on a ${span} ms paper was answered, and only ${(span / per).toFixed(2)} cycles are on it`);
    }
    const wide = { ...s, line: fillLine({ shape: 'square', periodMs: 4, amp: 0.6, offset: 0, span: 5 }) };
    assert.equal(verdict(wide).key, 'unclear');
    // and the widths that do fit are still read
    for (const [span, per] of [[5, 2.5], [5, 1.25], [10, 5], [10, 4]]) {
        const line = fillLine({ shape: 'square', periodMs: per, amp: 0.6, offset: 0, span });
        assert.ok(detectPeriod(line).cols, `${per} ms on a ${span} ms paper was refused`);
    }
});

test('the shape is named by matching one cycle against the four, at every phase', () => {
    const s = applyPreset(DEFAULT_STATE, 'blank');
    for (const id of SHAPE_IDS) {
        for (const phase of [0, 0.17, 0.5, 0.83]) {
            const r = read(put(s, { shape: id, periodMs: 1.25, phase }));
            assert.equal(r.shape, id, `${id} at phase ${phase} read as ${r.shape}`);
            assert.ok(r.shapeScore >= 0.9, `${id}: ${r.shapeScore}`);
        }
    }
    // an inverted saw is a saw, which is what the 2023 scheme allows
    const inv = { ...s, line: fillLine({ shape: 'saw', periodMs: 1.25, amp: 0.5, offset: 0, span: 5 }).map((v) => -v) };
    const ri = read(inv);
    assert.equal(ri.shape, 'saw');
    assert.equal(ri.inverted, true);
    // a DC offset does not stop the bench naming the shape
    const off = read(put(s, { shape: 'square', periodMs: 1.25, offset: -0.4 }));
    assert.equal(off.shape, 'square');
    near(off.offset, -0.4, 0.02);
    near(off.amplitude, 0.5, 0.02);
});

test('amplitude is the centre line to the peak, and the height is read in dB against the figure', () => {
    const s = applyPreset(DEFAULT_STATE, 'louder2025'); // figure 1 is 0.5 of the half grid
    near(givenOf(s).amp, 0.5);
    const same = read(put(s, { shape: 'square', periodMs: 2, amp: 0.5 }));
    near(same.amplitude, 0.5, 0.01);
    near(same.db, 0, 0.2);
    const twice = read(put(s, { shape: 'square', periodMs: 2, amp: 1 }));
    near(twice.db, 6, 0.3);
    assert.equal(twice.heightWord, 'twice the height');
    const half = read(put(s, { shape: 'square', periodMs: 2, amp: 0.25 }));
    near(half.db, -6, 0.3);
});

test('2023 Q2(e)(ii): a saw an octave lower is two marks, and the period kept is one', () => {
    const s = applyPreset(DEFAULT_STATE, 'lower2023');
    assert.equal(givenOf(s).shape, 'square');
    near(givenOf(s).periodMs, 1);
    const right = put(s, { shape: 'saw', periodMs: 2 });
    assert.equal(verdict(right).key, 'directed');
    assert.deepEqual(marksFor(right).map((m) => m.ok), [true, true]);
    // the error the report names: the right shape at the figure's own width
    const kept = put(s, { shape: 'saw', periodMs: 1 });
    assert.equal(verdict(kept).key, 'period-kept');
    assert.deepEqual(marksFor(kept).map((m) => m.ok), [true, false]);
    // the other error the report names: another square wave
    const square = put(s, { shape: 'square', periodMs: 2 });
    assert.equal(verdict(square).key, 'wrong-shape');
    // "Accept DC offset. Accept different amplitude" on this one
    const offset = put(s, { shape: 'saw', periodMs: 2, amp: 0.3, offset: -0.45 });
    assert.equal(verdict(offset).key, 'directed');
    assert.ok(marksFor(offset).some((m) => m.id === 'note'), 'the offset is still named, even where the scheme accepts it');
    // an inverted saw scores, as the scheme allows
    const inverted = { ...s, line: fillLine({ shape: 'saw', periodMs: 2, amp: 0.5, offset: 0, span: 5 }).map((v) => -v) };
    assert.equal(verdict(inverted).key, 'directed');
});

test('2025 Q3(c)(vi): louder is a square at 2 ms, taller, with no DC offset', () => {
    const s = applyPreset(DEFAULT_STATE, 'louder2025');
    const right = put(s, { shape: 'square', periodMs: 2, amp: 0.5 * dbToGain(6) });
    assert.equal(verdict(right).key, 'directed');
    const same = put(s, { shape: 'square', periodMs: 2, amp: 0.5 });
    assert.equal(verdict(same).key, 'wrong-height');
    const offset = put(s, { shape: 'square', periodMs: 2, amp: 0.5 * dbToGain(6), offset: -0.2 });
    assert.equal(verdict(offset).key, 'wrong-offset');
    const wide = put(s, { shape: 'square', periodMs: 4, amp: 0.5 * dbToGain(6) });
    assert.equal(verdict(wide).ok, false);
});

test('2025 Q3(c)(vii): an octave lower is a square at 4 ms, the same amplitude, no DC offset', () => {
    const s = applyPreset(DEFAULT_STATE, 'lower2025');
    assert.equal(spanOf(s), 10, 'the screen opens to 2 ms a division so two cycles of a 4 ms wave fit');
    const right = put(s, { shape: 'square', periodMs: 4, amp: 0.5 });
    assert.equal(verdict(right).key, 'directed');
    near(read(right).cycles, 2.5, 0.1);
    // "Around half of candidates drew a wave with double the period" the other way
    const kept = put(s, { shape: 'square', periodMs: 2, amp: 0.5 });
    assert.equal(verdict(kept).key, 'period-kept');
    const louder = put(s, { shape: 'square', periodMs: 4, amp: 0.5 * dbToGain(8) });
    assert.equal(verdict(louder).key, 'wrong-height');
});

test('2024 Q4(a): any square wave on a blank grid, with the axes, the amplitude and the period labelled', () => {
    const s = applyPreset(DEFAULT_STATE, 'label2024');
    assert.equal(givenOf(s), null, 'the 2024 grid is blank');
    const right = put(s, { shape: 'square', periodMs: 1.5, amp: 0.6 });
    assert.equal(verdict(right).key, 'directed');
    const ids = marksFor(right).map((m) => m.id);
    assert.deepEqual(ids, ['shape', 'axes', 'height', 'period']);
    assert.ok(marksFor(right).every((m) => m.ok));
    const wrong = put(s, { shape: 'sine', periodMs: 1.5, amp: 0.6 });
    assert.equal(verdict(wrong).key, 'wrong-shape');
});

test('2026 Q1(d): a 200 Hz wave is 5 ms a cycle, whatever shape it is drawn as', () => {
    const s = applyPreset(DEFAULT_STATE, 'kick2026');
    assert.equal(spanOf(s), 10);
    for (const shape of SHAPE_IDS) {
        const right = put(s, { shape, periodMs: 5, amp: 0.6 });
        const r = read(right);
        near(r.periodMs, 5, 0.06);
        near(r.hz, 200, 3);
        assert.equal(verdict(right).key, 'directed', shape);
    }
    const wrong = put(s, { shape: 'sine', periodMs: 2, amp: 0.6 });
    assert.equal(verdict(wrong).ok, false);
});

test('the chapter\'s own exercise: an octave higher halves the period', () => {
    const s = applyPreset(DEFAULT_STATE, 'higher');
    near(givenOf(s).periodMs, 2);
    const right = put(s, { shape: 'sine', periodMs: 1, amp: 0.6 });
    assert.equal(verdict(right).key, 'directed');
    const lower = put(s, { shape: 'sine', periodMs: 4, amp: 0.6 });
    assert.equal(verdict(lower).ok, false);
});

test('the judge preset arrives already drawn, with the 2023 report\'s error on the paper', () => {
    const s = applyPreset(DEFAULT_STATE, 'kept');
    const r = read(s);
    assert.equal(r.shape, 'saw');
    near(r.periodMs, 1, 0.06);
    assert.equal(verdict(s).key, 'period-kept');
});

test('every preset lands on its task, its screen and its verdict', () => {
    const want = {
        lower2023: 'blank', louder2025: 'blank', lower2025: 'blank', label2024: 'blank',
        kick2026: 'blank', higher: 'blank', kept: 'period-kept', blank: 'blank',
    };
    for (const p of PRESETS) {
        const st = applyPreset(DEFAULT_STATE, p.id);
        assert.equal(st.task, p.task, p.id);
        assert.equal(verdict(st).key, want[p.id], p.id);
        if (p.task) assert.ok(TASKS[p.task], p.id);
        if (st.given) assert.ok(GIVENS[st.given], p.id);
        // the scheme's answer must fit the paper it is drawn on
        const a = answerOf(st);
        if (a) assert.ok(a.periodMs * 2 <= spanOf(st) + 1e-9, `${p.id}: the answer at ${a.periodMs} ms does not get two cycles on a ${spanOf(st)} ms paper`);
    }
});

test('the scheme\'s answer, once drawn, is marked as directed on every paper preset', () => {
    for (const p of PRESETS) {
        const st = applyPreset(DEFAULT_STATE, p.id);
        const a = answerOf(st);
        if (!a) continue;
        const drawn = { ...st, line: fillLine({ ...a, span: spanOf(st) }) };
        assert.equal(verdict(drawn).key, 'directed', `${p.id}: the bench's own answer does not pass its own marking`);
    }
});

test('the chips are the keyboard\'s route to a drawing, and Clear takes it away', () => {
    let s = applyPreset(DEFAULT_STATE, 'lower2023');
    s = setShape(s, 'saw');
    near(read(s).periodMs, 1, 0.06); // fills at the figure's width first
    s = setPeriod(s, 'double');
    assert.equal(read(s).shape, 'saw');
    near(read(s).periodMs, 2, 0.06);
    assert.equal(verdict(s).key, 'directed');
    assert.equal(s.presetId, null, 'a chip drops the preset');
    let h = setShape(applyPreset(DEFAULT_STATE, 'louder2025'), 'square');
    h = setHeight(h, 6);
    near(read(h).db, 6, 0.4);
    assert.equal(verdict(h).key, 'directed');
    assert.equal(read(clearLine(h)).drawn, 0);
    // halve and double work off the figure, not off the last drawing
    const half = setPeriod(applyPreset(DEFAULT_STATE, 'higher'), 'half');
    near(read(half).periodMs, 1, 0.06);
});

test('the pointer writes one height per column, and going back over a stretch replaces it', () => {
    let s = applyPreset(DEFAULT_STATE, 'blank');
    s = drawAt(s, 10, 0.4);
    assert.equal(s.line[10], 0.4);
    s = drawAt(s, 16, -0.2, 10, 0.4);
    assert.equal(s.line[13] != null, true, 'the columns between are filled in');
    near(s.line[13], 0.1, 1e-6);
    s = drawAt(s, 13, 0.9);
    assert.equal(s.line[13], 0.9);
    assert.equal(drawAt(s, -5, 0.5), s, 'a column off the paper is ignored');
    assert.equal(drawAt(s, COLS + 5, 0.5), s);
});

test('opening the screen to 2 ms a division keeps the wave\'s period, and halves what fits', () => {
    let s = put(applyPreset(DEFAULT_STATE, 'blank'), { shape: 'square', periodMs: 1 });
    near(read(s).periodMs, 1, 0.06);
    near(read(s).cycles, 5, 0.2);
    s = setTimeBase(s, 2);
    assert.equal(spanOf(s), 10);
    near(read(s).periodMs, 1, 0.06, 'the wave has not changed, the paper has');
    near(read(s).cycles, 5, 0.3);
    assert.equal(setTimeBase(s, 7), s, 'an unknown division is ignored');
});

test('the harmonics of one cycle are the shape\'s own: odd only for a square, every one for a saw', () => {
    const ideal = Object.fromEntries(SHAPE_IDS.map((id) => [id, idealHarmonics(id)]));
    assert.equal(ideal.sine.length, HARMONICS);
    near(ideal.sine[0], 1, 1e-6);
    assert.ok(ideal.sine[1] < 0.01 && ideal.sine[2] < 0.01);
    near(ideal.square[2], 1 / 3, 0.01);
    assert.ok(ideal.square[1] < 0.01, 'a square has no second harmonic');
    near(ideal.square[4], 1 / 5, 0.01);
    near(ideal.saw[1], 1 / 2, 0.01);
    near(ideal.saw[2], 1 / 3, 0.01);
    near(ideal.saw[3], 1 / 4, 0.01);
    near(ideal.triangle[2], 1 / 9, 0.01);
    assert.ok(ideal.triangle[1] < 0.01);
    // and the drawn line's match the shape it was named as
    const r = read(put(applyPreset(DEFAULT_STATE, 'blank'), { shape: 'square', periodMs: 1.25 }));
    near(r.harmonics[2], 1 / 3, 0.03);
    assert.ok(r.harmonics[1] < 0.05);
});

test('one cycle is lifted with its DC offset taken off, so the sound has no thump in it', () => {
    const s = put(applyPreset(DEFAULT_STATE, 'blank'), { shape: 'sine', periodMs: 1.25, amp: 0.5, offset: 0.4 });
    const r = read(s);
    const mean = r.cycle.reduce((a, b) => a + b, 0) / r.cycle.length;
    near(mean, 0, 1e-9);
    near(Math.max(...r.cycle), 0.5, 0.02);
    assert.equal(cycleOf(null, null, null), null);
    assert.deepEqual(nameShape(null), { shape: null, score: 0, inverted: false, phase: 0 });
    assert.equal(harmonicsOf(null), null);
});

test('Show answer and the Hear targets are state, and change nothing about the drawing', () => {
    const s = put(applyPreset(DEFAULT_STATE, 'lower2023'), { shape: 'saw', periodMs: 2 });
    const shown = setShowAnswer(s, true);
    assert.equal(shown.showAnswer, true);
    assert.deepEqual(shown.line, s.line);
    assert.equal(setShowAnswer(shown, true), shown);
    const t = setTarget(s, 'yours');
    assert.equal(t.target, 'yours');
    assert.equal(setTarget(t, 'yours'), t);
    assert.equal(shapeAt('square', 0.25), 1);
    assert.equal(shapeAt('square', 0.75), -1);
    near(shapeAt('sine', 0.25), 1, 1e-9);
    near(shapeAt('triangle', 0.25), 1, 1e-9);
    assert.equal(SHAPES.saw.osc, 'sawtooth');
});
