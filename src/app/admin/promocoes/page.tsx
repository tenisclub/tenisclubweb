import {
  PromotionsClient,
  type PromotionRow,
} from '@/components/admin/PromotionsClient';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminPromocoesPage() {
  const supabase = createServiceClient();

  const [{ data: promosRaw }, { data: prodsRaw }] = await Promise.all([
    supabase
      .from('promotions')
      .select('*, products(name, base_price)')
      .order('created_at', { ascending: false }),
    supabase
      .from('products')
      .select('id, name, base_price')
      .order('name', { ascending: true }),
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
      ends_at: pr.ends_at,
      is_active: Boolean(pr.is_active),
      highlight_home: Boolean(pr.highlight_home),
    };
  });

  return (
    <PromotionsClient
      initialPromos={promos}
      productsList={(prodsRaw || []).map((p) => ({
        id: p.id,
        name: p.name,
        base_price: Number(p.base_price),
      }))}
    />
  );
}

