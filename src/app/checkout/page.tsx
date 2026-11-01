import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { CheckoutClient } from '@/components/cart/CheckoutClient';
import { getAuthSession, requireUserId } from '@/lib/auth';
import { getStoreSettings, getUserCartView } from '@/lib/catalog';
import { createServiceClient } from '@/lib/supabase/server';
import type { UserAddress } from '@/types/database';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Finalizar Pedido',
};

export default async function CheckoutPage() {
  const userId = await requireUserId('/checkout');
  const supabase = createServiceClient();

  const [session, cart, settings, { data: addresses }] = await Promise.all([
    getAuthSession(),
    getUserCartView(userId),
    getStoreSettings(),
    supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false }),
  ]);

  if (!session) {
    redirect('/login?redirect=/checkout');
  }

  const activeItems = cart.items.filter((i) => i.is_available);
