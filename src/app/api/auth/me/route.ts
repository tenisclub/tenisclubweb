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
        .eq('is_read', false)
        .or(`and(target_audience.eq.customer,user_id.eq.${userId}),target_audience.eq.admin`),
    ]);

  let resolvedProfile = profileRow as UserProfile | null;
  if (!resolvedProfile) {
    const fullName =
      (typeof userMeta.full_name === 'string' && userMeta.full_name) ||
      (typeof userMeta.name === 'string' && userMeta.name) ||
      claimEmail.split('@')[0] ||
      'Cliente';
    const { data: inserted } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        email: claimEmail.toLowerCase(),
        full_name: fullName,
        phone: typeof userMeta.phone === 'string' ? userMeta.phone : '',
        avatar_url:
          (typeof userMeta.avatar_url === 'string' && userMeta.avatar_url) ||
          (typeof userMeta.picture === 'string' && userMeta.picture) ||
          null,
        auth_provider: typeof appMeta.provider === 'string' ? appMeta.provider : 'email',
        is_active: true,
      })
      .select('*')
      .single();
    resolvedProfile = inserted as UserProfile;
  }

  if (!resolvedProfile?.is_active) {
    return NextResponse.json({
      authenticated: false,
      user: null,
      role: 'visitor',
      cartCount: 0,
