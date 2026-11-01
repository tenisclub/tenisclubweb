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
      const userMeta = data.user.user_metadata || {};
      const appMeta = data.user.app_metadata || {};

      const service = createServiceClient();
      const [{ data: profileRow }, { data: userRoles }] = await Promise.all([
        service.from('user_profiles').select('*').eq('id', userId).maybeSingle(),
        service.from('user_roles').select('roles(name)').eq('user_id', userId),
      ]);

      let profile = profileRow as UserProfile | null;
      if (!profile) {
        const fullName =
          (typeof userMeta.full_name === 'string' && userMeta.full_name) ||
          (typeof userMeta.name === 'string' && userMeta.name) ||
          email.split('@')[0] ||
          'Cliente';
        const { data: inserted } = await service
          .from('user_profiles')
// step 2/6
