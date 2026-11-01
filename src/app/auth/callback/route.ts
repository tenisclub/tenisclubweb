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
          .upsert({
            id: userId,
            email,
            full_name: fullName,
            phone: typeof userMeta.phone === 'string' ? userMeta.phone : '',
            avatar_url:
              (typeof userMeta.avatar_url === 'string' && userMeta.avatar_url) ||
              (typeof userMeta.picture === 'string' && userMeta.picture) ||
              null,
            auth_provider: typeof appMeta.provider === 'string' ? appMeta.provider : 'google',
            is_active: true,
          })
          .select('*')
          .single();
        profile = inserted as UserProfile;
      }

      if (!profile?.is_active) {
        await supabase.auth.signOut({ scope: 'local' });
        return NextResponse.redirect(`${origin}/login?error=account_disabled`);
      }

      const roleNames = (userRoles || [])
        .map((ur: { roles?: { name?: string } | { name?: string }[] | null }) => {
          if (Array.isArray(ur.roles)) return ur.roles[0]?.name;
          return ur.roles?.name;
        })
        .filter(Boolean) as UserRole[];

      let role: UserRole = 'customer';
      if (roleNames.includes('super_admin')) role = 'super_admin';
      else if (roleNames.includes('admin_operational')) role = 'admin_operational';

      const isSafeCustomTarget =
        next &&
        next.startsWith('/') &&
        !next.startsWith('//') &&
        next !== '/minha-conta' &&
        !next.startsWith('/minha-conta?') &&
        !next.startsWith('/login') &&
        !next.startsWith('/cadastro');

      const redirectUrl = isSafeCustomTarget ? `${origin}${next}` : `${origin}/`;
      const response = NextResponse.redirect(redirectUrl);

      // Instant 0ms first-frame session bootstrap for StoreProvider on destination page
      try {
        const bootstrapPayload = encodeURIComponent(
          JSON.stringify({
            authenticated: true,
            user: { ...profile, role },
            role,
            syncTag: computeUserSyncTag(userId),
// step 5/6
