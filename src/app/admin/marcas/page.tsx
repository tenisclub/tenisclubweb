import { BrandsClient } from '@/components/admin/BrandsClient';
import { createServiceClient } from '@/lib/supabase/server';
import type { Brand } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function AdminMarcasPage() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('brands')
    .select('*')
    .order('name', { ascending: true });

  return <BrandsClient initialBrands={(data || []) as Brand[]} />;
}

