import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { getUserCartView, getUserFavoriteIds } from '@/lib/catalog';
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
  const [cart, favoriteIds, notifRes] = await Promise.all([
    getUserCartView(session.userId),
    getUserFavoriteIds(session.userId),
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
    cartCount: cart.totalItems,
    favoriteIds,
    unreadNotifications: notifRes.count || 0,
  });
}
