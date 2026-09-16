import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATE, PRESETS, applyPreset, clearPattern, setSwing, setCutoff, setRecord, setStep, STEPS } from '../lib/bench/seq-model.js';
import { DEPTH_LINES, DEPTH_TEACH, hearingLine, nextMove, judge, open } from '../lib/bench/seq-depth.js';

const noDash = (s) => assert.ok(!/—/.test(s) && !/\butilise/i.test(s), `house style: ${s.slice(0, 60)}`);

test('every preset judges in two segments, AO3 then AO4, short enough for the bar', () => {
    for (const p of PRESETS) {
        const st = applyPreset(DEFAULT_STATE, p.id);
        const segs = judge({ state: st, last: 'preset' });
        assert.equal(segs.length, 2, p.id);
        assert.deepEqual(segs.map((s) => s.ao), [3, 4]);
        const len = segs[0].text.length + segs[1].text.length + DEPTH_TEACH.alevel.length;
        assert.ok(len < 700, `${p.id} runs to ${len} characters`);
        segs.forEach((s) => noDash(s.text));
    }
});

test('the feel task reads the swing the way the 2025 scheme does, on both sides', () => {
    const straight = applyPreset(DEFAULT_STATE, 'straight');
    const s0 = judge({ state: straight, last: 'preset' });
    assert.match(s0[0].text, /^Straight: sixteenth hats hard quantised/);
    assert.match(s0[1].text, /\(2025\)/);
    assert.match(s0[1].text, /mechanical/);
    const swung = judge({ state: applyPreset(DEFAULT_STATE, 'swing'), last: 'preset' });
    assert.match(swung[0].text, /^Swing quantise at 45%/);
    assert.match(swung[0].text, /\d+ ms late/);
    assert.match(swung[1].text, /loose, live/);
    const gentle = judge({ state: setSwing(straight, 10), last: 'swing' });
    assert.match(gentle[0].text, /^Gently swung/);
});

test('the filter task says where the cutoff sits and quotes the 2024 report', () => {
    const sweep = applyPreset(DEFAULT_STATE, 'sweep');
    const sw = judge({ state: sweep, last: 'preset' });
    assert.match(sw[0].text, /^Filter sweep: the cutoff climbs from 260 Hz to 6 kHz/);
    assert.match(sw[1].text, /\(2024\)/);
    const closed = judge({ state: setCutoff(sweep, 300), last: 'cutoff' });
    assert.match(closed[0].text, /^Low-pass filter: Cutoff at 300 Hz/);
    assert.match(closed[0].text, /below the bass line/);
    assert.match(closed[1].text, /dull, rounded bass/);
    const open_ = judge({ state: setCutoff(sweep, 9000), last: 'cutoff' });
    assert.match(open_[1].text, /bright, buzzing saw/);
});

test('the way-in task counts played against stepped notes and quotes the spec', () => {
    const played = applyPreset(DEFAULT_STATE, 'played');
    const j = judge({ state: played, last: 'preset' });
    assert.match(j[0].text, /^Played in: 7 bass notes came from the keys/);
    assert.match(j[1].text, /real-time input via MIDI keyboard/);
    let stepped = played;
    for (let s = 0; s < STEPS; s += 1) stepped = setStep(setStep(stepped, 'bass', s, false), 'bass', s, played.lanes.bass[s]);
    assert.match(judge({ state: stepped, last: 'cell' })[0].text, /^Stepped in: 7 bass notes/);
    let empty = played;
    for (let s = 0; s < STEPS; s += 1) empty = setStep(empty, 'bass', s, false);
    assert.match(judge({ state: empty, last: 'cell' })[0].text, /Bass row is empty/);
});

test('with no question set the judge describes the pattern and points at the presets', () => {
    const j = judge({ state: applyPreset(DEFAULT_STATE, 'bass'), last: 'preset' });
    assert.match(j[0].text, /^Bass and chords: \d+ drum hits, 6 bass notes and 2 chords, at 112 bpm/);
    assert.match(j[1].text, /^No question set/);
});

test('the Core line names the pattern, the tempo, the filter and the swing, and the next move is a real instruction', () => {
    const line = hearingLine(applyPreset(DEFAULT_STATE, 'bass'));
    assert.match(line, /^You are hearing bass and chords at 112 bpm: 5 kicks, 2 snares, 8 hats; 6 bass notes and 2 chords in A minor through the low-pass filter at 1\.4 kHz\.$/);
    assert.match(hearingLine(applyPreset(DEFAULT_STATE, 'swing')), /swing 45% \(every second sixteenth \d+ ms late\)/);
    assert.match(hearingLine(clearPattern(DEFAULT_STATE)), /empty grid/);
    for (const p of PRESETS) { const m = nextMove(applyPreset(DEFAULT_STATE, p.id)); assert.ok(m.length > 20, p.id); noDash(m); }
    assert.match(nextMove(clearPattern(DEFAULT_STATE)), /light a kick/);
    assert.match(nextMove(setRecord(setStep(clearPattern(DEFAULT_STATE), 'bass', 0, true), true)), /play a key/);
    noDash(line);
});

test('Extension opens the clock and the chain in its own words, with no AO tags', () => {
    const s = applyPreset(DEFAULT_STATE, 'swing');
    const line = open({ state: s, last: 'preset' });
    assert.match(line, /^A sequencer is a clock\. At 124 bpm a sixteenth is \d+ ms/);
    assert.match(line, /Swing holds every second step back by \d+ ms/);
    assert.match(line, /two sawtooth oscillators/);
    assert.ok(!/AO[34]/.test(line));
    assert.ok(line.length > 60 && line.length < 640, `${line.length} characters`);
    const chain = open({ state: s, last: 'cutoff' });
    assert.match(chain, /four screens are taps/);
    noDash(line); noDash(chain);
});

test('the depth lines announce a job each, in the house style', () => {
    for (const k of ['core', 'alevel', 'extension']) { assert.ok(DEPTH_LINES[k].length > 100); noDash(DEPTH_LINES[k]); }
    noDash(DEPTH_TEACH.alevel); noDash(DEPTH_TEACH.extension);
});
