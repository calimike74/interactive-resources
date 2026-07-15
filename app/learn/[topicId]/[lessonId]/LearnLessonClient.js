'use client';

import { Suspense } from 'react';
import LearnTopicPage from '@/components/learn/LearnTopicPage';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function LearnLessonClient({ topic, parentTopicId, outro }) {
    return (
        <>
            <Breadcrumbs />
            <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f5f4f2' }} />}>
                <LearnTopicPage topic={topic} parentTopicId={parentTopicId} outro={outro} />
            </Suspense>
        </>
    );
}
