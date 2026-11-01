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
// step 1/6
