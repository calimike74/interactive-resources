import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATE, PRESETS, applyPreset, setBits, setRate, setFilter, setSource, setTone } from '../lib/bench/adc-model.js';
import { DEPTH_LINES, DEPTH_TEACH, hearingLine, nextMove, judge, open } from '../lib/bench/adc-depth.js';

// House style, and no paper's year, code or question number to a pupil.
const clean = (s) => {
    assert.ok(!/—/.test(s) && !/\butilise/i.test(s), `house style: ${s.slice(0, 60)}`);
    assert.ok(!/\b(19|20)\d\d\b|9MT0|\bQ\d/.test(s), `no paper references: ${s.slice(0, 60)}`);
};
const states = () => {
    const out = [DEFAULT_STATE, ...PRESETS.map((p) => applyPreset(DEFAULT_STATE, p.id))];
    for (const b of [2, 4, 8, 12, 16, 24]) out.push(setBits(DEFAULT_STATE, b), setBits(setSource(DEFAULT_STATE, 'song'), b));
    for (const r of [2, 4, 6, 8, 20, 44.1, 96]) out.push(setRate(DEFAULT_STATE, r), setRate(setSource(DEFAULT_STATE, 'vocal'), r), setFilter(setRate(setSource(DEFAULT_STATE, 'guitar'), r), false));
    out.push(setTone(setRate(DEFAULT_STATE, 20), 15));
    return out;
};

test('the three level lines and the teacher notes keep house style', () => {
    for (const s of [...Object.values(DEPTH_LINES), ...Object.values(DEPTH_TEACH)]) clean(s);
});

test('A-level judges every setting in two segments, AO3 then AO4, short enough for the bar', () => {
    for (const st of states()) {
        for (const last of ['preset', 'rate', 'bits']) {
            const segs = judge({ state: st, last });
            assert.equal(segs.length, 2);
            assert.deepEqual(segs.map((s) => s.ao), [3, 4]);
            const len = segs[0].text.length + segs[1].text.length + DEPTH_TEACH.alevel.length;
            assert.ok(len < 420, `${st.presetId || st.source} ${st.rate} ${st.bits} after ${last}: ${len} characters`);
            segs.forEach((s) => clean(s.text));
        }
    }
});

test('the judge says the exam\'s lines: half the rate, the alias, 2^n levels and 6 dB a bit', () => {
    const alias = judge({ state: applyPreset(DEFAULT_STATE, 'alias'), last: 'preset' });
    assert.match(alias[0].text, /2 kHz, is the highest frequency kept/);
    assert.match(alias[1].text, /aliases/);
    assert.match(alias[1].text, /false 1 kHz/);
    assert.match(alias[1].text, /over 6 kHz/);
    const high = judge({ state: applyPreset(DEFAULT_STATE, 'judge'), last: 'preset' });
    assert.match(high[1].text, /false 5 kHz/);
    assert.match(high[1].text, /over 30 kHz/);
    const edge = judge({ state: applyPreset(DEFAULT_STATE, 'two'), last: 'preset' });
    assert.match(edge[1].text, /more than twice/);
    const grit = judge({ state: applyPreset(DEFAULT_STATE, 'grit'), last: 'preset' });
    assert.match(grit[0].text, /16 levels, about 24 dB/);
    assert.match(grit[1].text, /quantisation noise/);
    const cd = judge({ state: applyPreset(DEFAULT_STATE, 'cd'), last: 'preset' });
    assert.match(cd[1].text, /CD quality, 44\.1 kHz and 16 bit/);
    const dull = judge({ state: setRate(applyPreset(DEFAULT_STATE, 'cd'), 8), last: 'rate' });
    assert.match(dull[1].text, /reduces the high-frequency content/);
    const crush = judge({ state: applyPreset(DEFAULT_STATE, 'crusher'), last: 'preset' });
    assert.match(crush[1].text, /aliasing/);
    assert.match(crush[1].text, /quantisation noise/);
    const deep = judge({ state: setBits(DEFAULT_STATE, 24), last: 'bits' });
    assert.match(deep[0].text, /16,777,216 levels, about 144 dB/);
});

test('Core names what is heard and gives a real next move; Extension is its own sentence', () => {
    assert.match(hearingLine(DEFAULT_STATE), /^You are hearing a 3 kHz test tone at 20 kHz and 16 bit: 6\.7 samples a cycle/);
    assert.match(hearingLine(applyPreset(DEFAULT_STATE, 'two')), /Exactly two a cycle/);
    assert.match(hearingLine(applyPreset(DEFAULT_STATE, 'alias')), /false 1 kHz tone: aliasing/);
    for (const st of states()) {
        const line = hearingLine(st); clean(line);
        const next = nextMove(st); clean(next); assert.ok(next.length > 20);
        const ext = open({ state: st, last: 'preset' }); clean(ext);
        assert.ok(ext.length > 40 && !/AO[34]/.test(ext));
    }
    assert.match(open({ state: DEFAULT_STATE, last: 'bits' }), /65,536 codes, stored as a 16-digit binary word/);
});
