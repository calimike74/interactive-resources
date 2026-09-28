import test from 'node:test';
import assert from 'node:assert/strict';
import { HELD, HELD_ITEMS, parseCite, isPaperHeld, isCiteHeld, isHeld, isTextHeld, hideHeld } from '../lib/bench/held-papers.js';

import * as reverb from '../lib/bench/reverb-model.js';
import * as acoustics from '../lib/bench/acoustics-model.js';
import * as delay from '../lib/bench/delay-model.js';
import * as eq from '../lib/bench/eq-model.js';
import * as synth from '../lib/bench/synth-model.js';
import * as seq from '../lib/bench/seq-model.js';
import * as midi from '../lib/bench/midi-model.js';
import * as scope from '../lib/bench/scope-model.js';
import * as lane from '../lib/bench/lane-model.js';
import * as comp from '../lib/bench/comp-model.js';
import * as edit from '../lib/bench/edit-model.js';
import * as balance from '../lib/bench/balance-model.js';

const BENCHES = { reverb, acoustics, delay, eq, synth, seq, midi, scope, lane, comp, edit, balance };

// What the 2019 A-level hold (9MT0/03 and 9MT0/04) must take off the benches.
const EXPECT_HIDDEN = {
    reverb: { presets: ['a2019', 'dials2019'], tasks: ['a2019', 'dials2019'] },
    midi: { presets: ['wrong'], tasks: ['map'] },
    scope: { presets: ['octave'], tasks: ['octave'] },
    synth: { presets: ['judgePad'], tasks: [] },
};

const ids = (list) => (Array.isArray(list) ? list.map((x) => x.id) : Object.keys(list));
const tasksOf = (m) => m.ALL_TASKS || {};

test('parseCite reads the cite formats the benches use', () => {
    assert.deepEqual(parseCite('2019 A Q5(a)'), { year: 2019, level: 'A', component: null });
    assert.deepEqual(parseCite('2019 C3 Q3(a)'), { year: 2019, level: 'A', component: 3 });
    assert.deepEqual(parseCite('2020 A Q6, a routing and plug-in figure'), { year: 2020, level: 'A', component: null });
    assert.deepEqual(parseCite('2019 AS Q5(a)'), { year: 2019, level: 'AS', component: null });
    assert.deepEqual(parseCite('2022 AS Q3(e)(iii)'), { year: 2022, level: 'AS', component: null });
    assert.deepEqual(parseCite('2019 Q2(c); the same task in 2021, 2024 and 2025'), { year: 2019, level: 'A', component: null });
    assert.equal(parseCite('vocal'), null);
    assert.equal(parseCite('the ladder every paper walks (2025 Q3(c))'), null);
    assert.equal(parseCite(undefined), null);
});

test('the 2019 A level is held, both components; the 2019 AS and other years are not', () => {
    assert.ok(isCiteHeld('2019 A Q5(a)'));
    assert.ok(isCiteHeld('2019 C3 Q3(a)'));
    assert.ok(isPaperHeld({ year: 2019, level: 'A', component: 4 }));
    assert.ok(!isCiteHeld('2019 AS Q5(a)'));
    assert.ok(!isCiteHeld('2020 A Q5(e)'));
    assert.ok(!isCiteHeld('2019 A Q5(a)', []));
    // a row holding only component 3 does not hold component 4, but does hold a bare 'A'
    const c3 = [{ year: 2019, level: 'A', components: [3] }];
    assert.ok(isCiteHeld('2019 C3 Q1', c3));
    assert.ok(!isCiteHeld('2019 C4 Q1', c3));
    assert.ok(isCiteHeld('2019 A Q1', c3));
});

test('every bench exports its pupil lists through the switch', () => {
    for (const [bench, m] of Object.entries(BENCHES)) {
        assert.ok(Array.isArray(m.ALL_PRESETS), `${bench}: ALL_PRESETS`);
        assert.deepEqual(ids(m.PRESETS), ids(hideHeld(bench, m.ALL_PRESETS, { tasks: tasksOf(m) })), `${bench}: PRESETS is the filtered list`);
        if (m.ALL_TASKS) assert.deepEqual(ids(m.TASKS), ids(hideHeld(bench, m.ALL_TASKS)), `${bench}: TASKS is the filtered list`);
        for (const p of m.PRESETS) assert.ok(!isHeld(bench, p, { tasks: tasksOf(m) }), `${bench}: ${p.id} is held but visible`);
    }
});

test('the hold hides every 2019 A-level task on every bench, and nothing else', () => {
    for (const [bench, m] of Object.entries(BENCHES)) {
        const hiddenP = ids(m.ALL_PRESETS).filter((id) => !ids(m.PRESETS).includes(id));
        const hiddenT = m.ALL_TASKS ? ids(m.ALL_TASKS).filter((id) => !ids(m.TASKS).includes(id)) : [];
        const want = EXPECT_HIDDEN[bench] || { presets: [], tasks: [] };
        assert.deepEqual(hiddenP.sort(), [...want.presets].sort(), `${bench}: hidden presets`);
        assert.deepEqual(hiddenT.sort(), [...want.tasks].sort(), `${bench}: hidden tasks`);
    }
    // the 2019 AS reverb task is a different paper and stays
    assert.ok(reverb.PRESETS.some((p) => p.id === 'as2019'));
    assert.ok('as2019' in reverb.TASKS);
});

test('a held preset cannot be loaded, and no default rests on one', () => {
    for (const [bench, id] of [['reverb', 'a2019'], ['reverb', 'dials2019'], ['midi', 'wrong'], ['scope', 'octave'], ['synth', 'judgePad']]) {
        const m = BENCHES[bench];
        const s = m.applyPreset(m.DEFAULT_STATE, id);
        assert.notEqual(s.presetId, id, `${bench}: ${id} loaded through applyPreset`);
    }
    for (const [bench, m] of Object.entries(BENCHES)) {
        const pid = m.DEFAULT_STATE?.presetId;
        if (pid) assert.ok(ids(m.PRESETS).includes(pid), `${bench}: default preset ${pid} is not visible`);
    }
});

test('emptying HELD restores every task and preset', () => {
    for (const [bench, m] of Object.entries(BENCHES)) {
        const tasks = tasksOf(m);
        assert.equal(hideHeld(bench, m.ALL_PRESETS, { tasks, held: [] }).length, m.ALL_PRESETS.length, `${bench}: presets`);
        if (m.ALL_TASKS) assert.equal(Object.keys(hideHeld(bench, m.ALL_TASKS, { held: [] })).length, Object.keys(m.ALL_TASKS).length, `${bench}: tasks`);
    }
    for (const x of HELD_ITEMS) assert.ok(!isTextHeld(x.bench, x.id, []), `${x.bench}/${x.id} still held with HELD empty`);
    assert.ok(isTextHeld('comp', 'gateThresholdPrompt'));
    assert.equal(HELD.length, 1);
});

// Rendered data never cites a paper: no year next to "paper", "AS" or a
// question number, no question numbers, no examiners. `cite`, `source`
// (a citation) and ids are data for the switch, never shown.
const CITE_RX = /\b(19|20)\d\d\b.*\b(paper|AS|Q\d)|\bQ\d+\(|examiner/i;
const SKIP = new Set(['cite', 'source', 'id', 'task', 'set', 'values']);
function strings(x, out = [], key = '') {
    if (typeof x === 'string') out.push([key, x]);
    else if (Array.isArray(x)) x.forEach((v) => strings(v, out, key));
    else if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) if (!SKIP.has(k)) strings(v, out, k);
    return out;
}

test('no preset or task string cites a paper, a question number or an examiner', () => {
    for (const [bench, m] of Object.entries(BENCHES)) {
        for (const [key, s] of [...strings(m.ALL_PRESETS), ...strings(m.ALL_TASKS || {})]) {
            assert.ok(!CITE_RX.test(s), `${bench}.${key}: "${s}"`);
        }
    }
});
