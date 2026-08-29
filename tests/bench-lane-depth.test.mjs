import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATE, PRESETS, applyPreset, setTarget, movePoint, flattenLane } from '../lib/bench/lane-model.js';
import { DEPTH_LINES, DEPTH_TEACH, hearingLine, nextMove, judge, open } from '../lib/bench/lane-depth.js';

test('every preset judges in two segments, AO3 then AO4, short enough for the bar', () => {
    for (const p of PRESETS) {
        const st = applyPreset(DEFAULT_STATE, p.id);
        const segs = judge({ state: st, last: 'preset' });
        assert.equal(segs.length, 2, p.id);
        assert.deepEqual(segs.map((s) => s.ao), [3, 4]);
        const len = segs[0].text.length + segs[1].text.length + DEPTH_TEACH.alevel.length;
        assert.ok(len < 560, `${p.id} runs to ${len} characters`);
    }
});

test('the fault presets say "Not as directed" and quote the year', () => {
    for (const id of ['late', 'backwards', 'slow', 'short']) {
        const segs = judge({ state: applyPreset(DEFAULT_STATE, id), last: 'preset' });
        assert.match(segs[1].text, /^Not as directed/);
        assert.match(segs[1].text, /\(20\d\d\)/);
    }
});

test('an edited lane is judged from its checks, a free lane is described', () => {
    const st = movePoint(applyPreset(DEFAULT_STATE, 'pan'), 1, 4, 0.3);
    const segs = judge({ state: st, last: 'point' });
    assert.match(segs[0].text, /not hard left/);
    assert.match(segs[1].text, /^Not as directed/);
    const free = judge({ state: setTarget(st, 'send'), last: 'target' });
    assert.match(free[1].text, /No stem set/);
});

test('the Core line names the part and the shape, and the flat lane is called out', () => {
    const st = applyPreset(DEFAULT_STATE, 'pan');
    assert.match(hearingLine(st), /the keys' pan follow a step/);
    assert.match(hearingLine(st), /^You are hearing the keys/);
    assert.match(hearingLine(flattenLane(st)), /no automation at all/);
    assert.match(hearingLine(applyPreset(DEFAULT_STATE, 'late')), /73 ms late/);
});

test('every preset has a next move, and faults map to a fix', () => {
    for (const p of PRESETS) assert.ok(nextMove(applyPreset(DEFAULT_STATE, p.id)).length > 20, p.id);
    const st = movePoint(applyPreset(DEFAULT_STATE, 'pan'), 1, 4, 0.3);
    assert.match(nextMove(st), /full travel/);
    assert.match(nextMove(flattenLane(setTarget(st, 'send'))), /click the lane/);
});

test('Extension names where the lane writes, per target, and the modes after a touch', () => {
    const st = applyPreset(DEFAULT_STATE, 'pan');
    assert.match(open({ state: st, last: 'preset' }), /pan pot/);
    assert.match(open({ state: setTarget(st, 'filter'), last: 'target' }), /inside the insert/);
    assert.match(open({ state: setTarget(st, 'vol'), last: 'target' }), /fader/);
    assert.match(open({ state: setTarget(st, 'send'), last: 'target' }), /send after the fader/);
    assert.match(open({ state: st, last: 'write' }), /Latch/);
    assert.ok(DEPTH_LINES.core.length && DEPTH_LINES.alevel.length && DEPTH_LINES.extension.length);
});
