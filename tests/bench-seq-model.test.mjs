import test from 'node:test';
import assert from 'node:assert/strict';
import {
    STEPS, SCALE, CHORDS, LANE_IDS, DEFAULT_STATE, PRESETS, TASKS,
    noteName, bassMidi, midiHz, stepMs, swingMs, stepOffsetMs, barMs,
    resToQdb, qLinear, filterCurve, fmtHz,
    applyPreset, clearPattern, setStep, toggleStep, nudgeNote, setBassNote, nearestScaleIndex, quantiseStep, recordNote,
    setTempo, setSwing, setCutoff, setRes, setDecay, setRecord,
    counts, cellText, stepSends, sweepCutoffAt, verdict, readings, patternTag,
} from '../lib/bench/seq-model.js';

const near = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol, `${a} not within ${tol} of ${b}`);

test('the scale is A minor over the Bass row\'s octave, named as the estate names notes', () => {
    assert.equal(SCALE.length, 12);
    assert.equal(noteName(bassMidi(0)), 'A0');
    assert.equal(noteName(bassMidi(11)), 'E2');
    assert.equal(noteName(60), 'C3');
    near(midiHz(69), 440);
    near(midiHz(bassMidi(0)), 55, 1e-9);
    assert.deepEqual(CHORDS.map((c) => c.name), ['Am', 'F', 'C', 'G', 'Dm', 'Em']);
    assert.deepEqual(LANE_IDS, ['kick', 'snare', 'hat', 'bass', 'chord']);
});

test('a sixteenth is milliseconds at the tempo, and swing holds every second step back by up to half a step', () => {
    near(stepMs(120), 125);
    near(barMs(120), 2000);
    near(swingMs(120, 0), 0);
    near(swingMs(120, 60), 37.5);
    near(stepOffsetMs(0, 120, 60), 0);
    near(stepOffsetMs(1, 120, 60), 125 + 37.5);
    near(stepOffsetMs(2, 120, 60), 250);
    near(stepOffsetMs(15, 112, 40), 15 * stepMs(112) + swingMs(112, 40));
});

test('resonance becomes the Q the node takes, in dB, and the curve is a real low-pass', () => {
    near(resToQdb(0), 0.5);
    near(resToQdb(100), 18);
    assert.ok(resToQdb(30) > 2.5 && resToQdb(30) < 3.5);
    near(qLinear(0), 1);
    const freqs = [100, 1000, 1400, 4000, 12000];
    const curve = filterCurve(1400, 0, freqs);
    assert.equal(curve.length, 5);
    assert.ok(Math.abs(curve[0].db) < 0.5, 'flat well below the cutoff');
    assert.ok(curve[3].db < -12, 'down more than 12 dB an octave and a half above');
    assert.ok(curve[4].db < curve[3].db, 'still falling');
    const peaked = filterCurve(1400, 100, freqs);
    assert.ok(peaked[2].db > curve[2].db + 10, 'full resonance lifts the corner by more than 10 dB');
    assert.equal(fmtHz(1400), '1.4 kHz');
    assert.equal(fmtHz(260), '260 Hz');
    assert.equal(fmtHz(12000), '12 kHz');
});

test('every preset resolves to a full state, and the first-load preset is audible', () => {
    assert.deepEqual(PRESETS.map((p) => p.name), ['Bass and chords', 'Hats and swing', 'Filter sweep', 'Played in', 'Judge: straight']);
    for (const p of PRESETS) {
        const s = applyPreset(DEFAULT_STATE, p.id);
        for (const id of LANE_IDS) assert.equal(s.lanes[id].length, STEPS, `${p.name} ${id}`);
        assert.equal(s.bassNote.length, STEPS);
        assert.equal(s.chordIdx.length, STEPS);
        assert.equal(s.bassHow.length, STEPS);
        assert.ok(s.tempo >= 70 && s.tempo <= 160);
        assert.ok(s.cutoff >= 80 && s.cutoff <= 12000);
        assert.equal(s.presetId, p.id);
        assert.equal(s.task, p.task);
        if (p.task) assert.ok(TASKS[p.task], `${p.name} names a task`);
        assert.ok(counts(s).all > 0, `${p.name} lights something`);
    }
    const first = applyPreset(DEFAULT_STATE, 'bass');
    assert.ok(counts(first).kick >= 4 && counts(first).bass >= 4, 'the first preset has a beat and a bass line');
    assert.equal(applyPreset(DEFAULT_STATE, 'sweep').sweep.bars, 4);
    assert.ok(applyPreset(DEFAULT_STATE, 'played').bassHow.every((h, s) => (h === 'played') === applyPreset(DEFAULT_STATE, 'played').lanes.bass[s]), 'Played in marks every bass note as played');
    assert.equal(applyPreset(DEFAULT_STATE, 'straight').swing, 0);
    assert.equal(applyPreset(DEFAULT_STATE, 'swing').swing, 45);
});

test('a step toggles, paints and remembers how a bass note got there', () => {
    let s = clearPattern(DEFAULT_STATE);
    assert.equal(counts(s).all, 0);
    s = toggleStep(s, 'kick', 0);
    assert.equal(s.lanes.kick[0], true);
    s = toggleStep(s, 'kick', 0);
    assert.equal(s.lanes.kick[0], false);
    s = setStep(s, 'hat', 3, true);
    assert.equal(setStep(s, 'hat', 3, true), s, 'setting a lit step lit returns the same state');
    s = setStep(s, 'bass', 4, true);
    assert.equal(s.bassHow[4], 'step');
    s = setStep(s, 'bass', 4, false);
    assert.equal(s.bassHow[4], null);
    assert.equal(setStep(s, 'nope', 0, true), s);
});

test('dragging a Bass or Chord step moves through the scale and lights it; drums do not tune', () => {
    let s = clearPattern(DEFAULT_STATE);
    s = nudgeNote(s, 'bass', 2, 3);
    assert.equal(s.lanes.bass[2], true);
    assert.equal(s.bassNote[2], 3);
    assert.equal(cellText(s, 'bass', 2), noteName(bassMidi(3)));
    s = nudgeNote(s, 'bass', 2, -20);
    assert.equal(s.bassNote[2], 0, 'clamped at the bottom of the scale');
    s = nudgeNote(s, 'chord', 5, 2);
    assert.equal(cellText(s, 'chord', 5), 'C');
    s = nudgeNote(s, 'chord', 5, 40);
    assert.equal(s.chordIdx[5], CHORDS.length - 1);
    assert.equal(nudgeNote(s, 'kick', 0, 1), s);
    s = setBassNote(s, 7, 11);
    assert.equal(cellText(s, 'bass', 7), 'E2');
    assert.equal(cellText(s, 'kick', 0), '');
});

test('a played key lands on the nearest step, as the nearest note of the scale in the Bass octave', () => {
    assert.equal(quantiseStep(3, 0.2), 3);
    assert.equal(quantiseStep(3, 0.7), 4);
    assert.equal(quantiseStep(15, 0.9), 0);
    assert.equal(nearestScaleIndex(33), 0, 'A0 is the first note');
    assert.equal(nearestScaleIndex(45), 7, 'A1 is in the row itself');
    assert.equal(nearestScaleIndex(57), 7, 'A2 folds to A1');
    assert.equal(nearestScaleIndex(48), 9, 'C2 is in the row itself');
    assert.equal(nearestScaleIndex(36), 2, 'C1 is in the row itself');
    assert.equal(nearestScaleIndex(64), 11, 'E3 played is E2 in the row, the nearer octave');
    assert.equal(nearestScaleIndex(40), 4, 'E1 is its own note');
    let s = setRecord(clearPattern(DEFAULT_STATE), true);
    s = recordNote(s, 60, 6, 0.6);
    assert.equal(s.lanes.bass[7], true, 'late in step 7 lands on step 8');
    assert.equal(s.bassHow[7], 'played');
    assert.equal(noteName(bassMidi(s.bassNote[7])), 'C2', 'C3 played folds to C2, the nearer octave');
    const off = recordNote(setRecord(s, false), 60, 0, 0);
    assert.equal(off.lanes.bass[0], false, 'nothing is written with Record off');
});

test('the controls clamp to their travel, and moving the cutoff by hand ends a sweep', () => {
    assert.equal(setTempo(DEFAULT_STATE, 500).tempo, 160);
    assert.equal(setTempo(DEFAULT_STATE, 1).tempo, 70);
    assert.equal(setSwing(DEFAULT_STATE, 99).swing, 60);
    assert.equal(setRes(DEFAULT_STATE, -4).res, 0);
    assert.equal(setDecay(DEFAULT_STATE, 5000).decay, 1200);
    const sweeping = applyPreset(DEFAULT_STATE, 'sweep');
    assert.ok(sweeping.sweep);
    assert.equal(setCutoff(sweeping, 900).sweep, null);
    assert.equal(setCutoff(sweeping, 20).cutoff, 80);
});

test('the sweep climbs from its start to its end over its bars and starts again', () => {
    const sw = { from: 260, to: 6000, bars: 4 };
    near(sweepCutoffAt(sw, 0, 0), 260);
    near(sweepCutoffAt(sw, 3, 1), 6000, 1e-6);
    near(sweepCutoffAt(sw, 4, 0), 260);
    near(sweepCutoffAt(sw, 2, 0), Math.sqrt(260 * 6000), 1e-6);
    assert.equal(sweepCutoffAt(null, 0, 0), null);
});

test('the verdict names the state the paper\'s question is about, for every task', () => {
    assert.equal(verdict(DEFAULT_STATE).key, 'free');
    const straight = applyPreset(DEFAULT_STATE, 'straight');
    assert.equal(verdict(straight).key, 'straight');
    assert.equal(verdict(setSwing(straight, 12)).key, 'gentle');
    assert.equal(verdict(setSwing(straight, 40)).key, 'swung');
    assert.equal(verdict(applyPreset(DEFAULT_STATE, 'swing')).key, 'swung');
    const sweep = applyPreset(DEFAULT_STATE, 'sweep');
    assert.equal(verdict(sweep).key, 'sweep');
    assert.equal(verdict(setCutoff(sweep, 300)).key, 'closed');
    assert.equal(verdict(setCutoff(sweep, 1400)).key, 'partway');
    assert.equal(verdict(setCutoff(sweep, 8000)).key, 'open');
    const played = applyPreset(DEFAULT_STATE, 'played');
    assert.equal(verdict(played).key, 'played');
    let stepped = played;
    for (let s = 0; s < STEPS; s += 1) stepped = setStep(setStep(stepped, 'bass', s, false), 'bass', s, played.lanes.bass[s]);
    assert.equal(verdict(stepped).key, 'stepped');
    let empty = played;
    for (let s = 0; s < STEPS; s += 1) empty = setStep(empty, 'bass', s, false);
    assert.equal(verdict(empty).key, 'empty');
});

test('the readings and the pattern tag come from the state alone', () => {
    const s = applyPreset(DEFAULT_STATE, 'bass');
    const r = readings(s);
    assert.equal(r.counts.kick, 5);
    assert.equal(r.counts.bass, 6);
    assert.equal(r.counts.chord, 2);
    assert.deepEqual(r.chordNames, ['Am', 'F']);
    assert.equal(r.bassNames[0], 'A0');
    near(r.stepMs, stepMs(112));
    assert.equal(stepSends(s, 0), 'bass A0 + chord Am');
    assert.equal(stepSends(s, 1), '');
    const tag = patternTag(s);
    assert.match(tag, /^kick:1...1...1...1..1\|/);
    assert.notEqual(patternTag(toggleStep(s, 'hat', 1)), tag);
});
