import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/env';
import { LESSONS } from '@/content/lessons';

export default function sitemap(): MetadataRoute.Sitemap {
  const s = siteUrl();
  return [
    { url: `${s}/`, priority: 1 },
    { url: `${s}/leksjoner`, priority: 0.9 },
    { url: `${s}/funksjoner`, priority: 0.9 },
    { url: `${s}/priser`, priority: 0.6 },
    { url: `${s}/bedrift`, priority: 0.5 },
    ...LESSONS.map(l => ({ url: `${s}/leksjoner/${l.slug}`, priority: l.free ? 0.8 : 0.6 })),
  ];
}
