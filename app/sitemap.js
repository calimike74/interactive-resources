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
    // Free-download story books. Static HTML in public/ — not part of
    // getAllResources() — so they're listed here by hand, same pattern as
    // /map-room above.
    {
      url: `${baseUrl}/story-of-the-studio`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/story-of-synthesis`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    // The recording-history era playlist — same static-HTML-in-public pattern.
    {
      url: `${baseUrl}/recording-history`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    ...resourceUrls,
  ];
}
