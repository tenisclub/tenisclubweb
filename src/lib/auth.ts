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
// step 1/6
