import { createServiceClient } from '@/lib/supabase/server';
import { FinancialPanelClient } from '@/components/admin/FinancialPanelClient';
import type { FinancialCustomColumn, FinancialEntry } from '@/types/database';

export const dynamic = 'force-dynamic';
// etapa 1/10
