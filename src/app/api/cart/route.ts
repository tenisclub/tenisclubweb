import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { getUserCartView } from '@/lib/catalog';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: 'Faça login para acessar o carrinho.' }, { status: 401 });
  }
  const cart = await getUserCartView(session.userId);
  return NextResponse.json(cart);
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json(
      { error: 'Faça login para adicionar produtos ao carrinho.', code: 'UNAUTHENTICATED' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { productId, variantId, quantity = 1 } = body;

    if (!productId || !variantId || quantity < 1) {
      return NextResponse.json({ error: 'Selecione a numeração desejada.' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Validate product, variant and stock
    const { data: variant } = await supabase
      .from('product_variants')
      .select('id, product_id, size, color, is_active, products(name, is_active), inventory(quantity)')
      .eq('id', variantId)
      .eq('product_id', productId)
      .maybeSingle();

    if (!variant) {
      return NextResponse.json({ error: 'Variação do produto não encontrada.' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prod: any = Array.isArray(variant.products) ? variant.products[0] : variant.products;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inv: any = Array.isArray(variant.inventory) ? variant.inventory[0] : variant.inventory;
    const stock = Number(inv?.quantity ?? 0);

    if (!prod?.is_active || !variant.is_active) {
      return NextResponse.json(
        { error: 'Este produto não está disponível no momento.' },
        { status: 400 }
      );
    }

    if (stock <= 0) {
      return NextResponse.json(
        { error: `A numeração ${variant.size} está esgotada.` },
        { status: 400 }
      );
    }

    // Ensure cart exists
    let { data: cart } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', session.userId)
      .maybeSingle();

    if (!cart) {
      const { data: created } = await supabase
        .from('carts')
        .insert({ user_id: session.userId })
        .select('id')
        .single();
      cart = created;
    }

    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cart!.id)
      .eq('variant_id', variantId)
      .maybeSingle();

    const targetQty = (existingItem?.quantity || 0) + Number(quantity);

    if (targetQty > stock) {
      return NextResponse.json(
        {
          error: ` Temos apenas ${stock} unidade(s) disponível(is) na numeração ${variant.size}.`,
        },
        { status: 400 }
      );
    }

    if (existingItem) {
      await supabase
        .from('cart_items')
        .update({ quantity: targetQty, updated_at: new Date().toISOString() })
        .eq('id', existingItem.id);
    } else {
      await supabase.from('cart_items').insert({
        cart_id: cart!.id,
        product_id: productId,
        variant_id: variantId,
        quantity: Number(quantity),
      });
    }

    const updatedCart = await getUserCartView(session.userId);
    return NextResponse.json(updatedCart);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao atualizar carrinho.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  try {
    const { itemId, quantity } = await request.json();
    const supabase = createServiceClient();

    const { data: item } = await supabase
      .from('cart_items')
      .select('id, cart_id, variant_id, carts!inner(user_id), product_variants(size, inventory(quantity))')
      .eq('id', itemId)
      .maybeSingle();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cartOwner = Array.isArray((item as any)?.carts) ? (item as any)?.carts[0]?.user_id : (item as any)?.carts?.user_id;

    if (!item || cartOwner !== session.userId) {
      return NextResponse.json({ error: 'Item não encontrado.' }, { status: 404 });
    }

    if (Number(quantity) <= 0) {
      await supabase.from('cart_items').delete().eq('id', itemId);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pv: any = Array.isArray(item.product_variants) ? item.product_variants[0] : item.product_variants;
      const inv = Array.isArray(pv?.inventory) ? pv?.inventory[0] : pv?.inventory;
      const stock = Number(inv?.quantity ?? 0);

      if (Number(quantity) > stock) {
        return NextResponse.json(
          { error: `Estoque máximo disponível na numeração ${pv?.size}: ${stock} un.` },
          { status: 400 }
        );
      }

      await supabase
        .from('cart_items')
        .update({ quantity: Number(quantity), updated_at: new Date().toISOString() })
        .eq('id', itemId);
    }

    const updatedCart = await getUserCartView(session.userId);
    return NextResponse.json(updatedCart);
  } catch {
    return NextResponse.json({ error: 'Erro ao alterar quantidade.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get('itemId');
  const supabase = createServiceClient();

  if (itemId) {
    const { data: item } = await supabase
      .from('cart_items')
      .select('id, carts!inner(user_id)')
      .eq('id', itemId)
      .maybeSingle();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cartOwner = Array.isArray((item as any)?.carts) ? (item as any)?.carts[0]?.user_id : (item as any)?.carts?.user_id;
    if (item && cartOwner === session.userId) {
      await supabase.from('cart_items').delete().eq('id', itemId);
    }
  }

  const updatedCart = await getUserCartView(session.userId);
  return NextResponse.json(updatedCart);
}
