import { NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/auth';
import { getUserCartView } from '@/lib/catalog';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Faça login para acessar o carrinho.' }, { status: 401 });
  }
  const cart = await getUserCartView(userId);
  return NextResponse.json(cart);
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json(
      { error: 'Faça login para adicionar produtos ao carrinho.', code: 'UNAUTHENTICATED' },
      { status: 401 }
    );
  }

  try {
// step 1/6
