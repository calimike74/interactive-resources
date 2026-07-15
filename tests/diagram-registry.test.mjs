import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getLearnTopicIds, getLearnLessons } from '../lib/learn/topics/index.js';

test('every row animation id is registered in the diagrams index', () => {
    const indexSrc = readFileSync(new URL('../components/learn/diagrams/index.js', import.meta.url), 'utf8');
    for (const topicId of getLearnTopicIds()) {
        for (const chapter of getLearnLessons(topicId)) {
            for (const row of chapter.rows) {
                if (!row.animation) continue;
                assert.ok(
                    indexSrc.includes(`'${row.animation}'`),
                    `${topicId}/${chapter.id}/${row.id}: animation "${row.animation}" not registered`
                );
            }
        }
    }
});
