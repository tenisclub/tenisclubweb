import {
  PromotionsClient,
  type PromotionRow,
} from '@/components/admin/PromotionsClient';
import { getAdminProducts } from '@/lib/catalog';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminPromocoesPage() {
  const supabase = createServiceClient();

  const [{ data: promosRaw }, products] = await Promise.all([
    supabase
      .from('promotions')
      .select('*, products(name, base_price)')
      .order('created_at', { ascending: false }),
    getAdminProducts(),
  ]);

  const promos: PromotionRow[] = (promosRaw || []).map((pr) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prod: any = Array.isArray(pr.products) ? pr.products[0] : pr.products;
    return {
      id: pr.id,
      name: pr.name,
      description: pr.description || '',
