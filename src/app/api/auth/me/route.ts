import { NextResponse } from 'next/server';
import { getVerifiedClaims } from '@/lib/auth';
import { getUserNavbarState } from '@/lib/catalog';
import { computeUserSyncTag } from '@/lib/revalidate-store';
import { createServiceClient } from '@/lib/supabase/server';
import type { UserProfile, UserRole } from '@/types/database';

export async function GET() {
  const claims = await getVerifiedClaims();
  if (!claims?.sub) {
    return NextResponse.json({
      authenticated: false,
      user: null,
      role: 'visitor',
      cartCount: 0,
      favoriteIds: [],
      unreadNotifications: 0,
    });
  }

  const userId = claims.sub;
  const claimEmail = typeof claims.email === 'string' ? claims.email : '';
  const userMeta = claims.user_metadata || {};
  const appMeta = claims.app_metadata || {};

  const supabase = createServiceClient();

  // Single parallel wave instead of 2 sequential round-trips to Postgres
  const [{ data: profileRow }, { data: userRoles }, navState, { data: unreadRows }] =
    await Promise.all([
      supabase.from('user_profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('user_roles').select('roles(name)').eq('user_id', userId),
      getUserNavbarState(userId),
      supabase
        .from('notifications')
        .select('target_audience, user_id')
