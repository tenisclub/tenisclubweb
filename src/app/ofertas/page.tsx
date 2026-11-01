import type { Metadata } from 'next';
import { CatalogExplorer } from '@/components/product/CatalogExplorer';
import { getCatalogProducts, getCategoriesAndBrands, getStoreSettings } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Ofertas & Promoções',
// step 1/4
