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
      { error: err instanceof Error ? err.message : 'Erro ao atualizar carrinho.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  try {
    const { itemId, quantity } = await request.json();
    const supabase = createServiceClient();

    const { data: item } = await supabase
      .from('cart_items')
      .select(
        'id, cart_id, variant_id, carts!inner(user_id), products(allow_backorder), product_variants(size, inventory(quantity))'
      )
      .eq('id', itemId)
      .maybeSingle();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cartOwner = Array.isArray((item as any)?.carts) ? (item as any)?.carts[0]?.user_id : (item as any)?.carts?.user_id;

    if (!item || cartOwner !== userId) {
      return NextResponse.json({ error: 'Item não encontrado.' }, { status: 404 });
    }

    if (Number(quantity) <= 0) {
      await supabase.from('cart_items').delete().eq('id', itemId);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prod: any = Array.isArray((item as any).products)
        ? (item as any).products[0]
        : (item as any).products;
      const allowBackorder = Boolean(prod?.allow_backorder);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pv: any = Array.isArray((item as any).product_variants) ? (item as any).product_variants[0] : (item as any).product_variants;
      const inv = Array.isArray(pv?.inventory) ? pv?.inventory[0] : pv?.inventory;
      const stock = Number(inv?.quantity ?? 0);

      if (!allowBackorder && Number(quantity) > stock) {
        return NextResponse.json(
          { error: `Estoque máximo disponível na numeração ${pv?.size}: ${stock} un.` },
          { status: 400 }
        );
      }

      if (allowBackorder && Number(quantity) > 99) {
        return NextResponse.json(
          { error: 'Limite máximo de 99 unidades por numeração.' },
          { status: 400 }
        );
      }

      await supabase
        .from('cart_items')
        .update({ quantity: Number(quantity), updated_at: new Date().toISOString() })
        .eq('id', itemId);
    }

    const updatedCart = await getUserCartView(userId);
    return NextResponse.json(updatedCart);
  } catch {
    return NextResponse.json({ error: 'Erro ao alterar quantidade.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const userId = await getAuthenticatedUserId();
// step 5/6
