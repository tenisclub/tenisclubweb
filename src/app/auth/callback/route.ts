import { NextResponse } from 'next/server';
import { computeUserSyncTag } from '@/lib/revalidate-store';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { UserProfile, UserRole } from '@/types/database';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || searchParams.get('redirect') || '';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const userId = data.user.id;
      const email = (data.user.email || '').toLowerCase();
// step 1/6
