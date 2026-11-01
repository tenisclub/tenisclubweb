import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getVerifiedClaims } from '@/lib/auth';
import { invalidateAuthCache } from '@/lib/server-cache';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const claims = await getVerifiedClaims();
    if (claims?.sub) {
      invalidateAuthCache(claims.sub);
    }
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: 'local' });
  } catch {
    // Ignore errors if token already expired
  }
// step 2/4
