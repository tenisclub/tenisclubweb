import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { revalidateStoreData } from '@/lib/revalidate-store';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function PATCH(request: Request) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { fullName, phone, email, newPassword } = body;

    const service = createServiceClient();
    const supabase = await createClient();

    if (fullName !== undefined || phone !== undefined) {
      const updates: Record<string, string> = {
        updated_at: new Date().toISOString(),
      };
      if (fullName?.trim()) updates.full_name = fullName.trim();
      if (phone !== undefined) updates.phone = String(phone).trim();

      const { error: profErr } = await service
        .from('user_profiles')
        .update(updates)
        .eq('id', session.userId);

      if (profErr) {
        return NextResponse.json({ error: profErr.message }, { status: 400 });
      }
    }

    let emailMessage = '';
    if (email && email.trim().toLowerCase() !== session.email.toLowerCase()) {
      const { error: emailErr } = await supabase.auth.updateUser({
        email: email.trim().toLowerCase(),
      });
      if (emailErr) {
        return NextResponse.json({ error: emailErr.message }, { status: 400 });
      }
      emailMessage = ' Enviamos um link de confirmação para o novo e-mail.';
    }

    if (newPassword) {
      if (String(newPassword).length < 6) {
        return NextResponse.json(
          { error: 'A nova senha deve conter pelo menos 6 caracteres.' },
          { status: 400 }
        );
      }
      const { error: pwdErr } = await supabase.auth.updateUser({
        password: String(newPassword),
      });
      if (pwdErr) {
        return NextResponse.json({ error: pwdErr.message }, { status: 400 });
      }
    }
// step 4/5
