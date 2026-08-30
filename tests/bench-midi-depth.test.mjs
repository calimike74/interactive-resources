import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATE, PRESETS, GM_MAP, DRUM_NOTES, applyPreset, assign, setGrid, setStrength, setRange, setPart, setLane, select, removeNote, addNote, referenceOf } from '../lib/bench/midi-model.js';
import { DEPTH_LINES, DEPTH_TEACH, hearingLine, nextMove, judge, open } from '../lib/bench/midi-depth.js';

const noDash = (s) => assert.ok(!/—/.test(s) && !/\butilise/i.test(s), `house style: ${s.slice(0, 60)}`);

test('every preset judges in two segments, AO3 then AO4, short enough for the bar', () => {
    for (const p of PRESETS) {
        const st = applyPreset(DEFAULT_STATE, p.id);
        const segs = judge({ state: st, last: 'preset' });
        assert.equal(segs.length, 2, p.id);
        assert.deepEqual(segs.map((s) => s.ao), [3, 4]);
        const len = segs[0].text.length + segs[1].text.length + DEPTH_TEACH.alevel.length;
        assert.ok(len < 640, `${p.id} runs to ${len} characters`);
        segs.forEach((s) => noDash(s.text));
    }
});

test('the faulty presets say so and quote a year; fixed, they say as directed', () => {
    const wrong = applyPreset(DEFAULT_STATE, 'wrong');
    assert.match(judge({ state: wrong, last: 'preset' })[1].text, /^Not yet/);
    assert.match(judge({ state: wrong, last: 'preset' })[1].text, /\(2019\)/);
    let fixed = wrong;
    for (const note of DRUM_NOTES) fixed = assign(fixed, note, GM_MAP[note]);
    assert.match(judge({ state: fixed, last: 'sound' })[1].text, /^As directed/);
    const bend = applyPreset(DEFAULT_STATE, 'bend');
    assert.match(judge({ state: bend, last: 'preset' })[1].text, /^Not as directed/);
    assert.match(judge({ state: bend, last: 'preset' })[0].text, /a tone/);
    assert.match(judge({ state: setRange(bend, 12), last: 'range' })[1].text, /^As directed/);
    const roll = setStrength(setGrid(applyPreset(DEFAULT_STATE, 'roll'), '16'), 100);
    assert.match(judge({ state: roll, last: 'grid' })[1].text, /^Not as directed: the most appropriate value is 1\/32/);
    const trip = setGrid(applyPreset(DEFAULT_STATE, 'triplets'), '16');
    assert.match(judge({ state: trip, last: 'grid' })[0].text, /pushed onto sixteenths/);
});

test('the velocity table reads the loaded file in decimal and binary', () => {
    const segs = judge({ state: DEFAULT_STATE, last: 'preset' });
    assert.match(segs[0].text, /highest velocity in bar 2 is \d+, in binary [01]{7}/);
    assert.match(segs[1].text, /2\^7/);
});

test('the drawn bar is judged as it fills', () => {
    const draw = applyPreset(DEFAULT_STATE, 'draw');
    assert.match(judge({ state: draw, last: 'preset' })[0].text, /bar 2 is empty/);
    let s = draw;
    for (const n of referenceOf(draw).notes.bass.filter((x) => x.t >= 4 && x.t < 8)) s = addNote(s, n.t, n.note).state;
    assert.match(judge({ state: s, last: 'note' })[1].text, /^As directed/);
    const partial = addNote(draw, 4, 33).state;
    assert.match(judge({ state: partial, last: 'note' })[1].text, /^Not yet/);
});

test('the Core line names the part, the kit and the feel, and the next move is a real instruction', () => {
    const line = hearingLine(DEFAULT_STATE);
    assert.match(line, /^You are hearing the drum file on an acoustic kit/);
    assert.match(line, /loudest hit is \d+/);
    assert.match(hearingLine(applyPreset(DEFAULT_STATE, 'wrong')), /on the wrong sound/);
    assert.match(hearingLine(applyPreset(DEFAULT_STATE, 'bend')), /falls a tone/);
    assert.match(hearingLine(applyPreset(DEFAULT_STATE, 'triplets')), /eighth-note triplets/);
    for (const p of PRESETS) { const m = nextMove(applyPreset(DEFAULT_STATE, p.id)); assert.ok(m.length > 20, p.id); noDash(m); }
    noDash(hearingLine(DEFAULT_STATE));
    let empty = DEFAULT_STATE;
    for (const n of DEFAULT_STATE.notes.drums) empty = removeNote(empty, n.id);
    assert.match(hearingLine(empty), /empty roll/);
});

test('Extension opens the wire in its own words, with no AO tags', () => {
    const line = open({ state: DEFAULT_STATE, last: 'preset' });
    assert.match(line, /three bytes/);
    assert.match(line, /1 for a status byte, 0 for data/);
    assert.ok(!/AO[34]/.test(line));
    assert.ok(line.length > 60 && line.length < 520, `${line.length} characters`);
    const bend = setLane(setPart(DEFAULT_STATE, 'bass'), 'bend');
    const bl = open({ state: bend, last: 'lane' });
    assert.match(bl, /14 together/);
    assert.match(bl, /8192/);
    noDash(line); noDash(bl);
    const none = open({ state: select(DEFAULT_STATE, null), last: 'preset' });
    assert.match(none, /^Nothing selected/);
});

test('the depth lines announce a job each, in the house style', () => {
    for (const k of ['core', 'alevel', 'extension']) { assert.ok(DEPTH_LINES[k].length > 100); noDash(DEPTH_LINES[k]); }
    noDash(DEPTH_TEACH.alevel); noDash(DEPTH_TEACH.extension);
});
