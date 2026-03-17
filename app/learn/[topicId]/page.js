import { getLearnLessons, getLearnResources, getLearnTopicIds } from '@/lib/learn/topics';
import { getTopic } from '@/lib/topics';
import LearnPickerClient from './LearnPickerClient';

export function generateStaticParams() {
    return getLearnTopicIds().map(id => ({ topicId: id }));
}

export async function generateMetadata({ params }) {
    const { topicId } = await params;
    const topic = getTopic(topicId);

    return {
        title: topic ? `Learn — ${topic.name}` : 'Learn',
        description: topic ? `Guided lessons for ${topic.name}` : 'Guided lessons',
    };
}

export default async function LearnPickerPage({ params }) {
    const { topicId } = await params;
    const topic = getTopic(topicId);
    const lessons = getLearnLessons(topicId);
    const resources = getLearnResources(topicId);

    if (!topic) {
        return <div>Topic not found</div>;
    }

    return <LearnPickerClient topic={topic} lessons={lessons} resources={resources} />;
}
