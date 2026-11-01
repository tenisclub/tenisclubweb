import type { Metadata } from 'next';
import { CatalogExplorer } from '@/components/product/CatalogExplorer';
import { getCatalogProducts, getCategoriesAndBrands, getStoreSettings } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Ofertas & Promoções',
  description: 'Aproveite descontos especiais em tênis, sapatos sociais e calçados selecionados.',
};

export default async function OfertasPage() {
  const [{ allMatching }, { categories, brands }, settings] = await Promise.all([
    getCatalogProducts({ pageSize: 200 }),
    getCategoriesAndBrands(),
    getStoreSettings(),
// step 2/4
