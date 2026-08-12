import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    computeOutputDb,
    gainReductionDb,
    curvePoints,
    scoreDrawnCurve,
    CURVE_QUESTION_MARKS,
} from '../lib/compression/engine.js';

// The gain computer is the single source of truth for everything the lab
// shows: the SVG transfer curve, the live meter dot, the drawing bench's
// marking. These tests pin its maths to the textbook definitions so the
// on-screen claims stay honest.

test('below threshold with a hard knee, output equals input (unity)', () => {
    const p = { thresholdDb: -24, ratio: 4, kneeDb: 0 };
    assert.equal(computeOutputDb(-40, p), -40);
    assert.equal(computeOutputDb(-24.0001, p), -24.0001);
});

test('above threshold, gain follows the ratio slope', () => {
    const p = { thresholdDb: -24, ratio: 4, kneeDb: 0 };
    // 12 dB over the threshold at 4:1 comes out 3 dB over: -24 + 3 = -21
    assert.equal(computeOutputDb(-12, p), -21);
    // 24 dB over at 2:1 comes out 12 dB over
    assert.equal(computeOutputDb(0, { thresholdDb: -24, ratio: 2, kneeDb: 0 }), -12);
});

test('a 1:1 ratio never changes the signal, wherever the threshold sits', () => {
    const p = { thresholdDb: -24, ratio: 1, kneeDb: 0 };
    for (const inDb of [-60, -24, -12, 0]) {
        assert.equal(computeOutputDb(inDb, p), inDb);
    }
});

test('very high ratios approach limiting: output pinned near the threshold', () => {
    const p = { thresholdDb: -20, ratio: 20, kneeDb: 0 };
    const out = computeOutputDb(0, p); // 20 dB over
    assert.ok(out <= -19 && out >= -20, `expected ~-19, got ${out}`);
});

test('soft knee is continuous at both knee edges and softer in between', () => {
    const p = { thresholdDb: -24, ratio: 4, kneeDb: 12 };
    const hard = { ...p, kneeDb: 0 };
    // At the lower knee edge the curve still equals unity
    assert.ok(Math.abs(computeOutputDb(-30, p) - -30) < 1e-9);
    // At the upper knee edge it matches the hard-knee line
    assert.ok(Math.abs(computeOutputDb(-18, p) - computeOutputDb(-18, hard)) < 1e-9);
    // At the threshold itself, the soft knee is already reducing a little,
    // but less than half the knee width's full-slope reduction
    const atThr = computeOutputDb(-24, p);
    assert.ok(atThr < -24 && atThr > computeOutputDb(-24, hard) - 3);
});

test('gain reduction is input minus output, and never negative', () => {
    const p = { thresholdDb: -24, ratio: 4, kneeDb: 0 };
    assert.equal(gainReductionDb(-12, p), 9);
    assert.equal(gainReductionDb(-40, p), 0);
});

test('makeup gain shifts output without touching gain reduction', () => {
    const p = { thresholdDb: -24, ratio: 4, kneeDb: 0, makeupDb: 6 };
    assert.equal(computeOutputDb(-12, p), -15); // -21 + 6
    assert.equal(gainReductionDb(-12, p), 9);   // unchanged by makeup
});

test('curvePoints spans the requested range monotonically', () => {
    const pts = curvePoints({ thresholdDb: -24, ratio: 4, kneeDb: 6 }, -60, 0, 1);
    assert.equal(pts.length, 61);
    assert.equal(pts[0].inDb, -60);
    assert.equal(pts[60].inDb, 0);
    for (let i = 1; i < pts.length; i++) {
        assert.ok(pts[i].outDb >= pts[i - 1].outDb, 'output must never fall as input rises');
    }
});

// The drawing bench mirrors the 2025 paper's 0-7 mark compression-curve
// tariff. Marking is mean absolute deviation between the drawn line and the
// true curve, sampled across the input range — banding is ours, tariff is real.
test('a perfect drawing scores full marks', () => {
    const p = { thresholdDb: -24, ratio: 4, kneeDb: 0 };
    const drawn = curvePoints(p, -60, 0, 1).map(({ inDb, outDb }) => ({ inDb, outDb }));
    const { marks, meanAbsDb } = scoreDrawnCurve(drawn, p);
    assert.equal(marks, CURVE_QUESTION_MARKS);
    assert.ok(meanAbsDb < 0.01);
});

test('drawing a unity line against real compression scores low', () => {
    const p = { thresholdDb: -24, ratio: 8, kneeDb: 0 };
    const drawn = [];
    for (let inDb = -60; inDb <= 0; inDb += 1) drawn.push({ inDb, outDb: inDb });
    const { marks } = scoreDrawnCurve(drawn, p);
    assert.ok(marks <= 2, `unity line should score at most 2/7, got ${marks}`);
});

test('a close-but-imperfect drawing lands in the middle bands', () => {
    const p = { thresholdDb: -24, ratio: 4, kneeDb: 0 };
    // Right shape, threshold misplaced by 6 dB — a classic near-miss
    const wrong = { thresholdDb: -18, ratio: 4, kneeDb: 0 };
    const drawn = curvePoints(wrong, -60, 0, 1).map(({ inDb, outDb }) => ({ inDb, outDb }));
    const { marks } = scoreDrawnCurve(drawn, p);
    assert.ok(marks >= 3 && marks < CURVE_QUESTION_MARKS, `expected mid-band, got ${marks}`);
});

test('scoring copes with sparse, unsorted drawn points by interpolating', () => {
    const p = { thresholdDb: -24, ratio: 4, kneeDb: 0 };
    const drawn = [0, -60, -24, -12, -40].map((inDb) => ({
        inDb,
        outDb: computeOutputDb(inDb, p),
    }));
    const { marks } = scoreDrawnCurve(drawn, p);
    assert.equal(marks, CURVE_QUESTION_MARKS);
});
