import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildAdditiveCopyMarkdown } from '../lib/copy-for-ai.js';

// WO-07: additive gains the same Copy-for-AI facility subtractive already
// has. The builder must carry the actual harmonic recipe and stay
// DAW-neutral (the prompt layer already is — this pins the new builder to
// the same standard).

const RECIPE = {
    amps: [1, 0, 0.33, 0, 0.2, 0, 0.14, 0],
    signs: [1, 1, 1, 1, 1, 1, 1, 1],
};

test('the additive builder lists every non-zero harmonic with its level', () => {
    const md = buildAdditiveCopyMarkdown({ ...RECIPE, mode: 'daw' });
    assert.ok(md.includes('additive synthesis'), 'names the technique');
    assert.ok(/Harmonic 1[^\n]*100%/.test(md), 'fundamental at 100%');
    assert.ok(/Harmonic 3[^\n]*33%/.test(md), 'third harmonic level');
    assert.ok(/Harmonic 7[^\n]*14%/.test(md), 'seventh harmonic level');
    assert.ok(!/Harmonic 2[^\n]*%/.test(md.split('# What I need help with')[0].replace(/Harmonic 2[^\n]*silent/g, '')), 'silent harmonics are not listed with a level');
});

test('an inverted harmonic is labelled as inverted', () => {
    const md = buildAdditiveCopyMarkdown({ amps: [1, 0.5, 0, 0, 0, 0, 0, 0], signs: [1, -1, 1, 1, 1, 1, 1, 1] });
    assert.ok(/Harmonic 2[^\n]*inverted/.test(md));
});

test('the builder stays DAW-neutral and ends with a prompt section', () => {
    const md = buildAdditiveCopyMarkdown({ ...RECIPE, mode: 'daw' });
    assert.ok(!/Ableton|Logic Pro/.test(md), 'no DAW named by default');
    assert.ok(md.includes('# What I need help with'));
});
