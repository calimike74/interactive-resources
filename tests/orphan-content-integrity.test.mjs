import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getLearnTopicIds } from '../lib/learn/topics/index.js';
import { getAllTopicIds } from '../lib/topics.js';

// WO-11: the defect this test exists to catch — lib/learn/topics/recording.js
// and lib/questions/recording.json stayed keyed to the 'recording' band id
// after WO-02 dissolved that band, and nothing cross-validated the key
// against lib/topics.js. Both files became unreachable via navigation with
// nothing breaking loudly (see
// Planning-and-Admin/Interactive-Resources-Upgrade/WO-11-recording-content-rehome.md).
// This is the test that would have caught it.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QUESTIONS_INDEX = path.join(__dirname, '..', 'lib', 'questions', 'index.js');

// lib/questions/index.js imports each bank via a bare `import x from './x.json'`
// with no `type: 'json'` attribute — Next.js's bundler accepts that, but
// Node's own ESM loader (used by this plain `node --test` run) rejects it
// (ERR_IMPORT_ATTRIBUTE_MISSING), so importing that module here would crash
// the whole suite before any test runs. Read the registry off its source
// text instead, mirroring the identical workaround already used in
// question-banks.test.mjs's getRegisteredTopicIds().
function getRegisteredQuestionTopicIds() {
    const indexSource = fs.readFileSync(QUESTIONS_INDEX, 'utf8');
    const blockMatch = indexSource.match(/const banks = \{([\s\S]*?)\n\};/);
    assert.ok(blockMatch, 'could not locate "const banks = { ... };" block in lib/questions/index.js — has its shape changed?');
    const keyPattern = /^\s*(?:'([^']+)'|"([^"]+)"|([A-Za-z_$][\w$]*))\s*:/gm;
    const ids = [];
    let match;
    while ((match = keyPattern.exec(blockMatch[1])) !== null) {
        ids.push(match[1] ?? match[2] ?? match[3]);
    }
    return ids;
}

test('every Learn topic key corresponds to a live band id in lib/topics.js', () => {
    const bandIds = new Set(getAllTopicIds());
    const orphans = getLearnTopicIds().filter(id => !bandIds.has(id));
    assert.deepStrictEqual(
        orphans,
        [],
        `Learn topic(s) keyed to a non-existent band id (orphaned by a topics.js restructure): ${orphans.join(', ')}`
    );
});

test('every question bank key corresponds to a live band id in lib/topics.js', () => {
    const bandIds = new Set(getAllTopicIds());
    const orphans = getRegisteredQuestionTopicIds().filter(id => !bandIds.has(id));
    assert.deepStrictEqual(
        orphans,
        [],
        `Question bank(s) keyed to a non-existent band id (orphaned by a topics.js restructure): ${orphans.join(', ')}`
    );
});
