import test from 'node:test';
import assert from 'node:assert/strict';
import { DEPTH_LINES, DEPTH_TEACH, PICTURES, pictures, hearingLine, nextMove, judge, open, sectionOfLast, paperNumber } from '../lib/bench/acoustics-depth.js';
import {
    DEFAULT_STATE, applyPreset, PRESETS, STATION_IDS, TASKS, ABSORB,
    setProof, setMasker, setPlace, setListen, setTone, setDelay, setRt60, setAbsorb, setStation,
} from '../lib/bench/acoustics-model.js';

const noDash = (s) => assert.ok(!/—/.test(s) && !/\butilise/i.test(s), `house copy law broken: ${s}`);
const LASTS = ['preset', 'station', 'source', 'tone', 'listen', 'target', 'targetOn', 'place', 'masker', 'delay', 'reflect', 'rt60', 'room', 'absorb', 'proof', 'stageComb', 'stageTail'];

test('each level announces its own job in its own words', () => {
    assert.match(DEPTH_LINES.core, /names what you are hearing/);
    assert.match(DEPTH_LINES.alevel, /judges what is set the way the paper does/);
    assert.match(DEPTH_LINES.extension, /opens the machine/);
    assert.match(DEPTH_TEACH.extension, /soundproofing/);
    for (const l of [...Object.values(DEPTH_LINES), ...Object.values(DEPTH_TEACH)]) noDash(l);
});

test('Core names what is heard at each station and says what to try, with no arithmetic asked', () => {
    assert.match(hearingLine(applyPreset(DEFAULT_STATE, 'quiet')), /^Every tone leaves at one level/);
    assert.match(hearingLine(applyPreset(DEFAULT_STATE, 'quiet')), /28 phon quieter/);
    assert.match(hearingLine(applyPreset(DEFAULT_STATE, 'loud')), /14 phon quieter/);
    assert.match(hearingLine(applyPreset(DEFAULT_STATE, 'peak')), /phon louder/);
    assert.match(hearingLine(applyPreset(DEFAULT_STATE, 'hidden')), /The noise has taken it/);
    assert.match(hearingLine(applyPreset(DEFAULT_STATE, 'fromAbove')), /The tone is still there/);
    assert.match(hearingLine(applyPreset(DEFAULT_STATE, 'oneWall')), /a notch at 100 Hz and another every 200 Hz/);
    assert.match(hearingLine(applyPreset(DEFAULT_STATE, 'treatedRoom')), /panels and bass traps/);
    // a reflection too far under to matter is not claimed as a comb
    assert.match(hearingLine(applyPreset(DEFAULT_STATE, 'bareRoom')), /too far under to colour anything/);
    // and one past the boundary is a bounce, not a colouration
    const far = setDelay({ ...DEFAULT_STATE, reflect: -2 }, 40);
    assert.match(hearingLine(far), /separate bounce/);
    assert.match(nextMove(applyPreset(DEFAULT_STATE, 'judgeProof')), /Soundproofing off and on/);
    assert.match(nextMove(setProof({ ...DEFAULT_STATE, presetId: null }, true)), /Nothing changes/);
    // the student is never asked to work anything out
    for (const p of PRESETS) {
        const s = applyPreset(DEFAULT_STATE, p.id);
        for (const t of [hearingLine(s), nextMove(s)]) {
            noDash(t);
            assert.ok(!/calculate|work out|how many|divide|multiply/i.test(t), `Core asks the student to compute: ${t}`);
        }
    }
});

test('A-level judges a paper\'s task in the scheme\'s line with its year, and a control the way Q6 does', () => {
    const c = judge({ state: applyPreset(DEFAULT_STATE, 'comb2021'), last: 'preset' });
    assert.equal(c.length, 2);
    assert.equal(c[0].ao, 3);
    assert.equal(c[1].ao, 4);
    assert.match(c[0].text, /^2021 paper, as set:/);
    assert.match(c[0].text, /167 Hz/);
    assert.match(c[1].text, /^As directed: "The side mic is closer to the snare/);
    assert.match(c[1].text, /2021 A Q6/);
    // the number follows the question: a treatment question wants the RT60
    const r = judge({ state: applyPreset(DEFAULT_STATE, 'room2024'), last: 'preset' });
    assert.match(r[0].text, /reverberation time the room is set to: 1\.1 s/);
    assert.match(r[1].text, /Only reduces mid and high frequency reflections/);
    // an "as directed" line never also tells you to change something
    assert.ok(!/Press |Take |Add |Switch |Raise |Bring |Move /.test(r[1].text), r[1].text);
    // the trap, judged as the reports judge it
    const p = judge({ state: applyPreset(DEFAULT_STATE, 'judgeProof'), last: 'preset' });
    assert.match(p[0].text, /^What a room does to a sound, part by part:/);
    assert.match(p[1].text, /^The walls first: soundproofing stops sound passing through a structure/);
    assert.match(p[1].text, /nothing here has changed/);
    // one control, judged on its own
    const one = judge({ state: applyPreset(DEFAULT_STATE, 'judgeProof'), last: 'rt60' });
    assert.match(one[0].text, /^TAIL:/);
    // the other way the answer goes wrong
    const d = judge({ state: applyPreset(DEFAULT_STATE, 'judgeDead'), last: 'rt60' });
    assert.match(d[1].text, /not the goal/);
    assert.match(d[1].text, /neutral, not dead/);
    // a masker above the target is faulted, one below is not
    const above = judge({ state: applyPreset(DEFAULT_STATE, 'fromAbove'), last: 'place' });
    assert.match(above[1].text, /survives any level/);
    // a control from another station is never judged: the line goes back to the summary
    const cross = judge({ state: applyPreset(DEFAULT_STATE, 'oneWall'), last: 'tone' });
    assert.match(cross[0].text, /part by part/);
});

test('every A-level pair carries both tags, quotes a year, and fits the bar', () => {
    for (const p of PRESETS) {
        for (const last of LASTS) {
            const segs = judge({ state: applyPreset(DEFAULT_STATE, p.id), last });
            assert.equal(segs.length, 2, `${p.id}/${last}`);
            assert.equal(segs[0].ao, 3);
            assert.equal(segs[1].ao, 4);
            const total = segs.map((s) => s.text).join(' ');
            assert.ok(total.length < 450, `${p.id}/${last} runs to ${total.length} characters`);
            segs.forEach((s) => noDash(s.text));
        }
    }
    // a paper's line always names its own year
    for (const id of ['hearing2022', 'masking2020', 'comb2021', 'room2024']) {
        const segs = judge({ state: applyPreset(DEFAULT_STATE, id), last: 'preset' });
        assert.match(segs[1].text, new RegExp(TASKS[id].cite.replace(/[()]/g, '\\$&')), `${id} does not cite itself`);
    }
});

test('the one number the paper wants follows the question, not the station', () => {
    assert.match(paperNumber(applyPreset(DEFAULT_STATE, 'comb2021')).said, /first notch/);
    assert.match(paperNumber(applyPreset(DEFAULT_STATE, 'room2024')).said, /reverberation time/);
    assert.match(paperNumber(applyPreset(DEFAULT_STATE, 'hearing2022')).said, /gives up/);
    assert.match(paperNumber(applyPreset(DEFAULT_STATE, 'peak')).said, /gains over/);
    assert.match(paperNumber(applyPreset(DEFAULT_STATE, 'hidden')).said, /heard past the masker/);
    // forcing the section overrides the task's own focus
    assert.match(paperNumber(applyPreset(DEFAULT_STATE, 'room2024'), 'reflection').said, /first notch/);
});

test('Extension opens the machine, in its own sentence, with no AO tags', () => {
    const room = open({ state: applyPreset(DEFAULT_STATE, 'oneWall'), last: 'preset' });
    assert.match(room, /DelayNode/);
    assert.ok(!/AO[34]/.test(room));
    assert.match(open({ state: applyPreset(DEFAULT_STATE, 'oneWall'), last: 'delay' }), /cancels wherever the copy is half a cycle late/);
    assert.match(open({ state: applyPreset(DEFAULT_STATE, 'oneWall'), last: 'rt60' }), /exp\(-ln 1000 t \/ T\)/);
    assert.match(open({ state: applyPreset(DEFAULT_STATE, 'judgeProof'), last: 'proof' }), /no node is added/);
    assert.match(open({ state: applyPreset(DEFAULT_STATE, 'quiet'), last: 'preset' }), /100 dB SPL/);
    assert.match(open({ state: applyPreset(DEFAULT_STATE, 'hidden'), last: 'masker' }), /per Bark/);
    for (const p of PRESETS) {
        for (const last of LASTS) {
            const t = open({ state: applyPreset(DEFAULT_STATE, p.id), last });
            assert.ok(t.length < 330, `${p.id}/${last} runs to ${t.length} characters`);
            assert.ok(!/AO[34]/.test(t), `${p.id}/${last} carries an AO tag`);
            noDash(t);
        }
    }
});

test('a control maps to the part of the answer it belongs to', () => {
    assert.equal(sectionOfLast('delay'), 'reflection');
    assert.equal(sectionOfLast('stageComb'), 'reflection');
    assert.equal(sectionOfLast('stageTail'), 'tail');
    assert.equal(sectionOfLast('absorb'), 'walls');
    assert.equal(sectionOfLast('proof'), 'walls');
    assert.equal(sectionOfLast('place'), 'masker');
    assert.equal(sectionOfLast('preset'), null);
    assert.equal(sectionOfLast('station'), null);
});

test('every line the bench can say, at every station and every control, obeys the house copy laws', () => {
    for (const station of STATION_IDS) {
        for (const last of LASTS) {
            const s = setStation(DEFAULT_STATE, station);
            noDash(hearingLine(s));
            noDash(nextMove(s));
            judge({ state: s, last }).forEach((x) => noDash(x.text));
            noDash(open({ state: s, last }));
        }
    }
    for (const a of Object.values(ABSORB)) { noDash(a.said); noDash(a.mech); noDash(a.label); }
    for (const t of Object.values(TASKS)) { noDash(t.stem); noDash(t.scheme); noDash(t.report || ''); }
});

// Mike, 12 September 2026, on his first look: "the visuals, as far as the
// graphs are concerned, I don't really follow what that is". Each picture
// carries its own name and one line saying how to read it, and these pin
// them so a redraw cannot quietly take them off again.
test('every picture on the stage names itself, at every station and every level', () => {
    const one = (station, depth) => {
        const p = pictures(station, depth);
        assert.equal(p.length, station === 'room' && depth === 'core' ? 2 : 1, `${station}/${depth} draws the wrong number of pictures`);
        return p;
    };
    assert.equal(one('loudness', 'core')[0].title, 'Equal-loudness curves');
    assert.match(one('loudness', 'core')[0].caption, /^Frequency across, level up the side\./);
    assert.match(one('loudness', 'core')[0].caption, /sound equally loud/);
    assert.match(one('loudness', 'alevel')[0].title, /^Your answer in parts: the tone/);
    assert.match(one('loudness', 'extension')[0].title, /^The signal path:/);

    assert.match(one('masking', 'core')[0].title, /^The masker's skirt:/);
    assert.match(one('masking', 'core')[0].caption, /Under the skirt nothing is heard/);
    assert.match(one('masking', 'core')[0].caption, /The upright line is your tone/);
    assert.match(one('masking', 'alevel')[0].title, /the target, the masker, and what is heard$/);
    assert.match(one('masking', 'extension')[0].title, /^The signal path:/);

    // the Room is two pictures, so it is two names
    const room = one('room', 'core');
    assert.equal(room[0].title, 'The comb: what one reflection takes out of the sound');
    assert.match(room[0].caption, /Each dip is a frequency the late copy cancels/);
    assert.equal(room[1].title, 'How each band of the room dies away');
    assert.match(room[1].caption, /^Time across, level up the side\./);
    assert.match(one('room', 'alevel')[0].title, /^The session as a plan:/);
    assert.match(one('room', 'extension')[0].title, /then into the convolver$/);

    // an unknown level falls back to the picture Core draws rather than to nothing
    assert.deepEqual(pictures('room', 'nonsense'), PICTURES.room.core);
});

test('a title and a caption obey the house copy laws and law 24\'s bar', () => {
    for (const [station, levels] of Object.entries(PICTURES)) {
        for (const [depth, pics] of Object.entries(levels)) {
            for (const p of pics) {
                noDash(p.title);
                noDash(p.caption);
                assert.ok(p.title.length > 0 && p.title.length < 107, `${station}/${depth} title runs to ${p.title.length} characters`);
                assert.ok(p.caption.length > 0 && p.caption.length < 107, `${station}/${depth} caption runs to ${p.caption.length} characters`);
                // Core is the picture and its name: no arithmetic is asked for
                if (depth === 'core') assert.ok(!/calculate|work out|how many|divide|multiply/i.test(`${p.title} ${p.caption}`), `Core asks the student to compute: ${p.title}`);
            }
        }
    }
    // every Core caption says which way the axes run, in words
    for (const station of Object.keys(PICTURES)) {
        for (const p of PICTURES[station].core) {
            assert.match(p.caption, /(across|down the side|up the side)/, `${station} Core does not say which way the axes run`);
        }
    }
});
