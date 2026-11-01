import { notFound } from 'next/navigation';
import { OrderDetailAdminClient } from '@/components/admin/OrderDetailAdminClient';
import { createServiceClient } from '@/lib/supabase/server';
import type { Order } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function AdminPedidoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: row } = await supabase
    .from('orders')
// step 2/4
