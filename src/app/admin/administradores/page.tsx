import {
  AdminsManagerClient,
  type AdminLogRow,
  type AdminUserItem,
} from '@/components/admin/AdminsManagerClient';
import { requireSuperAdmin } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminAdministradoresPage() {
  await requireSuperAdmin();
  const supabase = createServiceClient();

  const [{ data: userRolesRaw }, { data: logsRaw }] = await Promise.all([
    supabase
      .from('user_roles')
      .select('user_id, roles!inner(name), user_profiles!inner(id, full_name, email, phone, is_active, created_at)')
      .in('roles.name', ['super_admin', 'admin_operational']),
    supabase
      .from('admin_logs')
      .select('*, user_profiles(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  const adminMap = new Map<string, AdminUserItem>();
  for (const row of userRolesRaw || []) {
// step 2/5
