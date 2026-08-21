import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    NOTE_VALUES,
    CORE_NOTE_IDS,
    FURTHER_NOTE_IDS,
    delayTimeSec,
    repeatMarks,
    mixGains,
    highCutHz,
    PRESETS,
    applyPreset,
    DEFAULT_STATE,
} from '../lib/bench/delay-model.js';

const close = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

test('the exam note values come first and give the textbook milliseconds at 120 BPM', () => {
    assert.deepEqual(CORE_NOTE_IDS, ['quarter', 'eighth', 'sixteenth']);
    assert.deepEqual(FURTHER_NOTE_IDS, ['half', 'dottedEighth', 'tripletEighth']);
    const ms = (id) => Math.round(delayTimeSec({ sync: true, noteId: id, bpm: 120 }) * 1000);
    assert.equal(ms('quarter'), 500);
    assert.equal(ms('eighth'), 250);
    assert.equal(ms('sixteenth'), 125);
    assert.equal(ms('half'), 1000);
    assert.equal(ms('dottedEighth'), 375);
    assert.equal(ms('tripletEighth'), 167);
});

test('every note value has a label a student can read and a beats figure', () => {
    for (const id of [...CORE_NOTE_IDS, ...FURTHER_NOTE_IDS]) {
        const n = NOTE_VALUES[id];
        assert.ok(n, `${id} missing from NOTE_VALUES`);
        assert.ok(n.label.length > 0);
        assert.ok(n.beats > 0);
    }
});

test('free time ignores tempo and note value; sync ignores the ms knob', () => {
    assert.ok(close(delayTimeSec({ sync: false, timeMs: 273, bpm: 90, noteId: 'eighth' }), 0.273));
    assert.ok(close(delayTimeSec({ sync: true, timeMs: 273, bpm: 90, noteId: 'eighth' }), 60 / 90 / 2));
});

test('delay time is clamped to the audible working range', () => {
    assert.ok(close(delayTimeSec({ sync: false, timeMs: 1 }), 0.02));
    assert.ok(close(delayTimeSec({ sync: false, timeMs: 9000 }), 2.0));
});

test('repeat marks follow the feedback recursion: n-th repeat is amp × fb^n at t0 + n × delay', () => {
    const marks = repeatMarks({ t0: 1.0, amp: 1, delaySec: 0.25, feedback: 50, windowEnd: 10 });
    assert.ok(marks.length >= 5);
    assert.ok(close(marks[0].t, 1.25));
    assert.ok(close(marks[0].level, 0.5));
    assert.ok(close(marks[1].t, 1.5));
    assert.ok(close(marks[1].level, 0.25));
    // stops once quieter than 2%
    assert.ok(marks.every((m) => m.level >= 0.02));
});

test('feedback at 100% does not decay and is cut by the window, never infinite', () => {
    const marks = repeatMarks({ t0: 0, amp: 1, delaySec: 0.5, feedback: 100, windowEnd: 4 });
    assert.equal(marks.length, 8);
    assert.ok(marks.every((m) => close(m.level, 1)));
});

test('feedback at 0% gives exactly one repeat (the single echo)', () => {
    const marks = repeatMarks({ t0: 0, amp: 1, delaySec: 0.3, feedback: 0, windowEnd: 4 });
    assert.equal(marks.length, 1);
    assert.ok(close(marks[0].level, 0));
});

test('ping-pong alternates lanes starting on the opposite side; mono stays centre', () => {
    const pp = repeatMarks({ t0: 0, amp: 1, delaySec: 0.25, feedback: 60, windowEnd: 2, stereo: 'pingpong' });
    assert.deepEqual(pp.slice(0, 4).map((m) => m.lane), ['R', 'L', 'R', 'L']);
    const mono = repeatMarks({ t0: 0, amp: 1, delaySec: 0.25, feedback: 60, windowEnd: 2, stereo: 'mono' });
    assert.ok(mono.every((m) => m.lane === 'C'));
});

test('mix is equal-power: dry and wet squares sum to one, so 50% does not dip', () => {
    for (const mix of [0, 25, 50, 75, 100]) {
        const { dry, wet } = mixGains(mix);
        assert.ok(close(dry * dry + wet * wet, 1, 1e-9), `mix ${mix}`);
    }
    assert.ok(close(mixGains(0).dry, 1));
    assert.ok(close(mixGains(100).wet, 1));
});

test('high cut maps 0..100 onto a log sweep from tape-dark 1.5 kHz to open 20 kHz', () => {
    assert.ok(close(highCutHz(0), 1500, 1));
    assert.ok(close(highCutHz(100), 20000, 1));
    const mid = highCutHz(50);
    assert.ok(mid > 4000 && mid < 7000, `midpoint ${mid} should sit at the geometric middle`);
});

test('presets are musical names, each resolves to a full state, and the first-load preset is audible', () => {
    assert.deepEqual(PRESETS.map((p) => p.name), ['Slapback', 'Rhythmic 1/8', 'Long tail', 'Ping-pong']);
    for (const p of PRESETS) {
        const s = applyPreset(DEFAULT_STATE, p.id);
        for (const key of ['sync', 'noteId', 'timeMs', 'feedback', 'mix', 'bpm', 'highCut', 'stereo']) {
            assert.ok(key in s, `${p.name} leaves ${key} undefined`);
        }
    }
    assert.equal(DEFAULT_STATE.presetId, 'rhythmic');
    assert.ok(DEFAULT_STATE.mix >= 30, 'first load must be clearly wet');
    assert.ok(DEFAULT_STATE.feedback >= 25, 'first load must show more than one repeat');
    const slap = applyPreset(DEFAULT_STATE, 'slapback');
    assert.equal(slap.sync, false);
    assert.ok(slap.timeMs >= 80 && slap.timeMs <= 140, 'slapback lives between 80 and 140 ms');
    assert.ok(slap.feedback <= 10, 'slapback is one repeat, not a tail');
});
