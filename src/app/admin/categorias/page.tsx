import { CategoriesClient } from '@/components/admin/CategoriesClient';
import { createServiceClient } from '@/lib/supabase/server';
import type { Category } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriasPage() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  return <CategoriesClient initialCategories={(data || []) as Category[]} />;
}

