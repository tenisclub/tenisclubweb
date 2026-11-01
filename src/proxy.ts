import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseJwks } from '@/lib/supabase/jwks';

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hasSbCookie = request.cookies.getAll().some((c) => c.name.startsWith('sb-'));

  if (!hasSbCookie) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const jwks = await getSupabaseJwks();
  const { data, error } = await supabase.auth.getClaims(undefined, jwks ? { jwks } : undefined);

  if (error || !data?.claims?.sub) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
// step 4/5
