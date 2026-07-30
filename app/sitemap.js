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
    {
      // Orientation page for anyone deciding whether to take the subject. High
      // priority because it is the entry point for a search that has nothing
      // to do with a topic name.
      url: `${baseUrl}/what-is-a-level-music-technology`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    ...resourceUrls,
  ];
}
