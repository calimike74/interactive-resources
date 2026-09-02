import test from 'node:test';
import assert from 'node:assert/strict';
import {
    TYPE_IDS, TYPES, impulse, impulseEnergy, envelopeDbAt, earlyTaps, impulseLength, GATE_HOLD, GATE_CLOSE, TYPE_GAIN,
    PRESETS, presetsFor, applyPreset, DEFAULT_STATE, judgeAll, judgeSection, verdict, readings, REPORTS, SECTION_IDS,
    setTime, setWet, setStereo, setRouting, setType, setPredelay, setDry, wetPan, dryPan, dampedTime, boxGrade, schemePoints,
} from '../lib/bench/reverb-model.js';

const noDash = (s) => assert.ok(!/—/.test(s) && !/\butilise/i.test(s), `house copy law broken: ${s}`);

test('RT60 by construction: every answer is 60 dB down at the reverb time; a gate ends at its hold; a reversal peaks at the time', () => {
    for (const type of ['room', 'hall', 'plate', 'spring']) {
        for (const T of [0.5, 2, 4]) {
            const db = envelopeDbAt(type, T, T);
            assert.ok(Math.abs(db + 60) < 0.5, `${type} ${T} s: ${db.toFixed(2)} dB`);
        }
    }
    assert.equal(envelopeDbAt('gated', 4, GATE_HOLD + GATE_CLOSE + 0.001), -120);
    assert.ok(envelopeDbAt('gated', 4, 0.1) > -3);
    assert.ok(envelopeDbAt('reversed', 2, 1.9) > envelopeDbAt('reversed', 2, 0.5));
});

test('the six types are the spec\'s six, in the spec\'s order, each a different shape of the answer', () => {
    assert.deepEqual(TYPE_IDS, ['room', 'hall', 'plate', 'spring', 'gated', 'reversed']);
    assert.equal(earlyTaps('plate', 2).length, 0);
    const room = earlyTaps('room', 2);
    assert.equal(room.length, 8);
    assert.ok(room[0].t >= 0.003 && room[7].t <= 0.035);
    const hall = earlyTaps('hall', 2);
    assert.equal(hall.length, 6);
    assert.ok(hall[0].t >= 0.015 && hall[5].t <= 0.08);
    assert.ok(hall[0].gain < room[0].gain);
    const spring = earlyTaps('spring', 2);
    assert.ok(spring.length > 20 && spring.every((p) => p.chirp));
    assert.ok(Math.abs(spring[1].t - spring[0].t - 0.055) < 1e-6);
    assert.equal(impulseLength('gated', 4), GATE_HOLD + GATE_CLOSE);
    assert.equal(impulseLength('reversed', 2), 2);
    assert.equal(impulseLength('hall', 2), 2.4);
    assert.equal(impulseLength('hall', 8), 8);
    for (const t of Object.values(TYPES)) { noDash(t.mech); noDash(t.job); }
});

test('every answer is normalised to unit energy times its measured trim; mono is one channel twice, stereo is two', () => {
    for (const type of TYPE_IDS) {
        const imp = impulse({ type, time: 1.5, damping: 30, stereo: 'stereo' }, 48000);
        assert.ok(Math.abs(impulseEnergy(imp) - TYPE_GAIN[type] ** 2) < 1e-3, `${type} energy ${impulseEnergy(imp)}`);
        assert.equal(imp.left.length, Math.round(impulseLength(type, 1.5) * 48000));
        assert.equal(imp.envelope.length, 240);
        let diff = 0;
        for (let i = 0; i < imp.left.length; i += 1) diff += Math.abs(imp.left[i] - imp.right[i]);
        assert.ok(diff > 0, `${type}: stereo channels differ`);
        const mono = impulse({ type, time: 1.5, damping: 30, stereo: 'mono' }, 48000);
        for (let i = 0; i < mono.left.length; i += 97) assert.equal(mono.left[i], mono.right[i], `${type} mono at ${i}`);
    }
});

test('damping runs the top band out faster and never changes the length', () => {
    assert.equal(dampedTime(2, 0), 2);
    assert.equal(dampedTime(2, 100), 0.5);
    const bright = impulse({ type: 'hall', time: 2, damping: 0 }, 48000);
    const dark = impulse({ type: 'hall', time: 2, damping: 100 }, 48000);
    assert.equal(bright.left.length, dark.left.length);
    const hf = (imp) => { let s = 0; for (let i = 48001; i < 72000; i += 1) s += (imp.left[i] - imp.left[i - 1]) ** 2; return s; };
    const lf = (imp) => { let s = 0; for (let i = 48001; i < 72000; i += 1) s += imp.left[i] ** 2; return s; };
    assert.ok(hf(dark) / lf(dark) < hf(bright) / lf(bright));
});

test('Core presets are the six types, each suiting its part in every section; the papers and the Judge patches live at A-level', () => {
    const core = presetsFor('core');
    assert.deepEqual(core.map((p) => p.name), ['Small room', 'Hall', 'Plate', 'Spring', 'Gated', 'Reverse']);
    assert.deepEqual(core.map((p) => p.set.type), TYPE_IDS);
    for (const p of core) {
        const all = judgeAll(applyPreset(DEFAULT_STATE, p.id));
        for (const id of SECTION_IDS) assert.equal(all[id].grade, 'good', `${p.name} ${id}: ${all[id].why}`);
    }
    assert.deepEqual(presetsFor('alevel').map((p) => p.name), ['2019 AS paper', '2019 paper', '2020 paper', '2019 dials', 'Judge: swamped', 'Judge: an insert', 'Judge: mono']);
    assert.deepEqual(presetsFor('extension'), presetsFor('alevel'));
    assert.equal(DEFAULT_STATE.presetId, 'hall');
    assert.equal(DEFAULT_STATE.time, 2.6);
    for (const p of PRESETS) noDash(p.blurb);
    for (const r of Object.values(REPORTS)) noDash(r);
});

test('each paper task lands as directed, and each scheme point breaks the way the reports describe', () => {
    const as = applyPreset(DEFAULT_STATE, 'as2019');
    assert.equal(verdict(as).ok, true);
    assert.equal(verdict(setTime(as, 1)).missed[0].id, 'time');
    assert.equal(verdict(setWet(as, 60)).missed[0].id, 'level');
    assert.equal(verdict(setRouting(as, 'insert')).missed[0].id, 'send');
    assert.equal(verdict(setStereo(as, 'mono')).missed[0].id, 'stereo');
    const a = applyPreset(DEFAULT_STATE, 'a2019');
    assert.equal(verdict(a).ok, true);
    assert.equal(verdict(setTime(a, 2)).missed[0].id, 'time');
    assert.equal(verdict(setWet(a, 10)).missed[0].id, 'blend');
    const g = applyPreset(DEFAULT_STATE, 'a2020');
    assert.equal(verdict(g).ok, true);
    assert.equal(verdict(setType(g, 'room')).missed[0].id, 'gate');
    assert.equal(verdict(setTime(g, 2)).missed[0].id, 'time');
    const d = applyPreset(DEFAULT_STATE, 'dials2019');
    assert.equal(verdict(d).ok, true);
    assert.equal(verdict(setPredelay(d, 100)).missed[0].id, 'predelay');
    assert.equal(verdict(setTime(d, 2)).missed[0].id, 'time');
    assert.equal(verdict(setType(d, 'plate')).missed[0].id, 'type');
});

test('the Judge patches fail where the reports say, and the offered fix repairs each one', () => {
    const wet = applyPreset(DEFAULT_STATE, 'judgeWet');
    assert.equal(judgeSection(wet, 'mix').grade, 'poor');
    assert.match(judgeSection(wet, 'mix').cite, /2018 AS report/);
    assert.equal(judgeSection(setWet(wet, 25), 'mix').grade, 'good');
    assert.equal(verdict(wet).key, 'poor-mix');
    const ins = applyPreset(DEFAULT_STATE, 'judgeInsert');
    assert.equal(judgeSection(ins, 'routing').grade, 'poor');
    assert.match(judgeSection(ins, 'routing').cite, /2023 AS report/);
    assert.equal(judgeSection(setRouting(ins, 'send'), 'routing').grade, 'good');
    assert.equal(wetPan(ins), -1);
    assert.equal(dryPan(ins), -1);
    assert.equal(wetPan(setRouting(ins, 'send')), 0);
    const mono = applyPreset(DEFAULT_STATE, 'judgeMono');
    assert.equal(judgeSection(mono, 'routing').grade, 'poor');
    assert.match(judgeSection(mono, 'routing').cite, /award 0 if reverb is mono/);
    assert.equal(judgeSection(setStereo(mono, 'stereo'), 'routing').grade, 'good');
    assert.equal(judgeSection(setDry(DEFAULT_STATE, 0), 'mix').grade, 'partly');
    assert.equal(judgeSection(applyPreset(DEFAULT_STATE, 'room'), 'time').grade, 'good');
    assert.match(judgeSection(applyPreset(DEFAULT_STATE, 'room'), 'time').cite, /small room reverbs/);
    assert.equal(judgeSection(setTime(DEFAULT_STATE, 5), 'time').grade, 'partly');
    assert.equal(judgeSection(setTime(DEFAULT_STATE, 7), 'time').grade, 'poor');
    assert.equal(judgeSection(applyPreset(DEFAULT_STATE, 'a2020'), 'mix').grade, 'good');
});

test('readings and setters: three significant figures on the time, a setter that changes nothing returns the same state', () => {
    const r = readings(DEFAULT_STATE);
    assert.equal(r.rt60, 2.6);
    assert.equal(r.taps, 6);
    assert.equal(r.firstTapMs, 15);
    assert.equal(r.amount, 'clearly audible');
    assert.equal(r.tail, 'long');
    assert.equal(setTime(DEFAULT_STATE, 2.6), DEFAULT_STATE);
    assert.equal(setTime(DEFAULT_STATE, 3.14159).time, 3.14);
    assert.equal(setTime(DEFAULT_STATE, 3.14159).presetId, null);
    assert.equal(setWet(DEFAULT_STATE, 140).wet, 100);
    assert.equal(readings(setWet(DEFAULT_STATE, 70)).amount, 'swamped');
    assert.equal(readings(setDry(DEFAULT_STATE, 0)).amount, 'wet only');
});

test('a box of the path is faulted only for what it holds, and a met scheme point is narrated as met', () => {
    const mono = applyPreset(DEFAULT_STATE, 'judgeMono');
    assert.equal(boxGrade(mono, 'mix'), 'poor');
    assert.equal(boxGrade(mono, 'pan'), 'good');
    assert.equal(boxGrade(mono, 'insert'), 'good');
    const wet = applyPreset(DEFAULT_STATE, 'judgeWet');
    assert.equal(boxGrade(wet, 'send'), 'poor');
    assert.equal(boxGrade(wet, 'fader'), 'good');
    const ins = applyPreset(DEFAULT_STATE, 'judgeInsert');
    assert.equal(boxGrade(ins, 'insert'), 'poor');
    assert.equal(boxGrade(ins, 'pan'), 'partly');
    assert.equal(boxGrade(ins, 'return'), 'good');
    assert.equal(boxGrade(setDry(DEFAULT_STATE, 0), 'fader'), 'partly');
    assert.equal(boxGrade(setDry(DEFAULT_STATE, 0), 'send'), 'good');
    const as = applyPreset(DEFAULT_STATE, 'as2019');
    const said = schemePoints(as).map((p) => p.said).join('; ');
    assert.match(said, /a 2 s reverb; 25 % wet, clearly audible; on a send, so nothing else is affected; in stereo/);
    assert.ok(!/mono|insert/.test(said));
    const d = schemePoints(applyPreset(DEFAULT_STATE, 'dials2019')).map((p) => p.said).join('; ');
    assert.equal(d, 'Hall; 300 ms, inside 200 to 400 ms; 3.2 s, inside 2.5 to 4 s');
    assert.equal(readings(applyPreset(DEFAULT_STATE, 'reverse')).firstTapMs, 15);
});
