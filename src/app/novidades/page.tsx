import type { Metadata } from 'next';
import { CatalogExplorer } from '@/components/product/CatalogExplorer';
import { getCatalogProducts, getCategoriesAndBrands, getStoreSettings } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Novidades & Drop Novo',
  description: 'Confira os tênis e calçados recém-cadastrados na Tênis Club.',
};

export default async function NovidadesPage() {
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
      initialOnlyNew={true}
      heading="Novidades · Drop Novo"
      subheading="Os modelos mais recentes que acabaram de chegar no estoque."
    />
  );
}

