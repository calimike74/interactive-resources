import test from 'node:test';
import assert from 'node:assert/strict';
import { stageShape } from '../lib/bench/delay-model.js';

// 27 Aug 2026: the open hi-hat samples decode to 1.52 s and 1.54 s, and the
// stage's "over 1.5 s means a phrase" guess drew them with the vocal's
// envelope. What a step draws is the pattern's call, never the sample's length.
test('a hit is a bar however long its sample rings', () => {
    assert.equal(stageShape({ s: 14, name: 'funk-openhat', g: 0.45 }), 'bar');
    assert.equal(stageShape({ s: 30, name: '808-openhat', g: 0.5 }), 'bar');
    assert.equal(stageShape({ s: 0, name: 'stab-brass', g: 1 }), 'bar');
});

test('only a step the pattern marks as a phrase keeps its envelope', () => {
    assert.equal(stageShape({ s: 0, name: 'vocal', g: 1, phrase: true }), 'envelope');
    assert.equal(stageShape({ s: 0, name: 'vocal', g: 1 }), 'bar');
});
