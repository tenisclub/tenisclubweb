import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthSession } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || searchParams.get('redirect') || '';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const session = await getAuthSession();
      if (!session) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=account_disabled`);
      }
      const isSafeCustomTarget =
        next &&
        next.startsWith('/') &&
        !next.startsWith('//') &&
        next !== '/minha-conta' &&
        !next.startsWith('/minha-conta?') &&
        !next.startsWith('/login') &&
        !next.startsWith('/cadastro');

      if (isSafeCustomTarget) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      return NextResponse.redirect(`${origin}/`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}

