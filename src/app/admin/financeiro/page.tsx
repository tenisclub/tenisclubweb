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
// etapa 4/10
