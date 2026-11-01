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
  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();

  if (existing) {
    await supabase.from('favorites').delete().eq('id', existing.id);
// step 3/4
