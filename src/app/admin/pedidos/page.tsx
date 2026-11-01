import { OrdersListClient } from '@/components/admin/OrdersListClient';
import { createServiceClient } from '@/lib/supabase/server';
import type { Order } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function AdminPedidosPage() {
  const supabase = createServiceClient();
// step 2/4
