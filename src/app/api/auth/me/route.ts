import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { getUserNavbarState } from '@/lib/catalog';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({
      authenticated: false,
      user: null,
      role: 'visitor',
      cartCount: 0,
      favoriteIds: [],
      unreadNotifications: 0,
    });
  }

  const supabase = createServiceClient();
  const [navState, notifRes] = await Promise.all([
    getUserNavbarState(session.userId),
    session.isAdmin
      ? supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('target_audience', 'admin')
          .eq('is_read', false)
      : supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('target_audience', 'customer')
          .eq('user_id', session.userId)
          .eq('is_read', false),
  ]);

  return NextResponse.json({
    authenticated: true,
    user: session.profile,
    role: session.role,
    isAdmin: session.isAdmin,
    isSuperAdmin: session.isSuperAdmin,
    cartCount: navState.cartCount,
    favoriteIds: navState.favoriteIds,
    unreadNotifications: notifRes.count || 0,
  });
}
