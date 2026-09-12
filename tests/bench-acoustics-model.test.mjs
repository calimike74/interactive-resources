import test from 'node:test';
import assert from 'node:assert/strict';
import {
    ISO_F, splAt, phonAt, thresholdAt, isoParams, loudnessReading, CONTOURS,
    bark, criticalBandwidth, maskThresholdSpl, maskThresholdDbfs, maskSlopeUp, MASK_SLOPE_DOWN,
    maskingReading, maskerHzOf, TARGET_DBFS, splOfDbfs, dbfsOfSpl, SPL_AT_FULL_SCALE,
    firstNotchHz, notchesOf, peaksOf, combDb, combPeakDb, combNotchDb, combDepthDb, COLOUR_LIMIT_MS,
    bandTimes, evenness, envelopeDbAt, impulse, impulseEnergy, impulseOnset, impulseLength, IMPULSE_GAIN,
    ABSORB, ABSORB_IDS, BAND_IDS, TONE_IDS, STATION_IDS, PLACE_IDS,
    PRESETS, presetsFor, applyPreset, DEFAULT_STATE, baseState,
    setDelay, setReflect, setRt60, setAbsorb, setProof, setMasker, setPlace, setTone, setListen, setStation,
    judgeSection, judgeAll, verdict, readings, sectionsOf, TASKS, REPORTS,
    combShape, decayShape, contourShape, maskShape, delayFromComb, rt60FromDecay,
    paperBoxes, machineBoxes, stageOf, fmtSec, fmtHz, fmtMs,
    DELAY_MIN, DELAY_MAX, RT60_MIN, RT60_MAX, REFLECT_MIN, REFLECT_MAX,
} from '../lib/bench/acoustics-model.js';

const noDash = (s) => assert.ok(!/—/.test(s) && !/\butilise/i.test(s), `house copy law broken: ${s}`);
const BOX = { x0: 40, y0: 60, x1: 800, y1: 420 };

// ---- 1 · the ear ----------------------------------------------------------
test('ISO 226 by construction: at 1 kHz the contour returns its own level, which is what a phon is', () => {
    for (const phon of [0, 20, 40, 60, 80, 90, 100]) {
        assert.ok(Math.abs(splAt(1000, phon) - phon) < 0.1, `1 kHz at ${phon} phon gave ${splAt(1000, phon).toFixed(2)} dB SPL`);
    }
    assert.equal(ISO_F.length, 29);
    assert.equal(ISO_F[0], 20);
    assert.equal(ISO_F[ISO_F.length - 1], 12500);
    const p = isoParams(1000);
    assert.ok(Math.abs(p.af - 0.25) < 1e-9 && Math.abs(p.lu) < 1e-9);
});

test('the ends of the spectrum cost more than the middle, and cost less as the level rises', () => {
    // the published shape: 100 Hz and 10 kHz need more than 1 kHz at 40 phon
    assert.ok(splAt(100, 40) > splAt(1000, 40) + 20, `100 Hz at 40 phon: ${splAt(100, 40).toFixed(1)}`);
    assert.ok(splAt(10000, 40) > splAt(1000, 40) + 10, `10 kHz at 40 phon: ${splAt(10000, 40).toFixed(1)}`);
    // near 3 kHz the ear canal resonates, so it costs LESS than 1 kHz
    assert.ok(splAt(3000, 40) < splAt(1000, 40), `3 kHz at 40 phon: ${splAt(3000, 40).toFixed(1)}`);
    // the contours flatten as they rise: the bass penalty shrinks
    const quiet = splAt(100, 40) - 40;
    const loud = splAt(100, 90) - 90;
    assert.ok(loud < quiet - 10, `bass penalty: ${quiet.toFixed(1)} dB quiet, ${loud.toFixed(1)} dB loud`);
    // and the threshold of hearing is the zero-phon contour
    assert.equal(thresholdAt(1000), splAt(1000, 0));
    assert.ok(thresholdAt(100) > thresholdAt(3000) + 20);
});

test('phonAt inverts splAt, and reads zero under the threshold of hearing', () => {
    for (const hz of TONE_IDS) {
        for (const phon of [20, 45, 70, 95]) {
            const back = phonAt(hz, splAt(hz, phon));
            assert.ok(Math.abs(back - phon) < 0.2, `${hz} Hz at ${phon} phon came back as ${back.toFixed(2)}`);
        }
        assert.equal(phonAt(hz, thresholdAt(hz) - 1), 0);
    }
});

test('the Loudness station: one level in, four different loudnesses out, closing when loud', () => {
    const at = (tone, listen) => loudnessReading({ ...baseState(), station: 'loudness', tone, listen });
    assert.equal(Math.round(at(1000, 'quiet').phon), 40);
    assert.equal(Math.round(at(1000, 'loud').phon), 90);
    // the whole lesson, as two numbers
    assert.ok(Math.round(at(100, 'quiet').gap) >= 25, `quiet gap ${at(100, 'quiet').gap.toFixed(1)}`);
    assert.ok(Math.round(at(100, 'loud').gap) <= 16, `loud gap ${at(100, 'loud').gap.toFixed(1)}`);
    assert.ok(at(100, 'quiet').gap > at(100, 'loud').gap + 10);
    // 3 kHz is the one that gains rather than gives up
    assert.ok(at(3000, 'quiet').gap < 0);
    assert.ok(CONTOURS.includes(40) && CONTOURS.includes(90));
});

// ---- 2 · masking ----------------------------------------------------------
test('the Bark scale and the critical band match the chapter\'s description', () => {
    assert.ok(Math.abs(bark(1000) - 8.5) < 0.2, `bark(1000) = ${bark(1000).toFixed(2)}`);
    assert.ok(bark(20000) > bark(1000) && bark(100) < bark(1000));
    // "roughly 100 Hz wide below about 500 Hz"
    assert.ok(criticalBandwidth(200) > 90 && criticalBandwidth(200) < 130);
    // "roughly a fifth of the centre frequency above that"
    const ratio = criticalBandwidth(4000) / 4000;
    assert.ok(ratio > 0.12 && ratio < 0.28, `a fifth of 4 kHz: ${ratio.toFixed(3)}`);
});

test('masking spreads upward further than downward, and further still as the masker gets louder', () => {
    // the downward slope is the steep fixed one
    assert.equal(MASK_SLOPE_DOWN, -27);
    // the upward slope flattens with level, and is always shallower than 27
    const quiet = maskSlopeUp(1000, 60);
    const loud = maskSlopeUp(1000, 90);
    assert.ok(loud > quiet, `${quiet.toFixed(2)} at 60 dB, ${loud.toFixed(2)} at 90 dB`);
    assert.ok(Math.abs(loud) < 27 && Math.abs(quiet) < 27);
    // one Bark up costs less than one Bark down, at the same masker
    const up = maskThresholdSpl(1400, 1000, 80);
    const down = maskThresholdSpl(700, 1000, 80);
    assert.ok(up > down, `up ${up.toFixed(1)}, down ${down.toFixed(1)}`);
    // the two unit conversions are each other's inverse
    assert.equal(splOfDbfs(dbfsOfSpl(70)), 70);
    assert.equal(SPL_AT_FULL_SCALE, 100);
    assert.ok(Math.abs(maskThresholdDbfs(1000, 700, -14) - dbfsOfSpl(maskThresholdSpl(1000, 700, 86))) < 1e-9);
});

test('the Masking station: from below the masker takes the tone, from above it never does', () => {
    const st = (place, masker) => ({ ...baseState(), station: 'masking', target: 1000, place, masker, targetOn: true });
    assert.equal(maskerHzOf(st('below', -14)), 700);
    assert.equal(maskerHzOf(st('on', -14)), 1000);
    assert.equal(maskerHzOf(st('above', -14)), 1400);
    // below: quiet leaves the tone, loud takes it
    assert.equal(maskingReading(st('below', -40)).masked, false);
    assert.equal(maskingReading(st('below', -6)).masked, true);
    // above: the whole range leaves it
    for (const m of [-40, -20, -6, 0]) {
        assert.equal(maskingReading(st('above', m)).masked, false, `above at ${m} dB masked the tone`);
    }
    // the target is never removed, only outbid
    assert.equal(maskingReading(st('below', 0)).target, TARGET_DBFS);
    assert.equal(maskingReading({ ...st('below', 0), targetOn: false }).masked, false);
    // the threshold rises one for one with the masker
    const a = maskingReading(st('on', -30)).threshold;
    const b = maskingReading(st('on', -20)).threshold;
    assert.ok(Math.abs(b - a - 10) < 0.01, `${a.toFixed(2)} -> ${b.toFixed(2)}`);
});

// ---- 3 · the comb ---------------------------------------------------------
test('the first notch is 1/(2T) and the rest are its odd multiples, the peaks between them', () => {
    assert.equal(firstNotchHz(5), 100);
    assert.equal(firstNotchHz(0.5), 1000);
    assert.equal(firstNotchHz(20), 25);
    const n = notchesOf(5, 1000);
    assert.deepEqual(n, [100, 300, 500, 700, 900]);
    const p = peaksOf(5, 1000);
    assert.deepEqual(p, [200, 400, 600, 800, 1000]);
    // the response really does cancel at a notch and add at a peak
    for (const hz of n) assert.ok(combDb(hz, 5, -2) < -12, `${hz} Hz notch is ${combDb(hz, 5, -2).toFixed(1)} dB`);
    for (const hz of p) assert.ok(combDb(hz, 5, -2) > 4, `${hz} Hz peak is ${combDb(hz, 5, -2).toFixed(1)} dB`);
});

test('the comb gets deeper as the copy comes up, and is total at equal level', () => {
    assert.ok(Math.abs(combPeakDb(0) - 6.02) < 0.02);
    assert.ok(combNotchDb(0) <= -110, 'a copy at the same level cancels completely');
    assert.ok(combDepthDb(-2) > 18 && combDepthDb(-2) < 20, `${combDepthDb(-2).toFixed(1)} dB at -2 dB`);
    assert.ok(combDepthDb(-12) < 6);
    assert.ok(combDepthDb(-2) > combDepthDb(-6) && combDepthDb(-6) > combDepthDb(-12));
    // the chapter's boundary is on the bench
    assert.equal(COLOUR_LIMIT_MS, 25);
    assert.ok(DELAY_MAX > COLOUR_LIMIT_MS, 'the delay must be able to cross the colouration boundary');
});

// ---- 4 · the tail ---------------------------------------------------------
test('RT60 by construction: every band is 60 dB down at its own time', () => {
    for (const T of [0.3, 0.8, 1.5, 3]) {
        assert.ok(Math.abs(envelopeDbAt(T, T) + 60) < 0.01, `${T} s: ${envelopeDbAt(T, T).toFixed(3)} dB`);
        assert.ok(Math.abs(envelopeDbAt(T / 2, T) + 30) < 0.01);
    }
});

test('thin panels reach the top only; bass traps are what bring the low end with it', () => {
    const bare = bandTimes(ABSORB.bare.rt60, 'bare');
    const panels = bandTimes(ABSORB.panels.rt60, 'panels');
    const treated = bandTimes(ABSORB.treated.rt60, 'treated');
    // bare rings about the same at every frequency
    assert.ok(evenness(ABSORB.bare.rt60, 'bare') < 1.3, `bare evenness ${evenness(ABSORB.bare.rt60, 'bare')}`);
    // panels: the top falls a long way, the low end barely moves from bare
    assert.ok(panels.high < bare.high * 0.35, `panels high ${panels.high} vs bare ${bare.high}`);
    assert.ok(panels.low > bare.low * 0.8, `panels low ${panels.low} vs bare ${bare.low}`);
    assert.ok(evenness(ABSORB.panels.rt60, 'panels') > 3, 'panels leave two rooms, not one');
    // treated: the whole spectrum comes down together
    assert.ok(treated.low < panels.low * 0.5, `treated low ${treated.low} vs panels ${panels.low}`);
    assert.ok(evenness(ABSORB.treated.rt60, 'treated') < 1.6, 'treated is one room');
    // the chips put the dial where they say they do
    for (const id of ABSORB_IDS) assert.equal(setAbsorb(baseState(), id).rt60, ABSORB[id].rt60);
});

test('the impulse the convolver is given is the one the stage draws, and carries the measured energy', () => {
    for (const absorb of ABSORB_IDS) {
        const imp = impulse({ rt60: 1.2, absorb }, 48000);
        assert.equal(imp.sampleRate, 48000);
        assert.equal(imp.left.length, Math.max(64, Math.round(impulseLength(1.2, absorb) * 48000)));
        assert.equal(imp.right.length, imp.left.length);
        assert.ok(Math.abs(impulseOnset(imp) - IMPULSE_GAIN) < 1e-6, `${absorb} starts at ${impulseOnset(imp).toFixed(5)}`);
        // two channels, so the room is not in the middle of the head
        let diff = 0;
        for (let i = 0; i < imp.left.length; i += 1) diff += Math.abs(imp.left[i] - imp.right[i]);
        assert.ok(diff > 0, `${absorb}: the two channels differ`);
        // the drawn envelope is the same arithmetic as the tail's
        assert.deepEqual(Object.keys(imp.curves).sort(), [...BAND_IDS].sort());
        assert.equal(imp.times.mid, bandTimes(1.2, absorb).mid);
        assert.ok(Math.abs(imp.curves.mid[0] - 1) < 1e-6);
    }
    // the same settings build the same answer twice: the noise is seeded
    const a = impulse({ rt60: 1, absorb: 'bare' }, 48000);
    const b = impulse({ rt60: 1, absorb: 'bare' }, 48000);
    for (let i = 0; i < a.left.length; i += 997) assert.equal(a.left[i], b.left[i]);
    // every room answers at the same loudness, and a longer one carries more
    // energy because it lasts longer, which is what absorption really changes
    const short = impulse({ rt60: 0.3, absorb: 'treated' }, 48000);
    const long = impulse({ rt60: 3, absorb: 'bare' }, 48000);
    assert.ok(Math.abs(impulseOnset(short) - impulseOnset(long)) < 1e-6, 'the two rooms start at the same level');
    assert.ok(impulseEnergy(long) > impulseEnergy(short) * 4, 'a room that rings longer carries more energy');
});

// ---- 5 · the edits and the presets ----------------------------------------
test('every control clamps to its own range and drops the preset when it moves', () => {
    const s = DEFAULT_STATE;
    assert.equal(setDelay(s, 999).delay, DELAY_MAX);
    assert.equal(setDelay(s, 0).delay, DELAY_MIN);
    assert.equal(setReflect(s, 99).reflect, REFLECT_MAX);
    assert.equal(setReflect(s, -999).reflect, REFLECT_MIN);
    assert.equal(setRt60(s, 99).rt60, RT60_MAX);
    assert.equal(setRt60(s, 0).rt60, RT60_MIN);
    assert.equal(setMasker(s, 99).masker, 0);
    assert.equal(setDelay(s, 9).presetId, null);
    assert.equal(setDelay(s, s.delay).presetId, s.presetId, 'a control that does not move keeps the preset');
    assert.equal(setTone(s, 1234).tone, s.tone, 'a tone that is not on a chip is refused');
    assert.equal(setStation(s, 'nowhere').station, s.station);
    assert.equal(setProof(s, true).proof, true);
});

test('the presets are the papers, and each one lands its own verdict', () => {
    const want = {
        quiet: 'quiet', loud: 'loud', peak: 'quiet',
        hidden: 'masked', fromAbove: 'audible',
        oneWall: 'comb', bareRoom: 'bare', treatedRoom: 'treated',
        hearing2022: 'quiet', masking2020: 'masked',
        comb2021: 'comb', room2024: 'panels',
        judgeProof: 'soundproofing', judgeDead: 'dead',
    };
    assert.deepEqual(PRESETS.map((p) => p.id).sort(), Object.keys(want).sort());
    for (const p of PRESETS) {
        const s = applyPreset(DEFAULT_STATE, p.id);
        assert.equal(verdict(s).key, want[p.id], `${p.id} landed ${verdict(s).key}`);
        assert.equal(s.presetId, p.id);
        assert.ok(STATION_IDS.includes(s.station));
        noDash(p.blurb);
        noDash(p.name);
        if (p.task) assert.ok(TASKS[p.task], `${p.id} names a task that does not exist`);
    }
    // each paper's preset satisfies its own scheme
    for (const id of ['hearing2022', 'masking2020', 'comb2021', 'room2024']) {
        assert.equal(verdict(applyPreset(DEFAULT_STATE, id)).ok, true, `${id} does not meet its own scheme`);
    }
    // Core shows the stations; A-level carries the papers and the two judges
    assert.equal(presetsFor('core').length, 8);
    assert.equal(presetsFor('alevel').length, 6);
    assert.equal(presetsFor('extension').length, 6);
    assert.ok(presetsFor('core').every((p) => p.task === null));
});

test('the papers\' presets are pinned to the exact settings their schemes describe', () => {
    // 2021 A Q6: a side mic closer to the snare than the overhead, so a delay
    // of a few milliseconds between two mics on one source
    const c = applyPreset(DEFAULT_STATE, 'comb2021');
    assert.equal(c.station, 'room');
    assert.equal(c.delay, 3);
    assert.ok(c.delay < COLOUR_LIMIT_MS, 'the 2021 fault must be inside the colouration window');
    assert.ok(combDepthDb(c.reflect) > 20, 'two mics on one source sum at nearly equal level');
    assert.match(TASKS.comb2021.scheme, /Comb filtering/);
    assert.equal(TASKS.comb2021.cite, '2021 A Q6');
    // 2024 AS Q6: thin panels reach the mid and high only
    const r = applyPreset(DEFAULT_STATE, 'room2024');
    assert.equal(r.absorb, 'panels');
    const t = bandTimes(r.rt60, r.absorb);
    assert.ok(t.low > t.high * 3, 'the 2024 line only holds if the low end is left behind');
    assert.match(TASKS.room2024.scheme, /Only reduces mid and high frequency reflections/);
    // 2022 AS Q6: the trap. Soundproofing must change nothing the model makes
    const p = applyPreset(DEFAULT_STATE, 'judgeProof');
    assert.equal(p.proof, true);
    const off = setProof(p, false);
    assert.deepEqual(bandTimes(p.rt60, p.absorb), bandTimes(off.rt60, off.absorb));
    assert.equal(firstNotchHz(p.delay), firstNotchHz(off.delay));
    const impOn = impulse({ rt60: p.rt60, absorb: p.absorb }, 48000);
    const impOff = impulse({ rt60: off.rt60, absorb: off.absorb }, 48000);
    for (let i = 0; i < impOn.left.length; i += 997) assert.equal(impOn.left[i], impOff.left[i], 'soundproofing changed the answer');
    // 2020 A Q4(e): the noise is masked
    assert.equal(maskingReading(applyPreset(DEFAULT_STATE, 'masking2020')).masked, true);
    // 2022 AS Q3(e)(iii): the hearing range's top end
    assert.equal(applyPreset(DEFAULT_STATE, 'hearing2022').tone, 10000);
});

// ---- 6 · the judge --------------------------------------------------------
test('the judge faults only what a scheme or a report faults, and quotes it with its year', () => {
    const st = (over) => ({ ...DEFAULT_STATE, ...over });
    // the trap: soundproofing is the one thing that is always wrong here
    assert.equal(judgeSection(st({ proof: true }), 'walls').grade, 'poor');
    assert.match(judgeSection(st({ proof: true }), 'walls').cite, /2022 AS report/);
    // a dead room is a fault the report names, in the other direction
    assert.equal(judgeSection(st({ rt60: 0.3, absorb: 'treated' }), 'tail').grade, 'poor');
    assert.match(judgeSection(st({ rt60: 0.3, absorb: 'treated' }), 'tail').cite, /uncomfortable environment/);
    // a treated room is not a fault
    assert.equal(judgeSection(st({ rt60: 0.6, absorb: 'treated', proof: false }), 'walls').grade, 'good');
    // a masker above the target is the one masking setting that cannot work
    assert.equal(judgeSection(st({ station: 'masking', place: 'above', masker: 0 }), 'masker').grade, 'poor');
    assert.equal(judgeSection(st({ station: 'masking', place: 'below', masker: -6 }), 'masker').grade, 'good');
    // every judgement carries its evidence or says nothing
    for (const station of STATION_IDS) {
        for (const section of sectionsOf(station)) {
            const g = judgeSection({ ...DEFAULT_STATE, station }, section);
            assert.ok(['good', 'partly', 'poor'].includes(g.grade));
            noDash(g.why);
            noDash(g.cite);
            if (g.cite) assert.match(g.cite, /\b(2018|2019|2020|2021|2022|2023|2024|2025|2026)\b/, `a citation with no year: ${g.cite}`);
        }
    }
    for (const r of Object.values(REPORTS)) {
        noDash(r);
        assert.match(r, /\b(2018|2019|2020|2021|2022|2023|2024|2025|2026)\b/, `a report line with no year: ${r}`);
    }
    // judgeAll only judges what is on screen
    assert.deepEqual(Object.keys(judgeAll(st({ station: 'loudness' }))), ['tone', 'listen']);
    assert.deepEqual(Object.keys(judgeAll(st({ station: 'room' }))), ['reflection', 'tail', 'walls']);
});

// ---- 7 · the stage --------------------------------------------------------
test('three levels, three pictures, and every geometry stays inside its box', () => {
    assert.equal(stageOf('core'), 'ear');
    assert.equal(stageOf('alevel'), 'paper');
    assert.equal(stageOf('extension'), 'machine');
    const inside = (x, y, why) => {
        assert.ok(x >= BOX.x0 - 1 && x <= BOX.x1 + 1, `${why}: x ${x}`);
        assert.ok(y >= BOX.y0 - 1 && y <= BOX.y1 + 1, `${why}: y ${y}`);
    };
    for (const p of PRESETS) {
        const s = applyPreset(DEFAULT_STATE, p.id);
        const cs = contourShape({ ...s, station: 'loudness' }, BOX);
        inside(cs.dot.x, cs.dot.y, `${p.id} contour dot`);
        for (const c of cs.curves) for (const pt of c.points) inside(pt[0], pt[1], `${p.id} contour`);
        const ms = maskShape({ ...s, station: 'masking' }, BOX);
        inside(ms.masker.x, ms.masker.y, `${p.id} masker`);
        inside(ms.target.x, ms.target.y, `${p.id} target`);
        const cb = combShape({ ...s, station: 'room' }, BOX);
        for (const pt of cb.points) inside(pt[0], pt[1], `${p.id} comb`);
        inside(cb.handle.x, cb.handle.y, `${p.id} comb handle`);
        const dc = decayShape({ ...s, station: 'room' }, BOX);
        for (const l of dc.lines) for (const pt of l.points) inside(pt[0], pt[1], `${p.id} decay`);
        inside(dc.handle.x, dc.handle.y, `${p.id} tail handle`);
        for (const b of paperBoxes(s, BOX).boxes) inside(b.x, b.y, `${p.id} paper box`);
        for (const b of machineBoxes(s, BOX).boxes) inside(b.x, b.y, `${p.id} machine box`);
    }
});

test('the stage object is the dial: the notch marker sets Delay, the tail\'s end sets RT60', () => {
    const s = { ...DEFAULT_STATE, station: 'room', delay: 5 };
    const comb = combShape(s, BOX);
    // dragging the marker right means a higher notch, which means a shorter delay
    const right = delayFromComb(comb, comb.handle.x + 120);
    const left = delayFromComb(comb, comb.handle.x - 120);
    assert.ok(right < s.delay, `right gave ${right} ms`);
    assert.ok(left > s.delay, `left gave ${left} ms`);
    // and what it sets is what the console then reads
    assert.equal(setDelay(s, right).delay, right);
    assert.ok(firstNotchHz(right) > firstNotchHz(s.delay));
    // the tail's end is the reverb time, both ways, and clamped
    const dec = decayShape(s, BOX);
    assert.ok(Math.abs(rt60FromDecay(dec, dec.handle.x) - s.rt60) < 0.06, `read back ${rt60FromDecay(dec, dec.handle.x)}`);
    assert.ok(rt60FromDecay(dec, dec.handle.x + 200) > s.rt60 || s.rt60 === RT60_MAX);
    assert.equal(rt60FromDecay(dec, BOX.x0 - 500), RT60_MIN);
    assert.equal(rt60FromDecay(dec, BOX.x1 + 500), Math.min(RT60_MAX, rt60FromDecay(dec, BOX.x1 + 500)));
});

test('every readout the console prints comes from the state alone', () => {
    for (const p of PRESETS) {
        const s = applyPreset(DEFAULT_STATE, p.id);
        const r = readings(s);
        if (s.station === 'room') {
            assert.equal(r.notch, firstNotchHz(s.delay));
            assert.equal(r.rt60Text, fmtSec(s.rt60));
            assert.deepEqual(r.times, bandTimes(s.rt60, s.absorb));
        }
        if (s.station === 'masking') assert.equal(r.maskerHz, maskerHzOf(s));
        if (s.station === 'loudness') assert.equal(Math.round(r.phon), Math.round(phonAt(s.tone, r.spl)));
    }
    assert.equal(fmtHz(1000), '1 kHz');
    assert.equal(fmtHz(167), '167 Hz');
    assert.equal(fmtSec(0.6), '0.6 s');
    assert.equal(fmtSec(2.2), '2.2 s');
    assert.equal(fmtMs(0.5), '0.5 ms');
    assert.equal(fmtMs(40), '40 ms');
});
