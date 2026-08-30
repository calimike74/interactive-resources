import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATE, PRESETS, applyPreset, setOctave, setSource, setLevel, setLfo, setChannels, setRate, setDepth, setTimeBase, stretchTo } from '../lib/bench/scope-model.js';
import { DEPTH_LINES, DEPTH_TEACH, hearingLine, nextMove, judge, open } from '../lib/bench/scope-depth.js';

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

test('the papers\' questions are answered in the scheme\'s line once the controls land', () => {
    const oct = applyPreset(DEFAULT_STATE, 'octave');
    assert.match(judge({ state: oct, last: 'preset' })[1].text, /^Not yet/);
    const up = judge({ state: setOctave(oct, 'up'), last: 'octave' });
    assert.match(up[1].text, /^As directed: "294 × 2/);
    assert.match(up[0].text, /588 Hz/);
    const lower = applyPreset(DEFAULT_STATE, 'lower');
    assert.match(judge({ state: lower, last: 'preset' })[0].text, /still a square wave/);
    const done = judge({ state: setOctave(setSource(lower, 'saw'), 'down'), last: 'octave' });
    assert.match(done[1].text, /Saw wave \(1\); period of 2 ms \(1\)/);
    const louder = applyPreset(DEFAULT_STATE, 'louder');
    assert.match(judge({ state: setLevel(louder, 6), last: 'level' })[0].text, /twice the height/);
    assert.match(judge({ state: setLevel(louder, 12), last: 'level' })[1].text, /^Not yet/);
    const kick = judge({ state: applyPreset(DEFAULT_STATE, 'kick'), last: 'preset' });
    assert.match(kick[0].text, /5 ms/);
    assert.match(kick[1].text, /0\.005/);
    const period = judge({ state: applyPreset(DEFAULT_STATE, 'period'), last: 'preset' });
    assert.match(period[1].text, /T = 2\.00 ms = 0\.002 s; f = 1 ÷ T = 500 Hz/);
    assert.match(period[1].text, /between B and C/);
    const lfo = applyPreset(DEFAULT_STATE, 'lfo');
    assert.match(judge({ state: setLfo(lfo, 'quaver'), last: 'lfo' })[1].text, /4 Hz/);
    const file = setDepth(setRate(setChannels(applyPreset(DEFAULT_STATE, 'file'), 2), 88.2), 24);
    assert.match(judge({ state: file, last: 'file' })[0].text, /60 MB/);
    assert.match(judge({ state: file, last: 'file' })[1].text, /^As directed/);
});

test('an unreadable screen is judged as a screen problem, not a wave problem', () => {
    const fast = setTimeBase(applyPreset(DEFAULT_STATE, 'period'), 100);
    const segs = judge({ state: fast, last: 'screen' });
    assert.match(segs[0].text, /too many to bracket/);
    assert.match(segs[1].text, /shorter/);
});

test('the Core line names the source, the pitch and the period, and the next move is a real instruction', () => {
    const line = hearingLine(DEFAULT_STATE);
    assert.match(line, /^You are hearing a bowed cello note as played: F3, one cycle every 5\.75 ms/);
    assert.match(hearingLine(setOctave(DEFAULT_STATE, 'up')), /an octave higher/);
    assert.match(hearingLine(stretchTo(DEFAULT_STATE, 1.5)), /stretched to/);
    assert.match(hearingLine(setLfo(DEFAULT_STATE, 'quaver')), /4 times a second/);
    for (const p of PRESETS) { const m = nextMove(applyPreset(DEFAULT_STATE, p.id)); assert.ok(m.length > 20, p.id); noDash(m); }
    noDash(line);
    assert.match(nextMove(setTimeBase(applyPreset(DEFAULT_STATE, 'period'), 100)), /shorter time base/);
});

test('Extension opens the file in its own words, with no AO tags', () => {
    const line = open({ state: DEFAULT_STATE, last: 'preset' });
    assert.match(line, /samples every millisecond/);
    assert.match(line, /10 MB/);
    assert.ok(!/AO[34]/.test(line));
    assert.ok(line.length > 60 && line.length < 560, `${line.length} characters`);
    const f = open({ state: setChannels(DEFAULT_STATE, 2), last: 'file' });
    assert.match(f, /^The file as set is stereo/);
    assert.match(f, /20 MB/);
    noDash(line); noDash(f);
});

test('the depth lines announce a job each, in the house style', () => {
    for (const k of ['core', 'alevel', 'extension']) { assert.ok(DEPTH_LINES[k].length > 100); noDash(DEPTH_LINES[k]); }
    noDash(DEPTH_TEACH.alevel); noDash(DEPTH_TEACH.extension);
});
