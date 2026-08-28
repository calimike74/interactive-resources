import test from 'node:test';
import assert from 'node:assert/strict';
import {
    DEFAULT_STATE, MODE_IDS, MODES, PRESETS, applyPreset, setParam,
    staticGainDb, outputDb, transferCurve, smoothGain, envelopeDb, mixPattern, runLoop,
    fmtRatio, fmtMs, fmtDb, ratioOf, GATE_RANGE, EXPANDER_RANGE, DB_FLOOR,
} from '../lib/bench/comp-model.js';

// The Compressor bench (1.9): the gain the student hears is the gain the
// stage draws, because both come from these functions run over the same
// loop. These tests are that contract.

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a.toFixed(3)} vs ${b.toFixed(3)}`);
const comp = (patch) => ({ ...DEFAULT_STATE, mode: 'comp', knee: 0, makeup: 0, ...patch });

test('a compressor leaves everything under the threshold alone and divides what is over it', () => {
    const s = comp({ threshold: -20, ratio: 4 });
    near(staticGainDb(-30, s), 0, 1e-9, 'under');
    near(staticGainDb(-20, s), 0, 1e-9, 'at');
    near(staticGainDb(-10, s), -7.5, 1e-9, '10 dB over at 4:1 keeps 2.5');
    near(outputDb(-10, s), -17.5, 1e-9, 'out');
});

test('a soft knee rounds the corner and stays continuous at both edges', () => {
    const s = comp({ threshold: -20, ratio: 4, knee: 6 });
    near(staticGainDb(-23, s), 0, 1e-9, 'knee starts 3 dB under');
    near(staticGainDb(-17, s), -2.25, 1e-9, 'knee ends 3 dB over, on the ratio line (3 dB at 4:1 keeps 0.75)');
    const atT = staticGainDb(-20, s);
    assert.ok(atT < 0 && atT > -1, `a little reduction at the threshold itself (${atT})`);
    let prev = 0;
    for (let inDb = -30; inDb <= 0; inDb += 0.5) { const g = staticGainDb(inDb, s); assert.ok(g <= prev + 1e-9, 'gain reduction never lets go as the input rises'); prev = g; }
});

test('a limiter is the ratio at infinity: nothing gets past the threshold', () => {
    const s = { ...DEFAULT_STATE, mode: 'limiter', threshold: -10, knee: 0, makeup: 0 };
    near(outputDb(-3, s), -10, 1e-9, 'held at the threshold');
    near(outputDb(-30, s), -30, 1e-9, 'under it untouched');
    assert.equal(ratioOf(s), Infinity);
    assert.equal(fmtRatio(ratioOf(s)), '∞:1');
});

test('a gate closes under the threshold and an expander leans on it', () => {
    const g = { ...DEFAULT_STATE, mode: 'gate', threshold: -30, knee: 0, makeup: 0 };
    near(staticGainDb(-20, g), 0, 1e-9, 'open above');
    near(staticGainDb(-40, g), -GATE_RANGE, 1e-9, 'closed below, by the gate range');
    const e = { ...DEFAULT_STATE, mode: 'expander', threshold: -30, ratio: 2, knee: 0, makeup: 0 };
    near(staticGainDb(-40, e), -10, 1e-9, '10 dB under at 1:2 becomes 20 dB under');
    near(staticGainDb(-20, e), 0, 1e-9, 'above untouched');
    assert.ok(staticGainDb(-100, e) >= -EXPANDER_RANGE, 'the expander never goes past its range');
});

test('make-up gain lifts the output and never counts as gain reduction', () => {
    const s = comp({ threshold: -20, ratio: 4, makeup: 6 });
    near(staticGainDb(-10, s), -7.5, 1e-9, 'reduction unchanged');
    near(outputDb(-10, s), -11.5, 1e-9, 'output lifted');
    const curve = transferCurve(s, 7);
    assert.equal(curve.length, 7);
    near(curve[0].inDb, DB_FLOOR, 1e-9, 'starts at the floor');
    near(curve[curve.length - 1].inDb, 0, 1e-9, 'ends at full scale');
});

test('attack and release are time constants on the gain, in dB', () => {
    const dt = 0.5;
    // a one-second loop: the release has died away by the time it comes round
    const target = new Float32Array(2000).fill(0);
    for (let i = 20; i < 220; i += 1) target[i] = -12; // 100 ms of 12 dB reduction asked for
    const s = comp({ attack: 10, release: 100 });
    const g = smoothGain(target, s, dt);
    near(g[19], 0, 0.01, 'nothing before the step');
    near(g[20 + 20], -12 * (1 - Math.exp(-1)), 0.4, 'one attack time in, 63% of the way');
    near(g[219], -12, 0.2, 'settled by the end of the hold');
    near(g[220 + 200], -12 * Math.exp(-1), 0.4, 'one release time after, 63% recovered');
});

test('a gate opens on its attack and closes on its release', () => {
    const dt = 0.5;
    const target = new Float32Array(600).fill(-GATE_RANGE);
    for (let i = 100; i < 300; i += 1) target[i] = 0; // a hit above the threshold
    const s = { ...DEFAULT_STATE, mode: 'gate', attack: 1, release: 100 };
    const g = smoothGain(target, s, dt);
    assert.ok(g[100 + 10] > -GATE_RANGE * 0.05, `open within 5 ms on a 1 ms attack (${g[110].toFixed(1)})`);
    assert.ok(g[300 + 100] > -GATE_RANGE * 0.5, `still half open 50 ms into a 100 ms release (${g[400].toFixed(1)})`);
});

test('the envelope of a loop is its peak level in dB at every step', () => {
    const sr = 1000;
    const mix = new Float32Array(1000); // one second at 1 kHz
    mix[500] = 1; mix[501] = -0.5;
    const env = envelopeDb(mix, sr, 100); // 100 ms steps
    assert.equal(env.length, 10);
    near(env[5], 0, 1e-9, 'the impulse is 0 dBFS');
    assert.ok(env[0] <= DB_FLOOR, 'silence sits on the floor');
});

test('the loop is mixed from the pattern exactly where the scheduler books it', () => {
    const sr = 1000;
    const buf = { sampleRate: sr, length: 5, duration: 0.005, getChannelData: () => new Float32Array([1, 0.5, 0.25, 0, 0]) };
    const pattern = { bars: 2, steps: [{ s: 0, name: 'x', g: 1 }, { s: 16, name: 'x', g: 0.5 }] };
    const mix = mixPattern(pattern, { x: buf }, 120, sr);
    const barLen = (60 / 120) * 4 * sr;
    assert.equal(mix.length, barLen * 2);
    near(mix[0], 1, 1e-9, 'bar one, step one');
    near(mix[barLen], 0.5, 1e-9, 'bar two, at half gain');
    near(mix[barLen + 1], 0.25, 1e-9, 'the sample plays on');
});

test('runLoop reports what the student should hear, from the same numbers', () => {
    const env = new Float32Array(2000).fill(-10); // a steady -10 dB
    const s = comp({ threshold: -20, ratio: 4, attack: 1, release: 10, makeup: 3 });
    const r = runLoop(s, env, 0.5);
    near(r.stats.maxGr, 7.5, 0.1, 'most reduction');
    near(r.stats.peakIn, -10, 1e-6, 'loudest in');
    near(r.stats.peakOut, -14.5, 0.2, 'loudest out, lifted by make-up');
    near(r.stats.overPct, 100, 1e-6, 'over the threshold the whole time');
    assert.equal(r.gainDb.length, env.length);
    assert.equal(r.outDb.length, env.length);
    near(r.outDb[1999], -14.5, 0.2, 'the drawn output is the heard output');
});

test('an off processor is an identity', () => {
    const s = comp({ on: false, threshold: -40, ratio: 20, makeup: 12 });
    near(staticGainDb(-5, s), 0, 1e-9, 'no reduction');
    near(outputDb(-5, s), -5, 1e-9, 'no make-up either');
});

test('presets are whole settings and the modes are the four the spec names', () => {
    assert.deepEqual(MODE_IDS, ['comp', 'limiter', 'gate', 'expander']);
    for (const id of MODE_IDS) assert.ok(MODES[id].label && MODES[id].name);
    for (const p of PRESETS) {
        const s = applyPreset(DEFAULT_STATE, p.id);
        assert.equal(s.presetId, p.id);
        assert.ok(MODE_IDS.includes(s.mode), `${p.id} names a mode`);
    }
    const lim = PRESETS.find((p) => p.mode === 'limiter' || p.state.mode === 'limiter');
    assert.ok(lim, 'a limiter preset exists');
});

test('setParam clamps and clears the preset', () => {
    let s = applyPreset(DEFAULT_STATE, PRESETS[0].id);
    s = setParam(s, { threshold: -200 });
    assert.equal(s.threshold, -60);
    assert.equal(s.presetId, null);
    assert.equal(setParam(s, { ratio: 500 }).ratio, 20);
    assert.equal(setParam(s, { attack: 0 }).attack, 0.1);
    assert.equal(setParam(s, { release: 9 }).release, 10);
    assert.equal(fmtMs(0.5), '0.5 ms');
    assert.equal(fmtMs(1200), '1.2 s');
    assert.equal(fmtRatio(4), '4:1');
    assert.equal(fmtDb(-7.5), '−7.5 dB');
});
