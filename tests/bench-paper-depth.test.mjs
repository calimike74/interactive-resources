import test from 'node:test';
import assert from 'node:assert/strict';
import {
    PRESETS, DEFAULT_STATE, applyPreset, fillLine, clearLine, setShape, setPeriod, setHeight, setTimeBase, spanOf, dbToGain,
    QUESTION_IDS, presetForTask, stemOf,
} from '../lib/bench/paper-model.js';
import { DEPTH_LINES, DEPTH_TEACH, Q, drawingLine, nextMove, judge, open } from '../lib/bench/paper-depth.js';

const noDash = (s) => assert.ok(!/—/.test(s) && !/\butilise/i.test(s), `house style: ${s.slice(0, 60)}`);
const put = (state, wave) => ({ ...state, line: fillLine({ offset: 0, amp: 0.5, ...wave, span: spanOf(state) }) });
// The scheme's own answer drawn on each paper: the state a student reaches.
const solved = {
    lower2023: put(applyPreset(DEFAULT_STATE, 'lower2023'), { shape: 'saw', periodMs: 2 }),
    louder2025: put(applyPreset(DEFAULT_STATE, 'louder2025'), { shape: 'square', periodMs: 2, amp: 0.5 * dbToGain(6) }),
    lower2025: put(applyPreset(DEFAULT_STATE, 'lower2025'), { shape: 'square', periodMs: 4, amp: 0.5 }),
    label2024: put(applyPreset(DEFAULT_STATE, 'label2024'), { shape: 'square', periodMs: 1.5, amp: 0.6 }),
    kick2026: put(applyPreset(DEFAULT_STATE, 'kick2026'), { shape: 'sine', periodMs: 5, amp: 0.6 }),
    higher: put(applyPreset(DEFAULT_STATE, 'higher'), { shape: 'sine', periodMs: 1, amp: 0.6 }),
    kept: applyPreset(DEFAULT_STATE, 'kept'),
    blank: put(applyPreset(DEFAULT_STATE, 'blank'), { shape: 'triangle', periodMs: 1.25 }),
};

test('every preset judges in two segments, AO3 then AO4, short enough for the bar', () => {
    for (const p of PRESETS) {
        for (const st of [applyPreset(DEFAULT_STATE, p.id), solved[p.id]]) {
            const segs = judge({ state: st, last: 'preset' });
            assert.equal(segs.length, 2, p.id);
            assert.deepEqual(segs.map((s) => s.ao), [3, 4]);
            const len = segs[0].text.length + segs[1].text.length + DEPTH_TEACH.alevel.length;
            assert.ok(len < 460, `${p.id} runs to ${len} characters`);
            segs.forEach((s) => noDash(s.text));
        }
    }
});

test('the scheme is quoted with its year on every paper the bench sets', () => {
    assert.match(judge({ state: solved.lower2023, last: 'period' })[1].text, /"Saw wave \(1\); Period of 2ms \(1\) \.\.\. Accept different amplitude" \(2023\)/);
    assert.match(judge({ state: solved.louder2025, last: 'height' })[1].text, /"a louder square wave with period of 2ms and no DC offset" \(2025\)/);
    assert.match(judge({ state: solved.lower2025, last: 'period' })[1].text, /"a square wave with same amplitude as figure 1 and period of 4ms and no DC offset" \(2025\)/);
    assert.match(judge({ state: solved.label2024, last: 'draw' })[1].text, /"Waveshape \(1\) \.\.\. amplitude \(1\)\. Allow peak to peak amplitude \.\.\. Period \(1\)" \(2024\)/);
    assert.match(judge({ state: solved.kick2026, last: 'draw' })[1].text, /"1\/200 \(1\); 0\.005 \/ 5x10-3 \(1\)", then "5 \(1\)" \(2026\)/);
    assert.match(judge({ state: solved.higher, last: 'period' })[1].text, /Numeracy chapter/);
    for (const k of Object.keys(Q)) noDash(Q[k]);
});

test('a right answer is "As directed" and quotes the year\'s report; a wrong one says which mark went', () => {
    for (const id of ['lower2023', 'louder2025', 'lower2025', 'label2024', 'kick2026', 'higher']) {
        assert.match(judge({ state: solved[id], last: 'draw' })[1].text, /^As directed/, id);
    }
    assert.match(judge({ state: solved.lower2023, last: 'period' })[1].text, /"Very few candidates knew that an octave lower was double the period"/);
    assert.match(judge({ state: solved.lower2025, last: 'period' })[1].text, /"Around half of candidates drew a wave with double the period"/);
    assert.match(judge({ state: solved.label2024, last: 'draw' })[1].text, /half a cycle rather than a complete cycle/);
    assert.match(judge({ state: solved.kick2026, last: 'draw' })[1].text, /convert from seconds to milliseconds/);
    // the judge preset: the 2023 report's error, one mark of two
    const kept = judge({ state: solved.kept, last: 'preset' });
    assert.match(kept[0].text, /the width has not changed/);
    assert.match(kept[1].text, /^Not yet, 1 of 2/);
    assert.match(kept[1].text, /Period of 2ms \(1\): not yet/);
});

test('the ladder is written out once the period is on the paper, in the scheme\'s own numbers', () => {
    assert.match(judge({ state: solved.lower2023, last: 'period' })[1].text, /T = 2\.00 ms = 0\.002 s; f = 1 ÷ T = 500 Hz/);
    assert.match(judge({ state: solved.kick2026, last: 'draw' })[1].text, /T = 5\.00 ms = 0\.005 s; f = 1 ÷ T = 200 Hz/);
});

test('a blank paper, a flat line and one cycle are each judged as what they are', () => {
    const blankPaper = judge({ state: applyPreset(DEFAULT_STATE, 'lower2023'), last: 'preset' });
    assert.match(blankPaper[0].text, /Nothing on the answer paper yet/);
    const oneCycle = { ...solved.louder2025, line: solved.louder2025.line.map((v, i) => (i < 115 ? v : null)) };
    const segs = judge({ state: oneCycle, last: 'draw' });
    assert.match(segs[1].text, /only drew one cycle/);
    assert.match(nextMove(oneCycle), /two whole cycles/);
    const flat = { ...solved.blank, line: new Array(solved.blank.line.length).fill(0.2) };
    assert.match(judge({ state: flat, last: 'draw' })[0].text, /flat/);
    assert.match(nextMove(flat), /rather than a straight line/);
});

test('Blank paper sets no question, so the bench reads rather than marks', () => {
    const empty = applyPreset(DEFAULT_STATE, 'blank');
    assert.match(judge({ state: empty, last: 'preset' })[0].text, /Blank paper, nothing to read yet/);
    const drawn = judge({ state: solved.blank, last: 'draw' });
    assert.match(drawn[1].text, /No question is set/);
    assert.match(drawn[0].text, /triangle/);
});

test('the Core line names the shape, the width and how it compares to the figure', () => {
    assert.match(drawingLine(solved.lower2023), /^You drew a saw wave: one cycle every 2\.00 ms/);
    assert.match(drawingLine(solved.lower2023), /twice as wide: an octave lower/);
    assert.match(drawingLine(solved.higher), /half as wide: an octave higher/);
    assert.match(drawingLine(solved.kept), /the same width, so the same pitch/);
    assert.match(drawingLine(solved.louder2025), /twice the height/);
    assert.match(drawingLine(applyPreset(DEFAULT_STATE, 'lower2023')), /^The answer paper is blank\./);
    const offset = put(applyPreset(DEFAULT_STATE, 'lower2023'), { shape: 'saw', periodMs: 2, amp: 0.3, offset: -0.45 });
    assert.match(drawingLine(offset), /which is a DC offset/);
    for (const p of PRESETS) { noDash(drawingLine(applyPreset(DEFAULT_STATE, p.id))); noDash(drawingLine(solved[p.id])); }
});

test('every next move is a real instruction a student can follow', () => {
    for (const p of PRESETS) {
        const m = nextMove(applyPreset(DEFAULT_STATE, p.id));
        assert.ok(m.length > 20, p.id);
        noDash(m);
    }
    assert.match(nextMove(applyPreset(DEFAULT_STATE, 'lower2023')), /press Saw, then Double/);
    assert.match(nextMove(applyPreset(DEFAULT_STATE, 'louder2025')), /Height dial/);
    assert.match(nextMove(clearLine(solved.blank)), /draw two cycles/);
});

test('Extension opens the harmonics in its own words, with no AO tags', () => {
    const line = open({ state: solved.lower2023, last: 'period' });
    assert.match(line, /fundamental is 500 Hz/);
    assert.match(line, /second harmonic is 50 per cent/);
    assert.match(line, /every harmonic, odd and even/);
    assert.ok(!/AO[34]/.test(line));
    assert.ok(line.length > 60 && line.length < 560, `${line.length} characters`);
    const sq = open({ state: solved.louder2025, last: 'draw' });
    assert.match(sq, /odd harmonics only/);
    const empty = open({ state: applyPreset(DEFAULT_STATE, 'blank'), last: 'preset' });
    assert.match(empty, /Nothing to take apart yet/);
    noDash(line); noDash(sq); noDash(empty);
});

test('the depth lines announce a job each, in the house style', () => {
    for (const k of ['core', 'alevel', 'extension']) { assert.ok(DEPTH_LINES[k].length > 100, k); noDash(DEPTH_LINES[k]); }
    noDash(DEPTH_TEACH.alevel); noDash(DEPTH_TEACH.extension);
});

test('the chips reach the scheme\'s answer, and the line says so', () => {
    let s = setPeriod(setShape(applyPreset(DEFAULT_STATE, 'lower2023'), 'saw'), 'double');
    assert.match(judge({ state: s, last: 'period' })[1].text, /^As directed/);
    s = setHeight(setShape(applyPreset(DEFAULT_STATE, 'louder2025'), 'square'), 6);
    assert.match(judge({ state: s, last: 'height' })[1].text, /^As directed/);
    s = setPeriod(setShape(applyPreset(DEFAULT_STATE, 'lower2025'), 'square'), 'double');
    assert.match(judge({ state: s, last: 'period' })[1].text, /^As directed/);
    s = setPeriod(setShape(applyPreset(DEFAULT_STATE, 'higher'), 'sine'), 'half');
    assert.match(judge({ state: s, last: 'period' })[1].text, /^As directed/);
});

test('opening the paper to 2 ms a division changes the picture, not the judgement', () => {
    const before = judge({ state: solved.lower2023, last: 'period' })[1].text;
    const after = judge({ state: setTimeBase(solved.lower2023, 2), last: 'screen' })[1].text;
    assert.match(before, /^As directed/);
    assert.match(after, /^As directed/);
});

test('the question printed on the stage and the scheme quoted at A-level name the same paper', () => {
    // One string for the question (stemOf) and one for the scheme, so the
    // stage above the grids and the marks panel beside them cannot drift.
    for (const id of QUESTION_IDS) {
        const st = applyPreset(DEFAULT_STATE, presetForTask(id).id);
        const stem = stemOf(st);
        const said = judge({ state: st, last: 'preset' })[1].text;
        const year = stem.where.match(/\b(19|20)\d{2}\b/);
        if (year) assert.match(said, new RegExp(`\\(${year[0]}\\)`), `${id}: the stage says ${stem.where} and A-level quotes ${said.slice(0, 60)}`);
        else assert.match(said, /Numeracy chapter/, id);
        assert.ok(stem.ask.endsWith('.'), `${id}: the question is a sentence`);
    }
});

test('every question in the walk has a next move to offer at Core, and the blank paper too', () => {
    for (const p of PRESETS) {
        const st = applyPreset(DEFAULT_STATE, p.id);
        const move = nextMove(st);
        assert.ok(move && move.length > 20, `${p.id}: "${move}"`);
        noDash(move);
        noDash(drawingLine(st));
    }
});
