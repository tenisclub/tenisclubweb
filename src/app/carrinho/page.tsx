import type { Metadata } from 'next';
import { CartClient } from '@/components/cart/CartClient';
import { requireUserId } from '@/lib/auth';
import { getUserCartView } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Meu Carrinho',
// step 1/4
