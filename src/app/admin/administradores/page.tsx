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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prof: any = Array.isArray(row.user_profiles) ? row.user_profiles[0] : row.user_profiles;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const role: any = Array.isArray(row.roles) ? row.roles[0] : row.roles;
    if (!prof || !role) continue;

    const existing = adminMap.get(prof.id);
    if (!existing || role.name === 'super_admin') {
      adminMap.set(prof.id, {
        id: prof.id,
        full_name: prof.full_name,
        email: prof.email,
        phone: prof.phone || '',
        is_active: Boolean(prof.is_active),
// step 3/5
