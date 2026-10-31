import { AdminProductsTable } from '@/components/admin/AdminProductsTable';
import { enrichProductRow } from '@/lib/catalog';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminProdutosPage() {
  const supabase = createServiceClient();
  const { data: rows } = await supabase
    .from('products')
    .select('*, brands(*), categories(*), product_images(*), product_variants(*, inventory(*)), promotions(*)')
    .order('created_at', { ascending: false });

  const products = (rows || []).map((r) => enrichProductRow(r, true));

  return <AdminProductsTable initialProducts={products} />;
}
