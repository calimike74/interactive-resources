import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATE, applyPreset, setAttack, setLfoDepth, setLfoTarget, setFilter, setOctave, setVoices, setVca, setPwm, setWidth, setSub, setSaw, setOsc2, setShape, setPulse } from '../lib/bench/synth-model.js';
import { DEPTH_LINES, DEPTH_TEACH, hearingLine, oscSaid, nextMove, judge, open, sectionOfLast, homeNote } from '../lib/bench/synth-depth.js';

const noDash = (s) => assert.ok(!/—/.test(s) && !/\butilise/i.test(s), `house copy law broken: ${s}`);

test('each level announces its own job in its own words', () => {
    assert.match(DEPTH_LINES.core, /names what you hear/);
    assert.match(DEPTH_LINES.core, /Cutoff slider follows/);
    assert.match(DEPTH_LINES.alevel, /judges/);
    assert.match(DEPTH_LINES.extension, /opens the machine/);
    assert.notEqual(DEPTH_LINES.core, DEPTH_LINES.alevel);
    for (const l of Object.values(DEPTH_LINES)) noDash(l);
    for (const l of Object.values(DEPTH_TEACH)) noDash(l);
    assert.match(DEPTH_TEACH.extension, /control signal/);
});

test('Core names what is heard, in the mixer\'s words, and says what to try', () => {
    const s = applyPreset(DEFAULT_STATE, 'as2023');
    const line = hearingLine(s);
    assert.match(line, /^You are hearing the bass part on two square waves 12 cents apart/);
    assert.match(line, /low-pass filter at 700 Hz/);
    assert.match(line, /warm/);
    noDash(line);
    assert.equal(oscSaid(setSub(s, 50)), 'a square wave with a square sub-oscillator an octave down, doubled 12 cents apart');
    assert.equal(oscSaid(setOsc2(setSaw(s, 100), 'off')), 'a square wave and a saw wave');
    assert.equal(oscSaid(setOsc2(s, 'fifth')), 'two square waves a fifth apart');
    const gated = hearingLine(setVca(s, 'gate'));
    assert.match(gated, /VCA is on Gate/);
    assert.match(gated, /stops dead/);
    const pw = hearingLine(setPwm(setWidth({ ...s, presetId: null }, 20), 'lfo'));
    assert.match(pw, /moves the pulse width at 5\.0 Hz/);
    assert.match(nextMove(s), /Detune/);
    assert.match(nextMove({ ...s, presetId: null }), /raise Saw/);
    assert.match(nextMove({ ...s, presetId: null, saw: 100 }), /PW by LFO/);
    const withLfo = setLfoDepth(setLfoTarget({ ...s, presetId: null }, 'pitch'), 20);
    assert.match(hearingLine(withLfo), /vibrato at 5\.0 Hz/);
});

test('A-level judges a paper\'s task in the scheme\'s line with its year, AO3 then AO4, and says what is missing', () => {
    const s = applyPreset(DEFAULT_STATE, 'as2023');
    const segs = judge({ state: s, last: 'preset' });
    assert.equal(segs.length, 2);
    assert.equal(segs[0].ao, 3);
    assert.equal(segs[1].ao, 4);
    assert.match(segs[1].text, /^As directed: "Square wave \(1\)/);
    assert.match(segs[1].text, /2023 AS Q3\(a\)/);
    const up = setOctave(s, 1);
    const notYet = judge({ state: up, last: 'octave' });
    assert.match(notYet[1].text, /^Not yet: an octave too high/);
    assert.match(notYet[1].text, /one octave too high/);
    segs.concat(notYet).forEach((sg) => noDash(sg.text));
});

test('A-level judges a section for the job the way Q6 does, and offers the better setting', () => {
    const b = applyPreset(DEFAULT_STATE, 'judgeBass');
    const env = judge({ state: b, last: 'attack' });
    assert.match(env[0].text, /^ENV, the envelope: attack 600 ms/);
    assert.match(env[1].text, /^Does not suit a synth bass: a 600 ms attack/);
    assert.match(env[1].text, /Bring the attack under 20 ms/);
    assert.match(env[1].text, /fast attack and release/);
    const summary = judge({ state: b, last: 'preset' });
    assert.match(summary[0].text, /^A synth bass, judged by section/);
    assert.match(summary[1].text, /Envelope first/);
    assert.match(summary[1].text, /The 2024 report, on the bass question, credited answers written section by section, under subheadings; the 2019 pad question/);
    const osc = judge({ state: b, last: 'width' });
    assert.match(osc[0].text, /^VCO, the oscillator and mixer: a saw wave and a pulse wave, its width moved by the LFO, doubled 14 cents apart/);
    assert.match(osc[1].text, /very rare to see candidates that fully understood/);
    const hp = judge({ state: setFilter(b, 'hpf'), last: 'filter' });
    assert.match(hp[1].text, /removes the bass/);
    assert.match(hp[1].text, /Choose LPF/);
    const p = applyPreset(DEFAULT_STATE, 'judgePad');
    const voices = judge({ state: p, last: 'vca' });
    assert.match(voices[0].text, /^VCA, the amplifier and voices: the VCA on Gate/);
    assert.match(voices[1].text, /complete chords/);
    assert.match(voices[1].text, /Set the VCA to Env, and press Poly/);
    assert.match(voices[1].text, /noise gate designed to cut out background noise/);
    const fixed = judge({ state: setVca(setVoices(p, 'poly'), 'env'), last: 'voices' });
    assert.match(fixed[1].text, /^Suits a synth pad/);
    [env, summary, osc, hp, voices, fixed].flat().forEach((sg) => noDash(sg.text));
});

test('the LFO is judged as a control signal, with the 2024 report as evidence; PWM counts as the LFO at work', () => {
    const s = setLfoDepth(setLfoTarget({ ...applyPreset(DEFAULT_STATE, 'as2023'), task: null, presetId: null }, 'pitch'), 20);
    const segs = judge({ state: s, last: 'lfoDepth' });
    assert.match(segs[0].text, /^LFO, the LFO: a triangle wave at 5\.0 Hz on the pitch/);
    assert.match(segs[1].text, /vibrato/);
    assert.match(segs[1].text, /something audible rather than a control signal/);
    const pw = judge({ state: setPwm(setWidth({ ...applyPreset(DEFAULT_STATE, 'as2023'), task: null, presetId: null, lfoDepth: 0 }, 20), 'lfo'), last: 'lfoRate' });
    assert.match(pw[1].text, /did not appreciate that the pulse width was being modulated by the LFO/);
});

test('Extension opens the machine in its own sentence, with no AO tags, keyed to the section touched', () => {
    const s = applyPreset(DEFAULT_STATE, 'a2025');
    const all = open({ state: s, last: 'preset' });
    assert.match(all, /^The envelope is a control signal/);
    assert.match(all, /never heard; the amplifier obeys it/);
    assert.match(all, /too slow to hear/);
    assert.ok(!/AO[34]/.test(all));
    const lfo = open({ state: s, last: 'lfoRate' });
    assert.match(lfo, /^The LFO is a triangle wave at 4\.0 Hz/);
    const filt = open({ state: setAttack(applyPreset(DEFAULT_STATE, 'judgePad'), 2), last: 'cutoff' });
    assert.match(filt, /lifts the cutoff 1\.6 octaves/);
    assert.match(filt, /2019 report/);
    const gated = open({ state: applyPreset(DEFAULT_STATE, 'judgePad'), last: 'preset' });
    assert.match(gated, /the amplifier ignores it and follows the key alone/);
    const pw = open({ state: applyPreset(DEFAULT_STATE, 'judgeBass'), last: 'lfoRate' });
    assert.match(pw, /moves the pulse width between 25 % and 75 %/);
    [all, lfo, filt, gated, pw].forEach(noDash);
    assert.equal(sectionOfLast('stage'), 'filter');
    assert.equal(sectionOfLast('width'), 'osc');
    assert.equal(sectionOfLast('vca'), 'voices');
    assert.equal(sectionOfLast('part'), null);
    assert.equal(homeNote(s), 'A4 · 440 Hz');
});

test('the shape switch reads in every line: two triangle waves, a sine sent back to Saw, the sounds\' own next moves', () => {
    const keys = applyPreset(DEFAULT_STATE, 'as2024');
    assert.equal(oscSaid(setShape(keys, 'tri')), 'two triangle waves 7 cents apart');
    assert.equal(oscSaid(setOsc2(setShape(keys, 'sine'), 'off')), 'a sine wave');
    assert.match(hearingLine(setShape(keys, 'sine')), /on two sine waves 7 cents apart/);
    const bassSine = setShape(DEFAULT_STATE, 'sine');
    const segs = judge({ state: bassSine, last: 'shape' });
    assert.match(segs[0].text, /^VCO, the oscillator and mixer: a sine wave with a square sub-oscillator an octave down, doubled 10 cents apart/);
    assert.match(segs[1].text, /^Partly a synth bass: a sine wave with a square sub-oscillator an octave down: one harmonic/);
    assert.match(segs[1].text, /Press the slider's name to set the wave to Saw/);
    assert.equal(sectionOfLast('shape'), 'osc');
    assert.match(nextMove({ ...bassSine, presetId: null }), /set the wave back to Saw/);
    assert.match(nextMove(DEFAULT_STATE), /^slide Detune to zero/);
    assert.match(nextMove(applyPreset(DEFAULT_STATE, 'pad')), /become a stab/);
    assert.match(nextMove(applyPreset(DEFAULT_STATE, 'stab')), /Sustain/);
    assert.match(nextMove(applyPreset(DEFAULT_STATE, 'lead')), /Tri to Sine/);
    const suits = judge({ state: applyPreset(DEFAULT_STATE, 'pad'), last: 'preset' });
    assert.match(suits[0].text, /^A synth pad, judged by section: the oscillator and mixer, filter, envelope, LFO, amplifier and voices suit it\./);
    assert.match(suits[1].text, /^Every section suits a synth pad/);
    [segs, suits].flat().forEach((sg) => noDash(sg.text));
    assert.ok(!/—/.test(hearingLine(setPulse(setShape(keys, 'tri'), 30))));
});
