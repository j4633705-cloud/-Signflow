import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    host: 'https://docs.signflow.com',
    sitemap: 'https://docs.signflow.com/sitemap.xml',
  };
}
