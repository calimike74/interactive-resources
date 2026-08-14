import { getLearnLessons, getLearnResources, getLearnRationale, getLearnTopicIds } from '@/lib/learn/topics';
import { getTopic } from '@/lib/topics';
import LearnPickerClient from './LearnPickerClient';

export function generateStaticParams() {
    return getLearnTopicIds().map(id => ({ topicId: id }));
}

export async function generateMetadata({ params }) {
    const { topicId } = await params;
    const topic = getTopic(topicId);

    return {
        title: topic ? `Walkthrough: ${topic.name}` : 'Walkthrough',
        description: topic ? `Step-by-step walkthrough of ${topic.name}` : 'Step-by-step topic walkthroughs',
    };
}

export default async function LearnPickerPage({ params }) {
    const { topicId } = await params;
    const topic = getTopic(topicId);
    const lessons = getLearnLessons(topicId);
    const resources = getLearnResources(topicId);
    const rationale = getLearnRationale(topicId);

    if (!topic) {
        return <div>Topic not found</div>;
    }

    return <LearnPickerClient topic={topic} lessons={lessons} resources={resources} rationale={rationale} />;
}
