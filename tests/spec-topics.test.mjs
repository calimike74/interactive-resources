import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { getAllResources } from '../lib/resources/index.js';
import { SPEC_TOPICS, NON_SPEC_TOPICS, SPEC_UMBRELLA_TOPICS, isValidTopic } from '../lib/spec-topics.js';

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

// The umbrella list is a narrow exemption, not a bypass for the folder diff
// above. Only 1.12 is subdivided in Curriculum-Topics, so only 1.12 may appear
// here — anything else means someone parked a bad label instead of fixing it.
test('umbrella labels only exist for a spec point the folders subdivide', () => {
    for (const label of SPEC_UMBRELLA_TOPICS) {
        assert.match(
            label,
            /^1\.12\s/,
            `"${label}" is not a 1.12 label. 1.12 is the only spec point split across ` +
            `several Curriculum-Topics folders, so it is the only one that needs an umbrella name.`
        );
    }
});

// An umbrella nobody cites is just an unused synonym waiting to be mistaken for
// a real topic. If a resource stops citing one, delete it rather than keep it.
test('every umbrella label is actually still in use', () => {
    const inUse = new Set();
    for (const r of getAllResources()) {
        inUse.add(r.topic);
        for (const t of r.relatedTopics || []) inUse.add(t);
    }
    for (const label of SPEC_UMBRELLA_TOPICS) {
        assert.ok(inUse.has(label), `"${label}" is listed as an umbrella label but nothing cites it — delete it from SPEC_UMBRELLA_TOPICS`);
    }
});

// An umbrella is a cross-reference, not a home. A resource's own `topic` must
// name the specific effect it teaches, or the topic pages group four different
// effects under one heading.
test('no resource uses an umbrella label as its own topic', () => {
    for (const r of getAllResources()) {
        assert.ok(
            !SPEC_UMBRELLA_TOPICS.includes(r.topic),
            `resource "${r.id}" has topic "${r.topic}". An umbrella belongs in relatedTopics — ` +
            `name the specific effect (Delay, Distortion, Modulation or Reverb) as the topic.`
        );
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
