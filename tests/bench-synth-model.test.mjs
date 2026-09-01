import test from 'node:test';
import assert from 'node:assert/strict';
import {
    DEFAULT_STATE, PRESETS, PARTS, WAVES, BPM,
    harmonicAmp, midiHz, noteName, fmtHz, fmtMs, posToLog, logToPos,
    resDb, resQ, nodeQ, filterDb, filterMag, filterCoefficients, adsrAt, lfoValue, lfoSwing,
    applyPreset, setWave, setOctave, setDetune, setOsc2, setFilter, setCutoff, setRes, setAttack, setRelease, setLfoTarget, setLfoDepth, setVoices, setPart, dragDot, rawOf,
    spectrum, waveShape, timeline, gateMs, homeMidi, readings, verdict, judgeSection, judgeAll, schemePoints, osc2Ratio, arpeggiate, setArp,
} from '../lib/bench/synth-model.js';

const near = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol, `${a} not within ${tol} of ${b}`);

test('the four waveforms carry the series the spec names: square odd 1/n, saw all 1/n, triangle odd 1/n², sine the fundamental', () => {
    assert.equal(harmonicAmp('square', 1), 1);
    assert.equal(harmonicAmp('square', 2), 0);
    near(harmonicAmp('square', 3), 1 / 3);
    near(harmonicAmp('saw', 2), 1 / 2);
    near(harmonicAmp('saw', 3), 1 / 3);
    assert.equal(harmonicAmp('triangle', 2), 0);
    near(harmonicAmp('triangle', 3), 1 / 9);
    assert.equal(harmonicAmp('sine', 1), 1);
    assert.equal(harmonicAmp('sine', 2), 0);
});

test('pitch: A4 is 440 Hz, an octave doubles, and the parts sit in A minor', () => {
    near(midiHz(69), 440);
    near(midiHz(57), 220);
    assert.equal(noteName(69), 'A4');
    assert.equal(noteName(33), 'A1');
    assert.equal(noteName(PARTS.bass.notes[0].midi), 'A1');
    assert.equal(fmtHz(55), '55.0 Hz');
    assert.equal(fmtHz(900), '900 Hz');
    assert.equal(fmtHz(2500), '2.5 kHz');
    assert.equal(fmtMs(5), '5 ms');
    assert.equal(fmtMs(1200), '1.2 s');
    assert.equal(BPM, 100);
});

test('a log dial walks its range: position 0 is the minimum, 100 the maximum, 50 the geometric middle', () => {
    near(posToLog(0, 1, 2000), 1);
    near(posToLog(100, 1, 2000), 2000);
    near(posToLog(50, 40, 16000), 800);
    near(logToPos(800, 40, 16000), 50);
});

test('resonance is the node\'s Q: 0 % is the Butterworth corner at -3 dB, 100 % a 24 dB peak; bandpass takes Q as Q', () => {
    near(resDb(0), -3);
    near(resDb(100), 24);
    near(resQ(0), 10 ** (-3 / 20));
    near(nodeQ({ filter: 'lpf', res: 0 }), -3);
    near(nodeQ({ filter: 'bpf', res: 0 }), 10 ** (-3 / 20));
});

test('the filter curve is the RBJ biquad the node runs: a low-pass is flat well below the cutoff, near -3 dB at it, and 12 dB an octave down above', () => {
    const s = { ...DEFAULT_STATE, filter: 'lpf', cutoff: 1000, res: 0 };
    near(filterDb(s, 50), 0, 0.1);
    near(filterDb(s, 1000), -3, 0.3);
    const oct1 = filterDb(s, 4000);
    const oct2 = filterDb(s, 8000);
    assert.ok(oct2 - oct1 < -10 && oct2 - oct1 > -14, `slope ${oct2 - oct1} dB/oct`);
    // resonance lifts the cutoff
    const peaky = { ...s, res: 100 };
    assert.ok(filterDb(peaky, 1000) > 20, `peak ${filterDb(peaky, 1000)} dB`);
    // high-pass mirrors it; band-pass passes the cutoff at 0 dB
    const hp = { ...s, filter: 'hpf' };
    near(filterDb(hp, 16000), 0, 0.2);
    assert.ok(filterDb(hp, 100) < -35);
    const bp = { ...s, filter: 'bpf' };
    near(filterDb(bp, 1000), 0, 0.1);
    assert.ok(filterDb(bp, 100) < -10 && filterDb(bp, 10000) < -10);
    assert.throws(() => filterCoefficients('notch', 1000, 1));
    near(filterMag(s, 50), 1, 0.02);
});

test('the envelope: attack, decay and release are times, sustain a level; straight lines; release from wherever the key lifts', () => {
    const s = { attack: 100, decay: 200, sustain: 50, release: 400 };
    near(adsrAt(s, 0, 1000), 0);
    near(adsrAt(s, 50, 1000), 0.5);
    near(adsrAt(s, 100, 1000), 1);
    near(adsrAt(s, 200, 1000), 0.75);
    near(adsrAt(s, 300, 1000), 0.5);
    near(adsrAt(s, 900, 1000), 0.5);
    near(adsrAt(s, 1200, 1000), 0.25);
    near(adsrAt(s, 1400, 1000), 0);
    // the key lifts mid-attack: the release starts from where it got to
    near(adsrAt(s, 50, 50), 0.5);
    near(adsrAt(s, 250, 50), 0.25);
});

test('the LFO is a wave slow enough to count, and its depth is cents on pitch and cutoff, a fraction on the level', () => {
    near(lfoValue('sine', 1, 0.25), 1);
    near(lfoValue('square', 2, 0.1), 1);
    near(lfoValue('square', 2, 0.3), -1);
    near(lfoValue('triangle', 1, 0.25), 1);
    near(lfoValue('triangle', 1, 0.75), -1);
    near(lfoSwing({ lfoTarget: 'pitch', lfoDepth: 50 }), 100);
    near(lfoSwing({ lfoTarget: 'cutoff', lfoDepth: 50 }), 1200);
    near(lfoSwing({ lfoTarget: 'amp', lfoDepth: 50 }), 0.5);
});

test('the presets land the papers\' settings, and an edit drops the preset but keeps the task', () => {
    const s = applyPreset(DEFAULT_STATE, 'as2023');
    assert.equal(s.part, 'bass');
    assert.equal(s.wave, 'square');
    assert.equal(s.osc2, 'pair');
    assert.equal(s.detune, 12);
    assert.equal(verdict(s).ok, true);
    const edited = setDetune(s, 0);
    assert.equal(edited.presetId, null);
    assert.equal(edited.task, 'as2023');
    assert.equal(verdict(edited).ok, false);
    assert.equal(verdict(edited).missed[0].id, 'detune');
    for (const p of PRESETS) {
        const st = applyPreset(DEFAULT_STATE, p.id);
        assert.equal(st.presetId, p.id);
        if (p.task !== 'judge') assert.equal(verdict(st).ok, true, `${p.id} should land as directed`);
    }
});

test('the 2023 AS bass: square, detune, a low-pass, the right octave; an octave up is the report\'s fault', () => {
    const s = applyPreset(DEFAULT_STATE, 'as2023');
    const up = setOctave(s, 1);
    const v = verdict(up);
    assert.equal(v.ok, false);
    assert.equal(v.missed[0].id, 'octave');
    assert.match(v.missed[0].said, /octave too high/);
    const saw = setWave(s, 'saw');
    assert.equal(verdict(saw).missed[0].id, 'wave');
    const hp = setFilter(s, 'hpf');
    assert.equal(verdict(hp).missed[0].id, 'filter');
    const wide = setDetune(s, 45);
    assert.match(verdict(wide).missed[0].said, /out of tune/);
});

test('the 2024 AS keys: two saws, slight detune, the same octave, an LPF no brighter than the example', () => {
    const s = applyPreset(DEFAULT_STATE, 'as2024');
    assert.equal(s.part, 'keys');
    assert.equal(verdict(s).ok, true);
    assert.equal(verdict(setOsc2(s, 'off')).missed[0].id, 'wave');
    assert.equal(verdict(setDetune(s, 25)).missed[0].id, 'detune');
    assert.equal(verdict(setCutoff(s, 9000)).missed[0].id, 'filter');
});

test('the 2025 lead: square, mono, subtle portamento, a soft attack and full sustain, a muted cutoff, a subtle LFO on it', () => {
    const s = applyPreset(DEFAULT_STATE, 'a2025');
    assert.equal(verdict(s).ok, true);
    assert.equal(verdict(setWave(s, 'sine')).missed[0].id, 'wave');
    assert.equal(verdict(setVoices(s, 'poly')).missed[0].id, 'mono');
    assert.equal(verdict(setAttack(s, 1)).missed[0].id, 'env');
    assert.equal(verdict(setCutoff(s, 3000)).missed[0].id, 'filter');
    assert.equal(verdict(setLfoDepth(s, 0)).missed[0].id, 'lfo');
    assert.equal(verdict(setLfoTarget(s, 'pitch')).missed[0].id, 'lfo');
});

test('the fills: an instant attack, full sustain and a release you can hear; the tail the 2020 report names', () => {
    const s = applyPreset(DEFAULT_STATE, 'fills2023');
    assert.equal(verdict(s).ok, true);
    assert.equal(verdict(setRelease(s, 10)).missed[0].id, 'env');
    assert.equal(verdict(setRes(s, 60)).missed[0].id, 'filter');
    assert.equal(verdict(setWave(s, 'saw')).ok, true);
});

test('the judge: a pad patch on the bass fails on its envelope; a bass patch on the pad fails on envelope and voices', () => {
    const b = applyPreset(DEFAULT_STATE, 'judgeBass');
    const jb = judgeAll(b);
    assert.equal(jb.env.grade, 'poor');
    assert.match(jb.env.why, /600 ms attack/);
    assert.equal(jb.osc.grade, 'good');
    assert.equal(jb.filter.grade, 'good');
    assert.ok(verdict(b).key.startsWith('poor-env'));
    const p = applyPreset(DEFAULT_STATE, 'judgePad');
    const jp = judgeAll(p);
    assert.equal(jp.env.grade, 'poor');
    assert.equal(jp.voices.grade, 'poor');
    assert.match(jp.voices.why, /complete chords/);
    assert.equal(jp.lfo.grade, 'partly');
    // fix the pad: slow attack, long release, poly
    const fixed = setVoices(setRelease(setAttack(p, 800), 1500), 'poly');
    assert.equal(judgeSection(fixed, 'env').grade, 'partly');
    assert.equal(judgeSection({ ...fixed, sustain: 80 }, 'env').grade, 'good');
    assert.equal(judgeSection(fixed, 'voices').grade, 'good');
});

test('the judge knows the Q6 misconceptions: an LFO is a control signal, a high-pass on a bass removes the bass, a sine has nothing to filter', () => {
    const s = { ...DEFAULT_STATE, task: null, presetId: null };
    assert.equal(judgeSection(setFilter(s, 'hpf'), 'filter').grade, 'poor');
    assert.equal(judgeSection(setWave(s, 'sine'), 'osc').grade, 'poor');
    const vib = setLfoDepth(setLfoTarget(s, 'pitch'), 20);
    assert.equal(judgeSection(vib, 'lfo').grade, 'good');
    assert.match(judgeSection(vib, 'lfo').why, /control signal/);
    const wide = setLfoDepth(vib, 80);
    assert.equal(judgeSection(wide, 'lfo').grade, 'poor');
    assert.equal(judgeSection(setOctave(s, 1), 'osc').grade, 'poor');
});

test('the spectrum is the oscillators\' series through the filter, and a detuned pair draws two lines a few cents apart', () => {
    const s = { ...applyPreset(DEFAULT_STATE, 'as2023'), detune: 20 };
    const lines = spectrum(s, 100);
    const firsts = lines.filter((l) => l.hz < 105 && l.hz > 95);
    assert.equal(firsts.length, 2);
    assert.ok(firsts[1].hz > firsts[0].hz);
    near(1200 * Math.log2(firsts[1].hz / firsts[0].hz), 20, 0.01);
    // a square has no even harmonics, so nothing near 200 Hz
    assert.equal(lines.filter((l) => l.hz > 195 && l.hz < 205).length, 0);
    // above the cutoff the filter has taken the harmonics down
    const high = lines.find((l) => l.hz > 3500);
    assert.ok(high.out < high.amp * 0.1, `${high.out} vs ${high.amp}`);
    // the sub adds lines an octave below
    const sub = spectrum({ ...s, osc2: 'sub', detune: 0 }, 100);
    assert.ok(sub.some((l) => Math.abs(l.hz - 50) < 0.01));
});

test('the wave shape is the same series summed: a filtered square is rounder than the raw one, and the filter open leaves it square', () => {
    const s = { ...applyPreset(DEFAULT_STATE, 'as2023'), osc2: 'off', cutoff: 300 };
    const { raw, out } = waveShape(s);
    assert.equal(raw.length, 256);
    // the raw square has the steep edges: its second differences are far larger than the filtered wave's
    const rough = (a) => { let r = 0; for (let i = 2; i < a.length; i += 1) r += Math.abs(a[i] - 2 * a[i - 1] + a[i - 2]); return r; };
    assert.ok(rough(raw) > rough(out) * 3, `raw ${rough(raw).toFixed(2)}, filtered ${rough(out).toFixed(2)}`);
    const open = waveShape(rawOf(s));
    let diff = 0;
    for (let i = 0; i < 256; i += 1) diff += Math.abs(open.raw[i] - open.out[i]);
    near(diff, 0, 1e-6);
});

test('one note in time: the gate is the part\'s note length, the amplifier follows the envelope, the cutoff lifts by the Env amount and wobbles with the LFO', () => {
    const s = { ...applyPreset(DEFAULT_STATE, 'as2023'), attack: 10, decay: 100, sustain: 50, release: 100, envAmt: 50, lfoDepth: 0 };
    assert.equal(gateMs(s), Math.round(2 * (60 / 100 / 4) * 0.8 * 1000));
    const tl = timeline(s);
    assert.equal(tl.gateMs, gateMs(s));
    assert.ok(tl.spanMs >= tl.gateMs + s.release);
    const iPeak = Math.round(10 / tl.stepMs);
    near(tl.env[iPeak], 1, 1e-6);
    near(tl.amp[iPeak], 1, 1e-6);
    near(tl.cutoff[iPeak], 700 * 2 ** 2, 1e-6);
    near(tl.cutoff[0], 700, 1e-6);
    const wob = timeline({ ...s, envAmt: 0, lfoTarget: 'cutoff', lfoRate: 5, lfoDepth: 50 });
    const iQuarter = Math.round(50 / wob.stepMs); // a quarter cycle at 5 Hz: the triangle at +1
    near(wob.cutoff[iQuarter], 700 * 2, 1e-3);
    const trem = timeline({ ...s, envAmt: 0, lfoTarget: 'amp', lfoRate: 5, lfoDepth: 100 });
    const iTrough = Math.round(150 / trem.stepMs);
    near(trem.amp[iTrough], 0, 1e-3);
});

test('the dot on the harmonics screen is the cutoff and the resonance; hold plays the oscillators raw', () => {
    const s = dragDot(DEFAULT_STATE, 2000, 10.5);
    assert.equal(s.cutoff, 2000);
    assert.equal(s.res, 50);
    const r = rawOf(s);
    assert.equal(r.bypass, true);
    assert.equal(r.lfoDepth, 0);
    assert.equal(r.sustain, 100);
});

test('readings: the home note carries the octave, and the words for brightness and envelope follow the settings', () => {
    const s = applyPreset(DEFAULT_STATE, 'as2023');
    assert.equal(readings(s).note, 'A1');
    assert.equal(readings(setOctave(s, 1)).note, 'A2');
    assert.equal(homeMidi(setOctave(s, -1)), 21);
    assert.equal(readings(s).brightness, 'warm');
    assert.equal(readings(setCutoff(s, 5000)).brightness, 'open');
    assert.equal(readings(s).envelope, 'held');
    assert.equal(readings(setAttack(s, 600)).envelope, 'swelling');
    assert.equal(readings(applyPreset(s, 'judgeBass')).job, 'a synth bass');
    // changing the part under a judge preset keeps the preset; under a paper's task it drops it
    assert.equal(setPart(applyPreset(s, 'judgeBass'), 'pad').presetId, 'judgeBass');
    assert.equal(setPart(s, 'pad').presetId, null);
    assert.equal(schemePoints({ ...s, task: null }).length, 0);
    assert.equal(WAVES.saw.type, 'sawtooth');
});

test('coarse tuning: Osc 2 at a fifth sits seven semitones up, draws its own lines, and the judge calls it thick, not a bass', () => {
    near(osc2Ratio({ osc2: 'fifth' }), 2 ** (7 / 12));
    near(osc2Ratio({ osc2: 'sub' }), 0.5);
    near(osc2Ratio({ osc2: 'pair' }), 1);
    const s = setOsc2(applyPreset(DEFAULT_STATE, 'as2023'), 'fifth');
    const lines = spectrum(s, 100);
    assert.ok(lines.some((l) => Math.abs(l.hz - 100 * 2 ** (7 / 12)) < 0.01 && l.osc === 2));
    assert.equal(judgeSection(s, 'osc').grade, 'partly');
    assert.match(judgeSection(s, 'osc').why, /fifth/);
    assert.equal(judgeSection(setPart(s, 'pad'), 'osc').grade, 'good');
    assert.equal(verdict(s).missed[0].id, 'detune');
    assert.match(verdict(s).missed[0].said, /not a detuned pair/);
});

test('the arpeggiator steps a chord up in sixteenths over its own length and leaves single notes alone', () => {
    const pad = { ...applyPreset(DEFAULT_STATE, 'judgePad'), arp: 'up' };
    const bar = PARTS.pad.notes.filter((e) => e.s < 16);
    const out = arpeggiate(bar, pad);
    assert.equal(out.length, 16);
    assert.deepEqual(out.slice(0, 5).map((e) => e.midi), [45, 48, 52, 57, 45]);
    assert.ok(out.every((e) => e.len === 1));
    assert.equal(gateMs(pad), Math.round(1 * (60 / 100 / 4) * 0.94 * 1000));
    const off = arpeggiate(bar, { ...pad, arp: 'off' });
    assert.equal(off.length, 4);
    const bass = arpeggiate(PARTS.bass.notes.filter((e) => e.s < 16), pad);
    assert.equal(bass.length, 8);
    assert.equal(setArp(DEFAULT_STATE, 'up').arp, 'up');
    assert.equal(setArp(DEFAULT_STATE, 'sideways'), DEFAULT_STATE);
});
