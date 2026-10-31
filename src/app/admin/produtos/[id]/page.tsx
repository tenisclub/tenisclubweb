import { notFound } from 'next/navigation';
import { ProductForm } from '@/components/admin/ProductForm';
import { enrichProductRow } from '@/lib/catalog';
import { createServiceClient } from '@/lib/supabase/server';
import type { Brand, Category } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function EditarProdutoAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServiceClient();

  const [{ data: row }, { data: categories }, { data: brands }] = await Promise.all([
    supabase
      .from('products')
      .select('*, brands(*), categories(*), product_images(*), product_variants(*, inventory(*)), promotions(*)')
      .eq('id', id)
      .maybeSingle(),
    supabase.from('categories').select('*').order('sort_order', { ascending: true }),
    supabase.from('brands').select('*').order('name', { ascending: true }),
  ]);

  if (!row) notFound();

  const product = enrichProductRow(row, true);

  return (
    <ProductForm
      initialProduct={product}
      categories={(categories || []) as Category[]}
      brands={(brands || []) as Brand[]}
    />
  );
}
