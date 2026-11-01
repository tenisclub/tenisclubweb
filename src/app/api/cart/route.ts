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
    const body = await request.json();
    const { productId, variantId, quantity = 1 } = body;

    if (!productId || !variantId || Number(quantity) < 1) {
      return NextResponse.json({ error: 'Selecione a numeração desejada.' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc('add_to_cart_fast', {
      p_user_id: userId,
      p_product_id: productId,
      p_variant_id: variantId,
      p_quantity: Number(quantity),
    });

    if (error) {
      const msg = error.message || 'Não foi possível adicionar ao carrinho.';
      const status = msg.includes('inativa') ? 401 : 400;
      return NextResponse.json({ error: msg }, { status });
    }

    return NextResponse.json(data || { totalItems: 0 });
  } catch (err) {
    return NextResponse.json(
// step 2/6
