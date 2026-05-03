import type { MetadataRoute } from 'next';
import { SEO_BASE_URL } from '@/lib/seo-config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${SEO_BASE_URL}/sitemap.xml`,
    host: SEO_BASE_URL,
  };
}
