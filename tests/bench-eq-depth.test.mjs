import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATE, setBells, setBand, applyPreset } from '../lib/bench/eq-model.js';
import { judge, open, hearingLine, nextMove } from '../lib/bench/eq-depth.js';

// The EQ bench's three jobs, where more than one bell is in.

test('the hearing line names every bell that is doing something, in order', () => {
    let s = setBells(DEFAULT_STATE, 2);
    s = setBand(s, 'mid', { hz: 350, gain: -4, q: 1.5 });
    s = setBand(s, 'mid2', { hz: 3000, gain: 3, q: 1 });
    const line = hearingLine(s, 'the vocal');
    assert.match(line, /−4 dB bell at 350 Hz/);
    assert.match(line, /\+3 dB bell at 3 kHz/);
    assert.ok(line.indexOf('350 Hz') < line.indexOf('3 kHz'));
});

test('A-level judges the second bell on its own terms', () => {
    let s = setBells(DEFAULT_STATE, 2);
    s = { ...s, source: 'vocal' };
    s = setBand(s, 'mid2', { hz: 3000, gain: 3, q: 1 });
    const segs = judge({ state: s, last: 'gain', part: 'the vocal' });
    assert.equal(segs[0].ao, 3);
    assert.match(segs[0].text, /Second parametric band \+3 dB at 3 kHz/);
    assert.equal(segs[1].ao, 4);
    assert.match(segs[1].text, /Presence/);
});

test('choosing a number of bells is judged and opened', () => {
    const s = setBells(DEFAULT_STATE, 2);
    const segs = judge({ state: s, last: 'bells', part: 'the drums' });
    assert.equal(segs.length, 2);
    assert.match(segs[0].text, /Two bells/);
    assert.match(segs[1].text, /boost .* cut|cut .* boost/i);
    assert.match(open({ state: s, last: 'bells' }), /add/i);
});

test('the Cut and boost preset is judged as the pair it is', () => {
    const s = applyPreset(DEFAULT_STATE, 'cutboost');
    const segs = judge({ state: s, last: 'preset', part: 'the vocal' });
    assert.match(segs[0].text, /Cut and boost/);
    assert.match(segs[0].text, /350 Hz/);
    assert.match(segs[0].text, /3 kHz/);
    assert.match(open({ state: s, last: 'preset' }), /sum|add/i);
});

test('Core sends the student to a second bell once the first is a cut', () => {
    let s = setBand(DEFAULT_STATE, 'hpf', { on: true });
    s = setBand(s, 'mid', { gain: -4 });
    assert.match(nextMove(s), /2 bells|second bell/i);
    const two = setBells(s, 2);
    assert.doesNotMatch(nextMove(two), /2 bells/i);
});
