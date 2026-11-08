import type { Metadata } from 'next';
import { CartClient } from '@/components/cart/CartClient';
import { getAuthenticatedUserId } from '@/lib/auth';
import { getGuestCartView, getUserCartView } from '@/lib/catalog';
import { readGuestCartId } from '@/lib/guest-cart';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Meu Carrinho',
};

export default async function CarrinhoPage() {
  const [userId, guestId] = await Promise.all([
    getAuthenticatedUserId(),
    readGuestCartId(),
  ]);

  if (userId && guestId) {
    const supabase = createServiceClient();
    await supabase.rpc('merge_guest_cart_into_user', {
      p_guest_id: guestId,
      p_user_id: userId,
    });
  }

  const cart = userId
    ? await getUserCartView(userId)
    : guestId
      ? await getGuestCartView(guestId)
      : { items: [], totalItems: 0, subtotal: 0, total: 0 };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-5 sm:space-y-6">
      <div>
        <span className="text-xs font-extrabold uppercase tracking-widest text-[#BEFA46]">
          Sua Sacola
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-white mt-0.5">
          Carrinho de Compras
        </h1>
      </div>

      <CartClient
        initialItems={cart.items}
        initialTotalItems={cart.totalItems}
        initialSubtotal={cart.subtotal}
        initialTotal={cart.total}
      />
    </div>
  );
}
