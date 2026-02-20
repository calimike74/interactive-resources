import { getAllResources } from '@/lib/resources';

export default function sitemap() {
  const baseUrl = 'https://interactive-resources.vercel.app';

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
    ...resourceUrls,
  ];
}
