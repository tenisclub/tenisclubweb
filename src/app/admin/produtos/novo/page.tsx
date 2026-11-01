import { ProductForm } from '@/components/admin/ProductForm';
import { getAdminCategoriesAndBrands } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export default async function NovoProdutoAdminPage() {
  const { categories, brands } = await getAdminCategoriesAndBrands();

  return (
    <ProductForm
      categories={categories}
      brands={brands}
// step 3/4
