'use client';
// A student's own quiz record for this topic, read from their browser (no account).
// Shows nothing until they have taken the quiz at least once.
import { useEffect, useState } from 'react';
import { getQuizProgress } from '@/lib/quiz-persistence';
import s from '@/app/topic/[topicId]/topic.module.css';

export default function QuizProgress({ topicId }) {
    const [p, setP] = useState(null);
    useEffect(() => {
        let token = null;
        try { token = localStorage.getItem('revision_token'); } catch { /* storage blocked */ }
        if (token) getQuizProgress(token, topicId).then(setP).catch(() => {});
    }, [topicId]);
    if (!p) return null;

    const pct = (v) => (v === null || v === undefined ? '–' : `${v}%`);
    const date = p.lastDate ? new Date(p.lastDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '–';
    return (
        <dl className={s.progress} aria-label="Your record on this quiz">
            <div><dt>Best</dt><dd>{pct(p.bestScore)}</dd></div>
            <div><dt>Last</dt><dd>{pct(p.lastScore)}</dd></div>
            <div><dt>{p.attempts === 1 ? 'Go' : 'Goes'}</dt><dd>{p.attempts}</dd></div>
            <div><dt>Last tried</dt><dd>{date}</dd></div>
        </dl>
    );
}
