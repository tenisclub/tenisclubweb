import type { Metadata } from 'next';
import { CatalogExplorer } from '@/components/product/CatalogExplorer';
import { getCatalogProducts, getCategoriesAndBrands, getStoreSettings } from '@/lib/catalog';

export const metadata: Metadata = {
  title: 'Todos os Tênis e Calçados',
  description: 'Explore o catálogo completo da Tênis Club com filtros por marca, numeração, cor e preço.',
};

// step 1/4
