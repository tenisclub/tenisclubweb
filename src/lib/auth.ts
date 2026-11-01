import { cache } from 'react';
import { redirect } from 'next/navigation';
import { getCachedAuthRecord, setCachedAuthRecord } from '@/lib/server-cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getSupabaseJwks } from '@/lib/supabase/jwks';
import type { UserProfile, UserRole } from '@/types/database';

export interface AuthSession {
  userId: string;
  email: string;
  profile: UserProfile;
  role: UserRole;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export interface VerifiedClaims {
  sub: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}

export const getVerifiedClaims = cache(async (): Promise<VerifiedClaims | null> => {
  try {
    const [supabase, jwks] = await Promise.all([createClient(), getSupabaseJwks()]);
    const { data, error } = await supabase.auth.getClaims(undefined, jwks ? { jwks } : undefined);
    if (error || !data?.claims?.sub) return null;
    return data.claims as unknown as VerifiedClaims;
  } catch {
    return null;
  }
});

export const getAuthenticatedUserId = cache(async (): Promise<string | null> => {
  const claims = await getVerifiedClaims();
  return claims?.sub || null;
});

export const getAuthSession = cache(async (): Promise<AuthSession | null> => {
  try {
    const claims = await getVerifiedClaims();
    if (!claims?.sub) return null;

    const userId = claims.sub;
    const claimEmail = typeof claims.email === 'string' ? claims.email : '';

    const cached = getCachedAuthRecord(userId);
    if (cached !== undefined) {
      if (!cached) return null;
      return {
        userId,
        email: claimEmail || cached.profile.email,
        profile: cached.profile,
        role: cached.role,
        isAdmin: cached.isAdmin,
        isSuperAdmin: cached.isSuperAdmin,
      };
    }

    const userMeta = claims.user_metadata || {};
    const appMeta = claims.app_metadata || {};

    const service = createServiceClient();

    const [{ data: profile }, { data: userRoles }] = await Promise.all([
      service.from('user_profiles').select('*').eq('id', userId).maybeSingle(),
      service.from('user_roles').select('roles(name)').eq('user_id', userId),
    ]);

    // Ensure profile exists even if signed up before trigger
    let resolvedProfile = profile as UserProfile | null;
    if (!resolvedProfile) {
      const fullName =
        (typeof userMeta.full_name === 'string' && userMeta.full_name) ||
        (typeof userMeta.name === 'string' && userMeta.name) ||
        claimEmail.split('@')[0] ||
        'Cliente';
      const { data: inserted } = await service
        .from('user_profiles')
        .upsert({
          id: userId,
          email: claimEmail.toLowerCase(),
// step 3/6
