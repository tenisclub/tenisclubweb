import type { MetadataRoute } from 'next';
import { getCatalogProducts, getCategoriesAndBrands } from '@/lib/catalog';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tenisclub.vercel.app';
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
// step 2/4
