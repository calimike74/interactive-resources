import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ALL_EXPANSIONS } from '../lib/learn/expansions.js';
import { getLearnTopicIds, getLearnLessons } from '../lib/learn/topics/index.js';

// Pre-existing orphans surfaced by this automated sweep (2026-07-17, wave-2 Task 1).
// This array is exact-content-asserted below: it cannot grow silently — a new
// entry here always requires a dated comment explaining why it's kept.
const KNOWN_ORPHANS = [
    // 2026-07-17: synthesis/envelopes/filter-envelope's description reads
    // `the classic "wah" of analogue synths` — the straight quotes around "wah"
    // break the contiguous substring match against this trigger. Pre-existing
    // content drift from wave 1, not introduced by this task; not fixed here
    // per the brief ("do not fix content in this task").
    'classic wah of analogue synths',
];

// One text unit per chapter description, and one per row (heading + description
// combined, matching the brief's "row's visible text" definition). Global across
// all wired topics: ALL_EXPANSIONS carries no per-entry topic field and
// components/learn/LearnSpineLayout.js:252 applies it uniformly to every row
// regardless of which topic that row belongs to, so a trigger only needs to be
// reachable somewhere in the wired corpus, not necessarily its "home" topic.
function buildCorpus() {
    const units = [];
    for (const topicId of getLearnTopicIds()) {
        for (const chapter of getLearnLessons(topicId)) {
            units.push({ scope: `${topicId}/${chapter.id} (chapter description)`, text: chapter.description || '' });
            for (const row of chapter.rows) {
                units.push({ scope: `${topicId}/${chapter.id}/${row.id}`, text: `${row.heading} ${row.description}` });
            }
        }
    }
    return units;
}

// Does `shorter` occur in `text` (case-insensitive) at a position not fully
// covered by an occurrence of `longer`? Mirrors findExpansion/getExpandableWordIndices'
// longest-substring-wins rule: `shorter` is only reachable where it isn't shadowed by `longer`.
function hasFreeOccurrence(shorter, longer, text) {
    const lowerText = text.toLowerCase();
    const s = shorter.toLowerCase();
    const l = longer.toLowerCase();

    const longerRanges = [];
    let li = lowerText.indexOf(l);
    while (li !== -1) {
        longerRanges.push([li, li + l.length]);
        li = lowerText.indexOf(l, li + 1);
    }

    let si = lowerText.indexOf(s);
    while (si !== -1) {
        const sEnd = si + s.length;
        const covered = longerRanges.some(([start, end]) => si >= start && sEnd <= end);
        if (!covered) return true;
        si = lowerText.indexOf(s, si + 1);
    }
    return false;
}

test('every expansion trigger is reachable in at least one wired row or chapter description', () => {
    const corpus = buildCorpus();
    const orphans = [];
    for (const exp of ALL_EXPANSIONS) {
        const trigger = exp.trigger.toLowerCase();
        const found = corpus.some(({ text }) => text.toLowerCase().includes(trigger));
        if (!found) orphans.push(exp.trigger);
    }
    assert.deepStrictEqual(
        [...orphans].sort(),
        [...KNOWN_ORPHANS].sort(),
        'orphaned expansion trigger(s) found that are not in KNOWN_ORPHANS (or KNOWN_ORPHANS contains a trigger that is no longer orphaned) — see diff above'
    );
});

test('no expansion trigger is a substring collision that leaves a shorter trigger unreachable', () => {
    const corpus = buildCorpus();
    const collisions = [];
    for (const short of ALL_EXPANSIONS) {
        for (const long of ALL_EXPANSIONS) {
            if (short === long) continue;
            const s = short.trigger.toLowerCase();
            const l = long.trigger.toLowerCase();
            if (s.length >= l.length) continue;
            if (!l.includes(s)) continue; // not a strict-substring relationship

            const rowsWhereShortMatches = corpus.filter(({ text }) => text.toLowerCase().includes(s));
            if (rowsWhereShortMatches.length === 0) continue; // orphaned entirely — caught by the orphan guard above

            const everWins = rowsWhereShortMatches.some(({ text }) => hasFreeOccurrence(s, l, text));
            if (!everWins) {
                collisions.push(
                    `"${short.trigger}" is a substring of "${long.trigger}" and never wins (always shadowed by the longer match) in: ${rowsWhereShortMatches.map(r => r.scope).join(', ')}`
                );
            }
        }
    }
    assert.deepStrictEqual(collisions, [], collisions.join('\n'));
});
