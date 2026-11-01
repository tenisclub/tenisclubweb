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
// step 1/5
