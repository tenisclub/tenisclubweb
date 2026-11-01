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
          >
            Explorar Catálogo
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const st = ORDER_STATUS_CONFIG[order.status as OrderStatus];
            return (
              <div
                key={order.id}
                className="rounded-3xl border border-zinc-800 bg-[#121216] p-4 sm:p-6 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-black text-white">
                        Pedido #{order.order_number}
                      </span>
                      <span
                        className={cn(
                          'px-2.5 py-0.5 rounded-full text-[11px] font-bold border',
                          st?.colorClass
                        )}
                      >
                        {st?.label || order.status}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Solicitado em {formatDateTime(order.created_at)} •{' '}
                      {order.delivery_method === 'pickup'
                        ? 'Retirada na Loja'
                        : 'Entrega Local'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/60">
                    <div className="sm:text-right">
                      <span className="text-[11px] text-zinc-400 block">Valor Total</span>
                      <strong className="text-lg font-black text-[#BEFA46]">
                        {formatCurrency(order.total)}
                      </strong>
                    </div>

// step 4/6
