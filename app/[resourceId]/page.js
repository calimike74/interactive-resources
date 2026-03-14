import { getResource, resourceExists, getAllResources } from '@/lib/resources';
import { ResourceJsonLd } from '@/components/ResourceJsonLd';
import ResourcePageClient from './ResourcePageClient';

export function generateStaticParams() {
    return getAllResources().map(r => ({ resourceId: r.id }));
}

export async function generateMetadata({ params }) {
    const { resourceId } = await params;

    if (!resourceExists(resourceId)) {
        return {
            title: 'Resource Not Found',
        };
    }

    const resource = getResource(resourceId);

    return {
        title: resource.title,
        description: resource.description,
        keywords: resource.keywords,
        openGraph: {
            title: resource.title,
            description: resource.description,
            url: `https://resources.musictechstudio.co.uk/${resource.id}`,
            siteName: 'Interactive Resources | A-Level Music Technology',
            locale: 'en_GB',
            type: 'article',
        },
        twitter: {
            card: 'summary',
            title: resource.title,
            description: resource.description,
        },
    };
}

export default async function ResourcePage({ params }) {
    const { resourceId } = await params;
    const resource = resourceExists(resourceId) ? getResource(resourceId) : null;

    return (
        <>
            {resource && <ResourceJsonLd resource={resource} />}
            <ResourcePageClient />
        </>
    );
}
