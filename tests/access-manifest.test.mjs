import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getAllResources, resourceExists } from '../lib/resources/index.js';
import { getAllTopicIds } from '../lib/topics.js';
import {
    FREE_RESOURCES,
    FREE_TOPIC_PAGES,
    FREE_TOPICS,
    TOPIC_LABEL_MISMATCHES,
    isResourceFree,
} from '../lib/access.js';

test('every free resource id exists in the registry', () => {
    for (const id of FREE_RESOURCES) {
        assert.ok(resourceExists(id), `free resource "${id}" is not in the registry — a rename would silently drop it from the free tier`);
    }
});

test('no duplicates in the free set', () => {
    assert.equal(new Set(FREE_RESOURCES).size, FREE_RESOURCES.length, 'FREE_RESOURCES contains a duplicate id');
});

test('every free topic page exists', () => {
    const ids = getAllTopicIds();
    for (const t of FREE_TOPIC_PAGES) {
        assert.ok(ids.includes(t), `free topic page "${t}" is not a known topic id`);
    }
});

test('the free set covers all three chosen topics', () => {
    const resources = getAllResources();
    for (const { spec, name } of FREE_TOPICS) {
        const covered = FREE_RESOURCES.some((id) => {
            const r = resources.find((x) => x.id === id);
            return r && (r.topic || '').startsWith(spec);
        });
        assert.ok(covered, `no free resource is tagged with spec ${spec} (${name}) — the topic would be free in name only`);
    }
});

// The label mismatches were corrected on 2026-07-30, so this list is now
// empty and lib/spec-topics.js guards the labels instead. Kept as an assertion
// rather than deleted: if anyone repopulates it, that means drift came back and
// the reasoning in lib/access.js needs rereading.
test('the topic-label mismatch list is still empty', () => {
    assert.deepEqual(TOPIC_LABEL_MISMATCHES, [], 'topic label drift has returned — see lib/spec-topics.js');
});

test('patch-bay-simulator is not free', () => {
    // It was once labelled "2.5 Recording" while 2.5 is Numeracy, which would
    // have swept a signal-routing tool into the free numeracy set. The label is
    // fixed now, but the assertion is cheap and the tool still is not free.
    assert.equal(isResourceFree('patch-bay-simulator'), false, 'patch-bay-simulator is not a numeracy tool and must not be free');
});
