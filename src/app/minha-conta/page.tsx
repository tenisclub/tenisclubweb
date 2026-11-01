import Link from 'next/link';
import { ShoppingBag, User, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { NotificationsPanel } from '@/components/account/NotificationsPanel';
import { requireAuth } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { cn, formatCurrency, formatDate, ORDER_STATUS_CONFIG } from '@/lib/utils';
import type { NotificationItem, Order, OrderStatus } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function MinhaContaDashboardPage() {
  const session = await requireAuth('/minha-conta');
  const supabase = createServiceClient();

  const [{ data: ordersRaw }, { data: notificationsRaw }] = await Promise.all([
    supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', session.userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('notifications')
      .select('*')
      .eq('target_audience', 'customer')
      .eq('user_id', session.userId)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const orders = (ordersRaw || []) as Order[];
  const activeOrders = orders.filter(
    (o) => !['completed', 'cancelled'].includes(o.status)
  );
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const latestOrder = orders[0] || null;

  return (
    <div className="space-y-6">
      {/* Greeting Banner */}
      <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-5 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#BEFA46]">
            Bem-vindo(a)
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-0.5">
            Olá, {session.profile.full_name?.split(' ')[0] || 'Cliente'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Gerencie seus pedidos, dados pessoais, endereços e calçados favoritos.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/carrinho"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#BEFA46] text-[#09090B] text-xs font-black"
          >
            <ShoppingBag className="w-4 h-4" />
            Meu Carrinho
          </Link>
          <Link
            href="/minha-conta/dados"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1A1A22] border border-zinc-800 text-xs font-bold text-white hover:border-zinc-700"
          >
            <User className="w-4 h-4 text-[#BEFA46]" />
            Editar Cadastro
          </Link>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <div className="rounded-2xl border border-zinc-800 bg-[#121216] p-3.5 sm:p-5">
          <span className="text-[11px] sm:text-xs font-semibold text-zinc-400 block truncate">
            Total Pedidos
          </span>
          <p className="text-2xl sm:text-3xl font-black text-white mt-1">{orders.length}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-[#121216] p-3.5 sm:p-5">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-semibold text-zinc-400 truncate">
              Andamento
            </span>
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#BEFA46] shrink-0" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#BEFA46] mt-1">{activeOrders.length}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-[#121216] p-3.5 sm:p-5">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-semibold text-zinc-400 truncate">
              Concluídos
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white mt-1">{completedOrders.length}</p>
        </div>
      </div>

      {/* Latest Order Highlight */}
      <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base sm:text-lg font-black text-white">
            Último Pedido Realizado
          </h2>
          <Link
            href="/minha-conta/pedidos"
            className="text-xs font-bold text-[#BEFA46] hover:underline inline-flex items-center gap-1 shrink-0"
          >
            Ver todos <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {!latestOrder ? (
          <div className="rounded-2xl border border-zinc-800/80 bg-[#17171E] p-6 text-center space-y-3">
            <p className="text-sm text-zinc-300 font-semibold">
              Você ainda não realizou nenhum pedido.
            </p>
// step 4/6
