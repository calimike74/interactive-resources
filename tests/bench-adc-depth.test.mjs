import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATE, PRESETS, applyPreset, setBits, setRate, setFilter, setSource } from '../lib/bench/adc-model.js';
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

test('the judge says the exam\'s lines: half the rate, the fold, 2^n levels and 6 dB a bit', () => {
    const alias = judge({ state: applyPreset(DEFAULT_STATE, 'alias'), last: 'preset' });
    assert.match(alias[0].text, /half the rate, 4 kHz, is the highest frequency kept/);
    assert.match(alias[0].text, /hi-hats \(6 to 12 kHz\) are above it/);
    assert.match(alias[1].text, /alias/);
    assert.match(alias[1].text, /anywhere from 0 to 4 kHz/);
    const grit = judge({ state: applyPreset(DEFAULT_STATE, 'grit'), last: 'preset' });
    assert.match(grit[0].text, /16 levels, about 24 dB/);
    assert.match(grit[1].text, /quantisation noise/);
    const cd = judge({ state: applyPreset(DEFAULT_STATE, 'cd'), last: 'preset' });
    assert.match(cd[1].text, /CD quality, 44\.1 kHz and 16 bit/);
    const dull = judge({ state: setRate(applyPreset(DEFAULT_STATE, 'cd'), 8), last: 'rate' });
    assert.match(dull[1].text, /reduces the high-frequency content/);
    const s900 = judge({ state: applyPreset(DEFAULT_STATE, 's900low'), last: 'preset' });
    assert.match(s900[0].text, /3\.75 kHz, is the highest frequency kept; 2¹² is 4,096 levels/);
    assert.match(s900[1].text, /poorer high-frequency reproduction/);
    const deep = judge({ state: setBits(DEFAULT_STATE, 24), last: 'bits' });
    assert.match(deep[0].text, /16,777,216 levels, about 144 dB/);
});

test('no line mentions a tone, samples a cycle, or a preset that is gone', () => {
    for (const st of [DEFAULT_STATE, ...PRESETS.map((p) => applyPreset(DEFAULT_STATE, p.id))]) {
        const all = [hearingLine(st), nextMove(st), open({ state: st, last: 'preset' }), ...judge({ state: st, last: 'preset' }).map((x) => x.text)].join(' ');
        assert.ok(!/\btone\b|a cycle|Two per cycle|Judge:/i.test(all.replace(/false,? (clangy|inharmonic )?tones/g, '')), all.slice(0, 80));
    }
});

test('Core names what is heard and gives a real next move; Extension is its own sentence', () => {
    assert.match(hearingLine(DEFAULT_STATE), /^You are hearing the song at 20 kHz and 16 bit: everything up to 10 kHz kept/);
    assert.match(hearingLine(applyPreset(DEFAULT_STATE, 'alias')), /fold down as false, clangy tones/);
    for (const st of states()) {
        const line = hearingLine(st); clean(line);
        const next = nextMove(st); clean(next); assert.ok(next.length > 20);
        const ext = open({ state: st, last: 'preset' }); clean(ext);
        assert.ok(ext.length > 40 && !/AO[34]/.test(ext));
    }
    assert.match(open({ state: DEFAULT_STATE, last: 'bits' }), /65,536 codes, stored as a 16-digit binary word/);
});
