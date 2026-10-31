import type { MetadataRoute } from 'next';
import { getCatalogProducts, getCategoriesAndBrands } from '@/lib/catalog';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tenisclubweb.vercel.app';
  const [{ allMatching }, { categories }] = await Promise.all([
    getCatalogProducts({ pageSize: 200 }),
    getCategoriesAndBrands(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/produtos',
    '/ofertas',
    '/novidades',
    '/sobre',
    '/contato',
    '/entrega-e-retirada',
    '/trocas-e-devolucoes',
    '/duvidas-frequentes',
    '/privacidade',
    '/termos',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: route === '' ? 1 : 0.8,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${baseUrl}/categoria/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const productRoutes: MetadataRoute.Sitemap = allMatching.map((p) => ({
    url: `${baseUrl}/produto/${p.slug}`,
    lastModified: new Date(p.created_at),
    changeFrequency: 'daily',
    priority: 0.9,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
