import test from 'node:test';
import assert from 'node:assert/strict';
import {
    DEFAULT_STATE, PRESETS, TASKS, SOURCES, DIVS, TIME_BASES, BPM,
    frequency, sourceHz, periodMs, periodS, fmtHz, fmtMs, fmtS, noteOf, noteWord, dbToGain, levelWord, cyclesShown,
    lfoHz, fileMb, bytesPerSecond, fmtMb,
    applyPreset, setSource, setOctave, setTimeBase, setLevel, setLfo, setChannels, setRate, setDepth, stretchTo,
    readings, verdict,
} from '../lib/bench/scope-model.js';

const near = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol, `${a} not within ${tol} of ${b}`);

test('the ladder: a period in ms, in s, and back to Hz, as the 2025 and 2026 papers walk it', () => {
    near(periodMs(500), 2);
    near(periodS(500), 0.002);
    near(periodMs(200), 5);
    near(periodS(200), 0.005);
    assert.equal(fmtMs(2), '2.00 ms');
    assert.equal(fmtS(0.002), '0.002 s');
    assert.equal(fmtHz(500), '500 Hz');
    assert.equal(fmtHz(1000), '1 kHz');
    assert.equal(fmtHz(588), '588 Hz');
    assert.equal(fmtMb(20), '20 MB');
    assert.equal(fmtMb(60), '60 MB');
});

test('the octave doubles the frequency and halves the period (2019: 294 to 588)', () => {
    const s = applyPreset(DEFAULT_STATE, 'octave');
    near(frequency(s), 294);
    const up = setOctave(s, 'up');
    near(frequency(up), 588);
    near(periodMs(frequency(up)), periodMs(294) / 2);
    near(frequency(setOctave(s, 'down')), 147);
});

test('a real note plays at the file\'s own pitch; a waveform can be set to the paper\'s number', () => {
    assert.equal(sourceHz(DEFAULT_STATE), SOURCES.cello.hz);
    const sq = applyPreset(DEFAULT_STATE, 'lower');
    assert.equal(sq.source, 'square');
    near(frequency(sq), 1000);
    near(periodMs(frequency(sq)), 1);
    // switching to a real note drops the set number
    const cello = setSource(sq, 'cello');
    near(frequency(cello), SOURCES.cello.hz);
});

test('notes are named from the frequency, with the between-two-notes wording the 2025 scheme allows', () => {
    assert.equal(noteOf(440).name, 'A4');
    assert.equal(noteOf(261.63).name, 'C4');
    assert.equal(noteWord(440), 'A4');
    assert.match(noteWord(500), /^between B and C$/);
    assert.equal(noteOf(SOURCES.bass.hz).name, 'G#2');
});

test('level in dB is a height: +6 dB is twice, −6 dB is half', () => {
    near(dbToGain(6), 1.9953, 1e-3);
    near(dbToGain(-6), 0.5012, 1e-3);
    assert.equal(levelWord(6), 'twice the height');
    assert.equal(levelWord(-6), 'half the height');
    assert.equal(levelWord(0), 'as played');
    assert.equal(levelWord(12), 'four times the height');
});

test('the LFO rate comes from the tempo: 120 bpm, crotchet 2 Hz, quaver 4 Hz (2020)', () => {
    assert.equal(BPM, 120);
    assert.equal(lfoHz('off'), 0);
    assert.equal(lfoHz('crotchet'), 2);
    assert.equal(lfoHz('quaver'), 4);
    assert.equal(lfoHz('semiquaver'), 8);
});

test('the file: 10 MB mono 44.1 kHz 16-bit; stereo 20 MB; stereo 88.2 kHz 24-bit 60 MB (2024)', () => {
    near(fileMb({ channels: 1, rate: 44.1, depth: 16 }), 10);
    near(fileMb({ channels: 2, rate: 44.1, depth: 16 }), 20);
    near(fileMb({ channels: 2, rate: 88.2, depth: 24 }), 60);
    near(bytesPerSecond({ channels: 1, rate: 44.1, depth: 16 }), 88200);
    near(bytesPerSecond({ channels: 2, rate: 44.1, depth: 16 }), 176400);
});

test('the screen shows the span the time base gives, and the presets keep the period readable', () => {
    assert.equal(TIME_BASES[1].span, DIVS);
    for (const id of ['note', 'period', 'octave', 'lower', 'kick', 'louder']) {
        const s = applyPreset(DEFAULT_STATE, id);
        const c = cyclesShown(s);
        assert.ok(c >= 1 && c <= 12, `${id}: ${c.toFixed(1)} cycles on screen`);
    }
    near(cyclesShown(applyPreset(DEFAULT_STATE, 'period')), 2.5);
    near(cyclesShown(applyPreset(DEFAULT_STATE, 'kick')), 1);
});

test('dragging the bracket stretches the period within an octave either way, and a chip resets it', () => {
    const s = applyPreset(DEFAULT_STATE, 'period');
    const wide = stretchTo(s, 2);
    near(frequency(wide), 250);
    near(frequency(stretchTo(s, 4)), 250, 1e-6);
    near(frequency(stretchTo(s, 0.5)), 1000);
    assert.equal(wide.presetId, null);
    assert.equal(setOctave(wide, 'up').stretch, 1);
});

test('each preset lands on its task and its verdict', () => {
    const want = { note: 'readable', period: 'readable', octave: 'not-yet', lower: 'wrong-shape', kick: 'readable', louder: 'not-yet', lfo: 'lfo-crotchet', file: 'base' };
    for (const p of PRESETS) {
        const st = applyPreset(DEFAULT_STATE, p.id);
        assert.equal(st.task, p.task, p.id);
        assert.equal(verdict(st).key, want[p.id], p.id);
    }
});

test('the papers\' answers are reached by the controls', () => {
    assert.equal(verdict(setOctave(applyPreset(DEFAULT_STATE, 'octave'), 'up')).key, 'directed');
    assert.equal(verdict(setOctave(applyPreset(DEFAULT_STATE, 'octave'), 'down')).key, 'wrong-way');
    const lower = applyPreset(DEFAULT_STATE, 'lower');
    assert.equal(verdict(setSource(lower, 'saw')).key, 'wrong-octave');
    assert.equal(verdict(setOctave(setSource(lower, 'saw'), 'down')).key, 'directed');
    const louder = applyPreset(DEFAULT_STATE, 'louder');
    assert.equal(verdict(setLevel(louder, 6)).key, 'directed');
    assert.equal(verdict(setLevel(louder, 12)).key, 'too-loud');
    assert.equal(verdict(setOctave(setLevel(louder, 6), 'up')).key, 'period-moved');
    const lfo = applyPreset(DEFAULT_STATE, 'lfo');
    assert.equal(verdict(setLfo(lfo, 'quaver')).key, 'directed');
    assert.equal(verdict(setLfo(lfo, 'off')).key, 'no-lfo');
    const file = applyPreset(DEFAULT_STATE, 'file');
    assert.equal(verdict(setChannels(file, 2)).key, 'stereo');
    const full = setDepth(setRate(setChannels(file, 2), 88.2), 24);
    assert.equal(verdict(full).key, 'directed');
    near(verdict(full).mb, 60);
});

test('readings gather what the console shows', () => {
    const r = readings(applyPreset(DEFAULT_STATE, 'period'));
    near(r.hz, 500); near(r.ms, 2); near(r.s, 0.002);
    assert.equal(r.kind, 'osc');
    assert.equal(r.lfoHz, 0);
    near(r.fileMb, 10);
    const n = readings(DEFAULT_STATE);
    assert.equal(n.kind, 'file');
    assert.equal(n.note.name, noteOf(SOURCES.cello.hz).name);
    assert.ok(n.shape.length > 10);
    assert.equal(setTimeBase(DEFAULT_STATE, 7), DEFAULT_STATE, 'an unknown time base is ignored');
    assert.equal(TASKS.period.hz, 500);
});
