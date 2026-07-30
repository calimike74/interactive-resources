import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { getAllResources } from '../lib/resources/index.js';
import { SPEC_TOPICS, NON_SPEC_TOPICS, KNOWN_UNRESOLVED, isValidTopic } from '../lib/spec-topics.js';

const CANON_DIR = '/Users/mikelehnert/Obsidian/Professional/Curriculum-Topics';

test('every resource topic is a known label', () => {
    for (const r of getAllResources()) {
        assert.ok(
            isValidTopic(r.topic),
            `resource "${r.id}" has topic "${r.topic}", which is not a spec topic. ` +
            `Spec numbers on the page are what a head of department checks first — ` +
            `add it to lib/spec-topics.js or correct it.`
        );
    }
});

test('every relatedTopics entry is a known label', () => {
    for (const r of getAllResources()) {
        for (const t of r.relatedTopics || []) {
            assert.ok(isValidTopic(t), `resource "${r.id}" lists relatedTopic "${t}", which is not a known label`);
        }
    }
});

// The known-debt list must only shrink. If someone adds a new bad label and
// then whitelists it, this fails.
test('the unresolved-label list has not grown', () => {
    assert.ok(
        KNOWN_UNRESOLVED.length <= 2,
        `KNOWN_UNRESOLVED has grown to ${KNOWN_UNRESOLVED.length}. It is debt awaiting a ` +
        `curriculum decision, not a place to park new bad labels.`
    );
});

test('every unresolved label is actually still in use', () => {
    const inUse = new Set();
    for (const r of getAllResources()) {
        inUse.add(r.topic);
        for (const t of r.relatedTopics || []) inUse.add(t);
    }
    for (const label of KNOWN_UNRESOLVED) {
        assert.ok(inUse.has(label), `"${label}" is listed as unresolved debt but nothing uses it — delete it from KNOWN_UNRESOLVED`);
    }
});

// The vault is the canonical list. If it changes, this file must follow.
test('SPEC_TOPICS still matches the Curriculum-Topics folders', () => {
    let folders;
    try {
        folders = readdirSync(CANON_DIR, { withFileTypes: true })
            .filter((d) => d.isDirectory() && /^\d+\.\d+\s/.test(d.name))
            .map((d) => d.name)
            .sort();
    } catch {
        return; // vault not mounted (CI); the other tests still hold
    }
    const mine = [...SPEC_TOPICS].sort();
    const missing = folders.filter((f) => !mine.includes(f));
    const extra = mine.filter((m) => !folders.includes(m));
    assert.deepEqual(
        { missing, extra },
        { missing: [], extra: [] },
        'lib/spec-topics.js has drifted from Professional/Curriculum-Topics/ — the vault wins'
    );
});

test('non-spec labels are not accidentally spec-shaped duplicates', () => {
    for (const n of NON_SPEC_TOPICS) {
        const m = n.match(/^(\d+\.\d+)\s/);
        if (!m) continue;
        assert.ok(
            !SPEC_TOPICS.some((s) => s.startsWith(m[1] + ' ')),
            `non-spec label "${n}" uses number ${m[1]}, which is a real spec number — that is exactly the collision this file prevents`
        );
    }
});
