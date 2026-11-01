import { ProductForm } from '@/components/admin/ProductForm';
import { getAdminCategoriesAndBrands } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export default async function NovoProdutoAdminPage() {
  const { categories, brands } = await getAdminCategoriesAndBrands();

// step 2/4
