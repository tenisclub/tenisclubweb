import {
  CustomersClient,
  type CustomerSummary,
} from '@/components/admin/CustomersClient';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminClientesPage() {
  const supabase = createServiceClient();

  const [{ data: profiles }, { data: orders }] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('id, full_name, email, phone, auth_provider, is_active, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('orders')
      .select('id, user_id, customer_name, customer_email, customer_phone, total, status, created_at')
      .order('created_at', { ascending: false }),
  ]);

  const registeredCustomers: CustomerSummary[] = (profiles || []).map((p) => {
    const userOrders = (orders || []).filter((o) => o.user_id === p.id);
    const validOrders = userOrders.filter((o) => o.status !== 'cancelled');
    return {
      ...p,
      ordersCount: userOrders.length,
      totalSpent: validOrders.reduce((acc, o) => acc + Number(o.total || 0), 0),
      lastOrderId: userOrders[0]?.id || null,
    };
  });

  // Group guest orders (user_id IS NULL) by normalized phone or email so admin also tracks buyers without login
  const guestBuckets = new Map<string, CustomerSummary>();
  for (const o of orders || []) {
    if (o.user_id) continue;
    const phoneDigits = String(o.customer_phone || '').replace(/\D/g, '');
    const normEmail = String(o.customer_email || '').trim().toLowerCase();
    const bucketKey = phoneDigits
      ? `guest:phone:${phoneDigits}`
      : normEmail
        ? `guest:email:${normEmail}`
        : `guest:order:${o.id}`;

    const existing = guestBuckets.get(bucketKey);
    const orderTotal = o.status !== 'cancelled' ? Number(o.total || 0) : 0;

    if (!existing) {
      guestBuckets.set(bucketKey, {
        id: bucketKey,
        full_name: o.customer_name || 'Cliente (Sem login)',
        email: o.customer_email || '',
        phone: o.customer_phone || '',
        auth_provider: 'guest',
        is_active: true,
        created_at: o.created_at,
        ordersCount: 1,
        totalSpent: orderTotal,
        lastOrderId: o.id,
      });
    } else {
      existing.ordersCount += 1;
      existing.totalSpent += orderTotal;
      if (!existing.email && o.customer_email) existing.email = o.customer_email;
      if (!existing.phone && o.customer_phone) existing.phone = o.customer_phone;
    }
  }

  const customers = [...registeredCustomers, ...Array.from(guestBuckets.values())].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return <CustomersClient initialCustomers={customers} />;
}
