import Link from 'next/link';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { requireAuth } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { cn, formatCurrency, formatDateTime, ORDER_STATUS_CONFIG } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function MeusPedidosPage() {
  const session = await requireAuth('/minha-conta/pedidos');
  const supabase = createServiceClient();

  const { data: ordersRaw } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', session.userId)
    .order('created_at', { ascending: false });

  const orders = (ordersRaw || []).map((o) => ({
    ...o,
    items: o.order_items || [],
  })) as Order[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white">Meus Pedidos</h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Consulte o histórico e acompanhe o status de cada solicitação em tempo real.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-6 sm:p-12 text-center space-y-3">
          <ShoppingBag className="w-10 h-10 text-zinc-600 mx-auto" />
          <p className="text-base font-bold text-white">Você ainda não realizou pedidos</p>
          <p className="text-xs text-zinc-400">
            Escolha sua numeração no catálogo e finalize em poucos segundos.
          </p>
          <Link
            href="/produtos"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#BEFA46] text-[#09090B] text-xs font-black"
