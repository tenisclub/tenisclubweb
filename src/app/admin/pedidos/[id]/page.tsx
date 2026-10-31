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
    .select('*, order_items(*), order_status_history(*)')
    .eq('id', id)
    .maybeSingle();

  if (!row) notFound();

  const order: Order = {
    ...(row as unknown as Order),
    items: row.order_items || [],
    history: [...(row.order_status_history || [])].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
  };

  return <OrderDetailAdminClient initialOrder={order} />;
}
