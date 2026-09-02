import test from 'node:test';
import assert from 'node:assert/strict';
import { DEPTH_LINES, DEPTH_TEACH, hearingLine, nextMove, judge, open, sectionOfLast } from '../lib/bench/reverb-depth.js';
import { DEFAULT_STATE, applyPreset, setWet, setStereo, setDry } from '../lib/bench/reverb-model.js';

const noDash = (s) => assert.ok(!/—/.test(s) && !/\butilise/i.test(s), `house copy law broken: ${s}`);

test('each level announces its own job in its own words', () => {
    assert.match(DEPTH_LINES.core, /names the tail/);
    assert.match(DEPTH_LINES.alevel, /judges every setting/);
    assert.match(DEPTH_LINES.extension, /opens the machine/);
    assert.match(DEPTH_TEACH.extension, /confused gating with compression/);
    for (const l of Object.values(DEPTH_LINES)) noDash(l);
    for (const l of Object.values(DEPTH_TEACH)) noDash(l);
});

test('Core names what is heard in the spec\'s words and says what to try', () => {
    const line = hearingLine(DEFAULT_STATE);
    assert.match(line, /^You are hearing the vocal through a hall/);
    assert.match(line, /2\.6/);
    assert.match(line, /A gap of 40 ms comes first/);
    assert.match(line, /6 first reflections arrive between 15 and 80 ms/);
    assert.match(line, /25 per cent wet against 100 per cent dry it is clearly audible/);
    assert.match(hearingLine(applyPreset(DEFAULT_STATE, 'plate')), /A plate has no walls/);
    assert.match(hearingLine(applyPreset(DEFAULT_STATE, 'gated')), /held open for 120 ms/);
    assert.match(hearingLine(applyPreset(DEFAULT_STATE, 'spring')), /pulse every 55 ms/);
    assert.match(hearingLine(applyPreset(DEFAULT_STATE, 'reverse')), /swelling over/);
    assert.match(nextMove(DEFAULT_STATE), /drag the tail's end handle left/);
    assert.match(nextMove(setWet({ ...DEFAULT_STATE, presetId: null }, 70)), /bring Wet under 40/);
    assert.match(nextMove(applyPreset(DEFAULT_STATE, 'judgeMono')), /Stereo/);
    [line, hearingLine(applyPreset(DEFAULT_STATE, 'gated')), nextMove(DEFAULT_STATE)].forEach(noDash);
});

test('A-level judges a task in the scheme\'s line with its year, and a section the way Q6 does', () => {
    const as = applyPreset(DEFAULT_STATE, 'as2019');
    const segs = judge({ state: as, last: 'preset' });
    assert.equal(segs.length, 2);
    assert.equal(segs[0].ao, 3);
    assert.equal(segs[1].ao, 4);
    assert.match(segs[1].text, /^As directed: "2 second reverb used on entire vocal \(1\)/);
    assert.match(segs[1].text, /2019 AS Q5\(a\)/);
    const mono = judge({ state: setStereo(as, 'mono'), last: 'stereo' });
    assert.match(mono[1].text, /^Not yet: in mono, where the scheme wants the reverb in stereo/);
    const ins = applyPreset(DEFAULT_STATE, 'judgeInsert');
    const sum = judge({ state: ins, last: 'preset' });
    assert.match(sum[0].text, /^A lead vocal, judged part by part/);
    assert.match(sum[1].text, /^Routing and stereo width first/);
    assert.match(sum[1].text, /Switch Routing to Send/);
    const sec = judge({ state: ins, last: 'pan' });
    assert.match(sec[0].text, /^ROUTING: a channel insert, stereo, pan 100 left/);
    assert.match(sec[1].text, /^Does not suit a lead vocal: on an insert with the part panned left/);
    assert.match(sec[1].text, /2023 AS report/);
    const wet = judge({ state: applyPreset(DEFAULT_STATE, 'judgeWet'), last: 'wet' });
    assert.match(wet[1].text, /swamps the part/);
    assert.match(wet[1].text, /Bring Wet under 40/);
    const total = (s) => s.map((x) => x.text).join(' ').length;
    for (const set of [segs, mono, sum, sec, wet]) {
        assert.ok(total(set) < 450, `${total(set)} characters`);
        set.forEach((sg) => noDash(sg.text));
    }
    assert.equal(sectionOfLast('stage'), 'time');
    assert.equal(sectionOfLast('pan'), 'routing');
    assert.equal(sectionOfLast('preset'), null);
});

test('Extension opens the machine: the answer, the convolution, the type\'s mechanism, no AO tags', () => {
    const all = open({ state: DEFAULT_STATE, last: 'preset' });
    assert.match(all, /^A large space answers late/);
    assert.match(all, /space's answer to one clap/);
    assert.ok(!/AO[34]/.test(all));
    assert.match(open({ state: DEFAULT_STATE, last: 'time' }), /falling 60 dB in/);
    assert.match(open({ state: DEFAULT_STATE, last: 'predelay' }), /holds each copy back 40 ms/);
    assert.match(open({ state: setDry(DEFAULT_STATE, 0), last: 'dry' }), /Funkytown/);
    assert.match(open({ state: applyPreset(DEFAULT_STATE, 'gated'), last: 'preset' }), /^A room's answer with a gate across it/);
    assert.match(open({ state: DEFAULT_STATE, last: 'damping' }), /Damping splits the answer at 2 kHz/);
    for (const last of ['preset', 'time', 'predelay', 'dry', 'damping', 'routing']) {
        const t = open({ state: DEFAULT_STATE, last });
        assert.ok(t.length < 330, `${last}: ${t.length} characters`);
        noDash(t);
    }
});
