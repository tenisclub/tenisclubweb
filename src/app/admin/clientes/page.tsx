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
      .select('id, user_id, total, status, created_at')
      .order('created_at', { ascending: false }),
  ]);

  const customers: CustomerSummary[] = (profiles || []).map((p) => {
    const userOrders = (orders || []).filter((o) => o.user_id === p.id);
    const validOrders = userOrders.filter((o) => o.status !== 'cancelled');
    return {
      ...p,
// step 3/4
