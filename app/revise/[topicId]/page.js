import { getAllTopicIds, getTopic } from '@/lib/topics';
import RevisePageClient from './RevisePageClient';

export function generateStaticParams() {
    return getAllTopicIds().map(id => ({ topicId: id }));
}

export async function generateMetadata({ params }) {
    const { topicId } = await params;
    const topic = getTopic(topicId);

    if (!topic) {
        return { title: 'Topic Not Found' };
    }

    return {
        title: `Revise: ${topic.name}`,
        description: `Revision quiz for ${topic.name} — test your knowledge with multiple choice, numeric, and short answer questions.`,
    };
}

export default async function RevisePage({ params }) {
    const { topicId } = await params;
    const topic = getTopic(topicId);

    if (!topic) {
        return <div>Topic not found</div>;
    }

    return <RevisePageClient topic={topic} />;
}
