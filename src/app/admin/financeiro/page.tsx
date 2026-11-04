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
// etapa 3/10
