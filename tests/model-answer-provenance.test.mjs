import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// WO-09 Tier 1: no un-sourced model answer or examiner-voice claim anywhere
// on the site. Mike's ruling (2026-08-12): "Where is this model answer
// from?" — every reveal must say. This is a copy guard in the style of the
// map-room copy tests: it pins the provenance line into the source of every
// component that reveals a model answer or speaks in the examiner's voice.
//
// Two idioms, used honestly:
//   - "written against the Edexcel mark scheme" — for authored model
//     answers/guidance NOT derived from a verified report analysis
//     (never claim examiner-report grounding that didn't happen — that
//     re-grounding is Tier 2)
//   - "Principal Examiner" — for the hint badge, whose data file
//     (lib/examiner-hints.js) genuinely is curated from the 2025 reports

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

const MARK_SCHEME_LINE = /written against the Edexcel mark scheme/;

for (const file of [
    'components/resources/SamplingPlayground.jsx',
    'components/resources/StereoRecordingEssay.jsx',
    'components/resources/ProductionAnalysis.jsx',
    'components/resources/EssayScaffold.jsx',
    'components/resources/EssayScaffoldPractice.jsx',
]) {
    test(`${file} carries a visible provenance line`, () => {
        assert.ok(
            MARK_SCHEME_LINE.test(read(file)),
            `${file} must contain the "written against the Edexcel mark scheme" provenance line`,
        );
    });
}

test('the examiner hint badge names its real source (2025 Principal Examiner reports)', () => {
    const src = read('components/ui/ExaminerHintBadge.jsx');
    assert.ok(
        /Principal Examiner/.test(src),
        'ExaminerHintBadge.jsx must display where "Examiner says" comes from',
    );
});
