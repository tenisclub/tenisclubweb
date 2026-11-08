import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { CheckoutClient } from '@/components/cart/CheckoutClient';
import { getAuthSession } from '@/lib/auth';
import { getGuestCartView, getStoreSettings, getUserCartView } from '@/lib/catalog';
import { readGuestCartId } from '@/lib/guest-cart';
import { createServiceClient } from '@/lib/supabase/server';
import type { UserAddress } from '@/types/database';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Finalizar Pedido',
};

export default async function CheckoutPage() {
  const [session, guestId, settings] = await Promise.all([
    getAuthSession(),
    readGuestCartId(),
    getStoreSettings(),
  ]);

  if (!session && !guestId) {
    redirect('/carrinho');
  }

  const supabase = createServiceClient();

  if (session && guestId) {
    await supabase.rpc('merge_guest_cart_into_user', {
      p_guest_id: guestId,
      p_user_id: session.userId,
    });
  }

  const [cart, savedAddresses] = await Promise.all([
    session
      ? getUserCartView(session.userId)
      : getGuestCartView(guestId!),
    session
      ? supabase
          .from('user_addresses')
          .select('*')
          .eq('user_id', session.userId)
          .order('is_default', { ascending: false })
          .then(({ data }) => (data || []) as UserAddress[])
      : Promise.resolve([] as UserAddress[]),
  ]);

  const activeItems = cart.items.filter((i) => i.is_available);
  if (activeItems.length === 0) {
    redirect('/carrinho');
  }

  const totalUnits = activeItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#BEFA46]">
            Checkout Rápido
          </span>
          <h1 className="text-xl sm:text-3xl font-black text-white leading-tight">
            Finalizar Pedido
          </h1>
        </div>
        <span className="px-3 py-1.5 rounded-full bg-[#15151C] border border-zinc-800 text-xs font-bold text-zinc-300 shrink-0">
          {totalUnits} {totalUnits === 1 ? 'par' : 'pares'}
        </span>
      </div>

      <CheckoutClient
        items={activeItems}
        total={cart.total}
        subtotal={cart.subtotal}
        profile={session?.profile ?? null}
        savedAddresses={savedAddresses}
        settings={settings}
      />
    </div>
  );
}
