import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { revalidateStoreData } from '@/lib/revalidate-store';
import { createServiceClient } from '@/lib/supabase/server';

export async function PATCH(request: Request) {
  const session = await getAuthSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }

  const { userId, is_active, reason } = await request.json();
  if (!userId || is_active === undefined) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
  }

  if (userId === session.userId && !is_active) {
    return NextResponse.json(
      { error: 'Você não pode desativar sua própria conta.' },
      { status: 400 }
    );
  }

// step 2/4
