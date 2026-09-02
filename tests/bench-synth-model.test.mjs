import test from 'node:test';
import assert from 'node:assert/strict';
import {
    DEFAULT_STATE, PRESETS, PARTS, WAVES, BPM, SOURCE_GAIN,
    harmonicAmp, pulseCoef, midiHz, noteName, fmtHz, fmtMs, posToLog, logToPos,
    resDb, resQ, nodeQ, filterDb, filterMag, filterCoefficients, adsrAt, lfoValue, lfoSwing,
    applyPreset, setPulse, setSaw, setSub, setNoise, setWidth, setPwm, setSubOct, setVca, setOctave, setDetune, setOsc2, setFilter, setCutoff, setRes, setAttack, setRelease, setLfoTarget, setLfoDepth, setVoices, setPart, dragDot, rawOf,
    spectrum, noiseLevel, waveShape, timeline, gateMs, homeMidi, readings, verdict, judgeSection, judgeAll, schemePoints, osc2Ratio, arpeggiate, setArp,
    sources, waveOf, sourceSaid, sourcesShort, harmonicsSaid, pwmOn, widthAt, isSquare,
    SHAPES, setShape, triCoef, shapeCoef, waveGain, presetsFor,
} from '../lib/bench/synth-model.js';

const near = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol, `${a} not within ${tol} of ${b}`);

test('the waveforms carry the series the spec names, in the amplitude a wave of peak 1 has: square odd 4/nπ, saw all 2/nπ, a pulse the even ones as it narrows', () => {
    near(harmonicAmp('square', 1), 4 / Math.PI);
    assert.equal(harmonicAmp('square', 2), 0);
    near(harmonicAmp('square', 3) / harmonicAmp('square', 1), 1 / 3);
    near(harmonicAmp('saw', 1), 2 / Math.PI);
    near(harmonicAmp('saw', 2) / harmonicAmp('saw', 1), 1 / 2);
    // a square is a pulse at 50 %: the same odd series, no even ones
    near(harmonicAmp('pulse', 1, 0.5), harmonicAmp('square', 1));
    near(harmonicAmp('pulse', 2, 0.5), 0, 1e-12);
    near(harmonicAmp('pulse', 3, 0.5), harmonicAmp('square', 3));
    // at 25 % the second harmonic is there and the fourth is not
    assert.ok(harmonicAmp('pulse', 2, 0.25) > 0.3);
    near(harmonicAmp('pulse', 4, 0.25), 0, 1e-12);
    assert.ok(pulseCoef(2, 0.25) > 0);
    assert.equal(harmonicAmp('triangle', 2), 0);
    assert.equal(harmonicAmp('sine', 2), 0);
});

test('the source mixer: what is on names the wave the papers would; a sub is a square; noise alone has no pitch', () => {
    const s = applyPreset(DEFAULT_STATE, 'as2023');
    assert.equal(waveOf(s), 'square');
    assert.equal(sourceSaid(s), 'a square wave');
    assert.equal(sourcesShort(s), 'square');
    const both = setSaw(s, 100);
    assert.equal(waveOf(both), 'square');
    assert.equal(sourceSaid(both), 'a square wave and a saw wave');
    assert.equal(waveOf(setPulse(both, 40)), 'saw');
    const narrow = setWidth(s, 20);
    assert.equal(waveOf(narrow), 'pulse');
    assert.match(sourceSaid(narrow), /a pulse wave 20 % wide/);
    assert.equal(isSquare(narrow), false);
    const pw = setPwm(narrow, 'lfo');
    assert.equal(pwmOn(pw), true);
    assert.equal(pwmOn(setWidth(pw, 50)), false, 'a square with PW by LFO has nothing to swing');
    near(widthAt(pw, 1), 0.8);
    near(widthAt(pw, -1), 0.2);
    near(widthAt(narrow, 1), 0.2);
    const withSub = setSubOct(setSub(s, 70), 2);
    assert.match(sourceSaid(withSub), /with a square sub-oscillator two octaves down/);
    assert.equal(sourcesShort(withSub), 'square + sub');
    assert.equal(sources(withSub)[0].id, 'pulse');
    const subOnly = setPulse(withSub, 0);
    assert.equal(waveOf(subOnly), 'square');
    assert.match(sourceSaid(subOnly), /^the sub-oscillator alone/);
    const noiseOnly = setNoise(setSub(subOnly, 0), 50);
    assert.equal(waveOf(noiseOnly), 'noise');
    assert.equal(sourceSaid(noiseOnly), 'white noise alone');
    assert.equal(waveOf(setNoise(noiseOnly, 0)), 'none');
    assert.match(harmonicsSaid(both), /square: odd harmonics.*saw: every harmonic/);
    assert.equal(WAVES.noise.character, 'a hiss with no pitch');
    assert.ok(SOURCE_GAIN.saw > SOURCE_GAIN.pulse, 'a saw needs more gain than a square for the same loudness');
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

test('a log slider walks its range: position 0 is the minimum, 100 the maximum, 50 the geometric middle', () => {
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
    const peaky = { ...s, res: 100 };
    assert.ok(filterDb(peaky, 1000) > 20, `peak ${filterDb(peaky, 1000)} dB`);
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
    assert.equal(s.pulse, 100);
    assert.equal(s.saw, 0);
    assert.equal(s.osc2, 'pair');
    assert.equal(s.detune, 12);
    assert.equal(s.vca, 'env');
    assert.equal(verdict(s).ok, true);
    const edited = setDetune(s, 0);
    assert.equal(edited.presetId, null);
    assert.equal(edited.task, 'as2023');
    assert.equal(verdict(edited).ok, false);
    assert.equal(verdict(edited).missed[0].id, 'detune');
    for (const p of PRESETS) {
        const st = applyPreset(DEFAULT_STATE, p.id);
        assert.equal(st.presetId, p.id);
        if (p.task && p.task !== 'judge') assert.equal(verdict(st).ok, true, `${p.id} should land as directed`);
    }
});

test('the 2023 AS bass: square, detune, a low-pass, the right octave; an octave up is the report\'s fault; a saw in the mix or the VCA on Gate loses the mark', () => {
    const s = applyPreset(DEFAULT_STATE, 'as2023');
    const up = setOctave(s, 1);
    const v = verdict(up);
    assert.equal(v.ok, false);
    assert.equal(v.missed[0].id, 'octave');
    assert.match(v.missed[0].said, /octave too high/);
    const saw = setSaw(s, 60);
    assert.equal(verdict(saw).missed[0].id, 'wave');
    assert.match(verdict(saw).missed[0].said, /a pulse and a saw mixed/);
    assert.match(verdict(setNoise(s, 20)).missed[0].said, /noise in the mix/);
    assert.match(verdict(setWidth(s, 20)).missed[0].said, /20 % pulse, not a square/);
    assert.match(verdict(setPwm(setWidth(s, 20), 'lfo')).missed[0].said, /LFO is widening/);
    assert.equal(verdict(setSub(s, 50)).ok, true, 'a sub beneath is a square too');
    const hp = setFilter(s, 'hpf');
    assert.equal(verdict(hp).missed[0].id, 'filter');
    const wide = setDetune(s, 45);
    assert.match(verdict(wide).missed[0].said, /out of tune/);
    assert.equal(verdict(setVca(s, 'gate')).missed[0].id, 'vca');
});

test('the 2024 AS keys: two saws, slight detune, the same octave, an LPF no brighter than the example', () => {
    const s = applyPreset(DEFAULT_STATE, 'as2024');
    assert.equal(s.part, 'keys');
    assert.equal(s.saw, 100);
    assert.equal(verdict(s).ok, true);
    assert.equal(verdict(setOsc2(s, 'off')).missed[0].id, 'wave');
    assert.match(verdict(setOsc2(s, 'off')).missed[0].said, /one saw, not two/);
    assert.equal(verdict(setPulse(s, 100)).missed[0].id, 'wave');
    assert.equal(verdict(setDetune(s, 25)).missed[0].id, 'detune');
    assert.equal(verdict(setCutoff(s, 9000)).missed[0].id, 'filter');
});

test('the 2025 lead: square, mono, subtle portamento, a soft attack and full sustain, a muted cutoff, a subtle LFO on it; the gate cannot do the envelope', () => {
    const s = applyPreset(DEFAULT_STATE, 'a2025');
    assert.equal(verdict(s).ok, true);
    assert.equal(verdict(setPulse(setSaw(s, 0), 0)).missed[0].id, 'wave');
    assert.equal(verdict(setNoise(setPulse(s, 0), 60)).missed[0].id, 'wave');
    assert.equal(verdict(setSaw(setPulse(s, 0), 100)).ok, true, 'the scheme allows a saw');
    assert.equal(verdict(setVoices(s, 'poly')).missed[0].id, 'mono');
    assert.equal(verdict(setAttack(s, 1)).missed[0].id, 'env');
    assert.match(verdict(setVca(s, 'gate')).missed.find((m) => m.id === 'env').said, /VCA is on Gate/);
    assert.equal(verdict(setCutoff(s, 3000)).missed[0].id, 'filter');
    assert.equal(verdict(setLfoDepth(s, 0)).missed[0].id, 'lfo');
    assert.equal(verdict(setLfoTarget(s, 'pitch')).missed[0].id, 'lfo');
});

test('the fills: an instant attack, full sustain and a release you can hear; the tail the 2020 report names', () => {
    const s = applyPreset(DEFAULT_STATE, 'fills2023');
    assert.equal(verdict(s).ok, true);
    assert.equal(verdict(setRelease(s, 10)).missed[0].id, 'env');
    assert.equal(verdict(setRes(s, 60)).missed[0].id, 'filter');
    assert.equal(verdict(setSaw(setPulse(s, 0), 100)).ok, true);
    assert.equal(verdict(setWidth(s, 25)).ok, true, 'the scheme allows a pulse');
});

test('the judge: a pad patch on the bass fails on its envelope; a bass patch on the pad fails on envelope and the VCA, mono and gated', () => {
    const b = applyPreset(DEFAULT_STATE, 'judgeBass');
    const jb = judgeAll(b);
    assert.equal(jb.env.grade, 'poor');
    assert.match(jb.env.why, /600 ms attack/);
    assert.equal(jb.osc.grade, 'good');
    assert.equal(jb.filter.grade, 'good');
    assert.equal(pwmOn(b), true);
    assert.ok(verdict(b).key.startsWith('poor-env'));
    const p = applyPreset(DEFAULT_STATE, 'judgePad');
    assert.equal(p.vca, 'gate');
    const jp = judgeAll(p);
    assert.equal(jp.env.grade, 'poor');
    assert.equal(jp.voices.grade, 'poor');
    assert.match(jp.voices.why, /complete chords/);
    assert.match(jp.voices.why, /VCA is on Gate/);
    assert.equal(jp.lfo.grade, 'partly');
    // poly but still gated: the chord cannot swell
    const poly = setVoices(p, 'poly');
    assert.equal(judgeSection(poly, 'voices').grade, 'poor');
    assert.match(judgeSection(poly, 'voices').why, /noise gate/);
    // fix the pad: slow attack, long release, poly, the VCA on Env
    const fixed = setVca(setVoices(setRelease(setAttack(p, 800), 1500), 'poly'), 'env');
    assert.equal(judgeSection(fixed, 'env').grade, 'partly');
    assert.equal(judgeSection({ ...fixed, sustain: 80 }, 'env').grade, 'good');
    assert.equal(judgeSection(fixed, 'voices').grade, 'good');
    // the gate on a bass: fine while the envelope still reaches the cutoff
    const gb = setVca({ ...applyPreset(DEFAULT_STATE, 'as2023'), task: null }, 'gate');
    assert.equal(judgeSection(gb, 'voices').grade, 'good');
    assert.equal(judgeSection({ ...gb, envAmt: 0 }, 'voices').grade, 'partly');
    assert.match(judgeSection({ ...gb, envAmt: 0 }, 'voices').why, /reaches nothing/);
});

test('the judge knows the Q6 misconceptions: an LFO is a control signal, a high-pass on a bass removes the bass, PWM is the LFO at work, noise has no pitch', () => {
    const s = { ...applyPreset(DEFAULT_STATE, 'as2023'), task: null, presetId: null };
    assert.equal(judgeSection(setFilter(s, 'hpf'), 'filter').grade, 'poor');
    assert.equal(judgeSection(setNoise(setPulse(s, 0), 50), 'osc').grade, 'poor');
    assert.equal(judgeSection(setPulse(s, 0), 'osc').grade, 'poor');
    const vib = setLfoDepth(setLfoTarget(s, 'pitch'), 20);
    assert.equal(judgeSection(vib, 'lfo').grade, 'good');
    assert.match(judgeSection(vib, 'lfo').why, /control signal/);
    const wide = setLfoDepth(vib, 80);
    assert.equal(judgeSection(wide, 'lfo').grade, 'poor');
    assert.equal(judgeSection(setOctave(s, 1), 'osc').grade, 'poor');
    // a pad with one VCO stands still unless the LFO moves the pulse width
    const pad = setPart({ ...s, osc2: 'off' }, 'pad');
    assert.equal(judgeSection(pad, 'osc').grade, 'partly');
    const pw = setPwm(setWidth(pad, 20), 'lfo');
    assert.equal(judgeSection(pw, 'osc').grade, 'good');
    assert.match(judgeSection(pw, 'osc').why, /width moving/);
    assert.equal(judgeSection(pw, 'lfo').grade, 'good');
    assert.match(judgeSection(pw, 'lfo').why, /very rare/);
    // a sub under the bass is the 2024 report's easy credit
    assert.match(judgeSection(setSub(s, 60), 'osc').why, /sub/);
});

test('the spectrum is the sources\' series through the filter: a detuned pair draws two lines a few cents apart, a sub sits an octave below, a saw fills the even harmonics in, noise is a floor', () => {
    const s = { ...applyPreset(DEFAULT_STATE, 'as2023'), detune: 20 };
    const lines = spectrum(s, 100);
    const firsts = lines.filter((l) => l.hz < 105 && l.hz > 95);
    assert.equal(firsts.length, 2);
    assert.ok(firsts[1].hz > firsts[0].hz);
    near(1200 * Math.log2(firsts[1].hz / firsts[0].hz), 20, 0.01);
    assert.equal(lines.filter((l) => l.hz > 195 && l.hz < 205).length, 0, 'a square has no even harmonics');
    const high = lines.find((l) => l.hz > 3500);
    assert.ok(high.out < high.amp * 0.1, `${high.out} vs ${high.amp}`);
    const sub = spectrum({ ...s, sub: 70, detune: 0, osc2: 'off' }, 100);
    assert.ok(sub.some((l) => Math.abs(l.hz - 50) < 0.01 && l.src === 'sub'));
    const withSaw = spectrum({ ...s, saw: 100, detune: 0, osc2: 'off' }, 100);
    const second = withSaw.find((l) => Math.abs(l.hz - 200) < 0.01);
    assert.ok(second && second.src === 'saw', 'the saw puts the second harmonic in');
    const narrow = spectrum({ ...s, width: 25, detune: 0, osc2: 'off' }, 100);
    assert.ok(narrow.some((l) => Math.abs(l.hz - 200) < 0.01 && l.src === 'pulse'), 'a narrow pulse has even harmonics');
    assert.equal(noiseLevel(s), 0);
    assert.ok(noiseLevel({ ...s, noise: 100 }) > 0.05);
});

test('the wave shape is the same series summed: a filtered square is rounder than the raw one, the filter open leaves it square, PWM changes it by frame', () => {
    const s = { ...applyPreset(DEFAULT_STATE, 'as2023'), osc2: 'off', cutoff: 300 };
    const { raw, out } = waveShape(s);
    assert.equal(raw.length, 256);
    const rough = (a) => { let r = 0; for (let i = 2; i < a.length; i += 1) r += Math.abs(a[i] - 2 * a[i - 1] + a[i - 2]); return r; };
    assert.ok(rough(raw) > rough(out) * 3, `raw ${rough(raw).toFixed(2)}, filtered ${rough(out).toFixed(2)}`);
    const open = waveShape(rawOf(s));
    let diff = 0;
    for (let i = 0; i < 256; i += 1) diff += Math.abs(open.raw[i] - open.out[i]);
    near(diff, 0, 1e-6);
    const a = waveShape(s, { width: 0.5 }).raw; const b = waveShape(s, { width: 0.2 }).raw;
    let d2 = 0; for (let i = 0; i < 256; i += 1) d2 += Math.abs(a[i] - b[i]);
    assert.ok(d2 > 10, 'a narrower pulse is a different shape');
    const noisy = waveShape({ ...s, noise: 100 }).raw;
    assert.ok(rough(noisy) > rough(raw), 'noise roughens the wave');
});

test('one note in time: the gate is the part\'s note length, the amplifier follows the envelope (or the gate), the cutoff lifts by the Env amount and wobbles with the LFO', () => {
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
    const iQuarter = Math.round(50 / wob.stepMs);
    near(wob.cutoff[iQuarter], 700 * 2, 1e-3);
    const trem = timeline({ ...s, envAmt: 0, lfoTarget: 'amp', lfoRate: 5, lfoDepth: 100 });
    const iTrough = Math.round(150 / trem.stepMs);
    near(trem.amp[iTrough], 0, 1e-3);
    // the VCA on Gate: the amplifier is a switch while the envelope still asks
    const g = timeline({ ...s, vca: 'gate', attack: 200 });
    const iEarly = Math.round(4 / g.stepMs);
    near(g.amp[iEarly], 1, 1e-6);
    assert.ok(g.env[iEarly] < 0.05);
    const iAfter = Math.round((g.gateMs + 10) / g.stepMs);
    near(g.amp[iAfter], 0, 1e-6);
    // PWM keeps the LFO lane alive at zero depth
    const pw = timeline({ ...s, lfoDepth: 0, pwm: 'lfo', width: 20, lfoRate: 5 });
    assert.ok(Math.max(...pw.lfo) > 0.9);
});

test('the dot on the harmonics screen is the cutoff and the resonance; hold plays the sources raw', () => {
    const s = dragDot(DEFAULT_STATE, 2000, 10.5);
    assert.equal(s.cutoff, 2000);
    assert.equal(s.res, 50);
    const r = rawOf({ ...s, pwm: 'lfo', width: 20, vca: 'gate' });
    assert.equal(r.bypass, true);
    assert.equal(r.lfoDepth, 0);
    assert.equal(r.sustain, 100);
    assert.equal(r.pwm, 'man');
    assert.equal(r.vca, 'env');
});

test('readings: the home note carries the range, and the words for the sources, brightness and envelope follow the settings', () => {
    const s = applyPreset(DEFAULT_STATE, 'as2023');
    assert.equal(readings(s).note, 'A1');
    assert.equal(readings(setOctave(s, 1)).note, 'A2');
    assert.equal(homeMidi(setOctave(s, -1)), 21);
    assert.equal(readings(s).brightness, 'warm');
    assert.equal(readings(setCutoff(s, 5000)).brightness, 'open');
    assert.equal(readings(s).envelope, 'held');
    assert.equal(readings(setAttack(s, 600)).envelope, 'swelling');
    assert.equal(readings(setVca(s, 'gate')).envelope, 'gated');
    assert.equal(readings(s).sources, 'square');
    assert.equal(readings(setSub(s, 40)).sourceCount, 2);
    assert.equal(readings(applyPreset(s, 'judgeBass')).job, 'a synth bass');
    assert.equal(setPart(applyPreset(s, 'judgeBass'), 'pad').presetId, 'judgeBass');
    assert.equal(setPart(s, 'pad').presetId, null);
    assert.equal(schemePoints({ ...s, task: null }).length, 0);
    assert.equal(setSubOct(s, 3), s);
    assert.equal(setVca(s, 'off'), s);
    assert.equal(setWidth(s, 80).width, 50);
});

test('coarse tuning: Osc 2 at a fifth sits seven semitones up, draws its own lines, and the judge calls it thick, not a bass', () => {
    near(osc2Ratio({ osc2: 'fifth' }), 2 ** (7 / 12));
    near(osc2Ratio({ osc2: 'pair' }), 1);
    near(osc2Ratio({ osc2: 'off' }), 1);
    const s = setOsc2(applyPreset(DEFAULT_STATE, 'as2023'), 'fifth');
    const lines = spectrum(s, 100);
    assert.ok(lines.some((l) => Math.abs(l.hz - 100 * 2 ** (7 / 12)) < 0.01 && l.osc === 2));
    assert.equal(judgeSection(s, 'osc').grade, 'partly');
    assert.match(judgeSection(s, 'osc').why, /fifth/);
    assert.equal(judgeSection(setPart(s, 'pad'), 'osc').grade, 'good');
    assert.equal(verdict(s).missed[0].id, 'detune');
    assert.match(verdict(s).missed[0].said, /not a detuned pair/);
    assert.equal(setOsc2(s, 'sub'), s, 'the sub lives in the mixer now');
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

test('the wave slider has a shape, saw, tri or sine, in the words the schemes use; the triangle draws with its alternating series', () => {
    const s = applyPreset(DEFAULT_STATE, 'as2024'); // two saws
    assert.equal(waveOf(s), 'saw');
    const tri = setShape(s, 'tri');
    assert.equal(tri.presetId, null);
    assert.equal(tri.task, 'as2024');
    assert.equal(waveOf(tri), 'tri');
    assert.equal(sourceSaid(tri), 'a triangle wave');
    assert.equal(sourcesShort(tri), 'tri');
    assert.match(harmonicsSaid(tri), /^tri: odd harmonics, 1\/n²/);
    const sine = setShape(s, 'sine');
    assert.equal(sourceSaid(sine), 'a sine wave');
    assert.match(harmonicsSaid(sine), /the fundamental alone/);
    assert.equal(sourcesShort(setPulse(sine, 100)), 'square + sine');
    // the bars: a triangle's third harmonic is a ninth of its first; a sine is one line
    const triLines = spectrum({ ...tri, osc2: 'off' });
    near(triLines[1].amp / triLines[0].amp, 1 / 9, 1e-9);
    near(triLines[1].hz / triLines[0].hz, 3, 1e-9);
    assert.equal(spectrum({ ...sine, osc2: 'off' }).length, 1);
    // the drawn triangle alternates in sign; the bars only need the size
    assert.ok(triCoef(3) < 0 && triCoef(5) > 0 && triCoef(2) === 0);
    near(Math.abs(triCoef(3)), harmonicAmp('triangle', 3));
    near(shapeCoef('saw', 2), harmonicAmp('saw', 2));
    const shape = waveShape({ ...tri, osc2: 'off', bypass: true }, { n: 64 });
    // a triangle before the filter: its peak is a point, not the saw's cliff
    const raw = Array.from(shape.raw);
    const iMax = raw.indexOf(Math.max(...raw));
    near(raw[iMax - 1], raw[iMax + 1], 0.06);
    // the schemes: the 2024 keyboard wants saws; the 2025 lead allows a triangle and rules out a sine
    assert.equal(verdict(tri).ok, false);
    assert.match(verdict(tri).missed[0].said, /^a triangle wave, not the saw/);
    const lead = applyPreset(DEFAULT_STATE, 'a2025');
    const leadTri = setShape(setPulse(setSaw(lead, 100), 0), 'tri');
    assert.equal(verdict(leadTri).points[0].ok, true);
    const leadSine = setShape(leadTri, 'sine');
    assert.equal(verdict(leadSine).points[0].ok, false);
    assert.match(verdict(leadSine).points[0].said, /rules out/);
    // the judge: a sine leaves the filter nothing to do, whatever the part; a triangle bass is soft
    assert.equal(judgeSection({ ...leadSine, task: null }, 'osc').grade, 'partly');
    assert.match(judgeSection({ ...leadSine, task: null }, 'osc').why, /nothing to take away/);
    assert.equal(judgeSection(setShape(applyPreset(DEFAULT_STATE, 'bass'), 'tri'), 'osc').grade, 'partly');
    assert.equal(judgeSection(setShape(applyPreset(DEFAULT_STATE, 'pad'), 'tri'), 'osc').grade, 'good');
    // the graph's gain for the shape is the model's
    assert.equal(waveGain(tri), SOURCE_GAIN.tri);
    assert.equal(waveGain(s), SOURCE_GAIN.saw);
    assert.equal(SHAPES.tri.node, 'triangle');
});

test('Core presets are the four sounds, each suiting its part in every section; the papers and the Judge patches are the A-level and Extension presets', () => {
    assert.deepEqual(presetsFor('core').map((p) => p.id), ['bass', 'pad', 'stab', 'lead']);
    assert.deepEqual(presetsFor('alevel').map((p) => p.id), ['as2023', 'as2024', 'a2025', 'fills2023', 'judgeBass', 'judgePad']);
    assert.deepEqual(presetsFor('extension'), presetsFor('alevel'));
    assert.equal(DEFAULT_STATE.presetId, 'bass');
    assert.equal(DEFAULT_STATE.task, null);
    for (const p of presetsFor('core')) {
        const st = applyPreset(DEFAULT_STATE, p.id);
        assert.equal(st.task, null);
        assert.equal(verdict(st).key, 'free');
        for (const [id, v] of Object.entries(judgeAll(st))) assert.equal(v.grade, 'good', `${p.id} ${id}: ${v.why}`);
    }
    // a pad and a stab: chords both, opposite envelopes
    const pad = applyPreset(DEFAULT_STATE, 'pad'); const stab = applyPreset(DEFAULT_STATE, 'stab');
    assert.ok(pad.attack >= 500 && pad.release >= 1000 && pad.sustain >= 80);
    assert.ok(stab.attack <= 5 && stab.sustain === 0 && stab.release <= 200);
    assert.equal(PARTS[pad.part].notes.filter((e) => e.s === 0).length, 4);
    assert.equal(PARTS[stab.part].notes.filter((e) => e.s === 0).length, 3);
    // the bass sound is the 2023 paper's move: a detuned pair, so Detune to zero collapses it
    assert.equal(DEFAULT_STATE.osc2, 'pair');
    assert.ok(DEFAULT_STATE.detune > 0 && DEFAULT_STATE.sub > 0);
});
