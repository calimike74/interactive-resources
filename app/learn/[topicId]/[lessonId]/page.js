import { getLearnLesson, getAllLearnPaths } from '@/lib/learn/topics';
import LearnLessonClient from './LearnLessonClient';

export function generateStaticParams() {
    return getAllLearnPaths();
}

export async function generateMetadata({ params }) {
    const { topicId, lessonId } = await params;
    const lesson = getLearnLesson(topicId, lessonId);

    if (!lesson) {
        return { title: 'Lesson Not Found' };
    }

    return {
        title: `${lesson.title} — ${lesson.subtitle}`,
        description: lesson.description,
    };
}

export default async function LearnLessonPage({ params }) {
    const { topicId, lessonId } = await params;
    const lesson = getLearnLesson(topicId, lessonId);

    if (!lesson) {
        return <div>Lesson not found</div>;
    }

    return <LearnLessonClient topic={lesson} parentTopicId={topicId} />;
}
