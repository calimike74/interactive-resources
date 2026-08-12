import { notFound } from 'next/navigation';
import { getAllTopicIds, getTopic, withComponentPrefix } from '@/lib/topics';
import { getResource, resourceExists } from '@/lib/resources';
import { hasLearnContent } from '@/lib/learn/topics';
import { hasReviseContent } from '@/lib/questions';
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

    const hasAnyContent =
        topic.resourceIds.some(id => resourceExists(id)) ||
        hasLearnContent(topicId) ||
        hasReviseContent(topicId);

    return {
        title: `${withComponentPrefix(topic.specRef)} ${topic.name}`,
        description: topic.description,
        // Placeholder topics have nothing to show yet — keep them out of search indexes
        ...(hasAnyContent ? {} : { robots: { index: false, follow: false } }),
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
