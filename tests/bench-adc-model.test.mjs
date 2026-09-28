import test from 'node:test';
import assert from 'node:assert/strict';
import {
    RATES, TONES, DEFAULT_STATE, PRESETS, applyPreset, setRateIndex, setBits, setRate, rateFromPeriod,
    makeConverter, converterDelay, hostStep, quantise, codeValue, binaryWord, aliasOf, levels, dynamicRangeDb, nyquist,
    samplesPerCycle, filterGain, picture, toneSignal, toneWindowMs, readings, FILTER_QS, filterRun,
} from '../lib/bench/adc-model.js';

const HOST = 48000;
// Run a tone through the converter the worklet runs; return the output
// after the delay has settled.
function run(fHz, rateKhz, bits, seconds = 0.25) {
    const c = makeConverter();
    c.set({ P: hostStep(HOST, rateKhz), bits, delay: converterDelay(HOST) });
    const n = Math.round(HOST * seconds);
    const x = new Float32Array(n);
    for (let i = 0; i < n; i += 1) x[i] = 0.8 * Math.sin((2 * Math.PI * fHz * i) / HOST);
    const y = new Float32Array(n);
    c.process(x, y);
    return y.subarray(Math.round(HOST * 0.05));
}
const rms = (a) => Math.sqrt(a.reduce((s, v) => s + v * v, 0) / a.length);
// The strongest frequency in a signal, by a plain DFT scan (Hz).
function peakHz(a, lo = 100, hi = 20000, stepHz = 10) {
    let best = 0; let bestP = -1;
    for (let f = lo; f <= hi; f += stepHz) {
        let re = 0; let im = 0;
        for (let i = 0; i < a.length; i += 1) { const w = (2 * Math.PI * f * i) / HOST; re += a[i] * Math.cos(w); im += a[i] * Math.sin(w); }
        const p = re * re + im * im;
        if (p > bestP) { bestP = p; best = f; }
    }
    return best;
}

test('the rates the worksheet walks are on the dial, and 44.1, 48 and 96 kHz are there', () => {
    for (const r of [6, 20, 80, 44.1, 48, 96]) assert.ok(RATES.includes(r), `${r}`);
    assert.ok(TONES.includes(3));
});

test('samples per cycle: 20 kHz on the 3 kHz tone is 6.7, 80 kHz is 26.7, 6 kHz is exactly two', () => {
    assert.equal(samplesPerCycle(20, 3).toFixed(1), '6.7');
    assert.equal(samplesPerCycle(80, 3).toFixed(1), '26.7');
    assert.equal(samplesPerCycle(6, 3), 2);
});

test('at exactly two samples a cycle every sample sits on the centre line', () => {
    const { signal, raw } = toneSignal(3, 6, false, HOST);
    const p = picture({ signal, raw, windowMs: toneWindowMs(3), rateKhz: 6, bits: 16 });
    assert.equal(p.inside.length, 11); // five cycles, two a cycle, both ends
    for (const s of p.inside) assert.ok(Math.abs(s.v) < 1e-9, `sample at ${s.t} is ${s.v}`);
    assert.ok(Math.max(...p.back.map(Math.abs)) < 1e-6, 'nothing comes back');
});

test('the alias is the fold about half the rate', () => {
    assert.equal(aliasOf(3, 4), 1);
    assert.equal(aliasOf(15, 20), 5);
    assert.equal(aliasOf(5, 6), 1);
    assert.equal(aliasOf(3, 20), 3); // below Nyquist a tone is itself
    assert.equal(nyquist(44.1), 22.05);
});

test('the converter keeps a tone below Nyquist and folds one above it', () => {
    const kept = run(3000, 20, 16);
    assert.ok(Math.abs(20 * Math.log10(rms(kept) / (0.8 / Math.SQRT2))) < 0.5, 'level kept within 0.5 dB');
    assert.equal(peakHz(kept, 500, 6000, 50), 3000);
    const folded = run(3000, 4, 16);
    assert.equal(peakHz(folded, 200, 6000, 50), 1000);
    const high = run(15000, 20, 16);
    assert.equal(peakHz(high, 1000, 20000, 100), 5000);
});

test('at the host rate the converter passes the input through, only rounded', () => {
    const c = makeConverter();
    const d = converterDelay(HOST);
    c.set({ P: hostStep(HOST, 96), bits: 24, delay: d });
    const x = new Float32Array(2000).map((_, i) => 0.5 * Math.sin(i / 7));
    const y = new Float32Array(2000);
    c.process(x, y);
    for (let i = d + 40; i < 1900; i += 97) assert.ok(Math.abs(y[i] - x[i - d]) < 1e-4, `sample ${i}`);
});

test('fewer bits, more error: the error never passes half a step, and 6 dB a bit', () => {
    for (const bits of [2, 4, 8, 16]) {
        const half = 2 ** (bits - 1);
        for (let x = -0.99; x < 1 - 1.5 / half; x += 0.0137) { // up to the top code; above it the converter clips
            const e = Math.abs(codeValue(quantise(x, bits), bits) - x);
            assert.ok(e <= 0.5 / half + 1e-12, `${bits} bit at ${x}`);
        }
    }
    assert.equal(levels(16), 65536);
    assert.equal(levels(24), 16777216);
    assert.equal(dynamicRangeDb(16), 96);
    assert.equal(dynamicRangeDb(24), 144);
    const ref = run(1000, 44.1, 24);
    const e4 = rms(run(1000, 44.1, 4).map((v, i) => v - ref[i]));
    const e8 = rms(run(1000, 44.1, 8).map((v, i) => v - ref[i]));
    const db = 20 * Math.log10(e4 / e8);
    assert.ok(db > 20 && db < 28, `four more bits took the error down ${db.toFixed(1)} dB`);
});

test('codes are two\'s complement words', () => {
    assert.equal(binaryWord(0, 4), '0000');
    assert.equal(binaryWord(-1, 4), '1111');
    assert.equal(binaryWord(7, 4), '0111');
    assert.equal(binaryWord(-8, 4), '1000');
    assert.equal(binaryWord(90, 8), '0101 1010');
    assert.equal(quantise(1, 4), 7); // full scale clips to the top code
    assert.equal(quantise(-1, 4), -8);
});

test('the anti-alias filter passes the band and stops the tone above Nyquist', () => {
    assert.ok(filterGain(3, 20) > 0.99);
    assert.ok(filterGain(3, 4) < 0.001);
    assert.ok(filterGain(3, 6) < 0.2 && filterGain(3, 6) > 0.05);
    assert.equal(FILTER_QS.length, 8);
    // the biquads the picture runs land near the ideal curve in the passband and the stopband
    const sr = 44100; const n = 8192;
    for (const [f, rate, lo, hi] of [[1000, 8, 0.9, 1.1], [6000, 8, 0, 0.01]]) {
        const x = new Float32Array(n).map((_, i) => Math.sin((2 * Math.PI * f * i) / sr));
        const y = filterRun(x, 0.44 * rate * 1000, sr).subarray(4096);
        const g = rms(y) / (1 / Math.SQRT2);
        assert.ok(g >= lo && g <= hi, `${f} Hz at ${rate} kHz: ${g.toFixed(3)}`);
    }
});

test('the picture\'s DAC wave is the alias, drawn through the same dots', () => {
    const { signal, raw } = toneSignal(3, 4, false, HOST);
    const p = picture({ signal, raw, windowMs: toneWindowMs(3), rateKhz: 4, bits: 16, points: 600 });
    for (const s of p.inside) {
        const i = Math.round((s.t / p.windowMs) * 600);
        assert.ok(Math.abs(p.back[i] - s.q) < 0.02, `the wave back passes through the sample at ${s.t.toFixed(3)} ms`);
    }
    // the wave back is 1 kHz: one cycle in the 5/3 ms window's first ms
    const t = (ms) => p.back[Math.round((ms / p.windowMs) * 600)];
    assert.ok(Math.abs(t(0.25) + 0.8) < 0.03 || Math.abs(t(0.25) - 0.8) < 0.03, `quarter cycle of 1 kHz at 0.25 ms: ${t(0.25)}`);
});

test('readings name what happens', () => {
    assert.equal(readings(DEFAULT_STATE).key, 'clean');
    assert.equal(readings(applyPreset(DEFAULT_STATE, 'alias')).key, 'alias');
    assert.equal(readings(applyPreset(DEFAULT_STATE, 'alias')).alias, 1);
    assert.equal(readings(applyPreset(DEFAULT_STATE, 'two')).key, 'edge');
    assert.equal(readings(applyPreset(DEFAULT_STATE, 'grit')).key, 'grit');
    assert.equal(readings(setRate(setBits(applyPreset(DEFAULT_STATE, 'cd'), 8), 8)).key, 'hiss');
    assert.equal(readings(setRate(applyPreset(DEFAULT_STATE, 'cd'), 8)).key, 'dull');
    assert.equal(readings(applyPreset(DEFAULT_STATE, 'crusher')).key, 'grit');
    assert.equal(readings({ ...applyPreset(DEFAULT_STATE, 'alias'), filter: true }).key, 'filtered');
    assert.equal(readings(applyPreset(DEFAULT_STATE, 'judge')).alias, 5);
    assert.equal(readings(applyPreset(DEFAULT_STATE, 'cd')).key, 'clean');
});

test('edits: the dial walks the steps, a preset lands, the bracket snaps to a step', () => {
    assert.equal(setRateIndex(DEFAULT_STATE, 0).rate, 2);
    assert.equal(setRateIndex(DEFAULT_STATE, 99).rate, 96);
    assert.equal(setBits(DEFAULT_STATE, 1).bits, 2);
    assert.equal(setBits(DEFAULT_STATE, 30).bits, 24);
    assert.equal(setRate(DEFAULT_STATE, 7), DEFAULT_STATE);
    for (const p of PRESETS) assert.equal(applyPreset(DEFAULT_STATE, p.id).presetId, p.id);
    assert.equal(rateFromPeriod(0.05), 20);
    assert.equal(rateFromPeriod(0.25), 4);
    assert.equal(rateFromPeriod(1 / 44.1), 44.1);
});
