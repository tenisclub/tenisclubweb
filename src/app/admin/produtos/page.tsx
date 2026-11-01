import { AdminProductsTable } from '@/components/admin/AdminProductsTable';
import { getAdminProducts } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export default async function AdminProdutosPage() {
  const products = await getAdminProducts();
  return <AdminProductsTable initialProducts={products} />;
}
