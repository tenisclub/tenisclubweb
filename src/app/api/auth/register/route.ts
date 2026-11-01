import { NextResponse } from 'next/server';
import { computeUserSyncTag } from '@/lib/revalidate-store';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, phone, password, acceptedTerms } = body;

    if (!fullName?.trim() || fullName.trim().length < 3) {
      return NextResponse.json({ error: 'Informe seu nome completo.' }, { status: 400 });
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return NextResponse.json({ error: 'Informe um endereço de e-mail válido.' }, { status: 400 });
    }

    const cleanPhone = (phone || '').trim();
    if (cleanPhone.replace(/\D/g, '').length < 10) {
      return NextResponse.json(
        { error: 'Informe um telefone/WhatsApp válido com DDD.' },
        { status: 400 }
      );
    }

    if (!password || String(password).length < 8) {
      return NextResponse.json(
        { error: 'A senha deve ter no mínimo 8 caracteres.' },
        { status: 400 }
      );
    }

    if (!acceptedTerms) {
      return NextResponse.json(
        { error: 'É necessário aceitar os Termos de Uso e a Política de Privacidade.' },
        { status: 400 }
      );
    }

    const service = createServiceClient();

    // Check if email already exists
    const { data: existing } = await service
      .from('user_profiles')
      .select('id, auth_provider')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existing) {
      if (existing.auth_provider === 'google') {
        return NextResponse.json(
          {
            error:
              'Este e-mail já possui conta vinculada ao Google. Clique em "Continuar com Google" na tela de login.',
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: 'Este e-mail já está cadastrado. Faça login ou recupere sua senha.' },
        { status: 409 }
// step 3/6
