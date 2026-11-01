import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const { email } = await request.json();
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!cleanEmail) {
    return NextResponse.json({ error: 'Informe o e-mail cadastrado.' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('auth_provider')
    .eq('email', cleanEmail)
    .maybeSingle();

  if (profile?.auth_provider === 'google') {
    return NextResponse.json({
      googleOnly: true,
      message:
// step 3/4
