'use client';

import { Suspense } from 'react';
import LearnTopicPage from '@/components/learn/LearnTopicPage';

export default function LearnPageClient({ topic, parentTopicId }) {
    return (
        <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f5f4f2' }} />}>
            <LearnTopicPage topic={topic} parentTopicId={parentTopicId} />
        </Suspense>
    );
}
