import { createServiceClient } from '@/lib/supabase/server';
import { FinancialPanelClient } from '@/components/admin/FinancialPanelClient';
import type { FinancialCustomColumn, FinancialEntry } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function AdminFinancialPage() {
  const supabase = createServiceClient();

  const [entriesRes, columnsRes, productsRes] = await Promise.all([
    supabase
      .from('financial_entries')
      .select(
        `
        *,
        order:orders(id, order_number, customer_name, status, payment_status),
        product:products(id, name, sku)
      `
      )
      .order('entry_date', { ascending: false })
      .order('occurred_at', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('financial_custom_columns')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('products')
      .select('id, name, sku, base_price, promo_price, cost_price')
      .order('name', { ascending: true }),
  ]);

  return (
    <FinancialPanelClient
      initialEntries={(entriesRes.data || []) as FinancialEntry[]}
      initialColumns={(columnsRes.data || []) as FinancialCustomColumn[]}
      products={
        (productsRes.data || []) as Array<{
          id: string;
          name: string;
          sku: string | null;
          base_price: number;
          promo_price: number | null;
          cost_price?: number;
        }>
      }
    />
  );
}

