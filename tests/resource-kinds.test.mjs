import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getAllResources } from '../lib/resources/index.js';

// 'lab' added 2026-08-12 with the INTERACTIVE-BAR genre: a guided
// isolate-then-combine arc that ENDS in a sandbox, distinct from a
// resource that is only a sandbox.
const VALID_KINDS = ['sandbox', 'interface', 'retrieval', 'practice', 'lab'];

test('every registered resource declares a valid kind', () => {
    const resources = getAllResources();
    // WO-08 (2026-08-12) retired eq-assessment-prototype + patch-bay-simulator,
    // dropping the count from 52 to 50.
    assert.ok(resources.length >= 49, `expected >= 49 resources, got ${resources.length}`);
    for (const r of resources) {
        assert.ok(
            VALID_KINDS.includes(r.kind),
            `resource "${r.id}" has kind "${r.kind}" — must be one of ${VALID_KINDS.join(', ')}`
        );
    }
});
