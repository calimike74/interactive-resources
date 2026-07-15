import { notFound } from 'next/navigation';
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
        notFound();
    }

    // Resolve resource metadata for this topic, split by door
    const all = topic.resourceIds
        .filter(id => resourceExists(id))
        .map(id => getResource(id));
    const exploreResources = all.filter(r => r.kind === 'sandbox' || r.kind === 'interface');
    const reviseResources = all.filter(r => r.kind === 'retrieval' || r.kind === 'practice');

    return <TopicPageClient topic={topic} resources={exploreResources} reviseResources={reviseResources} />;
}
