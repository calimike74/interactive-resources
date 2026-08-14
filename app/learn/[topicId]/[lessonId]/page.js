import { getLearnLesson, getLearnLessons, getAllLearnPaths } from '@/lib/learn/topics';
import { getResource, resourceExists } from '@/lib/resources';
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
        title: `${lesson.title}: ${lesson.subtitle}`,
        description: lesson.description,
    };
}

export default async function LearnLessonPage({ params }) {
    const { topicId, lessonId } = await params;
    const lesson = getLearnLesson(topicId, lessonId);

    if (!lesson) {
        return <div>Lesson not found</div>;
    }

    const chapters = getLearnLessons(topicId);
    const index = chapters.findIndex(c => c.id === lessonId);
    const next = index >= 0 && index < chapters.length - 1 ? chapters[index + 1] : null;

    // Final-chapter outro targets: a designated resource if the course names one,
    // otherwise the topic page's Explore section.
    const outroResource = !next && lesson.outroResourceId && resourceExists(lesson.outroResourceId)
        ? getResource(lesson.outroResourceId)
        : null;

    const outro = next
        ? { nextHref: `/learn/${topicId}/${next.id}`, nextLabel: `Chapter ${next.chapterNumber ?? index + 2}: ${next.title}` }
        : {
            exploreHref: outroResource ? `/${outroResource.id}` : `/topic/${topicId}#explore`,
            exploreLabel: outroResource ? outroResource.title : 'the interactive tools',
            reviseHref: `/topic/${topicId}#revise`,
        };

    return <LearnLessonClient topic={lesson} parentTopicId={topicId} outro={outro} />;
}
