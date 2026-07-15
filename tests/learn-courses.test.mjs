import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getLearnTopicIds, getLearnLessons } from '../lib/learn/topics/index.js';

test('every learn topic is a well-formed course', () => {
    for (const topicId of getLearnTopicIds()) {
        const chapters = getLearnLessons(topicId);
        assert.ok(chapters.length >= 1, `${topicId}: no chapters`);
        const ids = chapters.map(c => c.id);
        assert.equal(new Set(ids).size, ids.length, `${topicId}: duplicate chapter ids`);
        chapters.forEach((c, i) => {
            const num = c.chapterNumber ?? i + 1;
            assert.equal(num, i + 1, `${topicId}/${c.id}: chapterNumber ${num} out of order`);
            assert.ok(Array.isArray(c.rows) && c.rows.length > 0, `${topicId}/${c.id}: no rows`);
            for (const row of c.rows) {
                assert.ok(row.id && row.heading && row.description, `${topicId}/${c.id}/${row.id}: incomplete row`);
            }
        });
    }
});

test('every chapter of a multi-chapter learn topic has an exam anchor', () => {
    for (const topicId of getLearnTopicIds()) {
        const chapters = getLearnLessons(topicId);
        if (chapters.length <= 1) continue; // single-chapter legacy topics (eq/dynamics/delay) are exempt
        for (const c of chapters) {
            assert.ok(c.examAnchor, `${topicId}/${c.id}: missing examAnchor`);
            assert.ok(
                typeof c.examAnchor.question === 'string' && c.examAnchor.question.trim().length > 0,
                `${topicId}/${c.id}: examAnchor.question is empty`
            );
            assert.ok(
                Array.isArray(c.examAnchor.modelPoints) && c.examAnchor.modelPoints.length > 0,
                `${topicId}/${c.id}: examAnchor.modelPoints is empty`
            );
        }
    }
});
