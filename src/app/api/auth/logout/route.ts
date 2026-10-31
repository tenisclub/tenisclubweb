import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: 'local' });
  } catch {
    // Ignore errors if token already expired
  }

  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const res = NextResponse.json({ ok: true });

  for (const c of allCookies) {
    if (c.name.startsWith('sb-')) {
      res.cookies.set(c.name, '', {
        path: '/',
        maxAge: 0,
      });
    }
  }

  return res;
}
