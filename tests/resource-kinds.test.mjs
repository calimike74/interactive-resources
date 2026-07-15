import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getAllResources } from '../lib/resources/index.js';

const VALID_KINDS = ['sandbox', 'interface', 'retrieval', 'practice'];

test('every registered resource declares a valid kind', () => {
    const resources = getAllResources();
    assert.ok(resources.length >= 51, `expected >= 51 resources, got ${resources.length}`);
    for (const r of resources) {
        assert.ok(
            VALID_KINDS.includes(r.kind),
            `resource "${r.id}" has kind "${r.kind}" — must be one of ${VALID_KINDS.join(', ')}`
        );
    }
});
