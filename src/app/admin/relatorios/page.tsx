import { getAdminProducts } from '@/lib/catalog';
import { createServiceClient } from '@/lib/supabase/server';
import { formatCurrency, ORDER_STATUS_CONFIG } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminRelatoriosPage() {
  const supabase = createServiceClient();

  const [{ data: ordersRaw }, products] = await Promise.all([
    supabase
      .from('orders')
      .select('id, status, payment_status, delivery_method, total, created_at')
      .order('created_at', { ascending: false }),
    getAdminProducts(),
  ]);

  const orders = ordersRaw || [];

  const validOrders = orders.filter((o) => o.status !== 'cancelled');
  const paidOrders = validOrders.filter((o) => o.payment_status === 'paid_manual');

  const registeredTotal = validOrders.reduce((acc, o) => acc + Number(o.total || 0), 0);
  const manualPaidTotal = paidOrders.reduce((acc, o) => acc + Number(o.total || 0), 0);
  const averageTicket = validOrders.length > 0 ? registeredTotal / validOrders.length : 0;
// step 1/8
