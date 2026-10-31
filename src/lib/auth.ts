import { redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { UserProfile, UserRole } from '@/types/database';

export interface AuthSession {
  userId: string;
  email: string;
  profile: UserProfile;
  role: UserRole;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export async function getAuthSession(): Promise<AuthSession | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) return null;

    const service = createServiceClient();

    const [{ data: profile }, { data: userRoles }] = await Promise.all([
      service.from('user_profiles').select('*').eq('id', user.id).maybeSingle(),
      service
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id),
    ]);

    // Ensure profile exists even if signed up before trigger
    let resolvedProfile = profile as UserProfile | null;
    if (!resolvedProfile) {
      const fullName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        'Cliente';
      const { data: inserted } = await service
        .from('user_profiles')
        .upsert({
          id: user.id,
          email: (user.email || '').toLowerCase(),
          full_name: fullName,
          phone: user.user_metadata?.phone || '',
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
          auth_provider: user.app_metadata?.provider || 'email',
          is_active: true,
        })
        .select('*')
        .single();
      resolvedProfile = inserted as UserProfile;
    }

    if (!resolvedProfile?.is_active) {
      return null;
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

    return {
      userId: user.id,
      email: user.email || resolvedProfile.email,
      profile: { ...resolvedProfile, role },
      role,
      isAdmin: role === 'super_admin' || role === 'admin_operational',
      isSuperAdmin: role === 'super_admin',
    };
  } catch {
    return null;
  }
}

export async function requireAuth(redirectTo = '/minha-conta'): Promise<AuthSession> {
  const session = await getAuthSession();
  if (!session) {
    redirect(`/login?redirect=${encodeURIComponent(redirectTo)}`);
  }
  return session;
}

export async function requireAdmin(): Promise<AuthSession> {
  const session = await getAuthSession();
  if (!session) {
    redirect('/login?redirect=/admin');
  }
  if (!session.isAdmin) {
    redirect('/minha-conta');
  }
  return session;
}

export async function requireSuperAdmin(): Promise<AuthSession> {
  const session = await requireAdmin();
  if (!session.isSuperAdmin) {
    redirect('/admin');
  }
  return session;
}
