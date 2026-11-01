import type { MetadataRoute } from 'next';
import { getCatalogProducts, getCategoriesAndBrands } from '@/lib/catalog';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tenisclub.vercel.app';
  const [{ allMatching }, { categories }] = await Promise.all([
    getCatalogProducts({ pageSize: 200 }),
    getCategoriesAndBrands(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
// step 1/4
