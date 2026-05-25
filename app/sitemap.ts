import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://pantaubanjir-bojongsoang.vercel.app'; // Ganti dengan domain asli nanti
  
  const routes = [
    '',
    '/peta',
    '/cuaca',
    '/data',
    '/laporan',
    '/edukasi',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  return routes;
}
