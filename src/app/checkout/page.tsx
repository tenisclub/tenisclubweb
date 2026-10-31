import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { CheckoutClient } from '@/components/cart/CheckoutClient';
import { requireAuth } from '@/lib/auth';
import { getStoreSettings, getUserCartView } from '@/lib/catalog';
import { createServiceClient } from '@/lib/supabase/server';
import type { UserAddress } from '@/types/database';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Finalizar Pedido',
};

export default async function CheckoutPage() {
  const session = await requireAuth('/checkout');
  const [cart, settings] = await Promise.all([
    getUserCartView(session.userId),
    getStoreSettings(),
  ]);

  const activeItems = cart.items.filter((i) => i.is_available);
  if (activeItems.length === 0) {
    redirect('/carrinho');
  }

  const supabase = createServiceClient();
  const { data: addresses } = await supabase
    .from('user_addresses')
    .select('*')
    .eq('user_id', session.userId)
    .order('is_default', { ascending: false });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <span className="text-xs font-extrabold uppercase tracking-widest text-[#BEFA46]">
          Checkout Simplificado
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-white mt-0.5">
          Finalizar Pedido
        </h1>
      </div>

      <CheckoutClient
        items={activeItems}
        total={cart.total}
        subtotal={cart.subtotal}
        profile={session.profile}
        savedAddresses={(addresses || []) as UserAddress[]}
        settings={settings}
      />
    </div>
  );
}
