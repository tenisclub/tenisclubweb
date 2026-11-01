import { NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json(
      { error: 'Faça login para salvar favoritos.', code: 'UNAUTHENTICATED' },
      { status: 401 }
    );
  }

  const { productId } = await request.json();
  if (!productId) {
    return NextResponse.json({ error: 'Produto inválido.' }, { status: 400 });
  }

  const supabase = createServiceClient();
// step 2/4
