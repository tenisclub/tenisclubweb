import {
  PromotionsClient,
  type PromotionRow,
} from '@/components/admin/PromotionsClient';
import { getAdminProducts } from '@/lib/catalog';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminPromocoesPage() {
  const supabase = createServiceClient();
// step 1/5
