import { ProductForm } from '@/components/admin/ProductForm';
import { createServiceClient } from '@/lib/supabase/server';
import type { Brand, Category } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function NovoProdutoAdminPage() {
  const supabase = createServiceClient();
  const [{ data: categories }, { data: brands }] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order', { ascending: true }),
    supabase.from('brands').select('*').order('name', { ascending: true }),
  ]);

  return (
    <ProductForm
      categories={(categories || []) as Category[]}
      brands={(brands || []) as Brand[]}
    />
  );
}
