import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getProgress, markChapterComplete, firstIncompleteChapter } from '../lib/learn/course-progress.js';

function memoryStorage() {
    const m = new Map();
    return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
}

test('progress round-trips and finds first incomplete chapter', () => {
    const storage = memoryStorage();
    const chapters = ['waveforms', 'subtractive', 'envelopes'];

    assert.deepEqual(getProgress('synthesis', storage), {});
    assert.equal(firstIncompleteChapter('synthesis', chapters, storage), 'waveforms');

    markChapterComplete('synthesis', 'waveforms', storage);
    assert.equal(getProgress('synthesis', storage).waveforms, 'completed');
    assert.equal(firstIncompleteChapter('synthesis', chapters, storage), 'subtractive');

    markChapterComplete('synthesis', 'subtractive', storage);
    markChapterComplete('synthesis', 'envelopes', storage);
    assert.equal(firstIncompleteChapter('synthesis', chapters, storage), null);
});

test('corrupt stored JSON degrades to empty progress', () => {
    const storage = memoryStorage();
    storage.setItem('learn-progress:synthesis', '{not json');
    assert.deepEqual(getProgress('synthesis', storage), {});
});
