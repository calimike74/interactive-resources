import test from 'node:test';
import assert from 'node:assert/strict';
import {
    drawSet, normaliseCode, randomCode, mulberry32, hashCode, markRound, leanOf, leanSentences,
    soundState, ROUND_TYPES, ROUND_TIMES, ROUND_WETS, ROUNDS_PER_SET, PREDELAY_BY_TYPE,
    TIME_LADDER, WET_LADDER, DRY_RUNG, RULE_OF_THUMB, EMPTY_ANSWER,
} from '../lib/bench/reverb-by-ear.js';

const noDash = (s) => assert.ok(!/[—–]/.test(s) && !/\butilise/i.test(s), `house copy law broken: ${s}`);

test('the same code gives the same five rounds, on every screen', () => {
    assert.deepEqual(drawSet('U6A'), drawSet('U6A'));
    assert.deepEqual(drawSet('U6A', 2), drawSet('U6A', 2));
    // the code is read the way a class types it
    assert.deepEqual(drawSet('u6-a'), drawSet('U6A'));
    assert.deepEqual(drawSet(' u6a '), drawSet('U6A'));
});

test('a different code or a different set number gives different rounds', () => {
    const a = JSON.stringify(drawSet('U6A'));
    assert.notEqual(a, JSON.stringify(drawSet('U6B')));
    assert.notEqual(a, JSON.stringify(drawSet('U6A', 2)));
});

test('every round is drawn from the stated lists, and a set holds every type', () => {
    for (let i = 0; i < 200; i += 1) {
        const set = drawSet(`C${i}`, 1 + (i % 4));
        assert.equal(set.length, ROUNDS_PER_SET);
        for (const r of set) {
            assert.ok(ROUND_TYPES.includes(r.type));
            assert.ok(ROUND_TIMES.includes(r.time));
            assert.ok(ROUND_WETS.includes(r.wet));
            assert.equal(r.predelay, PREDELAY_BY_TYPE[r.type]);
        }
        for (const t of ROUND_TYPES) assert.ok(set.some((r) => r.type === t), `set C${i} has no ${t}`);
        assert.deepEqual(set.map((r) => r.n), [1, 2, 3, 4, 5]);
    }
});

test('the draw uses the whole of each list across many sets', () => {
    const times = new Set();
    const wets = new Set();
    for (let i = 0; i < 300; i += 1) for (const r of drawSet(`K${i}`)) { times.add(r.time); wets.add(r.wet); }
    assert.equal(times.size, ROUND_TIMES.length);
    assert.equal(wets.size, ROUND_WETS.length);
});

test('the PRNG is deterministic and in [0, 1)', () => {
    const a = mulberry32(hashCode('X'));
    const b = mulberry32(hashCode('X'));
    for (let i = 0; i < 1000; i += 1) {
        const x = a();
        assert.equal(x, b());
        assert.ok(x >= 0 && x < 1);
    }
});

test('codes are normalised, and a random one is readable', () => {
    assert.equal(normaliseCode('u6-a!'), 'U6A');
    assert.equal(normaliseCode(''), null);
    assert.equal(normaliseCode(null), null);
    assert.equal(normaliseCode('abcdefghijklmnop'), 'ABCDEFGHIJKL');
    const c = randomCode(mulberry32(7));
    assert.match(c, /^[A-HJ-NP-Z2-9]{4}$/);
});

test('type must match exactly', () => {
    const truth = { type: 'hall', time: 2, wet: 20 };
    assert.equal(markRound({ type: 'hall', time: null, wet: null }, truth).type, true);
    assert.equal(markRound({ type: 'plate', time: null, wet: null }, truth).type, false);
    assert.equal(markRound({ type: null, time: null, wet: null }, truth).type, false);
});

test('reverb time counts within 0.5 s either side, inclusive', () => {
    const truth = { type: 'hall', time: 2, wet: 20 };
    for (const [time, ok] of [[1.5, true], [2.5, true], [2, true], [1.4, false], [2.6, false], [0.6, false]]) {
        assert.equal(markRound({ ...EMPTY_ANSWER, time }, truth).time, ok, `time ${time}`);
    }
    // float steps from a 0.1 slider still land on the edge
    assert.equal(markRound({ ...EMPTY_ANSWER, time: 0.1 + 0.2 + 0.2 }, { ...truth, time: 1 }).time, true);
    assert.equal(markRound({ ...EMPTY_ANSWER, time: 1.1 }, { ...truth, time: 0.6 }).time, true);
});

test('wet level counts within 10 points either side, inclusive', () => {
    const truth = { type: 'hall', time: 2, wet: 30 };
    for (const [wet, ok] of [[20, true], [40, true], [30, true], [15, false], [45, false], [70, false]]) {
        assert.equal(markRound({ ...EMPTY_ANSWER, wet }, truth).wet, ok, `wet ${wet}`);
    }
});

test('a round is out of three', () => {
    const truth = { type: 'plate', time: 2.5, wet: 20 };
    assert.equal(markRound({ type: 'plate', time: 2.2, wet: 25 }, truth).total, 3);
    assert.equal(markRound({ type: 'room', time: 0.8, wet: 60 }, truth).total, 0);
    assert.equal(markRound(null, truth).total, 0);
});

test('the lean is the signed average of answer minus truth', () => {
    // the class's own mistake: too small, too wet
    const rounds = [
        { type: 'hall', time: 2, wet: 20 },
        { type: 'plate', time: 2.5, wet: 10 },
        { type: 'room', time: 1, wet: 30 },
        { type: 'hall', time: 3, wet: 20 },
        { type: 'plate', time: 1.5, wet: 45 },
    ];
    const answers = [
        { type: 'room', time: 1, wet: 50 },       // -1.0, +30
        { type: 'room', time: 1.5, wet: 40 },     // -1.0, +30
        { type: 'room', time: 0.8, wet: 45 },     // -0.2, +15
        { type: 'hall', time: 2.2, wet: 50 },     // -0.8, +30
        { type: 'plate', time: 1.5, wet: 65 },    // 0, +20
    ];
    const lean = leanOf(rounds, answers);
    assert.equal(lean.time, -0.6);
    assert.equal(lean.wet, 25);
    assert.equal(lean.outOf, 15);
    // marks: r1 0, r2 0, r3 type+time (wet 15 out) = 2, r4 type = 1 (time 0.8 out, wet 30 out), r5 type+time = 2
    assert.equal(lean.score, 5);
    assert.deepEqual(lean.picked, { room: 3, hall: 1, plate: 1 });
    assert.deepEqual(lean.cameUp, { room: 1, hall: 2, plate: 2 });
    const said = leanSentences(lean);
    assert.equal(said[0], 'Your reverb times ran on average 0.6 s short.');
    assert.equal(said[1], 'Your wet levels ran 25 points high.');
    assert.equal(said[2], 'You picked Room 3 times. It came up once.');
    said.forEach(noDash);
});

test('the lean skips rows left blank, and says so when a whole row is blank', () => {
    const rounds = [{ type: 'hall', time: 2, wet: 20 }, { type: 'room', time: 1, wet: 30 }];
    const lean = leanOf(rounds, [{ type: 'hall', time: 3, wet: null }, { type: null, time: null, wet: null }]);
    assert.equal(lean.time, 1);
    assert.equal(lean.timeCount, 1);
    assert.equal(lean.wet, null);
    const said = leanSentences(lean);
    assert.equal(said[0], 'Your reverb times ran on average 1 s long.');
    assert.match(said[1], /did not set a wet level/);
});

test('a small lean is called about right, and low wet is said as low', () => {
    const said = leanSentences({ time: 0.1, wet: -12, picked: { room: 1, hall: 2, plate: 2 }, cameUp: { room: 1, hall: 2, plate: 2 } });
    assert.match(said[0], /about right on average \(\+0\.1 s\)/);
    assert.equal(said[1], 'Your wet levels ran 12 points low.');
    assert.equal(said.length, 2);
});

test('the ladders are the ones asked for, and a round plays the vocal on a stereo send', () => {
    assert.deepEqual(TIME_LADDER.map((r) => [r.type, r.time, r.wet]), [['hall', 1, 20], ['hall', 2, 20], ['hall', 3, 20]]);
    assert.deepEqual(WET_LADDER.map((r) => [r.type, r.time, r.wet]), [['hall', 2, 10], ['hall', 2, 30], ['hall', 2, 60]]);
    assert.equal(DRY_RUNG.wet, 0);
    const s = soundState({ type: 'plate', time: 2.5, wet: 20 });
    assert.equal(s.source, 'vocal');
    assert.equal(s.routing, 'send');
    assert.equal(s.stereo, 'stereo');
    assert.equal(s.dry, 100);
    assert.equal(s.predelay, PREDELAY_BY_TYPE.plate);
    noDash(RULE_OF_THUMB);
});
