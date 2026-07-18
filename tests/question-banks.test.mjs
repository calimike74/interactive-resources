import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getLearnTopicIds } from '../lib/learn/topics/index.js';
import { getAllTopicIds } from '../lib/topics.js';

// Guard test for the nine existing Revise question banks plus the four the
// revise-question-banks plan (docs/superpowers/specs/2026-07-18-revise-question-banks-design.md)
// is about to add. TDD scaffold, written before those four banks exist — see
// KNOWN_MISSING below. Mirrors the KNOWN_ORPHANS exact-assert idiom from
// expansions.test.mjs: nothing here is allowed to drift silently.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QUESTIONS_DIR = path.join(__dirname, '..', 'lib', 'questions');

// lib/questions/index.js re-exports each bank via a bare `import x from
// './x.json'` with no `type: 'json'` attribute. Next.js's bundler accepts
// that, but Node's own ESM loader (which this plain `node --test` run uses)
// rejects it as of Node 22+ (ERR_IMPORT_ATTRIBUTE_MISSING) — importing that
// module here would crash the whole suite before any test runs. So the
// registry is read statically off its source text instead, equivalent to
// `Object.keys(banks)` without ever executing the module. Pre-existing gap,
// unrelated to this task; out of scope to fix (see task report).
function getRegisteredTopicIds() {
    const indexPath = path.join(QUESTIONS_DIR, 'index.js');
    const indexSource = fs.readFileSync(indexPath, 'utf8');
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

const REQUIRED_FIELDS = {
    mcq: ['id', 'type', 'question', 'options', 'correctIndex', 'explanation'],
    numeric: ['id', 'type', 'question', 'answer', 'tolerance', 'unit', 'explanation'],
    short: ['id', 'type', 'question', 'sampleAnswer', 'keyPoints', 'explanation'],
};

const ID_TYPE_SEGMENT = { mcq: 'mcq', numeric: 'num', short: 'short' };

const BANNED_GLYPHS = ['▶', '↔'];

// Every bank in this map declares the type mix it's exact-asserted against.
// All nine current banks use DEFAULT_TYPE_MIX below; a bank only needs an
// entry here when its curriculum genuinely can't support the default.
// 2026-07-18: leads-and-signals lands in task 5 of the revise-question-banks
// plan with a disclosed 12/3/5 deviation — the chapter honestly supports only
// three calculation families (the dBu-ladder differences), so forcing five
// numerics would invent arithmetic the course never taught. Mike can overrule.
const DEFAULT_TYPE_MIX = { mcq: 10, numeric: 5, short: 5 };
const TYPE_MIX = {
    'leads-and-signals': { mcq: 12, numeric: 3, short: 5 },
};
function typeMixFor(topicId) {
    return TYPE_MIX[topicId] ?? DEFAULT_TYPE_MIX;
}

// Learn topics with no question bank yet. Exact-content-asserted below — it
// cannot grow silently, and shrinks to [] as each task below lands a bank.
// 2026-07-18: delay, digital-analogue, distortion and leads-and-signals are
// tasks 2-5 of the revise-question-banks plan (see
// docs/superpowers/specs/2026-07-18-revise-question-banks-design.md) — this
// guard test (task 1) is written before any of the four exist.
const KNOWN_MISSING = ['digital-analogue', 'distortion', 'leads-and-signals'];

// Load every bank file's raw text (for the glyph lint) and parsed content
// (for schema/count checks) up front. Parse failures are collected rather
// than thrown so a broken file surfaces as a normal assertion failure.
const bankFiles = fs.readdirSync(QUESTIONS_DIR).filter(f => f.endsWith('.json')).sort();
const banks = bankFiles.map(filename => {
    const filePath = path.join(QUESTIONS_DIR, filename);
    const raw = fs.readFileSync(filePath, 'utf8');
    const topicId = filename.replace(/\.json$/, '');
    let parsed = null;
    let parseError = null;
    try {
        parsed = JSON.parse(raw);
    } catch (err) {
        parseError = err;
    }
    return { filename, topicId, raw, parsed, parseError };
});

test('every question bank has a valid schema', () => {
    const failures = [];
    for (const bank of banks) {
        if (bank.parseError) {
            failures.push(`${bank.filename}: JSON parse error — ${bank.parseError.message}`);
            continue;
        }
        const { parsed, topicId, filename } = bank;
        if (parsed.topicId !== topicId) {
            failures.push(`${filename}: topicId "${parsed.topicId}" does not match filename (expected "${topicId}")`);
        }
        if (!Array.isArray(parsed.questions)) {
            failures.push(`${filename}: "questions" is not an array`);
            continue;
        }

        const seenIds = new Set();
        const nnByType = { mcq: [], numeric: [], short: [] };

        for (const q of parsed.questions) {
            const scope = `${filename}#${q.id ?? '(no id)'}`;

            if (typeof q.id !== 'string') {
                failures.push(`${scope}: id is missing or not a string`);
            } else if (seenIds.has(q.id)) {
                failures.push(`${scope}: duplicate id`);
            } else {
                seenIds.add(q.id);
            }

            const requiredFields = REQUIRED_FIELDS[q.type];
            if (!requiredFields) {
                failures.push(`${scope}: unknown type "${q.type}"`);
                continue;
            }

            const actualFields = Object.keys(q).sort();
            const expectedFields = [...requiredFields].sort();
            if (actualFields.join(',') !== expectedFields.join(',')) {
                const missing = expectedFields.filter(f => !actualFields.includes(f));
                const extra = actualFields.filter(f => !expectedFields.includes(f));
                failures.push(`${scope}: field mismatch — missing [${missing.join(', ')}], extra [${extra.join(', ')}]`);
            }

            if (q.type === 'mcq') {
                if (!Array.isArray(q.options) || q.options.length !== 4) {
                    failures.push(`${scope}: options must have length 4`);
                }
                if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex > 3) {
                    failures.push(`${scope}: correctIndex must be an integer 0-3`);
                }
            }
            if (q.type === 'short') {
                if (!Array.isArray(q.keyPoints) || q.keyPoints.length === 0) {
                    failures.push(`${scope}: keyPoints must be a non-empty array of strings`);
                }
            }

            const segment = ID_TYPE_SEGMENT[q.type];
            const idMatch = segment && typeof q.id === 'string'
                ? q.id.match(new RegExp(`^${topicId}-${segment}-(\\d{2})$`))
                : null;
            if (!idMatch) {
                failures.push(`${scope}: id does not match expected format "${topicId}-${segment}-NN"`);
            } else {
                nnByType[q.type].push(Number(idMatch[1]));
            }
        }

        for (const [type, nums] of Object.entries(nnByType)) {
            const sorted = [...nums].sort((a, b) => a - b);
            const expectedSeq = sorted.map((_, i) => i + 1);
            if (JSON.stringify(sorted) !== JSON.stringify(expectedSeq)) {
                failures.push(`${filename}: ${type} ids are not sequential 01..N — got [${sorted.join(', ')}]`);
            }
        }
    }
    assert.deepStrictEqual(failures, [], failures.join('\n'));
});

test('every bank has exactly 20 questions matching its declared TYPE_MIX', () => {
    const failures = [];
    for (const bank of banks) {
        if (bank.parseError || !Array.isArray(bank.parsed?.questions)) continue; // reported by the schema test above

        const questions = bank.parsed.questions;
        if (questions.length !== 20) {
            failures.push(`${bank.filename}: expected exactly 20 questions, found ${questions.length}`);
        }

        const mix = typeMixFor(bank.topicId);
        const counts = { mcq: 0, numeric: 0, short: 0 };
        for (const q of questions) {
            if (q.type in counts) counts[q.type] += 1;
        }
        for (const type of Object.keys(mix)) {
            if (counts[type] !== mix[type]) {
                failures.push(`${bank.filename}: expected ${mix[type]} ${type} questions (TYPE_MIX), found ${counts[type]}`);
            }
        }
    }
    assert.deepStrictEqual(failures, [], failures.join('\n'));
});

test('every Learn topic has a question bank, except KNOWN_MISSING', () => {
    const registeredTopicIds = new Set(banks.map(b => b.topicId));
    const missing = getLearnTopicIds().filter(id => !registeredTopicIds.has(id));
    assert.deepStrictEqual(
        [...missing].sort(),
        [...KNOWN_MISSING].sort(),
        'Learn topic(s) missing a question bank that are not in KNOWN_MISSING (or KNOWN_MISSING contains a topic that now has a bank) — see diff above'
    );
});

test('the mixing bank is a known orphan: registered on disk, no Learn topic, no topic page', () => {
    assert.ok(banks.some(b => b.topicId === 'mixing'), 'mixing bank should exist on disk (known-unreachable, not deleted — Mike\'s open decision)');
    assert.ok(!getLearnTopicIds().includes('mixing'), 'mixing should not (yet) have a Learn topic');
    assert.ok(!getAllTopicIds().includes('mixing'), 'mixing should not (yet) have a topic page');
});

test('no bank contains a banned glyph (▶ or ↔ — only ▸/⇄ are permitted)', () => {
    const failures = [];
    for (const bank of banks) {
        for (const glyph of BANNED_GLYPHS) {
            if (bank.raw.includes(glyph)) {
                failures.push(`${bank.filename}: contains banned glyph "${glyph}"`);
            }
        }
    }
    assert.deepStrictEqual(failures, [], failures.join('\n'));
});

test('every bank file on disk is registered in lib/questions/index.js, and vice versa', () => {
    const onDisk = new Set(banks.map(b => b.topicId));
    const registered = new Set(getRegisteredTopicIds());

    const unregistered = [...onDisk].filter(id => !registered.has(id)).sort();
    const noFile = [...registered].filter(id => !onDisk.has(id)).sort();

    assert.deepStrictEqual(unregistered, [], `bank file(s) on disk not registered in the banks map: ${unregistered.join(', ')}`);
    assert.deepStrictEqual(noFile, [], `registry entry/entries with no bank file on disk: ${noFile.join(', ')}`);
});
