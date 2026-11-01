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
// step 2/4
