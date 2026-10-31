import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  const session = await getAuthSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }

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

  return NextResponse.json({
    pendingOrdersCount: pendingOrdersRes.count || 0,
    unreadAdminNotifs: unreadNotifsRes.count || 0,
  });
}

