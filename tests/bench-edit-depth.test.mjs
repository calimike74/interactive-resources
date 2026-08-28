import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATE, applyPreset, editStats } from '../lib/bench/edit-model.js';
import { DEPTH_LINES, DEPTH_TEACH, facts, hearingLine, nextMove, judge, open } from '../lib/bench/edit-depth.js';

// The Edit bench's three jobs: Core shows, A-level judges with AO3/AO4,
// Extension opens the machine. These tests hold the shape of each.

const SR = 44100;
const sine = (n = SR * 8, f = 200, amp = 0.8) => Float32Array.from({ length: n }, (_, i) => amp * Math.sin(2 * Math.PI * f * (i / SR)));
const tail = (n = SR * 2) => { const ch = new Float32Array(n); for (let i = 0; i < n; i += 1) ch[i] = Math.exp(-i / (SR * 0.15)) * Math.sin(i * 0.3); return ch; };
const ch = sine();
const at = (patch) => { const s = { ...DEFAULT_STATE, ...patch }; return { state: s, stats: editStats(s, SR, s.take === 'cymbal' ? tail() : ch) }; };

test('each level announces itself in its own words, and the teach lines name the AOs', () => {
    for (const k of ['core', 'alevel', 'extension']) assert.ok(DEPTH_LINES[k].length > 60);
    assert.match(DEPTH_TEACH.alevel, /AO3/);
    assert.match(DEPTH_TEACH.alevel, /AO4/);
    for (const t of Object.values(DEPTH_LINES).concat(Object.values(DEPTH_TEACH))) assert.doesNotMatch(t, /—/);
});

test('Core reads the edit back and its next move follows the state', () => {
    const click = at({ cut: 1003, gap: 500, snap: false, length: 0 });
    assert.match(hearingLine(click.state, click.stats), /vocal|jump|zero/);
    assert.match(nextMove(click.state, click.stats), /Snap|nudge/);
    const faded = at({ length: 10 });
    assert.match(nextMove(faded.state, faded.stats), /Length up past 300/);
    const linear = at({ length: 400, shape: 'linear' });
    assert.match(nextMove(linear.state, linear.stats), /Equal power/);
    const cym = at({ take: 'cymbal', cut: 300, length: 0 });
    assert.match(hearingLine(cym.state, cym.stats), /cymbal/);
    assert.match(nextMove(cym.state, cym.stats), /hold dry/);
});

test('A-level judges every control with an AO3 naming and an AO4 verdict', () => {
    for (const last of ['cut', 'snap', 'shape', 'length', 'take', 'gap', 'preset']) {
        const s = at({ length: last === 'shape' ? 200 : 0 });
        const segs = judge({ state: s.state, last, stats: s.stats });
        assert.equal(segs.length, 2, last);
        assert.equal(segs[0].ao, 3, `${last} names first`);
        assert.equal(segs[1].ao, 4, `${last} judges second`);
        for (const sg of segs) { assert.ok(sg.text.length > 30, `${last} says something`); assert.doesNotMatch(sg.text, /—/); }
    }
});

test('the verdict on the cut turns on the jump, and on the tail for a trim', () => {
    const pop = at({ cut: 1003, snap: false, length: 0 });
    const v = judge({ state: pop.state, last: 'cut', stats: pop.stats })[1].text;
    if (pop.stats.stepPct >= 20) assert.match(v, /pop|jump/); else assert.match(v, /tick|zero/);
    const zero = at({ cut: 1003, snap: true, length: 0 });
    assert.match(judge({ state: zero.state, last: 'cut', stats: zero.stats })[1].text, /zero/);
    const cym = at({ take: 'cymbal', cut: 300, length: 0 });
    assert.match(judge({ state: cym.state, last: 'cut', stats: cym.stats })[1].text, /tail|ringing/);
    const cymFaded = at({ take: 'cymbal', cut: 1800, length: 400 });
    assert.match(judge({ state: cymFaded.state, last: 'cut', stats: cymFaded.stats })[1].text, /Clean|fade/);
});

test('the verdict on length walks repair, short, transition, too long', () => {
    const say = (length) => { const s = at({ length, shape: 'power' }); return judge({ state: s.state, last: 'length', stats: s.stats })[1].text; };
    assert.match(say(0), /hard cut|click|clean/i);
    assert.match(say(10), /repair|2018/);
    assert.match(say(60), /repair|smear/);
    assert.match(say(200), /transition|sustaining/);
    assert.match(say(450), /musical|too long/);
});

test('the verdict on shape knows the linear dip and the equal-power hold', () => {
    const lin = at({ length: 400, shape: 'linear' });
    assert.match(judge({ state: lin.state, last: 'shape', stats: lin.stats })[1].text, /3 dB/);
    const pow = at({ length: 400, shape: 'power' });
    assert.match(judge({ state: pow.state, last: 'shape', stats: pow.stats })[1].text, /holds/);
    const none = at({ length: 0 });
    assert.match(judge({ state: none.state, last: 'shape', stats: none.stats })[1].text, /nothing/);
});

test('the paper presets judge the paper', () => {
    const s22 = applyPreset(DEFAULT_STATE, 'p2022');
    const j22 = judge({ state: s22, last: 'preset', stats: editStats(s22, SR, ch) });
    assert.match(j22[1].text, /0 displacement|mid-cycle/);
    const s24 = applyPreset(DEFAULT_STATE, 'p2024');
    const j24 = judge({ state: s24, last: 'preset', stats: editStats(s24, SR, ch) });
    assert.match(j24[1].text, /most common score/);
});

test('Extension is its own sentence with no AO tags and opens the machine', () => {
    for (const last of ['cut', 'snap', 'shape', 'length', 'take', 'preset']) {
        for (const patch of [{ length: 0 }, { length: 300, shape: 'linear' }, { length: 300, shape: 'power' }, { length: 300, shape: 'scurve' }, { take: 'cymbal', cut: 300 }]) {
            const s = at(patch);
            const t = open({ state: s.state, last, stats: s.stats });
            assert.ok(t.length > 60, `${last} ${JSON.stringify(patch)}`);
            assert.doesNotMatch(t, /AO[34]/);
            assert.doesNotMatch(t, /—/);
        }
    }
    const lin = at({ length: 300, shape: 'linear' });
    assert.match(open({ state: lin.state, last: 'shape', stats: lin.stats }), /3 dB down/);
    const pow = at({ length: 300, shape: 'power' });
    assert.match(open({ state: pow.state, last: 'length', stats: pow.stats }), /cosine|sine/);
});

test('facts carries the numbers the lines read', () => {
    const s = at({ cut: 2500, gap: 500, length: 10 });
    const f = facts(s.state, s.stats);
    assert.equal(f.splice, true);
    assert.equal(f.faded, true);
    assert.equal(f.samples, 441);
    assert.equal(f.shapeName, 'equal power');
});
