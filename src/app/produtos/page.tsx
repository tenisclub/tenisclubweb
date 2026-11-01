import type { Metadata } from 'next';
import { CatalogExplorer } from '@/components/product/CatalogExplorer';
import { getCatalogProducts, getCategoriesAndBrands, getStoreSettings } from '@/lib/catalog';

export const metadata: Metadata = {
  title: 'Todos os Tênis e Calçados',
  description: 'Explore o catálogo completo da Tênis Club com filtros por marca, numeração, cor e preço.',
};

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; genero?: string; categoria?: string }>;
}) {
  const sp = await searchParams;
  const [{ allMatching }, { categories, brands }, settings] = await Promise.all([
    getCatalogProducts({ pageSize: 200 }),
    getCategoriesAndBrands(),
    getStoreSettings(),
  ]);

  return (
    <CatalogExplorer
      products={allMatching}
      categories={categories}
      brands={brands}
      whatsapp={settings.whatsapp}
      initialQuery={sp.q || ''}
      initialGender={sp.genero || 'todos'}
      initialCategory={sp.categoria || 'todos'}
      heading={sp.q ? `Resultados para "${sp.q}"` : 'Todos os Tênis & Calçados'}
      subheading="Confira numerações disponíveis em tempo real, preços promocionais e lançamentos."
    />
  );
}

