import { getLearnTopic, getLearnTopicIds } from '@/lib/learn/topics';
import { getTopic } from '@/lib/topics';
import LearnPageClient from './LearnPageClient';

export function generateStaticParams() {
    return getLearnTopicIds().map(id => ({ topicId: id }));
}

export async function generateMetadata({ params }) {
    const { topicId } = await params;
    const learnTopic = getLearnTopic(topicId);

    if (!learnTopic) {
        return { title: 'Lesson Not Found' };
    }

    return {
        title: `${learnTopic.title} — ${learnTopic.subtitle}`,
        description: learnTopic.description,
    };
}

export default async function LearnPage({ params }) {
    const { topicId } = await params;
    const learnTopic = getLearnTopic(topicId);

    if (!learnTopic) {
        return <div>Lesson not found</div>;
    }

    return <LearnPageClient topic={learnTopic} parentTopicId={topicId} />;
}
