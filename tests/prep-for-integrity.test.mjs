import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getAllResources, resourceExists } from '../lib/resources/index.js';

// Regression test for the dead assessment-link defect (WO-01): every
// `prepFor` entry must resolve to a resource actually registered in
// lib/resources/index.js. A prepFor slug that doesn't exist becomes a
// dead "Take the Assessment" link on the live site.
test('every prepFor entry resolves to a registered resource', () => {
    const resources = getAllResources();
    const broken = [];

    for (const r of resources) {
        if (!r.prepFor || r.prepFor.length === 0) continue;
        for (const targetId of r.prepFor) {
            if (!resourceExists(targetId)) {
                broken.push(`"${r.id}" has prepFor "${targetId}" — no such resource`);
            }
        }
    }

    assert.deepEqual(broken, [], `dead prepFor links found:\n${broken.join('\n')}`);
});
