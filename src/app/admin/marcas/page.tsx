import { BrandsClient } from '@/components/admin/BrandsClient';
import { getAdminCategoriesAndBrands } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export default async function AdminMarcasPage() {
  const { brands } = await getAdminCategoriesAndBrands();
  return <BrandsClient initialBrands={brands} />;
}
