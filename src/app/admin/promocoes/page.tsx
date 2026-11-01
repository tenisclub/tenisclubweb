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
      product_id: pr.product_id,
      product_name: prod?.name || 'Produto',
      base_price: Number(prod?.base_price || 0),
      promo_price: Number(pr.promo_price),
      discount_percent: Number(pr.discount_percent || 0),
      starts_at: pr.starts_at,
// step 3/5
