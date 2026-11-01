import React from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { requireAdmin } from '@/lib/auth';
import { getAdminBadgeCounts } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, badges] = await Promise.all([requireAdmin(), getAdminBadgeCounts()]);

  return (
    <AdminShell
      profile={session.profile}
      role={session.role}
      pendingOrdersCount={badges.pendingOrdersCount}
// step 3/4
