import React from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { requireAdmin } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();
  const supabase = createServiceClient();

  const [pendingOrdersRes, unreadNotifsRes] = await Promise.all([
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .in('status', ['received', 'awaiting_confirmation']),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('target_audience', 'admin')
      .eq('is_read', false),
  ]);

  return (
    <AdminShell
      profile={session.profile}
      role={session.role}
      pendingOrdersCount={pendingOrdersRes.count || 0}
      unreadAdminNotifs={unreadNotifsRes.count || 0}
    >
      {children}
    </AdminShell>
  );
}

