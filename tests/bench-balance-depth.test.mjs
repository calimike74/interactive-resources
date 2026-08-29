import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATE, PRESETS, applyPreset, setFader, setPan, setSend, referenceState } from '../lib/bench/balance-model.js';
import { DEPTH_LINES, DEPTH_TEACH, hearingLine, nextMove, judge, open } from '../lib/bench/balance-depth.js';

// Three jobs: Core shows, A-level judges with AO3 and AO4, Extension opens
// the machine in its own words.

const song = 'kites';

test('each level has its own line and the two teaching notes exist', () => {
    for (const k of ['core', 'alevel', 'extension']) assert.ok(DEPTH_LINES[k].length > 60);
    assert.ok(/AO3/.test(DEPTH_TEACH.alevel) && /AO4/.test(DEPTH_TEACH.alevel));
});

test('Core names what is heard on every preset and always has a next move', () => {
    for (const p of PRESETS) {
        const st = applyPreset(DEFAULT_STATE, p.id);
        assert.ok(hearingLine(st).startsWith('You are hearing'), p.id);
        assert.ok(nextMove(st).length > 10, p.id);
    }
});

test('the next move names the part furthest off, with a direction', () => {
    assert.match(nextMove(applyPreset(DEFAULT_STATE, 'drums')), /push the drums up/);
    assert.match(nextMove(applyPreset(DEFAULT_STATE, 'buried')), /push the vocal up/);
    assert.match(nextMove(setFader(referenceState(song), 'bass', -60)), /bring the bass back/);
    assert.match(nextMove(setSend(referenceState(song), 'vocal', 0.9)), /send down/);
    assert.match(nextMove(setPan(referenceState(song), 'bass', 0.8)), /back to the centre/);
});

test('A-level judges in two segments, AO3 then AO4, and quotes the line the mix sits on', () => {
    for (const p of PRESETS) {
        const segs = judge({ state: applyPreset(DEFAULT_STATE, p.id), last: 'preset' });
        assert.equal(segs.length, 2, p.id);
        assert.equal(segs[0].ao, 3);
        assert.equal(segs[1].ao, 4);
        assert.match(segs[1].text, /-mark line:/, p.id);
    }
    const ref = judge({ state: applyPreset(DEFAULT_STATE, 'reference'), last: 'preset' });
    assert.match(ref[1].text, /three-mark line/);
    const buried = judge({ state: applyPreset(DEFAULT_STATE, 'buried'), last: 'preset' });
    assert.match(buried[1].text, /one-mark line/);
    assert.match(buried[1].text, /barely audible/);
});

test('the judge follows the control that was touched', () => {
    const r = referenceState(song);
    const pan = judge({ state: setPan(r, 'bass', 0.6), last: 'pan:bass' });
    assert.match(pan[0].text, /bass panned/);
    assert.match(pan[0].text, /left the centre/);
    const send = judge({ state: setSend(r, 'vocal', 0.8), last: 'send:vocal' });
    assert.match(send[0].text, /send at 80%/);
    assert.match(send[1].text, /send down/);
    const fader = judge({ state: setFader(r, 'drums', r.fader.drums - 5), last: 'fader:drums' });
    assert.match(fader[0].text, /drums at/);
    assert.match(fader[1].text, /Bring the drums up/);
    const mono = judge({ state: { ...r, mono: true, presetId: null }, last: 'mono' });
    assert.match(mono[0].text, /Folded to mono/);
});

test('Extension opens the machine without AO tags, differently per control', () => {
    const r = referenceState(song);
    const f = open({ state: r, last: 'fader:bass' });
    const p = open({ state: r, last: 'pan:bvox' });
    const s = open({ state: r, last: 'send:synth' });
    const m = open({ state: { ...r, mono: true }, last: 'mono' });
    for (const t of [f, p, s, m]) { assert.ok(t.length > 80); assert.ok(!/AO[34]/.test(t)); }
    assert.match(f, /trimmed \+6 dB/);
    assert.match(p, /two gains/);
    assert.match(s, /post-fade/);
    assert.match(m, /sum of left and right/);
    assert.ok(new Set([f, p, s, m]).size === 4);
});
