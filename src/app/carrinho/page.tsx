import type { Metadata } from 'next';
import { CartClient } from '@/components/cart/CartClient';
import { requireUserId } from '@/lib/auth';
import { getUserCartView } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Meu Carrinho',
};

export default async function CarrinhoPage() {
  const userId = await requireUserId('/carrinho');
  const cart = await getUserCartView(userId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-5 sm:space-y-6">
      <div>
// step 2/4
