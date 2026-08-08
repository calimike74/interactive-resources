import { getAllResources } from '@/lib/resources';

export const dynamic = 'force-static';

export default function sitemap() {
  const baseUrl = 'https://resources.musictechstudio.co.uk';

  const resources = getAllResources();

  const resourceUrls = resources.map((resource) => ({
    url: `${baseUrl}/${resource.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    // The orientation page moved to the hub on 2026-07-30 and the route here is
    // now a noindex stub pointing at it. Deliberately absent from this sitemap.
    {
      url: `${baseUrl}/map-room`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    ...resourceUrls,
  ];
}
