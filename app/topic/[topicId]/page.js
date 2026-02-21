import { getAllTopicIds, getTopic } from '@/lib/topics';
import { getResource, resourceExists } from '@/lib/resources';
import TopicPageClient from './TopicPageClient';

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
        title: `${topic.specRef} ${topic.name}`,
        description: topic.description,
    };
}

export default async function TopicPage({ params }) {
    const { topicId } = await params;
    const topic = getTopic(topicId);

    if (!topic) {
        return <div>Topic not found</div>;
    }

    // Resolve resource metadata for this topic
    const resources = topic.resourceIds
        .filter(id => resourceExists(id))
        .map(id => getResource(id));

    return <TopicPageClient topic={topic} resources={resources} />;
}
