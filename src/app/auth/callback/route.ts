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
      if (next && next.startsWith('/')) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      if (session?.isAdmin) {
        return NextResponse.redirect(`${origin}/admin`);
      }
      return NextResponse.redirect(`${origin}/minha-conta`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
