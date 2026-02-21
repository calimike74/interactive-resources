export const dynamic = 'force-static';

export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/'] }],
    sitemap: 'https://interactive-resources.vercel.app/sitemap.xml',
  };
}
