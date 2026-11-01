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
// step 1/5
