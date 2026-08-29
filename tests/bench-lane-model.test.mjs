import test from 'node:test';
import assert from 'node:assert/strict';
import {
    DEFAULT_STATE, PRESETS, TASKS, UNITY, BEATS,
    valueAt, sampleLane, sortPoints, curveFor, toUnit, fromUnit, fmtValue, valueWord,
    applyPreset, setTarget, setPart, setShape, movePoint, addPoint, removePoint, writePoint, touchRelease, TOUCH_STEP, resetLane, flattenLane,
    checks, verdict, crossingAt, beatMs, pointWords, movingBars, listBars, snapT, fmtBeat,
} from '../lib/bench/lane-model.js';

const near = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol, `${a} not within ${tol} of ${b}`);

test('a step holds, a line moves evenly, a curve eases', () => {
    const pts = [{ t: 0, v: 0 }, { t: 4, v: 1 }];
    near(valueAt(pts, 'step', 2), 0);
    near(valueAt(pts, 'step', 4), 1);
    near(valueAt(pts, 'line', 2), 0.5);
    assert.ok(valueAt(pts, 'curve', 2) > 0.5, 'a curve is ahead of the line halfway');
    near(valueAt(pts, 'curve', 4), 1);
    near(valueAt(pts, 'line', -1), 0);
    near(valueAt(pts, 'line', 10), 1);
});

test('two points at one time are a jump, the later winning', () => {
    const pts = sortPoints([{ t: 8, v: 0.5 }, { t: 0, v: 0.5 }, { t: 8, v: 0 }]);
    assert.deepEqual(pts.map((p) => p.t), [0, 8, 8]);
    // insertion order kept for the tie: (8, 0.5) came before (8, 0), so a
    // line holds 0.5 up to the jump and the jump lands on 0
    near(valueAt(pts, 'line', 7.99), 0.5);
    near(valueAt(pts, 'line', 8), 0);
});

test('values map to units and back, and format the way the stems say them', () => {
    near(toUnit('vol', UNITY), 0, 1e-9);
    assert.equal(toUnit('vol', 0), -Infinity);
    near(toUnit('pan', 0), -1); near(toUnit('pan', 1), 1); near(toUnit('pan', 0.5), 0);
    near(toUnit('filter', 0), 100); near(toUnit('filter', 1), 16000);
    for (const tg of ['vol', 'pan', 'filter', 'send']) near(fromUnit(tg, toUnit(tg, 0.37)), 0.37, 1e-9);
    assert.equal(fmtValue('pan', 0), 'L 100'); assert.equal(fmtValue('pan', 0.5), 'C'); assert.equal(fmtValue('pan', 0.8), 'R 60');
    assert.equal(fmtValue('vol', UNITY), '0.0 dB'); assert.equal(fmtValue('vol', 0), 'off');
    assert.equal(fmtValue('filter', 1), '16 kHz'); assert.equal(fmtValue('send', 0), 'dry');
    assert.equal(valueWord('pan', 0.02), 'hard left'); assert.equal(valueWord('vol', UNITY), 'original level'); assert.equal(valueWord('filter', 0.3), 'half closed');
});

test('the engine curve is in the parameter\'s units', () => {
    const s = { ...DEFAULT_STATE, target: 'vol', shape: 'step', points: [{ t: 0, v: UNITY }] };
    const c = curveFor(s, 16);
    near(c[0], 1, 1e-6);
    const p = { ...DEFAULT_STATE, target: 'pan', shape: 'step', points: [{ t: 0, v: 0 }, { t: 8, v: 1 }] };
    const cp = curveFor(p, 16);
    near(cp[0], -1); near(cp[15], 1);
});

test('each preset lands on the scheme\'s line', () => {
    const want = { pan: 'directed', late: 'placement', sweep: 'directed', backwards: 'direction', filter: 'directed', slow: 'start', ramp: 'directed', short: 'smooth' };
    for (const p of PRESETS) {
        const st = applyPreset(DEFAULT_STATE, p.id);
        const v = verdict(st);
        assert.equal(v.key, want[p.id], `${p.id}: ${v.faults.map((f) => f.text).join(' | ')}`);
        assert.equal(st.task, p.task);
        assert.equal(st.part, TASKS[p.task].part);
    }
});

test('the late step reads 73 ms late and only that', () => {
    const st = applyPreset(DEFAULT_STATE, 'late');
    near(crossingAt(st.points, st.shape, 4), 0.125);
    assert.equal(beatMs(0.125), 73);
    const v = verdict(st);
    assert.equal(v.faults.length, 1, v.faults.map((f) => f.id).join(','));
    assert.match(v.faults[0].text, /73 ms late/);
});

test('the short ramp is uneven and short, and bar 4 is back at the level', () => {
    const v = verdict(applyPreset(DEFAULT_STATE, 'short'));
    assert.deepEqual(v.faults.map((f) => f.id), ['smooth', 'arrival']);
    assert.match(v.faults[1].text, /6 dB short/);
});

test('scope leaks are caught, brief overshoots are not', () => {
    const st = applyPreset(DEFAULT_STATE, 'pan');
    const leaked = { ...st, points: [{ t: 0, v: 0.5 }, { t: 4, v: 0 }, { t: 8, v: 1 }, { t: 12, v: 0.7 }] };
    const v = verdict(leaked);
    assert.equal(v.key, 'scope');
    assert.match(v.faults[0].text, /bar 4 sits at R 40/);
    // the late step's 70 ms spill into bar 4 is placement, not scope
    const late = verdict(applyPreset(DEFAULT_STATE, 'late'));
    assert.ok(!late.faults.some((f) => f.id === 'scope'));
});

test('a sweep drawn as a step fails smoothly, and backwards fails direction first', () => {
    const st = setShape(applyPreset(DEFAULT_STATE, 'sweep'), 'step');
    const v = verdict(st);
    assert.ok(v.faults.some((f) => f.id === 'smooth'));
    const b = verdict(applyPreset(DEFAULT_STATE, 'backwards'));
    assert.equal(b.faults[0].id, 'direction');
});

test('switching part or target keeps the points and drops the task', () => {
    const st = applyPreset(DEFAULT_STATE, 'pan');
    const t = setTarget(st, 'filter');
    assert.equal(t.task, null); assert.equal(t.presetId, null);
    assert.deepEqual(t.points, st.points);
    assert.equal(verdict(t).key, 'free');
    const p = setPart(st, 'guitar');
    assert.equal(p.task, null);
    assert.equal(checks(p).length, 0);
});

test('moving a point snaps to the grid and stays between its neighbours', () => {
    const st = applyPreset(DEFAULT_STATE, 'pan'); // grid: bar
    const m = movePoint(st, 1, 5.4, 0.2);
    assert.equal(m.points[1].t, 4); near(m.points[1].v, 0.2);
    assert.equal(m.presetId, null);
    const over = movePoint(st, 1, 11, 0);
    assert.equal(over.points[1].t, 8, 'cannot pass the next point');
    const beat = movePoint({ ...st, grid: 'beat' }, 1, 5.4, 0);
    assert.equal(beat.points[1].t, 5);
    const free = movePoint({ ...st, grid: 'free' }, 1, 4.13, 0);
    assert.equal(free.points[1].t, 4.125);
});

test('adding, removing and touch-writing points', () => {
    const st = applyPreset(DEFAULT_STATE, 'pan');
    const { state: a, index } = addPoint({ ...st, grid: 'beat' }, 6.2, 0.9);
    assert.equal(a.points.length, 5);
    assert.equal(a.points[index].t, 6); near(a.points[index].v, 0.9);
    const r = removePoint(a, index);
    assert.deepEqual(r.points, st.points);
    assert.equal(removePoint({ ...st, points: [{ t: 0, v: 0.5 }] }, 0).points.length, 1, 'never below one point');
});

test('touch writes at the automation\'s own resolution, whatever the grid, and returns to the lane on release', () => {
    const st = applyPreset(DEFAULT_STATE, 'pan'); // grid bar
    assert.equal(TOUCH_STEP, 1 / 16);
    // a dial move at beat 4.3 lands on the nearest 16th, not the barline
    const w = writePoint(st, 4.3, 0.75);
    assert.equal(w.points.length, 5);
    const hit = w.points.find((p) => Math.abs(p.t - 4.3125) < 1e-9);
    assert.ok(hit, 'a point at 4.3125'); near(hit.v, 0.75);
    assert.ok(w.points.some((p) => p.t === 4 && p.v === 0), 'the barline point is untouched');
    // a second move within the same step replaces, never stacks
    const w2 = writePoint(w, 4.33, 0.6);
    assert.equal(w2.points.length, 5); near(w2.points.find((p) => Math.abs(p.t - 4.3125) < 1e-9).v, 0.6);
    // the same value at the same step is not a change
    assert.equal(writePoint(w2, 4.33, 0.6), w2);
    // a passage of moves writes one point per step it crosses
    let s = st;
    for (let t = 5; t < 5.95; t += 1 / 64) s = writePoint(s, t, 0.9);
    assert.equal(s.points.length, 4 + 16, 'sixteen steps from 5 to 5.9375');
    // release at 6.02: the lane returns to what it was there (pan hard right after bar 3's start, so 1 at 8; 0 between 4 and 8)
    const back = touchRelease(s, st, 6.02);
    const ret = back.points.find((p) => Math.abs(p.t - 6.0625) < 1e-9);
    assert.ok(ret, 'a return point one step after the release'); near(ret.v, valueAt(st.points, st.shape, 6.0625));
    near(valueAt(back.points, 'step', 7), 0); // back on the original value after the release
    near(valueAt(back.points, 'step', 5.5), 0.9); // the passage stands
    // released off the end of the loop: nothing to return to
    assert.equal(touchRelease(s, st, 15.99), s);
});

test('reset returns to the stem\'s lane; flatten returns to rest', () => {
    const st = applyPreset(DEFAULT_STATE, 'late');
    const r = resetLane(st);
    assert.deepEqual(r.points, TASKS['pan-step'].model.points);
    assert.equal(r.presetId, 'pan');
    const f = flattenLane(st);
    assert.deepEqual(f.points, [{ t: 0, v: 0.5 }]);
    const noTask = resetLane(setTarget(st, 'send'));
    assert.deepEqual(noTask.points, [{ t: 0, v: 0 }]);
});

test('the lane in words', () => {
    const st = applyPreset(DEFAULT_STATE, 'pan');
    assert.equal(pointWords(st), 'centre from the start, hard left at bar 2, hard right at bar 3, centre at bar 4');
    assert.deepEqual(movingBars(st), [2, 3, 4]);
    assert.equal(listBars([2, 3]), 'bars 2 and 3');
    assert.equal(listBars([]), 'no bar');
    assert.equal(fmtBeat(4), 'bar 2'); assert.equal(fmtBeat(5), 'bar 2 beat 2'); assert.equal(fmtBeat(4.5), 'bar 2 beat 1.5');
    assert.equal(snapT(16.4, 'beat'), BEATS);
    assert.equal(sampleLane(st.points, 'step', 16)[4], 0);
});
