import { getAllTopicIds, getTopic } from '@/lib/topics';
import ExamModeClient from './ExamModeClient';

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
        title: `Exam: ${topic.name}`,
        description: `Timed exam mode for ${topic.name}: test under pressure with a countdown timer.`,
    };
}

export default async function ExamPage({ params }) {
    const { topicId } = await params;
    const topic = getTopic(topicId);

    if (!topic) {
        return <div>Topic not found</div>;
    }

    return <ExamModeClient topic={topic} />;
}
