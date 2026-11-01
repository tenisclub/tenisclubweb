import { CategoriesClient } from '@/components/admin/CategoriesClient';
import { getAdminCategoriesAndBrands } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriasPage() {
  const { categories } = await getAdminCategoriesAndBrands();
  return <CategoriesClient initialCategories={categories} />;
}
