import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    decayDbAt,
    irEnvelope,
    envelopePoints,
    wetDryLevels,
    scoreMatch,
    MATCH_ROUND_MARKS,
} from '../lib/reverb/engine.js';

// The engine is the single source of truth for the lab: the decay-envelope
// plot, the generated impulse responses and the ear-bench marking all read
// from these functions.

test('RT60 means exactly what it says: −60 dB at the decay time', () => {
    assert.ok(Math.abs(decayDbAt(1.8, 1.8) - -60) < 1e-9);
    assert.equal(decayDbAt(0, 1.8), 0);
    assert.ok(Math.abs(decayDbAt(0.9, 1.8) - -30) < 1e-9);
});

test('the envelope is silent before the pre-delay and decays after it', () => {
    const p = { rt60S: 2, preDelayS: 0.08 };
    assert.equal(irEnvelope(0.04, p), 0);
    assert.equal(irEnvelope(0.079, p), 0);
    // At the pre-delay boundary the tail starts at full level
    assert.ok(Math.abs(irEnvelope(0.08, p) - 1) < 1e-9);
    // One RT60 later it has fallen to 1/1000 (−60 dB)
    assert.ok(Math.abs(irEnvelope(2.08, p) - 0.001) < 1e-6);
});

test('a gated tail cuts dead after the hold time', () => {
    const p = { rt60S: 3, preDelayS: 0, gated: true, gateHoldS: 0.25 };
    assert.ok(irEnvelope(0.2, p) > 0.5, 'inside the hold the tail is strong');
    assert.equal(irEnvelope(0.26, p), 0, 'after the hold the tail is gone');
    const ungated = { rt60S: 3, preDelayS: 0 };
    assert.ok(irEnvelope(0.26, ungated) > 0.5, 'without the gate it would still be ringing');
});

test('envelopePoints spans the range and never rises after the peak', () => {
    const pts = envelopePoints({ rt60S: 1.5, preDelayS: 0.05 }, 0, 2, 0.01);
    assert.equal(pts[0].tS, 0);
    assert.ok(Math.abs(pts[pts.length - 1].tS - 2) < 1e-9);
    const peakIx = pts.findIndex((p) => p.level > 0.999);
    for (let i = peakIx + 1; i < pts.length; i++) {
        assert.ok(pts[i].level <= pts[i - 1].level + 1e-9, 'decay must be monotonic');
    }
});

test('wet/dry is equal-power: no loudness bump in the middle', () => {
    const dry = wetDryLevels(0);
    const half = wetDryLevels(0.5);
    const wet = wetDryLevels(1);
    assert.ok(Math.abs(dry.dry - 1) < 1e-9 && Math.abs(dry.wet) < 1e-9);
    assert.ok(Math.abs(wet.wet - 1) < 1e-9 && Math.abs(wet.dry) < 1e-9);
    assert.ok(Math.abs(half.wet ** 2 + half.dry ** 2 - 1) < 1e-9);
});

// The ear bench: three settings to match by listening. Marked per parameter
// (decay 2, pre-delay 2, amount 2 = 6) so feedback can say WHICH dimension
// of the space was misheard. The 6 mirrors the 2020 paper's 6-mark gated
// reverb task's weight; the banding is ours.
test('a perfect match scores full marks', () => {
    const t = { rt60S: 1.6, preDelayMs: 40, mix: 0.35 };
    const { marks } = scoreMatch({ ...t }, t);
    assert.equal(marks, MATCH_ROUND_MARKS);
});

test('a wildly wrong guess scores at most 1', () => {
    const t = { rt60S: 0.4, preDelayMs: 0, mix: 0.15 };
    const guess = { rt60S: 4.5, preDelayMs: 110, mix: 0.9 };
    const { marks } = scoreMatch(guess, t);
    assert.ok(marks <= 1, `expected <=1, got ${marks}`);
});

test('decay is judged by ratio, not absolute seconds', () => {
    // 0.4s vs 0.5s is the same miss as 4.0s vs 5.0s — both a 1.25× ratio.
    const shortRoom = scoreMatch({ rt60S: 0.5, preDelayMs: 20, mix: 0.3 }, { rt60S: 0.4, preDelayMs: 20, mix: 0.3 });
    const longHall = scoreMatch({ rt60S: 5.0, preDelayMs: 20, mix: 0.3 }, { rt60S: 4.0, preDelayMs: 20, mix: 0.3 });
    assert.equal(shortRoom.breakdown[0].earned, longHall.breakdown[0].earned);
});

test('each parameter is marked independently in the breakdown', () => {
    const t = { rt60S: 1.6, preDelayMs: 40, mix: 0.35 };
    const { marks, breakdown } = scoreMatch({ rt60S: 1.6, preDelayMs: 40, mix: 0.95 }, t);
    assert.equal(breakdown.length, 3);
    assert.equal(breakdown[0].earned, 2, 'decay was right');
    assert.equal(breakdown[1].earned, 2, 'pre-delay was right');
    assert.ok(breakdown[2].earned === 0, 'amount was way off');
    assert.equal(marks, 4);
});
