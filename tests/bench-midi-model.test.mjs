import test from 'node:test';
import assert from 'node:assert/strict';
import {
    DEFAULT_STATE, PRESETS, TASKS, GM_MAP, DRUM_NOTES, BEATS, BEND_MIN, BEND_CENTRE,
    positionOf, fmtPos, noteName, toBinary, noteOnBytes, noteOffBytes, bendBytes, bendFromBytes, bendUnsigned, bits8,
    placedTime, placed, smallestValue, tripletBars, stacked, displaced, looseness, feelWord,
    mapFaults, assign, bendAt, bendSemitones, bendExtent, intervalWord,
    eventList, otherMessages, velocityTable, applyPreset, referenceOf,
    setPart, setGrid, setStrength, setRange, moveNote, addNote, removeNote, setVelocity, setLength, resetPart, clearBar,
    drawCheck, verdict, readings, selectedNote,
} from '../lib/bench/midi-model.js';

const near = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol, `${a} not within ${tol} of ${b}`);

test('a position reads as bar, beat, division, tick at 960 to the quarter', () => {
    assert.deepEqual(positionOf(0), { bar: 1, beat: 1, div: 1, tick: 0 });
    assert.deepEqual(positionOf(4), { bar: 2, beat: 1, div: 1, tick: 0 });
    assert.deepEqual(positionOf(5.25), { bar: 2, beat: 2, div: 2, tick: 0 });
    assert.equal(fmtPos(13 + 161 / 960), '4 2 1 161');
    assert.equal(noteName(36), 'C1');
    assert.equal(noteName(60), 'C3');
    assert.equal(noteName(33), 'A0');
});

test('velocity in binary is seven bits, as the schemes print it', () => {
    assert.equal(toBinary(113), '1110001');
    assert.equal(toBinary(65), '1000001');
    assert.equal(toBinary(98), '1100010');
    assert.equal(toBinary(22), '0010110');
    assert.equal(toBinary(103), '1100111');
    assert.equal(toBinary(126), '1111110');
    assert.equal(toBinary(97), '1100001');
    assert.equal(toBinary(23), '0010111');
    assert.equal(toBinary(127), '1111111');
});

test('the wire: a status byte starts with 1, a data byte with 0, the bend is two data bytes', () => {
    const on = noteOnBytes(10, 36, 112);
    assert.deepEqual(on, [0x99, 36, 112]);
    assert.equal(bits8(on[0])[0], '1');
    assert.equal(bits8(on[1])[0], '0');
    assert.equal(bits8(on[2])[0], '0');
    assert.deepEqual(noteOffBytes(1, 45), [0x80, 45, 64]);
    assert.deepEqual(bendBytes(1, 0), [0xe0, 0x00, 0x40]);
    assert.deepEqual(bendBytes(1, BEND_MIN), [0xe0, 0, 0]);
    assert.deepEqual(bendBytes(1, 8191), [0xe0, 0x7f, 0x7f]);
    assert.equal(bendFromBytes(0x7f, 0x7f), 8191);
    assert.equal(bendFromBytes(0, 0), BEND_MIN);
    assert.equal(bendUnsigned(0), BEND_CENTRE);
    assert.equal(bendUnsigned(8191), 16383);
    // 2024 Q1(b)(iii): 16383 as two data bytes
    assert.equal(`${bits8(0x7f).slice(1)} ${bits8(0x7f).slice(1)}`, '1111111 1111111');
});

test('quantise moves a note toward the grid by its strength', () => {
    near(placedTime(4.1, '16', 100), 4);
    near(placedTime(4.1, '16', 50), 4.05);
    near(placedTime(4.1, 'off', 100), 4.1);
    near(placedTime(4.1, '16', 0), 4.1);
    near(placedTime(4.3, '12', 100), 4 + 1 / 3);
    near(placedTime(4.3, '8', 100), 4.5);
});

test('the smallest note value present is the coarsest grid every onset sits on', () => {
    assert.equal(smallestValue(DEFAULT_STATE.notes.drums), '16');
    assert.equal(smallestValue(applyPreset(DEFAULT_STATE, 'roll').notes.drums), '32');
    assert.equal(smallestValue(applyPreset(DEFAULT_STATE, 'played').notes.drums), null);
    assert.equal(smallestValue(DEFAULT_STATE.notes.bass), '8');
    const trip = applyPreset(DEFAULT_STATE, 'triplets');
    assert.equal(smallestValue(trip.notes.bass), '12');
    assert.deepEqual(tripletBars(trip.notes.bass), [2]);
});

test('quantising the roll to 1/16 stacks hits; 1/32 leaves it whole', () => {
    const roll = applyPreset(DEFAULT_STATE, 'roll');
    assert.equal(stacked(roll), 0);
    const hard = setStrength(setGrid(roll, '16'), 100);
    assert.ok(stacked(hard) >= 8, `stacked ${stacked(hard)}`);
    assert.equal(stacked(setGrid(roll, '32')), 0);
    const trip = setGrid(applyPreset(DEFAULT_STATE, 'triplets'), '16');
    assert.equal(displaced(trip, 'bass', 2), 8, 'the middle and last notes of each three move on the sixteenth grid');
    assert.equal(displaced(trip, 'bass', 1), 0, 'the quarters stay');
    assert.equal(verdict(trip).key, 'broken');
    assert.equal(displaced(setGrid(trip, '12')), 0);
    assert.equal(verdict(setGrid(trip, '12')).key, 'triplets');
});

test('the played take is loose, and quantise tightens it in words', () => {
    const played = applyPreset(DEFAULT_STATE, 'played');
    assert.ok(looseness(played.notes.drums) > 8, `looseness ${looseness(played.notes.drums)} ms`);
    assert.equal(feelWord(played).key, 'loose');
    assert.equal(feelWord(setStrength(played, 100)).key, 'hard');
    assert.equal(feelWord(setStrength(played, 50)).key, 'percent');
    assert.equal(feelWord(DEFAULT_STATE).key, 'hard');
});

test('the wrong-sounds preset scrambles every lane and assign fixes one at a time', () => {
    const wrong = applyPreset(DEFAULT_STATE, 'wrong');
    assert.equal(mapFaults(wrong).length, DRUM_NOTES.length - 1, 'one lane happens to be right');
    assert.equal(verdict(wrong).key, 'wrong-sounds');
    let s = wrong;
    for (const note of DRUM_NOTES) s = assign(s, note, GM_MAP[note]);
    assert.equal(mapFaults(s).length, 0);
    assert.equal(verdict(s).key, 'directed');
    assert.deepEqual(s.notes.drums, wrong.notes.drums, 'the rhythm is untouched');
});

test('the bend lane falls to full downward and back; the range decides the interval', () => {
    const bend = applyPreset(DEFAULT_STATE, 'bend');
    assert.equal(bend.bendRange, 2);
    assert.equal(verdict(bend).key, 'range-2');
    near(bendAt(bend.bends, 0), 0);
    near(bendAt(bend.bends, 15), BEND_MIN);
    near(bendAt(bend.bends, 14), BEND_MIN / 2);
    assert.equal(bendExtent(bend.bends).lo, BEND_MIN);
    near(bendSemitones(BEND_MIN, 12), -12);
    near(bendSemitones(BEND_MIN, 2), -2);
    assert.equal(intervalWord(bendSemitones(BEND_MIN, 2)), 'a tone');
    assert.equal(intervalWord(bendSemitones(BEND_MIN, 7)), 'a fifth');
    assert.equal(intervalWord(bendSemitones(BEND_MIN, 12)), 'an octave');
    assert.equal(intervalWord(bendSemitones(BEND_MIN, 24)), 'two octaves');
    assert.equal(verdict(setRange(bend, 12)).key, 'directed');
    assert.equal(referenceOf(bend).bendRange, 12);
});

test('the list editor carries the other messages the 2019 scheme names', () => {
    const names = otherMessages(DEFAULT_STATE);
    for (const n of ['Tempo', 'Time signature', 'Key', 'Track name', 'Instrument name', 'End of track']) assert.ok(names.includes(n), n);
    assert.ok(!names.includes('Pitch bend'), 'the drums carry no bend');
    const bass = setPart(DEFAULT_STATE, 'bass');
    assert.ok(otherMessages(bass).includes('Pitch bend'));
    const rows = eventList(bass);
    assert.equal(rows[0].kind, 'meta');
    assert.ok(rows.some((r) => r.kind === 'bend'));
    assert.equal(rows[rows.length - 1].name, 'End of track');
    const ons = rows.filter((r) => r.kind === 'on');
    for (let i = 1; i < ons.length; i += 1) assert.ok(ons[i].t >= ons[i - 1].t, 'sorted by time');
});

test('the velocity table for bar 2 has an accent and a ghost note, and every value is 1 to 127', () => {
    const t = velocityTable(placed(DEFAULT_STATE), 2);
    assert.equal(t.bar, 2);
    assert.ok(t.hi.vel > t.lo.vel);
    assert.ok(t.hi.vel >= 100 && t.lo.vel <= 70, `${t.hi.vel} / ${t.lo.vel}`);
    for (const part of ['drums', 'bass']) for (const n of DEFAULT_STATE.notes[part]) assert.ok(n.vel >= 1 && n.vel <= 127 && n.t >= 0 && n.t < BEATS);
});

test('each preset lands on its task and its verdict', () => {
    const want = { velocity: 'table', wrong: 'wrong-sounds', roll: 'directed', played: 'loose', triplets: 'triplets', bend: 'range-2', draw: 'empty' };
    for (const p of PRESETS) {
        const st = applyPreset(DEFAULT_STATE, p.id);
        assert.equal(st.task, p.task, p.id);
        assert.equal(st.part, TASKS[p.task].part, p.id);
        assert.equal(verdict(st).key, want[p.id], p.id);
        assert.ok(st.selected != null, `${p.id} selects a note`);
    }
});

test('the drawn bar is marked for rhythm and pitch separately', () => {
    const draw = applyPreset(DEFAULT_STATE, 'draw');
    assert.equal(draw.notes.bass.filter((n) => n.t >= 4 && n.t < 8).length, 0);
    let s = draw;
    const target = referenceOf(draw).notes.bass.filter((n) => n.t >= 4 && n.t < 8);
    for (const n of target) s = addNote(s, n.t, n.note).state;
    const d = drawCheck(s);
    assert.ok(d.rhythm && d.pitch, JSON.stringify(d));
    assert.equal(verdict(s).key, 'directed');
    // one pitch wrong: rhythm still right
    const wrongPitch = moveNote(s, s.notes.bass[s.notes.bass.length - 1].id, target[target.length - 1].t, target[target.length - 1].note + 2);
    const d2 = drawCheck(wrongPitch);
    assert.ok(d2.rhythm && !d2.pitch);
    // an extra note: neither
    const extra = addNote(s, 4.25, 33).state;
    const d3 = drawCheck(extra);
    assert.ok(!d3.rhythm && !d3.pitch);
});

test('edits: move snaps to the grid, a drum note lands on a lane, remove and velocity behave', () => {
    const s = DEFAULT_STATE;
    const sel = selectedNote(s);
    assert.ok(sel);
    const moved = moveNote(setGrid(s, '16'), sel.id, 1.1, 40);
    const m = moved.notes.drums.find((n) => n.id === sel.id);
    near(m.t, 1);
    assert.ok(DRUM_NOTES.includes(m.note));
    const free = moveNote(s, sel.id, 1.1, 36);
    near(free.notes.drums.find((n) => n.id === sel.id).t, 1.09375);
    const bass = setPart(s, 'bass');
    const b = selectedNote(bass);
    const up = moveNote(bass, b.id, b.t, 99);
    assert.equal(up.notes.bass.find((n) => n.id === b.id).note, 47);
    const gone = removeNote(s, sel.id);
    assert.equal(gone.notes.drums.length, s.notes.drums.length - 1);
    assert.equal(gone.selected, null);
    assert.equal(setVelocity(s, sel.id, 200).notes.drums.find((n) => n.id === sel.id).vel, 127);
    assert.equal(setVelocity(s, sel.id, 0).notes.drums.find((n) => n.id === sel.id).vel, 1);
    near(setLength(bass, b.id, 0.9).notes.bass.find((n) => n.id === b.id).len, 0.90625);
    const cleared = clearBar(s, 2);
    assert.ok(cleared.notes.drums.every((n) => n.t < 4 || n.t >= 8));
    assert.equal(resetPart(cleared).notes.drums.length, s.notes.drums.length);
});

test('readings gather what the console shows', () => {
    const r = readings(applyPreset(DEFAULT_STATE, 'bend'));
    assert.equal(r.bend.lo, BEND_MIN);
    assert.equal(r.faults.length, 0);
    assert.ok(r.sel);
    const w = readings(applyPreset(DEFAULT_STATE, 'wrong'));
    assert.ok(w.faults.length > 0);
    assert.equal(w.smallest, '16');
});
