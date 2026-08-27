import test from 'node:test';
import assert from 'node:assert/strict';
import {
    DEFAULT_STATE, PRESETS, applyPreset, setBand, sectionsOf, coefficients, sectionResponse, response,
    bandwidthOctaves, slopeFacts, peakOf, matchTrimDb, regionOf, snapOctave, hzFromPos, posFromHz, BANDS, BAND_IDS,
} from '../lib/bench/eq-model.js';

// The EQ bench (1.11): the curve on the stage is the RBJ maths the nodes
// also use, so these tests are the picture's contract with the sound.

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a.toFixed(2)} vs ${b.toFixed(2)}`);

test('a flat EQ is flat', () => {
    const r = response(DEFAULT_STATE, [50, 500, 5000, 15000]);
    for (const p of r) near(p.db, 0, 0.01, `flat at ${p.hz}`);
});

test('a high-pass at 80 Hz is 3 dB down at 80 and 12 dB an octave below (12 dB/oct)', () => {
    const s = setBand(DEFAULT_STATE, 'hpf', { on: true, hz: 80, slope: 12 });
    const f = slopeFacts('hpf', s);
    near(f.atCutoffDb, -3, 0.2, 'cutoff');
    near(f.octaveDb - f.atCutoffDb, -9, 1.2, 'an octave below is about 12 dB down overall');
    const deep = response(s, [10], { only: 'hpf' })[0].db;
    assert.ok(deep < -30, `far below the cutoff the roll-off keeps going (${deep.toFixed(1)})`);
});

test('24 dB/oct is two sections: 6 dB down at the cutoff, twice as steep', () => {
    const s12 = setBand(DEFAULT_STATE, 'lpf', { on: true, hz: 3000, slope: 12 });
    const s24 = setBand(DEFAULT_STATE, 'lpf', { on: true, hz: 3000, slope: 24 });
    assert.equal(sectionsOf(s24, 'lpf').length, 2);
    near(slopeFacts('lpf', s24).atCutoffDb, -6, 0.3, 'cutoff at 24');
    const two = response(s24, [12000], { only: 'lpf' })[0].db;
    const one = response(s12, [12000], { only: 'lpf' })[0].db;
    near(two, 2 * one, 0.6, 'two octaves up, the 24 is twice the 12');
});

test('a peaking band boosts by its gain at its frequency and nowhere far away', () => {
    const s = setBand(DEFAULT_STATE, 'mid', { on: true, hz: 1000, gain: 6, q: 1 });
    const r = response(s, [1000, 60, 15000], { only: 'mid' });
    near(r[0].db, 6, 0.05, 'at centre');
    near(r[1].db, 0, 0.2, 'far below');
    near(r[2].db, 0, 0.3, 'far above');
});

test('a cut mirrors a boost', () => {
    const up = setBand(DEFAULT_STATE, 'mid', { on: true, hz: 500, gain: 4, q: 2 });
    const down = setBand(DEFAULT_STATE, 'mid', { on: true, hz: 500, gain: -4, q: 2 });
    near(response(up, [500])[0].db, -response(down, [500])[0].db, 0.01, 'mirror');
});

test('Q is a width: the -3 dB points of a Q 1 band are 1.39 octaves apart, Q 4 a third of an octave', () => {
    near(bandwidthOctaves(1), 1.39, 0.02, 'Q 1');
    near(bandwidthOctaves(4), 0.36, 0.02, 'Q 4');
    near(bandwidthOctaves(1.41), 1, 0.02, 'Q 1.41 is an octave: the graphic EQ');
});

test('a shelf levels off: a +6 low shelf at 100 Hz is about +6 at 20 Hz and 0 well above', () => {
    const s = setBand(DEFAULT_STATE, 'low', { on: true, hz: 100, gain: 6 });
    const r = response(s, [20, 100, 2000], { only: 'low' });
    near(r[0].db, 6, 0.3, 'below the shelf');
    near(r[1].db, 3, 0.3, 'halfway at the corner');
    near(r[2].db, 0, 0.3, 'above');
});

test('bands sum in series: a boost and a cut at the same frequency cancel', () => {
    let s = setBand(DEFAULT_STATE, 'mid', { on: true, hz: 2000, gain: 5, q: 1 });
    s = setBand(s, 'high', { on: true, hz: 2000, gain: -5 });
    const total = response(s, [2000])[0].db;
    const mid = response(s, [2000], { only: 'mid' })[0].db;
    const high = response(s, [2000], { only: 'high' })[0].db;
    near(total, mid + high, 0.01, 'series');
});

test('a filter shifts phase around its cutoff and hardly at all far away', () => {
    const s = setBand(DEFAULT_STATE, 'hpf', { on: true, hz: 200, slope: 12 });
    const r = response(s, [200, 10000], { only: 'hpf' });
    assert.ok(Math.abs(r[0].phase) > 0.5, 'at the cutoff');
    assert.ok(Math.abs(r[1].phase) < 0.1, 'far above');
});

test('the peak of the curve is where the boost is, and level match trims by it', () => {
    const s = setBand(DEFAULT_STATE, 'mid', { on: true, hz: 3000, gain: 12, q: 4 });
    const p = peakOf(s);
    near(p.maxDb, 12, 0.2, 'peak');
    assert.ok(p.maxHz > 2500 && p.maxHz < 3600, `peak at ${p.maxHz}`);
    assert.equal(matchTrimDb(s), 0);
    near(matchTrimDb({ ...s, match: true }), -12, 0.2, 'trim');
});

test('the graphic mode locks the Mid band to an octave centre and an octave width', () => {
    const s = { ...setBand(DEFAULT_STATE, 'mid', { on: true, hz: 1300, gain: 3, q: 0.5 }), graphic: true };
    const [sec] = sectionsOf(s, 'mid');
    assert.equal(sec.hz, 1000);
    assert.equal(sec.q, 1.41);
    assert.equal(snapOctave(2700), 2000, "below the geometric midpoint (2828) snaps down");
    assert.equal(snapOctave(2900), 4000, "above it snaps up: the scale is logarithmic");
});

test('frequency positions are logarithmic and round-trip', () => {
    near(hzFromPos(0.5, 100, 10000), 1000, 1, 'middle of two decades');
    near(posFromHz(1000, 100, 10000), 0.5, 0.001, 'back');
});

test('regions name the frequency for the ear', () => {
    assert.equal(regionOf(50).id, 'sub');
    assert.equal(regionOf(300).id, 'lowmid');
    assert.equal(regionOf(3000).id, 'presence');
    assert.equal(regionOf(12000).id, 'air');
});

test('presets are whole states, every band present, and Too much is a big narrow boost in the presence region', () => {
    for (const p of PRESETS) {
        const s = applyPreset(DEFAULT_STATE, p.id);
        for (const id of BAND_IDS) assert.ok(s[id] && typeof s[id].on === 'boolean', `${p.id} ${id}`);
        assert.equal(s.presetId, p.id);
    }
    const tm = applyPreset(DEFAULT_STATE, 'toomuch');
    assert.ok(tm.mid.gain >= 10 && tm.mid.q >= 3 && regionOf(tm.mid.hz).id === 'presence');
    const tel = applyPreset(DEFAULT_STATE, 'telephone');
    assert.ok(tel.hpf.on && tel.lpf.on && tel.hpf.hz < tel.lpf.hz, 'telephone is a band-pass');
});

test('setBand clamps to the band and clears the preset', () => {
    const s = setBand(applyPreset(DEFAULT_STATE, 'vocal'), 'hpf', { hz: 5 });
    assert.equal(s.hpf.hz, BANDS.hpf.hzMin);
    assert.equal(s.presetId, null);
    assert.equal(setBand(DEFAULT_STATE, 'mid', { gain: 40 }).mid.gain, 15);
});

test('the RBJ maths agrees with itself: a section at DC and Nyquist', () => {
    const lp = coefficients({ type: 'lowpass', hz: 1000, q: Math.SQRT1_2 });
    near(sectionResponse(lp, 1).db, 0, 0.01, 'lowpass passes DC');
    assert.ok(sectionResponse(lp, 23000).db < -50, 'lowpass kills Nyquist');
});

test('a 24 dB/oct high-pass turns the phase through a full circle, unwrapped into one line', async () => {
    const { unwrapPhase } = await import('../lib/bench/eq-model.js');
    const s = setBand(DEFAULT_STATE, 'hpf', { on: true, hz: 500, slope: 24 });
    const pts = unwrapPhase(response(s, [20, 50, 100, 200, 350, 500, 700, 1000, 2000, 5000, 20000], { only: 'hpf' }));
    for (let i = 1; i < pts.length; i += 1) assert.ok(Math.abs(pts[i].phase - pts[i - 1].phase) < Math.PI, `no jump at ${pts[i].hz}`);
    near(pts[0].phase - pts[pts.length - 1].phase, 2 * Math.PI, 0.25, 'about 360 degrees from bottom to top');
});

test('48 dB/oct is four sections, 12 dB down at the cutoff, and steeper than 45 degrees on the stage', () => {
    const s = setBand(DEFAULT_STATE, 'hpf', { on: true, hz: 400, slope: 48 });
    assert.equal(sectionsOf(s, 'hpf').length, 4);
    const f = slopeFacts('hpf', s);
    near(f.atCutoffDb, -12, 0.4, 'cutoff');
    assert.ok(f.octaveDb < -40, `an octave below is far down (${f.octaveDb.toFixed(1)})`);
    assert.equal(f.order, 8);
});

test('the 2023 paper preset boosts every band on the vocal; the 2024 preset is the 48 dB high-pass on the 808', () => {
    const p23 = applyPreset(DEFAULT_STATE, 'paper2023');
    assert.equal(p23.source, 'vocal');
    assert.ok(p23.low.on && p23.low.gain > 0 && p23.mid.on && p23.mid.gain > 0 && p23.high.on && p23.high.gain > 0);
    assert.ok(peakOf(p23).minDb > -0.5, 'nothing is cut anywhere');
    const p24 = applyPreset(DEFAULT_STATE, 'paper2024');
    assert.equal(p24.source, 'electronic');
    assert.ok(p24.hpf.on && p24.hpf.slope === 48 && p24.hpf.hz >= 200 && p24.hpf.hz <= 1000, 'the mark scheme: cutoff between 200 Hz and 1 kHz');
    assert.ok(response(p24, [p24.hpf.hz / 4])[0].db < -20, 'reaches -20 dB, as the mark scheme asks');
    for (const id of ['low', 'mid', 'high', 'lpf']) assert.equal(p24[id].on, false, 'no other boosts or cuts');
});
