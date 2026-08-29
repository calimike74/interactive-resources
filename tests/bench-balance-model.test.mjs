import test from 'node:test';
import assert from 'node:assert/strict';
import {
    STEM_IDS, SONGS, DEFAULT_STATE, PRESETS, TOL, FLOOR,
    applyPreset, setFader, setPan, setSend, referenceState, delta, levels, hierarchy, masking, maskingExtra, pairOf,
    faults, band, bandWords, fmtDb, fmtPan, deltaWord,
} from '../lib/bench/balance-model.js';

// The Balance Desk (1.13): the judge, the stage and the sound read one
// state, and the paper's band is arithmetic over the song's measured
// numbers. These tests are that contract.

const song = 'kites';
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

test('the reference undoes every trim: delta is zero for all five parts', () => {
    const r = referenceState(song);
    for (const id of STEM_IDS) near(delta(r, id), 0, 1e-9, id);
    assert.equal(band(r).band, 3);
    assert.equal(faults(r).length, 0);
});

test('at the reference the vocal is on top for the ear, with the drums equal or louder (2020 scheme)', () => {
    const h = hierarchy(referenceState(song));
    assert.ok(h.vocalOnTop, 'vocal on top');
    assert.ok(['drums', 'vocal'].includes(h.order[0]), `loudest is ${h.order[0]}`);
    assert.ok(h.levels.vocal > h.levels.bass && h.levels.vocal > h.levels.bvox && h.levels.vocal > h.levels.synth, 'vocal above every pitched part');
});

test('as supplied, the faders at unity are the wrong balance and the vocal is not on top', () => {
    const s = DEFAULT_STATE;
    const h = hierarchy(s);
    assert.ok(!h.vocalOnTop);
    assert.equal(delta(s, 'vocal'), SONGS[song].supplied.vocal);
    assert.ok(band(s).band <= 1, 'the supplied files bounced untouched sit on the one-mark line');
});

test('every preset is a state the paper wrote, on the band it describes', () => {
    const want = { supplied: 1, drums: 2, cd: 2, synth: 2, buried: 1, reference: 3 };
    for (const p of PRESETS) {
        const st = applyPreset(DEFAULT_STATE, p.id);
        assert.equal(st.presetId, p.id);
        assert.equal(band(st).band, want[p.id], `${p.id} sits on the ${want[p.id]}-mark line`);
    }
});

test('the drums preset is only the drums', () => {
    const fs = faults(applyPreset(DEFAULT_STATE, 'drums'));
    assert.deepEqual(fs.map((f) => `${f.kind}:${f.stem}`), ['quiet:drums']);
});

test('a fader at the floor is a part missing: the zero-mark line', () => {
    const st = setFader(referenceState(song), 'bass', FLOOR);
    assert.equal(band(st).band, 0);
    assert.ok(faults(st).some((f) => f.kind === 'missing' && f.stem === 'bass'));
});

test('one part dominating or buried is the one-mark line whatever the rest does', () => {
    const r = referenceState(song);
    assert.equal(band(setFader(r, 'bvox', r.fader.bvox + TOL.dominant)).band, 1);
    assert.equal(band(setFader(r, 'synth', r.fader.synth + TOL.buried)).band, 1);
});

test('a small misjudgement is the two-mark line, and within tolerance is still three', () => {
    const r = referenceState(song);
    assert.equal(band(setFader(r, 'bass', r.fader.bass + 5)).band, 2);
    assert.equal(band(setFader(r, 'bass', r.fader.bass + 2)).band, 3);
});

test('masking: the synth pushed up shares the low mids with the vocal; panning them apart relieves it', () => {
    const st = applyPreset(DEFAULT_STATE, 'synth');
    const extra = maskingExtra(st);
    assert.ok(extra > TOL.maskExtra, `extra masking ${extra}`);
    const w = pairOf(st, 'synth');
    assert.ok(w.score > pairOf(referenceState(song), 'synth').score, 'the synth fights harder than on the release');
    assert.ok(w.bands.length > 0);
    assert.ok(/mids/.test(bandWords(w.bands)), bandWords(w.bands));
    const apart = setPan(setPan(st, 'synth', 0.8), 'bvox', -0.6);
    assert.ok(maskingExtra(apart) < extra, 'panning apart lowers the score');
});

test('the drums never count as a masking pair', () => {
    for (const p of masking(referenceState(song)).pairs) assert.ok(p.a !== 'drums' && p.b !== 'drums');
});

test('the vocal or the bass off centre is a fault; the backing vocals wide is not', () => {
    const r = referenceState(song);
    assert.ok(faults(setPan(r, 'bass', 0.6)).some((f) => f.kind === 'offCentre'));
    assert.ok(faults(setPan(r, 'vocal', -0.5)).some((f) => f.kind === 'offCentre'));
    assert.equal(faults(setPan(r, 'bvox', -0.7)).filter((f) => f.kind === 'offCentre').length, 0);
});

test('a washed vocal is a fault; a pad set back is not', () => {
    const r = referenceState(song);
    assert.ok(faults(setSend(r, 'vocal', 0.8)).some((f) => f.kind === 'washed'));
    assert.equal(faults(setSend(r, 'synth', 0.8)).length, 0);
});

test('setters clamp, round and clear the preset', () => {
    const r = referenceState(song);
    assert.equal(setFader(r, 'vocal', 40).fader.vocal, 12);
    assert.equal(setFader(r, 'vocal', -99).fader.vocal, -60);
    assert.equal(setFader(r, 'vocal', 3.26).fader.vocal, 3.5);
    assert.equal(setFader(r, 'vocal', 3).presetId, null);
    assert.equal(setPan(r, 'vocal', 2).pan.vocal, 1);
    assert.equal(setSend(r, 'vocal', -1).send.vocal, 0);
    assert.equal(setFader(r, 'vocal', r.fader.vocal), r, 'no change returns the same state');
});

test('levels are for the ear: the low end counts for less than the RMS says', () => {
    const lv = levels(referenceState(song));
    // the bass is 6.6 dB louder than the vocal in RMS and quieter for the ear
    assert.ok(lv.bass < lv.vocal, `bass ${lv.bass} vocal ${lv.vocal}`);
});

test('words', () => {
    assert.equal(fmtDb(0), '0 dB');
    assert.equal(fmtDb(6), '+6 dB');
    assert.equal(fmtDb(-9.5), '−9.5 dB');
    assert.equal(fmtPan(0), 'C');
    assert.equal(fmtPan(-0.5), '50L');
    assert.equal(deltaWord(0.5), 'where it was released');
    assert.equal(deltaWord(12), 'dominating');
    assert.equal(deltaWord(-12), 'buried');
});
