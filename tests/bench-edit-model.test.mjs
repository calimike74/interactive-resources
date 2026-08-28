import test from 'node:test';
import assert from 'node:assert/strict';
import {
    DEFAULT_STATE, PRESETS, SHAPE_IDS, applyPreset, setParam,
    fadeIn, fadeOut, sumDb, dipDb, nearestRisingZero, stepAt, tailEndIdx, renderEdit,
    joinPoints, snapCutMs, editStats, loopWindow, cutRange, lengthWord, fmtMs, fmtSec,
} from '../lib/bench/edit-model.js';

// The Edit bench (1.6): the click the student hears is the step these
// functions measure, and the fade they hear is the curve they draw. These
// tests are that contract.

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);
const SR = 44100;
// a 200 Hz sine, one second: 220.5 samples a cycle
const sine = (n = SR, f = 200, amp = 0.8, phase = 0) => Float32Array.from({ length: n }, (_, i) => amp * Math.sin(2 * Math.PI * f * (i / SR) + phase));

test('every shape fades in from 0 to 1 and out from 1 to 0', () => {
    for (const s of SHAPE_IDS) {
        near(fadeIn(s, 0), 0, 1e-9, `${s} in at 0`);
        near(fadeIn(s, 1), 1, 1e-9, `${s} in at 1`);
        near(fadeOut(s, 0), 1, 1e-9, `${s} out at 0`);
        near(fadeOut(s, 1), 0, 1e-9, `${s} out at 1`);
        let prev = -1;
        for (let t = 0; t <= 1; t += 0.05) { const g = fadeIn(s, t); assert.ok(g >= prev - 1e-9, `${s} never falls back`); prev = g; }
    }
});

test('a linear crossfade of unrelated sounds dips 3 dB in the middle; equal power holds level', () => {
    near(sumDb('linear', 0.5), -3.01, 0.02, 'linear midpoint');
    near(dipDb('linear'), -3.01, 0.02, 'linear dip');
    for (let t = 0; t <= 1; t += 0.1) near(sumDb('power', t), 0, 1e-6, `equal power at ${t}`);
    near(dipDb('power'), 0, 1e-6, 'equal power never dips');
    near(sumDb('scurve', 0.5), -3.01, 0.02, 'S-curve midpoint');
});

test('the nearest rising zero crossing is found either side, and idx stands when there is none', () => {
    const ch = sine();
    const idx = 1000; // somewhere mid-cycle
    const z = nearestRisingZero(ch, idx);
    assert.ok(ch[z - 1] <= 0 && ch[z] > 0, 'lands where the wave comes up through zero');
    assert.ok(Math.abs(z - idx) <= 221, 'within a cycle');
    const flat = new Float32Array(2000).fill(0.5);
    assert.equal(nearestRisingZero(flat, 900), 900);
});

test('a hard cut mid-cycle steps; the same cut snapped to zero crossings does not', () => {
    const ch = sine();
    const outIdx = 1000; const inIdx = 1000 + 5000;
    const rough = stepAt(ch, outIdx, ch, inIdx);
    assert.ok(rough > 0.05, `mid-cycle join jumps (${rough})`);
    const z1 = nearestRisingZero(ch, outIdx); const z2 = nearestRisingZero(ch, inIdx);
    const clean = stepAt(ch, z1, ch, z2);
    assert.ok(clean < 0.03, `zero-crossing join does not (${clean})`);
    near(stepAt(ch, outIdx, null, 0), Math.abs(ch[outIdx - 1]), 1e-9, 'a trim steps to silence');
});

test('a splice with no fade butts A against B at the cut; the join is where the cut was', () => {
    const a = sine(SR, 200, 0.8);
    const b = sine(SR, 200, 0.8, 1.5);
    const r = renderEdit({ a, b, outIdx: 1000, inIdx: 5000, lengthSamples: 0 });
    assert.equal(r.join, 1000);
    assert.equal(r.data.length, 1000 + (SR - 5000));
    near(r.data[999], a[999], 1e-9, 'last of A');
    near(r.data[1000], b[5000], 1e-9, 'first of B');
});

test('a crossfade is centred on the cut, uses the material either side of the region edges, and sums to the two fades', () => {
    const a = new Float32Array(SR).fill(1);
    const b = new Float32Array(SR).fill(1);
    const r = renderEdit({ a, b, outIdx: 1000, inIdx: 5000, shape: 'linear', lengthSamples: 100 });
    assert.equal(r.fadeStart, 950); assert.equal(r.fadeEnd, 1050);
    near(r.data[949], 1, 1e-9, 'before the fade: A alone');
    near(r.data[1000], 1, 1e-6, 'linear on two constants sums to one at the middle');
    near(r.data[1050], 1, 1e-9, 'after the fade: B alone');
    const p = renderEdit({ a, b, outIdx: 1000, inIdx: 5000, shape: 'power', lengthSamples: 100 });
    near(p.data[1000], Math.SQRT2, 1e-3, 'equal power on two identical constants peaks at root two mid-fade (they are correlated)');
});

test('a trim ends at the cut, fades inside the region, and is padded with silence', () => {
    const a = new Float32Array(SR).fill(0.5);
    const r = renderEdit({ a, outIdx: 20000, shape: 'linear', lengthSamples: 1000, padSamples: 4410 });
    assert.equal(r.data.length, 20000 + 4410);
    assert.equal(r.join, 20000);
    near(r.data[18999], 0.5, 1e-9, 'before the fade');
    near(r.data[19500], 0.25, 1e-3, 'half way down');
    near(r.data[20000], 0, 1e-9, 'silence after');
    assert.equal(r.fadeStart, 19000);
});

test('the tail end is where the take stops sounding, not where it looks finished', () => {
    const ch = new Float32Array(SR);
    for (let i = 0; i < SR; i += 1) ch[i] = Math.exp(-i / (SR * 0.15)) * Math.sin(i * 0.3);
    const end = tailEndIdx(ch, SR, 0.001);
    assert.ok(end > SR * 0.9, `rings almost to the end (${end / SR})`);
    const loud = tailEndIdx(ch, SR, 0.05);
    assert.ok(loud < SR * 0.6 && loud > SR * 0.3, `looks finished under half way (${loud / SR})`);
});

test('joinPoints follows the state, snaps both ends when asked, and a trim has no in point', () => {
    const ch = sine();
    const s = { ...DEFAULT_STATE, cut: 100, gap: 200, snap: false };
    const j = joinPoints(s, SR, ch);
    assert.equal(j.outIdx, 4410); assert.equal(j.inIdx, 13230);
    const z = joinPoints({ ...s, snap: true }, SR, ch);
    assert.ok(ch[z.outIdx - 1] <= 0 && ch[z.outIdx] > 0);
    assert.ok(ch[z.inIdx - 1] <= 0 && ch[z.inIdx] > 0);
    const t = joinPoints({ ...s, take: 'cymbal' }, SR, ch);
    assert.equal(t.inIdx, null);
    const snapped = snapCutMs(ch, SR, 100);
    assert.ok(Math.abs(snapped - 100) < 6, `snapped within a cycle (${snapped})`);
});

test('editStats reads the step, the dip, the removed section and the lost tail from one edit', () => {
    const ch = sine();
    const s = { ...DEFAULT_STATE, cut: 100, gap: 200, snap: false, length: 0 };
    const st = editStats(s, SR, ch);
    assert.ok(st.stepPct >= 0 && st.stepPct <= 200);
    assert.equal(st.faded, false);
    near(st.removedSec, 0.2, 1e-6, 'removed');
    const f = editStats({ ...s, shape: 'linear', length: 100 }, SR, ch);
    assert.equal(f.faded, true);
    near(f.dipDb, -3.01, 0.02, 'linear dip reported');
    assert.equal(f.lengthSamples, 4410);
    const tail = new Float32Array(SR);
    for (let i = 0; i < SR; i += 1) tail[i] = Math.exp(-i / (SR * 0.15)) * Math.sin(i * 0.3);
    const t = editStats({ ...s, take: 'cymbal', cut: 300 }, SR, tail);
    assert.ok(t.tailLostSec > 0.5, `tail lost (${t.tailLostSec})`);
    assert.equal(t.inIdx, null);
});

test('the loop starts before the join and, on a trim, runs into the silence', () => {
    const a = new Float32Array(SR * 3).fill(0.3);
    const b = new Float32Array(SR * 4).fill(0.3);
    const s = { ...DEFAULT_STATE, cut: 2000, gap: 500, length: 0 };
    const r = renderEdit({ a, b, outIdx: SR * 2, inIdx: Math.round(SR * 2.5) });
    const w = loopWindow(s, r, SR);
    assert.equal(w.start, SR * 2 - Math.round(0.9 * SR));
    assert.equal(w.length, Math.round(0.9 * SR) * 2);
    const t = renderEdit({ a, outIdx: SR * 2, padSamples: SR });
    const wt = loopWindow({ ...s, take: 'cymbal' }, t, SR);
    assert.equal(wt.length, Math.round(0.9 * SR) + SR);
    const early = renderEdit({ a, outIdx: 1000, padSamples: SR });
    assert.equal(loopWindow({ ...s, take: 'cymbal', cut: 22 }, early, SR).start, 0);
});

test('presets land their numbers and any touch leaves the preset behind', () => {
    for (const p of PRESETS) {
        const s = applyPreset(DEFAULT_STATE, p.id);
        assert.equal(s.presetId, p.id);
        for (const [k, v] of Object.entries(p.patch)) assert.equal(s[k], v, `${p.id}.${k}`);
    }
    assert.equal(applyPreset(DEFAULT_STATE, 'p2022').cut, 1000);
    assert.equal(applyPreset(DEFAULT_STATE, 'tail').take, 'cymbal');
    assert.equal(setParam(applyPreset(DEFAULT_STATE, 'click'), { length: 5 }).presetId, null);
    assert.equal(applyPreset(DEFAULT_STATE, 'nope'), DEFAULT_STATE);
});

test('a cut may not sit in the first 100 ms, and a splice leaves room for its removed section', () => {
    const v = cutRange('vocal', 7360, 500);
    assert.equal(v.lo, 100); assert.equal(v.hi, 7360 - 500 - 200);
    const c = cutRange('cymbal', 1500);
    assert.equal(c.hi, 1480);
});

test('the words', () => {
    assert.equal(lengthWord(0), 'a hard cut');
    assert.equal(lengthWord(10), 'a repair');
    assert.equal(lengthWord(400), 'a transition');
    assert.equal(fmtMs(12), '12 ms');
    assert.equal(fmtMs(1200), '1.20 s');
    assert.equal(fmtSec(2.5), '2.500 s');
});
