import { NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/auth';
import { getGuestCartView, getUserCartView } from '@/lib/catalog';
import {
  attachGuestCartCookies,
  clearGuestCartCookies,
  clearGuestCartFlagCookie,
  readGuestCartId,
} from '@/lib/guest-cart';
import { createServiceClient } from '@/lib/supabase/server';

const EMPTY_CART = { items: [], totalItems: 0, subtotal: 0, total: 0 };

export async function GET() {
  const [userId, guestId] = await Promise.all([
    getAuthenticatedUserId(),
    readGuestCartId(),
  ]);

  if (userId) {
    if (guestId) {
      const supabase = createServiceClient();
      await supabase.rpc('merge_guest_cart_into_user', {
        p_guest_id: guestId,
        p_user_id: userId,
      });
      const cart = await getUserCartView(userId);
      const res = NextResponse.json(cart);
      clearGuestCartCookies(res);
      return res;
    }
    const cart = await getUserCartView(userId);
    return NextResponse.json(cart);
  }

  if (guestId) {
    const cart = await getGuestCartView(guestId);
    const res = NextResponse.json(cart);
    if (cart.totalItems === 0 && cart.items.length === 0) {
      clearGuestCartFlagCookie(res);
    }
    return res;
  }

  return NextResponse.json(EMPTY_CART);
}

export async function POST(request: Request) {
  const [userId, existingGuestId] = await Promise.all([
    getAuthenticatedUserId(),
    readGuestCartId(),
  ]);

  try {
    const body = await request.json();
    const { productId, variantId, quantity = 1 } = body;

    if (!productId || !variantId || Number(quantity) < 1) {
      return NextResponse.json({ error: 'Selecione a numeração desejada.' }, { status: 400 });
    }

    const activeGuestId = userId ? null : existingGuestId || crypto.randomUUID();

    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc('add_to_cart_fast', {
      p_user_id: userId,
      p_product_id: productId,
      p_variant_id: variantId,
      p_quantity: Number(quantity),
      p_guest_id: activeGuestId,
    });

    if (error) {
      const msg = error.message || 'Não foi possível adicionar ao carrinho.';
      const status = msg.includes('inativa') ? 401 : 400;
      return NextResponse.json({ error: msg }, { status });
    }

    const res = NextResponse.json(data || { totalItems: 0 });
    if (!userId && activeGuestId) {
      attachGuestCartCookies(res, activeGuestId);
    }
    return res;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao atualizar carrinho.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const [userId, guestId] = await Promise.all([
    getAuthenticatedUserId(),
    readGuestCartId(),
  ]);

  if (!userId && !guestId) {
    return NextResponse.json(EMPTY_CART);
  }

  try {
    const { itemId, quantity } = await request.json();
    const supabase = createServiceClient();

    const { data: item } = await supabase
      .from('cart_items')
      .select(
        'id, cart_id, variant_id, carts!inner(user_id, guest_id), products(allow_backorder), product_variants(size, inventory(quantity))'
      )
      .eq('id', itemId)
      .maybeSingle();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cartRel = Array.isArray((item as any)?.carts) ? (item as any)?.carts[0] : (item as any)?.carts;
    const ownsItem = userId
      ? cartRel?.user_id === userId
      : Boolean(guestId && cartRel?.guest_id === guestId);

    if (!item || !ownsItem) {
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
      const pv: any = Array.isArray((item as any).product_variants)
        ? (item as any).product_variants[0]
        : (item as any).product_variants;
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

    const updatedCart = userId
      ? await getUserCartView(userId)
      : await getGuestCartView(guestId!);
    const res = NextResponse.json(updatedCart);
    if (!userId && updatedCart.totalItems === 0 && updatedCart.items.length === 0) {
      clearGuestCartFlagCookie(res);
    }
    return res;
  } catch {
    return NextResponse.json({ error: 'Erro ao alterar quantidade.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const [userId, guestId] = await Promise.all([
    getAuthenticatedUserId(),
    readGuestCartId(),
  ]);

  if (!userId && !guestId) {
    return NextResponse.json(EMPTY_CART);
  }

  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get('itemId');
  const supabase = createServiceClient();

  if (itemId) {
    const { data: item } = await supabase
      .from('cart_items')
      .select('id, carts!inner(user_id, guest_id)')
      .eq('id', itemId)
      .maybeSingle();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cartRel = Array.isArray((item as any)?.carts) ? (item as any)?.carts[0] : (item as any)?.carts;
    const ownsItem = userId
      ? cartRel?.user_id === userId
      : Boolean(guestId && cartRel?.guest_id === guestId);

    if (item && ownsItem) {
      await supabase.from('cart_items').delete().eq('id', itemId);
    }
  }

  const updatedCart = userId
    ? await getUserCartView(userId)
    : await getGuestCartView(guestId!);
  const res = NextResponse.json(updatedCart);
  if (!userId && updatedCart.totalItems === 0 && updatedCart.items.length === 0) {
    clearGuestCartFlagCookie(res);
  }
  return res;
}
