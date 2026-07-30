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

// The reason FREE_RESOURCES is an explicit list rather than a topic-prefix
// match. If this ever stops failing, the mislabelled resources have been
// renumbered and the derived approach becomes safe.
test('mislabelled topics are still mislabelled, so the allow-list is still required', () => {
    const resources = getAllResources();
    for (const m of TOPIC_LABEL_MISMATCHES.filter((x) => x.kind === 'WRONG NUMBER')) {
        for (const id of m.resources) {
            const r = resources.find((x) => x.id === id);
            if (!r) continue;
            assert.equal(r.topic, m.found, `"${id}" topic label changed from "${m.found}" to "${r.topic}" — update TOPIC_LABEL_MISMATCHES in lib/access.js`);
        }
    }
});

test('a wrongly-numbered resource has not leaked into the free set', () => {
    // patch-bay-simulator is labelled "2.5 Recording"; 2.5 is Numeracy. A
    // prefix match on "2.5" would have made it free. It must not be.
    assert.equal(isResourceFree('patch-bay-simulator'), false, 'patch-bay-simulator is not a numeracy tool and must not be free');
});
