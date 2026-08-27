import test from 'node:test';
import assert from 'node:assert/strict';
import { DEPTH_LINES, timeZone, clearsAt, nearestNote, judge, open, derive } from '../lib/bench/delay-depth.js';
import { PRESETS, applyPreset, DEFAULT_STATE, delayTimeSec } from '../lib/bench/delay-model.js';

// 27 Aug 2026: the three levels are three jobs, not three lengths. Core
// shows, A-level judges the way the paper does, Extension opens the machine.

const paper = applyPreset(DEFAULT_STATE, 'paper2023');
const CONTROLS = ['time', 'sync', 'bpm', 'feedback', 'mix', 'highCut', 'stereo', 'source', 'preset'];

test('every level says what it does', () => {
    for (const id of ['core', 'alevel', 'extension']) assert.ok(DEPTH_LINES[id].length > 40, id);
});

test('the 2023 paper preset is the paper: a quaver at 120 BPM, feedback high, behind the dry, two sides, on the vocal', () => {
    assert.equal(paper.bpm, 120);
    assert.equal(Math.round(delayTimeSec(paper) * 1000), 250);
    assert.equal(paper.feedback, 80);
    assert.equal(paper.mix, 25);
    assert.equal(paper.stereo, 'pingpong');
    assert.equal(paper.source, 'vocal');
    assert.ok(derive(paper).hz > 3000 && derive(paper).hz < 4000, 'high cut near 3.5 kHz');
    assert.ok(PRESETS.some((p) => p.id === 'paper2023' && p.name === '2023 paper'));
});

test('a delay time has a zone: fused, slapback, echo', () => {
    assert.equal(timeZone(0.02).id, 'fused');
    assert.equal(timeZone(0.08).id, 'slapback');
    assert.equal(timeZone(0.25).id, 'echo');
});

test('the feedback that clears the bar depends on the delay time', () => {
    const bar = 2; // 120 BPM
    assert.ok(clearsAt(0.25, bar) >= 40, 'a quaver at 120 clears at 40% or more');
    assert.ok(clearsAt(0.5, bar) < clearsAt(0.25, bar), 'a crotchet needs less feedback to clear');
    assert.ok(clearsAt(2, bar) <= 5);
});

test('a free time is judged against the nearest exam note value', () => {
    assert.equal(nearestNote(0.26, 120).id, 'eighth');
    assert.equal(nearestNote(0.5, 120).id, 'quarter');
});

test('A-level judges every control in the paper\'s order: name (AO3) then verdict (AO4)', () => {
    for (const last of CONTROLS) {
        const segs = judge({ state: paper, last, part: 'the vocal' });
        assert.ok(segs.length >= 1, last);
        assert.ok(segs.every((s) => s.ao === 3 || s.ao === 4), last);
        assert.equal(segs[segs.length - 1].ao, 4, `${last} ends on a verdict`);
        assert.ok(segs.map((s) => s.text).join(' ').length > 60, last);
    }
});

test('A-level judges the 2023 paper the way the examiner did', () => {
    const fb = judge({ state: paper, last: 'feedback', part: 'the vocal' }).map((s) => s.text).join(' ');
    assert.match(fb, /longer than a bar/);
    assert.match(fb, /too high/);
    const sync = judge({ state: paper, last: 'sync', part: 'the vocal' }).map((s) => s.text).join(' ');
    assert.match(sync, /250 ms/);
    assert.match(sync, /quaver/);
    const st = judge({ state: paper, last: 'stereo', part: 'the vocal' }).map((s) => s.text).join(' ');
    assert.match(st, /not a mistake/);
    const mix = judge({ state: paper, last: 'mix', part: 'the vocal' }).map((s) => s.text).join(' ');
    assert.match(mix, /behind the vocal/);
});

test('A-level changes its verdict when the setting is fixed', () => {
    const fixed = { ...paper, feedback: 30, presetId: null };
    const fb = judge({ state: fixed, last: 'feedback', part: 'the vocal' }).map((s) => s.text).join(' ');
    assert.match(fb, /clear inside the bar/);
    assert.doesNotMatch(fb, /too high/);
    const loud = { ...paper, mix: 70 };
    assert.match(judge({ state: loud, last: 'mix', part: 'the vocal' }).map((s) => s.text).join(' '), /louder than the vocal/);
});

test('Extension opens the machine for every control, in its own words, never with a mark', () => {
    for (const last of CONTROLS) {
        const text = open({ state: paper, last, part: 'the vocal' });
        assert.ok(text.length > 80, last);
        assert.doesNotMatch(text, /AO[34]/, last);
        const judged = judge({ state: paper, last, part: 'the vocal' }).map((s) => s.text).join(' ');
        assert.notEqual(text, judged, last);
    }
    assert.match(open({ state: paper, last: 'highCut' }), /n times/);
    assert.match(open({ state: paper, last: 'stereo' }), /crossed/);
    assert.match(open({ state: { ...paper, sync: false, timeMs: 25 }, last: 'time' }), /fold/);
});

test('no em-dashes and no banned words in any line', () => {
    const all = [];
    for (const last of CONTROLS) {
        all.push(open({ state: paper, last, part: 'the vocal' }));
        all.push(...judge({ state: paper, last, part: 'the vocal' }).map((s) => s.text));
        all.push(...judge({ state: DEFAULT_STATE, last, part: 'the drums' }).map((s) => s.text));
    }
    all.push(...Object.values(DEPTH_LINES));
    for (const t of all) {
        assert.doesNotMatch(t, /—/, t);
        assert.doesNotMatch(t, /utilis/i, t);
    }
});
