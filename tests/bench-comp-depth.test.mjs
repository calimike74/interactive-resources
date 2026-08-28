import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATE, applyPreset, setParam, runLoop } from '../lib/bench/comp-model.js';
import { judge, open, hearingLine, nextMove } from '../lib/bench/comp-depth.js';

// The Dynamics bench's three jobs, over a made-up loop: a hit every quarter
// second at -4 dB, 50 ms long, silence (-60) between.
const env = new Float32Array(2000).fill(-60);
for (let h = 0; h < 4; h += 1) for (let i = 0; i < 100; i += 1) env[h * 500 + i] = -4;
const statsOf = (s) => runLoop(s, env, 0.5).stats;

test('A-level defines the threshold (AO3) and judges it on this part (AO4)', () => {
    const s = { ...applyPreset(DEFAULT_STATE, 'vocal') };
    const segs = judge({ state: s, last: 'threshold', part: 'the vocal', stats: statsOf(s) });
    assert.equal(segs[0].ao, 3);
    assert.match(segs[0].text, /Threshold −18 dB: the level above which the compressor/);
    assert.equal(segs[1].ao, 4);
    assert.match(segs[1].text, /words|vocal|singing/i);
});

test('the limiter is judged as the ratio at infinity, in the 2023 AS paper\'s terms', () => {
    const s = applyPreset(DEFAULT_STATE, 'limiter');
    const segs = judge({ state: s, last: 'ratio', part: 'the 808', stats: statsOf(s) });
    assert.match(segs[0].text, /∞:1/);
    assert.match(segs[1].text, /2023 AS/);
});

test('a gate is judged on its threshold against the kit, either side of the 2019 faults', () => {
    let s = applyPreset(DEFAULT_STATE, 'gatehats');
    let segs = judge({ state: s, last: 'threshold', part: 'the drums', stats: statsOf(s) });
    assert.match(segs[1].text, /musically/);
    s = setParam(s, { threshold: -30 });
    segs = judge({ state: s, last: 'threshold', part: 'the drums', stats: statsOf(s) });
    assert.match(segs[1].text, /too low/);
    segs = judge({ state: s, last: 'mode', part: 'the drums', stats: statsOf(s) });
    assert.match(segs[1].text, /2019 report/);
});

test('a slow attack on a vocal is the 2025 mark scheme\'s fault', () => {
    let s = applyPreset(DEFAULT_STATE, 'vocal');
    s = setParam(s, { attack: 60 });
    const segs = judge({ state: s, last: 'attack', part: 'the vocal', stats: statsOf(s) });
    assert.match(segs[0].text, /Attack 60 ms, slow/);
    assert.match(segs[1].text, /transients/);
});

test('the 2022 paper preset is judged from its mark scheme', () => {
    const s = applyPreset(DEFAULT_STATE, 'paper2022');
    const segs = judge({ state: s, last: 'preset', part: 'the vocal', stats: statsOf(s) });
    assert.match(segs[0].text, /−30 dB, 10:1, hard knee/);
    assert.match(segs[1].text, /make-up/);
    assert.match(open({ state: s, last: 'preset' }), /−30 in becomes −20 out/);
});

test('make-up gain is judged against the reduction it replaces', () => {
    let s = applyPreset(DEFAULT_STATE, 'vocal');
    s = setParam(s, { makeup: 20 });
    const segs = judge({ state: s, last: 'makeup', part: 'the vocal', stats: statsOf(s) });
    assert.match(segs[1].text, /louder than it was/);
});

test('the hearing line reads the settings and the loop', () => {
    const s = applyPreset(DEFAULT_STATE, 'gentle');
    const line = hearingLine(s, 'the drums', statsOf(s));
    assert.match(line, /compressor at −12 dB, 3:1, 10 ms in and 150 ms out/);
    assert.match(line, /% of the loop is over the threshold/);
    const g = applyPreset(DEFAULT_STATE, 'gatehats');
    assert.match(hearingLine(g, 'the drums', statsOf(g)), /gate at −8 dB, open \d+% of the loop/);
});

test('Core sends the student down the threshold first, then up the ratio', () => {
    let s = setParam(DEFAULT_STATE, { threshold: 0 });
    assert.match(nextMove(s, statsOf(s)), /threshold line down/);
    s = setParam(DEFAULT_STATE, { threshold: -20 });
    assert.match(nextMove(s, statsOf(s)), /ratio up/);
});

test('Extension opens the ratio as a slope', () => {
    const s = applyPreset(DEFAULT_STATE, 'gentle');
    assert.match(open({ state: s, last: 'ratio', stats: statsOf(s) }), /slope of 1\/3/);
    assert.match(open({ state: s, last: 'mode' }), /one gain computer/);
});
